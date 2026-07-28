// GUI eyeball for #49 — lazy title enrichment for slash-command-first sessions.
//
// jsdom proves the wiring against a mocked `window.api`, and a mock answers a
// channel whether or not preload exposed it and whether or not main registered
// a handler. What only a real window can show:
//
//   * `window.api.titleHint` exists on the REAL preload bridge and main really
//     answers it — the ticket's one new channel;
//   * against the REAL store (490+ sessions across 37 projects), the reads are
//     lazy: only rendered rows whose title is a bare command are ever asked
//     about, each exactly once, and the other ~400 sessions are never touched.
//     That last part is the ticket's named sharpest failure mode, and it is
//     invisible to a green suite — the list still renders, just slowly.
//
//   node .claude/skills/run-desktop/gui-49.mjs
//
// Needs `npm run build` first. The counter is installed in the MAIN process by
// wrapping the registered invoke handler, so it counts what the renderer
// actually asked for rather than what this script hoped it would. That reaches
// for `ipcMain._invokeHandlers`, which is private — if a future Electron drops
// it the run reports the coverage as SKIPPED rather than passing silently.

import { _electron as electron } from 'playwright-core'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'

const APP_DIR = path.resolve(import.meta.dirname, '../../..')
const SHOT_DIR = process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')
fs.mkdirSync(SHOT_DIR, { recursive: true })

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
  args: ['--no-sandbox', '--disable-gpu', '.'],
  cwd: APP_DIR,
  env: process.env,
  timeout: 30000
})

const log = (label, m) => console.log(label.padEnd(10) + JSON.stringify(m))

// Wrap the real handler: record (id, what came back) and delegate. Counting in
// main rather than in the page is deliberate — a page-side wrapper would be
// counting the thing it installed, and `window.api` is frozen anyway.
const instrumented = await app.evaluate(({ ipcMain, dialog }, dir) => {
  globalThis.__gui = { calls: [] }
  // The first pick must not open a real native dialog — it would block the run
  // forever. The path travels as an ARGUMENT, never inside a string literal:
  // a single backslash there silently yields a nonexistent cwd.
  dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [dir] })
  const map = ipcMain._invokeHandlers
  if (!map || typeof map.get !== 'function') return false
  const orig = map.get('session:title-hint')
  if (!orig) return false
  map.set('session:title-hint', async (event, ...args) => {
    const out = await orig(event, ...args)
    globalThis.__gui.calls.push({ id: args[0], out })
    return out
  })
  return true
}, APP_DIR)
log('INSTRUMENT', { mainSideCounter: instrumented })

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
await page.waitForSelector('.session-group-head', { timeout: 20000 })
// Enrichment is one transcript read per qualifying row; give the whole visible
// page time to settle before counting.
await page.waitForTimeout(6000)

// The channel itself, on the real bridge. A jsdom mock answers this regardless.
const bridge = await page.evaluate(
  () => typeof window.api?.titleHint === 'function'
)
log('BRIDGE', { titleHint: bridge })

// The real store, read over the real list channel — the denominator for "lazy".
const store = await page.evaluate(async () => {
  const sessions = await window.api.listSessions()
  const bare = (t) => {
    const s = (t ?? '').trim()
    return s.startsWith('/') && s.split(/\s+/).length <= 3
  }
  // What the rail actually renders: newest-first, capped at one page.
  const page1 = [...sessions].sort((a, b) => b.lastUpdated - a.lastUpdated).slice(0, 100)
  return {
    total: sessions.length,
    bareTotal: sessions.filter((s) => bare(s.title)).length,
    visibleIds: page1.map((s) => s.id),
    visibleBareIds: page1.filter((s) => bare(s.title)).map((s) => s.id),
    rows: document.querySelectorAll('.session-row-btn').length,
    labels: [...document.querySelectorAll('.session-row-title')].map((n) => n.textContent ?? '')
  }
})

const asked = await app.evaluate(() => globalThis.__gui?.calls ?? [])
const askedIds = asked.map((c) => c.id)
const uniqueAsked = [...new Set(askedIds)]
const derived = asked.filter((c) => typeof c.out === 'string' && c.out)

