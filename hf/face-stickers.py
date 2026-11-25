"""Covers close-up faces in TikTok footage with a sticker (user request 20/11/2026: privacy).

python -I hf/face-stickers.py <footage dir> <clip names...> [--emoji 🌼] [--min 0.05] [--score 0.9] [--proof <dir>]

Each clip <name>.mp4 is read frame by frame; YuNet finds faces; any face wider than --min of the frame width
(close enough to be recognisable) gets a round sticker drawn over it. Boxes are smoothed and held for a few
frames when the detector blinks, so the sticker does not flicker. The original is kept as <name>.orig.mp4.
Prints how many frames had a covered face, so clips with none are left untouched.
"""
import os, sys, shutil, subprocess
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
MODEL = os.path.join(HERE, "models", "face_detection_yunet_2023mar.onnx")

args = sys.argv[1:]
emoji = "🌼"
min_frac = 0.05
score = 0.9
proof = None
if "--emoji" in args:
    i = args.index("--emoji"); emoji = args[i + 1]; del args[i:i + 2]
if "--min" in args:
    i = args.index("--min"); min_frac = float(args[i + 1]); del args[i:i + 2]
if "--score" in args:
    i = args.index("--score"); score = float(args[i + 1]); del args[i:i + 2]
if "--proof" in args:
    i = args.index("--proof"); proof = args[i + 1]; del args[i:i + 2]
folder, names = args[0], args[1:]


def sticker(size):
    """A white disc with a soft shadow and the emoji on it, as RGBA."""
    s = size * 2
    im = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse([int(s * 0.03), int(s * 0.06), int(s * 0.99), int(s * 0.99)], fill=(0, 0, 0, 70))
    d.ellipse([0, 0, int(s * 0.96), int(s * 0.96)], fill=(255, 250, 240, 255))
    font = ImageFont.truetype("C:/Windows/Fonts/seguiemj.ttf", int(s * 0.62))
    d.text((int(s * 0.48), int(s * 0.5)), emoji, font=font, anchor="mm", embedded_color=True)
    return im.resize((size, size), Image.LANCZOS)


cache = {}


def paste(frame, cx, cy, size):
    size = int(size)
    if size not in cache:
        cache[size] = np.array(sticker(size))
    st = cache[size]
    h, w = frame.shape[:2]
    x0, y0 = int(cx - size / 2), int(cy - size / 2)
    xa, ya, xb, yb = max(0, x0), max(0, y0), min(w, x0 + size), min(h, y0 + size)
    if xa >= xb or ya >= yb:
        return
    part = st[ya - y0:yb - y0, xa - x0:xb - x0]
    alpha = part[:, :, 3:4] / 255.0
    rgb = part[:, :, :3][:, :, ::-1]
    frame[ya:yb, xa:xb] = (frame[ya:yb, xa:xb] * (1 - alpha) + rgb * alpha).astype(np.uint8)


for name in names:
    src = os.path.join(folder, name + ".mp4")
    orig = os.path.join(folder, name + ".orig.mp4")
    if not os.path.exists(orig):
        shutil.copyfile(src, orig)
    cap = cv2.VideoCapture(orig)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    W, H = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    scale = 0.5
    # Detect at a low threshold, then keep only faces confirmed by a confident detection in the same shot.
    det = cv2.FaceDetectorYN.create(MODEL, "", (int(W * scale), int(H * scale)), 0.5, 0.3, 50)
    tracks, thumbs = [], []
    while True:
        ok, fr = cap.read()
        if not ok:
            break
        small = cv2.resize(fr, (int(W * scale), int(H * scale)))
        _, faces = det.detect(small)
        boxes = []
        if faces is not None:
            for f in faces:
                x, y, w, h = (f[:4] / scale).tolist()
                if w >= W * min_frac * 0.8:
                    boxes.append((x + w / 2, y + h / 2, max(w, h) * 1.8, float(f[-1])))
        tracks.append(boxes)
        thumbs.append(cv2.cvtColor(cv2.resize(fr, (64, 114)), cv2.COLOR_BGR2GRAY).astype(np.int16))
    cap.release()
    n = len(tracks)
    # Shots: a big jump between consecutive thumbnails is a cut; stickers never carry across a cut.
    cuts = [0] + [k for k in range(1, n) if np.abs(thumbs[k] - thumbs[k - 1]).mean() > 28] + [n]
    final = [[] for _ in range(n)]
    for s0, s1 in zip(cuts, cuts[1:]):
        strong = [b for k in range(s0, s1) for b in tracks[k] if b[3] >= score and b[2] >= W * min_frac * 1.8]
        if not strong:
            continue
        near = lambda b: any(abs(b[0] - o[0]) < o[2] and abs(b[1] - o[1]) < o[2] for o in strong)
        keep = {k: [b[:3] for b in tracks[k] if near(b)] for k in range(s0, s1)}
        hits = [k for k in range(s0, s1) if keep[k]]
        for k in range(s0, s1):
            if keep[k]:
                final[k] = keep[k]
                continue
            prev = max((h for h in hits if h < k), default=None)
            nxt = min((h for h in hits if h > k), default=None)
            gap = int(fps * 1.5)
            if prev is not None and nxt is not None and nxt - prev <= gap * 2:
                t = (k - prev) / (nxt - prev)
                out = []
                for bp in keep[prev]:
                    bn = min(keep[nxt], key=lambda o: (o[0] - bp[0]) ** 2 + (o[1] - bp[1]) ** 2)
                    out.append(tuple(bp[i] * (1 - t) + bn[i] * t for i in range(3)))
                final[k] = out
            elif prev is not None and k - prev <= gap:
                final[k] = keep[prev]
            elif nxt is not None and nxt - k <= gap:
                final[k] = keep[nxt]
    tracks = [[b[:3] for b in t if b[3] >= score] for t in tracks]
    covered = sum(1 for b in final if b)
    if proof and covered:
        # Dry run: save the frame with the most faces, boxes drawn, for a human check; leave the clip alone.
        k = max(range(n), key=lambda j: len(tracks[j]))
        cap = cv2.VideoCapture(orig); cap.set(cv2.CAP_PROP_POS_FRAMES, k); _, im = cap.read(); cap.release()
        for cx, cy, size in tracks[k]:
            cv2.rectangle(im, (int(cx - size / 2), int(cy - size / 2)), (int(cx + size / 2), int(cy + size / 2)), (0, 0, 255), 6)
        cv2.imwrite(os.path.join(proof, name + ".jpg"), cv2.resize(im, (270, 480)))
        print(f"{name}: {covered}/{n} frames")
        os.remove(orig)
        continue
    if not covered:
        print(f"{name}: no close faces")
        os.remove(orig)
        continue
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", str(fps), "-i", "-",
                          "-c:v", "libx264", "-preset", "veryfast", "-crf", "19", "-pix_fmt", "yuv420p", src], stdin=subprocess.PIPE)
    cap = cv2.VideoCapture(orig)
    for boxes in final:
        ok, fr = cap.read()
        if not ok:
            break
        for cx, cy, size in boxes:
            paste(fr, cx, cy, size)
        p.stdin.write(fr.tobytes())
    cap.release()
    p.stdin.close()
    p.wait()
    print(f"{name}: covered {covered}/{n} frames")
