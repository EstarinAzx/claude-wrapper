import { decode, oklch } from './png.mjs'
const f=n=>(n>=0?'+':'')+n.toFixed(4)
const S=decode('.gauntlet/waves/core-after-docks/8/sidebar.png')
const C=decode('.gauntlet/waves/core-after-docks/8/chat.png')
const dsc=(lbl,rgb)=>{const o=oklch(...rgb);return `${lbl} rgb(${rgb.join(',')}) L=${o.L.toFixed(4)}`}

// ---- RAIL FILTER FIELD ----
const railGround=S.at(120,100)          // rail ground above the field
console.log('RAIL')
console.log(' ',dsc('rail ground   ',railGround))
// find the field box: pixels differing from rail ground in the band y110..150
const near=(c,t,k)=>Math.abs(c[0]-t[0])+Math.abs(c[1]-t[1])+Math.abs(c[2]-t[2])<=k
let x0=1e9,x1=-1,y0=1e9,y1=-1,n=0
for(let y=105;y<=160;y++)for(let x=0;x<S.w;x++){const c=S.at(x,y); if(!near(c,railGround,4)){n++;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}}
console.log(`  field-band non-ground extent x${x0}..${x1} y${y0}..${y1} (${x1-x0+1}x${y1-y0+1}) px=${n}`)
const fieldFill=S.at(200,130)
console.log(' ',dsc('field fill    ',fieldFill),`  L step ${f(oklch(...fieldFill).L-oklch(...railGround).L)}  RGB delta ${fieldFill.map((v,i)=>v-railGround[i]).join(',')}`)
// count ground pixels of the field only (fill colour)
let fillN=0,fx0=1e9,fx1=-1,fy0=1e9,fy1=-1
for(let y=105;y<=160;y++)for(let x=0;x<S.w;x++){const c=S.at(x,y); if(near(c,fieldFill,3)){fillN++;if(x<fx0)fx0=x;if(x>fx1)fx1=x;if(y<fy0)fy0=y;if(y>fy1)fy1=y}}
console.log(`  field FILL pixels ${fillN}  box x${fx0}..${fx1} y${fy0}..${fy1} (${fx1-fx0+1}x${fy1-fy0+1})`)
// corner radius probe: top-left
console.log('  field top-left corner (.=rail ground, #=fill, ?=other) x14..x30 y116..y126:')
for(let y=116;y<=126;y++){let s='';for(let x=14;x<=30;x++){const c=S.at(x,y);s+=near(c,railGround,3)?'.':near(c,fieldFill,3)?'#':'?'}console.log(`   y${y} ${s}`)}
// how many rows deep does the fill inset on the first column?
let firstCol=-1; for(let x=0;x<S.w;x++){ if(near(S.at(x,130),fieldFill,3)){firstCol=x;break} }
console.log(`  field left edge at y-mid: x${firstCol}`)

// ---- TOOL CARD ROW ----
console.log('\nCARD')
const cardSurf=C.at(400,220)
console.log(' ',dsc('card surface  ',cardSurf))
const rowFill=C.at(700,284), rowBorder=C.at(700,276)
console.log(' ',dsc('row fill      ',rowFill),`  L step ${f(oklch(...rowFill).L-oklch(...cardSurf).L)}  RGB delta ${rowFill.map((v,i)=>v-cardSurf[i]).join(',')}`)
console.log(' ',dsc('row border    ',rowBorder),`  L step ${f(oklch(...rowBorder).L-oklch(...cardSurf).L)}  RGB delta ${rowBorder.map((v,i)=>v-cardSurf[i]).join(',')}`)
let rfN=0
for(let y=270;y<=320;y++)for(let x=256;x<=815;x++) if(near(C.at(x,y),rowFill,3)) rfN++
let rbN=0
for(let y=270;y<=320;y++)for(let x=256;x<=815;x++) if(near(C.at(x,y),rowBorder,3)) rbN++
console.log(`  card1 both rows: FILL pixels ${rfN}   BORDER pixels ${rbN}   total ground ${rfN+rbN}`)
