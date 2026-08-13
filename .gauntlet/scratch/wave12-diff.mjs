import { decode } from './w8lib.mjs'

const A = process.argv[2] ?? '11'
const B = process.argv[3] ?? '12'
const dir = (n) => `.gauntlet/waves/core-after-docks/${n}`

const files = [
  'welcome', 'window-welcome', 'welcome-min-window', 'titlebar', 'sidebar',
  'chat', 'input-bar', 'window-session', 'window-session-short',
  'agents-dock', 'commands-dock', 'appearance-dock',
]

let total = 0
for (const f of files) {
  const a = decode(`${dir(A)}/${f}.png`)
  const b = decode(`${dir(B)}/${f}.png`)
  if (a.w !== b.w || a.h !== b.h || a.ch !== b.ch) {
    console.log(`${f}: GEOMETRY ${a.w}x${a.h}c${a.ch} -> ${b.w}x${b.h}c${b.ch}`)
    continue
  }
  let rgb = 0, alpha = 0
  let minx = 1e9, miny = 1e9, maxx = -1, maxy = -1
  for (let y = 0; y < a.h; y++) {
    for (let x = 0; x < a.w; x++) {
      const i = (y * a.w + x) * a.ch
      const drgb = a.px[i] !== b.px[i] || a.px[i + 1] !== b.px[i + 1] || a.px[i + 2] !== b.px[i + 2]
      if (drgb) {
        rgb++
        if (x < minx) minx = x
        if (x > maxx) maxx = x
        if (y < miny) miny = y
        if (y > maxy) maxy = y
      }
      if (a.ch === 4 && a.px[i + 3] !== b.px[i + 3]) alpha++
    }
  }
  total += rgb
  const box = rgb ? ` bbox x${minx}-${maxx} y${miny}-${maxy}` : ''
  console.log(`${f}: ${a.w}x${a.h} ch${a.ch} rgb_changed=${rgb} alpha_changed=${alpha}${box}`)
}
console.log(`rgb_changed_total = ${total}`)
