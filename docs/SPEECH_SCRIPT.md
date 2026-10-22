# SAKSHI — 3-Minute Presentation & Demo Voiceover Script
**Project:** SAKSHI — APAAR ID-Based Student Data Management & Verification  
**Problem Statement:** PS SIH26263 (AICTE Regulation Bureau)  
**Target Duration:** 2 minutes 57 seconds (177 seconds)  
**Tone:** Confident, clear, professional, authoritative, and regulatory-focused.  
**Instructions for the Speaker:**
- Speak at a calm, natural conversational pace (~130 words per minute).
- Do not rush. Let the screen settle when a button is clicked or an animation plays.
- The visual mouse cursor on the screen moves smoothly and pulses with a blue ripple ring whenever a button is clicked. Use the screen cues marked `[ON SCREEN]` to sync your voice with the video.

---

### [00:00 – 00:32] Scene 1: The AICTE Problem Statement & The Regulatory Crisis
**[ON SCREEN: SAKSHI Home Page loads. The virtual mouse cursor slides over the interactive "Problem Statement SIH26263" panel.]**

> **Speaker:**  
> "Respected judges, every admission season, the All India Council for Technical Education faces a critical governance challenge.
> 
> Currently, AICTE receives aggregated headcount numbers during institutional approvals. We know a college claims two hundred and forty students—but we cannot verify if real students exist behind those numbers without collecting personal documents.
> 
> **[ON SCREEN: Cursor clicks Challenge 01 — 'Statistical Blindness & Ghost Enrolments']**  
> This information vacuum creates four catastrophic regulatory vulnerabilities:  
> First, **Ghost Enrolments**: unscrupulous colleges submit fake student rosters to siphon state scholarship grants and fabricate faculty-student ratios.
> 
> **[ON SCREEN: Cursor clicks Challenge 02 — 'Inter-State Dual Seat Hoarding']**  
> Second, **Dual-Seat Hoarding**: affluent candidates block engineering seats across state borders simultaneously—holding seats in Maharashtra and Karnataka while deserving waitlisted rural candidates are shut out.
> 
> **[ON SCREEN: Cursor clicks Challenge 03 — 'Sanctioned Intake Overruns']**  
> Third, **Unsanctioned Capacity Overruns**: institutions quietly admit thirty percent beyond their approved intake, diluting educational infrastructure.
> 
> **[ON SCREEN: Cursor clicks Challenge 04 — 'Central Database Surveillance & DPDP Risk']**  
> And fourth, the **Privacy Trap**: under Section 6 of India's Digital Personal Data Protection Act 2023, AICTE cannot simply build a central honeypot storing ten million raw Aadhaar or APAAR numbers.
> 
> That is why we built **SAKSHI**: a platform that establishes authentic, real-time verifiable student records—*without collecting or storing student identity*."

---

### [00:32 – 00:54] Scene 2: Executive Admission Portfolio & Collegiate Incidents
**[ON SCREEN: Cursor scrolls down smoothly into the Executive Admission Portfolio. The blue intake curve and 15 monitored institutions appear with collegiate crests.]**

> **Speaker:**  
> "Here on the AICTE Regulation Bureau executive dashboard, thirty-three hundred active enrolments across fifteen multi-state campuses are continuously monitored in real time.
> 
> Notice the live verification pill: over seventy-seven percent of admissions are cryptographically authenticated via blind HMAC seals.
> 
> **[ON SCREEN: Cursor hovers over Recent Verification Incidents table showing MIT Pune, RV College, and SSN Chennai crests.]**  
> Below, our deterministic rule engine evaluates admission incidents directly against the AICTE Approval Process Handbook. Notice the collegiate crests: MIT Pune, RV College Bengaluru, SSN Chennai.
> 
> When an anomaly occurs—such as Rule R1 detecting a dual-campus enrolment—the system cites the exact regulatory clause with zero opaque AI guessing.
> 
> **[ON SCREEN: Cursor moves to the 'Upload Batch CSV' button and clicks. Blue ripple ring expands.]**  
> Let us observe how an approved institution submits student records."

