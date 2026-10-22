"""
seed/generate.py — Synthetic demo data generator for SAKSHI.

Generates a realistic but entirely fictional dataset:
- 15 institutions across 5 states
- ~3 programmes each, varied intake sizes
- Students with a realistic mix of assurance tiers
- Injected anomalies for all 6 detection rules

Fixed random seed = 42 so every run produces the same data.
IDs are in the range 100000000000–899999999999 (synthetic, not real APAAR range).

Run from the project root:
    python seed/generate.py

Or from the seed/ directory:
    python generate.py
"""

import json
import random
import sys
import os
from datetime import datetime, timezone
from pathlib import Path

# Make the api/ modules importable
_API_DIR = Path(__file__).resolve().parent.parent / "api"
sys.path.insert(0, str(_API_DIR))

from sqlalchemy.orm import Session

from db import engine, SessionLocal
from models import (
    Base, Institution, Program, IntakeApproval, Batch, BatchFinding,
    Enrolment, Credential, Flag, IntegrityScore,
)
from tokenizer import tokenize
from mock_registry import verify_with_registry
from credentials import issue_credential, get_signing_key
from rules import run_all_rules, persist_flags
from scoring import compute_integrity_score
from audit_log import append_audit

RNG = random.Random(42)  # fixed seed — results are deterministic and repeatable

COHORT_YEAR = 2024
_SEED_DIR = Path(__file__).resolve().parent

# ---------------------------------------------------------------------------
# Institution definitions
# ---------------------------------------------------------------------------

INSTITUTIONS = [
    # Maharashtra
    {"name": "MIT Pune", "state": "Maharashtra", "type": "degree", "region": "West", "aicte": "MH001"},
    {"name": "VJTI Mumbai", "state": "Maharashtra", "type": "degree", "region": "West", "aicte": "MH002"},
    {"name": "COEP Pune", "state": "Maharashtra", "type": "degree", "region": "West", "aicte": "MH003"},
    # Karnataka
    {"name": "RV College Bengaluru", "state": "Karnataka", "type": "degree", "region": "South", "aicte": "KA001"},
    {"name": "BMS College Bengaluru", "state": "Karnataka", "type": "degree", "region": "South", "aicte": "KA002"},
    {"name": "NMIT Bengaluru", "state": "Karnataka", "type": "degree", "region": "South", "aicte": "KA003"},
    # Tamil Nadu
    {"name": "SSN College Chennai", "state": "Tamil Nadu", "type": "degree", "region": "South", "aicte": "TN001"},
    {"name": "PSG Tech Coimbatore", "state": "Tamil Nadu", "type": "degree", "region": "South", "aicte": "TN002"},
    {"name": "Amrita Coimbatore", "state": "Tamil Nadu", "type": "degree", "region": "South", "aicte": "TN003"},
    # Telangana
    {"name": "CBIT Hyderabad", "state": "Telangana", "type": "degree", "region": "South", "aicte": "TS001"},
    {"name": "JNTU Hyderabad", "state": "Telangana", "type": "degree", "region": "South", "aicte": "TS002"},
    {"name": "Osmania Engineering", "state": "Telangana", "type": "degree", "region": "South", "aicte": "TS003"},
    # Gujarat
    {"name": "DDIT Nadiad", "state": "Gujarat", "type": "degree", "region": "West", "aicte": "GJ001"},
    {"name": "LDRP Gandhinagar", "state": "Gujarat", "type": "degree", "region": "West", "aicte": "GJ002"},
    {"name": "GEC Surat", "state": "Gujarat", "type": "degree", "region": "West", "aicte": "GJ003"},
]

# Programme templates (intake, level, mode)
PROGRAMME_TEMPLATES = [
    {"course": "B.Tech CSE", "level": "UG", "mode": "regular", "intake": 120},
    {"course": "B.Tech ECE", "level": "UG", "mode": "regular", "intake": 60},
    {"course": "MBA", "level": "PG", "mode": "regular", "intake": 60},
]

SEAT_CATEGORIES = ["GEN", "OBC", "SC", "ST", "EWS"]
SEAT_WEIGHTS = [0.50, 0.27, 0.10, 0.07, 0.06]


def _random_id() -> str:
    """Generate a synthetic 12-digit ID (not a real APAAR range)."""
    return str(RNG.randint(100_000_000_000, 899_999_999_999))


