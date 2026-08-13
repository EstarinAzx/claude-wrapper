import { decode, at } from './w8lib.mjs'
const D = (n,f) => decode(`.gauntlet/waves/core-after-docks/${n}/${f}.png`)
const A = D('11','input-bar'), B = D('12','input-bar')

// background = modal colour of the band
const modal = (im,y0,y1)=>{const m=new Map();for(let y=y0;y<=y1;y++)for(let x=0;x<im.w;x++){const k=at(im,x,y).slice(0,3).join(',');m.set(k,(m.get(k)||0)+1)}return [...m].sort((a,b)=>b[1]-a[1])[0]}
console.log('band y60-92 modal colour  w11:',modal(A,60,92),' w12:',modal(B,60,92))

const bg = modal(A,60,92)[0].split(',').map(Number)
const dist = (p)=>Math.abs(p[0]-bg[0])+Math.abs(p[1]-bg[1])+Math.abs(p[2]-bg[2])

// column ink profile across the strip band
const prof = (im,y0,y1,thr)=>{const c=[];for(let x=0;x<im.w;x++){let n=0;for(let y=y0;y<=y1;y++) if(dist(at(im,x,y))>thr) n++; c.push(n)}return c}
const runs = (c,minv)=>{const r=[];let s=-1;for(let x=0;x<c.length;x++){if(c[x]>=minv){if(s<0)s=x}else{if(s>=0){r.push([s,x-1]);s=-1}}}if(s>=0)r.push([s,c.length-1]);return r}
const merge=(r,gap)=>{const o=[];for(const [s,e] of r){if(o.length&&s-o[o.length-1][1]-1<=gap)o[o.length-1][1]=e;else o.push([s,e])}return o}

for (const [name,im] of [['w11',A],['w12',B]]) {
  const c = prof(im,60,92,6)
  const r = merge(runs(c,1),4)
  console.log(`\n${name} strip band y60-92, ink runs (gap<=4 merged), width>=3:`)
  for (const [s,e] of r) if (e-s+1>=3) console.log(`   x${s}-${e}  w=${e-s+1}`)
}
