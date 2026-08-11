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
// The `busy` refusal IS covered here (#76), and it is the most consequential
// branch in this surface: switching workspace while a turn streams must be
// refused rather than tearing the engine down under it. It used to print a
// standing `SKIPPED (needs a real streaming turn)`, which by this project's own
// rule is a hole in the gate rather than an environment note — and the stated
// reason expired when gui-73 shipped, which drives a real turn and kills the CLI
// under it mid-flight. The technique is reused here rather than reinvented:
// `.model-pill`'s disabled state is the in-flight signal (gui-54, gui-73,
// gui-75).
//
// The assertion is on the USER-VISIBLE consequence, never on main's flag: the
// dialog still opens (the affordance is deliberately not busy-gated — main owns
// the decision, and disabling here would make its refusal unreachable), the
// refusal is what the user sees, the workspace does not move, and the turn that
// was streaming goes on to FINISH. That last one is the engine-survival claim:
// a torn-down engine cannot complete the turn it was carrying.
//
// Establishes its premise loudly (#65): if the turn never goes in flight, or it
// ends before the switch is attempted, the driver FAILS naming that setup step.
// A refusal assertion that runs while nothing was streaming passes vacuously,
// which is exactly how this hole would grow back.
//
// Costs ONE real CLI turn, as gui-73 and gui-54 do.

import { _electron as electron } from 'playwright-core'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import { profileArgs } from './driver-profile.mjs'

const APP_DIR = path.resolve(import.meta.dirname, '../../..')
const SHOT_DIR = process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')
fs.mkdirSync(SHOT_DIR, { recursive: true })

const PICK_DIR = APP_DIR
// A genuinely empty, genuinely new project: no sessions, so nothing in the
// sessions rail could ever have taken us here. Under Temp deliberately — the
// wrapper's own landmine ledger records that a cwd under Downloads gets turns
// refused by the model's safeguards.
const EMPTY_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'wrapper-empty-'))
// The folder the busy switch tries — and must fail — to reach. A THIRD directory
// on purpose: if the refusal ever stops working, the workspace visibly lands
// here, which is a louder failure than "the title did not change".
const REFUSED_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'wrapper-refused-'))

// Ten minutes, not two: this driver now waits on a real CLI turn.
setTimeout(() => {
  console.log('TIMEOUT')
  process.exit(1)
}, 600000).unref?.()

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

// ── the busy refusal: a real streaming turn, and a switch that must not land ──
//
// Runs LAST, from inside EMPTY_DIR — a temp workspace, deliberately not under
// Downloads, where the model's own safeguards refuse turns outright.

// The in-flight signal, as gui-54 / gui-73 / gui-75 all read it.
const isBusy = () => page.evaluate(() => document.querySelector('.model-pill')?.disabled ?? false)

const send = async (text) => {
  await setDraft(text)
  await page.evaluate(() =>
    document
      .querySelector('.message-input')
      ?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
      )
  )
}

// A full minute, not the 20s gui-75 gets away with: this turn starts in a
// BRAND-NEW temp workspace the switch above just moved into, so the CLI is cold
// — measured going busy well inside 20s on some runs and not at all on others.
const waitBusy = async () => {
  for (let i = 0; i < 60; i++) {
    await page.waitForTimeout(1000)
    if (await isBusy()) return true
  }
  return false
}

const waitIdle = async () => {
  for (let i = 0; i < 90; i++) {
    await page.waitForTimeout(2000)
    if (!(await isBusy())) return true
  }
  return false
}

const assistantChars = () =>
  page.evaluate(() =>
    [...document.querySelectorAll('.msg-assistant')].map((n) => n.textContent ?? '').join(' | ')
      .length
  )

const errorCount = () => page.evaluate(() => document.querySelectorAll('.msg-error').length)

// gui-73's prompt verbatim: it is the one measured to stay in flight long enough
// for a driver to do real work underneath it (there, a process-tree walk and a
// taskkill; here, a dialog round-trip).
await send('Count from 1 to 40, one number per line, with a short pause between each.')
const wentBusy = await waitBusy()
// Told apart in the premise failure below: a prompt that never reached the pane
// is a broken send, while a prompt sitting there with the pill still enabled is
// a CLI that never started. Both are "could not drive", and reading the same
// FAIL line for two different causes is how a driver wastes an afternoon.
const userMsgs = await page.evaluate(() => document.querySelectorAll('.msg-user').length)
log('TURN', { wentBusy, userMsgs })

const busyRefusal = {
  drivable: wentBusy,
  dialogOpened: 0,
  refusal: null,
  project: null,
  stillBusy: false,
  completed: false,
  replyChars: 0,
  newErrors: 0
}

