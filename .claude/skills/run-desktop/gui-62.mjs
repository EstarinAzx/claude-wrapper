// GUI driver for #62 (spec #58) — prove the structured input inspector works in
// the REAL window, where CSS exists. The vitest suite runs in jsdom, which never
// computes a style, so the whole box question this ticket raises — is the second
// control visible, does an argument large enough to dominate the card stay
// bounded and scroll instead of shoving the composer off screen — is invisible
// to it. That is acceptance criterion "an input value large enough to dominate
// the card does not break the layout", and jsdom cannot answer it at all.
//
// Red-first (gui-54's lesson): run this against a build WITHOUT the feature and
// it must fail naming the right reason (no input control on a card provably
// called with four arguments). A driver never seen failing proves nothing.
//
// Scenario, no engine and no CLI:
//   1. seed a session whose transcript holds one Edit tool call whose input has
//      four arguments — one of them a huge multi-line string, one a nested
//      object, one a boolean — straight into the native store;
//   2. open it in the app (pick the workspace, click its sidebar row);
//   3. assert the COLLAPSED card shows the header's one chosen value and none
//      of the rest — measured in the DOM;
//   4. click input disclosure and assert every argument is now mounted, the
//      region is height-bounded and scrollable, the value renders preformatted,
//      the composer is still on screen, and OUTPUT stayed collapsed.
//
// Confound guards, so a vacuous PASS is impossible:
//   * the seed is asserted to have >1 argument and a genuinely multi-line
//     non-key value before anything is checked — a single-argument fixture
//     cannot distinguish "shows every argument" from "there was only one"
//     (#59's lesson, one layer up);
//   * the collapsed check runs BEFORE the click, so "arguments present" is only
//     meaningful against a proven-absent baseline;
//   * the two disclosures are checked to move independently, because a single
//     shared boolean passes every "is it visible" assertion;
//   * every failure says what could not be driven — silence reads as a pass.
//
//   node .claude/skills/run-desktop/gui-62.mjs
//
// Needs `npm run build` first, plus `npm i --no-save playwright-core`.

import { _electron as electron } from 'playwright-core'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import crypto from 'node:crypto'
import { profileArgs } from './driver-profile.mjs'

const APP_DIR = path.resolve(import.meta.dirname, '../../..')
const SHOT_DIR = process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')
fs.mkdirSync(SHOT_DIR, { recursive: true })

// ---- seed a session carrying one Edit call with a big structured input ------

const SID = crypto.randomUUID()
const SEED_PROMPT = 'INSPECT62 seed prompt from terminal'
const KEY_VALUE = 'src/main/auth.ts'
// Only reachable through the inspector: `keyInput` picks file_path and stops.
const OLD_MARKER = 'INSPECT62-OLD-MARKER'
const NEW_MARKER = 'INSPECT62-NEW-MARKER'
const NESTED_MARKER = 'INSPECT62-NESTED-MARKER'
// Long enough to overflow the capped region, so "does it scroll" is answerable.
const OLD_STRING = [
  OLD_MARKER,
  ...Array.from({ length: 40 }, (_, i) => `  const beforeLine${i} = readToken(${i})`)
].join('\n')
const NEW_STRING = [NEW_MARKER, '  const after = readToken(0)'].join('\n')
const TOOL_INPUT = {
  file_path: KEY_VALUE,
  old_string: OLD_STRING,
  new_string: NEW_STRING,
  replace_all: true,
  options: { note: NESTED_MARKER, retries: 2 }
}

const WORKSPACE = fs.mkdtempSync(path.join(os.tmpdir(), 'inspect62-ws-'))
const STORE_DIR = path.join(os.homedir(), '.claude', 'projects', `inspect62-${SID.slice(0, 8)}`)
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
const TOOL_USE_ID = 'tu-inspect62'
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
        content: [{ type: 'tool_use', id: TOOL_USE_ID, name: 'Edit', input: TOOL_INPUT }]
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
          {
            tool_use_id: TOOL_USE_ID,
            type: 'tool_result',
            content: 'The file src/main/auth.ts has been updated.',
            is_error: false
          }
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

