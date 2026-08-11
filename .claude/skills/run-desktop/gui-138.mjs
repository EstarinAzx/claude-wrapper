// GUI eyeball for #138 — one type scale holds across the app's surfaces.
//
//   node .claude/skills/run-desktop/gui-138.mjs
//
// Needs `npm run build` first, plus playwright-core. Costs NO CLI turns.
//
// WHY A DRIVER IS MANDATORY HERE (acceptance 4). The defect is a RENDERED size.
// `markdown.css` set its headings at `1.25em` / `1.1em`, which against a 15px
// body paint 18.75 and 16.5 — two sizes that appear nowhere in the source and
// that no reading of the declaration produces. jsdom loads no CSS, so the fast
// gate and CI are structurally incapable of seeing this. The source-level half
// lives in `gui-138.source.mjs` and DOES run in `npm test`; it can only stop the
// defect returning by the route it came in on. This file is the only thing that
// measures what is actually painted.
//
//   `npm test`          gui-138.source.mjs — three text checks over src/ + DESIGN.md
//   `npm run test:dom`  this file — computed font sizes in a real Chromium
//
// THE RULE THIS MEASURES, and why it is a rule rather than an allow-list.
// `DESIGN.md` states the scale as a RATIO: "Scale ratio ~1.15, fixed
// rem-equivalents, no fluid type." So the criterion is not "the size is one of
// these six numbers" — that would be the enumeration the ticket's own ruling
// refused, and it would pass any new size the day somebody added it to the list.
// It is: every painted size sits within half a pixel of `body * 1.15^k` for
// some integer k. Half a pixel because the authored rungs are rounded to whole
// px (11 is 11.34 rounded, 13 is 13.04, the display rung is 45.90), so a rung
// and its authored form differ by less than one.
//
// What that rule does to the sizes this app paints today:
//
//   11      k=-2  exact 11.34  delta 0.34  PASS
//   13      k=-1  exact 13.04  delta 0.04  PASS
//   15      k=0   exact 15.00  delta 0.00  PASS
//   17.25   k=1   exact 17.25  delta 0.00  PASS
//   19.84   k=2   exact 19.84  delta 0.00  PASS
//   20      k=2   exact 19.84  delta 0.16  PASS  (the subagent close glyph)
//   46      k=8   exact 45.90  delta 0.10  PASS
//   16.5    k=1   exact 17.25  delta 0.75  FAIL  <- markdown h2, before this ticket
//   18.75   k=2   exact 19.84  delta 1.09  FAIL  <- markdown h1, before this ticket
//
// The two failures are exactly the ticket's finding, and nothing else moves.
// RED-VERIFIED against the unfixed tree: criteria 1 and 3 fail (16.5 and 18.75
// off-ladder; `--fs-display` at 23px painted by nothing) and the run exits 1.
//
// THREE THINGS THIS DRIVER IS BUILT AROUND
//
// 1. A SWEEP THAT SEES NOTHING PASSES. The whole check is "no off-ladder size is
//    present", which is trivially true of an empty DOM. So the premise is
//    asserted first and separately: the markdown headings must actually be in
//    the tree and must actually be the three distinct ranks. Without that, a
//    react-markdown upgrade that stopped emitting `h1` would turn this file
//    green and read as the ticket holding.
//
// 2. THE SWEEP IS OVER PAINTED BOXES, NOT OVER RULES. `document.body` down,
//    skipping anything with no client rect. `html` is deliberately outside it:
//    Chromium computes 16px there (the app sets its size on `body`), and that is
//    a UA default nothing paints, so including it would red the run for a size
//    no user ever sees. Every non-rendered `head` child is dropped by the same
//    clause rather than by a tag list.
//
// 3. THE COLLISION IS MEASURED ACROSS PHASES. `.welcome-hint` (17.25) and the
//    markdown `h2` are never in the DOM at the same time — one is the Welcome
//    screen, the other needs an open workspace. The ticket's constraint is that
//    restriking must RESOLVE the 0.75px gap rather than preserve it one step
//    over, so both are recorded in the same run, in the same window, at the same
//    zoom, and compared at the end.
//
// The assistant message is pushed as a `text-delta` from main — no engine turn,
// no API key, no credits. gui-96 and gui-agents-dock use the same channel. The
// synthetic part is one event; the markdown parse, the cascade and every
// computed value below are the app's real components in a real window.

import { _electron as electron } from 'playwright-core'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'

// #132 — the source-level criteria are defined once, in the sidecar the GATE
// runs, and driven from here so the two copies cannot drift.
import { checks as sourceChecks } from './gui-138.source.mjs'
import { profileArgs } from './driver-profile.mjs'

const APP_DIR = path.resolve(import.meta.dirname, '../../..')
const SHOT_DIR = process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')
fs.mkdirSync(SHOT_DIR, { recursive: true })

// Only the basename is ever printed — #90's scrubbing rule keeps the OS
// username out of anything that lands in the repo.
const WORK_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'gui138-'))

