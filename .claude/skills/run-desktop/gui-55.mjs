// GUI driver for #56 (spec #55) — prove the open transcript does NOT follow
// its file. Red-first: against the current build this run MUST fail, with the
// failure naming the right reason (transcript rendered once, no update after
// an external append). Its later green is what makes #57's fix trustworthy —
// a driver never seen failing proves nothing (gui-54's lesson).
//
// Scenario: a session driven from a terminal, viewed simultaneously in the
// wrapper. The driver plays the terminal side itself:
//
//   1. seed a terminal-shaped session file straight into the native store
//      (no CLI turn — deterministic, and the tail-eligible path is ADOPT,
//      never a session the app itself drove);
//   2. open it in the app (pick the workspace, click its sidebar row);
//   3. append a valid assistant line to the JSONL from OUTSIDE the app;
//   4. assert the new message appears in the pane with no interaction.
//
// Two confound guards make a vacuous verdict impossible (gui-52's lesson —
// pair every assertion with proof the input happened):
//   * the append is proven by the file GROWING (size before/after) — a static
//     pane over a failed append is not a finding;
//   * after the live check, the session is re-opened manually: the marker
//     appearing THEN proves the appended line is renderable, so a live miss
//     is the app not following the file, not the driver writing junk.
// Main's webContents.send is also recorded, to tell "main never broadcast
// after the append" apart from "the renderer ignored it".
//
//   node .claude/skills/run-desktop/gui-55.mjs
//
// Needs `npm run build` first, plus `npm i --no-save playwright-core`.
// Sends no prompt — no engine, no CLI, no tokens; everything is file + DOM.

import { _electron as electron } from 'playwright-core'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import crypto from 'node:crypto'
import { profileArgs } from './driver-profile.mjs'

const APP_DIR = path.resolve(import.meta.dirname, '../../..')
const SHOT_DIR = process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')
fs.mkdirSync(SHOT_DIR, { recursive: true })

// ---- seed a terminal-shaped session into the native store -------------------

const SID = crypto.randomUUID()
const SEED_PROMPT = 'LIVETAIL55 seed prompt from terminal'
const SEED_REPLY = 'LIVETAIL55 seed reply'
const MARKER = `LIVETAIL55-MARKER-${Date.now()}`

// Temp workspace kept out of anything sensitive-looking (Downloads etc.).
const WORKSPACE = fs.mkdtempSync(path.join(os.tmpdir(), 'livetail55-ws-'))
const STORE_DIR = path.join(os.homedir(), '.claude', 'projects', `livetail55-${SID.slice(0, 8)}`)
const FILE = path.join(STORE_DIR, `${SID}.jsonl`)

// Field shape copied from a real terminal session line (entrypoint "cli") —
// verified via a spike that the SDK's listSessions({includeProgrammatic:false})
// surfaces exactly this shape with the first prompt as its summary.
const base = {
  parentUuid: null,
  isSidechain: false,
  userType: 'external',
  entrypoint: 'cli',
  cwd: WORKSPACE,
  sessionId: SID,
  version: '2.1.217',
  gitBranch: ''
}
const seedUserUuid = crypto.randomUUID()
const seedReplyUuid = crypto.randomUUID()
const line = (rec) => JSON.stringify(rec) + '\n'
fs.mkdirSync(STORE_DIR, { recursive: true })
fs.writeFileSync(
  FILE,
  line({
    ...base,
    type: 'user',
    message: { role: 'user', content: SEED_PROMPT },
    uuid: seedUserUuid,
    timestamp: new Date(Date.now() - 60000).toISOString()
  }) +
    line({
      ...base,
      parentUuid: seedUserUuid,
      type: 'assistant',
      message: { role: 'assistant', content: [{ type: 'text', text: SEED_REPLY }] },
      uuid: seedReplyUuid,
      timestamp: new Date(Date.now() - 59000).toISOString()
    })
)

let cleaned = false
const cleanup = () => {
  if (cleaned) return
  cleaned = true
  try {
    fs.rmSync(STORE_DIR, { recursive: true, force: true })
  } catch {}
  try {
    fs.rmSync(WORKSPACE, { recursive: true, force: true })
  } catch {}
}

setTimeout(() => {
  console.log('TIMEOUT')
  cleanup()
  process.exit(1)
}, 180000).unref?.()

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

const log = (label, m) => console.log(label.padEnd(12) + JSON.stringify(m))
const fails = []

const finish = async () => {
  await page?.screenshot({ path: path.join(SHOT_DIR, 'gui-55.png') }).catch(() => {})
  console.log(fails.length === 0 ? 'PASS' : 'FAIL')
  for (const f of fails) console.log('  - ' + f)
  setTimeout(() => process.exit(fails.length === 0 ? 0 : 1), 5000).unref?.()
  await app.close().catch(() => {})
  cleanup()
  process.exit(fails.length === 0 ? 0 : 1)
}

