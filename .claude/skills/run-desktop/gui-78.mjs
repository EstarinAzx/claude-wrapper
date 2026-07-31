// GUI driver for #78 — MEASURE the launch artifact.
//
// This driver's product is numbers. The ticket is the measurement; the fix it
// might have authorised is conditional on what these numbers say, because the
// ADR that specified the fix also said "Build it only if measured".
//
// WHAT THE ARTIFACT IS SUPPOSED TO BE. `createWindow` constructs the window with
// zoom 1.0, `backgroundMaterial: 'acrylic'` and no `data-theme`, and shows it on
// `ready-to-show`. Only then do three React mount effects settle it: `useZoom`
// pushes the stored level over IPC, `useBackdrop` pushes the stored material,
// `useTheme` writes `data-theme` on documentElement. Anything visible between
// the show and the last of those three is the artifact.
//
// HOW IT IS MEASURED. `gui-78-probe.cjs` is the Electron entry point: it
// installs its hooks and then requires the app's real built main, so it is in
// the process before the app's first line. It also registers a document-start
// session preload (`gui-78-renderer-probe.cjs`) that samples the DOM once per
// animation frame — rAF is the paint cadence, so a state it never observes is a
// state that was never on screen for a frame.
//
// **This driver deliberately does NOT use Playwright, unlike every other driver
// in this set**, and that is a finding rather than a preference: under
// `_electron.launch()` this window never emits `ready-to-show`, so `win.show()`
// never runs, the window is never visible and never paints —
// `performance.getEntriesByType('paint')` comes back empty. A harness that
// stops the window being shown cannot measure what the window shows. Same shape
// as gui-69 keeping the GPU on and gui-74 dropping `--no-sandbox`: the driver
// must establish the state it measures (#65) rather than inherit a launch line
// that erases it.
//
// PROFILE ISOLATION IS THE PREMISE, NOT A COURTESY. Chromium persists the zoom
// level per origin inside the userData directory, so a run against the real
// profile measures a window that already opens at the stored zoom — an inherited
// pass of exactly the kind #77 caught with `.session-groups`. Each launch here
// gets a fresh `userData` (set before `app.ready`), so phase 1 is a genuine
// first-ever launch and phase 2 a genuine second one. It also means the user's
// real localStorage is never touched and there is nothing to restore.
//
//   node .claude/skills/run-desktop/gui-78.mjs
//
// Needs `npm run build` first. No playwright-core.

import { spawn } from 'node:child_process'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'

const APP_DIR = path.resolve(import.meta.dirname, '../../..')
const PROBE = path.join(import.meta.dirname, 'gui-78-probe.cjs')
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), 'gui78-profile-'))
const DUMPS = fs.mkdtempSync(path.join(os.tmpdir(), 'gui78-dumps-'))

let cleaned = false
const cleanup = () => {
  if (cleaned) return
  cleaned = true
  for (const dir of [PROFILE, DUMPS]) {
    try {
      fs.rmSync(dir, { recursive: true, force: true })
    } catch {}
  }
}

setTimeout(() => {
  console.log('TIMEOUT')
  cleanup()
  process.exit(1)
}, 240000).unref?.()

const log = (label, m) => console.log(label.padEnd(14) + JSON.stringify(m))
const fails = []

const electronBin =
  process.platform === 'win32'
    ? path.join(APP_DIR, 'node_modules/electron/dist/electron.exe')
    : process.platform === 'darwin'
      ? path.join(APP_DIR, 'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron')
      : path.join(APP_DIR, 'node_modules/electron/dist/electron')

const HOLD_MS = 6000

