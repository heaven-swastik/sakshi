# SAKSHI – Build Pack for SIH26263

*Prepared 23 Oct 2026 for Swastik's SIH team · AICTE · Smart Automation · Idea submission deadline 28 Oct 2026*

SAKSHI (Sanskrit for 'witness') is a privacy-first student-enrolment integrity platform for AICTE. Its promise in one line: **a witness that confirms, never discloses.** AICTE can detect duplicate seats, ghost enrolment and intake overruns without ever holding students' raw identity data.

Labels used below: **\[VERIFIED\]** = found in a retrieved source (Section 14); **\[INFERENCE\]** = my reasoning; **\[TO-VERIFY\]** = must be checked against official text before submission.

## 0. How to use this pack with another AI

Give the AI builder this section plus only the section it is working on. Paste the master prompt first.

**Master prompt**

> You are building SAKSHI, a privacy-first student-enrolment integrity platform for AICTE (SIH26263). Follow the Build Pack exactly. Rules: (1) all data is synthetic, never real APAAR or Aadhaar numbers; (2) a raw APAAR ID must never be written to the database, logs, caches or error messages, only keyed tokens; (3) deterministic rules decide, AI may only explain in plain words; (4) never invent accuracy, speed or benchmark numbers, measure them or leave them blank; (5) every flag carries a human-readable reason and needs a human decision; (6) work in small tested steps and after each step list files changed, how to run it, and how to test it. If something is ambiguous, ask one question, then continue.

**Team rules:** one owner per module; commit after each phase; keep a CHANGELOG; run the privacy leak test (Section 10) before every demo.

## 1. Why SIH26263 (decision summary)

Idea counts below are from your table at the time of writing (out of 500).

| PS | Title (short) | Ideas | What most teams will build | Innovation headroom | Verdict |
| --- | --- | --- | --- | --- | --- |
| 26265 | Security deposit / FDR portal | 14 | FDR tracker, maturity alerts, refund log | Low: narrow finance workflow; a generic template for it already exists | Skip |
| 26264 | Complaint-case dashboard across bureaus | 25 | Case registry + duplicate/overlap alert | Low: public repos already do cross-bureau overlap detection with fuzzy matching | Skip |
| 26263 | APAAR-based student data platform | 17 | CSV upload, duplicate APAAR check, dashboards | **High**: three 2025-26 legal shifts make the obvious design (centralise student data) risky | **Pick** |
| 26262 | Approval workflow, compliance alerts | 19 | Workflow engine + deadline alerts | Medium-high but very broad; easy to end up generic | Fallback |
| 26261 | AI application and document validation | 20 | OCR + LLM + forgery detection | Medium: this is the most commoditised approach | Skip |

**The reasoning in plain words \[INFERENCE\]:** for 26263 the generic solution is already built in public (CSV upload, duplicate IDs, a regulator dashboard), so copying it will not stand out. But the rules of the game changed: the Supreme Court (20 July 2026) mandated an opt-out in the APAAR consent form and held APAAR data subject to the DPDP Act; the Aadhaar authentication that AICTE may use is voluntary and needs alternatives; and DPDP penalties for weak security safeguards go up to Rs 250 crore. A design that flags students who have no APAAR ID, or that stores everyone's identity centrally, is now legally fragile. A design that **proves integrity without collecting identity** is both novel and necessary. That is the opening.

**Fallback if the team prefers breadth:** 26262 as 'regulation as code', turning the Approval Process Handbook into machine-checkable rules with clause-level citations. It is a good idea but a much larger build.

## 2. Research findings

### 2.1 What exists for 26263 today

- **\[VERIFIED\]** A public SIH repo (RagavU1430/apaar-student-verification-platform) already offers batch CSV validation, duplicate APAAR detection within and across institutions, intake-overrun monitoring, masked IDs and a regulator dashboard. So these features alone will not differentiate.
- **\[VERIFIED\]** A third-party SIH 2026 template site (github.com/sihindia/sih2026, by Flugelsoft Labs, despite the org name not an official account) ships a ready 'APAAR StudentVerify 360' starter. Expect other teams to start from it.
- **\[VERIFIED\]** A government open-source task (openforge.gov.in) describes APAAR fraud signals: duplicate APAAR IDs, identical scores across students, issuance-date mismatches, invalid document numbers, with evidence-backed review by verification teams.
- **\[VERIFIED\]** Commercial APAAR verification APIs exist (for example Meon, Surepass) promising instant verification and duplicate prevention. They verify one student at a time for one institution; none are a regulator-grade, privacy-preserving system.

### 2.2 Legal and policy shifts that shape a winning design

- **\[VERIFIED\]** On 20 July 2026 the Supreme Court (CJI Surya Kant bench) ordered a pan-India opt-out/refusal option in the APAAR consent form, held that collection, processing, storage and sharing under APAAR are subject to the DPDP Act 2023, and restricted disclosure to private parties (IFF, SCC Online, MediaNama reports). **Design consequence:** students without APAAR are a lawful category; never treat 'no APAAR' as fraud.
- **\[VERIFIED\]** The Ministry of Education notified (date to confirm: a Ministry of Education e-Gazette notification dated 17 Sep 2025 exists, but I did not check that it is this one) that AICTE may use Aadhaar-based authentication for students, faculty and staff, strictly voluntary, with explicit consent and alternative ID options. **Design consequence:** need an alternative-ID path.
- **\[VERIFIED\]** DPDP Rules 2025 were notified 13/14 Nov 2025; full compliance is due around May 2027; penalty up to Rs 250 crore for failing reasonable security safeguards (PIB, BDO and others). **Design consequence:** holding less personal data is a risk-reduction argument, not just an ethics argument.

### 2.3 Why integrity checking matters to AICTE

