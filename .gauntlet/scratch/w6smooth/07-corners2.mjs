// (d) corrected. Two fixes, both to my own instrument:
//   * the command dock rows are OUTLINED (1px rgb(25,30,32)), not filled, so a
//     mid-box probe column never leaves the dock ground and 06-corners found no
//     boxes at all. Detect boxes by their LEFT EDGE band instead.
//   * the stripe measure took "full width" as the max antialiased mint count in a
//     14px window, which is not the stripe's straight run. Take the leftmost mint
//     column per row; the straight run is the rows at the minimum.
import { decode } from './png.mjs'

const f1 = (n) => n.toFixed(1)
const G_DOCK = [11, 15, 17]
const dist = (c, g) => Math.abs(c[0] - g[0]) + Math.abs(c[1] - g[1]) + Math.abs(c[2] - g[2])

console.log('=== BOX-EDGE STRAIGHT RUN ===')
console.log('(rows whose leftmost painted column equals the box minimum)\n')

for (const wv of [5, 6]) {
  console.log(`--- wave ${wv} ---`)

  // 74px rail row (filled: --mint-wash ground)
  {
    const I = decode(`.gauntlet/waves/core-after-docks/${wv}/sidebar.png`)
    const g = [11, 15, 17]
    const on = (x, y) => dist(I.at(x, y), g) > 3
    let bands = [], cur = null
    for (let y = 120; y < 480; y++) {
      if (on(100, y)) { if (!cur) cur = { y0: y }; cur.y1 = y }
      else if (cur) { bands.push(cur); cur = null }
    }
    if (cur) bands.push(cur)
    for (const b of bands.filter((b) => b.y1 - b.y0 + 1 > 30)) {
      const mins = []
      for (let y = b.y0; y <= b.y1; y++) { let lx = -1; for (let x = 0; x < 120; x++) if (on(x, y)) { lx = x; break } mins.push(lx) }
      const m = Math.min(...mins.filter((v) => v >= 0))
      const run = mins.filter((v) => v === m).length
      const h = b.y1 - b.y0 + 1
      console.log(`  RAIL 74px row   y${b.y0}..${b.y1}  h=${h}  minX=${m}  STRAIGHT RUN ${run}px = ${f1(100 * run / h)}%`)
    }
  }

  // command dock rows (outlined)
  {
    const I = decode(`.gauntlet/waves/core-after-docks/${wv}/commands-dock.png`)
    const on = (x, y) => dist(I.at(x, y), G_DOCK) > 3
    const edgeOn = (y) => { for (let x = 0; x <= 30; x++) if (on(x, y)) return x; return -1 }
    let bands = [], cur = null
    for (let y = 44; y < 851; y++) {
      const e = edgeOn(y)
      if (e >= 0) { if (!cur) cur = { y0: y }; cur.y1 = y }
      else if (cur) { bands.push(cur); cur = null }
    }
    if (cur) bands.push(cur)
    const agg = new Map()
    for (const b of bands.filter((b) => b.y1 - b.y0 + 1 > 30)) {
      const mins = []
      for (let y = b.y0; y <= b.y1; y++) mins.push(edgeOn(y))
      const m = Math.min(...mins.filter((v) => v >= 0))
      const run = mins.filter((v) => v === m).length
      const h = b.y1 - b.y0 + 1
      const k = h >= 60 ? 65 : 49
      if (!agg.has(k)) agg.set(k, [])
      agg.get(k).push({ y0: b.y0, h, m, run })
    }
    for (const [k, list] of [...agg.entries()].sort((a, b) => b[0] - a[0])) {
      for (const r of list) console.log(`  CMD ${k}px row    y${r.y0}..${r.y0 + r.h - 1}  h=${r.h}  minX=${r.m}  STRAIGHT RUN ${r.run}px = ${f1(100 * r.run / r.h)}%`)
      const runs = list.map((r) => r.run), hs = list.map((r) => r.h)
      const mean = runs.reduce((a, b) => a + b, 0) / runs.length
      const mh = hs.reduce((a, b) => a + b, 0) / hs.length
      console.log(`  CMD ${k}px MEAN  run ${f1(mean)}px = ${f1(100 * mean / mh)}% of a ${f1(mh)}px edge   (n=${list.length})`)
    }
  }
  console.log('')
}

console.log('=== SELECTION STRIPE (inset 2px mint, clipped to the same rounded rect) ===')
for (const wv of [5, 6]) {
  const I = decode(`.gauntlet/waves/core-after-docks/${wv}/sidebar.png`)
  const isMint = (x, y) => { const [r, g, b] = I.at(x, y); return g > r + 25 && g > 90 && b > r }
  const mins = [], ys = []
  for (let y = 120; y < 480; y++) {
    let lx = -1, n = 0
    for (let x = 0; x < 16; x++) if (isMint(x, y)) { if (lx < 0) lx = x; n++ }
    if (lx >= 0) { mins.push(lx); ys.push({ y, lx, n }) }
  }
  const m = Math.min(...mins)
  const run = mins.filter((v) => v === m).length
  const wmax = Math.max(...ys.map((v) => v.n))
  const wrun = ys.filter((v) => v.n === wmax).length
  console.log(`  wave ${wv}: mint rows y${ys[0].y}..${ys[ys.length - 1].y} (${ys.length}px), leftmost column x${m}`)
  console.log(`            STRAIGHT RUN (rows at x${m}) ${run}px = ${f1(100 * run / 74)}% of the 74px row`)
  console.log(`            widest ${wmax}px, rows at widest ${wrun}px = ${f1(100 * wrun / 74)}%`)
}
