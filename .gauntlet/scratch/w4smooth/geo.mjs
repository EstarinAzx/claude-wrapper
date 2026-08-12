import { decode } from './png.mjs'
const B = 'D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/'
const hue=(r,g,b)=>{const mx=Math.max(r,g,b),mn=Math.min(r,g,b),c=mx-mn;if(!c)return -1
  let h;if(mx===r)h=((g-b)/c)%6;else if(mx===g)h=(b-r)/c+2;else h=(r-g)/c+4;return (h*60+360)%360}
function erode(m,W,H,k){let cur=m
  for(let s=0;s<k;s++){const nx=new Uint8Array(W*H)
    for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x;if(!cur[i])continue;let ok=1
      for(let dy=-1;dy<=1&&ok;dy++)for(let dx=-1;dx<=1;dx++)if(!cur[(y+dy)*W+x+dx]){ok=0;break}
      if(ok)nx[i]=1}
    cur=nx}
  return cur}

const MINT=[161,228,214]   // wave-3 measured flat fill = the authored --mint in sRGB
const SITES=[
  ['titlebar.png','.logo-mark 22px',14,35,13,34,22],
  ['welcome.png','.welcome-mark 44px',513,556,242,285,44],
  ['chat.png','.avatar 28px',211,238,111,138,28],
]

console.log('=== IS THE LANDED RAMP EXACTLY THE AUTHORED alpha=0.1 BLACK RAMP? ===')
console.log('    Predicted from the ACTUAL eroded-mask geometry (per-row pixel counts),')
console.log('    not from an idealised rectangle. v(y) = C * (1 - a*(y-top+0.5)/S).')
for (const [f,label,x0,x1,y0,y1,S] of SITES) {
  const d=decode(B+'4/'+f)
  const m=new Uint8Array(d.w*d.h)
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
    const o=(y*d.w+x)*4,r=d.data[o],g=d.data[o+1],b=d.data[o+2]
    const h=hue(r,g,b)
    if(Math.max(r,g,b)-Math.min(r,g,b)>20&&h>=140&&h<=190)m[y*d.w+x]=1}
  const e=erode(m,d.w,d.h,2)
  // actual per-row counts
  const rows=[]
  for(let y=y0;y<=y1;y++){let n=0;for(let x=x0;x<=x1;x++)if(e[y*d.w+x])n++;if(n)rows.push({y,n})}
  const meas=[[],[],[]]
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const i=y*d.w+x;if(!e[i])continue
    const o=i*4;meas[0].push(d.data[o]);meas[1].push(d.data[o+1]);meas[2].push(d.data[o+2])}
  const sdOf=v=>{const mu=v.reduce((a,b)=>a+b,0)/v.length;return Math.sqrt(v.reduce((a,b)=>a+(b-mu)**2,0)/v.length)}
  const measSD=meas.map(sdOf)

  console.log(`\n  ${label}   box ${S}x${S}   erode-2 rows=${rows.length}  span=${(rows.length/S*100).toFixed(1)}% of the box`)
  // best-fit alpha per channel, plus prediction at the authored 0.1
  for (let c=0;c<3;c++) {
    const pred = a => {
      const vals=[]
      for(const r of rows){const t=(r.y-y0+0.5)/S; const v=MINT[c]*(1-a*t); for(let k=0;k<r.n;k++)vals.push(v)}
      return sdOf(vals)
    }
    // scan alpha for the best fit to the measured sd
    let best=0,bestErr=1e9
    for(let a=0.02;a<=0.30;a+=0.0005){const e2=Math.abs(pred(a)-measSD[c]);if(e2<bestErr){bestErr=e2;best=a}}
    const ch='RGB'[c]
    console.log(`     ${ch}: measured sd=${measSD[c].toFixed(2)}   predicted at authored a=0.1: ${pred(0.1).toFixed(2)}   best-fit a=${best.toFixed(3)}   (C=${MINT[c]})`)
  }
  // the builder's own formula, and the correct per-channel ceilings
  console.log(`     builder formula: 0.1*255*0.87 = 22.19 -> sd 6.41 (one value for all channels)`)
  console.log(`     true full-box ceilings: R ${(MINT[0]*0.1/Math.sqrt(12)).toFixed(2)}  G ${(MINT[1]*0.1/Math.sqrt(12)).toFixed(2)}  B ${(MINT[2]*0.1/Math.sqrt(12)).toFixed(2)}   <- R can never reach 6.41`)
}

console.log('\n=== SHAPE DEPENDENCE (the "does not depend on the box" claim) ===')
console.log('  A ramp\'s sd is size-invariant but NOT shape-invariant: a disc weights mid-ramp rows')
console.log('  more than a near-square does, so a circle reads flatter than a rounded square at equal alpha.')
for (const [f,label,x0,x1,y0,y1,S] of SITES) {
  const d=decode(B+'4/'+f)
  const m=new Uint8Array(d.w*d.h)
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const o=(y*d.w+x)*4,r=d.data[o],g=d.data[o+1],b=d.data[o+2]
    const h=hue(r,g,b);if(Math.max(r,g,b)-Math.min(r,g,b)>20&&h>=140&&h<=190)m[y*d.w+x]=1}
  const e=erode(m,d.w,d.h,2)
  const rows=[];for(let y=y0;y<=y1;y++){let n=0;for(let x=x0;x<=x1;x++)if(e[y*d.w+x])n++;if(n)rows.push(n)}
  const mx=Math.max(...rows), first=rows[0], last=rows[rows.length-1]
  console.log(`  ${label.padEnd(20)} eroded row widths: first=${first} max=${mx} last=${last}  end/max=${(first/mx).toFixed(2)}/${(last/mx).toFixed(2)}  (1.00 = rectangle, ->0 = disc)`)
}