- **\[VERIFIED\]** AICTE Extension-of-Approval letters state that intake is reduced when admissions stay at or below 30% of approved intake for five consecutive years. **Design consequence \[INFERENCE\]:** reported admission counts affect approvals, so there is an incentive to misreport; independent cross-checks have real value.
- **\[VERIFIED\]** Past ghost-faculty cases: 9,060 duplicate faculty entries found across 7,155 AICTE-approved institutes (Lok Sabha reply reported by Tribune), and about 2,000 faculty positions wrongly filled in 2024-25 as found by Anna University. The same duplicate-identity pattern applies to students.
- **\[VERIFIED\]** AICTE EoA letters list approved intake per programme, per affiliating university, plus ODL/online and working-professional intakes. So seat counting has several categories; the counting rule must be configurable and versioned.

### 2.4 Technology building blocks (all open source or standard)

- **\[VERIFIED\]** Private Set Intersection (PSI): OpenMined PSI (JS/WASM, Python, C++, Go) lets two parties find common items without revealing the rest; Google's Private Join and Compute is a related open-source protocol. Caveat from Google's docs: security is against honest-but-curious parties and small intersections can leak, so use thresholds or noise.
- **\[INFERENCE\]** Keyed hashing (HMAC) of identifiers gives most of the benefit for an MVP; PSI/OPRF is the hardening roadmap.

### 2.5 Gaps in my research (be honest in the pitch)

- I could not retrieve the official text of PS 26263 (Background, Expected Outcomes). **\[TO-VERIFY\]** Read it on sih.gov.in and paste it into the 'Open questions' section so the AI can align features to it.
- I found no public information on whether AICTE can access an APAAR verification API, so the MVP uses a **mock registry adapter** and the pitch must say so plainly.

## 3. The idea in plain language

**For a non-technical judge (say this):**

> Today, to check for fake or double-counted students, a regulator has to collect every student's identity from every college. That is a data-leak risk, and the Supreme Court has now said families can opt out. SAKSHI works like sealed envelopes with matching stamps: each college seals its students' IDs into stamps only AICTE's system can compare. AICTE can see that the same stamp appears in two colleges, but not who the student is. If something looks wrong, AICTE does not open the envelope; it asks the two colleges to confirm, and every step is written in a log nobody can quietly edit.

**Three locks**

1. **Lock 1 – Verify at the source.** The APAAR ID is checked against the registry once (mock in the prototype), then forgotten. Students who opted out use an alternative ID path and are never penalised.
2. **Lock 2 – Blind tokens.** Each ID becomes a keyed token (HMAC with a secret key held in a KMS/HSM, rotated per admission cohort). AICTE stores tokens, never names, dates of birth or APAAR numbers.
3. **Lock 3 – Triangulate the truth.** A transparent Seat Integrity Score compares reported enrolment with approved intake, verified share, duplicate rate, upload patterns and independent counts. Every flag explains itself in a sentence; a human decides.

**What judges will see (the 'wow' moments)**

- **Blind Duplicate Radar:** a student enrolled in two full-time programmes lights up as 'token 7F3A appears in College A and College B', with no name anywhere.
- **Opt-out-safe:** toggle a student to opt-out; the seat is still counted, no fraud flag is raised, and the dashboard shows a 'verifiable coverage' figure instead of blame.
- **Citizen Window:** a student logs in (mock OTP), sees which institutions list them, who checked and why, and can press **'This is not me'** to dispute a ghost enrolment made in their name.
- **Ask the owner, do not open the envelope:** revealing identity is a dual-control workflow that routes questions to the colleges that hold the data.
- **Privacy proof button:** runs a scan showing zero raw IDs in the database or logs, and verifies the audit log's hash chain.

## 4. Product requirements (PRD)

### 4.1 Personas

- **Institution operator** (college admin): uploads admission data, resolves row errors, answers verification questions.
- **AICTE officer / supervisor** (regional office or HQ): monitors integrity, opens cases, requests reveals (supervisor approves).
- **Auditor / DPO view:** read-only access to audit log, consent ledger and privacy proof.
- **Student / parent:** views records, consent status, disputes.

### 4.2 Goals

G1 detect duplicate and ghost seats without central PII; G2 respect opt-out and alternative-ID lawfulness; G3 give regulators explainable, reviewable evidence; G4 be easy for colleges (CSV in, report out); G5 be tamper-evident and auditable; G6 scale to all AICTE-approved institutions.

### 4.3 Non-goals (say these out loud in the pitch)

No automated penalties; no face/biometric capture; no sale or sharing of data with third parties; no claim of real registry integration in the prototype.

### 4.4 Functional requirements

- **FR-1 Ingestion:** institution uploads CSV or JSON of admissions (APAAR or alternative ID, programme code, cohort year, mode, category). Row-level validation, zero rows silently dropped, a downloadable findings report.
- **FR-2 Verify-then-forget:** call the registry adapter, record only the outcome and assurance tier, tokenise, discard raw values. Logs and errors must mask IDs.
- **FR-3 Assurance tiers:** Verified (APAAR checked + consent record), Attested (alternative ID attested by institution + document hash), Pending.
- **FR-4 Seat ledger:** per institution, programme and year: approved intake (versioned counting rule), reported enrolment, by tier and mode.
- **FR-5 Duplicate radar:** rules R1-R4 (Section 7) with a configurable table of permitted combinations.
- **FR-6 Seat Integrity Score:** per institution-programme-year with component breakdown and plain-language explanation.
- **FR-7 Cases:** flag to case to resolution, with notes, assignees, deadlines and evidence pack export (PDF).
- **FR-8 Dual-control reveal:** request, supervisor approval, institution response; all logged. AICTE never receives raw IDs unless escalated under legal authority (outside prototype).
- **FR-9 Consent and opt-out:** consent ledger per purpose; withdrawal revokes the token and moves the seat to Attested/Pending, never to 'fraud'.
- **FR-10 Citizen window:** records view, access history, 'This is not me' dispute, consent withdrawal.
- **FR-11 Tamper-evident audit log:** hash-chained entries, verify endpoint, daily signed root.
- **FR-12 Rule configurator:** versioned rule parameters with a what-if preview (how many flags at this threshold).
- **FR-13 Bilingual UI:** English and Hindi toggle; accessible (WCAG-minded) and mobile-friendly.

