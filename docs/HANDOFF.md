# Handoff: where The Fred stands

Last updated 2026-10-21 (night, session 2 of the hole redesign), after PRs #18–#20 and #23 (the wedge-spin fix); PR #22 (the OpenFairway physics and the hole redesigns, sessions 1–2) is open, a draft. Start a new session by reading this file, then `docs/ICONIC-HOLES.md` (the pipeline) and `tests/README.md` (the tools).

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
   **Hole redesign, session 1 (2026-10-21, late night; same branch, PR #22 still a draft): St Andrews and Pebble done.** Data and checks only; no engine, SP, club or windPush change. Every change is in each spec's §6 log.
   - *St Andrews No. 17:* tee 50 yd forward with the sheds, their collider and the hotel (the drive over the sheds looks the same), 488 → 438 yd; a pure drive runs 54 yd to 138 out. `greens.firm` 1.3 → 3.5, so a flown iron runs 40 yd off the back and the run-up finishes 0.8 yd away. Tailwind check rewritten around real downwind flight (+0.5 yd carry, 7° flatter, half the run, holds the green); headwind check now "flown at the pin, loses 6 yd but lands steeper and still runs off"; wall check is a 3-wood flown into it (a ball on the road no longer runs to it). 10 / 10.
   - *Pebble No. 8:* tee 25 yd forward (everything moves with the land), 376 → 351 yd; pure and 90 % driver reach the chasm again, a pure 3-wood stops 12 yd short. Two strategy thresholds logged: the iron leaves 50+ more (was 60+; it is 56) and a sharp approach holds the green 9 in 10 (was every time; 2 in 21 find the left bunker). 9 / 9.
   - *How a tee moves:* the tee is hard-wired at the origin, so moving it means every z in the hole entry drops by the distance (the tool used was a scratch script, not committed; a hole's `tee_shift` in its trace file records the offset from the lidar frame). The base landform noise (`seed`/`roll`/`ridge`) is in absolute coordinates, so it re-rolls under moved ground; lidar features move exactly.
   - Tests: 133 pass, 19 fail, 3 skip (was 123 / 29). Only these two holes' 10 checks moved; the 19 left are the same as before.
   **Hole redesign, session 2 (2026-10-21, night; same branch, PR #22 still a draft): Augusta 13 and Pinehurst 5 done.** Data and checks only; no engine, SP, club or windPush change. Every change is in each spec's §6 log.
   - *What both had in common:* under OpenFairway's rolling friction a fairway ball cannot stop on ground steeper than about 5 %. Both holes play the second shot from a 10–15 % sidehill, so the drive ran *sideways* to the low side (Augusta's into the pine straw, Pinehurst's into the waste), and the low line itself reads as a downhill lie. A tee move alone could not fix either (tried 0–100 yd). Lesson for later holes: a hanging lie needs either turf that grips (`play.firm` below 1) or fairway on the low side long enough that the 8 s roll limit ends the run on the slope.
   - *Augusta No. 13:* tee 100 yd forward (575 → 476 yd, still par 5) and `play.firm` 0.5 (soft parkland turf). The drive flies the speed slot and lands at the valley's foot; six test drives hold the fairway 205–219 out, all ball above the feet. Second shot from (27, 271). The 3-wood at the pin hooks 9.5 yd, not 18+ (lidar's 9–10 % sidehill, not the old spot's 15 %): threshold 18 → 8, logged; the drive checks renamed. Strategy: go sharp 2.97 vs lay-up 3.76; shaky lay-up 3.81 vs go 4.01 (43 % wet). 9 / 9.
   - *Pinehurst No. 5:* tee 15 yd forward (504 → 489 yd); the landing's low (left) side made fairway with the 10 % slant widened over it and the left wiregrass moved off it; `greens.firm` 1 → 2.2 so a flown 3-wood must be run up the front. Five test drives finish in the fairway 210–225 out, ball above the feet. Second shot from (21, 278); go aim (25, 482), 8 yd shorter. Shaky player holds the green going for it 33 % (limit 35 %: 7 of 21, one more would breach it); go pays sharp 0.93, shaky 0.37. The runoff-wedge check holed out with the firmer green: needle 0.1 → 0.15, logged. 10 / 10.
   - Tests: 138 pass, 14 fail, 3 skip (was 133 / 19). Only these two holes' 5 failing checks changed; the 14 left are the same list. The 600-shot test's slowest settle went 16.7 → 17.7 s (still failing on the 12 s budget, still the owner's call).
   - Cards: card2's tag repainted to 476y, card6's (placeholder) to 489y. Tee renders `docs/maps/augusta-13-tee.png`, `pinehurst-5-tee.png` replaced.
   **Next (session 3):** the tailwind checks on Sawgrass 17 (12-yd-long shot, both tailwind checks, the pot-bunker arc, the following-wind strategy) and Augusta 12 (tailwind, Sunday-pin strategy) around real downwind flight (St Andrews' is the pattern: barely further, flatter, softer), and Riviera's "Hammer past the green" check. Then the owner decides: wedge spin-back (try the green's boost from 3,000 rpm and look), and the 600-shot settle budget (12 s; flights alone now last up to 6 s).
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
