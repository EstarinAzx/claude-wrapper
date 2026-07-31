// #79 — the restore-and-artifact instrument's main-process half, and the
// Electron ENTRY POINT for a measured launch.
//
// Same shape as `gui-78-probe.cjs`, and for the same measured reasons: run as
// `electron gui-79-probe.cjs`, it installs its hooks and then `require`s the
// app's real built main, so every listener is in place before the app's first
// line. Playwright cannot be used here — under `_electron.launch()` this window
// never emits `ready-to-show`, so it is never shown, and a harness that stops
// the window being shown cannot measure where the window appears.
//
// WHAT IS SAMPLED. A 4ms poll of `isVisible()` and `getBounds()` together,
// recorded only when one of them CHANGES. Visibility and position are both
// STATES rather than events, so a poll cannot miss them — it can only be up to
// its own interval late, which is reported rather than hidden. The pair is the
// point: "the window was on screen, at these bounds, for this long" is the
// artifact this ticket has to decide on, and either half alone cannot say it.
//
// GUI79_FORCE_SHOW is how the same build is measured BOTH WAYS. This probe's
// `browser-window-created` handler runs before `createWindow` attaches its own
// listeners, so showing the window here on `ready-to-show` reproduces exactly
// the pre-#79 line (`win.once('ready-to-show', () => win.show())`) and defeats
// the gate without patching anything under `src/`. A/B on one binary.
//
// Env contract (all set by gui-79.mjs):
//   GUI79_OUT         — file to write the JSON dump to
//   GUI79_PROFILE     — userData directory, so a run inherits no stored bounds
//   GUI79_SEED_BOUNDS — '1' to write bounds into localStorage AFTER measuring
//   GUI79_FORCE_SHOW  — '1' to show on ready-to-show, defeating the gate
//   GUI79_HOLD_MS     — how long to observe before dumping and quitting
'use strict'

const fs = require('node:fs')
const { app, ipcMain, screen } = require('electron')

const OUT = process.env.GUI79_OUT
const PROFILE = process.env.GUI79_PROFILE
const SEED_BOUNDS = process.env.GUI79_SEED_BOUNDS === '1'
const FORCE_SHOW = process.env.GUI79_FORCE_SHOW === '1'
const HOLD_MS = Number(process.env.GUI79_HOLD_MS || 6000)

// Before ready, the only time this is allowed, and the reason a run is a
// genuine first launch rather than one inheriting the real profile.
if (PROFILE) app.setPath('userData', PROFILE)

const timeline = []
const samples = []
const mark = (name, extra) => timeline.push({ name, t: Date.now(), ...(extra || {}) })

mark('probe-loaded')

// The app's own handler still runs — ipcMain is multi-listener — so this
// observes the push rather than intercepting it.
ipcMain.on('bounds:set', (_event, bounds) => mark('renderer-pushed-bounds', { bounds }))

const rect = (b) => [b.x, b.y, b.width, b.height]
const same = (a, b) => a && b && a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3]

app.on('browser-window-created', (_event, win) => {
  mark('window-created', { bounds: win.getBounds(), visible: win.isVisible() })

  win.once('ready-to-show', () => {
    mark('ready-to-show', { bounds: win.getBounds(), visible: win.isVisible() })
    // Defeat the gate: this is the line the app used to run unconditionally.
    if (FORCE_SHOW) {
      mark('forced-show')
      win.show()
    }
  })
  win.on('show', () => mark('window-shown', { bounds: win.getBounds() }))

  // Visibility AND position, sampled together, recorded on change. The very
  // first sample is always kept so the trace has a baseline.
  let last = null
  const poll = setInterval(() => {
    if (win.isDestroyed()) return clearInterval(poll)
    const visible = win.isVisible()
    const bounds = rect(win.getBounds())
    if (last && last.visible === visible && same(last.bounds, bounds)) return
    last = { visible, bounds }
    samples.push({ t: Date.now(), visible, bounds })
  }, 4)

  setTimeout(() => {
    void (async () => {
      let stored = null
      let seeded = null
      try {
        stored = await win.webContents.executeJavaScript(
          `window.localStorage.getItem('window-bounds-v1')`
        )
      } catch (err) {
        mark('stored-read-failed', { error: String((err && err.message) || err) })
      }

      // Seeding happens AFTER the measurement, so this launch measures what it
      // opened with and the NEXT one measures what this one stored.
      //
      // The target is computed from the live work area rather than hardcoded:
      // a fixed rectangle would be clamped on a small display, and a driver
      // whose premise the clamp quietly rewrites is measuring something else.
      if (SEED_BOUNDS) {
        const area = screen.getPrimaryDisplay().workArea
        seeded = {
          x: area.x + 120,
          y: area.y + 90,
          width: Math.min(1000, area.width - 240),
          height: Math.min(700, area.height - 180)
        }
        try {
          await win.webContents.executeJavaScript(
            `(() => { window.localStorage.setItem('window-bounds-v1', ${JSON.stringify(
              JSON.stringify(seeded)
            )}); return true })()`
          )
          mark('seeded', { seeded })
        } catch (err) {
          mark('seed-failed', { error: String((err && err.message) || err) })
        }
      }

      const finalBounds = win.isDestroyed() ? null : win.getBounds()
      try {
        fs.writeFileSync(
          OUT,
          JSON.stringify({ timeline, samples, stored, seeded, finalBounds }, null, 2)
        )
      } catch (err) {
        process.stderr.write('gui-79-probe: could not write dump: ' + String(err) + '\n')
      }
      app.exit(0)
    })()
  }, HOLD_MS)
})

// Last line on purpose: the app's real main, unmodified, loaded after every
// hook above is in place.
require('../../../out/main/index.js')
