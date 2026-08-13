// (b) continued: what ELSE the top of the transcript reveals, and does the new
// twelfth capture agree with the eleventh everywhere the two overlap?
import { decode } from './png.mjs'

const f2 = (n) => n.toFixed(2)
const S = decode('.gauntlet/waves/core-after-docks/6/window-session-short.png')
const W = decode('.gauntlet/waves/core-after-docks/6/window-session.png')
const BD = [3, 6, 6]
const dS = (x, y) => { const [r, g, b] = S.at(x, y); return Math.abs(r - BD[0]) + Math.abs(g - BD[1]) + Math.abs(b - BD[2]) }
const on = (x, y, t = 2) => dS(x, y) > t

console.log('=== THE FIRST USER BUBBLE (y146..217) ===')
{
  const y0 = 146, y1 = 217
  const rows = []
  for (let y = y0; y <= y1; y++) {
    let L = -1, R = -1
    for (let x = 700; x <= 1300; x++) if (on(x, y)) { if (L < 0) L = x; R = x }
    rows.push({ y, L, R })
  }
  const minL = Math.min(...rows.map((r) => r.L)), maxR = Math.max(...rows.map((r) => r.R))
  const straight = rows.filter((r) => r.L === minL).length
  console.log(`  box x${minL}..x${maxR}  w=${maxR - minL + 1}  h=${y1 - y0 + 1}`)
  console.log(`  transcript column x464..x1223: bubble right edge inset ${1223 - maxR}px, left inset ${minL - 464}px`)
  console.log(`  left-edge straight run ${straight}px = ${f2(100 * straight / (y1 - y0 + 1))}% of a ${y1 - y0 + 1}px edge`)
  // radius from the top row's inset
  const topInset = rows[0].L - minL
  console.log(`  topmost row inset ${topInset}px from the straight edge  ->  arc consistent with r≈${topInset + 4}..${topInset + 6}px`)
  console.log(`  first four rows: ${rows.slice(0, 4).map((r) => `y${r.y} x${r.L}..${r.R}`).join('  ')}`)
  const fill = S.at(1000, 180)
  console.log(`  bubble fill rgb(${fill})  vs pane ground rgb(${BD})`)
}

console.log('\n=== THE FIRST ASSISTANT TURN ===')
{
  // avatar: the isolated blob at the column's left edge
  let ax0 = 1e9, ax1 = -1, ay0 = 1e9, ay1 = -1
  for (let y = 235; y <= 285; y++) for (let x = 460; x <= 500; x++) if (on(x, y)) { if (x < ax0) ax0 = x; if (x > ax1) ax1 = x; if (y < ay0) ay0 = y; if (y > ay1) ay1 = y }
  console.log(`  avatar x${ax0}..x${ax1} (w=${ax1 - ax0 + 1})  y${ay0}..y${ay1} (h=${ay1 - ay0 + 1})  left inset from column ${ax0 - 464}px`)
  // prose left edge: leftmost ink right of the avatar over the assistant block
  let px = 1e9
  for (let y = 244; y <= 500; y++) for (let x = 495; x <= 1300; x++) if (on(x, y)) { if (x < px) px = x; break }
  console.log(`  assistant prose left edge x${px}  = avatar right edge + ${px - ax1 - 1}px  = column left + ${px - 464}px`)
  console.log(`  user bubble right edge x1223 = column right edge (0px inset); assistant prose left edge x${px} = column left + ${px - 464}`)
}

console.log('\n=== DOES THE TWELFTH CAPTURE AGREE WITH THE ELEVENTH? ===')
{
  // Titlebar strip y0..47 and the rail x0..247 y48..(chat pane bottom) should be
  // identical between the two frames wherever they are not affected by the height.
  let d1 = 0
  for (let y = 0; y <= 47; y++) for (let x = 0; x < 1440; x++) {
    const a = S.at(x, y), b = W.at(x, y)
    if (a[0] !== b[0] || a[1] !== b[1] || a[2] !== b[2]) d1++
  }
  console.log(`  titlebar strip y0..47 (1440x48 = 69120px): ${d1} differing pixels`)
  let d2 = 0, firstY = -1
  for (let y = 48; y <= 700; y++) for (let x = 0; x <= 247; x++) {
    const a = S.at(x, y), b = W.at(x, y)
    if (a[0] !== b[0] || a[1] !== b[1] || a[2] !== b[2]) { d2++; if (firstY < 0) firstY = y }
  }
  console.log(`  rail x0..247 y48..700 (248x653 = 161944px): ${d2} differing pixels${firstY >= 0 ? `, first at y${firstY}` : ''}`)
}

console.log('\n=== SCROLL OFFSET CONTROL (the standard frame is scrolled; the short one is not) ===')
{
  const bdT = [3, 6, 6]
  const onW = (x, y) => { const [r, g, b] = W.at(x, y); return Math.abs(r - bdT[0]) + Math.abs(g - bdT[1]) + Math.abs(b - bdT[2]) > 2 }
  // scrollbar thumb extent in the standard frame
  let t0 = -1, t1 = -1
  for (let y = 48; y <= 767; y++) { if (onW(1434, y)) { if (t0 < 0) t0 = y; t1 = y } }
  console.log(`  window-session.png scrollbar thumb y${t0}..${t1} (${t1 - t0 + 1}px)`)
  console.log(`  window-session-short.png: no scrollbar column found (measured in 01-jog.mjs)`)
  console.log(`  inspect.log SHORT record: overflowBefore 85, grewBy 109, overflowAfter 0`)
}
