import { decode, at } from './w8lib.mjs'
const D=(n,f)=>decode(`.gauntlet/waves/core-after-docks/${n}/${f}.png`)
const W=D('12','window-session')
console.log('=== strip measure in WINDOW coords vs the message column ===')
console.log(`  strip left  211 + 248 = ${211+248}`)
console.log(`  strip right 970 + 248 = ${970+248}`)
console.log(`  measure width = ${970-211+1}px`)
// find the transcript column edges on window-session (an assistant bubble / prose run)
const g=[3,6,6]
const dd=(p,q)=>Math.abs(p[0]-q[0])+Math.abs(p[1]-q[1])+Math.abs(p[2]-q[2])
let lo=1e9,hi=-1
for(let y=200;y<=700;y++){for(let x=300;x<=1400;x++){if(dd(at(W,x,y),at(W,1350,y))>25){if(x<lo)lo=x;if(x>hi)hi=x}}}
console.log(`  transcript ink extent on window-session y200-700: x${lo}-${hi}`)
console.log('\n=== effort group / model group in WINDOW coords ===')
console.log(`  effort label left  211+248=${459}   track 243+248=${491}..${372+248}   readout ${379+248}..${446+248}`)
console.log(`  model label ${876+248}..${906+248}  pill ${913+248}..${970+248}`)
