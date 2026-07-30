// GUI driver for #63 (spec #58) — prove the Edit hunk diff works in the REAL
// window, where CSS exists. The vitest suite runs in jsdom, which computes no
// styles at all, so this ticket's headline acceptance criterion — "added and
// removed lines VISUALLY distinguished" — is literally unassertable there. A
// jsdom test can only check that two class names were emitted; whether those
// classes resolve to different pixels is a question only a real window answers.
//
// Red-first (gui-54's lesson): run this against a build WITHOUT the feature and
// it must fail naming the right reason (no diff control on an Edit card that
// provably supplies both strings). A driver never seen failing proves nothing.
//
// Scenario, no engine and no CLI:
//   1. seed a session whose transcript holds TWO tool calls — an Edit with a
//      long multi-line replacement hunk, and a Write — straight into the store;
//   2. open it in the app (pick the workspace, click its sidebar row);
//   3. assert both cards are COLLAPSED: no diff, no preview, nothing leaked;
//   4. expand the Edit's diff and measure it — added and removed lines must
//      resolve to different computed colours, the region must be height-bounded
//      and scrolling rather than grown to fit, the composer must stay on screen,
//      and the other two disclosures must not have moved;
//   5. expand the Write and assert it renders a labelled preview and NOT ONE
//      added-line element — a fabricated Write diff is the failure this ticket
//      exists to prevent, and it would look perfectly fine in a screenshot.
//
// Confound guards, so a vacuous PASS is impossible:
//   * the seed is asserted to change more than one line on each side before the
//     app is involved — a one-line hunk cannot distinguish a coalesced run from
//     interleaved single-line edits (#59's lesson, one layer up);
//   * the collapsed check runs BEFORE any click, so "the diff is present" is
//     only meaningful against a proven-absent baseline;
//   * add and delete styling are compared to EACH OTHER and to context, because
//     "both classes rendered" passes even when all three look identical;
//   * the three disclosures are checked to move independently, since one shared
//     boolean satisfies every "is it visible" assertion;
//   * every failure says what could not be driven — silence reads as a pass.
//
//   node .claude/skills/run-desktop/gui-63.mjs
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

// ---- seed a session carrying an Edit hunk and a Write -----------------------

const SID = crypto.randomUUID()
const SEED_PROMPT = 'DIFF63 seed prompt from terminal'
const EDIT_PATH = 'src/main/session-index.ts'
const WRITE_PATH = 'src/main/new-module.ts'

const KEEP_HEAD = 'DIFF63-KEEP-HEAD'
const KEEP_TAIL = 'DIFF63-KEEP-TAIL'
const DROP_MARKER = 'DIFF63-DROP'
const ADD_MARKER = 'DIFF63-ADD'
const WRITE_MARKER = 'DIFF63-WRITTEN'

// Long enough that the capped region must scroll, and more than one changed
// line on each side so the hunk is a real run rather than a single edit.
const DROPPED = Array.from({ length: 30 }, (_, i) => `  const ${DROP_MARKER}_${i} = old(${i})`)
const ADDED = Array.from({ length: 30 }, (_, i) => `  const ${ADD_MARKER}_${i} = next(${i})`)
const OLD_STRING = [KEEP_HEAD, ...DROPPED, KEEP_TAIL].join('\n')
const NEW_STRING = [KEEP_HEAD, ...ADDED, KEEP_TAIL].join('\n')
const WRITE_CONTENT = Array.from({ length: 12 }, (_, i) => `${WRITE_MARKER}_${i}`).join('\n')

const EDIT_INPUT = {
  file_path: EDIT_PATH,
  old_string: OLD_STRING,
  new_string: NEW_STRING,
  replace_all: true
}
const WRITE_INPUT = { file_path: WRITE_PATH, content: WRITE_CONTENT }

