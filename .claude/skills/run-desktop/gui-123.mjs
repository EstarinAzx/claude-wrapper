// GUI driver for #123 — reuse a past user message, in the BUILT app.
//
// WHAT `tests/reuse-message.test.tsx` ALREADY PROVES, so this does not repeat
// it: the wiring (click → composer value), the nonce, the queued-send
// interaction, that the transcript is never mutated, and that the stylesheet
// CONTAINS the reveal and ring rules. All of that runs in jsdom.
//
// WHAT ONLY THIS CAN PROVE, and it is the half the suite structurally cannot:
//   1. THE CONTROL IS ACTUALLY HIDDEN AT REST AND ACTUALLY REVEALED. jsdom
//      loads no CSS, so the suite's raw-text pin proves a rule was WRITTEN. A
//      selector that never matches — `.msg-user:hover` on a row that is not the
//      hover target, an `@import` order that puts the rule where something else
//      overrides it — passes that pin and ships a control nobody can see. This
//      reads `getComputedStyle().opacity` off the BUILT stylesheet, at rest and
//      under a real hover.
//   2. THE RING IS REAL AND THE CONTROL IS TAB-REACHABLE. Same reason, plus
//      `:focus-visible` only paints for a keyboard-shaped focus, so this tabs to
//      it rather than calling `.focus()`.
//   3. THE REFILL LANDS IN THE REAL COMPOSER. The insert crosses a component
//      boundary through a nonce-keyed effect; jsdom sees the same React tree,
//      but not the built bundle.
//
// COSTS ZERO CLI TURNS. `chat:send`'s main-side listener is removed before
// anything is typed, so the user bubble is appended by the renderer (which is
// all this driver needs) and no engine turn is ever started. The removal is
// VERIFIED rather than assumed — phase 1 asserts the listener count went to
// zero, because a send that quietly still fired would spend a turn and, worse,
// clear the composer under the assertions below.
//
// NEGATIVE CONTROL: the composer is stomped with a fresh sentinel immediately
// before the click, and the stomp is read back. Without it "the composer holds
// the message text" is trivially true for a composer that was never emptied.
//
// Red-first: run against a build without the control and phase 2 stops at the
// selector, naming the reason; run against one whose reveal rule is missing and
// phase 3 reports opacity 0 under hover. Verified red by stashing chat.css's
// rules and Chat.tsx's button and rebuilding.
//
//   node .claude/skills/run-desktop/gui-123.mjs
//
// Needs `npm run build` first, plus `npm i --no-save playwright-core`.

import { _electron as electron } from 'playwright-core'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'
import { fileURLToPath } from 'node:url'

const APP_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const SHOT_DIR = process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')
fs.mkdirSync(SHOT_DIR, { recursive: true })
const WORK_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'gui123-'))

const log = (l, m) => console.log(String(l).padEnd(12) + JSON.stringify(m))
const fails = []

setTimeout(() => {
  console.log('TIMEOUT')
  process.exit(1)
}, 180000).unref?.()

// Multiline and punctuated on purpose: the refill has to be verbatim, so a
// route that trimmed, normalised whitespace or passed through a markdown
// renderer shows up here as a mismatch rather than as a plausible-looking pass.
const MESSAGE = 'explain this diff\n\nand keep the & < > characters intact'

const app = await electron.launch({
  executablePath: path.join(APP_DIR, 'node_modules/electron/dist/electron.exe'),
  args: ['--no-sandbox', '.'],
  cwd: APP_DIR,
  env: process.env,
  timeout: 45000
})

const page = await app.firstWindow()
await page.waitForLoadState('domcontentloaded')

const finish = async () => {
  console.log(fails.length === 0 ? 'PASS' : 'FAIL')
  for (const f of fails) console.log('  - ' + f)
  console.log(`SHOTS       ${SHOT_DIR.replace(/\\/g, '/')}`)
  await app.close().catch(() => {})
  try {
    fs.rmSync(WORK_DIR, { recursive: true, force: true })
  } catch {}
  process.exit(fails.length === 0 ? 0 : 1)
}

