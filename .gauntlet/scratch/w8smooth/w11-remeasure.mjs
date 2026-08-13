import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { decode, oklch } from './png.mjs'

const ROOT = 'D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks'
const W11 = `${ROOT}/11`
const W10 = `${ROOT}/10`
const FILES = [
  'welcome.png',
  'window-welcome.png',
  'welcome-min-window.png',
  'titlebar.png',
  'sidebar.png',
  'chat.png',
  'input-bar.png',
  'window-session.png',
  'window-session-short.png',
  'agents-dock.png',
  'commands-dock.png',
  'appearance-dock.png'
]
const f2 = (n) => n.toFixed(2)
const f4 = (n) => n.toFixed(4)
const near = (c, t, k = 6) => Math.abs(c[0] - t[0]) + Math.abs(c[1] - t[1]) + Math.abs(c[2] - t[2]) <= k
const eq = (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2]
const modal = (I, x0, x1, y0, y1) => {
  const m = new Map()
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const k = I.at(x, y).join(',')
    m.set(k, (m.get(k) || 0) + 1)
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1])[0][0].split(',').map(Number)
}

console.log('===== 1 NULL CONTROL wave 11 vs wave 10 =====')
{
  let byteIdentical = 0
  let rgbChangedTotal = 0
  for (const file of FILES) {
    const p10 = `${W10}/${file}`
    const p11 = `${W11}/${file}`
    const b10 = readFileSync(p10)
    const b11 = readFileSync(p11)
    const sameBytes = b10.equals(b11)
    if (sameBytes) byteIdentical++
    const a = decode(p10)
    const b = decode(p11)
    if (a.w !== b.w || a.h !== b.h) throw new Error(`${file}: dimensions differ ${a.w}x${a.h} vs ${b.w}x${b.h}`)
    let rgbChanged = 0
    for (let y = 0; y < a.h; y++) for (let x = 0; x < a.w; x++) {
      const ca = a.at(x, y), cb = b.at(x, y)
      if (ca[0] !== cb[0] || ca[1] !== cb[1] || ca[2] !== cb[2]) rgbChanged++
    }
    rgbChangedTotal += rgbChanged
    const sha = createHash('sha256').update(b11).digest('hex').slice(0, 16)
    console.log(`${file.padEnd(26)} bytes=${sameBytes ? 'IDENTICAL' : 'DIFFERENT'} rgb_changed=${rgbChanged} dims=${a.w}x${a.h} sha256=${sha}`)
  }
  console.log(`SUMMARY byte_identical=${byteIdentical}/${FILES.length} rgb_changed_total=${rgbChangedTotal}`)
}

console.log('\n===== 2 IDENTITY FLOOR wave 11 =====')
{
  const hues = new Map()
  let worst = { f: '', share: 0, mint: 0, tot: 0 }
  for (const f of FILES) {
    const I = decode(`${W11}/${f}`)
    let mint = 0
    const tot = I.w * I.h
    const local = new Map()
    for (let y = 0; y < I.h; y++) for (let x = 0; x < I.w; x++) {
      const [r, g, b] = I.at(x, y)
      const { L, C, H } = oklch(r, g, b)
      if (C >= 0.05 && L > 0.15) {
        const k = Math.round(H)
        local.set(k, (local.get(k) || 0) + 1)
        hues.set(k, (hues.get(k) || 0) + 1)
        if (H >= 140 && H <= 200) mint++
      }
    }
    const share = mint / tot * 100
    if (share > worst.share) worst = { f, share, mint, tot }
    const top = [...local.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([h, n]) => `${h}deg:${n}`).join(' ')
    console.log(`  ${f.padEnd(26)} chromatic-mint ${String(mint).padStart(6)} / ${tot}  = ${f2(share)}%   top ${top}`)
  }
  console.log(`  WORST ${worst.f} ${worst.mint}/${worst.tot} = ${f2(worst.share)}%`)
  const total = [...hues.values()].reduce((s, v) => s + v, 0)
  const fams = []
  for (const [h, n] of [...hues.entries()].sort((a, b) => a[0] - b[0])) {
    const last = fams[fams.length - 1]
    if (last && h - last.h1 <= 12) { last.h1 = h; last.n += n } else fams.push({ h0: h, h1: h, n })
  }
  for (const fm of fams.filter((f) => f.n / total >= 0.005)) {
    console.log(`  family ${fm.h0}..${fm.h1}  ${fm.n}px  ${f2(fm.n / total * 100)}%`)
  }
  console.log(`  chromatic_total=${total}`)
}

