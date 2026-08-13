// (a) THE THREE INTERVALS AS PAINTED. Column clearance (fully-clear columns
// between painted extents) AND per-row mean clearance, because a capped pill
// recedes from the midline and the two numbers disagree there by design.
import { decode } from './png.mjs'
const f2 = (n) => n.toFixed(2)
const modal = (I, x0, x1, y0, y1) => {
  const m = new Map()
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const k = I.at(x, y).join(','); m.set(k, (m.get(k) || 0) + 1) }
  return [...m.entries()].sort((a, b) => b[1] - a[1])[0][0].split(',').map(Number)
}
const dd = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2])

for (const wv of [6, 7, 8]) {
  const I = decode(`.gauntlet/waves/core-after-docks/${wv}/titlebar.png`)
  const G = modal(I, 400, 700, 4, 40)
  const on = (x, y) => dd(I.at(x, y), G) > 2
  const occ = []
  for (let x = 0; x < I.w; x++) { let n = 0; for (let y = 1; y <= 45; y++) if (on(x, y)) n++; occ.push(n) }
  const runs = []; let cur = null
  for (let x = 0; x < I.w; x++) { if (occ[x] > 0) { if (!cur) cur = { x0: x }; cur.x1 = x } else if (cur) { runs.push(cur); cur = null } }
  if (cur) runs.push(cur)
  const merged = []
  for (const r of runs) { const last = merged[merged.length - 1]; if (last && r.x0 - last.x1 - 1 <= 2) last.x1 = r.x1; else merged.push({ ...r }) }
  // left group = consecutive items separated by <= 20px from the first
  let i = 0; const left = [merged[0]]
  while (i + 1 < merged.length && merged[i + 1].x0 - merged[i].x1 - 1 <= 20) { left.push(merged[i + 1]); i++ }
  // fuse the app name's letterform runs: anything within 8px that is not a pill.
  // Identify pills by height (>=20 rows tall over their whole span).
  const boxes = []
  for (const r of left) {
    let y0 = 1e9, y1 = -1
    for (let x = r.x0; x <= r.x1; x++) for (let y = 1; y <= 45; y++) if (on(x, y)) { if (y < y0) y0 = y; if (y > y1) y1 = y }
    boxes.push({ ...r, y0, y1, h: y1 - y0 + 1 })
  }
  // regroup: mark (x<42), name (glyph runs, h<=16), pills (h>=18)
  const items = []
  for (const b of boxes) {
    const last = items[items.length - 1]
    const kind = b.x1 < 42 ? 'mark' : b.h >= 18 ? 'pill' : 'name'
    if (last && last.kind === kind && kind === 'name' && b.x0 - last.x1 - 1 <= 8) { last.x1 = b.x1; last.y0 = Math.min(last.y0, b.y0); last.y1 = Math.max(last.y1, b.y1) }
    else items.push({ ...b, kind })
  }
  console.log(`\n===== WAVE ${wv} titlebar.png  ground rgb(${G}) =====`)
  for (const it of items) console.log(`   ${it.kind.padEnd(5)} x${it.x0}..${it.x1} (w=${it.x1 - it.x0 + 1})  y${it.y0}..${it.y1} (h=${it.h})`)
  const names = ['mark->name', 'name->pill1', 'pill1->pill2']
  for (let k = 0; k + 1 < items.length && k < 3; k++) {
    const A = items[k], B = items[k + 1]
    const colClear = B.x0 - A.x1 - 1
    // per-row clearance over the rows where BOTH are painted
    const rows = []
    for (let y = 1; y <= 45; y++) {
      let ax = -1; for (let x = A.x1; x >= A.x0; x--) if (on(x, y)) { ax = x; break }
      let bx = -1; for (let x = B.x0; x <= B.x1; x++) if (on(x, y)) { bx = x; break }
      if (ax >= 0 && bx >= 0) rows.push(bx - ax - 1)
    }
    const mean = rows.reduce((s, v) => s + v, 0) / rows.length
    console.log(`   ${names[k].padEnd(12)} column clearance ${String(colClear).padStart(3)}px   per-row mean ${f2(mean)}px over ${rows.length} rows   min ${Math.min(...rows)}  max ${Math.max(...rows)}`)
  }
  const gEnd = items[items.length - 1].x1
  console.log(`   GROUP painted x${items[0].x0}..x${gEnd}   right edge x${gEnd}   vs rail divider x247: ${gEnd - 247 >= 0 ? '+' : ''}${gEnd - 247}px`)
  const mk = items[0]
  console.log(`   MARK left inset ${mk.x0}px   size ${mk.x1 - mk.x0 + 1}x${mk.h}`)
}
