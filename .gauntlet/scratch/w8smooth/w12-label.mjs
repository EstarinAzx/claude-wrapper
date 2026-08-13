import { decode } from './png.mjs'

const ROOT = 'D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/12'
const C = decode(`${ROOT}/chat.png`)
const near = (c, t, k = 6) => Math.abs(c[0] - t[0]) + Math.abs(c[1] - t[1]) + Math.abs(c[2] - t[2]) <= k
const fill = [8, 12, 14]
const outline = [25, 29, 31]
const card = [11, 15, 17]

console.log('===== PROSE vs LABEL INK =====')
const bands = [
  ['c1 prose1', 228, 241, 260, 800, card],
  ['c1 prose2', 253, 266, 260, 800, card],
  ['row1', 280, 287, 266, 320, fill],
  ['row2', 303, 310, 266, 320, fill],
  ['c2 prose1', 446, 458, 260, 800, card],
  ['c2 row1', 499, 506, 266, 320, fill]
]
for (const [lbl, y0, y1, xs, xe, g] of bands) {
  const cols = []
  for (let x = xs; x <= xe; x++) {
    let n = 0
    for (let y = y0; y <= y1; y++) if (!near(C.at(x, y), g, 12)) n++
    cols.push([x, n])
  }
  const runs = []; let r = null
  for (const [x, n] of cols) {
    if (n) { if (!r) r = { x0: x, n: 0 }; r.x1 = x; r.n += n }
    else if (r) { runs.push(r); r = null }
  }
  if (r) runs.push(r)
  console.log(`  ${lbl.padEnd(12)} y${y0}..${y1}: ${runs.map((r) => `x${r.x0}..${r.x1}(${r.n})`).join(' ')}`)
}

console.log('\n  row1 raw non-fill x266..300 (skip exact outline):')
for (let x = 266; x <= 300; x++) {
  const vals = []
  for (let y = 280; y <= 287; y++) {
    const c = C.at(x, y)
    if (!near(c, fill, 12)) vals.push(`${y}:${c.join('/')}`)
  }
  if (vals.length) console.log(`    x${x} ${vals.join(' ')}`)
}

console.log('\n  first non-fill-and-non-outline ink per row:')
for (const [lbl, y0, y1] of [['row1', 280, 287], ['row2', 303, 310], ['c2row1', 499, 506], ['c2row2', 522, 529]]) {
  let lx = -1
  for (let x = 266; x <= 320; x++) {
    let n = 0
    for (let y = y0; y <= y1; y++) {
      const c = C.at(x, y)
      if (!near(c, fill, 12) && !near(c, outline, 4)) n++
    }
    if (n) { lx = x; break }
  }
  console.log(`  ${lbl} caret/label x${lx} vs prose 266 = +${lx - 266}`)
}