def _assurance_tier_for_id(raw_id: str, id_type: str) -> str:
    result = verify_with_registry(raw_id, id_type)
    return result["assurance_tier"]


def _seat_category() -> str:
    return RNG.choices(SEAT_CATEGORIES, weights=SEAT_WEIGHTS, k=1)[0]


# ---------------------------------------------------------------------------
# Setup: create tables and seed institutions + programmes
# ---------------------------------------------------------------------------

def setup_institutions(db: Session) -> dict[str, tuple[Institution, list[Program]]]:
    """
    Create institution and programme records. Returns a mapping of
    AICTE perm ID → (Institution, [Programs]).
    """
    result = {}
    for inst_data in INSTITUTIONS:
        inst = Institution(
            aicte_perm_id=inst_data["aicte"],
            name=inst_data["name"],
            state=inst_data["state"],
            institution_type=inst_data["type"],
            region=inst_data["region"],
        )
        db.add(inst)
        db.flush()

        programs = []
        for tmpl in PROGRAMME_TEMPLATES:
            # Vary intake slightly per institution to make the data realistic
            intake_variation = RNG.choice([-20, 0, 0, 20, 40])
            intake = max(30, tmpl["intake"] + intake_variation)

            prog = Program(
                institution_id=inst.id,
                course=tmpl["course"],
                level=tmpl["level"],
                mode=tmpl["mode"],
                affiliating_body="AICTE",
            )
            db.add(prog)
            db.flush()

            db.add(IntakeApproval(
                program_id=prog.id,
                academic_year=COHORT_YEAR,
                approved_intake=intake,
                counting_rule_version="v1.0",
            ))
            programs.append(prog)

        db.commit()
        result[inst_data["aicte"]] = (inst, programs)

    return result


# ---------------------------------------------------------------------------
# Enrolment generation
# ---------------------------------------------------------------------------

def enrol_students(
    db: Session,
    institution: Institution,
    program: Program,
    count: int,
    batch_id: int,
    specific_ids: list[str] | None = None,
) -> list[tuple[str, str]]:
    """
    Create `count` enrolment records for an institution-programme.
    Returns list of (raw_id, student_token) for use in anomaly injection.

    specific_ids: optional list of raw IDs to use (for anomaly scenarios).
                  If shorter than count, random IDs fill the rest.
    """
    id_pool = list(specific_ids or [])
    while len(id_pool) < count:
        id_pool.append(_random_id())

    tokens_created = []
    for raw_id in id_pool[:count]:
        # Mix of id_types following the 70/20/10 split
        roll = RNG.random()
        if roll < 0.70:
            id_type = "APAAR"
        elif roll < 0.90:
            id_type = "INST"
        else:
            id_type = "OTHER"

        # Registry lookup (deterministic based on ID prefix)
        reg_result = verify_with_registry(raw_id, id_type)
        assurance_tier = reg_result["assurance_tier"]

        # Tokenize — the raw ID is discarded after this line
        student_token = tokenize(raw_id, id_type, COHORT_YEAR)

        db.add(Enrolment(
            institution_id=institution.id,
            program_id=program.id,
            cohort_year=COHORT_YEAR,
            student_token=student_token,
            id_type=id_type,
            assurance_tier=assurance_tier,
            mode="regular",
            seat_category=_seat_category(),
            status="active",
            batch_id=batch_id,
        ))

        tokens_created.append((raw_id, student_token))
        # raw_id goes out of scope at the end of the loop iteration

    db.commit()
    return tokens_created


# ---------------------------------------------------------------------------
# Anomaly injection
# ---------------------------------------------------------------------------

