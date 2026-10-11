#!/usr/bin/env python3
"""ROLET — Sanat Yasası palet kontrolü.

Kullanım:
    python3 palette-check.py <resim> [tolerans=48]

Palet (yalnızca bunlar):
    #1A140F mürekkep · #E6D7C3 kâğıt · #8C2F2F kuru kan · #C6A15B pirinç · #2F4A3C is yeşili

Şeffaf pikseller yok sayılır. Tolerans: kanal başına izin verilen en büyük fark.
Aykırı piksellerin haritası `<ad>-palette-diff.png` olarak kaydedilir.
"""
import sys
from collections import Counter

try:
    import numpy as np
    HAVE_NP = True
except ImportError:
    HAVE_NP = False

from PIL import Image

PALETTE = [
    ("mürekkep #1A140F", (0x1A, 0x14, 0x0F)),
    ("kâğıt #E6D7C3", (0xE6, 0xD7, 0xC3)),
    ("kuru kan #8C2F2F", (0x8C, 0x2F, 0x2F)),
    ("pirinç #C6A15B", (0xC6, 0xA1, 0x5B)),
    ("is yeşili #2F4A3C", (0x2F, 0x4A, 0x3C)),
]


def check_np(path: str, tol: int) -> None:
    img = Image.open(path).convert("RGBA")
    arr = np.asarray(img).astype(np.int16)
    h, w, _ = arr.shape

    alpha = arr[:, :, 3]
    solid = alpha >= 16
    rgb = arr[:, :, :3]

    min_dist = np.full((h, w), 10_000, dtype=np.int16)
    for _, (pr, pg, pb) in PALETTE:
        d = np.abs(rgb - np.array([pr, pg, pb], dtype=np.int16)).max(axis=2)
        min_dist = np.minimum(min_dist, d)

    total = int(solid.sum())
    ok = int(((min_dist <= tol) & solid).sum())
    bad_mask = solid & (min_dist > tol)

    pct = (ok / total * 100) if total else 0.0
    print(f"Dosya : {path}")
    print(f"Boyut : {w}x{h}  |  sayılan piksel: {total:,}  (şeffaflar hariç)")
    print(f"Uyum  : %{pct:.1f}  (tolerans ±{tol}/kanal)")

    if bad_mask.any():
        ys, xs = np.where(bad_mask)
        print(f"Aykırı: {len(xs):,} piksel")
        # en sık aykırı renkler (32'lik kovalara yuvarlanmış)
        quants = (rgb[bad_mask] // 32 * 32)
        top = Counter(map(tuple, quants)).most_common(6)
        for (r, g, b), c in top:
            print(f"    #{r:02X}{g:02X}{b:02X} civarı  ×{c:,}")
        out = np.asarray(img).copy()
        out[bad_mask] = [255, 0, 0, 255]
        diff_path = path.rsplit(".", 1)[0] + "-palette-diff.png"
        Image.fromarray(out).save(diff_path)
        print(f"Harita: {diff_path}")

    verdict = "TEMİZ ✓" if pct >= 97 else ("SINIRDA ~" if pct >= 90 else "PALET DIŞI ✗")
    print("SONUÇ :", verdict)
    if verdict != "TEMİZ ✓":
        print("Not   : Sanat yasası der ki: palet dışına çıkan piksel varsa kare silinir.")


def check_lo(path: str, tol: int) -> None:
    img = Image.open(path).convert("RGBA")
    w, h = img.size
    px = img.load()
    total = ok = 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 16:
                continue
            total += 1
            if any(max(abs(r - pr), abs(g - pg), abs(b - pb)) <= tol for _, (pr, pg, pb) in PALETTE):
                ok += 1
    pct = (ok / total * 100) if total else 0.0
    print(f"Dosya : {path}\nBoyut : {w}x{h}  |  sayılan: {total:,}")
    print(f"Uyum  : %{pct:.1f}  (tolerans ±{tol}/kanal)")
    print("SONUÇ :", "TEMİZ ✓" if pct >= 97 else ("SINIRDA ~" if pct >= 90 else "PALET DIŞI ✗"))


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    target = sys.argv[1]
    tolerance = int(sys.argv[2]) if len(sys.argv) > 2 else 48
    if HAVE_NP:
        check_np(target, tolerance)
    else:
        print("(not: numpy yok, yavaş mod)")
        check_lo(target, tolerance)
