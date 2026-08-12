// #156 — why `gui-91`'s first `page.screenshot()` stalls about one run in seven.
//
// THE REPORTED SHAPE. `gui-91.mjs:211` threw a Playwright `TimeoutError` on the
// FIRST capture, and its log tail reached "fonts loaded" before dying. So the
// stall is downstream of the fonts wait, inside the capture itself.
//
// ── the two claims the ticket asks about, and why they need different work ──
// The ticket names two directions and calls neither measured:
//
//   1. a settle/`waitForLoadState` gap before the first capture
//   2. "a timeout that is simply too tight for the first capture of a cold
//      renderer", which it calls the cheaper one to test
//
// (2) is cheaper still than the ticket thought, because it is answerable with
// NO Electron at all — phase A. `gui-91` passes no `timeout` to `screenshot()`
// and no driver in this repo calls `setDefaultTimeout`, so the capture ran on
// playwright-core's own default. Phase A reads that number out of the installed
// package rather than citing it. A capture that is merely SLOW and a capture
// that is HUNG are then told apart by a distribution, not by a shrug: if a
// successful capture costs a few hundred milliseconds and the budget is tens of
// seconds, "too tight" is not a live explanation.
//
// (1) is the interesting half, and the ticket's own evidence bounds it: the log
// reaches "fonts loaded", which is the LAST thing playwright logs before the
// capture. Read in this playwright (1.62.1, `lib/coreBundle.js`), exactly two
// CDP round trips follow it for a default viewport capture —
// `Page.getLayoutMetrics` then `Page.captureScreenshot` with
// `captureBeyondViewport: false`. There is no third wait to have a "gap" in.
// `Page.captureScreenshot` is the one that can block indefinitely, because it
// waits on the compositor to hand over a frame.
//
// ── the claim that has a CONSEQUENCE and a REACHABILITY, failing separately ──
// #108's shape, and the reason this harness has a phase B and a phase C:
//
//   CONSEQUENCE  — can a compositor that has stopped producing frames hang THIS
//                  app's `page.screenshot()`? Answerable deterministically, by
//                  taking the frames away on purpose (minimise the window).
//                  Needs no luck and no repetition.
//   REACHABILITY — is that what happens in the wild, one run in seven? Needs the
//                  intermittent to actually land, which needs repetition.
//
// Fusing them can only answer the conjunction, and a run where the intermittent
// never appears would then report nothing at all. Split, phase B still returns a
// finding on a night when phase C is all green.
//
// ── the probe cannot be the perturbation ──────────────────────────────────
// The obvious liveness probe is `requestAnimationFrame`: JS keeps running in a
// window whose compositor has stopped, so a frame callback that never fires is
// direct evidence of the stall. But AWAITING a frame is exactly the candidate
// remedy, so a probe that waits for one before every capture would fix the bug
// it is trying to observe and report a clean run.
//
// So the fidelity arm (C/A) reads only INSTANT witnesses — `visibilityState`,
// and the window's own `isVisible`/`isMinimized`/`isFocused` — none of which
// waits for anything. The rAF wait appears only in phase B (where the stall is
// deliberate and there is nothing left to hide) and in arm C/B, where it IS the
// treatment under test rather than an instrument.
//
// ── controls ──────────────────────────────────────────────────────────────
// Phase B captures three times: before the minimise, during it, and after the
// restore. The third is a positive control — without it, a failure during the
// minimise is indistinguishable from the app having broken for good at that
// point in its life, which would make the minimise irrelevant to the finding.
//
// Every launch gets a FRESH `--user-data-dir`, minted per iteration rather than
// per process. `gui-91` runs as its own node process and therefore always
// launches against a fresh throwaway profile (#147). A harness that reused one
// profile across its iterations would make runs 2..N warm — with stored bounds
// and a stored zoom level — and the window's show gate (#79) reads exactly that,
// so the reused-profile version measures a different premise from run 2 onward.
//
//   SPIKE156_PHASES=A,B,C   which phases to run (default A,B)
//   SPIKE156_RUNS=14        iterations per phase-C arm (default 14)
//   SPIKE156_ARMS=A,B,L     which phase-C arms (default A)
//
// Arm L is the ticket's OWN escape clause tested: it says the stall is "not
// simply load, though load makes it likelier". Arm A holds the machine idle, so
// on its own it can only ever fail to reproduce a load-sensitive stall and would
// leave that clause standing. Arm L saturates the CPU across the same timeline.
// It is a DIFFERENT premise from the reported isolated failure and is reported
// as such — it tests the likelier-under-load claim, not the idle one.
//
// Needs `npm run build` first, plus playwright-core. Captures and profiles go
// outside the repo. Run it one at a time and not beside the fast gate.

