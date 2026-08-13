// Wave 6 leg instrument. Checks the two builders' numeric predictions against the
// pixels, and nothing else — the smoothing pass does the whole-artifact work.
//
// (1) TITLEBAR: the left group's painted right edge. Predicted x276 -> x267.
//     Measured as the rightmost column carrying ink, scanned left of the session
//     title so the centred title cannot be mistaken for the group.
//
// (2) SIDEBAR: the straight-run length of a row's vertical edge. Predicted to gain
//     2(16-8) = 16px per edge, height-independent: the 74px rail row 42 -> 58.
//     ⚠️ RUN LENGTH, NOT PIXEL SHARE. A count-based check has now reported the
//     opposite of the truth twice on this exact class of change, and the builder
//     predicted the count would FALL this time while ink weight ROSE.
//
// (3) THE TWELFTH CAPTURE: the falsifiable jog. 5.3's model predicts the
//     transcript at x464..1223 against the composer at x459..1218 when the
//     transcript does not overflow — a -5px jog that no capture had ever held.
import { readFileSync } from 'node:fs'
import { inflateSync } from 'node:zlib'

const decode = (path) => {
  const buf = readFileSync(path)
  let off = 8, w = 0, h = 0, ct = 0, bd = 0
  const idat = []
  while (off < buf.length) {
    const len = buf.readUInt32BE(off)
    const t = buf.toString('ascii', off + 4, off + 8)
    const d = buf.subarray(off + 8, off + 8 + len)
    if (t === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); bd = d[8]; ct = d[9] }
    else if (t === 'IDAT') idat.push(d)
    else if (t === 'IEND') break
    off += 12 + len
  }
  if (bd !== 8) throw new Error(`bitDepth ${bd}`)
  const ch = ct === 6 ? 4 : 3
  const raw = inflateSync(Buffer.concat(idat))
  const stride = w * ch
  const px = Buffer.alloc(h * stride)
  let pos = 0
  for (let y = 0; y < h; y++) {
    const f = raw[pos++]
    const line = raw.subarray(pos, pos + stride); pos += stride
    const cur = px.subarray(y * stride, (y + 1) * stride)
    const prev = y > 0 ? px.subarray((y - 1) * stride, y * stride) : null
    for (let i = 0; i < stride; i++) {
      const a = i >= ch ? cur[i - ch] : 0
      const b = prev ? prev[i] : 0
      const c = prev && i >= ch ? prev[i - ch] : 0
      let v = line[i]
      if (f === 1) v += a
      else if (f === 2) v += b
      else if (f === 3) v += (a + b) >> 1
      else if (f === 4) {
        const p = a + b - c
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c
      }
      cur[i] = v & 0xff
    }
  }
  return { w, h, ch, px }
}

const at = (I, x, y) => { const p = (y * I.w + x) * I.ch; return [I.px[p], I.px[p + 1], I.px[p + 2]] }

// The modal colour of a band, which is the ground it paints on.
const modal = (I, x0, x1, y0, y1) => {
  const seen = new Map()
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const k = at(I, x, y).join(',')
    seen.set(k, (seen.get(k) || 0) + 1)
  }
  return [...seen.entries()].sort((a, b) => b[1] - a[1])[0]
}

const dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2])

console.log('=== (1) TITLEBAR LEFT GROUP RIGHT EDGE ===')
for (const [tag, dir] of [['wave5', '5'], ['wave6', '6']]) {
  const I = decode(`.gauntlet/waves/core-after-docks/${dir}/titlebar.png`)
  const [gk] = modal(I, 400, 600, 4, 43)          // ground sampled away from all ink
  const ground = gk.split(',').map(Number)
  let right = -1, left = 1e9
  for (let x = 0; x < 420; x++) {                  // left of the centred title
    for (let y = 4; y < 44; y++) {
      if (dist(at(I, x, y), ground) > 12) { if (x > right) right = x; if (x < left) left = x; break }
    }
  }
  console.log(`${tag}  ${I.w}x${I.h}  ground rgb(${ground})  left group ink x${left}..x${right}  extent ${right - left + 1}px`)
}
console.log('  rail divider column = x247 (rail is 248px wide, x0..x247)')

