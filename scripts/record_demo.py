"""
record_demo.py — Deterministic Playwright Demo Video & Artifact Generator for SAKSHI.

Automates the full 2-minute judging script and 60-second condensed cut:
- Viewport: 1920x1080 (Full HD)
- Records deterministic video (.mp4)
- Captures 6 high-res PNG screenshots for presentation slides
- Compiles 3 smooth animated GIFs using Pillow
- Injects elegant on-screen narrative captions
"""

import os
import sys
import time
import shutil
import asyncio
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

async def inject_caption(page, text: str, subtitle: str = ""):
    """Injects a sleek, semi-transparent caption overlay at the top of the browser window."""
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
                el.style.zIndex = '99999';
                el.style.backgroundColor = 'rgba(24, 26, 32, 0.94)';
                el.style.backdropFilter = 'blur(8px)';
                el.style.color = '#FFFFFF';
                el.style.padding = '10px 22px';
                el.style.borderRadius = '16px';
                el.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)';
                el.style.fontFamily = 'system-ui, -apple-system, sans-serif';
                el.style.textAlign = 'center';
                el.style.maxWidth = '850px';
                el.style.transition = 'all 0.3s ease-out';
                document.body.appendChild(el);
            }
            el.innerHTML = `
                <div style="font-size: 13.5px; font-weight: 700; letter-spacing: -0.01em; color: #FFFFFF;">${text}</div>
                ${subtitle ? `<div style="font-size: 11px; font-weight: 500; color: #94A3B8; margin-top: 2px;">${subtitle}</div>` : ''}
            `;
        }
    """, [text, subtitle])

async def remove_caption(page):
    await page.evaluate("""
        () => {
            const el = document.getElementById('demo-caption-overlay');
            if (el) el.remove();
        }
    """)

async def run_demo_recording():
    from playwright.async_api import async_playwright

    print("=" * 65)
    print("SAKSHI — Deterministic Demo Recording (1080p)")
    print("=" * 65)

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

        # ── SCENE 1: HOOK & EXECUTIVE ADMISSION PORTFOLIO ───────────────────
        print("\n[Scene 1/7] Hook & Executive Admission Portfolio...")
        await page.goto("http://localhost:5173/")
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(1)

        await inject_caption(
            page,
            "SAKSHI — Verify Student Enrolment Without Collecting Student Identity",
            "AICTE Regulation Bureau · PS SIH26263 · DPDP Act 2023 Compliant"
        )
        await asyncio.sleep(2)
        await page.screenshot(path=str(SCREENSHOTS_DIR / "01-executive-portfolio.png"))
        await asyncio.sleep(3)

        # ── SCENE 2: CSV UPLOAD & CIPHERTEXT SEALING ANIMATION ───────────────
        print("\n[Scene 2/7] Lock 1 & 2: Ingestion & Sealing Animation...")
        await inject_caption(
            page,
            "Lock 1 & 2: Ingestion & Real-Time Sealing Animation",
            "Raw IDs verified once in memory, tokenized via cohort HMAC-SHA256, and immediately purged."
        )
        await page.goto("http://localhost:5173/upload")
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(1.5)

        # Click Load Demo CSV
        demo_btn = page.locator("button:has-text('Load demo CSV'), button:has-text('Load Demo CSV')").first
        if await demo_btn.count() > 0:
            await demo_btn.click()
            await asyncio.sleep(1.2)

        # Click Upload Admissions CSV
        upload_btn = page.locator("button:has-text('Upload Admissions CSV'), button:has-text('Upload')").first
        if await upload_btn.count() > 0:
            await upload_btn.click()

        # Capture animated sealing frames for GIF 1
        for _ in range(12):
            await asyncio.sleep(0.25)
            frame_path = TEMP_VIDEO_DIR / f"frame_upload_{len(gif_frames_upload)}.png"
            await page.screenshot(path=str(frame_path))
            gif_frames_upload.append(frame_path)

        await page.screenshot(path=str(SCREENSHOTS_DIR / "02-upload-sealing.png"))
        await asyncio.sleep(2.5)

        # ── SCENE 3: BLIND DUPLICATE RADAR & BILATERAL REVEAL ────────────────
        print("\n[Scene 3/7] Blind Duplicate Radar & Dual-Control Dispute Notice...")
        await inject_caption(
            page,
            "Blind Duplicate Radar: Cross-Institution Duplicate Detection (Rule R1)",
            "Same student seal active in MIT Pune & RV College Bengaluru — zero names or IDs disclosed."
        )
        await page.goto("http://localhost:5173/radar")
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(2)

        await page.screenshot(path=str(SCREENSHOTS_DIR / "03-duplicate-radar.png"))

        # Open Dual-Control Dispute Modal
        ask_btn = page.locator("button:has-text('Ask Both Colleges')").first
        if await ask_btn.count() > 0:
            await ask_btn.click()
            await asyncio.sleep(1)

            # Capture frames for GIF 2
            for _ in range(8):
                await asyncio.sleep(0.25)
                frame_path = TEMP_VIDEO_DIR / f"frame_radar_{len(gif_frames_radar)}.png"
                await page.screenshot(path=str(frame_path))
                gif_frames_radar.append(frame_path)

            # Click Dispatch Signed Notice
            dispatch_btn = page.locator("button:has-text('Dispatch Signed Notice')")
            if await dispatch_btn.count() > 0:
                await dispatch_btn.click()
                await asyncio.sleep(1.5)

            # Close modal
            done_btn = page.locator("button:has-text('Done')")
            if await done_btn.count() > 0:
                await done_btn.click()

        await asyncio.sleep(1.5)

        # ── SCENE 4: CITIZEN WINDOW & GHOST SEAT DISPUTE ─────────────────────
        print("\n[Scene 4/7] Citizen Window & 'This is not me' Dispute Filing...")
        await inject_caption(
            page,
            "Citizen Window: Student Dispute & Ghost Enrolment Defense",
            "Meera discovers an unauthorized registration at SSN Chennai and asserts 'This is not me'."
        )
        await page.goto("http://localhost:5173/citizen")
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(1)

        # 1-Click login as Meera
        meera_btn = page.locator("button:has-text('Meera')").first
        if await meera_btn.count() > 0:
            await meera_btn.click()
            await asyncio.sleep(1.8)

        # Click "This is not me" on SSN Chennai enrolment
        not_me_btn = page.locator("button:has-text('This is not me'), button:has-text('notMe')").first
        if await not_me_btn.count() > 0:
            await not_me_btn.click()
            await asyncio.sleep(1)

            # Submit dispute
            submit_btn = page.locator("button:has-text('Submit Dispute'), button:has-text('submitDispute')").first
            if await submit_btn.count() > 0:
                await submit_btn.click()

                # Capture frames for GIF 3 (envelope sealing moment)
                for _ in range(10):
                    await asyncio.sleep(0.2)
                    frame_path = TEMP_VIDEO_DIR / f"frame_disp_{len(gif_frames_dispute)}.png"
                    await page.screenshot(path=str(frame_path))
                    gif_frames_dispute.append(frame_path)

        await page.screenshot(path=str(SCREENSHOTS_DIR / "04-citizen-dispute.png"))
        await asyncio.sleep(2)

        # ── SCENE 5: STATELESS PUBLIC EMPLOYER VERIFICATION ─────────────────
        print("\n[Scene 5/7] Public Stateless Credential Verification...")
        await inject_caption(
            page,
            "Public Verifier Portal: Instant Background Verification (< 1s)",
            "Employers verify Ravi's Ed25519-signed degree credential statelessly with zero PII access."
        )
        await page.goto("http://localhost:5173/verify/6BRQOTU4L7UB")
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(2)

        await page.screenshot(path=str(SCREENSHOTS_DIR / "05-credential-verification.png"))
        await asyncio.sleep(2.5)

        # ── SCENE 6: ADMISSION SEASON REPLAY & QUOTA LEDGER ──────────────────
        print("\n[Scene 6/7] Admission Season Replay & 5-Quota Ledger...")
        await inject_caption(
            page,
            "Lock 3: Admission Season Replay & Dedicated Quota Ledger",
            "Temporal time scrubber tracking intake velocity; breaks down Supernumerary, NRI, OCI, and FN."
        )
        await page.goto("http://localhost:5173/integrity")
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(1.5)

        # Switch to Replay Tab
        replay_tab = page.locator("button:has-text('Admission Season Replay'), button:has-text('Replay')").first
        if await replay_tab.count() > 0:
            await replay_tab.click()
            await asyncio.sleep(1)
            # Play timeline
            play_btn = page.locator("button:has-text('Play Timeline'), button:has-text('Play')").first
            if await play_btn.count() > 0:
                await play_btn.click()
                await asyncio.sleep(4)

        # Switch to Quota Ledger Tab
        quota_tab = page.locator("button:has-text('Quota Ledger'), button:has-text('Quotas')").first
        if await quota_tab.count() > 0:
            await quota_tab.click()
            await asyncio.sleep(2)

        # ── SCENE 7: PRIVACY PROOF & CLOSING COVENANT ───────────────────────
        print("\n[Scene 7/7] Automated Privacy Proof & Closing...")
        await inject_caption(
            page,
            "Real-Time Privacy Proof: Mathematical Guarantee of Zero PII",
            "Regex scan across all 19 database tables confirms zero raw APAAR IDs or personal data exist."
        )
        await page.goto("http://localhost:5173/proof")
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(1.5)

        # Click Automated Inspection
        scan_btn = page.locator("button:has-text('Scan'), button:has-text('Inspection')").first
        if await scan_btn.count() > 0:
            await scan_btn.click()
            await asyncio.sleep(3)

        await page.screenshot(path=str(SCREENSHOTS_DIR / "06-privacy-proof.png"))

        # Final Closing Banner
        await inject_caption(
            page,
            "SAKSHI for AICTE SIH26263",
            "A witness that confirms, never discloses. 100% DPDP Act 2023 Compliant."
        )
        await asyncio.sleep(3.5)

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
    import subprocess
    subprocess.run([
        FFMPEG_BIN, "-y", "-i", str(raw_video_path),
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-r", "30", "-crf", "20", str(out_full)
    ], check=True)
    print(f"✓ Saved Full Demo (1080p): {out_full} ({round(out_full.stat().st_size / (1024*1024), 2)} MB)")

    # Produce condensed 60-second trailer (2x speed)
    subprocess.run([
        FFMPEG_BIN, "-y", "-i", str(raw_video_path),
        "-filter:v", "setpts=0.5*PTS",
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-r", "30", "-crf", "22", str(out_60s)
    ], check=True)
    print(f"✓ Saved 60-Second Cut (1080p): {out_60s} ({round(out_60s.stat().st_size / (1024*1024), 2)} MB)")

    # Generate Animated GIFs for PPT slides
    print("\nGenerating Animated GIFs for PPT Presentation...")

    def make_gif(frame_paths, out_path, duration=220):
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
            print(f"✓ Generated GIF: {out_path} ({round(out_path.stat().st_size / 1024, 1)} KB)")

    make_gif(gif_frames_upload, GIFS_DIR / "01-upload-sealing.gif", duration=250)
    make_gif(gif_frames_radar, GIFS_DIR / "02-radar-dual-control.gif", duration=280)
    make_gif(gif_frames_dispute, GIFS_DIR / "03-citizen-dispute.gif", duration=250)

    # Cleanup temp frame files
    shutil.rmtree(TEMP_VIDEO_DIR, ignore_errors=True)
    print("\n============================================================")
    print("✓ PHASE 4 COMPLETE: Demo videos, screenshots & GIFs ready.")
    print("============================================================")

if __name__ == "__main__":
    asyncio.run(run_demo_recording())
