// (d) THE ROW CORNER — STRAIGHT-RUN LENGTH, not pixel share.
// Find every box in a capture that paints a ground of its own, then for each:
//   height, left-edge straight run (rows whose leftmost painted column equals the
//   box's minimum), and that run as a percentage of the height.
import { decode } from './png.mjs'

const f1 = (n) => n.toFixed(1)
const modal = (I, x0, x1, y0, y1) => {
  const m = new Map()
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const k = I.at(x, y).join(',')
    m.set(k, (m.get(k) || 0) + 1)
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1])[0][0].split(',').map(Number)
}
const dd = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2])

const boxes = (I, ground, probeX, y0, y1, minH) => {
  const on = (x, y) => dd(I.at(x, y), ground) > 3
  const out = []
  let run = null
  for (let y = y0; y <= y1; y++) {
    if (on(probeX, y)) { if (!run) run = { y0: y }; run.y1 = y }
    else if (run) { if (run.y1 - run.y0 + 1 >= minH) out.push(run); run = null }
  }
  if (run && run.y1 - run.y0 + 1 >= minH) out.push(run)
  return out
}

const edgeRun = (I, ground, box, xLo, xHi) => {
  const on = (x, y) => dd(I.at(x, y), ground) > 3
  const mins = []
  for (let y = box.y0; y <= box.y1; y++) {
    let lx = -1
    for (let x = xLo; x <= xHi; x++) if (on(x, y)) { lx = x; break }
    mins.push(lx)
  }
  const valid = mins.filter((v) => v >= 0)
  const m = Math.min(...valid)
  const straight = mins.filter((v) => v === m).length
  return { m, straight, h: box.y1 - box.y0 + 1 }
}

for (const wv of [5, 6]) {
  console.log(`\n############ WAVE ${wv} ############`)

  // --- the 74px rail row ---
  {
    const I = decode(`.gauntlet/waves/core-after-docks/${wv}/sidebar.png`)
    const G = modal(I, 60, 190, 500, 780)
    const bs = boxes(I, G, 100, 120, 480, 30)
    for (const b of bs) {
      const r = edgeRun(I, G, b, 0, 120)
      console.log(`  RAIL row  y${b.y0}..${b.y1}  h=${r.h}  left edge x${r.m}  straight run ${r.straight}px = ${f1(100 * r.straight / r.h)}% of edge`)
    }
    if (!bs.length) console.log('  RAIL row: none found')
  }

  // --- the command dock rows ---
  {
    const I = decode(`.gauntlet/waves/core-after-docks/${wv}/commands-dock.png`)
    const G = modal(I, 60, 190, 700, 840)
    const bs = boxes(I, G, 124, 40, 851, 30)
    const byH = new Map()
    for (const b of bs) {
      const r = edgeRun(I, G, b, 0, 120)
      const k = r.h
      if (!byH.has(k)) byH.set(k, [])
      byH.get(k).push({ ...r, y0: b.y0 })
    }
    for (const [h, list] of [...byH.entries()].sort((a, b) => b[0] - a[0])) {
      const runs = list.map((r) => r.straight)
      const uniq = [...new Set(runs)]
      console.log(`  COMMAND rows h=${h}  n=${list.length}  left edge x${list[0].m}  straight run ${uniq.join('/')}px = ${uniq.map((u) => f1(100 * u / h) + '%').join('/')}  (rows at y${list.map((r) => r.y0).join(',')})`)
    }
  }
}

// --- the selection stripe: mint, inset shadow, clipped to the rounded rect ---
console.log('\n############ SELECTION STRIPE ############')
for (const wv of [5, 6]) {
  const I = decode(`.gauntlet/waves/core-after-docks/${wv}/sidebar.png`)
  const ys = []
  for (let y = 120; y < 480; y++) {
    let n = 0
    for (let x = 0; x < 14; x++) { const [r, g, b] = I.at(x, y); if (g > r + 25 && g > 90 && b > r) n++ }
    if (n > 0) ys.push({ y, n })
  }
  if (!ys.length) { console.log(`  wave ${wv}: no mint stripe`); continue }
  const full = Math.max(...ys.map((v) => v.n))
  const straight = ys.filter((v) => v.n === full).length
  const span = ys[ys.length - 1].y - ys[0].y + 1
  console.log(`  wave ${wv}: stripe y${ys[0].y}..${ys[ys.length - 1].y} (${span}px of a 74px row), full width ${full}px, straight run ${straight}px = ${f1(100 * straight / 74)}% of the row`)
}
