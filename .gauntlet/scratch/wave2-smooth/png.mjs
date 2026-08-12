// SCRATCH (wave 2 smoothing pass). Disposable. Minimal PNG decoder -> RGBA.
// No deps beyond node:zlib. Handles colour types 2 (RGB) and 6 (RGBA), 8-bit,
// non-interlaced -- which is everything Electron's captureScreenshot emits.
import fs from 'node:fs'
import zlib from 'node:zlib'

export function decode(file) {
  const buf = fs.readFileSync(file)
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a png: ' + file)
  let off = 8
  let w = 0, h = 0, bitDepth = 0, colorType = 0, interlace = 0
  const idat = []
  while (off < buf.length) {
    const len = buf.readUInt32BE(off)
    const type = buf.toString('ascii', off + 4, off + 8)
    const data = buf.subarray(off + 8, off + 8 + len)
    if (type === 'IHDR') {
      w = data.readUInt32BE(0); h = data.readUInt32BE(4)
      bitDepth = data[8]; colorType = data[9]; interlace = data[12]
    } else if (type === 'IDAT') idat.push(data)
    else if (type === 'IEND') break
    off += 12 + len
  }
  if (bitDepth !== 8) throw new Error('bitDepth ' + bitDepth)
  if (interlace !== 0) throw new Error('interlaced')
  const ch = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 0 ? 1 : null
  if (!ch) throw new Error('colorType ' + colorType)
  const raw = zlib.inflateSync(Buffer.concat(idat))
  const stride = w * ch
  const out = Buffer.alloc(w * h * 4)
  let prev = Buffer.alloc(stride)
  for (let y = 0; y < h; y++) {
    const ft = raw[y * (stride + 1)]
    const line = Buffer.from(raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride))
    for (let i = 0; i < stride; i++) {
      const a = i >= ch ? line[i - ch] : 0
      const b = prev[i]
      const c = i >= ch ? prev[i - ch] : 0
      let v = line[i]
      if (ft === 1) v += a
      else if (ft === 2) v += b
      else if (ft === 3) v += (a + b) >> 1
      else if (ft === 4) {
        const p = a + b - c
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c
      }
      line[i] = v & 0xff
    }
    prev = line
    for (let x = 0; x < w; x++) {
      const s = x * ch, d = (y * w + x) * 4
      if (ch === 1) { out[d] = out[d + 1] = out[d + 2] = line[s]; out[d + 3] = 255 }
      else { out[d] = line[s]; out[d + 1] = line[s + 1]; out[d + 2] = line[s + 2]; out[d + 3] = ch === 4 ? line[s + 3] : 255 }
    }
  }
  return { w, h, data: out, colorType }
}

export const px = (img, x, y) => {
  const d = (y * img.w + x) * 4
  return [img.data[d], img.data[d + 1], img.data[d + 2], img.data[d + 3]]
}
export const hex = (p) => '#' + p.slice(0, 3).map((v) => v.toString(16).padStart(2, '0')).join('')
// Perceptual-ish luminance on the straight (un-composited) RGB.
export const lum = (p) => 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]
