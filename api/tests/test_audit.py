"""
tests/test_audit.py

Audit log integrity tests. The chain must verify cleanly on a fresh log,
and any retroactive edit to any entry must break the chain.
"""

import sys
import os

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from models import Base, AuditLog
from audit_log import append_audit, verify_chain


# Use an in-memory SQLite DB for these tests — no side effects on the dev DB
@pytest.fixture
def db():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        yield session
    finally:
        session.close()


def test_chain_verifies_clean(db):
    """A freshly written audit log must verify correctly."""
    # Write a few entries
    for i in range(5):
        append_audit(
            db=db,
            actor_id=f"test-user-{i}",
            actor_role="officer",
            action=f"test_action_{i}",
            object_type="test",
            object_id=str(i),
            payload={"index": i, "note": "audit test"},
        )

    result = verify_chain(db)

    assert result["valid"] is True, f"Chain should be valid but got: {result}"
    assert result["entries_checked"] == 5
    assert result["first_bad_index"] is None


def test_tampered_row_breaks_chain(db):
    """
    Edit the entry_hash of any past audit entry → verify_chain should
    detect the break and report which index is bad.
    """
    # Write a few entries
    for i in range(4):
        append_audit(
            db=db,
            actor_id="tamper-test",
            actor_role="auditor",
            action=f"action_{i}",
            object_type="resource",
            object_id=str(i),
            payload={"seq": i},
        )

    # Tamper with the second entry (index 1 in 0-based)
    entries = db.query(AuditLog).order_by(AuditLog.id.asc()).all()
    target = entries[1]
    target.entry_hash = "deadbeef" * 8  # 64 chars of garbage
    db.commit()

    result = verify_chain(db)

    assert result["valid"] is False, "Chain should be invalid after tampering"
    assert result["first_bad_index"] is not None
    # The break should be detected at or before index 2 (where prev_hash mismatch occurs)
    assert result["first_bad_index"] <= 2


def test_empty_chain_is_valid(db):
    """An empty audit log is trivially valid — no entries to tamper with."""
    result = verify_chain(db)
    assert result["valid"] is True
    assert result["entries_checked"] == 0


def test_single_entry_chain(db):
    """A single-entry chain should also verify."""
    append_audit(
        db=db,
        actor_id="solo",
        actor_role="institution",
        action="upload",
        object_type="batch",
        object_id="1",
        payload={"rows": 42},
    )
    result = verify_chain(db)
    assert result["valid"] is True
    assert result["entries_checked"] == 1


def test_payload_hash_is_not_reversible(db):
    """
    The payload_hash column stores a hash, not the raw payload.
    Confirm we can't reconstruct a sensitive value from the hash alone.
    """
    append_audit(
        db=db,
        actor_id="hash-test",
        actor_role="officer",
        action="test",
        object_type="test",
        object_id="0",
        payload={"student_token": "TESTTOKEN123", "sensitive": False},
    )

    entry = db.query(AuditLog).first()
    # The payload hash must be a hex string, not the raw payload content
    assert "TESTTOKEN123" not in entry.payload_hash
    assert len(entry.payload_hash) == 64  # SHA-256 produces 64 hex chars