import { _electron as electron } from 'playwright-core'
import { spawn } from 'node:child_process'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'

const APP_DIR = path.resolve(import.meta.dirname, '..')
const OUT_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'spike156-out-'))
const FINDINGS = path.join(APP_DIR, 'scripts', 'spike-156-findings.json')

const PHASES = (process.env.SPIKE156_PHASES || 'A,B').split(',').map((s) => s.trim().toUpperCase())
const RUNS = Number(process.env.SPIKE156_RUNS || 14)
const ARMS = (process.env.SPIKE156_ARMS || 'A').split(',').map((s) => s.trim().toUpperCase())

const findings = { phases: {}, meta: { platform: process.platform, node: process.version } }

const electronBin =
  process.platform === 'win32'
    ? path.join(APP_DIR, 'node_modules/electron/dist/electron.exe')
    : process.platform === 'darwin'
      ? path.join(APP_DIR, 'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron')
      : path.join(APP_DIR, 'node_modules/electron/dist/electron')

const log = (...a) => console.log(...a)
const ms = (t0) => Math.round(Number(process.hrtime.bigint() - t0) / 1e6)
const now = () => process.hrtime.bigint()

/**
 * Bound a promise on the NODE side without touching its timeout. Used for the
 * probes, whose whole point is that the renderer may not answer: a hung
 * `page.evaluate` must cost this harness a bounded wait and a recorded verdict,
 * never the run.
 */
const withTimeout = (p, budget, label) => {
  let timer
  const guard = new Promise((res) => {
    timer = setTimeout(() => res({ [label]: 'PROBE-TIMEOUT', budgetMs: budget }), budget)
  })
  p.catch(() => {})
  return Promise.race([p, guard]).finally(() => clearTimeout(timer))
}