### 4.4a Non-functional requirements

- **Security:** RBAC, JWT with short expiry, per-institution data isolation, encrypted at rest and in transit, secrets in KMS (env-based stub in prototype), rate limiting.
- **Privacy by design:** data minimisation, purpose limitation, retention rules, DPIA document in repo.
- **Reliability:** idempotent batch ingestion, retry-safe jobs, explicit failure states, offline-friendly CSV flow.
- **Scalability:** stateless API, queue-backed ingestion, token column indexed, tables partitioned by cohort year. Targets are goals to test, not claims (Section 11 has the load-test plan).
- **Explainability:** every flag has rule id, inputs and a sentence; AI text, if used, only rewords the template and is labelled.
- **Auditability:** nothing that changes a case or reveals data is unlogged.

### 4.5 Success metrics (measure, never invent)

Flag precision on seeded synthetic anomalies (known ground truth); recall on the same; false-positive rate on clean synthetic data; ingestion throughput on your own hardware; time for an officer to resolve a case in a usability run; zero raw-ID findings in the leak test.

## 5. Architecture

**Components**

1. **Web app** (institution, regulator, auditor and student portals).
2. **API service** (FastAPI): auth, ingestion, ledger, rules, cases, reveal, audit.
3. **Tokenisation gateway** (module inside API for MVP): receives IDs in memory, calls the registry adapter, outputs tokens, never persists IDs.
4. **Registry adapter** with two implementations: `MockApaarRegistry` (prototype) and a documented interface for the real APAAR/ABC/DigiLocker integration.
5. **Rules and scoring engine** (pure Python functions, versioned config).
6. **Job runner** (RQ/Celery or Postgres-backed jobs) for batch processing.
7. **PostgreSQL** (tokens, ledger, flags, cases, audit) and optional Redis.
8. **Audit service** (hash chain + daily Merkle root).
9. **Explainer** (template-based sentence generator; optional LLM rewording behind a flag).

**Trust boundaries:** Institution holds raw student data. Gateway sees an ID only in memory during a request. AICTE database holds tokens only. Student portal authenticates the student and queries by token derived at login.

**Token design \[INFERENCE, standard practice\]:** `token = base32( HMAC-SHA256( K_cohort, normalise(id_type + ':' + id_value) )[0:16] )`. Never use an unkeyed hash because a 12-digit ID space can be brute-forced. `K_cohort` is one secret per admission year, kept in KMS/HSM and rotated per cohort; the token stays stable within a cohort so duplicate seats at admission can be caught. For alternative-ID students use `id_type = 'INST'` with institution code and enrolment number; **limitation to state openly:** cross-institution duplicates cannot be detected for these students, but they still count in headcount, and the dashboard shows verifiable coverage.

**Hardening roadmap (research slice, not MVP):** use an OPRF so even the gateway never sees raw IDs; use OpenMined PSI for institution-to-regulator set checks; apply minimum-group-size thresholds and noise on aggregates (k-anonymity or differential privacy) for dashboards.

**Tech stack (all free-tier friendly)**

| Layer | Choice |
| --- | --- |
| Frontend | React or Next.js, Tailwind, shadcn/ui, Recharts, i18n (en/hi) |
| Backend | Python 3.11, FastAPI, Pydantic, SQLAlchemy, Alembic |
| Database | PostgreSQL (Neon or Supabase free tier for demo) |
| Jobs | RQ with Redis, or Postgres job table |
| Crypto | Python `hmac`/`hashlib`; `cryptography` for signing the daily audit root |
| Stretch | `openmined.psi` Python wheel, RFC 9497 OPRF library |
| Testing | pytest, Playwright (UI), Locust or k6 (load) |
| Deploy | Docker Compose; Render/Fly/Vercel for demo; roadmap: government cloud (NIC/MeghRaj) **\[TO-VERIFY\]** |

## 6. Data model (what is and is not stored)

**Never stored:** APAAR ID, Aadhaar number, name, date of birth, phone, email of students.

- `institutions(id, aicte_perm_id, name, state, type, region)`
- `programs(id, institution_id, course, level, mode, affiliating_body)`
- `intake_approvals(program_id, academic_year, approved_intake, counting_rule_version)`
- `batches(id, institution_id, uploaded_by, cohort_year, rows_total, rows_accepted, rows_rejected, status, created_at)`
- `batch_findings(batch_id, row_no, code, message)` (row number and code only, never the value)
- `enrolments(id, institution_id, program_id, cohort_year, student_token, id_type, assurance_tier, mode, seat_category, status, batch_id, created_at)`
- `consents(id, student_token, purpose, status, recorded_at, withdrawn_at)`
- `rule_versions(id, rule_id, params_json, created_by, active_from)`
- `flags(id, rule_id, rule_version, severity, state, institution_ids, student_token_ref, evidence_json, explanation, created_at)`
- `cases(id, flag_id, assignee, status, notes_json, due_at, closed_at, outcome)`
- `reveal_requests(id, case_id, requested_by, approved_by, reason_code, status, institution_responses_json, created_at)`
- `integrity_scores(institution_id, program_id, academic_year, score, components_json, explanation, rule_version)`
- `student_disputes(id, student_token, institution_id, dispute_type, status, created_at)`
- `audit_log(id, ts, actor_id, actor_role, action, object_type, object_id, payload_hash, prev_hash, entry_hash)`
- `audit_roots(date, merkle_root, signature)`

