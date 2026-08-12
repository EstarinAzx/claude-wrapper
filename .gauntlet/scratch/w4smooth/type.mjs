import { decode } from './png.mjs'
const B = 'D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/'

console.log('=== ONE TYPE SCALE: every authored font-size against 15 * 1.15^k ===')
const SIZES=[
  ['--fs-micro (11px)',11,64],['--fs-ui (13px)',13,42],['--fs-body (15px)',15,14],
  ['calc(body*1.15) = 17.25px',17.25,4],['calc(body*1.15*1.15) = 19.8375px',19.8375,2],
  ['20px literal (subagent.css:168)',20,2],['--fs-display (46px)',46,2],
]
let maxDev=0, off=0
for (const [name,v,uses] of SIZES) {
  let bestK=null,bestD=1e9
  for(let k=-6;k<=12;k++){const r=15*Math.pow(1.15,k);const dd=Math.abs(v-r);if(dd<bestD){bestD=dd;bestK=k}}
  const rung=15*Math.pow(1.15,bestK)
  if(bestD>maxDev)maxDev=bestD
  if(bestD>0.35)off++
  console.log(`  ${name.padEnd(34)} uses=${String(uses).padStart(2)}  nearest rung k=${String(bestK).padStart(2)} = ${rung.toFixed(4)}  dev=${bestD.toFixed(4)}px  ${bestD>0.35?'OFF-LADDER':'on ladder'}`)
}
console.log(`  MAX DEVIATION = ${maxDev.toFixed(3)}px   tolerance 0.35px   off-ladder count = ${off}`)
console.log(`  distinct authored sizes = ${SIZES.length}; distinct rungs occupied = ${new Set(SIZES.map(([,v])=>{let bk=null,bd=1e9;for(let k=-6;k<=12;k++){const dd=Math.abs(v-15*Math.pow(1.15,k));if(dd<bd){bd=dd;bk=k}}return bk})).size}`)

console.log('\n=== BASELINE PITCH measured from pixels (15 * 1.6 = 24.0px expected) ===')
function pitch(file,x0,x1,y0,y1,label,thr){
  const d=decode(B+'4/'+file)
  const light=(x,y)=>{const o=(y*d.w+x)*4;return d.data[o]>thr&&d.data[o+1]>thr}
  const rows=[]
  for(let y=y0;y<=y1;y++){let n=0;for(let x=x0;x<=x1;x++)if(light(x,y))n++;rows.push({y,n})}
  const bands=[];let cur=null
  for(const r of rows){if(r.n>0){if(!cur)cur={y0:r.y,y1:r.y};else cur.y1=r.y}else{if(cur){bands.push(cur);cur=null}}}
  if(cur)bands.push(cur)
  const tops=bands.map(b=>b.y0)
  const gaps=tops.slice(1).map((t,i)=>t-tops[i])
  console.log(`  ${label}`)
  console.log(`     ${bands.length} line bands: ${bands.map(b=>`y${b.y0}..${b.y1}(h${b.y1-b.y0+1})`).join(' ')}`)
  console.log(`     top-to-top pitches: [${gaps.join(', ')}]  ${gaps.length?`mean=${(gaps.reduce((a,b)=>a+b,0)/gaps.length).toFixed(2)}px`:''}`)
}
pitch('chat.png',515,970,13,120,'chat.png user bubble text column x515..970',90)
pitch('chat.png',250,970,300,470,'chat.png assistant column x250..970 y300..470',90)
pitch('sidebar.png',12,235,300,700,'sidebar.png rail rows x12..235 y300..700',90)

console.log('\n=== chat.png BOTTOM EDGE: is anything clipped at y720? ===')
{
  const d=decode(B+'4/chat.png')
  const BG=[3,6,6,163]
  const isInk=(x,y)=>{const o=(y*d.w+x)*4;let dd=0;for(let c=0;c<4;c++)dd+=Math.abs(d.data[o+c]-BG[c]);return dd>0}
  for(let y=d.h-12;y<d.h;y++){
    let l=-1,r=-1,n=0
    for(let x=0;x<d.w;x++)if(isInk(x,y)){if(l<0)l=x;r=x;n++}
    console.log(`   y=${y}  ${n?`x${l}..${r} w=${r-l+1} n=${n}`:'(empty)'}`)
  }
}
