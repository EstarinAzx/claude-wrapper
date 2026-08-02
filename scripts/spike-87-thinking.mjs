// Spike #87 — does an extended-thinking block ever reach the app?
//
// Sibling to spike-81-background-tasks.mjs rather than an extension of it: #81's
// harness is a SINGLE query() driving three turns, and this spike's whole
// question is what different CONSTRUCTION-TIME options do. `thinking` and
// `maxThinkingTokens` are options, and this codebase already paid for that
// distinction once — #73's `resume` binds when the query is CONSTRUCTED and
// `ensureQuery` returns early ever after. Comparing configs across turns of one
// query would measure the first config four times and report it as four
// results. So: one fresh query per config, engine.ts's exact options plus the
// one field under test.
//
//   node --experimental-strip-types scripts/spike-87-thinking.mjs
//
// The flag lets it import the app's REAL src/main/cli-path.ts rather than a copy
// of the PATH walk — a copy could drift and quietly measure a different binary
// than the app runs.
//
// EVIDENCE SPLIT, deliberate. #81 wrote everything to a temp dir outside the
// repo and lost its answer three times; #87 asks for evidence in the repo. But a
// raw JSONL of a real turn carries session ids and file contents, and the repo
// is pushed. So the two are separated: the raw stream stays in a temp dir, and
// a SCRUBBED findings file — block-type census, message key sets, counts,
// versions, zero message text — is written into the repo at
// scripts/spike-87-findings.json. Key sets and type names are the measurement;
// the prose the model wrote is not.

