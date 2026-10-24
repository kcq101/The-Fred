#!/usr/bin/env python3
"""render.py: headless-Chromium screenshots of one hole in the REAL game (three.js, terrain, trees, water, HUD).

    python3 tests/tools/render.py <id> [view ...] [--out DIR] [--size 390x844] [--timeout 180] [--scale 1]

views (default: tee bird approach)
    tee              the golfer's-eye aim view from the tee
    bird             bird's-eye (the HUD's button) from the tee;  bird=x,z  from that spot
    approach         aim view from 80 yd short of the pin, on the route;  approach=x,z  from that spot
    look=x,z,tx,tz   the aim view from (x,z) turned toward (tx,tz) instead of the pin (e.g. to look across the rough)
    green            the putting view, 8 yd from the pin on the tee side
    aerial           a drone's-eye view of the green complex with the HUD hidden: 83 yd short of the green on the line it is approached on, 27 yd up,
                     a 30° lens, 4:5 (the camera Riviera No. 6's aerial photo was taken from). For holes with no photo yet, and as the shot to look for
    ref              every reference photo's matched camera (docs/holes/trace/<id>.json, fitted by tests/tools/trace.js); ref=<view> for one.
                     The viewport takes the photo's shape, the HUD, ball and aim marks are hidden, and the traced outlines are drawn on top
                     (yellow: sand, cyan: green, where the photo has them). Writes <out>/<id>-ref-<view>.png. With the photo at hand
                     (tests/tools/refs/<image.file>, or --refs DIR) it also writes <id>-ref-<view>-pair.png: the photo beside the render,
                     both with the outlines, for the sign-off checklist. Pairs contain the photo, so they always go to tests/tools/out/
                     (git-ignored) whatever --out says; the render alone may go in the repo (--out docs/maps).

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
OUT_DEFAULT = Path(__file__).resolve().parent / 'out'


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
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0], epilog=__doc__.split('\n', 1)[1], formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('hole'); ap.add_argument('views', nargs='*')
    ap.add_argument('--js', action='append', help='a JS expression evaluated inside the game after the hole loads; its value is printed (debugging)')
    ap.add_argument('--out', default=str(OUT_DEFAULT))
    ap.add_argument('--size', default='390x844'); ap.add_argument('--timeout', type=int, default=180)
    ap.add_argument('--scale', type=float, default=1.0)
    ap.add_argument('--refs', default=str(Path(__file__).resolve().parent / 'refs'))
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
        page_uri = 'http://fred.local/index.html'   # a made-up origin, so the page can fetch its own files (assets/...) through the route below
        src = (ROOT / 'index.html').read_text(encoding='utf8')
        hook = 'window.__fred={'
        if src.count(hook) != 1: sys.exit('render.py: expected exactly one `window.__fred={` in index.html to hang the eval hook on')
        html = src.replace(hook, 'window.__ev=s=>eval(s);' + hook)
        draw = 'renderer.setRenderTarget(rt);renderer.render(scene,camera);'
        if html.count(draw) != 1: sys.exit('render.py: expected exactly one main render call in index.html to hang the camera hook on')
        html = html.replace(draw, 'if(window.__cam)window.__cam(camera);' + draw)
        def route(r):
            u = r.request.url
            if u == page_uri: return r.fulfill(status=200, content_type='text/html; charset=utf-8', body=html)
            if u == CDN: return r.fulfill(status=200, content_type='application/javascript', body=three)
            if u.startswith('http://fred.local/'):
                f = (ROOT / u[len('http://fred.local/'):].split('?')[0]).resolve()
                if f.is_file() and ROOT in f.parents:
                    import mimetypes
                    return r.fulfill(status=200, content_type=mimetypes.guess_type(f.name)[0] or 'application/octet-stream', body=f.read_bytes())
                return r.fulfill(status=404, body='')
            if u.startswith(('http://', 'https://')): return r.abort()      # fonts and the like: not needed, and unreachable anyway
            return r.continue_()
        ctx.route('**/*', route)
        page = ctx.new_page(); page.set_default_timeout(a.timeout * 1000)
        page.on('pageerror', lambda e: errors.append(f'pageerror: {e}'))
        page.on('console', lambda m: errors.append(f'console.{m.type}: {m.text}') if m.type in ('error','warning') and 'Failed to load resource' not in m.text else None)
        page.on('requestfailed', lambda r: errors.append(f'request failed: {r.url[:100]}') if 'fonts.g' not in r.url else None)   # the web fonts are aborted on purpose
        page.goto(page_uri)
        page.wait_for_function("typeof window.__ev === 'function'")
        ev = lambda s: page.evaluate('s => __ev(s)', s)
        idx = ev(f"HOLES.findIndex(h => h.id === '{a.hole}')")
        if idx < 0:
            sys.exit(f"unknown hole '{a.hole}'. Known: " + ', '.join(ev('HOLES.map(h => h.id)')))
        try: page.wait_for_function("__ev('NATURE.ok')", timeout=60000)   # the nature models (assets/nature) load at start-up
        except Exception: print('note: nature models did not load; rendering with the simple shapes', file=sys.stderr)
        ev('closeTitle()'); ev(f'loadHole({idx})')
        page.wait_for_function("['intro', 'aim'].includes(__ev('state'))")   # with FLYOVER off a hole opens straight on 'aim'
        ev('startPlay()')
        frames = lambda n=3: page.evaluate('n => new Promise(r => { const f = () => --n <= 0 ? r() : requestAnimationFrame(f); requestAnimationFrame(f); })', n)

        def place(x, z, zoom=0, tgt=None):
            """ball on the ground at (x,z), aim view re-aimed at the pin (or at tgt=(x,z)) and the camera snapped to where it settles (zoom 1 = bird's eye)"""
            aim = f"target.x={tgt[0]};target.z={tgt[1]};solveShot();" if tgt else ''
            ev(f"ball.p.set({x},H({x},{z})+R,{z});ball.v.set(0,0,0);ball.rolling=true;ballGroup.visible=true;setupAim();{aim}setZoom({zoom});zoomV={zoom};aimTarget(tP,tL);camPos.copy(tP);camLook.copy(tL)")
            frames()

        def measure():
            return page.evaluate("""() => { const s = __ev('screenOf(ballGroup.position)'), pin = __ev('screenOf(new THREE.Vector3(PIN.x,PIN_H,PIN.z))');
              const b = document.querySelector('.bottom'), hud = b && !b.hidden ? b.getBoundingClientRect().top : innerHeight;
              return { y: s.y, x: s.x, z: s.z, pinY: pin.y, pinOn: pin.z < 1 && pin.x > 0 && pin.x < innerWidth && pin.y > 0 && pin.y < innerHeight, vh: innerHeight, hud, safe: __ev('BALL_SAFE_PX'),
                       state: __ev('state'), d: Math.round(__ev('distToPin()')), lie: __ev("SP[lieNow()].name") }; }""")

        for js in a.js or []:
            print('js>', js[:80], '=>', ev(js))
        pin = ev('({x:PIN.x,z:PIN.z})'); tee_z = 0.0
        for v in views:
            name, _, arg = v.partition('=')
            xy = [float(t) for t in arg.split(',')] if arg and name != 'ref' else None
            if name == 'tee':
                place(0, 0)
            elif name == 'bird':
                place(*(xy or (0, 0)), zoom=1)
            elif name == 'approach':
                z = max(20.0, pin['z'] - 80.0) if pin['z'] > 100 else pin['z'] * 0.55
                place(*(xy or (ev(f'centerX({z})'), z)))
            elif name == 'look':
                if not xy or len(xy) != 4: sys.exit('look=x,z,tx,tz: the aim view from (x,z) turned toward (tx,tz)')
                place(xy[0], xy[1], tgt=xy[2:])
            elif name == 'green':
                import math
                l = math.hypot(pin['x'], pin['z']) or 1
                place(pin['x'] - 8 * pin['x'] / l, pin['z'] - 8 * pin['z'] / l)
            elif name == 'aerial':
                aerial_view(page, ev, frames, a, out, w, h)
                continue
            elif name == 'ref':
                ref_views(page, ev, frames, a, arg, out, w, h)
                continue
            else:
                sys.exit(f"unknown view '{v}': use tee, bird[=x,z], approach[=x,z], look=x,z,tx,tz, green, aerial or ref[=view]")
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


def ref_views(page, ev, frames, a, which, out, w0, h0):
    """matched-camera renders of the hole for each reference photo in its trace file"""
    import json
    tf = ROOT / 'docs' / 'holes' / 'trace' / f'{a.hole}.json'
    if not tf.exists(): sys.exit(f'no trace file {tf.relative_to(ROOT)}: trace the photo first (docs/ICONIC-HOLES.md §2, step 7)')
    T = json.loads(tf.read_text())
    views = [v for v in T['views'] if not which or v['name'] == which]
    if not views: sys.exit(f"no view '{which}' in {tf.name}: " + ', '.join(v['name'] for v in T['views']))
    ev("""window.__hideMarks=()=>{for(const o of [ballGroup,peg,shadow,spot,puttLine,guide,guideOut,tgtRing,tgtDot,landRing,trailMesh,arcLine])if(o)o.visible=false;};
          window.__cam=null;""")
    page.add_style_tag(content='body *{visibility:hidden!important}#c{visibility:visible!important}')
    for v in views:
        fit = v['camera'].get('fit')
        if not fit: sys.exit(f"view {v['name']} has no camera.fit: run node tests/tools/trace.js {a.hole} --write")
        img = v['image']; c = img.get('crop') or [0, 0, img['w'], img['h']]; W, H = c[2] - c[0], c[3] - c[1]
        k = 900 / H; vw, vh = round(W * k), 900
        page.set_viewport_size({'width': vw, 'height': vh}); frames(4)
        ev(f"""window.__cam=cam=>{{__hideMarks();cam.position.set({fit['pos'][0]},{fit['pos'][1]},{fit['pos'][2]});cam.up.set({fit['up'][0]},{fit['up'][1]},{fit['up'][2]});
              cam.lookAt({fit['look'][0]},{fit['look'][1]},{fit['look'][2]});cam.fov={fit['vfov']};cam.aspect=vw/vh;cam.updateProjectionMatrix();}};""")
        frames(6)
        # the traced outlines, projected through the game's camera onto the game's ground, and the photo's pixels scaled to the render
        outl = [o for o in T.get('outlines', []) if o.get('view', T['views'][0]['name']) == v['name']]
        proj = page.evaluate("""o => o.map(L => (L.hole || []).map(([x, z]) => { const s = __ev(`screenOf(new THREE.Vector3(${x},H(${x},${z}),${z}))`); return s.z < 1 ? [s.x, s.y] : null; }))""", outl)
        # each point constraint: where the photo has it, and where the game puts that ground point (a landmark at its solved position)
        lms = T.get('landmarks', {})
        pts = [(q['px'], q['at'][:2] if 'at' in q else lms.get(q['landmark'], {}).get('solved')) for q in v['camera']['constraints'] if q['type'] == 'point']
        pts = [(px, g) for px, g in pts if g]
        pproj = page.evaluate("""g => g.map(([x, z]) => { const s = __ev(`screenOf(new THREE.Vector3(${x},H(${x},${z}),${z}))`); return s.z < 1 ? [s.x, s.y] : null; })""", [g for _, g in pts])
        marks = [(px, q) for (px, _), q in zip(pts, pproj)]
        f = out / f"{a.hole}-ref-{v['name']}.png"
        page.screenshot(path=str(f))
        draw_ref(f, outl, proj, k, c, None, marks=marks)
        photo = Path(a.refs) / img['file']
        pair = ''
        if photo.exists():
            pf = OUT_DEFAULT / f"{a.hole}-ref-{v['name']}-pair.png"   # it holds the photo: always the git-ignored folder, whatever --out says
            pf.parent.mkdir(parents=True, exist_ok=True)
            draw_ref(f, outl, proj, k, c, photo, pf, marks=marks); pair = f'; with the photo -> {pf}'
        rms = fit.get('rms')
        print(f"ref {v['name']:8} camera at ({fit['pos'][0]:.1f}, {fit['pos'][1]:.1f}, {fit['pos'][2]:.1f}), fov {fit['vfov']:.1f}°" + (f", fit rms {rms:.1f} px" if rms is not None else '') +
              f"  ->  {f.relative_to(ROOT) if f.is_relative_to(ROOT) else f}{pair}")
    page.set_viewport_size({'width': w0, 'height': h0}); ev('window.__cam=null'); frames(3)


def aerial_view(page, ev, frames, a, out, w0, h0):
    """the green complex from where a drone would photograph it"""
    g = ev("(() => { const z0 = GREEN.z - 83, dx = centerX(GREEN.z) - centerX(z0), l = Math.hypot(dx, 83); return {gx: GREEN.x, gz: GREEN.z, gy: H(GREEN.x, GREEN.z), cx: GREEN.x - dx / l * 83, cz: GREEN.z - 83 / l * 83}; })()")
    ev("""window.__hideMarks=()=>{for(const o of [ballGroup,peg,shadow,spot,puttLine,guide,guideOut,tgtRing,tgtDot,landRing,trailMesh,arcLine])if(o)o.visible=false;};""")
    page.add_style_tag(content='body *{visibility:hidden!important}#c{visibility:visible!important}')
    page.set_viewport_size({'width': 720, 'height': 900}); frames(4)
    ev(f"""window.__cam=cam=>{{__hideMarks();cam.position.set({g['cx']},{g['gy'] + 27},{g['cz']});cam.up.set(0,1,0);cam.lookAt({g['gx']},{g['gy']},{g['gz']});
          cam.fov=30;cam.aspect=vw/vh;cam.updateProjectionMatrix();}};""")
    frames(6)
    f = out / f"{a.hole}-aerial.png"; page.screenshot(path=str(f))
    print(f"aerial    camera 83 yd short of the green, 27 yd up, 30° lens  ->  {f.relative_to(ROOT) if f.is_relative_to(ROOT) else f}")
    page.set_viewport_size({'width': w0, 'height': h0}); ev('window.__cam=null'); frames(3)


def draw_ref(render_png, outl, proj, k, crop, photo, pair_out=None, marks=()):
    """outlines on the render: the photo's traced pixels (solid lines) and the same outlines in hole coordinates seen by the game camera (pink dots);
    camera points and landmarks: where the photo has them (red rings) and where the game's ground puts them (pink crosses)"""
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        print('(Pillow not installed: outlines not drawn)'); return
    COL = {'bunker': (255, 214, 0), 'green': (0, 220, 255)}
    def overlay(im):
        d = ImageDraw.Draw(im)
        for o, P in zip(outl, proj):
            col = COL.get(o.get('kind'), (255, 255, 255))
            px = [((u - crop[0]) * k, (v - crop[1]) * k) for u, v in o['px']]
            d.line(px + [px[0]], fill=col, width=2)
            for q in P or []:
                if q: d.ellipse((q[0] - 1.5, q[1] - 1.5, q[0] + 1.5, q[1] + 1.5), fill=(255, 40, 160))
        for px, q in marks:
            x, y = (px[0] - crop[0]) * k, (px[1] - crop[1]) * k
            d.ellipse((x - 5, y - 5, x + 5, y + 5), outline=(255, 50, 50), width=2)
            if q: d.line([(q[0] - 5, q[1]), (q[0] + 5, q[1])], fill=(255, 40, 160), width=2); d.line([(q[0], q[1] - 5), (q[0], q[1] + 5)], fill=(255, 40, 160), width=2)
        return im
    r = Image.open(render_png).convert('RGB')
    if photo is None:
        overlay(r).save(render_png); return
    ph = Image.open(photo).convert('RGB').crop(tuple(crop)).resize(r.size, Image.LANCZOS)
    pair = Image.new('RGB', (r.width * 2 + 8, r.height), (20, 20, 20))
    pair.paste(overlay(ph), (0, 0)); pair.paste(r, (r.width + 8, 0)); pair.save(pair_out)


if __name__ == '__main__':
    main()
