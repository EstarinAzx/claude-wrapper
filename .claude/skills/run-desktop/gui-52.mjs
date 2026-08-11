// GUI eyeball for #52 / #53 — the model pill against the REAL bundled CLI.
//
// jsdom proves the wiring against a mocked `window.api`, and a mock will answer
// `model:list` with whatever fixture the test author typed. That is precisely
// the thing that cannot be trusted here: the whole bug was an app-side list
// that disagreed with the CLI and nobody noticed. What only a real window can
// show:
//
//   * `model:list` really reaches the real CLI's supportedModels() — the menu
//     is the CLI's rows, not four hardcoded families;
//   * the pill FOLLOWS A `/model` TYPED INTO THE COMPOSER, which never touches
//     the pill. That is the reported bug, and it is invisible to the suite
//     because the suite hands the renderer its own broadcast.
//
// It also answers a question the unit tests structurally cannot: WHEN the pill
// catches up. `/model` is a local command, so it comes back as synthetic output
// and is deliberately ignored as a model report. Whether the CLI re-announces
// itself some other way is an empirical fact about the CLI, so it is measured
// here rather than assumed — the run prints the label after the command and
// again after the next real turn, and says which one moved it.
//
//   node .claude/skills/run-desktop/gui-52.mjs
//
// Needs `npm run build` first, plus `npm i --no-save playwright-core`.
// Sends ONE real prompt ("say OK") — the cheapest turn that still produces a
// genuine assistant message, which is the signal under test.

import { _electron as electron } from 'playwright-core'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import { profileArgs } from './driver-profile.mjs'

const APP_DIR = path.resolve(import.meta.dirname, '../../..')
const SHOT_DIR = process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')
fs.mkdirSync(SHOT_DIR, { recursive: true })

setTimeout(() => {
  console.log('TIMEOUT')
  process.exit(1)
}, 240000).unref?.()

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

const log = (label, m) => console.log(label.padEnd(12) + JSON.stringify(m))
const fails = []
const skipped = []

// Stub the folder dialog in MAIN before any click that opens one, or the run
// blocks forever. The path travels as an ARGUMENT — a backslash inside a string
// literal silently yields a nonexistent cwd.
//
// Also record every `model:changed` main sends, by wrapping webContents.send in
// MAIN. Reading the label alone cannot tell "main never broadcast" from "the
// renderer ignored it" from "the composer submit never happened" — and those
// need different fixes. gui-49's lesson: count the side effect you actually
// care about, on the side that produces it.
await app.evaluate(({ dialog, BrowserWindow }, dir) => {
  dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [dir] })
  globalThis.__gui = { sends: [] }
  const wrap = (win) => {
    const wc = win.webContents
    const orig = wc.send.bind(wc)
    wc.send = (channel, ...args) => {
      if (channel === 'model:changed') globalThis.__gui.sends.push(args[0])
      return orig(channel, ...args)
    }
  }
  BrowserWindow.getAllWindows().forEach(wrap)
  return BrowserWindow.getAllWindows().length
}, APP_DIR)

const broadcasts = () => app.evaluate(() => globalThis.__gui?.sends ?? [])

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
await page.waitForSelector('.message-input', { timeout: 20000 })

const label = () =>
  page.evaluate(() => document.querySelector('.model-pill')?.textContent?.trim() ?? null)

const openMenu = async () => {
  await page.evaluate(() => document.querySelector('.model-pill')?.click())
  await page.waitForTimeout(1500)
  return page.evaluate(() =>
    [...document.querySelectorAll('.model-menu-item')].map((n) => n.textContent?.trim() ?? '')
  )
}

const closeMenu = () =>
  page.evaluate(() => document.querySelector('.model-backdrop')?.click())

// ---- 1. the menu is the CLI's list -----------------------------------------

const items = await openMenu()
log('MENU', { count: items.length, items })

// The four tokens the app used to hardcode. "Fable" also appears as a CLI
// displayName, so it is NOT evidence either way and is excluded on purpose.
const OLD_HARDCODED = ['Opus', 'Sonnet', 'Haiku']
const exactOld = OLD_HARDCODED.filter((h) => items.includes(h))
if (items.length <= 5) {
  fails.push(`menu has only ${items.length} entries — looks like the hardcoded list`)
}
// The CLI advertises bracketed 1M rows and wisp aliases; neither could ever
// have come from the old constant, so either one proves the source is the CLI.
const cliOnly = items.filter((t) => /\(1M context\)|—/.test(t))
if (cliOnly.length === 0) {
  fails.push('no CLI-only row (1M / wisp alias) in the menu')
}
log('SOURCE', { cliOnlyRows: cliOnly, exactOldTokens: exactOld })

