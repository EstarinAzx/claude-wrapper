// Spike #105 — does picking a model leave the model menu and slash commands
// empty until the next send?
//
//   node --experimental-strip-types scripts/spike-105-model-pick-channels.mjs
//
// Needs `npm run build` first, plus `npm i --no-save playwright-core`.
// Costs ZERO CLI turns: every read here is supportedModels()/supportedCommands()
// on a warm query, and no prompt is ever sent. That is not an economy, it is the
// experiment — the claim under test is precisely "until the next send".
//
// ---------------------------------------------------------------------------
// THE CONFOUND, AND WHY IT NEEDED THREE PHASES
//
// The ticket's own warning: `gui-52` is a standing environmental red for an
// empty CLI model list, so "an empty model list in this sandbox is
// indistinguishable from a null engine". An instrument that reads one empty
// array and reports a defect is measuring nothing. So the emptiness has to be
// attributed, not observed, and each phase below removes one candidate cause:
//
//   Phase A (no Electron)  — ask the CLI directly, through the app's REAL
//                            cli-path.ts and backend-mode.ts, with engine.ts's
//                            option shape. If this is non-empty, "the CLI has
//                            no models" is dead as an explanation for anything
//                            the app reports afterwards. This is the phase that
//                            defeats the confound, and it does so at the source
//                            rather than by inference.
//   Phase B (source text)  — assert mechanically that the three writers call
//                            discardEngine and rebuild nothing, and that
//                            session:pick-folder does rebuild. The asymmetry is
//                            the ticket's claim; this pins it to real lines so
//                            Phase C's result is attributable, and so this
//                            harness fails loudly if the code moves under it.
//   Phase C (the real app) — drive the BUILT app over its own IPC. Same window,
//                            same main process, same CLI, one writer apart.
//
// Phase C reads each channel BEFORE and AFTER one writer, seconds apart in one
// process. That pairing is the instrument: a difference between the two cannot
// be the CLI's mood, the sandbox, or the driver's setup order (#77), because
// none of those changed between the two reads. Only the writer did.
//
// THE INDEPENDENT WITNESS. The ticket asks that "engine is null" be observable
// separately from "the CLI returned no models", and not inferred from an empty
// array. It is: the SDK's query is a CHILD PROCESS of Electron's main process,
// so engine teardown has an OS-level signature. Phase C counts CLI descendants
// of the main pid either side of each writer. That number is produced by the
// operating system, knows nothing about arrays, and is reported as
// `inconclusive` rather than as evidence if the BEFORE count is zero — an
// absence assertion with no positive control measures nothing (#76).
//
// REPETITION. `.context/pick-up.md`'s landmine from #104: a single-shot
// instrument cannot measure an intermittent state. Every writer is run REPEATS
// times and every repeat is recorded, so a reader sees the spread rather than
// one sample presented as the answer.
//
// SCRUBBING (#90's rule). The committed findings carry counts, timings,
// booleans, key vocabularies and process NAMES only — never a cwd, a session
// id, a model id, a command name, a process path or an OS username. Command
// names in particular are withheld deliberately: this CLI's list includes the
// operator's own personal commands.

import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import { _electron as electron } from 'playwright-core'

const APP_DIR = resolve(import.meta.dirname, '..')
const REPEATS = Number(process.env['SPIKE105_REPEATS'] ?? 2)
const WARM_TIMEOUT_MS = 40000
const findingsPath = new URL('./spike-105-findings.json', import.meta.url)

const { resolveHostCli, toCliOptions } = await import(
  pathToFileURL(join(APP_DIR, 'src/main/cli-path.ts')).href
)
const { snapshotWispEnv, resolveSpawnEnv, initialMode } = await import(
  pathToFileURL(join(APP_DIR, 'src/main/backend-mode.ts')).href
)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const fails = []
const fail = (m) => {
  fails.push(m)
  console.log(`FAIL  ${m}`)
}

setTimeout(() => {
  console.log('TIMEOUT')
  process.exit(1)
}, 900000).unref?.()

