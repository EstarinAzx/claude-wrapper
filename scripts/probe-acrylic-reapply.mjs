// Does re-applying the backdrop material on blur re-engage acrylic's blur-behind?
//
// THE FREE HYPOTHESIS, and where it comes from. #117's S4 measured something it
// did not chase: acrylic's FOCUSED capture scored 97 distinct colours in round 1
// and 434 in rounds 2 and 3 — same window, same material, same code path. The
// only difference is that rounds 2-3 set `acrylic` right after `mica`, i.e. a
// real material CHANGE, while round 1 set `acrylic` on a window already wearing
// it. That is evidence, one step short of a claim, that DWM engages the material
// on a change rather than on a focus transition.
//
// If that generalises to the UNFOCUSED state, then re-applying the material when
// the window blurs is a zero-dependency fix for the owner's ask, and both
// dependency routes #117 priced can stay rejected.
//
// PRIOR EXPECTATION IS THAT THIS FAILS. The Win11 system-backdrop API renders an
// inactive state by design, and DWM tracks activation itself; the legacy
// `SetWindowCompositionAttribute` route exists precisely because the system
// backdrop is focus-coupled. This probe is cheap and the finding is worth having
// either way — a measured no is what justifies paying for a dependency.
//
//   node scripts/probe-acrylic-reapply.mjs
//
// Reuses spike-117's rig wholesale: an honestly-unfocused window is produced by
// a SECOND WINDOW taking focus (blur() is inert — #75, confirmed by #117), every
// capture carries a focus control and a magenta-corner occlusion control, and
// nothing is scored that did not photograph the state it was asked for.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { _electron as electron } from 'playwright-core'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const APP_DIR = path.resolve(HERE, '..')
const SHOT_DIR = path.join(HERE, 'probe-acrylic-shots')
const OUT = path.join(HERE, 'probe-acrylic-reapply.json')
fs.mkdirSync(SHOT_DIR, { recursive: true })

const log = (l, m) => console.log(String(l).padEnd(14) + JSON.stringify(m))

const electronBin = path.join(APP_DIR, 'node_modules/electron/dist/electron.exe')
const app = await electron.launch({
  executablePath: electronBin,
  args: ['--no-sandbox', '.'],
  cwd: APP_DIR,
  env: process.env,
  timeout: 45000
})

const ids = await app.evaluate(async ({ BrowserWindow }) => {
  const target = BrowserWindow.getAllWindows()[0]
  target.show()
  target.focus()
  target.setAlwaysOnTop(true, 'screen-saver')
  await new Promise((r) => setTimeout(r, 800))
  const thief = new BrowserWindow({ show: true, width: 320, height: 220, x: 30, y: 30 })
  await new Promise((r) => setTimeout(r, 400))
  return { targetId: target.id, thiefId: thief.id, bounds: target.getBounds() }
})
log('WINDOWS', ids)

const grab = (file, rect) => {
  const ps = `
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap ${rect.width}, ${rect.height}
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen(${rect.x}, ${rect.y}, 0, 0, $bmp.Size)
$bmp.Save('${file.replace(/\\/g, '\\\\')}', [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Write-Output 'ok'`
  try {
    return execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps], {
      encoding: 'utf8',
      timeout: 30000
    })
      .trim()
      .endsWith('ok')
  } catch {
    return false
  }
}

// Distinct colours over a sampled grid. Against a near-black wash, blur-behind
// showing through is the only thing that puts variety in this number — which is
// why #117 saw 97 flat versus 434 with the blur engaged.
const colours = (file) => {
  const ps = `
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap('${file.replace(/\\/g, '\\\\')}')
$c = @{}
for ($y = 0; $y -lt $bmp.Height; $y += 7) { for ($x = 0; $x -lt $bmp.Width; $x += 7) { $c[$bmp.GetPixel($x,$y).ToArgb()] = 1 } }
$bmp.Dispose(); Write-Output $c.Count`
  try {
    return Number(
      execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps], {
        encoding: 'utf8',
        timeout: 60000
      }).trim()
    )
  } catch {
    return -1
  }
}

