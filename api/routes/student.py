"""
routes/student.py — Student-facing "citizen window" endpoints.

Students can see their own enrolment records and who has verified them,
raise disputes, and withdraw consent. Identity is established via a
phone-based OTP flow (mock for demo).

The student's JWT sub is their token — never their name or APAAR ID.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth import require_roles
from db import get_db
from models import (
    Consent, Enrolment, Institution, Program,
    StudentDispute, VerificationEvent, Credential,
)
from audit_log import append_audit

router = APIRouter(tags=["student"])


class DisputeRequest(BaseModel):
    institution_id: int
    dispute_type: str  # "ghost_enrolment" | "wrong_programme" | "wrong_year"
    description: str | None = None  # optional free text, not stored in the DB


class ConsentWithdrawRequest(BaseModel):
    purpose: str = "enrolment_verification"


@router.get("/v1/student/me/records")
def my_records(
    user: dict = Depends(require_roles("student")),
    db: Session = Depends(get_db),
):
    """
    Return all enrolment records linked to this student's token,
    plus a log of who has verified any of their credentials and why.

    This is the student's "citizen window" — they can see every access.
    """
    student_token = user["sub"]  # the token is the subject claim in the student JWT

    enrolments = (
        db.query(Enrolment)
        .filter(Enrolment.student_token == student_token)
        .all()
    )

    enrolment_records = []
    for e in enrolments:
        inst = db.get(Institution, e.institution_id)
        prog = db.get(Program, e.program_id)

        # Find credentials for this enrolment
        creds = (
            db.query(Credential)
            .filter(
                Credential.student_token == student_token,
                Credential.program_id == e.program_id,
                Credential.cohort_year == e.cohort_year,
            )
            .all()
        )

        # Collect verification events for these credentials
        access_log = []
        for cred in creds:
            events = (
                db.query(VerificationEvent)
                .filter(VerificationEvent.credential_id == cred.id)
                .order_by(VerificationEvent.ts.desc())
                .all()
            )
            for ev in events:
                access_log.append({
                    "when": ev.ts.isoformat(),
                    "who": ev.verifier_role,
                    "why": ev.purpose_code,
                    "result": ev.result,
                })

        enrolment_records.append({
            "institution_id": e.institution_id,
            "institution": inst.name if inst else f"Institution #{e.institution_id}",
            "programme": prog.course if prog else f"Programme #{e.program_id}",
            "cohort_year": e.cohort_year,
            "assurance_tier": e.assurance_tier,
            "status": e.status,
            "mode": e.mode,
            "credential_count": len(creds),
            "access_log": access_log,
        })

    return {
        "student_token": student_token,
        "enrolments": enrolment_records,
        "note": "Your identity (name, ID) is never shown here. Your token is a pseudonym.",
    }


@router.post("/v1/student/me/disputes")
def raise_dispute(
    req: DisputeRequest,
    user: dict = Depends(require_roles("student")),
    db: Session = Depends(get_db),
):
    """
    Let a student flag a record as 'this is not me' or 'wrong programme'.
    Creates a StudentDispute linked via token — no PII stored.
    """
    student_token = user["sub"]

    valid_types = {"ghost_enrolment", "wrong_programme", "wrong_year"}
    if req.dispute_type not in valid_types:
        raise HTTPException(400, f"dispute_type must be one of: {valid_types}")

    inst = db.get(Institution, req.institution_id)
    if not inst:
        raise HTTPException(404, f"Institution {req.institution_id} not found")

    dispute = StudentDispute(
        student_token=student_token,
        institution_id=req.institution_id,
        dispute_type=req.dispute_type,
        status="open",
        created_at=datetime.now(timezone.utc),
    )
    db.add(dispute)
    db.commit()
    db.refresh(dispute)

    append_audit(
        db=db,
        actor_id=student_token,
        actor_role="student",
        action="dispute_raised",
        object_type="institution",
        object_id=str(req.institution_id),
        payload={"dispute_id": dispute.id, "dispute_type": req.dispute_type},
    )

    return {
        "dispute_id": dispute.id,
        "institution": inst.name,
        "dispute_type": req.dispute_type,
        "status": "open",
        "message": "Your dispute has been recorded. The regulator will review it.",
    }


@router.post("/v1/student/me/consent/withdraw")
def withdraw_consent(
    req: ConsentWithdrawRequest,
    user: dict = Depends(require_roles("student")),
    db: Session = Depends(get_db),
):
    """
    Withdraw consent for a given purpose. This moves all enrolment
    assurance tiers to 'pending' so they can no longer be cross-referenced
    via APAAR until consent is renewed.
    """
    student_token = user["sub"]
    now = datetime.now(timezone.utc)

    # Update consent record
    existing = (
        db.query(Consent)
        .filter(
            Consent.student_token == student_token,
            Consent.purpose == req.purpose,
            Consent.status == "active",
        )
        .first()
    )
    if existing:
        existing.status = "withdrawn"
        existing.withdrawn_at = now
    else:
        # Create a withdrawn record even if no active consent existed
        db.add(Consent(
            student_token=student_token,
            purpose=req.purpose,
            status="withdrawn",
            withdrawn_at=now,
        ))

    # Downgrade assurance tier on all active enrolments for this student
    enrolments = (
        db.query(Enrolment)
        .filter(
            Enrolment.student_token == student_token,
            Enrolment.assurance_tier == "verified",
        )
        .all()
    )
    for e in enrolments:
        e.assurance_tier = "pending"

    db.commit()

    append_audit(
        db=db,
        actor_id=student_token,
        actor_role="student",
        action="consent_withdrawn",
        object_type="consent",
        object_id=req.purpose,
        payload={"purpose": req.purpose, "enrolments_affected": len(enrolments)},
    )

    return {
        "message": "Consent withdrawn. Your records are now marked as pending.",
        "enrolments_affected": len(enrolments),
        "note": "You can renew consent at any time by contacting your institution.",
    }
