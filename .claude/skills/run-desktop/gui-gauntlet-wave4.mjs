// GUI pin for gauntlet wave 4 — the three surfaces that wave changed, each
// measured as a RENDERED box in a real Chromium.
//
//   node .claude/skills/run-desktop/gui-gauntlet-wave4.mjs
//
// Needs `npm run build` first, plus playwright-core. Costs NO CLI turns.
//
// ── why this file exists at all ───────────────────────────────────────────
// The fast gate loads no CSS. `npm test` runs vitest under jsdom, where no
// element has a height, a `line-height` number resolves to nothing measurable
// and a font stack never resolves at all. Every claim wave 4 makes is a claim
// about a box or a face, and neither is visible to jsdom. This is that driver.
// It sits beside `gui-gauntlet-wave2.mjs` and `-wave3.mjs` rather than
// extending either, for the same reason wave 3 gave: those files' measurements
// are taken in their own layout state, and one of wave 4's three claims is
// about the Welcome screen, which stops existing once a folder is open.
//
// ── the three changes, and what each one is pinned by ─────────────────────
//   AgentsDock       the row was one uniform 2px gap between all three
//                    children. It is now a RATIO: 0px inside a block (which
//                    renders as the 4.95px of leading the 11px/1.45 text
//                    already carries), 8px at a band break, 18px at a row
//                    break. The metadata pair binds to itself at 0 so the band
//                    below the sentence cannot out-rank the one above it.
//                    Pinned by A1..A5.
//   AppearanceDock   six free-floating bordered cards became two bordered
//                    CONTAINERS with hairline-divided rows, each section got a
//                    header (12px mark + micro-caps label + rule), and the zoom
//                    stepper widened from a 100px right-hung pill into a
//                    full-column three-segment strip. Pinned by B1..B5.
//   Welcome          the 46px headline moved off the `Text` optical master onto
//                    `Display`, and took -0.02em of tracking. Pinned by W1..W4.
//
// ── how "the old value" is obtained, since a driver cannot git-stash ──────
// Every check states the value the PREVIOUS build produced, and none of those
// numbers is remembered. Each is RECONSTRUCTED live, in the same window and the
// same layout pass, by mutating the one declaration the wave added and reading
// the box back:
//
//   the row's rhythm      → the three children are forced back to a uniform 2px
//                           gap with no margins and the inherited 1.6 leading
//   the card grouping     → the container's border is removed and each row is
//                           given back its own 1px border, 8px radius and the
//                           6px gap between cards
//   the stepper           → the strip is pinned back to `--r-pill` and its steps
//                           to the 26x24 boxes they were
//   the headline's face   → `font-family` is forced back to the `Text` master
//                           the app's `--font` names first
//
// The inline style is cleared again before each evaluate returns. This is
// gui-94's and waves 2/3's idiom — build the expectation from the engine rather
// than from a remembered pixel count — and it is what makes each check
// FALSIFIABLE on purpose: the reconstruction is printed beside the measurement.
//
// ── the one check here that is NOT a box ──────────────────────────────────
// W3 exists because a CSS font stack FAILS SILENTLY. `font-family: "Segoe UI
// Variable Display", var(--font)` renders perfectly well when the first name
// resolves to nothing — it just falls through to the same face the app already
// used, and every string-comparison check on `fontFamily` still passes, because
// `getComputedStyle` returns the AUTHORED stack rather than the face that won.
// The wave's whole Welcome claim is that a different optical master is now
// carrying the headline. So W3 measures the rendered ADVANCE WIDTH of the same
// string under both stacks and requires them to differ. If the Display master
// were absent, the two widths would be identical and W3 reds — which is the
// only way this driver can tell "the face changed" from "the author typed a
// font name".
//
// ── what this driver does NOT claim ───────────────────────────────────────
// 1. It does not measure the minimum-window headroom. That claim needs the
//    window at its enforced minimum, and resizing mid-run would revoke every
//    other box here (#77). `inspect.mjs` pins it instead, first-hand, and
//    reported `{"measured":53.71,"claimed":54,"content":264.69,"overflow":0}`
//    for this wave — unchanged from wave 3, which is itself the claim.
// 2. CommandsDock is not pinned. Wave 4 deliberately did not build it, and its
//    capture is byte-identical for the third consecutive wave.
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

