// GUI driver for #74 — the renderer must run SANDBOXED.
//
// vitest cannot observe `sandbox` at all: it never constructs a BrowserWindow,
// so a flag whose entire intended effect is that nothing changes looks
// identical whether it was set or forgotten. This driver measures the running
// window instead, and it measures the EFFECT rather than the request:
//
//   1. `getLastWebPreferences().sandbox` — what the window was constructed
//      with. Necessary, and on its own not sufficient: a process can carry the
//      flag and still be unsandboxed if the command line overrode it.
//   2. `app.getAppMetrics()` — the OS-level truth, joined to OUR renderer by
//      `webContents.getOSProcessId()`. This is the assertion that says the
//      process boundary actually moved.
//   3. A REAL turn through the contextBridge. `sandbox: true` changes how the
//      preload is loaded, so the only honest proof that the bridge survived is
//      a prompt that reaches the CLI and an answer that comes back.
//
// **This driver deliberately launches WITHOUT `--no-sandbox`, unlike every
// other driver in this set.** That flag disables OS sandboxing for the whole
// app, so a driver carrying it would measure `sandbox: true` on a process
// Chromium had already been told not to sandbox — a green that means nothing.
// Same shape as gui-69 keeping the GPU on: the driver must ESTABLISH the state
// it asserts (#65), not inherit a launch line that erases it.
//
// The sandbox assertions are FINDINGS, not premises, so the run continues past
// them on purpose: with the flag flipped back the driver still runs its turn,
// which is what shows the bridge worked before AND after and only the process
// boundary moved.
//
// Platform note: `ProcessMetric.sandboxed` is documented for macOS and Windows.
// This repo's driver set is win32-verified. On Linux the field may be absent,
// which reads here as `sandboxed: undefined` — that is a driver limit on that
// platform, not the renderer being unsandboxed. Check assertion 1 to tell them
// apart: flag true + metric undefined is the limit, flag false is the defect.
//
//   node .claude/skills/run-desktop/gui-74.mjs
//
// Needs `npm run build` first, plus `npm i --no-save playwright-core`.
// Costs one real CLI turn.

import { _electron as electron } from 'playwright-core'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import { profileArgs } from './driver-profile.mjs'

const APP_DIR = path.resolve(import.meta.dirname, '../../..')
const SHOT_DIR = process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')
fs.mkdirSync(SHOT_DIR, { recursive: true })

// Random so a reply cannot be a stale transcript from an earlier run.
const SECRET = String(Math.floor(Math.random() * 9000) + 1000)
const WORKSPACE = fs.mkdtempSync(path.join(os.tmpdir(), 'gui74-ws-'))

// The bridge methods the app cannot work without. Not the whole surface — an
// exact list would rot every time a channel is added — but a preload that
// failed to load under the sandbox exposes NONE of them, and one that loaded
// against a stale bundle is missing the newest (`onEngineTerminal`, #73).
const REQUIRED_API = [
  'sendPrompt',
  'onChatEvent',
  'onEngineTerminal',
  'switchWorkspace',
  'listSessions',
  'pickFolder',
  'currentSessionId',
  'setBackdrop'
]

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

// ---- launch, sandbox INTACT -------------------------------------------------

const electronBin =
  process.platform === 'win32'
    ? path.join(APP_DIR, 'node_modules/electron/dist/electron.exe')
    : process.platform === 'darwin'
      ? path.join(APP_DIR, 'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron')
      : path.join(APP_DIR, 'node_modules/electron/dist/electron')

// No `--no-sandbox` here. See the header — it is the whole point of the file.
const app = await electron.launch({
  executablePath: electronBin,
  args: ['--disable-gpu', ...profileArgs(), '.'],
  cwd: APP_DIR,
  env: process.env,
  timeout: 30000
})

