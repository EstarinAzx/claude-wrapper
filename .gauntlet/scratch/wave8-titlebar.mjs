// Wave 8 leg measurement — TITLEBAR left group painted intervals.
// Written fresh because wave 7's script reproduced the exact known-bad reading
// the state file warns about: it scanned the full strip height, caught the y47
// hairline, and reported the whole 341px strip as one ink run.
//
// THE FIX: scan a y-band strictly INSIDE the strip so no full-width chrome is
// in scope. The 48px titlebar carries a hairline at y47; the mark is 22px tall
// and vertically centred, so y14..y33 is inside the mark and clear of both the
// top edge and the hairline.
import { decode, at } from './w8lib.mjs'

const W7 = '.gauntlet/waves/core-after-docks/7'
const W8 = '.gauntlet/waves/core-after-docks/8'

const Y0 = 14, Y1 = 33          // strictly inside the strip
const XMAX = 400                // left group only; session title starts ~x400

// Ground is the flat wash. Take the modal colour of a patch known to be empty:
// x350..390 inside the band, between the left group and the centred title.
const groundOf = (im) => {
  const tally = new Map()
  for (let y = Y0; y <= Y1; y++)
    for (let x = 350; x <= 390; x++) {
      const k = at(im, x, y).join(',')
      tally.set(k, (tally.get(k) ?? 0) + 1)
    }
  let best = null, n = 0
  for (const [k, v] of tally) if (v > n) { n = v; best = k }
  return best.split(',').map(Number)
}

// A column is INKED if any pixel in the band differs from ground beyond a
// tolerance that ignores antialias fringe on the wash itself.
const inkedCols = (im, ground, tol = 6) => {
  const cols = []
  for (let x = 0; x <= XMAX; x++) {
    let inked = false
    for (let y = Y0; y <= Y1 && !inked; y++) {
      const p = at(im, x, y)
      const d = Math.abs(p[0] - ground[0]) + Math.abs(p[1] - ground[1]) + Math.abs(p[2] - ground[2])
      if (d > tol) inked = true
    }
    cols.push(inked)
  }
  return cols
}

const runsAndGaps = (cols) => {
  const runs = []
  let s = -1
  for (let x = 0; x < cols.length; x++) {
    if (cols[x] && s < 0) s = x
    if (!cols[x] && s >= 0) { runs.push([s, x - 1]); s = -1 }
  }
  if (s >= 0) runs.push([s, cols.length - 1])
  const gaps = []
  for (let i = 1; i < runs.length; i++) gaps.push({ from: runs[i - 1][1], to: runs[i][0], width: runs[i][0] - runs[i - 1][1] - 1 })
  return { runs, gaps }
}

for (const [name, dir] of [['WAVE 7', W7], ['WAVE 8', W8]]) {
  const im = decode(`${dir}/titlebar.png`)
  const g = groundOf(im)
  const { runs, gaps } = runsAndGaps(inkedCols(im, g))
  console.log(`\n${name}  ${im.w}x${im.h}  ground=${g.join(',')}  band y${Y0}..${Y1}`)
  console.log('  ink runs:', runs.map(([a, b]) => `x${a}..${b}(w${b - a + 1})`).join('  '))
  console.log('  all clearances:', gaps.map((x) => x.width).join(' / '))
  const groupGaps = gaps.filter((x) => x.width >= 4).map((x) => x.width)
  console.log('  group clearances:', groupGaps.join(' / '))
  const edge = runs.length ? runs[runs.length - 1][1] : null
  console.log('  group right edge (last inked col in x0..400):', edge)
  if (groupGaps.length === 3) {
    const [tick, brk, pill] = groupGaps
    console.log(`  RATIO break/tick = ${(brk / tick).toFixed(2)}x   break/pill = ${(brk / pill).toFixed(2)}x`)
  }
}
