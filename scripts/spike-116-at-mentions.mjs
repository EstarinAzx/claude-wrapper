// Spike #116 — is `@` file autocomplete reachable from this app at all?
//
// Sibling of spike-81/87/88/89/90/104/105/108/114, same construction and the
// same import rule: the app's REAL src/main/cli-path.ts and src/main/backend-mode.ts,
// so the binary and the routing measured here cannot drift from what the app spawns.
//
//   node scripts/spike-116-at-mentions.mjs
//   SPIKE116_PHASES=0,2      # source facts + the route probe, zero CLI turns
//
// This spike BUILDS NOTHING. `git diff --stat -- src/` is part of its gate.
//
// THREE QUESTIONS, from the ticket:
//   Q1 RESOLUTION — does `@path` in ordinary prompt text get resolved by the CLI
//                   when sent through THIS APP'S query() options shape?
//   Q2 AUTOCOMPLETE — is there any route from the `.` bundle to ASK for file
//                   suggestions? Probed by CALLING, never by matching names.
//   Q3 COST       — if the app must enumerate the workspace itself, what does
//                   one listing cost, against a per-keystroke trigger?
//
// WHY Q2 RUNS FIRST AND COSTS NOTHING. Every named method on the runtime Query
// object is a thin wrapper over a GENERIC control-request dispatcher
// (`this.request({subtype: ...})`) — #88's shape verbatim, which is why the
// ticket forbids concluding from an absent method name. A control request on a
// warm query sends no prompt and burns no turn (spike-105's economy), so the
// cheap question is asked before the expensive one.
//
// THE NEGATIVE CONTROL IS LOAD-BEARING. "The CLI answered" only means something
// if the CLI would have REFUSED an unsupported subtype — otherwise a permissive
// dispatcher that swallows anything would read identically. So a deliberately
// bogus subtype is sent on the same handle, and its refusal text is recorded.
// Without that, a `success` on `file_suggestions` is unscored.
//
// SCRUBBING, as #87/#88/#89/#90. Suggestion payloads are the user's real file
// paths, from inside AND (as it turns out) outside the workspace. The findings
// file records COUNTS, CLASSIFICATIONS and SHAPES. Sample paths are recorded
// only after redaction to their in-workspace form or a class label; no absolute
// path, home directory or username is written to it.