// One measured launch of the real app.
//
// `--disable-gpu` IS LOAD-BEARING HERE, and it is the one concession this driver
// makes. Measured, not assumed: with GPU compositing on, in a headless /
// background session, this app's window NEVER PAINTS — no `first-paint` entry,
// no `ready-to-show`, so `win.show()` never runs and `isVisible()` is still
// false after 20 seconds. With `--disable-gpu` the same build paints and shows
// at ~300ms. That is an environment limit, not an app defect: a standalone
// BrowserWindow with this window's exact options and the same renderer file
// paints fine either way, and the app is used interactively every day.
//
// WHAT THAT COSTS. `--disable-gpu` flattens acrylic (the trap this repo already
// recorded), so nothing here judges how the two MATERIALS LOOK, and neither
// screenshots nor the eye are used for that. What survives the flag is
// everything this ticket actually asks for: when the window is shown, when each
// preference is applied, how many painted frames differ, and the layout and
// palette on either side of them — all of it layout and CSS rather than DWM
// compositing. Software compositing is also SLOWER than GPU, so every gap below
// is an upper bound; a real GPU launch settles at least this fast.
const measure = (name, seed) =>
  new Promise((resolve) => {
    const out = path.join(DUMPS, name + '.json')
    const child = spawn(electronBin, ['--disable-gpu', PROBE], {
      cwd: APP_DIR,
      env: {
        ...process.env,
        GUI78_OUT: out,
        GUI78_PROFILE: PROFILE,
        GUI78_HOLD_MS: String(HOLD_MS),
        ...(seed ? { GUI78_SEED: JSON.stringify(seed) } : {})
      },
      stdio: ['ignore', 'pipe', 'pipe']
    })
    let stderr = ''
    child.stderr.on('data', (b) => {
      stderr += String(b)
    })
    child.on('exit', () => {
      if (!fs.existsSync(out)) {
        resolve({ error: 'no dump written', stderr: stderr.slice(-800) })
        return
      }
      resolve(JSON.parse(fs.readFileSync(out, 'utf8')))
    })
  })

const rel = (timeline, name) => timeline.find((m) => m.name === name) ?? null

// When the window became visible: the `show` event first, the 4ms poll as the
// backstop that cannot be missed.
const visibleAt = (timeline) => rel(timeline, 'window-shown') ?? rel(timeline, 'visible-by-poll')

// Every mark folded to an offset from the moment the window went on screen,
// because that is the instant the user's eyes are first involved. Negative =
// settled before anyone could see it. Positive = the user saw it happen.
const foldTimeline = (timeline, anchor) =>
  timeline.map((m) => ({
    name: m.name,
    ms: m.t - anchor.t,
    ...(m.zoomFactor !== undefined ? { zoom: m.zoomFactor } : {}),
    ...(m.level !== undefined ? { level: m.level } : {}),
    ...(m.material !== undefined ? { material: m.material } : {})
  }))

const foldFrames = (frames, anchor) =>
  frames.map((f) => ({
    ms: f.t - anchor.t,
    why: f.why,
    ...(f.vw !== undefined ? { vw: f.vw, dpr: f.dpr } : {}),
    ...(f.theme !== undefined ? { theme: f.theme } : {}),
    ...(f.bg !== undefined ? { bg: f.bg } : {}),
    ...(f.rootKids !== undefined ? { rootKids: f.rootKids } : {}),
    ...(f.titlebar !== undefined ? { titlebar: f.titlebar } : {}),
    ...(f.error !== undefined ? { error: f.error } : {})
  }))

const finish = () => {
  console.log('')
  console.log(fails.length === 0 ? 'PASS' : 'FAIL')
  for (const f of fails) console.log('  - ' + f)
  console.log(
    'NOTE          this driver REPORTS the artifact. Whether it is objectionable is a judgement recorded on the ticket with these numbers beside it, not an assertion here.'
  )
  cleanup()
  process.exit(fails.length === 0 ? 0 : 1)
}

