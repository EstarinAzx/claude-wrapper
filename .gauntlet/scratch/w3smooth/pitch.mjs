import { decode } from './png.mjs'
const B='D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/'
// line pitch inside a rectangular region: bands of ink rows
function bands(d,x0,x1,y0,y1,thrFn){
  const rows=[]
  for(let y=y0;y<=y1;y++){let n=0;for(let x=x0;x<=x1;x++)if(thrFn(d,y*d.w+x))n++;rows.push({y,n})}
  const out=[];let cur=null
  for(const r of rows){if(r.n>0){if(!cur)cur={y0:r.y,y1:r.y,n:r.n};else{cur.y1=r.y;cur.n+=r.n}}else{if(cur){out.push(cur);cur=null}}}
  if(cur)out.push(cur)
  return out
}
const d=decode(B+'3/chat.png')
// assistant text sits on the (3,6,6,163) ground left of the bubble? find the biggest text region
const light=(dd,i)=>{const o=i*4;return dd.data[o]>90&&dd.data[o+1]>90}
console.log('=== chat: text line bands inside the tool card body x300..800 y240..330 ===')
for(const b of bands(d,300,800,236,330,light)) console.log(`   y${b.y0}..${b.y1} h=${b.y1-b.y0+1} px=${b.n}`)
console.log('=== chat: text line bands in assistant column x300..960 y340..430 ===')
for(const b of bands(d,300,960,336,432,light)) console.log(`   y${b.y0}..${b.y1} h=${b.y1-b.y0+1} px=${b.n}`)
console.log('=== chat: user bubble text x520..966 y13..84 ===')
for(const b of bands(d,520,966,13,84,light)) console.log(`   y${b.y0}..${b.y1} h=${b.y1-b.y0+1} px=${b.n}`)
console.log('\n=== warm accent location, titlebar wave3 ===')
const t=decode(B+'3/titlebar.png')
const hue=(r,g,b)=>{const mx=Math.max(r,g,b),mn=Math.min(r,g,b),c=mx-mn;if(!c)return -1
  let h;if(mx===r)h=((g-b)/c)%6;else if(mx===g)h=(b-r)/c+2;else h=(r-g)/c+4;return (h*60+360)%360}
let x0=1e9,x1=-1,y0=1e9,y1=-1,n=0
for(let y=0;y<t.h;y++)for(let x=0;x<t.w;x++){const o=(y*t.w+x)*4,r=t.data[o],g=t.data[o+1],b=t.data[o+2]
  const h=hue(r,g,b);if(Math.max(r,g,b)-Math.min(r,g,b)>20&&(h<40||h>320)){n++;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}}
console.log(`   warm px=${n} bbox x${x0}..${x1} y${y0}..${y1}  (permission pill is x220..275)`)
