// Spike #114 — does closing a live, warmed engine and rebuilding it in the same
// tick kill the main process?
//
//   npm run build && npm i --no-save playwright-core
//   node --experimental-strip-types scripts/spike-114-engine-rebuild.mjs
//
// Phases are selectable, because they cost wildly different amounts:
//   SPIKE114_PHASES=A    source + SDK facts only (seconds, no CLI)
//   SPIKE114_PHASES=AB   + the bare-Node pair loop (a CLI spawn per iteration)
//   SPIKE114_PHASES=ABC  + the real app over its own IPC       (default)
//   SPIKE114_B_ITERS=30  iterations in phase B   (default 12)
//   SPIKE114_C_ITERS=12  iterations in phase C   (default 8)
//
// Costs ZERO CLI turns: every engine here is warmed and never sent a prompt,
// which is the exact state the ticket names ("a live, warmed, never-run query").
//
// ---------------------------------------------------------------------------
// WHAT IS ACTUALLY BEING ASKED, AND WHY IT IS THREE PHASES
//
// The observation this was filed from is rare and has not recurred: Electron's
// main process vanished in 2 of 6 runs of the #105 harness, both at the sixth
// iteration's `pickFolder`, with no exception and no stderr. Four later runs
// were clean, one of them nine iterations deep. So the premise arrives already
// unreproduced, and the honest instrument is one that can SEPARATE the two
// halves the ticket separates:
//
//   Phase A (no CLI, no app) — the source facts the premise rests on, in BOTH
//                            the app and the SDK. The app half is a drift
//                            alarm. The SDK half is the load-bearing one: it
//                            establishes what `close()` does to the child
//                            process, which is the difference between "main
//                            closed a pipe under itself" and "main asked
//                            politely and walked away".
//   Phase B (bare Node)     — the ticket's question (3): does the pair need a
//                            live warmed engine and a pill click, or does a
//                            tight close()/warmUp() reproduce it with neither?
//                            This is the CHEAPEST instrument that can see the
//                            mechanism, because it removes Electron, playwright,
//                            the renderer, the window and the IPC in one step.
//                            If a bare Node host dies here, the mechanism is
//                            real and below Electron. If it survives, every
//                            later phase is asking about Electron, not about
//                            the pair.
//   Phase C (the real app)  — the ticket's question (1): reachability, on the
//                            built app, over its own IPC, through the same
//                            `session:pick-folder` the deaths landed on.
//
// THE HOST IS THE INSTRUMENT, SO IT MUST NOT BE INSTRUMENTED. Phase B's loop
// runs in a CHILD node process with NO `uncaughtException` and NO
// `unhandledRejection` handler installed — installing one changes the very
// behaviour under test, since an unhandled error is exactly the candidate
// mechanism. The parent observes that child's exit code, signal and stderr from
// outside. A crash therefore stays a crash, and is still diagnosable.
//
// MISSED WINDOW ≠ EVIDENCE (#110). An iteration only counts if the engine was
// genuinely LIVE and WARMED at the moment it was closed — proven by the CLI's
// own `init` message arriving (the engine's onModelReport port). An iteration
// whose CLI never spoke is reported `unscored`, never as a survival.
//
// A NEGATIVE RESULT IS A RESULT. This spike may well kill its own premise; the
// ticket says so in those words. What it must not do is report "no crash in N
// runs" as "no defect" without saying what N was and what it could have seen.
//
// SCRUBBING (#90's rule). The findings carry counts, timings, booleans, exit
// codes and process NAMES only — never a cwd, a session id, a model id, a
// command name, a process path or an OS username.

import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync, spawn } from 'node:child_process'
import { pathToFileURL } from 'node:url'

const APP_DIR = resolve(import.meta.dirname, '..')
const SDK_DIR = join(APP_DIR, 'node_modules/@anthropic-ai/claude-agent-sdk')

// ---------------------------------------------------------------------------
// The OS witness, shared by both halves. Produced by the operating system and
// blind to every array in this file. A recursive descendant walk rather than a
// direct-children check: the SDK is free to interpose a launcher, and a direct
// check would then read 0 in BOTH states — a silent, confident, wrong answer.
// ---------------------------------------------------------------------------

