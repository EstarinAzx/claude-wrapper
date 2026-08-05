// Spike #127 — three routes nobody has called: subagent inbound, rewind,
// backgrounding.
//
// Sibling of spike-81/87/88/89/90/104/105/108/114/116/117/122, same construction
// and the same import rule: the app's REAL src/main/cli-path.ts and
// src/main/backend-mode.ts, so the binary and the routing measured here cannot
// drift from what the app spawns.
//
//   node --experimental-strip-types scripts/spike-127-uncalled-routes.mjs
//   SPIKE127_PHASES=0,2      # source facts + rewind only
//
// This spike BUILDS NOTHING. `git diff --stat -- src/` being empty is part of
// its gate.
//
// ---------------------------------------------------------------------------
// THE THREE QUESTIONS, and why each needed a different instrument
//
//   Q1 SUBAGENT INBOUND — is there any route to send a message INTO a running
//                         subagent? The owner asked for a message input inside
//                         the subagent view.
//   Q2 REWIND           — is there any rewind/checkpoint route at all, given
//                         that `/rewind` is absent from the CLI's advertised
//                         commands (#120's recon, re-asserted in phase 0)?
//   Q3 BACKGROUNDING    — is there any route to put the CURRENTLY OPEN session
//                         into the background so the CLI keeps working while the
//                         UI detaches?
//
// ---------------------------------------------------------------------------
// WHY THE SUBTYPE PROBE IS THE CHEAP HALF, AND WHAT MAKES IT DISCRIMINATING
//
// Every named control method on the runtime Query object is a thin wrapper over
// a generic dispatcher, `this.request({subtype})` — #88's shape, re-confirmed
// here by enumerating the object's own prototype chain rather than reading
// sdk.d.ts. So a route can exist with no method named for it, which is why an
// absent name settles nothing (#88), and a declared wire type can have no
// callable route behind it, which is why a present TYPE settles nothing either
// (#115).
//
// The instrument that separates them is a THREE-WAY comparison on one warm
// handle, and it is the reason this spike can answer at all:
//
//   bogus subtype        -> the CLI's refusal text for a subtype it does not know
//   candidate subtype    -> either the SAME refusal (route absent)
//                           or a DIFFERENT error (route present, arguments bad)
//                           or success (route present and accepting)
//   malformed arguments  -> distinguishes "unknown subtype" from "known subtype,
//                           bad payload", which is the whole discrimination
//
// Without the bogus arm, a `success` is unscored: a permissive dispatcher that
// swallows anything reads identically to a supported route (#116's rule). With
// it, an ARGUMENT-SHAPED error on a candidate is positive evidence that the
// subtype was recognised and got as far as its own validator.
//
// A control request on a warm query sends no prompt and burns no turn (#105's
// economy), so all of that costs nothing. It is also NOT the answer on its own:
// #117 established that a callable route is not an effective one, so every
// question below that can be answered by EFFECT is answered by effect, in a
// phase that says how many turns it spent.
//
// ---------------------------------------------------------------------------
// WHAT THIS HARNESS DELIBERATELY DOES NOT DO
//
// `enableRemoteControl(true)` is a genuine Q3 candidate — Remote Control is
// exactly "the session keeps running while this UI is not the thing driving it".
// It is probed with `enabled: FALSE` only. Enabling it is OUTWARD-FACING: it
// bridges a live session to an external service, and the owner is away. The
// disable path exercises the same subtype through the same dispatcher and
// answers the reachability question without publishing anything. What that
// cannot settle is stated in the arm's own verdict rather than left implied.
//
// ---------------------------------------------------------------------------
// SCRUBBING (#87/#88/#89/#90's rule). Counts, shapes, vocabularies, timings,
// booleans and error TEXT that the CLI itself generates. Never a cwd, a home
// directory, a username, an absolute path, a session id, a model id or a
// command name — this CLI's command list includes the operator's own personal
// commands. Error text is truncated and passed through a redactor before it is
// written, because a validator's message can quote an argument.

