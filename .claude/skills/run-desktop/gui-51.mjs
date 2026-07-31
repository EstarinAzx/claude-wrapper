// GUI eyeball for #51 — one global scrollbar rule.
//
// jsdom cannot render a scrollbar at all, and `::-webkit-scrollbar` is not
// reachable through getComputedStyle, so the CSS-text pins in
// tests/scrollbar.test.ts prove the rule is WRITTEN but not that Chromium
// applies it. This measures the thing that matters instead: the scrollbar
// gutter, in the real built app, in device pixels (see GUTTER_FN — #71).
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

// Measuring the gutter, and why not with `offsetWidth - clientWidth` (#71).
//
// Both of those are rounded to whole CSS pixels, and under a scaled renderer
// the gutter is not a whole number: Chromium lays the bar out in whole DEVICE
// pixels, so at zoom 1.25 a 10px rule becomes 12.5 → 12 device px → 9.6 CSS px.
// Rounding then reports that one true value as three different numbers
// depending on where each element's box happens to sit — measured on #71:
//
//   zoom 1.25, every surface truly 9.6css / 12dev, yet the old instrument read
//   probe 10 · .model-menu 9.4 · .session-groups 9   (hence the old ±0.5 FAIL)
//
// So measure the content box to subpixel precision instead: a `width:100%`
// shim's rect IS the content box, which is what `clientWidth` rounds away.
// A textarea renders no element children, so its shim reads 0 — the guard
// below catches that and falls back to the coarse instrument, flagged.
const GUTTER_FN = `(el) => {
  const cs = getComputedStyle(el)
  const num = (v) => parseFloat(v) || 0
  const borders = num(cs.borderLeftWidth) + num(cs.borderRightWidth)
  const padding = num(cs.paddingLeft) + num(cs.paddingRight)
  const inner = el.getBoundingClientRect().width - borders - padding

  const shim = document.createElement('div')
  shim.style.cssText = 'width:100%;height:0;padding:0;margin:0;border:0'
  el.appendChild(shim)
  const contentW = shim.getBoundingClientRect().width
  shim.remove()

  return contentW > 0 && contentW <= inner + 0.5
    ? { gutter: inner - contentW, exact: true }
    : { gutter: el.offsetWidth - el.clientWidth - borders, exact: false }
}`

// The renderer is scaled (`useZoom` applies webContents zoom), and the scale is
// what turns the authored 10px into a fractional CSS value. Read it, don't
// assume it: `devicePixelRatio` already folds display scaling and zoom together,
// which is exactly the factor the bar is snapped against.
const dpr = await page.evaluate(() => window.devicePixelRatio)

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
    ...gutterOf(el)
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
      ...gutterOf(el)
    }
  }
  return out
}, GUTTER_FN)

const shot = path.join(SHOT_DIR, 'gui-51-model-menu.png')
await page.screenshot({ path: shot })

// The comparison happens in DEVICE pixels, because that is the space the bar is
// actually laid out in and the only one where the expectation is zoom-free:
// `10px` authored is `10 * dpr` device px, snapped to a whole one. The CSS-pixel
// reading is the derived, zoom-dependent quantity — pinning THAT is what broke.
const dev = (cssPx) => cssPx * dpr
const EXPECTED_DEV = dev(EXPECTED_GUTTER)
// Budget: 1 device px for Chromium's snap (12.5 → 12 at zoom 1.25). A coarse
// (non-exact) reading also carries up to a whole CSS pixel of rounding, so it
// gets that back in device px. Both budgets keep their teeth — deleting the
// rule from base.css was measured on #71 and puts every surface at 15dev
// against an expected 12.5, i.e. 2.5x past the exact budget. Never widen these
// to make a number fit; #65 exists to undo exactly that move.
const isGutter = (m) => Math.abs(dev(m.gutter) - EXPECTED_DEV) < (m.exact ? 1 : 1 + dpr)
const show = (m) =>
  `${Number(m.gutter.toFixed(3))}css / ${Number(dev(m.gutter).toFixed(3))}dev${m.exact ? '' : ' (coarse)'}`

console.log('=== #51 scrollbar gutters (content-box measured, compared in device px) ===')
console.log(
  `expected: ${EXPECTED_GUTTER}css → ${Number(EXPECTED_DEV.toFixed(3))}dev at dpr ${dpr}  (Windows default ≈ 15-17css)`
)
console.log(`probe div (proves the rule is GLOBAL): ${show(probe)}`)
console.log('model menu:', JSON.stringify(menu))
console.log('others:', JSON.stringify(others, null, 1))

const bad = []
if (!isGutter(probe)) bad.push(`probe div gutter ${show(probe)}`)
if (!menu) bad.push('model menu did not open — NOT DRIVEN, not a pass')
else if (menu.scrolls && !isGutter(menu)) bad.push(`model menu gutter ${show(menu)}`)
else if (!menu.scrolls) console.log('NOT DRIVEN: model menu had too few items to overflow this run')
// Silence is not a pass: say plainly what this run could not reach.
for (const [sel, m] of Object.entries(others)) {
  if (!m.present) console.log(`NOT DRIVEN: ${sel} absent this run (dock closed / no popover)`)
  else if (!m.scrolls) console.log(`NOT DRIVEN: ${sel} present but not overflowing — gutter unmeasured`)
  else if (!isGutter(m)) bad.push(`${sel} gutter ${show(m)}`)
}

console.log(`screenshot: ${shot}`)
console.log(bad.length === 0 ? 'PASS' : 'FAIL: ' + bad.join(' | '))

setTimeout(() => process.exit(bad.length === 0 ? 0 : 1), 4000).unref?.()
await app.close().catch(() => {})
process.exit(bad.length === 0 ? 0 : 1)
