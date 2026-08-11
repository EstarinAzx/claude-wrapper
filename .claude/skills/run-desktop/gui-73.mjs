// GUI driver for #73 — recovering from a terminal stream death must KEEP the
// conversation.
//
// vitest can prove the renderer calls switchWorkspace with the dead session's
// id. It cannot prove the SDK then accepts that id, because it never runs a
// CLI. This driver does the whole thing for real:
//
//   1. pick a temp workspace and run a REAL turn that plants a number;
//   2. kill the claude.exe process tree from OUTSIDE — not close(), not a
//      stubbed error. That is a genuine abnormal death: the engine's consuming
//      stream throws and the engine goes terminal, exactly as it does when auth
//      expires or the CLI crashes;
//   3. assert the restart control appears (it must NOT appear for a per-turn
//      error, which vitest pins separately);
//   4. click it once, and assert BOTH halves of AC3 — the conversation is back
//      in the pane, AND the rebuilt engine can continue it: a second real turn
//      asks for the planted number and gets it back.
//
// Step 4's second half is the one nothing else can prove. A rebuilt engine that
// resumed the WRONG session, or none, still renders a pane full of restored
// transcript — it just cannot answer the question.
//
// Establishes its own premise (#65) and fails loudly rather than passing
// vacuously: if the turn never ran, or the kill never killed anything, or the
// engine never went terminal, that is a FAIL naming the setup step, not a pass.
//
//   node .claude/skills/run-desktop/gui-73.mjs
//
// Needs `npm run build` first, plus `npm i --no-save playwright-core`.
// Costs three real CLI turns.

import { _electron as electron } from 'playwright-core'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import { profileArgs } from './driver-profile.mjs'

const APP_DIR = path.resolve(import.meta.dirname, '../../..')
const SHOT_DIR = process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')
fs.mkdirSync(SHOT_DIR, { recursive: true })

// Random so a resumed answer cannot be a stale transcript from an earlier run.
const SECRET = String(Math.floor(Math.random() * 9000) + 1000)
const WORKSPACE = fs.mkdtempSync(path.join(os.tmpdir(), 'gui73-ws-'))

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
}, 600000).unref?.()

// ---- the abnormal kill ------------------------------------------------------

// Every claude.exe under THIS driver process — the app's CLI child and nothing
// else. Walking down from our own pid is what keeps an unrelated Claude Code on
// the machine (this agent's own session, for instance) out of the blast radius.
const claudeDescendants = () => {
  const raw = execFileSync(
    'powershell.exe',
    [
      '-NoProfile',
      '-Command',
      'Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,Name | ConvertTo-Json -Compress'
    ],
    { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }
  )
  const all = JSON.parse(raw)
  const byParent = new Map()
  for (const p of all) {
    const list = byParent.get(p.ParentProcessId) ?? []
    list.push(p)
    byParent.set(p.ParentProcessId, list)
  }
  const out = []
  const walk = (pid) => {
    for (const child of byParent.get(pid) ?? []) {
      if (String(child.Name).toLowerCase() === 'claude.exe') out.push(child.ProcessId)
      walk(child.ProcessId)
    }
  }
  walk(process.pid)
  return out
}

// ---- launch -----------------------------------------------------------------

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
  await page?.screenshot({ path: path.join(SHOT_DIR, 'gui-73.png') }).catch(() => {})
  console.log(fails.length === 0 ? 'PASS' : 'FAIL')
  for (const f of fails) console.log('  - ' + f)
  // Hard exit armed before awaiting close: a wedged Electron must not hang the
  // verdict that has already been decided.
  setTimeout(() => process.exit(fails.length === 0 ? 0 : 1), 5000).unref?.()
  await app.close().catch(() => {})
  cleanup()
  process.exit(fails.length === 0 ? 0 : 1)
}

// The path travels as an ARGUMENT — a closure would not survive the hop.
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
await page.waitForSelector('.message-input', { timeout: 20000 })

// ---- helpers ----------------------------------------------------------------

const send = async (text) => {
  await page.evaluate((t) => {
    const el = document.querySelector('.message-input')
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(el, t)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }, text)
  await page.evaluate(() =>
    document
      .querySelector('.message-input')
      ?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
      )
  )
}

// Busy is read off the model pill, as gui-54 does.
const waitIdle = async (ticks = 90) => {
  await page.waitForTimeout(2000)
  for (let i = 0; i < ticks; i++) {
    await page.waitForTimeout(2000)
    const busy = await page.evaluate(
      () => document.querySelector('.model-pill')?.disabled ?? false
    )
    if (!busy) return true
  }
  return false
}

const assistantText = () =>
  page.evaluate(() =>
    [...document.querySelectorAll('.msg-assistant')].map((n) => n.textContent ?? '').join(' | ')
  )

const paneText = () =>
  page.evaluate(() =>
    [...document.querySelectorAll('.msg-user, .msg-assistant')]
      .map((n) => n.textContent ?? '')
      .join(' | ')
  )

const restartControl = () =>
  page.evaluate(() => {
    const b = document.querySelector('.switch-refusal-retry--restart')
    return b ? { label: b.getAttribute('aria-label'), text: b.textContent } : null
  })

// ---- 1. a real turn, planting the number ------------------------------------

await send(`Remember this number: ${SECRET}. Reply with exactly: OK`)
const turn1 = await waitIdle()
const afterTurn1 = await assistantText()
log('TURN-1', { completed: turn1, reply: afterTurn1.slice(0, 120) })
if (!turn1 || afterTurn1.length === 0) {
  fails.push(
    'could not drive: the first real turn never completed, so no session exists to resume — the check under test never ran'
  )
  await finish()
}