const cornersFound = (file) => {
  const ps = `
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap('${file.replace(/\\/g, '\\\\')}')
$w=$bmp.Width; $h=$bmp.Height; $box=44
$corners=@(@(0,0),@(($w-$box),0),@(0,($h-$box)),@(($w-$box),($h-$box)))
$found=0
foreach ($c in $corners) {
  $hit=$false
  for ($y=$c[1]; $y -lt ($c[1]+$box) -and -not $hit; $y++) {
    for ($x=$c[0]; $x -lt ($c[0]+$box) -and -not $hit; $x++) {
      if ($x -lt 0 -or $y -lt 0 -or $x -ge $w -or $y -ge $h) { continue }
      $p=$bmp.GetPixel($x,$y)
      if ($p.R -gt 200 -and $p.G -lt 80 -and $p.B -gt 200) { $hit=$true }
    }
  }
  if ($hit) { $found++ }
}
$bmp.Dispose(); Write-Output $found`
  try {
    return Number(
      execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps], {
        encoding: 'utf8',
        timeout: 60000
      }).trim()
    )
  } catch {
    return -1
  }
}

const markers = (on) =>
  app.evaluate(
    async ({ BrowserWindow }, a) => {
      const w = BrowserWindow.fromId(a.id)
      await w?.webContents.executeJavaScript(
        a.on
          ? `(()=>{document.querySelectorAll('.__pm').forEach(n=>n.remove());for(const [x,y] of [['top','left'],['top','right'],['bottom','left'],['bottom','right']]){const d=document.createElement('div');d.className='__pm';d.style.cssText='position:fixed;width:28px;height:28px;background:#f0f;z-index:2147483647;'+x+':0;'+y+':0;';document.body.appendChild(d)}return 1})()`
          : `(()=>{document.querySelectorAll('.__pm').forEach(n=>n.remove());return 1})()`
      )
    },
    { id: ids.targetId, on }
  )

// The four arms. Each returns the state MEASURED at capture time, never the one
// requested — a row whose focus disagrees with its request is not evidence.
const arm = async (label, script, extraSettleMs = 0) => {
  const state = await app.evaluate(
    async ({ BrowserWindow, app: a }, arg) => {
      const target = BrowserWindow.fromId(arg.targetId)
      const thief = BrowserWindow.fromId(arg.thiefId)
      if (!target) return null

      // Reset to a known state every arm: focused, wearing acrylic, settled.
      target.focus()
      a.focus({ steal: true })
      target.setBackgroundMaterial('acrylic')
      await new Promise((r) => setTimeout(r, 1200))

      if (arg.script === 'focused-baseline') {
        // nothing more — this is what "engaged" looks like
      } else if (arg.script === 'plain-blur') {
        thief?.focus()
        await new Promise((r) => setTimeout(r, 1400))
      } else if (arg.script === 'reapply-same') {
        thief?.focus()
        await new Promise((r) => setTimeout(r, 800))
        // THE HYPOTHESIS: re-assert the same material while unfocused.
        target.setBackgroundMaterial('acrylic')
        await new Promise((r) => setTimeout(r, 1400))
      } else if (arg.script === 'toggle-through-none') {
        thief?.focus()
        await new Promise((r) => setTimeout(r, 800))
        // A stronger form: force a genuine CHANGE, which is what #117's rounds
        // 2-3 actually did, rather than re-asserting the current value.
        target.setBackgroundMaterial('none')
        await new Promise((r) => setTimeout(r, 250))
        target.setBackgroundMaterial('acrylic')
        await new Promise((r) => setTimeout(r, 1400))
      }

      target.moveTop()
      // THE PERSISTENCE QUESTION. A re-apply that engages the blur and then
      // loses it a few seconds later is a flicker, not a fix — and every capture
      // so far was taken ~1.4s after the call, which is exactly the window in
      // which a decaying effect still looks like a working one. Nothing touches
      // the window during this wait.
      await new Promise((r) => setTimeout(r, 300 + arg.extraSettleMs))
      return {
        isFocused: target.isFocused(),
        isVisible: target.isVisible(),
        isMinimized: target.isMinimized(),
        bounds: target.getBounds()
      }
    },
    { ...ids, script, extraSettleMs }
  )

  const wantFocused = script === 'focused-baseline'
  const marked = path.join(SHOT_DIR, `${label}.marked.png`)
  const clean = path.join(SHOT_DIR, `${label}.png`)

  await markers(true)
  await new Promise((r) => setTimeout(r, 400))
  const okM = state ? grab(marked, state.bounds) : false
  const corners = okM ? cornersFound(marked) : -1
  await markers(false)
  await new Promise((r) => setTimeout(r, 400))
  const ok = state ? grab(clean, state.bounds) : false
  try {
    fs.rmSync(marked, { force: true })
  } catch {}

  const row = {
    label,
    script,
    measured: state,
    focusHonest: !!state && state.isFocused === wantFocused && state.isVisible && !state.isMinimized,
    cornersFound: corners,
    unoccluded: corners === 4,
    colours: ok ? colours(clean) : -1,
    file: ok ? path.relative(APP_DIR, clean).replace(/\\/g, '/') : null
  }
  row.usable = row.focusHonest && row.unoccluded && ok
  log('ARM', { label, focusHonest: row.focusHonest, corners, colours: row.colours, usable: row.usable })
  return row
}

