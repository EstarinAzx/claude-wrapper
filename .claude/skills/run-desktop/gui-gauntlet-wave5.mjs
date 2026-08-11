// GUI pin for gauntlet wave 5 — the five builds that wave landed, each measured
// as a RENDERED box in a real Chromium.
//
//   node .claude/skills/run-desktop/gui-gauntlet-wave5.mjs
//
// Needs `npm run build` first, plus playwright-core. Costs NO CLI turns.
//
// ── why this file exists at all ───────────────────────────────────────────
// The fast gate loads no CSS. `npm test` runs vitest under jsdom, where no
// element has a height, `line-height` resolves to nothing measurable, and an
// SVG has no geometry because there is no layout. Every claim wave 5 makes is a
// claim about a box, a line count or a glyph's drawn extent, and jsdom can see
// none of the three. This is that driver. It sits beside wave2/3/4 rather than
// extending them, for the reason wave 3 first gave: each file's measurements are
// taken in its own layout state.
//
// ── the five changes, and what each is pinned by ──────────────────────────
//   WelcomeMinWindow  `.welcome-mark`'s bottom interval went 24px -> 16px, so
//                     the identity mark stops out-spacing every other gap in the
//                     stack. Pinned by W5.
//   CommandsDock      a descriptionless row reserved the description's own slot
//                     instead of resting on a 40px pin that sat BELOW the
//                     shortest real row, and lost the centring that pushed its
//                     lone name off the list's beat. Pinned by C1..C2.
//   AppearanceDock    the zoom stepper came off its full-width line onto the end
//                     of its section header, right-aligned and sized to content.
//                     Pinned by B1'.
//   DocksAsOne        Appearance gave up its enclosure — no container border, no
//                     row dividers — and its options moved onto the shared open
//                     row shell the other two docks already use. Pinned by
//                     G1..G2, and G1 is the one that decides whether the gap was
//                     actually closed.
//   IconHousing       the seven 12-grid glyphs in the shared 28px housing were
//                     cut to the one optical extent the 14 and 16 grids already
//                     land on. Pinned by I1..I3.
//
// ── the two checks that carry a superseded wave-4 pin forward ─────────────
// `gui-gauntlet-wave4.mjs` retired four checks this wave, three of them because
// wave 5 deliberately reversed the design they pinned (see the supersession
// blocks in that file). Two of their intents survive and are STRONGER here:
//
//   B4  ->  B1'  pinned a full-column strip. B1' pins the compact control AND
//                asserts what B4 never could: that it is INSIDE the header
//                element, not merely narrow. "Narrow" is satisfiable by a strip
//                that still sits on its own line.
//   B5  ->  N1   pinned the description column at 193px in order to protect a
//                TWO-LINE deck. It measured a width and cared about a line
//                count, so it went red when wave 5 widened the column to 215px
//                while the deck was never in danger — and it would have stayed
//                GREEN if the deck had grown to three lines from longer copy at
//                an unchanged width. N1 counts the rendered line boxes.
//
// ── how "the old value" is obtained, since a driver cannot git-stash ──────
// Each check that can be RECONSTRUCTED states the value the previous build
// produced, measured live in the same window and the same layout pass by
// mutating the one declaration the wave added and reading the box back. The
// inline style is cleared again before the evaluate returns. This is waves 2-4's
// idiom and it is what makes a check falsifiable on purpose.
//
// ── what this driver does NOT claim ───────────────────────────────────────
// 1. It does not measure the minimum-window headroom. That needs the window at
//    its enforced minimum and resizing mid-run would revoke every other box here
//    (#77). `inspect.mjs` pins it first-hand and reported for this wave:
//    {"measured":61.71,"claimed":62,"content":256.69,"overflow":0}.
// 2. Nothing here is a claim about colour or material. No driver can see a DWM
//    backdrop, so the flat ground in every capture is an instrument artifact.
// 3. It does not rule on WHICH glyph any button draws. IconHousing's fence puts
//    icon meaning with the surface that owns it; only extent is measured.

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

