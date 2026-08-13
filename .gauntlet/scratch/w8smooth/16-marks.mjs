import { decode, oklch } from './png.mjs'
const cmp=(A,B,x0,x1,y0,y1,dy=0)=>{let n=0;for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const a=A.at(x,y),b=B.at(x,y+dy);if(a[0]!==b[0]||a[1]!==b[1]||a[2]!==b[2])n++}return n}
const hues=(I,x0,x1,y0,y1)=>{let mn=1e9,mx=-1e9,n=0;for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const [r,g,b]=I.at(x,y);const o=oklch(r,g,b);if(o.C<0.05)continue;n++;if(o.H<mn)mn=o.H;if(o.H>mx)mx=o.H}return {n,mn,mx}}
// chat avatar reflowed: wave7 card1 top y169 -> wave8 y213, so content ABOVE the cards is unmoved.
const S=[
 ['titlebar.png','logo-mark',14,35,13,34,0],
 ['welcome.png','welcome-mark',513,556,242,285,0],
 ['welcome-min-window.png','welcome-mark(min)',0,639,0,431,0],
 ['chat.png','avatar1',211,238,59,86,0],
 ['chat.png','avatar2',211,238,103,130,0],
]
for (const [f,label,x0,x1,y0,y1,dy] of S) {
  const A=decode(`.gauntlet/waves/core-after-docks/7/${f}`)
  const B=decode(`.gauntlet/waves/core-after-docks/8/${f}`)
  const n=cmp(A,B,x0,x1,y0,y1,dy)
  const ha=hues(B,x0,x1,y0,y1)
  console.log(`${label.padEnd(18)} ${f.padEnd(24)} x${x0}..${x1} y${y0}..${y1}  diff ${n} ${n===0?'IDENTICAL':'DIFFERS'}   w8 chromatic ${ha.n}px hue ${ha.mn===1e9?'-':ha.mn.toFixed(2)+'..'+ha.mx.toFixed(2)}`)
}
{
  const A=decode('.gauntlet/waves/core-after-docks/7/titlebar.png')
  const B=decode('.gauntlet/waves/core-after-docks/8/titlebar.png')
  console.log(`titlebar.png changed px in x0..x154 (mark + inset + name): ${cmp(A,B,0,154,0,47)}`)
  console.log(`titlebar.png changed px in x276..1439 (right of the group): ${cmp(A,B,276,1439,0,47)}`)
}
