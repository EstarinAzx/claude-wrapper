import { decode, at } from './w8lib.mjs'
const D = (n,f) => decode(`.gauntlet/waves/core-after-docks/${n}/${f}.png`)

console.log('=== 1. the 3 nondeterminism pixels: w11 -> prebuild -> w12 ===')
const s11=D('11','sidebar'), sPB=D('12-prebuild-control','sidebar'), s12=D('12','sidebar')
for (let y=139;y<=141;y++) for (let x=16;x<=18;x++){
  const a=at(s11,x,y), b=at(sPB,x,y), c=at(s12,x,y)
  const dab=a.map((v,i)=>b[i]-v), dbc=b.map((v,i)=>c[i]-v)
  if (dab.some(v=>v!==0)||dbc.some(v=>v!==0))
    console.log(`  sidebar x${x} y${y}: w11[${a}] -> PB[${b}] (d=${dab}) -> w12[${c}] (d=${dbc})  roundtrip=${a.every((v,i)=>v===c[i])}`)
}
const ws11=D('11','window-session'), wsPB=D('12-prebuild-control','window-session'), ws12=D('12','window-session')
for (let y=187;y<=189;y++) for (let x=16;x<=18;x++){
  const a=at(ws11,x,y), b=at(wsPB,x,y), c=at(ws12,x,y)
  const dab=a.map((v,i)=>b[i]-v)
  if (dab.some(v=>v!==0))
    console.log(`  window-session x${x} y${y}: d(w11->PB)=${dab}  roundtrip_to_w12=${a.every((v,i)=>v===c[i])}`)
}

console.log('\n=== 2. max abs channel delta of the nondeterminism set ===')
let maxd=0, chans=0
for (let y=139;y<=141;y++) for (let x=16;x<=18;x++){
  const a=at(s11,x,y), b=at(sPB,x,y)
  for(let i=0;i<3;i++){ const d=Math.abs(b[i]-a[i]); if(d>0)chans++; if(d>maxd)maxd=d }
}
console.log(`  max abs RGB channel delta = ${maxd}; RGB channels differing = ${chans}`)

console.log('\n=== 3. are the 903 sets identical across the 3 files? (offset-mapped) ===')
const ib11=D('11','input-bar'), ib12=D('12','input-bar')
const sh11=D('11','window-session-short'), sh12=D('12','window-session-short')
const collect=(A,B)=>{const s=[];for(let y=0;y<A.h;y++)for(let x=0;x<A.w;x++){const i=(y*A.w+x)*A.ch;if(A.px[i]!==B.px[i]||A.px[i+1]!==B.px[i+1]||A.px[i+2]!==B.px[i+2])s.push([x,y,A.px[i],A.px[i+1],A.px[i+2],B.px[i],B.px[i+1],B.px[i+2]])}return s}
const setIB=collect(ib11,ib12), setWS=collect(ws11,ws12), setSH=collect(sh11,sh12)
console.log(`  counts: input-bar=${setIB.length} window-session=${setWS.length} short=${setSH.length}`)
const key=(s,dx,dy)=>s.map(p=>`${p[0]-dx},${p[1]-dy}:${p.slice(2).join('/')}`).sort().join('|')
const kIB=key(setIB,0,0), kWS=key(setWS,248,768), kSH=key(setSH,248,885)
console.log(`  input-bar === window-session(-248,-768) : ${kIB===kWS}`)
console.log(`  input-bar === short(-248,-885)          : ${kIB===kSH}`)
console.log(`  (short frame offset from window-session = ${885-768}px)`)

console.log('\n=== 4. bbox arithmetic ===')
const bb=(s)=>[Math.min(...s.map(p=>p[0])),Math.max(...s.map(p=>p[0])),Math.min(...s.map(p=>p[1])),Math.max(...s.map(p=>p[1]))]
console.log(`  input-bar      x${bb(setIB)[0]}-${bb(setIB)[1]} y${bb(setIB)[2]}-${bb(setIB)[3]}`)
console.log(`  window-session x${bb(setWS)[0]}-${bb(setWS)[1]} y${bb(setWS)[2]}-${bb(setWS)[3]}`)
console.log(`  short          x${bb(setSH)[0]}-${bb(setSH)[1]} y${bb(setSH)[2]}-${bb(setSH)[3]}`)
