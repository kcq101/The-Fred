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
      { name: 'a pure driver runs off the end of the plateau into the chasm', shot: { club: 'Hammer', at: [-5, 250], power: 1 }, expect: { end: 'water' } },
      { name: 'even a 90% driver still finds the chasm', shot: { club: 'Hammer', at: [-5, 250], power: 0.9 }, expect: { end: 'water' } },
      { name: 'a pure 3-wood stops on the plateau, short of the cliff', shot: { club: '3-Wood', at: [-5, 250], power: 1 }, expect: { end: 'rest', surf: ['FAIRWAY'] } },
      { name: 'from there a well-struck iron carries the chasm and holds the green', shot: { from: [-5, 247], club: 'Iron', offset: 0.1 }, expect: { surf: ['GREENS'], maxToPin: 8 } },
      { name: 'a chunked approach comes up short in the chasm', shot: { from: [-5, 247], club: 'Iron', offset: 0.7 }, expect: { end: 'water' } },
      { name: 'a ball short-right on the shaved bank feeds back down to the sea', shot: { from: [-5, 247], club: 'Iron', offset: 0.55 }, expect: { end: 'water' } },
      { name: 'the bail-out left, around the head of the cove, stays dry', shot: { from: [-5, 247], club: 'Iron', at: [10, 356], offset: 0.5 }, expect: { end: 'rest' } },
    ],
    strategies: [
      { name: 'tee club', plans: [
          { name: 'driver', shot: { club: 'Hammer', at: [-5, 250], power: 1 } },
          { name: '3-wood', shot: { club: '3-Wood', at: [-5, 250], power: 1 } },
          { name: 'iron', shot: { club: 'Iron', at: [-5, 250], power: 1 } } ],
        expect: [
          ['driver is wet more often than not, for any player', r => r.driver.sharp.hazard > 0.5 && r.driver.shaky.hazard > 0.3],
          ['the 3-wood is the play: dry and the best score for both players', r => r['3-wood'].sharp.hazard === 0 && r['3-wood'].sharp.score < r.driver.sharp.score && r['3-wood'].sharp.score < r.iron.sharp.score && r['3-wood'].shaky.score < r.driver.shaky.score],
          ['laying back with an iron is safe but leaves a long approach', r => r.iron.sharp.toPin > r['3-wood'].sharp.toPin + 60] ] },
      { name: 'approach line', plans: [
          { name: 'pin', shot: { from: [-5, 247], club: 'Iron' } },
          { name: 'bail', shot: { from: [-5, 247], club: 'Iron', at: [10, 356] } } ],
        expect: [
          ['going at the pin risks the chasm for a shaky player', r => r.pin.shaky.hazard > 0.05 && r.bail.shaky.hazard === 0],
          ['a sharp player hits the green every time', r => r.pin.sharp.hazard === 0 && r.pin.sharp.surfs.GREENS === r.pin.sharp.n],
          ['the bail-out is dry but costs strokes', r => r.bail.sharp.score > r.pin.sharp.score + 0.5] ] },
    ],
  },

  'augusta-13': {
    challenge: 'Dogleg left: a drive that finds the valley leaves a reachable second, but from a ball-above-the-feet lie that hooks toward the creek in front of a green perched on a shaved bank. Go for it, or lay up.',
    shots: [
      { name: 'a pure drive tumbles down the valley and runs out past 320', shot: { club: 'Hammer', at: [12, 260], power: 1 }, expect: { end: 'rest', surf: ['FAIRWAY'], maxToPin: 250 } },
      { name: 'a drawn drive catches the slope and runs even further', shot: { club: 'Hammer', at: [3, 260], power: 1, offset: -0.3 }, expect: { end: 'rest', maxToPin: 235 } },
      { name: 'the second shot is played with the ball above the feet', shot: { from: [22, 334], club: '3-Wood', at: [62, 575] }, expect: { stance: 'BALL ABOVE FEET · HOOKS' } },
      { name: 'aimed straight at the pin, the hanging lie hooks a pure 3-wood left of the green', shot: { from: [22, 334], club: '3-Wood' }, expect: { minToPin: 18 } },
      { name: 'aimed right to allow for the hook, a pure 3-wood reaches the putting surface', shot: { from: [22, 334], club: '3-Wood', at: [62, 575] }, expect: { end: 'rest', surf: ['GREENS', 'FRINGE'] } },
      { name: 'a slightly thin 3-wood lands on the shaved bank and rolls back into the creek', shot: { from: [22, 334], club: '3-Wood', at: [62, 575], offset: 0.2 }, expect: { end: 'water' } },
      { name: 'the lay-up leaves a flat wedge that a decent swing puts on the green', shot: { from: [50, 500], club: 'Wedge', offset: 0.35 }, expect: { surf: ['GREENS'] } },
      { name: 'a ball that runs off the front of the green feeds into the creek', shot: { from: [50, 500], club: 'Wedge', at: [64, 552] }, expect: { end: 'water' } },
    ],
    strategies: [
      { name: 'the momentous decision (second shot from the valley)', plans: [
          { name: 'go', shot: { from: [22, 334], club: '3-Wood', at: [62, 575] } },
          { name: 'layup', shot: { from: [22, 334], club: 'Iron', at: [40, 500] } } ],
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
      { name: 'a shot carried 12 yards long runs off the back of the island into the water', shot: { club: 'Iron', at: [-4, 149] }, expect: { end: 'water' } },
      { name: 'a bad miss right is wet', shot: { club: 'Iron', offset: 0.6 }, expect: { end: 'water' } },
      { name: 'ignore a 17 mph tailwind and the ball flies the green into the water', shot: { club: 'Iron', wind: { mph: 17, dir: 'tail' } }, expect: { end: 'water' } },
      { name: 'play the tailwind (land it short) and it finishes on the green', shot: { club: 'Iron', at: [-4, 123], wind: { mph: 17, dir: 'tail' } }, expect: { surf: ['GREENS'] } },
      { name: 'into a 17 mph headwind, a stock shot to a front pin comes up short and wet', shot: { club: 'Iron', at: [-4, 129], wind: { mph: 17, dir: 'head' } }, expect: { end: 'water' } },
      { name: 'into the same headwind, aiming the arc 11 yards past the pin finds the green', shot: { club: 'Iron', at: [-4, 148], wind: { mph: 17, dir: 'head' } }, expect: { surf: ['GREENS'], maxToPin: 6 } },
    ],
    strategies: [
      { name: 'reading a following wind', plans: [
          { name: 'stock', shot: { club: 'Iron', wind: { mph: 17, dir: 'tail' } } },
          { name: 'read', shot: { club: 'Iron', at: [-4, 123], wind: { mph: 17, dir: 'tail' } } } ],
        expect: [
          ['ignoring the wind is a disaster even for a sharp player', r => r.stock.sharp.hazard > 0.5],
          ['reading the wind keeps a sharp player dry', r => r.read.sharp.hazard === 0],
          ['and saves strokes for everyone', r => r.read.sharp.score < r.stock.sharp.score - 1 && r.read.shaky.score < r.stock.shaky.score] ] },
      { name: 'skill matters', plans: [ { name: 'pin', shot: { club: 'Iron' } } ],
        expect: [
          ['a sharp player always finds the island in still air', r => r.pin.sharp.hazard === 0],
          ['a shaky player gets wet at least one time in seven', r => r.pin.shaky.hazard > 1 / 7] ] },
    ],
  },

  'standrews-17': {
    challenge: 'A long second into a narrow green on firm links turf: the deep Road Hole bunker eats into the front-left (a ball in it cannot play out forwards) and a hard road and a stone wall sit behind. Land it short and let it run; fly the pin and the road has it.',
    shots: [
      { name: 'a pure drive runs out on the firm fairway and leaves a full iron', shot: { club: 'Hammer', at: [0, 300], power: 1 }, expect: { end: 'rest', surf: ['FAIRWAY'], minToPin: 125, maxToPin: 150 } },
      { name: 'an iron flown right at the pin runs through the green onto the road', shot: { from: [0, 334], club: 'Iron' }, expect: { end: 'rest', surf: ['ROAD'] } },
      { name: 'carrying the bunker and landing just over it holds the green', shot: { from: [0, 334], club: 'Iron', at: [18, 464] }, expect: { surf: ['GREENS', 'FRINGE'], maxToPin: 10 } },
      { name: 'the same shot pulled a little drops into the Road Hole bunker', shot: { from: [0, 334], club: 'Iron', at: [18, 464], offset: -0.25 }, expect: { end: 'rest', surf: ['SAND'] } },
      { name: 'into an 18 mph headwind the same carry falls short, into the bunker', shot: { from: [0, 334], club: 'Iron', at: [18, 464], wind: { mph: 18, dir: 'head' } }, expect: { end: 'rest', surf: ['SAND'] } },
      { name: 'with an 18 mph tailwind it flies the green into the rough behind', shot: { from: [0, 334], club: 'Iron', at: [18, 464], wind: { mph: 18, dir: 'tail' } }, expect: { end: 'rest', surf: ['ROUGH', 'ROAD'] } },
      { name: 'a 3-wood run into the back of the green strikes the stone wall and kicks back onto the road', shot: { from: [0, 334], club: '3-Wood', at: [18, 470] }, expect: { end: 'rest', surf: ['ROAD'], wall: true } },
      { name: 'from the middle of the bunker a wedge at the pin cannot get out forwards', shot: { from: [22, 456], club: 'Wedge' }, expect: { end: 'rest', surf: ['SAND'] } },
      { name: 'the safe line to the wide front of the green holds it', shot: { from: [0, 334], club: 'Iron', at: [8, 455] }, expect: { surf: ['GREENS'] } },
    ],
    strategies: [
      // the baseline counts a bunker as a third of a stroke; here you cannot play out of this one towards the pin (shot above), so it costs a full stroke
      { name: 'the second shot: fly the pin, attack the tucked pin over the bunker, or play to the middle', lieAdd: { SAND: 1.0 }, plans: [
          { name: 'fly', shot: { from: [0, 334], club: 'Iron' } },
          { name: 'attack', shot: { from: [0, 334], club: 'Iron', at: [18, 464] } },
          { name: 'middle', shot: { from: [0, 334], club: 'Iron', at: [8, 455] } } ],
        expect: [
          ['flying the pin puts a sharp player on the road more often than not', r => (r.fly.sharp.surfs.ROAD || 0) > 10],
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
      { name: 'a well-struck iron at the middle of the green holds it', shot: { club: 'Iron', at: [10, 139], offset: 0.1 }, expect: { surf: ['GREENS'] } },
      { name: 'a slightly thin iron lands on the steep bank and feeds back into the creek', shot: { club: 'Iron', offset: 0.3 }, expect: { end: 'water' } },
      { name: 'a push right at the pin is wet', shot: { club: 'Iron', offset: 0.5 }, expect: { end: 'water' } },
      { name: 'carried 15 yards long, the ball finds the deep back-right bunker', shot: { club: 'Iron', at: [-12, 156] }, expect: { end: 'rest', surf: ['SAND'] } },
      { name: 'into a 14 mph headwind, a stock shot comes up short in the creek', shot: { club: 'Iron', wind: { mph: 14, dir: 'head' } }, expect: { end: 'water' } },
      { name: 'clubbing up for the headwind (arc past the pin) finishes on the putting surface or its edge', shot: { club: 'Iron', at: [-6, 150], wind: { mph: 14, dir: 'head' } }, expect: { surf: ['GREENS', 'FRINGE'], maxToPin: 9 } },
      { name: 'with a 14 mph tailwind, a stock shot flies the green into the back bunkers or beyond', shot: { club: 'Iron', wind: { mph: 14, dir: 'tail' } }, expect: { end: 'rest', surf: ['SAND', 'ROUGH'] } },
    ],
    strategies: [
      { name: 'the Sunday pin: attack it by the creek, or play to the deep middle', plans: [
          { name: 'pin', shot: { club: 'Iron' } },
          { name: 'middle', shot: { club: 'Iron', at: [10, 139] } } ],
        expect: [
          ['attacking the pin keeps a sharp player dry', r => r.pin.sharp.hazard === 0],
          ['a shaky player gets wet at least one time in four going at it', r => r.pin.shaky.hazard > 0.25],
          ['the middle is far safer for a shaky player', r => r.middle.shaky.hazard * 2 <= r.pin.shaky.hazard],
          ['attacking pays for a sharp player (about half a stroke); for a shaky one the tour baseline calls it a wash, so the middle costs nothing and drowns far less', r => r.pin.sharp.score + 0.4 < r.middle.sharp.score && r.middle.shaky.score <= r.pin.shaky.score + 0.1] ] },
    ],
  },
  'pinehurst-5': {
    challenge: 'A par 4 to an upside-down-saucer green: the crown sheds any approach that is not struck right at its heart, and every shed ball rolls into sandy waste with a hard recovery. Sandy waste lines the fairway too, so the drive is only half the problem.',
    shots: [
      { name: 'a good drive finds the fairway', shot: { club: 'Hammer', at: [0, 290], offset: 0.1 }, expect: { surf: ['FAIRWAY'] } },
      { name: 'a pushed drive is in the sandy waste, not the rough', shot: { club: 'Hammer', at: [0, 290], offset: 0.5 }, expect: { end: 'rest', surf: ['WASTE'] } },
      { name: 'from the fairway, a well-struck approach landed just short of the pin runs up to the heart of the crown', shot: { from: [0, 290], club: 'Iron', at: [6, 384], offset: 0.1 }, expect: { surf: ['GREENS'], maxToPin: 8 } },
      { name: 'aimed at the green\'s edge, even a well-struck approach is shed off it', shot: { from: [0, 290], club: 'Iron', at: [20, 388], offset: 0.1 }, expect: { end: 'rest', surf: ['WASTE', 'ROUGH', 'FRINGE'] } },
      { name: 'a slightly mis-hit approach (needle 0.3) does not stay on the green', shot: { from: [0, 290], club: 'Iron', offset: 0.3 }, expect: { end: 'rest', surf: ['WASTE', 'ROUGH', 'FRINGE'] } },
      { name: 'a short approach into the front slope is turned away, not fed to the pin', shot: { from: [0, 290], club: 'Iron', at: [6, 372] }, expect: { end: 'rest', minToPin: 6 } },
      { name: 'the waste is playable: a wedge from it gets back near the green', shot: { from: [-17, 362], club: 'Wedge', offset: 0.1 }, expect: { end: 'rest', maxToPin: 25 } },
    ],
    strategies: [
      { name: 'approach: go straight at the pin, or land it well short and hope the front slope kicks it up', plans: [
          { name: 'pin', shot: { from: [0, 290], club: 'Iron', at: [6, 384] } },
          { name: 'short', shot: { from: [0, 290], club: 'Iron', at: [6, 372] } } ],
        expect: [
          ['a sharp player holds the green most of the time', r => (r.pin.sharp.surfs.GREENS || 0) / r.pin.sharp.n >= 0.6],
          ['a shaky player rarely stays on it', r => (r.pin.shaky.surfs.GREENS || 0) / r.pin.shaky.n <= 0.4],
          ['laying up short does not help: the front slope turns it away, so it scores worse than going for the heart of the green', r => r.short.sharp.score > r.pin.sharp.score + 0.5 && r.short.shaky.score > r.pin.shaky.score],
          ['the gap between sharp and shaky is real: at least half a stroke', r => r.pin.shaky.score - r.pin.sharp.score >= 0.5] ] },
    ],
  },
};
