import { decode, oklch } from './png.mjs'

const ROOT = 'D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/9'
const near = (c, t, k = 6) => Math.abs(c[0] - t[0]) + Math.abs(c[1] - t[1]) + Math.abs(c[2] - t[2]) <= k
const eq = (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2]

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

console.log('===== COMMAND ROW BOXES =====')
{
  const I = decode(`${ROOT}/commands-dock.png`)
  const rows = longRows(I, [25, 30, 32], 180)
  console.log('  long rows', rows.map((r) => `y${r.y}`).join(' '))
  const boxes = pairByHeight(rows, 40, 80)
  console.log(`  boxes ${boxes.length}`)
  const ground = [11, 15, 17]
  for (let i = 0; i < boxes.length; i++) {
    const b = boxes[i]
    const midY = Math.round((b.y0 + b.y1) / 2)
    // left vertical presence
    let leftX = -1
    for (let x = 0; x <= 20; x++) {
      const c = I.at(x, midY)
      if (c[0] === 25 && c[1] === 30 && c[2] === 32) { leftX = x; break }
    }
    let nx = 1e9, ny = 1e9, nX = -1, nY = -1, nn = 0
    for (let y = b.y0 + 6; y <= b.y0 + 22; y++) for (let x = 10; x <= 160; x++) {
      const c = I.at(x, y)
      if (near(c, ground, 10)) continue
      if (c[0] === 25 && c[1] === 30 && c[2] === 32) continue
      if (c[0] + c[1] + c[2] < 90) continue
      nn++; if (x < nx) nx = x; if (x > nX) nX = x; if (y < ny) ny = y; if (y > nY) nY = y
    }
    const gap = i + 1 < boxes.length ? boxes[i + 1].y0 - b.y1 - 1 : null
    console.log(`  row${i + 1} y${b.y0}..${b.y1} h=${b.h} leftX=${leftX} name x${nx}..${nX} y${ny}..${nY} h=${nY - ny + 1} n=${nn} insetFrom16=${nx - 16} insetFromLeft=${nx - leftX} nextGap=${gap}`)
  }
}

console.log('\n===== APPEARANCE OPTION BOXES =====')
{
  const I = decode(`${ROOT}/appearance-dock.png`)
  const rows = longRows(I, [25, 30, 32], 180)
  console.log('  long rows', rows.map((r) => `y${r.y}`).join(' '))
  // theme rows ~30px, backdrop taller
  const boxes = pairByHeight(rows, 24, 80)
  console.log(`  boxes ${boxes.length}`)
  const ground = [11, 15, 17]
  const wash = [28, 39, 39]
  for (let i = 0; i < boxes.length; i++) {
    const b = boxes[i]
    const midY = Math.round((b.y0 + b.y1) / 2)
    let leftX = -1
    for (let x = 0; x <= 20; x++) {
      const c = I.at(x, midY)
      if (c[0] === 25 && c[1] === 30 && c[2] === 32) { leftX = x; break }
    }
    const interior = I.at(40, midY)
    let nx = 1e9, ny = 1e9, nX = -1, nY = -1, nn = 0
    for (let y = b.y0 + 4; y <= Math.min(b.y0 + 20, b.y1 - 3); y++) for (let x = 10; x <= 120; x++) {
      const c = I.at(x, y)
      if (near(c, ground, 10) || near(c, wash, 8)) continue
      if (c[0] === 25 && c[1] === 30 && c[2] === 32) continue
      if (c[0] + c[1] + c[2] < 90) continue
      nn++; if (x < nx) nx = x; if (x > nX) nX = x; if (y < ny) ny = y; if (y > nY) nY = y
    }
    const gap = i + 1 < boxes.length ? boxes[i + 1].y0 - b.y1 - 1 : null
    const o = oklch(...interior)
    console.log(`  opt${i + 1} y${b.y0}..${b.y1} h=${b.h} leftX=${leftX} interior rgb(${interior}) L=${o.L.toFixed(4)} name x${nx} y${ny}..${nY} h=${nY - ny + 1} inset16=${nx - 16} nextGap=${gap}`)
  }
}

console.log('\n===== AGENT / SESSION NAME INSET =====')
{
  const G = decode(`${ROOT}/agents-dock.png`)
  const S = decode(`${ROOT}/sidebar.png`)
  const ground = [11, 15, 17]
  const firstInk = (I, y0, y1, x1 = 80) => {
    let x0 = 1e9
    for (let y = y0; y <= y1; y++) for (let x = 0; x <= x1; x++) {
      const c = I.at(x, y)
      if (!near(c, ground, 10) && c[0] + c[1] + c[2] > 90) if (x < x0) x0 = x
    }
    return x0
  }
  console.log(`  agents general-purpose name x${firstInk(G, 66, 72)}`)
  console.log(`  agents Explore name x${firstInk(G, 169, 175)}`)
  console.log(`  agents cavecrew name x${firstInk(G, 271, 277)}`)
  console.log(`  sidebar row2 title x${firstInk(S, 290, 299, 40)}`)
  console.log(`  sidebar row3 title x${firstInk(S, 365, 374, 40)}`)
}

