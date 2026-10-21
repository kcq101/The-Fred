#!/usr/bin/env python3
"""nature.py: pack Quaternius' Stylized Nature MegaKit (CC0) into the game's compact nature bundle.

    python3 tests/tools/nature.py <unzipped pack dir> [--out assets/nature]

The pack (standard tier, CC0, https://quaternius.com/packs/stylizednaturemegakit.html) is not in the repo; only the bundle this writes is:
    assets/nature/nature.bin    every model's geometry, quantized: int16 positions (in the model's own box), int8 normals, uint16 uvs,
                                uint8 vertex colours, uint16/uint32 indices
    assets/nature/nature.json   the index: per model, its parts (one per material) with byte offsets into nature.bin, its box, and the
                                texture each part uses
    assets/nature/*.png         the textures, scaled down for phones
The game loads the bundle at start-up (NATURE in index.html) and falls back to its own simple shapes if it cannot.
Needs Pillow. Reads glTF 2.0 with external .bin buffers, one mesh per file, as the pack ships them."""
import argparse, json, struct, sys
from pathlib import Path
from PIL import Image

MODELS = {   # game kit name -> pack files (the variants a hole's trees cycle through)
    'oak': ['CommonTree_1', 'CommonTree_2', 'CommonTree_3', 'CommonTree_4', 'CommonTree_5'],
    'pine': ['Pine_1', 'Pine_2', 'Pine_3', 'Pine_4', 'Pine_5'],
    'cypress': ['TwistedTree_1', 'TwistedTree_2', 'TwistedTree_3', 'TwistedTree_4', 'TwistedTree_5'],
    'dead': ['DeadTree_1', 'DeadTree_2', 'DeadTree_3'],
    'bush': ['Bush_Common'], 'bushflower': ['Bush_Common_Flowers'],
    'rock': ['Rock_Medium_1', 'Rock_Medium_2', 'Rock_Medium_3'],
    'fescue': ['Grass_Wispy_Tall', 'Grass_Wispy_Short'], 'tuft': ['Grass_Common_Short', 'Grass_Common_Tall'],
    'fern': ['Fern_1'], 'flowers': ['Flower_3_Group', 'Flower_4_Group'],
}
TEX_SIZE = {'Bark': 256, 'Leaves': 512, 'Leaf': 512, 'Rocks': 512, 'Grass': 256, 'Flowers': 256}
RECOLOR = {'Leaves_TwistedTree_C.png': (62, 104, 52)}   # the pack's twisted-tree leaves are autumn red: repaint them a cypress green, keeping their shading
CT = {5126: ('f', 4), 5123: ('H', 2), 5125: ('I', 4), 5121: ('B', 1)}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}


