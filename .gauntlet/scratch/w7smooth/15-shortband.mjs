// Is the short frame byte-identical between the titlebar strip and the cards?
import { decode } from './png.mjs'
const A=decode('.gauntlet/waves/core-after-docks/6/window-session-short.png')
const B=decode('.gauntlet/waves/core-after-docks/7/window-session-short.png')
const rowDiff=(y)=>{let n=0;for(let x=0;x<A.w;x++){const p=(y*A.w+x)*A.ch,q=(y*B.w+x)*B.ch;if(A.px[p]!==B.px[q]||A.px[p+1]!==B.px[q+1]||A.px[p+2]!==B.px[q+2])n++}return n}
let bands=[],cur=null
for(let y=0;y<A.h;y++){const n=rowDiff(y); if(n>0){if(!cur)cur={y0:y,n:0};cur.y1=y;cur.n+=n} else if(cur){bands.push(cur);cur=null}}
if(cur)bands.push(cur)
console.log('window-session-short.png, wave6 vs wave7 at the SAME y (no shift):')
for(const b of bands.slice(0,14)) console.log(`  y${b.y0}..${b.y1} (h=${b.y1-b.y0+1})  ${b.n}px changed`)
console.log(`  ...${bands.length} bands total`)
console.log(`  DATE DIVIDER rows y88..y106 changed pixels: ${(()=>{let n=0;for(let y=88;y<=106;y++)n+=rowDiff(y);return n})()}`)
console.log(`  rows y34..y353 (below titlebar mark, above card 1) changed: ${(()=>{let n=0;for(let y=34;y<=353;y++)n+=rowDiff(y);return n})()}`)
