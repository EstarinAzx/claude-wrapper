// Spike #88 — is MCP server status non-empty, and does it change between turns?
//
// Sibling to spike-87-thinking.mjs, and for the same reason: `mcpServers` and
// `strictMcpConfig` are CONSTRUCTION-TIME options, and #73 already paid for that
// lesson once (`resume` binds when the query is built and `ensureQuery` returns
// early ever after). Comparing a broken-server config against the app's own
// config across turns of ONE query would measure the first config twice. So:
// one fresh query per config, engine.ts's exact options plus the field under
// test.
//
//   node --experimental-strip-types scripts/spike-88-mcp-status.mjs
//
// The flag lets it import the app's REAL src/main/cli-path.ts and
// src/main/backend-mode.ts rather than copies. Unsetting ANTHROPIC_BASE_URL by
// hand is NOT native mode — it leaves ANTHROPIC_API_KEY in place and the CLI
// takes the gateway's key to the real endpoint; #87 measured that the hard way
// and every turn came back "Invalid API key". resolveSpawnEnv strips all three
// WISP_KEYS and is the only correct source.
//
// EVIDENCE SPLIT, same as #87: the raw JSONL stays in a temp dir (session ids,
// message prose), and a SCRUBBED findings file lands in the repo at
// scripts/spike-88-findings.json.
//
// ONE EXTRA SCRUB #87 did not need. An McpServerStatus carries `config`, and an
// McpStdioServerConfig carries `env` — which is where an MCP server's API keys
// live. This repo is pushed. So `config` is NEVER recorded verbatim: only its
// key set and its `type`. Likewise `error` is recorded verbatim only for the
// servers THIS SCRIPT injects (whose text we authored); for disk-configured
// servers only its character count is kept, because a connection error routinely
// quotes the command line it failed to run.

