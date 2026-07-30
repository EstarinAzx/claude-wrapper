import { describe, test, expect } from 'vitest'
import { lineDiff, DIFF_CELL_GUARD } from '../src/renderer/src/lineDiff'
import type { DiffLine } from '../src/renderer/src/lineDiff'

// The aligned shape, flattened to `+a` / `-a` / ` a` so a whole diff reads as
// one array in the assertion instead of six object literals.
const sigil: Record<DiffLine['type'], string> = { same: ' ', add: '+', del: '-' }
const flat = (oldText: string, newText: string): string[] => {
  const d = lineDiff(oldText, newText)
  if (d.kind !== 'aligned') throw new Error(`expected an aligned diff, got ${d.kind}`)
  return d.lines.map((l) => sigil[l.type] + l.text)
}

describe('lineDiff alignment', () => {
  test('an inserted line is the only addition', () => {
    expect(flat('a\nc', 'a\nb\nc')).toEqual([' a', '+b', ' c'])
  })

  test('a deleted line is the only removal', () => {
    expect(flat('a\nb\nc', 'a\nc')).toEqual([' a', '-b', ' c'])
  })

  test('a replaced line is a removal and an addition', () => {
    expect(flat('a\nb\nc', 'a\nB\nc')).toEqual([' a', '-b', '+B', ' c'])
  })

  test('unchanged content is all context and nothing else', () => {
    expect(flat('a\nb', 'a\nb')).toEqual([' a', ' b'])
  })

  // A run of changes reads as removals then additions, never interleaved:
  // interleaving reads as four unrelated single-line edits instead of one
  // two-line replacement. A one-line fixture cannot tell the two apart (#59's
  // lesson), so this needs a run of two. What it actually pins is the walk's
  // tie-break — the two paths here are equally good, and preferring the
  // addition instead would reorder the whole hunk.
  test('adjacent changes come out as removals then additions', () => {
    expect(flat('a\nb\nc\nd', 'a\nX\nY\nd')).toEqual([' a', '-b', '-c', '+X', '+Y', ' d'])
  })

  test('a blank line inside the hunk survives as a line', () => {
    expect(flat('a\n\nb', 'a\n\nb')).toEqual([' a', ' ', ' b'])
  })
})

// Empty input and a trailing newline are the two ways a naive `split('\n')`
// invents a line that was never there: `''` splits to `['']` and `'a\n'` to
// `['a', '']`. Either one shows a phantom blank line in the card, and on the
// empty side it shows it as an *edit*.
describe('lineDiff edges', () => {
  test('an empty old string is pure addition, with no phantom blank line', () => {
    expect(flat('', 'a\nb')).toEqual(['+a', '+b'])
  })

  test('an empty new string is pure removal, with no phantom blank line', () => {
    expect(flat('a\nb', '')).toEqual(['-a', '-b'])
  })

  test('two empty strings diff to nothing at all', () => {
    expect(flat('', '')).toEqual([])
  })

  test('a trailing newline is a terminator, not a blank final line', () => {
    expect(flat('a\n', 'a')).toEqual([' a'])
  })

  test('a trailing newline on both sides still yields one line', () => {
    expect(flat('a\nb\n', 'a\nB\n')).toEqual([' a', '-b', '+B'])
  })
})

// The guard is the one thing standing between a pathological Edit and a frozen
// window: the alignment is O(old × new) in both time and memory. Above it the
// module must stop aligning and hand back the exact texts instead — an
// unaligned answer is honest, a hung renderer is not.
describe('the alignment guard', () => {
  const wide = (n: number, prefix: string): string =>
    Array.from({ length: n }, (_, i) => prefix + i).join('\n')

  test('a grid past the guard falls back to unaligned before and after', () => {
    const oldText = wide(1001, 'a')
    const newText = wide(1000, 'b')
    expect(1001 * 1000).toBeGreaterThan(DIFF_CELL_GUARD)

    const d = lineDiff(oldText, newText)

    expect(d.kind).toBe('unaligned')
    if (d.kind !== 'unaligned') throw new Error('unreachable')
    expect(d.before).toBe(oldText)
    expect(d.after).toBe(newText)
  })

  test('a grid exactly on the guard still aligns', () => {
    const oldText = wide(1000, 'a')
    const newText = wide(1000, 'a')
    expect(1000 * 1000).toBe(DIFF_CELL_GUARD)

    expect(lineDiff(oldText, newText).kind).toBe('aligned')
  })

  // The measured worst case in the historical corpus was 99 × 155 — this is
  // the shape the guard must NOT catch, or the feature never renders a diff.
  test('the largest measured real hunk aligns', () => {
    expect(lineDiff(wide(99, 'a'), wide(155, 'b')).kind).toBe('aligned')
  })
})
