#!/usr/bin/env python3
"""lidar.py: bare-earth lidar (USGS 3DEP 1 m) into hole coordinates. docs/ICONIC-HOLES.md §2.1 and §3.2 item 1.

Turns what the Riviera No. 6 review did by hand into one tool: find the tile from a map pin, find the tee and the hole's direction, then read
the bunkers, the water, any islands, the heights along the hole and the green's plane straight into hole coordinates (`pts`), before a photo
is opened. The photo then only refines edges. The tile is never committed: it lives in tests/tools/refs/ (git-ignored) and the trace file
records where it came from.

    python3 tests/tools/lidar.py fetch --pin LAT,LON [--download]
        Asks the National Map API for the 1 m DEM tiles covering the pin, newest first, and (with --download) saves the newest into
        tests/tools/refs/. Needs tnmaccess.nationalmap.gov and prd-tnm.s3.amazonaws.com on the network allowlist.

    python3 tests/tools/lidar.py look <tile.tif> --pin LAT,LON [--r 200] [--rings 110,125,140] [--tee LAT,LON]
        Shaded relief around the pin with distance rings (metres) and flat pads (slope under 1.2 %) picked out, to find the tee and the
        hole's direction -> tests/tools/out/<tile>-look.png. With --tee, prints the tee->pin bearing and distance.

    python3 tests/tools/lidar.py outlines <id> [--write] [--snippet] [--png] [--json]
        Reads the hole's frame from docs/holes/trace/<id>.json (`lidar.frame`, below), samples the tile on the hole's grid and reports:
          - sand: ground more than `sand.below` m under its `sand.sigma` m gaussian-smoothed surface, in blobs of at least `sand.min_m2` m²
          - water: ground at the water level (hydro-flattened lakes are one flat level; found automatically, or `water.level`)
          - islands: land the water surrounds
          - the heights along the hole's line (`profile`), in game yards relative to the pin, and the plane of the green
            (`plane`: over the trace file's green outline, else over the first island shrunk by 2 yd)
        Each outline: width x depth, area, centroid, and its overlap (IoU) with the hole as it is now (sand vs SAND, water vs WATER, read off
        the game's real S(x,z) through tests/harness.js). --snippet prints `pts:[[x,z],...]`; --write stores everything under `lidar` in the
        trace file (the hand-written fields there are kept); --png draws it -> tests/tools/out/<id>-lidar.png (shaded relief, not the photo:
        safe to look at, but it is derived from the tile, so it stays out of the repo too).

    python3 tests/tools/lidar.py build <id> [--corridor 40] [--bunker-max 1.2] [--lip 0.25] [--profile shore|wall] [--grid 10] [--json]
        The hole's lidar half as code for its entry in index.html, from the same read as `outlines`: `bunkers` (each closed hollow
        within --corridor yd of the line tee -> pin and on, depth from the lidar capped at --bunker-max yd), `water` (each lake that
        reaches the corridor, its islands, its level against the tee), the heights along the line as `ramp` features (the profile
        simplified to 0.25 yd, from the tee's height), and the green's `tilt`. With --grid STEP, also a `grid` feature: the ground across
        the hole relative to the line through the tee and pin, every STEP yd (bunkers and water filled in, smoothed to the spacing), for the
        sideways banks and falls the ramps cannot carry. Paste, then run validate.js: a hollow that belongs to a
        neighbouring hole, or a depth the hop guard refuses, is decided there. The frame's grid must reach the tee (z 0).

    python3 tests/tools/lidar.py fit <id> [--write]
        Riviera's `lidar.fit`: matches the trace file's traced bunker outlines (their `hole` points with `exaggerate` and `rescale` undone,
        so as the photos measured them) to the lidar's sand, solving centre, bearing and scale. The scale it finds is the trace file's
        `rescale.factor` (a size the photos got wrong); the bearing and centre are the frame's.

    python3 tests/tools/lidar.py match <id> --view NAME --outline NAME [--clip 26] [--write]
        For a near-vertical aerial: fits the outline traced on it (photo pixels; an island, say) to the lidar's land by a similarity
        (scale, rotation, shift: a camera looking straight down), maximising their overlap inside a circle of --clip yd round the lidar
        island, so a walkway or shore cut off at the photo's edge counts the same in both. Prints the fit, the overlap, and `point`
        constraints (photo pixel -> hole yards) for trace.js; --write stores them in the view's camera.constraints (replacing earlier
        ones marked "from": "lidar match") and the fit under lidar.match.<view>.

    python3 tests/tools/lidar.py selftest
        A synthetic tile (a tilted lake with an island, a pot bunker, a plane) through the whole chain; exits non-zero if anything is off.

The frame (`lidar.frame` in the trace file):
    {"tile": ["<file in tests/tools/refs/>", ...],          one or more tiles (same CRS); the window is mosaicked
     "anchor": {"latlon": [lat, lon], "at": [x, z]},        a map pin and where it sits in the hole (Riviera: the middle bunker at (0, 144))
     "bearing_deg": 129.9,                                  compass direction of +z (down the hole), degrees clockwise from grid north
     "yd_per_m": 0.755,                                     game yards per real metre: 1.0936 x the hole's length scale
     "grid": {"x": [-40, 40], "z": [100, 200], "step": 0.5} the part of the hole to read, in game yards
     "pin": [x, z],                                         the pin, for the profile (default: the anchor's `at`)
     "island": {"neck_m": 4},                              land joined to the shore by a neck narrower than this is still an island
     "sand": {"below": 0.25, "sigma": 6, "min_m2": 4, "shore_m": 3, "grow": 0.4, "grow_m": 1.5, "closed_m": 0.15}   (a blob must hold closed_m of water, or it is a valley; grown out to grow x below, at most grow_m past the core; no sand is looked for within shore_m of water: a bank reads as a hollow), "water": {"level": null, "tol": 0.05, "open_m": 1.5}, "smooth": 2.5}
Hole coordinates as the engine has them: yards, the tee at the origin, +z down the hole, +x to screen-left.
Needs Python 3 with numpy, scipy, scikit-image, tifffile and pyproj (pip install --break-system-packages numpy scipy scikit-image tifffile pyproj).
"""
import json, math, os, subprocess, sys, urllib.parse, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..'))
REFS = os.path.join(HERE, 'refs')
OUT = os.path.join(HERE, 'out')
TRACE_DIR = os.path.join(ROOT, 'docs', 'holes', 'trace')
TNM = 'https://tnmaccess.nationalmap.gov/api/v1/products'
DEFAULTS = {'island': {'neck_m': 4.0}, 'sand': {'below': 0.25, 'sigma': 6.0, 'min_m2': 4.0, 'shore_m': 3.0, 'grow': 0.4, 'grow_m': 1.5, 'closed_m': 0.15}, 'water': {'level': None, 'tol': 0.05, 'min_m2': 200.0, 'open_m': 1.5}, 'smooth': 2.5}


def die(msg, code=2):
    print(msg, file=sys.stderr)
    sys.exit(code)


def need():
    try:
        import numpy, scipy, skimage, tifffile, pyproj  # noqa: F401
    except ImportError as e:
        die(f'{e.name} is missing: pip install --break-system-packages numpy scipy scikit-image tifffile pyproj')


def latlon(s):
    try:
        a, b = (float(v) for v in str(s).split(','))
    except ValueError:
        die(f"bad lat,lon '{s}'")
    if not (-90 <= a <= 90 and -180 <= b <= 180):
        die(f"bad lat,lon '{s}'")
    return a, b


def flags(argv):
    pos, fl = [], {}
    i = 0
    while i < len(argv):
        a = argv[i]
        if a.startswith('--'):
            k, eq, v = a[2:].partition('=')
            if not eq and i + 1 < len(argv) and not argv[i + 1].startswith('--') and k in ('pin', 'tee', 'r', 'rings', 'view', 'outline', 'clip', 'corridor', 'bunker-max', 'lip', 'profile', 'grid'):
                v = argv[i + 1]; i += 1
            fl[k] = v if (eq or v) else True
        else:
            pos.append(a)
        i += 1
    return pos, fl


