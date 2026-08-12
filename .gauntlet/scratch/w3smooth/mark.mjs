import { decode } from './png.mjs'
const B='D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/'
const hue=(r,g,b)=>{const mx=Math.max(r,g,b),mn=Math.min(r,g,b),c=mx-mn;if(!c)return -1
  let h;if(mx===r)h=((g-b)/c)%6;else if(mx===g)h=(b-r)/c+2;else h=(r-g)/c+4;return (h*60+360)%360}
// SOLID mint core only: exact token colour
function markProfile(file,rx0,rx1,ry0,ry1,label){
  const d=decode(B+file)
  const solid=(x,y)=>{const o=(y*d.w+x)*4;return d.data[o]===161&&d.data[o+1]===228&&d.data[o+2]===214&&d.data[o+3]===255}
  let x0=1e9,x1=-1,y0=1e9,y1=-1,n=0
  for(let y=ry0;y<=ry1;y++)for(let x=rx0;x<=rx1;x++)if(solid(x,y)){n++;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
  const w=x1-x0+1,h=y1-y0+1
  const ins=[]
  for(let dy=0;dy<Math.min(h,14);dy++){let x=x0;while(x<=x1&&!solid(x,y0+dy))x++;ins.push(x-x0)}
  let k=0;while(k<ins.length&&ins[k]>0)k++
  // area-based radius: missing corner area = 4 * r^2 * (1 - pi/4)
  const missing = w*h - n
  const rArea = Math.sqrt(missing/(4*(1-Math.PI/4)))
  console.log(`  ${label.padEnd(22)} box ${w}x${h} at x${x0}..${x1} y${y0}..${y1}  solidpx=${n}`)
  console.log(`     inset profile [${ins.join(',')}]  rRows=${k}  r(area-est)=${rArea.toFixed(2)}  r/side=${(rArea/h).toFixed(4)}`)
  return {w,h,rArea}
}
console.log('=== IDENTITY MARK at its two sizes (solid mint core), wave 3 ===')
const tb=markProfile('3/titlebar.png',5,45,5,45,'titlebar .logo-mark')
const wl=markProfile('3/welcome.png',500,570,230,300,'welcome .welcome-mark')
console.log(`\n  scale factor between marks: ${(wl.h/tb.h).toFixed(3)}x  (${tb.h}px -> ${wl.h}px)`)
console.log(`  r/side ratio: titlebar ${(tb.rArea/tb.h).toFixed(4)}  welcome ${(wl.rArea/wl.h).toFixed(4)}  ratio-of-ratios ${(  (tb.rArea/tb.h)/(wl.rArea/wl.h) ).toFixed(3)}x`)
console.log(`  scale-invariant r would be ${(tb.rArea*wl.h/tb.h).toFixed(2)}px on the welcome mark; measured ${wl.rArea.toFixed(2)}px`)