// ---- 2. kill the CLI mid-turn, abnormally -----------------------------------

// The kill lands DURING a turn on purpose. That is the scenario the ticket is
// about — the user is mid-conversation, the CLI dies, and the app shows the
// "Pick the folder again to restart" copy that costs them the session.
//
// Measured while building this driver, and worth knowing: killing the CLI
// BETWEEN turns produces no error in the pane at all, because the engine only
// emits into an active turn (`if (turnResolve)`). The app is simply silent
// until the next prompt is spent on a dead engine. That is exactly why the
// terminal signal is out of band rather than an EngineEvent — and the control
// appears in that silent case too, where nothing else would.
await send('Count slowly from 1 to 40, one number per line, with a short pause between each.')
let inFlight = false
for (let i = 0; i < 40 && !inFlight; i++) {
  await page.waitForTimeout(500)
  inFlight = await page.evaluate(
    () => document.querySelector('.model-pill')?.disabled ?? false
  )
}
log('TURN-2', { inFlight })
if (!inFlight) {
  fails.push(
    'could not drive: the second turn never went busy, so there was no in-flight turn to kill — the terminal path under test was never reached'
  )
  await finish()
}

const pids = claudeDescendants()
log('KILL', { claudePids: pids })
if (pids.length === 0) {
  fails.push(
    'could not drive: found no claude.exe under the app to kill — nothing died, so the terminal state under test was never reached'
  )
  await finish()
}
for (const pid of pids) {
  try {
    execFileSync('taskkill.exe', ['/F', '/T', '/PID', String(pid)], { stdio: 'ignore' })
  } catch {}
}
// Prove the kill KILLED. A taskkill that silently failed would leave a healthy
// app, and every assertion below would then be measuring the wrong thing.
await page.waitForTimeout(2000)
const survivors = claudeDescendants()
log('KILLED', { survivors })
if (survivors.length > 0) {
  fails.push(
    `could not drive: claude.exe survived the kill (${survivors.join(',')}) — the CLI never died, so nothing under test happened`
  )
  await finish()
}

// The engine only notices the death when its stream unwinds. An error message
// in the pane is the proof the app actually went terminal, and it is a
// PREMISE here, not the finding — without it the control assertion below would
// be measuring an app that never broke.
let errored = false
for (let i = 0; i < 30 && !errored; i++) {
  await page.waitForTimeout(1000)
  errored = await page.evaluate(() => document.querySelectorAll('.msg-error').length > 0)
}
const errText = await page.evaluate(
  () => [...document.querySelectorAll('.msg-error')].map((n) => n.textContent ?? '').join(' | ')
)
log('DEATH', { errorShown: errored, text: errText.slice(0, 160) })
if (!errored) {
  fails.push(
    'could not drive: killing the CLI produced no error in the pane — the engine never went terminal, so there was nothing to recover from'
  )
  await finish()
}

// ---- 3. the control ---------------------------------------------------------

let control = null
for (let i = 0; i < 20 && !control; i++) {
  await page.waitForTimeout(500)
  control = await restartControl()
}
log('CONTROL', control)
if (!control) {
  fails.push(
    `no restart control after a terminal stream death: the pane shows the error ("${errText.slice(0, 90)}") and the only way out the app offers is re-picking the folder, which discards the conversation`
  )
  await finish()
}
if (control.label !== 'Restart and resume this conversation') {
  fails.push(
    `the control does not offer to RESUME (aria-label ${JSON.stringify(control.label)}) — a session was recorded by turn 1, so the honest-fallback copy here means the resumable id was lost`
  )
}

// ---- 4. one activation: pane restored AND the engine can continue -----------

const before = await paneText()
await page.evaluate(() => document.querySelector('.switch-refusal-retry--restart')?.click())

let restored = false
for (let i = 0; i < 30 && !restored; i++) {
  await page.waitForTimeout(1000)
  const now = await paneText()
  restored = now.includes(SECRET) && now.length > 0
}
const afterRestart = await paneText()
const controlGone = (await restartControl()) === null
log('RESTART', {
  paneRestored: restored,
  controlRetired: controlGone,
  paneChars: `${before.length} -> ${afterRestart.length}`
})
if (!restored) {
  fails.push(
    `activating the control emptied the pane instead of restoring it: the planted prompt (${SECRET}) is gone, ${afterRestart.length} chars left — this is the resumeId: null bug`
  )
}
if (!controlGone) {
  fails.push('the control stayed up after a successful restart — it must retire with the dead engine')
}

// The half nothing else can prove: the REBUILT engine is on the same
// conversation. A wrong resume renders a full pane and still cannot answer.
await send('What number did I ask you to remember? Reply with only the digits.')
const turn2 = await waitIdle()
const finalText = await assistantText()
const remembered = finalText.includes(SECRET)
log('CONTINUE', {
  completed: turn2,
  remembered,
  secret: SECRET,
  tail: finalText.slice(-160)
})
if (!turn2) {
  fails.push('the rebuilt engine never finished a turn — it is not able to continue anything')
} else if (!remembered) {
  fails.push(
    `the rebuilt engine ran a turn but did NOT have the conversation: asked for ${SECRET} and got "${finalText.slice(-120)}" — the pane was refilled from disk while the engine started a fresh session`
  )
}

await finish()
