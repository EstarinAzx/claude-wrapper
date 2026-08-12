import { decode, px } from './png.mjs'
const D=(w)=>`D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/${w}/`
function profile(img,x0,x1,g){const out=[]
  for(let y=0;y<img.h;y++){let n=0
    for(let x=x0;x<=x1;x++){const p=px(img,x,y)
      if(Math.abs(p[0]-g[0])+Math.abs(p[1]-g[1])+Math.abs(p[2]-g[2])>18)n++}
    out.push(n)}
  return out}
function bands(prof,t=2){const b=[];let s=-1
  for(let y=0;y<prof.length;y++){if(prof[y]>=t){if(s<0)s=y}else if(s>=0){b.push([s,y-1]);s=-1}}
  if(s>=0)b.push([s,prof.length-1]);return b}
for(const wv of [1,2]){
  const img=decode(D(wv)+'chat.png')
  const bs=bands(profile(img,200,980,[3,6,6]),3).filter(([a,b])=>b-a>=1)
  console.log(`\n=== w${wv} chat.png bands (x200..980) ===`)
  let prev=null
  for(const [a,b] of bs){console.log(`  ${String(a).padStart(3)}-${String(b).padStart(3)} h${String(b-a+1).padStart(3)}${prev!==null?`   gap-above=${a-prev-1}`:''}`);prev=b}
}
