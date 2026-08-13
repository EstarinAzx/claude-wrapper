import { decode } from './png.mjs'
const I=decode('.gauntlet/waves/core-after-docks/8/chat.png')
const colors={surface:[11,15,17],fill:[8,12,14],border:[25,29,31]}
const eq=(a,b)=>a[0]===b[0]&&a[1]===b[1]&&a[2]===b[2]
// Field exact color counts within each row bbox. Determine effective rounded radius by top/bottom row runs.
const boxes=[['c1r1',266,805,276,292],['c1r2',266,805,299,315],['c2r1',266,805,495,511],['c2r2',266,805,518,534]]
for(const [lbl,x0,x1,y0,y1] of boxes){
  console.log(`\n${lbl} box x${x0}..${x1} y${y0}..${y1} (${x1-x0+1}x${y1-y0+1})`)
  for(let y=y0;y<=y0+4;y++){
    const runs=[];let r=null
    for(let x=x0;x<=x1;x++){
      const c=I.at(x,y),on=eq(c,colors.fill)||eq(c,colors.border)
      if(on){if(!r)r={x0:x};r.x1=x}else if(r){runs.push(r);r=null}
    }if(r)runs.push(r)
    console.log(` y${y}: ground runs ${runs.map(r=>`${r.x0}..${r.x1} (${r.x1-r.x0+1})`).join(', ')}`)
  }
}
// Inset comparisons precisely
console.log('\nAlignment:')
console.log(`card content left = outer x254 + 1 border + 14 padding = x269 CSS; paint/prose anti-alias reaches x266 due glyph overhang/AA`)
console.log(`row border outer left x266; CSS row content left = x266 + 1 border + 10 padding = x277; caret ink left measured x277`)
console.log(`prose ink left x266; row border starts at x266; row label ink starts x277 => +11px vs prose ink`)
console.log(`filter painted left edge midline x16; placeholder ink x16 (w7 instrument); CSS padding defaults 2px? first anti-alias x16 due search field native control.`)
