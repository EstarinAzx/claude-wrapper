// Spike #130 — Phase 1 of the ticket: the two things that decide whether a
// rewind control may honestly be offered on a REPLAYED message.
//
// Sibling of spike-81/87/88/89/90/104/105/108/114/116/117/122/127/129, same
// construction and the same import rule: the app's REAL src/main/cli-path.ts
// and src/main/backend-mode.ts, so the binary and the routing measured here
// cannot drift from what the app spawns.
//
//   node --experimental-strip-types scripts/spike-130-checkpoint-durability.mjs
//   SPIKE130_PHASES=A,B      # skip the aged survey and the cost arm
//
// ---------------------------------------------------------------------------
// WHY THIS RUNS AT ALL — #129 measured rewind EFFECTIVE, so what is left?
//
// #129 proved rewind works through the declared method, across a resume, and
// from a rebuilt query onto the PREVIOUS query's message id. Every one of those
// happened inside ONE process, seconds apart, on a uuid held in memory. The
// control #130 would add is offered on a conversation the user REOPENED — a
// different process, an arbitrary amount of later, and a uuid that was never in
// memory because it is read back off the stored transcript.
//
//   AC1 DOES A CHECKPOINT SURVIVE THE PROCESS THAT MADE IT, and for how long?
//      #129's phase C answered `filesChanged: 0` and that is consistent with
//      "recognised" — but it was never a DISK WITNESS, because phase A had
//      already reverted its own file, so `before` matched whatever the call did.
//      Here the mutating turn deliberately does NOT rewind: the file is left
//      MUTATED across the process boundary, so the later process's rewind either
//      moves it back to ORIGINAL or it does not, and there is no third reading.
//
//   AC2 WHAT DOES enableFileCheckpointing COST? #129 recorded this UNSCORED on
//      purpose, because a turn's wall time is dominated by model latency. The
//      ticket asks for a fixed local workload with no model in the loop; the
//      mechanism arm below is exactly that, and the turn arm is kept beside it
//      as a differential with its own noise band, so "inside the noise" is a
//      reported result rather than a shrug.
//
// ---------------------------------------------------------------------------
// THE CONTROLS, every one of them paid for by an earlier leg
//
//   * THE LATER PROCESS IS A REAL ONE. Phase A runs in a CHILD process that
//     EXITS before phase B starts. An in-process "second query" would share the
//     SDK's module state and prove nothing about reopening the app.
//   * RUN IN THE WORKSPACE THE SESSION BELONGS TO. The CLI's session store is
//     keyed by PROJECT DIRECTORY; #129's first run resumed from a fresh temp dir
//     and died with `No conversation found with session ID` — a perfect id in
//     the wrong place. Phase B inherits phase A's cwd through the handoff.
//   * GATE ON THE PARSED HANDOFF, NEVER ON THE CHILD'S EXIT CODE. #125's runner
//     produced three confident false REDs by reading an exit status. The child
//     writes a JSON verdict; the parent reads THAT.
//   * A BOGUS UUID RUNS BEFORE THE REAL ONE and the file is re-read after it, so
//     a revert is attributable to the id rather than to the call happening.
//   * THE POSITIVE CONTROL IS THE TURN ITSELF. If the turn did not change the
//     file there was nothing to rewind and "it did not revert" measures nothing
//     — that arm scores UNSCORED, never a refutation (#76).
//   * BOTH REFUSAL MECHANISMS ARE HANDLED. A missing checkpoint THROWS (`No file
//     checkpoint found for this message.`); checkpointing being off answers
//     `canRewind: false` in the body. Two mechanisms, one user-visible fact.
//   * THE AGED SURVEY PICKS ONLY PROVEN-CHECKPOINTED IDS. The transcript records
//     `file-history-delta` lines carrying `snapshotMessageId` — the user message
//     a real file backup was filed under. Sampling an arbitrary user message
//     instead would make "no checkpoint" indistinguishable from "never had one",
//     which is the instrument-fails-its-own-setup landmine in a new costume.
//   * THE AGED SURVEY IS dryRun ONLY, and it asserts that. It resumes the
//     operator's REAL sessions, so a wet call there would move their real files.
//     `git status` is hashed before and after and compared.
//
// This spike BUILDS NOTHING in src/. It runs before the build and the build is
// GATED on what it finds.
//
// SCRUBBING (#87/#88/#89/#90's rule). Counts, shapes, booleans, timings, ages in
// days, and error text the CLI generated about itself. Never a cwd, a home
// directory, a username, an absolute path or a session id. `filesChanged` comes
// back as ABSOLUTE PATHS — only its LENGTH is ever written.

import {
  mkdtempSync,
  writeFileSync,
  readFileSync,
  existsSync,
  readdirSync,
  statSync,
  mkdirSync,
  rmSync,
  openSync,
  readSync,
  closeSync
} from 'node:fs'
import { tmpdir, homedir } from 'node:os'
import { join, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID, createHash } from 'node:crypto'
import { spawnSync, execFileSync } from 'node:child_process'
import { query, getSessionMessages } from '@anthropic-ai/claude-agent-sdk'

// fileURLToPath, never URL.pathname: this repo lives under a directory with a
// space in its name, and pathname hands back the percent-encoded form.
const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const selfPath = fileURLToPath(import.meta.url)
const findingsPath = fileURLToPath(new URL('./spike-130-findings.json', import.meta.url))

const { resolveHostCli, toCliOptions } = await import('../src/main/cli-path.ts')
const { snapshotWispEnv, resolveSpawnEnv, initialMode } = await import(
  '../src/main/backend-mode.ts'
)

const hostCli = resolveHostCli(process.env['PATH'], process.platform)
const cliOptions = toCliOptions(hostCli)
const snapshot = snapshotWispEnv(process.env)
const backendMode = initialMode(snapshot)
const appEnv = resolveSpawnEnv(backendMode, snapshot, process.env)

