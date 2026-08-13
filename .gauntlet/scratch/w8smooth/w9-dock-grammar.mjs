import { decode, oklch } from './png.mjs'

const ROOT = 'D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/9'
const near = (c, t, k = 6) => Math.abs(c[0] - t[0]) + Math.abs(c[1] - t[1]) + Math.abs(c[2] - t[2]) <= k
const eq = (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2]
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

const pairShells = (comps) => {
  // pair top+bottom long runs with left+right verticals into boxes
  const tops = comps.filter((c) => c.h === 1 && c.w >= 150)
  const verts = comps.filter((c) => c.w === 1 && c.h >= 20)
  const shells = []
  for (const top of tops) {
    const bottom = tops.find((b) => b.y0 > top.y0 && b.y0 - top.y0 <= 80 && Math.abs(b.x0 - top.x0) <= 2 && Math.abs(b.x1 - top.x1) <= 2)
    if (!bottom) continue
    if (shells.some((s) => s.y0 === top.y0)) continue
    const left = verts.find((v) => v.x0 <= top.x0 && v.y0 >= top.y0 && v.y1 <= bottom.y0 + 2)
    const right = verts.find((v) => v.x0 >= top.x1 && v.y0 >= top.y0 && v.y1 <= bottom.y0 + 2)
    shells.push({
      y0: top.y0, y1: bottom.y0, x0: left ? left.x0 : top.x0, x1: right ? right.x0 : top.x1,
      outerH: bottom.y0 - top.y0 + 1, top, bottom, left, right
    })
  }
  return shells
}

console.log('===== COMMAND SHELLS =====')
{
  const I = decode(`${ROOT}/commands-dock.png`)
  const comps = outlineOf(I, [25, 30, 32])
  const shells = pairShells(comps)
  console.log(`  comps ${comps.length} shells ${shells.length}`)
  const ground = [11, 15, 17]
  for (const s of shells) {
    const midY = Math.round((s.y0 + s.y1) / 2)
    const interior = I.at(120, midY)
    // name ink: first bright-ish non-ground / non-outline in upper half
    let nx = 1e9, ny = 1e9, nX = -1, nY = -1, nn = 0
    for (let y = s.y0 + 4; y <= s.y0 + 22 && y < s.y1; y++) for (let x = s.x0 + 2; x <= s.x1 - 2; x++) {
      const c = I.at(x, y)
      if (near(c, ground, 8) || (c[0] === 25 && c[1] === 30 && c[2] === 32)) continue
      if (c[0] + c[1] + c[2] < 80) continue
      nn++; if (x < nx) nx = x; if (x > nX) nX = x; if (y < ny) ny = y; if (y > nY) nY = y
    }
    const leftEdge = s.left ? s.left.x0 : s.x0
    console.log(`  shell y${s.y0}..${s.y1} h=${s.outerH} x${s.x0}..${s.x1} interior rgb(${interior}) name x${nx}..${nX} y${ny}..${nY} h=${nY - ny + 1} insetFromOuter ${nx - leftEdge} insetFromContentEdge ${nx - 16}`)
  }
  // inter-shell ground
  for (let i = 0; i + 1 < shells.length; i++) {
    const a = shells[i], b = shells[i + 1]
    const gap = b.y0 - a.y1 - 1
    console.log(`  gap after shell ${i + 1}: ${gap}px (y${a.y1 + 1}..${b.y0 - 1})`)
  }
}

