import { decode, px } from './png.mjs'
const DIRS={1:'D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/1/',2:'D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/2/'}
const FILES=['titlebar.png','sidebar.png','chat.png','input-bar.png','welcome.png','welcome-min-window.png','window-session.png','window-welcome.png']
// "mint" = the frost-mint hue family: green+blue clearly above red, and not a
// near-grey. Threshold picked from the measured solid #a1e4d6 (r=161,g=228,b=214):
// g-r=67, b-r=53. Antialiased edges ramp down; >=25 catches the ramp without
// admitting the neutral text (which is hue-neutral, g-r ~ 0..4).
const isMint=(p)=>p[1]-p[0]>=25&&p[2]-p[0]>=25
function clusters(img){
  const seen=new Uint8Array(img.w*img.h); const out=[]
  for(let y=0;y<img.h;y++)for(let x=0;x<img.w;x++){const i=y*img.w+x
    if(seen[i]||!isMint(px(img,x,y)))continue
    let n=0,x0=x,x1=x,y0=y,y1=y; const st=[i]; seen[i]=1
    while(st.length){const c=st.pop(); const cx=c%img.w, cy=(c-cx)/img.w; n++
      if(cx<x0)x0=cx; if(cx>x1)x1=cx; if(cy<y0)y0=cy; if(cy>y1)y1=cy
      for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=cx+dx,ny=cy+dy
        if(nx<0||ny<0||nx>=img.w||ny>=img.h)continue
        const j=ny*img.w+nx; if(seen[j]||!isMint(px(img,nx,ny)))continue
        seen[j]=1; st.push(j)}}
    out.push({n,x0,y0,w:x1-x0+1,h:y1-y0+1})}
  return out.sort((a,b)=>b.n-a.n)
}
for(const f of FILES){
  const row=[]
  for(const wv of [1,2]){
    let img; try{img=decode(DIRS[wv]+f)}catch(e){row.push('--');continue}
    const cs=clusters(img); const tot=cs.reduce((s,c)=>s+c.n,0)
    row.push({wv,tot,pct:100*tot/(img.w*img.h),sites:cs.filter(c=>c.n>=12).length,cs:cs.slice(0,6),dim:`${img.w}x${img.h}`})
  }
  const [a,b]=row
  console.log(`\n### ${f}  ${b.dim||''}`)
  for(const r of row){ if(r==='--'){console.log('  w1: absent');continue}
    console.log(`  w${r.wv}: mint px=${String(r.tot).padStart(6)}  ${r.pct.toFixed(3)}%  sites(>=12px)=${r.sites}`)
    console.log(`      top: ${r.cs.map(c=>`${c.w}x${c.h}@(${c.x0},${c.y0})n=${c.n}`).join(' | ')}`)
  }
}
