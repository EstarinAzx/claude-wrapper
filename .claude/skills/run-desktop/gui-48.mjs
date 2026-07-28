// GUI eyeball for #48 — the folder picker, reachable after the first pick.
//
// jsdom proves the wiring against a mocked `window.api`. What it CANNOT prove is
// the part this ticket actually adds: that a brand-new IPC channel exists on the
// real preload bridge, that the real dialog opens when the affordance is
// clicked, and that the transaction lands a workspace which has NO sessions at
// all — the empty-folder case session discovery can never reach, and the whole
// reason this ticket exists. A mocked api object is happy to answer a channel
// main never registered.
//
//   node .claude/skills/run-desktop/gui-48.mjs
//
// Needs `npm run build` first. The dialog is stubbed in the MAIN process and
// every path travels as an ARGUMENT rather than inside a string literal, so the
// escaped-backslash trap cannot bite. The stub is switchable at runtime so the
// same run drives both a cancel and a selection, and it COUNTS its calls: a
// button that silently does nothing is otherwise indistinguishable from a cancel.
//
// NOT covered here: the `busy` refusal. Driving it needs a real streaming turn
// against a real CLI; the branch is pinned in the transaction's unit tests (#46)
// and in the renderer suite.

import { _electron as electron } from 'playwright-core'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'

const APP_DIR = path.resolve(import.meta.dirname, '../../..')
const SHOT_DIR = process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')
fs.mkdirSync(SHOT_DIR, { recursive: true })

const PICK_DIR = APP_DIR
// A genuinely empty, genuinely new project: no sessions, so nothing in the
// sessions rail could ever have taken us here. Under Temp deliberately — the
// wrapper's own landmine ledger records that a cwd under Downloads gets turns
// refused by the model's safeguards.
const EMPTY_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'wrapper-empty-'))

setTimeout(() => {
  console.log('TIMEOUT')
  process.exit(1)
}, 120000).unref?.()

const electronBin =
  process.platform === 'win32'
    ? path.join(APP_DIR, 'node_modules/electron/dist/electron.exe')
    : process.platform === 'darwin'
      ? path.join(APP_DIR, 'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron')
      : path.join(APP_DIR, 'node_modules/electron/dist/electron')

const app = await electron.launch({
  executablePath: electronBin,
  args: ['--no-sandbox', '--disable-gpu', '.'],
  cwd: APP_DIR,
  env: process.env,
  timeout: 30000
})

// Switchable + counted. `calls` is what separates "the affordance opened the
// real dialog" from "the affordance is inert".
await app.evaluate(async ({ dialog }, dir) => {
  globalThis.__gui = { pick: dir, cancel: false, calls: 0 }
  dialog.showOpenDialog = async () => {
    globalThis.__gui.calls++
    return globalThis.__gui.cancel
      ? { canceled: true, filePaths: [] }
      : { canceled: false, filePaths: [globalThis.__gui.pick] }
  }
}, PICK_DIR)

const stub = (patch) =>
  app.evaluate((_e, p) => {
    Object.assign(globalThis.__gui, p)
    return globalThis.__gui.calls
  }, patch)

const dialogCalls = () => app.evaluate(() => globalThis.__gui.calls)

const page = await app.firstWindow()
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

await page.waitForSelector('.session-group-head', { timeout: 20000 })

const log = (label, m) => console.log(label.padEnd(10) + JSON.stringify(m))

const state = () =>
  page.evaluate(() => {
    const rows = [...document.querySelectorAll('.session-row-btn')]
    return {
      project: document.querySelector('.session-title')?.getAttribute('title') ?? null,
      groups: document.querySelectorAll('.session-group-head').length,
      rows: rows.length,
      // A row belonging to the OPEN workspace. An empty folder must have none:
      // that is what "no session could have brought you here" looks like in DOM.
      local: rows.filter((r) => !r.classList.contains('session-row-btn-foreign')).length,
      messages: document.querySelectorAll('.msg').length,
      transcript: (document.querySelector('.chat-column')?.textContent ?? '').slice(0, 200),
      draft: document.querySelector('.message-input')?.value ?? null,
      trayChips: document.querySelectorAll('.attachment-tray .attachment-chip').length,
      activeRow: !!document.querySelector('[aria-current="true"]'),
      refusal: document.querySelector('.switch-refusal')?.textContent ?? null,
      backend: document.querySelector('[aria-label="Backend mode"]')?.textContent ?? null,
      permission: document.querySelector('[aria-label="Permission mode"]')?.textContent ?? null,
      model: document.querySelector('[aria-label="Model"]')?.textContent ?? null
    }
  })