def read_acc(g, buf, i):
    a = g['accessors'][i]; v = g['bufferViews'][a['bufferView']]
    fmt, sz = CT[a['componentType']]; n = NC[a['type']]
    off = v.get('byteOffset', 0) + a.get('byteOffset', 0); stride = v.get('byteStride', sz * n)
    out = []
    for k in range(a['count']):
        out.append(struct.unpack_from('<' + fmt * n, buf, off + k * stride))
    return out, a


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('pack'); ap.add_argument('--out', default=str(Path(__file__).resolve().parents[2] / 'assets' / 'nature'))
    a = ap.parse_args()
    src = Path(a.pack); gl = next(src.rglob('glTF'), None) or src
    out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
    blob = bytearray(); index = {'models': {}, 'kits': MODELS, 'textures': {}}
    def put(b):
        while len(blob) % 4: blob.append(0)
        o = len(blob); blob.extend(b); return o
    for kit, names in MODELS.items():
        for name in names:
            g = json.loads((gl / f'{name}.gltf').read_text())
            buf = (gl / g['buffers'][0]['uri']).read_bytes()
            node = next(n for n in g['nodes'] if 'mesh' in n)
            if any(k in node for k in ('rotation', 'matrix')):
                sys.exit(f'{name}: rotated nodes are not supported')
            sc = node.get('scale', [1, 1, 1]); tr = node.get('translation', [0, 0, 0])
            parts = []; lo = [1e9] * 3; hi = [-1e9] * 3
            prims = []
            for p in g['meshes'][node['mesh']]['primitives']:
                P, _ = read_acc(g, buf, p['attributes']['POSITION'])
                P = [tuple(v[j] * sc[j] + tr[j] for j in range(3)) for v in P]
                for v in P:
                    for j in range(3): lo[j] = min(lo[j], v[j]); hi[j] = max(hi[j], v[j])
                prims.append((p, P))
            ext = [max(hi[j] - lo[j], 1e-6) for j in range(3)]
            for p, P in prims:
                N, _ = read_acc(g, buf, p['attributes']['NORMAL'])
                U, _ = read_acc(g, buf, p['attributes']['TEXCOORD_0'])
                C = read_acc(g, buf, p['attributes']['COLOR_0'])[0] if 'COLOR_0' in p['attributes'] else [(1, 1, 1, 1)] * len(P)
                I, ia = read_acc(g, buf, p['indices'])
                q = lambda v, j: max(-32767, min(32767, round(((v - lo[j]) / ext[j] * 2 - 1) * 32767)))
                pos = put(struct.pack(f'<{len(P) * 3}h', *[q(v[j], j) for v in P for j in range(3)]))
                nor = put(struct.pack(f'<{len(N) * 3}b', *[max(-127, min(127, round(c * 127))) for v in N for c in v]))
                uv = put(struct.pack(f'<{len(U) * 2}H', *[max(0, min(65535, round((c % 1.0 if c != 1.0 else 1.0) * 65535))) for v in U for c in v]))
                col = put(struct.pack(f'<{len(C) * 3}B', *[max(0, min(255, round(c * 255))) for v in C for c in v[:3]]))
                big = len(P) > 65535
                idx = put(struct.pack(f'<{len(I)}{"I" if big else "H"}', *[v[0] for v in I]))
                mat = g['materials'][p['material']]
                tex = g['images'][g['textures'][mat['pbrMetallicRoughness']['baseColorTexture']['index']]['source']]['uri']
                index['textures'][tex] = 1
                parts.append({'mat': mat['name'], 'tex': tex, 'alpha': mat.get('alphaMode') == 'MASK' or 'Grass' in tex or 'Flower' in tex,
                              'n': len(P), 'ni': len(I), 'big': big, 'pos': pos, 'nor': nor, 'uv': uv, 'col': col, 'idx': idx})
            index['models'][name] = {'lo': lo, 'hi': hi, 'parts': parts}
            print(f'{kit:10} {name:22} {sum(p["n"] for p in parts):6} verts  {hi[1] - lo[1]:5.2f} m tall')
    texdir = gl.parent / 'Textures' if (gl.parent / 'Textures').exists() else gl
    for tex in index['textures']:
        im = Image.open(next(d for d in (gl, texdir) if (d / tex).exists()) / tex).convert('RGBA')
        s = next((v for k, v in TEX_SIZE.items() if tex.startswith(k)), 256)
        im = im.resize((s, s), Image.LANCZOS)
        if tex in RECOLOR:
            r, g, b, al = im.split(); lum = Image.merge('RGB', (r, g, b)).convert('L')
            tint = RECOLOR[tex]; peak = max(lum.getextrema()[1], 1)
            ch = [lum.point(lambda v, t=t: min(255, round(v / peak * t * 1.6))) for t in tint]
            im = Image.merge('RGBA', (*ch, al))
        im.save(out / tex, optimize=True)
        index['textures'][tex] = s
    (out / 'nature.bin').write_bytes(bytes(blob))
    index['source'] = 'Quaternius, Stylized Nature MegaKit (standard), CC0 1.0: https://quaternius.com/packs/stylizednaturemegakit.html'
    (out / 'nature.json').write_text(json.dumps(index, separators=(',', ':')))
    (out / 'LICENSE.txt').write_text('Models and textures: Quaternius, Stylized Nature MegaKit (standard tier).\n'
                                     'License: CC0 1.0 Universal (public domain), https://creativecommons.org/publicdomain/zero/1.0/\n'
                                     'Source: https://quaternius.com/packs/stylizednaturemegakit.html\n'
                                     'Packed for the game by tests/tools/nature.py (quantized geometry, smaller textures).\n')
    total = sum(f.stat().st_size for f in out.iterdir())
    print(f'wrote {out}: {len(blob) / 1e6:.2f} MB geometry, {len(index["textures"])} textures, {total / 1e6:.2f} MB in all')


if __name__ == '__main__':
    main()
