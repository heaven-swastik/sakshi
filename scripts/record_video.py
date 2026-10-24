"""
record_video.py — records the SAKSHI demo video (v2: smooth 30 fps, true full-frame 1920x1080).

Why this is different from a normal screen recording
----------------------------------------------------
A software-rendered browser on a small machine can only draw ~5-7 frames per second, which makes a normal
recording stutter. So this recorder runs the PAGE'S CLOCK in slow motion (time_scale S, default 0.2:
the page runs 5x slower), captures every rendered frame with the Chrome DevTools screencast, and then
make_video.py plays the frames back at normal speed. The result is a smooth 30 fps video of the real app.
The slow clock covers: performance.now, Date.now, requestAnimationFrame, setTimeout/setInterval, and all
CSS / Web Animations (via the DevTools Animation domain).

The app is laid out in a 1480x832 box and scaled 1.297x to fill 1920x1080, so text stays large and crisp.

Usage:  python scripts/record_video.py A | B | C        (API on :8000 and `vite preview` on :5173 must be running)
   A = title card + briefing (problem, workflow, innovation)
   B = welcome page + the story
   C = live system tour
   D = closing card (recorded last, so its numbers match the final state of the live tour)
Then:   python scripts/make_video.py
"""
import asyncio, base64, json, os, sys, time
from playwright.async_api import async_playwright

CHROME = os.environ.get("CHROME_PATH") or None
BASE = "http://127.0.0.1:5173"
W_, H_ = 1920, 1080
BASE_SCALE = 1920 / 1480
S = float(os.environ.get("TIME_SCALE", "0.25"))
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "demo", "video")
FRAMES = os.environ.get("FRAMES_DIR", "/tmp/sakshi_frames")
SPEED = 1.55           # story playback speed (beats are 1/1.55 as long)

TIME_HACK = """
(() => {
  const S = %S%;
  const rn = performance.now.bind(performance), t0 = rn();
  performance.now = () => (rn() - t0) * S + t0;
  const rd = Date.now.bind(Date), d0 = rd();
  Date.now = () => d0 + (rd() - d0) * S;
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => raf((ts) => cb((ts - t0) * S + t0));
  const st = window.setTimeout.bind(window); window.setTimeout = (f, ms = 0, ...a) => st(f, ms / S, ...a);
  const si = window.setInterval.bind(window); window.setInterval = (f, ms = 0, ...a) => si(f, ms / S, ...a);
})();
"""

LAYOUT_CSS = """
html,body{margin:0;overflow:hidden;background:#F1F5F9}
#root{position:absolute;left:0;top:0;width:1480px;height:832px;transform-origin:0 0;transform:scale(%K%);overflow-x:hidden;overflow-y:auto}
.min-h-screen{min-height:832px!important}
"""

