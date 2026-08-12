import { decode } from './png.mjs'
const B='D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/'
for(const surf of ['sidebar','titlebar','welcome','window-session','window-welcome','welcome-min-window']){
  const a=decode(B+'2/'+surf+'.png'), b=decode(B+'3/'+surf+'.png')
  if(a.w!==b.w||a.h!==b.h){console.log(surf,'DIM MISMATCH');continue}
  let n=0,x0=1e9,x1=-1,y0=1e9,y1=-1
  const rowsChanged=new Map()
  for(let y=0;y<a.h;y++)for(let x=0;x<a.w;x++){const o=(y*a.w+x)*4
    if(a.data[o]!==b.data[o]||a.data[o+1]!==b.data[o+1]||a.data[o+2]!==b.data[o+2]||a.data[o+3]!==b.data[o+3]){
      n++;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y
      rowsChanged.set(y,(rowsChanged.get(y)||0)+1)}}
  console.log(`${surf.padEnd(20)} changed=${String(n).padStart(6)} (${(100*n/(a.w*a.h)).toFixed(3)}%)  bbox x${x0}..${x1} y${y0}..${y1}  rows=${rowsChanged.size}`)
  if(n>0&&n<3000){
    const ys=[...rowsChanged.entries()].sort((p,q)=>p[0]-q[0])
    console.log('    rows: '+ys.map(([y,c])=>`${y}:${c}`).join(' '))
  }
}
