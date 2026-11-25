"""Resize photos so they cover a 9:16 frame with room for a 1.3x push-in, as JPEG q88.

usage: python normalize-images.py <dir>   (rewrites files in place)
"""
import sys
from pathlib import Path
from PIL import Image

COVER_W, COVER_H = 1404, 2496  # 1080x1920 x 1.3

for f in sorted(Path(sys.argv[1]).glob("*.jpg")):
    im = Image.open(f).convert("RGB")
    scale = max(COVER_W / im.width, COVER_H / im.height)
    if scale < 1:
        im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    im.save(f, "JPEG", quality=88)
    print(f.name, im.size, f.stat().st_size // 1024, "KB")
