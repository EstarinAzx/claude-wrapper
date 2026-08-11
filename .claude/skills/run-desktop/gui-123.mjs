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
// Its source-level half is `gui-123.source.mjs`, which runs in the fast gate and
// holds #143's one text-level criterion: this driver's Tab traversal counts its
// budget off the document instead of hardcoding one. That check cannot live down
// here, because a hardcoded budget is invisible in the configuration the DOM
// phase normally runs in — see the sidecar's header for the measurements.
//
//   node .claude/skills/run-desktop/gui-123.mjs
//
// Needs `npm run build` first, plus `npm i --no-save playwright-core`.

import { _electron as electron } from 'playwright-core'
import { checks as sourceChecks } from './gui-123.source.mjs'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import { profileArgs } from './driver-profile.mjs'

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
  args: ['--no-sandbox', ...profileArgs(), '.'],
  cwd: APP_DIR,
  env: process.env,
  timeout: 45000
})

const page = await app.firstWindow()
await page.waitForLoadState('domcontentloaded')

// A PREMISE that did not hold is not a FAIL, and this driver is the first in the
// set to say so with the exit code the phase already reads. `dom-phase.mjs` maps
// exit 2 to `UNSCORED` — "a driver that could not measure what it came to
// measure is not a pass" — and until now all 39 drivers ended on `0 or 1`, so
// every broken precondition in the set has been reported as a finding about the
// thing it never got to look at. Noted on #145; #147 is what made it matter
// here, by taking away the inherited profile that was hiding the premise break.
const unscored = []

