// GUI eyeball for #45 — global cross-project session list + filter.
//
// jsdom renders the grouping but cannot tell you whether the real store
// actually yields many projects, whether the cap engages at real scale, or
// whether the head-truncated group heading lays out. Everything here is read
// out of the DOM; the screenshot is a courtesy, never the measurement.
//
//   node .claude/skills/run-desktop/gui-45.mjs
//
// Needs `npm run build` first. The folder-pick dialog is stubbed in the MAIN
// process and the path travels as an ARGUMENT rather than inside a string
// literal, so the escaped-backslash trap cannot bite. The picked folder is this
// repo, which is a real project in the store — so the "current" group is
// genuinely populated rather than a fixture.
//
// #65 retired this driver's foreign-row assertions. #45 shipped foreign rows as
// INERT; #47 deliberately made them openable, so "no foreign row was disabled"
// was asserting a contract the app had reversed on purpose — and the click
// probe behind it could no longer find a row to probe. What the run still
// verifies is everything #47 did NOT touch: that the list spans projects, that
// the cap engages at real scale, that the filter narrows and restores, and that
// a long group heading is head-truncated by real layout. gui-47.mjs owns the
// openable-foreign-row contract now.

import { _electron as electron } from 'playwright-core'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import { profileArgs } from './driver-profile.mjs'

const APP_DIR = path.resolve(import.meta.dirname, '../../..')
const SHOT_DIR = process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')
fs.mkdirSync(SHOT_DIR, { recursive: true })

const PICK_DIR = APP_DIR

setTimeout(() => {
  console.log('TIMEOUT')
  process.exit(1)
}, 90000).unref?.()

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
}, PICK_DIR)

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

await page.waitForSelector('.session-group-head', { timeout: 20000 })

// The rail SHIPS scoped to the open project, so a cross-project run has to
// establish that premise rather than inherit whatever this machine last stored.
// Without this the whole file measures one group and reads as a regression in
// the app (#65). Clicked through the real chip rather than seeded into
// localStorage, so it cannot depend on mounting after the write.
await page.evaluate(() => {
  ;[...document.querySelectorAll('.session-scope-btn')]
    .find((b) => b.textContent === 'All projects')
    ?.click()
})
await page.waitForTimeout(300)

const log = (label, m) => console.log(label.padEnd(10) + JSON.stringify(m))

const survey = () =>
  page.evaluate(() => {
    const heads = [...document.querySelectorAll('.session-group-head')]
    const rows = [...document.querySelectorAll('.session-row-btn')]
    const more = [...document.querySelectorAll('.session-more')][0]
    return {
      groups: heads.length,
      rows: rows.length,
      enabled: rows.filter((r) => !r.disabled).length,
      disabled: rows.filter((r) => r.disabled).length,
      firstGroup: heads[0]?.textContent ?? null,
      more: more?.textContent ?? null,
      // Matched count, not page size: every row survey below the cap would
      // otherwise read as 100 and no filter could be compared against another.
      total: rows.length + Number(/Show (\d+) more/.exec(more?.textContent ?? '')?.[1] ?? 0)
    }
  })

const initial = await survey()
log('INITIAL', initial)

// Head-truncation only proves itself on a heading too long for the rail.
const headOverflow = await page.evaluate(() => {
  const heads = [...document.querySelectorAll('.session-group-head')]
  const over = heads.filter((h) => h.scrollWidth > h.clientWidth)
  return { total: heads.length, clipped: over.length, any: over.length > 0 }
})
log('HEADCLIP', headOverflow)