console.log('\n===== APPEARANCE SHELLS =====')
{
  const I = decode(`${ROOT}/appearance-dock.png`)
  const comps = outlineOf(I, [25, 30, 32])
  const shells = pairShells(comps)
  console.log(`  comps ${comps.length} paired ${shells.length}`)
  // also report unpaired long rows (theme rows may have weaker sides because of fill)
  const longs = comps.filter((c) => c.h === 1 && c.w >= 150)
  console.log('  long rows:', longs.map((c) => `y${c.y0} x${c.x0}..${c.x1}`).join(' '))
  const verts = comps.filter((c) => c.w === 1 && c.h >= 18)
  console.log('  verts:', verts.map((c) => `x${c.x0} y${c.y0}..${c.y1} h${c.h}`).join(' '))

  const ground = [11, 15, 17]
  const wash = [28, 39, 39]
  // Reconstruct boxes from consecutive long-row pairs that look like top/bottom
  const used = new Set()
  const boxes = []
  for (let i = 0; i < longs.length; i++) {
    if (used.has(i)) continue
    for (let j = i + 1; j < longs.length; j++) {
      const dy = longs[j].y0 - longs[i].y0
      if (dy >= 20 && dy <= 80 && Math.abs(longs[j].x0 - longs[i].x0) <= 2) {
        used.add(i); used.add(j)
        boxes.push({ y0: longs[i].y0, y1: longs[j].y0, x0: longs[i].x0, x1: longs[i].x1, h: dy + 1 })
        break
      }
    }
  }
  console.log(`  reconstructed boxes ${boxes.length}`)
  for (const b of boxes) {
    const midY = Math.round((b.y0 + b.y1) / 2)
    const interior = I.at(40, midY)
    const o = oklch(...interior)
    let nx = 1e9, ny = 1e9, nX = -1, nY = -1
    for (let y = b.y0 + 3; y <= Math.min(b.y0 + 18, b.y1 - 2); y++) for (let x = 10; x <= 120; x++) {
      const c = I.at(x, y)
      if (near(c, ground, 8) || near(c, wash, 8) || (c[0] === 25 && c[1] === 30 && c[2] === 32)) continue
      if (c[0] + c[1] + c[2] < 80) continue
      if (x < nx) nx = x; if (x > nX) nX = x; if (y < ny) ny = y; if (y > nY) nY = y
    }
    console.log(`  box y${b.y0}..${b.y1} h=${b.h} interior rgb(${interior}) L=${o.L.toFixed(4)} name x${nx} y${ny}..${nY} h=${nY - ny + 1} inset ${nx - 16}`)
  }
  for (let i = 0; i + 1 < boxes.length; i++) {
    const gap = boxes[i + 1].y0 - boxes[i].y1 - 1
    console.log(`  gap after box ${i + 1}: ${gap}px`)
  }
}

console.log('\n===== AGENT / SESSION RESTING OUTLINE =====')
{
  const files = ['agents-dock.png', 'sidebar.png']
  for (const f of files) {
    const I = decode(`${ROOT}/${f}`)
    const counts = new Map()
    for (let y = 50; y < I.h; y++) for (let x = 0; x < I.w; x++) {
      const k = I.at(x, y).join(',')
      counts.set(k, (counts.get(k) || 0) + 1)
    }
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
    console.log(`  ${f} top colors:`)
    for (const [k, n] of top) {
      const rgb = k.split(',').map(Number)
      const o = oklch(...rgb)
      console.log(`    rgb(${k}) n=${n} L=${o.L.toFixed(4)} C=${o.C.toFixed(4)}`)
    }
    const t2 = outlineOf(I, [25, 30, 32], 10)
    const border = outlineOf(I, [29, 34, 35], 20)
    console.log(`  ${f} rgb(25,30,32) comps>=10: ${t2.length}  rgb(29,34,35) comps>=20: ${border.length}`)
  }
}

console.log('\n===== NAME INK HEIGHTS (face proxy) =====')
{
  const samples = [
    ['commands /preset', 'commands-dock.png', 18, 116, 63, 69],
    ['commands /trace', 'commands-dock.png', 18, 108, 133, 140],
    ['agents general-purpose', 'agents-dock.png', 17, 111, 66, 72],
    ['agents Explore', 'agents-dock.png', 17, 80, 169, 175],
    ['appearance Ember', 'appearance-dock.png', 17, 55, 126, 132],
    ['appearance Moss', 'appearance-dock.png', 17, 47, 158, 167],
    ['sidebar row2 title', 'sidebar.png', 16, 200, 290, 299]
  ]
  for (const [lbl, f, x0, x1, y0, y1] of samples) {
    const I = decode(`${ROOT}/${f}`)
    const g = I.at(4, 4)
    let T = 1e9, B = -1, L = 1e9, R = -1, n = 0
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (!near(I.at(x, y), g, 14)) {
        n++; if (y < T) T = y; if (y > B) B = y; if (x < L) L = x; if (x > R) R = x
      }
    }
    console.log(`  ${lbl.padEnd(28)} ink y${T}..${B} h=${B - T + 1} x${L}..${R} n=${n}`)
  }
}

console.log('\n===== SELECTED WASH IDENTITY =====')
{
  const A = decode(`${ROOT}/appearance-dock.png`)
  const S = decode(`${ROOT}/sidebar.png`)
  const wash = [28, 39, 39]
  let aN = 0, sN = 0
  for (let y = 70; y <= 110; y++) for (let x = 8; x <= 240; x++) if (eq(A.at(x, y), wash)) aN++
  for (let y = 202; y <= 275; y++) for (let x = 8; x <= 230; x++) if (eq(S.at(x, y), wash)) sN++
  const o = oklch(...wash)
  console.log(`  shared wash rgb(28,39,39) L=${o.L.toFixed(4)} C=${o.C.toFixed(4)} H=${o.H.toFixed(1)}`)
  console.log(`  appearance Frost band exact wash px=${aN}`)
  console.log(`  sidebar selected row exact wash px=${sN}`)
  // mint stripe on session vs none on appearance
  let stripe = 0
  for (let y = 202; y <= 275; y++) for (let x = 0; x <= 20; x++) {
    const c = S.at(x, y)
    const o2 = oklch(...c)
    if (o2.C >= 0.05 && o2.H >= 140 && o2.H <= 200) stripe++
  }
  let appStripe = 0
  for (let y = 70; y <= 110; y++) for (let x = 0; x <= 20; x++) {
    const c = A.at(x, y)
    const o2 = oklch(...c)
    if (o2.C >= 0.05 && o2.H >= 140 && o2.H <= 200) appStripe++
  }
  console.log(`  sidebar left-20 mint px=${stripe}  appearance left-20 mint px=${appStripe}`)
}