// ── the agent rows are SYNTHETIC, and that is stated rather than hidden ────
// `.agent-row-btn` only exists once a session has spawned a subagent —
// `AgentsDock.tsx:174` returns early while `sessionId` is null, so a driver that
// merely opens a folder photographs an empty state and every A-check below
// would go vacuously green. A0 exists to catch exactly that, and it DID: the
// first run of this driver went red there.
//
// So this pushes `subagent:changed` from MAIN, the real preload -> useChat ->
// AgentsDock render path with a FAKE payload. It is `gui-gauntlet-wave2.mjs`'s
// move and `gui-agents-dock.mjs`'s before it, and it carries their caveat
// unchanged: this measures how the dock LAYS OUT a row. It says nothing about
// whether the CLI ever emits one.
//
// The payload is shaped to produce the FOUR-CHILD row, because that is the row
// wave 4's claim is about. `.agent-row-meta` renders from `model` + `spawnDepth`
// and `.agent-row-stats` from the live counters, so both fields sets are
// supplied — without them the row has no metadata pair and A4/A5 would be
// measuring a shape the wave did not change.
const AGENTS = [
  {
    type: 'subagent',
    parentToolUseId: 'w4-four-child',
    status: 'running',
    agentType: 'general-purpose',
    description: 'Survey every fs.* call across the GUI drivers and classify it, with line numbers',
    model: 'claude-opus-5',
    spawnDepth: 0,
    totalTokens: 48000,
    toolUses: 12,
    durationMs: 92000
  },
  {
    type: 'subagent',
    parentToolUseId: 'w4-three-child',
    status: 'done',
    agentType: 'cavecrew-reviewer',
    description: 'Review the working diff for scope creep',
    model: 'claude-sonnet-5',
    spawnDepth: 1
  }
]
// (pushed further down, once the window exists and the dock is open)

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
  const p = path.join(SHOT_DIR, `gauntlet-wave4-${name}.png`)
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
// before a folder is picked, and both docks below need one open.
await page.waitForSelector('.welcome-title', { timeout: 10000 })
await shotEl('welcome', '.welcome')

const W = await page.evaluate(() => {
  const title = document.querySelector('.welcome-title')
  const hint = document.querySelector('.welcome-hint')
  if (!title || !hint) return null

  const cs = getComputedStyle(title)
  const now = {
    fontFamilyAuthored: cs.fontFamily,
    letterSpacing: cs.letterSpacing,
    fontSize: cs.fontSize,
    fontWeight: cs.fontWeight,
    heightPx: title.getBoundingClientRect().height,
    widthPx: title.getBoundingClientRect().width,
    text: (title.textContent || '').trim()
  }

  // ---- W3's instrument: measure the same string under both optical masters ----
  // A detached span, absolutely positioned out of flow, so nothing in the real
  // layout moves while this is measured. Everything but `font-family` is copied
  // from the live headline, so the ONLY variable is the face.
  const measureUnder = (stack) => {
    const probe = document.createElement('span')
    probe.textContent = now.text
    probe.style.position = 'absolute'
    probe.style.left = '-9999px'
    probe.style.top = '0'
    probe.style.whiteSpace = 'pre'
    probe.style.fontFamily = stack
    probe.style.fontSize = cs.fontSize
    probe.style.fontWeight = cs.fontWeight
    probe.style.fontStyle = cs.fontStyle
    probe.style.letterSpacing = cs.letterSpacing
    document.body.appendChild(probe)
    const w = probe.getBoundingClientRect().width
    probe.remove()
    return w
  }
  const displayWidth = measureUnder('"Segoe UI Variable Display"')
  const textWidth = measureUnder('"Segoe UI Variable Text"')
  const bogusWidth = measureUnder('"No Such Face Anywhere 12345"')

  // ---- reconstruct the pre-wave face: the `Text` master --------------------
  const prevFam = title.style.fontFamily
  title.style.fontFamily = '"Segoe UI Variable Text", var(--font)'
  void title.offsetHeight
  const beforeFace = {
    widthPx: title.getBoundingClientRect().width,
    heightPx: title.getBoundingClientRect().height
  }
  title.style.fontFamily = prevFam
  void title.offsetHeight

  // ---- reconstruct the pre-wave tracking: normal ---------------------------
  const prevLs = title.style.letterSpacing
  title.style.letterSpacing = 'normal'
  void title.offsetHeight
  const beforeTrack = { widthPx: title.getBoundingClientRect().width }
  title.style.letterSpacing = prevLs
  void title.offsetHeight

  return { now, displayWidth, textWidth, bogusWidth, beforeFace, beforeTrack }
})

