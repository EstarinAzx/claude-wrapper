// GUI driver for #75 — a turn that ends while nobody is looking must reach the
// OS: one native notification, one taskbar flash, and silence in every case the
// table says is silent.
//
// WHAT THIS CANNOT DO, stated first so no PASS reads as more than it is: it
// cannot tell you a toast was PAINTED on screen. That is Windows Action Center
// over an app identity, and a capture of an automated window is not evidence.
// What it proves is that the app told Windows — which is the boundary the vitest
// suite cannot reach at all, since `chat:send` lives in the electron entry.
//
// The patch is on `Notification.prototype.show`, deliberately, NOT on the
// `Notification` class:
//   - the built main bundle captures the constructor when it loads, so replacing
//     the class afterwards can silently record nothing while the app happily
//     notifies. A prototype method cannot be missed that way — the same reason
//     gui-69 patches `BrowserWindow.prototype.setBackgroundMaterial`;
//   - `show()` is also the stronger claim: a Notification that is constructed
//     and never shown is not an announcement.
//
// What it DOES prove, none of which vitest can:
//   1. a real turn ending with the window MINIMISED fires exactly one
//      notification, carrying this outcome's copy and a click handler.
//      Minimised, not blurred, and that is a measurement rather than a
//      preference — see the note above `setFocus`: `win.blur()` moves nothing
//      on this platform, and a minimised window still reports isFocused()
//      === true, which is why the app does not trust that call alone;
//   2. the same turn flashes the taskbar button exactly once;
//   3. refocusing CLEARS the flash — flashFrame(false) after the focus event,
//      or the button keeps blinking after the user is back;
//   4. a real turn ending while FOCUSED fires nothing at all;
//   5. Stop while blurred fires nothing at all — the silent row of the table,
//      verified against a turn that really did abort (the "Stopped" notice), so
//      the zero cannot be the vacuous kind;
//   6. the Windows app identity is still in the shipped bundle. Static, and
//      labelled as such: Electron exposes no getter for the AUMID, and without
//      it an unpackaged app's toast is swallowed with no error at all.
//
// Absence assertions (4 and 5) are the ones this project has recorded as most
// likely to be vacuous, so both were mutation-verified: removing the focus guard
// in `shouldAnnounce` reddens 4, removing the abort guard reddens 5.
//
// Red-first: run against a build without the feature and step 1 fails naming the
// reason (no notification at all). A driver never seen failing proves nothing.
//
//   node .claude/skills/run-desktop/gui-75.mjs
//
// Needs `npm run build` first, plus `npm i --no-save playwright-core`.

import { _electron as electron } from 'playwright-core'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import { profileArgs } from './driver-profile.mjs'
import { checks as sourceChecks } from './gui-75.source.mjs'

const APP_DIR = path.resolve(import.meta.dirname, '../../..')
const SHOT_DIR = process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')
fs.mkdirSync(SHOT_DIR, { recursive: true })

const SECRET = String(Math.floor(Math.random() * 9000) + 1000)
const WORKSPACE = fs.mkdtempSync(path.join(os.tmpdir(), 'gui75-ws-'))

const log = (label, m) => console.log(label.padEnd(12) + JSON.stringify(m))
const fails = []

let cleaned = false
const cleanup = () => {
  if (cleaned) return
  cleaned = true
  // Best-effort: the engine holds the fixture as its cwd, so EBUSY here is
  // ordinary and must never decide the verdict.
  try {
    fs.rmSync(WORKSPACE, { recursive: true, force: true })
  } catch {}
}

setTimeout(() => {
  console.log('TIMEOUT')
  cleanup()
  process.exit(1)
}, 900000).unref?.()

// ---- 0. the app identity, statically ----------------------------------------

// Electron has no getAppUserModelId, so there is nothing to read back at
// runtime. Reading the shipped bundle is the honest remaining check, and it
// catches the regression that matters: someone deleting the call because "the
// notification code does not use it". On Windows it does — silently.
//
// Since #141 the criterion itself lives in `gui-75.source.mjs`, declaring
// `needsBuild` — so it is EXECUTED by `npm run test:dom` even though this
// driver is never launched there (`api-cost`: everything below drives real CLI
// turns). What it needed was a build, not an API key, and those are different
// costs. Driving the same array here keeps one definition, so the executed copy
// cannot drift from the driven one.
for (const c of sourceChecks) {
  const { ok, detail } = c.run()
  log('IDENTITY', detail)
  if (!ok) fails.push(`${c.name} — ${detail.why}`)
}

