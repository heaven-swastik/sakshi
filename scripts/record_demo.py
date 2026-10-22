"""
record_demo.py — Deterministic Playwright Demo Video & Artifact Generator for SAKSHI.

Automates the 4-minute slow-paced judging walkthrough:
- Viewport: 1920x1080 (Full HD)
- Visual Mouse Cursor with smooth travel interpolation & animated click ripples
- 8 structured scenes showcasing the AICTE Problem Statement and SAKSHI's 3-Lock Solution
- Captures 6 high-res PNG screenshots for presentation slides
- Compiles 3 smooth animated GIFs using Pillow
- Transcodes to standard H.264 MP4 (1080p, ~4 minutes)
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

async def setup_visual_cursor(page):
    """Injects a high-visibility SVG mouse cursor and expanding ripple click effect."""
    await page.evaluate("""
        () => {
            if (document.getElementById('virtual-cursor-layer')) return;

            const layer = document.createElement('div');
            layer.id = 'virtual-cursor-layer';
            layer.style.position = 'fixed';
            layer.style.inset = '0';
            layer.style.pointerEvents = 'none';
            layer.style.zIndex = '9999999';
            document.body.appendChild(layer);

            // Cursor pointer element
            const cursor = document.createElement('div');
            cursor.id = 'demo-virtual-cursor';
            cursor.style.position = 'absolute';
            cursor.style.top = '100px';
            cursor.style.left = '100px';
            cursor.style.width = '32px';
            cursor.style.height = '32px';
            cursor.style.transform = 'translate(-4px, -4px)';
            cursor.style.transition = 'top 0.6s cubic-bezier(0.22, 1, 0.36, 1), left 0.6s cubic-bezier(0.22, 1, 0.36, 1)';
            cursor.innerHTML = `
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.4));">
                    <path d="M5 3L13 25L17 15L25 11L5 3Z" fill="#0F172A" stroke="#FFFFFF" stroke-width="2.2" stroke-linejoin="round"/>
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
                ripple.style.left = `${x - 24}px`;
                ripple.style.top = `${y - 24}px`;
                ripple.style.width = '48px';
                ripple.style.height = '48px';
                ripple.style.borderRadius = '50%';
                ripple.style.border = '3px solid #3B82F6';
                ripple.style.backgroundColor = 'rgba(59, 130, 246, 0.25)';
                ripple.style.transform = 'scale(0.2)';
                ripple.style.opacity = '1';
                ripple.style.transition = 'all 0.45s ease-out';
                layer.appendChild(ripple);

                requestAnimationFrame(() => {
                    ripple.style.transform = 'scale(1.8)';
                    ripple.style.opacity = '0';
                });

                setTimeout(() => ripple.remove(), 500);
            };
        }
    """)

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
        print(f"  Note on click: {e}")
        try:
            await locator.click()
        except:
            pass
        await asyncio.sleep(delay_after)

async def inject_caption(page, text: str, subtitle: str = ""):
    """Injects a sleek caption overlay at the top of the browser window."""
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
                el.style.backdropFilter = 'blur(10px)';
                el.style.color = '#FFFFFF';
                el.style.padding = '12px 28px';
                el.style.borderRadius = '20px';
                el.style.boxShadow = '0 12px 35px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.15)';
                el.style.fontFamily = 'system-ui, -apple-system, sans-serif';
                el.style.textAlign = 'center';
                el.style.maxWidth = '900px';
                el.style.transition = 'all 0.3s ease-out';
                document.body.appendChild(el);
            }
            el.innerHTML = `
                <div style="font-size: 14.5px; font-weight: 700; letter-spacing: -0.01em; color: #FFFFFF;">${text}</div>
                ${subtitle ? `<div style="font-size: 11.5px; font-weight: 500; color: #94A3B8; margin-top: 3px;">${subtitle}</div>` : ''}
            `;
        }
    """, [text, subtitle])

async def run_demo_recording():
    from playwright.async_api import async_playwright

    print("=" * 70)
    print("SAKSHI — 4-Minute Paced Demo Video Generator (1080p Full HD)")
    print("=" * 70)

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

        # ── SCENE 1: THE AICTE PROBLEM STATEMENT & DATA CRISIS [00:00 - 00:40]
        print("\n[Scene 1/8] AICTE Problem Statement & Regulatory Crisis...")
        await page.goto("http://localhost:5173/")
        await page.wait_for_load_state("networkidle")
        await setup_visual_cursor(page)
        await asyncio.sleep(1.5)

        await inject_caption(
            page,
            "The AICTE Problem Statement (SIH26263): Why Macro Statistical Reporting Fails",
            "AICTE receives aggregate counts without authentication. SAKSHI solves all 4 regulatory crises."
        )
        await asyncio.sleep(4)

        # Explore Challenge 1: Ghost Enrolments
        c1 = page.locator("text='Statistical Blindness & Ghost Enrolments'").first
        if await c1.count() > 0:
            await smooth_click(page, c1, delay_after=5.5)

        # Explore Challenge 2: Dual Seat Hoarding
        c2 = page.locator("text='Inter-State Dual Seat Hoarding'").first
        if await c2.count() > 0:
            await smooth_click(page, c2, delay_after=5.5)

        # Explore Challenge 3: Sanctioned Capacity Overruns
        c3 = page.locator("text='Sanctioned Intake Overruns'").first
        if await c3.count() > 0:
            await smooth_click(page, c3, delay_after=5.5)

        # Explore Challenge 4: DPDP Database Surveillance Risk
        c4 = page.locator("text='Central Database Surveillance & DPDP Risk'").first
        if await c4.count() > 0:
            await smooth_click(page, c4, delay_after=5.5)

        await page.screenshot(path=str(SCREENSHOTS_DIR / "01-executive-portfolio.png"))

        # ── SCENE 2: EXECUTIVE ADMISSION PORTFOLIO & TELEMETRY [00:40 - 01:15]
        print("\n[Scene 2/8] Executive Admission Portfolio & Collegiate Incidents...")
        await inject_caption(
            page,
            "National Admission Portfolio: 15 Institutions & Live Regulatory Incidents",
            "3,333 seats monitored in real-time · Collegiate crests & deterministic AICTE handbook violation rules."
        )
        await page.evaluate("window.scrollTo({top: 480, behavior: 'smooth'})")
        await asyncio.sleep(4)

        # Hover over Incident 1 (MIT Pune & RV College)
        inc1_btn = page.locator("button:has-text('Inspect')").first
        if await inc1_btn.count() > 0:
            box = await inc1_btn.bounding_box()
            if box:
                await page.evaluate("([x, y]) => window.__moveCursor(x, y)", [box['x'] + box['width']/2, box['y'] + box['height']/2])
                await asyncio.sleep(3.5)

        # Navigate to Upload Batch CSV via button
        upload_nav = page.locator("button:has-text('Upload Batch CSV')").first
        if await upload_nav.count() > 0:
            await smooth_click(page, upload_nav, delay_after=3.5)
        else:
            await page.goto("http://localhost:5173/upload")
            await page.wait_for_load_state("networkidle")
            await setup_visual_cursor(page)
            await asyncio.sleep(2)

        # ── SCENE 3: LOCK 1 & LOCK 2 EPHEMERAL INGESTION & SEALING [01:15 - 01:55]
        print("\n[Scene 3/8] Lock 1 & 2: Ingestion & Dissolve-to-Seal Animation...")
        await setup_visual_cursor(page)
        await inject_caption(
            page,
            "Lock 1 & 2: Client-Side Ephemeral Ingestion & Zero-PII Sealing",
            "Raw IDs verified once in memory; digits dissolve into cryptographic HMAC seals; raw data immediately purged."
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

        # Capture animated sealing frames for GIF 1 slowly
        for _ in range(12):
            await asyncio.sleep(0.35)
            frame_path = TEMP_VIDEO_DIR / f"frame_upload_{len(gif_frames_upload)}.png"
            await page.screenshot(path=str(frame_path))
            gif_frames_upload.append(frame_path)

        # Hover over Supernumerary, NRI, OCI, and FN quota rows to showcase PS Req 2
        await page.evaluate("window.scrollTo({top: 260, behavior: 'smooth'})")
        await asyncio.sleep(5)

        await page.screenshot(path=str(SCREENSHOTS_DIR / "02-upload-sealing.png"))
        await asyncio.sleep(4)

        # ── SCENE 4: BLIND DUPLICATE RADAR & BILATERAL NOTICE [01:55 - 02:35]
        print("\n[Scene 4/8] Blind Duplicate Radar & Dual-Control Inquiry Notice...")
        await page.goto("http://localhost:5173/radar")
        await page.wait_for_load_state("networkidle")
        await setup_visual_cursor(page)
        await asyncio.sleep(2)

        await inject_caption(
            page,
            "Lock 2 Blind Duplicate Radar: Cross-Institution Duplicate Detection (Rule R1)",
            "Ravi's seal active at MIT Pune & RV College Bengaluru simultaneously — zero personal identity disclosed."
        )
        await asyncio.sleep(4)
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

            # Move cursor over both collegiate crests
            await asyncio.sleep(2.5)

            # Click Dispatch Signed Notice
            dispatch_btn = page.locator("button:has-text('Dispatch Signed Notice')").first
            if await dispatch_btn.count() > 0:
                await smooth_click(page, dispatch_btn, delay_after=3)

            # Close modal
            done_btn = page.locator("button:has-text('Done')").first
            if await done_btn.count() > 0:
                await smooth_click(page, done_btn, delay_after=3)

        await asyncio.sleep(2)

        # ── SCENE 5: LOCK 3 ADMISSION SEASON REPLAY & 5-QUOTA LEDGER [02:35 - 03:15]
        print("\n[Scene 5/8] Lock 3: Admission Season Replay & 5-Quota Ledger...")
        await page.goto("http://localhost:5173/integrity")
        await page.wait_for_load_state("networkidle")
        await setup_visual_cursor(page)
        await asyncio.sleep(2)

        await inject_caption(
            page,
            "Lock 3: Admission Season Replay & Dedicated Quota Ledger",
            "Temporal time scrubber tracking intake velocity; breaks down Approved, Supernumerary, NRI, OCI, and FN."
        )
        await asyncio.sleep(3)

        # Click Season Replay Tab
        replay_tab = page.locator("button:has-text('Season Replay')").first
        if await replay_tab.count() > 0:
            await smooth_click(page, replay_tab, delay_after=3)

            # Smoothly scrub the timeline slider across admission milestones
            slider = page.locator("input[type='range']").first
            if await slider.count() > 0:
                box = await slider.bounding_box()
                if box:
                    for frac in [0.25, 0.5, 0.75, 1.0]:
                        x = box['x'] + box['width'] * frac
                        y = box['y'] + box['height'] / 2
                        await page.evaluate("([x, y]) => window.__moveCursor(x, y)", [x, y])
                        await page.evaluate("([v]) => { const el = document.querySelector('input[type=range]'); if (el) { el.value = v; el.dispatchEvent(new Event('input', {bubbles: true})); } }", [int(frac * 45)])
                        await asyncio.sleep(2.2)

        # Click Accreditation Report Tab
        report_tab = page.locator("button:has-text('Accreditation Report')").first
        if await report_tab.count() > 0:
            await smooth_click(page, report_tab, delay_after=4.5)

        # ── SCENE 6: CITIZEN WINDOW & GHOST SEAT DISPUTE [03:15 - 03:50] ─────
        print("\n[Scene 6/8] Citizen Window: Student Sovereignty & 'This is not me'...")
        await page.goto("http://localhost:5173/citizen")
        await page.wait_for_load_state("networkidle")
        await setup_visual_cursor(page)
        await asyncio.sleep(2)

        await inject_caption(
            page,
            "Citizen Window: Student Dispute & Ghost Enrolment Defense",
            "Meera logs in with 1 click; spots unauthorized registration at SSN Chennai; asserts 'This is not me'."
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

                # Capture frames for GIF 3 (sealed envelope moment)
                for _ in range(10):
                    await asyncio.sleep(0.35)
                    frame_path = TEMP_VIDEO_DIR / f"frame_disp_{len(gif_frames_dispute)}.png"
                    await page.screenshot(path=str(frame_path))
                    gif_frames_dispute.append(frame_path)

        await page.screenshot(path=str(SCREENSHOTS_DIR / "04-citizen-dispute.png"))
        await asyncio.sleep(4)

        # ── SCENE 7: STATELESS PUBLIC EMPLOYER VERIFICATION [03:50 - 04:15] ──
        print("\n[Scene 7/8] Public Stateless Credential Verification...")
        await page.goto("http://localhost:5173/verify/6BRQOTU4L7UB")
        await page.wait_for_load_state("networkidle")
        await setup_visual_cursor(page)
        await asyncio.sleep(1.5)

        await inject_caption(
            page,
            "Public Verifier Portal: Instant Background Verification (< 1s)",
            "Employers verify Ravi's Ed25519-signed degree credential statelessly with zero PII access."
        )
        await asyncio.sleep(5)
        await page.screenshot(path=str(SCREENSHOTS_DIR / "05-credential-verification.png"))
        await asyncio.sleep(3)

        # ── SCENE 8: AUTOMATED PRIVACY PROOF & CLOSING [04:15 - 04:35] ───────
        print("\n[Scene 8/8] Automated Privacy Proof & Closing Statement...")
        await page.goto("http://localhost:5173/proof")
        await page.wait_for_load_state("networkidle")
        await setup_visual_cursor(page)
        await asyncio.sleep(2)

        await inject_caption(
            page,
            "Real-Time Privacy Proof: Mathematical Guarantee of Zero PII",
            "Regex scan across all 19 database tables confirms zero raw APAAR IDs or personal data exist."
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
            "SAKSHI for AICTE SIH26263",
            "A witness that confirms, never discloses. 100% DPDP Act 2023 Compliant."
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
    print(f"[OK] Saved Full 4-Minute Demo (1080p): {out_full} ({round(out_full.stat().st_size / (1024*1024), 2)} MB)")

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
    print("[OK] PHASE 4 COMPLETE: 4-minute demo video, screenshots & GIFs ready.")
    print("============================================================")

if __name__ == "__main__":
    asyncio.run(run_demo_recording())
