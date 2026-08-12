import { decode, px } from './png.mjs'
const D=(w)=>`D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/${w}/`
const ink=(p,g=[3,6,6])=>Math.abs(p[0]-g[0])+Math.abs(p[1]-g[1])+Math.abs(p[2]-g[2])>18
function bandsIn(img,x0,x1,t=3){const b=[];let s=-1
  for(let y=0;y<img.h;y++){let n=0
    for(let x=x0;x<=x1;x++) if(ink(px(img,x,y)))n++
    if(n>=t){if(s<0)s=y}else if(s>=0){b.push([s,y-1]);s=-1}}
  if(s>=0)b.push([s,img.h-1]);return b}
// leftmost ink column within a y range, excluding the avatar gutter question
function leftEdge(img,y0,y1,xa=200,xb=980){
  let m=1e9
  for(let y=y0;y<=y1;y++)for(let x=xa;x<=xb;x++) if(ink(px(img,x,y))){if(x<m)m=x;break}
  return m}
for(const wv of [1,2]){
  const img=decode(D(wv)+'chat.png')
  console.log(`\n=== w${wv} PROSE-ONLY bands, x252..980 (avatar gutter 211-239 excluded) ===`)
  const bs=bandsIn(img,252,980).filter(([a,b])=>b-a>=1)
  let prev=null
  for(const [a,b] of bs){console.log(`  ${String(a).padStart(3)}-${String(b).padStart(3)} h${String(b-a+1).padStart(3)}${prev!==null?`  gap=${a-prev-1}`:''}`);prev=b}
}
console.log('\n=== avatar gutter: leftmost prose ink per turn ===')
for(const wv of [1,2]){
  const img=decode(D(wv)+'chat.png')
  const t1 = wv===1?[155,169]:[163,177]      // turn-1 prose line (has visible avatar)
  const t2 = wv===1?[380,391]:[353,367]      // continuation prose after card #1
  console.log(`w${wv}: turn-1 prose left=${leftEdge(img,t1[0],t1[1])}  continuation prose left=${leftEdge(img,t2[0],t2[1])}`)
}
