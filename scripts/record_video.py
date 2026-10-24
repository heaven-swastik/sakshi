"""
record_video.py — records the SAKSHI demo video (motion graphics + real screen) with Playwright.

Usage:   python scripts/record_video.py A    # intro card, welcome page, the story
         python scripts/record_video.py B    # live system tour + closing card
Then:    python scripts/make_video.py        # joins the parts into demo/video/sakshi-demo.mp4

Needs the API on :8000 and the built web app on :5173 (see README). Everything on screen is the real app.
"""
import asyncio, json, os, sys, time
from playwright.async_api import async_playwright

CHROME = os.environ.get("CHROME_PATH") or None
BASE = "http://127.0.0.1:5173"
W, H = 1480, 832            # CSS pixels; rendered at 1.297x so the final video is a crisp 1920x1080
K = W / 1920
DSF = 1920 / W
VID = {"width": 1920, "height": 1080}
OUT = os.path.join(os.path.dirname(__file__), "..", "demo", "video")
SPEED = 1.55

OVERLAY = r"""
(() => {
  if (window.MG) return;
  const boot = () => {
  const st = document.createElement('style');
  st.textContent = `
   #mg{position:fixed;inset:0;z-index:2147483646;pointer-events:none;font-family:'Hanken Grotesk Variable','Hanken Grotesk',sans-serif}
   #mg-cur{position:fixed;left:0;top:0;width:30px;height:30px;z-index:2147483647;pointer-events:none;filter:drop-shadow(0 3px 6px rgba(0,0,0,.35));transition:transform var(--ms,700ms) cubic-bezier(.45,0,.2,1)}
   .mg-rip{position:fixed;width:20px;height:20px;border-radius:50%;border:3px solid #C0153F;margin:-10px 0 0 -10px;animation:mgrip .7s ease-out forwards}
   @keyframes mgrip{from{transform:scale(.4);opacity:.9}to{transform:scale(3.2);opacity:0}}
   .mg-ring{position:fixed;border:3px solid #C0153F;border-radius:20px;box-shadow:0 0 0 6px rgba(192,21,63,.12);animation:mgpulse 1.4s ease-in-out infinite;opacity:0;transition:opacity .4s}
   @keyframes mgpulse{50%{box-shadow:0 0 0 14px rgba(192,21,63,0)}}
   .mg-tag{position:fixed;background:#C0153F;color:#fff;font-weight:600;font-size:17px;padding:8px 15px;border-radius:12px;opacity:0;transform:translateY(8px);transition:all .45s cubic-bezier(.22,1,.36,1);white-space:nowrap}
   .mg-lower{position:fixed;left:44px;bottom:44px;display:flex;align-items:stretch;background:#181A20;color:#fff;border-radius:18px;overflow:hidden;transform:translateX(-120%);transition:transform .7s cubic-bezier(.22,1,.36,1);box-shadow:0 18px 40px rgba(0,0,0,.3)}
   .mg-lower i{width:8px;background:#C0153F}
   .mg-lower div{padding:15px 24px}
   .mg-lower b{display:block;font-family:'Bricolage Grotesque Variable',sans-serif;font-size:28px;font-weight:700}
   .mg-lower span{font-size:17px;color:rgba(255,255,255,.7)}
  `;
  document.documentElement.appendChild(st);
  const box = document.createElement('div'); box.id = 'mg'; document.documentElement.appendChild(box);
  const cur = document.createElement('div'); cur.id = 'mg-cur';
  cur.innerHTML = '<svg viewBox="0 0 24 24" width="30" height="30"><path d="M4 2l15 8.5-6.6 1.8L9.7 19z" fill="#fff" stroke="#0F1217" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  const last = JSON.parse(sessionStorage.getItem('mgpos') || '[1380,760]');
  cur.style.transform = `translate(${last[0]}px,${last[1]}px)`;
  document.documentElement.appendChild(cur);
  window.MG = {
    cursor(x, y, ms) { cur.style.setProperty('--ms', ms + 'ms'); cur.style.transform = `translate(${x}px,${y}px)`; sessionStorage.setItem('mgpos', JSON.stringify([x, y])); },
    click(x, y) { const r = document.createElement('div'); r.className = 'mg-rip'; r.style.left = x + 'px'; r.style.top = y + 'px'; box.appendChild(r); setTimeout(() => r.remove(), 800); },
    ring(x, y, w, h, label, ms) {
      const r = document.createElement('div'); r.className = 'mg-ring'; Object.assign(r.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' }); box.appendChild(r);
      let t = null; if (label) { t = document.createElement('div'); t.className = 'mg-tag'; t.textContent = label; t.style.left = x + 'px'; t.style.top = Math.max(8, y - 50) + 'px'; box.appendChild(t); }
      requestAnimationFrame(() => { r.style.opacity = 1; if (t) { t.style.opacity = 1; t.style.transform = 'none'; } });
      setTimeout(() => { r.style.opacity = 0; if (t) t.style.opacity = 0; setTimeout(() => { r.remove(); t && t.remove(); }, 500); }, ms);
    },
    lower(title, sub, ms) {
      const l = document.createElement('div'); l.className = 'mg-lower'; l.innerHTML = `<i></i><div><b>${title}</b><span>${sub}</span></div>`; box.appendChild(l);
      requestAnimationFrame(() => { l.style.transform = 'none'; });
      setTimeout(() => { l.style.transform = 'translateX(-120%)'; setTimeout(() => l.remove(), 800); }, ms);
    },
    zoom(ox, oy, s, ms) {
      const r = document.getElementById('root'); if (!r) return;
      if (/^\/(story|mg)/.test(location.pathname)) Object.assign(r.style, { height: '100vh', width: '100vw', overflow: 'hidden' });
      r.style.transformOrigin = `${ox}px ${oy}px`; r.style.transition = `transform ${ms}ms cubic-bezier(.22,1,.36,1)`; r.style.transform = `scale(${s})`;
    },
  };
  };
  if (document.documentElement) boot();
  else new MutationObserver((m, o) => { if (document.documentElement) { o.disconnect(); boot(); } }).observe(document, { childList: true });
})();
"""

