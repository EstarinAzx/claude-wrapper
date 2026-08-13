import { decode, oklch } from './png.mjs'

const ROOT = 'D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/10'
const near = (c, t, k = 6) => Math.abs(c[0] - t[0]) + Math.abs(c[1] - t[1]) + Math.abs(c[2] - t[2]) <= k
const eq = (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2]
const f2 = (n) => n.toFixed(2)
const f4 = (n) => n.toFixed(4)

const outlineOf = (I, target, minN = 20) => {
  const mask = new Uint8Array(I.w * I.h)
  for (let y = 0; y < I.h; y++) for (let x = 0; x < I.w; x++) {
    const c = I.at(x, y)
    if (c[0] === target[0] && c[1] === target[1] && c[2] === target[2]) mask[y * I.w + x] = 1
  }
  const seen = new Uint8Array(mask.length)
  const comps = []
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i] || seen[i]) continue
    const st = [i]
    seen[i] = 1
    let x0 = Infinity, x1 = -1, y0 = Infinity, y1 = -1, n = 0
    while (st.length) {
      const j = st.pop()
      const x = j % I.w
      const y = (j - x) / I.w
      n++
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y)
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy
        if (xx < 0 || yy < 0 || xx >= I.w || yy >= I.h) continue
        const k = yy * I.w + xx
        if (mask[k] && !seen[k]) { seen[k] = 1; st.push(k) }
      }
    }
    if (n >= minN) comps.push({ x0, x1, y0, y1, w: x1 - x0 + 1, h: y1 - y0 + 1, n })
  }
  return comps.sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0)
}

const longRows = (I, target, minW = 180) => {
  const rows = []
  for (let y = 0; y < I.h; y++) {
    let n = 0, a = 1e9, z = -1
    for (let x = 0; x < I.w; x++) {
      const c = I.at(x, y)
      if (c[0] === target[0] && c[1] === target[1] && c[2] === target[2]) {
        n++; if (x < a) a = x; if (x > z) z = x
      }
    }
    if (n >= minW) rows.push({ y, n, a, z })
  }
  return rows
}

const pairByHeight = (rows, minH, maxH) => {
  const used = new Set()
  const boxes = []
  for (let i = 0; i < rows.length; i++) {
    if (used.has(i)) continue
    for (let j = i + 1; j < rows.length; j++) {
      const h = rows[j].y - rows[i].y + 1
      if (h >= minH && h <= maxH && Math.abs(rows[j].a - rows[i].a) <= 2) {
        used.add(i); used.add(j)
        boxes.push({ y0: rows[i].y, y1: rows[j].y, x0: Math.min(rows[i].a, rows[j].a), x1: Math.max(rows[i].z, rows[j].z), h })
        break
      }
    }
  }
  return boxes
}

console.log('===== DOCK / RAIL SHELLS =====')
{
  const files = ['commands-dock.png', 'appearance-dock.png', 'agents-dock.png', 'sidebar.png']
  for (const file of files) {
    const I = decode(`${ROOT}/${file}`)
    const comps = outlineOf(I, [25, 30, 32], 10)
    console.log(`  ${file} rgb(25,30,32) comps>=10: ${comps.length}`)
    for (const c of comps.filter((c) => c.h >= 20 || c.w >= 150).slice(0, 10)) {
      console.log(`    x${c.x0}..${c.x1} y${c.y0}..${c.y1} ${c.w}x${c.h} n=${c.n}`)
    }
  }
}