import { mkdtempSync, writeFileSync, appendFileSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { query } from '@anthropic-ai/claude-agent-sdk'

const { resolveHostCli, toCliOptions } = await import('../src/main/cli-path.ts')
// Same reason cli-path.ts is imported rather than copied: the backend env must be
// the one the APP builds, not a hand-rolled approximation. Unsetting
// ANTHROPIC_BASE_URL by hand is NOT native mode — it leaves ANTHROPIC_API_KEY in
// place, so the CLI takes the gateway's key to the real endpoint and every turn
// comes back "Invalid API key". Measured that way once; the app's own
// resolveSpawnEnv strips all three WISP_KEYS and is the only correct source.
const { snapshotWispEnv, resolveSpawnEnv } = await import('../src/main/backend-mode.ts')

const runDir = mkdtempSync(join(tmpdir(), 'spike-87-'))
const jsonlPath = join(runDir, 'messages.jsonl')

// Two env knobs, and they exist for ONE job: re-running a single config against
// the OTHER backend. `ANTHROPIC_BASE_URL` is set in this project's normal shell,
// so the default run measures the wisped path — and "no thinking block arrived"
// through a proxy is a claim about the proxy until the native path has been run
// too. SPIKE87_ONLY picks one config by label, SPIKE87_OUT sends its findings to
// a second file so the control does not overwrite the full matrix.
const findingsPath = process.env['SPIKE87_OUT']
  ? new URL(`./${process.env['SPIKE87_OUT']}`, import.meta.url)
  : new URL('./spike-87-findings.json', import.meta.url)
const onlyConfig = process.env['SPIKE87_ONLY'] ?? null

// A cwd outside the repo, so the agent's own tools cannot touch the tree under
// test. Not under Downloads/* — Fable-5 refuses turns whose cwd looks sensitive,
// and a refused turn would measure nothing.
const workDir = mkdtempSync(join(tmpdir(), 'spike-87-cwd-'))
writeFileSync(join(workDir, 'README.md'), '# spike 87 scratch\n')

const t0 = Date.now()
let seq = 0
const record = (config, msg) => {
  appendFileSync(
    jsonlPath,
    JSON.stringify({ seq: seq++, ms: Date.now() - t0, config, msg }) + '\n'
  )
}

// --- Which binary. The app follows the HOST install (cli-path.ts), so a finding
// without a version line is not falsifiable later.
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

// Which backend the turn runs against. Load-bearing for #87: a gateway may strip
// or never produce thinking blocks, so a result measured through a proxy is a
// result about THAT PATH until the other one has been run too. SPIKE87_BACKEND
// forces the mode; default = whatever the launch env implies, which is what the
// app itself does (initialMode).
const wispSnapshot = snapshotWispEnv(process.env)
const backend =
  process.env['SPIKE87_BACKEND'] ?? (wispSnapshot['ANTHROPIC_BASE_URL'] ? 'wisped' : 'native')
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

// --- The census.
//
// The standing lesson from #84: an absence is only a measurement if a
// differently-named field could have been seen. So nothing here tests for the
// string "thinking". It records the TYPE and the KEY SET of every content block,
// every stream event and every message, and the report reads the census
// afterwards. A thinking block under any name, or a thinking-shaped block whose
// type is spelled differently, lands in the census either way.
const keysOf = (o) => (o && typeof o === 'object' ? Object.keys(o).sort() : [])
const bump = (map, k) => map.set(k, (map.get(k) ?? 0) + 1)

const newCensus = () => ({
  messageTypes: new Map(), // "assistant", "system:init", ...
  messageKeys: new Map(), // type -> Set of every key seen
  blockTypes: new Map(), // content-block type -> count   (assistant + user)
  blockKeys: new Map(), // block type -> Set of every key seen
  streamEventTypes: new Map(), // stream_event event.type -> count
  streamBlockTypes: new Map(), // content_block_start's content_block.type
  streamDeltaTypes: new Map(), // content_block_delta's delta.type
  streamDeltaKeys: new Map(), // delta type -> Set of keys
  systemSubtypes: new Map(),
  thinkingTokens: [], // every system/thinking_tokens, in order
  models: new Set(),
  results: [],
  // Every whole thinking-shaped block, attributed to the prompt that produced
  // it. LENGTHS ONLY — the char counts are the measurement and the prose is the
  // thing that must not enter a pushed repo. The attribution is what exercises
  // the negative path: a block on the reasoning prompt and none on the trivial
  // one is a discriminating result; the same count on both would not be.
  thinkingBlocks: [],
  turn: { index: 0, name: '(none)' }
})

const addKeys = (map, k, obj) => {
  if (!map.has(k)) map.set(k, new Set())
  const set = map.get(k)
  for (const key of keysOf(obj)) set.add(key)
}

const censusMessage = (c, msg) => {
  const type = String(msg?.type ?? '(none)')
  const subtype = typeof msg?.subtype === 'string' ? msg.subtype : null
  bump(c.messageTypes, subtype ? `${type}:${subtype}` : type)
  addKeys(c.messageKeys, type, msg)

  if (type === 'system' && subtype) {
    bump(c.systemSubtypes, subtype)
    // Q3. Recorded whole (numbers only — no text in this message shape) because
    // it is the one signal that reports thinking WITHOUT carrying its content,
    // and engine.ts would drop it: it misses every subtype branch, falls through
    // to handleTaskMessage and returns on `taskId === undefined`.
    if (subtype === 'thinking_tokens') {
      c.thinkingTokens.push({
        ms: Date.now() - t0,
        estimated_tokens: msg.estimated_tokens,
        estimated_tokens_delta: msg.estimated_tokens_delta,
        keys: keysOf(msg)
      })
    }
    if (subtype === 'init' && typeof msg.model === 'string') c.models.add(msg.model)
  }

  if (typeof msg?.message?.model === 'string') c.models.add(msg.message.model)

  // Q1. Whole content blocks on assistant and user messages — the shape
  // engine.ts:530-612 walks with a bare `for` + single `if`, no else, no default.
  const blocks = msg?.message?.content
  if (Array.isArray(blocks)) {
    for (const b of blocks) {
      const bt = String(b?.type ?? '(none)')
      bump(c.blockTypes, bt)
      addKeys(c.blockKeys, bt, b)
      if (/think/i.test(bt)) {
        c.thinkingBlocks.push({
          turn: c.turn.index,
          prompt: c.turn.name,
          type: bt,
          keys: keysOf(b),
          // The decisive numbers. A block that is present but carries zero
          // characters of thinking is a different answer from one that carries
          // text, and only the lengths distinguish them.
          thinkingChars: typeof b.thinking === 'string' ? b.thinking.length : null,
          signatureChars: typeof b.signature === 'string' ? b.signature.length : null,
          dataChars: typeof b.data === 'string' ? b.data.length : null
        })
      }
    }
  }

  // Q2. The streaming half. engine.ts:499-510 reads exactly one shape —
  // content_block_delta + delta.type === 'text_delta' — so anything else here is
  // invisible to the app today.
  if (type === 'stream_event') {
    const ev = msg.event ?? {}
    bump(c.streamEventTypes, String(ev.type ?? '(none)'))
    if (ev.type === 'content_block_start') {
      bump(c.streamBlockTypes, String(ev.content_block?.type ?? '(none)'))
      addKeys(c.blockKeys, `stream:${ev.content_block?.type}`, ev.content_block)
    }
    if (ev.type === 'content_block_delta') {
      const dt = String(ev.delta?.type ?? '(none)')
      bump(c.streamDeltaTypes, dt)
      addKeys(c.streamDeltaKeys, dt, ev.delta)
    }
  }

  if (type === 'result') {
    c.results.push({
      subtype: msg.subtype,
      // A TRAP, measured the hard way: the native control came back
      // `subtype: 'success'` on both turns while every one of them was the
      // synthetic text "Invalid API key". `is_error` is the field that says so.
      // Without it a config that never reached a model reports a clean zero
      // thinking blocks and reads exactly like a real negative.
      is_error: msg.is_error === true,
      // usage is the independent check on Q1: a model can think without the
      // text reaching us, and a nonzero thinking/reasoning token count in the
      // billing record proves thinking HAPPENED even when no block arrived.
      usage: msg.usage ?? null,
      usageKeys: keysOf(msg.usage)
    })
  }
}

// --- Run one config: a fresh query, engine.ts's options plus the field under
// test, then the given prompts in order.
const runConfig = async (label, extraOptions, prompts, timeoutMs = 180_000) => {
  if (onlyConfig && label !== onlyConfig) {
    return { label, options: extraOptions, skipped: `SPIKE87_ONLY=${onlyConfig}`, ...newCensus() }
  }
  console.log(`\n=== config "${label}" :: ${JSON.stringify(extraOptions)}`)
  const c = newCensus()
  c.label = label
  c.options = extraOptions
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
        if (msg.type === 'result') {
          console.log(`  == result: ${msg.subtype}`)
          finishTurn()
        }
      }
    } catch (err) {
      c.error = `stream threw: ${err?.message ?? err}`
      console.log(`  !! ${c.error}`)
      finishTurn()
    }
  })()

  for (const [i, { name, text }] of prompts.entries()) {
    console.log(`  -- turn "${name}"`)
    c.turn = { index: i, name }
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
  }

  // A trailing thinking_tokens or block could land after result — #81 timed a
  // level 3.3s after result/success, so a hard cut here would repeat that bug.
  await sleep(3000)
  q.close?.()
  queue.end()
  await Promise.race([consume, sleep(5000)])
  return c
}

