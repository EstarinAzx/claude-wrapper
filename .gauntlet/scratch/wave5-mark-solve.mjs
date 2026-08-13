// Wave 5. The Titlebar builder slot could not be filled — eighteen agents stalled
// across three brief shapes — but one interrupted attempt left an unjustified
// value in the tree before dying. This script does two things the leg owes:
//
//   1. MEASURE how far that value is from the target, instead of asserting it.
//   2. SOLVE the arithmetic the builder was being asked to do, so wave 6 starts
//      from a derived value rather than paying the discovery cost again.
//
// The mechanism is settled and is not in question: replace the pure black ramp
// with a ramp toward a darker, more chromatic stop AT THE SAME HUE, because at
// hue ~180 the red channel sits furthest from the other two, so raising chroma
// while dropping lightness pulls R down fastest and B least — which is the
// reference's measured signature (R varies ~2x what a black multiply predicts,
// B about half).
//
// The target is the identity reference's own measured interior stddev:
//     R 9.40   G 7.06   B 4.02
// A linear ramp's interior stddev is range / sqrt(12), so those are per-channel
// sRGB ranges of R 32.6 / G 24.5 / B 13.9 across the mark's height.
//
// A gradient from `stop @ alpha 0` to `stop @ alpha A` over a mint fill paints
//     bottom_c = A * stop_c + (1 - A) * mint_c
//     range_c  = A * (mint_c - stop_c)
// so the three channel ranges are fully determined by the stop colour and A.

const MINT_OKLCH = [0.87, 0.07, 180]
const TARGET_SD = { R: 9.40, G: 7.06, B: 4.02 }
const SQRT12 = Math.sqrt(12)
const targetRange = { R: TARGET_SD.R * SQRT12, G: TARGET_SD.G * SQRT12, B: TARGET_SD.B * SQRT12 }

// ── OKLCH -> sRGB (Björn Ottosson's matrices) ────────────────────────────────
const oklchToSrgb = ([L, C, h]) => {
  const hr = (h * Math.PI) / 180
  const a = C * Math.cos(hr)
  const b = C * Math.sin(hr)
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3
  const lin = [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ]
  const enc = (v) => {
    const c = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(Math.max(v, 0), 1 / 2.4) - 0.055
    return c * 255
  }
  return lin.map(enc)
}

const clampInfo = (rgb) => rgb.some((v) => v < -0.5 || v > 255.5) ? '  <-- OUT OF sRGB GAMUT, clipped below' : ''
// A browser does not paint a negative channel. Every number that claims to
// describe what SHIPS must be clipped, or the arithmetic describes a colour no
// display can show — the first run of this script reported an R range of 182.8
// off a linearly-extrapolated -205.6, which is not a thing Chromium can paint.
const clip = (rgb) => rgb.map((v) => Math.min(255, Math.max(0, v)))

const mint = oklchToSrgb(MINT_OKLCH)
console.log('=== GROUND TRUTH ===')
console.log(`  mint oklch(${MINT_OKLCH.join(' ')}) -> sRGB ${mint.map((v) => v.toFixed(1)).join(', ')}`)
console.log('  measured mint top row in the real capture: 160.0, 226.0, 212.0')
console.log(`  target per-channel RANGE (reference stddev x sqrt12): R ${targetRange.R.toFixed(1)}  G ${targetRange.G.toFixed(1)}  B ${targetRange.B.toFixed(1)}`)

// Use the MEASURED mint, not the converted one — the capture is the authority
// and any conversion error would propagate straight into the solved alpha.
const MINT = [160, 226, 212]

const evaluate = (label, [L, C, h], A) => {
  const raw = oklchToSrgb([L, C, h])
  const stop = clip(raw)
  const range = MINT.map((m, i) => A * (m - stop[i]))
  const sd = range.map((r) => r / SQRT12)
  const bottom = MINT.map((m, i) => m - range[i])
  console.log(`\n  ${label}`)
  console.log(`    stop oklch(${L} ${C} ${h}) -> sRGB ${stop.map((v) => v.toFixed(1)).join(', ')}${clampInfo(stop)}`)
  console.log(`    alpha ${A}`)
  console.log(`    bottom row  ${bottom.map((v) => v.toFixed(1)).join(', ')}`)
  console.log(`    range       R ${range[0].toFixed(1)}  G ${range[1].toFixed(1)}  B ${range[2].toFixed(1)}`)
  console.log(`    stddev      R ${sd[0].toFixed(2)}  G ${sd[1].toFixed(2)}  B ${sd[2].toFixed(2)}`)
  console.log(`    vs target   R ${(sd[0] / TARGET_SD.R).toFixed(2)}x  G ${(sd[1] / TARGET_SD.G).toFixed(2)}x  B ${(sd[2] / TARGET_SD.B).toFixed(2)}x`)
  return { sd, range, bottom, stop }
}

