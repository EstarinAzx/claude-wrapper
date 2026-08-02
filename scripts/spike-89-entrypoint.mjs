// Spike #89 — does this app ever stamp `entrypoint: "sdk-ts"` into a transcript?
//
// Fourth sibling of spike-81/87/88, same construction and the same two imports:
// the app's REAL src/main/cli-path.ts (so it cannot drift onto a different
// binary than the app spawns) and its REAL src/main/backend-mode.ts (unsetting
// ANTHROPIC_BASE_URL by hand is NOT native mode — #87 measured that and every
// turn came back "Invalid API key"; resolveSpawnEnv strips all three WISP_KEYS
// and is the only correct source).
//
//   node --experimental-strip-types scripts/spike-89-entrypoint.mjs
//
// WHY TWO CONFIGS. The SDK stamps the variable behind a guard, at both of its
// spawn sites in sdk.mjs:
//
//     Kt = xt ? {...xt} : {...process.env}
//     if (!Kt.CLAUDE_CODE_ENTRYPOINT) Kt.CLAUDE_CODE_ENTRYPOINT = "sdk-ts"
//
// `xt` is options.env, and engine.ts passes one (`env: getEnv()` → getSpawnEnv →
// resolveSpawnEnv, which spreads process.env WHOLESALE and never sets the
// variable). So the stamp is inherit-wins: whatever the Electron main process
// carried is what the child CLI writes, and "sdk-ts" only lands when the launch
// env carried nothing. That is a claim about an ENVIRONMENT, so the measurement
// varies exactly that and holds everything else at engine.ts's real options.
//
//   inherited       — the spawn env the app builds HERE, unmodified. An agent
//                     session sets CLAUDE_CODE_ENTRYPOINT=cli, so this is the
//                     launched-from-inside-a-Claude-Code-session case.
//   outside-session — the same env with the Claude Code session-provenance vars
//                     removed. This is the launched-from-a-desktop-shortcut
//                     case, reproduced by env rather than by a real detached
//                     launch — see LIMIT below.
//
// LIMIT, recorded rather than papered over (the #87 precedent for the native
// backend). Every process this script can start descends from a Claude Code
// session, so `outside-session` is a RECONSTRUCTION of an outside launch, not
// one. It is a faithful reconstruction of the deciding variable — the guard
// reads exactly one env key and this config removes it — but a true outside
// launch could differ in ways no env edit reproduces. Stated as such in the
// findings file, and the `inherited` config is a real measurement of the case
// that actually occurs when an agent launches the app.
//
// EVIDENCE SPLIT, as #87 and #88: raw JSONL and session ids stay in a temp dir;
// a SCRUBBED findings file lands in the repo. Session ids are never recorded —
// they are the store's primary key and the repo is pushed — only the classifier
// inputs and outcomes derived from them.

