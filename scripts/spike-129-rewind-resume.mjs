// Spike #129 — the two things #127 left unmeasured about rewind, both of which
// decide the SHAPE of the build rather than merely informing it.
//
// Sibling of spike-81/87/88/89/90/104/105/108/114/116/117/122/127, same
// construction and the same import rule: the app's REAL src/main/cli-path.ts
// and src/main/backend-mode.ts, so the binary and the routing measured here
// cannot drift from what the app spawns.
//
//   node --experimental-strip-types scripts/spike-129-rewind-resume.mjs
//   SPIKE129_PHASES=A        # the declared method only (1 turn)
//
// ---------------------------------------------------------------------------
// WHY THIS RUNS AT ALL — #127 measured rewind EFFECTIVE, so what is left?
//
// #127 proved the capability with the RAW dispatcher (`q.request({subtype:
// 'rewind_files', ...})`) on a FRESH query. The app is neither of those things,
// and each difference is a place the build could ship a control that lies:
//
//   Q1 THE DECLARED METHOD. sdk.d.ts:2488 declares `Query.rewindFiles(id,
//      {dryRun})`. #115's landmine is exactly this — a declared type is not a
//      callable route — and #88's is its mirror: a NAME on the object settles
//      nothing either way. #127 never called this method; it called the wire
//      route underneath it. If the method works, the build uses it and gets the
//      SDK's own typing; if it does not, the build must reach for `request`.
//      Answered by CALLING, with the file on disk as the witness.
//
//   Q2 A RESUMED SESSION. The SDK's own source carries a caveat for the
//      store-backed case and #127 never exercised a resume. This is not an edge
//      case in this app — it is the ORDINARY path: reopening a past session
//      sets pendingResume and the next send builds a query with `resume`.
//
//   Q3 A MESSAGE FROM BEFORE AN ENGINE REBUILD. The sharpest of the three, and
//      it is not in #129's ticket because nothing had noticed it. This app
//      rebuilds the engine mid-conversation on a MODEL PICK, a PERMISSION
//      CYCLE and a BACKEND FLIP (index.ts's discardEngine funnel). The pane
//      keeps its messages across that, so a rewind control attached to a
//      message will outlive the query that sent it. Whether the NEW query can
//      rewind the OLD query's message decides whether the control may stay live
//      after a rebuild or must be withdrawn. Costs no turn — it reuses phase
//      A's uuid against phase B's resumed handle.
//
// Q4 COST is reported UNSCORED on purpose. See the `cost` block at the bottom:
// a turn's wall time is dominated by model latency, so the arm durations here
// cannot separate checkpointing's overhead from the weather. Recording the
// numbers with a verdict of "these do not answer it" is the #125 rule — an
// unparseable result is UNSCORED, never a value.
//
// ---------------------------------------------------------------------------
// THE CONTROLS, all of which are the ones this record keeps paying for
//
//   * A BOGUS UUID runs BEFORE every real rewind, and the file is read back
//     after it. Without that, a revert is not attributable to the id (#127's
//     own control, kept verbatim).
//   * THE POSITIVE CONTROL IS THE TURN ITSELF: if the turn did not change the
//     file there was nothing to rewind, and "the file did not revert" measures
//     nothing. Such an arm scores UNSCORED, never a refutation (#76).
//   * THE HOST-STAMPED UUID IS ASSERTED, not assumed — the transcript is read
//     back with getSessionMessages and the id compared. The CLI never echoes
//     the prompt, so anything scraped off the stream is a TOOL RESULT (#127).
//   * ABSOLUTE PATHS in every prompt. A relative one made #127's model write a
//     file that was not the target and score a false negative.
//
// This spike BUILDS NOTHING in src/. It runs before the build and its findings
// are what the build is shaped by.
//
// SCRUBBING (#87/#88/#89/#90's rule). Counts, shapes, booleans, timings and
// error text the CLI generated about itself. Never a cwd, a home directory, a
// username, an absolute path or a session id. rewindFiles answers `filesChanged`
// with ABSOLUTE PATHS on the operator's disk — only its LENGTH is ever written.