if (wentBusy) {
  const errorsBefore = await errorCount()
  // Sampled BEFORE the click, deliberately: taken afterwards the window misses
  // everything that streamed during the click's own 2s wait, and it cannot go
  // negative when a switch that should have been refused clears the pane.
  // Measured across the red/green pair from here: 0 with the refusal weakened,
  // +272 with it intact.
  const charsBefore = await assistantChars()
  const callsBeforeBusy = await stub({ cancel: false, pick: REFUSED_DIR })
  // Sampled immediately before the click so a turn that ended early is reported
  // as a premise failure rather than as a broken refusal.
  const busyAtClick = await isBusy()
  await clickOpen()
  const refused = await state()
  busyRefusal.dialogOpened = (await dialogCalls()) - callsBeforeBusy
  busyRefusal.refusal = refused.refusal
  busyRefusal.project = refused.project
  // Logged, deliberately NOT a verdict: the click path waits 2s, and a turn that
  // legitimately finished inside that window is not a defect. Completion below
  // is the survival claim; this is only here to read the timeline.
  busyRefusal.stillBusy = await isBusy()
  busyRefusal.drivable = busyAtClick
  log('BUSY', {
    busyAtClick,
    dialogOpened: busyRefusal.dialogOpened,
    refusal: busyRefusal.refusal,
    project: busyRefusal.project,
    stillBusy: busyRefusal.stillBusy
  })

  // The engine-survival half: the turn the switch tried to interrupt keeps
  // streaming and finishes. Growth in assistant text is the load-bearing part —
  // measured against the mutation, `completed` and `newErrors` both stay green
  // while the refusal is broken (a workspace that switched has an empty, quiet
  // pane and `waitIdle` returns at once), so they guard a DIFFERENT regression
  // and are kept for it, not for this one.
  busyRefusal.completed = await waitIdle()
  busyRefusal.replyChars = (await assistantChars()) - charsBefore
  busyRefusal.newErrors = (await errorCount()) - errorsBefore
  log('SURVIVED', {
    completed: busyRefusal.completed,
    newReplyChars: busyRefusal.replyChars,
    newErrors: busyRefusal.newErrors
  })
}

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

// ── the busy refusal (#76) ──────────────────────────────────────────────────
// Premise first, and loudly: an assertion that runs while nothing was streaming
// would pass for the wrong reason, which is the whole failure mode this section
// replaces.
if (!wentBusy) {
  fails.push(
    userMsgs === 0
      ? 'could not drive: the prompt never reached the pane (no .msg-user), so the send itself failed — nothing was streaming and the branch under test was never reached'
      : 'could not drive: the prompt is in the pane but the turn never went in flight within 60s (.model-pill never disabled) — the CLI did not start in the new temp workspace, so the branch under test was never reached'
  )
} else if (!busyRefusal.drivable) {
  fails.push(
    'could not drive: the turn had already ended by the time the switch was attempted, so a refusal was never owed — re-run; the assertions below would have been vacuous'
  )
} else {
  // The dialog must still open. The affordance is deliberately not busy-gated:
  // main owns the busy decision, and a disabled button would make its refusal
  // unreachable — the same reasoning the foreign session row carries.
  if (busyRefusal.dialogOpened !== 1) {
    fails.push(
      `the busy click opened the dialog ${busyRefusal.dialogOpened} times, expected 1 — the affordance must stay reachable while busy so main can be the one to refuse`
    )
  }
  if (!busyRefusal.refusal) {
    fails.push(
      'switching workspace during a streaming turn showed NO refusal — the user got silence for a request the transaction rejected'
    )
  } else if (!/finish or stop the current turn/i.test(busyRefusal.refusal)) {
    fails.push(
      `the refusal shown is not the busy one: ${JSON.stringify(busyRefusal.refusal)} — a different rejection reached the user than the one the turn earned`
    )
  }
  if (busyRefusal.project !== EMPTY_DIR) {
    fails.push(
      `the workspace MOVED during a streaming turn: ${busyRefusal.project} (expected to stay ${EMPTY_DIR}) — the switch was not refused, and the engine was torn down under a live turn`
    )
  }
  if (busyRefusal.replyChars <= 0) {
    fails.push(
      `the streaming turn produced no further assistant text after the refused switch (${busyRefusal.replyChars} chars) — the engine carrying it did not survive the attempt`
    )
  }
  if (!busyRefusal.completed) {
    fails.push(
      'the refused-against turn never finished — a refusal that still costs the turn is not a refusal'
    )
  }
  if (busyRefusal.newErrors !== 0) {
    fails.push(
      `the streaming turn produced ${busyRefusal.newErrors} error(s) in the pane after the refused switch — the engine did not survive the attempt`
    )
  }
}

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
for (const dir of [EMPTY_DIR, REFUSED_DIR]) {
  try {
    fs.rmSync(dir, { recursive: true, force: true })
  } catch {
    console.log('LEFTOVER ' + dir)
  }
}
console.log('DONE')
exit()