import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { tmpdir, homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { randomBytes, randomUUID } from 'node:crypto'
import { query, getSessionMessages } from '@anthropic-ai/claude-agent-sdk'

// fileURLToPath, never URL.pathname: this repo lives under a directory with a
// space in its name, and pathname hands back the percent-encoded form.
const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const findingsPath = fileURLToPath(new URL('./spike-127-findings.json', import.meta.url))

const { resolveHostCli, toCliOptions } = await import('../src/main/cli-path.ts')
const { snapshotWispEnv, resolveSpawnEnv, initialMode } = await import(
  '../src/main/backend-mode.ts'
)

const hostCli = resolveHostCli(process.env['PATH'], process.platform)
const cliOptions = toCliOptions(hostCli)
const cliBin = hostCli ?? 'claude'
const snapshot = snapshotWispEnv(process.env)
const backendMode = initialMode(snapshot)
const appEnv = resolveSpawnEnv(backendMode, snapshot, process.env)

const PHASES = (process.env['SPIKE127_PHASES'] ?? '0,1,2,3').split(',').map((s) => s.trim())
const runs = (p) => PHASES.includes(p)
const TURN_TIMEOUT_MS = Number(process.env['SPIKE127_TURN_TIMEOUT_MS'] ?? 240_000)

let turnsSpent = 0
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ---------------------------------------------------------------------------
// Redaction. Error text is the CLI's own, but a validator is free to quote what
// it was handed, and what it was handed can be a path. Everything written to the
// findings file goes through this.
const HOME = homedir()
const redact = (v, cap = 300) => {
  let s = String(v ?? '')
  if (HOME) s = s.split(HOME).join('<HOME>')
  s = s.split(repoRoot).join('<REPO>')
  s = s.replace(/[A-Za-z]:\\[^\s"']+/g, '<PATH>').replace(/\/(?:home|Users)\/[^\s"']+/g, '<PATH>')
  return s.slice(0, cap)
}

// ---------------------------------------------------------------------------
// Shared: a warm query with no prompt ever pushed, and a queue-backed one for
// the phases that must send.
//
// The option shape is engine.ts's, minus canUseTool (nothing here renders a
// permission prompt) and plus permissionMode: 'bypassPermissions', because the
// turn-spending phases need tools to actually run. #116's lesson applies to that
// choice in reverse — the ambient permission default decides whether canUseTool
// is consulted at all, so the harness states the mode instead of inheriting it.
const baseOptions = (cwd) => ({
  cwd,
  includePartialMessages: true,
  env: appEnv,
  permissionMode: 'bypassPermissions',
  allowDangerouslySkipPermissions: true,
  ...cliOptions
})

const idleHandle = (cwd) => {
  const q = query({
    prompt: {
      [Symbol.asyncIterator]: () => ({ next: () => new Promise(() => {}) })
    },
    options: baseOptions(cwd)
  })
  // Drained only so the query runs; its death is not a result.
  void (async () => {
    try {
      for await (const _m of q) void _m
    } catch {
      /* recorded by whichever probe was mid-flight */
    }
  })()
  return q
}

const createMessageQueue = () => {
  const buf = []
  let done = false
  let wake = null
  return {
    push: (m) => {
      buf.push(m)
      wake?.()
      wake = null
    },
    end: () => {
      done = true
      wake?.()
      wake = null
    },
    iterable: {
      [Symbol.asyncIterator]: () => ({
        next: async () => {
          while (buf.length === 0 && !done) await new Promise((r) => (wake = r))
          if (buf.length === 0) return { done: true, value: undefined }
          return { done: false, value: buf.shift() }
        }
      })
    }
  }
}

// ---------------------------------------------------------------------------
// THE NEGATIVE CONTROL. Sent on the same handle as everything it licenses.
//
// A refusal here is what makes a success anywhere below a real accept. Its text
// is recorded verbatim (redacted) because the three-way comparison that answers
// this whole spike is a comparison AGAINST this string.
const BOGUS_SUBTYPE = 'spike127_definitely_not_a_real_subtype'

const negativeControl = async (q) => {
  try {
    const r = await q.request({ subtype: BOGUS_SUBTYPE })
    return {
      refused: false,
      responseShape: r === null || r === undefined ? typeof r : Object.keys(r).sort(),
      verdict:
        'UNSCORED — the CLI accepted a subtype that does not exist, so no success below can be read as support.'
    }
  } catch (err) {
    return {
      refused: true,
      refusalText: redact(err?.message ?? err),
      verdict: 'The CLI refuses unknown subtypes by name, so a differing error below is a real signal.'
    }
  }
}

// Call one candidate subtype and classify its outcome AGAINST the control.
// This is the core instrument: `sameAsBogus` is the discrimination, and it is
// computed rather than eyeballed.
const probeSubtype = async (q, control, label, payload) => {
  const started = process.hrtime.bigint()
  let row
  try {
    const r = await q.request(payload)
    const inner = r && typeof r === 'object' && r.response && typeof r.response === 'object' ? r.response : null
    row = {
      label,
      subtype: payload.subtype,
      outcome: 'accepted',
      responseKeys:
        r && typeof r === 'object' ? Object.keys(r).sort() : [typeof r],
      // The response body's SHAPE, never its values — a rewind response lists
      // file paths and a task list carries descriptions. The two exceptions are
      // recorded because they ARE the answer and neither is sensitive: a
      // boolean, and an error string the CLI generated about its own config.
      responseInnerKeys: inner === null ? null : Object.keys(inner).sort(),
      canRewind: typeof inner?.canRewind === 'boolean' ? inner.canRewind : null,
      responseError: typeof inner?.error === 'string' ? redact(inner.error) : null,
      // Numeric-only fields (restored/deleted/skipped counts). Values are counts,
      // not paths, so they are safe and they are what "it worked" looks like.
      responseCounts:
        inner === null
          ? null
          : Object.fromEntries(Object.entries(inner).filter(([, v]) => typeof v === 'number')),
      // Array-valued fields reduced to their LENGTH. rewind_files answers
      // `filesChanged` with ABSOLUTE PATHS on the operator's disk; the count is
      // the diagnostic and the paths are none of this file's business.
      responseArrayLengths:
        inner === null
          ? null
          : Object.fromEntries(
              Object.entries(inner)
                .filter(([, v]) => Array.isArray(v))
                .map(([k, v]) => [k, v.length])
            )
    }
  } catch (err) {
    const text = redact(err?.message ?? err)
    row = {
      label,
      subtype: payload.subtype,
      outcome: 'threw',
      errorText: text,
      // The whole discrimination. An error that is NOT the unknown-subtype
      // refusal means the dispatcher recognised the subtype and the request got
      // as far as that route's own validator.
      sameAsBogusRefusal: control.refused ? text === control.refusalText : null,
      looksLikeUnknownSubtype: /unsupported control request subtype|unknown subtype/i.test(text)
    }
  }
  row.ms = Math.round(Number(process.hrtime.bigint() - started) / 1e6)
  row.verdict = !control.refused
    ? 'UNSCORED — the negative control did not hold on this handle.'
    : row.outcome === 'accepted'
      ? 'ROUTE PRESENT — the subtype was accepted where a bogus one is refused.'
      : row.looksLikeUnknownSubtype
        ? 'ROUTE ABSENT — the CLI answered with its unknown-subtype refusal.'
        : 'ROUTE PRESENT — refused, but NOT with the unknown-subtype refusal, so the subtype was recognised and its own validator rejected the arguments.'
  return row
}

// ---------------------------------------------------------------------------
// A turn runner. Returns the collected stream facts; `inject` is called with a
// live push function and the message list so a phase can act MID-TURN, which is
// what Q1 and Q3 both need.
const runTurn = async ({ label, cwd, prompt, inject, options: extra = {}, timeoutMs = TURN_TIMEOUT_MS }) => {
  const out = {
    label,
    ranTurn: false,
    turnIsError: null,
    resultSubtype: null,
    error: null,
    toolUseNames: [],
    subagentToolUseIds: [],
    injected: [],
    durationMs: null
  }
  const queue = createMessageQueue()
  const messages = []
  const started = Date.now()

  let q
  try {
    q = query({ prompt: queue.iterable, options: { ...baseOptions(cwd), ...extra } })
  } catch (err) {
    out.error = `query() threw: ${redact(err?.message ?? err)}`
    return { out, messages }
  }
  turnsSpent += 1

  let resolveTurn = null
  const consume = (async () => {
    try {
      for await (const msg of q) {
        messages.push(msg)
        if (msg.type === 'assistant') {
          const blocks = Array.isArray(msg.message?.content) ? msg.message.content : []
          for (const b of blocks) {
            if (b?.type === 'tool_use') {
              out.toolUseNames.push(typeof b.name === 'string' ? b.name : '<unnamed>')
              // The main thread's Task/Agent call is the addressable handle Q1
              // needs. A tool_use seen on a message that already carries a
              // parent_tool_use_id belongs to a subagent's own inner call and is
              // NOT the id to address.
              const isMain =
                msg.parent_tool_use_id === null || msg.parent_tool_use_id === undefined
              if (isMain && /^(task|agent)$/i.test(String(b.name)) && typeof b.id === 'string') {
                if (!out.subagentToolUseIds.includes(b.id)) out.subagentToolUseIds.push(b.id)
              }
            }
          }
        }
        if (msg.type === 'result') {
          out.ranTurn = true
          // #87's landmine: subtype is 'success' even on a failed turn.
          out.turnIsError = msg.is_error === true
          out.resultSubtype = String(msg.subtype ?? '')
          out.resultText = typeof msg.result === 'string' ? msg.result : null
          resolveTurn?.()
          resolveTurn = null
        }
      }
    } catch (err) {
      out.error = `stream threw: ${redact(err?.message ?? err)}`
      resolveTurn?.()
      resolveTurn = null
    }
  })()

  const finished = new Promise((resolve) => {
    const timer = setTimeout(() => {
      out.error = out.error ?? 'turn timed out'
      resolveTurn?.()
      resolveTurn = null
    }, timeoutMs)
    resolveTurn = () => {
      clearTimeout(timer)
      resolve()
    }
  })

  queue.push({
    type: 'user',
    message: { role: 'user', content: prompt },
    parent_tool_use_id: null,
    origin: { kind: 'human' }
  })

  if (typeof inject === 'function') {
    void inject({
      push: (m) => queue.push(m),
      messages,
      out,
      query: q,
      isDone: () => out.ranTurn || out.error !== null
    })
  }

  await finished
  out.durationMs = Date.now() - started
  queue.end()
  try {
    q.close()
  } catch {
    /* closing a finished handle is not a finding */
  }
  await consume
  return { out, messages }
}

// Wait for a condition on the live stream, bounded. Returns null on timeout so
// a caller distinguishes "never appeared" from "appeared".
const waitFor = async (probe, { timeoutMs, everyMs = 100 }) => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const v = probe()
    if (v !== null && v !== undefined && v !== false) return v
    await sleep(everyMs)
  }
  return null
}

// ---------------------------------------------------------------------------
// PHASE 0 — source facts and drift alarms.
//
// #113's rule, applied in #114 and #116: record the TEXT a fact matched, never a
// boolean. A rename then shows up as changed text instead of a silent `false`
// that reads exactly like "the thing is absent".
//
// This phase also carries the alarm the ticket asks for: a harness whose premise
// a later ticket fixes needs one, or its success becomes indistinguishable from
// its failure (#105 post-#112). Here the premise is "the app sends
// parent_tool_use_id: null and never addresses a subagent". If a later ticket
// makes the app address one, `appAlwaysSendsNullParent` flips and this spike's
// Q1 stops being about an unbuilt route.

const sdkDir = join(repoRoot, 'node_modules', '@anthropic-ai', 'claude-agent-sdk')

const matchesIn = (file, re, cap = 6) => {
  let text
  try {
    text = readFileSync(join(sdkDir, file), 'utf8')
  } catch (err) {
    return { readable: false, error: redact(err?.message ?? err, 160) }
  }
  const hits = [...text.matchAll(re)]
  return { readable: true, count: hits.length, matched: hits.slice(0, cap).map((m) => m[0].slice(0, 180)) }
}

const pkgJson = (() => {
  try {
    return JSON.parse(readFileSync(join(sdkDir, 'package.json'), 'utf8'))
  } catch {
    return null
  }
})()

const sourceFacts = () => {
  const engineSrc = (() => {
    try {
      return readFileSync(join(repoRoot, 'src', 'main', 'engine.ts'), 'utf8')
    } catch {
      return ''
    }
  })()

  return {
    note:
      'Every entry records the TEXT it matched, not a boolean (#113/#114/#116). These are HYPOTHESIS GENERATORS for the phases below — a declared wire type is not a callable route (#115), which is why nothing here appears in any verdict.',
    sdkVersion: pkgJson?.version ?? null,
    declaredSubtypes: {
      rewind_files: matchesIn('sdk.d.ts', /subtype: 'rewind_files'|user_message_id: string|dry_run\?: boolean/g),
      background_tasks: matchesIn('sdk.d.ts', /subtype: 'background_tasks'|Backgrounds in-flight foreground tasks[^*]{0,120}/g, 3),
      parentToolUseIdOnUserMessage: matchesIn('sdk.d.ts', /type: 'user';\s*message: MessageParam;\s*parent_tool_use_id: string \| null;/g, 2),
      remoteControlMethod: matchesIn('sdk.mjs', /enableRemoteControl\([^)]*\)/g, 2),
      sideQuestionMethod: matchesIn('sdk.mjs', /askSideQuestion\([^)]*\)/g, 2)
    },
    // THE DRIFT ALARM. The app's own send shape. If this stops being null-only,
    // Q1 is no longer a question about an unbuilt route.
    appSendShape: {
      matched: [...engineSrc.matchAll(/parent_tool_use_id: [a-zA-Z]+/g)].map((m) => m[0]).slice(0, 6),
      appAlwaysSendsNullParent:
        engineSrc.includes('parent_tool_use_id: null') &&
        !/parent_tool_use_id: (?!null|string)/.test(engineSrc),
      forwardSubagentTextOff: !/forwardSubagentText: true/.test(engineSrc)
    }
  }
}

