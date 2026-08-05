// GUI driver for #119 — acrylic keeps its blur when the window loses focus.
//
// WHAT THE VITEST SUITE PROVES, so this does not repeat it: which material is
// re-asserted, when, and with what value. `tests/backdrop-keeper.test.ts` pins
// the decision. It cannot say whether the blur comes back ON SCREEN — that is
// DWM compositing over a wallpaper, and a keeper that called
// `setBackgroundMaterial` into the void would pass every assertion there.
//
// SO THIS DRIVER CARRIES TWO INDEPENDENT WITNESSES, and needs both:
//   1. THE CALL — `BrowserWindow.prototype.setBackgroundMaterial` is patched in
//      MAIN, so what is recorded is the app's own blur handler firing, not this
//      driver's doing. Nothing here ever sets a material except through the
//      app's own `backdrop:set` channel.
//   2. THE PIXELS — a DESKTOP capture of the window rectangle, because a
//      `page.screenshot()` cannot show a DWM backdrop at all: the window is
//      transparent over a material drawn behind it (#117).
// Either alone is insufficient. The call without the pixels is a keeper talking
// to itself; the pixels without the call cannot say the APP did it rather than
// the OS having a good day.
//
// HOW AN HONESTLY-UNFOCUSED WINDOW IS PRODUCED: a SECOND WINDOW takes focus.
// #75 measured `win.blur()` as inert (isFocused stays true, no event) and a
// minimised window as still reporting focus; #117 confirmed both and found this
// rung — unfocused, visible, un-minimised, one real blur event.
//
// EVERY CAPTURE IS CONTROLLED. Focus state is the one MEASURED at capture time,
// never the one requested, and magenta corner markers on a throwaway pass prove
// nothing is covering the window — #117's first capture run produced four
// colourful, blankness-passing photographs of a terminal on top of the app.
//
// Red-first: run against a build without the keeper and step 3 fails naming the
// reason (the unfocused capture sits at the flat score). A driver never seen
// failing proves nothing.
//
//   node .claude/skills/run-desktop/gui-119.mjs
//
// Needs `npm run build` first, plus `npm i --no-save playwright-core`.
// Launched WITHOUT --disable-gpu: that flag flattens acrylic, so a driver that
// disables the GPU is photographing neither material (gui-69.mjs:9-11).

import { _electron as electron } from 'playwright-core'
import path from 'node:path'
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'

const APP_DIR = path.resolve(import.meta.dirname, '../../..')
const SHOT_DIR = path.join(APP_DIR, 'scripts', 'gui-119-shots')
fs.mkdirSync(SHOT_DIR, { recursive: true })

const log = (l, m) => console.log(String(l).padEnd(13) + JSON.stringify(m))
const fails = []

setTimeout(() => {
  console.log('TIMEOUT')
  process.exit(1)
}, 300000).unref?.()

const app = await electron.launch({
  executablePath: path.join(APP_DIR, 'node_modules/electron/dist/electron.exe'),
  args: ['--no-sandbox', '.'],
  cwd: APP_DIR,
  env: process.env,
  timeout: 45000
})

const finish = async () => {
  console.log(fails.length === 0 ? 'PASS' : 'FAIL')
  for (const f of fails) console.log('  - ' + f)
  console.log(
    'NOTE        the keeper DECISION is pinned in tests/backdrop-keeper.test.ts; this driver covers only what jsdom and vitest structurally cannot — the call reaching the real window, and the pixels changing.'
  )
  setTimeout(() => process.exit(fails.length === 0 ? 0 : 1), 4000).unref?.()
  await app.close().catch(() => {})
  process.exit(fails.length === 0 ? 0 : 1)
}

// ---- witness 1: instrument the real method, in MAIN --------------------------

const patched = await app.evaluate(({ BrowserWindow }) => {
  globalThis.__bd119 = []
  const proto = BrowserWindow.prototype
  if (typeof proto.setBackgroundMaterial !== 'function') return { patched: false }
  if (!globalThis.__bd119orig) globalThis.__bd119orig = proto.setBackgroundMaterial
  const original = globalThis.__bd119orig
  proto.setBackgroundMaterial = function (material) {
    globalThis.__bd119.push(material)
    return original.call(this, material)
  }
  return { patched: true }
})
log('PATCH', patched)
if (!patched.patched) {
  fails.push('BrowserWindow has no setBackgroundMaterial — nothing below could be recorded')
  await finish()
}

