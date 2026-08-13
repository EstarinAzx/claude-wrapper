// Wave 7 leg measurements. Read-only on the repo; written outside .gauntlet/scratch/
// on purpose, because the smoothing pass is live and reads that directory.
//
// Three builder predictions to check:
//   Titlebar : intervals paint 8.5 / 16.68 / 8.36, group right edge x273.5 (was x266)
//   Sidebar  : field ground ~13-15 RGB levels above the rail, y202 UNMOVED
//   Chat     : each disclosure row 28.0px tall x 540.0px wide, +11px per row
import { readFileSync } from 'node:fs'
import { inflateSync } from 'node:zlib'

const decode = (path) => {
  const buf = readFileSync(path)
  let off = 8, w = 0, h = 0, ct = 0, bd = 0
  const idat = []
  while (off < buf.length) {
    const len = buf.readUInt32BE(off)
    const t = buf.toString('ascii', off + 4, off + 8)
    const d = buf.subarray(off + 8, off + 8 + len)
    if (t === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); bd = d[8]; ct = d[9] }
    else if (t === 'IDAT') idat.push(d)
    else if (t === 'IEND') break
    off += 12 + len
  }
  if (bd !== 8) throw new Error(`bitDepth ${bd}`)
  const ch = ct === 6 ? 4 : 3
  const raw = inflateSync(Buffer.concat(idat))
  const stride = w * ch
  const px = Buffer.alloc(h * stride)
  let pos = 0
  for (let y = 0; y < h; y++) {
    const f = raw[pos++]
    const line = raw.subarray(pos, pos + stride); pos += stride
    const cur = px.subarray(y * stride, (y + 1) * stride)
    const prev = y > 0 ? px.subarray((y - 1) * stride, y * stride) : null
    for (let i = 0; i < stride; i++) {
      const a = i >= ch ? cur[i - ch] : 0
      const b = prev ? prev[i] : 0
      const c = prev && i >= ch ? prev[i - ch] : 0
      let v = line[i]
      if (f === 1) v += a
      else if (f === 2) v += b
      else if (f === 3) v += (a + b) >> 1
      else if (f === 4) {
        const p = a + b - c
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c
      }
      cur[i] = v & 0xff
    }
  }
  return { w, h, ch, px }
}

const at = (im, x, y) => {
  const i = (y * im.w + x) * im.ch
  return [im.px[i], im.px[i + 1], im.px[i + 2], im.ch === 4 ? im.px[i + 3] : 255]
}

const W6 = '.gauntlet/waves/core-after-docks/6'
const W7 = '.gauntlet/waves/core-after-docks/7'

// ── modal colour of a region, used as the local ground ────────────────────
const modal = (im, x0, y0, x1, y1) => {
  const counts = new Map()
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const k = at(im, x, y).join(',')
    counts.set(k, (counts.get(k) || 0) + 1)
  }
  let best = null, n = -1
  for (const [k, v] of counts) if (v > n) { n = v; best = k }
  return { rgba: best.split(',').map(Number), n, total: (x1 - x0 + 1) * (y1 - y0 + 1) }
}

// ── per-column ink: max channel deviation from a supplied ground ──────────
const inkColumns = (im, x0, x1, y0, y1, ground, thresh) => {
  const cols = []
  for (let x = x0; x <= x1; x++) {
    let m = 0
    for (let y = y0; y <= y1; y++) {
      const p = at(im, x, y)
      const d = Math.max(Math.abs(p[0] - ground[0]), Math.abs(p[1] - ground[1]), Math.abs(p[2] - ground[2]))
      if (d > m) m = d
    }
    cols.push(m >= thresh)
  }
  return cols
}

const runs = (cols, x0) => {
  const out = []
  let s = -1
  for (let i = 0; i < cols.length; i++) {
    if (cols[i] && s < 0) s = i
    else if (!cols[i] && s >= 0) { out.push([s + x0, i - 1 + x0]); s = -1 }
  }
  if (s >= 0) out.push([s + x0, cols.length - 1 + x0])
  return out
}

console.log('='.repeat(74))
console.log('1. TITLEBAR LEFT GROUP — painted intervals, wave 6 vs wave 7')
console.log('='.repeat(74))
for (const [tag, dir] of [['w6', W6], ['w7', W7]]) {
  const im = decode(`${dir}/titlebar.png`)
  const g = modal(im, 400, 4, 1000, 44).rgba
  const r = runs(inkColumns(im, 0, 340, 0, im.h - 1, g, 10), 0)
  // merge runs separated by <2px (antialias splits inside one glyph run)
  const merged = []
  for (const [a, b] of r) {
    if (merged.length && a - merged[merged.length - 1][1] <= 2) merged[merged.length - 1][1] = b
    else merged.push([a, b])
  }
  console.log(`\n${tag}  ground rgba=${g}  ink runs in x0..340:`)
  for (const [a, b] of merged) console.log(`     x${a}..${b}   (w=${b - a + 1})`)
  const gaps = []
  for (let i = 1; i < merged.length; i++) gaps.push(merged[i][0] - merged[i - 1][1] - 1)
  console.log(`  clearances between runs: ${gaps.join(' / ')}`)
  console.log(`  group right edge (last inked col): x${merged.length ? merged[merged.length - 1][1] : '-'}`)
}

