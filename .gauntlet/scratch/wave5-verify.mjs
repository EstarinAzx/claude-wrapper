// Wave 5 leg instrument. Two jobs:
//
// (1) DECOMPOSE THE MARK-FINISH SPREAD wave 4 handed wave 5 as its Titlebar gap.
//     Wave 4 measured G stddev 5.00 (22px square) / 5.77 (44px plate) / 4.90
//     (28px disc) off ONE shared --mark-depth token and called it "three
//     finishes". But the measurement erodes a FIXED 2px from boxes of three
//     different sizes, so it samples 81.8% / 90.9% / 85.7% of the ramp. A linear
//     ramp's stddev scales with the sampled fraction, so some of that spread is
//     the instrument measuring three sizes with one absolute inset. This script
//     separates the two by sweeping the erosion and correcting for the span.
//
//     stddev of a linear ramp over rows [e, H-1-e], uniform row weights:
//         sd = range * (H - 2e)/H / sqrt(12)
//     so the implied full-box range is  sd * sqrt(12) * H/(H - 2e).
//     If the three sites agree on implied range, the ramp is identical and the
//     measured spread was the inset. Whatever residual survives is SHAPE — the
//     disc weights mid-ramp rows more heavily than a near-square does, which is
//     a real difference no correction removes.
//
// (2) BYTE-IDENTITY CONTROL, wave 4 -> wave 5, for whatever this wave lands.
//
// Erosion is a real morphological erode on the mint mask (a pixel survives only
// if every pixel within Chebyshev distance e is also mint), NOT a bounding-box
// inset. Wave 4 recorded why: a 4px bbox inset on a 22px mark truncates 18% of
// the ramp and reports ~20% low, which is how its first reading mis-attributed
// a shortfall to its own instrument.
import { readFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { inflateSync } from 'node:zlib'

const W4 = '.gauntlet/waves/core-after-docks/4'
const W5 = '.gauntlet/waves/core-after-docks/5'
const BAR = '.gauntlet/bar/identity'
const FILES = [
  'welcome.png', 'welcome-min-window.png', 'titlebar.png', 'sidebar.png', 'chat.png',
  'input-bar.png', 'window-welcome.png', 'window-session.png',
  'agents-dock.png', 'appearance-dock.png', 'commands-dock.png',
]

const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex').slice(0, 16)

// Minimal PNG decoder: 8-bit, non-interlaced, colorType 2 (RGB) or 6 (RGBA).
const decode = (path) => {
  const buf = readFileSync(path)
  let off = 8
  let w = 0, h = 0, colorType = 0, bitDepth = 0
  const idat = []
  while (off < buf.length) {
    const len = buf.readUInt32BE(off)
    const type = buf.toString('ascii', off + 4, off + 8)
    const data = buf.subarray(off + 8, off + 8 + len)
    if (type === 'IHDR') {
      w = data.readUInt32BE(0); h = data.readUInt32BE(4)
      bitDepth = data[8]; colorType = data[9]
      if (data[12] !== 0) throw new Error('interlaced PNG unsupported')
    } else if (type === 'IDAT') idat.push(data)
    else if (type === 'IEND') break
    off += 12 + len
  }
  if (bitDepth !== 8) throw new Error(`bitDepth ${bitDepth} unsupported`)
  const ch = colorType === 6 ? 4 : colorType === 2 ? 3 : (() => { throw new Error(`colorType ${colorType}`) })()
  const raw = inflateSync(Buffer.concat(idat))
  const stride = w * ch
  const px = Buffer.alloc(h * stride)
  let pos = 0
  for (let y = 0; y < h; y++) {
    const filter = raw[pos++]
    const line = raw.subarray(pos, pos + stride); pos += stride
    const cur = px.subarray(y * stride, (y + 1) * stride)
    const prev = y > 0 ? px.subarray((y - 1) * stride, y * stride) : null
    for (let i = 0; i < stride; i++) {
      const a = i >= ch ? cur[i - ch] : 0
      const b = prev ? prev[i] : 0
      const c = prev && i >= ch ? prev[i - ch] : 0
      let v = line[i]
      if (filter === 1) v += a
      else if (filter === 2) v += b
      else if (filter === 3) v += (a + b) >> 1
      else if (filter === 4) {
        const p = a + b - c
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c
      }
      cur[i] = v & 0xff
    }
  }
  return { w, h, ch, px }
}

// Same strict predicate wave 4 used, unchanged so the numbers stay comparable:
// mint is oklch(0.87 0.07 180) ~ RGB(140,230,217). Strict enough that the
// session row's chroma-11 fill cannot qualify.
const isMint = (r, g, b) => g > 175 && b > 165 && g - r > 40

const maskOf = ({ w, h, ch, px }) => {
  const m = new Uint8Array(w * h)
  for (let i = 0, p = 0; i < w * h; i++, p += ch) {
    if (isMint(px[p], px[p + 1], px[p + 2])) m[i] = 1
  }
  return m
}

// Connected components on a mask, 4-neighbour, iterative flood fill.
const clusters = (mask, w, h, min = 60) => {
  const seen = new Uint8Array(w * h)
  const out = []
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const id = y * w + x
      if (seen[id] || !mask[id]) { seen[id] = 1; continue }
      const stack = [id]; seen[id] = 1
      const pts = []
      while (stack.length) {
        const cur = stack.pop()
        const cx = cur % w, cy = (cur - cx) / w
        pts.push(cur)
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = cx + dx, ny = cy + dy
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
          const nid = ny * w + nx
          if (seen[nid]) continue
          seen[nid] = 1
          if (mask[nid]) stack.push(nid)
        }
      }
      if (pts.length < min) continue
      let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1
      for (const id2 of pts) {
        const cx = id2 % w, cy = (id2 - cx) / w
        if (cx < x0) x0 = cx; if (cx > x1) x1 = cx
        if (cy < y0) y0 = cy; if (cy > y1) y1 = cy
      }
      out.push({ x0, y0, x1, y1, pts })
    }
  }
  return out
}