console.log('\n=== (2) ROW CORNER: STRAIGHT-RUN LENGTH ON THE ACTIVE RAIL ROW ===')
for (const [tag, dir] of [['wave5', '5'], ['wave6', '6']]) {
  const I = decode(`.gauntlet/waves/core-after-docks/${dir}/sidebar.png`)
  const [gk] = modal(I, 60, 190, 480, 700)         // rail ground, away from the active row
  const ground = gk.split(',').map(Number)
  // The active row is the only one painting a ground. Find its vertical span at a
  // column inside the box but right of the 2px mint stripe.
  const probe = 30
  let rows = []
  let run = null
  for (let y = 150; y < 400; y++) {
    const on = dist(at(I, probe, y), ground) > 6
    if (on && !run) run = { y0: y }
    if (!on && run) { run.y1 = y - 1; if (run.y1 - run.y0 > 30) rows.push(run); run = null }
  }
  for (const r of rows) {
    const h = r.y1 - r.y0 + 1
    // Straight run of the LEFT edge: rows where the box's leftmost painted column
    // equals the box's minimum leftmost column (i.e. not tapered by the arc).
    let mins = []
    for (let y = r.y0; y <= r.y1; y++) {
      let lx = -1
      for (let x = 0; x < 120; x++) if (dist(at(I, x, y), ground) > 6) { lx = x; break }
      mins.push(lx)
    }
    const m = Math.min(...mins.filter((v) => v >= 0))
    const straight = mins.filter((v) => v === m).length
    console.log(`${tag}  active row y${r.y0}..${r.y1} (h=${h})  left edge x${m}  straight run ${straight}px = ${(100 * straight / h).toFixed(1)}% of edge`)
  }
}

console.log('\n=== (2b) MINT SELECTION STRIPE STRAIGHT RUN ===')
for (const [tag, dir] of [['wave5', '5'], ['wave6', '6']]) {
  const I = decode(`.gauntlet/waves/core-after-docks/${dir}/sidebar.png`)
  // Mint is the one accent: high G relative to R, per the run's own segmentation.
  let ys = []
  for (let y = 150; y < 400; y++) {
    let mint = 0
    for (let x = 0; x < 12; x++) { const [r, g, b] = at(I, x, y); if (g > r + 25 && g > 90 && b > r) mint++ }
    if (mint > 0) ys.push({ y, mint })
  }
  if (!ys.length) { console.log(`${tag}  no mint stripe found`); continue }
  const full = Math.max(...ys.map((v) => v.mint))
  const straight = ys.filter((v) => v.mint === full).length
  console.log(`${tag}  stripe spans y${ys[0].y}..${ys[ys.length - 1].y} (${ys.length}px), full-width run ${straight}px at ${full}px wide`)
}

console.log('\n=== (3) THE TWELFTH CAPTURE: THE FALSIFIABLE JOG ===')
{
  const S = decode('.gauntlet/waves/core-after-docks/6/window-session-short.png')
  const W = decode('.gauntlet/waves/core-after-docks/6/window-session.png')
  console.log(`window-session-short.png  ${S.w}x${S.h}`)
  console.log(`window-session.png        ${W.w}x${W.h}`)
  // The composer pill is the widest rounded box in the bottom band; the transcript
  // column is the ink band above it. Report ink extents per row band so the
  // smoothing pass has the leg's own reading to check against.
  const scan = (I, y0, y1, label) => {
    const [gk] = modal(I, 300, 1400, y0, y1)
    const ground = gk.split(',').map(Number)
    let left = 1e9, right = -1
    for (let x = 249; x < I.w; x++) {
      for (let y = y0; y <= y1; y++) {
        if (dist(at(I, x, y), ground) > 10) { if (x < left) left = x; if (x > right) right = x; break }
      }
    }
    console.log(`  ${label.padEnd(34)} ink x${left}..x${right}   width ${right - left + 1}   ground rgb(${ground})`)
  }
  scan(S, S.h - 132, S.h - 20, 'short: composer band')
  scan(S, 60, S.h - 150, 'short: transcript band')
  scan(W, W.h - 132, W.h - 20, 'standard: composer band')
  scan(W, 60, W.h - 150, 'standard: transcript band')
  console.log('  5.3 model predicts, in the NON-overflowing state: transcript x464..1223, composer x459..1218 (jog -5px)')
}