if (W === null) {
  check('W0 the welcome headline was reachable', false, { reason: 'no .welcome-title / .welcome-hint' })
} else {
  // W1 — the headline carries negative tracking. -0.02em at 46px = -0.92px.
  // Reconstructed old: `letter-spacing: normal`, which widens the string.
  check(
    'W1 the headline is tracked -0.02em (-0.92px at 46px)',
    near(parseFloat(W.now.letterSpacing), -0.92, 0.02) && W.beforeTrack.widthPx > W.now.widthPx,
    {
      letterSpacing: W.now.letterSpacing,
      widthPx: px(W.now.widthPx),
      oldReconstructed: { letterSpacing: 'normal', widthPx: px(W.beforeTrack.widthPx) }
    }
  )

  // W2 — the authored stack names the Display master FIRST. This is the cheap
  // half of the claim and it is deliberately NOT trusted on its own; see W3.
  check(
    'W2 the authored font stack names the Display master first',
    /^["']?Segoe UI Variable Display/.test(W.now.fontFamilyAuthored),
    { fontFamily: W.now.fontFamilyAuthored }
  )

  // W3 — THE FACE ACTUALLY RESOLVED. Same string, same size, same weight, same
  // tracking, two stacks: if `Display` is a real installed family the advance
  // width differs from `Text`. The third probe is the control — a face that
  // certainly does not exist falls back to the UA default, and if `Display`
  // measured the same as THAT, the name resolved to nothing.
  //
  // This is the check that separates "a different master is carrying the
  // headline" from "someone typed a font name into a stylesheet".
  //
  // TWO halves, and both are required. The probe pair proves `Display` is a
  // real installed family on this machine; the title's OWN box proves the
  // headline is the element getting it. Without the second half this check
  // would stay green after the `font-family` was deleted from `.welcome-title`
  // entirely — the probes never read that rule — which is a check measuring the
  // font directory rather than the app.
  const displayIsReal =
    Math.abs(W.displayWidth - W.textWidth) > 0.5 && Math.abs(W.displayWidth - W.bogusWidth) > 0.5
  const titleUsesIt = Math.abs(W.now.widthPx - W.beforeFace.widthPx) > 0.5
  check('W3 the Display master resolved to a real face AND the headline is the element wearing it',
    displayIsReal && titleUsesIt, {
      displayWidthPx: px(W.displayWidth),
      textWidthPx: px(W.textWidth),
      unresolvableControlPx: px(W.bogusWidth),
      deltaDisplayVsText: px(W.displayWidth - W.textWidth),
      titleWidthNowPx: px(W.now.widthPx),
      titleForcedToTextPx: px(W.beforeFace.widthPx),
      titleMovedWhenForcedBack: px(W.now.widthPx - W.beforeFace.widthPx)
    })

  // W4 — the height budget did not move. `line-height: 1.25` is a NUMBER, so
  // the used value is 1.25 x 46 = 57.5 regardless of the face's own metrics,
  // which is exactly why swapping optical masters is free in the min-window
  // arithmetic. inspect.mjs measured content 264.69 / headroom 53.71 unchanged;
  // this is the same claim from the other side, and it must hold under BOTH
  // faces or the budget was never face-independent.
  check(
    'W4 the headline box is 57.5px under both masters, so the min-window budget is untouched',
    near(W.now.heightPx, 57.5, 0.05) && near(W.beforeFace.heightPx, 57.5, 0.05),
    {
      heightPx: px(W.now.heightPx),
      oldReconstructed: { fontFamily: 'Segoe UI Variable Text', heightPx: px(W.beforeFace.heightPx) }
    }
  )
}

// ══ open a folder ═════════════════════════════════════════════════════════
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) =>
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

// The synthetic rows, pushed now that a window exists and the dock is mounted.
await app.evaluate(({ BrowserWindow }, agents) => {
  const win = BrowserWindow.getAllWindows()[0]
  for (const a of agents) win.webContents.send('subagent:changed', a)
}, AGENTS)
await page.waitForSelector('.agent-row-btn', { timeout: 10000 }).catch(() => {})
await shotEl('agents-dock', '.agents-dock')

