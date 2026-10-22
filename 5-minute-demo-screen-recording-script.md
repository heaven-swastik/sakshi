# SAKSHI — 5-Minute Screen Recording & Pitch Script

**Event:** Smart India Hackathon 2026  
**Problem Statement:** SIH26263 (AICTE Regulation Bureau)  
**Target Duration:** Exactly 5 Minutes (00:00 – 05:00)

---

## Pre-Recording Checklist (Do This Before Pressing Record)
1. Browser open at `http://localhost:5173` in full screen (F11 or 1920×1080 resolution).
2. Clean browser window: no bookmarks bar, browser zoom at 100%.
3. Mouse cursor speed set to medium (smooth, deliberate movements — no jittery shaking).
4. Audio setup: Good microphone, no background fan noise, confident tone.

---

## Second-by-Second Action & Voiceover Script

### [00:00 – 00:45] The 45-Second Hook: The Legal Paradox

| Time | What to do on screen | Spoken Voiceover (Say this word for word) |
|---|---|---|
| **00:00** | Start on **Overview** screen (`http://localhost:5173`). Slowly hover over the hero card and the 3 pastel metric cards. | *"Respected jury, every year AICTE receives student admissions from thousands of colleges. Today, to detect fake students, ghost enrolments, or double seats, the obvious solution is to collect every student's name, Aadhaar, and APAAR ID centrally."* |
| **00:20** | Point the cursor to the top green badge: **"100% Privacy Verified"** and the **Zero PII Stored** telemetry marker. | *"But in July 2026, the Supreme Court ruled that APAAR is subject to the DPDP Act 2023, making opt-out mandatory. Under Section 33, data breach penalties reach ₹250 crore. Centralising 10 million students' raw identities creates a dangerous national honeypot."* |
| **00:35** | Move cursor to the brand logo **सा** and title **SAKSHI**. | *"This is SAKSHI — a privacy-first enrolment integrity platform for AICTE. Our core breakthrough in one line: a witness that confirms, never discloses."* |

---

### [00:45 – 01:45] Step 1: Upload Admissions & The Sealing Moment

| Time | What to do on screen | Spoken Voiceover (Say this word for word) |
|---|---|---|
| **00:45** | Click **"1. Upload Admissions"** on the left dark sidebar or the top pipeline bar. | *"Let's look at how colleges submit data. An institution uploads their admission CSV after counselling."* |
| **01:00** | Click the button **"Load demo CSV"**. The CSV filename appears with a green checkmark. | *"I'll load a sample admissions batch. Notice the columns: ID type, ID value, programme, cohort year, and quota category."* |
| **01:12** | Click the black button **"Upload admissions"**. | *"Now watch closely as I click Upload."* |
| **01:16** | Watch the rows animate. The raw IDs dissolve into unique red circular **mandala Seals**. | *"Notice what just happened. The raw 12-digit IDs were verified against the APAAR registry in volatile memory for 12 milliseconds, converted into irreversible keyed HMAC-SHA256 seals, and the raw IDs were immediately deleted."* |
| **01:32** | Hover over the red italic caption: *"IDs checked, sealed, and forgotten."* and point to Row 3 (Asha). | *"Look at Row 3: Asha chose to opt out of APAAR. Under the Supreme Court order, her seat is marked 'Attested' using her college ID. Her seat counts, she is not penalised, and no fraud flag is raised."* |

---

### [01:45 – 02:40] Step 2: The Blind Duplicate Radar (Ravi's Story)

| Time | What to do on screen | Spoken Voiceover (Say this word for word) |
|---|---|---|
| **01:45** | Click **"2. Duplicate Radar"** in the sidebar. | *"Now, what happens if a student tries to block two government seats? Let's switch to the Duplicate Radar."* |
| **01:55** | Scroll smoothly to Ravi's card: **MIT Pune vs RV College Bengaluru**. Hover over the large geometric seal. | *"Look at this case. Ravi Kumar enrolled in B.Tech CSE at MIT Pune AND at RV College Bengaluru simultaneously. But look at the screen: AICTE does not know his name or personal ID. SAKSHI caught him purely because both colleges produced the identical geometric seal."* |
| **02:18** | Click the button **"Ask both colleges"**. A dual-control modal pops up. | *"Notice AICTE's response: AICTE does not open anyone's personal data. It uses dual-control cryptography to send an encrypted inquiry to both college registrars: 'Confirm student status for Seal 7F3A'. Deterministic rule R1 decides, humans review."* |
| **02:35** | Close modal and point to the Rule R1 evaluation metrics (100% Precision, 100% Recall). | *"On our synthetic test benchmark of 3,300 students, Rule R1 achieved 100% precision and zero false positives."* |

