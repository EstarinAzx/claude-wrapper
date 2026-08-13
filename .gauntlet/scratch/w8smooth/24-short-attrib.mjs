import { decode } from './png.mjs'
const A=decode('.gauntlet/waves/core-after-docks/7/window-session-short.png')
const B=decode('.gauntlet/waves/core-after-docks/8/window-session-short.png')
const eq=(a,b)=>a[0]===b[0]&&a[1]===b[1]&&a[2]===b[2]
const region=(label,ay0,ay1,by0,by1)=>{
  const h=Math.min(ay1-ay0+1,by1-by0+1);let n=0
  for(let k=0;k<h;k++)for(let x=0;x<A.w;x++)if(!eq(A.at(x,ay0+k),B.at(x,by0+k)))n++
  console.log(`${label}: h${h} differences ${n} of ${h*A.w}`)
}
console.log(`short dimensions wave7 ${A.w}x${A.h}, wave8 ${B.w}x${B.h}, height delta ${B.h-A.h}`)
region('top-aligned whole common',0,B.h-1,0,B.h-1)
region('titlebar',0,47,0,47)
// Compare composer, bottom aligned 125 rows
region('composer bottom-aligned',A.h-125,A.h-1,B.h-125,B.h-1)
// chat only, bottom-aligned excluding composer/titlebar/rail? rows 48..(h-126)
region('transcript bottom-aligned',48,A.h-126,48,B.h-126)
// pixel counts by global region with bottom-align mapping yB=yA-44
let nt=0,nr=0,nc=0,ni=0
for(let ya=0;ya<A.h;ya++){
 const yb=ya-44;if(yb<0||yb>=B.h)continue
 for(let x=0;x<A.w;x++)if(!eq(A.at(x,ya),B.at(x,yb))){if(yb<48)nt++;else if(x<248)nr++;else if(yb<B.h-132)nc++;else ni++}
}
console.log(`bottom-align global dy -44 zone diff: titlebar ${nt}, sidebar ${nr}, chat ${nc}, inputbar ${ni}, sum ${nt+nr+nc+ni}`)
