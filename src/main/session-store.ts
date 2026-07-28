import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { listSessions as sdkListSessions } from '@anthropic-ai/claude-agent-sdk'
import type { SessionMeta, TranscriptMessage } from '../shared/session-types'
import { parseTranscript } from './transcript'

export const encodeCwd = (cwd: string): string => cwd.replace(/[^a-zA-Z0-9]/g, '-')

// Session metadata comes from the SDK's own store reader: one pass for the whole
// project (421ms for 490 sessions measured) instead of reading and line-parsing
// every JSONL on mount, on cwd change, on active-session change and on every
// window focus. `summary` is already the SDK's coalesce of custom title →
// auto-summary → first prompt, so it is the title verbatim — do NOT re-add a
// `customTitle ?? summary` fallback, it is redundant and re-introduces the raw
// command markup this path exists to avoid.
export const listSessions = async (cwd: string | null): Promise<SessionMeta[]> => {
  if (!cwd) return []
  let infos: Awaited<ReturnType<typeof sdkListSessions>>
  try {
    // `includeProgrammatic: false` is what the SDK documents for IDE session
    // pickers — parity with what terminal `/resume` offers.
    infos = await sdkListSessions({ dir: cwd, includeProgrammatic: false })
  } catch {
    return []
  }
  return infos
    .map((info) => ({
      id: info.sessionId,
      title: info.summary,
      lastUpdated: info.lastModified
    }))
    .sort((a, b) => b.lastUpdated - a.lastUpdated)
}

// Read one session's transcript from the native store and parse it to the
// replay message list. Unreadable/missing file → [] (lenient, like listSessions).
export const readTranscript = async (
  cwd: string | null,
  id: string
): Promise<TranscriptMessage[]> => {
  if (!cwd || !id) return []
  const file = join(homedir(), '.claude', 'projects', encodeCwd(cwd), `${id}.jsonl`)
  let raw: string
  try {
    raw = await readFile(file, 'utf8')
  } catch {
    return []
  }
  return parseTranscript(raw)
}
