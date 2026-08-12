import { decode } from './png.mjs'
const B='D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/'
for (const f of ['welcome','titlebar','sidebar','chat','input-bar']) {
  const d = decode(B+'3/'+f+'.png')
  const hist = new Map()
  for (let i=0;i<d.w*d.h;i++){ const k = d.data[i*4]+','+d.data[i*4+1]+','+d.data[i*4+2]+','+d.data[i*4+3]; hist.set(k,(hist.get(k)||0)+1) }
  const top = [...hist.entries()].sort((a,b)=>b[1]-a[1]).slice(0,6)
  console.log(f, d.w+'x'+d.h, 'uniq='+hist.size)
  for (const [k,v] of top) console.log('   ', k, v, (100*v/(d.w*d.h)).toFixed(2)+'%')
}
