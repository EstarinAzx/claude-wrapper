// The dock corner-band prediction: radius-only => diff confined to corner
// bands, nothing moves by a pixel.
import { decode, diff, bbox, clusters, W } from './lib.mjs'

const a = decode(`${W(4)}/commands-dock.png`)
const b = decode(`${W(5)}/commands-dock.png`)
const pts = diff(a, b)
console.log(`commands-dock changed pixels: ${pts.length}`)

const comps = clusters(pts).map(c => ({ c, bb: bbox(c) })).sort((p, q) => p.bb.y0 - q.bb.y0 || p.bb.x0 - q.bb.x0)
console.log(`connected components: ${comps.length}`)
for (const { bb } of comps) {
  console.log(`  x${String(bb.x0).padStart(3)}..${String(bb.x1).padEnd(3)} y${String(bb.y0).padStart(3)}..${String(bb.y1).padEnd(3)}  ${bb.w}x${bb.h}  n=${bb.n}`)
}

// Group components into rows by y-proximity, then test each row's clusters
// sit at the CORNERS of one box.
console.log('\n=== corner-band test ===')
// A radius change from 8 to 16 disturbs a band of at most 16px from each
// corner in both axes. Test: every changed pixel is within 16px (vertically)
// of some cluster's row top or bottom, AND within 17px horizontally of a
// left/right box edge.
const rows = []
for (const { c, bb } of comps) {
  let r = rows.find(r => Math.min(Math.abs(bb.y0 - r.y0), Math.abs(bb.y1 - r.y1)) < 60 && bb.y0 < r.y1 + 60 && bb.y1 > r.y0 - 60)
  if (!r) { r = { y0: bb.y0, y1: bb.y1, x0: bb.x0, x1: bb.x1, comps: [] }; rows.push(r) }
  r.y0 = Math.min(r.y0, bb.y0); r.y1 = Math.max(r.y1, bb.y1)
  r.x0 = Math.min(r.x0, bb.x0); r.x1 = Math.max(r.x1, bb.x1)
  r.comps.push(bb)
}
for (const r of rows) {
  console.log(`row band y${r.y0}..${r.y1} (h=${r.y1 - r.y0 + 1}) x${r.x0}..${r.x1} (w=${r.x1 - r.x0 + 1})  ${r.comps.length} corner clusters, n=${r.comps.reduce((s, c) => s + c.n, 0)}`)
  for (const c of r.comps) {
    const vert = c.y0 - r.y0 < (r.y1 - r.y0) / 2 ? 'TOP' : 'BOT'
    const horz = c.x0 - r.x0 < (r.x1 - r.x0) / 2 ? 'LEFT' : 'RIGHT'
    console.log(`    ${vert}-${horz}: ${c.w}x${c.h} n=${c.n} at x${c.x0}..${c.x1} y${c.y0}..${c.y1}  (inset from band: dx=${vert && horz === 'LEFT' ? c.x0 - r.x0 : r.x1 - c.x1}, dy=${vert === 'TOP' ? c.y0 - r.y0 : r.y1 - c.y1})`)
  }
}

// --- MOVEMENT TEST: any changed pixel in the interior of a row (away from
// all four corners) means something moved / repainted, not a radius change.
console.log('\n=== interior violation test ===')
let violations = []
for (const r of rows) {
  const R = 17 // generous: 16px radius + 1px AA
  for (const [x, y] of pts) {
    if (y < r.y0 || y > r.y1) continue
    const nearTop = y - r.y0 < R, nearBot = r.y1 - y < R
    const nearL = x - r.x0 < R, nearR = r.x1 - x < R
    if (!((nearTop || nearBot) && (nearL || nearR))) violations.push([x, y, r.y0])
  }
}
console.log(`pixels outside any 17x17 corner square: ${violations.length}`)
if (violations.length) console.log('  first 20:', JSON.stringify(violations.slice(0, 20)))

// --- TEXT / LAYOUT MOVEMENT: compare column ink profiles row by row for the
// whole dock. If any text moved, whole glyph runs differ.
console.log('\n=== row-height / text-position control ===')
// Per-scanline count of changed pixels; a radius change touches only ~16 rows
// per row box (8 top + 8 bottom), never a full text line.
const perRow = new Map()
for (const [, y] of pts) perRow.set(y, (perRow.get(y) || 0) + 1)
const ys = [...perRow.keys()].sort((p, q) => p - q)
console.log(`scanlines touched: ${ys.length}  max per scanline: ${Math.max(...perRow.values())}`)
// Contiguous runs of touched scanlines
const runs = []
for (const y of ys) {
  const last = runs[runs.length - 1]
  if (last && y === last[1] + 1) last[1] = y
  else runs.push([y, y])
}
console.log(`contiguous scanline runs (${runs.length}):`, runs.map(([s, e]) => `${s}..${e}(${e - s + 1})`).join(' '))
