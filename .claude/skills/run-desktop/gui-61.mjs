// GUI driver for #61 (spec #58) — prove tool-output disclosure works in the
// REAL window, where CSS exists. The vitest suite runs in jsdom, which never
// computes a style, so everything about how this feature looks and behaves as
// a box — is the control visible, does the expanded region stay bounded and
// scroll instead of shoving the composer off screen — is invisible to it.
//
// Red-first (gui-54's lesson): run this against a build WITHOUT the feature and
// it must fail naming the right reason (no disclosure control on a card whose
// output is provably multi-line). A driver never seen failing proves nothing.
//
// Scenario, no engine and no CLI:
//   1. seed a session whose transcript holds one Bash tool call with a long
//      multi-line result, straight into the native store;
//   2. open it in the app (pick the workspace, click its sidebar row);
//   3. assert the COLLAPSED card hides the tail — measured in the DOM;
//   4. click the disclosure and assert the tail is now mounted, the region is
//      height-bounded and scrollable, and the composer is still on screen.
//
// Confound guards, so a vacuous PASS is impossible:
//   * the seeded result is asserted to be genuinely multi-line and over the
//     120-char cap before anything is checked — a one-line fixture cannot
//     distinguish "hides the tail" from "there was no tail" (#59's lesson);
//   * the collapsed check runs BEFORE the click, so "expanded content present"
//     is only meaningful against a proven-absent baseline;
//   * every failure says what could not be driven — silence reads as a pass.
//
//   node .claude/skills/run-desktop/gui-61.mjs
//
// Needs `npm run build` first, plus `npm i --no-save playwright-core`.

import { _electron as electron } from 'playwright-core'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import crypto from 'node:crypto'

const APP_DIR = path.resolve(import.meta.dirname, '../../..')
const SHOT_DIR = process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')
fs.mkdirSync(SHOT_DIR, { recursive: true })

// ---- seed a session carrying one long, multi-line tool result ---------------

const SID = crypto.randomUUID()
const SEED_PROMPT = 'DISCLOSE61 seed prompt from terminal'
const FIRST_LINE = 'FAIL tests/auth.test.ts > rejects an expired token'
const TAIL_MARKER = 'DISCLOSE61-TAIL-MARKER'
// Long enough to overflow a 320px region, so "does it scroll" is answerable.
const RESULT = [
  FIRST_LINE,
  ...Array.from({ length: 40 }, (_, i) => `  at frame ${i} (src/main/auth.ts:${100 + i}:7)`),
  TAIL_MARKER
].join('\n')

