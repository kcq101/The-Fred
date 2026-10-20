# Swing and ball-physics tests

Run from the repo root (Node 18+; no installs needed):

    node --test tests/*.test.js    # 154 checks (31 swing/wiring/fan + 24 ball physics + 87 iconic holes + 12 authoring tools; the two lidar regressions skip without their tiles)
    node tests/swing-report.js     # before/after tables (legacy swing math vs SwingModel)
    node tests/ball-report.js      # Phase 2 before/after tables (frozen old physics vs BallModel), real-hole fuzz, Node-only CPU timing
    node tests/hole-report.js [ref] [--hole=id]   # Phase 3 before/after: every hole's checks on the current holes vs commit 548d49a (or any git ref); holes added after that commit are compared with the same land stripped of its signature. Needs history: `git fetch --unshallow` in a shallow clone
    node tests/hole-map.js [id]    # top-down PNG of each hole with its check shots traced, into docs/maps/

Authoring tools, in `tests/tools/` (each file opens with its full usage and flags; the workflow they belong to is `docs/ICONIC-HOLES.md` §2):

    node tests/tools/validate.js <id>                                    # the Validate step in one go: the hole's checks + map + slope map and bounds + its report section, with a summary
    node tests/tools/probe.js <id> '<json shots>'                        # single shots: end, surface, yards to pin, first bounce, stance, wall strikes
    node tests/tools/aimscan.js <id> <from> <club> <x0,x1,z0,z1,step>    # one shot at a grid of aim points, sharp and shaky: expected strokes, green rate, wet rate
    node tests/tools/slope.js <id>                                       # green slope map (< 1 / 1-2.5 / 2.5-4 / > 4 % bands, contours, downhill arrows) -> docs/maps/<id>-slope.png, band shares, realism bounds
    python3 tests/tools/render.py <id> [tee bird approach green aerial ref]  # real-game screenshots in headless Chromium, and the ball's screen position against the HUD;
                                                                         # ref: the game from each reference photo's matched camera, outlines on top
    node tests/tools/trace.js <id> [--write] [--snippet] [--ref=<commit>]  # visual review: fit each reference photo's camera, lay the traced outlines on the hole, compare
    python3 tests/tools/trace_photo.py grid|fill|show|hash ...          # visual review: read outlines off a reference photo (photos live in tests/tools/refs/, never committed)
    python3 tests/tools/lidar.py fetch|look|outlines|fit|match|selftest  # the lidar into hole coordinates: tile from a map pin, tee and direction, water/islands/bunkers/heights as pts, Riviera's bunker fit, an aerial placed by the lidar (tiles live in tests/tools/refs/, never committed)
    python3 tests/tools/card.py <n> <name> <par> <yards>                 # a placeholder hole card in the card1-3 layout -> cards/card<n>.jpg

## What these are

- `swing.test.js` — **automated**. Reads the clubs, surface table and `SwingModel` straight out of `index.html` (nothing copied) and
  checks them on a **flat-ground mirror** of the ball physics (`harness.js: flatShot`), which re-implements the airborne drag/wind/spin
  and bounce/roll branches of `physStep()`.
- `shoot-wiring.test.js` — **automated smoke test** of the real `shoot()` text from `index.html` against stubbed globals:
  which popups fire, launch direction/speed, putter path.
- `fan.test.js` — **automated**: the see-through rainbow arc and arrow (shape, gradient, arrow path and on-screen size, extracted from `index.html`) and the real `drawFan()` against stubbed DOM and camera.
- `ball.test.js` — **automated**, Phase 2. Runs the game's real `BallModel` (extracted from `index.html` between `// <ball-model>` markers, nothing copied) on
  synthetic terrains (flat, slopes, side slope, ridge, bank into a basin) and on the game's **real terrain code** for the three holes (`loadCourse`).
  Covers driver flat/up/down, iron fairway vs rough vs sand, wedge on green, sloped and side-sloped ground, ridge, near bunker/water, short shots,
  elevation checked against an independent integrator, wind, aiming-arc == live flight, summary (carry/roll/total) consistency, and 600 seeded random shots per hole.
- `holes.test.js` — **automated**, Phase 3. Traced outlines (a polygon reads like the ellipse it was sampled from; on Riviera No. 6, sand and green exactly inside their traced outlines), the terrain feature registry, play profiles and `StanceModel` on their own, then every hole's
  declared challenge from `hole-checks.js`: single shots with a required outcome, and strategies (two or more plans, each played by a
  "sharp" player, needle within ±0.2, and a "shaky" one, within ±0.55) whose hazard rates and expected scores must compare as designed.
- `hole-checks.js` — the per-hole challenge contracts (data). `hole-play.js` plays them the way a player does: the arc is pulled to the target
  through the real lie and stance, then the needle offset is applied. Expected score uses a simplified tour baseline (distance to the pin, a lie charge, and a
  recovery-difficulty term for balls that finish below a steep face or short-sided); it compares plans, it does not rate players. The term is unit-tested in `holes.test.js`.
- `tools.test.js` — **automated**. The authoring tools in `tests/tools/`: `trace.js` recovers a known camera and two views' shared landmarks from synthetic pixels, and fits Riviera No. 6's two photos to a few pixels with the hole playing the traced shapes; `trace_photo.py fill` traces a synthetic bunker; `probe.js` and `aimscan.js` agree with `hole-play.js` and refuse bad input; `slope.js` writes its PNG,
  its bands add up and its realism bounds pass Pinehurst No. 5's plateau while flagging the rejected dome; `validate.js` refuses a hole with no checks; `card.py` makes a card of the right size
  (skipped without Python and Pillow). `render.py` needs Chromium and a three.js fetch, so only its `--help` is exercised here.
- `legacy-ball.js` — the pre-Phase-2 ball physics (verbatim), used only as the "before" in `ball-report.js`.
- `legacy.js` — the swing math from commit `11d2b3f`, kept only as the "before" for the report.

## What these are not

- Not the live game. three.js is loaded from a CDN, so nothing here renders, runs the real terrain, trees, water, HUD or touch input.
- The flat mirror can drift from `physStep()` if the physics changes; the club-yardage test (shown yardage vs simulated carry) is the canary.
- No manual playtesting has been done, and there is no telemetry. "Feels right on a phone" is unverified.

## Phase 2 limits worth knowing

- Trees are not exercised (the model takes a `collide` hook; the tests don't supply real tree geometry).
- A ball that grazes the steep lip face of a bunker (grade above ~1) in the direction it faces keeps its speed and can skim across the sand and out. That is what the impact law gives for a graze; sand "plugging" is not modelled. `ball.test.js` therefore checks bunker landings on the floor and gentle banks only.
- CPU timings in `ball-report.js` are Node on a desktop-class machine, not a phone.
- Nothing here ran in a browser; feel on a phone is unverified.

## Phase 3 limits worth knowing

- The hole checks have no trees (Augusta's pines would stop some hooked shots in the game) and use no random jitter.
- "Expected score" is a rough baseline for comparing plans on the same hole, not a prediction of a real round. Its recovery term reads only a 10-yd window along the line to the pin and
  charges at most one stroke: it sees a deep bunker lip or a falloff, not a false front, a tier or a long sidehill chip.
- The in-game views were checked in headless Chromium (software WebGL); nothing has been played on a phone.