console.log('\n===== 3 TYPE SCALE =====')
{
  const rungs = [['--text-micro', 11], ['--text-ui', 13], ['--text-body', 15], ['subagent.css literal', 20], ['--text-display', 46]]
  let worstDev = 0
  for (const [n, v] of rungs) {
    let bk = 0, bd = 1e9, bv = 0
    for (let k = -6; k <= 12; k++) {
      const t = 15 * Math.pow(1.15, k)
      if (Math.abs(t - v) < bd) { bd = Math.abs(t - v); bk = k; bv = t }
    }
    if (bd > worstDev) worstDev = bd
    console.log(`  ${n.padEnd(22)} ${v} nearest ${bv.toFixed(3)} k=${bk} dev=${bd.toFixed(3)}`)
  }
  console.log(`  MAX DEV ${worstDev.toFixed(3)}px  HOLDS=${worstDev <= 0.35}`)
  const GR = [11, 15, 17]
  {
    const I = decode(`${W11}/titlebar.png`)
    let y0 = 1e9, y1 = -1, x0 = 1e9, x1 = -1
    for (let y = 1; y <= 45; y++) for (let x = 38; x <= 145; x++) {
      if (!near(I.at(x, y), GR, 4)) { if (y < y0) y0 = y; if (y > y1) y1 = y; if (x < x0) x0 = x; if (x > x1) x1 = x }
    }
    console.log(`  app name ink y${y0}..${y1} h=${y1 - y0 + 1} x${x0}..${x1}`)
  }
  {
    const I = decode(`${W11}/chat.png`)
    const fill = [8, 12, 14]
    let y0 = 1e9, y1 = -1, x0 = 1e9, x1 = -1
    for (let y = 280; y <= 287; y++) for (let x = 264; x <= 807; x++) {
      if (!near(I.at(x, y), fill, 12) && !near(I.at(x, y), GR, 10)) {
        if (y < y0) y0 = y; if (y > y1) y1 = y; if (x < x0) x0 = x; if (x > x1) x1 = x
      }
    }
    console.log(`  disclosure label ink y${y0}..${y1} h=${y1 - y0 + 1} x${x0}..${x1}`)
  }
}

