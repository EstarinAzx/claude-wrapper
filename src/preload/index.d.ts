import type { EngineEvent, PermissionDecision, PermissionMode } from '../shared/engine-types'
import type {
  FolderChoice,
  SessionMeta,
  SwitchRequest,
  SwitchResult,
  TranscriptMessage
} from '../shared/session-types'
import type { BackendInfo, BackendMode } from '../shared/backend-types'
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
  listSessions: () => Promise<SessionMeta[]>
  loadTranscript: (id: string) => Promise<TranscriptMessage[]>
  titleHint: (id: string, cwd: string | null) => Promise<string | null>
  listSubagents: (sessionId: string) => Promise<SubagentInfo[] | null>
  subagentTranscript: (
    sessionId: string,
    parentToolUseId: string
  ) => Promise<TranscriptMessage[]>
  switchWorkspace: (req: SwitchRequest) => Promise<SwitchResult>
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
  sendPrompt: (payload: SendPayload) => void
  stopTurn: () => void
  respondToPermission: (toolUseId: string, decision: PermissionDecision) => void
  onChatEvent: (cb: (e: EngineEvent) => void) => () => void
}

declare global {
  interface Window {
    api: WrapperApi
  }
}
