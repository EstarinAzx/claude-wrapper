import { decode, px } from './png.mjs'
const D=(w)=>`D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/${w}/`
const lin=(c)=>{c/=255;return c<=0.04045?c/12.92:Math.pow((c+0.055)/1.055,2.4)}
const Y=(p)=>0.2126*lin(p[0])+0.7152*lin(p[1])+0.0722*lin(p[2])
// Subpixel band centroid: weight each row by total ink energy above ground.
function centroid(img,x0,x1,y0,y1,gY){let s=0,ws=0
  for(let y=y0;y<=y1;y++){let e=0
    for(let x=x0;x<=x1;x++){const v=Y(px(img,x,y))-gY; if(v>0.004)e+=v}
    s+=e*y; ws+=e}
  return ws>0?s/ws:null}
for(const wv of [1,2]){
  const img=decode(D(wv)+'sidebar.png')
  const gY=Y([11,15,17])
  // meta (timestamp) bands: the recency scan the CSS comment says must stay in line
  const metas = wv===2?[[349,364],[425,440],[500,515],[575,590]]:[[316,331],[374,389],[432,447],[491,506]]
  const cs=metas.map(([a,b])=>centroid(img,16,233,a,b,gY))
  console.log(`w${wv} sidebar meta centroids: ${cs.map(c=>c.toFixed(2)).join(', ')}`)
  const d=cs.slice(1).map((c,i)=>c-cs[i])
  console.log(`     pitch: ${d.map(v=>v.toFixed(2)).join(', ')}   mean=${(d.reduce((a,b)=>a+b,0)/d.length).toFixed(2)}  spread=${(Math.max(...d)-Math.min(...d)).toFixed(2)}`)
}
