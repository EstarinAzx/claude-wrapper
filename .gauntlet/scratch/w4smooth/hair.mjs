import { decode } from './png.mjs'
const B = 'D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/'
const hue=(r,g,b)=>{const mx=Math.max(r,g,b),mn=Math.min(r,g,b),c=mx-mn;if(!c)return -1
  let h;if(mx===r)h=((g-b)/c)%6;else if(mx===g)h=(b-r)/c+2;else h=(r-g)/c+4;return (h*60+360)%360}

console.log('=== STRICT HAIRLINES in sidebar.png: rows that are >=90% ONE colour and differ from both neighbours ===')
for (const wv of ['3','4']) {
  const d=decode(B+wv+'/sidebar.png')
  const rowSig=[]
  for(let y=0;y<d.h;y++){
    const h=new Map()
    for(let x=0;x<d.w;x++){const o=(y*d.w+x)*4
      const k=d.data[o]+','+d.data[o+1]+','+d.data[o+2]+','+d.data[o+3];h.set(k,(h.get(k)||0)+1)}
    const [k,n]=[...h.entries()].sort((a,b)=>b[1]-a[1])[0]
    rowSig.push({y,k,n,frac:n/d.w})
  }
  const hair=[]
  for(let y=1;y<d.h-1;y++){
    const r=rowSig[y]
    if(r.frac<0.90)continue
    if(r.k===rowSig[y-1].k||r.k===rowSig[y+1].k)continue
    hair.push(r)
  }
  console.log(`\n  wave ${wv}: ${hair.length} strict full-width hairlines`)
  let prev=null
  for(const h of hair){
    const gap=prev===null?'-':h.y-prev
    console.log(`     y=${String(h.y).padStart(3)}  colour=${h.k.padEnd(16)} ${(100*h.frac).toFixed(1)}% of the row   gap-from-previous=${gap}`)
    prev=h.y
  }
  if(hair.length>=2){
    console.log(`     FIRST TWO HAIRLINES: y=${hair[0].y} and y=${hair[1].y}`)
    console.log(`     the .session-scope comment claims two inside the first 78px (44 head + 34 filter).`)
    console.log(`     second hairline is at y=${hair[1].y}; inside 78px? ${hair[1].y<78 ? 'YES' : 'NO  <-- comment is FALSE of the shipped rail'}`)
    console.log(`     band heights implied: head=${hair[0].y+1}px, next band=${hair[1].y-hair[0].y}px`)
  }
}

console.log('\n\n=== SELECTION STRIPE run length: method sensitivity across four mint definitions ===')
const DEFS=[
  ['exact token 161,228,214',(r,g,b)=>r===161&&g===228&&b===214],
  ['chroma>40 hue150-180',(r,g,b)=>{const h=hue(r,g,b);return Math.max(r,g,b)-Math.min(r,g,b)>40&&h>=150&&h<=180}],
  ['chroma>20 hue140-190',(r,g,b)=>{const h=hue(r,g,b);return Math.max(r,g,b)-Math.min(r,g,b)>20&&h>=140&&h<=190}],
  ['chroma>8  hue130-200',(r,g,b)=>{const h=hue(r,g,b);return Math.max(r,g,b)-Math.min(r,g,b)>8&&h>=130&&h<=200}],
]
for (const wv of ['1','2','3','4']) {
  const d=decode(B+wv+'/sidebar.png')
  const out=[]
  for (const [name,fn] of DEFS) {
    const per=[]
    for (const X of [6,7]) {
      let best=0,by0=-1,by1=-1,cur=null
      for(let y=0;y<d.h;y++){const o=(y*d.w+X)*4
        if(fn(d.data[o],d.data[o+1],d.data[o+2])){if(!cur)cur={y0:y,y1:y};else cur.y1=y}
        else{if(cur){if(cur.y1-cur.y0+1>best){best=cur.y1-cur.y0+1;by0=cur.y0;by1=cur.y1};cur=null}}}
      if(cur&&cur.y1-cur.y0+1>best){best=cur.y1-cur.y0+1;by0=cur.y0;by1=cur.y1}
      per.push(`x${X}=${best}${best?`(y${by0}..${by1})`:''}`)
    }
    out.push(`${name}: ${per.join(' ')}`)
  }
  console.log(`  wave ${wv}:`)
  for(const o of out)console.log(`     ${o}`)
  let mint=0
  for(let i=0;i<d.w*d.h;i++){const o=i*4;const r=d.data[o],g=d.data[o+1],b=d.data[o+2]
    const h=hue(r,g,b);if(Math.max(r,g,b)-Math.min(r,g,b)>20&&h>=140&&h<=190)mint++}
  console.log(`     total sidebar mint px (chroma>20 hue140-190) = ${mint}`)
}

console.log('\n\n=== IS THE TOP OF THE TRANSCRIPT CLIPPED? shape of the first visible element ===')
for (const wv of ['4']) {
  const d=decode(B+wv+'/chat.png')
  const BG=[3,6,6,163]
  const isInk=(x,y)=>{const o=(y*d.w+x)*4;let dd=0;for(let c=0;c<4;c++)dd+=Math.abs(d.data[o+c]-BG[c]);return dd>0}
  console.log(`  chat.png ${d.w}x${d.h}`)
  for(let y=0;y<=44;y++){
    let l=-1,r=-1,n=0
    for(let x=0;x<d.w;x++)if(isInk(x,y)){if(l<0)l=x;r=x;n++}
    console.log(`   y=${String(y).padStart(2)}  ${n?`x${l}..${r} w=${r-l+1} n=${n}`:'(empty)'}`)
  }
}