# ---------------------------------------------------------------- tiles
class Tile:
    """A GeoTIFF elevation tile: its grid (north-up, square pixels) and CRS. Values are read once, lazily."""

    def __init__(self, path):
        import tifffile
        self.path = path
        with tifffile.TiffFile(path) as t:
            p = t.pages[0]
            tags = {k.name: k.value for k in p.tags.values()}
            tie, sc = tags.get('ModelTiepointTag'), tags.get('ModelPixelScaleTag')
            if not tie or not sc:
                die(f'{path}: no georeferencing (ModelTiepointTag / ModelPixelScaleTag)')
            self.x0, self.y0, self.res = tie[3] - tie[0] * sc[0], tie[4] + tie[1] * sc[1], sc[0]
            if abs(sc[0] - sc[1]) > 1e-9:
                die(f'{path}: pixels are not square')
            gk = tags.get('GeoKeyDirectoryTag') or ()
            keys = {gk[i]: gk[i + 3] for i in range(4, len(gk), 4)}
            self.epsg = keys.get(3072) or keys.get(2048)
            if not self.epsg:
                die(f'{path}: no EPSG code in its GeoKeys')
            nd = tags.get('GDAL_NODATA')
            self.nodata = float(str(nd).strip('\x00 ')) if nd not in (None, '') else None
            self.shape = p.shape
        self._z = None

    @property
    def z(self):
        if self._z is None:
            import numpy as np, tifffile
            z = tifffile.imread(self.path).astype(np.float32)
            bad = z < -1000
            if self.nodata is not None:
                bad |= z == self.nodata
            z[bad] = np.nan
            self._z = z
        return self._z

    def covers(self, e, n):
        r, c = (self.y0 - n) / self.res, (e - self.x0) / self.res
        return 0 <= r < self.shape[0] and 0 <= c < self.shape[1]


class Mosaic:
    def __init__(self, paths):
        self.tiles = [Tile(p) for p in paths]
        if len({t.epsg for t in self.tiles}) > 1:
            die('tiles are in different CRSs: ' + ', '.join(f'{os.path.basename(t.path)} EPSG:{t.epsg}' for t in self.tiles))
        self.epsg = self.tiles[0].epsg

    def sample(self, E, N):
        """bilinear heights at arrays of easting/northing (NaN off every tile)"""
        import numpy as np
        out = np.full(np.shape(E), np.nan, dtype=np.float64)
        for t in self.tiles:
            c = (np.asarray(E) - t.x0) / t.res - 0.5
            r = (t.y0 - np.asarray(N)) / t.res - 0.5
            ok = (c >= 0) & (r >= 0) & (c < t.shape[1] - 1) & (r < t.shape[0] - 1) & np.isnan(out)
            if not ok.any():
                continue
            c0, r0 = np.floor(c[ok]).astype(int), np.floor(r[ok]).astype(int)
            fc, fr = c[ok] - c0, r[ok] - r0
            z = t.z
            v = (z[r0, c0] * (1 - fc) * (1 - fr) + z[r0, c0 + 1] * fc * (1 - fr) + z[r0 + 1, c0] * (1 - fc) * fr + z[r0 + 1, c0 + 1] * fc * fr)
            out[ok] = v
        return out

    def to_xy(self, lat, lon):
        import pyproj
        tr = pyproj.Transformer.from_crs(4326, int(self.epsg), always_xy=True)
        return tr.transform(lon, lat)

    def window(self, e, n, r):
        """the raw grid (1 m) within r of a point, north up: (z, x0, y0, res)"""
        import numpy as np
        res = self.tiles[0].res
        xs = e - r + res * (np.arange(int(2 * r / res)) + 0.5)
        ys = n + r - res * (np.arange(int(2 * r / res)) + 0.5)
        X, Y = np.meshgrid(xs, ys)
        return self.sample(X, Y), xs, ys


# ---------------------------------------------------------------- the hole's frame
class Frame:
    """UTM <-> hole coordinates: +z along bearing_deg, +x to its left, yd_per_m game yards per metre, anchor at `at`"""

    def __init__(self, A, at, bearing_deg, yd_per_m):
        self.A, self.at, self.b, self.s = A, at, bearing_deg, yd_per_m
        b = math.radians(bearing_deg)
        self.fwd = (math.sin(b), math.cos(b))
        self.left = (-math.cos(b), math.sin(b))

    def to_hole(self, E, N):
        dE, dN = E - self.A[0], N - self.A[1]
        return (self.at[0] + self.s * (dE * self.left[0] + dN * self.left[1]), self.at[1] + self.s * (dE * self.fwd[0] + dN * self.fwd[1]))

    def to_utm(self, x, z):
        u, v = (x - self.at[0]) / self.s, (z - self.at[1]) / self.s
        return (self.A[0] + u * self.left[0] + v * self.fwd[0], self.A[1] + u * self.left[1] + v * self.fwd[1])


def bearing(a, b):
    return (math.degrees(math.atan2(b[0] - a[0], b[1] - a[1])) + 360) % 360


# ---------------------------------------------------------------- reading the land
def grid(frame, M, g):
    import numpy as np
    st = g.get('step', 0.5)
    xs = np.arange(g['x'][0], g['x'][1] + 1e-9, st)
    zs = np.arange(g['z'][0], g['z'][1] + 1e-9, st)
    X, Z = np.meshgrid(xs, zs)
    E, N = frame.to_utm(X, Z)
    return xs, zs, X, Z, M.sample(E, N)


def water_level(H, tol):
    """hydro-flattened water is one flat level: the lowest large patch of exactly flat ground"""
    import numpy as np
    gy, gx = np.gradient(H)
    flat = (np.abs(gx) < 1e-4) & (np.abs(gy) < 1e-4) & np.isfinite(H)
    if flat.sum() < 50:
        return None
    vals = np.round(H[flat] / tol) * tol
    u, cnt = np.unique(vals, return_counts=True)
    big = u[cnt >= max(50, 0.2 * cnt.max())]
    return float(big.min())


def blobs(mask, min_cells, keep_border=True):
    import numpy as np
    from scipy import ndimage
    lab, n = ndimage.label(mask)
    out = []
    for i in range(1, n + 1):
        m = lab == i
        if m.sum() < min_cells:
            continue
        if not keep_border and (m[0].any() or m[-1].any() or m[:, 0].any() or m[:, -1].any()):
            continue
        out.append(m)
    out.sort(key=lambda m: -m.sum())
    return out


def outline(m, xs, zs, tol):
    """the outline of a mask as hole points, simplified to within tol yd, counter-clockwise, not closed"""
    import numpy as np
    from skimage import measure
    pad = np.pad(m.astype(float), 1)
    cs = measure.find_contours(pad, 0.5)
    c = max(cs, key=len)
    c = measure.approximate_polygon(c, tolerance=tol / (xs[1] - xs[0]))
    st = xs[1] - xs[0]
    pts = [[round(float(xs[0] + (q[1] - 1) * st), 1), round(float(zs[0] + (q[0] - 1) * st), 1)] for q in c[:-1]]
    a = sum(p[0] * q[1] - q[0] * p[1] for p, q in zip(pts, pts[1:] + pts[:1]))
    return pts if a > 0 else pts[::-1]


def describe(m, X, Z, st):
    return {'width': round(float(X[m].max() - X[m].min() + st), 1), 'depth': round(float(Z[m].max() - Z[m].min() + st), 1),
            'area': round(float(m.sum() * st * st), 1), 'centroid': [round(float(X[m].mean()), 1), round(float(Z[m].mean()), 1)]}


def poly_mask(pts, X, Z):
    from matplotlib.path import Path
    import numpy as np
    return Path(np.asarray(pts)).contains_points(np.c_[X.ravel(), Z.ravel()]).reshape(X.shape)


def plane(H, m, X, Z):
    import numpy as np
    A = np.c_[X[m], Z[m], np.ones(m.sum())]
    c, *_ = np.linalg.lstsq(A, H[m], rcond=None)
    return c  # metres per game yard in x and z, and the offset