OVERLAY = r"""
(() => {
  if (window.MG) return;
  const K = %K%;
  const boot = () => {
  const st = document.createElement('style');
  st.textContent = `
   #mg{position:fixed;inset:0;z-index:2147483646;pointer-events:none;font-family:'Hanken Grotesk Variable','Hanken Grotesk',sans-serif}
   #mg-cur{position:fixed;left:0;top:0;width:34px;height:34px;z-index:2147483647;pointer-events:none;filter:drop-shadow(0 3px 6px rgba(0,0,0,.35));transition:transform var(--ms,700ms) cubic-bezier(.45,0,.2,1)}
   .mg-rip{position:fixed;width:24px;height:24px;border-radius:50%;border:4px solid #C0153F;margin:-12px 0 0 -12px;animation:mgrip .7s ease-out forwards}
   @keyframes mgrip{from{transform:scale(.4);opacity:.9}to{transform:scale(3.2);opacity:0}}
   .mg-ring{position:fixed;border:4px solid #C0153F;border-radius:24px;box-shadow:0 0 0 8px rgba(192,21,63,.12);animation:mgpulse 1.4s ease-in-out infinite;opacity:0;transition:opacity .4s}
   @keyframes mgpulse{50%{box-shadow:0 0 0 18px rgba(192,21,63,0)}}
   .mg-tag{position:fixed;background:#C0153F;color:#fff;font-weight:600;font-size:22px;padding:10px 18px;border-radius:14px;opacity:0;transform:translateY(8px);transition:all .45s cubic-bezier(.22,1,.36,1);white-space:nowrap}
   .mg-lower{position:fixed;left:56px;bottom:56px;display:flex;align-items:stretch;background:#181A20;color:#fff;border-radius:22px;overflow:hidden;transform:translateX(-120%);transition:transform .7s cubic-bezier(.22,1,.36,1);box-shadow:0 18px 40px rgba(0,0,0,.3)}
   .mg-lower i{width:10px;background:#C0153F}
   .mg-lower div{padding:18px 30px}
   .mg-lower b{display:block;font-family:'Bricolage Grotesque Variable',sans-serif;font-size:36px;font-weight:700}
   .mg-lower span{font-size:22px;color:rgba(255,255,255,.72)}
  `;
  document.documentElement.appendChild(st);
  const box = document.createElement('div'); box.id = 'mg'; document.documentElement.appendChild(box);
  const cur = document.createElement('div'); cur.id = 'mg-cur';
  cur.innerHTML = '<svg viewBox="0 0 24 24" width="34" height="34"><path d="M4 2l15 8.5-6.6 1.8L9.7 19z" fill="#fff" stroke="#0F1217" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  const last = JSON.parse(sessionStorage.getItem('mgpos') || '[1700,960]');
  cur.style.transform = `translate(${last[0]}px,${last[1]}px)`;
  document.documentElement.appendChild(cur);
  window.MG = {
    cursor(x, y, ms) { cur.style.setProperty('--ms', ms + 'ms'); cur.style.transform = `translate(${x}px,${y}px)`; sessionStorage.setItem('mgpos', JSON.stringify([x, y])); },
    click(x, y) { const r = document.createElement('div'); r.className = 'mg-rip'; r.style.left = x + 'px'; r.style.top = y + 'px'; box.appendChild(r); setTimeout(() => r.remove(), 800); },
    ring(x, y, w, h, label, ms) {
      const r = document.createElement('div'); r.className = 'mg-ring'; Object.assign(r.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' }); box.appendChild(r);
      let t = null; if (label) { t = document.createElement('div'); t.className = 'mg-tag'; t.textContent = label; t.style.left = x + 'px'; t.style.top = Math.max(10, y - 62) + 'px'; box.appendChild(t); }
      requestAnimationFrame(() => { r.style.opacity = 1; if (t) { t.style.opacity = 1; t.style.transform = 'none'; } });
      setTimeout(() => { r.style.opacity = 0; if (t) t.style.opacity = 0; setTimeout(() => { r.remove(); t && t.remove(); }, 500); }, ms);
    },
    lower(title, sub, ms) {
      const l = document.createElement('div'); l.className = 'mg-lower'; l.innerHTML = `<i></i><div><b>${title}</b><span>${sub}</span></div>`; box.appendChild(l);
      requestAnimationFrame(() => { l.style.transform = 'none'; });
      setTimeout(() => { l.style.transform = 'translateX(-120%)'; setTimeout(() => l.remove(), 800); }, ms);
    },
    // zoom about the screen point (ox,oy) (1920x1080 space) by factor s on top of the base scale
    zoom(ox, oy, s, ms) {
      const r = document.getElementById('root'); if (!r) return;
      r.style.transition = `transform ${ms}ms cubic-bezier(.22,1,.36,1)`;
      r.style.transform = `translate(${ox * (1 - s)}px,${oy * (1 - s)}px) scale(${K * s})`;
    },
  };
  };
  if (document.documentElement) boot();
  else new MutationObserver((m, o) => { if (document.documentElement) { o.disconnect(); boot(); } }).observe(document, { childList: true });
})();
"""

LAYOUT_INIT = """
(() => { const add = () => { const s = document.createElement('style'); s.textContent = `%CSS%`; (document.head || document.documentElement).appendChild(s); };
  if (document.documentElement) add(); else new MutationObserver((m, o) => { if (document.documentElement) { o.disconnect(); add(); } }).observe(document, { childList: true }); })();
"""

