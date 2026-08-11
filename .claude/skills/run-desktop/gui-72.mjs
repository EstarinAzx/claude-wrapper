// GUI eyeball for #72 — the session title truncates instead of overlapping.
//
// jsdom loads no CSS, so no vitest test in this repo can see a layout collision;
// the whole defect lives in the cascade. This measures it in the real built app,
// in the DOM, with `getBoundingClientRect` — never off the screenshot, which
// cannot see the right ~20% of the layout at the 1.25 default zoom.
//
// The driver ESTABLISHES ITS OWN PREMISE: run it against main BEFORE the fix
// and it must be RED (the title's rect crosses its neighbours at the narrow
// widths), or it is measuring nothing. Verified red on `0a47bfa` at 1024 and
// 860, green after the CSS fix, and red again with `overflow: hidden` deleted
// from `.session-title`.
//
//   node .claude/skills/run-desktop/gui-72.mjs
//
// Needs `npm run build` first, plus playwright-core.

import { _electron as electron } from 'playwright-core'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import { profileArgs } from './driver-profile.mjs'

const APP_DIR = path.resolve(import.meta.dirname, '../../..')
const SHOT_DIR = process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')
fs.mkdirSync(SHOT_DIR, { recursive: true })

// The ticket's acceptance criterion is a 60-character folder name. Built to
// length rather than typed to it, so the number in the assertion and the number
// on the disk cannot drift apart.
const NAME_LEN = 60
const LONG_NAME = 'claude-wrapper-long-project-folder-name-'.padEnd(NAME_LEN, 'x')
if (LONG_NAME.length !== NAME_LEN) throw new Error(`fixture name is ${LONG_NAME.length}, want ${NAME_LEN}`)
const LONG_DIR = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'gui72-')), LONG_NAME)
fs.mkdirSync(LONG_DIR, { recursive: true })

// Content widths in device px and, at the 1.25 default zoom, the CSS page width
// each produces — the four rows of the ticket's collision table. The narrowest
// is where a 21-character name already collided, so it is the row that matters.
const WIDTHS = [1600, 1280, 1024, 860]
const EPS = 0.5

setTimeout(() => {
  console.log('TIMEOUT')
  process.exit(1)
}, 120000).unref?.()

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

// Stub the native dialog in MAIN before the click that opens one, or the run
// blocks forever. The path travels as an ARGUMENT, never inside a literal.
await app.evaluate(async ({ dialog }, dir) => {
  dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [dir] })
}, LONG_DIR)

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
await page.waitForTimeout(3000)

// Everything the verdict needs, read once per width. The computed `display` is
// worth carrying: an inline box has no client box at all (`clientWidth` 0), and
// `overflow` / `text-overflow` do not apply to it — that is the root cause, not
// a detail. A flex item is blockified, which is how the fix makes them apply
// without the span's own `display` ever being authored.
const READ = `() => {
  const q = (s) => document.querySelector(s)
  const t = q('.session-title'), c = q('.titlebar-center')
  const l = q('.titlebar-left'), r = q('.titlebar-right')
  if (!t || !c || !l || !r) return null
  const R = (el) => {
    const b = el.getBoundingClientRect()
    return { left: b.left, right: b.right, width: b.width }
  }
  const cs = getComputedStyle(t)
  return {
    page: window.innerWidth,
    dpr: window.devicePixelRatio,
    title: R(t), center: R(c), left: R(l), right: R(r),
    text: t.textContent,
    display: cs.display,
    overflowX: cs.overflowX,
    textOverflow: cs.textOverflow,
    clientWidth: t.clientWidth,
    scrollWidth: t.scrollWidth
  }
}`

const rows = []
for (const w of WIDTHS) {
  await app.evaluate(({ BrowserWindow }, width) => {
    BrowserWindow.getAllWindows()[0]?.setContentSize(width, 800)
  }, w)
  await page.waitForTimeout(600)
  const m = await page.evaluate((src) => eval(src)(), READ)
  rows.push({ w, m })
}

const shot = path.join(SHOT_DIR, 'gui-72-titlebar-narrow.png')
await page.screenshot({ path: shot })

