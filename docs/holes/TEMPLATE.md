# Iconic hole spec: <Course> No. <n>

Copy this file to `docs/holes/<id>.md` (id = `course-number`, e.g. `oldcourse-17`) and fill it in before touching code.
Sections 1–3 are research and analysis; 4–5 are the design; 6 is the contract the hole must pass; 7 is the evidence. See `docs/ICONIC-HOLES.md` for the workflow, the feature catalogue and the tools (`node tests/tools/validate.js <id>` runs the checks, maps and report).

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
| | `ramp` / `rise` / `tilt` / `step` / `hollow` / `cover` / water body / bunker / play profile / stance | | |

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