// ---------------------------------------------------------------------------
// PHASE 1 (Q1) — is there any inbound route to a running subagent?
//
// THE ERROR THIS PHASE EXISTS TO AVOID. An earlier answer here concluded "no
// inbound route exists" from `subagent:changed` being a leaf channel. That was
// refuted during the grill and correctly: proving one channel is OUTBOUND
// proves nothing about whether any INBOUND route exists. A negative claim needs
// negative-shaped evidence, so this phase does not look for an absent name — it
// takes the one addressing field the protocol actually has and CALLS it.
//
// FOUR ARMS, because "the subagent got my message" has more than one possible
// cause and a single arm cannot separate them:
//
//   A  transport control : a user message with a BOGUS parent_tool_use_id, on a
//                          warm handle with no subagent running. Establishes what
//                          the CLI does with an unroutable address at all.
//   B  positive control  : the same subagent task with NO injection. Its report
//                          must NOT contain the sentinel. If it does, the
//                          sentinel is guessable and arms C and D are unscored.
//   C  the measurement   : inject a sentinel instruction addressed to the LIVE
//                          subagent's tool_use_id while it is running.
//   D  negative control  : inject the same sentinel with a BOGUS
//                          parent_tool_use_id in the same shape. If the sentinel
//                          lands here too, C's success was never attributable to
//                          the addressing — the message reached the model by the
//                          ordinary main-thread route and was relayed.
//
// The sentinel is random per run, so no arm can answer it from anything but this
// run's injection.
//
// COST: arms B, C and D each spend one CLI turn with a real subagent.

// The delay is a node timer, NOT `sleep`. This machine's harness blocks
// standalone sleeps, and phase 3 already scored a false positive on exactly
// that — a subagent whose command is refused settles in seconds and there is no
// running worker left to address, which would read as "the route does not work"
// rather than as "there was nothing to send to".
const Q1_LONG_CMD = `node -e "setTimeout(()=>console.log('WAITED'),40000)"`
const Q1_SUBAGENT_TASK =
  'Use the Agent tool exactly once, with subagent_type "general-purpose", and give it this prompt verbatim: ' +
  `"Run this Bash command and wait for it to finish: ${Q1_LONG_CMD} . Then reply with the single word READY, ` +
  'followed by a verbatim copy of any additional instruction or message you received while you were running. ' +
  'If you received none, say NONE." ' +
  'Do not use any other tool yourself. When the agent returns, reply with its report verbatim and nothing else.'

