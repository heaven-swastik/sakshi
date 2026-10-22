"""
routes/credentials.py — Credential issuance, verification, revocation, and QR codes.

The verify endpoint is intentionally public — anyone can check if a credential
is valid given a handle. This is by design: it enables employer background checks
without exposing any student PII.
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth import get_current_user, require_roles
from db import get_db
from credentials import (
    issue_credential,
    verify_credential,
    revoke_credential,
    get_qr_for_credential,
)
from models import Credential, Enrolment
from audit_log import append_audit

router = APIRouter(tags=["credentials"])


class IssueRequest(BaseModel):
    student_token: str
    program_id: int
    cohort_year: int
    assurance_tier: str = "verified"


class RevokeRequest(BaseModel):
    reason: str


@router.post("/v1/credentials/issue")
def issue(
    req: IssueRequest,
    user: dict = Depends(require_roles("institution", "officer")),
    db: Session = Depends(get_db),
):
    """
    Issue a signed enrolment credential for a student (identified by token).
    Returns the handle, JWS, and a base64-encoded QR code PNG.
    """
    # Verify there's actually an enrolment record for this token + programme
    enrolment = (
        db.query(Enrolment)
        .filter(
            Enrolment.student_token == req.student_token,
            Enrolment.program_id == req.program_id,
            Enrolment.cohort_year == req.cohort_year,
        )
        .first()
    )
    if not enrolment:
        raise HTTPException(
            404,
            "No enrolment record found for this token + programme + year combination",
        )

    result = issue_credential(
        student_token=req.student_token,
        program_id=req.program_id,
        cohort_year=req.cohort_year,
        assurance_tier=req.assurance_tier,
        db=db,
        issued_by=user["sub"],
    )

    append_audit(
        db=db,
        actor_id=user["sub"],
        actor_role=user["role"],
        action="credential_issued",
        object_type="credential",
        object_id=result["handle"],
        payload={
            "program_id": req.program_id,
            "cohort_year": req.cohort_year,
            "assurance_tier": req.assurance_tier,
        },
    )

    return result


@router.get("/v1/verify/{handle}")
def verify(
    handle: str,
    purpose_code: str = "public_check",
    verifier_role: str = "public",
    db: Session = Depends(get_db),
):
    """
    Public endpoint: verify a credential by its short handle.
    Returns only: valid (bool), status, programme, cohort_year.
    No student PII is ever returned.
    """
    result = verify_credential(
        handle=handle,
        purpose_code=purpose_code,
        verifier_role=verifier_role,
        db=db,
    )
    return result


@router.post("/v1/credentials/{credential_id}/revoke")
def revoke(
    credential_id: int,
    req: RevokeRequest,
    user: dict = Depends(require_roles("institution", "officer")),
    db: Session = Depends(get_db),
):
    """Revoke a credential. The handle immediately becomes invalid on verify."""
    try:
        result = revoke_credential(credential_id=credential_id, reason=req.reason, db=db)
    except ValueError as exc:
        raise HTTPException(404, str(exc)) from exc

    append_audit(
        db=db,
        actor_id=user["sub"],
        actor_role=user["role"],
        action="credential_revoked",
        object_type="credential",
        object_id=str(credential_id),
        payload={"reason": req.reason},
    )

    return result


@router.get("/v1/credentials/{credential_id}/qr")
def get_qr(
    credential_id: int,
    user: dict = Depends(require_roles("institution", "student", "officer")),
    db: Session = Depends(get_db),
):
    """Return a QR code PNG as base64 for the given credential."""
    # Students can only fetch QR for their own credentials
    if user["role"] == "student":
        cred = db.get(Credential, credential_id)
        if not cred or cred.student_token != user["sub"]:
            raise HTTPException(403, "Access denied: credential does not belong to your token")

    try:
        qr_b64 = get_qr_for_credential(credential_id=credential_id, db=db)
    except ValueError as exc:
        raise HTTPException(404, str(exc)) from exc

    return {"credential_id": credential_id, "qr_b64": qr_b64, "format": "PNG", "encoding": "base64"}
