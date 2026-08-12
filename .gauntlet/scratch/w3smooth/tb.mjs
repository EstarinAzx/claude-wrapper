import { decode } from './png.mjs'
const B='D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/'
const BG=[11,15,17,216]
for (const wv of ['1','2','3']) {
  const d = decode(B+wv+'/titlebar.png')
  const isInk=(i)=>{const o=i*4;return !(d.data[o]===BG[0]&&d.data[o+1]===BG[1]&&d.data[o+2]===BG[2]&&d.data[o+3]===BG[3])}
  // column occupancy
  const col=new Array(d.w).fill(0)
  for(let y=0;y<d.h;y++)for(let x=0;x<d.w;x++){if(isInk(y*d.w+x))col[x]++}
  // contiguous runs of occupied columns
  const runs=[];let cur=null
  for(let x=0;x<d.w;x++){if(col[x]>0){if(!cur)cur={x0:x,x1:x,px:col[x]};else{cur.x1=x;cur.px+=col[x]}}else{if(cur){runs.push(cur);cur=null}}}
  if(cur)runs.push(cur)
  console.log(`\n=== WAVE ${wv} titlebar ${d.w}x${d.h} bg-share=${(100*col.reduce((a,b)=>a+(d.h-b),0)/(d.w*d.h)).toFixed(2)}% ===`)
  console.log(`column runs (x0..x1 w) and gaps:`)
  let prev=null
  for(const r of runs){
    const gap = prev===null? r.x0 : r.x0-prev-1
    console.log(`   gap ${String(gap).padStart(4)} | run x ${String(r.x0).padStart(4)}..${String(r.x1).padStart(4)} w=${String(r.x1-r.x0+1).padStart(4)} px=${r.px}`)
    prev=r.x1
  }
  console.log(`   trailing gap ${d.w-1-prev}`)
}
