import { decode, at } from './w8lib.mjs'
const a = decode('.gauntlet/waves/core-after-docks/11/sidebar.png')
const b = decode('.gauntlet/waves/core-after-docks/12/sidebar.png')
console.log('--- exact pixel values in bbox x14-20 y137-143 (w11 -> w12) ---')
for (let y = 137; y <= 143; y++) {
  let row = []
  for (let x = 14; x <= 20; x++) {
    const pa = at(a, x, y), pb = at(b, x, y)
    const same = pa.every((v, i) => v === pb[i])
    row.push(same ? `      .      ` : `[${pa.join(',')}]->[${pb.join(',')}]`)
  }
  console.log(`y${y}: ${row.join(' ')}`)
}
