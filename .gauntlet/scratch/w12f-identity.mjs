import { decode, oklch } from './w8smooth/png.mjs'
const ROOT='D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks'
const FILES=['welcome','window-welcome','welcome-min-window','titlebar','sidebar','chat','input-bar','window-session','window-session-short','agents-dock','commands-dock','appearance-dock']
const run=(w)=>{const fam=new Map();let worst={f:'',s:0},tot=0,per={}
  for(const f of FILES){const I=decode(`${ROOT}/${w}/${f}.png`);let mint=0,n=I.w*I.h
    for(let y=0;y<I.h;y++)for(let x=0;x<I.w;x++){const [r,g,b]=I.at(x,y);const {L,C,H}=oklch(r,g,b)
      if(C>=0.05&&L>0.15){const k=Math.round(H);fam.set(k,(fam.get(k)||0)+1);tot++;if(H>=140&&H<=200)mint++}}
    per[f]={mint,n,share:mint/n*100}
    if(mint/n*100>worst.s)worst={f,s:mint/n*100,mint,n}}
  let m178=0;for(const [k,v] of fam) if(k>=178&&k<=183) m178+=v
  return {per,worst,tot,m178,share:m178/tot*100}}
const a=run('11'), b=run('12')
console.log('file                       w11_mint  w12_mint  delta   w12_share%')
for(const f of FILES){const d=b.per[f].mint-a.per[f].mint
  console.log(`${f.padEnd(26)} ${String(a.per[f].mint).padStart(7)} ${String(b.per[f].mint).padStart(9)} ${String(d).padStart(6)}   ${b.per[f].share.toFixed(4)}`)}
console.log(`\nWORST w11: ${a.worst.f} ${a.worst.mint}/${a.worst.n} = ${a.worst.s.toFixed(4)}%`)
console.log(`WORST w12: ${b.worst.f} ${b.worst.mint}/${b.worst.n} = ${b.worst.s.toFixed(4)}%`)
console.log(`\nchromatic_total w11=${a.tot} w12=${b.tot} delta=${b.tot-a.tot}`)
console.log(`mint family 178-183: w11=${a.m178} (${a.share.toFixed(4)}%)  w12=${b.m178} (${b.share.toFixed(4)}%)  delta_px=${b.m178-a.m178} delta_share=${(b.share-a.share).toFixed(4)}pp`)
