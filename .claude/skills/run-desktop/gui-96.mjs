// GUI eyeball for #96 — the two authored values that sat off the scale
// `DESIGN.md` names now conform, the two that are accepted exceptions still do
// not, and conforming the first one did not move a line box.
//
//   node .claude/skills/run-desktop/gui-96.mjs
//
// Needs `npm run build` first, plus playwright-core. Costs NO CLI turns.
//
// Why a driver is mandatory here: jsdom can see neither a computed font-weight
// nor an animation duration, so nothing in `tests/` pins either value, in either
// direction. This is the only guard on all five criteria.
//
// THE THREE THINGS THIS DRIVER IS BUILT AROUND
//
// 1. `animation: none !important` would make criteria 3 and 4 measure NOTHING.
//    `base.css:92` kills every animation under `prefers-reduced-motion: reduce`,
//    globally and on purpose. Under that media state `animationDuration` reads
//    `0s` for the conforming value AND for the exceptions, so criterion 3 would
//    pass for the wrong reason and criterion 4 would fail for one. The media
//    state is forced to `no-preference` AND the premise is then re-read from the
//    page, because forcing something is not the same as it having taken.
//
// 2. Criterion 5 is an "unchanged" assertion, and this project has been bitten
//    six times by those (#76, #82, #93, #94, #91, #95). Measuring the row before
//    and after the source edit cannot work in one run, and measuring "the row is
//    400 and its height is H" would pass trivially against any H. So the row is
//    driven through BOTH weights in-run — forced to 400, measured, forced to
//    500, measured, restored — which is non-vacuous in the red run and the green
//    run alike, and is exactly the quantity the criterion is about: does this
//    weight change move the box. #94 was this bug one property over.
//
// 3. Criterion 4 is a POSITIVE assertion that two accepted exceptions still read
//    1.4s. The ticket asks for it that way so a later tidy-up that "conforms"
//    them reds. `.subagent-row--running .subagent-row-dot` is measured on a LIVE
//    element (the synthetic subagent below is genuinely `running`).
//    `.agent-map-halo` is measured on a PROBE element carrying that class — the
//    rule is a bare single-class selector, so the probe resolves it through the
//    real cascade, but say plainly that it is a probe and not the agent map.
//
// The drawer is opened WITHOUT a live turn, by pushing `chat:event` from main —
// #95's finding, and the same trick `gui-agents-dock.mjs` uses. The synthetic
// part is only the two seed events; the drawer, the row, the dot and every style
// below are the app's real components in a real window.
//
// Criterion 2 is a source-level check (a grep the ticket names), so it is done
// with `fs` rather than in the page. It is the one check here that is not a
// measurement of the running app, and it is labelled as such.
//
// RED-VERIFIED against main before the fix: criteria 1, 2 and 3 fail (weight
// 500, one grep hit, 180ms) while 4 and 5 pass, and the run exits 1.

import { _electron as electron } from 'playwright-core'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'

const APP_DIR = path.resolve(import.meta.dirname, '../../..')
const STYLE_DIR = path.join(APP_DIR, 'src/renderer/src/styles')
const SHOT_DIR = process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')
fs.mkdirSync(SHOT_DIR, { recursive: true })

// Only the basename is ever printed — #90's scrubbing rule keeps the OS
// username out of anything that lands in the repo.
const WORK_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'gui96-'))

const ITEM = '.model-menu-item'
const DRAWER = '.subagent-drawer'
const ROW = '.subagent-row'
const PARENT_TOOL_USE_ID = 'gui96-task'