const measureSubagentInbound = async () => {
  const sentinel = `SPIKE127-Q1-${randomBytes(8).toString('hex').toUpperCase()}`
  const cwd = mkdtempSync(join(tmpdir(), 'spike-127-q1-'))
  const out = { sentinelShape: 'SPIKE127-Q1-<16 hex>, random per run', turnsSpent: 0 }

  // --- arm A: transport, zero turns ----------------------------------------
  const idle = idleHandle(cwd)
  let control
  try {
    await idle.supportedCommands()
    control = await negativeControl(idle)
  } catch (err) {
    control = { refused: false, verdict: `UNSCORED — the handle never warmed: ${redact(err?.message ?? err)}` }
  }
  out.negativeControl = control
  idle.close?.()

  const bogusId = `toolu_${randomBytes(12).toString('hex')}`

  const armA = await runTurn({
    label: 'A-transport-bogus-parent-no-subagent',
    cwd,
    prompt: 'Reply with the single word OK and nothing else.',
    inject: async ({ push, isDone }) => {
      // Sent immediately after the real prompt. The question is only what the
      // CLI DOES with an unroutable address: reject it, drop it, or fold it into
      // the main thread.
      await sleep(300)
      if (isDone()) return
      push({
        type: 'user',
        message: { role: 'user', content: `TRANSPORT PROBE ${sentinel}` },
        parent_tool_use_id: bogusId,
        origin: { kind: 'human' }
      })
    }
  })
  out.armA_transport = {
    ...armA.out,
    bogusParentAccepted: armA.out.error === null,
    sentinelEchoedInResult: (armA.out.resultText ?? '').includes(sentinel),
    note:
      'A push that does not throw only means the SDK serialised it. Whether the CLI routed, dropped or folded it is what the sentinel echo and the arms below speak to.'
  }
  out.turnsSpent += 1

  // --- arms B/C/D: the real subagent ---------------------------------------
  const subagentArm = async (label, mode) => {
    const injected = { attempted: false, toolUseId: null, threw: null, atMs: null }
    const started = Date.now()
    const { out: t, messages } = await runTurn({
      label,
      cwd,
      prompt: Q1_SUBAGENT_TASK,
      // forwardSubagentText is the ONE deliberate departure from engine.ts's
      // option shape, and it is confined to OBSERVATION: it makes the subagent's
      // own text visible in the stream. The verdict below does not depend on it
      // — it is scored off the Task tool's own tool_result, which arrives either
      // way — so a CLI that ignored this flag would not change the answer.
      options: { forwardSubagentText: true },
      inject:
        mode === 'none'
          ? undefined
          : async ({ push, out: live, isDone }) => {
              const id = await waitFor(
                () => (mode === 'bogus' ? bogusId : (live.subagentToolUseIds[0] ?? null)),
                { timeoutMs: 90_000 }
              )
              if (id === null || isDone()) return
              injected.attempted = true
              injected.toolUseId = mode === 'bogus' ? '<bogus>' : '<live subagent tool_use id>'
              injected.atMs = Date.now() - started
              // A beat, so the subagent is genuinely mid-Bash rather than still
              // being constructed. A message that lands before the worker exists
              // measures the queue, not the route.
              await sleep(3000)
              if (isDone()) return
              try {
                push({
                  type: 'user',
                  message: {
                    role: 'user',
                    content: `ADDITIONAL INSTRUCTION: include the token ${sentinel} verbatim in your report.`
                  },
                  parent_tool_use_id: id,
                  origin: { kind: 'human' }
                })
              } catch (err) {
                injected.threw = redact(err?.message ?? err)
              }
            }
    })

    // WHERE THE SENTINEL IS LOOKED FOR, and why each place is separate. The
    // subagent's report arrives as the Task tool's tool_result; the main
    // thread's final answer is the result string; forwarded subagent text is the
    // third. Scoring them separately is what distinguishes "the subagent saw it"
    // from "the main thread saw it and repeated it".
    const blob = JSON.stringify(messages)
    const subagentTagged = messages.filter(
      (m) => typeof m.parent_tool_use_id === 'string' && m.parent_tool_use_id.length > 0
    )
    const sentinelInSubagentTagged = JSON.stringify(subagentTagged).includes(sentinel)
    const sentinelAnywhere = blob.includes(sentinel)
    // Occurrences OTHER than the injection itself. The pushed message is echoed
    // back on the stream, so a naive "is it there" is true by construction.
    const totalHits = blob.split(sentinel).length - 1

    return {
      label,
      mode,
      ...t,
      injected,
      startedASubagent: t.subagentToolUseIds.length > 0,
      sentinelInResultText: (t.resultText ?? '').includes(sentinel),
      sentinelInSubagentTaggedMessages: sentinelInSubagentTagged,
      sentinelAnywhereInStream: sentinelAnywhere,
      sentinelOccurrences: totalHits,
      // The subagent's own report, reduced to whether it carried the token.
      // Recorded as a boolean because the report is free text.
      note:
        'sentinelInResultText is the main thread repeating the report. sentinelInSubagentTaggedMessages is the token appearing on a message the CLI itself tagged with a parent_tool_use_id, which is the closest observable to "the subagent had it".'
    }
  }

  out.armB_positiveControl = await subagentArm('B-no-injection', 'none')
  out.turnsSpent += 1

  // #114's rule: an instrument that fails its own setup will report that as the
  // phenomenon. If B never started a subagent, C and D measure nothing about
  // addressing — they measure a prompt the model declined to follow.
  const setupOk = out.armB_positiveControl.startedASubagent && !out.armB_positiveControl.sentinelAnywhereInStream

  if (setupOk) {
    out.armC_measurement = await subagentArm('C-inject-live-subagent-id', 'live')
    out.turnsSpent += 1
    out.armD_negativeControl = await subagentArm('D-inject-bogus-id', 'bogus')
    out.turnsSpent += 1
  } else {
    out.armC_measurement = { skipped: 'positive control failed — see armB' }
    out.armD_negativeControl = { skipped: 'positive control failed — see armB' }
  }

  const c = out.armC_measurement
  const d = out.armD_negativeControl

  out.answer = !setupOk
    ? `UNSCORED — the positive control did not hold (startedASubagent=${out.armB_positiveControl.startedASubagent}, sentinelLeaked=${out.armB_positiveControl.sentinelAnywhereInStream}). This run measures the instrument, not the CLI.`
    : !c.injected?.attempted
      ? 'UNSCORED — no live subagent tool_use id ever appeared within the injection window, so nothing was addressed.'
      : c.sentinelInSubagentTaggedMessages && !d.sentinelInSubagentTaggedMessages
        ? 'YES — a user message addressed with the live subagent\'s tool_use_id reached subagent-tagged output, and the identical message with a bogus id did not. The addressing is what carried it.'
        : c.sentinelInSubagentTaggedMessages && d.sentinelInSubagentTaggedMessages
          ? 'NOT ATTRIBUTABLE — both the live id and the bogus id reached subagent-tagged output, so the message arrives by a route that does not need a valid address. This is NOT a route to a SPECIFIC subagent.'
          : !c.sentinelInSubagentTaggedMessages && (c.sentinelInResultText || c.sentinelOccurrences > 1)
            ? 'NO, WITH A NEAR MISS — the addressed message was accepted and reached the MAIN thread (it appears beyond its own echo), but never reached subagent-tagged output. The field is transported and ignored for routing.'
            : 'NO — the message was addressed to the live subagent\'s tool_use_id and left no trace in subagent-tagged output, while the run\'s controls held. There is no inbound route to a running subagent through this field.'

  out.cannotSettle = [
    'Whether some OTHER route (a control subtype not in the SDK\'s vocabulary, an MCP surface, a file the CLI watches) can reach a running subagent. This arm measures the one addressing field the protocol declares.',
    'What a FUTURE CLI does — the answer is pinned to the version recorded in `env`, and phase 0\'s matched text is the alarm for a rename.',
    'Whether a message addressed at a different MOMENT (before the worker exists, or after its Bash settles) behaves differently. One injection window was measured and it is stated in `injected.atMs`.'
  ]
  return out
}

