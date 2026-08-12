import { decode, px } from './png.mjs'
const D=(w)=>`D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/${w}/`
const ink=(p,g)=>Math.abs(p[0]-g[0])+Math.abs(p[1]-g[1])+Math.abs(p[2]-g[2])>18
// per band, leftmost and rightmost ink column
function extent(img,y0,y1,g){let a=1e9,b=-1
  for(let y=y0;y<=y1;y++)for(let x=0;x<img.w;x++) if(ink(px(img,x,y),g)){if(x<a)a=x;if(x>b)b=x}
  return {a,b,w:b-a+1}}
function bands(img,g,t=2){const r=[];let s=-1
  for(let y=0;y<img.h;y++){let n=0
    for(let x=0;x<img.w;x++) if(ink(px(img,x,y),g))n++
    if(n>=t){if(s<0)s=y}else if(s>=0){r.push([s,y-1]);s=-1}}
  if(s>=0)r.push([s,img.h-1]);return r}
for(const [wv,f] of [[1,'welcome.png'],[2,'welcome.png'],[1,'welcome-min-window.png'],[2,'welcome-min-window.png']]){
  const img=decode(D(wv)+f); const g=[3,6,6]
  const bs=bands(img,g).filter(([a,b])=>b-a>=2)
  console.log(`\n=== w${wv} ${f} (${img.w}px wide) ===`)
  let mn=1e9,mx=-1
  for(const [y0,y1] of bs){const e=extent(img,y0,y1,g)
    if(e.a<mn)mn=e.a; if(e.b>mx)mx=e.b
    console.log(`  y${String(y0).padStart(3)}-${String(y1).padStart(3)}  x${String(e.a).padStart(4)}..${String(e.b).padStart(4)}  w=${String(e.w).padStart(4)}`)}
  console.log(`  BLOCK x${mn}..${mx} w=${mx-mn+1}   margins: left=${mn} right=${img.w-1-mx}   delta=${Math.abs(mn-(img.w-1-mx))}`)
}