## 7. Detection logic (deterministic, explainable)

**Rules**

- **R1 Cross-institution duplicate:** same token, same cohort year, two or more institutions, both full-time regular. Severity high unless the pair is in the permitted-combinations table (for example one regular plus one ODL/online) **\[TO-VERIFY against AICTE/UGC norms; keep configurable\]**.
- **R2 Same-institution double entry:** one token in two programmes at one institution in the same cohort.
- **R3 Intake overrun:** reported enrolment above approved intake under the active counting rule (handle lateral entry, supernumerary and quota categories as configurable exclusions).
- **R4 Burst pattern:** unusual upload volume or timing versus peer group (same state and programme type) using robust z-score (median and MAD).
- **R5 Verification gap:** verified share far below peer group. Treated as a coverage signal, never as an accusation, because opt-out is lawful.
- **R6 Identical-record clusters:** many rows sharing identical attribute combinations (for example the same issuance date and marks), per the openforge fraud-signal description.

**Seat Integrity Score (0-100, higher is healthier)** `score = 100 - sum(weight_i * penalty_i)` with penalties normalised to 0-1 for: overrun ratio, duplicate rate per 1,000 seats, burst z-score (capped), unexplained triangulation gap. Verified share is reported separately as **coverage**, not mixed into the penalty. Default weights live in `rule_versions`; the what-if screen lets officers see the effect before saving.

**Explanation template (deterministic):** 'College X, B.Tech CSE 2026: reported 312 against approved 240 (130%). Rule R3. 18 seats are Verified, 9 Attested, 285 Pending. Suggested action: request confirmation from the institution.' An LLM may reword this but never changes the numbers or the decision.

**Triangulation signals (simulated in prototype):** affiliating-university registrations, scholarship disbursement counts, APAAR creation counts per institution. Real integrations are roadmap items **\[INFERENCE\]**.

## 8. API specification (v1)

All endpoints require a bearer JWT with a role claim: `institution`, `officer`, `supervisor`, `auditor`, `student`.

| Method and path | Role | Purpose |
| --- | --- | --- |
| POST /v1/batches | institution | Upload admissions file; returns 202 and batch id |
| GET /v1/batches/{id}/report | institution | Row findings and summary, no raw values |
| GET /v1/institutions/{id}/seat-ledger?year= | institution, officer | Seat ledger and coverage |
| GET /v1/regulator/overview?year= | officer, supervisor | State and national roll-up, coverage, open flags |
| GET /v1/regulator/institutions | officer | Filter by state, type, score band |
| GET /v1/institutions/{id}/integrity | officer | Score, components, explanation |
| GET /v1/flags?status=&severity=&rule= | officer | Review queue |
| POST /v1/flags/{id}/case | officer | Open case |
| POST /v1/cases/{id}/reveal-requests | officer | Start dual-control reveal |
| POST /v1/reveal-requests/{id}/approve | supervisor | Approve or reject |
| POST /v1/reveal-requests/{id}/respond | institution | Institution confirms or denies with evidence reference |
| GET /v1/audit/verify | auditor | Verify hash chain, return result |
| GET /v1/system/privacy-proof | auditor | Run raw-ID leak scan summary |
| POST /v1/student/auth/otp, POST /v1/student/auth/verify | public | Mock OTP login for demo |
| GET /v1/student/me/records | student | Where I appear, who accessed, why |
| POST /v1/student/me/disputes | student | 'This is not me' |
| POST /v1/student/me/consent/withdraw | student | Withdraw consent |
| GET/POST /v1/admin/rules | supervisor | Read and version rule parameters |
| POST /v1/admin/rules/preview | supervisor | What-if flag count |
| POST /mock/apaar/verify | internal | Mock registry used by the adapter |

**Error contract:** `{ code, message, request_id }`; messages never echo submitted identifiers.

## 9. UI screens

1. **Institution upload and findings:** drag-drop file, progress, row-error table, downloadable report, 'what happens to my data' panel.
2. **Seat ledger:** programme cards with approved versus reported seats and tier breakdown.
3. **Regulator command view:** national tiles (coverage, open flags, cases by age), state bar chart or heat grid, peer-group comparison.
4. **Institution profile:** Seat Integrity Score with component bars and the plain-language explanation.
5. **Duplicate Radar and case view:** side-by-side token appearances, rule and severity, notes, evidence-pack export.
6. **Reveal workflow:** request, approve, institution response, timeline.
7. **Citizen Window:** records, access history, 'This is not me', consent controls.
8. **Audit and Privacy proof:** hash-chain status, last signed root, leak-scan result.
9. **Rule configurator:** parameters, what-if preview, version history.

Design principles: calm government-grade look, high contrast, plain labels, English/Hindi toggle, every number links to the rule or data behind it.

## 10. Synthetic data, demo script and the privacy leak test

**Synthetic data spec (design parameters, not results)**

- About 60 institutions across 8 states, 3-4 programmes each, cohort year 2026; approved intake per programme drawn from realistic values (for example 60, 120, 180, 240). Use a fixed random seed so demos are repeatable.
- Student IDs are fake 12-digit values from a reserved synthetic range; the mock registry marks them valid. Names are never generated or stored.
- **Injected anomalies with known ground truth** (so you can compute precision and recall honestly): duplicate pairs across institutions, same-institution double entries, a few institutions over intake, a few burst-upload institutions, a few identical-record clusters.
- Population mix: most rows Verified, a share Attested (opt-out or alternative ID), a share Pending. Pick the shares yourselves and state them in the demo.
- Keep a `ground_truth.json` listing every injected anomaly so the evaluation script can score the rules.