def game_surfaces(hid, xs, zs):
    """the hole's S(x,z) on the same grid, through the game's own terrain code (tests/harness.js): names -> boolean masks"""
    import numpy as np
    js = f"""
const {{loadCourse}}=require({json.dumps(os.path.join(ROOT, 'tests', 'harness'))});const c=loadCourse();
const i=c.HOLES.findIndex(h=>h.id==={json.dumps(hid)});if(i<0){{console.error('unknown hole');process.exit(3);}}c.prepHole(i);
const xs={json.dumps([float(x) for x in xs])},zs={json.dumps([float(z) for z in zs])};const o=[];
for(const z of zs){{let r='';for(const x of xs)r+=String.fromCharCode(48+c.S(x,z));o.push(r);}}
console.log(JSON.stringify({{names:Object.keys(c.SP).map(k=>c.SP[k].name),rows:o}}));"""
    r = subprocess.run(['node', '-e', js], capture_output=True, text=True, cwd=ROOT)
    if r.returncode:
        die(f'could not read the hole from index.html: {r.stderr.strip()}')
    d = json.loads(r.stdout)
    codes = np.array([[ord(ch) - 48 for ch in row] for row in d['rows']])
    alias = {'Green': 'GREENS', 'Bunker': 'SAND', 'Pine straw': 'PINE', 'Waste area': 'WASTE'}  # display names -> the SURF names in index.html
    return {alias.get(n, n.upper()): codes == i for i, n in enumerate(d['names'])}


def iou(a, b):
    u = (a | b).sum()
    return round(float((a & b).sum() / u), 2) if u else None


# ---------------------------------------------------------------- trace file
def load_trace(hid, must=True):
    f = os.path.join(TRACE_DIR, f'{hid}.json')
    if not os.path.exists(f):
        if must:
            die(f'no trace file {os.path.relpath(f, ROOT)}: write one with a `lidar.frame` first (see this file\'s header)')
        return None, f
    with open(f) as fh:
        return json.load(fh), f


def save_trace(T, f):
    """the same layout trace.js writes: short number lists on one line, and each list of points on one line"""
    import re
    txt = json.dumps(T, indent=2, ensure_ascii=False)
    txt = re.sub(r'\[\s+(-?[\d.e-]+)(,\s+-?[\d.e-]+)*\s+\]', lambda m: re.sub(r'\s+', '', m.group(0)), txt)
    txt = re.sub(r'\[\s+(\[[-\d.,e]+\],?\s+)+\]', lambda m: re.sub(r'\s+', '', m.group(0)), txt)
    with open(f, 'w') as fh:
        fh.write(txt + '\n')


def frame_of(T, f):
    L = (T or {}).get('lidar') or {}
    F = L.get('frame')
    if not F:
        die(f'{os.path.relpath(f, ROOT)}: no `lidar.frame` (tile, anchor, bearing_deg, yd_per_m, grid): see this file\'s header')
    tiles = [p if os.path.isabs(p) else os.path.join(REFS, p) for p in (F['tile'] if isinstance(F['tile'], list) else [F['tile']])]
    missing = [p for p in tiles if not os.path.exists(p)]
    if missing:
        die('lidar tile not here: ' + ', '.join(os.path.relpath(p, ROOT) for p in missing) +
            f"\n  fetch it: python3 tests/tools/lidar.py fetch --pin {','.join(map(str, F['anchor']['latlon']))} --download")
    M = Mosaic(tiles)
    A = M.to_xy(*F['anchor']['latlon']) if 'latlon' in F['anchor'] else tuple(F['anchor']['utm'])
    cfg = {k: dict(DEFAULTS[k], **F.get(k, {})) if isinstance(DEFAULTS[k], dict) else F.get(k, DEFAULTS[k]) for k in DEFAULTS}
    return M, Frame(A, F['anchor']['at'], F['bearing_deg'], F['yd_per_m']), F, cfg


