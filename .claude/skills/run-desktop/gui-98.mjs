// GUI eyeball for #98 — the subagent viewer opens as a CENTRED POPUP, and the
// chat column inside it renders at its documented 760px in both scroll states.
//
//   node .claude/skills/run-desktop/gui-98.mjs
//
// Needs `npm run build` first, plus playwright-core. Costs NO CLI turns.
//
// Covers criteria 1, 2 and 5. Criterion 3 lives in `gui-96.mjs` (the axis pin,
// added there because that driver already owns this keyframe as a premise),
// criterion 4 is `gui-95.mjs` staying green untouched, and 6-8 are the gate,
// the ADR and `.context/happy-path.md`.
//
// THE FIVE THINGS THIS DRIVER IS BUILT AROUND
//
// 1. TWO IPC STUBS ARE NEEDED, NOT ONE. The ticket's own comment prescribes
//    replacing `subagents:transcript` main-side, because the real handler reads
//    the real disk and answers `[]` in a temp workspace — which renders
//    `.subagent-drawer-empty` and mounts NEITHER `.chat` NOR `.chat-column`, so
//    criterion 2 would measure `null` (or, written carelessly, "pass" by
//    asserting on the pane instead). Measured while building this: that stub
//    alone is not enough. `SubagentDrawer` resolves a session id FIRST —
//    `sessionId` comes from `activeSessionId`, which `useChat` writes only in
//    its `turn-end` branch, and the fallback `currentSessionId()` reaches
//    `engine.sessionId()`, which stays null until a turn has actually run
//    (`turnEverRun`, engine.ts:443). With the synthetic `chat:event` push and no
//    real turn, both are null, the component short-circuits at `if (!sid)
//    setMessages([])`, and the transcript handler is NEVER CALLED. So
//    `chat:session-id` is stubbed too, and the pre-stub value is REPORTED rather
//    than assumed.
//
// 2. THE WINDOW IS RESIZED, DELIBERATELY. The pane is `min(820px, 100%)` inside
//    a root with 24px of padding, so anything under 868 CSS px of viewport
//    silently squeezes it — and `.chat-column` would then measure whatever was
//    left rather than 760, failing for an environmental reason. #79 persists the
//    window's bounds, so the inherited size is whatever the last run left (the
//    context notes record a 900x600 run). The driver therefore SETS the bounds,
//    READS BACK the resulting CSS width as a premise, and RESTORES the original
//    bounds before closing — bounds are borrowed state (#97's rule), and the
//    restore is given longer than the 250ms persist debounce to land.
//
// 3. THE ENTRY ANIMATION MUST BE FINISHED BEFORE CENTRING IS MEASURED. #98's own
//    change makes the pane arrive 4px low; sampling mid-flight would read a
//    4px-off centre and red a correct build (or, at 1.25 dpr, 5 device px of
//    pure instrument error). The animation's `playState` is asserted to be
//    `finished` as a premise rather than slept on and hoped for.
//
// 4. CENTRING AND WIDTH ARE COMPARED IN DEVICE PIXELS (#71/#51's rule).
//    `getBoundingClientRect()` is CSS px and this window runs at a non-1 dpr, so
//    a tolerance stated in CSS px is a different tolerance on every machine.
//
// 5. THE PANE'S OWN WIDTH IS A PREMISE OF CRITERION 2. 760 is derived as
//    820 - 2 (hairline) - 48 (`.chat` padding), with the overflowing case
//    spending the last 10 on the bar. If the pane is not at 820, a 760 reading
//    would be a coincidence, so the derivation is pinned end to end.
//
// The overflow state is ESTABLISHED AND VERIFIED, never assumed: `scrollHeight >
// clientHeight` is read on `.chat` in both runs and a wrong state is a hard
// failure, or criterion 2 measures the same state twice and the scrollbar term
// in the 820 derivation goes untested.
//
// The stubs are the LAST thing this window is asked to do and the app is closed
// immediately afterwards, so nothing inherits them.
//
// CRITERION 5 WAS INVERTED BY #125 and is now three parts. It used to assert
// ZERO `backdrop-filter` in subagent.css — #98's non-goal, which kept the
// then-unresolved glass-ban question harmless. The owner has since named this
// surface, so the pane carries the material and the criterion asserts its
// PRESENCE instead. It is not deleted and not softened: 5a is a COMPUTED read
// off the live pane (strictly stronger than the grep it replaced, which would
// pass on a rule the cascade never applies), 5b is the discrimination control
// that keeps 5a from being vacuous, and only 5c is still source-level — the
// scope, i.e. that no other stylesheet gained one.
//
// RED-VERIFIED against the pre-#98 stylesheet, by restoring it, rebuilding and
// running: criterion 1 fails on X by 350 device px (the pane sits against the
// right edge, `left: 560` in a 1120 viewport) and criterion 2 fails in both
// states (511.2 not overflowing, 501.6 overflowing), while the scroll-state
// premises still pass and the run exits 1. (That run predates #125, so it also
// reds the new criterion 5a — the pre-#98 sheet has no material either.)
//
// THE RED RUN CAUGHT A VACUITY IN THIS DRIVER, WHICH IS THE WHOLE ARGUMENT FOR
// DOING IT. Criterion 2 was first written against a bare `.chat-column` and
// passed at 760 on the 560px edge-pinned drawer — because the app's own chat is
// still mounted behind the scrim, so `querySelector` was returning the
// BACKGROUND column, which is ~760 at any comfortable window size no matter
// what the popup does. Both selectors are scoped to the pane for that reason;
// unscoping either restores a green that means nothing. #95's rule was about
// matching class tokens rather than substrings — this is the same failure one
// level up: the right class on the wrong element.
//
// One number the red run also settled, worth knowing before touching the 820:
// at this window's 1.25 page zoom the overflow bar spends 9.6 CSS px, not 10
// (511.2 - 501.6). The overflowing column still measures exactly 760 because
// 770 - 9.6 = 760.4 and `max-width` caps it — so the derivation has ~0.4px of
// slack here and lands exactly at zoom 1. A narrower pane spends the slack and
// the reading drops below 760, which is what the red run showed.