console.log('\n===== COMMAND ROW BOXES =====')
{
  const I = decode(`${ROOT}/commands-dock.png`)
  const rows = longRows(I, [25, 30, 32], 180)
  const boxes = pairByHeight(rows, 40, 80)
  console.log(`  long=${rows.length} boxes=${boxes.length}`)
  const heights = []
  const ground = [11, 15, 17]
  for (let i = 0; i < boxes.length; i++) {
    const b = boxes[i]
    heights.push(b.h)
    let nx = 1e9
    for (let y = b.y0 + 6; y <= b.y0 + 22; y++) for (let x = 10; x <= 160; x++) {
      const c = I.at(x, y)
      if (near(c, ground, 10)) continue
      if (c[0] === 25 && c[1] === 30 && c[2] === 32) continue
      if (c[0] + c[1] + c[2] < 90) continue
      if (x < nx) nx = x
    }
    const gap = i + 1 < boxes.length ? boxes[i + 1].y0 - b.y1 - 1 : null
    console.log(`  row${i + 1} y${b.y0}..${b.y1} h=${b.h} namex=${nx} insetFrom16=${nx - 16} gap=${gap}`)
  }
  console.log(`  heights ${heights.join('/')}`)
}

console.log('\n===== APPEARANCE OPTION BOXES =====')
{
  const I = decode(`${ROOT}/appearance-dock.png`)
  const rows = longRows(I, [25, 30, 32], 180)
  const boxes = pairByHeight(rows, 24, 80)
  console.log(`  long=${rows.length} boxes=${boxes.length}`)
  const ground = [11, 15, 17]
  const wash = [28, 39, 39]
  for (let i = 0; i < boxes.length; i++) {
    const b = boxes[i]
    const midY = Math.round((b.y0 + b.y1) / 2)
    const interior = I.at(40, midY)
    let nx = 1e9
    for (let y = b.y0 + 3; y <= Math.min(b.y0 + 18, b.y1 - 2); y++) for (let x = 10; x <= 120; x++) {
      const c = I.at(x, y)
      if (near(c, ground, 8) || near(c, wash, 8) || (c[0] === 25 && c[1] === 30 && c[2] === 32)) continue
      if (c[0] + c[1] + c[2] < 80) continue
      if (x < nx) nx = x
    }
    const gap = i + 1 < boxes.length ? boxes[i + 1].y0 - b.y1 - 1 : null
    console.log(`  box${i + 1} y${b.y0}..${b.y1} h=${b.h} interior rgb(${interior}) namex=${nx} inset=${nx - 16} gap=${gap}`)
  }
}

console.log('\n===== SELECTED WASH + STRIPE =====')
{
  const A = decode(`${ROOT}/appearance-dock.png`)
  const S = decode(`${ROOT}/sidebar.png`)
  const wash = [28, 39, 39]
  let aN = 0, sN = 0
  for (let y = 70; y <= 110; y++) for (let x = 8; x <= 240; x++) if (eq(A.at(x, y), wash)) aN++
  for (let y = 202; y <= 275; y++) for (let x = 8; x <= 230; x++) if (eq(S.at(x, y), wash)) sN++
  const o = oklch(...wash)
  console.log(`  wash rgb(28,39,39) L=${f4(o.L)} appearance=${aN} sidebar=${sN}`)
  let stripe = 0, appStripe = 0
  for (let y = 202; y <= 275; y++) for (let x = 0; x <= 20; x++) {
    const c = S.at(x, y)
    const o2 = oklch(...c)
    if (o2.C >= 0.05 && o2.H >= 140 && o2.H <= 200) stripe++
  }
  for (let y = 70; y <= 110; y++) for (let x = 0; x <= 20; x++) {
    const c = A.at(x, y)
    const o2 = oklch(...c)
    if (o2.C >= 0.05 && o2.H >= 140 && o2.H <= 200) appStripe++
  }
  console.log(`  sidebar left-20 mint=${stripe} appearance left-20 mint=${appStripe}`)
}

console.log('\n===== CLOSE MARKS =====')
{
  const C = decode(`${ROOT}/commands-dock.png`)
  const P = decode(`${ROOT}/appearance-dock.png`)
  let dCA = 0, t = 0
  for (let y = 16; y <= 27; y++) for (let x = 220; x <= 231; x++) {
    t++
    if (!eq(C.at(x, y), P.at(x, y))) dCA++
  }
  console.log(`  commands vs appearance close 12x12: ${dCA}/${t}`)
}

