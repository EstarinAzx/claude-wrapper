import { decode } from './png.mjs'
const B='D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/'
for (const wv of ['2','3']) {
  const d = decode(B+wv+'/titlebar.png')
  for (const y of [24]) {
    console.log(`\n=== WAVE ${wv} titlebar row y=${y} colour runs (len>=2) ===`)
    let runs=[],cur=null
    for(let x=0;x<d.w;x++){const o=(y*d.w+x)*4;const k=`${d.data[o]},${d.data[o+1]},${d.data[o+2]},${d.data[o+3]}`
      if(cur&&cur.k===k){cur.x1=x}else{if(cur)runs.push(cur);cur={k,x0:x,x1:x}}}
    if(cur)runs.push(cur)
    let out=[]
    for(const r of runs){const len=r.x1-r.x0+1; out.push(`${r.x0}-${r.x1}(${len}) [${r.k}]`)}
    console.log(out.join('\n'))
  }
}