MARKS = []
T0 = None
def mark(name):
    t = round(time.time() - T0, 1); MARKS.append([name, t]); print(f"[{t:6.1f}s] {name}", flush=True)

async def cursor_to(pg, x, y, ms=800):
    await pg.evaluate(f"MG.cursor({x},{y},{ms})"); await pg.wait_for_timeout(ms + 60)

async def center(loc):
    b = await loc.bounding_box(); return (b["x"] + b["width"] / 2, b["y"] + b["height"] / 2, b)

async def click_on(pg, loc, ms=900, pause=350):
    await pg.evaluate("MG.zoom(740,416,1,600)")
    x, y, _ = await center(loc)
    await cursor_to(pg, x + 6, y + 4, ms)
    await pg.evaluate(f"MG.click({x + 6},{y + 4})"); await pg.wait_for_timeout(pause)
    await loc.click()

async def ring_box(pg, b, label=None, ms=3200, pad=14):
    await pg.evaluate(f"MG.ring({b['x']-pad},{b['y']-pad},{b['width']+2*pad},{b['height']+2*pad},{json.dumps(label)},{ms})")

async def ring(pg, loc, label=None, ms=3200, pad=14):
    await ring_box(pg, await loc.bounding_box(), label, ms, pad)

async def zoom_to(pg, x, y, s, ms=1400): await pg.evaluate(f"MG.zoom({x*K:.0f},{y*K:.0f},{s},{ms})")
async def lower(pg, a, b, ms=5000): await pg.evaluate(f"MG.lower({json.dumps(a)},{json.dumps(b)},{ms})")
def card(loc, sel="rounded-2xl"): return loc.locator(f"xpath=ancestor::div[contains(@class,'{sel}')][1]")