// --- The prompts.
//
// EXERCISE THE NEGATIVE PATH — the #27/#81 trap. A turn that does no thinking
// cannot distinguish "thinking blocks never arrive" from "there was nothing to
// think about", so every config runs both: one prompt that should induce
// extended reasoning, and a trivial control. Neither uses tools: a tool call
// would add tool_use blocks to the census for reasons unrelated to thinking.
const PROMPTS = [
  {
    name: 'reasoning',
    text:
      'Think this through carefully before answering. Three switches outside a windowless room control three bulbs inside it. You may flip switches freely, then enter the room exactly once. How do you determine which switch controls which bulb, and why does your method work? Answer in under 100 words.'
  },
  { name: 'control', text: 'Reply with exactly the word: ok' }
]

const configs = []

// Config 1 — the app's ACTUAL configuration. engine.ts passes neither `thinking`
// nor `maxThinkingTokens` (engine.ts:668-682), so this is the only config whose
// result is directly a fact about the shipped app. Everything after it is about
// what the app COULD see if it asked.
configs.push(await runConfig('control-app-options', {}, PROMPTS))

// Config 2 — Q4, the deprecated knob named in the ticket.
configs.push(await runConfig('maxThinkingTokens', { maxThinkingTokens: 8000 }, PROMPTS))