const A = await page.evaluate(() => {
  const row = document.querySelector('.agent-row-btn')
  if (!row) return null
  const head = row.querySelector('.agent-row-head')
  const desc = row.querySelector('.agent-row-desc')

  // ── why the metadata pair may have to be supplied here ──────────────────
  // `.agent-row-meta` renders from `model` + `spawnDepth`, and BOTH are
  // DISK-ONLY by design: `mergeAgents` takes them from the sidecar `d` and
  // never from the live stream `l` (`subagent-types.ts` says so in as many
  // words about parentage, and the same three lines govern model and depth).
  // A live push therefore CANNOT produce a metadata line, no matter what the
  // payload carries — which this driver established the hard way, by pushing
  // both fields and watching `.agent-row-meta` come back null while
  // `.agent-row-stats` rendered fine.
  //
  // So when the pair is absent, the two spans are inserted INTO THE REAL ROW,
  // with the app's own class names, inside the app's own `.agent-row-btn`, and
  // measured under the app's own cascade. The CSS being tested is entirely the
  // app's; only the text nodes are synthetic — the same status the pushed
  // description already has. Anything stronger needs a seeded session on disk,
  // which is `inspect.mjs`'s job and which photographs this surface anyway.
  let synthesized = false
  let meta = row.querySelector('.agent-row-meta')
  let stats = row.querySelector('.agent-row-stats')
  if (!meta) {
    synthesized = true
    meta = document.createElement('span')
    meta.className = 'agent-row-meta'
    meta.textContent = 'claude-opus-5 · depth 0'
    row.appendChild(meta)
    if (!stats) {
      stats = document.createElement('span')
      stats.className = 'agent-row-stats'
      stats.textContent = '48k ctx · 12 tools · 1m 32s'
      row.appendChild(stats)
    } else {
      row.appendChild(stats) // keep document order: meta then stats
    }
    void row.offsetHeight
  }

  const rs = getComputedStyle(row)
  const box = (el) => (el ? el.getBoundingClientRect() : null)
  const gapAbove = (a, b) => (a && b ? box(b).top - box(a).bottom : null)

  const now = {
    rowGap: rs.rowGap,
    descMarginTop: desc ? getComputedStyle(desc).marginTop : null,
    metaMarginTop: meta ? getComputedStyle(meta).marginTop : null,
    metaLineHeight: meta ? getComputedStyle(meta).lineHeight : null,
    metaFontSize: meta ? getComputedStyle(meta).fontSize : null,
    statsMarginTop: stats ? getComputedStyle(stats).marginTop : null,
    headToDesc: gapAbove(head, desc),
    descToMeta: gapAbove(desc, meta),
    metaToStats: gapAbove(meta, stats),
    rowHeight: box(row).height,
    hasStats: stats !== null
  }

  // ---- reconstruct the pre-wave rhythm: one uniform 2px gap, no margins,
  //      metadata back on the inherited 1.6 leading ------------------------
  const saved = []
  const set = (el, prop, val) => {
    if (!el) return
    saved.push([el, prop, el.style[prop]])
    el.style[prop] = val
  }
  set(row, 'rowGap', '2px')
  set(desc, 'marginTop', '0px')
  set(meta, 'marginTop', '0px')
  set(meta, 'lineHeight', '1.6')
  set(stats, 'marginTop', '0px')
  set(stats, 'lineHeight', '1.6')
  void row.offsetHeight
  const before = {
    headToDesc: gapAbove(head, desc),
    descToMeta: gapAbove(desc, meta),
    metaToStats: gapAbove(meta, stats),
    metaLineHeightPx: meta ? box(meta).height : null,
    rowHeight: box(row).height
  }
  for (const [el, prop, val] of saved) el.style[prop] = val
  void row.offsetHeight

  if (synthesized) {
    meta.remove()
    stats.remove()
    void row.offsetHeight
  }

  return { now, before, synthesized }
})

