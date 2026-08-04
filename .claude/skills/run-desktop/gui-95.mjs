// GUI eyeball for #95 — `.subagent-drawer-backdrop` is not a keyboard tab stop,
// while everything a keyboard user actually wants in the drawer still is.
//
//   node .claude/skills/run-desktop/gui-95.mjs
//
// Needs `npm run build` first, plus playwright-core. Costs NO CLI turns.
//
// Why this driver exists at all, given #93 already shipped a focus pass: #93's
// contract was CSS-only, and this is a JSX change. More to the point, #93 could
// not reach ANY control inside this drawer by keyboard and fell back to a static
// check on the built CSS, labelling it as weaker. This driver does not need that
// fallback — see below.
//
// THE DRAWER IS OPENED WITHOUT A LIVE TURN. The ticket predicts (from #93's
// experience) that reaching this surface needs a real turn that spawns a
// subagent. It does not. `chat:event` is a preload-subscribed channel
// (preload/index.ts:144), so main can push the same two events the engine would
// emit — a `Task` tool-use and a `subagent` presence tick — and `useChat` grows
// the clickable `.subagent-row` from them. That is the identical trick
// `gui-agents-dock.mjs` uses for the Background strip, and the same shape
// `tests/subagent-viewer.test.tsx` emits in jsdom.
//
// What that buys, and what it does NOT: the drawer, its scrim, and its close
// button are the app's REAL components in a REAL window with REAL styles, and
// the Tab presses below are real keys. The synthetic part is only the two events
// that put a subagent card on screen. So this says nothing about whether the CLI
// emits those events — #84/#85 measured that separately — and every claim here
// is about the tab order, which is exactly what the ticket asks for.
//
// Two traps this is built around:
//
//   1. "The backdrop is absent from the tab order" is an ABSENCE assertion, and
//      this project has been bitten five times (#76, #82, #93, #94, #91). It
//      passes trivially against a drawer that never opened. So the walk must
//      also show `.subagent-drawer-close` IS reached — same walk, same keys. If
//      the drawer were shut, both would be missing and the run fails loudly on
//      the second one rather than passing on the first.
//   2. The sessions rail is ~100 real tab stops. It is collapsed first, and the
//      collapse is verified, or the walk spends its budget inside the list and a
//      present control reads as absent.
//
// `el.focus()` does not prove tab-order membership, so every asserted move below
// is a real key press. Opening the viewer must put focus inside it; that initial
// stop is also the cycle marker for both walks.
//
// RED-VERIFIED for #99 with initial focus already live but the trap removed:
// both walks escape at stop 1, the composer is forward stop 13, and exit is 1.

import { _electron as electron } from 'playwright-core'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'

const APP_DIR = path.resolve(import.meta.dirname, '../../..')
const SHOT_DIR = process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')
fs.mkdirSync(SHOT_DIR, { recursive: true })

// A temp workspace, and only its basename is ever printed — #90's scrubbing rule
// keeps the OS username out of anything that lands in the repo.
const WORK_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'gui95-'))

const ROOT = '.subagent-drawer-root'
const BACKDROP = '.subagent-drawer-backdrop'
const CLOSE = '.subagent-drawer-close'
const ROW = '.subagent-row'
const COMPOSER = '.message-input'
const PARENT_TOOL_USE_ID = 'gui95-task'

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
}, WORK_DIR)

const page = await app.firstWindow()
await page.waitForSelector('[aria-label="Backend mode"]', { timeout: 15000 })

const present = (sel) => page.evaluate((s) => !!document.querySelector(s), sel)

// ---- phase 1: open a workspace -------------------------------------------
// DOM-dispatched: Playwright's actionability wait hangs on the intro animation
// (gui-93 hit the same thing).
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find(
    (b) =>
      b.getAttribute('aria-label') === 'Pick a project folder' ||
      b.textContent?.includes('Pick a project folder')
  )
  btn?.click()
})
await page.waitForSelector('.session-group-head', { timeout: 20000 })
console.log(`--- workspace open (fixture: ${path.basename(WORK_DIR)}) ---`)