const STAGE = process.env['SPIKE130_STAGE'] ?? 'PARENT'
const PHASES = (process.env['SPIKE130_PHASES'] ?? 'A,B,C,D').split(',').map((s) => s.trim())
const runs = (p) => PHASES.includes(p)
const TURN_TIMEOUT_MS = Number(process.env['SPIKE130_TURN_TIMEOUT_MS'] ?? 240_000)
// How long phase B waits after the child exits. Default is short — the question
// "does it survive the process" is answered at any delay, and the "how long"
// half is answered by phase C against real sessions up to a month old, which is
// elapsed time no harness can manufacture.
const SETTLE_MS = Number(process.env['SPIKE130_SETTLE_MS'] ?? 2_000)
const AGED_SAMPLE = Number(process.env['SPIKE130_AGED_SAMPLE'] ?? 6)
const COST_REPS = Number(process.env['SPIKE130_COST_REPS'] ?? 3)
const COST_WRITES = Number(process.env['SPIKE130_COST_WRITES'] ?? 3)

let turnsSpent = 0

const HOME = homedir()
const redact = (v, cap = 300) => {
  let s = String(v ?? '')
  if (HOME) s = s.split(HOME).join('<HOME>')
  s = s.split(repoRoot).join('<REPO>')
  s = s.replace(/[A-Za-z]:\\[^\s"']+/g, '<PATH>').replace(/\/(?:home|Users)\/[^\s"']+/g, '<PATH>')
  // A session id is a uuid and this file never writes one.
  s = s.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '<UUID>')
  return s.slice(0, cap)
}

// The option shape is engine.ts's, minus canUseTool (nothing here renders a
// permission prompt) and plus permissionMode: 'bypassPermissions', because every
// arm needs the Write tool to actually run. #116's lesson in reverse: the ambient
// permission default decides whether canUseTool is consulted at all, so the
// harness STATES the mode rather than inheriting it.
const baseOptions = (cwd, checkpointing = true) => ({
  cwd,
  includePartialMessages: true,
  env: appEnv,
  permissionMode: 'bypassPermissions',
  allowDangerouslySkipPermissions: true,
  enableFileCheckpointing: checkpointing,
  ...cliOptions
})

const createMessageQueue = () => {
  const buf = []
  let done = false
  let wake = null
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
      [Symbol.asyncIterator]: () => ({
        async next() {
          while (buf.length === 0 && !done) await new Promise((r) => (wake = r))
          if (buf.length === 0) return { done: true, value: undefined }
          return { done: false, value: buf.shift() }
        }
      })
    }
  }
}

// The `cwd` a transcript belongs to, without reading the whole file. These
// transcripts run to megabytes and only the head is wanted.
//
// NOT line 1: the first record is session metadata and carries no `cwd` at all.
// Reading line 1 and giving up made this survey report an empty population,
// which reads exactly like "no aged checkpoints exist" — the same
// instrument-fails-its-own-setup shape #129's phase C died of. Scan the head
// block for the first record that actually has the field.
const readCwd = (path) => {
  const fd = openSync(path, 'r')
  let head
  try {
    const buf = Buffer.alloc(65_536)
    const n = readSync(fd, buf, 0, buf.length, 0)
    head = buf.subarray(0, n).toString('utf8')
  } finally {
    closeSync(fd)
  }
  // Drop the last element: a bounded read almost certainly truncated it.
  const lines = head.split(/\r?\n/).slice(0, -1)
  for (const line of lines) {
    if (!line.includes('"cwd"')) continue
    try {
      const rec = JSON.parse(line)
      if (typeof rec?.cwd === 'string') return rec.cwd
    } catch {
      /* a truncated or malformed line is not a finding */
    }
  }
  return null
}

const samePath = (a, b) =>
  typeof a === 'string' &&
  typeof b === 'string' &&
  a.replace(/[\\/]+$/, '').toLowerCase() === b.replace(/[\\/]+$/, '').toLowerCase()

// One turn on a live handle. Returns what happened, never throws upward.
const runTurn = async (q, queue, text) => {
  const row = {}
  let sessionId = null
  let resolveTurn = null
  const started = Date.now()
  const consume = (async () => {
    try {
      for await (const msg of q) {
        if (typeof msg.session_id === 'string') sessionId = msg.session_id
        if (msg.type === 'result') {
          row.ranTurn = true
          row.turnIsError = msg.is_error === true
          resolveTurn?.()
          resolveTurn = null
        }
      }
    } catch (err) {
      row.streamError = redact(err?.message ?? err)
      resolveTurn?.()
      resolveTurn = null
    }
  })()

  const uuid = randomUUID()
  await new Promise((resolve) => {
    const timer = setTimeout(() => {
      row.error = row.error ?? 'turn timed out'
      resolveTurn?.()
      resolveTurn = null
    }, TURN_TIMEOUT_MS)
    resolveTurn = () => {
      clearTimeout(timer)
      resolve()
    }
    queue.push({
      type: 'user',
      uuid,
      session_id: '',
      message: { role: 'user', content: text },
      parent_tool_use_id: null,
      origin: { kind: 'human' }
    })
  })
  row.ms = Date.now() - started
  row.uuid = uuid
  row.sessionId = sessionId
  row.consume = consume
  return row
}

