// GUI eyeball for the Agents dock — the cwd gate, the single-slot swap, and the
// Background strip's render path.
//
//   node .claude/skills/run-desktop/gui-agents-dock.mjs
//
// Needs `npm run build` first. Costs NO CLI turns: the dock's agent half reads
// disk, and the background half is driven here by a SYNTHETIC push (see below).
//
// Observational, like gui-scope-zoom-pill — it records what the surface does
// rather than pinning a ticket's acceptance criteria. Still judged by EXIT CODE:
// every phase below is a hard check and a failure names the step.
//
// The background half is exercised by pushing `tasks:changed` from MAIN, the
// same channel the preload subscribes to (preload/index.ts:129). That is the
// real preload → useChat → AgentsDock render path with a FAKE payload — it says
// nothing about whether the CLI ever emits `background_tasks_changed`, which
// #81 measured separately. Phrase any finding from phase 6 as "the renderer
// draws a pushed set", never as "background tasks work end to end".

import { _electron as electron } from 'playwright-core'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'

const APP_DIR = path.resolve(import.meta.dirname, '../../..')
const SHOT_DIR = process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')
fs.mkdirSync(SHOT_DIR, { recursive: true })
const PICK_DIR = APP_DIR

const fails = []
const check = (label, ok, detail) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ${JSON.stringify(detail)}`)
  if (!ok) fails.push(label)
}

setTimeout(() => {
  console.log('TIMEOUT')
  process.exit(1)
}, 180000).unref?.()

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

await app.evaluate(async ({ dialog }, dir) => {
  dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [dir] })
}, PICK_DIR)


const page = await app.firstWindow()
await page.waitForSelector('[aria-label="Backend mode"]', { timeout: 15000 })

// Whole-window shot. Deliberately does NOT resize the window first: the saved
// bounds are ~688css wide, so the dock sits half outside the frame — but a
// `setSize` here revokes what this driver measures (#77). Widening mid-run was
// tried and the very next frame came back with the dock AND both titlebar
// toggles gone, disagreeing with DOM checks that had just passed. Suspect the
// instrument, not the app: use `shotEl` below for anything clipped.
const shot = async (name) => {
  const p = path.join(SHOT_DIR, `agents-dock-${name}.png`)
  await page.screenshot({ path: p })
  console.log(`SHOT ${p}`)
}

// Element shot — captures the node at its own size regardless of the window's,
// which is what makes the clipped dock eyeballable without touching bounds.
const shotEl = async (name, sel) => {
  const p = path.join(SHOT_DIR, `agents-dock-${name}.png`)
  const el = await page.$(sel)
  if (el === null) {
    console.log(`SHOT ${name} SKIPPED — no ${sel}`)
    return
  }
  await el.screenshot({ path: p })
  console.log(`SHOT ${p}`)
}

const present = (sel) => page.evaluate((s) => !!document.querySelector(s), sel)
const attr = (sel, a) =>
  page.evaluate(([s, a]) => document.querySelector(s)?.getAttribute(a) ?? null, [sel, a])
const text = (sel) =>
  page.evaluate((s) => document.querySelector(s)?.textContent?.trim() ?? null, sel)
const clickBySel = (sel) => page.evaluate((s) => document.querySelector(s)?.click(), sel)

const AGENTS_BTN = '[aria-label="Agents panel"]'
const APPEARANCE_BTN = '[aria-label="Appearance panel"]'

// ---- phase 1: the cwd gate ------------------------------------------------
// The absence below is only a measurement if we are genuinely pre-pick, so the
// premise is asserted FIRST (#65, and #81's untested-negative lesson): the
// Welcome chooser must be on screen. Without that line, "no agents button"
// would pass just as well against a window that failed to render at all.
const preWelcome = await page.evaluate(() =>
  [...document.querySelectorAll('button')].some((b) => b.textContent?.includes('Pick a project folder'))
)
check('premise: pre-pick Welcome is on screen', preWelcome, { welcomeButton: preWelcome })
check('no workspace → NO agents button', !(await present(AGENTS_BTN)), {
  agentsButton: await present(AGENTS_BTN)
})
await shot('1-pre-pick')

// ---- phase 2: pick a folder ----------------------------------------------
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find(
    (b) =>
      b.getAttribute('aria-label') === 'Pick a project folder' ||
      b.textContent?.includes('Pick a project folder')
  )
  btn?.click()
})
await page.waitForSelector('.session-group-head', { timeout: 20000 })
await page.waitForSelector(AGENTS_BTN, { timeout: 10000 })
check('workspace open → agents button appears', await present(AGENTS_BTN), {
  pressed: await attr(AGENTS_BTN, 'aria-pressed'),
  title: await attr(AGENTS_BTN, 'title')
})

// ---- phase 3: open the dock ----------------------------------------------
check('dock closed before the click', !(await present('.agents-dock')), {})
await clickBySel(AGENTS_BTN)
await page.waitForSelector('.agents-dock', { timeout: 10000 })
check('click → dock opens', await present('.agents-dock'), {
  pressed: await attr(AGENTS_BTN, 'aria-pressed'),
  title: await text('.agents-dock-title'),
  empty: await text('.agents-dock-empty'),
  modes: await page.evaluate(() =>
    [...document.querySelectorAll('.agents-dock-mode')].map((b) => b.getAttribute('aria-label'))
  ),
  resizeHandle: await present('.agents-dock-resize-handle')
})
await shot('2-open')
await shotEl('2-open-dock', '.agents-dock')

// ---- phase 4: single slot -------------------------------------------------
// openDock holds ONE value, so opening Appearance must REPLACE Agents rather
// than stack beside it.
await clickBySel(APPEARANCE_BTN)
await page.waitForSelector('.appearance-dock', { timeout: 10000 })
check('appearance REPLACES agents (single slot)', !(await present('.agents-dock:not(.appearance-dock)')), {
  agentsDockStandalone: await present('.agents-dock:not(.appearance-dock)'),
  appearanceDock: await present('.appearance-dock'),
  agentsPressed: await attr(AGENTS_BTN, 'aria-pressed')
})

// ---- phase 5: reopen, then toggle closed ---------------------------------
await clickBySel(AGENTS_BTN)
await page.waitForSelector('.agents-dock:not(.appearance-dock)', { timeout: 10000 })
check('reopen works', await present('.agents-dock:not(.appearance-dock)'), {})

// ---- phase 6: the Background strip, SYNTHETICALLY pushed -----------------
// Two tasks in one push: a local_bash that must render, and a local_agent that
// must NOT (nonAgentTasks drops it — a subagent already owns a row above).
// Neither carries parentAgentToolUseId, so both are "loose" and the bash one
// belongs in the Background section rather than nested.
check('strip absent while nothing is pushed', !(await present('.background-tasks')), {})

const push = (tasks) =>
  app.evaluate(({ BrowserWindow }, tasks) => {
    const win = BrowserWindow.getAllWindows()[0]
    win.webContents.send('tasks:changed', tasks)
  }, tasks)

// Collapse the sessions rail before the strip lands — it frees ~310css and
// brings the dock inside the frame at the app's own persisted bounds, which is
// what makes the Background strip photographable WITHOUT resizing the window.
// A layout change, not a state change: `collapsed` is Sidebar-local.
await clickBySel('[aria-label="Collapse sessions"]')
await page.waitForTimeout(300)

await push([
  { taskId: 'synthetic-bash-1', taskType: 'local_bash', description: 'npm run build (synthetic)' },
  { taskId: 'synthetic-agent-1', taskType: 'local_agent', description: 'must not render here' }
])
await page.waitForSelector('.background-tasks', { timeout: 10000 })
const rows = await page.evaluate(() =>
  [...document.querySelectorAll('.background-task-row')].map((li) => ({
    desc: li.querySelector('.background-task-desc')?.textContent ?? null,
    type: li.querySelector('.background-task-type')?.textContent ?? null,
    tag: li.tagName,
    clickable: !!li.querySelector('button')
  }))
)
check('pushed local_bash renders in Background', rows.length === 1, {
  title: await text('.background-tasks-title'),
  rows
})
check('local_agent is FILTERED OUT of the strip', !rows.some((r) => r.type === 'local_agent'), {
  types: rows.map((r) => r.type)
})
check('rows are non-interactive (no sidecar, no transcript)', !rows.some((r) => r.clickable), {})
await shot('3-background')
await shotEl('3-background-dock', '.agents-dock')

// REPLACE semantics: an empty level must clear the strip, not leave it standing.
await push([])
await page.waitForFunction(() => !document.querySelector('.background-tasks'), { timeout: 10000 })
check('empty push CLEARS the strip (replace, not append)', !(await present('.background-tasks')), {})

// ---- phase 7: toggle closed ----------------------------------------------
await clickBySel(AGENTS_BTN)
await page.waitForFunction(() => !document.querySelector('.agents-dock'), { timeout: 10000 })
check('second click closes the dock', !(await present('.agents-dock')), {
  pressed: await attr(AGENTS_BTN, 'aria-pressed')
})

await app.close()
console.log(fails.length === 0 ? 'ALL GREEN' : `RED: ${fails.join(' | ')}`)
process.exit(fails.length === 0 ? 0 : 1)
