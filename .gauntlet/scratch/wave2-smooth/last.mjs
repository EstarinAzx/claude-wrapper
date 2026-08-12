import { decode, px, hex } from './png.mjs'
const D=(w)=>`D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/${w}/`
const lin=(c)=>{c/=255;return c<=0.04045?c/12.92:Math.pow((c+0.055)/1.055,2.4)}
const Y=(p)=>0.2126*lin(p[0])+0.7152*lin(p[1])+0.0722*lin(p[2])
function centroid(img,x0,x1,y0,y1,gY){let s=0,ws=0
  for(let y=y0;y<=y1;y++){let e=0
    for(let x=x0;x<=x1;x++){const v=Y(px(img,x,y))-gY;if(v>0.004)e+=v}
    s+=e*y;ws+=e}
  return ws>0?s/ws:null}
// 1. sidebar title line pitch (two lines of one row)
{const img=decode(D(2)+'sidebar.png'),gY=Y([11,15,17])
 for(const [n,a1,b1,a2,b2] of [['row2',384,402,403,421],['row3',459,478,479,495],['row4',533,552,553,570]]){
   const c1=centroid(img,16,233,a1,b1,gY),c2=centroid(img,16,233,a2,b2,gY)
   console.log(`sidebar ${n} title line pitch = ${(c2-c1).toFixed(2)}px   (13px x 1.45 = 18.85)`)}}
// 2. chat prose line pitch
{const img=decode(D(2)+'chat.png'),gY=Y([3,6,6])
 const cs=[[112,132],[136,156],[160,180]].map(([a,b])=>centroid(img,252,900,a,b,gY))
 console.log(`chat prose line pitch = ${(cs[1]-cs[0]).toFixed(2)}, ${(cs[2]-cs[1]).toFixed(2)}px   (15px x 1.6 = 24.00)`)}
// 3. titlebar title centring
{const img=decode(D(2)+'titlebar.png'),g=[11,15,17]
 const ink=(p)=>Math.abs(p[0]-g[0])+Math.abs(p[1]-g[1])+Math.abs(p[2]-g[2])>18
 let a=1e9,b=-1
 for(let y=10;y<=40;y++)for(let x=400;x<=1040;x++) if(ink(px(img,x,y))){if(x<a)a=x;if(x>b)b=x}
 console.log(`titlebar .session-title ink x${a}..${b} w=${b-a+1}  centre=${((a+b)/2).toFixed(1)}  window centre=719.5  offset=${(((a+b)/2)-719.5).toFixed(1)}`)}
// 4. input-bar Effort/Model strip
{const img=decode(D(2)+'input-bar.png'),g=[3,6,6]
 const ink=(p)=>Math.abs(p[0]-g[0])+Math.abs(p[1]-g[1])+Math.abs(p[2]-g[2])>18
 for(const wv of [1,2]){const im=decode(D(wv)+'input-bar.png')
  const inq=(p)=>Math.abs(p[0]-3)+Math.abs(p[1]-6)+Math.abs(p[2]-6)>18
  const cols=[];for(let x=0;x<im.w;x++){let n=0;for(let y=66;y<=90;y++) if(inq(px(im,x,y)))n++;cols.push(n)}
  const runs=[];let s=-1
  for(let x=0;x<cols.length;x++){if(cols[x]>0){if(s<0)s=x}else if(s>=0){if(x-s>=3)runs.push([s,x-1]);s=-1}}
  console.log(`w${wv} strip runs y66..90: ${runs.map(([p,q])=>`${p}-${q}`).join(' ')}`)}}
