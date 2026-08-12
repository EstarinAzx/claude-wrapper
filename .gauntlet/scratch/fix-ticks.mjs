import { readFileSync, writeFileSync } from 'node:fs'

const p = '.gauntlet/waves/core-after-docks/4/wave4-critics.mjs'
const lines = readFileSync(p, 'utf8').split('\n')
const TICK = String.fromCharCode(96)
const targets = [213, 214, 230, 232, 237, 239, 266]

for (const n of targets) {
  const i = n - 1
  const before = lines[i]
  let out = ''
  for (let k = 0; k < before.length; k++) {
    const c = before[k]
    if (c === TICK && before[k - 1] !== '\\') out += '\\' + TICK
    else out += c
  }
  lines[i] = out
  if (before !== out) console.log('escaped line', n)
}

writeFileSync(p, lines.join('\n'))
