import { describe, test, expect } from 'vitest'
import { modelLabel, type ModelOption } from '../src/shared/model-types'

// Faithful to the CLI's own rows, including the two that share a resolved id
// once the context suffix is dropped.
const models: ModelOption[] = [
  { id: 'default', label: 'Default (recommended)', resolvedModel: 'claude-opus-5[1m]' },
  { id: 'opus[1m]', label: 'Opus (1M context)', resolvedModel: 'claude-opus-5[1m]' },
  { id: 'sonnet', label: 'Sonnet', resolvedModel: 'claude-sonnet-5' },
  { id: 'sonnet[1m]', label: 'Sonnet 5 (1M context)', resolvedModel: 'claude-sonnet-5[1m]' },
  { id: 'haiku', label: 'Haiku', resolvedModel: 'claude-haiku-4-5-20251001' },
  { id: 'claude-wisp-terra', label: 'terra — gpt-5.6-terra' }
]

describe('modelLabel', () => {
  test('no model → the CLI default', () => {
    expect(modelLabel(models, null)).toBe('Default')
  })

  // A pick arrives as the row's own value.
  test('matches a picked id exactly', () => {
    expect(modelLabel(models, 'sonnet[1m]')).toBe('Sonnet 5 (1M context)')
    expect(modelLabel(models, 'claude-wisp-terra')).toBe('terra — gpt-5.6-terra')
  })

  // What the CLI reports is a resolved id, which is never a row's value.
  test('matches a CLI-reported resolved id', () => {
    expect(modelLabel(models, 'claude-haiku-4-5-20251001')).toBe('Haiku')
  })

  // The same session is announced as 'claude-opus-5[1m]' on init and
  // 'claude-opus-5' on the assistant message — both must land on a name.
  test('tolerates the context suffix being present or absent', () => {
    expect(modelLabel(models, 'claude-opus-5[1m]')).toBe('Default (recommended)')
    expect(modelLabel(models, 'claude-opus-5')).toBe('Default (recommended)')
  })

  // Exact beats base: without the ordering, 'claude-sonnet-5[1m]' would
  // base-match the plain 'sonnet' row first and be labelled "Sonnet".
  test('prefers an exact resolved match over a suffix-stripped one', () => {
    expect(modelLabel(models, 'claude-sonnet-5[1m]')).toBe('Sonnet 5 (1M context)')
  })

  // A model we cannot name is still one the user should see. Showing 'Default'
  // here would be a lie about what the session is running.
  test('unknown model falls back to the raw id, never to Default', () => {
    expect(modelLabel(models, 'claude-something-new')).toBe('claude-something-new')
    expect(modelLabel([], 'claude-opus-5')).toBe('claude-opus-5')
  })

  test('a row with no resolvedModel is not matched by resolution', () => {
    expect(modelLabel(models, 'gpt-5.6-terra')).toBe('gpt-5.6-terra')
  })
})