import { _electron as electron } from 'playwright-core'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'

// #132 — criterion 5c moved to this sidecar so the GATE runs it too. It is
// still driven here; the array is the single definition of the check.
import { checks as sourceChecks } from './gui-98.source.mjs'
import { profileArgs } from './driver-profile.mjs'

const APP_DIR = path.resolve(import.meta.dirname, '../../..')
const SHOT_DIR = process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')
fs.mkdirSync(SHOT_DIR, { recursive: true })

// Only the basename is ever printed — #90's scrubbing rule keeps the OS
// username out of anything that lands in the repo.
const WORK_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'gui98-'))

const ROOT = '.subagent-drawer-root'
const PANE = '.subagent-drawer'
const ROW = '.subagent-row'
// BOTH of these MUST stay scoped to the pane. The app's own chat is still
// mounted behind the scrim, so a bare `.chat-column` resolves to the BACKGROUND
// column — which is ~760 wide at any comfortable window size and therefore reads
// green whatever the popup does. This driver was written with the bare selector
// first and criterion 2 passed against the 560px edge-pinned drawer; only the
// red run exposed it. The scope is the check.
const COLUMN = '.subagent-drawer .chat-column'
const CHAT = '.subagent-drawer .chat'
const PARENT_TOOL_USE_ID = 'gui98-task'

// The authored geometry, read from the files rather than restated as taste:
//   `.subagent-drawer` width  — subagent.css
//   `.chat-column` max-width  — chat.css:13
const PANE_W = 820
const COLUMN_W = 760
// 820 pane + 24px of root padding each side. Below this the pane is squeezed by
// `min(…, 100%)` and criterion 2 measures the squeeze instead of the rule.
const MIN_VIEWPORT_W = PANE_W + 48

const fails = []
const check = (label, ok, detail) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ${JSON.stringify(detail)}`)
  if (!ok) fails.push(label)
}

setTimeout(() => {
  console.log('TIMEOUT')
  process.exit(1)
}, 180000).unref?.()

const SHORT_ROWS = [
  { role: 'user', text: 'gui-98 fixture: a short transcript that must not overflow.' },
  { role: 'assistant', text: 'Acknowledged.' }
]

// Enough rows that `.chat` is guaranteed to overflow at any plausible window
// height. Verified in-run regardless — the count is a starting point, not a
// claim.
const LONG_ROWS = Array.from({ length: 80 }, (_, i) => ({
  role: i % 2 === 0 ? 'user' : 'assistant',
  text: `gui-98 fixture row ${i + 1}: a line of ordinary prose, long enough to take a full line of the column but made of real words so it wraps the way the app's own text does.`
}))

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
}, WORK_DIR)

const page = await app.firstWindow()
await page.waitForSelector('[aria-label="Backend mode"]', { timeout: 15000 })

