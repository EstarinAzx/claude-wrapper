import { decode } from './png.mjs'
const B='D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/'
// 1) the session-row mint stripe run length at its own columns
for(const wv of ['2','3']){
  const d=decode(B+wv+'/sidebar.png')
  const out=[]
  for(const x of [6,7,8,9]){
    let runs=[],cur=null
    for(let y=200;y<=320;y++){const o=(y*d.w+x)*4
      const isM = d.data[o]>120&&d.data[o+1]>160&&d.data[o+2]>140 && d.data[o+1]>d.data[o] && d.data[o+1]>d.data[o+2]
      if(isM){if(!cur)cur={y0:y,y1:y};else cur.y1=y}else{if(cur){runs.push(cur);cur=null}}}
    if(cur)runs.push(cur)
    out.push(`x${x}: `+(runs.map(r=>`y${r.y0}..${r.y1}(len${r.y1-r.y0+1})`).join(',')||'none'))
  }
  console.log(`sidebar w${wv} mint stripe: `+out.join('  |  '))
}
// 2) identity floor: distinct mint hues + site count + per-surface share
const MINT=[161,228,214]
function isFullMint(d,i){const o=i*4;return d.data[o]===161&&d.data[o+1]===228&&d.data[o+2]===214}
const surfaces=['welcome','titlebar','sidebar','chat','input-bar']
console.log('\n=== IDENTITY FLOOR (wave 3 core five) ===')
let total=0, worst={s:'',p:0}
const hues=new Map()
for(const s of surfaces){
  const d=decode(B+'3/'+s+'.png')
  let n=0
  // mint-ish = green channel dominant and saturated: count for share
  const seen=new Set()
  for(let i=0;i<d.w*d.h;i++){const o=i*4
    const r=d.data[o],g=d.data[o+1],b=d.data[o+2]
    // saturated mint family: g strictly greatest, chroma > 20
    if(g>r&&g>b&&(g-Math.min(r,b))>20){n++; seen.add(`${r},${g},${b}`)}
  }
  // count how many distinct FULL-strength mints (alpha 255, exact token) appear
  for(const k of seen){ const [r,g,b]=k.split(',').map(Number); if(Math.abs(r-161)<=2&&Math.abs(g-228)<=2&&Math.abs(b-214)<=2) hues.set(k,(hues.get(k)||0)+1) }
  const share=100*n/(d.w*d.h)
  total+=n
  if(share>worst.p)worst={s,p:share}
  console.log(`  ${s.padEnd(12)} ${String(d.w+'x'+d.h).padEnd(10)} mint-family px=${String(n).padStart(6)}  share=${share.toFixed(3)}%`)
}
console.log(`  TOTAL mint-family px across five = ${total}`)
console.log(`  worst-case surface share = ${worst.p.toFixed(3)}% (${worst.s})`)
console.log(`  distinct full-strength mint tuples (within 2/255 of 161,228,214): ${[...hues.keys()].join(' | ')}`)