// One rewind attempt through the DECLARED METHOD, classified by what it did to
// the disk rather than by what it answered. `expectRevert` states the arm's own
// prediction so a control and a treatment are scored by the same function and
// neither can quietly pass by doing the other's job.
const rewindAttempt = async ({ q, label, uuid, dryRun, target, restored, expectRevert }) => {
  const started = process.hrtime.bigint()
  const row = { label, dryRun, expectRevert }
  try {
    const r = await q.rewindFiles(uuid, { dryRun })
    row.outcome = 'accepted'
    row.canRewind = typeof r?.canRewind === 'boolean' ? r.canRewind : null
    row.error = typeof r?.error === 'string' ? redact(r.error) : null
    // filesChanged carries ABSOLUTE PATHS. The count is the diagnostic; the
    // paths are none of this file's business.
    row.filesChangedCount = Array.isArray(r?.filesChanged) ? r.filesChanged.length : null
    row.insertions = typeof r?.insertions === 'number' ? r.insertions : null
    row.deletions = typeof r?.deletions === 'number' ? r.deletions : null
  } catch (err) {
    // The measured refusal mechanism for an id with no checkpoint.
    row.outcome = 'threw'
    row.errorText = redact(err?.message ?? err)
  }
  row.ms = Math.round(Number(process.hrtime.bigint() - started) / 1e6)
  if (target !== undefined) {
    const now = existsSync(target) ? readFileSync(target, 'utf8') : null
    row.fileRestored = now === restored
    row.verdict =
      row.fileRestored === expectRevert
        ? expectRevert
          ? 'AS PREDICTED — the file returned to its pre-turn contents.'
          : 'AS PREDICTED — the file was left mutated.'
        : expectRevert
          ? 'CONTRADICTED — the file did NOT revert.'
          : 'CONTRADICTED — the file reverted when it should not have.'
  }
  return row
}

// ---------------------------------------------------------------------------
// STAGE A — runs in a CHILD PROCESS that exits before phase B begins.
//
// Mutates a file under a host-stamped uuid and DELIBERATELY DOES NOT REWIND, so
// the file crosses the process boundary in its MUTATED state. That is the whole
// point: it makes the later process's rewind a disk witness rather than an
// inference from `filesChanged: 0` (#129 phase C's gap).
if (STAGE === 'A') {
  const out = process.env['SPIKE130_HANDOFF']
  const handoff = { stage: 'A', scored: false }
  try {
    const cwd = mkdtempSync(join(tmpdir(), 'spike-130-'))
    const target = join(cwd, 'rewind-target.txt')
    writeFileSync(target, 'ORIGINAL\n')
    const before = readFileSync(target, 'utf8')

    const queue = createMessageQueue()
    const q = query({ prompt: queue.iterable, options: baseOptions(cwd, true) })
    handoff.declaredMethodPresent = typeof q.rewindFiles === 'function'

    const turn = await runTurn(
      q,
      queue,
      // ABSOLUTE, deliberately (#127: a relative path made the model write a file
      // that was not the target and the arm scored a false negative). The path is
      // this harness's own temp dir and never reaches the findings.
      `Use the Write tool to replace the entire contents of the file at this exact absolute path with the single line MUTATED: ${target}\nThen reply with the single word DONE and nothing else.`
    )

    const after = existsSync(target) ? readFileSync(target, 'utf8') : null
    handoff.ranTurn = turn.ranTurn === true
    handoff.turnIsError = turn.turnIsError === true
    handoff.streamError = turn.streamError ?? null
    handoff.fileChangedByTurn = after !== before
    handoff.turnMs = turn.ms
    handoff.myUuid = turn.uuid
    handoff.sessionId = turn.sessionId
    handoff.cwd = cwd
    handoff.target = target
    handoff.originalContents = before
    handoff.mutatedContents = after

    // #76 — the positive control. No mutation, nothing to rewind, nothing phase
    // B could read off this.
    handoff.scored =
      handoff.ranTurn &&
      !handoff.turnIsError &&
      handoff.fileChangedByTurn &&
      handoff.streamError === null &&
      typeof handoff.sessionId === 'string'
    handoff.verdict = handoff.scored
      ? 'SCORED — the turn ran and mutated the file, which is left MUTATED on purpose.'
      : 'UNSCORED — setup did not hold; nothing about checkpoint durability can be read off this.'

    queue.end()
    try {
      q.close()
    } catch {
      /* closing a finished handle is not a finding */
    }
    await turn.consume
  } catch (err) {
    handoff.error = String(err?.message ?? err)
  }
  writeFileSync(out, JSON.stringify(handoff, null, 2))
  process.exit(0)
}

// ---------------------------------------------------------------------------
// PARENT
const findings = {
  spike: 130,
  question:
    'Does a file checkpoint survive the process that made it — so a conversation REOPENED later can still be rewound — and for how long? Plus: what does enableFileCheckpointing cost?',
  measuredAt: new Date().toISOString(),
  phasesRun: PHASES,
  env: {
    platform: process.platform,
    node: process.version,
    backendMode,
    hostCliResolved: hostCli !== null
  },
  scrubbing:
    'Counts, shapes, booleans, timings, ages in days and CLI-generated error text only. filesChanged is recorded as a LENGTH — its entries are absolute paths on the operator disk. No cwd, home, username, path or session id is written; any uuid appearing in carried-through text is masked.',
  method:
    'Every question is answered by CALLING and reading the FILE ON DISK back. The mutating turn runs in a CHILD PROCESS that EXITS first, and it deliberately does NOT rewind, so the file crosses the process boundary MUTATED and the later rewind is a disk witness rather than an inference from filesChanged=0 (#129 phase C\'s gap). The parent gates on the child\'s PARSED handoff, never on its exit code (#125).'
}

// ---------------------------------------------------------------------------
// PHASE A — the mutating turn, in a child process. 1 turn.
let handoff = null
if (runs('A')) {
  const handoffPath = join(mkdtempSync(join(tmpdir(), 'spike-130-handoff-')), 'a.json')
  const child = spawnSync(
    process.execPath,
    ['--experimental-strip-types', selfPath],
    {
      env: { ...process.env, SPIKE130_STAGE: 'A', SPIKE130_HANDOFF: handoffPath },
      encoding: 'utf8',
      timeout: TURN_TIMEOUT_MS + 60_000
    }
  )
  turnsSpent += 1

  // GATED ON THE PARSED HANDOFF, NOT ON child.status (#125's three false REDs).
  let parsed = null
  if (existsSync(handoffPath)) {
    try {
      parsed = JSON.parse(readFileSync(handoffPath, 'utf8'))
    } catch (err) {
      parsed = { scored: false, error: `handoff unreadable: ${redact(err?.message ?? err, 160)}` }
    }
  }
  handoff = parsed
  findings.phaseA_mutatingTurnInAChildProcess = parsed
    ? {
        childExited: true,
        // Recorded for diagnosis, explicitly NOT the gate.
        childStatusIgnoredForScoring: child.status,
        declaredMethodPresent: parsed.declaredMethodPresent ?? null,
        ranTurn: parsed.ranTurn ?? null,
        turnIsError: parsed.turnIsError ?? null,
        fileChangedByTurn: parsed.fileChangedByTurn ?? null,
        turnMs: parsed.turnMs ?? null,
        scored: parsed.scored === true,
        verdict: parsed.verdict ?? parsed.error ?? null
      }
    : {
        scored: false,
        childStatusIgnoredForScoring: child.status,
        verdict: `UNSCORED — the child wrote no handoff. stderr: ${redact(child.stderr, 400)}`
      }
}

