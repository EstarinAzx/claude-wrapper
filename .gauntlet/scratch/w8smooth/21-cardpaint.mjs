import { decode } from './png.mjs'
const A=decode('.gauntlet/waves/core-after-docks/7/chat.png')
const B=decode('.gauntlet/waves/core-after-docks/8/chat.png')
const eq=(a,b)=>a[0]===b[0]&&a[1]===b[1]&&a[2]===b[2]
// compare each card's own box after aligning top-left; common outer width x254..817
const pairs=[['card1',169,304,213,326],['card2',409,545,431,545]]
for(const [lbl,ay0,ay1,by0,by1] of pairs){
  const h=Math.min(ay1-ay0+1,by1-by0+1)
  let n=0
  for(let dy=0;dy<h;dy++)for(let x=254;x<=817;x++)if(!eq(A.at(x,ay0+dy),B.at(x,by0+dy)))n++
  console.log(`${lbl}: aligned at top, common h ${h}: ${n} differing px of ${h*564}`)
  // compare from bottom
  const hb=h;let m=0
  for(let k=0;k<hb;k++)for(let x=254;x<=817;x++)if(!eq(A.at(x,ay1-k),B.at(x,by1-k)))m++
  console.log(`${lbl}: aligned at bottom, common h ${h}: ${m} differing px`)
}
// Visible pixels that changed colour in the disclosure-row elements, comparing w7 row box against w8 row box by content alignment.
// w7 row boxes are 28px each (estimated y233..260 and y267..294), w8 exact visible boxes y276..292 and 299..315.
// Compare same absolute x and align label ink baselines: row1 w7 label y243..250 vs w8 y280..287 => dy +37; row2 +26.
const rows=[['c1 row1',233,260,276,292,37],['c1 row2',267,294,299,315,26],['c2 row1',473,500,495,511,12],['c2 row2',507,534,518,534,11]]
for(const [lbl,ay0,ay1,by0,by1,dy] of rows){
  let changed=0, paintChanged=0, compared=0, same=0
  for(let ay=ay0;ay<=ay1;ay++){const by=ay+dy;if(by<by0||by>by1)continue;for(let x=266;x<=805;x++){compared++;const a=A.at(x,ay),b=B.at(x,by);if(eq(a,b))same++;else changed++;}}
  console.log(`${lbl}: baseline-aligned overlap ${compared}px, colour-changed ${changed}, identical ${same}`)
}
// exact w8 ground footprint by exact modal fill/border colors within 4 rows
for(const [lbl,y0,y1] of [['c1 row1',276,292],['c1 row2',299,315],['c2 row1',495,511],['c2 row2',518,534]]){
  const F=[8,12,14],D=[25,29,31];let f=0,d=0,o=0
  for(let y=y0;y<=y1;y++)for(let x=266;x<=805;x++){const c=B.at(x,y);if(eq(c,F))f++;else if(eq(c,D))d++;else o++}
  console.log(`${lbl}: box ${540}x${y1-y0+1}=${540*(y1-y0+1)}  fill-exact ${f} border-exact ${d} other(text/AA) ${o} ground ${f+d}`)
}