const finish = async () => {
  console.log(unscored.length ? 'UNSCORED' : fails.length === 0 ? 'PASS' : 'FAIL')
  for (const u of unscored) console.log('  ? ' + u)
  for (const f of fails) console.log('  - ' + f)
  console.log(`SHOTS       ${SHOT_DIR.replace(/\\/g, '/')}`)
  await app.close().catch(() => {})
  try {
    fs.rmSync(WORK_DIR, { recursive: true, force: true })
  } catch {}
  process.exit(unscored.length ? 2 : fails.length === 0 ? 0 : 1)
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

// ---- phase 1b: the rail this run is going to measure against ----------------
//
// #143. Every phase below reads something off a live renderer, and until this
// block existed each of them inherited a sidebar nobody here had set. The rail
// lists this machine's real session store, and how much of it reaches the DOM is
// decided by a scope toggle that PERSISTS in the shared Electron profile (#147
// is the ticket about that profile). Measured on this machine, same build, with
// the message already sent:
//
//   scope "This project", mkdtemp workspace ->   0 rows,  17 focusables, control on press 16
//   scope "All projects"                    -> 100 rows, 218 focusables, control on press 218
//
// and a second launch against a brand new workspace still came up on "All
// projects", so it is genuinely persisted rather than per-run.
//
// Those focusable counts drift by a stop or two between runs even at a pinned
// scope — this driver has logged 18 where the table says 17, because the rail's
// background-sessions section offers a retry control only sometimes. That drift
// is small and it is exactly why phase 4 counts per run instead of trusting any
// number written here.
//
// Scope is forced to `project` against a workspace `mkdtemp` made seconds ago,
// which no stored session can name, so the rail is empty BY CONSTRUCTION rather
// than by luck. Then it is READ BACK — #148's lesson, that a fixture nobody
// verifies is only a hope: if the pin does not take, this run says so instead of
// quietly measuring the machine again.
//
// IT SITS HERE, AHEAD OF PHASE 3, AND THAT POSITION IS LOAD-BEARING. It was
// written inside phase 4 first, and phase 3 then read a mid-transition
// `opacity: 0.823757` under hover on a run whose rail still held 100 rows — a
// 150ms transition read after a fixed 300ms wait, on a renderer busy laying out
// a hundred rows it did not need. That is the same defect as the tab budget
// wearing different clothes, and moving the pin above every measurement is what
// removes it rather than another hardcoded wait.
//
// THIS USED TO WRITE TO THE SHARED PROFILE, and #147 has since closed that: the
// pin now lands in this driver's own `userData`, handed out by `dom-phase.mjs`
// and thrown away with the run. Nothing downstream inherits it.
//
// THE PIN AND ITS READ-BACK BOTH STAY. A private profile makes the pin
// unnecessary for the reason it was written — no foreign scope can leak in — but
// it is what turns a fresh profile's default into a value this driver STATES
// rather than assumes, and the read-back below is the only thing that would
// notice a private profile failing to apply. #147 removed the contamination, not
// the need to know what scope was measured.
const scope = await page.evaluate(() => {
  const btns = [...document.querySelectorAll('.session-scope-btn')]
  const project = btns.find((b) => /this project/i.test(b.textContent || ''))
  if (!project) return { found: false, labels: btns.map((b) => (b.textContent || '').trim()) }
  const already = project.getAttribute('aria-pressed') === 'true'
  if (!already) project.click()
  return { found: true, already }
})
if (!scope.found) {
  fails.push(
    `the rail has no "This project" scope control (saw ${JSON.stringify(scope.labels)}) — this run cannot pin the rail, so every phase below would be measuring whatever this machine's store and persisted scope happen to be; UNSCORED`
  )
  await finish()
}

// WAITED FOR, NOT SLEPT THROUGH. A fixed settle here would be the same bug this
// block exists to remove, one scope smaller: the click has to reach a React
// re-render, and how long that takes is a property of how many rows are being
// torn down. The condition is the state the run needs, so a slow machine waits
// longer and a fast one does not wait at all. A timeout is not scored here —
// whatever the rail actually shows is read back below and reported from there.
await page
  .waitForFunction(
    () =>
      document.querySelectorAll('.session-row-btn').length === 0 &&
      /this project/i.test(
        document.querySelector('.session-scope-btn[aria-pressed="true"]')?.textContent || ''
      ),
    null,
    { timeout: 8000 }
  )
  .catch(() => {})

const rail = await page.evaluate(() => ({
  scope: document.querySelector('.session-scope-btn[aria-pressed="true"]')?.textContent?.trim() ?? null,
  rows: document.querySelectorAll('.session-row-btn').length
}))
log('RAILPIN', { ...rail, pinnedHere: !scope.already })
if (rail.rows !== 0) {
  fails.push(
    `the rail rendered ${rail.rows} row(s) for a workspace created by mkdtemp seconds ago (scope reads ${JSON.stringify(rail.scope)}) — the pin did not take, so this run would be measuring this machine's session store rather than the app; UNSCORED`
  )
  await finish()
}

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
    controls: document.querySelectorAll('.bubble-reuse').length,
    // The composer keeps its text when `submit()` returns without sending, so
    // this separates "the send never happened" from "it did and rendered wrong".
    composerStillHolds: (document.querySelector('.message-input')?.value ?? '') !== ''
  }))
  // TWO DIFFERENT ANSWERS, and conflating them is how a driver lies about a
  // subject it never reached. NO user message at all means the app did not send,
  // which says nothing whatever about the reuse control — the control cannot
  // appear on a row that does not exist.
  //
  // #147 is what exposed this. Run against the machine's real profile, the send
  // works and this driver has always passed. Run against a profile the app has
  // never started in — which is now every run — no message appears at all, and
  // it is NOT this driver's technique: measured on 2026-08-11 across a cold
  // profile with the zoom factor forced to 1, a cold profile seeded with every
  // localStorage key a warm one carried, and a cold profile with the `chat:send`
  // listener left in place. Zero user messages in all three, and the Send BUTTON
  // is as dead as the Enter key, so it is not the key path either. Filed
  // separately; see the ticket named below.
  if (seen.userMessages === 0) {
    unscored.push(
      `the app rendered no user message at all after 15s (${JSON.stringify(seen)}) — this run never reached the reuse control, so it is UNSCORED rather than a finding about it. A first-run profile not sending is #155, not this driver's subject`
    )
    await finish()
  }
  fails.push(
    `a user message rendered but carried no reuse control after 15s (${JSON.stringify(seen)}) — the control is not reaching the shipped bundle`
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
//
// #143 — THE PREMISE THIS TRAVERSAL RUNS ON, and the reason it now establishes
// one instead of inheriting it.
//
// This phase used to spend a fixed 60 Tab presses and call the control
// unreachable if it had not landed. That number was never a property of the
// product: the sessions rail sits ahead of the transcript in the tab order, and
// its length is decided by the machine's session store and by a persisted scope
// toggle this driver did not set. Phase 1b has the measurements and pins the
// rail; this is the other half.
//
// THE BUDGET IS DERIVED. One full cycle of the document's own focusable elements
// reaches anything that is in the tab order at all, so the bound is counted
// rather than guessed. That is what keeps this driver honest on a machine unlike
// this one, and `gui-123.source.mjs` pins it in the fast gate, because a
// reverted constant would pass the DOM phase on any machine whose toggle happens
// to sit on "This project".
//
// What this phase now claims is therefore narrower and true: the control is in
// the tab order of a rail this run established. Whether a keyboard user can
// reach it on a rail of a hundred sessions is a PRODUCT question about where the
// rail sits in the tab order, and it is not this driver's to answer.

// Counted here rather than in phase 1b: the control itself is one of these, and
// it does not exist until phase 2 has sent the message.
const focusables = await page.evaluate(() => {
  const SEL =
    'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
  return [...document.querySelectorAll(SEL)].filter((el) => {
    const cs = getComputedStyle(el)
    return cs.display !== 'none' && cs.visibility !== 'hidden'
  }).length
})

// Tabbed to, never `.focus()`d: Chromium only paints `:focus-visible` for a
// keyboard-shaped focus, so a programmatic focus would read the ring as absent
// and fail this check for the wrong reason.
//
// The budget is one full cycle plus slack for the wrap through the document
// itself. Start position therefore does not matter, which is the other thing a
// fixed count got wrong: focus sits wherever phase 3 left it.
const budget = focusables + 10
await page.evaluate(() => {
  document.activeElement?.blur?.()
  document.body.focus()
})
let reached = false
let presses = 0
for (let i = 0; i < budget && !reached; i++) {
  await page.keyboard.press('Tab')
  presses = i + 1
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
// `presses` is recorded on a PASS too, as a DIAGNOSTIC and not as a distance any
// user walks: the traversal starts wherever phase 3 left focus, so this number
// moves with the phase above it — it read 16 on one run and 1 on the next. What
// it is good for is `focusables`, beside it: that one is the size of the tab
// order this run measured, and it is the number that would show the document
// quietly growing under this driver.
log('KEYBOARD', { reached, presses, budget, focusables, onLand, ring })
if (!reached) {
  fails.push(
    `the reuse control was not reached in ${budget} Tab presses — one full cycle of the ${focusables} focusable elements this document holds, on a rail pinned to 0 rows, so it is not in the tab order`
  )
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

// ---- the SOURCE-level criterion ---------------------------------------------
// #143's text-level half, in `gui-123.source.mjs` because
// `tests/gui-source-assertions.test.ts` runs that array in the gate (#132). This
// loop drives the SAME array, so there is one definition and the gated copy
// cannot drift from the driven one.
console.log('--- source-level (also run by `npm test`) ---')
for (const c of sourceChecks) {
  const { ok, detail } = c.run()
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${c.name} ${JSON.stringify(detail)}`)
  if (!ok) fails.push(`${c.name}: ${JSON.stringify(detail)}`)
}

await finish()
