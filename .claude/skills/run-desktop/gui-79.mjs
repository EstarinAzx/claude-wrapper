// GUI driver for #79 — the window remembers its size and position.
//
// Two products, and they are different kinds of claim:
//
//   AN ASSERTION. The window really comes back where it was, across a real
//   process relaunch. Reading `localStorage` back would prove only that the
//   renderer wrote a string; the claim is about the WINDOW, so the assertion is
//   on `getBounds()` after a genuine second launch.
//
//   A MEASUREMENT. Whether showing the window before the bounds arrive is
//   objectionable — the question [[2026-07-31-a-preference-lives-where-it-is-read]]
//   left open, and which #78 answered only for zoom/backdrop/theme. Bounds are
//   a different class of artifact (a window-manager move and resize on an
//   already-visible window, not a CSS reflow inside one), so they get their own
//   numbers rather than inheriting #78's decline.
//
// Phase 3 measures the SAME BUILD with the gate defeated, by having the probe
// show the window on `ready-to-show` the way the app used to. That is what
// makes this an A/B rather than a before-and-after against a build that no
// longer exists.
//
//   node .claude/skills/run-desktop/gui-79.mjs
//
// Needs `npm run build` first. No playwright-core — see the probe's header.

import { spawn } from 'node:child_process'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'

const APP_DIR = path.resolve(import.meta.dirname, '../../..')
const PROBE = path.join(import.meta.dirname, 'gui-79-probe.cjs')
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), 'gui79-profile-'))
const DUMPS = fs.mkdtempSync(path.join(os.tmpdir(), 'gui79-dumps-'))

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

const log = (label, m) => console.log(label.padEnd(16) + JSON.stringify(m))
const fails = []

const electronBin =
  process.platform === 'win32'
    ? path.join(APP_DIR, 'node_modules/electron/dist/electron.exe')
    : process.platform === 'darwin'
      ? path.join(APP_DIR, 'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron')
      : path.join(APP_DIR, 'node_modules/electron/dist/electron')

const HOLD_MS = 6000

