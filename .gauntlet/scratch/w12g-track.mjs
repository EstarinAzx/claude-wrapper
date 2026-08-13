import { decode, at } from './w8lib.mjs'
import { oklch } from './w8smooth/png.mjs'
const D=(n,f)=>decode(`.gauntlet/waves/core-after-docks/${n}/${f}.png`)
const A=D('11','input-bar'), B=D('12','input-bar')
console.log('=== track pixel colour + chroma (y75, sampled) ===')
for(const [n,im,x0,x1] of [['w11',A,243,310],['w12',B,243,372]]){
  const s=new Map()
  for(let y=75;y<=76;y++)for(let x=x0;x<=x1;x++){const k=at(im,x,y).slice(0,3).join(',');s.set(k,(s.get(k)||0)+1)}
  const top=[...s].sort((a,b)=>b[1]-a[1]).slice(0,3)
  for(const [k,c] of top){const [r,g,b]=k.split(',').map(Number);const o=oklch(r,g,b)
    console.log(`  ${n} rgb(${k}) x${c}  L=${o.L.toFixed(4)} C=${o.C.toFixed(4)} H=${o.H.toFixed(1)}  chromatic(C>=0.05)=${o.C>=0.05}`)}
}
console.log('\n=== new track ink added (px) ===')
const cnt=(im,x0,x1)=>{let n=0;for(let y=75;y<=76;y++)for(let x=x0;x<=x1;x++){const p=at(im,x,y);if(Math.abs(p[0]-3)+Math.abs(p[1]-6)+Math.abs(p[2]-6)>8)n++}return n}
console.log(`  w11 track ink=${cnt(A,240,320)}  w12 track ink=${cnt(B,240,380)}  delta=${cnt(B,240,380)-cnt(A,240,320)}`)

console.log('\n=== ground under the strip: is the widened track over the same ground? ===')
for(const [n,im] of [['w11',A],['w12',B]]) console.log(`  ${n} y70 x243/x330/x400: ${[243,330,400].map(x=>at(im,x,70).slice(0,3).join(',')).join('  ')}`)
