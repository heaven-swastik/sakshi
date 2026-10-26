"""
test_dispute_signature.py — Verifies that student "This is not me" disputes
are cryptographically signed (HMAC), stored in the database, and recorded in the audit log.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from models import Base, Institution, StudentDispute, AuditLog
from main import app
from db import get_db
from auth import create_access_token


@pytest.fixture
def dispute_db():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()

    inst = Institution(id=1, name="Test College", state="Maharashtra", institution_type="degree", aicte_perm_id="TEST01")
    db.add(inst)
    db.commit()

    yield db
    db.close()


def test_student_dispute_is_signed_and_audited(dispute_db):
    app.dependency_overrides[get_db] = lambda: dispute_db
    client = TestClient(app)

    student_token = "STU-MEERA-GHOST-999"
    jwt_token = create_access_token(subject=student_token, role="student")

    res = client.post(
        "/v1/student/me/disputes",
        json={"institution_id": 1, "dispute_type": "ghost_enrolment"},
        headers={"Authorization": f"Bearer {jwt_token}"},
    )
    assert res.status_code == 200
    data = res.json()

    assert data["status"] == "open"
    assert "signature" in data
    assert len(data["signature"]) == 64  # SHA256 hex string

    # Verify stored in DB
    dispute_row = dispute_db.query(StudentDispute).filter(StudentDispute.id == data["dispute_id"]).first()
    assert dispute_row is not None
    assert dispute_row.signature == data["signature"]

    # Verify included in audit log (payload_hash covers the signature)
    import json, hashlib
    audit_entry = dispute_db.query(AuditLog).filter(AuditLog.action == "dispute_raised").first()
    assert audit_entry is not None
    assert audit_entry.actor_id == student_token
    expected_payload = json.dumps({"dispute_id": data["dispute_id"], "dispute_type": "ghost_enrolment", "signature": data["signature"]}, sort_keys=True)
    expected_hash = hashlib.sha256(expected_payload.encode("utf-8")).hexdigest()
    assert audit_entry.payload_hash == expected_hash

    app.dependency_overrides.clear()
