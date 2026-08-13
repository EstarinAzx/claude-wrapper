// Dock rows paint a 1px BORDER, not a fill. Measure the box edges from the
// border, both waves, and the border's STRAIGHT-RUN length (the stripe-trap
// analogue: a bigger corner eats run length off a border too).
import { decode, W } from './lib.mjs'
const a = decode(`${W(4)}/commands-dock.png`)
const b = decode(`${W(5)}/commands-dock.png`)
const BD = [11, 15, 17]
const on = (img, x, y) => { const [r, g, bl] = img.px(x, y); return Math.abs(r - BD[0]) + Math.abs(g - BD[1]) + Math.abs(bl - BD[2]) > 2 }

// Horizontal border scanlines: y where x=124 is non-backdrop AND the run at
// that y spans nearly the full box width (a border, not a glyph).
function hBorders(img) {
  const out = []
  for (let y = 0; y < img.h; y++) {
    let n = 0
    for (let x = 24; x <= 224; x++) if (on(img, x, y)) n++
    if (n > 180) out.push(y)
  }
  return out
}
// Vertical border columns inside a row band
function vBorders(img, y) {
  const cols = []
  for (let x = 0; x < img.w; x++) if (on(img, x, y)) cols.push(x)
  return cols
}

const hb4 = hBorders(a), hb5 = hBorders(b)
console.log('=== HORIZONTAL BORDER SCANLINES (full-width runs) ===')
console.log('w4:', hb4.join(' '))
console.log('w5:', hb5.join(' '))
console.log('identical:', JSON.stringify(hb4) === JSON.stringify(hb5))

// Pair into boxes
const boxes = []
for (let i = 0; i + 1 < hb5.length; i += 2) boxes.push([hb5[i], hb5[i + 1]])
console.log('\n=== ROW BOXES (from w5 borders) ===')
for (const [t, bt] of boxes) console.log(`  y${t}..${bt}  height ${bt - t + 1}`)

console.log('\n=== VERTICAL EDGES at each box mid-height ===')
for (const [t, bt] of boxes) {
  const mid = Math.round((t + bt) / 2)
  const c4 = vBorders(a, mid), c5 = vBorders(b, mid)
  const l4 = c4[0], r4 = c4[c4.length - 1], l5 = c5[0], r5 = c5[c5.length - 1]
  console.log(`  box y${t}..${bt} mid y${mid}: left w4=${l4} w5=${l5}  right w4=${r4} w5=${r5}  ${l4 === l5 && r4 === r5 ? 'SAME' : '*** MOVED ***'}`)
}

console.log('\n=== BORDER STRAIGHT-RUN LENGTHS (the stripe-trap analogue) ===')
console.log('Left vertical border: contiguous run at x=7 within each box.')
for (const [t, bt] of boxes) {
  const run = (img) => { let n = 0; for (let y = t; y <= bt; y++) if (on(img, 7, y)) n++; return n }
  const h = bt - t + 1
  const n4 = run(a), n5 = run(b)
  console.log(`  box y${t}..${bt} (h=${h}): x7 run w4=${n4} (${(100 * n4 / h).toFixed(0)}%)  w5=${n5} (${(100 * n5 / h).toFixed(0)}%)  delta ${n5 - n4}`)
}
console.log('\nTop horizontal border: contiguous run at each box top y.')
for (const [t, bt] of boxes) {
  const run = (img, y) => { let n = 0; for (let x = 0; x < img.w; x++) if (on(img, x, y)) n++; return n }
  const n4 = run(a, t), n5 = run(b, t)
  console.log(`  box top y${t}: w4=${n4}px  w5=${n5}px  delta ${n5 - n4}  (box width 235)`)
}

console.log('\n=== TOTAL BORDER INK, both waves (does the row read weaker?) ===')
for (const [img, name] of [[a, 'w4'], [b, 'w5']]) {
  let ink = 0, sum = 0
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    const [r, g, bl] = img.px(x, y)
    const d = Math.abs(r - BD[0]) + Math.abs(g - BD[1]) + Math.abs(bl - BD[2])
    if (d > 2 && d < 60) { ink++; sum += d }
  }
  console.log(`  ${name}: faint-ink px=${ink} sum=${sum}`)
}
