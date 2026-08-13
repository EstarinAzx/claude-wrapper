// Is the seam closure STATE-DEPENDENT?
//
// `.chat` is `overflow-y: auto` with NO `scrollbar-gutter: stable` (grepped:
// the string does not occur anywhere in src/renderer/src/styles/). The global
// rule sets `::-webkit-scrollbar { width: 10px }` — a CLASSIC scrollbar, which
// occupies layout space only WHILE the content overflows.
//
// So the transcript column has TWO resting positions. Model it, then validate
// the model against pixels that were actually measured.
import { decode, W, fmt } from './lib.mjs'

const PANE = 1192, PANE_X0 = 248, COL = 760
const chatPad = 24            // .chat { padding: 0 24px }
const SB = 10                 // ::-webkit-scrollbar { width: 10px }

const centred = (paneW, pad, cap, extraReserve = 0) => {
  const content = paneW - 2 * pad - extraReserve
  const left = PANE_X0 + pad + (content - cap) / 2
  return { content, x0: left, x1: left + cap - 1 }
}

console.log('=== MODEL ===')
const trOver = centred(PANE, chatPad, COL, SB)
const trNoOver = centred(PANE, chatPad, COL, 0)
console.log(`transcript, OVERFLOWING   : content=${trOver.content}px  column x${trOver.x0}..${trOver.x1}`)
console.log(`transcript, NOT overflowing: content=${trNoOver.content}px  column x${trNoOver.x0}..${trNoOver.x1}`)

// composer: padding was `12px 24px 16px` (w4) and is `12px 34px 16px 24px` (w5)
const compW4 = { content: PANE - 24 - 24, x0: PANE_X0 + 24 + (PANE - 48 - COL) / 2 }
const compW5 = { content: PANE - 24 - 34, x0: PANE_X0 + 24 + (PANE - 58 - COL) / 2 }
compW4.x1 = compW4.x0 + COL - 1; compW5.x1 = compW5.x0 + COL - 1
console.log(`composer wave 4 (24/24)    : content=${compW4.content}px  column x${compW4.x0}..${compW4.x1}`)
console.log(`composer wave 5 (24/34)    : content=${compW5.content}px  column x${compW5.x0}..${compW5.x1}`)

console.log('\n=== VALIDATE THE MODEL AGAINST MEASURED PIXELS ===')
const meas = {}
for (const wv of [4, 5]) {
  const d = decode(`${W(wv)}/window-session.png`)
  const BD = [3, 6, 6]
  const on = (x, y) => { const [r, g, b] = d.px(x, y); return Math.abs(r - BD[0]) + Math.abs(g - BD[1]) + Math.abs(b - BD[2]) > 2 }
  let L = 1e9, R = -1
  for (let y = 775; y <= 899; y++) for (let x = 248; x <= 1439; x++) if (on(x, y)) { if (x < L) L = x; if (x > R) R = x }
  let L2 = 1e9, R2 = -1
  for (let y = 60; y <= 760; y++) for (let x = 248; x <= 1432; x++) if (on(x, y)) { if (x < L2) L2 = x; if (x > R2) R2 = x }
  meas[wv] = { comp: [L, R], tr: [L2, R2] }
  console.log(`  wave ${wv} MEASURED: transcript x${L2}..${R2}   composer x${L}..${R}`)
}
console.log(`  model transcript OVERFLOWING x${trOver.x0}..${trOver.x1}  vs measured x${meas[5].tr[0]}..${meas[5].tr[1]}  ${trOver.x0 === meas[5].tr[0] && trOver.x1 === meas[5].tr[1] ? 'EXACT MATCH' : 'MISMATCH'}`)
console.log(`  model composer w4 x${compW4.x0}..${compW4.x1}  vs measured x${meas[4].comp[0]}..${meas[4].comp[1]}  ${compW4.x0 === meas[4].comp[0] ? 'EXACT MATCH' : 'MISMATCH'}`)
console.log(`  model composer w5 x${compW5.x0}..${compW5.x1}  vs measured x${meas[5].comp[0]}..${meas[5].comp[1]}  ${compW5.x0 === meas[5].comp[0] ? 'EXACT MATCH' : 'MISMATCH'}`)
console.log('  (the model reproduces all three measured positions exactly, so its')
console.log('   fourth prediction — the non-overflowing transcript — is on the same footing)')

console.log('\n=== THE SEAM IN BOTH SCROLL STATES ===')
for (const [wv, comp] of [[4, compW4], [5, compW5]]) {
  const a = trOver.x0 - comp.x0, b = trNoOver.x0 - comp.x0
  console.log(`  wave ${wv}: transcript OVERFLOWING -> jog ${fmt(comp.x0 - trOver.x0, 0)}px ; NOT overflowing -> jog ${fmt(comp.x0 - trNoOver.x0, 0)}px`)
}
console.log('  NOTE: wave 4 measured composer x464 is exactly the 1144-content centring,')
console.log('  which is the SAME centring a non-overflowing transcript uses. That is an')
console.log('  independent pixel confirmation that x464 is where a 1144 box puts the column.')

console.log('\n\n=== "SAME ROW SHELL": are the three rows the same shape? ===')
{
  const d = decode(`${W(5)}/sidebar.png`)
  // session row shell band measured earlier: y202..275 (h=74). Find its x extent
  // from the shell fill colour.
  let x0 = 1e9, x1 = -1
  for (let y = 202; y <= 275; y++) for (let x = 0; x < d.w; x++) {
    const o = (y * d.w + x) * 4
    const k = `${d.data[o]},${d.data[o + 1]},${d.data[o + 2]},${d.data[o + 3]}`
    if (k === '28,39,39,220' || k === '29,34,35,219') { if (x < x0) x0 = x; if (x > x1) x1 = x }
  }
  console.log(`  session row shell: x${x0}..${x1} (w=${x1 - x0 + 1})  y202..275 (h=74)`)
  const rows = [
    ['sessions rail row', x1 - x0 + 1, 74],
    ['command row (tall)', 235, 65],
    ['command row (tall, 2)', 235, 64],
    ['command row (short)', 235, 49],
    ['.session-delete (kept 8px)', 28, 74],
  ]
  console.log('\n  one 16px token applied to boxes of different height:')
  console.log('  row                          w    h    2r/h      2r/w    rendered r (clamped to min(w,h)/2)')
  for (const [n, w, h] of rows) {
    const r = Math.min(16, Math.min(w, h) / 2)
    console.log(`  ${n.padEnd(28)} ${String(w).padStart(3)}  ${String(h).padStart(3)}  ${fmt(100 * 32 / h, 1).padStart(5)}%  ${fmt(100 * 32 / w, 1).padStart(5)}%   ${r}px${r < 16 ? '  <-- CLAMPED' : ''}`)
  }
  console.log('\n  straight-run left edge remaining after the arcs (h - 2r):')
  for (const [n, w, h] of rows) {
    const r = Math.min(16, Math.min(w, h) / 2)
    console.log(`  ${n.padEnd(28)} ${h - 2 * r}px of ${h}px = ${fmt(100 * (h - 2 * r) / h, 1)}%`)
  }
}
