// GUI eyeball for #136 — the session title sits on the window's true centre.
//
// jsdom loads no CSS, so no vitest test in this repo can see where the title
// actually lands; the whole defect lives in the cascade. This measures it in the
// real built app with `getBoundingClientRect`, never off a screenshot — the
// ticket's own 21px was found by scanning a capture, and a scanline cannot tell
// a shifted box from a shifted glyph run.
//
// WHAT IS BEING PINNED, and why it is not a number. The titlebar is three flex
// children: a left group (mark, app name, two pills), the centre slot, a right
// group (dock toggles, separator, three window controls). Centre a child in the
// space REMAINING between two unequal neighbours and its midpoint lands at
//   W/2 + (leftWidth - rightWidth) / 2
// so the title drifts by half the difference between the flanks — 21px when the
// left group ran 42px wider. Any assertion on 21, or on any single window width,
// would go green again the moment a pill was added. This driver therefore varies
// the flank widths ON PURPOSE and requires the midpoint to hold at W/2 in every
// state: that is the mechanism, and the number is only its symptom.
//
// The driver ESTABLISHES ITS OWN PREMISE: run it against the build before the
// fix and it must be RED. Verified red on `883f742`, and the four states put a
// number on the mechanism rather than on the symptom — measured offsets of
// +77.9 / +21.4 / -11.3 / -45.7css, against `(L-R)/2 + padLeft/2` predictions of
// +77.9 / +21.4 / -11.3 / -45.65. The model holds to a tenth of a pixel in every
// state, which is why the fix is two flex declarations and a moved padding and
// not a nudge. Note the ticket's own +21 is the DOCKS-OPEN case: the welcome
// screen, which is the first thing every user sees, ran nearly four times worse.
//
//   node .claude/skills/run-desktop/gui-136.mjs
//
// Runs in `npm run test:dom`, NOT in `npm test` (D4): it needs a real window.
// Its source-level half is `gui-136.source.mjs`, which does run in the gate.
// Needs `npm run build` first, plus playwright-core. Spends no CLI turn.

import { _electron as electron } from 'playwright-core'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import { checks as sourceChecks } from './gui-136.source.mjs'
import { profileArgs } from './driver-profile.mjs'

const APP_DIR = path.resolve(import.meta.dirname, '../../..')
const SHOT_DIR = process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')
fs.mkdirSync(SHOT_DIR, { recursive: true })

// A PRIVATE `userData` — this driver's own `mkdtemp`, until #147 made the same
// thing the default for every driver. The argument that started here now lives
// in `driver-profile.mjs`, which is where `...profileArgs()` below gets the
// directory from; the short version is that this driver must pin the window's
// size and zoom to make `setContentSize(640)` mean the 640css minimum its ticket
// names, both of those outlive the process, and writing them into the shared
// profile is what made gui-69 and gui-70 fail in the batch while passing alone.
//
// Nothing here needs a directory of its own any more, and keeping one would mean
// this driver was the only member of the set opting out of the mechanism it
// argued for.

// A long folder name, built to length rather than typed to it so the number in
// the assertion and the number on disk cannot drift apart. 60 chars is gui-72's
// fixture: it fits the slot at 1440 and truncates at 640, which is what makes
// this the "long session title" case AC2 asks for AND the truncation AC3 wants.
const NAME_LEN = 60
const LONG_NAME = 'claude-wrapper-long-project-folder-name-'.padEnd(NAME_LEN, 'x')
if (LONG_NAME.length !== NAME_LEN)
  throw new Error(`fixture name is ${LONG_NAME.length}, want ${NAME_LEN}`)
const LONG_DIR = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'gui136-')), LONG_NAME)
fs.mkdirSync(LONG_DIR, { recursive: true })

// 1440 is the width the ticket measured on. 640 is the window's own minWidth
// (src/main/index.ts), so it is the narrowest state a user can produce rather
// than a number picked to be hard. 1100 sits between them so a pass cannot be
// two endpoints that happen to agree.
const WIDTHS = [1440, 1100, 640]
const HEIGHT = 900

// CSS px. The defect is 21px, so this discriminates by a factor of twenty while
// still absorbing sub-pixel text metrics and the odd half-pixel border.
const EPS = 1.0

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
  args: ['--no-sandbox', '--disable-gpu', ...profileArgs(), '.'],
  cwd: APP_DIR,
  env: process.env,
  timeout: 30000
})