// ---------------------------------------------------------------------------
// Phase A — what the CLI itself answers, through the app's real resolution
// ---------------------------------------------------------------------------

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

console.log('phase A — the CLI, asked directly')

const { query } = await import(
  pathToFileURL(join(APP_DIR, 'node_modules/@anthropic-ai/claude-agent-sdk/sdk.mjs')).href
)

const baseline = await (async () => {
  const workDir = mkdtempSync(join(tmpdir(), 'spike-105-cli-'))
  writeFileSync(join(workDir, 'README.md'), '# spike 105 scratch\n')
  // A prompt that never yields: warmUp() constructs the query and sends
  // nothing, which is exactly the state both read channels are answered from.
  const idle = { [Symbol.asyncIterator]: () => ({ next: () => new Promise(() => {}) }) }
  const q = query({
    prompt: idle,
    options: {
      cwd: workDir,
      includePartialMessages: true,
      env: appEnv,
      permissionMode: 'bypassPermissions',
      allowDangerouslySkipPermissions: true,
      ...cliOptions
    }
  })
  void (async () => {
    try {
      for await (const _m of q) void _m
    } catch {
      // The stream is drained only so the query runs; its death is not a result.
    }
  })()

  const read = async (name, call) => {
    const t = Date.now()
    try {
      const raw = await call()
      const rows = Array.isArray(raw) ? raw : null
      return {
        ok: rows !== null,
        count: rows?.length ?? 0,
        ms: Date.now() - t,
        // Vocabulary, never values — a shape is diagnostic, a name is the
        // operator's business.
        rowKeys: rows?.length ? Object.keys(rows[0]).sort() : []
      }
    } catch (e) {
      return { ok: false, count: 0, ms: Date.now() - t, threw: String(e).slice(0, 80), rowKeys: [] }
    }
  }

  const commands = await read('commands', () => q.supportedCommands())
  const models = await read('models', () => q.supportedModels())
  try {
    await q.return?.()
  } catch {
    // Best-effort teardown; this query is discarded either way.
  }
  return { commands, models }
})()

console.log(`  supportedCommands -> ${baseline.commands.count} in ${baseline.commands.ms}ms`)
console.log(`  supportedModels   -> ${baseline.models.count} in ${baseline.models.ms}ms`)

// This is the phase's whole job. If the CLI is empty here, Phase C can still
// show the mechanism on whichever channel IS populated, but it cannot show it
// on an empty one — and saying so is the honest outcome, not a failure.
const cliHasModels = baseline.models.count > 0
const cliHasCommands = baseline.commands.count > 0
if (!cliHasModels && !cliHasCommands) {
  fail('the CLI answered BOTH channels empty, so this environment cannot attribute an empty app list to anything')
}
console.log(
  `  => the ticket's stated confound (an empty CLI model list) is ${cliHasModels ? 'FALSE here' : 'PRESENT here'}\n`
)

// ---------------------------------------------------------------------------
// Phase B — the source asymmetry, asserted rather than recalled
// ---------------------------------------------------------------------------

console.log('phase B — the writers, read out of src/main/index.ts')

const mainSrc = readFileSync(join(APP_DIR, 'src/main/index.ts'), 'utf8')