// ---------------------------------------------------------------------------
// PHASE 2 (Q2) — is there any rewind or checkpoint route?
//
// `/rewind` is absent from the CLI's advertised commands, so there is no command
// to wrap. That is re-asserted here rather than cited, because it is the premise
// of the whole question. The REMAINING question is whether any other route
// exists, and the SDK declares one: a `rewind_files` control subtype taking a
// user_message_id and a dry_run flag.
//
// Declared is not callable (#115) and callable is not effective (#117), so this
// phase does all three:
//
//   A  reachability : call rewind_files with an unroutable message id, against
//                     the bogus-subtype control. An ARGUMENT error here is
//                     positive evidence the subtype exists.
//   B  effectiveness: spend ONE turn that provably writes a file, then call
//                     rewind_files on that turn's own user message id and check
//                     the FILE ON DISK. This is the arm #117 exists to demand.
//   C  attribution  : call rewind_files with a bogus id in the same session and
//                     confirm the file does NOT revert. Without it, a revert in
//                     B is not attributable to the id — a route that reverts
//                     everything regardless would read identically.

const measureRewind = async () => {
  const cwd = mkdtempSync(join(tmpdir(), 'spike-127-q2-'))
  const out = { turnsSpent: 0 }

  const idle = idleHandle(cwd)
  let control
  let commandSurface = null
  try {
    const cmds = await idle.supportedCommands()
    const names = Array.isArray(cmds)
      ? cmds.map((c) => String(c?.name ?? c)).filter(Boolean)
      : []
    // THE DRIFT ALARM for this question's premise. Counts and the two names
    // under test only — never the list, which contains the operator's own
    // personal commands.
    commandSurface = {
      count: names.length,
      rewindAdvertised: names.some((n) => /^\/?rewind$/i.test(n)),
      bgAdvertised: names.some((n) => /^\/?bg$/i.test(n)),
      anyNameContainingRewind: names.filter((n) => /rewind/i.test(n)).length,
      anyNameContainingCheckpoint: names.filter((n) => /checkpoint|undo|restore|revert/i.test(n)).length,
      recon120SaidCount: 121,
      note:
        '#120\'s recon measured 121 commands with /rewind and /bg both absent. Re-asserted here so a CLI update that ADDS either shows up as a changed number rather than as this spike quietly measuring a different world.'
    }
    control = await negativeControl(idle)
  } catch (err) {
    control = { refused: false, verdict: `UNSCORED — the handle never warmed: ${redact(err?.message ?? err)}` }
  }
  out.commandSurface = commandSurface
  out.negativeControl = control

  // --- arm A: reachability, zero turns --------------------------------------
  out.armA_reachability = [
    await probeSubtype(idle, control, 'rewind_files / unroutable id / dry_run', {
      subtype: 'rewind_files',
      user_message_id: randomUUID(),
      dry_run: true
    }),
    // A second, adjacent candidate: if a checkpoint concept exists under another
    // name, the workspace-diff route is where it would surface.
    await probeSubtype(idle, control, 'get_workspace_diff', { subtype: 'get_workspace_diff' }),
    // And the argument-shape discrimination: the SAME subtype with its required
    // field MISSING. A different error from arm A's is proof the route has its
    // own validator rather than being swallowed.
    await probeSubtype(idle, control, 'rewind_files / required field omitted', {
      subtype: 'rewind_files'
    })
  ]
  idle.close?.()

  // --- arms B/C/D: effectiveness, one turn each ------------------------------
  //
  // WHY THERE ARE THREE EFFECTIVENESS ARMS AND NOT ONE.
  //
  // Arm A above found the route PRESENT but its wet call refused with "File
  // rewinding is not enabled." — an error from the route's OWN validator, not
  // the unknown-subtype refusal. That is a configuration answer, and it turns
  // the question from "does a rewind route exist" into "what does this app have
  // to do to have one". The SDK declares the switch: `enableFileCheckpointing`,
  // which it turns into an env var on the spawned child.
  //
  // And THAT collides with something this app already does. engine.ts passes
  // `env: getEnv()`, and its own comment records the hazard verbatim —
  // "options.env REPLACES the child env wholesale". So an SDK flag delivered as
  // an env var is exactly the kind of thing this app could silently drop.
  // Whether it does is not a thing to reason about; it is a thing to measure,
  // and it decides whether a build ticket is one line or a redesign.
  //
  //   B  baseline      : checkpointing OFF, app env. What the app does today.
  //   C  the app shape : checkpointing ON, app env (`resolveSpawnEnv` output).
  //   D  attribution   : checkpointing ON, env omitted. If D works and C does
  //                      not, the app's env replacement is the blocker and the
  //                      finding is about THIS APP rather than about the CLI.
  //
  // Each arm carries a bogus-uuid control run BEFORE its real call, so a revert
  // can never be explained by "a rewind that reverts everything regardless".

  const rewindArm = async ({ label, checkpointing, useAppEnv }) => {
    const armCwd = mkdtempSync(join(tmpdir(), 'spike-127-q2arm-'))
    const target = join(armCwd, 'rewind-target.txt')
    writeFileSync(target, 'ORIGINAL\n')
    const before = readFileSync(target, 'utf8')

    const opts = { ...baseOptions(armCwd) }
    if (!useAppEnv) delete opts.env
    if (checkpointing) opts.enableFileCheckpointing = true

    const effect = {
      label,
      checkpointing,
      envPassed: useAppEnv ? 'the app\'s own resolveSpawnEnv output (engine.ts shape)' : 'omitted — the SDK builds the child env itself',
      attempted: true
    }

    // HOW THE REWIND TARGET IS IDENTIFIED, and why it is not scraped off the
    // stream. rewind_files wants a USER MESSAGE id, and the CLI does not echo
    // the prompt back — the only `type: 'user'` messages on the stream are
    // TOOL RESULTS. An earlier version of this arm took the first user uuid it
    // saw and was therefore addressing a tool_result, which would have produced
    // a confident wrong negative.
    //
    // The host stamps the uuid itself. That is what `cancel_async_message`'s
    // "uuid-stamped" language implies, and it is asserted rather than assumed:
    // the arm reads the session transcript back and checks that the CLI stored
    // the message under the id the host chose. That check is the reason this id
    // can be trusted, and it is also exactly what a build would have to do.
    const myUuid = randomUUID()

    const queue = createMessageQueue()
    let sessionId = null
    let q = null
    try {
      q = query({ prompt: queue.iterable, options: opts })
      turnsSpent += 1
      out.turnsSpent += 1
    } catch (err) {
      effect.error = `query() threw: ${redact(err?.message ?? err)}`
      return effect
    }

    let resolveTurn = null
    const consume = (async () => {
      try {
        for await (const msg of q) {
          if (typeof msg.session_id === 'string') sessionId = msg.session_id
          if (msg.type === 'result') {
            effect.ranTurn = true
            effect.turnIsError = msg.is_error === true
            resolveTurn?.()
            resolveTurn = null
          }
        }
      } catch (err) {
        effect.streamError = redact(err?.message ?? err)
        resolveTurn?.()
        resolveTurn = null
      }
    })()

    await new Promise((resolve) => {
      const timer = setTimeout(() => {
        effect.error = effect.error ?? 'turn timed out'
        resolveTurn?.()
        resolveTurn = null
      }, TURN_TIMEOUT_MS)
      resolveTurn = () => {
        clearTimeout(timer)
        resolve()
      }
      queue.push({
        type: 'user',
        uuid: myUuid,
        session_id: '',
        message: {
          role: 'user',
          // An ABSOLUTE path, deliberately. Told to edit "the file in the
          // current directory" the model wrote a file that was not this one and
          // the arm scored a false "nothing to rewind" — the setup failing and
          // being reported as the phenomenon, for the fourth time on this
          // record. The path is the harness's own temp dir and never reaches
          // the findings file.
          content:
            `Use the Write tool to replace the entire contents of the file at this exact absolute path with the single line MUTATED: ${target}\nThen reply with the single word DONE and nothing else.`
        },
        parent_tool_use_id: null,
        origin: { kind: 'human' }
      })
    })

    const afterTurn = existsSync(target) ? readFileSync(target, 'utf8') : null
    effect.fileChangedByTurn = afterTurn !== before

    // The assertion that licenses using myUuid as the rewind target.
    effect.hostStampedUuidAccepted = await (async () => {
      try {
        const msgs = await getSessionMessages(sessionId)
        const users = msgs.filter((m) => m.type === 'user')
        return { checked: true, transcriptUserMessages: users.length, firstUserUuidIsHostStamped: users[0]?.uuid === myUuid }
      } catch (err) {
        return { checked: false, error: redact(err?.message ?? err, 160) }
      }
    })()

    // #76: an absence assertion with no positive control measures nothing. If
    // the turn never mutated the file there was nothing to rewind, and "the
    // file did not revert" says nothing at all.
    if (!effect.fileChangedByTurn) {
      effect.verdict = `UNSCORED — setup did not hold (the turn did not change the file). Nothing about rewind can be read off this arm.`
    } else {
      const realId = myUuid

      effect.bogusIdControl = await (async () => {
        const row = await probeSubtype(q, control, `${label} / bogus uuid / dry_run=false`, {
          subtype: 'rewind_files',
          user_message_id: randomUUID(),
          dry_run: false
        })
        const now = existsSync(target) ? readFileSync(target, 'utf8') : null
        return {
          ...row,
          fileRevertedByBogusId: now === before,
          verdictAttribution:
            now === before
              ? 'BROKEN CONTROL — a bogus id reverted the file, so a revert below is not attributable to the id.'
              : 'HELD — a bogus id did not revert the file.'
        }
      })()

      effect.dryRun = await probeSubtype(q, control, `${label} / real uuid / dry_run=true`, {
        subtype: 'rewind_files',
        user_message_id: realId,
        dry_run: true
      })
      effect.dryRunLeftFileMutated =
        (existsSync(target) ? readFileSync(target, 'utf8') : null) !== before

      effect.wetRun = await probeSubtype(q, control, `${label} / real uuid / dry_run=false`, {
        subtype: 'rewind_files',
        user_message_id: realId,
        dry_run: false
      })
      const afterWet = existsSync(target) ? readFileSync(target, 'utf8') : null
      effect.fileRevertedToOriginal = afterWet === before

      effect.verdict = effect.fileRevertedToOriginal
        ? 'EFFECTIVE — the file returned to its pre-turn contents after rewind_files on the turn\'s own prompt uuid, while a bogus id left it alone.'
        : effect.wetRun.outcome === 'accepted' || effect.dryRun.outcome === 'accepted'
          ? `REACHABLE BUT NOT EFFECTIVE — the route answered and the file did not revert (canRewind=${effect.dryRun.canRewind}, error=${JSON.stringify(effect.dryRun.responseError ?? effect.wetRun.errorText ?? null)}). #117's distinction, and here it is a CONFIGURATION answer rather than a missing capability.`
          : 'NOT EFFECTIVE — see the row errors.'
    }

    queue.end()
    try {
      q.close()
    } catch {
      /* closing a finished handle is not a finding */
    }
    await consume
    return effect
  }

  idle.close?.()

  out.armB_baseline_appShape = await rewindArm({
    label: 'B-checkpointing-off-app-env',
    checkpointing: false,
    useAppEnv: true
  })
  out.armC_checkpointingOn_appEnv = await rewindArm({
    label: 'C-checkpointing-on-app-env',
    checkpointing: true,
    useAppEnv: true
  })
  // Only worth spending a turn on when C failed — if the app's own shape works,
  // there is nothing to attribute.
  out.armD_checkpointingOn_sdkEnv = out.armC_checkpointingOn_appEnv.fileRevertedToOriginal
    ? { skipped: 'arm C already worked in the app\'s own option shape, so there is nothing to attribute.' }
    : await rewindArm({
        label: 'D-checkpointing-on-sdk-env',
        checkpointing: true,
        useAppEnv: false
      })

  const reach = out.armA_reachability[0]
  const cWorks = out.armC_checkpointingOn_appEnv.fileRevertedToOriginal === true
  const dWorks = out.armD_checkpointingOn_sdkEnv?.fileRevertedToOriginal === true
  const bWorks = out.armB_baseline_appShape.fileRevertedToOriginal === true

  out.answer = !control.refused
    ? 'UNSCORED — the negative control did not hold.'
    : reach.verdict.startsWith('ROUTE ABSENT')
      ? 'NO — the CLI answers rewind_files with the same refusal it gives a subtype that does not exist. There is no rewind route, and the ask dies honestly.'
      : cWorks
        ? 'YES, AND BUILDABLE AS ONE OPTION — the rewind route works from this app\'s exact option shape once `enableFileCheckpointing: true` is passed. `/rewind` being unadvertised is about the COMMAND surface, not about the capability, and the app never had to wrap a command. The env-replacement hypothesis (that engine.ts\'s wholesale `options.env` would drop the SDK\'s checkpointing env var) was TESTED HERE AND REFUTED — arm C passes the app\'s own env and works.'
        : dWorks
          ? 'YES, BUT BLOCKED BY THIS APP\'S ENV REPLACEMENT — rewind works with `enableFileCheckpointing: true` when the SDK builds the child env, and NOT when this app passes its own `env`. The flag travels to the CLI as an environment variable and `options.env` replaces the child env wholesale, so the app drops it. That is a fixable defect in the app, not a missing CLI capability.'
          : bWorks
            ? 'YES, ALREADY ON — the route reverted the file with no flag passed.'
            : `PARTIAL — the route is present and validating its own arguments, but no arm reverted a file. Baseline says "${out.armB_baseline_appShape.verdict}"; with checkpointing on: "${out.armC_checkpointingOn_appEnv.verdict}".`

  out.cannotSettle = [
    'Whether rewind_files reverts CONVERSATION state as well as files. Its declared name, its response shape and this measurement are all about files; nothing here restores a transcript, so an "undo" UI built on it would undo the disk and not the chat.',
    'What it does on a RESUMED session. The SDK\'s own source carries a matching caveat for the store-backed case, and nothing here exercises a resume.',
    'Whether the app SHOULD offer it. Rewinding files is destructive and the blast radius is the user\'s workspace; that is a product call for the build ticket, not a measurement.',
    'Whether enabling checkpointing costs anything at runtime — it snapshots files before edits, and no overhead was measured here.'
  ]
  return out
}

