# CHANGELOG

All notable changes to SAKSHI are recorded here.
Format: `[version] date — author — what changed`

---

## [0.1.0] 2026-10-23 — Initial prototype

### Added
- FastAPI backend with SQLite storage
- HMAC-SHA256 tokenisation gateway (raw IDs never stored)
- Mock APAAR registry adapter (`/mock/apaar/verify`)
- Detection rules R1–R6 (cross-institution duplicate, same-institution double entry, intake overrun, burst pattern, verification gap, identical-record cluster)
- Seat Integrity Score (0–100) with plain-English explanations
- Hash-chained audit log with Ed25519-signed daily Merkle roots
- Enrolment Credentials: JWS-signed, QR-linked, revocable
- Citizen Window: enrolment view, access history, dispute ("This is not me"), consent withdrawal
- Privacy Proof endpoint: scans all text columns for 12-digit patterns
- Synthetic data seeder with 15 institutions, ~2,000 students, injected anomalies
- `ground_truth.json` for honest precision/recall evaluation
- React 18 + Vite + Tailwind CSS frontend
- Deterministic geometric seal SVG generator (every token → unique mandala)
- Sealing animation (Framer Motion): IDs dissolve into seals on upload
- Masonry home board with four demo-story tiles
- Demo mode: guided four-story walkthrough (Asha, Ravi, Meera, Employer)
- Hindi toggle (EN/HI)
- Privacy tests and audit-chain tamper tests
- Docker Compose single-command setup

### Not in this release (intentional)
- Real APAAR/Aadhaar API integration (adapter interface documented)
- Chatbot or LLM decision-making
- Blockchain
- Automated penalties
- Admission Season Replay
- Overlap Constellation

---

*See README.md for setup instructions.*