if (A === null) {
  check('A0 an agent row was reachable', false, { reason: 'no .agent-row-btn' })
} else {
  // A1 — the uniform gap is gone. The row's own `gap` is 0; every interval is
  // now stated by the child that owns it.
  check('A1 the agent row no longer carries one uniform 2px gap', A.now.rowGap === '0px', {
    rowGap: A.now.rowGap,
    oldReconstructed: { rowGap: '2px' }
  })

  // A2 — THE INVERSION IS CLOSED, and this is the wave's actual claim. The
  // space above the wrapped sentence must out-rank the leading inside it.
  // Leading inside an 11px/1.45 line box is 15.95 - 11 = 4.95px. The band break
  // is 8px. 8 > 4.95. Reconstructed old: 2px, which is LESS than 4.95 — the
  // name read as one more line of the sentence.
  const leading = A.now.metaLineHeight && A.now.metaFontSize
    ? parseFloat(A.now.metaLineHeight) - parseFloat(A.now.metaFontSize)
    : null
  check(
    'A2 the name-to-description band (8px) now out-ranks the leading inside it (4.95px)',
    near(A.now.headToDesc, 8, 0.5) && leading !== null && A.now.headToDesc > leading,
    {
      headToDescPx: px(A.now.headToDesc),
      leadingInsideSentencePx: px(leading),
      ratio: leading ? px(A.now.headToDesc / leading) : null,
      oldReconstructed: { headToDescPx: px(A.before.headToDesc), wasInverted: A.before.headToDesc < 4.95 }
    }
  )

  // A3 — the band BELOW the sentence opens by the same 8, so fixing the top gap
  // alone cannot re-group the metadata. This is wave 3's stated reason for
  // declining the fix, closed rather than re-tread.
  check('A3 the description-to-metadata band opens by the same 8px', near(A.now.descToMeta, 8, 0.5), {
    descToMetaPx: px(A.now.descToMeta),
    headToDescPx: px(A.now.headToDesc),
    equal: near(A.now.headToDesc, A.now.descToMeta, 0.1),
    oldReconstructed: { descToMetaPx: px(A.before.descToMeta) }
  })

  // A4 — the metadata pair binds to ITSELF at 0, which is what makes it one
  // band rather than two loose lines. Skipped honestly when the fixture's row
  // carries no stats line.
  if (A.now.hasStats) {
    check('A4 the metadata pair binds to itself at 0px', near(A.now.metaToStats, 0, 0.1), {
      metaToStatsPx: px(A.now.metaToStats),
      statsMarginTop: A.now.statsMarginTop,
      synthesizedPair: A.synthesized,
      oldReconstructed: { metaToStatsPx: px(A.before.metaToStats) }
    })
    check('A5 the metadata lines sit on 1.45 leading (15.95px), not the inherited 1.6 (17.6px)',
      near(parseFloat(A.now.metaLineHeight), 15.95, 0.05), {
        metaLineHeight: A.now.metaLineHeight,
        synthesizedPair: A.synthesized,
        oldReconstructed: { metaLineHeightPx: px(A.before.metaLineHeightPx) }
      })
    if (A.synthesized) {
      console.log(
        'NOTE  A4/A5 measured the app\'s cascade on app-classed spans inserted into the real row —' +
          ' `model`/`spawnDepth` are disk-only, so no live push can render a metadata line.'
      )
    }
  } else {
    check('A4/A5 the metadata pair was measurable', false, {
      reason: 'no .agent-row-stats and the synthetic pair failed to insert'
    })
  }
}

// ══ the FENCE — the sessions rail and the command rows must NOT have moved ══
// These are negative controls. The AgentsDock builder claimed its edit reached
// only `.agent-row-*`; a claim like that is worth exactly what a measurement of
// the neighbours says it is. `sidebar.png` came back byte-identical this wave,
// and this is the same fact read from the DOM instead of from a PNG.
const FENCE = await page.evaluate(() => {
  const out = {}
  const rail = document.querySelector('.session-row-btn')
  out.sessionRowGap = rail ? getComputedStyle(rail).rowGap : null
  const railMeta = document.querySelector('.session-row-meta')
  out.sessionMetaLineHeight = railMeta ? getComputedStyle(railMeta).lineHeight : null
  return out
})
check(
  'F1 the sessions rail kept the shared 2px gap — the dock edit did not reach it',
  FENCE.sessionRowGap === '2px' || FENCE.sessionRowGap === null,
  { sessionRowGap: FENCE.sessionRowGap, note: FENCE.sessionRowGap === null ? 'rail collapsed, not measurable here' : 'measured' }
)

