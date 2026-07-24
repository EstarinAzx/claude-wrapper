import { readdir, readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { TranscriptMessage } from '../shared/session-types'
import type { SubagentInfo } from '../shared/subagent-types'
import { encodeCwd } from './session-store'
import { parseTranscript } from './transcript'

// On-demand disk reader for the subagent viewer. The SDK ships getSubagentMessages /
// listSubagents, but neither exposes the meta sidecar that carries the Task
// `toolUseId` — and that id is the ONLY stable correlation between the live
// stream (parent_tool_use_id) and the persisted transcript. So this store reads
// the transcript tree directly:
//   ~/.claude/projects/<enc-cwd>/<sessionId>/subagents/
//     agent-<agentId>.jsonl        the subagent's own thread (all isSidechain)
//     agent-<agentId>.meta.json    { agentType, description, toolUseId, spawnDepth }
// Correlation recorded (ticket #24 build-time check): meta.json `toolUseId` ===
// the live engine `parent_tool_use_id`. The renderer opens a subagent by the
// parentToolUseId it already holds from the live Task card; we resolve that to an
// agentId here. Reusing parseTranscript (with includeSidechain) yields the shared
// TranscriptMessage shape the drawer renders with, no SessionMessage mapping.

export interface SubagentIo {
  readdir(dir: string): Promise<string[]>
  readFile(file: string): Promise<string>
}

const nodeIo: SubagentIo = {
  readdir: (dir) => readdir(dir),
  readFile: (file) => readFile(file, 'utf8')
}

const subagentsDir = (cwd: string, sessionId: string): string =>
  join(homedir(), '.claude', 'projects', encodeCwd(cwd), sessionId, 'subagents')

// Parse an agent-<id>.meta.json sidecar. Null on garbage or a missing toolUseId
// (a subagent we can't correlate is not surfaced).
export const parseMeta = (
  raw: string
): { toolUseId: string; agentType: string } | null => {
  let obj: unknown
  try {
    obj = JSON.parse(raw)
  } catch {
    return null
  }
  if (!obj || typeof obj !== 'object') return null
  const rec = obj as { toolUseId?: unknown; agentType?: unknown }
  if (typeof rec.toolUseId !== 'string' || !rec.toolUseId) return null
  return {
    toolUseId: rec.toolUseId,
    agentType: typeof rec.agentType === 'string' ? rec.agentType : ''
  }
}

// List a session's subagents by reading their meta sidecars, correlating each to
// the Task tool_use that spawned it. Lenient: unreadable dir/files are skipped,
// mirroring session-store.
export const listSubagents = async (
  cwd: string | null,
  sessionId: string,
  io: SubagentIo = nodeIo
): Promise<SubagentInfo[]> => {
  if (!cwd || !sessionId) return []
  const dir = subagentsDir(cwd, sessionId)
  let names: string[]
  try {
    names = await io.readdir(dir)
  } catch {
    return []
  }
  const infos: SubagentInfo[] = []
  for (const name of names) {
    if (!name.endsWith('.meta.json')) continue
    const agentId = name.slice(0, -'.meta.json'.length).replace(/^agent-/, '')
    try {
      const meta = parseMeta(await io.readFile(join(dir, name)))
      if (meta) {
        infos.push({
          parentToolUseId: meta.toolUseId,
          agentId,
          agentType: meta.agentType
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
  io: SubagentIo = nodeIo
): Promise<TranscriptMessage[]> => {
  if (!cwd || !sessionId || !parentToolUseId) return []
  const match = (await listSubagents(cwd, sessionId, io)).find(
    (i) => i.parentToolUseId === parentToolUseId
  )
  if (!match) return []
  let raw: string
  try {
    raw = await io.readFile(join(subagentsDir(cwd, sessionId), `agent-${match.agentId}.jsonl`))
  } catch {
    return []
  }
  return parseTranscript(raw, { includeSidechain: true })
}