// ---- phase 2: collapse the sessions rail ---------------------------------
// State this driver ESTABLISHES, not state it inherits. ~100 session rows are
// real tab stops; with the rail open the walk below never leaves the list.
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('.sidebar-toggle')].find(
    (b) => b.getAttribute('aria-label') === 'Collapse sessions'
  )
  btn?.click()
})
await page.waitForTimeout(800)
const stillOpen = await page.evaluate(() => document.querySelectorAll('.session-row').length)
check('sessions rail collapsed before the walk', stillOpen === 0, { rowsStillInTabOrder: stillOpen })

// ---- phase 3: put a subagent on screen, no live turn ---------------------
const pushChat = (ev) =>
  app.evaluate(({ BrowserWindow }, ev) => {
    const win = BrowserWindow.getAllWindows()[0]
    win.webContents.send('chat:event', ev)
  }, ev)

await pushChat({
  type: 'tool-use',
  id: PARENT_TOOL_USE_ID,
  name: 'Task',
  input: { subagent_type: 'Explore', description: 'gui-95 fixture' }
})
await pushChat({
  type: 'subagent',
  parentToolUseId: PARENT_TOOL_USE_ID,
  status: 'running',
  agentType: 'Explore'
})

// A missing row is a hard failure, never a quiet skip: everything below would
// pass vacuously without it.
await page.waitForSelector(ROW, { timeout: 10000 }).catch(() => {})
check('synthetic push grew a subagent row', await present(ROW), {
  hint: 'no row means the chat:event push never reached useChat'
})

// ---- phase 4: open the drawer --------------------------------------------
await page.evaluate((s) => document.querySelector(s)?.click(), ROW)
await page.waitForSelector('.subagent-drawer-root', { timeout: 10000 })

// The premise, stated before the absence claim (#65). "Not a tab stop" is only a
// measurement if the element is genuinely ON SCREEN and could have been one.
const premise = await page.evaluate(
  ([bd, cl]) => {
    const b = document.querySelector(bd)
    const c = document.querySelector(cl)
    const r = b?.getBoundingClientRect()
    return {
      drawerOpen: !!document.querySelector('.subagent-drawer-root'),
      backdropInDom: !!b,
      backdropTag: b?.tagName ?? null,
      backdropTabIndex: b?.tabIndex ?? null,
      backdropAriaHidden: b?.getAttribute('aria-hidden') ?? null,
      backdropPainted: !!r && r.width > 0 && r.height > 0,
      closeInDom: !!c
    }
  },
  [BACKDROP, CLOSE]
)
check('premise: drawer open, scrim on screen, close button present',
  premise.drawerOpen && premise.backdropInDom && premise.backdropPainted && premise.closeInDom,
  premise
)

const shot = path.join(SHOT_DIR, 'gui-95-drawer-open.png')
await page.screenshot({ path: shot })

// ---- phase 5: real forward + reverse Tab walks ---------------------------
// The component owns initial focus. Remember that exact DOM node in-page so each
// walk stops only when its OWN first stop recurs; the old anchor outside the
// viewer becomes unreachable once the trap works.
const firstStop = await page.evaluate((rootSel) => {
  const root = document.querySelector(rootSel)
  const el = document.activeElement
  window.__gui95CycleStart = el
  return {
    tag: el?.tagName ?? null,
    cls: typeof el?.className === 'string' ? el.className : '',
    label: el?.getAttribute?.('aria-label') ?? null,
    insideRoot: !!root && el instanceof HTMLElement && root.contains(el)
  }
}, ROOT)

check('criterion 4: opening moves focus inside the viewer', firstStop.insideRoot, firstStop)

