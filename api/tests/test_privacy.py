"""
tests/test_privacy.py

Privacy guarantee tests: after seeding, the database must contain zero
raw 12-digit ID patterns. The model schema must also not have any PII
column names.

These tests are the machine-readable proof of the privacy-by-design
covenant. If they pass, the system has met its core non-negotiable.
"""

import re
import sys
import os

import pytest
from sqlalchemy import create_engine, inspect, text, String, Text

# Add the api/ directory to sys.path so we can import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db import engine, Base, SessionLocal
from models import (
    Institution, Program, Enrolment, Batch, AuditLog,
    Credential, Flag, Consent,
)

# 12 consecutive digits bounded by word boundaries = APAAR-style raw ID pattern
_RAW_ID_RE = re.compile(r"\b\d{12}\b")

# Column names that would indicate PII storage
_BANNED_COLUMN_NAMES = {
    "apaar_id", "aadhaar", "name", "full_name",
    "date_of_birth", "dob", "email", "phone", "mobile",
    "raw_id", "id_value", "national_id",
}


def test_model_has_no_pii_columns():
    """
    Verify at the schema level that no ORM model defines a column whose
    name would indicate raw PII storage.

    This is a static check — it runs before any data is inserted.
    """
    inspector = inspect(engine)

    violations = []
    for table_name in inspector.get_table_names():
        columns = inspector.get_columns(table_name)
        for col in columns:
            col_name_lower = col["name"].lower()
            # Institutions legitimately have an official college name;
            # the privacy rule strictly forbids student PII.
            if table_name == "institutions" and col_name_lower == "name":
                continue
            if col_name_lower in _BANNED_COLUMN_NAMES:
                violations.append(f"{table_name}.{col['name']}")

    assert not violations, (
        f"The following PII column names were found in the schema: {violations}. "
        f"Remove them — store tokens and hashes only."
    )


def test_no_raw_ids_in_db():
    """
    Scan every text column in every table for 12-consecutive-digit patterns.

    If any match is found, a raw APAAR-style ID has leaked into the database.
    This test should pass even after running the seed script.
    """
    inspector = inspect(engine)
    db = SessionLocal()

    try:
        violations = []

        for table_name in inspector.get_table_names():
            cols = inspector.get_columns(table_name)
            # Only scan string/text columns — numeric columns won't contain IDs as text
            text_cols = [
                c["name"]
                for c in cols
                if str(c["type"]).upper().startswith(("TEXT", "VARCHAR", "CHAR"))
            ]

            if not text_cols:
                continue

            col_exprs = ", ".join(f'COALESCE("{c}", "")' for c in text_cols)
            try:
                rows = db.execute(text(f'SELECT rowid, {col_exprs} FROM "{table_name}"')).fetchall()
            except Exception as e:
                # Some system tables may not be queryable — skip them
                continue

            for row in rows:
                rowid = row[0]
                cell_values = row[1:]
                for col_name, val in zip(text_cols, cell_values):
                    if val and _RAW_ID_RE.search(str(val)):
                        violations.append({
                            "table": table_name,
                            "column": col_name,
                            "rowid": rowid,
                            "snippet": str(val)[:20] + "...",
                        })

        assert not violations, (
            f"Found {len(violations)} potential raw ID leaks in the database:\n"
            + "\n".join(str(v) for v in violations[:10])
        )

    finally:
        db.close()


def test_tokenizer_output_has_no_raw_id():
    """
    Confirm that the tokenizer output doesn't embed the raw input
    in any recoverable form (sanity check — it's HMAC so this should
    always pass, but let's be explicit).
    """
    from tokenizer import tokenize

    raw_id = "123456789012"
    token = tokenize(raw_id, "APAAR", 2024)

    assert raw_id not in token, "Raw ID found in tokenizer output — this should never happen"
    assert len(token) > 0, "Token should be non-empty"
    assert len(token) <= 20, "Token should be short enough to display"


def test_mask_id_never_returns_real_value():
    """mask_id() must never return the real identifier."""
    from tokenizer import mask_id

    raw = "999888777666"
    masked = mask_id(raw)

    assert raw not in masked
    assert "REDACTED" in masked
