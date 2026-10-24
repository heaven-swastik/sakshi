"""
tests/test_real_numbers.py — every number the UI shows must come from the database, not from a script.

These tests build a tiny database and check that the Season Replay and the audit-chained inquiry are computed,
not hard-coded.
"""
import os
import sys
from datetime import datetime

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from models import Base, Enrolment, Institution, IntakeApproval, Program
from audit_log import verify_chain
from routes.regulator import admission_season_replay, dispatch_inquiry, InquiryIn


@pytest.fixture
def db():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    s = sessionmaker(bind=engine)()
    inst = [Institution(name=f"College {i}", state="X", institution_type="degree", aicte_perm_id=f"P{i}") for i in range(4)]
    s.add_all(inst); s.commit()
    progs = []
    for i in inst:
        p = Program(institution_id=i.id, course="B.Tech CSE", level="UG", mode="regular"); s.add(p); s.flush()
        s.add(IntakeApproval(program_id=p.id, academic_year=2026, approved_intake=10)); progs.append(p)
    s.commit()
    # College 0 admits 14 seats (over its intake of 10); the others admit 5 each, all on 2026-07-05 except 4 late seats at college 0
    n = 0
    for idx, p in enumerate(progs):
        count = 14 if idx == 0 else 5
        for k in range(count):
            day = "2026-07-05" if (idx != 0 or k < 10) else "2026-09-28"
            s.add(Enrolment(institution_id=p.institution_id, program_id=p.id, cohort_year=2026, student_token=f"T{n}",
                            id_type="APAAR", assurance_tier="verified", mode="regular", seat_category="GEN",
                            created_at=datetime.fromisoformat(day + "T10:00:00"))); n += 1
    s.commit()
    yield s
    s.close()


def test_replay_is_computed_from_enrolments(db):
    res = admission_season_replay(year=2026, user={"role": "officer"}, db=db)
    assert res["total_enrolled"] == 29                      # 14 + 5 + 5 + 5, counted from the table
    assert res["approved_capacity"] == 40                   # 4 x 10, summed from intake_approvals
    assert [d["seats_filled"] for d in res["timeline"]] == [25, 29]
    late = res["timeline"][-1]
    assert late["breach"] is True and "College 0" in late["note"]   # the overrun is detected, not scripted


def test_inquiry_is_written_to_the_audit_chain(db):
    out = dispatch_inquiry(InquiryIn(student_token="STU-TEST", institutions=["A", "B"]),
                           user={"sub": "officer-1", "role": "officer"}, db=db)
    assert out["notice_id"].startswith("NOT-") and len(out["entry_hash"]) == 64
    assert verify_chain(db)["valid"] is True
    assert verify_chain(db)["entries_checked"] == 1
