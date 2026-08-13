import { decode, W, fmt } from './lib.mjs'

console.log('=== ONE TYPE SCALE: every authored font-size against 15 * 1.15^k ===')
console.log('(sizes re-grepped from the current tree this wave; the diff touched no font-size)')
const SIZES = [
  ['--fs-micro (11px)', 11, 64], ['--fs-ui (13px)', 13, 42], ['--fs-body (15px)', 15, 14],
  ['calc(body*1.15) = 17.25px', 17.25, 4], ['calc(body*1.15*1.15) = 19.8375px', 19.8375, 2],
  ['20px literal', 20, 2], ['--fs-display (46px)', 46, 2],
]
let maxDev = 0, off = 0
for (const [name, v, uses] of SIZES) {
  let bestK = null, bestD = 1e9
  for (let k = -6; k <= 12; k++) { const r = 15 * Math.pow(1.15, k); const dd = Math.abs(v - r); if (dd < bestD) { bestD = dd; bestK = k } }
  const rung = 15 * Math.pow(1.15, bestK)
  if (bestD > maxDev) maxDev = bestD
  if (bestD > 0.35) off++
  console.log(`  ${name.padEnd(34)} uses=${String(uses).padStart(2)}  k=${String(bestK).padStart(2)} rung=${fmt(rung, 4)}  dev=${fmt(bestD, 4)}px  ${bestD > 0.35 ? 'OFF-LADDER' : 'on ladder'}`)
}
console.log(`  MAX DEVIATION = ${fmt(maxDev, 3)}px  tolerance 0.35px  off-ladder = ${off}`)

console.log('\n=== BASELINE PITCH from pixels, wave 5 (15 * 1.6 = 24.0px expected) ===')
function pitch(wv, file, x0, x1, y0, y1, label, thr) {
  const d = decode(`${W(wv)}/${file}`)
  const light = (x, y) => { const o = (y * d.w + x) * 4; return d.data[o] > thr && d.data[o + 1] > thr }
  const bands = []; let cur = null
  for (let y = y0; y <= y1; y++) {
    let n = 0; for (let x = x0; x <= x1; x++) if (light(x, y)) n++
    if (n > 0) { if (!cur) cur = { y0: y, y1: y }; else cur.y1 = y } else { if (cur) { bands.push(cur); cur = null } }
  }
  if (cur) bands.push(cur)
  const tops = bands.map(b => b.y0), gaps = tops.slice(1).map((t, i) => t - tops[i])
  console.log(`  w${wv} ${label}`)
  console.log(`     ${bands.length} bands: ${bands.map(b => `y${b.y0}..${b.y1}(h${b.y1 - b.y0 + 1})`).join(' ')}`)
  console.log(`     pitches: [${gaps.join(', ')}]  ${gaps.length ? `mean=${fmt(gaps.reduce((a, b) => a + b, 0) / gaps.length)}px` : ''}`)
}
for (const wv of [4, 5]) {
  pitch(wv, 'chat.png', 515, 970, 13, 120, 'chat user bubble x515..970', 90)
  pitch(wv, 'chat.png', 250, 970, 300, 470, 'chat assistant col x250..970 y300..470', 90)
}

console.log('\n=== RAIL SHARED 16px LEFT EDGE ===')
console.log('The head padding, filter placeholder, scope chips, group headings and row')
console.log('titles all register on one left edge. Measure the leftmost INK column of')
console.log('each text band in the pre-list stack and the first rows, both waves.')
for (const wv of [4, 5]) {
  const d = decode(`${W(wv)}/sidebar.png`)
  const BG = (() => { const m = new Map(); for (let i = 0; i < d.w * d.h; i++) { const o = i * 4; const k = `${d.data[o]},${d.data[o + 1]},${d.data[o + 2]},${d.data[o + 3]}`; m.set(k, (m.get(k) || 0) + 1) } return [...m.entries()].sort((p, q) => q[1] - p[1])[0][0].split(',').map(Number) })()
  const isInk = (x, y) => { const o = (y * d.w + x) * 4; let dd = 0; for (let c = 0; c < 4; c++) dd += Math.abs(d.data[o + c] - BG[c]); return dd > 24 }
  // text bands over the whole rail
  const bands = []; let cur = null
  for (let y = 0; y < d.h; y++) {
    let n = 0, l = -1
    for (let x = 0; x < d.w; x++) if (isInk(x, y)) { n++; if (l < 0) l = x }
    if (n > 0) { if (!cur) cur = { y0: y, y1: y, l }; else { cur.y1 = y; cur.l = Math.min(cur.l, l) } } else { if (cur) { bands.push(cur); cur = null } }
  }
  if (cur) bands.push(cur)
  console.log(`\n  wave ${wv}: ${bands.length} ink bands; first 14 with their leftmost ink column:`)
  for (const b of bands.slice(0, 14)) console.log(`    y${String(b.y0).padStart(3)}..${String(b.y1).padEnd(3)} (h${String(b.y1 - b.y0 + 1).padStart(3)})  leftmost ink x=${b.l}`)
  const l16 = bands.slice(0, 14).filter(b => b.l === 16).length
  console.log(`    bands whose leftmost ink is exactly x=16: ${l16} of ${Math.min(14, bands.length)}`)
  const hist = new Map()
  for (const b of bands) hist.set(b.l, (hist.get(b.l) || 0) + 1)
  console.log(`    leftmost-ink histogram over ALL ${bands.length} bands: ${[...hist.entries()].sort((p, q) => q[1] - p[1]).slice(0, 8).map(([x, n]) => `x${x}:${n}`).join('  ')}`)
}
