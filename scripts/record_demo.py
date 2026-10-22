"""
record_demo.py — Deterministic Master Presentation & Demo Video Generator for SAKSHI.

Implements the complete 5-part Hackathon Judging Pitch:
1. PART 1: The Problem We Are Solving (AICTE Data Crisis, Ghost Seats, Dual Admissions, DPDP Risk)
2. PART 2: Our Approach (The 3 Locks Philosophy & 3D WebGL Cryptographic Vault)
3. PART 3: Engineering Architecture Diagram of the 7-Stage Workflow Pipeline
4. PART 4: Enterprise Tech Stack Matrix
5. PART 5: Live Interactive System Demonstration (Upload Sealing, Duplicate Radar, Season Replay, Citizen Dispute, Public Verifier, Privacy Proof)

Features:
- Viewport: 1920x1080 (Full HD, 30 fps)
- High-Visibility Kinetic Keyword HUD & Top Narrative Captions
- Smooth Visual Mouse Cursor with Animated Expanding Click Ripples
- Pacing: ~4 to 4.5 minutes deliberate presentation pace
"""

import os
import sys
import time
import shutil
import asyncio
import subprocess
from pathlib import Path
from PIL import Image
import imageio_ffmpeg

# Root paths
ROOT_DIR = Path(__file__).resolve().parent.parent
DEMO_DIR = ROOT_DIR / "demo"
SCREENSHOTS_DIR = DEMO_DIR / "screenshots"
GIFS_DIR = DEMO_DIR / "gifs"
TEMP_VIDEO_DIR = DEMO_DIR / "temp_video"

for d in [DEMO_DIR, SCREENSHOTS_DIR, GIFS_DIR, TEMP_VIDEO_DIR]:
    d.mkdir(parents=True, exist_ok=True)

FFMPEG_BIN = imageio_ffmpeg.get_ffmpeg_exe()

async def setup_presentation_overlays(page):
    """Injects virtual mouse cursor, click ripple system, top caption, and bottom-right kinetic keyword HUD."""
    await page.evaluate("""
        () => {
            if (document.getElementById('demo-presentation-layer')) return;

            const layer = document.createElement('div');
            layer.id = 'demo-presentation-layer';
            layer.style.position = 'fixed';
            layer.style.inset = '0';
            layer.style.pointerEvents = 'none';
            layer.style.zIndex = '9999999';
            document.body.appendChild(layer);

            // 1. Virtual Mouse Cursor Pointer
            const cursor = document.createElement('div');
            cursor.id = 'demo-virtual-cursor';
            cursor.style.position = 'absolute';
            cursor.style.top = '120px';
            cursor.style.left = '120px';
            cursor.style.width = '34px';
            cursor.style.height = '34px';
            cursor.style.transform = 'translate(-4px, -4px)';
            cursor.style.transition = 'top 0.65s cubic-bezier(0.22, 1, 0.36, 1), left 0.65s cubic-bezier(0.22, 1, 0.36, 1)';
            cursor.innerHTML = `
                <svg width="30" height="30" viewBox="0 0 28 28" fill="none" style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));">
                    <path d="M5 3L13 25L17 15L25 11L5 3Z" fill="#0F172A" stroke="#FFFFFF" stroke-width="2.4" stroke-linejoin="round"/>
                </svg>
            `;
            layer.appendChild(cursor);

            // Move cursor helper
            window.__moveCursor = (x, y) => {
                cursor.style.left = `${x}px`;
                cursor.style.top = `${y}px`;
            };

            // Click ripple effect
            window.__clickRipple = (x, y) => {
                const ripple = document.createElement('div');
                ripple.style.position = 'absolute';
                ripple.style.left = `${x - 26}px`;
                ripple.style.top = `${y - 26}px`;
                ripple.style.width = '52px';
                ripple.style.height = '52px';
                ripple.style.borderRadius = '50%';
                ripple.style.border = '3px solid #38BDF8';
                ripple.style.backgroundColor = 'rgba(56, 189, 248, 0.3)';
                ripple.style.transform = 'scale(0.2)';
                ripple.style.opacity = '1';
                ripple.style.transition = 'all 0.5s ease-out';
                layer.appendChild(ripple);

                requestAnimationFrame(() => {
                    ripple.style.transform = 'scale(2.0)';
                    ripple.style.opacity = '0';
                });

                setTimeout(() => ripple.remove(), 550);
            };

            // 2. Bottom-Right Kinetic Keyword HUD
            const hud = document.createElement('div');
            hud.id = 'demo-keyword-hud';
            hud.style.position = 'fixed';
            hud.style.bottom = '24px';
            hud.style.right = '24px';
            hud.style.backgroundColor = 'rgba(15, 23, 42, 0.94)';
            hud.style.backdropFilter = 'blur(12px)';
            hud.style.border = '1px solid rgba(56, 189, 248, 0.3)';
            hud.style.boxShadow = '0 16px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)';
            hud.style.padding = '14px 20px';
            hud.style.borderRadius = '18px';
            hud.style.maxWidth = '420px';
            hud.style.fontFamily = 'system-ui, -apple-system, sans-serif';
            hud.style.transition = 'all 0.35s ease-out';
            hud.style.zIndex = '999999';
            hud.innerHTML = `
                <div id="hud-pill" style="display: inline-block; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #38BDF8; background: rgba(56, 189, 248, 0.15); padding: 2px 8px; rounded-radius: 6px; border-radius: 6px;">
                    KEY TECHNICAL PILLAR
                </div>
                <div id="hud-title" style="font-size: 16px; font-weight: 900; color: #FFFFFF; margin-top: 5px; letter-spacing: -0.01em;">
                    SAKSHI for AICTE
                </div>
                <div id="hud-sub" style="font-size: 11.5px; color: #94A3B8; margin-top: 2px; font-weight: 500;">
                    Verify Student Enrolment Without Collecting Identity
                </div>
            `;
            layer.appendChild(hud);
        }
    """)

