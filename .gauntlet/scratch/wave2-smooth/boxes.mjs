import { decode, px, hex } from './png.mjs'
const D='D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/2/'
for(const f of ['input-bar.png','chat.png']){
  const img=decode(D+f); const hist=new Map()
  for(let y=0;y<img.h;y++)for(let x=0;x<img.w;x++){const k=hex(px(img,x,y))+'/a'+px(img,x,y)[3];hist.set(k,(hist.get(k)||0)+1)}
  console.log(`\n=== ${f} ${img.w}x${img.h} — top fills by area ===`)
  for(const [k,v] of [...hist.entries()].sort((a,b)=>b[1]-a[1]).slice(0,8)) console.log(`  ${k}  x${v}`)
}