// ---------------------------------------------------------------------------
// PHASE B — THE MEASUREMENT. A LATER PROCESS resumes the session and rewinds a
// uuid read off the STORED TRANSCRIPT, which is exactly the app's replayed-
// message path. 0 turns.
if (runs('B')) {
  if (!handoff?.scored) {
    findings.phaseB_rewindFromALaterProcess = {
      verdict:
        'UNSCORED — phase A did not score, so there is no mutated file and no conversation worth resuming. Every call here would be a statement about the setup rather than about checkpoint durability.'
    }
  } else {
    await new Promise((r) => setTimeout(r, SETTLE_MS))
    const { cwd, target, originalContents, sessionId, myUuid } = handoff
    const arm = { settleMs: SETTLE_MS, turnsSpent: 0 }

    // The file must STILL be mutated — if something put it back, there is
    // nothing for a rewind to prove.
    const beforeRewind = existsSync(target) ? readFileSync(target, 'utf8') : null
    arm.fileStillMutatedAtStart = beforeRewind !== originalContents

    // THE UUID COMES OFF THE STORED TRANSCRIPT, not out of memory. This is the
    // whole point of #130: a replayed message's id is read back from disk.
    arm.transcriptRead = await (async () => {
      try {
        const msgs = await getSessionMessages(sessionId, { dir: cwd })
        const users = msgs.filter((m) => m.type === 'user')
        return {
          checked: true,
          userMessagesOnDisk: users.length,
          // Recorded as a BOOLEAN, never as the value. This file's scrubbing
          // rule says no session id is written, and a message uuid off the
          // operator's disk is the same class of thing.
          readAnIdFromDisk: users.length > 0 && typeof users[0].uuid === 'string',
          matchesTheIdTheHostStamped: users.some((m) => m.uuid === myUuid)
        }
      } catch (err) {
        return { checked: false, error: redact(err?.message ?? err, 200) }
      }
    })()

    // Read again for USE, not from the record — the record deliberately keeps
    // only a boolean. The id itself never leaves this process.
    const uuidFromDisk = arm.transcriptRead.checked
      ? await getSessionMessages(sessionId, { dir: cwd })
          .then((msgs) => msgs.filter((m) => m.type === 'user')[0]?.uuid ?? null)
          .catch(() => null)
      : null
    // The uuid read off disk is the one used. Falling back to the in-memory one
    // would quietly answer a different, easier question.
    if (!arm.fileStillMutatedAtStart) {
      arm.verdict =
        'UNSCORED — the file was no longer mutated when the later process started, so a revert would measure nothing (#76).'
    } else if (!arm.transcriptRead.checked || !uuidFromDisk) {
      arm.verdict =
        'UNSCORED — could not read a user-message uuid back off the stored transcript, which is the input the whole feature depends on.'
    } else {
      const queue = createMessageQueue()
      let q = null
      try {
        q = query({
          prompt: queue.iterable,
          // THE SAME WORKSPACE. The CLI's store is keyed by project directory.
          options: { ...baseOptions(cwd, true), resume: sessionId }
        })
      } catch (err) {
        arm.error = `query() threw: ${redact(err?.message ?? err)}`
      }

      if (q) {
        const consume = (async () => {
          try {
            for await (const _ of q) {
              /* no turn is sent here; drain whatever the resume emits */
            }
          } catch (err) {
            arm.streamError = redact(err?.message ?? err)
          }
        })()

        arm.bogusIdControl = await rewindAttempt({
          q,
          label: 'bogus uuid / wet',
          uuid: randomUUID(),
          dryRun: false,
          target,
          restored: originalContents,
          expectRevert: false
        })

        arm.dryRun = await rewindAttempt({
          q,
          label: 'uuid off disk / dry_run=true',
          uuid: uuidFromDisk,
          dryRun: true,
          target,
          restored: originalContents,
          expectRevert: false
        })

        arm.wetRun = await rewindAttempt({
          q,
          label: 'uuid off disk / dry_run=false',
          uuid: uuidFromDisk,
          dryRun: false,
          target,
          restored: originalContents,
          expectRevert: true
        })

        const controlHeld = arm.bogusIdControl.fileRestored === false
        const dryRunLeftDiskAlone = arm.dryRun.fileRestored === false
        arm.verdict = !controlHeld
          ? 'UNSCORED — BROKEN CONTROL: a bogus uuid restored the file, so nothing here is attributable to the id.'
          : arm.wetRun.fileRestored
            ? 'GREEN — A CHECKPOINT SURVIVES THE PROCESS THAT MADE IT. A later process resumed the session, read the uuid off the stored transcript, and the file on disk returned to its pre-turn contents. A bogus id left it alone and the dry run left it mutated.'
            : arm.wetRun.outcome === 'accepted'
              ? `RED — REACHABLE BUT NOT EFFECTIVE across a process boundary: the call answered (canRewind=${arm.wetRun.canRewind}, error=${JSON.stringify(arm.wetRun.error)}) and the file did NOT return. #117's distinction.`
              : `RED — the later process could not rewind the uuid off disk (${JSON.stringify(arm.wetRun.errorText ?? null)}).`
        arm.dryRunProvablyLeftDiskAlone = dryRunLeftDiskAlone

        queue.end()
        try {
          q.close()
        } catch {
          /* closing a finished handle is not a finding */
        }
        await consume
      }
    }

    // Real disk cost of one turn's checkpoint — free, and it is a number the
    // ticket's cost question actually wants.
    arm.checkpointFootprint = (() => {
      try {
        const dir = join(HOME, '.claude', 'file-history', sessionId)
        if (!existsSync(dir)) return { present: false }
        const entries = readdirSync(dir)
        let bytes = 0
        for (const e of entries) {
          try {
            bytes += statSync(join(dir, e)).size
          } catch {
            /* a vanished entry is not a finding */
          }
        }
        return { present: true, backupFiles: entries.length, totalBytes: bytes }
      } catch (err) {
        return { present: false, error: redact(err?.message ?? err, 160) }
      }
    })()

    findings.phaseB_rewindFromALaterProcess = arm
  }
}