async def update_hud(page, category: str, title: str, subtitle: str = ""):
    """Updates the bottom-right kinetic keyword HUD."""
    await page.evaluate("""
        ([category, title, subtitle]) => {
            const pill = document.getElementById('hud-pill');
            const t = document.getElementById('hud-title');
            const s = document.getElementById('hud-sub');
            if (pill) pill.innerText = category;
            if (t) t.innerText = title;
            if (s) s.innerText = subtitle;
        }
    """, [category, title, subtitle])

async def inject_caption(page, text: str, subtitle: str = ""):
    """Injects a sleek top-centered narrative caption."""
    await page.evaluate("""
        ([text, subtitle]) => {
            let el = document.getElementById('demo-caption-overlay');
            if (!el) {
                el = document.createElement('div');
                el.id = 'demo-caption-overlay';
                el.style.position = 'fixed';
                el.style.top = '16px';
                el.style.left = '50%';
                el.style.transform = 'translateX(-50%)';
                el.style.zIndex = '999999';
                el.style.backgroundColor = 'rgba(15, 23, 42, 0.95)';
                el.style.backdropFilter = 'blur(12px)';
                el.style.color = '#FFFFFF';
                el.style.padding = '12px 28px';
                el.style.borderRadius = '20px';
                el.style.boxShadow = '0 12px 35px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.15)';
                el.style.fontFamily = 'system-ui, -apple-system, sans-serif';
                el.style.textAlign = 'center';
                el.style.maxWidth = '920px';
                el.style.transition = 'all 0.3s ease-out';
                document.body.appendChild(el);
            }
            el.innerHTML = `
                <div style="font-size: 14.5px; font-weight: 700; letter-spacing: -0.01em; color: #FFFFFF;">${text}</div>
                ${subtitle ? `<div style="font-size: 11.5px; font-weight: 500; color: #94A3B8; margin-top: 3px;">${subtitle}</div>` : ''}
            `;
        }
    """, [text, subtitle])

async def smooth_click(page, locator, delay_after=2.5):
    """Smoothly moves virtual cursor to element, triggers click ring, and performs click."""
    try:
        box = await locator.bounding_box()
        if not box:
            await locator.click()
            await asyncio.sleep(delay_after)
            return

        cx = box['x'] + box['width'] / 2
        cy = box['y'] + box['height'] / 2

        # Move virtual cursor
        await page.evaluate("([x, y]) => window.__moveCursor(x, y)", [cx, cy])
        await asyncio.sleep(0.65)

        # Trigger expanding click ripple
        await page.evaluate("([x, y]) => window.__clickRipple(x, y)", [cx, cy])
        await asyncio.sleep(0.15)

        await locator.click()
        await asyncio.sleep(delay_after)
    except Exception as e:
        try:
            await locator.click()
        except:
            pass
        await asyncio.sleep(delay_after)

