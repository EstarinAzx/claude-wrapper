// Wave 7 leg measurements, CORRECTED after two self-caught instrument errors:
//   (a) titlebar ink scan ran y0..47 and so caught the full-width bottom hairline
//       at y47, which inked every column and made the whole strip read as one run.
//       Corrected to y0..46.
//   (b) the "rail surface" reference region for the filter field overlapped the
//       field itself (x200..240 is inside a field that runs to x238), so the
//       comparison measured the field against itself and reported delta 0.
//       Corrected to a region well below the band.
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
const at = (im, x, y) => { const i = (y * im.w + x) * im.ch; return [im.px[i], im.px[i + 1], im.px[i + 2], im.ch === 4 ? im.px[i + 3] : 255] }
const modal = (im, x0, y0, x1, y1) => {
  const c = new Map()
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const k = at(im, x, y).join(','); c.set(k, (c.get(k) || 0) + 1) }
  let best = null, n = -1
  for (const [k, v] of c) if (v > n) { n = v; best = k }
  return { rgba: best.split(',').map(Number), share: n / ((x1 - x0 + 1) * (y1 - y0 + 1)) }
}
const inkCols = (im, x0, x1, y0, y1, g, th) => {
  const out = []
  for (let x = x0; x <= x1; x++) {
    let m = 0
    for (let y = y0; y <= y1; y++) {
      const p = at(im, x, y)
      const d = Math.max(Math.abs(p[0] - g[0]), Math.abs(p[1] - g[1]), Math.abs(p[2] - g[2]), Math.abs(p[3] - g[3]))
      if (d > m) m = d
    }
    out.push(m >= th)
  }
  return out
}
const runs = (cols, x0, mergeGap = 2) => {
  const r = []
  let s = -1
  for (let i = 0; i < cols.length; i++) {
    if (cols[i] && s < 0) s = i
    else if (!cols[i] && s >= 0) { r.push([s + x0, i - 1 + x0]); s = -1 }
  }
  if (s >= 0) r.push([s + x0, cols.length - 1 + x0])
  const m = []
  for (const [a, b] of r) {
    if (m.length && a - m[m.length - 1][1] - 1 <= mergeGap) m[m.length - 1][1] = b
    else m.push([a, b])
  }
  return m
}

const W6 = '.gauntlet/waves/core-after-docks/6', W7 = '.gauntlet/waves/core-after-docks/7'

console.log('='.repeat(76))
console.log('1. TITLEBAR LEFT GROUP — painted clearances (y0..46, hairline at y47 excluded)')
console.log('   builder predicted: 8.5 / 16.68 / 8.36 painted, group right edge x273.5')
console.log('='.repeat(76))
for (const [tag, dir] of [['w6', W6], ['w7', W7]]) {
  const im = decode(`${dir}/titlebar.png`)
  const g = modal(im, 400, 0, 1000, 46).rgba
  const m = runs(inkCols(im, 0, 360, 0, 46, g, 12), 0, 2)
  console.log(`\n${tag}  ground=${g}`)
  const names = ['mark', 'app name', 'pill 1', 'pill 2']
  m.forEach(([a, b], i) => console.log(`   ${(names[i] || 'run ' + i).padEnd(9)} x${a}..${b}  (w=${b - a + 1})`))
  const gaps = []
  for (let i = 1; i < m.length; i++) gaps.push(m[i][0] - m[i - 1][1] - 1)
  console.log(`   painted clearances: ${gaps.join(' / ')}`)
  console.log(`   group right edge:   x${m.length ? m[m.length - 1][1] : '-'}`)
  if (gaps.length === 3) console.log(`   break : tight ratio = ${(gaps[1] / ((gaps[0] + gaps[2]) / 2)).toFixed(3)}`)
}

