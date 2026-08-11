// Spike for #147 — what can actually isolate a driver's Electron profile, and
// what a phase-level default would do to the drivers that already isolate
// themselves.
//
//   node scripts/spike-147-driver-profile-isolation.mjs
//
// Needs `npm i --no-save playwright-core`? No — this launches the Electron
// binary directly with a throwaway probe, the way `gui-79.mjs` does. It does
// NOT need `npm run build`: the probe replaces the app entirely, because every
// question here is about where Electron puts `userData`, not about what the app
// renders.
//
// ── why a spike rather than just writing the fix ──────────────────────────
// #147's triage says the phase should pass "a private `--user-data-dir` per
// driver by default". The phase does not launch Electron — it spawns
// `node gui-<n>.mjs`, and each of the 37 inline drivers builds its own
// `electron.launch({ args })`. So the phase has no argv to add a switch to.
// Whether isolation can be a property of the SPAWN (an env var the phase sets,
// inherited by whatever the driver launches) or has to be a property of every
// DRIVER (37 edits) is the entire design decision, and it is a measurable fact
// about Electron on this platform rather than a matter of taste.
//
// The four gaps, and D is the control the other three are gated on:
//
//   A  `--user-data-dir=<dir>` moves `app.getPath('userData')`.
//      The mechanism `gui-136.mjs` already relies on. If this is NO, the
//      existing isolation in the tree is a placebo and that is the finding.
//   B  An env-only redirect moves it, with no argv change at all.
//      This is the zero-driver-edit route. `APPDATA` is the candidate on win32
//      because Electron's `appData` is the parent of the default `userData`.
//   C  A probe's own `app.setPath('userData', X)` still wins when the phase has
//      ALSO passed `--user-data-dir`. Load-bearing: `gui-78`, `gui-79` and
//      `gui-110` each set their own profile before `ready`, and a phase default
//      that silently overrode them would break the three drivers whose whole
//      subject is what a profile carries between launches.
//   D  POSITIVE CONTROL. With no isolation of any kind, launch 2 reads a marker
//      launch 1 wrote. If two bare launches do NOT share a directory, there is
//      no cross-driver channel to close and A/B/C measure nothing — so A, B and
//      C are only scored when D scores.

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const APP_DIR = path.resolve(import.meta.dirname, '..')
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), 'spike147-'))
const PROBE = path.join(WORK, 'probe.cjs')
const OUT_JSON = path.join(APP_DIR, 'scripts/spike-147-findings.json')

const electronBin =
  process.platform === 'win32'
    ? path.join(APP_DIR, 'node_modules/electron/dist/electron.exe')
    : process.platform === 'darwin'
      ? path.join(APP_DIR, 'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron')
      : path.join(APP_DIR, 'node_modules/electron/dist/electron')

if (!fs.existsSync(electronBin)) {
  console.log(`UNSCORED  no electron binary at ${electronBin} — run \`npm i\` first`)
  process.exit(2)
}

// The probe never opens a window. Every question here is answered before the
// first frame, so showing one would only add GPU flakiness to a measurement
// that does not need pixels.
fs.writeFileSync(
  PROBE,
  `'use strict'
const fs = require('node:fs')
const path = require('node:path')
const { app } = require('electron')

const OUT = process.env.SPIKE147_OUT
const SETPATH = process.env.SPIKE147_SETPATH
const MARK = process.env.SPIKE147_MARK

// Before ready — the only time this is allowed, and exactly what gui-78,
// gui-79 and gui-110 do in their own probes.
if (SETPATH) app.setPath('userData', SETPATH)

app.whenReady().then(() => {
  const userData = app.getPath('userData')
  const appData = app.getPath('appData')
  fs.mkdirSync(userData, { recursive: true })
  const marker = path.join(userData, 'spike147-marker.txt')
  let seen = null
  try { seen = fs.readFileSync(marker, 'utf8') } catch {}
  if (MARK) fs.writeFileSync(marker, MARK)
  fs.writeFileSync(OUT, JSON.stringify({ userData, appData, seen }))
  app.quit()
})
`
)

