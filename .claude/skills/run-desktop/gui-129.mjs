// GUI driver for #129 — rewind a turn's file changes, in the BUILT app.
//
// WHAT THE SUITE ALREADY PROVES, so this does not repeat it:
// `tests/rewind-files.test.ts` pins the checkpointing option, the uuid stamp,
// the trust boundary and every refusal path against a stub;
// `tests/rewind-message.test.tsx` pins the two-gesture flow, the vocabulary and
// the disabled-while-busy rule in jsdom. Both were mutation-verified.
//
// WHAT ONLY THIS CAN PROVE, and it is the ticket's FIRST acceptance criterion:
//
//   THE FILE ACTUALLY GOES BACK, through the app's own IPC, in the shipped
//   bundle. Every other piece of evidence for this feature stops short of that.
//   `scripts/spike-129-findings.json` measured the SDK route with its OWN query
//   — this app's option shape, but not this app — and the suite's stub cannot
//   corroborate a fact about the CLI at all. The join between them (composer →
//   chat:send with a uuid → CLI stores it → chat:rewind → files move) exists
//   nowhere except here.
//
//   Plus the two things jsdom structurally cannot see: the control HIDDEN at
//   rest and REVEALED on hover, read as computed opacity off the BUILT
//   stylesheet (a raw-text pin proves a rule was written, never that the
//   cascade keeps it), and that the whole path works on the `file://` origin
//   production actually loads.
//
// COSTS ONE CLI TURN, deliberately and unavoidably: there is nothing to rewind
// until something has really edited a file. gui-123's zero-turn trick (removing
// main's `chat:send` listener) is exactly wrong here — it would leave the CLI
// with no checkpoint and the rewind would correctly refuse, which this driver
// would then report as a product failure.
//
// THE CONTROLS, because an absence assertion with no positive control measures
// nothing (#76):
//   * THE TURN MUST HAVE CHANGED THE FILE. Checked before anything is concluded.
//     If it did not, the run is UNSCORED — "the file came back" is trivially
//     true for a file that never left.
//   * THE DRY RUN MUST LEAVE IT MUTATED. Read off the disk between the two
//     gestures. This is what makes the preview a preview rather than a
//     differently-worded destructive call, and it is also the within-run
//     attribution: the file is observed mutated immediately before the second
//     gesture, so the revert belongs to that gesture and not to the first.
//   * THE PROMPT CARRIES AN ABSOLUTE PATH. A relative one made #127's model
//     write a file that was not the target and score a false negative.
//
// Red-first: run against a build without `enableFileCheckpointing` and phase 5
// reports the CLI's own "File rewinding is not enabled." instead of a preview;
// run against one whose control is missing and phase 4 stops at the selector.
//
//   node .claude/skills/run-desktop/gui-129.mjs
//
// Needs `npm run build` first, plus `npm i --no-save playwright-core`.

import { _electron as electron } from 'playwright-core'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import { profileArgs } from './driver-profile.mjs'

const APP_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const WORK_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'gui129-'))
const TARGET = path.join(WORK_DIR, 'rewind-target.txt')
const ORIGINAL = 'ORIGINAL\n'
fs.writeFileSync(TARGET, ORIGINAL)

const log = (l, m) => console.log(String(l).padEnd(12) + JSON.stringify(m))
const fails = []
const read = () => (fs.existsSync(TARGET) ? fs.readFileSync(TARGET, 'utf8') : null)

setTimeout(() => {
  console.log('TIMEOUT')
  process.exit(1)
}, 300000).unref?.()

const app = await electron.launch({
  executablePath: path.join(APP_DIR, 'node_modules/electron/dist/electron.exe'),
  args: ['--no-sandbox', ...profileArgs(), '.'],
  cwd: APP_DIR,
  env: process.env,
  timeout: 45000
})

const page = await app.firstWindow()
await page.waitForLoadState('domcontentloaded')

let unscored = null
const finish = async () => {
  console.log(unscored ? 'UNSCORED' : fails.length === 0 ? 'PASS' : 'FAIL')
  if (unscored) console.log('  ! ' + unscored)
  for (const f of fails) console.log('  - ' + f)
  await app.close().catch(() => {})
  try {
    fs.rmSync(WORK_DIR, { recursive: true, force: true })
  } catch {}
  process.exit(unscored ? 2 : fails.length === 0 ? 0 : 1)
}

// ---- phase 0: the origin, and that the route is even wired ------------------

