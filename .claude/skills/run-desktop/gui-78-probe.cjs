// #78 — the launch-artifact instrument's main-process half, and the Electron
// ENTRY POINT for a measured launch.
//
// Run as `electron .claude/skills/run-desktop/gui-78-probe.cjs`: this file
// installs its hooks and then `require`s the app's real built main
// (`out/main/index.js`), which is the same module `electron .` would load via
// package.json's `main`. Requiring it last is the whole trick — every hook below
// is registered before the app's first line, so `browser-window-created`,
// `ready-to-show`, `show` and both preference IPCs are all still ahead of us.
//
// WHY NOT PLAYWRIGHT, like every other driver here. Measured, not assumed:
// under `_electron.launch()` this window NEVER emits `ready-to-show`, so
// `win.show()` never runs, the window is never visible and never painted —
// `performance.getEntriesByType('paint')` comes back empty. A harness that
// prevents the window from being shown cannot measure what the window shows at
// first paint. Two other attachment points were tried and also fail, for the
// record: `NODE_OPTIONS=--require` never reaches Electron (`NODE_OPTIONS` reads
// back `null` inside main), and `context.addInitScript()` is registered too late
// because `electron.launch()` resolves at ~380ms with the window already
// constructed and loading.
//
// Observes only. The extra `ipcMain` listeners are additional, not replacements
// — ipcMain is multi-listener, so the app's own handlers still run — and nothing
// under `src/` is patched. The one thing added to the running app is the
// document-start session preload, which reports and does nothing else.
//
// Env contract (all set by gui-78.mjs):
//   GUI78_OUT      — file to write the JSON dump to
//   GUI78_PROFILE  — userData directory, so a run inherits no persisted zoom
//   GUI78_SEED     — JSON of localStorage keys to write AFTER measuring
//   GUI78_HOLD_MS  — how long to observe before dumping and quitting
'use strict'

const path = require('node:path')
const fs = require('node:fs')
const { app, ipcMain, session } = require('electron')

const OUT = process.env.GUI78_OUT
const PROFILE = process.env.GUI78_PROFILE
const SEED = process.env.GUI78_SEED
const HOLD_MS = Number(process.env.GUI78_HOLD_MS || 6000)

// Before ready, which is the only time this is allowed — and the reason a run
// is a genuine first launch rather than one inheriting the real profile's
// persisted zoom level.
if (PROFILE) app.setPath('userData', PROFILE)

const timeline = []
const frames = []
const mark = (name, extra) => timeline.push({ name, t: Date.now(), ...(extra || {}) })

mark('probe-loaded')

ipcMain.on('gui78:frame', (_event, entry) => frames.push(entry))
ipcMain.on('zoom:set', (_event, level) => mark('renderer-pushed-zoom', { level }))
ipcMain.on('backdrop:set', (_event, material) => mark('renderer-pushed-backdrop', { material }))

// Registered before the app's own `app.whenReady().then(createWindow)`, so the
// preload exists before any window is constructed and therefore binds to the
// launch frame. A preload registered later binds to nothing that matters.
app.whenReady().then(() => {
  mark('app-ready')
  try {
    session.defaultSession.registerPreloadScript({
      type: 'frame',
      filePath: path.join(__dirname, 'gui-78-renderer-probe.cjs')
    })
    mark('renderer-probe-registered')
  } catch (err) {
    mark('renderer-probe-failed', { error: String((err && err.message) || err) })
  }
})

const READ_SETTLED = `(() => {
  const de = document.documentElement
  const paints = {}
  for (const e of performance.getEntriesByType('paint')) {
    paints[e.name] = Math.round(performance.timeOrigin + e.startTime)
  }
  return {
    timeOrigin: Math.round(performance.timeOrigin),
    paints,
    vw: de.clientWidth,
    vh: de.clientHeight,
    dpr: window.devicePixelRatio,
    theme: de.getAttribute('data-theme'),
    mint: getComputedStyle(de).getPropertyValue('--color-mint').trim(),
    rootKids: (document.getElementById('root') || {}).childElementCount,
    stored: {
      zoom: window.localStorage.getItem('zoom-level-v2'),
      theme: window.localStorage.getItem('theme'),
      backdrop: window.localStorage.getItem('backdrop')
    }
  }
})()`

const dump = (payload) => {
  try {
    fs.writeFileSync(OUT, JSON.stringify(payload, null, 2))
  } catch (err) {
    process.stderr.write('gui-78-probe: could not write dump: ' + String(err) + '\n')
  }
}

app.on('browser-window-created', (_event, win) => {
  const wc = win.webContents

  mark('window-created', {
    id: win.id,
    visible: win.isVisible(),
    // The window's zoom BEFORE the renderer has pushed anything. On a fresh
    // profile this is the constructed default; on a warm one it is whatever
    // Chromium persisted — which is the finding this instrument exists to make
    // visible rather than inherit.
    zoomFactor: wc.getZoomFactor()
  })

  win.once('ready-to-show', () => mark('ready-to-show', { zoomFactor: wc.getZoomFactor() }))
  win.on('show', () => mark('window-shown', { zoomFactor: wc.getZoomFactor() }))
  wc.on('dom-ready', () => mark('dom-ready', { zoomFactor: wc.getZoomFactor() }))
  wc.on('did-finish-load', () => mark('did-finish-load', { zoomFactor: wc.getZoomFactor() }))

  // A poll beside the event, because `show` fires once and a listener that is
  // even microseconds late misses it forever. `isVisible()` is a STATE, so a
  // poll cannot miss it — it can only be up to its own 4ms interval late, which
  // is reported rather than hidden.
  const pollStarted = Date.now()
  const poll = setInterval(() => {
    if (win.isDestroyed()) return clearInterval(poll)
    if (win.isVisible()) {
      mark('visible-by-poll', { zoomFactor: wc.getZoomFactor(), pollIntervalMs: 4 })
      clearInterval(poll)
    } else if (Date.now() - pollStarted > HOLD_MS) {
      mark('never-visible', { waitedMs: Date.now() - pollStarted })
      clearInterval(poll)
    }
  }, 4)

  setTimeout(() => {
    void (async () => {
      let settled = null
      try {
        settled = await wc.executeJavaScript(READ_SETTLED)
      } catch (err) {
        mark('settled-read-failed', { error: String((err && err.message) || err) })
      }
      // Seeding happens AFTER the measurement, so this launch measures the state
      // it opened with and the next one measures what this one stored.
      if (SEED) {
        try {
          await wc.executeJavaScript(
            `(() => { const s = ${SEED}; for (const k of Object.keys(s)) window.localStorage.setItem(k, s[k]); return true })()`
          )
          mark('seeded', { seed: JSON.parse(SEED) })
        } catch (err) {
          mark('seed-failed', { error: String((err && err.message) || err) })
        }
      }
      dump({ timeline, frames, settled })
      app.exit(0)
    })()
  }, HOLD_MS)
})

// Last line on purpose: the app's real main, unmodified, loaded after every hook
// above is in place.
require('../../../out/main/index.js')