# ---------------------------------------------------------------- outlines
def read_hole(hid, T, f, compare=True):
    import numpy as np
    from scipy import ndimage
    M, fr, F, cfg = frame_of(T, f)
    g = F['grid']
    st = g.get('step', 0.5)
    xs, zs, X, Z, H = grid(fr, M, g)
    if np.isnan(H).mean() > 0.5:
        die('most of the grid is off the tile: check the anchor and grid, or add the neighbouring tile')
    cells = lambda m2: m2 * (fr.s / st) ** 2  # noqa: E731  (square metres -> grid cells)
    sig = cfg['sand']['sigma'] * fr.s / st
    Hf = np.where(np.isnan(H), np.nanmedian(H), H)
    lvl = cfg['water']['level']
    if lvl is None:
        lvl = water_level(Hf, cfg['water']['tol'])
    wet = (Hf <= lvl + cfg['water']['tol']) if lvl is not None else np.zeros_like(Hf, bool)
    ro = max(1, int(round(cfg['water']['open_m'] / 2 * fr.s / st)))   # no water narrower than open_m: a slot that thin is noise, and a hole with a
    wet = ndimage.binary_opening(wet, structure=np.hypot(*np.mgrid[-ro:ro + 1, -ro:ro + 1]) <= ro)   # bulkhead (`wall`) would make it a trench
    waters = blobs(wet, cells(cfg['water']['min_m2']))
    wet = np.zeros_like(wet) if not waters else np.any(waters, axis=0)
    # sand: below the smoothed land; water and its banks excluded (a lake shore would read as a depression)
    w = (~wet).astype(float)  # smoothed over land only (normalised convolution): a lake beside a bunker must not pull its surroundings down
    smooth = ndimage.gaussian_filter(Hf * w, sig) / np.maximum(ndimage.gaussian_filter(w, sig), 1e-6)
    near_water = ndimage.binary_dilation(wet, iterations=max(1, int(round(cfg['sand']['shore_m'] * fr.s / st))))
    dip = smooth - Hf
    core = ndimage.binary_opening((dip > cfg['sand']['below']) & ~near_water)
    # hysteresis: grow each core out to where the ground is still `grow` x the threshold below its surroundings (a gaussian of a small
    # bowl dips with it, so the core alone is smaller than the sand)
    lab, _ = ndimage.label((dip > cfg['sand']['below'] * cfg['sand']['grow']) & ~near_water)
    reach = ndimage.binary_dilation(core, iterations=max(1, int(round(cfg['sand']['grow_m'] * fr.s / st))))
    sand = (np.isin(lab, np.unique(lab[core & (lab > 0)])) & reach) if core.any() else core   # at most grow_m past the core: a valley is not a bunker
    # a bunker is a closed hollow (it holds water); a valley or the foot of a bank drains. Fill the sinks and keep the blobs that hold closed_m
    from skimage.morphology import reconstruction
    seed = Hf.copy(); seed[1:-1, 1:-1] = Hf.max()
    held = reconstruction(seed, Hf, method='erosion') - Hf
    sands = [m for m in blobs(sand, cells(cfg['sand']['min_m2'])) if held[m].max() >= cfg['sand']['closed_m']]
    sand = np.any(sands, axis=0) if sands else np.zeros_like(sand)
    land = ~wet
    # islands: land the water surrounds once necks narrower than island.neck_m (a walkway, a causeway) are cut; each grown back to its shore
    islands, necks = [], []
    if waters:
        r = max(1, int(round(cfg['island']['neck_m'] / 2 * fr.s / st)))
        disk = np.hypot(*np.mgrid[-r:r + 1, -r:r + 1]) <= r
        opened = ndimage.binary_opening(land, structure=disk)
        for m in blobs(opened, cells(20), keep_border=False):
            islands.append(land & ndimage.binary_dilation(m, iterations=2))   # the opening already put back all but the corners: just the shoreline
        if islands:
            rest = land & ~np.any(islands, axis=0) & ~opened
            for m in blobs(rest, cells(5)):  # what was cut off: the neck itself, if it touches an island
                if (ndimage.binary_dilation(m, iterations=2) & np.any(islands, axis=0)).any():
                    necks.append(m)
    tol = max(0.3, st * 0.6)
    res = {'water_level_m': None if lvl is None else round(float(lvl), 2), 'outlines': []}
    for kind, ms in (('water', waters), ('island', islands), ('neck', necks), ('sand', sands)):
        for i, m in enumerate(ms):
            o = {'name': f'{kind}-{i + 1}', 'kind': kind, **describe(m, X, Z, st), 'pts': outline(m, xs, zs, tol)}
            if kind == 'sand':
                o['depth_m'] = round(float(np.max((smooth - Hf)[m])), 2)
            res['outlines'].append(o)
    # heights along the hole: tee (0,0) to the pin and on, relative to the pin, at the hole's scale; smoothed like Riviera's (2.5 m)
    pin = (T.get('lidar', {}).get('frame', {}).get('pin') or F['anchor']['at'])
    Hs = ndimage.gaussian_filter(Hf, cfg['smooth'] * fr.s / st)
    hp = float(ndimage.map_coordinates(Hs, [[(pin[1] - zs[0]) / st], [(pin[0] - xs[0]) / st]], order=1)[0])
    L = math.hypot(*pin)
    prof = []
    sand_wide = ndimage.binary_dilation(sand, iterations=max(1, int(round(cfg['smooth'] * fr.s / st))))   # the profile is smoothed: its dip spreads past the sand
    for d in np.arange(0, L * 1.3 + 1e-9, max(2.0, round(L / 40))):
        x, z = pin[0] * d / L, pin[1] * d / L
        if g['x'][0] <= x <= g['x'][1] and g['z'][0] <= z <= g['z'][1]:
            h = float(ndimage.map_coordinates(Hs, [[(z - zs[0]) / st], [(x - xs[0]) / st]], order=1)[0])
            ij = (int(round((z - zs[0]) / st)), int(round((x - xs[0]) / st)))
            on, insand = bool(wet[ij]), bool(sand_wide[ij])
            prof.append({'along': round(float(d), 1), 'x': round(x, 1), 'z': round(z, 1), 'h': round((h - hp) * fr.s, 2), 'water': on, 'sand': insand})
    res['pin_h_m'] = round(hp, 3)
    res['profile'] = {'note': 'heights along the line tee -> pin and on, relative to the pin, in game yards (metres x yd_per_m), '
                              f"{cfg['smooth']} m gaussian; water rows are the hydro-flattened surface, not the bed", 'pin': pin, 'rows': prof}
    # the green's plane
    gpts = next((o.get('hole') for o in T.get('outlines', []) if o.get('kind') == 'green' and o.get('hole')), None)
    gm, src = None, None
    if gpts:
        gm, src = poly_mask(gpts, X, Z), 'the trace file\'s green outline'
    elif islands:
        gm, src = ndimage.binary_erosion(islands[0], iterations=max(1, int(round(2 / st)))), 'the first island, shrunk by 2 yd'
    if gm is not None and gm.sum() > 20:
        c = plane(Hf, gm & ~sand, X, Z)
        res['plane'] = {'over': src, 'x_pct': round(float(c[0] * fr.s * 100), 2), 'z_pct': round(float(c[1] * fr.s * 100), 2),
                        'relief_m': round(float(np.nanmax(Hf[gm]) - np.nanmin(Hf[gm])), 2),
                        'note': 'grade toward +x (screen-left) and +z (away from the tee), rise per run; the 1 m grid resolves a plane, not break'}
    if compare:
        S = game_surfaces(hid, xs, zs)
        res['vs_game'] = {'sand': iou(sand, S['SAND']), 'water': iou(wet, S['WATER']),
                          'note': 'IoU of the lidar masks with the hole as it is now (S(x,z) from index.html)'}
        for o, m in zip([o for o in res['outlines'] if o['kind'] == 'sand'], sands):
            o['iou_game_sand'] = iou(m, S['SAND'] & ndimage.binary_dilation(m, iterations=int(4 / st)))
        for o, m in zip([o for o in res['outlines'] if o['kind'] == 'island'], islands):
            o['iou_game_land'] = iou(m, ~S['WATER'] & ndimage.binary_dilation(m, iterations=int(6 / st)))
    res['_masks'] = (xs, zs, X, Z, H, wet, sand, islands)
    res['_frame'] = fr
    return res


def png(res, path, extra=()):
    import numpy as np
    from PIL import Image, ImageDraw
    xs, zs, X, Z, H, wet, sand, islands = res['_masks']
    st = xs[1] - xs[0]
    Hf = np.where(np.isnan(H), np.nanmin(H), H)
    gz, gx = np.gradient(Hf, st)
    hs = np.clip(0.55 + (gx * 0.7 - gz * 0.7) * 3, 0, 1)
    img = np.stack([hs] * 3, -1)
    img[wet] = img[wet] * 0.3 + np.array([0.15, 0.3, 0.6])
    img[sand] = img[sand] * 0.4 + np.array([0.55, 0.5, 0.2])
    img = img[::-1, ::-1]  # z up (away from the tee at the bottom), +x (screen-left) on the left
    k = max(1, int(round(4 / st)))
    im = Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).resize((img.shape[1] * k, img.shape[0] * k), Image.NEAREST)
    d = ImageDraw.Draw(im)
    P = lambda x, z: ((xs[-1] - x) / st * k, (zs[-1] - z) / st * k)  # noqa: E731
    for o in res['outlines']:
        col = {'water': (90, 160, 255), 'island': (255, 80, 80), 'neck': (255, 150, 60), 'sand': (255, 230, 90)}[o['kind']]
        d.polygon([P(*p) for p in o['pts']], outline=col)
        d.text(P(*o['centroid']), o['name'], fill=col)
    for name, pts, col in extra:
        d.line([P(*p) for p in pts + pts[:1]], fill=col, width=1)
    for z in range(int(math.ceil(zs[0] / 10) * 10), int(zs[-1]) + 1, 10):
        d.text((2, P(0, z)[1]), str(z), fill=(255, 255, 0))
    for x in range(int(math.ceil(xs[0] / 10) * 10), int(xs[-1]) + 1, 10):
        d.text((P(x, 0)[0], 2), str(x), fill=(255, 255, 0))
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im.save(path)


def report(hid, res):
    print(f"=== {hid}: lidar outlines in hole coordinates (water level {res['water_level_m']} m)")
    print(f"{'outline':<10} {'width × depth yd':<18} {'area yd²':>9}  {'centroid (x, z)':<16} note")
    for o in res['outlines']:
        note = []
        if 'depth_m' in o: note.append(f"{o['depth_m']} m below its surroundings")
        if o.get('iou_game_sand') is not None: note.append(f"IoU with the game's sand {o['iou_game_sand']}")
        if o.get('iou_game_land') is not None: note.append(f"IoU with the game's land {o['iou_game_land']}")
        print(f"{o['name']:<10} {o['width']:>6.1f} × {o['depth']:<9.1f} {o['area']:>9.0f}  ({o['centroid'][0]:.1f}, {o['centroid'][1]:.1f}){'':<4} {'; '.join(note)}")
    if 'plane' in res:
        p = res['plane']
        print(f"plane      over {p['over']}: {p['x_pct']} % toward +x, {p['z_pct']} % toward +z, relief {p['relief_m']} m")
    if 'vs_game' in res:
        print(f"vs game    sand IoU {res['vs_game']['sand']}, water IoU {res['vs_game']['water']}")
    rows = res['profile']['rows']
    if rows:
        print('profile    ' + '  '.join(f"{r['along']:.0f}:{r['h']:+.1f}{'w' if r['water'] else ''}" for r in rows))


def clean(res):
    return {k: v for k, v in res.items() if not k.startswith('_')}


