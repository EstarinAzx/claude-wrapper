import { decode, diff, W } from './lib.mjs'
const a = decode(`${W(4)}/commands-dock.png`)
const b = decode(`${W(5)}/commands-dock.png`)

console.log('=== pixel values around a changed corner (row top y50, left x7) ===')
for (let y = 48; y <= 68; y++) {
  let l4 = '', l5 = ''
  for (let x = 5; x <= 26; x++) { l4 += a.px(x, y)[0].toString(16).padStart(2, '0') + ' '; l5 += b.px(x, y)[0].toString(16).padStart(2, '0') + ' ' }
  console.log(`y${String(y).padStart(3)} w4 ${l4}`)
  console.log(`     w5 ${l5}`)
}

console.log('\n=== vertical profile at x=9 and x=124, y40..130, R channel ===')
for (let y = 40; y <= 130; y += 1) {
  const p9a = a.px(9, y), p9b = b.px(9, y), pMa = a.px(124, y)
  if (y % 1 === 0 && (p9a[0] !== p9b[0] || y % 10 === 0))
    console.log(`  y${String(y).padStart(3)} x9: w4=${p9a.slice(0,3)} w5=${p9b.slice(0,3)}   x124 w4=${pMa.slice(0,3)}`)
}

console.log('\n=== row ground extent measured at fine threshold, column x=9 ===')
function runs(img, col, thr) {
  const out = []; let s = -1
  for (let y = 0; y < img.h; y++) {
    const [r, g, bl] = img.px(col, y)
    const on = Math.abs(r - 11) + Math.abs(g - 15) + Math.abs(bl - 17) > thr
    if (on && s < 0) s = y; else if (!on && s >= 0) { out.push([s, y - 1]); s = -1 }
  }
  if (s >= 0) out.push([s, img.h - 1])
  return out.filter(([x, y]) => y - x >= 5)
}
for (const thr of [0, 1, 2]) {
  console.log(` thr>${thr}: w4`, runs(a, 9, thr).map(([s, e]) => `${s}..${e}(${e - s + 1})`).join(' '))
  console.log(`         w5`, runs(b, 9, thr).map(([s, e]) => `${s}..${e}(${e - s + 1})`).join(' '))
}

console.log('\n=== row box extent measured at column x=124 (row middle), fine ===')
for (const thr of [0]) {
  console.log(` w4`, runs(a, 124, thr).map(([s, e]) => `${s}..${e}(${e - s + 1})`).join(' '))
  console.log(` w5`, runs(b, 124, thr).map(([s, e]) => `${s}..${e}(${e - s + 1})`).join(' '))
}
