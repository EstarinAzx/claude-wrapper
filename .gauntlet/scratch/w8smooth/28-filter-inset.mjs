import { decode } from './png.mjs'
const I=decode('.gauntlet/waves/core-after-docks/8/sidebar.png')
const near=(c,t,k)=>Math.abs(c[0]-t[0])+Math.abs(c[1]-t[1])+Math.abs(c[2]-t[2])<=k
const F=[29,34,35],G=[11,15,17]
let x0=1e9,x1=-1,y0=1e9,y1=-1,n=0
const pts=[]
for(let y=116;y<=143;y++)for(let x=16;x<=238;x++){const c=I.at(x,y); if(!near(c,F,8)&&!near(c,G,8)){n++;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;if(x<25)pts.push([x,y,c])}}
console.log(`placeholder ink candidate x${x0}..${x1} y${y0}..${y1} n=${n}; inset from field x16 = ${x0-16}`)
console.log('pixels x<25:',pts.slice(0,80).map(p=>`x${p[0]}y${p[1]}=${p[2].join('/')}`).join(' '))
// main text color candidates by frequency
const m=new Map()
for(let y=116;y<=143;y++)for(let x=16;x<=238;x++){const k=I.at(x,y).join(',');m.set(k,(m.get(k)||0)+1)}
console.log('top colors:',[...m.entries()].sort((a,b)=>b[1]-a[1]).slice(0,15))
