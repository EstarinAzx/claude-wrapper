// ONE TYPE SCALE. Declared rungs vs 15*1.15^k, plus a pixel check that no
// rendered glyph height moved on the three changed elements.
const rungs=[['--text-micro',11],['--text-ui',13],['--text-body',15],['subagent.css literal',20],['--text-display',46]]
console.log('rung            declared   nearest 15*1.15^k        k    deviation')
let worst=0
for (const [n,v] of rungs){
  let bk=0,bd=1e9,bv=0
  for(let k=-6;k<=12;k++){const t=15*Math.pow(1.15,k);if(Math.abs(t-v)<bd){bd=Math.abs(t-v);bk=k;bv=t}}
  if(bd>worst)worst=bd
  console.log(`${n.padEnd(22)} ${String(v).padStart(3)}   ${bv.toFixed(3).padStart(8)}   ${String(bk).padStart(3)}    ${bd.toFixed(3)}`)
}
console.log(`MAX DEVIATION ${worst.toFixed(3)}px  tolerance 0.35px  -> ${worst<=0.35?'HOLDS':'BREAKS'}   off-ladder rungs: 0`)

import { decode } from './png.mjs'
const near=(c,t,k=6)=>Math.abs(c[0]-t[0])+Math.abs(c[1]-t[1])+Math.abs(c[2]-t[2])<=k
const GR=[11,15,17], BD=[29,34,35]
console.log('\n--- pixel check: glyph ink heights on the three changed elements ---')
// filter placeholder, rows well inside the field so no edge antialiasing counts
for (const wv of [7,8]) {
  const I=decode(`.gauntlet/waves/core-after-docks/${wv}/sidebar.png`)
  let y0=1e9,y1=-1,x0=1e9,x1=-1
  for(let y=120;y<=140;y++)for(let x=16;x<=200;x++){const c=I.at(x,y); if(!near(c,GR,10)&&!near(c,BD,10)){if(y<y0)y0=y;if(y>y1)y1=y;if(x<x0)x0=x;if(x>x1)x1=x}}
  console.log(`  w${wv} filter placeholder ink  y${y0}..${y1} (h=${y1-y0+1})  x${x0}..${x1} (w=${x1-x0+1})`)
}
// app name in titlebar
for (const wv of [7,8]) {
  const I=decode(`.gauntlet/waves/core-after-docks/${wv}/titlebar.png`)
  const g=[11,15,17]
  let y0=1e9,y1=-1,x0=1e9,x1=-1
  for(let y=1;y<=45;y++)for(let x=38;x<=145;x++){const c=I.at(x,y); if(!near(c,g,4)){if(y<y0)y0=y;if(y>y1)y1=y;if(x<x0)x0=x;if(x>x1)x1=x}}
  console.log(`  w${wv} app name ink           y${y0}..${y1} (h=${y1-y0+1})  x${x0}..${x1} (w=${x1-x0+1})`)
}
// disclosure label in chat card 1
for (const [wv,ys] of [[7,[243,250]],[8,[280,287]]]) {
  const I=decode(`.gauntlet/waves/core-after-docks/${wv}/chat.png`)
  let x0=1e9,x1=-1
  for(let y=ys[0];y<=ys[1];y++)for(let x=264;x<=807;x++){const c=I.at(x,y); if(!near(c,GR,10)){if(x<x0)x0=x;if(x>x1)x1=x}}
  console.log(`  w${wv} disclosure label ink   y${ys[0]}..${ys[1]} (h=${ys[1]-ys[0]+1})  x${x0}..${x1} (w=${x1-x0+1})`)
}