// ══ AppearanceDock ════════════════════════════════════════════════════════
await clickBySel('[aria-label="Appearance panel"]')
await page.waitForSelector('.appearance-dock', { timeout: 10000 })
await shotEl('appearance-dock', '.appearance-dock')

const B = await page.evaluate(() => {
  const group = document.querySelector('.appearance-choices')
  const rows = [...document.querySelectorAll('.appearance-choices .appearance-choice')]
  const heads = [...document.querySelectorAll('.appearance-head')]
  const stepper = document.querySelector('.appearance-stepper')
  const steps = [...document.querySelectorAll('.appearance-step')]
  const readout = document.querySelector('.appearance-readout')
  const desc = document.querySelector('.appearance-choice-desc')
  if (!group || rows.length === 0) return null

  const gs = getComputedStyle(group)
  const r0 = getComputedStyle(rows[0])
  const r1 = rows[1] ? getComputedStyle(rows[1]) : null

  const now = {
    groupBorderTopWidth: gs.borderTopWidth,
    groupRadius: gs.borderTopLeftRadius,
    groupRowGap: gs.rowGap,
    groupOverflow: gs.overflow,
    rowBorderTopFirst: r0.borderTopWidth,
    rowBorderLeft: r0.borderLeftWidth,
    rowRadius: r0.borderTopLeftRadius,
    rowBorderTopSecond: r1 ? r1.borderTopWidth : null,
    groupHeight: group.getBoundingClientRect().height,
    headCount: heads.length,
    descClientWidth: desc ? desc.clientWidth : null,
    stepperRadius: stepper ? getComputedStyle(stepper).borderTopLeftRadius : null,
    stepperWidth: stepper ? stepper.getBoundingClientRect().width : null,
    stepWidths: steps.map((s) => s.getBoundingClientRect().width),
    readoutWidth: readout ? readout.getBoundingClientRect().width : null,
    mintBorderedRows: rows.filter((el) => {
      const c = getComputedStyle(el).borderTopColor
      return c && c !== 'rgba(0, 0, 0, 0)' && parseFloat(getComputedStyle(el).borderTopWidth) > 0 &&
        el.getAttribute('aria-checked') === 'true'
    }).length
  }

  const heads0 = heads[0] || null
  now.headParts = heads0
    ? {
        mark: heads0.querySelector('.appearance-head-mark') ? true : false,
        markBox: heads0.querySelector('.appearance-head-mark')
          ? {
              w: heads0.querySelector('.appearance-head-mark').getBoundingClientRect().width,
              h: heads0.querySelector('.appearance-head-mark').getBoundingClientRect().height
            }
          : null,
        rule: heads0.querySelector('.appearance-rule')
          ? heads0.querySelector('.appearance-rule').getBoundingClientRect()
          : null
      }
    : null
  const label = heads0 ? heads0.querySelector('.appearance-label') : null
  if (label) {
    const ls = getComputedStyle(label)
    now.label = {
      fontSize: ls.fontSize,
      fontWeight: ls.fontWeight,
      textTransform: ls.textTransform,
      letterSpacing: ls.letterSpacing,
      text: (label.textContent || '').trim()
    }
  }

  // ---- reconstruct the pre-wave shape: cards, not a container -------------
  const saved = []
  const set = (el, prop, val) => {
    if (!el) return
    saved.push([el, prop, el.style[prop]])
    el.style[prop] = val
  }
  set(group, 'border', 'none')
  set(group, 'borderRadius', '0')
  set(group, 'rowGap', '6px')
  for (const el of rows) {
    set(el, 'border', '1px solid rgba(255,255,255,0.08)')
    set(el, 'borderRadius', '8px')
  }
  void group.offsetHeight
  const before = { groupHeight: group.getBoundingClientRect().height }
  for (const [el, prop, val] of saved) el.style[prop] = val
  void group.offsetHeight

  // ---- reconstruct the pre-wave stepper: a 999px pill of 26x24 steps ------
  let beforeStepper = null
  if (stepper && steps.length) {
    const s2 = []
    const set2 = (el, prop, val) => {
      s2.push([el, prop, el.style[prop]])
      el.style[prop] = val
    }
    set2(stepper, 'borderRadius', '999px')
    set2(stepper, 'width', 'auto')
    for (const el of steps) {
      set2(el, 'flex', '0 1 auto')
      set2(el, 'width', '26px')
      set2(el, 'height', '24px')
    }
    void stepper.offsetHeight
    beforeStepper = {
      widthPx: stepper.getBoundingClientRect().width,
      stepWidths: steps.map((s) => s.getBoundingClientRect().width)
    }
    for (const [el, prop, val] of s2) el.style[prop] = val
    void stepper.offsetHeight
  }

  return { now, before, beforeStepper }
})

