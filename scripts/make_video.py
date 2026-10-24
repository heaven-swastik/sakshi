"""
make_video.py — turns the frames captured by record_video.py into demo/video/sakshi-demo.mp4
(1920x1080, 30 fps, H.264, silent). Frames were captured with the page clock slowed down, so here they are
played back at normal speed: every output frame is the latest captured frame at that moment.

Usage:  python scripts/make_video.py A     # encode one part (run A, B, C one by one if time is limited)
        python scripts/make_video.py join  # join the parts and write the timing file docs/video_timing.json
"""
import json, os, subprocess, sys
FRAMES = os.environ.get("FRAMES_DIR", "/tmp/sakshi_frames")
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "demo", "video")
FPS = 30
try:
    import imageio_ffmpeg; FF = imageio_ffmpeg.get_ffmpeg_exe()
except Exception:
    FF = "ffmpeg"
if subprocess.call(["which", "ffmpeg"], stdout=subprocess.DEVNULL) == 0: FF = "ffmpeg"

def encode(part, cut=None):
    d = os.path.join(FRAMES, part)
    tl = json.load(open(os.path.join(d, "timeline.json")))
    pt = [t * tl["scale"] for t in tl["real_times"]]            # page seconds = video seconds
    keep = [i for i, t in enumerate(pt) if cut is None or t <= cut]
    pt = [pt[i] for i in keep]
    names = {j: keep[j] for j in range(len(keep))}
    last_in_slot = {}
    for i, t in enumerate(pt): last_in_slot[int(t * FPS)] = names[i]   # keep the newest frame in each 1/30 s slot
    slots = sorted(last_in_slot)
    end_slot = slots[-1] + int((3.5 if part == "D" else 0.6) * FPS)   # hold the last frame (3.5 s on the closing card)
    lst = os.path.join(d, "list.txt")
    with open(lst, "w") as f:
        for k, s in enumerate(slots):
            nxt = slots[k + 1] if k + 1 < len(slots) else end_slot
            f.write(f"file '{os.path.join(d, '%06d.jpg' % last_in_slot[s])}'\nduration {(nxt - s) / FPS:.5f}\n")
        f.write(f"file '{os.path.join(d, '%06d.jpg' % last_in_slot[slots[-1]])}'\n")
    dur = end_slot / FPS
    out = os.path.join(OUT, f"part_{part}.mp4")
    vf = f"format=yuv420p,fade=t=in:st=0:d=0.4,fade=t=out:st={dur - 0.4:.2f}:d=0.4"
    subprocess.check_call([FF, "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", lst, "-vf", vf, "-r", str(FPS),
                           "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-movflags", "+faststart", out])
    json.dump({"duration": dur, "marks": [m for m in tl["marks"] if cut is None or m[1] <= cut]}, open(os.path.join(OUT, f"timing_{part}.json"), "w"))
    print(f"part {part}: {dur:.1f}s, {len(slots)} distinct frames")

def join():
    parts = [p for p in "ABCD" if os.path.exists(os.path.join(OUT, f"part_{p}.mp4"))]
    lst = os.path.join(OUT, "list.txt")
    open(lst, "w").write("".join(f"file '{os.path.abspath(os.path.join(OUT, f'part_{p}.mp4'))}'\n" for p in parts))
    out = os.path.join(OUT, "sakshi-demo.mp4")
    subprocess.check_call([FF, "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", "-movflags", "+faststart", out])
    t, timeline = 0.0, []
    for p in parts:
        tm = json.load(open(os.path.join(OUT, f"timing_{p}.json")))
        for name, s in tm["marks"]: timeline.append([name, round(t + s, 1)])
        t += tm["duration"]
    json.dump({"total": round(t, 1), "marks": timeline}, open(os.path.join(OUT, "timing.json"), "w"), indent=1)
    print(f"wrote {out} ({t:.1f}s)")

if __name__ == "__main__":
    a = sys.argv[1] if len(sys.argv) > 1 else "join"
    cut = float(sys.argv[2]) if len(sys.argv) > 2 else None   # optional: drop frames after this many seconds
    join() if a == "join" else encode(a, cut)
