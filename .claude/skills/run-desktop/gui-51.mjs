// GUI eyeball for #51 — one global scrollbar rule.
//
// jsdom cannot render a scrollbar at all, and `::-webkit-scrollbar` is not
// reachable through getComputedStyle, so the CSS-text pins in
// tests/scrollbar.test.ts prove the rule is WRITTEN but not that Chromium
// applies it. This measures the thing that matters instead: the scrollbar
// gutter, as `offsetWidth - clientWidth`, in the real built app.
//
//   Windows default bar ≈ 15-17px.  Our rule = 10px.
//
// Measured in the DOM, never read off the screenshot (the screenshot is a
// courtesy for the human). The probe div is a legitimate instrument here and
// not a fixture dodge: the claim under test is precisely "this rule is GLOBAL",
// so an arbitrary element inheriting it is the claim, not a proxy for it.
//
//   node .claude/skills/run-desktop/gui-51.mjs
//
// Needs `npm run build` first, plus playwright-core.

import { _electron as electron } from 'playwright-core'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'

const APP_DIR = path.resolve(import.meta.dirname, '../../..')
const SHOT_DIR = process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')
fs.mkdirSync(SHOT_DIR, { recursive: true })

const PICK_DIR = APP_DIR
const EXPECTED_GUTTER = 10

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
  args: ['--no-sandbox', '--disable-gpu', '.'],
  cwd: APP_DIR,
  env: process.env,
  timeout: 30000
})

// Stub the native dialog in MAIN before any click that opens one, or the run
// blocks forever. The path travels as an ARGUMENT, never inside a literal.
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
await page.waitForTimeout(2500)

// `offsetWidth - clientWidth` is the gutter PLUS the horizontal borders, so a
// bordered element (`.model-menu` has a 1px hairline) reads 2px high. Subtract
// them or the instrument reports a defect the app does not have.
const GUTTER_FN = `(el) => {
  const cs = getComputedStyle(el)
  const borders = parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth)
  return el.offsetWidth - el.clientWidth - borders
}`

// 1. The global rule, live in the built CSS: a plain overflowing div inherits it.
const probe = await page.evaluate((fnSrc) => {
  const gutterOf = eval(fnSrc)
  const d = document.createElement('div')
  d.style.cssText = 'position:fixed;left:-9999px;width:120px;height:60px;overflow-y:auto'
  d.innerHTML = '<div style="height:600px"></div>'
  document.body.appendChild(d)
  const gutter = gutterOf(d)
  d.remove()
  return gutter
}, GUTTER_FN)

// 2. The reported element. Open the model menu and measure it for real.
await page.evaluate(() => {
  document.querySelector('[aria-label="Model"]')?.click()
})
await page.waitForTimeout(400)

const menu = await page.evaluate((fnSrc) => {
  const gutterOf = eval(fnSrc)
  const el = document.querySelector('.model-menu')
  if (!el) return null
  return {
    items: el.querySelectorAll('.model-menu-item').length,
    scrolls: el.scrollHeight > el.clientHeight,
    gutter: gutterOf(el)
  }
}, GUTTER_FN)

// 3. Every other overflow container that exists on screen right now.
const others = await page.evaluate((fnSrc) => {
  const gutterOf = eval(fnSrc)
  const out = {}
  for (const sel of ['.chat', '.session-groups', '.command-list', '.command-popover', '.message-input']) {
    const el = document.querySelector(sel)
    if (!el) {
      out[sel] = { present: false }
      continue
    }
    out[sel] = {
      present: true,
      scrolls: el.scrollHeight > el.clientHeight,
      gutter: gutterOf(el)
    }
  }
  return out
}, GUTTER_FN)

const shot = path.join(SHOT_DIR, 'gui-51-model-menu.png')
await page.screenshot({ path: shot })

console.log('=== #51 scrollbar gutters (offsetWidth - clientWidth) ===')
console.log(`expected gutter when scrolling: ${EXPECTED_GUTTER}px  (Windows default ≈ 15-17px)`)
console.log(`probe div (proves the rule is GLOBAL): ${probe}px`)
console.log('model menu:', JSON.stringify(menu))
console.log('others:', JSON.stringify(others, null, 1))

// Windows display scaling makes CSS pixels fractional: a 1px hairline computes
// to ~0.909px, so a bordered element's gutter lands at 10.18, not 10. Compare
// with tolerance; an exact match would fail on the owner's own monitor.
const isGutter = (px) => Math.abs(px - EXPECTED_GUTTER) < 0.5

const bad = []
if (!isGutter(probe)) bad.push(`probe div gutter ${probe}px`)
if (!menu) bad.push('model menu did not open — NOT DRIVEN, not a pass')
else if (menu.scrolls && !isGutter(menu.gutter)) bad.push(`model menu gutter ${menu.gutter}px`)
else if (!menu.scrolls) console.log('NOT DRIVEN: model menu had too few items to overflow this run')
// Silence is not a pass: say plainly what this run could not reach.
for (const [sel, m] of Object.entries(others)) {
  if (!m.present) console.log(`NOT DRIVEN: ${sel} absent this run (dock closed / no popover)`)
  else if (!m.scrolls) console.log(`NOT DRIVEN: ${sel} present but not overflowing — gutter unmeasured`)
  else if (!isGutter(m.gutter)) bad.push(`${sel} gutter ${m.gutter}px`)
}

console.log(`screenshot: ${shot}`)
console.log(bad.length === 0 ? 'PASS' : 'FAIL: ' + bad.join(' | '))

setTimeout(() => process.exit(bad.length === 0 ? 0 : 1), 4000).unref?.()
await app.close().catch(() => {})
process.exit(bad.length === 0 ? 0 : 1)
