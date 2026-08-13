import { decode, oklch, hsl, W, BAR, fmt } from './lib.mjs'

const ALL = ['welcome', 'welcome-min-window', 'titlebar', 'sidebar', 'chat', 'input-bar', 'agents-dock', 'appearance-dock', 'commands-dock']
const CORE = ['welcome', 'titlebar', 'sidebar', 'chat', 'input-bar']
const isMint = (r, g, b) => { const h = hsl(r, g, b).h; return Math.max(r, g, b) - Math.min(r, g, b) > 20 && h >= 140 && h <= 190 }

console.log('=== (c) IDENTITY FLOOR ===')
console.log('\n-- hue histogram, chroma>20, 10deg bins, all nine surfaces (HSL hue) --')
for (const wv of [4, 5]) {
  const bins = new Map()
  for (const s of ALL) {
    const d = decode(`${W(wv)}/${s}.png`)
    for (let i = 0; i < d.w * d.h; i++) { const o = i * 4, r = d.data[o], g = d.data[o + 1], b = d.data[o + 2]; if (Math.max(r, g, b) - Math.min(r, g, b) > 20) { const k = Math.round(hsl(r, g, b).h / 10) * 10; bins.set(k, (bins.get(k) || 0) + 1) } }
  }
  const kept = [...bins.entries()].filter(([, v]) => v > 30).sort((p, q) => p[0] - q[0])
  console.log(`  wave ${wv}: ${kept.map(([k, v]) => `~${k}deg:${v}`).join('  ')}`)
}

console.log('\n-- exact hue spread inside mark interiors (is it ONE hue?) --')
const SITES = [['titlebar.png', 'logo-mark', 14, 35, 13, 34], ['welcome.png', 'welcome-mark', 513, 556, 242, 285], ['chat.png', 'avatar', 211, 238, 111, 138]]
for (const [f, label, x0, x1, y0, y1] of SITES) {
  for (const wv of [4, 5]) {
    const d = decode(`${W(wv)}/${f}`); const hs = new Set(); let okmin = 999, okmax = -999
    for (let y = y0 + 3; y <= y1 - 3; y++) for (let x = x0 + 3; x <= x1 - 3; x++) {
      const o = (y * d.w + x) * 4, r = d.data[o], g = d.data[o + 1], b = d.data[o + 2]
      if (!isMint(r, g, b)) continue
      hs.add(+hsl(r, g, b).h.toFixed(2))
      const H = oklch(r, g, b).H; if (H < okmin) okmin = H; if (H > okmax) okmax = H
    }
    const vals = [...hs].sort((p, q) => p - q)
    console.log(`  ${label.padEnd(13)} wave ${wv}: distinct HSL hues=${vals.length} min=${vals[0]} max=${vals[vals.length - 1]} spread=${fmt(vals[vals.length - 1] - vals[0])}deg | OKLCH H ${fmt(okmin)}..${fmt(okmax)} spread=${fmt(okmax - okmin)}deg`)
  }
}

console.log('\n-- per-surface mint share, wave 4 vs wave 5 --')
const tot = { 4: 0, 5: 0 }, worst = { 4: { s: '', p: 0 }, 5: { s: '', p: 0 } }
for (const s of ALL) {
  const row = []
  for (const wv of [4, 5]) {
    const d = decode(`${W(wv)}/${s}.png`); let n = 0
    for (let i = 0; i < d.w * d.h; i++) { const o = i * 4; if (isMint(d.data[o], d.data[o + 1], d.data[o + 2])) n++ }
    const p = 100 * n / (d.w * d.h); row.push([n, p]); tot[wv] += n
    if (p > worst[wv].p) worst[wv] = { s, p }
  }
  console.log(`  ${s.padEnd(20)} w4=${String(row[0][0]).padStart(6)} (${fmt(row[0][1], 3)}%)   w5=${String(row[1][0]).padStart(6)} (${fmt(row[1][1], 3)}%)   delta=${row[1][0] - row[0][0]}`)
}
console.log(`  TOTAL(9)             w4=${tot[4]}  w5=${tot[5]}  delta=${tot[5] - tot[4]}`)
console.log(`  WORST SURFACE        w4=${fmt(worst[4].p, 3)}% (${worst[4].s})   w5=${fmt(worst[5].p, 3)}% (${worst[5].s})   ceiling=10%`)

