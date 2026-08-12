import { decode } from './png.mjs'
const B='D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/'
const BG=[11,15,17,216]
const dist=(d,i)=>{const o=i*4;return Math.abs(d.data[o]-BG[0])+Math.abs(d.data[o+1]-BG[1])+Math.abs(d.data[o+2]-BG[2])+Math.abs(d.data[o+3]-BG[3])}
for (const wv of ['2','3']) {
  const d = decode(B+wv+'/titlebar.png')
  console.log(`\n=== WAVE ${wv} titlebar ${d.w}x${d.h} : row occupancy (thr>12) ===`)
  for(let y=0;y<d.h;y++){let n=0;for(let x=0;x<d.w;x++)if(dist(d,y*d.w+x)>12)n++
    if(y<6||y>d.h-6||n>0&&n<1400) console.log(`  y=${String(y).padStart(2)} ink=${n}`)
  }
}
