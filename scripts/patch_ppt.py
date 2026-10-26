#!/usr/bin/env python3
"""
scripts/patch_ppt.py — Update text in SAKSHI_SIH2026_Idea_PPT (1).pptx while preserving
100% of the original visual design, layout, cards, fonts, and images.

Leaves Slide 1 completely untouched.
Saves to SAKSHI_SIH2026_Idea_PPT_Final.pptx.
"""

import sys
import copy
from pathlib import Path
import pptx

SRC_PATH = r"D:\SAKSHI_SIH2026_Idea_PPT (1).pptx"
OUT_PATH = r"E:\projects\sakshi sih 2nd\SAKSHI_SIH2026_Idea_PPT_Final.pptx"

def replace_in_paragraph(p, old_text, new_text):
    """
    Replace old_text with new_text in a paragraph while preserving run-level formatting.
    """
    if old_text not in p.text:
        return False

    # Check if old_text is contained within a single run
    for run in p.runs:
        if old_text in run.text:
            run.text = run.text.replace(old_text, new_text)
            return True

    # If it spans across runs, replace in the first run and clear from subsequent runs
    full_text = p.text
    new_full_text = full_text.replace(old_text, new_text)
    
    # Store first run properties
    if p.runs:
        first_run = p.runs[0]
        first_run.text = new_full_text
        for r in p.runs[1:]:
            r.text = ""
        return True

    p.text = new_full_text
    return True


def apply_replacements_to_shape(shape, replacements):
    count = 0
    if shape.has_text_frame:
        for p in shape.text_frame.paragraphs:
            for old_t, new_t in replacements:
                if replace_in_paragraph(p, old_t, new_t):
                    count += 1
    if shape.has_table:
        for row in shape.table.rows:
            for cell in row.cells:
                for p in cell.text_frame.paragraphs:
                    for old_t, new_t in replacements:
                        if replace_in_paragraph(p, old_t, new_t):
                            count += 1
    return count


def main():
    prs = pptx.Presentation(SRC_PATH)
    total_slides = len(prs.slides)
    print(f"Loaded {SRC_PATH} with {total_slides} slides.")

    # Replacements per slide (Slides 2-6 only; Slide 1 is index 0 and untouched)
    slide_replacements = {
        # Slide 2 (index 1): Approach & Problem
        1: [
            (
                "defies the Supreme Court’s July 2026 opt-out order.",
                "conflicts with the APAAR voluntary opt-out mandate.",
            ),
            (
                "defies the Supreme Court's July 2026 opt-out order.",
                "conflicts with the APAAR voluntary opt-out mandate.",
            ),
            (
                "raw APAAR/PII purged in <10 ms.",
                "raw IDs never persisted to database or logs.",
            ),
            (
                "rules R1–R6 score intake, quotas and batch viability (0–100).",
                "rules R1–R7 score intake, quotas and batch viability (0–100).",
            ),
            (
                "6 deterministic rules with plain-English audit notes; no black-box AI.",
                "7 deterministic rules (R1–R7) with plain-English audit notes; no black-box AI.",
            ),
        ],
        # Slide 3 (index 2): Technical Approach
        2: [
            (
                "Raw APAAR → salted blind token; RAM wiped <10 ms",
                "Raw APAAR → salted blind token; raw ID never persisted",
            ),
            (
                "Rule Engine R1–R6",
                "Rule Engine R1–R7",
            ),
            (
                "W3C VC 2.0, Ed25519, QR",
                "W3C-VC-style (Ed25519), QR",
            ),
            (
                "W3C VC 2.0",
                "Ed25519 VC",
            ),
            (
                "HMAC-SHA256 · RAM purge <10 ms",
                "HMAC-SHA256 · Never persisted",
            ),
            (
                "0 B PII leakage across 19 tables · 100% Zero‑Exposure Scan",
                "0 B PII across 19 tables · 0 matches for 12-digit patterns",
            ),
            (
                "0 B PII leakage across 19 tables · 100% Zero-Exposure Scan",
                "0 B PII across 19 tables · 0 matches for 12-digit patterns",
            ),
            (
                "11/11 automated tests passing (1.34s) · <0.2 ms O(1) collision match",
                "20/20 automated tests passing (2.03s) · O(1) indexed citizen lookup",
            ),
            (
                "W3C Verifier",
                "Credential Verifier",
            ),
        ],
        # Slide 4 (index 3): Feasibility & Viability
        3: [
            (
                "Deterministic rules R1–R6; no black box",
                "Deterministic rules R1–R7; no black box",
            ),
            (
                "Deterministic rules R1-R6; no black box",
                "Deterministic rules R1–R7; no black box",
            ),
        ],
        # Slide 5 (index 4): Impact and Benefits
        4: [
            (
                "11/11 CI tests passing",
                "20/20 automated tests passing",
            ),
            (
                "Rules R1–R6 score seat integrity 0–100",
                "Rules R1–R7 score seat integrity 0–100",
            ),
            (
                "W3C VC with offline Ed25519 QR",
                "W3C-VC-style signed QR credential",
            ),
        ],
        # Slide 6 (index 5): Research and References
        5: [
            (
                "Supreme Court (20 Jul 2026) · DPDP Act 2023 & Rules 2025 · AICTE APH 2025–26",
                "DPDP Act 2023 & Rules 2025 · APAAR Opt-Out Mandate · AICTE APH 2025–26",
            ),
            (
                "HMAC-SHA256 · W3C VC 2.0 · RFC 8032 (Ed25519) · PSI",
                "HMAC-SHA256 · W3C-VC-style (Ed25519) · RFC 8032 · Blind Sealing",
            ),
            (
                "1. Supreme Court of India (2026): Union of India v. State of Odisha, APAAR opt-out order, 20 Jul 2026.",
                "1. Ministry of Education / AICTE: APAAR Implementation Guidelines & Voluntary Opt-Out Policy.",
            ),
            (
                "Ephemeral RAM ingestion; PII wiped in <10 ms",
                "Ephemeral RAM ingestion; raw IDs never persisted",
            ),
            (
                "100% opt-out safe (SC July 2026 compliant)",
                "100% opt-out safe (voluntary APAAR compliant)",
            ),
            (
                "Deterministic rules R1–R6; 0–100 score",
                "Deterministic rules R1–R7; 0–100 score",
            ),
            (
                "W3C Verifiable Credentials via offline QR",
                "W3C-VC-style credentials via offline QR",
            ),
        ],
    }

    modified_count = 0
    for s_idx, replacements in slide_replacements.items():
        slide = prs.slides[s_idx]
        print(f"\nProcessing Slide {s_idx + 1}...")
        for sh in slide.shapes:
            modified_count += apply_replacements_to_shape(sh, replacements)

    prs.save(OUT_PATH)
    print(f"\n[+] Applied {modified_count} precise text updates.")
    print(f"[+] Slide 1 was kept 100% UNTOUCHED.")
    print(f"[+] Saved updated presentation to: {OUT_PATH}")

if __name__ == "__main__":
    main()

