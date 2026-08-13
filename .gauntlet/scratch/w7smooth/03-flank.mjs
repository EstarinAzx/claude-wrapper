import { decode } from './png.mjs'
const f2=(n)=>n.toFixed(2)
const modal=(I,x0,x1,y0,y1)=>{const m=new Map();for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const k=I.at(x,y).join(',');m.set(k,(m.get(k)||0)+1)}return [...m.entries()].sort((a,b)=>b[1]-a[1])[0][0].split(',').map(Number)}
const dd=(a,b)=>Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1])+Math.abs(a[2]-b[2])
for (const wv of [4,5,6,7]) {
  const I = decode(`.gauntlet/waves/core-after-docks/${wv}/titlebar.png`)
  const G = modal(I,400,700,4,40)
  const on=(x,y)=>dd(I.at(x,y),G)>2
  const occ=[];for(let x=0;x<I.w;x++){let n=0;for(let y=1;y<=45;y++)if(on(x,y))n++;occ.push(n)}
  const runs=[];let cur=null
  for(let x=0;x<I.w;x++){if(occ[x]>0){if(!cur)cur={x0:x};cur.x1=x}else if(cur){runs.push(cur);cur=null}}
  if(cur)runs.push(cur)
  const m=[];for(const r of runs){const l=m[m.length-1];if(l&&r.x0-l.x1-1<=8)l.x1=r.x1;else m.push({...r})}
  const iso=m.filter((r,k)=>{const p=m[k-1],n=m[k+1];return (!p||r.x0-p.x1-1>40)&&(!n||n.x0-r.x1-1>40)})
  const t=iso.sort((a,b)=>Math.abs((a.x0+a.x1)/2-719.5)-Math.abs((b.x0+b.x1)/2-719.5))[0]
  const mid=(t.x0+t.x1+1)/2
  console.log(`wave ${wv}  SESSION TITLE ink x${t.x0}..${t.x1} (w=${t.x1-t.x0+1})  midpoint ${f2(mid)}  window centre ${f2(I.w/2)}  DISPLACEMENT ${f2(mid-I.w/2)}px`)
}
// rail divider column read off the composite, below the titlebar
for (const wv of [6,7]) {
  const I = decode(`.gauntlet/waves/core-after-docks/${wv}/window-session.png`)
  const row=500; let s=''
  for (let x=243;x<=252;x++){const c=I.at(x,row);s+=` x${x}:rgb(${c})`}
  console.log(`wave ${wv} rail divider @y500 ${s}`)
}