---

### [00:54 – 01:28] Scene 3: Lock 1 & Lock 2 — Ephemeral Ingestion & The Sealing Moment
**[ON SCREEN: Institution Upload Portal loads. Explainer steps 1, 2, 3 visible on the left.]**

> **Speaker:**  
> "This is **Lock One and Lock Two**: Ephemeral Ingestion and Blind Tokenization.
> 
> When a college registrar uploads an admission roster, the student's twelve-digit APAAR ID is verified transiently in browser memory against the national registry. It is *never* written to a disk or log file.
> 
> **[ON SCREEN: Cursor clicks 'Load demo CSV'. Blue ripple pulses.]**  
> Notice the diversity of student categories mandated by Requirement Two: General, Supernumerary Tuition Fee Waiver, Non-Resident Indian, Overseas Citizen of India, and Foreign National seats.
> 
> **[ON SCREEN: Cursor moves to 'Upload Admissions CSV' and clicks. Blue ripple ring expands.]**  
> Now watch the sealing moment.
> 
> **[ON SCREEN: Rows process sequentially. Digits blur, dissolve, and transform into purple cryptographic geometric seals STU-XXXX.]**  
> As the records ingest, raw digits dissolve into HMAC-SHA256 blind tokens keyed to cohort KMS secrets. Even if an attacker steals the entire database tomorrow, the tokens cannot be reversed back to APAAR numbers.
> 
> Notice row six: an attested offline quota for a student who lawfully opted out under the DPDP Act. Headcount is preserved; zero fraud flags are raised."

---

### [01:28 – 01:58] Scene 4: Lock 2 Blind Duplicate Radar & Dual-Control Inquiry Notice
**[ON SCREEN: Cursor navigates to 'Duplicate Radar'. The table displays duplicate cases.]**

