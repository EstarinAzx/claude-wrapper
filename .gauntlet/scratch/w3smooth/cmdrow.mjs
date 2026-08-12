import { decode } from './png.mjs'
const B='D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/'
const d=decode(B+'3/commands-dock.png')
const BR=[25,30,32,218]
const is=(x,y)=>{const o=(y*d.w+x)*4;return d.data[o]===BR[0]&&d.data[o+1]===BR[1]&&d.data[o+2]===BR[2]&&d.data[o+3]===BR[3]}
let n=0
for(let y=0;y<d.h;y++)for(let x=0;x<d.w;x++)if(is(x,y))n++
// vertical extent at the box's left edge column x7
let runs=[],cur=null
for(let y=0;y<d.h;y++){if(is(7,y)){if(!cur)cur={y0:y,y1:y};else cur.y1=y}else{if(cur){runs.push(cur);cur=null}}}
if(cur)runs.push(cur)
console.log(`commands-dock border colour ${BR} total px=${n}`)
console.log(`vertical runs at x=7 (the row box left edge):`)
for(const r of runs)console.log(`   y${r.y0}..${r.y1} len=${r.y1-r.y0+1}`)
// horizontal extent at y=50 (a top edge)
let hr=[],c2=null
for(let x=0;x<d.w;x++){if(is(x,50)){if(!c2)c2={x0:x,x1:x};else c2.x1=x}else{if(c2){hr.push(c2);c2=null}}}
if(c2)hr.push(c2)
console.log(`horizontal runs at y=50: `+hr.map(r=>`x${r.x0}..${r.x1}(${r.x1-r.x0+1})`).join(' '))
// bottom edge: scan for horizontal runs below y=100
for(const y of [113,114,115]){let a=[],c=null
  for(let x=0;x<d.w;x++){if(is(x,y)){if(!c)c={x0:x,x1:x};else c.x1=x}else{if(c){a.push(c);c=null}}}
  if(c)a.push(c)
  console.log(`   y=${y}: `+(a.map(r=>`x${r.x0}..${r.x1}(${r.x1-r.x0+1})`).join(' ')||'none'))}