console.log('\n===== ZOOM CONTROL SHELL =====')
{
  const I = decode(`${ROOT}/appearance-dock.png`)
  // from earlier bands, zoom header around y429+
  const rows = longRows(I, [25, 30, 32], 180)
  console.log('  all long', rows.map((r) => `y${r.y}`).join(' '))
  // sample around y429-466
  const census = (y0, y1) => {
    const m = new Map()
    for (let y = y0; y <= y1; y++) for (let x = 0; x < I.w; x++) {
      const k = I.at(x, y).join(',')
      m.set(k, (m.get(k) || 0) + 1)
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
  }
  console.log('  zoom band y429-466 top:')
  for (const [k, n] of census(429, 466)) {
    const rgb = k.split(',').map(Number)
    const o = oklch(...rgb)
    console.log(`    rgb(${k}) n=${n} L=${o.L.toFixed(4)}`)
  }
  // stepper interior vs option interior
  console.log(`  option Ember interior @40,160 rgb(${I.at(40, 160)})`)
  console.log(`  zoom head interior @40,448 rgb(${I.at(40, 448)})`)
  console.log(`  stepper sample @200,448 rgb(${I.at(200, 448)})`)
}

console.log('\n===== TOOL ROW RADIUS vs COMMAND RADIUS =====')
{
  const C = decode(`${ROOT}/chat.png`)
  const fill = [8, 12, 14], border = [25, 29, 31]
  console.log('  tool c1r1 top-left x266..276 y276..282:')
  for (let y = 276; y <= 282; y++) {
    let s = ''
    for (let x = 266; x <= 276; x++) {
      const c = C.at(x, y)
      s += eq(c, fill) ? '#' : eq(c, border) ? 'o' : '.'
    }
    console.log(`   y${y} ${s}`)
  }
}

console.log('\n===== SESSION ACTIVE vs APPEARANCE SELECTED GRAMMAR =====')
{
  const S = decode(`${ROOT}/sidebar.png`)
  const A = decode(`${ROOT}/appearance-dock.png`)
  // session selected row y202..275: mint stripe + wash, no outline
  let outlineS = 0, outlineA = 0
  for (let y = 202; y <= 275; y++) for (let x = 0; x < 248; x++) {
    const c = S.at(x, y)
    if (c[0] === 25 && c[1] === 30 && c[2] === 32) outlineS++
  }
  for (let y = 78; y <= 108; y++) for (let x = 0; x < 248; x++) {
    const c = A.at(x, y)
    if (c[0] === 25 && c[1] === 30 && c[2] === 32) outlineA++
  }
  console.log(`  session selected rgb(25,30,32) px=${outlineS}`)
  console.log(`  appearance Frost rgb(25,30,32) px=${outlineA}`)
  // Frost top/bottom long rows?
  const frostLong = longRows(A, [25, 30, 32], 150).filter((r) => r.y >= 70 && r.y <= 120)
  console.log('  frost-adjacent long tint2', frostLong)
  // mint-wash bbox on both
  const wash = [28, 39, 39]
  const bbox = (I, y0, y1) => {
    let x0 = 1e9, x1 = -1, yy0 = 1e9, yy1 = -1, n = 0
    for (let y = y0; y <= y1; y++) for (let x = 0; x < I.w; x++) if (eq(I.at(x, y), wash)) {
      n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < yy0) yy0 = y; if (y > yy1) yy1 = y
    }
    return { x0, x1, yy0, yy1, w: x1 - x0 + 1, h: yy1 - yy0 + 1, n }
  }
  console.log('  session wash bbox', bbox(S, 190, 290))
  console.log('  appearance frost wash bbox', bbox(A, 60, 120))
}

console.log('\n===== LIST GAP MEASURE FROM BOX EDGES =====')
{
  // commands known boxes from pairByHeight
  const I = decode(`${ROOT}/commands-dock.png`)
  const boxes = pairByHeight(longRows(I, [25, 30, 32], 180), 40, 80)
  for (let i = 0; i + 1 < boxes.length; i++) {
    console.log(`  cmd gap ${i + 1}->${i + 2}: ${boxes[i + 1].y0 - boxes[i].y1 - 1}px  heights ${boxes[i].h}/${boxes[i + 1].h}`)
  }
  const A = decode(`${ROOT}/appearance-dock.png`)
  const aboxes = pairByHeight(longRows(A, [25, 30, 32], 180), 24, 80)
  for (let i = 0; i + 1 < aboxes.length; i++) {
    console.log(`  app gap ${i + 1}->${i + 2}: ${aboxes[i + 1].y0 - aboxes[i].y1 - 1}px  heights ${aboxes[i].h}/${aboxes[i + 1].h}`)
  }
}

console.log('\n===== AGENT ROW HEIGHTS FROM INK BANDS =====')
{
  const I = decode(`${ROOT}/agents-dock.png`)
  const ground = [11, 15, 17]
  const bands = []
  let b = null
  for (let y = 50; y < 320; y++) {
    let n = 0
    for (let x = 10; x <= 230; x++) if (!near(I.at(x, y), ground, 10)) n++
    if (n >= 20) { if (!b) b = { y0: y }; b.y1 = y; b.n = (b.n || 0) + n }
    else if (b) { bands.push(b); b = null }
  }
  if (b) bands.push(b)
  for (const r of bands) console.log(`  agent band y${r.y0}..${r.y1} h=${r.y1 - r.y0 + 1}`)
  // gaps between major clusters
}
