// Wave 5, pre-wave gap check. Wave 4 handed wave 5 a Titlebar gap that reads
// "one alpha yields G stddev 5.00 / 5.77 / 4.90, so the identity paints THREE
// finishes; make the three read as one." wave5-verify.mjs already showed the
// span-corrected, shape-neutral implied ramp range agrees across all three sites
// (22.8 / 23.4 / 23.2 against a theoretical 22.8 at alpha 0.1), which says the
// spread was the fixed 2px erosion meeting three different box sizes.
//
// This is the DIRECT test, and it does not depend on any correction I authored:
// dump each mark's per-row mean G against its NORMALISED position down the box.
// One ramp painted at three sizes must put all three sites on ONE curve, with
// the same top and bottom endpoints. Three finishes would show three curves.
//
// The endpoints are the claim that matters perceptually. A linear-gradient runs
// 0 -> 0.1 alpha across the box HEIGHT whatever that height is, so the top and
// bottom colours are identical at every size by construction, and only the RATE
// differs. Same endpoints = same treatment at a different scale, which is what
// "one shape at two sizes" is supposed to mean.
import { readFileSync } from 'node:fs'
import { inflateSync } from 'node:zlib'

const W4 = '.gauntlet/waves/core-after-docks/4'

const decode = (path) => {
  const buf = readFileSync(path)
  let off = 8, w = 0, h = 0, colorType = 0, bitDepth = 0
  const idat = []
  while (off < buf.length) {
    const len = buf.readUInt32BE(off)
    const type = buf.toString('ascii', off + 4, off + 8)
    const data = buf.subarray(off + 8, off + 8 + len)
    if (type === 'IHDR') {
      w = data.readUInt32BE(0); h = data.readUInt32BE(4)
      bitDepth = data[8]; colorType = data[9]
      if (data[12] !== 0) throw new Error('interlaced')
    } else if (type === 'IDAT') idat.push(data)
    else if (type === 'IEND') break
    off += 12 + len
  }
  if (bitDepth !== 8) throw new Error(`bitDepth ${bitDepth}`)
  const ch = colorType === 6 ? 4 : 3
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

const isMint = (r, g, b) => g > 175 && b > 165 && g - r > 40

// Sample only the mark's CENTRAL COLUMN BAND — the middle 40% of its width.
// That dodges the corner rounding entirely, so a disc and a rounded square are
// compared on the part of the shape where both are full-width, and no erosion
// or shape correction is needed for the comparison to be fair.
const profile = (img, box) => {
  const { x0, y0, x1, y1 } = box
  const w = x1 - x0 + 1, h = y1 - y0 + 1
  const cx = (x0 + x1) / 2, band = Math.max(2, Math.round(w * 0.2))
  const rows = []
  for (let y = y0; y <= y1; y++) {
    const vals = []
    for (let x = Math.round(cx - band); x <= Math.round(cx + band); x++) {
      const i = (y * img.w + x) * img.ch
      const [r, g, b] = [img.px[i], img.px[i + 1], img.px[i + 2]]
      if (isMint(r, g, b)) vals.push([r, g, b])
    }
    if (vals.length < 3) continue
    const mean = (k) => vals.reduce((a, v) => a + v[k], 0) / vals.length
    rows.push({ t: (y - y0) / (h - 1), r: mean(0), g: mean(1), b: mean(2), n: vals.length })
  }
  return rows
}

const findBox = (img, size, tol = 3) => {
  const { w, h, ch, px } = img
  const seen = new Uint8Array(w * h)
  const out = []
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const id = y * w + x
    if (seen[id]) continue
    const p = id * ch
    if (!isMint(px[p], px[p + 1], px[p + 2])) { seen[id] = 1; continue }
    const stack = [id]; seen[id] = 1
    let x0 = x, y0 = y, x1 = x, y1 = y, n = 0
    while (stack.length) {
      const cur = stack.pop(); const cxx = cur % w, cyy = (cur - cxx) / w
      n++
      if (cxx < x0) x0 = cxx; if (cxx > x1) x1 = cxx
      if (cyy < y0) y0 = cyy; if (cyy > y1) y1 = cyy
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cxx + dx, ny = cyy + dy
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
        const nid = ny * w + nx
        if (seen[nid]) continue
        seen[nid] = 1
        const np = nid * ch
        if (isMint(px[np], px[np + 1], px[np + 2])) stack.push(nid)
      }
    }
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1
    if (Math.abs(bw - bh) <= 2 && Math.abs(bw - size) <= tol && n > 60) out.push({ x0, y0, x1, y1 })
  }
  return out
}

