// GUI pin for gauntlet wave 3 — the three surfaces that wave changed, each
// measured as a RENDERED box in a real Chromium.
//
//   node .claude/skills/run-desktop/gui-gauntlet-wave3.mjs
//
// Needs `npm run build` first, plus playwright-core. Costs NO CLI turns.
//
// ── why this file exists at all ───────────────────────────────────────────
// The fast gate loads no CSS. `npm test` runs vitest under jsdom, where no
// element has a height, `text-wrap: balance` is inert and a `max-width` changes
// nothing. Every claim wave 3 makes is a claim about a box, and a box is only
// visible to a driver. This is that driver. It sits beside
// `gui-gauntlet-wave2.mjs` rather than extending it, because that file's
// measurements are taken with the sessions rail collapsed and a folder open,
// and one of wave 3's three claims is about the Welcome screen, which only
// exists BEFORE a folder is picked.
//
// ── the three changes, and what each one is pinned by ─────────────────────
//   AgentsDock       the head's three buttons were two shapes — a 22px/5px
//                    radius mode pair beside a 28px/6px close. All three now
//                    wear `.sidebar-toggle`, the app's one icon-button housing.
//                    Pinned by A1/A2.
//   AppearanceDock   a shared selection mark now marks the chosen option in
//                    BOTH Theme and Backdrop. The slot is reserved on every
//                    option; the glyph is drawn only on the selected one.
//                    Pinned by B1/B2/B3.
//   Welcome          the supporting line became a measured two-line deck
//                    (`max-width: 480px` + `text-wrap: balance` + centred), and
//                    the action's gap came down 40 → 24. Pinned by W1/W2/W3.
//
// ── how "the old value" is obtained, since a driver cannot git-stash ──────
// Every check states the value the PREVIOUS build produced, and none of those
// numbers is remembered. Each is RECONSTRUCTED live, in the same window, in the
// same layout pass, by mutating the one declaration the wave added and reading
// the box back:
//
//   the shared housing    → the two mode buttons are forced back to the 22x22
//                           box and 5px radius they carried before
//   the reserved slot     → the mark slot is set to `display: none`, which is
//                           the pre-wave DOM shape (no slot at all)
//   the deck's measure    → `max-width: none`, which is what the rule said
//                           before, and the copy returns to a single line
//   the action's gap      → `margin-top: 40px`
//
// The inline style is cleared again before each evaluate returns. This is
// gui-94's and wave 2's idiom — build the expectation from the engine rather
// than from a remembered pixel count — and it is what makes each check
// FALSIFIABLE on purpose: the reconstruction is printed beside the measurement,
// so a reader can see the gap the check discriminates against.
//
// ── what this driver does NOT claim ───────────────────────────────────────
// 1. It does not measure the minimum-window headroom. That claim needs the
//    window at its enforced minimum, and resizing mid-run would revoke every
//    other box here (#77). `inspect.mjs` pins it instead, first-hand, and
//    reported `{"measured":53.71,"claimed":54,"content":264.69,"overflow":0}`
//    for this wave. Two instruments, split the same way wave 2 split them.
// 2. The agent rows are untouched by wave 3 and are not re-pinned here;
//    `gui-gauntlet-wave2.mjs` still owns the two-line clamp.
// 3. Nothing here is a claim about colour or material. No driver can see a DWM
//    backdrop.

import { _electron as electron } from 'playwright-core'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import { profileArgs } from './driver-profile.mjs'

const APP_DIR = path.resolve(import.meta.dirname, '../../..')
const SHOT_DIR = process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')
fs.mkdirSync(SHOT_DIR, { recursive: true })
const PICK_DIR = APP_DIR

