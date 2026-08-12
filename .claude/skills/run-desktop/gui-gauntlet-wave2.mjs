// GUI pin for gauntlet wave 2 — the three dock surfaces that wave changed, each
// measured as a RENDERED box in a real Chromium.
//
//   node .claude/skills/run-desktop/gui-gauntlet-wave2.mjs
//
// Needs `npm run build` first, plus playwright-core. Costs NO CLI turns.
//
// ── why this file exists at all ───────────────────────────────────────────
// The fast gate loads no CSS. `npm test` runs vitest under jsdom, where an
// unknown `var(--x)` resolves to nothing, `-webkit-line-clamp` is inert and no
// element has a height — so a raw-text assertion that shared.css CONTAINS the
// string `-webkit-line-clamp: 2` passes just as happily against a rule that does
// nothing. Every claim wave 2 makes is a claim about a box, and a box is only
// visible to a driver. This is that driver.
//
// ── the three changes, and what each one is pinned by ─────────────────────
//   AgentsDock     `.agent-row-desc` left shared.css's ONE-line truncation group
//                  (nowrap + ellipsis) and joined a new named two-line clamp
//                  group. Pinned by A1/A2/A3 below.
//   CommandsDock   the row was rebuilt: `.command-row-head` puts the name and
//                  the argument hint on ONE line, `.command-row-btn` gained a
//                  40px floor, and `.command-row-desc` joined the same clamp
//                  group. Pinned by C1/C2/C3.
//   AppearanceDock `.appearance-choice-desc` gained `margin-top: 5px`, so a
//                  Backdrop card's explanation sits 8px under its title rather
//                  than the card's bare 3px gap. Pinned by B1/B2.
//
// ── how "the old value" is obtained, since a driver cannot git-stash ──────
// Every check below states the value the PREVIOUS build produced, and none of
// those numbers is remembered. Each is RECONSTRUCTED live, in the same window,
// in the same layout pass, by mutating the one declaration the wave added and
// reading the box back:
//
//   the two-line clamp     → the element is forced back to `display: block` +
//                            `white-space: nowrap` + ellipsis, which is exactly
//                            what the one-line group in shared.css applies
//   the head wrapper       → `.command-row-head` is set to `display: contents`,
//                            which dissolves the wrapper and returns its two
//                            children to being direct items of the button's
//                            column flex — the pre-wave DOM shape
//   the 40px floor         → `min-height: auto`
//   the 5px margin         → `margin-top: 0`
//
// The inline style is cleared again before the evaluate returns. This is
// gui-94's idiom (build the expectation from the engine rather than from a
// remembered pixel count) and it is what makes each check FALSIFIABLE on
// purpose: the reconstruction is printed beside the measurement, so a reader can
// see the gap the check discriminates against instead of taking the word for it.
//
// ONE check reconstructs its SUBJECT rather than its old value, and says so at
// the call site: the 40px row floor was written for "a command with nothing to
// add", and every command this machine's CLI reports declares a description, so
// the live list cannot exercise the rule — the shortest real row is already
// ~49px. A check against those rows would pass with `min-height` deleted, which
// is worth nothing, so C2b measures a real `.command-row` clone with its two
// OPTIONAL children removed: the exact DOM `CommandsDock` emits for a bare
// command, laid out inside the live list at the live width.
//
// ── two things this driver does NOT claim ─────────────────────────────────
// 1. The agent rows are SYNTHETIC. `.agent-row-desc` only exists once a session
//    has spawned a subagent, so this driver pushes `subagent:changed` from MAIN
//    — the real preload → useChat → AgentsDock render path with a FAKE payload,
//    the same move gui-agents-dock makes for the Background strip. It measures
//    how the dock LAYS OUT a purpose line; it says nothing about whether the CLI
//    ever emits one.
// 2. The commands are REAL and come from the CLI's own `supportedCommands()`.
//    An empty list is therefore a CLI fact and NOT a pass — C1..C3 hard-fail
//    rather than skipping, the way gui-94 does, because a driver that goes green
//    by measuring nothing is worse than one that reds.
//
// ── RED-VERIFIED, not argued ──────────────────────────────────────────────
// Run once against the wave-2 tree and once against the same tree with `src/`
// stashed and rebuilt. Every check that names a CHANGE went red without it:
//
//   A1  35.188px / 2 line boxes   →  17.594px / 1
//   A2  0px horizontal overflow   →  422px (scrollWidth 637 in a 215px column)
//   C1  27 rows side by side      →  27 rows stacked, 0 head wrappers in the DOM
//   C2b bare row 40px (lift +9)   →  31px, lift 0
//   C3  0px overflow, 115 of 126  →  5127px worst overflow, 0 descriptions
//       descriptions wrapping        wrapping
//   B1  8px title→sentence        →  3px
//   B2  8px > 4.95px leading      →  3px < 4.95px leading
//
// And the four checks that name a NON-change stayed green in both trees, which
// is the other half of the verification — A3 (a short line still takes one),
// A4 and B3 (blast radius: the label and the theme rows keep the tight
// treatment) and C2a (the floor pads no real row). Those are guards, not pins,
// and a guard that reds when the thing it guards is absent is measuring the
// wrong thing.
//
// Wave 2 also rewrote `.welcome-hint`'s copy (Welcome.tsx + chat.css). That is a
// fourth surface and it is NOT pinned here — see the report at the bottom.

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