# ---------------------------------------------------------------- fit (Riviera's lidar.fit)
def traced_bunkers(T):
    """the trace file's bunker outlines as the photos measured them: rescale and exaggerate undone"""
    out = []
    rs = T.get('rescale')
    for o in T.get('outlines', []):
        if o.get('kind') != 'bunker' or not o.get('hole'):
            continue
        P = [list(p) for p in o['hole']]
        ex = o.get('exaggerate') or {}
        cx, cz = sum(p[0] for p in P) / len(P), sum(p[1] for p in P) / len(P)
        if ex.get('shift'):
            P = [[x - ex['shift'][0], z - ex['shift'][1]] for x, z in P]; cx -= ex['shift'][0]; cz -= ex['shift'][1]
        if ex.get('scale'):
            P = [[cx + (x - cx) / ex['scale'], cz + (z - cz) / ex['scale']] for x, z in P]
        if rs:
            k, (ax, az) = rs['factor'], rs['about']
            P = [[ax + (x - ax) / k, az + (z - az) / k] for x, z in P]
        out.append((o['name'], P))
    return out


def fit(hid, T, f):
    import numpy as np
    from scipy import ndimage, optimize
    from matplotlib.path import Path
    M, fr, F, cfg = frame_of(T, f)
    B = traced_bunkers(T)
    if not B:
        die('no traced bunker outlines (kind "bunker" with `hole` points) in the trace file: run trace.js --write first')
    allp = np.array([p for _, P in B for p in P])
    cx, cz = allp.mean(0)
    E0, N0 = fr.to_utm(cx, cz)
    R = (np.ptp(allp, 0).max() / fr.s) * 0.8 + 15
    Hraw, ex, ny = M.window(E0, N0, R)
    Hf = np.where(np.isnan(Hraw), np.nanmedian(Hraw), Hraw)
    res = M.tiles[0].res
    sm = ndimage.gaussian_filter(Hf, cfg['sand']['sigma'] / res)
    sand = Hf < sm - cfg['sand']['below']
    EE, NN = np.meshgrid(ex, ny)
    # only the sand near where the frame already puts the traced shapes: other holes' bunkers in the window must not pull the fit
    near0 = np.zeros(EE.shape, bool)
    for _, P in B:
        Q = np.array([fr.to_utm(x, z) for x, z in P])
        near0 |= Path(Q).contains_points(np.c_[EE.ravel(), NN.ravel()]).reshape(EE.shape)
    near0 = ndimage.binary_dilation(near0, iterations=int(round(cfg.get('fit_reach_m', 8) / res)))
    sand = (sand & near0).astype(float)
    sub = 4  # rasterise the traced shapes 4x finer, then average: a smooth objective
    fe = ex[0] - res / 2 + res / sub * (np.arange(len(ex) * sub) + 0.5)
    fn = ny[0] + res / 2 - res / sub * (np.arange(len(ny) * sub) + 0.5)
    FE, FN = np.meshgrid(fe, fn)
    pts_fine = np.c_[FE.ravel(), FN.ravel()]
    a0 = fr.at

    def shapes(p):
        dE, dN, db, k = p
        g = Frame((fr.A[0] + dE, fr.A[1] + dN), a0, fr.b + db, fr.s / k)
        return [(n, np.array([g.to_utm(x, z) for x, z in P])) for n, P in B], g

    def cover(polys):
        m = np.zeros(FE.shape, bool)
        for _, Q in polys:
            m |= Path(Q).contains_points(pts_fine).reshape(FE.shape)
        return m.reshape(len(ny), sub, len(ex), sub).mean((1, 3))

    def cost(p):
        c = cover(shapes(p)[0])
        return -(np.minimum(c, sand).sum() / np.maximum(c, sand).sum())

    best = None
    for db in (-4, 0, 4):
        for k in (0.9, 1.1):
            x0 = np.array([0, 0, db, k], float)
            simplex = np.vstack([x0] + [x0 + d for d in np.diag([1.5, 1.5, 2.0, 0.04])])   # real first steps: metres, metres, degrees, scale
            r = optimize.minimize(cost, x0, method='Nelder-Mead', options={'xatol': 0.01, 'fatol': 1e-4, 'initial_simplex': simplex, 'maxiter': 600})
            if best is None or r.fun < best.fun:
                best = r
    polys, g = shapes(best.x)
    per = {}
    for n, Q in polys:
        c = cover([(n, Q)]) > 0.5
        near = ndimage.binary_dilation(c, iterations=4)
        s = (sand > 0) & near
        u = (c | s).sum()
        lab, nl = ndimage.label(s)
        if nl:
            sizes = ndimage.sum(s, lab, range(1, nl + 1)); j = int(np.argmax(sizes)) + 1
            off = math.hypot(EE[lab == j].mean() - Q[:, 0].mean(), NN[lab == j].mean() - Q[:, 1].mean())
        else:
            off = None
        per[n] = {'iou': round(float((c & s).sum() / u), 2) if u else 0, 'offset_m': None if off is None else round(off, 1)}
    A = g.to_utm(*a0)
    out = {'what': 'the traced bunkers (as the photos measured them: rescale and exaggerate undone) matched to the lidar\'s sand '
                   f"(ground {cfg['sand']['below']} m below its {cfg['sand']['sigma']:g} m gaussian), solving centre, bearing and scale",
           'anchor_utm': [round(A[0], 1), round(A[1], 1)], 'bearing_deg': round(g.b, 1), 'scale': round(float(best.x[3]), 3),
           'iou': round(-best.fun, 2), 'per_bunker': per}
    print(f"=== {hid}: traced bunkers fitted to the lidar's sand")
    print(f"anchor {a0} at UTM ({out['anchor_utm'][0]}, {out['anchor_utm'][1]}) EPSG:{M.epsg}; bearing {out['bearing_deg']}° "
          f"(frame {fr.b}°); scale {out['scale']} (the photos' size × this = the lidar's); IoU {out['iou']}")
    for n, v in per.items():
        print(f"  {n:<10} IoU {v['iou']:.2f}  offset {v['offset_m']} m")
    return out


