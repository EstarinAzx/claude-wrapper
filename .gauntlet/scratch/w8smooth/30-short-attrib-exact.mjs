import { decode } from './png.mjs'
const A=decode('.gauntlet/waves/core-after-docks/7/window-session-short.png')
const B=decode('.gauntlet/waves/core-after-docks/8/window-session-short.png')
const eq=(a,b)=>a[0]===b[0]&&a[1]===b[1]&&a[2]===b[2]
const cmp=(label,ax0,ax1,ay0,ay1,dx=0,dy=0)=>{let n=0,t=0;for(let y=ay0;y<=ay1;y++)for(let x=ax0;x<=ax1;x++){const xx=x+dx,yy=y+dy;if(xx<0||xx>=B.w||yy<0||yy>=B.h)continue;t++;if(!eq(A.at(x,y),B.at(xx,yy)))n++}console.log(`${label}: shift (${dx},${dy}), ${n} / ${t}`)}
cmp('titlebar',0,1439,0,47)
cmp('sidebar full',0,247,48,899)
cmp('pre-card chat',248,1439,48,353)
cmp('card1 common top',502,1065,354,467,0,0)
cmp('between c1/c2 shifted',248,1439,490,593,0,-22)
cmp('card2 common top',502,1065,594,708,0,-22)
cmp('after c2 shifted -44',248,1439,731,928,0,-44)
cmp('composer shifted -44',248,1439,929,1060,0,-44)
// verify exact control strips in current coordinates
