import { decode } from './png.mjs'
const B='D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/'
// Connected components of an exact fill colour; then measure corner radius from
// the left-edge inset profile at the top of each component.
function comps(d, rgba, minArea){
  const W=d.w,H=d.h, seen=new Uint8Array(W*H)
  const match=(i)=>{const o=i*4;return d.data[o]===rgba[0]&&d.data[o+1]===rgba[1]&&d.data[o+2]===rgba[2]&&d.data[o+3]===rgba[3]}
  const out=[]
  for(let s=0;s<W*H;s++){
    if(seen[s]||!match(s))continue
    const st=[s];seen[s]=1;let n=0,x0=1e9,x1=-1,y0=1e9,y1=-1
    const px=[]
    while(st.length){const i=st.pop();const x=i%W,y=(i-x)/W;n++;px.push(i)
      if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y
      const nb=[x>0?i-1:-1,x<W-1?i+1:-1,y>0?i-W:-1,y<H-1?i+W:-1]
      for(const j of nb)if(j>=0&&!seen[j]&&match(j)){seen[j]=1;st.push(j)}}
    if(n>=minArea)out.push({n,x0,x1,y0,y1,px})
  }
  return out
}
function radiusOf(d,c){
  const W=d.w
  const set=new Set(c.px)
  const w=c.x1-c.x0+1, h=c.y1-c.y0+1
  // left-edge inset per row from top
  const ins=[]
  for(let dy=0;dy<Math.min(h,40);dy++){
    const y=c.y0+dy
    let x=c.x0
    while(x<=c.x1 && !set.has(y*W+x)) x++
    ins.push(x-c.x0)
  }
  // radius ~= number of leading rows whose inset > 0, +1 for the AA row
  let k=0; while(k<ins.length && ins[k]>0) k++
  return {w,h,insetProfile:ins.slice(0,Math.max(k+2,6)), rRows:k, rTop:ins[0]}
}
const targets=[
  ['input-bar','composer pill (fill)',[11,15,17,216],5000],
  ['input-bar','composer pill (border)',[29,35,35,219],800],
  ['chat','tool card fill',[11,15,17,216],20000],
  ['chat','user bubble fill',[33,36,38,246],10000],
  ['sidebar','session row fill',[28,39,39,220],3000]
]
for(const [surf,label,rgba,minA] of targets){
  for(const wv of (surf==='sidebar'?['2','3']:['3'])){
    const d=decode(B+wv+'/'+surf+'.png')
    const cs=comps(d,rgba,minA).sort((a,b)=>b.n-a.n).slice(0,4)
    console.log(`\n--- ${surf} w${wv} ${label} rgba=${rgba} : ${cs.length} comps`)
    for(const c of cs){const r=radiusOf(d,c)
      console.log(`   bbox x${c.x0}..${c.x1} y${c.y0}..${c.y1}  ${r.w}x${r.h}  area=${c.n}  topInset=${r.rTop} rRows=${r.rRows}  profile=[${r.insetProfile.join(',')}]`)}
  }
}