console.log('\n-- mint SITES (dilate 3, >=8 mint px), core five --')
for (const wv of [4, 5]) {
  let siteTotal = 0; const lines = []
  for (const s of CORE) {
    const d = decode(`${W(wv)}/${s}.png`), Wd = d.w, H = d.h
    const m = new Uint8Array(Wd * H)
    for (let i = 0; i < Wd * H; i++) { const o = i * 4; if (isMint(d.data[o], d.data[o + 1], d.data[o + 2])) m[i] = 1 }
    const dl = new Uint8Array(Wd * H)
    for (let y = 0; y < H; y++) for (let x = 0; x < Wd; x++) { if (!m[y * Wd + x]) continue; for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const yy = y + dy, xx = x + dx; if (yy >= 0 && yy < H && xx >= 0 && xx < Wd) dl[yy * Wd + xx] = 1 } }
    const seen = new Uint8Array(Wd * H); let cnt = 0
    for (let s0 = 0; s0 < Wd * H; s0++) {
      if (seen[s0] || !dl[s0]) continue
      const st = [s0]; seen[s0] = 1; let mn = 0
      while (st.length) { const i = st.pop(); const x = i % Wd, y = (i - x) / Wd; if (m[i]) mn++; for (const j of [x > 0 ? i - 1 : -1, x < Wd - 1 ? i + 1 : -1, y > 0 ? i - Wd : -1, y < H - 1 ? i + Wd : -1]) if (j >= 0 && !seen[j] && dl[j]) { seen[j] = 1; st.push(j) } }
      if (mn >= 8) cnt++
    }
    siteTotal += cnt; lines.push(`${s}:${cnt}`)
  }
  console.log(`  wave ${wv}: TOTAL SITES=${siteTotal}   (${lines.join('  ')})`)
}

console.log('\n\n=== (d) RAIL COMPRESSION ===')
for (const wv of [4, 5]) {
  const d = decode(`${W(wv)}/sidebar.png`)
  console.log(`\n-- wave ${wv}: sidebar.png ${d.w}x${d.h} --`)
  // row-shell fill bands
  const fillRows = []
  for (let y = 0; y < d.h; y++) {
    let n = 0
    for (let x = 0; x < d.w; x++) { const o = (y * d.w + x) * 4; const k = `${d.data[o]},${d.data[o + 1]},${d.data[o + 2]},${d.data[o + 3]}`; if (k === '28,39,39,220' || k === '29,34,35,219') n++ }
    fillRows.push(n)
  }
  const bands = []; let b = null
  for (let y = 0; y < d.h; y++) { if (fillRows[y] > 40) { if (!b) b = { y0: y, y1: y }; else b.y1 = y } else { if (b) { bands.push(b); b = null } } }
  if (b) bands.push(b)
  console.log(`   row-shell bands: ${bands.slice(0, 8).map(z => `y${z.y0}..${z.y1} h=${z.y1 - z.y0 + 1}`).join('  ')}`)
  if (bands.length) console.log(`   >>> FIRST SESSION ROW TOP EDGE = y${bands[0].y0}  (${fmt(100 * bands[0].y0 / d.h, 1)}% of the ${d.h}px rail)`)
  // hairlines
  const prof = []
  for (let y = 0; y < d.h; y++) { let r = 0; for (let x = 0; x < d.w; x++) r += d.data[(y * d.w + x) * 4]; prof.push(r / d.w) }
  const hair = []
  for (let y = 1; y < d.h - 1; y++) if (prof[y] - prof[y - 1] > 1.2 && prof[y] - prof[y + 1] > 1.2) hair.push(y)
  console.log(`   hairlines at y: ${hair.slice(0, 10).join(', ')}  (total ${hair.length})`)
  // selection stripe run
  for (const X of [6, 7, 8]) {
    const runs = []; let cur = null
    for (let y = 0; y < d.h; y++) { const o = (y * d.w + X) * 4; if (isMint(d.data[o], d.data[o + 1], d.data[o + 2])) { if (!cur) cur = { y0: y, y1: y }; else cur.y1 = y } else { if (cur) { runs.push(cur); cur = null } } }
    if (cur) runs.push(cur)
    console.log(`   selection stripe x=${X}: ${runs.map(r => `y${r.y0}..${r.y1} run=${r.y1 - r.y0 + 1}`).join('  ') || 'none'}`)
  }
  let mint = 0; for (let i = 0; i < d.w * d.h; i++) { const o = i * 4; if (isMint(d.data[o], d.data[o + 1], d.data[o + 2])) mint++ }
  console.log(`   total sidebar mint px = ${mint}`)
}

