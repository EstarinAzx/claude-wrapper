// Whether the end of a turn should be announced to someone who is not looking
// (#75). A turn can run for minutes and the useful thing to do is alt-tab away,
// so the app has to be able to shout.
//
// The decision is pure and lives here for one reason: main's copy of it runs
// inside `chat:send`, and the electron entry cannot be imported under vitest.
// This module is what the six-case table is pinned against without a window.
//
// The table IS the design, and one row of it is a deliberate silence rather
// than an omission:
//
//   turn-end      → announce. The answer is ready; this is the whole feature.
//   error         → announce. A failed turn is MORE urgent to know about.
//   turn-aborted  → SILENT. The user pressed Stop a moment ago. A toast for an
//                   action the user just took is noise, not news.
//
// The record is silent on notifications — nothing in `.context/`, PRODUCT.md or
// DESIGN.md constrains or encourages them — so the table above is a chosen
// design, not a citation.

import type { EngineEvent } from './engine-types'

export const TURN_OUTCOMES = ['turn-end', 'turn-aborted', 'error'] as const

export type TurnOutcome = (typeof TURN_OUTCOMES)[number]

// The two effects are decided together and move together today. They stay
// separate fields because they are separate OS calls with separate failure
// modes — a toast Windows swallows and a taskbar flash it does not.
export interface Announcement {
  notify: boolean
  flash: boolean
}

// Copy for the outcomes that speak. `turn-aborted` is absent BY TYPE: there is
// no silent-row copy to accidentally show, and adding an outcome without copy
// is a compile error rather than a blank toast.
export const ANNOUNCE_COPY: Record<
  Exclude<TurnOutcome, 'turn-aborted'>,
  { title: string; body: string }
> = {
  'turn-end': { title: 'Turn finished', body: 'Claude has finished responding.' },
  error: { title: 'Turn failed', body: 'The turn ended with an error.' }
}

// A terminal outcome, or null for the dozen mid-turn event types that are not
// the end of anything. Narrowing here rather than at the call site keeps the
// EngineEvent union's growth away from the announcer.
export const turnOutcome = (e: EngineEvent): TurnOutcome | null =>
  (TURN_OUTCOMES as readonly string[]).includes(e.type) ? (e.type as TurnOutcome) : null

export const shouldAnnounce = ({
  outcome,
  focused
}: {
  outcome: TurnOutcome
  focused: boolean
}): Announcement => {
  // `focused` is read at the moment the turn ENDS, never captured when it
  // started — alt-tabbing away DURING the turn is the entire scenario.
  const announce = !focused && outcome !== 'turn-aborted'
  return { notify: announce, flash: announce }
}