def inject_r1_duplicates(
    db: Session,
    inst_prog_map: dict,
    ground_truth: dict,
    batch_ids: dict,
) -> list[dict]:
    """
    R1: 5 cross-institution duplicate seals.
    Same raw ID enrolled at two different institutions.
    """
    records = []
    inst_keys = list(inst_prog_map.keys())

    # Pick 5 distinct pairs of institutions
    pairs = RNG.sample(
        [(inst_keys[i], inst_keys[j]) for i in range(len(inst_keys)) for j in range(i+1, len(inst_keys))],
        5,
    )

    for aicte_a, aicte_b in pairs:
        inst_a, progs_a = inst_prog_map[aicte_a]
        inst_b, progs_b = inst_prog_map[aicte_b]
        prog_a = progs_a[0]  # B.Tech CSE
        prog_b = progs_b[0]

        raw_id = _random_id()
        token = tokenize(raw_id, "APAAR", COHORT_YEAR)

        for inst, prog, batch_id in [(inst_a, prog_a, batch_ids[aicte_a]), (inst_b, prog_b, batch_ids[aicte_b])]:
            db.add(Enrolment(
                institution_id=inst.id,
                program_id=prog.id,
                cohort_year=COHORT_YEAR,
                student_token=token,
                id_type="APAAR",
                assurance_tier="verified",
                mode="regular",
                seat_category="GEN",
                status="active",
                batch_id=batch_id,
            ))

        records.append({
            "rule": "R1",
            "student_token": token,
            "institution_a": inst_a.name,
            "institution_b": inst_b.name,
        })
        # raw_id is no longer needed — let it go out of scope

    db.commit()
    ground_truth.setdefault("R1", []).extend(records)
    return records


def inject_r2_duplicates(
    db: Session,
    inst_prog_map: dict,
    ground_truth: dict,
    batch_ids: dict,
) -> list[dict]:
    """
    R2: 3 same-institution duplicates (one seal in two programmes).
    """
    records = []
    aicte_keys = list(inst_prog_map.keys())[:3]  # first 3 institutions

    for aicte in aicte_keys:
        inst, progs = inst_prog_map[aicte]
        if len(progs) < 2:
            continue

        raw_id = _random_id()
        token = tokenize(raw_id, "APAAR", COHORT_YEAR)

        for prog in progs[:2]:  # enrol in first two programmes of the same institution
            db.add(Enrolment(
                institution_id=inst.id,
                program_id=prog.id,
                cohort_year=COHORT_YEAR,
                student_token=token,
                id_type="APAAR",
                assurance_tier="verified",
                mode="regular",
                seat_category="GEN",
                status="active",
                batch_id=batch_ids[aicte],
            ))

        records.append({
            "rule": "R2",
            "student_token": token,
            "institution": inst.name,
            "programmes": [p.course for p in progs[:2]],
        })

    db.commit()
    ground_truth.setdefault("R2", []).extend(records)
    return records


def inject_r3_overrun(
    db: Session,
    inst_prog_map: dict,
    ground_truth: dict,
    batch_ids: dict,
):
    """
    R3: 2 intake overruns — enrol 130% of approved intake.
    """
    overrun_targets = ["MH001", "KA001"]  # MIT Pune and RV College
    for aicte in overrun_targets:
        inst, progs = inst_prog_map[aicte]
        prog = progs[0]  # B.Tech CSE

        approval = (
            db.query(IntakeApproval)
            .filter(
                IntakeApproval.program_id == prog.id,
                IntakeApproval.academic_year == COHORT_YEAR,
            )
            .first()
        )
        extra = int(approval.approved_intake * 0.30) + 1  # enough to exceed by 30%

        for _ in range(extra):
            raw_id = _random_id()
            token = tokenize(raw_id, "APAAR", COHORT_YEAR)
            db.add(Enrolment(
                institution_id=inst.id,
                program_id=prog.id,
                cohort_year=COHORT_YEAR,
                student_token=token,
                id_type="APAAR",
                assurance_tier="verified",
                mode="regular",
                seat_category="GEN",
                status="active",
                batch_id=batch_ids[aicte],
            ))

        ground_truth.setdefault("R3", []).append({
            "rule": "R3",
            "institution": inst.name,
            "programme": prog.course,
            "approved_intake": approval.approved_intake,
            "extra_seats": extra,
        })

    db.commit()


def inject_r4_burst(
    db: Session,
    inst_prog_map: dict,
    ground_truth: dict,
    batch_ids: dict,
):
    """
    R4: 1 institution uploads 3x the normal volume in a single batch.
    We simulate this by making its batch row_count very large.
    """
    aicte = "TN001"  # SSN College Chennai
    inst, progs = inst_prog_map[aicte]
    batch = db.get(Batch, batch_ids[aicte])

    # The actual enrolments are already inserted by the normal flow.
    # For burst detection we inflate the batch's row count artificially.
    # In a real attack, the attacker would have submitted the CSV.
    original = batch.rows_accepted
    batch.rows_accepted = original * 3
    batch.rows_total = batch.rows_accepted

    db.commit()

    ground_truth.setdefault("R4", []).append({
        "rule": "R4",
        "institution": inst.name,
        "batch_id": batch_ids[aicte],
        "inflated_count": batch.rows_accepted,
    })