// ---- phase 0: the origin this run is actually measuring ---------------------

const env = await page.evaluate(() => ({
  protocol: location.protocol,
  isSecureContext: window.isSecureContext
}))
log('ENV', env)
if (env.protocol !== 'file:') {
  fails.push(
    `the renderer is on ${env.protocol}, not file: — this run does not measure the production origin, so nothing below is evidence about the shipped app`
  )
  await finish()
}

// ---- phase 1: a workspace, and a send path that spends nothing --------------

await app.evaluate(({ dialog }, dir) => {
  dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [dir] })
}, WORK_DIR)

// The instrument, and its own precondition. Removing main's `chat:send`
// listener means the renderer still appends the user bubble locally — which is
// the only thing this driver needs — while no CLI turn is ever started. If the
// removal did NOT take, a real turn would run and its `turn-end` would empty
// the composer underneath phase 5, so the count is read back rather than
// trusted.
const listeners = await app.evaluate(({ ipcMain }) => {
  const before = ipcMain.listenerCount('chat:send')
  ipcMain.removeAllListeners('chat:send')
  return { before, after: ipcMain.listenerCount('chat:send') }
})
log('SENDPATH', listeners)
if (listeners.before < 1) {
  fails.push(
    "main had no `chat:send` listener to remove — the channel has been renamed and this driver's zero-turn premise no longer holds; nothing below is scored"
  )
  await finish()
}
if (listeners.after !== 0) {
  fails.push(
    `main still holds ${listeners.after} \`chat:send\` listener(s) after removal — a real turn may run and empty the composer under the assertions below; UNSCORED`
  )
  await finish()
}

// DOM-dispatched: Playwright's actionability wait hangs on the intro animation
// (gui-93, gui-95, gui-96, gui-98 and gui-122 all hit this).
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find(
    (b) =>
      b.getAttribute('aria-label') === 'Pick a project folder' ||
      b.textContent?.includes('Pick a project folder')
  )
  btn?.click()
})
await page.waitForSelector('.message-input', { timeout: 20000 })
log('WORKSPACE', { dir: path.basename(WORK_DIR) })

// ---- phase 2: one user message, and the control on it -----------------------

const composer = page.locator('.message-input')
await composer.fill(MESSAGE)
await composer.press('Enter')

const arrived = await page
  .waitForSelector('.msg-user button.bubble-reuse', { timeout: 15000 })
  .then(() => true)
  .catch(() => false)
if (!arrived) {
  const seen = await page.evaluate(() => ({
    userMessages: document.querySelectorAll('.msg-user').length,
    bubbles: document.querySelectorAll('.msg-user .bubble').length,
    controls: document.querySelectorAll('.bubble-reuse').length
  }))
  fails.push(
    `no reuse control appeared on a user message in the built app after 15s (${JSON.stringify(seen)}) — the control is not reaching the shipped bundle`
  )
  await finish()
}

const placement = await page.evaluate(() => {
  const btn = document.querySelector('.msg-user button.bubble-reuse')
  return {
    insideBubble: !!btn?.closest('.bubble'),
    insideRow: !!btn?.closest('.msg-user'),
    label: btn?.getAttribute('aria-label') ?? null,
    // The bubble's own text must not have picked up anything from the control —
    // tests/multiline-composer.test.tsx reads this string verbatim.
    bubbleText: document.querySelector('.msg-user .bubble')?.textContent ?? null
  }
})
log('PLACEMENT', { ...placement, bubbleText: JSON.stringify(placement.bubbleText) })
if (placement.insideBubble) fails.push('the control is INSIDE .bubble — its text joins the bubble textContent that multiline-composer pins')
if (!placement.insideRow) fails.push('the control is not inside .msg-user, so the row hover rule cannot reach it')
if (placement.bubbleText !== MESSAGE) {
  fails.push(
    `the bubble reads ${JSON.stringify(placement.bubbleText)} rather than the message as sent — the row is rendering something other than the user's own words`
  )
}

