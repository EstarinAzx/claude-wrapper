// GUI pin for gauntlet wave 6 — the four builds that wave landed, each measured
// as a RENDERED box, line count or drawn glyph extent in a real Chromium.
//
//   node .claude/skills/run-desktop/gui-gauntlet-wave6.mjs
//
// Needs `npm run build` first, plus playwright-core. Costs NO CLI turns.
//
// ── why this file exists at all ───────────────────────────────────────────
// The fast gate loads no CSS. `npm test` runs vitest under jsdom, where no
// element has a height, a box-shadow resolves to nothing measurable, and an SVG
// has no geometry because there is no layout. Every claim wave 6 makes is a claim
// about a box, an interval or a glyph's drawn extent, and jsdom can see none of
// the three. This is that driver. It sits beside wave2/3/4/5 rather than
// extending them, for the reason wave 3 first gave: each file's measurements are
// taken in its own layout state.
//
// ── the four changes, and what each is pinned by ──────────────────────────
//   WelcomeMinWindow  the stack went 16/8/32 -> 8/8/32: the mark closes into the
//                     editorial block and the action stands off as a final beat.
//                     Pinned by W1..W2. W2 is the one that proves it cost no
//                     height.
//   AgentsDock        the two view controls became a bound two-segment switch and
//                     the close was isolated, so the head stopped reading as one
//                     undifferentiated icon run. Pinned by A1..A3.
//   CommandsDock      every command row gained a resting 1px inset shell, so the
//                     list reads as a picker rather than as documentation.
//                     Pinned by C1..C2. C2 is the one that proves it is paint
//                     rather than layout.
//   AppearanceDock    the icon-label-hairline section header lost its hairline and
//                     became spacing-led, and the three section marks were cut up
//                     to the housing's optical extent. Pinned by B1..B3.
//
// ── the check that carries a superseded wave-4 pin forward ────────────────
// `gui-gauntlet-wave4.mjs` B3 asserted "each section carries a 12px mark +
// micro-caps label + rule" and required `headParts.rule.width > 0`. Wave 6
// deliberately deleted that hairline, which is the whole of its DocksAsOne gap,
// so exactly that clause is now unsatisfiable by any honest edit.
//
//   B3  ->  B1   B3 asserted the hairline EXISTS. B1 asserts it is GONE, that
//                all three heads survive without it, and — the part B3 never
//                covered — that the separation it used to draw is now carried by
//                spacing that actually out-ranks the interval inside the group.
//                That second half is B2.
//
// B3's other clauses are NOT retired and are not softened: headCount === 3, the
// 12x12 mark box and the label's four micro-caps values all still hold and are
// re-asserted here. Only the hairline clause is superseded. Retiring a pin
// because a later wave reversed the design it pinned is legitimate; loosening one
// to clear a red is not.
//
// ── how "the old value" is obtained, since a driver cannot git-stash ──────
// Each check that can be RECONSTRUCTED states the value the previous build
// produced, measured live in the same window and the same layout pass by mutating
// the one declaration the wave added and reading the box back. The inline style is
// cleared again before the evaluate returns. This is waves 2-5's idiom and it is
// what makes a check falsifiable on purpose.
//
// ── two traps this file is written against, both paid for already ─────────
// A CHECK THAT CANNOT FAIL IS WORSE THAN NO CHECK. Wave 4's W3 compared two
// detached probes and measured whether a font was INSTALLED rather than whether
// an element wore it. Wave 5's W6 asked whether an interval "no longer ranks
// first" when the pre-wave stack was a TIE, so reverting the declaration it
// pinned left it green. W1 below therefore asserts a STRICT margin in both
// directions, and every reconstruction here was run and confirmed to red the
// check it belongs to.
//
// MEASURE THE PREMISE, NOT A PROXY FOR IT. Wave 4's B5 pinned a 193px column in
// order to protect a two-line deck, and was green for three waves while the deck
// was actually three lines. B2 below measures the two intervals it is named
// after, in the layout that draws them.
import { _electron as electron } from 'playwright-core'
import path from 'node:path'
import os from 'node:os'
import { profileArgs } from './driver-profile.mjs'