let page
const finish = async () => {
  await page?.screenshot({ path: path.join(SHOT_DIR, 'gui-74.png') }).catch(() => {})
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

// ---- 1. the flag, read off the live window ----------------------------------

const prefs = await app.evaluate(({ BrowserWindow }) => {
  const win = BrowserWindow.getAllWindows()[0]
  if (!win) return null
  const p = win.webContents.getLastWebPreferences() ?? {}
  return {
    sandbox: p.sandbox ?? null,
    contextIsolation: p.contextIsolation ?? null,
    nodeIntegration: p.nodeIntegration ?? null,
    rendererPid: win.webContents.getOSProcessId()
  }
})
log('PREFS', prefs)
if (!prefs) {
  fails.push(
    'could not drive: main reports no BrowserWindow, so there was no window whose sandbox could be read'
  )
  await finish()
}
if (prefs.sandbox !== true) {
  fails.push(
    `the window was constructed with sandbox: ${JSON.stringify(prefs.sandbox)} — the renderer that parses arbitrary model output and reads arbitrary files is the one process not sandboxed`
  )
}
// Free to assert on the same read, and they are the rest of this boundary: the
// preload's isolation is what makes contextBridge the only way in.
if (prefs.contextIsolation !== true) {
  fails.push(`contextIsolation is ${JSON.stringify(prefs.contextIsolation)}, must be true`)
}
if (prefs.nodeIntegration === true) {
  fails.push('nodeIntegration is enabled in the renderer')
}

// ---- 2. the OS-level effect, joined to OUR renderer by pid ------------------

// The flag is a request; this is whether it was granted. Reading the metric for
// `rendererPid` specifically is what stops a stray sandboxed utility process
// from answering for the renderer.
const metrics = await app.evaluate(({ app: a }) =>
  a.getAppMetrics().map((m) => ({ pid: m.pid, type: m.type, name: m.name, sandboxed: m.sandboxed }))
)
const mine = metrics.find((m) => m.pid === prefs.rendererPid) ?? null
log('METRICS', { rendererPid: prefs.rendererPid, mine, all: metrics })
if (!mine) {
  fails.push(
    `could not drive: no process metric matched the renderer pid ${prefs.rendererPid}, so the OS-level sandbox state was never actually read`
  )
} else if (mine.sandboxed !== true) {
  fails.push(
    `the renderer process (pid ${mine.pid}, type ${mine.type}) reports sandboxed: ${JSON.stringify(mine.sandboxed)} — the flag alone is not the effect`
  )
}

// ---- 3. the bridge survived --------------------------------------------------

// A sandboxed preload gets a restricted loader. If that had cost the app its
// preload, `window.api` would be undefined and every one of these missing.
const bridge = await page.evaluate((required) => {
  const api = globalThis.api
  if (!api) return { present: false, keys: [], missing: required }
  const keys = Object.keys(api)
  return {
    present: true,
    count: keys.length,
    keys,
    missing: required.filter((k) => typeof api[k] !== 'function')
  }
}, REQUIRED_API)
log('BRIDGE', { present: bridge.present, count: bridge.count, missing: bridge.missing })
if (!bridge.present) {
  fails.push(
    'window.api is undefined — the preload did not run, so contextBridge exposed nothing and the app has no way to reach main'
  )
} else if (bridge.missing.length > 0) {
  fails.push(`window.api is missing ${bridge.missing.join(', ')} — the preload loaded incomplete`)
}

// ---- 4. a REAL turn, end to end ---------------------------------------------

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
    'could not drive: the composer never appeared after picking a folder, so no prompt could be sent — the bridge check under test never ran'
  )
  await finish()
}

await page.evaluate((t) => {
  const el = document.querySelector('.message-input')
  Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(el, t)
  el.dispatchEvent(new Event('input', { bubbles: true }))
}, `Reply with exactly: ${SECRET}`)
await page.evaluate(() =>
  document
    .querySelector('.message-input')
    ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
)

// Busy is read off the model pill, as gui-54 and gui-73 do.
let wentBusy = false
for (let i = 0; i < 40 && !wentBusy; i++) {
  await page.waitForTimeout(500)
  wentBusy = await page.evaluate(() => document.querySelector('.model-pill')?.disabled ?? false)
}
let idle = false
if (wentBusy) {
  for (let i = 0; i < 90 && !idle; i++) {
    await page.waitForTimeout(2000)
    idle = !(await page.evaluate(() => document.querySelector('.model-pill')?.disabled ?? false))
  }
}
const reply = await page.evaluate(() =>
  [...document.querySelectorAll('.msg-assistant')].map((n) => n.textContent ?? '').join(' | ')
)
const errText = await page.evaluate(() =>
  [...document.querySelectorAll('.msg-error')].map((n) => n.textContent ?? '').join(' | ')
)
log('TURN', {
  wentBusy,
  completed: idle,
  echoed: reply.includes(SECRET),
  secret: SECRET,
  reply: reply.slice(0, 120),
  error: errText.slice(0, 160)
})
// `wentBusy` is a PREMISE — a prompt that never left the renderer means the send
// path never ran, which is a bridge failure and not an inconclusive run.
if (!wentBusy) {
  fails.push(
    `the prompt never reached the engine: the composer accepted it and no turn ever started${errText ? ` (pane error: "${errText.slice(0, 120)}")` : ''} — sending is the first thing that crosses the contextBridge`
  )
} else if (!idle) {
  fails.push('the turn started but never finished — the engine is reachable but the stream is not')
} else if (!reply.includes(SECRET)) {
  fails.push(
    `a turn completed but the reply does not carry ${SECRET}: "${reply.slice(-140)}" — the round trip did not deliver the answer`
  )
}

await finish()