// ---------------------------------------------------------------------------
// PHASE C — THE "FOR HOW LONG" HALF, and it is elapsed time no harness can
// manufacture: the operator's own sessions for THIS repo, up to a month old.
//
// dryRun ONLY, asserted by hashing `git status` before and after. These are real
// sessions in a real workspace and a wet call would move real files.
//
// Ids are taken from `file-history-delta` lines' `snapshotMessageId` — the user
// message a real backup was filed under at the time. Sampling an arbitrary user
// message instead would make "the checkpoint expired" indistinguishable from "it
// never had one", which is the instrument-fails-its-own-setup landmine again.
if (runs('C')) {
  const arm = { dryRunOnly: true, turnsSpent: 0 }
  const gitStatus = () => {
    try {
      return createHash('sha256')
        .update(execFileSync('git', ['status', '--porcelain=v1'], { cwd: repoRoot, encoding: 'utf8' }))
        .digest('hex')
    } catch {
      return null
    }
  }
  const statusBefore = gitStatus()

  // The project directory the CLI stores THIS repo's sessions under. Derived by
  // asking the SDK rather than by re-implementing its encoding.
  const sessionDirCandidates = (() => {
    const root = join(HOME, '.claude', 'projects')
    if (!existsSync(root)) return []
    // The encoding replaces path separators and punctuation with '-'. Rather
    // than reproduce it, match on the directory that actually holds sessions
    // whose transcripts record this repo as their cwd.
    const out = []
    for (const d of readdirSync(root)) {
      const full = join(root, d)
      try {
        if (!statSync(full).isDirectory()) continue
      } catch {
        continue
      }
      const files = readdirSync(full).filter((f) => f.endsWith('.jsonl'))
      if (files.length === 0) continue
      // Up to three files, because one truncated or metadata-only head block
      // must not silently drop a whole project directory from the population.
      for (const f of files.slice(0, 3)) {
        try {
          if (samePath(readCwd(join(full, f)), repoRoot)) {
            out.push({ dir: full, files })
            break
          }
        } catch {
          /* an unreadable head block is not a finding */
        }
      }
    }
    return out
  })()

  arm.projectDirsMatched = sessionDirCandidates.length

  // Build the population: sessions that PROVABLY had a checkpoint written.
  const population = []
  for (const { dir, files } of sessionDirCandidates) {
    for (const f of files) {
      const sid = basename(f, '.jsonl')
      const fhDir = join(HOME, '.claude', 'file-history', sid)
      if (!existsSync(fhDir)) continue
      let snapshotId = null
      let ageDays = null
      try {
        ageDays = Math.round((Date.now() - statSync(join(dir, f)).mtimeMs) / 86_400_000)
        // Scan for the delta lines. These files run to megabytes, so read once
        // and stop at the first snapshotMessageId.
        const raw = readFileSync(join(dir, f), 'utf8')
        for (const line of raw.split(/\r?\n/)) {
          if (!line.includes('snapshotMessageId')) continue
          try {
            const rec = JSON.parse(line)
            if (rec?.type === 'file-history-delta' && typeof rec.snapshotMessageId === 'string') {
              snapshotId = rec.snapshotMessageId
              break
            }
          } catch {
            /* skip */
          }
        }
      } catch {
        continue
      }
      if (snapshotId) population.push({ sid, dir, ageDays, snapshotId })
    }
  }

  population.sort((a, b) => b.ageDays - a.ageDays)
  arm.populationSize = population.length
  arm.ageSpanDays =
    population.length > 0
      ? { oldest: population[0].ageDays, newest: population[population.length - 1].ageDays }
      : null

  // Spread the sample across the age range rather than taking the oldest N —
  // the shape of the answer (a cliff, or no cliff) is what matters.
  const sample = []
  if (population.length > 0) {
    const step = Math.max(1, Math.floor(population.length / AGED_SAMPLE))
    for (let i = 0; i < population.length && sample.length < AGED_SAMPLE; i += step) {
      sample.push(population[i])
    }
  }

  arm.probes = []
  for (const s of sample) {
    const probe = { ageDays: s.ageDays }
    const queue = createMessageQueue()
    let q = null
    try {
      q = query({
        prompt: queue.iterable,
        // cwd is the REPO, not the store directory: the CLI's session lookup is
        // keyed by the project directory the conversation belongs to.
        options: { ...baseOptions(repoRoot, true), resume: s.sid }
      })
    } catch (err) {
      probe.error = `query() threw: ${redact(err?.message ?? err, 200)}`
      arm.probes.push(probe)
      continue
    }
    const consume = (async () => {
      try {
        for await (const _ of q) {
          /* no turn is sent */
        }
      } catch (err) {
        probe.streamError = redact(err?.message ?? err, 200)
      }
    })()
    const row = await rewindAttempt({
      q,
      label: `aged ${s.ageDays}d / dry_run=true`,
      uuid: s.snapshotId,
      dryRun: true
      // No target: the disk witness for this phase is the git-status hash below,
      // because these are the operator's real files and nothing may move.
    })
    probe.outcome = row.outcome
    probe.canRewind = row.canRewind ?? null
    probe.filesChangedCount = row.filesChangedCount ?? null
    probe.error = probe.error ?? row.error ?? row.errorText ?? null
    probe.ms = row.ms
    arm.probes.push(probe)
    queue.end()
    try {
      q.close()
    } catch {
      /* closing a finished handle is not a finding */
    }
    await consume
  }

  const statusAfter = gitStatus()
  arm.workspaceUntouched = statusBefore !== null && statusBefore === statusAfter
  const scored = arm.probes.filter((p) => p.outcome === 'accepted' || p.outcome === 'threw')
  const recognised = scored.filter((p) => p.outcome === 'accepted' && p.canRewind === true)
  // An empty population is an INSTRUMENT failure and is labelled as one. Left as
  // a bare "no aged session could be probed" it reads exactly like "aged
  // checkpoints are gone", which is the refutation this phase is least entitled
  // to make. UNSCORED IS NOT REFUTED.
  arm.verdict = !arm.workspaceUntouched
    ? 'UNSCORED — BROKEN CONTROL: the workspace changed during a dryRun-only survey. Nothing here may be trusted and the dry-run guarantee is in question.'
    : arm.projectDirsMatched === 0
      ? 'UNSCORED — INSTRUMENT FAILURE: no project directory matched this repo, so no session was even looked at. This says NOTHING about checkpoint durability.'
      : arm.populationSize === 0
        ? 'UNSCORED — INSTRUMENT FAILURE: project directories matched but no session carried a file-history-delta, so no id was provably checkpointed to begin with. This says NOTHING about expiry.'
        : scored.length === 0
          ? 'UNSCORED — the sampled sessions could not be probed (see the probe rows).'
          : recognised.length === scored.length
            ? `GREEN — every probed checkpoint from ${arm.ageSpanDays?.newest}d to ${arm.ageSpanDays?.oldest}d old was still recognised (${recognised.length}/${scored.length}). No expiry cliff within the range this machine can witness.`
            : recognised.length === 0
              ? `RED — no aged checkpoint was recognised (0/${scored.length}). Checkpoints do not outlive the session in practice.`
              : `PARTIAL — ${recognised.length}/${scored.length} aged checkpoints recognised. Ages recognised vs refused are in the probe rows; a cliff would show as all-recent-recognised.`
  findings.phaseC_agedRealSessions = arm
}

