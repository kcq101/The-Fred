#!/usr/bin/env python3
"""render.py: headless-Chromium screenshots of one hole in the REAL game (three.js, terrain, trees, water, HUD).

    python3 tests/tools/render.py <id> [view ...] [--out DIR] [--size 390x844] [--timeout 180] [--scale 1]

views (default: tee bird approach)
    tee              the golfer's-eye aim view from the tee
    bird             bird's-eye (the HUD's button) from the tee;  bird=x,z  from that spot
    approach         aim view from 80 yd short of the pin, on the route;  approach=x,z  from that spot
    green            the putting view, 8 yd from the pin on the tee side

How it works: the game loads three.js r128 from a CDN, which the sandbox cannot reach, so the request is routed to a local copy (fetched once into
tests/tools/.cache/ with a sparse clone of mrdoob/three.js at tag r128; falls back to `npm pack three@0.128.0`). Chromium runs with software WebGL.
The game's code lives inside one closure, so `window.__ev = s => eval(s)` is injected INTO that closure, in the copy of index.html served to the browser
(the file in the repo is untouched): scripts can then read and call the game's own names (HOLES, loadHole, ball, camera...).
For each view the ball is placed, the aim camera is snapped to where it settles, a screenshot is saved to <out>/<id>-<view>.png (default
tests/tools/out/, not committed) and one line is printed: where the ball is on screen (y in px of the viewport height) against the top of the bottom HUD
(the lie caption and club row), so "the ball is hidden behind the HUD" shows up as a number, not a hunch.

Needs: python3 with playwright and its chromium (`pip install playwright && playwright install chromium`), git (or npm) for the one-time three.js fetch.
Software WebGL is slow: a hole takes 10-60 s to build. Nothing here has run on a phone."""
import argparse, os, re, shutil, subprocess, sys, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CACHE = Path(__file__).resolve().parent / '.cache'
CDN = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'


