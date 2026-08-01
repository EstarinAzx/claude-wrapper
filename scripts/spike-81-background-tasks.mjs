// Spike #81 — does `background_tasks_changed` actually fire on the HOST CLI?
//
// This is the #27 harness pattern re-run, with the one thing #27 could not do:
// it deliberately EXERCISES the background path. #27's negative ("never fired")
// is untrustworthy precisely because nothing in its two turns could have
// produced a background task — the app never calls backgroundTasks() and the
// spike ran ordinary agent turns. An untested negative is not a measurement.
//
// It drives the SDK's query() with `src/main/engine.ts`'s EXACT options
// (streaming-input AsyncIterable prompt, includePartialMessages, canUseTool,
// options.env, permissionMode bypass + danger flag, pathToClaudeCodeExecutable
// from the host walk) and dumps every message to JSONL OUTSIDE the repo.
//
// It must live under the project tree — it imports a project dependency
// (@anthropic-ai/claude-agent-sdk) and a project module, and Node resolves both
// from here. Run it as:
//
//   node --experimental-strip-types scripts/spike-81-background-tasks.mjs
//
// The flag is what lets it import the app's REAL src/main/cli-path.ts rather
// than a copy of the PATH walk — a copy could drift and quietly measure a
// different binary than the app runs, which is the whole question here.

