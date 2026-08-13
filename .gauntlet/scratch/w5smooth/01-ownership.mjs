// Ownership + attribution control, wave 4 -> wave 5.
import { decode, diff, bbox, clusters, W } from './lib.mjs'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

const FILES = ['welcome', 'welcome-min-window', 'titlebar', 'sidebar', 'chat', 'input-bar',
  'window-welcome', 'window-session', 'agents-dock', 'appearance-dock', 'commands-dock']

const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex').slice(0, 12)

console.log('=== BYTE IDENTITY + PIXEL DIFF, wave4 -> wave5 ===')
const totals = {}
for (const f of FILES) {
  const p4 = `${W(4)}/${f}.png`, p5 = `${W(5)}/${f}.png`
  const s4 = sha(p4), s5 = sha(p5)
  if (s4 === s5) { console.log(`${f.padEnd(20)} BYTE-IDENTICAL (${s4})`); totals[f] = 0; continue }
  const a = decode(p4), b = decode(p5)
  const pts = diff(a, b)
  totals[f] = pts.length
  const bb = bbox(pts)
  console.log(`${f.padEnd(20)} CHANGED  n=${pts.length}  bbox x${bb.x0}..${bb.x1} y${bb.y0}..${bb.y1} (${bb.w}x${bb.h})  size ${a.w}x${a.h}`)
}

console.log('\n=== ATTRIBUTION ARITHMETIC ===')
console.log(`window-session  = ${totals['window-session']}`)
console.log(`sidebar         = ${totals['sidebar']}`)
console.log(`input-bar       = ${totals['input-bar']}`)
console.log(`chat            = ${totals['chat']}`)
console.log(`titlebar        = ${totals['titlebar']}`)
const sum = totals['sidebar'] + totals['input-bar'] + totals['chat'] + totals['titlebar']
console.log(`sum of panes    = ${sum}`)
console.log(`REMAINDER       = ${totals['window-session'] - sum}`)

console.log(`\nwindow-welcome  = ${totals['window-welcome']}  (welcome ${totals['welcome']} + titlebar ${totals['titlebar']})`)

// --- where do window-session's changed pixels live, by pane? ---
if (totals['window-session']) {
  const a = decode(`${W(4)}/window-session.png`), b = decode(`${W(5)}/window-session.png`)
  const pts = diff(a, b)
  // panes per inspect.log: titlebar y0..47; sidebar x0..247 y48..899;
  // chat x248..1439 y48..767; input-bar x248..1439 y768..899
  const zones = { titlebar: 0, sidebar: 0, chat: 0, 'input-bar': 0, other: 0 }
  for (const [x, y] of pts) {
    if (y < 48) zones.titlebar++
    else if (x < 248) zones.sidebar++
    else if (y < 768) zones.chat++
    else zones['input-bar']++
  }
  console.log('\nwindow-session changed pixels by pane:', JSON.stringify(zones))
  const bbSide = bbox(pts.filter(([x, y]) => y >= 48 && x < 248))
  const bbBar = bbox(pts.filter(([x, y]) => y >= 768 && x >= 248))
  console.log('  sidebar-zone bbox  ', JSON.stringify(bbSide))
  console.log('  inputbar-zone bbox ', JSON.stringify(bbBar))
}
