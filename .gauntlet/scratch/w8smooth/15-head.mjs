import { decode } from './png.mjs'
const S=decode('.gauntlet/waves/core-after-docks/8/sidebar.png')
const T=decode('.gauntlet/waves/core-after-docks/8/titlebar.png')
const near=(c,t,k)=>Math.abs(c[0]-t[0])+Math.abs(c[1]-t[1])+Math.abs(c[2]-t[2])<=k
const GR=[11,15,17]
console.log('RAIL group heading y186..197, columns x12..x235 (# = ink):')
for(let y=186;y<=197;y++){let s='';for(let x=12;x<=235;x++)s+=near(S.at(x,y),GR,10)?'.':'#';console.log(` y${y} ${s}`)}
// column ink profile: find glyph clusters
const cols=[];for(let x=0;x<=246;x++){let n=0;for(let y=186;y<=197;y++)if(!near(S.at(x,y),GR,10))n++;cols.push(n)}
const runs=[];let c=null
for(let x=0;x<=246;x++){if(cols[x]>0){if(!c)c={x0:x};c.x1=x}else if(c){runs.push(c);c=null}}
if(c)runs.push(c)
console.log('\nglyph runs:',runs.map(r=>`${r.x0}..${r.x1}`).join(' '))
console.log(`heading content box: .session-groups pad-left 6 + head pad-left 10 = x16 ; right = 248-1(divider)-6-10 = x231 -> ${231-16+1}px`)
console.log(`heading ink x16..x228 = 213px of 216 available (${(213/216*100).toFixed(1)}%)`)
const TG=[11,15,17]
console.log('\nTITLEBAR session title y18..30, columns x680..760:')
const modal=(I,x0,x1,y0,y1)=>{const m=new Map();for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const k=I.at(x,y).join(',');m.set(k,(m.get(k)||0)+1)}return [...m.entries()].sort((a,b)=>b[1]-a[1])[0][0].split(',').map(Number)}
const G=modal(T,400,700,4,40)
for(let y=16;y<=32;y++){let s='';for(let x=680;x<=760;x++)s+=near(T.at(x,y),G,4)?'.':'#';console.log(` y${y} ${s}`)}