const WORKSPACE = fs.mkdtempSync(path.join(os.tmpdir(), 'diff63-ws-'))
const STORE_DIR = path.join(os.homedir(), '.claude', 'projects', `diff63-${SID.slice(0, 8)}`)
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
const line = (rec) => JSON.stringify(rec) + '\n'
const seedUserUuid = crypto.randomUUID()
const editUseUuid = crypto.randomUUID()
const editResultUuid = crypto.randomUUID()
const writeUseUuid = crypto.randomUUID()
const EDIT_TOOL_ID = 'tu-diff63-edit'
const WRITE_TOOL_ID = 'tu-diff63-write'

const toolUse = (parent, uuid, id, name, input, ageMs) => ({
  ...base,
  parentUuid: parent,
  type: 'assistant',
  message: { role: 'assistant', content: [{ type: 'tool_use', id, name, input }] },
  uuid,
  timestamp: new Date(Date.now() - ageMs).toISOString()
})
const toolResult = (parent, uuid, id, text, ageMs) => ({
  ...base,
  parentUuid: parent,
  type: 'user',
  message: {
    role: 'user',
    content: [{ tool_use_id: id, type: 'tool_result', content: text, is_error: false }]
  },
  uuid,
  timestamp: new Date(Date.now() - ageMs).toISOString()
})

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
    line(toolUse(seedUserUuid, editUseUuid, EDIT_TOOL_ID, 'Edit', EDIT_INPUT, 59000)) +
    line(
      toolResult(
        editUseUuid,
        editResultUuid,
        EDIT_TOOL_ID,
        `The file ${EDIT_PATH} has been updated.`,
        58000
      )
    ) +
    line(toolUse(editResultUuid, writeUseUuid, WRITE_TOOL_ID, 'Write', WRITE_INPUT, 57000)) +
    line(
      toolResult(
        writeUseUuid,
        crypto.randomUUID(),
        WRITE_TOOL_ID,
        `The file ${WRITE_PATH} has been created.`,
        56000
      )
    )
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

// Guard zero: the fixture must contain a real multi-line run on both sides, or
// every assertion below is vacuous. Asserted on the seed, before the app exists.
log('FIXTURE', {
  droppedLines: DROPPED.length,
  addedLines: ADDED.length,
  oldBytes: OLD_STRING.length,
  writeLines: WRITE_CONTENT.split('\n').length
})
if (DROPPED.length < 2 || ADDED.length < 2) {
  console.log('FAIL')
  console.log(
    `  - the seeded hunk changes ${DROPPED.length} old and ${ADDED.length} new line(s); it cannot prove a run reads as one hunk`
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
  args: ['--no-sandbox', '--disable-gpu', '.'],
  cwd: APP_DIR,
  env: process.env,
  timeout: 30000
})

