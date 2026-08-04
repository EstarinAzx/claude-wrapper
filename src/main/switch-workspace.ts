import type { ResumeTarget } from './session-index'
import type { SwitchRequest, SwitchResult } from '../shared/session-types'

// The workspace transition, as ONE atomic transaction over injected ports.
//
// It lives apart from `index.ts` because the electron entry cannot be imported
// under vitest, and this is precisely the logic that has to be unit-tested: the
// ORDER of the success path and the emptiness of every rejection path are the
// contract, and both are invisible to a test that can only observe the result.
//
// Wired to the renderer by #47 through the `session:switch-workspace` channel.

// Re-exported so the transaction's own callers keep one import site; the
// declarations live in shared because the preload and renderer speak them too.
export type { SwitchRequest, SwitchResult }

export interface SwitchPorts {
  /** A turn is in flight. The engine's own state — never a second flag. */
  isBusy(): boolean
  closeEngine(): void
  cancelPermissions(): void
  setCwd(cwd: string): void
  rebuildEngine(): void
  setResume(id: string | null): void
  /** Build the query eagerly. TAKES the resume target: the streaming query
   *  binds `resume` at CONSTRUCTION and is then cached, so a warm-up that omits
   *  it builds a query the later turn's own resume argument can no longer
   *  reach — `ensureQuery` returns early once the queue exists. The engine then
   *  runs a fresh session while the pane, refilled from disk, looks correct. */
  warmUp(resume: string | null): void
  resolveTarget(sessionId: string, cwd: string): Promise<ResumeTarget>
}

export const switchWorkspace = async (
  ports: SwitchPorts,
  { cwd, resumeId }: SwitchRequest
): Promise<SwitchResult> => {
  // Precedence is fixed so overlapping invalid input is deterministic:
  // busy → missing-cwd → not-found. Every check runs BEFORE the first
  // mutation, which is what makes a rejection a no-op. That ordering was never
  // the whole guarantee, though — see the second busy read below, which exists
  // because a check running early is not the same as its ANSWER still holding.
  if (ports.isBusy()) return { status: 'busy' }
  if (!cwd || !cwd.trim()) return { status: 'missing-cwd' }
  if (resumeId !== null) {
    const target = await ports.resolveTarget(resumeId, cwd)
    // An unreadable store (#60) is still "we could not locate that session" from
    // here: the switch is refused either way, and the refusal the renderer
    // already phrases is the honest one. The distinction earns its keep on the
    // read paths, where the alternative was a silently empty pane — a refusal
    // is already visible.
    if (target.status === 'unavailable') return { status: 'not-found' }
    if (target.status !== 'ok') return { status: target.status }
    // Read busy AGAIN, and do not delete this as redundant (#109): the read
    // above is stale by the time the mutations below run. `resolveTarget`
    // enumerates the session store, and `chat:send` has no busy guard of its
    // own, so a turn can begin inside that await — after which the first read
    // says idle and `closeEngine()` tears down a turn the user just started.
    // The window is small but real: a median 18.2ms cold against a
    // 918-transcript store, versus 0.0ms warm. Cold is the ordinary case, not
    // the edge one, because `session:list` drops the index and that same
    // listing renders the row clicked to get here.
    if (ports.isBusy()) return { status: 'busy' }
  }

  ports.closeEngine()
  ports.cancelPermissions()
  ports.setCwd(cwd)
  ports.rebuildEngine()
  // After the rebuild, deliberately: the fresh engine reads the target when the
  // next turn runs, so writing it earlier would hand it to the engine we close.
  ports.setResume(resumeId)
  // Handed the target explicitly rather than left to read it back: the warm-up
  // is what CONSTRUCTS the query, and resume binds there or not at all.
  ports.warmUp(resumeId)
  return { status: 'ok' }
}
