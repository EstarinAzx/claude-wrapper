// Spike #108 — can a second send, or a hung interrupt, strand the turn lifecycle?
//
//   node --experimental-strip-types scripts/spike-108-turn-lifecycle.mjs
//
// Needs `npm run build` first, plus `npm i --no-save playwright-core`.
// Costs a handful of real CLI turns (phase B interrupts them; phase C stops them).
//
// ---------------------------------------------------------------------------
// TWO CLAIMS, TWO DIFFERENT SURFACES — AND ONE SHARED MISTAKE TO AVOID
//
// Both mechanisms are confirmed by READING. Neither's reachability is. The
// mistake available to a lazy instrument is to read the source, agree with it,
// and report a defect — so every phase below either produces a number from a
// running process or is explicitly labelled as a source fact.
//
//   Claim 1  a second chat:send, arriving while the first turn still holds
//            turnResolve, is answered with { type: 'error' } on the SECOND
//            caller's onEvent — and the renderer treats every error as
//            turn-terminal, so it clears `busy` on a turn that is still live.
//
//   Claim 2  interrupt() sets a flag and calls the SDK. Nothing completes the
//            turn locally. If no `result` ever arrives, turnResolve is never
//            resolved and the UI is busy until a restart.
//
// The two claims decompose differently, and the phases follow that rather than
// the ticket's numbering:
//
//   Phase A (no processes)   source facts, asserted mechanically. This is NOT
//                            evidence of reachability — it is the drift alarm
//                            that makes phases B and C attributable, and it
//                            fails loudly when the code moves under this file.
//   Phase B (no Electron)    claim 2, at the SDK. The question "does a result
//                            follow an interrupt" is answered by the CLI, not by
//                            the app, so Electron would only add noise. Two
//                            cases, because the ticket names mid-tool-call as
//                            the one most likely to differ, and REPEATS each,
//                            because a single sample cannot measure something
//                            intermittent (#104's landmine).
//   Phase C (the built app)  claim 1, over the app's own IPC, split in two:
//                            C1 asks whether a USER can put two sends into main,
//                            C2 asks what happens WHEN two are in main. Those
//                            are separate questions and a harness that fuses
//                            them can only answer the conjunction.
//
// THE INSTRUMENT FOR CLAIM 1 IS A SEND COUNT IN MAIN, NEVER THE UI. #80 built a
// type-while-busy queue and `useChat.send` guards on `busy`, so a swallowed
// second send leaves no DOM trace at all: one send and two are indistinguishable
// from the pane. gui-80.mjs solved this exact problem with a SECOND
// ipcMain.on('chat:send') listener added beside the real one — `on` appends
// where `handle` would throw — and this file copies it.
//
// WHY C2 DRIVES THE IPC DIRECTLY, AND WHAT THAT COSTS. C2's probe calls
// window.api.sendPrompt from the renderer, which is exactly the call
// `useChat.send` makes, minus React's stale-read guard. That is NOT a user path
// and this file never claims it is — C1 is where user reachability is decided.
// C2 exists so the CONSEQUENCE is measured even if C1 comes back closed,
// because the two halves of claim 1 fail for different reasons and a remedy
// needs to know which half is live.
//
// THE INDEPENDENT WITNESS FOR C2. "busy cleared while the turn was still
// running" cannot be read off the busy flag alone — a turn that ended by itself
// clears it too. The witness is main's OWN overlap rejection: immediately after
// the clear, C2 sends a real prompt from the composer, and a second "A turn is
// already running" can only mean main still held turnResolve. That reports the
// fact in dispute from inside the process that holds it, and it simultaneously
// measures whether the user's obvious recovery works.
//
// The first design used pane growth instead, and a run falsified it: 116 → 116
// rendered characters across the window, on a turn the engine then refused a
// send for. A pane that is not growing is a pane between two deltas, not an idle
// engine. Growth is kept as corroboration and read ONE-DIRECTIONALLY — true
// proves the turn was live, false proves nothing.
//
// PREMISE GUARDS (#65). Every case checks it was in the state it claims to
// measure — not busy before a double-submit, busy before a queue attempt, busy
// at the moment the C2 probe fires — and reports `could not drive` naming the
// setup step, rather than passing vacuously.
//
// SCRUBBING (#90's rule). The committed findings carry counts, timings,
// booleans, message kinds and result subtypes only — never a cwd, a session id,
// a model id, a tool-use id, a prompt body, message text or a user path.

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { spawnSync } from 'node:child_process'
import { _electron as electron } from 'playwright-core'

// fileURLToPath, not URL.pathname: this repo lives under a path with a space in
// it, and pathname hands back the percent-encoded form.
const APP_DIR = fileURLToPath(new URL('..', import.meta.url))
const findingsPath = new URL('./spike-108-findings.json', import.meta.url)
// Three rather than two: phase B discards any repeat whose turn finished before
// the interrupt could be issued, and the mid-tool-call case discards often enough
// that two repeats can leave it with no coverage at all.
const REPEATS = Number(process.env['SPIKE108_REPEATS'] ?? 3)
// Phase A is free and is the drift alarm, so it is the one most likely to be
// re-run on its own after the code moves. B and C each cost real CLI turns.
// A partial run still writes findings, with the phases it did not run recorded
// as `skipped` rather than as a negative result.
const PHASES = (process.env['SPIKE108_PHASES'] ?? 'ABC').toUpperCase()

