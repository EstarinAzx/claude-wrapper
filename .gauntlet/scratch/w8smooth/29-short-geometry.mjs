import { decode } from './png.mjs'
const A=decode('.gauntlet/waves/core-after-docks/7/window-session-short.png')
const B=decode('.gauntlet/waves/core-after-docks/8/window-session-short.png')
const BD=[29,34,35]
const near=(c,t,k=6)=>Math.abs(c[0]-t[0])+Math.abs(c[1]-t[1])+Math.abs(c[2]-t[2])<=k
const cards=I=>{
 const rows=[]
 for(let y=48;y<I.h-132;y++){let best=0,cur=0,sx=-1,bx=-1;for(let x=248;x<I.w;x++){if(near(I.at(x,y),BD)){if(cur===0)sx=x;cur++;if(cur>best){best=cur;bx=sx}}else cur=0}if(best>=300)rows.push({y,len:best,x0:bx,x1:bx+best-1})}
 return rows
}
for(const [wv,I] of [[7,A],[8,B]]){const r=cards(I);console.log(`w${wv} ${I.w}x${I.h}: border rows`,r);for(let i=0;i+1<r.length;i+=2)console.log(` card ${i/2+1} y${r[i].y}..${r[i+1].y} outer ${r[i+1].y-r[i].y+1} inner ${r[i+1].y-r[i].y-1}`)}