// The path travels as an ARGUMENT, never inside a literal. Stubbed in MAIN
// before the click that opens a dialog, or the run blocks forever.
await app.evaluate(async ({ dialog }, dir) => {
  dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [dir] })
}, LONG_DIR)

const page = await app.firstWindow()
await page.waitForSelector('[aria-label="Backend mode"]', { timeout: 15000 })

// Still normalised even on the private profile above, because a fresh profile
// has no stored zoom and the app then applies its own default rather than 1 —
// and every `setContentSize` would land at a different CSS width. Both halves
// are set for inspect.mjs's reason: the factor lives in `userData` and the
// app's own belief about it lives in the renderer's localStorage, so setting
// one and not the other normalises the pixels while leaving the app disagreeing.
// This is what lets 640 device px mean the 640css minimum the ticket names.
await page.evaluate(() => window.localStorage.setItem('zoom-level-v2', '1'))
await page.reload()
await page.waitForLoadState('domcontentloaded')
await page.waitForSelector('[aria-label="Backend mode"]', { timeout: 20000 })
const zoom = await app.evaluate(({ BrowserWindow }) => {
  const w = BrowserWindow.getAllWindows()[0]
  w.webContents.setZoomFactor(1)
  w.unmaximize?.()
  return w.webContents.getZoomFactor()
})

const fails = []
if (zoom !== 1) {
  // UNSCORED rather than a finding: every offset below would be measured at the
  // wrong scale, and a wrong-scale red reads exactly like a real one.
  console.log(`UNSCORED: window reports zoom ${zoom} after normalisation`)
  process.exit(1)
}

const READ = `() => {
  const q = (s) => document.querySelector(s)
  const t = q('.session-title'), c = q('.titlebar-center')
  const l = q('.titlebar-left'), r = q('.titlebar-right')
  if (!t || !c || !l || !r) return null
  const R = (el) => {
    const b = el.getBoundingClientRect()
    return { left: b.left, right: b.right, width: b.width }
  }
  const cs = getComputedStyle(t)
  return {
    page: window.innerWidth,
    title: R(t), center: R(c), left: R(l), right: R(r),
    text: t.textContent,
    docks: !!q('.titlebar-actions'),
    pills: document.querySelectorAll('.backend-pill, .perm-pill').length,
    overflowX: cs.overflowX,
    textOverflow: cs.textOverflow,
    clientWidth: t.clientWidth,
    scrollWidth: t.scrollWidth,
    // AC5. Chromium exposes the region as a computed value here; a browser that
    // did not would report undefined, which the assertion treats as unreadable
    // rather than as a violation — the source sidecar pins it either way.
    barRegion: getComputedStyle(q('.titlebar')).webkitAppRegion,
    rightRegion: getComputedStyle(r).webkitAppRegion
  }
}`

const read = () => page.evaluate((src) => eval(src)(), READ)

const setWidth = async (w) => {
  await app.evaluate(({ BrowserWindow }, size) => {
    BrowserWindow.getAllWindows()[0]?.setContentSize(size.w, size.h)
  }, { w, h: HEIGHT })
  await page.waitForTimeout(500)
}

// Removing a pill from the DOM is SYNTHETIC and is labelled so. It is still the
// right instrument for this question: the layout cannot tell why a flank box is
// narrower, and the product's own way of dropping a pill is a prop this driver
// has no route to. The honest half is the guard below — the case is only scored
// once the left group has MEASURABLY shrunk, so a React re-render that put the
// pill back reports NOT DRIVEN instead of a pass.
const dropPill = (sel) =>
  page.evaluate((s) => document.querySelector(s)?.remove(), sel).then(() => page.waitForTimeout(250))

const rows = []
const n = (v) => Number(v.toFixed(1))

// ---- stage 1: welcome — no dock toggles, so the RIGHT flank is at its narrow,
// entirely real, product state. Nothing is tampered with here.
for (const w of WIDTHS) {
  await setWidth(w)
  rows.push({ state: 'welcome', w, m: await read() })
}

// ---- stage 2: a project is open — the three dock toggles and the separator
// appear, widening the right flank by a real product state change rather than a
// synthetic one. This is AC2's primary case, and it carries the long title too.
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find(
    (b) =>
      b.getAttribute('aria-label') === 'Pick a project folder' ||
      b.textContent?.includes('Pick a project folder')
  )
  btn?.click()
})
await page.waitForTimeout(3000)

for (const w of WIDTHS) {
  await setWidth(w)
  rows.push({ state: 'project+long-title', w, m: await read() })
}

