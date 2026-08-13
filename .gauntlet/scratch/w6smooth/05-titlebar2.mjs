// (c) corrected. Two bugs in 04-titlebar.mjs, both mine, both fixed here:
//   * the strip's `border-bottom: 1px solid var(--border)` at y47 spans the whole
//     width, so scanning y0..47 made every column "inked" and blew up the mark's
//     bbox to the full strip. Scan y1..y45.
//   * a 6px merge threshold fused the mark into the app name once the gap went
//     to 4px. Merge at <=2px, then group by an explicit gap rule.
import { decode } from './png.mjs'

const f2 = (n) => n.toFixed(2)
const modal = (I, x0, x1, y0, y1) => {
  const m = new Map()
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const k = I.at(x, y).join(',')
    m.set(k, (m.get(k) || 0) + 1)
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1])[0][0].split(',').map(Number)
}
const dd = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2])

for (const wv of [5, 6]) {
  const I = decode(`.gauntlet/waves/core-after-docks/${wv}/titlebar.png`)
  const G = modal(I, 400, 700, 4, 40)
  console.log(`\n===== WAVE ${wv} titlebar.png ${I.w}x${I.h}  ground rgb(${G}) =====`)
  for (const thr of [2, 8]) {
    const on = (x, y) => dd(I.at(x, y), G) > thr
    const occ = []
    for (let x = 0; x < I.w; x++) { let n = 0; for (let y = 1; y <= 45; y++) if (on(x, y)) n++; occ.push(n) }
    const runs = []
    let cur = null
    for (let x = 0; x < I.w; x++) {
      if (occ[x] > 0) { if (!cur) cur = { x0: x }; cur.x1 = x }
      else if (cur) { runs.push(cur); cur = null }
    }
    if (cur) runs.push(cur)
    const merged = []
    for (const r of runs) {
      const last = merged[merged.length - 1]
      if (last && r.x0 - last.x1 - 1 <= 2) last.x1 = r.x1
      else merged.push({ ...r })
    }
    // Left group: consecutive items separated by <= 20px starting from the first.
    let i = 0
    const left = [merged[0]]
    while (i + 1 < merged.length && merged[i + 1].x0 - merged[i].x1 - 1 <= 20) { left.push(merged[i + 1]); i++ }
    const gEnd = left[left.length - 1].x1, gStart = left[0].x0
    console.log(`  [thr ${thr}] items: ${merged.map((r) => `x${r.x0}..${r.x1}`).join(' | ')}`)
    console.log(`  [thr ${thr}] LEFT GROUP x${gStart}..x${gEnd} extent ${gEnd - gStart + 1}px   OVERRUN vs divider x247: ${gEnd - 247 >= 0 ? '+' : ''}${gEnd - 247}px`)
  }

  // MARK: the first item only, scanned in a window that cannot reach the name.
  {
    const on = (x, y) => dd(I.at(x, y), G) > 2
    let mx0 = 1e9, mx1 = -1, my0 = 1e9, my1 = -1
    for (let x = 0; x < 42; x++) for (let y = 1; y <= 45; y++) if (on(x, y)) { if (x < mx0) mx0 = x; if (x > mx1) mx1 = x; if (y < my0) my0 = y; if (y > my1) my1 = y }
    console.log(`  MARK x${mx0}..x${mx1} (w=${mx1 - mx0 + 1})  y${my0}..y${my1} (h=${my1 - my0 + 1})  left inset ${mx0}px  vertical centre ${f2((my0 + my1) / 2)} of strip centre ${f2((0 + 47) / 2)}`)
  }

  // SESSION TITLE: the run nearest the window centre, isolated by >40px of clear
  // on both sides so no window control or dock toggle can join it.
  {
    const on = (x, y) => dd(I.at(x, y), G) > 2
    const occ = []
    for (let x = 0; x < I.w; x++) { let n = 0; for (let y = 1; y <= 45; y++) if (on(x, y)) n++; occ.push(n) }
    const runs = []
    let cur = null
    for (let x = 0; x < I.w; x++) {
      if (occ[x] > 0) { if (!cur) cur = { x0: x }; cur.x1 = x }
      else if (cur) { runs.push(cur); cur = null }
    }
    if (cur) runs.push(cur)
    const merged = []
    for (const r of runs) {
      const last = merged[merged.length - 1]
      if (last && r.x0 - last.x1 - 1 <= 8) last.x1 = r.x1
      else merged.push({ ...r })
    }
    const iso = merged.filter((r, k) => {
      const p = merged[k - 1], n = merged[k + 1]
      return (!p || r.x0 - p.x1 - 1 > 40) && (!n || n.x0 - r.x1 - 1 > 40)
    })
    const t = iso.sort((a, b) => Math.abs((a.x0 + a.x1) / 2 - 719.5) - Math.abs((b.x0 + b.x1) / 2 - 719.5))[0]
    const mid = (t.x0 + t.x1 + 1) / 2   // edge convention: left edge t.x0, right edge t.x1+1
    console.log(`  SESSION TITLE ink x${t.x0}..x${t.x1} (w=${t.x1 - t.x0 + 1})  ink midpoint ${f2(mid)}`)
    console.log(`    window centre ${f2(I.w / 2)}   DISPLACEMENT ${f2(mid - I.w / 2)}px`)
  }
}
