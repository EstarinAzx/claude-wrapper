// Spike for #122 — WHICH clipboard route actually works in the BUILT app.
//
// The question is not "does the code call something". Spec #120 recorded the
// two facts that make this measurable rather than guessable:
//   - `src/main/index.ts:376-379` — dev loads ELECTRON_RENDERER_URL (http://
//     localhost), production loads `win.loadFile()`, i.e. a `file://` URL.
//   - no `setPermissionRequestHandler` is registered anywhere in main, so
//     Electron's defaults apply and nobody in this repo has ever looked at what
//     they do to `clipboard-write`.
// So a button written against `navigator.clipboard.writeText` can pass jsdom,
// pass `npm run dev`, and be INERT in the shipped app. That is #117's "a
// callable route is not an effective one", sitting where review does not look.
//
// HOW THIS AVOIDS MEASURING ITSELF:
//   * The verdict is read from the OS clipboard via MAIN's `clipboard` module,
//     never from the renderer that just wrote it. A renderer that reports
//     success to itself is the exact failure mode under test.
//   * INSTRUMENT PRECONDITION: main writes and reads back its own sentinel
//     first. If main cannot see the clipboard on this machine, every result
//     below is unscored rather than false.
//   * NEGATIVE CONTROL per trial: the clipboard is stomped with a fresh
//     sentinel immediately before each attempt, so "the nonce is there" cannot
//     be a stale value from an earlier trial or from the developer's own Ctrl-C.
//   * REAL USER GESTURE: each route is driven by a Playwright `click()` on a
//     real button, not by `page.evaluate`. Chromium gates clipboard writes on
//     transient user activation, so an evaluate-only probe measures a different
//     thing than the shipped button does. The evaluate arm is kept as a
//     SECONDARY datum precisely to show the two differ (or do not).
//
//   node scripts/spike-122-clipboard.mjs
//
// Needs `npm run build` first, plus `npm i --no-save playwright-core`.

import { _electron as electron } from 'playwright-core'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const APP_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(APP_DIR, 'scripts', 'spike-122-findings.json')

const log = (l, m) => console.log(String(l).padEnd(12) + JSON.stringify(m))
const findings = { env: null, precondition: null, trials: [], verdict: null }

setTimeout(() => {
  console.log('TIMEOUT')
  process.exit(1)
}, 180000).unref?.()

const app = await electron.launch({
  executablePath: path.join(APP_DIR, 'node_modules/electron/dist/electron.exe'),
  args: ['--no-sandbox', '.'],
  cwd: APP_DIR,
  env: process.env,
  timeout: 45000
})

const page = await app.firstWindow()
await page.waitForLoadState('domcontentloaded')

const finish = async (code) => {
  // CRLF, matching every other findings file in this folder — the repo is CRLF
  // throughout and a generated artefact that re-writes itself LF on every run
  // would show up as a whole-file diff each time.
  fs.writeFileSync(OUT, JSON.stringify(findings, null, 2).replace(/\n/g, '\r\n'))
  console.log(`FINDINGS    ${path.relative(APP_DIR, OUT).replace(/\\/g, '/')}`)
  await app.close().catch(() => {})
  process.exit(code)
}

// ---- 0. the renderer's actual environment, in the app as shipped ------------

findings.env = await page.evaluate(() => ({
  protocol: location.protocol,
  href: location.href.slice(0, 60),
  isSecureContext: window.isSecureContext,
  hasClipboard: typeof navigator.clipboard,
  hasWriteText: typeof navigator.clipboard?.writeText,
  hasExecCommand: typeof document.execCommand
}))
log('ENV', findings.env)

if (findings.env.protocol !== 'file:') {
  // Not fatal — but it means this run is NOT measuring the shipped surface, and
  // saying so is the whole point of the spike.
  log('WARNING', {
    note: 'renderer is not on file: — this run does not measure the production origin',
    protocol: findings.env.protocol
  })
}

// ---- 1. instrument precondition: can MAIN see the clipboard at all? ---------

const mainWrite = (text) =>
  app.evaluate(({ clipboard }, t) => {
    clipboard.writeText(t)
    return clipboard.readText()
  }, text)

const mainRead = () => app.evaluate(({ clipboard }) => clipboard.readText())

const preSentinel = `spike122-precondition-${Date.now()}`
const echoed = await mainWrite(preSentinel)
findings.precondition = { wrote: preSentinel, readBack: echoed, ok: echoed === preSentinel }
log('PRECOND', findings.precondition)
if (!findings.precondition.ok) {
  findings.verdict = {
    scored: false,
    reason: "main's own clipboard.writeText/readText do not round-trip on this machine — every route below would be unscored"
  }
  await finish(1)
}

// Main's `clipboard` round-tripping is also the evidence for ROUTE 2: an
// `ipcRenderer.invoke` bridge is nothing but this call reached over IPC, and
// this repo already runs ~30 invoke channels.

// ---- 2. a real button in the real renderer ----------------------------------

