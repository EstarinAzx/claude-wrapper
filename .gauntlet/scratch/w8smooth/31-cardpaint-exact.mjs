import { decode } from './png.mjs'
const A=decode('.gauntlet/waves/core-after-docks/7/chat.png')
const B=decode('.gauntlet/waves/core-after-docks/8/chat.png')
const eq=(a,b)=>a[0]===b[0]&&a[1]===b[1]&&a[2]===b[2]
// In each card, content before toggle unchanged. Precisely compare old and new rows baseline aligned over new bbox.
const rows=[
 ['c1r1',243,250,280,287,276,292],
 ['c1r2',277,284,303,310,299,315],
 ['c2r1',483,490,499,506,495,511],
 ['c2r2',517,524,522,529,518,534]
]
for(const [lbl,aInk0,aInk1,bInk0,bInk1,by0,by1] of rows){
 const dy=bInk0-aInk0
 let changed=0,oldSame=0,total=0
 // compare NEW 17px visible rectangle to wave7 at same relative position around baseline
 for(let by=by0;by<=by1;by++) for(let x=266;x<=805;x++) {
   const ay=by-dy; total++; if(eq(A.at(x,ay),B.at(x,by)))oldSame++;else changed++
 }
 console.log(`${lbl}: baseline dy ${dy}; new visible 540x17=${total}: changed colour ${changed}, identical ${oldSame}`)
}
// total unique new visible row box pixels = 4 * 9180 (non-overlap)
console.log('All four new visible boxes: 36720 pixels; exact ground paint by row: 8733 + 8684 + 8785 + 8733 = 34935; text/AA 1785.')
