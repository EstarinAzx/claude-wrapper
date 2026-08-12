import { decode } from './png.mjs'
const B='D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/'
const d = decode(B+process.argv[4]+'/input-bar.png')
const OUT=[3,6,6,163]
const isInk=(x,y)=>{const o=(y*d.w+x)*4;return !(d.data[o]===OUT[0]&&d.data[o+1]===OUT[1]&&d.data[o+2]===OUT[2]&&d.data[o+3]===OUT[3])}
const y0=Number(process.argv[2]),y1=Number(process.argv[3])
// bands of contiguous ink rows
const rows=[]
for(let y=y0;y<=y1;y++){let l=-1,r=-1,n=0;for(let x=0;x<d.w;x++)if(isInk(x,y)){if(l<0)l=x;r=x;n++};rows.push({y,l,r,n})}
let bands=[],cur=null
for(const rr of rows){if(rr.n>0){if(!cur)cur={y0:rr.y,y1:rr.y,l:rr.l,r:rr.r,n:rr.n};else{cur.y1=rr.y;cur.l=Math.min(cur.l,rr.l);cur.r=Math.max(cur.r,rr.r);cur.n+=rr.n}}else{if(cur){bands.push(cur);cur=null}}}
if(cur)bands.push(cur)
console.log(`input-bar wave${process.argv[4]} band bboxes y${y0}..${y1}  pane centre ${d.w/2}`)
for(const b of bands){const cx=(b.l+b.r+1)/2
  console.log(`  y ${String(b.y0).padStart(3)}..${String(b.y1).padStart(3)} h=${String(b.y1-b.y0+1).padStart(2)}  x ${String(b.l).padStart(4)}..${String(b.r).padStart(4)} w=${String(b.r-b.l+1).padStart(4)} L=${String(b.l).padStart(4)} R=${String(d.w-1-b.r).padStart(4)} asym=${String(b.l-(d.w-1-b.r)).padStart(5)} cx=${cx.toFixed(1)} disp=${(cx-d.w/2).toFixed(2)}`)}
// per-row inside the strip band for structure
console.log('  --- per-row 62..100 ---')
for(const rr of rows.filter(r=>r.y>=62&&r.y<=100&&r.n>0)) console.log(`   y=${rr.y} x${rr.l}..${rr.r} n=${rr.n}`)