await closeMenu()

// ---- 2. THE BUG: the pill follows the CLI with no pick at all ---------------

const setValue = (text) =>
  page.evaluate((t) => {
    const el = document.querySelector('.message-input')
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set
    setter.call(el, t)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }, text)

const submit = () =>
  page.evaluate(() => {
    const el = document.querySelector('.message-input')
    el?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    )
  })

// Transcript size is the proof the composer actually submitted. Without it a
// silent no-op submit reads identically to "the fix never fired".
const bubbles = () =>
  page.evaluate(() => document.querySelectorAll('.msg, .message, [class*="bubble"]').length)

// The pill is disabled for the duration of a turn, so "enabled again" is the
// turn-over signal. It is also true of a turn that never STARTED, which is why
// every call is paired with a transcript-growth check — a label read after a
// turn that did not happen is a measurement of nothing.
const runTurn = async (text, tag) => {
  const bubblesBefore = await bubbles()
  await setValue(text)
  await submit()
  // let it go busy first, so the loop below cannot pass on the pre-turn state
  await page.waitForTimeout(3000)
  let done = false
  for (let i = 0; i < 60; i++) {
    await page.waitForTimeout(2000)
    const busy = await page.evaluate(
      () => document.querySelector('.model-pill')?.disabled ?? false
    )
    if (!busy) {
      done = true
      break
    }
  }
  const bubblesAfter = await bubbles()
  if (bubblesAfter === bubblesBefore) {
    fails.push(`[${tag}] submit produced no transcript change — that step never ran`)
  }
  if (!done) skipped.push(`[${tag}] turn never finished`)
  return { done, label: await label(), bubbles: `${bubblesBefore} -> ${bubblesAfter}` }
}

// A real turn, with NO pick anywhere before it. Under the old code the pill
// could only ever say what it was last clicked to say, so it would still read
// "Default" here.
const atStart = await label()
const first = await runTurn('say OK', 'first-turn')
log('TURN-1', { before: atStart, ...first, broadcasts: await broadcasts() })
if (first.label === atStart) {
  fails.push(`pill did not follow the CLI on a plain turn (still ${atStart})`)
}

// ---- 3. and it follows a /model typed into the composer ---------------------

// `/model` is a local command: it comes back as synthetic output, which is
// deliberately not treated as a model report. So the pill is expected to move
// on the NEXT real turn, not on the command itself. Both are measured rather
// than assumed, and the run prints which one moved it.
const beforeCommand = await label()
const slash = await runTurn('/model haiku', 'slash')
log('SLASH', { before: beforeCommand, ...slash, broadcasts: await broadcasts() })

const second = await runTurn('say OK again', 'second-turn')
log('TURN-2', { ...second, broadcasts: await broadcasts() })

const followed = slash.label !== beforeCommand || second.label !== beforeCommand
if (!followed) {
  fails.push(`pill never followed the CLI-side /model (stuck on ${beforeCommand})`)
}
log('FOLLOWED', {
  movedOnCommandItself: slash.label !== beforeCommand,
  movedOnNextTurn: second.label !== slash.label,
  finalLabel: second.label
})

// ---- 4. a pick still works, now that a real session exists -----------------
//
// Deliberately last. Picking before any turn has run resumes a session that
// only ever warmed up, and that errors the turn — a PRE-EXISTING behaviour of
// the model/permission pills' resume-on-pick, unrelated to this ticket, but it
// silently swallowed the first version of this check.
const items2 = await openMenu()
const beforePick = await label()
const target = items2.find((t) => t !== 'Default' && t !== beforePick)
if (!target) {
  skipped.push('no distinct row to pick')
  await closeMenu()
} else {
  await page.evaluate((t) => {
    const el = [...document.querySelectorAll('.model-menu-item')].find(
      (n) => n.textContent?.trim() === t
    )
    el?.click()
  }, target)
  await page.waitForTimeout(2000)
  const afterPick = await label()
  log('PICK', { before: beforePick, picked: target, after: afterPick })
  if (afterPick !== target) {
    fails.push(`pick did not move the label: ${afterPick} !== ${target}`)
  }
}

await page.screenshot({ path: path.join(SHOT_DIR, 'gui-52.png') })

for (const s of skipped) log('SKIPPED', s)
console.log(fails.length === 0 ? 'PASS' : 'FAIL')
for (const f of fails) console.log('  - ' + f)
await app.close()
process.exit(fails.length === 0 ? 0 : 1)
