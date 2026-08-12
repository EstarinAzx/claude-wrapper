import { decode, px, hex } from './png.mjs'
const D=(w)=>`D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/${w}/`
// Chat pane: content extent per wave. Pane is the capture itself (1192 wide).
for(const wv of [1,2]){
  const img=decode(D(wv)+'chat.png')
  const ink=(p)=>Math.abs(p[0]-3)+Math.abs(p[1]-6)+Math.abs(p[2]-6)>18
  let a=1e9,b=-1
  for(let y=0;y<img.h;y++)for(let x=0;x<img.w;x++) if(ink(px(img,x,y))){if(x<a)a=x;if(x>b)b=x}
  const c=(a+b)/2, pc=(img.w-1)/2
  console.log(`w${wv} chat.png  content x${a}..${b}  centre=${c.toFixed(1)} pane centre=${pc}  off=${(c-pc).toFixed(1)}   margins L=${a} R=${img.w-1-b}`)
}
// Welcome grid COLUMN vs its INK: the mark and CTA mark the column's left edge.
{const img=decode(D(2)+'welcome.png')
 console.log(`\nWelcome: grid column left edge = x480 (mark & CTA both start there)`)
 console.log(`  .welcome padding 32px; content box x32..1407 (1376 wide)`)
 console.log(`  column 480px centred -> 32 + (1376-480)/2 = ${32+(1376-480)/2}  => column x480..959`)
 console.log(`  hint ink x480..894 = 415px painted; 480-415 = ${480-415}px of the column unused, ALL on the right`)}