console.log('\n===== 4 TITLEBAR =====')
{
  const I = decode(`${W11}/titlebar.png`)
  const G = modal(I, 400, 700, 4, 40)
  const on = (x, y) => {
    const c = I.at(x, y)
    return Math.abs(c[0] - G[0]) + Math.abs(c[1] - G[1]) + Math.abs(c[2] - G[2]) > 2
  }
  const occ = []
  for (let x = 0; x < I.w; x++) { let n = 0; for (let y = 1; y <= 45; y++) if (on(x, y)) n++; occ.push(n) }
  const runs = []; let cur = null
  for (let x = 0; x < I.w; x++) { if (occ[x] > 0) { if (!cur) cur = { x0: x }; cur.x1 = x } else if (cur) { runs.push(cur); cur = null } }
  if (cur) runs.push(cur)
  const merged = []
  for (const r of runs) { const last = merged[merged.length - 1]; if (last && r.x0 - last.x1 - 1 <= 2) last.x1 = r.x1; else merged.push({ ...r }) }
  let i = 0; const left = [merged[0]]
  while (i + 1 < merged.length && merged[i + 1].x0 - merged[i].x1 - 1 <= 20) { left.push(merged[i + 1]); i++ }
  const boxes = []
  for (const r of left) {
    let y0 = 1e9, y1 = -1
    for (let x = r.x0; x <= r.x1; x++) for (let y = 1; y <= 45; y++) if (on(x, y)) { if (y < y0) y0 = y; if (y > y1) y1 = y }
    boxes.push({ ...r, y0, y1, h: y1 - y0 + 1 })
  }
  const items = []
  for (const b of boxes) {
    const last = items[items.length - 1]
    const kind = b.x1 < 42 ? 'mark' : b.h >= 18 ? 'pill' : 'name'
    if (last && last.kind === kind && kind === 'name' && b.x0 - last.x1 - 1 <= 8) {
      last.x1 = b.x1; last.y0 = Math.min(last.y0, b.y0); last.y1 = Math.max(last.y1, b.y1)
    } else items.push({ ...b, kind })
  }
  for (const it of items) console.log(`  ${it.kind} x${it.x0}..${it.x1} w=${it.x1 - it.x0 + 1} y${it.y0}..${it.y1} h=${it.h}`)
  const names = ['mark->name', 'name->pill1', 'pill1->pill2']
  const intervals = []
  for (let k = 0; k + 1 < items.length && k < 3; k++) {
    const A = items[k], B = items[k + 1]
    const colClear = B.x0 - A.x1 - 1
    intervals.push(colClear)
    console.log(`  ${names[k]} column ${colClear}px`)
  }
  const gEnd = items[items.length - 1].x1
  console.log(`  group edge x${gEnd} vs rail 247 = ${gEnd - 247}`)
  console.log(`  mark inset ${items[0].x0} size ${items[0].x1 - items[0].x0 + 1}x${items[0].h}`)
  console.log(`  intervals ${intervals.join('/')} ratio ${f2(intervals[1] / intervals[0])}x sum ${intervals.reduce((s, v) => s + v, 0)}`)
  const runs2 = []; let cur2 = null
  for (let x = 0; x < I.w; x++) { if (occ[x] > 0) { if (!cur2) cur2 = { x0: x }; cur2.x1 = x } else if (cur2) { runs2.push(cur2); cur2 = null } }
  if (cur2) runs2.push(cur2)
  const m = []
  for (const r of runs2) { const l = m[m.length - 1]; if (l && r.x0 - l.x1 - 1 <= 8) l.x1 = r.x1; else m.push({ ...r }) }
  const iso = m.filter((r, k) => {
    const p = m[k - 1], n = m[k + 1]
    return (!p || r.x0 - p.x1 - 1 > 40) && (!n || n.x0 - r.x1 - 1 > 40)
  })
  const t = iso.sort((a, b) => Math.abs((a.x0 + a.x1) / 2 - 719.5) - Math.abs((b.x0 + b.x1) / 2 - 719.5))[0]
  const mid = (t.x0 + t.x1 + 1) / 2
  console.log(`  title ink x${t.x0}..${t.x1} mid ${f2(mid)} centre ${f2(I.w / 2)} disp ${f2(mid - I.w / 2)}`)
}

