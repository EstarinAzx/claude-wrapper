import { decode, oklch } from './png.mjs'

const ROOT = 'D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/9'
const near = (c, t, k = 6) => Math.abs(c[0] - t[0]) + Math.abs(c[1] - t[1]) + Math.abs(c[2] - t[2]) <= k
const eq = (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2]
const f2 = (n) => n.toFixed(2)

console.log('===== LABEL INSET (wave-8 method) =====')
{
  const I = decode(`${ROOT}/chat.png`)
  const fill = I.at(700, 284), card = I.at(400, 220)
  const bands = [
    ['c1 prose1', 228, 241, 260, 800, card],
    ['c1 prose2', 253, 266, 260, 800, card],
    ['row1', 280, 287, 270, 790, fill],
    ['row2', 303, 310, 270, 790, fill],
    ['c2 prose1', 446, 458, 260, 800, card],
    ['c2 prose2', 472, 485, 260, 800, card],
    ['c2 row1', 499, 506, 270, 790, fill],
    ['c2 row2', 522, 529, 270, 790, fill]
  ]
  for (const [lbl, y0, y1, xs, xe, g] of bands) {
    const cols = []
    for (let x = xs; x <= xe; x++) {
      let n = 0
      for (let y = y0; y <= y1; y++) if (!near(I.at(x, y), g, 12)) n++
      cols.push([x, n])
    }
    const runs = []; let r = null
    for (const [x, n] of cols) {
      if (n) { if (!r) r = { x0: x, n: 0 }; r.x1 = x; r.n += n }
      else if (r) { runs.push(r); r = null }
    }
    if (r) runs.push(r)
    console.log(`  ${lbl.padEnd(12)} y${y0}..${y1}: ${runs.map((r) => `x${r.x0}..${r.x1}(${r.n})`).join(' ')}`)
  }
  console.log('  row1 raw non-fill x266..300:')
  for (let x = 266; x <= 300; x++) {
    const vals = []
    for (let y = 280; y <= 287; y++) {
      const c = I.at(x, y)
      if (!near(c, fill, 12)) vals.push(`${y}:${c.join('/')}`)
    }
    if (vals.length) console.log(`    x${x} ${vals.join(' ')}`)
  }
}

console.log('\n===== APPEARANCE / COMMAND / AGENT / SESSION NAME INK =====')
{
  const inkBbox = (I, x0, x1, y0, y1, ground, k = 10) => {
    let L = 1e9, R = -1, T = 1e9, B = -1, n = 0
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (!near(I.at(x, y), ground, k)) {
        n++; if (x < L) L = x; if (x > R) R = x; if (y < T) T = y; if (y > B) B = y
      }
    }
    return n ? { L, R, T, B, w: R - L + 1, h: B - T + 1, n } : null
  }

  const A = decode(`${ROOT}/appearance-dock.png`)
  const C = decode(`${ROOT}/commands-dock.png`)
  const G = decode(`${ROOT}/agents-dock.png`)
  const S = decode(`${ROOT}/sidebar.png`)
  const ground = [11, 15, 17]

  // scan appearance for horizontal ink bands in the theme block
  const bandsOf = (I, x0, x1, y0, y1, g, minW = 20) => {
    const bands = []; let b = null
    for (let y = y0; y <= y1; y++) {
      let n = 0, a = 1e9, z = -1
      for (let x = x0; x <= x1; x++) if (!near(I.at(x, y), g, 12)) { n++; if (x < a) a = x; if (x > z) z = x }
      if (n >= minW) { if (!b) b = { y0: y, n: 0, x0: 1e9, x1: -1 }; b.y1 = y; b.n += n; b.x0 = Math.min(b.x0, a); b.x1 = Math.max(b.x1, z) }
      else if (b) { bands.push(b); b = null }
    }
    if (b) bands.push(b)
    return bands
  }

  console.log('  appearance ink bands y44..250 x16..180:')
  for (const b of bandsOf(A, 16, 180, 44, 250, ground, 8)) {
    console.log(`    y${b.y0}..${b.y1} h=${b.y1 - b.y0 + 1} x${b.x0}..${b.x1} w=${b.x1 - b.x0 + 1} n=${b.n}`)
  }
  console.log('  appearance backdrop/zoom bands y250..520 x16..200:')
  for (const b of bandsOf(A, 16, 200, 250, 520, ground, 8)) {
    console.log(`    y${b.y0}..${b.y1} h=${b.y1 - b.y0 + 1} x${b.x0}..${b.x1} w=${b.x1 - b.x0 + 1} n=${b.n}`)
  }

  console.log('  commands ink bands y44..520 x16..200:')
  for (const b of bandsOf(C, 16, 200, 44, 520, ground, 8)) {
    console.log(`    y${b.y0}..${b.y1} h=${b.y1 - b.y0 + 1} x${b.x0}..${b.x1} w=${b.x1 - b.x0 + 1} n=${b.n}`)
  }

  console.log('  agents ink bands y44..280 x16..220:')
  for (const b of bandsOf(G, 16, 220, 44, 280, ground, 8)) {
    console.log(`    y${b.y0}..${b.y1} h=${b.y1 - b.y0 + 1} x${b.x0}..${b.x1} w=${b.x1 - b.x0 + 1} n=${b.n}`)
  }

  console.log('  sidebar session-title bands y200..400 x16..200:')
  for (const b of bandsOf(S, 16, 200, 200, 400, ground, 8)) {
    console.log(`    y${b.y0}..${b.y1} h=${b.y1 - b.y0 + 1} x${b.x0}..${b.x1} w=${b.x1 - b.x0 + 1} n=${b.n}`)
  }
}

