import type { EngineEvent, PermissionDecision } from '../shared/engine-types'

export interface WrapperApi {
  minimize: () => void
  toggleMaximize: () => void
  close: () => void
  pickFolder: () => Promise<string | null>
  sendPrompt: (text: string) => void
  respondToPermission: (toolUseId: string, decision: PermissionDecision) => void
  onChatEvent: (cb: (e: EngineEvent) => void) => () => void
}

declare global {
  interface Window {
    api: WrapperApi
  }
}