// Stub the folder dialog in MAIN before any click that opens one; the path
// travels as an ARGUMENT. Also record every channel main sends, so a static
// pane can say whether main ever broadcast anything after the append at all.
await app.evaluate(({ dialog, BrowserWindow }, dir) => {
  dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [dir] })
  globalThis.__gui = { sends: [] }
  const wrap = (win) => {
    const wc = win.webContents
    const orig = wc.send.bind(wc)
    wc.send = (channel, ...args) => {
      globalThis.__gui.sends.push(channel)
      return orig(channel, ...args)
    }
  }
  BrowserWindow.getAllWindows().forEach(wrap)
}, WORKSPACE)

const sends = () => app.evaluate(() => globalThis.__gui?.sends ?? [])

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

// ---- adopt the seeded session ----------------------------------------------

// The seeded row must be in the CURRENT group (its cwd is the picked
// workspace), so clicking it is the in-project open — the adopt path the
// live-tail spec makes tail-eligible. Retry with the rail's own refresh
// button: listSessions may have run before the seed was visible to the SDK.
let rowFound = false
for (let i = 0; i < 10 && !rowFound; i++) {
  rowFound = await page.evaluate((seed) => {
    const row = [...document.querySelectorAll('.session-row-btn')].find((b) =>
      b.querySelector('.session-row-title')?.textContent?.includes(seed)
    )
    row?.click()
    return !!row
  }, SEED_PROMPT)
  if (!rowFound) {
    await page.evaluate(() =>
      document.querySelector('[aria-label="Refresh sessions"]')?.click()
    )
    await page.waitForTimeout(1000)
  }
}
if (!rowFound) {
  fails.push('could not drive: seeded session never appeared in the sidebar — nothing was adopted, the check under test never ran')
  await finish()
}

// Adopt must actually render the seed before the append means anything.
let adopted = false
for (let i = 0; i < 20 && !adopted; i++) {
  await page.waitForTimeout(500)
  adopted = await page.evaluate(
    (reply) =>
      [...document.querySelectorAll('.msg-assistant')].some((n) =>
        n.textContent?.includes(reply)
      ),
    SEED_REPLY
  )
}
if (!adopted) {
  fails.push('could not drive: clicking the seeded row never rendered its transcript — nothing was adopted, the check under test never ran')
  await finish()
}
const paneCount = () =>
  page.evaluate(() => document.querySelectorAll('.msg-user, .msg-assistant').length)
const countBefore = await paneCount()
log('ADOPTED', { sessionId: SID, paneMessages: countBefore })

// ---- append from outside the app -------------------------------------------

const sendsBefore = (await sends()).length
const sizeBefore = fs.statSync(FILE).size
fs.appendFileSync(
  FILE,
  line({
    ...base,
    parentUuid: seedReplyUuid,
    type: 'assistant',
    message: { role: 'assistant', content: [{ type: 'text', text: MARKER }] },
    uuid: crypto.randomUUID(),
    timestamp: new Date().toISOString()
  })
)
const sizeAfter = fs.statSync(FILE).size
log('APPEND', { file: FILE, sizeBefore, sizeAfter, grew: sizeAfter > sizeBefore })
if (sizeAfter <= sizeBefore) {
  fails.push('append did not grow the file — the input under test never happened, a static pane proves nothing')
  await finish()
}

// ---- the assertion: the pane follows, with no interaction -------------------

const markerVisible = () =>
  page.evaluate(
    (m) =>
      [...document.querySelectorAll('.msg-assistant')].some((n) =>
        n.textContent?.includes(m)
      ),
    MARKER
  )

let followed = false
for (let i = 0; i < 20 && !followed; i++) {
  await page.waitForTimeout(500)
  followed = await markerVisible()
}
const countAfter = await paneCount()
const sendsAfterAppend = (await sends()).slice(sendsBefore)
log('LIVE', {
  followed,
  paneMessages: `${countBefore} -> ${countAfter}`,
  ipcSinceAppend: sendsAfterAppend
})
if (!followed) {
  fails.push(
    `transcript rendered once, no update after append: file grew ${sizeBefore} -> ${sizeAfter} bytes, pane stayed at ${countAfter} messages for 10s with no interaction (main IPC since append: ${JSON.stringify(sendsAfterAppend)})`
  )
}

// ---- confound guard: the appended line IS renderable ------------------------

// Re-open the same row by hand. Marker appearing now proves the append was a
// valid transcript line the existing load path renders — so a live miss above
// is the app not following the file, not the driver writing junk. openSession
// has no same-id short-circuit; a re-click re-reads the file.
await page.evaluate((seed) => {
  const row = [...document.querySelectorAll('.session-row-btn')].find((b) =>
    b.querySelector('.session-row-title')?.textContent?.includes(seed)
  )
  row?.click()
}, SEED_PROMPT)
let onReopen = false
for (let i = 0; i < 16 && !onReopen; i++) {
  await page.waitForTimeout(500)
  onReopen = await markerVisible()
}
log('REOPEN', { rendersOnReopen: onReopen })
if (!onReopen) {
  fails.push('appended line did not render even on manual reopen — the driver append is invalid; fix the driver, not the app')
}

await finish()
