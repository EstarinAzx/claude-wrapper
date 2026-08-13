// MARK CONTROL. The three mark sites, byte-compared wave 6 -> wave 7. The chat
// avatar sits in a region that REFLOWED, so it is compared both in place and at
// the reflow offset -52.
import { decode, oklch } from './png.mjs'
const cmp=(A,B,x0,x1,y0,y1,dy=0)=>{let n=0;for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const a=A.at(x,y),b=B.at(x,y+dy);if(a[0]!==b[0]||a[1]!==b[1]||a[2]!==b[2])n++}return n}
const hues=(I,x0,x1,y0,y1)=>{let mn=1e9,mx=-1e9,n=0;for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const [r,g,b]=I.at(x,y);const o=oklch(r,g,b);if(o.C<0.05)continue;n++;if(o.H<mn)mn=o.H;if(o.H>mx)mx=o.H}return {n,mn,mx}}
const S=[['titlebar.png','logo-mark',14,35,13,34,0],['welcome.png','welcome-mark',513,556,242,285,0],['chat.png','avatar',211,238,111,138,0],['chat.png','avatar @ -52',211,238,111,138,-52]]
for (const [f,label,x0,x1,y0,y1,dy] of S) {
  const A=decode(`.gauntlet/waves/core-after-docks/6/${f}`)
  const B=decode(`.gauntlet/waves/core-after-docks/7/${f}`)
  const n=cmp(A,B,x0,x1,y0,y1,dy)
  const ha=hues(A,x0,x1,y0,y1)
  console.log(`${label.padEnd(14)} ${f.padEnd(14)} x${x0}..${x1} y${y0}..${y1} dy=${dy}   differing px: ${n}   ${n===0?'IDENTICAL':'DIFFERS'}   w6 chromatic ${ha.n}px hue ${ha.mn.toFixed(2)}..${ha.mx.toFixed(2)} (spread ${(ha.mx-ha.mn).toFixed(2)})`)
}
// no changed pixel in titlebar.png left of x40?
{
  const A=decode('.gauntlet/waves/core-after-docks/6/titlebar.png')
  const B=decode('.gauntlet/waves/core-after-docks/7/titlebar.png')
  console.log(`titlebar.png changed pixels in x0..x39 (mark + its inset): ${cmp(A,B,0,39,0,47)}`)
}
// window-welcome confinement
{
  const A=decode('.gauntlet/waves/core-after-docks/6/window-welcome.png')
  const B=decode('.gauntlet/waves/core-after-docks/7/window-welcome.png')
  console.log(`window-welcome.png changed pixels y0..47: ${cmp(A,B,0,1439,0,47)}   y48..899: ${cmp(A,B,0,1439,48,899)}`)
}