import {
  mkdtempSync,
  writeFileSync,
  readFileSync,
  mkdirSync,
  readdirSync,
  existsSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, isAbsolute, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { query } from '@anthropic-ai/claude-agent-sdk'

const { resolveHostCli, toCliOptions } = await import('../src/main/cli-path.ts')
const { snapshotWispEnv, resolveSpawnEnv, initialMode } = await import(
  '../src/main/backend-mode.ts'
)

// fileURLToPath, never URL.pathname: this repo lives under a directory with a
// space in its name, and pathname hands back the percent-encoded form, which
// every fs call below would then miss.
const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const runDir = mkdtempSync(join(tmpdir(), 'spike-116-'))
const findingsPath = new URL('./spike-116-findings.json', import.meta.url)

const hostCli = resolveHostCli(process.env['PATH'], process.platform)
const cliOptions = toCliOptions(hostCli)
const cliBin = hostCli ?? 'claude'

const snapshot = snapshotWispEnv(process.env)
const mode = initialMode(snapshot)
const appEnv = resolveSpawnEnv(mode, snapshot, process.env)

const PHASES = (process.env['SPIKE116_PHASES'] ?? '0,1,2,3')
  .split(',')
  .map((s) => s.trim())
const runs = (p) => PHASES.includes(p)

const raw = (name, data) => writeFileSync(join(runDir, name), data)

// ---------------------------------------------------------------------------
// 0 SOURCE FACTS — a drift alarm, asserted rather than cited.
//
// #113's landmine, applied in #114: record the TEXT each fact matched, never a
// boolean. A rename then shows up as changed text instead of a silent `false`
// that reads exactly like "the thing is absent".

const sdkDir = join(repoRoot, 'node_modules', '@anthropic-ai', 'claude-agent-sdk')

const matchesIn = (file, re) => {
  let text
  try {
    text = readFileSync(join(sdkDir, file), 'utf8')
  } catch (err) {
    return { readable: false, error: String(err?.message ?? err).slice(0, 160) }
  }
  const hits = [...text.matchAll(re)]
  return {
    readable: true,
    bytes: text.length,
    count: hits.length,
    // The matched text itself, capped. Empty array is a measured zero.
    matched: hits.slice(0, 6).map((m) => m[0].slice(0, 200))
  }
}

const lineMatches = (file, re, cap = 6) => {
  let lines
  try {
    lines = readFileSync(join(sdkDir, file), 'utf8').split('\n')
  } catch (err) {
    return { readable: false, error: String(err?.message ?? err).slice(0, 160) }
  }
  const out = []
  lines.forEach((l, i) => {
    if (re.test(l) && out.length < cap) out.push({ line: i + 1, text: l.trim().slice(0, 240) })
  })
  return { readable: true, hits: out }
}

const pkgJson = (() => {
  try {
    return JSON.parse(readFileSync(join(sdkDir, 'package.json'), 'utf8'))
  } catch {
    return null
  }
})()

const sourceFacts = {
  note:
    'Every entry records the TEXT it matched, not a boolean (#113/#114). A zero count with an empty `matched` is a measured absence; an unreadable file says so.',
  sdkVersion: pkgJson?.version ?? null,
  // The ticket states this app imports the `.` export. Asserted, not trusted.
  exportsDot: pkgJson?.exports?.['.'] ?? null,
  exportsBridge: pkgJson?.exports?.['./bridge'] ?? null,
  sdkMjs_file_suggestions: matchesIn('sdk.mjs', /file_suggestions/g),
  bridgeMjs_file_suggestions: matchesIn('bridge.mjs', /file_suggestions/g),
  // The declared request shape, so a field rename is visible here rather than as
  // an unexplained empty result down in the probe.
  declaration: lineMatches('sdk.d.ts', /SDKControlFileSuggestionsRequest|subtype: 'file_suggestions'|query: string/),
  settingsHooks: lineMatches('sdk.d.ts', /fileSuggestion\?|respectGitignore\?/),
  // The app's own side: does anything in src/main enumerate the open workspace?
  // The spec asserts not; re-asserted here so this harness fails loudly if a
  // later ticket adds one and quietly changes what Q3 is even about.
  mainEnumeratesWorkspace: (() => {
    const dir = join(repoRoot, 'src', 'main')
    const hits = []
    const walk = (d) => {
      let entries
      try {
        entries = readdirSync(d, { withFileTypes: true })
      } catch {
        return
      }
      for (const e of entries) {
        const p = join(d, e.name)
        if (e.isDirectory()) walk(p)
        else if (e.name.endsWith('.ts')) {
          const text = readFileSync(p, 'utf8')
          for (const m of text.matchAll(/\b(readdir|readdirSync|opendir|opendirSync|glob|globSync)\b/g)) {
            hits.push({ file: `src/main/${e.name}`, matched: m[0] })
          }
        }
      }
    }
    walk(dir)
    return { count: hits.length, hits: hits.slice(0, 12) }
  })()
}

// ---------------------------------------------------------------------------
// Shared: a warm query with no prompt ever pushed. Costs no turn.
//
// `binary` selects which Claude Code answers. The app's own choice is 'host'
// (cli-path.ts: follow the host install when there is one), and that is the
// default everywhere below. 'bundled' omits pathToClaudeCodeExecutable, which
// is what selects the SDK's pinned copy — used ONLY by the binary-sensitivity
// section, because the two do not answer this request the same way and
// cli-path.ts's own comment says the app tracks whatever the user installed.
const openHandle = (cwd, binary = 'host') =>
  query({
    prompt: (async function* () {
      // Never yields. The handle is what is being measured, not a conversation.
      await new Promise(() => {})
    })(),
    options: {
      cwd,
      includePartialMessages: true,
      env: appEnv,
      ...(binary === 'host' ? cliOptions : {})
    }
  })

// ---------------------------------------------------------------------------
// 2 AUTOCOMPLETE (Q2) — probed by CALLING.
//
// Runs before Q1 because it is free and because its answer changes what Q1 and
// Q3 are for.

const FILE_HINT = /file|suggest|mention|complete|path|glob|list|dir/i

// A suggestion is IN the workspace iff it is relative and does not climb out of
// it. Both halves are needed: the CLI answers relative paths, but it also
// answers `..\..\..\` escapes and absolute paths, and a popover fed by this
// would insert whichever it was handed.
const classifyPath = (p) => {
  const s = String(p ?? '')
  if (s === '') return 'empty'
  if (isAbsolute(s)) return 'absolute'
  if (s.startsWith('..' + sep) || s.startsWith('../')) return 'parent-escape'
  return 'in-workspace'
}

// Redacted sample: an in-workspace path is safe to record verbatim (it is this
// repo, which is public); anything else is recorded as its class plus its
// SHAPE only — segment count and extension — never its text.
const redact = (p) => {
  const cls = classifyPath(p)
  if (cls === 'in-workspace') return { class: cls, path: String(p) }
  const s = String(p ?? '')
  return {
    class: cls,
    segments: s.split(/[\\/]/).filter(Boolean).length,
    endsWithSeparator: /[\\/]$/.test(s),
    extension: /\.[a-z0-9]+$/i.exec(s)?.[0] ?? null
  }
}

const probeMatcher = async (q, probes) => {
  const out = []
  for (const p of probes) {
    const started = process.hrtime.bigint()
    let res
    try {
      const r = await q.request({ subtype: 'file_suggestions', query: p })
      const sug = Array.isArray(r?.response?.suggestions) ? r.response.suggestions : []
      const paths = sug.map((x) => x?.path)
      const classes = paths.reduce((acc, x) => {
        const c = classifyPath(x)
        acc[c] = (acc[c] ?? 0) + 1
        return acc
      }, {})
      res = {
        query: p,
        ok: true,
        total: sug.length,
        byClass: classes,
        inWorkspace: classes['in-workspace'] ?? 0,
        outsideWorkspace: (classes['absolute'] ?? 0) + (classes['parent-escape'] ?? 0),
        // Fields the row actually carried — a build would need to know whether
        // there is more than `path` to render.
        rowFields: [...new Set(sug.flatMap((x) => (x && typeof x === 'object' ? Object.keys(x) : [typeof x])))].sort(),
        sample: paths.slice(0, 5).map(redact)
      }
    } catch (err) {
      res = { query: p, ok: false, threw: String(err?.message ?? err).slice(0, 240) }
    }
    res.ms = Math.round(Number(process.hrtime.bigint() - started) / 1e6)
    out.push(res)
  }
  return out
}

// Prefixes chosen so that a zero is NOT vacuous: each names something that
// certainly exists in the workspace it is asked against. An empty result for
// `package` in a directory containing package.json is a measurement.
const REPO_PROBES = ['', 'p', 'pack', 'package', 'package.json', 'src', 'src' + sep, 'scripts', 'CLAUDE', 'engine']
const TEMP_PROBES = ['', 'a', 'al', 'alpha', 'alpha.txt', 'beta', 'nested', 'nested' + sep, 'gamma', '@alpha']

const measureRoute = async () => {
  const out = { ranAt: new Date().toISOString() }

  // (a) The runtime surface, enumerated from the OBJECT — own properties and the
  // whole prototype chain — not from sdk.d.ts. This is the step the ticket
  // insists on: a name is not a route, and a missing name is not its absence.
  const q = openHandle(repoRoot)
  try {
    // Warm the handle. supportedCommands() resolves the initialization the
    // control channel needs, and #114's landmine says not to gate on `init`:
    // a non-empty answer here IS the liveness check.
    const cmds = await q.supportedCommands()
    out.warm = { supportedCommandsCount: Array.isArray(cmds) ? cmds.length : null }
  } catch (err) {
    out.warm = { error: String(err?.message ?? err).slice(0, 240) }
  }

  const names = new Set()
  for (let o = q; o && o !== Object.prototype; o = Object.getPrototypeOf(o)) {
    for (const n of Object.getOwnPropertyNames(o)) names.add(n)
  }
  const callable = [...names]
    .filter((n) => {
      try {
        return typeof q[n] === 'function'
      } catch {
        return false
      }
    })
    .sort()

  out.runtimeSurface = {
    callableCount: callable.length,
    // The ticket's own framing: is there a NAMED caller for this?
    namedFileSuggestionCaller: callable.filter((n) => /suggest/i.test(n)),
    nameLevelCandidates: callable.filter((n) => FILE_HINT.test(n)),
    hasGenericDispatcher: callable.includes('request'),
    note:
      'Every named control method on this object is a wrapper over request({subtype}). That is why an absent name (#88) proves nothing and why the probe below calls the dispatcher directly.'
  }

  // (b) THE NEGATIVE CONTROL, sent first so nothing below is scored without it.
  try {
    await q.request({ subtype: 'spike116_definitely_not_a_real_subtype' })
    out.negativeControl = {
      refused: false,
      verdict:
        'UNSCORED — the CLI accepted a subtype that does not exist, so a success on file_suggestions says nothing about support.'
    }
  } catch (err) {
    const text = String(err?.message ?? err).slice(0, 240)
    out.negativeControl = {
      refused: true,
      refusalText: text,
      verdict: 'The CLI refuses unknown subtypes by name, so a success below is a real accept.'
    }
  }

  // (c) The call itself, against this repo.
  out.repo = {
    workspace: 'the repo itself',
    probes: await probeMatcher(q, REPO_PROBES)
  }

  q.close()

  // (d) CAUSE SEPARATION (spike-105's design). If non-empty prefixes answer
  // empty here, is that about THIS repo — its size, its .gitignore, its
  // node_modules — or about the matcher? A fresh three-file workspace has none
  // of those properties, so running the same probe there separates them.
  const tempCwd = mkdtempSync(join(tmpdir(), 'spike-116-ws-'))
  writeFileSync(join(tempCwd, 'alpha.txt'), 'a\n')
  writeFileSync(join(tempCwd, 'beta.md'), 'b\n')
  mkdirSync(join(tempCwd, 'nested'))
  writeFileSync(join(tempCwd, 'nested', 'gamma.ts'), 'export const g = 1\n')

  const q2 = openHandle(tempCwd)
  try {
    await q2.supportedCommands()
  } catch {
    /* recorded by the probe's own throw path */
  }
  out.freshWorkspace = {
    workspace: 'a fresh temp dir holding exactly 3 files and 1 nested dir',
    fileCount: 3,
    binary: 'host (the app\'s own choice — cli-path.ts)',
    probes: await probeMatcher(q2, TEMP_PROBES)
  }
  q2.close()

  // (e) BINARY SENSITIVITY. The same request against the SDK's BUNDLED CLI, in
  // the same fresh workspace, with only pathToClaudeCodeExecutable removed.
  //
  // This section exists because the two answers differ, and the difference is
  // not a detail: cli-path.ts makes the app follow the HOST install precisely so
  // it cannot silently drift onto the pinned copy, and its own comment records
  // the trade — "the app now tracks whatever Claude Code the user installs,
  // including a version it has never been tested against". A file-suggestion
  // surface would inherit that trade, so what the OTHER binary does is a fact
  // about the feature's blast radius rather than trivia. Attribution here is to
  // the BINARY, and it is separated by changing nothing else (#105's design).
  const q3 = openHandle(tempCwd, 'bundled')
  try {
    await q3.supportedCommands()
  } catch {
    /* recorded by the probe's own throw path */
  }
  out.bundledBinaryInSameWorkspace = {
    workspace: 'the same fresh temp dir as freshWorkspace above',
    binary: 'SDK-bundled (pathToClaudeCodeExecutable omitted)',
    onlyDifference: 'pathToClaudeCodeExecutable — cwd, env and probe set are identical',
    probes: await probeMatcher(q3, TEMP_PROBES)
  }
  q3.close()

  // (f) REPETITION, for the one behaviour a single shot cannot settle.
  //
  // While this harness was being built, the SAME request in a temp workspace
  // answered with paths from OUTSIDE it — entries under the user's home
  // ~/.claude tree, and `..\..\..\..\..\..\`-escaping paths into an unrelated
  // directory — for the queries below, while a later single-shot run of the
  // finished harness returned zero for the identical query. One observation of
  // either kind therefore settles nothing on its own.
  //
  // #104's lesson verbatim: a single-shot instrument cannot measure something
  // intermittent, and for a hazard the finding that matters is REACHABILITY,
  // which ONE positive observation settles. So this repeats and stops at the
  // first out-of-workspace path. An all-clean run does NOT refute the hazard and
  // says so in its own verdict — it is the weaker of the two outcomes.
  //
  // This is not a curiosity. A popover fed by this request would render, and on
  // accept INSERT, whatever path it was handed; a path outside the open
  // workspace is both a disclosure of the user's disk and a reference the CLI
  // would then act on. Whether that is reachable decides whether a build needs
  // its own scoping boundary or can trust the CLI's answer.
  const LEAK_PROBES = ['g', 'gamma', 'a', 'al', '.' + sep + 'a', 'src', 'e']
  const ROUNDS = 4
  const leak = { rounds: ROUNDS, probes: LEAK_PROBES, observations: [], firstLeakAtRound: null }

  for (let round = 1; round <= ROUNDS && leak.firstLeakAtRound === null; round++) {
    // A FRESH handle each round: the exploratory observation came from a handle
    // that had already served ~10 requests, so handle age is a candidate and
    // holding it fixed across rounds would hide it.
    const qr = openHandle(tempCwd)
    try {
      await qr.supportedCommands()
    } catch {
      /* the probe's own throw path records it */
    }
    const rows = await probeMatcher(qr, LEAK_PROBES)
    qr.close()
    const outside = rows.reduce((n, r) => n + (r.outsideWorkspace ?? 0), 0)
    leak.observations.push({
      round,
      totalSuggestions: rows.reduce((n, r) => n + (r.total ?? 0), 0),
      outsideWorkspace: outside,
      byQuery: rows.map((r) => ({ query: r.query, total: r.total ?? null, outside: r.outsideWorkspace ?? null }))
    })
    if (outside > 0) leak.firstLeakAtRound = round
  }

  // The observation this section exists to chase, recorded verbatim because it
  // is EVIDENCE and this harness could not reproduce it. It came from the
  // exploratory probing that preceded the harness, not from a scored run here,
  // and it is labelled as such so a reader can weigh it accordingly — but a
  // finding that was seen once and not reproduced is unexplained, NOT refuted.
  leak.priorObservation = {
    provenance:
      'Exploratory probing on 2026-08-05 that preceded this harness — not a scored run of this file. Recorded because it happened and could not be reproduced below.',
    workspace: 'a fresh temp dir holding exactly 3 files, the same shape as freshWorkspace',
    queriesThatAnswered: ['g', 'gamma', '.\\a'],
    whatCameBack: {
      'g': '15 suggestions, none in the workspace — entries under the user home ~/.claude tree, plus a `..\\..\\..\\..\\..\\..\\`-escaping path into an unrelated directory',
      'gamma': '3 suggestions, all `..\\..\\..\\..\\..\\..\\`-escaping paths into an unrelated directory',
      '.\\a': '15 suggestions, none in the workspace'
    },
    sameRunNegatives: ['a', 'al', 'alpha', 'alpha.txt', 'beta', 'nested'],
    note:
      'Workspace files did NOT match while out-of-workspace paths did, in the same run on the same handle — so this was not simply "the index is warm now".',
    variablesSinceControlledAndEXCLUDED: [
      'the CLI binary (host vs SDK-bundled — binariesAgree above)',
      'options.env (omitted vs resolveSpawnEnv output — both scoped)',
      'handle age (a fresh handle per round below)',
      'probe order'
    ]
  }

  leak.verdict =
    leak.firstLeakAtRound !== null
      ? `REACHABLE — a path outside the open workspace came back at round ${leak.firstLeakAtRound} of ${ROUNDS}. One observation settles reachability; the rate is NOT measured here and must not be read off these rounds.`
      : `NOT REPRODUCED in ${ROUNDS} rounds x ${LEAK_PROBES.length} probes, after excluding binary, env, handle age and probe order as causes. This is the WEAK outcome and it is NOT a refutation: priorObservation below records the behaviour actually being seen, and an intermittent hazard that did not fire is not an absent one. The mechanism is UNKNOWN. A build must scope suggestions to the workspace itself rather than trust the CLI's answer to be scoped.`
  out.outOfWorkspaceSuggestions = leak

  // (g) The verdict, which names its own evidence and refuses to reach one when
  // the negative control did not hold.
  // The app-relevant tally counts ONLY the binary the app actually spawns. The
  // bundled run is tallied separately and never folded in — averaging the two
  // would describe a configuration that does not exist.
  const tally = (probes) => {
    const ok = probes.filter((p) => p.ok)
    const emptyQ = ok.filter((p) => p.query === '')
    const nonEmptyQ = ok.filter((p) => p.query !== '')
    return {
      scoredProbes: ok.length,
      threw: probes.length - ok.length,
      emptyQueryProbes: emptyQ.length,
      emptyQueryAnswered: emptyQ.filter((p) => p.total > 0).length,
      nonEmptyProbes: nonEmptyQ.length,
      nonEmptyAnswered: nonEmptyQ.filter((p) => p.total > 0).length,
      nonEmptyWithAnyInWorkspaceHit: nonEmptyQ.filter((p) => p.inWorkspace > 0).length,
      nonEmptyReturningPathsOutsideTheWorkspace: nonEmptyQ.filter((p) => p.outsideWorkspace > 0).length
    }
  }

  const hostProbes = [...out.repo.probes, ...out.freshWorkspace.probes]
  const all = hostProbes.filter((p) => p.ok)
  const emptyQ = all.filter((p) => p.query === '')
  const nonEmptyQ = all.filter((p) => p.query !== '')

  const emptyAnswered = emptyQ.filter((p) => p.total > 0).length
  const nonEmptyWithInWorkspaceHit = nonEmptyQ.filter((p) => p.inWorkspace > 0).length
  const nonEmptyLeakingOutside = nonEmptyQ.filter((p) => p.outsideWorkspace > 0).length

  out.summary = {
    hostBinary_theOneTheAppSpawns: tally(hostProbes),
    bundledBinary_notWhatTheAppSpawns: tally(out.bundledBinaryInSameWorkspace.probes),
    everyProbeThrew: all.length === 0,
    binariesAgree:
      tally(hostProbes).nonEmptyWithAnyInWorkspaceHit ===
        tally(out.bundledBinaryInSameWorkspace.probes).nonEmptyWithAnyInWorkspaceHit &&
      tally(hostProbes).nonEmptyReturningPathsOutsideTheWorkspace ===
        tally(out.bundledBinaryInSameWorkspace.probes).nonEmptyReturningPathsOutsideTheWorkspace
  }

  out.answer = !out.negativeControl.refused
    ? 'UNSCORED — see negativeControl'
    : all.length === 0
      ? 'NO — every call threw; see the probe rows'
      : nonEmptyWithInWorkspaceHit > 0
        ? `YES, AND USABLE — the dispatcher answers file_suggestions and ${nonEmptyWithInWorkspaceHit}/${nonEmptyQ.length} non-empty prefixes matched a file inside the workspace.`
        : emptyAnswered > 0
          ? `YES, BUT NOT AS A WORKSPACE FILE PICKER — the route is reachable (the CLI accepts the subtype and refuses a bogus one) and an EMPTY query returns the workspace's own top level, but ${nonEmptyQ.length}/${nonEmptyQ.length} non-empty prefixes returned ZERO in-workspace matches across two different workspaces, and ${nonEmptyLeakingOutside} returned paths from OUTSIDE the workspace. ` +
            (out.summary.binariesAgree
              ? 'The SDK-bundled binary answers the same way, so this is not an artefact of which CLI the app spawns.'
              : 'The SDK-bundled binary answers the SAME requests DIFFERENTLY (see bundledBinaryInSameWorkspace), so the behaviour is a property of the installed CLI rather than of the request.')
          : 'REACHABLE BUT EMPTY — the subtype is accepted and every probe, including the empty query, returned nothing. Nothing here is exercised; treat as unmeasured.'

  return out
}

// ---------------------------------------------------------------------------
// 1 RESOLUTION (Q1) — does `@path` in ordinary prompt text get resolved?
//
// THREE ARMS, because a correct answer has more than one possible cause and a
// single arm cannot tell them apart (#105's lesson, and #90's).
//
//   A  positive control : names the file WITHOUT `@`, tools AVAILABLE.
//                         Must succeed. If it does not, the instrument is
//                         broken and arms B and C are unscored — #114 caught
//                         exactly this failure three times in one leg.
//   B  the measurement  : `@notes.txt`, every file-reading tool REMOVED.
//                         Answering the sentinel with no tool to read it means
//                         the content reached the model out of band.
//   C  negative control : the same prompt WITHOUT `@`, same tools removed. If C
//                         also answers, B's success was never attributable to
//                         `@` — the file got there some other way.
//
// The sentinel is random per run, so no arm can answer from anything but this
// run's file.
//
// WHY THE DENIAL IS `disallowedTools` AND NOT `canUseTool`. The first version of
// this harness denied through canUseTool and produced a WRONG headline: arm A
// answered having consulted canUseTool ZERO times, which is impossible to read
// as "the tool was allowed" and is in fact the SDK never asking. engine.ts
// states the rule this broke — "canUseTool stays wired above — the SDK only
// invokes it when the mode asks" — and `settingSources`, which this app leaves
// omitted, documents that ALL filesystem settings load by default, so the
// user's own `permissions.defaultMode` governs whether the callback is ever
// consulted. On this machine that default is `bypassPermissions`, so the denial
// silently did nothing and "answered without tools" meant "answered using tools
// the harness never saw".
//
// `disallowedTools` cannot be defeated that way: the tools are "removed from the
// model's context and cannot be used, even if they would otherwise be allowed".
// canUseTool stays wired underneath purely as a RECORDER, and a non-zero attempt
// count in a denied arm is now itself a red flag rather than the mechanism.
//
// This is the instrument's ONE deliberate departure from the app's option shape,
// and it is confined to the confound it exists to remove: cwd, env and the CLI
// binary — everything that decides whether `@` is resolved — stay identical to
// what engine.ts sends.

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

// Everything that could put a file's bytes in front of the model. Generous on
// purpose: a tool left off this list is a hole in arms B and C, and the cost of
// naming one that does not exist is nothing.
const READING_TOOLS = [
  'Read',
  'Bash',
  'Glob',
  'Grep',
  'Task',
  'Agent',
  'NotebookRead',
  'NotebookEdit',
  'Edit',
  'Write',
  'WebFetch',
  'WebSearch',
  'BashOutput',
  'SlashCommand'
]

const runArm = async ({ label, promptText, toolsRemoved, cwd, sentinel, timeoutMs = 180_000 }) => {
  const out = {
    label,
    promptShape: promptText.replace(sentinel, '<SENTINEL>'),
    toolsRemoved,
    disallowedTools: toolsRemoved ? READING_TOOLS : [],
    toolAttempts: [],
    toolUseBlocks: [],
    ranTurn: false,
    turnIsError: null,
    answeredSentinel: null,
    sentinelInStreamBeforeAnswer: false,
    error: null
  }

  const queue = createMessageQueue()
  const messages = []
  let q
  try {
    q = query({
      prompt: queue.iterable,
      options: {
        cwd,
        includePartialMessages: true,
        // The app's shape: canUseTool is always wired (engine.ts). Here it is a
        // RECORDER, not the denial — see the note above. It allows, because in
        // arms B and C the reading tools are already gone from the model's
        // context and anything still asking is something this list missed,
        // which is a fact worth surfacing rather than suppressing.
        canUseTool: async (name, input, o) => {
          out.toolAttempts.push({ name, keys: Object.keys(input ?? {}).sort() })
          return { behavior: 'allow', toolUseID: o.toolUseID, decisionClassification: 'user_temporary' }
        },
        ...(toolsRemoved ? { disallowedTools: READING_TOOLS } : {}),
        env: appEnv,
        ...cliOptions
      }
    })
  } catch (err) {
    out.error = `query() threw: ${String(err?.message ?? err).slice(0, 240)}`
    return out
  }

  let answerText = ''
  let resolveTurn = null
  let sawAssistantText = false

  const consume = (async () => {
    try {
      for await (const msg of q) {
        messages.push(msg)
        // Did the sentinel cross the wire BEFORE the model said anything? That
        // is direct evidence of expansion rather than inference from the answer.
        if (!sawAssistantText) {
          const blob = JSON.stringify(msg)
          if (blob.includes(sentinel)) out.sentinelInStreamBeforeAnswer = true
        }
        if (msg.type === 'assistant' && msg.message?.model !== '<synthetic>') {
          const blocks = Array.isArray(msg.message?.content) ? msg.message.content : []
          for (const b of blocks) {
            // The witness canUseTool cannot provide. A tool that runs without
            // the callback ever being consulted — which is what the ambient
            // bypassPermissions default produced in this harness's first
            // version — still emits a tool_use block here. Counting BOTH is
            // what makes "the model used no tool" an observation rather than an
            // assumption about the permission mode.
            if (b?.type === 'tool_use') {
              out.toolUseBlocks.push(typeof b.name === 'string' ? b.name : '<unnamed>')
            }
            if (b?.type === 'text' && typeof b.text === 'string') {
              sawAssistantText = true
              answerText += b.text
            }
          }
        }
        if (msg.type === 'result') {
          out.ranTurn = true
          // #87's landmine: subtype is 'success' even on a failed turn.
          out.turnIsError = msg.is_error === true
          out.resultSubtype = String(msg.subtype ?? '')
          if (typeof msg.result === 'string') answerText += '\n' + msg.result
          resolveTurn?.()
          resolveTurn = null
        }
      }
    } catch (err) {
      out.error = `stream threw: ${String(err?.message ?? err).slice(0, 240)}`
      resolveTurn?.()
      resolveTurn = null
    }
  })()

  await new Promise((resolve) => {
    const timer = setTimeout(() => {
      out.error = out.error ?? 'turn timed out'
      resolveTurn?.()
      resolveTurn = null
    }, timeoutMs)
    resolveTurn = () => {
      clearTimeout(timer)
      resolve()
    }
    queue.push({
      type: 'user',
      message: { role: 'user', content: promptText },
      parent_tool_use_id: null,
      origin: { kind: 'human' }
    })
  })

  queue.end()
  try {
    q.close()
  } catch {
    /* closing a finished handle is not a finding */
  }
  await consume

  out.answeredSentinel = answerText.includes(sentinel)
  out.answerLength = answerText.length
  out.toolAttemptCount = out.toolAttempts.length
  out.toolNamesAttempted = [...new Set(out.toolAttempts.map((t) => t.name))].sort()
  out.toolUseBlockCount = out.toolUseBlocks.length
  out.toolUseNames = [...new Set(out.toolUseBlocks)].sort()
  // In a tools-removed arm this MUST be empty. A name here is a tool the
  // READING_TOOLS list failed to remove, which would void the arm.
  out.unremovedToolsUsed = toolsRemoved ? out.toolUseNames : []
  raw(`${label}-messages.json`, JSON.stringify(messages, null, 2))
  return out
}

const measureResolution = async () => {
  const sentinel = `SPIKE116-${randomBytes(8).toString('hex').toUpperCase()}`
  const cwd = mkdtempSync(join(tmpdir(), 'spike-116-res-'))
  // The file name gives nothing away; only its CONTENT carries the sentinel, so
  // a listing of the directory cannot answer any arm.
  writeFileSync(join(cwd, 'notes.txt'), `${sentinel}\n`)

  const ask = (ref) =>
    `What is the token on the first line of ${ref}? Reply with only that token and nothing else.`

  const armA = await runArm({
    label: 'A-positive-control',
    promptText: ask('notes.txt'),
    toolsRemoved: false,
    cwd,
    sentinel
  })

  // #114's rule: an instrument that fails its own setup will report that as the
  // phenomenon. Arms B and C are not run — let alone scored — unless A worked.
  const setupOk = armA.ranTurn && armA.error === null && armA.answeredSentinel === true

  const armB = setupOk
    ? await runArm({
        label: 'B-at-mention-tools-removed',
        promptText: ask('@notes.txt'),
        toolsRemoved: true,
        cwd,
        sentinel
      })
    : { label: 'B-at-mention-tools-removed', skipped: 'positive control failed' }

  const armC = setupOk
    ? await runArm({
        label: 'C-negative-control-tools-removed',
        promptText: ask('notes.txt'),
        toolsRemoved: true,
        cwd,
        sentinel
      })
    : { label: 'C-negative-control-tools-removed', skipped: 'positive control failed' }

  // The removal has to have WORKED for either denied arm to mean anything. This
  // is the check whose absence produced this harness's first, wrong headline.
  const removalHeld =
    setupOk &&
    (armB.unremovedToolsUsed?.length ?? 0) === 0 &&
    (armC.unremovedToolsUsed?.length ?? 0) === 0

  const out = {
    sentinelShape: 'SPIKE116-<16 hex>, random per run',
    workspace: 'a fresh temp dir holding exactly one file, notes.txt',
    positiveControlHeld: setupOk,
    toolRemovalHeld: removalHeld,
    removedTools: READING_TOOLS,
    instrumentNote:
      'Arms B and C add disallowedTools; nothing else departs from engine.ts\'s option shape. canUseTool is a recorder here, not the denial — see the header. Both witnesses are reported per arm: canUseTool consultations (toolAttemptCount) AND tool_use blocks seen in the stream (toolUseBlockCount), because the ambient permission mode can make the first zero while the second is not.',
    armA,
    armB,
    armC
  }

  out.answer = !setupOk
    ? `UNSCORED — the positive control did not hold (ranTurn=${armA.ranTurn}, answered=${armA.answeredSentinel}, error=${armA.error}). Nothing about \`@\` can be read off arms B and C, and this run measures the instrument rather than the CLI.`
    : !removalHeld
      ? `UNSCORED — a tool survived removal and ran in a denied arm (B: ${JSON.stringify(armB.unremovedToolsUsed)}, C: ${JSON.stringify(armC.unremovedToolsUsed)}). Add it to READING_TOOLS and re-run; until then neither denied arm measures \`@\`.`
      : armB.answeredSentinel && !armC.answeredSentinel
        ? `YES — with every file-reading tool removed from the model's context, the \`@notes.txt\` arm answered the run-random sentinel (${armB.toolUseBlockCount} tool_use blocks) and the identical prompt WITHOUT \`@\` did not (${armC.toolUseBlockCount} tool_use blocks). The content reached the model out of band, which is the CLI resolving the mention.`
        : armB.answeredSentinel && armC.answeredSentinel
          ? 'NOT ATTRIBUTABLE — both tools-removed arms answered, so the file reached the model by some route that does not need `@`. This run cannot credit the mention.'
          : !armB.answeredSentinel && armC.answeredSentinel
            ? 'CONTRADICTORY — the control answered and the measurement did not. Treat the run as unscored and re-run.'
            : 'NO — with every file-reading tool removed the `@` arm could not produce the sentinel, while the positive control could. `@path` is not expanded into the prompt on this CLI through this options shape.'

  return out
}

// ---------------------------------------------------------------------------
// 3 COST (Q3) — if the app must enumerate the workspace itself, what does one
// listing cost?
//
// Measured against the numbers already on this record, so the comparison is to
// this app rather than to nothing: the `/` popover re-fetches on EVERY
// keystroke because it is a call on a WARM query (~1ms, #112); a rebuilt engine
// costs a median ~5.5s (#112); the app's one child_process spawn costs ~893ms
// per look (#90).

const REPS = 5
const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b)
  return Math.round(s[(s.length - 1) >> 1])
}

