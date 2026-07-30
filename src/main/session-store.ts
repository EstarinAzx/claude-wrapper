import { join } from 'node:path'
import { listSessions as sdkListSessions } from '@anthropic-ai/claude-agent-sdk'
import type { SessionMeta, TranscriptMessage } from '../shared/session-types'
import { firstSubstantivePrompt } from '../shared/session-titles'
import { nodeIo, resolveSessionDir, type StoreIo } from './session-index'
import { parseTranscript } from './transcript'

// Session metadata comes from the SDK's own store reader: one pass for the whole
// store (495ms for 672 sessions, re-measured 2026-07-30) instead of reading and
// line-parsing every JSONL on mount, on cwd change, on active-session change and
// on every window focus. `summary` is already the SDK's coalesce of custom title →
// auto-summary → first prompt, so it is the title verbatim — do NOT re-add a
// `customTitle ?? summary` fallback, it is redundant and re-introduces the raw
// command markup this path exists to avoid.
//
// GLOBAL: `dir` is deliberately not passed, which is what makes the SDK return
// every project rather than one. Session history is the entry point to a
// workspace, so the list cannot be scoped by the workspace you are already in.
// Scoping is the renderer's job — it groups by `cwd` and keeps rows outside the
// open workspace inert until the transition ships. `includeWorktrees` needs no
// answer here: the SDK applies it only when `dir` is given.
//
// `null` is a FAILED listing, distinct from `[]` meaning the store holds no
// sessions (#60). Both used to be `[]`, so a store that blew up rendered as
// "No sessions yet" — the same words a fresh install gets, with no hint that
// anything was wrong and nothing to retry. Typed rather than thrown: the IPC
// handler stays a pass-through.
export const listSessions = async (): Promise<SessionMeta[] | null> => {
  let infos: Awaited<ReturnType<typeof sdkListSessions>>
  try {
    // MUST be true: the SDK reads "programmatic" off the transcript's
    // `entrypoint` field against {sdk-cli, sdk-ts, sdk-py}, and THIS APP WRITES
    // `sdk-ts`. `false` therefore hid every conversation the wrapper itself
    // authored — 560 rows vs 672 here, the whole 112-row delta being sdk-ts +
    // sdk-cli. It was chosen for "parity with terminal /resume", but that
    // reasoning inverts for a client listing sessions it wrote: parity for the
    // terminal means showing the terminal's own work.
    //
    // `true` is also the SDK's default. The key stays explicit so a future
    // default flip cannot take this with it silently — deleting it is a no-op
    // today, which is why no test pins the argument. The behaviour is pinned
    // instead, against a real store, in tests/session-store-live.test.ts.
    // Rationale: .context/decisions/2026-07-30-the-app-must-be-able-to-list-its-own-sessions.md
    infos = await sdkListSessions({ includeProgrammatic: true })
  } catch {
    return null
  }
  return infos
    .map((info) => ({
      id: info.sessionId,
      title: info.summary,
      lastUpdated: info.lastModified,
      // Absent, not '' — a session with no recorded cwd is a state the renderer
      // groups on ("Unknown project"), never a directory named nothing.
      ...(info.cwd ? { cwd: info.cwd } : {})
    }))
    .sort((a, b) => b.lastUpdated - a.lastUpdated)
}

// Read one session's transcript from the native store and parse it to the
// replay message list.
//
// `null` means the transcript could not be READ — the store would not enumerate,
// or the file itself refused. `[]` stays reserved for the two lenient cases that
// are not failures: a session the store genuinely no longer holds (deleted
// between a list and a click), and a session whose file reads fine and holds no
// messages. Before #60 all four answered `[]`, so a corrupt or permission-
// blocked session rendered as an empty conversation with no way back.
//
// The storage directory comes from the index, never from encoding `cwd` — see
// session-index.ts. `cwd` is passed only as a duplicate-id tie-break hint, so a
// session whose cwd is unknown (or whose drive-letter case drifted from the
// on-disk name) still replays instead of silently reading back empty.
export const readTranscript = async (
  cwd: string | null,
  id: string,
  io: StoreIo = nodeIo
): Promise<TranscriptMessage[] | null> => {
  if (!id) return []
  const found = await resolveSessionDir(id, cwd, io)
  if (found.status === 'unavailable') return null
  if (found.status !== 'ok') return []
  let raw: string
  try {
    raw = await io.readFile(join(found.dir, `${id}.jsonl`))
  } catch {
    return null
  }
  return parseTranscript(raw)
}

// A better label for ONE session whose recorded title is a bare slash command
// (#49). Reads that session's transcript and nothing else — the caller decides
// which rows are worth asking about, and asks only for rows it has rendered.
//
// This deliberately does not ride `session:transcript`: that channel exists to
// hand a whole parsed transcript to the chat pane, and sharing it would leave
// the call count this feature is pinned on with two possible causes. Here the
// transcript never crosses IPC at all — at most one line of text does.
//
// null means "no prompt to show", and an unreadable transcript answers null the
// same way: both are terminal, and the caller caches them rather than retrying.
// This is the ONE caller that still wants #60's lenient collapse — a rail label
// has no retry affordance to offer, so a failure here can only be silence.
export const titleHint = async (
  id: string,
  cwd: string | null = null,
  io: StoreIo = nodeIo
): Promise<string | null> => firstSubstantivePrompt((await readTranscript(cwd, id, io)) ?? [])
