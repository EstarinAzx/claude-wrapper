// Minimal PNG decoder: 8-bit RGB/RGBA/gray, no interlace. Returns {w,h,ch,data}
// data is Uint8Array of w*h*4 RGBA.
import fs from 'node:fs'
import zlib from 'node:zlib'

export function decode(file) {
  const buf = fs.readFileSync(file)
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not png: ' + file)
  let p = 8
  let w = 0, h = 0, bitDepth = 0, colorType = 0, interlace = 0
  const idat = []
  let plte = null, trns = null
  while (p < buf.length) {
    const len = buf.readUInt32BE(p)
    const type = buf.toString('ascii', p + 4, p + 8)
    const dataStart = p + 8
    if (type === 'IHDR') {
      w = buf.readUInt32BE(dataStart)
      h = buf.readUInt32BE(dataStart + 4)
      bitDepth = buf[dataStart + 8]
      colorType = buf[dataStart + 9]
      interlace = buf[dataStart + 12]
    } else if (type === 'IDAT') {
      idat.push(buf.subarray(dataStart, dataStart + len))
    } else if (type === 'PLTE') {
      plte = buf.subarray(dataStart, dataStart + len)
    } else if (type === 'tRNS') {
      trns = buf.subarray(dataStart, dataStart + len)
    } else if (type === 'IEND') break
    p = dataStart + len + 4
  }
  if (bitDepth !== 8) throw new Error('bitDepth ' + bitDepth + ' unsupported')
  if (interlace !== 0) throw new Error('interlaced unsupported')
  const chIn = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType]
  if (!chIn) throw new Error('colorType ' + colorType)
  const raw = zlib.inflateSync(Buffer.concat(idat))
  const stride = w * chIn
  const out = new Uint8Array(w * h * 4)
  const prev = new Uint8Array(stride)
  const cur = new Uint8Array(stride)
  let rp = 0
  for (let y = 0; y < h; y++) {
    const filter = raw[rp++]
    for (let i = 0; i < stride; i++) cur[i] = raw[rp + i]
    rp += stride
    const bpp = chIn
    switch (filter) {
      case 0: break
      case 1: for (let i = bpp; i < stride; i++) cur[i] = (cur[i] + cur[i - bpp]) & 255; break
      case 2: for (let i = 0; i < stride; i++) cur[i] = (cur[i] + prev[i]) & 255; break
      case 3: for (let i = 0; i < stride; i++) { const a = i >= bpp ? cur[i - bpp] : 0; cur[i] = (cur[i] + ((a + prev[i]) >> 1)) & 255 } break
      case 4: for (let i = 0; i < stride; i++) {
          const a = i >= bpp ? cur[i - bpp] : 0, b = prev[i], c = i >= bpp ? prev[i - bpp] : 0
          const pp = a + b - c
          const pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c)
          const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c
          cur[i] = (cur[i] + pr) & 255
        } break
      default: throw new Error('filter ' + filter)
    }
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4
      if (colorType === 6) { out[o] = cur[x*4]; out[o+1] = cur[x*4+1]; out[o+2] = cur[x*4+2]; out[o+3] = cur[x*4+3] }
      else if (colorType === 2) { out[o] = cur[x*3]; out[o+1] = cur[x*3+1]; out[o+2] = cur[x*3+2]; out[o+3] = 255 }
      else if (colorType === 0) { const g = cur[x]; out[o]=g; out[o+1]=g; out[o+2]=g; out[o+3]=255 }
      else if (colorType === 4) { const g = cur[x*2]; out[o]=g; out[o+1]=g; out[o+2]=g; out[o+3]=cur[x*2+1] }
      else if (colorType === 3) { const i = cur[x]*3; out[o]=plte[i]; out[o+1]=plte[i+1]; out[o+2]=plte[i+2]; out[o+3]= trns && trns[cur[x]]!==undefined ? trns[cur[x]] : 255 }
    }
    prev.set(cur)
  }
  return { w, h, colorType, data: out }
}
