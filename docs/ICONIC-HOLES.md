# Iconic holes: the design system

Build the system once; use it to bring many famous holes to life. This document is the architecture (what the system is) and the workflow (how to add a hole, and how to check it looks like the real one). Each hole then has its own spec in `docs/holes/`, written from `docs/holes/TEMPLATE.md`.

## 1. Architecture

A hole is **data**. Nothing in the engine knows any hole by name. The data goes through three layers, and every layer feeds the same height and surface functions that the renderer, the physics, the aiming arc and the tests all use, so a feature can never look one way and play another.

```mermaid
flowchart LR
  spec["Hole spec (HOLES entry)<br/>route · fairway · green · pin<br/>bunkers · water · scenery"] --> base["Base landform<br/>seed · roll · ridge"]
  base --> land["Land features<br/>rise · ramp · tilt"]
  land --> laid["Green, tee, bunkers, water<br/>laid into the land"]
  laid --> contour["Green features<br/>step · hollow"]
  contour --> H["H(x,z) height"]
  spec --> cover["cover features"] --> S["S(x,z) surface"]
  spec --> play["Play profile<br/>wind · windPush · firm · greens · stance"]
  H --> phys["BallModel (flight, bounce, roll)"]
  S --> phys
  play --> phys
  H --> stance["StanceModel (sloping lies)"]
  stance --> shot["shoot() + aiming arc + needle"]
  H --> render["Terrain mesh, water, cliffs"]
  S --> render
  spec --> look["Look layer (1.5)<br/>theme · props · town<br/>nature models · grass · revetted faces"]
  H --> look
  S --> look
  look --> render
```

Two halves, kept apart on purpose: **play** (H, S, obstacles, BallModel) decides what the ball does, and the **look layer** (§1.5) decides what the player sees. A look-only piece never changes a shot; anything that should touch the ball also needs an obstacle or a surface, and then checks.

### 1.1 Terrain features (the catalogue)

Every feature does one thing inside an area with a soft edge. Areas are an ellipse `{x,z,rx,rz,rot}`, a polygon `{pts}`, or a band `{pts,w}` along a polyline; `edge` is the falloff in yards outside it. Coordinates are yards: the tee is at the origin, the hole plays toward +z, screen-left is +x.

