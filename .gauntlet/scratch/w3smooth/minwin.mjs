import { decode } from './png.mjs'
const B='D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/'
for (const wv of ['1','2','3']) {
  const d = decode(B+wv+'/welcome-min-window.png')
  // find bg = most common
  const hist=new Map()
  for(let i=0;i<d.w*d.h;i++){const o=i*4;const k=d.data[o]+','+d.data[o+1]+','+d.data[o+2]+','+d.data[o+3];hist.set(k,(hist.get(k)||0)+1)}
  const bgk=[...hist.entries()].sort((a,b)=>b[1]-a[1])[0]
  const BG=bgk[0].split(',').map(Number)
  const isInk=(i)=>{const o=i*4;return !(d.data[o]===BG[0]&&d.data[o+1]===BG[1]&&d.data[o+2]===BG[2]&&d.data[o+3]===BG[3])}
  let minx=1e9,maxx=-1,miny=1e9,maxy=-1,n=0
  const rows=[]
  for(let y=0;y<d.h;y++){let rmin=1e9,rmax=-1,rn=0
    for(let x=0;x<d.w;x++){const i=y*d.w+x;if(isInk(i)){if(x<rmin)rmin=x;if(x>rmax)rmax=x;rn++;if(x<minx)minx=x;if(x>maxx)maxx=x;if(y<miny)miny=y;if(y>maxy)maxy=y;n++}}
    rows.push({y,rmin,rmax,rn})}
  const bands=[];let cur=null
  for(const r of rows){if(r.rn>0){if(!cur)cur={y0:r.y,y1:r.y,l:r.rmin,r:r.rmax,px:r.rn};else{cur.y1=r.y;cur.l=Math.min(cur.l,r.rmin);cur.r=Math.max(cur.r,r.rmax);cur.px+=r.rn}}else{if(cur){bands.push(cur);cur=null}}}
  if(cur)bands.push(cur)
  console.log(`\n=== WAVE ${wv} welcome-min-window ${d.w}x${d.h} bg=${bgk[0]} (${(100*bgk[1]/(d.w*d.h)).toFixed(2)}%) pane centre ${d.w/2} ===`)
  console.log(`ink bbox x[${minx}..${maxx}] w=${maxx-minx+1} y[${miny}..${maxy}] h=${maxy-miny+1} px=${n}`)
  console.log(`L=${minx} R=${d.w-1-maxx} asym=${minx-(d.w-1-maxx)} bboxCentre=${(minx+maxx+1)/2} disp=${((minx+maxx+1)/2-d.w/2).toFixed(2)}`)
  for(const b of bands) console.log(`   y ${String(b.y0).padStart(3)}..${String(b.y1).padStart(3)} h=${String(b.y1-b.y0+1).padStart(3)} x ${String(b.l).padStart(4)}..${String(b.r).padStart(4)} w=${String(b.r-b.l+1).padStart(4)} px=${b.px}`)
}