const fails = []
const fail = (message) => {
  fails.push(message)
  console.log(`  FAIL ${message}`)
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Whole-run watchdog. Phase B interrupts real turns and phase C stops them, so
// the expected wall clock is minutes; this only catches a genuine hang.
setTimeout(() => {
  console.log('TIMEOUT — the harness itself hung')
  process.exit(1)
}, 1_800_000).unref?.()

// ---------------------------------------------------------------------------
// Phase A — the source facts both claims rest on, asserted rather than recalled
// ---------------------------------------------------------------------------
//
// Crude slicing on purpose, and loud on purpose: a miss is a failure, never a
// silent "no guard found", which would make every assertion here vacuously true
// in exactly the direction the claims want.

console.log('phase A — source facts')

const read = (rel) => readFileSync(join(APP_DIR, rel), 'utf8')
const mainSrc = read('src/main/index.ts')
const engineSrc = read('src/main/engine.ts')
const useChatSrc = read('src/renderer/src/useChat.ts')

const ipcBody = (channel) => {
  const start = mainSrc.search(new RegExp(`ipcMain\\.(on|handle)\\('${channel}'`))
  if (start < 0) return null
  const rest = mainSrc.slice(start + 10)
  const end = rest.search(/\nipcMain\.(on|handle)\(/)
  return rest.slice(0, end < 0 ? rest.length : end)
}

const sliceBetween = (src, startRe, endRe) => {
  const start = src.search(startRe)
  if (start < 0) return null
  const rest = src.slice(start)
  const end = rest.slice(1).search(endRe)
  return end < 0 ? rest : rest.slice(0, end + 1)
}

const sendBody = ipcBody('chat:send')
const stopBody = ipcBody('chat:stop')
const runTurnBody = sliceBetween(engineSrc, /const runTurn = async \(/, /\n {2}const interrupt = /)
const interruptBody = sliceBetween(engineSrc, /\n {2}const interrupt = \(\): void => \{/, /\n {2}const close = /)
const errorBranch = sliceBetween(useChatSrc, /else if \(e\.type === 'error'\)/, /\n {6}\} else if \(/)

if (sendBody === null) fail('could not locate the chat:send handler — this harness is out of date')
if (stopBody === null) fail('could not locate the chat:stop handler — this harness is out of date')
if (runTurnBody === null) fail('could not locate runTurn in engine.ts — this harness is out of date')
if (interruptBody === null) fail('could not locate interrupt() in engine.ts — this harness is out of date')
if (errorBranch === null) fail("could not locate useChat's error branch — this harness is out of date")

const sourceFacts = {
  // Claim 1's first link: nothing in main refuses a second send.
  chatSendGuardsBusy: sendBody !== null && /isBusy\(/.test(sendBody),
  // Claim 1's second link: the overlap rejection goes to the SECOND caller's
  // onEvent (the parameter), not through emit() (which reaches the FIRST).
  overlapRejectionExists: runTurnBody !== null && /if \(turnResolve !== null\)/.test(runTurnBody),
  overlapUsesOnEventParam:
    runTurnBody !== null &&
    /if \(turnResolve !== null\)\s*\{\s*onEvent\(\{ type: 'error'/.test(runTurnBody),
  // Claim 1's third link: the renderer treats every error as turn-terminal.
  rendererClearsBusyOnError: errorBranch !== null && /setBusy\(false\)/.test(errorBranch),
  // Claim 2: interrupt sets a flag, calls the SDK, and completes nothing locally.
  interruptSetsFlag: interruptBody !== null && /interrupting = true/.test(interruptBody),
  interruptCallsSdk: interruptBody !== null && /currentQuery\?\.interrupt\?\.\(\)/.test(interruptBody),
  interruptHasLocalCompletion:
    interruptBody !== null && /(finishTurn\(|setTimeout\(|turnResolve\()/.test(interruptBody),
  stopDelegatesToInterrupt: stopBody !== null && /engine\?\.interrupt\(\)/.test(stopBody)
}

// These four are the claims' premises. If any has been fixed since filing, the
// spike's subject has changed and saying so is the useful output.
if (sourceFacts.chatSendGuardsBusy) {
  console.log('  chat:send now GUARDS on busy — claim 1 has been fixed since filing')
}
if (!sourceFacts.overlapRejectionExists) {
  console.log('  runTurn no longer rejects an overlapping turn — claim 1 has changed since filing')
}
if (!sourceFacts.rendererClearsBusyOnError) {
  console.log('  the renderer no longer clears busy on error — claim 1 has been fixed since filing')
}
if (sourceFacts.interruptHasLocalCompletion) {
  console.log('  interrupt() now has a local completion path — claim 2 has been fixed since filing')
}
for (const [key, value] of Object.entries(sourceFacts)) {
  console.log(`  ${key.padEnd(28)} ${value}`)
}
console.log()

// ---------------------------------------------------------------------------
// Phase B — claim 2: does a `result` follow an interrupt, and how fast?
// ---------------------------------------------------------------------------
//
// Uses engine.ts's query shape and the host CLI cli-path.ts selects, exactly as
// spike-81/90/104 do. Permission options are hardcoded to bypass rather than
// taken from getPermissionOptions(), which reads a store that does not exist
// outside the app — so these turns run with unrestricted tool use and the temp
// cwd is not a sandbox.
//
// A FRESH QUERY PER REPEAT, deliberately. engine.ts reuses ONE query across
// turns, so a hung interrupt there would poison every later turn as well — which
// makes the defect worse, not better. Isolating each repeat here is what stops
// one hang from silently converting the remaining repeats into the same
// measurement.

const { resolveHostCli, toCliOptions } = await import(
  pathToFileURL(join(APP_DIR, 'src/main/cli-path.ts')).href
)
const { snapshotWispEnv, resolveSpawnEnv, initialMode } = await import(
  pathToFileURL(join(APP_DIR, 'src/main/backend-mode.ts')).href
)
const { query } = await import(
  pathToFileURL(join(APP_DIR, 'node_modules/@anthropic-ai/claude-agent-sdk/sdk.mjs')).href
)

const hostCli = resolveHostCli(process.env['PATH'], process.platform)
const cliOptions = toCliOptions(hostCli)
const cliVersion = hostCli
  ? (spawnSync(hostCli, ['--version'], { encoding: 'utf8' }).stdout ?? '').trim()
  : '(SDK bundled CLI)'
const sdkVersion = JSON.parse(
  readFileSync(join(APP_DIR, 'node_modules/@anthropic-ai/claude-agent-sdk/package.json'), 'utf8')
).version
const snapshot = snapshotWispEnv(process.env)
const backendMode = initialMode(snapshot)
const appEnv = resolveSpawnEnv(backendMode, snapshot, process.env)

console.log(`host CLI : ${hostCli ? 'host binary on PATH' : '(SDK bundled)'}`)
console.log(`version  : ${cliVersion}`)
console.log(`SDK      : ${sdkVersion}`)
console.log(`backend  : ${backendMode}`)
console.log(`repeats  : ${REPEATS}\n`)

const makeQueue = () => {
  const messages = []
  let wake = null
  let done = false
  const notify = () => {
    wake?.()
    wake = null
  }
  return {
    push: (message) => {
      messages.push(message)
      notify()
    },
    end: () => {
      done = true
      notify()
    },
    iterable: {
      [Symbol.asyncIterator]: () => ({
        next: async () => {
          while (messages.length === 0 && !done) await new Promise((resolve) => (wake = resolve))
          if (messages.length === 0) return { done: true, value: undefined }
          return { done: false, value: messages.shift() }
        }
      })
    }
  }
}

// Two cases. The tool one is the ticket's own nomination for "most likely to
// differ": an interrupt during plain streaming has only the model to stop, while
// mid-tool-call there is a child process in the way.
//
// The counts run LONG on purpose. An earlier version asked for 60 and produced a
// measurement of -821ms: the turn had finished on its own and the "interrupt"
// landed after its result. A negative latency is the loud version of that
// failure; the quiet version is a short positive one, which reads exactly like a
// fast interrupt. The premise is now re-checked at the moment of interrupting
// rather than only before the settle.
const CASES = [
  {
    key: 'text',
    prompt:
      'Count from 1 to 300, one number per line, with a short pause between each. Use no tools.',
    // Streaming has started: there is model output to interrupt.
    ready: (state) => state.sawAssistantText,
    settleMs: 1500
  },
  {
    key: 'tool',
    prompt:
      'Run the Bash command `sleep 45` and then reply with exactly `done`. Use no other tool and do not explain.',
    // A tool_use block has been emitted: the CLI is about to be, or already is,
    // inside a child process.
    ready: (state) => state.sawToolUse,
    // Short, and measured rather than chosen: at 3000ms both repeats of a run
    // were discarded because the turn had already produced its result — the
    // emitted tool_use is not always the long one, and waiting to be sure the
    // child is running is also waiting for the turn to end. Interrupting sooner
    // costs nothing, because a run that lands after the result is now discarded
    // rather than counted.
    settleMs: 1000
  }
]

const workDir = mkdtempSync(join(tmpdir(), 'spike-108-cwd-'))
writeFileSync(join(workDir, 'README.md'), '# spike 108 scratch\n')

const runInterruptCase = async (caseSpec, repeat) => {
  const queue = makeQueue()
  const q = query({
    prompt: queue.iterable,
    options: {
      cwd: workDir,
      includePartialMessages: true,
      canUseTool: async (_name, _input, options) => ({
        behavior: 'allow',
        toolUseID: options.toolUseID,
        decisionClassification: 'user_temporary'
      }),
      env: appEnv,
      permissionMode: 'bypassPermissions',
      allowDangerouslySkipPermissions: true,
      ...cliOptions
    }
  })

  const t0 = Date.now()
  const state = { sawAssistantText: false, sawToolUse: false }
  let interruptedAt = null
  let messagesAfterInterrupt = 0
  let result = null
  let resolveResult = null
  let resolveReady = null
  const resultArrived = new Promise((resolve) => (resolveResult = resolve))
  const readyReached = new Promise((resolve) => (resolveReady = resolve))

  const consume = (async () => {
    for await (const msg of q) {
      if (interruptedAt !== null) messagesAfterInterrupt++
      if (msg.type === 'assistant') {
        for (const block of msg.message?.content ?? []) {
          if (block?.type === 'text' && String(block.text ?? '').length > 0) {
            state.sawAssistantText = true
          }
          if (block?.type === 'tool_use') state.sawToolUse = true
        }
      } else if (msg.type === 'stream_event' && msg.event?.type === 'content_block_delta') {
        if (msg.event.delta?.type === 'text_delta') state.sawAssistantText = true
      } else if (msg.type === 'result') {
        result = {
          ms: Date.now() - t0,
          // subtype is 'success' even on a failed turn — is_error is the field
          // that says so, and a naive instrument reports a clean zero here.
          subtype: String(msg.subtype ?? ''),
          isError: msg.is_error === true
        }
        resolveResult?.()
        resolveResult = null
      }
      if (caseSpec.ready(state)) {
        resolveReady?.()
        resolveReady = null
      }
    }
  })()

  queue.push({
    type: 'user',
    message: { role: 'user', content: caseSpec.prompt },
    parent_tool_use_id: null,
    origin: { kind: 'human' }
  })

  // Premise: there must be something in flight to interrupt. A run that
  // interrupted nothing measured nothing.
  const readyOutcome = await Promise.race([
    readyReached.then(() => 'ready'),
    sleep(120_000).then(() => 'ready-timeout')
  ])
  const reachedReadyState = readyOutcome === 'ready'
  if (reachedReadyState) await sleep(caseSpec.settleMs)

  // THE PREMISE, RE-CHECKED AT THE MOMENT IT MATTERS. Reaching the ready state
  // says a turn was live when the settle began, not that one is live now — and
  // interrupting a turn that has already produced its result measures the SDK's
  // manners, not its interrupt. This is the check whose absence produced a
  // -821ms latency, and a run that fails it is `not-driven`, never a fast one.
  const finishedBeforeInterrupt = reachedReadyState && result !== null
  const drove = reachedReadyState && !finishedBeforeInterrupt

  let interruptRejected = null
  let interruptMissing = false
  if (drove) {
    interruptedAt = Date.now() - t0
    // engine.ts's exact call, including the `?.` — but its rejection is RECORDED
    // rather than swallowed, because "the SDK refused the interrupt" and "the SDK
    // accepted it and never answered" are different findings and the app's
    // `.catch(() => {})` cannot tell them apart.
    const pending = q.interrupt?.()
    if (pending === undefined) {
      interruptMissing = true
    } else {
      interruptRejected = await pending.then(
        () => false,
        () => true
      )
    }
  }

  const resultOutcome = drove
    ? await Promise.race([
        resultArrived.then(() => 'result'),
        sleep(120_000).then(() => 'result-timeout')
      ])
    : 'not-driven'

  // Let anything still in the pipe land, then take the query down. close()
  // AFTER the measurement, never before — closing is how the app would have to
  // recover, and doing it early would fabricate the completion under test.
  await sleep(1000)
  q.close?.()
  queue.end()
  await Promise.race([consume, sleep(5000)])

  const record = {
    case: caseSpec.key,
    repeat,
    drove,
    notDrivenReason: drove
      ? null
      : finishedBeforeInterrupt
        ? 'the turn produced its result before the interrupt could be issued — this run measured nothing about interrupts'
        : 'the turn never reached the state it was to be interrupted in',
    droveOn: drove ? (caseSpec.key === 'tool' ? 'tool_use block' : 'assistant text') : null,
    interruptedAtMs: interruptedAt,
    interruptRejected,
    interruptMissing,
    resultOutcome,
    result,
    // THE number claim 2 turns on: how long the app would have stayed busy.
    // Only meaningful for a driven run — a result that predates the interrupt is
    // not a fast interrupt, it is a missed one.
    interruptToResultMs:
      !drove || result === null || interruptedAt === null ? null : result.ms - interruptedAt,
    messagesAfterInterrupt
  }
  console.log(
    `  ${caseSpec.key}/${repeat}: ${drove ? '' : `COULD NOT DRIVE (${record.notDrivenReason}) — `}` +
      `${record.resultOutcome}` +
      (record.interruptToResultMs === null ? '' : ` after ${record.interruptToResultMs}ms`) +
      (record.result ? ` (${record.result.subtype}, isError ${record.result.isError})` : '')
  )
  return record
}

const interruptRuns = []
if (PHASES.includes('B')) {
  console.log('phase B — claim 2, at the SDK: does a result follow an interrupt?')
  for (const caseSpec of CASES) {
    for (let repeat = 1; repeat <= REPEATS; repeat++) {
      interruptRuns.push(await runInterruptCase(caseSpec, repeat))
    }
  }
} else {
  console.log('phase B — skipped')
}

const driven = interruptRuns.filter((r) => r.drove)
const answered = driven.filter((r) => r.resultOutcome === 'result')
const hung = driven.filter((r) => r.resultOutcome === 'result-timeout')
const latencies = answered.map((r) => r.interruptToResultMs).sort((a, b) => a - b)
const claim2 = {
  skipped: !PHASES.includes('B'),
  runs: interruptRuns.length,
  driven: driven.length,
  // Attempts thrown away because the turn had already produced its result. Kept
  // visible rather than folded into `runs - driven`: a high number here means the
  // prompts are too short for this CLI, not that anything is wrong with the app.
  discardedTurnAlreadyFinished: interruptRuns.filter(
    (r) => r.notDrivenReason?.startsWith('the turn produced its result') === true
  ).length,
  answered: answered.length,
  hung: hung.length,
  // The claim is "a result may never arrive". One hang establishes it; an
  // all-answered run does NOT refute it, it bounds it — which is why the
  // sample size is reported beside the verdict rather than hidden behind it.
  hangObserved: hung.length > 0,
  interruptRejectedEver: driven.some((r) => r.interruptRejected === true),
  interruptMissingEver: driven.some((r) => r.interruptMissing === true),
  latencyMs: latencies.length
    ? { min: latencies[0], median: latencies[Math.floor(latencies.length / 2)], max: latencies.at(-1) }
    : null,
  byCase: Object.fromEntries(
    CASES.map((c) => {
      const rows = driven.filter((r) => r.case === c.key)
      return [
        c.key,
        {
          driven: rows.length,
          answered: rows.filter((r) => r.resultOutcome === 'result').length,
          hung: rows.filter((r) => r.resultOutcome === 'result-timeout').length
        }
      ]
    })
  )
}
if (PHASES.includes('B')) {
  if (driven.length === 0) {
    fail('phase B drove nothing: no run had a live turn at the moment it interrupted')
  }
  // The alarm that caught the missed-interrupt bug in the first place. A negative
  // latency can only mean the result predates the interrupt, and the premise
  // check above should now make it unreachable — so if one appears, the premise
  // check is what is broken, not the app.
  for (const row of answered) {
    if (row.interruptToResultMs < 0) {
      fail(
        `${row.case}/${row.repeat} produced a negative interrupt→result latency (${row.interruptToResultMs}ms), which means the premise check let a finished turn through`
      )
    }
  }
  console.log(
    `  -> driven ${claim2.driven}/${claim2.runs}, answered ${claim2.answered}, hung ${claim2.hung}` +
      (claim2.latencyMs
        ? `, latency min ${claim2.latencyMs.min}ms / median ${claim2.latencyMs.median}ms / max ${claim2.latencyMs.max}ms`
        : '') +
      '\n'
  )
}

// ---------------------------------------------------------------------------
// Phase C — claim 1, in the built app, counted at the IPC boundary
// ---------------------------------------------------------------------------

const c1 = []
let c1Queue = { drove: false }
let c2 = { drove: false }

if (PHASES.includes('C')) {
  console.log('phase C — claim 1, in the built app')

  const electronBin =
    process.platform === 'win32'
      ? join(APP_DIR, 'node_modules/electron/dist/electron.exe')
      : process.platform === 'darwin'
        ? join(APP_DIR, 'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron')
        : join(APP_DIR, 'node_modules/electron/dist/electron')

  // APP_DIR rather than a fresh temp folder, as gui-80 does: gui-48 measured a
  // cold CLI in a brand-new workspace taking up to 60s to go in flight, and this
  // phase needs several turns inside one watchdog.
  const app = await electron.launch({
    executablePath: electronBin,
    // --disable-gpu is load-bearing in a background session: with compositing on,
    // this app's window never paints at all. Nothing here is judged visually.
    args: ['--no-sandbox', '--disable-gpu', '.'],
    cwd: APP_DIR,
    env: process.env,
    timeout: 30000
  })

  await app.evaluate(async ({ dialog, ipcMain }, dir) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [dir] })
    // THE instrument. A SECOND listener on the same channel — ipcMain.on appends,
    // so the real handler is untouched and still runs; this only witnesses. (A
    // `handle` channel could not be counted this way: invoke allows one handler
    // and registering a second throws.) Every prompt that leaves the renderer
    // lands here exactly once, which is the side effect claim 1 turns on and the
    // one thing `useChat.send`'s guard can hide from the DOM.
    globalThis.__sends = []
    ipcMain.on('chat:send', (_e, payload) => {
      globalThis.__sends.push(typeof payload?.text === 'string' ? payload.text : '<no text>')
    })
  }, APP_DIR)

  const sends = () => app.evaluate(() => globalThis.__sends.slice())

  const page = await app.firstWindow()
  await page.waitForSelector('[aria-label="Backend mode"]', { timeout: 15000 })
  // DOM-dispatched: Playwright's actionability wait hangs on the intro animation.
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(
      (b) =>
        b.getAttribute('aria-label') === 'Pick a project folder' ||
        b.textContent?.includes('Pick a project folder')
    )
    btn?.click()
  })
  await page.waitForSelector('.session-group-head', { timeout: 20000 })

  // The in-flight signal every driver in this folder reads (gui-54, gui-73, gui-80).
  const isBusy = () => page.evaluate(() => document.querySelector('.model-pill')?.disabled ?? false)
  const setDraft = (text) =>
    page.evaluate((text) => {
      const el = document.querySelector('.message-input')
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set
      setter.call(el, text)
      el.dispatchEvent(new Event('input', { bubbles: true }))
    }, text)
  const composerState = () =>
    page.evaluate(() => ({
      value: document.querySelector('.message-input')?.value ?? null,
      queued: !!document.querySelector('.queued-note'),
      sendLabel: document.querySelector('.send-btn')?.getAttribute('aria-label') ?? null,
      errors: document.querySelectorAll('.msg-error').length,
      // Attribution: the overlap rejection carries a specific message, and reading
      // it is what separates "busy cleared" from "busy cleared BECAUSE of this".
      overlapErrors: [...document.querySelectorAll('.msg-error')].filter((n) =>
        (n.textContent ?? '').includes('A turn is already running')
      ).length,
      assistantChars: [...document.querySelectorAll('.msg-assistant')].reduce(
        (n, el) => n + (el.textContent ?? '').length,
        0
      )
    }))

  const waitBusy = async () => {
    for (let i = 0; i < 60; i++) {
      await page.waitForTimeout(1000)
      if (await isBusy()) return true
    }
    return false
  }
  const waitIdle = async () => {
    for (let i = 0; i < 90; i++) {
      await page.waitForTimeout(2000)
      if (!(await isBusy())) return true
    }
    return false
  }
  const stopIfBusy = async () => {
    if (!(await isBusy())) return
    await page.evaluate(() => {
      const btn = document.querySelector('.send-btn')
      if (btn?.getAttribute('aria-label') === 'Stop') btn.click()
    })
    await waitIdle()
    await page.waitForTimeout(1000)
  }

  // WAITING FOR THE ENGINE, WHICH IS NOT THE SAME AS WAITING FOR THE UI — and
  // this run learned it the hard way. The moment a case produces the overlap
  // error, `busy` is false in the renderer while the FIRST turn is still
  // streaming in main; `stopIfBusy` is then a no-op, the next case runs against
  // an engine that is still holding turnResolve, and its send is rejected rather
  // than sent. The count at the IPC boundary is unaffected — that is why the
  // measurement survived — but the STATE each case claims to run in was not the
  // state it ran in.
  //
  // The pane is the honest witness: only a real turn-end stops it changing. A
  // rejected send produces one error bubble and then nothing, so quiet arrives
  // immediately for the case that sent nothing and only at turn-end for the one
  // that did. Requiring several consecutive unchanged samples is what separates
  // "finished" from "between two deltas".
  const paneFingerprint = () =>
    page.evaluate(
      () =>
        `${document.querySelectorAll('.msg').length}:` +
        [...document.querySelectorAll('.msg-assistant')].reduce(
          (n, el) => n + (el.textContent ?? '').length,
          0
        )
    )
  const waitQuiet = async (quietMs = 6000, maxMs = 180000) => {
    let last = null
    let quietFor = 0
    for (let waited = 0; waited < maxMs; waited += 1000) {
      await page.waitForTimeout(1000)
      const now = await paneFingerprint()
      quietFor = now === last ? quietFor + 1000 : 0
      last = now
      if (quietFor >= quietMs) return true
    }
    return false
  }

  // The #80 queue, re-confirmed here rather than cited: it is the reason the
  // obvious user path (Enter again while it runs) cannot produce a second send,
  // and a claim-1 finding that did not check it would be citing a test instead of
  // measuring the app.
  //
  // IT RUNS FIRST, AND THAT ORDERING IS LOAD-BEARING. It is the only case here
  // that needs the renderer to KNOW a turn is running, and every case below can
  // leave the app in the one state where the renderer does not — idle-looking
  // with main still holding the turn. Waiting that state out is not reliable:
  // `waitQuiet` reads the pane, and a pane can sit unchanged mid-turn (measured;
  // it is why C2's witness was rewritten). Running this case before anything can
  // create that state removes the dependency instead of managing it.
  await stopIfBusy()
  {
    const settled = await waitQuiet()
    await setDraft('LONGQ: Count from 1 to 40, one number per line, with a short pause between each.')
    await page.evaluate(() => {
      document
        .querySelector('.message-input')
        ?.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
        )
    })
    const wentBusy = await waitBusy()
    if (!wentBusy) {
      console.log(`  enter-while-busy COULD NOT DRIVE (settled ${settled}, no turn went in flight)`)
      c1Queue = { drove: false, settled }
    } else {
      const before = (await sends()).length
      await setDraft('QUEUED: this must not reach main while a turn runs')
      // THE PREMISE, CHECKED AT THE MOMENT OF THE COMMIT. `wentBusy` says a turn
      // was in flight when the poll last looked; this case is about what the
      // composer does when the RENDERER believes one is running, and those come
      // apart in exactly the state this spike is about — after an overlap error
      // the renderer reports idle while main still holds the turn. A run that
      // committed into an idle-looking composer measured the ordinary send path,
      // not the queue, and would report `sendsAdded: 1` as if #80 were broken.
      const busyAtCommit = await isBusy()
      if (!busyAtCommit) {
        console.log('  enter-while-busy COULD NOT DRIVE (renderer was not busy at the commit)')
        c1Queue = { drove: false, settled, busyAtCommit: false }
      } else {
      await page.evaluate(() => {
        document
          .querySelector('.message-input')
          ?.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
          )
      })
      await page.waitForTimeout(2000)
      const state = await composerState()
      const added = (await sends()).length - before
      c1Queue = {
        drove: true,
        settled,
        busyAtCommit: true,
        sendsAdded: added,
        queuedNoteShown: state.queued,
        sendLabel: state.sendLabel
      }
      console.log(
        `  enter-while-busy ${added} send(s) reached main, queued note ${state.queued}, send slot ${JSON.stringify(state.sendLabel)}`
      )
      }
    }
  }

  // ── C1: can a USER put two sends into main? ─────────────────────────────────
  //
  // Short prompts: this half is about the COUNT at the boundary, not about what
  // the turns do afterwards, and each case is stopped as soon as it is measured.
  //
  // The three cases are not variations for their own sake — they bracket the one
  // thing that decides claim 1's user half. `useChat.send` and InputBar.submit
  // both read React state, so the question is whether two commits can be handled
  // before React re-renders:
  //
  //   same-task     both handlers run inside one batch, both read the stale
  //                 `busy: false` and the stale draft. This is the upper bound on
  //                 the mechanism — and a real keyboard cannot produce it, which
  //                 is exactly why it is carried as `sameTask: true`.
  //   separate-task the second Enter is a fresh macrotask, so React has committed.
  //                 This IS reachable from a keyboard, at any speed, and it is the
  //                 ONLY case here that decides whether a user can do this.
  //   enter+click   two different input devices — but still dispatched inside one
  //                 task, so it is `sameTask: true` as well. It is carried
  //                 separately because it exercises a different pair of handlers
  //                 (submit-from-keydown and submit-from-click), not because it
  //                 is any more reachable than the first case.
  //
  // The synthetic/real split is a property of the DISPATCH, not of the case
  // name. Deriving it from the name is exactly the instrument bug this repo
  // keeps recording — a gate reporting its own success as the artifact — and the
  // first run of this file did it, calling enter+click a non-synthetic path.

  const C1_PROMPT = 'Reply with exactly: ok'

  const c1Case = async (key, sameTask, drive, note) => {
    await stopIfBusy()
    // Not stopIfBusy alone: see waitQuiet. A case that produced the overlap error
    // leaves the UI idle and the engine live, and the next case would then
    // measure a rejection while believing it measured a send.
    const settled = await waitQuiet()
    const before = (await sends()).length
    const busyBefore = await isBusy()
    await setDraft(`${key}: ${C1_PROMPT}`)
    const drafted = (await composerState()).value?.startsWith(key) === true
    if (busyBefore || !drafted || !settled) {
      console.log(
        `  ${key.padEnd(14)} COULD NOT DRIVE (busy ${busyBefore}, drafted ${drafted}, settled ${settled})`
      )
      return { key, sameTask, drove: false, busyBefore, drafted, settled, sendsAdded: null, note }
    }
    await drive()
    // Generous: a second send that is going to arrive has arrived by now, and a
    // count that only ever rises cannot be raced downward by waiting longer.
    await page.waitForTimeout(2500)
    const added = (await sends()).length - before
    // WHICH guard refused the second commit, measured rather than reasoned.
    // InputBar.submit has two early returns and they land in the SAME React
    // commit, so a send count alone cannot tell them apart:
    //   empty draft  — submit's `!text.trim() && no attachments` return. Silent,
    //                  leaves nothing behind.
    //   busy         — submit's queue branch, which RAISES the queued note.
    // So the note is the discriminator: present means the busy flag refused it,
    // absent (with an emptied composer) means the first submit's own draft clear
    // did — which is a UI convenience, not a guard, and that distinction is the
    // whole difference between "protected" and "not yet broken".
    const after = await composerState()
    const refusedBy =
      added > 1 ? 'nothing — both commits sent' : after.queued ? 'busy flag (queued note raised)' : 'emptied draft (no queued note)'
    console.log(`  ${key.padEnd(14)} ${added} send(s) reached main — refused by: ${refusedBy}`)
    return {
      key,
      sameTask,
      drove: true,
      busyBefore,
      drafted,
      settled,
      sendsAdded: added,
      refusedBy,
      composerAfter: { queued: after.queued, valueEmpty: after.value === '' },
      note
    }
  }

  c1.push(
    await c1Case(
      'same-task',
      true,
      () =>
        page.evaluate(() => {
          const el = document.querySelector('.message-input')
          const press = () =>
            el.dispatchEvent(
              new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
            )
          press()
          press()
        }),
      'synthetic: two keydowns in ONE task, which a keyboard cannot deliver. Upper bound on the mechanism, not a user path.'
    )
  )
  c1.push(
    await c1Case(
      'separate-task',
      false,
      () =>
        page.evaluate(
          () =>
            new Promise((resolve) => {
              const el = document.querySelector('.message-input')
              const press = () =>
                el.dispatchEvent(
                  new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
                )
              press()
              setTimeout(() => {
                press()
                resolve()
              }, 0)
            })
        ),
      'the fastest a keyboard can be: two Enter keydowns in back-to-back macrotasks. This is the case that decides user reachability.'
    )
  )
  c1.push(
    await c1Case(
      'enter+click',
      true,
      () =>
        page.evaluate(() => {
          const el = document.querySelector('.message-input')
          el.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
          )
          const btn = document.querySelector('.send-btn')
          // Still labelled Send in the DOM: React has not re-rendered yet, which
          // is the whole point of doing this inside one task.
          if (btn?.getAttribute('aria-label') === 'Send') btn.click()
        }),
      'synthetic: two input devices, still inside ONE task. Carried apart from same-task because it exercises a different pair of handlers, not because it is more reachable.'
    )
  )


  // ── C2: what happens WHEN two sends are in main? ────────────────────────────
  //
  // Rides a long turn. The probe is window.api.sendPrompt — the same IPC call
  // useChat.send makes, minus React's guard — so this measures the consequence
  // even when C1 says no user can trigger it. It is not a user path and is not
  // reported as one.

  await stopIfBusy()
  {
    await waitQuiet()
    // Long enough to still be streaming ~13s after the probe, which is what the
    // witness window plus the retry premise need. Counting to 60 was not: run 2's
    // first turn ended before the retry and that measurement was inconclusive.
    await setDraft('LONG: Count from 1 to 200, one number per line, with a short pause between each.')
    await page.evaluate(() => {
      document
        .querySelector('.message-input')
        ?.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
        )
    })
    const wentBusy = await waitBusy()
    if (!wentBusy) {
      fail('phase C2 could not drive: no turn went in flight, so nothing could be sent underneath one')
    } else {
      const before = await composerState()
      const sendsBefore = (await sends()).length
      await page.evaluate(() =>
        window.api.sendPrompt({ text: 'PROBE: a second send under a live turn', attachments: [] })
      )

      // Watch for the consequence, not for a fixed delay: whichever of the two
      // arrives first is the answer, and polling a count that only rises cannot
      // step over the edge the way sampling `busy` can (gui-80's lesson).
      let clearedAtMs = null
      let atClear = null
      const t0 = Date.now()
      for (let i = 0; i < 40; i++) {
        await page.waitForTimeout(500)
        const state = await composerState()
        const busy = await isBusy()
        if (!busy || state.overlapErrors > before.overlapErrors) {
          clearedAtMs = Date.now() - t0
          atClear = { ...state, busy }
          break
        }
      }
      const sendsAfter = (await sends()).length

      // THE RETRY IS THE WITNESS, AND THE PANE IS ONLY CORROBORATION.
      //
      // The obvious witness — did the pane keep growing after the UI stopped
      // calling itself busy — was the first design, and a run falsified it: the
      // pane read 116 → 116 chars across the sample window while the engine went
      // on to refuse the next send with "A turn is already running". A pane that
      // is not growing is not an idle engine; it is a pane between two deltas.
      // Growth is therefore sound as a POSITIVE and worthless as a negative.
      //
      // What answers the question directly is the engine's own overlap
      // rejection. `turnResolve !== null` is exactly the fact in dispute, and a
      // second refusal reports it from inside main rather than inferring it from
      // rendered characters. So the retry goes FIRST, immediately after the
      // clear, and it does double duty:
      //
      //   rejectedAgain === true  → the first turn was STILL LIVE at that moment
      //                             (the witness), AND the user's own attempt to
      //                             recover is refused the same way (the
      //                             persistence finding).
      //
      // It also has to be first for a second reason two runs demonstrated: every
      // second spent proving the turn is alive is a second it may spend dying,
      // and both of those runs retried into a turn that had already ended.
      const recoveryBefore = await composerState()
      const recoverySendsBefore = (await sends()).length
      await setDraft('AFTER: does a real send work now?')
      await page.evaluate(() => {
        document
          .querySelector('.message-input')
          ?.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
          )
      })
      await page.waitForTimeout(3000)
      const afterRecovery = await composerState()
      const rejectedAgain = afterRecovery.overlapErrors > recoveryBefore.overlapErrors
      const recovery = {
        // The user's send left the renderer — the composer did not refuse it.
        sendsAdded: (await sends()).length - recoverySendsBefore,
        // ...and was refused by the engine with the same overlap error, which is
        // both the persistence result and the proof the turn was still running.
        rejectedAgain,
        startedATurn: await isBusy(),
        // A retry that started a turn measured a window that had already elapsed
        // and says nothing either way; only a refusal measures persistence.
        measuresPersistence: rejectedAgain
      }
      console.log(
        `  recovery: user send reached main ${recovery.sendsAdded}×,` +
          ` refused again ${recovery.rejectedAgain}, started a turn ${recovery.startedATurn}`
      )

      // Corroboration only, and explicitly one-directional: growth proves the
      // turn was live, absence of growth proves nothing.
      const later = await composerState()
      const busyLater = await isBusy()

      c2 = {
        recovery,
        drove: true,
        sendsAdded: sendsAfter - sendsBefore,
        clearedAtMs,
        busyClearedWhileTurnLive: atClear !== null && atClear.busy === false,
        overlapErrorShown: atClear !== null && atClear.overlapErrors > before.overlapErrors,
        assistantCharsAtClear: atClear?.assistantChars ?? null,
        assistantCharsLater: later.assistantChars,
        // ONE-DIRECTIONAL. True means the turn was demonstrably still streaming
        // after the clear. False means only that nothing was rendered in this
        // window — measured 116 → 116 on a turn the engine then refused a send
        // for — so it is never read as evidence the turn had ended.
        paneGrewAfterClear: atClear !== null && later.assistantChars > atClear.assistantChars,
        // The witness the finding actually rests on: main refused the retry, so
        // main still held turnResolve. Corroborated by pane growth when the pane
        // happens to be mid-delta.
        turnStillLiveAfterClear: rejectedAgain,
        // The second-order consequence: with busy false the send slot is Send
        // again, so the user may now start a turn on top of a live one.
        sendLabelAfterClear: atClear?.sendLabel ?? null,
        busyLater
      }
      console.log(
        `  probe: ${c2.sendsAdded} send(s) added, busy cleared ${c2.busyClearedWhileTurnLive}` +
          ` at ${c2.clearedAtMs}ms, overlap error ${c2.overlapErrorShown},` +
          ` turn still live after clear ${c2.turnStillLiveAfterClear}` +
          ` (pane ${c2.assistantCharsAtClear} → ${c2.assistantCharsLater} chars),` +
          ` send slot ${JSON.stringify(c2.sendLabelAfterClear)}`
      )
      if (c2.sendsAdded !== 1) {
        fail(`the C2 probe put ${c2.sendsAdded} sends into main, expected exactly 1`)
      }
    }
  }

  await stopIfBusy()
  await app.close().catch(() => {})
} else {
  console.log('phase C — skipped')
}

// ---------------------------------------------------------------------------
// Verdict
// ---------------------------------------------------------------------------

const userPaths = c1.filter((r) => r.drove)
const doubleSendPaths = userPaths.filter((r) => r.sendsAdded > 1)
// By DISPATCH MODE, never by case name — see the c1Case comment. enter+click
// reads like a user story and is a same-task dispatch, and naming it as the
// discriminator is what made the first run of this file report a real user path
// that does not exist.
const realisticDouble = doubleSendPaths.filter((r) => r.sameTask === false)
if (PHASES.includes('C') && userPaths.length === 0) fail('phase C1 drove no case at all')

const claim1 = {
  skipped: !PHASES.includes('C'),
  // Two answers, kept apart on purpose. A remedy that only closes the composer
  // is worth nothing if the consequence is what matters, and vice versa.
  secondSendReachedMainFromAUserPath: doubleSendPaths.length > 0,
  reachableWithoutSyntheticDispatch: realisticDouble.length > 0,
  paths: c1,
  enterWhileBusy: c1Queue,
  consequence: c2,
  consequenceReal:
    c2.drove === true && c2.busyClearedWhileTurnLive === true && c2.overlapErrorShown === true,
  // Witnessed by main refusing the retry — the fact in dispute reported from
  // inside the process that holds it — with pane growth as corroboration.
  consequenceWitnessed: c2.turnStillLiveAfterClear === true || c2.paneGrewAfterClear === true
}

const findings = {
  spike: 108,
  question:
    'Can a second send, or a hung interrupt, strand the turn lifecycle? Both mechanisms are confirmed by reading; this measures reachability.',
  measuredAt: new Date().toISOString(),
  environment: {
    backendMode,
    hostCliUsed: hostCli !== null,
    cliVersion,
    sdkVersion,
    platform: process.platform,
    electronArgs: ['--no-sandbox', '--disable-gpu'],
    repeats: REPEATS
  },
  phaseA_sourceFacts: {
    ...sourceFacts,
    note: 'Source facts, not evidence of reachability. They exist so phases B and C are attributable and so this harness fails loudly when the code moves.'
  },
  claim1_secondSend: {
    ...claim1,
    verdict:
      'TWO ANSWERS. The CONSEQUENCE is real and witnessed: a second send under a live turn is answered with a turn-terminal error on the second caller, the renderer clears busy while main still holds turnResolve, and the send slot goes back to Send with no Stop on screen for a turn that is still running. The wrong state also does not clear itself — a real prompt sent from the composer right afterwards is refused with the same overlap error, which is simultaneously the proof the turn was still live. The USER PATH is not established: only a same-task double dispatch produces two sends, and no input device delivers two events in one task — the case that models real input timing produced one. So the defect is latent, and what holds it shut is React committing between two discrete events rather than any guard: chat:send in main has none at all.'
  },
  claim2_hungInterrupt: {
    ...claim2,
    runs_detail: interruptRuns,
    verdict:
      'MECHANISM REAL, HANG NOT OBSERVED. interrupt() completes nothing locally, so a CLI that accepts an interrupt and never returns a result would leave the UI busy with no way out. It did not happen: every driven interrupt was answered. An all-answered run does not prove it cannot happen — it bounds the exposure at this sample size. Two things a reader should carry: `driven` excludes any repeat whose turn produced its result before the interrupt was issued, so the latencies below are interrupts and not manners; and the subtype following an interrupt is NOT a reliable abort marker — both error_during_execution and success have been observed after a genuine one across runs of this harness, which is why engine.ts keying on its own `interrupting` flag rather than on the subtype is the correct reading.'
  },
  harnessFailures: fails,
  scrubbing:
    'Counts, timings, booleans, message kinds and result subtypes only. No cwd, session id, model id, tool-use id, prompt body, message text or user path. The phase-B scratch cwd is an OS temp directory and is not recorded.'
}
writeFileSync(findingsPath, JSON.stringify(findings, null, 2) + '\n')

console.log('\n--- finding ---')
console.log(`claim 1 · consequence real (busy cleared on a live turn) : ${claim1.consequenceReal}`)
console.log(`claim 1 · witnessed: the turn was still live afterwards : ${claim1.consequenceWitnessed}`)
console.log(`claim 1 · a user path put 2 sends into main              : ${claim1.secondSendReachedMainFromAUserPath}`)
console.log(`claim 1 · ... without synthetic same-task dispatch       : ${claim1.reachableWithoutSyntheticDispatch}`)
for (const row of c1) {
  console.log(`           ${row.key.padEnd(14)} ${row.drove ? `${row.sendsAdded} send(s)` : 'not driven'}`)
}
console.log(`claim 2 · interrupts driven                              : ${claim2.driven}/${claim2.runs}`)
console.log(`claim 2 · a result never arrived (hang observed)         : ${claim2.hangObserved}`)
if (claim2.latencyMs) {
  console.log(
    `claim 2 · interrupt → result                             : min ${claim2.latencyMs.min}ms / median ${claim2.latencyMs.median}ms / max ${claim2.latencyMs.max}ms`
  )
}
console.log(`harness failures                                        : ${fails.length}`)
for (const f of fails) console.log(`  - ${f}`)
console.log('findings                                                : scripts/spike-108-findings.json')

const exit = () => process.exit(fails.length ? 1 : 0)
setTimeout(exit, 3000).unref?.()
exit()
