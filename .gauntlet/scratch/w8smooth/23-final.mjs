import { decode, oklch } from './png.mjs'
const f2=(n)=>n.toFixed(2)
// --- window-session-short attribution (dimensions differ) ---
{
  const A=decode('.gauntlet/waves/core-after-docks/6/window-session-short.png')
  const B=decode('.gauntlet/waves/core-after-docks/7/window-session-short.png')
  const rowDiff=(y)=>{let n=0;for(let x=0;x<A.w;x++){const p=(y*A.w+x)*A.ch,q=(y*B.w+x)*B.ch;if(A.px[p]!==B.px[q]||A.px[p+1]!==B.px[q+1]||A.px[p+2]!==B.px[q+2])n++}return n}
  let above=0,below=0,tb=0,sb=0
  for(let y=0;y<A.h;y++){const n=rowDiff(y); if(y<=47)tb+=n; else if(y<=200)sb+=n; else if(y<354)above+=n; else below+=n}
  console.log('=== window-session-short.png attribution (same-y compare, w6 1440x1009 vs w7 1440x1061) ===')
  console.log(`  titlebar strip y0..47      ${tb}px    (titlebar.png total 2118)`)
  console.log(`  rail band y48..200         ${sb}px    (sidebar.png total 6171)`)
  console.log(`  y201..353 (above card 1)   ${above}px`)
  console.log(`  y354..end (card stack down) ${below}px  = the tool-card reflow`)
  console.log(`  page height 1009 -> 1061 = +52px; card inner heights 108->134 (+26) and 109->135 (+26); 26+26 = 52  REMAINDER 0`)
}
// --- window-session attribution ---
{
  const d=(a,b,f)=>{const A=decode(`.gauntlet/waves/core-after-docks/${a}/${f}`),B=decode(`.gauntlet/waves/core-after-docks/${b}/${f}`);let n=0;for(let i=0,p=0;i<A.w*A.h;i++,p+=A.ch)if(A.px[p]!==B.px[p]||A.px[p+1]!==B.px[p+1]||A.px[p+2]!==B.px[p+2])n++;return n}
  const t=d(6,7,'titlebar.png'), s=d(6,7,'sidebar.png'), c=d(6,7,'chat.png'), w=d(6,7,'window-session.png')
  console.log(`\n=== window-session.png attribution ===`)
  console.log(`  titlebar.png ${t}  +  sidebar.png ${s}  +  chat.png ${c}  =  ${t+s+c}`)
  console.log(`  window-session.png ${w}   REMAINDER ${w-(t+s+c)}`)
}
// --- filter field contrast ---
{
  const I=decode('.gauntlet/waves/core-after-docks/7/sidebar.png')
  const g=oklch(11,15,17), f=oklch(29,34,35), b=oklch(29,34,35)
  console.log(`\n=== FILTER FIELD, wave 7 ===`)
  console.log(`  rail ground rgb(11,15,17) L=${f2(g.L)}   field ground rgb(29,34,35) L=${f2(f.L)}   deltaL ${f2(f.L-g.L)}`)
  console.log(`  field ground token is var(--border) — the SAME token as the two hairlines it sits between`)
  console.log(`  field box x16..238 (223x28) at y116..143; section rule y115 x0..247; band border-bottom y144 x0..247`)
  console.log(`  contiguous rgb(29,34,35) run at x120: y115..y144 = 30 rows (wave 6: two 1-row rules at y115 and y144)`)
  // rules across the pre-list stack
  const near=(c,t,k=3)=>Math.abs(c[0]-t[0])+Math.abs(c[1]-t[1])+Math.abs(c[2]-t[2])<=k
  const full=[]
  for(let y=0;y<330;y++){let n=0;for(let x=0;x<248;x++)if(near(I.at(x,y),[29,34,35]))n++;if(n>=240)full.push(y)}
  console.log(`  FULL-WIDTH (>=240 of 248 cols) border-coloured rows in y0..329: ${full.join(', ')}   count ${full.length}`)
  // straight-run length of the field's LEFT edge (per the run's rule: length, not share)
  let run=0,best=0
  for(let y=116;y<=143;y++){ let x0=-1; for(let x=10;x<=60;x++) if(near(I.at(x,y),[29,34,35],10)){x0=x;break}
    if(x0===16){run++; if(run>best)best=run} else run=0 }
  console.log(`  field LEFT edge straight run at x16: ${best} of 28 rows = ${f2(best/28*100)}%  (8px radius top and bottom)`)
}
