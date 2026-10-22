# SAKSHI
### Verify student enrolment without collecting student identity.

*SIH26263 · AICTE · Smart Automation · Built for Smart India Hackathon 2026*

---

SAKSHI (Sanskrit for *witness*) is a privacy-first student-enrolment integrity platform. It lets AICTE detect duplicate seats, ghost enrolment, and intake overruns — **without ever storing students' raw identity data**.

> A witness that confirms, never discloses.

---

## How it works in three steps

1. **Verify at the source.** The APAAR ID is checked against the registry once, then immediately discarded.
2. **Seal the identity.** Each ID becomes a unique geometric seal (HMAC token). AICTE stores only the seal, never the name, never the ID.
3. **Detect by seal.** If the same seal appears in two colleges, AICTE knows — but only asks the colleges to confirm. No identity is opened.

---

## Quick start (no Docker needed)

### Prerequisites
- Python 3.11+
- Node 18+

### Backend
```bash
cd api
pip install -r requirements.txt
uvicorn main:app --reload
# Runs at http://localhost:8000
# API docs at http://localhost:8000/docs
```

### Seed demo data (run once)
```bash
python seed/generate.py
# Creates sakshi.db with 15 institutions, ~2,000 students, injected anomalies
```

### Frontend
```bash
cd web
npm install
npm run dev
# Runs at http://localhost:5173
```

### Or run everything with Docker
```bash
docker compose up --build
# API: http://localhost:8000
# Web: http://localhost:5173
```

---

## Demo accounts

| Role | How to log in |
|------|--------------|
| AICTE Officer | `POST /v1/auth/demo-login` with `{"role": "officer"}` |
| Institution | `POST /v1/auth/demo-login` with `{"role": "institution", "institution_id": 1}` |
| Student (Asha) | Mobile: `9876543001`, OTP: any 6 digits |
| Student (Ravi) | Mobile: `9876543002`, OTP: any 6 digits |
| Student (Meera) | Mobile: `9876543003`, OTP: any 6 digits |

---

## The six features

| Feature | Screen | What it shows |
|---------|--------|---------------|
| CSV Upload | `/upload` | Row-level results; raw IDs become seals and are never stored |
| Duplicate Radar | `/radar` | Same seal in two colleges — no name, no ID |
| Integrity Score | `/integrity` | 0–100 score with a plain-English reason for every deduction |
| Enrolment Credential | `/credential` | Signed QR anyone can verify; one-click revoke |
| Citizen Window | `/citizen` | Student sees who checked their record; "This is not me" button |
| Privacy Proof | `/proof` | One button that scans the DB and confirms zero raw IDs |

---

## Demo mode

Click **"Demo mode"** on the home screen for a guided four-story walkthrough:
1. **Asha opts out** — lawful; no fraud flag, seat still counted.
2. **Ravi holds two seats** — Radar shows his seal in both colleges, no name.
3. **Meera finds a ghost** — presses "This is not me"; case appears on regulator queue.
4. **Employer verifies** — QR scan returns "verified" in under a second, no central name lookup.

---

## Privacy guarantee

- Raw APAAR IDs, names, dates of birth, and phone numbers are **never written to the database**.
- The tokeniser sees an ID only in memory during a single request.
- All logs and error messages are sanitised — no ID can leak through.
- Run `GET /v1/system/privacy-proof` at any time to verify: zero 12-digit patterns in any text column.

---

## Architecture

```
Institution CSV
      │
      ▼
┌─────────────────┐    calls    ┌─────────────────┐
│  Ingestion API  │───────────▶│  Mock Registry  │
│  (FastAPI)      │            │  (APAAR stub)   │
└────────┬────────┘            └─────────────────┘
         │ tokenize → seal
         │ discard raw ID
         ▼
┌─────────────────┐
│  SQLite / DB    │  ← tokens only, never names or IDs
│  (enrolments,  │
│   flags, audit) │
└────────┬────────┘
         │
    ┌────┴─────────────────┐
    │         │            │
    ▼         ▼            ▼
 Rules     Scoring      Audit log
 R1–R6    (0–100)     (hash-chained)
    │         │
    ▼         ▼
 React frontend (seals, radar, scores, citizen window)
```

---

## What we did NOT build (intentional)

- No chatbot or LLM for decisions (rules decide; AI only explains in plain English)
- No blockchain
- No biometric capture
- No real APAAR registry integration (documented adapter interface provided)
- No automated penalties (every flag requires human review)

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Backend | Python 3.11, FastAPI, SQLAlchemy, SQLite |
| Crypto | Python `hmac`/`hashlib`, `cryptography` (Ed25519 for credentials) |
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion |
| Icons | Lucide React |
| QR | `qrcode` (Python), `qrcode.react` (frontend) |

---

## Tests

```bash
cd api && python -m pytest tests/ -v
```

Key tests:
- `test_privacy.py` — zero raw IDs in DB; no PII column names in models
- `test_audit.py` — tampered audit row breaks chain verification

---

## Disclaimer

This is a **hackathon prototype** using **100% synthetic data**. No real student records, APAAR IDs, or Aadhaar numbers are used or stored. The mock registry is not connected to any government system.

---

*Built for SIH26263 · AICTE · October 2026*

