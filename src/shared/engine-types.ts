import type { SendPayload } from './attachment-types'
import type { SlashCommandInfo } from './command-types'
import type { ModelOption } from './model-types'

export type PermissionDecision = 'allow' | 'deny'

// What a file rewind answers (#129), for both the preview and the real call.
//
// ONE shape rather than a success/failure union, because the CLI already speaks
// exactly this vocabulary and a union would only re-encode it: a refusal IS a
// `canRewind: false` with the reason in `error`, and every route to a refusal —
// checkpointing switched off, an id with no checkpoint, an SDK too old to carry
// the method — is the same fact to the control that has to render it.
//
// The counts are what makes the preview a preview. `filesChanged` is a COUNT and
// not the list: the SDK answers it with absolute paths on the user's disk, and
// the number is what the confirmation needs.
//
// `error` is the CLI's OWN text, passed through unrewritten. A rewind attempted
// with checkpointing off must surface `File rewinding is not enabled.` rather
// than a silent no-op or a phrase this app invented.
export interface RewindResult {
  canRewind: boolean
  filesChanged: number
  insertions: number
  deletions: number
  error: string | null
}

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
  // Output of a local slash command (/context, /usage). CLI-produced text —
  // rendered as markdown under its own role, never attributed to Claude.
  | { type: 'command-output'; text: string }
  // Informational banner from the CLI (e.g. "Unknown command: … Did you
  // mean …?"). The renderer shows it through the existing notice styling.
  | { type: 'notice'; text: string }
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
  // The session to resume, or null when there is nothing resumable yet.
  // Deliberately stays null through warm-up (#54): warm-up messages carry a
  // session_id for a session the CLI has not created, and resuming into it
  // fails the turn. Callers treat non-null as "resume this", so an id that
  // cannot be resumed must not be reported.
  sessionId(): string | null
  // True exactly while a turn is in flight. The workspace transaction's busy
  // check reads this instead of tracking a flag of its own — one source of
  // truth, so "busy" can never disagree with the engine that is actually busy.
  isBusy(): boolean
  // Build the query eagerly (folder-pick) so the command list exists before the
  // first send. INERT BY CONTRACT: any failure — sync or a stream that dies
  // before a turn ever ran — is swallowed and the engine is left exactly as
  // found, so the first real send rebuilds and fails at the normal time with
  // the normal message. A user who never opens the dock cannot tell warm-up
  // exists.
  warmUp(resume?: string): void
  // Live read of the CLI's command list — never cached; the SDK's
  // supportedCommands() tracks commands_changed pushes internally. [] when
  // there is no live query (fresh launch / failed warm-up) or on any error.
  listCommands(): Promise<SlashCommandInfo[]>
  // Live read of the CLI's model list, same contract as listCommands. This is
  // the ONLY source of pickable models: the app used to hardcode four family
  // tokens, which is how it came to offer a value the CLI did not advertise
  // while missing ten that it did.
  listModels(): Promise<ModelOption[]>
  // Restore the workspace's tracked files to their state at `userMessageId`
  // (#129). FILES ONLY — the conversation is untouched, and nothing that renders
  // this may imply otherwise.
  //
  // `dryRun` is the preview: it answers `canRewind` plus the counts and leaves
  // the disk exactly as it found it (measured — the mutated file was still
  // mutated after a dry run). The destructive call is the same route with
  // `dryRun: false`.
  //
  // NEVER REJECTS. The ordinary refusal path from the CLI is a THROW, not a
  // `canRewind: false` — an id with no checkpoint answers `No file checkpoint
  // found for this message.` by throwing (#129) — and this is called from a
  // main-process IPC handler, where an escaping rejection becomes a modal error
  // dialog over the app.
  rewindFiles(userMessageId: string, dryRun: boolean): Promise<RewindResult>
}