# ---------------------------------------------------------------- match (an aerial's outline to the lidar's land)
def match(hid, T, f, view, oname, clip=26.0):
    import numpy as np
    from scipy import ndimage, optimize
    from matplotlib.path import Path
    o = next((o for o in T.get('outlines', []) if o.get('name') == oname and (o.get('view') or T['views'][0]['name']) == view), None)
    if not o or not o.get('px'):
        die(f"no outline '{oname}' traced on view '{view}' (with px points) in the trace file")
    res = read_hole(hid, T, f, compare=False)
    xs, zs, X, Z, H, wet, sand, islands = res['_masks']
    if not islands:
        die('the lidar finds no island to match against')
    st = xs[1] - xs[0]
    c0 = np.array([X[islands[0]].mean(), Z[islands[0]].mean()])
    disk = np.hypot(X - c0[0], Z - c0[1]) <= clip
    L = (~wet) & disk
    U = np.array(o['px'], float)
    uc = U.mean(0)
    pts = np.c_[X[disk], Z[disk]]
    area_px = 0.5 * abs(np.dot(U[:, 0], np.roll(U[:, 1], 1)) - np.dot(U[:, 1], np.roll(U[:, 0], 1)))

    def place(p):
        th, sc, tx, tz = p
        c, s_ = math.cos(th), math.sin(th)
        d = U - uc
        return np.c_[c0[0] + tx + sc * (c * d[:, 0] - s_ * d[:, 1]), c0[1] + tz + sc * (s_ * d[:, 0] + c * d[:, 1])]

    def cost(p):
        inside = np.zeros(X.shape, bool)
        inside[disk] = Path(place(p)).contains_points(pts)
        return -((inside & L).sum() / max(1, (inside | L).sum()))

    sc0 = math.sqrt(islands[0].sum() * st * st / max(area_px, 1))
    # a roundish island has several local fits (Sawgrass: 0.80 with the walkway in front, 0.90 with it where the lidar has it), so every
    # starting angle is refined, and the runner-up is reported: a close second means the outline does not fix the rotation
    fits = []
    for th in np.radians(np.arange(0, 360, 30)):
        x0 = np.array([th, sc0, 0, 0])
        simplex = np.vstack([x0] + [x0 + d for d in np.diag([0.08, sc0 * 0.04, 1.5, 1.5])])
        fits.append(optimize.minimize(cost, x0, method='Nelder-Mead', options={'initial_simplex': simplex, 'xatol': 1e-4, 'fatol': 1e-5, 'maxiter': 800}))
    fits.sort(key=lambda r: r.fun)
    r = fits[0]
    other = next((q for q in fits[1:] if abs((math.degrees(q.x[0] - r.x[0]) + 180) % 360 - 180) > 10), None)
    th, sc, tx, tz = r.x
    P = place(r.x)
    # constraints: the outline's extreme points and a few spread round it (photo pixel -> where the fit puts it)
    idx = sorted(set([int(np.argmin(U[:, 0])), int(np.argmax(U[:, 0])), int(np.argmin(U[:, 1])), int(np.argmax(U[:, 1]))] +
                     [int(i) for i in np.linspace(0, len(U) - 1, 9)[1:-1:2]]))
    cons = [{'type': 'point', 'from': 'lidar match', 'name': f'{oname} outline point {i}', 'px': [round(float(U[i, 0]), 1), round(float(U[i, 1]), 1)],
             'at': [round(float(P[i, 0]), 2), round(float(P[i, 1]), 2)]} for i in idx]
    out = {'outline': oname, 'iou': round(-r.fun, 3), 'yd_per_px': round(float(sc), 5), 'rotation_deg': round(math.degrees(th) % 360, 2),
           'clip_yd': clip, 'about': [round(float(c0[0]), 2), round(float(c0[1]), 2)],
           'runner_up': None if other is None else {'rotation_deg': round(math.degrees(other.x[0]) % 360, 1), 'iou': round(-other.fun, 3)},
           'note': 'a similarity (camera straight down) fitted to the lidar land inside clip_yd of the lidar island: hole = about + shift + scale * R(rotation) * (px - its mean)'}
    print(f"=== {hid}: '{oname}' on '{view}' matched to the lidar's land (inside {clip} yd of the island)")
    print(f"IoU {out['iou']}; {1 / sc:.1f} px per yd; rotation {out['rotation_deg']}°; outline centre at ({P[:, 0].mean():.1f}, {P[:, 1].mean():.1f})")
    if out['runner_up']:
        ru = out['runner_up']
        print(f"runner-up: rotation {ru['rotation_deg']}°, IoU {ru['iou']}" + ('  <- close: the outline barely fixes the rotation; check it against the photo' if ru['iou'] > out['iou'] - 0.03 else ''))
    return out, cons, P


# ---------------------------------------------------------------- build (the lidar half of a hole's entry)
def rdp(P, tol):
    """Douglas-Peucker on (z, h) points"""
    if len(P) < 3:
        return P
    (z0, h0), (z1, h1) = P[0], P[-1]
    dz = z1 - z0 or 1e-9
    d = [abs(h - (h0 + (h1 - h0) * (z - z0) / dz)) for z, h in P]
    i = max(range(len(P)), key=lambda k: d[k])
    if d[i] <= tol:
        return [P[0], P[-1]]
    return rdp(P[:i + 1], tol)[:-1] + rdp(P[i:], tol)


def seg_dist(p, a, b):
    ax, az = a; bx, bz = b; px, pz = p
    L2 = (bx - ax) ** 2 + (bz - az) ** 2 or 1e-9
    t = max(0, min(1, ((px - ax) * (bx - ax) + (pz - az) * (bz - az)) / L2))
    return math.hypot(px - ax - t * (bx - ax), pz - az - t * (bz - az))


def side_grid(res, F, step):
    """the ground across the hole, relative to the line through the tee and pin, on a coarse grid (index.html's `grid` feature):
    bunkers and water filled in from their surroundings first (they are dug by their own entries), smoothed to the grid's spacing"""
    import numpy as np
    from scipy import ndimage
    xs, zs, X, Z, H, wet, sand, islands = res['_masks']
    fr = res['_frame']
    st = xs[1] - xs[0]
    Hf = np.where(np.isnan(H), np.nanmedian(H), H)
    hole = ndimage.binary_dilation(sand | wet, iterations=max(1, int(round(2 / st))))
    keep = (~hole).astype(float)
    sig = max(1.0, step * 0.35 / st)
    Hs = ndimage.gaussian_filter(Hf * keep, sig) / np.maximum(ndimage.gaussian_filter(keep, sig), 1e-6)
    g = F['grid']
    gx = np.arange(math.ceil(g['x'][0] / step) * step, g['x'][1] + 1e-9, step)
    gz = np.arange(math.ceil(g['z'][0] / step) * step, g['z'][1] + 1e-9, step)
    pin = res['profile']['pin']
    L = math.hypot(*pin) or 1.0
    at = lambda x, z: ndimage.map_coordinates(Hs, [[(z - zs[0]) / st], [(x - xs[0]) / st]], order=1)[0]   # noqa: E731
    v = []
    for z in gz:
        cx = pin[0] * z / pin[1] if pin[1] else 0.0   # the line tee -> pin
        h0 = at(cx, z)
        v.extend(round(float((at(x, z) - h0) * fr.s), 1) for x in gx)
    return {'type': 'grid', 'x0': round(float(gx[0]), 1), 'z0': round(float(gz[0]), 1), 'step': step, 'nx': len(gx), 'v': v,
            '_note': f'{len(gx)} x {len(gz)} heights, every {step} yd: the ground across the hole relative to the line, from the lidar'}


def build(hid, T, f, corridor=40.0, bunker_max=1.2, lip=0.25, profile='shore', grid_step=None):
    res = read_hole(hid, T, f, compare=False)
    fr = res['_frame']
    pin = res['profile']['pin']
    end = (pin[0] * 1.3, pin[1] * 1.3)
    near = lambda c: seg_dist(c, (0, 0), end) <= corridor  # noqa: E731
    rows = [r for r in res['profile']['rows'] if not r['water'] and not r.get('sand')]   # a bunker is dug by its own entry, not by the land
    if not rows or rows[0]['along'] > 5:
        die('the frame\'s grid does not reach the tee (z 0): widen lidar.frame.grid so the heights start there')
    h_tee = rows[0]['h']
    pts = rdp([(r['z'], r['h'] - h_tee) for r in rows], 0.25)
    ramps = [{'type': 'ramp', 'z0': round(a[0], 1), 'z1': round(b[0], 1), 'dh': round(b[1] - a[1], 2)}
             for a, b in zip(pts, pts[1:]) if abs(b[1] - a[1]) >= 0.15]
    sands = [o for o in res['outlines'] if o['kind'] == 'sand' and near(o['centroid'])]
    bunkers = [{'pts': o['pts'], 'depth': round(min(bunker_max, max(0.4, o['depth_m'] * fr.s)), 2), 'lip': lip,
                '_note': f"{o['name']} at ({o['centroid'][0]}, {o['centroid'][1]}): {o['width']} x {o['depth']} yd, {o['depth_m']} m deep in the lidar"} for o in sands]
    water = []
    if res['water_level_m'] is not None:
        level = round((res['water_level_m'] - res['pin_h_m']) * fr.s - h_tee, 2)
        isl = [o for o in res['outlines'] if o['kind'] == 'island']
        for o in res['outlines']:
            if o['kind'] != 'water' or not any(near(p) for p in o['pts'][::3]):
                continue
            from matplotlib.path import Path
            inside = [i for i in isl if Path(o['pts']).contains_point(i['centroid'])]
            water.append({'kind': 'lake', 'profile': profile, 'level': level, 'bed': round(level - 2.4, 2), 'edge': 0.6,
                          'shape': {'type': 'poly', 'pts': o['pts']}, 'islands': [{'type': 'poly', 'pts': i['pts']} for i in inside],
                          '_note': f"{o['width']} x {o['depth']} yd"})
    grid = None
    if grid_step:
        grid = side_grid(res, T['lidar']['frame'], grid_step)
    tilt = None
    if 'plane' in res:
        tilt = {'x': round(res['plane']['x_pct'] / 100, 4), 'z': round(res['plane']['z_pct'] / 100, 4), '_note': f"over {res['plane']['over']}"}
    return {'ramps': ramps, 'bunkers': bunkers, 'water': water, 'tilt': tilt, 'grid': grid, 'h_tee_rel_pin': h_tee,
            'skipped_sand': [o['name'] for o in res['outlines'] if o['kind'] == 'sand' and not near(o['centroid'])]}


