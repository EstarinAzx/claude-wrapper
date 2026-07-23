import type { EngineEvent, PermissionDecision, PermissionMode } from '../shared/engine-types'
import type { SessionMeta, TranscriptMessage } from '../shared/session-types'
import type { BackendInfo, BackendMode } from '../shared/backend-types'

export interface WrapperApi {
  minimize: () => void
  toggleMaximize: () => void
  close: () => void
  pickFolder: () => Promise<string | null>
  listSessions: () => Promise<SessionMeta[]>
  loadTranscript: (id: string) => Promise<TranscriptMessage[]>
  targetSession: (id: string | null) => void
  currentSessionId: () => Promise<string | null>
  backendMode: () => Promise<BackendInfo>
  setBackendMode: (mode: BackendMode) => void
  onBackendChanged: (cb: (info: BackendInfo) => void) => () => void
  permissionMode: () => Promise<PermissionMode>
  setPermissionMode: (mode: PermissionMode) => void
  onPermissionChanged: (cb: (mode: PermissionMode) => void) => () => void
  sendPrompt: (text: string) => void
  stopTurn: () => void
  respondToPermission: (toolUseId: string, decision: PermissionDecision) => void
  onChatEvent: (cb: (e: EngineEvent) => void) => () => void
}

declare global {
  interface Window {
    api: WrapperApi
  }
}
