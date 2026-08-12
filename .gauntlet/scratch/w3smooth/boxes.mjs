import { decode } from './png.mjs'
const B='D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/'
const surf = process.argv[2], wv = process.argv[3], minN = Number(process.argv[4]||300)
const d = decode(B+wv+'/'+surf+'.png')
const m = new Map()
for(let y=0;y<d.h;y++)for(let x=0;x<d.w;x++){const o=(y*d.w+x)*4
  const k=d.data[o]+','+d.data[o+1]+','+d.data[o+2]+','+d.data[o+3]
  let e=m.get(k); if(!e){e={n:0,x0:1e9,x1:-1,y0:1e9,y1:-1};m.set(k,e)}
  e.n++; if(x<e.x0)e.x0=x; if(x>e.x1)e.x1=x; if(y<e.y0)e.y0=y; if(y>e.y1)e.y1=y}
console.log(`=== ${surf} wave${wv} ${d.w}x${d.h} centre x=${d.w/2} ===`)
const rows=[...m.entries()].filter(([k,e])=>e.n>=minN).sort((a,b)=>b[1].n-a[1].n)
for(const [k,e] of rows){
  const cx=(e.x0+e.x1+1)/2
  console.log(`  ${k.padEnd(18)} n=${String(e.n).padStart(7)} bbox x${String(e.x0).padStart(4)}..${String(e.x1).padStart(4)} (w${String(e.x1-e.x0+1).padStart(4)}) y${String(e.y0).padStart(4)}..${String(e.y1).padStart(4)} (h${String(e.y1-e.y0+1).padStart(3)}) cx=${cx.toFixed(1)} disp=${(cx-d.w/2).toFixed(2)} fill%=${(100*e.n/((e.x1-e.x0+1)*(e.y1-e.y0+1))).toFixed(1)}`)
}