def js(v):
    """a value as compact JS (object keys unquoted), notes dropped"""
    if isinstance(v, dict):
        return '{' + ','.join(f'{k}:{js(x)}' for k, x in v.items() if not k.startswith('_')) + '}'
    if isinstance(v, list):
        return '[' + ','.join(js(x) for x in v) + ']'
    if isinstance(v, str):
        return "'" + v + "'"
    if isinstance(v, float):
        return f'{v:g}'
    return json.dumps(v)


def cmd_build(pos, fl):
    if not pos:
        die('build needs a hole id')
    T, f = load_trace(pos[0])
    B = build(pos[0], T, f, float(fl.get('corridor', 40)), float(fl.get('bunker-max', 1.2)), float(fl.get('lip', 0.25)), fl.get('profile', 'shore'),
              float(fl['grid']) if fl.get('grid') else None)
    if fl.get('json'):
        print(json.dumps(B))
        return
    print(f"// {pos[0]}: generated by tests/tools/lidar.py build from docs/holes/trace/{pos[0]}.json; heights from the tee, game yards")
    if B['tilt']:
        print(f"  tilt:{js(B['tilt'])},   // the green's plane, {B['tilt']['_note']}")
    print('  features:[   // the heights along the line (lidar profile, simplified to 0.25 yd)')
    for r in B['ramps']:
        print(f'    {js(r)},')
    if B['grid']:
        print(f"    {js(B['grid'])},   // {B['grid']['_note']}")
    print('  ],')
    print('  bunkers:[')
    for b in B['bunkers']:
        print(f"    {js(b)},   // {b['_note']}")
    print('  ],')
    print('  water:[')
    for w in B['water']:
        print(f"    {js(w)},   // {w['_note']}")
    print('  ],')
    if B['skipped_sand']:
        print(f"// hollows outside the corridor, left out: {', '.join(B['skipped_sand'])}")


# ---------------------------------------------------------------- commands
def cmd_fetch(fl):
    if 'pin' not in fl:
        die('fetch needs --pin LAT,LON')
    lat, lon = latlon(fl['pin'])
    d = 0.0015
    q = urllib.parse.urlencode({'bbox': f'{lon - d},{lat - d},{lon + d},{lat + d}', 'datasets': 'Digital Elevation Model (DEM) 1 meter'})
    try:
        with urllib.request.urlopen(f'{TNM}?{q}', timeout=60) as r:
            items = json.load(r).get('items', [])
    except Exception as e:  # noqa: BLE001
        die(f'the National Map API did not answer ({e}). Is tnmaccess.nationalmap.gov on the network allowlist? (docs/ICONIC-HOLES.md §2.1)')
    if not items:
        die('no 1 m DEM covers this pin (outside the US, or not flown yet): use the country\'s own public lidar (§2.1)')
    items.sort(key=lambda i: i.get('publicationDate') or '', reverse=True)
    for i in items:
        print(f"{i['title']}  published {i.get('publicationDate')}  {(i.get('sizeInBytes') or 0) / 1e6:.0f} MB\n  {i['downloadURL']}")
    if fl.get('download'):
        u = items[0]['downloadURL']
        os.makedirs(REFS, exist_ok=True)
        dst = os.path.join(REFS, os.path.basename(urllib.parse.urlparse(u).path))
        if os.path.exists(dst):
            print(f'already here: {os.path.relpath(dst, ROOT)}')
        else:
            print(f'downloading the newest into {os.path.relpath(dst, ROOT)} (git-ignored) ...', flush=True)
            urllib.request.urlretrieve(u, dst + '.part')
            os.replace(dst + '.part', dst)
            print('done')


def cmd_look(pos, fl):
    import numpy as np
    from PIL import Image, ImageDraw
    if not pos or 'pin' not in fl:
        die('look needs a tile and --pin LAT,LON')
    M = Mosaic([pos[0] if os.path.exists(pos[0]) else os.path.join(REFS, pos[0])])
    E, N = M.to_xy(*latlon(fl['pin']))
    r = float(fl.get('r', 200))
    z, xs, ys = M.window(E, N, r)
    if np.isnan(z).mean() > 0.5:
        die('the pin is not on this tile (or near its edge)')
    zf = np.where(np.isnan(z), np.nanmin(z), z)
    gy, gx = np.gradient(zf)
    hs = np.clip(0.55 + (-gx + gy) * 3, 0, 1)
    img = np.stack([hs] * 3, -1)
    lvl = water_level(zf, 0.05)
    if lvl is not None:
        img[zf <= lvl + 0.05] = [0.2, 0.3, 0.6]
    flat = (np.hypot(gx, gy) < 0.012) & ~(zf <= (lvl if lvl is not None else -1e9) + 0.05)
    img[flat] = img[flat] * 0.5 + np.array([0.5, 0.4, 0])
    k = 3
    im = Image.fromarray((img * 255).astype(np.uint8)).resize((img.shape[1] * k, img.shape[0] * k), Image.BILINEAR)
    d = ImageDraw.Draw(im)
    c = r * k
    for rr in [float(v) for v in str(fl.get('rings', '110,125,140')).split(',')]:
        d.ellipse([c - rr * k, c - rr * k, c + rr * k, c + rr * k], outline=(255, 0, 0))
        d.text((c + rr * k * 0.71, c - rr * k * 0.71), f'{rr:g} m', fill=(255, 0, 0))
    d.rectangle([c - 3, c - 3, c + 3, c + 3], fill=(255, 0, 0))
    if 'tee' in fl:
        tE, tN = M.to_xy(*latlon(fl['tee']))
        print(f"tee -> pin: bearing {bearing((tE, tN), (E, N)):.1f}° from grid north, {math.hypot(E - tE, N - tN):.1f} m "
              f"({math.hypot(E - tE, N - tN) * 1.0936:.0f} yd)")
        d.ellipse([(tE - E + r) * k - 4, (N - tN + r) * k - 4, (tE - E + r) * k + 4, (N - tN + r) * k + 4], outline=(0, 255, 0), width=2)
    os.makedirs(OUT, exist_ok=True)
    out = os.path.join(OUT, os.path.splitext(os.path.basename(M.tiles[0].path))[0] + '-look.png')
    im.save(out)
    print(f'pin at {E:.1f} E, {N:.1f} N (EPSG:{M.epsg}); water level {lvl} m; north is up, 1 px = {1 / k:.2f} m -> {os.path.relpath(out, ROOT)}')


def cmd_outlines(pos, fl):
    if not pos:
        die('outlines needs a hole id')
    hid = pos[0]
    T, f = load_trace(hid)
    res = read_hole(hid, T, f, compare=not fl.get('no-game'))
    if fl.get('json'):
        print(json.dumps(clean(res)))
    else:
        report(hid, res)
    if fl.get('snippet'):
        for o in res['outlines']:
            print(f"// {o['name']}: {o['width']} × {o['depth']} yd\npts:{json.dumps(o['pts'], separators=(',', ':'))}")
    if fl.get('png'):
        extra = [(o['name'], o['hole'], (255, 255, 255)) for o in T.get('outlines', []) if o.get('hole')]
        p = os.path.join(OUT, f'{hid}-lidar.png')
        png(res, p, extra)
        print(f'-> {os.path.relpath(p, ROOT)} (white: the trace file\'s outlines; tee at the bottom, +x on the left)')
    if fl.get('write'):
        L = T.setdefault('lidar', {})
        L['read'] = clean(res)
        save_trace(T, f)
        print(f'wrote lidar.read to {os.path.relpath(f, ROOT)}')


