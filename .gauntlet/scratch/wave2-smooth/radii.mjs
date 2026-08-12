import { decode, px, hex } from './png.mjs'
const D=(w)=>`D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/${w}/`
// r from the corner arc: at the box's leftmost column, the first fully-covered
// row is y0+r; at the box's topmost row, the first fully-covered column is x0+r.
function radius(img,t,a,x0,y0,x1,y1){
  const is=(x,y)=>{const p=px(img,x,y);return hex(p)===t&&p[3]===a}
  let ry=null; for(let y=y0;y<=y1;y++) if(is(x0,y)){ry=y-y0;break}
  let rx=null; for(let x=x0;x<=x1;x++) if(is(x,y0)){rx=x-x0;break}
  return {rx,ry}
}
const BOXES=[
 [2,'input-bar.png','composer pill (.composer-pill)','#0b0f11',216,217,13,974,60],
 [2,'chat.png','tool card #1 (.tool-card)','#0b0f11',216,252,222,819,329],
 [2,'chat.png','tool card #2 (.tool-card)','#0b0f11',216,252,436,819,544],
 [2,'chat.png','user bubble #1 (.user-bubble)','#212426',246,515,13,970,84],
 [2,'chat.png','user bubble #2 (.user-bubble)','#212426',246,571,586,970,633],
 [1,'chat.png','tool card #1 (w1 baseline)','#0b0f11',216,252,214,819,321],
 [1,'chat.png','user bubble #1 (w1 baseline)','#212426',246,515,5,970,76]]
for(const [wv,f,name,t,a,x0,y0,x1,y1] of BOXES){
  const img=decode(D(wv)+f); const {rx,ry}=radius(img,t,a,x0,y0,x1,y1)
  const w=x1-x0+1,h=y1-y0+1
  console.log(`w${wv} ${name.padEnd(30)} ${String(w).padStart(4)}x${String(h).padStart(3)}  r(from top row)=${rx}  r(from left col)=${ry}`)
}
