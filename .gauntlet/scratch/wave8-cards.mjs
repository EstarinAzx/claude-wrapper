// Wave 8 leg measurement — TOOL CARD inner heights and disclosure-row rhythm.
// Checks the Chat builder's predictions: card inner height back down from
// 134/135 toward ~112/113, and the disclosure clearances' SIGN flipping so the
// two rows sit closer to each other than to the prose above.
//
// Method: the card paints a distinct ground over the transcript wash. Find the
// card's vertical extent by scanning ONE column inside the card's x-range for
// contiguous runs of the card ground.
import { decode, at } from './w8lib.mjs'

const A = '.gauntlet/waves/core-after-docks/7'
const B = '.gauntlet/waves/core-after-docks/8'

const eq = (p, q, tol = 3) =>
  Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) + Math.abs(p[2] - q[2]) <= tol

const cardRuns = (im, x) => {
  // Sample the transcript ground well away from any card.
  const ground = at(im, 5, Math.floor(im.h / 2))
  const runs = []
  let s = -1
  for (let y = 0; y < im.h; y++) {
    const onCard = !eq(at(im, x, y), ground, 6)
    if (onCard && s < 0) s = y
    if (!onCard && s >= 0) { if (y - s >= 20) runs.push([s, y - 1]); s = -1 }
  }
  if (s >= 0 && im.h - s >= 20) runs.push([s, im.h - 1])
  return { ground, runs }
}

// Inside a card, find the horizontal bands that are NOT the card ground —
// these are the disclosure row grounds (wave 8) or nothing (wave 7).
const bandsIn = (im, x, y0, y1) => {
  const card = at(im, x, y0 + 3)
  const bands = []
  let s = -1
  for (let y = y0; y <= y1; y++) {
    const differs = !eq(at(im, x, y), card, 4)
    if (differs && s < 0) s = y
    if (!differs && s >= 0) { bands.push([s, y - 1]); s = -1 }
  }
  if (s >= 0) bands.push([s, y1])
  return { card, bands }
}

const X_PROBE = 700   // inside the card's x-range (cards span ~x251..820), clear of label ink

for (const [name, dir] of [['WAVE 7', A], ['WAVE 8', B]]) {
  const im = decode(`${dir}/chat.png`)
  const { ground, runs } = cardRuns(im, X_PROBE)
  console.log(`\n===== ${name}  chat.png ${im.w}x${im.h}  transcript ground=${ground.join(',')}  probe x=${X_PROBE}`)
  runs.forEach(([y0, y1], i) => {
    const h = y1 - y0 + 1
    const { card, bands } = bandsIn(im, X_PROBE, y0, y1)
    console.log(`  CARD ${i + 1}: y${y0}..${y1}  outer h=${h}  inner h=${h - 2}  cardGround=${card.join(',')}`)
    if (bands.length) {
      console.log(`    non-ground bands inside: ${bands.map(([a, b]) => `y${a}..${b}(h${b - a + 1})`).join('  ')}`)
      // clearances: card top -> band1, band1 -> band2
      const clears = []
      let prevEnd = y0
      for (const [a, b] of bands) { clears.push(a - prevEnd - 1); prevEnd = b }
      clears.push(y1 - prevEnd)
      console.log(`    clearances (cardTop->b1, b1->b2, ..., last->cardBottom): ${clears.join(' / ')}`)
    } else {
      console.log(`    non-ground bands inside: NONE (rows paint nothing)`)
    }
  })
}
