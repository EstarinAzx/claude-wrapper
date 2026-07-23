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
