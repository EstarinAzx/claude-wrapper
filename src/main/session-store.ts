import { join } from 'node:path'
import { listSessions as sdkListSessions } from '@anthropic-ai/claude-agent-sdk'
import type { SessionMeta, TranscriptMessage } from '../shared/session-types'
import { nodeIo, resolveSessionDir, type StoreIo } from './session-index'
import { parseTranscript } from './transcript'

// Session metadata comes from the SDK's own store reader: one pass for the whole
// store (421ms for 490 sessions measured) instead of reading and line-parsing
// every JSONL on mount, on cwd change, on active-session change and on every
// window focus. `summary` is already the SDK's coalesce of custom title →
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
export const listSessions = async (): Promise<SessionMeta[]> => {
  let infos: Awaited<ReturnType<typeof sdkListSessions>>
  try {
    // `includeProgrammatic: false` is what the SDK documents for IDE session
    // pickers — parity with what terminal `/resume` offers.
    infos = await sdkListSessions({ includeProgrammatic: false })
  } catch {
    return []
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
// replay message list. Unreadable/missing file → [] (lenient, like listSessions).
//
// The storage directory comes from the index, never from encoding `cwd` — see
// session-index.ts. `cwd` is passed only as a duplicate-id tie-break hint, so a
// session whose cwd is unknown (or whose drive-letter case drifted from the
// on-disk name) still replays instead of silently reading back empty.
export const readTranscript = async (
  cwd: string | null,
  id: string,
  io: StoreIo = nodeIo
): Promise<TranscriptMessage[]> => {
  if (!id) return []
  const found = await resolveSessionDir(id, cwd, io)
  if (found.status !== 'ok') return []
  let raw: string
  try {
    raw = await io.readFile(join(found.dir, `${id}.jsonl`))
  } catch {
    return []
  }
  return parseTranscript(raw)
}