// ── the command rows are FIXTURE-FED, and that is stated rather than hidden ──
// `.command-row-btn` renders from whatever `commands:list` returns, and main
// owns that answer. With no CLI engine behind the driver the honest answer is an
// EMPTY LIST, so a driver that merely opens the dock photographs an empty state
// and C1/C2 below would go vacuously green. The first run of this driver went
// red there instead, because C1 requires finding both a bare row and a described
// one — which is the shape the check exists to compare.
//
// This installs the same fixture `inspect.mjs` installs, at the same boundary
// and for the same reason, so the rows measured here are the rows photographed
// in the wave capture. `removeHandler` first because `ipcMain.handle` throws on
// a second registration for one channel rather than replacing it.
//
// The set is chosen for ROW SHAPE, not for realism: `wrap-up` carries no
// description precisely so the descriptionless shape exists to be measured. That
// is the row wave 5's CommandsDock claim is about.
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
// figure below would be silently scaled otherwise. Both halves are pinned.
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

// ── the glyph-extent rule, defined once and used by every I-check ─────────
// A mark's OPTICAL EXTENT is its geometry bounding box plus one whole
// strokeWidth — half a stroke bleeds past the path on each side. Every grid here
// is 1:1 viewBox-to-pixel, so a viewBox unit is a pixel and no scaling term is
// needed. `getBBox()` returns the geometry box WITHOUT the stroke, which is
// exactly why the stroke is added back rather than trusted to be included.
//
// Elements carrying `stroke="none"` (the map glyph's three filled dots) expand
// by nothing, so the stroke term is read per element rather than assumed from
// the parent.
const EXTENT_FN = `
  (svg) => {
    const vb = (svg.getAttribute('viewBox') || '').trim()
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
      viewBox: vb,
      w: Math.round((maxX - minX) * 1000) / 1000,
      h: Math.round((maxY - minY) * 1000) / 1000,
      minInk: Math.round(Math.min(minX, minY) * 1000) / 1000,
      maxInk: Math.round(Math.max(maxX, maxY) * 1000) / 1000
    }
  }
`

// Collects every housing tenant VISIBLE in the current layout state. The docks
// are mutually exclusive asides, so this is called in each state and the results
// are merged — a tenant is keyed by its accessible name so a re-read in another
// state does not double-count it.
const readTenants = () =>
  page.evaluate(`(() => {
    const extent = ${EXTENT_FN};
    const out = [];
    for (const btn of document.querySelectorAll('.agents-toggle, .sidebar-toggle')) {
      const svg = btn.querySelector('svg');
      if (!svg) continue;
      const r = btn.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const e = extent(svg);
      out.push({
        name: btn.getAttribute('aria-label') || btn.className,
        housingW: Math.round(r.width * 1000) / 1000,
        housingH: Math.round(r.height * 1000) / 1000,
        viewBox: svg.getAttribute('viewBox'),
        extentW: e ? e.w : null,
        extentH: e ? e.h : null,
        minInk: e ? e.minInk : null,
        maxInk: e ? e.maxInk : null
      });
    }
    return out;
  })()`)

const tenants = new Map()
const mergeTenants = async (state) => {
  for (const t of await readTenants()) {
    if (!tenants.has(t.name)) tenants.set(t.name, { ...t, seenIn: state })
  }
}

// ══ Welcome ═══════════════════════════════════════════════════════════════
// MEASURED FIRST and the order is load-bearing: this surface stops existing the
// moment a folder is picked, and every dock below needs one open.
await page.waitForSelector('.welcome-title', { timeout: 10000 })