// The channel itself. A jsdom mock answers `chooseFolder` whether or not the
// preload ever exposed it and whether or not main ever registered the handler,
// so this is the one assertion only a real window can make.
const bridge = await page.evaluate(async () => {
  const present = typeof window.api?.chooseFolder === 'function'
  if (!present) return { present, reachable: false, shape: null }
  return { present, reachable: true, shape: null }
})
log('BRIDGE', bridge)

// Where the affordance lives is part of the contract: the sessions rail's
// header, beside "New chat" — not a new chrome region, not the titlebar.
const affordance = await page.evaluate(() => {
  const head = document.querySelector('.sidebar-head-actions')
  if (!head) return { found: false }
  const labels = [...head.querySelectorAll('button')].map((b) => b.getAttribute('aria-label'))
  const open = [...head.querySelectorAll('button')].find(
    (b) => b.getAttribute('aria-label') === 'Open project'
  )
  if (open) open.dataset.gui48 = 'open'
  return {
    found: !!open,
    labels,
    adjacent: Math.abs(labels.indexOf('Open project') - labels.indexOf('New chat')) === 1,
    // Deliberately NOT busy-gated, unlike "New chat": main owns the busy
    // decision and disabling here would make its refusal unreachable.
    disabled: open?.disabled ?? null,
    // Measured, not assumed: a 14px icon button that collapsed to nothing would
    // still pass every DOM query above.
    box: open ? { w: open.getBoundingClientRect().width, h: open.getBoundingClientRect().height } : null,
    titlebarUntouched:
      document.querySelectorAll('.titlebar [aria-label="Open project"]').length === 0
  }
})
log('AFFORD', affordance)

const clickOpen = async () => {
  await page.evaluate(() => {
    document.querySelector('[data-gui48="open"]')?.click()
  })
  await page.waitForTimeout(2000)
}

// ── dirty the pane, so a reset is visible rather than vacuous ────────────────
const setDraft = (text) =>
  page.evaluate((text) => {
    const el = document.querySelector('.message-input')
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set
    setter.call(el, text)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }, text)

// Replay a real transcript from this project so there is a real conversation to
// clear, not just an empty pane that was always empty.
const seeded = await page.evaluate(async () => {
  const row = document.querySelector('.session-row-btn:not(.session-row-btn-foreign)')
  if (!row) return false
  row.click()
  await new Promise((r) => setTimeout(r, 2500))
  return document.querySelectorAll('.msg').length > 0
})

// The same stubbed dialog answers the paperclip: a directory path is not an
// embeddable image, so it lands as a by-path chip — a real tray item.
await page.evaluate(() => {
  document.querySelector('.attach-btn')?.click()
})
await page.waitForTimeout(800)
await setDraft('a draft that must not survive the switch')
await page.waitForTimeout(200)

const dirty = await state()
log('DIRTY', {
  seeded,
  project: dirty.project,
  messages: dirty.messages,
  draft: dirty.draft,
  trayChips: dirty.trayChips
})

// ── the cancel path: a true no-op ───────────────────────────────────────────
const callsBeforeCancel = await stub({ cancel: true })
await clickOpen()
const afterCancel = await state()
const callsAfterCancel = await dialogCalls()
log('CANCEL', {
  dialogOpened: callsAfterCancel - callsBeforeCancel,
  project: afterCancel.project,
  refusal: afterCancel.refusal,
  unchanged: JSON.stringify(afterCancel) === JSON.stringify(dirty)
})

// ── the selection path: into a folder with no sessions at all ───────────────
const callsBeforePick = await stub({ cancel: false, pick: EMPTY_DIR })
await clickOpen()
const switched = await state()
const callsAfterPick = await dialogCalls()
log('SWITCH', {
  dialogOpened: callsAfterPick - callsBeforePick,
  project: switched.project,
  local: switched.local,
  rows: switched.rows,
  messages: switched.messages,
  draft: switched.draft,
  trayChips: switched.trayChips,
  refusal: switched.refusal
})