---

### [02:40 – 03:30] Step 3: Seat Integrity, Quotas & Season Replay

| Time | What to do on screen | Spoken Voiceover (Say this word for word) |
|---|---|---|
| **02:40** | Click **"3. Seat Integrity & Quota"** in the sidebar. | *"Next is the Seat Integrity Suite. Every college receives a 0 to 100 integrity score."* |
| **02:50** | Click the expand arrow on **MIT Pune**. Show the `-25 pts` deduction for Rule R3. | *"Every deduction explains itself in plain English: 'Rule R3: College reports 312 admissions against approved capacity of 240 (130%)'. No black-box AI."* |
| **03:05** | Click the tab **"Quota Ledger (NRI/OCI/FN)"**. Show the category cards. | *"To fulfill AICTE Requirement 2, we track Approved Intake vs Supernumerary, NRI, OCI, and Foreign National quotas with zero student identity exposure."* |
| **03:18** | Click **"Season Replay"** and drag the slider across August, September, and October. | *"With our Admission Season Replay scrubber, AICTE officers can drag through counselling rounds, watching seat fill velocity day by day and pinpointing the exact date an overrun or burst upload occurred."* |

---

### [03:30 – 04:15] Step 4 & 5: Verifiable Certificate & Student Citizen Window

| Time | What to do on screen | Spoken Voiceover (Say this word for word) |
|---|---|---|
| **03:30** | Click **"4. Verifiable Certificate"** in the sidebar. The degree certificate preview appears. | *"Now let's examine AICTE Requirement 10: Academic Certificates. Here is SAKSHI's Degree Credential Block."* |
| **03:42** | Point to the Institutional Student ID and the **Masked APAAR ID** (`•••• •••• 8942`) and the QR code. | *"It displays the student's institutional roll number alongside their masked APAAR ID and an Ed25519-signed QR code. An employer scans this QR and gets 'Enrolled, Active' in under 1 second without querying a central name database."* |
| **03:58** | Click **"5. Student Window"** in the sidebar. Click **"Login as Meera"**. | *"Now let's see the student's perspective. Meera logs in via private OTP. She discovers an unauthorized college in Chennai has registered her as a student to claim funding."* |
| **04:08** | Click the red button **"This is not me"** next to SSN College. Select *Ghost Enrolment* and click Submit. | *"Meera clicks 'This is not me'. Instantly, a dispute case is registered on AICTE's investigation queue. Ghost enrolment is stopped at the root."* |

---

### [04:15 – 05:00] Step 6: The Mathematical Privacy Proof & Grand Finale

| Time | What to do on screen | Spoken Voiceover (Say this word for word) |
|---|---|---|
| **04:15** | Click **"6. Privacy Proof"** in the sidebar. | *"Finally, how do we prove SAKSHI isn't making empty promises? Let's run the Privacy Proof."* |
| **04:25** | Click the big black button **"Run privacy scan"**. Watch the animated counter drop to 0. | *"When I click 'Run privacy scan', SAKSHI executes a live regex scan across all 19 database tables. Result: exactly ZERO 12-digit student IDs exist anywhere in the database, logs, or cache."* |
| **04:42** | Point to the **Audit Chain Verified** badge and the **Ed25519 Signed Merkle Root**. | *"All audit events are locked in an immutable SHA-256 hash chain with daily signed Merkle roots. Tamper with any historical entry, and the chain immediately breaks."* |
| **04:52** | Bring cursor back to the brand logo **सा** on the left. Look directly at the camera/screen. | *"SAKSHI delivers complete regulatory oversight, 100% DPDP Act compliance, and zero privacy liability for AICTE. A witness that confirms, never discloses. Thank you."* |

---

## Pro Tips for Recording
- **Resolution:** 1080p (1920×1080).
- **Tool:** OBS Studio, Loom, or Windows Xbox Game Bar (`Win + Alt + R`).
- **Cursor:** Keep the mouse moving smoothly; hover over the element 1 second *before* talking about it.
- **Tone:** Confident, crisp, authoritative. Do not rush.