import { mkdtempSync, writeFileSync, appendFileSync, readdirSync, readFileSync } from 'node:fs'
import { tmpdir, homedir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { query } from '@anthropic-ai/claude-agent-sdk'

const { resolveHostCli, toCliOptions } = await import('../src/main/cli-path.ts')

// --- Evidence sink. Outside the repo, deliberately: a JSONL of a real turn
// carries session ids and file contents, and the repo is pushed.
const runDir = mkdtempSync(join(tmpdir(), 'spike-81-'))
const jsonlPath = join(runDir, 'messages.jsonl')
const summaryPath = join(runDir, 'summary.json')

// A cwd outside the repo too, so the agent's own tools cannot touch the tree
// under test. Not under Downloads/* — Fable-5 refuses turns whose cwd looks
// sensitive, and a refused turn would measure nothing.
const workDir = mkdtempSync(join(tmpdir(), 'spike-81-cwd-'))
writeFileSync(join(workDir, 'README.md'), '# spike 81 scratch\n')

const t0 = Date.now()
let seq = 0
const record = (msg) => {
  appendFileSync(
    jsonlPath,
    JSON.stringify({ seq: seq++, ms: Date.now() - t0, msg }) + '\n'
  )
}

// --- Which binary. The app follows the HOST install (cli-path.ts), so a
// finding without a version line is not falsifiable later.
const hostCli = resolveHostCli(process.env['PATH'], process.platform)
const cliOptions = toCliOptions(hostCli)
const cliVersion = hostCli
  ? (spawnSync(hostCli, ['--version'], { encoding: 'utf8' }).stdout ?? '').trim()
  : '(no host CLI — SDK bundled binary)'
const sdkVersion = JSON.parse(
  readFileSync(new URL('../node_modules/@anthropic-ai/claude-agent-sdk/package.json', import.meta.url), 'utf8')
).version

// Which backend the turn ran against (backend-mode.ts's own predicate: the
// proxy endpoint's presence is what makes wisped available at all).
const backend = process.env['ANTHROPIC_BASE_URL'] ? 'wisped' : 'native'

console.log(`host CLI : ${hostCli ?? '(none)'}`)
console.log(`version  : ${cliVersion}`)
console.log(`SDK      : ${sdkVersion}`)
console.log(`backend  : ${backend}`)
console.log(`evidence : ${jsonlPath}`)
console.log(`cwd      : ${workDir}\n`)

// --- engine.ts's message queue, verbatim in shape: streaming-input mode.
const createMessageQueue = () => {
  const buf = []
  let wake = null
  let done = false
  const notify = () => {
    wake?.()
    wake = null
  }
  return {
    push: (m) => {
      buf.push(m)
      notify()
    },
    end: () => {
      done = true
      notify()
    },
    iterable: {
      [Symbol.asyncIterator]() {
        return {
          async next() {
            while (buf.length === 0 && !done) await new Promise((r) => (wake = r))
            if (buf.length === 0) return { done: true, value: undefined }
            return { done: false, value: buf.shift() }
          }
        }
      }
    }
  }
}

const queue = createMessageQueue()

// engine.ts's options, field for field. canUseTool is wired even though
// bypassPermissions means the SDK never invokes it — that is also true in the app.
const options = {
  cwd: workDir,
  includePartialMessages: true,
  canUseTool: async (_name, _input, o) => ({
    behavior: 'allow',
    toolUseID: o.toolUseID,
    decisionClassification: 'user_temporary'
  }),
  env: process.env,
  permissionMode: 'bypassPermissions',
  allowDangerouslySkipPermissions: true,
  ...cliOptions
}

const q = query({ prompt: queue.iterable, options })

// --- What we are measuring.
const backgroundEvents = [] // every background_tasks_changed, in order
const taskToParent = new Map() // engine.ts's map: task_id -> Agent tool_use id
const taskStarted = [] // every task_started, for the ordering question
const taskNotifications = []
const systemSubtypes = new Map()
let sessionId = null
let backgroundTasksCall = null

let turnResolve = null
const finishTurn = () => {
  const r = turnResolve
  turnResolve = null
  r?.()
}

const consume = (async () => {
  for await (const msg of q) {
    record(msg)
    if (typeof msg.session_id === 'string') sessionId = msg.session_id

    if (msg.type === 'system') {
      const sub = String(msg.subtype ?? '')
      systemSubtypes.set(sub, (systemSubtypes.get(sub) ?? 0) + 1)

      if (sub === 'background_tasks_changed') {
        backgroundEvents.push({ seq: seq - 1, ms: Date.now() - t0, tasks: msg.tasks })
        console.log(
          `  >> background_tasks_changed  ${JSON.stringify(msg.tasks?.map((t) => `${t.task_type}:${t.task_id}`))}`
        )
      } else if (sub === 'task_started') {
        taskStarted.push({
          seq: seq - 1,
          ms: Date.now() - t0,
          task_id: msg.task_id,
          task_type: msg.task_type,
          tool_use_id: msg.tool_use_id,
          // #84. The two fields that decide whether a background task's spawner
          // is reachable at all. `parent_tool_use_id` is NOT declared on the
          // `system` variant in engine.ts's model of the stream (only on
          // `assistant`/`user`, engine.ts:31,48), so record whether the wire
          // carries one anyway. `keys` is recorded because a parent under some
          // OTHER name would otherwise hide from this run — an absence is only
          // a measurement if a differently-named field could have been seen.
          parent_tool_use_id: msg.parent_tool_use_id ?? null,
          keys: Object.keys(msg).sort()
        })
        // engine.ts populates taskToParent ONLY for local_agent — condition 2
        // is stated against those keys, so mirror the filter exactly.
        if (msg.task_type === 'local_agent' && msg.task_id && msg.tool_use_id) {
          taskToParent.set(msg.task_id, msg.tool_use_id)
        }
        // #84: print what was already being captured. #81 recorded tool_use_id
        // at capture but never surfaced it here, and its evidence sink is a
        // temp dir outside the repo, so the answer was written once and lost.
        console.log(
          `  .. task_started ${msg.task_type} ${msg.task_id}` +
            ` tool_use=${msg.tool_use_id ?? '(none)'}` +
            ` parent=${msg.parent_tool_use_id ?? '(none)'}`
        )
      } else if (sub === 'task_notification') {
        taskNotifications.push({
          seq: seq - 1,
          ms: Date.now() - t0,
          task_id: msg.task_id,
          status: msg.status
        })
        console.log(`  .. task_notification ${msg.task_id} ${msg.status}`)
      }
    } else if (msg.type === 'result') {
      console.log(`  == result: ${msg.subtype}`)
      finishTurn()
    }
  }
})()

const runTurn = (text, timeoutMs) =>
  new Promise((resolve) => {
    const timer = setTimeout(() => {
      console.log('  !! turn timed out')
      finishTurn()
    }, timeoutMs)
    turnResolve = () => {
      clearTimeout(timer)
      resolve()
    }
    queue.push({
      type: 'user',
      message: { role: 'user', content: text },
      parent_tool_use_id: null,
      origin: { kind: 'human' }
    })
  })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// --- Turn A: a real subagent, then background it mid-flight.
//
// backgroundTasks() with no argument backgrounds ALL in-flight foreground
// tasks — "equivalent to pressing Ctrl+B in the terminal" (sdk.d.ts). If the
// level signal exists at all, a foreground agent being backgrounded is named
// in the declaration as one of the transitions that emits it.
console.log('turn A — spawn a subagent, then call backgroundTasks()')
const turnA = runTurn(
  'Use the Agent tool to spawn exactly one general-purpose subagent. Its task: run the Bash command `sleep 45` and then reply with the word done. Do not do anything else yourself, and do not wait for a second agent.',
  240_000
)

// Fire backgroundTasks() once a local_agent task is actually in flight. Polling
// rather than hooking the stream so the call site stays outside the consumer.
void (async () => {
  const deadline = Date.now() + 120_000
  while (Date.now() < deadline && taskToParent.size === 0) await sleep(500)
  if (taskToParent.size === 0) {
    backgroundTasksCall = { called: false, reason: 'no local_agent task ever started' }
    console.log('  !! no subagent started — backgroundTasks() not called')
    return
  }
  await sleep(3000) // let it settle into a genuinely foreground running state
  if (typeof q.backgroundTasks !== 'function') {
    backgroundTasksCall = { called: false, reason: 'q.backgroundTasks is not a function' }
    console.log('  !! q.backgroundTasks is not a function on this SDK/CLI')
    return
  }
  try {
    const ms = Date.now() - t0
    const returned = await q.backgroundTasks()
    backgroundTasksCall = { called: true, ms, returned }
    console.log(`  >> backgroundTasks() returned ${returned}`)
  } catch (err) {
    backgroundTasksCall = { called: true, error: String(err?.message ?? err) }
    console.log(`  !! backgroundTasks() threw: ${err?.message ?? err}`)
  }
})()

await turnA

// --- Turn B: a backgrounded Bash, which is a background task by construction
// and needs no control call at all.
console.log('\nturn B — a backgrounded Bash command')
await runTurn(
  'Run the Bash tool with command `sleep 30` and run_in_background set to true. Report the shell id it gives you and stop — do not wait for it to finish and do not read its output.',
  180_000
)

// --- Turn C (#84): a backgrounded Bash spawned from INSIDE a subagent.
//
// This is the case #81 never ran, and it is the only one that can answer #84's
// question (2). Turn B's backgrounded Bash comes off the main thread, where
// there IS no owning agent — so a missing parent there is indistinguishable
// from a parent that simply does not exist to be named. Only a bash task nested
// inside an agent has an owner that the wire could name but might not.
console.log('\nturn C — a backgrounded Bash spawned from inside a subagent (#84)')
await runTurn(
  'Use the Agent tool to spawn exactly one general-purpose subagent. Its task: run the Bash tool with command `sleep 30` and run_in_background set to true, report the shell id it is given, and stop immediately without waiting for it or reading its output. Do not run any Bash yourself, and do not spawn a second agent.',
  240_000
)

// Give any trailing level signal a moment to land after the result.
await sleep(5000)

q.close?.()
queue.end()
await Promise.race([consume, sleep(5000)])

// --- Condition 2's other half: the on-disk agent-<id> sidecars for this
// session. The path is subagent-store.ts's, exactly — <projectDir>/<sessionId>/
// subagents/agent-<id>.meta.json. Scanning the project dir FLAT finds nothing
// and reads as "the CLI stopped writing sidecars", which is a false alarm.
let sidecarDir = null
const sidecars = []
try {
  const projects = join(homedir(), '.claude', 'projects')
  for (const dir of readdirSync(projects)) {
    const full = join(projects, dir)
    let names = []
    try {
      names = readdirSync(full)
    } catch {
      continue
    }
    // Only the project dir holding THIS session's transcript.
    if (!sessionId || !names.includes(`${sessionId}.jsonl`)) continue
    sidecarDir = join(full, sessionId, 'subagents')
    for (const name of readdirSync(sidecarDir)) {
      if (!name.endsWith('.meta.json')) continue
      const agentId = name.slice(0, -'.meta.json'.length).replace(/^agent-/, '')
      let meta = {}
      try {
        meta = JSON.parse(readFileSync(join(sidecarDir, name), 'utf8'))
      } catch {
        /* a bad sidecar is not a finding */
      }
      sidecars.push({ agentId, toolUseId: meta.toolUseId, agentType: meta.agentType })
    }
  }
} catch {
  /* no store, or no subagents/ dir, is not a finding either */
}

// --- The three authorising conditions, evaluated mechanically.
const bgTaskIds = [...new Set(backgroundEvents.flatMap((e) => (e.tasks ?? []).map((t) => t.task_id)))]
const bgTaskTypes = [...new Set(backgroundEvents.flatMap((e) => (e.tasks ?? []).map((t) => t.task_type)))]
const sidecarIds = new Set(sidecars.map((s) => s.agentId))
const correlated = bgTaskIds.filter((id) => taskToParent.has(id) || sidecarIds.has(id))

const conditions = {
  c1_arrives: backgroundEvents.length > 0,
  c2_correlates: correlated.length > 0,
  c3_nonAgentType: bgTaskTypes.some((t) => t !== 'local_agent')
}
const authorised = conditions.c1_arrives && conditions.c2_correlates && conditions.c3_nonAgentType

const summary = {
  cli: hostCli,
  cliVersion,
  sdkVersion,
  backend,
  sessionId,
  jsonl: jsonlPath,
  messages: seq,
  systemSubtypes: Object.fromEntries([...systemSubtypes].sort()),
  backgroundTasksCall,
  backgroundEvents,
  taskStarted,
  taskNotifications,
  taskToParentKeys: [...taskToParent.keys()],
  sidecarDir,
  sidecars,
  bgTaskIds,
  bgTaskTypes,
  correlated,
  conditions,
  authorised
}
writeFileSync(summaryPath, JSON.stringify(summary, null, 2))

console.log('\n--- findings ---')
console.log(`messages                     : ${seq}`)
console.log(`system subtypes seen         : ${[...systemSubtypes.keys()].sort().join(', ')}`)
console.log(`background_tasks_changed     : ${backgroundEvents.length}`)
console.log(`task_started                 : ${taskStarted.length} (${taskStarted.map((t) => t.task_type).join(', ')})`)
console.log(`taskToParent keys            : ${taskToParent.size}`)
console.log(`agent-<id> sidecars          : ${sidecars.length}`)
console.log(`backgroundTasks() call       : ${JSON.stringify(backgroundTasksCall)}`)
console.log(`  C1 arrives on the stream   : ${conditions.c1_arrives}`)
console.log(`  C2 ids correlate           : ${conditions.c2_correlates}`)
console.log(`  C3 a non-local_agent type  : ${conditions.c3_nonAgentType}`)
console.log(`AUTHORISED TO BUILD          : ${authorised}`)

// --- #84: is a background task's spawner reachable on the wire?
//
// Reported separately from #81's C1/C2/C3, which authorised the background-tasks
// VIEW. These two answer a different question: whether that view's rows could
// ever be nested under whatever spawned them.
const bashStarted = taskStarted.filter((t) => t.task_type !== 'local_agent')
const q1 = bashStarted.filter((t) => typeof t.tool_use_id === 'string' && t.tool_use_id.length > 0)
const q2 = bashStarted.filter(
  (t) => typeof t.parent_tool_use_id === 'string' && t.parent_tool_use_id.length > 0
)
// Every key seen on a non-agent task_started, minus the ones already accounted
// for. A parent hiding under another name shows up here rather than as a false
// negative on q2.
const known = new Set([
  'type',
  'subtype',
  'uuid',
  'session_id',
  'task_id',
  'task_type',
  'tool_use_id',
  'parent_tool_use_id',
  'description',
  'subagent_type'
])
const unaccounted = [...new Set(bashStarted.flatMap((t) => t.keys ?? []))]
  .filter((k) => !known.has(k))
  .sort()

console.log('\n--- #84: is the spawner reachable? ---')
console.log(`non-agent task_started seen  : ${bashStarted.length}`)
console.log(`  Q1 carries tool_use_id     : ${q1.length}/${bashStarted.length}`)
console.log(`  Q2 names an owning agent   : ${q2.length}/${bashStarted.length}`)
console.log(`  other keys on the wire     : ${unaccounted.length ? unaccounted.join(', ') : '(none)'}`)
for (const t of bashStarted) {
  console.log(
    `  - ${t.task_id} tool_use=${t.tool_use_id ?? '(none)'} parent=${t.parent_tool_use_id ?? '(none)'}`
  )
}
console.log(
  'NOTE: Q2 is only measured if turn C actually nested a bash task inside an agent.' +
    ' A 0/0 is NOT a negative — it is an unexercised path.'
)

console.log(`\nsummary : ${summaryPath}`)

process.exit(0)
