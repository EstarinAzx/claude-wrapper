import { decode, px } from './png.mjs'
const D='D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/2/'
const img=decode(D+'chat.png')
const ink=(p)=>Math.abs(p[0]-3)+Math.abs(p[1]-6)+Math.abs(p[2]-6)>18
let a=1e9,b=-1
for(let y=0;y<img.h;y++)for(let x=0;x<1180;x++) if(ink(px(img,x,y))){if(x<a)a=x;if(x>b)b=x}
console.log(`chat transcript (scrollbar x>=1180 excluded): x${a}..${b} = ${b-a+1}px`)
// scrollbar
let sa=1e9,sb=-1
for(let y=0;y<img.h;y++)for(let x=1180;x<img.w;x++) if(ink(px(img,x,y))){if(x<sa)sa=x;if(x>sb)sb=x}
console.log(`scrollbar: x${sa}..${sb} = ${sb-sa+1}px`)
const ib=decode(D+'input-bar.png')
let ia=1e9,ibb=-1
for(let y=0;y<ib.h;y++)for(let x=0;x<ib.w;x++) if(ink(px(ib,x,y))){if(x<ia)ia=x;if(x>ibb)ibb=x}
console.log(`composer stack: x${ia}..${ibb} = ${ibb-ia+1}px`)
console.log(`\n=> transcript measure ${b-a+1}px vs composer measure ${ibb-ia+1}px; left offset ${ia-a}px = scrollbar gutter`)
