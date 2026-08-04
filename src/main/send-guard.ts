import type { SendPayload } from '../shared/attachment-types'

// The busy refusal for `chat:send`, decided in MAIN (#113).
//
// `runTurn` has always rejected a second turn, but it rejects it by calling the
// SECOND caller's `onEvent` — and in `index.ts` that is a fresh closure
// forwarding to the same renderer, which treats every `error` as turn-terminal.
// So the engine's own refusal was delivered as "your turn ended": measured by
// the #108 spike at 518ms, with the first turn still streaming and no Stop left
// on screen for it. The engine cannot fix this itself; it has one callback and
// no way to know the caller is a second one.
//
// The refusal therefore has to happen BEFORE the callback is attached, which is
// here — the guard runs, and only then does the call site build the closure.
//
// It lives apart from `index.ts` for the same reason `delete-guard.ts` and
// `switch-workspace.ts` do: the electron entry cannot be imported under vitest,
// and what has to be pinned is that `runTurn` is never REACHED on a refusal. A
// guard that refused after the call would satisfy any status-only assertion
// while the damage — a second `onEvent` on the renderer's wire — was already
// done.
//
// The refusal is SILENT, deliberately. The renderer half of this ticket answers
// the orphan-bubble wrinkle by never appending a bubble for a send it will not
// issue (`useChat.send` reads a ref, not the stale `busy` state), so there is
// nothing here for main to help it drop — and reporting the refusal on the one
// channel the renderer has would mean sending an event to a renderer whose turn
// is still live, which is the defect this guard exists to remove.

export interface SendPorts {
  /** A turn is in flight. The engine's own state — never a second flag. */
  isBusy(): boolean
  /**
   * Run the turn. Reached only when the guard allows it, and it is where the
   * caller builds the `onEvent` closure — so "not reached" is exactly
   * "no second callback was ever attached".
   */
  startTurn(payload: SendPayload): void
}

export const guardedSend = (ports: SendPorts, payload: SendPayload): void => {
  if (ports.isBusy()) return
  ports.startTurn(payload)
}