// A phase's whole report, plus the premise checks that say whether it measured
// anything at all.
const report = (tag, dump) => {
  if (dump.error) {
    fails.push(`${tag}: ${dump.error} ${dump.stderr ?? ''}`)
    return null
  }
  const shown = visibleAt(dump.timeline)
  if (!shown) {
    log(tag + '-TIMELINE', dump.timeline.map((m) => m.name))
    fails.push(
      `${tag}: the window never became visible — neither the \`show\` event nor a 4ms visibility poll saw it, so nothing below is a measurement of what a user sees`
    )
    return null
  }

  const frames = foldFrames(dump.frames ?? [], shown)
  log(tag + '-TIMELINE', foldTimeline(dump.timeline, shown))
  log(tag + '-SETTLED', dump.settled)
  for (const f of frames) log(tag + '-FRAME', f)

  if (frames.length === 0) {
    fails.push(
      `${tag}: the document-start sampler produced no frames — the session preload never ran, so every frame-level claim is unmeasured`
    )
    return null
  }

  // A "visible reflow" is a sampled frame that (a) differs from the one before
  // it and (b) happened at or after the window went on screen. rAF is the paint
  // cadence, so a change the sampler never saw was never a frame the user saw.
  const changes = frames.filter((f) => f.why === 'frame-changed' || f.why === 'data-theme-mutation')
  const visibleChanges = changes.filter((f) => f.ms >= 0)
  const created = rel(dump.timeline, 'window-created')
  const domReady = rel(dump.timeline, 'dom-ready')
  const zoomPush = rel(dump.timeline, 'renderer-pushed-zoom')
  const bdPush = rel(dump.timeline, 'renderer-pushed-backdrop')

  const painted = frames.filter((f) => f.vw != null)
  const firstPainted = painted[0] ?? null
  const lastPainted = painted[painted.length - 1] ?? null
  // The first frame with the app's UI actually in it. `rootKids` goes 0 → 1 when
  // React commits; before that the window is showing an empty document.
  const firstUi = frames.find((f) => f.rootKids >= 1) ?? null
  // A layout reflow is a change in the viewport's CSS width or in the device
  // pixel ratio — the two things a zoom change moves. Counted only from frames
  // at or after the window went on screen.
  const zoomReflowsSeen = painted.filter(
    (f, i) => i > 0 && f.ms >= 0 && (f.vw !== painted[i - 1].vw || f.dpr !== painted[i - 1].dpr)
  )
  const themeAfterShown = frames.filter((f) => f.why === 'data-theme-mutation' && f.ms >= 0)

  const summary = {
    // Construction vs first PAINT is the distinction that matters. Chromium
    // restores a persisted per-origin zoom when the document commits, not when
    // the window is constructed, so the constructed value alone would say the
    // reflow happens on every launch when it does not.
    zoomAtWindowCreation: created?.zoomFactor ?? null,
    zoomAtDomReady: domReady?.zoomFactor ?? null,
    dprAtFirstPaintedFrame: firstPainted?.dpr ?? null,
    zoomPushedByRenderer: zoomPush?.level ?? null,
    viewportFirstPainted: firstPainted?.vw ?? null,
    viewportSettled: lastPainted?.vw ?? null,
    zoomReflowsAfterWindowVisible: zoomReflowsSeen.length,
    themeChangesAfterWindowVisible: themeAfterShown.length,
    backdropAtConstruction: 'acrylic',
    backdropPushedByRenderer: bdPush?.material ?? null,
    backdropChangesMaterial: bdPush ? bdPush.material !== 'acrylic' : null,
    msShownToFirstUiFrame: firstUi ? firstUi.ms : null,
    msShownToZoomApplied: zoomPush ? zoomPush.t - shown.t : null,
    msShownToBackdropApplied: bdPush ? bdPush.t - shown.t : null,
    msShownToLastVisibleChange: visibleChanges.length
      ? visibleChanges[visibleChanges.length - 1].ms
      : null,
    changesAfterWindowWasVisible: visibleChanges.length,
    changesBeforeWindowWasVisible: changes.length - visibleChanges.length
  }
  log(tag + '-ARTIFACT', summary)
  return { shown, frames, summary, dump }
}