const calls = () => app.evaluate(() => globalThis.__bd119 ?? [])
const clearCalls = () =>
  app.evaluate(() => {
    globalThis.__bd119 = []
  })

// A KNOWN, VARIED SURFACE BEHIND THE WINDOW, and it is not decoration.
//
// The metric here is "how many distinct colours does the window rectangle
// show", and acrylic only differs from flat by what it blurs THROUGH from
// behind. Over a uniform dark desktop the two are identical and the instrument
// is blind — measured the hard way: a sibling probe scored a focused, properly
// blurred window at 60 distinct colours because a maximised dark terminal
// happened to be behind it, then reported a confident verdict off two scored
// trials. Its answer was discarded and the probe deleted.
//
// This window removes the dependency on whatever the desktop happens to hold.
const PATTERN = `data:text/html,${encodeURIComponent(
  `<body style="margin:0;height:100vh;background:
     repeating-linear-gradient(45deg,#ff004c 0 40px,#00e5ff 40px 80px,#ffe600 80px 120px,#00ff85 120px 160px)">`
)}`

const setup = await app.evaluate(
  async ({ BrowserWindow }, pattern) => {
    const target = BrowserWindow.getAllWindows()[0]
    if (!target) return null
    target.show()
    target.focus()
    await new Promise((r) => setTimeout(r, 600))

    // Behind the target, covering it, created BEFORE the target is pinned.
    const b = target.getBounds()
    const backdropSource = new BrowserWindow({
      show: true,
      frame: false,
      skipTaskbar: true,
      focusable: false,
      x: b.x - 40,
      y: b.y - 40,
      width: b.width + 80,
      height: b.height + 80
    })
    await backdropSource.loadURL(pattern)

    target.setAlwaysOnTop(true, 'screen-saver')
    target.focus()
    await new Promise((r) => setTimeout(r, 900))

    const thief = new BrowserWindow({ show: true, width: 320, height: 220, x: 30, y: 30 })
    await new Promise((r) => setTimeout(r, 400))
    return { targetId: target.id, thiefId: thief.id, sourceId: backdropSource.id }
  },
  PATTERN
)
if (!setup) {
  fails.push('could not drive: the app had no window')
  await finish()
}
log('WINDOWS', setup)

// ---- witness 2: desktop captures, with focus and occlusion controls ----------

const ps = (script, timeout = 60000) => {
  try {
    return execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {
      encoding: 'utf8',
      timeout
    }).trim()
  } catch {
    return null
  }
}

const grab = (file, r) =>
  ps(`
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$b = New-Object System.Drawing.Bitmap ${r.width}, ${r.height}
$g = [System.Drawing.Graphics]::FromImage($b)
$g.CopyFromScreen(${r.x}, ${r.y}, 0, 0, $b.Size)
$b.Save('${file.replace(/\\/g, '\\\\')}', [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $b.Dispose(); Write-Output 'ok'`) === 'ok'

const colours = (file) => {
  const n = ps(`
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$b = New-Object System.Drawing.Bitmap('${file.replace(/\\/g, '\\\\')}')
$c = @{}
for ($y=0; $y -lt $b.Height; $y+=7) { for ($x=0; $x -lt $b.Width; $x+=7) { $c[$b.GetPixel($x,$y).ToArgb()]=1 } }
$b.Dispose(); Write-Output $c.Count`)
  return n === null ? -1 : Number(n)
}

const cornersFound = (file) => {
  const n = ps(`
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$b = New-Object System.Drawing.Bitmap('${file.replace(/\\/g, '\\\\')}')
$w=$b.Width; $h=$b.Height; $box=44
$cs=@(@(0,0),@(($w-$box),0),@(0,($h-$box)),@(($w-$box),($h-$box)))
$f=0
foreach ($c in $cs) {
  $hit=$false
  for ($y=$c[1]; $y -lt ($c[1]+$box) -and -not $hit; $y++) {
    for ($x=$c[0]; $x -lt ($c[0]+$box) -and -not $hit; $x++) {
      if ($x -lt 0 -or $y -lt 0 -or $x -ge $w -or $y -ge $h) { continue }
      $p=$b.GetPixel($x,$y)
      if ($p.R -gt 200 -and $p.G -lt 80 -and $p.B -gt 200) { $hit=$true }
    }
  }
  if ($hit) { $f++ }
}
$b.Dispose(); Write-Output $f`)
  return n === null ? -1 : Number(n)
}

const markers = (on) =>
  app.evaluate(
    async ({ BrowserWindow }, a) => {
      const w = BrowserWindow.fromId(a.id)
      await w?.webContents.executeJavaScript(
        a.on
          ? `(()=>{document.querySelectorAll('.__m119').forEach(n=>n.remove());for(const [p,q] of [['top','left'],['top','right'],['bottom','left'],['bottom','right']]){const d=document.createElement('div');d.className='__m119';d.style.cssText='position:fixed;width:28px;height:28px;background:#f0f;z-index:2147483647;'+p+':0;'+q+':0;';document.body.appendChild(d)}return 1})()`
          : `(()=>{document.querySelectorAll('.__m119').forEach(n=>n.remove());return 1})()`
      )
    },
    { id: setup.targetId, on }
  )

const state = () =>
  app.evaluate(
    ({ BrowserWindow }, id) => {
      const w = BrowserWindow.fromId(id)
      return w
        ? {
            isFocused: w.isFocused(),
            isVisible: w.isVisible(),
            isMinimized: w.isMinimized(),
            bounds: w.getBounds()
          }
        : null
    },
    setup.targetId
  )

// `checkOcclusion` is opt-out for the repeated stress trials, and the reason is
// measured rather than convenient: Chromium THROTTLES rendering in a background
// window, so injected marker divs frequently do not paint within any wait short
// enough to keep a stress loop reasonable — the first stress run scored
// corners=0 on trials whose captures were otherwise perfect. The target is
// pinned always-on-top at 'screen-saver' level for the entire run and nothing
// else moves, so occlusion is checked once on the headline captures and taken
// as holding for the repeats. Focus honesty is still checked on EVERY trial,
// because that is the property that actually varies.
const capture = async (label, wantFocused, checkOcclusion = true) => {
  const s = await state()
  const marked = path.join(SHOT_DIR, `${label}.marked.png`)
  const clean = path.join(SHOT_DIR, `${label}.png`)
  let corners = 4
  if (checkOcclusion) {
    await markers(true)
    await new Promise((r) => setTimeout(r, 700))
    const okM = s ? grab(marked, s.bounds) : false
    corners = okM ? cornersFound(marked) : -1
    await markers(false)
    await new Promise((r) => setTimeout(r, 500))
    try {
      fs.rmSync(marked, { force: true })
    } catch {}
  }
  const ok = s ? grab(clean, s.bounds) : false
  const row = {
    label,
    measured: s,
    focusHonest: !!s && s.isFocused === wantFocused && s.isVisible && !s.isMinimized,
    corners,
    occlusionChecked: checkOcclusion,
    colours: ok ? colours(clean) : -1
  }
  row.usable = row.focusHonest && corners === 4 && ok
  log('CAPTURE', {
    label,
    focusHonest: row.focusHonest,
    corners,
    colours: row.colours,
    usable: row.usable
  })
  if (!row.usable) {
    fails.push(
      `could not drive: the ${label} capture is unusable (focusHonest=${row.focusHonest}, corners=${corners}) — nothing may be concluded from it`
    )
  }
  return row
}

// The app's OWN channel, never a direct call: what is under test is the keeper
// remembering what the renderer told it.
const pickBackdrop = async (material) => {
  await app.evaluate(
    async ({ BrowserWindow }, a) => {
      const w = BrowserWindow.fromId(a.id)
      await w?.webContents.executeJavaScript(`window.api.setBackdrop(${JSON.stringify(a.material)})`)
    },
    { id: setup.targetId, material }
  )
  await new Promise((r) => setTimeout(r, 1200))
}

const focusTarget = async () => {
  await app.evaluate(
    async ({ BrowserWindow, app: a }, id) => {
      const w = BrowserWindow.fromId(id)
      w?.show()
      w?.focus()
      a.focus({ steal: true })
      await new Promise((r) => setTimeout(r, 1000))
    },
    setup.targetId
  )
}

// `churn` alternations before settling unfocused. A single clean blur is the
// easy case; the owner's report was "90% works but when i stress tested it
// sometimes it slips", so the stress IS the test.
const blurTarget = async (churn = 0) => {
  await app.evaluate(
    async ({ BrowserWindow, app: a }, arg) => {
      const t = BrowserWindow.fromId(arg.targetId)
      const th = BrowserWindow.fromId(arg.thiefId)
      for (let i = 0; i < arg.churn; i++) {
        th?.focus()
        await new Promise((r) => setTimeout(r, 110))
        t?.focus()
        a.focus({ steal: true })
        await new Promise((r) => setTimeout(r, 110))
      }
      // Settle UNFOCUSED, and verify rather than assume. `moveTop()` and the
      // app-level `focus({steal:true})` used during churn can both hand focus
      // back on win32, which showed up as trials scored dishonest — an
      // instrument failing its own setup, not the product slipping.
      for (let attempt = 0; attempt < 4; attempt++) {
        th?.focus()
        await new Promise((r) => setTimeout(r, 700))
        t?.moveTop()
        await new Promise((r) => setTimeout(r, 500))
        if (!t?.isFocused()) break
      }
      await new Promise((r) => setTimeout(r, 1200))
      return t ? { isFocused: t.isFocused() } : null
    },
    { ...setup, churn }
  )
}

// ---- 1. acrylic, focused: what "engaged" looks like on this machine ----------

await pickBackdrop('acrylic')
await focusTarget()
const focused = await capture('acrylic-focused', true)
if (fails.length) await finish()

// THE INSTRUMENT'S OWN PRECONDITION, checked before anything is concluded.
// If the focused window does not itself show plenty of variety, then blurred
// and flat are indistinguishable to this metric and every comparison below
// would be a false PASS. A sibling probe skipped this check, scored a properly
// blurred window at 60, and printed a verdict anyway.
const CAN_SEE_FLOOR = 250
if (focused.colours < CAN_SEE_FLOOR) {
  fails.push(
    `UNSCORED: the focused window shows only ${focused.colours} distinct colours (floor ${CAN_SEE_FLOOR}). Blurred and flat are indistinguishable at this level, so nothing below would be evidence — the pattern window behind the target did not take effect.`
  )
  await finish()
}
log('CANSEE', { focused: focused.colours, floor: CAN_SEE_FLOOR })

// ---- 2 + 3. acrylic, unfocused: the app must re-assert, and the pixels move --

await clearCalls()
await blurTarget()
const onBlurCalls = await calls()
const unfocused = await capture('acrylic-unfocused', false)
log('BLURCALLS', onBlurCalls)

if (!onBlurCalls.includes('acrylic')) {
  fails.push(
    `losing focus produced setBackgroundMaterial calls ${JSON.stringify(onBlurCalls)} — the app's blur handler did not re-assert, so witness 1 says the keeper is not wired`
  )
}
if (onBlurCalls.some((m) => !['acrylic', 'mica'].includes(m))) {
  fails.push(`a value outside the two-string whitelist reached the window: ${JSON.stringify(onBlurCalls)}`)
}