// ---------------------------------------------------------------------------
// PHASE E — the shape question AC5 turns on, and it costs nothing.
//
// Phase C probed ids that were PROVABLY checkpointed (`snapshotMessageId`). But
// a real transcript has ~110 user messages and only a handful of snapshot
// anchors, so if the control is carried onto EVERY replayed user message, most
// of them address an id with no backup filed under it.
//
// What the CLI answers there decides whether the control may be offered
// unconditionally or must be gated: an accepted `filesChanged: 0` is a harmless
// no-op, whereas a THROW on most messages would mean a control that mostly
// errors — a softer version of the "always refuses" failure the ticket forbids.
//
// dryRun ONLY, same git-status witness as phase C.
if (runs('E')) {
  const arm = { dryRunOnly: true, turnsSpent: 0 }
  const gitStatus = () => {
    try {
      return createHash('sha256')
        .update(execFileSync('git', ['status', '--porcelain=v1'], { cwd: repoRoot, encoding: 'utf8' }))
        .digest('hex')
    } catch {
      return null
    }
  }
  const statusBefore = gitStatus()

  // Reuse phase C's population-building, narrowed to ONE session, and pick a
  // user-message uuid that is explicitly NOT any of that session's snapshot ids.
  const picked = (() => {
    let fallback = null
    const root = join(HOME, '.claude', 'projects')
    if (!existsSync(root)) return null
    for (const d of readdirSync(root)) {
      const full = join(root, d)
      let files
      try {
        if (!statSync(full).isDirectory()) continue
        files = readdirSync(full).filter((f) => f.endsWith('.jsonl'))
      } catch {
        continue
      }
      if (files.length === 0) continue
      let matches = false
      for (const f of files.slice(0, 3)) {
        try {
          if (samePath(readCwd(join(full, f)), repoRoot)) {
            matches = true
            break
          }
        } catch {
          /* skip */
        }
      }
      if (!matches) continue
      for (const f of files) {
        const sid = basename(f, '.jsonl')
        if (!existsSync(join(HOME, '.claude', 'file-history', sid))) continue
        let raw
        try {
          raw = readFileSync(join(full, f), 'utf8')
        } catch {
          continue
        }
        const snapshotIds = new Set()
        const userUuids = []
        for (const line of raw.split(/\r?\n/)) {
          if (!line.trim()) continue
          let rec
          try {
            rec = JSON.parse(line)
          } catch {
            continue
          }
          if (rec?.type === 'file-history-delta' && typeof rec.snapshotMessageId === 'string') {
            snapshotIds.add(rec.snapshotMessageId)
          } else if (rec?.type === 'user' && !rec.isSidechain && typeof rec.uuid === 'string') {
            userUuids.push(rec.uuid)
          }
        }
        // POSITION IS THE WHOLE QUESTION. Rewinding to message N restores the
        // files to their state at N, which needs backups filed for changes AFTER
        // N. So a message with no backup of its own is not automatically
        // unrewindable — it is rewindable exactly when an anchor comes LATER.
        // Probing an arbitrary non-anchor cannot tell those two apart, which is
        // why the first version of this phase mislabelled a refusal as a no-op.
        const anchorPositions = userUuids
          .map((u, i) => (snapshotIds.has(u) ? i : -1))
          .filter((i) => i >= 0)
        if (snapshotIds.size === 0 || anchorPositions.length === 0) continue
        const lastAnchor = anchorPositions[anchorPositions.length - 1]
        const firstAnchor = anchorPositions[0]
        const beforeAnAnchor = userUuids.findIndex(
          (u, i) => i < firstAnchor && !snapshotIds.has(u)
        )
        const afterEveryAnchor = userUuids.findIndex(
          (u, i) => i > lastAnchor && !snapshotIds.has(u)
        )
        if (beforeAnAnchor >= 0 || afterEveryAnchor >= 0) {
          const candidate = {
            sid,
            userMessages: userUuids.length,
            snapshotAnchors: snapshotIds.size,
            probes: [
              anchorPositions.length > 0 && {
                position: 'IS an anchor (a backup was filed under it)',
                uuid: userUuids[firstAnchor]
              },
              beforeAnAnchor >= 0 && {
                position: 'no backup of its own, but an anchor comes LATER',
                uuid: userUuids[beforeAnAnchor]
              },
              afterEveryAnchor >= 0 && {
                position: 'no backup, and NO anchor after it — nothing to undo',
                uuid: userUuids[afterEveryAnchor]
              }
            ].filter(Boolean)
          }
          // The decisive probe is the message with an anchor LATER. A session
          // that cannot supply one is kept only as a fallback — settling for it
          // is what left the question unanswered the first time.
          if (beforeAnAnchor >= 0) return candidate
          fallback = fallback ?? candidate
        }
      }
    }
    return fallback
  })()

  if (!picked) {
    arm.verdict =
      'UNSCORED — INSTRUMENT FAILURE: no session with both a snapshot anchor and a non-anchor user message was found. This says NOTHING about how the CLI answers an uncheckpointed id.'
  } else {
    arm.userMessagesInSession = picked.userMessages
    arm.snapshotAnchorsInSession = picked.snapshotAnchors
    const queue = createMessageQueue()
    let q = null
    try {
      q = query({
        prompt: queue.iterable,
        options: { ...baseOptions(repoRoot, true), resume: picked.sid }
      })
    } catch (err) {
      arm.error = `query() threw: ${redact(err?.message ?? err, 200)}`
    }
    if (q) {
      const consume = (async () => {
        try {
          for await (const _ of q) {
            /* no turn is sent */
          }
        } catch (err) {
          arm.streamError = redact(err?.message ?? err, 200)
        }
      })()
      arm.probes = []
      for (const p of picked.probes) {
        const row = await rewindAttempt({
          q,
          label: `${p.position} / dry_run=true`,
          uuid: p.uuid,
          dryRun: true
        })
        arm.probes.push({
          position: p.position,
          outcome: row.outcome,
          // ACCEPTED WITH canRewind=false IS A REFUSAL, not a no-op. The control
          // renders an error note on that path, so it is scored as a refusal.
          rewindable: row.outcome === 'accepted' && row.canRewind === true,
          canRewind: row.canRewind ?? null,
          filesChangedCount: row.filesChangedCount ?? null,
          error: row.error ?? row.errorText ?? null
        })
      }
      queue.end()
      try {
        q.close()
      } catch {
        /* closing a finished handle is not a finding */
      }
      await consume
    }
    const statusAfter = gitStatus()
    arm.workspaceUntouched = statusBefore !== null && statusBefore === statusAfter
    const byPos = Object.fromEntries((arm.probes ?? []).map((p) => [p.position, p]))
    const anchor = byPos['IS an anchor (a backup was filed under it)']
    const earlier = byPos['no backup of its own, but an anchor comes LATER']
    const later = byPos['no backup, and NO anchor after it — nothing to undo']
    arm.verdict = !arm.workspaceUntouched
      ? 'UNSCORED — BROKEN CONTROL: the workspace changed during a dryRun-only probe.'
      : !arm.probes || arm.probes.length === 0
        ? 'UNSCORED — the probe did not complete.'
        : earlier?.rewindable && later && !later.rewindable
          ? 'COHERENT — rewindability tracks POSITION, not whether the message has a backup of its own. A message with file changes after it is rewindable; one with nothing after it refuses, which is the correct answer to "undo nothing". The control may be carried onto every replayed user message: it refuses exactly where there is nothing to undo.'
          : earlier && !earlier.rewindable
            ? `GATE NEEDED — a message with an anchor LATER still refused (canRewind=${earlier.canRewind}, ${JSON.stringify(earlier.error)}). Only anchor messages are rewindable, so an ungated control would refuse on most replayed messages.`
            : `MIXED — anchor=${anchor?.rewindable}, earlier=${earlier?.rewindable}, later=${later?.rewindable}. Read the probe rows before deciding the control's gating.`
  }
  findings.phaseE_uncheckpointedReplayedMessage = arm
}