const fails = []
const check = (label, ok, detail) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ${JSON.stringify(detail)}`)
  if (!ok) fails.push(label)
}
const px = (n) => (typeof n === 'number' ? Math.round(n * 1000) / 1000 : n)

setTimeout(() => {
  console.log('TIMEOUT')
  process.exit(1)
}, 240000).unref?.()

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
}, PICK_DIR)

const page = await app.firstWindow()
await page.waitForSelector('[aria-label="Backend mode"]', { timeout: 15000 })

// Zoom first, before a single box is read. Chromium persists a zoom factor per
// origin inside `userData` and the renderer mirrors it in localStorage, so every
// figure below would be silently scaled otherwise. Both halves are pinned, the
// way gui-136 does it, because either one alone can put the factor back.
await page.evaluate(() => window.localStorage.setItem('zoom-level-v2', '1'))
await page.reload()
await page.waitForLoadState('domcontentloaded')
await page.waitForSelector('[aria-label="Backend mode"]', { timeout: 20000 })
const zoom = await app.evaluate(({ BrowserWindow }) => {
  const w = BrowserWindow.getAllWindows()[0]
  w.webContents.setZoomFactor(1)
  return w.webContents.getZoomFactor()
})
check('premise: zoom factor is 1, so every px below is a css px', zoom === 1, { zoom })

const clickBySel = (sel) => page.evaluate((s) => document.querySelector(s)?.click(), sel)

const shotEl = async (name, sel) => {
  const p = path.join(SHOT_DIR, `gauntlet-wave3-${name}.png`)
  const el = await page.$(sel)
  if (el === null) {
    console.log(`SHOT ${name} SKIPPED — no ${sel}`)
    return
  }
  await el.screenshot({ path: p })
  console.log(`SHOT ${p}`)
}

// ══ Welcome ═══════════════════════════════════════════════════════════════
// MEASURED FIRST, and the order is load-bearing: this surface only exists
// before a folder is picked, and every dock below needs one open.
await page.waitForSelector('.welcome-hint', { timeout: 10000 })
await shotEl('welcome', '.welcome')

const W = await page.evaluate(() => {
  const hint = document.querySelector('.welcome-hint')
  const btn = document.querySelector('.pick-folder-btn')
  const title = document.querySelector('.welcome-title') || document.querySelector('h1')
  if (!hint || !btn) return null

  // A line count that does not depend on parsing text: the number of client
  // rects a Range over the element's contents produces is the number of line
  // boxes the engine actually laid out.
  const lineCount = (el) => {
    const r = document.createRange()
    r.selectNodeContents(el)
    return r.getClientRects().length
  }

  const cs = getComputedStyle(hint)
  const now = {
    lines: lineCount(hint),
    maxWidth: cs.maxWidth,
    textAlign: cs.textAlign,
    textWrap: cs.textWrap || cs.textWrapStyle || '',
    widthPx: hint.getBoundingClientRect().width,
    hintBottom: hint.getBoundingClientRect().bottom,
    btnTop: btn.getBoundingClientRect().top,
    titleBottom: title ? title.getBoundingClientRect().bottom : null,
    hintTop: hint.getBoundingClientRect().top
  }
  now.deckToAction = now.btnTop - now.hintBottom
  now.headlineToDeck = now.titleBottom === null ? null : now.hintTop - now.titleBottom

  // ---- reconstruct the pre-wave measure: no max-width ----
  const prevMax = hint.style.maxWidth
  hint.style.maxWidth = 'none'
  void hint.offsetHeight
  const beforeMeasure = { lines: lineCount(hint), widthPx: hint.getBoundingClientRect().width }
  hint.style.maxWidth = prevMax

  // ---- reconstruct the pre-wave action gap: 40px ----
  const prevMt = btn.style.marginTop
  btn.style.marginTop = '40px'
  void btn.offsetHeight
  const beforeGap = {
    deckToAction: btn.getBoundingClientRect().top - hint.getBoundingClientRect().bottom
  }
  btn.style.marginTop = prevMt
  void btn.offsetHeight

  return { now, beforeMeasure, beforeGap }
})

if (W === null) {
  check('W0 the welcome surface was reachable', false, { reason: 'no .welcome-hint / .pick-folder-btn' })
} else {
  // W1 — the deck is TWO line boxes, and the measure is what makes it two.
  // Reconstructed old: with `max-width: none` the copy returns to one line at
  // this pane width, which is exactly the state the previous build shipped.
  check('W1 the supporting line lays out as a two-line deck', W.now.lines === 2, {
    lines: W.now.lines,
    widthPx: px(W.now.widthPx),
    oldReconstructed: { maxWidth: 'none', lines: W.beforeMeasure.lines, widthPx: px(W.beforeMeasure.widthPx) },
    threshold: 'exactly 2 line boxes'
  })

  // W2 — the measure is a real 480px cap that BINDS. A rule that never binds is
  // not a composition, which is the argument two earlier waves used to decline
  // one; this check is what makes the claim that it now binds falsifiable.
  check(
    'W2 the 480px measure binds (it is narrower than the unconstrained line)',
    W.now.maxWidth === '480px' && W.beforeMeasure.widthPx > W.now.widthPx,
    {
      maxWidth: W.now.maxWidth,
      constrainedWidthPx: px(W.now.widthPx),
      oldReconstructed: { unconstrainedWidthPx: px(W.beforeMeasure.widthPx) },
      textAlign: W.now.textAlign
    }
  )

  // W3 — the action was pulled INTO the lockup. The gap is the measured box
  // gap, not the optical one; the optical arithmetic lives in chat.css's own
  // comment and is not something a driver can read.
  check('W3 the action sits closer to the deck than it did', W.now.deckToAction < W.beforeGap.deckToAction, {
    deckToActionPx: px(W.now.deckToAction),
    oldReconstructed: { marginTop: '40px', deckToActionPx: px(W.beforeGap.deckToAction) },
    headlineToDeckPx: px(W.now.headlineToDeck),
    threshold: 'the 24px rule must measure closer than the 40px it replaced'
  })
}

// ── open a workspace ───────────────────────────────────────────────────────
// DOM-dispatched, never a Playwright click: the actionability wait hangs on this
// app's intro animation. All three docks are folder-gated.
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find(
    (b) =>
      b.getAttribute('aria-label') === 'Pick a project folder' ||
      b.textContent?.includes('Pick a project folder')
  )
  btn?.click()
})
await page.waitForSelector('.session-group-head', { timeout: 20000 })
await page.waitForSelector('[aria-label="Agents panel"]', { timeout: 10000 })

// Collapse the sessions rail — frees ~310css and brings the dock inside the
// frame at the app's own persisted bounds. Layout only.
await clickBySel('[aria-label="Collapse sessions"]')
await page.waitForTimeout(300)

// ══ AgentsDock ════════════════════════════════════════════════════════════
await clickBySel('[aria-label="Agents panel"]')
await page.waitForSelector('.agents-dock', { timeout: 10000 })
await shotEl('agents-head', '.agents-dock-head')

const A = await page.evaluate(() => {
  const head = document.querySelector('.agents-dock-head')
  if (!head) return null
  const btns = [...head.querySelectorAll('button')]
  const boxOf = (b) => {
    const r = b.getBoundingClientRect()
    const cs = getComputedStyle(b)
    return {
      label: b.getAttribute('aria-label'),
      w: r.width,
      h: r.height,
      radius: cs.borderTopLeftRadius
    }
  }
  const now = btns.map(boxOf)

  // ---- reconstruct the pre-wave pair: 22x22 box, 5px radius ----
  const modes = [...head.querySelectorAll('.agents-dock-mode')]
  const saved = modes.map((m) => m.getAttribute('style') || '')
  for (const m of modes) {
    m.style.width = '22px'
    m.style.height = '22px'
    m.style.borderRadius = '5px'
  }
  void head.offsetHeight
  const before = [...head.querySelectorAll('button')].map(boxOf)
  modes.forEach((m, i) => m.setAttribute('style', saved[i]))
  void head.offsetHeight

  return { now, before, modeCount: modes.length }
})

if (A === null) {
  check('A0 the agents dock head was reachable', false, { reason: 'no .agents-dock-head' })
} else {
  const uniform = (rows) =>
    rows.length > 1 &&
    rows.every((r) => Math.abs(r.w - rows[0].w) < 0.5 && Math.abs(r.h - rows[0].h) < 0.5 && r.radius === rows[0].radius)

  // A1 — all three head buttons are now ONE housing: same box, same radius.
  // Reconstructed old: forcing the mode pair back to 22x22/5px breaks it, which
  // is precisely the state the previous build shipped.
  check('A1 every head button shares one hit area and one radius', uniform(A.now), {
    buttons: A.now.map((b) => ({ label: b.label, w: px(b.w), h: px(b.h), radius: b.radius })),
    oldReconstructed: {
      note: 'mode pair forced back to 22x22 / 5px',
      uniform: uniform(A.before),
      buttons: A.before.map((b) => ({ label: b.label, w: px(b.w), h: px(b.h), radius: b.radius }))
    }
  })

  // A2 — the check above is only worth something if the reconstruction really
  // does break uniformity. A guard that cannot red is measuring nothing.
  check('A2 the reconstruction discriminates (the old geometry is NOT uniform)', !uniform(A.before), {
    oldUniform: uniform(A.before),
    modeButtonsFound: A.modeCount
  })
}

// ══ AppearanceDock ════════════════════════════════════════════════════════
await clickBySel('[aria-label="Appearance panel"]')
await page.waitForSelector('.appearance-dock', { timeout: 10000 })
await shotEl('appearance', '.appearance-dock')

const B = await page.evaluate(() => {
  const dock = document.querySelector('.appearance-dock')
  if (!dock) return null
  const options = [...dock.querySelectorAll('.appearance-choice')]
  const marks = [...dock.querySelectorAll('.appearance-choice-mark')]
  const lit = marks.filter((m) => m.querySelector('svg') !== null)

  const selected = options.filter(
    (o) => o.getAttribute('aria-checked') === 'true' || o.getAttribute('aria-selected') === 'true'
  )

  // Both controls must carry the treatment, or it is one control's affordance
  // rather than a family. Theme options are the ones carrying a swatch.
  const themeOptions = options.filter((o) => o.querySelector('.appearance-swatch') !== null)
  const cardOptions = options.filter((o) => o.querySelector('.appearance-choice-desc') !== null)
  const litIn = (set) => set.filter((o) => o.querySelector('.appearance-choice-mark svg') !== null).length
  const slotIn = (set) => set.filter((o) => o.querySelector('.appearance-choice-mark') !== null).length

  const markBox = marks.length
    ? (() => {
        const r = marks[0].getBoundingClientRect()
        return { w: r.width, h: r.height }
      })()
    : null

  // ---- reconstruct the pre-wave shape: no slot at all ----
  const saved = marks.map((m) => m.getAttribute('style') || '')
  for (const m of marks) m.style.display = 'none'
  void dock.offsetHeight
  const beforeNameRight = (() => {
    const n = dock.querySelector('.appearance-choice-name')
    return n ? n.getBoundingClientRect().right : null
  })()
  marks.forEach((m, i) => m.setAttribute('style', saved[i]))
  void dock.offsetHeight
  const nowNameRight = (() => {
    const n = dock.querySelector('.appearance-choice-name')
    return n ? n.getBoundingClientRect().right : null
  })()

  return {
    options: options.length,
    slots: marks.length,
    lit: lit.length,
    selected: selected.length,
    themeOptions: themeOptions.length,
    cardOptions: cardOptions.length,
    litInTheme: litIn(themeOptions),
    litInCards: litIn(cardOptions),
    slotInTheme: slotIn(themeOptions),
    slotInCards: slotIn(cardOptions),
    markBox,
    beforeNameRight,
    nowNameRight
  }
})

if (B === null) {
  check('B0 the appearance dock was reachable', false, { reason: 'no .appearance-dock' })
} else {
  // B1 — the SLOT is on every option, the GLYPH only on the selected one. This
  // is the non-obvious half: a naive build either draws a mark on every row
  // (lit === options) or omits the slot on unselected rows (slots === lit).
  // Both are distinguishable from the shipped behaviour by these two numbers.
  check('B1 a mark slot is reserved on every option, lit only on the selected', B.slots === B.options && B.lit === B.selected && B.lit > 0, {
    options: B.options,
    slotsReserved: B.slots,
    glyphsDrawn: B.lit,
    selectedOptions: B.selected,
    threshold: 'slots === options AND glyphs === selected'
  })

  // B2 — the treatment spans BOTH controls. One control alone is an affordance;
  // two is the control family the gap asked for.
  check('B2 both Theme and Backdrop carry the treatment', B.slotInTheme === B.themeOptions && B.slotInCards === B.cardOptions && B.litInTheme === 1 && B.litInCards === 1, {
    theme: { options: B.themeOptions, slots: B.slotInTheme, lit: B.litInTheme },
    backdrop: { options: B.cardOptions, slots: B.slotInCards, lit: B.litInCards }
  })

  // B3 — the slot really does hold space. Reconstructed old: with the slot
  // display:none the name's right edge moves, which is what proves the reserved
  // column is load-bearing rather than decorative.
  check('B3 the reserved slot occupies real width', B.markBox !== null && B.markBox.w > 0 && B.beforeNameRight !== null && Math.abs(B.nowNameRight - B.beforeNameRight) > 0.5, {
    markBoxPx: B.markBox ? { w: px(B.markBox.w), h: px(B.markBox.h) } : null,
    nameRightNow: px(B.nowNameRight),
    oldReconstructed: { slotHidden: true, nameRight: px(B.beforeNameRight) }
  })
}

// ── report ────────────────────────────────────────────────────────────────
console.log('')
console.log('=== gauntlet wave 3 — Welcome + two docks, measured in a real Chromium ===')
console.log(`shots: ${SHOT_DIR}`)
console.log('')
console.log('NOT PINNED HERE: the minimum-window headroom. That needs the window at its')
console.log('  enforced minimum and resizing would revoke every box above (#77).')
console.log('  inspect.mjs pins it: {"measured":53.71,"claimed":54,"content":264.69,"overflow":0}')
console.log('NOT PINNED HERE: CommandsDock, which wave 3 deliberately did not build.')
console.log('')
console.log(fails.length === 0 ? 'ALL GREEN' : `RED: ${fails.join(' | ')}`)

await app.close().catch(() => {})
process.exit(fails.length === 0 ? 0 : 1)
