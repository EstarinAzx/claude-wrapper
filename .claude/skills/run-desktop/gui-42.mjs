// GUI eyeball for #42 — multiline prompt composition.
//
// jsdom cannot see `field-sizing: content`, so the growth ceiling and the
// height reset are only verifiable in real Chromium. Everything here is read
// out of the DOM; the screenshot is a courtesy, never the measurement.
//
//   node .claude/skills/run-desktop/gui-42.mjs
//
// Needs `npm run build` first. The folder-pick dialog is stubbed in the MAIN
// process; the path travels as an argument rather than inside a string
// literal, so the escaped-backslash trap cannot bite.

import { _electron as electron } from 'playwright-core'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import { profileArgs } from './driver-profile.mjs'

const APP_DIR = path.resolve(import.meta.dirname, '../../..')
const SHOT_DIR = process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')
fs.mkdirSync(SHOT_DIR, { recursive: true })

const PICK_DIR = path.join(os.tmpdir(), 'gui42-workspace')
fs.mkdirSync(PICK_DIR, { recursive: true })

// Nothing should keep this process alive on a hung close.
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

// Main-process stub: every folder dialog answers with PICK_DIR.
await app.evaluate(async ({ dialog }, dir) => {
  dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [dir] })
}, PICK_DIR)

const page = await app.firstWindow()
await page.waitForSelector('[aria-label="Backend mode"]', { timeout: 15000 })

// DOM-dispatched: Playwright's actionability wait hangs on the intro animation.
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find(
    (b) => b.getAttribute('aria-label') === 'Pick a project folder' || b.textContent?.includes('Pick a project folder')
  )
  btn?.click()
})

await page.waitForSelector('.message-input', { timeout: 15000 })

const SEL = '.message-input'

// React owns the value, so drive it through the native setter and let the
// input event reach onChange — the same path a real keystroke takes.
const setValue = (text) =>
  page.evaluate(
    ({ sel, text }) => {
      const el = document.querySelector(sel)
      const setter = Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype,
        'value'
      ).set
      setter.call(el, text)
      el.dispatchEvent(new Event('input', { bubbles: true }))
    },
    { sel: SEL, text }
  )

const measure = () =>
  page.evaluate((sel) => {
    const el = document.querySelector(sel)
    const cs = getComputedStyle(el)
    return {
      tag: el.tagName,
      rows: el.rows,
      clientHeight: el.clientHeight,
      scrollHeight: el.scrollHeight,
      maxHeight: cs.maxHeight,
      fieldSizing: cs.fieldSizing ?? '(unsupported)',
      overflowY: cs.overflowY,
      inlineHeight: el.style.height,
      lineHeight: cs.lineHeight,
      value: JSON.stringify(el.value)
    }
  }, SEL)

const line = (n) => Array.from({ length: n }, (_, i) => `line ${i + 1}`).join('\n')

const log = (label, m) => console.log(label.padEnd(10) + JSON.stringify(m))

await setValue('')
const empty = await measure()
log('EMPTY', empty)

await setValue(line(3))
const three = await measure()
log('THREE', three)

await setValue(line(8))
const eight = await measure()
log('EIGHT', eight)

await setValue(line(20))
const twenty = await measure()
log('TWENTY', twenty)

// Criterion 6 — clearing the value must return it to one line.
await setValue('')
const reset = await measure()
log('RESET', reset)

// Criterion 2, live: a real Shift+Enter through the browser's own key path.
await page.evaluate((sel) => document.querySelector(sel).focus(), SEL)
await setValue('first')
await page.keyboard.press('Shift+Enter')
await page.keyboard.type('second')
const typed = await measure()
log('SHIFTENT', typed)

// Criterion 9 — send it and read the bubble back.
await page.keyboard.press('Enter')
await page.waitForTimeout(1200)
const bubble = await page.evaluate(() => {
  const el = document.querySelector('.msg-user .bubble')
  if (!el) return null
  const cs = getComputedStyle(el)
  return {
    text: JSON.stringify(el.textContent),
    whiteSpace: cs.whiteSpace,
    overflowWrap: cs.overflowWrap,
    height: el.clientHeight,
    scrollWidth: el.scrollWidth,
    clientWidth: el.clientWidth
  }
})
log('BUBBLE', bubble)
const afterSend = await measure()
log('AFTSEND', afterSend)

// Long unbroken token must wrap inside the bubble, not run past it. Probed by
// injecting a bubble beside a real one rather than by sending a second turn:
// the engine may still be busy, and a swallowed send would silently re-measure
// the PREVIOUS bubble and read as a pass.
const longTok = await page.evaluate(() => {
  const real = document.querySelector('.msg-user .bubble')
  if (!real) return null
  const row = real.parentElement
  const probe = real.cloneNode(false)
  probe.textContent = 'x'.repeat(400)
  row.parentElement.insertBefore(row.cloneNode(false), row.nextSibling).appendChild(probe)
  const out = {
    isClone: probe !== real,
    overflows: probe.scrollWidth > probe.clientWidth + 1,
    scrollWidth: probe.scrollWidth,
    clientWidth: probe.clientWidth,
    lines: Math.round(probe.clientHeight / parseFloat(getComputedStyle(probe).lineHeight))
  }
  probe.parentElement.remove()
  return out
})
log('LONGTOK', longTok)

const shot = path.join(SHOT_DIR, 'multiline.png')
await page.screenshot({ path: shot })
console.log('SHOT ' + shot)

// ── verdict ────────────────────────────────────────────────────────────────
const lh = parseFloat(empty.lineHeight)
const fails = []
if (empty.tag !== 'TEXTAREA') fails.push('composer is not a textarea')
if (three.clientHeight <= empty.clientHeight) fails.push('does not grow with content')
if (twenty.clientHeight > eight.clientHeight + 2) fails.push('grows past the 8-line cap')
if (twenty.scrollHeight <= twenty.clientHeight) fails.push('capped but not scrolling')
if (Math.abs(reset.clientHeight - empty.clientHeight) > 1) fails.push('height did not reset')
if (JSON.parse(typed.value) !== 'first\nsecond') fails.push('Shift+Enter did not break the line')
if (!bubble || !JSON.parse(bubble.text).includes('first\nsecond')) fails.push('bubble lost the newline')
if (bubble && bubble.whiteSpace !== 'pre-wrap') fails.push('bubble is not pre-wrap')
if (longTok?.overflows) fails.push('long token overflows the bubble')
console.log(`LINEHEIGHT ${lh}  8-line-cap≈${(lh * 8 + 12).toFixed(1)}`)
console.log(fails.length ? 'FAIL ' + fails.join(' | ') : 'PASS all #42 criteria')

await app.close()
console.log('DONE')
// The verdict has to reach the exit code. This driver computed `fails`, printed
// it, and then exited 0 unconditionally — so every harness that reads exit codes
// (the DOM phase, #135) would have called it green no matter what it found. It
// was the only driver in the set doing this, and `dom-phase.mjs` now catches the
// shape (a printed FAIL under a zero exit is reported as LIED) so the next one
// cannot hide either.
setTimeout(() => process.exit(fails.length ? 1 : 0), 500)
