import { decode, oklch } from './png.mjs'
const I8=decode('.gauntlet/waves/core-after-docks/8/chat.png')
const I7=decode('.gauntlet/waves/core-after-docks/7/chat.png')
const I6=decode('.gauntlet/waves/core-after-docks/6/chat.png')
const f=n=>n.toFixed(4)
const show=(lbl,rgb)=>{const o=oklch(...rgb);console.log(`  ${lbl.padEnd(22)} rgb(${rgb.join(',')})  L=${f(o.L)} C=${f(o.C)} H=${o.H.toFixed(1)}`)}
console.log('== WAVE 8 card 1, row 1: y276..292 x266..805 ==')
const card=I8.at(400,220)            // card surface well away from the row
show('card surface', card)
// sample the row fill: interior rows, columns to the right of the label text
const fill=I8.at(700,284); show('row fill @x700,y284', fill)
show('row fill @x500,y280', I8.at(500,280))
show('row border top @x700', I8.at(700,276))
show('row border left @y284', I8.at(266,284))
const dL=oklch(...fill).L-oklch(...card).L
console.log(`  OKLCH L step (row fill over card surface): ${dL>=0?'+':''}${f(dL)}   RGB delta ${fill.map((v,i)=>v-card[i]).join(',')}`)
const bd=I8.at(700,276), dLb=oklch(...bd).L-oklch(...card).L
console.log(`  OKLCH L step (row border over card surface): ${dLb>=0?'+':''}${f(dLb)}`)

// corner probing: is the border rounded? scan the top-left 6x6 of the row box
console.log('\n  top-left corner 8x6 (B=border-ish, f=fill, .=card surface):')
const cls=(c)=>{const d=(a,b)=>Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1])+Math.abs(a[2]-b[2]); if(d(c,bd)<=8)return 'B'; if(d(c,fill)<=4)return 'f'; if(d(c,card)<=4)return '.'; return '?'}
for(let y=274;y<=281;y++){let s='';for(let x=263;x<=274;x++)s+=cls(I8.at(x,y));console.log(`   y${y}: ${s}`)}
console.log('\n  bottom-right corner:')
for(let y=287;y<=294;y++){let s='';for(let x=798;x<=808;x++)s+=cls(I8.at(x,y));console.log(`   y${y}: ${s}`)}

// text band inside the row, using row fill as ground
const textBand=(I,y0,y1,x0,x1,g)=>{
  const near=(c,t,k)=>Math.abs(c[0]-t[0])+Math.abs(c[1]-t[1])+Math.abs(c[2]-t[2])<=k
  let ty0=1e9,ty1=-1,tx0=1e9,tx1=-1,n=0
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const c=I.at(x,y); if(!near(c,g,14)){n++;if(y<ty0)ty0=y;if(y>ty1)ty1=y;if(x<tx0)tx0=x;if(x>tx1)tx1=x}}
  return {ty0,ty1,tx0,tx1,n}
}
console.log('\n== label text extents (row interior only, row fill as ground) ==')
for(const [lbl,y0,y1] of [['w8 c1 row1',277,291],['w8 c1 row2',300,314],['w8 c2 row1',496,510],['w8 c2 row2',519,533]]){
  const t=textBand(I8,y0,y1,267,804,fill)
  console.log(`  ${lbl}: text y${t.ty0}..${t.ty1} (h=${t.ty1-t.ty0+1}) x${t.tx0}..${t.tx1} (w=${t.tx1-t.tx0+1}) ink=${t.n}`)
}
const cardSurf7=I7.at(400,180), cardSurf6=I6.at(400,230)
console.log('\n== wave 7 / 6 same labels (card surface as ground) ==')
for(const [lbl,I,g,y0,y1] of [['w7 c1 row1',I7,cardSurf7,240,254],['w7 c1 row2',I7,cardSurf7,274,288],['w6 c1 row1',I6,cardSurf6,285,299],['w6 c1 row2',I6,cardSurf6,306,320]]){
  const t=textBand(I,y0,y1,260,810,g)
  console.log(`  ${lbl}: text y${t.ty0}..${t.ty1} (h=${t.ty1-t.ty0+1}) x${t.tx0}..${t.tx1} (w=${t.tx1-t.tx0+1}) ink=${t.n}`)
}
