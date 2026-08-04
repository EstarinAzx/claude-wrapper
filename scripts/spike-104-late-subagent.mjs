// Spike #104 — can a subagent's terminal message arrive after result/success?
//
// Uses engine.ts's query shape and the host CLI selected by cli-path.ts. Raw
// messages stay in the OS temp directory; the committed finding contains only
// message kinds, ordering, timings, versions and booleans.
//
// Permission options are hardcoded to bypass rather than taken from
// getPermissionOptions(), as in spike-81 and spike-90: those getters read main's
// permission-mode store, which does not exist outside the app. The turn
// therefore runs an unattended agent with unrestricted tool use, and the temp
// cwd is not a sandbox.
//
// THE ORDERING IS A RACE, AND ONE TURN CANNOT MEASURE IT. The Agent tool is
// async on this CLI, so whether the parent turn ends before or after its
// subagent settles depends on how long the parent keeps working — which a prompt
// can influence but not control. The first two runs of this harness disagreed:
// one saw the terminal edge 14.5s AFTER result/success, the next saw it 1.7s
// BEFORE. So the question is not "which order happens" but "is the late order
// REACHABLE", and reachability is established by observing it once. This runs
// several turns against one query, records every turn's ordering, and stops as
// soon as it has seen the late one.
//
//   node --experimental-strip-types scripts/spike-104-late-subagent.mjs

import { appendFileSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { query } from '@anthropic-ai/claude-agent-sdk'

const { resolveHostCli, toCliOptions } = await import('../src/main/cli-path.ts')
const { snapshotWispEnv, resolveSpawnEnv, initialMode } = await import('../src/main/backend-mode.ts')

const TURNS = Number(process.env['SPIKE104_TURNS'] ?? 4)
const runDir = mkdtempSync(join(tmpdir(), 'spike-104-'))
const workDir = mkdtempSync(join(tmpdir(), 'spike-104-cwd-'))
const rawPath = join(runDir, 'messages.jsonl')
const findingsPath = new URL('./spike-104-findings.json', import.meta.url)
writeFileSync(join(workDir, 'README.md'), '# spike 104 scratch\n')

const hostCli = resolveHostCli(process.env['PATH'], process.platform)
const cliOptions = toCliOptions(hostCli)
const cliVersion = hostCli
  ? (spawnSync(hostCli, ['--version'], { encoding: 'utf8' }).stdout ?? '').trim()
  : '(SDK bundled CLI)'
const sdkVersion = JSON.parse(
  readFileSync(new URL('../node_modules/@anthropic-ai/claude-agent-sdk/package.json', import.meta.url), 'utf8')
).version
const snapshot = snapshotWispEnv(process.env)
const backendMode = initialMode(snapshot)
const appEnv = resolveSpawnEnv(backendMode, snapshot, process.env)

const queue = (() => {
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
})()

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
let seq = 0
const systemSubtypes = new Map()
// Per-turn state, replaced by startTurn() below.
let turn = null
const turns = []

const startTurn = (index) => {
  turn = {
    index,
    startedMs: Date.now() - t0,
    localAgents: new Map(),
    terminals: [],
    result: null,
    resolveResult: null,
    resolveTerminal: null
  }
  turn.resultArrived = new Promise((resolve) => (turn.resolveResult = resolve))
  turn.terminalArrived = new Promise((resolve) => (turn.resolveTerminal = resolve))
  return turn
}

const consume = (async () => {
  for await (const msg of q) {
    const at = { seq: seq++, ms: Date.now() - t0 }
    appendFileSync(rawPath, JSON.stringify({ ...at, msg }) + '\n')
    if (turn === null) continue

    if (msg.type === 'system') {
      const subtype = String(msg.subtype ?? '')
      systemSubtypes.set(subtype, (systemSubtypes.get(subtype) ?? 0) + 1)

      if (
        subtype === 'task_started' &&
        msg.task_type === 'local_agent' &&
        typeof msg.task_id === 'string'
      ) {
        turn.localAgents.set(msg.task_id, at)
        console.log(`  .. local_agent task_started at ${at.ms}ms`)
      } else if (
        (subtype === 'task_notification' || subtype === 'task_updated') &&
        typeof msg.task_id === 'string' &&
        turn.localAgents.has(msg.task_id)
      ) {
        // engine.ts's NON_TERMINAL rule, including its treatment of an ABSENT
        // status as another progress tick. A message with no status at all must
        // never count as the terminal edge — that would authorise on no evidence.
        const status = msg.status ?? msg.patch?.status ?? null
        const terminal =
          typeof status === 'string' &&
          !['running', 'pending', 'in_progress', 'queued'].includes(status)
        if (terminal) {
          turn.terminals.push({ ...at, subtype, status, taskId: msg.task_id })
          console.log(`  .. ${subtype}/${status} at ${at.ms}ms`)
          turn.resolveTerminal?.()
          turn.resolveTerminal = null
        }
      }
    } else if (msg.type === 'result') {
      turn.result = {
        ...at,
        subtype: String(msg.subtype ?? ''),
        isError: msg.is_error === true,
        // What makes a late edge a DEFECT rather than a curiosity: agents this
        // turn started and had not settled by the time the result landed.
        openLocalAgents: [...turn.localAgents.keys()].filter(
          (id) => !turn.terminals.some((entry) => entry.taskId === id)
        ).length
      }
      console.log(`  == result/${turn.result.subtype} at ${at.ms}ms`)
      turn.resolveResult?.()
      turn.resolveResult = null
    }
  }
})()

console.log(`host CLI : ${hostCli ?? '(SDK bundled)'}`)
console.log(`version  : ${cliVersion}`)
console.log(`SDK      : ${sdkVersion}`)
console.log(`backend  : ${backendMode}`)
console.log(`raw      : ${rawPath}`)
console.log(`turns    : up to ${TURNS}, stopping once a late edge is seen\n`)

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
// Strip the correlation key before anything reaches the committed file.
const scrub = (entry) => {
  if (entry === null || entry === undefined) return entry
  const { taskId: _taskId, ...rest } = entry
  return rest
}

for (let index = 1; index <= TURNS; index++) {
  console.log(`turn ${index}`)
  const current = startTurn(index)
  queue.push({
    type: 'user',
    message: {
      role: 'user',
      content:
        'Use the Agent tool to spawn exactly one general-purpose subagent. Its task is to run the Bash command `sleep 12` and then reply with exactly `done`. The Agent tool is asynchronous: the moment it returns, end your own turn immediately with a one-word reply. Do not check status, do not read output, do not wait, and do not use any other tool.'
    },
    parent_tool_use_id: null,
    origin: { kind: 'human' }
  })

  const resultOutcome = await Promise.race([
    current.resultArrived.then(() => 'result'),
    sleep(180_000).then(() => 'result-timeout')
  ])
  const terminalOutcome = await Promise.race([
    current.terminalArrived.then(() => 'terminal'),
    sleep(120_000).then(() => 'terminal-timeout')
  ])

  const firstTerminal = current.terminals[0] ?? null
  const record = {
    turn: index,
    resultOutcome,
    terminalOutcome,
    localAgentCount: current.localAgents.size,
    taskStarted: scrub([...current.localAgents.values()][0] ?? null),
    result: current.result,
    terminal: scrub(firstTerminal),
    // Positive = the terminal edge landed after the result, which is the defect.
    resultToTerminalMs:
      current.result === null || firstTerminal === null
        ? null
        : firstTerminal.ms - current.result.ms,
    terminalAfterResult:
      current.result !== null && firstTerminal !== null && firstTerminal.seq > current.result.seq
  }
  turns.push(record)
  console.log(
    `  -> ${record.terminalAfterResult ? 'LATE' : 'early'}` +
      ` (${record.resultToTerminalMs ?? 'unmeasured'}ms relative to result)\n`
  )
  if (record.terminalAfterResult) break
}

turn = null
q.close?.()
queue.end()
await Promise.race([consume, sleep(5000)])

const lateTurns = turns.filter((entry) => entry.terminalAfterResult)
const measuredTurns = turns.filter(
  (entry) => entry.result !== null && entry.terminal !== null
)
const conditions = {
  localAgentStarted: turns.some((entry) => entry.localAgentCount > 0),
  resultSucceeded: turns.some((entry) => entry.result?.subtype === 'success'),
  terminalArrived: turns.some((entry) => entry.terminal !== null),
  lateOrderingReachable: lateTurns.length > 0,
  openAgentAtResult: lateTurns.some((entry) => (entry.result?.openLocalAgents ?? 0) > 0)
}
const authorised = Object.values(conditions).every(Boolean)

const findings = {
  spike: 104,
  question: 'Can a subagent terminal message arrive after result/success?',
  measuredAt: new Date().toISOString(),
  environment: {
    backendMode,
    hostCliUsed: hostCli !== null,
    cliVersion,
    sdkVersion,
    platform: process.platform
  },
  turnsRun: turns.length,
  turnsMeasured: measuredTurns.length,
  lateTurns: lateTurns.length,
  turns,
  messageCount: seq,
  systemSubtypes: Object.fromEntries([...systemSubtypes].sort()),
  conditions,
  authorised,
  ordering:
    'INTERMITTENT, and that is the finding. The Agent tool is async, so the two orderings race; a turn where the parent keeps working long enough sees the terminal edge first. One observation of the late ordering establishes reachability, which is what the remedy needs. An all-early run does NOT refute it.',
  scrubbing:
    'Raw messages remain in the OS temp directory. This file contains no cwd, session id, task id, tool-use id, prompt-derived name, message body or file content.'
}
writeFileSync(findingsPath, JSON.stringify(findings, null, 2) + '\n')

console.log('--- finding ---')
console.log(`turns run                   : ${turns.length} (${lateTurns.length} late)`)
console.log(`local agent started         : ${conditions.localAgentStarted}`)
console.log(`result/success              : ${conditions.resultSucceeded}`)
console.log(`terminal arrived            : ${conditions.terminalArrived}`)
console.log(`LATE ordering reachable     : ${conditions.lateOrderingReachable}`)
console.log(`agent still open at result  : ${conditions.openAgentAtResult}`)
for (const entry of turns) {
  console.log(
    `  turn ${entry.turn}: ${entry.terminalAfterResult ? 'LATE ' : 'early'}` +
      ` ${entry.resultToTerminalMs ?? '(unmeasured)'}ms`
  )
}
console.log(`AUTHORISED TO BUILD         : ${authorised}`)
console.log(`findings                    : ${findingsPath.pathname}`)

process.exit(authorised ? 0 : 1)
