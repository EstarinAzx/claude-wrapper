// What becomes of a prompt committed while a turn was still running (#80).
//
// The composer stays live while a turn streams, so the user can type the next
// thing and commit it with Enter. That commitment is a payload WAITING on the
// turn — never a second reading of whether one is running. `Engine.isBusy()`
// stays the only busy source in this app, and this module never sees it.
//
// The decision is pure and lives beside `announce.ts` for the same reason that
// one does: the interesting part is a table, and a table is worth pinning
// without a window around it.
//
// The table IS the design, and it is stated POSITIVELY — "flush on turn-end"
// rather than "flush once no longer busy". All three terminal outcomes clear
// `busy`, so a not-busy rule would resend the instant the user pressed Stop,
// and would spend the queued prompt on an engine that has just died (#73):
//
//   turn-end     + alive → FLUSH.    The answer arrived. This is the feature.
//   turn-end     + dead  → unqueue.  A prompt cannot reach a dead CLI, and
//                                    throwing it at one spends the text on an
//                                    error bubble.
//   error                → unqueue.  The turn failed; whether to say the same
//                                    thing again is the user's call, not ours.
//   turn-aborted         → unqueue.  The user pressed Stop a moment ago. Sending
//                                    anyway is the exact opposite of the ask.
//
// `unqueue` releases the commitment and NEVER the text: a queued prompt is the
// composer's own draft, flagged, so an unqueued one is still sitting in the box
// ready to send by hand. That is what makes every non-flush row lossless — and
// it is why Stop can stay the button under the user's cursor while a prompt is
// queued without that click costing them a paragraph.

import type { TurnOutcome } from './announce'

// How a turn ended, plus a nonce so two turns ending the SAME way are two
// events rather than one unchanged value. The nonce is load-bearing for exactly
// the reason `pendingInsert`'s is (#39): an effect re-runs on a CHANGED
// dependency, and `{ outcome: 'turn-end' }` twice in a row is not a change — so
// without it the second turn of a conversation would never flush.
export interface LastTurn {
  outcome: TurnOutcome
  nonce: number
}

// `none` is not the same as `unqueue`: with nothing queued there is no
// commitment to release, and keeping them apart is what lets the table assert
// that an unrelated turn ending does nothing at all rather than assert it
// vacuously.
export type QueueAction = 'flush' | 'unqueue' | 'none'

export const decideQueue = ({
  outcome,
  queued,
  engineDead
}: {
  outcome: TurnOutcome
  queued: boolean
  engineDead: boolean
}): QueueAction => {
  if (!queued) return 'none'
  // `engineDead` is read at the moment the turn ENDS, never when the prompt was
  // queued: the whole point of queueing is that things change in between, and
  // the CLI dying under the running turn is one of the things that can change.
  return outcome === 'turn-end' && !engineDead ? 'flush' : 'unqueue'
}
