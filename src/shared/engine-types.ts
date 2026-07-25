import type { SendPayload } from './attachment-types'

export type PermissionDecision = 'allow' | 'deny'

// The permission modes the app exposes as an in-app toggle. A subset of the
// SDK's PermissionMode, assignable straight into query options.permissionMode.
//   bypassPermissions — auto-run every tool, no prompt (needs the danger flag)
//   acceptEdits       — auto-accept file edits, prompt for everything else
//   default           — prompt per tool (the Allow/Deny card)
export type PermissionMode = 'bypassPermissions' | 'acceptEdits' | 'default'

export type EngineEvent =
  | { type: 'text-delta'; text: string }
  | { type: 'tool-use'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'tool-result'; id: string; text: string; isError: boolean }
  // A subagent (spawned by an Agent tool call) is present under its parent tool
  // call. Bucketed by parentToolUseId — the id of the Agent tool_use that spawned
  // it, which also equals the persisted agent-<id>.meta.json `toolUseId`, so the
  // renderer can later resolve it to a disk transcript. Subagent output itself
  // never leaks into the main transcript.
  //
  // ONE event type describes subagents — this one. It is emitted from two
  // sources that upsert the same key: the CLI's `system` task messages (the rich
  // path: earliest presence, plus live usage) and, as a floor, the first block
  // tagged with `parent_tool_use_id` (presence only). `running` fires once per
  // id; `done`/`failed` on task completion or the Agent tool's own tool_result.
  //
  // Every field past `status` is OPTIONAL BY DESIGN: the presence-only source
  // cannot supply them, and a missing usage number must stay missing rather than
  // arrive as a zero — "no data" and "zero tokens" are different facts and the
  // panel renders them differently.
  | {
      type: 'subagent'
      parentToolUseId: string
      status: 'running' | 'done' | 'failed'
      // The CLI's separate task id — the ONLY key carried by task_progress and
      // task_updated, so it is kept alongside parentToolUseId, not instead of it.
      taskId?: string
      agentType?: string
      description?: string
      // Cumulative context size, NOT spend (~52k floor for a trivial agent).
      totalTokens?: number
      toolUses?: number
      // Agent-elapsed and monotonic, straight from the CLI.
      durationMs?: number
      lastToolName?: string
    }
  | {
      type: 'permission-request'
      id: string
      name: string
      input: Record<string, unknown>
    }
  | { type: 'turn-end' }
  | { type: 'turn-aborted' }
  | { type: 'error'; message: string }

export interface Engine {
  runTurn(
    payload: SendPayload,
    onEvent: (e: EngineEvent) => void,
    resume?: string
  ): Promise<void>
  interrupt(): void
  sessionId(): string | null
}
