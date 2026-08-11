// The DOM phase (#135) — launch every GUI driver that can run unattended, and
// treat its exit code as the verdict.
//
//   npm run test:dom                      the whole phase
//   npm run test:dom -- --only gui-91.mjs one driver (use this to prove a red is real)
//   npm run test:dom -- --list            what would run, and what is skipped and why
//
// Needs `npm run build` first (the drivers launch `out/`), plus
// `npm i --no-save playwright-core`.
//
// ── why this exists ───────────────────────────────────────────────────────
// #132 lifted the drivers' PURE assertions into `npm test` and left the rest
// reported as named skips: thirty-six contracts that only ran when a human
// remembered to run a driver by hand. During the `core-surfaces` gauntlet run
// one edit turned two driver assertions red and the three gate runs that
// followed all reported green, because nothing ran them.
//
// ── the one thing that made this cheap ────────────────────────────────────
// Every driver ALREADY ends in `process.exit(fails.length === 0 ? 0 : 1)`. The
// verdict protocol was there from the first driver; nothing had ever read it.
// So this file spawns and collects, and no driver needed rewriting to join.
//
// ── and the one thing that makes it honest ────────────────────────────────
// An exit code is only trustworthy if a driver cannot print FAIL and still exit
// 0. `gui-42.mjs` did exactly that — it computed its verdict, printed it, and
// ended on an unconditional `process.exit(0)`, so a harness reading exit codes
// would have called it green forever. That is caught here as LIED rather than
// trusted, because the next driver to do it will not announce itself either.

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { DOM_SKIP, DRIVER_DIR, domPhaseDrivers, listDrivers } from './drivers.manifest.mjs'

const APP_DIR = path.resolve(DRIVER_DIR, '../../..')
const SHOT_DIR = process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-dom-phase')

// ── #147: one profile per driver, and a witness that it held ──────────────
// Every driver used to launch against the machine's real `userData`. Window
// bounds and the per-origin zoom factor both outlive a process, so a driver that
// pinned either for a good reason handed it to every driver that ran after it —
// `gui-136` did exactly that and `gui-69` and `gui-70` failed in the batch for
// it, passing alone. Three phase runs went into attributing that, because the
// contaminating driver passes and only its neighbours red.
//
// The phase cannot simply add `--user-data-dir` itself: it spawns `node
// gui-<n>.mjs`, and the driver owns the Electron argv. An environment variable
// that moves `userData` with no argv change would have needed no driver to
// cooperate, and `scripts/spike-147-driver-profile-isolation.mjs` measured that
// no such variable exists on this platform — Chromium resolves `appData` through
// the shell's known-folder API and ignores `APPDATA`. So the phase hands each
// driver a DIRECTORY here, `driver-profile.mjs` turns it into the switch, and
// `tests/driver-profile.test.ts` reds a driver that does not spread it in.
//
// The directory itself is minted further down, past the `--list` and accounting
// exits: `--list` launches nothing, and a run that leaves an empty temp
// directory behind every time somebody asks what would run is litter.

// Where the app's real profile lives — Electron's documented default for an app
// whose `package.json` name is `claude-wrapper` and which sets no productName.
// Derived rather than asked, because asking costs an Electron launch to answer a
// question with a documented answer.
const SHARED_PROFILE =
  process.platform === 'win32'
    ? path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData/Roaming'), 'claude-wrapper')
    : process.platform === 'darwin'
      ? path.join(os.homedir(), 'Library/Application Support', 'claude-wrapper')
      : path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), 'claude-wrapper')

// The two halves of the profile that carry the state this ticket is about:
// `Preferences` holds the per-origin zoom factor, `Local Storage` holds the
// bounds the renderer reports back. Deliberately NOT the whole directory —
// caches and log files churn on their own and would accuse every driver.
//
// WHAT THIS CANNOT SEE, stated so the check is not overread: it detects that the
// shared profile was WRITTEN, not that a driver read it, and it covers bounds
// and zoom rather than sessions, storage or permissions state. It narrows
// attribution; it does not prove isolation.
const WATCHED = ['Preferences', 'Local Storage']

const fingerprint = (root) => {
  const parts = []
  const walk = (p, rel) => {
    let st
    try {
      st = fs.statSync(p)
    } catch {
      return
    }
    if (st.isDirectory()) {
      for (const e of fs.readdirSync(p).sort()) walk(path.join(p, e), `${rel}/${e}`)
    } else parts.push(`${rel}:${st.size}:${st.mtimeMs}`)
  }
  for (const w of WATCHED) walk(path.join(root, w), w)
  return parts.join('\n')
}

// Generous: the slowest driver still running here budgets 180s internally, and a
// driver that hangs past its own timeout is a failure worth seeing rather than
// one worth waiting out.
const TIMEOUT_MS = Number(process.env.DOM_PHASE_TIMEOUT_MS || 300000)

const argv = process.argv.slice(2)
const only = argv.includes('--only') ? argv[argv.indexOf('--only') + 1] : null

// ── accounting, before anything is launched ───────────────────────────────
// The regression this phase exists to prevent, applied to the phase itself: a
// driver that is neither launched nor explicitly skipped is exactly the silent
// omission #132 and #135 are both about. `npm test` asserts the same thing in
// milliseconds; this is the copy that runs where the launching happens.
const all = listDrivers()
const running = domPhaseDrivers()
const stale = [...DOM_SKIP.keys()].filter((d) => !all.includes(d))
if (stale.length) {
  console.error(`MANIFEST the skip list names ${stale.length} driver(s) that do not exist: ${stale.join(', ')}`)
  process.exit(1)
}
if (running.length + DOM_SKIP.size !== all.length) {
  console.error(`MANIFEST ${all.length} drivers, but ${running.length} would run and ${DOM_SKIP.size} are skipped`)
  process.exit(1)
}

