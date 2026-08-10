// The consolidated `inspect:` command (#131) — capture the five core surfaces
// of the BUILT app into one directory, in one run, with no human present.
//
//   SCREENSHOT_DIR=<dir> node .claude/skills/run-desktop/inspect.mjs
//
// WHY THIS EXISTS. `/preset gauntlet` grades the running UI against
// `.gauntlet/bar/`, and it refuses to start without a command that can show it
// the app. `driver.mjs` waits for the two titlebar pills and exits without ever
// picking a project folder, so it sees Welcome and Titlebar and nothing else —
// two of eleven surfaces. About twenty ticket-specific `gui-*.mjs` drivers in
// this directory already open workspaces and drive live sessions; this is a
// HARVEST of what they solved, not a new mechanism. Everything below was taken
// from a driver that already worked:
//
//   * the folder-picker stub in MAIN            — gui-129:133, gui-123:105
//   * seeding a transcript straight into the
//     CLI store so a rich chat replays with
//     no engine and no CLI turn               — gui-63
//   * DOM-dispatched clicks, because
//     Playwright's actionability wait hangs
//     on the intro animation                  — gui-93/95/96/98/122/123
//   * `setZoomFactor(1)` before any capture    — gui-124:499, gui-126:120
//
// WHAT IT PRODUCES, one PNG per surface, named for the surface so a wave can
// address exactly one of them:
//
//   welcome.png     titlebar.png    sidebar.png    chat.png    input-bar.png
//   window-welcome.png              window-session.png
//
// The two `window-*.png` frames are the whole window at each stage. They are not
// a sixth and seventh surface — they exist because a surface clipped to its own
// bounding box cannot answer a composition question ("does this float in dead
// space"), and every reference in `.gauntlet/bar/linear/` is a whole-page frame.
// A critic comparing composition needs a comparable unit.
//
// A CAPTURE FAILURE IS LOUD, and that is the point rather than a nicety. A bar
// folder that quietly came back half-empty reads exactly like a surface that had
// nothing wrong with it, so every surface is proven RENDERED before it is
// photographed, and the run exits non-zero naming the surface if it was not:
//
//   1. the element exists, and its box has real extent inside the viewport;
//   2. it is not display:none / visibility:hidden / opacity:0;
//   3. it carries the content that makes it that surface (a chat with no
//      messages is a column, and tells a critic nothing about rhythm);
//   4. the file was written, and the frame is denser than a MEASURED photograph
//      of this app's own empty background. Point 3 is what actually proves a
//      surface is not blank; point 4 is a weak backstop whose two attempted
//      thresholds were both refuted by measuring them (see `flatControl`).
//
// WHAT IT DOES NOT DO, deliberately: it spends ZERO CLI turns and needs no
// engine. The transcript is seeded on disk and replayed, so the same command
// produces the same five surfaces on a machine with no Claude Code session, no
// network and no API key.
//
// WHAT NO DRIVER CAN SEE: the DWM acrylic backdrop. The app's wash is
// translucent and composited by Windows; these captures show a flat ground where
// the running app is not. That is an instrument artifact and is recorded in
// `.gauntlet/bar/README.md` — colour, translucency and material are out of
// scope for anything judged from these files.
//
// Needs `npm run build` first (a launch timeout at 30s means `out/` is stale),
// plus `npm i --no-save playwright-core`. Must stay under the project tree: ESM
// resolves the bare `playwright-core` import by walking up to the project's
// node_modules.

import { _electron as electron } from 'playwright-core'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

// `fileURLToPath`, never `URL.pathname` — this repo's own path contains a space.
const APP_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const SHOT_DIR = process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')
fs.mkdirSync(SHOT_DIR, { recursive: true })

// Requested, not assumed: the window may be clamped by the display, so the size
// actually captured is read back and reported rather than written down here.
const WANT_WIDTH = 1440
const WANT_HEIGHT = 900

// How much denser than the app's own empty background a capture must be before
// it counts as a picture of something. NOT a byte threshold, and deliberately
// only just above 1 — see `flatControl` for both measurements that put it there.
const MIN_DENSITY_RATIO = 1

const log = (label, m) => console.log(String(label).padEnd(12) + JSON.stringify(m))
const fails = []
const written = []

