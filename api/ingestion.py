"""
ingestion.py — CSV batch ingestion pipeline.

This is where raw student IDs enter the system. By the time this
function returns, every raw ID has been tokenized and discarded.
Nothing downstream ever sees a real APAAR ID.

Expected CSV columns: id_type, id_value, program_code, cohort_year, mode, seat_category
"""

import csv
import io
import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from models import Batch, BatchFinding, Enrolment, Institution, Program
from tokenizer import tokenize, mask_id
from mock_registry import verify_with_registry

logger = logging.getLogger("sakshi.ingestion")

# Allowed values — reject anything outside these to keep the data clean
VALID_ID_TYPES = {"APAAR", "INST", "OTHER"}
VALID_MODES = {"regular", "distance", "part_time", "correspondence"}
VALID_SEAT_CATEGORIES = {"GEN", "OBC", "SC", "ST", "EWS", "PWD", "NRI", "TF"}


@dataclass
class RowFinding:
    row_no: int
    code: str
    message: str
    accepted: bool  # True if the row was ingested despite the finding (warning vs error)


@dataclass
class BatchResult:
    batch_id: int
    rows_total: int
    rows_accepted: int
    rows_rejected: int
    findings: list[RowFinding] = field(default_factory=list)


def _validate_row(row: dict, row_no: int) -> list[RowFinding]:
    """
    Check required fields and enum values.
    Returns a list of findings (empty = all good).
    Never echoes back the id_value.
    """
    issues: list[RowFinding] = []

    # Check required columns
    for col in ("id_type", "id_value", "program_code", "cohort_year", "mode"):
        if not row.get(col, "").strip():
            issues.append(RowFinding(row_no, "MISSING_FIELD", f"Row {row_no}: required column '{col}' is empty", accepted=False))

    if issues:
        return issues  # don't bother with enum checks if the basics are missing

    id_type = row["id_type"].strip().upper()
    if id_type not in VALID_ID_TYPES:
        issues.append(RowFinding(row_no, "INVALID_ID_TYPE", f"Row {row_no}: id_type must be one of {VALID_ID_TYPES}", accepted=False))

    mode = row["mode"].strip().lower()
    if mode not in VALID_MODES:
        issues.append(RowFinding(row_no, "INVALID_MODE", f"Row {row_no}: mode '{mode}' is not recognised", accepted=False))

    try:
        year = int(row["cohort_year"])
        if not (2000 <= year <= 2100):
            raise ValueError
    except ValueError:
        issues.append(RowFinding(row_no, "INVALID_YEAR", f"Row {row_no}: cohort_year must be a 4-digit year", accepted=False))

    seat_cat = row.get("seat_category", "").strip().upper()
    if seat_cat and seat_cat not in VALID_SEAT_CATEGORIES:
        # Warn but don't reject — unknown categories might be new additions
        issues.append(RowFinding(row_no, "UNKNOWN_SEAT_CATEGORY", f"Row {row_no}: seat_category '{seat_cat}' is not in the known list", accepted=True))

    return issues


