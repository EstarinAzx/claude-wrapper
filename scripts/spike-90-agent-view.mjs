// Spike #90 — are the CLI's background sessions reachable from this app at all?
//
// Fifth sibling of spike-81/87/88/89, same construction and the same import
// rule: the app's REAL src/main/cli-path.ts, so the binary measured here cannot
// drift from the binary the app spawns. src/main/backend-mode.ts comes in for
// the one config that starts a real query() (#87: unsetting ANTHROPIC_BASE_URL
// by hand is NOT native mode).
//
//   node --experimental-strip-types scripts/spike-90-agent-view.mjs
//
// This spike BUILDS NOTHING. The surface is #91 and is blocked; #86 carries the
// constraint that kills every avenue for it. What is answered here is whether
// the DATA is reachable, by which route, at what cost, and with what vocabulary.
//
// SIX QUESTIONS, one section each below:
//   1 SDK      — does the TS SDK expose background sessions at all?
//   2 SUBPROC  — if not, can the app run `claude agents --json`?
//   3 PAYLOAD  — field set, types, and the full `state` vocabulary
//   4 CHANNEL  — push or poll?
//   5 COST     — wall-clock for one call, since a poll multiplies it
//   6 SCOPE    — does --cwd scope the way a workspace-scoped app needs?
//
// THE INSTRUMENT IS IN ITS OWN READING. `--json` prints interactive AND
// background sessions, and this script runs inside a Claude Code session by
// construction (#89). That is not filtered away: the self row is identified by
// an IDENTITY JOIN on CLAUDE_CODE_SESSION_ID / CLAUDE_PID, and every count is
// reported both raw and self-excluded so no number quietly includes the
// instrument.
//
// SCRUBBING, as #87/#88/#89. Nothing identifying leaves the temp dir. The rows
// carry `cwd`, `name`, `sessionId`, `id` and `pid` — user paths, prompt-derived
// titles and live process ids — and the daemon roster additionally carries
// SOCKET PATHS AND ATTACH CREDENTIALS (`rvAuth`, `ptyAuth`, `dispatch.env`).
// The findings file records shapes, counts, vocabularies, booleans and timings
// ONLY. No value from any row, and no roster value at all, is written to it.