def inject_r5_low_verification(
    db: Session,
    inst_prog_map: dict,
    ground_truth: dict,
):
    """
    R5: 1 institution has only ~10% verified seats.
    Set most of their enrolments to 'pending' assurance tier.
    """
    aicte = "GJ001"  # DDIT Nadiad
    inst, progs = inst_prog_map[aicte]

    enrolments = (
        db.query(Enrolment)
        .filter(
            Enrolment.institution_id == inst.id,
            Enrolment.cohort_year == COHORT_YEAR,
        )
        .all()
    )

    # Keep only 10% as verified; downgrade the rest to pending
    cutoff = max(1, int(len(enrolments) * 0.10))
    for i, e in enumerate(enrolments):
        if i >= cutoff:
            e.assurance_tier = "pending"
            e.id_type = "INST"

    db.commit()

    ground_truth.setdefault("R5", []).append({
        "rule": "R5",
        "institution": inst.name,
        "verified_share": round(cutoff / max(len(enrolments), 1), 2),
        "total_enrolments": len(enrolments),
    })


def inject_r6_cluster(
    db: Session,
    inst_prog_map: dict,
    ground_truth: dict,
    batch_ids: dict,
):
    """
    R6: 1 institution uploads 20 records with identical attributes.
    """
    aicte = "TS001"  # CBIT Hyderabad
    inst, progs = inst_prog_map[aicte]
    prog = progs[1]  # B.Tech ECE

    for _ in range(20):
        raw_id = _random_id()
        token = tokenize(raw_id, "APAAR", COHORT_YEAR)
        db.add(Enrolment(
            institution_id=inst.id,
            program_id=prog.id,
            cohort_year=COHORT_YEAR,
            student_token=token,
            id_type="APAAR",
            assurance_tier="verified",
            mode="regular",
            seat_category="GEN",  # all identical — that's the point
            status="active",
            batch_id=batch_ids[aicte],
        ))

    db.commit()

    ground_truth.setdefault("R6", []).append({
        "rule": "R6",
        "institution": inst.name,
        "programme": prog.course,
        "cluster_size": 20,
        "mode": "regular",
        "seat_category": "GEN",
    })


# ---------------------------------------------------------------------------
# Demo personas
# ---------------------------------------------------------------------------