// ── phase A — the budget, with no Electron in the picture ──────────────────
// The ticket's cheaper hypothesis is a claim about a NUMBER, and the number is
// on disk. Asserted rather than cited, so this harness reds when the code moves
// under it (#105's lesson: a harness whose premise a later change alters must
// say so, or its success is indistinguishable from its failure).
async function phaseA() {
  log('\n=== PHASE A — what budget did the failing capture actually have? ===')
  const out = {}

  const bundle = path.join(APP_DIR, 'node_modules/playwright-core/lib/coreBundle.js')
  const src = fs.readFileSync(bundle, 'utf8')

  const m = src.match(/DEFAULT_PLAYWRIGHT_TIMEOUT = ([0-9e.]+);/)
  out.defaultTimeoutLiteral = m ? m[1] : null
  out.defaultTimeoutMs = m ? Number(m[1]) : null

  // The post-fonts sequence for a default viewport capture, read off the
  // Chromium delegate rather than remembered.
  out.postFontsCdp = {
    getLayoutMetrics: src.includes('this._mainFrameSession._client.send("Page.getLayoutMetrics")'),
    captureScreenshot: src.includes('this._mainFrameSession._client.send("Page.captureScreenshot"'),
    // If playwright ever brings the window forward here, that is a different
    // story about the same symptom, so it is read rather than assumed absent.
    bringToFrontInScreenshotPath: /takeScreenshot[\s\S]{0,1200}Page\.bringToFront/.test(src)
  }

  const driver = fs.readFileSync(
    path.join(APP_DIR, '.claude/skills/run-desktop/gui-91.mjs'),
    'utf8'
  )
  const captures = [...driver.matchAll(/page\.screenshot\(\{([^}]*)\}\)/g)].map((x) => x[1].trim())
  out.driver = {
    captureCalls: captures,
    // The load-bearing fact: neither call names a timeout, so both inherit the
    // default above.
    anyCaptureNamesTimeout: captures.some((c) => c.includes('timeout')),
    setsDefaultTimeout: driver.includes('setDefaultTimeout'),
    hasOwnWatchdogMs: (driver.match(/setTimeout\(\(\) => \{\s*console\.log\('TIMEOUT'\)[\s\S]*?\}, (\d+)\)/) || [])[1] || null
  }

  const driverDir = path.join(APP_DIR, '.claude/skills/run-desktop')
  const allDrivers = fs.readdirSync(driverDir).filter((f) => /^gui-.*\.mjs$/.test(f))
  out.driversCallingSetDefaultTimeout = allDrivers.filter((f) =>
    fs.readFileSync(path.join(driverDir, f), 'utf8').includes('setDefaultTimeout')
  )

  log(`playwright-core default action timeout : ${out.defaultTimeoutMs}ms (literal ${out.defaultTimeoutLiteral})`)
  log(`gui-91 capture calls                   : ${JSON.stringify(out.driver.captureCalls)}`)
  log(`  any names a timeout                  : ${out.driver.anyCaptureNamesTimeout}`)
  log(`  driver sets a default timeout         : ${out.driver.setsDefaultTimeout}`)
  log(`  driver's own watchdog                 : ${out.driver.hasOwnWatchdogMs}ms`)
  log(`drivers calling setDefaultTimeout      : ${out.driversCallingSetDefaultTimeout.length} of ${allDrivers.length}`)
  log(`post-fonts CDP sequence                : ${JSON.stringify(out.postFontsCdp)}`)
  log(
    `\nSo the failing capture had ${out.defaultTimeoutMs}ms and used all of it. Whether that is` +
      `\n"too tight" is decided by what a WORKING capture costs — phases B and C.`
  )

  findings.phases.A = out
}

// ── shared launch: gui-91's own timeline, up to the first capture ──────────
// Deliberately byte-for-byte the same waits as the driver. Shortening them
// would measure a different premise: the reported failure happens 9.5s into a
// settled window, which is already long past the show gate's own 1500ms
// fallback, so "the window was never shown" is not what this is.
async function launchToPreCapture(profileDir, workDir) {
  const app = await electron.launch({
    executablePath: electronBin,
    args: ['--no-sandbox', '--disable-gpu', `--user-data-dir=${profileDir}`, '.'],
    cwd: APP_DIR,
    env: process.env,
    timeout: 30000
  })
  await app.evaluate(async ({ dialog }, dir) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [dir] })
  }, workDir)

  const page = await app.firstWindow()
  await page.waitForSelector('[aria-label="Backend mode"]', { timeout: 15000 })
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(
      (b) =>
        b.getAttribute('aria-label') === 'Pick a project folder' ||
        b.textContent?.includes('Pick a project folder')
    )
    btn?.click()
  })
  await page.waitForTimeout(3500)
  await page.waitForTimeout(6000)

  // The read the driver does immediately before its capture, kept so the
  // renderer is in the same state at the same moment.
  const real = await page.evaluate(() => {
    const sec = document.querySelector('.bg-sessions')
    if (!sec) return { missing: true }
    const empty = sec.querySelector('.bg-sessions-empty')
    return { missing: false, text: (empty?.textContent || '').trim(), rows: sec.querySelectorAll('.bg-session-row').length }
  })

  return { app, page, real }
}

