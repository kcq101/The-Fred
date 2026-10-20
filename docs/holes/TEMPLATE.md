# Iconic hole spec: <Course> No. <n>

Copy this file to `docs/holes/<id>.md` (id = `course-number`, e.g. `oldcourse-17`) and fill it in before touching code.
Sections 1–3 are research and analysis; 4–5 are the design; 6 is the contract the hole must pass; 7 is the evidence; 8 is the visual review, the sign-off that the hole looks like the real one. See `docs/ICONIC-HOLES.md` for the workflow, the feature catalogue and the tools (`node tests/tools/validate.js <id>` runs the checks, maps and report).

## 0. References (the gate before building: `docs/ICONIC-HOLES.md` §2.1)

| Reference | Required? | Have it? | Source / note (never commit photos or lidar tiles) |
|---|---|---|---|
| Map pin on the green (lat, lon) | yes | | |
| Lidar tile (USGS 3DEP 1 m / Scottish public lidar) | yes | | project, tile name, year |
| Aerial of the green complex | yes | | |
| Photo from on or behind the tee | yes | | |
| Backdrop photos (buildings, hedges, trees) | optional | | |
| Low-sun or rain photo of the green | optional | | |

## 1. Inspiration

| | |
|---|---|
| Real hole | Course, hole number, nickname |
| Par / yardage (real) | Every figure the sources give, with the year if the hole has changed (e.g. "par 5, 576 yd (Golf Today) to 588 yd (AP, 2024); a par 4 before 2014") |
| **Matches the request?** | Compare the real par and yardage with what you were asked to build. **If they differ, write it here as a question and ask before building** ("asked for par 4, 450 yd; sources say par 5, 576–588 yd: which one?"). If they agree, say "yes". |
| Par / yardage (game) | Game yardage is the straight line tee → pin. Our clubs carry 245 / 215 / 155 / 90 and a pure driver totals ~286 on flat fairway, so real yardages usually need scaling. |
| Sources | Links you actually read |

## 2. What makes it iconic

- **Signature features** (what people picture): …
- **The strategic problem in one sentence** (what people *talk about*): …
- **Where scores are made and lost**: which shot, which miss.

## 3. Analysis — the challenge archetypes

Tick every one that applies and say which shot it affects. The primary one is what the hole is "about"; protect it above everything else.

| Archetype | Applies? | Which shot | Notes |
|---|---|---|---|
| Distance control / run-out (ground ends, hazard through the fairway) | | | |
| Forced carry (water, chasm, ravine) | | | |
| Dogleg / corner to cut | | | |
| Elevation change (uphill/downhill shot) | | | |
| Sloping lies (ball above/below feet, up/downhill) | | | |
| Narrow landing zone | | | |
| Deep or pot bunkers | | | |
| Green contours (tiers, false front, tilt) | | | |
| Penal surrounds (water/bank feeding hazards, island) | | | |
| Wind exposure | | | |
| Risk/reward split (aggressive vs safe line) | | | |
| Firm/fast turf (links) or fast greens | | | |

## 4. Translation — real feature → game mechanic

One row per signature feature. Use only catalogue primitives and shared systems (ICONIC-HOLES.md §2). If something cannot be expressed, write it under **Capability gaps** instead of hacking it in.

| Real feature | Game expression | Parameters | What it does to play |
|---|---|---|---|
| | `ramp` / `rise` / `tilt` / `step` / `hollow` / `cover` / water body / bunker / traced outline (`pts`) / play profile / stance | | |

**Capability gaps** (features we cannot express yet, and the primitive that would cover them):

## 5. Exaggeration

What is amplified for arcade play, by how much, and why the hole is still recognizably itself. Also list what is simplified or left out. **Exaggerate the decision, not the shape**: amplify what the ball does at the edge and which shot the hole forces, not the slope everywhere.

| Characteristic | Real | Game | Why this amount |
|---|---|---|---|

**Realism bounds** — run `node tests/tools/slope.js <id>` and fill in the green's numbers. Defaults are in `docs/ICONIC-HOLES.md` §2. A WARN needs a reason here (or a reshaped green); "n/a" if the hole has no distinctive green.