// Guard zero: the fixture must actually hide something, or every assertion below
// is vacuous. Asserted on the seed itself, before the app is involved.
const argCount = Object.keys(TOOL_INPUT).length
const oldStringLines = OLD_STRING.split('\n').length
log('FIXTURE', { argCount, oldStringLines, oldStringBytes: OLD_STRING.length })
if (argCount < 2 || oldStringLines < 2) {
  console.log('FAIL')
  console.log(
    `  - the seeded input has ${argCount} argument(s) and a ${oldStringLines}-line value; it cannot prove the inspector shows more than the header does`
  )
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
  args: ['--no-sandbox', '--disable-gpu', ...profileArgs(), '.'],
  cwd: APP_DIR,
  env: process.env,
  timeout: 30000
})

let page
const finish = async () => {
  await page?.screenshot({ path: path.join(SHOT_DIR, 'gui-62.png') }).catch(() => {})
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
    'could not drive: the opened session rendered no tool card — the seeded tool_use did not replay, the check under test never ran'
  )
  await finish()
}

// ---- collapsed: only the header's one chosen value is on screen -------------

const collapsed = await page.evaluate(
  ({ oldM, newM, nestedM, keyV }) => {
    const card = document.querySelector('.tool-card')
    const toggle = card?.querySelector('.tool-card-toggle--input')
    const r = toggle?.getBoundingClientRect()
    const text = card?.textContent ?? ''
    return {
      showsKeyValue: text.includes(keyV),
      leaks: [oldM, newM, nestedM].filter((m) => text.includes(m)),
      inspectorMounted: !!card?.querySelector('.tool-card-input'),
      hasToggle: !!toggle,
      toggleTag: toggle?.tagName ?? null,
      toggleExpanded: toggle?.getAttribute('aria-expanded') ?? null,
      toggleLabel: toggle?.textContent?.trim() ?? null,
      toggleBox: r ? { w: Math.round(r.width), h: Math.round(r.height) } : null
    }
  },
  { oldM: OLD_MARKER, newM: NEW_MARKER, nestedM: NESTED_MARKER, keyV: KEY_VALUE }
)
log('COLLAPSED', collapsed)

if (!collapsed.showsKeyValue) {
  fails.push(
    `the collapsed card does not show ${KEY_VALUE} — the card is not rendering the seeded call at all`
  )
}
if (collapsed.leaks.length) {
  fails.push(
    `the collapsed card leaks ${collapsed.leaks.join(', ')} before any click — the inspector is in the markup, not conditionally mounted`
  )
}
if (collapsed.inspectorMounted) {
  fails.push('.tool-card-input is mounted while collapsed — it must not exist until expanded')
}
if (!collapsed.hasToggle) {
  fails.push(
    `no input control on a card called with ${argCount} arguments — every argument but ${KEY_VALUE} is unreachable`
  )
  await finish()
}
if (collapsed.toggleTag !== 'BUTTON') {
  fails.push(
    `the input control is a <${collapsed.toggleTag}>, not a button — it is not keyboard reachable by default`
  )
}
if (collapsed.toggleExpanded !== 'false') {
  fails.push(
    `the collapsed input control reports aria-expanded="${collapsed.toggleExpanded}" — assistive tech is told the wrong state`
  )
}
if (!collapsed.toggleBox || collapsed.toggleBox.w === 0 || collapsed.toggleBox.h === 0) {
  fails.push(
    `the input control has a zero-size box (${JSON.stringify(collapsed.toggleBox)}) — it exists in the DOM but is not visible`
  )
}

// ---- expand the input -------------------------------------------------------

await page.evaluate(() => document.querySelector('.tool-card .tool-card-toggle--input')?.click())
await page.waitForTimeout(400)