if (argv.includes('--list')) {
  console.log(`=== DOM phase: ${running.length} run, ${DOM_SKIP.size} skipped, ${all.length} total ===`)
  for (const d of running) console.log(`  run   ${d}`)
  for (const [d, reason] of DOM_SKIP) console.log(`  SKIP  ${d} — ${reason}`)
  process.exit(0)
}

if (only && !all.includes(only)) {
  console.error(`--only ${only} is not a driver. One of: ${all.join(', ')}`)
  process.exit(1)
}

const queue = only ? [only] : running
if (!fs.existsSync(path.join(APP_DIR, 'out/main/index.js'))) {
  console.error('out/main/index.js is missing — run `npm run build` first')
  process.exit(1)
}
fs.mkdirSync(SHOT_DIR, { recursive: true })
// Past every exit that launches nothing — see the #147 block above.
const PROFILE_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'dom-phase-profiles-'))

// ── run ───────────────────────────────────────────────────────────────────
// Serial, deliberately. Several drivers pin window bounds, zoom factor or focus,
// and two Electron windows racing for the foreground would make those flaky in a
// way that looks like a real regression.
const runOne = (driver) =>
  new Promise((resolve) => {
    const started = Date.now()
    const stem = driver.replace(/\.mjs$/, '')
    const child = spawn(process.execPath, [path.join(DRIVER_DIR, driver)], {
      cwd: APP_DIR,
      env: {
        ...process.env,
        SCREENSHOT_DIR: path.join(SHOT_DIR, stem),
        DOM_DRIVER_PROFILE: path.join(PROFILE_ROOT, stem)
      },
      stdio: ['ignore', 'pipe', 'pipe']
    })

    let out = ''
    child.stdout.on('data', (d) => (out += d))
    child.stderr.on('data', (d) => (out += d))

    const killer = setTimeout(() => {
      child.kill('SIGKILL')
      out += `\n[dom-phase] killed after ${TIMEOUT_MS}ms`
    }, TIMEOUT_MS)

    child.on('close', (code) => {
      clearTimeout(killer)
      const lines = out.split(/\r?\n/)
      const failLine = lines.find((l) => /^FAIL\b/.test(l.trim()))
      // A driver that printed its own verdict and then exited 0 anyway. Trusting
      // the code here would bury the finding under a green.
      const lied = code === 0 && !!failLine
      const status = lied ? 'LIED' : code === 0 ? 'PASS' : code === 2 ? 'UNSCORED' : 'FAIL'
      resolve({ driver, status, code, ms: Date.now() - started, out, failLine })
    })
  })

console.log(`=== DOM phase: ${queue.length} driver(s), ${DOM_SKIP.size} skipped, timeout ${TIMEOUT_MS}ms ===`)
console.log(`screenshots: ${SHOT_DIR}`)
console.log(`profiles:    ${PROFILE_ROOT} (one per driver, removed on exit)\n`)

const results = []
const touched = []
for (const driver of queue) {
  process.stdout.write(`${driver} ... `)
  const beforeShared = fingerprint(SHARED_PROFILE)
  const r = await runOne(driver)
  if (fingerprint(SHARED_PROFILE) !== beforeShared) touched.push(driver)
  results.push(r)
  console.log(`${r.status} (exit ${r.code}, ${(r.ms / 1000).toFixed(1)}s)`)
  if (r.status !== 'PASS') {
    // The driver's own words, not a rephrasing: it already names the criterion
    // and the offending value, and a summary would lose exactly that.
    const tail = r.out.split(/\r?\n/).filter(Boolean).slice(-12)
    for (const l of tail) console.log(`    | ${l}`)
  }
}

// ── report ────────────────────────────────────────────────────────────────
const bad = results.filter((r) => r.status !== 'PASS')

console.log(`\n=== ${results.length - bad.length}/${results.length} passed ===`)
for (const r of bad) console.log(`  ${r.status.padEnd(8)} ${r.driver}${r.failLine ? ` — ${r.failLine.trim()}` : ''}`)
if (!only) {
  console.log(`\nnot launched (${DOM_SKIP.size}), each for a stated reason:`)
  for (const [d, reason] of DOM_SKIP) console.log(`  ${d} — ${reason}`)
}

// #147's attribution aid. Under per-driver isolation this list should be empty,
// so a name on it is the useful signal: that driver's launch escaped the profile
// it was handed, and it is the one to suspect when a LATER driver reds.
//
// REPORTED, NOT FAILED, and the reason is a fact rather than timidity: the
// human's own copy of the app writes to this same directory, so a phase run with
// the app open would red on someone else's keystroke. The isolation itself is
// asserted where it can be asserted honestly — `tests/driver-profile.test.ts`,
// in the fast gate, on every driver's source.
if (touched.length) {
  console.log(`\nWROTE TO THE SHARED PROFILE (${SHARED_PROFILE}):`)
  for (const d of touched) console.log(`  ${d} — its isolation did not hold; suspect it first if a later driver reds`)
  console.log('  (the app being open during the run writes here too, so confirm before accusing a driver)')
}

try {
  fs.rmSync(PROFILE_ROOT, { recursive: true, force: true })
} catch {
  console.log(`(left behind: ${PROFILE_ROOT})`)
}

console.log(
  `\n${bad.length === 0 ? 'DOM PHASE PASS' : `DOM PHASE FAIL: ${bad.map((r) => `${r.driver} (${r.status})`).join(', ')}`}`
)
process.exit(bad.length === 0 ? 0 : 1)
