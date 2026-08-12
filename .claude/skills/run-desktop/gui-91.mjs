// GUI eyeball for #91 — the LIVE BACKGROUND SESSIONS section in the sessions
// rail: read-only, manually refreshed, workspace-scoped, and above the stored
// transcripts.
//
// Which "agent" this is: the CLI's own **agent view** (`claude agents --json`),
// listing whole background Claude Code SESSIONS. Not this app's Agents dock
// (subagents inside the one open session — `gui-agents-dock.mjs`) and not the
// background TASKS inside the open session. `.context/flows.md` carries the
// collision table.
//
// ── what only this driver can see ─────────────────────────────────────────
// `tests/background-sessions.test.tsx` covers the parse, the states and the
// call counts in jsdom. Three things it cannot reach, and this driver exists
// for them:
//
//   1. THE SPAWN ACTUALLY WORKS ON THIS MACHINE. The section's first look runs
//      a real `claude agents --json --cwd <temp dir>` out of main, through
//      `cli-path.ts`'s PATH walk. vitest never spawns anything. The temp
//      workspace guarantees zero rows, so the honest answer is "None running
//      here" — and "Could not list background sessions." is a real failure of
//      the whole route, not a cosmetic one.
//   2. NO TIMER, measured through the real IPC channel rather than a React
//      mock. The handler is replaced with a counting one AFTER the first look
//      settles; a quiet counter over 8s is only a measurement because the
//      refresh click below is shown to move it. An absence that could not have
//      been observed is this project's most-repeated bug (#76, #82, #93, #94).
//   3. THE ACCENT BUDGET. `DESIGN.md` spends mint on five named things and this
//      is none of them. jsdom loads no CSS, so nothing in `tests/` can tell
//      whether a status list quietly took a colour.
//
// Rows are pushed through a scripted handler, like `gui-agents-dock.mjs` does
// with `tasks:changed`: it measures the RENDERER's draw of a listing. Whether
// the CLI produces one is #90's separate measurement, and the `kind` filter
// that drops the app's own session is main's — mutation-verified in vitest,
// not here.
//
// RED-VERIFIED against `main` before the work: `.bg-sessions` is not in the DOM
// at all, so AC1 and everything downstream of it fail.
//
//   node .claude/skills/run-desktop/gui-91.mjs
//
// Needs `npm run build` first, plus playwright-core.

import { _electron as electron } from 'playwright-core'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import { profileArgs } from './driver-profile.mjs'

const APP_DIR = path.resolve(import.meta.dirname, '../../..')
const SHOT_DIR = process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')
fs.mkdirSync(SHOT_DIR, { recursive: true })

const WORK_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'gui91-'))

setTimeout(() => {
  console.log('TIMEOUT')
  process.exit(1)
}, 180000).unref?.()

// The pin from tests/background-sessions.test.tsx, re-asserted in a real window:
// Permission mode, Backend mode, Commands panel, Appearance panel, Agents panel,
// Minimize, Maximize, Close. #91 adds a SECTION, so this must not move.
const TITLEBAR_CONTROLS = 8

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

const bad = []
const notes = []

