import { decode } from './png.mjs'
const A=decode('.gauntlet/waves/core-after-docks/7/window-session-short.png')
const B=decode('.gauntlet/waves/core-after-docks/8/window-session-short.png')
const eq=(a,b)=>a[0]===b[0]&&a[1]===b[1]&&a[2]===b[2]
const cmp=(label,ax0,ax1,ay0,ay1,dx,dy)=>{let n=0,t=0;for(let y=ay0;y<=ay1;y++)for(let x=ax0;x<=ax1;x++){const xx=x+dx,yy=y+dy;if(xx<0||xx>=B.w||yy<0||yy>=B.h)continue;t++;if(!eq(A.at(x,y),B.at(xx,yy)))n++}console.log(`${label}: shift (${dx},${dy}), ${n} differing of ${t}`)}
// Surface origins: titlebar same; sidebar same; transcript in SHORT is top-padded and content at absolute y? divider y93 etc, both waves => same; content below cards changes.
cmp('titlebar',0,1439,0,47,0,0)
cmp('sidebar',0,247,48,899,0,0)
cmp('chat top divider+messages',248,1439,48,216,0,0)
// card locations absolute = chat y +48: w7 c1 217..352; w8 261..374, so c1 top +44
cmp('card1 top-aligned common',502,1065,217,330,0,44)
// c2 w7 457..593; w8 479..593 => top +22
cmp('card2 top-aligned common',502,1065,457,571,0,22)
// below card2 absolute y594 onward same until composer moved up 44 due height
cmp('below card2 until old composer',248,1439,594,928,0,0)
// composer bottom alignment -44
cmp('composer',248,1439,929,1060,0,-44)
