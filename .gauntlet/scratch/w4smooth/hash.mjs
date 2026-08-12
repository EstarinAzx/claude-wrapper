import { createHash } from 'node:crypto'
import { readFileSync, existsSync } from 'node:fs'
import { decode } from './png.mjs'
const B = 'D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/'
const FILES = ['welcome.png','welcome-min-window.png','titlebar.png','sidebar.png','chat.png','input-bar.png','window-welcome.png','window-session.png','agents-dock.png','appearance-dock.png','commands-dock.png']
const sha = p => createHash('sha256').update(readFileSync(p)).digest('hex').slice(0,12)

console.log('=== SHA256 (12) across waves 1..4 ===')
console.log('file'.padEnd(24)+['w1','w2','w3','w4'].map(s=>s.padEnd(14)).join('')+' 3vs4')
for (const f of FILES) {
  const h = ['1','2','3','4'].map(w => existsSync(B+w+'/'+f) ? sha(B+w+'/'+f) : 'MISSING')
  const same34 = h[2]===h[3] ? 'SAME' : 'DIFF'
  const all = h[0]===h[1]&&h[1]===h[2]&&h[2]===h[3] ? '  [identical w1..w4]' : ''
  console.log(f.padEnd(24)+h.map(s=>s.padEnd(14)).join('')+' '+same34+all)
}

console.log('\n=== PIXEL DIFF w3 -> w4: changed-pixel count and bounding box ===')
for (const f of FILES) {
  const a = decode(B+'3/'+f), b = decode(B+'4/'+f)
  if (a.w!==b.w||a.h!==b.h) { console.log(`  ${f} DIMENSION CHANGE ${a.w}x${a.h} -> ${b.w}x${b.h}`); continue }
  let n=0,x0=1e9,x1=-1,y0=1e9,y1=-1,maxd=0
  for (let y=0;y<a.h;y++) for (let x=0;x<a.w;x++) {
    const o=(y*a.w+x)*4
    let dd=0; for(let c=0;c<4;c++) dd+=Math.abs(a.data[o+c]-b.data[o+c])
    if (dd>0){n++;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;if(dd>maxd)maxd=dd}
  }
  if (!n) { console.log(`  ${f.padEnd(24)} 0 changed px  (byte-identical render)`); continue }
  console.log(`  ${f.padEnd(24)} ${String(n).padStart(6)} changed px  bbox x${x0}..${x1} (w=${x1-x0+1}) y${y0}..${y1} (h=${y1-y0+1})  maxAbsSum=${maxd}`)
}
