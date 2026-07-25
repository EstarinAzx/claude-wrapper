// One spawned subagent, correlated from its persisted transcript. `parentToolUseId`
// is the id of the Task tool_use that spawned it (mirrors the live engine
// `subagent` event's parentToolUseId and the on-disk `agent-<id>.meta.json`
// `toolUseId`); `agentId` is the on-disk transcript id. The renderer opens a
// subagent by parentToolUseId — the id it already has from the live Task card.
// `description`, `model`, `spawnDepth`, and `parentAgentId` come straight from
// the sidecar and are absent (not zero/empty) when the sidecar omits them.
export interface SubagentInfo {
  parentToolUseId: string
  agentId: string
  agentType: string
  description?: string
  model?: string
  spawnDepth?: number
  parentAgentId?: string
}

// One subagent as the LIVE stream knows it, accumulated in the renderer from the
// engine's `subagent` events. Same correlation key as the disk sidecar
// (`parentToolUseId`), which is what lets the two be merged into one list.
// Everything past `status` is absent until a task message supplies it.
export interface LiveAgent {
  parentToolUseId: string
  status: 'running' | 'done' | 'failed'
  taskId?: string
  agentType?: string
  description?: string
  totalTokens?: number
  toolUses?: number
  durationMs?: number
  lastToolName?: string
}

// A row in the Agents panel: one subagent, whatever the source. `status` and the
// usage fields are absent for a disk-only row — the sidecars never recorded
// them, and the panel must not render that absence as a zero.
export interface AgentRow {
  parentToolUseId: string
  agentType: string
  agentId?: string
  description?: string
  model?: string
  spawnDepth?: number
  status?: 'running' | 'done' | 'failed'
  totalTokens?: number
  toolUses?: number
  durationMs?: number
  lastToolName?: string
}

// Merge disk sidecars with live-stream agents into one Agents-panel list.
// One row per parentToolUseId; live fields win when both supply a value.
// Usage keys stay absent (not zeroed) when neither source reported them, so a
// disk-only row is distinguishable from a live row that genuinely reported 0.
export const mergeAgents = (disk: SubagentInfo[], live: LiveAgent[]): AgentRow[] => {
  const liveById = new Map(live.map((a) => [a.parentToolUseId, a]))
  const seen = new Set<string>()
  const rows: AgentRow[] = []

  const buildRow = (
    parentToolUseId: string,
    d: SubagentInfo | undefined,
    l: LiveAgent | undefined
  ): AgentRow => {
    const agentType = (l?.agentType || d?.agentType) ?? 'Agent'
    const row: AgentRow = { parentToolUseId, agentType: agentType || 'Agent' }

    const description = l?.description !== undefined ? l.description : d?.description
    if (description !== undefined) row.description = description

    if (d?.agentId !== undefined) row.agentId = d.agentId
    if (d?.model !== undefined) row.model = d.model
    if (d?.spawnDepth !== undefined) row.spawnDepth = d.spawnDepth

    if (l) {
      row.status = l.status
      // Only copy usage fields that live actually supplied — leave the key
      // absent rather than writing undefined/0 as a stand-in for "unknown".
      if (l.totalTokens !== undefined) row.totalTokens = l.totalTokens
      if (l.toolUses !== undefined) row.toolUses = l.toolUses
      if (l.durationMs !== undefined) row.durationMs = l.durationMs
      if (l.lastToolName !== undefined) row.lastToolName = l.lastToolName
    }

    return row
  }

  for (const d of disk) {
    seen.add(d.parentToolUseId)
    rows.push(buildRow(d.parentToolUseId, d, liveById.get(d.parentToolUseId)))
  }

  for (const l of live) {
    if (seen.has(l.parentToolUseId)) continue
    rows.push(buildRow(l.parentToolUseId, undefined, l))
  }

  return rows
}