console.log('\n\n=== TRANSCRIPT SCROLL STATE (control) ===')
for (const wv of [4, 5]) {
  const d = decode(`${W(wv)}/chat.png`)
  let t = 1e9, bt = -1, n = 0
  const BG = [3, 6, 6, 163]
  for (let y = 0; y < d.h; y++) for (let x = 1185; x <= 1188; x++) { const o = (y * d.w + x) * 4; let dd = 0; for (let c = 0; c < 4; c++) dd += Math.abs(d.data[o + c] - BG[c]); if (dd > 0) { if (y < t) t = y; if (y > bt) bt = y; n++ } }
  const thumbH = bt - t + 1, track = d.h, ratio = thumbH / track, scrollH = track / ratio, overflow = scrollH - track, scrollTop = t / track * scrollH
  console.log(`  wave ${wv}: thumb y${t}..${bt} h=${thumbH}px  thumb/track=${fmt(ratio, 4)}  scrollHeight~${fmt(scrollH, 1)}  overflow~${fmt(overflow, 1)}`)
  console.log(`          content ABOVE viewport ~ ${fmt(scrollTop, 1)}px ; BELOW ~ ${fmt(overflow - scrollTop, 1)}px`)
  // first ink row in the transcript column
  let firstInk = -1
  for (let y = 0; y < d.h && firstInk < 0; y++) for (let x = 200; x <= 990; x++) { const o = (y * d.w + x) * 4; let dd = 0; for (let c = 0; c < 4; c++) dd += Math.abs(d.data[o + c] - BG[c]); if (dd > 0) { firstInk = y; break } }
  console.log(`          first ink row in transcript column = y${firstInk}  (rows y0..y${firstInk - 1} empty)`)
}

console.log('\n\n=== OKLab DECOMPOSITION: is the reference depth cue radial (chroma) or tangential (hue)? ===')
const pol = (C, H) => [C * Math.cos(H * Math.PI / 180), C * Math.sin(H * Math.PI / 180)]
const cases = [
  ['app .logo-mark 22px', 0.0693, 180.47, 0.0648, 180.52],
  ['app .welcome-mark 44px', 0.0702, 180.11, 0.0642, 179.88],
  ['app .avatar 28px', 0.0694, 179.91, 0.0652, 179.83],
  ['ref mark 40px (a)', 0.0765, 192.71, 0.0833, 205.25],
  ['ref mark 40px (b)', 0.0760, 193.22, 0.0831, 205.29],
  ['ref mark 29px', 0.0765, 193.43, 0.0830, 204.70],
]
for (const [label, C1, H1, C2, H2] of cases) {
  const [a1, b1] = pol(C1, H1), [a2, b2] = pol(C2, H2)
  const total = Math.hypot(a2 - a1, b2 - b1)
  const radial = Math.abs(C2 - C1)
  const tangential = Math.sqrt(Math.max(0, total * total - radial * radial))
  console.log(`  ${label.padEnd(24)} |shift|=${fmt(total, 5)}  radial(chroma)=${fmt(radial, 5)}  tangential(hue)=${fmt(tangential, 5)}  ratio tang/rad=${radial > 1e-6 ? fmt(tangential / radial, 2) : 'inf'}`)
}
