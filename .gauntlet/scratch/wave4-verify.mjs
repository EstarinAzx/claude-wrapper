// Wave 4 leg verification: (1) byte-identity controls against wave 3, (2) the
// mark-depth pin — interior stddev at every mint cluster on the three surfaces
// the identity mark paints. (2) exists because jsdom loads no CSS and no gui
// driver measures a mark interior, so this is the only pin the change has.
import { readFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { inflateSync } from 'node:zlib'

const W3 = '.gauntlet/waves/core-after-docks/3'
const W4 = '.gauntlet/waves/core-after-docks/4'
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

// Mint is oklch(0.87 0.07 180) — roughly RGB(140,230,217): green and blue both
// high, red well below them. Strict enough that the session row's chroma-11
// fill (which a previous pass caught miscounting) cannot qualify.
const isMint = (r, g, b) => g > 175 && b > 165 && g - r > 40

// Connected components on the mint mask, 4-neighbour, iterative flood fill.
const clusters = ({ w, h, ch, px }) => {
  const seen = new Uint8Array(w * h)
  const out = []
  const at = (x, y) => {
    const i = (y * w + x) * ch
    return [px[i], px[i + 1], px[i + 2]]
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const id = y * w + x
      if (seen[id]) continue
      const [r, g, b] = at(x, y)
      if (!isMint(r, g, b)) { seen[id] = 1; continue }
      const stack = [id]; seen[id] = 1
      const pts = []
      while (stack.length) {
        const cur = stack.pop()
        const cx = cur % w, cy = (cur - cx) / w
        pts.push([cx, cy])
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = cx + dx, ny = cy + dy
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
          const nid = ny * w + nx
          if (seen[nid]) continue
          const [rr, gg, bb] = at(nx, ny)
          seen[nid] = 1
          if (isMint(rr, gg, bb)) stack.push(nid)
        }
      }
      if (pts.length < 60) continue
      let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1
      for (const [cx, cy] of pts) {
        if (cx < x0) x0 = cx; if (cx > x1) x1 = cx
        if (cy < y0) y0 = cy; if (cy > y1) y1 = cy
      }
      out.push({ x0, y0, x1, y1, count: pts.length })
    }
  }
  return out
}

// Interior stddev per channel, eroded 4px so the antialiasing ring cannot
// contribute — the ring is what inflated a previous pass's radius estimates.
const interiorStats = ({ w, ch, px }, c, inset = 4) => {
  const xs = c.x0 + inset, xe = c.x1 - inset, ys = c.y0 + inset, ye = c.y1 - inset
  if (xe <= xs || ye <= ys) return null
  const acc = [[], [], []]
  for (let y = ys; y <= ye; y++) {
    for (let x = xs; x <= xe; x++) {
      const i = (y * w + x) * ch
      acc[0].push(px[i]); acc[1].push(px[i + 1]); acc[2].push(px[i + 2])
    }
  }
  const sd = acc.map((v) => {
    const m = v.reduce((a, b) => a + b, 0) / v.length
    return Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / v.length)
  })
  const topRow = []; const botRow = []
  for (let x = xs; x <= xe; x++) {
    topRow.push(px[(ys * w + x) * ch + 1])
    botRow.push(px[(ye * w + x) * ch + 1])
  }
  const avg = (v) => v.reduce((a, b) => a + b, 0) / v.length
  return {
    sd: sd.map((v) => +v.toFixed(2)),
    topG: +avg(topRow).toFixed(1),
    botG: +avg(botRow).toFixed(1),
    ratio: +(avg(botRow) / avg(topRow)).toFixed(4),
    n: acc[0].length,
  }
}

console.log('=== BYTE-IDENTITY CONTROL, wave 3 -> wave 4 ===')
const EXPECT_SAME = new Set(['sidebar.png', 'input-bar.png', 'agents-dock.png', 'appearance-dock.png', 'commands-dock.png'])
for (const f of FILES) {
  const a = `${W3}/${f}`, b = `${W4}/${f}`
  if (!existsSync(a) || !existsSync(b)) { console.log(`  ${f.padEnd(26)} MISSING`); continue }
  const same = sha(a) === sha(b)
  const want = EXPECT_SAME.has(f) ? 'same' : 'changed'
  const got = same ? 'same' : 'changed'
  console.log(`  ${f.padEnd(26)} ${got.padEnd(8)} expected ${want.padEnd(8)} ${got === want ? 'OK' : '<<< MISMATCH'}`)
}

console.log('\n=== MARK DEPTH: interior stddev at every mint cluster ===')
console.log('    predicted 6.41 from a 0 -> 0.1 black ramp; reference band 3.65-9.40; wave 1 measured 0.00 / 0.05 / 0.09')
for (const f of ['titlebar.png', 'welcome.png', 'chat.png']) {
  const img = decode(`${W4}/${f}`)
  console.log(`\n  ${f} (${img.w}x${img.h}, ch=${img.ch})`)
  const cs = clusters(img).sort((a, b) => b.count - a.count)
  for (const c of cs) {
    const box = `${c.x1 - c.x0 + 1}x${c.y1 - c.y0 + 1} at x${c.x0}..${c.x1} y${c.y0}..${c.y1}`
    const st = interiorStats(img, c)
    if (!st) { console.log(`    ${box.padEnd(38)} count=${c.count} (too small to sample interior)`); continue }
    console.log(`    ${box.padEnd(38)} count=${c.count} sdRGB=${JSON.stringify(st.sd)} topG=${st.topG} botG=${st.botG} bot/top=${st.ratio} n=${st.n}`)
  }
}
