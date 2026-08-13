// (b) THE y202 FENCE + the horizontal-rule count in the pre-list stack.
import { decode } from './png.mjs'
const f2=(n)=>n.toFixed(2)
const modal=(I,x0,x1,y0,y1)=>{const m=new Map();for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const k=I.at(x,y).join(',');m.set(k,(m.get(k)||0)+1)}return [...m.entries()].sort((a,b)=>b[1]-a[1])[0][0].split(',').map(Number)}
const dd=(a,b)=>Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1])+Math.abs(a[2]-b[2])
for (const wv of [5,6,7]) {
  const I = decode(`.gauntlet/waves/core-after-docks/${wv}/sidebar.png`)
  const G = modal(I,4,240,300,700)   // rail ground away from the pre-list stack
  const on=(x,y)=>dd(I.at(x,y),G)>2
  console.log(`\n===== WAVE ${wv} sidebar.png ${I.w}x${I.h}  ground rgb(${G}) =====`)
  // row profile over the pre-list region
  const prof=[]
  for(let y=0;y<Math.min(320,I.h);y++){let n=0;for(let x=0;x<I.w;x++)if(on(x,y))n++;prof.push(n)}
  // horizontal rules = rows whose inked width is >= 70% of the rail AND whose
  // neighbours are near-empty (a rule is 1-2px tall, a filled band is not)
  const rules=[]
  for(let y=1;y<prof.length-1;y++){
    if(prof[y]>=I.w*0.6 && prof[y-1]<I.w*0.4 && prof[y+1]<I.w*0.4) rules.push(y)
  }
  console.log(`  horizontal rules (>=60% width, isolated): y=${rules.join(', ')}`)
  // wide bands (>=60% width) of any thickness
  const bands=[];let b=null
  for(let y=0;y<prof.length;y++){ if(prof[y]>=I.w*0.6){ if(!b)b={y0:y}; b.y1=y } else if(b){bands.push(b);b=null} }
  if(b)bands.push(b)
  console.log(`  wide bands (>=60% width): ${bands.map(r=>`y${r.y0}..${r.y1}(h${r.y1-r.y0+1})`).join(' ')}`)
  // the FILTER INPUT: the filled/rounded field. find contiguous rows in y100..y160
  // where a run of >=180px is non-ground
  let fy0=-1,fy1=-1
  for(let y=90;y<=175;y++){ if(prof[y]>=150){ if(fy0<0)fy0=y; fy1=y } }
  console.log(`  FILTER FIELD rows y${fy0}..y${fy1} (h=${fy1-fy0+1})`)
  if(fy0>=0){
    const midy=Math.round((fy0+fy1)/2)
    let x0=-1,x1=-1
    for(let x=0;x<I.w;x++) if(on(x,midy)){ if(x0<0)x0=x; x1=x }
    console.log(`    at mid row y${midy}: painted x${x0}..${x1} (w=${x1-x0+1})   rgb at x${x0+40} = rgb(${I.at(x0+40,midy)})  ground rgb(${G})`)
  }
  // FIRST SESSION ROW top edge: the first wide band below y180
  const below = bands.filter(r=>r.y0>=175)
  console.log(`  bands below y175: ${below.slice(0,4).map(r=>`y${r.y0}..${r.y1}`).join(' ')}`)
}
