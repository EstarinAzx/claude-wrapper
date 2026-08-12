import { decode } from './png.mjs'
const B='D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/'
for(const wv of ['2','3']){
const d = decode(B+wv+'/window-session.png')
console.log(`\n=== window-session wave${wv} ${d.w}x${d.h} ===`)
// The chat pane starts after the 248px sidebar; titlebar is 48 tall.
// Row extents restricted to x>=248 give the chat pane content.
const OUT=[3,6,6,163]
const isInk=(x,y)=>{const o=(y*d.w+x)*4;return !(d.data[o]===OUT[0]&&d.data[o+1]===OUT[1]&&d.data[o+2]===OUT[2]&&d.data[o+3]===OUT[3])}
// column occupancy in the chat pane region only, split transcript rows vs composer rows
const regions=[['transcript', 48, 768],['composer', 769, 899]]
for(const [name,ya,yb] of regions){
  const col=new Array(d.w).fill(0)
  for(let y=ya;y<=yb;y++)for(let x=248;x<d.w;x++)if(isInk(x,y))col[x]++
  const runs=[];let cur=null
  for(let x=248;x<d.w;x++){if(col[x]>0){if(!cur)cur={x0:x,x1:x};else cur.x1=x}else{if(cur){runs.push(cur);cur=null}}}
  if(cur)runs.push(cur)
  console.log(` ${name} y${ya}..${yb}: runs ` + runs.map(r=>`${r.x0}..${r.x1}(${r.x1-r.x0+1})`).join('  '))
  const content=runs.filter(r=>!(r.x1>=d.w-8&&r.x1-r.x0+1<=6))
  if(content.length){const L=content[0].x0,R=content[content.length-1].x1
    const pane0=248, paneW=d.w-248
    console.log(`   content x${L}..${R} w=${R-L+1}  pane[${pane0}..${d.w-1}] centre=${pane0+paneW/2}  cx=${(L+R+1)/2}  disp=${((L+R+1)/2-(pane0+paneW/2)).toFixed(2)}`)}
}
}