console.log('\n===== TOOL ROW vs COMMAND SHELL TOKENS =====')
{
  const C = decode(`${ROOT}/chat.png`)
  const K = decode(`${ROOT}/commands-dock.png`)
  const toolBorder = C.at(700, 276)
  const cmdEdge = K.at(7, 80)
  const tO = oklch(...toolBorder)
  const cO = oklch(...cmdEdge)
  console.log(`  tool outline rgb(${toolBorder}) L=${f4(tO.L)}`)
  console.log(`  command outline rgb(${cmdEdge}) L=${f4(cO.L)} dL=${f4(cO.L - tO.L)} dRGB=${cmdEdge.map((v, i) => v - toolBorder[i]).join(',')}`)
}

console.log('\n===== AGENT NAME INSET vs COMMAND =====')
{
  const G = decode(`${ROOT}/agents-dock.png`)
  const ground = [11, 15, 17]
  // first agent name band y66..72 x17
  let nx = 1e9
  for (let y = 66; y <= 72; y++) for (let x = 0; x <= 80; x++) {
    const c = G.at(x, y)
    if (!near(c, ground, 10) && c[0] + c[1] + c[2] > 80) { if (x < nx) nx = x }
  }
  console.log(`  agents first name ink x${nx} inset-from-16 ${nx - 16}`)
}

console.log('\n===== FILTER RADIUS vs COMMAND RADIUS (corner probe) =====')
{
  const S = decode(`${ROOT}/sidebar.png`)
  const K = decode(`${ROOT}/commands-dock.png`)
  const field = [29, 34, 35]
  const rail = [11, 15, 17]
  console.log('  filter top-left x14..30 y116..126 (. = rail, # = field):')
  for (let y = 116; y <= 126; y++) {
    let s = ''
    for (let x = 14; x <= 30; x++) {
      const c = S.at(x, y)
      s += near(c, rail, 3) ? '.' : near(c, field, 3) ? '#' : '?'
    }
    console.log(`   y${y} ${s}`)
  }
  const edge = [25, 30, 32]
  console.log('  command first-row top-left x5..22 y48..58 (. = dock, # = outline):')
  for (let y = 48; y <= 58; y++) {
    let s = ''
    for (let x = 5; x <= 22; x++) {
      const c = K.at(x, y)
      s += near(c, rail, 3) ? '.' : (c[0] === 25 && c[1] === 30 && c[2] === 32) || near(c, edge, 2) ? '#' : '?'
    }
    console.log(`   y${y} ${s}`)
  }
}

console.log('\n===== COMPOSER DEFAULT CHIP vs TITLEBAR PILL GEOMETRY =====')
{
  const B = decode(`${ROOT}/input-bar.png`)
  const T = decode(`${ROOT}/titlebar.png`)
  // find chip-like rounded boxes in input-bar below y70
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
    for (let x = r.x0; x <= r.x1; x++) for (let y = 70; y < B.h; y++) if (!near(B.at(x, y), g, 8)) { if (y < y0) y0 = y; if (y > y1) y1 = y }
    console.log(`    x${r.x0}..${r.x1} w=${r.x1 - r.x0 + 1} y${y0}..${y1} h=${y1 - y0 + 1}`)
  }
  console.log('  titlebar pills: Wisped x158..216 w59 h21; Bypass x221..275 w55 h21')
}

console.log('\n===== WELCOME CTA vs COMPOSER SEND =====')
{
  const W = decode(`${ROOT}/welcome.png`)
  const B = decode(`${ROOT}/input-bar.png`)
  const mintish = (c) => {
    const o = oklch(...c)
    return o.C >= 0.05 && o.H >= 140 && o.H <= 200
  }
  const bbox = (I, xa, xb, ya, yb) => {
    let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1, n = 0
    for (let y = ya; y <= yb; y++) for (let x = xa; x <= xb; x++) if (mintish(I.at(x, y))) {
      n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y
    }
    return { x0, x1, y0, y1, w: x1 - x0 + 1, h: y1 - y0 + 1, n }
  }
  console.log('  welcome CTA', bbox(W, 500, 900, 400, 520))
  console.log('  send button', bbox(B, 900, 1100, 0, 80))
}
