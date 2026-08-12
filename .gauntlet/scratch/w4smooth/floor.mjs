import { decode } from './png.mjs'
const B = 'D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/'
const ALL=['welcome','welcome-min-window','titlebar','sidebar','chat','input-bar','agents-dock','appearance-dock','commands-dock']
const CORE=['welcome','titlebar','sidebar','chat','input-bar']
const hue=(r,g,b)=>{const mx=Math.max(r,g,b),mn=Math.min(r,g,b),c=mx-mn;if(!c)return -1
  let h;if(mx===r)h=((g-b)/c)%6;else if(mx===g)h=(b-r)/c+2;else h=(r-g)/c+4;return (h*60+360)%360}
const isMint=(r,g,b)=>{const h=hue(r,g,b);return Math.max(r,g,b)-Math.min(r,g,b)>20&&h>=140&&h<=190}

console.log('=== HUE HISTOGRAM, chroma>20, 10deg bins, all nine surfaces ===')
for (const wv of ['3','4']) {
  const bins=new Map()
  for(const s of ALL){const d=decode(B+wv+'/'+s+'.png')
    for(let i=0;i<d.w*d.h;i++){const o=i*4,r=d.data[o],g=d.data[o+1],b=d.data[o+2]
      if(Math.max(r,g,b)-Math.min(r,g,b)>20){const k=Math.round(hue(r,g,b)/10)*10;bins.set(k,(bins.get(k)||0)+1)}}}
  const kept=[...bins.entries()].filter(([,v])=>v>30).sort((a,b)=>a[0]-b[0])
  console.log(`  wave ${wv}: ${kept.map(([k,v])=>`~${k}deg:${v}`).join('  ')}`)
}

console.log('\n=== EXACT HUE VALUES inside the three mark interiors (is it ONE hue?) ===')
const SITES=[['titlebar.png','logo-mark',14,35,13,34],['welcome.png','welcome-mark',513,556,242,285],['chat.png','avatar',211,238,111,138]]
for (const [f,label,x0,x1,y0,y1] of SITES) {
  for (const wv of ['3','4']) {
    const d=decode(B+wv+'/'+f); const hs=new Map()
    for(let y=y0+3;y<=y1-3;y++)for(let x=x0+3;x<=x1-3;x++){const o=(y*d.w+x)*4,r=d.data[o],g=d.data[o+1],b=d.data[o+2]
      if(!isMint(r,g,b))continue; const h=+hue(r,g,b).toFixed(2); hs.set(h,(hs.get(h)||0)+1)}
    const vals=[...hs.keys()].sort((a,b)=>a-b)
    console.log(`  ${label.padEnd(13)} wave ${wv}: distinct hues=${vals.length}  min=${vals[0]}  max=${vals[vals.length-1]}  spread=${(vals[vals.length-1]-vals[0]).toFixed(2)}deg`)
  }
}

console.log('\n=== PER-SURFACE MINT SHARE (chroma>20, hue140-190), wave 3 vs wave 4 ===')
const tot={3:0,4:0}, worst={3:{s:'',p:0},4:{s:'',p:0}}
for (const s of ALL) {
  const row=[]
  for (const wv of ['3','4']) {
    const d=decode(B+wv+'/'+s+'.png');let n=0
    for(let i=0;i<d.w*d.h;i++){const o=i*4;if(isMint(d.data[o],d.data[o+1],d.data[o+2]))n++}
    const p=100*n/(d.w*d.h); row.push([n,p]); tot[wv]+=n
    if(p>worst[wv].p)worst[wv]={s,p}
  }
  console.log(`  ${s.padEnd(20)} w3=${String(row[0][0]).padStart(6)} (${row[0][1].toFixed(3)}%)   w4=${String(row[1][0]).padStart(6)} (${row[1][1].toFixed(3)}%)   delta=${row[1][0]-row[0][0]}`)
}
console.log(`  TOTAL(9 surfaces)    w3=${tot[3]}   w4=${tot[4]}   delta=${tot[4]-tot[3]}`)
console.log(`  worst-case surface   w3=${worst[3].p.toFixed(3)}% (${worst[3].s})   w4=${worst[4].p.toFixed(3)}% (${worst[4].s})   floor=10%`)

console.log('\n=== MINT SITES (connected components, dilate 3, >=8 mint px), core five ===')
for (const wv of ['3','4']) {
  let siteTotal=0; const lines=[]
  for (const s of CORE) {
    const d=decode(B+wv+'/'+s+'.png'),W=d.w,H=d.h
    const m=new Uint8Array(W*H)
    for(let i=0;i<W*H;i++){const o=i*4;if(isMint(d.data[o],d.data[o+1],d.data[o+2]))m[i]=1}
    const dl=new Uint8Array(W*H)
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(!m[y*W+x])continue
      for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const yy=y+dy,xx=x+dx;if(yy>=0&&yy<H&&xx>=0&&xx<W)dl[yy*W+xx]=1}}
    const seen=new Uint8Array(W*H);let cnt=0
    for(let s0=0;s0<W*H;s0++){if(seen[s0]||!dl[s0])continue
      const st=[s0];seen[s0]=1;let mn=0
      while(st.length){const i=st.pop();const x=i%W,y=(i-x)/W;if(m[i])mn++
        for(const j of [x>0?i-1:-1,x<W-1?i+1:-1,y>0?i-W:-1,y<H-1?i+W:-1])if(j>=0&&!seen[j]&&dl[j]){seen[j]=1;st.push(j)}}
      if(mn>=8)cnt++}
    siteTotal+=cnt; lines.push(`${s}:${cnt}`)
  }
  console.log(`  wave ${wv}: TOTAL SITES=${siteTotal}   (${lines.join('  ')})`)
}