// The probe button is injected rather than reusing app UI: at this point in the
// ticket the copy button does not exist yet, and the question is about the
// PLATFORM, not about this repo's markup.
await page.evaluate(() => {
  // Each button gets its OWN slot. The first version of this probe stacked both
  // at top:0/left:0, so the second covered the first, Playwright's actionability
  // hit-test refused the click, and the navigator.clipboard trial recorded a
  // handler that never ran. That read as "route 1 is dead in the built app" and
  // it was the instrument, not the route. Unscored is not refuted.
  const mk = (id, label, top) => {
    const b = document.createElement('button')
    b.id = id
    b.textContent = label
    b.style.cssText = `position:fixed;top:${top}px;left:0;width:120px;height:40px;z-index:2147483647;`
    document.body.appendChild(b)
    return b
  }
  globalThis.__s122 = { result: null }

  mk('s122-async', 'async', 200).addEventListener('click', async () => {
    const text = globalThis.__s122.payload
    try {
      await navigator.clipboard.writeText(text)
      globalThis.__s122.result = { ok: true, error: null }
    } catch (e) {
      globalThis.__s122.result = { ok: false, error: String(e && e.name) + ': ' + String(e && e.message) }
    }
  })

  mk('s122-exec', 'exec', 260).addEventListener('click', () => {
    const text = globalThis.__s122.payload
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.setAttribute('readonly', '')
      ta.style.cssText = 'position:fixed;top:-1000px;opacity:0;'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      ta.remove()
      globalThis.__s122.result = { ok, error: ok ? null : 'execCommand returned false' }
    } catch (e) {
      globalThis.__s122.result = { ok: false, error: String(e && e.message) }
    }
  })
})

const runTrial = async ({ route, selector, gesture }) => {
  const nonce = `spike122-${route}-${gesture}-${Math.random().toString(36).slice(2, 10)}`
  // NEGATIVE CONTROL — stomp the clipboard so a pass cannot be a stale value.
  const stomp = `spike122-stomp-${Date.now()}`
  await mainWrite(stomp)
  const before = await mainRead()

  await page.evaluate((n) => {
    globalThis.__s122.payload = n
    globalThis.__s122.result = null
  }, nonce)

  // Focus the window for every trial: a click implies focus in real use, and
  // Chromium rejects clipboard writes from an unfocused document.
  await app.evaluate(({ BrowserWindow, app: a }) => {
    const w = BrowserWindow.getAllWindows()[0]
    w?.show()
    w?.focus()
    a.focus({ steal: true })
  })
  await page.waitForTimeout(400)

  // The click error is RECORDED, never swallowed: a click that never landed
  // must not be scored as a route that does not work.
  let gestureError = null
  if (gesture === 'click') {
    try {
      await page.click(selector, { timeout: 5000 })
    } catch (e) {
      gestureError = String(e && e.message).split('\n')[0]
    }
  } else {
    await page.evaluate((s) => document.querySelector(s)?.dispatchEvent(new Event('click')), selector)
  }
  await page.waitForTimeout(900)

  const reported = await page.evaluate(() => globalThis.__s122.result)
  const after = await mainRead()
  const row = {
    route,
    gesture,
    nonce,
    stompHeldBefore: before === stomp,
    gestureError,
    handlerRan: reported !== null,
    rendererReported: reported,
    clipboardAfterMatchesNonce: after === nonce,
    clipboardAfterSample: after === nonce ? '<nonce>' : String(after).slice(0, 40)
  }
  // EFFECTIVE = the OS clipboard holds what the renderer asked for, judged from
  // main. `rendererReported.ok` alone is the lie this spike exists to catch.
  row.effective = row.stompHeldBefore && row.clipboardAfterMatchesNonce
  // SCORED is a separate axis from effective. A trial whose gesture never
  // reached the handler says nothing about the route at all.
  row.scored = row.stompHeldBefore && row.handlerRan && !gestureError
  log('TRIAL', row)
  findings.trials.push(row)
  return row
}

const asyncClick = await runTrial({ route: 'navigator.clipboard', selector: '#s122-async', gesture: 'click' })
const execClick = await runTrial({ route: 'execCommand', selector: '#s122-exec', gesture: 'click' })
// SECONDARY: same routes without a trusted gesture, to show whether user
// activation is what decides it. Not the shipped path either way.
const asyncNoGesture = await runTrial({
  route: 'navigator.clipboard',
  selector: '#s122-async',
  gesture: 'synthetic'
})

// ---- 3. verdict --------------------------------------------------------------

const unscored = [asyncClick, execClick, asyncNoGesture].filter((t) => !t.scored)
findings.verdict = {
  scored: unscored.length === 0,
  unscoredTrials: unscored.map((t) => ({ route: t.route, gesture: t.gesture, gestureError: t.gestureError })),
  origin: findings.env.protocol,
  route1_navigator_clipboard_under_real_click: asyncClick.effective,
  route3_execCommand_under_real_click: execClick.effective,
  route1_without_user_gesture: asyncNoGesture.effective,
  route2_ipc_bridge_available: findings.precondition.ok,
  pick: !asyncClick.scored
    ? 'UNSCORED — the real-click trial for navigator.clipboard never reached its handler; nothing may be concluded about route 1'
    : asyncClick.effective
      ? 'navigator.clipboard.writeText — effective in the built app under a real click; no new surface needed'
      : execClick.effective
        ? 'execCommand fallback — navigator.clipboard is NOT effective in the built app'
        : 'ipcRenderer.invoke bridge to main clipboard — neither renderer route reached the OS clipboard'
}
log('VERDICT', findings.verdict)

await finish(0)
