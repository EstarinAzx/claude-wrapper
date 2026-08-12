import { decode } from './png.mjs'
const B = 'D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/'
const d=decode(B+'4/chat.png')
const BG=[3,6,6,163]
const isInk=(x,y)=>{const o=(y*d.w+x)*4
  let dd=0;for(let c=0;c<4;c++)dd+=Math.abs(d.data[o+c]-BG[c]);return dd>0}
const col=new Array(d.w).fill(0)
for(let y=0;y<d.h;y++)for(let x=0;x<d.w;x++)if(isInk(x,y))col[x]++
console.log(`chat.png ${d.w}x${d.h}  bg assumed ${BG.join(',')}`)
console.log('column occupancy runs (contiguous x with col>0):')
let cur=null;const runs=[]
for(let x=0;x<d.w;x++){if(col[x]>0){if(!cur)cur={x0:x,x1:x,max:col[x]};else{cur.x1=x;cur.max=Math.max(cur.max,col[x])}}else{if(cur){runs.push(cur);cur=null}}}
if(cur)runs.push(cur)
for(const r of runs)console.log(`   x${r.x0}..${r.x1} w=${r.x1-r.x0+1} maxRows=${r.max}`)
console.log('\nfirst/last 20 occupied columns with counts:')
console.log('  left :',[...Array(20)].map((_,i)=>`${205+i}:${col[205+i]}`).join(' '))
console.log('  right:',[...Array(20)].map((_,i)=>`${d.w-20+i}:${col[d.w-20+i]}`).join(' '))
console.log('\ncolumns 960..1000 (expected transcript column right edge ~970):')
console.log('  ',[...Array(41)].map((_,i)=>`${960+i}:${col[960+i]}`).join(' '))

// Row bands: what horizontal blocks exist
console.log('\nrow bands (contiguous ink rows) with their x extent:')
const rows=[]
for(let y=0;y<d.h;y++){let l=1e9,r=-1,n=0;for(let x=0;x<d.w;x++)if(isInk(x,y)){if(x<l)l=x;r=x;n++}rows.push({y,l,r,n})}
let b=null;const bands=[]
for(const rr of rows){if(rr.n>0){if(!b)b={y0:rr.y,y1:rr.y,l:rr.l,r:rr.r,n:rr.n};else{b.y1=rr.y;b.l=Math.min(b.l,rr.l);b.r=Math.max(b.r,rr.r);b.n+=rr.n}}else{if(b){bands.push(b);b=null}}}
if(b)bands.push(b)
for(const bb of bands)console.log(`   y${String(bb.y0).padStart(3)}..${String(bb.y1).padStart(3)} h=${String(bb.y1-bb.y0+1).padStart(3)} x${String(bb.l).padStart(4)}..${String(bb.r).padStart(4)} w=${String(bb.r-bb.l+1).padStart(4)} px=${bb.n}`)
