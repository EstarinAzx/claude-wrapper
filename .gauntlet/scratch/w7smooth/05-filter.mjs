import { decode } from './png.mjs'
for (const wv of [6,7]) {
  const I = decode(`.gauntlet/waves/core-after-docks/${wv}/sidebar.png`)
  console.log(`\n=== wave ${wv} sidebar.png column x=120 (mid field), rows y110..y150 ===`)
  for (let y=110;y<=150;y++) console.log(`  y${y}  rgb(${I.at(120,y)})`)
}