// ---- phase 3: hidden at rest, revealed on hover — off the BUILT stylesheet ---

await app.evaluate(({ BrowserWindow, app: a }) => {
  const w = BrowserWindow.getAllWindows()[0]
  w?.show()
  w?.focus()
  a.focus({ steal: true })
})
await page.waitForTimeout(400)

// Read with nothing hovered and nothing focused. `.message-input` holds focus
// after a send, and it is NOT inside .msg-user, so :focus-within cannot be
// firing here — but the blur makes that independent of where focus happened to
// land rather than a thing to reason about.
await page.evaluate(() => document.activeElement?.blur?.())
await page.mouse.move(4, 4)
await page.waitForTimeout(250)
const atRest = await page.evaluate(() => {
  const cs = getComputedStyle(document.querySelector('.bubble-reuse'))
  return { opacity: cs.opacity, display: cs.display, visibility: cs.visibility }
})
log('AT-REST', atRest)
if (Number(atRest.opacity) !== 0) {
  fails.push(
    `the control computes opacity ${atRest.opacity} at rest — it is lit on every user row in the shipped app, which is what the reveal rule exists to prevent`
  )
}
// Hidden must not mean gone: `display:none` or `visibility:hidden` would take it
// out of the tab order, and phase 4 would then be measuring nothing.
if (atRest.display === 'none' || atRest.visibility === 'hidden') {
  fails.push(
    `the control is ${atRest.display === 'none' ? 'display:none' : 'visibility:hidden'} at rest — it is removed from the tab order, so it is not keyboard reachable`
  )
}

// Playwright's hover() dispatches a real mouse move — the landmine on this repo
// is about reading hover states from SCREENSHOTS (--tint-2 is 6% alpha and
// invisible in a PNG), which is why this reads computed style instead.
await page.locator('.msg-user').first().hover({ timeout: 8000 })
await page.waitForTimeout(300)
const hovered = await page.evaluate(
  () => getComputedStyle(document.querySelector('.bubble-reuse')).opacity
)
log('HOVERED', { opacity: hovered })
if (Number(hovered) !== 1) {
  fails.push(
    `hovering the message row leaves the control at opacity ${hovered} — the reveal rule is written but not applying off the built stylesheet, so the control is unreachable by mouse`
  )
}
await page.mouse.move(4, 4)

// ---- phase 4: keyboard reach and the ring -----------------------------------

// Tabbed to, never `.focus()`d: Chromium only paints `:focus-visible` for a
// keyboard-shaped focus, so a programmatic focus would read the ring as absent
// and fail this check for the wrong reason.
await page.evaluate(() => {
  document.activeElement?.blur?.()
  document.body.focus()
})
let reached = false
for (let i = 0; i < 60 && !reached; i++) {
  await page.keyboard.press('Tab')
  reached = await page.evaluate(
    () => document.activeElement?.classList.contains('bubble-reuse') ?? false
  )
}
// The reveal is a 150ms opacity transition, so the value read the instant after
// the Tab press is mid-flight. This run's FIRST version had no wait here and
// reported 0.585 as "tabbing lands on an invisible control" — an instrument
// failure dressed as a product one, and exactly the confusion the batch's
// "unscored is not refuted" rule is about. Both readings are kept: `settled` is
// the verdict, `onLand` is what distinguishes a rule that is animating from one
// that never applies, since a missing rule stays at exactly 0 forever.
const onLand = reached
  ? await page.evaluate(() => getComputedStyle(document.activeElement).opacity)
  : null
