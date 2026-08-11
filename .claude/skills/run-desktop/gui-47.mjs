// GUI eyeball for #47 — wiring the renderer to switchWorkspace.
//
// jsdom proves the reset logic against a mocked IPC. What it cannot prove is
// that the REAL transaction runs end to end: that a foreign row in the real
// store resolves through the real index, that the engine actually moves cwd,
// and that a session with no recorded cwd is genuinely refused rather than
// theoretically refused. Everything here is read out of the DOM; the screenshot
// is a courtesy, never the measurement.
//
//   node .claude/skills/run-desktop/gui-47.mjs
//
// Needs `npm run build` first. The folder-pick dialog is stubbed in the MAIN
// process and the path travels as an ARGUMENT rather than inside a string
// literal, so the escaped-backslash trap cannot bite. The picked folder is this
// repo, so the starting workspace is a genuinely populated real project.
//
// NOT covered here: the `busy` refusal. Driving it needs a real streaming turn
// against a real CLI, and the branch is already pinned twice — in the
// transaction's own unit tests (#46) and in the renderer suite.

import { _electron as electron } from 'playwright-core'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import { profileArgs } from './driver-profile.mjs'

const APP_DIR = path.resolve(import.meta.dirname, '../../..')
const SHOT_DIR = process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')
fs.mkdirSync(SHOT_DIR, { recursive: true })

const PICK_DIR = APP_DIR

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
  args: ['--no-sandbox', '--disable-gpu', ...profileArgs(), '.'],
  cwd: APP_DIR,
  env: process.env,
  timeout: 30000
})

await app.evaluate(async ({ dialog }, dir) => {
  dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [dir] })
}, PICK_DIR)

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

// The rail SHIPS scoped to the open project, so this file has to establish the
// cross-project premise rather than inherit whatever this machine last stored.
// Without it there is nothing foreign to switch INTO: the run went red on the
// group count and silently skipped its ok path, its missing-cwd refusal and its
// colour comparison — three of four sections, reported as SKIPPED rather than
// as a hole in the gate (#65). Clicked through the real chip rather than seeded
// into localStorage, so it cannot depend on mounting after the write.
await page.evaluate(() => {
  ;[...document.querySelectorAll('.session-scope-btn')]
    .find((b) => b.textContent === 'All projects')
    ?.click()
})
await page.waitForTimeout(300)

const log = (label, m) => console.log(label.padEnd(10) + JSON.stringify(m))

// One reading of everything a switch is supposed to move (or leave alone).
const state = () =>
  page.evaluate(() => {
    const rows = [...document.querySelectorAll('.session-row-btn')]
    return {
      project: document.querySelector('.session-title')?.getAttribute('title') ?? null,
      groups: document.querySelectorAll('.session-group-head').length,
      rows: rows.length,
      enabled: rows.filter((r) => !r.disabled).length,
      disabled: rows.filter((r) => r.disabled).length,
      messages: document.querySelectorAll('.msg').length,
      // A transcript signature, not a count: two different sessions can have the
      // same number of messages.
      transcript: (document.querySelector('.chat-column')?.textContent ?? '').slice(0, 200),
      draft: document.querySelector('.message-input')?.value ?? null,
      trayChips: document.querySelectorAll('.attachment-tray .attachment-chip').length,
      popover: !!document.querySelector('.command-popover'),
      refusal: document.querySelector('.switch-refusal')?.textContent ?? null,
      backend: document.querySelector('[aria-label="Backend mode"]')?.textContent ?? null,
      permission: document.querySelector('[aria-label="Permission mode"]')?.textContent ?? null,
      model: document.querySelector('[aria-label="Model"]')?.textContent ?? null
    }
  })

const initial = await state()
log('INITIAL', initial)

