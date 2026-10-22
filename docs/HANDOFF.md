# Handoff: where The Fred stands

Last updated 2026-10-21 (late evening), after PRs #18–#20 and #23 (the wedge-spin fix); PR #22 (drag and lift) is open. Start a new session by reading this file, then `docs/ICONIC-HOLES.md` (the pipeline) and `tests/README.md` (the tools).

## 1. The decision behind the latest work

After seven holes, the owner judged the output second-rate: the build pipeline was slow, bunkers looked like craters, and no hole captured its signature view (St Andrews No. 17's drive over the sheds was a plain open fairway). Two days of lidar and tracing had made the *ground* accurate but not the *picture*.

What was decided (2026-10-21):

- **No restart.** Keep the swing, the rainbow meter, mobile controls, the camera, the HUD, the music and the hole data. Most of the work done so far is in those, and none of them was the problem.
- **Holes are "inspired by", not replicas.** Famous holes stay the starting point because so much is written about them, but recognisable and fun beats measured.
- **Visuals first, to get excited about the game again; ball feel next.** Long term, the owner ranks ball feel (bounce, roll, bunkers, contours) as most important.
- **Borrow instead of building from scratch.** Three open projects, each matched to one weakness:
  - **Quaternius' Stylized Nature MegaKit** (CC0) replaced the primitive trees, rocks and bushes.
  - **FluffyGrass** (MIT, three.js) inspired the grass carpet.
  - **OpenFairway** (MIT, a Godot golf physics library) is the reference for ball physics. Its backspin model is ported; the rest is not yet.
- **Rejected:** moving the game to Godot to use OpenFairway directly. That would be a real restart, and Godot's web builds are heavy on phones.
- **Deferred:** upgrading three.js past r128. The gains came from the art, and an upgrade risks breaking all seven holes for little visible return.
- **Who it is for:** the owner and friends, on phones, through GitHub Pages. It's a hobby, so token cost matters: each step was sized to finish in one session.

## 2. What changed (PRs #13–#15, merged)

| Area | Change | Where |
|---|---|---|
| St Andrews No. 17 | Timber sheds across the drive, which also play as a dead wall. A hotel block, a town skyline, links colours, revetted pot bunkers, a rubble-stone wall | its `HOLES` entry; `docs/holes/standrews-17.md` §8 |
| Every hole | Hand-made trees, rocks and bushes; a swaying grass carpet that presses down round the ball; flush tees; a lower sun; stronger relief shading | `docs/ICONIC-HOLES.md` §1.5 |
| Pebble No. 8 | The sea had been drawn over in green (an older bug in the land-to-the-horizon sheet). Fixed for good | §1.5, "Land to the horizon" |
| Physics | Wedge backspin: a full wedge checks up or spins back about 5 yd on a green. Shed strikes are dead | §1.3; `BallModel` IMPACT |
| Tools | `render.py` serves the game's files, loads the models and takes `--js`. New: `tests/tools/nature.py` | `tests/README.md` |
| Pipeline | New step 6b, **Dress the hole**: theme, props, backdrop, starting from the view from the tee. The template has a look table and a verdict line for the view from the tee | `docs/ICONIC-HOLES.md` §2; `docs/holes/TEMPLATE.md` |

**Later the same day (PRs #18–#20, #23):**

| Area | Change | Where |
|---|---|---|
| Fairways | Softer mowing stripes that change light/dark with the view along the mowing; lusher and drier patches; smooth grain; a less lime base colour. Look only | the terrain shader; `docs/ICONIC-HOLES.md` §1.5, "Fairway turf" |
| Riviera No. 6 | Bunker depths from the lidar (middle 0.46, front 0.68, back 0.61, left 0.48; lips 0.25). They were up to 2.8 × too deep and read as craters. Every hole's bunkers now come from lidar | `docs/holes/riviera-6.md` (end); pipeline doc §3.1 item 5 |
| Wedge backspin in the live game (#23) | `shoot()` called `BallModel.begin` before setting the launch velocity, so the backspin from PR #15 saw a ball at rest and never happened in the browser (the hole checks launched in the right order, so they never saw it). Fixed, with a regression test. No hole check moved | `shoot()` in `index.html`; `tests/shoot-wiring.test.js` |

Tests: `node --test tests/*.test.js` gives 152 pass, 0 fail and 3 skipped (155 tests). The skips are the lidar regressions, which skip without their tiles. Every hole's checks pass. In a shallow clone, one tools test needs older history (see §2, "Environment notes" in the pipeline doc).

## 3. Open items to consider

In rough order of how much each would change what a player meets. Item 1 is in progress (below); the rest have not been started.

**Ball feel (the owner's top long-term priority)**
1. **Port more of OpenFairway's physics.** The next pieces are:
   - drag and Magnus lift from its wind-tunnel fits (our flight uses a simple drag constant);
   - its spin-dependent bounce (coefficient of restitution falls with spin and impact speed);
   - its surface presets (fairway, rough, firm, soft).
   Backspin went in without moving any hole check, and these may not. Do them one at a time, re-run `validate.js` on all seven holes after each, and log any check that changes (spec §6).

   **Status (2026-10-21, evening).** The drag and lift piece is ported on branch `flight-aero-openfairway`, draft PR #22, **not merged**. Full-swing carries held, but the ball now lands at real angles (driver 15° → 36°), and our impact law grabs by the tangent of the landing angle, so a driver's roll fell from 41 to 3 yd. 30 of 67 hole checks fail; the PR lists every number that moved.
   **Update (2026-10-21, night): bounce, ground friction and the knock-on fixes are in** (commits `95ed276`, `cecd3a0`, `ff4cfaf` on the same branch; PR #22 still a draft, **not merged**). A driver rolls 10 yd on flat fairway (main 41); slopes bring run-outs partly back. The wedge checks up but no longer spins back. Applied with the owner's OK: curve/shape × 0.40/0.43/0.54/0.72; windPush Sawgrass 1, St Andrews 0.6, Augusta 12 0.77 (GUSTY shows on any hole that sets it); `firm` also lowers rolling friction; late-roll ramp from 8 s. Tests 123 / 29 / 3.
   **Next (agreed plan, about two holes a session):** redesign the holes whose signature broke, each change logged in its spec's §6: St Andrews (tee forward; firm alone gained 7 yd), Pebble (tee forward so a pure driver reaches the chasm), Augusta 13 (landing at the valley's foot), Pinehurst (waste edge off the drive's landing), and rewrite the tailwind checks (Sawgrass, Augusta 12, St Andrews) around real downwind flight. Then the owner decides: wedge spin-back (try the green's boost from 3,000 rpm and look), and the 600-shot settle budget (12 s; flights alone now last up to 6 s).
   Don't merge #22 without the owner's OK.
2. **Bunkers that take the pace off a ball** (gap #5 in the pipeline doc's §3.1). A ball landing on a steep grass face keeps its speed and can hop out. A plugging or soft-lip rule was tried once and dropped because it broke two holes. It needs a fresh design with its own tests.
3. **Rapier (3D physics) for ball-versus-prop contact.** This only matters if props multiply. Walls are polylines today, which is fine for sheds and stone walls.

**The look**
4. ~~**The fairways still read as cartoonish.**~~ Done (PR #18). If they still look too striped on a phone, the stripe strength is one number in the terrain shader.
5. **Dress the other six holes** with step 6b:
   - Riviera No. 6's hedge and houses on the hill. Its signature view needs a `hedge` prop type, which doesn't exist yet.
   - Pebble's cliffs and sea view.
   - Augusta's azaleas and pines. Azaleas, palms and the tee markers are still the old shapes, because the pack has no azalea or palm. Meshy could make these.
6. **Phone performance has never been measured.** The busiest hole draws about 1.3 M triangles. If a phone stutters, the levers are the carpet count, the fescue count and the shadow map size. A quality setting may be worth adding.
7. **First load is about 4 MB heavier** (the nature bundle). The old shapes show until it arrives, then the hole rebuilds; there may be a visible pop.

**Missing primitives, both noted since Phase 4**
8. **Blind shots and side out-of-bounds.** St Andrews' drive is still not blind, and there's no OB along the hotel. Pebble's blind drive has no aiming rock.
9. **Sideways banks.** Heights run along the hole only.

**Housekeeping**
10. **An old branch, `phase4-three-more-holes`,** is not merged and predates this work. Check it, then delete or merge it.
11. **The claude.ai preview artifact** is a copy with `nature.bin` renamed, because artifacts can't serve `.bin` files. GitHub Pages is the real build.

## 4. How to work on it

- **Repo:** `kcq101/The-Fred`. One file, `index.html`, holds the whole game; `assets/nature/` holds the models. GitHub Pages serves main to the owner's phone.
- **Look at a change:** `python3 tests/tools/render.py <id> tee approach bird`, then put the views side by side in one image for the owner. A renders strip gets a reaction faster than a description.
- **Check a change:**
  - `node --test tests/*.test.js`;
  - `node tests/tools/validate.js <id>` per hole (in a shallow clone, run `git fetch --depth=2000 origin main` first);
  - `node tests/tools/probe.js <id> '<shots>'` for single shots.
- **Ship a change:**
  - branch;
  - open a PR through the REST API (`gh api repos/kcq101/The-Fred/pulls ...`; GraphQL is blocked);
  - merge it (`gh api -X PUT .../pulls/<n>/merge`);
  - re-sync the Project mirrors of the pipeline doc and the template if either changed.
- **Lidar tiles** are never committed: `python3 tests/tools/lidar.py fetch --pin LAT,LON --download` puts one in `tests/tools/refs/` (needs `pip install --break-system-packages numpy scipy scikit-image tifffile pyproj imagecodecs`). The USGS site is reachable from the sandbox.
- **Sandbox limits:** github.io, quaternius.com and opengameart.org are not reachable. The pack's mirror is in the pipeline doc's environment notes.