const WORKSPACE = fs.mkdtempSync(path.join(os.tmpdir(), 'disclose61-ws-'))
const STORE_DIR = path.join(os.homedir(), '.claude', 'projects', `disclose61-${SID.slice(0, 8)}`)
const FILE = path.join(STORE_DIR, `${SID}.jsonl`)

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
const toolUseUuid = crypto.randomUUID()
const TOOL_USE_ID = 'tu-disclose61'
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
      message: {
        role: 'assistant',
        content: [
          { type: 'tool_use', id: TOOL_USE_ID, name: 'Bash', input: { command: 'npm test' } }
        ]
      },
      uuid: toolUseUuid,
      timestamp: new Date(Date.now() - 59000).toISOString()
    }) +
    line({
      ...base,
      parentUuid: toolUseUuid,
      type: 'user',
      message: {
        role: 'user',
        content: [
          { tool_use_id: TOOL_USE_ID, type: 'tool_result', content: RESULT, is_error: true }
        ]
      },
      uuid: crypto.randomUUID(),
      timestamp: new Date(Date.now() - 58000).toISOString()
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

const log = (label, m) => console.log(label.padEnd(12) + JSON.stringify(m))
const fails = []

// Guard zero: the fixture must actually hide something, or every assertion
// below is vacuous. Asserted on the seed itself, before the app is involved.
const firstLineLength = FIRST_LINE.length
const nonEmptyLines = RESULT.split('\n').filter((l) => l.trim()).length
log('FIXTURE', { nonEmptyLines, firstLineLength, resultBytes: RESULT.length })
if (nonEmptyLines < 2) {
  console.log('FAIL')
  console.log('  - the seeded result is a single line; it cannot prove disclosure hides anything')
  cleanup()
  process.exit(1)
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
  args: ['--no-sandbox', '--disable-gpu', '.'],
  cwd: APP_DIR,
  env: process.env,
  timeout: 30000
})

let page
const finish = async () => {
  await page?.screenshot({ path: path.join(SHOT_DIR, 'gui-61.png') }).catch(() => {})
  console.log(fails.length === 0 ? 'PASS' : 'FAIL')
  for (const f of fails) console.log('  - ' + f)
  setTimeout(() => process.exit(fails.length === 0 ? 0 : 1), 5000).unref?.()
  await app.close().catch(() => {})
  cleanup()
  process.exit(fails.length === 0 ? 0 : 1)
}

// Stub the folder dialog in MAIN before any click that opens one; the path
// travels as an ARGUMENT, never inside a string literal.
await app.evaluate(({ dialog }, dir) => {
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

// ---- open the seeded session ------------------------------------------------

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
    await page.evaluate(() => document.querySelector('[aria-label="Refresh sessions"]')?.click())
    await page.waitForTimeout(1000)
  }
}
if (!rowFound) {
  fails.push(
    'could not drive: seeded session never appeared in the sidebar — no card was ever rendered, the check under test never ran'
  )
  await finish()
}

let carded = false
for (let i = 0; i < 20 && !carded; i++) {
  await page.waitForTimeout(500)
  carded = await page.evaluate(() => !!document.querySelector('.tool-card'))
}
if (!carded) {
  fails.push(
    'could not drive: the opened session rendered no tool card — the seeded tool_result did not replay, the check under test never ran'
  )
  await finish()
}

// ---- collapsed: the tail is genuinely absent --------------------------------

const collapsed = await page.evaluate(
  ({ tail, first }) => {
    const card = document.querySelector('.tool-card')
    const toggle = card?.querySelector('.tool-card-toggle')
    const r = toggle?.getBoundingClientRect()
    return {
      cardText: card?.textContent ?? '',
      showsFirstLine: (card?.textContent ?? '').includes(first),
      showsTail: (card?.textContent ?? '').includes(tail),
      detailMounted: !!card?.querySelector('.tool-card-output'),
      markedFailed: !!card?.classList.contains('tool-card-error'),
      hasToggle: !!toggle,
      toggleTag: toggle?.tagName ?? null,
      toggleExpanded: toggle?.getAttribute('aria-expanded') ?? null,
      toggleBox: r ? { w: Math.round(r.width), h: Math.round(r.height) } : null,
      toggleLabel: toggle?.textContent?.trim() ?? null
    }
  },
  { tail: TAIL_MARKER, first: FIRST_LINE }
)
log('COLLAPSED', collapsed)

if (!collapsed.showsFirstLine) {
  fails.push('the collapsed card does not show the result first line — the card is not rendering the seeded result at all')
}
if (collapsed.showsTail) {
  fails.push(`the collapsed card leaks the tail (${TAIL_MARKER} present before any click) — detail is in the markup, not conditionally mounted`)
}
if (collapsed.detailMounted) {
  fails.push('.tool-card-output is mounted while collapsed — detail must not exist until expanded')
}
if (!collapsed.markedFailed) {
  fails.push('the seeded result is an error result but the card is not marked failed')
}
if (!collapsed.hasToggle) {
  fails.push(
    `no disclosure control on a card whose result has ${nonEmptyLines} non-empty lines and a ${firstLineLength}-char first line — the output is hidden with no way to reach it`
  )
  await finish()
}
if (collapsed.toggleTag !== 'BUTTON') {
  fails.push(`the disclosure control is a <${collapsed.toggleTag}>, not a button — it is not keyboard reachable by default`)
}
if (collapsed.toggleExpanded !== 'false') {
  fails.push(`the collapsed control reports aria-expanded="${collapsed.toggleExpanded}" — assistive tech is told the wrong state`)
}
if (!collapsed.toggleBox || collapsed.toggleBox.w === 0 || collapsed.toggleBox.h === 0) {
  fails.push(`the disclosure control has a zero-size box (${JSON.stringify(collapsed.toggleBox)}) — it exists in the DOM but is not visible`)
}

// ---- expand -----------------------------------------------------------------

await page.evaluate(() => document.querySelector('.tool-card .tool-card-toggle')?.click())
await page.waitForTimeout(400)

const expanded = await page.evaluate(
  ({ tail }) => {
    const card = document.querySelector('.tool-card')
    const out = card?.querySelector('.tool-card-output')
    const toggle = card?.querySelector('.tool-card-toggle')
    const composer = document.querySelector('.message-input')
    const cr = composer?.getBoundingClientRect()
    const or = out?.getBoundingClientRect()
    const cs = out ? getComputedStyle(out) : null
    return {
      detailMounted: !!out,
      showsTail: (out?.textContent ?? '').includes(tail),
      toggleExpanded: toggle?.getAttribute('aria-expanded') ?? null,
      toggleLabel: toggle?.textContent?.trim() ?? null,
      stillMarkedFailed: !!card?.classList.contains('tool-card-error'),
      subagentRowsIntact: document.querySelectorAll('.subagent-row').length,
      box: or ? { w: Math.round(or.width), h: Math.round(or.height) } : null,
      scrollHeight: out?.scrollHeight ?? 0,
      clientHeight: out?.clientHeight ?? 0,
      whiteSpace: cs?.whiteSpace ?? null,
      fontFamily: (cs?.fontFamily ?? '').slice(0, 40),
      composerBottom: cr ? Math.round(cr.bottom) : null,
      viewportHeight: window.innerHeight
    }
  },
  { tail: TAIL_MARKER }
)
log('EXPANDED', expanded)
// Shot taken HERE, not only at finish(): the run ends re-collapsed, so the
// final screenshot never shows the state this ticket adds.
await page
  .screenshot({ path: path.join(SHOT_DIR, 'gui-61-expanded.png') })
  .catch(() => {})

if (!expanded.detailMounted) {
  fails.push('clicking the control mounted nothing — .tool-card-output absent after expand')
  await finish()
}
if (!expanded.showsTail) {
  fails.push(`expanded region does not contain ${TAIL_MARKER} — the disclosure shows something other than the complete result`)
}
if (expanded.toggleExpanded !== 'true') {
  fails.push(`expanded control still reports aria-expanded="${expanded.toggleExpanded}"`)
}
if (!expanded.stillMarkedFailed) {
  fails.push('the card lost its failed marking once expanded — the error framing is dropped exactly when the error is being read')
}
if (!expanded.box || expanded.box.h === 0) {
  fails.push(`the expanded region has a zero-height box (${JSON.stringify(expanded.box)}) — mounted but not visible`)
}
// Bounded + scrollable, not an unbounded column that pushes the app around.
if (expanded.scrollHeight <= expanded.clientHeight) {
  fails.push(
    `the expanded region is not scrolling a ${nonEmptyLines}-line result (scrollHeight ${expanded.scrollHeight} <= clientHeight ${expanded.clientHeight}) — it grew to fit instead of capping`
  )
}
if (!/^pre/.test(expanded.whiteSpace ?? '')) {
  fails.push(`expanded output has white-space: ${expanded.whiteSpace} — tool output must render preformatted, not reflowed`)
}
if (expanded.composerBottom !== null && expanded.composerBottom > expanded.viewportHeight) {
  fails.push(
    `expanding pushed the composer off screen (bottom ${expanded.composerBottom} > viewport ${expanded.viewportHeight})`
  )
}

// ---- collapse again ---------------------------------------------------------

await page.evaluate(() => document.querySelector('.tool-card .tool-card-toggle')?.click())
await page.waitForTimeout(400)
const recollapsed = await page.evaluate(
  ({ tail }) => {
    const card = document.querySelector('.tool-card')
    return {
      detailMounted: !!card?.querySelector('.tool-card-output'),
      showsTail: (card?.textContent ?? '').includes(tail)
    }
  },
  { tail: TAIL_MARKER }
)
log('RECOLLAPSED', recollapsed)
if (recollapsed.detailMounted || recollapsed.showsTail) {
  fails.push('collapsing again left the detail mounted — the control only opens, it does not close')
}

await finish()