import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { tmpdir, homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import { query, getSessionMessages } from '@anthropic-ai/claude-agent-sdk'

// fileURLToPath, never URL.pathname: this repo lives under a directory with a
// space in its name, and pathname hands back the percent-encoded form.
const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const findingsPath = fileURLToPath(new URL('./spike-129-findings.json', import.meta.url))

const { resolveHostCli, toCliOptions } = await import('../src/main/cli-path.ts')
const { snapshotWispEnv, resolveSpawnEnv, initialMode } = await import(
  '../src/main/backend-mode.ts'
)

const hostCli = resolveHostCli(process.env['PATH'], process.platform)
const cliOptions = toCliOptions(hostCli)
const snapshot = snapshotWispEnv(process.env)
const backendMode = initialMode(snapshot)
const appEnv = resolveSpawnEnv(backendMode, snapshot, process.env)

const PHASES = (process.env['SPIKE129_PHASES'] ?? 'A,B').split(',').map((s) => s.trim())
const runs = (p) => PHASES.includes(p)
const TURN_TIMEOUT_MS = Number(process.env['SPIKE129_TURN_TIMEOUT_MS'] ?? 240_000)

let turnsSpent = 0

const HOME = homedir()
const redact = (v, cap = 300) => {
  let s = String(v ?? '')
  if (HOME) s = s.split(HOME).join('<HOME>')
  s = s.split(repoRoot).join('<REPO>')
  s = s.replace(/[A-Za-z]:\\[^\s"']+/g, '<PATH>').replace(/\/(?:home|Users)\/[^\s"']+/g, '<PATH>')
  return s.slice(0, cap)
}

// The option shape is engine.ts's, minus canUseTool (nothing here renders a
// permission prompt) and plus permissionMode: 'bypassPermissions', because
// every arm needs the Write tool to actually run. #116's lesson in reverse: the
// ambient permission default decides whether canUseTool is consulted at all, so
// the harness STATES the mode rather than inheriting it.
const baseOptions = (cwd) => ({
  cwd,
  includePartialMessages: true,
  env: appEnv,
  permissionMode: 'bypassPermissions',
  allowDangerouslySkipPermissions: true,
  enableFileCheckpointing: true,
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

// One rewind attempt through the DECLARED METHOD, classified by what it did to
// the disk rather than by what it answered. `expectRevert` states the arm's own
// prediction so a control and a treatment are scored by the same function and
// neither can quietly pass by doing the other's job.
const rewindAttempt = async ({ q, label, uuid, dryRun, target, before, expectRevert }) => {
  const started = process.hrtime.bigint()
  const row = { label, dryRun, expectRevert }
  try {
    const r = await q.rewindFiles(uuid, { dryRun })
    row.outcome = 'accepted'
    row.responseKeys = r && typeof r === 'object' ? Object.keys(r).sort() : [typeof r]
    row.canRewind = typeof r?.canRewind === 'boolean' ? r.canRewind : null
    row.error = typeof r?.error === 'string' ? redact(r.error) : null
    // filesChanged carries ABSOLUTE PATHS. The count is the diagnostic; the
    // paths are none of this file's business.
    row.filesChangedCount = Array.isArray(r?.filesChanged) ? r.filesChanged.length : null
    row.insertions = typeof r?.insertions === 'number' ? r.insertions : null
    row.deletions = typeof r?.deletions === 'number' ? r.deletions : null
    row.skippedLinks = typeof r?.skippedLinks === 'number' ? r.skippedLinks : null
  } catch (err) {
    row.outcome = 'threw'
    row.errorText = redact(err?.message ?? err)
  }
  row.ms = Math.round(Number(process.hrtime.bigint() - started) / 1e6)
  const now = existsSync(target) ? readFileSync(target, 'utf8') : null
  row.fileReverted = now === before
  row.verdict =
    row.fileReverted === expectRevert
      ? expectRevert
        ? 'AS PREDICTED — the file returned to its pre-turn contents.'
        : 'AS PREDICTED — the file was left mutated.'
      : expectRevert
        ? 'CONTRADICTED — the file did NOT revert.'
        : 'CONTRADICTED — the file reverted when it should not have.'
  return row
}

// A whole arm: one workspace, one mutating turn under a host-stamped uuid, then
// the controls and the rewind. `resumeOf` builds the query with `resume`, which
// is the only OPTION difference between phase A and phase B.
//
// `cwd` is threaded rather than minted per arm, and that is not tidiness — the
// first run of this spike minted a fresh temp dir for phase B and the resume
// died with "No conversation found with session ID". The CLI's session store is
// keyed by PROJECT DIRECTORY, so resuming from a different cwd cannot find the
// conversation no matter how good the id is. Phase B scored UNSCORED (its
// positive control caught it) but phase C read the same setup failure as a
// finding and confidently answered "NO". That is this record's oldest landmine —
// an instrument that fails its own setup reports it as the phenomenon — and the
// remedy is here plus the explicit guard on phase C below.
const rewindArm = async ({ label, resumeOf, cwd, targetName }) => {
  const armCwd = cwd ?? mkdtempSync(join(tmpdir(), 'spike-129-'))
  const target = join(armCwd, targetName)
  writeFileSync(target, 'ORIGINAL\n')
  const before = readFileSync(target, 'utf8')

  const opts = { ...baseOptions(armCwd) }
  if (resumeOf) opts.resume = resumeOf

  const arm = { label, resumed: Boolean(resumeOf), attempted: true }
  const myUuid = randomUUID()
  const queue = createMessageQueue()
  let sessionId = null
  let q = null

  try {
    q = query({ prompt: queue.iterable, options: opts })
    turnsSpent += 1
  } catch (err) {
    arm.error = `query() threw: ${redact(err?.message ?? err)}`
    return arm
  }

  // Q1's cheap half — recorded, but it decides NOTHING. #88: an absent name does
  // not mean an absent route, and a present one does not mean a working method.
  // The calls below are the answer; this is here so a future SDK bump that
  // REMOVES the method shows up as a changed shape rather than as a mystery.
  arm.declaredMethodPresent = typeof q.rewindFiles === 'function'

  let resolveTurn = null
  const turnStarted = Date.now()
  const consume = (async () => {
    try {
      for await (const msg of q) {
        if (typeof msg.session_id === 'string') sessionId = msg.session_id
        if (msg.type === 'result') {
          arm.ranTurn = true
          arm.turnIsError = msg.is_error === true
          resolveTurn?.()
          resolveTurn = null
        }
      }
    } catch (err) {
      arm.streamError = redact(err?.message ?? err)
      resolveTurn?.()
      resolveTurn = null
    }
  })()

  await new Promise((resolve) => {
    const timer = setTimeout(() => {
      arm.error = arm.error ?? 'turn timed out'
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
        // ABSOLUTE, deliberately (#127: a relative path made the model write a
        // file that was not the target and the arm scored a false negative).
        // The path is this harness's own temp dir and never reaches the findings.
        content: `Use the Write tool to replace the entire contents of the file at this exact absolute path with the single line MUTATED: ${target}\nThen reply with the single word DONE and nothing else.`
      },
      parent_tool_use_id: null,
      origin: { kind: 'human' }
    })
  })
  arm.turnMs = Date.now() - turnStarted
  arm.sessionId = sessionId === null ? null : 'recorded-internally'
  arm.newSessionOnResume = resumeOf ? sessionId !== resumeOf : null

  const afterTurn = existsSync(target) ? readFileSync(target, 'utf8') : null
  arm.fileChangedByTurn = afterTurn !== before

  // The assertion that licenses using myUuid as the rewind target at all.
  arm.hostStampedUuidAccepted = await (async () => {
    try {
      const msgs = await getSessionMessages(sessionId)
      const users = msgs.filter((m) => m.type === 'user')
      return {
        checked: true,
        transcriptUserMessages: users.length,
        myUuidPresent: users.some((m) => m.uuid === myUuid)
      }
    } catch (err) {
      return { checked: false, error: redact(err?.message ?? err, 160) }
    }
  })()

  // #76: an absence assertion with no positive control measures nothing.
  if (!arm.fileChangedByTurn) {
    arm.verdict =
      'UNSCORED — setup did not hold (the turn did not change the file). Nothing about rewind can be read off this arm.'
  } else {
    arm.bogusIdControl = await rewindAttempt({
      q,
      label: `${label} / bogus uuid / wet`,
      uuid: randomUUID(),
      dryRun: false,
      target,
      before,
      expectRevert: false
    })

    arm.dryRun = await rewindAttempt({
      q,
      label: `${label} / real uuid / dry_run=true`,
      uuid: myUuid,
      dryRun: true,
      target,
      before,
      expectRevert: false
    })

    arm.wetRun = await rewindAttempt({
      q,
      label: `${label} / real uuid / dry_run=false`,
      uuid: myUuid,
      dryRun: false,
      target,
      before,
      expectRevert: true
    })

    const controlHeld = arm.bogusIdControl.fileReverted === false
    arm.verdict = !controlHeld
      ? 'UNSCORED — BROKEN CONTROL: a bogus uuid reverted the file, so nothing below is attributable to the id.'
      : arm.wetRun.fileReverted
        ? 'EFFECTIVE THROUGH THE DECLARED METHOD — q.rewindFiles() returned the file to its pre-turn contents, while a bogus id left it alone and the dry run left it mutated.'
        : arm.dryRun.outcome === 'accepted' || arm.wetRun.outcome === 'accepted'
          ? `REACHABLE BUT NOT EFFECTIVE — the method answered and the file did not revert (canRewind=${arm.dryRun.canRewind}, error=${JSON.stringify(arm.dryRun.error ?? arm.wetRun.errorText ?? null)}). #117's distinction.`
          : 'NOT EFFECTIVE — see the row errors.'
  }

  arm.uuid = myUuid
  arm.handle = q
  arm.queue = queue
  arm.consume = consume
  arm.target = target
  arm.before = before
  arm.rawSessionId = sessionId
  arm.cwd = armCwd
  return arm
}

// Did this arm actually measure anything? Phase C is gated on it, because a
// resume that never found its conversation makes every later call on that
// handle a statement about the setup and not about rewind.
const armScored = (arm) =>
  Boolean(arm) &&
  arm.ranTurn === true &&
  arm.turnIsError === false &&
  arm.fileChangedByTurn === true &&
  arm.streamError === undefined

const closeArm = async (arm) => {
  if (!arm?.handle) return
  arm.queue?.end()
  try {
    arm.handle.close()
  } catch {
    /* closing a finished handle is not a finding */
  }
  await arm.consume
  delete arm.handle
  delete arm.queue
  delete arm.consume
  delete arm.target
  delete arm.before
  delete arm.rawSessionId
  delete arm.uuid
  delete arm.cwd
}

const findings = {
  spike: 129,
  question:
    'Does the DECLARED rewindFiles method work, does rewind survive a resume, and can a rebuilt query rewind a message the previous one sent?',
  measuredAt: new Date().toISOString(),
  phasesRun: PHASES,
  env: {
    platform: process.platform,
    node: process.version,
    backendMode,
    hostCliResolved: hostCli !== null
  },
  scrubbing:
    'Counts, shapes, booleans, timings and CLI-generated error text only. filesChanged is recorded as a LENGTH — its entries are absolute paths on the operator disk. No cwd, home, username, path or session id is written.',
  method:
    'Every question is answered by CALLING and reading the FILE ON DISK back, never by a name on the object or a type in sdk.d.ts (#115: a declared type is not a callable route; #88: an absent name is not an absent route; #117: a callable route is not an effective one). Each arm runs a bogus-uuid rewind BEFORE its real one and re-reads the file, so a revert is attributable; an arm whose turn did not mutate the file is UNSCORED rather than a refutation (#76).'
}

// ---------------------------------------------------------------------------
// PHASE A — the declared method, on a fresh session. 1 turn.
let armA = null
if (runs('A')) {
  armA = await rewindArm({
    label: 'A-fresh-declared-method',
    resumeOf: null,
    targetName: 'rewind-target-a.txt'
  })
  findings.phaseA_freshSession_declaredMethod = armA
}

// ---------------------------------------------------------------------------
// PHASE B — a RESUMED session (the app's ordinary reopen path), 1 turn. Plus
// Q3, which rides phase B's handle for free: can this query rewind the message
// the PREVIOUS query sent? That is the engine-rebuild case (model pick,
// permission cycle, backend flip), and it is the one that decides whether the
// UI's control may stay live after a rebuild.
if (runs('B')) {
  if (!armScored(armA)) {
    findings.phaseB_resumedSession = {
      skipped:
        'phase A did not score, so there is no conversation worth resuming and nothing phase B could attribute to a resume.'
    }
  } else {
    const priorSessionId = armA.rawSessionId
    const priorUuid = armA.uuid
    const priorTarget = armA.target
    const priorBefore = armA.before
    const armB = await rewindArm({
      label: 'B-resumed-declared-method',
      resumeOf: priorSessionId,
      // THE SAME WORKSPACE, which is the whole correction. The CLI's store is
      // keyed by project directory; a resume from anywhere else cannot find the
      // conversation. It is also what the app does — reopening a session
      // resumes it in the workspace it belongs to.
      cwd: armA.cwd,
      targetName: 'rewind-target-b.txt'
    })
    findings.phaseB_resumedSession = armB

    // Q3, riding phase B's handle for free — and GATED, because phase B's
    // failure mode is precisely the one that would otherwise be reported here
    // as a rewind finding.
    findings.phaseC_crossQueryRewind = !armScored(armB)
      ? {
          verdict:
            'UNSCORED — phase B did not score (its resumed turn errored or changed nothing), so every call on that handle is a statement about the setup rather than about rewind. This guard exists because the first run of this spike answered "NO" here off exactly that failure.'
        }
      : await (async () => {
          const row = await rewindAttempt({
            q: armB.handle,
            label: 'C-previous-querys-message / dry_run=true',
            uuid: priorUuid,
            dryRun: true,
            target: priorTarget,
            before: priorBefore,
            // A dry run must not move the disk, and phase A's file is back at
            // ORIGINAL anyway — which is exactly why the verdict below reads
            // canRewind and not the disk.
            expectRevert: true
          })
          // The discrimination, and it is free: phase B's own bogus-uuid
          // control already established what an UNRECOGNISED id answers on
          // THIS handle. #127's three-way subtype comparison, applied to uuids.
          const bogus = armB.bogusIdControl ?? {}
          const differsFromUnknownId =
            row.outcome !== bogus.outcome ||
            row.canRewind !== bogus.canRewind ||
            (row.error ?? row.errorText ?? null) !== (bogus.error ?? bogus.errorText ?? null)
          return {
            ...row,
            comparedAgainstUnknownId: {
              unknownIdOutcome: bogus.outcome ?? null,
              unknownIdCanRewind: bogus.canRewind ?? null,
              unknownIdError: bogus.error ?? bogus.errorText ?? null,
              differs: differsFromUnknownId
            },
            note:
              'Scored on canRewind and on the contrast with an unknown id, NOT on the disk: phase A already reverted its file, so its contents match `before` whatever this call does. The question is whether a query built with `resume` recognises a user-message id the PREVIOUS query stamped — the engine-rebuild case (model pick, permission cycle, backend flip).',
            verdict:
              row.outcome !== 'accepted'
                ? `NO — the resumed query refused the previous query's message id (${JSON.stringify(row.errorText ?? null)}). A rewind control must be WITHDRAWN when the engine is rebuilt.`
                : row.canRewind === true
                  ? 'YES — the resumed query recognises the previous query\'s user-message id, so a rewind control may survive an engine rebuild.'
                  : `NO — the resumed query answered canRewind=false (${JSON.stringify(row.error ?? null)}). A rewind control must be WITHDRAWN when the engine is rebuilt.`
          }
        })()

    await closeArm(armB)
  }
}

await closeArm(armA)

findings.turnsSpent = turnsSpent
findings.cost = {
  turnMsByArm: Object.fromEntries(
    ['phaseA_freshSession_declaredMethod', 'phaseB_resumedSession']
      .map((k) => [k, findings[k]?.turnMs ?? null])
      .filter(([, v]) => v !== null)
  ),
  verdict:
    'UNSCORED for checkpointing overhead. A turn\'s wall time here is dominated by model latency and tool round-trips, so these numbers cannot separate the cost of snapshotting files from the weather. Measuring it honestly needs a fixed local workload (N writes, no model in the loop) run both ways, which is a different harness; #129 ships checkpointing ON regardless, because the alternative is a control that cannot work.'
}
findings.whatANegativeRunProves = {
  ifPhaseAFails:
    'The DECLARED method is not usable from this app\'s option shape. #127 already proved the RAW route works, so the build falls back to q.request({subtype: "rewind_files", ...}) rather than dropping the feature.',
  ifPhaseBFails:
    'Rewind does not survive a resume. The control must then be hidden for any message sent on a resumed session — which is most of them, since reopening a session is how this app continues a conversation.',
  ifPhaseCFails:
    'A rebuilt engine cannot rewind what the previous one sent. The control must be withdrawn from every message in the pane whenever main discards the engine (model pick, permission cycle, backend flip, workspace switch).'
}

writeFileSync(findingsPath, JSON.stringify(findings, null, 2))

const line = (k, v) => console.log(`${k.padEnd(34)} ${v}`)
console.log('\n=== SPIKE 129 — rewind: declared method, resume, cross-query ===')
line('turns spent', turnsSpent)
line('A fresh / declared method', findings.phaseA_freshSession_declaredMethod?.verdict ?? 'skipped')
line('B resumed session', findings.phaseB_resumedSession?.verdict ?? findings.phaseB_resumedSession?.skipped ?? 'skipped')
line('C cross-query rewind', findings.phaseC_crossQueryRewind?.verdict ?? 'skipped')
console.log(`\nfindings -> ${findingsPath}\n`)
