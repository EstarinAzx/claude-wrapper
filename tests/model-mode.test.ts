import { describe, test, expect } from 'vitest'
import { getModelMode, setModelMode, toModelOptions } from '../src/main/model-mode'
import * as modelMode from '../src/main/model-mode'

describe('model-mode state', () => {
  // Runs first, before any set — asserts the module's initial value (CLI default).
  test('starts at null (no options.model until picked)', () => {
    expect(getModelMode()).toBe(null)
  })

  test('setModelMode changes the live model', () => {
    setModelMode('opus[1m]')
    expect(getModelMode()).toBe('opus[1m]')
    setModelMode(null)
    expect(getModelMode()).toBe(null)
  })
})

describe('toModelOptions', () => {
  test('null → no options.model (CLI default)', () => {
    expect(toModelOptions(null)).toEqual({})
  })

  // The id is the CLI's own `value`, passed through verbatim — including the
  // bracket suffix, which is part of the value and not decoration to strip.
  test('a model id → { model }, verbatim', () => {
    expect(toModelOptions('opus[1m]')).toEqual({ model: 'opus[1m]' })
    expect(toModelOptions('claude-wisp-terra')).toEqual({ model: 'claude-wisp-terra' })
  })
})

// #53's mechanism pin. The bug was a hand-maintained list that could not notice
// the CLI's list moving; the fix is that this module builds no list at all. A
// re-added constant would not fail any behavioural test — the list would simply
// be wrong again, silently, exactly as before — so the contract asserted here is
// the ABSENCE of the list-building surface, which is the thing that regressed.
describe('the model list is the CLI’s, not ours', () => {
  test('exports no list-building surface at all', () => {
    for (const gone of ['listModels', 'buildModelList', 'parseAliases', 'FAMILIES']) {
      expect(modelMode).not.toHaveProperty(gone)
    }
  })

  test('exports only the pick-state surface', () => {
    expect(Object.keys(modelMode).sort()).toEqual([
      'getModelMode',
      'setModelMode',
      'toModelOptions'
    ])
  })
})