console.log('\n===== HEAD HAIRLINES =====')
{
  const hair = [29, 34, 35]
  for (const f of ['sidebar.png', 'agents-dock.png', 'commands-dock.png', 'appearance-dock.png']) {
    const I = decode(`${ROOT}/${f}`)
    let hairY = -1
    for (let y = 30; y <= 50; y++) {
      let n = 0
      for (let x = 0; x < I.w; x++) if (near(I.at(x, y), hair, 4)) n++
      if (n >= I.w - 8) { hairY = y; break }
    }
    console.log(`  ${f} first full hairline y${hairY}`)
  }
}

console.log('\n===== WELCOME CENTRE =====')
{
  const W = decode(`${ROOT}/welcome.png`)
  const gW = W.at(20, 20)
  let L = 1e9, R = -1
  for (let y = 0; y < W.h; y++) for (let x = 0; x < W.w; x++) {
    if (!near(W.at(x, y), gW, 8)) { if (x < L) L = x; if (x > R) R = x }
  }
  console.log(`  welcome content x${L}..${R} w=${R - L + 1} mid=${f2((L + R + 1) / 2)} paneMid=${f2(W.w / 2)} disp=${f2((L + R + 1) / 2 - W.w / 2)}`)
}

console.log('\n===== COMPOSER CHIPS vs TITLEBAR PILLS =====')
{
  const B = decode(`${ROOT}/input-bar.png`)
  const T = decode(`${ROOT}/titlebar.png`)
  const g = B.at(10, 10)
  const occ = []
  for (let x = 0; x < B.w; x++) {
    let n = 0
    for (let y = 70; y < B.h; y++) if (!near(B.at(x, y), g, 8)) n++
    occ.push(n)
  }
  const runs = []; let cur = null
  for (let x = 0; x < B.w; x++) {
    if (occ[x] > 3) { if (!cur) cur = { x0: x }; cur.x1 = x } else if (cur) { runs.push(cur); cur = null }
  }
  if (cur) runs.push(cur)
  const merged = []
  for (const r of runs) {
    const last = merged[merged.length - 1]
    if (last && r.x0 - last.x1 - 1 <= 6) last.x1 = r.x1
    else merged.push({ ...r })
  }
  console.log('  input-bar lower ink runs w>=20:')
  for (const r of merged.filter((r) => r.x1 - r.x0 + 1 >= 20)) {
    let y0 = 1e9, y1 = -1
    for (let x = r.x0; x <= r.x1; x++) for (let y = 70; y < B.h; y++) if (!near(B.at(x, y), g, 8)) {
      if (y < y0) y0 = y; if (y > y1) y1 = y
    }
    console.log(`    x${r.x0}..${r.x1} w=${r.x1 - r.x0 + 1} y${y0}..${y1} h=${y1 - y0 + 1}`)
  }
  const G = T.at(400, 20)
  const on = (x, y) => !near(T.at(x, y), G, 2)
  // Wisped/Bypass already known; reprint painted sizes
  console.log('  titlebar pills from occupancy: scan x150..280')
  let pL = 1e9, pR = -1, pT = 1e9, pB = -1
  for (let y = 10; y <= 38; y++) for (let x = 150; x <= 280; x++) if (on(x, y)) {
    if (x < pL) pL = x; if (x > pR) pR = x; if (y < pT) pT = y; if (y > pB) pB = y
  }
  console.log(`  titlebar pill cluster x${pL}..${pR} y${pT}..${pB} w=${pR - pL + 1} h=${pB - pT + 1}`)
}