def ingest_csv(
    csv_bytes: bytes,
    institution_id: int,
    uploaded_by_role: str,
    db: Session,
) -> BatchResult:
    """
    Main entry point for batch ingestion.

    Args:
        csv_bytes:        Raw bytes of the uploaded CSV file.
        institution_id:   The institution performing the upload.
        uploaded_by_role: JWT role of the uploader (for audit trail).
        db:               SQLAlchemy session.

    Returns:
        A BatchResult with summary counts and row-level findings.
    """
    # Verify the institution exists
    institution = db.get(Institution, institution_id)
    if not institution:
        raise ValueError(f"Institution ID {institution_id} not found")

    # Create a batch record up front so we have an ID for findings
    batch = Batch(
        institution_id=institution_id,
        uploaded_by_role=uploaded_by_role,
        cohort_year=0,  # will be set from first valid row
        status="processing",
        created_at=datetime.now(timezone.utc),
    )
    db.add(batch)
    db.flush()  # get the batch.id without committing

    text = csv_bytes.decode("utf-8-sig")  # handle BOM if Excel-generated
    reader = csv.DictReader(io.StringIO(text))

    findings: list[RowFinding] = []
    accepted = 0
    rejected = 0
    total = 0

    # Cache program lookups to avoid N+1 queries
    _program_cache: dict[str, Program | None] = {}

    for row_no, raw_row in enumerate(reader, start=2):  # row 1 = header
        total += 1
        row = {k.strip(): v.strip() for k, v in raw_row.items() if k}  # normalise whitespace

        # --- validation ---
        validation_issues = _validate_row(row, row_no)
        hard_errors = [f for f in validation_issues if not f.accepted]
        findings.extend(validation_issues)

        if hard_errors:
            rejected += 1
            continue  # skip to next row — don't tokenize if we can't use the data

        id_type = row["id_type"].strip().upper()
        id_value = row["id_value"].strip()
        program_code = row["program_code"].strip()
        cohort_year = int(row["cohort_year"])
        mode = row["mode"].strip().lower()
        seat_category = row.get("seat_category", "GEN").strip().upper() or "GEN"

        # --- registry check ---
        # We pass the raw ID in, but verify_with_registry never stores it.
        registry_result = verify_with_registry(id_value, id_type)

        if registry_result["status"] == "invalid":
            # Log by row number and code only — never echo the id_value
            logger.warning("Row %d: registry returned invalid for a %s-char ID (redacted)", row_no, len(id_value))
            findings.append(RowFinding(row_no, "REGISTRY_INVALID", f"Row {row_no}: identity could not be verified by registry", accepted=False))
            rejected += 1
            # Immediately discard the raw value
            del id_value
            continue

        if registry_result["status"] == "opted_out":
            # Opted-out students are enrolled with pending assurance — not rejected
            findings.append(RowFinding(row_no, "OPTED_OUT", f"Row {row_no}: student has opted out of APAAR verification; enrolled with pending tier", accepted=True))

        assurance_tier = registry_result["assurance_tier"]

        # --- tokenize ---
        # This is the last moment the raw ID exists in memory.
        student_token = tokenize(id_value, id_type, cohort_year)
        del id_value  # done — the raw ID is no longer needed

        # --- programme lookup ---
        cache_key = f"{institution_id}:{program_code}"
        if cache_key not in _program_cache:
            _program_cache[cache_key] = (
                db.query(Program)
                .filter(
                    Program.institution_id == institution_id,
                    Program.course == program_code,
                )
                .first()
            )
        program = _program_cache[cache_key]

        if not program:
            logger.warning("Row %d: programme code '%s' not found for institution %d", row_no, program_code, institution_id)
            findings.append(RowFinding(row_no, "UNKNOWN_PROGRAMME", f"Row {row_no}: programme '{program_code}' not found for this institution", accepted=False))
            rejected += 1
            continue

        # --- store enrolment (token only, never the raw ID) ---
        enrolment = Enrolment(
            institution_id=institution_id,
            program_id=program.id,
            cohort_year=cohort_year,
            student_token=student_token,
            id_type=id_type,
            assurance_tier=assurance_tier,
            mode=mode,
            seat_category=seat_category,
            status="active",
            batch_id=batch.id,
            created_at=datetime.now(timezone.utc),
        )
        db.add(enrolment)
        accepted += 1

        # Update batch cohort year from the first accepted row
        if batch.cohort_year == 0:
            batch.cohort_year = cohort_year

    # Persist row-level findings
    for f in findings:
        db.add(BatchFinding(
            batch_id=batch.id,
            row_no=f.row_no,
            code=f.code,
            message=f.message,
        ))

    # Finalise batch record
    batch.rows_total = total
    batch.rows_accepted = accepted
    batch.rows_rejected = rejected
    batch.status = "done"

    db.commit()

    return BatchResult(
        batch_id=batch.id,
        rows_total=total,
        rows_accepted=accepted,
        rows_rejected=rejected,
        findings=findings,
    )
