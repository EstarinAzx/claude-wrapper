import { decode } from './png.mjs'
const B = 'D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/'
const REF = 'D:/.claude/claude projects/playground/4/.gauntlet/bar/identity/frost-mono-reference.png'

const hue=(r,g,b)=>{const mx=Math.max(r,g,b),mn=Math.min(r,g,b),c=mx-mn;if(!c)return -1
  let h;if(mx===r)h=((g-b)/c)%6;else if(mx===g)h=(b-r)/c+2;else h=(r-g)/c+4;return (h*60+360)%360}

// Erode a mask by `k` steps, 8-neighbour: drops the antialias ring without
// truncating the y-range the way a bounding-box inset does.
function erode(m,W,H,k){
  let cur=m
  for(let s=0;s<k;s++){
    const nx=new Uint8Array(W*H)
    for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){
      const i=y*W+x; if(!cur[i])continue
      let ok=1
      for(let dy=-1;dy<=1&&ok;dy++)for(let dx=-1;dx<=1;dx++)if(!cur[(y+dy)*W+x+dx]){ok=0;break}
      if(ok)nx[i]=1
    }
    cur=nx
  }
  return cur
}

function stats(d,mask){
  const acc=[[],[],[]]
  const rowsum=new Map()
  for(let y=0;y<d.h;y++)for(let x=0;x<d.w;x++){
    const i=y*d.w+x; if(!mask[i])continue
    const o=i*4
    acc[0].push(d.data[o]);acc[1].push(d.data[o+1]);acc[2].push(d.data[o+2])
    if(!rowsum.has(y))rowsum.set(y,[0,0])
    const r=rowsum.get(y); r[0]+=d.data[o+1]; r[1]++
  }
  const sd=acc.map(v=>{const m=v.reduce((a,b)=>a+b,0)/v.length
    return Math.sqrt(v.reduce((a,b)=>a+(b-m)**2,0)/v.length)})
  const mean=acc.map(v=>v.reduce((a,b)=>a+b,0)/v.length)
  const rng=acc.map(v=>Math.max(...v)-Math.min(...v))
  const rows=[...rowsum.entries()].sort((a,b)=>a[0]-b[0]).map(([y,[s,n]])=>({y,g:s/n}))
  return {sd,mean,rng,n:acc[0].length,rows}
}

// Mark sites: box is the CHANGED-pixel component from the w3->w4 diff, which is
// exactly the mark. Mask = every pixel in that box whose hue reads mint.
const SITES=[
  ['titlebar.png','.logo-mark 22px',14,35,13,34],
  ['welcome.png','.welcome-mark 44px',513,556,242,285],
  ['chat.png','.avatar 28px (upper)',211,238,111,138],
  ['chat.png','.avatar 28px (lower)',211,238,660,687],
]

console.log('=== MARK DEPTH: interior per-channel stddev, erode-2 mask, wave 3 vs wave 4 ===')
console.log('    predicted 6.41 (builder: range/sqrt12, range=0.1*255*0.87=22.19)')
for (const [f,label,x0,x1,y0,y1] of SITES) {
  const out=[]
  for (const wv of ['3','4']) {
    const d=decode(B+wv+'/'+f)
    const m=new Uint8Array(d.w*d.h)
    for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
      const o=(y*d.w+x)*4,r=d.data[o],g=d.data[o+1],b=d.data[o+2]
      const h=hue(r,g,b)
      if(Math.max(r,g,b)-Math.min(r,g,b)>20&&h>=140&&h<=190)m[y*d.w+x]=1
    }
    let full=0;for(let i=0;i<m.length;i++)full+=m[i]
    const e=erode(m,d.w,d.h,2)
    const st=stats(d,e)
    out.push({wv,full,st})
  }
  console.log(`\n  ${label}  box ${x1-x0+1}x${y1-y0+1} at x${x0}..${x1} y${y0}..${y1}   (${f})`)
  for (const o of out) {
    console.log(`     wave ${o.wv}: maskpx=${o.full} erodedpx=${o.st.n}  sdRGB=[${o.st.sd.map(v=>v.toFixed(2)).join(', ')}]  meanRGB=[${o.st.mean.map(v=>v.toFixed(1)).join(', ')}]  rangeRGB=[${o.st.rng.join(', ')}]`)
  }
  const w4=out[1].st
  console.log(`     wave 4 row profile (mean G, eroded rows): top ${w4.rows[0].g.toFixed(1)} -> bottom ${w4.rows[w4.rows.length-1].g.toFixed(1)}  drop=${(w4.rows[0].g-w4.rows[w4.rows.length-1].g).toFixed(1)}  rows=${w4.rows.length}`)
  const monotone = w4.rows.every((r,i)=>i===0||r.g<=w4.rows[i-1].g+0.6)
  console.log(`     monotone darkening top->bottom: ${monotone?'YES':'NO'}`)
}

// ---- the identity reference, measured with the SAME method ----
console.log('\n=== IDENTITY REFERENCE (frost-mono-reference.png), same erode-2 method ===')
const rd=decode(REF)
console.log(`  image ${rd.w}x${rd.h}`)
{
  const W=rd.w,H=rd.h
  const m=new Uint8Array(W*H)
  for(let i=0;i<W*H;i++){const o=i*4,r=rd.data[o],g=rd.data[o+1],b=rd.data[o+2]
    const h=hue(r,g,b)
    if(Math.max(r,g,b)-Math.min(r,g,b)>20&&h>=140&&h<=190)m[i]=1}
  // connected components
  const seen=new Uint8Array(W*H),out=[]
  for(let s=0;s<W*H;s++){
    if(seen[s]||!m[s])continue
    const st=[s];seen[s]=1;let n=0,x0=1e9,x1=-1,y0=1e9,y1=-1
    while(st.length){const i=st.pop();const x=i%W,y=(i-x)/W;n++
      if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy
        if(xx<0||yy<0||xx>=W||yy>=H)continue;const j=yy*W+xx;if(seen[j]||!m[j])continue;seen[j]=1;st.push(j)}}
    if(n>=150)out.push({n,x0,x1,y0,y1})
  }
  out.sort((a,b)=>b.n-a.n)
  console.log(`  mint components >=150px: ${out.length}`)
  for (const c of out.slice(0,10)) {
    const bw=c.x1-c.x0+1,bh=c.y1-c.y0+1
    const sub=new Uint8Array(W*H)
    for(let y=c.y0;y<=c.y1;y++)for(let x=c.x0;x<=c.x1;x++)if(m[y*W+x])sub[y*W+x]=1
    const e=erode(sub,W,H,2)
    if(!e.some(v=>v))  { console.log(`     ${bw}x${bh} at x${c.x0} y${c.y0} px=${c.n} (too thin to erode)`); continue }
    const st=stats(rd,e)
    console.log(`     ${String(bw+'x'+bh).padEnd(9)} at x${c.x0}..${c.x1} y${c.y0}..${c.y1} px=${c.n} erodedpx=${st.n}  sdRGB=[${st.sd.map(v=>v.toFixed(2)).join(', ')}]  meanRGB=[${st.mean.map(v=>v.toFixed(1)).join(', ')}] rangeRGB=[${st.rng.join(', ')}] fill=${(100*c.n/(bw*bh)).toFixed(0)}%`)
  }
}