let n = 0
const run = ({ args = [], env = {}, mark = null, setPath = null } = {}) =>
  new Promise((resolve) => {
    const out = path.join(WORK, `dump-${++n}.json`)
    const child = spawn(electronBin, ['--no-sandbox', '--disable-gpu', ...args, PROBE], {
      cwd: APP_DIR,
      env: {
        ...process.env,
        ...env,
        SPIKE147_OUT: out,
        ...(mark ? { SPIKE147_MARK: mark } : {}),
        ...(setPath ? { SPIKE147_SETPATH: setPath } : {})
      },
      stdio: ['ignore', 'pipe', 'pipe']
    })
    let stderr = ''
    child.stderr.on('data', (b) => (stderr += String(b)))
    const killer = setTimeout(() => child.kill('SIGKILL'), 60000)
    child.on('exit', () => {
      clearTimeout(killer)
      if (!fs.existsSync(out)) {
        resolve({ error: 'no dump written', stderr: stderr.slice(-600) })
        return
      }
      resolve(JSON.parse(fs.readFileSync(out, 'utf8')))
    })
  })

const under = (child, parent) => {
  if (!child || !parent) return false
  const rel = path.relative(path.resolve(parent), path.resolve(child))
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel))
}

const findings = {}
const say = (gap, verdict, why, data) => {
  findings[gap] = { verdict, why, ...(data || {}) }
  console.log(`${gap.padEnd(4)} ${String(verdict).padEnd(9)} ${why}`)
}

// ── D, first, because A/B/C are gated on it ───────────────────────────────
console.log('=== D  positive control: two bare launches share a profile ===')
const d1 = await run({ mark: 'from-launch-1' })
const d2 = await run()
if (d1.error || d2.error) {
  say('D', 'UNSCORED', `a bare launch did not report: ${d1.error ?? d2.error}`, { d1, d2 })
} else {
  const shared = d1.userData === d2.userData && d2.seen === 'from-launch-1'
  say('D', shared ? 'YES' : 'NO', shared ? `both launches used ${d1.userData} and launch 2 read launch 1's marker` : `launch 1 ${d1.userData} / launch 2 ${d2.userData}, launch 2 saw ${JSON.stringify(d2.seen)}`, {
    userData: d1.userData,
    appData: d1.appData,
    seenByLaunch2: d2.seen
  })
}

const gated = findings.D.verdict === 'YES'
const skip = (gap) => say(gap, 'UNSCORED', 'control D did not score — with no shared channel there is nothing to isolate')

// ── A  the --user-data-dir switch ─────────────────────────────────────────
console.log('\n=== A  --user-data-dir moves userData ===')
if (!gated) skip('A')
else {
  const dir = fs.mkdtempSync(path.join(WORK, 'argv-'))
  const a = await run({ args: [`--user-data-dir=${dir}`] })
  if (a.error) say('A', 'UNSCORED', `probe did not report: ${a.error}`, a)
  else {
    const ok = under(a.userData, dir)
    say('A', ok ? 'YES' : 'NO', `asked for ${dir}, got ${a.userData}`, { asked: dir, got: a.userData })
  }
}

// ── B  env only, no argv change ───────────────────────────────────────────
console.log('\n=== B  an env-only redirect moves userData (the zero-edit route) ===')
if (!gated) skip('B')
else {
  const dir = fs.mkdtempSync(path.join(WORK, 'env-'))
  const key = process.platform === 'win32' ? 'APPDATA' : process.platform === 'darwin' ? 'HOME' : 'XDG_CONFIG_HOME'
  const b = await run({ env: { [key]: dir } })
  if (b.error) say('B', 'UNSCORED', `probe did not report: ${b.error}`, b)
  else {
    const ok = under(b.userData, dir)
    say('B', ok ? 'YES' : 'NO', `set ${key}=${dir}, appData resolved to ${b.appData}, userData to ${b.userData}`, {
      envKey: key,
      asked: dir,
      appData: b.appData,
      got: b.userData
    })
  }
}

// ── C  a driver's own setPath still wins ──────────────────────────────────
console.log("\n=== C  a probe's setPath('userData') beats the phase's --user-data-dir ===")
if (!gated) skip('C')
else {
  const phaseDir = fs.mkdtempSync(path.join(WORK, 'phase-'))
  const ownDir = fs.mkdtempSync(path.join(WORK, 'own-'))
  const c = await run({ args: [`--user-data-dir=${phaseDir}`], setPath: ownDir })
  if (c.error) say('C', 'UNSCORED', `probe did not report: ${c.error}`, c)
  else {
    const ok = under(c.userData, ownDir)
    say('C', ok ? 'YES' : 'NO', `phase asked ${phaseDir}, probe asked ${ownDir}, got ${c.userData}`, {
      phaseAsked: phaseDir,
      probeAsked: ownDir,
      got: c.userData
    })
  }
}

fs.writeFileSync(OUT_JSON, JSON.stringify({ platform: process.platform, electron: electronBin, findings }, null, 2))
console.log(`\nwritten: ${OUT_JSON}`)
try {
  fs.rmSync(WORK, { recursive: true, force: true })
} catch {}