/** Instant witnesses only — nothing here waits for a frame. */
async function instantWitnesses(app, page) {
  const win = await withTimeout(
    app.evaluate(({ BrowserWindow }) => {
      const w = BrowserWindow.getAllWindows()[0]
      if (!w) return { noWindow: true }
      return {
        isVisible: w.isVisible(),
        isMinimized: w.isMinimized(),
        isFocused: w.isFocused(),
        isDestroyed: w.isDestroyed()
      }
    }),
    4000,
    'win'
  )
  const doc = await withTimeout(
    page.evaluate(() => ({
      visibilityState: document.visibilityState,
      hidden: document.hidden,
      readyState: document.readyState
    })),
    4000,
    'doc'
  )
  return { win, doc }
}

/**
 * Does the compositor still hand over frames? A window whose compositing has
 * stopped keeps running JS, so a frame callback that never arrives is the
 * direct reading. PERTURBING BY CONSTRUCTION — it waits for the very thing the
 * capture waits for — so it is kept out of the fidelity arm.
 */
async function framesAlive(page, budget = 1500) {
  return withTimeout(
    page.evaluate(
      (b) =>
        new Promise((res) => {
          const t0 = performance.now()
          let done = false
          requestAnimationFrame(() => {
            if (done) return
            done = true
            res({ fired: true, ms: Math.round(performance.now() - t0) })
          })
          setTimeout(() => {
            if (done) return
            done = true
            res({ fired: false, ms: Math.round(performance.now() - t0) })
          }, b)
        }),
      budget
    ),
    budget + 2500,
    'raf'
  )
}

/** One capture, timed, with the outcome recorded rather than thrown. */
async function timedCapture(page, file, timeout) {
  const t0 = now()
  try {
    await page.screenshot(timeout === undefined ? { path: file } : { path: file, timeout })
    return { ok: true, ms: ms(t0), bytes: fs.existsSync(file) ? fs.statSync(file).size : null }
  } catch (e) {
    return { ok: false, ms: ms(t0), error: e.name || 'Error', message: String(e.message || '').split('\n')[0] }
  }
}

/**
 * Saturate the CPU for the life of one iteration. Deliberately crude: separate
 * busy-loop processes, so the load competes with Electron for cores at the OS
 * scheduler rather than inside this harness's own event loop, which would only
 * delay the harness and measure nothing about the app.
 *
 * One core is left alone. Saturating every core makes the LAUNCH itself time out,
 * which loses the run before it reaches the capture the ticket is about — a
 * hostile arm has to stay hostile to the right step.
 */
const startLoad = (seconds) => {
  const n = Math.max(1, os.cpus().length - 1)
  const kids = []
  for (let i = 0; i < n; i++) {
    kids.push(
      spawn(process.execPath, ['-e', `const t=Date.now();while(Date.now()-t<${seconds * 1000}){}`], {
        stdio: 'ignore'
      })
    )
  }
  return {
    workers: n,
    stop: () => {
      for (const k of kids) {
        try {
          k.kill()
        } catch {}
      }
    }
  }
}

const mkWork = () => fs.mkdtempSync(path.join(os.tmpdir(), 'spike156-work-'))
const mkProfile = () => fs.mkdtempSync(path.join(os.tmpdir(), 'spike156-profile-'))
const rm = (d) => {
  try {
    fs.rmSync(d, { recursive: true, force: true })
  } catch {}
}