// ---- the fixture ------------------------------------------------------------
//
// A session seeded straight into the CLI's own store, exactly as gui-63 does it:
// the app enumerates `~/.claude/projects/*/`, reads each transcript's `cwd`, and
// lists the ones belonging to the open workspace. The store directory name is
// arbitrary; the `cwd` field is what binds a transcript to a workspace.
//
// The content is chosen for RHYTHM, because that is what a critic reads off the
// chat surface: two user turns of different lengths, prose replies that wrap
// over several lines, and two tool cards — a Read whose result is long enough to
// be truncated, and an Edit that supplies both strings so its card can offer a
// diff. A single "hello" would render a technically-non-empty column that shows
// a critic nothing.

const SID = crypto.randomUUID()
const WORKSPACE = fs.mkdtempSync(path.join(os.tmpdir(), 'inspect-ws-'))
const STORE_DIR = path.join(os.homedir(), '.claude', 'projects', `inspect-${SID.slice(0, 8)}`)

const FIRST_PROMPT = 'Why does the sessions rail go empty after I flip the backend pill?'
const SECOND_PROMPT = 'Makes sense. Add a regression test for the rebuild path.'

const READ_INPUT = { file_path: 'src/main/list-engine.ts', offset: 1, limit: 60 }
const READ_RESULT = [
  'export const ensureListEngine = async (ports: ListEnginePorts): Promise<Engine> => {',
  '  const live = ports.get()',
  '  if (live) return live',
  '  const rebuilt = await ports.make()',
  '  await rebuilt.warmUp(ports.pendingResume())',
  '  ports.set(rebuilt)',
  '  return rebuilt',
  '}'
].join('\n')

const EDIT_OLD = [
  '  const engine = getEngine()',
  '  if (!engine) return []',
  '  return engine.listModels()'
].join('\n')
const EDIT_NEW = [
  '  const engine = await ensureListEngine(listEnginePorts)',
  '  return engine.listModels()'
].join('\n')

// This transcript is PHOTOGRAPHED and then judged against DESIGN.md, so it is
// held to the product's own copy rules rather than to comment style. DESIGN.md
// "Bans in force" forbids em dashes in copy: a gauntlet critic reading these
// captures cannot tell fixture prose from shipped prose, and wave 1 duly
// returned a SPEC BREAK on the Chat surface for two em dashes that lived here
// rather than in the renderer. Keep the replies em-dash free so the finding
// stays available for real copy defects.
const REPLY_ONE = [
  'Flipping the pill discards the engine, and both list handlers read straight',
  'off that handle, so the menu asks a null engine and gets an empty array back.',
  'The list is not cached anywhere, which is deliberate: the answer genuinely',
  'differs between backends, so a cache would be wrong rather than merely stale.'
].join(' ')
const REPLY_TWO = [
  'Rebuilding lazily at the two read handlers, rather than eagerly when the',
  'engine is discarded. Eager costs every user a rebuild on every pill click,',
  'including the one who never opens a menu.'
].join(' ')
const REPLY_THREE = 'Added. It drives a flip, then reads both lists back and asserts neither is empty.'

const base = {
  parentUuid: null,
  isSidechain: false,
  userType: 'external',
  entrypoint: 'cli',
  cwd: WORKSPACE,
  sessionId: SID,
  version: '2.1.220',
  gitBranch: 'main'
}
const at = (agoMs) => new Date(Date.now() - agoMs).toISOString()
const line = (rec) => JSON.stringify(rec) + '\n'

const userMsg = (uuid, parent, text, agoMs) => ({
  ...base,
  parentUuid: parent,
  type: 'user',
  message: { role: 'user', content: text },
  uuid,
  timestamp: at(agoMs)
})
const assistantText = (uuid, parent, text, agoMs) => ({
  ...base,
  parentUuid: parent,
  type: 'assistant',
  message: { role: 'assistant', content: [{ type: 'text', text }] },
  uuid,
  timestamp: at(agoMs)
})
const toolUse = (uuid, parent, id, name, input, agoMs) => ({
  ...base,
  parentUuid: parent,
  type: 'assistant',
  message: { role: 'assistant', content: [{ type: 'tool_use', id, name, input }] },
  uuid,
  timestamp: at(agoMs)
})
const toolResult = (uuid, parent, id, text, agoMs) => ({
  ...base,
  parentUuid: parent,
  type: 'user',
  message: {
    role: 'user',
    content: [{ tool_use_id: id, type: 'tool_result', content: text, is_error: false }]
  },
  uuid,
  timestamp: at(agoMs)
})

