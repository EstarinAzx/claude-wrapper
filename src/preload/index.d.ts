import type { EngineEvent, PermissionDecision, PermissionMode } from '../shared/engine-types'
import type {
  DeleteStatus,
  FolderChoice,
  SessionMeta,
  SwitchRequest,
  SwitchResult,
  TranscriptMessage
} from '../shared/session-types'
import type { BackendInfo, BackendMode } from '../shared/backend-types'
import type { Backdrop } from '../shared/backdrop'
import type { Bounds } from '../shared/window-bounds'
import type { ModelInfo } from '../shared/model-types'
import type { EffortLevel } from '../shared/effort'
import type { SubagentInfo } from '../shared/subagent-types'
import type { BackgroundTask } from '../shared/background-tasks'
import type { BackgroundSession } from '../shared/background-session-types'
import type { SendPayload } from '../shared/attachment-types'
import type { Candidate } from '../shared/attachment-policy'
import type { SlashCommandInfo } from '../shared/command-types'

export interface WrapperApi {
  minimize: () => void
  toggleMaximize: () => void
  close: () => void
  pickFolder: () => Promise<string | null>
  chooseFolder: () => Promise<FolderChoice>
  pickFiles: () => Promise<Candidate[]>
  // `null` = the read FAILED (#60). `[]` still means the store holds nothing.
  listSessions: () => Promise<SessionMeta[] | null>
  loadTranscript: (id: string) => Promise<TranscriptMessage[] | null>
  titleHint: (id: string, cwd: string | null) => Promise<string | null>
  listSubagents: (sessionId: string) => Promise<SubagentInfo[] | null>
  subagentTranscript: (
    sessionId: string,
    parentToolUseId: string
  ) => Promise<TranscriptMessage[]>
  // #91: LIVE BACKGROUND SESSIONS in the open workspace — the CLI's agent view.
  // Not `listSubagents` (subagents inside ONE session), not `onBackgroundTasks`
  // (jobs inside ONE session). One CLI process per call, ~893ms (#90) — never
  // call it on a timer. `null` = the look failed; `[]` = nothing is running.
  listBackgroundSessions: () => Promise<BackgroundSession[] | null>
  switchWorkspace: (req: SwitchRequest) => Promise<SwitchResult>
  // Irreversible (#68). `ok` also covers a session the store no longer holds.
  deleteSession: (id: string) => Promise<DeleteStatus>
  targetSession: (id: string | null) => void
  currentSessionId: () => Promise<string | null>
  backendMode: () => Promise<BackendInfo>
  setBackendMode: (mode: BackendMode) => void
  onBackendChanged: (cb: (info: BackendInfo) => void) => () => void
  permissionMode: () => Promise<PermissionMode>
  setPermissionMode: (mode: PermissionMode) => void
  onPermissionChanged: (cb: (mode: PermissionMode) => void) => () => void
  listCommands: () => Promise<SlashCommandInfo[]>
  listWorkspaceFiles: () => Promise<string[]>
  listModels: () => Promise<ModelInfo>
  setModel: (model: string | null) => void
  onModelChanged: (cb: (model: string | null) => void) => () => void
  // #124 — no `listEffort`; the current value rides listModels above.
  setEffort: (effort: EffortLevel | null) => void
  onEffortChanged: (cb: (effort: EffortLevel | null) => void) => () => void
  watchSession: (id: string | null) => void
  onSessionChanged: (cb: (id: string) => void) => () => void
  setZoom: (level: number) => void
  // One-way (#69). Two values only; main normalises at the boundary regardless.
  setBackdrop: (material: Backdrop) => void
  // #79 — two-way, uniquely: bounds change in MAIN (the user drags the window)
  // and are merely stored here. `null` out means nothing is stored yet.
  setWindowBounds: (bounds: Bounds | null) => void
  onWindowBoundsChanged: (cb: (bounds: Bounds) => void) => () => void
  sendPrompt: (payload: SendPayload) => void
  stopTurn: () => void
  respondToPermission: (toolUseId: string, decision: PermissionDecision) => void
  onEngineTerminal: (cb: () => void) => () => void
  // #83 — REPLACE semantics: every payload is the full live set, and `[]` on an
  // engine rebuild is the per-process reset, not "nothing happened".
  onBackgroundTasks: (cb: (tasks: BackgroundTask[]) => void) => () => void
  onSubagent: (cb: (event: Extract<EngineEvent, { type: 'subagent' }>) => void) => () => void
  onChatEvent: (cb: (e: EngineEvent) => void) => () => void
}

declare global {
  interface Window {
    api: WrapperApi
  }
}
