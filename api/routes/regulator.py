"""
routes/regulator.py — Overview, institution listing, flags, and rule execution.

All responses aggregate data at institution level. Student-level data
is represented only by tokens — never names or raw IDs.
"""

import json

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from auth import require_roles
from db import get_db
from models import (
    Case, Enrolment, Flag, Institution, IntegrityScore, Program,
)
from rules import run_all_rules, persist_flags
from scoring import compute_integrity_score
from audit_log import append_audit

router = APIRouter(tags=["regulator"])


@router.get("/v1/regulator/overview")
def national_overview(
    year: int = Query(..., description="Cohort/academic year"),
    user: dict = Depends(require_roles("officer", "supervisor", "auditor")),
    db: Session = Depends(get_db),
):
    """National roll-up: total institutions, seats, coverage, open flags and cases."""
    total_institutions = db.query(func.count(func.distinct(Enrolment.institution_id))).filter(
        Enrolment.cohort_year == year
    ).scalar()

    total_seats = db.query(func.count(Enrolment.id)).filter(
        Enrolment.cohort_year == year
    ).scalar()

    verified_seats = db.query(func.count(Enrolment.id)).filter(
        Enrolment.cohort_year == year,
        Enrolment.assurance_tier == "verified",
    ).scalar()

    open_flags = db.query(func.count(Flag.id)).filter(Flag.state == "open").scalar()
    open_cases = db.query(func.count(Case.id)).filter(Case.status == "open").scalar()

    coverage_pct = round(verified_seats / total_seats * 100, 1) if total_seats else 0.0

    return {
        "year": year,
        "total_institutions": total_institutions,
        "total_seats": total_seats,
        "verified_seats": verified_seats,
        "coverage_pct": coverage_pct,
        "open_flags": open_flags,
        "open_cases": open_cases,
    }


@router.get("/v1/regulator/institutions")
def list_institutions(
    year: int = Query(..., description="Cohort year to filter by"),
    state: str | None = Query(None, description="Filter by state name"),
    user: dict = Depends(require_roles("officer", "supervisor")),
    db: Session = Depends(get_db),
):
    """List institutions with their integrity score and open flag count for a given year."""
    query = db.query(Institution)
    if state:
        query = query.filter(Institution.state == state)
    institutions = query.all()

    result = []
    for inst in institutions:
        # Find the best score for this institution in the given year
        best_score = (
            db.query(func.min(IntegrityScore.score))
            .filter(
                IntegrityScore.institution_id == inst.id,
                IntegrityScore.academic_year == year,
            )
            .scalar()
        )

        flag_count = (
            db.query(func.count(Flag.id))
            .filter(
                Flag.state == "open",
                Flag.institution_ids_json.contains(str(inst.id)),
            )
            .scalar()
        )

        seat_count = (
            db.query(func.count(Enrolment.id))
            .filter(
                Enrolment.institution_id == inst.id,
                Enrolment.cohort_year == year,
            )
            .scalar()
        )

        result.append({
            "institution_id": inst.id,
            "name": inst.name,
            "state": inst.state,
            "institution_type": inst.institution_type,
            "seat_count": seat_count,
            "integrity_score": best_score,
            "open_flags": flag_count,
        })

    # Sort by integrity score ascending (most concerning first)
    result.sort(key=lambda x: (x["integrity_score"] or 101))
    return {"year": year, "institutions": result}


@router.get("/v1/institutions/{id}/integrity")
def institution_integrity(
    id: int,
    year: int = Query(..., description="Academic year"),
    user: dict = Depends(require_roles("officer", "supervisor")),
    db: Session = Depends(get_db),
):
    """Detailed integrity score breakdown for one institution in a given year."""
    inst = db.get(Institution, id)
    if not inst:
        raise HTTPException(404, f"Institution {id} not found")

    scores = (
        db.query(IntegrityScore)
        .filter(
            IntegrityScore.institution_id == id,
            IntegrityScore.academic_year == year,
        )
        .all()
    )

    if not scores:
        # Compute on demand if not yet stored
        programs = (
            db.query(Program)
            .filter(Program.institution_id == id)
            .all()
        )
        scores_data = []
        for prog in programs:
            s = compute_integrity_score(id, prog.id, year, db)
            scores_data.append(s)
        return {"institution_id": id, "name": inst.name, "year": year, "programme_scores": scores_data}

    return {
        "institution_id": id,
        "name": inst.name,
        "year": year,
        "programme_scores": [
            {
                "program_id": s.program_id,
                "score": s.score,
                "components": json.loads(s.components_json),
                "explanation": s.explanation,
                "computed_at": s.computed_at.isoformat(),
            }
            for s in scores
        ],
    }


