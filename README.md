# The Fred

Arcade golf in a comic-book style. Pull back from the ball to set power, release when the swinging needle is as close to the middle of the rainbow as you can get it, and pull down-left or down-right to shape a draw or fade.

Seven holes, each built to play like the famous hole behind it:

- **Pebble Beach No. 8** (par 4) — the plateau ends at a cliff, so the driver goes in the sea; then carry the ocean chasm to a perched green.
- **Augusta No. 13** (par 5) — a drive that finds the valley leaves a reachable second, from a ball-above-the-feet lie that hooks toward the creek. Go for it, or lay up.
- **TPC Sawgrass No. 17** (par 3) — an island green in a gusty wind.
- **St Andrews No. 17** (par 4) — drive over the corner of the sheds, then run a long second onto a narrow green between the Road Hole bunker and the road.
- **Augusta No. 12** (par 3) — a short iron over Rae's Creek to a shallow green in swirling wind.
- **Pinehurst No. 2, No. 5** (par 5) — go for a plateau green from a sidehill lie, or lay up.
- **Riviera No. 6** (par 3) — a bunker in the middle of the green: pick your quadrant.

## Iconic holes

Holes are data, built from a small catalogue of terrain features (`rise`, `ramp`, `tilt`, `step`, `hollow`, `cover`) plus water, bunkers and a play profile (wind, turf firmness, green speed). Sloping ground also changes the shot everywhere: ball above the feet hooks, below slices, uphill plays short, downhill runs (the aim arc shows it). Each hole declares its intended challenge as testable shots and strategies, which run through the real physics.

- `docs/ICONIC-HOLES.md` — the architecture and the workflow for adding a famous hole
- `docs/holes/TEMPLATE.md` — the analysis and design template; `docs/holes/<id>.md` — the three filled in
- `docs/maps/` — top-down maps of each hole with its check shots traced
- `docs/HANDOFF.md` — where the project stands, what was decided, and what is open

## Run it

It's one HTML page with no build step. Open `index.html` through any static server (for example `python3 -m http.server`), or turn on GitHub Pages for this repo.

## Files

- `index.html` — the whole game (three.js r128 from cdnjs)
- `assets/nature/` — trees, rocks, bushes and grass (Quaternius' Stylized Nature MegaKit, CC0; see its `LICENSE.txt`), loaded at start-up
- `title/fred.jpg` — title screen art
- `cards/` — hole cards
- `music/` — soundtrack, played in a shuffled order: Midnight Heat, Neon Fairway, Heat of the City, Skyline Swing

## How a swing is scored

Pull back to set power; the needle then sets contact quality. The meter is a slightly see-through rainbow arc lying on the grass around the ball, flaring wider toward the ends, with a slim translucent blue arrow swinging from the ball across it. When you pull for a draw or fade, the arc slides round to center on the line the ball will actually start on. It has no hard zones: dead center (blue) is the cleanest strike, and every bit further out costs a little more distance *and* direction. The red ends are a CHUNK (the worst contact: roughly a quarter to over a third of the carry lost, plus a big miss).
Longer clubs are less forgiving than shorter ones. The only luck is a very small constant jitter that does not grow when you mistime. The numbers live in `SwingModel` (`index.html`) and the `dev` / `curve` / `mishit` values on each club.

## How the ball flies, bounces and rolls

One model (`BallModel` in `index.html`) drives the shot, the aiming arc and the putt preview. In the air: gravity, drag against the wind-relative velocity, and sideways spin, at a fixed 1/240 s step. The club's printed carry is where the ball first touches down on flat ground. On touchdown the impact is resolved against the ground's slope: a shallow arrival keeps most of its forward run, a steep one keeps little, softer surfaces (rough, sand) keep less, and the hop is small and dies out in one or two bounces. Then it rolls under friction plus gravity along the slope; a slope steeper than the surface can hold lets the ball slide to flatter ground. Uphill and downhill are not corrected for separately: the ball simply lands sooner or later. A full wedge's backspin bites on the green: it checks up or spins back a few yards (Penner's model, as OpenFairway uses it); chips barely spin. The popup after a shot shows `CARRY · ROLL`; the per-surface numbers are the `SP` table.

## Tests

`node --test tests/*.test.js`, `node tests/swing-report.js`, `node tests/ball-report.js`, `node tests/hole-report.js` (before/after for every hole's checks) and `node tests/hole-map.js` (redraws `docs/maps/`). See `tests/README.md` for what they do and do not cover.

## Controls

- **SFX** and **Music** toggles are separate (top-right in game, and on the title menu). The music setting is remembered.
- Drag the yellow ring to aim, pinch or scroll to zoom, number keys 1–5 pick clubs, Esc closes the menu.
