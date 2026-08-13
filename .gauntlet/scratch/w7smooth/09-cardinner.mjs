import { decode } from './png.mjs'
const A=decode('.gauntlet/waves/core-after-docks/6/chat.png')
const B=decode('.gauntlet/waves/core-after-docks/7/chat.png')
// 1. lowest changed row in chat.png
let lo=-1, hi=1e9, cnt=0
for(let y=0;y<A.h;y++) for(let x=0;x<A.w;x++){
  const p=(y*A.w+x)*A.ch
  if(A.px[p]!==B.px[p]||A.px[p+1]!==B.px[p+1]||A.px[p+2]!==B.px[p+2]){ if(y>lo)lo=y; if(y<hi)hi=y; cnt++ }
}
console.log(`chat.png changed rows y${hi}..y${lo}  (${cnt}px).  Card-2 bottom border y545 in BOTH waves.`)
console.log(`  changed pixels strictly BELOW y545: ${(()=>{let n=0;for(let y=546;y<A.h;y++)for(let x=0;x<A.w;x++){const p=(y*A.w+x)*A.ch;if(A.px[p]!==B.px[p]||A.px[p+1]!==B.px[p+1]||A.px[p+2]!==B.px[p+2])n++}return n})()}`)
console.log(`  changed pixels at or below y546 .. y721 = the composer + last message region`)

// 2. card interiors: row ink profile (anything not surface and not border)
const SUR=[17,22,23]
const near=(c,t,k=6)=>Math.abs(c[0]-t[0])+Math.abs(c[1]-t[1])+Math.abs(c[2]-t[2])<=k
for (const [wv,I,cards] of [[6,A,[[221,330],[435,545]]],[7,B,[[169,304],[409,545]]]]) {
  // surface colour probe
  const sc=I.at(400,cards[0][0]+6)
  console.log(`\nwave ${wv} card surface probe rgb(${sc})`)
  for (const [y0,y1] of cards) {
    const prof=[]
    for(let y=y0;y<=y1;y++){ let n=0; for(let x=264;x<=807;x++){ const c=I.at(x,y); if(!near(c,sc,10)) n++ } prof.push({y,n}) }
    const bands=[];let b=null
    for(const r of prof){ if(r.n>0){ if(!b)b={y0:r.y,n:0}; b.y1=r.y; b.n+=r.n } else if(b){bands.push(b);b=null} }
    if(b)bands.push(b)
    console.log(`  CARD y${y0}..${y1} (outer h ${y1-y0+1}, inner h ${y1-y0-1})  ink bands:`)
    for(const r of bands) console.log(`     y${r.y0}..${r.y1}  h=${r.y1-r.y0+1}  ${r.n}px`)
  }
}