const W = await page.evaluate(() => {
  const mark = document.querySelector('.welcome-mark')
  const title = document.querySelector('.welcome-title')
  const hint = document.querySelector('.welcome-hint')
  const btn = document.querySelector('.pick-folder-btn')
  if (!mark || !title || !hint || !btn) return null
  const gapOf = (a, b) => b.getBoundingClientRect().top - a.getBoundingClientRect().bottom
  const read = () => ({
    markToTitle: gapOf(mark, title),
    titleToHint: gapOf(title, hint),
    hintToBtn: gapOf(hint, btn),
    stackHeight: btn.getBoundingClientRect().bottom - mark.getBoundingClientRect().top
  })
  const now = read()
  // Reconstruct the pre-wave value in the same layout pass: put the mark's
  // interval back to the 24px it carried and read the stack again.
  const prev = mark.style.marginBottom
  mark.style.marginBottom = '24px'
  const before = read()
  mark.style.marginBottom = prev
  return {
    now,
    before,
    markMarginBottom: getComputedStyle(mark).marginBottom
  }
})

// W5 and W6 — SUPERSEDED BY WAVE 6, and retired here rather than softened.
//
// Both pinned the interval this wave cut: W5 that the mark sits at 16px where it
// had been 24, W6 that the mark went from equal-largest to strictly smaller.
// Wave 6 moved the SAME declaration again, 16 -> 8, and moved the action gap
// 24 -> 32 with it, on a critic gap asking to "tighten the mark-to-headline
// relationship and open a distinctly larger gap before the CTA so the action
// lands as a final beat". The run went 16/8/32 to 8/8/32.
//
// W5 IS STALE RATHER THAN VIOLATED, and the distinction matters. Its stated
// intent — the identity mark no longer out-spaces every other interval — is MORE
// true now than when it was written: the mark tied the smallest interval this
// wave. What reds is its hardcoded 16px, which was never the claim.
//
// W6 IS DIFFERENT AND IT IS THE INSTRUCTIVE ONE: its RECONSTRUCTION broke, not
// its assertion. It rebuilds the pre-wave stack by reverting one declaration,
// the mark, and wave 6 moved two. So it now reconstructs [24, 8, 32] — a state
// that never existed in any wave, half wave-5 and half wave-6 — and reasons
// about it. A partial revert of a multi-declaration change reconstructs nothing.
// That is a THIRD distinct way for a check to go wrong, after wave 4 W3 (which
// measured a proxy for its premise rather than the premise) and wave 6 B2 (whose
// threshold the pre-wave state already satisfied exactly). Read all three before
// writing a driver; each was found by a probe, and none by reading the code.
//
// Carried forward as `gui-gauntlet-wave6.mjs` W1, which is stronger than either:
// it reverts BOTH declarations, states the composition as an ordering rather than
// as any single number (the first two intervals within 4px of each other, the
// third clearing both by 16), and asserts that the reconstruction fails. W2 adds
// what neither W5 nor W6 covered — that the change cost no height at all.

// ══ open a project, then the docks ════════════════════════════════════════
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) =>
    /pick a project folder/i.test(b.textContent || '')
  )
  btn?.click()
})
await page.waitForSelector('.session-group-head', { timeout: 20000 })
await page.waitForSelector('[aria-label="Agents panel"]', { timeout: 10000 })

// The sessions rail is read FIRST and while still expanded — its two chevrons
// are two of the seven tenants, and collapsing the rail takes one out of the DOM.
await mergeTenants('sessions-rail')

// ══ CommandsDock ══════════════════════════════════════════════════════════
await clickBySel('[aria-label="Commands panel"]')
await page.waitForSelector('.command-row-btn', { timeout: 10000 }).catch(() => {})
await mergeTenants('commands-dock')

const C = await page.evaluate(() => {
  const rows = [...document.querySelectorAll('.command-row-btn')]
  if (rows.length === 0) return null
  const bare = rows.filter((r) => r.querySelector('.command-row-desc') === null)
  const described = rows.filter((r) => r.querySelector('.command-row-desc') !== null)
  if (bare.length === 0 || described.length === 0) return null
  const h = (el) => el.getBoundingClientRect().height
  // The shortest row that says something: the described row with the smallest
  // box. That is the height the floor claims to reach.
  const shortestDescribed = Math.min(...described.map(h))
  const bareH = Math.max(...bare.map(h))
  // Reconstruct the pre-wave shape: drop the reservation and put the centring
  // back, in the same layout pass.
  const prevPad = bare[0].style.paddingBottom
  const prevJustify = bare[0].style.justifyContent
  bare[0].style.paddingBottom = '0px'
  bare[0].style.justifyContent = 'center'
  const beforeH = h(bare[0])
  bare[0].style.paddingBottom = prevPad
  bare[0].style.justifyContent = prevJustify
  return {
    rowCount: rows.length,
    bareCount: bare.length,
    describedCount: described.length,
    bareH,
    shortestDescribed,
    beforeBareH: beforeH,
    justifyContent: getComputedStyle(rows[0]).justifyContent,
    textColumn: rows[0].clientWidth - 20
  }
})