// ---- phase 1: a genuine FIRST-EVER launch -----------------------------------
// Empty localStorage, empty zoom map. This is the case the ADR calls universal:
// "every launch paints at 1.0 and reflows to the stored level, for every user".
// The seed at the end is what makes phase 2 a returning user whose stored theme
// and material both differ from the constructed defaults.

console.log('PHASE 1       first-ever launch — pristine profile, nothing stored')
const p1 = report('P1', await measure('phase1', { theme: 'ember', backdrop: 'mica' }))
// Checked on the FIRST PAINTED FRAME, not on `zoomAtWindowCreation`. The
// construction-time value reads 1.0 on a warm profile too — Chromium restores
// the persisted zoom when the document commits, not when the window is built —
// so a check on it can never fail and would be a vacuous guard on the one
// premise this whole phase rests on. The first painted frame's dpr does
// discriminate: 1 pristine, 1.25 warm.
if (p1 && p1.summary.dprAtFirstPaintedFrame !== 1) {
  fails.push(
    `the pristine profile painted its first frame at dpr ${p1.summary.dprAtFirstPaintedFrame}, not the constructed default 1.0 — the userData isolation did not take and every number here is inherited`
  )
}

// ---- phase 2: the SECOND launch, theme and material both non-default --------

console.log('')
console.log('PHASE 2       returning user — same profile, theme=ember, backdrop=mica')
const p2 = report('P2', await measure('phase2'))
if (p2 && p2.dump.settled?.theme !== 'ember') {
  fails.push(
    `phase 2 settled on theme ${JSON.stringify(p2.dump.settled?.theme)} rather than the seeded ember — the returning-user premise did not hold, so its numbers describe a different app than intended`
  )
}

// ---- the comparison the ADR's ranking turns on ------------------------------

if (p1 && p2) {
  console.log('')
  log('VERDICT-DATA', {
    firstLaunch: {
      viewport: `${p1.summary.viewportFirstPainted} → ${p1.summary.viewportSettled}`,
      dprAtFirstPaint: p1.summary.dprAtFirstPaintedFrame,
      zoomReflowsSeen: p1.summary.zoomReflowsAfterWindowVisible,
      themeChangesSeen: p1.summary.themeChangesAfterWindowVisible,
      msShownToFirstUiFrame: p1.summary.msShownToFirstUiFrame,
      msShownToLastVisibleChange: p1.summary.msShownToLastVisibleChange
    },
    secondLaunch: {
      viewport: `${p2.summary.viewportFirstPainted} → ${p2.summary.viewportSettled}`,
      dprAtFirstPaint: p2.summary.dprAtFirstPaintedFrame,
      zoomReflowsSeen: p2.summary.zoomReflowsAfterWindowVisible,
      themeChangesSeen: p2.summary.themeChangesAfterWindowVisible,
      backdrop: `acrylic → ${p2.summary.backdropPushedByRenderer}`,
      msShownToFirstUiFrame: p2.summary.msShownToFirstUiFrame,
      msShownToLastVisibleChange: p2.summary.msShownToLastVisibleChange
    }
  })
  // The ADR ranks the zoom reflow above the material flash on the ground that
  // zoom is universal — "every launch ... for every user". If the second launch
  // shows no zoom reflow, that ranking is measured false and the ticket's own
  // framing has to move with it.
  if (
    p1.summary.zoomReflowsAfterWindowVisible > 0 &&
    p2.summary.zoomReflowsAfterWindowVisible === 0
  ) {
    log('FINDING', {
      claim: 'the zoom reflow is universal — every launch, every user',
      verdict: 'FALSE after the first launch',
      why: 'Chromium persists the per-origin zoom in userData and reapplies it when the document commits, so a second launch paints its first frame already at the stored level'
    })
  }
}

finish()
