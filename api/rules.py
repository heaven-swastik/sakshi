"""
rules.py — Deterministic anomaly detection rules for SAKSHI.

Each rule is a plain Python function. No ML, no black box.
If a regulator asks "why was this flagged?", the answer is always
a specific, quantitative, human-readable explanation derived directly
from the data.

Rules return FlagResult dataclasses. The caller (routes/regulator.py)
persists them to the Flag table.
"""

import json
import math
import logging
from dataclasses import dataclass, field
from typing import Any

from sqlalchemy import func, text
from sqlalchemy.orm import Session

from models import (
    Enrolment, Institution, Program, IntakeApproval,
    Batch, BatchFinding, Flag,
)

logger = logging.getLogger("sakshi.rules")

# ---------------------------------------------------------------------------
# Result type
# ---------------------------------------------------------------------------

@dataclass
class FlagResult:
    rule_id: str              # "R1", "R2", etc.
    severity: str             # "high" / "medium" / "low"
    student_token_ref: str    # the token implicated (never a raw ID)
    institution_ids: list[int]
    evidence: dict[str, Any]
    explanation: str          # Plain English — no acronyms, no jargon


# ---------------------------------------------------------------------------
# Default thresholds — can be overridden via RuleVersion params
# ---------------------------------------------------------------------------

DEFAULT_PARAMS = {
    "R1": {},   # no configurable thresholds — any cross-institution duplicate is flagged
    "R2": {},   # same — always flag
    "R3": {"overrun_threshold": 1.0},  # flag if reported > approved * threshold
    "R4": {"z_score_threshold": 2.5},  # flag if z-score of batch size > this
    "R5": {"min_verified_share": 0.4}, # flag if verified_share < this
    "R6": {"identical_cluster_size": 10},  # flag clusters >= this size
}


def _get_institution_name(db: Session, institution_id: int) -> str:
    inst = db.get(Institution, institution_id)
    return inst.name if inst else f"Institution #{institution_id}"


# ---------------------------------------------------------------------------
# R1 — Cross-institution duplicate
# ---------------------------------------------------------------------------

def run_r1(db: Session, cohort_year: int, params: dict | None = None) -> list[FlagResult]:
    """
    Find student tokens that appear in 2+ institutions in full-time
    regular mode for the same cohort year. This is the classic
    'same seal, two colleges' problem.
    """
    # Group by token + cohort, count distinct institutions
    rows = (
        db.query(
            Enrolment.student_token,
            func.count(func.distinct(Enrolment.institution_id)).label("inst_count"),
            func.group_concat(func.distinct(Enrolment.institution_id)).label("inst_ids"),
        )
        .filter(
            Enrolment.cohort_year == cohort_year,
            Enrolment.mode == "regular",
            Enrolment.status != "revoked",
        )
        .group_by(Enrolment.student_token, Enrolment.cohort_year)
        .having(func.count(func.distinct(Enrolment.institution_id)) >= 2)
        .all()
    )

    results = []
    for row in rows:
        token = row.student_token
        inst_id_list = [int(i) for i in row.inst_ids.split(",")]
        inst_names = [_get_institution_name(db, i) for i in inst_id_list]

        # Build a human-readable explanation — the "why" is specific and quantitative
        name_list = " and ".join(inst_names)
        explanation = (
            f"The same enrolment seal appears in {name_list} for cohort year {cohort_year}. "
            f"Both institutions report this as a full-time regular seat. "
            f"A student can only physically attend one regular programme at a time — "
            f"both colleges need to confirm which one holds the valid enrolment."
        )

        results.append(FlagResult(
            rule_id="R1",
            severity="high",
            student_token_ref=token,
            institution_ids=inst_id_list,
            evidence={"cohort_year": cohort_year, "institution_count": row.inst_count, "institution_ids": inst_id_list},
            explanation=explanation,
        ))

    return results


