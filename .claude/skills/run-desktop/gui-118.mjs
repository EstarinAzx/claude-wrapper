// GUI driver for #118 — the `@` file popover, in a REAL window.
//
// WHAT THE VITEST SUITE ALREADY PROVES, so this does not repeat it: the trigger
// window, the accept semantics, the ranking, the byte-identical send pin, and
// the main-side containment. All of that is jsdom-reachable and mutation-verified
// in tests/file-refs, tests/workspace-files and tests/at-mentions.
//
// WHAT ONLY THIS CAN PROVE, and every item is a real way this feature ships
// broken with a green suite:
//   1. the popover has a NON-ZERO BOX and real styling — jsdom computes no CSS,
//      so "it is in the DOM" is the most it can ever say. A popover with
//      height 0, or painted the same colour as the composer, is invisible;
//   2. the highlighted row is VISIBLY distinct from the rest. A selection state
//      that exists only in the accessibility tree is a control with no feedback
//      (gui-69's lesson, verbatim);
//   3. `.file-popover` / `.file-option` really are their own selectors and do
//      NOT collide with `.command-popover` / `.command-option` — the ticket's
//      own requirement, and the `.tool-card-toggle` failure it names;
//   4. the caret really lands mid-string after an accept. React resets the caret
//      to the end of a controlled value, so this is restored by an effect, and
//      jsdom's selection model is not the browser's;
//   5. the list is the REAL workspace walked by main over real IPC — the suite
//      mocks that channel entirely, so this is the only check that
//      `files:list` is wired at all and that it returns relative paths.
//
// Red-first: run against a build without the feature and step 1 fails naming
// the reason (no file popover). A driver never seen failing proves nothing.
//
//   node .claude/skills/run-desktop/gui-118.mjs
//
// Needs `npm run build` first, plus `npm i --no-save playwright-core`.

import { _electron as electron } from 'playwright-core'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'

const APP_DIR = path.resolve(import.meta.dirname, '../../..')
const SHOT_DIR = process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')
fs.mkdirSync(SHOT_DIR, { recursive: true })

// A real workspace with a known shape, so what the popover offers is checkable
// rather than whatever the repo happens to hold.
const WORKSPACE = fs.mkdtempSync(path.join(os.tmpdir(), 'at118-ws-'))
fs.mkdirSync(path.join(WORKSPACE, 'src'), { recursive: true })
fs.mkdirSync(path.join(WORKSPACE, 'node_modules', 'junk'), { recursive: true })
fs.writeFileSync(path.join(WORKSPACE, 'README.md'), '# demo\n')
fs.writeFileSync(path.join(WORKSPACE, 'src', 'alpha.ts'), 'export const a = 1\n')
fs.writeFileSync(path.join(WORKSPACE, 'src', 'beta.ts'), 'export const b = 2\n')
fs.writeFileSync(path.join(WORKSPACE, 'ignored.log'), 'noise\n')
fs.writeFileSync(path.join(WORKSPACE, '.gitignore'), '*.log\n')
fs.writeFileSync(path.join(WORKSPACE, 'node_modules', 'junk', 'index.js'), '//\n')

let cleaned = false
const cleanup = () => {
  if (cleaned) return
  cleaned = true
  try {
    fs.rmSync(WORKSPACE, { recursive: true, force: true })
  } catch {}
}

setTimeout(() => {
  console.log('TIMEOUT')
  cleanup()
  process.exit(1)
}, 240000).unref?.()

const log = (label, m) => console.log(label.padEnd(12) + JSON.stringify(m))
const fails = []

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
  timeout: 45000
})

let page
const finish = async () => {
  await page?.screenshot({ path: path.join(SHOT_DIR, 'gui-118.png') }).catch(() => {})
  console.log(fails.length === 0 ? 'PASS' : 'FAIL')
  for (const f of fails) console.log('  - ' + f)
  setTimeout(() => process.exit(fails.length === 0 ? 0 : 1), 5000).unref?.()
  await app.close().catch(() => {})
  cleanup()
  process.exit(fails.length === 0 ? 0 : 1)
}

await app.evaluate(({ dialog }, dir) => {
  dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [dir] })
}, WORKSPACE)

page = await app.firstWindow()
await page.waitForSelector('[aria-label="Backend mode"]', { timeout: 20000 })
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find(
    (b) =>
      b.getAttribute('aria-label') === 'Pick a project folder' ||
      b.textContent?.includes('Pick a project folder')
  )
  btn?.click()
})
const composerUp = await page
  .waitForSelector('.message-input', { timeout: 25000 })
  .then(() => true)
  .catch(() => false)
log('WORKSPACE', { picked: composerUp, dir: WORKSPACE })
if (!composerUp) {
  fails.push('could not drive: the composer never appeared, so nothing below ever ran')
  await finish()
}

// Types into the real textarea through the real React onChange path, then puts
// the caret where a user's would be. The caret is what opens the window.
//
// FOCUS FIRST, and it is load-bearing rather than tidiness: React's `onSelect`
// is delivered through document-level selection tracking and does NOT fire for
// an unfocused element. Without the focus call this helper silently leaves the
// caret wherever assigning `.value` put it — the end of the string — so every
// mid-string case tests a closed window instead of an open one. Measured: the
// first run of this driver failed the accept step for exactly that reason.
const typeInto = async (text, caret = text.length) => {
  await page.evaluate(
    ({ t, c }) => {
      const el = document.querySelector('.message-input')
      el.focus()
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(el, t)
      el.dispatchEvent(new Event('input', { bubbles: true }))
      el.setSelectionRange(c, c)
      el.dispatchEvent(new Event('select', { bubbles: true }))
      document.dispatchEvent(new Event('selectionchange'))
    },
    { t: text, c: caret }
  )
  await page.waitForTimeout(500)
}