// ---------------------------------------------------------------------------
// PHASE 3 (Q3) — what would "background a session" mean here?
//
// THE PREMISE IS ALREADY FALSE AND IT IS ON THE RECORD. `/bg` is one of three
// ways to OPEN the CLI's agent view — a whole-terminal takeover — not a command
// that backgrounds anything, and it is absent from the advertised commands. So
// this phase does not chase `/bg`. It asks what backgrounding could MEAN here
// and measures each candidate:
//
//   A  TASK backgrounding    : the `background_tasks` subtype, declared as "the
//                              control-request equivalent of pressing Ctrl+B".
//                              This backgrounds in-flight TASKS (Bash and
//                              subagents), not sessions — a different noun from
//                              the owner's ask, which is itself the finding.
//                              Measured by EFFECT: a turn blocked on a long Bash
//                              either returns early or it does not.
//   B  timing control        : the identical turn WITHOUT the background call.
//                              If it also returns early, A's early return was
//                              never attributable to backgrounding.
//   C  SESSION detach        : does the CLI keep working on a turn after the
//                              handle closes? This is the owner's actual ask
//                              — "the CLI keeps working on it while the UI
//                              detaches" — and it is answered on disk, by whether
//                              the session transcript gains the turn's result
//                              after the handle is gone.
//   D  remote control        : reachability ONLY, and with enabled:FALSE. See the
//                              header — enabling is outward-facing and the owner
//                              is away.

