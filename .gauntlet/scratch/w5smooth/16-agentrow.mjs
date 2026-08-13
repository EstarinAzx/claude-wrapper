// `.agent-row--selected > .agent-row-btn { background: var(--tint-3) }` paints a
// ground, and `.agent-row--nested > .agent-row-btn` paints a 1px left border in
// EVERY state. So the agent row's corner is observable — just not in the state
// the capture holds. Measure the agent row's height from the dock so the arc
// fraction a 16px corner would produce there can be stated.
import { decode, W, fmt } from './lib.mjs'
const d = decode(`${W(5)}/agents-dock.png`)
console.log(`agents-dock.png ${d.w}x${d.h}`)
const THR = 70
const bands = []; let cur = null
for (let y = 0; y < d.h; y++) {
  let n = 0, l = -1, r = -1
  for (let x = 0; x < d.w; x++) { const [R, G, B] = d.px(x, y); if (R > THR && G > THR && B > THR) { n++; if (l < 0) l = x; r = x } }
  if (n > 0) { if (!cur) cur = { y0: y, y1: y, l, r }; else { cur.y1 = y; cur.l = Math.min(cur.l, l); cur.r = Math.max(cur.r, r) } }
  else { if (cur) { bands.push(cur); cur = null } }
}
if (cur) bands.push(cur)
console.log(`text bands: ${bands.length}`)
for (const b of bands) console.log(`  y${String(b.y0).padStart(3)}..${String(b.y1).padEnd(3)} h=${String(b.y1 - b.y0 + 1).padStart(2)}  x${b.l}..${b.r}`)
const tops = bands.map(b => b.y0)
console.log(`top-to-top pitches: [${tops.slice(1).map((t, i) => t - tops[i]).join(', ')}]`)

// hairlines / dividers
const prof = []
for (let y = 0; y < d.h; y++) { let s = 0; for (let x = 0; x < d.w; x++) s += d.px(x, y)[0]; prof.push(s / d.w) }
const hair = []
for (let y = 1; y < d.h - 1; y++) if (prof[y] - prof[y - 1] > 1.0 && prof[y] - prof[y + 1] > 1.0) hair.push(y)
console.log(`hairline rows: ${hair.join(', ')}`)

console.log('\nIf a selected/nested agent row is ~the pitch above, a 16px corner consumes:')
for (const h of [40, 44, 48, 52]) console.log(`  h=${h}px -> 2r/h = ${fmt(100 * 32 / h, 1)}%, straight left edge = ${h - 32}px (${fmt(100 * (h - 32) / h, 1)}%)`)