def cmd_fit(pos, fl):
    if not pos:
        die('fit needs a hole id')
    T, f = load_trace(pos[0])
    out = fit(pos[0], T, f)
    if fl.get('write'):
        T.setdefault('lidar', {})['fit'] = out
        save_trace(T, f)
        print(f'wrote lidar.fit to {os.path.relpath(f, ROOT)}')
    if fl.get('json'):
        print(json.dumps(out))


def cmd_match(pos, fl):
    if not pos or 'view' not in fl or 'outline' not in fl:
        die('match needs a hole id, --view NAME and --outline NAME')
    T, f = load_trace(pos[0])
    out, cons, P = match(pos[0], T, f, fl['view'], fl['outline'], float(fl.get('clip', 26)))
    for c in cons:
        print(f"  point {c['px']} -> {c['at']}")
    if fl.get('write'):
        v = next(v for v in T['views'] if v['name'] == fl['view'])
        cam = v.setdefault('camera', {})
        cam['constraints'] = [c for c in cam.get('constraints', []) if c.get('from') != 'lidar match'] + cons
        T.setdefault('lidar', {}).setdefault('match', {})[fl['view']] = out
        save_trace(T, f)
        print(f'wrote {len(cons)} constraints to view {fl["view"]} and lidar.match.{fl["view"]}')


def cmd_selftest():
    """a synthetic tile through the whole chain: tilted ground, a lake at 0 m with an island, a pot bunker on the island, a plane"""
    import tempfile
    import numpy as np
    import tifffile
    W = 400
    x0, y0 = 500000.0, 3000400.0
    E, N = np.meshgrid(x0 + np.arange(W) + 0.5, y0 - np.arange(W) - 0.5)
    lat, lon = 27.1, -81.0  # anywhere in UTM 17N
    import pyproj
    pE, pN = pyproj.Transformer.from_crs(4326, 26917, always_xy=True).transform(lon, lat)
    E, N = E - x0 + pE - 200, N - y0 + pN + 200
    dE, dN = E - pE, N - pN
    land = 1.5 + 0.004 * dN
    z = land.copy()
    lake = (dE / 70) ** 2 + (dN / 50) ** 2 < 1
    isl = (dE / 12) ** 2 + (dN / 10) ** 2 < 1
    z[lake & ~isl] = 0.0                                  # hydro-flattened
    z[isl] = (1.0 + 0.03 * dE)[isl]                       # the island's top: a 3 % plane rising to the east
    pot = (dE - 4) ** 2 + (dN + 3) ** 2 < 2.5 ** 2        # a pot bunker, 5 m across, 0.8 m deep, south-east on the island
    z[pot] -= 0.8
    bunk = ((dE + 30) / 8) ** 2 + ((dN - 80) / 5) ** 2 < 1  # a bunker on land, 16 x 10 m
    z[bunk] -= 0.6
    d = tempfile.mkdtemp()
    tif = os.path.join(d, 'synthetic.tif')
    gk = (1, 1, 0, 3, 1024, 0, 1, 1, 1025, 0, 1, 1, 3072, 0, 1, 26917)
    tifffile.imwrite(tif, z.astype(np.float32), extratags=[(33550, 'd', 3, (1.0, 1.0, 0.0)), (33922, 'd', 6, (0, 0, 0, pE - 200, pN + 200, 0)), (34735, 'H', len(gk), gk)])
    # the hole plays due north, 1 yd per metre (scale 0.914), the pin on the island's middle at (0, 120)
    T = {'id': 'selftest', 'lidar': {'frame': {'tile': [tif], 'anchor': {'latlon': [lat, lon], 'at': [0, 120]}, 'bearing_deg': 0, 'yd_per_m': 1.0,
                                               'grid': {'x': [-60, 60], 'z': [-10, 220], 'step': 0.5}}}}
    res = read_hole('selftest', T, tif, compare=False)
    bad = []
    by = {o['name']: o for o in res['outlines']}
    near = lambda a, b, t: abs(a - b) <= t  # noqa: E731
    i1, s = by.get('island-1'), [o for o in res['outlines'] if o['kind'] == 'sand']
    if not i1 or not near(i1['width'], 24, 1.5) or not near(i1['depth'], 20, 1.5) or not near(i1['centroid'][1], 120, 1):
        bad.append(f'island: {i1}')
    pot_o = min(s, key=lambda o: math.hypot(o['centroid'][0] + 4, o['centroid'][1] - 117), default=None)  # +x is west: east 4 m -> x -4
    if not pot_o or not near(pot_o['centroid'][0], -4, 1) or not near(pot_o['centroid'][1], 117, 1) or not near(pot_o['area'], math.pi * 6.25, 6):
        bad.append(f'pot bunker: {pot_o}')
    b2 = min(s, key=lambda o: math.hypot(o['centroid'][0] - 30, o['centroid'][1] - 200), default=None)
    if not b2 or not near(b2['centroid'][0], 30, 1) or not near(b2['width'], 16, 1.5) or not near(b2['depth'], 10, 1.5):
        bad.append(f'land bunker: {b2}')
    if res['water_level_m'] is None or abs(res['water_level_m']) > 0.06:
        bad.append(f"water level {res['water_level_m']}")
    p = res.get('plane') or {}
    if not near(p.get('x_pct', 0), -3, 0.4) or not near(p.get('z_pct', 1), 0, 0.4):
        bad.append(f'plane: {p} (want -3 % toward +x, the island rising east = screen-right)')
    # the frame: a point due north-west of the anchor is +x (left) and +z
    fr = res['_frame']
    hx, hz = fr.to_hole(fr.A[0] - 10, fr.A[1] + 10)
    if not (near(hx, 10, 1e-6) and near(hz, 130, 1e-6)):
        bad.append(f'frame: {hx}, {hz}')
    ex, en = fr.to_utm(hx, hz)
    if not (near(ex, fr.A[0] - 10, 1e-6) and near(en, fr.A[1] + 10, 1e-6)):
        bad.append('frame inverse')
    # build: both bunkers in the corridor, the lake with its island, the land rising 0.4 m per 100 m north (the tee's side to beyond the lake)
    B = build('selftest', T, tif, corridor=60)
    if len(B['bunkers']) != 2 or len(B['water']) != 1 or len(B['water'][0]['islands']) != 1:
        bad.append(f"build: {len(B['bunkers'])} bunkers, {len(B['water'])} lakes, islands {[len(w['islands']) for w in B['water']]}")
    rise = sum(r['dh'] for r in B['ramps'])
    if not B['water'] or not near(B['water'][0]['level'], -(1.5 - 0.48), 0.15):   # water at 0 m, the tee at 1.5 - 0.004 x 120 m
        bad.append(f"build: water level {B['water'][0]['level'] if B['water'] else None} against the tee")
    if not near(B['tilt']['x'], -0.03, 0.004):
        bad.append(f"build: tilt {B['tilt']}")
    print(json.dumps({'ok': not bad, 'bad': bad, 'build': {'ramps': B['ramps'], 'bunker_depths': [b['depth'] for b in B['bunkers']]}, 'outlines': [{k: o[k] for k in ('name', 'width', 'depth', 'area', 'centroid')} for o in res['outlines']],
                      'plane': p, 'water_level_m': res['water_level_m']}))
    sys.exit(1 if bad else 0)


def main(argv):
    if not argv or argv[0] in ('-h', '--help', 'help'):
        print(__doc__)
        return
    need()
    cmd, rest = argv[0], argv[1:]
    pos, fl = flags(rest)
    if cmd == 'fetch': cmd_fetch(fl)
    elif cmd == 'look': cmd_look(pos, fl)
    elif cmd == 'outlines': cmd_outlines(pos, fl)
    elif cmd == 'fit': cmd_fit(pos, fl)
    elif cmd == 'match': cmd_match(pos, fl)
    elif cmd == 'build': cmd_build(pos, fl)
    elif cmd == 'selftest': cmd_selftest()
    else: die(f"unknown command '{cmd}': fetch, look, outlines, build, fit, match or selftest (--help)")


if __name__ == '__main__':
    main(sys.argv[1:])
