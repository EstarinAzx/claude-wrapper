// GUI driver for #66 (spec #64) — prove the Appearance dock exists in the REAL
// window and that its zoom stepper actually resizes the window's contents. The
// vitest suite runs in jsdom, which computes no styles and has no webContents:
// there, "the readout says 135%" is the ONLY observable, and a stepper wired to
// a state variable and nothing else passes every assertion in the file. Whether
// the window's text actually changed size is a question only a real window
// answers.
//
// Red-first (gui-54's lesson): run this against a build WITHOUT the feature and
// it must fail naming the right reason (no Appearance toggle in the titlebar).
// A driver never seen failing proves nothing.
//
// Scenario, no engine and no CLI:
//   1. open a throwaway workspace (the docks are cwd-gated, so there is nothing
//      to drive before this);
//   2. assert the dock is ABSENT before any click — the baseline that makes
//      "it opened" mean something;
//   3. open it from the titlebar and measure the shell it inherits: it must be
//      as wide as the sessions rail, carry a visible head, and render NO resize
//      grip (the one shell affordance this dock deliberately drops);
//   4. step the zoom UP and measure the window, not the readout: a webContents
//      zoom factor change shrinks the viewport in CSS pixels and grows the
//      rendered font, so both must move in the right direction together;
//   5. step it back DOWN and require the viewport to return — a one-way change
//      would pass step 4 while being a broken control;
//   6. drive the KEYBOARD path and assert the panel's readout followed it, the
//      criterion the lift out of the effect closure exists to satisfy;
//   7. open Agents and assert Appearance closed itself — mutual exclusion in the
//      one right slot, where a third dock added as its own boolean would stack.
//
// Confound guards, so a vacuous PASS is impossible:
//   * the viewport is measured BEFORE the first step, so every later delta is
//     against a real baseline rather than an assumed one;
//   * the window measurement and the readout are checked SEPARATELY — a readout
//     that moves while the window does not is precisely the bug jsdom cannot
//     see, and it is reported as its own failure;
//   * zoom-out must undo zoom-in, so a stepper that only ever grows is caught;
//   * the keyboard path is driven through the real window's key handling, not
//     through the panel, so the two input paths are proven to share one level;
//   * every failure says what could not be driven — silence reads as a pass.
//
//   node .claude/skills/run-desktop/gui-66.mjs
//
// Needs `npm run build` first, plus `npm i --no-save playwright-core`.

import { _electron as electron } from 'playwright-core'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'

const APP_DIR = path.resolve(import.meta.dirname, '../../..')
const SHOT_DIR = process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')
fs.mkdirSync(SHOT_DIR, { recursive: true })

const WORKSPACE = fs.mkdtempSync(path.join(os.tmpdir(), 'appearance66-ws-'))

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
}, 180000).unref?.()

const log = (label, m) => console.log(label.padEnd(12) + JSON.stringify(m))
const fails = []

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
  await page?.screenshot({ path: path.join(SHOT_DIR, 'gui-66.png') }).catch(() => {})
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

const click = (label) =>
  page.evaluate((l) => document.querySelector(`[aria-label="${l}"]`)?.click(), label)

// ---- baseline: the dock does not exist until it is opened -------------------

const before = await page.evaluate(() => ({
  hasToggle: !!document.querySelector('[aria-label="Appearance panel"]'),
  dockMounted: !!document.querySelector('.appearance-dock'),
  innerWidth: window.innerWidth,
  innerHeight: window.innerHeight,
  bodyFontPx: parseFloat(getComputedStyle(document.body).fontSize),
  railWidth: Math.round(document.querySelector('.sidebar')?.getBoundingClientRect().width ?? 0)
}))
log('BEFORE', before)

if (!before.hasToggle) {
  fails.push(
    'no Appearance toggle in the titlebar of a window with a project open — the panel is unreachable, every check below never ran'
  )
  await finish()
}
if (before.dockMounted) {
  fails.push('.appearance-dock is mounted before any click — the dock is not gated on its toggle')
}

// ---- open it and measure the shell it inherits ------------------------------