// C1 — THE FLOOR REACHES THE SHORTEST ROW THAT SAYS SOMETHING. The wave's claim
// is not "the bare row got taller", it is "the bare row stopped sitting below
// the range its neighbours occupy". So the assertion is the RELATION between the
// two heights, and the reconstruction proves the relation did not already hold.
check(
  'C1 a descriptionless row now reaches the height of the shortest row that carries a description',
  C !== null && near(C.bareH, C.shortestDescribed, 1.5) && C.beforeBareH < C.shortestDescribed - 4,
  C === null
    ? { error: 'command rows not found — the dock may be empty' }
    : {
        bareRowHeightPx: px(C.bareH),
        shortestDescribedRowPx: px(C.shortestDescribed),
        deltaPx: px(Math.abs(C.bareH - C.shortestDescribed)),
        oldReconstructed: { bareRowHeightPx: px(C.beforeBareH) },
        shortfallBeforePx: px(C.shortestDescribed - C.beforeBareH),
        rowCount: C.rowCount,
        bareCount: C.bareCount
      }
)

// C2 — the centring is gone, so every name in the dock hangs off the same top
// inset. This is the half of the fix that moves the ANCHOR the list is read on;
// without it a future slack would drop a name off the beat again.
check(
  'C2 command rows no longer centre their content vertically',
  C !== null && C.justifyContent !== 'center',
  C === null ? { error: 'command rows not found' } : { justifyContent: C.justifyContent }
)

// ══ AppearanceDock ════════════════════════════════════════════════════════
await clickBySel('[aria-label="Appearance panel"]')
await page.waitForSelector('.appearance-dock', { timeout: 10000 })
await mergeTenants('appearance-dock')

const B = await page.evaluate(() => {
  const stepper = document.querySelector('.appearance-stepper')
  // `closest`, not `querySelector('.appearance-head')` — there are THREE heads
  // (Theme, Backdrop, Zoom) and only the third carries the stepper. Asking the
  // document for "the" head returns Theme's and the containment test then reads
  // false against a tree that is correct. The first run of this driver failed
  // exactly that way, with every dimension already right.
  const head = stepper ? stepper.closest('.appearance-head') : null
  const steps = [...document.querySelectorAll('.appearance-step')]
  const readout = document.querySelector('.appearance-readout')
  const choices = [...document.querySelectorAll('.appearance-choice')]
  const descs = [...document.querySelectorAll('.appearance-choice-desc')]
  const r = (el) => (el ? el.getBoundingClientRect() : null)
  const sb = r(stepper)
  const first = choices[0]
  const second = choices[1]
  const cs = first ? getComputedStyle(first) : null
  // The longest description is the one the two-line premise is about.
  let longest = null
  for (const d of descs) {
    const dr = d.getBoundingClientRect()
    const lh = parseFloat(getComputedStyle(d).lineHeight)
    const lines = lh > 0 ? dr.height / lh : null
    if (longest === null || dr.height > longest.heightPx) {
      longest = {
        heightPx: dr.height,
        lineHeightPx: lh,
        lines: lines === null ? null : Math.round(lines * 100) / 100,
        clientWidth: d.clientWidth,
        text: (d.textContent || '').trim().slice(0, 90)
      }
    }
  }
  return {
    stepperInsideHead: !!(stepper && head),
    stepperHeadIndex: head ? [...document.querySelectorAll('.appearance-head')].indexOf(head) : -1,
    stepperW: sb ? sb.width : null,
    stepperH: sb ? sb.height : null,
    stepperRadius: stepper ? getComputedStyle(stepper).borderTopLeftRadius : null,
    stepWidths: steps.map((s) => s.getBoundingClientRect().width),
    stepHeights: steps.map((s) => s.getBoundingClientRect().height),
    readoutW: readout ? readout.getBoundingClientRect().width : null,
    choiceCount: choices.length,
    choiceBorderTop: cs ? cs.borderTopWidth : null,
    choiceBorderLeft: cs ? cs.borderLeftWidth : null,
    choiceRadius: cs ? cs.borderTopLeftRadius : null,
    secondChoiceBorderTop: second ? getComputedStyle(second).borderTopWidth : null,
    choiceTextColumn: first ? first.clientWidth - 20 : null,
    longest
  }
})

