import { decode, oklch } from './png.mjs'
const f=n=>(n>=0?'+':'')+n.toFixed(4)
const near=(c,t,k)=>Math.abs(c[0]-t[0])+Math.abs(c[1]-t[1])+Math.abs(c[2]-t[2])<=k
const modal=(I,x0,y0,x1,y1)=>{const m=new Map();for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const k=I.at(x,y).join(',');m.set(k,(m.get(k)||0)+1)}
  const e=[...m.entries()].sort((a,b)=>b[1]-a[1]);return {rgb:e[0][0].split(',').map(Number),n:e[0][1],total:(x1-x0+1)*(y1-y0+1)}}
const S=decode('.gauntlet/waves/core-after-docks/8/sidebar.png')
const C=decode('.gauntlet/waves/core-after-docks/8/chat.png')
console.log('sidebar', S.w+'x'+S.h)
// rail ground: modal over a region with no controls (below the list? use x0..247 y60..100)
for (const [lbl,a,b,c,d] of [['y60-100',0,60,247,100],['y155-185',0,155,247,185],['y700-800',0,700,247,800]]) {
  const m=modal(S,a,b,c,d); console.log(`  rail modal ${lbl}: rgb(${m.rgb}) ${m.n}/${m.total}`)
}
const railG=modal(S,0,155,247,185).rgb
const railGo=oklch(...railG)
console.log(`RAIL GROUND rgb(${railG}) L=${railGo.L.toFixed(4)}`)
// field: scan band, find the contiguous fill region distinct from rail ground
const fieldFill=S.at(200,130)
console.log(`field fill rgb(${fieldFill}) L=${oklch(...fieldFill).L.toFixed(4)}  step ${f(oklch(...fieldFill).L-railGo.L)}`)
// bounding box of pixels equal to fieldFill within y110..150 only (the field band)
let x0=1e9,x1=-1,y0=1e9,y1=-1,n=0
for(let y=108;y<=152;y++)for(let x=0;x<S.w;x++) if(near(S.at(x,y),fieldFill,2)){n++;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
console.log(`  field fill-colour pixels in y108..152: ${n}  box x${x0}..${x1} y${y0}..${y1} (${x1-x0+1}x${y1-y0+1})`)
// per-row counts to separate the hairline rows from the field body
for(let y=108;y<=152;y++){let k=0,a=1e9,b=-1;for(let x=0;x<S.w;x++) if(near(S.at(x,y),fieldFill,2)){k++;if(x<a)a=x;if(x>b)b=x}
  if(k>0) console.log(`    y${y}: ${String(k).padStart(3)} px  x${a}..${b}`)}
