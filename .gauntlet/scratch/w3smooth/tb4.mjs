import { decode } from './png.mjs'
const B='D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/'
const BG=[11,15,17,216]
const dist=(d,i)=>{const o=i*4;return Math.abs(d.data[o]-BG[0])+Math.abs(d.data[o+1]-BG[1])+Math.abs(d.data[o+2]-BG[2])+Math.abs(d.data[o+3]-BG[3])}
for (const wv of ['1','2','3']) {
  const d = decode(B+wv+'/titlebar.png')
  for (const THR of [8]) {
    const col=new Array(d.w).fill(0)
    for(let y=6;y<=42;y++)for(let x=0;x<d.w;x++)if(dist(d,y*d.w+x)>THR)col[x]++
    const runs=[];let cur=null
    for(let x=0;x<d.w;x++){if(col[x]>0){if(!cur)cur={x0:x,x1:x};else cur.x1=x}else{if(cur){runs.push(cur);cur=null}}}
    if(cur)runs.push(cur)
    console.log(`\n=== WAVE ${wv} titlebar rows6-42 thr>${THR}: ${runs.length} runs ===`)
    let prev=null
    for(const r of runs){const gap=prev===null?r.x0:r.x0-prev-1
      console.log(`  gap ${String(gap).padStart(3)}  run ${String(r.x0).padStart(4)}..${String(r.x1).padStart(4)} w=${String(r.x1-r.x0+1).padStart(3)}`)
      prev=r.x1}
    console.log(`  trailing gap ${d.w-1-prev}`)
  }
}
