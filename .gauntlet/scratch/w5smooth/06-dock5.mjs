// CORRECTED pairing. Border scanlines 43 50 114 121 ... : y43 is a full-width
// (248px) section divider, not a row. Rows are (50,114) (121,185) (192,256)
// (263,327) (334,397) (404,452) (459,507) — 7 boxes, matching the 14 corner
// scanline runs exactly.
import { decode, W } from './lib.mjs'
const a = decode(`${W(4)}/commands-dock.png`)
const b = decode(`${W(5)}/commands-dock.png`)
const BD = [11, 15, 17]
const on = (img, x, y) => { const [r, g, bl] = img.px(x, y); return Math.abs(r - BD[0]) + Math.abs(g - BD[1]) + Math.abs(bl - BD[2]) > 2 }
const BOXES = [[50, 114], [121, 185], [192, 256], [263, 327], [334, 397], [404, 452], [459, 507]]

console.log('=== ROW BOXES, corrected ===')
for (const [t, bt] of BOXES) console.log(`  y${t}..${bt}  height ${bt - t + 1}px`)

console.log('\n=== LAYOUT NEUTRALITY: box edges, both waves ===')
for (const [t, bt] of BOXES) {
  const mid = Math.round((t + bt) / 2)
  const cols = (img) => { const c = []; for (let x = 0; x < img.w; x++) if (on(img, x, mid)) c.push(x); return c }
  const c4 = cols(a), c5 = cols(b)
  console.log(`  y${t}..${bt} mid y${mid}: w4 left=${c4[0]} right=${c4[c4.length - 1]} | w5 left=${c5[0]} right=${c5[c5.length - 1]}  ${c4[0] === c5[0] && c4[c4.length - 1] === c5[c5.length - 1] ? 'SAME' : '*** MOVED ***'}`)
}

console.log('\n=== BORDER STRAIGHT RUNS — stripe-trap analogue ===')
console.log('LEFT vertical border, contiguous run at x=7:')
for (const [t, bt] of BOXES) {
  const run = (img) => { let n = 0, best = 0; for (let y = t; y <= bt; y++) { if (on(img, 7, y)) { n++; best = Math.max(best, n) } else n = 0 } return best }
  const h = bt - t + 1, n4 = run(a), n5 = run(b)
  console.log(`  y${t}..${bt} h=${h}: w4=${n4} (${(100 * n4 / h).toFixed(1)}%)  w5=${n5} (${(100 * n5 / h).toFixed(1)}%)  delta ${n5 - n4}  [h-2r: 8px->${h - 16}, 16px->${h - 32}]`)
}
console.log('TOP horizontal border, contiguous run within box columns x7..241:')
for (const [t, bt] of BOXES) {
  const run = (img, y) => { let n = 0, best = 0; for (let x = 7; x <= 241; x++) { if (on(img, x, y)) { n++; best = Math.max(best, n) } else n = 0 } return best }
  const n4 = run(a, t), n5 = run(b, t)
  console.log(`  y${t}: w4=${n4} (${(100 * n4 / 235).toFixed(1)}%)  w5=${n5} (${(100 * n5 / 235).toFixed(1)}%)  delta ${n5 - n4}  [w-2r: 8px->219, 16px->203]`)
}

console.log('\n=== INK COUNT vs INK WEIGHT (the trap) ===')
for (const [img, name] of [[a, 'w4'], [b, 'w5']]) {
  let px = 0, wt = 0
  for (const [t, bt] of BOXES) for (let y = t - 1; y <= bt + 1; y++) for (let x = 6; x <= 242; x++) {
    const [r, g, bl] = img.px(x, y)
    const d = Math.abs(r - BD[0]) + Math.abs(g - BD[1]) + Math.abs(bl - BD[2])
    if (d > 2 && d < 60) { px++; wt += d }
  }
  console.log(`  ${name}: border-band pixel COUNT=${px}  ink WEIGHT=${wt}`)
}

console.log('\n=== ANY MINT INDICATOR IN THE DOCKS? ===')
for (const [f, n] of [['commands-dock', 'commands'], ['agents-dock', 'agents'], ['appearance-dock', 'appearance']]) {
  for (const wv of [4, 5]) {
    const img = decode(`${W(wv)}/${f}.png`)
    let mint = 0
    for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
      const [r, g, bl] = img.px(x, y)
      const mx = Math.max(r, g, bl), mn = Math.min(r, g, bl)
      if (mx - mn > 24 && g === mx && bl >= r) mint++
    }
    console.log(`  ${n} w${wv}: mint-ish pixels = ${mint} (${(100 * mint / (img.w * img.h)).toFixed(3)}%)`)
  }
}