const APP_DIR = path.resolve(import.meta.dirname, '../../..')
const PICK_DIR = APP_DIR

const fails = []
const check = (label, ok, detail) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ${JSON.stringify(detail)}`)
  if (!ok) fails.push(label)
}
const px = (n) => (typeof n === 'number' ? Math.round(n * 1000) / 1000 : n)
const near = (a, b, tol = 0.5) => typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) <= tol

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

// The command rows are FIXTURE-FED and that is stated rather than hidden.
// `.command-row-btn` renders from whatever `commands:list` returns and main owns
// that answer; with no CLI engine behind the driver the honest answer is an EMPTY
// LIST, and C1/C2 would go vacuously green against a dock with no rows in it.
// This installs the same fixture `inspect.mjs` installs, at the same boundary, so
// the rows measured here are the rows photographed in the wave capture.
// `removeHandler` first because `ipcMain.handle` throws on a second registration
// for one channel rather than replacing it.
const COMMANDS = [
  { name: 'preset', description: 'Load a named instruction block instead of retyping it', argumentHint: '<name>' },
  { name: 'trace', description: 'Follow one flow end to end across every file it touches', argumentHint: '<flow>' },
  { name: 'review', description: 'Fresh eyes over the working diff, findings only', argumentHint: '' },
  { name: 'context-update', description: 'Refresh the handoff notes for the next session', argumentHint: '' },
  { name: 'llm-kb', description: 'Ingest a source into the topic vault, or query it', argumentHint: 'ingest|query' },
  { name: 'wrap-up', description: '', argumentHint: '' },
  { name: 'hp', description: 'Map the golden path before any code exists', argumentHint: '' }
]
await app.evaluate(({ ipcMain }, commands) => {
  ipcMain.removeHandler('commands:list')
  ipcMain.handle('commands:list', async () => commands)
}, COMMANDS)

const page = await app.firstWindow()
await page.waitForSelector('[aria-label="Backend mode"]', { timeout: 15000 })

// Zoom first, before a single box is read — Chromium persists a zoom factor per
// origin inside `userData` and the renderer mirrors it in localStorage, so every
// figure below would be silently scaled otherwise.
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

// Shared with wave 5 verbatim: a glyph's DRAWN extent, stroke included, in
// viewBox units. A 12 viewBox painted at 12px makes a unit a pixel.
const EXTENT_FN = `
  (svg) => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const el of svg.querySelectorAll('path,line,polyline,polygon,rect,circle,ellipse')) {
      let b
      try { b = el.getBBox() } catch { continue }
      if (!b || (b.width === 0 && b.height === 0)) continue
      const cs = getComputedStyle(el)
      const strokeNone = el.getAttribute('stroke') === 'none' || cs.stroke === 'none'
      const sw = strokeNone ? 0 : parseFloat(el.getAttribute('stroke-width') || cs.strokeWidth || '0') || 0
      minX = Math.min(minX, b.x - sw / 2)
      minY = Math.min(minY, b.y - sw / 2)
      maxX = Math.max(maxX, b.x + b.width + sw / 2)
      maxY = Math.max(maxY, b.y + b.height + sw / 2)
    }
    if (!isFinite(minX)) return null
    return {
      w: Math.round((maxX - minX) * 1000) / 1000,
      h: Math.round((maxY - minY) * 1000) / 1000,
      minInk: Math.round(Math.min(minX, minY) * 1000) / 1000,
      maxInk: Math.round(Math.max(maxX, maxY) * 1000) / 1000
    }
  }
