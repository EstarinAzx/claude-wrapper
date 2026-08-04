// GUI driver for #110 — the window's last move survives a close inside the
// 250ms report debounce.
//
// THREE LAUNCHES against one profile, because the claim is about what one
// launch leaves behind for the next:
//
//   SEED        move, wait past the debounce, quit cleanly. The POSITIVE
//               CONTROL: if the ordinary reporting path does not store a move,
//               nothing below is a measurement of anything.
//   MOVE-CLOSE  move, then close INSIDE the debounce window. The premise.
//   READ        relaunch and report what the renderer found in localStorage.
//
// The verdict reads two independent witnesses, and reporting them separately is
// the point (see the probe's header): whether MAIN SENT `bounds:changed` during
// the close, and whether the value LANDED in storage. A fix can be wired
// correctly and still lose the race with the renderer's teardown, and only the
// pair can say which happened.
//
//   node .claude/skills/run-desktop/gui-110.mjs
//
// Needs `npm run build` first. No playwright-core — see the probe's header.

import { spawn } from 'node:child_process'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'

const APP_DIR = path.resolve(import.meta.dirname, '../../..')
const PROBE = path.join(import.meta.dirname, 'gui-110-probe.cjs')
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), 'gui110-profile-'))
const DUMPS = fs.mkdtempSync(path.join(os.tmpdir(), 'gui110-dumps-'))

// Well inside the 250ms debounce, and far enough from it that a slow machine
// cannot turn "closed early" into "closed after the timer fired" — that would
// silently convert the premise run into the no-op case.
const CLOSE_MS = Number(process.env.GUI110_CLOSE_MS || 60)
const SETTLE_MS = Number(process.env.GUI110_SETTLE_MS || 2500)

let cleaned = false
const cleanup = () => {
  if (cleaned) return
  cleaned = true
  for (const dir of [PROFILE, DUMPS]) {
    try {
      fs.rmSync(dir, { recursive: true, force: true })
    } catch {}
  }
}

setTimeout(() => {
  console.log('TIMEOUT')
  cleanup()
  process.exit(1)
}, 180000).unref?.()

const log = (label, m) => console.log(label.padEnd(16) + JSON.stringify(m))
const fails = []

const electronBin =
  process.platform === 'win32'
    ? path.join(APP_DIR, 'node_modules/electron/dist/electron.exe')
    : process.platform === 'darwin'
      ? path.join(APP_DIR, 'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron')
      : path.join(APP_DIR, 'node_modules/electron/dist/electron')

// `--disable-gpu` is load-bearing here for the reason #78 measured and #79
// recorded: in a background session this app's window never paints with GPU
// compositing on, so it is never shown and a closed-while-visible claim has no
// window to be about. It flattens acrylic, which costs this driver nothing.
const launch = (phase) =>
  new Promise((resolve) => {
    const out = path.join(DUMPS, phase + '.json')
    const child = spawn(electronBin, ['--disable-gpu', PROBE], {
      cwd: APP_DIR,
      env: {
        ...process.env,
        GUI110_OUT: out,
        GUI110_PROFILE: PROFILE,
        GUI110_PHASE: phase,
        GUI110_SETTLE_MS: String(SETTLE_MS),
        GUI110_CLOSE_MS: String(CLOSE_MS)
      },
      stdio: ['ignore', 'pipe', 'pipe']
    })
    let stderr = ''
    child.stderr.on('data', (b) => {
      stderr += String(b)
    })
    child.on('exit', () => {
      if (!fs.existsSync(out)) {
        resolve({ error: 'no dump written', stderr: stderr.slice(-800) })
        return
      }
      resolve(JSON.parse(fs.readFileSync(out, 'utf8')))
    })
  })

const rect = (b) => (b ? [b.x, b.y, b.width, b.height] : null)
const same = (a, b) => {
  const [x, y] = [rect(a), rect(b)]
  return Boolean(x && y && x.every((n, i) => n === y[i]))
}
const at = (timeline, name) => timeline.find((m) => m.name === name) ?? null

const die = (why) => {
  console.log('')
  console.log('FAIL')
  console.log('  - ' + why)
  for (const f of fails) console.log('  - ' + f)
  cleanup()
  process.exit(1)
}

// ---- launch 1: the positive control -----------------------------------------