// Reachable AFTER the pick, not just once — the literal ticket title. The
// sidebar re-rendered around a new workspace; the way back out must survive it.
const stillThere = await page.evaluate(
  () =>
    !![...document.querySelectorAll('.sidebar-head-actions button')].find(
      (b) => b.getAttribute('aria-label') === 'Open project'
    )
)
log('AGAIN', { stillThere })

const shot = path.join(SHOT_DIR, 'folder-picker.png')
await page.screenshot({ path: shot })
console.log('SHOT ' + shot)

// ── verdict ────────────────────────────────────────────────────────────────
const fails = []
const skipped = []

if (!bridge.present) fails.push('window.api.chooseFolder is missing from the preload bridge')
if (!affordance.found) fails.push('no "Open project" affordance in the sidebar header')
if (affordance.found && !affordance.adjacent) fails.push('the affordance is not beside "New chat"')
if (affordance.disabled) fails.push('the affordance is disabled — main owns the busy decision')
if (affordance.box && (affordance.box.w < 8 || affordance.box.h < 8)) {
  fails.push(`the affordance has collapsed: ${JSON.stringify(affordance.box)}`)
}
if (!affordance.titlebarUntouched) fails.push('the titlebar grew a picker — out of scope')

if (!seeded) skipped.push('transcript seeding (no local session row in this store)')
if (dirty.trayChips === 0) skipped.push('attachment-tray reset (the paperclip produced no chip)')

if (callsAfterCancel - callsBeforeCancel !== 1) {
  fails.push('clicking the affordance did not open the real dialog')
}
if (afterCancel.project !== dirty.project) fails.push('a cancelled pick moved the workspace')
if (JSON.stringify(afterCancel) !== JSON.stringify(dirty)) {
  fails.push('a cancelled pick changed the pane')
}
if (afterCancel.refusal) fails.push('a cancelled pick showed a refusal — nothing was refused')

if (callsAfterPick - callsBeforePick !== 1) fails.push('the second click did not open the dialog')
if (switched.project !== EMPTY_DIR) {
  fails.push(`workspace is ${switched.project}, expected ${EMPTY_DIR}`)
}
if (switched.refusal) fails.push(`an accepted pick still showed a refusal: ${switched.refusal}`)
if (switched.local !== 0) {
  fails.push(`${switched.local} rows claim to belong to an empty folder`)
}
if (switched.activeRow) fails.push('a session is active after opening a folder with none')
if (seeded && switched.messages !== 0) fails.push('the conversation survived the switch')
if (switched.draft !== '') fails.push(`the draft survived the switch: ${switched.draft}`)
if (dirty.trayChips > 0 && switched.trayChips !== 0) {
  fails.push('the attachment tray survived the switch')
}
if (switched.backend !== dirty.backend) fails.push('backend mode was reset by a switch')
if (switched.permission !== dirty.permission) fails.push('permission mode was reset by a switch')
if (switched.model !== dirty.model) fails.push('model was reset by a switch')
if (!stillThere) fails.push('the affordance vanished after the pick it is named for')

skipped.push('the busy refusal (needs a real streaming turn)')

if (skipped.length) console.log('SKIPPED ' + skipped.join(' | '))
console.log(fails.length ? 'FAIL ' + fails.join(' | ') : 'PASS all #48 criteria')

// `app.close()` can hang after a clean run, and the watchdog then reports
// TIMEOUT over a verdict that already printed. Arm the exit BEFORE awaiting it.
const exit = () => process.exit(fails.length ? 1 : 0)
setTimeout(exit, 3000).unref?.()
await app.close().catch(() => {})
// AFTER the app is down, and never fatal: the engine holds the folder open as
// its cwd, so removing it while the app lives throws EBUSY — which would exit
// non-zero over an already-printed PASS. A leftover temp dir is not a failure.
try {
  fs.rmSync(EMPTY_DIR, { recursive: true, force: true })
} catch {
  console.log('LEFTOVER ' + EMPTY_DIR)
}
console.log('DONE')
exit()