// ── #156 — a stalled capture may not cost the assertions ──────────────────
// A CAPTURE HERE IS EVIDENCE, NEVER AN ASSERTION. Neither `shotEmpty` nor
// `shotRows` is read by anything in `bad` — they are written, their paths are
// printed, and that is all. Yet a bare `await page.screenshot(...)` threw out of
// the first one, which in a top-level-await module aborts the run: phases 2 and 3
// never ran, so ONE missing artifact cost eight assertions it has no bearing on
// — the titlebar pin, the no-timer measurement, the row rendering and the accent
// budget. It surfaced as a raw `TimeoutError` with no verdict line at all, which
// `dom-phase.mjs` reads as plain FAIL (exit ≠ 0, no `FAIL` line to quote), so it
// was also indistinguishable from a real product break.
//
// ── what was measured, in scripts/spike-156-screenshot-stall.mjs ──────────
// A WORKING capture here costs **32-41ms** on an idle machine and **40-60ms**
// with eleven cores saturated, against playwright-core's **30000ms** default —
// which this driver inherits, because it passes no `timeout` and no driver in
// this repo calls `setDefaultTimeout`. So a capture that spends the whole budget
// is **hung, not slow**, and the ticket's "a timeout too tight for a cold
// renderer" is refuted by a factor of 500 even under load.
//
// The stall reproduces deterministically when the window's frames are withheld
// (minimise it): the capture blocks, and it recovers the moment they return. The
// transferable half is which witnesses are BLIND to it — while the capture hung,
// the renderer reported `visibilityState: "visible"`, `document.hidden: false`
// and fired `requestAnimationFrame` at **0ms**. So no renderer-side settle can
// see this condition, which refutes the ticket's other direction too: a
// `waitForLoadState` gap is not what this is, and awaiting a frame would not
// detect it. `win.isVisible()` in MAIN was the only witness that moved, which is
// why the report below asks main rather than the page.
//
// NOT A RETRY, and the ticket forbids one for a good reason. The capture is
// attempted exactly once. What changes is the blast radius and the vocabulary:
// the stall is recorded with its attribution, the run continues to its real
// verdict, and the artifact's absence is named. The ordering is deliberate — a
// genuine product failure is read FIRST, so an instrument problem can never
// soften a real red to UNSCORED, and a run whose only casualty is the evidence
// declines to score (#143's vocabulary) rather than reporting a PASS that has
// quietly stopped producing screenshots (#148's lesson).
//
// THE UNDERLYING STALL IS NOT FIXED HERE and was not reproduced in 28 runs on
// this tree (16 idle, 12 saturated). This bounds its cost and makes the next
// occurrence self-attributing; it does not claim the cause.
const stalledCaptures = []
const capture = async (file, label) => {
  const t0 = Date.now()
  try {
    await page.screenshot({ path: file })
    return true
  } catch (e) {
    const win = await app
      .evaluate(({ BrowserWindow }) => {
        const w = BrowserWindow.getAllWindows()[0]
        if (!w) return { noWindow: true }
        return { isVisible: w.isVisible(), isMinimized: w.isMinimized(), isFocused: w.isFocused() }
      })
      .catch((err) => ({ unreadable: String(err.message || err).split('\n')[0] }))
    stalledCaptures.push({
      label,
      ms: Date.now() - t0,
      error: e.name || 'Error',
      message: String(e.message || '').split('\n')[0],
      win
    })
    return false
  }
}

// Open the temp workspace. DOM-dispatched: Playwright's actionability wait hangs
// on the intro animation.
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find(
    (b) =>
      b.getAttribute('aria-label') === 'Pick a project folder' ||
      b.textContent?.includes('Pick a project folder')
  )
  btn?.click()
})
await page.waitForTimeout(3500)

// ── 1. the real spawn ─────────────────────────────────────────────────────
// One CLI process, ~893ms (#90). Allow generously for a cold start before
// reading which of the two honest answers the section settled on.
await page.waitForTimeout(6000)

