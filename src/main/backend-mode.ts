// Backend routing: does the wrapped Claude Code talk to the real Anthropic
// endpoint (native, host ~/.claude login) or to the local Wisp proxy (wisped)?
// The wisp values are snapshotted from the launch env — the app never derives
// the proxy endpoint or token any other way, and never persists them.

import type { BackendMode } from '../shared/backend-types'
export type { BackendMode }

// The launch-env vars that constitute "wisped": the proxy endpoint, its token,
// and the gateway model-discovery flag. ANTHROPIC_BASE_URL is the load-bearing
// one — its presence is what makes wisped available at all.
const WISP_KEYS = [
  'ANTHROPIC_BASE_URL',
  'ANTHROPIC_API_KEY',
  'CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY'
] as const

export type WispSnapshot = Record<string, string>

/** Capture the wisp routing vars present (and non-empty) in the launch env. */
export const snapshotWispEnv = (env: NodeJS.ProcessEnv): WispSnapshot => {
  const snap: WispSnapshot = {}
  for (const key of WISP_KEYS) {
    const value = env[key]
    if (typeof value === 'string' && value !== '') snap[key] = value
  }
  return snap
}

/** Wisped routing is available only if the launch env carried the proxy endpoint. */
export const wispedAvailable = (snapshot: WispSnapshot): boolean =>
  typeof snapshot['ANTHROPIC_BASE_URL'] === 'string'

/** The mode the app starts in matches how it was launched. */
export const initialMode = (snapshot: WispSnapshot): BackendMode =>
  wispedAvailable(snapshot) ? 'wisped' : 'native'

// Build the COMPLETE subprocess env for a spawn. The Agent SDK's options.env
// REPLACES the child env wholesale (sdk.d.ts: "not merged with process.env"),
// so we spread the base env and then apply the mode's routing over it.
//   wisped → base + the snapshot wisp vars (route through the proxy)
//   native → base with the wisp vars STRIPPED (host ~/.claude login → Anthropic)
export const resolveSpawnEnv = (
  mode: BackendMode,
  snapshot: WispSnapshot,
  baseEnv: NodeJS.ProcessEnv
): NodeJS.ProcessEnv => {
  const env: NodeJS.ProcessEnv = { ...baseEnv }
  if (mode === 'wisped') {
    for (const [key, value] of Object.entries(snapshot)) env[key] = value
  } else {
    for (const key of WISP_KEYS) delete env[key]
  }
  return env
}

// --- Process-wide state (mirrors session.ts holding the cwd). No persistence:
// the launch env carries the intent, so initial mode = match-launch-env.

let currentMode: BackendMode = 'native'
let snapshot: WispSnapshot = {}

/** Snapshot the launch env once at boot and set the initial mode from it. */
export const initBackendMode = (env: NodeJS.ProcessEnv): void => {
  snapshot = snapshotWispEnv(env)
  currentMode = initialMode(snapshot)
}

export const getBackendMode = (): BackendMode => currentMode

export const isWispedAvailable = (): boolean => wispedAvailable(snapshot)

/** The resolved spawn env for the current mode, built on the given base env. */
export const getSpawnEnv = (baseEnv: NodeJS.ProcessEnv): NodeJS.ProcessEnv =>
  resolveSpawnEnv(currentMode, snapshot, baseEnv)