console.log('\n===== 5 TOOL CARDS =====')
{
  const I = decode(`${W11}/chat.png`)
  const sc = I.at(400, 219)
  const cards = [[213, 326], [431, 545]]
  for (const [y0, y1] of cards) {
    const prof = []
    for (let y = y0; y <= y1; y++) {
      let n = 0, x0 = 1e9, x1 = -1
      for (let x = 256; x <= 815; x++) {
        const c = I.at(x, y)
        if (!near(c, sc, 10)) { n++; if (x < x0) x0 = x; if (x > x1) x1 = x }
      }
      prof.push({ y, n, x0, x1 })
    }
    const bands = []; let b = null
    for (const r of prof) {
      if (r.n > 0) { if (!b) b = { y0: r.y, n: 0, x0: 1e9, x1: -1 }; b.y1 = r.y; b.n += r.n; b.x0 = Math.min(b.x0, r.x0); b.x1 = Math.max(b.x1, r.x1) }
      else if (b) { bands.push(b); b = null }
    }
    if (b) bands.push(b)
    const cl = []
    for (let i = 0; i + 1 < bands.length; i++) cl.push(bands[i + 1].y0 - bands[i].y1 - 1)
    console.log(`  CARD y${y0}..${y1} outer ${y1 - y0 + 1} inner ${y1 - y0 - 1} clears ${cl.join('/')}`)
    for (const r of bands) console.log(`    band y${r.y0}..${r.y1} h=${r.y1 - r.y0 + 1} x${r.x0}..${r.x1}`)
  }
  const F = [8, 12, 14], D = [25, 29, 31]
  let fill = 0, border = 0, other = 0
  const boxes = [[266, 805, 276, 292], [266, 805, 299, 315], [266, 805, 495, 511], [266, 805, 518, 534]]
  for (const [x0, x1, y0, y1] of boxes) {
    let f = 0, d = 0, o = 0
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const c = I.at(x, y)
      if (eq(c, F)) f++
      else if (eq(c, D)) d++
      else o++
    }
    fill += f; border += d; other += o
    console.log(`  row y${y0}..${y1} fill ${f} border ${d} other ${o} ground ${f + d}`)
  }
  console.log(`  TOTAL ground ${fill + border} fill ${fill} border ${border} other ${other}`)
}

console.log('\n===== 6 QUIET CONTROL SEAM =====')
{
  const S = decode(`${W11}/sidebar.png`)
  const C = decode(`${W11}/chat.png`)
  const railG = modal(S, 0, 247, 155, 185)
  const fieldFill = S.at(200, 130)
  const cardSurf = C.at(400, 220)
  const rowFill = C.at(700, 284)
  const rowBorder = C.at(700, 276)
  const rL = oklch(...railG).L
  const fL = oklch(...fieldFill).L
  const cL = oklch(...cardSurf).L
  const rfL = oklch(...rowFill).L
  const rbL = oklch(...rowBorder).L
  console.log(`  rail ground rgb(${railG}) L=${f4(rL)}`)
  console.log(`  field fill rgb(${fieldFill}) L=${f4(fL)} step ${(fL - rL >= 0 ? '+' : '') + f4(fL - rL)}`)
  console.log(`  card surface rgb(${cardSurf}) L=${f4(cL)}`)
  console.log(`  row fill rgb(${rowFill}) L=${f4(rfL)} step ${(rfL - cL >= 0 ? '+' : '') + f4(rfL - cL)}`)
  console.log(`  row border rgb(${rowBorder}) L=${f4(rbL)} step ${(rbL - cL >= 0 ? '+' : '') + f4(rbL - cL)}`)
  let firstCol = -1
  for (let x = 0; x < S.w; x++) if (near(S.at(x, 130), fieldFill, 3)) { firstCol = x; break }
  console.log(`  field mid left x${firstCol}`)
  let run = 0, best = 0
  for (let y = 116; y <= 143; y++) {
    let x0 = -1
    for (let x = 10; x <= 60; x++) if (near(S.at(x, y), fieldFill, 10)) { x0 = x; break }
    if (x0 === 16) { run++; if (run > best) best = run } else run = 0
  }
  console.log(`  field left straight at x16: ${best} of 28`)
  const GR = [11, 15, 17]
  let px0 = 1e9, px1 = -1, py0 = 1e9, py1 = -1
  for (let y = 116; y <= 143; y++) for (let x = 16; x <= 238; x++) {
    const c = S.at(x, y)
    if (!near(c, fieldFill, 8) && !near(c, GR, 8)) {
      if (x < px0) px0 = x; if (x > px1) px1 = x; if (y < py0) py0 = y; if (y > py1) py1 = y
    }
  }
  console.log(`  placeholder ink x${px0}..${px1} y${py0}..${py1} inset ${px0 - 16}`)
  const fill = [8, 12, 14]
  let lx = 1e9
  for (let x = 266; x <= 320; x++) {
    let n = 0
    for (let y = 280; y <= 287; y++) if (!near(C.at(x, y), fill, 12)) n++
    if (n) { lx = x; break }
  }
  console.log(`  row1 label ink start x${lx} vs prose 266 = +${lx - 266}`)
  const K = decode(`${W11}/commands-dock.png`)
  const cmdEdge = K.at(7, 80)
  const cO = oklch(...cmdEdge)
  console.log(`  command outline rgb(${cmdEdge}) L=${f4(cO.L)} dL=${f4(cO.L - rbL)}`)
}

