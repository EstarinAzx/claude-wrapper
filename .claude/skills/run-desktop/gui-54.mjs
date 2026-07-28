// GUI eyeball for #54 — picking a model before the first turn must not break
// that turn.
//
// This one is pure real-app territory. The bug is a resume into a session the
// CLI never created, so it exists only where a real CLI decides whether an id
// is resumable. jsdom cannot have the opinion: its fake engine resumes into
// whatever string it is handed and reports success.
//
// The repro is an ORDERING, and the order is the whole test:
//   pick a folder (warm-up only, no turn) -> pick a model -> send
// Before the fix that send came back `error_during_execution`. Sending first
// and picking afterwards always worked, which is why it survived so long.
//
//   node .claude/skills/run-desktop/gui-54.mjs              # model pill
//   node .claude/skills/run-desktop/gui-54.mjs permission   # permission pill
//
// Run BOTH — they exercise the same defect through the two call sites that
// share it. Needs `npm run build` first, plus `npm i --no-save playwright-core`.
// Each run sends ONE real prompt.
//
// Verified to actually catch the bug: run against a build with the turnEverRun
// gate removed from engine.ts and it reports the real failure —
// "Claude hit an error during this turn", assistants 0, users 1. A driver for a
// fixed bug that has never been seen to fail is not evidence of anything.

import { _electron as electron } from 'playwright-core'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'

// The pill to exercise, as an argument: `model` (default) or `permission`.
// BOTH matter — `permission:set` and `model:set` build their resume target with
// the same `engine?.sessionId() ?? pendingResume` expression, so the bug was
// never model-specific. The issue flagged the permission path as untested;
// running this twice is what tests it.
const WHICH = process.argv[2] === 'permission' ? 'permission' : 'model'

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
  args: ['--no-sandbox', '--disable-gpu', '.'],
  cwd: APP_DIR,
  env: process.env,
  timeout: 30000
})

const log = (label, m) => console.log(label.padEnd(10) + JSON.stringify(m))
const fails = []

await app.evaluate(({ dialog }, dir) => {
  dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [dir] })
}, APP_DIR)

const page = await app.firstWindow()
await page.waitForSelector('[aria-label="Backend mode"]', { timeout: 15000 })
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find(
    (x) =>
      x.getAttribute('aria-label') === 'Pick a project folder' ||
      x.textContent?.includes('Pick a project folder')
  )
  b?.click()
})
await page.waitForSelector('.message-input', { timeout: 20000 })
// Let warm-up run and emit the hook messages that carry the unusable id.
await page.waitForTimeout(8000)

// ---- change the setting BEFORE anything has been sent -----------------------

let picked = null
if (WHICH === 'model') {
  await page.evaluate(() => document.querySelector('.model-pill')?.click())
  await page.waitForTimeout(1500)
  picked = await page.evaluate(() => {
    const items = [...document.querySelectorAll('.model-menu-item')]
    const el = items.find((n) => n.textContent?.trim() && n.textContent.trim() !== 'Default')
    el?.click()
    return el?.textContent?.trim() ?? null
  })
} else {
  // The permission pill cycles on click rather than opening a menu.
  const before = await page.evaluate(
    () => document.querySelector('[aria-label="Permission mode"]')?.textContent?.trim() ?? null
  )
  await page.evaluate(() =>
    document.querySelector('[aria-label="Permission mode"]')?.click()
  )
  await page.waitForTimeout(1500)
  const after = await page.evaluate(
    () => document.querySelector('[aria-label="Permission mode"]')?.textContent?.trim() ?? null
  )
  // A pill that did not actually change never triggered permission:set, so the
  // ordering under test was never set up — that must fail, not pass quietly.
  picked = after !== before ? after : null
}
await page.waitForTimeout(2000)
if (!picked) {
  fails.push(`${WHICH} pill did not change — the ordering under test was never set up`)
}
log('PICK', { which: WHICH, picked })

// ---- then send ---------------------------------------------------------------

await page.evaluate(() => {
  const el = document.querySelector('.message-input')
  Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(el, 'say OK')
  el.dispatchEvent(new Event('input', { bubbles: true }))
})
await page.evaluate(() =>
  document
    .querySelector('.message-input')
    ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
)

await page.waitForTimeout(3000)
let done = false
for (let i = 0; i < 60; i++) {
  await page.waitForTimeout(2000)
  const busy = await page.evaluate(() => document.querySelector('.model-pill')?.disabled ?? false)
  if (!busy) {
    done = true
    break
  }
}

const state = await page.evaluate(() => ({
  errors: [...document.querySelectorAll('.msg-error')].map((n) => n.textContent?.trim() ?? ''),
  assistants: document.querySelectorAll('.msg-assistant').length,
  users: document.querySelectorAll('.msg-user').length
}))
log('TURN', { done, ...state })

// The turn has to have actually happened — "no error" is also true of a turn
// that never ran, which is the failure mode that made the first version of
// gui-52 pass vacuously.
if (state.users === 0) fails.push('nothing was sent — the send step never ran')
if (state.errors.length > 0) fails.push(`turn errored: ${state.errors[0]}`)
if (state.assistants === 0) fails.push('no assistant reply — the turn produced nothing')

await page.screenshot({ path: path.join(SHOT_DIR, `gui-54-${WHICH}.png`) })
console.log(fails.length === 0 ? 'PASS' : 'FAIL')
for (const f of fails) console.log('  - ' + f)
await app.close()
process.exit(fails.length === 0 ? 0 : 1)