async def schedule(pg, events):
    """events: list of (seconds_from_now, coroutine-function). Runs them at those offsets."""
    t0 = time.time()
    for at, fn in sorted(events, key=lambda e: e[0]):
        wait = at - (time.time() - t0)
        if wait > 0: await asyncio.sleep(wait)
        await fn()

async def segment_A(pg):
    mark("INTRO card (seal stamps in, SAKSHI appears)")
    await pg.goto(BASE + "/mg/intro"); await pg.wait_for_timeout(7200)
    mark("WELCOME page")
    await pg.goto(BASE + f"/?speed={SPEED}"); await pg.wait_for_timeout(1600)
    await zoom_to(pg, 560, 380, 1.15, 1600); await pg.wait_for_timeout(3200)
    await zoom_to(pg, 1400, 420, 1.18, 1600); await pg.wait_for_timeout(3600)
    await pg.evaluate("MG.zoom(740,416,1,900)"); await pg.wait_for_timeout(900)
    btn = pg.locator("[data-tour=start-story]")
    mark("CLICK Watch the story")
    await click_on(pg, btn, ms=1100)
    # ---- the story runs by itself ----
    chapters = [[7500, 8000, 8000], [7000, 8000, 6500], [6500, 6500, 6000], [6500, 7500, 7500], [6500, 6500, 7500], [6500, 7500, 6500], [8000, 0]]
    names = ["STORY 1 the problem", "STORY 2 how it works", "STORY 3 Asha", "STORY 4 Ravi", "STORY 5 Meera", "STORY 6 employer", "STORY 7 proof"]
    starts, t = [], 0.0
    for c in chapters: starts.append(t); t += sum(c) / 1000 / SPEED
    z = lambda x, y, s: (lambda: zoom_to(pg, x, y, s, 1600))
    rz = lambda: zoom_to(pg, 960, 540, 1, 1400)
    beat = lambda ci, bi: starts[ci] + sum(chapters[ci][:bi]) / 1000 / SPEED
    ev = []
    for i, n in enumerate(names):
        ev.append((starts[i], (lambda n=n: mk(n))))
    ev += [(beat(0, 0) + 2.2, z(960, 400, 1.22)), (beat(0, 0) + 5.0, rz),
           (beat(1, 1) + 0.8, z(960, 430, 1.28)), (beat(1, 1) + 4.2, rz),
           (beat(3, 1) + 0.8, z(960, 420, 1.32)), (beat(3, 1) + 4.6, rz),
           (beat(4, 1) + 0.4, z(830, 440, 1.3)), (beat(4, 1) + 4.2, rz),
           (beat(5, 2) + 0.6, z(1180, 440, 1.4)), (beat(5, 2) + 4.2, rz),
           (beat(6, 0) + 3.2, z(1200, 420, 1.2)), (beat(6, 0) + 5.4, rz)]
    await schedule(pg, ev)
    await pg.wait_for_timeout(4200)
    mark("CLICK Explore the live system")
    await click_on(pg, pg.locator("[data-tour=story-explore]"), ms=1100)
    await pg.wait_for_timeout(1200)

async def mk(n): mark(n)