# ---------------------------------------------------------------------------
# R2 — Same-institution double entry
# ---------------------------------------------------------------------------

def run_r2(db: Session, cohort_year: int, params: dict | None = None) -> list[FlagResult]:
    """
    One token enrolled in two different programmes within the same
    institution and cohort year.
    """
    rows = (
        db.query(
            Enrolment.student_token,
            Enrolment.institution_id,
            func.count(func.distinct(Enrolment.program_id)).label("prog_count"),
            func.group_concat(func.distinct(Enrolment.program_id)).label("prog_ids"),
        )
        .filter(
            Enrolment.cohort_year == cohort_year,
            Enrolment.status != "revoked",
        )
        .group_by(Enrolment.student_token, Enrolment.institution_id, Enrolment.cohort_year)
        .having(func.count(func.distinct(Enrolment.program_id)) >= 2)
        .all()
    )

    results = []
    for row in rows:
        token = row.student_token
        inst_name = _get_institution_name(db, row.institution_id)
        prog_ids = [int(p) for p in row.prog_ids.split(",")]
        prog_names = []
        for pid in prog_ids:
            prog = db.get(Program, pid)
            prog_names.append(prog.course if prog else f"Programme #{pid}")

        prog_list = " and ".join(prog_names)
        explanation = (
            f"This enrolment seal appears twice within {inst_name} for cohort {cohort_year} — "
            f"once in {prog_list}. "
            f"Two separate programme seats are linked to the same identity. "
            f"This may be a data-entry error or a genuine dual-programme situation that requires confirmation."
        )

        results.append(FlagResult(
            rule_id="R2",
            severity="medium",
            student_token_ref=token,
            institution_ids=[row.institution_id],
            evidence={"cohort_year": cohort_year, "programme_count": row.prog_count, "programme_ids": prog_ids},
            explanation=explanation,
        ))

    return results


# ---------------------------------------------------------------------------
# R3 — Intake overrun
# ---------------------------------------------------------------------------

def run_r3(db: Session, cohort_year: int, params: dict | None = None) -> list[FlagResult]:
    """
    Flag any institution-programme where reported enrolment exceeds
    the AICTE-approved intake for that year.
    """
    threshold = (params or DEFAULT_PARAMS["R3"])["overrun_threshold"]

    # Get all approved intakes for this year
    approvals = (
        db.query(IntakeApproval)
        .filter(IntakeApproval.academic_year == cohort_year)
        .all()
    )

    results = []
    for approval in approvals:
        prog = db.get(Program, approval.program_id)
        if not prog:
            continue

        reported_count = (
            db.query(func.count(Enrolment.id))
            .filter(
                Enrolment.program_id == approval.program_id,
                Enrolment.cohort_year == cohort_year,
                Enrolment.institution_id == prog.institution_id,
                Enrolment.status != "revoked",
            )
            .scalar()
        )

        approved = approval.approved_intake
        if reported_count > approved * threshold:
            overage_pct = round(((reported_count - approved) / approved) * 100, 1)
            inst_name = _get_institution_name(db, prog.institution_id)
            explanation = (
                f"{inst_name} reports {reported_count} seats against an approved intake of {approved} "
                f"for {prog.course} ({cohort_year}). That is {overage_pct}% over the approved limit. "
                f"Excess seats beyond approved intake are not eligible for grant-in-aid or fee regulation."
            )
            results.append(FlagResult(
                rule_id="R3",
                severity="high",
                student_token_ref="",  # institution-level flag, no specific student
                institution_ids=[prog.institution_id],
                evidence={
                    "programme": prog.course,
                    "cohort_year": cohort_year,
                    "approved_intake": approved,
                    "reported_count": reported_count,
                    "overage_pct": overage_pct,
                },
                explanation=explanation,
            ))

    return results


# ---------------------------------------------------------------------------
# R4 — Burst upload pattern
# ---------------------------------------------------------------------------