console.log('\n=== 1. WHAT SHIPPED IN THE TREE, UNJUSTIFIED, FROM AN INTERRUPTED ATTEMPT ===')
evaluate('LANDED: oklch(0.52 0.14 180 / 0.5)', [0.52, 0.14, 180], 0.5)

console.log('\n=== 2. THE OTHER TWO VALUES ATTEMPTS TRIED BEFORE STALLING ===')
evaluate('oklch(0.42 0.13 180 / 0.16)', [0.42, 0.13, 180], 0.16)
evaluate('oklch(0.52 0.13 180 / 0.16)', [0.52, 0.13, 180], 0.16)

console.log('\n=== 3. THE CURRENT SHIPPED BLACK RAMP, FOR SCALE ===')
{
  const A = 0.1
  const range = MINT.map((m) => A * m)
  const sd = range.map((r) => r / SQRT12)
  console.log(`    black @ alpha 0.1 -> range R ${range[0].toFixed(1)} G ${range[1].toFixed(1)} B ${range[2].toFixed(1)}`)
  console.log(`    stddev R ${sd[0].toFixed(2)} G ${sd[1].toFixed(2)} B ${sd[2].toFixed(2)}   (leg measured 3.49 / 4.81 / 4.66 on the capture)`)
  console.log('    NOTE the proportionality: R:G:B ranges track the mint itself, which is exactly the defect.')
}

console.log('\n=== 4. SOLVE: which (L, C, A) at hue 180 lands closest to the reference SHAPE? ===')
console.log('    Grid search over plausible territory, scored on RELATIVE shape error across the')
console.log('    three channels (matching the ratios matters more than the magnitude, because the')
console.log('    magnitude is one scalar — alpha — and the shape is what a black ramp cannot do).')
let best = null
for (let L = 0.10; L <= 0.70; L += 0.01) {
  for (let C = 0.02; C <= 0.30; C += 0.005) {
    const stop = oklchToSrgb([L, C, 180])
    if (stop.some((v) => v < -0.5 || v > 255.5)) continue      // outside sRGB: a browser would clip it,
                                                              // so the authored value would stop meaning
                                                              // what it says. Only in-gamut stops qualify.
    const d = MINT.map((m, i) => m - stop[i])
    if (d.some((v) => v <= 0)) continue                        // must darken every channel
    // best alpha for this stop, least squares against the target ranges
    const num = d[0] * targetRange.R + d[1] * targetRange.G + d[2] * targetRange.B
    const den = d[0] * d[0] + d[1] * d[1] + d[2] * d[2]
    const A = num / den
    if (A <= 0.01 || A > 0.6) continue
    const range = d.map((v) => A * v)
    const err = Math.sqrt(
      ((range[0] - targetRange.R) / targetRange.R) ** 2 +
      ((range[1] - targetRange.G) / targetRange.G) ** 2 +
      ((range[2] - targetRange.B) / targetRange.B) ** 2
    )
    if (!best || err < best.err) best = { L: +L.toFixed(2), C: +C.toFixed(3), A: +A.toFixed(3), err, range, stop }
  }
}
if (best) {
  console.log(`\n  BEST FIT: oklch(${best.L} ${best.C} 180 / ${best.A})   relative shape error ${(best.err * 100).toFixed(1)}%`)
  evaluate(`  -> oklch(${best.L} ${best.C} 180 / ${best.A})`, [best.L, best.C, 180], best.A)
} else {
  console.log('  no in-gamut stop at hue 180 can produce the reference shape')
}

console.log('\n=== 5. CAN A BLACK RAMP EVER DO IT? (the claim the gap rests on) ===')
{
  // Best alpha for pure black, least squares against the same targets.
  const d = MINT
  const num = d[0] * targetRange.R + d[1] * targetRange.G + d[2] * targetRange.B
  const den = d[0] * d[0] + d[1] * d[1] + d[2] * d[2]
  const A = num / den
  const range = d.map((v) => A * v)
  const err = Math.sqrt(
    ((range[0] - targetRange.R) / targetRange.R) ** 2 +
    ((range[1] - targetRange.G) / targetRange.G) ** 2 +
    ((range[2] - targetRange.B) / targetRange.B) ** 2
  )
  console.log(`  best possible black ramp: alpha ${A.toFixed(3)}, relative shape error ${(err * 100).toFixed(1)}%`)
  console.log(`    stddev R ${(range[0] / SQRT12).toFixed(2)}  G ${(range[1] / SQRT12).toFixed(2)}  B ${(range[2] / SQRT12).toFixed(2)}`)
  console.log('  Compare that error against the best-fit chromatic stop above. The difference IS the gap.')
}
