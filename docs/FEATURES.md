# SAKSHI — Features & Innovation (single source of truth)

> Status tags: **[Implemented]** works in the repo today · **[Prototype]** works on synthetic data / mock registry · **[Planned]** designed, not built.

## 1. One-line pitch
SAKSHI (साक्षी, "the witness") lets AICTE verify that enrolments are genuine and catch double or ghost seats **without ever collecting or storing a student's identity.**

## 2. The problem (India, AICTE)
| # | Problem | Today |
|---|---|---|
| 1 | Double seats | One student holds seats in several colleges across counselling rounds |
| 2 | Ghost seats | Seats filled on paper by students who never joined |
| 3 | Over the limit | More students admitted than the approved intake |
| 4 | Information gap | Colleges report only totals; nobody can see who is behind the number |
| 5 | Legal trap | A central database of student IDs risks DPDP Act 2023 penalties (up to ₹250 Cr) and conflicts with the APAAR opt-out order (verify the exact citation before printing it) |

## 3. Solution flow
`College CSV → Gateway (check ID once, in memory) → Blind seal (keyed HMAC-SHA256) → Seal ledger (no names, no IDs) → Rule engine R1–R7 → Radar / Dashboard / Student window / QR credential → Audit chain`

## 4. Key innovations (the novelty)
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

## 5. Features by user
**AICTE regulator** — national overview (seats, institutions, flags) · duplicate radar · institution integrity scores · quota ledger (NRI / OCI / FN / supernumerary) · season replay · accreditation report · case opening from a flag · inquiry to both colleges · privacy proof console · tripartite reveal coordination.
**College registrar** — CSV upload with live batch report (verified / attested / rejected, reason per row) · download batch report · enrolment updates · reveal request approval.
**Student** — own records · dispute · consent withdrawal · QR credential · reveal consent approval.
**Employer / public** — scan QR → verified / revoked page with no name lookup · offline signature verification via `verify_offline.py`.
**Everyone** — role switcher (AICTE / College / Student), English + Hindi UI, guided 2-minute story, status footer with audit count.

## 6. Rule engine
| Rule | What it catches |
|---|---|
| R1 | Same seal in two or more colleges (cross-institution duplicate) |
| R2 | Same seal twice in one college |
| R3 | Intake overrun against approved intake |
| R4 | Burst upload pattern |
| R5 | Low verification coverage (verified share below threshold) |
| R6 | Clusters of identical records |
| R7 | Data inconsistency / quota mismatch |

## 7. Evidence you can show (live in the app)
- 15 institutions · 3,333 seats · 19 database tables scanned · tests: comprehensive pytest suite covering consent, reveal, dispute signatures, secrets, and credentials.
- Privacy probe: "0 matches for 12-digit patterns across N tables" — a pattern check, not a proof that no PII exists.
- Audit chain: verify endpoint returns intact/broken.
- Real measured benchmarks (see `docs/BENCHMARKS.md`): 121,979 ops/sec for HMAC-SHA256 blind sealing (8.04 µs mean latency), 25,072 records/sec batch ingestion throughput, 7.18 ms duplicate radar query latency across 3,343 seats with index on `student_token`.

## 8. India fit and roadmap
| Stage | What | Status |
|---|---|---|
| Today | Working prototype, synthetic data, mock APAAR registry, tripartite reveal workflow | [Prototype] |
| Next | Replace mock adapter with live APAAR registry; KMS/HSM for the seal key; PostgreSQL | [Planned] |
| Pilot | ~3 months, ~50 colleges, two AICTE regional offices | [Planned] |
| Scale | State admission portals (CET / counselling), then all approved institutions | [Planned] |
Works with any ERP because input is a plain CSV; no change to college systems.

## 9. Honest limits (say these before a judge asks)
Prototype on synthetic data · mock registry · batch upload, not streaming · Python cannot guarantee RAM wipe, so the claim is "raw IDs are never persisted or logged" · privacy scan is a pattern check (12-digit regex across tables), not a mathematical proof that no PII exists · tripartite reveal requires all 3 parties.

## 10. Tech stack (as in the repo)
FastAPI + SQLAlchemy (SQLite, PostgreSQL planned) · React 18 + Vite + Tailwind · HMAC-SHA256 seals · Ed25519 credentials · SHA-256 hash-chained audit log · pytest.