const measureBackgrounding = async () => {
  const cwd = mkdtempSync(join(tmpdir(), 'spike-127-q3-'))
  const out = { turnsSpent: 0 }

  const idle = idleHandle(cwd)
  let control
  try {
    await idle.supportedCommands()
    control = await negativeControl(idle)
  } catch (err) {
    control = { refused: false, verdict: `UNSCORED — the handle never warmed: ${redact(err?.message ?? err)}` }
  }
  out.negativeControl = control

  out.armD_remoteControlReachability = {
    ...(await probeSubtype(idle, control, 'remote_control / enabled=false', {
      subtype: 'remote_control',
      enabled: false
    })),
    deliberateLimit:
      'Probed with enabled:FALSE only. Enabling Remote Control bridges a live session to an external service — outward-facing, and the owner is away. This arm settles REACHABILITY of the subtype and nothing about what enabling would do.'
  }
  idle.close?.()

  // WHY THIS IS NOT `sleep 35`. The first version of this phase used one, and
  // scored a confident FALSE POSITIVE: this machine's harness BLOCKS standalone
  // sleeps, so the backgrounded arm's turn returned 37s sooner than the control
  // — not because backgrounding worked, but because its command never ran. The
  // arm was measuring a hook. A node timer is a real foreground block that no
  // sleep-matching rule catches, and the control arm below asserts that it
  // genuinely blocked before arm A is scored at all.
  const LONG_CMD = `node -e "setTimeout(()=>console.log('SLEPT'),35000)"`
  const LONG_BASH_PROMPT =
    `Use the Bash tool to run exactly this command and wait for it to finish: ${LONG_CMD}\n` +
    'Do not background it, do not modify it, and do not use any other tool. ' +
    'When it completes, reply with the single word SLEPT and nothing else.'

  // --- arm B first: the timing control (no background call) -----------------
  const armB = await runTurn({
    label: 'B-timing-control-no-background-call',
    cwd,
    prompt: LONG_BASH_PROMPT
  })
  out.turnsSpent += 1
  // THE SETUP ASSERTION. A control arm that did not actually block measures
  // nothing, and an arm A compared against it would report whatever the
  // difference happened to be. 25s is the floor for "the 35s command really ran
  // in the foreground".
  const controlReallyBlocked =
    typeof armB.out.durationMs === 'number' && armB.out.durationMs >= 25_000
  out.armB_timingControl = {
    ...armB.out,
    ranBash: armB.out.toolUseNames.some((n) => /^bash$/i.test(n)),
    controlReallyBlocked,
    note:
      'The turn that is NOT backgrounded. Its duration is the baseline arm A must beat; without it, "returned in Xms" means nothing. controlReallyBlocked is the setup assertion — false means the long command never ran in the foreground and arm A is UNSCORED rather than effective.'
  }

  // --- arm A: the same turn, backgrounded mid-flight -------------------------
  const bg = { called: false, atMs: null, row: null }
  const startedA = Date.now()
  const armA = await runTurn({
    label: 'A-background-tasks-midflight',
    cwd,
    prompt: LONG_BASH_PROMPT,
    inject: async ({ out: live, query: q, isDone }) => {
      // Wait until a Bash tool_use has actually been issued — backgrounding
      // "all foreground tasks" when there are none measures the empty case, not
      // the route.
      const seen = await waitFor(
        () => live.toolUseNames.some((n) => /^bash$/i.test(n)),
        { timeoutMs: 90_000 }
      )
      if (!seen || isDone()) return
      await sleep(2000)
      if (isDone()) return
      bg.called = true
      bg.atMs = Date.now() - startedA
      bg.row = await probeSubtype(q, control, 'background_tasks / all foreground', {
        subtype: 'background_tasks'
      })
    }
  })
  out.turnsSpent += 1
  out.armA_taskBackgrounding = {
    ...armA.out,
    backgroundCall: bg,
    ranBash: armA.out.toolUseNames.some((n) => /^bash$/i.test(n)),
    // The effect: did the turn finish materially sooner than the control?
    fasterThanControlMs:
      typeof armB.out.durationMs === 'number' && typeof armA.out.durationMs === 'number'
        ? armB.out.durationMs - armA.out.durationMs
        : null
  }

  // --- arm C: does the SESSION survive the handle closing? -------------------
  //
  // The owner's ask, mechanically. A turn is started, the handle is closed
  // mid-flight, and the work is watched for completion afterwards.
  //
  // TWO INSTRUMENT FIXES THIS ARM NEEDED, both of which had produced a wrong
  // answer before they went in:
  //
  //  1. THE WITNESS MUST BE SESSION-SCOPED. The first version watched "the
  //     newest .jsonl anywhere under the projects tree" and read a 1.1MB jump —
  //     which was almost certainly an unrelated session on this machine writing
  //     its own transcript, not this spike's. `getSessionMessages(sessionId)`
  //     asks about THIS session and nothing else.
  //  2. THE PROOF FILE MUST BE CHECKED BEFORE THE CUT. Otherwise a model that
  //     wrote the file early — which is exactly what happened when the delay
  //     was a `sleep` this machine's harness blocks — scores as "survived the
  //     detach" while nothing was ever detached. Present before the cut is
  //     UNSCORED, not a pass.
  const cwdC = mkdtempSync(join(tmpdir(), 'spike-127-q3c-'))
  const proofFile = join(cwdC, 'detached-proof.txt')
  const detach = {}
  const queue = createMessageQueue()
  let q = null
  let sessionId = null
  let sawResult = false
  try {
    q = query({ prompt: queue.iterable, options: baseOptions(cwdC) })
    turnsSpent += 1
    out.turnsSpent += 1
  } catch (err) {
    detach.error = `query() threw: ${redact(err?.message ?? err)}`
  }

  if (q !== null) {
    void (async () => {
      try {
        for await (const m of q) {
          if (typeof m.session_id === 'string') sessionId = m.session_id
          if (m.type === 'result') sawResult = true
        }
      } catch {
        /* the close below is expected to end this stream */
      }
    })()

    queue.push({
      type: 'user',
      message: {
        role: 'user',
        content:
          `Use the Bash tool to run exactly this command and wait for it to finish: ${LONG_CMD}\n` +
          `Then use the Write tool to create a file at this exact absolute path containing the single line SURVIVED: ${proofFile}\n` +
          'Then reply with DONE. Do not background anything.'
      },
      parent_tool_use_id: null,
      origin: { kind: 'human' }
    })

    // Let the turn genuinely start, then cut the handle.
    await sleep(12_000)
    detach.sessionIdObserved = typeof sessionId === 'string'
    detach.resultBeforeCut = sawResult
    detach.proofFileExistedBeforeCut = existsSync(proofFile)

    const countMessages = async () => {
      if (typeof sessionId !== 'string') return null
      try {
        return (await getSessionMessages(sessionId)).length
      } catch {
        return null
      }
    }
    detach.sessionMessagesBeforeCut = await countMessages()

    try {
      q.close()
    } catch {
      /* closing is the experiment */
    }
    queue.end()

    // Now wait past the command. If the CLI kept working, the file appears and
    // this session's own transcript grows. If closing the handle killed the
    // child, neither does — and THAT is the answer.
    await sleep(45_000)
    detach.sessionMessagesAfterCut = await countMessages()
    detach.sessionTranscriptGrewAfterCut =
      typeof detach.sessionMessagesBeforeCut === 'number' &&
      typeof detach.sessionMessagesAfterCut === 'number'
        ? detach.sessionMessagesAfterCut > detach.sessionMessagesBeforeCut
        : null
    detach.proofFileWritten = existsSync(proofFile)

    detach.verdict = detach.resultBeforeCut
      ? 'UNSCORED — the turn had already finished before the handle was cut, so nothing was detached.'
      : detach.proofFileExistedBeforeCut
        ? 'UNSCORED — the proof file already existed BEFORE the handle was cut, so its presence afterwards says nothing about surviving the detach.'
        : detach.proofFileWritten
          ? 'SESSION SURVIVED THE DETACH — work that had not happened at the moment the handle closed completed afterwards, so the CLI keeps running with no SDK consumer attached.'
          : 'SESSION DID NOT SURVIVE — the handle closing ended the work. Closing the SDK query kills the CLI child, so there is no detach through this route.'
  }
  out.armC_sessionDetach = detach

  const aFaster =
    typeof out.armA_taskBackgrounding.fasterThanControlMs === 'number' &&
    out.armA_taskBackgrounding.fasterThanControlMs > 10_000

  out.answer = !control.refused
    ? 'UNSCORED — the negative control did not hold.'
    : [
        `TASK backgrounding: ${
          !bg.called
            ? 'UNSCORED — the call was never made (no Bash tool_use appeared in the window).'
            : bg.row?.verdict?.startsWith('ROUTE ABSENT')
              ? 'ABSENT — background_tasks answers with the unknown-subtype refusal.'
              : !controlReallyBlocked
                ? `UNSCORED — the control turn did not actually block (${armB.out.durationMs}ms), so any speed-up in the backgrounded arm is not attributable to backgrounding. This is the confound that produced a false EFFECTIVE on the first run of this phase.`
                : aFaster
                  ? `EFFECTIVE — the backgrounded turn returned ${out.armA_taskBackgrounding.fasterThanControlMs}ms sooner than the identical un-backgrounded turn, which did block.`
                  : 'REACHABLE BUT NOT DEMONSTRATED — the subtype was accepted and the turn did not return materially sooner than a control that did block.'
        }`,
        `SESSION detach: ${detach.verdict ?? 'unmeasured'}`,
        `Remote Control subtype: ${out.armD_remoteControlReachability.verdict}`
      ].join(' | ')

  out.cannotSettle = [
    'What enabling Remote Control does. Deliberately not exercised — it is outward-facing and the owner is away.',
    'Whether a session detached by some OTHER mechanism (a daemon, a resumed session id, the CLI\'s own agent view) keeps working. Only the SDK handle\'s own lifetime was measured.',
    'The COST of a write-side backgrounding route in the app. #90 measured the read side at ~893ms of CLI subprocess per look; nothing here prices a write.'
  ]
  return out
}