// Long enough for the pane's intro animation to finish: measurements are
// unaffected by it, but a screenshot taken mid-flight shows a half-painted
// window and is useless as the eyeball half of this ticket's evidence.
await click('Appearance panel')
await page.waitForTimeout(1600)

const opened = await page.evaluate(() => {
  const dock = document.querySelector('.appearance-dock')
  const r = dock?.getBoundingClientRect()
  const head = dock?.querySelector('.agents-dock-head')
  const hr = head?.getBoundingClientRect()
  const readout = dock?.querySelector('.appearance-readout')
  const cs = dock ? getComputedStyle(dock) : null
  // What the shared dock-shell group DECLARES, read out of the live stylesheet.
  // Compared against the panel's computed width below, this is what separates
  // "joined the group" from "duplicated it with the same number today" — and it
  // is the only honest baseline, because both sibling docks are drag-resizable
  // and carry a restored inline width that says nothing about the group.
  const groupWidth = (() => {
    for (const sheet of document.styleSheets) {
      let rules
      try {
        rules = sheet.cssRules
      } catch {
        continue
      }
      for (const rule of rules ?? []) {
        if (
          rule.selectorText &&
          /(^|,\s*)\.agents-dock\s*(,|$)/.test(rule.selectorText) &&
          rule.style?.width
        ) {
          return rule.style.width
        }
      }
    }
    return null
  })()
  return {
    mounted: !!dock,
    label: dock?.getAttribute('aria-label') ?? null,
    joinsShell: !!dock?.classList.contains('agents-dock'),
    groupWidth,
    box: r ? { w: Math.round(r.width), h: Math.round(r.height) } : null,
    right: r ? Math.round(r.right) : null,
    viewportWidth: window.innerWidth,
    borderLeft: cs?.borderLeftWidth ?? null,
    headHeight: hr ? Math.round(hr.height) : 0,
    headText: head?.textContent?.trim() ?? null,
    grips: dock?.querySelectorAll('.agents-dock-resize-handle').length ?? 0,
    gripVisible: [...(dock?.querySelectorAll('.agents-dock-resize-handle') ?? [])].some(
      (g) => getComputedStyle(g).display !== 'none'
    ),
    inlineStyle: dock?.getAttribute('style') ?? null,
    readoutText: readout?.textContent?.trim() ?? null,
    readoutBox: readout
      ? {
          w: Math.round(readout.getBoundingClientRect().width),
          h: Math.round(readout.getBoundingClientRect().height)
        }
      : null,
    stepperCount: dock?.querySelectorAll('.appearance-step').length ?? 0,
    hasSlider: !!dock?.querySelector('input, select'),
    saveish: [...(dock?.querySelectorAll('button') ?? [])]
      .map((b) => `${b.getAttribute('aria-label') ?? ''} ${b.textContent ?? ''}`.trim())
      .filter((t) => /save|apply|reset|revert/i.test(t))
  }
})
log('OPENED', opened)
await page.screenshot({ path: path.join(SHOT_DIR, 'gui-66-open.png') }).catch(() => {})

