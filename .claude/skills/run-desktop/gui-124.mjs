// GUI driver for #124 — the five-position effort control, in the BUILT app.
//
// WHAT THE SUITE ALREADY PROVES, so this does not repeat it: the scale and its
// order, the trust boundary, `effortLevelsFor`'s per-row answer, the whole
// `effort:set` transaction (rejection, resume-before-discard), the control's
// stops and readout, and that an injected `getEffortOptions()` reaches the
// options object handed to a STUB queryFn.
//
// WHAT ONLY THIS CAN PROVE:
//
//   1. THE LEVELS ARE THE REAL CLI'S. Every suite test feeds the rows from a
//      fixture, so all of them stay green against an app that ignored the CLI
//      entirely. Phase 3 picks the REAL row with the fewest advertised levels
//      and checks the control's stop count follows it — the only place #53's
//      rule is measured rather than mocked.
//
//   2. THE PICK REACHES THE CLI PROCESS. The ticket's stated failure mode is a
//      stored value that never reaches `Options`, and a stub queryFn cannot
//      rule it out. Phase 5 reads the COMMAND LINE of the CLI child process the
//      rebuilt engine actually spawned, and looks for `--effort <level>` in it.
//      That is past `Options` entirely: it is the argument vector of the real
//      process, so no amount of app-side plumbing can fake it.
//
//   3. THE CONTROL IS REALLY PAINTED AND REALLY REACHABLE. jsdom loads no CSS,
//      so the suite proves a rule was WRITTEN. Phase 7 samples the control's own
//      pixels and tabs to it with a real key.
//
// TWO JS SEAMS WERE TRIED FIRST AND BOTH ARE DEAD ENDS — recorded so the next
// driver does not spend the same hour:
//   - `sdk.query` cannot be monkey-patched. The SDK ships as ESM (`sdk.mjs`) and
//     `require()`ing it yields a FROZEN namespace: the assignment silently does
//     nothing, and a naive driver reads its own empty capture array as "the
//     value never arrived" — a false RED. This one caught itself only because it
//     read the patch back out of the module cache (`installedInCache: false`).
//   - `child_process.spawn` cannot be patched either: the SDK does
//     `import{spawn as …}from"child_process"`, an ESM binding resolved at link
//     time, so mutating the CJS export afterwards is invisible to it.
// Hence the OS-level measurement, which needs no seam at all.
//
// NEGATIVE CONTROL: phase 6 returns the control to Default, forces another
// rebuild, and requires `--effort` to be ABSENT from the new process's command
// line. "The pick reaches the CLI" means nothing without it — a build that
// always passed `--effort max` would sail through phase 5.
//
// NON-VACUITY: every argv claim is scored only after the descendant set is
// confirmed to have CHANGED, because a rebuild that never happened would leave
// the previous process in place and read as agreement.
//
// Red-first: run against a build with the control removed and phase 2 stops at
// the selector; against one where `getEffortOptions` is not spread into the
// query options, phase 5 finds no `--effort` on a real pick.
//
//   node .claude/skills/run-desktop/gui-124.mjs
//
// Needs `npm run build` first, plus `npm i --no-save playwright-core`. win32
// only — phase 5 reads command lines through Win32_Process.

import { _electron as electron } from 'playwright-core'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'
import { fileURLToPath } from 'node:url'

const APP_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const SHOT_DIR = process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')
fs.mkdirSync(SHOT_DIR, { recursive: true })
const WORK_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'gui124-'))

const log = (l, m) => console.log(String(l).padEnd(12) + JSON.stringify(m))
const fails = []

setTimeout(() => {
  console.log('TIMEOUT')
  process.exit(1)
}, 240000).unref?.()

// ---- the OS-level probe -----------------------------------------------------

