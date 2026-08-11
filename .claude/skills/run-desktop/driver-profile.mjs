// #147 — where a driver's Electron profile lives, decided in one place.
//
// THE DEFECT THIS CLOSES. Every driver used to launch against the SAME
// `userData` directory: on this machine `%APPDATA%\claude-wrapper`, the very
// profile the human's own app uses. Some of the state a driver needs to control
// outlives its process — window bounds are remembered across launches (#79) and
// flushed on close (#110), and the zoom factor is persisted per origin in
// `userData` as well as mirrored in the renderer's localStorage under
// `zoom-level-v2`. `gui-136` pinned both for a good reason, wrote them into the
// shared profile, and `gui-69` and `gui-70` then failed in the batch waiting for
// a composer that was off-screen. Both passed alone. Three full phase runs went
// into attributing that.
//
// The hazard is worth a mechanism rather than vigilance because it is SILENT AT
// THE SOURCE: the contaminating driver passes, only its neighbours red, and only
// in a batch. It also looks exactly like `desktop-exclusive`, which is the
// easiest category in this repo to bury a real red in — two drivers were one
// shrug away from being quarantined for someone else's bug.
//
// ── why the phase cannot just pass a switch ───────────────────────────────
// #147's triage says `dom-phase.mjs` should pass "a private `--user-data-dir`
// per driver by default". The phase does not launch Electron. It spawns
// `node gui-<n>.mjs`, and each driver builds its own `electron.launch({ args })`,
// so there is no argv for the phase to add a switch to.
//
// The obvious way out would be an environment variable that moves `userData`
// without any argv change, which would need no driver to know this file exists.
// MEASURED, and it does not exist:
// `scripts/spike-147-driver-profile-isolation.mjs` sets `APPDATA` to a temporary
// directory and Electron still resolves `appData` to `C:\Users\<u>\AppData\Roaming`
// — Chromium reads the shell's known-folder API, not the variable. So isolation
// HAS to appear in each driver's own argv, and this module is the one line each
// driver spreads in to get it.
//
// ── what the same spike settled about the drivers that own a profile ──────
// `gui-78`, `gui-79` and `gui-110` each call `app.setPath('userData', …)` inside
// their probe, before `ready`. Their subject IS what a profile carries between
// launches, so the triage expected them to need an opt-out — a shared-but-
// dedicated profile, kept off the default isolation.
//
// They need no opt-out at all, for two measured reasons:
//
//   1. They already mint their own `mkdtemp` profile per run. None of the three
//      ever read the machine's real profile, so there was never anything to
//      exempt them from.
//   2. `app.setPath('userData', X)` BEATS a `--user-data-dir` switch (gap C in
//      the spike: the phase asked for one directory, the probe asked for
//      another, and `getPath('userData')` returned the probe's).
//
// That matters beyond saving three lines. Cross-model review of the triage
// objected that "the opt-outs preserve shared mutable state, so the default
// isolation does not eliminate the original cross-driver channel" — correct, and
// fatal to any design with an opt-out list. With no opt-outs the channel is
// closed for every driver rather than bounded to a named pair, and there is no
// second `DOM_SKIP` for a future driver to be quietly added to.
//
// ── the one property this file must have ──────────────────────────────────
// THE DIRECTORY IS PER DRIVER PROCESS, NOT PER LAUNCH. `gui-69`, `gui-70` and
// `gui-110` each launch Electron three times in one run, and their claims are
// about what launch N+1 inherits from launch N. Minting a fresh directory per
// call would isolate those drivers from THEMSELVES and turn every persistence
// assertion into a vacuous first-launch reading. Hence the module-level memo.

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

let dir = null

/**
 * The `userData` directory for this driver process, stable across every launch
 * it makes.
 *
 * `dom-phase.mjs` sets `DOM_DRIVER_PROFILE` per driver and owns the cleanup. A
 * driver run by hand gets a throwaway of its own and removes it on exit, so a
 * manual run never writes bounds or zoom into the profile the human's app uses.
 */
export const profileDir = () => {
  if (dir) return dir
  const given = process.env.DOM_DRIVER_PROFILE
  if (given) {
    fs.mkdirSync(given, { recursive: true })
    dir = given
    return dir
  }
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cw-driver-profile-'))
  const self = dir
  process.on('exit', () => {
    try {
      fs.rmSync(self, { recursive: true, force: true })
    } catch {}
  })
  return dir
}

/**
 * Spread into a driver's `electron.launch({ args })`, ahead of the `'.'` that
 * names the app:
 *
 *   args: ['--no-sandbox', '--disable-gpu', ...profileArgs(), '.']
 *
 * `tests/driver-profile.test.ts` reds any driver that launches Electron without
 * it, because a convention nothing executes is a style preference (#146).
 */
export const profileArgs = () => [`--user-data-dir=${profileDir()}`]
