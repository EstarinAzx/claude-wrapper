import { decode } from './png.mjs'
const S=decode('.gauntlet/waves/core-after-docks/8/sidebar.png')
const T=decode('.gauntlet/waves/core-after-docks/8/titlebar.png')
const near=(c,t,k)=>Math.abs(c[0]-t[0])+Math.abs(c[1]-t[1])+Math.abs(c[2]-t[2])<=k
const GR=[11,15,17]
// every horizontal ink band in the rail below the filter, with extents
const bands=[]; let b=null
for(let y=150;y<S.h;y++){
  let n=0,x0=1e9,x1=-1
  for(let x=0;x<=246;x++){const c=S.at(x,y); if(!near(c,GR,10)){n++;if(x<x0)x0=x;if(x>x1)x1=x}}
  if(n>0){ if(!b)b={y0:y,n:0,x0:1e9,x1:-1}; b.y1=y; b.n+=n; b.x0=Math.min(b.x0,x0); b.x1=Math.max(b.x1,x1) }
  else if(b){bands.push(b);b=null}
}
if(b)bands.push(b)
console.log('RAIL ink bands y150+ (x0..x1 within x0..246):')
for(const r of bands) console.log(`  y${String(r.y0).padStart(3)}..${String(r.y1).padStart(3)} h=${String(r.y1-r.y0+1).padStart(2)} x${r.x0}..${r.x1} w=${r.x1-r.x0+1} ink=${r.n}`)
