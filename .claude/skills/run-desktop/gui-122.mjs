// GUI driver for #122 — the copy button on a fenced code block, in the BUILT app.
//
// WHAT `tests/code-copy.test.tsx` ALREADY PROVES, so this does not repeat it:
// the markup, the payload passed to `writeText`, the label flip, and that both
// markdown paths carry the control. All of that runs in jsdom against a
// clipboard stub the test file supplies itself.
//
// WHAT ONLY THIS CAN PROVE, and why the ticket asks for it by name:
//   1. THE WRITE REACHES THE OS CLIPBOARD. Spec #120 recorded that production
//      loads `file://` (`win.loadFile`) while dev loads http://localhost, and
//      that no `setPermissionRequestHandler` is registered anywhere in main. So
//      a button written against `navigator.clipboard` can pass every unit test,
//      pass `npm run dev`, and be INERT in the shipped app — #117's "a callable
//      route is not an effective one", sitting where review does not look. The
//      verdict here is read from MAIN's own `clipboard` module, never from the
//      renderer that just wrote it.
//   2. THE FOCUS RING IS REAL. jsdom loads no CSS, so the stylesheet test in
//      the suite proves a rule was WRITTEN, never that it applies. This reads
//      `getComputedStyle` off the built stylesheet with the control genuinely
//      keyboard-focused.
//   3. THE BUTTON DOES NOT SCROLL AWAY. `pre` is the scrolling element; a
//      control positioned inside it would leave the corner on a wide block.
//
// NEGATIVE CONTROL: the OS clipboard is stomped with a fresh sentinel
// immediately before the click, so "the code is on the clipboard" cannot be a
// stale value from an earlier run or from the developer's own Ctrl-C.
//
// Red-first: run against a build without the `components` override and phase 3
// fails at the selector, naming the reason. A driver never seen failing proves
// nothing — this one was seen failing when its two probe buttons overlapped in
// the sibling spike (`scripts/spike-122-clipboard.mjs`), which is how the
// "route 1 is dead" false negative got caught instead of shipped.
//
//   node .claude/skills/run-desktop/gui-122.mjs
//
// Needs `npm run build` first, plus `npm i --no-save playwright-core`.

import { _electron as electron } from 'playwright-core'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import { profileArgs } from './driver-profile.mjs'

const APP_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const SHOT_DIR = process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')
fs.mkdirSync(SHOT_DIR, { recursive: true })
const WORK_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'gui122-'))

const log = (l, m) => console.log(String(l).padEnd(12) + JSON.stringify(m))
const fails = []

setTimeout(() => {
  console.log('TIMEOUT')
  process.exit(1)
}, 180000).unref?.()

// The payload carries markup on purpose. Model output is hostile input (the
// sandbox decision), so what lands on the clipboard has to be the literal
// characters, never anything interpreted — and an `innerHTML` path anywhere
// would show up here as a mangled or executed string rather than these bytes.
const CODE = ['const a = 1', '<img src=x onerror=alert(1)>', 'const b = a & 2'].join('\n')
const EXPECTED = CODE + '\n'
const MD = ['Here is the block:', '', '```js', CODE, '```'].join('\n')

const app = await electron.launch({
  executablePath: path.join(APP_DIR, 'node_modules/electron/dist/electron.exe'),
  args: ['--no-sandbox', ...profileArgs(), '.'],
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
  isSecureContext: window.isSecureContext,
  hasClipboard: typeof navigator.clipboard?.writeText
}))
log('ENV', env)
if (env.protocol !== 'file:') {
  fails.push(
    `the renderer is on ${env.protocol}, not file: — this run does not measure the production origin, so nothing below is evidence about the shipped app`
  )
  await finish()
}

// ---- phase 1: open a workspace ----------------------------------------------

await app.evaluate(({ dialog }, dir) => {
  dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [dir] })
}, WORK_DIR)

// DOM-dispatched: Playwright's actionability wait hangs on the intro animation
// (gui-93, gui-95, gui-96 and gui-98 all hit this). The copy button itself is
// clicked for real further down — that is the click that matters.
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

// ---- phase 2: a real assistant message with a fenced block ------------------

const pushChat = (ev) =>
  app.evaluate(({ BrowserWindow }, e) => {
    BrowserWindow.getAllWindows()[0]?.webContents.send('chat:event', e)
  }, ev)

