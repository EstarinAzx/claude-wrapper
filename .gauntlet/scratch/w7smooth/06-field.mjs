import { decode } from './png.mjs'
const I = decode('.gauntlet/waves/core-after-docks/7/sidebar.png')
const J = decode('.gauntlet/waves/core-after-docks/6/sidebar.png')
const GR=[11,15,17], BD=[29,34,35]
const eq=(c,t)=>Math.abs(c[0]-t[0])+Math.abs(c[1]-t[1])+Math.abs(c[2]-t[2])<=3
const span=(I,y,t)=>{let x0=-1,x1=-1;for(let x=0;x<I.w;x++){if(eq(I.at(x,y),t)){if(x0<0)x0=x;x1=x}}return [x0,x1]}
console.log('WAVE 7: rows of the filter band, extent of border-coloured pixels rgb(29,34,35)')
for (const y of [114,115,116,117,118,119,120,123,130,139,140,141,142,143,144,145]) {
  const [a,b]=span(I,y,BD)
  // count contiguous
  let n=0; for(let x=0;x<I.w;x++) if(eq(I.at(x,y),BD)) n++
  console.log(`  y${y}  border-coloured x${a}..${b}  count ${n}`)
}
console.log('\nWAVE 6 same rows:')
for (const y of [114,115,116,130,143,144,145]) {
  const [a,b]=span(J,y,BD); let n=0; for(let x=0;x<J.w;x++) if(eq(J.at(x,y),BD)) n++
  console.log(`  y${y}  border-coloured x${a}..${b}  count ${n}`)
}
console.log('\nWAVE 7 corner detail: rows y115..y124, columns x14..x28 (L = ground, # = border colour, ? = other)')
for (let y=114;y<=126;y++){
  let s=`  y${String(y).padStart(3)} `
  for(let x=12;x<=30;x++){const c=I.at(x,y); s += eq(c,GR)?'.':eq(c,BD)?'#':'?'}
  console.log(s)
}
console.log('\nWAVE 7 bottom corner rows y136..y146, columns x12..x30')
for (let y=136;y<=146;y++){
  let s=`  y${String(y).padStart(3)} `
  for(let x=12;x<=30;x++){const c=I.at(x,y); s += eq(c,GR)?'.':eq(c,BD)?'#':'?'}
  console.log(s)
}