const walkSync = (root, { prune }) => {
  let files = 0
  let dirs = 0
  const stack = [root]
  while (stack.length) {
    const d = stack.pop()
    let entries
    try {
      entries = readdirSync(d, { withFileTypes: true })
    } catch {
      continue
    }
    for (const e of entries) {
      if (e.isDirectory()) {
        if (prune.includes(e.name)) continue
        dirs++
        stack.push(join(d, e.name))
      } else {
        files++
      }
    }
  }
  return { files, dirs }
}

const timeIt = (fn) => {
  const ms = []
  let last
  for (let i = 0; i < REPS; i++) {
    const t = process.hrtime.bigint()
    last = fn()
    ms.push(Number(process.hrtime.bigint() - t) / 1e6)
  }
  return { reps: REPS, medianMs: median(ms), minMs: Math.round(Math.min(...ms)), maxMs: Math.round(Math.max(...ms)), result: last }
}

const measureCost = () => {
  const pruned = timeIt(() => walkSync(repoRoot, { prune: ['node_modules', '.git', 'out', 'dist'] }))
  const unpruned = timeIt(() => walkSync(repoRoot, { prune: [] }))

  // git ls-files gets .gitignore semantics for free — and costs a child_process
  // spawn, which would be the app's SECOND ever after #90's agent-view.ts. That
  // is an architectural cost, so it is priced rather than assumed cheap.
  const gitTimes = []
  let gitCount = null
  let gitStatus = null
  for (let i = 0; i < REPS; i++) {
    const t = process.hrtime.bigint()
    const r = spawnSync('git', ['ls-files'], { cwd: repoRoot, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
    gitTimes.push(Number(process.hrtime.bigint() - t) / 1e6)
    gitStatus = r.status
    if (r.status === 0) gitCount = r.stdout.split('\n').filter(Boolean).length
  }

  return {
    note:
      'In-process walks need no child_process. The git route buys .gitignore semantics and costs a spawn — the app has exactly one today (#90), and adding a second is an architectural call rather than a detail.',
    inProcessWalk_pruned: {
      prunes: ['node_modules', '.git', 'out', 'dist'],
      files: pruned.result.files,
      dirs: pruned.result.dirs,
      medianMs: pruned.medianMs,
      minMs: pruned.minMs,
      maxMs: pruned.maxMs
    },
    inProcessWalk_unpruned: {
      files: unpruned.result.files,
      dirs: unpruned.result.dirs,
      medianMs: unpruned.medianMs,
      minMs: unpruned.minMs,
      maxMs: unpruned.maxMs
    },
    gitLsFiles: {
      requiresChildProcess: true,
      exitStatus: gitStatus,
      fileCount: gitCount,
      medianMs: median(gitTimes),
      minMs: Math.round(Math.min(...gitTimes)),
      maxMs: Math.round(Math.max(...gitTimes))
    },
    referencePoints: {
      slashPopoverPerKeystroke_warmQuery_ms: 1,
      slashPopoverAfterEngineRebuild_ms: 5500,
      agentViewSubprocessPerLook_ms: 893,
      source: '#112 (both list numbers) and #90 (the spawn), read off this record rather than re-measured here'
    }
  }
}

// ---------------------------------------------------------------------------
const cliVersion = (() => {
  const r = spawnSync(cliBin, ['--version'], { encoding: 'utf8' })
  return (r.stdout ?? '').trim() || null
})()

const electronVersion = (() => {
  try {
    return JSON.parse(readFileSync(join(repoRoot, 'node_modules', 'electron', 'package.json'), 'utf8')).version ?? null
  } catch {
    return null
  }
})()

const findings = {
  spike: 116,
  question: 'Is `@` file autocomplete reachable from this app at all?',
  measuredAt: new Date().toISOString(),
  phasesRun: PHASES,
  runDirName: runDir.split(/[\\/]/).pop(),
  runDirParent: 'OS temp dir (os.tmpdir())',
  env: {
    backendMode: mode,
    hostCliUsed: hostCli !== null,
    cliVersion,
    sdkVersion: pkgJson?.version ?? null,
    electronVersion,
    platform: process.platform,
    node: process.version
  },
  scrubbing:
    'Counts, classifications, shapes and timings. A suggestion path is recorded verbatim ONLY when it is inside the workspace (this public repo); anything absolute or ../-escaping is reduced to its class, segment count and extension. No home directory, username or absolute path is written here.',
  q0_sourceFacts: sourceFacts,
  q2_autocompleteRoute: runs('2') ? await measureRoute() : { skipped: 'phase 2 not selected' },
  q1_resolution: runs('1') ? await measureResolution() : { skipped: 'phase 1 not selected' },
  q3_cost: runs('3') ? measureCost() : { skipped: 'phase 3 not selected' }
}

// What an all-negative run does and does not prove, stated by the instrument
// itself rather than left to the reader (the ticket's first acceptance line).
findings.whatANegativeRunProves = {
  q2:
    'A zero from Q2 is a measurement ONLY IF negativeControl.refused is true — otherwise the dispatcher accepts anything and a success means nothing. An empty suggestion list for a prefix is a measurement only for prefixes that name something present in that workspace, which is why the probe set is chosen against the workspace it is asked about.',
  q1:
    'A NO from Q1 is a measurement ONLY IF positiveControlHeld is true. If arm A could not answer with tools available, arms B and C measure a broken instrument (#114 hit this three times in one leg). A YES additionally requires (a) toolRemovalHeld — no removed tool actually ran — and (b) arm C to have FAILED, since otherwise the file arrived by a route that never needed the mention. The first version of this harness satisfied neither and printed a confident YES anyway; the denial was canUseTool, which the ambient permission mode never consulted.',
  q3:
    'These timings are one machine, one repo, warm cache. They bound the ORDER of the cost, not its value on a user\'s disk, and a cold first walk is not measured here.',
  general:
    'Every answer above names the run it came from via measuredAt + runDirName. A rename in the SDK shows up as changed text in q0_sourceFacts rather than as a silent false.'
}

writeFileSync(findingsPath, JSON.stringify(findings, null, 2) + '\n')

const r2 = findings.q2_autocompleteRoute
const r1 = findings.q1_resolution
const r3 = findings.q3_cost

console.log('\n=== spike 116 ===')
console.log(`Q2 AUTOCOMPLETE : ${r2.answer ?? r2.skipped}`)
if (r2.negativeControl) console.log(`   neg control  : refused=${r2.negativeControl.refused} "${r2.negativeControl.refusalText ?? ''}"`)
if (r2.summary) console.log(`   summary      : ${JSON.stringify(r2.summary)}`)
console.log(`Q1 RESOLUTION   : ${r1.answer ?? r1.skipped}`)
if (r3.inProcessWalk_pruned) {
  console.log(
    `Q3 COST         : in-process walk ${r3.inProcessWalk_pruned.medianMs}ms (${r3.inProcessWalk_pruned.files} files, pruned) | ` +
      `unpruned ${r3.inProcessWalk_unpruned.medianMs}ms (${r3.inProcessWalk_unpruned.files}) | git ls-files ${r3.gitLsFiles.medianMs}ms (${r3.gitLsFiles.fileCount})`
  )
} else {
  console.log(`Q3 COST         : ${r3.skipped}`)
}
console.log(`\nraw:      ${runDir}`)
console.log(`findings: ${findingsPath.pathname}`)
