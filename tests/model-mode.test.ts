import { describe, test, expect, beforeEach } from 'vitest'
import {
  getModelMode,
  setModelMode,
  toModelOptions,
  setReportedModel,
  getDisplayModel
} from '../src/main/model-mode'
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
      'getDisplayModel',
      'getModelMode',
      'setModelMode',
      'setReportedModel',
      'toModelOptions'
    ])
  })
})

// #52. The pill has to follow the CLI, because `/model` changes the model
// without the pill ever being clicked.
describe('reported model (what the CLI says it is running)', () => {
  beforeEach(() => setModelMode(null))

  // THE pin of this ticket. A reported value is a RESOLVED id; if it ever
  // reached options.model it would hang the turn — and not here, but on the
  // next engine rebuild, far from the line responsible. Anything that merges
  // these two fields into one kills this test and only this test.
  test('a reported model NEVER becomes options.model', () => {
    setModelMode('opus[1m]')
    setReportedModel('claude-opus-5')
    expect(getModelMode()).toBe('opus[1m]')
    expect(toModelOptions(getModelMode())).toEqual({ model: 'opus[1m]' })
  })

  test('a reported model with no pick still leaves options.model absent', () => {
    setReportedModel('claude-opus-5')
    expect(getModelMode()).toBe(null)
    expect(toModelOptions(getModelMode())).toEqual({})
  })

  test('display prefers the CLI’s word over the pick', () => {
    setModelMode('opus[1m]')
    expect(getDisplayModel()).toBe('opus[1m]')
    setReportedModel('claude-opus-5')
    expect(getDisplayModel()).toBe('claude-opus-5')
  })

  test('display falls back to the pick when nothing is reported yet', () => {
    setModelMode('sonnet')
    expect(getDisplayModel()).toBe('sonnet')
  })

  // Otherwise the pill would sit on the CLI's resolved id from the previous
  // session until the next turn produced one — i.e. the click would look
  // ignored, which is the very complaint this ticket is about.
  test('a fresh pick clears the reported value so the choice shows at once', () => {
    setReportedModel('claude-opus-5')
    setModelMode('claude-wisp-terra')
    expect(getDisplayModel()).toBe('claude-wisp-terra')
  })

  // The caller broadcasts on a true return, so this is what keeps the pill from
  // being re-announced once per assistant message.
  test('reporting is change-detecting', () => {
    expect(setReportedModel('claude-opus-5')).toBe(true)
    expect(setReportedModel('claude-opus-5')).toBe(false)
    expect(setReportedModel('claude-sonnet-5')).toBe(true)
  })
})