await pushChat({ type: 'text-delta', text: MD })
// Caught rather than thrown. Verified red by stashing the two source files and
// rebuilding: without the `components` override this is where the driver stops,
// and an uncaught TimeoutError here dumps a stack trace, skips `finish()` and
// leaves the Electron process behind. The red path has to report as cleanly as
// the green one or nobody reads it.
const arrived = await page
  .waitForSelector('.msg-assistant .code-block button.code-copy', { timeout: 15000 })
  .then(() => true)
  .catch(() => false)
if (!arrived) {
  const seen = await page.evaluate(() => ({
    assistantMessages: document.querySelectorAll('.msg-assistant').length,
    pres: document.querySelectorAll('.msg-assistant pre').length,
    wrappers: document.querySelectorAll('.msg-assistant .code-block').length
  }))
  fails.push(
    `no copy control appeared on a fenced block in the built app after 15s (${JSON.stringify(seen)}) — the \`components\` override on \`pre\` is not reaching the shipped bundle`
  )
  await finish()
}

// The command path renders through its OWN ReactMarkdown. A `components` map
// applied to only one of the two is the easy miss, and it is invisible until a
// slash command emits a fence.
await pushChat({ type: 'command-output', text: MD })
const paths = await page
  .evaluate(() => ({
    assistant: document.querySelectorAll('.msg-assistant .code-block button.code-copy').length,
    command: document.querySelectorAll('.msg-command .code-block button.code-copy').length
  }))
  .catch(() => ({ assistant: -1, command: -1 }))
log('PATHS', paths)
if (paths.assistant < 1) fails.push('the assistant path has no copy control in the built app')
if (paths.command < 1) fails.push('the command path has no copy control — the components map reached only one of the two ReactMarkdown calls')

// ---- phase 3: the click, judged from MAIN -----------------------------------

const mainWrite = (text) =>
  app.evaluate(({ clipboard }, t) => {
    clipboard.writeText(t)
    return clipboard.readText()
  }, text)
const mainRead = () => app.evaluate(({ clipboard }) => clipboard.readText())

// INSTRUMENT PRECONDITION. If main cannot round-trip its own clipboard on this
// machine, the verdict below would be unscored rather than false.
const sentinel = `gui122-stomp-${Date.now()}`
const echoed = await mainWrite(sentinel)
log('PRECOND', { ok: echoed === sentinel })
if (echoed !== sentinel) {
  fails.push(
    "main's own clipboard.writeText/readText do not round-trip on this machine — the copy result cannot be scored"
  )
  await finish()
}

// THE LINE-ENDING CONTROL, and it is not a convenience — it is the reason this
// driver exists in the shape it does.
//
// The first run failed with the clipboard holding the block's text with CRLF
// where the renderer had written LF, and the tempting reading is "the button
// mangles the payload". The first guess — that the Windows clipboard stores
// CRLF — was WRONG and this control is what caught it: writing a known LF string
// from MAIN reads back unchanged, so the OS clipboard does no such thing.
//
// The rewrite belongs to the RENDERER'S clipboard route. Blink converts `\n` to
// `\r\n` on Windows inside `navigator.clipboard.writeText`, below anything this
// repo wrote and above the OS. So the two probes are both needed and they say
// different things: main's says the OS is innocent, the renderer's says where
// the conversion actually happens. Only if the renderer probe reproduces it may
// the comparison below allow for it — otherwise CRLF in the button's payload
// would be the BUTTON's doing and the strict comparison stands.
const lfProbe = 'gui122-lf\nprobe\n'
const mainEcho = await mainWrite(lfProbe)
const osRewrites = mainEcho !== lfProbe

await mainWrite(`gui122-clear-${Date.now()}`)
await page.evaluate((t) => navigator.clipboard.writeText(t), lfProbe)
await page.waitForTimeout(400)
const rendererEcho = await mainRead()
const rendererRewrites = rendererEcho !== lfProbe && rendererEcho.replace(/\r\n/g, '\n') === lfProbe

const platformRewritesNewlines = rendererRewrites
log('NEWLINES', {
  osRewrites,
  rendererRewrites,
  where: rendererRewrites && !osRewrites ? 'blink writeText, not the OS and not the button' : 'unresolved',
  mainReadBack: JSON.stringify(mainEcho),
  rendererReadBack: JSON.stringify(rendererEcho)
})