// Every descendant of `root`, with its command line. Built from one snapshot of
// the whole table so the parent→child walk is consistent; asking per-level races
// a tree that is being torn down and rebuilt underneath it.
const descendants = (root) => {
  let rows
  try {
    // NOT ConvertTo-Json. A real command line on this machine carried a raw
    // control character, which produced invalid JSON and took the whole probe
    // down as "UNSCORED" mid-way through a red-path verification — a driver
    // failing for a reason that has nothing to do with what it measures. Line
    // records with the control range stripped cannot have that failure mode.
    const out = execFileSync(
      'powershell.exe',
      [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        "Get-CimInstance Win32_Process | ForEach-Object { $c = $_.CommandLine; if ($null -eq $c) { $c = '' }; $c = $c -replace '[\\x00-\\x1F]', ' '; \"$($_.ProcessId)`t$($_.ParentProcessId)`t$c\" }"
      ],
      { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024 }
    )
    rows = out
      .split(/\r?\n/)
      .map((line) => line.split('\t'))
      // Tabs are stripped from the command line above, so exactly two survive.
      .filter((parts) => parts.length >= 3 && /^\d+$/.test(parts[0]))
      .map((parts) => ({
        ProcessId: Number(parts[0]),
        ParentProcessId: Number(parts[1]),
        CommandLine: parts.slice(2).join('\t')
      }))
    if (rows.length === 0) return { error: 'the process table came back empty', procs: [] }
  } catch (err) {
    return { error: String(err?.message ?? err), procs: [] }
  }
  const byParent = new Map()
  for (const r of rows) {
    const list = byParent.get(r.ParentProcessId) ?? []
    list.push(r)
    byParent.set(r.ParentProcessId, list)
  }
  const seen = new Set()
  const procs = []
  const walk = (pid) => {
    for (const child of byParent.get(pid) ?? []) {
      if (seen.has(child.ProcessId)) continue
      seen.add(child.ProcessId)
      procs.push(child)
      walk(child.ProcessId)
    }
  }
  walk(root)
  return { procs }
}

// The CLI invocations among them, and what --effort each carries. Reported as
// null when the flag is absent, which is exactly what the negative control needs
// to distinguish from "no process at all".
const cliInvocations = (root) => {
  const { procs, error } = descendants(root)
  if (error) return { error, cli: [] }
  const cli = procs
    .filter((p) => typeof p.CommandLine === 'string' && /claude/i.test(p.CommandLine))
    .map((p) => {
      const m = /--effort[= ]+("?)([a-z]+)\1/i.exec(p.CommandLine)
      return { pid: p.ProcessId, effort: m ? m[2] : null }
    })
  return { cli }
}

const app = await electron.launch({
  executablePath: path.join(APP_DIR, 'node_modules/electron/dist/electron.exe'),
  args: ['--no-sandbox', '.'],
  cwd: APP_DIR,
  env: process.env,
  timeout: 45000
})

const page = await app.firstWindow()
await page.waitForLoadState('domcontentloaded')
const mainPid = await app.evaluate(() => process.pid)

const finish = async () => {
  console.log(fails.length === 0 ? 'PASS' : 'FAIL')
  for (const f of fails) console.log('  - ' + f)
  console.log(`SHOTS       ${SHOT_DIR.replace(/\\/g, '/')}`)
  await app.close().catch(() => {})
  try {
    fs.rmSync(WORK_DIR, { recursive: true, force: true })
  } catch {}
  process.exit(fails.length === 0 ? 0 : 1)
}

const shot = async (name) => {
  const file = path.join(SHOT_DIR, `${name}.png`)
  await page.screenshot({ path: file }).catch(() => {})
  console.log(`SHOT        ${file.replace(/\\/g, '/')}`)
}

// ---- phase 0: the origin this run is actually measuring ---------------------

const env = await page.evaluate(() => ({
  protocol: location.protocol,
  isSecureContext: window.isSecureContext
}))
log('ENV', { ...env, mainPid })
if (env.protocol !== 'file:') {
  fails.push(
    `the renderer is on ${env.protocol}, not file: — this run does not measure the production origin, so nothing below is evidence about the shipped app`
  )
  await finish()
}
if (process.platform !== 'win32') {
  fails.push(`phase 5 reads Win32_Process and this is ${process.platform} — UNSCORED, not refuted`)
}

// ---- phase 1: a workspace ---------------------------------------------------

await app.evaluate(({ dialog }, dir) => {
  dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [dir] })
}, WORK_DIR)

