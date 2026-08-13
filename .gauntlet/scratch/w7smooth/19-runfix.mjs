// CORRECTION of 18-final.mjs: the field's left-edge straight run must be read as
// "leftmost NON-GROUND pixel", not "leftmost border-coloured pixel" — the
// placeholder glyphs are neither ground nor border and broke the run.
import { decode } from './png.mjs'
const f2=(n)=>n.toFixed(2)
const I=decode('.gauntlet/waves/core-after-docks/7/sidebar.png')
const GR=[11,15,17]
const isGround=(c,k=10)=>Math.abs(c[0]-GR[0])+Math.abs(c[1]-GR[1])+Math.abs(c[2]-GR[2])<=k
const lefts=[]
for(let y=116;y<=143;y++){ let x0=-1; for(let x=8;x<=60;x++) if(!isGround(I.at(x,y))){x0=x;break} lefts.push([y,x0]) }
console.log('field left edge, leftmost NON-GROUND pixel per row:')
console.log('  '+lefts.map(([y,x])=>`y${y}:x${x}`).join(' '))
const minx=Math.min(...lefts.map(l=>l[1]))
let best=0,run=0
for(const [,x] of lefts){ if(x===minx){run++;if(run>best)best=run} else run=0 }
console.log(`  minimum x = ${minx};  STRAIGHT RUN at x${minx} = ${best} of 28 rows = ${f2(best/28*100)}%`)
console.log(`  arc consumes ${(28-best)/2} rows at each end for a declared 8px radius`)
// same for the app's other 8px-radius control housing, the rail session row, as the
// house comparator (74px tall active row)
const rows=[]
for(let y=202;y<=275;y++){ let x0=-1; for(let x=0;x<=60;x++) if(!isGround(I.at(x,y))){x0=x;break} rows.push(x0) }
const m2=Math.min(...rows.filter(v=>v>=0))
let b2=0,r2=0
for(const x of rows){ if(x===m2){r2++;if(r2>b2)b2=r2} else r2=0 }
console.log(`  COMPARATOR rail active row y202..275: min x${m2}, straight run ${b2} of 74 rows = ${f2(b2/74*100)}%`)