**5-minute demo script**

1. (30s) Problem: regulators need to catch fake and double seats, but collecting everyone's identity is now legally and ethically risky. Show the Supreme Court and DPDP context in one slide.
2. (60s) Institution uploads a CSV with deliberate errors; show the row findings report and the line 'we verified, tokenised and forgot your IDs'.
3. (60s) Regulator command view: coverage tile, flags by rule, an over-intake institution with its plain-language explanation.
4. (60s) Blind Duplicate Radar: open a duplicate, show 'token 7F3A in College A and College B', then the dual-control reveal asking the colleges rather than opening the data.
5. (45s) Citizen Window: student sees who accessed their record and presses 'This is not me'; toggle opt-out and show no fraud flag, only coverage change.
6. (30s) Privacy proof button: zero raw IDs found, audit chain verified. Close with the 'witness that confirms, never discloses' line.

**Privacy leak test (run in CI and before every demo)** Scan a full database dump, application logs, cache keys and a sample of API responses for any seeded raw ID and for the pattern of 12 consecutive digits. Required result: zero matches. Expose a summary through `GET /v1/system/privacy-proof` (counts and timestamps only, never matched values).

## 11. Build plan and ready-to-paste prompts

### 11.1 Timeline to the idea deadline (28 Oct 2026)

- **23-24 Oct:** read the official PS 26263 text, fill the open questions in Section 15, confirm the pick with the team.
- **25 Oct:** draft the idea PPT from Section 12; draw the architecture and flow diagrams.
- **26 Oct:** optional clickable prototype or 60-second screen recording of the Citizen Window and Duplicate Radar (Phases 3-6 in a simplified form).
- **27 Oct:** review with your college SPOC, fix wording, export the PDF.
- **28 Oct:** submit early in the day; do not leave it to the final hour. Confirm the SPOC verification steps on sih.gov.in.

### 11.2 Build phases for the finale (36-hour format) or a longer build

| Phase | Output | Done when |
| --- | --- | --- |
| P1 | Repo scaffold, Docker Compose, CI, lint, test runner | `docker compose up` shows health endpoints |
| P2 | DB schema and migrations (Section 6) | migrations apply cleanly on empty DB |
| P3 | Synthetic generator and mock registry | seed script produces data and `ground_truth.json` |
| P4 | Ingestion gateway and tokenisation | leak test passes with zero matches |
| P5 | Rules R1-R6, Seat Integrity Score, explainer | precision and recall computed on ground truth |
| P6 | Auth, RBAC, tamper-evident audit log | `/v1/audit/verify` passes; tampering a row makes it fail |
| P7 | Institution and regulator UI | screens 1-4 work with seeded data |
| P8 | Cases, dual-control reveal, evidence-pack PDF | full flag to case to reveal flow demoable |
| P9 | Citizen Window, consent, disputes | opt-out never creates a fraud flag |
| P10 | Rule configurator, i18n, polish, load test, rehearsal | demo runs end to end twice without edits |

### 11.3 Prompts (paste with the master prompt from Section 0)

**P1:** Create a monorepo with `api/` (FastAPI, Python 3.11, pytest), `web/` (React + Tailwind) and `docker-compose.yml` with Postgres and Redis. Add health endpoints, a Makefile, a pre-commit config and a GitHub Actions workflow that runs tests. Output the folder tree and run instructions.

**P2:** Using the data model in Section 6, write SQLAlchemy models and Alembic migrations. Add indexes on `enrolments(student_token, cohort_year)` and on `(institution_id, program_id, cohort_year)`. Partition `enrolments` by `cohort_year`. Do not add any column for names, dates of birth or raw IDs. Add a test that fails if such a column appears.

**P3:** Write `seed/generate.py` (fixed seed) producing institutions, programmes, intake approvals, synthetic students (fake 12-digit IDs from a reserved range) and injected anomalies; write `ground_truth.json`. Write a mock registry service with `POST /mock/apaar/verify` returning valid, invalid or opted-out deterministically.

**P4:** Implement the ingestion endpoint and tokenisation gateway per Section 5: validate rows, call the registry adapter interface, compute the HMAC token with a per-cohort key from an env-based KMS stub, store only token, tier and metadata, discard raw values, mask IDs in logs and errors. Write the privacy leak test and wire it into CI.

**P5:** Implement rules R1-R6 as pure functions with versioned parameters, the Seat Integrity Score formula and the deterministic explanation templates from Section 7. Write an evaluation script that reports precision and recall against `ground_truth.json` and prints them (never hard-code numbers).

**P6:** Add JWT auth with roles `institution`, `officer`, `supervisor`, `auditor`, `student`, enforce institution data isolation, and implement the hash-chained audit log, the verify endpoint and the daily signed Merkle root. Add a test proving that editing any past audit row breaks verification.

**P7:** Build the institution upload and findings screen, seat ledger, regulator command view and institution profile with Recharts. Every number links to the rule or data behind it. Add English and Hindi toggle and keyboard-accessible controls.

**P8:** Implement cases and the dual-control reveal workflow (officer requests, supervisor approves, institution responds), with a timeline view and an evidence-pack PDF export containing rule id, inputs, explanation and audit references but no raw IDs.

**P9:** Implement the Citizen Window with mock OTP login, records and access-history view, 'This is not me' disputes and consent withdrawal. Ensure opt-out or withdrawal moves a seat to Attested or Pending and never raises a fraud flag. Add tests for this.

**P10:** Add the rule configurator with what-if preview, finish i18n, write the 5-minute demo script into `DEMO.md`, write a Locust or k6 load test for ingestion, and run it on your own machine. Report the measured numbers with the hardware used; leave the table blank if you did not measure.

