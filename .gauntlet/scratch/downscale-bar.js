// Derive half-scale copies of the bar references so a critic's three-image payload
// fits inside the context window.
//
// WHY THIS EXISTS: run 3 wave 1 lost the Sidebar critic to `"Prompt is too long"`
// (invalid_request) on the standardised THREE-image payload. All five bar references are
// 3360x2100 (~9.4k image-tokens each), so every critic was running within a few percent of
// the ceiling and one of five tipped over. Run 1 wave 2 hit the same wall at five images
// and its *trimmed* retry produced that run's one false `YOURS WINS` — so the fix must keep
// every critic's payload IDENTICAL rather than shrink one of them.
//
// Reads the bar; never writes to it. `.gauntlet/bar/` must stay byte-identical — a bar that
// drifts under a loop is not a bar. Output goes to the wave folder as derived evidence.
//
// ponytail: Electron's nativeImage is already a dependency, so no image library is added.
// Run: node_modules/.bin/electron .gauntlet/scratch/downscale-bar.js

const { app, nativeImage } = require('electron')
const fs = require('fs')
const path = require('path')

const SRC = path.join(__dirname, '..', 'bar', 'linear')
const OUT = process.env.OUT_DIR || path.join(__dirname, '..', 'waves', 'core-after-docks', '1', 'bar-half')
const WIDTH = Number(process.env.WIDTH || 1680) // exactly half of 3360

app.disableHardwareAcceleration()

app.whenReady().then(() => {
  fs.mkdirSync(OUT, { recursive: true })
  let failed = 0

  for (const file of fs.readdirSync(SRC).filter((f) => f.endsWith('.png'))) {
    const src = path.join(SRC, file)
    const img = nativeImage.createFromPath(src)
    const before = img.getSize()

    if (before.width === 0) {
      console.log(`FAIL        ${file} — nativeImage could not decode it`)
      failed++
      continue
    }

    const out = img.resize({ width: WIDTH, quality: 'best' })
    const buf = out.toPNG()
    fs.writeFileSync(path.join(OUT, file), buf)
    const after = out.getSize()

    console.log(
      `RESIZED     ${file.padEnd(26)} ${before.width}x${before.height} -> ${after.width}x${after.height}  ` +
        `${(fs.statSync(src).size / 1024).toFixed(0)}KB -> ${(buf.length / 1024).toFixed(0)}KB`
    )
  }

  console.log(failed ? `CAPTURED    ${5 - failed}/5 — FAILED` : 'PASS')
  app.exit(failed ? 1 : 0)
})
