// Metadata for one recorded Claude Code session, as the SDK's `listSessions`
// reports it from the native store (~/.claude/projects/<enc-cwd>/).
export interface SessionMeta {
  // The SDK session id, e.g. "b453af6f-…".
  id: string
  // The SDK's `summary`: custom title, else auto-summary, else first prompt.
  // '' when the session has none. Not truncated here — the row ellipsises in CSS.
  title: string
  // The session file's last-modified time as epoch ms.
  lastUpdated: number
}

// A non-text block from a persisted user message, recorded so a reopened
// session shows WHAT was attached without carrying the payload. The base64
// data is deliberately not forwarded: one measured screenshot was 263 KB, so
// replaying it would push megabytes across IPC on every session open.
export interface AttachmentMarker {
  // The persisted block type — 'image', 'document', or whatever the SDK adds
  // next. An unrecognised kind is recorded, never dropped.
  kind: string
  // `source.media_type` when the block carries one. Absent, not '', when not.
  mediaType?: string
  // A filename when the block names one. No real transcript block does today
  // (0 of 185 measured), so this is defensive.
  name?: string
}

// One replayed message from a parsed session transcript. Mirrors the renderer's
// ChatMessage user/assistant/tool cases, minus renderer-transient fields (the
// renderer assigns its own id + permission when it maps these back on replay).
export type TranscriptMessage =
  | { role: 'user'; text: string; attachments?: AttachmentMarker[] }
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
