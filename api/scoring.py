"""
scoring.py — Integrity score computation for SAKSHI.

Score = 100 minus a weighted sum of penalty components, clamped to [0, 100].
Every component and its contribution are reported separately so a regulator
can see exactly why a college got the score it did.

No ML, no hidden weights. The formula is published here in full.
"""

import json
import logging
from datetime import datetime, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from models import Enrolment, Flag, IntakeApproval, IntegrityScore, Program

logger = logging.getLogger("sakshi.scoring")

# Component weights — must sum to 100 for the score to be interpretable.
# These are policy choices, not ML outputs. Adjust via config in production.
WEIGHTS = {
    "overrun_penalty": 35,    # Exceeding approved intake is the most serious signal
    "duplicate_rate": 40,     # Cross/same-institution duplicates go here
    "burst_penalty": 15,      # Suspicious upload timing
    "open_flags_penalty": 10, # Unresolved flags from any rule
}
assert sum(WEIGHTS.values()) == 100, "Weights must sum to 100"


def _overrun_component(db: Session, institution_id: int, program_id: int, cohort_year: int) -> float:
    """
    Returns a penalty in [0, 1] proportional to how far the reported
    enrolment exceeds the approved intake.

    0 = at or below intake
    1 = 100%+ over intake (maximum penalty)
    """
    approval = (
        db.query(IntakeApproval)
        .filter(
            IntakeApproval.program_id == program_id,
            IntakeApproval.academic_year == cohort_year,
        )
        .first()
    )
    if not approval or approval.approved_intake == 0:
        return 0.0  # no approved intake on record — can't penalise

    reported = (
        db.query(func.count(Enrolment.id))
        .filter(
            Enrolment.institution_id == institution_id,
            Enrolment.program_id == program_id,
            Enrolment.cohort_year == cohort_year,
            Enrolment.status != "revoked",
        )
        .scalar()
    )

    if reported <= approval.approved_intake:
        return 0.0

    overrun_ratio = (reported - approval.approved_intake) / approval.approved_intake
    return min(1.0, overrun_ratio)  # cap at 1.0 (penalty can't exceed its weight)


def _duplicate_component(db: Session, institution_id: int, program_id: int, cohort_year: int) -> float:
    """
    Returns a penalty in [0, 1] based on the number of R1/R2 flags
    linked to this institution-programme, normalised per 100 seats.
    """
    total_seats = (
        db.query(func.count(Enrolment.id))
        .filter(
            Enrolment.institution_id == institution_id,
            Enrolment.program_id == program_id,
            Enrolment.cohort_year == cohort_year,
        )
        .scalar()
    )
    if not total_seats:
        return 0.0

    # Count open duplicate flags for this institution
    dup_flags = (
        db.query(func.count(Flag.id))
        .filter(
            Flag.rule_id.in_(["R1", "R2"]),
            Flag.state.in_(["open", "under_review"]),
            Flag.institution_ids_json.contains(str(institution_id)),
        )
        .scalar()
    )

    # Normalise: 1 flag per 100 seats = full penalty
    rate = dup_flags / max(total_seats / 100, 1)
    return min(1.0, rate)


def _burst_component(db: Session, institution_id: int, cohort_year: int) -> float:
    """
    Returns a penalty in [0, 1] if an R4 (burst) flag exists.
    For simplicity in scoring: flag present = 0.5 penalty, none = 0.
    """
    has_burst = (
        db.query(Flag.id)
        .filter(
            Flag.rule_id == "R4",
            Flag.state.in_(["open", "under_review"]),
            Flag.institution_ids_json.contains(str(institution_id)),
        )
        .first()
    )
    return 0.5 if has_burst else 0.0


def _open_flags_component(db: Session, institution_id: int) -> float:
    """
    Small penalty for any open flags, encouraging institutions to resolve them.
    """
    open_count = (
        db.query(func.count(Flag.id))
        .filter(
            Flag.state == "open",
            Flag.institution_ids_json.contains(str(institution_id)),
        )
        .scalar()
    )
    # 5+ open flags = full penalty; fewer = proportional
    return min(1.0, open_count / 5)