// DOM-dispatched: Playwright's actionability wait hangs on the intro animation
// (gui-93, gui-95, gui-96, gui-98, gui-122 and gui-123 all hit this).
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find(
    (b) =>
      b.getAttribute('aria-label') === 'Pick a project folder' ||
      b.textContent?.includes('Pick a project folder')
  )
  btn?.click()
})
await page.waitForSelector('.message-input', { timeout: 20000 })
log('WORKSPACE', { dir: path.basename(WORK_DIR) })

// ---- phase 2: the REAL CLI's rows -------------------------------------------

const arrived = await page
  .waitForSelector('.effort-range, .effort-none', { timeout: 20000 })
  .then(() => true)
  .catch(() => false)
if (!arrived) {
  fails.push(
    'no effort control of either kind appeared in the built app after 20s — the control is not reaching the shipped bundle'
  )
  await shot('no-control')
  await finish()
}

const cli = await page.evaluate(async () => {
  const info = await window.api.listModels()
  return {
    rows: info.models.length,
    effort: info.effort ?? null,
    current: info.current,
    withEffortField: info.models.filter((m) => m.supportsEffort !== undefined).length,
    withLevels: info.models.filter((m) => m.supportedEffortLevels !== undefined).length,
    union: [...new Set(info.models.flatMap((m) => m.supportedEffortLevels ?? []))],
    unsupported: info.models.filter((m) => m.supportsEffort === false).map((m) => m.id),
    omitting: info.models.filter((m) => m.supportedEffortLevels === undefined).map((m) => m.id),
    counts: info.models.map((m) => ({
      id: m.id,
      n: m.supportedEffortLevels?.length ?? null
    }))
  }
})
log('CLIROWS', {
  rows: cli.rows,
  withEffortField: cli.withEffortField,
  withLevels: cli.withLevels,
  union: cli.union,
  unsupported: cli.unsupported,
  omitting: cli.omitting
})

if (cli.rows === 0) {
  fails.push(
    'the CLI advertised no models at all, so nothing below measures CLI sourcing — UNSCORED, not refuted (check the CLI is installed and signed in)'
  )
  await finish()
}
if (cli.withLevels === 0) {
  fails.push(
    `the CLI advertised ${cli.rows} rows but none carried supportedEffortLevels — either this CLI predates the field or the mapper drops it; phases 2-3 are UNSCORED`
  )
  await finish()
}

const stops0 = await page.evaluate(() => {
  const el = document.querySelector('.effort-range')
  return {
    present: !!el,
    max: el?.max ?? null,
    value: el?.value ?? null,
    ariaValueText: el?.getAttribute('aria-valuetext') ?? null,
    readout: document.querySelector('.effort-value')?.textContent ?? null
  }
})
log('ATREST', stops0)
if (stops0.readout !== 'Default' || stops0.value !== '0') {
  fails.push(
    `a fresh launch shows ${JSON.stringify(stops0.readout)} at stop ${stops0.value} — the app opens having apparently picked an effort nobody chose`
  )
}
if (stops0.ariaValueText !== stops0.readout) {
  fails.push(
    `aria-valuetext ${JSON.stringify(stops0.ariaValueText)} disagrees with the visible readout ${JSON.stringify(stops0.readout)} — a screen reader and the screen would report different picks`
  )
}

// ---- phase 3: the stop count FOLLOWS the CLI's own list ---------------------

// With no turn run the CLI reports no current model, so no row matches and the
// control correctly shows the full scale — which a hardcoded five would also
// produce. Picking a model makes `getDisplayModel()` return it, so the row
// matches and the count becomes discriminating. The row with the FEWEST levels
// is chosen for exactly that reason.
const scored = cli.counts.filter((c) => c.n !== null).sort((a, b) => a.n - b.n)
const shortest = scored[0]
const widest = scored[scored.length - 1]
log('ROWPICK', { shortest, widest, distinctCounts: [...new Set(scored.map((c) => c.n))] })

const stopsFor = async (id) => {
  await page.evaluate((m) => window.api.setModel(m), id)
  await page.waitForTimeout(500)
  return page.evaluate(() => document.querySelector('.effort-range')?.max ?? null)
}