const bad = []
const n = (v) => Number(v.toFixed(1))

console.log(`=== #72 session title: ${NAME_LEN}-char folder name, truncation + collision ===`)
console.log(`fixture: ${LONG_DIR}`)

for (const { w, m } of rows) {
  if (!m) {
    bad.push(`${w}dev: titlebar elements missing — NOT DRIVEN, not a pass`)
    continue
  }
  // Silence is not a pass: if the workspace never switched, the title still
  // reads "New session" and every geometry assertion below would pass for the
  // wrong reason.
  if (m.text !== LONG_NAME) {
    bad.push(`${w}dev: title reads ${JSON.stringify(m.text)}, not the ${NAME_LEN}-char fixture — NOT DRIVEN, not a pass`)
    continue
  }

  const clipped = m.scrollWidth > m.clientWidth + EPS
  console.log(
    `${w}dev → page ${n(m.page)}css | left.right ${n(m.left.right)} | title ${n(m.title.left)}..${n(m.title.right)} ` +
      `(${n(m.title.width)}css) | right.left ${n(m.right.left)} | slot ${n(m.center.left)}..${n(m.center.right)} ` +
      `| display ${m.display} overflow-x ${m.overflowX} text-overflow ${m.textOverflow} ` +
      `| client ${m.clientWidth} scroll ${m.scrollWidth}${clipped ? ' (truncating)' : ''}`
  )

  // 1. The defect itself: the title's rect crossing either neighbour.
  if (m.title.left < m.left.right - EPS) {
    bad.push(`${w}dev: title starts at ${n(m.title.left)}, under .titlebar-left which ends at ${n(m.left.right)}`)
  }
  if (m.title.right > m.right.left + EPS) {
    bad.push(`${w}dev: title ends at ${n(m.title.right)}, under .titlebar-right which starts at ${n(m.right.left)}`)
  }
  // 2. And it stays inside its own slot, so the fix is containment rather than
  //    two blocks that happen not to meet at the widths sampled.
  if (m.title.left < m.center.left - EPS || m.title.right > m.center.right + EPS) {
    bad.push(`${w}dev: title ${n(m.title.left)}..${n(m.title.right)} escapes its slot ${n(m.center.left)}..${n(m.center.right)}`)
  }

  if (w === WIDTHS[0]) {
    // Criterion 2 — a name that fits is not ellipsised. 60 chars fits the wide
    // slot (the measured collision threshold there is 111), so any clipping at
    // this width is the fix over-reaching.
    if (clipped) bad.push(`${w}dev: ${NAME_LEN} chars fits this slot but is clipped (client ${m.clientWidth} < scroll ${m.scrollWidth})`)
  }
  if (w === WIDTHS[WIDTHS.length - 1]) {
    // Criterion 1 — at the narrowest width it must actually truncate, with the
    // ellipsis machinery live. Containment alone could otherwise be satisfied by
    // an element that simply overflowed invisibly.
    if (!clipped) bad.push(`${w}dev: ${NAME_LEN} chars cannot fit this slot yet nothing is clipped (client ${m.clientWidth}, scroll ${m.scrollWidth})`)
    if (m.overflowX !== 'hidden') bad.push(`${w}dev: overflow-x is ${m.overflowX}, so nothing clips`)
    if (m.textOverflow !== 'ellipsis') bad.push(`${w}dev: text-overflow is ${m.textOverflow}, so the clip has no ellipsis`)
  }
}

console.log(`screenshot: ${shot}`)
console.log(bad.length === 0 ? 'PASS' : 'FAIL: ' + bad.join(' | '))

setTimeout(() => process.exit(bad.length === 0 ? 0 : 1), 4000).unref?.()
await app.close().catch(() => {})
// Best-effort, and only after the app is down: the engine holds the fixture as
// its cwd, so an EBUSY here is ordinary and must never decide the verdict.
try {
  fs.rmSync(path.dirname(LONG_DIR), { recursive: true, force: true })
} catch {
  console.log(`(left behind: ${path.dirname(LONG_DIR)})`)
}
process.exit(bad.length === 0 ? 0 : 1)
