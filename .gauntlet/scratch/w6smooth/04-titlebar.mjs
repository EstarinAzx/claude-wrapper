// (c) THE TITLEBAR GROUP AGAINST THE STRUCTURAL COLUMN, plus flank symmetry.
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
  const G = modal(I, 400, 700, 4, 43)
  const on = (x, y, thr = 4) => dd(I.at(x, y), G) > thr

  // --- 1. column occupancy across the whole strip, so groups fall out as runs ---
  const occ = []
  for (let x = 0; x < I.w; x++) { let n = 0; for (let y = 1; y <= 46; y++) if (on(x, y)) n++; occ.push(n) }
  const runs = []
  let cur = null
  for (let x = 0; x < I.w; x++) {
    if (occ[x] > 0) { if (!cur) cur = { x0: x }; cur.x1 = x }
    else if (cur) { runs.push(cur); cur = null }
  }
  if (cur) runs.push(cur)
  // Merge runs separated by <= 6px of clear so a letterform gap does not split a word.
  const merged = []
  for (const r of runs) {
    const last = merged[merged.length - 1]
    if (last && r.x0 - last.x1 - 1 <= 6) last.x1 = r.x1
    else merged.push({ ...r })
  }
  console.log(`\n===== WAVE ${wv} titlebar.png ${I.w}x${I.h}  ground rgb(${G}) =====`)
  console.log('  painted groups (>=6px clear between):')
  for (const r of merged) console.log(`    x${String(r.x0).padStart(4)}..x${String(r.x1).padEnd(4)}  w=${r.x1 - r.x0 + 1}`)

  // --- 2. the LEFT GROUP: everything left of the first gap wider than 20px ---
  let leftEnd = -1, leftStart = -1
  for (let i = 0; i < merged.length; i++) {
    if (leftStart < 0) leftStart = merged[i].x0
    const nxt = merged[i + 1]
    if (!nxt || nxt.x0 - merged[i].x1 - 1 > 20) { leftEnd = merged[i].x1; break }
  }
  console.log(`  LEFT GROUP painted x${leftStart}..x${leftEnd}  extent ${leftEnd - leftStart + 1}px`)
  console.log(`  rail divider column x247   OVERRUN ${leftEnd - 247 >= 0 ? '+' : ''}${leftEnd - 247}px`)

  // --- 3. the MARK: its own box ---
  let mx0 = 1e9, mx1 = -1, my0 = 1e9, my1 = -1
  for (let x = 0; x < 60; x++) for (let y = 0; y < 48; y++) if (on(x, y)) { if (x < mx0) mx0 = x; if (x > mx1) mx1 = x; if (y < my0) my0 = y; if (y > my1) my1 = y }
  console.log(`  MARK box x${mx0}..x${mx1} (w=${mx1 - mx0 + 1})  y${my0}..y${my1} (h=${my1 - my0 + 1})   left inset ${mx0}px`)

  // --- 4. FLANK SYMMETRY: the session title's ink midpoint vs window centre ---
  // The centred slot is whatever sits between the left group and the right group.
  let rightStart = -1
  for (let i = merged.length - 1; i >= 0; i--) {
    const prv = merged[i - 1]
    if (!prv || merged[i].x0 - prv.x1 - 1 > 20) { rightStart = merged[i].x0; break }
  }
  const slot = merged.filter((r) => r.x0 > leftEnd + 20 && r.x1 < rightStart - 20)
  if (slot.length) {
    const L = slot[0].x0, R = slot[slot.length - 1].x1
    console.log(`  SESSION TITLE ink x${L}..x${R} (w=${R - L + 1})  midpoint ${f2((L + R) / 2)}`)
    console.log(`    window centre ${f2((0 + I.w - 1) / 2)}   displacement ${f2((L + R) / 2 - (I.w - 1) / 2)}px`)
  } else {
    console.log('  SESSION TITLE: no slot run found between the flanks')
  }
  console.log(`  RIGHT GROUP starts x${rightStart}, ends x${merged[merged.length - 1].x1}`)
}

// --- 5. the rail divider column, read off the composite frame ---
{
  const I = decode('.gauntlet/waves/core-after-docks/6/window-session.png')
  console.log('\n===== RAIL DIVIDER COLUMN (window-session.png, below the titlebar) =====')
  for (let x = 243; x <= 252; x++) {
    const c = I.at(x, 500)
    console.log(`  x${x}  rgb(${c})`)
  }
}