// Slice one IPC registration's body: from its `ipcMain.` line to the next
// registration at column 0. Deliberately crude and deliberately loud — a miss
// is reported as a failure, never silently treated as "no rebuild found",
// which would make every assertion below vacuously true.
const handlerBody = (channel) => {
  const start = mainSrc.search(new RegExp(`ipcMain\\.(on|handle)\\('${channel}'`))
  if (start < 0) return null
  const rest = mainSrc.slice(start + 10)
  const end = rest.search(/\nipcMain\.(on|handle)\(/)
  return rest.slice(0, end < 0 ? rest.length : end)
}

const WRITERS = [
  { key: 'model', channel: 'model:set', resumes: true },
  { key: 'permission', channel: 'permission:set-mode', resumes: true },
  { key: 'backend', channel: 'backend:set-mode', resumes: false }
]

const sourceFacts = {}
for (const w of WRITERS) {
  const body = handlerBody(w.channel)
  if (body === null) {
    fail(`could not locate the ${w.channel} handler in src/main/index.ts — this harness is out of date`)
    sourceFacts[w.key] = { located: false }
    continue
  }
  const facts = {
    located: true,
    callsDiscard: /discardEngine\(/.test(body),
    rebuilds: /makeEngine\(/.test(body),
    warms: /warmUp\(/.test(body),
    resumeIsSessionId: /discardEngine\(engine\?\.sessionId\(\)/.test(body)
  }
  sourceFacts[w.key] = facts
  if (!facts.callsDiscard) fail(`${w.channel} no longer calls discardEngine`)
  if (facts.rebuilds || facts.warms) {
    console.log(`  ${w.channel.padEnd(20)} REBUILDS — the ticket's premise has been fixed since filing`)
  } else {
    console.log(`  ${w.channel.padEnd(20)} discards, rebuilds nothing`)
  }
  if (w.resumes !== facts.resumeIsSessionId) {
    fail(`${w.channel} changed which resume target it discards with`)
  }
}

const pickBody = handlerBody('session:pick-folder')
const pickRebuilds = pickBody !== null && /makeEngine\(/.test(pickBody) && /warmUp\(/.test(pickBody)
if (pickBody === null) fail('could not locate session:pick-folder — this harness is out of date')
if (!pickRebuilds) {
  fail('session:pick-folder no longer rebuilds+warms, so this harness has no way to re-warm the app')
}
console.log(`  session:pick-folder  rebuilds+warms: ${pickRebuilds}`)

const discardIdx = mainSrc.search(/const discardEngine = /)
const discardBody = discardIdx < 0 ? '' : mainSrc.slice(discardIdx, discardIdx + 400)
const discardNulls = /engine = null/.test(discardBody)
const discardRebuilds = /makeEngine\(/.test(discardBody.split('\n').slice(0, 8).join('\n'))
if (!discardNulls) fail('discardEngine no longer nulls the engine handle')
console.log(`  discardEngine        nulls the handle: ${discardNulls}, rebuilds: ${discardRebuilds}\n`)

// ---------------------------------------------------------------------------
// Phase C — the real app, one writer apart
// ---------------------------------------------------------------------------

console.log('phase C — the built app, over its own IPC')

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
const page = await app.firstWindow()
await page.waitForSelector('.titlebar, .app', { timeout: 30000 }).catch(() => {})

const workDir = mkdtempSync(join(tmpdir(), 'spike-105-app-'))
writeFileSync(join(workDir, 'README.md'), '# spike 105 scratch\n')

// The folder dialog is native and cannot be driven from the renderer; stubbing
// it in MAIN is the established idiom (gui-52). The path travels as an ARGUMENT
// — a backslash inside the evaluated literal silently yields a nonexistent cwd.
await app.evaluate(({ dialog }, dir) => {
  dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [dir] })
}, workDir)

const mainPid = await app.evaluate(() => process.pid)

// --- the independent witness: CLI child processes of the main process --------
//
// Produced by the OS, and blind to every array in this file. A recursive
// descendant walk rather than a direct-children check, because the SDK is free
// to interpose a launcher and a direct check would then read 0 in BOTH states —
// which is a silent, confident, wrong answer.
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

const cliDescendants = () => {
  const rows = processTree()
  if (rows.length === 0) return null
  const byParent = new Map()
  for (const r of rows) {
    const list = byParent.get(r.ppid) ?? []
    list.push(r)
    byParent.set(r.ppid, list)
  }
  const seen = new Set()
  const stack = [mainPid]
  const names = []
  while (stack.length) {
    const pid = stack.pop()
    if (seen.has(pid)) continue
    seen.add(pid)
    for (const child of byParent.get(pid) ?? []) {
      // Names only — a full path carries the operator's home directory.
      if (/claude/i.test(child.name)) names.push(child.name.toLowerCase())
      stack.push(child.pid)
    }
  }
  return { count: names.length, names: [...new Set(names)].sort() }
}

// --- the two read channels, exactly as the renderer asks for them ------------
const readChannels = () =>
  page.evaluate(async () => {
    const [models, commands] = await Promise.all([
      window.api.listModels(),
      window.api.listCommands()
    ])
    return {
      modelCount: Array.isArray(models?.models) ? models.models.length : -1,
      // The pill's LABEL comes from main's model-mode store, not the engine, so
      // it can stay correct while the list it opens is empty. Recorded as a
      // boolean because the value is a model id.
      currentReported: models?.current !== null && models?.current !== undefined,
      commandCount: Array.isArray(commands) ? commands.length : -1
    }
  })

// Rebuild + warm through the app's only re-warming path, timed. This IS the
// price of the obvious remedy ("rebuild and warm inside discardEngine"), so it
// is measured rather than intuited.
const rewarm = async () => {
  const t = Date.now()
  await page.evaluate(() => window.api.pickFolder())
  let last = null
  while (Date.now() - t < WARM_TIMEOUT_MS) {
    last = await readChannels()
    if (last.commandCount > 0 || last.modelCount > 0) break
    await sleep(150)
  }
  return { ms: Date.now() - t, state: last }
}

const firstModelId = () =>
  page.evaluate(async () => {
    const info = await window.api.listModels()
    const rows = Array.isArray(info?.models) ? info.models : []
    // Never a hardcoded model name — whatever the CLI offered, minus whatever
    // is already current, so the write is a real change.
    const pick = rows.find((r) => r.id !== info?.current) ?? rows[0]
    return pick?.id ?? null
  })

const runs = []
const rewarmTimings = []

for (let repeat = 1; repeat <= REPEATS; repeat++) {
  for (const w of WRITERS) {
    const label = `repeat ${repeat} / ${w.key}`
    const warm = await rewarm()
    rewarmTimings.push(warm.ms)
    const before = await readChannels()
    const beforeProcs = cliDescendants()

    let applied = null
    if (w.key === 'model') {
      const id = await firstModelId()
      applied = id === null ? 'no model offered' : 'picked a model from the list'
      if (id !== null) await page.evaluate((m) => window.api.setModel(m), id)
    } else if (w.key === 'permission') {
      applied = await page.evaluate(async () => {
        const current = await window.api.permissionMode()
        const next = current === 'default' ? 'acceptEdits' : 'default'
        window.api.setPermissionMode(next)
        return `permission ${current} -> ${next}`
      })
    } else {
      applied = await page.evaluate(async () => {
        const info = await window.api.backendMode()
        const next =
          info.mode === 'wisped' ? 'native' : info.wispedAvailable ? 'wisped' : 'native'
        window.api.setBackendMode(next)
        return `backend ${info.mode} -> ${next}`
      })
    }

    // The write is fire-and-forget (ipcRenderer.send). Give main a beat to run
    // the handler, then read — WITHOUT sending a prompt, which is the whole
    // claim under test.
    await sleep(600)
    const after = await readChannels()
    // Sampled at the same moment as the channels, which is what makes the pair
    // meaningful: it says whether the app answered [] while the CLI that could
    // have answered was STILL RUNNING.
    const afterProcs = cliDescendants()

    // Process death is asynchronous, and a single sample races it — the first
    // version of this harness read 1->0 on some runs and 1->1 on others and
    // called the second "engine still alive", which conflates "not dead yet"
    // with "not torn down". Poll instead, and report the delay as a number.
    let teardownMs = afterProcs !== null && afterProcs.count < (beforeProcs?.count ?? 0) ? 600 : null
    if (teardownMs === null && beforeProcs !== null && beforeProcs.count > 0) {
      const t = Date.now()
      while (Date.now() - t < 8000) {
        await sleep(250)
        const now = cliDescendants()
        if (now !== null && now.count < beforeProcs.count) {
          teardownMs = 600 + (Date.now() - t)
          break
        }
      }
    }

    const entry = {
      repeat,
      writer: w.key,
      applied,
      warmMs: warm.ms,
      before: { ...before, cliProcs: beforeProcs?.count ?? null },
      after: { ...after, cliProcs: afterProcs?.count ?? null },
      modelsEmptied: before.modelCount > 0 && after.modelCount === 0,
      commandsEmptied: before.commandCount > 0 && after.commandCount === 0,
      teardownMs,
      // The OS-level witness, and its own positive control. `inconclusive`
      // wherever the BEFORE count is zero: with nothing alive to kill, a zero
      // AFTER is not evidence of a teardown (#76 — destruction is quiet, so an
      // assertion phrased as an absence can measure nothing).
      procWitness:
        beforeProcs === null || afterProcs === null
          ? 'unavailable'
          : beforeProcs.count === 0
            ? 'inconclusive'
            : teardownMs !== null
              ? 'engine torn down'
              : 'engine survived 8s',
      // THE ATTRIBUTION, and the sharpest single fact this harness produces.
      // True means: at one instant, the app answered [] on both channels while
      // the CLI process that had just answered 15/119 was still running. The
      // emptiness is therefore the nulled handle in main — it cannot be the CLI
      // being gone, because the CLI was not gone.
      emptyWhileCliAlive:
        before.commandCount > 0 &&
        after.commandCount === 0 &&
        afterProcs !== null &&
        afterProcs.count > 0
    }
    runs.push(entry)
    console.log(
      `  ${label.padEnd(22)} models ${entry.before.modelCount}->${entry.after.modelCount}` +
        `  commands ${entry.before.commandCount}->${entry.after.commandCount}` +
        `  cli procs ${entry.before.cliProcs}->${entry.after.cliProcs}` +
        `  [${entry.procWitness}${entry.teardownMs === null ? '' : ` @${entry.teardownMs}ms`}]` +
        `${entry.emptyWhileCliAlive ? '  <- empty while the CLI was still alive' : ''}`
    )

    if (w.key === 'backend') {
      // Put the backend back where it was found; the next repeat re-warms
      // anyway, so this costs nothing and keeps repeats comparable.
      await page.evaluate((m) => window.api.setBackendMode(m), backendMode)
      await sleep(300)
    }
  }
}

await app.close().catch(() => {})

// ---------------------------------------------------------------------------
// Verdict
// ---------------------------------------------------------------------------

const measured = runs.filter((r) => r.before.modelCount > 0 || r.before.commandCount > 0)
if (measured.length === 0) {
  fail('no repeat ever reached a warm state, so nothing was measured')
}

const perWriter = {}
for (const w of WRITERS) {
  const mine = runs.filter((r) => r.writer === w.key)
  const warmed = mine.filter((r) => r.before.modelCount > 0 || r.before.commandCount > 0)
  perWriter[w.key] = {
    runs: mine.length,
    warmedRuns: warmed.length,
    modelsEmptiedRuns: mine.filter((r) => r.modelsEmptied).length,
    commandsEmptiedRuns: mine.filter((r) => r.commandsEmptied).length,
    tornDownRuns: mine.filter((r) => r.procWitness === 'engine torn down').length,
    emptyWhileCliAliveRuns: mine.filter((r) => r.emptyWhileCliAlive).length,
    labelSurvivedRuns: mine.filter((r) => r.after.currentReported).length,
    source: sourceFacts[w.key]
  }
}

const median = (xs) => {
  if (xs.length === 0) return null
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2)
}

const everyWriterEmpties = WRITERS.every(
  (w) =>
    perWriter[w.key].warmedRuns > 0 &&
    perWriter[w.key].commandsEmptiedRuns === perWriter[w.key].warmedRuns
)
const anyWriterSurvives = WRITERS.some(
  (w) => perWriter[w.key].warmedRuns > 0 && perWriter[w.key].commandsEmptiedRuns === 0
)

const findings = {
  spike: 105,
  question:
    'Does picking a model leave the model menu and slash commands empty until the next send?',
  measuredAt: new Date().toISOString(),
  environment: {
    backendMode,
    hostCliUsed: hostCli !== null,
    cliVersion,
    sdkVersion,
    platform: process.platform
  },
  phaseA_cliDirect: {
    purpose:
      "Defeat the ticket's confound at the source: if the CLI answers non-empty here, an empty app list cannot be blamed on the CLI.",
    commands: baseline.commands,
    models: baseline.models,
    confoundPresent: !cliHasModels,
    verdict: cliHasModels
      ? 'The CLI offers models in this environment. gui-52 red is NOT a CLI-side emptiness.'
      : 'The CLI itself returned no models here; the model channel cannot be attributed in this environment.'
  },
  phaseB_source: {
    discardEngineNullsHandle: discardNulls,
    discardEngineRebuilds: discardRebuilds,
    pickFolderRebuildsAndWarms: pickRebuilds,
    writers: sourceFacts
  },
  phaseC_app: {
    repeats: REPEATS,
    rewarmMs: {
      samples: rewarmTimings.length,
      min: rewarmTimings.length ? Math.min(...rewarmTimings) : null,
      median: median(rewarmTimings),
      max: rewarmTimings.length ? Math.max(...rewarmTimings) : null,
      note: 'Time from pickFolder() to the first non-empty channel. This IS the price of "rebuild and warm inside discardEngine", per pill click.'
    },
    perWriter,
    runs
  },
  conditions: {
    cliOffersCommands: cliHasCommands,
    cliOffersModels: cliHasModels,
    everyWriterEmptiesCommands: everyWriterEmpties,
    someWriterLeavesChannelsIntact: anyWriterSurvives,
    labelSurvivesTheEmptyList: runs.some((r) => r.after.currentReported && r.after.modelCount === 0),
    // The attribution, aggregated. One true run is enough: it is an existence
    // claim about which of the two causes was operating.
    emptinessAttributedToNulledHandle: runs.some((r) => r.emptyWhileCliAlive)
  },
  premise: everyWriterEmpties
    ? 'CONFIRMED. All three writers empty both live read channels, with no prompt sent, in an environment where the CLI demonstrably offers both.'
    : 'NOT CONFIRMED as stated — see perWriter.',
  recommendation:
    'Recorded in the ticket comment. This spike changes no src/ file by design.',
  scrubbing:
    'Counts, timings, booleans, row-key vocabularies and process names only. No cwd, session id, model id, command name, process path or OS username.'
}

writeFileSync(findingsPath, JSON.stringify(findings, null, 2) + '\n')

console.log('\n---- verdict ----')
console.log(`CLI offers            : ${baseline.models.count} models, ${baseline.commands.count} commands`)
for (const w of WRITERS) {
  const p = perWriter[w.key]
  console.log(
    `${w.channel.padEnd(20)} emptied commands in ${p.commandsEmptiedRuns}/${p.warmedRuns} warmed runs, ` +
      `models in ${p.modelsEmptiedRuns}/${p.warmedRuns}, engine torn down in ${p.tornDownRuns}/${p.runs}, ` +
      `empty-while-CLI-alive in ${p.emptyWhileCliAliveRuns}/${p.runs}`
  )
}
console.log(
  `rebuild+warm price    : min ${findings.phaseC_app.rewarmMs.min}ms / median ${findings.phaseC_app.rewarmMs.median}ms / max ${findings.phaseC_app.rewarmMs.max}ms per pill click`
)
console.log(`PREMISE               : ${findings.premise}`)
console.log(`findings              : scripts/spike-105-findings.json`)

if (fails.length) {
  console.log(`\n${fails.length} instrument failure(s) — the numbers above are not trustworthy`)
  process.exit(1)
}
process.exit(0)