if (unfocused.usable && focused.usable) {
  // The pixel criterion, stated as a ratio rather than an absolute so it does
  // not depend on this machine's wallpaper. A flattened window scores about an
  // eighth of an engaged one (118 vs 948 when this was measured); "kept the
  // blur" means landing nearer the engaged score than the flat one.
  const ratio = unfocused.colours / focused.colours
  log('RATIO', { focused: focused.colours, unfocused: unfocused.colours, ratio: Number(ratio.toFixed(3)) })
  if (ratio < 0.6) {
    fails.push(
      `the unfocused window scored ${unfocused.colours} against ${focused.colours} focused (ratio ${ratio.toFixed(2)}) — the blur did NOT survive losing focus, which is the whole ticket`
    )
  }
}

// ---- 4. it PERSISTS — a flicker is not a fix --------------------------------

await new Promise((r) => setTimeout(r, 12000))
const later = await capture('acrylic-unfocused-12s', false)
if (later.usable && focused.usable && later.colours / focused.colours < 0.6) {
  fails.push(
    `12s after losing focus the window scored ${later.colours} against ${focused.colours} focused — the re-assert engages the blur and then decays, so it is a flicker rather than a fix`
  )
}

// ---- 4b. THE STRESS TEST — the tail is the whole complaint -------------------

