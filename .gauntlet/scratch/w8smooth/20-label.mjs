import { decode } from './png.mjs'
const near=(c,t,k)=>Math.abs(c[0]-t[0])+Math.abs(c[1]-t[1])+Math.abs(c[2]-t[2])<=k
const I=decode('.gauntlet/waves/core-after-docks/8/chat.png')
const fill=I.at(700,284), border=I.at(700,276), card=I.at(400,220)
const bands=[[`c1 prose1`,228,241,260,800,card],[`c1 prose2`,253,266,260,800,card],[`row1`,280,287,270,790,fill],[`row2`,303,310,270,790,fill],[`c2 prose1`,446,458,260,800,card],[`c2 prose2`,472,485,260,800,card],[`row1`,499,506,270,790,fill],[`row2`,522,529,270,790,fill]]
for(const [lbl,y0,y1,xs,xe,g] of bands){
  const cols=[]
  for(let x=xs;x<=xe;x++){let n=0;for(let y=y0;y<=y1;y++){const c=I.at(x,y);if(!near(c,g,12))n++}cols.push([x,n])}
  const runs=[];let r=null
  for(const [x,n] of cols){if(n){if(!r)r={x0:x,n:0};r.x1=x;r.n+=n}else if(r){runs.push(r);r=null}}
  if(r)runs.push(r)
  console.log(`${lbl.padEnd(12)} y${y0}..${y1}: ${runs.map(r=>`x${r.x0}..${r.x1}(${r.n})`).join(' ')}`)
}
console.log('\nrow1 y280..287 raw columns x266..290:')
for(let x=266;x<=300;x++){let vals=[];for(let y=280;y<=287;y++){const c=I.at(x,y);if(!near(c,fill,12)) vals.push(`${y}:${c.join('/')}`)};if(vals.length)console.log(` x${x} ${vals.join(' ')}`)}