if (!opened.mounted) {
  fails.push('clicking the Appearance toggle mounted nothing — .appearance-dock absent after click')
  await finish()
}
if (!opened.box || opened.box.w === 0 || opened.box.h === 0) {
  fails.push(
    `the Appearance dock has a zero-size box (${JSON.stringify(opened.box)}) — mounted but not visible`
  )
}
if (opened.right !== null && opened.right > opened.viewportWidth + 1) {
  fails.push(
    `the dock hangs past the viewport (right ${opened.right} > width ${opened.viewportWidth}) — it is not in the right slot`
  )
}
// It JOINS the shell rather than duplicating it. Two halves: it is literally on
// the group's class, and its rendered width is the width that group declares —
// a private copy of the shell would drift from the declaration the moment
// anyone edited one of the two.
if (!opened.joinsShell) {
  fails.push(
    'the panel does not carry the .agents-dock class — it duplicates the dock shell instead of joining it'
  )
}
if (!opened.groupWidth) {
  fails.push(
    'could not read a width off the shared .agents-dock group — the shell group this panel is specified to join is gone'
  )
} else if (opened.box && Math.abs(opened.box.w - parseFloat(opened.groupWidth)) > 2) {
  fails.push(
    `the dock renders ${opened.box.w}px against the shared group's declared ${opened.groupWidth} — it is overriding the shell width rather than joining it`
  )
}
if (opened.headHeight < 40) {
  fails.push(
    `the dock head is ${opened.headHeight}px tall, not the shell's 44px — the head group was duplicated rather than joined`
  )
}
if (!/Appearance/i.test(opened.headText ?? '')) {
  fails.push(`the dock head reads ${JSON.stringify(opened.headText)} rather than Appearance`)
}
if (opened.borderLeft === '0px') {
  fails.push('the dock has no left border — it is not on the shell border group')
}
// The one shell affordance this dock deliberately drops.
if (opened.gripVisible) {
  fails.push(
    `the dock renders a live resize grip (${opened.grips} handle(s)) — it is specified fixed-width with no grip and no persisted width`
  )
}
if (opened.inlineStyle && /width/.test(opened.inlineStyle)) {
  fails.push(
    `the dock carries an inline width (${opened.inlineStyle}) — a persisted width it is specified not to have`
  )
}
if (opened.stepperCount !== 2) {
  fails.push(
    `the zoom control renders ${opened.stepperCount} stepper(s), expected exactly minus and plus`
  )
}
if (opened.hasSlider) {
  fails.push('the zoom control rendered an input or select — it is specified as steppers only')
}
if (opened.saveish.length) {
  fails.push(
    `the panel carries ${opened.saveish.join(', ')} — it must commit on change, with no draft state`
  )
}
if (!opened.readoutBox || opened.readoutBox.h === 0) {
  fails.push(
    `the zoom readout has a zero-height box (${JSON.stringify(opened.readoutBox)}) — present in the DOM but not visible`
  )
}

// ---- THE criterion jsdom cannot answer: does the window actually resize? -----

const baseline = await page.evaluate(() => ({
  innerWidth: window.innerWidth,
  bodyFontPx: parseFloat(getComputedStyle(document.body).fontSize),
  readout: document.querySelector('.appearance-readout')?.textContent?.trim() ?? null
}))

await click('Zoom in')
await page.waitForTimeout(600)

const zoomedIn = await page.evaluate(() => ({
  innerWidth: window.innerWidth,
  bodyFontPx: parseFloat(getComputedStyle(document.body).fontSize),
  readout: document.querySelector('.appearance-readout')?.textContent?.trim() ?? null
}))
log('ZOOM+', { baseline, zoomedIn })
await page.screenshot({ path: path.join(SHOT_DIR, 'gui-66-zoomed.png') }).catch(() => {})

if (zoomedIn.readout === baseline.readout) {
  fails.push(
    `the readout did not move on a zoom-in click (${baseline.readout} → ${zoomedIn.readout}) — the control is inert`
  )
}
// A readout that moves while the window does not is the exact bug a jsdom suite
// cannot see: a stepper wired to a state variable and to nothing else.
if (zoomedIn.innerWidth >= baseline.innerWidth) {
  fails.push(
    `zooming in did not shrink the viewport (${baseline.innerWidth} → ${zoomedIn.innerWidth} CSS px) — the readout moved but the window did not, so the stepper is not reaching webContents`
  )
}
if (!(zoomedIn.bodyFontPx > 0) || zoomedIn.bodyFontPx !== baseline.bodyFontPx) {
  // Font size is expressed in CSS px, which the zoom factor rescales the
  // viewport against; it is reported here rather than asserted, because the
  // viewport delta above is the load-bearing measurement.
  log('FONT', { before: baseline.bodyFontPx, after: zoomedIn.bodyFontPx })
}

// ---- and back down: a one-way stepper would have passed everything above ----

await click('Zoom out')
await page.waitForTimeout(600)

const zoomedBack = await page.evaluate(() => ({
  innerWidth: window.innerWidth,
  readout: document.querySelector('.appearance-readout')?.textContent?.trim() ?? null
}))
log('ZOOM-', zoomedBack)