console.log('\n' + '='.repeat(74))
console.log('2. TITLEBAR FLANK SYMMETRY — session title ink midpoint vs 720.00')
console.log('='.repeat(74))
for (const [tag, dir] of [['w6', W6], ['w7', W7]]) {
  const im = decode(`${dir}/titlebar.png`)
  const g = modal(im, 400, 4, 1000, 44).rgba
  const cols = inkColumns(im, 400, 1040, 0, im.h - 1, g, 10)
  const r = runs(cols, 400)
  if (!r.length) { console.log(`${tag}  no ink in x400..1040`); continue }
  const lo = r[0][0], hi = r[r.length - 1][1]
  console.log(`${tag}  title ink x${lo}..${hi}  midpoint ${((lo + hi) / 2).toFixed(2)}  displacement ${(((lo + hi) / 2) - 720).toFixed(2)}px`)
}

console.log('\n' + '='.repeat(74))
console.log('3. SIDEBAR — changed-pixel confinement (proves the y202 fence)')
console.log('='.repeat(74))
{
  const a = decode(`${W6}/sidebar.png`), b = decode(`${W7}/sidebar.png`)
  console.log(`  dims w6 ${a.w}x${a.h}   w7 ${b.w}x${b.h}`)
  let n = 0, minY = 1e9, maxY = -1, minX = 1e9, maxX = -1
  const rowCount = new Array(b.h).fill(0)
  for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) {
    const p = at(a, x, y), q = at(b, x, y)
    if (p[0] !== q[0] || p[1] !== q[1] || p[2] !== q[2] || p[3] !== q[3]) {
      n++; rowCount[y]++
      if (y < minY) minY = y; if (y > maxY) maxY = y
      if (x < minX) minX = x; if (x > maxX) maxX = x
    }
  }
  console.log(`  changed pixels: ${n}   bbox x${minX}..${maxX} y${minY}..${maxY}`)
  const firstBelow = rowCount.findIndex((c, i) => i > maxY && c > 0)
  console.log(`  any changed row below the band? ${firstBelow === -1 ? 'NO — everything below is byte-identical' : 'YES at y' + firstBelow}`)
  // the field ground vs the rail surface beside it
  const railG = modal(b, 200, 120, 240, 160).rgba
  console.log(`  rail surface modal (x200..240 y120..160): ${railG}`)
  const fieldG = modal(b, 30, minY + 6, 200, maxY - 6).rgba
  console.log(`  field modal inside band:                  ${fieldG}`)
  console.log(`  delta per channel: ${[0, 1, 2].map((i) => fieldG[i] - railG[i]).join(' / ')}`)
}

console.log('\n' + '='.repeat(74))
console.log('4. CHAT — changed-pixel map (tool card disclosure rows)')
console.log('='.repeat(74))
{
  const a = decode(`${W6}/chat.png`), b = decode(`${W7}/chat.png`)
  console.log(`  dims w6 ${a.w}x${a.h}   w7 ${b.w}x${b.h}`)
  let n = 0, minY = 1e9, maxY = -1, minX = 1e9, maxX = -1
  const rowCount = new Array(b.h).fill(0)
  for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) {
    const p = at(a, x, y), q = at(b, x, y)
    if (p[0] !== q[0] || p[1] !== q[1] || p[2] !== q[2] || p[3] !== q[3]) {
      n++; rowCount[y]++
      if (y < minY) minY = y; if (y > maxY) maxY = y
      if (x < minX) minX = x; if (x > maxX) maxX = x
    }
  }
  console.log(`  changed pixels: ${n}   bbox x${minX}..${maxX} y${minY}..${maxY}`)
  // contiguous bands of changed rows
  const bands = []
  let s = -1
  for (let y = 0; y < b.h; y++) {
    if (rowCount[y] > 0 && s < 0) s = y
    else if (rowCount[y] === 0 && s >= 0) { bands.push([s, y - 1]); s = -1 }
  }
  if (s >= 0) bands.push([s, b.h - 1])
  console.log(`  ${bands.length} contiguous changed-row band(s):`)
  for (const [p, q] of bands) console.log(`     y${p}..${q}  (h=${q - p + 1})`)
}

console.log('\n' + '='.repeat(74))
console.log('5. WINDOW-SESSION ATTRIBUTION — sum of the three surface totals')
console.log('='.repeat(74))
{
  const count = (f) => {
    const a = decode(`${W6}/${f}`), b = decode(`${W7}/${f}`)
    let n = 0
    for (let y = 0; y < Math.min(a.h, b.h); y++) for (let x = 0; x < Math.min(a.w, b.w); x++) {
      const p = at(a, x, y), q = at(b, x, y)
      if (p[0] !== q[0] || p[1] !== q[1] || p[2] !== q[2] || p[3] !== q[3]) n++
    }
    return n
  }
  const t = count('titlebar.png'), s = count('sidebar.png'), c = count('chat.png'), ws = count('window-session.png')
  console.log(`  titlebar.png ${t}  +  sidebar.png ${s}  +  chat.png ${c}  =  ${t + s + c}`)
  console.log(`  window-session.png                                       =  ${ws}`)
  console.log(`  REMAINDER = ${ws - (t + s + c)}`)
}
