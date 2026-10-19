# Swing tests

Run from the repo root (Node 18+; no installs needed):

    node --test                    # 26 checks
    node tests/swing-report.js     # before/after tables (legacy swing math vs SwingModel)

## What these are

- `swing.test.js` — **automated**. Reads the clubs, surface table and `SwingModel` straight out of `index.html` (nothing copied) and
  checks them on a **flat-ground mirror** of the ball physics (`harness.js: flatShot`), which re-implements the airborne drag/wind/spin
  and bounce/roll branches of `physStep()`.
- `shoot-wiring.test.js` — **automated smoke test** of the real `shoot()` text from `index.html` against stubbed globals:
  which popups fire, launch direction/speed, putter path.
- `legacy.js` — the swing math from commit `11d2b3f`, kept only as the "before" for the report.

## What these are not

- Not the live game. three.js is loaded from a CDN, so nothing here renders, runs the real terrain, trees, water, HUD or touch input.
- The flat mirror can drift from `physStep()` if the physics changes; the club-yardage test (shown yardage vs simulated carry) is the canary.
- No manual playtesting has been done, and there is no telemetry. "Feels right on a phone" is unverified.
