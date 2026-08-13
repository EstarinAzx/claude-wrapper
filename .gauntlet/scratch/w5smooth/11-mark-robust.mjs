// Robustness sweep for the mark OKLCH reading: does the top/bottom hue,
// chroma and lightness delta survive deeper erosion? If the numbers are a rim
// artifact they will move a lot as the rim is stripped further.
import { decode, oklch, W, BAR, fmt } from './lib.mjs'

function erode(m, w, h, k) {
  let cur = m
  for (let s = 0; s < k; s++) {
    const nx = new Uint8Array(w * h)
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const i = y * w + x; if (!cur[i]) continue
      let ok = 1
      for (let dy = -1; dy <= 1 && ok; dy++) for (let dx = -1; dx <= 1; dx++) if (!cur[(y + dy) * w + x + dx]) { ok = 0; break }
      if (ok) nx[i] = 1
    }
    cur = nx
  }
  return cur
}
function rowMean(d, mask, y) {
  let r = 0, g = 0, b = 0, n = 0
  for (let x = 0; x < d.w; x++) { const i = y * d.w + x; if (!mask[i]) continue; const o = i * 4; r += d.data[o]; g += d.data[o + 1]; b += d.data[o + 2]; n++ }
  return n ? { r: r / n, g: g / n, b: b / n, n } : null
}
function tb(d, mask) {
  const ys = []
  for (let y = 0; y < d.h; y++) { let n = 0; for (let x = 0; x < d.w; x++) if (mask[y * d.w + x]) n++; if (n) ys.push(y) }
  if (ys.length < 2) return null
  const t = rowMean(d, mask, ys[0]), b = rowMean(d, mask, ys[ys.length - 1])
  return { t: oklch(t.r, t.g, t.b), b: oklch(b.r, b.g, b.b), rows: ys.length, nt: t.n, nb: b.n }
}
function maskBox(d, x0, x1, y0, y1) {
  const m = new Uint8Array(d.w * d.h)
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const o = (y * d.w + x) * 4
    if (Math.max(d.data[o], d.data[o + 1], d.data[o + 2]) - Math.min(d.data[o], d.data[o + 1], d.data[o + 2]) > 20) m[y * d.w + x] = 1
  }
  return m
}

const APP = [
  ['titlebar.png', 'app .logo-mark 22px', 14, 35, 13, 34],
  ['welcome.png', 'app .welcome-mark 44px', 513, 556, 242, 285],
  ['chat.png', 'app .avatar 28px', 211, 238, 111, 138],
]
const REF = [
  ['ref mark 40px (a)', 412, 451, 413, 452],
  ['ref mark 40px (b)', 412, 451, 714, 753],
  ['ref mark 29px', 77, 105, 143, 171],
  ['ref mark 48x52', 1154, 1201, 989, 1040],
]

console.log('=== EROSION SWEEP: app marks ===')
console.log('site                        e  rows  L_top   L_bot    dL      C_top   C_bot    dC       H_top    H_bot    dH')
for (const [f, label, x0, x1, y0, y1] of APP) {
  const d = decode(`${W(5)}/${f}`)
  const base = maskBox(d, x0, x1, y0, y1)
  let full = 0; for (let i = 0; i < base.length; i++) full += base[i]
  const boxArea = (x1 - x0 + 1) * (y1 - y0 + 1)
  for (const e of [1, 2, 3, 4]) {
    const m = erode(base, d.w, d.h, e)
    const r = tb(d, m); if (!r) { console.log(`${label.padEnd(26)} ${e}  (gone)`); continue }
    console.log(`${label.padEnd(26)} ${e}  ${String(r.rows).padStart(3)}  ${fmt(r.t.L, 4)} ${fmt(r.b.L, 4)} ${fmt(r.b.L - r.t.L, 4).padStart(8)}  ${fmt(r.t.C, 4)} ${fmt(r.b.C, 4)} ${fmt(r.b.C - r.t.C, 4).padStart(8)}  ${fmt(r.t.H, 2).padStart(7)} ${fmt(r.b.H, 2).padStart(7)} ${fmt(r.b.H - r.t.H, 2).padStart(7)}`)
  }
  console.log(`   ^ mask fill ${full}/${boxArea} = ${fmt(100 * full / boxArea, 1)}%  (disc ~78.5%, square ~100%)`)
}

console.log('\n=== EROSION SWEEP: identity reference marks ===')
const rd = decode(`${BAR}/frost-mono-reference.png`)
console.log('site                        e  rows  L_top   L_bot    dL      C_top   C_bot    dC       H_top    H_bot    dH')
for (const [label, x0, x1, y0, y1] of REF) {
  const base = maskBox(rd, x0, x1, y0, y1)
  let full = 0; for (let i = 0; i < base.length; i++) full += base[i]
  const boxArea = (x1 - x0 + 1) * (y1 - y0 + 1)
  for (const e of [1, 2, 3, 4]) {
    const m = erode(base, rd.w, rd.h, e)
    const r = tb(rd, m); if (!r) { console.log(`${label.padEnd(26)} ${e}  (gone)`); continue }
    console.log(`${label.padEnd(26)} ${e}  ${String(r.rows).padStart(3)}  ${fmt(r.t.L, 4)} ${fmt(r.b.L, 4)} ${fmt(r.b.L - r.t.L, 4).padStart(8)}  ${fmt(r.t.C, 4)} ${fmt(r.b.C, 4)} ${fmt(r.b.C - r.t.C, 4).padStart(8)}  ${fmt(r.t.H, 2).padStart(7)} ${fmt(r.b.H, 2).padStart(7)} ${fmt(r.b.H - r.t.H, 2).padStart(7)}`)
  }
  console.log(`   ^ mask fill ${full}/${boxArea} = ${fmt(100 * full / boxArea, 1)}%`)
}

console.log('\n=== IS THE APP MARK A PROPORTIONAL MULTIPLY? ===')
console.log('A multiply of linear RGB by k holds hue EXACTLY and scales L and C by')
console.log('the same factor. Test: L_bot/L_top vs C_bot/C_top.')
for (const [f, label, x0, x1, y0, y1] of APP) {
  const d = decode(`${W(5)}/${f}`)
  const m = erode(maskBox(d, x0, x1, y0, y1), d.w, d.h, 2)
  const r = tb(d, m)
  console.log(`  ${label.padEnd(26)} L ratio=${fmt(r.b.L / r.t.L, 4)}  C ratio=${fmt(r.b.C / r.t.C, 4)}  agree to ${fmt(100 * Math.abs(r.b.C / r.t.C - r.b.L / r.t.L) / (r.b.L / r.t.L), 2)}%   dH=${fmt(r.b.H - r.t.H, 2)}deg`)
}
for (const [label, x0, x1, y0, y1] of REF.slice(0, 3)) {
  const m = erode(maskBox(rd, x0, x1, y0, y1), rd.w, rd.h, 2)
  const r = tb(rd, m)
  console.log(`  ${label.padEnd(26)} L ratio=${fmt(r.b.L / r.t.L, 4)}  C ratio=${fmt(r.b.C / r.t.C, 4)}  agree to ${fmt(100 * Math.abs(r.b.C / r.t.C - r.b.L / r.t.L) / (r.b.L / r.t.L), 2)}%   dH=${fmt(r.b.H - r.t.H, 2)}deg`)
}