const u = () => crypto.randomUUID()
const [uA, uB, uC, uD, uE, uF, uG, uH] = [u(), u(), u(), u(), u(), u(), u(), u()]

fs.mkdirSync(STORE_DIR, { recursive: true })
fs.writeFileSync(
  path.join(STORE_DIR, `${SID}.jsonl`),
  line(userMsg(uA, null, FIRST_PROMPT, 600000)) +
    line(assistantText(uB, uA, REPLY_ONE, 596000)) +
    line(toolUse(uC, uB, 'tu-inspect-read', 'Read', READ_INPUT, 594000)) +
    line(toolResult(uD, uC, 'tu-inspect-read', READ_RESULT, 592000)) +
    line(assistantText(uE, uD, REPLY_TWO, 590000)) +
    line(toolUse(uF, uE, 'tu-inspect-edit', 'Edit', {
      file_path: 'src/main/index.ts',
      old_string: EDIT_OLD,
      new_string: EDIT_NEW,
      replace_all: false
    }, 588000)) +
    line(toolResult(uG, uF, 'tu-inspect-edit', 'The file src/main/index.ts has been updated.', 586000)) +
    line(userMsg(uH, uG, SECOND_PROMPT, 120000)) +
    line(assistantText(u(), uH, REPLY_THREE, 118000))
)

let cleaned = false
const cleanup = () => {
  if (cleaned) return
  cleaned = true
  for (const dir of [STORE_DIR, WORKSPACE]) {
    try {
      fs.rmSync(dir, { recursive: true, force: true })
    } catch {}
  }
}

// ---- the five surfaces ------------------------------------------------------
//
// `requires` is what makes the surface itself rather than an empty shell of it.
// Each entry is asserted inside the surface's own subtree, so a chat column that
// replayed nothing fails HERE, loudly, instead of producing a photograph of
// blank space that a critic would read as a design opinion.

const SURFACES = [
  {
    name: 'welcome',
    stage: 'welcome',
    selector: '.welcome',
    requires: [
      ['.welcome-title', 'the hero has no title'],
      ['.pick-folder-btn', 'the empty state offers no action']
    ]
  },
  {
    name: 'titlebar',
    stage: 'session',
    selector: 'header.titlebar',
    requires: [
      ['[aria-label="Backend mode"]', 'the backend pill is absent'],
      ['[aria-label="Permission mode"]', 'the permission pill is absent']
    ]
  },
  {
    name: 'sidebar',
    stage: 'session',
    selector: 'aside.sidebar',
    requires: [
      ['.sidebar-title', 'the rail has no heading'],
      ['.session-row-btn', 'the rail lists no session, so its rows cannot be judged']
    ]
  },
  {
    name: 'chat',
    stage: 'session',
    selector: 'main.chat',
    requires: [
      ['.msg-user', 'no user message replayed'],
      ['.msg-assistant', 'no assistant message replayed'],
      ['.tool-card', 'no tool card replayed'],
      ['.date-divider', 'the date divider is absent']
    ]
  },
  {
    name: 'input-bar',
    stage: 'session',
    selector: 'footer.input-bar',
    requires: [['.message-input', 'the composer field is absent']]
  }
]

// ---- launch -----------------------------------------------------------------

const electronBin =
  process.platform === 'win32'
    ? path.join(APP_DIR, 'node_modules/electron/dist/electron.exe')
    : process.platform === 'darwin'
      ? path.join(APP_DIR, 'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron')
      : path.join(APP_DIR, 'node_modules/electron/dist/electron')

let app = null
let page = null

// The watchdog owns the leak. Every exit below routes through `finish`, and this
// covers the one case `finish` cannot — a hang inside an await that never
// settles, which would otherwise strand an Electron process with no window.
const watchdog = setTimeout(() => {
  console.log('TIMEOUT     the run exceeded 240s')
  app?.close().catch(() => {})
  cleanup()
  process.exit(1)
}, 240000)
watchdog.unref?.()

const EXPECTED_FILES = SURFACES.length + 2

