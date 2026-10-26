"""
test_reveal.py — Verifies the tripartite dual-control reveal consensus workflow:
- POST /v1/regulator/reveal/request
- POST /v1/college/reveal/approve
- POST /v1/student/reveal/consent
An identity is unsealed ONLY when all 3 parties approve.
No raw ID is ever stored in the database.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from models import Base, Institution, Program, Enrolment, Flag, Case, RevealRequest, AuditLog
from main import app
from db import get_db
from auth import create_access_token
from tokenizer import tokenize


@pytest.fixture
def reveal_db():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()

    # Seed institution & program
    inst = Institution(id=1, name="MIT Pune", state="Maharashtra", institution_type="degree", aicte_perm_id="MH001")
    db.add(inst)
    db.commit()

    prog = Program(id=1, institution_id=1, course="B.Tech CSE", level="UG", mode="regular")
    db.add(prog)
    db.commit()

    raw_id = "987654321099"
    cohort = 2026
    token = tokenize(raw_id, "APAAR", cohort)

    # Enrolment
    e = Enrolment(
        institution_id=1, program_id=1, cohort_year=cohort,
        student_token=token, id_type="APAAR", assurance_tier="verified",
        mode="regular", seat_category="GEN", status="active",
    )
    db.add(e)

    # Flag
    flag = Flag(
        rule_id="R1", severity="high", state="open",
        institution_ids_json="[1]",
        student_token_ref=token,
        evidence_json='{"details": "test"}',
        explanation="Test duplicate flag",
    )
    db.add(flag)
    db.commit()

    # Case
    case = Case(flag_id=flag.id, status="open")
    db.add(case)
    db.commit()

    db.test_data = {"raw_id": raw_id, "token": token, "case_id": case.id, "cohort": cohort}

    yield db
    db.close()


def test_dual_control_reveal_tripartite_workflow(reveal_db):
    app.dependency_overrides[get_db] = lambda: reveal_db
    client = TestClient(app)

    data = reveal_db.test_data
    case_id = data["case_id"]
    raw_id = data["raw_id"]
    token = data["token"]

    officer_token = create_access_token(subject="regulator-officer-1", role="officer")
    college_token = create_access_token(subject="college-registrar-1", role="institution", extra={"institution_id": 1})
    student_token = create_access_token(subject=token, role="student")

    # -------------------------------------------------------------
    # 1. Regulator initiates reveal request
    # -------------------------------------------------------------
    res1 = client.post(
        "/v1/regulator/reveal/request",
        json={"case_id": case_id, "reason_code": "court_order"},
        headers={"Authorization": f"Bearer {officer_token}"},
    )
    assert res1.status_code == 200
    r1_json = res1.json()
    reveal_id = r1_json["reveal_request_id"]
    assert r1_json["unsealed"] is False
    assert r1_json["status"] == "pending_approvals"

    # Verify audit log recorded regulator request
    audit1 = reveal_db.query(AuditLog).filter(AuditLog.action == "reveal_requested").first()
    assert audit1 is not None
    assert audit1.object_id == str(reveal_id)

    # -------------------------------------------------------------
    # 2. College tests with WRONG raw ID -> must fail token match
    # -------------------------------------------------------------
    res_wrong = client.post(
        "/v1/college/reveal/approve",
        json={
            "reveal_request_id": reveal_id,
            "id_value": "000000000000",
            "id_type": "APAAR",
            "cohort_year": data["cohort"],
        },
        headers={"Authorization": f"Bearer {college_token}"},
    )
    assert res_wrong.status_code == 400
    assert "Token mismatch" in res_wrong.json()["detail"]

    # -------------------------------------------------------------
    # 3. College approves with CORRECT raw ID -> match: true, zero raw ID stored
    # -------------------------------------------------------------
    res2 = client.post(
        "/v1/college/reveal/approve",
        json={
            "reveal_request_id": reveal_id,
            "id_value": raw_id,
            "id_type": "APAAR",
            "cohort_year": data["cohort"],
        },
        headers={"Authorization": f"Bearer {college_token}"},
    )
    assert res2.status_code == 200
    r2_json = res2.json()
    assert r2_json["match"] is True
    assert r2_json["college_approved"] is True
    # Still pending student approval!
    assert r2_json["unsealed"] is False

    # Check status endpoint
    res_status = client.get(
        f"/v1/regulator/reveal/{reveal_id}",
        headers={"Authorization": f"Bearer {officer_token}"},
    )
    assert res_status.status_code == 200
    assert res_status.json()["approvals"]["regulator"] is True
    assert res_status.json()["approvals"]["college"] is True
    assert res_status.json()["approvals"]["student"] is False
    assert res_status.json()["unsealed"] is False

    # -------------------------------------------------------------
    # 4. Student gives consent -> Tripartite consensus reached, unsealed!
    # -------------------------------------------------------------
    res3 = client.post(
        "/v1/student/reveal/consent",
        json={"reveal_request_id": reveal_id, "consent": True},
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert res3.status_code == 200
    r3_json = res3.json()
    assert r3_json["student_consented"] is True
    assert r3_json["unsealed"] is True
    assert r3_json["status"] == "unsealed"

    # Verify audit log recorded unsealed action
    audit_unsealed = reveal_db.query(AuditLog).filter(AuditLog.action == "student_reveal_consented").first()
    assert audit_unsealed is not None

    # Verify NO raw ID is stored anywhere in reveal_requests
    req_row = reveal_db.get(RevealRequest, reveal_id)
    assert raw_id not in (req_row.institution_responses_json or "")
    assert raw_id not in req_row.requested_by
    assert raw_id not in (req_row.approved_by or "")

    app.dependency_overrides.clear()

