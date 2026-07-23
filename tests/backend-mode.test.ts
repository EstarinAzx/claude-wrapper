import { describe, test, expect, beforeEach } from 'vitest'
import {
  snapshotWispEnv,
  wispedAvailable,
  initialMode,
  resolveSpawnEnv,
  initBackendMode,
  getBackendMode,
  setBackendMode,
  isWispedAvailable,
  getSpawnEnv
} from '../src/main/backend-mode'

const wispEnv = {
  PATH: '/usr/bin',
  HOME: '/home/me',
  ANTHROPIC_BASE_URL: 'http://127.0.0.1:41184',
  ANTHROPIC_API_KEY: 'sk-wisp-token',
  CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY: '1'
}
const plainEnv = { PATH: '/usr/bin', HOME: '/home/me' }

describe('snapshotWispEnv', () => {
  test('captures the wisp routing vars from a wisped launch env', () => {
    expect(snapshotWispEnv(wispEnv)).toEqual({
      ANTHROPIC_BASE_URL: 'http://127.0.0.1:41184',
      ANTHROPIC_API_KEY: 'sk-wisp-token',
      CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY: '1'
    })
  })

  test('is empty for a plain launch env', () => {
    expect(snapshotWispEnv(plainEnv)).toEqual({})
  })

  test('ignores empty-string values', () => {
    expect(snapshotWispEnv({ ANTHROPIC_BASE_URL: '', ANTHROPIC_API_KEY: 'k' })).toEqual({
      ANTHROPIC_API_KEY: 'k'
    })
  })
})

describe('wispedAvailable', () => {
  test('true only when the proxy endpoint was captured', () => {
    expect(wispedAvailable(snapshotWispEnv(wispEnv))).toBe(true)
  })

  test('false without a base URL — a bare token does not make wisped available', () => {
    expect(wispedAvailable({ ANTHROPIC_API_KEY: 'k' })).toBe(false)
    expect(wispedAvailable({})).toBe(false)
  })
})

describe('initialMode', () => {
  test('wisped when the launch env is wisped, native otherwise', () => {
    expect(initialMode(snapshotWispEnv(wispEnv))).toBe('wisped')
    expect(initialMode(snapshotWispEnv(plainEnv))).toBe('native')
  })
})

describe('resolveSpawnEnv', () => {
  const snapshot = snapshotWispEnv(wispEnv)

  test('wisped: base env carries the proxy endpoint and token', () => {
    expect(resolveSpawnEnv('wisped', snapshot, plainEnv)).toEqual({
      PATH: '/usr/bin',
      HOME: '/home/me',
      ANTHROPIC_BASE_URL: 'http://127.0.0.1:41184',
      ANTHROPIC_API_KEY: 'sk-wisp-token',
      CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY: '1'
    })
  })

  test('native: wisp vars stripped so host login reaches Anthropic — even when the base env still has them', () => {
    const resolved = resolveSpawnEnv('native', snapshot, wispEnv)
    expect(resolved).toEqual({ PATH: '/usr/bin', HOME: '/home/me' })
    expect(resolved).not.toHaveProperty('ANTHROPIC_BASE_URL')
    expect(resolved).not.toHaveProperty('ANTHROPIC_API_KEY')
  })

  test('does not mutate the base env it was given', () => {
    const base = { ...wispEnv }
    resolveSpawnEnv('native', snapshot, base)
    expect(base).toEqual(wispEnv)
  })
})

describe('process-wide state', () => {
  beforeEach(() => initBackendMode(plainEnv))

  test('a wisped launch starts wisped and available', () => {
    initBackendMode(wispEnv)
    expect(getBackendMode()).toBe('wisped')
    expect(isWispedAvailable()).toBe(true)
  })

  test('a plain launch starts native and wisped is unavailable', () => {
    initBackendMode(plainEnv)
    expect(getBackendMode()).toBe('native')
    expect(isWispedAvailable()).toBe(false)
  })

  test('getSpawnEnv resolves against the current mode', () => {
    initBackendMode(wispEnv)
    expect(getSpawnEnv(plainEnv)).toHaveProperty('ANTHROPIC_BASE_URL', 'http://127.0.0.1:41184')

    initBackendMode(plainEnv)
    expect(getSpawnEnv(wispEnv)).not.toHaveProperty('ANTHROPIC_BASE_URL')
  })

  test('setBackendMode flips the current mode', () => {
    initBackendMode(wispEnv)
    expect(getBackendMode()).toBe('wisped')
    setBackendMode('native')
    expect(getBackendMode()).toBe('native')
    setBackendMode('wisped')
    expect(getBackendMode()).toBe('wisped')
  })

  test('a flip changes what the next spawn env resolves to', () => {
    initBackendMode(wispEnv)
    // wisped launch → flip to native → the proxy vars drop out of the spawn env
    setBackendMode('native')
    expect(getSpawnEnv(wispEnv)).not.toHaveProperty('ANTHROPIC_BASE_URL')
    // flip back → the snapshotted proxy endpoint returns
    setBackendMode('wisped')
    expect(getSpawnEnv(plainEnv)).toHaveProperty('ANTHROPIC_BASE_URL', 'http://127.0.0.1:41184')
  })
})
