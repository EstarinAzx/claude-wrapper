import { decode } from './png.mjs'
const B = 'D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/'

// Per-file: list every connected component of CHANGED pixels (8-neighbour).
function comps(f) {
  const a = decode(B+'3/'+f), b = decode(B+'4/'+f)
  const W=a.w,H=a.h, m=new Uint8Array(W*H)
  let tot=0
  for (let i=0;i<W*H;i++){const o=i*4;let dd=0;for(let c=0;c<4;c++)dd+=Math.abs(a.data[o+c]-b.data[o+c]);if(dd>0){m[i]=1;tot++}}
  const seen=new Uint8Array(W*H), out=[]
  for (let s=0;s<W*H;s++){
    if(seen[s]||!m[s])continue
    const st=[s];seen[s]=1;let n=0,x0=1e9,x1=-1,y0=1e9,y1=-1
    while(st.length){const i=st.pop();const x=i%W,y=(i-x)/W;n++
      if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy
        if(xx<0||yy<0||xx>=W||yy>=H)continue;const j=yy*W+xx;if(seen[j]||!m[j])continue;seen[j]=1;st.push(j)}}
    out.push({n,x0,x1,y0,y1})
  }
  return {tot,out:out.sort((p,q)=>q.n-p.n),W,H}
}

console.log('=== CHANGED-PIXEL COMPONENTS, w3 -> w4 (8-neighbour) ===')
const res={}
for (const f of ['welcome.png','welcome-min-window.png','titlebar.png','chat.png','window-welcome.png','window-session.png']) {
  const {tot,out,W,H} = comps(f)
  res[f]={tot,out}
  console.log(`\n  ${f} (${W}x${H})  total changed=${tot}  components=${out.length}`)
  for (const c of out) {
    const bw=c.x1-c.x0+1, bh=c.y1-c.y0+1
    console.log(`     ${String(bw+'x'+bh).padEnd(8)} at x${c.x0}..${c.x1} y${c.y0}..${c.y1}   px=${c.n}   fill=${(100*c.n/(bw*bh)).toFixed(1)}% of its box`)
  }
}

console.log('\n=== ATTRIBUTION: window composites vs per-surface diffs ===')
const wl=res['welcome.png'].tot, tb=res['titlebar.png'].tot, ch=res['chat.png'].tot
const ww=res['window-welcome.png'].tot, ws=res['window-session.png'].tot
console.log(`  welcome.png mark diff      = ${wl}`)
console.log(`  titlebar.png mark diff     = ${tb}`)
console.log(`  chat.png avatar diff       = ${ch}`)
console.log(`  window-welcome total       = ${ww}   vs welcome+titlebar = ${wl+tb}   remainder = ${ww-(wl+tb)}`)
console.log(`  window-session total       = ${ws}   vs chat+titlebar    = ${ch+tb}   remainder = ${ws-(ch+tb)}`)