`

// ══ Welcome ═══════════════════════════════════════════════════════════════
// MEASURED FIRST and the order is load-bearing: this surface stops existing the
// moment a folder is picked.
await page.waitForSelector('.welcome-title', { timeout: 10000 })

const W = await page.evaluate(() => {
  const mark = document.querySelector('.welcome-mark')
  const title = document.querySelector('.welcome-title')
  const hint = document.querySelector('.welcome-hint')
  const btn = [...document.querySelectorAll('button')].find((b) =>
    /pick a project folder/i.test(b.textContent || '')
  )
  if (!mark || !title || !hint || !btn) return null
  const gaps = () => {
    const m = mark.getBoundingClientRect()
    const t = title.getBoundingClientRect()
    const h = hint.getBoundingClientRect()
    const b = btn.getBoundingClientRect()
    return {
      markToTitle: t.top - m.bottom,
      titleToHint: h.top - t.bottom,
      hintToAction: b.top - h.bottom,
      stackHeight: b.bottom - m.top
    }
  }
  const now = gaps()
  // Reconstruct the wave-5 stack: the mark's interval back to 16 and the
  // action's back to 24. Both are inline, both are cleared before returning.
  const markSaved = mark.style.marginBottom
  const btnSaved = btn.style.marginTop
  mark.style.marginBottom = '16px'
  btn.style.marginTop = '24px'
  void document.body.offsetHeight
  const before = gaps()
  mark.style.marginBottom = markSaved
  btn.style.marginTop = btnSaved
  void document.body.offsetHeight
  const restored = gaps()
  return { now, before, restored }
})

// W1 — THE COMPOSITION CLAIM, ASSERTED WITH A STRICT MARGIN IN BOTH DIRECTIONS.
//
// The claim is not "the last gap is biggest" — that was ALREADY TRUE at wave 5
// (16/8/24), so a check phrased that way would have been green before the wave
// ran, which is wave 5's W6 defect exactly. The claim is that the mark now joins
// the editorial block: the first two intervals close to within 4px of each other,
// AND the action's interval clears the larger of them by at least 16px.
//
// wave 5  16 / 8 / 24  ->  |16-8| = 8, fails clause 1; 24-16 = 8, fails clause 2
// wave 6   8 / 8 / 32  ->  |8-8|  = 0, clears;         32-8  = 24, clears
//
// Both clauses discriminate, so reverting EITHER declaration reds this check.
{
  const n = W?.now
  const b = W?.before
  const lockup = n ? Math.abs(n.markToTitle - n.titleToHint) : null
  const beat = n ? n.hintToAction - Math.max(n.markToTitle, n.titleToHint) : null
  const oldLockup = b ? Math.abs(b.markToTitle - b.titleToHint) : null
  const oldBeat = b ? b.hintToAction - Math.max(b.markToTitle, b.titleToHint) : null
  check(
    'W1 the mark joins the editorial lockup and the action stands off as a final beat',
    n !== undefined && n !== null && lockup <= 4 && beat >= 16,
    {
      nowGaps: n ? [px(n.markToTitle), px(n.titleToHint), px(n.hintToAction)] : null,
      lockupSpread: px(lockup),
      beatMargin: px(beat),
      reconstructedGaps: b ? [px(b.markToTitle), px(b.titleToHint), px(b.hintToAction)] : null,
      reconstructedLockupSpread: px(oldLockup),
      reconstructedBeatMargin: px(oldBeat),
      reconstructionWouldFail: oldLockup > 4 || oldBeat < 16
    }
  )
}

// W2 — AND IT COST NOTHING. The 8px taken off the mark went to the action, so the
// reconstruction is the SAME TOTAL HEIGHT. This is the check that makes the
// builder's net-zero claim falsifiable rather than asserted: if a later edit pays
// for this composition in height, the pane's headroom is what absorbs it.
check(
  'W2 the new stack is exactly as tall as the one it replaced',
  near(W?.now?.stackHeight, W?.before?.stackHeight, 0.5) && near(W?.now?.stackHeight, W?.restored?.stackHeight, 0.01),
  {
    nowHeight: px(W?.now?.stackHeight),
    reconstructedHeight: px(W?.before?.stackHeight),
    restoredHeight: px(W?.restored?.stackHeight),
    note: 'restored must equal now to the hundredth, or the reconstruction leaked'
  }
)

// ══ open a project, then the docks ════════════════════════════════════════
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) =>
    /pick a project folder/i.test(b.textContent || '')
  )
  btn?.click()
})
await page.waitForSelector('.session-group-head', { timeout: 20000 })
await page.waitForSelector('[aria-label="Agents panel"]', { timeout: 10000 })

// ══ CommandsDock ══════════════════════════════════════════════════════════
await clickBySel('[aria-label="Commands panel"]')
await page.waitForSelector('.command-row-btn', { timeout: 10000 }).catch(() => {})

const C = await page.evaluate(() => {
  const rows = [...document.querySelectorAll('.command-row-btn')]
  if (rows.length === 0) return null
  const shadowOf = (el) => getComputedStyle(el).boxShadow
  const withShell = rows.filter((r) => {
    const s = shadowOf(r)
    return s && s !== 'none' && /inset/.test(s)
  }).length
  const first = rows[0]
  const widthNow = first.clientWidth
  const heightsNow = rows.map((r) => Math.round(r.getBoundingClientRect().height * 1000) / 1000)
  // Reconstruct the pre-wave rows: strip the resting shell from every row.
  const saved = rows.map((r) => r.style.boxShadow)
  for (const r of rows) r.style.boxShadow = 'none'
  void document.body.offsetHeight
  const withShellBefore = rows.filter((r) => {
    const s = shadowOf(r)
    return s && s !== 'none' && /inset/.test(s)
  }).length
  const widthBefore = first.clientWidth
  const heightsBefore = rows.map((r) => Math.round(r.getBoundingClientRect().height * 1000) / 1000)
  rows.forEach((r, i) => { r.style.boxShadow = saved[i] })
  void document.body.offsetHeight
  return {
    rowCount: rows.length,
    withShell,
    withShellBefore,
    widthNow,
    widthBefore,
    heightsNow,
    heightsBefore,
    sample: shadowOf(first),
    textColumn: first.clientWidth - 20,
    bareRows: rows.filter((r) => r.querySelector('.command-row-desc') === null).length
  }
})

// C1 — EVERY row carries the resting shell, not most of them. The gap asked for
// ONE CONSISTENT full-width treatment, and the fixture deliberately covers four
// different row shapes including a descriptionless one, so "all of them" is the
// whole claim. The reconstruction strips the shadow and must take the count to 0.
check(
  'C1 every command row carries a resting inset shell, and stripping it reds this',
  C !== null && C.rowCount >= 4 && C.withShell === C.rowCount && C.withShellBefore === 0 && C.bareRows >= 1,
  {
    rowCount: C?.rowCount,
    withShell: C?.withShell,
    reconstructedWithShell: C?.withShellBefore,
    descriptionlessRowsCovered: C?.bareRows,
    computed: C?.sample
  }
)

// C2 — AND IT IS PAINT, NOT LAYOUT. A real 1px border would have held the band at
// 235 and pulled the content box to 233, putting this dock's text column 2px off
// the other two and reding G1 for a column that never moved. A painted inset
// shadow is not laid out at all: same width, same heights, with and without.
check(
  'C2 the shell changes no box — same width and same row heights with it stripped',
  C !== null &&
    C.widthNow === C.widthBefore &&
    C.heightsNow.length === C.heightsBefore.length &&
    C.heightsNow.every((h, i) => near(h, C.heightsBefore[i], 0.01)),
  {
    clientWidthNow: C?.widthNow,
    clientWidthStripped: C?.widthBefore,
    textColumn: C?.textColumn,
    heightsMatch: C ? C.heightsNow.every((h, i) => near(h, C.heightsBefore[i], 0.01)) : null,
    note: 'a border here would read 233 and red G1 for a text column that did not move'
  }
)

// ══ AppearanceDock ════════════════════════════════════════════════════════
await clickBySel('[aria-label="Appearance panel"]')
await page.waitForSelector('.appearance-dock', { timeout: 10000 })

const B = await page.evaluate((extentSrc) => {
  const extent = eval(extentSrc)
  const heads = [...document.querySelectorAll('.appearance-head')]
  const fields = [...document.querySelectorAll('.appearance-field')]
  const body = document.querySelector('.appearance-body')
  if (heads.length === 0 || fields.length < 2 || !body) return null

  const marks = heads.map((h) => {
    const svg = h.querySelector('.appearance-head-mark svg') || h.querySelector('svg')
    const box = h.querySelector('.appearance-head-mark')
    return {
      label: (h.querySelector('.appearance-label')?.textContent || '').trim(),
      boxW: box ? Math.round(box.getBoundingClientRect().width * 1000) / 1000 : null,
      boxH: box ? Math.round(box.getBoundingClientRect().height * 1000) / 1000 : null,
      viewBox: svg ? svg.getAttribute('viewBox') : null,
      extent: svg ? extent(svg) : null
    }
  })

  const labelEl = heads[0].querySelector('.appearance-label')
  const ls = labelEl ? getComputedStyle(labelEl) : null

  // The spacing ladder, measured on the SECOND field — the first has nothing
  // above it, so the interval the header is supposed to out-rank does not exist
  // there. Box-to-box on both sides of one header, in one layout pass.
  const measureLadder = () => {
    const f0 = fields[0]
    const f1 = fields[1]
    const head1 = f1.querySelector('.appearance-head')
    const f0Kids = [...f0.children]
    const lastOfF0 = f0Kids[f0Kids.length - 1]
    const f1Kids = [...f1.children]
    const firstAfterHead = f1Kids.find((el) => !el.classList.contains('appearance-head'))
    if (!head1 || !lastOfF0 || !firstAfterHead) return null
    return {
      above: head1.getBoundingClientRect().top - lastOfF0.getBoundingClientRect().bottom,
      below: firstAfterHead.getBoundingClientRect().top - head1.getBoundingClientRect().bottom
    }
  }
  const ladderNow = measureLadder()

  // Reconstruct the wave-5 ladder: body gap back to 16, field gap back to 8.
  const bodySaved = body.style.rowGap
  const fieldSaved = fields.map((f) => f.style.rowGap)
  body.style.rowGap = '16px'
  for (const f of fields) f.style.rowGap = '8px'
  void document.body.offsetHeight
  const ladderBefore = measureLadder()
  body.style.rowGap = bodySaved
  fields.forEach((f, i) => { f.style.rowGap = fieldSaved[i] })
  void document.body.offsetHeight
  const ladderRestored = measureLadder()

  // Reconstruct the wave-5 Theme mark: its ring radius went 4 -> 4.5, and that
  // one attribute is the whole of that glyph's cut. Putting it back must drop the
  // extent off 10.4, which is what makes B3 falsifiable rather than absolute.
  const themeSvg = heads[0].querySelector('.appearance-head-mark svg')
  const ring = themeSvg ? themeSvg.querySelector('circle[r]') : null
  let themeExtentBefore = null
  if (ring) {
    const rSaved = ring.getAttribute('r')
    ring.setAttribute('r', '4')
    void document.body.offsetHeight
    themeExtentBefore = extent(themeSvg)
    ring.setAttribute('r', rSaved)
    void document.body.offsetHeight
  }

  return {
    headCount: heads.length,
    ruleCount: document.querySelectorAll('.appearance-rule').length,
    marks,
    label: ls
      ? {
          fontSize: ls.fontSize,
          fontWeight: ls.fontWeight,
          textTransform: ls.textTransform,
          letterSpacing: ls.letterSpacing
        }
      : null,
    ladderNow,
    ladderBefore,
    ladderRestored,
    themeExtentBefore,
    choiceTextColumn: (() => {
      const c = document.querySelector('.appearance-choice')
      return c ? c.clientWidth - 20 : null
    })()
  }
}, EXTENT_FN)

// B1 — SUPERSEDES gui-gauntlet-wave4.mjs B3. That check required the hairline to
// EXIST; this wave deleted it deliberately, which is the whole of the DocksAsOne
// gap. Every OTHER clause of B3 is re-asserted here rather than dropped: three
// heads, a 12x12 mark box, and the label's four micro-caps values.
check(
  'B1 the section hairline is gone, and every other clause of wave-4 B3 survives',
  B !== null &&
    B.ruleCount === 0 &&
    B.headCount === 3 &&
    B.marks.every((m) => near(m.boxW, 12, 0.5) && near(m.boxH, 12, 0.5)) &&
    B.label?.fontSize === '11px' &&
    B.label?.fontWeight === '600' &&
    B.label?.textTransform === 'uppercase' &&
    near(parseFloat(B.label?.letterSpacing), 0.88, 0.02),
  {
    appearanceRuleElements: B?.ruleCount,
    headCount: B?.headCount,
    markBoxes: B?.marks.map((m) => `${px(m.boxW)}x${px(m.boxH)}`),
    label: B?.label,
    supersedes: 'wave4 B3 — hairline clause only; the other three clauses are asserted above'
  }
)

// B2 — THE SEPARATION THE HAIRLINE USED TO DRAW IS NOW CARRIED BY SPACING, and
// this measures the two intervals it is named after rather than the declarations
// that produce them. A header binds DOWN to its own controls only if the air
// above it out-ranks the air below it.
//
// THE THRESHOLD IS 3, NOT THE BUILDER'S 2, AND THE REASON IS A QUANTITY
// MISMATCH THAT THIS CHECK'S OWN RECONSTRUCTION CAUGHT. As first written it
// asserted "at least 2x", because 2x is the figure the builder derived. But the
// builder derived it INK TO INK — 35.9 above against 15.9 below, a ratio of
// 2.26, framed by half-leading it computed from the two font metrics. This check
// measures BOX TO BOX, because that is what a driver can read exactly. Those are
// different quantities, and the pre-wave stack measures 16 above against 8 below
// = EXACTLY 2.0 in box terms. So a 2x box threshold was satisfied by the design
// this wave replaced, and the check could not have failed for the reason it was
// named after.
//
// That is wave 4's W3 and wave 5's W6 a fourth time, in a new disguise: not a
// tie this time but a boundary, and it was the mandatory "the reconstruction must
// also fail" clause that exposed it rather than any reading of the code.
// Box-to-box the wave moves the ratio 2.0 -> 6.0, so 3 discriminates with margin
// at both ends. Raising a threshold that could not discriminate is not softening
// a check; the current tree clears 3 and 2 alike, and nothing was relaxed to make
// this pass.
{
  const n = B?.ladderNow
  const o = B?.ladderBefore
  const ratioNow = n && n.below > 0 ? n.above / n.below : null
  const ratioBefore = o && o.below > 0 ? o.above / o.below : null
  check(
    'B2 the gap above a section header out-ranks the gap below it by at least 3x (box-to-box)',
    ratioNow !== null && ratioNow >= 3 && ratioBefore !== null && ratioBefore < 3,
    {
      aboveNow: px(n?.above),
      belowNow: px(n?.below),
      ratioNow: px(ratioNow),
      aboveReconstructed: px(o?.above),
      belowReconstructed: px(o?.below),
      ratioReconstructed: px(ratioBefore),
      restoredMatches: near(n?.above, B?.ladderRestored?.above, 0.01) && near(n?.below, B?.ladderRestored?.below, 0.01)
    }
  )
}

// B3 — THE THREE SECTION MARKS NOW INK TO THE HOUSING'S EXTENT. They are not
// housing tenants (they are not buttons), which is why the wave that normalised
// the seven tenants correctly left them behind — and why they then sat at 8.8 to
// 9.4 in a dock full of marks at 10.4. Falsifiable rather than absolute: putting
// the Theme ring's radius back to its pre-wave 4 must drop that glyph off 10.4.
{
  const ext = B?.marks.map((m) => (m.extent ? Math.max(m.extent.w, m.extent.h) : null)) || []
  const ok = ext.length === 3 && ext.every((e) => typeof e === 'number' && e >= 10.2 && e <= 10.6)
  const spread = ok ? Math.max(...ext) - Math.min(...ext) : null
  const beforeExt = B?.themeExtentBefore ? Math.max(B.themeExtentBefore.w, B.themeExtentBefore.h) : null
  check(
    'B3 all three section marks ink to the housing extent, and reverting one reds it',
    ok && spread <= 0.2 && typeof beforeExt === 'number' && beforeExt < 10.2,
    {
      labels: B?.marks.map((m) => m.label),
      extents: ext.map((e) => px(e)),
      spread: px(spread),
      clearGround: B?.marks.map((m) => (m.extent ? px(Math.min(m.extent.minInk, 12 - m.extent.maxInk)) : null)),
      themeExtentReconstructed: px(beforeExt),
      note: 'viewBox is 12 painted at 12px, so a unit is a pixel'
    }
  )
}

// ══ AgentsDock ════════════════════════════════════════════════════════════
await clickBySel('[aria-label="Agents panel"]')
await page.waitForSelector('.agents-dock', { timeout: 10000 })

// The agent rows are SYNTHETIC: `AgentsDock.tsx` returns early while `sessionId`
// is null, so a driver that merely opens the dock finds an empty state and no
// `.agent-row-btn` at all. This pushes `subagent:changed` from MAIN — the real
// preload -> useChat -> AgentsDock path — and says nothing about whether the CLI
// ever emits one.
await app.evaluate(({ BrowserWindow }, agents) => {
  const win = BrowserWindow.getAllWindows()[0]
  for (const a of agents) win.webContents.send('subagent:changed', a)
}, [
  {
    type: 'subagent',
    parentToolUseId: 'w6-col',
    status: 'running',
    agentType: 'general-purpose',
    description: 'A row whose only job is to have a real inner width for G1 to read',
    model: 'claude-opus-5',
    spawnDepth: 0,
    totalTokens: 48000,
    toolUses: 12,
    durationMs: 92000
  }
])
await page.waitForSelector('.agent-row-btn', { timeout: 10000 }).catch(() => {})

const A = await page.evaluate(() => {
  const switchEl = document.querySelector('.agents-dock-switch')
  const closeEl = document.querySelector('.agents-dock-close')
  const modes = [...document.querySelectorAll('.agents-dock-mode')]
  const head = document.querySelector('.agents-dock-head')
  const headButtons = head ? [...head.querySelectorAll('button')] : []
  if (!switchEl || !closeEl || modes.length !== 2 || headButtons.length === 0) {
    return { error: 'head structure not found', hasSwitch: !!switchEl, hasClose: !!closeEl, modeCount: modes.length }
  }
  const intervals = () => {
    const m0 = modes[0].getBoundingClientRect()
    const m1 = modes[1].getBoundingClientRect()
    const sw = switchEl.getBoundingClientRect()
    const cl = closeEl.getBoundingClientRect()
    return { seam: m1.left - m0.right, isolation: cl.left - sw.right }
  }
  const now = intervals()
  const cs = getComputedStyle(switchEl)
  const shell = {
    borderTopWidth: cs.borderTopWidth,
    borderRadius: cs.borderTopLeftRadius,
    background: cs.backgroundColor,
    display: cs.display
  }
  // Reconstruct the pre-wave head: dissolve the shell so the three buttons fall
  // back into the head cluster's own gap, and drop the close's isolation margin.
  const dSaved = switchEl.style.display
  const mSaved = closeEl.style.marginLeft
  switchEl.style.display = 'contents'
  closeEl.style.marginLeft = '0px'
  void document.body.offsetHeight
  const m0 = modes[0].getBoundingClientRect()
  const m1 = modes[1].getBoundingClientRect()
  const cl = closeEl.getBoundingClientRect()
  const before = { seam: m1.left - m0.right, isolation: cl.left - m1.right }
  switchEl.style.display = dSaved
  closeEl.style.marginLeft = mSaved
  void document.body.offsetHeight
  const restored = intervals()
  return {
    now,
    before,
    restored,
    shell,
    buttons: headButtons.map((b) => {
      const r = b.getBoundingClientRect()
      const s = getComputedStyle(b)
      return {
        label: b.getAttribute('aria-label'),
        w: Math.round(r.width * 1000) / 1000,
        h: Math.round(r.height * 1000) / 1000,
        radius: s.borderTopLeftRadius
      }
    })
  }
})

// A1 — THE HEAD NO LONGER READS AS ONE UNDIFFERENTIATED RUN, and this measures
// the thing the critic actually named: the two intervals used to be EQUAL, so the
// geometry carried no information about which two buttons belong together. Now
// the seam inside the switch is tighter than the isolation outside it.
{
  const n = A?.now
  const o = A?.before
  const okNow = n && n.seam <= 0.5 && n.isolation >= 6
  const okOld = o && Math.abs(o.seam - o.isolation) <= 0.5
  check(
    'A1 the switch seam is tighter than the close isolation, where the two were equal before',
    !!okNow && !!okOld,
    {
      seamNow: px(n?.seam),
      isolationNow: px(n?.isolation),
      seamReconstructed: px(o?.seam),
      isolationReconstructed: px(o?.isolation),
      reconstructedWereEqual: okOld,
      restoredMatches: near(n?.seam, A?.restored?.seam, 0.01) && near(n?.isolation, A?.restored?.isolation, 0.01)
    }
  )
}

// A2 — AND NOTHING WAS RE-CUT TO ACHIEVE IT. All three head buttons keep the
// shared 28px housing and its 6px radius. Squaring the switch segments' seam
// corners would have been the cheap way to draw the grouping and it would have
// broken the housing the whole IconHousing piece is about; `gui-gauntlet-wave3`
// A1 asserts the same invariant and must stay green beside this.
check(
  'A2 every head button keeps the shared 28px housing and its 6px radius',
  Array.isArray(A?.buttons) &&
    A.buttons.length >= 3 &&
    A.buttons.every((b) => near(b.w, 28, 0.5) && near(b.h, 28, 0.5) && b.radius === '6px'),
  { buttons: A?.buttons }
)

// A3 — the switch is a real bound control rather than three buttons with clever
// spacing: it carries its own hairline and radius, which is what makes two
// segments read as one object.
check(
  'A3 the switch draws its own shell — a hairline and an 8px radius round both segments',
  A?.shell && parseFloat(A.shell.borderTopWidth) >= 1 && A.shell.borderRadius === '8px' && A.shell.display === 'flex',
  { shell: A?.shell }
)

// ══ G1 — carried forward from wave 5, unchanged in intent ═════════════════
// The three docks are never co-resident, so each column was read while its own
// dock was open. This is the check the CommandsDock builder designed its
// construction around: see C2.
const agentsCol = await page.evaluate(() => {
  const row = document.querySelector('.agent-row-btn')
  if (row) return { px: row.clientWidth - 20, from: '.agent-row-btn' }
  const list = document.querySelector('.agent-list')
  if (!list) return null
  const cs = getComputedStyle(list)
  return {
    px: list.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 20,
    from: '.agent-list padding (no agent row renders without a spawned subagent)'
  }
})

const cols = [agentsCol?.px, C?.textColumn, B?.choiceTextColumn].filter((n) => typeof n === 'number')
check(
  'G1 all three docks still resolve their row text column to the same width',
  cols.length === 3 && Math.max(...cols) - Math.min(...cols) <= 1,
  {
    agentsPx: px(agentsCol?.px),
    commandsPx: px(C?.textColumn),
    appearancePx: px(B?.choiceTextColumn),
    spreadPx: cols.length === 3 ? px(Math.max(...cols) - Math.min(...cols)) : null,
    note: 'read in three separate layout states — the docks share one slot and are never co-resident'
  }
)

await app.close()

console.log(`\nWAVE6 ${fails.length === 0 ? 'GREEN' : 'RED'} — ${fails.length} failing`)
if (fails.length) for (const f of fails) console.log('  FAIL ' + f)
process.exit(fails.length === 0 ? 0 : 1)
