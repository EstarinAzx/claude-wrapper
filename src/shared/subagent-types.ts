// One spawned subagent, correlated from its persisted transcript. `parentToolUseId`
// is the id of the Task tool_use that spawned it (mirrors the live engine
// `subagent` event's parentToolUseId and the on-disk `agent-<id>.meta.json`
// `toolUseId`); `agentId` is the on-disk transcript id. The renderer opens a
// subagent by parentToolUseId — the id it already has from the live Task card.
export interface SubagentInfo {
  parentToolUseId: string
  agentId: string
  agentType: string
}
