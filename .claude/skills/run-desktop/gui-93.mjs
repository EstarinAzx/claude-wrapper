// GUI eyeball for #93 — every interactive control wears the app's focus ring.
//
// jsdom is blind to CSS, so no vitest test in this repo can see this: the whole
// defect is a missing `:focus-visible` rule, and a missing rule renders as
// Chromium's default `outline: auto 0.8px rgb(229, 151, 0)` with nothing red.
//
// Two things this driver does deliberately:
//
//   1. It presses REAL Tab keys. `el.focus()` does not reliably match
//      `:focus-visible` — the pseudo-class is about the heuristic, not about
//      focus — so a driver that calls `.focus()` measures a different thing than
//      the user experiences, and would pass against the broken build.
//   2. It asserts PER CONTROL, never in aggregate. An aggregate assertion
//      ("some control has a ring") passes on the one control that was already
//      covered before this ticket existed.
//
// The expected values are not hardcoded. A probe element is given
// `box-shadow: inset 0 0 0 1px var(--tint-6)` and `background: var(--tint-3)`,
// and whatever the engine computes for THAT is the string every assertion
// compares against — so a token re-hue moves the driver with the app instead of
// reddening it.
//
// RED-VERIFIED against main before the fix: 13 of 14 controls report
// `outline: auto ...` and `box-shadow: none`. An instrument that cannot fail
// measures nothing.
//
//   node .claude/skills/run-desktop/gui-93.mjs
//
// Needs `npm run build` first, plus playwright-core.

import { _electron as electron } from 'playwright-core'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'

const APP_DIR = path.resolve(import.meta.dirname, '../../..')
const SHOT_DIR = process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')
fs.mkdirSync(SHOT_DIR, { recursive: true })

const WORK_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'gui93-'))

// The uncovered set, re-enumerated mechanically over every `<button>` class in
// the renderer rather than copied from the ticket — the ticket's own table says
// to do that, and doing it corrected two of its rows.
//
//   kind 'hairline' — the control authors a fill in SOME state, so the focus
//     treatment must be the ring ALONE. The shared wash group would replace that
//     fill, which is the visual regression this ticket exists to avoid.
//   kind 'wash' — a genuinely transparent menu/list row, which joins the shared
//     wash+hairline group with its siblings.
//
// `phase` is the app state that must exist before the control is on screen.
const TARGETS = [
  { sel: '.win-btn:not(.win-btn-close)', name: '.win-btn', kind: 'hairline', phase: 'welcome' },
  { sel: '.win-btn-close', name: '.win-btn-close', kind: 'hairline', phase: 'welcome' },
  // The three dock toggles and the sessions rail only mount once a workspace is
  // open — before that the app is on Welcome, which has neither.
  { sel: '.agents-toggle', name: '.agents-toggle', kind: 'hairline', phase: 'rail' },
  { sel: '.sidebar-toggle', name: '.sidebar-toggle', kind: 'hairline', phase: 'rail' },
  { sel: '.backend-pill', name: '.backend-pill', kind: 'hairline', phase: 'welcome' },
  { sel: '.perm-pill', name: '.perm-pill', kind: 'hairline', phase: 'welcome' },
  { sel: '.pick-folder-btn', name: '.pick-folder-btn', kind: 'hairline', phase: 'welcome' },
  { sel: '.send-btn', name: '.send-btn', kind: 'hairline', phase: 'workspace' },
  { sel: '.attach-btn', name: '.attach-btn', kind: 'hairline', phase: 'workspace' },
  { sel: '.model-pill', name: '.model-pill', kind: 'hairline', phase: 'workspace' },
  { sel: '.session-delete', name: '.session-delete', kind: 'hairline', phase: 'rail' },
  { sel: '.model-menu-item', name: '.model-menu-item', kind: 'wash', phase: 'model-menu' },
  // Reached BACKWARDS, and that is a finding rather than a driver convenience:
  // `InputBar.onKeyDown` binds Tab to `accept(matches[hi])` while the popover is
  // open, so a forward Tab out of the composer takes the completion and closes
  // the popover instead of moving focus. Shift+Tab from the send button is still
  // real keyboard navigation, so `:focus-visible` still applies.
  {
    sel: '.command-option',
    name: '.command-option',
    kind: 'wash',
    phase: 'command-popover',
    anchor: '.send-btn',
    dir: 'back'
  }
]

// `.subagent-drawer-close` is the one control in the uncovered set that cannot
// be reached without a real turn that spawns a subagent. It is checked
// STATICALLY below and labelled as such in the output — the precedent is
// `gui-75`, which guards `setAppUserModelId` by grepping the built bundle for
// the same reason. A static check is weaker than a Tab press and the report says
// so; it is not counted as driven.
const STATIC_ONLY = '.subagent-drawer-close'

setTimeout(() => {
  console.log('TIMEOUT')
  process.exit(1)
}, 180000).unref?.()

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

await app.evaluate(async ({ dialog }, dir) => {
  dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [dir] })
}, WORK_DIR)

const page = await app.firstWindow()
await page.waitForSelector('[aria-label="Backend mode"]', { timeout: 15000 })