| Bound | Default | This hole | Note |
|---|---|---|---|
| Falloff ring: surface steeper than 4 % | ≤ ~35 % | | |
| Top: 1–2.5 % of the non-steep surface | mostly (≥ half) | | |
| Flat pockets: surface under 1 % | 5–40 % | | |
| No full-green dome | not (> 60 % steeper than 2.5 % *and* slopes every which way) | | |

## 6. Validation — the contract

Written into `tests/hole-checks.js` under the hole's id; `node tests/tools/validate.js <id>` (or `node --test tests/holes.test.js`) must pass.

**Shots** (single swings with a required outcome):

| Shot | Expected |
|---|---|

**Strategies** (two or more ways to play one moment, each played by a *sharp* player — needle within ±0.2 — and a *shaky* one — within ±0.55). **State what the baseline can support**: hazard rate (share in water/OB), green rate (share on the putting surface) and payoff gap (strokes the aggressive plan saves over the safe one, sharp and shaky). Do not write "X is right for a shaky player" unless the report's numbers show it; if the baseline calls it a wash, assert the rates and the gap and say so below.

| Decision | Plans | Must hold (hazard rate, green rate, payoff gap) |
|---|---|---|

**Check-change log** — any check changed after tuning, with the reason (what it said, what it says now, why). Delete the rows if nothing changed. `lieAdd`, the last-resort override of a lie's cost, counts as a change: log it here.

| Check | Was | Now | Why |
|---|---|---|---|

**Visual checks**: `node tests/hole-map.js <id>` (top-down map with the check shots traced), `node tests/tools/slope.js <id>` (green slope map) and the in-game views from `python3 tests/tools/render.py <id>` (tee, bird's-eye, approach), then the key shot by hand.

## 7. Results

Paste the hole's section of `node tests/hole-report.js --hole=<id>` (before → after; `validate.js` prints it), plus anything learned while tuning.

## 8. Visual review — does it look like the hole?

The checks in §6 say the hole *plays* as designed; this section says it *looks* like the real one, and what still does not. Workflow and tools: `docs/ICONIC-HOLES.md` §2, step 7.

**Reference images** — at least one; an aerial of the green complex traces best, a photo from the tee is the second. The photos are **not** in the repo (keep them in `tests/tools/refs/`, git-ignored); `docs/holes/trace/<id>.json` records each by file name, size, sha256 and source, with its camera constraints and the outlines traced on it.

| View | What it shows | Source | Matched camera (`node tests/tools/trace.js <id>`) |
|---|---|---|---|

**Traced against the hole** — paste the outline table from `node tests/tools/trace.js <id> --ref=<commit before the tracing>`: each traced outline's width × depth, area and centroid against the shape the hole had, and their overlap. Note any outline exaggerated on purpose (`exaggerate` in the trace file, reasoned in §5), and the sensitivity table: how far the outlines move under each camera assumption.

**Renders** — `python3 tests/tools/render.py <id> ref --out docs/maps` (the game from each photo's camera, outlines drawn on top; commit these), and the side-by-sides with the photo it writes to `tests/tools/out/` (never commit those: they contain the photo).

**Sign-off checklist** — one verdict per row, from the renders against the photos:

- **matches**: the render and the photo agree at a glance
- **close**: the same feature, with a difference a player would not notice
- **differs: fix** — expressible with what the system has; say what to change, and whether it changes play (then it needs checks)
- **differs on purpose** — an exaggeration, reasoned in §5
- **can't express yet** — needs a primitive the system lacks; name the primitive
- **no reference** — nothing in the photos shows it; say which photo would

| Area | Item | Verdict | Evidence (render against photo) | Action / missing primitive |
|---|---|---|---|---|
| Tee placement and elevation | Tee position and line to the green | | | |
| | Elevation: tee against landing area and green | | | |
| | Ground between (rises, dips, valleys) | | | |
| Fairway and fairway bunkers | Fairway outline and width | | | |
| | Fairway bunkers: count, place, shape | | | |
| | Rough, waste, paths | | | |
| Green and greenside bunkers | Green outline and size | | | |
| | Green contours as seen | | | |
| | Greenside bunkers: count, place, shape, depth | | | |
| | Collar, banks and falloffs round the green | | | |
| Surroundings and landmarks | Trees: kind and where | | | |
| | Water, cliffs, structures, backdrop | | | |
| | Landmarks a player would name | | | |

**Signed off**: who, date, commit. **Open items**, most important first.