import {
  mkdtempSync,
  writeFileSync,
  appendFileSync,
  openSync,
  readSync,
  closeSync,
  fstatSync,
  existsSync,
  readdirSync,
  readFileSync
} from 'node:fs'
import { tmpdir, homedir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { query, listSessions } from '@anthropic-ai/claude-agent-sdk'

const { resolveHostCli, toCliOptions } = await import('../src/main/cli-path.ts')
const { snapshotWispEnv, resolveSpawnEnv, initialMode } = await import('../src/main/backend-mode.ts')

// session-index.ts is NOT imported the way cli-path.ts and backend-mode.ts are,
// and the reason is mechanical rather than a preference: it imports
// '../shared/cwd-key' extensionless, which node's ESM resolver rejects under
// --experimental-strip-types. So the lookup below is a local enumeration.
// It still obeys that module's one binding rule — NEVER re-derive a store path
// from cwd — by scanning the store for the id, which is what resolveSessionDir
// does. It is deliberately not a copy of the encoding, because there is no
// encoding here to copy.
const findTranscript = (sessionId) => {
  const root = join(homedir(), '.claude', 'projects')
  let dirs
  try {
    dirs = readdirSync(root, { withFileTypes: true })
  } catch {
    return null
  }
  for (const d of dirs) {
    if (!d.isDirectory()) continue
    const file = join(root, d.name, `${sessionId}.jsonl`)
    if (existsSync(file)) return file
  }
  return null
}

const runDir = mkdtempSync(join(tmpdir(), 'spike-89-'))
const jsonlPath = join(runDir, 'messages.jsonl')
const findingsPath = new URL('./spike-89-findings.json', import.meta.url)
const onlyConfig = process.env['SPIKE89_ONLY'] ?? null

// The three-member Set and the 64KB window are the SDK's, read out of the
// shipped sdk.mjs rather than assumed. Kept here so the replica below is
// checkable against the source it copies.
const PROGRAMMATIC = new Set(['sdk-cli', 'sdk-ts', 'sdk-py'])
const WINDOW = 65536

// The session-provenance vars a Claude Code session exports. Removing them is
// what makes `outside-session` outside. CLAUDE_CODE_ENTRYPOINT is the only one
// the SDK guard reads; the rest go because an outside launch would not have
// them either and leaving them would make the config a half-measure.
const SESSION_VARS = [
  'CLAUDE_CODE_ENTRYPOINT',
  'CLAUDECODE',
  'CLAUDE_CODE_SESSION_ID',
  'CLAUDE_CODE_CHILD_SESSION',
  'CLAUDE_CODE_EXECPATH',
  'CLAUDE_PID',
  'CLAUDE_JOB_DIR'
]

// --- The app's real spawn env, for the app's real backend mode.
const snapshot = snapshotWispEnv(process.env)
const mode = initialMode(snapshot)
const appEnv = resolveSpawnEnv(mode, snapshot, process.env)

const hostCli = resolveHostCli(process.env['PATH'], process.platform)
const cliOptions = toCliOptions(hostCli)

// A cwd outside the repo so the turn's own tools cannot touch the tree under
// test. Each config gets its OWN cwd: two sessions in one project directory
// would both have to be told apart by id, and ids are what this file must not
// record. Separate directories make the join structural.
const cwdFor = (label) => {
  const dir = mkdtempSync(join(tmpdir(), `spike-89-${label}-`))
  writeFileSync(join(dir, 'README.md'), '# spike 89 scratch\n')
  return dir
}

const record = (label, msg) =>
  appendFileSync(jsonlPath, JSON.stringify({ label, msg }) + '\n')

// --- Replica of the SDK's classifier, transcribed from sdk.mjs.
//
//   var dn = 65536, sEe = new Set(["sdk-cli","sdk-ts","sdk-py"])
//   function B1(e, t) {                                  // e = head, t = tail
//     let r = pc(e,"entrypoint") ?? er(t,"entrypoint")
//     if (r && sEe.has(r)) return !0
//     let n = e.split("\n").find(i => i.includes('"parentUuid":')) ?? e
//     let o = pc(n,"sessionKind")
//     return o === "daemon" || o === "daemon-worker"
//   }
//
// pc() takes the FIRST match scanning forward; er() takes the LAST. r_() reads
// only two 64KB windows — the head and the tail — never the whole file. So ONE
// record decides a whole session, and the second clause means `entrypoint` is
// not the only way to be programmatic.
const firstValue = (text, key) => {
  for (const needle of [`"${key}":"`, `"${key}": "`]) {
    const i = text.indexOf(needle)
    if (i < 0) continue
    const from = i + needle.length
    const end = text.indexOf('"', from)
    if (end >= 0) return text.slice(from, end)
  }
  return undefined
}

const lastValue = (text, key) => {
  let found
  for (const needle of [`"${key}":"`, `"${key}": "`]) {
    let at = 0
    for (;;) {
      const i = text.indexOf(needle, at)
      if (i < 0) break
      const from = i + needle.length
      const end = text.indexOf('"', from)
      if (end < 0) break
      found = text.slice(from, end)
      at = end + 1
    }
  }
  return found
}

const readWindows = (file) => {
  const fd = openSync(file, 'r')
  try {
    const stat = fstatSync(fd)
    const buf = Buffer.allocUnsafe(WINDOW)
    const headRead = readSync(fd, buf, 0, WINDOW, 0)
    if (headRead === 0) return null
    const head = buf.toString('utf8', 0, headRead)
    const offset = Math.max(0, stat.size - WINDOW)
    let tail = head
    if (offset > 0) {
      const tailRead = readSync(fd, buf, 0, WINDOW, offset)
      tail = buf.toString('utf8', 0, tailRead)
    }
    return { size: stat.size, head, tail }
  } finally {
    closeSync(fd)
  }
}

const classify = ({ head, tail }) => {
  const deciding = firstValue(head, 'entrypoint') ?? lastValue(tail, 'entrypoint')
  if (deciding && PROGRAMMATIC.has(deciding)) {
    return { deciding, programmatic: true, via: 'entrypoint' }
  }
  const line = head.split('\n').find((l) => l.includes('"parentUuid":')) ?? head
  const kind = firstValue(line, 'sessionKind')
  return {
    deciding: deciding ?? null,
    programmatic: kind === 'daemon' || kind === 'daemon-worker',
    via: kind === 'daemon' || kind === 'daemon-worker' ? 'sessionKind' : 'none',
    sessionKind: kind ?? null
  }
}

// --- One turn against one env, then read what the CLI wrote.
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

const runConfig = async (label, env, timeoutMs = 180_000) => {
  if (onlyConfig && label !== onlyConfig) return { label, skipped: `SPIKE89_ONLY=${onlyConfig}` }

  const spawnEntrypoint = env['CLAUDE_CODE_ENTRYPOINT'] ?? null
  console.log(`\n=== config "${label}" :: CLAUDE_CODE_ENTRYPOINT in spawn env = ${spawnEntrypoint ?? '<absent>'}`)

  const out = {
    label,
    spawnEnv: {
      // The input side of the guard. Recorded for both configs because
      // "absent" is the whole condition being tested.
      claudeCodeEntrypoint: spawnEntrypoint,
      sessionVarsPresent: SESSION_VARS.filter((k) => env[k] !== undefined)
    }
  }

  const cwd = cwdFor(label)
  const queue = createMessageQueue()
  const options = {
    cwd,
    includePartialMessages: true,
    canUseTool: async (_n, _i, o) => ({
      behavior: 'allow',
      toolUseID: o.toolUseID,
      decisionClassification: 'user_temporary'
    }),
    env,
    permissionMode: 'bypassPermissions',
    allowDangerouslySkipPermissions: true,
    ...cliOptions
  }

  let q
  try {
    q = query({ prompt: queue.iterable, options })
  } catch (err) {
    out.error = `query() threw: ${err?.message ?? err}`
    console.log(`  !! ${out.error}`)
    return out
  }

  let sessionId = null
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
        if (msg.type === 'system' && msg.subtype === 'init' && msg.session_id) {
          sessionId = msg.session_id
        }
        if (msg.type === 'result') {
          // #87's landmine: subtype is 'success' on a failed turn. is_error is
          // the field that says so, and a failed turn makes this config's
          // reading uninterpretable rather than negative.
          out.turn = { subtype: msg.subtype, isError: msg.is_error === true }
          console.log(`  == result: ${msg.subtype} (is_error=${msg.is_error === true})`)
          finishTurn()
        }
      }
    } catch (err) {
      out.error = `stream threw: ${err?.message ?? err}`
      console.log(`  !! ${out.error}`)
      finishTurn()
    }
  })()

  await new Promise((resolve) => {
    const timer = setTimeout(() => {
      console.log('  !! turn timed out')
      out.error = 'turn timed out'
      finishTurn()
    }, timeoutMs)
    turnResolve = () => {
      clearTimeout(timer)
      resolve()
    }
    queue.push({
      type: 'user',
      message: { role: 'user', content: 'Reply with exactly the word: ok' },
      parent_tool_use_id: null,
      origin: { kind: 'human' }
    })
  })

  queue.end()
  await consume

  if (!sessionId) {
    out.error = out.error ?? 'no session id on init'
    return out
  }

  // Locate the transcript the way the APP locates one — by enumeration, never
  // by re-deriving a store path from cwd. That rule is load-bearing here for a
  // second reason: this run uses a temp cwd, so a guessed encoding would be
  // guessing about a directory nothing else in the app ever names.
  const file = findTranscript(sessionId)
  out.transcript = { found: file !== null }
  if (!file) return out

  const windows = readWindows(file)
  if (!windows) {
    out.transcript.error = 'transcript empty or unreadable'
    return out
  }

  // The whole point of the ticket: what did the CLI actually write?
  const all = [...windows.head.matchAll(/"entrypoint":"([^"]*)"/g)].map((m) => m[1])
  out.transcript.sizeBytes = windows.size
  out.transcript.fitsInOneWindow = windows.size <= WINDOW
  out.transcript.entrypointValuesInHead = [...new Set(all)].sort()
  out.transcript.entrypointRecordsInHead = all.length
  out.classifier = classify(windows)

  // And the consequence, measured through the SDK rather than through the
  // replica above: does the real listSessions() hide this session when
  // programmatic sessions are excluded? This is the behaviour the comment in
  // session-store.ts is a claim about.
  const [withProg, withoutProg] = await Promise.all([
    listSessions({ includeProgrammatic: true }),
    listSessions({ includeProgrammatic: false })
  ])
  const inList = (rows) => rows.some((r) => r.sessionId === sessionId)
  out.sdkListing = {
    visibleWithProgrammatic: inList(withProg),
    visibleWithoutProgrammatic: inList(withoutProg),
    // The delta the comment claims exists. Totals only — no ids.
    totalWithProgrammatic: withProg.length,
    totalWithoutProgrammatic: withoutProg.length
  }
  console.log(
    `  -> wrote entrypoint=${JSON.stringify(out.transcript.entrypointValuesInHead)}` +
      ` | programmatic=${out.classifier.programmatic}` +
      ` | hidden by includeProgrammatic:false = ${out.sdkListing.visibleWithProgrammatic && !out.sdkListing.visibleWithoutProgrammatic}`
  )
  return out
}

