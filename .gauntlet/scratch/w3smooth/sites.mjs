import { decode } from './png.mjs'
const B='D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/'
const all=['welcome','welcome-min-window','titlebar','sidebar','chat','input-bar','agents-dock','appearance-dock','commands-dock']
const hue=(r,g,b)=>{const mx=Math.max(r,g,b),mn=Math.min(r,g,b),c=mx-mn;if(!c)return -1
  let h;if(mx===r)h=((g-b)/c)%6;else if(mx===g)h=(b-r)/c+2;else h=(r-g)/c+4;return (h*60+360)%360}
const isMint=(r,g,b)=>{const h=hue(r,g,b);return Math.max(r,g,b)-Math.min(r,g,b)>20&&h>=140&&h<=190}
const isWarm=(r,g,b)=>{const h=hue(r,g,b);return Math.max(r,g,b)-Math.min(r,g,b)>20&&(h<40||h>320)}
console.log('=== all-surface mint share (chroma>20, hue140-190), wave 3 ===')
for(const s of all){const d=decode(B+'3/'+s+'.png');let n=0,wn=0
  for(let i=0;i<d.w*d.h;i++){const o=i*4;if(isMint(d.data[o],d.data[o+1],d.data[o+2]))n++;if(isWarm(d.data[o],d.data[o+1],d.data[o+2]))wn++}
  console.log(`  ${s.padEnd(20)} ${String(d.w+'x'+d.h).padEnd(10)} mint=${String(n).padStart(6)} ${(100*n/(d.w*d.h)).toFixed(3)}%   warm=${String(wn).padStart(5)} ${(100*wn/(d.w*d.h)).toFixed(3)}%`)}
console.log('\n=== MINT SITES (connected components, >=8px, dilate gap 3) per surface, wave 3 ===')
let siteTotal=0
for(const s of ['welcome','titlebar','sidebar','chat','input-bar']){
  const d=decode(B+'3/'+s+'.png'),W=d.w,H=d.h
  const m=new Uint8Array(W*H)
  for(let i=0;i<W*H;i++){const o=i*4;if(isMint(d.data[o],d.data[o+1],d.data[o+2]))m[i]=1}
  // dilate by 3 so AA-separated parts of one mark join
  const dl=new Uint8Array(W*H)
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(!m[y*W+x])continue
    for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const yy=y+dy,xx=x+dx;if(yy>=0&&yy<H&&xx>=0&&xx<W)dl[yy*W+xx]=1}}
  const seen=new Uint8Array(W*H);const out=[]
  for(let s0=0;s0<W*H;s0++){if(seen[s0]||!dl[s0])continue
    const st=[s0];seen[s0]=1;let n=0,x0=1e9,x1=-1,y0=1e9,y1=-1,mn=0
    while(st.length){const i=st.pop();const x=i%W,y=(i-x)/W;n++;if(m[i])mn++
      if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y
      for(const j of [x>0?i-1:-1,x<W-1?i+1:-1,y>0?i-W:-1,y<H-1?i+W:-1])if(j>=0&&!seen[j]&&dl[j]){seen[j]=1;st.push(j)}}
    if(mn>=8)out.push({mn,x0,x1,y0,y1})}
  siteTotal+=out.length
  console.log(`  ${s}: ${out.length} site(s)`)
  for(const c of out.sort((a,b)=>b.mn-a.mn))console.log(`      x${c.x0}..${c.x1} y${c.y0}..${c.y1}  ${c.x1-c.x0+1}x${c.y1-c.y0+1}  mintpx=${c.mn}`)
}
console.log(`  TOTAL SITES across core five = ${siteTotal}`)
