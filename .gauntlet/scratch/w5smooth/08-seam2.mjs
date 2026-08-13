// Seam, corrected: the transcript band's ink bbox runs to x1436 because the
// SCROLLBAR paints at the pane's right edge. Locate the scrollbar and exclude
// it, then re-measure the transcript column.
import { decode, W, fmt } from './lib.mjs'
const BD = [3, 6, 6]
const on = (img, x, y) => { const [r, g, b] = img.px(x, y); return Math.abs(r - BD[0]) + Math.abs(g - BD[1]) + Math.abs(b - BD[2]) > 2 }

for (const wv of [4, 5]) {
  const img = decode(`${W(wv)}/window-session.png`)
  console.log(`\n===== WAVE ${wv} =====`)
  // Column occupancy across the transcript band, to find the scrollbar column run
  const occ = []
  for (let x = 1380; x <= 1439; x++) { let n = 0; for (let y = 60; y <= 760; y++) if (on(img, x, y)) n++; occ.push([x, n]) }
  const sb = occ.filter(([, n]) => n > 200)
  console.log('columns x1380..1439 with >200 ink rows (scrollbar):', sb.map(([x, n]) => `${x}:${n}`).join(' '))
  const sbLeft = sb.length ? sb[0][0] : 1440
  console.log(`scrollbar starts x${sbLeft}`)

  const LIM = sbLeft - 1
  let L = 1e9, R = -1
  for (let y = 60; y <= 760; y++) for (let x = 248; x <= LIM; x++) if (on(img, x, y)) { if (x < L) L = x; if (x > R) R = x }
  console.log(`TRANSCRIPT column ink: x${L}..${R} (w=${R - L + 1})  centre ${fmt((L + R) / 2, 1)}`)

  let L2 = 1e9, R2 = -1
  for (let y = 775; y <= 899; y++) for (let x = 248; x <= 1439; x++) if (on(img, x, y)) { if (x < L2) L2 = x; if (x > R2) R2 = x }
  console.log(`COMPOSER  column ink: x${L2}..${R2} (w=${R2 - L2 + 1})  centre ${fmt((L2 + R2) / 2, 1)}`)
  console.log(`>>> SEAM  left ${L} vs ${L2} = jog ${L2 - L}   right ${R} vs ${R2} = jog ${R2 - R}   centre jog ${fmt((L2 + R2) / 2 - (L + R) / 2, 2)}`)

  // Pane-relative centring of each
  const paneL = 248, paneR = 1439, paneW = 1192
  const effR = sbLeft - 1
  console.log(`  transcript centred in pane minus scrollbar (${paneL}..${effR}, w=${effR - paneL + 1}): axis ${fmt((paneL + effR) / 2, 1)}, column axis ${fmt((L + R) / 2, 1)}, disp ${fmt((L + R) / 2 - (paneL + effR) / 2, 2)}`)
  console.log(`  composer centred in full pane  (${paneL}..${paneR}, w=${paneW}): axis ${fmt((paneL + paneR) / 2, 1)}, column axis ${fmt((L2 + R2) / 2, 1)}, disp ${fmt((L2 + R2) / 2 - (paneL + paneR) / 2, 2)}`)
}