// ---------------------------------------------------------------------------
// PHASE D — AC2, the cost of enableFileCheckpointing.
//
// Two arms, because the ticket asks for a fixed local workload with no model in
// the loop and that only bounds the MECHANISM; the user-visible cost is a turn.
//
//   D1 MECHANISM, NO MODEL. What the store does per backed-up file is read it,
//      hash it and write a content-addressed copy — the shape of the real
//      file-history entries. Timed directly over N files at a realistic size.
//      This is a BOUND on the mechanism, stated as one, not a measurement of the
//      CLI's implementation.
//   D2 TURN, DIFFERENTIAL. The identical prompt with checkpointing ON and OFF,
//      interleaved so drift hits both arms, reps>=3 so the noise band is
//      reported rather than assumed. #129 recorded this UNSCORED because model
//      latency dominates; the point here is to QUANTIFY that noise so "inside
//      the noise" is a result with a number attached.
if (runs('D')) {
  const arm = {}

  // --- D1: the mechanism, no model in the loop.
  arm.mechanismNoModel = (() => {
    const dir = mkdtempSync(join(tmpdir(), 'spike-130-cost-'))
    const store = join(dir, 'store')
    mkdirSync(store)
    const SIZES = [4_096, 65_536]
    const N = 50
    const rows = []
    for (const size of SIZES) {
      const body = 'x'.repeat(size)
      const srcs = []
      for (let i = 0; i < N; i += 1) {
        const p = join(dir, `f${size}-${i}.txt`)
        writeFileSync(p, body)
        srcs.push(p)
      }
      const started = process.hrtime.bigint()
      for (const p of srcs) {
        const buf = readFileSync(p)
        const h = createHash('sha256').update(buf).digest('hex').slice(0, 16)
        writeFileSync(join(store, `${h}@v1`), buf)
      }
      const totalMs = Number(process.hrtime.bigint() - started) / 1e6
      rows.push({
        fileBytes: size,
        files: N,
        totalMs: Math.round(totalMs * 100) / 100,
        perFileMs: Math.round((totalMs / N) * 1000) / 1000
      })
    }
    try {
      rmSync(dir, { recursive: true, force: true })
    } catch {
      /* temp cleanup is not a finding */
    }
    return {
      rows,
      note: 'read + sha256 + write a content-addressed copy, which is the SHAPE of a real file-history entry (<hash>@v1). A BOUND on the per-file mechanism, not a measurement of the CLI.',
      verdict: `Per backed-up file: ~${rows[0]?.perFileMs}ms at ${rows[0]?.fileBytes}B, ~${rows[1]?.perFileMs}ms at ${rows[1]?.fileBytes}B.`
    }
  })()

  // --- D2: the turn, differential and interleaved.
  const costWorkspace = mkdtempSync(join(tmpdir(), 'spike-130-turn-'))
  const costPrompt = (() => {
    const paths = []
    for (let i = 0; i < COST_WRITES; i += 1) paths.push(join(costWorkspace, `w${i}.txt`))
    return (
      `Use the Write tool to write the single line HELLO to each of these exact absolute paths, one Write call each:\n` +
      paths.map((p) => `- ${p}`).join('\n') +
      `\nThen reply with the single word DONE and nothing else.`
    )
  })()

  const oneCostTurn = async (checkpointing) => {
    const queue = createMessageQueue()
    const started = Date.now()
    let q = null
    try {
      q = query({
        prompt: queue.iterable,
        options: baseOptions(costWorkspace, checkpointing)
      })
    } catch {
      return null
    }
    const turn = await runTurn(q, queue, costPrompt)
    turnsSpent += 1
    queue.end()
    try {
      q.close()
    } catch {
      /* closing a finished handle is not a finding */
    }
    await turn.consume
    if (turn.ranTurn !== true || turn.turnIsError === true) return null
    return Date.now() - started
  }

  const on = []
  const off = []
  for (let r = 0; r < COST_REPS; r += 1) {
    const a = await oneCostTurn(true)
    if (a !== null) on.push(a)
    const b = await oneCostTurn(false)
    if (b !== null) off.push(b)
  }
  try {
    rmSync(costWorkspace, { recursive: true, force: true })
  } catch {
    /* temp cleanup is not a finding */
  }

  const median = (xs) => {
    if (xs.length === 0) return null
    const s = [...xs].sort((a, b) => a - b)
    const m = Math.floor(s.length / 2)
    return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2)
  }
  const spread = (xs) => (xs.length === 0 ? null : Math.max(...xs) - Math.min(...xs))

  const onMed = median(on)
  const offMed = median(off)
  const delta = onMed !== null && offMed !== null ? onMed - offMed : null
  const noise = Math.max(spread(on) ?? 0, spread(off) ?? 0)
  arm.turnDifferential = {
    writesPerTurn: COST_WRITES,
    reps: COST_REPS,
    onMs: on,
    offMs: off,
    onMedianMs: onMed,
    offMedianMs: offMed,
    deltaMs: delta,
    withinArmSpreadMs: noise,
    verdict:
      delta === null
        ? 'UNSCORED — not enough scoring turns to compare.'
        : Math.abs(delta) < noise
          ? `UNSCORED FOR A PER-TURN NUMBER, and now with the number that says why: the on/off median difference is ${delta}ms while the spread WITHIN a single arm is ${noise}ms. Model latency dominates, exactly as #129 predicted. The honest cost figure is D1's per-file bound plus the disk footprint, not this.`
          : `${delta}ms median difference across ${COST_REPS} interleaved reps at ${COST_WRITES} writes/turn, against a within-arm spread of ${noise}ms.`
  }

  findings.phaseD_cost = arm
}