| Type | Parameters | Use it for |
|---|---|---|
| `rise` | `area, dh, edge` | Plateaus, elevated greens and tees, knolls, shelves; `dh<0` sinks: hollows that drain to a hazard |
| `ramp` | `z0, z1, dh, area?, edge?` | The hole climbing or falling between two distances (uphill drive, downhill approach, valley) |
| `tilt` | `area, grade, edge` | Side slopes across the hole: `grade` yards of rise per yard toward screen-left (negative falls left) |
| `step` | `area, a, b, dh, w, edge` | Tiers and ridges: ground left of line a→b sits `dh` higher, over a ramp `w` wide |
| `hollow` | `area (ellipse), depth, edge, flat?` | Swales and bowls, on a green or anywhere. `depth<0` makes a crown; **`flat` (0–1) holds full depth over that share of the radius before it falls**, so a crown with `flat:0.6` is a plateau: a level top with steep edges (Pinehurst No. 2 #5). Default 0 is the original dome |
| `cover` | `area, surf, over?` | Turns rough (or the surfaces in `over`) into another surface: pine straw, a shaved bank, waste |

`rise`, `ramp` and `tilt` shape the land before the green, tee and bunkers are laid into it (an elevated green stays flat on top). `step` and `hollow` act after the green is laid, so they can contour the putting surface. Adding a type is one entry in `FEATURES` in `index.html` plus a test.

### 1.2 Other per-hole data

| Piece | Parameters | Notes |
|---|---|---|
| Water bodies | `kind` (ocean, creek, lake), `profile` (cliff, shore, wall), `shape` (outside, poly, band, ellipse), `islands` | A cliff profile drops straight to the sea; shore slopes to a creek whose level follows its banks; wall is a bulkhead |
| Obstacles (`obstacles`) | `type:'wall'`, `pts` (polyline), `t` thickness (1.2), `h` height (1.6), `e` restitution (0.3), `f`/`fy` share of the along-wall and upward speed kept on a strike (0.7/0.8), `look:false` | **Solid, registry-based (`OBSTACLES`).** Run through the BallModel `collide` hook on both flight and roll: a ball hits it, loses speed and is thrown back; a ball above `h` flies over. Add a type with one entry. `look:false` makes it invisible: the collider behind a prop (St Andrews' sheds: `f:0.2, fy:0.15`, dead timber, so a drive drops back instead of ricocheting across the hole). A stone wall is drawn with rubble-stone shading |
| Bunkers | an ellipse `x,z,rx,rz,rot`, **or a traced outline `pts:[[x,z],...]`**; `depth` (default 0.9), `lip` (0.25), `revet` (look: default on for `theme:'links'`) | Deep pot bunkers: depth 1.5+, lip 0.4+ on an ellipse. A traced outline's walls are as wide as 0.45 of its inscribed radius, so a small or thin one needs less depth for the same wall: check it against the hop guard (Riviera No. 6 §5) |
| Green | an ellipse **or a traced outline `{pts}`**, `tilt:{x,z}` plane slope, `pin` | Contours from `step`/`hollow` features |
| Traced outlines | `pts` from `node tests/tools/trace.js <id> --snippet` | One number, `ell(x,z,shape)`, decides every green and bunker rule: heights, surfaces, colours, tree keep-out and the green's shader (fed per vertex). An outline reads 1 on its edge, 0 at its deepest point, and grows by 1 per `ro` yards outside (`ro`: the radius of a circle of the same area), so a fringe or a lip is as wide as on an ellipse of that size. `prepShape` in `index.html` |
| Look (§1.5) | `theme` (`links`, `coast`, `parkland`, `lakes`), `g:{...}` ground-colour overrides, `props:[...]`, `town:[u0,u1]`, `leaf`, `gold`, `iceplant`, `clubhouse`, `bridge` | Look only. The theme picks the ground palette, sky and haze and the backdrop |
| Surfaces | `SP` table: TEE, FAIRWAY, ROUGH, FRINGE, GREENS, SAND, WATER, PINE, **ROAD** (hard and fast, lie 0.80), **WASTE** (sandy waste area, grabs the ball, lie 0.82) | A new surface is one `SP` row, one name in `SURF`, one color in `colorAt` |

### 1.3 Shared gameplay systems

These are terrain-driven, so every hole gets them without asking:

- **StanceModel** (`// <stance-model>` in `index.html`). Reads the slope under the ball along the aim line. Ball above the feet starts left and hooks; below the feet, right and slicing; uphill flies higher and shorter; downhill lower and longer; any slope makes the needle swing faster (harder to time). The aiming arc includes the stance effect, so the arc never lies; there is no text label, the curving arc is the cue. The player answers with aim, a draw/fade pull, or a different club. Putts ignore it.
- **Play profile** (`play` on a hole): `wind:[min,max]` mph range; `windPush` for exposed holes (the HUD reads GUSTY); `firm` for fairway/rough run-out (links); `greens:{speed, firm}`; `stance` multiplier (0 turns sloping lies off). Each hole tunes its own copy of the surfaces; the next hole starts from the shared defaults.
- **BallModel**: flight, impact and roll against whatever terrain and surfaces the hole produces. Elevation, run-outs, banks that feed water, and greens that shed balls all come from it. **Backspin (2026-10-21):** a club's `back` (rpm; only the Wedge has one, 9500) bites on the first landing through Penner's critical-angle model, as the open-source OpenFairway library uses it (MIT, github.com/digitalhand/openfairway): above 15.4° the run along the ground can turn negative, so a full wedge checks up or spins back about 5 yd on a green. The surface's `spinback` (green 1, fringe 0.55, others 0) scales it, and spin falls with the square of swing speed, so chips barely spin. It only ever removes run, so no other club or hole check moved.

### 1.4 What stays the same

Swing (SwingModel), the rainbow meter, mobile controls, scoring and the HUD are untouched; the look layer (§1.5) changed the art but not the comic post-process. The only engine changes outside the terrain code are: the stance effect wired into the shot, arc and needle; the wind range/push; the aim camera stepping in on downhill lies, keeping the ball in sight over rises and always above the bottom HUD; and the ground beyond the modelled area sitting below the hole's lowest point (valleys used to be covered by it).

### 1.5 The look layer (visual pass, 2026-10-21)

What made the holes look second-rate was not the terrain data but the view: primitive trees, bare ground, nothing at mid-distance, and none of a hole's landmarks. These pieces fix that for every hole, and a new hole gets them by naming a theme and listing its props:

| Piece | Where | What it does |
|---|---|---|
| **Theme** | `HOLE.theme`; `THEME_G` (ground palette), `SKY` (sky and haze) in `buildWorld`, `paintBackdrop` | `links`: drier yellow-green turf, straw-gold rough with mossy hollows, warm low-sun sky, gold fescue clumps, revetted bunkers. Other themes keep the original palette. A hole can override any colour with `g:{rough:'#...'}` |
| **Props** | `HOLE.props`; built in `buildWorld` | `{type:'sheds', pts, d, h}`: a run of dark timber sheds with slate roofs, built back from the front line `pts`. `{type:'building', x,z,w,d,h, floors, rot, col, roof}`: a big block with rows of windows (some lit), a cornice and a roof: a hotel, a clubhouse. Walls get boards, windows or stones from `facadeMat` in the shader, so any box gets them without textures. **A prop is look only: give it a `wall` obstacle along the same line (`look:false`) if a ball should hit it** |
| **Town skyline** | `HOLE.town:[u0,u1]` | Painted terraces with slate roofs, chimneys, towers and spires on the backdrop between those points (0.5 = straight down the hole, bigger = to the left) |
| **Nature models** | `assets/nature/` (built by `tests/tools/nature.py`); `NATURE`, `loadNature`, `placeNature` in `index.html` | Quaternius' Stylized Nature MegaKit (CC0): 5 oaks, 5 pines, 5 twisted trees (cypress; their red leaves repainted green), dead trees, bushes, rocks, wispy grass and more, quantized into one 3.3 MB bundle plus small textures (4.3 MB in all). Tree kits map `pine`, `tallpine` (stretched), `oak`, `cypress`; `palm` and azaleas keep the old shapes. Sizes, spacing and the trees' collision are unchanged. The game draws the old shapes first, loads the bundle, then rebuilds the world; if the bundle cannot load it stays on the old shapes |
| **Grass carpet** | the `grass carpet` block in `buildWorld` | Dense crossed cards of grass blades in the rough beside every fairway and round every green, dark at the base and lighter at the tip, swaying (after FluffyGrass, MIT). On links, the pack's wispy fescue clumps near play and cheaper blade tufts further out. **All grass flattens within about 2 yd of the ball**, so a ball in the rough is always visible |
| **Revetted bunker faces** | the `revetted bunker faces` block | A finer mesh of its own for each such bunker: stacked-turf layers from the lip down, fine sand on the floor. The coarse terrain mesh leaves a hole for it. It follows `H` exactly, so the look matches the bunker the ball plays |
| **Relief shading** | after the terrain's normals | The terrain's shading normals are tilted 3× so gentle swales read in the light. Look only: the ball reads `H`, never the mesh |
| **Land to the horizon** | `ground beyond the modelled area` | A grid out to 1,250 yd with the sea cut out, read from the water bodies' own distance (so it cannot cover the sea whichever way an outline is drawn: Pebble's did until 2026-10-21) |
| **Tee** | the tee-box block | Flush with the ground: the pad is the terrain's TEE colour plus two markers, no raised slab |

Performance: the busiest hole draws about 1.3 M triangles in about 50 draw calls; nothing has been timed on a phone. If a phone struggles, the levers are the carpet count (`NC`), the fescue count (`NT`) and the shadow map size.

## 2. Workflow: adding a famous hole

Each step produces something checked into the repo. `node tests/tools/validate.js <id>` runs the whole Validate step (6) for a hole; step 7, the visual review, checks it looks like the real one; every tool in `tests/tools/` is described under "Tools" below.

**The fast lane** (the default since Sawgrass No. 17; aim for 10–15 minutes a hole, several holes to a session). Riviera and Sawgrass each took about an hour, most of it building and debugging tools that now exist, and a long write-up. A hole now goes:
1. A map pin on the green → `lidar.py fetch --pin … --download`, `lidar.py look` (tee and direction; a yardage-book compass settles it), the frame in `docs/holes/trace/<id>.json`.
2. `lidar.py build <id>` → paste its bunkers, water, height ramps and green tilt into the hole; drop the hollows that belong to neighbouring holes (each candidate's comment says where it sits).
3. With an aerial: trace the green (and any bunker too small for 1 m lidar) and place the photo with `lidar.py match`; without one, keep the green's ellipse and say so.
4. `validate.js <id>`; fix only what fails, logging each check change in §6.
5. **Dress the hole** (§1.5, step 6b below): theme, props for the landmarks a player would name, a town or treeline backdrop. Look at `render.py <id> tee approach aerial`.
6. A short §8 (template): what changed, renders, one verdict line per area, open items.

A tee photo, matched cameras for every photo and sensitivity runs are **optional**: worth it when the direction or a size is genuinely in doubt, not by default. Batch holes whose references are ready, and start each batch in a fresh session briefed from these docs.

1. **Research** → `docs/holes/<id>.md` §1–2. Read real sources; write down the real par and yardage (every figure the sources give, with the year if the hole has changed), the signature features and the one-sentence strategic problem. **If the par or yardage you were asked to build differs from what the sources say, write the mismatch in §1 as a question and ask before building** ("asked for par 4, 450 yd; every source says par 5, 576–588 yd since 2014: which one?"). Do not quietly pick one. If you cannot say what decision the hole forces, you are not ready to build it.
   **Then gather references** (the gate before building: §2.1). A hole is not built from words alone any more: Riviera No. 6's written sources got the pieces right and every shape wrong.
2. **Analyze** → §3. Tick the challenge archetypes and pick the primary one. That is what must survive translation.
3. **Translate** → §4 and the `HOLES` entry. Lay out the route, fairway, green and pin first (the straight line tee → pin is the yardage shown on the hole card), then add features from the catalogue, water, bunkers and a play profile. If a feature cannot be expressed, list it as a capability gap; do not special-case it in the engine. **Trace first** (step 7's tools, run now rather than after Validate) and lay the green, bunkers and heights from the references: `python3 tests/tools/lidar.py outlines <id>` reads the water, islands, bunkers, the heights along the hole and the green's plane straight into hole coordinates from the lidar, before a photo is opened, and `lidar.py match` places a near-vertical aerial on the lidar (Sawgrass No. 17); shapes and heights from the lidar and photos, decisions from the sources. Every departure from them is declared (`exaggerate` per outline, a reason in §5).
4. **Exaggerate** → §5. Amplify the primary challenge until it decides real shots in our club distances (245/215/155/90 carry). Keep the shape recognizable; simplify the rest. **Exaggerate the decision, not the shape**: stay inside the realism bounds below, or say in §5 why this green is an exception.
5. **Implement** → write the hole's checks in `tests/hole-checks.js` *before* tuning: single shots with required outcomes, and strategies whose comparison must come out a certain way for sharp and shaky players. Then tune feature parameters until they pass. A check that has to change after tuning goes in §6's check-change log, with the reason.
6. **Validate** →
   - `node tests/tools/validate.js <id>`: the hole's checks, its map, its slope map and realism bounds, and its before/after report in one go
   - or one by one: `node --test tests/*.test.js` (all suites), `node tests/hole-map.js <id>` → `docs/maps/<id>.png` (surfaces, contours and the check shots traced: white = dry, red = water/OB, dot = first bounce), `node tests/tools/slope.js <id>` → `docs/maps/<id>-slope.png`, `node tests/hole-report.js --hole=<id>`
   - play it in the browser: `python3 tests/tools/render.py <id>` for the tee, bird's-eye and approach views (and the ball-versus-HUD numbers), then the key shot by hand.

6b. **Dress** → the `HOLES` entry's `theme`, `props`, `town` and look fields (§1.5), and the spec's §4. Start from **the view from the tee**: it is most of what makes a hole iconic (St Andrews No. 17 is the drive over the sheds; Riviera No. 6 is the hedge and the houses on the hill), and it is what the lidar pipeline never captured. List the two or three things a player would name from the tee and from the approach, then place a prop for each. If a prop should touch the ball (the sheds, a wall), add a `wall` obstacle on the same line with `look:false`, probe the shots that hit it (`probe.js`), and add a check. Look at `render.py <id> tee approach aerial` and one bird's-eye; a renders strip (views side by side) is the quickest way for the owner to react. Props that no generic type covers (a bridge, a lighthouse): a Meshy model is fine for one-off hero pieces, loaded like the nature bundle.
7. **Visual review** → `docs/holes/trace/<id>.json` and the spec's §8. The checks say the hole plays as designed; this says it looks like the real one, and lists what does not. Since tracing moved to step 3, this step confirms rather than discovers: renders, a one-line verdict per area, the open items (the template's short §8). The full machinery below is for when a direction or a size is in doubt.
   - **Reference images.** At least one per hole: an aerial of the green complex traces best; a photo from the tee is the second, and fixes direction (Riviera No. 6 needed both). **Photos are never committed**: they are other people's pictures. Keep them in `tests/tools/refs/` (git-ignored; the repo's `.gitignore` also refuses images in `docs/holes/trace/` and side-by-sides in `docs/maps/`). The trace file records each by file name, size, sha256 and source, so anyone can tell whether they have the same photo.
   - **Trace.** In the photo's own pixels: outlines (`python3 tests/tools/trace_photo.py fill <photo> u,v` floods bright sand; `grid` gives a gridded zoom for tracing a green by hand), and camera constraints: a `point` whose hole coordinates you decide (keep a feature the checks are built around where it is), a `vertical` of known height for scale (a flagstick: 7–8 ft, times the hole's length scale), and **landmarks** seen in two photos, whose positions the fit solves for. `trace_photo.py show <id>` draws it all back on the photo to check.
   - **Fit and back-project.** `node tests/tools/trace.js <id>` fits every photo's camera together (position, yaw, pitch, roll, field of view; principal point at the photo's centre) by least squares, holding what the file says to hold, and prints each constraint's residual in pixels. It says how many equations spare there are: with none, the residual checks nothing. It then lays each outline on the hole's land and compares it with the shape the hole has (`--ref=<commit>` for the hole as it was): width, depth, area, centroid, overlap. A `sensitivity` list in the file reruns the fit under each assumption changed (a held parameter moved, a constraint dropped or added) and shows how far the outlines move; a run whose residual jumps is ruled out. A photo taken from far away (a tee shot of a green 140 yd off) cannot place its own camera: hold its position and use it for directions only, as Riviera's tee photo is; its heights are not measurable that way either. `--write` stores the cameras and outlines in the file; `--snippet` prints the `pts` for `index.html`. An outline drawn bigger or moved on purpose says so in the file (`exaggerate: {scale, shift}`) and in §5: **exaggerate the decision, not the shape** still holds, so it is the exception.
   - **Matched renders.** `python3 tests/tools/render.py <id> ref --out docs/maps`: the game seen from each photo's camera, at the photo's shape, HUD hidden, the outlines drawn on top (commit these). With the photos at hand it also writes side-by-sides to `tests/tools/out/` (never committed: they contain the photo). `aerial` is the same kind of picture for a hole with no photo yet.
   - **Verdict** (§8 of the spec, from the template): one line per area (tee and direction, heights, green, bunkers, water and surroundings): **matches**, **close**, **differs: fix** (expressible now; say whether it changes play, and then it needs checks), **differs on purpose** (§5) or **can't express yet** (name the primitive). Then the open items, most important first. Riviera's and Sawgrass's specs keep the longer checklist this replaced; it is not needed again.
   - A hole without photos still gets a **review-only** pass: the same lines against the renders and the sources. It says which photos to get.

