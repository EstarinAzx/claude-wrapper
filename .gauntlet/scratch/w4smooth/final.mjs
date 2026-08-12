import { decode } from './png.mjs'
const B = 'D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/'

console.log('=== BASELINE PITCH, second surface: welcome.png hero prose ===')
{
  const d=decode(B+'4/welcome.png')
  const light=(x,y)=>{const o=(y*d.w+x)*4;return d.data[o]>90&&d.data[o+1]>90}
  const rows=[]
  for(let y=290;y<=440;y++){let n=0;for(let x=500;x<=940;x++)if(light(x,y))n++;rows.push({y,n})}
  const bands=[];let cur=null
  for(const r of rows){if(r.n>0){if(!cur)cur={y0:r.y,y1:r.y};else cur.y1=r.y}else{if(cur){bands.push(cur);cur=null}}}
  if(cur)bands.push(cur)
  const tops=bands.map(b=>b.y0)
  console.log(`  welcome hero prose x500..940 y290..440: ${bands.map(b=>`y${b.y0}..${b.y1}(h${b.y1-b.y0+1})`).join(' ')}`)
  console.log(`  top-to-top pitches: [${tops.slice(1).map((t,i)=>t-tops[i]).join(', ')}]`)
}
console.log('\n=== BASELINE PITCH, input-bar ===')
{
  const d=decode(B+'4/input-bar.png')
  const light=(x,y)=>{const o=(y*d.w+x)*4;return d.data[o]>90&&d.data[o+1]>90}
  const rows=[]
  for(let y=0;y<d.h;y++){let n=0;for(let x=216;x<=975;x++)if(light(x,y))n++;rows.push({y,n})}
  const bands=[];let cur=null
  for(const r of rows){if(r.n>0){if(!cur)cur={y0:r.y,y1:r.y};else cur.y1=r.y}else{if(cur){bands.push(cur);cur=null}}}
  if(cur)bands.push(cur)
  const tops=bands.map(b=>b.y0)
  console.log(`  input-bar x216..975: ${bands.map(b=>`y${b.y0}..${b.y1}(h${b.y1-b.y0+1})`).join(' ')}`)
  console.log(`  top-to-top pitches: [${tops.slice(1).map((t,i)=>t-tops[i]).join(', ')}]`)
}

console.log('\n=== WHAT chat.png ACTUALLY SHOWS: distinct painted blocks by x-extent ===')
{
  const d=decode(B+'4/chat.png')
  const BG=[3,6,6,163]
  const isInk=(x,y)=>{const o=(y*d.w+x)*4;let dd=0;for(let c=0;c<4;c++)dd+=Math.abs(d.data[o+c]-BG[c]);return dd>0}
  // classify each row by its ink left edge: 211=avatar row, 250=assistant body, 515=user bubble
  let cur=null;const segs=[]
  for(let y=0;y<d.h;y++){
    let l=-1,r=-1,n=0
    for(let x=0;x<1180;x++)if(isInk(x,y)){if(l<0)l=x;r=x;n++}   // exclude the scrollbar gutter
    const key=n===0?'empty':(l<240?'avatar-col':(l<300?'assistant-body':'right-of-500'))
    if(cur&&cur.key===key){cur.y1=y;cur.lmin=Math.min(cur.lmin,l<0?1e9:l);cur.rmax=Math.max(cur.rmax,r)}
    else{if(cur)segs.push(cur);cur={key,y0:y,y1:y,lmin:l<0?1e9:l,rmax:r}}
  }
  if(cur)segs.push(cur)
  for(const s of segs)console.log(`   y${String(s.y0).padStart(3)}..${String(s.y1).padStart(3)} h=${String(s.y1-s.y0+1).padStart(3)}  ${s.key.padEnd(15)} ${s.lmin<1e9?`x${s.lmin}..${s.rmax}`:''}`)
}

console.log('\n=== MARK GEOMETRY unchanged? mask pixel counts and per-row inset profile ===')
const hue=(r,g,b)=>{const mx=Math.max(r,g,b),mn=Math.min(r,g,b),c=mx-mn;if(!c)return -1
  let h;if(mx===r)h=((g-b)/c)%6;else if(mx===g)h=(b-r)/c+2;else h=(r-g)/c+4;return (h*60+360)%360}
const isMint=(r,g,b)=>{const h=hue(r,g,b);return Math.max(r,g,b)-Math.min(r,g,b)>20&&h>=140&&h<=190}
for (const [f,label,x0,x1,y0,y1] of [['titlebar.png','logo-mark 22',14,35,13,34],['welcome.png','welcome-mark 44',513,556,242,285],['chat.png','avatar 28',211,238,111,138]]) {
  const prof={}
  for (const wv of ['3','4']) {
    const d=decode(B+wv+'/'+f); const ins=[];let n=0
    for(let y=y0;y<=y1;y++){let first=-1,last=-1
      for(let x=x0;x<=x1;x++){const o=(y*d.w+x)*4
        if(isMint(d.data[o],d.data[o+1],d.data[o+2])){if(first<0)first=x;last=x;n++}}
      ins.push(first<0?-1:first-x0)}
    prof[wv]={ins,n}
  }
  const same=JSON.stringify(prof['3'].ins)===JSON.stringify(prof['4'].ins)
  console.log(`  ${label.padEnd(18)} maskpx w3=${prof['3'].n} w4=${prof['4'].n} (delta ${prof['4'].n-prof['3'].n})   per-row left-inset profile identical: ${same?'YES':'NO'}`)
  if(!same){
    const diff=prof['3'].ins.map((v,i)=>v===prof['4'].ins[i]?null:`row${i}:${v}->${prof['4'].ins[i]}`).filter(Boolean)
    console.log(`     rows differing: ${diff.join(' ')}`)
  }
}
