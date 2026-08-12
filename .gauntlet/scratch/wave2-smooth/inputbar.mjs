import { decode, px } from './png.mjs'
const D=(w)=>`D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/${w}/`
const ink=(p)=>Math.abs(p[0]-3)+Math.abs(p[1]-6)+Math.abs(p[2]-6)>18
for(const wv of [1,2]){
  const img=decode(D(wv)+'input-bar.png')
  console.log(`\n=== w${wv} input-bar.png ${img.w}x${img.h} — rows and their ink extent ===`)
  const bs=[];let s=-1
  for(let y=0;y<img.h;y++){let n=0
    for(let x=0;x<img.w;x++) if(ink(px(img,x,y)))n++
    if(n>=2){if(s<0)s=y}else if(s>=0){bs.push([s,y-1]);s=-1}}
  if(s>=0)bs.push([s,img.h-1])
  for(const [y0,y1] of bs){
    let a=1e9,b=-1
    for(let y=y0;y<=y1;y++)for(let x=0;x<img.w;x++) if(ink(px(img,x,y))){if(x<a)a=x;if(x>b)b=x}
    const c=(a+b)/2
    console.log(`  y${String(y0).padStart(3)}-${String(y1).padStart(3)}  x${String(a).padStart(4)}..${String(b).padStart(4)}  centre=${c.toFixed(1)}  off-centre=${(c-595.5).toFixed(1)}`)}
}
// in-pill control inset: leftmost non-ground ink INSIDE the pill fill area
{const img=decode(D(2)+'input-bar.png')
 const pillFill=(p)=>p[0]===11&&p[1]===15&&p[2]===17&&p[3]===216
 let a=1e9,b=-1
 for(let y=20;y<=54;y++)for(let x=218;x<=973;x++){const p=px(img,x,y)
   if(!pillFill(p)&&ink(p)){if(x<a)a=x;if(x>b)b=x}}
 console.log(`\nin-pill content ink: x${a}..${b}   pill fill x217..974`)
 console.log(`  left inset = ${a-217}px    right inset = ${974-b}px`)}
