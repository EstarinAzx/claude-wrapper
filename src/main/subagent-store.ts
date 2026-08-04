import { join } from 'node:path'
import type { TranscriptMessage } from '../shared/session-types'
import type { SubagentInfo } from '../shared/subagent-types'
import { nodeIo, resolveSessionDir, type StoreIo } from './session-index'
import { parseTranscript } from './transcript'

// On-demand disk reader for the subagent viewer. The SDK ships getSubagentMessages /
// listSubagents, but neither exposes the meta sidecar that carries the Task
// `toolUseId` — and that id is the ONLY stable correlation between the live
// stream (parent_tool_use_id) and the persisted transcript. So this store reads
// the transcript tree directly:
//   <session's project dir>/<sessionId>/subagents/
//     agent-<agentId>.jsonl        the subagent's own thread (all isSidechain)
//     agent-<agentId>.meta.json    { agentType, description, toolUseId, spawnDepth }
// Correlation recorded (ticket #24 build-time check): meta.json `toolUseId` ===
// the live engine `parent_tool_use_id`. The renderer opens a subagent by the
// parentToolUseId it already holds from the live Task card; we resolve that to an
// agentId here. Reusing parseTranscript (with includeSidechain) yields the shared
// TranscriptMessage shape the drawer renders with, no SessionMessage mapping.

const subagentsDir = (projectDir: string, sessionId: string): string =>
  join(projectDir, sessionId, 'subagents')

// The project directory holding this session, from the index — never encoded
// from `cwd`, which is a display value here (see session-index.ts). A session
// the store does not hold has no subagents to list.
const resolveSubagentsDir = async (
  cwd: string | null,
  sessionId: string,
  io: StoreIo
): Promise<string | null> => {
  const found = await resolveSessionDir(sessionId, cwd, io)
  return found.status === 'ok' ? subagentsDir(found.dir, sessionId) : null
}

// Detect a missing path without string-matching the message — Node sets .code.
const isMissing = (e: unknown): boolean =>
  (e as NodeJS.ErrnoException | null)?.code === 'ENOENT'

// The sidecar's own view of an agent: everything SubagentInfo carries except the
// two fields the caller contributes — agentId (from the filename) and
// parentToolUseId (this file's `toolUseId`, renamed on the way out). Derived from
// SubagentInfo rather than restated so the two can't drift apart.
type ParsedMeta = Omit<SubagentInfo, 'parentToolUseId' | 'agentId'> & { toolUseId: string }

// Parse an agent-<id>.meta.json sidecar. Null on garbage or a missing toolUseId
// (a subagent we can't correlate is not surfaced). Optional fields are included
// only when the sidecar actually carries a usable value — omitted otherwise so
// the UI can tell "no data" from "zero/empty".
export const parseMeta = (raw: string): ParsedMeta | null => {
  let obj: unknown
  try {
    obj = JSON.parse(raw)
  } catch {
    return null
  }
  if (!obj || typeof obj !== 'object') return null
  const rec = obj as {
    toolUseId?: unknown
    agentType?: unknown
    description?: unknown
    model?: unknown
    spawnDepth?: unknown
    parentAgentId?: unknown
  }
  if (typeof rec.toolUseId !== 'string' || !rec.toolUseId) return null
  const out: ParsedMeta = {
    toolUseId: rec.toolUseId,
    agentType: typeof rec.agentType === 'string' ? rec.agentType : ''
  }
  if (typeof rec.description === 'string' && rec.description) {
    out.description = rec.description
  }
  if (typeof rec.model === 'string' && rec.model) {
    out.model = rec.model
  }
  if (typeof rec.spawnDepth === 'number' && Number.isFinite(rec.spawnDepth)) {
    out.spawnDepth = rec.spawnDepth
  }
  if (typeof rec.parentAgentId === 'string' && rec.parentAgentId) {
    out.parentAgentId = rec.parentAgentId
  }
  return out
}

// List a session's subagents by reading their meta sidecars, correlating each to
// the Task tool_use that spawned it. Returns [] when the session never spawned
// any (no subagents/ directory → ENOENT) and null when the directory exists but
// could not be read (permission errors and the like) — the panel treats those
// as distinct states. Per-file failures stay lenient: one bad sidecar is
// skipped, the rest still list.
export const listSubagents = async (
  cwd: string | null,
  sessionId: string,
  io: StoreIo = nodeIo
): Promise<SubagentInfo[] | null> => {
  if (!sessionId) return []
  const found = await resolveSessionDir(sessionId, cwd, io)
  if (found.status === 'unavailable') return null
  if (found.status !== 'ok') return []
  return listSubagentsIn(subagentsDir(found.dir, sessionId), io)
}

const listSubagentsIn = async (
  dir: string,
  io: StoreIo
): Promise<SubagentInfo[] | null> => {
  let names: string[]
  try {
    names = await io.readdir(dir)
  } catch (e) {
    return isMissing(e) ? [] : null
  }
  const infos: SubagentInfo[] = []
  for (const name of names) {
    if (!name.endsWith('.meta.json')) continue
    const agentId = name.slice(0, -'.meta.json'.length).replace(/^agent-/, '')
    try {
      const meta = parseMeta(await io.readFile(join(dir, name)))
      if (meta) {
        const { toolUseId, ...rest } = meta
        infos.push({
          parentToolUseId: toolUseId,
          agentId,
          ...rest
        })
      }
    } catch {
      // skip unreadable sidecar
    }
  }
  return infos
}

// Read one subagent's transcript, resolved by the parent Task tool_use id the
// renderer already holds from the live card. Empty array when the session has no
// matching subagent yet (lenient, like readTranscript).
export const readSubagentTranscript = async (
  cwd: string | null,
  sessionId: string,
  parentToolUseId: string,
  io: StoreIo = nodeIo
): Promise<TranscriptMessage[]> => {
  if (!sessionId || !parentToolUseId) return []
  const dir = await resolveSubagentsDir(cwd, sessionId, io)
  if (dir === null) return []
  const match = ((await listSubagentsIn(dir, io)) ?? []).find(
    (i) => i.parentToolUseId === parentToolUseId
  )
  if (!match) return []
  let raw: string
  try {
    raw = await io.readFile(join(dir, `agent-${match.agentId}.jsonl`))
  } catch {
    return []
  }
  return parseTranscript(raw, { includeSidechain: true })
}
