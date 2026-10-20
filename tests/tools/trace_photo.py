#!/usr/bin/env python3
"""trace_photo.py: helpers for tracing a hole's reference photo (the Visual review step, docs/ICONIC-HOLES.md §2, step 7).

    python3 tests/tools/trace_photo.py grid <photo> <x0,y0,x1,y1> [--zoom 4] [--bright 1.5] [--out FILE]
    python3 tests/tools/trace_photo.py fill <photo> <u,v> [--tol 45] [--eps 1.0]
    python3 tests/tools/trace_photo.py show <id> [--view NAME] [--photo PATH] [--out FILE]
    python3 tests/tools/trace_photo.py hash <photo>

grid   a brightened, enlarged crop with a pixel grid (thin lines every 10 px, labelled magenta lines every 50) for reading outline points off the photo
       by eye. Coordinates are always the photo's own pixels (u right, v down).
fill   flood-fills the region around pixel u,v whose colour is within --tol (RGB distance) of the colour there, and prints its outline as a JSON list of
       [u,v] points, simplified to within --eps px. Good for sand (bright, even); a green in part shadow usually needs tracing by hand with `grid`.
show   draws docs/holes/trace/<id>.json onto each of its photos: every outline traced on it (sand yellow, green cyan, other white) and every camera
       constraint and landmark (red), so a tracing can be checked against the picture it came from. Each view's photo is its `image.file` in
       tests/tools/refs/, or --photo PATH with --view NAME.
hash   the photo's size and sha256, for the trace file's `image` block.

Reference photos are NOT committed (other people's pictures; see the trace file's `image.source`). Keep them in tests/tools/refs/ (git-ignored) or
anywhere else and pass --photo. Everything written goes to tests/tools/out/ (git-ignored) unless --out says otherwise. Needs Pillow."""
import argparse, hashlib, json, math, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TRACE = ROOT / 'docs' / 'holes' / 'trace'
REFS = Path(__file__).resolve().parent / 'refs'
OUT = Path(__file__).resolve().parent / 'out'


def need_pil():
    try:
        from PIL import Image  # noqa: F401
    except ImportError:
        sys.exit('trace_photo.py needs Pillow: pip install pillow')


