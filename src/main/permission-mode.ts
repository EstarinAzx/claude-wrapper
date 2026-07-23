// In-app permission-mode override. Unlike the launch-env-driven backend mode,
// this is a plain session choice: the default is bypassPermissions (owner
// choice — the wrapper auto-runs every tool with no confirmation until a
// stricter mode is picked), held in memory only, reset to bypass each launch.
// Reverses the earlier "inherit host permissions" stance by intentionally
// pinning permissionMode into the SDK query options.

import type { PermissionMode } from '../shared/engine-types'
export type { PermissionMode }

let currentMode: PermissionMode = 'bypassPermissions'

export const getPermissionMode = (): PermissionMode => currentMode

export const setPermissionMode = (mode: PermissionMode): void => {
  currentMode = mode
}

// Map a mode to the SDK query options. bypassPermissions additionally requires
// the explicit danger flag (sdk.d.ts: "Must be set to true when using
// permissionMode: 'bypassPermissions'").
export const toPermissionOptions = (
  mode: PermissionMode
): Record<string, unknown> =>
  mode === 'bypassPermissions'
    ? { permissionMode: 'bypassPermissions', allowDangerouslySkipPermissions: true }
    : { permissionMode: mode }
