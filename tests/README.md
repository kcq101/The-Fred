# Swing and ball-physics tests

Run from the repo root (Node 18+; no installs needed):

    node --test tests/*.test.js    # 54 checks (30 swing/wiring/fan + 24 ball physics)
    node tests/swing-report.js     # before/after tables (legacy swing math vs SwingModel)
    node tests/ball-report.js      # Phase 2 before/after tables (frozen old physics vs BallModel), real-hole fuzz, Node-only CPU timing

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