const readPopover = () =>
  page.evaluate(() => {
    const pop = document.querySelector('.file-popover')
    if (!pop) return { mounted: false }
    const r = pop.getBoundingClientRect()
    const rows = [...pop.querySelectorAll('.file-option')].map((el) => {
      const rr = el.getBoundingClientRect()
      const cs = getComputedStyle(el)
      return {
        text: el.textContent?.trim() ?? '',
        selected: el.getAttribute('aria-selected') === 'true',
        box: { w: Math.round(rr.width), h: Math.round(rr.height) },
        background: cs.backgroundColor
      }
    })
    return {
      mounted: true,
      box: { w: Math.round(r.width), h: Math.round(r.height) },
      background: getComputedStyle(pop).backgroundColor,
      role: pop.getAttribute('role'),
      label: pop.getAttribute('aria-label'),
      rows,
      // Selector collision check: the command popover's classes must not be on
      // this element or its rows.
      collides:
        pop.classList.contains('command-popover') ||
        [...pop.querySelectorAll('.command-option')].length > 0
    }
  })

// ---- 1 + 5. the real list, over real IPC, from a real walk -------------------

await typeInto('@')
const opened = await readPopover()
log('OPEN', { ...opened, rows: opened.rows?.map((r) => r.text) })

if (!opened.mounted) {
  fails.push(
    'typing @ opened no file popover — the feature is absent from this build, or `files:list` never answered'
  )
  await finish()
}
if (opened.box.w === 0 || opened.box.h === 0) {
  fails.push(
    `the file popover has a zero box (${JSON.stringify(opened.box)}) — it is in the DOM and invisible, which is exactly what jsdom cannot see`
  )
}
if (opened.label !== 'File suggestions' || opened.role !== 'listbox') {
  fails.push(
    `the popover is ${JSON.stringify({ role: opened.role, label: opened.label })} — the GUI drivers and screen readers both select on these`
  )
}
if (opened.collides) {
  fails.push(
    'the file popover carries the COMMAND popover selectors — a bare shared selector matches whichever list renders first, which is silent and green'
  )
}

const names = (opened.rows ?? []).map((r) => r.text).join(' | ')
// The walk really ran in main: pruning and .gitignore are main-side, and no
// mock is involved anywhere in this process.
if (!names.includes('alpha.ts') || !names.includes('README.md')) {
  fails.push(`the popover offers ${JSON.stringify(names)} — the real workspace walk did not arrive`)
}
if (names.includes('index.js')) {
  fails.push('node_modules leaked into the suggestions — the main-side prune did not run')
}
if (names.includes('ignored.log')) {
  fails.push('a .gitignore-d file was offered — the main-side ignore did not run')
}

// ---- 2. the highlight is VISIBLE, not merely announced ----------------------

const active = opened.rows.find((r) => r.selected)
const inactive = opened.rows.find((r) => !r.selected)
if (!active) {
  fails.push('no row is selected on open — there is nothing for Enter to accept')
} else if (inactive && active.background === inactive.background) {
  fails.push(
    `the selected and unselected rows paint identically (${active.background}) — the selection exists only in the accessibility tree`
  )
}
for (const r of opened.rows) {
  if (r.box.h === 0) fails.push(`row ${JSON.stringify(r.text)} has zero height — not visible`)
}
await page.screenshot({ path: path.join(SHOT_DIR, 'gui-118-open.png') }).catch(() => {})

// ---- 3. narrowing, in the real browser --------------------------------------

await typeInto('@alph')
const narrowed = await readPopover()
log('NARROW', { rows: narrowed.rows?.map((r) => r.text) })
if (!narrowed.mounted || (narrowed.rows ?? []).length === 0) {
  fails.push('typing a prefix emptied the popover — the ranking never matched the real paths')
} else if (!narrowed.rows[0].text.includes('alpha.ts')) {
  fails.push(`the best match for "alph" is ${JSON.stringify(narrowed.rows[0].text)}`)
}

// ---- 4. the caret lands MID-STRING after an accept ---------------------------

// The one behaviour a controlled React input actively fights: it resets the
// caret to the end of the new value, so this is restored by an effect. jsdom's
// selection model is not the browser's, which is why it is checked here.
await typeInto('look at @alph and stop', 13)
await page.evaluate(() =>
  document
    .querySelector('.message-input')
    ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
)
await page.waitForTimeout(600)

const accepted = await page.evaluate(() => {
  const el = document.querySelector('.message-input')
  return { value: el.value, caret: el.selectionStart, popover: !!document.querySelector('.file-popover') }
})
log('ACCEPT', accepted)

if (accepted.value !== 'look at @src/alpha.ts  and stop') {
  fails.push(
    `the accept produced ${JSON.stringify(accepted.value)} — expected the token replaced in place with the prose after it intact`
  )
}
if (accepted.caret !== 'look at @src/alpha.ts '.length) {
  fails.push(
    `the caret landed at ${accepted.caret}, expected ${'look at @src/alpha.ts '.length} — React reset it to the end of the value and the restore did not run`
  )
}
if (accepted.popover) {
  fails.push('the popover stayed open on the completed path — the trailing space did not close the window')
}

await page.screenshot({ path: path.join(SHOT_DIR, 'gui-118-accepted.png') }).catch(() => {})

console.log(
  'NOTE        the trigger window, accept semantics, ranking, byte-identical send and main-side containment are pinned in vitest; this driver only covers what jsdom structurally cannot see.'
)

await finish()
