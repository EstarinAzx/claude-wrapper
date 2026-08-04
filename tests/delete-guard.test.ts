import { describe, test, expect, vi } from 'vitest'
import { guardedDelete, type DeletePorts } from '../src/main/delete-guard'
import type { DeleteStatus } from '../src/shared/session-types'

// #107 — the busy refusal made authoritative in MAIN.
//
// The rail refuses `disabled={active && busy}`, where `active` compares against
// the renderer's `activeSessionId` — a value written only at turn-end. During
// the FIRST turn of a fresh conversation the renderer has null, the row is not
// active, and its trash button is live. Main is the only place the in-flight id
// exists at that moment, which is why the decision moved here.
//
// It lives apart from `index.ts` for the same reason `switch-workspace.ts` does:
// the electron entry cannot be imported under vitest, and this is precisely the
// logic that has to be unit-tested. The assertions are on whether `remove` was
// REACHED, never only on the status: a guard that returned 'failed' after
// unlinking the file would satisfy a status-only test while destroying the
// transcript it was written to protect.

const LIVE = 'live-session'
const OTHER = 'other-session'

const ports = (
  over: Partial<DeletePorts> = {}
): { ports: DeletePorts; remove: ReturnType<typeof removeMock> } => {
  const remove = removeMock()
  return {
    ports: { isBusy: () => false, runningId: () => null, remove, ...over },
    remove
  }
}

// Typed with the real signature: a bare `vi.fn()` infers an empty argument
// tuple, so `mock.calls[0][0]` stops typechecking while `vitest run` — which
// does not typecheck — stays green.
const removeMock = (): ReturnType<typeof vi.fn<(id: string) => Promise<DeleteStatus>>> =>
  vi.fn<(id: string) => Promise<DeleteStatus>>().mockResolvedValue('ok')

describe('the delete guard (#107)', () => {
  // AC1, first half.
  test('refuses the session the engine is currently running', async () => {
    const { ports: p, remove } = ports({ isBusy: () => true, runningId: () => LIVE })

    expect(await guardedDelete(p, LIVE)).toBe('failed')
    expect(remove).not.toHaveBeenCalled()
  })

  // AC1, second half, and the one a blanket refusal fails. Deleting a FOREIGN
  // session mid-turn was always safe — that turn appends to its own transcript
  // and no other — so refusing everything while busy would be a regression
  // dressed as a fix.
  test('allows a different session while that same turn runs', async () => {
    const { ports: p, remove } = ports({ isBusy: () => true, runningId: () => LIVE })

    expect(await guardedDelete(p, OTHER)).toBe('ok')
    expect(remove).toHaveBeenCalledWith(OTHER)
  })

  // AC2. The trigger is the renderer holding NULL, and the guard's whole point
  // is that it never asks. Its inputs are main's own two facts, so there is no
  // argument a renderer could pass that changes this answer — which is what
  // makes the refusal hold in exactly the case the rail's own control cannot
  // see. A guard taking an "active id" parameter could not pass this test
  // without the caller supplying the very value that does not exist yet.
  test('refuses on main’s own facts alone, with nothing supplied by the renderer', async () => {
    const { ports: p, remove } = ports({ isBusy: () => true, runningId: () => LIVE })

    // Exactly the arity the IPC handler has: the boundary forwards an id and
    // nothing else.
    expect(guardedDelete.length).toBe(2)
    expect(await guardedDelete(p, LIVE)).toBe('failed')
    expect(remove).not.toHaveBeenCalled()
  })

  test('allows the same session once the turn has ended', async () => {
    const { ports: p, remove } = ports({ isBusy: () => false, runningId: () => LIVE })

    expect(await guardedDelete(p, LIVE)).toBe('ok')
    expect(remove).toHaveBeenCalledWith(LIVE)
  })

  // An engine that has never run a turn reports null (#54 keeps a warm-up id
  // out of `sessionId()`), and null must never match the id under the cursor.
  test('a null running id refuses nothing', async () => {
    const { ports: p, remove } = ports({ isBusy: () => true, runningId: () => null })

    expect(await guardedDelete(p, LIVE)).toBe('ok')
    expect(remove).toHaveBeenCalledWith(LIVE)
  })

  // The store's own answer is carried out unchanged: the guard adds a refusal,
  // it does not re-interpret a delete that actually happened.
  test('passes the store’s own failure through', async () => {
    const { ports: p, remove } = ports()
    remove.mockResolvedValue('failed')

    expect(await guardedDelete(p, LIVE)).toBe('failed')
    expect(remove).toHaveBeenCalledWith(LIVE)
  })
})
