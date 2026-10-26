"""
test_consent_r1.py — Proves that enrolments where a student has withdrawn consent
(assurance_tier == "pending") remain counted in totals, but are strictly excluded
from cross-college token matching (Rule R1) and the duplicate radar query.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from models import Base, Institution, Program, Enrolment, Flag
from rules import run_r1
from main import app
from db import get_db
from auth import create_access_token


from sqlalchemy.pool import StaticPool

@pytest.fixture
def test_db():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()

    # Seed 2 institutions and 2 programs
    inst1 = Institution(id=1, name="College A", state="Maharashtra", institution_type="degree", aicte_perm_id="MH101")
    inst2 = Institution(id=2, name="College B", state="Karnataka", institution_type="degree", aicte_perm_id="KA101")
    db.add_all([inst1, inst2])
    db.commit()

    prog1 = Program(id=1, institution_id=1, course="B.Tech CSE", level="UG", mode="regular")
    prog2 = Program(id=2, institution_id=2, course="B.Tech CSE", level="UG", mode="regular")
    db.add_all([prog1, prog2])
    db.commit()

    yield db
    db.close()


def test_withdrawn_student_counted_in_totals_but_excluded_from_r1(test_db):
    """
    Given a student token enrolled in College A and College B:
    If assurance_tier is 'verified', R1 flags the duplicate.
    If assurance_tier is 'pending' (consent withdrawn), R1 does NOT flag it,
    yet the enrolment records are still counted in the total seat queries.
    """
    token_dual = "STU-TEST-DUAL-001"
    year = 2026

    # 1. Enrol student in both colleges as verified
    e1 = Enrolment(
        institution_id=1, program_id=1, cohort_year=year,
        student_token=token_dual, id_type="APAAR", assurance_tier="verified",
        mode="regular", seat_category="GEN", status="active",
    )
    e2 = Enrolment(
        institution_id=2, program_id=2, cohort_year=year,
        student_token=token_dual, id_type="APAAR", assurance_tier="verified",
        mode="regular", seat_category="GEN", status="active",
    )
    test_db.add_all([e1, e2])
    test_db.commit()

    # When verified, R1 detects the duplicate
    flags_verified = run_r1(test_db, cohort_year=year)
    assert len(flags_verified) == 1
    assert flags_verified[0].student_token_ref == token_dual

    # 2. Student withdraws consent -> assurance_tier becomes 'pending'
    e1.assurance_tier = "pending"
    e2.assurance_tier = "pending"
    test_db.commit()

    # Total seats query: both enrolments are still present and counted
    total_seats = test_db.query(Enrolment).filter(Enrolment.cohort_year == year).count()
    assert total_seats == 2, "Enrolments with withdrawn consent must still be counted in seat totals"

    # R1 query: student is now excluded from cross-college token matching
    flags_withdrawn = run_r1(test_db, cohort_year=year)
    assert len(flags_withdrawn) == 0, "Withdrawn consent (pending) must be excluded from cross-college R1 matching"


def test_withdrawn_student_never_appears_in_radar(test_db):
    """
    Test that /v1/regulator/radar excludes any tokens where enrolments have assurance_tier == 'pending'.
    """
    token = "STU-TEST-RADAR-002"
    year = 2026

    # Create enrolments with pending assurance tier
    e1 = Enrolment(
        institution_id=1, program_id=1, cohort_year=year,
        student_token=token, id_type="APAAR", assurance_tier="pending",
        mode="regular", seat_category="GEN", status="active",
    )
    e2 = Enrolment(
        institution_id=2, program_id=2, cohort_year=year,
        student_token=token, id_type="APAAR", assurance_tier="pending",
        mode="regular", seat_category="GEN", status="active",
    )
    test_db.add_all([e1, e2])

    # Also add an R1 flag that might have existed before
    f = Flag(
        rule_id="R1", severity="high", state="open",
        institution_ids_json="[1, 2]",
        student_token_ref=token,
        evidence_json='{"institution_count": 2}',
        explanation="Test explanation",
    )
    test_db.add(f)
    test_db.commit()

    # Override get_db dependency in FastAPI app
    app.dependency_overrides[get_db] = lambda: test_db
    client = TestClient(app)

    token_jwt = create_access_token(subject="officer-1", role="officer")
    headers = {"Authorization": f"Bearer {token_jwt}"}

    res = client.get(f"/v1/regulator/radar?year={year}", headers=headers)
    assert res.status_code == 200
    data = res.json()

    # The flag must NOT be present in duplicates because assurance_tier is pending
    duplicate_tokens = [d["token"] for d in data.get("duplicates", [])]
    assert token not in duplicate_tokens, "Pending (withdrawn) token must not appear in radar results"

    app.dependency_overrides.clear()