// THE EMPTY STATE IS TWO AUTHORED LINES, and this read used to fuse them.
//
// It asserted `textContent === 'None running here'` on the CONTAINER. That was
// right while the container held one string, and became a whole-versus-part
// comparison the moment the scoping note shipped beside it: `.bg-sessions-empty`
// is `display: flex; flex-direction: column`, so the answer and the note are two
// separate boxes, and `textContent` walks text nodes and inserts nothing for a
// box boundary — hence `None running hereScoped to the open project.`
//
// RESOLVED IN FAVOUR OF THE COPY (#135). Two authored lines, two classes, two
// tint steps; the assertion is what went stale, and it went stale silently
// because nothing ran it for three waves of the `core-surfaces` gauntlet.
//
// THE REJECTED OPTION was to put a separator into the markup so `textContent`
// reads cleanly. Rejected twice over: it edits shipped markup to suit a
// measuring instrument, which is the same move as adjusting a capture to make a
// hash go green; and it would fix nothing anybody experiences, because the two
// lines are already two boxes. So the fix is to measure the two lines AS two —
// each element read on its own, plus `innerText`, which unlike `textContent` is
// layout-aware and breaks between block-level boxes. That last read turns "the
// two lines are still two lines" from an assumption into a pin.
const REAL = await page.evaluate(() => {
  const sec = document.querySelector('.bg-sessions')
  if (!sec) return { missing: true }
  const empty = sec.querySelector('.bg-sessions-empty')
  return {
    missing: false,
    // The whole band, for the one-string branches (`Looking…`, the failed look).
    text: (empty?.textContent || '').trim(),
    // The settled answer and its note, each read from the element that owns it.
    answer: (sec.querySelector('.bg-sessions-empty-line')?.textContent || '').trim(),
    hint: (sec.querySelector('.bg-sessions-empty-hint')?.textContent || '').trim(),
    // Layout-aware: what a reader gets, rather than what the DOM string says.
    renderedLines: (empty?.innerText || '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean),
    // GEOMETRY, because `innerText` turned out not to be the pin it looked like.
    // Measured while writing this: flipping `.bg-sessions-empty` to
    // `flex-direction: row` puts the note BESIDE the answer, and `innerText`
    // still reported two lines — flex items are block-level boxes whichever way
    // the container runs them, so it breaks between them either way. The check
    // that catches a side-by-side is where the boxes actually sit.
    stacked: (() => {
      const a = sec.querySelector('.bg-sessions-empty-line')?.getBoundingClientRect()
      const h = sec.querySelector('.bg-sessions-empty-hint')?.getBoundingClientRect()
      if (!a || !h) return null
      return { answerBottom: Math.round(a.bottom), hintTop: Math.round(h.top), below: h.top >= a.bottom - 1 }
    })(),
    rows: sec.querySelectorAll('.bg-session-row').length
  }
})

if (REAL.missing) {
  bad.push('AC1 .bg-sessions is not in the DOM — the section does not exist')
} else if (REAL.text === 'Looking…') {
  bad.push('SPAWN the first look had not settled after 9.5s — NOT MEASURED, not a pass')
} else if (REAL.text.startsWith('Could not list')) {
  bad.push(
    'SPAWN the real `claude agents --json --cwd <temp>` look FAILED — the child_process route is broken on this machine (or no claude on PATH)'
  )
} else if (REAL.rows > 0) {
  // A temp dir cannot own background sessions. Rows here would mean --cwd is
  // not scoping at all, which is the one thing #90 left partly unmeasured.
  bad.push(
    `SCOPE the temp workspace listed ${REAL.rows} background session(s) — --cwd is not scoping the way #90 measured`
  )
} else {
  // The settled empty state, asserted line by line rather than as one fused
  // string. See the note on the read above for why the copy won this argument.
  if (REAL.answer !== 'None running here') {
    bad.push(`SPAWN unexpected empty-state answer ${JSON.stringify(REAL.answer)}`)
  }
  if (REAL.hint !== 'Scoped to the open project.') {
    bad.push(`SPAWN unexpected empty-state note ${JSON.stringify(REAL.hint)}`)
  }
  // AC: the note explains why the list is empty, and it must not collapse into
  // the answer. Two pins, because the first one alone is weaker than it looks:
  //
  //   renderedLines  catches the note being DELETED, or the two spans being
  //                  made genuinely inline. It does NOT catch a side-by-side —
  //                  measured, not assumed: `flex-direction: row` still reports
  //                  two lines, because flex items are block-level boxes
  //                  whichever direction the container runs.
  //   stacked        catches the side-by-side, by asking where the boxes are.
  //
  // Neither is visible to jsdom, which loads no CSS at all — which is the whole
  // reason a driver owns this and `tests/background-sessions.test.tsx` cannot.
  if (REAL.renderedLines.length !== 2) {
    bad.push(
      `A11Y the empty state renders as ${REAL.renderedLines.length} line(s), want 2 — ${JSON.stringify(REAL.renderedLines)}`
    )
  }
  if (!REAL.stacked) {
    bad.push('A11Y the answer and its note are not both in the DOM, so the two-line layout could not be measured')
  } else if (!REAL.stacked.below) {
    bad.push(
      `A11Y the note sits BESIDE the answer rather than under it (answer bottom ${REAL.stacked.answerBottom}, note top ${REAL.stacked.hintTop}) — two authored lines rendering as one`
    )
  }
}

const shotEmpty = path.join(SHOT_DIR, 'gui-91-rail-empty.png')
await capture(shotEmpty, 'empty, real look')

// ── 2. structure, placement and the titlebar pin ──────────────────────────
const S = await page.evaluate(() => {
  const sec = document.querySelector('.bg-sessions')
  if (!sec) return { error: 'no .bg-sessions' }
  const filter = document.querySelector('.sidebar-filter')
  const scope = document.querySelector('.session-scope')
  const after = (a, b) =>
    !!(a && b && a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)
  const cs = getComputedStyle(sec)
  const rect = sec.getBoundingClientRect()
  return {
    label: sec.getAttribute('aria-label'),
    tag: sec.tagName,
    heading: (sec.querySelector('.bg-sessions-title')?.textContent || '').trim(),
    // "Visibly distinct from the stored-transcript groups below it" (AC1): its
    // own heading, plus a hairline that no other band in the rail's body has.
    borderBottom: cs.borderBottomWidth,
    borderColor: cs.borderBottomColor,
    height: Math.round(rect.height * 100) / 100,
    railHeight: Math.round(
      (document.querySelector('.sidebar')?.getBoundingClientRect().height || 0) * 100
    ) / 100,
    filterBelow: after(sec, filter),
    scopeBelow: after(sec, scope),
    // .session-groups only mounts once the store has rows; a temp workspace has
    // none, so its absence here is expected and reported rather than asserted.
    groupsPresent: !!document.querySelector('.session-groups'),
    groupsBelow: after(sec, document.querySelector('.session-groups')),
    controls: [...sec.querySelectorAll('button')].map((b) => b.getAttribute('aria-label')),
    titlebarControls: document.querySelector('.titlebar')?.querySelectorAll('button').length ?? -1
  }
})

if (S.error) {
  bad.push(`AC1 ${S.error}`)
} else {
  if (S.label !== 'Background sessions') {
    bad.push(`AC1 section aria-label is ${JSON.stringify(S.label)}, want "Background sessions"`)
  }
  if (S.heading !== 'Background sessions') {
    bad.push(`AC1 section heading is ${JSON.stringify(S.heading)}`)
  }
  if (parseFloat(S.borderBottom) <= 0) {
    bad.push('AC1 the section has no hairline separating it from the stored list below')
  }
  if (!S.filterBelow) bad.push('AC1 .sidebar-filter is not below the section')
  if (!S.scopeBelow) bad.push('AC1 .session-scope is not below the section')
  if (S.groupsPresent && !S.groupsBelow) {
    bad.push('AC1 .session-groups is not below the section')
  }
  if (!S.groupsPresent) {
    notes.push('.session-groups absent — the temp workspace has no stored sessions, so the stored-list ordering was checked against the filter and scope bands only')
  }
  // AC7 — nothing here may add a titlebar control.
  if (S.titlebarControls !== TITLEBAR_CONTROLS) {
    bad.push(
      `AC7 titlebar control count is ${S.titlebarControls}, pinned at ${TITLEBAR_CONTROLS}`
    )
  }
  if (S.controls.length !== 1 || S.controls[0] !== 'Refresh background sessions') {
    bad.push(`AC2 section controls are ${JSON.stringify(S.controls)}, want exactly one refresh`)
  }
}

// ── 3. no timer, and rows on demand ───────────────────────────────────────
// Replace the handler in MAIN, after the real look has already happened, so the
// count below is of the real IPC channel rather than of a renderer stub.
const UNPREDICTED_STATE = 'a-state-nobody-predicted'
await app.evaluate(({ ipcMain }, unpredicted) => {
  globalThis.__bg91 = {
    calls: 0,
    rows: [
      { sessionId: 'bg-aaaa-1111', name: 'nightly docs sweep', state: 'working', startedAt: 1 },
      { sessionId: 'bg-bbbb-2222', name: 'flake hunt', state: unpredicted, startedAt: 2 },
      { sessionId: 'bg-cccc-3333', startedAt: 3 }
    ]
  }
  ipcMain.removeHandler('background-sessions:list')
  ipcMain.handle('background-sessions:list', async () => {
    globalThis.__bg91.calls++
    return globalThis.__bg91.rows
  })
}, UNPREDICTED_STATE)

// Eight quiet seconds. Nothing in the app may look during them.
await page.waitForTimeout(8000)
const idleCalls = await app.evaluate(() => globalThis.__bg91.calls)
if (idleCalls !== 0) {
  bad.push(
    `AC2 something repopulated the list without being asked: ${idleCalls} look(s) in 8 idle seconds`
  )
}

await page.evaluate(() =>
  document.querySelector('[aria-label="Refresh background sessions"]')?.click()
)
await page.waitForTimeout(1500)

const clickedCalls = await app.evaluate(() => globalThis.__bg91.calls)
if (clickedCalls !== 1) {
  // If the click did not move the counter, the zero above measured nothing.
  bad.push(
    `AC2 the refresh control drove ${clickedCalls} look(s), want exactly 1 — so the idle count above is NOT MEASURED`
  )
}

const R = await page.evaluate(() => {
  const sec = document.querySelector('.bg-sessions')
  if (!sec) return { error: 'no .bg-sessions' }
  const rows = [...sec.querySelectorAll('.bg-session-row')]
  const probe = document.createElement('div')
  probe.style.cssText = 'position:absolute;left:-9999px;top:0'
  document.body.appendChild(probe)
  probe.style.color = 'var(--mint)'
  const MINT = getComputedStyle(probe).color
  probe.style.fontSize = 'var(--fs-ui)'
  const FS_UI = getComputedStyle(probe).fontSize
  probe.style.fontSize = 'var(--fs-micro)'
  const FS_MICRO = getComputedStyle(probe).fontSize
  probe.remove()

  const list = sec.querySelector('.bg-session-list')
  return {
    count: rows.length,
    names: rows.map((r) => (r.querySelector('.bg-session-name')?.textContent || '').trim()),
    states: rows.map((r) => (r.querySelector('.bg-session-state')?.textContent || '').trim()),
    // AC: read-only. Any control inside a row would be an attach affordance the
    // ticket puts out of scope, and a tab stop on a rail that has ~100.
    rowControls: rows.reduce((n, r) => n + r.querySelectorAll('button,a,input,select').length, 0),
    MINT,
    FS_UI,
    FS_MICRO,
    nameSize: rows[0] ? getComputedStyle(rows[0].querySelector('.bg-session-name')).fontSize : null,
    stateSize: rows[1]
      ? getComputedStyle(rows[1].querySelector('.bg-session-state')).fontSize
      : null,
    // Every painted colour in the section, so a mint that crept in anywhere —
    // text, border or background — is caught rather than just the two we thought to look at.
    paints: [...sec.querySelectorAll('*')].flatMap((el) => {
      const c = getComputedStyle(el)
      return [c.color, c.backgroundColor, c.borderBottomColor, c.borderLeftColor, c.fill]
    }),
    listScrolls: list ? list.scrollHeight > list.clientHeight + 1 : null,
    sectionHeight: Math.round(sec.getBoundingClientRect().height * 100) / 100
  }
})

if (R.error) {
  bad.push(`AC2 ${R.error}`)
} else {
  if (R.count !== 3) {
    bad.push(`AC2 refresh rendered ${R.count} rows, want 3 — NOT MEASURED beyond this point`)
  } else {
    // AC4 — the raw string, verbatim. An allow-list would render this as blank.
    if (!R.states.includes(UNPREDICTED_STATE)) {
      bad.push(
        `AC4 the unpredicted state ${JSON.stringify(UNPREDICTED_STATE)} did not render raw; states were ${JSON.stringify(R.states)}`
      )
    }
    // AC3 — the nameless row falls back to its sessionId, which is the key.
    if (!R.names.includes('bg-cccc-3333')) {
      bad.push(`AC3 the nameless row did not fall back to its sessionId; names were ${JSON.stringify(R.names)}`)
    }
    if (R.rowControls !== 0) {
      bad.push(`READ-ONLY rows carry ${R.rowControls} interactive element(s), want 0`)
    }
    if (R.nameSize && R.nameSize !== R.FS_UI) {
      bad.push(`DESIGN .bg-session-name is ${R.nameSize}, want --fs-ui ${R.FS_UI}`)
    }
    if (R.stateSize && R.stateSize !== R.FS_MICRO) {
      bad.push(`DESIGN .bg-session-state is ${R.stateSize}, want --fs-micro ${R.FS_MICRO}`)
    }
    const mintHits = R.paints.filter((c) => c && c === R.MINT).length
    if (mintHits > 0) {
      bad.push(
        `DESIGN the section paints the accent ${mintHits}x (${R.MINT}) — the mint budget is spent on the logo, avatar, send button, list markers and typing dots, and this is none of them`
      )
    }
  }
}

const shotRows = path.join(SHOT_DIR, 'gui-91-rail-rows.png')
await capture(shotRows, 'rows, scripted')

// ── report ────────────────────────────────────────────────────────────────
console.log('=== #91 background-sessions section in the sessions rail ===')
console.log(`real look (temp workspace) : ${REAL.missing ? 'SECTION ABSENT' : `${JSON.stringify(REAL.text)}, ${REAL.rows} rows`}`)
if (!REAL.missing) {
  // Printed apart, because the fused string above is the thing that misled an
  // assertion for three gauntlet waves and it should never be the only read on
  // screen again.
  console.log(`  answer / note            : ${JSON.stringify(REAL.answer)} / ${JSON.stringify(REAL.hint)}`)
  console.log(`  rendered lines (innerText): ${JSON.stringify(REAL.renderedLines)}`)
}
if (!S.error) {
  console.log(`section                    : <${S.tag.toLowerCase()}> "${S.heading}" (aria-label ${JSON.stringify(S.label)})`)
  console.log(`hairline                   : ${S.borderBottom} ${S.borderColor}`)
  console.log(`order                      : filter below ${S.filterBelow}, scope below ${S.scopeBelow}, groups below ${S.groupsBelow} (present ${S.groupsPresent})`)
  console.log(`titlebar controls          : ${S.titlebarControls} (pinned ${TITLEBAR_CONTROLS})`)
  console.log(`section controls           : ${JSON.stringify(S.controls)}`)
}
console.log(`looks while idle 8s        : ${idleCalls}`)
console.log(`looks after one refresh    : ${clickedCalls}`)
if (!R.error) {
  console.log(`rows rendered              : ${R.count}`)
  console.log(`  names                    : ${JSON.stringify(R.names)}`)
  console.log(`  states (raw)             : ${JSON.stringify(R.states)}`)
  console.log(`  interactive in rows      : ${R.rowControls}`)
  console.log(`type                       : name ${R.nameSize} (--fs-ui ${R.FS_UI}), state ${R.stateSize} (--fs-micro ${R.FS_MICRO})`)
  console.log(`accent                     : --mint ${R.MINT}, hits in section ${R.paints.filter((c) => c && c === R.MINT).length}`)
  console.log(`section height             : ${R.sectionHeight}px of rail ${S.railHeight}px, list scrolls ${R.listScrolls}`)
}
console.log('')
for (const n of notes) console.log(`note: ${n}`)
console.log(`screenshot (empty, real look): ${shotEmpty}`)
console.log(`screenshot (rows, scripted)  : ${shotRows}`)
for (const s of stalledCaptures) {
  // Lower-case on purpose: `dom-phase.mjs` quotes the first line matching
  // /^FAIL\b/, and a stalled capture is not the verdict.
  console.log(
    `capture STALLED (${s.label}): ${s.ms}ms ${s.error} — ${s.message}; window (from main) ${JSON.stringify(s.win)}`
  )
}
// `bad` is read FIRST, so a real product red is never downgraded by a missing
// artifact. 0 PASS / 1 FAIL / 2 UNSCORED is the protocol dom-phase already reads.
const verdict = bad.length > 0 ? 1 : stalledCaptures.length > 0 ? 2 : 0
console.log(
  verdict === 1
    ? 'FAIL: ' + bad.join(' | ')
    : verdict === 2
      ? `UNSCORED: every assertion held, but ${stalledCaptures.length} capture(s) stalled, so this run produced no eyeball evidence — see the window state above (#156)`
      : 'PASS'
)

setTimeout(() => process.exit(verdict), 4000).unref?.()
await app.close().catch(() => {})
try {
  fs.rmSync(WORK_DIR, { recursive: true, force: true })
} catch {
  console.log(`(left behind: ${WORK_DIR})`)
}
process.exit(verdict)