// Whatever the engine computes for the two authored treatments IS the
// expectation. Reading them from a probe rather than hardcoding a colour means a
// token re-hue (#70 ships four palettes) moves the driver with the app.
const EXPECT = await page.evaluate(() => {
  const p = document.createElement('div')
  p.style.cssText = 'position:absolute;left:-9999px;box-shadow:inset 0 0 0 1px var(--tint-6);background:var(--tint-3)'
  document.body.appendChild(p)
  const cs = getComputedStyle(p)
  const out = { ring: cs.boxShadow, wash: cs.backgroundColor }
  p.remove()
  return out
})

// Background at rest, before anything is focused. Criterion 2 compares against
// this: a focus treatment may not repaint a control's authored fill.
async function readRest(sel) {
  return page.evaluate((s) => {
    const el = document.querySelector(s)
    if (!el) return null
    const cs = getComputedStyle(el)
    return { bg: cs.backgroundColor, outline: cs.outline, boxShadow: cs.boxShadow, cls: el.className }
  }, sel)
}

// Tab until the active element matches, then read it WHILE it is focused. The
// walk is bounded and reports how many stops it took, so a control that moved
// out of the tab order fails loudly instead of silently never being asserted.
// An anchor is focused programmatically so the walk starts near the target —
// `.focus()` does NOT set `:focus-visible`, and the anchor is never the element
// asserted on. The key press that lands on the TARGET is always a real one.
async function tabTo(sel, { anchor, dir = 'fwd', max = 150 } = {}) {
  const key = dir === 'back' ? 'Shift+Tab' : 'Tab'
  if (anchor) await page.evaluate((a) => document.querySelector(a)?.focus(), anchor)
  else await page.evaluate(() => document.activeElement?.blur?.())
  for (let i = 0; i < max; i++) {
    await page.keyboard.press(key)
    const hit = await page.evaluate((s) => {
      const el = document.activeElement
      if (!el || !el.matches?.(s)) return null
      const cs = getComputedStyle(el)
      return {
        bg: cs.backgroundColor,
        outline: cs.outline,
        outlineStyle: cs.outlineStyle,
        boxShadow: cs.boxShadow,
        cls: el.className,
        label: el.getAttribute('aria-label') || el.textContent?.trim().slice(0, 24)
      }
    }, sel)
    if (hit) return { ...hit, stops: i + 1 }
  }
  return null
}

const bad = []
const notes = []
const driven = []

async function check(t) {
  const rest = await readRest(t.sel)
  if (!rest) {
    bad.push(`${t.name}: not in the DOM during phase "${t.phase}" — NOT DRIVEN, not a pass`)
    return
  }
  const f = await tabTo(t.sel, { anchor: t.anchor, dir: t.dir })
  if (!f) {
    const how = t.dir === 'back' ? 'Shift+Tab walk' : 'Tab walk'
    bad.push(`${t.name}: never reached by a ${how} during phase "${t.phase}" — NOT DRIVEN, not a pass`)
    return
  }
  driven.push(t.name)

  // Criterion 1 — the app's ring, never Chromium's.
  if (f.outlineStyle === 'auto') {
    bad.push(`${t.name}: renders Chromium's default (outline: ${f.outline})`)
  }
  if (f.boxShadow !== EXPECT.ring) {
    bad.push(`${t.name}: focus box-shadow is ${JSON.stringify(f.boxShadow)}, want ${JSON.stringify(EXPECT.ring)}`)
  }

  if (t.kind === 'hairline') {
    // Criterion 2 — the one that killed this ticket's first draft. A control
    // carrying its own fill must still be carrying it while focused.
    if (f.bg !== rest.bg) {
      bad.push(`${t.name}: fill repainted on focus — at rest ${rest.bg}, focused ${f.bg}`)
    }
  } else {
    // The wash group is the exception, and it is asserted positively rather than
    // by "the background changed": the two rows must land on the SAME wash their
    // siblings already use, not merely on something different from rest.
    if (f.bg !== EXPECT.wash) {
      bad.push(`${t.name}: focus wash is ${f.bg}, want the shared ${EXPECT.wash}`)
    }
  }

  console.log(
    `${t.name.padEnd(26)} tab#${String(f.stops).padStart(2)} | rest bg ${rest.bg} → focus bg ${f.bg} ` +
      `| outline ${f.outlineStyle} | ring ${f.boxShadow === EXPECT.ring ? 'app' : JSON.stringify(f.boxShadow)}`
  )
}

console.log('=== #93 focus ring: real Tab walk, per control ===')
console.log(`expected ring: ${EXPECT.ring}`)
console.log(`expected wash: ${EXPECT.wash}`)
console.log(`fixture workspace: ${WORK_DIR}`)
console.log('--- phase: welcome ---')

for (const t of TARGETS.filter((t) => t.phase === 'welcome')) await check(t)

// Open a workspace. DOM-dispatched: Playwright's actionability wait hangs on the
// intro animation.
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find(
    (b) =>
      b.getAttribute('aria-label') === 'Pick a project folder' ||
      b.textContent?.includes('Pick a project folder')
  )
  btn?.click()
})
await page.waitForTimeout(3500)

