import { decode, at } from './w8lib.mjs'
import { oklch } from './w8smooth/png.mjs'
const D=(n,f)=>decode(`.gauntlet/waves/core-after-docks/${n}/${f}.png`)
const B=D('12','input-bar'), S=D('12','sidebar'), C=D('12','chat')
const L=(p)=>oklch(p[0],p[1],p[2]).L
const modal=(im,x0,x1,y0,y1)=>{const m=new Map();for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const k=at(im,x,y).slice(0,3).join(',');m.set(k,(m.get(k)||0)+1)}return [...m].sort((a,b)=>b[1]-a[1])}

console.log('=== composer ground (input-bar strip band) ===')
const g=modal(B,211,970,66,86)[0]; const gp=g[0].split(',').map(Number)
console.log(`  ground rgb(${g[0]}) L=${L(gp).toFixed(4)}  n=${g[1]}`)

console.log('\n=== effort READOUT shell (x379-446 y66-86) : fill + border ===')
console.log('  top 5 colours:', modal(B,379,446,66,86).slice(0,5).map(([k,n])=>`rgb(${k})x${n} L=${L(k.split(',').map(Number)).toFixed(4)}`).join('\n                ')) 
console.log('\n=== model PILL shell (x913-970 y66-86) ===')
console.log('  top 5 colours:', modal(B,913,970,66,86).slice(0,5).map(([k,n])=>`rgb(${k})x${n} L=${L(k.split(',').map(Number)).toFixed(4)}`).join('\n                '))

console.log('\n=== TRACK (x243-372 y75-76) ===')
console.log('  top 3:', modal(B,243,372,75,76).slice(0,3).map(([k,n])=>`rgb(${k})x${n} L=${L(k.split(',').map(Number)).toFixed(4)}`).join('  '))

console.log('\n=== CORNER RADII by arc inset (rows from the box top, first painted x) ===')
const arc=(im,x0,x1,y0,thr,label)=>{const out=[];for(let d=0;d<8;d++){let f=-1;for(let x=x0;x<=x1;x++){const p=at(im,x,y0+d);if(Math.abs(p[0]-gp[0])+Math.abs(p[1]-gp[1])+Math.abs(p[2]-gp[2])>thr){f=x;break}}out.push(f<0?'-':f-x0)}console.log(`  ${label}: inset by row = [${out.join(',')}]`)}
arc(B,379,446,66,8,'effort readout')
arc(B,913,970,66,8,'model pill    ')