class Rec:
    def __init__(self, part):
        self.part = part; self.frames = []; self.marks = []; self.zoomed = False
        self.dir = os.path.join(FRAMES, part); os.makedirs(self.dir, exist_ok=True)
        for f in os.listdir(self.dir): os.remove(os.path.join(self.dir, f))
        self.first_py = None
    async def start(self, ctx, pg):
        self.pg = pg; self.cdp = await ctx.new_cdp_session(pg)
        await self.cdp.send("Animation.enable")
        self.cdp.on("Page.screencastFrame", lambda ev: asyncio.ensure_future(self._frame(ev)))
        await self.cdp.send("Page.startScreencast", {"format": "jpeg", "quality": 82, "maxWidth": W_, "maxHeight": H_, "everyNthFrame": 1})
    async def _frame(self, ev):
        ts = ev["metadata"]["timestamp"]
        if self.first_py is None: self.first_py = time.time(); self.first_ts = ts
        i = len(self.frames)
        with open(os.path.join(self.dir, f"{i:06d}.jpg"), "wb") as f: f.write(base64.b64decode(ev["data"]))
        self.frames.append(ts - self.first_ts)                 # REAL seconds since the first frame
        try: await self.cdp.send("Page.screencastFrameAck", {"sessionId": ev["sessionId"]})
        except Exception: pass
    async def rate(self): await self.cdp.send("Animation.setPlaybackRate", {"playbackRate": S})
    async def go(self, url):
        await self.pg.goto(url); await self.rate()
    async def w(self, ms): await self.pg.wait_for_timeout(ms / S)       # wait ms of PAGE time
    def mark(self, name):
        t = round(((time.time() - self.first_py) * S) if self.first_py else 0, 1); self.marks.append([name, t]); print(f"[{t:6.1f}s page] {name}", flush=True)
    async def finish(self):
        await self.cdp.send("Page.stopScreencast")
        json.dump({"real_times": self.frames, "scale": S, "marks": self.marks}, open(os.path.join(self.dir, "timeline.json"), "w"))
        print(f"{len(self.frames)} frames, {self.frames[-1]:.0f}s real = {self.frames[-1]*S:.0f}s video")

# ---------- helpers ----------
async def cursor_to(r, x, y, ms=800):
    await r.pg.evaluate(f"MG.cursor({x},{y},{ms})"); await r.w(ms + 80)
async def center(loc):
    b = await loc.bounding_box(); return (b["x"] + b["width"] / 2, b["y"] + b["height"] / 2, b)
async def unzoom(r, ms=800):
    if r.zoomed:
        await r.pg.evaluate(f"MG.zoom(960,540,1,{ms})"); await r.w(ms + 100); r.zoomed = False
async def zoom_to(r, x, y, s, ms=1500):
    await r.pg.evaluate(f"MG.zoom({x},{y},{s},{ms})"); r.zoomed = s != 1
async def click_on(r, loc, ms=900, pause=350):
    await unzoom(r)
    x, y, _ = await center(loc)
    await cursor_to(r, x + 8, y + 5, ms)
    await r.pg.evaluate(f"MG.click({x + 8},{y + 5})"); await r.w(pause)
    await loc.click()
async def ring_box(r, b, label=None, ms=3200, pad=16):
    await r.pg.evaluate(f"MG.ring({b['x']-pad},{b['y']-pad},{b['width']+2*pad},{b['height']+2*pad},{json.dumps(label)},{ms})")
async def ring(r, loc, label=None, ms=3200, pad=16):
    await ring_box(r, await loc.bounding_box(), label, ms, pad)
async def lower(r, a, b, ms=5000): await r.pg.evaluate(f"MG.lower({json.dumps(a)},{json.dumps(b)},{ms})")
def card(loc, sel="rounded-2xl"): return loc.locator(f"xpath=ancestor::div[contains(@class,'{sel}')][1]")
async def schedule(r, events):
    t0 = time.time()
    for at, fn in sorted(events, key=lambda e: e[0]):
        wait = at / S - (time.time() - t0)
        if wait > 0: await asyncio.sleep(wait)
        await fn()

