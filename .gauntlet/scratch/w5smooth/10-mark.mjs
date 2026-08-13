// (b) THE MARK.
// 1) Byte-identity control vs wave 4 at all three sites.
// 2) OKLCH L / C / H at the TOP and BOTTOM interior rows of each mark, in the
//    APP and in the IDENTITY REFERENCE, with deltas.
//
// INSTRUMENT NOTE: the reference's mark is located WITHOUT a mint hue filter.
// Prior probes masked the reference on hue 140..190, which presupposes the very
// thing the leg asked to be checked ("is the reference even at the same hue?").
// Here the reference is segmented on CHROMA ALONE and its hue is then read off.
import { decode, oklch, hsl, W, BAR, fmt } from './lib.mjs'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

const SITES = [
  ['titlebar.png', '.logo-mark 22px', 14, 35, 13, 34],
  ['welcome.png', '.welcome-mark 44px', 513, 556, 242, 285],
  ['chat.png', '.avatar 28px (upper)', 211, 238, 111, 138],
  ['chat.png', '.avatar 28px (lower)', 211, 238, 660, 687],
]

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

// mean sRGB of a mask row, then convert once (mean-then-convert; converting
// per-pixel then averaging hue would wrap badly near 0/360)
function rowMean(d, mask, y) {
  let r = 0, g = 0, b = 0, n = 0
  for (let x = 0; x < d.w; x++) { const i = y * d.w + x; if (!mask[i]) continue; const o = i * 4; r += d.data[o]; g += d.data[o + 1]; b += d.data[o + 2]; n++ }
  return n ? { r: r / n, g: g / n, b: b / n, n } : null
}

function profile(d, mask) {
  const ys = []
  for (let y = 0; y < d.h; y++) { let n = 0; for (let x = 0; x < d.w; x++) if (mask[y * d.w + x]) n++; if (n) ys.push(y) }
  if (!ys.length) return null
  const top = rowMean(d, mask, ys[0]), bot = rowMean(d, mask, ys[ys.length - 1])
  const oT = oklch(top.r, top.g, top.b), oB = oklch(bot.r, bot.g, bot.b)
  // per-channel stddev over whole eroded interior, for the wave-4 control
  const acc = [[], [], []]
  for (let y = 0; y < d.h; y++) for (let x = 0; x < d.w; x++) { const i = y * d.w + x; if (!mask[i]) continue; const o = i * 4; acc[0].push(d.data[o]); acc[1].push(d.data[o + 1]); acc[2].push(d.data[o + 2]) }
  const sd = acc.map(v => { const m = v.reduce((a, b) => a + b, 0) / v.length; return Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / v.length) })
  return { yTop: ys[0], yBot: ys[ys.length - 1], rows: ys.length, top, bot, oT, oB, sd, n: acc[0].length }
}

console.log('=== 1. MARK BYTE-IDENTITY CONTROL, wave 4 -> wave 5 ===')
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex').slice(0, 12)
for (const f of ['titlebar.png', 'welcome.png', 'chat.png', 'welcome-min-window.png', 'window-welcome.png']) {
  console.log(`  ${f.padEnd(24)} w4=${sha(`${W(4)}/${f}`)} w5=${sha(`${W(5)}/${f}`)}  ${sha(`${W(4)}/${f}`) === sha(`${W(5)}/${f}`) ? 'BYTE-IDENTICAL' : '*** CHANGED ***'}`)
}
// explicit per-site interior compare anyway
for (const [f, label, x0, x1, y0, y1] of SITES) {
  const a = decode(`${W(4)}/${f}`), b = decode(`${W(5)}/${f}`)
  let diff = 0
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const o = (y * a.w + x) * 4; for (let c = 0; c < 4; c++) if (a.data[o + c] !== b.data[o + c]) { diff++; break } }
  console.log(`  site ${label.padEnd(24)} box pixels differing: ${diff}`)
}

console.log('\n=== 2. APP MARKS: OKLCH at top and bottom interior rows (erode-2) ===')
const appHues = []
for (const [f, label, x0, x1, y0, y1] of SITES) {
  const d = decode(`${W(5)}/${f}`)
  const m = new Uint8Array(d.w * d.h)
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const o = (y * d.w + x) * 4, r = d.data[o], g = d.data[o + 1], b = d.data[o + 2]
    if (Math.max(r, g, b) - Math.min(r, g, b) > 20) m[y * d.w + x] = 1
  }
  const e = erode(m, d.w, d.h, 2)
  const p = profile(d, e)
  const box = `${x1 - x0 + 1}x${y1 - y0 + 1}`
  console.log(`\n  ${label}  (${box}, ${f})  eroded px=${p.n}, interior rows=${p.rows} (y${p.yTop}..${p.yBot})`)
  console.log(`    TOP    rgb(${fmt(p.top.r, 1)}, ${fmt(p.top.g, 1)}, ${fmt(p.top.b, 1)})  L=${fmt(p.oT.L, 4)}  C=${fmt(p.oT.C, 4)}  H=${fmt(p.oT.H, 2)}deg  (n=${p.top.n})`)
  console.log(`    BOTTOM rgb(${fmt(p.bot.r, 1)}, ${fmt(p.bot.g, 1)}, ${fmt(p.bot.b, 1)})  L=${fmt(p.oB.L, 4)}  C=${fmt(p.oB.C, 4)}  H=${fmt(p.oB.H, 2)}deg  (n=${p.bot.n})`)
  console.log(`    DELTA  dL=${fmt(p.oB.L - p.oT.L, 4)}   dC=${fmt(p.oB.C - p.oT.C, 4)}   dH=${fmt(p.oB.H - p.oT.H, 2)}deg`)
  console.log(`    interior sdRGB=[${p.sd.map(v => fmt(v)).join(', ')}]`)
  appHues.push({ label, H: (p.oT.H + p.oB.H) / 2 })
}

