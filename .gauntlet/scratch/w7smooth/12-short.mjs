// window-session-short.png: the +52 attribution, the transcript/composer columns
// (the -5px jog control), and the date divider's tracking debt.
import { decode } from './png.mjs'
const f2=(n)=>n.toFixed(2)
const A=decode('.gauntlet/waves/core-after-docks/6/window-session-short.png')
const B=decode('.gauntlet/waves/core-after-docks/7/window-session-short.png')
console.log(`wave6 ${A.w}x${A.h}   wave7 ${B.w}x${B.h}   delta h ${B.h-A.h}`)
// 1. how far down do the two frames agree pixel-for-pixel from the TOP?
let topAgree=0
outer1: for (let y=0;y<Math.min(A.h,B.h);y++){ for(let x=0;x<A.w;x++){const p=(y*A.w+x)*A.ch,q=(y*B.w+x)*B.ch; if(A.px[p]!==B.px[q]||A.px[p+1]!==B.px[q+1]||A.px[p+2]!==B.px[q+2]) break outer1 } topAgree=y+1 }
console.log(`  identical from the top for ${topAgree} rows (y0..y${topAgree-1})`)
// 2. how far up do they agree from the BOTTOM (wave7 row h-1-k vs wave6 row h-1-k)?
let botAgree=0
outer2: for (let k=0;k<Math.min(A.h,B.h);k++){ const ya=A.h-1-k, yb=B.h-1-k; for(let x=0;x<A.w;x++){const p=(ya*A.w+x)*A.ch,q=(yb*B.w+x)*B.ch; if(A.px[p]!==B.px[q]||A.px[p+1]!==B.px[q+1]||A.px[p+2]!==B.px[q+2]) break outer2 } botAgree=k+1 }
console.log(`  identical from the bottom for ${botAgree} rows (w6 y${A.h-botAgree}..${A.h-1} == w7 y${B.h-botAgree}..${B.h-1})`)
// 3. with wave7 shifted UP by 52 in the middle band, do they agree?
let shiftAgree=0
for (let y=0;y<A.h;y++){ let ok=true; for(let x=0;x<A.w;x++){const p=(y*A.w+x)*A.ch,q=((y+52)*B.w+x)*B.ch; if(y+52>=B.h){ok=false;break} if(A.px[p]!==B.px[q]||A.px[p+1]!==B.px[q+1]||A.px[p+2]!==B.px[q+2]){ok=false;break} } if(ok) shiftAgree++ }
console.log(`  rows of wave6 that match wave7 shifted DOWN by 52: ${shiftAgree} / ${A.h}`)

// 4. THE JOG: transcript column and composer pill edges. Scan for long vertical
//    edges by looking at a row inside the transcript and a row inside the composer.
const near=(c,t,k=6)=>Math.abs(c[0]-t[0])+Math.abs(c[1]-t[1])+Math.abs(c[2]-t[2])<=k
const GR=[11,15,17], BD=[29,34,35]
for (const [wv,I] of [[6,A],[7,B]]) {
  // composer pill: the lowest long border-coloured horizontal run
  const runs=[]
  for(let y=I.h-1;y>=I.h-260;y--){ let best=0,cur=0,sx=-1,bx=-1
    for(let x=0;x<I.w;x++){ if(near(I.at(x,y),BD)){ if(cur===0)sx=x; cur++; if(cur>best){best=cur;bx=sx} } else cur=0 }
    if(best>=300) runs.push({y,x0:bx,x1:bx+best-1,len:best}) }
  console.log(`\n  wave ${wv} composer-region border rows (bottom 260):`)
  for(const r of runs.slice(0,6)) console.log(`     y${r.y}  x${r.x0}..${r.x1}  len ${r.len}`)
  // tool card border rows anywhere
  const cards=[]
  for(let y=0;y<I.h;y++){ let best=0,cur=0,sx=-1,bx=-1
    for(let x=0;x<I.w;x++){ if(near(I.at(x,y),BD)){ if(cur===0)sx=x; cur++; if(cur>best){best=cur;bx=sx} } else cur=0 }
    if(best>=300) cards.push({y,x0:bx,x1:bx+best-1,len:best}) }
  console.log(`  wave ${wv} ALL long border rows: ${cards.map(r=>`y${r.y}(x${r.x0}..${r.x1})`).join(' ')}`)
}
