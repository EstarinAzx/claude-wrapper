import { describe, test, expect, beforeEach, vi } from 'vitest'
import {
  applyEffortPick,
  getEffortMode,
  setEffortMode,
  toEffortOptions,
  type EffortPorts
} from '../src/main/effort-mode'
import * as effortMode from '../src/main/effort-mode'

describe('effort-mode state', () => {
  // Runs first, before any set — asserts the module's initial value, which is
  // the CLI default (no options.effort at all).
  test('starts at null', () => {
    expect(getEffortMode()).toBe(null)
  })

  test('setEffortMode changes the live pick', () => {
    setEffortMode('xhigh')
    expect(getEffortMode()).toBe('xhigh')
    setEffortMode(null)
    expect(getEffortMode()).toBe(null)
  })
})

describe('toEffortOptions', () => {
  test('null → no options.effort (CLI default)', () => {
    expect(toEffortOptions(null)).toEqual({})
  })

  test('a level → { effort }', () => {
    expect(toEffortOptions('low')).toEqual({ effort: 'low' })
    expect(toEffortOptions('max')).toEqual({ effort: 'max' })
  })
})

// #53's mechanism pin, applied to effort. The bug class is a hand-maintained
// list that cannot notice the CLI's own list moving; the fix is that this module
// builds no list. A re-added constant would fail no behavioural test — the
// control would simply offer the wrong positions, silently — so what is
// asserted is the ABSENCE of the surface.
describe('the effort scale is not built here', () => {
  test('exports no list-building surface', () => {
    for (const gone of ['EFFORT_LEVELS', 'listEffortLevels', 'levelsFor', 'supportedLevels']) {
      expect(effortMode).not.toHaveProperty(gone)
    }
  })

  test('exports only the pick-state surface and its transaction', () => {
    expect(Object.keys(effortMode).sort()).toEqual([
      'applyEffortPick',
      'getEffortMode',
      'setEffortMode',
      'toEffortOptions'
    ])
  })
})

// The whole `effort:set` transaction, ported out of index.ts because vitest
// cannot import that file — and because the two halves that fail SILENTLY live
// here: a payload reaching the engine when it should not, and a resume target
// read after the handle is gone.
describe('applyEffortPick', () => {
  const ports = (sessionId: string | null = 'sess-1', pendingResume: string | null = null) => {
    const discardEngine = vi.fn<(resume: string | null) => void>()
    const broadcast = vi.fn()
    // sessionId() answers null once the engine has been discarded, exactly as
    // `engine?.sessionId()` does in index.ts. This is what makes the ordering
    // pin below real rather than decorative.
    let discarded = false
    discardEngine.mockImplementation(() => {
      discarded = true
    })
    const p: EffortPorts = {
      sessionId: () => (discarded ? null : sessionId),
      pendingResume: () => pendingResume,
      discardEngine,
      broadcast
    }
    return { ports: p, discardEngine, broadcast }
  }

  beforeEach(() => setEffortMode(null))

  test('a level is stored, the engine discarded, the value broadcast', () => {
    const { ports: p, discardEngine, broadcast } = ports()
    expect(applyEffortPick('high', p)).toBe(true)
    expect(getEffortMode()).toBe('high')
    expect(discardEngine).toHaveBeenCalledTimes(1)
    expect(broadcast).toHaveBeenCalledWith('high')
  })

  test('null is a legitimate pick — back to the CLI default', () => {
    setEffortMode('max')
    const { ports: p, discardEngine, broadcast } = ports()
    expect(applyEffortPick(null, p)).toBe(true)
    expect(getEffortMode()).toBe(null)
    expect(toEffortOptions(getEffortMode())).toEqual({})
    // Still a rebuild: dropping options.effort binds at construction just as
    // adding it does, so a pick back to Default that skipped the discard would
    // go on sending the old level.
    expect(discardEngine).toHaveBeenCalledTimes(1)
    expect(broadcast).toHaveBeenCalledWith(null)
  })

  // THE ACCEPTANCE PIN. A hostile payload must not reach the engine at all —
  // not "be corrected", not "land on a default". Asserting the return value
  // alone would pass with the discard already fired.
  describe('a payload off the scale is rejected and never reaches the engine', () => {
    for (const hostile of [
      'ultracode',
      'auto',
      'HIGH',
      'highest',
      '',
      0,
      3,
      true,
      undefined,
      {},
      ['high'],
      { toString: () => 'high' }
    ]) {
      test(`rejects ${JSON.stringify(hostile) ?? String(hostile)}`, () => {
        setEffortMode('medium')
        const { ports: p, discardEngine, broadcast } = ports()
        expect(applyEffortPick(hostile, p)).toBe(false)
        // The prior pick survives untouched — a rejection must not silently
        // clear the user's choice either.
        expect(getEffortMode()).toBe('medium')
        expect(discardEngine).not.toHaveBeenCalled()
        expect(broadcast).not.toHaveBeenCalled()
      })
    }
  })

  // #73's sharp edge, and the one `permission:set-mode` and `model:set` both
  // carry: sessionId() is unreachable once the handle is dropped, so reading it
  // after the discard silently starts a FRESH conversation while the pane —
  // refilled from disk — still looks right.
  describe('the resume target is read BEFORE the discard', () => {
    test('the live session id is what the rebuild resumes', () => {
      const { ports: p, discardEngine } = ports('sess-1')
      applyEffortPick('low', p)
      expect(discardEngine).toHaveBeenCalledWith('sess-1')
    })

    // The second pick in a row: the first discard nulled the engine, so
    // sessionId() answers null and pendingResume carries the conversation. This
    // is why the fallback exists, and dragging the control across the scale
    // exercises it on every step but the first.
    test('with no live engine it falls back to pendingResume', () => {
      const { ports: p, discardEngine } = ports(null, 'sess-2')
      applyEffortPick('low', p)
      expect(discardEngine).toHaveBeenCalledWith('sess-2')
    })

    test('neither available → a fresh start, not a crash', () => {
      const { ports: p, discardEngine } = ports(null, null)
      applyEffortPick('low', p)
      expect(discardEngine).toHaveBeenCalledWith(null)
    })
  })

  // The store is written before the broadcast reads it back, so the renderer is
  // told the RESOLVED value rather than the payload it sent. Same shape as
  // `model:set` sending getDisplayModel() rather than its argument.
  test('the broadcast carries the stored value, read back', () => {
    const seen: Array<string | null> = []
    const p: EffortPorts = {
      sessionId: () => null,
      pendingResume: () => null,
      discardEngine: () => {},
      broadcast: () => seen.push(getEffortMode())
    }
    applyEffortPick('xhigh', p)
    expect(seen).toEqual(['xhigh'])
  })
})
