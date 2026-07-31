// GUI eyeball for #51 — one global scrollbar rule, on every surface it reaches.
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
// #77 — every named surface is DRIVEN into overflow, never inherited.
// This driver used to print four `NOT DRIVEN` lines and then `PASS`: `.chat`
// and `.message-input` were empty, `.command-list` / `.command-popover` were
// never opened, and `.session-groups` overflowed only because the developer's
// real store happened to be large. That is #65's rule unapplied to the driver
// itself — "a driver must ESTABLISH the app state it asserts, never inherit
// it" — and a global-rule driver that measures one surface asserts something
// much weaker than its name. So the run now seeds its own store, opens a long
// conversation, types past the composer's ceiling, and opens both command
// surfaces. There is no third state left: a surface is measured, or the run
// FAILS saying which drive step did not take.
//
//   node .claude/skills/run-desktop/gui-51.mjs
//
// Needs `npm run build` first, plus `npm i --no-save playwright-core`.
//
// Cost: no CLI turn is ever sent. Picking the folder warms the engine (#39),
// which is what makes the CLI's command and model lists readable — so the two
// CLI-sourced surfaces (`.model-menu`, and both command surfaces) are driven
// by asking the CLI, and the run waits for that list rather than assuming it.

import { _electron as electron } from 'playwright-core'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import crypto from 'node:crypto'

const APP_DIR = path.resolve(import.meta.dirname, '../../..')
const SHOT_DIR = process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')
fs.mkdirSync(SHOT_DIR, { recursive: true })

const EXPECTED_GUTTER = 10

// ---- seed the store: many rows for the rail, one long session for the pane --
//
// Both numbers are "comfortably past the shortest plausible container", not
// tuned: the rail is the window's full height and a session row is ~40css, the
// chat column is the window minus titlebar and composer and a turn is ~60css.
// Seeding rather than borrowing the real store is the point — #49's driver can
// read the developer's 490 sessions because its claim is about reading them;
// this one's claim is about a CSS rule, so it brings its own.
const ROWS = 24
const LONG_TURNS = 30

const WORKSPACE = fs.mkdtempSync(path.join(os.tmpdir(), 'gutter51-ws-'))
const STORE_DIR = path.join(
  os.homedir(),
  '.claude',
  'projects',
  `gutter51-${crypto.randomUUID().slice(0, 8)}`
)
const LONG_PROMPT = 'GUTTER51 long conversation for the chat pane'

const line = (rec) => JSON.stringify(rec) + '\n'
fs.mkdirSync(STORE_DIR, { recursive: true })

// Field shape copied from a real terminal session line (entrypoint "cli"), the
// same seed shape gui-55 / gui-61 / gui-62 / gui-63 write.
const seedSession = (prompt, turns, ageMs) => {
  const sid = crypto.randomUUID()
  const base = {
    parentUuid: null,
    isSidechain: false,
    userType: 'external',
    entrypoint: 'cli',
    cwd: WORKSPACE,
    sessionId: sid,
    version: '2.1.217',
    gitBranch: ''
  }
  let out = ''
  let prev = null
  for (let t = 0; t < turns; t++) {
    const userUuid = crypto.randomUUID()
    const replyUuid = crypto.randomUUID()
    const at = Date.now() - ageMs - (turns - t) * 1000
    out += line({
      ...base,
      parentUuid: prev,
      type: 'user',
      message: { role: 'user', content: t === 0 ? prompt : `${prompt} — follow-up ${t}` },
      uuid: userUuid,
      timestamp: new Date(at).toISOString()
    })
    out += line({
      ...base,
      parentUuid: userUuid,
      type: 'assistant',
      message: {
        role: 'assistant',
        content: [{ type: 'text', text: `Reply ${t + 1} of ${turns}. ${'Filler sentence. '.repeat(6)}` }]
      },
      uuid: replyUuid,
      timestamp: new Date(at + 500).toISOString()
    })
    prev = replyUuid
  }
  fs.writeFileSync(path.join(STORE_DIR, `${sid}.jsonl`), out)
  return sid
}

// Newest first, so the long one sits at the top of the rail under either scope
// setting ('project' shows only these; 'all' sorts the whole store by recency).
seedSession(LONG_PROMPT, LONG_TURNS, 30_000)
for (let i = 1; i < ROWS; i++) {
  seedSession(`GUTTER51 filler session ${i}`, 1, 60_000 + i * 1000)
}

let cleaned = false
const cleanup = () => {
  if (cleaned) return
  cleaned = true
  try {
    fs.rmSync(STORE_DIR, { recursive: true, force: true })
  } catch {}
  try {
    fs.rmSync(WORKSPACE, { recursive: true, force: true })
  } catch {}
}

setTimeout(() => {
  console.log('TIMEOUT')
  cleanup()
  process.exit(1)
}, 240000).unref?.()

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

