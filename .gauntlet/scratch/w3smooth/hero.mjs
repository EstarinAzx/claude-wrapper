import { decode } from './png.mjs'
const B='D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/'
const BG=[3,6,6,163]
function isInk(d,i){ const o=i*4; return !(d.data[o]===BG[0]&&d.data[o+1]===BG[1]&&d.data[o+2]===BG[2]&&d.data[o+3]===BG[3]) }
// alpha-weighted "mass": distance from bg, used for centroid
function mass(d,i){ const o=i*4
  return Math.abs(d.data[o]-BG[0])+Math.abs(d.data[o+1]-BG[1])+Math.abs(d.data[o+2]-BG[2])+Math.abs(d.data[o+3]-BG[3]) }
for (const wv of ['1','2','3']) {
  const d = decode(B+wv+'/welcome.png')
  let minx=1e9,maxx=-1,miny=1e9,maxy=-1,n=0,sx=0,sm=0
  const rows=[]
  for (let y=0;y<d.h;y++){
    let rmin=1e9,rmax=-1,rn=0
    for (let x=0;x<d.w;x++){ const i=y*d.w+x; if(isInk(d,i)){ if(x<rmin)rmin=x; if(x>rmax)rmax=x; rn++
        if(x<minx)minx=x; if(x>maxx)maxx=x; if(y<miny)miny=y; if(y>maxy)maxy=y; n++
        const m=mass(d,i); sx+=x*m; sm+=m } }
    rows.push({y,rmin,rmax,rn})
  }
  // group contiguous ink rows into bands
  const bands=[]
  let cur=null
  for (const r of rows){ if(r.rn>0){ if(!cur) cur={y0:r.y,y1:r.y,l:r.rmin,r:r.rmax,px:r.rn}; else {cur.y1=r.y; cur.l=Math.min(cur.l,r.rmin); cur.r=Math.max(cur.r,r.rmax); cur.px+=r.rn} } else { if(cur){bands.push(cur);cur=null} } }
  if(cur)bands.push(cur)
  const bboxL=minx, bboxR=d.w-1-maxx
  const bboxCentre=(minx+maxx+1)/2
  const centroid=sx/sm+0.5
  console.log(`\n=== WAVE ${wv}  welcome.png ${d.w}x${d.h}  pane centre ${d.w/2} ===`)
  console.log(`ink bbox x[${minx}..${maxx}] width=${maxx-minx+1}  y[${miny}..${maxy}] height=${maxy-miny+1}  inkpx=${n}`)
  console.log(`left margin=${bboxL}  right margin=${bboxR}  L-R asymmetry=${bboxL-bboxR}  bbox centre=${bboxCentre} disp=${(bboxCentre-d.w/2).toFixed(2)}`)
  console.log(`mass centroid x=${centroid.toFixed(2)} disp=${(centroid-d.w/2).toFixed(2)}`)
  console.log(`bands (merged, gap>=1 blank row):`)
  for (const b of bands) console.log(`   y ${String(b.y0).padStart(3)}..${String(b.y1).padStart(3)} h=${String(b.y1-b.y0+1).padStart(3)}  x ${String(b.l).padStart(4)}..${String(b.r).padStart(4)} w=${String(b.r-b.l+1).padStart(4)}  px=${b.px}`)
}