// ---- stage 3 and 4: the LEFT flank narrows, one pill at a time.
await dropPill('.perm-pill')
for (const w of WIDTHS) {
  await setWidth(w)
  rows.push({ state: 'one-pill-gone', w, m: await read() })
}
await dropPill('.backend-pill')
for (const w of WIDTHS) {
  await setWidth(w)
  rows.push({ state: 'no-pills', w, m: await read() })
}

const shot = path.join(SHOT_DIR, 'gui-136-titlebar-centre.png')
await page.screenshot({ path: shot })

console.log('=== #136 session title: midpoint against the window centre ===')
console.log(`fixture: ${LONG_DIR}`)

// Every state must be genuinely distinct, or a run in which the app never
// changed would satisfy "it centres in all four" trivially.
const seenLeft = new Map()
const seenRight = new Map()

for (const { state, w, m } of rows) {
  if (!m) {
    fails.push(`${state}@${w}: titlebar elements missing — NOT DRIVEN, not a pass`)
    continue
  }

  const mid = (m.title.left + m.title.right) / 2
  const centre = m.page / 2
  const offset = mid - centre
  const clipped = m.scrollWidth > m.clientWidth + EPS

  console.log(
    `${state.padEnd(18)} ${String(w).padStart(4)}dev → page ${n(m.page)}css | ` +
      `left ${n(m.left.width)} right ${n(m.right.width)} | ` +
      `title ${n(m.title.left)}..${n(m.title.right)} mid ${n(mid)} vs centre ${n(centre)} | ` +
      `OFFSET ${offset >= 0 ? '+' : ''}${n(offset)}${clipped ? ' (truncating)' : ''}`
  )

  // Premise guards, per state. A state that did not actually happen must not be
  // scored — silence is not a pass.
  if (state === 'welcome' && m.docks) {
    fails.push(`${state}@${w}: dock toggles present in the welcome state — NOT DRIVEN`)
    continue
  }
  if (state !== 'welcome' && !m.docks) {
    fails.push(`${state}@${w}: no dock toggles after opening a project — NOT DRIVEN`)
    continue
  }
  if (state !== 'welcome' && m.text !== LONG_NAME) {
    fails.push(
      `${state}@${w}: title reads ${JSON.stringify(m.text)}, not the ${NAME_LEN}-char fixture — NOT DRIVEN`
    )
    continue
  }
  const wantPills = { welcome: 2, 'project+long-title': 2, 'one-pill-gone': 1, 'no-pills': 0 }[state]
  if (m.pills !== wantPills) {
    fails.push(`${state}@${w}: ${m.pills} pills present, want ${wantPills} — NOT DRIVEN`)
    continue
  }

  seenLeft.set(state, m.left.width)
  seenRight.set(state, m.right.width)

  // AC1 + AC2, and the rule is split because the honest answer is.
  //
  // While the title FITS there is free space, the two flanks split it evenly,
  // and the midpoint must land on the window centre — asserted with the flank
  // widths themselves, because equal flanks are the mechanism and a centred
  // midpoint is only its symptom. Checking both means a layout that reached
  // centre some other way (an offset, a translate) still reds.
  //
  // Once the title is TRUNCATING the row is full: the flanks are down on their
  // own content and have nothing left to give, so a symmetric slot would have to
  // start inside one of them — which is exactly the overlap #72 closed. There is
  // no arrangement that is both centred and non-overlapping at that point, so
  // the assertion becomes the best achievable one and says so: the slot is
  // precisely the space BETWEEN the flanks, which forces `offset = (L-R)/2`.
  // Asserting a zero there would be asserting that the fix should overlap.
  if (!clipped) {
    const imbalance = m.left.width - m.right.width
    if (Math.abs(imbalance) > EPS) {
      fails.push(
        `${state}@${w}: flanks are unequal by ${n(imbalance)}css (left ${n(m.left.width)}, right ${n(m.right.width)}) ` +
          `while the title still fits — the slot cannot be symmetric about the window`
      )
    }
    if (Math.abs(offset) > EPS) {
      fails.push(
        `${state}@${w}: title midpoint ${n(mid)} is ${n(offset)}css off the window centre ${n(centre)} ` +
          `(left flank ${n(m.left.width)}, right flank ${n(m.right.width)})`
      )
    }
  } else {
    const forced = (m.left.width - m.right.width) / 2
    if (Math.abs(offset - forced) > EPS) {
      fails.push(
        `${state}@${w}: the row is full, so the title should fill the space between the flanks ` +
          `(offset ${n(forced)}), but its midpoint is ${n(offset)} off centre — the slot is not the maximal one`
      )
    }
  }

  // AC3 — containment. gui-72's assertion, kept because a centring fix that
  // reached true centre by leaving the flow would satisfy AC1 and reintroduce
  // the overlap #72 closed.
  if (m.title.left < m.left.right - EPS) {
    fails.push(
      `${state}@${w}: title starts at ${n(m.title.left)}, under .titlebar-left which ends at ${n(m.left.right)}`
    )
  }
  if (m.title.right > m.right.left + EPS) {
    fails.push(
      `${state}@${w}: title ends at ${n(m.title.right)}, under .titlebar-right which starts at ${n(m.right.left)}`
    )
  }
  if (m.title.left < m.center.left - EPS || m.title.right > m.center.right + EPS) {
    fails.push(
      `${state}@${w}: title ${n(m.title.left)}..${n(m.title.right)} escapes its slot ${n(m.center.left)}..${n(m.center.right)}`
    )
  }

  // AC3, the truncation half — at the 640 minimum a 60-char name cannot fit, so
  // something must clip. Without this, containment is satisfiable by a title
  // that simply overflowed invisibly.
  if (state !== 'welcome' && w === 640) {
    if (!clipped)
      fails.push(
        `${state}@${w}: ${NAME_LEN} chars cannot fit this slot yet nothing is clipped (client ${m.clientWidth}, scroll ${m.scrollWidth})`
      )
    if (m.overflowX !== 'hidden') fails.push(`${state}@${w}: overflow-x is ${m.overflowX}, so nothing clips`)
    if (m.textOverflow !== 'ellipsis')
      fails.push(`${state}@${w}: text-overflow is ${m.textOverflow}, so the clip has no ellipsis`)
  }

  // AC5 — the bar stays a drag region and the controls stay out of it. Reported
  // as unreadable rather than violated when the engine does not expose it.
  if (m.barRegion !== undefined && m.barRegion !== 'drag')
    fails.push(`${state}@${w}: .titlebar app-region is ${JSON.stringify(m.barRegion)}, want drag`)
  if (m.rightRegion !== undefined && m.rightRegion !== 'no-drag')
    fails.push(`${state}@${w}: .titlebar-right app-region is ${JSON.stringify(m.rightRegion)}, want no-drag`)
}

