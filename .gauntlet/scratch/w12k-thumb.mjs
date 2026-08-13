import { decode, at } from './w8lib.mjs'
const D=(n,f)=>decode(`.gauntlet/waves/core-after-docks/${n}/${f}.png`)
const lum=(p)=>0.2126*p[0]+0.7152*p[1]+0.0722*p[2]
for(const [n,w,x1] of [['w11','11',310],['w12','12',372]]){
  const I=D(w,'input-bar')
  let x0=1e9,X=-1,y0=1e9,Y=-1,cnt=0
  for(let y=66;y<=86;y++)for(let x=240;x<=x1+4;x++){if(lum(at(I,x,y))>95){cnt++;if(x<x0)x0=x;if(x>X)X=x;if(y<y0)y0=y;if(y>Y)Y=y}}
  const tw=x1-243+1, thw=X-x0+1
  console.log(`${n}: thumb bbox x${x0}-${X} (w${thw}) y${y0}-${Y} (h${Y-y0+1}) ink=${cnt}`)
  console.log(`    track x243-${x1} w=${tw} | travel = ${tw}-${thw} = ${tw-thw} | /5 intervals = ${((tw-thw)/5).toFixed(2)}px`)
}