def compute_integrity_score(
    institution_id: int,
    program_id: int,
    cohort_year: int,
    db: Session,
) -> dict:
    """
    Compute and persist the integrity score for one institution-programme-year.

    Returns a dict with: score, components (breakdown), explanation.
    """
    # Gather coverage stats (not penalised — just reported)
    total = (
        db.query(func.count(Enrolment.id))
        .filter(
            Enrolment.institution_id == institution_id,
            Enrolment.program_id == program_id,
            Enrolment.cohort_year == cohort_year,
        )
        .scalar()
    )
    verified = (
        db.query(func.count(Enrolment.id))
        .filter(
            Enrolment.institution_id == institution_id,
            Enrolment.program_id == program_id,
            Enrolment.cohort_year == cohort_year,
            Enrolment.assurance_tier == "verified",
        )
        .scalar()
    )
    coverage = round(verified / total, 4) if total else 0.0

    # Compute penalty components
    overrun = _overrun_component(db, institution_id, program_id, cohort_year)
    dupl = _duplicate_component(db, institution_id, program_id, cohort_year)
    burst = _burst_component(db, institution_id, cohort_year)
    flags_pen = _open_flags_component(db, institution_id)

    # Score = 100 - sum(weight * penalty)
    penalty_total = (
        WEIGHTS["overrun_penalty"] * overrun
        + WEIGHTS["duplicate_rate"] * dupl
        + WEIGHTS["burst_penalty"] * burst
        + WEIGHTS["open_flags_penalty"] * flags_pen
    )
    score = round(max(0.0, min(100.0, 100.0 - penalty_total)), 1)

    components = {
        "overrun_penalty": round(overrun, 4),
        "duplicate_rate": round(dupl, 4),
        "burst_penalty": round(burst, 4),
        "open_flags_penalty": round(flags_pen, 4),
        "coverage_pct": round(coverage * 100, 1),  # informational only
        "weights_used": WEIGHTS,
    }

    # Build a natural-language summary — deterministic template, no LLM
    lines = [f"Integrity score for this programme-year: {score}/100."]
    if overrun > 0:
        lines.append(f"Overrun penalty: seats reported exceed approved intake ({round(overrun*100,1)}% over limit).")
    if dupl > 0:
        lines.append(f"Duplicate penalty: open cross/same-institution duplicate flags reduce the score.")
    if burst > 0.3:
        lines.append(f"Burst penalty: an unusually large single-batch upload was flagged.")
    if flags_pen > 0:
        lines.append(f"Open-flag penalty: {round(flags_pen * 5)} or more unresolved flags remain open.")
    if overrun == 0 and dupl == 0 and burst == 0 and flags_pen == 0:
        lines.append("No anomalies detected in the data for this programme-year.")
    lines.append(f"APAAR-verified coverage: {round(coverage * 100, 1)}% (reported for transparency; not penalised).")

    explanation = " ".join(lines)

    prog = db.get(Program, program_id)

    # Upsert the score record
    existing = (
        db.query(IntegrityScore)
        .filter(
            IntegrityScore.institution_id == institution_id,
            IntegrityScore.program_id == program_id,
            IntegrityScore.academic_year == cohort_year,
        )
        .first()
    )
    if existing:
        existing.score = score
        existing.components_json = json.dumps(components)
        existing.explanation = explanation
        existing.computed_at = datetime.now(timezone.utc)
    else:
        db.add(IntegrityScore(
            institution_id=institution_id,
            program_id=program_id,
            academic_year=cohort_year,
            score=score,
            components_json=json.dumps(components),
            explanation=explanation,
            rule_version="1.0",
        ))
    db.commit()

    return {
        "institution_id": institution_id,
        "program_id": program_id,
        "program_name": prog.course if prog else None,
        "cohort_year": cohort_year,
        "score": score,
        "components": components,
        "explanation": explanation,
    }
