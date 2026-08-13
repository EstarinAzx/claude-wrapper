import { decode } from './png.mjs'
import { diffMap, comps } from './02-diff.mjs'
const W=(n,f)=>`.gauntlet/waves/core-after-docks/${n}/${f}`
const ww = diffMap(decode(W(7,'window-welcome.png')), decode(W(8,'window-welcome.png')))
const tb = diffMap(decode(W(7,'titlebar.png')), decode(W(8,'titlebar.png')))
let above=0, below=0
for (let y=0;y<ww.h;y++) for (let x=0;x<ww.w;x++) if(ww.m[y*ww.w+x]) (y<48?above++:below++)
console.log('window-welcome changed:', ww.n, ' y<48:',above,' y>=48:',below)
console.log('titlebar.png changed:', tb.n, ' delta:', above-tb.n)
const c=comps(ww); console.log('components:', c.length)
for(const k of c) console.log(`  x${k.x0}-${k.x1} y${k.y0}-${k.y1} ${k.w}x${k.h} px=${k.c}`)
