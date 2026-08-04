import { describe, test, expect, vi } from 'vitest'
import { guardedSend, type SendPorts } from '../src/main/send-guard'
import type { SendPayload } from '../src/shared/attachment-types'

// #113 — the busy refusal for `chat:send`, decided in MAIN.
//
// Before this guard, a second send under a live turn reached `runTurn`, whose
// overlap branch answers `{ type: 'error' }` on the SECOND caller's `onEvent` —
// a fresh closure in `index.ts` forwarding to the same renderer, which treats
// every error as turn-terminal and clears `busy` at 518ms while the first turn
// is still streaming (measured by the #108 spike, `aa8e683`).
//
// It lives apart from `index.ts` for the same reason `delete-guard.ts` and
// `switch-workspace.ts` do: the electron entry cannot be imported under vitest,
// and this is precisely the logic that has to be unit-tested.
//
// THE ASSERTIONS ARE ON WHETHER `startTurn` WAS REACHED, never on a status.
// A guard that refused *after* calling `runTurn` would satisfy any status-only
// assertion while the second `onEvent` was already attached and the renderer
// already told the turn had ended — which is the whole defect. Acceptance 4
// asks for exactly this distinction.

const PAYLOAD: SendPayload = { text: 'second prompt', attachments: [] }
const FIRST: SendPayload = { text: 'first prompt', attachments: [] }

const startTurnMock = (): ReturnType<typeof vi.fn<(p: SendPayload) => void>> =>
  vi.fn<(p: SendPayload) => void>()

const ports = (
  over: Partial<SendPorts> = {}
): { ports: SendPorts; startTurn: ReturnType<typeof startTurnMock> } => {
  const startTurn = startTurnMock()
  return { ports: { isBusy: () => false, startTurn, ...over }, startTurn }
}

describe('the send guard (#113)', () => {
  // AC4. The second send must not reach the engine at all.
  test('refuses a second send while a turn is in flight', () => {
    const { ports: p, startTurn } = ports({ isBusy: () => true })

    guardedSend(p, PAYLOAD)

    expect(startTurn).not.toHaveBeenCalled()
  })

  // AC1, stated structurally rather than through the renderer: the `onEvent`
  // closure is built INSIDE `startTurn` at the call site, so a `startTurn` that
  // is never reached is an `onEvent` that is never attached — and an unattached
  // callback cannot deliver the turn-terminal error. This is the assertion that
  // a guard refusing after the call would fail.
  test('no second onEvent is ever constructed for a refused send', () => {
    let onEventsAttached = 0
    const p: SendPorts = {
      isBusy: () => true,
      startTurn: () => {
        // Stands in for `index.ts`, which builds the forwarding closure here.
        const onEvent = (): void => {}
        void onEvent
        onEventsAttached += 1
      }
    }

    guardedSend(p, PAYLOAD)

    expect(onEventsAttached).toBe(0)
  })

  test('an idle engine runs the turn, with the payload it was handed', () => {
    const { ports: p, startTurn } = ports({ isBusy: () => false })

    guardedSend(p, FIRST)

    expect(startTurn).toHaveBeenCalledTimes(1)
    expect(startTurn).toHaveBeenCalledWith(FIRST)
  })

  // The refusal is not sticky: it is a read of the engine's own live state, so
  // the very next send after the turn ends is accepted. A guard latching a flag
  // would pass the two tests above and fail this one.
  test('accepts the next send once that turn has ended', () => {
    const { ports: p, startTurn } = ports({ isBusy: () => true })
    guardedSend(p, PAYLOAD)
    expect(startTurn).not.toHaveBeenCalled()

    let busy = true
    const { ports: q, startTurn: second } = ports({ isBusy: () => busy })
    busy = false
    guardedSend(q, PAYLOAD)

    expect(second).toHaveBeenCalledTimes(1)
  })

  // Main's own fact, and nothing supplied by the renderer, decides this. The
  // arity is the boundary's: a payload and no busy hint, so no caller can talk
  // the guard out of a refusal.
  test('refuses on the engine’s own state, with nothing supplied by the caller', () => {
    const { ports: p, startTurn } = ports({ isBusy: () => true })

    expect(guardedSend.length).toBe(2)
    guardedSend(p, PAYLOAD)

    expect(startTurn).not.toHaveBeenCalled()
  })
})
