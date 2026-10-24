"""
routes/batches.py — CSV batch upload and report endpoints.

Institutions upload their student enrolment data as CSV files.
Ingestion tokenizes every ID immediately; raw IDs never persist.
"""

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from auth import require_roles
from db import get_db
from ingestion import ingest_csv
from models import Batch, BatchFinding, Enrolment
from tokenizer import tokenize
from audit_log import append_audit
from pydantic import BaseModel

router = APIRouter(tags=["batches"])


class EnrolmentUpdateRequest(BaseModel):
    id_type: str = "APAAR"
    id_value: str
    cohort_year: int
    institution_id: int | None = None
    new_status: str  # "cancelled", "active", "transferred", "revoked"
    reason: str | None = None


@router.post("/v1/batches")
async def upload_batch(
    file: UploadFile = File(..., description="CSV file with enrolment data"),
    institution_id: int = Form(..., description="ID of the uploading institution"),
    user: dict = Depends(require_roles("institution", "officer")),
    db: Session = Depends(get_db),
):
    """
    Accept a CSV upload and run the ingestion pipeline.

    The endpoint enforces that an 'institution' role user can only
    upload for their own institution (as encoded in their JWT).
    An 'officer' can upload on behalf of any institution.
    """
    # Scope check: institution users can't upload for other institutions
    if user["role"] == "institution":
        jwt_inst_id = user.get("institution_id")
        if jwt_inst_id and jwt_inst_id != institution_id:
            raise HTTPException(403, "You can only upload data for your own institution")

    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(400, "Only CSV files are accepted (.csv extension required)")

    csv_bytes = await file.read()
    if len(csv_bytes) > 10 * 1024 * 1024:  # 10 MB cap — generous for demo
        raise HTTPException(413, "File too large (max 10 MB)")

    try:
        result = ingest_csv(
            csv_bytes=csv_bytes,
            institution_id=institution_id,
            uploaded_by_role=user["role"],
            db=db,
        )
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc

    # Audit the upload — payload contains only counts, never raw IDs
    append_audit(
        db=db,
        actor_id=user["sub"],
        actor_role=user["role"],
        action="batch_upload",
        object_type="batch",
        object_id=str(result.batch_id),
        payload={
            "institution_id": institution_id,
            "rows_total": result.rows_total,
            "rows_accepted": result.rows_accepted,
            "rows_rejected": result.rows_rejected,
        },
    )

    return {
        "batch_id": result.batch_id,
        "rows_total": result.rows_total,
        "rows_accepted": result.rows_accepted,
        "rows_rejected": result.rows_rejected,
        "findings_count": len(result.findings),
        "message": (
            f"Batch processed. {result.rows_accepted} records accepted, "
            f"{result.rows_rejected} rejected."
        ),
    }