// Stub the native dialog in MAIN before any click that opens one, or the run
// blocks forever. The path travels as an ARGUMENT, never inside a literal.
await app.evaluate(async ({ dialog }, dir) => {
  dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [dir] })
}, WORKSPACE)

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
await page.waitForSelector('.message-input', { timeout: 20000 })

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
// below catches that and falls back to the coarse instrument, flagged. That
// guard is load-bearing and `.message-input` is the surface that proves it:
// once the composer overflows, its reading must still come back `exact: false`.
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
// to make a number fit; #65 exists to undo exactly that move, and #77 restated
// it: a newly-driven surface that misses the budget is a FINDING, not a
// tolerance problem.
const isGutter = (m) => Math.abs(dev(m.gutter) - EXPECTED_DEV) < (m.exact ? 1 : 1 + dpr)
const show = (m) =>
  `${Number(m.gutter.toFixed(3))}css / ${Number(dev(m.gutter).toFixed(3))}dev${m.exact ? '' : ' (coarse)'}`

const fails = []
const readings = {}

const finish = async () => {
  const shot = path.join(SHOT_DIR, 'gui-51.png')
  await page.screenshot({ path: shot }).catch(() => {})
  console.log('=== #51 scrollbar gutters (content-box measured, compared in device px) ===')
  console.log(
    `expected: ${EXPECTED_GUTTER}css → ${Number(EXPECTED_DEV.toFixed(3))}dev at dpr ${dpr}  (Windows default ≈ 15-17css)`
  )
  for (const [name, m] of Object.entries(readings)) {
    console.log(
      `  ${name.padEnd(18)} ${m.present === false ? 'ABSENT' : m.scrolls ? show(m) : 'NOT OVERFLOWING'}`
    )
  }
  console.log(`screenshot: ${shot}`)
  console.log(fails.length === 0 ? 'PASS' : 'FAIL: ' + fails.join(' | '))
  setTimeout(() => process.exit(fails.length === 0 ? 0 : 1), 4000).unref?.()
  await app.close().catch(() => {})
  cleanup()
  process.exit(fails.length === 0 ? 0 : 1)
}

const measure = (sel) =>
  page.evaluate(
    ({ fnSrc, sel }) => {
      const gutterOf = eval(fnSrc)
      const el = document.querySelector(sel)
      if (!el) return { present: false }
      return { present: true, scrolls: el.scrollHeight > el.clientHeight, ...gutterOf(el) }
    },
    { fnSrc: GUTTER_FN, sel }
  )

// Poll until the surface is both there and overflowing — layout, replay and a
// CLI-sourced list all land asynchronously, and a single measurement taken too
// early is indistinguishable from a surface that cannot be driven at all.
const driveTo = async (sel, ms = 15000) => {
  const deadline = Date.now() + ms
  let m = await measure(sel)
  while (Date.now() < deadline && !(m.present && m.scrolls)) {
    await page.waitForTimeout(500)
    m = await measure(sel)
  }
  return m
}

// One surface, one verdict. `could not drive` names the setup step rather than
// the assertion, so a run that fails here is read as "this driver did not reach
// the state" and never as "the gutter is wrong" (#65's distinction, which #76
// re-earned). There is deliberately no third, quiet outcome.
const record = (name, m, how) => {
  readings[name] = m
  if (!m.present) {
    fails.push(`${name} — could not drive: absent after ${how}`)
  } else if (!m.scrolls) {
    fails.push(`${name} — could not drive: present but not overflowing after ${how}`)
  } else if (!isGutter(m)) {
    fails.push(`${name} gutter ${show(m)}, expected ${Number(EXPECTED_DEV.toFixed(3))}dev`)
  }
}

// React owns the composer's value, so drive it through the native setter and
// let the input event reach onChange — the same path a real keystroke takes.
const setComposer = (text) =>
  page.evaluate((text) => {
    const el = document.querySelector('.message-input')
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(el, text)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }, text)

// ---- 1. the global rule, live in the built CSS ------------------------------
// A plain overflowing div inherits it. This is the claim itself, not a proxy.

const probe = await page.evaluate((fnSrc) => {
  const gutterOf = eval(fnSrc)
  const d = document.createElement('div')
  d.style.cssText = 'position:fixed;left:-9999px;width:120px;height:60px;overflow-y:auto'
  d.innerHTML = '<div style="height:600px"></div>'
  document.body.appendChild(d)
  const gutter = { present: true, scrolls: d.scrollHeight > d.clientHeight, ...gutterOf(d) }
  d.remove()
  return gutter
}, GUTTER_FN)
record('probe div', probe, 'a 600px child in a 60px box')

// ---- the three CLI-sourced surfaces come FIRST, and that ordering is load-bearing.
//
// `.model-menu`, `.command-popover` and `.command-list` are all filled from the
// live query the folder pick's eager warm-up built. Opening a past session ends
// that: `openSession` calls `targetSession`, which CLOSES the engine so the next
// send rebuilds one pointed at the resumed transcript. From that moment
// `listModels()` and `listCommands()` both answer `[]` — by contract, not by
// failure — and the picker renders exactly its one static "default" row.
//
// Measured the wrong way round on the first #77 run: the menu came back with 1
// item and both command surfaces never mounted, which reads identically to a
// broken CLI. So every CLI-sourced surface is measured while the engine is warm,
// and the session that fills `.chat` is opened only afterwards.

