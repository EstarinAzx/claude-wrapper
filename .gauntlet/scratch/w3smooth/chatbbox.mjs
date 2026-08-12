import { decode } from './png.mjs'
const B='D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/'
for(const wv of ['2','3']){
const d = decode(B+wv+'/chat.png')
const OUT=[3,6,6,163]
const isInk=(x,y)=>{const o=(y*d.w+x)*4;return !(d.data[o]===OUT[0]&&d.data[o+1]===OUT[1]&&d.data[o+2]===OUT[2]&&d.data[o+3]===OUT[3])}
let minx=1e9,maxx=-1,miny=1e9,maxy=-1,n=0
const col=new Array(d.w).fill(0)
for(let y=0;y<d.h;y++)for(let x=0;x<d.w;x++)if(isInk(x,y)){col[x]++;if(x<minx)minx=x;if(x>maxx)maxx=x;if(y<miny)miny=y;if(y>maxy)maxy=y;n++}
const cx=(minx+maxx+1)/2
console.log(`chat wave${wv} ${d.w}x${d.h} centre ${d.w/2}: ink x${minx}..${maxx} w=${maxx-minx+1} L=${minx} R=${d.w-1-maxx} asym=${minx-(d.w-1-maxx)} cx=${cx} disp=${(cx-d.w/2).toFixed(2)} inkpx=${n}`)
// rightmost columns occupancy to spot the scrollbar
console.log('  right cols:', col.slice(d.w-14).map((v,i)=>`${d.w-14+i}:${v}`).join(' '))
console.log('  left cols :', col.slice(0,14).map((v,i)=>`${i}:${v}`).join(' '))
}