// `--disable-gpu` is load-bearing here for the reason #78 measured and
// recorded: in a background session this app's window never paints with GPU
// compositing on, so it is never shown and there is nothing to measure. It
// flattens acrylic, which costs this driver nothing — every claim below is
// about window geometry and visibility, neither of which is composited.
const measure = (name, { seed = false, forceShow = false } = {}) =>
  new Promise((resolve) => {
    const out = path.join(DUMPS, name + '.json')
    const child = spawn(electronBin, ['--disable-gpu', PROBE], {
      cwd: APP_DIR,
      env: {
        ...process.env,
        GUI79_OUT: out,
        GUI79_PROFILE: PROFILE,
        GUI79_HOLD_MS: String(HOLD_MS),
        ...(seed ? { GUI79_SEED_BOUNDS: '1' } : {}),
        ...(forceShow ? { GUI79_FORCE_SHOW: '1' } : {})
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

const at = (timeline, name) => timeline.find((m) => m.name === name) ?? null
const rectOf = (b) => (b ? [b.x, b.y, b.width, b.height] : null)
const same = (a, b) => a && b && a.every((n, i) => n === b[i])

// The artifact, in one number: how long the window was ON SCREEN showing bounds
// that are not the ones it ended up at. Zero means the user never saw the move.
const msVisibleAtWrongBounds = (samples, target) => {
  const visible = samples.filter((s) => s.visible)
  if (visible.length === 0) return null
  let ms = 0
  for (let i = 0; i < visible.length; i++) {
    if (same(visible[i].bounds, target)) break
    const next = visible[i + 1]
    if (!next) break
    ms += next.t - visible[i].t
  }
  return ms
}

const firstVisible = (samples) => samples.find((s) => s.visible) ?? null

const report = (tag, dump, target) => {
  if (dump.error) {
    fails.push(`${tag}: ${dump.error} ${dump.stderr ?? ''}`)
    return null
  }
  const shown = firstVisible(dump.samples)
  if (!shown) {
    log(tag + '-TIMELINE', dump.timeline.map((m) => m.name))
    fails.push(
      `${tag}: the window was never visible in any 4ms sample, so nothing here is a measurement of what a user sees`
    )
    return null
  }

  const created = at(dump.timeline, 'window-created')
  const pushed = at(dump.timeline, 'renderer-pushed-bounds')
  const summary = {
    boundsAtConstruction: rectOf(created?.bounds),
    boundsWhenFirstVisible: shown.bounds,
    boundsSettled: rectOf(dump.finalBounds),
    rendererPushed: pushed ? pushed.bounds : null,
    msCreatedToVisible: shown.t - (created?.t ?? shown.t),
    msCreatedToPush: pushed && created ? pushed.t - created.t : null,
    msVisibleAtWrongBounds: target ? msVisibleAtWrongBounds(dump.samples, target) : null,
    // BOTH samples must be visible. Comparing a visible sample against the
    // hidden one before it counts the window being shown already-correct as a
    // "change on screen", which is the opposite of what happened — the
    // instrument would then report the gate's success as the artifact.
    boundsChangesWhileVisible: dump.samples.filter(
      (s, i) =>
        i > 0 &&
        s.visible &&
        dump.samples[i - 1].visible &&
        !same(s.bounds, dump.samples[i - 1].bounds)
    ).length
  }
  log(tag + '-ARTIFACT', summary)
  return { summary, dump }
}

// ---- phase 1: a genuine FIRST-EVER launch -----------------------------------
// Nothing stored. The window must open at the constructed default, and the
// renderer must still push (`null`) — that push is what releases the show gate,
// so a first launch that skipped it would hang on the timeout.

console.log('PHASE 1         first-ever launch — pristine profile, nothing stored')
const p1 = report('P1', await measure('phase1', { seed: true }), null)
const SEEDED = p1?.dump.seeded ?? null

if (p1) {
  if (!same(p1.summary.boundsAtConstruction.slice(2), [1100, 780])) {
    fails.push(
      `the pristine profile constructed the window at ${JSON.stringify(
        p1.summary.boundsAtConstruction
      )}, not the hardcoded 1100x780 — the userData isolation did not take, so every number here is inherited from the real profile`
    )
  }
  // The push itself, not its payload: this is the message the gate waits on.
  if (at(p1.dump.timeline, 'renderer-pushed-bounds') === null) {
    fails.push(
      'a first-ever launch never pushed bounds at all — main can only have shown the window via the gate timeout, which is a 1.5s blank wait on every new install'
    )
  } else if (p1.summary.rendererPushed !== null) {
    fails.push(
      `a first-ever launch pushed ${JSON.stringify(
        p1.summary.rendererPushed
      )} rather than null — something was already stored, so this was not a first launch`
    )
  }
  if (p1.summary.msCreatedToVisible > 1400) {
    fails.push(
      `the window took ${p1.summary.msCreatedToVisible}ms to appear on a first launch, which is the gate's 1500ms timeout rather than the renderer's push — the gate is not being released`
    )
  }
}

if (!SEEDED) {
  fails.push('phase 1 seeded no bounds, so the relaunch phases have no target to restore')
  console.log('')
  console.log('FAIL')
  for (const f of fails) console.log('  - ' + f)
  cleanup()
  process.exit(1)
}
const TARGET = rectOf(SEEDED)
log('SEEDED', SEEDED)

// ---- phase 2: THE ASSERTION — a real relaunch restores the bounds -----------

console.log('')
console.log('PHASE 2         relaunch with bounds stored — the shipped gated path')
const p2 = report('P2', await measure('phase2'), TARGET)

if (p2) {
  // The ticket's claim, stated about the window rather than about storage.
  if (!same(p2.summary.boundsSettled, TARGET)) {
    fails.push(
      `the window did not come back where it was: settled at ${JSON.stringify(
        p2.summary.boundsSettled
      )}, stored ${JSON.stringify(TARGET)}`
    )
  }
  // The gate's whole purpose: the window is never on screen at the wrong place.
  if (p2.summary.msVisibleAtWrongBounds !== 0) {
    fails.push(
      `the window was visible at the wrong bounds for ${p2.summary.msVisibleAtWrongBounds}ms despite the show gate — the gate is not doing the one thing it exists for`
    )
  }
}

// ---- phase 3: the same build with the gate DEFEATED -------------------------
// This is what the window does without the gate, measured rather than argued.

console.log('')
console.log('PHASE 3         same build, gate defeated (probe shows on ready-to-show)')
const p3 = report('P3', await measure('phase3', { forceShow: true }), TARGET)

if (p3 && !same(p3.summary.boundsSettled, TARGET)) {
  fails.push(
    `the ungated launch settled at ${JSON.stringify(
      p3.summary.boundsSettled
    )} rather than ${JSON.stringify(TARGET)} — the restore itself is broken, independent of the gate`
  )
}

// ---- the comparison the gate decision turns on ------------------------------

if (p2 && p3) {
  console.log('')
  log('VERDICT-DATA', {
    gated: {
      msVisibleAtWrongBounds: p2.summary.msVisibleAtWrongBounds,
      boundsChangesWhileVisible: p2.summary.boundsChangesWhileVisible,
      msCreatedToVisible: p2.summary.msCreatedToVisible
    },
    ungated: {
      msVisibleAtWrongBounds: p3.summary.msVisibleAtWrongBounds,
      boundsChangesWhileVisible: p3.summary.boundsChangesWhileVisible,
      msCreatedToVisible: p3.summary.msCreatedToVisible
    },
    costOfGateMs: p2.summary.msCreatedToVisible - p3.summary.msCreatedToVisible
  })
}

console.log('')
console.log(fails.length === 0 ? 'PASS' : 'FAIL')
for (const f of fails) console.log('  - ' + f)
console.log(
  'NOTE            phases 1-2 ASSERT (restore across a real relaunch, and that the gate holds). Phase 3 REPORTS what the same build does without the gate; that number is the warrant for keeping it, recorded on the ticket.'
)
cleanup()
process.exit(fails.length === 0 ? 0 : 1)
