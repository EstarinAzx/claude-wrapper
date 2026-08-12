import { decode, px, hex } from './png.mjs'
const D=(w)=>`D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/${w}/`
const a=decode(D(1)+'chat.png'), b=decode(D(2)+'chat.png')
// Try to match w2's continuation prose band against w1 at various dx/dy offsets.
function score(y0,y1,x0,x1,dx,dy){let s=0,n=0
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
    const p=px(b,x,y), q=px(a,x+dx,y+dy)
    s+=Math.abs(p[0]-q[0])+Math.abs(p[1]-q[1])+Math.abs(p[2]-q[2]); n++}
  return s/n}
console.log('continuation prose band y353-391, x245..980 — mean abs RGB diff vs w1 at offsets:')
for(const dy of [-2,-1,0,1,2]) {
  const row=[]
  for(const dx of [-1,0,1]) row.push(`dx${dx>=0?'+':''}${dx},dy${dy>=0?'+':''}${dy}=${score(353,391,245,980,dx,dy).toFixed(2)}`)
  console.log('  '+row.join('  '))
}
// And the avatar gutter itself: is anything painted at x211..239 in w2 there?
const gut=(img,y0,y1)=>{let n=0;for(let y=y0;y<=y1;y++)for(let x=211;x<=239;x++){const p=px(img,x,y)
  if(Math.abs(p[0]-3)+Math.abs(p[1]-6)+Math.abs(p[2]-6)>18)n++}return n}
console.log('\navatar-gutter ink (x211..239) over the continuation turn y345..400:')
console.log(`  w1=${gut(a,345,400)} px    w2=${gut(b,345,400)} px   <- 0 in w2 = avatar hidden, gutter empty`)
console.log('\nturn-1 avatar gutter y103..145:')
console.log(`  w1=${gut(a,103,145)} px    w2(y111..153)=${gut(b,111,153)} px`)