const finish = async () => {
  // The count is asserted, not inferred. Every failure above also pushes a
  // reason, so a green run should already imply a full directory — but that is a
  // chain of reasoning, and the thing this must never do is hand back a
  // half-empty bar folder that reads as a complete one. A structural check costs
  // nothing and does not rely on the chain holding.
  if (fails.length === 0 && written.length !== EXPECTED_FILES) {
    fails.push(
      `only ${written.length} of ${EXPECTED_FILES} files were written and no surface reported why — a surface was skipped rather than captured or refused`
    )
  }
  const ok = fails.length === 0
  console.log(`DIR         ${SHOT_DIR}`)
  for (const f of written) console.log(`FILE        ${f}`)
  console.log(ok ? 'PASS' : 'FAIL')
  for (const f of fails) console.log('  - ' + f)
  if (!ok) console.log(`CAPTURED    ${written.length}/${EXPECTED_FILES} files`)
  clearTimeout(watchdog)
  await app?.close().catch(() => {})
  cleanup()
  process.exit(ok ? 0 : 1)
}

const settle = async (ms = 700) => page.waitForTimeout(ms)

// THE NEGATIVE CONTROL, and the reason there is no hand-written byte threshold.
//
// The first version of this driver floored every capture at a fixed
// bytes-per-kilopixel, on the reasoning that a flat frame compresses to almost
// nothing. Measuring it refuted that: pointed at `.welcome-mark` — a 44x44 solid
// mint fill, about as blank as a region can be — the capture scored 404
// bytes/kpx, the HIGHEST reading of the run, because PNG's fixed ~700 bytes of
// header and chunk overhead dwarfs an area of two kilopixels. Density tracks
// content only once the area is large enough for the overhead to disappear.
//
// So the floor is measured instead of assumed: photograph a region of this
// app's own empty background at a comparable scale, and require a real surface
// to be denser than that.
//
// THE RATIO IS 1, NOT 2, AND THE SECOND MEASUREMENT IS WHY. At 2x this control
// failed WELCOME — which is a legitimately sparse hero (a mark, a title, one
// line of hint, one button, centred in 1440x852) and scores 14.47 against the
// background's 10.77, a margin of 34%. That is a false positive of exactly the
// kind this repo has paid for nine times: an instrument artifact reported as a
// finding about the UI. Density cannot separate "sparse by design" from "blank"
// with any confidence, so the check is kept only at the strength the numbers
// support — a real surface must beat pure background, and nothing more is
// claimed. The 34% margin on the sparsest surface is thin, and it is stated
// rather than dressed up.
//
// THE DOM ASSERTIONS IN `capture` ARE THE PRIMARY BLANKNESS GUARD, and they are
// precise where this is weak: a chat that replayed nothing has no `.msg-user` to
// find, whatever its pixels compress to. This is the backstop, not the test.
const flatControl = async () => {
  const clip = await page.evaluate(() => {
    const w = window.innerWidth
    const h = window.innerHeight
    // Top-right quadrant of the welcome stage: the hero is centred, so this is
    // background. Verified rather than assumed — see `hit` below.
    const c = { x: Math.round(w * 0.68), y: Math.round(h * 0.12), width: 320, height: 320 }
    const el = document.elementFromPoint(c.x + c.width / 2, c.y + c.height / 2)
    return { ...c, hit: el ? el.className || el.tagName : null }
  })
  // If a control landed in that quadrant the region is not background, and a
  // floor taken from it would be too high — every surface would fail for a
  // reason that is about the instrument. Report unscored instead of guessing.
  if (typeof clip.hit !== 'string' || !/^(welcome|app)\b/.test(clip.hit)) {
    log('CONTROL', { skipped: true, hit: clip.hit })
    return null
  }
  const file = path.join(SHOT_DIR, '.flat-control.png')
  await page.screenshot({
    path: file,
    clip: { x: clip.x, y: clip.y, width: clip.width, height: clip.height }
  })
  const bytes = fs.statSync(file).size
  try {
    fs.rmSync(file, { force: true })
  } catch {}
  const density = Number((bytes / ((clip.width * clip.height) / 1000)).toFixed(2))
  log('CONTROL', { hit: clip.hit, bytes, density, floor: density * MIN_DENSITY_RATIO })
  return density
}
let flatDensity = null

