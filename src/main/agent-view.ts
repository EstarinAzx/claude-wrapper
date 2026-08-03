// The CLI's **agent view** (`claude agents --json`), read on demand.
//
// This lists whole LIVE BACKGROUND SESSIONS — other Claude Code conversations
// running under the CLI's supervisor. It is NOT this app's Agents dock (that is
// subagents inside the one open session) and NOT `background-tasks.ts` (jobs
// inside the one open session). Three meanings, one word; `.context/flows.md`
// carries the collision table.
//
// ── this module re-adds a child_process spawn, on purpose (#91) ────────────
// `cli-path.ts` says in so many words that #53 deleted this app's only
// child_process use and that its own PATH walk is a walk rather than a `which`
// shell-out precisely to avoid re-adding one. That reasoning is intact for
// cli-path's question, which `fs.existsSync` can answer. It does not reach this
// one: #90 enumerated all 29 SDK exports against a real session and found NO
// background-session listing — every name-level candidate is a subagent helper
// scoped to one session, and `listSessions()` returns stored transcripts
// carrying no state, kind or pid. There is no non-spawn route to this data. See
// `.context/decisions/2026-08-04-the-agent-view-costs-a-process-so-the-user-pays-for-it.md`.
//
// Three consequences that shape everything below:
//   * ONE CLI PROCESS PER LOOK, median 893ms (#90). There is no warm path, so
//     the cost is per refresh, not per session. That is why the caller is
//     user-driven and why nothing here polls.
//   * NEVER read `~/.claude/daemon/roster.json`. It carries `rvAuth`/`ptyAuth`,
//     socket paths and `dispatch.env` — attach credentials. The listing must
//     come from the CLI, which performs the join itself; #90 measured the two
//     on-disk stores cover only 2 of 6 and 1 of 6 active rows, so reimplementing
//     the join to dodge the spawn would be both wrong AND a credential read.
//   * THE APP IS IN ITS OWN LISTING. #90 ran a real `query()` at engine.ts's
//     options and watched the app's own session appear as `kind: "interactive"`.
//     `cwd` cannot exclude it — the app lists the workspace its own session
//     lives in. Filtering to `kind === 'background'` drops it for free.

import { execFile } from 'node:child_process'
import type { BackgroundSession } from '../shared/background-session-types'
import { getSpawnEnv } from './backend-mode'
import { resolveHostCli } from './cli-path'

// Generous against a 893ms median (#90) and still bounded: a hung CLI must not
// leave the rail's refresh button spinning for the life of the app.
const LOOK_TIMEOUT_MS = 15_000

// 18 rows measured machine-wide; 8MB is headroom, not a budget.
const MAX_OUTPUT_BYTES = 8 * 1024 * 1024

/** Run the agent view for one directory and hand back raw stdout, or `null`
 *  when the look FAILED. Injectable so the parse and the scoping can be tested
 *  without spawning a CLI. */
export type AgentViewRun = (cwd: string) => Promise<string | null>

/** Parse `claude agents --json` output into the background rows this app shows.
 *  `null` is a FAILED read (unparseable, or not the array shape) — distinct from
 *  `[]`, which is the honest answer "nothing is running here". */
export const parseAgentView = (raw: string): BackgroundSession[] | null => {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  if (!Array.isArray(parsed)) return null

  const rows: BackgroundSession[] = []
  for (const row of parsed) {
    if (!row || typeof row !== 'object') continue
    const r = row as Record<string, unknown>
    // The one filter that matters. `kind` is a two-value vocabulary measured on
    // every row (#90) and `interactive` is what the app's own session registers
    // as — so this is both "background sessions only" and "not our own window".
    if (r['kind'] !== 'background') continue
    // Not `id`: absent on interactive rows, and only ever an 8-char prefix of
    // this. `sessionId` is the only universal key (#90).
    const sessionId = r['sessionId']
    if (typeof sessionId !== 'string' || !sessionId) continue

    const out: BackgroundSession = { sessionId }
    // Optional fields are carried only when the row actually has a usable value,
    // so the rail can tell "no data" from an empty string or a zero.
    if (typeof r['name'] === 'string' && r['name']) out.name = r['name']
    // Raw string, never mapped through an allow-list — the set is open (#90).
    if (typeof r['state'] === 'string' && r['state']) out.state = r['state']
    const startedAt = r['startedAt']
    if (typeof startedAt === 'number' && Number.isFinite(startedAt)) {
      out.startedAt = startedAt
    }
    rows.push(out)
  }
  return rows
}

const spawnAgentView: AgentViewRun = (cwd) =>
  new Promise((resolve) => {
    // Same binary the engine runs (`cli-path.ts`): follow the host install so
    // this listing cannot drift from the CLI whose sessions it is listing. The
    // `'claude'` fallback matches the SDK's bundled-CLI fallback in spirit — a
    // machine with neither simply fails the look, which is an honest `null`.
    const bin = resolveHostCli(process.env['PATH'], process.platform) ?? 'claude'
    execFile(
      bin,
      // `--cwd` is the CLI's OWN directory scoping, and #90 measured it agrees
      // with filtering the unscoped listing by cwd. Delegating it means this app
      // never has to decide whether a session one directory down counts.
      // It filters by directory across BOTH kinds and still returns interactive
      // rows, which is why the `kind` filter above is a second, separate step.
      ['agents', '--json', '--cwd', cwd],
      {
        // The same routing env the engine's CLI gets, so a native-mode app does
        // not quietly shell out through the wisp proxy.
        env: getSpawnEnv(process.env),
        timeout: LOOK_TIMEOUT_MS,
        maxBuffer: MAX_OUTPUT_BYTES,
        windowsHide: true
      },
      (err, stdout) => resolve(err ? null : stdout)
    )
  })

/** The workspace's live background sessions, or `null` when the look failed.
 *  No open workspace is `[]`: there is no directory to scope to, which is a
 *  complete answer rather than a failure. */
export const listBackgroundSessions = async (
  cwd: string | null,
  run: AgentViewRun = spawnAgentView
): Promise<BackgroundSession[] | null> => {
  if (!cwd) return []
  const raw = await run(cwd)
  return raw === null ? null : parseAgentView(raw)
}