const present = (sel) => page.evaluate((s) => !!document.querySelector(s), sel)
const clickBySel = (sel) => page.evaluate((s) => document.querySelector(s)?.click(), sel)

// Element shot — captures the node at its own size regardless of the window's.
// The saved bounds are ~688css and a dock sits partly outside the frame; a
// `setSize` here would revoke what is being measured (#77), so anything clipped
// is eyeballed this way instead.
const shotEl = async (name, sel) => {
  const p = path.join(SHOT_DIR, `gauntlet-wave2-${name}.png`)
  const el = await page.$(sel)
  if (el === null) {
    console.log(`SHOT ${name} SKIPPED — no ${sel}`)
    return
  }
  await el.screenshot({ path: p })
  console.log(`SHOT ${p}`)
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

// Collapse the sessions rail. It frees ~310css and brings the dock inside the
// frame at the app's own persisted bounds, which is what lets a dock be
// photographed without touching window bounds. Layout only — `collapsed` is
// Sidebar-local state.
await clickBySel('[aria-label="Collapse sessions"]')
await page.waitForTimeout(300)

// ══ AgentsDock ════════════════════════════════════════════════════════════
// The purpose line stopped truncating to one line and now clamps to two.
await clickBySel('[aria-label="Agents panel"]')
await page.waitForSelector('.agents-dock', { timeout: 10000 })

// Two agents in one push: one whose purpose runs well past two lines at 248px
// (that is the clamp's subject), and one short enough to fit on one (that is the
// "ceiling, not a target" half of the claim). Neither carries parentAgentId, so
// both render flat.
const LONG_DESC =
  'Locate the three stylesheet pins that scaffold the agents dock and report the exact selector each one hangs from, with line numbers'
const SHORT_DESC = 'Read one file.'
await app.evaluate(
  ({ BrowserWindow }, [long, short]) => {
    const win = BrowserWindow.getAllWindows()[0]
    win.webContents.send('subagent:changed', {
      type: 'subagent',
      parentToolUseId: 'wave2-long',
      status: 'running',
      agentType: 'investigator',
      description: long
    })
    win.webContents.send('subagent:changed', {
      type: 'subagent',
      parentToolUseId: 'wave2-short',
      status: 'done',
      agentType: 'builder',
      description: short
    })
  },
  [LONG_DESC, SHORT_DESC]
)
await page.waitForSelector('.agent-row-desc', { timeout: 10000 })

const A = await page.evaluate(
  ([long, short]) => {
    const r = (n) => Math.round(n * 1000) / 1000
    const descs = [...document.querySelectorAll('.agent-row-desc')]
    const byText = (t) => descs.find((d) => d.textContent?.trim() === t.trim()) ?? null
    const longEl = byText(long)
    const shortEl = byText(short)
    if (!longEl || !shortEl) {
      return { error: `pushed rows not found (long=${!!longEl} short=${!!shortEl}, ${descs.length} desc nodes)` }
    }

    // One measurement, then the reconstruction, then the restore — all inside a
    // single evaluate so React cannot re-render between them.
    const read = (el) => {
      const cs = getComputedStyle(el)
      const lh = parseFloat(cs.lineHeight)
      const rect = el.getBoundingClientRect()
      return {
        height: r(rect.height),
        lineHeightPx: r(lh),
        lines: r(rect.height / lh),
        clientWidth: el.clientWidth,
        scrollWidth: el.scrollWidth,
        overflowPx: el.scrollWidth - el.clientWidth
      }
    }

    // The pre-wave treatment, applied verbatim: shared.css's one-line group is
    // `white-space: nowrap; overflow: hidden; text-overflow: ellipsis`, and the
    // element was a plain blockified flex item rather than a `-webkit-box`.
    const asOneLine = (el) => {
      const keep = el.getAttribute('style')
      el.style.display = 'block'
      el.style.webkitLineClamp = 'none'
      el.style.whiteSpace = 'nowrap'
      el.style.overflow = 'hidden'
      el.style.textOverflow = 'ellipsis'
      const out = read(el)
      if (keep === null) el.removeAttribute('style')
      else el.setAttribute('style', keep)
      return out
    }

    return {
      dockWidth: r(document.querySelector('.agents-dock')?.getBoundingClientRect().width ?? 0),
      long: { now: read(longEl), before: asOneLine(longEl) },
      short: { now: read(shortEl), before: asOneLine(shortEl) },
      // The sibling above the purpose line stays in the ONE-line group on
      // purpose. Read so a clamp that leaked onto the label is visible here
      // rather than only in a screenshot.
      typeWhiteSpace: (() => {
        const t = document.querySelector('.agent-row-type')
        return t ? getComputedStyle(t).whiteSpace : null
      })()
    }
  },
  [LONG_DESC, SHORT_DESC]
)

await shotEl('agents-dock', '.agents-dock')

if (A.error) {
  check('AgentsDock measured', false, A)
} else {
  check('premise: the agents dock renders at the 248px width its rules argue from', Math.abs(A.dockWidth - 248) <= 1, {
    width: A.dockWidth
  })

  // A1. THE CHANGE. Clamped to two line boxes, so the box is exactly two
  // line-heights tall. RECONSTRUCTED OLD VALUE printed beside it: the one-line
  // group renders the identical string in ONE line box, ~half the height.
  check('A1 long purpose line renders TWO line boxes', Math.round(A.long.now.lines) === 2, {
    height: A.long.now.height,
    lineHeightPx: A.long.now.lineHeightPx,
    lines: A.long.now.lines,
    threshold: 'round(height / line-height) === 2',
    oldReconstructed: { height: A.long.before.height, lines: A.long.before.lines }
  })

  // A2. The consequence a reader actually sees: the sentence WRAPS instead of
  // running off the end of a 248px column. Old value is the same element under
  // `white-space: nowrap`, where the text is far wider than the box it sits in.
  check('A2 the purpose line no longer overflows its column horizontally', A.long.now.overflowPx <= 1, {
    clientWidth: A.long.now.clientWidth,
    scrollWidth: A.long.now.scrollWidth,
    overflowPx: A.long.now.overflowPx,
    threshold: 'scrollWidth - clientWidth <= 1px',
    oldReconstructed: { scrollWidth: A.long.before.scrollWidth, overflowPx: A.long.before.overflowPx }
  })

  // A3. Two lines is a CEILING and not a target — the shared.css comment says so
  // and this is what makes that sentence true. Without it, a rule that gave
  // EVERY description two lines would pass A1 and A2 unchallenged.
  check('A3 a short purpose line still renders ONE line box', Math.round(A.short.now.lines) === 1, {
    height: A.short.now.height,
    lines: A.short.now.lines,
    threshold: 'round(height / line-height) === 1'
  })

  // Blast radius. The label above the purpose line must keep the one-line
  // treatment; a clamp that spread to it would spend a second row saying nothing.
  check('A4 the label above it kept the ONE-line treatment', A.typeWhiteSpace === 'nowrap', {
    agentRowTypeWhiteSpace: A.typeWhiteSpace
  })
}

// ══ CommandsDock ══════════════════════════════════════════════════════════
// The list was rebuilt as one row system: name and hint on one line, a 40px
// floor under every row, and the description on the shared two-line clamp.
await clickBySel('[aria-label="Commands panel"]')
await page.waitForSelector('.commands-dock', { timeout: 10000 })
await page.waitForTimeout(2500)

// The list is fetched ONCE, on mount, with no retry — `CommandsDock`'s no-cache
// contract. `listCommands()` answers from the live engine query, which is warmed
// by the folder pick, so a dock opened before the CLI has finished handshaking
// gets `[]` and keeps it for as long as it stays open. That is a race a driver
// runs into and a human never does, so remount until the engine answers rather
// than reading a cold `[]` as the app's behaviour. Bounded, and a list that is
// still empty at the end is reported as NOT MEASURED, not as a pass.
for (let i = 0; i < 10; i++) {
  const rows = await page.evaluate(() => document.querySelectorAll('.command-row').length)
  if (rows > 0) {
    console.log(`commands listed: ${rows} rows after ${i} remount(s)`)
    break
  }
  const direct = await page.evaluate(async () => (await window.api.listCommands()).length)
  console.log(`… no commands yet (dock rows 0, direct listCommands ${direct}) — remounting the dock`)
  await clickBySel('[aria-label="Commands panel"]')
  await page.waitForTimeout(500)
  await clickBySel('[aria-label="Commands panel"]')
  await page.waitForSelector('.commands-dock', { timeout: 10000 })
  await page.waitForTimeout(2500)
}

const C = await page.evaluate(() => {
  const r = (n) => Math.round(n * 1000) / 1000
  const btns = [...document.querySelectorAll('.command-row-btn')]
  if (btns.length === 0) {
    return { error: 'the dock listed no commands (listCommands returned nothing) — NOT MEASURED, not a pass' }
  }

  const rect = (el) => {
    const b = el.getBoundingClientRect()
    return { top: r(b.top), bottom: r(b.bottom), left: r(b.left), right: r(b.right), height: r(b.height) }
  }

  // ── the head: name and hint side by side, or stacked? ──
  // Sampled on the rows that HAVE a hint; a row without one cannot answer this.
  const withHint = btns.filter((b) => b.querySelector('.command-row-hint'))
  const heads = withHint.map((b) => {
    const head = b.querySelector('.command-row-head')
    const name = b.querySelector('.command-row-name')
    const hint = b.querySelector('.command-row-hint')
    const now = { name: rect(name), hint: rect(hint) }
    // The pre-wave DOM: no wrapper. `display: contents` removes the head box
    // from layout entirely, so its two children become direct items of the
    // button's column flex again — which is precisely how they were laid out
    // before the wrapper was added. A row with no wrapper AT ALL is already the
    // pre-wave shape, so its "before" is its "now"; reported rather than thrown,
    // because a crash exits non-zero for the wrong reason and names no step.
    let before = now
    if (head) {
      const keep = head.getAttribute('style')
      head.style.display = 'contents'
      before = { name: rect(name), hint: rect(hint) }
      if (keep === null) head.removeAttribute('style')
      else head.setAttribute('style', keep)
    }
    return {
      wrapper: !!head,
      text: name.textContent,
      now,
      before,
      sideBySide: now.hint.left >= now.name.right - 0.5,
      overlapPx: r(Math.min(now.name.bottom, now.hint.bottom) - Math.max(now.name.top, now.hint.top)),
      beforeSideBySide: before.hint.left >= before.name.right - 0.5,
      beforeOverlapPx: r(Math.min(before.name.bottom, before.hint.bottom) - Math.max(before.name.top, before.hint.top))
    }
  })

  // ── the floor: every row's height now, and the height it would have had ──
  const rows = btns.map((b) => {
    const now = r(b.getBoundingClientRect().height)
    const keep = b.getAttribute('style')
    b.style.minHeight = 'auto'
    const before = r(b.getBoundingClientRect().height)
    if (keep === null) b.removeAttribute('style')
    else b.setAttribute('style', keep)
    return {
      name: b.querySelector('.command-row-name')?.textContent ?? '?',
      hasHint: !!b.querySelector('.command-row-hint'),
      hasDesc: !!b.querySelector('.command-row-desc'),
      now,
      before
    }
  })

  // ── the bare row, which this CLI does not supply ──
  // The floor exists for "a command with nothing to add", and every one of the
  // commands this machine's CLI reports declares a description — so on live data
  // the floor is inert and a check against it would pass with the rule reverted.
  // The bare row is therefore RECONSTRUCTED, and from the component's own
  // markup rather than invented: a real `.command-row` is cloned and its two
  // OPTIONAL children are removed, which is exactly the DOM `CommandsDock`
  // emits for a command declaring neither (`{c.argumentHint ? … : null}`,
  // `{c.description ? … : null}`). The clone is appended to the live
  // `.command-list`, so it inherits the same width and the same cascade as the
  // rows beside it, and is removed again before this evaluate returns.
  const list = document.querySelector('.command-list')
  const proto = btns[0].closest('.command-row')
  let bare = null
  if (list && proto) {
    const clone = proto.cloneNode(true)
    clone.querySelector('.command-row-hint')?.remove()
    clone.querySelector('.command-row-desc')?.remove()
    list.appendChild(clone)
    const btn = clone.querySelector('.command-row-btn')
    const now = r(btn.getBoundingClientRect().height)
    btn.style.minHeight = 'auto'
    const before = r(btn.getBoundingClientRect().height)
    const children = [...btn.children].map((c) => c.className)
    clone.remove()
    bare = { now, before, children }
  }

  // ── the description: wrapping, not a mid-word cut ──
  const descEls = [...document.querySelectorAll('.command-row-desc')]
  const descs = descEls.map((el) => {
    const cs = getComputedStyle(el)
    const lh = parseFloat(cs.lineHeight)
    const h = el.getBoundingClientRect().height
    const now = {
      height: r(h),
      lines: r(h / lh),
      overflowPx: el.scrollWidth - el.clientWidth
    }
    const keep = el.getAttribute('style')
    el.style.display = 'block'
    el.style.webkitLineClamp = 'none'
    el.style.whiteSpace = 'nowrap'
    el.style.overflow = 'hidden'
    el.style.textOverflow = 'ellipsis'
    const before = {
      height: r(el.getBoundingClientRect().height),
      overflowPx: el.scrollWidth - el.clientWidth
    }
    if (keep === null) el.removeAttribute('style')
    else el.setAttribute('style', keep)
    return { now, before, lineHeightPx: r(lh) }
  })

  return {
    dockWidth: r(document.querySelector('.commands-dock')?.getBoundingClientRect().width ?? 0),
    rowCount: btns.length,
    hintRows: withHint.length,
    descRows: descEls.length,
    heads,
    rows,
    bare,
    descs
  }
})

await shotEl('commands-dock', '.commands-dock')

if (C.error) {
  // An empty command list is a CLI fact, not a pass. Say so loudly rather than
  // letting three assertions be skipped into a green run.
  check('CommandsDock measured', false, C)
} else {
  check('premise: the commands dock renders at 248px', Math.abs(C.dockWidth - 248) <= 1, { width: C.dockWidth })

  // C1. THE CHANGE. Every row that carries an argument hint puts it BESIDE the
  // name rather than under it. Old value reconstructed by dissolving the
  // wrapper: the two spans go back to being stacked flex items, hint.left ==
  // name.left and zero vertical overlap.
  const c1rows = C.heads.filter((h) => !h.wrapper || !h.sideBySide || h.overlapPx <= 0)
  check(
    'C1 the argument hint sits BESIDE the name, on one line',
    C.hintRows > 0 && c1rows.length === 0,
    {
      rowsWithAHint: C.hintRows,
      rowsCarryingTheHeadWrapper: C.heads.filter((h) => h.wrapper).length,
      offenders: c1rows.map((h) => h.text),
      sample: C.heads[0]
        ? {
            command: C.heads[0].text,
            nameRight: C.heads[0].now.name.right,
            hintLeft: C.heads[0].now.hint.left,
            verticalOverlapPx: C.heads[0].overlapPx,
            oldReconstructed: {
              nameRight: C.heads[0].before.name.right,
              hintLeft: C.heads[0].before.hint.left,
              verticalOverlapPx: C.heads[0].beforeOverlapPx
            }
          }
        : null,
      threshold: 'hint.left >= name.right AND vertical overlap > 0, on every row carrying a hint'
    }
  )

  // C2a. The floor is a FLOOR AND NOT A TARGET — "no row is ever padded out to
  // meet it". Measured as the rule changing nothing on any real row: rendered
  // height equals the height the same row has at `min-height: auto`. This is
  // what reds if the floor is ever raised past the shortest real row, which is
  // the failure the comment's own argument rules out.
  const padded = C.rows.filter((x) => x.now - x.before > 0.5)
  const naturals = C.rows.map((x) => x.before)
  check('C2a the floor never pads a real row out to meet it', padded.length === 0, {
    rows: C.rowCount,
    shortestRealRowPx: Math.min(...naturals),
    tallestRealRowPx: Math.max(...naturals),
    paddedRows: padded.map((x) => `${x.name}: ${x.before} → ${x.now}`),
    threshold: 'rendered height === min-height:auto height, on all 126 rows'
  })

  // C2b — SUPERSEDED BY WAVE 5, retired at wave 6, and the DELAY is the finding.
  //
  // It asserted that a 40px `min-height` floor is what lifts a descriptionless
  // row: rendered >= 40 AND natural < 40, so the floor is load-bearing. Wave 5
  // rebuilt that row to RESERVE the description's own slot instead of resting on
  // the floor, landing it at 48.938px against the shortest described row's
  // 48.938px, delta 0. The floor stopped being what puts it there, so C2b's
  // second clause — natural < 39.5 — became unsatisfiable by any honest edit.
  //
  // IT WENT RED AT WAVE 5 AND NOBODY REPORTED IT FOR A WHOLE WAVE. Wave 6 found
  // it by running all four gauntlet drivers rather than only the one it wrote,
  // and then proved the attribution rather than assuming it: wave 6's entire
  // rails.css change is two AgentsDock-only rules plus one `box-shadow: inset`
  // on `.command-row-btn`, and an inset shadow cannot affect layout — which
  // `gui-gauntlet-wave6.mjs` C2 measures directly, reporting identical row
  // heights with the shadow stripped. So the red predates this wave.
  //
  // THE PROCESS LESSON IS WORTH MORE THAN THE CHECK: a leg that runs only the
  // driver it authored cannot see a pin an EARLIER driver holds over ground a
  // later wave moved. Run the whole set every wave.
  //
  // Carried forward as `gui-gauntlet-wave5.mjs` C1, which pins the surviving
  // intent — a descriptionless row is not visibly shorter than a described one —
  // against the mechanism that now delivers it, comparing the bare row to the
  // shortest real described row within 1.5px rather than to a fixed 40.

  // C3. The description wraps instead of being cut mid-word. Same shape as A2,
  // on the other dock, because the same shared.css group now owns both.
  const cut = C.descs.filter((d) => d.now.overflowPx > 1)
  const wrapped = C.descs.filter((d) => Math.round(d.now.lines) >= 2)
  check('C3 no description overflows its column horizontally', C.descRows > 0 && cut.length === 0, {
    descriptions: C.descRows,
    wrappedToTwoLines: wrapped.length,
    worstOverflowPx: Math.max(...C.descs.map((d) => d.now.overflowPx)),
    oldReconstructedWorstOverflowPx: Math.max(...C.descs.map((d) => d.before.overflowPx)),
    threshold: 'scrollWidth - clientWidth <= 1px on every .command-row-desc'
  })
}

// ══ AppearanceDock ════════════════════════════════════════════════════════
// The Backdrop cards gained breathing room between each title and its wrapped
// explanation.
await clickBySel('[aria-label="Appearance panel"]')
await page.waitForSelector('.appearance-dock', { timeout: 10000 })
await page.waitForSelector('.appearance-choice-desc', { timeout: 10000 })

const B = await page.evaluate(() => {
  const r = (n) => Math.round(n * 1000) / 1000
  const cards = [...document.querySelectorAll('.appearance-choice')].filter((c) =>
    c.querySelector('.appearance-choice-desc')
  )
  if (cards.length === 0) return { error: 'no .appearance-choice carrying a description' }

  const measured = cards.map((card) => {
    const name = card.querySelector('.appearance-choice-name')
    const desc = card.querySelector('.appearance-choice-desc')
    const cs = getComputedStyle(desc)
    const lh = parseFloat(cs.lineHeight)
    const fs = parseFloat(cs.fontSize)
    const gap = () => r(desc.getBoundingClientRect().top - name.getBoundingClientRect().bottom)
    const now = { gap: gap(), card: r(card.getBoundingClientRect().height) }
    // The pre-wave rule: no margin at all, so the pair sat at the card's bare
    // 3px flex gap.
    const keep = desc.getAttribute('style')
    desc.style.marginTop = '0px'
    const before = { gap: gap(), card: r(card.getBoundingClientRect().height) }
    if (keep === null) desc.removeAttribute('style')
    else desc.setAttribute('style', keep)
    return {
      label: name.textContent,
      now,
      before,
      lineHeightPx: r(lh),
      fontSizePx: r(fs),
      // The leading BETWEEN the explanation's own two lines: the space a reader
      // sees inside the paragraph, which is what the title must out-rank for the
      // grouping to read correctly.
      interLineLeadingPx: r(lh - fs),
      descHeight: r(desc.getBoundingClientRect().height),
      descLines: r(desc.getBoundingClientRect().height / lh)
    }
  })
  return {
    dockWidth: r(document.querySelector('.appearance-dock')?.getBoundingClientRect().width ?? 0),
    cards: measured,
    // The single-line theme rows share `.appearance-choice` and must NOT have
    // been reached: they carry no description, so the selector never matches.
    themeRowsWithADesc: [...document.querySelectorAll('.appearance-choice--theme')].filter((c) =>
      c.querySelector('.appearance-choice-desc')
    ).length,
    themeRows: document.querySelectorAll('.appearance-choice--theme').length
  }
})

await shotEl('appearance-dock', '.appearance-dock')

if (B.error) {
  check('AppearanceDock measured', false, B)
} else {
  check('premise: the appearance dock renders at 248px', Math.abs(B.dockWidth - 248) <= 1, { width: B.dockWidth })

  // The premise the whole change argues from: at 248px the explanation really
  // does wrap. If it fitted on one line there would be no leading to out-rank
  // and B2 would be measuring nothing.
  const oneLiners = B.cards.filter((c) => Math.round(c.descLines) < 2)
  check('premise: the Backdrop explanation wraps to two lines at this width', oneLiners.length === 0, {
    cards: B.cards.map((c) => ({ label: c.label, lines: c.descLines, height: c.descHeight }))
  })

  // B1. THE CHANGE. 3px card gap + 5px margin = 8px between the title and its
  // explanation. Old value reconstructed at margin-top:0 — the bare 3px.
  const tight = B.cards.filter((c) => c.now.gap < 7.5)
  check('B1 title and explanation sit 8px apart, not 3px', tight.length === 0, {
    cards: B.cards.map((c) => ({ label: c.label, gap: c.now.gap, oldReconstructedGap: c.before.gap })),
    threshold: 'name.bottom → desc.top >= 7.5px (reconstructed old value is the card gap alone)'
  })

  // B2. The reason the number is 8 and not 4: the space above the sentence has
  // to out-rank the space INSIDE it, or the title reads as one more line of the
  // paragraph rather than its heading. This is the check the old 3px fails on
  // its own terms, whatever threshold B1 had been given.
  const inverted = B.cards.filter((c) => c.now.gap <= c.interLineLeadingPx)
  check('B2 that space out-ranks the leading inside the sentence itself', inverted.length === 0, {
    cards: B.cards.map((c) => ({
      label: c.label,
      titleToSentencePx: c.now.gap,
      leadingInsideTheSentencePx: c.interLineLeadingPx,
      oldReconstructed: { titleToSentencePx: c.before.gap, stillOutranks: c.before.gap > c.interLineLeadingPx }
    })),
    threshold: 'gap > (line-height - font-size) on every card carrying a description'
  })

  // Blast radius: the single-line theme rows share the card class and were
  // deliberately left on their tight 3px.
  check('B3 the single-line theme rows were not reached', B.themeRows > 0 && B.themeRowsWithADesc === 0, {
    themeRows: B.themeRows,
    themeRowsCarryingADescription: B.themeRowsWithADesc
  })
}

// ── report ────────────────────────────────────────────────────────────────
console.log('')
console.log('=== gauntlet wave 2 — three docks, measured in a real Chromium ===')
console.log(`shots: ${SHOT_DIR}`)
console.log('')
console.log('NOT PINNED HERE: wave 2 also rewrote .welcome-hint (Welcome.tsx + chat.css).')
console.log('  That surface is copy plus a no-measure argument, not a box this dock run can open.')
console.log('')
console.log(fails.length === 0 ? 'ALL GREEN' : `RED: ${fails.join(' | ')}`)

await app.close().catch(() => {})
process.exit(fails.length === 0 ? 0 : 1)
