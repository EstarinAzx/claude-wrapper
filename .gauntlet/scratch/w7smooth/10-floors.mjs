// IDENTITY FLOOR (one mint hue, <10% of every surface) + surface-fill census.
import { decode } from './png.mjs'
import { oklch } from './png.mjs'
const f2=(n)=>n.toFixed(2)
const FILES=['welcome.png','welcome-min-window.png','titlebar.png','sidebar.png','chat.png','input-bar.png','window-welcome.png','window-session.png','window-session-short.png','agents-dock.png','appearance-dock.png','commands-dock.png']
for (const wv of [6,7]) {
  console.log(`\n########## WAVE ${wv} IDENTITY FLOOR ##########`)
  const hues=new Map(); let worst={f:'',share:0}
  for (const f of FILES) {
    let I; try { I=decode(`.gauntlet/waves/core-after-docks/${wv}/${f}`) } catch { continue }
    let mint=0, tot=I.w*I.h
    const local=new Map()
    for (let y=0;y<I.h;y++) for (let x=0;x<I.w;x++) {
      const [r,g,b]=I.at(x,y)
      const {L,C,H}=oklch(r,g,b)
      if (C>=0.05 && L>0.15) {                 // chromatic pixels only
        const k=Math.round(H)
        local.set(k,(local.get(k)||0)+1)
        hues.set(k,(hues.get(k)||0)+1)
        if (H>=140 && H<=200) mint++
      }
    }
    const share=mint/tot*100
    if (share>worst.share) worst={f,share}
    const top=[...local.entries()].sort((a,b)=>b[1]-a[1]).slice(0,3).map(([h,n])=>`${h}deg:${n}`).join(' ')
    console.log(`  ${f.padEnd(26)} chromatic-mint ${String(mint).padStart(6)} / ${tot}  = ${f2(share)}%   top hues ${top}`)
  }
  console.log(`  WORST SURFACE: ${worst.f} at ${f2(worst.share)}%  (floor: <10%)`)
  // hue clusters app-wide
  const sorted=[...hues.entries()].sort((a,b)=>b[1]-a[1]).slice(0,12)
  console.log(`  top chromatic hues app-wide: ${sorted.map(([h,n])=>`${h}deg(${n})`).join(' ')}`)
  // cluster into families with >=1% of chromatic mass
  const total=[...hues.values()].reduce((s,v)=>s+v,0)
  const fams=[]
  for (const [h,n] of [...hues.entries()].sort((a,b)=>a[0]-b[0])) {
    const last=fams[fams.length-1]
    if (last && h-last.h1<=12) { last.h1=h; last.n+=n } else fams.push({h0:h,h1:h,n})
  }
  console.log(`  hue FAMILIES (>=0.5% of chromatic mass):`)
  for (const fm of fams.filter(f=>f.n/total>=0.005)) console.log(`     ${fm.h0}..${fm.h1} deg   ${fm.n}px   ${f2(fm.n/total*100)}% of chromatic mass`)
}
