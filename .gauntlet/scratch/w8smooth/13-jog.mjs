import { decode } from './png.mjs'
const f2=(n)=>n.toFixed(2)
const PANE_L=248, PANE_R=1439
const modal=(I,x0,x1,y0,y1)=>{const m=new Map();for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const k=I.at(x,y).join(',');m.set(k,(m.get(k)||0)+1)}return [...m.entries()].sort((a,b)=>b[1]-a[1])[0][0].split(',').map(Number)}
const on=(I,x,y,bd,thr=2)=>{const [r,g,b]=I.at(x,y);return Math.abs(r-bd[0])+Math.abs(g-bd[1])+Math.abs(b-bd[2])>thr}
const jobs=[]
for (const wv of [6,7,8]) {
  jobs.push([`wave${wv} SHORT`,`.gauntlet/waves/core-after-docks/${wv}/window-session-short.png`,null,null])
  jobs.push([`wave${wv} window-session`,`.gauntlet/waves/core-after-docks/${wv}/window-session.png`,[60,760],[775,899]])
}
for (const [tag,path,tBand,cBand] of jobs) {
  const I=decode(path)
  const tb=tBand||[60,I.h-140], cb=cBand||[I.h-125,I.h-1]
  const bdT=modal(I,255,300,tb[0],tb[1]), bdC=modal(I,255,300,cb[0],cb[1])
  const bandRows=tb[1]-tb[0]+1
  const occ=[]
  for(let x=1380;x<=PANE_R;x++){let n=0;for(let y=tb[0];y<=tb[1];y++)if(on(I,x,y,bdT))n++;occ.push([x,n])}
  const sb=occ.filter(([,n])=>n>bandRows*0.3)
  const sbLeft=sb.length?sb[0][0]:PANE_R+1
  let L=1e9,R=-1
  for(let y=tb[0];y<=tb[1];y++)for(let x=PANE_L;x<sbLeft;x++)if(on(I,x,y,bdT)){if(x<L)L=x;if(x>R)R=x}
  let L2=1e9,R2=-1
  for(let y=cb[0];y<=cb[1];y++)for(let x=PANE_L;x<=PANE_R;x++)if(on(I,x,y,bdC)){if(x<L2)L2=x;if(x>R2)R2=x}
  console.log(`\n===== ${tag} =====  ${I.w}x${I.h}   bands t y${tb[0]}..${tb[1]} c y${cb[0]}..${cb[1]}`)
  console.log(`  scrollbar: ${sb.length?`PRESENT cols ${sb.map(([x])=>x).join(',')}`:'ABSENT'}`)
  console.log(`  TRANSCRIPT ink x${L}..x${R} w=${R-L+1}   COMPOSER ink x${L2}..x${R2} w=${R2-L2+1}`)
  console.log(`  >>> JOG left ${L2-L>=0?'+':''}${L2-L}px  right ${R2-R>=0?'+':''}${R2-R}px  centre ${f2((L2+R2)/2-(L+R)/2)}px`)
}