// B1' — SUCCESSOR TO WAVE 4's RETIRED B4. Two assertions, and the second is the
// one B4 could not make: the control is INSIDE the header element. A stepper
// that merely got narrower while keeping its own line would satisfy "compact"
// and would not close the critic's gap, which was about SILHOUETTE — three
// families resolving to the same full-width rounded shell.
check(
  "B1' the zoom stepper is a compact control living inside its section header",
  B.stepperInsideHead &&
    near(B.stepperW, 88, 2) &&
    near(B.stepperH, 26, 2) &&
    B.stepWidths.length === 2 &&
    near(B.stepWidths[0], B.stepWidths[1], 0.6) &&
    B.stepWidths[0] < 32 &&
    parseFloat(B.stepperRadius) <= 12,
  {
    stepperInsideHead: B.stepperInsideHead,
    stepperWidthPx: px(B.stepperW),
    stepperHeightPx: px(B.stepperH),
    stepperRadius: B.stepperRadius,
    stepWidthsPx: B.stepWidths.map(px),
    stepHeightsPx: B.stepHeights.map(px),
    readoutWidthPx: px(B.readoutW),
    supersedes: 'gui-gauntlet-wave4.mjs B4, which pinned the full-column strip this replaced'
  }
)

// G2 — Appearance gave up its enclosure. Neither the option row NOR a container
// draws a border, and the rows carry the shared shell's 8px radius. This is what
// survives of wave 4's retired B1 (a row never draws its own border), asserted
// together with the new fact that nothing above it draws one either.
check(
  'G2 the appearance option rows are open — no row border, no divider, shared 8px radius',
  parseFloat(B.choiceBorderTop) === 0 &&
    parseFloat(B.choiceBorderLeft) === 0 &&
    parseFloat(B.secondChoiceBorderTop) === 0 &&
    near(parseFloat(B.choiceRadius), 8, 0.5),
  {
    choiceBorderTop: B.choiceBorderTop,
    choiceBorderLeft: B.choiceBorderLeft,
    secondChoiceBorderTop: B.secondChoiceBorderTop,
    choiceRadius: B.choiceRadius,
    choiceCount: B.choiceCount,
    supersedes: 'gui-gauntlet-wave4.mjs B1 and B2, which pinned the enclosure this removed'
  }
)

// N1 — SUCCESSOR TO WAVE 4's RETIRED B5, and the reason that check is a rewrite
// rather than a deletion. B5 asserted a 193px column in order to protect a
// TWO-LINE deck. Wave 5 widened the column to 215px on purpose and B5 went red
// while the deck was never at risk. Worse, B5 would have stayed GREEN if the
// deck had grown to three lines from longer copy at an unchanged width.
//
// So this counts the rendered line boxes: the description's box height over its
// own computed line-height. That is the premise itself, and it is falsifiable in
// the direction that actually matters.
check(
  'N1 the longest option description still renders as exactly two lines',
  B.longest !== null && B.longest.lines !== null && near(B.longest.lines, 2, 0.15),
  B.longest === null
    ? { error: 'no .appearance-choice-desc found' }
    : {
        lines: B.longest.lines,
        heightPx: px(B.longest.heightPx),
        lineHeightPx: px(B.longest.lineHeightPx),
        textColumnPx: px(B.longest.clientWidth),
        text: B.longest.text,
        supersedes: 'gui-gauntlet-wave4.mjs B5, which measured a width proxy for this premise'
      }
)

