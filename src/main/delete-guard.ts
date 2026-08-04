import type { DeleteStatus } from '../shared/session-types'

// The busy refusal for the app's ONE destructive call, decided in main (#107).
//
// It lives apart from `index.ts` because the electron entry cannot be imported
// under vitest, and what has to be pinned is that the store is never REACHED on
// a refusal — a guard that answered 'failed' after unlinking the file would
// satisfy any status-only assertion while destroying the transcript.

export interface DeletePorts {
  /** A turn is in flight. The engine's own state — never a second flag. */
  isBusy(): boolean
  /**
   * The session that turn is streaming into, as MAIN knows it. Null before the
   * first turn has run (#54 deliberately keeps a warm-up id out of this), which
   * is why the identity check has to be `=== id` rather than a truthiness test.
   */
  runningId(): string | null
  /** The store's own delete. Reached only when the guard allows it. */
  remove(id: string): Promise<DeleteStatus>
}

/**
 * Refuse a delete aimed at the session the engine is streaming into.
 *
 * **This is not the "second busy source" the boundary comment used to reject.**
 * The rail's `disabled={active && busy}` compares against the renderer's
 * `activeSessionId`, which is written only at turn-end — so during the FIRST
 * turn of a fresh conversation the renderer holds null, the row is not active,
 * and its trash button is live. Main is the only place the in-flight id exists
 * at that moment, so this cannot disagree with the rail: it decides a case the
 * rail is structurally unable to see. The rail's control stays exactly as it
 * is, a visible affordance rather than the authority.
 *
 * Only the running session is refused. Deleting a FOREIGN session mid-turn stays
 * allowed, because that turn appends to its own transcript and no other.
 */
export const guardedDelete = async (
  ports: DeletePorts,
  id: string
): Promise<DeleteStatus> => {
  if (ports.isBusy() && ports.runningId() === id) return 'failed'
  return ports.remove(id)
}
