import { decode, oklch } from './png.mjs'
const near=(c,t,k=6)=>Math.abs(c[0]-t[0])+Math.abs(c[1]-t[1])+Math.abs(c[2]-t[2])<=k
const cards={6:[[221,330],[435,545]],7:[[169,304],[409,545]],8:[[213,326],[431,545]]}
for (const wv of [6,7,8]) {
  const I=decode(`.gauntlet/waves/core-after-docks/${wv}/chat.png`)
  const sc=I.at(400,cards[wv][0][0]+6)
  const o=oklch(...sc)
  console.log(`\n===== WAVE ${wv}  card surface rgb(${sc})  L=${o.L.toFixed(4)} C=${o.C.toFixed(4)} H=${o.H.toFixed(1)} =====`)
  for (const [y0,y1] of cards[wv]) {
    const prof=[]
    for(let y=y0;y<=y1;y++){ let n=0,x0=1e9,x1=-1; for(let x=256;x<=815;x++){ const c=I.at(x,y); if(!near(c,sc,10)){n++; if(x<x0)x0=x; if(x>x1)x1=x} } prof.push({y,n,x0,x1}) }
    const bands=[];let b=null
    for(const r of prof){ if(r.n>0){ if(!b)b={y0:r.y,n:0,x0:1e9,x1:-1}; b.y1=r.y; b.n+=r.n; b.x0=Math.min(b.x0,r.x0); b.x1=Math.max(b.x1,r.x1) } else if(b){bands.push(b);b=null} }
    if(b)bands.push(b)
    console.log(`  CARD y${y0}..${y1}  outer ${y1-y0+1}  inner ${y1-y0-1}`)
    for(const r of bands) console.log(`     band y${r.y0}..${r.y1} h=${String(r.y1-r.y0+1).padStart(3)} x${r.x0}..${r.x1} (w=${r.x1-r.x0+1}) ink=${r.n}`)
    const cl=[]; for(let i=0;i+1<bands.length;i++) cl.push(bands[i+1].y0-bands[i].y1-1)
    console.log(`     clears: ${cl.join(' / ')}`)
  }
}