const expanded = await page.evaluate(
  ({ oldM, newM, nestedM }) => {
    const card = document.querySelector('.tool-card')
    const box = card?.querySelector('.tool-card-input')
    const toggle = card?.querySelector('.tool-card-toggle--input')
    const value = card?.querySelector('.tool-card-arg-value')
    const composer = document.querySelector('.message-input')
    const cr = composer?.getBoundingClientRect()
    const br = box?.getBoundingClientRect()
    const cardRect = card?.getBoundingClientRect()
    const cs = box ? getComputedStyle(box) : null
    const vs = value ? getComputedStyle(value) : null
    const text = box?.textContent ?? ''
    return {
      inspectorMounted: !!box,
      missing: [oldM, newM, nestedM].filter((m) => !text.includes(m)),
      keysShown: [...(box?.querySelectorAll('.tool-card-arg-key') ?? [])].map((n) =>
        n.textContent?.trim()
      ),
      toggleExpanded: toggle?.getAttribute('aria-expanded') ?? null,
      toggleLabel: toggle?.textContent?.trim() ?? null,
      // Output disclosure must NOT have moved: two disclosures, two booleans.
      outputMounted: !!card?.querySelector('.tool-card-output'),
      box: br ? { w: Math.round(br.width), h: Math.round(br.height) } : null,
      scrollHeight: box?.scrollHeight ?? 0,
      clientHeight: box?.clientHeight ?? 0,
      overflowY: cs?.overflowY ?? null,
      valueWhiteSpace: vs?.whiteSpace ?? null,
      cardRight: cardRect ? Math.round(cardRect.right) : null,
      viewportWidth: window.innerWidth,
      composerBottom: cr ? Math.round(cr.bottom) : null,
      viewportHeight: window.innerHeight
    }
  },
  { oldM: OLD_MARKER, newM: NEW_MARKER, nestedM: NESTED_MARKER }
)
log('EXPANDED', expanded)
// Shot taken HERE, not only at finish(): the run ends re-collapsed, so the final
// screenshot would never show the state this ticket adds.
await page.screenshot({ path: path.join(SHOT_DIR, 'gui-62-expanded.png') }).catch(() => {})

if (!expanded.inspectorMounted) {
  fails.push('clicking the input control mounted nothing — .tool-card-input absent after expand')
  await finish()
}
if (expanded.missing.length) {
  fails.push(
    `the expanded inspector is missing ${expanded.missing.join(', ')} — it is not showing every argument, only some`
  )
}
if (expanded.keysShown.length !== argCount) {
  fails.push(
    `the inspector rendered ${expanded.keysShown.length} argument label(s) for a ${argCount}-argument call (${expanded.keysShown.join(', ')})`
  )
}
if (expanded.toggleExpanded !== 'true') {
  fails.push(`expanded input control still reports aria-expanded="${expanded.toggleExpanded}"`)
}
if (expanded.outputMounted) {
  fails.push(
    'expanding the input also mounted the output body — the two disclosures share one flag instead of moving independently'
  )
}
if (!expanded.box || expanded.box.h === 0) {
  fails.push(
    `the inspector has a zero-height box (${JSON.stringify(expanded.box)}) — mounted but not visible`
  )
}
// The layout criterion: bounded + scrollable, not an unbounded column.
if (expanded.scrollHeight <= expanded.clientHeight) {
  fails.push(
    `the inspector is not scrolling a ${oldStringLines}-line argument (scrollHeight ${expanded.scrollHeight} <= clientHeight ${expanded.clientHeight}) — it grew to fit instead of capping`
  )
}
if (!/^pre/.test(expanded.valueWhiteSpace ?? '')) {
  fails.push(
    `argument values render with white-space: ${expanded.valueWhiteSpace} — a multi-line argument must keep its line breaks`
  )
}
if (expanded.cardRight !== null && expanded.cardRight > expanded.viewportWidth) {
  fails.push(
    `a long argument pushed the card past the viewport (right ${expanded.cardRight} > width ${expanded.viewportWidth}) — the value is not wrapping`
  )
}
if (expanded.composerBottom !== null && expanded.composerBottom > expanded.viewportHeight) {
  fails.push(
    `expanding the input pushed the composer off screen (bottom ${expanded.composerBottom} > viewport ${expanded.viewportHeight})`
  )
}

// ---- collapse again ---------------------------------------------------------

await page.evaluate(() => document.querySelector('.tool-card .tool-card-toggle--input')?.click())
await page.waitForTimeout(400)
const recollapsed = await page.evaluate(
  ({ oldM }) => {
    const card = document.querySelector('.tool-card')
    return {
      inspectorMounted: !!card?.querySelector('.tool-card-input'),
      leaksOld: (card?.textContent ?? '').includes(oldM)
    }
  },
  { oldM: OLD_MARKER }
)
log('RECOLLAPSED', recollapsed)
if (recollapsed.inspectorMounted || recollapsed.leaksOld) {
  fails.push('collapsing again left the inspector mounted — the control only opens, it does not close')
}

await finish()
