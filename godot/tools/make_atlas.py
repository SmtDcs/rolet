"""One 256 atlas for the ROLET pixel set. Palette only."""
from PIL import Image

S = 256
BLACK = (0x14, 0x14, 0x14, 255)
GRAY1 = (0x1E, 0x22, 0x27, 255)
GRAY2 = (0x2E, 0x33, 0x3A, 255)
BONE = (0xE6, 0xE1, 0xD6, 255)
PAPER = (0xC8, 0xBF, 0xA8, 255)
SODIUM = (0xD9, 0x96, 0x3A, 255)
TEAL = (0x3F, 0x7F, 0x74, 255)
RED = (0xD2, 0x46, 0x2B, 255)

img = Image.new("RGBA", (S, S), BLACK)
px = img.load()


def fill(x, y, w, h, c):
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            px[xx, yy] = c


def rect(x, y, w, h, c):
    for xx in range(x, x + w):
        px[xx, y] = c
        px[xx, y + h - 1] = c
    for yy in range(y, y + h):
        px[x, yy] = c
        px[x + w - 1, yy] = c


def wood(x, y):
    fill(x, y, 64, 64, PAPER)
    for row in range(0, 64, 8):
        for xx in range(64):
            px[x + xx, y + row] = GRAY2
    for seam in (0, 21, 43):
        for yy in range(64):
            if yy % 3 != 0:
                px[x + seam, y + yy] = GRAY1
    for knot in ((8, 14), (30, 28), (50, 46), (18, 52), (40, 10)):
        px[x + knot[0], y + knot[1]] = SODIUM
        px[x + knot[0] + 1, y + knot[1]] = BLACK


def coat(x, y):
    fill(x, y, 64, 64, BLACK)
    for yy in range(64):
        for xx in range(64):
            if (xx + yy) % 5 == 0:
                px[x + xx, y + yy] = GRAY1
            elif (xx * 2 + yy) % 9 == 0:
                px[x + xx, y + yy] = GRAY2
    pass


def dither(x, y, w, h, base, mark, step):
    fill(x, y, w, h, base)
    for yy in range(h):
        for xx in range(w):
            if (xx + yy * 2) % step == 0:
                px[x + xx, y + yy] = mark


def paper_card(x, y):
    fill(x, y, 32, 32, PAPER)
    rect(x, y, 32, 32, BONE)
    rect(x + 2, y + 2, 28, 28, GRAY2)


def icon_eye(x, y):
    paper_card(x, y)
    for yy in range(10, 22):
        for xx in range(8, 24):
            if (xx - 16) ** 2 / 3 + (yy - 16) ** 2 < 18:
                px[x + xx, y + yy] = BLACK
    for yy in range(13, 19):
        for xx in range(13, 19):
            px[x + xx, y + yy] = BONE
    px[x + 15, y + 15] = BLACK
    px[x + 16, y + 15] = BLACK


def icon_shield(x, y):
    paper_card(x, y)
    for yy in range(7, 24):
        half = 6 + (yy - 7) // 3
        if yy > 16:
            half = max(2, 12 - (yy - 16))
        for xx in range(16 - half, 16 + half):
            px[x + xx, y + yy] = TEAL
    rect(x + 12, y + 10, 8, 8, BLACK)


def icon_heal(x, y):
    paper_card(x, y)
    for i in range(8, 24):
        for t in range(-2, 3):
            px[x + i, y + 16 + t] = SODIUM
            px[x + 16 + t, y + i] = SODIUM


def icon_hush(x, y):
    paper_card(x, y)
    for xx in range(8, 24):
        px[x + xx, y + 14] = GRAY2
        px[x + xx, y + 18] = GRAY2
        if xx % 3 == 0:
            px[x + xx, y + 12] = GRAY1


def metal(x, y):
    fill(x, y, 32, 32, GRAY2)
    for xx in range(32):
        px[x + xx, y] = BONE
        px[x + xx, y + 31] = BLACK
    for rivet in ((6, 8), (24, 8), (6, 22), (24, 22)):
        px[x + rivet[0], y + rivet[1]] = GRAY1
        px[x + rivet[0] + 1, y + rivet[1]] = BLACK