### Realism bounds (step 4)

A hole should be hard in the way the real one is hard, not hard everywhere. Pinehurst No. 5's first green was a dome: the whole surface sloped, steepest halfway out ("a turtle shell"), so the hole had a decision but no putting surface. The default bounds, measured on the putting surface with `node tests/tools/slope.js <id>` (bands of a green-reading map: under 1 %, 1–2.5 %, 2.5–4 %, over 4 %):

| Bound | Default | Why |
|---|---|---|
| Falloff ring | no more than ~35 % of the surface steeper than 4 % | Steep ground belongs at the edges, where the real green sheds the ball |
| Top | mostly 1–2.5 % (at least half of the surface that is not steep), with some pockets under 1 % (5–40 % of the surface) | A top that putts like a green: gentle movement between flatter pockets, not a table and not a ramp |
| No full-green dome | not both: more than 60 % of the surface steeper than 2.5 % *and* slopes pointing every which way | A dome is steepest halfway out and has no flat top. A uniformly tilted plane (Augusta No. 13's back-to-front slope) is a different thing and is not flagged as one |

`slope.js` prints ok / WARN for each; `--strict` makes a WARN a non-zero exit. A WARN is a prompt, not a veto: look at the picture, then either reshape the green or write the reason in the spec's §5 (a real green that is one tilted plane has no flat pockets, and that is fine if the spec says so). The green's *shape* is not where to exaggerate. Exaggerate what the ball does at the edge and which shot the hole forces.

### Checks that say what the baseline can support (step 5)

Strategy checks compare plans using a simplified expected-strokes baseline (below). Write each one in terms of what that baseline can actually show, and quote it from `hole-report.js`: **hazard rate** (share in water/OB), **green rate** (share finishing on the putting surface), and **payoff gap** (strokes the aggressive plan saves over the safe one, for the sharp and the shaky player). Do not assert "X is the right play for a shaky player" unless the numbers show it: if the baseline calls it a wash, assert the rates and the gap and say so in the spec. Several holes are honest about this already (Augusta No. 12, Pinehurst No. 5).

When a check changes after tuning, log it in §6 of the spec (the template has the table): what it said, what it says now, and why. "It failed" is not a reason; "the baseline now charges the back bunkers, so the middle costs a shaky player 0.10 stroke where it used to cost 0.01" is.

### What the tools cannot see (found on Riviera No. 6)

- **Putts.** `playShot` cannot play a Putter: it has no launch arc, so the aim-power search returns NaN. Any recovery that is a putt (around a bunker, across a tier) is neither tested nor priced. Write such a hole's checks around shots that can be played, and say so in §4's capability gaps.
- **The green is priced by distance alone.** A ball on the putting surface pays `PUTT[distance to the pin]` whichever quadrant it is in, and the recovery term returns 0 for it. A bunker, a tier or a false front *inside* the green changes the baseline only when a ball finishes in the bunker. Count how many green finishes have a hazard on the straight line to the pin (Riviera No. 6: 20 of 21 for the bail-out plan) and write what the baseline under-charges in the spec's §6, as a bound on the gap, not as a score.
- **A bunker's charge follows its depth, so changing a bunker for a physics reason changes the strategy numbers.** The recovery term charges 0.35 per yard of face above the 1.0 yd allowance; softening Riviera's back bunker to pass the hop guard in `tests/ball.test.js` took its charge from 0.55 to 0.46.

### The expected-strokes baseline

`tests/hole-play.js` scores where a ball finishes with a tour-style table by distance to the pin, plus a lie charge (`LIE_ADD`: rough 0.18, sand 0.35, ...), plus a **recovery-difficulty term** read off the hole's real terrain, so that a hole does not need lie costs of its own:

| Part | Meaning |
|---|---|
| `up` | The face the ball has to climb: the highest ground within 10 yd along the line to the pin, above the ball (a bunker lip, a falloff, a shaved bank: a lie below the green edge), less a 1.0 yd allowance, since a normal bunker lip is already in the lie charge. 0.35 stroke per yard. An ordinary approach up to an elevated green from open fairway has no face and pays nothing |
| `short` | Short-sided: the pin is within 6 yd of the green's edge nearest the ball, and the ball is close to that edge. Up to 0.30 stroke; not charged on the fringe (you can putt it) |
| Reach | Full weight inside 45 yd of the pin, fading to nothing at 90 yd; balls on the green pay nothing (the putt table has them). The sum is capped at 1.0 stroke |

The constants were set from how much a recovery costs, not tuned to make any check pass. (The first version also charged "the pin's ground sits above the ball", which wrongly taxed every approach to an elevated green, including Pinehurst's lay-up; that part was dropped.) `evaluate()` reports the mean charge as `recovery`, and `opts.recovery:false` (or `--no-recovery` on `aimscan.js`) gives the previous distance-and-lie-only baseline for comparison.

`lieAdd` (a per-strategy override of the lie costs in `hole-checks.js`) remains as a **last resort** for a hazard the baseline still understates. No hole uses it now (St Andrews No. 17 did, for its bunker, until the recovery term made it unnecessary); if you reach for it, log it in §6.

### When the catalogue is not enough

Add the missing capability once, generically, and give it its own test in `tests/holes.test.js`. Phase 4 did this for St Andrews No. 17 and Pinehurst No. 2:

| Real feature | Expression |
|---|---|
| Road Hole Bunker (deep pot eating into the green) | bunker with `depth:2.8, lip:0.9` |
| The road behind the green | `ROAD` surface (one `SP` row, `lie:0.80`) via `cover` |
| The stone wall behind the road | `obstacles:[{type:'wall',...}]` via the `collide` hook, which now runs on the roll as well as in flight |
| Sandy waste areas | `WASTE` surface via `cover` |
| Plateau green with falloffs | `hollow` with negative `depth` and `flat` |
| Blind drive over the hotel corner, out of bounds along the hotel | **still a gap**: no blind-shot or side-OB primitive |
| A green or a bunker with its true outline instead of an ellipse | **traced outlines** (`green:{pts}`, `bunkers:[{pts,...}]`), added with the visual review for Riviera No. 6: `prepShape` gives an outline the same `ell()` the ellipse has, and the green's shader now takes `ell` per vertex instead of computing the ellipse itself, so an outline cannot play one way and render another. Existing ellipse greens render as before (0.08 % of pixels differ, at the anti-aliased edge) |

### 2.1 References: what a hole needs before it is built

Learned on Riviera No. 6 (its spec's §8): written sources place the pieces but get their shapes wrong; one aerial cannot orient a tracing (a tee photo fixed the camera's direction, about 6° off); a photo from far away gives directions but not heights; and the lidar then found the photos' one size assumption 9 % off and gave every height the photos could not.

| | Required | Optional |
|---|---|---|
| **Heights and layout** | **Lidar** (bare-earth elevation, 1 m): the bunkers show as depressions, tees as pads, and every height from tee to green and behind it. US holes: USGS 3DEP 1 m DEM, public domain. Scotland: the Scottish Public Sector LiDAR (Open Government Licence v3). Locate the hole with a map pin on one feature | A downloadable 3D model (Sketchfab and the like): few exist for these holes, check the licence |
| **Shape** | An aerial or near-top-down photo of the green complex (outlines are traced on it; the lidar alone is too coarse for a green's edge) | A second aerial angle |
| **Direction** | A yardage-book page with a compass, or a photo from on or behind the tee (the lidar shows where the tee pads are; one of these says which) | the other |
| **Scale** | The lidar (fit the traced bunkers to its sand: Riviera's `lidar.fit`); without it, a flagstick in the photo, and say the scale is an assumption | — |
| **Look** | — | Backdrop photos (buildings, hedges, trees: for props), a low-sun or rain photo of the green (contours) |

**Not usable:** Google Earth / Maps imagery and 3D tiles. Their terms forbid geodata extraction and objects "traced, or otherwise derived by hand or machine" from them. Golf-sim courses (GSPro, PGA 2K and the like) are locked to their games.

**What lidar cannot do:** a 1 m grid resolves a green's plane and a tier, not putting break; it is dated (a renovation since the flight is not in it); trees are stripped out. Photos stay for colour, sand edges, what the player sees, and props.

**Getting it in the sandbox:** the session's network allowlist must include `tnmaccess.nationalmap.gov`, `prd-tnm.s3.amazonaws.com` and `elevation.nationalmap.gov` (claude.ai → Settings → Capabilities → Allow network egress → Additional allowed domains). `python3 tests/tools/lidar.py fetch --pin <lat,lon> --download` asks the National Map API for the 1 m DEM tiles covering the pin and saves the newest (100–330 MB) into `tests/tools/refs/` (git-ignored); the tool reads it with `tifffile` and `pyproj` (pip, through the session proxy). Like photos, **the lidar tile is never committed**; the trace file records its source, tile name, the frame that places it on the hole (`lidar.frame`) and what was read from it (`lidar` in `docs/holes/trace/riviera-6.json` and `sawgrass-17.json`). The point clouds (LAZ, with intensity that would show sand) are on `rockyweb.usgs.gov`, which is not reachable from the sandbox.

**Finding the tee and the direction:** `lidar.py look <tile> --pin <lat,lon>` draws the shaded relief round the pin with distance rings and flat pads marked. A tee is a flat pad at the hole's distance; on Sawgrass two kinds of pad were in range (a strip by the water, pads on a spectator mound), and a yardage book's compass and the tee photo's look decided between them. Then the frame (pin, bearing, game yards per metre) goes in the trace file and every other `lidar.py` command reads it.

**What 1 m does to edges:** a vertical edge (a bulkhead, a wall) is smeared over a cell or two, so a shoreline read at the water's own level is too wide: Sawgrass's island read 36.5 × 34 yd at the water and 32.5 × 29 yd at half the bulkhead's height, and an aerial sized against the first came out 11 % too big. Read a walled shore at half its height (`water.tol`). Bunkers come out as closed hollows (`sand`): a valley or the foot of a bank drains and is left out, but other holes' bunkers and drainage swales are listed too, so pick by place.

**Collect per hole:** a map pin on the green (from Google Maps: a pin is a location, not extracted imagery), an aerial of the green complex, and the direction: a yardage-book page with a compass, or a photo from the tee. Backdrop photos when the look matters. Riviera No. 6 and Sawgrass No. 17 have all of them.

### Tools (`tests/tools/`)

| Tool | What it does | Used in |
|---|---|---|
| `validate.js <id>` | Hole checks + map + slope map and bounds + that hole's report section, with a ✓/✗ summary | Step 6 |
| `probe.js <id> '<json shots>'` | Plays single shots and prints end, surface, yards to the pin, first bounce, stance, wall strikes | Steps 3–5: finding where a shot lands before writing the check |
| `aimscan.js <id> <from> <club> <x0,x1,z0,z1,step>` | Plays one shot at a grid of aim points as a sharp and a shaky player: expected strokes, green rate, wet rate | Steps 4–5: choosing an aim point and seeing how forgiving a target is |
| `slope.js <id>` | Green slope map (bands, contours, downhill arrows) and the realism bounds | Steps 4 and 6 |
| `render.py <id> [views] [--js EXPR]` | Real-game screenshots in headless Chromium (tee, bird's-eye, approach, green) and where the ball sits against the HUD. It serves the game's own files (so the nature bundle loads), waits for the models, reports browser warnings, and `--js` evaluates an expression inside the game after the hole loads (debugging: camera, world, a rebuild) | Steps 6 and 6b |
| `nature.py <unzipped pack>` | Packs Quaternius' Stylized Nature MegaKit (standard, CC0) into `assets/nature/`: which models (`MODELS`), texture sizes, the cypress leaf repaint. The pack itself is not in the repo | Only to change the bundle |
| `card.py <n> <name> <par> <yards>` | A placeholder hole card in the card1–3 layout | After step 3, until real art exists |
| `trace_photo.py grid / fill / show / hash` | Reads outlines off a reference photo: a gridded zoom to trace by hand, a flood fill that returns a region's outline, the trace file drawn back on the photo, a photo's size and sha256 (Pillow) | Step 7 |
| `lidar.py fetch / look / outlines / build / fit / match / selftest` | The lidar into hole coordinates: fetch a tile from a map pin; find the tee and direction; read water, islands, walkways, bunkers, the heights along the hole and the green's plane as `pts` (and their overlap with the hole as it is); `build` writes them as the hole's `bunkers`, `water`, height `ramp`s and `tilt`, ready to paste; refit traced bunkers to the lidar's sand (Riviera's `lidar.fit`: scale and bearing); place a near-vertical aerial on the lidar's land (`match`) and write its camera constraints. Python: numpy, scipy, scikit-image, tifffile, pyproj | Steps 1, 3 and 7 |
| `trace.js <id> [--write] [--snippet] [--ref=<commit>]` | Fits each photo's camera, solves the landmarks, lays the outlines on the hole's land; residuals, the comparison with the hole's shapes and the sensitivity runs. The trace file can hold the land the photos were fitted on (`ground: {land: <commit>}`, so adding real heights later does not move the fit) and a measured size correction (`rescale`, e.g. from lidar) | Steps 3 and 7 |
| `render.py <id> ref` / `aerial` | The game from each photo's matched camera with the outlines on top (and side-by-sides with the photo, kept out of the repo); `aerial`: the green complex from a drone's height, for holes with no photo | Step 7 |

Usage lines, flags and examples for each are at the top of the file and in `tests/README.md`.

### Environment notes

Things that bit in the sandbox and in shallow clones:

- **`hole-report` needs history.** It compares with `git show 548d49a:index.html`. In a shallow clone run `git fetch --unshallow` first (if the host refuses that, a bounded `git fetch --depth=1000 origin main` is enough). Without it the tool stops with that hint.
- **Fetch all branches.** A clone made with `--depth 1` or `--single-branch` only tracks `main`. Run `git config remote.origin.fetch '+refs/heads/*:refs/remotes/origin/*'` before fetching so other branches' history is there to compare against.
- **Open pull requests through the REST API.** The GraphQL API is blocked in the sandbox, so `gh pr create` fails. Use `gh api repos/<owner>/<repo>/pulls -f title=... -f head=<branch> -f base=main -f body=...`.
- **`render.py`** needs Python with `playwright` and its Chromium, and fetches three.js r128 once into `tests/tools/.cache/` (sparse clone of the `r128` tag, or `npm pack three@0.128.0`). WebGL is software, so a hole takes 10–60 s to build; nothing has run on a phone. `card.py` needs Pillow.
- **`trace_photo.py`** needs Pillow; put reference photos in `tests/tools/refs/` under the `image.file` name their trace file gives (the folder is git-ignored).
- **Node 18+** for everything else; no installs.
- **The nature pack.** quaternius.com and opengameart.org are not reachable from the sandbox. The standard pack is mirrored as a GitHub release asset: `curl -L -o pack.zip https://github.com/Noisemaker111/jgengine/releases/download/packs/quaternius-quaternius-stylized-nature.zip` (104 MB; unzip, then `python3 -I tests/tools/nature.py <dir>`). Only needed to change the bundle.
- **Previewing as a claude.ai artifact.** An artifact cannot serve a `.bin` file, so publish a copy of `index.html` with `nature.bin` renamed to `nature-bin.wasm` (in the copy's fetch and in the files map). GitHub Pages needs nothing.
- **The live site is not reachable from the sandbox** (`kcq101.github.io` is not on the allowlist), so a fix cannot be checked there from a session; the owner refreshes on the phone.
- **Project doc mirrors.** The Claude Project "The Fred" holds read-only copies of this file (`claude/iconic-holes-design-system.md`), `docs/holes/TEMPLATE.md` (`claude/iconic-hole-template.md`) and `docs/HANDOFF.md` (`claude/handoff.md`), each headed with the source commit it was copied from. The repo is the source of truth: after merging a change to any of them, re-copy it into the Project (`project_write`, same path, header updated to the new commit). Never edit the copies.

## 3. The holes so far

The first three are the Phase 3 proofs; holes 4–7 (Phase 4 and after) were added with this workflow.

Chosen because they share almost nothing:

| Hole | Primary challenge | Mostly expressed by | Visual review (§8 of its spec) |
|---|---|---|---|
| [Pebble Beach No. 8](holes/pebble-8.md) | Distance control off the tee, then a forced carry over a chasm | the coastline and heights **from the 2017-18 lidar**; the green and five bunkers **traced on a drone photo placed by a homography on their lidar hollows**; the sea brought in under the bank short-right (§5) | **fast lane, lidar + photo** |
| [Augusta No. 13](holes/augusta-13.md) | Risk/reward from a sidehill lie: go for it over the creek or lay up | the tributary, bunkers and heights from the corner on **from the 2018 lidar**; the green **traced on a rendering placed by its four lidar bunkers**; `ramp` (speed slot, §5), `tilt` + StanceModel | **fast lane, lidar**: the frame holds the second leg only (the real dogleg is sharp) |
| [TPC Sawgrass No. 17](holes/sawgrass-17.md) | Pure distance/direction control to an island, in the wind | the lake, island, walkway and heights **from the lidar**; the green and a pot bunker (×2 on purpose) **traced on an aerial placed by the lidar**; a mound round the bunker; `windPush` | **traced and signed off**: 2018 USGS lidar + aerial (matched, IoU 0.905) + tee photo (checks the direction to 2.5 px) |
| [St Andrews Old Course No. 17](holes/standrews-17.md) | Run-out to a green with a deep pot bunker, a road and a wall behind, on firm turf in wind | the Road Hole bunker, the road and wall lines, Scholar's and Progressing bunkers and the heights **from the Scottish lidar** (Phase 5, 50 cm); the bunker deepened to stand in for its revetted face (§5); `ROAD`, `wall`, `firm`, wind | **fast lane, lidar**: green an ellipse laid on the lidar's plateau (no aerial) |
| [Augusta National No. 12](holes/augusta-12.md) | Distance control over a creek to a shallow, wide, angled green in swirling wind | Rae's Creek, three bunkers and the heights **from the 2018 lidar**; the green **traced on a drawing placed by its lidar bunkers**; `windPush` | **fast lane, lidar** |
| [Pinehurst No. 2, No. 5](holes/pinehurst-5.md) | Par 5: go for an elevated plateau green from a sidehill lie, or lay up and wedge onto the top | heights and the fairway's slant (falling left: ball above the feet) **from the 2003 NC DEM** (3.4 m, no 1 m lidar here); plateau `hollow` (`flat`), runoffs + `WASTE` | **fast lane, coarse heights**: bunkers, waste and green unmeasured |
| [Riviera No. 6](holes/riviera-6.md) | Par 3: the decision is the pin, not the club: a bunker in the middle of the green, a tier between the two pin areas, a big bunker short and small ones behind and off the left end | the green and four bunkers **traced from two photos and sized by lidar** (the middle bunker ×2 on purpose), heights from the lidar (`ramp` ×4: a dip short of the green, the bank behind it), `step` + `hollow` + `tilt` on the green | **traced and signed off**: aerial + tee photo (rms 1.1 px) + 2025 USGS lidar |

### 3.1 What the visual review found, ranked

Riviera No. 6 and Sawgrass No. 17 were reviewed against photos and lidar; the other five went through the fast lane with lidar (Pinehurst with a 3.4 m DEM) and, where one existed, a drawing or photo of the green. Ranked by how much a gap changes the hole a player meets, across holes, then by how cheaply it closes:

| # | Gap | Holes | Kind | Changes play? | Next step |
|---|---|---|---|---|---|
| 1 | **Green and bunker shapes are written-source guesses.** On Riviera the tracing found the green 50 % too big, the middle bunker 3.5 × too wide, the back bunker 4.6 × too big, the "front-left" bunker 12 yd out of place and a fourth bunker missing. Sawgrass No. 17 traced from lidar and an aerial: the island a quarter smaller than its ellipse, the green a heart 5.6 yd further left, the pot bunker 11 yd left of where it was, on the line to the pin. St Andrews' and Pinehurst's greens are still ellipses (no aerial), and Pinehurst's bunkers are unmeasured | St Andrews, Pinehurst | **expressible now** (traced outlines) | yes: the shot each hole is about; checks may need retuning, as Riviera's did | lidar first (shapes and positions of the bunkers, the hole's direction), then an aerial of each green complex; trace, re-run the hole's checks. Order: ~~Sawgrass 17~~ (done); ~~Augusta 12, Augusta 13~~ (lidar bunkers, greens traced on drawings placed by them); ~~Pebble 8~~ (green and five bunkers traced on a drone photo placed on the lidar); ~~St Andrews~~ (Scottish lidar; green still an ellipse). Pinehurst 5 waits for 1 m lidar (NC 2015, `sdd.nc.gov`). `lidar.py` does the lidar half from a map pin |
| 2 | **Heights are design guesses.** ~~Riviera's tee, the dip and the bank behind the green~~ (built from the 2025 lidar: the "raised tee" was the dip in front of it); Pebble's climb, chasm and green knoll; the fall into Augusta No. 13's corner; Pinehurst's rise. A photo taken from 120 yd or more cannot measure them (Riviera's tee-photo fit runs away when asked) | Riviera, Pebble, Augusta 13, Pinehurst | expressible (`ramp`, `rise`); **data: lidar** (USGS for the US holes, Scottish public lidar for St Andrews; §2.1) | yes | ~~Augusta 13~~ (from the corner on; its drive keeps a designed speed slot), ~~Pebble~~ (lidar), ~~Pinehurst~~ (2003 3.4 m DEM: the fairway slants the other way), ~~St Andrews~~ (Scottish lidar). Heights run along the hole only, so a sideways bank (Pebble's fall to the sea right of the green) cannot be expressed yet |
| 3 | **Blind shots and side out-of-bounds.** St Andrews' drive over the sheds with OB along the hotel is played as an open fairway; Pebble's blind drive has no aiming rock | St Andrews, Pebble | **can't express yet**: a blind-shot primitive (what the player sees from the tee) and an OB line | yes: St Andrews' first shot is not the real one | design the two primitives once, generically |
| 4 | **Buildings and backdrops.** ~~St Andrews' hotel and sheds~~ (done 2026-10-21: `props` sheds and building, a town skyline, the sheds a solid obstacle). Riviera's hedge and houses on the hill (its signature view) | Riviera | **expressible now** (`building` props on raised ground); a hedge prop is still missing | sheds: yes (a low drive hits them); the rest look only | Riviera's houses with `building`; add a `hedge` prop type |
| 5 | **Deep bunkers in traced shapes.** A traced bunker's walls are steeper than an ellipse's at the same depth, and the ball model bounces off steep sand faces, so Riviera's front and middle bunkers are shallower than the real ones to pass the hop guard | Riviera now; St Andrews' Road Hole Bunker when traced. **The random-shot hop guard (`tests/ball.test.js`, under 3.5 yd) hid this on four holes:** it drew every hole's 600 shots from one stream, so it passed at its one seed by luck. Over ten seeds, each hole on its own stream (and counting dry ground only): St Andrews up to 7.9 yd, Augusta 12 up to 5.1, Pinehurst up to 5.5, Riviera up to 4.8, all off steep sand or banks; Sawgrass under 1.7 in every seed. **Measured since:** none of those hops starts on sand (it barely bounces); every one is a bounce on a grass lip, bank or falloff of 14–57°, where the bounce keeps its speed along the face and an uphill face sends it up. A rule that let steep faces grab that run cut the hops but also kept Riviera's wedge in its middle bunker and stopped run-ups onto Augusta 13's green, so it was not kept. The lever is the bunkers' shape: rebuild them from lidar (`lidar.py build`) with real depths and lips set into the land, then re-measure. **Done for Augusta 12, Augusta 13, Pebble and Pinehurst (2026-10-20)**: bunkers 0.4–0.55 yd deep, lips 0.25; highest hop over ten seeds, counted from the first touchdown (a lip graze at launch is not a hop): Augusta 12 5.34 → 3.05, Augusta 13 3.36 → 2.63, Pebble 3.87 → 2.66, Pinehurst 2.72 → 3.21 (a drive off the fairway bunker's lip). St Andrews 4.76 → 2.63 (the guard's own seed was a ball rolling into the old bunker's 31° grass lip at (15, 450)); the Road Hole bunker is deepened on purpose to stand in for its revetted face (its spec's §5). **The guard passes again** | **can't express yet**: a sand face that takes the pace off a ball (plugging, or a soft lip) | yes: recovery from the sand | a BallModel change with its own tests |
| 6 | Small things that are expressible now: Sawgrass' walkway (a band island), the side of Augusta No. 12's Hogan Bridge (data, to confirm), Riviera's cart path (a `cover` band) and its trees where the photos have them (tree zones) | Sawgrass, Augusta 12, Riviera | **expressible now** | no | do with each hole's photos |
| 7 | Cosmetic primitives: a sycamore tree type; a per-hole switch for the rocks scattered in every hole's rough; palms and azaleas as models (still the old shapes) | Riviera, Augusta (the rocks: every hole) | **can't express yet** (models: the nature pack has no palm or azalea) | no | when convenient |

### 3.2 Making tracing faster

In the order they save the most time:

1. ~~**Lidar to outlines.**~~ **Built: `tests/tools/lidar.py`** (Sawgrass No. 17). From a map pin and a frame (bearing, scale): water, islands (cut off a walkway), bunkers as closed hollows, the heights along the hole and the green's plane, all as `pts` in hole coordinates, with their overlap against the hole as it is. It reproduces Riviera's hand-made `lidar.fit` (scale 0.914 against 0.906, the middle bunker within 0.5 m; a test when the tile is present), and adds `match`: a near-vertical aerial placed and sized by the lidar's land, which on Sawgrass replaced the flagstick: the traced green came out within 3 % of its published size. What it cannot do: say which hollow is this hole's bunker (pick by place), or see a 2 m pot bunker (Sawgrass's came from the aerial).
2. **Semi-automatic green outline** (planned). One click on the green, then segment on colour that ignores brightness plus texture (a mown green is smooth), so shade like Riviera's right half does not break it. Target: re-find Riviera's hand-traced green at IoU ≥ 0.9.
3. **Landmark picking** (planned). A local page (opened from disk, never published, so photos stay on the owner's machine) showing two photos side by side, proposing landmarks from the flood-filled bunkers (ends, tips, tongues: all six of Riviera's were these) for a person to confirm.
4. **Guard rails in `trace.js`** (planned): warn with no spare equations, a residual over 3 px, or a required reference (§2.1) missing.