console.log('\n===== NEW PROBE: radius families across quiet controls =====')
{
  // filter r8 vs tool r4 vs command r? vs composer pill
  const S = decode(`${ROOT}/sidebar.png`)
  const C = decode(`${ROOT}/chat.png`)
  const K = decode(`${ROOT}/commands-dock.png`)
  const B = decode(`${ROOT}/input-bar.png`)
  const cornerRun = (I, x0, y0, fill, max = 16) => {
    // count how many pixels of fill sit on the first interior row after the corner
    let first = -1
    for (let x = x0; x < x0 + max; x++) if (near(I.at(x, y0), fill, 6)) { first = x; break }
    return first
  }
  const field = [29, 34, 35]
  const well = [8, 12, 14]
  const cmd = [25, 30, 32]
  console.log(`  filter first-fill at y118 from x8: x${cornerRun(S, 8, 118, field)}`)
  console.log(`  filter first-fill at y116 from x8: x${cornerRun(S, 8, 116, field)}`)
  console.log(`  tool row first-fill at y277 from x260: x${cornerRun(C, 260, 277, well)}`)
  console.log(`  tool row first-fill at y276 from x260: x${cornerRun(C, 260, 276, well)}`)
  console.log(`  command outline first at y49 from x0: x${cornerRun(K, 0, 49, cmd)}`)
  const pill = B.at(400, 35)
  console.log(`  composer pill first-fill at y14 from x200: x${cornerRun(B, 200, 14, pill)} rgb pill (${pill})`)
}

console.log('\n===== NEW PROBE: titlebar ground vs rail vs chat vs composer =====')
{
  const T = decode(`${ROOT}/titlebar.png`)
  const S = decode(`${ROOT}/sidebar.png`)
  const C = decode(`${ROOT}/chat.png`)
  const B = decode(`${ROOT}/input-bar.png`)
  const W = decode(`${ROOT}/window-session.png`)
  const samples = [
    ['titlebar mid', T.at(400, 20)],
    ['rail ground', S.at(120, 320)],
    ['chat mid ground', C.at(100, 40)],
    ['composer ground', B.at(40, 20)],
    ['window workspace mid', W.at(700, 400)],
    ['window rail', W.at(40, 200)],
    ['window titlebar', W.at(400, 20)]
  ]
  for (const [lbl, rgb] of samples) {
    const o = oklch(...rgb)
    console.log(`  ${lbl.padEnd(24)} rgb(${rgb}) L=${f4(o.L)} C=${f4(o.C)} H=${o.H.toFixed(1)}`)
  }
}

console.log('\n===== NEW PROBE: window-session-short unique vs overflowing =====')
{
  // anything in the short capture that cannot be seen by critics besides divider/jog
  const S = decode(`${ROOT}/window-session-short.png`)
  const O = decode(`${ROOT}/window-session.png`)
  console.log(`  short ${S.w}x${S.h} overflow ${O.w}x${O.h}`)
  // compare overlapping 1440x900 RGB if short is taller
  const h = Math.min(S.h, O.h)
  let changed = 0
  for (let y = 0; y < h; y++) for (let x = 0; x < S.w; x++) {
    const a = S.at(x, y), b = O.at(x, y)
    if (a[0] !== b[0] || a[1] !== b[1] || a[2] !== b[2]) changed++
  }
  console.log(`  overlapping 1440x${h} rgb_changed=${changed}`)
}

console.log('\n===== NEW PROBE: mark sizes vs site =====')
{
  const mintish = (c) => {
    const o = oklch(...c)
    return o.C >= 0.05 && o.H >= 140 && o.H <= 200
  }
  const bbox = (I, xa, xb, ya, yb) => {
    let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1, n = 0
    for (let y = ya; y <= yb; y++) for (let x = xa; x <= xb; x++) if (mintish(I.at(x, y))) {
      n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y
    }
    return n ? { x0, x1, y0, y1, w: x1 - x0 + 1, h: y1 - y0 + 1, n } : null
  }
  const T = decode(`${ROOT}/titlebar.png`)
  const W = decode(`${ROOT}/welcome.png`)
  const C = decode(`${ROOT}/chat.png`)
  const WW = decode(`${ROOT}/window-welcome.png`)
  console.log('  titlebar', bbox(T, 0, 80, 0, 47))
  console.log('  welcome', bbox(W, 480, 600, 220, 300))
  console.log('  window-welcome titlebar', bbox(WW, 0, 80, 0, 47))
  console.log('  window-welcome hero', bbox(WW, 480, 600, 270, 350))
  console.log('  chat a1', bbox(C, 190, 260, 90, 150))
  console.log('  chat a2', bbox(C, 190, 260, 640, 700))
}
