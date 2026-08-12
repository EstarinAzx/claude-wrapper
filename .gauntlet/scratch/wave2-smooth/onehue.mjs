import { decode, px, hex } from './png.mjs'
const D='D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/2/'
const SITES=[
 ['titlebar.png','logo-mark',14,13,22,22],['titlebar.png','backend-pill--wisped',152,13,58,21],
 ['sidebar.png','active-row stripe',6,225,8,74],
 ['chat.png','avatar #1',211,111,28,28],['chat.png','avatar #2',211,660,28,28],
 ['input-bar.png','send-btn',931,19,36,36],
 ['welcome.png','welcome-mark',480,242,44,44],['welcome.png','pick-folder-btn',480,438,200,52]]
const isMint=(p)=>p[1]-p[0]>=25&&p[2]-p[0]>=25
for(const [f,name,x0,y0,w,h] of SITES){
  const img=decode(D+f); const hist=new Map()
  for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++){const p=px(img,x,y); if(isMint(p)){const k=hex(p)+'/a'+p[3];hist.set(k,(hist.get(k)||0)+1)}}
  const top=[...hist.entries()].sort((a,b)=>b[1]-a[1])[0]
  console.log(`${name.padEnd(22)} ${f.padEnd(14)} modal=${top[0]} x${String(top[1]).padStart(5)}  distinct=${hist.size}`)
}
