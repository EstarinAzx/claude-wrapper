// GUI driver for #69 (spec #64) — prove the Backdrop control reaches the REAL
// window, and be honest about the one thing it cannot prove.
//
// WHAT THIS CANNOT DO, stated first so no one reads a PASS as more than it is:
// it cannot tell you whether Acrylic and Mica LOOK different. That is a claim
// about DWM compositing over a wallpaper, and a capture of this window under
// automation is not evidence either way. The screenshots this writes are for a
// human to open; the assertions below are about the value's journey, not its
// appearance. Launched WITHOUT --disable-gpu for that reason — the recorded trap
// is that disabling the GPU flattens acrylic, so a driver that disables it is
// photographing neither material.
//
// What it DOES prove, none of which the jsdom suite can:
//   1. the panel renders two options with visible, non-zero boxes and real
//      styling — jsdom computes no CSS, so "it is in the DOM" is all it knows;
//   2. the selected option is VISIBLY distinct from the unselected one, i.e. the
//      aria-checked CSS rule actually paints. A selection state that exists only
//      in the accessibility tree is a control with no feedback;
//   3. the copy is the agreed trade and the word "persistent" is nowhere in the
//      rendered panel;
//   4. clicking a material genuinely calls setBackgroundMaterial ON THE WINDOW,
//      with the whitelisted value, by instrumenting the method in MAIN. The
//      vitest suite can only see that the preload function was called;
//   5. the window is NOT rebuilt to apply it — same window id before and after,
//      which is the "no restart, no window rebuild" criterion;
//   6. the choice survives a real process restart: a second launch reads it back
//      and re-pushes it to main. A reload is used to make the mount push
//      observable rather than racing the patch against renderer boot.
//
// Red-first: run against a build without the feature and step 1 fails naming the
// reason (no Backdrop control in the panel). A driver never seen failing proves
// nothing.
//
//   node .claude/skills/run-desktop/gui-69.mjs
//
// Needs `npm run build` first, plus `npm i --no-save playwright-core`.
// Leaves the app's stored backdrop as it found it.

import { _electron as electron } from 'playwright-core'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import { profileArgs } from './driver-profile.mjs'

const APP_DIR = path.resolve(import.meta.dirname, '../../..')
const SHOT_DIR = process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')
fs.mkdirSync(SHOT_DIR, { recursive: true })

const WORKSPACE = fs.mkdtempSync(path.join(os.tmpdir(), 'backdrop69-ws-'))

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

// Instrument setBackgroundMaterial in MAIN. Recording the argument on the window
// is the only way to separate "the renderer called a preload function" from "the
// window was actually told". If the method is missing, that IS the finding.
const instrument = (app) =>
  app.evaluate(({ BrowserWindow }) => {
    globalThis.__bdCalls = []
    const proto = BrowserWindow.prototype
    if (typeof proto.setBackgroundMaterial !== 'function') return { patched: false }
    if (!globalThis.__bdOriginal) globalThis.__bdOriginal = proto.setBackgroundMaterial
    const original = globalThis.__bdOriginal
    proto.setBackgroundMaterial = function (material) {
      globalThis.__bdCalls.push(material)
      return original.call(this, material)
    }
    return { patched: true }
  })

const calls = (app) => app.evaluate(() => globalThis.__bdCalls ?? [])
const windowIds = (app) =>
  app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().map((w) => w.id))

// Launch with the GPU ON: this window is the point of the exercise.
const launch = () =>
  electron.launch({
    executablePath: electronBin,
    args: ['--no-sandbox', ...profileArgs(), '.'],
    cwd: APP_DIR,
    env: process.env,
    timeout: 45000
  })

const openWorkspace = async (app) => {
  await app.evaluate(({ dialog }, dir) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [dir] })
  }, WORKSPACE)
  const page = await app.firstWindow()
  await page.waitForSelector('[aria-label="Backend mode"]', { timeout: 20000 })
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(
      (b) =>
        b.getAttribute('aria-label') === 'Pick a project folder' ||
        b.textContent?.includes('Pick a project folder')
    )
    btn?.click()
  })
  await page.waitForSelector('.message-input', { timeout: 25000 })
  return page
}

const click = (page, label) =>
  page.evaluate((l) => document.querySelector(`[aria-label="${l}"]`)?.click(), label)

