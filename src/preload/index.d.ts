import type { EngineEvent, PermissionDecision } from '../shared/engine-types'
import type { SessionMeta } from '../shared/session-types'

export interface WrapperApi {
  minimize: () => void
  toggleMaximize: () => void
  close: () => void
  pickFolder: () => Promise<string | null>
  listSessions: () => Promise<SessionMeta[]>
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