// --- Versions, for the same reason #81 and #87 record them.
const sdkVersion = (() => {
  try {
    const pkg = new URL('../node_modules/@anthropic-ai/claude-agent-sdk/package.json', import.meta.url)
    return JSON.parse(readFileSync(pkg, 'utf8')).version ?? null
  } catch {
    return null
  }
})()

const cliVersion = (() => {
  try {
    const r = spawnSync(hostCli ?? 'claude', ['--version'], { encoding: 'utf8', shell: true })
    return (r.stdout ?? '').trim() || null
  } catch {
    return null
  }
})()

const outsideEnv = { ...appEnv }
for (const key of SESSION_VARS) delete outsideEnv[key]

// Third config, added after the first run returned `sdk-cli` for an inherited
// `cli` — an inherited value is evidently TRANSFORMED, not passed through, and
// the transform is not in sdk.mjs (which only holds the three-member Set), so
// it belongs to the CLI binary. Which transform it is decides something the
// comment has to state correctly: under a `sdk-` prefix rule an inherited
// `claude-vscode` would become `sdk-claude-vscode`, which is NOT in the Set and
// would be classified INTERACTIVE — meaning the app could write a
// non-programmatic transcript after all. Under a fixed map it could not. One
// turn settles it, so it is measured rather than reasoned about.
const vscodeEnv = { ...appEnv, CLAUDE_CODE_ENTRYPOINT: 'claude-vscode' }