const RATIO = 1.15
const TOLERANCE_PX = 0.5

const fails = []
const check = (label, ok, detail) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ${JSON.stringify(detail)}`)
  if (!ok) fails.push(label)
}

setTimeout(() => {
  console.log('TIMEOUT')
  process.exit(1)
}, 180000).unref?.()

/** Nearest rung on the ~1.15 ladder, and how far the painted size sits from it. */
const rungOf = (px, base) => {
  const k = Math.round(Math.log(px / base) / Math.log(RATIO))
  const exact = base * RATIO ** k
  return { k, exact: +exact.toFixed(4), delta: +Math.abs(px - exact).toFixed(4) }
}

const electronBin =
  process.platform === 'win32'
    ? path.join(APP_DIR, 'node_modules/electron/dist/electron.exe')
    : process.platform === 'darwin'
      ? path.join(APP_DIR, 'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron')
      : path.join(APP_DIR, 'node_modules/electron/dist/electron')

const app = await electron.launch({
  executablePath: electronBin,
  args: ['--no-sandbox', '--disable-gpu', ...profileArgs(), '.'],
  cwd: APP_DIR,
  env: process.env,
  timeout: 30000
})

await app.evaluate(async ({ dialog }, dir) => {
  dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [dir] })
}, WORK_DIR)

const page = await app.firstWindow()
await page.waitForSelector('[aria-label="Backend mode"]', { timeout: 15000 })

// The in-page sweep, defined once and evaluated in both phases.
const SWEEP = `(() => {
  const seen = new Map()
  for (const el of document.body.querySelectorAll('*')) {
    if (el.getClientRects().length === 0) continue
    const px = parseFloat(getComputedStyle(el).fontSize)
    if (!(px > 0)) continue
    const key = px.toFixed(4)
    if (!seen.has(key)) {
      const cls = typeof el.className === 'string' ? el.className.trim().split(/\\s+/).filter(Boolean) : []
      seen.set(key, { px, sample: el.tagName.toLowerCase() + (cls.length ? '.' + cls.join('.') : ''), count: 0 })
    }
    seen.get(key).count++
  }
  return {
    sizes: [...seen.values()].sort((a, b) => a.px - b.px),
    elements: document.body.querySelectorAll('*').length,
    htmlPx: parseFloat(getComputedStyle(document.documentElement).fontSize),
    bodyPx: parseFloat(getComputedStyle(document.body).fontSize),
    displayToken: getComputedStyle(document.documentElement).getPropertyValue('--fs-display').trim(),
    zoom: window.devicePixelRatio
  }
})()`

// ---- phase 0: the Welcome screen ------------------------------------------
// Swept BEFORE a folder is open, because `.welcome-title` and `.welcome-hint`
// are the two largest rungs in the product and they exist in no other state.
const welcome = await page.evaluate(SWEEP)
console.log(`--- phase 0: welcome (${welcome.elements} elements, html ${welcome.htmlPx}px, body ${welcome.bodyPx}px, dpr ${welcome.zoom}) ---`)

const welcomeHint = await page.evaluate(() => {
  const el = document.querySelector('.welcome-hint')
  const title = document.querySelector('.welcome-title')
  return {
    hint: el ? parseFloat(getComputedStyle(el).fontSize) : null,
    title: title ? parseFloat(getComputedStyle(title).fontSize) : null
  }
})
check(
  'premise: the Welcome headline and its supporting line are both on screen',
  welcomeHint.hint !== null && welcomeHint.title !== null,
  welcomeHint
)

const welcomeShot = path.join(SHOT_DIR, 'gui-138-welcome.png')
await page.screenshot({ path: welcomeShot })

// ---- phase 1: open a workspace and render real markdown -------------------
// DOM-dispatched: Playwright's actionability wait hangs on the intro animation
// (gui-93 and gui-95 both hit this).
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find(
    (b) =>
      b.getAttribute('aria-label') === 'Pick a project folder' ||
      b.textContent?.includes('Pick a project folder')
  )
  btn?.click()
})
await page.waitForSelector('.message-input', { timeout: 20000 })
console.log(`--- workspace open (fixture: ${path.basename(WORK_DIR)}) ---`)

const MARKDOWN = [
  '# Heading one',
  '',
  'A paragraph of assistant prose with `inline code` in it.',
  '',
  '## Heading two',
  '',
  'More prose under the second rank.',
  '',
  '### Heading three',
  '',
  '| col | col |',
  '| --- | --- |',
  '| a | b |',
  ''
].join('\n')

await app.evaluate(({ BrowserWindow }, text) => {
  const win = BrowserWindow.getAllWindows()[0]
  win.webContents.send('chat:event', { type: 'text-delta', text })
}, MARKDOWN)

await page.waitForSelector('.assistant-body h1', { timeout: 10000 }).catch(() => {})

// PREMISE, and the anti-vacuity guard for the whole sweep: an empty DOM has no
// off-ladder size in it either.
const heads = await page.evaluate(() => {
  const read = (s) => {
    const el = document.querySelector(s)
    return el ? parseFloat(getComputedStyle(el).fontSize) : null
  }
  return {
    h1: read('.assistant-body h1'),
    h2: read('.assistant-body h2'),
    h3: read('.assistant-body h3'),
    code: read('.assistant-body code'),
    table: read('.assistant-body table')
  }
})
check(
  'premise: real markdown rendered three distinct heading ranks inside .assistant-body',
  heads.h1 !== null && heads.h2 !== null && heads.h3 !== null && heads.h1 > heads.h2 && heads.h2 > heads.h3,
  heads
)

// The Agents dock, so the sweep covers a right-slot panel too. One click, and a
// dock is an in-flow aside, so nothing else on screen is resized out of view.
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) =>
    (b.getAttribute('aria-label') || '').toLowerCase().includes('agents')
  )
  btn?.click()
})
await page.waitForTimeout(400)

const workspace = await page.evaluate(SWEEP)
console.log(`--- phase 1: workspace + markdown (${workspace.elements} elements) ---`)

const chatShot = path.join(SHOT_DIR, 'gui-138-markdown.png')
await page.screenshot({ path: chatShot })

// ---- criterion 1: every painted size is a rung ----------------------------
const base = workspace.bodyPx
const all = new Map()
for (const phase of [
  { name: 'welcome', data: welcome },
  { name: 'workspace', data: workspace }
]) {
  for (const s of phase.data.sizes) {
    const key = s.px.toFixed(4)
    if (!all.has(key)) all.set(key, { ...s, phases: [] })
    all.get(key).phases.push(phase.name)
  }
}
const painted = [...all.values()]
  .map((s) => ({ ...s, ...rungOf(s.px, base) }))
  .sort((a, b) => a.px - b.px)

console.log(`--- painted sizes, against a ${base}px body on a ${RATIO} ladder ---`)
for (const s of painted) {
  console.log(
    `  ${String(s.px).padStart(7)}px  k=${String(s.k).padStart(2)}  rung ${String(s.exact).padStart(7)}  delta ${s.delta.toFixed(3)}  x${s.count}  ${s.sample}  [${s.phases.join('+')}]`
  )
}

const offLadder = painted.filter((s) => s.delta > TOLERANCE_PX)
check(
  `criterion 1: every painted size is within ${TOLERANCE_PX}px of a ${RATIO} rung off ${base}px`,
  offLadder.length === 0,
  {
    distinctSizes: painted.length,
    offLadder: offLadder.map((s) => ({ px: s.px, nearestRung: s.exact, delta: s.delta, sample: s.sample })),
    swept: { welcome: welcome.elements, workspace: workspace.elements }
  }
)

// ---- criterion 2: the collision the restrike had to resolve ---------------
// 17.25 sat 0.75px from BOTH markdown headings. Landing h2 on the same rung as
// `.welcome-hint` is what closes it; landing it one step over would leave the
// same defect at a different offset, which is what the ticket forbids.
const gap = welcomeHint.hint === null || heads.h2 === null ? null : Math.abs(welcomeHint.hint - heads.h2)
check(
  'criterion 2: markdown h2 and .welcome-hint paint the SAME rung, not one 0.75px away',
  gap !== null && gap < 0.01,
  { welcomeHint: welcomeHint.hint, markdownH2: heads.h2, gapPx: gap }
)

// ---- criterion 3: --fs-display names a size something paints --------------
// The token read straight off `:root`, compared against the set of sizes the
// app actually paints. Before this ticket it computed 23px while its only
// caller consumed it through `calc(... * 1.15^5)`, so 23 was painted nowhere.
const displayPx = parseFloat(workspace.displayToken)
const paintsDisplay = painted.some((s) => Math.abs(s.px - displayPx) < 0.01)
check(
  'criterion 3: --fs-display computes to a size some element actually paints',
  Number.isFinite(displayPx) && paintsDisplay,
  {
    token: workspace.displayToken,
    px: displayPx,
    paintedSizes: painted.map((s) => s.px),
    hint: 'a token naming a size nothing renders is the defect class this criterion closes'
  }
)

// ---- criterion 4: the SOURCE-level half ------------------------------------
// Also run by `npm test` since #132, from the same array.
console.log('--- source-level criteria (also run by `npm test`) ---')
for (const c of sourceChecks) {
  const { ok, detail } = c.run()
  check(c.name, ok, detail)
}

console.log(`screenshots: ${welcomeShot} | ${chatShot}`)
console.log(fails.length === 0 ? 'ALL GREEN' : `RED: ${fails.join(' | ')}`)

setTimeout(() => process.exit(fails.length === 0 ? 0 : 1), 3000).unref?.()
await app.close().catch(() => {})
try {
  fs.rmSync(WORK_DIR, { recursive: true, force: true })
} catch {
  console.log(`(left behind: ${path.basename(WORK_DIR)})`)
}
process.exit(fails.length === 0 ? 0 : 1)