def create_personas(
    db: Session,
    inst_prog_map: dict,
    batch_ids: dict,
) -> dict:
    """
    Create 4 named demo personas for the presentation.
    Their tokens are derived from phone numbers (same as auth.py does it).
    """
    import hmac
    import hashlib
    import base64

    secret = os.environ.get("SAKSHI_TOKEN_SECRET", "sakshi-dev-secret-change-in-prod")

    def phone_token(phone: str) -> str:
        digest = hmac.new(secret.encode(), f"phone:{phone}".encode(), hashlib.sha256).digest()
        return "STU-" + base64.b32encode(digest[:8]).decode().rstrip("=")

    personas = {}

    # --- Asha: opted-out student, enrolled at MIT Pune B.Tech CSE ---
    asha_token = phone_token("9876543001")
    mit_inst, mit_progs = inst_prog_map["MH001"]
    cse_prog = mit_progs[0]

    db.add(Enrolment(
        institution_id=mit_inst.id,
        program_id=cse_prog.id,
        cohort_year=COHORT_YEAR,
        student_token=asha_token,
        id_type="INST",          # opted out of APAAR — institution-issued ID
        assurance_tier="attested",
        mode="regular",
        seat_category="GEN",
        status="active",
        batch_id=batch_ids["MH001"],
    ))
    personas["asha"] = {
        "name": "Asha",
        "phone": "9876543001",  # shown in demo script only, never stored in DB
        "student_token": asha_token,
        "institution": mit_inst.name,
        "programme": cse_prog.course,
        "cohort_year": COHORT_YEAR,
        "assurance_tier": "attested",
        "note": "Opted out of APAAR. Uses institution-issued ID. Enrolled at MIT Pune.",
    }

    # --- Ravi: cross-institution duplicate (MIT Pune AND VIT — we'll use KA001) ---
    ravi_token = phone_token("9876543002")
    ka_inst, ka_progs = inst_prog_map["KA001"]
    ka_cse = ka_progs[0]

    # Enrol Ravi at MIT Pune
    db.add(Enrolment(
        institution_id=mit_inst.id,
        program_id=cse_prog.id,
        cohort_year=COHORT_YEAR,
        student_token=ravi_token,
        id_type="APAAR",
        assurance_tier="verified",
        mode="regular",
        seat_category="GEN",
        status="active",
        batch_id=batch_ids["MH001"],
    ))
    # Also enrol Ravi at RV College (the cross-institution duplicate)
    db.add(Enrolment(
        institution_id=ka_inst.id,
        program_id=ka_cse.id,
        cohort_year=COHORT_YEAR,
        student_token=ravi_token,
        id_type="APAAR",
        assurance_tier="verified",
        mode="regular",
        seat_category="GEN",
        status="active",
        batch_id=batch_ids["KA001"],
    ))
    personas["ravi"] = {
        "name": "Ravi",
        "phone": "9876543002",
        "student_token": ravi_token,
        "institutions": [mit_inst.name, ka_inst.name],
        "programme": cse_prog.course,
        "cohort_year": COHORT_YEAR,
        "assurance_tier": "verified",
        "note": "Cross-institution duplicate. Same seal at MIT Pune and RV College Bengaluru.",
    }

    # --- Meera: ghost enrolment scenario (enrolled somewhere she never joined) ---
    meera_token = phone_token("9876543003")
    tn_inst, tn_progs = inst_prog_map["TN001"]  # SSN College Chennai
    tn_cse = tn_progs[0]

    db.add(Enrolment(
        institution_id=tn_inst.id,
        program_id=tn_cse.id,
        cohort_year=COHORT_YEAR,
        student_token=meera_token,
        id_type="APAAR",
        assurance_tier="verified",
        mode="regular",
        seat_category="OBC",
        status="active",  # she'll raise a dispute
        batch_id=batch_ids["TN001"],
    ))
    personas["meera"] = {
        "name": "Meera",
        "phone": "9876543003",
        "student_token": meera_token,
        "institution": tn_inst.name,
        "programme": tn_cse.course,
        "cohort_year": COHORT_YEAR,
        "assurance_tier": "verified",
        "note": "Ghost enrolment scenario. Meera never joined SSN College. She will raise a dispute.",
    }

    db.commit()

    # Issue a credential for Ravi (employer scenario)
    ravi_cred = issue_credential(
        student_token=ravi_token,
        program_id=cse_prog.id,
        cohort_year=COHORT_YEAR,
        assurance_tier="verified",
        db=db,
        issued_by="seed",
    )

    personas["employer_scenario"] = {
        "description": "An employer wants to verify Ravi's credential",
        "credential_handle": ravi_cred["handle"],
        "verify_url": ravi_cred["verify_url"],
        "note": "Use this handle at GET /v1/verify/{handle} to demo the employer BGV flow",
    }

    return personas


# ---------------------------------------------------------------------------
# Main seed function
# ---------------------------------------------------------------------------

