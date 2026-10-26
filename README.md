<div align="center">

# SAKSHI (साक्षी)
### *A witness that confirms, never discloses.*

**Privacy-Preserving Student Enrolment Verification & Institutional Seat Integrity Platform**  
**Smart India Hackathon 2026 · Problem Statement SIH26263 · Ministry of Education / AICTE**  
**Theme: Smart Automation · Category: Software · Team Sudo Winners (Team ID: 145609)**

<br/>

[![Live Production App](https://img.shields.io/badge/Live%20Demo-sakshi--opal--five.vercel.app-0284c7?style=for-the-badge&logo=vercel)](https://sakshi-opal-five.vercel.app)
[![API Documentation](https://img.shields.io/badge/FastAPI-Swagger%20UI-10b981?style=for-the-badge&logo=fastapi)](https://sakshi-opal-five.vercel.app)
[![Pytest Suite](https://img.shields.io/badge/Pytest-20%20Passed-emerald?style=for-the-badge&logo=pytest)](file:///api/tests)
[![Privacy Covenant](https://img.shields.io/badge/Zero%20Raw%20PII-19%20Tables%20Scrubbed-purple?style=for-the-badge&logo=shield)](file:///docs/FEATURES.md)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

</div>

---

> **Prototype Notice:** This repository is an engineering demonstration prototype operating on synthetic ground-truth data (15 institutions, 3,333 seats) and a mock APAAR registry adapter. It demonstrates mathematical and architectural feasibility without accessing live government databases.

---

## Quick Navigation

- [Implemented vs Planned Capabilities](#implemented-vs-planned)
- [Features & Innovation](#features--innovation)
- [System Architecture & Visual Diagrams](#system-architecture--visual-diagrams)
- [Performance & Benchmarks](#performance--benchmarks)
- [Security, Privacy & Secrets](#security-privacy--secrets)
- [Offline Credential Verification](#offline-credential-verification)
- [Interactive System Walkthrough](#interactive-system-walkthrough)
- [Local Setup & Testing](#local-setup--testing)
- [Team Sudo Winners](#team-sudo-winners)

---

## Implemented vs Planned

| Capability | Status | Implementation Details in Repo |
|---|---|---|
| **Blind Seals (HMAC-SHA256)** | **[Implemented]** | Keyed one-way pseudonymization; identical student gets same token across colleges without unmasking ID. |
| **Deterministic Rule Engine (R1–R7)** | **[Implemented]** | Seven pure-Python versioned rules catching cross-college duplicates, branch overruns, bursts, and quota anomalies. |
| **Duplicate Radar** | **[Implemented]** | Real-time cross-institutional collision matching; automatically excludes withdrawn-consent seats. |
| **Tamper-Evident Audit Chain** | **[Implemented]** | Append-only SHA-256 hash-chained ledger; daily Merkle roots signed with Ed25519. |
| **Verifiable Enrolment Credentials** | **[Implemented]** | W3C-VC-style signed credentials (Ed25519) with tamper-proof QR code, public verification API, and offline verification CLI. |
| **Citizen Portal & Signed Disputes** | **[Implemented]** | Student-facing window with cryptographically signed "This is not me" disputes and consent withdrawal. |
| **Tripartite Dual-Control Reveal** | **[Implemented]** | Tripartite 3-way reveal (`/v1/regulator/reveal/request`, `/v1/college/reveal/approve`, `/v1/student/reveal/consent`); unsealed only upon tripartite approval; no raw IDs stored. |
| **Pattern-Based Privacy Probe** | **[Implemented]** | Automated scan verifying `"0 matches for 12-digit patterns across 19 tables"`. |
| **Live APAAR / DigiLocker Adapter** | **[Planned]** | Direct API adapter replacing synthetic mock adapter in Phase 2 pilot upon MoE clearance. |
| **Hardware Security Module (HSM / KMS)** | **[Planned]** | Hardware-isolated envelope encryption for HMAC secrets and Ed25519 signing keys. |
| **PostgreSQL Partitioned Cluster** | **[Planned]** | Migration from local SQLite WAL to horizontally partitioned PostgreSQL for 10M+ national scale. |

---

## Features & Innovation

### 1. One-line pitch
SAKSHI (साक्षी, "the witness") lets AICTE verify that enrolments are genuine and catch double or ghost seats **without ever collecting or storing a student's identity.**

### 2. The problem (India, AICTE)
| # | Problem | Today |
|---|---|---|
| 1 | Double seats | One student holds seats in several colleges across counselling rounds |
| 2 | Ghost seats | Seats filled on paper by students who never joined |
| 3 | Over the limit | More students admitted than the approved intake |
| 4 | Information gap | Colleges report only totals; nobody can see who is behind the number |
| 5 | Legal trap | A central database of student IDs risks DPDP Act 2023 penalties (up to ₹250 Cr) and conflicts with the APAAR opt-out order (verify the exact citation before printing it) |

### 3. Solution flow
`College CSV → Gateway (check ID once, in memory) → Blind seal (keyed HMAC-SHA256) → Seal ledger (no names, no IDs) → Rule engine R1–R7 → Radar / Dashboard / Student window / QR credential → Audit chain`

### 4. Key innovations (the novelty)
1. **Blind seals [Implemented]** — a keyed one-way token (HMAC-SHA256). The same student gets the same seal in every college, so duplicates are found, but the seal cannot be turned back into the ID. Secret comes from env (KMS/HSM in production).
2. **Verify without collecting [Implemented]** — the raw ID is checked against the registry and used only to make the seal; raw IDs are never persisted or logged. A live probe searches all tables for a given ID and reports matches (pattern check, see §6).
3. **Opt-out safe [Implemented]** — students without an APAAR ID are counted as "attested by college", never flagged as fraud. Enrolments with withdrawn consent (`assurance_tier == "pending"`) are counted in institutional intake totals but strictly excluded from cross-college token matching (Rule R1) and the duplicate radar.
4. **Ask the owner, not a database [Implemented]** — for a duplicate, AICTE sends a notice to both colleges (`/v1/radar/inquiry`) instead of unmasking anyone; the inquiry is written to the audit chain.
5. **Student in the loop [Implemented]** — the Citizen Window lists a student's own seats; "This is not me" files a cryptographically signed dispute (`/v1/student/me/disputes`); consent can be withdrawn.
6. **Explainable rules, no black box [Implemented]** — seven deterministic rules (R1–R7), each flag carries a plain-English reason; a person decides, the system never auto-closes.
7. **Published scoring formula [Implemented]** — integrity score = 100 minus weighted penalties (overrun is the heaviest); each component is shown separately.
8. **Tamper-evident audit chain [Implemented]** — each entry hashes the previous one; `/v1/audit/verify` checks the chain; a daily signed root anchor is exposed at `/v1/audit/daily-root`.
9. **Signed QR credential [Implemented]** — W3C-VC-style signed credential (Ed25519) with tamper-proof QR code, public verification endpoint (`/v1/credentials/verify`), public key export (`/v1/credentials/public-key`), cryptographic revocation checking, and an offline verification CLI script (`verify_offline.py`).
10. **Dual-control identity reveal [Implemented]** — Tripartite reveal workflow (`/v1/regulator/reveal/request`, `/v1/college/reveal/approve`, `/v1/student/reveal/consent`) where an identity is unsealed only when regulator, college, and student all cryptographically approve. Each step appends to the immutable audit chain. No raw ID is stored by AICTE; the college re-derives the token locally and confirms with `match: true`.

### 5. Features by user
**AICTE regulator** — national overview (seats, institutions, flags) · duplicate radar · institution integrity scores · quota ledger (NRI / OCI / FN / supernumerary) · season replay · accreditation report · case opening from a flag · inquiry to both colleges · privacy proof console · tripartite reveal coordination.  
**College registrar** — CSV upload with live batch report (verified / attested / rejected, reason per row) · download batch report · enrolment updates · reveal request approval.  
**Student** — own records · dispute · consent withdrawal · QR credential · reveal consent approval.  
**Employer / public** — scan QR → verified / revoked page with no name lookup · offline signature verification via `verify_offline.py`.  
**Everyone** — role switcher (AICTE / College / Student), English + Hindi UI, guided 2-minute story, status footer with audit count.

### 6. Rule engine
| Rule | What it catches | Detection Logic & Impact |
|---|---|---|
| **R1** | Cross-institution duplicate | Same student seal active across $\ge 2$ different colleges in the same cohort |
| **R2** | Intra-institution duplicate | Same student seal enrolled twice across different programmes in the same college |
| **R3** | Approved intake overrun | Enrolment volume exceeds AICTE-sanctioned branch intake ceiling |
| **R4** | Burst upload anomaly | Batch upload velocity significantly exceeds peer median / MAD threshold |
| **R5** | Low verified coverage | Proportion of registry-verified admissions falls below required institutional threshold |
| **R6** | Identical-record clusters | Suspicious clusters of synthetic admissions sharing identical metadata |
| **R7** | Quota / mode mismatch | Unapproved NRI/FN/supernumerary quota allocations or invalid study modes |

### 8. India fit and roadmap
| Stage | What | Status |
|---|---|---|
| Today | Working prototype, synthetic data, mock APAAR registry, tripartite reveal workflow | [Prototype] |
| Next | Replace mock adapter with live APAAR registry; KMS/HSM for the seal key; PostgreSQL | [Planned] |
| Pilot | ~3 months, ~50 colleges, two AICTE regional offices | [Planned] |
| Scale | State admission portals (CET / counselling), then all approved institutions | [Planned] |
Works with any ERP because input is a plain CSV; no change to college systems.

### 9. Technical Scope & Operational Boundaries
Demonstrator validation on synthetic ground truth · Memory-isolated batch ingestion · Strict zero disk/database persistence covenant · 12-digit pattern penetration probe across tables · 3-party cryptographic consensus for unsealing.

---

## System Architecture & Visual Diagrams

All architectural and security models are documented with interactive Mermaid specifications in [`docs/`](file:///docs/):

- [**Data Flow Diagrams (DFD Level 0 & Level 1)**](file:///docs/dfd.md): System context, data stores, and memory-only tokenization boundary.
- [**System Sequence Diagram**](file:///docs/sequence_diagram.md): Step-by-step lifecycle from CSV upload $\rightarrow$ blind sealing $\rightarrow$ duplicate radar $\rightarrow$ bilateral inquiry $\rightarrow$ tripartite identity reveal.
- [**Entity-Relationship (ER) Diagram**](file:///docs/er_diagram.md): Complete relational schema from `api/models.py` demonstrating zero PII columns.
- [**STRIDE Threat Model & Mitigations**](file:///docs/stride_threat_model.md): Threat vectors across trust boundaries (Spoofing, Tampering, Repudiation, Information Disclosure, DoS, Elevation of Privilege).
- [**Full Features Reference**](file:///docs/FEATURES.md): Single source of truth for prototype claims, rules, and innovation.

---

## Performance & Benchmarks

Measured on host machine via [`scripts/benchmark.py`](file:///scripts/benchmark.py). Full specifications and methodology in [**`docs/BENCHMARKS.md`**](file:///docs/BENCHMARKS.md).

| Metric | Measured Value | Algorithmic Guarantee |
|---|---|---|
| **HMAC-SHA256 Blind Sealing** | **121,979 operations / sec** | Mean latency **8.04 µs** (p95: 12.0 µs) |
| **Ingestion Pipeline Throughput** | **25,072 records / sec** | 10,000 rows parsed, sealed, verified & DB-inserted in **0.398s** |
| **Duplicate Radar Query Latency** | **7.18 ms** | Fast cross-college matching across 3,343 seats (p95: 8.83 ms) |
| **Single Record Citizen Lookup** | **$O(1)$** | Indexed B-Tree search on `student_token` without table scans |

> **Zero-Persistence Guarantee:** Raw student identifiers reside strictly in volatile memory buffers during the momentary HMAC computation and are immediately released. Raw IDs are never written to disk, database tables, or server logs.

---

## Security, Privacy & Secrets

### Production Secret Enforcement
- In production (`SAKSHI_ENV=prod`), the server **strictly refuses to start** and throws a `RuntimeError` if `SAKSHI_TOKEN_SECRET` is left as the default development secret.
- In local development (`SAKSHI_ENV=dev` or unset), a developer fallback secret is permitted for rapid prototyping.

### Pattern-Based Privacy Scan
The Privacy Proof screen and `/v1/admin/privacy-scan` endpoint verify:
`"0 matches for 12-digit patterns across 19 tables"`
> **Disclaimer:** This is a pattern-matching safety scan (regular expression search for 12-digit Aadhaar/APAAR patterns across all SQLite/PostgreSQL table columns), not a mathematical proof that no PII exists in non-pattern formats.

---

## Offline Credential Verification

SAKSHI issues **W3C-VC-style signed credentials (Ed25519)** containing a pseudonymized student token and program details. Credentials can be verified:
1. **Online via API:** `GET /v1/credentials/verify?handle={handle}`
2. **Public Key Export:** `GET /v1/credentials/public-key` returns the system's SubjectPublicKeyInfo PEM.
3. **Offline via CLI:** The included [`verify_offline.py`](file:///verify_offline.py) script verifies compact JWS credentials using **only the public key** with zero network or database dependencies:
   ```bash
   python verify_offline.py <jws_string> --public-key <pem_or_base64_key>
   # Or run built-in self-test:
   python verify_offline.py --test
   ```

---

## Interactive System Walkthrough

Follow this 3-click demo path in the live web app:

1. **Step 1: Executive Portfolio (`/overview`)**
   - Review national aggregate indicators: 15 institutions, 3,333 seats, and real-time integrity status.
2. **Step 2: Duplicate Radar (`/radar`)**
   - Inspect cross-college collisions where students hold multiple seats simultaneously. Click "Send Inquiry Notice" to trigger the bilateral resolution workflow.
3. **Step 3: Privacy Proof Console (`/proof`)**
   - Run the live pattern probe scanning all 19 database tables. Verify cryptographic hash integrity across the audit ledger.

---

## Local Setup & Testing

### 1. Backend Setup
```bash
cd api
python -m pip install -r requirements.txt
cd ..
make seed
cd api
uvicorn main:app --reload --port 8000
```
Interactive Swagger docs: `http://localhost:8000/docs`

### 2. Frontend Setup
```bash
cd web
npm install
npm run dev
```
Open `http://localhost:5173`.

### 3. Run Automated Tests & Benchmarks
```bash
# Run pytest suite (20 tests covering privacy, rules R1-R7, secrets, reveals, disputes)
pytest api/tests -v

# Run performance benchmarks
python scripts/benchmark.py

# Offline credential self-test
python verify_offline.py --test
```

---

## Team Sudo Winners (SIH 2026 · Team ID: 145609)

| Member | Role | Core Focus Areas | GitHub Profile |
|---|---|---|---|
| **Swastik** | **Team Leader & Core Architect** | Zero-knowledge blind token design, tripartite reveal protocol, STRIDE threat model, FastAPI core, and cloud deployment | [@heaven-swastik](https://github.com/heaven-swastik) |
| **Pallabi Roy (Yumi)** | **Frontend Lead & Product Design** | Citizen Window UI, 7-rule integrity interface, privacy proof console, story walkthrough, and bilingual localisation | [@Yumi0706](https://github.com/Yumi0706) |
| **Debojeet Banerjee (Debo)** | **Backend & Verification Lead** | Deterministic rule engine (R1–R7), Ed25519 verifiable credentials, offline CLI verification, and performance benchmarks | [@debojeet-codes](https://github.com/debojeet-codes) |
