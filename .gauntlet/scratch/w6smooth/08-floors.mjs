// THE TWO FLOORS. Identity (one mint hue, under 10% of every surface) and the
// single type ladder.
import { decode, oklch } from './png.mjs'

const f = (n, d = 3) => n.toFixed(d)
const hsl = (r, g, b) => {
  const R = r / 255, G = g / 255, B = b / 255
  const mx = Math.max(R, G, B), mn = Math.min(R, G, B), c = mx - mn
  let h = 0
  if (c === 0) h = 0
  else if (mx === R) h = 60 * (((G - B) / c) % 6)
  else if (mx === G) h = 60 * ((B - R) / c + 2)
  else h = 60 * ((R - G) / c + 4)
  if (h < 0) h += 360
  return { h, s: c, l: (mx + mn) / 2 }
}
const isMint = (r, g, b) => {
  const h = hsl(r, g, b).h
  return Math.max(r, g, b) - Math.min(r, g, b) > 20 && h >= 140 && h <= 190
}

const ALL = ['welcome', 'welcome-min-window', 'titlebar', 'sidebar', 'chat', 'input-bar', 'agents-dock', 'appearance-dock', 'commands-dock']

console.log('=== IDENTITY FLOOR — per-surface mint share, wave 5 vs wave 6 ===')
let worst = { 5: { s: '', p: 0 }, 6: { s: '', p: 0 } }
const tot = { 5: 0, 6: 0 }
for (const s of ALL) {
  const row = {}
  for (const wv of [5, 6]) {
    const d = decode(`.gauntlet/waves/core-after-docks/${wv}/${s}.png`)
    let n = 0
    for (let y = 0; y < d.h; y++) for (let x = 0; x < d.w; x++) { const [r, g, b] = d.at(x, y); if (isMint(r, g, b)) n++ }
    const p = 100 * n / (d.w * d.h)
    row[wv] = { n, p }
    tot[wv] += n
    if (p > worst[wv].p) worst[wv] = { s, p }
  }
  console.log(`  ${s.padEnd(20)} w5=${String(row[5].n).padStart(6)} (${f(row[5].p)}%)   w6=${String(row[6].n).padStart(6)} (${f(row[6].p)}%)   delta=${row[6].n - row[5].n}`)
}
console.log(`  TOTAL(9)             w5=${tot[5]}  w6=${tot[6]}  delta=${tot[6] - tot[5]}`)
console.log(`  WORST SURFACE        w5=${f(worst[5].p)}% (${worst[5].s})   w6=${f(worst[6].p)}% (${worst[6].s})   ceiling 10%`)

// The twelfth capture as a tenth surface.
{
  const d = decode('.gauntlet/waves/core-after-docks/6/window-session-short.png')
  let n = 0
  for (let y = 0; y < d.h; y++) for (let x = 0; x < d.w; x++) { const [r, g, b] = d.at(x, y); if (isMint(r, g, b)) n++ }
  console.log(`  window-session-short  w6=${String(n).padStart(6)} (${f(100 * n / (d.w * d.h))}%)   [the new twelfth capture]`)
}

console.log('\n=== IDENTITY FLOOR — is it ONE hue? mark interiors, wave 5 vs wave 6 ===')
const SITES = [
  ['titlebar.png', 'logo-mark', 14, 35, 13, 34],
  ['welcome.png', 'welcome-mark', 513, 556, 242, 285],
  ['chat.png', 'avatar', 211, 238, 111, 138],
]
for (const [file, label, x0, x1, y0, y1] of SITES) {
  for (const wv of [5, 6]) {
    const d = decode(`.gauntlet/waves/core-after-docks/${wv}/${file}`)
    let hmin = 999, hmax = -999, okmin = 999, okmax = -999, n = 0
    for (let y = y0 + 3; y <= y1 - 3; y++) for (let x = x0 + 3; x <= x1 - 3; x++) {
      const [r, g, b] = d.at(x, y)
      if (!isMint(r, g, b)) continue
      n++
      const H = hsl(r, g, b).h; if (H < hmin) hmin = H; if (H > hmax) hmax = H
      const O = oklch(r, g, b).H; if (O < okmin) okmin = O; if (O > okmax) okmax = O
    }
    console.log(`  ${label.padEnd(13)} w${wv}: ${String(n).padStart(4)}px  HSL ${f(hmin, 2)}..${f(hmax, 2)} (spread ${f(hmax - hmin, 2)})  OKLCH ${f(okmin, 2)}..${f(okmax, 2)} (spread ${f(okmax - okmin, 2)})`)
  }
}

console.log('\n=== IDENTITY FLOOR — mint SITE COUNT on the core five ===')
const CORE = ['welcome', 'titlebar', 'sidebar', 'chat', 'input-bar']
for (const wv of [5, 6]) {
  let total = 0
  const per = []
  for (const s of CORE) {
    const d = decode(`.gauntlet/waves/core-after-docks/${wv}/${s}.png`)
    const W = d.w, H = d.h
    const m = new Uint8Array(W * H)
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const [r, g, b] = d.at(x, y); if (isMint(r, g, b)) m[y * W + x] = 1 }
    const dl = new Uint8Array(W * H)
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!m[y * W + x]) continue
      for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
        const yy = y + dy, xx = x + dx
        if (yy >= 0 && yy < H && xx >= 0 && xx < W) dl[yy * W + xx] = 1
      }
    }
    const seen = new Uint8Array(W * H)
    let sites = 0
    for (let i = 0; i < W * H; i++) {
      if (seen[i] || !dl[i]) { seen[i] = 1; continue }
      const st = [i]; seen[i] = 1
      let mint = 0
      while (st.length) {
        const c = st.pop(); const cx = c % W, cy = (c - cx) / W
        if (m[c]) mint++
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const nx = cx + dx, ny = cy + dy
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue
          const ni = ny * W + nx
          if (seen[ni]) continue
          seen[ni] = 1
          if (dl[ni]) st.push(ni)
        }
      }
      if (mint >= 8) sites++
    }
    per.push(`${s}:${sites}`)
    total += sites
  }
  console.log(`  wave ${wv}: ${total} sites   (${per.join('  ')})`)
}

console.log('\n=== ONE TYPE SCALE — every authored size against 15 * 1.15^k ===')
const SIZES = [['--fs-micro', 11, 32], ['--fs-ui', 13, 21], ['--fs-body', 15, 7],
  ['calc(body*1.15)', 17.25, 2], ['calc(body*1.15^2)', 19.8375, 1], ['20px literal', 20, 1], ['--fs-display', 46, 1]]
let maxDev = 0, offLadder = 0
for (const [name, v, uses] of SIZES) {
  let bk = null, bd = 1e9
  for (let k = -6; k <= 12; k++) { const r = 15 * Math.pow(1.15, k); const dv = Math.abs(v - r); if (dv < bd) { bd = dv; bk = k } }
  if (bd > maxDev) maxDev = bd
  if (bd > 0.35) offLadder++
  console.log(`  ${name.padEnd(20)} ${String(v).padStart(8)}px  uses=${String(uses).padStart(2)}  k=${String(bk).padStart(2)}  rung=${f(15 * Math.pow(1.15, bk), 4)}  dev=${f(bd, 4)}px  ${bd > 0.35 ? 'OFF-LADDER' : 'on ladder'}`)
}
console.log(`  MAX DEVIATION ${f(maxDev, 3)}px against a 0.35px tolerance;  off-ladder = ${offLadder}`)