const electronBin =
  process.platform === 'win32'
    ? path.join(APP_DIR, 'node_modules/electron/dist/electron.exe')
    : process.platform === 'darwin'
      ? path.join(APP_DIR, 'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron')
      : path.join(APP_DIR, 'node_modules/electron/dist/electron')

const app = await electron.launch({
  executablePath: electronBin,
  args: ['--no-sandbox', '--disable-gpu', ...profileArgs(), '.'],
  cwd: APP_DIR,
  env: process.env,
  timeout: 30000
})

let page
const finish = async () => {
  await page?.screenshot({ path: path.join(SHOT_DIR, 'gui-75.png') }).catch(() => {})
  console.log(fails.length === 0 ? 'PASS' : 'FAIL')
  for (const f of fails) console.log('  - ' + f)
  setTimeout(() => process.exit(fails.length === 0 ? 0 : 1), 5000).unref?.()
  await app.close().catch(() => {})
  cleanup()
  process.exit(fails.length === 0 ? 0 : 1)
}

// ---- instrumentation, in MAIN ------------------------------------------------

const patched = await app.evaluate(({ BrowserWindow, Notification }) => {
  globalThis.__n75 = { notifications: [], flashes: [] }

  const canNotify = typeof Notification === 'function' && !!Notification.prototype?.show
  if (canNotify) {
    if (!globalThis.__n75showOrig) globalThis.__n75showOrig = Notification.prototype.show
    const originalShow = globalThis.__n75showOrig
    Notification.prototype.show = function () {
      globalThis.__n75.notifications.push({
        title: this.title ?? null,
        body: this.body ?? null,
        // AC5 without simulating a click: a handler that is attached is a
        // handler the OS can fire. Counting beats "truthy" — two handlers would
        // mean the port is being bound twice per turn.
        clickListeners: typeof this.listenerCount === 'function' ? this.listenerCount('click') : -1
      })
      // Call through: the app should behave exactly as it does unpatched, and a
      // throw from the real show() is itself worth surfacing.
      try {
        return originalShow.call(this)
      } catch (err) {
        globalThis.__n75.showError = String(err)
        return undefined
      }
    }
  }

  const proto = BrowserWindow.prototype
  const canFlash = typeof proto.flashFrame === 'function'
  if (canFlash) {
    if (!globalThis.__n75flashOrig) globalThis.__n75flashOrig = proto.flashFrame
    const originalFlash = globalThis.__n75flashOrig
    proto.flashFrame = function (flag) {
      globalThis.__n75.flashes.push({ flag: flag === true })
      return originalFlash.call(this, flag)
    }
  }
  return { canNotify, canFlash }
})
log('PATCH', patched)
if (!patched.canNotify || !patched.canFlash) {
  fails.push(
    `could not drive: main exposes ${patched.canNotify ? '' : 'no Notification.prototype.show'}${!patched.canNotify && !patched.canFlash ? ' and ' : ''}${patched.canFlash ? '' : 'no BrowserWindow.prototype.flashFrame'} — nothing could be recorded`
  )
  await finish()
}

const readCalls = () => app.evaluate(() => globalThis.__n75)

// MEASURED on this platform before it was used, because the obvious call does
// not work — Electron 43 / Windows 11:
//   win.blur()     → isFocused() stays TRUE and no 'blur' event fires at all
//   win.minimize() → isFocused() stays TRUE, webContents.isFocused() goes false
//   win.hide()     → isFocused() finally false, 'blur' fires
// So minimising is how this driver produces "nobody is looking": it is what a
// user actually does, and unlike hide() it keeps the taskbar button — the flash
// has to land somewhere. It is also why the app does not trust isFocused()
// alone (see `isLooking` in src/main/turn-announce.ts); a driver written on
// win.blur() would have sat at a premise failure forever.
const setFocus = (want) =>
  app.evaluate(
    async ({ BrowserWindow, app: a }, wantFocus) => {
      const win = BrowserWindow.getAllWindows()[0]
      if (!win) return null
      if (wantFocus) {
        win.restore()
        win.show()
        win.focus()
        // Windows can refuse foreground activation to a background process;
        // this is the documented escape hatch.
        if (!win.isFocused()) a.focus({ steal: true })
      } else {
        win.minimize()
      }
      await new Promise((r) => setTimeout(r, 800))
      return {
        isFocused: win.isFocused(),
        minimized: win.isMinimized(),
        looking: win.isFocused() && !win.isMinimized()
      }
    },
    want
  )