def run_seed():
    print("=" * 60)
    print("SAKSHI Seed Script")
    print("=" * 60)

    # Create all tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(Institution).count() > 0:
            print("Database already seeded. Delete sakshi.db to re-seed.")
            return

        print("\n[1/7] Creating institutions and programmes...")
        inst_prog_map = setup_institutions(db)
        print(f"      Created {len(inst_prog_map)} institutions with 3 programmes each")

        # Create a batch per institution (for audit trail)
        print("\n[2/7] Creating enrolment batches...")
        batch_ids: dict[str, int] = {}
        for aicte, (inst, progs) in inst_prog_map.items():
            batch = Batch(
                institution_id=inst.id,
                uploaded_by_role="institution",
                cohort_year=COHORT_YEAR,
                status="done",
            )
            db.add(batch)
            db.flush()
            batch_ids[aicte] = batch.id
        db.commit()

        print("\n[3/7] Enrolling students (85% fill rate per programme)...")
        total_enrolled = 0
        for aicte, (inst, progs) in inst_prog_map.items():
            for prog in progs:
                approval = (
                    db.query(IntakeApproval)
                    .filter(
                        IntakeApproval.program_id == prog.id,
                        IntakeApproval.academic_year == COHORT_YEAR,
                    )
                    .first()
                )
                fill_count = int(approval.approved_intake * 0.85)
                enrol_students(db, inst, prog, fill_count, batch_ids[aicte])
                total_enrolled += fill_count

        print(f"      Enrolled {total_enrolled} students across all institutions")

        # Update batch row counts
        for aicte, (inst, _progs) in inst_prog_map.items():
            batch = db.get(Batch, batch_ids[aicte])
            count = (
                db.query(Enrolment)
                .filter(Enrolment.batch_id == batch.id)
                .count()
            )
            batch.rows_total = count
            batch.rows_accepted = count
        db.commit()

        # --- Inject anomalies ---
        print("\n[4/7] Injecting anomalies...")
        ground_truth: dict = {}

        r1 = inject_r1_duplicates(db, inst_prog_map, ground_truth, batch_ids)
        print(f"      R1: {len(r1)} cross-institution duplicates injected")

        r2 = inject_r2_duplicates(db, inst_prog_map, ground_truth, batch_ids)
        print(f"      R2: {len(r2)} same-institution duplicates injected")

        inject_r3_overrun(db, inst_prog_map, ground_truth, batch_ids)
        print("      R3: 2 intake overruns injected")

        inject_r4_burst(db, inst_prog_map, ground_truth, batch_ids)
        print("      R4: 1 burst-upload pattern injected")

        inject_r5_low_verification(db, inst_prog_map, ground_truth)
        print("      R5: 1 low-verification institution configured")

        inject_r6_cluster(db, inst_prog_map, ground_truth, batch_ids)
        print("      R6: 1 identical-record cluster injected (20 rows)")

        # --- Create demo personas ---
        print("\n[5/7] Creating demo personas (Asha, Ravi, Meera, Employer)...")
        personas = create_personas(db, inst_prog_map, batch_ids)
        print(f"      Created {len([k for k in personas if k != 'employer_scenario'])} persona enrolments")
        print(f"      Ravi's credential handle: {personas['employer_scenario']['credential_handle']}")

        # --- Run rules ---
        print("\n[6/7] Running detection rules...")
        from rules import run_all_rules, persist_flags
        results = run_all_rules(db=db, cohort_year=COHORT_YEAR)
        count = persist_flags(db=db, results=results)
        print(f"      {count} flags created")

        # --- Compute integrity scores ---
        print("\n[7/7] Computing integrity scores...")
        score_count = 0
        for aicte, (inst, progs) in inst_prog_map.items():
            for prog in progs:
                try:
                    compute_integrity_score(inst.id, prog.id, COHORT_YEAR, db)
                    score_count += 1
                except Exception as e:
                    print(f"      Warning: score computation failed for {inst.name}/{prog.course}: {e}")
        print(f"      {score_count} integrity scores computed")

        # --- Write ground truth file ---
        gt_path = _SEED_DIR / "ground_truth.json"
        gt_path.write_text(json.dumps(ground_truth, indent=2))
        print(f"\n      Ground truth written to: {gt_path}")

        # --- Write personas file ---
        personas_path = _SEED_DIR / "personas.json"
        # Strip any phone fields before saving (belt and suspenders)
        safe_personas = {}
        for k, v in personas.items():
            safe_personas[k] = {kk: vv for kk, vv in v.items() if kk != "phone"}
        personas_path.write_text(json.dumps(safe_personas, indent=2))
        print(f"      Personas written to: {personas_path}")

        # Final summary
        print("\n" + "=" * 60)
        print("Seed complete!")
        print(f"  Institutions : {db.query(Institution).count()}")
        print(f"  Programmes   : {db.query(Program).count()}")
        print(f"  Enrolments   : {db.query(Enrolment).count()}")
        print(f"  Credentials  : {db.query(Credential).count()}")
        print(f"  Flags        : {db.query(Flag).count()}")
        print(f"  Int. Scores  : {db.query(IntegrityScore).count()}")
        print("=" * 60)

        print("\nDemo personas for the presentation:")
        for k, p in personas.items():
            if k == "employer_scenario":
                print(f"\n  Employer scenario:")
                print(f"    Verify URL: {p['verify_url']}")
            else:
                print(f"\n  {p['name']} — {p['note']}")

    except Exception as exc:
        db.rollback()
        print(f"\nSeed failed: {exc}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