let page
const finish = async () => {
  await page?.screenshot({ path: path.join(SHOT_DIR, 'gui-63.png') }).catch(() => {})
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

let cardCount = 0
for (let i = 0; i < 20 && cardCount < 2; i++) {
  await page.waitForTimeout(500)
  cardCount = await page.evaluate(() => document.querySelectorAll('.tool-card').length)
}
if (cardCount < 2) {
  fails.push(
    `could not drive: the opened session rendered ${cardCount} tool card(s), expected 2 — the seeded calls did not replay, the checks under test never ran`
  )
  await finish()
}

// ---- collapsed baseline: neither card shows a change region -----------------

const collapsed = await page.evaluate(
  ({ drop, add, written }) => {
    const cards = [...document.querySelectorAll('.tool-card')]
    const edit = cards[0]
    const write = cards[1]
    const toggle = edit?.querySelector('.tool-card-toggle--change')
    const r = toggle?.getBoundingClientRect()
    return {
      editText: (edit?.textContent ?? '').slice(0, 80),
      leaks: [drop, add].filter((m) => (edit?.textContent ?? '').includes(m)),
      writeLeaks: (write?.textContent ?? '').includes(written),
      diffMounted: !!edit?.querySelector('.tool-card-diff'),
      previewMounted: !!write?.querySelector('.tool-card-content'),
      hasToggle: !!toggle,
      toggleTag: toggle?.tagName ?? null,
      toggleLabel: toggle?.textContent?.trim() ?? null,
      toggleExpanded: toggle?.getAttribute('aria-expanded') ?? null,
      toggleBox: r ? { w: Math.round(r.width), h: Math.round(r.height) } : null,
      writeToggleLabel:
        write?.querySelector('.tool-card-toggle--change')?.textContent?.trim() ?? null
    }
  },
  { drop: DROP_MARKER, add: ADD_MARKER, written: WRITE_MARKER }
)
log('COLLAPSED', collapsed)

if (collapsed.leaks.length) {
  fails.push(
    `the collapsed Edit card leaks ${collapsed.leaks.join(', ')} before any click — the diff is in the markup, not conditionally mounted`
  )
}
if (collapsed.writeLeaks) {
  fails.push(
    'the collapsed Write card leaks its content before any click — the preview is not conditionally mounted'
  )
}
if (collapsed.diffMounted) {
  fails.push('.tool-card-diff is mounted while collapsed — it must not exist until expanded')
}
if (collapsed.previewMounted) {
  fails.push('.tool-card-content is mounted while collapsed — it must not exist until expanded')
}
if (!collapsed.hasToggle) {
  fails.push(
    `no diff control on an Edit card supplying both an old and a new string (${DROPPED.length} lines each) — what the edit changed is unreachable`
  )
  await finish()
}
if (collapsed.toggleTag !== 'BUTTON') {
  fails.push(
    `the diff control is a <${collapsed.toggleTag}>, not a button — it is not keyboard reachable by default`
  )
}
if (collapsed.toggleExpanded !== 'false') {
  fails.push(
    `the collapsed diff control reports aria-expanded="${collapsed.toggleExpanded}" — assistive tech is told the wrong state`
  )
}
if (!collapsed.toggleBox || collapsed.toggleBox.w === 0 || collapsed.toggleBox.h === 0) {
  fails.push(
    `the diff control has a zero-size box (${JSON.stringify(collapsed.toggleBox)}) — it exists in the DOM but is not visible`
  )
}

// ---- expand the Edit's diff -------------------------------------------------

await page.evaluate(() =>
  document.querySelectorAll('.tool-card')[0]?.querySelector('.tool-card-toggle--change')?.click()
)
await page.waitForTimeout(400)

const expanded = await page.evaluate(
  ({ drop, add, keepHead }) => {
    const card = document.querySelectorAll('.tool-card')[0]
    const region = card?.querySelector('.tool-card-diff')
    const body = card?.querySelector('.tool-card-diff-body')
    const adds = [...(card?.querySelectorAll('.tool-card-diff-line--add') ?? [])]
    const dels = [...(card?.querySelectorAll('.tool-card-diff-line--del') ?? [])]
    const sames = [...(card?.querySelectorAll('.tool-card-diff-line--same') ?? [])]
    const style = (n) => {
      if (!n) return null
      const cs = getComputedStyle(n)
      return { color: cs.color, background: cs.backgroundColor }
    }
    const composer = document.querySelector('.message-input')
    const cr = composer?.getBoundingClientRect()
    const br = body?.getBoundingClientRect()
    const cardRect = card?.getBoundingClientRect()
    const bs = body ? getComputedStyle(body) : null
    const text = region?.textContent ?? ''
    return {
      regionMounted: !!region,
      addCount: adds.length,
      delCount: dels.length,
      sameCount: sames.length,
      addStyle: style(adds[0]),
      delStyle: style(dels[0]),
      sameStyle: style(sames[0]),
      addSample: adds[0]?.textContent?.slice(0, 30) ?? null,
      delSample: dels[0]?.textContent?.slice(0, 30) ?? null,
      addLeaksDropped: adds.some((n) => (n.textContent ?? '').includes(drop)),
      delLeaksAdded: dels.some((n) => (n.textContent ?? '').includes(add)),
      keepsContext: text.includes(keepHead),
      saysReplaceAll: text.includes('Replaces every occurrence'),
      // Two other disclosures on this card must not have moved.
      inputMounted: !!card?.querySelector('.tool-card-input'),
      outputMounted: !!card?.querySelector('.tool-card-output'),
      toggleExpanded:
        card?.querySelector('.tool-card-toggle--change')?.getAttribute('aria-expanded') ?? null,
      box: br ? { w: Math.round(br.width), h: Math.round(br.height) } : null,
      scrollHeight: body?.scrollHeight ?? 0,
      clientHeight: body?.clientHeight ?? 0,
      overflowY: bs?.overflowY ?? null,
      whiteSpace: bs?.whiteSpace ?? null,
      cardRight: cardRect ? Math.round(cardRect.right) : null,
      viewportWidth: window.innerWidth,
      composerBottom: cr ? Math.round(cr.bottom) : null,
      viewportHeight: window.innerHeight
    }
  },
  { drop: DROP_MARKER, add: ADD_MARKER, keepHead: KEEP_HEAD }
)
log('EXPANDED', expanded)
// Shot taken HERE, not only at finish(): the run ends on the Write card, so the
// final screenshot would never show the diff this ticket adds.
await page.screenshot({ path: path.join(SHOT_DIR, 'gui-63-diff.png') }).catch(() => {})

if (!expanded.regionMounted) {
  fails.push('clicking the diff control mounted nothing — .tool-card-diff absent after expand')
  await finish()
}
if (expanded.addCount < 2 || expanded.delCount < 2) {
  fails.push(
    `the hunk rendered ${expanded.delCount} removed and ${expanded.addCount} added line(s) for a ${DROPPED.length}-for-${ADDED.length} replacement — it is not a line diff`
  )
}
if (expanded.addLeaksDropped || expanded.delLeaksAdded) {
  fails.push(
    'a line is marked on the wrong side of the diff — added lines carry removed text or vice versa'
  )
}
if (!expanded.keepsContext) {
  fails.push(
    `the unchanged context line ${KEEP_HEAD} is missing — the hunk dropped the lines that did not change`
  )
}
if (!expanded.saysReplaceAll) {
  fails.push(
    'a replace_all Edit does not say it affects every occurrence — the change reads as a single site'
  )
}
// THE criterion jsdom cannot answer: two class names are not two appearances.
if (!expanded.addStyle || !expanded.delStyle) {
  fails.push('could not read computed styles for the diff lines')
} else {
  if (
    expanded.addStyle.color === expanded.delStyle.color &&
    expanded.addStyle.background === expanded.delStyle.background
  ) {
    fails.push(
      `added and removed lines render identically (colour ${expanded.addStyle.color}, background ${expanded.addStyle.background}) — the diff is not visually distinguished, only class-tagged`
    )
  }
  if (
    expanded.sameStyle &&
    expanded.addStyle.color === expanded.sameStyle.color &&
    expanded.addStyle.background === expanded.sameStyle.background
  ) {
    fails.push(
      'added lines render exactly like unchanged context — a change is indistinguishable from what it replaced'
    )
  }
}
if (expanded.inputMounted || expanded.outputMounted) {
  fails.push(
    'expanding the diff also mounted the input or output body — the three disclosures share a flag instead of moving independently'
  )
}
if (expanded.toggleExpanded !== 'true') {
  fails.push(`expanded diff control still reports aria-expanded="${expanded.toggleExpanded}"`)
}
if (!expanded.box || expanded.box.h === 0) {
  fails.push(
    `the diff has a zero-height box (${JSON.stringify(expanded.box)}) — mounted but not visible`
  )
}
if (expanded.scrollHeight <= expanded.clientHeight) {
  fails.push(
    `the diff is not scrolling a ${DROPPED.length + ADDED.length}-line hunk (scrollHeight ${expanded.scrollHeight} <= clientHeight ${expanded.clientHeight}) — it grew to fit instead of capping`
  )
}
if (!/^pre/.test(expanded.whiteSpace ?? '')) {
  fails.push(
    `the diff renders with white-space: ${expanded.whiteSpace} — a hunk must keep its line breaks`
  )
}
if (expanded.cardRight !== null && expanded.cardRight > expanded.viewportWidth) {
  fails.push(
    `the hunk pushed the card past the viewport (right ${expanded.cardRight} > width ${expanded.viewportWidth}) — lines are not wrapping`
  )
}
if (expanded.composerBottom !== null && expanded.composerBottom > expanded.viewportHeight) {
  fails.push(
    `expanding the diff pushed the composer off screen (bottom ${expanded.composerBottom} > viewport ${expanded.viewportHeight})`
  )
}

// ---- the Write card: a preview, and provably not a diff ---------------------

await page.evaluate(() =>
  document.querySelectorAll('.tool-card')[1]?.querySelector('.tool-card-toggle--change')?.click()
)
await page.waitForTimeout(400)

const write = await page.evaluate(
  ({ written }) => {
    const card = document.querySelectorAll('.tool-card')[1]
    const region = card?.querySelector('.tool-card-content')
    const body = card?.querySelector('.tool-card-content-body')
    const br = body?.getBoundingClientRect()
    return {
      previewMounted: !!region,
      diffMounted: !!card?.querySelector('.tool-card-diff'),
      addLines: card?.querySelectorAll('.tool-card-diff-line--add').length ?? 0,
      delLines: card?.querySelectorAll('.tool-card-diff-line--del').length ?? 0,
      labelled: (region?.textContent ?? '').includes('Proposed content'),
      showsContent: (region?.textContent ?? '').includes(written),
      toggleLabel: card?.querySelector('.tool-card-toggle--change')?.textContent?.trim() ?? null,
      box: br ? { w: Math.round(br.width), h: Math.round(br.height) } : null
    }
  },
  { written: WRITE_MARKER }
)
log('WRITE', write)
await page.screenshot({ path: path.join(SHOT_DIR, 'gui-63-write.png') }).catch(() => {})

if (!write.previewMounted) {
  fails.push(
    'the Write card mounted no content preview — what is about to be written is unreachable'
  )
} else {
  if (!write.showsContent) {
    fails.push('the Write preview does not contain the content it would write')
  }
  if (!write.labelled) {
    fails.push(
      'the Write preview is not labelled as proposed content — unlabelled it reads as a record of what happened'
    )
  }
  if (!write.box || write.box.h === 0) {
    fails.push(`the Write preview has a zero-height box (${JSON.stringify(write.box)})`)
  }
}
// The dangerous failure: a Write has NO before-state, so any added-line styling
// here is a fabricated diff — authoritative-looking green over content nobody
// ever read. It would look completely correct in a screenshot.
if (write.diffMounted || write.addLines > 0 || write.delLines > 0) {
  fails.push(
    `the Write card rendered diff lines (${write.addLines} added, ${write.delLines} removed) — Write supplies no before-state, so this is a fabricated diff`
  )
}

// ---- collapse the diff again ------------------------------------------------

await page.evaluate(() =>
  document.querySelectorAll('.tool-card')[0]?.querySelector('.tool-card-toggle--change')?.click()
)
await page.waitForTimeout(400)
const recollapsed = await page.evaluate(
  ({ drop }) => {
    const card = document.querySelectorAll('.tool-card')[0]
    return {
      diffMounted: !!card?.querySelector('.tool-card-diff'),
      leaks: (card?.textContent ?? '').includes(drop)
    }
  },
  { drop: DROP_MARKER }
)
log('RECOLLAPSED', recollapsed)
if (recollapsed.diffMounted || recollapsed.leaks) {
  fails.push('collapsing again left the diff mounted — the control only opens, it does not close')
}

await finish()