// Config 3 — the modern replacement, which takes precedence over config 2's
// field and is what a real feature would set. `adaptive` is the SDK's stated
// default for models that support it, so this also probes whether the default
// is already on and merely invisible.
configs.push(await runConfig('thinking-adaptive', { thinking: { type: 'adaptive' } }, PROMPTS))

// Config 4 — the confound the ticket's four questions do not name. ThinkingConfig
// carries `display?: 'summarized' | 'omitted'` (sdk.d.ts:6916,6938), and the CLI
// takes a matching --thinking-display flag. If display defaults to omitted, then
// "no block arrived" is a statement about the DISPLAY MODE, not about whether
// the app can ever see thinking — and every config above would be a false
// negative. Asking for it explicitly is what makes the negative falsifiable.
configs.push(
  await runConfig('thinking-adaptive-summarized', { thinking: { type: 'adaptive', display: 'summarized' } }, PROMPTS)
)

// Config 5 — Q2's second half, and it is run CONDITIONALLY. Whether
// includePartialMessages changes the delivery only means anything if something
// was delivered; with nothing arriving anywhere above, this config would burn a
// turn to report the same zero. Skipping it is recorded as a skip, not as a
// measurement.
const sawAnyThinking = configs.some(
  (c) =>
    [...c.blockTypes.keys()].some((t) => /think/i.test(t)) ||
    [...c.streamBlockTypes.keys()].some((t) => /think/i.test(t)) ||
    [...c.streamDeltaTypes.keys()].some((t) => /think/i.test(t)) ||
    c.thinkingTokens.length > 0
)
if (sawAnyThinking) {
  configs.push(
    await runConfig(
      'no-partial-messages',
      { thinking: { type: 'adaptive', display: 'summarized' }, includePartialMessages: false },
      PROMPTS
    )
  )
} else {
  configs.push({
    label: 'no-partial-messages',
    skipped: 'no thinking evidence in any prior config — nothing whose delivery mode could differ',
    ...newCensus()
  })
}

// --- Report.
const mapObj = (m) => Object.fromEntries([...m].sort(([a], [b]) => (a < b ? -1 : 1)))
const setMapObj = (m) =>
  Object.fromEntries([...m].sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, v]) => [k, [...v].sort()]))

const thinkingIn = (c) => ({
  wholeBlocks: [...c.blockTypes.keys()].filter((t) => /think/i.test(t)),
  streamBlocks: [...c.streamBlockTypes.keys()].filter((t) => /think/i.test(t)),
  streamDeltas: [...c.streamDeltaTypes.keys()].filter((t) => /think/i.test(t)),
  thinkingTokenMessages: c.thinkingTokens.length
})

const perConfig = configs.map((c) => ({
  label: c.label,
  options: c.options ?? null,
  skipped: c.skipped ?? null,
  error: c.error ?? null,
  models: [...(c.models ?? [])].sort(),
  messageTypes: mapObj(c.messageTypes),
  messageKeys: setMapObj(c.messageKeys),
  blockTypes: mapObj(c.blockTypes),
  blockKeys: setMapObj(c.blockKeys),
  streamEventTypes: mapObj(c.streamEventTypes),
  streamBlockTypes: mapObj(c.streamBlockTypes),
  streamDeltaTypes: mapObj(c.streamDeltaTypes),
  streamDeltaKeys: setMapObj(c.streamDeltaKeys),
  systemSubtypes: mapObj(c.systemSubtypes),
  thinkingTokens: c.thinkingTokens,
  thinkingBlocks: c.thinkingBlocks,
  results: c.results,
  // Any errored turn makes this config's zero uninterpretable — see is_error above.
  erroredTurns: (c.results ?? []).filter((r) => r.is_error).length,
  thinking: thinkingIn(c)
}))