# ---------- segments ----------
BRIEF = [[10000, 11000, 10500], [9500, 9500, 9500, 10000], [9000, 8000, 8500]]
BRIEF_NAMES = ["BRIEF 1 the problem", "BRIEF 2 the workflow", "BRIEF 3 the innovation"]
STORY = [[7500, 8000, 8000], [7000, 8000, 6500], [6500, 6500, 6000], [6500, 7500, 7500], [6500, 6500, 7500], [6500, 7500, 6500], [8000, 0]]
STORY_NAMES = ["STORY 1 the problem", "STORY 2 how it works", "STORY 3 Asha", "STORY 4 Ravi", "STORY 5 Meera", "STORY 6 employer", "STORY 7 proof"]

async def seg_A(r):
    r.mark("TITLE card")
    await r.go(BASE + "/mg/intro"); await r.w(7500)
    await r.go(BASE + "/briefing")
    t = 0.0; ev = []
    for n, c in zip(BRIEF_NAMES, BRIEF):
        ev.append((t, (lambda n=n: _mk(r, n)))); t += sum(c) / 1000
    await schedule(r, ev)                         # marks the start of each briefing chapter
    await r.w(int((t - ev[-1][0]) * 1000) + 1500)   # the briefing plays by itself; wait for its last chapter

async def _mk(r, n): r.mark(n)

async def seg_B(r):
    r.mark("WELCOME page")
    await r.go(BASE + f"/?speed={SPEED}"); await r.w(1600)
    await zoom_to(r, 700, 440, 1.15, 1600); await r.w(3200)
    await zoom_to(r, 1450, 450, 1.18, 1600); await r.w(3600)
    await unzoom(r, 900)
    r.mark("CLICK Watch the story")
    await click_on(r, r.pg.locator("[data-tour=start-story]"), ms=1100)
    starts, t = [], 0.0
    for c in STORY: starts.append(t); t += sum(c) / 1000 / SPEED
    z = lambda x, y, s: (lambda: zoom_to(r, x, y, s, 1600))
    rz = lambda: unzoom(r, 1400)
    beat = lambda ci, bi: starts[ci] + sum(STORY[ci][:bi]) / 1000 / SPEED
    ev = [(starts[i], (lambda n=n: _mk(r, n))) for i, n in enumerate(STORY_NAMES)]
    ev += [(beat(0, 0) + 2.2, z(960, 400, 1.22)), (beat(0, 0) + 5.0, rz),
           (beat(1, 1) + 0.8, z(960, 430, 1.28)), (beat(1, 1) + 4.2, rz),
           (beat(3, 1) + 0.8, z(960, 420, 1.32)), (beat(3, 1) + 4.6, rz),
           (beat(4, 1) + 0.4, z(830, 440, 1.3)), (beat(4, 1) + 4.2, rz),
           (beat(5, 2) + 0.6, z(1180, 440, 1.4)), (beat(5, 2) + 4.2, rz),
           (beat(6, 0) + 3.2, z(1200, 420, 1.2)), (beat(6, 0) + 5.4, rz)]
    await schedule(r, ev)
    await r.w(4200)
    r.mark("CLICK Explore the live system")
    await click_on(r, r.pg.locator("[data-tour=story-explore]"), ms=1100)
    await r.w(1200)