// `.session-delete` lives on a session row, and the rail defaults to "This
// project" — a brand-new temp workspace has none, so the control would simply
// not exist and the assertion would never run. Widening the scope is the
// cheapest way to put a row on screen. This is not a claim about how many
// sessions this machine has: zero rows fails loudly as NOT DRIVEN below.
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('.session-scope-btn')].find((b) =>
    b.textContent?.includes('All projects')
  )
  btn?.click()
})
await page.waitForTimeout(1500)
const rowCount = await page.evaluate(() => document.querySelectorAll('.session-row').length)
console.log(`--- phase: rail (${rowCount} session rows in scope "All projects") ---`)
for (const t of TARGETS.filter((t) => t.phase === 'rail')) await check(t)

// Collapse the rail before walking to the composer. Those session rows are real
// tab stops — with the rail open the walk spends its whole budget inside the
// list and never reaches the send button, which reads exactly like a missing
// control. Collapsing is state the driver ESTABLISHES, not state it inherits.
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('.sidebar-toggle')].find(
    (b) => b.getAttribute('aria-label') === 'Collapse sessions'
  )
  btn?.click()
})
await page.waitForTimeout(800)
const stillOpen = await page.evaluate(() => document.querySelectorAll('.session-row').length)
if (stillOpen > 0) {
  bad.push(`rail did not collapse (${stillOpen} rows still in the tab order) — the composer walk below is unreliable`)
}
console.log(`--- phase: workspace (rail collapsed, ${stillOpen} rows) ---`)
for (const t of TARGETS.filter((t) => t.phase === 'workspace')) await check(t)

// The model menu only exists while the pill is open, and the pill is disabled
// while busy — nothing is busy here.
await page.evaluate(() => document.querySelector('.model-pill')?.click())
await page.waitForTimeout(500)
console.log('--- phase: model menu ---')
for (const t of TARGETS.filter((t) => t.phase === 'model-menu')) await check(t)
await page.keyboard.press('Escape')
await page.evaluate(() => document.querySelector('.model-backdrop')?.click())
await page.waitForTimeout(300)

// The slash popover opens on input, so the text has to be TYPED — setting
// `.value` fires no React onChange and the popover never mounts.
await page.evaluate(() => document.querySelector('.message-input')?.focus())
await page.keyboard.type('/')
await page.waitForTimeout(2500)
const optCount = await page.evaluate(() => document.querySelectorAll('.command-option').length)
console.log(`--- phase: command popover (${optCount} options) ---`)
if (optCount === 0) {
  // The popover only opens when `listCommands()` returned something. An empty
  // list is a CLI fact, not a pass — say so rather than skipping quietly.
  bad.push('.command-option: popover never opened (listCommands returned nothing) — NOT DRIVEN, not a pass')
}
for (const t of TARGETS.filter((t) => t.phase === 'command-popover')) await check(t)

const shot = path.join(SHOT_DIR, 'gui-93-focus-ring.png')
await page.screenshot({ path: shot })

// The one control a Tab walk cannot reach without a real subagent turn. Read
// from the BUILT stylesheet, not the source, for the same reason gui-75 greps
// the built bundle: the source is not what shipped.
const cssDir = path.join(APP_DIR, 'out/renderer/assets')
let staticOk = false
try {
  const css = fs
    .readdirSync(cssDir)
    .filter((f) => f.endsWith('.css'))
    .map((f) => fs.readFileSync(path.join(cssDir, f), 'utf8'))
    .join('\n')
  // Minified, so match the selector and require an inset ring in the same rule.
  const rule = css.match(new RegExp(`\\${STATIC_ONLY}:focus-visible[^{]*\\{[^}]*\\}`))
  staticOk = !!rule && /inset 0 0 0 1px/.test(rule[0]) && /outline:\s*none/.test(rule[0])
  if (!staticOk) {
    bad.push(`${STATIC_ONLY}: no :focus-visible rule with an inset ring in the built CSS${rule ? ` (found ${JSON.stringify(rule[0])})` : ''}`)
  }
} catch (e) {
  bad.push(`${STATIC_ONLY}: could not read built CSS at ${cssDir} (${e.message}) — run \`npm run build\` first`)
}
notes.push(
  `${STATIC_ONLY}: STATIC CHECK ONLY (${staticOk ? 'rule present' : 'rule missing'}) — not Tab-driven, ` +
    `because reaching it needs a real turn that spawns a subagent. Weaker than every assertion above.`
)

console.log('--- static ---')
for (const n of notes) console.log(n)
console.log(`driven: ${driven.length}/${TARGETS.length} controls`)
console.log(`screenshot: ${shot}`)
console.log(bad.length === 0 ? 'PASS' : 'FAIL: ' + bad.join(' | '))

setTimeout(() => process.exit(bad.length === 0 ? 0 : 1), 4000).unref?.()
await app.close().catch(() => {})
try {
  fs.rmSync(WORK_DIR, { recursive: true, force: true })
} catch {
  console.log(`(left behind: ${WORK_DIR})`)
}
process.exit(bad.length === 0 ? 0 : 1)
