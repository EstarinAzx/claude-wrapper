// CORRECTED left-edge probe. The previous one differenced against the modal
// colour, but the rail paints a continuous ground so every scanline read as
// ink and the whole rail collapsed to one band. Threshold on TEXT BRIGHTNESS
// instead: glyphs on this rail are far lighter than any ground.
import { decode, W, fmt } from './lib.mjs'

for (const wv of [4, 5]) {
  const d = decode(`${W(wv)}/sidebar.png`)
  console.log(`\n===== WAVE ${wv} sidebar.png ${d.w}x${d.h} =====`)
  for (const THR of [70]) {
    const light = (x, y) => { const o = (y * d.w + x) * 4; return d.data[o] > THR && d.data[o + 1] > THR && d.data[o + 2] > THR }
    const bands = []; let cur = null
    for (let y = 0; y < d.h; y++) {
      let n = 0, l = -1, r = -1
      for (let x = 0; x < d.w; x++) if (light(x, y)) { n++; if (l < 0) l = x; r = x }
      if (n > 0) { if (!cur) cur = { y0: y, y1: y, l, r, n } ; else { cur.y1 = y; cur.l = Math.min(cur.l, l); cur.r = Math.max(cur.r, r); cur.n += n } }
      else { if (cur) { bands.push(cur); cur = null } }
    }
    if (cur) bands.push(cur)
    console.log(`  text bands (R,G,B all > ${THR}): ${bands.length}`)
    for (const b of bands) console.log(`    y${String(b.y0).padStart(3)}..${String(b.y1).padEnd(3)} h=${String(b.y1 - b.y0 + 1).padStart(2)}  x${String(b.l).padStart(3)}..${String(b.r).padEnd(3)}  px=${b.n}`)
    const hist = new Map()
    for (const b of bands) hist.set(b.l, (hist.get(b.l) || 0) + 1)
    console.log(`  LEFTMOST-INK HISTOGRAM: ${[...hist.entries()].sort((p, q) => q[1] - p[1]).map(([x, n]) => `x${x}:${n}`).join('  ')}`)
  }
}