const answers = {
  q1_whole_or_any_thinking_block: perConfig.some(
    (c) => c.thinking.wholeBlocks.length > 0 || c.thinking.streamBlocks.length > 0
  ),
  q1_in_app_config_only: perConfig[0].thinking.wholeBlocks.length > 0 || perConfig[0].thinking.streamBlocks.length > 0,
  q2_delta_types_seen: [...new Set(perConfig.flatMap((c) => c.thinking.streamDeltas))],
  // The answer the four questions did not think to ask. A block that ARRIVES and
  // a block that arrives with TEXT are different facts, and only the second one
  // could be rendered as a strip.
  q1b_max_thinking_text_chars: Math.max(
    0,
    ...perConfig.flatMap((c) => c.thinkingBlocks.map((b) => b.thinkingChars ?? 0))
  ),
  // Discrimination check: blocks must appear on the reasoning prompt and NOT on
  // the trivial one, or the result says nothing about thinking.
  q1c_blocks_by_prompt: Object.fromEntries(
    ['reasoning', 'control'].map((p) => [
      p,
      perConfig.reduce((n, c) => n + c.thinkingBlocks.filter((b) => b.prompt === p).length, 0)
    ])
  ),
  q3_thinking_tokens_message: perConfig.some((c) => c.thinking.thinkingTokenMessages > 0),
  q4_config_changed_anything:
    JSON.stringify(perConfig[0].thinking) !== JSON.stringify(perConfig[1].thinking) ||
    JSON.stringify(perConfig[0].thinking) !== JSON.stringify(perConfig[2].thinking) ||
    JSON.stringify(perConfig[0].thinking) !== JSON.stringify(perConfig[3].thinking)
}

const findings = {
  spike: 87,
  cli: hostCli,
  cliVersion,
  sdkVersion,
  backend,
  rawJsonl: jsonlPath,
  messages: seq,
  answers,
  configs: perConfig
}
writeFileSync(findingsPath, JSON.stringify(findings, null, 2) + '\n')

console.log('\n--- #87 findings ---')
for (const c of perConfig) {
  if (c.skipped) {
    console.log(`${c.label.padEnd(30)} SKIPPED — ${c.skipped}`)
    continue
  }
  console.log(
    `${c.label.padEnd(30)} models=${c.models.join(',') || '(none)'}` +
      ` blocks=[${Object.keys(c.blockTypes).join(',')}]` +
      ` streamBlocks=[${Object.keys(c.streamBlockTypes).join(',')}]` +
      ` deltas=[${Object.keys(c.streamDeltaTypes).join(',')}]` +
      ` thinking_tokens=${c.thinking.thinkingTokenMessages}` +
      (c.erroredTurns ? `  !! ${c.erroredTurns} ERRORED TURN(S) — this config measured nothing` : '') +
      (c.error ? ` ERROR=${c.error}` : '')
  )
}
console.log('')
console.log(`Q1 any thinking block anywhere : ${answers.q1_whole_or_any_thinking_block}`)
console.log(`Q1 under the APP's own options : ${answers.q1_in_app_config_only}`)
console.log(`Q1 max thinking TEXT chars     : ${answers.q1b_max_thinking_text_chars}`)
console.log(`Q1 blocks by prompt            : ${JSON.stringify(answers.q1c_blocks_by_prompt)}`)
console.log(`Q2 thinking delta types        : ${answers.q2_delta_types_seen.join(', ') || '(none)'}`)
console.log(`Q3 system/thinking_tokens      : ${answers.q3_thinking_tokens_message}`)
console.log(`Q4 config changed the answer   : ${answers.q4_config_changed_anything}`)
console.log(`\nfindings : ${findingsPath.pathname}`)
console.log(`raw      : ${jsonlPath}`)

process.exit(0)