const env = await page.evaluate(() => ({
  protocol: location.protocol,
  isSecureContext: window.isSecureContext,
  hasApi: typeof window.api?.rewindFiles === 'function'
}))
log('ENV', env)
if (env.protocol !== 'file:') {
  fails.push(
    `the renderer is on ${env.protocol}, not file: — this run does not measure the production origin, so nothing below is evidence about the shipped app`
  )
  await finish()
}
if (!env.hasApi) {
  fails.push('window.api.rewindFiles is missing from the built preload — the route never reaches the renderer')
  await finish()
}

// A drift alarm on main, asserted rather than cited: if the channel is renamed,
// this run must say so rather than time out somewhere downstream.
const wired = await app.evaluate(({ ipcMain }) => ({
  // Electron has no public "is this handled" read; invoking the private map is
  // the only one available, so its ABSENCE is treated as unknown rather than
  // as a failure.
  handlers: typeof ipcMain._invokeHandlers?.has === 'function'
    ? ipcMain._invokeHandlers.has('chat:rewind')
    : null
}))
log('WIRED', wired)
if (wired.handlers === false) {
  fails.push("main holds no `chat:rewind` invoke handler — the renderer's call can only ever reject")
  await finish()
}

// ---- phase 1: a real workspace with a file worth rewinding ------------------

await app.evaluate(({ dialog }, dir) => {
  dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [dir] })
}, WORK_DIR)

// DOM-dispatched: Playwright's actionability wait hangs on the intro animation
// (gui-93, gui-95, gui-96, gui-98, gui-122 and gui-123 all hit this).
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find(
    (b) =>
      b.getAttribute('aria-label') === 'Pick a project folder' ||
      b.textContent?.includes('Pick a project folder')
  )
  btn?.click()
})
await page.waitForSelector('.message-input', { timeout: 20000 })
log('WORKSPACE', { dir: path.basename(WORK_DIR), before: JSON.stringify(read()) })

// ---- phase 2: ONE real turn that edits the file ----------------------------

// Absolute, and spelled out. The turn has to genuinely run the Write tool or
// there is no checkpoint and nothing below means anything.
const PROMPT = `Use the Write tool to replace the entire contents of the file at this exact absolute path with the single line MUTATED: ${TARGET}\nThen reply with the single word DONE and nothing else.`

const composer = page.locator('.message-input')
await composer.fill(PROMPT)
await composer.press('Enter')
log('SENT', { chars: PROMPT.length })

// The turn is over when the composer's Stop button goes back to Send. Read off
// the app's own busy state rather than off any text the model chose to produce.
const ended = await page
  .waitForFunction(
    () => !document.querySelector('button[aria-label="Stop"], .send-btn--stop'),
    null,
    { timeout: 240000 }
  )
  .then(() => true)
  .catch(() => false)
await page.waitForTimeout(1500)
const afterTurn = read()
log('TURN', { ended, changed: afterTurn !== ORIGINAL, now: JSON.stringify(afterTurn) })

// THE POSITIVE CONTROL. Without it "the file came back" is trivially true.
if (afterTurn === ORIGINAL || afterTurn === null) {
  unscored = `the turn did not change the file (${JSON.stringify(afterTurn)}) — there was nothing to rewind, so nothing about rewind can be read off this run`
  await finish()
}

// ---- phase 3: the control exists, hidden at rest, revealed on hover ---------

const arrived = await page
  .waitForSelector('.msg-user button.bubble-rewind', { timeout: 15000 })
  .then(() => true)
  .catch(() => false)
if (!arrived) {
  const seen = await page.evaluate(() => ({
    userMessages: document.querySelectorAll('.msg-user').length,
    rewindControls: document.querySelectorAll('.bubble-rewind').length,
    reuseControls: document.querySelectorAll('.bubble-reuse').length
  }))
  fails.push(
    `no rewind control appeared on the sent message after 15s (${JSON.stringify(seen)}) — either the control is not in the shipped bundle or the message carries no rewindId`
  )
  await finish()
}

await app.evaluate(({ BrowserWindow, app: a }) => {
  const w = BrowserWindow.getAllWindows()[0]
  w?.show()
  w?.focus()
  a.focus({ steal: true })
})
await page.waitForTimeout(400)