console.log('\n===== 7 PATH =====')
{
  const S = decode(`${W11}/sidebar.png`)
  const T = decode(`${W11}/titlebar.png`)
  let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1, n = 0
  for (let y = 186; y <= 197; y++) for (let x = 0; x < 247; x++) {
    const [r, g, b] = S.at(x, y)
    if (r + g + b > 80) { n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
  }
  console.log(`  rail heading x${x0}..${x1} w${x1 - x0 + 1} y${y0}..${y1} px${n} of box 216 = ${((x1 - x0 + 1) / 216 * 100).toFixed(1)}%`)
  let a = 1e9, b = -1, c = 1e9, d = -1, m = 0
  for (let y = 10; y <= 38; y++) for (let x = 400; x <= 1000; x++) {
    const [r, g, bl] = T.at(x, y)
    if (r + g + bl > 80) { m++; if (x < a) a = x; if (x > b) b = x; if (y < c) c = y; if (y > d) d = y }
  }
  console.log(`  titlebar title x${a}..${b} w${b - a + 1} y${c}..${d}`)
}

console.log('\n===== 8 DATE DIVIDER =====')
{
  const I = decode(`${W11}/window-session-short.png`)
  const BD = [3, 6, 6]
  const on = (x, y, thr = 2) => {
    const [r, g, b] = I.at(x, y)
    return Math.abs(r - BD[0]) + Math.abs(g - BD[1]) + Math.abs(b - BD[2]) > thr
  }
  const COL_L = 464, COL_R = 1223
  let L = 1e9, R = -1, T = 1e9, B = -1, n = 0
  for (let y = 90; y <= 104; y++) {
    if (y === 96) continue
    for (let x = COL_L; x <= COL_R; x++) if (on(x, y, 6)) { n++; if (x < L) L = x; if (x > R) R = x; if (y < T) T = y; if (y > B) B = y }
  }
  const labMid = (L + R + 1) / 2
  const colMid = (COL_L + COL_R + 1) / 2
  console.log(`  label x${L}..${R} w=${R - L + 1} y${T}..${B} mid ${f2(labMid)} col ${f2(colMid)} debt ${f2(labMid - colMid)}`)
  const labelCols = new Set()
  for (let y = 90; y <= 104; y++) {
    if (y === 96) continue
    for (let x = COL_L; x <= COL_R; x++) if (on(x, y, 6)) labelCols.add(x)
  }
  const runs2 = []; let c2 = 0
  for (let x = COL_L; x <= COL_R; x++) {
    const lit = on(x, 96) && !labelCols.has(x)
    if (lit) c2++
    else { if (c2 > 0) runs2.push([x - c2, x - 1, c2]); c2 = 0 }
  }
  if (c2 > 0) runs2.push([COL_R - c2 + 1, COL_R, c2])
  const big = runs2.filter((r) => r[2] >= 100)
  if (big.length === 2) {
    console.log(`  rules ${big[0][2]} / ${big[1][2]} asym ${big[1][2] - big[0][2]}`)
    const g0 = big[0][1] + 1, g1 = big[1][0] - 1
    console.log(`  gap x${g0}..${g1} ${g1 - g0 + 1} mid ${f2((g0 + g1 + 1) / 2)}`)
  }
  const rowInk = (y) => { let k = 0; for (let x = 248; x <= 1439; x++) if (on(x, y)) k++; return k }
  let t = 96, btm = 96
  while (t > 48 && rowInk(t - 1) > 0) t--
  while (btm < 400 && rowInk(btm + 1) > 0) btm++
  let n0 = btm + 1
  while (n0 < 400 && rowInk(n0) === 0) n0++
  console.log(`  ink block y${t}..${btm} clear above ${t - 48} below ${n0 - btm - 1} nextInk y${n0}`)
}

console.log('\n===== 9 JOG =====')
{
  const PANE_L = 248, PANE_R = 1439
  const jobs = [
    ['SHORT', `${W11}/window-session-short.png`, null, null],
    ['OVERFLOW', `${W11}/window-session.png`, [60, 760], [775, 899]]
  ]
  for (const [tag, path, tBand, cBand] of jobs) {
    const I = decode(path)
    const tb = tBand || [60, I.h - 140], cb = cBand || [I.h - 125, I.h - 1]
    const bdT = modal(I, 255, 300, tb[0], tb[1]), bdC = modal(I, 255, 300, cb[0], cb[1])
    const bandRows = tb[1] - tb[0] + 1
    const occ = []
    for (let x = 1380; x <= PANE_R; x++) {
      let n = 0
      for (let y = tb[0]; y <= tb[1]; y++) {
        const c = I.at(x, y)
        if (Math.abs(c[0] - bdT[0]) + Math.abs(c[1] - bdT[1]) + Math.abs(c[2] - bdT[2]) > 2) n++
      }
      occ.push([x, n])
    }
    const sb = occ.filter(([, n]) => n > bandRows * 0.3)
    const sbLeft = sb.length ? sb[0][0] : PANE_R + 1
    let L = 1e9, R = -1
    for (let y = tb[0]; y <= tb[1]; y++) for (let x = PANE_L; x < sbLeft; x++) {
      const c = I.at(x, y)
      if (Math.abs(c[0] - bdT[0]) + Math.abs(c[1] - bdT[1]) + Math.abs(c[2] - bdT[2]) > 2) { if (x < L) L = x; if (x > R) R = x }
    }
    let L2 = 1e9, R2 = -1
    for (let y = cb[0]; y <= cb[1]; y++) for (let x = PANE_L; x <= PANE_R; x++) {
      const c = I.at(x, y)
      if (Math.abs(c[0] - bdC[0]) + Math.abs(c[1] - bdC[1]) + Math.abs(c[2] - bdC[2]) > 2) { if (x < L2) L2 = x; if (x > R2) R2 = x }
    }
    console.log(`  ${tag} transcript x${L}..${R} composer x${L2}..${R2} jog L ${L2 - L} R ${R2 - R} sb=${sb.length ? sb.map(([x]) => x).join(',') : 'ABSENT'}`)
  }
}

console.log('\n===== 10 MARKS vs wave 10 =====')
{
  const cmp = (f, box) => {
    const A = decode(`${W10}/${f}`)
    const B = decode(`${W11}/${f}`)
    const [x0, y0, x1, y1] = box
    let n = 0, t = 0, mint = 0
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const a = A.at(x, y), b = B.at(x, y)
      t++
      if (a[0] !== b[0] || a[1] !== b[1] || a[2] !== b[2]) n++
      const o = oklch(...b)
      if (o.C >= 0.05 && o.H >= 140 && o.H <= 200) mint++
    }
    return [n, t, mint]
  }
  console.log('  titlebar mark', cmp('titlebar.png', [14, 13, 35, 34]))
  console.log('  welcome mark', cmp('welcome.png', [513, 242, 556, 285]))
  console.log('  welcome-min entire', cmp('welcome-min-window.png', [0, 0, 639, 431]))
  console.log('  chat avatar1', cmp('chat.png', [211, 103, 238, 130]))
  console.log('  chat avatar2', cmp('chat.png', [211, 660, 238, 687]))
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
  const T = decode(`${W11}/titlebar.png`)
  const W = decode(`${W11}/welcome.png`)
  const C = decode(`${W11}/chat.png`)
  console.log('  titlebar bbox', bbox(T, 0, 80, 0, 47))
  console.log('  welcome bbox', bbox(W, 480, 600, 220, 300))
  console.log('  chat avatar1 bbox', bbox(C, 190, 260, 90, 150))
  console.log('  chat avatar2 bbox', bbox(C, 190, 260, 640, 700))
}
