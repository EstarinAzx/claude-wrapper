import type { ResumeTarget } from './session-index'

// The workspace transition, as ONE atomic transaction over injected ports.
//
// It lives apart from `index.ts` because the electron entry cannot be imported
// under vitest, and this is precisely the logic that has to be unit-tested: the
// ORDER of the success path and the emptiness of every rejection path are the
// contract, and both are invisible to a test that can only observe the result.
//
// Merges DORMANT (#46) — nothing calls it until #47 wires the renderer.

export type SwitchResult = { status: 'ok' | 'busy' | 'not-found' | 'missing-cwd' }

export interface SwitchPorts {
  /** A turn is in flight. The engine's own state — never a second flag. */
  isBusy(): boolean
  closeEngine(): void
  cancelPermissions(): void
  setCwd(cwd: string): void
  rebuildEngine(): void
  setResume(id: string | null): void
  warmUp(): void
  resolveTarget(sessionId: string, cwd: string): Promise<ResumeTarget>
}

export interface SwitchRequest {
  cwd: string | null
  /** `null` = open this workspace with a NEW chat: no target, no index check. */
  resumeId: string | null
}

export const switchWorkspace = async (
  ports: SwitchPorts,
  { cwd, resumeId }: SwitchRequest
): Promise<SwitchResult> => {
  // Precedence is fixed so overlapping invalid input is deterministic:
  // busy → missing-cwd → not-found. Every check runs BEFORE the first
  // mutation, which is what makes a rejection a no-op.
  if (ports.isBusy()) return { status: 'busy' }
  if (!cwd || !cwd.trim()) return { status: 'missing-cwd' }
  if (resumeId !== null) {
    const target = await ports.resolveTarget(resumeId, cwd)
    if (target.status !== 'ok') return { status: target.status }
  }

  ports.closeEngine()
  ports.cancelPermissions()
  ports.setCwd(cwd)
  ports.rebuildEngine()
  // After the rebuild, deliberately: the fresh engine reads the target when the
  // next turn runs, so writing it earlier would hand it to the engine we close.
  ports.setResume(resumeId)
  ports.warmUp()
  return { status: 'ok' }
}
