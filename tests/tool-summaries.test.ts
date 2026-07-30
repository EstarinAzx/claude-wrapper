import { describe, test, expect } from 'vitest'
import {
  keyInput,
  resultSummary,
  hasHiddenOutput,
  inputEntries
} from '../src/renderer/src/toolSummaries'

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

  // The cap is measured on the trimmed line, not on the raw slice. Indented
  // output is ordinary (stack traces, YAML, tree listings), and a scan that
  // counted its leading spaces against the budget would silently show a
  // shorter line and drop the ellipsis that says "there is more".
  test('an indented long line is capped at the same budget', () => {
    expect(resultSummary('    ' + 'x'.repeat(200))).toBe('x'.repeat(120) + '…')
  })
})

// The collapsed card advertises expansion only when expanding would actually
// show something. Both ways a card can hide content are covered, because the
// affordance is only trustworthy if "no chevron" really means "nothing more":
// a second non-empty line, and a first line clipped by the cap.
describe('hasHiddenOutput', () => {
  test('a single short line hides nothing', () => {
    expect(hasHiddenOutput('27 passed')).toBe(false)
  })

  test('a second non-empty line is hidden content', () => {
    expect(hasHiddenOutput('27 passed\nDuration 1.2s')).toBe(true)
  })

  test('trailing blank lines are not content', () => {
    expect(hasHiddenOutput('27 passed\n\n   \n')).toBe(false)
  })

  test('a first line past the cap is hidden content', () => {
    expect(hasHiddenOutput('x'.repeat(121))).toBe(true)
  })

  test('a first line exactly at the cap hides nothing', () => {
    expect(hasHiddenOutput('x'.repeat(120))).toBe(false)
  })

  test('leading blank lines are not content either', () => {
    expect(hasHiddenOutput('\n\n27 passed')).toBe(false)
  })

  test('empty text hides nothing', () => {
    expect(hasHiddenOutput('')).toBe(false)
  })
})

// #62 — the inspector renders EVERY argument, not the single string `keyInput`
// picks. Two properties carry the whole contract: a deterministic order that
// does not depend on how the object was built (a live event object and a
// replayed JSON.parse can disagree on insertion order for the same call), and
// materialisation of values `keyInput` is structurally blind to — objects,
// arrays, booleans, numbers.
describe('inputEntries', () => {
  test('orders keys deterministically, not by insertion', () => {
    const scrambled = { old_string: 'a', file_path: 'src/a.ts', new_string: 'b' }
    expect(inputEntries(scrambled).map(([k]) => k)).toEqual([
      'file_path',
      'new_string',
      'old_string'
    ])
  })

  test('a nested object value is materialised', () => {
    expect(inputEntries({ opts: { deep: { n: 1 } } })).toEqual([
      ['opts', JSON.stringify({ deep: { n: 1 } }, null, 2)]
    ])
  })

  test('an array value is materialised', () => {
    expect(inputEntries({ todos: ['one', 'two'] })).toEqual([
      ['todos', JSON.stringify(['one', 'two'], null, 2)]
    ])
  })

  test('booleans and numbers are readable', () => {
    expect(inputEntries({ limit: 5, replace_all: true })).toEqual([
      ['limit', '5'],
      ['replace_all', 'true']
    ])
  })

  // Strings are the common case and quoting them would add noise to every
  // path, command and pattern in the inspector.
  test('a string value passes through unquoted', () => {
    expect(inputEntries({ file_path: 'src/a.ts' })).toEqual([['file_path', 'src/a.ts']])
  })

  // JSON.stringify answers undefined for undefined and for functions, and a
  // React child of `undefined` renders nothing at all — the argument would be
  // present in the call and invisible in the inspector, which is the exact bug
  // this ticket exists to remove.
  test('a value JSON cannot represent still shows something', () => {
    expect(inputEntries({ nothing: undefined })).toEqual([['nothing', 'undefined']])
  })

  test('no arguments means no entries', () => {
    expect(inputEntries({})).toEqual([])
  })
})
