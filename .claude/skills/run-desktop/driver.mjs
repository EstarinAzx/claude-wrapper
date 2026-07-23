// One-shot GUI driver for the claude-wrapper Electron app.
// Launches the BUILT app (out/) via Playwright's _electron, reads the two
// titlebar pills straight from the DOM, and screenshots the window. Pass
// --cycle to also click each pill once and re-read (proves the toggles fire +
// the main-side broadcast re-renders them).
//
// Must live under the project tree: ESM resolves the bare `playwright-core`
// import by walking up to the project's node_modules.
//
//   node .claude/skills/run-desktop/driver.mjs [--cycle]
//
// Verified on win32. Bin path is resolved per-platform; on headless Linux you
// would additionally need xvfb-run + the Chromium .so libs (see SKILL.md).

import { _electron as electron } from 'playwright-core'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'

const APP_DIR = path.resolve(import.meta.dirname, '../../..')
const SHOT_DIR = process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')
fs.mkdirSync(SHOT_DIR, { recursive: true })
const cycle = process.argv.includes('--cycle')

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
  // Inherit the launch env: a wisp-routed shell → backend pill reads "Wisped",
  // a plain shell → "Native" (native-locked).
  env: process.env,
  timeout: 30000
})
const page = await app.firstWindow()

const readPill = (label) =>
  page.evaluate((l) => {
    const el = document.querySelector(`[aria-label="${l}"]`)
    return (
      el && {
        text: el.textContent,
        className: el.className,
        disabled: el.disabled,
        title: el.getAttribute('title')
      }
    )
  }, label)
const clickPill = (label) =>
  page.evaluate((l) => document.querySelector(`[aria-label="${l}"]`)?.click(), label)

await page.waitForSelector('[aria-label="Backend mode"]', { timeout: 15000 })
await page.waitForSelector('[aria-label="Permission mode"]', { timeout: 15000 })

console.log('BACKEND ' + JSON.stringify(await readPill('Backend mode')))
console.log('PERMISSION ' + JSON.stringify(await readPill('Permission mode')))
const shot1 = path.join(SHOT_DIR, 'pills.png')
await page.screenshot({ path: shot1 })
console.log('SHOT ' + shot1)

if (cycle) {
  await clickPill('Permission mode')
  await page.waitForTimeout(500)
  await clickPill('Backend mode')
  await page.waitForTimeout(500)
  console.log('BACKEND_AFTER ' + JSON.stringify(await readPill('Backend mode')))
  console.log('PERMISSION_AFTER ' + JSON.stringify(await readPill('Permission mode')))
  const shot2 = path.join(SHOT_DIR, 'pills-after.png')
  await page.screenshot({ path: shot2 })
  console.log('SHOT ' + shot2)
}

await app.close()
console.log('DONE')