let app = await launch()
let page
const finish = async () => {
  console.log(fails.length === 0 ? 'PASS' : 'FAIL')
  for (const f of fails) console.log('  - ' + f)
  console.log(
    'NOTE        whether Acrylic and Mica look different is NOT asserted here and cannot be; open the screenshots to judge that.'
  )
  setTimeout(() => process.exit(fails.length === 0 ? 0 : 1), 5000).unref?.()
  await app?.close().catch(() => {})
  cleanup()
  process.exit(fails.length === 0 ? 0 : 1)
}

// ---- launch 1: the control, its look, and the call it makes -----------------

const patched = await instrument(app)
log('PATCH', patched)
if (!patched.patched) {
  fails.push(
    'BrowserWindow has no setBackgroundMaterial on this Electron — the whole feature rests on a method that is not there'
  )
  await finish()
}

page = await openWorkspace(app)
const idsBefore = await windowIds(app)

await click(page, 'Appearance panel')
await page.waitForTimeout(1200)

const panel = await page.evaluate(() => {
  const dock = document.querySelector('.appearance-dock')
  const group = dock?.querySelector('[role="radiogroup"]')
  const options = [...(group?.querySelectorAll('[role="radio"]') ?? [])].map((el) => {
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    const desc = document.getElementById(el.getAttribute('aria-describedby') ?? '')
    return {
      value: el.dataset.backdrop ?? null,
      name: el.getAttribute('aria-label'),
      checked: el.getAttribute('aria-checked') === 'true',
      box: { w: Math.round(r.width), h: Math.round(r.height) },
      background: cs.backgroundColor,
      borderColor: cs.borderTopColor,
      desc: desc?.textContent?.trim() ?? null,
      descVisible: desc ? desc.getBoundingClientRect().height > 0 : false
    }
  })
  return {
    dockMounted: !!dock,
    groupMounted: !!group,
    labelledBy: group?.getAttribute('aria-labelledby') ?? null,
    labelText:
      document.getElementById(group?.getAttribute('aria-labelledby') ?? '')?.textContent?.trim() ??
      null,
    options,
    panelText: dock?.textContent ?? '',
    stored: window.localStorage.getItem('backdrop')
  }
})
log('PANEL', {
  ...panel,
  panelText: panel.panelText.slice(0, 120) + (panel.panelText.length > 120 ? '…' : '')
})
await page.screenshot({ path: path.join(SHOT_DIR, 'gui-69-acrylic.png') }).catch(() => {})