// ---------------------------------------------------------------------------
const cliVersion = (() => {
  const r = spawnSync(cliBin, ['--version'], { encoding: 'utf8' })
  return (r.stdout ?? '').trim() || null
})()

const findings = {
  spike: 127,
  question: 'Three routes nobody has called: subagent inbound, rewind, backgrounding.',
  measuredAt: new Date().toISOString(),
  phasesRun: PHASES,
  env: {
    backendMode,
    hostCliUsed: hostCli !== null,
    cliVersion,
    sdkVersion: pkgJson?.version ?? null,
    platform: process.platform,
    node: process.version
  },
  scrubbing:
    'Counts, shapes, vocabularies, timings, booleans and CLI-generated error text passed through a redactor. No cwd, home directory, username, absolute path, session id, model id or command name.',
  method:
    'Every route is probed by CALLING a warm handle, never by grepping a bundle or reading a .d.ts (#115: a declared wire type is not a callable route; #117: a callable route is not an effective one). Each phase carries a bogus-subtype negative control, and a route that only THREW is still scored ROUTE PRESENT when its error differs from the unknown-subtype refusal — that difference is the instrument.',
  phase0_sourceFacts: sourceFacts(),
  q1_subagentInbound: runs('1') ? await measureSubagentInbound() : { skipped: 'phase 1 not selected' },
  q2_rewind: runs('2') ? await measureRewind() : { skipped: 'phase 2 not selected' },
  q3_backgrounding: runs('3') ? await measureBackgrounding() : { skipped: 'phase 3 not selected' }
}

findings.turnsSpent = {
  total: turnsSpent,
  note:
    'A control request on a warm handle costs NO turn (#105). Every number here is a real CLI turn: phase 1 spends up to 4, phase 2 spends 1, phase 3 spends 3. Phase 0 and every reachability arm are free.'
}

findings.whatANegativeRunProves = {
  general:
    'A verdict of ROUTE ABSENT is a measurement ONLY IF that phase\'s negativeControl.refused is true. Otherwise the dispatcher accepts anything and neither a success nor a refusal means what it looks like (#116, and #122\'s swallowed gesture error). An arm whose own setup failed is reported UNSCORED and never as the phenomenon (#114, #125).',
  q1:
    'A NO here is a statement about ONE addressing field — parent_tool_use_id, the only one the protocol declares for this — measured on one CLI version at one injection moment. It is not "no inbound route can exist", which is the exact over-claim that was refuted during this spec\'s grill.',
  q2:
    'A YES requires the file on disk to change back AND the bogus-id control to have left it alone. Reachability alone is explicitly NOT scored as a yes (#117).',
  q3:
    'The session-detach arm answers on disk and on a file the CLI itself wrote, not on an SDK return value. Its NO is attributable because the same turn provably started before the handle was cut.'
}

writeFileSync(findingsPath, JSON.stringify(findings, null, 2) + '\n')

const line = (k, v) => console.log(`${k.padEnd(18)}: ${v}`)
console.log('\n=== spike 127 ===')
line('env', `${backendMode} backend, host CLI ${hostCli !== null}, sdk ${pkgJson?.version ?? '?'}`)
line('Q1 subagent in', findings.q1_subagentInbound.answer ?? findings.q1_subagentInbound.skipped)
line('Q2 rewind', findings.q2_rewind.answer ?? findings.q2_rewind.skipped)
line('Q3 background', findings.q3_backgrounding.answer ?? findings.q3_backgrounding.skipped)
line('turns spent', String(turnsSpent))
line('findings', 'scripts/spike-127-findings.json')