console.log('\n' + '='.repeat(76))
console.log('2. TITLEBAR FLANK SYMMETRY — session title ink midpoint vs window centre 720.00')
console.log('='.repeat(76))
for (const [tag, dir] of [['w6', W6], ['w7', W7]]) {
  const im = decode(`${dir}/titlebar.png`)
  const g = modal(im, 400, 0, 1000, 46).rgba
  const m = runs(inkCols(im, 500, 940, 0, 46, g, 12), 500, 40)
  if (!m.length) { console.log(`${tag}  no title ink found`); continue }
  const lo = m[0][0], hi = m[m.length - 1][1]
  console.log(`${tag}  title ink x${lo}..${hi}  midpoint ${((lo + hi) / 2).toFixed(2)}  displacement ${(((lo + hi) / 2) - 720).toFixed(2)}px`)
}

console.log('\n' + '='.repeat(76))
console.log('3. SIDEBAR FILTER FIELD — ground step, reference taken clear of the band')
console.log('='.repeat(76))
{
  const b = decode(`${W7}/sidebar.png`), a = decode(`${W6}/sidebar.png`)
  const railBelow = modal(b, 20, 300, 230, 400)
  const railBefore = modal(a, 20, 116, 230, 143)
  const fieldNow = modal(b, 30, 122, 200, 137)
  console.log(`  rail surface, w7, x20..230 y300..400 (clear of band): ${railBelow.rgba}  share ${(railBelow.share * 100).toFixed(1)}%`)
  console.log(`  band area, WAVE 6, x20..230 y116..143:                ${railBefore.rgba}  share ${(railBefore.share * 100).toFixed(1)}%`)
  console.log(`  field, WAVE 7,     x30..200 y122..137:                ${fieldNow.rgba}  share ${(fieldNow.share * 100).toFixed(1)}%`)
  console.log(`  step vs wave-6 band ground: ${[0, 1, 2, 3].map((i) => fieldNow.rgba[i] - railBefore.rgba[i]).join(' / ')}  (RGB then alpha)`)
  // horizontal extent of the field at mid-height
  const g = railBefore.rgba
  const m = runs(inkCols(b, 0, b.w - 1, 128, 132, g, 3), 0, 1)
  console.log(`  field horizontal extent at y128..132: ${m.map(([p, q]) => 'x' + p + '..' + q).join(' , ')}`)
  // corner: how far in does the fill start on the top row vs mid row
  for (const y of [116, 117, 118, 120, 124, 130]) {
    const row = runs(inkCols(b, 0, b.w - 1, y, y, g, 3), 0, 1)
    console.log(`    y${y}: ${row.map(([p, q]) => 'x' + p + '..' + q).join(' , ') || '(none)'}`)
  }
}

console.log('\n' + '='.repeat(76))
console.log('4. CHAT — is the change a vertical TRANSLATION (bottom-anchored viewport)?')
console.log('='.repeat(76))
{
  const a = decode(`${W6}/chat.png`), b = decode(`${W7}/chat.png`)
  const rowSig = (im, y) => { let s = 0; for (let x = 0; x < im.w; x++) { const p = at(im, x, y); s = (s * 31 + p[0] + p[1] * 3 + p[2] * 7 + p[3] * 11) >>> 0 } return s }
  const sigA = [], sigB = []
  for (let y = 0; y < a.h; y++) sigA.push(rowSig(a, y))
  for (let y = 0; y < b.h; y++) sigB.push(rowSig(b, y))
  // for each candidate shift, count how many of wave 6's rows y in 0..400 reappear at y+shift
  let best = null
  for (let sh = -80; sh <= 80; sh++) {
    let hit = 0, tot = 0
    for (let y = 0; y < 400; y++) {
      const t = y + sh
      if (t < 0 || t >= b.h) continue
      tot++
      if (sigA[y] === sigB[t]) hit++
    }
    if (tot > 100 && (!best || hit > best.hit)) best = { sh, hit, tot }
  }
  console.log(`  best row-signature alignment of wave 6's y0..399 into wave 7: shift ${best.sh > 0 ? '+' : ''}${best.sh}px, ${best.hit}/${best.tot} rows matching exactly`)
  // where does the tail become identical
  let firstIdenticalFromBottom = b.h
  for (let y = b.h - 1; y >= 0; y--) { if (sigA[y] === sigB[y]) firstIdenticalFromBottom = y; else break }
  console.log(`  rows y${firstIdenticalFromBottom}..${b.h - 1} are byte-identical in place (the anchored tail)`)
}
