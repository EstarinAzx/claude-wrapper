import { decode, at } from './w8lib.mjs'
const D = (n,f) => decode(`.gauntlet/waves/core-after-docks/${n}/${f}.png`)
const A = D('11','input-bar'), B = D('12','input-bar')
const bg=[3,6,6]
const dist=(p)=>Math.abs(p[0]-bg[0])+Math.abs(p[1]-bg[1])+Math.abs(p[2]-bg[2])
const runs=(c,minv)=>{const r=[];let s=-1;for(let x=0;x<c.length;x++){if(c[x]>=minv){if(s<0)s=x}else{if(s>=0){r.push([s,x-1]);s=-1}}}if(s>=0)r.push([s,c.length-1]);return r}
const merge=(r,gap)=>{const o=[];for(const [s,e] of r){if(o.length&&s-o[o.length-1][1]-1<=gap)o[o.length-1][1]=e;else o.push([s,e])}return o}

for(const [name,im] of [['w11',A],['w12',B]]){
  const c=[];for(let x=0;x<im.w;x++){let n=0;for(let y=66;y<=86;y++) if(dist(at(im,x,y))>8)n++; c.push(n)}
  console.log(`\n=== ${name} strip row y66-86 : ink groups (gap<=8 merged) ===`)
  for(const [s,e] of merge(runs(c,1),8)) if(e-s+1>=2) console.log(`   x${s}-${e}  w=${e-s+1}`)
}

console.log('\n=== the TRACK alone (y75-76, the 2px runnable-track) ===')
for(const [name,im] of [['w11',A],['w12',B]]){
  const c=[];for(let x=0;x<im.w;x++){let n=0;for(let y=75;y<=76;y++) if(dist(at(im,x,y))>8)n++; c.push(n)}
  for(const [s,e] of merge(runs(c,1),3)) if(e-s+1>=10) console.log(`   ${name}: track x${s}-${e}  w=${e-s+1}`)
}

console.log('\n=== the THUMB (widest single run on y71-80 near track start) ===')
for(const [name,im] of [['w11',A],['w12',B]]){
  for(let y of [71,75,80]){
    const c=[];for(let x=280;x<500;x++) c.push(dist(at(im,x,y))>40?1:0)
    const r=merge(runs(c,1),1).map(([s,e])=>[s+280,e+280]).filter(([s,e])=>e-s+1>=3)
    console.log(`   ${name} y${y}: ${r.map(([s,e])=>`x${s}-${e}(w${e-s+1})`).join(' ')}`)
  }
}
