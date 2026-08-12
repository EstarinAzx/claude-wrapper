import { decode } from './png.mjs'
const B='D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/'
function comps(d,rgba,minArea){
  const W=d.w,H=d.h,seen=new Uint8Array(W*H)
  const match=(i)=>{const o=i*4;return d.data[o]===rgba[0]&&d.data[o+1]===rgba[1]&&d.data[o+2]===rgba[2]&&d.data[o+3]===rgba[3]}
  const out=[]
  for(let s=0;s<W*H;s++){if(seen[s]||!match(s))continue
    const st=[s];seen[s]=1;let n=0,x0=1e9,x1=-1,y0=1e9,y1=-1;const px=new Set()
    while(st.length){const i=st.pop();const x=i%W,y=(i-x)/W;n++;px.add(i)
      if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y
      for(const j of [x>0?i-1:-1,x<W-1?i+1:-1,y>0?i-W:-1,y<H-1?i+W:-1])if(j>=0&&!seen[j]&&match(j)){seen[j]=1;st.push(j)}}
    if(n>=minArea)out.push({n,x0,x1,y0,y1,px})}
  return out
}
function insets(d,c){const W=d.w,ins=[]
  for(let dy=0;dy<Math.min(c.y1-c.y0+1,24);dy++){let x=c.x0;while(x<=c.x1&&!c.px.has((c.y0+dy)*W+x))x++;ins.push(x-c.x0)}
  let k=0;while(k<ins.length&&ins[k]>0)k++
  return {ins:ins.slice(0,Math.max(k+2,6)),k}}
// find every distinct fill colour with a big-enough area in each dock, then measure
for(const surf of ['agents-dock','commands-dock','sidebar']){
  const d=decode(B+'3/'+surf+'.png')
  const m=new Map()
  for(let i=0;i<d.w*d.h;i++){const o=i*4;const k=d.data[o]+','+d.data[o+1]+','+d.data[o+2]+','+d.data[o+3];m.set(k,(m.get(k)||0)+1)}
  console.log(`\n=== ${surf} : candidate row fills ===`)
  for(const [k,v] of [...m.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5)){
    const rgba=k.split(',').map(Number)
    const cs=comps(d,rgba,1500)
    if(!cs.length){console.log(`  ${k.padEnd(18)} n=${v} -> no component >=1500px`);continue}
    console.log(`  ${k.padEnd(18)} n=${v} -> ${cs.length} comp(s)`)
    for(const c of cs.sort((a,b)=>b.n-a.n).slice(0,3)){const r=insets(d,c)
      console.log(`      ${String(c.x1-c.x0+1).padStart(4)}x${String(c.y1-c.y0+1).padStart(3)} at x${c.x0}..${c.x1} y${c.y0}..${c.y1}  topInset=${r.ins[0]} rRows=${r.k} profile=[${r.ins.join(',')}]`)}
  }
}