// "90% works" and "works" are the same to a single-trial driver, which is why
// the single-call version shipped. Repeated trials, half of them with focus
// churned, and the bar is EVERY trial rather than most.
const TRIALS = Number(process.env.GUI119_TRIALS ?? 4)
const stress = []
for (const churn of [0, 3]) {
  for (let i = 1; i <= TRIALS; i++) {
    await focusTarget()
    await blurTarget(churn)
    const shot = await capture(`stress-churn${churn}-t${i}`, false, false)
    const ratio = focused.colours > 0 ? shot.colours / focused.colours : 0
    const kept = shot.usable && ratio >= 0.6
    stress.push({ churn, trial: i, usable: shot.usable, colours: shot.colours, ratio, kept })
    // Only keep the images that failed — a passing run should not leave a pile.
    if (kept && shot.usable) {
      try {
        fs.rmSync(path.join(SHOT_DIR, `stress-churn${churn}-t${i}.png`), { force: true })
      } catch {}
    }
  }
}
const scored = stress.filter((s) => s.usable)
const keptCount = scored.filter((s) => s.kept).length
log('STRESS', {
  trials: stress.length,
  scored: scored.length,
  kept: keptCount,
  byChurn: [0, 3].map((c) => ({
    churn: c,
    kept: `${scored.filter((s) => s.churn === c && s.kept).length}/${
      scored.filter((s) => s.churn === c).length
    }`
  }))
})
if (scored.length < stress.length) {
  fails.push(
    `only ${scored.length} of ${stress.length} stress trials produced a usable capture — an unscored trial is not a passing one`
  )
}
if (keptCount < scored.length) {
  const worst = scored.filter((s) => !s.kept)
  fails.push(
    `the blur was LOST in ${worst.length} of ${scored.length} stress trials (${worst
      .map((w) => `churn${w.churn}/t${w.trial} ratio ${w.ratio.toFixed(2)}`)
      .join(', ')}) — this is the "sometimes it slips" the schedule exists to fix`
  )
}

// ---- 5. mica is NOT re-asserted, and the absence is non-vacuous -------------

await focusTarget()
await pickBackdrop('mica')
await clearCalls()
await blurTarget()
const micaBlurCalls = await calls()
log('MICABLUR', micaBlurCalls)
if (micaBlurCalls.length !== 0) {
  fails.push(
    `blurring a MICA window produced ${JSON.stringify(micaBlurCalls)} — mica does not flatten (owner-observed), so re-asserting it spends a repaint for nothing`
  )
}
// Non-vacuous: the same gesture DID produce a call two steps ago, on acrylic.
// Without that, "zero calls" is equally consistent with a blur event that never
// fires at all and a keeper that is simply dead.
if (!onBlurCalls.includes('acrylic')) {
  fails.push(
    'the mica silence is vacuous — the acrylic arm did not produce a call either, so nothing shows the blur event fires at all'
  )
}

await app
  .evaluate(({ BrowserWindow }, id) => BrowserWindow.fromId(id)?.setAlwaysOnTop(false), setup.targetId)
  .catch(() => {})

console.log(`SHOTS       ${path.relative(APP_DIR, SHOT_DIR).replace(/\\/g, '/')}`)
await finish()
