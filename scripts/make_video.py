"""
make_video.py — joins the two recorded parts into demo/video/sakshi-demo.mp4 (1080p, H.264, 30 fps, silent).
The voice-over is read by a person over this silent video; see docs/VIDEO_SCRIPT.md for the timed script.
"""
import glob, os, subprocess, json
ROOT = os.path.join(os.path.dirname(__file__), "..", "demo", "video")
try:
    import imageio_ffmpeg; FF = imageio_ffmpeg.get_ffmpeg_exe()
except Exception:
    FF = "ffmpeg"
FP = FF.replace("ffmpeg", "ffprobe") if "imageio" not in FF else "ffprobe"

def dur(path):
    out = subprocess.check_output([FP if os.path.exists(FP) or FP == "ffprobe" else "ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", path])
    return float(json.loads(out)["format"]["duration"])

import sys
a = glob.glob(os.path.join(ROOT, "raw_A", "*.webm"))[0]
b = glob.glob(os.path.join(ROOT, "raw_B", "*.webm"))[0]
fa, fb = os.path.join(ROOT, "part_A.mp4"), os.path.join(ROOT, "part_B.mp4")
out = os.path.join(ROOT, "sakshi-demo.mp4")
da, db = dur(a), dur(b)

def enc(src, dst, d, fade_in, fade_out):
    vf = "fps=30,scale=1920:1080,format=yuv420p"
    if fade_in: vf += ",fade=t=in:st=0:d=0.5"
    if fade_out: vf += f",fade=t=out:st={d - 0.6:.2f}:d=0.6"
    subprocess.check_call([FF, "-y", "-v", "error", "-i", src, "-vf", vf, "-c:v", "libx264", "-crf", "21",
                           "-preset", "veryfast", "-threads", "0", "-movflags", "+faststart", dst])

step = sys.argv[1] if len(sys.argv) > 1 else "all"
if step in ("A", "all"): enc(a, fa, da, True, True); print("part A done")
if step in ("B", "all"): enc(b, fb, db, True, True); print("part B done")
if step in ("join", "all"):
    lst = os.path.join(ROOT, "list.txt")
    open(lst, "w").write(f"file '{os.path.abspath(fa)}'\nfile '{os.path.abspath(fb)}'\n")
    subprocess.check_call([FF, "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", "-movflags", "+faststart", out])
    print(f"wrote {out} ({da + db:.1f}s); part B starts at {da:.1f}s")
