// Wave 5 attribution. Diffs every capture wave 4 -> wave 5, groups the changed
// pixels into connected components, and prints each component's bounding box.
//
// The last two waves closed at ZERO REMAINDER — every changed pixel in a
// composite frame attributable to exactly one named target. This wave is harder
// and the discipline is correspondingly more valuable, because FOUR things
// changed rather than one:
//
//   1. composer.css  .input-bar padding      -> the composer column shifts 5px left
//   2. rails.css     seven pre-list values   -> the rail's stack compresses ~23px
//   3. rails.css     --r-bubble on dock rows -> THE THREE DOCK CAPTURES MOVE, first
//                                               time in the run, and the prediction
//                                               is CORNER BANDS ONLY
//   4. tokens.css                            -> REVERTED. The marks must be
//                                               byte-identical to wave 4.
//
// (4) is the sharpest control available: if any mark interior differs by a single
// pixel, the revert leaked.
import { readFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { inflateSync } from 'node:zlib'

const A_DIR = '.gauntlet/waves/core-after-docks/4'
const B_DIR = '.gauntlet/waves/core-after-docks/5'
const FILES = [
  'welcome.png', 'welcome-min-window.png', 'titlebar.png', 'sidebar.png', 'chat.png',
  'input-bar.png', 'window-welcome.png', 'window-session.png',
  'agents-dock.png', 'appearance-dock.png', 'commands-dock.png',
]

const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex').slice(0, 12)

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

// Components on the CHANGED mask, 8-neighbour so a diagonal antialiasing trail
// does not split one moved element into a shower of fragments.
const components = (mask, w, h) => {
  const seen = new Uint8Array(w * h)
  const out = []
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const id = y * w + x
    if (seen[id] || !mask[id]) { seen[id] = 1; continue }
    const stack = [id]; seen[id] = 1
    let x0 = x, y0 = y, x1 = x, y1 = y, n = 0
    while (stack.length) {
      const cur = stack.pop(); const cx = cur % w, cy = (cur - cx) / w
      n++
      if (cx < x0) x0 = cx; if (cx > x1) x1 = cx
      if (cy < y0) y0 = cy; if (cy > y1) y1 = cy
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = cx + dx, ny = cy + dy
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
        const nid = ny * w + nx
        if (seen[nid]) continue
        seen[nid] = 1
        if (mask[nid]) stack.push(nid)
      }
    }
    out.push({ x0, y0, x1, y1, n })
  }
  return out.sort((a, b) => b.n - a.n)
}

let grand = 0
for (const f of FILES) {
  const a = `${A_DIR}/${f}`, b = `${B_DIR}/${f}`
  if (!existsSync(a) || !existsSync(b)) { console.log(`\n${f.padEnd(26)} MISSING`); continue }
  if (sha(a) === sha(b)) { console.log(`\n${f.padEnd(26)} BYTE-IDENTICAL`); continue }
  const A = decode(a), B = decode(b)
  if (A.w !== B.w || A.h !== B.h) {
    console.log(`\n${f.padEnd(26)} DIMENSIONS CHANGED ${A.w}x${A.h} -> ${B.w}x${B.h}`)
    continue
  }
  const mask = new Uint8Array(A.w * A.h)
  let changed = 0
  for (let i = 0, p = 0; i < A.w * A.h; i++, p += A.ch) {
    if (A.px[p] !== B.px[p] || A.px[p + 1] !== B.px[p + 1] || A.px[p + 2] !== B.px[p + 2]) { mask[i] = 1; changed++ }
  }
  grand += changed
  const comps = components(mask, A.w, A.h)
  console.log(`\n${f.padEnd(26)} ${changed} px changed in ${comps.length} component(s)   [${A.w}x${A.h}]`)
  for (const c of comps.slice(0, 12)) {
    const cw = c.x1 - c.x0 + 1, chh = c.y1 - c.y0 + 1
    console.log(`    ${String(c.n).padStart(7)} px   ${String(cw).padStart(4)}x${String(chh).padEnd(4)} at x${c.x0}..${c.x1} y${c.y0}..${c.y1}`)
  }
  if (comps.length > 12) {
    const rest = comps.slice(12).reduce((s, c) => s + c.n, 0)
    console.log(`    ... ${comps.length - 12} smaller components, ${rest} px total`)
  }
}
console.log(`\nGRAND TOTAL changed pixels across all captures: ${grand}`)
