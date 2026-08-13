// CORRECTED dock analysis. The previous grouping merged all rows into one
// band and so reported a bogus "interior violation" count. Here the row
// rectangles are measured from the image itself, in BOTH waves, and compared.
import { decode, diff, bbox, clusters, W } from './lib.mjs'

const a = decode(`${W(4)}/commands-dock.png`)
const b = decode(`${W(5)}/commands-dock.png`)
const pts = diff(a, b)

// --- 1. Column confinement: is there ANY changed pixel away from the two edges?
const xs = pts.map(([x]) => x)
const leftMax = Math.max(...xs.filter(x => x < 124))
const rightMin = Math.min(...xs.filter(x => x >= 124))
console.log('=== COLUMN CONFINEMENT ===')
console.log(`changed pixels: ${pts.length}`)
console.log(`left group  x${Math.min(...xs)}..${leftMax}`)
console.log(`right group x${rightMin}..${Math.max(...xs)}`)
console.log(`UNTOUCHED middle band: x${leftMax + 1}..${rightMin - 1} = ${rightMin - leftMax - 1} columns with ZERO changed pixels`)

// --- 2. Row rectangles, measured independently in each wave.
// A command row paints a ground distinct from the dock background. Sample the
// row-ground colour from the middle of a known row, then find vertical runs.
function rowRects(img) {
  const bg = img.px(124, 90) // dock background between rows? verify below
  // Find, for each scanline, whether a ground exists at x=124 differing from
  // the dock's own backdrop. Use the modal colour of column x=124 as backdrop.
  const counts = new Map()
  for (let y = 0; y < img.h; y++) {
    const [r, g, bl] = img.px(2, y) // x=2 is outside the row box (rows start x7)
    counts.set(`${r},${g},${bl}`, (counts.get(`${r},${g},${bl}`) || 0) + 1)
  }
  const backdrop = [...counts.entries()].sort((p, q) => q[1] - p[1])[0][0].split(',').map(Number)
  // Column x=9: inside the row's left area, 2px in from the row's x7 edge.
  const runs = []
  let start = -1
  for (let y = 0; y < img.h; y++) {
    const [r, g, bl] = img.px(9, y)
    const isGround = Math.abs(r - backdrop[0]) + Math.abs(g - backdrop[1]) + Math.abs(bl - backdrop[2]) > 3
    if (isGround && start < 0) start = y
    else if (!isGround && start >= 0) { runs.push([start, y - 1]); start = -1 }
  }
  if (start >= 0) runs.push([start, img.h - 1])
  return { backdrop, runs: runs.filter(([s, e]) => e - s >= 8) }
}

console.log('\n=== ROW GROUND RECTANGLES (measured per wave, column x=9) ===')
const r4 = rowRects(a), r5 = rowRects(b)
console.log(`backdrop w4 rgb(${r4.backdrop})  w5 rgb(${r5.backdrop})`)
console.log(`w4 runs (${r4.runs.length}):`, r4.runs.map(([s, e]) => `${s}..${e}(h${e - s + 1})`).join(' '))
console.log(`w5 runs (${r5.runs.length}):`, r5.runs.map(([s, e]) => `${s}..${e}(h${e - s + 1})`).join(' '))

// --- 3. Row box edges measured at the row's VERTICAL MIDDLE (away from corners)
console.log('\n=== ROW BOX HORIZONTAL EDGES at each row mid-height ===')
function rowEdges(img, y) {
  const counts = new Map()
  for (let yy = 0; yy < img.h; yy++) { const [r, g, bl] = img.px(2, yy); counts.set(`${r},${g},${bl}`, (counts.get(`${r},${g},${bl}`) || 0) + 1) }
  const bd = [...counts.entries()].sort((p, q) => q[1] - p[1])[0][0].split(',').map(Number)
  let x0 = -1, x1 = -1
  for (let x = 0; x < img.w; x++) {
    const [r, g, bl] = img.px(x, y)
    if (Math.abs(r - bd[0]) + Math.abs(g - bd[1]) + Math.abs(bl - bd[2]) > 3) { if (x0 < 0) x0 = x; x1 = x }
  }
  return [x0, x1]
}
for (const [s, e] of r5.runs) {
  const mid = Math.round((s + e) / 2)
  const e4 = rowEdges(a, mid), e5 = rowEdges(b, mid)
  const same = e4[0] === e5[0] && e4[1] === e5[1]
  console.log(`  row y${s}..${e} (h=${e - s + 1}) mid y${mid}: w4 x${e4[0]}..${e4[1]}  w5 x${e5[0]}..${e5[1]}  ${same ? 'SAME' : '*** MOVED ***'}`)
}

// --- 4. Text position control: ink rows inside the untouched middle band.
console.log('\n=== TEXT INK CONTROL (middle band x23..225, both waves) ===')
function inkRows(img) {
  const counts = new Map()
  for (let yy = 0; yy < img.h; yy++) { const [r, g, bl] = img.px(2, yy); counts.set(`${r},${g},${bl}`, (counts.get(`${r},${g},${bl}`) || 0) + 1) }
  const bd = [...counts.entries()].sort((p, q) => q[1] - p[1])[0][0].split(',').map(Number)
  const rows = []
  for (let y = 0; y < img.h; y++) {
    let n = 0
    for (let x = 23; x <= 225; x++) { const [r, g, bl] = img.px(x, y); if (Math.abs(r - bd[0]) + Math.abs(g - bd[1]) + Math.abs(bl - bd[2]) > 24) n++ }
    rows.push(n)
  }
  return rows
}
const i4 = inkRows(a), i5 = inkRows(b)
let mismatch = 0, firstBad = -1
for (let y = 0; y < i4.length; y++) if (i4[y] !== i5[y]) { mismatch++; if (firstBad < 0) firstBad = y }
console.log(`scanlines with differing strong-ink counts: ${mismatch}${firstBad >= 0 ? ' first at y' + firstBad : ''}`)
const inkY4 = i4.map((n, y) => n > 0 ? y : -1).filter(y => y >= 0)
const inkY5 = i5.map((n, y) => n > 0 ? y : -1).filter(y => y >= 0)
console.log(`ink scanlines w4=${inkY4.length} w5=${inkY5.length}  first ink y${inkY4[0]}/${inkY5[0]}  last ink y${inkY4[inkY4.length - 1]}/${inkY5[inkY5.length - 1]}`)

// --- 5. Any indicator run in the dock rows that lost length? (the stripe trap)
console.log('\n=== DOCK ROW INDICATOR CHECK ===')
// Look for a saturated (mint) vertical run at the left edge columns of each row.
function mintRun(img, col, y0, y1) {
  let n = 0
  for (let y = y0; y <= y1; y++) {
    const [r, g, bl] = img.px(col, y)
    const mx = Math.max(r, g, bl), mn = Math.min(r, g, bl)
    if (mx - mn > 24 && g >= r && g >= bl) n++
  }
  return n
}
for (const [s, e] of r5.runs) {
  const m4 = [7, 8, 9].map(c => mintRun(a, c, s, e))
  const m5 = [7, 8, 9].map(c => mintRun(b, c, s, e))
  if (m4.some(v => v) || m5.some(v => v)) console.log(`  row y${s}..${e}: mint run at x7/8/9  w4=${m4}  w5=${m5}`)
}
console.log('  (no lines above => no dock row carries a mint left indicator in either wave)')
