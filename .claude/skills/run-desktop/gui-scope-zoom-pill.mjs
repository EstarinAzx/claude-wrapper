// Driver for the three changes in this leg:
//   1. the sessions rail opens scoped to the open project, with a chip to widen
//   2. the default zoom is raised (visible as scale in the screenshots)
//   3. the composer pill no longer sweeps into a lozenge once it grows
//
// (3) is the one that needs a REAL window: jsdom applies no stylesheet, so the
// only place a border-radius clamp is observable is a browser doing layout.
//
//   node .claude/skills/run-desktop/gui-scope-zoom-pill.mjs

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

await app.evaluate(async ({ dialog }, dir) => {
  dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [dir] })
}, PICK_DIR)

const page = await app.firstWindow()
await page.waitForSelector('[aria-label="Backend mode"]', { timeout: 15000 })

// Start from the shipped defaults rather than whatever this machine has stored,
// so the screenshots show what a user actually opens into.
await page.evaluate(() => {
  window.localStorage.removeItem('sidebar-scope')
  window.localStorage.removeItem('zoom-level-v2')
})

await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find(
    (b) =>
      b.getAttribute('aria-label') === 'Pick a project folder' ||
      b.textContent?.includes('Pick a project folder')
  )
  btn?.click()
})

await page.waitForSelector('.session-scope-btn', { timeout: 20000 })
await page.waitForSelector('.session-row-btn', { timeout: 20000 })

const log = (label, m) => console.log(label.padEnd(12) + JSON.stringify(m))
const shot = async (name) => {
  const p = path.join(SHOT_DIR, `${name}.png`)
  await page.screenshot({ path: p })
  console.log(`SHOT ${p}`)
}

const railState = () =>
  page.evaluate(() => ({
    chips: [...document.querySelectorAll('.session-scope-btn')].map((b) => ({
      label: b.textContent,
      pressed: b.getAttribute('aria-pressed')
    })),
    groups: [...document.querySelectorAll('.session-group-head')].map((h) => h.textContent),
    rows: document.querySelectorAll('.session-row-btn').length,
    zoom: Number(window.localStorage.getItem('zoom-level-v2'))
  }))

const clickChip = async (label) => {
  await page.evaluate((l) => {
    ;[...document.querySelectorAll('.session-scope-btn')].find((b) => b.textContent === l)?.click()
  }, label)
  await page.waitForTimeout(250)
}

// ── 1 + 2: the rail opens on this project, at the new zoom ──
log('SCOPED', await railState())
await shot('scope-this-project')

await clickChip('All projects')
const all = await railState()
log('ALL', { chips: all.chips, groupCount: all.groups.length, rows: all.rows })
await shot('scope-all-projects')

await clickChip('This project')
log('BACK', await railState())

// ── 3: the composer at its ceiling ──
// Native setter + input event so React's onChange sees it; field-sizing then
// grows the textarea to the 8-line cap and the pill grows with it.
const pillMetrics = async (text) => {
  await page.evaluate((t) => {
    const el = document.querySelector('.message-input')
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value'
    ).set
    setter.call(el, t)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }, text)
  await page.waitForTimeout(200)
  return page.evaluate(() => {
    const pill = document.querySelector('.input-pill')
    const box = pill.getBoundingClientRect()
    return {
      height: Math.round(box.height),
      radius: getComputedStyle(pill).borderTopLeftRadius,
      // What --r-pill WOULD have rendered as: the browser clamps a 999px radius
      // to half the shorter side, so this is the lozenge sweep being avoided.
      lozengeRadiusWouldBe: Math.round(Math.min(box.width, box.height) / 2)
    }
  })
}

log('RESTING', await pillMetrics(''))
await shot('composer-resting')

log('GROWN', await pillMetrics(Array.from({ length: 12 }, (_, i) => `line ${i + 1}`).join('\n')))
await shot('composer-grown')

await pillMetrics('')
await app.close()
