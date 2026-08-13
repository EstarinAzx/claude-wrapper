import { decode, at } from './w8lib.mjs'
const D = (n,f) => decode(`.gauntlet/waves/core-after-docks/${n}/${f}.png`)
const A = D('11','input-bar'), B = D('12','input-bar')
const bg=[3,6,6]
const dist=(p)=>Math.abs(p[0]-bg[0])+Math.abs(p[1]-bg[1])+Math.abs(p[2]-bg[2])
const runs=(c,minv)=>{const r=[];let s=-1;for(let x=0;x<c.length;x++){if(c[x]>=minv){if(s<0)s=x}else{if(s>=0){r.push([s,x-1]);s=-1}}}if(s>=0)r.push([s,c.length-1]);return r}
const merge=(r,gap)=>{const o=[];for(const [s,e] of r){if(o.length&&s-o[o.length-1][1]-1<=gap)o[o.length-1][1]=e;else o.push([s,e])}return o}
const colprof=(im,y0,y1,thr)=>{const c=[];for(let x=0;x<im.w;x++){let n=0;for(let y=y0;y<=y1;y++) if(dist(at(im,x,y))>thr)n++; c.push(n)}return c}

console.log('=== sub-groups on strip row (gap<=3) ===')
for(const [name,im] of [['w11',A],['w12',B]]){
  const c=colprof(im,66,86,8)
  console.log(` ${name}: ${merge(runs(c,1),3).filter(([s,e])=>e-s+1>=2).map(([s,e])=>`x${s}-${e}(${e-s+1})`).join('  ')}`)
}

console.log('\n=== readout / pill SHELLS: rows that carry the top+bottom border ===')
// a lozenge shell paints a near-full-width horizontal hairline at its top and bottom row
for(const [name,im] of [['w11',A],['w12',B]]){
  console.log(` ${name}:`)
  for(let y=66;y<=86;y++){
    const c=[];for(let x=200;x<=990;x++) c.push(dist(at(im,x,y))>8?1:0)
    const r=merge(runs(c,1),2).map(([s,e])=>[s+200,e+200]).filter(([s,e])=>e-s+1>=25)
    if(r.length) console.log(`   y${y}: ${r.map(([s,e])=>`x${s}-${e}(w${e-s+1})`).join('  ')}`)
  }
}