console.log('\n=== 3. IDENTITY REFERENCE — segmented on CHROMA ONLY, no hue filter ===')
const rd = decode(`${BAR}/frost-mono-reference.png`)
console.log(`  reference image ${rd.w}x${rd.h}`)
{
  const w = rd.w, h = rd.h
  const m = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) { const o = i * 4, r = rd.data[o], g = rd.data[o + 1], b = rd.data[o + 2]; if (Math.max(r, g, b) - Math.min(r, g, b) > 20) m[i] = 1 }
  let tot = 0; for (let i = 0; i < m.length; i++) tot += m[i]
  console.log(`  chromatic pixels (maxmin>20): ${tot} (${fmt(100 * tot / (w * h), 2)}% of image)`)
  // hue histogram over ALL chromatic pixels, 10deg bins
  const bins = new Array(36).fill(0)
  for (let i = 0; i < w * h; i++) { if (!m[i]) continue; const o = i * 4; const H = hsl(rd.data[o], rd.data[o + 1], rd.data[o + 2]).h; bins[Math.floor(H / 10) % 36]++ }
  console.log('  hue histogram (10deg bins, count>0):')
  bins.forEach((n, i) => { if (n > tot * 0.005) console.log(`    ${String(i * 10).padStart(3)}-${String(i * 10 + 9).padStart(3)}deg : ${n} (${fmt(100 * n / tot, 1)}%)`) })

  // connected components
  const seen = new Uint8Array(w * h), comps = []
  for (let s = 0; s < w * h; s++) {
    if (seen[s] || !m[s]) continue
    const st = [s]; seen[s] = 1; let n = 0, x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1
    while (st.length) {
      const i = st.pop(); const x = i % w, y = (i - x) / w; n++
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue; const j = yy * w + xx; if (seen[j] || !m[j]) continue; seen[j] = 1; st.push(j) }
    }
    if (n >= 200) comps.push({ n, x0, x1, y0, y1 })
  }
  comps.sort((p, q) => q.n - p.n)
  console.log(`\n  chromatic components >=200px: ${comps.length}`)
  for (const c of comps.slice(0, 8)) {
    const bw = c.x1 - c.x0 + 1, bh = c.y1 - c.y0 + 1
    const sub = new Uint8Array(w * h)
    for (let y = c.y0; y <= c.y1; y++) for (let x = c.x0; x <= c.x1; x++) if (m[y * w + x]) sub[y * w + x] = 1
    const e = erode(sub, w, h, 2)
    let en = 0; for (let i = 0; i < e.length; i++) en += e[i]
    if (!en) { console.log(`    ${bw}x${bh} at x${c.x0} y${c.y0} px=${c.n} — too thin to erode`); continue }
    const p = profile(rd, e)
    console.log(`\n    COMPONENT ${bw}x${bh} at x${c.x0}..${c.x1} y${c.y0}..${c.y1}  px=${c.n} eroded=${en} fill=${fmt(100 * c.n / (bw * bh), 0)}%`)
    console.log(`      TOP    rgb(${fmt(p.top.r, 1)}, ${fmt(p.top.g, 1)}, ${fmt(p.top.b, 1)})  L=${fmt(p.oT.L, 4)} C=${fmt(p.oT.C, 4)} H=${fmt(p.oT.H, 2)}deg`)
    console.log(`      BOTTOM rgb(${fmt(p.bot.r, 1)}, ${fmt(p.bot.g, 1)}, ${fmt(p.bot.b, 1)})  L=${fmt(p.oB.L, 4)} C=${fmt(p.oB.C, 4)} H=${fmt(p.oB.H, 2)}deg`)
    console.log(`      DELTA  dL=${fmt(p.oB.L - p.oT.L, 4)}  dC=${fmt(p.oB.C - p.oT.C, 4)}  dH=${fmt(p.oB.H - p.oT.H, 2)}deg   sdRGB=[${p.sd.map(v => fmt(v)).join(', ')}]`)
  }
}
console.log('\n=== APP MARK HUES (mid of top/bottom) ===')
for (const a of appHues) console.log(`  ${a.label.padEnd(26)} H=${fmt(a.H, 2)}deg`)