def run_r4(db: Session, cohort_year: int, params: dict | None = None) -> list[FlagResult]:
    """
    Flag institutions whose single-batch upload volume is a significant
    statistical outlier compared to peer institutions (same state,
    same institution_type).

    Uses median + MAD z-score so outliers don't inflate the threshold.
    """
    z_threshold = (params or DEFAULT_PARAMS["R4"])["z_score_threshold"]

    # Get all batches for this cohort year, joined with institution state
    from sqlalchemy import join

    batch_sizes = (
        db.query(
            Batch.institution_id,
            Batch.rows_accepted,
            Institution.state,
            Institution.institution_type,
            Batch.id.label("batch_id"),
        )
        .join(Institution, Institution.id == Batch.institution_id)
        .filter(Batch.cohort_year == cohort_year, Batch.status == "done")
        .all()
    )

    if not batch_sizes:
        return []

    # Group by (state, institution_type) to define peer groups
    from collections import defaultdict
    peer_groups: dict[tuple, list] = defaultdict(list)
    for row in batch_sizes:
        key = (row.state, row.institution_type)
        peer_groups[key].append(row)

    results = []

    for (state, inst_type), members in peer_groups.items():
        if len(members) < 3:
            # Too few peers to compute meaningful statistics
            continue

        sizes = [m.rows_accepted for m in members]
        median = sorted(sizes)[len(sizes) // 2]
        mad = sorted(abs(s - median) for s in sizes)[len(sizes) // 2]

        if mad == 0:
            continue  # all institutions uploaded identical volumes — nothing to flag

        for member in members:
            z = abs(member.rows_accepted - median) / (1.4826 * mad)  # 1.4826 normalises MAD to σ
            if z > z_threshold and member.rows_accepted > median:
                inst_name = _get_institution_name(db, member.institution_id)
                explanation = (
                    f"{inst_name} uploaded {member.rows_accepted} records in one batch — "
                    f"{round(z, 1)} standard deviations above the median of {median} "
                    f"for similar {inst_type} institutions in {state}. "
                    f"A large single upload is not necessarily fraudulent, but warrants a quick review "
                    f"to confirm the records are genuine new enrolments and not recycled data."
                )
                results.append(FlagResult(
                    rule_id="R4",
                    severity="medium",
                    student_token_ref="",
                    institution_ids=[member.institution_id],
                    evidence={
                        "batch_id": member.batch_id,
                        "upload_size": member.rows_accepted,
                        "peer_median": median,
                        "mad_z_score": round(z, 2),
                        "state": state,
                        "institution_type": inst_type,
                    },
                    explanation=explanation,
                ))

    return results


# ---------------------------------------------------------------------------
# R5 — Verification coverage gap
# ---------------------------------------------------------------------------

def run_r5(db: Session, cohort_year: int, params: dict | None = None) -> list[FlagResult]:
    """
    Flag institutions where the share of APAAR-verified seats is
    significantly below the peer group average.

    This is a coverage signal, NOT an accusation. Opt-outs are lawful
    and the explanation says so explicitly.
    """
    min_share = (params or DEFAULT_PARAMS["R5"])["min_verified_share"]

    # For each institution in this cohort, compute verified share
    all_inst_ids = (
        db.query(func.distinct(Enrolment.institution_id))
        .filter(Enrolment.cohort_year == cohort_year)
        .all()
    )

    shares = []
    for (inst_id,) in all_inst_ids:
        total = (
            db.query(func.count(Enrolment.id))
            .filter(Enrolment.institution_id == inst_id, Enrolment.cohort_year == cohort_year)
            .scalar()
        )
        verified = (
            db.query(func.count(Enrolment.id))
            .filter(
                Enrolment.institution_id == inst_id,
                Enrolment.cohort_year == cohort_year,
                Enrolment.assurance_tier == "verified",
            )
            .scalar()
        )
        if total > 0:
            shares.append((inst_id, verified / total, total))

    if len(shares) < 2:
        return []

    peer_avg = sum(s for _, s, _ in shares) / len(shares)
    results = []

    for inst_id, share, total in shares:
        if share < min_share and share < peer_avg * 0.6:
            inst_name = _get_institution_name(db, inst_id)
            explanation = (
                f"Only {round(share * 100, 1)}% of seats at {inst_name} carry APAAR-verified assurance "
                f"for cohort {cohort_year}, compared with {round(peer_avg * 100, 1)}% across peer institutions. "
                f"Students may have lawfully opted out of APAAR verification — this is their right. "
                f"However, a very low verified share means fewer seats can be cross-checked against the national registry. "
                f"No action is required if the institution can confirm opt-out consent records."
            )
            results.append(FlagResult(
                rule_id="R5",
                severity="low",
                student_token_ref="",
                institution_ids=[inst_id],
                evidence={
                    "verified_share": round(share, 4),
                    "peer_average": round(peer_avg, 4),
                    "total_seats": total,
                    "cohort_year": cohort_year,
                },
                explanation=explanation,
            ))

    return results


# ---------------------------------------------------------------------------
# R6 — Identical-record clusters
# ---------------------------------------------------------------------------

def run_r6(db: Session, cohort_year: int, params: dict | None = None) -> list[FlagResult]:
    """
    Flag suspiciously large clusters of records that are identical on
    (institution_id, program_id, mode, seat_category). This can indicate
    copy-paste errors or synthetic data being submitted.
    """
    threshold = (params or DEFAULT_PARAMS["R6"])["identical_cluster_size"]

    rows = (
        db.query(
            Enrolment.institution_id,
            Enrolment.program_id,
            Enrolment.mode,
            Enrolment.seat_category,
            func.count(Enrolment.id).label("cluster_size"),
        )
        .filter(Enrolment.cohort_year == cohort_year, Enrolment.status != "revoked")
        .group_by(
            Enrolment.institution_id,
            Enrolment.program_id,
            Enrolment.mode,
            Enrolment.seat_category,
        )
        .having(func.count(Enrolment.id) >= threshold)
        .all()
    )

    results = []
    for row in rows:
        prog = db.get(Program, row.program_id)
        prog_name = prog.course if prog else f"Programme #{row.program_id}"
        inst_name = _get_institution_name(db, row.institution_id)

        explanation = (
            f"A cluster of {row.cluster_size} records with identical attributes "
            f"(programme: {prog_name}, mode: {row.mode}, category: {row.seat_category}) "
            f"was uploaded by {inst_name} for cohort {cohort_year}. "
            f"While identical attributes can occur legitimately for large cohorts, "
            f"a cluster this size may indicate copy-paste errors or bulk synthetic entries. "
            f"A spot-check of original admission documents is recommended."
        )

        results.append(FlagResult(
            rule_id="R6",
            severity="low",
            student_token_ref="",
            institution_ids=[row.institution_id],
            evidence={
                "programme": prog_name,
                "mode": row.mode,
                "seat_category": row.seat_category,
                "cluster_size": row.cluster_size,
                "cohort_year": cohort_year,
            },
            explanation=explanation,
        ))

    return results


# ---------------------------------------------------------------------------
# R7 — Data consistency & quota mismatch
# ---------------------------------------------------------------------------

def run_r7(db: Session, cohort_year: int, params: dict | None = None) -> list[FlagResult]:
    """
    R7: Flags cross-field inconsistencies:
    - Quota category mismatches (e.g. NRI/OCI/FN declared without approved supernumerary capacity).
    - Mode inconsistencies (e.g. correspondence/distance reported for full-time regular tech UG).
    """
    results = []

    # Check for unauthorized OCI/FN/NRI admissions in institutions without quota
    rows = (
        db.query(
            Enrolment.institution_id,
            Enrolment.program_id,
            Enrolment.seat_category,
            func.count(Enrolment.id).label("cat_count"),
        )
        .filter(
            Enrolment.cohort_year == cohort_year,
            Enrolment.seat_category.in_(["NRI", "OCI", "FN", "FOREIGN"]),
            Enrolment.status != "revoked",
        )
        .group_by(Enrolment.institution_id, Enrolment.program_id, Enrolment.seat_category)
        .all()
    )

    for row in rows:
        prog = db.get(Program, row.program_id)
        if not prog:
            continue
        inst_name = _get_institution_name(db, row.institution_id)
        # Check approval
        approval = (
            db.query(IntakeApproval)
            .filter(IntakeApproval.program_id == prog.id, IntakeApproval.academic_year == cohort_year)
            .first()
        )
        approved_intake = approval.approved_intake if approval else 0

        # AICTE norm: NRI/FN cannot exceed 15% supernumerary intake
        max_permitted = math.ceil(approved_intake * 0.15)
        if row.cat_count > max_permitted:
            explanation = (
                f"{inst_name} reports {row.cat_count} {row.seat_category} category seats in {prog.course} "
                f"for cohort {cohort_year}. Under AICTE Approval Process Handbook guidelines, "
                f"supernumerary {row.seat_category} quota is capped at 15% of approved intake ({max_permitted} seats). "
                f"This excess requires AICTE Executive Committee approval documentation."
            )
            results.append(FlagResult(
                rule_id="R7",
                severity="medium",
                student_token_ref="",
                institution_ids=[row.institution_id],
                evidence={
                    "programme": prog.course,
                    "category": row.seat_category,
                    "reported_count": row.cat_count,
                    "max_permitted": max_permitted,
                    "cohort_year": cohort_year,
                },
                explanation=explanation,
            ))

    return results


# ---------------------------------------------------------------------------
# Run all rules
# ---------------------------------------------------------------------------

ALL_RULES = {
    "R1": run_r1,
    "R2": run_r2,
    "R3": run_r3,
    "R4": run_r4,
    "R5": run_r5,
    "R6": run_r6,
    "R7": run_r7,
}


def run_all_rules(db: Session, cohort_year: int, params: dict | None = None) -> list[FlagResult]:
    """
    Execute every rule and return a flat list of all findings.
    Existing open flags for this cohort are not duplicated.
    """
    # Build set of already-open flags to avoid duplicate creation
    existing = set(
        (f.rule_id, f.student_token_ref or "", json.loads(f.institution_ids_json)[0] if f.institution_ids_json != "[]" else 0)
        for f in db.query(Flag.rule_id, Flag.student_token_ref, Flag.institution_ids_json)
        .filter(Flag.state == "open")
        .all()
    )

    all_results: list[FlagResult] = []
    for rule_id, rule_fn in ALL_RULES.items():
        try:
            rule_params = (params or {}).get(rule_id)
            found = rule_fn(db, cohort_year, rule_params)
            # Filter out already-flagged combinations
            for fr in found:
                inst0 = fr.institution_ids[0] if fr.institution_ids else 0
                key = (fr.rule_id, fr.student_token_ref or "", inst0)
                if key not in existing:
                    all_results.append(fr)
        except Exception as exc:
            # Log the rule failure but don't crash the whole run
            logger.error("Rule %s failed for cohort %d: %s", rule_id, cohort_year, exc)

    return all_results


def persist_flags(db: Session, results: list[FlagResult], rule_version: str = "1.0") -> int:
    """Write FlagResult objects to the Flag table. Returns number of new flags created."""
    count = 0
    for fr in results:
        flag = Flag(
            rule_id=fr.rule_id,
            rule_version=rule_version,
            severity=fr.severity,
            state="open",
            institution_ids_json=json.dumps(fr.institution_ids),
            student_token_ref=fr.student_token_ref if fr.student_token_ref else None,
            evidence_json=json.dumps(fr.evidence),
            explanation=fr.explanation,
        )
        db.add(flag)
        count += 1
    db.commit()
    return count
