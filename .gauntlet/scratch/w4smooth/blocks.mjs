import { decode } from './png.mjs'
const B = 'D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/'
// A "block" here = a contiguous run of columns that carry ink, measured inside a
// stated y window. Reports displacement of each block's bbox against pane centre.
function colRuns(d,BG,y0,y1,thr=0){
  const col=new Array(d.w).fill(0)
  for(let y=y0;y<=y1;y++)for(let x=0;x<d.w;x++){const o=(y*d.w+x)*4
    let dd=0;for(let c=0;c<4;c++)dd+=Math.abs(d.data[o+c]-BG[c]);if(dd>thr)col[x]++}
  const runs=[];let cur=null
  for(let x=0;x<d.w;x++){if(col[x]>0){if(!cur)cur={x0:x,x1:x};else cur.x1=x}else{if(cur){runs.push(cur);cur=null}}}
  if(cur)runs.push(cur)
  return runs
}
const BGD=[3,6,6,163]
for (const wv of ['3','4']) {
  console.log(`\n########## WAVE ${wv} ##########`)
  for (const s of ['input-bar','appearance-dock','agents-dock','titlebar']) {
    const d=decode(B+wv+'/'+s+'.png')
    // pick bg as most common
    const h=new Map()
    for(let i=0;i<d.w*d.h;i++){const o=i*4;const k=d.data[o]+','+d.data[o+1]+','+d.data[o+2]+','+d.data[o+3];h.set(k,(h.get(k)||0)+1)}
    const top=[...h.entries()].sort((a,b)=>b[1]-a[1]).slice(0,2)
    console.log(`\n  ${s}.png ${d.w}x${d.h}  paneCentre=${d.w/2}  top bg: ${top.map(([k,v])=>k+' ('+(100*v/(d.w*d.h)).toFixed(1)+'%)').join(' | ')}`)
    for (const BG of [BGD, top[0][0].split(',').map(Number)]) {
      const runs=colRuns(d,BG,0,d.h-1)
      if(runs.length>12){console.log(`    bg=${BG.join(',')}: ${runs.length} runs (too fragmented to list)`);continue}
      console.log(`    bg=${BG.join(',')}:`)
      for(const r of runs){const cx=(r.x0+r.x1+1)/2
        console.log(`       x${String(r.x0).padStart(4)}..${String(r.x1).padStart(4)} w=${String(r.x1-r.x0+1).padStart(4)} L=${String(r.x0).padStart(4)} R=${String(d.w-1-r.x1).padStart(4)} asym=${String(r.x0-(d.w-1-r.x1)).padStart(5)} DISP=${(cx-d.w/2).toFixed(2)}`)}
    }
  }
}

console.log('\n\n=== WELCOME HERO VERTICAL PLACEMENT (the surviving owner call) ===')
for (const wv of ['3','4']) {
  const d=decode(B+wv+'/welcome.png')
  const h=new Map()
  for(let i=0;i<d.w*d.h;i++){const o=i*4;const k=d.data[o]+','+d.data[o+1]+','+d.data[o+2]+','+d.data[o+3];h.set(k,(h.get(k)||0)+1)}
  const BG=[...h.entries()].sort((a,b)=>b[1]-a[1])[0][0].split(',').map(Number)
  let t=1e9,b=-1
  for(let y=0;y<d.h;y++)for(let x=0;x<d.w;x++){const o=(y*d.w+x)*4
    let dd=0;for(let c=0;c<4;c++)dd+=Math.abs(d.data[o+c]-BG[c]);if(dd>0){if(y<t)t=y;if(y>b)b=y;break}}
  // recompute properly (break only skips row after first hit)
  t=1e9;b=-1
  for(let y=0;y<d.h;y++){let hit=false
    for(let x=0;x<d.w&&!hit;x++){const o=(y*d.w+x)*4
      let dd=0;for(let c=0;c<4;c++)dd+=Math.abs(d.data[o+c]-BG[c]);if(dd>0)hit=true}
    if(hit){if(y<t)t=y;if(y>b)b=y}}
  const mid=(t+b+1)/2
  console.log(`  wave ${wv}: hero ink y${t}..${b} h=${b-t+1}  midpoint=${mid.toFixed(2)}  paneCentre=${d.h/2} (capture ${d.h}px)  DISP=${(mid-d.h/2).toFixed(2)}px  top=${t} bottom-gap=${d.h-1-b}`)
}
