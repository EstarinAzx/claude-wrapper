import { decode } from './png.mjs'
const A=decode('.gauntlet/waves/core-after-docks/7/chat.png')
const B=decode('.gauntlet/waves/core-after-docks/8/chat.png')
const cmp=(x0,x1,y0,y1,dy)=>{let n=0;for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const a=A.at(x,y),b=B.at(x,y+dy);if(a[0]!==b[0]||a[1]!==b[1]||a[2]!==b[2])n++}return n}
for (const dy of [0,44]) console.log(`avatar w7 y59..86 vs w8 y${59+dy}..${86+dy}: ${cmp(211,238,59,86,dy)} differing px`)
// whole region above card1: w7 y0..168 vs w8 y44..212
let n=0,t=0
for(let y=0;y<=168;y++)for(let x=0;x<A.w;x++){t++;const a=A.at(x,y),b=B.at(x,y+44);if(a[0]!==b[0]||a[1]!==b[1]||a[2]!==b[2])n++}
console.log(`region above card1: w7 y0..168 vs w8 y44..212 -> ${n} differing of ${t} (${(n/t*100).toFixed(2)}%)`)
// region below card2 bottom (y545): unshifted
let m=0,u=0
for(let y=546;y<A.h;y++)for(let x=0;x<A.w;x++){u++;const a=A.at(x,y),b=B.at(x,y);if(a[0]!==b[0]||a[1]!==b[1]||a[2]!==b[2])m++}
console.log(`region below card2 (y546..${A.h-1}) unshifted: ${m} differing of ${u}`)
// between the two cards, unshifted?
let k=0
for(let y=327;y<=430;y++)for(let x=0;x<A.w;x++){const a=A.at(x,y),b=B.at(x,y);if(a[0]!==b[0]||a[1]!==b[1]||a[2]!==b[2])k++}
console.log(`between cards w8 y327..430 vs w7 same rows: ${k} differing`)
for(const dy of [0,22]){let z=0;for(let y=305;y<=408;y++)for(let x=0;x<A.w;x++){const a=A.at(x,y),b=B.at(x,y+dy);if(a[0]!==b[0]||a[1]!==b[1]||a[2]!==b[2])z++};console.log(`  inter-card prose w7 y305..408 vs w8 +${dy}: ${z}`)}