// ── phase B — take the frames away on purpose ─────────────────────────────
// The CONSEQUENCE half. If a stalled compositor cannot hang this capture, the
// whole mechanism is refuted here for the cost of one launch, and phase C's
// repetition would be chasing something else.
async function phaseB() {
  log('\n=== PHASE B — can a stalled compositor hang THIS capture? (deterministic) ===')
  const out = { readings: [] }
  const profile = mkProfile()
  const work = mkWork()
  let app
  try {
    const t = await launchToPreCapture(profile, work)
    app = t.app
    const { page } = t
    out.preCaptureState = t.real

    // 1 — the ordinary capture, as the driver takes it.
    out.readings.push({
      label: 'baseline (window shown)',
      witnesses: await instantWitnesses(app, page),
      frames: await framesAlive(page),
      capture: await timedCapture(page, path.join(OUT_DIR, 'b1-baseline.png'))
    })

    // 2 — minimise, which is the cheapest honest way to stop frame production
    // on Windows, then capture with a SHORT budget. The short budget is a
    // measurement economy, not a claim: the point is whether it blocks at all.
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].minimize())
    await page.waitForTimeout(1200)
    out.readings.push({
      label: 'minimised (frames withheld)',
      witnesses: await instantWitnesses(app, page),
      frames: await framesAlive(page),
      capture: await timedCapture(page, path.join(OUT_DIR, 'b2-minimised.png'), 6000)
    })

    // 3 — restore. THE POSITIVE CONTROL: without it, reading 2 is
    // indistinguishable from the app having simply broken by that point.
    await app.evaluate(({ BrowserWindow }) => {
      const w = BrowserWindow.getAllWindows()[0]
      w.restore()
      w.focus()
    })
    await page.waitForTimeout(1500)
    out.readings.push({
      label: 'restored (positive control)',
      witnesses: await instantWitnesses(app, page),
      frames: await framesAlive(page),
      capture: await timedCapture(page, path.join(OUT_DIR, 'b3-restored.png'), 15000)
    })

    for (const r of out.readings) {
      log(`\n${r.label}`)
      log(`  window     : ${JSON.stringify(r.witnesses.win)}`)
      log(`  document   : ${JSON.stringify(r.witnesses.doc)}`)
      log(`  frames     : ${JSON.stringify(r.frames)}`)
      log(`  capture    : ${JSON.stringify(r.capture)}`)
    }

    const [b1, b2, b3] = out.readings
    out.verdict =
      b1.capture.ok && !b2.capture.ok && b3.capture.ok
        ? 'CONFIRMED: withholding frames hangs this capture, and the app recovers when they return'
        : b1.capture.ok && b2.capture.ok
          ? 'REFUTED: the capture survives a minimised window, so a stalled compositor is not the mechanism'
          : 'UNSCORED: the controls did not come out cleanly — read the readings'
    log(`\nverdict: ${out.verdict}`)
  } finally {
    if (app) await app.close().catch(() => {})
    rm(work)
    rm(profile)
  }
  findings.phases.B = out
}