// TRUE morphological erosion by Chebyshev radius e, restricted to one cluster.
const erodeCluster = (mask, w, h, c, e) => {
  const inC = new Set(c.pts)
  const kept = []
  for (const id of c.pts) {
    const cx = id % w, cy = (id - cx) / w
    let ok = true
    for (let dy = -e; dy <= e && ok; dy++) {
      for (let dx = -e; dx <= e; dx++) {
        const nx = cx + dx, ny = cy + dy
        if (nx < 0 || ny < 0 || nx >= w || ny >= h || !mask[ny * w + nx]) { ok = false; break }
      }
    }
    if (ok) kept.push(id)
  }
  return kept
}

const stats = ({ w, ch, px }, ids) => {
  if (ids.length < 8) return null
  const acc = [[], [], []]
  const rows = new Map()
  for (const id of ids) {
    const cx = id % w, cy = (id - cx) / w
    const p = (cy * w + cx) * ch
    acc[0].push(px[p]); acc[1].push(px[p + 1]); acc[2].push(px[p + 2])
    if (!rows.has(cy)) rows.set(cy, [])
    rows.get(cy).push(px[p + 1])
  }
  const sdOf = (v) => {
    const m = v.reduce((a, b) => a + b, 0) / v.length
    return Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / v.length)
  }
  const ys = [...rows.keys()].sort((a, b) => a - b)
  // Per-row mean G, then the stddev of THOSE — unweighted by row width, so the
  // shape's row-weighting drops out and only the ramp's span survives.
  const rowMeans = ys.map((y) => rows.get(y).reduce((a, b) => a + b, 0) / rows.get(y).length)
  const widest = Math.max(...ys.map((y) => rows.get(y).length))
  return {
    sd: acc.map((v) => +sdOf(v).toFixed(2)),
    sdRowUnweighted: +sdOf(rowMeans).toFixed(2),
    rows: ys.length,
    n: ids.length,
    endFrac: +(((rows.get(ys[0]).length + rows.get(ys[ys.length - 1]).length) / 2) / widest).toFixed(3),
  }
}

const SQRT12 = Math.sqrt(12)

