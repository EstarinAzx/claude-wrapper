import { decode } from './png.mjs'
const B = 'D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/'

function bg(d){const h=new Map()
  for(let i=0;i<d.w*d.h;i++){const o=i*4;const k=d.data[o]+','+d.data[o+1]+','+d.data[o+2]+','+d.data[o+3];h.set(k,(h.get(k)||0)+1)}
  return [...h.entries()].sort((a,b)=>b[1]-a[1])[0][0].split(',').map(Number)}

function inkBox(d,BG,x0,x1,y0,y1,thr=0){
  const isInk=(x,y)=>{const o=(y*d.w+x)*4
    let dd=0;for(let c=0;c<4;c++)dd+=Math.abs(d.data[o+c]-BG[c]);return dd>thr}
  let a=1e9,b=-1,t=1e9,bt=-1,n=0
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(isInk(x,y)){if(x<a)a=x;if(x>b)b=x;if(y<t)t=y;if(y>bt)bt=y;n++}
  return {x0:a,x1:b,y0:t,y1:bt,n}
}

const rep=(name,pane,box,paneOrigin=0)=>{
  const L=box.x0-paneOrigin, R=(paneOrigin+pane-1)-box.x1
  const cx=(box.x0+box.x1+1)/2, pc=paneOrigin+pane/2
  console.log(`  ${name.padEnd(42)} x${box.x0}..${box.x1} w=${box.x1-box.x0+1}  L=${L} R=${R} asym=${L-R}  bboxCentre=${cx.toFixed(2)} paneCentre=${pc} DISP=${(cx-pc).toFixed(2)}px`)
  return cx-pc
}

console.log('=== SIX CENTRING PLACES, bbox (NOT centroid), wave 3 vs wave 4 ===')
console.log('    reminder: L-R asymmetry = 2x displacement. Never compare the two.')
for (const wv of ['3','4']) {
  console.log(`\n--- WAVE ${wv} ---`)
  // (1) Welcome hero, full window pane 1440
  {const d=decode(B+wv+'/welcome.png'),BG=bg(d)
   rep('1. Welcome hero ink, pane 1440', 1440, inkBox(d,BG,0,d.w-1,0,d.h-1))}
  // (2) Welcome hero, minimum window pane 640
  {const d=decode(B+wv+'/welcome-min-window.png'),BG=bg(d)
   rep('2. Welcome hero ink, pane 640', 640, inkBox(d,BG,0,d.w-1,0,d.h-1))}
  // (3) Transcript column in chat.png. Pane 1192 with a 10px scrollbar reserve -> 1182.
  {const d=decode(B+wv+'/chat.png'),BG=bg(d)
   const box=inkBox(d,BG,0,d.w-1,0,d.h-1)
   const L=box.x0, R=1181-box.x1
   const cx=(box.x0+box.x1+1)/2
   console.log(`  3. Transcript column, chat.png             x${box.x0}..${box.x1} w=${box.x1-box.x0+1}  L=${L} R(vs 1182)=${R} asym=${L-R}  bboxCentre=${cx.toFixed(2)} paneCentre(1182)=${591} DISP=${(cx-591).toFixed(2)}px   [vs raw 1192 pane: DISP=${(cx-596).toFixed(2)}px]`)}
  // (4) Composer pill in input-bar.png, pane 1192 (no scroll pane)
  {const d=decode(B+wv+'/input-bar.png'),BG=bg(d)
   const box=inkBox(d,BG,0,d.w-1,0,d.h-1)
   rep('4. Composer pill ink, input-bar pane 1192', 1192, box)}
  // (5) Titlebar painted extent, pane 1440
  {const d=decode(B+wv+'/titlebar.png'),BG=bg(d)
   rep('5. Titlebar painted extent, pane 1440', 1440, inkBox(d,BG,0,d.w-1,0,d.h-1))}
  // (6) Sidebar rail content, pane 248
  {const d=decode(B+wv+'/sidebar.png'),BG=bg(d)
   rep('6. Sidebar rail content ink, pane 248', 248, inkBox(d,BG,0,d.w-1,0,d.h-1))}
}

console.log('\n=== (a) THE COMPOSER SEAM: transcript column vs composer pill ===')
for (const wv of ['3','4']) {
  const c=decode(B+wv+'/chat.png'), cb=bg(c)
  const ib=decode(B+wv+'/input-bar.png'), ibb=bg(ib)
  const A=inkBox(c,cb,0,c.w-1,0,c.h-1)
  const Bx=inkBox(ib,ibb,0,ib.w-1,0,ib.h-1)
  const jogL=Bx.x0-A.x0, jogR=Bx.x1-A.x1
  console.log(`  wave ${wv}: transcript x${A.x0}..${A.x1} (w=${A.x1-A.x0+1})   composer x${Bx.x0}..${Bx.x1} (w=${Bx.x1-Bx.x0+1})`)
  console.log(`           left-edge jog=${jogL}px  right-edge jog=${jogR}px  widths equal=${(A.x1-A.x0)===(Bx.x1-Bx.x0)}`)
  console.log(`           each centred in its own pane: transcript (1182-${A.x1-A.x0+1})/2=${(1182-(A.x1-A.x0+1))/2}  composer (1192-${Bx.x1-Bx.x0+1})/2=${(1192-(Bx.x1-Bx.x0+1))/2}`)
}