const SITES = [
  ['titlebar.png', '.logo-mark  22px square', 22],
  ['welcome.png', '.welcome-mark 44px plate', 44],
  ['chat.png', '.avatar     28px disc  ', 28],
]

console.log('=== RAMP PROFILE: per-row mean RGB down each mark, central 40% column band ===')
console.log('    One --mark-depth token, three callers. If it paints ONE finish the three curves')
console.log('    coincide in t (normalised depth) and share endpoints. Rate differs with box height')
console.log('    by construction; endpoints must not.\n')

const summaries = []
for (const [f, label, size] of SITES) {
  const img = decode(`${W4}/${f}`)
  const boxes = findBox(img, size)
  if (!boxes.length) { console.log(`  ${label}: no ${size}px box found`); continue }
  const rows = profile(img, boxes[0])
  const top = rows[0], bot = rows[rows.length - 1]
  // Least-squares slope of G against t, over the interior rows only (drop the
  // first and last, which carry the antialiased rim).
  const inner = rows.slice(1, -1)
  const mt = inner.reduce((a, r) => a + r.t, 0) / inner.length
  const mg = inner.reduce((a, r) => a + r.g, 0) / inner.length
  const slope = inner.reduce((a, r) => a + (r.t - mt) * (r.g - mg), 0) /
                inner.reduce((a, r) => a + (r.t - mt) ** 2, 0)
  summaries.push({ label, rows: rows.length, top, bot, slope })
  console.log(`  ${label}  (${boxes.length} instance(s), box ${boxes[0].x1 - boxes[0].x0 + 1}px)`)
  const step = Math.max(1, Math.floor(rows.length / 8))
  for (let i = 0; i < rows.length; i += step) {
    const r = rows[i]
    console.log(`      t=${r.t.toFixed(2)}  RGB ${r.r.toFixed(1)} ${r.g.toFixed(1)} ${r.b.toFixed(1)}  (n=${r.n})`)
  }
  const r = rows[rows.length - 1]
  console.log(`      t=${r.t.toFixed(2)}  RGB ${r.r.toFixed(1)} ${r.g.toFixed(1)} ${r.b.toFixed(1)}  (n=${r.n})\n`)
}

console.log('=== ENDPOINTS AND SLOPE — the actual comparison ===')
console.log('  site                       topG    botG    dropG   slopeG(per full box)')
for (const s of summaries) {
  console.log(
    `  ${s.label}  ${s.top.g.toFixed(1).padStart(6)}  ${s.bot.g.toFixed(1).padStart(6)}  ` +
    `${(s.top.g - s.bot.g).toFixed(1).padStart(6)}  ${s.slope.toFixed(2).padStart(8)}`
  )
}
const drops = summaries.map((s) => s.top.g - s.bot.g)
const slopes = summaries.map((s) => s.slope)
const spread = (v) => `${Math.min(...v).toFixed(2)}..${Math.max(...v).toFixed(2)} (${((Math.max(...v) / Math.min(...v) - 1) * 100).toFixed(1)}% apart)`
console.log(`\n  drop  spread: ${spread(drops)}`)
console.log(`  slope spread: ${spread(slopes)}`)
