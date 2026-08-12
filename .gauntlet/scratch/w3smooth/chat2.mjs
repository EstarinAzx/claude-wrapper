import { decode } from './png.mjs'
const B='D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/'
for(const wv of ['1','2','3']){
const d = decode(B+wv+'/chat.png')
const OUT=[3,6,6,163]
const isInk=(x,y)=>{const o=(y*d.w+x)*4;return !(d.data[o]===OUT[0]&&d.data[o+1]===OUT[1]&&d.data[o+2]===OUT[2]&&d.data[o+3]===OUT[3])}
const col=new Array(d.w).fill(0)
for(let y=0;y<d.h;y++)for(let x=0;x<d.w;x++)if(isInk(x,y))col[x]++
// runs of occupied columns
const runs=[];let cur=null
for(let x=0;x<d.w;x++){if(col[x]>0){if(!cur)cur={x0:x,x1:x};else cur.x1=x}else{if(cur){runs.push(cur);cur=null}}}
if(cur)runs.push(cur)
console.log(`\nchat wave${wv}: column runs`)
for(const r of runs)console.log(`   x${r.x0}..${r.x1} w=${r.x1-r.x0+1}`)
// content = all runs except the last (scrollbar) if it is <=6 wide and near right edge
const content=runs.filter(r=>!(r.x1>=d.w-8&&r.x1-r.x0+1<=6))
const L=content[0].x0, R=content[content.length-1].x1
const cx=(L+R+1)/2
console.log(`   CONTENT (scrollbar excluded): x${L}..${R} w=${R-L+1} L=${L} Rmargin=${d.w-1-R} asym=${L-(d.w-1-R)} cx=${cx} disp=${(cx-d.w/2).toFixed(2)}`)
}