// ---- phase 0: borrow the window's size, recording what to give back --------
const originalBounds = await app.evaluate(({ BrowserWindow }) =>
  BrowserWindow.getAllWindows()[0].getContentBounds()
)
await app.evaluate(({ BrowserWindow }, b) => {
  const win = BrowserWindow.getAllWindows()[0]
  win.setContentBounds({ ...b, width: 1400, height: 900 })
}, originalBounds)
await page.waitForTimeout(400)

const view = await page.evaluate(() => ({
  w: window.innerWidth,
  h: window.innerHeight,
  dpr: window.devicePixelRatio
}))
// A premise, not a criterion: below this the pane cannot reach 820 and every
// number after it would be measuring the window instead of the stylesheet.
check(`premise: the viewport is at least ${MIN_VIEWPORT_W} CSS px wide`, view.w >= MIN_VIEWPORT_W, {
  ...view,
  requested: '1400x900 DIP',
  note: 'CSS px = DIP / page zoom; the zoom is persisted per-origin by Chromium'
})

// ---- phase 1: open a workspace -------------------------------------------
// DOM-dispatched: Playwright's actionability wait hangs on the intro animation
// (gui-93, gui-95 and gui-96 all hit this).
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find(
    (b) =>
      b.getAttribute('aria-label') === 'Pick a project folder' ||
      b.textContent?.includes('Pick a project folder')
  )
  btn?.click()
})
await page.waitForSelector('.message-input', { timeout: 20000 })
console.log(`--- workspace open (fixture: ${path.basename(WORK_DIR)}) ---`)

// ---- phase 2: grow a clickable subagent row (#95's finding) ---------------
const pushChat = (ev) =>
  app.evaluate(({ BrowserWindow }, ev) => {
    const win = BrowserWindow.getAllWindows()[0]
    win.webContents.send('chat:event', ev)
  }, ev)

await pushChat({
  type: 'tool-use',
  id: PARENT_TOOL_USE_ID,
  name: 'Task',
  input: { subagent_type: 'Explore', description: 'gui-98 fixture' }
})
await pushChat({
  type: 'subagent',
  parentToolUseId: PARENT_TOOL_USE_ID,
  status: 'running',
  agentType: 'Explore'
})

await page.waitForSelector(ROW, { timeout: 10000 }).catch(() => {})
check(
  'premise: synthetic push grew a subagent row',
  await page.evaluate((s) => !!document.querySelector(s), ROW),
  { hint: 'no row means the chat:event push never reached useChat' }
)

// ---- phase 3: the two stubs ----------------------------------------------
// Reported, not assumed: this is the value that decides whether the transcript
// handler is reached at all.
const sidBefore = await page.evaluate(() => window.api.currentSessionId())
console.log(
  `--- pre-stub currentSessionId(): ${JSON.stringify(sidBefore)} ` +
    `(null is expected with no real turn — which is exactly why chat:session-id is stubbed) ---`
)

await app.evaluate(({ ipcMain }) => {
  ipcMain.removeHandler('chat:session-id')
  ipcMain.handle('chat:session-id', async () => 'gui98-session')
})

const openViewer = async (rows) => {
  await app.evaluate(({ ipcMain }, rows) => {
    ipcMain.removeHandler('subagents:transcript')
    ipcMain.handle('subagents:transcript', async () => rows)
  }, rows)
  await page.evaluate((s) => document.querySelector(s)?.click(), ROW)
  await page.waitForSelector(COLUMN, { timeout: 10000 }).catch(() => {})
  // Observation, deliberately NOT a check: sampled a few ms after the click, so
  // it normally catches the entry mid-flight — but a slow frame here would make
  // a correct build red for a timing reason, which is not a property worth
  // asserting. It is logged as evidence that the animation this driver waits
  // out is real; the assertion is on the SETTLED state below.
  const inFlight = await page.evaluate(
    (s) => (document.querySelector(s)?.getAnimations?.() ?? []).map((a) => a.playState),
    PANE
  )
  console.log(`    (entry sampled right after open: ${JSON.stringify(inFlight)})`)
  // Let the 200ms entry finish before anything is measured.
  await page.waitForTimeout(500)
}

const closeViewer = async () => {
  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
  })
  await page.waitForTimeout(300)
}

