import type { MessageUuid } from './message-uuid'

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
  // The project directory the session ran in, as the store records it. ABSENT,
  // not '', when the session records none — those group under "Unknown project"
  // and cannot be resumed into a workspace. Display and grouping only: a store
  // path is never derived from it (see session-index.ts).
  cwd?: string
}

// Resuming a session that lives in another project is one main-process
// transaction (#46). The request and its four outcomes are shared because both
// ends of the IPC speak them: the renderer sends the row's project + id and
// renders the result, main runs the transition. The logic stays in
// `src/main/switch-workspace.ts`.
export interface SwitchRequest {
  cwd: string | null
  /** `null` = open this workspace with a NEW chat: no target, no index check. */
  resumeId: string | null
}

export type SwitchStatus = 'ok' | 'busy' | 'not-found' | 'missing-cwd'

export interface SwitchResult {
  status: SwitchStatus
}

// Permanently removing one session from the store (#68). TWO outcomes, and
// deliberately no third: a not-found delete is `ok` (the store no longer holds
// it, which is exactly what the user asked for), and every other failure is this
// one `failed`. There is no `busy` here — the refusal of an in-flight session is
// the rail disabling its own control, not a status main returns; see Sidebar.
//
// A bare union rather than a `{ status }` object like SwitchResult: this answer
// has one field and no prospect of a second, and the type name already says what
// the string means. Emphatically NOT a `null`-vs-`[]` analogue — that convention
// belongs to the read channels (#60) and a third one here would buy nothing.
export type DeleteStatus = 'ok' | 'failed'

// The folder chooser (#48). A chooser and NOTHING else: it opens the dialog and
// reports what came back, mutating no engine, no cwd and no renderer state.
// That is the whole point of its existing beside `session:pick-folder`, which
// chooses AND tears the engine down — a cancel has to be a true no-op, and a
// selection has to reach the renderer so the switch transaction (#46) can run
// the transition as one atomic unit instead of two half-transitions.
export type FolderChoice = { status: 'cancelled' } | { status: 'selected'; cwd: string }

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
  | {
      role: 'user'
      text: string
      attachments?: AttachmentMarker[]
      // #130 — the id the CLI stored this message under, carried through from
      // the transcript's own `uuid` field so a REOPENED conversation can address
      // a file rewind. Absent when the stored line carried no usable uuid; the
      // control renders only where it is present.
      rewindId?: MessageUuid
    }
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
