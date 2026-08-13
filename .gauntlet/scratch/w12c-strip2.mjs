import { decode, at } from './w8lib.mjs'
const D = (n,f) => decode(`.gauntlet/waves/core-after-docks/${n}/${f}.png`)
const A = D('11','input-bar'), B = D('12','input-bar')
const bg=[3,6,6]
const dist=(p)=>Math.abs(p[0]-bg[0])+Math.abs(p[1]-bg[1])+Math.abs(p[2]-bg[2])

console.log('=== row ink profile, x200-980 (thr>8) ===')
for(let y=55;y<=100;y++){
  let na=0,nb=0
  for(let x=200;x<=980;x++){ if(dist(at(A,x,y))>8)na++; if(dist(at(B,x,y))>8)nb++ }
  if(na||nb) console.log(`  y${y}: w11=${String(na).padStart(4)} w12=${String(nb).padStart(4)}`)
}
