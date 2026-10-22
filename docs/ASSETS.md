# SAKSHI — Asset Register & Animation Documentation (Phase 3)

## 1. Ethical & Compliance Constraints
- **Zero Real Human Faces:** No photographs of real individuals, students, or officers are used.
- **Zero Copyrighted / Trademarked Logos:** No official AICTE, Ministry of Education, or Government of India seal images are embedded. System seals are generated algorithmically via procedural SVGs (`Seal.jsx`).
- **Commercial & Open Source Licenses Only:** All icons and animation primitives use permissive licenses (ISC, MIT, CC0).

---

## 2. Interactive Micro-Animation Register (Payment-Success Style)

All UI micro-animations adhere to strict UX constraints:
- **Duration:** 150 ms to 500 ms (ease-out curves).
- **Reduced-Motion Minded:** Checks `window.matchMedia('(prefers-reduced-motion: reduce)')` to instantly render final states when requested by system accessibility settings.
- **No Infinite Loops:** Animations execute once upon user trigger and settle into calm, static states.

| Interaction Trigger | Animation Style | Duration / Easing | File Location | License / Technology |
|---|---|:---:|---|---|
| **CSV Batch Upload Complete** | Numeric APAAR digits dissolve via blur and transform into purple cryptographic seals (`SealingRow`), culminating in a green verified banner. | 450 ms spring ease-out | [`web/src/components/SealingRow.jsx`](file:///e:/projects/sakshi%20sih%202nd/web/src/components/SealingRow.jsx) | Procedural CSS + Framer Motion (MIT) |
| **Credential Verification Success** | Concentric SVG circular track fills 360° with a scale-in checkmark badge. | 500 ms ease-out | [`web/src/screens/Credential.jsx`](file:///e:/projects/sakshi%20sih%202nd/web/src/screens/Credential.jsx#L94-L135) | Custom SVG stroke-dasharray (Self-authored) |
| **Credential Revocation / Crack** | Red warning card splits with a 45° diagonal fracture line across the seal icon. | 300 ms ease-out | [`web/src/screens/Credential.jsx`](file:///e:/projects/sakshi%20sih%202nd/web/src/screens/Credential.jsx#L140-L155) | Custom CSS SVG (Self-authored) |
| **"This is not me" Dispute Filed** | Modal form collapses; sealed envelope icon scales in with an authentic `DISP-2026-XXXX` reference docket confirmation. | 400 ms spring | [`web/src/screens/CitizenWindow.jsx`](file:///e:/projects/sakshi%20sih%202nd/web/src/screens/CitizenWindow.jsx#L618-L635) | Procedural Tailwind (MIT) |
| **Admission Season Replay Scrubber** | Smooth progress bar transition responding to day slider across counselling milestones. | 250 ms linear | [`web/src/screens/Integrity.jsx`](file:///e:/projects/sakshi%20sih%202nd/web/src/screens/Integrity.jsx#L470-L515) | Native HTML5 Range + Tailwind CSS |

---

## 3. Asset & Library Provenance

| Asset / Package | Purpose | Source / URL | License |
|---|---|---|---|
| **Lucide React** (`v0.453`) | Interface icons (Shield, Lock, Building, CheckCircle, etc.) | [lucide.dev](https://lucide.dev) | ISC License (Permissive) |
| **qrcode.react** (`v4.0`) | Client-side QR code rendering for Enrolment Credentials | [npmjs.com/package/qrcode.react](https://www.npmjs.com/package/qrcode.react) | ISC License |
| **Framer Motion** (`v11.11`) | Physics-based spring transitions and modal entry animations | [framer.com/motion](https://www.framer.com/motion/) | MIT License |
| **Procedural Seal Engine** | Generates deterministic geometric SVG seals based on SHA-256 tokens | Self-authored (`Seal.jsx`) | MIT License |
| **Tailwind CSS** (`v3.4`) | Utility design system and responsive color palette | [tailwindcss.com](https://tailwindcss.com) | MIT License |
| **Student Avatar Suite** | Synthetic, illustrative vector SVG student portraits (Asha, Ravi, Meera) | Self-authored (`StudentAvatar.jsx`) | MIT License |
| **Collegiate Emblem Engine** | Procedural institutional crests (MIT Pune, RV College, SSN Chennai) | Self-authored (`CollegeEmblem.jsx`) | MIT License |

---

## 4. Exported Media & Demo Production Artifacts (Phase 4)

All demo media are deterministically recorded via automated Playwright navigation (`scripts/record_demo.py`) against seed 42 synthetic data with smooth mouse interpolation and expanding click ripple rings. Zero external audio or music is used.

### Demo Videos
- **`demo/sakshi-demo.mp4`** (1080p Full HD @ 30fps, ~4 minutes):
  Leisurely-paced, human-speed judging presentation covering:
  1. Scene 1: AICTE Problem Statement & Crisis Overview (Ghost seats, dual admissions, overruns, DPDP risk)
  2. Scene 2: National Admission Portfolio with collegiate emblems & real-time telemetry
  3. Scene 3: Lock 1 & 2 Ephemeral CSV Ingestion with ID dissolve-to-seal animation & 5 quotas
  4. Scene 4: Lock 2 Blind Duplicate Radar with bilateral registrar inquiry modal
  5. Scene 5: Lock 3 Admission Season Replay scrubber & NBA/NAAC accreditation reports
  6. Scene 6: Citizen Window with student avatars & "This is not me" dispute submission
  7. Scene 7: Stateless Public Employer Verification with concentric checkmark ring (< 1s)
  8. Scene 8: Mathematical Privacy Proof & Closing Statement
- **`demo/sakshi-60s.mp4`** (1080p Full HD @ 30fps, ~60s condensed cut):
  Rapid trailer suitable for elevator pitches and preliminary judging screens.
- **`docs/SPEECH_SCRIPT.md`**: Complete word-for-word voiceover script matching the 4-minute video down to the second with on-screen visual cue markers.

### Presentation Screenshots (1920x1080 Full HD PNGs)
1. **`demo/screenshots/01-executive-portfolio.png`**: Multi-campus intake monitoring & system health indicators.
2. **`demo/screenshots/02-upload-sealing.png`**: In-browser client-side hashing & instant cryptographic tokenization.
3. **`demo/screenshots/03-duplicate-radar.png`**: Cross-institution duplicate detection with dual-control privacy reveal.
4. **`demo/screenshots/04-citizen-dispute.png`**: Citizen Window showing 1-click login and verified dispute docket confirmation.
5. **`demo/screenshots/05-credential-verification.png`**: Public instant verification card with concentric ring checkmark.
6. **`demo/screenshots/06-privacy-proof.png`**: Real-time automated regex database inspection proving zero PII storage.

### Presentation Animated GIFs (800x450, Optimized)
1. **`demo/gifs/01-upload-sealing.gif`** (518 KB): The sealing moment — raw digits dissolving into cryptographic seals.
2. **`demo/gifs/02-radar-dual-control.gif`** (446 KB): Dual-control bilateral inquiry dispatch modal.
3. **`demo/gifs/03-citizen-dispute.gif`** (308 KB): "This is not me" dispute submission and sealed envelope badge.


