#!/usr/bin/env python3
"""card.py: a placeholder hole card in the card1-3 layout, until real art exists.

    python3 tests/tools/card.py <n> <name> <par> <yards> [--theme parkland|links|coast|lakes|desert] [--out PATH] [--size 474x592]

    python3 tests/tools/card.py 7 "Royal Troon" 3 123 --theme links      -> cards/card7.jpg

Layout (as card1-3): a tilted yellow number box top left, a tilted yellow title banner beside it with the course name over "Par N", a tilted white
yardage tag ("123y") under the banner's right end, and the scene below: sky, far hills, a rolling hill, a fairway that bends to a green with a flag.
It is drawn flat and simple on purpose: a stand-in that reads at a glance and is obviously not final art. Set `card:'cards/card<n>.jpg'` on the hole.
The default size is 474x592 (the Phase 4 cards, twice the 237x296 of card1); the ratio is the original 4:5.
Needs Pillow."""
import argparse, math, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
INK, YELLOW, WHITE = (23, 18, 40), (255, 214, 79), (255, 255, 255)
THEMES = {   # sky top, sky bottom, far hills, hill, fairway, green, rough
    'parkland': ((250, 204, 120), (255, 226, 160), (226, 160, 80), (160, 170, 70), (98, 172, 66), (124, 196, 80), (150, 164, 70)),
    'links':    ((246, 198, 130), (252, 224, 170), (214, 170, 96), (170, 172, 84), (112, 176, 70), (130, 198, 86), (166, 172, 90)),
    'coast':    ((120, 190, 240), (210, 232, 250), (92, 150, 190), (150, 170, 80), (100, 174, 70), (124, 198, 84), (146, 160, 74)),
    'lakes':    ((130, 196, 236), (214, 236, 250), (96, 160, 140), (140, 176, 80), (96, 170, 70), (122, 196, 84), (140, 166, 78)),
    'desert':   ((250, 190, 110), (255, 226, 170), (214, 140, 90), (206, 170, 100), (120, 170, 70), (130, 190, 84), (200, 170, 100)),
}
FONTS = ['/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
         '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf', 'DejaVuSans-Bold.ttf']


def font(size):
    for f in FONTS:
        try: return ImageFont.truetype(f, size)
        except OSError: pass
    return ImageFont.load_default()


def fit(draw, text, max_w, size):
    while size > 12 and draw.textlength(text, font=font(size)) > max_w: size -= 2
    return font(size)


def tilted(base, w, h, angle, paint, anchor):
    """paint(draw, w, h) onto a transparent w x h layer, rotate it by `angle` degrees about its middle, and composite with its middle at `anchor`"""
    pad = int(max(w, h) * 0.2)
    layer = Image.new('RGBA', (w + 2 * pad, h + 2 * pad), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer); d.rectangle((pad + 7, pad + 7, pad + w + 7, pad + h + 7), fill=(*INK, 90)); paint(d, w, h, pad)
    layer = layer.rotate(angle, resample=Image.BICUBIC, expand=True)
    base.alpha_composite(layer, (int(anchor[0] - layer.width / 2), int(anchor[1] - layer.height / 2)))


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('n', type=int); ap.add_argument('name'); ap.add_argument('par', type=int); ap.add_argument('yards', type=int)
    ap.add_argument('--theme', default='parkland', choices=sorted(THEMES)); ap.add_argument('--size', default='474x592'); ap.add_argument('--out')
    a = ap.parse_args()
    W, H = (int(v) for v in a.size.lower().split('x'))
    S = 2; w, h = W * S, H * S                                   # draw at twice the size, then shrink for clean edges
    sky0, sky1, far, hill, fair, grn, rough = THEMES[a.theme]
    img = Image.new('RGBA', (w, h), sky1); d = ImageDraw.Draw(img)
    for y in range(int(h * 0.62)):                               # sky
        t = y / (h * 0.62); d.line((0, y, w, y), fill=tuple(int(sky0[i] + (sky1[i] - sky0[i]) * t) for i in range(3)))
    d.polygon([(0, h * .52)] + [(x, h * (.5 - .07 * math.sin(x / w * 5 + .6) - .03 * math.sin(x / w * 11))) for x in range(0, w + 1, 8)] + [(w, h * .52), (w, h * .62), (0, h * .62)], fill=far)
    ground = [(x, h * (.60 + .035 * math.sin(x / w * 3.4 + 1.2))) for x in range(0, w + 1, 8)]
    d.polygon(ground + [(w, h), (0, h)], fill=rough)
    d.polygon([(0, h * .66)] + [(x, h * (.64 + .03 * math.sin(x / w * 2.6 + 2.4))) for x in range(0, w + 1, 8)] + [(w, h), (0, h)], fill=hill)
    gx, gy = w * 0.68, h * 0.665                                 # the green, up the fairway
    d.polygon([(w * 0.18, h), (w * 0.47, h), (w * 0.60, h * .86), (gx + w * 0.07, gy + h * 0.02), (gx - w * 0.06, gy + h * 0.015), (w * 0.30, h * .80), (w * 0.12, h * .92)], fill=fair)
    d.ellipse((gx - w * .11, gy - h * .02, gx + w * .11, gy + h * .03), fill=grn)
    d.ellipse((w * .55, gy + h * .035, w * .62, gy + h * .06), fill=(236, 217, 160))        # a bunker, short left
    d.line((gx, gy - h * .09, gx, gy + h * .002), fill=WHITE, width=4 * S)
    d.polygon([(gx, gy - h * .09), (gx + w * .07, gy - h * .075), (gx, gy - h * .06)], fill=(232, 56, 90))

    def number(dd, bw, bh, pad):
        dd.rectangle((pad, pad, pad + bw, pad + bh), fill=YELLOW, outline=INK, width=4 * S)
        f = font(int(bh * .72)); t = str(a.n); tw = dd.textlength(t, font=f)
        dd.text((pad + bw / 2 - tw / 2, pad + bh / 2), t, font=f, fill=INK, anchor='lm')
    tilted(img, int(w * .21), int(h * .17), 3.2, number, (w * .125, h * .095))

    def banner(dd, bw, bh, pad):
        dd.rectangle((pad, pad, pad + bw, pad + bh), fill=YELLOW, outline=INK, width=4 * S)
        f = fit(dd, a.name.upper(), bw - 40 * S, int(bh * .5)); dd.text((pad + 20 * S, pad + bh * .40), a.name.upper(), font=f, fill=INK, anchor='lm')
        dd.text((pad + 20 * S, pad + bh * .79), f'Par {a.par}', font=font(int(bh * .27)), fill=INK, anchor='lm')
    tilted(img, int(w * .73), int(h * .155), -1.4, banner, (w * .63, h * .088))

    def tag(dd, bw, bh, pad):
        dd.rectangle((pad, pad, pad + bw, pad + bh), fill=WHITE, outline=INK, width=3 * S)
        t = f'{a.yards}y'; f = fit(dd, t, bw - 24 * S, int(bh * .62)); dd.text((pad + bw / 2, pad + bh / 2), t, font=f, fill=INK, anchor='mm')
    tilted(img, int(w * .235), int(h * .085), 2.4, tag, (w * .805, h * .2))

    out = Path(a.out) if a.out else ROOT / 'cards' / f'card{a.n}.jpg'
    out.parent.mkdir(parents=True, exist_ok=True)
    img.convert('RGB').resize((W, H), Image.LANCZOS).save(out, quality=88)
    print(f'wrote {out.relative_to(ROOT) if out.is_relative_to(ROOT) else out}  ({W}x{H}, theme {a.theme})')


if __name__ == '__main__':
    main()
