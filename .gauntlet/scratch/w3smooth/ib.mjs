import { decode } from './png.mjs'
const B='D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/'
for (const wv of ['2','3']) {
  const d = decode(B+wv+'/input-bar.png')
  console.log(`\n=== WAVE ${wv} input-bar ${d.w}x${d.h} ===`)
  // row-by-row distinct-colour run summary: find structural boxes
  const key=(x,y)=>{const o=(y*d.w+x)*4;return d.data[o]+','+d.data[o+1]+','+d.data[o+2]+','+d.data[o+3]}
  // print per-row first/last non-outer-bg column, using outer bg = (3,6,6,163)
  const OUT='3,6,6,163'
  for(let y=0;y<d.h;y++){
    let l=-1,r=-1
    for(let x=0;x<d.w;x++){if(key(x,y)!==OUT){if(l<0)l=x;r=x}}
    if(y<3||y>d.h-4||(y%1===0&&(l!==-1))) {
      if(l===-1) console.log(`  y=${String(y).padStart(3)} (all outer bg)`)
      else console.log(`  y=${String(y).padStart(3)} nonbg x ${String(l).padStart(4)}..${String(r).padStart(4)} w=${r-l+1} L=${l} R=${d.w-1-r} asym=${l-(d.w-1-r)}`)
    }
  }
}
