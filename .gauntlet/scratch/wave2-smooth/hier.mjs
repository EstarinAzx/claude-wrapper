import { decode, px, hex } from './png.mjs'
const D=(w)=>`D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/${w}/`
const lin=(c)=>{c/=255;return c<=0.04045?c/12.92:Math.pow((c+0.055)/1.055,2.4)}
const Y=(p)=>0.2126*lin(p[0])+0.7152*lin(p[1])+0.0722*lin(p[2])
const cr=(a,b)=>{const l1=Math.max(Y(a),Y(b)),l2=Math.min(Y(a),Y(b));return (l1+0.05)/(l2+0.05)}
// brightest (most opaque) text pixel = the glyph core; ground sampled nearby
function textStats(img,x0,y0,x1,y1,gx,gy){
  const hist=new Map(); let top=null
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const p=px(img,x,y)
    const k=hex(p); hist.set(k,(hist.get(k)||0)+1)
    if(!top||Y(p)>Y(top))top=p}
  // ink band extent
  let ya=1e9,yb=-1
  const g=px(img,gx,gy)
  for(let y=y0;y<=y1;y++){let n=0
    for(let x=x0;x<=x1;x++){const p=px(img,x,y); if(Y(p)>Y(g)*3+0.004)n++}
    if(n>0){if(y<ya)ya=y; yb=y}}
  return {top,ground:g,inkTop:ya,inkBot:yb,inkH:yb-ya+1,contrast:cr(top,g)}
}
const S=[
 [2,'titlebar.png','Titlebar .session-title (15px, --text-muted)',600,10,840,38,1100,24],
 [1,'titlebar.png','Titlebar .session-title (13px BASELINE)',600,10,840,38,1100,24],
 [2,'sidebar.png','Sidebar .session-row-title L1 (13px, --text)',16,312,232,326,240,300],
 [2,'sidebar.png','Sidebar .session-row-meta (11px, --text-faint)',16,353,232,361,240,300],
 [2,'chat.png','Chat prose line (15px, --text)',252,163,900,178,1000,170]]
for(const [wv,f,name,x0,y0,x1,y1,gx,gy] of S){
  const img=decode(D(wv)+f); const s=textStats(img,x0,y0,x1,y1,gx,gy)
  console.log(`w${wv} ${name}`)
  console.log(`     ink y${s.inkTop}..${s.inkBot} (h=${s.inkH})  glyph-core=${hex(s.top)}  ground=${hex(s.ground)}  contrast=${s.contrast.toFixed(2)}:1`)
}
