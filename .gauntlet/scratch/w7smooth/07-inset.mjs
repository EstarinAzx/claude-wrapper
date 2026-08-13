import { decode } from './png.mjs'
const GR=[11,15,17], BD=[29,34,35]
const near=(c,t,k=3)=>Math.abs(c[0]-t[0])+Math.abs(c[1]-t[1])+Math.abs(c[2]-t[2])<=k
for (const wv of [6,7]) {
  const I = decode(`.gauntlet/waves/core-after-docks/${wv}/sidebar.png`)
  // placeholder ink = pixels in the field rows that match NEITHER ground NOR border colour
  let ix0=1e9, ix1=-1, iy0=1e9, iy1=-1, n=0
  for (let y=117;y<=142;y++) for (let x=10;x<=238;x++) {
    const c=I.at(x,y)
    if (!near(c,GR,6) && !near(c,BD,6)) { if(x<ix0)ix0=x; if(x>ix1)ix1=x; if(y<iy0)iy0=y; if(y>iy1)iy1=y; n++ }
  }
  console.log(`wave ${wv}  PLACEHOLDER ink x${ix0}..${ix1} y${iy0}..${iy1}  (${n}px)   field ground starts x16`)
  console.log(`          left inset of ink inside the field: ${ix0-16}px`)
  // sample row y130 raw
  let s=''
  for (let x=14;x<=26;x++) s+=` x${x}:(${I.at(x,130)})`
  console.log(`          y130 raw:${s}`)
}
// compare: what left edge do the ROW TITLES and GROUP HEADINGS below use?
const I = decode('.gauntlet/waves/core-after-docks/7/sidebar.png')
for (const [label,y0,y1] of [['first session row band',202,275],['bands y189..194 (chips)',186,196],['y293..317 region',290,320]]) {
  let ix0=1e9
  for (let y=y0;y<=y1;y++) for (let x=0;x<=238;x++){const c=I.at(x,y); if(!near(c,GR,10)&&!near(c,BD,10)){ if(x<ix0)ix0=x }}
  console.log(`${label}: leftmost non-ground non-border ink x${ix0}`)
}