@router.get("/v1/batches/{batch_id}/report")
def batch_report(
    batch_id: int,
    user: dict = Depends(require_roles("institution", "officer", "supervisor")),
    db: Session = Depends(get_db),
):
    """
    Return the processing summary and row-level findings for a batch.
    Findings contain row numbers and error codes — never raw IDs.
    """
    batch = db.get(Batch, batch_id)
    if not batch:
        raise HTTPException(404, f"Batch {batch_id} not found")

    # Scope check for institution users
    if user["role"] == "institution":
        jwt_inst_id = user.get("institution_id")
        if jwt_inst_id and jwt_inst_id != batch.institution_id:
            raise HTTPException(403, "Access denied: this batch belongs to a different institution")

    findings = (
        db.query(BatchFinding)
        .filter(BatchFinding.batch_id == batch_id)
        .order_by(BatchFinding.row_no)
        .all()
    )

    # ---- per-row results (real: seals come from the stored enrolments, duplicates from a live R1 lookup) ----
    from collections import defaultdict
    from models import Enrolment, Institution
    SOFT = {"OPTED_OUT", "UNKNOWN_SEAT_CATEGORY"}
    by_row = defaultdict(list)
    for f in findings:
        by_row[f.row_no].append(f)
    enrols = db.query(Enrolment).filter(Enrolment.batch_id == batch_id).order_by(Enrolment.id).all()
    it = iter(enrols)
    inst_names = {i.id: i.name for i in db.query(Institution).all()}
    rows = []
    for data_row in range(1, (batch.rows_total or 0) + 1):
        fl = by_row.get(data_row + 1, [])          # ingestion numbers rows from 2 (row 1 is the header)
        hard = [f for f in fl if f.code not in SOFT]
        if hard:
            rows.append({"row": data_row, "status": "rejected", "token": None,
                         "reason": hard[0].message.split(": ", 1)[-1]})
            continue
        e = next(it, None)
        if e is None:
            continue
        other = (db.query(Enrolment)
                 .filter(Enrolment.student_token == e.student_token, Enrolment.cohort_year == e.cohort_year,
                         Enrolment.institution_id != e.institution_id, Enrolment.mode == e.mode,
                         Enrolment.id != e.id).first())
        if other:
            status = "flagged"
            reason = f"Same seal already holds a full-time seat at {inst_names.get(other.institution_id, 'another college')} (rule R1)"
        elif e.assurance_tier == "attested" or any(f.code == "OPTED_OUT" for f in fl):
            status = "attested"
            reason = "Opted out of APAAR. College-attested ID. Counted, not flagged."
        else:
            status = "accepted"
            reason = f"{e.seat_category or 'GEN'} seat · {e.assurance_tier} at source"
        rows.append({"row": data_row, "status": status, "token": e.student_token, "reason": reason})

    return {
        "batch_id": batch.id,
        "institution_id": batch.institution_id,
        "cohort_year": batch.cohort_year,
        "status": batch.status,
        "created_at": batch.created_at.isoformat(),
        "rows": rows,
        "summary": {
            "rows_total": batch.rows_total,
            "rows_accepted": batch.rows_accepted,
            "rows_rejected": batch.rows_rejected,
        },
        "findings": [
            {
                "row_no": f.row_no,
                "code": f.code,
                "message": f.message,
            }
            for f in findings
        ],
    }


@router.post("/v1/enrolments/update")
def update_enrolment(
    req: EnrolmentUpdateRequest,
    user: dict = Depends(require_roles("institution", "officer")),
    db: Session = Depends(get_db),
):
    """
    PS Requirement 1: Update student-level information using APAAR ID as unique identifier.
    Transiently derives token in memory, immediately discards raw ID, and updates status.
    """
    # Scope check for institution users
    inst_id = req.institution_id
    if user["role"] == "institution":
        jwt_inst_id = user.get("institution_id")
        if jwt_inst_id:
            inst_id = jwt_inst_id

    # Derive token in memory
    token = tokenize(req.id_value, req.id_type, req.cohort_year)
    del req.id_value  # discard raw ID immediately

    query = db.query(Enrolment).filter(
        Enrolment.student_token == token,
        Enrolment.cohort_year == req.cohort_year,
    )
    if inst_id:
        query = query.filter(Enrolment.institution_id == inst_id)

    record = query.first()
    if not record:
        raise HTTPException(404, "Enrolment record not found for this identifier")

    prev_status = record.status
    record.status = req.new_status
    db.commit()

    append_audit(
        db=db,
        actor_id=user["sub"],
        actor_role=user["role"],
        action="enrolment_status_updated",
        object_type="enrolment",
        object_id=str(record.id),
        payload={
            "student_token": token,
            "previous_status": prev_status,
            "new_status": req.new_status,
            "reason": req.reason or "institutional_update",
        },
    )

    return {
        "status": "success",
        "student_token": token,
        "previous_status": prev_status,
        "new_status": req.new_status,
        "message": f"Student seat status successfully updated to {req.new_status}.",
    }