const fails = []
const check = (label, ok, detail) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ${JSON.stringify(detail)}`)
  if (!ok) fails.push(label)
}

setTimeout(() => {
  console.log('TIMEOUT')
  process.exit(1)
}, 180000).unref?.()

// `0.2s` / `200ms` / `0.18s` all reach here; compare in ms, never as strings.
const ms = (v) => {
  if (!v) return null
  const s = String(v).trim().split(',')[0].trim()
  if (s.endsWith('ms')) return parseFloat(s)
  if (s.endsWith('s')) return parseFloat(s) * 1000
  return null
}

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

await app.evaluate(async ({ dialog }, dir) => {
  dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [dir] })
}, WORK_DIR)

const page = await app.firstWindow()
await page.waitForSelector('[aria-label="Backend mode"]', { timeout: 15000 })

// ---- phase 0: the animation premise --------------------------------------
// Forced first, then READ BACK. Criteria 3 and 4 are both vacuous under
// `animation: none !important`.
await page.emulateMedia({ reducedMotion: 'no-preference' }).catch(() => {})
const motion = await page.evaluate(() => ({
  reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
  dpr: window.devicePixelRatio
}))
check('premise: animations are not suppressed by reduced-motion', motion.reduced === false, {
  ...motion,
  hint: 'base.css:92 sets `animation: none !important` under reduce — criteria 3 and 4 would measure nothing'
})

// ---- phase 1: open a workspace -------------------------------------------
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

// ---- phase 2: criterion 1 + 5, the model menu ----------------------------
// The picker always renders the static "Default" row, so this does not depend on
// the CLI returning a model list (gui-51's note: a count of 1 means the fetched
// list was empty, not that one model is offered).
await page.evaluate(() => document.querySelector('.model-pill')?.click())
await page.waitForSelector(ITEM, { timeout: 20000 })

const menu = await page.evaluate((s) => {
  const el = document.querySelector(s)
  return {
    rows: document.querySelectorAll(s).length,
    weight: getComputedStyle(el).fontWeight,
    family: getComputedStyle(el).fontFamily,
    size: getComputedStyle(el).fontSize
  }
}, ITEM)
check('premise: the model menu is open with at least one row', menu.rows >= 1, {
  rows: menu.rows,
  note: 'row count includes the static Default pick'
})

// Criterion 1.
check(`criterion 1: ${ITEM} computes font-weight 400`, menu.weight === '400', {
  weight: menu.weight,
  size: menu.size
})

// Criterion 5 — the row driven through BOTH weights in-run, compared in DEVICE
// pixels (gui-51's rule). This is the same element, the same cascade and the
// same fonts; only the weight moves.
const box = await page.evaluate(
  ([s, dpr]) => {
    const el = document.querySelector(s)
    const prior = el.style.fontWeight
    const read = (w) => {
      el.style.fontWeight = w
      void el.offsetHeight // force reflow before reading
      const r = el.getBoundingClientRect()
      return { h: r.height * dpr, w: r.width * dpr }
    }
    const at400 = read('400')
    const at500 = read('500')
    el.style.fontWeight = prior
    return { at400, at500 }
  },
  [ITEM, motion.dpr]
)
const dH = Math.abs(box.at400.h - box.at500.h)
const dW = Math.abs(box.at400.w - box.at500.w)
check(`criterion 5: ${ITEM}'s box is unchanged by the weight, within 1 device px`, dH < 1 && dW < 1, {
  at400: box.at400,
  at500: box.at500,
  deltaDevicePx: { h: +dH.toFixed(3), w: +dW.toFixed(3) },
  dpr: motion.dpr
})

const menuShot = path.join(SHOT_DIR, 'gui-96-model-menu.png')
await page.screenshot({ path: menuShot })
await page.evaluate(() => document.querySelector('.model-backdrop')?.click())
await page.waitForTimeout(300)

// ---- phase 3: criterion 3 + 4, the drawer and the two pulses -------------
const pushChat = (ev) =>
  app.evaluate(({ BrowserWindow }, ev) => {
    const win = BrowserWindow.getAllWindows()[0]
    win.webContents.send('chat:event', ev)
  }, ev)

await pushChat({
  type: 'tool-use',
  id: PARENT_TOOL_USE_ID,
  name: 'Task',
  input: { subagent_type: 'Explore', description: 'gui-96 fixture' }
})
await pushChat({
  type: 'subagent',
  parentToolUseId: PARENT_TOOL_USE_ID,
  status: 'running',
  agentType: 'Explore'
})

