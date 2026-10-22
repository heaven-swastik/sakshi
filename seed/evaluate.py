"""
evaluate.py — Evaluate detection rules precision & recall against ground truth.

Strict hackathon rule: Never hardcode or invent benchmark numbers.
This script executes live queries against the seeded database and ground_truth.json
and prints real, measured metrics.
"""

import sys
import os
import json

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "api"))

from db import SessionLocal
from models import Flag, Enrolment, Institution, Program


def evaluate():
    gt_path = os.path.join(os.path.dirname(__file__), "ground_truth.json")
    if not os.path.exists(gt_path):
        print("ground_truth.json not found. Run generate.py first.")
        return

    with open(gt_path, "r", encoding="utf-8") as f:
        ground_truth = json.load(f)

    db = SessionLocal()
    try:
        flags = db.query(Flag).all()
        print(f"\n============================================================")
        print(f" SAKSHI Rule Engine Evaluation (Measured)")
        print(f"============================================================")
        print(f" Total flags raised by engine : {len(flags)}")

        rule_counts = {}
        for fl in flags:
            rule_counts[fl.rule_id] = rule_counts.get(fl.rule_id, 0) + 1

        print("\n Flags by Rule:")
        for r in sorted(rule_counts.keys()):
            print(f"   {r}: {rule_counts[r]} flags")

        # Evaluate R1
        gt_r1 = ground_truth.get("R1", [])
        gt_r1_tokens = {item["student_token"] for item in gt_r1}
        # Include Ravi if present in personas
        personas_path = os.path.join(os.path.dirname(__file__), "personas.json")
        if os.path.exists(personas_path):
            with open(personas_path, "r", encoding="utf-8") as pf:
                p_data = json.load(pf)
                if "ravi" in p_data:
                    gt_r1_tokens.add(p_data["ravi"]["student_token"])

        r1_flags = [f for f in flags if f.rule_id == "R1"]
        detected_r1_tokens = {f.student_token_ref for f in r1_flags}

        tp_r1 = len(gt_r1_tokens.intersection(detected_r1_tokens))
        fp_r1 = len(detected_r1_tokens - gt_r1_tokens)
        fn_r1 = len(gt_r1_tokens - detected_r1_tokens)

        prec_r1 = tp_r1 / (tp_r1 + fp_r1) if (tp_r1 + fp_r1) > 0 else 0.0
        rec_r1 = tp_r1 / (tp_r1 + fn_r1) if (tp_r1 + fn_r1) > 0 else 0.0

        print("\n Rule R1 (Cross-Institution Duplicate Detection):")
        print(f"   Ground Truth Injected : {len(gt_r1_tokens)}")
        print(f"   True Positives (TP)   : {tp_r1}")
        print(f"   False Positives (FP)  : {fp_r1}")
        print(f"   False Negatives (FN)  : {fn_r1}")
        print(f"   Precision             : {prec_r1 * 100:.1f}%")
        print(f"   Recall                : {rec_r1 * 100:.1f}%")

        # Evaluate R2
        gt_r2 = ground_truth.get("R2", [])
        gt_r2_tokens = {item["student_token"] for item in gt_r2}
        r2_flags = [f for f in flags if f.rule_id == "R2"]
        detected_r2_tokens = {f.student_token_ref for f in r2_flags}

        tp_r2 = len(gt_r2_tokens.intersection(detected_r2_tokens))
        fp_r2 = len(detected_r2_tokens - gt_r2_tokens)
        fn_r2 = len(gt_r2_tokens - detected_r2_tokens)

        prec_r2 = tp_r2 / (tp_r2 + fp_r2) if (tp_r2 + fp_r2) > 0 else 0.0
        rec_r2 = tp_r2 / (tp_r2 + fn_r2) if (tp_r2 + fn_r2) > 0 else 0.0

        print("\n Rule R2 (Same-Institution Double Entry):")
        print(f"   Ground Truth Injected : {len(gt_r2_tokens)}")
        print(f"   True Positives (TP)   : {tp_r2}")
        print(f"   False Positives (FP)  : {fp_r2}")
        print(f"   Precision             : {prec_r2 * 100:.1f}%")
        print(f"   Recall                : {rec_r2 * 100:.1f}%")

        print(f"============================================================\n")

    finally:
        db.close()


if __name__ == "__main__":
    evaluate()

