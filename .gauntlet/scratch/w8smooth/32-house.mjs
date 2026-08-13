// Which of the two affordance treatments matches the app's existing vocabulary
// for "operable at rest"? Sample the fill of each interactive housing.
import { decode } from './png.mjs'
const P=(f)=>decode(`.gauntlet/waves/core-after-docks/8/${f}`)
const show=(lbl,I,x,y)=>console.log(`  ${lbl.padEnd(38)} rgb(${I.at(x,y)})  @x${x},y${y}`)
const S=P('sidebar.png'), C=P('chat.png'), T=P('titlebar.png'), B=P('input-bar.png'), A=P('agents-dock.png'), K=P('commands-dock.png')
console.log('RAIL (sidebar.png)')
show('rail ground', S, 120, 320)
show('filter field interior (NEW this wave)', S, 120, 130)
show('active session row interior', S, 120, 240)
console.log('  non-active rows: scan y280..y700 for any row band with a non-ground fill')
{
  const GR=[11,15,17]; const isG=(c,k=6)=>Math.abs(c[0]-GR[0])+Math.abs(c[1]-GR[1])+Math.abs(c[2]-GR[2])<=k
  const bands=[];let cur=null
  for(let y=280;y<=760;y++){ let n=0; for(let x=10;x<=230;x++) if(!isG(S.at(x,y))) n++
    if(n>=180){ if(!cur)cur={y0:y}; cur.y1=y } else if(cur){bands.push(cur);cur=null} }
  if(cur)bands.push(cur)
  console.log(`    rows y280..760 with >=180/221 non-ground columns: ${bands.length?bands.map(b=>`y${b.y0}..${b.y1}`).join(' '):'NONE'}`)
}
console.log('COMPOSER (input-bar.png)')
{
  const GR=[3,6,6]; const isG=(c,k=6)=>Math.abs(c[0]-GR[0])+Math.abs(c[1]-GR[1])+Math.abs(c[2]-GR[2])<=k
  // find the pill's border rows
  const rows=[]
  for(let y=0;y<B.h;y++){let best=0,cur=0;for(let x=0;x<B.w;x++){if(!isG(B.at(x,y)))cur++;else cur=0;if(cur>best)best=cur}if(best>=400)rows.push(y)}
  console.log(`  pill border rows: ${rows.slice(0,3).join(',')} ... ${rows.slice(-3).join(',')}`)
  show('composer ground', B, 100, 20)
  if(rows.length) show('composer pill interior', B, 700, Math.round((rows[0]+rows[rows.length-1])/2))
  if(rows.length) show('composer pill border', B, 700, rows[0])
}
console.log('TITLEBAR pills')
show('pill interior', T, 180, 23)
show('pill border (left cap area)', T, 155, 23)
console.log('DOCK rows')
show('agents-dock ground', A, 120, 400)
show('commands-dock ground', K, 120, 400)
console.log('TOOL CARD')
show('tool card interior (surface)', C, 400, 220)
show('tool card border', C, 400, 213)
show('disclosure row band interior (NEW 28px row)', C, 400, 284)