// The app's own notion of "someone is looking", read the same way it reads it.
const looking = () =>
  app.evaluate(({ BrowserWindow }) => {
    const win = BrowserWindow.getAllWindows()[0]
    return win ? win.isFocused() && !win.isMinimized() : null
  })

// ---- workspace ---------------------------------------------------------------

await app.evaluate(async ({ dialog }, dir) => {
  dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [dir] })
}, WORKSPACE)

page = await app.firstWindow()
await page.waitForSelector('[aria-label="Backend mode"]', { timeout: 15000 })

// DOM-dispatched: Playwright's actionability wait hangs on the intro animation.
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find(
    (b) =>
      b.getAttribute('aria-label') === 'Pick a project folder' ||
      b.textContent?.includes('Pick a project folder')
  )
  btn?.click()
})
const composerUp = await page
  .waitForSelector('.message-input', { timeout: 20000 })
  .then(() => true)
  .catch(() => false)
log('WORKSPACE', { picked: composerUp, dir: WORKSPACE })
if (!composerUp) {
  fails.push(
    'could not drive: the composer never appeared after picking a folder, so no turn could be run and nothing under test ever executed'
  )
  await finish()
}

const busy = () => page.evaluate(() => document.querySelector('.model-pill')?.disabled ?? false)

const send = async (text) => {
  await page.evaluate((t) => {
    const el = document.querySelector('.message-input')
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(el, t)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }, text)
  await page.evaluate(() =>
    document
      .querySelector('.message-input')
      ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
  )
}

const waitBusy = async () => {
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(500)
    if (await busy()) return true
  }
  return false
}

const waitIdle = async () => {
  for (let i = 0; i < 90; i++) {
    await page.waitForTimeout(2000)
    if (!(await busy())) return true
  }
  return false
}

// ---- 1 + 2. a real turn, window BLURRED --------------------------------------

const blurred = await setFocus(false)
log('BLUR', blurred)
if (blurred?.looking !== false) {
  fails.push(
    `could not drive: the window still reports ${JSON.stringify(blurred)} after minimize(), and a turn nobody is watching is the entire scenario`
  )
  await finish()
}

await send(`Reply with exactly: ${SECRET}`)
const wentBusy1 = await waitBusy()
const idle1 = wentBusy1 ? await waitIdle() : false
const focusedAtEnd1 = await looking()
const after1 = await readCalls()
log('TURN1', {
  wentBusy: wentBusy1,
  completed: idle1,
  focusedAtEnd: focusedAtEnd1,
  notifications: after1.notifications,
  flashes: after1.flashes,
  showError: after1.showError ?? null
})

if (!wentBusy1) {
  fails.push(
    'could not drive: the prompt never started a turn, so no turn ever ended and the announcement path never ran'
  )
  await finish()
}
if (!idle1) {
  fails.push('could not drive: the turn started and never finished — there was no turn end to announce')
  await finish()
}
if (focusedAtEnd1 !== false) {
  fails.push(
    'could not drive: the window regained focus before the turn ended, so the unfocused case was never actually exercised'
  )
  await finish()
}

const notifies1 = after1.notifications
const flashesOn1 = after1.flashes.filter((f) => f.flag)
if (notifies1.length !== 1) {
  fails.push(
    `a turn ended with the window unfocused and ${notifies1.length} notifications were shown, expected exactly 1 — the user alt-tabbed away and was never told the answer was ready`
  )
} else {
  const n = notifies1[0]
  if (n.title !== 'Turn finished' || n.body !== 'Claude has finished responding.') {
    fails.push(
      `the notification carries ${JSON.stringify({ title: n.title, body: n.body })}, expected the turn-end copy`
    )
  }
  if (!(n.clickListeners >= 1)) {
    fails.push(
      `the notification has ${n.clickListeners} click listeners — clicking it would not bring the window back`
    )
  }
}
if (flashesOn1.length !== 1) {
  fails.push(
    `expected exactly 1 flashFrame(true) for the unfocused turn end, saw ${flashesOn1.length} — the taskbar button is the half of this feature that survives a swallowed toast`
  )
}

// ---- 3. refocusing clears the flash ------------------------------------------

