import { describe, test, expect } from 'vitest'
import {
  MAX_FILE_SUGGESTIONS,
  applyAtAccept,
  findAtQuery,
  matchFiles
} from '../src/shared/file-refs'

// #118 — the two owner calls taken on #115 (2026-08-05), pinned where they are
// decided rather than where they are used.
//
//   1. The trigger window: `/`'s rule MINUS the index-0 clause, because A4b
//      records that clause's reason as "a slash command only expands as the
//      first token" and that reason does not transfer.
//   2. Accept replaces only the `@token`, never the whole value.

describe('the @ trigger window (owner call 1)', () => {
  test('a bare @ at the start of the input opens the window', () => {
    expect(findAtQuery('@', 1)).toEqual({ start: 0, query: '' })
  })

  test('fires MID-STRING, which is the whole difference from /', () => {
    const value = 'look at @src'
    expect(findAtQuery(value, value.length)).toEqual({ start: 8, query: 'src' })
  })

  test('whitespace since the @ closes the window', () => {
    const value = '@src is the folder'
    expect(findAtQuery(value, value.length)).toBeNull()
  })

  test('a newline closes it too, not just a space (#42s rule, kept)', () => {
    const value = '@src\nmore'
    expect(findAtQuery(value, value.length)).toBeNull()
  })

  test('an email address does NOT open a file picker', () => {
    // The one common mid-string `@` in ordinary prose. Without the
    // starts-a-token rule this fires on every keystroke after the `@`.
    const value = 'mail me at someone@example'
    expect(findAtQuery(value, value.length)).toBeNull()
  })

  test('the window is decided by the CARET, not by the end of the value', () => {
    const value = '@src and @tests'
    // Caret parked just after the FIRST reference.
    expect(findAtQuery(value, 4)).toEqual({ start: 0, query: 'src' })
    // ...and at the end, it is the second one that is open.
    expect(findAtQuery(value, value.length)).toEqual({ start: 9, query: 'tests' })
  })

  test('a caret before the @ leaves the window shut', () => {
    expect(findAtQuery('hello @src', 3)).toBeNull()
  })

  test('a caret past the end of the value is clamped rather than throwing', () => {
    expect(findAtQuery('@src', 999)).toEqual({ start: 0, query: 'src' })
  })

  test('no @ at all is null', () => {
    expect(findAtQuery('ordinary prose', 5)).toBeNull()
  })
})

describe('accepting a suggestion (owner call 2)', () => {
  test('replaces ONLY the @token and keeps the prose around it', () => {
    const value = 'please read @inp and tell me'
    const caret = 16 // just after "@inp"
    const next = applyAtAccept(value, caret, 'src/InputBar.tsx')
    expect(next.value).toBe('please read @src/InputBar.tsx  and tell me')
    // Caret lands after the inserted reference, not at the end of the value.
    expect(next.caret).toBe('please read @src/InputBar.tsx '.length)
  })

  test('the trailing space closes the window, so the popover does not reopen', () => {
    const next = applyAtAccept('@src', 4, 'src/main/index.ts')
    expect(next.value).toBe('@src/main/index.ts ')
    expect(findAtQuery(next.value, next.caret)).toBeNull()
  })

  test('text AFTER the caret survives — this is the whole point of not replacing', () => {
    const value = 'compare @a with the other one'
    const next = applyAtAccept(value, 10, 'src/a.ts')
    expect(next.value).toBe('compare @src/a.ts  with the other one')
  })

  test('with no open window it is a no-op rather than an insertion', () => {
    const value = 'no reference here'
    expect(applyAtAccept(value, 5, 'src/a.ts')).toEqual({ value, caret: 5 })
  })
})

describe('match order and the popover cap (owner call 3, cap half)', () => {
  const FILES = [
    'README.md',
    'src/main/index.ts',
    'src/renderer/src/components/InputBar.tsx',
    'src/shared/index-helpers.ts',
    'tests/index.test.ts'
  ]

  test('all three rank tiers, in order', () => {
    // `main.ts`      — basename prefix   (tier 0)
    // `main/deep.ts` — path prefix       (tier 1)
    // `src/main/...` — merely contains   (tier 2)
    const tiers = ['src/main/index.ts', 'main/deep.ts', 'main.ts']
    expect(matchFiles(tiers, 'main')).toEqual(['main.ts', 'main/deep.ts', 'src/main/index.ts'])
  })

  test('among equal tiers the shallower path wins', () => {
    const hits = matchFiles(FILES, 'index')
    expect(hits[0]).toBe('tests/index.test.ts')
    expect(hits).toContain('src/main/index.ts')
    // InputBar.tsx does not contain the query at all, so it is not a hit.
    expect(hits).not.toContain('src/renderer/src/components/InputBar.tsx')
  })

  test('matching is case-insensitive', () => {
    expect(matchFiles(FILES, 'readme')).toEqual(['README.md'])
  })

  test('non-matching files are dropped entirely', () => {
    expect(matchFiles(FILES, 'zzz')).toEqual([])
  })

  test('an empty query lists the shallowest paths first', () => {
    expect(matchFiles(FILES, '')[0]).toBe('README.md')
  })

  test('the list is capped for the popover', () => {
    const many = Array.from({ length: 200 }, (_, i) => `src/file-${i}.ts`)
    expect(matchFiles(many, 'file').length).toBe(MAX_FILE_SUGGESTIONS)
  })
})