async def segment_B(pg):
    mark("LIVE 1 overview")
    await pg.goto(BASE + "/overview"); await pg.wait_for_timeout(2600)
    await lower(pg, "Live system · Overview", "Every number comes from the database, not from a script.", 5200)
    c1 = card(pg.get_by_text("Total Active Enrolments")); await ring(pg, c1, "Seats counted + verified at source", 3400)
    await pg.wait_for_timeout(3800)
    c2 = card(pg.get_by_text("DPDP Proof").first); await ring(pg, c2, "Live scan: raw student IDs", 3200)
    await pg.wait_for_timeout(3600)
    c3 = card(pg.get_by_text("Recent Verification Incidents"), "rounded-2xl"); await ring(pg, c3, "Flags, each with a reason", 3000)
    await pg.wait_for_timeout(3200)

    mark("LIVE 2 upload")
    await pg.goto(BASE + "/upload"); await pg.wait_for_timeout(1800)
    await lower(pg, "Step 1 · Upload admissions", "IDs are checked once, sealed, and forgotten.", 5200)
    await click_on(pg, pg.get_by_role("button", name="Load demo CSV").first)
    await pg.wait_for_timeout(900)
    await click_on(pg, pg.get_by_role("button", name="Upload admissions"))
    await pg.wait_for_timeout(5400)           # sealing animation + success burst
    mark("upload burst done")
    await pg.wait_for_timeout(1200)
    await zoom_to(pg, 1300, 480, 1.18, 1500)
    await pg.wait_for_timeout(2800)
    await pg.evaluate("MG.zoom(740,416,1,1000)"); await pg.wait_for_timeout(700)

    mark("LIVE 3 radar")
    await pg.goto(BASE + "/radar"); await pg.wait_for_timeout(2200)
    await lower(pg, "Step 2 · Duplicate radar", "The same seal in two colleges. No names shown.", 5200)
    ask = pg.get_by_role("button", name="Ask both colleges").nth(1)
    await ring(pg, card(ask, "rounded-"), "Same seal, two colleges", 3000, 8)
    await pg.wait_for_timeout(3200)
    await click_on(pg, ask)
    await pg.wait_for_timeout(1800)
    await click_on(pg, pg.get_by_role("button", name="Send Inquiry to Both Colleges"))
    await pg.wait_for_timeout(3400)
    mark("inquiry sent (real audit entry)")

    mark("LIVE 4 integrity")
    await pg.goto(BASE + "/integrity"); await pg.wait_for_timeout(2400)
    await lower(pg, "Step 3 · Seat integrity", "A score with the reason, in points.", 5000)
    head = pg.get_by_role("heading", name="MIT Pune").first
    cardloc = card(head, "rounded-2xl")
    await click_on(pg, cardloc.locator("button").last)
    await pg.wait_for_timeout(1800)
    await pg.mouse.wheel(0, 330); await pg.wait_for_timeout(2800)
    await pg.mouse.wheel(0, -330); await pg.wait_for_timeout(900)
    await click_on(pg, pg.get_by_role("button", name="Season Replay"))
    await pg.wait_for_timeout(3600)
    mark("replay shown")

    mark("LIVE 5 proof")
    await pg.goto(BASE + "/proof"); await pg.wait_for_timeout(1800)
    await lower(pg, "Step 6 · Privacy proof", "Scan the whole database for raw IDs.", 4500)
    await click_on(pg, pg.get_by_role("button", name="Run privacy scan"))
    await pg.wait_for_timeout(5800)
    mark("proof burst done")
    await pg.wait_for_timeout(900)

    mark("OUTRO card")
    await pg.goto(BASE + "/mg/outro"); await pg.wait_for_timeout(9500)

async def main(part):
    global T0
    os.makedirs(OUT, exist_ok=True)
    async with async_playwright() as p:
        kw = {"executable_path": CHROME} if CHROME else {}
        b = await p.chromium.launch(args=["--no-sandbox", "--use-gl=swiftshader", "--hide-scrollbars"], **kw)
        ctx = await b.new_context(viewport={"width": W, "height": H}, device_scale_factor=DSF, record_video_dir=os.path.join(OUT, "raw_" + part), record_video_size=VID)
        await ctx.add_init_script(OVERLAY)
        pg = await ctx.new_page(); T0 = time.time()
        await (segment_A if part == "A" else segment_B)(pg)
        await ctx.close(); await b.close()
    json.dump(MARKS, open(os.path.join(OUT, f"marks_{part}.json"), "w"), indent=1)

if __name__ == "__main__":
    asyncio.run(main(sys.argv[1]))
