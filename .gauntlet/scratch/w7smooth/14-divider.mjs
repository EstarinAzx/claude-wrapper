// (b) THE DATE DIVIDER, measured as a piece of composition.
import { decode, oklch } from './png.mjs'

const I = decode('.gauntlet/waves/core-after-docks/7/window-session-short.png')
const BD = [3, 6, 6]
const d = (x, y) => { const [r, g, b] = I.at(x, y); return Math.abs(r - BD[0]) + Math.abs(g - BD[1]) + Math.abs(b - BD[2]) }
const on = (x, y, thr = 2) => d(x, y) > thr

const COL_L = 464, COL_R = 1223

// --- 1. the rule: which rows in the divider block carry a long run, and where ---
console.log('=== RULE ROWS ===')
for (let y = 88; y <= 106; y++) {
  const runs = []
  let cur = 0
  for (let x = COL_L; x <= COL_R; x++) {
    if (on(x, y)) cur++
    else { if (cur > 0) runs.push([x - cur, x - 1, cur]); cur = 0 }
  }
  if (cur > 0) runs.push([COL_R - cur + 1, COL_R, cur])
  const long = runs.filter((r) => r[2] >= 20)
  if (!runs.length) { console.log(`y${y}  (clear)`); continue }
  console.log(`y${y}  runs=${runs.length}  long(>=20px)=${long.map((r) => `x${r[0]}..${r[1]}(${r[2]})`).join(' ')}`)
}

// --- 2. rule colour and contrast against ground ---
console.log('\n=== RULE COLOUR ===')
for (const y of [95, 96, 97]) {
  const s = I.at(600, y), g = I.at(600, 70)
  console.log(`  y${y} x600 rgb(${s})   ground rgb(${g})   deltaSum ${d(600, y)}`)
}
// Alpha implied if the rule is `--border` composited on the pane ground.
{
  const [r, g, b] = I.at(600, 96)
  const o = oklch(r, g, b)
  console.log(`  rule oklch L=${o.L.toFixed(4)} C=${o.C.toFixed(4)} H=${o.H.toFixed(1)}`)
}

// --- 3. the label: ink bbox, centre, glyph height ---
console.log('\n=== LABEL ===')
{
  let L = 1e9, R = -1, T = 1e9, B = -1, n = 0
  for (let y = 80; y <= 112; y++) for (let x = 700; x <= 1000; x++) {
    if (y === 96 && !(x > 800 && x < 890)) continue // skip the rule itself outside the gap
    if (on(x, y, 6)) { n++; if (x < L) L = x; if (x > R) R = x; if (y < T) T = y; if (y > B) B = y }
  }
  console.log(`  label ink bbox x${L}..${R} (w=${R - L + 1})  y${T}..${B} (h=${B - T + 1})  ${n}px`)
  console.log(`  label ink midpoint ${((L + R) / 2).toFixed(2)}   column centre ${((COL_L + COL_R) / 2).toFixed(2)}   disp ${(((L + R) / 2) - ((COL_L + COL_R) / 2)).toFixed(2)}px`)
  // brightest label pixel, for the colour role
  let best = 0, bp = null
  for (let y = T; y <= B; y++) for (let x = L; x <= R; x++) { const v = d(x, y); if (v > best) { best = v; bp = [x, y, I.at(x, y)] } }
  console.log(`  strongest label pixel at x${bp[0]},y${bp[1]} rgb(${bp[2]})  vs rule rgb(${I.at(600, 96)})`)
}

// --- 4. the gap the rule leaves for the label ---
console.log('\n=== GAP ===')
{
  const y = 96
  const runs = []
  let cur = 0
  for (let x = COL_L; x <= COL_R; x++) {
    if (on(x, y)) cur++
    else { if (cur > 0) runs.push([x - cur, x - 1, cur]); cur = 0 }
  }
  if (cur > 0) runs.push([COL_R - cur + 1, COL_R, cur])
  const big = runs.filter((r) => r[2] >= 100)
  console.log(`  rule segments >=100px: ${big.map((r) => `x${r[0]}..${r[1]} (${r[2]}px)`).join('  ')}`)
  if (big.length === 2) {
    console.log(`  left segment ${big[0][2]}px, right segment ${big[1][2]}px, asymmetry ${big[1][2] - big[0][2]}px`)
    console.log(`  gap between rule segments: x${big[0][1] + 1}..${big[1][0] - 1} (${big[1][0] - big[0][1] - 1}px)`)
  }
}

// --- 5. vertical rhythm ---
console.log('\n=== VERTICAL RHYTHM (transcript pane top = y48) ===')
{
  const rowInk = (y) => { let n = 0; for (let x = 248; x <= 1439; x++) if (on(x, y)) n++; return n }
  let first = -1
  for (let y = 48; y < 200; y++) if (rowInk(y) > 0) { first = y; break }
  // divider block = the contiguous inked band containing y96
  let t = 96, b = 96
  while (t > 48 && rowInk(t - 1) > 0) t--
  while (b < 400 && rowInk(b + 1) > 0) b++
  // next inked band below
  let n0 = b + 1
  while (n0 < 400 && rowInk(n0) === 0) n0++
  let n1 = n0
  while (n1 < 400 && rowInk(n1 + 1) > 0) n1++
  console.log(`  first ink in pane: y${first}`)
  console.log(`  divider block: y${t}..${b}  (h=${b - t + 1})`)
  console.log(`  clear above divider block: y48..${t - 1} = ${t - 48}px`)
  console.log(`  next band (first turn): y${n0}..${n1}  (h=${n1 - n0 + 1})`)
  console.log(`  clear below divider block: y${b + 1}..${n0 - 1} = ${n0 - b - 1}px`)
  console.log(`  rule row y96: ${96 - 48}px below pane top, ${n0 - 96}px above the first turn`)
}