// Everything criterion 1 and 2 need, read in one pass so the pane, the column
// and the scroll state all describe the SAME frame.
const measure = () =>
  page.evaluate(
    ([rootSel, paneSel, colSel, chatSel]) => {
      const pane = document.querySelector(paneSel)
      const col = document.querySelector(colSel)
      const chat = document.querySelector(chatSel)
      if (!pane) return { paneMounted: false }
      const r = pane.getBoundingClientRect()
      const anims = pane.getAnimations ? pane.getAnimations() : []
      return {
        paneMounted: true,
        rootMounted: !!document.querySelector(rootSel),
        columnMounted: !!col,
        // The empty branch mounts this instead of the chat, and is the shape
        // criterion 2 must never be allowed to "pass" against.
        emptyBranch: !!document.querySelector('.subagent-drawer-empty'),
        pane: { left: r.left, top: r.top, width: r.width, height: r.height },
        viewport: { w: window.innerWidth, h: window.innerHeight },
        dpr: window.devicePixelRatio,
        columnWidth: col ? col.getBoundingClientRect().width : null,
        // The authored entry, which stays readable in the computed style long
        // after the animation itself has left `getAnimations()`.
        animationName: getComputedStyle(pane).animationName,
        // #125 — the material, read as a COMPUTED value off the mounted pane.
        // Strictly stronger than the source grep this replaced: a grep passes
        // on a rule the cascade never applies, or one whose selector no longer
        // matches this element. Computed style is resolved without rasterising,
        // so `--disable-gpu` cannot affect it — this is a claim about the rule
        // reaching the element, never about pixels.
        backdropFilter: getComputedStyle(pane).backdropFilter,
        // Discrimination control. `backdrop-filter` does not inherit, so a head
        // INSIDE the glassed pane must still read `none`. Without this, a
        // reader that answered the same string for every element would pass
        // criterion 5 while measuring nothing.
        headBackdropFilter: (() => {
          const head = pane.querySelector('.subagent-drawer-head')
          return head ? getComputedStyle(head).backdropFilter : null
        })(),
        animation: anims.map((a) => ({ name: a.animationName, state: a.playState })),
        scroll: chat ? { scrollHeight: chat.scrollHeight, clientHeight: chat.clientHeight } : null
      }
    },
    [ROOT, PANE, COLUMN, CHAT]
  )

// One state's worth of assertions, run twice against the two scroll states.
const assertState = (label, m, shouldOverflow) => {
  check(`premise (${label}): the pane mounted the chat column, not the empty branch`, m.paneMounted && m.columnMounted && !m.emptyBranch, {
    paneMounted: m.paneMounted,
    columnMounted: m.columnMounted,
    emptyBranch: m.emptyBranch,
    hint: 'the empty branch means a stub did not take and .chat-column never mounted'
  })
  if (!m.paneMounted || !m.columnMounted) return

  // Two halves, because either alone is vacuous. A CSS animation with no fill
  // mode LEAVES `getAnimations()` the moment it finishes, so "nothing is
  // running" is also what a pane with no entry at all reports — the computed
  // name is what makes this premise say something. Together they read: the pane
  // does carry the 200ms entry, and it is over, so the rect below is settled.
  check(`premise (${label}): the pane carries the entry animation and it is no longer running`, m.animationName === 'subagent-slide' && m.animation.every((a) => a.state !== 'running'), {
    animationName: m.animationName,
    running: m.animation,
    hint: 'measuring mid-flight reads the 4px rise as a centring error'
  })

  check(`premise (${label}): the pane is at its authored ${PANE_W}px`, Math.abs(m.pane.width - PANE_W) * m.dpr < 1, {
    width: m.pane.width,
    expected: PANE_W,
    hint: 'a squeezed pane makes any column reading a coincidence'
  })

  // Criterion 1 — centred on BOTH axes, in device px.
  const dx = Math.abs(m.pane.left + m.pane.width / 2 - m.viewport.w / 2) * m.dpr
  const dy = Math.abs(m.pane.top + m.pane.height / 2 - m.viewport.h / 2) * m.dpr
  check(`criterion 1 (${label}): the pane is centred in the viewport on both axes, within 1 device px`, dx < 1 && dy < 1, {
    pane: m.pane,
    viewport: m.viewport,
    offsetDevicePx: { x: +dx.toFixed(3), y: +dy.toFixed(3) },
    dpr: m.dpr
  })

  // The scroll state is established and VERIFIED, never inferred from the
  // fixture size.
  const overflowing = m.scroll ? m.scroll.scrollHeight > m.scroll.clientHeight : null
  check(`premise (${label}): .chat ${shouldOverflow ? 'IS' : 'is NOT'} overflowing`, overflowing === shouldOverflow, {
    scroll: m.scroll,
    overflowing,
    expected: shouldOverflow,
    hint: 'without this, criterion 2 can measure the same scroll state twice and never test the bar term'
  })

  // Criterion 2 — the column at its documented width, in this scroll state.
  check(`criterion 2 (${label}): ${COLUMN} measures exactly ${COLUMN_W}px`, m.columnWidth !== null && Math.abs(m.columnWidth - COLUMN_W) * m.dpr < 1, {
    columnWidth: m.columnWidth,
    expected: COLUMN_W,
    deltaDevicePx: m.columnWidth === null ? null : +(Math.abs(m.columnWidth - COLUMN_W) * m.dpr).toFixed(3),
    derivation: `${PANE_W} - 2 hairline - 48 padding = 770 available; ${shouldOverflow ? 'the bar spends 10, leaving exactly 760' : 'max-width caps at 760 and the spare 10 falls to margin auto'}`
  })
}