// Class matching is by whitespace-split TOKEN, never substring: `.subagent-row`
// is a substring of `subagent-row--running`, which broke this driver once.
const wears = (s, sel) => s.cls.split(/\s+/).includes(sel.slice(1))
const MAX = 120
const walk = async (key) => {
  const stops = []
  for (let i = 0; i < MAX; i++) {
    await page.keyboard.press(key)
    const stop = await page.evaluate((rootSel) => {
      const root = document.querySelector(rootSel)
      const el = document.activeElement
      if (!el) return null
      return {
        tag: el.tagName,
        cls: typeof el.className === 'string' ? el.className : '',
        label: el.getAttribute?.('aria-label') ?? null,
        insideRoot: !!root && root.contains(el),
        sameAsFirst: el === window.__gui95CycleStart
      }
    }, ROOT)
    if (!stop) break
    stops.push(stop)
    if (stop.sameAsFirst) break
  }
  return stops
}

const forward = await walk('Tab')
const reverse = await walk('Shift+Tab')
const hit = (stops, sel) => stops.some((s) => wears(s, sel))
const stopOf = (stops, sel) => stops.findIndex((s) => wears(s, sel)) + 1 || null
const printWalk = (label, stops) => {
  console.log(`--- ${label}: ${stops.length} stops from ${JSON.stringify(firstStop.cls)} ---`)
  for (const [i, s] of stops.entries()) {
    console.log(`  ${String(i + 1).padStart(3)}  ${s.tag.padEnd(8)} ${s.cls || '(no class)'}${s.label ? `  [${s.label}]` : ''}${s.insideRoot ? '' : '  OUTSIDE'}`)
  }
}
printWalk('forward tab walk', forward)
printWalk('reverse tab walk', reverse)

// Criterion 1 — the scrim is never landed on.
check(`criterion 1: forward Tab never lands on ${BACKDROP}`, !hit(forward, BACKDROP), {
  stops: forward.length,
  backdropStop: stopOf(forward, BACKDROP)
})

// Criterion 3 — and the guard that makes criterion 1 mean anything. Same walk,
// same keys: if the drawer were shut this fails and the run is red.
check(`criterion 3: the same walk DOES reach ${CLOSE}`, hit(forward, CLOSE), {
  closeStop: stopOf(forward, CLOSE)
})

check(
  'criterion 5: every forward Tab stop stays inside the viewer',
  forward.length > 0 && forward.every((s) => s.insideRoot) && forward.at(-1)?.sameAsFirst,
  {
    stops: forward.length,
    escapedAt: forward.findIndex((s) => !s.insideRoot) + 1 || null,
    completedCycle: forward.at(-1)?.sameAsFirst ?? false
  }
)

// Positive over the established walk: an unopened viewer produces zero stops
// and fails rather than vacuously claiming the hidden composer was unreachable.
check(
  'criterion 6: the contained walk never reaches the composer textarea',
  forward.length > 0 && !hit(forward, COMPOSER),
  { stops: forward.length, composerStop: stopOf(forward, COMPOSER) }
)

check(
  'criterion 7: every reverse Tab stop stays inside the viewer',
  reverse.length > 0 && reverse.every((s) => s.insideRoot) && reverse.at(-1)?.sameAsFirst,
  {
    stops: reverse.length,
    escapedAt: reverse.findIndex((s) => !s.insideRoot) + 1 || null,
    completedCycle: reverse.at(-1)?.sameAsFirst ?? false
  }
)

// ---- phase 6: the click still closes it ----------------------------------
// The stop is removed; the handler is not.
await page.evaluate((s) => document.querySelector(s)?.click(), BACKDROP)
await page.waitForTimeout(500)
check('criterion 2: clicking the scrim still closes the drawer', !(await present('.subagent-drawer-root')), {
  drawerStillOpen: await present('.subagent-drawer-root')
})

console.log(`screenshot: ${shot}`)
console.log(fails.length === 0 ? 'ALL GREEN' : `RED: ${fails.join(' | ')}`)

setTimeout(() => process.exit(fails.length === 0 ? 0 : 1), 3000).unref?.()
await app.close().catch(() => {})
try {
  fs.rmSync(WORK_DIR, { recursive: true, force: true })
} catch {
  console.log(`(left behind: ${path.basename(WORK_DIR)})`)
}
process.exit(fails.length === 0 ? 0 : 1)