// #45 rendered every foreign row disabled. #47 is the ticket that reverses it,
// so "how many rows are inert" is the headline inversion.
const inertness = await page.evaluate(() => {
  const rows = [...document.querySelectorAll('.session-row-btn')]
  return {
    total: rows.length,
    inert: rows.filter((r) => r.disabled).length,
    // Foreign rows still have to READ as secondary — live is not the same as
    // indistinguishable from the open project's own sessions.
    foreignMuted: (() => {
      const foreign = document.querySelector('.session-row-btn-foreign .session-row-title')
      const local = document.querySelector(
        '.session-row-btn:not(.session-row-btn-foreign) .session-row-title'
      )
      if (!foreign || !local) return null
      return getComputedStyle(foreign).color !== getComputedStyle(local).color
    })()
  }
})
log('INERT', inertness)

// ── dirty the composer, so the reset is visible rather than vacuous ─────────
const setDraft = (text) =>
  page.evaluate((text) => {
    const el = document.querySelector('.message-input')
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set
    setter.call(el, text)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }, text)

// The same stubbed dialog answers the paperclip: a directory path is not an
// embeddable image, so it lands as a by-path chip — a real tray item.
await page.evaluate(() => {
  document.querySelector('.attach-btn')?.click()
})
await page.waitForTimeout(800)

await setDraft('a draft that must not survive the switch')
await page.waitForTimeout(200)
const dirty = await state()
log('DIRTY', { draft: dirty.draft, trayChips: dirty.trayChips, messages: dirty.messages })

// ── the rejection path, end to end through real IPC ─────────────────────────
// Sessions the store records no cwd for are real (measured: 5-6 of ~490). Their
// rows are selectable and must come back refused, having changed nothing.
const unknownProbe = await page.evaluate(async () => {
  const heads = [...document.querySelectorAll('.session-group-head')]
  const head = heads.find((h) => h.textContent === 'Unknown project')
  if (!head) return { probed: false }
  const row = head.parentElement.querySelector('.session-row-btn')
  if (!row) return { probed: false }
  const before = {
    project: document.querySelector('.session-title')?.getAttribute('title') ?? null,
    transcript: (document.querySelector('.chat-column')?.textContent ?? '').slice(0, 200),
    draft: document.querySelector('.message-input')?.value ?? null,
    trayChips: document.querySelectorAll('.attachment-tray .attachment-chip').length
  }
  row.click()
  await new Promise((r) => setTimeout(r, 1500))
  const after = {
    project: document.querySelector('.session-title')?.getAttribute('title') ?? null,
    transcript: (document.querySelector('.chat-column')?.textContent ?? '').slice(0, 200),
    draft: document.querySelector('.message-input')?.value ?? null,
    trayChips: document.querySelectorAll('.attachment-tray .attachment-chip').length
  }
  return {
    probed: true,
    disabled: row.disabled,
    refusal: document.querySelector('.switch-refusal')?.textContent ?? null,
    unchanged: JSON.stringify(before) === JSON.stringify(after),
    before,
    after
  }
})
log('UNKNOWN', {
  probed: unknownProbe.probed,
  disabled: unknownProbe.disabled,
  refusal: unknownProbe.refusal,
  unchanged: unknownProbe.unchanged
})

// The refusal is in the flow, not floating over the composer: a toast would
// overlap it. Only real layout can say.
const refusalBox = await page.evaluate(() => {
  const n = document.querySelector('.switch-refusal')
  const pill = document.querySelector('.input-pill')
  if (!n || !pill) return null
  const a = n.getBoundingClientRect()
  const b = pill.getBoundingClientRect()
  return {
    visible: a.width > 0 && a.height > 0,
    abovePill: a.bottom <= b.top + 1,
    role: n.getAttribute('role'),
    withinViewport: a.top >= 0 && a.bottom <= window.innerHeight
  }
})
log('REFUSAL', refusalBox)

// ── the success path, end to end through real IPC ───────────────────────────
// Pick a foreign row from a REAL other project (never the Unknown group, whose
// whole point above was that it cannot resolve).
const target = await page.evaluate((dir) => {
  const fold = (s) => s.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase()
  for (const head of document.querySelectorAll('.session-group-head')) {
    const label = head.textContent ?? ''
    if (label === 'Unknown project' || fold(label) === fold(dir)) continue
    const row = head.parentElement.querySelector('.session-row-btn')
    if (!row) continue
    row.dataset.gui47 = 'target'
    return { label, title: row.querySelector('.session-row-title')?.textContent ?? null }
  }
  return null
}, PICK_DIR)
log('TARGET', target)