const report = (label, img, mask, c, boxH) => {
  console.log(`\n  ${label}  box ${c.x1 - c.x0 + 1}x${c.y1 - c.y0 + 1} at x${c.x0}..${c.x1} y${c.y0}..${c.y1}`)
  console.log('    erode  n     rows  endFrac  sdRGB                    sdRowUnwt  spanFrac  impliedRange')
  for (const e of [0, 1, 2, 3]) {
    const ids = erodeCluster(mask, img.w, img.h, c, e)
    const st = stats(img, ids)
    if (!st) { console.log(`    ${String(e).padEnd(6)} (eroded away)`); continue }
    // Fraction of the box's vertical ramp the surviving rows span.
    const spanFrac = st.rows / boxH
    const implied = st.sdRowUnweighted * SQRT12 / spanFrac
    console.log(
      `    ${String(e).padEnd(6)} ${String(st.n).padEnd(5)} ${String(st.rows).padEnd(5)} ` +
      `${String(st.endFrac).padEnd(8)} ${JSON.stringify(st.sd).padEnd(24)} ` +
      `${String(st.sdRowUnweighted).padEnd(10)} ${spanFrac.toFixed(3).padEnd(9)} ${implied.toFixed(2)}`
    )
  }
}

const wave = process.argv[2] === '5' ? W5 : W4
console.log(`=== MARK FINISH DECOMPOSITION — captures under ${wave} ===`)
console.log('    Question: is the 5.00 / 5.77 / 4.90 spread the MARK, or a fixed 2px erosion applied to')
console.log('    22px / 44px / 28px boxes? sdRowUnweighted removes the shape weighting; impliedRange')
console.log('    corrects for the sampled span. Agreement across sites => the ramp is identical and the')
console.log('    spread was the instrument. Residual on the disc => real shape effect.')

// SELECT BY GEOMETRY, NOT BY PIXEL COUNT. The largest mint cluster in
// titlebar.png is the backend pill (58x21), not the 22px mark — picking the
// biggest blob measured the wrong object entirely on the first run.
const SITES = [
  ['titlebar.png', '.logo-mark 22px square', 22],
  ['welcome.png', '.welcome-mark 44px plate', 44],
  ['chat.png', '.avatar 28px disc', 28],
]
const nearSquareOf = (cs, size, tol = 3) => cs.filter((c) => {
  const w = c.x1 - c.x0 + 1, h = c.y1 - c.y0 + 1
  return Math.abs(w - h) <= 2 && Math.abs(w - size) <= tol
})
for (const [f, label, size] of SITES) {
  const p = `${wave}/${f}`
  if (!existsSync(p)) { console.log(`\n  ${label}: ${p} MISSING`); continue }
  const img = decode(p)
  const mask = maskOf(img)
  const all = clusters(mask, img.w, img.h)
  const hits = nearSquareOf(all, size)
  if (!hits.length) {
    console.log(`\n  ${label}: no ${size}x${size} cluster found in ${f}; boxes present: ` +
      all.map((c) => `${c.x1 - c.x0 + 1}x${c.y1 - c.y0 + 1}`).join(' '))
    continue
  }
  for (const c of hits) report(label, img, mask, c, c.y1 - c.y0 + 1)
}

console.log('\n=== THE SAME METHOD ON THE IDENTITY REFERENCE (the floor being matched) ===')
if (existsSync(`${BAR}/frost-mono-reference.png`)) {
  const img = decode(`${BAR}/frost-mono-reference.png`)
  const mask = maskOf(img)
  const cs = clusters(mask, img.w, img.h, 200).sort((a, b) => b.pts.length - a.pts.length)
  for (const c of cs.slice(0, 3)) report('reference mark', img, mask, c, c.y1 - c.y0 + 1)
} else {
  console.log('  frost-mono-reference.png not found — skipped')
}

if (process.argv[2] === '5') {
  console.log('\n=== BYTE-IDENTITY CONTROL, wave 4 -> wave 5 ===')
  for (const f of FILES) {
    const a = `${W4}/${f}`, b = `${W5}/${f}`
    if (!existsSync(a) || !existsSync(b)) { console.log(`  ${f.padEnd(26)} MISSING`); continue }
    console.log(`  ${f.padEnd(26)} ${sha(a) === sha(b) ? 'same' : 'CHANGED'}`)
  }
}