// The discrimination control. Four states that all centre proves the mechanism
// only if the flanks genuinely differed between them; if they did not, the run
// measured one layout four times and its agreement is worth nothing.
const rightSpread = Math.abs((seenRight.get('project+long-title') ?? 0) - (seenRight.get('welcome') ?? 0))
const leftSpread = Math.abs((seenLeft.get('no-pills') ?? 0) - (seenLeft.get('project+long-title') ?? 0))
console.log(`flank spread: right ${n(rightSpread)}css (welcome → project), left ${n(leftSpread)}css (pills → none)`)
if (rightSpread < 20)
  fails.push(
    `the right flank moved only ${n(rightSpread)}css between welcome and project — the states are not distinct, so four agreeing offsets prove nothing`
  )
if (leftSpread < 20)
  fails.push(
    `the left flank moved only ${n(leftSpread)}css when both pills went — the states are not distinct, so four agreeing offsets prove nothing`
  )

// ---- the SOURCE-level criteria --------------------------------------------
// The mechanism's preconditions, read out of `titlebar.css` as text. They live
// in `gui-136.source.mjs` because `tests/gui-source-assertions.test.ts` runs
// that array in the gate (#132); this loop drives the SAME array, so there is
// one definition and the gated copy cannot drift from the driven one.
console.log('--- source-level (also run by `npm test`) ---')
for (const c of sourceChecks) {
  const { ok, detail } = c.run()
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${c.name} ${JSON.stringify(detail)}`)
  if (!ok) fails.push(`${c.name}: ${JSON.stringify(detail)}`)
}

console.log(`screenshot: ${shot}`)
console.log(fails.length === 0 ? 'PASS' : 'FAIL: ' + fails.join(' | '))

setTimeout(() => process.exit(fails.length === 0 ? 0 : 1), 4000).unref?.()
await app.close().catch(() => {})
// Best-effort, and only after the app is down: the engine holds the fixture as
// its cwd, so an EBUSY here is ordinary and must never decide the verdict.
for (const dir of [path.dirname(LONG_DIR)]) {
  try {
    fs.rmSync(dir, { recursive: true, force: true })
  } catch {
    console.log(`(left behind: ${dir})`)
  }
}
process.exit(fails.length === 0 ? 0 : 1)