// ══ AgentsDock ════════════════════════════════════════════════════════════
await clickBySel('[aria-label="Agents panel"]')
await page.waitForSelector('.agents-dock', { timeout: 10000 })
await mergeTenants('agents-dock')

// The agent rows are SYNTHETIC, for the reason wave 2 first wrote down and wave
// 4 repeated: `AgentsDock.tsx` returns early while `sessionId` is null, so a
// driver that merely opens the dock finds an empty state and no `.agent-list` at
// all. The first run of this driver read `null` for the agents column and G1
// compared two docks while claiming to compare three.
//
// This pushes `subagent:changed` from MAIN — the real preload -> useChat ->
// AgentsDock render path — with a fake payload, and it carries the same caveat
// unchanged: this measures how the dock LAYS OUT a row, and says nothing about
// whether the CLI ever emits one. G1 needs a real rendered row rather than the
// list's padding, because the row's own inset is half of the number it compares.
await app.evaluate(({ BrowserWindow }, agents) => {
  const win = BrowserWindow.getAllWindows()[0]
  for (const a of agents) win.webContents.send('subagent:changed', a)
}, [
  {
    type: 'subagent',
    parentToolUseId: 'w5-col',
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

// THE THREE COLUMNS ARE READ IN THREE DIFFERENT LAYOUT STATES, and they have to
// be: the docks are mutually exclusive asides in one right-hand slot, so at most
// one of `.agent-list`, `.command-list` and `.appearance-body` is in the DOM at
// any moment. The first run of this driver asked for all three at once, got
// three nulls, and reported an empty `sources` map — a check that could never
// have passed and never have failed for a reason about the tree.
//
// Each number below was therefore captured above, while its own dock was open:
// `C.textColumn` in the commands state, `B.choiceTextColumn` in the appearance
// state, and the agents row here. The subtraction of 20 is the row's own 10px
// inset a side, which all three shells share.
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

// G1 — THE CHECK THAT DECIDES WHETHER DocksAsOne ACTUALLY CLOSED ITS GAP.
// Its critic asked for one containment grammar across the three docks. Removing
// Appearance's border satisfies the LETTER of that while leaving three different
// text columns, which would be the same disagreement one layer down — and no
// single dock's builder could ever see it, because no builder sees two docks.
// All three must land on one number.
const G = {
  agents: agentsCol,
  commands: typeof C?.textColumn === 'number' ? { px: C.textColumn, from: '.command-row-btn' } : null,
  appearance:
    typeof B?.choiceTextColumn === 'number' ? { px: B.choiceTextColumn, from: '.appearance-choice' } : null
}
const cols = [G.agents?.px, G.commands?.px, G.appearance?.px].filter((n) => typeof n === 'number')
check(
  'G1 all three docks resolve their row text column to the same width',
  cols.length === 3 && Math.max(...cols) - Math.min(...cols) <= 1,
  {
    agentsPx: px(G.agents?.px),
    commandsPx: px(G.commands?.px),
    appearancePx: px(G.appearance?.px),
    spreadPx: cols.length === 3 ? px(Math.max(...cols) - Math.min(...cols)) : null,
    sources: { agents: G.agents?.from, commands: G.commands?.from, appearance: G.appearance?.from },
    note: 'read in three separate layout states — the docks share one slot and are never co-resident'
  }
)

// ══ IconHousing ═══════════════════════════════════════════════════════════
// THE SEVENTH TENANT NEEDS A SIXTH LAYOUT STATE. The census counts "two rail
// chevrons", and they are the collapse mark and the expand mark — which are the
// same affordance in its two states and are NEVER BOTH IN THE DOM. Reading the
// rail expanded finds `Collapse sessions` and misses `Expand sessions` entirely.
//
// The first run of this driver found six of seven and failed I1 for that reason,
// which is the census guard doing its job: I2 and I3 both measured 10.4 across
// everything they DID find, and passing them on six tenants while silently
// missing one is precisely the vacuous green that guard exists to prevent.
await clickBySel('[aria-label="Collapse sessions"]')
await page.waitForSelector('[aria-label="Expand sessions"]', { timeout: 10000 }).catch(() => {})
await mergeTenants('sessions-rail-collapsed')

const all = [...tenants.values()]
const grid12 = all.filter((t) => t.viewBox === '0 0 12 12')
const gridOther = all.filter((t) => t.viewBox !== '0 0 12 12')

// I1 — every tenant that was found. The census in titlebar.css says 13 across
// three grids, seven of them on the 12 grid. A driver that measured four of them
// and passed would be worse than no driver, so the COUNT is asserted before any
// extent is.
check(
  'I1 the housing census is intact — 7 tenants on the 12 grid were reached and measured',
  grid12.length === 7,
  {
    tenantsReached: all.length,
    grid12Count: grid12.length,
    otherGridCount: gridOther.length,
    grid12: grid12.map((t) => ({ name: t.name, seenIn: t.seenIn, extentW: t.extentW, extentH: t.extentH }))
  }
)

// I2 — the seven 12-grid glyphs now share ONE optical extent. The target is the
// 10.4 the 14 and 16 grids already land on, and the tolerance is tight on
// purpose: the defect the critic named was a family running 7.4 to 9.4, so a
// loose check here would pass the very thing it exists to catch.
const extents = grid12.map((t) => Math.max(t.extentW ?? 0, t.extentH ?? 0))
check(
  'I2 all seven 12-grid glyphs ink to the same ~10.4px optical extent',
  grid12.length === 7 && extents.every((e) => near(e, 10.4, 0.35)),
  {
    target: 10.4,
    extents: grid12.map((t) => ({ name: t.name, larger: px(Math.max(t.extentW ?? 0, t.extentH ?? 0)) })),
    spreadPx: extents.length ? px(Math.max(...extents) - Math.min(...extents)) : null,
    before: 'the same seven ran 7.4 to 9.4, the close X worst at 7.4 square'
  }
)

// I3 — NOTHING INKS OUTSIDE ITS GRID. A uniform scale is the easy way to close
// I2 and the easy way to clip a glyph while doing it: 9 units of path centred in
// a 12 box leaves 0.8 of clear ground a side, and a mark that overran would be
// cropped by the viewBox with no other check noticing.
check(
  'I3 no 12-grid glyph inks outside its own viewBox',
  grid12.length === 7 && grid12.every((t) => (t.minInk ?? -1) >= 0 && (t.maxInk ?? 99) <= 12),
  {
    inkBounds: grid12.map((t) => ({ name: t.name, min: px(t.minInk), max: px(t.maxInk) })),
    clearGroundEachSide: 0.8
  }
)

// ── report ────────────────────────────────────────────────────────────────
console.log('')
console.log('=== gauntlet wave 5 — five builds, measured in a real Chromium ===')
console.log(`shots: ${SHOT_DIR}`)
console.log('')
console.log('CARRIES FORWARD two pins gui-gauntlet-wave4.mjs retired this wave:')
console.log("  B4 -> B1'  compact stepper, plus the containment B4 could not assert")
console.log('  B5 -> N1   the two-line deck, measured as a LINE COUNT not a column width')
console.log('')
console.log('NOT PINNED HERE: the minimum-window headroom (#77 — resizing revokes every box')
console.log('  above). inspect.mjs pins it: {"measured":61.71,"claimed":62,"content":256.69}')
console.log('NOT PINNED HERE: which glyph any button draws. IconHousing rules on extent only.')
console.log('')
console.log(fails.length === 0 ? 'ALL GREEN' : `RED: ${fails.join(' | ')}`)

await app.close().catch(() => {})
process.exit(fails.length === 0 ? 0 : 1)
