import { describe, test, expect } from 'vitest'
import {
  EFFORT_LEVELS,
  effortLevelsFor,
  isEffortLevel,
  orderEffortLevels
} from '../src/shared/effort'

// #124. The scale is the SDK's own union (sdk.d.ts:553) and its ORDER is part
// of it — effort is ordinal, and a control built on a reordered array would put
// `max` under the thumb where `low` belongs while every membership test stayed
// green.
describe('the effort scale', () => {
  test('is the SDK’s five levels, in ascending order', () => {
    expect([...EFFORT_LEVELS]).toEqual(['low', 'medium', 'high', 'xhigh', 'max'])
  })

  // The whole warrant of this ticket's "five positions, not seven". Both appear
  // in `/effort`'s argument hint, and neither is an EffortLevel: `ultracode` is
  // a session settings flag (sdk.d.ts:6319), `auto` a mode. A slider position
  // for either is the guess this repo forbids, and it would be added HERE.
  test('excludes ultracode and auto', () => {
    expect(EFFORT_LEVELS).not.toContain('ultracode')
    expect(EFFORT_LEVELS).not.toContain('auto')
    expect(isEffortLevel('ultracode')).toBe(false)
    expect(isEffortLevel('auto')).toBe(false)
  })
})

// The trust boundary. `src/shared/backdrop.ts`'s rule — compared, never coerced
// — because this is what an IPC payload is measured against.
describe('isEffortLevel', () => {
  test('accepts every level on the scale', () => {
    for (const level of EFFORT_LEVELS) expect(isEffortLevel(level)).toBe(true)
  })

  test('rejects a near miss without coercing it', () => {
    for (const bad of ['LOW', 'Medium', 'highest', 'xhigh ', '', 'maximum']) {
      expect(isEffortLevel(bad)).toBe(false)
    }
  })

  // The failure `String(value)` would let through: an object whose toString
  // spells a real level. This is exactly the case backdrop.ts was written for.
  test('rejects a value that merely STRINGIFIES to a level', () => {
    expect(isEffortLevel({ toString: () => 'high' })).toBe(false)
    expect(isEffortLevel(['high'])).toBe(false)
    expect(isEffortLevel(new String('high'))).toBe(false)
  })

  test('rejects the non-strings', () => {
    for (const bad of [null, undefined, 0, 3, true, NaN, {}, []]) {
      expect(isEffortLevel(bad)).toBe(false)
    }
  })
})

describe('orderEffortLevels', () => {
  // Sorting the INPUT would preserve whatever the CLI sent, including a value
  // the boundary later refuses — a dead control position. Filtering the scale
  // cannot produce one.
  test('puts a shuffled subset back on the scale’s order', () => {
    expect(orderEffortLevels(['max', 'low', 'high'])).toEqual(['low', 'high', 'max'])
  })

  test('drops anything off the SDK’s union', () => {
    expect(orderEffortLevels(['low', 'ultracode', 'auto', 'max'])).toEqual(['low', 'max'])
  })

  test('an empty list stays empty', () => {
    expect(orderEffortLevels([])).toEqual([])
  })
})

// Which points on the scale a MODEL has is the CLI's answer, per row. This is
// #53's rule one layer up: the control must not offer five positions because
// five is what the app happens to know about.
describe('effortLevelsFor', () => {
  test('a row’s own levels win, in scale order', () => {
    expect(effortLevelsFor({ supportsEffort: true, supportedEffortLevels: ['high', 'low'] })).toEqual([
      'low',
      'high'
    ])
  })

  // The one measured exception — recon counted 14 of 15 rows supporting effort,
  // so one does not. An empty list is what makes the control degrade visibly
  // instead of offering levels the model would reject.
  test('supportsEffort: false → no positions at all', () => {
    expect(effortLevelsFor({ supportsEffort: false })).toEqual([])
    // Explicit false wins even when the CLI also sent a list.
    expect(
      effortLevelsFor({ supportsEffort: false, supportedEffortLevels: ['low', 'high'] })
    ).toEqual([])
  })

  test('an empty list from the CLI also means no positions', () => {
    expect(effortLevelsFor({ supportsEffort: true, supportedEffortLevels: [] })).toEqual([])
  })

  // "The CLI did not say" is NOT "the model supports nothing". Collapsing the
  // two would kill the control for every row the CLI describes sparsely.
  test('an absent field falls back to the full scale', () => {
    expect(effortLevelsFor({})).toEqual([...EFFORT_LEVELS])
    expect(effortLevelsFor({ supportsEffort: true })).toEqual([...EFFORT_LEVELS])
  })

  // No row = the CLI default, or a reported id no row matched. Refusing the
  // control there would leave it dead on every fresh launch, before any pick
  // has been made — which is the state the app opens in.
  test('no row at all falls back to the full scale', () => {
    expect(effortLevelsFor(undefined)).toEqual([...EFFORT_LEVELS])
    expect(effortLevelsFor(null)).toEqual([...EFFORT_LEVELS])
  })

  // The fallback hands back a copy, not the module's own array — a caller that
  // sorted or spliced the result would otherwise reorder the scale itself for
  // every later reader, including the trust boundary.
  test('the fallback cannot mutate the scale', () => {
    const levels = effortLevelsFor(undefined)
    levels.reverse()
    expect([...EFFORT_LEVELS]).toEqual(['low', 'medium', 'high', 'xhigh', 'max'])
  })
})