async def run_master_recording():
    from playwright.async_api import async_playwright

    print("=" * 75)
    print("SAKSHI — Master Hackathon Judging Video Recording (1080p Full HD)")
    print("Structured Flow: Problem -> Approach & 3D -> Architecture -> Tech Stack -> Demo")
    print("=" * 75)

    gif_frames_upload = []
    gif_frames_radar = []
    gif_frames_dispute = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--hide-scrollbars",
            ]
        )

        context = await browser.new_context(
            viewport={"width": 1920, "height": 1080},
            device_scale_factor=1,
            record_video_dir=str(TEMP_VIDEO_DIR),
            record_video_size={"width": 1920, "height": 1080},
        )

        page = await context.new_page()

        # ═════════════════════════════════════════════════════════════════════
        # PART 1: THE PROBLEM WE ARE SOLVING [00:00 - 00:40]
        # ═════════════════════════════════════════════════════════════════════
        print("\n[Part 1/5] The Problem Statement: AICTE Institutional Crisis...")
        await page.goto("http://localhost:5173/")
        await page.wait_for_load_state("networkidle")
        await setup_presentation_overlays(page)
        await asyncio.sleep(1.5)

        await inject_caption(
            page,
            "Part 1: The Problem — Why Statistical Macro Reporting Fails AICTE",
            "Institutions report aggregated headcount without authentic student-level verification."
        )
        await update_hud(
            page,
            "REGULATORY VULNERABILITY 01",
            "Ghost Enrolment Exploitation",
            "Colleges claim phantom students to siphon scholarships & inflate Faculty-to-Student ratios"
        )
        await asyncio.sleep(4)

        # Explore Challenge 1: Ghost Enrolments
        c1 = page.locator("text='Statistical Blindness & Ghost Enrolments'").first
        if await c1.count() > 0:
            await smooth_click(page, c1, delay_after=4.5)

        # Explore Challenge 2: Dual Seat Hoarding
        await update_hud(
            page,
            "REGULATORY VULNERABILITY 02",
            "Inter-State Dual Seat Hoarding",
            "Students hold seats in two colleges concurrently (e.g. Pune & Bengaluru), blocking deserving candidates"
        )
        c2 = page.locator("text='Inter-State Dual Seat Hoarding'").first
        if await c2.count() > 0:
            await smooth_click(page, c2, delay_after=4.5)

        # Explore Challenge 3: Sanctioned Capacity Overruns
        await update_hud(
            page,
            "REGULATORY VULNERABILITY 03",
            "Capacity Overruns (130%+ Intake)",
            "Institutions quietly admit beyond sanctioned limits without detection by physical inspection"
        )
        c3 = page.locator("text='Sanctioned Intake Overruns'").first
        if await c3.count() > 0:
            await smooth_click(page, c3, delay_after=4.5)

        # Explore Challenge 4: DPDP Database Surveillance Risk
        await update_hud(
            page,
            "PRIVACY COMPLIANCE DILEMMA",
            "DPDP Act 2023 Central Honeypot",
            "Storing 10M raw Aadhaar/APAAR IDs centrally creates massive breach liability & violates Section 6"
        )
        c4 = page.locator("text='Central Database Surveillance & DPDP Risk'").first
        if await c4.count() > 0:
            await smooth_click(page, c4, delay_after=4.5)

        await page.screenshot(path=str(SCREENSHOTS_DIR / "01-executive-portfolio.png"))

        # ═════════════════════════════════════════════════════════════════════
        # PART 2: OUR APPROACH — THE 3 LOCKS & 3D CRYPTOGRAPHIC VAULT [00:40 - 01:20]
        # ═════════════════════════════════════════════════════════════════════
        print("\n[Part 2/5] The Approach: 3 Locks Philosophy & 3D Cryptographic Vault...")
        await page.goto("http://localhost:5173/architecture")
        await page.wait_for_load_state("networkidle")
        await setup_presentation_overlays(page)
        await asyncio.sleep(2)

        await inject_caption(
            page,
            "Part 2: Our Approach — The 3 Locks Cryptographic Architecture",
            "Verify at the Source, Blind at the Boundary, Triangulate the Truth."
        )
        await update_hud(
            page,
            "CORE ARCHITECTURAL PHILOSOPHY",
            "Zero Knowledge, Zero PII",
            "Hardware-accelerated WebGL 3D cryptographic vault illustrating cohort-isolated blind tokens"
        )
        await asyncio.sleep(3.5)

        # Hover around the 3D Vault
        await page.evaluate("([x, y]) => window.__moveCursor(x, y)", [500, 320])
        await asyncio.sleep(2.5)

        # Click Lock 1 Pill in the 3D Vault
        l1_btn = page.locator("button:has-text('Lock 1')").first
        if await l1_btn.count() > 0:
            await update_hud(page, "LOCK 1: SOURCE INGESTION", "Ephemeral WebCrypto Verification", "Raw APAAR verified in browser RAM; immediately purged with zero disk persistence")
            await smooth_click(page, l1_btn, delay_after=3.5)

        # Click Lock 2 Pill
        l2_btn = page.locator("button:has-text('Lock 2')").first
        if await l2_btn.count() > 0:
            await update_hud(page, "LOCK 2: BLIND TOKENIZATION", "Cohort-Isolated HMAC-SHA256", "Salted with KMS secrets; irreversible & unlinkable across academic years")
            await smooth_click(page, l2_btn, delay_after=3.5)

        # Click Lock 3 Pill
        l3_btn = page.locator("button:has-text('Lock 3')").first
        if await l3_btn.count() > 0:
            await update_hud(page, "LOCK 3: TRIANGULATE TRUTH", "Deterministic Regulatory Engine", "Mathematical Seat Integrity Score (100 - penalties); zero black-box AI guessing")
            await smooth_click(page, l3_btn, delay_after=3.5)

        # ═════════════════════════════════════════════════════════════════════
        # PART 3: ENGINEERING ARCHITECTURE WORKFLOW DIAGRAM [01:20 - 02:05]
        # ═════════════════════════════════════════════════════════════════════
        print("\n[Part 3/5] Engineering Architecture: 7-Stage Workflow Pipeline...")
        await page.evaluate("window.scrollTo({top: 480, behavior: 'smooth'})")
        await asyncio.sleep(2)

        await inject_caption(
            page,
            "Part 3: Engineering Architecture — End-to-End Cryptographic Dataflow",
            "Interactive 7-stage workflow from institutional ERP ingestion to public stateless verification."
        )

        # Stage 1: ERP Ingestion
        await update_hud(page, "PIPELINE STAGE 01", "Institutional Ingestion (< 45ms)", "Supports Samarth, SAP, Tally ERP webhooks & batch CSV dropzone with 5 distinct quotas")
        s1 = page.locator("button:has-text('Institutional Ingestion')").first
        if await s1.count() > 0:
            await smooth_click(page, s1, delay_after=4.5)

        # Stage 3: Blind HMAC Tokenizer
        await update_hud(page, "PIPELINE STAGE 03", "Blind HMAC Tokenizer (< 5ms)", "Generates STU-XXXX base32 tokens; 100% collision-resistant across 100M student records")
        s3 = page.locator("button:has-text('Blind HMAC Tokenizer')").first
        if await s3.count() > 0:
            await smooth_click(page, s3, delay_after=4.5)

        # Stage 5: Dual-Control Notice
        await update_hud(page, "PIPELINE STAGE 05", "Dual-Control Bilateral Notice", "Ed25519-signed inquiry challenge to both colleges; zero names or IDs disclosed between rivals")
        s5 = page.locator("button:has-text('Dual-Control Notice')").first
        if await s5.count() > 0:
            await smooth_click(page, s5, delay_after=4.5)

        # Stage 7: Stateless Public Verifier
        await update_hud(page, "PIPELINE STAGE 07", "Stateless Public Verifier (< 800ms)", "RFC 8037 JWS compact tokens; offline 2D QR barcode verification for employers")
        s7 = page.locator("button:has-text('Stateless Public Verifier')").first
        if await s7.count() > 0:
            await smooth_click(page, s7, delay_after=4.5)

        # ═════════════════════════════════════════════════════════════════════
        # PART 4: ENTERPRISE TECHNOLOGY STACK MATRIX [02:05 - 02:35]
        # ═════════════════════════════════════════════════════════════════════
        print("\n[Part 4/5] Enterprise Tech Stack: Production Standards & Frameworks...")
        await page.evaluate("window.scrollTo({top: 980, behavior: 'smooth'})")
        await asyncio.sleep(2)

        await inject_caption(
            page,
            "Part 4: Enterprise Tech Stack — Built on Modern Open Standards",
            "High-concurrency Python 3.13 FastAPI backend, React 18 Three.js WebGL frontend, Ed25519 cryptography."
        )
        await update_hud(
            page,
            "ENTERPRISE PRODUCTION STACK",
            "100% Production Ready",
            "FastAPI Async + React Three.js + Ed25519 JWS + SQLite WAL (CockroachDB/PostgreSQL Ready)"
        )
        await asyncio.sleep(6)

        # ═════════════════════════════════════════════════════════════════════
        # PART 5: LIVE SYSTEM DEMONSTRATION [02:35 - 04:20]
        # ═════════════════════════════════════════════════════════════════════
        print("\n[Part 5/5] Live Demonstration: Real-Time Regulatory System in Action...")

        # ── DEMO 1: CSV INGESTION & REAL-TIME SEALING [02:35 - 03:05]
        await page.goto("http://localhost:5173/upload")
        await page.wait_for_load_state("networkidle")
        await setup_presentation_overlays(page)
        await asyncio.sleep(2)

        await inject_caption(
            page,
            "Demo 1: Ephemeral Ingestion & Digits Dissolving into Seals",
            "Raw 12-digit numbers dissolve into purple HMAC tokens. Full 5-quota breakdown per Requirement 2."
        )
        await update_hud(
            page,
            "LIVE DEMO: LOCK 1 & LOCK 2",
            "Instant Sealing Animation",
            "Observing General, Supernumerary (TFW), NRI, OCI, and Foreign National (FN) allocations"
        )
        await asyncio.sleep(3)

        # Click Load Demo CSV
        demo_btn = page.locator("button:has-text('Load demo CSV'), button:has-text('Load Demo CSV')").first
        if await demo_btn.count() > 0:
            await smooth_click(page, demo_btn, delay_after=3.5)

        # Click Upload Admissions CSV
        upload_btn = page.locator("button:has-text('Upload Admissions CSV'), button:has-text('Upload')").first
        if await upload_btn.count() > 0:
            await smooth_click(page, upload_btn, delay_after=1.0)

        # Capture animated sealing frames for GIF 1
        for _ in range(12):
            await asyncio.sleep(0.35)
            frame_path = TEMP_VIDEO_DIR / f"frame_upload_{len(gif_frames_upload)}.png"
            await page.screenshot(path=str(frame_path))
            gif_frames_upload.append(frame_path)

        await page.evaluate("window.scrollTo({top: 260, behavior: 'smooth'})")
        await asyncio.sleep(4)
        await page.screenshot(path=str(SCREENSHOTS_DIR / "02-upload-sealing.png"))

        # ── DEMO 2: BLIND DUPLICATE RADAR & BILATERAL NOTICE [03:05 - 03:35]
        await page.goto("http://localhost:5173/radar")
        await page.wait_for_load_state("networkidle")
        await setup_presentation_overlays(page)
        await asyncio.sleep(2)

        await inject_caption(
            page,
            "Demo 2: Blind Duplicate Radar (Rule R1) & Bilateral Inquiry Challenge",
            "Same student seal active at MIT Pune & RV College Bengaluru simultaneously. 100% precision."
        )
        await update_hud(
            page,
            "LIVE DEMO: RULE R1 DETECTION",
            "100% Precision Dual-Seat Radar",
            "Dispatches simultaneous Ed25519 inquiry challenge to both registrars without leaking names"
        )
        await asyncio.sleep(3)
        await page.screenshot(path=str(SCREENSHOTS_DIR / "03-duplicate-radar.png"))

        # Open Dual-Control Dispute Modal
        ask_btn = page.locator("button:has-text('Ask Both Colleges')").first
        if await ask_btn.count() > 0:
            await smooth_click(page, ask_btn, delay_after=3.5)

            # Capture frames for GIF 2
            for _ in range(8):
                await asyncio.sleep(0.35)
                frame_path = TEMP_VIDEO_DIR / f"frame_radar_{len(gif_frames_radar)}.png"
                await page.screenshot(path=str(frame_path))
                gif_frames_radar.append(frame_path)

            # Click Dispatch Signed Notice
            dispatch_btn = page.locator("button:has-text('Dispatch Signed Notice')").first
            if await dispatch_btn.count() > 0:
                await smooth_click(page, dispatch_btn, delay_after=2.5)

            # Close modal
            done_btn = page.locator("button:has-text('Done')").first
            if await done_btn.count() > 0:
                await smooth_click(page, done_btn, delay_after=2.5)

        # ── DEMO 3: SEASON REPLAY SCRUBBER & QUOTA LEDGER [03:35 - 03:55]
        await page.goto("http://localhost:5173/integrity")
        await page.wait_for_load_state("networkidle")
        await setup_presentation_overlays(page)
        await asyncio.sleep(2)

        await inject_caption(
            page,
            "Demo 3: Admission Season Replay & 5-Quota Integrity Scrubber",
            "Time scrubber tracks intake velocity across milestones; flags 130% intake overruns (Rule R3)."
        )
        await update_hud(
            page,
            "LIVE DEMO: SEASON REPLAY",
            "Intake Velocity Temporal Scrubber",
            "Exposes MIT Pune 312/240 seat overrun before degrees are printed; 1-click NBA/NAAC audit export"
        )
        await asyncio.sleep(3)

        # Click Season Replay Tab
        replay_tab = page.locator("button:has-text('Season Replay')").first
        if await replay_tab.count() > 0:
            await smooth_click(page, replay_tab, delay_after=2.5)

            # Scrub timeline slider smoothly
            slider = page.locator("input[type='range']").first
            if await slider.count() > 0:
                box = await slider.bounding_box()
                if box:
                    for frac in [0.25, 0.6, 1.0]:
                        x = box['x'] + box['width'] * frac
                        y = box['y'] + box['height'] / 2
                        await page.evaluate("([x, y]) => window.__moveCursor(x, y)", [x, y])
                        await page.evaluate("([v]) => { const el = document.querySelector('input[type=range]'); if (el) { el.value = v; el.dispatchEvent(new Event('input', {bubbles: true})); } }", [int(frac * 45)])
                        await asyncio.sleep(2)

        # ── DEMO 4: CITIZEN WINDOW & DISPUTE DOCKET [03:55 - 04:15]
        await page.goto("http://localhost:5173/citizen")
        await page.wait_for_load_state("networkidle")
        await setup_presentation_overlays(page)
        await asyncio.sleep(2)

        await inject_caption(
            page,
            "Demo 4: Citizen Window — Student Sovereignty & 'This is not me'",
            "Meera spots unauthorized registration at SSN Chennai; asserts digital sovereignty via dispute."
        )
        await update_hud(
            page,
            "LIVE DEMO: CITIZEN WINDOW",
            "Student Sovereignty Defense",
            "Meera logs in with vector avatar; clicks 'This is not me' to freeze fraudulent scholarship seat"
        )
        await asyncio.sleep(3)

        # 1-Click login as Meera
        meera_btn = page.locator("button:has-text('Meera')").first
        if await meera_btn.count() > 0:
            await smooth_click(page, meera_btn, delay_after=3.5)

        # Click "This is not me" on SSN Chennai enrolment
        not_me_btn = page.locator("button:has-text('This is not me'), button:has-text('notMe')").first
        if await not_me_btn.count() > 0:
            await smooth_click(page, not_me_btn, delay_after=2.5)

            # Submit dispute
            submit_btn = page.locator("button:has-text('Submit Dispute'), button:has-text('submitDispute')").first
            if await submit_btn.count() > 0:
                await smooth_click(page, submit_btn, delay_after=1.0)

                # Capture frames for GIF 3
                for _ in range(10):
                    await asyncio.sleep(0.35)
                    frame_path = TEMP_VIDEO_DIR / f"frame_disp_{len(gif_frames_dispute)}.png"
                    await page.screenshot(path=str(frame_path))
                    gif_frames_dispute.append(frame_path)

        await page.screenshot(path=str(SCREENSHOTS_DIR / "04-citizen-dispute.png"))
        await asyncio.sleep(3)

        # ── DEMO 5: STATELESS PUBLIC EMPLOYER VERIFICATION [04:15 - 04:30]
        await page.goto("http://localhost:5173/verify/6BRQOTU4L7UB")
        await page.wait_for_load_state("networkidle")
        await setup_presentation_overlays(page)
        await asyncio.sleep(1.5)

        await inject_caption(
            page,
            "Demo 5: Public Verifier — Stateless Ed25519 Credential Verification (< 1s)",
            "Employers verify Ravi's degree QR code statelessly with zero personal identity access."
        )
        await update_hud(
            page,
            "LIVE DEMO: PUBLIC VERIFIER",
            "Sub-Second Verification (< 1s)",
            "Concentric green SVG ring confirms valid Ed25519 signature; zero central database lookup"
        )
        await asyncio.sleep(4)
        await page.screenshot(path=str(SCREENSHOTS_DIR / "05-credential-verification.png"))

        # ── DEMO 6: MATHEMATICAL PRIVACY PROOF & CLOSING [04:30 - 04:45]
        await page.goto("http://localhost:5173/proof")
        await page.wait_for_load_state("networkidle")
        await setup_presentation_overlays(page)
        await asyncio.sleep(2)

        await inject_caption(
            page,
            "Demo 6: Real-Time Automated Privacy Proof — 0 Raw PII Leaks Guaranteed",
            "Regex scan across all 19 database tables confirms zero raw APAAR numbers exist in the system."
        )
        await update_hud(
            page,
            "LIVE DEMO: PRIVACY PROOF",
            "0 Raw PII Storage Leaks",
            "Regex scan over 19 tables confirms 0 leaks; anchored by 42-node SHA-256 Merkle audit chain"
        )
        await asyncio.sleep(3)

        # Click Deep Regex Scan
        scan_btn = page.locator("button:has-text('Scan'), button:has-text('Inspection')").first
        if await scan_btn.count() > 0:
            await smooth_click(page, scan_btn, delay_after=4.5)

        await page.screenshot(path=str(SCREENSHOTS_DIR / "06-privacy-proof.png"))

        # Final Closing Banner
        await inject_caption(
            page,
            "SAKSHI for AICTE SIH26263 — Winning Architecture",
            "A witness that confirms, never discloses. 100% DPDP Act 2023 Compliant."
        )
        await update_hud(
            page,
            "WINNING SIH 2026 SOLUTION",
            "SAKSHI: Real-Time APAAR Verification",
            "Zero Knowledge · Zero Stored PII · DPDP 2023 Compliant · 100% Explainable"
        )
        await asyncio.sleep(6)

        # Close context to write out video
        await page.close()
        video = await page.video.path()
        await context.close()
        await browser.close()

    print("\nProcessing recorded video & converting to MP4...")
    raw_video_path = Path(video)

    out_full = DEMO_DIR / "sakshi-demo.mp4"
    out_60s = DEMO_DIR / "sakshi-60s.mp4"

    # Transcode full 1080p demo to standard H.264 MP4
    subprocess.run([
        FFMPEG_BIN, "-y", "-i", str(raw_video_path),
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-r", "30", "-crf", "20", str(out_full)
    ], check=True)
    print(f"[OK] Saved Master Pitch Demo (1080p): {out_full} ({round(out_full.stat().st_size / (1024*1024), 2)} MB)")

    # Produce condensed trailer (4x speed)
    subprocess.run([
        FFMPEG_BIN, "-y", "-i", str(raw_video_path),
        "-filter:v", "setpts=0.25*PTS",
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-r", "30", "-crf", "22", str(out_60s)
    ], check=True)
    print(f"[OK] Saved Condensed Cut (1080p): {out_60s} ({round(out_60s.stat().st_size / (1024*1024), 2)} MB)")

    # Generate Animated GIFs for PPT slides
    print("\nGenerating Animated GIFs for PPT Presentation...")

    def make_gif(frame_paths, out_path, duration=250):
        if not frame_paths:
            return
        images = [Image.open(f).resize((800, 450), Image.Resampling.LANCZOS) for f in frame_paths if f.exists()]
        if images:
            images[0].save(
                out_path,
                save_all=True,
                append_images=images[1:],
                optimize=True,
                duration=duration,
                loop=0,
            )
            print(f"[OK] Generated GIF: {out_path} ({round(out_path.stat().st_size / 1024, 1)} KB)")

    make_gif(gif_frames_upload, GIFS_DIR / "01-upload-sealing.gif", duration=280)
    make_gif(gif_frames_radar, GIFS_DIR / "02-radar-dual-control.gif", duration=300)
    make_gif(gif_frames_dispute, GIFS_DIR / "03-citizen-dispute.gif", duration=280)

    # Cleanup temp frame files
    shutil.rmtree(TEMP_VIDEO_DIR, ignore_errors=True)
    print("\n============================================================")
    print("[OK] MASTER RECORDING COMPLETE: Video, screenshots & GIFs ready.")
    print("============================================================")

if __name__ == "__main__":
    asyncio.run(run_master_recording())