const shortMax = await stopsFor(shortest.id)
log('SHORTROW', { id: shortest.id, advertised: shortest.n, max: shortMax })
if (shortMax !== String(shortest.n)) {
  fails.push(
    `the CLI offers ${shortest.n} level(s) for ${shortest.id} but the control has max=${shortMax} (expected ${shortest.n} = levels + the Default stop) — the positions are not coming from the CLI`
  )
}
if (shortest.n === widest.n) {
  log('NOTE', {
    scored: 'weakly',
    why: `every CLI row advertises the same ${shortest.n} levels on this install, so the stop count cannot distinguish a CLI-sourced list from a literal of that length; the mapper and fallback are pinned in tests/effort.test.ts instead`
  })
} else {
  const wideMax = await stopsFor(widest.id)
  log('WIDEROW', { id: widest.id, advertised: widest.n, max: wideMax })
  if (wideMax !== String(widest.n)) {
    fails.push(
      `the control did not follow ${widest.id} to ${widest.n} level(s) (max=${wideMax}) — the stop count is not tracking the row`
    )
  }
}

// A row the CLI describes without the effort fields must fall back to the full
// scale, NOT to an empty control: "the CLI did not say" is not "unsupported".
if (cli.omitting.length > 0) {
  const omitMax = await stopsFor(cli.omitting[0])
  const omitPresent = await page.evaluate(() => !!document.querySelector('.effort-range'))
  log('OMITTINGROW', { id: cli.omitting[0], max: omitMax, control: omitPresent })
  if (!omitPresent || omitMax !== '5') {
    fails.push(
      `a row that states no effort fields produced ${omitPresent ? `max=${omitMax}` : 'no control'} — an absent field is being read as "unsupported" rather than "the CLI did not say"`
    )
  }
} else {
  log('NOTE', { scored: false, why: 'every CLI row states its effort fields; the omission fallback is unmeasurable on this install' })
}

if (cli.unsupported.length === 0) {
  log('NOTE', {
    scored: false,
    why: 'no CLI row on this install reports supportsEffort:false, so the visible degradation cannot be measured live; tests/effort-control.test.tsx covers it'
  })
}

// Back to the widest row so every level is reachable below.
await stopsFor(widest.id)

// ---- phase 4: pick a level with the KEYBOARD --------------------------------

await app.evaluate(({ BrowserWindow, app: a }) => {
  const w = BrowserWindow.getAllWindows()[0]
  w?.show()
  w?.focus()
  a.focus({ steal: true })
})
await page.waitForTimeout(400)

const before = cliInvocations(mainPid)
log('CLIPROCS', { before: before.cli, error: before.error ?? null })

// A real gesture on the native control, not a synthesised React event: End
// drives a range to its maximum stop, which is the top level the CLI offers —
// and it also proves the range is keyboard-operable at all, which no jsdom test
// can.
await page.locator('.effort-range').focus()
await page.keyboard.press('End')
await page.waitForTimeout(300)

const picked = await page.evaluate(async () => ({
  sliderValue: document.querySelector('.effort-range')?.value ?? null,
  readout: document.querySelector('.effort-value')?.textContent ?? null,
  // THE READ-BACK: what main is actually holding, over the real IPC.
  storedInMain: (await window.api.listModels()).effort ?? null
}))
log('PICKED', picked)

if (picked.readout === 'Default') {
  fails.push(
    'pressing End left the readout on Default — the keyboard cannot operate the control, so the pick never happened'
  )
  await shot('keyboard-dead')
  await finish()
}
if (picked.storedInMain !== picked.readout) {
  fails.push(
    `the control reads ${JSON.stringify(picked.readout)} but main is holding ${JSON.stringify(picked.storedInMain)} — the gesture did not reach the main-side store`
  )
}

// ---- phase 5: does it reach the CLI PROCESS? --------------------------------

// The list read above already rebuilt the engine that the pick discarded (#112),
// and the rebuild is where Options are CONSTRUCTED — which is the whole reason
// the pick has to discard in the first place.
await page.waitForTimeout(2500)
const after = cliInvocations(mainPid)
log('SDKSPAWN', { after: after.cli, error: after.error ?? null })

