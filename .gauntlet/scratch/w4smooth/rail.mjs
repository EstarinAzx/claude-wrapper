import { decode } from './png.mjs'
const B = 'D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/'
const hue=(r,g,b)=>{const mx=Math.max(r,g,b),mn=Math.min(r,g,b),c=mx-mn;if(!c)return -1
  let h;if(mx===r)h=((g-b)/c)%6;else if(mx===g)h=(b-r)/c+2;else h=(r-g)/c+4;return (h*60+360)%360}
const isMint=(r,g,b)=>{const h=hue(r,g,b);return Math.max(r,g,b)-Math.min(r,g,b)>20&&h>=140&&h<=190}

console.log('=== (d) RAIL CONTROL: sidebar.png row structure, wave 3 vs wave 4 ===')
for (const wv of ['3','4']) {
  const d=decode(B+wv+'/sidebar.png')
  // Row-mean colour profile: a row shell / hairline shows as a distinct row colour.
  const prof=[]
  for(let y=0;y<d.h;y++){let r=0,g=0,b=0,a=0
    for(let x=0;x<d.w;x++){const o=(y*d.w+x)*4;r+=d.data[o];g+=d.data[o+1];b+=d.data[o+2];a+=d.data[o+3]}
    prof.push([r/d.w,g/d.w,b/d.w,a/d.w])}
  // hairline = a row whose mean differs from BOTH neighbours in the same direction,
  // and which is 1-2px tall. Detect by scanning for rows brighter than both neighbours.
  const hair=[]
  for(let y=1;y<d.h-1;y++){
    const dPrev=prof[y][0]-prof[y-1][0], dNext=prof[y][0]-prof[y+1][0]
    if(dPrev>1.2&&dNext>1.2)hair.push({y,mean:prof[y].map(v=>+v.toFixed(1)),dPrev:+dPrev.toFixed(2),dNext:+dNext.toFixed(2)})
  }
  console.log(`\n  wave ${wv}: sidebar.png ${d.w}x${d.h}`)
  console.log(`     HAIRLINES (row brighter than both neighbours by >1.2 mean-R):`)
  for(const h of hair.slice(0,12))console.log(`        y=${String(h.y).padStart(3)}  meanRGBA=[${h.mean.join(', ')}]  +${h.dPrev}/+${h.dNext} vs neighbours`)
  console.log(`     total hairlines detected: ${hair.length}`)
  if(hair.length>=2)console.log(`     FIRST TWO at y=${hair[0].y} and y=${hair[1].y}   (head 44 + filter 34 = 78 -> the comment's claim is both inside y0..77)`)

  // mint selection stripe: vertical run length at x6 and x7
  for (const X of [6,7]) {
    const runs=[];let cur=null
    for(let y=0;y<d.h;y++){const o=(y*d.w+X)*4
      if(isMint(d.data[o],d.data[o+1],d.data[o+2])){if(!cur)cur={y0:y,y1:y};else cur.y1=y}
      else{if(cur){runs.push(cur);cur=null}}}
    if(cur)runs.push(cur)
    console.log(`     selection stripe at x=${X}: ${runs.map(r=>`y${r.y0}..${r.y1} run=${r.y1-r.y0+1}`).join('  ')||'none'}`)
  }
  // total sidebar mint px (the trap: share rises while run length falls)
  let mint=0;for(let i=0;i<d.w*d.h;i++){const o=i*4;if(isMint(d.data[o],d.data[o+1],d.data[o+2]))mint++}
  console.log(`     total sidebar mint px = ${mint}   (the share-based check that reports the opposite of run length)`)

  // first session row top edge: find the row-shell fill bands
  const fillRows=[]
  for(let y=0;y<d.h;y++){let n=0
    for(let x=0;x<d.w;x++){const o=(y*d.w+x)*4
      const k=d.data[o]+','+d.data[o+1]+','+d.data[o+2]+','+d.data[o+3]
      if(k==='28,39,39,220'||k==='29,34,35,219')n++}
    fillRows.push(n)}
  const bands=[];let b=null
  for(let y=0;y<d.h;y++){if(fillRows[y]>40){if(!b)b={y0:y,y1:y};else b.y1=y}else{if(b){bands.push(b);b=null}}}
  if(b)bands.push(b)
  console.log(`     row-shell fill bands (>40px of a shell colour): ${bands.slice(0,8).map(z=>`y${z.y0}..${z.y1} h=${z.y1-z.y0+1}`).join('  ')}`)
  if(bands.length)console.log(`     FIRST SESSION ROW TOP EDGE = y${bands[0].y0}   (${(100*bands[0].y0/d.h).toFixed(1)}% of the ${d.h}px rail)`)
}

console.log('\n\n=== SCROLL STATE of the transcript in chat.png (from the scrollbar thumb) ===')
for (const wv of ['3','4']) {
  const d=decode(B+wv+'/chat.png')
  // thumb columns x1185..1188
  let t=1e9,bt=-1,n=0
  const BG=[3,6,6,163]
  for(let y=0;y<d.h;y++)for(let x=1185;x<=1188;x++){const o=(y*d.w+x)*4
    let dd=0;for(let c=0;c<4;c++)dd+=Math.abs(d.data[o+c]-BG[c])
    if(dd>0){if(y<t)t=y;if(y>bt)bt=y;n++}}
  const thumbH=bt-t+1, track=d.h
  const ratio=thumbH/track
  const scrollH=track/ratio
  const overflow=scrollH-track
  const scrollTop=t/track*scrollH
  console.log(`  wave ${wv}: chat.png ${d.w}x${d.h}  thumb x1185..1188 y${t}..${bt} h=${thumbH} px=${n}`)
  console.log(`          thumb/track = ${thumbH}/${track} = ${ratio.toFixed(4)}  =>  scrollHeight ~= ${scrollH.toFixed(1)}px, overflow ~= ${overflow.toFixed(1)}px`)
  console.log(`          thumb top at y${t} => scrollTop ~= ${scrollTop.toFixed(1)}px  (${(100*scrollTop/(overflow||1)).toFixed(1)}% of the way down)`)
  console.log(`          content ABOVE the viewport ~= ${scrollTop.toFixed(1)}px ; content BELOW ~= ${(overflow-scrollTop).toFixed(1)}px`)
}

console.log('\n\n=== WINDOW-COMPOSITE centring: the same two blocks in window coordinates ===')
for (const wv of ['3','4']) {
  const d=decode(B+wv+'/window-session.png')
  const BG=[3,6,6,163]
  const runsIn=(y0,y1)=>{const col=new Array(d.w).fill(0)
    for(let y=y0;y<=y1;y++)for(let x=0;x<d.w;x++){const o=(y*d.w+x)*4
      let dd=0;for(let c=0;c<4;c++)dd+=Math.abs(d.data[o+c]-BG[c]);if(dd>0)col[x]++}
    const out=[];let cur=null
    for(let x=248;x<d.w;x++){if(col[x]>0){if(!cur)cur={x0:x,x1:x};else cur.x1=x}else{if(cur){out.push(cur);cur=null}}}
    if(cur)out.push(cur);return out}
  const tr=runsIn(96,760)     // transcript region of the window
  const cp=runsIn(816,900-1)  // composer region
  console.log(`  wave ${wv}: transcript-region runs (window x): ${tr.map(r=>`x${r.x0}..${r.x1}(w${r.x1-r.x0+1})`).join(' ')}`)
  console.log(`          composer-region runs  (window x): ${cp.map(r=>`x${r.x0}..${r.x1}(w${r.x1-r.x0+1})`).join(' ')}`)
}
