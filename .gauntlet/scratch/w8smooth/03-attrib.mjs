import { decode } from './png.mjs'
import { diffMap, comps } from './02-diff.mjs'
const W=(n,f)=>`.gauntlet/waves/core-after-docks/${n}/${f}`
const ws = diffMap(decode(W(7,'window-session.png')), decode(W(8,'window-session.png')))
const tb = diffMap(decode(W(7,'titlebar.png')), decode(W(8,'titlebar.png')))
const ch = diffMap(decode(W(7,'chat.png')), decode(W(8,'chat.png')))

// zone tally on the window
const zones = {titlebar:0, sidebar:0, chat:0, inputbar:0, other:0}
for (let y=0;y<ws.h;y++) for (let x=0;x<ws.w;x++) {
  if(!ws.m[y*ws.w+x]) continue
  if (y<48) zones.titlebar++
  else if (x<248) zones.sidebar++
  else if (y<=768) zones.chat++
  else if (y>768) zones.inputbar++
  else zones.other++
}
console.log('window-session total changed:', ws.n)
console.log('zones:', JSON.stringify(zones))
console.log('titlebar.png standalone:', tb.n, ' chat.png standalone:', ch.n)
console.log('sum standalone:', tb.n+ch.n, ' remainder vs window:', ws.n-(tb.n+ch.n))
console.log('zone-titlebar vs titlebar.png:', zones.titlebar-tb.n)
console.log('zone-chat vs chat.png:', zones.chat-ch.n)

// component-level: map every window component to a zone, compare component multiset
const cw = comps(ws), ct = comps(tb), cc = comps(ch)
const key=c=>`${c.w}x${c.h}:${c.c}`
const bag=(cs,dx=0,dy=0)=>cs.map(c=>`${c.x0+dx},${c.y0+dy},${c.w}x${c.h}:${c.c}`).sort()
const wbag=bag(cw), sbag=bag(ct,0,0).concat(bag(cc,248,48)).sort()
console.log('window comps:',cw.length,' titlebar comps:',ct.length,' chat comps:',cc.length,' sum:',ct.length+cc.length)
const only=(a,b)=>{const s=new Set(b);return a.filter(x=>!s.has(x))}
const wOnly=only(wbag,sbag), sOnly=only(sbag,wbag)
console.log('components in window not matched by surface captures:', wOnly.length, wOnly.slice(0,10))
console.log('components in surface captures not matched in window:', sOnly.length, sOnly.slice(0,10))