let switched = null
if (target) {
  await page.evaluate(() => {
    document.querySelector('[data-gui47="target"]')?.click()
  })
  await page.waitForTimeout(3000)
  switched = await state()
  log('SWITCHED', switched)
}

// The rail must regroup around the NEW workspace: the project just switched
// into is now the current group, and this repo's own sessions became foreign.
const regrouped =
  target &&
  (await page.evaluate((label) => {
    const heads = [...document.querySelectorAll('.session-group-head')]
    const head = heads.find((h) => h.textContent === label)
    if (!head) return { found: false }
    const rows = [...head.parentElement.querySelectorAll('.session-row-btn')]
    return {
      found: true,
      // The current group is the one whose rows are NOT marked foreign.
      isCurrent: rows.every((r) => !r.classList.contains('session-row-btn-foreign')),
      activeInGroup: !!head.parentElement.querySelector('[aria-current="true"]')
    }
  }, target.label))
log('REGROUP', regrouped)

const shot = path.join(SHOT_DIR, 'workspace-switch.png')
await page.screenshot({ path: shot })
console.log('SHOT ' + shot)

// ── verdict ────────────────────────────────────────────────────────────────
const fails = []
const skipped = []

if (initial.groups < 2) fails.push('only one project group — nothing foreign to switch to')
if (inertness.inert !== 0) fails.push(`${inertness.inert} rows still inert — #45's block is not lifted`)
if (inertness.foreignMuted === false) fails.push('a foreign row is visually identical to a local one')
if (inertness.foreignMuted === null) skipped.push('foreign/local colour comparison (one class absent)')

if (!unknownProbe.probed) {
  skipped.push('missing-cwd refusal (no Unknown project group in this store)')
} else {
  if (unknownProbe.disabled) fails.push('the Unknown project row is still disabled')
  if (!unknownProbe.refusal) fails.push('a cwd-less session was selected with no refusal shown')
  if (!unknownProbe.unchanged) fails.push('a refused switch changed the pane')
  if (!refusalBox?.visible) fails.push('the refusal has no box')
  if (refusalBox && !refusalBox.abovePill) fails.push('the refusal overlaps the composer')
  if (refusalBox && refusalBox.role !== 'status') fails.push('the refusal is not announced')
  if (refusalBox && !refusalBox.withinViewport) fails.push('the refusal is off-screen')
}

if (!target) {
  skipped.push('the ok path (no second real project in the store)')
} else {
  if (switched.project === initial.project) fails.push('the workspace did not move')
  if (switched.project !== target.label) {
    fails.push(`workspace is ${switched.project}, expected ${target.label}`)
  }
  if (switched.refusal) fails.push(`an accepted switch still showed a refusal: ${switched.refusal}`)
  if (switched.draft !== '') fails.push(`the draft survived the switch: ${switched.draft}`)
  if (switched.trayChips !== 0) fails.push('the attachment tray survived the switch')
  if (switched.transcript === dirty.transcript) fails.push('the transcript did not change')
  if (switched.backend !== initial.backend) fails.push('backend mode was reset by a switch')
  if (switched.permission !== initial.permission) fails.push('permission mode was reset by a switch')
  if (switched.model !== initial.model) fails.push('model was reset by a switch')
  if (!regrouped?.found) fails.push('the rail lost the group it switched into')
  if (regrouped?.found && !regrouped.isCurrent) {
    fails.push('the project switched into is still rendered as foreign')
  }
}

if (skipped.length) console.log('SKIPPED ' + skipped.join(' | '))
console.log(fails.length ? 'FAIL ' + fails.join(' | ') : 'PASS all #47 criteria')

// `app.close()` can hang after a clean run, and the watchdog then reports
// TIMEOUT over a verdict that already printed. Arm the exit BEFORE awaiting it.
const exit = () => process.exit(fails.length ? 1 : 0)
setTimeout(exit, 3000).unref?.()
await app.close().catch(() => {})
console.log('DONE')
exit()