import { mkdtempSync, writeFileSync, appendFileSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { query, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk'

const { resolveHostCli, toCliOptions } = await import('../src/main/cli-path.ts')
const { snapshotWispEnv, resolveSpawnEnv } = await import('../src/main/backend-mode.ts')

const runDir = mkdtempSync(join(tmpdir(), 'spike-88-'))
const jsonlPath = join(runDir, 'messages.jsonl')

const findingsPath = process.env['SPIKE88_OUT']
  ? new URL(`./${process.env['SPIKE88_OUT']}`, import.meta.url)
  : new URL('./spike-88-findings.json', import.meta.url)
const onlyConfig = process.env['SPIKE88_ONLY'] ?? null

// A cwd outside the repo, so the agent's own tools cannot touch the tree under
// test. This is a DEVIATION from the app, which runs in the user's workspace,
// and cwd selects the project MCP scope — so it is checked rather than assumed:
// this repo has no .mcp.json, and ~/.claude.json's entry for this project
// declares an empty mcpServers. Both scopes are therefore empty here and the
// temp cwd costs nothing. On a project that DID declare servers the two would
// differ, so the finding records the cwd it measured.
const workDir = mkdtempSync(join(tmpdir(), 'spike-88-cwd-'))
writeFileSync(join(workDir, 'README.md'), '# spike 88 scratch\n')

const t0 = Date.now()
let seq = 0
const record = (config, msg) => {
  appendFileSync(
    jsonlPath,
    JSON.stringify({ seq: seq++, ms: Date.now() - t0, config, msg }) + '\n'
  )
}

// --- Which binary. Same rule as #87: a finding without a version line is not
// falsifiable later.
const hostCli = resolveHostCli(process.env['PATH'], process.platform)
const cliOptions = toCliOptions(hostCli)
const cliVersion = hostCli
  ? (spawnSync(hostCli, ['--version'], { encoding: 'utf8' }).stdout ?? '').trim()
  : '(no host CLI — SDK bundled binary)'
const sdkVersion = JSON.parse(
  readFileSync(
    new URL('../node_modules/@anthropic-ai/claude-agent-sdk/package.json', import.meta.url),
    'utf8'
  )
).version

const wispSnapshot = snapshotWispEnv(process.env)
const backend =
  process.env['SPIKE88_BACKEND'] ?? (wispSnapshot['ANTHROPIC_BASE_URL'] ? 'wisped' : 'native')
const spawnEnv = resolveSpawnEnv(backend, wispSnapshot, process.env)

console.log(`host CLI : ${hostCli ?? '(none)'}`)
console.log(`version  : ${cliVersion}`)
console.log(`SDK      : ${sdkVersion}`)
console.log(`backend  : ${backend}`)
console.log(`raw      : ${jsonlPath}`)
console.log(`findings : ${findingsPath.pathname}`)
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const keysOf = (o) => (o && typeof o === 'object' ? Object.keys(o).sort() : [])
const bump = (map, k) => map.set(k, (map.get(k) ?? 0) + 1)
const addKeys = (map, k, obj) => {
  if (!map.has(k)) map.set(k, new Set())
  const set = map.get(k)
  for (const key of keysOf(obj)) set.add(key)
}

// The #84 rule, applied to a different absence. "No push message arrived" is
// only a measurement if a push under ANOTHER NAME could have been seen — so
// nothing here greps for the subtype `mcp_status`. It walks every message and
// collects the PATH of every key whose name mentions mcp, at any depth. Names
// only, never values: a key path is the measurement, and an McpStdioServerConfig
// nested under one of them carries `env`.
const mcpKeyPaths = (node, path = '$', depth = 0, out = new Set()) => {
  if (depth > 5 || node === null || typeof node !== 'object') return out
  if (Array.isArray(node)) {
    // Index-collapsed: an array of ten servers is one shape, not ten findings.
    for (const item of node.slice(0, 5)) mcpKeyPaths(item, `${path}[]`, depth + 1, out)
    return out
  }
  for (const [k, v] of Object.entries(node)) {
    if (/mcp/i.test(k)) out.add(`${path}.${k}`)
    mcpKeyPaths(v, `${path}.${k}`, depth + 1, out)
  }
  return out
}

const newCensus = () => ({
  messageTypes: new Map(), // "assistant", "system:init", ...
  messageKeys: new Map(), // type -> Set of every key seen
  systemSubtypes: new Map(),
  // Every init message's mcp_servers, whole. This shape is declared as
  // { name, status } (sdk.d.ts:4421-4424) and carries no config and no secrets,
  // so it is the one MCP payload safe to keep verbatim — and it is exactly the
  // field engine.ts:461-465 throws away.
  initMcpServers: [],
  // Q2. Where an mcp-shaped key was seen, and on which message type. An entry
  // whose type is anything other than `system:init` is an undeclared push.
  mcpKeyPathsByMessage: new Map(),
  polls: [],
  // What this config DID to the servers between turns, if anything. Without a
  // lever pulled here, "the status never changed" is not a measurement — see
  // the toggle config at the bottom.
  toggles: [],
  results: [],
  turn: { index: 0, name: '(none)' }
})

const censusMessage = (c, msg) => {
  const type = String(msg?.type ?? '(none)')
  const subtype = typeof msg?.subtype === 'string' ? msg.subtype : null
  const label = subtype ? `${type}:${subtype}` : type
  bump(c.messageTypes, label)
  addKeys(c.messageKeys, type, msg)
  if (type === 'system' && subtype) bump(c.systemSubtypes, subtype)

  if (type === 'system' && subtype === 'init') {
    const servers = msg.mcp_servers
    c.initMcpServers.push({
      ms: Date.now() - t0,
      turn: c.turn.index,
      prompt: c.turn.name,
      present: Array.isArray(servers),
      count: Array.isArray(servers) ? servers.length : null,
      // Verbatim: name + status only, which is the whole declared shape.
      servers: Array.isArray(servers)
        ? servers.map((s) => ({ name: s?.name ?? null, status: s?.status ?? null, keys: keysOf(s) }))
        : null
    })
  }

  const paths = [...mcpKeyPaths(msg)]
  if (paths.length > 0) {
    if (!c.mcpKeyPathsByMessage.has(label)) c.mcpKeyPathsByMessage.set(label, new Set())
    const set = c.mcpKeyPathsByMessage.get(label)
    for (const p of paths) set.add(p)
  }

  if (type === 'result') {
    c.results.push({
      subtype: msg.subtype,
      // #87's landmine, carried forward verbatim: the native control came back
      // `subtype: 'success'` on both turns while every message was the synthetic
      // text "Invalid API key". `is_error` is the field that says so. #88 asks
      // "is it non-empty", and a config that never reached a model reports a
      // clean empty list that reads exactly like a real negative.
      is_error: msg.is_error === true
    })
  }
}

// --- The scrub. See the header: `config` never verbatim, `error` verbatim only
// for servers this script injected.
const OURS = /^spike88_/
const scrubStatus = (s) => {
  const ours = typeof s?.name === 'string' && OURS.test(s.name)
  const err = typeof s?.error === 'string' ? s.error : null
  return {
    name: s?.name ?? null,
    status: s?.status ?? null,
    keys: keysOf(s),
    scope: s?.scope ?? null,
    hasServerInfo: s?.serverInfo != null,
    serverInfo: s?.serverInfo ? { name: s.serverInfo.name, version: s.serverInfo.version } : null,
    errorChars: err === null ? null : err.length,
    error: ours ? err : null,
    configType: s?.config?.type ?? null,
    configKeys: keysOf(s?.config),
    toolCount: Array.isArray(s?.tools) ? s.tools.length : null
  }
}

// A signature is what makes "did it CHANGE" answerable rather than eyeballed.
const signature = (servers) =>
  servers === null
    ? '(none)'
    : servers
        .map((s) => `${s.name}=${s.status}`)
        .sort()
        .join(',')

// Q3. Every poll is raced against a timeout, because the honest failure mode
// here is a hang, not a throw: mcpServerStatus() rides the control channel, and
// a control channel that is not up yet answers nothing at all. A hang recorded
// as a hang is a result; a hang that stalls the script is a lost night.
const poll = async (c, q, at, timeoutMs = 25_000) => {
  const started = Date.now()
  let timer = null
  const entry = { at, ms: started - t0, ok: false, timedOut: false, error: null, servers: null }
  try {
    const res = await Promise.race([
      q.mcpServerStatus(),
      new Promise((r) => (timer = setTimeout(() => r('__TIMEOUT__'), timeoutMs)))
    ])
    if (res === '__TIMEOUT__') {
      entry.timedOut = true
    } else {
      entry.ok = true
      entry.present = Array.isArray(res)
      entry.count = Array.isArray(res) ? res.length : null
      entry.servers = Array.isArray(res) ? res.map(scrubStatus) : null
    }
  } catch (err) {
    // Includes the case the ticket asks about directly: whether this method
    // exists at all on the handle the app would hold. engine.ts's QueryHandle
    // declares four methods (engine.ts:74-79); a TypeError here is the answer.
    entry.error = `${err?.name ?? 'Error'}: ${err?.message ?? err}`
  } finally {
    if (timer) clearTimeout(timer)
  }
  entry.elapsedMs = Date.now() - started
  entry.signature = signature(entry.servers)
  c.polls.push(entry)
  console.log(
    `  ?? poll ${at.padEnd(18)} ${entry.ok ? `n=${entry.count}` : entry.timedOut ? 'TIMEOUT' : `ERR ${entry.error}`}` +
      ` (${entry.elapsedMs}ms)  ${entry.signature}`
  )
  return entry
}

// --- Run one config: a fresh query, engine.ts's options plus the field under
// test, then the given prompts, with the four poll points around them.
const runConfig = async (label, extraOptions, prompts, hooks = {}, timeoutMs = 180_000) => {
  if (onlyConfig && label !== onlyConfig) {
    return { label, options: describeOptions(extraOptions), skipped: `SPIKE88_ONLY=${onlyConfig}`, ...newCensus() }
  }
  console.log(`\n=== config "${label}" :: ${JSON.stringify(describeOptions(extraOptions))}`)
  const c = newCensus()
  c.label = label
  c.options = describeOptions(extraOptions)
  const queue = createMessageQueue()

  const options = {
    cwd: workDir,
    includePartialMessages: true,
    canUseTool: async (_name, _input, o) => ({
      behavior: 'allow',
      toolUseID: o.toolUseID,
      decisionClassification: 'user_temporary'
    }),
    env: spawnEnv,
    permissionMode: 'bypassPermissions',
    allowDangerouslySkipPermissions: true,
    ...cliOptions,
    ...extraOptions
  }

  let q
  try {
    q = query({ prompt: queue.iterable, options })
  } catch (err) {
    c.error = `query() threw: ${err?.message ?? err}`
    console.log(`  !! ${c.error}`)
    return c
  }

  // The t0 poll needs the CLI to have started, and the only honest signal that
  // it has is an init message. Raced, not awaited: if init only ever arrives
  // after the first user message on this transport, blocking here would hang the
  // whole spike, and "init had not arrived yet" is itself worth recording.
  let sawInit = false
  let initResolve = null
  const initSeen = new Promise((r) => (initResolve = r))

  let turnResolve = null
  const finishTurn = () => {
    const r = turnResolve
    turnResolve = null
    r?.()
  }

  const consume = (async () => {
    try {
      for await (const msg of q) {
        record(label, msg)
        censusMessage(c, msg)
        if (msg.type === 'system' && msg.subtype === 'init' && !sawInit) {
          sawInit = true
          initResolve?.()
        }
        if (msg.type === 'result') {
          console.log(`  == result: ${msg.subtype}${msg.is_error === true ? '  !! is_error' : ''}`)
          finishTurn()
        }
      }
    } catch (err) {
      c.error = `stream threw: ${err?.message ?? err}`
      console.log(`  !! ${c.error}`)
      finishTurn()
    }
  })()

  await Promise.race([initSeen, sleep(20_000)])
  c.initBeforeFirstTurn = sawInit
  await poll(c, q, 'before-first-turn')

  for (const [i, { name, text }] of prompts.entries()) {
    console.log(`  -- turn "${name}"`)
    c.turn = { index: i, name }
    // Mid-turn poll, fired but not awaited — awaiting it here would serialise
    // the poll ahead of the turn and stop it being mid-turn at all.
    const midPoll = i === 0 ? sleep(2500).then(() => poll(c, q, 'mid-turn-1')) : null
    await new Promise((resolve) => {
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
    if (midPoll) await midPoll
    // THE load-bearing poll. Between turns is where a health panel would refresh
    // and where #83's lesson bites: activeOnEvent is null out here, so an
    // EngineEvent emitted now reaches nobody (engine.ts:247-281). If this poll
    // works, the injected-port shape is viable; if it hangs or throws, the whole
    // on-demand route is dead and only the init snapshot survives.
    if (i < prompts.length - 1) {
      await poll(c, q, `between-turns-${i + 1}`)
      // The lever, pulled AFTER the baseline between-turns poll so the pair
      // brackets it. Everything the hook does is recorded on c.toggles.
      await hooks.betweenTurns?.(q, c, i)
    }
  }

  // #81 timed a level 3.3s after result/success, so a hard cut here would repeat
  // that bug — an MCP server that connects late would be missed by exactly the
  // margin that matters.
  await sleep(3000)
  await poll(c, q, 'after-last-turn')

  q.close?.()
  queue.end()
  await Promise.race([consume, sleep(5000)])
  return c
}

// Options carry a live McpServer instance for the sdk-type entry, which does not
// serialise — so the findings record a description, never the object.
const describeOptions = (o) => {
  const out = {}
  for (const [k, v] of Object.entries(o ?? {})) {
    if (k !== 'mcpServers') {
      out[k] = v
      continue
    }
    out.mcpServers = Object.fromEntries(
      Object.entries(v).map(([name, cfg]) => [
        name,
        cfg?.type === 'sdk' ? { type: 'sdk' } : { type: cfg?.type ?? 'stdio', command: cfg?.command }
      ])
    )
  }
  return out
}

// --- The prompts. Trivial and tool-free on purpose: a tool call would drag
// unrelated blocks into the census, and #88 asks nothing that a hard turn
// answers better. Two turns, because "does it change BETWEEN turns" needs a
// gap between two of them.
const PROMPTS = [
  { name: 'turn-1', text: 'Reply with exactly the word: one' },
  { name: 'turn-2', text: 'Reply with exactly the word: two' }
]

const configs = []

// Config 1 — the app's ACTUAL configuration. engine.ts passes neither
// `mcpServers` nor `strictMcpConfig`, so whatever this sees is what the shipped
// app already receives and discards. Q1 and Q3 are answered here or not at all.
configs.push(await runConfig('control-app-options', {}, PROMPTS))

// Config 2 — Q4, and the ticket calls it the one that matters most. A panel that
// can only ever show `connected` is untestable and worthless.
//
// `strictMcpConfig: true` so the disk servers are OUT and the result is
// unambiguous: exactly two entries, one that cannot possibly start and one
// in-process server that needs no network, no install and no port. If the
// broken one is absent from the list, or present without an error, that sinks
// the feature — and the good one is what stops "the list is simply broken"
// explaining the same observation.
const brokenServers = () => ({
  spike88_broken: { type: 'stdio', command: '__spike88_no_such_command__', args: [] },
  spike88_ok: createSdkMcpServer({ name: 'spike88_ok', version: '1.0.0', tools: [] })
})
configs.push(
  await runConfig('injected-broken', { strictMcpConfig: true, mcpServers: brokenServers() }, PROMPTS)
)

// Config 3 — the one that stops the headline answer being vacuous.
//
// Configs 1 and 2 will report that the status did not change between turns. On
// its own that is worth nothing: NOTHING HAPPENED to those servers, so a status
// that never moved is indistinguishable from a status that CANNOT move — the
// #27/#81 trap, and this repo's standing rule that an absence is only a
// measurement if the path was exercised.
//
// So this config pulls a lever. Query declares `toggleMcpServer(name, enabled)`
// (sdk.d.ts:2521), which is a real control request in the shipped bundle. Poll,
// disable the healthy server between turns, poll again: if the second poll still
// says `connected`, the value is a frozen snapshot and the whole on-demand route
// is worthless. The next turn's init is then compared to the same toggle, which
// is what decides whether the CHEAP path (init, already arriving and discarded)
// tracks reality or only the poll does.
//
// TWO levers, in order, because the first one turned out not to be falsifiable
// on its own. `toggleMcpServer` returns void — it reports nothing about whether
// the worker honoured it — so "toggled ok, status unchanged" has two readings
// that a void return cannot separate: the status is frozen, or the toggle was a
// no-op on an sdk-type server. It is kept because that ambiguity is itself worth
// recording about an API a feature might reach for.
//
// `setMcpServers` is the lever that settles it: it returns
// { added, removed, errors } (sdk.d.ts:1135-1148), so the lever's own effect is
// self-evident before the status is ever consulted. It is also the SAFE one —
// it affects only DYNAMICALLY-added servers (ours report scope "dynamic") and
// explicitly leaves settings-file servers alone, so nothing this script does can
// disturb the machine's real MCP config. Removing spike88_ok and re-polling is
// then a clean test: `removed: ["spike88_ok"]` plus a poll that still says
// `connected` means the value is a frozen snapshot and the on-demand route is
// worthless; a poll that drops to one server means it is live.
const mutateBetweenTurns = async (q, c) => {
  const toggle = { action: 'toggleMcpServer(spike88_ok,false)', ms: Date.now() - t0, ok: false, error: null, result: null }
  try {
    if (typeof q.toggleMcpServer !== 'function') throw new Error('not a function on this handle')
    await Promise.race([
      q.toggleMcpServer('spike88_ok', false),
      new Promise((_r, rej) => setTimeout(() => rej(new Error('toggle timed out')), 25_000))
    ])
    toggle.ok = true
  } catch (err) {
    toggle.error = `${err?.name ?? 'Error'}: ${err?.message ?? err}`
  }
  c.toggles.push(toggle)
  console.log(`  >> toggleMcpServer(spike88_ok,false) : ${toggle.ok ? 'returned ok' : toggle.error}`)
  await poll(c, q, 'after-toggle')

  const setter = { action: 'setMcpServers(drop spike88_ok)', ms: Date.now() - t0, ok: false, error: null, result: null }
  try {
    if (typeof q.setMcpServers !== 'function') throw new Error('not a function on this handle')
    const res = await Promise.race([
      q.setMcpServers({ spike88_broken: { type: 'stdio', command: '__spike88_no_such_command__', args: [] } }),
      new Promise((_r, rej) => setTimeout(() => rej(new Error('setMcpServers timed out')), 25_000))
    ])
    setter.ok = true
    // Safe verbatim: added/removed are our own server names and `errors` is
    // keyed by them too, with text about a command this script authored.
    setter.result = { added: res?.added ?? null, removed: res?.removed ?? null, errors: res?.errors ?? null }
  } catch (err) {
    setter.error = `${err?.name ?? 'Error'}: ${err?.message ?? err}`
  }
  c.toggles.push(setter)
  console.log(`  >> setMcpServers(drop spike88_ok)    : ${setter.ok ? JSON.stringify(setter.result) : setter.error}`)
  await poll(c, q, 'after-set-servers')
}

configs.push(
  await runConfig(
    'mutate-between-turns',
    { strictMcpConfig: true, mcpServers: brokenServers() },
    PROMPTS,
    { betweenTurns: mutateBetweenTurns }
  )
)

// --- Report.
const mapObj = (m) => Object.fromEntries([...m].sort(([a], [b]) => (a < b ? -1 : 1)))
const setMapObj = (m) =>
  Object.fromEntries([...m].sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, v]) => [k, [...v].sort()]))

const perConfig = configs.map((c) => ({
  label: c.label,
  options: c.options ?? null,
  skipped: c.skipped ?? null,
  error: c.error ?? null,
  initBeforeFirstTurn: c.initBeforeFirstTurn ?? null,
  messageTypes: mapObj(c.messageTypes),
  messageKeys: setMapObj(c.messageKeys),
  systemSubtypes: mapObj(c.systemSubtypes),
  initMcpServers: c.initMcpServers,
  mcpKeyPathsByMessage: setMapObj(c.mcpKeyPathsByMessage),
  polls: c.polls,
  toggles: c.toggles,
  results: c.results,
  erroredTurns: (c.results ?? []).filter((r) => r.is_error).length,
  // Did the answer move across the four poll points? Signatures only, so a
  // difference is a fact rather than an impression.
  pollSignatures: c.polls.map((p) => ({ at: p.at, ok: p.ok, signature: p.signature })),
  statusChangedAcrossPolls:
    new Set(c.polls.filter((p) => p.ok).map((p) => p.signature)).size > 1
}))

const app = perConfig[0]
const broken = perConfig[1]
const toggled = perConfig[2]
const pollAt = (c, at) => (c.polls ?? []).find((p) => p.at === at && p.ok) ?? null
const statusOf = (pollEntry, name) =>
  pollEntry?.servers?.find((s) => s.name === name)?.status ?? null
const initStatusOnTurn = (c, turn, name) =>
  (c.initMcpServers ?? [])
    .filter((i) => i.turn === turn)
    .flatMap((i) => i.servers ?? [])
    .find((s) => s.name === name)?.status ?? null
const okPolls = (c) => (c.polls ?? []).filter((p) => p.ok)
const findBroken = (c) =>
  okPolls(c)
    .flatMap((p) => p.servers ?? [])
    .filter((s) => s.name === 'spike88_broken')
const findOk = (c) =>
  okPolls(c)
    .flatMap((p) => p.servers ?? [])
    .filter((s) => s.name === 'spike88_ok')

const answers = {
  // Q1 — the app's own config, no options added.
  q1_init_carries_mcp_servers: app.initMcpServers.some((i) => i.present),
  q1_init_server_count: Math.max(0, ...app.initMcpServers.map((i) => i.count ?? 0)),
  // Not one of the four asked questions, and it reframes all of them: if init
  // arrives once PER TURN rather than once per session, the app is already
  // handed a fresh snapshot every turn and the between-turn gap is only the
  // idle window.
  q1b_init_messages_vs_turns: perConfig.map((c) => ({
    label: c.label,
    inits: (c.initMcpServers ?? []).length,
    turns: (c.results ?? []).length,
    initTurnIndexes: (c.initMcpServers ?? []).map((i) => i.turn)
  })),
  q1_init_statuses: Object.fromEntries(
    [
      ...app.initMcpServers
        .flatMap((i) => i.servers ?? [])
        .reduce((m, s) => m.set(String(s.status), (m.get(String(s.status)) ?? 0) + 1), new Map())
    ].sort()
  ),
  // Q2 — anything mcp-shaped on a message that is NOT system:init is a push the
  // types do not declare.
  q2_mcp_key_paths_outside_init: Object.fromEntries(
    Object.entries(app.mcpKeyPathsByMessage).filter(([k]) => k !== 'system:init')
  ),
  q2_undeclared_push_seen:
    Object.keys(app.mcpKeyPathsByMessage).filter((k) => k !== 'system:init').length > 0,
  q2_init_messages_per_config: perConfig.map((c) => ({
    label: c.label,
    inits: c.initMcpServers.length
  })),
  // The ticket's title question, split from Q2 because a poll changing is a
  // different fact from a message arriving. Read this WITH the toggle block
  // below: `false` here on configs 1-2 only means nothing changed those servers.
  q2_status_changed_across_polls: perConfig.map((c) => ({
    label: c.label,
    changed: c.statusChangedAcrossPolls,
    signatures: c.pollSignatures
  })),
  // The exercised version. Without this the `false` above is an unexercised
  // negative, not a result.
  q2_lever_toggle: {
    // Kept for the ambiguity it exposes, not for the answer it gives.
    attempted: (toggled.toggles ?? []).some((t) => t.action?.startsWith('toggleMcpServer')),
    returnedOk: (toggled.toggles ?? []).find((t) => t.action?.startsWith('toggleMcpServer'))?.ok ?? null,
    error: (toggled.toggles ?? []).find((t) => t.action?.startsWith('toggleMcpServer'))?.error ?? null,
    statusBefore: statusOf(pollAt(toggled, 'between-turns-1'), 'spike88_ok'),
    statusAfter: statusOf(pollAt(toggled, 'after-toggle'), 'spike88_ok'),
    pollTrackedTheChange:
      statusOf(pollAt(toggled, 'between-turns-1'), 'spike88_ok') !==
      statusOf(pollAt(toggled, 'after-toggle'), 'spike88_ok'),
    note:
      'toggleMcpServer returns void, so "returned ok but nothing moved" cannot distinguish a frozen status from a no-op toggle. Read q2_lever_set_servers for the answer.'
  },
  q2_lever_set_servers: {
    attempted: (toggled.toggles ?? []).some((t) => t.action?.startsWith('setMcpServers')),
    returnedOk: (toggled.toggles ?? []).find((t) => t.action?.startsWith('setMcpServers'))?.ok ?? null,
    error: (toggled.toggles ?? []).find((t) => t.action?.startsWith('setMcpServers'))?.error ?? null,
    // The lever's OWN report — this is what makes the poll result readable. If
    // `removed` is empty the lever never pulled and the poll proves nothing.
    result: (toggled.toggles ?? []).find((t) => t.action?.startsWith('setMcpServers'))?.result ?? null,
    leverActuallyPulled:
      ((toggled.toggles ?? []).find((t) => t.action?.startsWith('setMcpServers'))?.result?.removed ?? []).length > 0,
    countBefore: pollAt(toggled, 'after-toggle')?.count ?? null,
    countAfter: pollAt(toggled, 'after-set-servers')?.count ?? null,
    statusBefore: statusOf(pollAt(toggled, 'after-toggle'), 'spike88_ok'),
    statusAfter: statusOf(pollAt(toggled, 'after-set-servers'), 'spike88_ok'),
    // The decisive one: a live value moves, a frozen snapshot does not.
    pollTrackedTheChange:
      pollAt(toggled, 'after-toggle')?.signature !== pollAt(toggled, 'after-set-servers')?.signature,
    // And the one that decides which path a build should use: does the cheap
    // init snapshot on the NEXT turn carry the same change?
    initTurn1: initStatusOnTurn(toggled, 0, 'spike88_ok'),
    initTurn2AfterChange: initStatusOnTurn(toggled, 1, 'spike88_ok'),
    nextInitTrackedTheChange:
      initStatusOnTurn(toggled, 0, 'spike88_ok') !== initStatusOnTurn(toggled, 1, 'spike88_ok')
  },
  // Q3 — does the method work at all through a handle built the app's way, and
  // does it work in the window where the app would use it.
  q3_mcpServerStatus_ok_by_point: Object.fromEntries(
    app.polls.map((p) => [p.at, p.ok ? 'ok' : p.timedOut ? 'timeout' : `error: ${p.error}`])
  ),
  q3_between_turns_ok: app.polls.some((p) => p.at.startsWith('between-turns') && p.ok),
  q3_before_first_turn_ok: app.polls.some((p) => p.at === 'before-first-turn' && p.ok),
  // Q4 — the one the ticket calls decisive.
  q4_broken_server_seen: findBroken(broken).length > 0,
  q4_broken_status_values: [...new Set(findBroken(broken).map((s) => s.status))],
  q4_broken_error_populated: findBroken(broken).some((s) => (s.errorChars ?? 0) > 0),
  q4_broken_error_text: findBroken(broken).find((s) => s.error)?.error ?? null,
  q4_good_server_seen: findOk(broken).length > 0,
  q4_good_status_values: [...new Set(findOk(broken).map((s) => s.status))],
  // The decision-maker for whoever builds it: if the failure is visible on init,
  // the data is ALREADY arriving at engine.ts:461-465 and the feature is a read.
  // If only mcpServerStatus() sees it, the injected-port poll is mandatory.
  q4_broken_visible_on_init: broken.initMcpServers
    .flatMap((i) => i.servers ?? [])
    .some((s) => s.name === 'spike88_broken'),
  q4_broken_init_status: [
    ...new Set(
      broken.initMcpServers
        .flatMap((i) => i.servers ?? [])
        .filter((s) => s.name === 'spike88_broken')
        .map((s) => s.status)
    )
  ],
  // Any errored turn makes that config's empty list uninterpretable. #87.
  erroredTurnsByConfig: Object.fromEntries(perConfig.map((c) => [c.label, c.erroredTurns]))
}

const findings = {
  spike: 88,
  cli: hostCli,
  cliVersion,
  sdkVersion,
  backend,
  cwd: workDir,
  // Corrected after the first run measured it rather than assumed it. The temp
  // cwd is NOT equivalent to the repo cwd: it sits under C:\, and ~/.claude.json
  // carries an mcpServers entry for the project key "C:/", which arrived in the
  // results as `caveman-shrink` with scope "local". The repo cwd (D:\) has an
  // empty mcpServers and the repo has no .mcp.json, so the shipped app on this
  // machine sees the THREE user-scope servers, not four. This does not move Q1
  // — non-empty either way — but the count here is one higher than the app's.
  cwdNote:
    'temp dir under C:\\, not the repo. Adds one local-scope server (caveman-shrink) from ~/.claude.json\'s "C:/" project entry that the repo cwd on D:\\ would not see. App-visible count on this machine is 3 user-scope servers; measured count here is 4.',
  rawJsonl: jsonlPath,
  messages: seq,
  answers,
  configs: perConfig
}
writeFileSync(findingsPath, JSON.stringify(findings, null, 2) + '\n')

console.log('\n--- #88 findings ---')
for (const c of perConfig) {
  if (c.skipped) {
    console.log(`${c.label.padEnd(22)} SKIPPED — ${c.skipped}`)
    continue
  }
  console.log(
    `${c.label.padEnd(22)} inits=${c.initMcpServers.length}` +
      ` initServers=${c.initMcpServers.map((i) => i.count).join('/') || '(none)'}` +
      ` polls=${c.polls.filter((p) => p.ok).length}/${c.polls.length} ok` +
      ` changed=${c.statusChangedAcrossPolls}` +
      (c.erroredTurns ? `  !! ${c.erroredTurns} ERRORED TURN(S) — this config measured nothing` : '') +
      (c.error ? ` ERROR=${c.error}` : '')
  )
}
console.log('')
console.log(`Q1 init carries mcp_servers    : ${answers.q1_init_carries_mcp_servers} (n=${answers.q1_init_server_count})`)
console.log(`Q1 init statuses               : ${JSON.stringify(answers.q1_init_statuses)}`)
console.log(`Q2 undeclared mcp push         : ${answers.q2_undeclared_push_seen}`)
console.log(`Q1 inits vs turns              : ${JSON.stringify(answers.q1b_init_messages_vs_turns.map((s) => `${s.label} ${s.inits}init/${s.turns}turn`))}`)
console.log(`Q2 status changed across polls : ${JSON.stringify(answers.q2_status_changed_across_polls.map((s) => `${s.label}=${s.changed}`))}`)
console.log(
  `Q2 lever toggleMcpServer       : returnedOk=${answers.q2_lever_toggle.returnedOk}` +
    ` ${answers.q2_lever_toggle.statusBefore}->${answers.q2_lever_toggle.statusAfter}` +
    ` pollTracked=${answers.q2_lever_toggle.pollTrackedTheChange}` +
    (answers.q2_lever_toggle.error ? ` ERR=${answers.q2_lever_toggle.error}` : '')
)
console.log(
  `Q2 lever setMcpServers         : pulled=${answers.q2_lever_set_servers.leverActuallyPulled}` +
    ` ${JSON.stringify(answers.q2_lever_set_servers.result)}` +
    ` n ${answers.q2_lever_set_servers.countBefore}->${answers.q2_lever_set_servers.countAfter}` +
    ` pollTracked=${answers.q2_lever_set_servers.pollTrackedTheChange}` +
    ` nextInitTracked=${answers.q2_lever_set_servers.nextInitTrackedTheChange}` +
    ` (init ${answers.q2_lever_set_servers.initTurn1}->${answers.q2_lever_set_servers.initTurn2AfterChange})` +
    (answers.q2_lever_set_servers.error ? ` ERR=${answers.q2_lever_set_servers.error}` : '')
)
console.log(`Q3 poll results                : ${JSON.stringify(answers.q3_mcpServerStatus_ok_by_point)}`)
console.log(`Q3 between-turns poll ok       : ${answers.q3_between_turns_ok}`)
console.log(`Q4 broken server seen          : ${answers.q4_broken_server_seen} status=${JSON.stringify(answers.q4_broken_status_values)}`)
console.log(`Q4 broken error populated      : ${answers.q4_broken_error_populated}`)
console.log(`Q4 good server seen            : ${answers.q4_good_server_seen} status=${JSON.stringify(answers.q4_good_status_values)}`)
console.log(`Q4 broken visible on init      : ${answers.q4_broken_visible_on_init} ${JSON.stringify(answers.q4_broken_init_status)}`)
console.log(`\nfindings : ${findingsPath.pathname}`)
console.log(`raw      : ${jsonlPath}`)

process.exit(0)