console.log('\n===== LIST GAPS FROM SHELL EDGES =====')
{
  const target = [25, 30, 32]
  const horiz = (file) => {
    const I = decode(`${ROOT}/${file}`)
    const rows = []
    for (let y = 44; y < I.h; y++) {
      let n = 0, a = 1e9, z = -1
      for (let x = 0; x < I.w; x++) {
        const c = I.at(x, y)
        if (c[0] === target[0] && c[1] === target[1] && c[2] === target[2]) { n++; if (x < a) a = x; if (x > z) z = x }
      }
      if (n >= 150) rows.push({ y, n, a, z })
    }
    console.log(`  ${file} long tint-2 rows (${rows.length}): ${rows.map((r) => `y${r.y}(${r.n}@x${r.a}..${r.z})`).join(' ')}`)
    const gaps = []
    for (let i = 0; i + 1 < rows.length; i++) gaps.push(rows[i + 1].y - rows[i].y)
    console.log(`    dy: ${gaps.join(',')}`)
  }
  horiz('commands-dock.png')
  horiz('appearance-dock.png')
}

console.log('\n===== CLOSE MARK PIXEL COMPARE =====')
{
  const A = decode(`${ROOT}/agents-dock.png`)
  const C = decode(`${ROOT}/commands-dock.png`)
  const P = decode(`${ROOT}/appearance-dock.png`)
  // commands/appearance close ink x220..231 y16..27
  let dCA = 0, t = 0
  for (let y = 16; y <= 27; y++) for (let x = 220; x <= 231; x++) {
    t++
    const a = C.at(x, y), b = P.at(x, y)
    if (!eq(a, b)) dCA++
  }
  console.log(`  commands vs appearance close 12x12: ${dCA}/${t} differ`)
  // agents close is further left because of the switch. Find rightmost 12x12 ink cluster in head.
  let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1
  for (let y = 8; y <= 36; y++) for (let x = 210; x <= 247; x++) {
    const [r, g, b] = A.at(x, y)
    if (r + g + b > 90) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
  }
  console.log(`  agents rightmost bright cluster x${x0}..${x1} y${y0}..${y1} w${x1 - x0 + 1} h${y1 - y0 + 1}`)
  let dAC = 0, t2 = 0
  const w = Math.min(11, x1 - x0, 231 - 220)
  const h = Math.min(11, y1 - y0, 27 - 16)
  for (let dy = 0; dy <= h; dy++) for (let dx = 0; dx <= w; dx++) {
    t2++
    const a = A.at(x0 + dx, y0 + dy), b = C.at(220 + dx, 16 + dy)
    if (!eq(a, b)) dAC++
  }
  console.log(`  agents-aligned vs commands close: ${dAC}/${t2} differ (aligned ${w + 1}x${h + 1})`)
}

console.log('\n===== APPEARANCE SELECTED WASH vs SESSION WASH =====')
{
  const A = decode(`${ROOT}/appearance-dock.png`)
  const S = decode(`${ROOT}/sidebar.png`)
  const census = (I, x0, x1, y0, y1, lbl) => {
    const m = new Map()
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const k = I.at(x, y).join(',')
      m.set(k, (m.get(k) || 0) + 1)
    }
    const top = [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
    console.log(`  ${lbl}`)
    for (const [k, n] of top) {
      const rgb = k.split(',').map(Number)
      const o = oklch(...rgb)
      console.log(`    rgb(${k}) n=${n} L=${o.L.toFixed(4)} C=${o.C.toFixed(4)} H=${o.H.toFixed(1)}`)
    }
  }
  // Frost row roughly after theme header. From bands we'll refine; probe several y.
  for (const y of [70, 80, 90, 100, 110]) {
    const c = A.at(40, y)
    console.log(`  appearance x40,y${y} rgb(${c})`)
  }
  census(A, 8, 240, 70, 110, 'appearance y70-110')
  census(S, 8, 230, 210, 270, 'sidebar selected row y210-270')
}