await app.evaluate(({ BrowserWindow, app: a }) => {
  const w = BrowserWindow.getAllWindows()[0]
  w?.show()
  w?.focus()
  a.focus({ steal: true })
})
await page.waitForTimeout(400)

// NEGATIVE CONTROL: stomp the clipboard so a pass cannot be a stale value from
// an earlier run or from the developer's own Ctrl-C, and VERIFY the stomp held.
const stomp = `gui122-before-click-${Date.now()}`
await mainWrite(stomp)
const before = await mainRead()

const button = page.locator('.msg-assistant .code-block button.code-copy').first()
let clickError = null
try {
  await button.click({ timeout: 8000 })
} catch (e) {
  clickError = String(e && e.message).split('\n')[0]
}
await page.waitForTimeout(700)

const after = await mainRead()
// Exact match, EXCEPT for the newline rewrite the control above measured — and
// only if it measured it. Every other character must be identical, so a payload
// that lost the markup, HTML-escaped the `&`, or picked up the button's own text
// still fails here.
const exact = after === EXPECTED
const modNewlines = platformRewritesNewlines && after.replace(/\r\n/g, '\n') === EXPECTED
const copied = {
  clickError,
  stompHeldBefore: before === stomp,
  exact,
  matchesModuloPlatformNewlines: modNewlines,
  got: exact || modNewlines ? '<exact code>' : JSON.stringify(String(after).slice(0, 80))
}
log('COPIED', copied)
if (clickError) {
  // A click that never landed says nothing about the button. Unscored, not refuted.
  fails.push(`the copy button could not be clicked: ${clickError} — this trial is UNSCORED, not a refutation`)
} else if (!copied.stompHeldBefore) {
  fails.push('the pre-click stomp did not hold, so a match below could be a stale clipboard — UNSCORED')
} else if (!exact && !modNewlines) {
  fails.push(
    `the OS clipboard holds ${copied.got} rather than the block's exact text — the button is inert or mangling the payload in the built app, which is the entire point of this ticket`
  )
}

// ---- phase 4: it confirms, then returns to rest ------------------------------

const confirmLabel = await button.getAttribute('aria-label')
log('CONFIRM', { label: confirmLabel })
if (confirmLabel !== 'Copied') {
  fails.push(`after the click the control reads ${JSON.stringify(confirmLabel)} rather than "Copied" — no confirmation feedback`)
}
await page.waitForTimeout(2600)
const restLabel = await button.getAttribute('aria-label')
log('REST', { label: restLabel })
if (restLabel !== 'Copy code') {
  fails.push(`the control stayed at ${JSON.stringify(restLabel)} — the confirmation never returns to rest`)
}

// ---- phase 5: keyboard reach and the ring, off the BUILT stylesheet ----------

// Tabbed to, never `.focus()`d: Chromium only paints `:focus-visible` for a
// keyboard-shaped focus, so a programmatic focus would read the ring as absent
// and this check would fail for the wrong reason.
await page.evaluate(() => document.querySelector('.message-input')?.blur())
await page.evaluate(() => document.body.focus())
let reached = false
for (let i = 0; i < 60 && !reached; i++) {
  await page.keyboard.press('Tab')
  reached = await page.evaluate(() =>
    document.activeElement?.classList.contains('code-copy') ?? false
  )
}
const ring = reached
  ? await page.evaluate(() => {
      const el = document.activeElement
      const cs = getComputedStyle(el)
      return {
        matchesFocusVisible: el.matches(':focus-visible'),
        boxShadow: cs.boxShadow,
        outlineStyle: cs.outlineStyle,
        background: cs.backgroundColor
      }
    })
  : null
log('KEYBOARD', { reached, ring })
if (!reached) {
  fails.push('the copy control could not be reached with Tab in 60 presses — it is not keyboard reachable')
} else {
  if (!ring.matchesFocusVisible) {
    fails.push('tabbing to the control did not put it in :focus-visible — the ring below is unscored')
  }
  // The hairline is an INSET shadow. A control showing no shadow at all is
  // wearing Chromium's default outline instead, which is exactly what #93 removed.
  if (!/inset/.test(ring.boxShadow) || ring.boxShadow === 'none') {
    fails.push(`the focused control's computed box-shadow is ${JSON.stringify(ring.boxShadow)} — the hairline ring is not applying off the built stylesheet`)
  }
  if (ring.outlineStyle !== 'none') {
    fails.push(`the focused control still paints an outline (${ring.outlineStyle}) — #93's rule is that these controls take the hairline ALONE`)
  }
}