if (reached) await page.waitForTimeout(400)
const ring = reached
  ? await page.evaluate(() => {
      const el = document.activeElement
      const cs = getComputedStyle(el)
      return {
        matchesFocusVisible: el.matches(':focus-visible'),
        opacity: cs.opacity,
        boxShadow: cs.boxShadow,
        outlineStyle: cs.outlineStyle,
        background: cs.backgroundColor
      }
    })
  : null
log('KEYBOARD', { reached, onLand, ring })
if (!reached) {
  fails.push('the reuse control could not be reached with Tab in 60 presses — it is not keyboard reachable')
} else {
  // The half a hover rule cannot deliver: a control focused by keyboard and
  // still at opacity 0 is a tab stop pointing at nothing.
  if (Number(ring.opacity) !== 1) {
    fails.push(
      `the control is focused and STILL computes opacity ${ring.opacity} 400ms later (${onLand} on landing) — tabbing lands on an invisible control, which is worse than not offering one`
    )
  }
  if (!ring.matchesFocusVisible) {
    fails.push('tabbing to the control did not put it in :focus-visible — the ring below is unscored')
  }
  // The hairline is an INSET shadow. No shadow at all means Chromium's default
  // outline is doing the job instead, which is what #93 removed.
  if (!/inset/.test(ring.boxShadow) || ring.boxShadow === 'none') {
    fails.push(
      `the focused control's computed box-shadow is ${JSON.stringify(ring.boxShadow)} — the hairline ring is not applying off the built stylesheet`
    )
  }
}

// ---- phase 5: the refill actually lands, judged against a stomp -------------

// NEGATIVE CONTROL. The composer is empty after a send, so "it holds the
// message" would be a pass for any value including one left over from the fill
// in phase 2. A sentinel makes the click the only thing that could have put the
// message there — and the stomp is read back before the click.
const stomp = `gui123-stomp-${Date.now()}`
await composer.fill(stomp)
const stompHeld = await composer.inputValue()

let clickError = null
try {
  await page.locator('.msg-user button.bubble-reuse').first().click({ timeout: 8000 })
} catch (e) {
  clickError = String(e && e.message).split('\n')[0]
}
await page.waitForTimeout(400)
const refilled = await composer.inputValue()

const state = {
  clickError,
  stompHeldBefore: stompHeld === stomp,
  exact: refilled === MESSAGE,
  got: refilled === MESSAGE ? '<the message, verbatim>' : JSON.stringify(refilled.slice(0, 80))
}
log('REFILL', state)
if (clickError) {
  // A click that never landed says nothing about the control. UNSCORED IS NOT
  // REFUTED — #122's spike scored a live route dead exactly this way.
  fails.push(`the reuse control could not be clicked: ${clickError} — this trial is UNSCORED, not a refutation`)
} else if (!state.stompHeldBefore) {
  fails.push('the pre-click stomp did not hold, so a match below could be a stale composer — UNSCORED')
} else if (!state.exact) {
  fails.push(
    `the composer holds ${state.got} rather than the message verbatim — the refill is inert or lossy in the built app, which is the entire point of this ticket`
  )
}

// ---- phase 6: the transcript is untouched by all of the above ----------------

const after = await page.evaluate(() => ({
  bubbles: [...document.querySelectorAll('.msg-user .bubble')].map((b) => b.textContent),
  controls: document.querySelectorAll('.bubble-reuse').length
}))
log('TRANSCRIPT', { count: after.bubbles.length, controls: after.controls })
if (after.bubbles.length !== 1) {
  fails.push(
    `${after.bubbles.length} user bubbles after a refill — the click duplicated or removed a turn instead of only filling the composer`
  )
} else if (after.bubbles[0] !== MESSAGE) {
  fails.push(
    `the original bubble now reads ${JSON.stringify(after.bubbles[0])} — the refill mutated the message it came from`
  )
}

await page.locator('.msg-user').first().hover().catch(() => {})
await page.waitForTimeout(250)
await page
  .screenshot({ path: path.join(SHOT_DIR, 'revealed.png') })
  .catch(() => {})

await finish()
