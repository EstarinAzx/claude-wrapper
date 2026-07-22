import { describe, test, expect } from 'vitest'
import { keyInput, resultSummary } from '../src/renderer/src/toolSummaries'

describe('keyInput', () => {
  test('picks command first', () => {
    expect(keyInput({ command: 'npm test', description: 'run tests' })).toBe('npm test')
  })

  test('picks file_path', () => {
    expect(keyInput({ file_path: 'src/a.ts' })).toBe('src/a.ts')
  })

  test('picks pattern', () => {
    expect(keyInput({ pattern: '*.ts', path: 'src' })).toBe('*.ts')
  })

  test('falls back to first string value', () => {
    expect(keyInput({ count: 3, query: 'foo' })).toBe('foo')
  })

  test('empty when no string values', () => {
    expect(keyInput({ count: 3 })).toBe('')
  })
})

describe('resultSummary', () => {
  test('first non-empty line', () => {
    expect(resultSummary('\n\n27 passed\nDuration 1.2s')).toBe('27 passed')
  })

  test('caps long lines with ellipsis', () => {
    const long = 'x'.repeat(200)
    const s = resultSummary(long)
    expect(s.length).toBeLessThanOrEqual(121)
    expect(s.endsWith('…')).toBe(true)
  })

  test('empty text stays empty', () => {
    expect(resultSummary('')).toBe('')
  })
})
