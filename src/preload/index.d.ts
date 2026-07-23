import type { EngineEvent, PermissionDecision } from '../shared/engine-types'
import type { SessionMeta, TranscriptMessage } from '../shared/session-types'
import type { BackendInfo } from '../shared/backend-types'

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