// ---- state A: a short transcript, not overflowing ------------------------
await openViewer(SHORT_ROWS)
const shortState = await measure()
assertState('short', shortState, false)
const shotShort = path.join(SHOT_DIR, 'gui-98-popup-short.png')
await page.screenshot({ path: shotShort })
await closeViewer()

// ---- state B: a long transcript, overflowing -----------------------------
await openViewer(LONG_ROWS)
const longState = await measure()
assertState('long', longState, true)
const shotLong = path.join(SHOT_DIR, 'gui-98-popup-long.png')
await page.screenshot({ path: shotLong })

// ---- criterion 5: the pane CARRIES the window material -------------------
// REPLACED IN #125, deliberately not deleted and not softened. This criterion
// used to assert ZERO `backdrop-filter` in subagent.css — "the non-goal that
// keeps the unresolved glass-ban question harmless". The owner has now named
// this surface, so the non-goal is spent; but a deviation left with no positive
// pin is exactly what a later conformance pass removes without noticing (#96
// shipped as `style: two off-scale values conform to DESIGN.md`). So the
// negative becomes a positive of the same strength or better, in three parts.
const material = longState.backdropFilter
const materialControl = longState.headBackdropFilter

// 5a — MEASURED on the live pane, not grepped. A grep is green on a rule the
// cascade drops or whose selector no longer matches the element.
check('criterion 5a: the mounted pane computes a real backdrop-filter', typeof material === 'string' && material !== 'none' && material !== '', {
  backdropFilter: material,
  note: 'computed style resolves without rasterising, so --disable-gpu does not reach this; it is not a pixel claim'
})

// The control that makes 5a mean something.
check('criterion 5b: control — a child of the glassed pane still reads `none`', materialControl === 'none', {
  head: materialControl,
  hint: 'backdrop-filter does not inherit; anything else here means the reader is not discriminating and 5a is unscored'
})

// 5c — SOURCE, and the only part still read as text: the SCOPE. The owner named
// one surface. Every other `var(--surface)` pane in the app must stay flat, and
// this is where a quiet generalisation shows up. `tests/subagent-material.test.ts`
// pins the same rule in the gate; this repeats it because a driver run on a dirty
// tree is where the generalisation would actually be typed.
//
// Since #132 the check itself lives in `gui-98.source.mjs` and the gate runs it
// through `tests/gui-source-assertions.test.ts`. Driven here off that same
// array, so there is one definition and the two copies cannot drift.
for (const c of sourceChecks) {
  const { ok, detail } = c.run()
  check(c.name, ok, detail)
}

// ---- give the window back its size ---------------------------------------
// Bounds are borrowed state and #79 persists them; 400ms clears the 250ms
// persist debounce so the stored value is the one this run found.
await app.evaluate(({ BrowserWindow }, b) => {
  BrowserWindow.getAllWindows()[0].setContentBounds(b)
}, originalBounds)
await page.waitForTimeout(400)

console.log(`screenshots: ${shotShort} | ${shotLong}`)
console.log(`window bounds restored to ${originalBounds.width}x${originalBounds.height} DIP`)
console.log(fails.length === 0 ? 'ALL GREEN' : `RED: ${fails.join(' | ')}`)

setTimeout(() => process.exit(fails.length === 0 ? 0 : 1), 3000).unref?.()
await app.close().catch(() => {})
try {
  fs.rmSync(WORK_DIR, { recursive: true, force: true })
} catch {
  console.log(`(left behind: ${path.basename(WORK_DIR)})`)
}
process.exit(fails.length === 0 ? 0 : 1)