await page.waitForSelector(ROW, { timeout: 10000 }).catch(() => {})
const rowThere = await page.evaluate((s) => !!document.querySelector(s), ROW)
// A missing row is a hard failure, never a quiet skip: the live half of
// criterion 4 and the whole of criterion 3 would pass or fail for the wrong
// reason without it.
check('premise: synthetic push grew a running subagent row', rowThere, {
  hint: 'no row means the chat:event push never reached useChat'
})

await page.evaluate((s) => document.querySelector(s)?.click(), ROW)
await page.waitForSelector(DRAWER, { timeout: 10000 }).catch(() => {})

const anim = await page.evaluate(
  ([drawerSel]) => {
    const out = {}
    const drawer = document.querySelector(drawerSel)
    out.drawerPresent = !!drawer
    out.drawerName = drawer ? getComputedStyle(drawer).animationName : null
    out.drawerDuration = drawer ? getComputedStyle(drawer).animationDuration : null

    // LIVE element — the synthetic subagent is genuinely `running`.
    const dot = document.querySelector('.subagent-row--running .subagent-row-dot')
    out.dotPresent = !!dot
    out.dotName = dot ? getComputedStyle(dot).animationName : null
    out.dotDuration = dot ? getComputedStyle(dot).animationDuration : null

    // PROBE element — `.agent-map-halo` is a bare single-class rule, so a probe
    // resolves it through the real cascade. This is NOT the agent map itself.
    const probe = document.createElement('div')
    probe.className = 'agent-map-halo'
    document.body.appendChild(probe)
    const cs = getComputedStyle(probe)
    out.haloName = cs.animationName
    out.haloDuration = cs.animationDuration
    probe.remove()
    return out
  },
  [DRAWER]
)

check('premise: the drawer is open and running subagent-slide', anim.drawerPresent && anim.drawerName === 'subagent-slide', {
  present: anim.drawerPresent,
  name: anim.drawerName
})

// Criterion 3.
check(`criterion 3: ${DRAWER} animates for 200ms`, ms(anim.drawerDuration) === 200, {
  duration: anim.drawerDuration,
  ms: ms(anim.drawerDuration)
})

// Criterion 4 — POSITIVE, both sites, so a "conforming" tidy-up reds.
check('criterion 4a: .subagent-row--running .subagent-row-dot still pulses at 1.4s (LIVE)', anim.dotPresent && anim.dotName === 'subagent-pulse' && ms(anim.dotDuration) === 1400, {
  present: anim.dotPresent,
  name: anim.dotName,
  duration: anim.dotDuration
})
check('criterion 4b: .agent-map-halo still pulses at 1.4s (PROBE element)', anim.haloName === 'subagent-pulse' && ms(anim.haloDuration) === 1400, {
  name: anim.haloName,
  duration: anim.haloDuration
})

const drawerShot = path.join(SHOT_DIR, 'gui-96-drawer.png')
await page.screenshot({ path: drawerShot })

// ---- phase 4: criterion 2, the source grep -------------------------------
// The one check here that is NOT a measurement of the running app.
const hits = []
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p)
    else if (e.name.endsWith('.css')) {
      fs.readFileSync(p, 'utf8')
        .split(/\r?\n/)
        .forEach((line, i) => {
          if (/font-weight:\s*500\b/.test(line)) hits.push(`${path.relative(APP_DIR, p)}:${i + 1}`)
        })
    }
  }
}
walk(STYLE_DIR)
check('criterion 2: zero `font-weight: 500` in src/renderer/src/styles/ (SOURCE grep)', hits.length === 0, {
  hits
})

console.log(`screenshots: ${menuShot} | ${drawerShot}`)
console.log(fails.length === 0 ? 'ALL GREEN' : `RED: ${fails.join(' | ')}`)

setTimeout(() => process.exit(fails.length === 0 ? 0 : 1), 3000).unref?.()
await app.close().catch(() => {})
try {
  fs.rmSync(WORK_DIR, { recursive: true, force: true })
} catch {
  console.log(`(left behind: ${path.basename(WORK_DIR)})`)
}
process.exit(fails.length === 0 ? 0 : 1)