def three_js() -> Path:
    """a local three.min.js r128, fetched on first use"""
    dst = CACHE / 'three.min.js'
    if dst.exists() and dst.stat().st_size > 100_000:
        return dst
    CACHE.mkdir(parents=True, exist_ok=True)
    tmp = Path(tempfile.mkdtemp(prefix='three-'))
    try:
        try:
            clone = tmp / 'three.js'
            subprocess.run(['git', 'clone', '--depth', '1', '--branch', 'r128', '--filter=blob:none', '--sparse',
                            'https://github.com/mrdoob/three.js', str(clone)], check=True, capture_output=True, timeout=300)
            subprocess.run(['git', '-C', str(clone), 'sparse-checkout', 'set', 'build'], check=True, capture_output=True, timeout=300)
            shutil.copy(clone / 'build' / 'three.min.js', dst)
        except Exception as e:
            print(f'sparse clone failed ({e}); trying npm pack three@0.128.0', file=sys.stderr)
            subprocess.run(['npm', 'pack', 'three@0.128.0', '--silent'], cwd=tmp, check=True, capture_output=True, timeout=300)
            subprocess.run(['tar', '-xzf', next(tmp.glob('three-*.tgz')).name, 'package/build/three.min.js'], cwd=tmp, check=True)
            shutil.copy(tmp / 'package' / 'build' / 'three.min.js', dst)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    return dst


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('hole'); ap.add_argument('views', nargs='*')
    ap.add_argument('--out', default=str(Path(__file__).resolve().parent / 'out'))
    ap.add_argument('--size', default='390x844'); ap.add_argument('--timeout', type=int, default=180)
    ap.add_argument('--scale', type=float, default=1.0)
    a = ap.parse_args()
    views = a.views or ['tee', 'bird', 'approach']
    w, h = (int(v) for v in a.size.lower().split('x'))
    out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
    three = three_js().read_bytes()

    from playwright.sync_api import sync_playwright
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        ctx = browser.new_context(viewport={'width': w, 'height': h}, device_scale_factor=a.scale, is_mobile=True, has_touch=True)
        page_uri = (ROOT / 'index.html').as_uri()
        src = (ROOT / 'index.html').read_text(encoding='utf8')
        hook = 'window.__fred={'
        if src.count(hook) != 1: sys.exit('render.py: expected exactly one `window.__fred={` in index.html to hang the eval hook on')
        html = src.replace(hook, 'window.__ev=s=>eval(s);' + hook)
        def route(r):
            u = r.request.url
            if u == page_uri: return r.fulfill(status=200, content_type='text/html; charset=utf-8', body=html)
            if u == CDN: return r.fulfill(status=200, content_type='application/javascript', body=three)
            if u.startswith(('http://', 'https://')): return r.abort()      # fonts and the like: not needed, and unreachable anyway
            return r.continue_()
        ctx.route('**/*', route)
        page = ctx.new_page(); page.set_default_timeout(a.timeout * 1000)
        page.on('pageerror', lambda e: errors.append(f'pageerror: {e}'))
        page.on('console', lambda m: errors.append(f'console.{m.type}: {m.text}') if m.type == 'error' and 'Failed to load resource' not in m.text else None)
        page.on('requestfailed', lambda r: errors.append(f'request failed: {r.url[:100]}') if 'fonts.g' not in r.url else None)   # the web fonts are aborted on purpose
        page.goto(page_uri)
        page.wait_for_function("typeof window.__ev === 'function'")
        ev = lambda s: page.evaluate('s => __ev(s)', s)
        idx = ev(f"HOLES.findIndex(h => h.id === '{a.hole}')")
        if idx < 0:
            sys.exit(f"unknown hole '{a.hole}'. Known: " + ', '.join(ev('HOLES.map(h => h.id)')))
        ev('closeTitle()'); ev(f'loadHole({idx})')
        page.wait_for_function("__ev('state') === 'intro'")
        ev('startPlay()')
        frames = lambda n=3: page.evaluate('n => new Promise(r => { const f = () => --n <= 0 ? r() : requestAnimationFrame(f); requestAnimationFrame(f); })', n)

        def place(x, z, zoom=0):
            """ball on the ground at (x,z), aim view re-aimed at the pin and the camera snapped to where it settles (zoom 1 = bird's eye)"""
            ev(f"ball.p.set({x},H({x},{z})+R,{z});ball.v.set(0,0,0);ball.rolling=true;ballGroup.visible=true;setupAim();setZoom({zoom});zoomV={zoom};aimTarget(tP,tL);camPos.copy(tP);camLook.copy(tL)")
            frames()

        def measure():
            return page.evaluate("""() => { const s = __ev('screenOf(ballGroup.position)'), pin = __ev('screenOf(new THREE.Vector3(PIN.x,PIN_H,PIN.z))');
              const b = document.querySelector('.bottom'), hud = b && !b.hidden ? b.getBoundingClientRect().top : innerHeight;
              return { y: s.y, x: s.x, z: s.z, pinY: pin.y, pinOn: pin.z < 1 && pin.x > 0 && pin.x < innerWidth && pin.y > 0 && pin.y < innerHeight, vh: innerHeight, hud, safe: __ev('BALL_SAFE_PX'),
                       state: __ev('state'), d: Math.round(__ev('distToPin()')), lie: __ev("SP[lieNow()].name") }; }""")

        pin = ev('({x:PIN.x,z:PIN.z})'); tee_z = 0.0
        for v in views:
            name, _, arg = v.partition('=')
            xy = [float(t) for t in arg.split(',')] if arg else None
            if name == 'tee':
                place(0, 0)
            elif name == 'bird':
                place(*(xy or (0, 0)), zoom=1)
            elif name == 'approach':
                z = max(20.0, pin['z'] - 80.0) if pin['z'] > 100 else pin['z'] * 0.55
                place(*(xy or (ev(f'centerX({z})'), z)))
            elif name == 'green':
                import math
                l = math.hypot(pin['x'], pin['z']) or 1
                place(pin['x'] - 8 * pin['x'] / l, pin['z'] - 8 * pin['z'] / l)
            else:
                sys.exit(f"unknown view '{v}': use tee, bird[=x,z], approach[=x,z] or green")
            m = measure()
            f = out / f"{a.hole}-{name}{'-' + arg.replace(',', '_') if arg else ''}.png"
            page.screenshot(path=str(f))
            where = 'behind the camera' if m['z'] >= 1 else f"y={m['y']:.0f}px of {m['vh']}px"
            clear = m['hud'] - m['y']
            verdict = 'off screen' if m['z'] >= 1 or m['y'] > m['vh'] else ('clear of the HUD' if clear >= 0 else f'UNDER THE HUD by {-clear:.0f}px')
            print(f"{name:9} ball {where}; bottom HUD top at {m['hud']:.0f}px (game's safe band {m['vh'] - m['safe']:.0f}px): {verdict} ({clear:+.0f}px)"
                  f"; pin {'in view' if m['pinOn'] else 'OUT of view'}; {m['lie']}, {m['d']} yd to pin  ->  {f.relative_to(ROOT) if f.is_relative_to(ROOT) else f}")
        browser.close()
    if errors:
        print(f'\n{len(errors)} page error(s):', *sorted(set(errors))[:8], sep='\n  ')


if __name__ == '__main__':
    main()
