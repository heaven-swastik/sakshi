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
