import { decode, px, hex } from './png.mjs'
import fs from 'node:fs'
const DIRS={1:'D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/1/',2:'D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/2/'}
// Find the most cyan-saturated pixels to learn what mint actually renders as.
const img=decode(DIRS[2]+'titlebar.png')
const hist=new Map()
for(let y=0;y<img.h;y++)for(let x=0;x<img.w;x++){const p=px(img,x,y)
  // cyan-ish: g and b both clearly above r
  if(p[1]-p[0]>25&&p[2]-p[0]>25){const k=hex(p);hist.set(k,(hist.get(k)||0)+1)}}
console.log('titlebar cyan-ish distinct colours:',hist.size)
console.log([...hist.entries()].sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v])=>`${k} x${v}`).join('  '))