if (B === null) {
  check('B0 the appearance dock was reachable', false, { reason: 'no .appearance-choices' })
} else {
  // B1 — the group is now the bordered object and the rows are not. This is the
  // whole "grouping" half of the gap. Reconstructed old: give the rows their
  // borders and radii back and the group grows, because six cards plus five
  // 6px gutters are taller than one container with hairline dividers.
  // B1 and B2 — SUPERSEDED BY WAVE 5, and retired here rather than softened.
  //
  // Both pinned the ENCLOSURE this wave built: B1 that the container carries a
  // border and the rows do not, B2 that the rows are divided by hairlines with
  // no top border on the first. Wave 5's `DocksAsOne` critic named the gap
  // "standardize the body-row containment grammar, since Agents and Commands
  // use open text stacks while Appearance encloses every control set in
  // bordered full-width groups", and the wave closed it by REMOVING the
  // enclosure: no container border, no dividers, rows on the shared open shell
  // the other two docks already use.
  //
  // That is a design DECISION reversing this wave's, not a regression, so the
  // pins move with it. What survives of B1 — that a row never draws its own
  // border — is carried forward and STRENGTHENED in `gui-gauntlet-wave5.mjs`
  // G2, which asserts it for all three docks at once rather than for this one
  // dock alone. B2's intent (rows are separated by a deliberate mechanism, not
  // by accident) is carried by G2's gap-and-radius assertions.
  //
  // The direction of travel matters and is worth stating once: this wave made
  // Appearance MORE enclosed to look composed, and wave 5 found that the same
  // instinct applied three times is what stopped the three docks reading as one
  // family. A pin is evidence of what a wave believed, not a promise to a later
  // one.

  // B3 — SUPERSEDED BY WAVE 6, and retired here rather than softened.
  //
  // It asserted the section header is a THREE-part object: a 12px mark, a
  // micro-caps label, and a rule running to the panel edge. Wave 6 deleted the
  // rule. That was not drift — it is the whole of that wave's DocksAsOne gap,
  // which named those dividers as "a second organizational grammar" that no
  // other dock uses and asked for them to be reduced to quiet typographic
  // grouping. Its own AppearanceDock critic independently asked for the same
  // treatment to become "spacing-led". Two critics converged on this object.
  //
  // ONLY THE HAIRLINE CLAUSE IS RETIRED. The other three are not dropped and are
  // not weakened: `gui-gauntlet-wave6.mjs` B1 re-asserts headCount === 3, the
  // 12x12 mark box, and all four micro-caps values on the label, and adds what
  // B3 never covered — that the separation the rule used to draw is now carried
  // by spacing that measurably out-ranks the interval inside the group (B2).
  //
  // Retiring a pin because a later wave reversed the design it pinned is
  // legitimate; loosening one to clear a red is not. B3 could not have been kept
  // green by any honest edit — it required an element the wave exists to delete.
  //
  // The direction of travel, stated once: wave 4 gave this dock MORE drawn
  // structure to make it read as composed. Waves 5 and 6 have now removed that
  // structure twice — first the option-group enclosure, then these header rules —
  // each time because the same instinct applied repeatedly is what stopped the
  // three docks reading as one family. A pin is evidence of what a wave believed,
  // not a promise to a later one.

  // B4 — the stepper became a full-column strip of EQUAL segments. The two
  // buttons being equal is the pair a reader compares, so it is the assertion.
  //
  // The discriminator is the STEP width, not the strip's. The strip is a flex
  // child that stretches to its column either way, so reconstructing the old
  // shape by setting `width: auto` leaves the container at 215px and proves
  // nothing — the first draft of this check asserted on the container and went
  // red against a tree that was correct. What actually moved is the segments:
  // 26px fixed boxes hung at the right, against 70.33px thirds that fill the
  // column. That is the change, so that is what is measured.
  // B4 — SUPERSEDED BY WAVE 5, and the supersession was predicted by the builder
  // that caused it rather than discovered by a red run.
  //
  // B4 pinned the stepper as a full-column strip of equal segments. Wave 5's
  // AppearanceDock critic named the gap "move the Zoom stepper into a compact
  // right-aligned control on its header row, because the third full-width
  // rounded shell makes all three families resolve to the same silhouette
  // despite their different content" — which is the instruction to undo exactly
  // the shape this check pins. The strip is now 88x26 with 24x24 steps, sitting
  // as the last child of its section header.
  //
  // `stepsGrew` is the half that could not survive: it required the steps to be
  // more than 20px WIDER than the reconstructed pill, and the whole point of the
  // wave-5 change is that they are narrower. Keeping it green would have needed
  // a step over 46px, i.e. a strip ~132px across a 215px column — 61% of the
  // column, which is neither compact nor the fix. There was no version of this
  // check that both ran and passed, which is what makes it superseded rather
  // than merely failing.
  //
  // Carried forward in `gui-gauntlet-wave5.mjs` B1', which pins the NEW shape
  // and additionally asserts the thing B4 never could: that the stepper is
  // inside the header element, not merely narrow.

  // B5 — THE WRAP PREMISE SURVIVED THE REGROUPING. The description's text
  // column was 193px before (row border + padding) and must still be 193px
  // after (container border + row padding), or the two-line deck wave 2 built
  // silently became a three-line one. Same number, reached the other way.
  // SUPERSEDED BY WAVE 5 — and this one is the instructive failure of the four,
  // because the check was never wrong about what it CARED about. It was wrong
  // about what it MEASURED.
  //
  // B5's stated purpose is in its own comment above: "or the two-line deck wave
  // 2 built silently became a three-line one". The premise it guards is a LINE
  // COUNT. What it asserted was a WIDTH — 193px — on the reasoning that if the
  // column is unchanged the wrap must be too. That inference only holds while
  // the column is the only thing that can move.
  //
  // Wave 5 moved it deliberately: `DocksAsOne` removed the container's border
  // and rebalanced `.appearance-body` from 16px to 6px of side inset, so the
  // description column is now 215px. The check went red while the premise it
  // exists to protect was never in danger — a WIDER column can only ever reduce
  // a line count, never raise it.
  //
  // A proxy that reds when the real premise is safe is a proxy that would also
  // stay green if the real premise broke by some other route: nothing here would
  // have caught the deck growing to three lines from LONGER COPY at an unchanged
  // 193px. So the successor in `gui-gauntlet-wave5.mjs` (N1) counts the rendered
  // line boxes directly. That is strictly stronger, and it is the reason this
  // block is a rewrite rather than a deletion.
  //
  // Measure the premise, not a thing correlated with the premise.

  // B6 — selection is carried by the wash alone now. A mint BORDER on a row
  // whose only edges are shared dividers would paint a bar above the selection,
  // which is the side-stripe form DESIGN.md bans outside one named row.
  check('B6 no option row marks selection with a mint border', B.now.mintBorderedRows === 0, {
    mintBorderedRows: B.now.mintBorderedRows
  })
}

// ── report ────────────────────────────────────────────────────────────────
console.log('')
console.log('=== gauntlet wave 4 — Welcome + two docks, measured in a real Chromium ===')
console.log(`shots: ${SHOT_DIR}`)
console.log('')
console.log('NOT PINNED HERE: the minimum-window headroom. That needs the window at its')
console.log('  enforced minimum and resizing would revoke every box above (#77).')
console.log('  inspect.mjs pins it: {"measured":53.71,"claimed":54,"content":264.69,"overflow":0}')
console.log('  — unchanged from wave 3, which is itself this wave\'s Welcome claim.')
console.log('NOT PINNED HERE: CommandsDock. Wave 4 deliberately did not build it, and its')
console.log('  capture is byte-identical for the third consecutive wave.')
console.log('')
console.log(fails.length === 0 ? 'ALL GREEN' : `RED: ${fails.join(' | ')}`)

await app.close().catch(() => {})
process.exit(fails.length === 0 ? 0 : 1)