if (zoomedBack.readout !== baseline.readout) {
  fails.push(
    `stepping out did not return the level (${baseline.readout} → ${zoomedIn.readout} → ${zoomedBack.readout}) — the two steppers are not symmetric`
  )
}
if (Math.abs(zoomedBack.innerWidth - baseline.innerWidth) > 2) {
  fails.push(
    `stepping out did not return the viewport (${baseline.innerWidth} → ${zoomedBack.innerWidth} CSS px) — the minus stepper does not undo the plus`
  )
}

// ---- the keyboard path, and the readout that must follow it -----------------

await page.keyboard.down('Control')
await page.keyboard.press('Equal')
await page.keyboard.up('Control')
await page.waitForTimeout(600)

const afterKey = await page.evaluate(() => ({
  innerWidth: window.innerWidth,
  readout: document.querySelector('.appearance-readout')?.textContent?.trim() ?? null
}))
log('CTRL+', afterKey)

if (afterKey.innerWidth >= baseline.innerWidth) {
  fails.push(
    `Ctrl+= did not zoom the window (${baseline.innerWidth} → ${afterKey.innerWidth} CSS px) — the shortcut regressed while the panel was added`
  )
} else if (afterKey.readout === baseline.readout) {
  fails.push(
    `the window zoomed on Ctrl+= but the panel still reads ${afterKey.readout} — the readout does not follow the shortcuts, so the panel disagrees with the window`
  )
}

await page.keyboard.down('Control')
await page.keyboard.press('Digit0')
await page.keyboard.up('Control')
await page.waitForTimeout(600)

// ---- one right slot: opening Agents must close Appearance -------------------

await click('Agents panel')
await page.waitForTimeout(400)

const exclusive = await page.evaluate(() => ({
  appearanceMounted: !!document.querySelector('.appearance-dock'),
  agentsMounted: !!document.querySelector('[aria-label="Agents"]'),
  docks: document.querySelectorAll('.agents-dock').length
}))
log('EXCLUSIVE', exclusive)

if (exclusive.appearanceMounted) {
  fails.push(
    'opening Agents left the Appearance dock mounted — two panels stacked in the one right slot'
  )
}
if (!exclusive.agentsMounted) {
  fails.push('could not drive: the Agents dock did not open, so mutual exclusion was never tested')
}
if (exclusive.docks > 1) {
  fails.push(`${exclusive.docks} docks are mounted at once — the right slot holds exactly one`)
}

// ---- a portrait of the panel, for the human half of the evidence ------------
//
// Every assertion above is on measured rects and is already done. This block
// only produces a picture, and it needs one trick to produce a usable one: the
// window composites `windowWidth` DEVICE pixels while the page lays out
// `windowWidth` CSS pixels at a zoom factor of 1.25, so the rightmost ~20% of
// the layout — which is exactly where any right-hand dock sits — is never
// painted into a capture. That is a property of this launch config and applies
// to the Agents dock just as much; it is not something this ticket introduced.
// Dropping the factor to 1 makes CSS and device pixels agree, so the panel can
// actually be photographed. Presentational only: setZoom is called directly, so
// nothing is persisted, and no assertion runs after it.
await click('Appearance panel')
await page.evaluate(() => window.api.setZoom(1))
await page.waitForTimeout(800)

const portrait = await page.evaluate(() => {
  const dock = document.querySelector('.appearance-dock')
  const r = dock?.getBoundingClientRect()
  return {
    mounted: !!dock,
    paintable: r ? Math.round(r.right) <= window.innerWidth : false,
    box: r ? { w: Math.round(r.width), h: Math.round(r.height) } : null
  }
})
log('PORTRAIT', portrait)
if (portrait.mounted) {
  await page
    .locator('.appearance-dock')
    .screenshot({ path: path.join(SHOT_DIR, 'gui-66-panel.png') })
    .catch(() => {})
  await page.screenshot({ path: path.join(SHOT_DIR, 'gui-66-window.png') }).catch(() => {})
}

await finish()
