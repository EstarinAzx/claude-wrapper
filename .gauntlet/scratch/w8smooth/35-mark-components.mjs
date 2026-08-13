import { decode, oklch } from './png.mjs'
for(const wv of [7,8]){
 const I=decode(`.gauntlet/waves/core-after-docks/${wv}/chat.png`);const m=new Uint8Array(I.w*I.h)
 for(let y=0;y<I.h;y++)for(let x=0;x<I.w;x++){const o=oklch(...I.at(x,y));if(o.C>=0.05&&o.H>=140&&o.H<=200)m[y*I.w+x]=1}
 const seen=new Uint8Array(m.length),out=[]
 for(let i=0;i<m.length;i++){if(!m[i]||seen[i])continue;let st=[i],x0=1e9,x1=-1,y0=1e9,y1=-1,n=0;seen[i]=1;while(st.length){const j=st.pop(),x=j%I.w,y=(j-x)/I.w;n++;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy,k=yy*I.w+xx;if(xx>=0&&yy>=0&&xx<I.w&&yy<I.h&&m[k]&&!seen[k]){seen[k]=1;st.push(k)}}}if(n>20)out.push({x0,x1,y0,y1,n})}
 console.log(`w${wv}`,out)
}
