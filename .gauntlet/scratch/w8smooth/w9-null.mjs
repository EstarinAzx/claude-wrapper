import { readFileSync } from 'node:fs'
import { decode } from './png.mjs'
import { createHash } from 'node:crypto'

const root = 'D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks'
const files = ['welcome.png','window-welcome.png','welcome-min-window.png','titlebar.png','sidebar.png','chat.png','input-bar.png','window-session.png','window-session-short.png','agents-dock.png','commands-dock.png','appearance-dock.png']
let byteIdentical = 0
let rgbChangedTotal = 0
for (const file of files) {
  const p8 = `${root}/8/${file}`
  const p9 = `${root}/9/${file}`
  const b8 = readFileSync(p8)
  const b9 = readFileSync(p9)
  const sameBytes = b8.equals(b9)
  if (sameBytes) byteIdentical++
  const a = decode(p8)
  const b = decode(p9)
  if (a.w !== b.w || a.h !== b.h) throw new Error(`${file}: dimensions differ`)
  let rgbChanged = 0
  for (let y = 0; y < a.h; y++) for (let x = 0; x < a.w; x++) {
    const ca = a.at(x, y), cb = b.at(x, y)
    if (ca[0] !== cb[0] || ca[1] !== cb[1] || ca[2] !== cb[2]) rgbChanged++
  }
  rgbChangedTotal += rgbChanged
  const sha = createHash('sha256').update(b9).digest('hex').slice(0, 16)
  console.log(`${file.padEnd(26)} bytes=${sameBytes ? 'IDENTICAL' : 'DIFFERENT'} rgb_changed=${rgbChanged} dims=${a.w}x${a.h} sha256=${sha}`)
}
console.log(`SUMMARY byte_identical=${byteIdentical}/${files.length} rgb_changed_total=${rgbChangedTotal}`)