@router.get("/v1/flags")
def flag_queue(
    status: str | None = Query(None, description="Filter by state: open, under_review, resolved, dismissed"),
    severity: str | None = Query(None, description="high, medium, low"),
    rule: str | None = Query(None, description="Rule ID, e.g. R1, R2"),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    user: dict = Depends(require_roles("officer", "supervisor")),
    db: Session = Depends(get_db),
):
    """Flag review queue. Supports filtering by state, severity, and rule."""
    query = db.query(Flag)
    if status:
        query = query.filter(Flag.state == status)
    if severity:
        query = query.filter(Flag.severity == severity)
    if rule:
        query = query.filter(Flag.rule_id == rule)

    total = query.count()
    flags = query.order_by(Flag.created_at.desc()).offset(offset).limit(limit).all()

    return {
        "total": total,
        "offset": offset,
        "flags": [
            {
                "id": f.id,
                "rule_id": f.rule_id,
                "severity": f.severity,
                "state": f.state,
                "institution_ids": json.loads(f.institution_ids_json),
                "student_token_ref": f.student_token_ref,
                "explanation": f.explanation,
                "evidence": json.loads(f.evidence_json),
                "created_at": f.created_at.isoformat(),
            }
            for f in flags
        ],
    }


@router.post("/v1/flags/{flag_id}/case")
def open_case(
    flag_id: int,
    user: dict = Depends(require_roles("officer", "supervisor")),
    db: Session = Depends(get_db),
):
    """Open an investigation case from a flag."""
    flag = db.get(Flag, flag_id)
    if not flag:
        raise HTTPException(404, f"Flag {flag_id} not found")

    if flag.cases:
        return {"message": "Case already exists", "case_id": flag.cases[0].id}

    from models import Case as CaseModel
    case = CaseModel(
        flag_id=flag_id,
        assignee=user["sub"],
        status="open",
        notes_json="[]",
    )
    db.add(case)
    flag.state = "under_review"
    db.commit()
    db.refresh(case)

    append_audit(
        db=db,
        actor_id=user["sub"],
        actor_role=user["role"],
        action="case_opened",
        object_type="flag",
        object_id=str(flag_id),
        payload={"case_id": case.id, "flag_rule": flag.rule_id},
    )

    return {"case_id": case.id, "flag_id": flag_id, "status": "open"}


@router.get("/v1/regulator/radar")
def duplicate_radar(
    year: int = Query(..., description="Cohort year"),
    user: dict = Depends(require_roles("officer", "supervisor")),
    db: Session = Depends(get_db),
):
    """
    List all cross-institution duplicate flags for a given year.
    Returns by token (no names), with institution IDs and explanation.
    """
    r1_flags = (
        db.query(Flag)
        .filter(Flag.rule_id == "R1", Flag.state.in_(["open", "under_review"]))
        .all()
    )

    return {
        "year": year,
        "cross_institution_duplicates": [
            {
                "flag_id": f.id,
                "student_token_ref": f.student_token_ref,
                "institution_ids": json.loads(f.institution_ids_json),
                "explanation": f.explanation,
                "evidence": json.loads(f.evidence_json),
                "severity": f.severity,
                "state": f.state,
            }
            for f in r1_flags
        ],
    }


@router.post("/v1/system/run-rules")
def run_rules(
    year: int = Query(..., description="Cohort year to evaluate"),
    user: dict = Depends(require_roles("officer", "supervisor")),
    db: Session = Depends(get_db),
):
    """
    Trigger rule evaluation across all enrolments for the given year.
    New flags are persisted; duplicates are skipped.
    """
    from scoring import compute_integrity_score

    results = run_all_rules(db=db, cohort_year=year)
    new_flags = persist_flags(db=db, results=results)

    # Recompute integrity scores for all affected institutions
    affected_inst_ids = set()
    for r in results:
        affected_inst_ids.update(r.institution_ids)

    scores_updated = 0
    for inst_id in affected_inst_ids:
        progs = db.query(Program).filter(Program.institution_id == inst_id).all()
        for prog in progs:
            try:
                compute_integrity_score(inst_id, prog.id, year, db)
                scores_updated += 1
            except Exception:
                pass  # don't crash the whole run if one score fails

    append_audit(
        db=db,
        actor_id=user["sub"],
        actor_role=user["role"],
        action="rules_executed",
        object_type="system",
        object_id=str(year),
        payload={"new_flags": new_flags, "cohort_year": year, "scores_updated": scores_updated},
    )

    return {
        "cohort_year": year,
        "new_flags_created": new_flags,
        "scores_updated": scores_updated,
        "message": f"Rule run complete. {new_flags} new flags created.",
    }
