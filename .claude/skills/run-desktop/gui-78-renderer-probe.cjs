// #78 — renderer half of the launch-artifact instrument.
//
// Registered as a session preload by `gui-78-main-probe.cjs`, so it runs at
// document-start: before `main.tsx`, before React, before the first paint. That
// is the only vantage point from which "what the window shows at first paint"
// is answerable — every later attachment sees the settled state and would
// report no artifact at all.
//
// It reports over `ipcRenderer` rather than parking results on `window`,
// because the app runs with contextIsolation and a preload's globals live in an
// isolated world the driver's `page.evaluate` cannot read. The DOM is shared, so
// every measurement below is of the real document.
//
// Layout is read with `clientWidth` and `getBoundingClientRect` and colour with
// `getComputedStyle` — never off a screenshot. A capture cannot see the right
// ~20% of this layout at zoom 1.25 (#71), and the reflow being measured IS a
// zoom change.
'use strict'

const { ipcRenderer } = require('electron')

const MAX_MS = 12000 // hard stop: a sampler that never ends hangs the driver
const SETTLE_MS = 1200 // no fingerprint change for this long → settled
const MIN_MS = 2500 // never call it settled before the app has had a chance

const sample = () => {
  const de = document.documentElement
  const root = document.getElementById('root')
  let mint = ''
  let bg = ''
  try {
    mint = getComputedStyle(de).getPropertyValue('--color-mint').trim()
    // What the window is actually PAINTED as before the UI exists. The window is
    // constructed transparent over a backdrop material, so this says whether the
    // pre-UI frame is the app's own wash or a bare white document.
    bg = getComputedStyle(document.body || de).backgroundColor
  } catch {
    mint = '<unreadable>'
    bg = '<unreadable>'
  }
  let titlebar = null
  const tb = document.querySelector('.titlebar')
  if (tb) {
    const r = tb.getBoundingClientRect()
    titlebar = Math.round(r.width * 10) / 10 + 'x' + Math.round(r.height * 10) / 10
  }
  return {
    vw: de ? de.clientWidth : null,
    vh: de ? de.clientHeight : null,
    dpr: window.devicePixelRatio,
    theme: de ? de.getAttribute('data-theme') : null,
    mint,
    bg,
    rootKids: root ? root.childElementCount : -1,
    titlebar
  }
}

const send = (entry) => {
  try {
    ipcRenderer.send('gui78:frame', entry)
  } catch {
    // The window is going away; nothing to report to.
  }
}

const t0 = Date.now()
let last = null
let lastChange = t0

// The document-start reading, taken synchronously so the very first state is on
// the record even if the first animation frame is throttled before the window
// is shown.
const first = sample()
last = JSON.stringify(first)
send({ t: t0, why: 'document-start', ...first })

// `data-theme` is set from a React effect and changes nothing about layout, so a
// 60Hz sampler can coalesce it with the zoom reflow. The observer timestamps it
// exactly.
//
// Observed on `document`, not on `documentElement`: at document-start
// `documentElement` is still null (measured — the first sample below reads
// `vw: null`), so observing it directly throws and the theme step goes
// unrecorded. `document` always exists, and a subtree observer sees the
// attribute land on the html element whenever that element appears.
try {
  new MutationObserver((records) => {
    for (const r of records) {
      if (r.target === document.documentElement) {
        send({
          t: Date.now(),
          why: 'data-theme-mutation',
          theme: document.documentElement.getAttribute('data-theme')
        })
      }
    }
  }).observe(document, { attributes: true, subtree: true, attributeFilter: ['data-theme'] })
} catch (err) {
  send({ t: Date.now(), why: 'mutation-observer-failed', error: String((err && err.message) || err) })
}

const tick = () => {
  const now = Date.now()
  const s = sample()
  const key = JSON.stringify(s)
  if (key !== last) {
    last = key
    lastChange = now
    send({ t: now, why: 'frame-changed', ...s })
  }
  if (now - t0 > MAX_MS || (now - t0 > MIN_MS && now - lastChange > SETTLE_MS)) {
    send({ t: now, why: 'settled', ...s })
    return
  }
  requestAnimationFrame(tick)
}

requestAnimationFrame(tick)
