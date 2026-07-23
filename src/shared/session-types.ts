// Metadata for one recorded Claude Code session, derived from its `*.jsonl`
// transcript in the native store (~/.claude/projects/<enc-cwd>/).
export interface SessionMeta {
  // Filename stem (also the SDK session id), e.g. "b453af6f-…".
  id: string
  // First user message text, trimmed and truncated; '' when none is found.
  title: string
  // Newest line timestamp as epoch ms; 0 when no timestamp parses.
  lastUpdated: number
  // Count of user + assistant message lines in the transcript.
  messageCount: number
}

// One replayed message from a parsed session transcript. Mirrors the renderer's
// ChatMessage user/assistant/tool cases, minus renderer-transient fields (the
// renderer assigns its own id + permission when it maps these back on replay).
export type TranscriptMessage =
  | { role: 'user'; text: string }
  | { role: 'assistant'; text: string }
  | {
      role: 'tool'
      toolUseId: string
      name: string
      input: Record<string, unknown>
      // Raw tool_result text, or null if the session has no result for it yet.
      result: string | null
      isError: boolean
    }
