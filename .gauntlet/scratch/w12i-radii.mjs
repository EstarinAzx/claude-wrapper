import { decode, at } from './w8lib.mjs'
import { oklch } from './w8smooth/png.mjs'
const D=(n,f)=>decode(`.gauntlet/waves/core-after-docks/${n}/${f}.png`)
const S=D('12','sidebar'), C=D('12','chat'), B=D('12','input-bar')
const dd=(p,g)=>Math.abs(p[0]-g[0])+Math.abs(p[1]-g[1])+Math.abs(p[2]-g[2])

console.log('=== RAIL FILTER FIELD: find its box then its corner arc ===')
// rail ground rgb(11,15,17); field fill rgb(29,34,35)
const rg=[11,15,17]
let top=-1,bot=-1,lf=1e9,rt=-1
for(let y=100;y<170;y++)for(let x=0;x<248;x++){const p=at(S,x,y);if(dd(p,[29,34,35])<=6){if(top<0)top=y;bot=y;if(x<lf)lf=x;if(x>rt)rt=x}}
console.log(`  field fill box: x${lf}-${rt} (w${rt-lf+1}) y${top}-${bot} (h${bot-top+1})`)
const arcF=[];for(let d=0;d<10;d++){let f=-1;for(let x=lf;x<=rt;x++){if(dd(at(S,x,top+d),[29,34,35])<=10){f=x;break}}arcF.push(f<0?'-':f-lf)}
console.log(`  arc inset by row: [${arcF.join(',')}]  -> radius ~${arcF[0]}`)

console.log('\n=== TOOL ROW (chat.png y276-292): box + corner arc ===')
const fill=[8,12,14]
let t2=-1,b2=-1,l2=1e9,r2=-1
for(let y=270;y<=300;y++)for(let x=250;x<=830;x++){if(dd(at(C,x,y),fill)<=4){if(t2<0)t2=y;b2=y;if(x<l2)l2=x;if(x>r2)r2=x}}
console.log(`  row fill box: x${l2}-${r2} (w${r2-l2+1}) y${t2}-${b2} (h${b2-t2+1})`)
const arcR=[];for(let d=0;d<10;d++){let f=-1;for(let x=l2;x<=r2;x++){const p=at(C,x,t2+d);if(dd(p,fill)<=6||dd(p,[25,29,31])<=6){f=x;break}}arcR.push(f<0?'-':f-l2)}
console.log(`  arc inset by row: [${arcR.join(',')}]  -> radius ~${arcR[0]}`)

console.log('\n=== TRACK end shape (x243 & x372, y75-76) ===')
for(const y of [75,76]) console.log(`  y${y}: x242=${at(B,242,y).slice(0,3)} x243=${at(B,243,y).slice(0,3)} | x372=${at(B,372,y).slice(0,3)} x373=${at(B,373,y).slice(0,3)}`)

console.log('\n=== STRIP anchoring ===')
console.log(`  measure x211-970 (760px). left group x211-446 -> left slack ${211-211}px. right group x876-970 -> right slack ${970-970}px.`)
console.log(`  between-group gap = ${876-446-1}px ; largest within-group gap = ${379-372-1}px ; ratio ${((876-446-1)/(379-372-1)).toFixed(1)}x`)
console.log(`  w11: gap ${876-384-1}px ; ratio ${((876-384-1)/(317-310-1)).toFixed(1)}x`)