const configs = [
  await runConfig('inherited', appEnv),
  await runConfig('outside-session', outsideEnv),
  await runConfig('inherited-vscode', vscodeEnv)
]

const findings = {
  spike: 89,
  question: 'Does this app ever stamp entrypoint "sdk-ts" into a transcript it writes?',
  measuredAt: new Date().toISOString(),
  runDir,
  env: { backendMode: mode, hostCliUsed: hostCli !== null, cliVersion, sdkVersion },
  limit:
    'outside-session is a reconstruction by environment, not a real detached launch: every process this script can start descends from a Claude Code session. It removes exactly the key the SDK guard reads, plus the other session-provenance vars, but a true outside launch could differ in ways no env edit reproduces.',
  sdkMechanism: {
    stampGuard: 'if (!env.CLAUDE_CODE_ENTRYPOINT) env.CLAUDE_CODE_ENTRYPOINT = "sdk-ts"',
    stampSites: 2,
    programmaticSet: [...PROGRAMMATIC],
    readWindowBytes: WINDOW,
    decidingRecord: 'first "entrypoint" in the head window, else the last in the tail window',
    secondProgrammaticPath: 'sessionKind === "daemon" | "daemon-worker", read off the first record containing "parentUuid"'
  },
  configs
}

writeFileSync(findingsPath, JSON.stringify(findings, null, 2) + '\n')
console.log(`\nraw stream: ${jsonlPath}`)
console.log(`findings:   ${findingsPath.pathname}`)