const focused = await setFocus(true)
await page.waitForTimeout(1000)
const afterFocus = await readCalls()
const clears = afterFocus.flashes.filter((f) => !f.flag)
log('REFOCUS', { focused, clears: clears.length })
if (focused?.looking !== true) {
  fails.push(
    'could not drive: the window would not take focus, so neither the flash clear nor the focused-turn silence could be observed'
  )
  await finish()
}
if (clears.length < 1) {
  fails.push(
    'the window regained focus and flashFrame(false) was never called — the taskbar button keeps flashing after the user is already back'
  )
}

// ---- 4. a real turn while FOCUSED is silent ----------------------------------

const before2 = await readCalls()
await send(`Reply with exactly: ${SECRET}-two`)
const wentBusy2 = await waitBusy()
const idle2 = wentBusy2 ? await waitIdle() : false
const focusedAtEnd2 = await looking()
const after2 = await readCalls()
const newNotifies2 = after2.notifications.length - before2.notifications.length
const newFlashes2 =
  after2.flashes.filter((f) => f.flag).length - before2.flashes.filter((f) => f.flag).length
log('TURN2', {
  wentBusy: wentBusy2,
  completed: idle2,
  focusedAtEnd: focusedAtEnd2,
  newNotifications: newNotifies2,
  newFlashes: newFlashes2
})

if (!wentBusy2 || !idle2) {
  fails.push(
    'could not drive: the focused turn never ran to completion, so its silence proves nothing'
  )
} else if (focusedAtEnd2 !== true) {
  fails.push(
    'could not drive: the window lost focus during the second turn, so the focused case was never exercised'
  )
} else {
  if (newNotifies2 !== 0) {
    fails.push(
      `a turn ended with the window focused and fired ${newNotifies2} notifications — the user is looking straight at the answer`
    )
  }
  if (newFlashes2 !== 0) {
    fails.push(`a focused turn end flashed the taskbar ${newFlashes2} times, expected 0`)
  }
}

// ---- 5. Stop while blurred is silent -----------------------------------------

const blurred2 = await setFocus(false)
if (blurred2?.looking !== false) {
  fails.push('could not drive: the window would not minimise for the abort case')
  await finish()
}

const before3 = await readCalls()
const noticesBefore = await page.evaluate(
  () => [...document.querySelectorAll('.msg-notice')].filter((n) => n.textContent === 'Stopped').length
)
await send('Count from 1 to 40, writing one short sentence about each number.')
const wentBusy3 = await waitBusy()
if (wentBusy3) {
  await page.waitForTimeout(1500)
  await page.evaluate(() => {
    document.querySelector('button[aria-label="Stop"]')?.click()
  })
}
const idle3 = wentBusy3 ? await waitIdle() : false
// The abort PREMISE: `turn-aborted` reaching the renderer is what puts the quiet
// "Stopped" notice in the pane. Without this check a zero below could simply
// mean the Stop click never landed — the vacuous green this project keeps
// finding in absence assertions.
const stoppedNotice = await page.evaluate(
  () => [...document.querySelectorAll('.msg-notice')].filter((n) => n.textContent === 'Stopped').length
)
const focusedAtEnd3 = await looking()
const after3 = await readCalls()
const newNotifies3 = after3.notifications.length - before3.notifications.length
const newFlashes3 =
  after3.flashes.filter((f) => f.flag).length - before3.flashes.filter((f) => f.flag).length
log('TURN3', {
  wentBusy: wentBusy3,
  completed: idle3,
  aborted: stoppedNotice > noticesBefore,
  focusedAtEnd: focusedAtEnd3,
  newNotifications: newNotifies3,
  newFlashes: newFlashes3
})

if (!wentBusy3 || !idle3) {
  fails.push('could not drive: the abort case never ran a turn to completion')
} else if (stoppedNotice <= noticesBefore) {
  fails.push(
    'could not drive: no "Stopped" notice appeared, so the turn was not aborted and the silence below is vacuous'
  )
} else if (focusedAtEnd3 !== false) {
  fails.push(
    'could not drive: the window was focused when the abort landed, so silence proves nothing — a focused turn is silent anyway'
  )
} else {
  if (newNotifies3 !== 0) {
    fails.push(
      `Stop while unfocused fired ${newNotifies3} notifications — a toast for the action the user just took is noise, and silence here is a required behaviour`
    )
  }
  if (newFlashes3 !== 0) {
    fails.push(`Stop while unfocused flashed the taskbar ${newFlashes3} times, expected 0`)
  }
}

console.log(
  'NOTE        this driver proves the app told Windows, not that a toast was painted. Rendering depends on the app identity above and on Action Center state; a capture of an automated window is not evidence either way.'
)

await finish()
