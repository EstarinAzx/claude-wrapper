// (a) THE 5px SEAM. Measure the transcript column edges and the composer pill
// edges in window-session.png, waves 4 and 5.
//
// INSTRUMENT NOTE, binding: displacement is read off the INK BOUNDING BOX, not
// the mass-weighted centroid. A left-registered block drags its centroid left
// of its bbox centre by a fixed amount that is a property of the composition,
// not a defect.
import { decode, W, fmt } from './lib.mjs'

const PANE = { x0: 248, x1: 1439, w: 1192 } // chat pane per inspect.log

function load(wv) { return decode(`${W(wv)}/window-session.png`) }

// Backdrop of the chat pane: modal colour along a known-empty column.
function backdrop(img, x, y0, y1) {
  const m = new Map()
  for (let y = y0; y <= y1; y++) { const [r, g, b] = img.px(x, y); const k = `${r},${g},${b}`; m.set(k, (m.get(k) || 0) + 1) }
  return [...m.entries()].sort((p, q) => q[1] - p[1])[0][0].split(',').map(Number)
}

// Horizontal extent of anything non-backdrop on scanline y within the pane.
function extent(img, y, bd, thr = 2) {
  let x0 = -1, x1 = -1
  for (let x = PANE.x0; x <= PANE.x1; x++) {
    const [r, g, b] = img.px(x, y)
    if (Math.abs(r - bd[0]) + Math.abs(g - bd[1]) + Math.abs(b - bd[2]) > thr) { if (x0 < 0) x0 = x; x1 = x }
  }
  return [x0, x1]
}

for (const wv of [4, 5]) {
  const img = load(wv)
  console.log(`\n########## WAVE ${wv} ##########`)
  const bdT = backdrop(img, 260, 60, 700)
  const bdC = backdrop(img, 260, 800, 890)
  console.log(`transcript backdrop rgb(${bdT})   composer backdrop rgb(${bdC})`)

  // --- widest extent per band ---
  const widest = (y0, y1, bd) => {
    let best = null
    for (let y = y0; y <= y1; y++) {
      const [a, b] = extent(img, y, bd)
      if (a < 0) continue
      if (!best || (b - a) > (best[1] - best[0])) best = [a, b, y]
    }
    return best
  }
  const tw = widest(60, 760, bdT)
  const cw = widest(775, 895, bdC)
  console.log(`transcript band widest ink: x${tw[0]}..${tw[1]} (w=${tw[1] - tw[0] + 1}) at y${tw[2]}`)
  console.log(`composer  band widest ink: x${cw[0]}..${cw[1]} (w=${cw[1] - cw[0] + 1}) at y${cw[2]}`)

  // --- the composer PILL: find its rounded box explicitly (it is the tall
  // contiguous non-backdrop block in the composer band) ---
  const pillRows = []
  for (let y = 775; y <= 899; y++) {
    const [a, b] = extent(img, y, bdC)
    if (a >= 0 && b - a > 600) pillRows.push([y, a, b])
  }
  if (pillRows.length) {
    const first = pillRows[0], last = pillRows[pillRows.length - 1]
    const mid = pillRows[Math.floor(pillRows.length / 2)]
    console.log(`pill-ish rows y${first[0]}..${last[0]}; mid row y${mid[0]}: x${mid[1]}..${mid[2]} (w=${mid[2] - mid[1] + 1})`)
    // widest single row = the pill's straight side
    let wm = pillRows[0]
    for (const p of pillRows) if (p[2] - p[1] > wm[2] - wm[1]) wm = p
    console.log(`pill widest row y${wm[0]}: x${wm[1]}..${wm[2]} (w=${wm[2] - wm[1] + 1})  centre ${fmt((wm[1] + wm[2]) / 2, 1)}`)
  }

  // --- transcript column edges: leftmost and rightmost ink over the band ---
  let L = 1e9, R = -1
  for (let y = 60; y <= 760; y++) { const [a, b] = extent(img, y, bdT); if (a >= 0) { L = Math.min(L, a); R = Math.max(R, b) } }
  console.log(`transcript column ink bbox: x${L}..${R} (w=${R - L + 1})  centre ${fmt((L + R) / 2, 1)}`)
  let L2 = 1e9, R2 = -1
  for (let y = 775; y <= 899; y++) { const [a, b] = extent(img, y, bdC); if (a >= 0) { L2 = Math.min(L2, a); R2 = Math.max(R2, b) } }
  console.log(`composer  column ink bbox: x${L2}..${R2} (w=${R2 - L2 + 1})  centre ${fmt((L2 + R2) / 2, 1)}`)
  console.log(`>>> SEAM: left edges ${L} vs ${L2} (jog ${L2 - L})   right edges ${R} vs ${R2} (jog ${R2 - R})   centre jog ${fmt((L2 + R2) / 2 - (L + R) / 2, 2)}`)
}