// At rest: nothing hovered. `.message-input` holds focus after a send and is
// NOT inside `.msg-user`, so :focus-within cannot be reaching it here.
const atRest = await page.evaluate(() => {
  const btn = document.querySelector('.msg-user button.bubble-rewind')
  return {
    opacity: btn ? getComputedStyle(btn).opacity : null,
    // The DISCRIMINATION CONTROL: a sibling whose opacity must read 1 whatever
    // the rewind rule does. A reader that returns "0" for everything — a
    // detached node, a stylesheet that never loaded — reports UNSCORED here
    // instead of quietly passing the hidden-at-rest assertion.
    bubbleOpacity: getComputedStyle(document.querySelector('.msg-user .bubble')).opacity
  }
})
log('AT-REST', atRest)
if (atRest.bubbleOpacity !== '1') {
  unscored = `the discrimination control reads opacity ${atRest.bubbleOpacity} on the bubble itself — this reader is not resolving the built stylesheet, so the hidden-at-rest reading below is meaningless`
  await finish()
}
if (atRest.opacity !== '0') {
  fails.push(
    `the control reads opacity ${atRest.opacity} at rest — it should be invisible until the row is hovered or focused, like .bubble-reuse`
  )
}

await page.locator('.msg-user').first().hover()
// The reveal is a 150ms transition; a value read mid-flight is not a settled
// one (#123 called a 150ms reveal an invisible control off `opacity: 0.585`).
await page.waitForTimeout(500)
const hovered = await page.evaluate(() => {
  const btn = document.querySelector('.msg-user button.bubble-rewind')
  return { opacity: btn ? getComputedStyle(btn).opacity : null }
})
log('HOVERED', hovered)
if (hovered.opacity !== '1') {
  fails.push(
    `the control reads opacity ${hovered.opacity} under a settled hover — the reveal rule is not reaching it in the built cascade`
  )
}

// ---- phase 4: the preview, and it must move NOTHING -------------------------

await page.evaluate(() => document.querySelector('.msg-user button.bubble-rewind')?.click())

const previewed = await page
  .waitForSelector('.bubble-rewind-confirm, .bubble-rewind-note', { timeout: 30000 })
  .then(() => true)
  .catch(() => false)
const preview = await page.evaluate(() => ({
  summary: document.querySelector('.bubble-rewind-summary')?.textContent ?? null,
  note: document.querySelector('.bubble-rewind-note')?.textContent ?? null,
  hasConfirm: !!document.querySelector('.bubble-rewind-go')
}))
const afterDryRun = read()
log('PREVIEW', { previewed, ...preview, stillMutated: afterDryRun !== ORIGINAL })

if (!preview.hasConfirm) {
  fails.push(
    `the first gesture produced no confirmation — the app answered ${JSON.stringify(preview.note)}. With checkpointing on this should be a preview; that text is the CLI's own reason`
  )
  await finish()
}
// THE CONTROL THAT MAKES THE NEXT PHASE ATTRIBUTABLE, and a real assertion in
// its own right: a "preview" that already reverted the file is not a preview.
if (afterDryRun === ORIGINAL) {
  fails.push(
    'the DRY RUN already restored the file — the preview is destructive, so the second gesture is not a decision the user gets to make'
  )
  await finish()
}

// ---- phase 5: the destructive gesture, and the disk ------------------------

await page.evaluate(() => document.querySelector('.bubble-rewind-go')?.click())
const restored = await page
  .waitForFunction(() => !!document.querySelector('.bubble-rewind-note'), null, { timeout: 30000 })
  .then(() => true)
  .catch(() => false)
await page.waitForTimeout(500)

const afterWet = read()
const outcome = await page.evaluate(() => ({
  note: document.querySelector('.bubble-rewind-note')?.textContent ?? null,
  // The conversation must be exactly where it was. Rewind restores FILES.
  userBubbles: document.querySelectorAll('.msg-user .bubble').length,
  firstBubble: document.querySelector('.msg-user .bubble')?.textContent ?? null
}))
log('RESTORED', { restored, ...outcome, fileBack: afterWet === ORIGINAL, now: JSON.stringify(afterWet) })

if (afterWet !== ORIGINAL) {
  fails.push(
    `the file did not return to its pre-turn contents — it reads ${JSON.stringify(afterWet)} where ${JSON.stringify(ORIGINAL)} was expected. This is the ticket's first acceptance criterion and it is the only place it is measured end to end`
  )
}
if (outcome.userBubbles !== 1 || outcome.firstBubble !== PROMPT) {
  fails.push(
    `the conversation moved: ${outcome.userBubbles} user bubble(s), first reads ${JSON.stringify(outcome.firstBubble)}. Rewind restores FILES — the transcript must be untouched`
  )
}

await finish()
