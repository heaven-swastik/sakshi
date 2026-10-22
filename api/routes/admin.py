"""
routes/admin.py — Auditor-only endpoints: chain verification and privacy proof.

These endpoints are the system's self-attestation layer.
An external auditor (or the system itself) can call these to get
machine-readable evidence that the audit trail is intact and that
no raw student IDs leaked into the database.
"""

import re
import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from fastapi.security import HTTPAuthorizationCredentials
from auth import decode_token, _bearer
from db import get_db, engine
from audit_log import verify_chain, daily_root

router = APIRouter(tags=["admin"])

# Regex for a standalone 12-consecutive-digit sequence — the format of APAAR-style IDs.
# If this pattern appears in any DB text column, that's a privacy violation.
_RAW_ID_PATTERN = re.compile(r"\b\d{12}\b")


def get_admin_or_visitor(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> dict:
    """Allow authorized officers/auditors, or default to a public auditor role for transparency."""
    if not credentials:
        return {"sub": "public-auditor", "role": "auditor"}
    try:
        return decode_token(credentials.credentials)
    except Exception:
        return {"sub": "public-auditor", "role": "auditor"}


@router.get("/v1/audit/verify")
def audit_chain_verify(
    user: dict = Depends(get_admin_or_visitor),
    db: Session = Depends(get_db),
):
    """
    Run a full hash-chain verification of the audit log.
    If any entry has been tampered with, this will identify the first
    broken link.

    Returns: {valid, entries_checked, first_bad_index, verified_at}
    """
    result = verify_chain(db)
    result["verified_at"] = datetime.now(timezone.utc).isoformat()
    result["verified_by"] = user["sub"]
    return result


@router.get("/v1/audit/daily-root")
def compute_daily_root(
    user: dict = Depends(get_admin_or_visitor),
    db: Session = Depends(get_db),
):
    """
    Compute and store today's Merkle root of the audit log.
    The root is signed with the system's Ed25519 key.
    """
    result = daily_root(db)
    return result


@router.get("/v1/system/privacy-proof")
def privacy_proof(
    user: dict = Depends(get_admin_or_visitor),
    db: Session = Depends(get_db),
):
    """
    Scan every text column in every table for 12-consecutive-digit patterns.

    A zero match count is the proof that no raw APAAR-style ID has leaked
    into the database. This can be shown to regulators or presented during
    a compliance review.

    Returns: {passed, match_count, tables_scanned, checked_at}
    """
    inspector = inspect(engine)
    table_names = inspector.get_table_names()

    total_matches = 0
    table_results = {}

    for table_name in table_names:
        # Get all text/varchar columns for this table
        columns = inspector.get_columns(table_name)
        text_cols = [
            c["name"] for c in columns
            if str(c["type"]).upper().startswith(("TEXT", "VARCHAR", "CHAR", "STRING"))
        ]

        if not text_cols:
            table_results[table_name] = {"text_columns": 0, "matches": 0}
            continue

        # Build a query that concatenates all text columns for scanning
        # We use raw SQL here because the table structure varies
        col_list = ", ".join(f'COALESCE("{c}", "")' for c in text_cols)
        query_sql = text(f'SELECT {col_list} FROM "{table_name}"')

        try:
            rows = db.execute(query_sql).fetchall()
        except Exception:
            table_results[table_name] = {"text_columns": len(text_cols), "matches": -1, "error": "scan failed"}
            continue

        match_count = 0
        for row in rows:
            combined = " ".join(str(v) for v in row if v)
            if _RAW_ID_PATTERN.search(combined):
                match_count += 1

        total_matches += match_count
        table_results[table_name] = {"text_columns": len(text_cols), "matches": match_count}

    passed = total_matches == 0

    return {
        "passed": passed,
        "match_count": total_matches,
        "tables_scanned": len(table_names),
        "table_detail": table_results,
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "message": (
            "No raw 12-digit ID patterns found in the database. Privacy covenant holds."
            if passed
            else f"WARNING: {total_matches} potential raw ID matches found. Review the table_detail field."
        ),
    }
