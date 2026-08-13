import { decode } from './png.mjs'
const I=decode('.gauntlet/waves/core-after-docks/8/window-session-short.png')
const BD=[3,6,6]
const d=(x,y)=>{const [r,g,b]=I.at(x,y);return Math.abs(r-BD[0])+Math.abs(g-BD[1])+Math.abs(b-BD[2])}
const on=(x,y,thr=2)=>d(x,y)>thr
// date divider label as known
let L=1e9,R=-1,T=1e9,B=-1,n=0
for(let y=90;y<=104;y++){if(y===96)continue;for(let x=464;x<=1223;x++)if(on(x,y,6)){n++;if(x<L)L=x;if(x>R)R=x;if(y<T)T=y;if(y>B)B=y}}
console.log(`label paint bbox x${L}..${R} w=${R-L+1} y${T}..${B} h=${B-T+1}`)
// CSS nominal width from canvas? 11px Segoe? tracking 0.12em = 1.32px between 5 letters for TODAY (5 tracking slots? CSS adds after last too). infer label element width from rule gap and gap=12px each.
// rule ends x811 and x876 starts; gap between rule pixels x812..875=64. CSS flex gap 12 each, label CSS box therefore 64-24=40px. Paint bbox is 40px but midpoint is -1 due anti-alias distribution.
console.log('rule inter-segment gap 64px; subtract 12px flex gap each side => label border-box 40px')
console.log(`label box centre x844.00, paint midpoint ${(L+R+1)/2}.00 => tracking/ink midpoint debt ${((L+R+1)/2-844).toFixed(2)}px`)
// clear bands strict row-ink
const rowInk=y=>{let k=0;for(let x=248;x<=1439;x++)if(on(x,y))k++;return k}
let last=-1;for(let y=48;y<93;y++)if(rowInk(y)>0)last=y
let next=-1;for(let y=101;y<200;y++)if(rowInk(y)>0){next=y;break}
console.log(`last ink above divider y${last}; divider starts y93 => clear rows y${last+1}..92 = ${92-last}px`)
console.log(`divider ends y100; next ink y${next} => clear rows y101..${next-1} = ${next-101}px`)