def lamp(x, y, c):
    fill(x, y, 32, 32, GRAY1)
    for yy in range(6, 26):
        for xx in range(6, 26):
            if (xx - 16) ** 2 + (yy - 16) ** 2 < 90:
                px[x + xx, y + yy] = c
    for yy in range(12, 20):
        for xx in range(12, 20):
            if (xx - 16) ** 2 + (yy - 16) ** 2 < 16:
                px[x + xx, y + yy] = BONE


wood(0, 0)
coat(64, 0)
metal(128, 0)
dither(160, 0, 32, 32, GRAY1, BLACK, 3)
paper_card(192, 0)
icon_eye(224, 0)
icon_shield(128, 32)
icon_heal(160, 32)
icon_hush(192, 32)
lamp(224, 32, SODIUM)
lamp(128, 64, RED)
fill(160, 64, 32, 32, GRAY1)
fill(192, 64, 32, 32, BONE)
px[192 + 15, 64 + 15] = BLACK
px[192 + 16, 64 + 15] = BLACK
px[192 + 15, 64 + 16] = BLACK
px[192 + 16, 64 + 16] = BLACK
fill(224, 64, 32, 32, BLACK)
dither(0, 64, 64, 64, BLACK, SODIUM, 4)
dither(0, 128, 128, 64, BLACK, SODIUM, 8)
dither(128, 128, 64, 64, BLACK, GRAY1, 5)
fill(192, 128, 32, 64, GRAY1)
for yy in range(8, 56, 4):
    for xx in range(6, 26):
        px[192 + xx, 128 + yy] = BLACK

def icon_eject(x, y):
    paper_card(x, y)
    for yy in range(10, 22):
        for xx in range(12, 20):
            px[x + xx, y + yy] = GRAY2
    for xx in range(13, 19):
        px[x + xx, y + 20] = RED


def icon_shuffle(x, y):
    paper_card(x, y)
    for i in range(8, 24):
        px[x + i, y + 10] = BONE
        px[x + i, y + 21] = BONE
    px[x + 22, y + 9] = BONE
    px[x + 23, y + 10] = BONE
    px[x + 8, y + 22] = BONE
    px[x + 9, y + 21] = BONE


def icon_x2(x, y):
    paper_card(x, y)
    for t in range(-1, 2):
        for i in range(9, 16):
            px[x + i, y + 12 + t] = SODIUM
            px[x + 12 + t, y + i - 2] = SODIUM
        for i in range(17, 24):
            px[x + i, y + 20 + t] = SODIUM
            px[x + 20 + t, y + i - 4] = SODIUM


def icon_load(x, y):
    paper_card(x, y)
    for yy in range(12, 20):
        for xx in range(10, 22):
            px[x + xx, y + yy] = RED
    px[x + 21, y + 15] = SODIUM
    px[x + 21, y + 16] = SODIUM


def icon_steal(x, y):
    paper_card(x, y)
    for xx in range(8, 24):
        px[x + xx, y + 18] = BONE
    for yy in range(10, 18):
        px[x + 14, y + yy] = BONE
        px[x + 18, y + yy] = BONE


def icon_peek(x, y):
    paper_card(x, y)
    for xx in range(8, 24):
        px[x + xx, y + 16] = BLACK
    for yy in range(13, 19):
        px[x + 16, y + yy] = TEAL


def icon_last(x, y):
    paper_card(x, y)
    for yy in range(8, 24):
        px[x + 16, y + yy] = RED
        px[x + 15, y + yy] = RED


def icon_fate(x, y):
    paper_card(x, y)
    for yy in range(8, 24):
        for xx in range(8, 24):
            if (xx - 16) ** 2 + (yy - 16) ** 2 < 36:
                px[x + xx, y + yy] = TEAL if xx < 16 else RED


icon_eject(0, 192)
icon_shuffle(32, 192)
icon_x2(64, 192)
icon_load(96, 192)
icon_steal(128, 192)
icon_peek(160, 192)
icon_last(192, 192)
icon_fate(224, 192)

img.save("/home/samet/rolet/godot/assets/atlas.png")