import { mkdtempSync, writeFileSync, readFileSync, readdirSync, existsSync } from 'node:fs'
import { tmpdir, homedir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import * as sdk from '@anthropic-ai/claude-agent-sdk'
import { query } from '@anthropic-ai/claude-agent-sdk'

const { resolveHostCli, toCliOptions } = await import('../src/main/cli-path.ts')
const { snapshotWispEnv, resolveSpawnEnv, initialMode } = await import('../src/main/backend-mode.ts')

const runDir = mkdtempSync(join(tmpdir(), 'spike-90-'))
const findingsPath = new URL('./spike-90-findings.json', import.meta.url)

const hostCli = resolveHostCli(process.env['PATH'], process.platform)
const cliOptions = toCliOptions(hostCli)
const cliBin = hostCli ?? 'claude'

// The identity join that finds the instrument in its own reading. Both are
// exported by a Claude Code session into its own children, so they are this
// process's own provenance rather than a guess from cwd or start time.
const selfSessionId = process.env['CLAUDE_CODE_SESSION_ID'] ?? null
const selfPid = process.env['CLAUDE_PID'] ? Number(process.env['CLAUDE_PID']) : null

const raw = (name, data) => writeFileSync(join(runDir, name), data)

// ---------------------------------------------------------------------------
// 1 SDK — does the TS SDK expose background sessions at all?
//
// Asked of the SHIPPED MODULE, not of a grep: every export name is enumerated
// and tested. A grep over sdk.d.ts answers what the types mention; importing
// answers what the app could actually call. The distinction matters because
// `BackgroundTaskSummary` and `SDKBackgroundTasksChangedMessage` DO exist as
// types (#83 consumes the latter) and they are about background TASKS INSIDE
// one session — the third meaning of "agent" in this repo. They are not a
// listing of background SESSIONS and would be a false positive for a grep.
const sdkExports = Object.keys(sdk).sort()
const LISTING_HINT = /agent|background|daemon|worker|supervisor|roster|dispatch|attach/i
const sdkCandidates = sdkExports.filter((n) => LISTING_HINT.test(n))

// The session-facing half of the SDK, for the record: these are what the app
// already uses for the sessions rail, and the point is that they are a
// different source with a different lifetime.
const sdkSessionApi = sdkExports.filter((n) => /^(list|get|fork|delete|rename|tag|import)/.test(n))

// A NAME MATCH IS NOT AN ANSWER. The first run of this spike returned YES off
// the regex alone, on `getSubagentMessages` and `listSubagents` — subagents
// inside ONE session, which is precisely the collision this repo already has a
// landmine for. So every candidate is CALLED, and the verdict comes from what
// comes back. A background-session listing must clear two bars a subagent
// helper cannot: it takes no session id (there is no session to be "in"), and
// its rows carry a liveness field, because a session you cannot see the state
// of is not the agent view.
const LIVENESS_FIELDS = ['state', 'kind', 'pid', 'status']

// AN EMPTY RETURN MEASURES NOTHING. Both candidates return `[]` when called
// with no session id, and an empty array has no fields BY CONSTRUCTION — so
// "no liveness field" read off one is vacuous, which is this repo's oldest
// standing landmine (#81: a negative is only a measurement if the path was
// exercised). So the probe below exercises the path: it finds a real session
// that HAS subagents on disk and calls the candidate against it, and it marks
// the result `vacuous` when it could not.
//
// The sidecar layout is #81's and is copied from that finding rather than
// guessed: <projectDir>/<sessionId>/subagents/agent-<agentId>.jsonl.
const findSessionWithSubagents = () => {
  const root = join(homedir(), '.claude', 'projects')
  let dirs
  try {
    dirs = readdirSync(root, { withFileTypes: true })
  } catch {
    return null
  }
  for (const d of dirs) {
    if (!d.isDirectory()) continue
    let kids
    try {
      kids = readdirSync(join(root, d.name), { withFileTypes: true })
    } catch {
      continue
    }
    for (const k of kids) {
      if (!k.isDirectory()) continue
      const sub = join(root, d.name, k.name, 'subagents')
      if (!existsSync(sub)) continue
      let agents
      try {
        agents = readdirSync(sub).filter((f) => f.endsWith('.jsonl'))
      } catch {
        continue
      }
      if (agents.length === 0) continue
      // agent-<id>.jsonl → <id>
      const agentId = agents[0].replace(/^agent-/, '').replace(/\.jsonl$/, '')
      return { sessionId: k.name, agentId }
    }
  }
  return null
}

const exercised = findSessionWithSubagents()

const fieldsOf = (rows) =>
  [...new Set(rows.flatMap((r) => (r && typeof r === 'object' ? Object.keys(r) : [typeof r])))].sort()

const probe = async (name) => {
  const fn = sdk[name]
  if (typeof fn !== 'function') return { name, callable: false, verdict: 'not callable' }

  const out = { name, callable: true }

  // (a) With no arguments. A listing of SESSIONS would work here — there is no
  // session to be "in". A session-scoped helper either throws or hands back an
  // empty list, and both say the same thing about what it is for.
  try {
    const rows = await fn()
    out.noArgReturned = Array.isArray(rows) ? `array[${rows.length}]` : typeof rows
    out.noArgRowCount = Array.isArray(rows) ? rows.length : null
  } catch (err) {
    out.noArgThrew = String(err?.message ?? err).slice(0, 120)
  }

  // (b) Against a real session that has subagents, so the row shape below is a
  // measurement rather than an artifact of an empty array.
  if (exercised) {
    try {
      const rows = name === 'getSubagentMessages' ? await fn(exercised.sessionId, exercised.agentId) : await fn(exercised.sessionId)
      out.exercisedRowCount = Array.isArray(rows) ? rows.length : null
      out.exercisedReturned = Array.isArray(rows) ? 'array' : typeof rows
      out.exercisedRowFields = Array.isArray(rows) ? fieldsOf(rows) : null
      out.exercisedLivenessFields = Array.isArray(rows)
        ? fieldsOf(rows).filter((f) => LIVENESS_FIELDS.includes(f))
        : null
    } catch (err) {
      out.exercisedThrew = String(err?.message ?? err).slice(0, 120)
    }
  }

  // The verdict names its own evidence, and says so when it has none.
  const gotRows = (out.exercisedRowCount ?? 0) > 0
  if (!gotRows) {
    out.vacuous = true
    out.verdict = exercised
      ? 'session-scoped, and its row shape is UNEXERCISED here (the sample session returned nothing) — it takes a session id, so it cannot be a listing of sessions'
      : 'session-scoped, and UNEXERCISED — no session with subagents was found on this disk to call it against'
  } else if (out.exercisedLivenessFields.length > 0) {
    out.vacuous = false
    out.verdict = 'LISTING WITH LIVENESS'
  } else {
    out.vacuous = false
    out.verdict = `session-scoped listing, exercised on ${out.exercisedRowCount} real rows, carrying no liveness field`
  }
  return out
}

const sdkFinding = {
  exportCount: sdkExports.length,
  namesMatchingListingHint: sdkCandidates,
  sessionApi: sdkSessionApi,
  // Called, not just named — and exercised on a real session, not on an empty
  // array. See the note above.
  exercisedAgainstRealSession: exercised !== null,
  probes: await Promise.all(sdkCandidates.map(probe)),
  // The near-miss, probed the same way: listSessions() is what the app already
  // uses for the sessions rail. SDKSessionInfo is the STORED-TRANSCRIPT shape —
  // no state, no kind, no pid, no attach path — which is exactly why the rail
  // looks like a session list and is not one.
  listSessionsInfoFields: null,
  listSessionsHasLivenessField: null,
  answer: null
}

try {
  const rows = await sdk.listSessions({ includeProgrammatic: true })
  const keys = new Set()
  for (const r of rows.slice(0, 200)) for (const k of Object.keys(r)) keys.add(k)
  sdkFinding.listSessionsInfoFields = [...keys].sort()
  sdkFinding.listSessionsRowCount = rows.length
  sdkFinding.listSessionsHasLivenessField = sdkFinding.listSessionsInfoFields.some((f) =>
    LIVENESS_FIELDS.includes(f)
  )
} catch (err) {
  sdkFinding.listSessionsError = String(err?.message ?? err)
}

const realSurface = sdkFinding.probes.filter((p) => p.verdict === 'LISTING WITH LIVENESS')
sdkFinding.falsePositives = sdkFinding.probes
  .filter((p) => p.verdict !== 'LISTING WITH LIVENESS')
  .map((p) => ({ name: p.name, why: p.verdict, vacuous: p.vacuous === true }))
// The load-bearing half of the NO is listSessions(), not the probes: it is the
// one candidate that IS a listing of whole sessions, it is exercised on a large
// real result, and it carries no liveness field. The probes only establish that
// the two name-level matches are about subagents inside a session.
sdkFinding.answer =
  realSurface.length > 0
    ? `YES — ${realSurface.map((p) => p.name).join(', ')}`
    : 'NO — every name-level candidate is a SUBAGENT helper scoped to one session, and listSessions() (exercised on the real store) returns stored transcripts carrying no state, kind, pid or attach path. The SDK has no background-session listing.'

// ---------------------------------------------------------------------------
// 2 SUBPROC — can the app run `claude agents --json`?
const runCli = (args) => {
  const started = process.hrtime.bigint()
  const r = spawnSync(cliBin, args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
  const ms = Number(process.hrtime.bigint() - started) / 1e6
  return { ms, status: r.status, stdout: r.stdout ?? '', stderr: r.stderr ?? '', error: r.error }
}

const parseRows = (res) => {
  if (res.status !== 0) return { ok: false, reason: `exit ${res.status}` }
  try {
    const rows = JSON.parse(res.stdout)
    if (!Array.isArray(rows)) return { ok: false, reason: `not an array: ${typeof rows}` }
    return { ok: true, rows }
  } catch (err) {
    return { ok: false, reason: `unparseable: ${String(err?.message ?? err)}` }
  }
}

const help = runCli(['agents', '--help'])
raw('agents-help.txt', help.stdout + help.stderr)

const active = runCli(['agents', '--json'])
const all = runCli(['agents', '--json', '--all'])
raw('agents-active.json', active.stdout)
raw('agents-all.json', all.stdout)

const activeRows = parseRows(active)
const allRows = parseRows(all)

const subprocFinding = {
  binary: hostCli === null ? 'SDK-bundled (no host claude on PATH)' : 'host claude on PATH',
  // Recorded because it is a real cost, not a detail: cli-path.ts says in so
  // many words that #53 deleted this app's only child_process use and that a
  // PATH walk was chosen over a `which` shell-out to avoid adding one back.
  // This route reintroduces exactly that.
  requiresChildProcess: true,
  helpExit: help.status,
  jsonExit: active.status,
  jsonAllExit: all.status,
  jsonParsed: activeRows.ok,
  jsonAllParsed: allRows.ok,
  jsonParseFailure: activeRows.ok ? null : activeRows.reason,
  needsTty: /does not require a TTY/.test(help.stdout) ? false : null,
  answer: activeRows.ok ? 'YES' : `NO — ${activeRows.reason}`
}

const rowsActive = activeRows.ok ? activeRows.rows : []
const rowsAll = allRows.ok ? allRows.rows : []

// ---------------------------------------------------------------------------
// THE TRAP, answered before the payload so no count below is innocent of it.
const isSelf = (r) =>
  (selfSessionId !== null && r.sessionId === selfSessionId) ||
  (selfPid !== null && r.pid === selfPid)

const selfRows = rowsActive.filter(isSelf)
const selfFinding = {
  measuringSessionIdKnown: selfSessionId !== null,
  measuringPidKnown: selfPid !== null,
  selfPresentInActiveListing: selfRows.length > 0,
  selfRowCount: selfRows.length,
  // Shape only — kind/state are vocabulary, not identity.
  selfRowKind: selfRows[0]?.kind ?? null,
  selfRowState: selfRows[0]?.state ?? null,
  selfRowStatus: selfRows[0]?.status ?? null,
  matchedBy:
    selfRows.length === 0
      ? null
      : selfSessionId !== null && selfRows.some((r) => r.sessionId === selfSessionId)
        ? 'CLAUDE_CODE_SESSION_ID'
        : 'CLAUDE_PID',
  note: 'Recorded, never filtered. Every count in payload/scope is given raw AND self-excluded.'
}

// ---------------------------------------------------------------------------
// 3 PAYLOAD — field set, types, and the FULL state vocabulary.
//
// #81's rule is the reason this section is built the way it is: an observed set
// is not a closed set. So the vocabulary is reported as MEASURED-HERE with the
// exercised/unexercised split made explicit, never as "the values".
const typeOf = (v) =>
  v === undefined ? 'absent' : v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v

const describe = (rows) => {
  const keys = new Set()
  for (const r of rows) for (const k of Object.keys(r)) keys.add(k)
  const fields = {}
  for (const k of [...keys].sort()) {
    fields[k] = {
      types: [...new Set(rows.map((r) => typeOf(r[k])))].sort(),
      presentOn: rows.filter((r) => r[k] !== undefined).length,
      of: rows.length
    }
  }
  return { rowCount: rows.length, fields }
}

// The shape is NOT uniform, so a union of keys would hide the whole point.
// Split by `kind` first, then describe each.
const byKind = (rows) => {
  const out = {}
  for (const r of rows) (out[r.kind ?? '<absent>'] ??= []).push(r)
  return Object.fromEntries(Object.entries(out).map(([k, rs]) => [k, describe(rs)]))
}

const vocab = (rows, key) =>
  [...new Set(rows.map((r) => (r[key] === undefined ? '<absent>' : r[key] === null ? '<null>' : r[key])))].sort()

// Does `id` identify every row, or only some? A UI keys rows by something.
const idFinding = (rows) => ({
  everyRowHasId: rows.every((r) => r.id !== undefined),
  rowsWithId: rows.filter((r) => r.id !== undefined).length,
  everyRowHasSessionId: rows.every((r) => typeof r.sessionId === 'string'),
  idIsSessionIdPrefix: rows.filter((r) => r.id !== undefined).every((r) => r.sessionId?.startsWith(r.id)),
  idLengths: [...new Set(rows.filter((r) => r.id).map((r) => r.id.length))].sort()
})

// pid/status vs state: which rows carry which, and do they agree?
const liveness = (rows) => ({
  rowsWithPid: rows.filter((r) => r.pid !== undefined).length,
  rowsWithStatus: rows.filter((r) => r.status !== undefined && r.status !== null).length,
  pidAndStatusCoincide: rows.every((r) => (r.pid !== undefined) === (r.status !== undefined && r.status !== null)),
  rowsWithState: rows.filter((r) => r.state !== undefined && r.state !== null).length,
  stateIsBackgroundOnly: rows
    .filter((r) => r.state !== undefined && r.state !== null)
    .every((r) => r.kind === 'background'),
  statesOnRowsWithPid: [...new Set(rows.filter((r) => r.pid !== undefined).map((r) => r.state ?? '<absent>'))].sort()
})

const payloadFinding = {
  active: {
    total: rowsActive.length,
    excludingSelf: rowsActive.filter((r) => !isSelf(r)).length,
    byKind: byKind(rowsActive),
    kindVocabulary: vocab(rowsActive, 'kind'),
    stateVocabulary: vocab(rowsActive, 'state'),
    statusVocabulary: vocab(rowsActive, 'status'),
    identity: idFinding(rowsActive),
    liveness: liveness(rowsActive)
  },
  all: {
    total: rowsAll.length,
    excludingSelf: rowsAll.filter((r) => !isSelf(r)).length,
    byKind: byKind(rowsAll),
    kindVocabulary: vocab(rowsAll, 'kind'),
    stateVocabulary: vocab(rowsAll, 'state'),
    statusVocabulary: vocab(rowsAll, 'status'),
    identity: idFinding(rowsAll),
    liveness: liveness(rowsAll),
    kindStateCounts: rowsAll.reduce((acc, r) => {
      const k = `${r.kind}/${r.state ?? '<absent>'}`
      acc[k] = (acc[k] ?? 0) + 1
      return acc
    }, {})
  },
  // #81's rule, stated rather than implied.
  vocabularyIsNotClosed:
    'These are the values PRESENT ON THIS DISK AT THIS MOMENT. A value is only measured-absent if its path was exercised, and no path here was forced. Treat the set as open and render the raw string (#83 did the same for task_type).'
}

// ---------------------------------------------------------------------------
// 4 CHANNEL — push or poll?
//
// Two halves. (a) Does the subcommand offer a live mode? Asked of its own help
// text mechanically. (b) Is there an on-disk store a watcher could sit on
// instead — the app already owns that pattern in session-watcher.ts (ONE
// directory watch, debounced, epoch-fenced) so a watchable store would be a
// cheap change signal.
//
// (b) is measured by SET COMPARISON, not by reading values: if a store
// reproduces the listing, it is a route; if it covers only part, it is at best
// a trigger to re-poll. NOTHING from the roster is recorded — it holds socket
// paths, `rvAuth`/`ptyAuth` and `dispatch.env`.
const helpText = help.stdout + help.stderr
const liveFlag = /--(watch|follow|stream|tail)\b/.test(helpText)

const sessionsDir = join(homedir(), '.claude', 'sessions')
const rosterPath = join(homedir(), '.claude', 'daemon', 'roster.json')

const readSessionFiles = () => {
  if (!existsSync(sessionsDir)) return null
  const out = []
  for (const f of readdirSync(sessionsDir)) {
    if (!f.endsWith('.json')) continue
    try {
      out.push(JSON.parse(readFileSync(join(sessionsDir, f), 'utf8')))
    } catch {
      /* a file mid-write is a normal race for a watcher; skip it */
    }
  }
  return out
}

const readRosterWorkerSessionIds = () => {
  if (!existsSync(rosterPath)) return null
  try {
    const j = JSON.parse(readFileSync(rosterPath, 'utf8'))
    return Object.values(j.workers ?? {}).map((w) => w.sessionId)
  } catch {
    return null
  }
}

const sessionFiles = readSessionFiles()
const rosterIds = readRosterWorkerSessionIds()
const listedIds = new Set(rowsActive.map((r) => r.sessionId))

const covers = (ids) => {
  if (ids === null) return null
  const s = new Set(ids)
  return {
    storeCount: s.size,
    listingCount: listedIds.size,
    storeCoversListing: [...listedIds].every((id) => s.has(id)),
    listingCoversStore: [...s].every((id) => listedIds.has(id)),
    inListingNotInStore: [...listedIds].filter((id) => !s.has(id)).length
  }
}

const channelFinding = {
  liveFlagInHelp: liveFlag,
  helpFlags: [...new Set(helpText.match(/--[a-z][a-z-]*/g) ?? [])].sort(),
  onDiskStores: {
    sessionsDirExists: sessionFiles !== null,
    sessionsFileCount: sessionFiles?.length ?? null,
    // Field NAMES only. These files carry cwd, name, sessionId, pid.
    sessionsFileFields:
      sessionFiles && sessionFiles.length
        ? [...new Set(sessionFiles.flatMap((s) => Object.keys(s)))].sort()
        : null,
    sessionsCoverage: covers(sessionFiles?.map((s) => s.sessionId) ?? null),
    rosterExists: rosterIds !== null,
    rosterWorkerCount: rosterIds?.length ?? null,
    rosterCoverage: covers(rosterIds),
    rosterIsSensitive:
      'roster.json carries rendezvousSock/ptySock, rvAuth/ptyAuth and dispatch.env — attach credentials. Never log, never commit, never surface. (#88 said the same of McpServerStatus.config.env; this is stronger.)'
  },
  answer: null
}

const sc = channelFinding.onDiskStores.sessionsCoverage
const rc = channelFinding.onDiskStores.rosterCoverage
channelFinding.answer = liveFlag
  ? 'PUSH — the subcommand has a live mode'
  : sc?.storeCoversListing || rc?.storeCoversListing
    ? 'POLL, but an on-disk store reproduces the listing and could be watched instead'
    : 'POLL ONLY — no live flag, and no single on-disk store reproduces the listing (the CLI joins several). A watch on those stores is a CHANGE SIGNAL at best, not a substitute for the call.'

// ---------------------------------------------------------------------------
// 5 COST — wall-clock for one call, since a poll multiplies it.
const REPS = 5
const timeCalls = (args) => {
  const ms = []
  for (let i = 0; i < REPS; i++) ms.push(runCli(args).ms)
  ms.sort((a, b) => a - b)
  return {
    reps: REPS,
    minMs: Math.round(ms[0]),
    medianMs: Math.round(ms[(ms.length - 1) >> 1]),
    maxMs: Math.round(ms[ms.length - 1])
  }
}

const costFinding = {
  json: timeCalls(['agents', '--json']),
  jsonAll: timeCalls(['agents', '--json', '--all']),
  note: 'Each call is a full CLI process start. There is no warm path — the cost is paid per poll, not per session.'
}
costFinding.pollBudget = {
  at5s: `${(costFinding.json.medianMs / 5000 * 100).toFixed(1)}% of a core, steady`,
  at30s: `${(costFinding.json.medianMs / 30000 * 100).toFixed(2)}% of a core, steady`,
  stalenessWindowIsThePollInterval: true
}

// ---------------------------------------------------------------------------
// 6 SCOPE — does --cwd scope the way a workspace-scoped app needs?
const here = process.cwd()
const scoped = runCli(['agents', '--json', '--cwd', here])
raw('agents-cwd.json', scoped.stdout)
const scopedRows = parseRows(scoped)
const rowsScoped = scopedRows.ok ? scopedRows.rows : []

const normPath = (p) => String(p ?? '').split('\\').join('/').toLowerCase().replace(/\/+$/, '')
const hereNorm = normPath(here)

const scopeFinding = {
  parsed: scopedRows.ok,
  unscopedTotal: rowsActive.length,
  scopedTotal: rowsScoped.length,
  scopedExcludingSelf: rowsScoped.filter((r) => !isSelf(r)).length,
  everyScopedRowMatchesCwd: rowsScoped.every((r) => normPath(r.cwd) === hereNorm),
  unscopedRowsMatchingCwd: rowsActive.filter((r) => normPath(r.cwd) === hereNorm).length,
  scopedEqualsFilteredUnscoped:
    rowsScoped.length === rowsActive.filter((r) => normPath(r.cwd) === hereNorm).length,
  // The half that decides whether the app can reuse it as-is: does scoping also
  // drop the interactive rows, or only re-home them? The app is workspace-scoped
  // but the DISTINCTION it needs is background-vs-interactive, not cwd.
  scopedKinds: vocab(rowsScoped, 'kind'),
  scopedIncludesInteractive: rowsScoped.some((r) => r.kind === 'interactive'),
  scopedIncludesSelf: rowsScoped.some(isSelf),
  // Exact-match or prefix? A workspace-scoped app opens subdirectories too.
  // This one is reported WITH its own vacuity flag: a zero here means nothing
  // unless a session was actually running in a subdirectory of `here` to be
  // matched or missed. Nothing forced that, so it usually is not a measurement.
  scopedRowsUnderButNotAtCwd: rowsScoped.filter(
    (r) => normPath(r.cwd) !== hereNorm && normPath(r.cwd).startsWith(hereNorm + '/')
  ).length,
  prefixMatchingExercised: rowsActive.some(
    (r) => normPath(r.cwd) !== hereNorm && normPath(r.cwd).startsWith(hereNorm + '/')
  ),
  prefixMatchingNote:
    'If prefixMatchingExercised is false, whether --cwd matches by prefix or exactly is UNMEASURED here — no session was running below this directory. Do not read scopedRowsUnderButNotAtCwd: 0 as "exact-match only".',
  answer: null
}
scopeFinding.answer = !scopedRows.ok
  ? 'UNMEASURED — --cwd did not parse'
  : scopeFinding.everyScopedRowMatchesCwd && scopeFinding.scopedEqualsFilteredUnscoped
    ? `YES for directory, NO for kind — --cwd filters by directory across BOTH kinds and still includes interactive rows${scopeFinding.scopedIncludesSelf ? ' and the caller itself' : ''}. A background-only list needs a second filter on kind.`
    : 'PARTIAL — see fields'

// ---------------------------------------------------------------------------
// THE APP-RELEVANT FORM OF THE TRAP.
//
// The instrument seeing itself is one thing; the ticket's subject is the APP,
// and the app's engine is an SDK query() spawning a headless CLI. If THAT
// registers with the supervisor, then the app's own conversation would appear
// in the app's own list — a noise floor the surface would have to handle, and a
// fact #91 needs. One real turn settles it, so it is measured rather than
// reasoned about. Held at engine.ts's real options (#87's rule about
// backend-mode applies: resolveSpawnEnv, never a hand-edited env).
const snapshot = snapshotWispEnv(process.env)
const mode = initialMode(snapshot)
const appEnv = resolveSpawnEnv(mode, snapshot, process.env)

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

const measureAppSession = async (timeoutMs = 180_000) => {
  const out = { backendMode: mode, ranTurn: false, turnFailed: null, sawOwnSessionInListing: null }
  const cwd = mkdtempSync(join(tmpdir(), 'spike-90-app-'))
  writeFileSync(join(cwd, 'README.md'), '# spike 90 scratch\n')

  const queue = createMessageQueue()
  let q
  try {
    q = query({
      prompt: queue.iterable,
      options: {
        cwd,
        includePartialMessages: true,
        canUseTool: async (_n, _i, o) => ({
          behavior: 'allow',
          toolUseID: o.toolUseID,
          decisionClassification: 'user_temporary'
        }),
        env: appEnv,
        permissionMode: 'bypassPermissions',
        allowDangerouslySkipPermissions: true,
        ...cliOptions
      }
    })
  } catch (err) {
    out.error = `query() threw: ${String(err?.message ?? err)}`
    return out
  }

  let sessionId = null
  let pollDuringTurn = null
  let resolveTurn = null

  const consume = (async () => {
    try {
      for await (const msg of q) {
        if (msg.type === 'system' && msg.subtype === 'init' && msg.session_id) {
          sessionId = msg.session_id
          // Poll WHILE the turn is live. A listing taken after the turn ends
          // measures a dead process and would answer the wrong question.
          const res = parseRows(runCli(['agents', '--json']))
          pollDuringTurn = res.ok ? res.rows : null
        }
        if (msg.type === 'result') {
          // #87's landmine: subtype is 'success' on a failed turn.
          out.ranTurn = true
          out.turnFailed = msg.is_error === true
          resolveTurn?.()
          resolveTurn = null
        }
      }
    } catch (err) {
      out.error = `stream threw: ${String(err?.message ?? err)}`
      resolveTurn?.()
      resolveTurn = null
    }
  })()

  await new Promise((resolve) => {
    const timer = setTimeout(() => {
      out.error = 'turn timed out'
      resolveTurn?.()
      resolveTurn = null
    }, timeoutMs)
    resolveTurn = () => {
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

  if (sessionId === null) {
    out.error = out.error ?? 'no session id on init'
    return out
  }
  if (pollDuringTurn === null) {
    out.error = out.error ?? 'listing during the turn did not parse'
    return out
  }

  const row = pollDuringTurn.find((r) => r.sessionId === sessionId)
  out.sawOwnSessionInListing = row !== undefined
  out.ownRowKind = row?.kind ?? null
  out.ownRowState = row?.state ?? null
  out.ownRowStatus = row?.status ?? null
  out.listingSizeDuringTurn = pollDuringTurn.length
  out.note = !out.sawOwnSessionInListing
    ? 'An SDK-spawned CLI does NOT register in the listing. The app would not see itself, and the list is other sessions only.'
    : out.ownRowKind === 'background'
      ? 'The app registers as a BACKGROUND row — it would appear in its own list beside real background sessions and cannot be told apart by kind. A surface must exclude it by session id.'
      : `The app registers, as kind "${out.ownRowKind}". A background-only list drops it for free; a list mirroring the CLI's agent view (which shows both kinds) would show the app's own conversation. cwd cannot exclude it — the app lists the workspace it is open on, which is where its own session lives.`
  return out
}

const appSession = process.env['SPIKE90_SKIP_TURN'] ? { skipped: 'SPIKE90_SKIP_TURN' } : await measureAppSession()

// ---------------------------------------------------------------------------
// Versions, for the same reason #81/#87/#88/#89 record them.
const sdkVersion = (() => {
  try {
    const pkg = new URL('../node_modules/@anthropic-ai/claude-agent-sdk/package.json', import.meta.url)
    return JSON.parse(readFileSync(pkg, 'utf8')).version ?? null
  } catch {
    return null
  }
})()

const cliVersion = (() => {
  const r = runCli(['--version'])
  return r.stdout.trim() || null
})()

const findings = {
  spike: 90,
  question: "Are the CLI's background sessions reachable from this app at all?",
  measuredAt: new Date().toISOString(),
  // BASENAME ONLY. The siblings record the absolute temp path, which puts the
  // OS username into a pushed repo; the random suffix is the whole pointer, so
  // the rest is cost with no benefit. (spike-89-findings.json still carries the
  // absolute form — noted on the ticket rather than fixed here, it is not this
  // ticket's file.)
  runDirName: runDir.split(/[\\/]/).pop(),
  runDirParent: 'OS temp dir (os.tmpdir())',
  env: { backendMode: mode, hostCliUsed: hostCli !== null, cliVersion, sdkVersion, platform: process.platform },
  scrubbing:
    'Shapes, counts, vocabularies, booleans and timings only. No cwd, name, sessionId, id, pid or socket path from any row, and no value at all from daemon/roster.json, is recorded here.',
  q1_sdk: sdkFinding,
  q2_subprocess: subprocFinding,
  q3_payload: payloadFinding,
  q4_channel: channelFinding,
  q5_cost: costFinding,
  q6_scope: scopeFinding,
  trap_instrumentSeesItself: selfFinding,
  trap_appSeesItself: appSession
}

writeFileSync(findingsPath, JSON.stringify(findings, null, 2) + '\n')

console.log(`\nQ1 SDK      : ${sdkFinding.answer}`)
console.log(`Q2 SUBPROC  : ${subprocFinding.answer}`)
console.log(
  `Q3 PAYLOAD  : ${payloadFinding.active.total} active / ${payloadFinding.all.total} with --all` +
    ` | kinds ${JSON.stringify(payloadFinding.all.kindVocabulary)}` +
    ` | state ${JSON.stringify(payloadFinding.all.stateVocabulary)}`
)
console.log(`Q4 CHANNEL  : ${channelFinding.answer}`)
console.log(`Q5 COST     : median ${costFinding.json.medianMs}ms (--json), ${costFinding.jsonAll.medianMs}ms (--all)`)
console.log(`Q6 SCOPE    : ${scopeFinding.answer}`)
console.log(`TRAP self   : instrument in its own listing = ${selfFinding.selfPresentInActiveListing}`)
console.log(`TRAP app    : app session in the listing     = ${appSession.sawOwnSessionInListing}`)
console.log(`\nraw:      ${runDir}`)
console.log(`findings: ${findingsPath.pathname}`)