if (!panel.dockMounted) {
  fails.push('the Appearance dock did not open — nothing below could be driven')
  await finish()
}
if (!panel.groupMounted || panel.options.length === 0) {
  fails.push(
    'no Backdrop control in the Appearance panel — no radiogroup rendered, so every check below never ran'
  )
  await finish()
}
if (panel.options.length !== 2) {
  fails.push(
    `the Backdrop control renders ${panel.options.length} options, expected exactly Acrylic and Mica`
  )
}
if (panel.options.map((o) => o.value).join(',') !== 'acrylic,mica') {
  fails.push(
    `the options are ${JSON.stringify(panel.options.map((o) => o.value))}, expected acrylic then mica`
  )
}
if (!/Backdrop/i.test(panel.labelText ?? '')) {
  fails.push(
    `the radiogroup is labelled ${JSON.stringify(panel.labelText)} rather than Backdrop — its label association is broken`
  )
}
// jsdom cannot see any of this: a control in the DOM with a zero box is invisible.
for (const o of panel.options) {
  if (o.box.w === 0 || o.box.h === 0) {
    fails.push(`the ${o.name} option has a zero-size box (${JSON.stringify(o.box)}) — not visible`)
  }
  if (!o.descVisible) {
    fails.push(
      `the ${o.name} option's description is not visible — the trade is the whole point of the copy`
    )
  }
}
// The selection has to be VISIBLE, not merely announced.
const [acrylic, mica] = panel.options
if (acrylic && mica && acrylic.background === mica.background && acrylic.borderColor === mica.borderColor) {
  fails.push(
    `the selected and unselected options paint identically (bg ${acrylic.background}, border ${acrylic.borderColor}) — the selection state exists only in the accessibility tree`
  )
}
if (!acrylic?.checked) {
  fails.push(
    `a fresh window opens with ${JSON.stringify(panel.options.find((o) => o.checked)?.value ?? 'nothing')} selected — Acrylic is the default and the identity`
  )
}
if (/persist/i.test(panel.panelText)) {
  fails.push(
    'the rendered panel contains the word "persistent" — what ships is Mica, which is persistent WITHOUT being acrylic, and the copy must not claim otherwise'
  )
}
const flat = (s) => (s ?? '').replace(/[’']/g, "'")
if (
  !flat(acrylic?.desc).includes(
    "Blurs what's behind the window; Windows flattens it when the window loses focus."
  )
) {
  fails.push(`the Acrylic description reads ${JSON.stringify(acrylic?.desc)} — not the agreed trade`)
}
if (!flat(mica?.desc).includes("A steady tint from your wallpaper; doesn't blur, doesn't flatten.")) {
  fails.push(`the Mica description reads ${JSON.stringify(mica?.desc)} — not the agreed trade`)
}

// ---- the criterion jsdom cannot answer: does the WINDOW get told? -----------

await calls(app) // drain whatever the mount push logged before we start counting
await app.evaluate(() => {
  globalThis.__bdCalls = []
})

await click(page, 'Mica')
await page.waitForTimeout(900)

const afterPick = await calls(app)
const idsAfter = await windowIds(app)
const picked = await page.evaluate(() => ({
  checked: document.querySelector('[role="radio"][aria-checked="true"]')?.dataset.backdrop ?? null,
  stored: window.localStorage.getItem('backdrop')
}))
log('PICK', { afterPick, idsBefore, idsAfter, ...picked })
await page.screenshot({ path: path.join(SHOT_DIR, 'gui-69-mica.png') }).catch(() => {})

if (!afterPick.includes('mica')) {
  fails.push(
    `clicking Mica did not reach the window: setBackgroundMaterial calls were ${JSON.stringify(afterPick)} — the control is inert past the renderer`
  )
}
if (afterPick.some((m) => !['acrylic', 'mica'].includes(m))) {
  fails.push(
    `the window was handed ${JSON.stringify(afterPick)} — a value outside the two-string whitelist reached setBackgroundMaterial`
  )
}
if (picked.checked !== 'mica') {
  fails.push(`clicking Mica left ${JSON.stringify(picked.checked)} selected — the choice did not move`)
}
if (picked.stored !== 'mica') {
  fails.push(
    `the choice was not persisted (localStorage holds ${JSON.stringify(picked.stored)}) — it cannot survive a restart`
  )
}
// "Applies immediately, with no restart and no window rebuild."
if (JSON.stringify(idsBefore) !== JSON.stringify(idsAfter)) {
  fails.push(
    `the window was rebuilt to apply the material (ids ${JSON.stringify(idsBefore)} → ${JSON.stringify(idsAfter)}) — it is specified to apply to the live window`
  )
}

await app.close().catch(() => {})

// ---- launch 2: a real restart reads it back and re-pushes it ----------------

app = await launch()
await instrument(app)
page = await openWorkspace(app)

// Deterministic rather than racy: the mount push fires on every renderer mount,
// so remounting AFTER the patch is installed is what makes it observable. The
// process restart above is the real one; this only moves the observation point.
await app.evaluate(() => {
  globalThis.__bdCalls = []
})
await page.reload()
await page.waitForSelector('[aria-label="Backend mode"]', { timeout: 20000 })
await page.waitForTimeout(1200)

const relaunch = await calls(app)
const restored = await page.evaluate(() => window.localStorage.getItem('backdrop'))
log('RELAUNCH', { calls: relaunch, restored })

if (restored !== 'mica') {
  fails.push(
    `after a real restart the stored material is ${JSON.stringify(restored)} — the choice did not survive`
  )
}
if (!relaunch.includes('mica')) {
  fails.push(
    `on mount the renderer pushed ${JSON.stringify(relaunch)} — the stored material is not reapplied, so the window opens acrylic while the panel says Mica`
  )
}

// Leave the machine as we found it: this is the user's real app data.
await page.evaluate(() => window.localStorage.removeItem('backdrop'))

await finish()
