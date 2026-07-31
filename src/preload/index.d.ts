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
import type { ModelInfo } from '../shared/model-types'
import type { SubagentInfo } from '../shared/subagent-types'
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
  listModels: () => Promise<ModelInfo>
  setModel: (model: string | null) => void
  onModelChanged: (cb: (model: string | null) => void) => () => void
  watchSession: (id: string | null) => void
  onSessionChanged: (cb: (id: string) => void) => () => void
  setZoom: (level: number) => void
  // One-way (#69). Two values only; main normalises at the boundary regardless.
  setBackdrop: (material: Backdrop) => void
  sendPrompt: (payload: SendPayload) => void
  stopTurn: () => void
  respondToPermission: (toolUseId: string, decision: PermissionDecision) => void
  onEngineTerminal: (cb: () => void) => () => void
  onChatEvent: (cb: (e: EngineEvent) => void) => () => void
}

declare global {
  interface Window {
    api: WrapperApi
  }
}