// Every capture is gated on the surface being proven present and painted first.
const capture = async (surface) => {
  const probe = await page.evaluate((sel) => {
    const el = document.querySelector(sel)
    if (!el) return { found: false }
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    return {
      found: true,
      box: {
        x: Math.round(r.x),
        y: Math.round(r.y),
        w: Math.round(r.width),
        h: Math.round(r.height)
      },
      display: cs.display,
      visibility: cs.visibility,
      opacity: cs.opacity,
      textLength: (el.textContent ?? '').trim().length,
      viewport: { w: window.innerWidth, h: window.innerHeight }
    }
  }, surface.selector)

  if (!probe.found) {
    fails.push(
      `${surface.name}: no element matches ${surface.selector} — the surface never rendered, so nothing was captured for it`
    )
    return
  }
  if (probe.box.w < 1 || probe.box.h < 1) {
    fails.push(
      `${surface.name}: ${surface.selector} has a ${probe.box.w}x${probe.box.h} box — it is in the DOM but occupies no space`
    )
    return
  }
  if (probe.display === 'none' || probe.visibility === 'hidden' || Number(probe.opacity) === 0) {
    fails.push(
      `${surface.name}: ${surface.selector} computes display:${probe.display} visibility:${probe.visibility} opacity:${probe.opacity} — it is present but not painted`
    )
    return
  }
  // Off-screen is not a capture. An element scrolled or positioned outside the
  // window photographs as whatever happens to be under the clip.
  if (probe.box.x + probe.box.w <= 0 || probe.box.y + probe.box.h <= 0) {
    fails.push(
      `${surface.name}: ${surface.selector} sits outside the viewport at ${JSON.stringify(probe.box)} (viewport ${probe.viewport.w}x${probe.viewport.h})`
    )
    return
  }

  const missing = []
  for (const [sel, why] of surface.requires) {
    const present = await page.evaluate(
      ([root, child]) => !!document.querySelector(root)?.querySelector(child),
      [surface.selector, sel]
    )
    if (!present) missing.push(`${why} (${sel})`)
  }
  if (missing.length) {
    fails.push(
      `${surface.name}: the surface rendered but is EMPTY of what makes it that surface — ${missing.join('; ')}. A photograph of it would read as a design finding rather than as the instrument failure it is`
    )
    return
  }

  const file = path.join(SHOT_DIR, `${surface.name}.png`)
  try {
    await page.locator(surface.selector).first().screenshot({ path: file, timeout: 15000 })
  } catch (e) {
    fails.push(
      `${surface.name}: the screenshot itself failed — ${String(e && e.message).split('\n')[0]}`
    )
    return
  }

  const bytes = fs.statSync(file).size
  const kpx = (probe.box.w * probe.box.h) / 1000
  const density = Number((bytes / Math.max(kpx, 1)).toFixed(2))
  log('SURFACE', { name: surface.name, box: probe.box, text: probe.textLength, bytes, density })
  if (flatDensity !== null && density < flatDensity * MIN_DENSITY_RATIO) {
    fails.push(
      `${surface.name}: the capture is ${density} bytes/kilopixel against ${flatDensity} for this app's own empty background — it is a flat frame, which is what a window that failed to paint looks like, not a picture of the UI`
    )
    return
  }
  written.push(path.relative(APP_DIR, file).replace(/\\/g, '/'))
}

const captureWindow = async (name) => {
  const file = path.join(SHOT_DIR, `window-${name}.png`)
  try {
    await page.screenshot({ path: file, timeout: 15000 })
  } catch (e) {
    fails.push(`window-${name}: the frame capture failed — ${String(e && e.message).split('\n')[0]}`)
    return
  }
  written.push(path.relative(APP_DIR, file).replace(/\\/g, '/'))
}

