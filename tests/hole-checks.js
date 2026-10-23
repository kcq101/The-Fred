// Each hole's intended challenge, written as shots a player could hit. holes.test.js runs every one through the game's real
// terrain, swing, stance and ball physics; hole-report.js runs the same shots on an older version to show what changed.
//
// shots:      one swing each, with the outcome the design calls for.  expect: { end: 'water'|'rest'|..., surf: [...], maxToPin, minToPin }
// shot.expect also takes  stance: 'TAG',  wall: true|false (did the ball strike a wall on the way).
// strategies: two or more ways to play the same moment. Each plan is played by two skill levels:
//               sharp = needles evenly over ±0.2 of center,  shaky = over ±0.55
//             r[plan][skill] = { hazard: share in water/OB, toPin: mean yards left (dry balls), score: expected strokes for the hole, surfs }
//             `expect` lists [description, test] pairs; each must hold.
// Shot fields are documented in hole-play.js. Coordinates are yards: tee at the origin, the hole plays toward +z, screen-left is +x.
module.exports = {
  'pebble-8': {
    challenge: 'Distance control off the tee (the plateau ends at a cliff), then a forced carry over an ocean chasm to a small, back-to-front green.',
    shots: [
      { name: 'a pure driver runs off the end of the plateau into the chasm', shot: { club: 'Hammer', at: [-5, 225], power: 1 }, expect: { end: 'water' } },
      { name: 'even a 90% driver still finds the chasm', shot: { club: 'Hammer', at: [-5, 225], power: 0.9 }, expect: { end: 'water' } },
      { name: 'a pure 3-wood stops on the plateau, short of the cliff', shot: { club: '3-Wood', at: [-5, 225], power: 1 }, expect: { end: 'rest', surf: ['FAIRWAY'] } },
      { name: 'from there a well-struck iron carries the chasm and holds the green', shot: { from: [-5, 190], club: 'Iron', offset: 0.1 }, expect: { surf: ['GREENS'], maxToPin: 8 } },
      { name: 'a chunked approach comes up short in the chasm', shot: { from: [-5, 190], club: 'Iron', offset: 0.7 }, expect: { end: 'water' } },
      { name: 'a ball short-right on the shaved bank feeds back down to the sea', shot: { from: [-5, 190], club: 'Iron', offset: 0.55 }, expect: { end: 'water' } },
      { name: 'the bail-out left, around the head of the cove, stays dry', shot: { from: [-5, 190], club: 'Iron', at: [10, 331], offset: 0.5 }, expect: { end: 'rest' } },
    ],
    strategies: [
      { name: 'tee club', plans: [
          { name: 'driver', shot: { club: 'Hammer', at: [-5, 225], power: 1 } },
          { name: '3-wood', shot: { club: '3-Wood', at: [-5, 225], power: 1 } },
          { name: 'iron', shot: { club: 'Iron', at: [-5, 225], power: 1 } } ],
        expect: [
          ['driver is wet more often than not, for any player', r => r.driver.sharp.hazard > 0.5 && r.driver.shaky.hazard > 0.3],
          ['the 3-wood is the play: dry and the best score for both players', r => r['3-wood'].sharp.hazard === 0 && r['3-wood'].sharp.score < r.driver.sharp.score && r['3-wood'].sharp.score < r.iron.sharp.score && r['3-wood'].shaky.score < r.driver.shaky.score],
          ['laying back with an iron is safe but leaves a long approach (50+ yd more)', r => r.iron.sharp.toPin > r['3-wood'].sharp.toPin + 50] ] },
      { name: 'approach line', plans: [
          { name: 'pin', shot: { from: [-5, 190], club: 'Iron' } },
          { name: 'bail', shot: { from: [-5, 190], club: 'Iron', at: [10, 331] } } ],
        expect: [
          ['going at the pin brings the sea into play for a shaky player (the front-right bunker catches most short-right misses)', r => r.pin.shaky.hazard > 0 && r.bail.shaky.hazard === 0],
          ['a sharp player stays dry and holds the green at least nine times in ten (the most-pulled find the left bunker)', r => r.pin.sharp.hazard === 0 && r.pin.sharp.surfs.GREENS >= 0.9 * r.pin.sharp.n],
          ['the bail-out is dry but costs strokes', r => r.bail.sharp.score > r.pin.sharp.score + 0.5] ] },
    ],
  },

  'augusta-13': {
    challenge: 'Dogleg left: a drive that finds the valley leaves a reachable second, but from a ball-above-the-feet lie that hooks toward the creek in front of a green perched on a shaved bank. Go for it, or lay up.',
    shots: [
      { name: 'a pure drive lands at the foot of the valley and holds the sidehill fairway, in 3-wood reach', shot: { club: 'Hammer', at: [12, 160], power: 1 }, expect: { end: 'rest', surf: ['FAIRWAY'], maxToPin: 250 } },
      { name: 'a drawn drive also holds the valley, within 3-wood reach', shot: { club: 'Hammer', at: [3, 160], power: 1, offset: -0.3 }, expect: { end: 'rest', maxToPin: 235 } },
      { name: 'the second shot is played with the ball above the feet', shot: { from: [34, 275], club: '3-Wood', at: [65, 465] }, expect: { stance: 'BALL ABOVE FEET · HOOKS' } },
      { name: 'aimed straight at the pin, the hanging lie hooks a pure 3-wood well left of it', shot: { from: [34, 275], club: '3-Wood' }, expect: { minToPin: 8 } },
      { name: 'aimed right to allow for the hook, a pure 3-wood reaches the putting surface', shot: { from: [34, 275], club: '3-Wood', at: [65, 465] }, expect: { end: 'rest', surf: ['GREENS', 'FRINGE'] } },
      { name: 'a slightly thin 3-wood lands on the shaved bank and rolls back into the creek', shot: { from: [34, 275], club: '3-Wood', at: [65, 465], offset: 0.25 }, expect: { end: 'water' } },
      { name: 'the lay-up leaves a flat wedge that a decent swing puts on the green', shot: { from: [50, 400], club: 'Wedge', offset: 0.35 }, expect: { surf: ['GREENS'] } },
      { name: 'a ball that runs off the front of the green feeds into the creek', shot: { from: [50, 400], club: 'Wedge', at: [64, 452] }, expect: { end: 'water' } },
    ],
    strategies: [
      { name: 'the momentous decision (second shot from the valley)', plans: [
          { name: 'go', shot: { from: [34, 275], club: '3-Wood', at: [65, 465] } },
          { name: 'layup', shot: { from: [34, 275], club: 'Iron', at: [40, 400] } } ],
        expect: [
          ['going for it brings the creek into play', r => r.go.shaky.hazard > 0.15 && r.layup.shaky.hazard === 0],
          ['for a sharp player, going for it is worth it', r => r.go.sharp.score < r.layup.sharp.score],
          ['for a shaky player, laying up is the better play', r => r.layup.shaky.score < r.go.shaky.score] ] },
    ],
  },

  'sawgrass-17': {
    challenge: 'Pure distance and direction control to an island green, with the wind as the hidden variable.',
    shots: [
      { name: 'a well-struck iron holds the green', shot: { club: 'Iron', offset: 0.1 }, expect: { surf: ['GREENS'], maxToPin: 8 } },
      { name: 'a shot carried 13 yards long runs off the back of the island into the water', shot: { club: 'Iron', at: [-4, 150] }, expect: { end: 'water' } },
      { name: 'a bad miss right is wet', shot: { club: 'Iron', offset: 0.6 }, expect: { end: 'water' } },
      { name: 'with a 17 mph tailwind a stock shot barely flies further, lands flatter, and still holds the green', shot: { club: 'Iron', wind: { mph: 17, dir: 'tail' } }, expect: { end: 'rest', surf: ['GREENS'], maxToPin: 4 } },
      { name: 'over-reading the tailwind (arc on the island\'s front edge) comes up short of the green', shot: { club: 'Iron', at: [0, 125], wind: { mph: 17, dir: 'tail' } }, expect: { end: 'rest', surf: ['FRINGE'], minToPin: 9 } },
      { name: 'where the tailwind costs you is long: 12 yards long holds in still air, but the same arc downwind goes over the back into the water', shot: { club: 'Iron', at: [-4, 149], wind: { mph: 17, dir: 'tail' } }, expect: { end: 'water' } },
      { name: 'into a 17 mph headwind, a stock shot to a front pin comes up short and wet', shot: { club: 'Iron', at: [-4, 129], wind: { mph: 17, dir: 'head' } }, expect: { end: 'water' } },
      { name: 'into the same headwind, aiming the arc 11 yards past the pin, left of the pot bunker, finds the green', shot: { club: 'Iron', at: [-2, 148], wind: { mph: 17, dir: 'head' } }, expect: { surf: ['GREENS'], maxToPin: 6 } },
      { name: 'the same arc straight over the pot bunker comes down short of the pin, in it', shot: { club: 'Iron', at: [-5, 148], wind: { mph: 17, dir: 'head' } }, expect: { end: 'rest', surf: ['SAND'] } },
    ],
    strategies: [
      { name: 'reading a headwind', plans: [
          { name: 'stock', shot: { club: 'Iron', wind: { mph: 17, dir: 'head' } } },
          { name: 'read', shot: { club: 'Iron', at: [-2, 148], wind: { mph: 17, dir: 'head' } } } ],
        expect: [
          ['ignoring the headwind is a disaster even for a sharp player', r => r.stock.sharp.hazard > 0.5],
          ['reading it (the arc 11 yards past the pin) keeps a sharp player dry', r => r.read.sharp.hazard === 0],
          ['and saves strokes for everyone', r => r.read.sharp.score < r.stock.sharp.score - 1 && r.read.shaky.score < r.stock.shaky.score] ] },
      { name: 'a following wind: play it stock or over-read it', plans: [
          { name: 'stock', shot: { club: 'Iron', wind: { mph: 17, dir: 'tail' } } },
          { name: 'over', shot: { club: 'Iron', at: [0, 125], wind: { mph: 17, dir: 'tail' } } } ],
        expect: [
          ['over-reading the tailwind (arc on the front edge) is a disaster even for a sharp player', r => r.over.sharp.hazard > 0.5],
          ['the stock shot keeps a sharp player dry', r => r.stock.sharp.hazard === 0],
          ['and saves strokes for everyone', r => r.stock.sharp.score < r.over.sharp.score - 1 && r.stock.shaky.score < r.over.shaky.score] ] },
      { name: 'skill matters', plans: [ { name: 'pin', shot: { club: 'Iron' } } ],
        expect: [
          ['a sharp player always finds the island in still air', r => r.pin.sharp.hazard === 0],
          ['a shaky player gets wet at least one time in seven', r => r.pin.shaky.hazard > 1 / 7] ] },
    ],
  },

  'standrews-17': {
    challenge: 'A long second into a narrow green on firm links turf, angled from front-right to back-left along the road: the deep Road Hole bunker eats into its left end (a ball in it cannot play out forwards), the Sunday pin is tucked behind it, and a hard road and a stone wall sit behind. Land it short and let it run; fly the pin and it runs off the back.',
    shots: [
      { name: 'a pure drive runs out on the firm fairway and leaves a full iron', shot: { club: 'Hammer', at: [0, 250], power: 1 }, expect: { end: 'rest', surf: ['FAIRWAY'], minToPin: 125, maxToPin: 150 } },
      { name: 'aimed over the sign on the shed at the pin, a pure drive carries the corner of the hotel\'s grounds and finds the fairway', shot: { club: 'Hammer', at: 'pin', power: 1 }, expect: { end: 'rest', surf: ['FAIRWAY'], minToPin: 125, maxToPin: 150 } },
      { name: 'from the line down the right by the hotel, a pushed drive finishes out of bounds in its grounds', shot: { club: 'Hammer', at: [-8, 245], offset: 0.45 }, expect: { end: 'oob' } },
      { name: 'a low 3-wood into the shed is stopped by its wall and drops out of bounds in front of it', shot: { club: '3-Wood', at: 'pin', power: 0.35 }, expect: { end: 'oob', wall: true } },
      { name: 'an iron flown at the pin runs through the green and off the back', shot: { from: [0, 301], club: 'Iron' }, expect: { end: 'rest', surf: ['ROAD', 'ROUGH'] } },
      { name: 'landed short of the tucked pin and run up, an iron holds the green', shot: { from: [0, 301], club: 'Iron', at: [22, 422] }, expect: { surf: ['GREENS', 'FRINGE'], maxToPin: 10 } },
      { name: 'the attack over the bunker\'s edge, pulled a little, drops into the Road Hole bunker', shot: { from: [0, 301], club: 'Iron', at: [28, 426], offset: -0.25 }, expect: { end: 'rest', surf: ['SAND'] } },
      { name: 'into an 18 mph headwind, an iron flown at the pin loses carry but lands steeper and still runs off the back', shot: { from: [0, 301], club: 'Iron', wind: { mph: 18, dir: 'head' } }, expect: { end: 'rest', surf: ['ROAD', 'ROUGH'] } },
      { name: 'with an 18 mph tailwind the attack barely flies further, lands flatter and softer, and still holds the green', shot: { from: [0, 301], club: 'Iron', at: [28, 426], wind: { mph: 18, dir: 'tail' } }, expect: { end: 'rest', surf: ['GREENS'], maxToPin: 10 } },
      { name: 'a 3-wood flown over the road into the stone wall is stopped by it', shot: { from: [0, 301], club: '3-Wood', at: [14, 460] }, expect: { end: 'rest', surf: ['ROAD', 'ROUGH'], wall: true } },
      { name: 'from the middle of the bunker a wedge at the pin cannot get out forwards', shot: { from: [32.5, 424.5], club: 'Wedge' }, expect: { end: 'rest', surf: ['SAND'] } },
      { name: 'the safe line to the wide front of the green holds it', shot: { from: [0, 301], club: 'Iron', at: [10, 410] }, expect: { surf: ['GREENS'] } },
    ],
    strategies: [
      // the drive (2026-10-23, the real tee shot): the baseline prices distance and lie, not the angle into the green, so the right-hand line's reward
      // (playing along the angled green rather than across the bunker) is not in these numbers: docs/holes/standrews-17.md §6
      { name: 'the drive: over the sign at the pin, down the right by the hotel (the better angle in), or bail out left', plans: [
          { name: 'sign', shot: { club: 'Hammer', at: 'pin' } },
          { name: 'right', shot: { club: 'Hammer', at: [-8, 245] } },
          { name: 'left', shot: { club: 'Hammer', at: [34, 245] } } ],
        expect: [
          ['a sharp player stays in bounds on every line', r => ['sign', 'right', 'left'].every(k => r[k].sharp.hazard === 0)],
          ['down the right, a shaky player is out of bounds at least one time in eight', r => r.right.shaky.hazard >= 0.125],
          ['over the sign keeps a shaky player in bounds', r => r.sign.shaky.hazard === 0],
          ['bailing out left costs a sharp player at least 0.2 stroke against the line over the sign', r => r.left.sharp.score - r.sign.sharp.score >= 0.2],
          ['and buys a shaky player nothing: the line over the sign is in bounds too, and shorter', r => r.left.shaky.score > r.sign.shaky.score] ] },
      // no per-hole lie costs: the baseline's recovery term charges the Road Hole bunker for its deep face (a ball in it cannot play out forwards, see the shot above)
      { name: 'the second shot: fly the tucked pin, attack it over the bunker\'s edge, or play to the middle and run up', plans: [
          { name: 'fly', shot: { from: [0, 301], club: 'Iron' } },
          { name: 'attack', shot: { from: [0, 301], club: 'Iron', at: [28, 426] } },
          { name: 'middle', shot: { from: [0, 301], club: 'Iron', at: [18, 418] } } ],
        expect: [
          ['flying the pin runs off the back: a sharp player holds the green less than half the time', r => (r.fly.sharp.surfs.GREENS || 0) * 2 < r.fly.sharp.n],
          ['it is the worst plan for both players', r => ['sharp', 'shaky'].every(k => r.fly[k].score > r.attack[k].score && r.fly[k].score > r.middle[k].score)],
          ['attacking the tucked pin puts even a sharp player in the bunker at least one time in five', r => (r.attack.sharp.surfs.SAND || 0) >= 4],
          ['the middle of the green is the play: a sharp player holds it four times in five and it beats the attack', r => (r.middle.sharp.surfs.GREENS || 0) >= 17 && r.middle.sharp.score < r.attack.sharp.score],
          ['and it keeps a shaky player out of the bunker twice as often', r => (r.middle.shaky.surfs.SAND || 0) * 2 <= (r.attack.shaky.surfs.SAND || 0)] ] },
    ],
  },

  'augusta-12': {
    challenge: 'A short iron over Rae\'s Creek to a shallow, wide green angled away from the tee: the creek and its steep bank short, deep bunkers long, a swirling wind over it all. The deeper left side is the safe target; the Sunday pin tucked by the creek on the right is the temptation.',
    shots: [
      { name: 'a well-struck iron at the pin holds the right side of the green', shot: { club: 'Iron', offset: 0.1 }, expect: { surf: ['GREENS'], maxToPin: 7 } },
      { name: 'a well-struck iron at the middle of the green holds it', shot: { club: 'Iron', at: [14, 131], offset: 0.1 }, expect: { surf: ['GREENS'] } },
      { name: 'a thin iron at the pin comes up short in the creek', shot: { club: 'Iron', offset: 0.4 }, expect: { end: 'water' } },
      { name: 'a push right at the pin is wet', shot: { club: 'Iron', offset: 0.5 }, expect: { end: 'water' } },
      { name: 'carried long over the left half of the green, the ball finds a back bunker', shot: { club: 'Iron', at: [2, 152] }, expect: { end: 'rest', surf: ['SAND'] } },
      { name: 'an iron flown a club short of the pin (the wind misjudged) finds the creek', shot: { club: 'Iron', at: [-8, 128] }, expect: { end: 'water' } },
      { name: 'clubbing up for the headwind (arc past the pin) finishes on the putting surface or its edge', shot: { club: 'Iron', at: [-6, 150], wind: { mph: 14, dir: 'head' } }, expect: { surf: ['GREENS', 'FRINGE'], maxToPin: 9 } },
      { name: 'with a 14 mph tailwind a stock shot barely flies further, lands flatter, and still holds the green', shot: { club: 'Iron', wind: { mph: 14, dir: 'tail' } }, expect: { end: 'rest', surf: ['GREENS'], maxToPin: 6 } },
    ],
    strategies: [
      { name: 'the Sunday pin: attack it by the creek, or play to the deep middle', plans: [
          { name: 'pin', shot: { club: 'Iron' } },
          { name: 'middle', shot: { club: 'Iron', at: [14, 131] } } ],
        expect: [
          ['attacking the pin keeps a sharp player dry', r => r.pin.sharp.hazard === 0],
          ['a shaky player gets wet at least one time in four going at it', r => r.pin.shaky.hazard > 0.25],
          ['the middle is far safer for a shaky player', r => r.middle.shaky.hazard * 2 <= r.pin.shaky.hazard],
          ['attacking pays a sharp player more than 0.4 strokes; a shaky player gains less than half as much, while drowning twice as often (above)', r => r.pin.sharp.score + 0.4 < r.middle.sharp.score && (r.middle.shaky.score - r.pin.shaky.score) < 0.5 * (r.middle.sharp.score - r.pin.sharp.score)] ] },
    ],
  },
  'pinehurst-5': {
    challenge: 'A par 5 that rises and turns left to an elevated plateau green set on a diagonal: gentle on top, falling away steeply at every edge onto short runoffs and wiregrass. Going for it in two means a 3-wood from a slanted fairway; most players lay up and wedge onto the top.',
    shots: [
      { name: 'a good drive finds the fairway', shot: { club: 'Hammer', at: [-8, 273], offset: 0.1 }, expect: { surf: ['FAIRWAY'] } },
      { name: 'a pushed drive is in the wiregrass and sand, not the rough', shot: { club: 'Hammer', at: [-8, 273], offset: 0.5 }, expect: { end: 'rest', surf: ['WASTE'] } },
      { name: 'the second shot is played with the ball above the feet', shot: { from: [21, 278], club: '3-Wood', at: [25, 482] }, expect: { stance: 'BALL ABOVE FEET · HOOKS' } },
      { name: 'a full 3-wood aimed straight at the pin from the slanted fairway is hooked left by the lie and finishes well away', shot: { from: [21, 278], club: '3-Wood', at: 'pin', power: 1 }, expect: { end: 'rest', minToPin: 10 } },
      { name: 'the same 3-wood aimed right of the pin and short of it, allowing for the slant and the firm green, finishes close', shot: { from: [21, 278], club: '3-Wood', at: [25, 482] }, expect: { end: 'rest', surf: ['GREENS'], maxToPin: 8 } },
      { name: 'the lay-up with an iron finds the fairway at wedge distance', shot: { from: [21, 278], club: 'Iron', at: [13, 417] }, expect: { end: 'rest', surf: ['FAIRWAY'], minToPin: 50, maxToPin: 90 } },
      { name: 'from the lay-up, a well-struck wedge at the pin holds the top', shot: { from: [24, 417], club: 'Wedge', offset: 0.1 }, expect: { surf: ['GREENS'], maxToPin: 6 } },
      { name: 'a wedge flown to the back-left edge runs off the falloff', shot: { from: [24, 417], club: 'Wedge', at: [30, 500] }, expect: { end: 'rest', surf: ['FAIRWAY', 'FRINGE', 'WASTE', 'ROUGH'] } },
      { name: 'from the low runoff left of the green, a wedge back up the falloff finishes on or near the green', shot: { from: [56, 487], club: 'Wedge', offset: 0.15 }, expect: { end: 'rest', maxToPin: 10 } },
    ],
    strategies: [
      { name: 'the second shot: go for the green with a 3-wood (aimed right of the pin for the slant, and short for the firm green) or lay up with an iron to wedge distance', plans: [
          { name: 'go', shot: { from: [21, 278], club: '3-Wood', at: [25, 482] } },
          { name: 'layup', shot: { from: [21, 278], club: 'Iron', at: [13, 417] } } ],
        expect: [
          ['a sharp player who goes for it reaches the green most of the time', r => (r.go.sharp.surfs.GREENS || 0) / r.go.sharp.n >= 0.5],
          ['a shaky one rarely holds it', r => (r.go.shaky.surfs.GREENS || 0) / r.go.shaky.n <= 0.35],
          ['going for it pays a sharp player at least half a stroke', r => r.layup.sharp.score - r.go.sharp.score >= 0.5],
          ['for a shaky player the payoff is much smaller (the tour baseline still favours going: see the spec)', r => (r.layup.shaky.score - r.go.shaky.score) < 0.75 * (r.layup.sharp.score - r.go.sharp.score)] ] },
    ],
  },
  'riviera-6': {
    challenge: 'A par 3 whose decision is the pin, not the tee shot: a small pot bunker in the middle of the green cuts it into quadrants, a back-to-front slope and a tier separate the lower short-right pin area from the upper back-left one, a big two-lobed bunker sits short of the green in front of the pin, and small bunkers lie behind and off the left end. Every plan is a full iron; what matters is which quadrant you aim at.',
    shots: [
      { name: 'a well-struck iron at the pin holds the short-right quadrant', shot: { club: 'Iron', offset: 0.1 }, expect: { surf: ['GREENS'], maxToPin: 7 } },
      { name: 'aimed at the middle of the green, a pure iron drops into the middle bunker', shot: { club: 'Iron', at: [0, 144] }, expect: { end: 'rest', surf: ['SAND'] } },
      { name: 'a well-struck iron at the big back-left quadrant holds the green, across the bunker from the pin', shot: { club: 'Iron', at: [8, 145], offset: 0.1 }, expect: { surf: ['GREENS'], minToPin: 10 } },
      { name: 'aimed at the big front bunker, short of the pin, a pure iron finds the sand', shot: { club: 'Iron', at: [-3.5, 120.2] }, expect: { end: 'rest', surf: ['SAND'] } },
      { name: 'aimed at the small bunker off the left end of the green, a pure iron finds the sand', shot: { club: 'Iron', at: [12.3, 144.1] }, expect: { end: 'rest', surf: ['SAND'] } },
      { name: 'aimed past the green, a pure iron runs through it into the back bunker', shot: { club: 'Iron', at: [0, 160] }, expect: { end: 'rest', surf: ['SAND'] } },
      { name: 'a Hammer flown well past the green into the bank behind it is stopped by the bank and rolls back down into the back bunker', shot: { club: 'Hammer', at: [0, 175] }, expect: { end: 'rest', surf: ['SAND'], maxToPin: 20 } },
      { name: 'from the back-left quadrant, a wedge over the bunker finishes on the green close to the pin', shot: { from: [8, 149.5], club: 'Wedge', at: 'pin', offset: 0.1 }, expect: { surf: ['GREENS'], maxToPin: 9 } },
      { name: 'from the middle bunker, a wedge gets out and onto the green', shot: { from: [0, 144], club: 'Wedge', offset: 0.1 }, expect: { end: 'rest', surf: ['GREENS'], maxToPin: 12 } },
    ],
    strategies: [
      { name: 'the pin: attack the short-right pin, play to the big back-left quadrant, or aim at the middle (every plan an iron)', plans: [
          { name: 'pin', shot: { club: 'Iron' } },
          { name: 'safe', shot: { club: 'Iron', at: [8, 145] } },
          { name: 'middle', shot: { club: 'Iron', at: [0, 144] } } ],
        expect: [
          ['a sharp player at the pin holds the green most of the time', r => (r.pin.sharp.surfs.GREENS || 0) / r.pin.sharp.n >= 0.7],
          ['aiming at the middle finds the sand at least a quarter of the time for a sharp player, and costs them at least 0.3 stroke against the pin: the obvious target is the wrong one', r => (r.middle.sharp.surfs.SAND || 0) / r.middle.sharp.n >= 0.25 && r.middle.sharp.score - r.pin.sharp.score >= 0.3],
          ['the back-left quadrant leaves a sharp player at least 6 yd more than the pin', r => r.safe.sharp.toPin >= r.pin.sharp.toPin + 6],
          ['it is the bigger target: a shaky player holds the green at least as often there as at the pin', r => (r.safe.shaky.surfs.GREENS || 0) >= (r.pin.shaky.surfs.GREENS || 0)],
          ['the pin saves a sharp player at least a tenth of a stroke over the bail-out (the baseline cannot see the cost of the far quadrant: see the spec)', r => r.safe.sharp.score - r.pin.sharp.score >= 0.1],
          ['for a shaky player the baseline puts the two plans within 0.35 stroke of each other, either way', r => Math.abs(r.pin.shaky.score - r.safe.shaky.score) < 0.35] ] },
    ],
  },

  'oakmont-3': {
    challenge: 'A drive into a narrow valley between the Church Pews on the left and five deep bunkers on the right, then a blind short iron up the hill to a green on a tabletop: short rolls back down the hill, long runs off the back.',
    shots: [
      { name: 'a pure drive lands beside the Pews and finishes in the fairway, a full iron left up the hill', shot: { club: 'Hammer', at: 'pin', power: 1 }, expect: { end: 'rest', surf: ['FAIRWAY'], minToPin: 125, maxToPin: 150 } },
      { name: 'a hooked drive finds the Church Pews', shot: { club: 'Hammer', at: 'pin', power: 1, offset: -0.5 }, expect: { end: 'rest', surf: ['SAND'] } },
      { name: 'a pushed drive finds the five bunkers on the right', shot: { club: 'Hammer', at: 'pin', power: 1, offset: 0.5 }, expect: { end: 'rest', surf: ['SAND'] } },
      { name: 'from the fairway a pure iron up the hill holds the tabletop green', shot: { from: [0, 258], club: 'Iron' }, expect: { surf: ['GREENS'], maxToPin: 8 } },
      { name: 'an iron 20 yd short lands on the run-off and rolls back down the hill', shot: { from: [0, 258], club: 'Iron', power: 0.8 }, expect: { end: 'rest', surf: ['FAIRWAY'], minToPin: 35 } },
      { name: 'a 3-wood approach flies the tabletop and runs away off the back', shot: { from: [0, 258], club: '3-Wood', power: 0.85 }, expect: { end: 'rest', minToPin: 25 } },
      { name: "from the 3-wood's landing, a full iron comes up short and rolls back down", shot: { from: [0, 230], club: 'Iron', power: 1 }, expect: { end: 'rest', surf: ['FAIRWAY'], minToPin: 35 } },
      { name: 'at the foot of a pew a wedge at the green cannot get out forwards', shot: { from: [24, 220], club: 'Wedge' }, expect: { end: 'rest', surf: ['SAND'], minToPin: 170 } },
      { name: 'played out sideways, along the trough, the same ball reaches the fairway', shot: { from: [24, 220], club: 'Wedge', at: [-5, 226] }, expect: { end: 'rest', surf: ['FAIRWAY'] } },
    ],
    strategies: [
      { name: 'the tee club: driver beside the Pews, a 3-wood, or an iron short of them', plans: [
          { name: 'driver', shot: { club: 'Hammer', at: 'pin', power: 1 } },
          { name: '3-wood', shot: { club: '3-Wood', at: 'pin', power: 1 } },
          { name: 'iron', shot: { club: 'Iron', at: 'pin', power: 1 } } ],
        expect: [
          ['a sharp driver stays out of the sand and leaves the shortest approach', r => (r.driver.sharp.surfs.SAND || 0) === 0 && r.driver.sharp.toPin < r['3-wood'].sharp.toPin],
          ['a shaky driver finds the Pews or the bunkers at least one time in five', r => (r.driver.shaky.surfs.SAND || 0) >= r.driver.shaky.n / 5],
          ['the iron keeps a shaky player out of the sand but leaves 80+ yd more than the driver', r => (r.iron.shaky.surfs.SAND || 0) === 0 && r.iron.sharp.toPin > r.driver.sharp.toPin + 80],
          ['for a sharp player the driver is the best plan', r => r.driver.sharp.score < r['3-wood'].sharp.score && r.driver.sharp.score < r.iron.sharp.score] ] },
      { name: 'the approach up the hill: at the pin, or a few yards past it', plans: [
          { name: 'pin', shot: { from: [0, 258], club: 'Iron' } },
          { name: 'past', shot: { from: [0, 258], club: 'Iron', at: [0, 405] } } ],
        expect: [
          ['a sharp player holds the green from either line most of the time', r => r.pin.sharp.surfs.GREENS >= 0.7 * r.pin.sharp.n && r.past.sharp.surfs.GREENS >= 0.7 * r.past.sharp.n],
          ['for a shaky player at the pin, the front run-off sends some back down the hill (20+ yd away)', r => r.pin.shaky.toPin > r.pin.sharp.toPin + 3] ] },
    ],
  },

  'standrews-18': {
    challenge: 'The Home hole: drive over the Swilcan Burn onto the vast fairway shared with the 1st, across Granny Clark\'s Wynd, at a green guarded by the Valley of Sin in front and out of bounds right (the town) and behind (Golf Place). Short enough to drive.',
    shots: [
      { name: 'a pure drive at the pin runs through the Valley of Sin up onto the front of the green', shot: { club: 'Hammer', at: 'pin', power: 1 }, expect: { end: 'rest', surf: ['FRINGE', 'GREENS'], maxToPin: 25 } },
      { name: 'a drive 15 % light stops short of the Valley, a pitch over it left', shot: { club: 'Hammer', at: 'pin', power: 0.85 }, expect: { end: 'rest', surf: ['FAIRWAY'], minToPin: 30 } },
      { name: 'down the right in a wind off the left, a pushed drive finishes out of bounds in the town', shot: { club: 'Hammer', at: [-20, 250], power: 1, offset: 0.55, wind: { mph: 18, dir: 'right' } }, expect: { end: 'oob' } },
      { name: 'the drive at the R&A clock, left, stays on the shared fairway', shot: { club: 'Hammer', at: [25, 250], power: 1 }, expect: { end: 'rest', surf: ['FAIRWAY', 'FRINGE'] } },
      { name: 'a topped iron pushed right finds the Swilcan Burn by the bridge', shot: { club: 'Iron', at: [-30, 20], power: 0.2 }, expect: { end: 'water' } },
      { name: 'from Granny Clark\'s Wynd, a full iron flies the green and finishes out of bounds behind it', shot: { from: [0, 200], club: 'Iron', power: 1 }, expect: { end: 'oob' } },
    ],
    strategies: [
      { name: 'the drive: at the green, at the R&A clock (left), or an iron to the Wynd', plans: [
          { name: 'green', shot: { club: 'Hammer', at: 'pin', power: 1 } },
          { name: 'clock', shot: { club: 'Hammer', at: [25, 250], power: 1 } },
          { name: 'layup', shot: { club: 'Iron', at: [20, 170], power: 1 } } ],
        expect: [
          ['driving at the green finishes nearest the pin and is the best plan for a sharp player', r => r.green.sharp.toPin < r.clock.sharp.toPin && r.green.sharp.score < r.clock.sharp.score && r.green.sharp.score < r.layup.sharp.score],
          ['in still air none of the three lines reaches the town for either player (the out of bounds needs a push and a wind off the left)', r => ['green', 'clock', 'layup'].every(k => r[k].sharp.hazard === 0 && r[k].shaky.hazard === 0)],
          ['the iron to the Wynd leaves 100+ yd', r => r.layup.sharp.toPin > 100] ] },
    ],
  },
};
