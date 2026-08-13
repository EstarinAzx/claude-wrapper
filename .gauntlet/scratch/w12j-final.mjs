import { decode, at } from './w8lib.mjs'
const D=(n,f)=>decode(`.gauntlet/waves/core-after-docks/${n}/${f}.png`)
const B=D('12','input-bar'), S=D('12','sidebar'), C=D('12','chat')
const g=[3,6,6], dd=(p,q)=>Math.abs(p[0]-q[0])+Math.abs(p[1]-q[1])+Math.abs(p[2]-q[2])
console.log('=== shell arc: leftmost painted x per row, thr>4 ===')
for(const [n,x0,x1] of [['effort readout',379,446],['model pill    ',913,970]]){
  const o=[]
  for(let y=66;y<=86;y++){let f=-1;for(let x=x0;x<=x1;x++) if(dd(at(B,x,y),g)>4){f=x;break};o.push(f<0?'-':f-x0)}
  console.log(`  ${n} x${x0}: [${o.join(',')}]`)
}
console.log('\n=== effort track: is it a pill or a bar? ends at x243 / x372 ===')
for(let y=74;y<=77;y++){
  const row=[242,243,244,371,372,373].map(x=>`x${x}:${at(B,x,y).slice(0,3).join('/')}`)
  console.log(`  y${y}  ${row.join('  ')}`)
}
console.log('\n=== THUMB: painted disc on the track (w12) ===')
let tx0=1e9,tx1=-1,ty0=1e9,ty1=-1
for(let y=66;y<=86;y++)for(let x=243;x<=372;x++){const p=at(B,x,y);if(dd(p,g)>60&&dd(p,[58,63,64])>40){if(x<tx0)tx0=x;if(x>tx1)tx1=x;if(y<ty0)ty0=y;if(y>ty1)ty1=y}}
console.log(`  thumb bbox x${tx0}-${tx1} (w${tx1-tx0+1}) y${ty0}-${ty1} (h${ty1-ty0+1})`)
console.log(`  travel = trackW - thumbW = ${372-243+1} - ${tx1-tx0+1} = ${(372-243+1)-(tx1-tx0+1)} ; /5 = ${(((372-243+1)-(tx1-tx0+1))/5).toFixed(2)}px per interval`)
const A=D('11','input-bar')
let ax0=1e9,ax1=-1
for(let y=66;y<=86;y++)for(let x=243;x<=310;x++){const p=at(A,x,y);if(dd(p,g)>60&&dd(p,[58,63,64])>40){if(x<ax0)ax0=x;if(x>ax1)ax1=x}}
console.log(`  w11 thumb x${ax0}-${ax1} (w${ax1-ax0+1}) travel ${(310-243+1)-(ax1-ax0+1)} ; /5 = ${(((310-243+1)-(ax1-ax0+1))/5).toFixed(2)}px per interval`)
