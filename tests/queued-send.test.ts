import { describe, expect, it } from 'vitest'
import { TURN_OUTCOMES, type TurnOutcome } from '../src/shared/announce'
import { decideQueue, type QueueAction } from '../src/shared/queued-send'

// #80, the decision half. The wiring half is `tests/queued-composer.test.tsx`
// and the "it really only sends once" half is `gui-80.mjs`.
//
// Every row is asserted POSITIVELY — `toBe('unqueue')`, never
// `not.toBe('flush')`. The two negatives this ticket turns on (no flush after
// Stop, no flush into a dead engine) are absence-shaped in the app, and this
// repo has a recorded habit of absence assertions passing vacuously. Naming the
// action that DOES happen is what makes each of them mutation-visible: weaken
// the guard and the row reports `flush` where it expected `unqueue`, instead of
// reporting nothing at all.

const TABLE: ReadonlyArray<{
  outcome: TurnOutcome
  queued: boolean
  engineDead: boolean
  expected: QueueAction
  why: string
}> = [
  // The one row that sends. Everything else in this table is a way of not
  // sending, which is the actual content of the feature.
  {
    outcome: 'turn-end',
    queued: true,
    engineDead: false,
    expected: 'flush',
    why: 'the answer arrived and the CLI is alive — the whole feature'
  },
  {
    outcome: 'turn-end',
    queued: true,
    engineDead: true,
    expected: 'unqueue',
    why: 'the CLI died under the turn (#73); a prompt sent now buys an error bubble'
  },
  {
    outcome: 'error',
    queued: true,
    engineDead: false,
    expected: 'unqueue',
    why: 'the turn failed — saying the same thing again is the user’s call'
  },
  {
    outcome: 'error',
    queued: true,
    engineDead: true,
    expected: 'unqueue',
    why: 'failed AND dead'
  },
  {
    outcome: 'turn-aborted',
    queued: true,
    engineDead: false,
    expected: 'unqueue',
    why: 'THE negative: Stop was pressed a moment ago, so sending is the opposite of the ask'
  },
  {
    outcome: 'turn-aborted',
    queued: true,
    engineDead: true,
    expected: 'unqueue',
    why: 'stopped AND dead'
  },
  // Nothing queued: no commitment exists, so there is nothing to release
  // either. Distinct from `unqueue` on purpose — see the type's comment.
  ...TURN_OUTCOMES.flatMap((outcome) =>
    [false, true].map((engineDead) => ({
      outcome,
      queued: false,
      engineDead,
      expected: 'none' as const,
      why: 'nothing was queued, so this turn ending concerns no one'
    }))
  )
]

describe('decideQueue', () => {
  for (const { outcome, queued, engineDead, expected, why } of TABLE) {
    it(`${outcome} + ${queued ? 'queued' : 'empty'} + engine ${
      engineDead ? 'dead' : 'alive'
    } → ${expected} (${why})`, () => {
      expect(decideQueue({ outcome, queued, engineDead })).toBe(expected)
    })
  }

  // Structural, exactly as the announce table's is: a fourth terminal outcome
  // cannot ship without someone deciding what it does to a queued prompt.
  it('covers every outcome against both queue states and both engine states', () => {
    expect(TABLE).toHaveLength(TURN_OUTCOMES.length * 2 * 2)
    for (const outcome of TURN_OUTCOMES) {
      const rows = TABLE.filter((r) => r.outcome === outcome)
      expect(rows).toHaveLength(4)
      expect(rows.map((r) => `${r.queued}/${r.engineDead}`).sort()).toEqual([
        'false/false',
        'false/true',
        'true/false',
        'true/true'
      ])
    }
  })

  // The sharpest statement of the ticket, on one line: exactly ONE of the twelve
  // combinations sends. A guard that degraded to "flush whenever busy cleared"
  // would light up three more rows here, and this is the assertion that counts
  // them rather than checking them one at a time.
  it('exactly one row in the whole table flushes', () => {
    const flushing = TABLE.filter(
      (r) => decideQueue({ outcome: r.outcome, queued: r.queued, engineDead: r.engineDead }) === 'flush'
    )
    expect(flushing).toHaveLength(1)
    expect(flushing[0]).toMatchObject({ outcome: 'turn-end', queued: true, engineDead: false })
  })
})
