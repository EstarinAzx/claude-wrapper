import { describe, test, expect, vi } from 'vitest'
import {
  getModelMode,
  setModelMode,
  toModelOptions,
  parseAliases,
  buildModelList,
  listModels
} from '../src/main/model-mode'

// Shape mirrors real `wisp routing --json`: a families map + an aliases array of
// { name, target: { providerId, model } }.
const routingJson = JSON.stringify({
  families: {
    opus: { providerId: 'anthropic', model: 'claude-opus-4-8' },
    sonnet: { providerId: 'codex', model: 'gpt-5.6-sol' }
  },
  aliases: [
    { name: 'grok', target: { providerId: 'xai', model: 'grok-4.5' } },
    { name: 'sol', target: { providerId: 'codex', model: 'gpt-5.6-sol' } }
  ]
})

describe('model-mode state', () => {
  // Runs first, before any set — asserts the module's initial value (CLI default).
  test('starts at null (no options.model until picked)', () => {
    expect(getModelMode()).toBe(null)
  })

  test('setModelMode changes the live model', () => {
    setModelMode('opus')
    expect(getModelMode()).toBe('opus')
    setModelMode(null)
    expect(getModelMode()).toBe(null)
  })
})

describe('toModelOptions', () => {
  test('null → no options.model (CLI default)', () => {
    expect(toModelOptions(null)).toEqual({})
  })

  test('a model id → { model }', () => {
    expect(toModelOptions('opus')).toEqual({ model: 'opus' })
    expect(toModelOptions('grok-4.5')).toEqual({ model: 'grok-4.5' })
  })
})

describe('parseAliases', () => {
  // The id IS the alias NAME (what the Wisp bridge resolves per request) — NOT the
  // resolved model id, which the bridge does not route (confirmed live: `--model
  // grok` responds, `--model grok-4.5` hangs). A valid target.model is still
  // required as a sanity gate: an alias resolving to nothing isn't offered.
  test('maps each alias to { id: name, label: name }', () => {
    expect(parseAliases(routingJson)).toEqual([
      { id: 'grok', label: 'grok', group: 'alias' },
      { id: 'sol', label: 'sol', group: 'alias' }
    ])
  })

  test('drops entries missing a name or resolved model', () => {
    const json = JSON.stringify({
      aliases: [
        { name: 'ok', target: { model: 'm-1' } },
        { name: 'no-target' },
        { target: { model: 'no-name' } }
      ]
    })
    expect(parseAliases(json)).toEqual([{ id: 'ok', label: 'ok', group: 'alias' }])
  })

  test('tolerates garbage / missing aliases → []', () => {
    expect(parseAliases('not json')).toEqual([])
    expect(parseAliases('{}')).toEqual([])
    expect(parseAliases(JSON.stringify({ aliases: 'nope' }))).toEqual([])
  })
})

describe('buildModelList', () => {
  test('native → the four families only, no aliases', () => {
    const list = buildModelList('native', routingJson)
    expect(list.map((o) => o.id)).toEqual(['opus', 'sonnet', 'haiku', 'fable'])
    expect(list.every((o) => o.group === 'family')).toBe(true)
  })

  test('wisped → families then aliases', () => {
    const list = buildModelList('wisped', routingJson)
    expect(list.map((o) => o.label)).toEqual(['Opus', 'Sonnet', 'Haiku', 'Fable', 'grok', 'sol'])
  })

  test('wisped with no routing json → families only', () => {
    expect(buildModelList('wisped', null).map((o) => o.id)).toEqual([
      'opus',
      'sonnet',
      'haiku',
      'fable'
    ])
  })
})

describe('listModels', () => {
  test('native never shells wisp; returns families + current', async () => {
    setModelMode('opus')
    const fetchRouting = vi.fn<() => Promise<string | null>>()
    const info = await listModels('native', fetchRouting)
    expect(fetchRouting).not.toHaveBeenCalled()
    expect(info.current).toBe('opus')
    expect(info.models).toHaveLength(4)
    setModelMode(null)
  })

  test('wisped shells wisp and appends aliases', async () => {
    const fetchRouting = vi.fn<() => Promise<string | null>>().mockResolvedValue(routingJson)
    const info = await listModels('wisped', fetchRouting)
    expect(fetchRouting).toHaveBeenCalledOnce()
    expect(info.models.map((o) => o.label)).toContain('grok')
    expect(info.models).toHaveLength(6)
  })

  test('wisped degrades to families when the shell fails', async () => {
    const info = await listModels('wisped', async () => null)
    expect(info.models).toHaveLength(4)
  })
})
