// Is the composer change a PURE 5px translation? If w5(x,y) == w4(x+5,y) over
// the whole composer column, nothing re-rendered, re-wrapped or resized — the
// block simply moved. Same test for the rail's 23px vertical translation.
import { decode, W, fmt } from './lib.mjs'

console.log('=== COMPOSER: input-bar.png, test w5(x,y) == w4(x+5,y) ===')
{
  const a = decode(`${W(4)}/input-bar.png`), b = decode(`${W(5)}/input-bar.png`)
  let same = 0, diff = 0, checked = 0
  const bad = []
  for (let y = 0; y < a.h; y++) for (let x = 0; x + 5 < a.w; x++) {
    const oa = (y * a.w + x + 5) * 4, ob = (y * b.w + x) * 4
    checked++
    let eq = true
    for (let c = 0; c < 4; c++) if (a.data[oa + c] !== b.data[ob + c]) { eq = false; break }
    if (eq) same++; else { diff++; if (bad.length < 12) bad.push([x, y]) }
  }
  console.log(`  shifted compare over x0..${a.w - 6}: ${same}/${checked} identical, ${diff} differing (${fmt(100 * diff / checked, 4)}%)`)
  if (bad.length) console.log(`  first mismatches: ${JSON.stringify(bad)}`)
  // restrict to the composer column band only
  let s2 = 0, d2 = 0
  for (let y = 0; y < a.h; y++) for (let x = 205; x <= 980; x++) {
    const oa = (y * a.w + x + 5) * 4, ob = (y * b.w + x) * 4
    let eq = true
    for (let c = 0; c < 4; c++) if (a.data[oa + c] !== b.data[ob + c]) { eq = false; break }
    if (eq) s2++; else d2++
  }
  console.log(`  within the composer column x205..980: ${s2} identical, ${d2} differing`)
}

console.log('\n=== RAIL: sidebar.png, test w5(x,y) == w4(x,y+23) over the list region ===')
{
  const a = decode(`${W(4)}/sidebar.png`), b = decode(`${W(5)}/sidebar.png`)
  let same = 0, diff = 0
  for (let y = 200; y + 23 < a.h - 60; y++) for (let x = 0; x < a.w; x++) {
    const oa = ((y + 23) * a.w + x) * 4, ob = (y * b.w + x) * 4
    let eq = true
    for (let c = 0; c < 4; c++) if (a.data[oa + c] !== b.data[ob + c]) { eq = false; break }
    if (eq) same++; else diff++
  }
  console.log(`  y200..${a.h - 61} shifted by 23: ${same} identical, ${diff} differing (${fmt(100 * diff / (same + diff), 4)}%)`)
  // the pre-list stack does NOT translate uniformly (it compresses), so test it separately
  let s = 0, dd = 0
  for (let y = 0; y < 200; y++) for (let x = 0; x < a.w; x++) {
    const oa = (y * a.w + x) * 4, ob = (y * b.w + x) * 4
    let eq = true
    for (let c = 0; c < 4; c++) if (a.data[oa + c] !== b.data[ob + c]) { eq = false; break }
    if (eq) s++; else dd++
  }
  console.log(`  pre-list stack y0..199 unshifted: ${s} identical, ${dd} differing (compression zone, expected)`)
  // footer
  let s3 = 0, d3 = 0
  for (let y = a.h - 60; y < a.h; y++) for (let x = 0; x < a.w; x++) {
    const oa = (y * a.w + x) * 4, ob = (y * b.w + x) * 4
    let eq = true
    for (let c = 0; c < 4; c++) if (a.data[oa + c] !== b.data[ob + c]) { eq = false; break }
    if (eq) s3++; else d3++
  }
  console.log(`  footer y${a.h - 60}..${a.h - 1} unshifted: ${s3} identical, ${d3} differing (bottom-anchored, should be 0 differing)`)
}

console.log('\n=== SELECTION STRIPE, exact run at each column, wave 4 vs 5 ===')
{
  const hsl = (r, g, b) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b), c = mx - mn; if (!c) return -1; let h; if (mx === r) h = ((g - b) / c) % 6; else if (mx === g) h = (b - r) / c + 2; else h = (r - g) / c + 4; return (h * 60 + 360) % 360 }
  const isMint = (r, g, b) => { const h = hsl(r, g, b); return Math.max(r, g, b) - Math.min(r, g, b) > 20 && h >= 140 && h <= 190 }
  for (const wv of [4, 5]) {
    const d = decode(`${W(wv)}/sidebar.png`)
    const rowTop = wv === 4 ? 225 : 202, rowH = 74
    const out = []
    for (let x = 4; x <= 12; x++) {
      let best = 0, n = 0
      for (let y = rowTop; y < rowTop + rowH; y++) { const [r, g, b] = d.px(x, y); if (isMint(r, g, b)) { n++; best = Math.max(best, n) } else n = 0 }
      out.push(`x${x}:${best}`)
    }
    console.log(`  wave ${wv} (row y${rowTop}..${rowTop + rowH - 1}, h=${rowH}): ${out.join('  ')}`)
    console.log(`     longest run ${Math.max(...out.map(s => +s.split(':')[1]))}px = ${fmt(100 * Math.max(...out.map(s => +s.split(':')[1])) / rowH, 1)}% of the row;  h-2r at r=16 is ${rowH - 32}px (${fmt(100 * (rowH - 32) / rowH, 1)}%)`)
  }
}
