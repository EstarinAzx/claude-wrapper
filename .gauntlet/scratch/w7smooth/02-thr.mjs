import { decode } from './png.mjs'
const modal = (I,x0,x1,y0,y1)=>{const m=new Map();for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const k=I.at(x,y).join(',');m.set(k,(m.get(k)||0)+1)}return [...m.entries()].sort((a,b)=>b[1]-a[1])[0][0].split(',').map(Number)}
const dd=(a,b)=>Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1])+Math.abs(a[2]-b[2])
for (const wv of [6,7]) {
  const I = decode(`.gauntlet/waves/core-after-docks/${wv}/titlebar.png`)
  const G = modal(I,400,700,4,40)
  console.log(`--- wave ${wv} ---`)
  for (const thr of [1,2,6,12,24,48]) {
    const on=(x,y)=>dd(I.at(x,y),G)>thr
    const occ=[];for(let x=0;x<300;x++){let n=0;for(let y=1;y<=45;y++)if(on(x,y))n++;occ.push(n)}
    const runs=[];let cur=null
    for(let x=0;x<300;x++){if(occ[x]>0){if(!cur)cur={x0:x};cur.x1=x}else if(cur){runs.push(cur);cur=null}}
    if(cur)runs.push(cur)
    const m=[];for(const r of runs){const l=m[m.length-1];if(l&&r.x0-l.x1-1<=2)l.x1=r.x1;else m.push({...r})}
    // fuse name letterforms (<=8px)
    const m2=[];for(const r of m){const l=m2[m2.length-1];if(l&&r.x0-l.x1-1<=8&&l.x0>=40&&r.x1<=150)l.x1=r.x1;else m2.push({...r})}
    const g=[];for(let k=0;k+1<m2.length;k++)g.push(m2[k+1].x0-m2[k].x1-1)
    console.log(`  thr ${String(thr).padStart(2)}  items ${m2.map(r=>`${r.x0}..${r.x1}`).join(' ')}   gaps ${g.join(' / ')}`)
  }
}
