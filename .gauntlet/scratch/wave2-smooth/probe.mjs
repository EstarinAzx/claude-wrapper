import { decode, px, hex } from './png.mjs'
import fs from 'node:fs'
const W2='D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/2/'
const W1='D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/1/'
for (const f of fs.readdirSync(W2).filter(f=>f.endsWith('.png'))) {
  const b = decode(W2+f)
  let a=null; try{a=decode(W1+f)}catch(e){}
  let diff='(no w1)'
  if (a && a.w===b.w && a.h===b.h) {
    let n=0, firstY=-1, lastY=-1
    for(let y=0;y<b.h;y++){let rowdiff=false
      for(let x=0;x<b.w;x++){const i=(y*b.w+x)*4
        if(a.data[i]!==b.data[i]||a.data[i+1]!==b.data[i+1]||a.data[i+2]!==b.data[i+2]||a.data[i+3]!==b.data[i+3]){n++;rowdiff=true}}
      if(rowdiff){if(firstY<0)firstY=y;lastY=y}}
    diff=`diff px=${n} (${(100*n/(b.w*b.h)).toFixed(2)}%) rows ${firstY}..${lastY}`
  } else if (a) diff=`SIZE CHANGED ${a.w}x${a.h} -> ${b.w}x${b.h}`
  console.log(`${f.padEnd(26)} ${b.w}x${b.h} ct=${b.colorType} a0=${px(b,0,0)[3]} ${hex(px(b,0,0))}  ${diff}`)
}
