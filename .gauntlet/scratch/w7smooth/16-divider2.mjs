// (c) THE DATE DIVIDER, measured with the rule row EXCLUDED from the label scan
// so no label pixel can be mistaken for a rule end and vice versa.
import { decode } from './png.mjs'
const f2=(n)=>n.toFixed(2)
const COL_L=464, COL_R=1223
for (const wv of [6,7]) {
  const I=decode(`.gauntlet/waves/core-after-docks/${wv}/window-session-short.png`)
  const BD=[3,6,6]
  const d=(x,y)=>{const [r,g,b]=I.at(x,y);return Math.abs(r-BD[0])+Math.abs(g-BD[1])+Math.abs(b-BD[2])}
  const on=(x,y,thr=2)=>d(x,y)>thr
  console.log(`\n===== WAVE ${wv} =====`)
  // row y96 full run list
  const runs=[];let cur=0
  for(let x=COL_L;x<=COL_R;x++){ if(on(x,96))cur++; else { if(cur>0)runs.push([x-cur,x-1,cur]); cur=0 } }
  if(cur>0)runs.push([COL_R-cur+1,COL_R,cur])
  console.log(`  y96 runs: ${runs.map(r=>`x${r[0]}..${r[1]}(${r[2]})`).join(' ')}`)
  // LABEL: rows y93..y100 EXCLUDING y96 entirely
  let L=1e9,R=-1,T=1e9,B=-1,n=0
  for(let y=90;y<=104;y++){ if(y===96) continue
    for(let x=COL_L;x<=COL_R;x++) if(on(x,y,6)){n++;if(x<L)L=x;if(x>R)R=x;if(y<T)T=y;if(y>B)B=y} }
  console.log(`  LABEL ink (rule row excluded) x${L}..${R} w=${R-L+1}  y${T}..${B} h=${B-T+1}  ${n}px`)
  const labMid=(L+R+1)/2, colMid=(COL_L+COL_R+1)/2
  console.log(`    label ink midpoint ${f2(labMid)}   column centre ${f2(colMid)}   DISPLACEMENT ${f2(labMid-colMid)}px`)
  // GAP: the two long rule segments, and the clear span between them measured
  // on the rule row but ignoring any pixel that the label also occupies.
  const labelCols=new Set()
  for(let y=90;y<=104;y++){ if(y===96) continue; for(let x=COL_L;x<=COL_R;x++) if(on(x,y,6)) labelCols.add(x) }
  const runs2=[];let c2=0
  for(let x=COL_L;x<=COL_R;x++){ const lit=on(x,96)&&!labelCols.has(x); if(lit)c2++; else{ if(c2>0)runs2.push([x-c2,x-1,c2]); c2=0 } }
  if(c2>0)runs2.push([COL_R-c2+1,COL_R,c2])
  const big=runs2.filter(r=>r[2]>=100)
  console.log(`  RULE segments (label columns removed): ${big.map(r=>`x${r[0]}..${r[1]} (${r[2]}px)`).join('  ')}`)
  if(big.length===2){
    console.log(`    left ${big[0][2]}px  right ${big[1][2]}px  asymmetry ${big[1][2]-big[0][2]}px`)
    const g0=big[0][1]+1,g1=big[1][0]-1
    console.log(`    gap x${g0}..${g1} (${g1-g0+1}px)  gap midpoint ${f2((g0+g1+1)/2)}  vs column centre ${f2(colMid)}  disp ${f2((g0+g1+1)/2-colMid)}px`)
    console.log(`    label ink INSIDE the gap: left air ${L-g0}px   right air ${g1-R}px   asymmetry ${(g1-R)-(L-g0)}px`)
  }
  // vertical clearance
  const rowInk=(y)=>{let k=0;for(let x=248;x<=1439;x++)if(on(x,y))k++;return k}
  let t=96,b=96
  while(t>48&&rowInk(t-1)>0)t--
  while(b<400&&rowInk(b+1)>0)b++
  let n0=b+1; while(n0<400&&rowInk(n0)===0)n0++
  console.log(`  divider block y${t}..${b} (h=${b-t+1})   clear above ${t-48}px   clear below ${n0-b-1}px   next band starts y${n0}`)
}