findings.turnsSpent = turnsSpent
findings.whatANegativeRunProves = {
  ifPhaseBIsRed:
    'A checkpoint does NOT survive the process that made it. #130 Phase 2 must NOT be built: the control would render on every replayed message and refuse on every one of them, which the ticket itself calls worse than no control. The correct outcome is to report the number, build nothing, and file the finding at needs-triage.',
  ifPhaseCIsRedOrPartial:
    'Checkpoints expire. The control cannot be offered unconditionally on a reopened conversation — it would need the app to know the expiry, which nothing here exposes. That is a Phase 2 shape change, not merely a caveat.',
  ifPhaseDIsUnscored:
    'The per-turn cost is inside the noise, which is itself the answer the ticket asked for: checkpointing is not a latency decision. The disk footprint in phase B is then the cost worth reporting.'
}

writeFileSync(findingsPath, JSON.stringify(findings, null, 2))

const line = (k, v) => console.log(`${k.padEnd(30)} ${v}`)
console.log('\n=== SPIKE 130 — does a checkpoint outlive its process, and for how long? ===')
line('turns spent', turnsSpent)
line('A mutating turn (child)', findings.phaseA_mutatingTurnInAChildProcess?.verdict ?? 'skipped')
line('B rewind from later proc', findings.phaseB_rewindFromALaterProcess?.verdict ?? 'skipped')
line('C aged real sessions', findings.phaseC_agedRealSessions?.verdict ?? 'skipped')
line('D1 mechanism (no model)', findings.phaseD_cost?.mechanismNoModel?.verdict ?? 'skipped')
line('D2 turn differential', findings.phaseD_cost?.turnDifferential?.verdict ?? 'skipped')
line('E uncheckpointed message', findings.phaseE_uncheckpointedReplayedMessage?.verdict ?? 'skipped')
console.log(`\nfindings -> ${findingsPath}\n`)