def sha256(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def pair(s, n=2):
    v = [float(t) for t in s.split(',')]
    if len(v) != n: sys.exit(f"expected {n} comma-separated numbers, got '{s}'")
    return v


def cmd_grid(a):
    from PIL import Image, ImageDraw, ImageEnhance
    x0, y0, x1, y1 = (int(v) for v in pair(a.box, 4)); s = a.zoom
    im = Image.open(a.photo).convert('RGB').crop((x0, y0, x1, y1))
    im = ImageEnhance.Contrast(ImageEnhance.Brightness(im).enhance(a.bright)).enhance(1.4).resize(((x1 - x0) * s, (y1 - y0) * s), Image.LANCZOS)
    d = ImageDraw.Draw(im)
    for x in range(x0 - x0 % 10, x1, 10):
        if x < x0: continue
        d.line([((x - x0) * s, 0), ((x - x0) * s, (y1 - y0) * s)], fill=(255, 0, 255) if x % 50 == 0 else (70, 70, 150))
        if x % 50 == 0: d.text(((x - x0) * s + 2, 2), str(x), fill=(255, 255, 0))
    for y in range(y0 - y0 % 10, y1, 10):
        if y < y0: continue
        d.line([(0, (y - y0) * s), ((x1 - x0) * s, (y - y0) * s)], fill=(255, 0, 255) if y % 50 == 0 else (70, 70, 150))
        if y % 50 == 0: d.text((2, (y - y0) * s + 2), str(y), fill=(255, 255, 0))
    out = Path(a.out) if a.out else OUT / f'{Path(a.photo).stem}-grid-{x0}_{y0}.png'
    out.parent.mkdir(parents=True, exist_ok=True); im.save(out); print(out)


def simplify(P, eps):
    """Douglas-Peucker on a closed ring"""
    if len(P) < 4: return P
    def dp(pts):
        if len(pts) < 3: return pts
        (ax, ay), (bx, by) = pts[0], pts[-1]; L = math.hypot(bx - ax, by - ay) or 1e-9
        best, bi = -1, 0
        for i in range(1, len(pts) - 1):
            px, py = pts[i]; dd = abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / L
            if dd > best: best, bi = dd, i
        if best <= eps: return [pts[0], pts[-1]]
        return dp(pts[:bi + 1])[:-1] + dp(pts[bi:])
    far = max(range(len(P)), key=lambda i: (P[i][0] - P[0][0]) ** 2 + (P[i][1] - P[0][1]) ** 2)
    return dp(P[:far + 1])[:-1] + dp(P[far:] + [P[0]])[:-1]


def cmd_fill(a):
    from PIL import Image
    im = Image.open(a.photo).convert('RGB'); W, Hh = im.size; px = im.load()
    u, v = (int(round(t)) for t in pair(a.seed))
    if not (0 <= u < W and 0 <= v < Hh): sys.exit('seed outside the photo')
    ref = [sum(px[min(W - 1, max(0, u + i)), min(Hh - 1, max(0, v + j))][k] for i in (-1, 0, 1) for j in (-1, 0, 1)) / 9 for k in range(3)]
    ok = lambda c: math.dist(c, ref) <= a.tol
    mask = bytearray(W * Hh); stack = [(u, v)]; mask[v * W + u] = 1; n = 0
    while stack:
        x, y = stack.pop(); n += 1
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            X, Y = x + dx, y + dy
            if 0 <= X < W and 0 <= Y < Hh and not mask[Y * W + X] and ok(px[X, Y]): mask[Y * W + X] = 1; stack.append((X, Y))
    inside = lambda x, y: 0 <= x < W and 0 <= y < Hh and mask[y * W + x]
    # Moore-neighbour trace of the outer boundary, starting at the top-most, left-most pixel
    start = next((x, y) for y in range(Hh) for x in range(W) if mask[y * W + x])
    N8 = [(1, 0), (1, 1), (0, 1), (-1, 1), (-1, 0), (-1, -1), (0, -1), (1, -1)]
    ring, cur, d = [start], start, 7
    for _ in range(8 * W * Hh):
        for k in range(8):
            dd = (d + 5 + k) % 8                     # clockwise, starting just behind the last step
            nx, ny = cur[0] + N8[dd][0], cur[1] + N8[dd][1]
            if inside(nx, ny): cur, d = (nx, ny), dd; break
        else: break
        if cur == start: break
        ring.append(cur)
    pts = simplify([[x + 0.5, y + 0.5] for x, y in ring], a.eps)
    print(f'// {n} px filled from ({u},{v}), colour {[round(c) for c in ref]}, tol {a.tol}; {len(ring)} boundary px -> {len(pts)} points', file=sys.stderr)
    print(json.dumps([[round(x, 1), round(y, 1)] for x, y in pts]))


def load_trace(id_):
    f = TRACE / f'{id_}.json'
    if not f.exists(): sys.exit(f'no trace file {f.relative_to(ROOT)}')
    return json.loads(f.read_text())


def find_photo(img, given):
    p = Path(given) if given else REFS / img['file']
    if not p.exists(): sys.exit(f"reference photo not found: {p}\n(it is not in the repo: put it in tests/tools/refs/ or pass --photo PATH; source: {img.get('source', '?')})")
    h = sha256(p)
    if h != img.get('sha256'): print(f"warning: {p.name} sha256 {h[:12]}… differs from the trace file's {str(img.get('sha256'))[:12]}…: not the photo it was traced on", file=sys.stderr)
    return p


def cmd_show(a):
    from PIL import Image, ImageDraw
    t = load_trace(a.id)
    views = [v for v in t['views'] if not a.view or v['name'] == a.view]
    if not views: sys.exit(f"no view '{a.view}': " + ', '.join(v['name'] for v in t['views']))
    if a.photo and len(views) > 1: sys.exit('--photo needs --view (one photo per view)')
    COL = {'bunker': (255, 220, 40), 'green': (40, 230, 255)}
    for v in views:
        img = v['image']; p = find_photo(img, a.photo); c = img.get('crop') or [0, 0, img['w'], img['h']]
        s = max(1, round(800 / max(c[2] - c[0], c[3] - c[1]) * 2) / 2)
        im = Image.open(p).convert('RGB').crop(tuple(c)); im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS); d = ImageDraw.Draw(im)
        X = lambda q: ((q[0] - c[0]) * s, (q[1] - c[1]) * s)
        for o in t.get('outlines', []):
            if o.get('view', t['views'][0]['name']) != v['name']: continue
            P = [X(q) for q in o['px']]
            d.line(P + [P[0]], fill=COL.get(o['kind'], (255, 255, 255)), width=2)
            cu = sum(q[0] for q in P) / len(P); cv = sum(q[1] for q in P) / len(P); d.text((cu - 10, cv - 6), o['name'], fill=(255, 255, 255))
        for k in v['camera']['constraints']:
            dots = [k[n] for n in ('px', 'base', 'top') if n in k] + [q for n in ('a', 'b') if n in k for q in k[n]]
            for q in dots: x, y = X(q); d.ellipse((x - 4, y - 4, x + 4, y + 4), outline=(255, 40, 40), width=2)
            if 'base' in k: d.line([X(k['base']), X(k['top'])], fill=(255, 40, 40), width=2)
            for n in ('a', 'b'):
                if n in k: d.line([X(k[n][0]), X(k[n][1])], fill=(255, 40, 40), width=2)
            if 'landmark' in k or 'name' in k:
                x, y = X(k['px'] if 'px' in k else k.get('base', [0, 0])); d.text((x + 6, y - 12), k.get('landmark') or k.get('name', ''), fill=(255, 120, 120))
        out = Path(a.out) if a.out and len(views) == 1 else OUT / f"{a.id}-trace-{v['name']}.png"
        out.parent.mkdir(parents=True, exist_ok=True); im.save(out); print(out)


def cmd_hash(a):
    from PIL import Image
    p = Path(a.photo); w, h = Image.open(p).size
    print(json.dumps({'file': p.name, 'w': w, 'h': h, 'sha256': sha256(p)}))


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0], formatter_class=argparse.RawDescriptionHelpFormatter, epilog=__doc__.split('\n', 2)[2])
    sp = ap.add_subparsers(dest='cmd', required=True)
    g = sp.add_parser('grid'); g.add_argument('photo'); g.add_argument('box'); g.add_argument('--zoom', type=int, default=4); g.add_argument('--bright', type=float, default=1.5); g.add_argument('--out')
    f = sp.add_parser('fill'); f.add_argument('photo'); f.add_argument('seed'); f.add_argument('--tol', type=float, default=45); f.add_argument('--eps', type=float, default=1.0)
    s = sp.add_parser('show'); s.add_argument('id'); s.add_argument('--view'); s.add_argument('--photo'); s.add_argument('--out')
    h = sp.add_parser('hash'); h.add_argument('photo')
    a = ap.parse_args(); need_pil()
    {'grid': cmd_grid, 'fill': cmd_fill, 'show': cmd_show, 'hash': cmd_hash}[a.cmd](a)


if __name__ == '__main__':
    main()