log('STORE', {
  sessions: store.total,
  bareTitles: store.bareTotal,
  rowsRendered: store.rows,
  visibleBare: store.visibleBareIds.length
})
log('ASKED', {
  calls: askedIds.length,
  unique: uniqueAsked.length,
  derivedLabels: derived.length,
  sample: derived.slice(0, 3).map((c) => c.out.slice(0, 60))
})

// A row whose displayed label is no longer the bare command it was recorded as.
const shownEnriched = derived.filter((c) =>
  store.labels.some((l) => l.trim() === c.out.trim())
).length
log('IN-DOM', { derived: derived.length, showing: shownEnriched })

// Direct probe AFTER the counting snapshot, so it cannot inflate it: does main
// answer at all, for a real id, over the real channel?
const probeId = store.visibleBareIds[0] ?? store.visibleIds[0] ?? null
const probe = await page.evaluate(async (id) => {
  if (!id) return { ran: false }
  try {
    const out = await window.api.titleHint(id, null)
    return { ran: true, ok: out === null || typeof out === 'string', type: typeof out }
  } catch (e) {
    return { ran: true, ok: false, error: String(e).slice(0, 120) }
  }
}, probeId)
log('PROBE', probe)

const shot = path.join(SHOT_DIR, 'title-enrichment.png')
await page.screenshot({ path: shot })
console.log('SHOT ' + shot)

// ── verdict ────────────────────────────────────────────────────────────────
const fails = []
const skipped = []

if (!bridge) fails.push('window.api.titleHint is missing from the preload bridge')
if (!probe.ran) skipped.push('the direct probe (no session in this store to ask about)')
else if (!probe.ok) fails.push(`main did not answer session:title-hint: ${probe.error ?? probe.type}`)

if (!instrumented) {
  skipped.push('main-side call counting (ipcMain._invokeHandlers unavailable)')
} else {
  const visible = new Set(store.visibleIds)
  const bareVisible = new Set(store.visibleBareIds)
  const offPage = uniqueAsked.filter((id) => !visible.has(id))
  const notBare = uniqueAsked.filter((id) => !bareVisible.has(id) && visible.has(id))

  if (offPage.length) {
    fails.push(`${offPage.length} unrendered sessions were read — the store is being scanned`)
  }
  if (notBare.length) {
    fails.push(`${notBare.length} rows with a perfectly good title were read anyway`)
  }
  if (askedIds.length !== uniqueAsked.length) {
    fails.push(`a session was read more than once (${askedIds.length} calls, ${uniqueAsked.length} ids)`)
  }
  if (uniqueAsked.length > store.visibleBareIds.length) {
    fails.push(`read ${uniqueAsked.length} sessions but only ${store.visibleBareIds.length} rows qualify`)
  }
  // The headline number: the whole point is that most of the store is untouched.
  if (store.total > 0 && uniqueAsked.length >= store.total) {
    fails.push('every session in the store was read')
  }
  if (store.visibleBareIds.length === 0) {
    skipped.push('the enrichment path itself (no bare-command row on this page)')
  } else if (uniqueAsked.length === 0) {
    fails.push(`${store.visibleBareIds.length} rows qualify but nothing was read`)
  }
  if (derived.length > 0 && shownEnriched === 0) {
    fails.push('main derived labels but no row is showing one')
  }
  if (derived.length === 0 && store.visibleBareIds.length > 0) {
    skipped.push('the visible-label check (every qualifying row on this page answered null)')
  }
}

if (skipped.length) console.log('SKIPPED ' + skipped.join(' | '))
console.log(fails.length ? 'FAIL ' + fails.join(' | ') : 'PASS all #49 criteria')

// `app.close()` can hang after a clean run, and the watchdog then reports
// TIMEOUT over a verdict that already printed. Arm the exit BEFORE awaiting it.
const exit = () => process.exit(fails.length ? 1 : 0)
setTimeout(exit, 3000).unref?.()
await app.close().catch(() => {})
console.log('DONE')
exit()