// ---- phase 6: the control stays put when the block scrolls -------------------

// The `pre` is the scrolling element (#121 put the same constraint on tables).
// A button positioned inside it would leave the corner on a wide block, so the
// wrapper has to be the positioning context — measured by scrolling the code and
// checking the button has not moved relative to the wrapper.
const anchored = await page.evaluate(() => {
  const wrap = document.querySelector('.msg-assistant .code-block')
  const pre = wrap?.querySelector('pre')
  const btn = wrap?.querySelector('button.code-copy')
  if (!wrap || !pre || !btn) return null
  pre.style.width = '120px'
  const before = btn.getBoundingClientRect().left - wrap.getBoundingClientRect().left
  pre.scrollLeft = 9999
  const scrolled = pre.scrollLeft
  const afterLeft = btn.getBoundingClientRect().left - wrap.getBoundingClientRect().left
  pre.style.width = ''
  return { scrolled, before: Math.round(before), after: Math.round(afterLeft) }
})
log('ANCHOR', anchored)
if (!anchored) {
  fails.push('could not measure the control against a scrolled block — the wrapper, pre or button was missing')
} else if (anchored.scrolled <= 0) {
  log('NOTE', { anchor: 'the block did not actually scroll, so this check is unscored rather than passing' })
} else if (anchored.before !== anchored.after) {
  fails.push(`the control moved ${anchored.before}px → ${anchored.after}px when the code scrolled — it is anchored inside the scrolling pre rather than to the wrapper`)
}

// ---- phase 7: the control is inside the column, not off the edge -------------

// A button anchored to the block's top-RIGHT corner is only reachable if that
// corner is on screen. The first screenshots of this driver came back with the
// control off-frame, and "off-frame in a screenshot" and "off the visible
// column" are the same defect if the block is wider than `.chat-column`.
const geom = await page.evaluate(() => {
  const wrap = document.querySelector('.msg-assistant .code-block')
  const btn = wrap?.querySelector('button.code-copy')
  const col = document.querySelector('.chat-column')
  if (!wrap || !btn || !col) return null
  const w = wrap.getBoundingClientRect()
  const b = btn.getBoundingClientRect()
  const c = col.getBoundingClientRect()
  return {
    innerWidth: window.innerWidth,
    column: { left: Math.round(c.left), right: Math.round(c.right), width: Math.round(c.width) },
    wrapper: { left: Math.round(w.left), right: Math.round(w.right), width: Math.round(w.width) },
    button: { left: Math.round(b.left), right: Math.round(b.right), top: Math.round(b.top) }
  }
})
log('GEOMETRY', geom)
if (!geom) {
  fails.push('could not measure the control against the chat column')
} else {
  if (geom.wrapper.right > geom.column.right + 1) {
    fails.push(
      `the code block runs ${geom.wrapper.right - geom.column.right}px past the chat column's right edge (${geom.wrapper.right} vs ${geom.column.right}) — the copy control is anchored to a corner outside the column`
    )
  }
  if (geom.button.right > geom.innerWidth) {
    fails.push(
      `the copy control sits at x=${geom.button.right} in a ${geom.innerWidth}px viewport — it is off screen and cannot be clicked`
    )
  }
}

// ---- the human eyeball on top ------------------------------------------------

// The window is grown first: #79 persists bounds, so the inherited size is
// whatever the last run left, and an element screenshot of a block taller than
// the viewport comes back CLIPPED — the first run of this driver produced a
// crop that cut off the very control it exists to show.
const bounds = await app.evaluate(({ BrowserWindow }) => {
  const w = BrowserWindow.getAllWindows()[0]
  const b = w?.getBounds()
  // Wide enough that the 760px chat column clears the ~320px sidebar with room
  // to spare: the control sits at the block's top-RIGHT corner, and at the
  // inherited size that corner was off-frame — a screenshot of everything except
  // the thing being shipped.
  w?.setBounds({ ...b, width: 1600, height: 900 })
  return b
})
await page.waitForTimeout(700)

// VIEWPORT captures, not element captures. An element screenshot is clipped to
// what is on screen, and `.chat` autoscrolls to the newest message on every
// push — so the first two runs of this driver produced crops that cut off the
// very control they exist to show. Scrolling the block to the top of its own
// scroller and shooting the viewport is what actually gets it in frame.
await page.evaluate(() => {
  document.querySelector('.msg-assistant .code-block')?.scrollIntoView({ block: 'center' })
})
await page.waitForTimeout(500)

