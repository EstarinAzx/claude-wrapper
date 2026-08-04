// #110 — the close-inside-the-debounce instrument's main-process half, and the
// Electron ENTRY POINT for a measured launch.
//
// Same shape as `gui-79-probe.cjs` and for the same measured reasons: run as
// `electron gui-110-probe.cjs`, it installs its hooks and then `require`s the
// app's real built main, so every listener is in place before the app's first
// line. Playwright cannot be used here — under `_electron.launch()` this window
// never emits `ready-to-show`, so it is never shown, and the whole claim is
// about what a window does when it is closed while on screen.
//
// TWO WITNESSES, DELIBERATELY SEPARATE. This ticket's remedy can fail in two
// unrelated places, and a single pass/fail on the stored value cannot tell them
// apart:
//
//   DID MAIN SEND?  `win.webContents.send` is wrapped, so every `bounds:changed`
//                   is recorded with its payload and timestamp. This answers
//                   "was the flush wired at all", and it is a fact main owns.
//   DID IT LAND?    The next launch's `bounds:set` payload — what the renderer
//                   read back out of localStorage at mount. This answers "did
//                   the renderer survive long enough to write it", which is a
//                   fact the RENDERER owns and main cannot speak for.
//
// The second is the risk the ticket does not name: sending on `close` puts the
// message in flight during teardown, and `window-all-closed` quits the app.
// Whether the renderer's listener and its `localStorage.setItem` run before the
// process goes away is a race, not a guarantee, so it is measured rather than
// argued.
//
// The `bounds:set` payload is read INSTEAD of executing JavaScript in the page,
// because it is what the renderer had before this launch's own reporting could
// write anything back — reading localStorage later would read a value this
// launch may have just rewritten with the same rectangle.
//
// Env contract (all set by gui-110.mjs):
//   GUI110_OUT        — file to write the JSON dump to
//   GUI110_PROFILE    — userData directory, shared across a run's three launches
//   GUI110_PHASE      — 'seed' | 'move-close' | 'read'
//   GUI110_SETTLE_MS  — how long to let the launch settle before acting
//   GUI110_CLOSE_MS   — 'move-close': delay between the move and the close
'use strict'

const fs = require('node:fs')
const { app, ipcMain, screen } = require('electron')

const OUT = process.env.GUI110_OUT
const PROFILE = process.env.GUI110_PROFILE
const PHASE = process.env.GUI110_PHASE
const SETTLE_MS = Number(process.env.GUI110_SETTLE_MS || 2500)
const CLOSE_MS = Number(process.env.GUI110_CLOSE_MS || 60)

// Before ready, the only time this is allowed. Shared across the run's launches
// on purpose — the whole measurement is about what launch N+1 inherits.
if (PROFILE) app.setPath('userData', PROFILE)

const timeline = []
const sends = []
const mark = (name, extra) => timeline.push({ name, t: Date.now(), ...(extra || {}) })

mark('probe-loaded', { phase: PHASE })

// The app's own handler still runs — ipcMain is multi-listener — so this
// observes the renderer's mount push rather than intercepting it. This payload
// IS the stored value, straight from the renderer's own read.
let boundsSet = { seen: false, payload: null }
ipcMain.on('bounds:set', (_event, bounds) => {
  if (!boundsSet.seen) boundsSet = { seen: true, payload: bounds }
  mark('renderer-pushed-bounds', { bounds })
})

// The two rectangles, computed from the live work area rather than hardcoded: a
// fixed pair would be rewritten by `clampBounds` on a small display, and a
// driver whose premise the clamp quietly edits is measuring something else.
// Deterministic, so all three launches agree without passing them around.
const rectangles = () => {
  const area = screen.getPrimaryDisplay().workArea
  const width = Math.min(900, area.width - 300)
  const height = Math.min(640, area.height - 240)
  return {
    base: { x: area.x + 60, y: area.y + 50, width, height },
    // Distinct in all four numbers, so a partial report cannot be mistaken for
    // the whole one.
    target: { x: area.x + 180, y: area.y + 130, width: width - 40, height: height - 30 }
  }
}

const dump = (extra) => {
  try {
    fs.writeFileSync(
      OUT,
      JSON.stringify({ phase: PHASE, timeline, sends, boundsSet, ...rectangles(), ...extra }, null, 2)
    )
  } catch (err) {
    process.stderr.write('gui-110-probe: could not write dump: ' + String(err) + '\n')
  }
}

app.on('browser-window-created', (_event, win) => {
  mark('window-created')

  // Wrap the outgoing channel. This is the only way to see a send that happens
  // during teardown: by the time anything else could observe it, the window is
  // gone. Delegates unconditionally, so the app's behaviour is unchanged.
  const realSend = win.webContents.send.bind(win.webContents)
  win.webContents.send = (channel, ...args) => {
    if (channel === 'bounds:changed') sends.push({ t: Date.now(), bounds: args[0] })
    return realSend(channel, ...args)
  }

  // Ours is attached before the app's (this handler runs during construction),
  // so these mark the edge rather than the app's reaction to it.
  win.on('close', () => mark('window-close'))
  win.on('closed', () => mark('window-closed'))
  win.on('show', () => mark('window-shown', { bounds: win.getBounds() }))

  setTimeout(() => {
    if (win.isDestroyed()) {
      mark('destroyed-before-act')
      dump({ finalBounds: null })
      app.exit(0)
      return
    }

    const { base, target } = rectangles()

    if (PHASE === 'read') {
      // Nothing to do but report what the renderer brought with it.
      mark('read-only')
      dump({ finalBounds: win.getBounds() })
      app.exit(0)
      return
    }

    if (PHASE === 'seed') {
      // The POSITIVE CONTROL. Move, then wait well past the debounce so the
      // ordinary reporting path stores it. If this does not land, the
      // instrument is measuring nothing and the `move-close` result is void.
      mark('seed-move', { bounds: base })
      win.setBounds(base)
      setTimeout(() => {
        mark('seed-settled')
        dump({ finalBounds: win.isDestroyed() ? null : win.getBounds() })
        app.exit(0)
      }, 900)
      return
    }

    // PHASE === 'move-close' — the premise itself.
    mark('move', { bounds: target })
    win.setBounds(target)
    setTimeout(() => {
      mark('closing', { sinceMove: CLOSE_MS })
      const finalBounds = win.isDestroyed() ? null : win.getBounds()
      // `close()` runs main's own `close` listeners synchronously, so anything
      // sent from one is in `sends` by the time this returns.
      if (!win.isDestroyed()) win.close()
      dump({ finalBounds })
      // No `app.exit` — `window-all-closed` quits the app, and that natural
      // teardown is exactly the race being measured. Failsafe only.
      setTimeout(() => app.exit(0), 4000)
    }, CLOSE_MS)
  }, SETTLE_MS)
})

// Last line on purpose: the app's real main, unmodified, loaded after every
// hook above is in place.
require('../../../out/main/index.js')