try {
  app = await electron.launch({
    executablePath: electronBin,
    args: ['--no-sandbox', '--disable-gpu', '.'],
    cwd: APP_DIR,
    env: process.env,
    timeout: 30000
  })

  // Before any click that opens one. The path travels as an ARGUMENT, never
  // inside a string literal — this repo's own path contains a space.
  await app.evaluate(({ dialog }, dir) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [dir] })
  }, WORKSPACE)

  page = await app.firstWindow()
  await page.waitForLoadState('domcontentloaded')
  await page.waitForSelector('[aria-label="Backend mode"]', { timeout: 20000 })

  // Determinism, both halves. The zoom factor is persisted per origin in
  // `userData` AND in the renderer's own localStorage, so a previous session's
  // zoom survives into this run and would silently change every captured scale;
  // the bounds are remembered across launches (#79) for the same reason.
  const frame = await app.evaluate(
    ({ BrowserWindow }, want) => {
      const w = BrowserWindow.getAllWindows()[0]
      w.webContents.setZoomFactor(1)
      w.unmaximize?.()
      w.setBounds({ x: 40, y: 40, width: want.width, height: want.height })
      w.show()
      w.focus()
      const b = w.getBounds()
      return { width: b.width, height: b.height, zoom: w.webContents.getZoomFactor() }
    },
    { width: WANT_WIDTH, height: WANT_HEIGHT }
  )
  log('FRAME', frame)
  if (frame.zoom !== 1) {
    fails.push(
      `the window reports zoom ${frame.zoom} after being normalised — every capture below is at the wrong scale, so the run is UNSCORED rather than a finding about the UI`
    )
    await finish()
  }

  // ---- stage 1: welcome, before a folder is picked --------------------------

  // The intro is a 200ms entry over a 150ms transition; a value read behind
  // either is not a settled one, and neither is a photograph of it.
  await settle(900)
  flatDensity = await flatControl()
  for (const s of SURFACES.filter((s) => s.stage === 'welcome')) await capture(s)
  await captureWindow('welcome')

  // ---- stage 2: a workspace with a real conversation in it ------------------

  // DOM-dispatched: Playwright's actionability wait hangs on the intro animation.
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(
      (b) =>
        b.getAttribute('aria-label') === 'Pick a project folder' ||
        b.textContent?.includes('Pick a project folder')
    )
    btn?.click()
  })
  const opened = await page
    .waitForSelector('.message-input', { timeout: 25000 })
    .then(() => true)
    .catch(() => false)
  if (!opened) {
    fails.push(
      'the workspace never opened after the folder pick — four of the five surfaces only exist once a folder is open, so none of them were captured'
    )
    await finish()
  }

  // The seeded session has to appear in the rail before it can be opened. The
  // rail refreshes on demand, so this asks rather than waits.
  let rowFound = false
  for (let i = 0; i < 12 && !rowFound; i++) {
    rowFound = await page.evaluate((seed) => {
      const row = [...document.querySelectorAll('.session-row-btn')].find((b) =>
        b.querySelector('.session-row-title')?.textContent?.includes(seed)
      )
      row?.click()
      return !!row
    }, FIRST_PROMPT.slice(0, 24))
    if (!rowFound) {
      await page.evaluate(() => document.querySelector('[aria-label="Refresh sessions"]')?.click())
      await page.waitForTimeout(800)
    }
  }
  if (!rowFound) {
    fails.push(
      'the seeded session never appeared in the sessions rail — the chat surface would have been captured empty, which is an instrument failure and not a finding about message rhythm'
    )
    await finish()
  }

  let replayed = 0
  for (let i = 0; i < 20 && replayed < 2; i++) {
    await page.waitForTimeout(400)
    replayed = await page.evaluate(() => document.querySelectorAll('.tool-card').length)
  }
  if (replayed < 2) {
    fails.push(
      `the opened session replayed ${replayed} tool card(s), expected 2 — the fixture did not reach the pane, so the chat capture would not show what it claims to`
    )
    await finish()
  }

  // Nothing hovered, nothing focused: a stray hover wash or focus ring in a
  // capture is a state the critic did not ask to see, and hover-revealed
  // controls would appear on exactly one message row.
  await page.evaluate(() => document.activeElement?.blur?.())
  await page.mouse.move(4, 4)
  await settle(900)

  for (const s of SURFACES.filter((s) => s.stage === 'session')) await capture(s)
  await captureWindow('session')

  await finish()
} catch (e) {
  // A throw anywhere above still closes the app. A driver whose red path leaks
  // the Electron process is a trap this repo has already paid for.
  fails.push(`the run threw before it finished: ${String(e && e.stack ? e.stack : e).split('\n').slice(0, 3).join(' | ')}`)
  await finish()
}