const rows = []
for (const round of [1, 2]) {
  rows.push(await arm(`r${round}-focused-baseline`, 'focused-baseline'))
  rows.push(await arm(`r${round}-plain-blur`, 'plain-blur'))
  rows.push(await arm(`r${round}-reapply-same`, 'reapply-same'))
  rows.push(await arm(`r${round}-toggle-through-none`, 'toggle-through-none'))
}

// Persistence: the same re-apply, photographed later and later, with nothing
// touching the window in between. A decaying effect and a stable one are
// indistinguishable at 1.4s.
const persistence = []
for (const wait of [5000, 15000]) {
  persistence.push(await arm(`persist-${wait}ms`, 'reapply-same', wait))
}
rows.push(...persistence)

await app
  .evaluate(({ BrowserWindow }, id) => BrowserWindow.fromId(id)?.setAlwaysOnTop(false), ids.targetId)
  .catch(() => {})

// The verdict is a COMPARISON, and it is only drawn from usable rows. The
// baseline is what "engaged" looks like on this machine today; plain-blur is
// what the owner is complaining about; the question is whether either reapply
// arm moves toward the baseline rather than sitting with plain-blur.
const usable = rows.filter((r) => r.usable)
const mean = (label) => {
  const hits = usable
    .filter((r) => r.script === label && !r.label.startsWith('persist-'))
    .map((r) => r.colours)
  return hits.length ? hits.reduce((a, b) => a + b, 0) / hits.length : null
}
const summary = {
  focusedBaseline: mean('focused-baseline'),
  plainBlur: mean('plain-blur'),
  reapplySame: mean('reapply-same'),
  toggleThroughNone: mean('toggle-through-none'),
  usableRows: usable.length,
  totalRows: rows.length
}

// Deliberately not a boolean. A verdict needs the baseline to be DISTINCT from
// plain-blur in the first place — if they match, this instrument cannot see the
// flip at all and says so rather than reporting a false negative.
const spread = summary.focusedBaseline !== null && summary.plainBlur !== null
  ? summary.focusedBaseline - summary.plainBlur
  : null
summary.instrumentCanSeeTheFlip = spread !== null && Math.abs(spread) > 20
summary.verdict = !summary.instrumentCanSeeTheFlip
  ? 'UNSCORED — focused and unfocused acrylic look the same to this instrument, so it cannot detect a fix either'
  : summary.reapplySame > summary.plainBlur + Math.abs(spread) * 0.5 ||
      summary.toggleThroughNone > summary.plainBlur + Math.abs(spread) * 0.5
    ? 'RE-APPLY HELPS — a free fix is on the table'
    : 'RE-APPLY DOES NOT HELP — the flip is DWM tracking activation, and a dependency is the only route left'

summary.persistence = persistence.map((p) => ({
  label: p.label,
  colours: p.colours,
  usable: p.usable,
  // Held only if it is still nearer the engaged baseline than the flat one.
  held:
    p.usable &&
    summary.focusedBaseline !== null &&
    summary.plainBlur !== null &&
    p.colours > (summary.focusedBaseline + summary.plainBlur) / 2
}))
summary.persists = summary.persistence.every((p) => p.held)
if (summary.verdict.startsWith('RE-APPLY HELPS') && !summary.persists) {
  summary.verdict =
    'RE-APPLY IS A FLICKER — the blur engages and decays, so a single call on blur is not a fix'
}

log('SUMMARY', summary)
fs.writeFileSync(OUT, JSON.stringify({ probe: 'acrylic-reapply-on-blur', summary, rows }, null, 2) + '\n')
log('WROTE', path.relative(APP_DIR, OUT).replace(/\\/g, '/'))

await app.close().catch(() => {})
process.exit(0)