console.log('LAUNCH 1        seed — move, wait past the debounce, quit cleanly')
const seed = await launch('seed')
if (seed.error) die(`seed: ${seed.error} ${seed.stderr ?? ''}`)
log('SEED-SENDS', seed.sends.map((s) => rect(s.bounds)))
log('SEED-FINAL', rect(seed.finalBounds))

if (!seed.sends.some((s) => same(s.bounds, seed.base))) {
  die(
    `the seed launch never reported ${JSON.stringify(
      rect(seed.base)
    )} at all, so the ordinary debounced path is broken and nothing below measures this ticket`
  )
}

// ---- launch 2: the premise ---------------------------------------------------

console.log('')
console.log(`LAUNCH 2        move, then close ${CLOSE_MS}ms later — inside the 250ms debounce`)
const mc = await launch('move-close')
if (mc.error) die(`move-close: ${mc.error} ${mc.stderr ?? ''}`)

// The control's other half: this launch must have INHERITED the seeded move,
// or "storage still holds the old value" below is trivially true.
if (!same(mc.boundsSet.payload, mc.base)) {
  die(
    `the move-close launch mounted with ${JSON.stringify(
      rect(mc.boundsSet.payload)
    )} rather than the seeded ${JSON.stringify(rect(mc.base))} — the profile is not carrying between launches`
  )
}

const moveAt = at(mc.timeline, 'move')?.t ?? null
const closeAt = at(mc.timeline, 'closing')?.t ?? null
const afterMove = mc.sends.filter((s) => moveAt !== null && s.t >= moveAt)
const sentTarget = afterMove.filter((s) => same(s.bounds, mc.target))

log('MC-TIMELINE', mc.timeline.map((m) => m.name))
log('MC-WINDOW', { msMoveToClose: moveAt && closeAt ? closeAt - moveAt : null })
log('MC-SENDS-AFTER', afterMove.map((s) => ({ ms: s.t - moveAt, bounds: rect(s.bounds) })))

// The premise depends on the close genuinely landing inside the debounce. If
// the machine stalled and the timer fired first, this run measured the no-op
// case and must not be read as either a reproduction or a fix.
const preCloseSends = afterMove.filter((s) => closeAt !== null && s.t < closeAt)
if (preCloseSends.length > 0) {
  die(
    `the debounce had already fired ${preCloseSends.length}x before the close, so this run never entered the window the ticket is about — raise GUI110_CLOSE_MS-independent load or re-run`
  )
}

// ---- launch 3: what the next launch inherits --------------------------------

console.log('')
console.log('LAUNCH 3        relaunch — what did the renderer actually keep?')
const read = await launch('read')
if (read.error) die(`read: ${read.error} ${read.stderr ?? ''}`)

const stored = read.boundsSet.payload
log('STORED', rect(stored))
log('EXPECTED', { target: rect(read.target), staleBase: rect(read.base) })

// ---- verdict: two witnesses, reported apart ---------------------------------

const mainSent = sentTarget.length > 0
const landed = same(stored, read.target)
const stale = same(stored, read.base)

console.log('')
log('VERDICT-DATA', {
  mainSentOnClose: mainSent,
  sendsAfterMove: afterMove.length,
  storedIsTheMove: landed,
  storedIsStale: stale
})

if (!mainSent) {
  fails.push(
    `main sent no \`bounds:changed\` carrying ${JSON.stringify(
      rect(mc.target)
    )} between the move and the close — the pending report was cancelled rather than flushed (this is the defect #110 describes)`
  )
}
if (mainSent && !landed) {
  fails.push(
    stale
      ? 'main DID flush on close, but the next launch still read the stale rectangle — the message was in flight when the renderer was torn down, so the flush is not sufficient on its own'
      : `main DID flush on close, but the next launch read ${JSON.stringify(rect(stored))}, which is neither the move nor the stale value`
  )
}
if (mainSent && sentTarget.length > 1) {
  fails.push(
    `the move was reported ${sentTarget.length} times — the flush duplicated a report the debounce had already sent`
  )
}

console.log('')
console.log(fails.length === 0 ? 'PASS' : 'FAIL')
for (const f of fails) console.log('  - ' + f)
console.log(
  'NOTE            two witnesses on purpose: `mainSentOnClose` is main\'s own fact (was the flush wired), `storedIsTheMove` is the renderer\'s (did it survive teardown). A fix can satisfy the first and fail the second.'
)
cleanup()
process.exit(fails.length === 0 ? 0 : 1)
