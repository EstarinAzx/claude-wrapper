import { decode, px, hex } from './png.mjs'
const D=(w)=>`D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/${w}/`
// Ink profile: per row, how many px differ from the surface ground by >6 luma.
function profile(img,x0,x1,ground){
  const g=ground
  const out=[]
  for(let y=0;y<img.h;y++){let n=0
    for(let x=x0;x<=x1;x++){const p=px(img,x,y)
      if(Math.abs(p[0]-g[0])+Math.abs(p[1]-g[1])+Math.abs(p[2]-g[2])>18)n++}
    out.push(n)}
  return out
}
// Collapse to bands of consecutive rows with ink.
function bands(prof,thresh=1){
  const b=[];let s=-1
  for(let y=0;y<prof.length;y++){
    if(prof[y]>=thresh){if(s<0)s=y}
    else if(s>=0){b.push([s,y-1]);s=-1}}
  if(s>=0)b.push([s,prof.length-1])
  return b
}
for(const wv of [1,2]){
  const img=decode(D(wv)+'sidebar.png')
  const prof=profile(img,14,233,[11,15,17])
  const bs=bands(prof,2).filter(([a,b])=>b-a>=1)
  console.log(`\n=== w${wv} sidebar.png ink bands (x14..233), ${bs.length} bands ===`)
  console.log(bs.map(([a,b])=>`${a}-${b}(h${b-a+1})`).join(' '))
}
