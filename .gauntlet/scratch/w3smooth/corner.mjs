import { decode } from './png.mjs'
const B='D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/'
function map(file,x0,y0,w,h,label){
  const d=decode(B+file)
  const pal=new Map(); const chars='.abcdefghijklmnopqrstuvwxyz'
  const grid=[]
  for(let y=y0;y<y0+h;y++){let row=''
    for(let x=x0;x<x0+w;x++){const o=(y*d.w+x)*4
      const k=d.data[o]+','+d.data[o+1]+','+d.data[o+2]+','+d.data[o+3]
      if(!pal.has(k))pal.set(k,chars[pal.size]||'?')
      row+=pal.get(k)}
    grid.push(String(y).padStart(4)+' '+row)}
  console.log(`\n--- ${label} (x${x0}.. y${y0}..) ---`)
  console.log('     '+Array.from({length:w},(_,i)=>String((x0+i)%10)).join(''))
  for(const r of grid)console.log(r)
  for(const [k,v] of pal)console.log(`   ${v} = ${k}`)
}
map('3/commands-dock.png',4,47,26,14,'commands-dock row 1 top-left')
map('3/sidebar.png',4,221,26,20,'sidebar session row top-left (w3)')
map('2/sidebar.png',4,221,26,14,'sidebar session row top-left (w2)')