console.log('\n===== COMPOSER PILL vs FILTER vs TOOL ROW vs COMMAND SHELL =====')
{
  const B = decode(`${ROOT}/input-bar.png`)
  const S = decode(`${ROOT}/sidebar.png`)
  const C = decode(`${ROOT}/chat.png`)
  const K = decode(`${ROOT}/commands-dock.png`)
  const show = (lbl, rgb, ref) => {
    const o = oklch(...rgb)
    const r = ref ? oklch(...ref) : null
    const step = r ? ((o.L - r.L) >= 0 ? '+' : '') + (o.L - r.L).toFixed(4) : ''
    console.log(`  ${lbl.padEnd(36)} rgb(${rgb}) L=${o.L.toFixed(4)} ${step}`)
  }
  const composerG = B.at(40, 20)
  const pill = B.at(400, 35)
  const pillEdge = B.at(211, 13)
  const railG = S.at(120, 320)
  const field = S.at(200, 130)
  const card = C.at(400, 220)
  const rowF = C.at(700, 284)
  const rowB = C.at(700, 276)
  const cmdG = K.at(120, 30)
  const cmdEdge = K.at(7, 80)
  const cmdIn = K.at(120, 80)
  show('composer ground', composerG)
  show('composer pill interior', pill, composerG)
  show('composer pill edge sample', pillEdge, composerG)
  show('rail ground', railG)
  show('filter fill', field, railG)
  show('card surface', card)
  show('tool row fill', rowF, card)
  show('tool row border', rowB, card)
  show('command dock ground', cmdG)
  show('command row interior', cmdIn, cmdG)
  show('command row edge', cmdEdge, cmdG)
}

console.log('\n===== DATE BOX CLEARANCE =====')
{
  const I = decode(`${ROOT}/window-session-short.png`)
  const BD = [3, 6, 6]
  const on = (x, y, thr = 2) => {
    const [r, g, b] = I.at(x, y)
    return Math.abs(r - BD[0]) + Math.abs(g - BD[1]) + Math.abs(b - BD[2]) > thr
  }
  const rowInk = (y) => { let k = 0; for (let x = 248; x <= 1439; x++) if (on(x, y)) k++; return k }
  console.log('  rows y48..150 ink counts:')
  for (let y = 48; y <= 150; y++) {
    const k = rowInk(y)
    if (k > 0) console.log(`    y${y} ${k}`)
  }
}

console.log('\n===== TITLEBAR vs RAIL vs DOCK LEFT INSET =====')
{
  const files = [
    ['titlebar.png', 0, 47, [11, 15, 17]],
    ['sidebar.png', 48, 200, [11, 15, 17]],
    ['agents-dock.png', 48, 200, [11, 15, 17]],
    ['commands-dock.png', 48, 200, [11, 15, 17]],
    ['appearance-dock.png', 48, 200, [11, 15, 17]]
  ]
  for (const [f, y0, y1, g] of files) {
    const I = decode(`${ROOT}/${f}`)
    let x0 = 1e9
    for (let y = y0; y <= Math.min(y1, I.h - 1); y++) for (let x = 0; x < Math.min(80, I.w); x++) {
      if (!near(I.at(x, y), g, 8)) { if (x < x0) x0 = x }
    }
    console.log(`  ${f} first non-ground in band y${y0}..${y1} x${x0}`)
  }
}

console.log('\n===== WELCOME STACK vs SESSION COLUMN =====')
{
  const W = decode(`${ROOT}/welcome.png`)
  const S = decode(`${ROOT}/window-session.png`)
  const gW = W.at(20, 20)
  let L = 1e9, R = -1, T = 1e9, B = -1
  for (let y = 0; y < W.h; y++) for (let x = 0; x < W.w; x++) {
    if (!near(W.at(x, y), gW, 8)) { if (x < L) L = x; if (x > R) R = x; if (y < T) T = y; if (y > B) B = y }
  }
  console.log(`  welcome content x${L}..${R} w=${R - L + 1} mid=${f2((L + R + 1) / 2)} paneMid=${f2(W.w / 2)} disp=${f2((L + R + 1) / 2 - W.w / 2)}`)
  // session column from overflowing capture, workspace x248..1439 centre
  const gS = S.at(400, 200)
  let sL = 1e9, sR = -1
  for (let y = 60; y <= 760; y++) for (let x = 248; x <= 1430; x++) {
    const c = S.at(x, y)
    if (Math.abs(c[0] - gS[0]) + Math.abs(c[1] - gS[1]) + Math.abs(c[2] - gS[2]) > 8) {
      if (x < sL) sL = x; if (x > sR) sR = x
    }
  }
  const paneL = 248, paneR = 1439
  console.log(`  session transcript ink x${sL}..${sR} w=${sR - sL + 1} mid=${f2((sL + sR + 1) / 2)} paneMid=${f2((paneL + paneR + 1) / 2)} disp=${f2((sL + sR + 1) / 2 - (paneL + paneR + 1) / 2)}`)
}
