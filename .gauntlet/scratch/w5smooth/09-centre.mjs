// SIX CENTRING PLACES, wave 4 vs wave 5, read off the INK BOUNDING BOX.
// Same six sites and same method the wave-3/4 passes used, so the numbers are
// directly comparable. Centroid is deliberately NOT used: a left-registered
// block drags its centroid left of its bbox centre as a property of the
// composition, not a defect (Welcome hero: centroid -91.59px vs bbox +0.50px).
// Also: an L-R margin asymmetry is TWICE the displacement; never compare them.
import { decode, W, fmt } from './lib.mjs'

function bg(d) {
  const h = new Map()
  for (let i = 0; i < d.w * d.h; i++) { const o = i * 4; const k = `${d.data[o]},${d.data[o + 1]},${d.data[o + 2]},${d.data[o + 3]}`; h.set(k, (h.get(k) || 0) + 1) }
  return [...h.entries()].sort((p, q) => q[1] - p[1])[0][0].split(',').map(Number)
}
function inkBox(d, BG, x0, x1, y0, y1, thr = 0) {
  let a = 1e9, b = -1, t = 1e9, bt = -1, n = 0
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const o = (y * d.w + x) * 4
    let dd = 0; for (let c = 0; c < 4; c++) dd += Math.abs(d.data[o + c] - BG[c])
    if (dd > thr) { if (x < a) a = x; if (x > b) b = x; if (y < t) t = y; if (y > bt) bt = y; n++ }
  }
  return { x0: a, x1: b, y0: t, y1: bt, n }
}
const rep = (name, pane, box) => {
  const L = box.x0, R = (pane - 1) - box.x1
  const cx = (box.x0 + box.x1 + 1) / 2, pc = pane / 2
  console.log(`  ${name.padEnd(44)} x${box.x0}..${box.x1} w=${box.x1 - box.x0 + 1}  L=${L} R=${R} asym=${L - R}  bboxC=${fmt(cx)} paneC=${pc} DISP=${fmt(cx - pc)}px`)
  return cx - pc
}

const results = {}
for (const wv of [4, 5]) {
  console.log(`\n--- WAVE ${wv} ---`)
  const r = {}
  { const d = decode(`${W(wv)}/welcome.png`); r[1] = rep('1. Welcome hero ink, pane 1440', 1440, inkBox(d, bg(d), 0, d.w - 1, 0, d.h - 1)) }
  { const d = decode(`${W(wv)}/welcome-min-window.png`); r[2] = rep('2. Welcome hero ink, pane 640', 640, inkBox(d, bg(d), 0, d.w - 1, 0, d.h - 1)) }
  { const d = decode(`${W(wv)}/chat.png`); const b = inkBox(d, bg(d), 0, d.w - 1, 0, d.h - 1)
    const cx = (b.x0 + b.x1 + 1) / 2
    r[3] = cx - 591
    console.log(`  3. Transcript column, chat.png (1182 eff)    x${b.x0}..${b.x1} w=${b.x1 - b.x0 + 1}  L=${b.x0} R(vs1182)=${1181 - b.x1} asym=${b.x0 - (1181 - b.x1)}  bboxC=${fmt(cx)} paneC=591 DISP=${fmt(cx - 591)}px  [raw 1192 pane: ${fmt(cx - 596)}px]`) }
  { const d = decode(`${W(wv)}/input-bar.png`); r[4] = rep('4. Composer pill ink, input-bar pane 1192', 1192, inkBox(d, bg(d), 0, d.w - 1, 0, d.h - 1)) }
  { const d = decode(`${W(wv)}/titlebar.png`); r[5] = rep('5. Titlebar painted extent, pane 1440', 1440, inkBox(d, bg(d), 0, d.w - 1, 0, d.h - 1)) }
  { const d = decode(`${W(wv)}/sidebar.png`); r[6] = rep('6. Sidebar rail content ink, pane 248', 248, inkBox(d, bg(d), 0, d.w - 1, 0, d.h - 1)) }
  results[wv] = r
}
console.log('\n=== DELTA wave4 -> wave5 ===')
for (const k of [1, 2, 3, 4, 5, 6]) console.log(`  site ${k}: ${fmt(results[4][k])} -> ${fmt(results[5][k])}   delta ${fmt(results[5][k] - results[4][k])}px`)

// ---- COMPOSER INTERNAL ALIGNMENT: pill vs controls strip vs footer line ----
console.log('\n=== COMPOSER INTERNAL AXES (input-bar.png) ===')
for (const wv of [4, 5]) {
  const d = decode(`${W(wv)}/input-bar.png`)
  const BG = bg(d)
  const on = (x, y) => { const o = (y * d.w + x) * 4; let dd = 0; for (let c = 0; c < 4; c++) dd += Math.abs(d.data[o + c] - BG[c]); return dd > 0 }
  // per-scanline extents
  const rows = []
  for (let y = 0; y < d.h; y++) {
    let a = -1, b = -1
    for (let x = 0; x < d.w; x++) if (on(x, y)) { if (a < 0) a = x; b = x }
    rows.push([y, a, b])
  }
  const bands = []
  let cur = null
  for (const [y, a, b] of rows) {
    if (a < 0) { if (cur) { bands.push(cur); cur = null } continue }
    if (!cur) cur = { y0: y, y1: y, x0: a, x1: b }
    else { cur.y1 = y; cur.x0 = Math.min(cur.x0, a); cur.x1 = Math.max(cur.x1, b) }
  }
  if (cur) bands.push(cur)
  console.log(`  wave ${wv}: ${bands.length} ink band(s)`)
  for (const bd of bands) {
    const cx = (bd.x0 + bd.x1 + 1) / 2
    console.log(`    y${String(bd.y0).padStart(3)}..${String(bd.y1).padEnd(3)} x${bd.x0}..${bd.x1} w=${bd.x1 - bd.x0 + 1}  axis=${fmt(cx)}  vs pane 1192 centre 596 => ${fmt(cx - 596)}px`)
  }
  // The pill's own straight-side row (widest), the controls strip, the footer
  let widest = bands[0]
  for (const bd of bands) if (bd.x1 - bd.x0 > widest.x1 - widest.x0) widest = bd
  const axes = bands.map(bd => (bd.x0 + bd.x1 + 1) / 2)
  console.log(`    axes: ${axes.map(v => fmt(v)).join(' , ')}   spread=${fmt(Math.max(...axes) - Math.min(...axes))}px`)
}