// ── phase C — repetition, at the driver's own timeline ────────────────────
// The REACHABILITY half. `spike-104`'s mechanism: a single-shot instrument
// cannot measure a race. Arm A is the driver as it stands. Arm B awaits a frame
// before capturing, which is the candidate remedy rather than a retry — it does
// not re-attempt the capture, it establishes the precondition the capture needs
// and then takes it once.
async function phaseC() {
  log(`\n=== PHASE C — repetition (${RUNS} runs per arm, arms ${ARMS.join(',')}) ===`)
  const out = { runs: RUNS, arms: {} }

  for (const arm of ARMS) {
    const awaitFrame = arm === 'B'
    const loaded = arm === 'L'
    log(
      `\n--- arm ${arm}: ${awaitFrame ? 'await a real frame before capturing' : loaded ? 'driver as it stands, CPU saturated' : 'driver as it stands'} ---`
    )
    const rows = []
    for (let i = 1; i <= RUNS; i++) {
      const profile = mkProfile()
      const work = mkWork()
      let app
      let load = null
      const row = { run: i }
      const t0 = now()
      try {
        // Started before the launch so the load spans the whole timeline the
        // reported failure sits in, not just the instant of the capture.
        if (loaded) {
          load = startLoad(45)
          row.loadWorkers = load.workers
        }
        const t = await launchToPreCapture(profile, work)
        app = t.app
        const { page } = t
        row.preCapture = t.real
        row.witnesses = await instantWitnesses(app, page)
        if (awaitFrame) row.frames = await framesAlive(page, 3000)
        row.capture = await timedCapture(page, path.join(OUT_DIR, `c-${arm}-${i}.png`))
        // Read the state AFTER a stall too — a window that went hidden between
        // the pre-capture read and the capture would only show up here.
        if (!row.capture.ok) row.witnessesAfter = await instantWitnesses(app, page)
      } catch (e) {
        row.launchError = String(e.message || e).split('\n')[0]
      } finally {
        if (load) load.stop()
        if (app) await app.close().catch(() => {})
        rm(work)
        rm(profile)
      }
      row.totalMs = ms(t0)
      rows.push(row)
      const c = row.capture
      log(
        `run ${String(i).padStart(2)}/${RUNS}  ` +
          (row.launchError
            ? `LAUNCH-ERROR ${row.launchError}`
            : c.ok
              ? `ok ${String(c.ms).padStart(5)}ms  ${c.bytes}b  vis=${row.witnesses.doc?.visibilityState} min=${row.witnesses.win?.isMinimized}`
              : `STALL ${c.ms}ms ${c.error} — ${c.message}  vis=${row.witnesses.doc?.visibilityState} min=${row.witnesses.win?.isMinimized}`) +
          `  [${row.totalMs}ms total]`
      )
    }

    const done = rows.filter((r) => r.capture)
    const okRows = done.filter((r) => r.capture.ok)
    const stalls = done.filter((r) => !r.capture.ok)
    const times = okRows.map((r) => r.capture.ms).sort((a, b) => a - b)
    const summary = {
      attempted: rows.length,
      launchErrors: rows.filter((r) => r.launchError).length,
      ok: okRows.length,
      stalls: stalls.length,
      captureMs: times.length
        ? {
            min: times[0],
            median: times[Math.floor(times.length / 2)],
            max: times[times.length - 1]
          }
        : null,
      stallDetail: stalls.map((r) => ({
        run: r.run,
        ms: r.capture.ms,
        error: r.capture.error,
        before: r.witnesses,
        after: r.witnessesAfter || null
      }))
    }
    out.arms[arm] = { rows, summary }
    log(
      `\narm ${arm}: ${summary.ok} ok / ${summary.stalls} stalled / ${summary.launchErrors} launch errors` +
        (summary.captureMs
          ? `\n  successful capture cost: min ${summary.captureMs.min}ms, median ${summary.captureMs.median}ms, max ${summary.captureMs.max}ms`
          : '')
    )
    if (summary.captureMs && findings.phases.A?.defaultTimeoutMs) {
      const ratio = Math.round(findings.phases.A.defaultTimeoutMs / summary.captureMs.max)
      log(
        `  the ${findings.phases.A.defaultTimeoutMs}ms budget is ${ratio}x the slowest capture observed here,` +
          `\n  so "the timeout is too tight" is not what this is.`
      )
      out.arms[arm].summary.budgetOverSlowestObserved = ratio
    }
  }

  findings.phases.C = out
}

// ── run ───────────────────────────────────────────────────────────────────
try {
  if (PHASES.includes('A')) await phaseA()
  if (PHASES.includes('B')) await phaseB()
  if (PHASES.includes('C')) await phaseC()
} finally {
  // MERGED rather than overwritten, because the phases are meant to be run in
  // separate invocations (A is free, B is one launch, C is many) and a plain
  // write would leave the artifact holding only whichever phase ran last. Each
  // phase carries the time it was taken, so a stale phase cannot be read as part
  // of the same sitting as a fresh one.
  let prior = {}
  try {
    prior = JSON.parse(fs.readFileSync(FINDINGS, 'utf8'))
  } catch {}
  const stamped = {}
  for (const [k, v] of Object.entries(findings.phases)) {
    stamped[k] = { takenAt: new Date().toISOString(), ...v }
  }
  fs.writeFileSync(
    FINDINGS,
    JSON.stringify({ ...prior, ...findings, phases: { ...(prior.phases || {}), ...stamped } }, null, 2)
  )
  log(`\nfindings: ${FINDINGS}`)
  log(`captures: ${OUT_DIR}`)
}
process.exit(0)
