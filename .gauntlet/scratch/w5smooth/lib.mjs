// Wave 5 smoothing pass — shared instrument.
// Own PNG decoder (8-bit, non-interlaced, colorType 2/6), OKLCH conversion,
// and the geometry helpers. No image library dependency added.
import { readFileSync } from 'node:fs'
import { inflateSync } from 'node:zlib'

export const W = (n) => `.gauntlet/waves/core-after-docks/${n}`
export const BAR = '.gauntlet/bar/identity'

export function decode(path) {
  const buf = readFileSync(path)
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG: ' + path)
  let off = 8, w = 0, h = 0, ct = 0, bd = 0
  const idat = []
  while (off < buf.length) {
    const len = buf.readUInt32BE(off)
    const type = buf.toString('ascii', off + 4, off + 8)
    const data = buf.subarray(off + 8, off + 8 + len)
    if (type === 'IHDR') {
      w = data.readUInt32BE(0); h = data.readUInt32BE(4)
      bd = data[8]; ct = data[9]
      if (data[12] !== 0) throw new Error('interlaced unsupported')
    } else if (type === 'IDAT') idat.push(data)
    else if (type === 'IEND') break
    off += 12 + len
  }
  if (bd !== 8) throw new Error('bitDepth ' + bd)
  const ch = ct === 6 ? 4 : ct === 2 ? 3 : ct === 0 ? 1 : ct === 4 ? 2 : -1
  if (ch < 0) throw new Error('colorType ' + ct)
  const raw = inflateSync(Buffer.concat(idat))
  const stride = w * ch
  const out = Buffer.alloc(w * h * 4)
  let prev = Buffer.alloc(stride)
  let p = 0
  for (let y = 0; y < h; y++) {
    const ft = raw[p++]
    const line = Buffer.from(raw.subarray(p, p + stride)); p += stride
    for (let i = 0; i < stride; i++) {
      const a = i >= ch ? line[i - ch] : 0
      const b = prev[i]
      const c = i >= ch ? prev[i - ch] : 0
      let v = line[i]
      if (ft === 1) v += a
      else if (ft === 2) v += b
      else if (ft === 3) v += (a + b) >> 1
      else if (ft === 4) {
        const pp = a + b - c
        const pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c)
        v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c)
      }
      line[i] = v & 255
    }
    for (let x = 0; x < w; x++) {
      const s = x * ch, d = (y * w + x) * 4
      if (ch >= 3) { out[d] = line[s]; out[d + 1] = line[s + 1]; out[d + 2] = line[s + 2]; out[d + 3] = ch === 4 ? line[s + 3] : 255 }
      else { out[d] = out[d + 1] = out[d + 2] = line[s]; out[d + 3] = ch === 2 ? line[s + 1] : 255 }
    }
    prev = line
  }
  return { w, h, data: out, px: (x, y) => { const d = (y * w + x) * 4; return [out[d], out[d + 1], out[d + 2], out[d + 3]] } }
}

// ---- colour ----
const srgbToLin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4) }

export function oklch(r, g, b) {
  const R = srgbToLin(r), G = srgbToLin(g), B = srgbToLin(b)
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B)
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B)
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B)
  const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s
  const A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s
  const Bb = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
  const C = Math.hypot(A, Bb)
  let H = Math.atan2(Bb, A) * 180 / Math.PI
  if (H < 0) H += 360
  return { L, C, H }
}

export function hsl(r, g, b) {
  const R = r / 255, G = g / 255, B = b / 255
  const mx = Math.max(R, G, B), mn = Math.min(R, G, B), d = mx - mn
  let h = 0
  if (d) {
    if (mx === R) h = ((G - B) / d) % 6
    else if (mx === G) h = (B - R) / d + 2
    else h = (R - G) / d + 4
    h *= 60; if (h < 0) h += 360
  }
  const l = (mx + mn) / 2
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))
  return { h, s: s * 100, l: l * 100 }
}

// ---- diff ----
export function diff(a, b) {
  if (a.w !== b.w || a.h !== b.h) throw new Error(`size mismatch ${a.w}x${a.h} vs ${b.w}x${b.h}`)
  const pts = []
  for (let y = 0; y < a.h; y++) for (let x = 0; x < a.w; x++) {
    const d = (y * a.w + x) * 4
    if (a.data[d] !== b.data[d] || a.data[d + 1] !== b.data[d + 1] || a.data[d + 2] !== b.data[d + 2] || a.data[d + 3] !== b.data[d + 3]) pts.push([x, y])
  }
  return pts
}

export function bbox(pts) {
  if (!pts.length) return null
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1
  for (const [x, y] of pts) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
  return { x0, y0, x1, y1, w: x1 - x0 + 1, h: y1 - y0 + 1, n: pts.length }
}

// connected components (8-neighbour) over a point list
export function clusters(pts) {
  const key = (x, y) => x * 100000 + y
  const set = new Set(pts.map(([x, y]) => key(x, y)))
  const seen = new Set()
  const out = []
  for (const [sx, sy] of pts) {
    if (seen.has(key(sx, sy))) continue
    const stack = [[sx, sy]], comp = []
    seen.add(key(sx, sy))
    while (stack.length) {
      const [x, y] = stack.pop(); comp.push([x, y])
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue
        const nx = x + dx, ny = y + dy, k = key(nx, ny)
        if (set.has(k) && !seen.has(k)) { seen.add(k); stack.push([nx, ny]) }
      }
    }
    out.push(comp)
  }
  return out
}

export const fmt = (n, d = 2) => Number(n).toFixed(d)
