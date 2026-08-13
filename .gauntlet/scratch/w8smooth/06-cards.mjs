// Tool cards: find them by their 1px border rgb(29,34,35) rounded rect on the
// transcript ground, then report box, height and the disclosure rows inside.
import { decode } from './png.mjs'
const BD=[29,34,35]
const near=(c,t,k=6)=>Math.abs(c[0]-t[0])+Math.abs(c[1]-t[1])+Math.abs(c[2]-t[2])<=k
for (const wv of [6,7,8]) {
  const I = decode(`.gauntlet/waves/core-after-docks/${wv}/chat.png`)
  console.log(`\n===== WAVE ${wv} chat.png ${I.w}x${I.h} =====`)
  // horizontal border runs: rows with a long contiguous run of border colour
  const rows=[]
  for (let y=0;y<I.h;y++){
    let best=0,cur=0,sx=-1,bx=-1
    for(let x=0;x<I.w;x++){ if(near(I.at(x,y),BD)){ if(cur===0)sx=x; cur++; if(cur>best){best=cur;bx=sx} } else cur=0 }
    if(best>=300) rows.push({y,len:best,x0:bx,x1:bx+best-1})
  }
  for (const r of rows) console.log(`  border row y${r.y}  x${r.x0}..${r.x1}  len ${r.len}`)
  // pair them into cards
  for (let i=0;i+1<rows.length;i+=2){
    const a=rows[i],b=rows[i+1]
    // vertical extent of the left border column
    console.log(`  -> CARD box x${a.x0-8}..${a.x1+8}  y${a.y}..${b.y}   height ${b.y-a.y+1}px`)
  }
}