// ---- 2. the slash-command popover -------------------------------------------
// Fetched per keystroke inside the trigger window. Wait for the list through the
// same channel the component uses rather than hoping the engine is warm — a `/`
// typed against an empty list leaves the popover shut for that keystroke and
// looks exactly like a missing popover.

let commandCount = 0
for (let i = 0; i < 40 && commandCount === 0; i++) {
  commandCount = await page.evaluate(() =>
    window.api
      .listCommands()
      .then((l) => l.length)
      .catch(() => 0)
  )
  if (commandCount === 0) await page.waitForTimeout(1500)
}
await setComposer('/')
record(
  '.command-popover',
  await driveTo('.command-popover', 15000),
  `typing "/" against ${commandCount} CLI commands`
)
await setComposer('')
await page.waitForTimeout(300)

// ---- 3. the commands dock ----------------------------------------------------
// The same list in the right-hand rail (#39). Mount IS open, so the toggle is
// the whole drive step. Closed again afterwards: the dock takes width from the
// pane, and `.chat` should be measured in the app's resting geometry.

await page.evaluate(() => document.querySelector('[aria-label="Commands panel"]')?.click())
record(
  '.command-list',
  await driveTo('.command-list', 20000),
  `opening the Commands dock against ${commandCount} CLI commands`
)
await page.evaluate(() => document.querySelector('[aria-label="Commands panel"]')?.click())
await page.waitForTimeout(300)

// ---- 4. the model menu -------------------------------------------------------
// CLI-sourced too (#53): the list comes from supportedModels(). The picker
// always renders one static row (the "default" pick), so a count of 1 means the
// fetched list was empty, not that the CLI offers one model.

await page.evaluate(() => document.querySelector('[aria-label="Model"]')?.click())
const menu = await driveTo('.model-menu', 20000)
const menuItems = await page.evaluate(() => document.querySelectorAll('.model-menu-item').length)
record('.model-menu', menu, `opening the picker (${menuItems} rows incl. the static default)`)
// Close it: it and the command popover share the composer's stacking context,
// and a menu left open is state the next measurement did not ask for.
await page.evaluate(() => document.querySelector('[aria-label="Model"]')?.click())
await page.waitForTimeout(300)

// ---- 5. the composer ---------------------------------------------------------
// `field-sizing: content` with an 8-line ceiling (#42), so overflow is text and
// never a resize. The shim reads 0 on a textarea by construction, so this is
// also the one surface that proves the zero-reading guard still engages.

const COMPOSER_LINES = 20
await setComposer(Array.from({ length: COMPOSER_LINES }, (_, i) => `line ${i + 1}`).join('\n'))
const composer = await driveTo('.message-input', 8000)
record('.message-input', composer, `typing ${COMPOSER_LINES} lines past the 8-line ceiling`)
if (composer.present && composer.scrolls && composer.exact) {
  fails.push(
    '.message-input read as `exact` — a textarea renders no element children, so the shim must read 0 and the coarse fallback must take over; an exact reading means the instrument changed and the zero-reading guard is no longer the thing being relied on'
  )
}
await setComposer('')

// ---- 6. the sessions rail ----------------------------------------------------
// Seeded, not borrowed: ROWS sessions in this run's own store, in the workspace
// the folder pick just chose. A refresh loop because the rail lists on its own
// schedule and the store gained files after launch.

let rows = 0
for (let i = 0; i < 12 && rows < ROWS; i++) {
  rows = await page.evaluate(() => document.querySelectorAll('.session-row-btn').length)
  if (rows < ROWS) {
    await page.evaluate(() => document.querySelector('[aria-label="Refresh sessions"]')?.click())
    await page.waitForTimeout(1000)
  }
}
record(
  '.session-groups',
  await driveTo('.session-groups'),
  `seeding ${ROWS} sessions (rail shows ${rows})`
)

// ---- 7. the chat pane --------------------------------------------------------
// Open the long seeded session and let it replay. Other drivers pay for real
// turns; this one only needs height, so the store is the cheaper instrument.
// LAST, because this is the step that closes the engine (see the note above).

const opened = await page.evaluate((seed) => {
  const row = [...document.querySelectorAll('.session-row-btn')].find((b) =>
    b.querySelector('.session-row-title')?.textContent?.includes(seed)
  )
  row?.click()
  return !!row
}, LONG_PROMPT)
if (!opened) {
  fails.push(
    `could not drive: the seeded ${LONG_TURNS}-turn session never appeared in the rail — nothing was opened, so .chat was never filled`
  )
  await finish()
}
record('.chat', await driveTo('.chat', 30000), `replaying a ${LONG_TURNS}-turn session`)

await finish()
