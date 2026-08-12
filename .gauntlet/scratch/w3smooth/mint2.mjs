import { decode } from './png.mjs'
const B='D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/'
const surfaces=['welcome','titlebar','sidebar','chat','input-bar']
function hue(r,g,b){const mx=Math.max(r,g,b),mn=Math.min(r,g,b),c=mx-mn;if(!c)return -1
  let h; if(mx===r)h=((g-b)/c)%6; else if(mx===g)h=(b-r)/c+2; else h=(r-g)/c+4
  return (h*60+360)%360}
console.log('=== HUE HISTOGRAM of saturated pixels (chroma>20), wave 3, five core surfaces ===')
const bins=new Map()
for(const s of surfaces){const d=decode(B+'3/'+s+'.png')
  for(let i=0;i<d.w*d.h;i++){const o=i*4,r=d.data[o],g=d.data[o+1],b=d.data[o+2]
    if(Math.max(r,g,b)-Math.min(r,g,b)>20){const h=hue(r,g,b);const k=Math.round(h/10)*10;bins.set(k,(bins.get(k)||0)+1)}}}
for(const [k,v] of [...bins.entries()].sort((a,b)=>a[0]-b[0])) if(v>30) console.log(`   hue ~${String(k).padStart(3)}deg  px=${v}`)
console.log('\n=== per-surface mint share at three thresholds, wave 2 vs wave 3 ===')
const defs=[
  ['strict chroma>40 & hue150-180', (r,g,b)=>{const h=hue(r,g,b);return Math.max(r,g,b)-Math.min(r,g,b)>40&&h>=150&&h<=180}],
  ['mid    chroma>20 & hue140-190', (r,g,b)=>{const h=hue(r,g,b);return Math.max(r,g,b)-Math.min(r,g,b)>20&&h>=140&&h<=190}],
  ['loose  chroma>8  & hue130-200', (r,g,b)=>{const h=hue(r,g,b);return Math.max(r,g,b)-Math.min(r,g,b)>8&&h>=130&&h<=200}]
]
for(const [name,fn] of defs){
  const res={}
  for(const wv of ['2','3']){let tot=0,worst={s:'',p:0};const per={}
    for(const s of surfaces){const d=decode(B+wv+'/'+s+'.png');let n=0
      for(let i=0;i<d.w*d.h;i++){const o=i*4;if(fn(d.data[o],d.data[o+1],d.data[o+2]))n++}
      const p=100*n/(d.w*d.h);per[s]=[n,p];tot+=n;if(p>worst.p)worst={s,p}}
    res[wv]={tot,worst,per}}
  console.log(`\n ${name}`)
  for(const s of surfaces) console.log(`   ${s.padEnd(11)} w2=${String(res['2'].per[s][0]).padStart(6)} (${res['2'].per[s][1].toFixed(3)}%)   w3=${String(res['3'].per[s][0]).padStart(6)} (${res['3'].per[s][1].toFixed(3)}%)`)
  console.log(`   TOTAL       w2=${res['2'].tot}  w3=${res['3'].tot}  delta=${res['3'].tot-res['2'].tot} (${(100*(res['3'].tot-res['2'].tot)/res['2'].tot).toFixed(2)}%)`)
  console.log(`   worst-case  w2=${res['2'].worst.p.toFixed(3)}% (${res['2'].worst.s})   w3=${res['3'].worst.p.toFixed(3)}% (${res['3'].worst.s})`)
}