// The current workspace's group: its rows are the only enabled ones.
const current = await page.evaluate((dir) => {
  const fold = (s) => s.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase()
  const heads = [...document.querySelectorAll('.session-group-head')]
  const head = heads.find((h) => fold(h.textContent) === fold(dir))
  if (!head) return { found: false, headings: heads.slice(0, 3).map((h) => h.textContent) }
  const rows = [...head.parentElement.querySelectorAll('.session-row-btn')]
  const cs = getComputedStyle(head)
  return {
    found: true,
    label: head.textContent,
    rowsInGroup: rows.length,
    allEnabled: rows.every((r) => !r.disabled),
    // Head-truncation: overflow clipped at the START, so a long path keeps its
    // meaningful tail. Only real layout can show this.
    direction: cs.direction,
    unicodeBidi: cs.unicodeBidi,
    textOverflow: cs.textOverflow,
    overflows: head.scrollWidth > head.clientWidth
  }
}, PICK_DIR)
log('CURRENT', current)

const setFilter = (text) =>
  page.evaluate((text) => {
    const el = document.querySelector('.sidebar-filter-input')
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
    setter.call(el, text)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }, text)

// Filter by a project path: the group label is matchable, so a full path must
// narrow to that one project. A partial name legitimately keeps every project
// it is a substring of, so it cannot assert a group COUNT — the old ">= 2
// groups" here was really asserting that this machine still had six sibling
// "playground" directories with sessions in them, and went red when it did not
// (#65). The machine-independent facts are that the partial narrows the store,
// and that it matches at least everything the full path it contains matched.
await setFilter(PICK_DIR)
await page.waitForTimeout(300)
const byProject = await survey()
log('BYPROJ', byProject)

await setFilter('playground')
await page.waitForTimeout(300)
const byPartial = await survey()
log('BYPART', byPartial)

await setFilter('zzz-no-such-session-zzz')
await page.waitForTimeout(300)
const noMatch = await page.evaluate(() => ({
  groups: document.querySelectorAll('.session-group-head').length,
  empty: document.querySelector('.sidebar-empty')?.textContent ?? null
}))
log('NOMATCH', noMatch)

await setFilter('')
await page.waitForTimeout(300)
const restored = await survey()
log('RESTORED', restored)

// Show more, if the store is big enough to have engaged the cap.
let expanded = null
if (restored.more) {
  await page.evaluate(() => document.querySelector('.session-more')?.click())
  await page.waitForTimeout(300)
  expanded = await survey()
  log('EXPANDED', expanded)
}

const shot = path.join(SHOT_DIR, 'sessions-global.png')
await page.screenshot({ path: shot })
console.log('SHOT ' + shot)

// ── verdict ────────────────────────────────────────────────────────────────
const fails = []
if (initial.groups < 2) fails.push('only one project group — the list is not global')
if (initial.rows > 100) fails.push(`cap not enforced (${initial.rows} rows)`)
if (!current.found) fails.push('the open workspace has no group of its own')
if (current.found && current.direction !== 'rtl') fails.push('group heading is not head-truncated')
if (byProject.groups !== 1) fails.push(`full-path filter left ${byProject.groups} groups`)
if (byPartial.total >= initial.total) {
  fails.push(`partial project filter did not narrow (${byPartial.total} of ${initial.total})`)
}
if (byPartial.total < byProject.total) {
  fails.push(`partial filter matched fewer (${byPartial.total}) than the full path it contains (${byProject.total})`)
}
if (!headOverflow.any) fails.push('no long group heading engaged head-truncation')
if (noMatch.groups !== 0 || !noMatch.empty?.startsWith('No sessions match')) {
  fails.push('an unmatched filter does not say so')
}
if (restored.rows !== initial.rows) fails.push('clearing the filter did not restore the list')
if (expanded && expanded.rows <= initial.rows) fails.push('Show more revealed nothing')
console.log(fails.length ? 'FAIL ' + fails.join(' | ') : 'PASS all #45 criteria')

// `app.close()` can hang after a clean run, and the 90s watchdog then reports
// TIMEOUT over a verdict that already printed. Arm the exit BEFORE awaiting it.
const exit = () => process.exit(fails.length ? 1 : 0)
setTimeout(exit, 3000).unref?.()
await app.close().catch(() => {})
console.log('DONE')
exit()