// CAPTURED THROUGH ELECTRON, not Playwright. The app carries its own zoom level
// (#79/#94), so the page's CSS pixels, Playwright's screenshot pixels and the
// Windows display scale are three different units — `page.screenshot({clip})`
// computed from `getBoundingClientRect()` landed on the wrong region across
// three runs, framing the space above the control every time. `capturePage`
// takes its rect in the page's OWN coordinates, which is the space the rect came
// from, so the two cannot drift apart.
//
// The GEOMETRY phase above is the real evidence for where the button sits. This
// is only the human eyeball on top.
const shots = {}
const shoot = async (name, selector) => {
  const rect = selector
    ? await page.evaluate((s) => {
        const r = document.querySelector(s)?.getBoundingClientRect()
        if (!r) return null
        const pad = 14
        return {
          x: Math.max(0, Math.round(r.x - pad)),
          y: Math.max(0, Math.round(r.y - pad)),
          width: Math.round(r.width + pad * 2),
          height: Math.round(r.height + pad * 2)
        }
      }, selector)
    : null
  const file = path.join(SHOT_DIR, `${name}.png`)
  const ok = await app
    .evaluate(async ({ BrowserWindow }, a) => {
      const w = BrowserWindow.getAllWindows()[0]
      if (!w) return null
      let img
      if (a.rect) {
        // `capturePage` takes DEVICE-INDEPENDENT pixels of the window, while the
        // rect came from `getBoundingClientRect()` in the ZOOMED page's CSS
        // pixels. The app carries its own zoom level (#94), so the two differ by
        // exactly the zoom factor — pass the CSS numbers straight through and
        // the capture lands up and to the left of the target, which is what
        // three earlier runs of this driver produced.
        const z = w.webContents.getZoomFactor()
        img = await w.webContents.capturePage({
          x: Math.max(0, Math.round(a.rect.x * z)),
          y: Math.max(0, Math.round(a.rect.y * z)),
          width: Math.round(a.rect.width * z),
          height: Math.round(a.rect.height * z)
        })
      } else {
        img = await w.webContents.capturePage()
      }
      return img.toPNG().toString('base64')
    }, { rect })
    .then((b64) => {
      if (!b64) return false
      fs.writeFileSync(file, Buffer.from(b64, 'base64'))
      return true
    })
    .catch(() => false)
  shots[name] = ok
  if (ok) console.log(`SHOT        ${file.replace(/\\/g, '/')}`)
}
await shoot('in-context', null)
await shoot('code-block', '.msg-assistant .code-block')
// Hovered too — but ASSERTED by computed style rather than by eye. The repo's
// icon-button hover is `var(--tint-2)`, which is 6% alpha: it is a real state
// change and it is almost invisible in a PNG, so a human comparing two
// screenshots would conclude the hover was dead when it was working.
const rest = await page.evaluate(() => {
  const b = document.querySelector('.msg-assistant .code-block button.code-copy')
  const cs = b ? getComputedStyle(b) : null
  return cs ? { background: cs.backgroundColor, color: cs.color } : null
})
await page.locator('.msg-assistant .code-block button.code-copy').first().hover().catch(() => {})
await page.waitForTimeout(400)
const hovered = await page.evaluate(() => {
  const b = document.querySelector('.msg-assistant .code-block button.code-copy')
  const cs = b ? getComputedStyle(b) : null
  return cs ? { background: cs.backgroundColor, color: cs.color, isHovered: b.matches(':hover') } : null
})
log('HOVER', { rest, hovered })
if (!hovered?.isHovered) {
  log('NOTE', { hover: 'the pointer did not land on the control, so the hover state is UNSCORED rather than failing' })
} else if (hovered.background === rest?.background && hovered.color === rest?.color) {
  fails.push(
    `hovering the control changed neither its fill (${hovered.background}) nor its glyph colour (${hovered.color}) — it gives no pointer affordance at all`
  )
}
await shoot("hover", ".msg-assistant .code-block")
if (bounds) {
  await app
    .evaluate(({ BrowserWindow }, b) => BrowserWindow.getAllWindows()[0]?.setBounds(b), bounds)
    .catch(() => {})
}
if (!shots['in-context']) fails.push('the app could not be screenshotted — nothing here has been eyeballed')

await finish()
