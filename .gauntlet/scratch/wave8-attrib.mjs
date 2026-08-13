// Wave 8 leg measurement — changed-pixel attribution, wave 7 -> wave 8.
// Two builds on two surfaces, so titlebar-zone + chat-zone changed pixels must
// equal window-session.png's total with ZERO remainder. Sixth consecutive wave
// this control has been run.
import { decode, at } from './w8lib.mjs'

const A = '.gauntlet/waves/core-after-docks/7'
const B = '.gauntlet/waves/core-after-docks/8'

const diffMap = (fa, fb) => {
  const a = decode(fa), b = decode(fb)
  if (a.w !== b.w || a.h !== b.h) throw new Error(`dims ${a.w}x${a.h} vs ${b.w}x${b.h}`)
  const changed = new Uint8Array(a.w * a.h)
  let n = 0, x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1
  for (let y = 0; y < a.h; y++)
    for (let x = 0; x < a.w; x++) {
      const p = at(a, x, y), q = at(b, x, y)
      // Canonical run definition: visible RGB differences only. Alpha-only
      // movement is excluded so this wave stays comparable with waves 1–7.
      if (p[0] !== q[0] || p[1] !== q[1] || p[2] !== q[2]) {
        changed[y * a.w + x] = 1; n++
        if (x < x0) x0 = x; if (x > x1) x1 = x
        if (y < y0) y0 = y; if (y > y1) y1 = y
      }
    }
  return { w: a.w, h: a.h, changed, n, box: n ? { x0, x1, y0, y1 } : null }
}

const components = (m, minSize = 1) => {
  const seen = new Uint8Array(m.w * m.h)
  const out = []
  const stack = []
  for (let i = 0; i < m.changed.length; i++) {
    if (!m.changed[i] || seen[i]) continue
    let n = 0, x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1
    stack.push(i); seen[i] = 1
    while (stack.length) {
      const j = stack.pop()
      const x = j % m.w, y = (j - x) / m.w
      n++
      if (x < x0) x0 = x; if (x > x1) x1 = x
      if (y < y0) y0 = y; if (y > y1) y1 = y
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy
        if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h) continue
        const k = ny * m.w + nx
        if (m.changed[k] && !seen[k]) { seen[k] = 1; stack.push(k) }
      }
    }
    if (n >= minSize) out.push({ n, x0, x1, y0, y1 })
  }
  return out.sort((p, q) => q.n - p.n)
}

const report = (label, file) => {
  const m = diffMap(`${A}/${file}`, `${B}/${file}`)
  console.log(`\n${label}  ${file}  ${m.w}x${m.h}`)
  console.log(`  changed pixels: ${m.n}`)
  if (m.box) console.log(`  bbox x${m.box.x0}..${m.box.x1}  y${m.box.y0}..${m.box.y1}`)
  return m
}

const tb = report('TITLEBAR surface', 'titlebar.png')
const ch = report('CHAT surface', 'chat.png')
const ws = report('WINDOW-SESSION frame', 'window-session.png')
const ww = report('WINDOW-WELCOME frame', 'window-welcome.png')

console.log('\n==== ATTRIBUTION ====')
console.log(`  titlebar ${tb.n} + chat ${ch.n} = ${tb.n + ch.n}`)
console.log(`  window-session total       = ${ws.n}`)
console.log(`  REMAINDER                  = ${ws.n - (tb.n + ch.n)}`)

console.log('\n==== WINDOW-WELCOME CONFINEMENT (must be y0..47 only) ====')
if (ww.box) console.log(`  changed rows y${ww.box.y0}..${ww.box.y1}  -> ${ww.box.y1 <= 47 ? 'CONFINED to the titlebar' : 'ESCAPES the titlebar'}`)
console.log(`  welcome-only change: ${ww.n} vs titlebar surface ${tb.n} -> ${ww.n === tb.n ? 'IDENTICAL' : 'DIFFERS by ' + (ww.n - tb.n)}`)

console.log('\n==== CHAT COMPONENTS (top 12) ====')
for (const c of components(ch).slice(0, 12))
  console.log(`  n=${String(c.n).padStart(7)}  x${c.x0}..${c.x1}  y${c.y0}..${c.y1}  (${c.x1 - c.x0 + 1}x${c.y1 - c.y0 + 1})`)

console.log('\n==== TITLEBAR COMPONENTS (top 8) ====')
for (const c of components(tb).slice(0, 8))
  console.log(`  n=${String(c.n).padStart(7)}  x${c.x0}..${c.x1}  y${c.y0}..${c.y1}  (${c.x1 - c.x0 + 1}x${c.y1 - c.y0 + 1})`)
