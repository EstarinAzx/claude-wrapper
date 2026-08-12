import { decode, px, hex } from './png.mjs'
const D=(w)=>`D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/${w}/`
function comps(img,match,minN=400){
  const seen=new Uint8Array(img.w*img.h); const out=[]
  for(let y=0;y<img.h;y++)for(let x=0;x<img.w;x++){const i=y*img.w+x
    if(seen[i]||!match(px(img,x,y)))continue
    let n=0,x0=x,x1=x,y0=y,y1=y; const st=[i]; seen[i]=1
    while(st.length){const c=st.pop(); const cx=c%img.w, cy=(c-cx)/img.w; n++
      if(cx<x0)x0=cx; if(cx>x1)x1=cx; if(cy<y0)y0=cy; if(cy>y1)y1=cy
      for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=cx+dx,ny=cy+dy
        if(nx<0||ny<0||nx>=img.w||ny>=img.h)continue
        const j=ny*img.w+nx; if(seen[j]||!match(px(img,nx,ny)))continue
        seen[j]=1; st.push(j)}}
    if(n>=minN) out.push({n,x0,y0,x1,y1,w:x1-x0+1,h:y1-y0+1})}
  return out.sort((a,b)=>a.y0-b.y0)
}
const eq=(t,a)=>(p)=>hex(p)===t&&p[3]===a
for(const [wv,f,t,a] of [[2,'input-bar.png','#0b0f11',216],[2,'chat.png','#0b0f11',216],[2,'chat.png','#212426',246],[1,'chat.png','#0b0f11',216],[1,'chat.png','#212426',246]]){
  const img=decode(D(wv)+f)
  console.log(`\n=== w${wv} ${f} fill ${t}/a${a} ===`)
  for(const c of comps(img,eq(t,a))) console.log(`  ${String(c.w).padStart(4)}x${String(c.h).padStart(3)} @(${c.x0},${c.y0})-(${c.x1},${c.y1}) n=${c.n}`)
}
