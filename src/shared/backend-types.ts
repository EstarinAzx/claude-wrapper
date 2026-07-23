// The backend the wrapped Claude Code routes through. Wire type shared by the
// main-side state, the preload bridge, and the renderer pill. Carries only the
// mode enum and an availability flag — never the proxy endpoint or token.

export type BackendMode = 'native' | 'wisped'

export interface BackendInfo {
  mode: BackendMode
  wispedAvailable: boolean
}