const beforePids = new Set(before.cli.map((c) => c.pid))
const fresh = after.cli.filter((c) => !beforePids.has(c.pid))
log('FRESHPROC', { fresh })

if (after.error) {
  fails.push(`could not read process command lines (${after.error}) — phase 5 UNSCORED, not refuted`)
} else if (fresh.length === 0) {
  // Non-vacuity: without a NEW process there is nothing the pick could have
  // reached, and comparing against the old one would read as agreement.
  fails.push(
    'no new CLI process was spawned after the pick — the engine did not rebuild, so this run cannot say whether the effort reaches the CLI; UNSCORED, not refuted'
  )
} else if (!fresh.some((c) => c.effort === picked.readout)) {
  fails.push(
    `the rebuilt engine spawned ${JSON.stringify(fresh)} — none carries --effort ${picked.readout}, so the pick is stored but never reaches the CLI, which is exactly the failure #124 exists to prevent`
  )
}

await shot('picked')

// ---- phase 6: the negative control — Default must reach it as ABSENCE -------

await page.locator('.effort-range').focus()
await page.keyboard.press('Home')
await page.waitForTimeout(300)

const cleared = await page.evaluate(async () => ({
  readout: document.querySelector('.effort-value')?.textContent ?? null,
  storedInMain: (await window.api.listModels()).effort ?? null
}))
log('CLEARED', cleared)
if (cleared.readout !== 'Default' || cleared.storedInMain !== null) {
  fails.push(
    `Home did not return the control to the CLI default (readout ${JSON.stringify(cleared.readout)}, main holding ${JSON.stringify(cleared.storedInMain)}) — the Default stop does not clear the pick`
  )
}

await page.waitForTimeout(2500)
const afterClear = cliInvocations(mainPid)
const freshPids = new Set(fresh.map((c) => c.pid))
const clearedFresh = afterClear.cli.filter((c) => !freshPids.has(c.pid) && !beforePids.has(c.pid))
log('SDKDEFAULT', { clearedFresh })
if (clearedFresh.length === 0) {
  fails.push(
    'no new CLI process followed the return to Default — the absence of a pick cannot be scored on this run; UNSCORED'
  )
} else if (clearedFresh.some((c) => c.effort !== null)) {
  fails.push(
    `after returning to Default the CLI was still spawned with ${JSON.stringify(clearedFresh)} — the app is overriding the CLI's own default with a flag it should not be sending at all`
  )
}

// ---- phase 7: it is really painted, and really reachable --------------------

const geometry = await page.evaluate(() => {
  const el = document.querySelector('.effort-range')
  const cs = getComputedStyle(el)
  const box = el.getBoundingClientRect()
  return {
    display: cs.display,
    visibility: cs.visibility,
    opacity: cs.opacity,
    width: Math.round(box.width),
    height: Math.round(box.height)
  }
})
log('GEOMETRY', geometry)
if (geometry.width < 20 || geometry.height < 6) {
  fails.push(
    `the control measures ${geometry.width}×${geometry.height} dip — too small to hit, so the stylesheet is not reaching it`
  )
}
if (geometry.opacity === '0' || geometry.visibility === 'hidden' || geometry.display === 'none') {
  fails.push(
    `the control is not visible (display ${geometry.display}, visibility ${geometry.visibility}, opacity ${geometry.opacity})`
  )
}

// PIXELS, not computed style. `getComputedStyle(el, '::-webkit-slider-runnable-track')`
// does NOT read that pseudo-element in Chromium — it hands back the element's
// own style, whose background is `transparent` by design, and an earlier version
// of this driver scored that as "the track paints nothing". It was a false RED
// off a bogus instrument, which is the #122 lesson in this ticket's shape. The
// element's own screenshot contains only the track and the thumb (no text), so
// counting distinct colours in it measures the paint directly.
// ZOOM FIRST. `locator.screenshot()` clips in window DIP while the rect it is
// given is the ZOOMED page's CSS pixels, so at any zoom but 1 the crop lands up
// and left of the element and returns a flat patch of the app wash — which the
// first run of this phase duly scored as "nothing paints". Normalise, and say
// what it was.
const zoom = await app.evaluate(({ BrowserWindow }) => {
  const w = BrowserWindow.getAllWindows()[0]
  const before = w.webContents.getZoomFactor()
  w.webContents.setZoomFactor(1)
  return { before, after: w.webContents.getZoomFactor() }
})
log('ZOOM', zoom)
await page.waitForTimeout(300)

