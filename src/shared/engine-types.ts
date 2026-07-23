export type PermissionDecision = 'allow' | 'deny'

// The permission modes the app exposes as an in-app toggle. A subset of the
// SDK's PermissionMode, assignable straight into query options.permissionMode.
//   bypassPermissions — auto-run every tool, no prompt (needs the danger flag)
//   acceptEdits       — auto-accept file edits, prompt for everything else
//   default           — prompt per tool (the Allow/Deny card)
export type PermissionMode = 'bypassPermissions' | 'acceptEdits' | 'default'

export type EngineEvent =
  | { type: 'text-delta'; text: string }
  | { type: 'tool-use'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'tool-result'; id: string; text: string; isError: boolean }
  | {
      type: 'permission-request'
      id: string
      name: string
      input: Record<string, unknown>
    }
  | { type: 'turn-end' }
  | { type: 'turn-aborted' }
  | { type: 'error'; message: string }

export interface Engine {
  runTurn(prompt: string, onEvent: (e: EngineEvent) => void, resume?: string): Promise<void>
  interrupt(): void
  sessionId(): string | null
}