const processTree = () => {
  const out =
    process.platform === 'win32'
      ? spawnSync(
          'powershell',
          [
            '-NoProfile',
            '-Command',
            'Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,Name | ConvertTo-Csv -NoTypeInformation'
          ],
          { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }
        )
      : spawnSync('ps', ['-eo', 'pid,ppid,comm'], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
  const rows = []
  for (const line of (out.stdout ?? '').split('\n')) {
    const t = line.trim()
    if (!t) continue
    if (process.platform === 'win32') {
      const m = t.match(/^"(\d+)","(\d+)","(.*)"$/)
      if (m) rows.push({ pid: Number(m[1]), ppid: Number(m[2]), name: m[3] })
    } else {
      const m = t.match(/^(\d+)\s+(\d+)\s+(.*)$/)
      if (m) rows.push({ pid: Number(m[1]), ppid: Number(m[2]), name: m[3].trim() })
    }
  }
  return rows
}

// CLI descendants of `rootPid`. Names only — a full path carries the operator's
// home directory.
const cliDescendants = (rootPid) => {
  const rows = processTree()
  if (rows.length === 0) return null
  const byParent = new Map()
  for (const r of rows) {
    const list = byParent.get(r.ppid) ?? []
    list.push(r)
    byParent.set(r.ppid, list)
  }
  const seen = new Set()
  const stack = [rootPid]
  const names = []
  while (stack.length) {
    const pid = stack.pop()
    if (seen.has(pid)) continue
    seen.add(pid)
    for (const child of byParent.get(pid) ?? []) {
      if (/claude|node/i.test(child.name)) names.push(child.name.toLowerCase())
      stack.push(child.pid)
    }
  }
  return { count: names.filter((n) => /claude/i.test(n)).length, names: [...new Set(names)].sort() }
}

// ===========================================================================
// PHASE B CHILD — re-entry. Everything above this line is shared; nothing below
// it runs in the parent.
//
// This is the app's pair and nothing else: close a live, warmed, never-run
// engine and construct another in the same tick, exactly as
// `session:pick-folder` does (`discardEngine(null)` → `makeEngine()` →
// `warmUp()`), then optionally take the #112 list read off the rebuilt handle.
//
// NO crash handlers here, deliberately — see the header.
// ===========================================================================

if (process.argv.includes('--child-b')) {
  const enginePath = process.env['SPIKE114_ENGINE_BUNDLE']
  const iters = Number(process.env['SPIKE114_B_ITERS'] ?? 12)
  const doRead = process.env['SPIKE114_B_READ'] === '1'
  const { createEngine } = await import(pathToFileURL(enginePath).href)
  const { resolveHostCli, toCliOptions } = await import(
    pathToFileURL(join(APP_DIR, 'src/main/cli-path.ts')).href
  )
  const { snapshotWispEnv, resolveSpawnEnv, initialMode } = await import(
    pathToFileURL(join(APP_DIR, 'src/main/backend-mode.ts')).href
  )
  const { toPermissionOptions, getPermissionMode } = await import(
    pathToFileURL(join(APP_DIR, 'src/main/permission-mode.ts')).href
  )

  const hostCli = resolveHostCli(process.env['PATH'], process.platform)
  const snapshot = snapshotWispEnv(process.env)
  const backendMode = initialMode(snapshot)
  const workDir = mkdtempSync(join(tmpdir(), 'spike-114-b-'))
  writeFileSync(join(workDir, 'README.md'), '# spike 114 scratch\n')

  const emit = (o) => console.log(`@@${JSON.stringify(o)}`)
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

  // The app's makeEngine, minus only the BrowserWindow broadcasts — there is no
  // window here, and the ports that touch one are what this phase removes on
  // purpose.
  const make = () =>
    createEngine(
      () => workDir,
      () => new Promise(() => {}),
      undefined,
      {
        getEnv: () => resolveSpawnEnv(backendMode, snapshot, process.env),
        // The app's launch default, read from the app's own store rather than
        // hardcoded — a hardcoded 'bypassPermissions' would keep passing after
        // the default changed, and would then be measuring a different query.
        getPermissionOptions: () => toPermissionOptions(getPermissionMode()),
        getModelOptions: () => ({}),
        getCliOptions: () => toCliOptions(hostCli)
      }
    )

  // THE WINDOW GATE, and it went through one wrong answer first. `onModelReport`
  // looks like the obvious proof that a query is live — engine.ts's own comment
  // says the `init` carrying the first model "arrives during warmUp()". Probed
  // here: in 20s of warm-up this CLI emitted only `hook_started`/`hook_response`
  // and NO `init` at all, so a gate on the model report scores every iteration
  // as dead and the phase measures nothing.
  //
  // `listModels()` is the right gate for a second reason as well as a working
  // one: it is `supportedModels()` over the control protocol, so a non-empty
  // answer proves the CLI completed its handshake and is serving requests — the
  // literal content of "a live, warmed, never-run query", asked of the engine
  // that is ABOUT to be closed. #105 measured this channel at 15 models in this
  // same sandbox and #112 reconfirmed it twice, so an empty answer here is a
  // real negative rather than the standing `gui-52` red.
  const warmed = async (ms) => {
    const t0 = Date.now()
    while (Date.now() - t0 < ms) {
      const models = await engine.listModels().catch(() => [])
      if (models.length > 0) return true
      await sleep(500)
    }
    return false
  }

  emit({ k: 'child-start', pid: process.pid, iters, read: doRead })

  let engine = make()
  engine.warmUp()

  for (let i = 1; i <= iters; i += 1) {
    const live = await warmed(45000)
    // The window gate. An engine that never spoke was never the state under
    // test, so this iteration is unscored rather than a survival (#110).
    const before = cliDescendants(process.pid)
    emit({ k: 'pre-close', i, live, cliBefore: before?.count ?? null })

    // ---- the pair, in one synchronous block, exactly as pick-folder does ----
    //
    // Decomposed, because "the pair" is three calls with three different costs
    // and the first run showed the whole thing taking over a second of
    // STRAIGHT-LINE time. Which of the three owns that second is the difference
    // between a teardown that blocks and a spawn that blocks, and they have
    // nothing in common as defects.
    const t0 = Date.now()
    engine.close()
    const t1 = Date.now()
    engine = make()
    const t2 = Date.now()
    engine.warmUp()
    const t3 = Date.now()
    const pairMs = t3 - t0
    // ------------------------------------------------------------------------

    // Sampled IMMEDIATELY, before the sleep below: this is the moment the ticket
    // describes — the old child closed and the new one constructed in one tick.
    const at0 = cliDescendants(process.pid)?.count ?? null

    // #112's own addition: a list read off the freshly rebuilt handle. The read
    // is what made this path routine rather than rare, so it belongs in the
    // shape at least some of the time.
    let readLen = null
    if (doRead) readLen = (await engine.listModels()).length

    // Reap latency, sampled: does the closed child actually go away, and when?
    // This is the fact phase A predicts from the SDK source, measured here.
    await sleep(1200)
    const at1200 = cliDescendants(process.pid)?.count ?? null
    emit({
      k: 'post-close',
      i,
      pairMs,
      closeMs: t1 - t0,
      makeMs: t2 - t1,
      warmMs: t3 - t2,
      readLen,
      cliAt0: at0,
      cliAt1200: at1200
    })
  }

  await sleep(500)

  // ATTRIBUTION for the straight-line second the loop above measures. `warmUp()`
  // owns essentially all of the pair's duration, but "warmUp is slow" names a
  // function in this repo when the cost may belong to the SDK's `query()`
  // constructor, which spawns the CLI child inline rather than deferring it.
  // Timed here with the engine removed entirely, so the number cannot be about
  // engine.ts. Cheap, and it is the difference between a fix we could make and
  // one we could only ask for.
  const { query } = await import(pathToFileURL(join(SDK_DIR, 'sdk.mjs')).href)
  const idle = { [Symbol.asyncIterator]: () => ({ next: () => new Promise(() => {}) }) }
  const qt0 = Date.now()
  const bareQuery = query({
    prompt: idle,
    options: {
      cwd: workDir,
      includePartialMessages: true,
      env: resolveSpawnEnv(backendMode, snapshot, process.env),
      ...toPermissionOptions(getPermissionMode()),
      ...toCliOptions(hostCli)
    }
  })
  const sdkQueryConstructMs = Date.now() - qt0
  bareQuery.close?.()

  emit({
    k: 'child-end',
    cliAtEnd: cliDescendants(process.pid)?.count ?? null,
    sdkQueryConstructMs
  })
  engine.close()
  // Best-effort: a CLI child still holds this cwd for seconds after close() (the
  // very reap window phase A predicts), so rmSync throws EBUSY on Windows. An
  // uncaught throw here exits 1 and would be read as the host dying — the
  // harness reporting its own cleanup as the phenomenon.
  try {
    rmSync(workDir, { recursive: true, force: true })
  } catch {
    /* the OS reaps it; a stray temp dir is not a finding */
  }
  process.exit(0)
}

// ===========================================================================
// PARENT
// ===========================================================================

const PHASES = (process.env['SPIKE114_PHASES'] ?? 'ABC').toUpperCase()
const B_ITERS = Number(process.env['SPIKE114_B_ITERS'] ?? 12)
const C_ITERS = Number(process.env['SPIKE114_C_ITERS'] ?? 8)
const findingsPath = new URL('./spike-114-findings.json', import.meta.url)

const fails = []
const fail = (m) => {
  fails.push(m)
  console.log(`FAIL  ${m}`)
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

setTimeout(() => {
  console.log('TIMEOUT')
  process.exit(1)
}, 3600000).unref?.()

const sdkVersion = JSON.parse(readFileSync(join(SDK_DIR, 'package.json'), 'utf8')).version
console.log(`SDK      : ${sdkVersion}`)
console.log(`platform : ${process.platform}`)
console.log(`phases   : ${PHASES}\n`)

// ---------------------------------------------------------------------------
// Phase A — the source facts, in the app AND in the SDK
//
// Each fact records the TEXT it matched, not just a boolean. A source fact that
// tracks a spelling reports a rename as a fix (#113's landmine): a reader who
// can see the snippet can tell a moved line from a deleted one, and a diff of
// the findings file shows the drift instead of hiding it behind `false`.
// ---------------------------------------------------------------------------

const mainSrc = readFileSync(join(APP_DIR, 'src/main/index.ts'), 'utf8')
const engineSrc = readFileSync(join(APP_DIR, 'src/main/engine.ts'), 'utf8')
const listEngineSrc = readFileSync(join(APP_DIR, 'src/main/list-engine.ts'), 'utf8')
const sdkSrc = readFileSync(join(SDK_DIR, 'sdk.mjs'), 'utf8')

const snippet = (src, re, span = 260) => {
  const m = src.match(re)
  if (!m || m.index === undefined) return null
  return src.slice(m.index, m.index + span).replace(/\s+/g, ' ').trim()
}

const handlerBody = (channel) => {
  const idx = mainSrc.indexOf(`ipcMain.handle('${channel}'`)
  if (idx < 0) return null
  return mainSrc.slice(idx, idx + 1400)
}

console.log('phase A — source facts (app) and process facts (SDK)')

const discardBody = snippet(mainSrc, /const discardEngine = /, 320)
const pickBody = handlerBody('session:pick-folder')
const closeBody = snippet(engineSrc, /const close = \(\): void => \{/, 420)

// The app's half. These are the premise, stated as lines.
const appFacts = {
  // discardEngine closes, then drops the handle — in that order.
  discardClosesThenNulls:
    discardBody !== null &&
    discardBody.indexOf('engine?.close()') >= 0 &&
    discardBody.indexOf('engine?.close()') < discardBody.indexOf('engine = null'),
  // pick-folder discards, rebuilds and warms with NO await between them, which
  // is what "in the same tick" means and is the whole of the ticket's claim.
  pickPairIsSynchronous: (() => {
    if (pickBody === null) return false
    const from = pickBody.indexOf('discardEngine(')
    const to = pickBody.indexOf('warmUp(')
    if (from < 0 || to < 0 || to < from) return false
    return !/\bawait\b/.test(pickBody.slice(from, to))
  })(),
  listReadRebuildsLazily: /ensureListEngine\(/.test(handlerBody('model:list') ?? ''),
  ensureRebuildsAndWarms:
    /ports\.make\(\)/.test(listEngineSrc) && /ports\.warmUp\(/.test(listEngineSrc),
  // close() is synchronous — no await anywhere in its body. If this ever stops
  // being true the "same tick" framing stops being true with it.
  engineCloseIsSynchronous: closeBody !== null && !/\bawait\b/.test(closeBody),
  snippets: { discardEngine: discardBody, engineClose: closeBody }
}

for (const [k, v] of Object.entries(appFacts)) {
  if (k === 'snippets') continue
  console.log(`  app  ${k.padEnd(24)} ${v}`)
  if (v !== true) fail(`app source fact ${k} is no longer true — this harness is out of date`)
}

// The SDK's half, and the load-bearing part of this phase. The ticket asks what
// `close()` does to the CLI child. The app's close() calls `currentQuery.close()`
// and returns; what happens to the OS process is decided HERE, and the answer
// changes what the premise can even mean.
const transportClose = snippet(sdkSrc, /close\(\)\{if\(this\.spawnAbort/, 1800)
const sdkFacts = {
  located: transportClose !== null,
  // Does close() end stdin rather than killing? An end is a request; a kill is
  // not, and the two have completely different failure surfaces.
  endsStdinFirst: transportClose !== null && /this\.processStdin\.end\(\)/.test(transportClose),
  // Is any kill DEFERRED behind a timer rather than issued inline? If so, the
  // "same tick" in the ticket's framing contains no kill at all.
  killIsDeferred: transportClose !== null && /setTimeout\(/.test(transportClose),
  win32DelayedKillMs: (() => {
    if (transportClose === null) return null
    // The win32 arm: an outer timer, then an inner one, then SIGKILL. Recorded
    // as the numbers the SOURCE carries rather than as a claim about them — and
    // the outer delay is a minified `var`, not a literal, so it is resolved
    // through its binding. Reading the inner literal for both (the obvious
    // regex) silently reports 5000/5000 and understates the window by 2s.
    const inner = transportClose.match(/win32"\)\{setTimeout\(\([^)]*\)=>\{[^}]*kill\("SIGKILL"\)[^}]*\},(\d+)/)
    const outerRef = transportClose.match(/\},([A-Za-z$_][\w$]*),[A-Za-z$_][\w$]*,[A-Za-z$_][\w$]*\)\.unref\(\)/)
    const outerLit = outerRef ? sdkSrc.match(new RegExp(`\\b${outerRef[1]}\\s*=\\s*(\\d+)`)) : null
    const outer = outerLit ? Number(outerLit[1]) : null
    const innerMs = inner ? Number(inner[1]) : null
    return {
      outer,
      inner: innerMs,
      totalToSigkill: outer !== null && innerMs !== null ? outer + innerMs : null
    }
  })(),
  // Both halves of the pipe pair. An `error` event on a stream with NO listener
  // is an uncaught exception in Node — which is the single most obvious way a
  // host process dies "with no exception thrown by anything you wrote".
  stdinHasErrorListener: /this\.processStdin\.on\("error"/.test(sdkSrc),
  stderrHasErrorListener: /stderr\.on\("error"/.test(sdkSrc),
  childHasErrorListener: /\.on\("error",\([a-zA-Z$_]+\)=>\{this\.ready=!1/.test(sdkSrc),
  // The exit hook the SDK installs process-wide, and what it does on win32.
  installsProcessExitHook: /process\.on\("exit",/.test(sdkSrc),
  snippet: transportClose ? transportClose.slice(0, 900) : null
}
for (const [k, v] of Object.entries(sdkFacts)) {
  if (k === 'snippet') continue
  console.log(`  sdk  ${k.padEnd(24)} ${JSON.stringify(v)}`)
}
if (!sdkFacts.located) {
  fail('could not locate the SDK transport close() — the SDK moved under this harness')
}

// A stdout `error` listener is the one this file expects to be ABSENT. Recorded
// as an observation, never as a verdict: absence here is only interesting if
// phase B or C produces a death, and an absence assertion with no positive
// control measures nothing (#76). The positive control is the three listeners
// above, which the same scan DOES find.
console.log(
  `  sdk  ${'stdoutErrorListener'.padEnd(24)} ${/processStdout\.on\("error"/.test(sdkSrc)} (observation only)\n`
)

// ---------------------------------------------------------------------------
// Phase B — bare Node, no Electron: the tight pair at volume
// ---------------------------------------------------------------------------

let phaseB = { ran: false }

if (PHASES.includes('B')) {
  console.log(`phase B — bare Node, ${B_ITERS} close/rebuild pairs, no Electron`)

  // Inside node_modules/, NOT the OS temp dir: the bundle keeps the SDK
  // external on purpose, and an ESM bare import only resolves from a path with
  // node_modules above it. In tmpdir() the child dies with ERR_MODULE_NOT_FOUND
  // before it has held a single engine.
  const tmpDir = mkdtempSync(join(APP_DIR, 'node_modules/.spike-114-'))
  const bundlePath = join(tmpDir, 'engine.mjs')
  // The REAL engine.ts, bundled rather than reimplemented — a reimplementation
  // would measure this file instead of the app. The SDK stays external so the
  // child process spawns through the same code the app does.
  //
  // The JS API rather than the CLI: spawnSync on a `.cmd` shim fails outright on
  // modern Node/Windows without `shell: true`, and it fails with an EMPTY
  // stderr, which is indistinguishable from "esbuild ran and said nothing".
  let bundled = false
  try {
    const esbuild = await import('esbuild')
    await esbuild.build({
      entryPoints: [join(APP_DIR, 'src/main/engine.ts')],
      bundle: true,
      format: 'esm',
      platform: 'node',
      external: ['@anthropic-ai/claude-agent-sdk'],
      outfile: bundlePath,
      logLevel: 'silent'
    })
    bundled = true
  } catch (e) {
    fail(`could not bundle engine.ts: ${String(e?.message ?? e).slice(0, 400)}`)
  }

  const runChild = (label, read) =>
    new Promise((res) => {
      const events = []
      const stderrTail = []
      const child = spawn(
        process.execPath,
        ['--experimental-strip-types', import.meta.filename, '--child-b'],
        {
          cwd: APP_DIR,
          env: {
            ...process.env,
            SPIKE114_ENGINE_BUNDLE: bundlePath,
            SPIKE114_B_ITERS: String(B_ITERS),
            SPIKE114_B_READ: read ? '1' : '0'
          },
          stdio: ['ignore', 'pipe', 'pipe']
        }
      )
      let buf = ''
      child.stdout.on('data', (b) => {
        buf += String(b)
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('@@')) continue
          const ev = JSON.parse(line.slice(2))
          events.push(ev)
          if (ev.k === 'pre-close') {
            process.stdout.write(
              `  ${label} iter ${String(ev.i).padStart(2)} live:${ev.live ? 'yes' : 'NO '} cli:${ev.cliBefore}`
            )
          }
          if (ev.k === 'post-close') {
            process.stdout.write(
              ` → close ${String(ev.closeMs).padStart(4)} make ${String(ev.makeMs).padStart(3)}` +
                ` warm ${String(ev.warmMs).padStart(4)}ms · cli ${ev.cliAt0}→${ev.cliAt1200}\n`
            )
          }
        }
      })
      child.stderr.on('data', (b) => {
        stderrTail.push(String(b))
        if (stderrTail.length > 40) stderrTail.shift()
      })
      child.on('exit', (code, signal) => res({ events, code, signal, stderrTail }))
    })

  // Two shapes: the bare pair, and the pair followed by #112's list read. Run
  // separately so a death can be attributed to one of them rather than to
  // "something in the loop".
  //
  // Not attempted at all when the bundle failed: a child that exits 1 because
  // its import was missing is a DEAD HARNESS, and reading that as a dead host is
  // this repo's oldest instrument trap (#79 — "an instrument can report a gate's
  // success as the artifact it measures"; here it would report its own breakage
  // as the defect).
  const bare = bundled ? await runChild('bare', false) : null
  const withRead = bundled ? await runChild('read', true) : null

  const summarise = (r) => {
    const pre = r.events.filter((e) => e.k === 'pre-close')
    const post = r.events.filter((e) => e.k === 'post-close')
    const scored = pre.filter((e) => e.live === true && (e.cliBefore ?? 0) > 0)
    const stat = (key) => {
      const v = post.map((e) => e[key]).filter((n) => typeof n === 'number').sort((a, b) => a - b)
      return v.length ? { min: v[0], median: v[Math.floor(v.length / 2)], max: v[v.length - 1] } : null
    }
    const pairMs = post.map((e) => e.pairMs).sort((a, b) => a - b)
    const hostSurvived = r.code === 0 && r.signal === null
    return {
      hostSurvived,
      // The discriminating fact, and NOT `!hostSurvived`. A child that exits
      // non-zero having never proved a live warmed engine died of its own setup,
      // which is a broken harness rather than the phenomenon. Only a death with
      // at least one scored pair behind it is evidence about the pair.
      diedWhileScoring: !hostSurvived && scored.length > 0,
      exitCode: r.code,
      exitSignal: r.signal,
      iterationsRequested: B_ITERS,
      iterationsCompleted: post.length,
      // An iteration only counts if the engine was live AND the OS agreed a CLI
      // child existed. Everything else is unscored, never a survival (#110).
      iterationsScored: scored.length,
      iterationsUnscored: pre.length - scored.length,
      pairMs: pairMs.length
        ? { min: pairMs[0], median: pairMs[Math.floor(pairMs.length / 2)], max: pairMs[pairMs.length - 1] }
        : null,
      // Where the pair's straight-line time actually goes.
      closeMs: stat('closeMs'),
      makeMs: stat('makeMs'),
      warmMs: stat('warmMs'),
      // The reap fact: CLI children alive immediately after the pair and again
      // 1.2s later, while the replacement is already warming. 1 means the new
      // one only; 2 means the closed one is still there.
      cliRightAfterPair: post.map((e) => e.cliAt0),
      cliAlive1200msAfterClose: post.map((e) => e.cliAt1200),
      cliAtEnd: r.events.find((e) => e.k === 'child-end')?.cliAtEnd ?? null,
      // One sample, and labelled as one: enough to attribute the pair's second
      // to the SDK or to this repo, not enough to be a distribution.
      sdkQueryConstructMs: r.events.find((e) => e.k === 'child-end')?.sdkQueryConstructMs ?? null,
      stderrTail: r.stderrTail.join('').slice(-1200)
    }
  }

  phaseB = bundled
    ? { ran: true, bare: summarise(bare), withRead: summarise(withRead) }
    : { ran: false, skipped: 'engine.ts could not be bundled — nothing was measured' }
  rmSync(tmpDir, { recursive: true, force: true })

  for (const [name, s] of bundled
    ? [
        ['bare pair', phaseB.bare],
        ['pair+read', phaseB.withRead]
      ]
    : []) {
    console.log(
      `  ${name.padEnd(10)} host survived: ${s.hostSurvived} (exit ${s.exitCode}/${s.exitSignal})` +
        ` · scored ${s.iterationsScored}/${s.iterationsRequested}` +
        ` · pair median ${s.pairMs?.median ?? '-'}ms` +
        ` (close ${s.closeMs?.median ?? '-'} / make ${s.makeMs?.median ?? '-'} / warm ${s.warmMs?.median ?? '-'})`
    )
    if (s.iterationsScored === 0) {
      fail(`phase B ${name} scored ZERO iterations — it measured nothing, treat it as unscored`)
    }
  }
  console.log('')
}

// ---------------------------------------------------------------------------
// Phase C — the real app, over its own IPC, on the path the deaths landed on
// ---------------------------------------------------------------------------

let phaseC = { ran: false }

if (PHASES.includes('C')) {
  console.log(`phase C — the built app, ${C_ITERS} pick-folder rebuilds`)
  const { _electron: electron } = await import('playwright-core')

  const electronBin =
    process.platform === 'win32'
      ? join(APP_DIR, 'node_modules/electron/dist/electron.exe')
      : process.platform === 'darwin'
        ? join(APP_DIR, 'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron')
        : join(APP_DIR, 'node_modules/electron/dist/electron')

  const app = await electron.launch({
    executablePath: electronBin,
    // --disable-gpu is load-bearing in a headless session (#78): with GPU
    // compositing on, this app's window never paints. Nothing here is judged
    // visually, so flattened acrylic costs this run nothing.
    args: ['--no-sandbox', '--disable-gpu', '.'],
    cwd: APP_DIR,
    env: process.env,
    timeout: 30000
  })
  // The whole point of the phase: if main dies, every later evaluate fails with
  // "Target page, context or browser has been closed", which says WHEN and never
  // WHY. Keep the exit code, the signal and the stderr tail.
  const appStderr = []
  app.process().stderr?.on('data', (b) => {
    appStderr.push(String(b))
    if (appStderr.length > 60) appStderr.shift()
  })
  let appExit = null
  app.process().on('exit', (code, signal) => {
    appExit = { code, signal, atIter: null }
  })

  const page = await app.firstWindow()
  await page.waitForSelector('.titlebar, .app', { timeout: 30000 }).catch(() => {})

  const workDir = mkdtempSync(join(tmpdir(), 'spike-114-c-'))
  writeFileSync(join(workDir, 'README.md'), '# spike 114 scratch\n')
  await app.evaluate(({ dialog }, dir) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [dir] })
  }, workDir)

  const mainPid = await app.evaluate(() => process.pid)
  const iters = []
  let diedAt = null
  let postMortem = null

  for (let i = 1; i <= C_ITERS; i += 1) {
    let ok = true
    let err = null
    // The SAME window gate as phase B, so the two phases count the same thing:
    // a non-empty model list is `supportedModels()` answering over the control
    // protocol, which no merely-spawned process can do. It also GUARANTEES the
    // state under test rather than hoping for it — `model:list` rebuilds a null
    // handle (#112), so every pick below is preceded by a live warmed engine,
    // including the first.
    let live = false
    try {
      const models = await page.evaluate(() => window.api.listModels())
      live = (models?.models?.length ?? 0) > 0
    } catch (e) {
      ok = false
      err = `gate: ${String(e?.message ?? e).slice(0, 160)}`
    }
    const cliBefore = ok ? cliDescendants(mainPid) : null

    const t0 = Date.now()
    if (ok) {
      try {
        // The real handler. `session:pick-folder` is the exact path both deaths
        // landed on: discard a live warmed engine, rebuild and warm in one tick.
        await page.evaluate(() => window.api.pickFolder())
        // The #112 read, off the handle the pick just rebuilt.
        await page.evaluate(() => window.api.listModels())
      } catch (e) {
        ok = false
        err = String(e?.message ?? e).slice(0, 200)
      }
    }
    const ms = Date.now() - t0
    await sleep(1200)
    const cliAfter = ok ? cliDescendants(mainPid) : null
    const alive = appExit === null
    iters.push({
      i,
      ok,
      live,
      ms,
      cliBefore: cliBefore?.count ?? null,
      cliAfter: cliAfter?.count ?? null,
      mainAlive: alive,
      err
    })
    console.log(
      `  iter ${String(i).padStart(2)} ${ok ? 'ok ' : 'ERR'} live:${live ? 'yes' : 'NO '} ${String(ms).padStart(5)}ms` +
        ` cli ${cliBefore?.count ?? '-'}→${cliAfter?.count ?? '-'} main:${alive ? 'alive' : 'GONE'}` +
        (err ? ` — ${err}` : '')
    )
    if (!alive || !ok) {
      diedAt = i
      // THE DISCRIMINATION THIS PHASE EXISTS FOR. The observation behind #114 is
      // "every later page.evaluate failed with Target page, context or browser
      // has been closed" — which is playwright reporting its own connection, and
      // is equally true of a dead MAIN, a dead RENDERER, and a main that is
      // merely wedged. Asking MAIN directly separates them: main answers here
      // only if it is alive and pumping, and phase B has already measured that
      // `warmUp()` blocks it for over a second at a stretch.
      postMortem = { evaluateOk: ok, processExited: !alive }
      try {
        postMortem.mainAnsweredAfter = (await app.evaluate(() => process.pid)) === mainPid
      } catch (e) {
        postMortem.mainAnsweredAfter = false
        postMortem.mainProbeError = String(e?.message ?? e).slice(0, 200)
      }
      try {
        postMortem.pageClosed = page.isClosed()
      } catch {
        postMortem.pageClosed = null
      }
      console.log(
        `  post-mortem: process exited ${postMortem.processExited},` +
          ` main answered a fresh probe ${postMortem.mainAnsweredAfter},` +
          ` page closed ${postMortem.pageClosed}`
      )
      break
    }
  }

  if (appExit !== null) appExit.atIter = diedAt
  // Snapshotted BEFORE the teardown below, because app.close() fires the very
  // same exit handler: reading `appExit` afterwards would report this harness's
  // own orderly shutdown as the death it went looking for.
  const exitDuringRun = appExit
  const survived = exitDuringRun === null
  if (survived) await app.close().catch(() => {})
  await sleep(300)

  // Both halves: the CLI answered its control protocol AND the OS agreed a child
  // existed. Either alone is weaker than the state the ticket names.
  const scored = iters.filter((r) => r.live === true && (r.cliBefore ?? 0) > 0)
  phaseC = {
    ran: true,
    mainSurvived: survived,
    // Same discrimination as phase B: a death with no scored iteration behind it
    // is a launch or driver failure, not the pair.
    diedWhileScoring: !survived && scored.length > 0,
    // The ticket's question (2): what actually dies. Null when nothing did.
    mainExit: exitDuringRun,
    iterationsRequested: C_ITERS,
    iterationsCompleted: iters.length,
    // Same gate as phase B: an iteration whose engine was not demonstrably live
    // before the pick measured nothing.
    iterationsScored: scored.length,
    iterationsUnscored: iters.length - scored.length,
    diedAtIteration: diedAt,
    // Null unless something went wrong. When non-null it is the answer to the
    // ticket's question (2): what actually died.
    postMortem,
    pickMs: (() => {
      const v = iters.filter((r) => r.ok).map((r) => r.ms).sort((a, b) => a - b)
      return v.length ? { min: v[0], median: v[Math.floor(v.length / 2)], max: v[v.length - 1] } : null
    })(),
    cliCounts: iters.map((r) => ({ before: r.cliBefore, after: r.cliAfter })),
    stderrTail: appStderr.join('').slice(-2000)
  }
  rmSync(workDir, { recursive: true, force: true })
  if (phaseC.iterationsScored === 0) {
    fail('phase C scored ZERO iterations — the OS witness never saw a CLI child, so this run is unscored')
  }
  console.log(
    `  main survived: ${survived}` +
      (survived ? '' : ` — exit ${exitDuringRun.code}/${exitDuringRun.signal} at iter ${diedAt}`)
  )
  console.log('')
}

// ---------------------------------------------------------------------------
// Verdict
// ---------------------------------------------------------------------------

// Deliberately NOT "no crash ⇒ no defect". A rare event that did not recur in a
// bounded run is unreproduced, and saying so is the finding. The one thing this
// harness CAN settle positively is the mechanism question (3): whether the pair
// alone, with no Electron and no pill click, is enough.
// `diedWhileScoring`, never a bare non-zero exit: a host that exits 1 before it
// ever held a live warmed engine died of the harness, not of the pair.
const reproduced =
  (phaseB.ran && (phaseB.bare?.diedWhileScoring === true || phaseB.withRead?.diedWhileScoring === true)) ||
  (phaseC.ran && phaseC.diedWhileScoring === true)

const totalScored =
  (phaseB.ran ? (phaseB.bare?.iterationsScored ?? 0) + (phaseB.withRead?.iterationsScored ?? 0) : 0) +
  (phaseC.ran ? phaseC.iterationsScored : 0)

// A third outcome, and the one worth naming: the driver lost the app while the
// process was still alive. That is NOT the ticket's premise — it is the ticket's
// premise being mis-attributed, and it deserves its own word rather than being
// filed under either "reproduced" or "clean".
const driverLostLiveApp =
  phaseC.ran && phaseC.mainSurvived === true && phaseC.diedAtIteration !== null

const verdict = reproduced
  ? 'REPRODUCED — a host process died on the close/rebuild pair; see the exit code, post-mortem and stderr tail'
  : driverLostLiveApp
    ? 'DRIVER ARTEFACT — an evaluate failed while the main process was demonstrably still alive; the symptom the ticket was filed from is reproducible WITHOUT main dying'
    : totalScored === 0
      ? 'UNSCORED — no phase demonstrated a live warmed engine, so this run is evidence about nothing'
      : `NOT REPRODUCED in ${totalScored} scored close/rebuild pairs — the premise is unsupported by this run, and remains unreproduced rather than disproved`

const findings = {
  spike: 114,
  question: 'does closing a live, warmed engine and rebuilding it in the same tick kill the main process?',
  sdkVersion,
  platform: process.platform,
  phases: PHASES,
  phaseA_source: { app: appFacts, sdk: sdkFacts },
  phaseB_bareNode: phaseB,
  phaseC_app: phaseC,
  totalScoredPairs: totalScored,
  reproduced,
  driverLostLiveApp,
  verdict,
  fails
}

writeFileSync(findingsPath, JSON.stringify(findings, null, 2) + '\n')

console.log('---')
console.log(`scored pairs : ${totalScored}`)
console.log(`VERDICT      : ${verdict}`)
console.log(`findings     : scripts/spike-114-findings.json`)
if (fails.length > 0) console.log(`FAILS        : ${fails.length}`)
process.exit(0)
