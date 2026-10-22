# DEMO.md — SAKSHI 5-minute demo script

*For the hackathon presentation. Practice this twice before the demo.*

---

## Setup (do this 10 minutes before)

```bash
# Terminal 1 — backend
cd api && uvicorn main:app --port 8000

# Terminal 2 — seed (only once)
python seed/generate.py

# Terminal 3 — frontend
cd web && npm run dev
```

Open `http://localhost:5173` in a full-screen browser. Enable Demo Mode.

---

## The hook (30 seconds)

> "To catch fake or double-counted students, a regulator normally has to collect every student's identity from every college. After the Supreme Court's July 2026 order and the DPDP Act, that's a legal and security risk. SAKSHI does something different."

> "Watch what happens when we upload a college's admission data."

---

## Story 1 — Upload and seal (60 seconds)

**Screen: Upload**

1. Click "Load demo CSV" → shows 12 rows.
2. Click "Upload admissions".
3. Watch the sealing animation: each ID dissolves into a geometric seal.
4. Point to the caption: *"IDs checked, sealed, and forgotten."*
5. Show the findings table: 10 accepted, 1 attested (opted out), 1 error.
6. Say: "The original ID never touched our database. Only the seal did."

---

## Story 2 — Ravi holds two seats (60 seconds)

**Screen: Radar**

1. Navigate to Duplicate Radar.
2. Show Ravi's card: the same seal appears in MIT Pune and VIT Vellore.
3. Say: "We know it's the same person — we can see the seal is identical. But we don't know the name."
4. Point to the explanation: "Rule R1 — Cross-institution duplicate."
5. Click "Ask both colleges" — shows the dual-control workflow.
6. Say: "AICTE asks the colleges. It doesn't open the data itself."

---

## Story 3 — Meera finds a ghost (60 seconds)

**Screen: Citizen Window**

1. Click "Login as Meera" shortcut.
2. Show Meera's enrolments: one known college and one she doesn't recognise.
3. Point to the unknown institution.
4. Click "This is not me".
5. Show the dispute form → submit.
6. Navigate to Radar → show Meera's dispute flagged on the regulator queue.
7. Say: "Students have visibility and a voice. Ghost enrolment has somewhere to be reported."

---

## Story 4 — Employer verifies (45 seconds)

**Screen: Credential → Verify**

1. Navigate to Credential → Verify tab.
2. Paste Ravi's demo handle (shown on screen in demo mode).
3. Click "Verify now".
4. Show result: "Enrolled — Active · B.Tech CSE · MIT Pune · 2026"
5. Say: "No name was looked up in a central database. The credential is self-contained and signed. The employer gets exactly what they need — nothing more."

---

## Closing (30 seconds)

**Screen: Privacy Proof**

1. Click "Run privacy scan".
2. Show the counter animate to 0.
3. "Zero raw IDs anywhere — database, logs, or cache."
4. Show audit chain: "Verified — [N] entries, tamper-proof."

> "SAKSHI is a witness that confirms, never discloses. AICTE can do its job. Students keep their privacy. Colleges upload one CSV."

---

*Total: approximately 5 minutes. Leave 1 minute for questions.*

---

## Answers to likely judge questions

**"What if APAAR isn't available?"**  
Alternative-ID path (id_type=INST). Seat is counted as Attested. No penalty for opting out.

**"What stops you from reversing the token?"**  
HMAC with a secret key. Brute-forcing a 12-digit space is infeasible without the key. In production, the key lives in a KMS/HSM.

**"Is this blockchain?"**  
No. The audit log is hash-chained (each entry includes the hash of the previous one), which gives tamper-evidence without blockchain overhead.

**"What's the AI component?"**  
Peer-group anomaly scoring (R4, R5) uses median + MAD z-scores. All rule decisions are deterministic. AI only rephrases the explanation text — never the decision.

**"Can real APAAR integrate?"**  
Yes. The `MockApaarRegistry` implements a documented adapter interface. Replace it with a real HTTP call to the APAAR/ABC API. The rest of the system is unchanged.