async def seg_C(r):
    pg = r.pg
    r.mark("LIVE 1 overview")
    await r.go(BASE + "/overview"); await r.w(2600)
    await lower(r, "Live system · Overview", "Every number comes from the database, not from a script.", 5200)
    await ring(r, card(pg.get_by_text("Total Active Enrolments")), "Seats counted + verified at source", 3400); await r.w(3800)
    await ring(r, card(pg.get_by_text("DPDP Proof").first), "Live scan: raw student IDs", 3200); await r.w(3600)
    await ring(r, card(pg.get_by_text("Recent Verification Incidents")), "Flags, each with a reason", 3000); await r.w(3200)

    r.mark("LIVE 2 upload")
    await r.go(BASE + "/upload"); await r.w(1800)
    await lower(r, "Step 1 · Upload admissions", "IDs are checked once, sealed, and forgotten.", 5200)
    await click_on(r, pg.get_by_role("button", name="Load demo CSV").first); await r.w(900)
    await click_on(r, pg.get_by_role("button", name="Upload admissions")); await r.w(5400)
    r.mark("upload burst done")
    await r.w(1200); await zoom_to(r, 1450, 540, 1.18, 1500); await r.w(2800); await unzoom(r, 1000)

    r.mark("LIVE 3 radar")
    await r.go(BASE + "/radar"); await r.w(2200)
    await lower(r, "Step 2 · Duplicate radar", "The same seal in two colleges. No names shown.", 5200)
    ask = pg.get_by_role("button", name="Ask both colleges").nth(1)
    await ring(r, card(ask, "rounded-"), "Same seal, two colleges", 3000, 10); await r.w(3200)
    await click_on(r, ask); await r.w(1800)
    await click_on(r, pg.get_by_role("button", name="Send Inquiry to Both Colleges")); await r.w(3400)
    r.mark("inquiry sent (real audit entry)")

    r.mark("LIVE 4 integrity")
    await r.go(BASE + "/integrity"); await r.w(2400)
    await lower(r, "Step 3 · Seat integrity", "A score with the reason, in points.", 5000)
    cardloc = card(pg.get_by_role("heading", name="MIT Pune").first, "rounded-2xl")
    await click_on(r, cardloc.locator("button").last); await r.w(1800)
    await pg.mouse.move(960, 700); await pg.mouse.wheel(0, 330); await r.w(2800)
    await pg.mouse.wheel(0, -330); await r.w(900)
    await click_on(r, pg.get_by_role("button", name="Season Replay")); await r.w(3600)
    r.mark("replay shown")

    r.mark("LIVE 5 proof")
    await r.go(BASE + "/proof"); await r.w(1800)
    await lower(r, "Step 6 · Privacy proof", "Scan the whole database for raw IDs.", 4500)
    await click_on(r, pg.get_by_role("button", name="Run privacy scan")); await r.w(5800)
    r.mark("proof burst done"); await r.w(900)

    r.mark("OUTRO card")
    await r.go(BASE + "/mg/outro"); await r.w(9500)

async def seg_T(r):
    await r.go(BASE + "/?speed=1.55"); await r.w(3000)
    await zoom_to(r, 700, 440, 1.15, 1600); await r.w(2500)
    await unzoom(r, 900)
    await click_on(r, r.pg.locator("[data-tour=start-story]"), ms=900); await r.w(3500)

async def seg_D(r):
    r.mark("OUTRO card")
    await r.go(BASE + "/mg/outro"); await r.w(21000)

async def main(part):
    os.makedirs(OUT, exist_ok=True)
    k = BASE_SCALE
    async with async_playwright() as p:
        kw = {"executable_path": CHROME} if CHROME else {}
        b = await p.chromium.launch(args=["--no-sandbox", "--use-gl=swiftshader", "--hide-scrollbars", "--disable-lcd-text"], **kw)
        ctx = await b.new_context(viewport={"width": W_, "height": H_}, device_scale_factor=1)
        await ctx.add_init_script(TIME_HACK.replace("%S%", str(S)))
        await ctx.add_init_script(LAYOUT_INIT.replace("%CSS%", LAYOUT_CSS.replace("%K%", f"{k:.5f}")))
        await ctx.add_init_script(OVERLAY.replace("%K%", f"{k:.5f}"))
        pg = await ctx.new_page(); r = Rec(part)
        pg.on("pageerror", lambda e: print("PAGEERR", str(e)[:160], flush=True))
        await r.start(ctx, pg)
        await {"A": seg_A, "B": seg_B, "C": seg_C, "T": seg_T, "D": seg_D}[part](r)
        await r.finish(); await ctx.close(); await b.close()

if __name__ == "__main__":
    asyncio.run(main(sys.argv[1]))