const sample = async (selector) => {
  const png = await page.locator(selector).screenshot()
  return page.evaluate(async (data) => {
    const img = new Image()
    img.src = 'data:image/png;base64,' + data
    await img.decode()
    const c = document.createElement('canvas')
    c.width = img.width
    c.height = img.height
    const ctx = c.getContext('2d')
    ctx.drawImage(img, 0, 0)
    const d = ctx.getImageData(0, 0, c.width, c.height).data
    const at = (x, y) => {
      const i = (y * c.width + x) * 4
      return `${d[i]},${d[i + 1]},${d[i + 2]},${d[i + 3]}`
    }
    const distinct = new Set()
    for (let i = 0; i < d.length; i += 4) {
      distinct.add(`${d[i]},${d[i + 1]},${d[i + 2]},${d[i + 3]}`)
    }
    return {
      w: c.width,
      h: c.height,
      distinct: distinct.size,
      corner: at(0, 0),
      // The track rides the vertical middle; the corner is above it.
      midDiffers: at(Math.floor(c.width / 2), Math.floor(c.height / 2)) !== at(0, 0)
    }
  }, png.toString('base64'))
}

// POSITIVE CONTROL, and this phase is not scored without it. `.send-btn` carries
// an authored `--mint` fill, so a working instrument MUST see several colours in
// it. If it does not, the reading below is the instrument's, not the control's —
// which is exactly how the previous version of this phase produced a false RED.
const control = await sample('.send-btn')
const paint = await sample('.effort-range')
log('PAINTCTRL', control)
log('PAINT', paint)

if (control.distinct < 3) {
  fails.push(
    `the pixel instrument reads only ${control.distinct} colour(s) on .send-btn, which carries an authored mint fill — the instrument is broken, so the effort control's paint is UNSCORED on this run, not refuted`
  )
} else {
  if (paint.distinct < 3) {
    fails.push(
      `the control's own pixels hold only ${paint.distinct} distinct colour(s) while the instrument reads ${control.distinct} on a known-painted control — neither the track nor the thumb is painting, so the scale is invisible`
    )
  }
  if (!paint.midDiffers) {
    fails.push(
      `the middle of the control is the same colour as its corner (${paint.corner}) — there is no track line down the centre`
    )
  }
}

// Tab-reachability + the #93 hairline, under a REAL keyboard focus:
// `:focus-visible` does not paint for a programmatic .focus().
await page.evaluate(() => document.querySelector('.message-input')?.focus())
let hops = 0
let landed = null
for (; hops < 12; hops += 1) {
  await page.keyboard.press('Tab')
  landed = await page.evaluate(() => document.activeElement?.className ?? null)
  if (String(landed).includes('effort-range')) break
}
const ring = await page.evaluate(() => {
  const el = document.querySelector('.effort-range')
  if (document.activeElement !== el) return { focused: false }
  const cs = getComputedStyle(el)
  return {
    focused: true,
    matchesFocusVisible: el.matches(':focus-visible'),
    boxShadow: cs.boxShadow,
    outlineStyle: cs.outlineStyle
  }
})
log('TABSTOP', { hops: hops + 1, landed, ...ring })
if (!ring.focused) {
  fails.push(
    `the effort control is not reachable by Tab within 12 hops from the composer (landed on ${JSON.stringify(landed)}) — a keyboard user cannot set the effort at all`
  )
} else {
  if (ring.matchesFocusVisible === false) {
    fails.push(
      'the control took focus but does not match :focus-visible after a real Tab — the ring rule can never paint for a keyboard user'
    )
  }
  if (ring.boxShadow === 'none') {
    fails.push(
      `the focused control paints no ring (box-shadow ${ring.boxShadow}, outline ${ring.outlineStyle}) — #93's hairline is not reaching it`
    )
  }
}

await shot('focused')
await finish()