> **Speaker:**  
> "Now let us examine **Lock Two in action**: our Blind Duplicate Radar.
> 
> **[ON SCREEN: Cursor points to the active duplicate card for Ravi Kumar's seal: MIT Pune vs RV College Bengaluru.]**  
> Here, Rule R1 flags candidate Ravi Kumar holding simultaneous full-time B.Tech seats at MIT Pune in Maharashtra and RV College in Bengaluru.
> 
> Crucially, AICTE sees neither Ravi's name nor his Aadhaar number. SAKSHI matches only identical blind HMAC tokens.
> 
> **[ON SCREEN: Cursor clicks 'Ask Both Colleges'. Modal opens showing MIT Pune and RV College crests.]**  
> When the AICTE officer takes action, clicking *'Ask Both Colleges'* triggers our patent-pending Dual-Control Bilateral Notice protocol.
> 
> **[ON SCREEN: Cursor hovers over collegiate crests and points to 'Dispatch Signed Notice'.]**  
> SAKSHI issues an Ed25519-signed challenge to both college registrars simultaneously: *'Confirm if student token AXEC is actively attending physical classes.'*
> 
> **[ON SCREEN: Cursor clicks 'Dispatch Signed Notice'. Confirmation appears. Cursor clicks 'Done'.]**  
> The first institution to yield cancels the duplicate, automatically releasing the blocked seat to the next student on the AICTE state merit list."

---

### [01:58 – 02:22] Scene 5: Lock 3 — Admission Season Replay & 5-Quota Ledger
**[ON SCREEN: Cursor navigates to 'Integrity Score'. The 4-tab suite appears.]**

> **Speaker:**  
> "Moving to **Lock Three**: Triangulating the Truth.
> 
> SAKSHI replaces black-box neural networks with mathematical seat integrity scores from zero to one hundred, penalized strictly according to transparent handbook rules.
> 
> **[ON SCREEN: Cursor clicks 'Season Replay' tab.]**  
> For the first time, AICTE regulators have an interactive **Admission Season Replay scrubber**.
> 
> **[ON SCREEN: Cursor smoothly drags the timeline slider from August 1 across counselling rounds.]**  
> As we scrub through August and September, regulators observe intake velocity. When MIT Pune suddenly spikes to three hundred and twelve admissions against an approved intake of two hundred and forty, Rule R3 flags a thirty percent capacity overrun before degrees are printed.
> 
> **[ON SCREEN: Cursor clicks 'Accreditation Report' tab.]**  
> Furthermore, with one click, SAKSHI compiles verified NBA Criterion Four and NAAC Criterion Two accreditation audits, complete with small-cell privacy suppression for statistical compliance."

---

### [02:22 – 02:40] Scene 6: Citizen Window — Student Sovereignty & 'This is not me'
**[ON SCREEN: Cursor navigates to 'Citizen Window'. The 1-click persona portal loads with illustrated avatars for Asha, Ravi, and Meera.]**

> **Speaker:**  
> "What about the student's voice? This is the **Citizen Window**, embodying total DPDP Act compliance.
> 
> **[ON SCREEN: Cursor points to the student avatars, then clicks 'Login as Meera Pillai'.]**  
> Students authenticate via mock phone OTP with zero stored credentials. Let us log in as Meera.
> 
> **[ON SCREEN: Meera's dashboard loads with her avatar and purple geometric seal.]**  
> Meera reviews every enrolment tied to her academic seal. Shockingly, she discovers an unauthorized B.Tech enrolment at SSN College of Engineering in Chennai—a ghost registration submitted without her consent to claim government funding.
> 
> **[ON SCREEN: Cursor scrolls to the SSN Chennai card and clicks 'This is not me'.]**  
> Meera asserts her digital sovereignty by clicking **'This is not me'**.
> 
> **[ON SCREEN: Dispute modal opens. Cursor clicks 'Submit Dispute'. Sealed envelope confirmation appears.]**  
> Instantly, an immutable dispute docket is sealed into the audit log. The fraudulent seat is frozen from grant disbursements, and a formal inquiry notice is served to the institution."

---

### [02:40 – 02:49] Scene 7: Stateless Public Employer Credential Verification
**[ON SCREEN: Standalone Public Verifier page loads at /verify/6BRQOTU4L7UB.]**

> **Speaker:**  
> "Now consider the employer or background screening agency.
> 
> **[ON SCREEN: Concentric green SVG verification ring fills 360 degrees. Bold checkmark badge scales in.]**  
> When an employer scans the QR code printed on Ravi's degree certificate per AICTE Requirement Ten, they arrive at this standalone public verification portal.
> 
> In less than eight hundred milliseconds, SAKSHI validates the Ed25519 digital signature against AICTE's root key.
> 
> The employer confirms Ravi holds a legitimate, non-revoked degree from MIT Pune—without accessing Ravi's Aadhaar, phone number, or academic transcript. Verification is authentic, instant, and completely stateless."

---

### [02:49 – 02:57] Scene 8: Mathematical Privacy Proof & Closing Statement
**[ON SCREEN: Navigation to /proof. Privacy Proof dashboard loads.]**

> **Speaker:**  
> "Finally, we don't just ask AICTE to trust our privacy claims—we prove them mathematically.
> 
> **[ON SCREEN: Cursor clicks 'Run Automated Regex Inspection'. Progress bar scans 19 database tables.]**  
> Live on screen, an automated regex scanner inspects all nineteen SQLite database tables for twelve-digit Aadhaar and APAAR numbers.
> 
> The result: **Zero leaks. Zero raw IDs stored.** Linked by an immutable SHA-256 Merkle audit chain.
> 
> SAKSHI delivers verifiable student records, ends ghost enrolments, stops dual seat blocking, and safeguards national privacy.
> 
> **SAKSHI: A witness that confirms, never discloses.** Thank you."