### 11.4 Load-test plan (measure, do not claim)

Ingest synthetic batches of increasing size; record rows per second, p50 and p95 latency and database size; test the duplicate query on a large token table with and without the index. Publish only measured values with hardware and date.

## 12. Idea PPT content (follow the official SIH template on the portal)

**\[TO-VERIFY\]** Use the exact template and file format required on sih.gov.in; the slide headings below follow the structure used in recent SIH templates.

**Slide 1 – Title:** PS ID SIH26263 · AICTE · Smart Automation · Software. Idea title: **SAKSHI – verify student enrolment without collecting student identity.**

**Slide 2 – Proposed solution:** the problem in two lines (fake or double seats are hard to catch; centralising student data is now a legal and security risk after the Supreme Court's July 2026 APAAR order and the DPDP Act). The solution in three locks: verify at source, blind tokens, triangulated Seat Integrity Score with human review. Plain-language analogy: sealed envelopes with matching stamps. Differentiators: privacy-by-design, opt-out-safe, citizen window, dual-control reveal, tamper-evident audit.

**Slide 3 – Technical approach:** architecture diagram (institution portal, tokenisation gateway, registry adapter, rules engine, audit service, regulator and citizen portals); stack (FastAPI, PostgreSQL, React, HMAC tokens, hash-chained log); roadmap to OPRF and OpenMined PSI; deterministic rules with explanation; AI only for rewording, never for decisions. Process flow: Upload, Verify, Tokenise, Forget, Detect, Review, Ask the owner.

**Slide 4 – Feasibility and viability:** feasibility (open-source components, CSV-based onboarding for colleges, mock registry in prototype with a defined adapter for the real one); risks and mitigations (Section 15); viability (Section 13).

**Slide 5 – Impact and benefits:** for AICTE (fewer ghost or duplicate seats, evidence-backed reviews, lower breach exposure), for colleges (one upload, one report), for students (visibility and control, protection against identity misuse), for the ecosystem (same engine can later serve faculty-duplicate checks and other regulators). Avoid quantified claims you cannot source.

**Slide 6 – Research and references:** cite the Supreme Court order reports, the DPDP Rules notification, AICTE EoA letters, OpenMined PSI, and the public prior art you reviewed (Section 14).

## 13. Viability, scalability and government reliability

**Scalability \[INFERENCE\]:** stateless API behind a load balancer; ingestion through a queue; tokens indexed and tables partitioned by cohort year; dashboards served from pre-aggregated tables. Because tokens are compact fixed-size values, duplicate lookup is an indexed equality query rather than fuzzy matching. Fill real capacity numbers only after the load test.

**Financial viability (formula, fill with real quotes):** annual cost = hosting + security audit + support; annual benefit = reduced manual verification effort + avoided cost of mistaken or ghost seats + reduced breach exposure. Open-source stack means zero licence fees. DPDP exposure is a risk-avoidance argument because the maximum penalty for failed security safeguards is Rs 250 crore **\[VERIFIED\]**; holding tokens instead of identities shrinks what can leak.

**Sustainability and reuse \[INFERENCE\]:** run as an AICTE shared service; extend the same token engine to faculty (AICTE has documented duplicate-faculty cases) and offer it to state technical boards and universities; other regulators could adopt it with a new adapter. Do not propose selling or sharing student data; the Supreme Court restricted third-party disclosure.

**Government reliability:** deterministic rules, versioned configuration, immutable audit, role separation, human-in-the-loop decisions, offline-friendly CSV onboarding, explicit failure states, and a documented DPIA. Roadmap items to verify with AICTE: hosting on government cloud, security audit by an empanelled auditor, accessibility and language compliance **\[TO-VERIFY\]**.

**Pilot path:** start with one regional office and a handful of colleges, measure flag quality and officer time, then expand by state.

## 14. Sources (retrieved 23 Oct 2026)

- Supreme Court APAAR order (20 Jul 2026): Internet Freedom Foundation https://internetfreedom.in/supreme-court-orders-pan-india-implementation-of-odisha-high-courts-ruling-on-apaar-ids-consent-form/ ; SCC Online https://www.scconline.com/blog/post/2026/07/27/sc-directs-opt-out-option-in-apaar-consent-form/ ; MediaNama https://www.medianama.com/2026/07/223-sc-direct-cbse-opt-out-aadhaar-linked-apaar-id-consent-forms/
- Aadhaar authentication for AICTE institutions (voluntary, consent, alternatives): Tribune https://www.tribuneindia.com/news/india/aadhaar-use-okayed-in-tech-institutions
- DPDP Rules 2025 and penalties: PIB https://static.pib.gov.in/WriteReadData/specificdocs/documents/2025/nov/doc20251117695301.pdf ; BDO https://www.bdo.in/getmedia/87552494-85d2-4edb-95da-0f118fdb3052/The-DPDP-Rules\_BDO-India\_2025.pdf
- AICTE EoA letter showing the 30% admissions rule: https://mbcet.ac.in/wp-content/uploads/2025/06/EOA-Report-2025-26.pdf
- Duplicate faculty in AICTE institutes: Tribune https://m.tribuneindia.com/news/archive/nation/9-000-fake-faculty-in-tech-institutes-govt-271355
- Prior art for 26263: https://github.com/RagavU1430/apaar-student-verification-platform ; third-party template https://github.com/sihindia/sih2026 ; openforge fraud-signal task https://openforge.gov.in/plugins/tracker/?aid=483446 ; commercial APIs https://meon.co.in/apaar-card-verification-api and https://surepass.io/student-verification-with-aadhaar/
- Prior art for 26264: https://github.com/joelbinoy2021-sketch/aicte-icmd ; https://github.com/RishiSai23/casebridge-ai
- Earlier SIH AICTE approval-process statement (2019): https://www.sih.gov.in/sih2019ProblemStatementstudentInnovation
- PSI technology: https://github.com/OpenMined/PSI ; Google Private Join and Compute https://security.googleblog.com/2019/06/helping-organizations-do-more-without-collecting-more-data.html
- SIH evaluation criteria (novelty, feasibility, sustainability, scale of impact, UX): https://sih.gov.in/letters/Student%20FAQs.pdf
- Idea counts mirror (third-party, not official): https://zaidsayyed.in/tools/sih-problem-statements

## 15. Risks, open questions and verification checklist

**Risks and mitigations**

- **Tokens are pseudonymous, not anonymous.** Treat them as personal data under DPDP; keep keys in KMS, rotate per cohort, restrict access, write a DPIA. Say 'privacy-preserving', never 'anonymous'.
- **False positives from lawful dual enrolment.** Permitted-combination table, human review, severity levels, no automated penalties.
- **Opt-out students are invisible to duplicate checks.** State the limitation, show coverage, rely on headcount and triangulation for those seats.
- **Registry access is unknown.** Adapter interface plus mock; pitch it as a defined integration point and an MoU item, not a delivered integration.
- **Gateway sees IDs transiently.** Mitigate with memory-only handling, masked logs, leak tests; roadmap OPRF.
- **Institution burden.** CSV-based onboarding, clear error reports, bilingual help.
- **Judge expectation of an AI element.** The AI-assisted parts are anomaly scoring against peer groups and plain-language explanation; be clear that decisions stay rule-based and human-reviewed, which is a reliability strength.

**Open questions to close before submission**

1. Paste the official PS 26263 text (Background, Expected Outcomes) here and map every expected outcome to a feature above.
2. Which student fields does AICTE actually need at regulator level? Confirm the minimum.
3. What are the permitted enrolment combinations (regular plus ODL/online, dual degree) under current AICTE and UGC norms?
4. Exact subject and date of the Ministry of Education notification on Aadhaar authentication for AICTE institutions (see correction note in Section 2.2).
5. Any existing AICTE data schemas or portals the prototype should mimic (approval portal fields, intake categories)?
6. Team roles for six members (minimum one woman per SIH rules as reported): backend, frontend, data/rules, security/privacy, UX/demo, documentation/pitch.

**Verification checklist before you submit**

- Every \[VERIFIED\] claim in the PPT has a source on the references slide.
- No quantified benefit appears without a source or a measurement.
- The pitch says 'mock registry in the prototype'.
- The leak test and audit verification have been run on the demo build.
- Hindi strings reviewed by a native speaker.

## 16. Alignment with the official PS text (pasted 23 Oct 2026)

The official text asks for an 'AICTE Central Repository', verification for employers and other regulators, verifiable student records, and certificates that show the APAAR ID. Sections 1-15 were written before I saw it, so this section is the update. **Where it conflicts with an earlier line, this section wins.**

**Design stance, restated:** the central repository is a **minimised student-level repository**. By default it holds the token, assurance tier and enrolment attributes (programme, cohort, mode, seat category), while name, date of birth and the raw APAAR ID stay with the institution and the registry. If AICTE's legal basis requires named records, switch to Mode B: field-level envelope encryption, purpose-bound access and per-access audit, still without raw IDs in logs. Section 6's 'Never stored' list describes the default mode.

| # | Official requirement | SAKSHI answer | Where |
| --- | --- | --- | --- |
| 1 | Secure platform/API to upload and update student-level data keyed by APAAR ID | Idempotent upload and update API, CSV and JSON, APAAR or alternative ID, verify-then-forget tokenisation | FR-1, FR-2, Sec 8 |
| 2 | Fields: approved intake, actual enrolment, supernumerary, NRI, OCI, FN | `seat_category` enum (general, supernumerary, NRI, OCI, FN, other) and per-category ledger; counting rule versioned | Sec 6, 7, 18 |
| 3 | Validation: duplicates, invalid or missing APAAR, intake overrun, inconsistencies, cross-institution duplicates | R1, R2, R3 plus new R7 consistency rules; missing APAAR routes to Attested, never to fraud | Sec 7 |
| 4 | Real-time dashboards for AICTE and institutions | Screens 2-4 plus Admission Season Replay | Sec 9, 17 |
| 5 | Secure verification for AICTE, institutions, employers, regulators | Verifier portal with purpose-scoped, consent-based checks returning the minimum answer | Sec 17, 18 |
| 6 | Verifiable student records linked to academic identity | Student-held, signed Enrolment Credential with QR and revocation | Sec 17, 18 |
| 7 | Integration with institutional and AICTE systems | Adapter interfaces, OpenAPI spec, webhooks, SSO hook | Sec 5, 8 |
| 8 | Security, privacy, RBAC, audit, consent | Roles, tokenisation, hash-chained audit, consent ledger, opt-out safe | FR-9, FR-11 |
| 9 | Reports for policy, accreditation, monitoring | Report generator by state, programme, quota and category, with small-cell suppression | Sec 18 |
| 10 | Print APAAR ID with student ID on certificates | Certificate block spec: APAAR ID, institution student ID and a QR that carries only a verification handle | Sec 18 |

**Totals-only institutions:** the PS notes that PGDM institutions give detailed annual data while others report only totals. Add a **Bridge mode**: totals-only institutions keep reporting totals, the system compares them with the token count as coverage grows, and the dashboard shows a readiness band (not a ranking or a penalty).

**Open question 1 is answered.** Still to confirm: the legal basis for AICTE holding named records (decides Mode A or B), and the permitted dual-enrolment combinations.

## 17. How to avoid 'the same approach as everyone else'

**What judges will have seen already \[INFERENCE\]:** CSV upload, a table of students, duplicate APAAR IDs, an over-intake bar chart, an isolation-forest anomaly score, an 'AI assistant' chatbot, and the word blockchain. Do not lead with any of these.

**Pitch rule:** open with people, not features. Use four short stories as the demo spine, each exposing one idea that a generic dashboard cannot show.

1. **Asha opts out of APAAR** (lawful after the Supreme Court order). Her seat is still counted, no flag is raised, the dashboard shows coverage instead of blame.
2. **Ravi holds seats in two colleges.** The Blind Duplicate Radar shows 'token 7F3A in College A and B' with no name; AICTE asks both colleges rather than opening anyone's data.
3. **Meera discovers a seat in her name.** In the Citizen Window she sees an institution she never joined and presses 'This is not me'; the case appears on the regulator's queue.
4. **An employer verifies Ravi's degree-in-progress.** Scanning the QR on his Enrolment Credential returns 'enrolled, active, verified by AICTE' in under a second with no central lookup of his name, and only the fields he agreed to share.

**Signature features (pick at least three to build well, rather than all of them shallowly)**

- **Enrolment Credential (the 'Seat Passport'):** a signed, student-held record with a QR, selective disclosure and a revocation list. It answers requirements 5, 6 and 10 in one object and is the most visual proof that verification does not need a central lookup. VC-style design; do not claim formal W3C conformance unless you test it.
- **Admission Season Replay:** a time scrubber that replays seat fills day by day for a programme or state, showing the exact moment an intake is exceeded and where upload bursts happen. It turns 'real-time monitoring' into something a judge can play with.
- **Overlap Constellation:** a graph or matrix of institution-to-institution shared tokens, with small cells suppressed (k-threshold) so no individual can be inferred. Strong overlap between two colleges is a prompt to investigate (for example seat blocking during counselling, which is a hypothesis to test **\[INFERENCE\]**), not proof of wrongdoing.
- **'What would clear this flag?' checklist:** every flag tells the institution in plain words what evidence resolves it, which cuts back-and-forth and shows you thought about the college's day.
- **Bridge mode and readiness band:** shows you understood that most institutions only report totals today.
- **Citizen Window with 'This is not me'** and **dual-control 'ask the owner' reveal** from earlier sections.

**Words to say and avoid:** say 'verify without collecting', 'witness', 'sealed envelope', 'ask the owner'. Avoid 'AI-powered' as the headline, 'blockchain', and 'anonymous' (tokens are pseudonymous). Describe the AI honestly: peer-group anomaly scoring plus plain-language explanation, with deterministic rules and human decisions.

**Differentiation test before submission:** for each slide ask 'could another team have drawn this exact slide?' If yes, replace it with a slide that carries a story, a legal fact from Section 2, or a signature feature.

## 18. Build deltas (add to Sections 6, 7, 8, 11)

**Data model additions**

- `enrolments.seat_category` enum: general, supernumerary, NRI, OCI, FN, other.
- `credentials(id, student_token, program_id, cohort_year, status, issued_at, expires_at, key_id)` and `credential_status_list(credential_id, revoked_at, reason)`.
- `verification_events(id, credential_id, verifier_role, purpose_code, result, ts)` (feeds the Citizen Window access history).
- `daily_seat_counts(program_id, snapshot_date, reported, verified, attested, pending)` for Replay.
- Materialised view `institution_overlap(inst_a, inst_b, cohort_year, shared_tokens)` with cells below `k` (default 5, configurable) suppressed.
- `shared_fields_consent(credential_id, field, granted_at, revoked_at)` for selective disclosure.

**New rule R7 (consistency):** programme duration versus cohort year; seat category versus declared NRI, OCI or FN flags; mode versus programme type; supernumerary rows without a matching approval; impossible combinations. Missing optional fields lower coverage, they do not create a fraud flag.

**Credential design**

- Payload: credential id, token handle (not the APAAR ID), institution code, programme, cohort, status, issue and expiry dates; signed as a JWS with Ed25519 (`cryptography` library) using a key held in the KMS stub.
- Student shares fields by granting consent per field; the verifier sees only granted fields plus a validity result.
- Verification checks signature, expiry and the status list; verifiers must be registered with a purpose code and are rate-limited; every check is logged and visible to the student.
- QR carries a short verification handle or the signed token, never raw identity.

**New endpoints**

| Method and path | Role | Purpose |
| --- | --- | --- |
| POST /v1/credentials/issue | institution, officer | Issue credential after verification |
| GET /v1/verify/{handle}?purpose= | verifier | Minimal verification result |
| POST /v1/student/me/credentials/{id}/share | student | Grant or revoke field-level consent |
| POST /v1/credentials/{id}/revoke | institution, officer | Revoke with reason |
| GET /v1/regulator/replay?program\_id=&from=&to= | officer | Daily seat series for Replay |
| GET /v1/regulator/overlap?year= | officer | Suppressed overlap matrix |
| GET /v1/reports/{type}?filters= | officer | State, programme, quota, category reports |

**Certificate block spec (requirement 10):** print the APAAR ID and the institution student ID on the certificate together with a QR; the QR must carry only a verification handle. **\[TO-VERIFY\]** the exact format with AICTE and the degree-awarding bodies.

**Extra prompts**

- **P11:** Implement credential issuance, JWS signing, QR generation, the verifier endpoint with purpose codes and rate limits, revocation, and selective-disclosure consent. Write tests for expired, revoked and tampered credentials.
- **P12:** Build Admission Season Replay from `daily_seat_counts` (a day scrubber, per-programme intake meter, burst markers) and the Overlap Constellation with k-threshold suppression and click-through to a case.
- **P13:** Add the 'What would clear this flag?' checklist generator (deterministic templates per rule) and Bridge mode with a readiness band. Add report exports with small-cell suppression.
