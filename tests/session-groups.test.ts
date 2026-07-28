import { describe, expect, test } from 'vitest'
import type { SessionMeta } from '../src/shared/session-types'
import { groupSessions, UNKNOWN_PROJECT } from '../src/shared/session-groups'

const CWD = 'D:\\projects\\demo'

// `at` doubles as the id so a failure names the row it lost.
const s = (at: number, title: string, cwd?: string): SessionMeta => ({
  id: `s${at}`,
  title,
  lastUpdated: at,
  ...(cwd ? { cwd } : {})
})

const titles = (g: ReturnType<typeof groupSessions>): string[][] =>
  g.groups.map((grp) => grp.sessions.map((x) => x.title))

describe('groupSessions — grouping', () => {
  test('groups by project directory, newest group first', () => {
    const g = groupSessions(
      [
        s(300, 'beta new', 'D:\\projects\\beta'),
        s(200, 'alpha old', 'D:\\projects\\alpha'),
        s(100, 'beta old', 'D:\\projects\\beta')
      ],
      { limit: 100 }
    )

    // 'beta' leads because its newest member (300) beats alpha's (200) — not
    // because of name order or first appearance in the input.
    expect(g.groups.map((grp) => grp.label)).toEqual([
      'D:\\projects\\beta',
      'D:\\projects\\alpha'
    ])
  })

  test('sorts sessions newest-first within a group', () => {
    const g = groupSessions(
      [
        s(100, 'oldest', CWD),
        s(300, 'newest', CWD),
        s(200, 'middle', CWD)
      ],
      { limit: 100 }
    )

    expect(titles(g)).toEqual([['newest', 'middle', 'oldest']])
  })

  test('sessions with no cwd collect in the Unknown project group', () => {
    const g = groupSessions([s(200, 'homeless'), s(100, 'placed', CWD)], { limit: 100 })

    expect(g.groups[0].label).toBe(UNKNOWN_PROJECT)
    expect(g.groups[0].sessions.map((x) => x.title)).toEqual(['homeless'])
  })

  // The whole reason a folded key exists: the store carries both spellings of
  // the same directory, and two headings for one project is the defect.
  test('two spellings of one directory are a single group', () => {
    const g = groupSessions(
      [s(200, 'upper', 'D:\\Projects\\Demo'), s(100, 'lower', 'd:\\projects\\demo\\')],
      { limit: 100 }
    )

    expect(g.groups).toHaveLength(1)
    expect(titles(g)).toEqual([['upper', 'lower']])
  })

  test('marks the group belonging to the active workspace, whatever its spelling', () => {
    const g = groupSessions(
      [s(200, 'here', 'd:\\projects\\demo'), s(100, 'elsewhere', 'D:\\projects\\other')],
      { limit: 100, cwd: CWD }
    )

    expect(g.groups.map((grp) => grp.current)).toEqual([true, false])
  })

  test('no active workspace makes every group foreign', () => {
    const g = groupSessions([s(200, 'here', CWD)], { limit: 100, cwd: null })

    expect(g.groups[0].current).toBe(false)
  })

  // A session with no cwd cannot be the current workspace even when one is set:
  // #46's resolveResumeTarget rejects it as `missing-cwd`.
  test('the Unknown project group is never the current workspace', () => {
    const g = groupSessions([s(200, 'homeless')], { limit: 100, cwd: CWD })

    expect(g.groups[0].current).toBe(false)
  })
})

describe('groupSessions — filter', () => {
  test('matches a substring of the title, case-insensitively', () => {
    const g = groupSessions([s(200, 'Fix the parser', CWD), s(100, 'Ship it', CWD)], {
      limit: 100,
      query: 'PARSE'
    })

    expect(titles(g)).toEqual([['Fix the parser']])
  })

  test('matches the project label too, so typing a project name narrows to it', () => {
    const g = groupSessions(
      [s(200, 'unrelated title', 'D:\\projects\\beta'), s(100, 'another', 'D:\\projects\\alpha')],
      { limit: 100, query: 'beta' }
    )

    expect(titles(g)).toEqual([['unrelated title']])
  })

  test('the Unknown project label is matchable by name', () => {
    const g = groupSessions([s(200, 'homeless'), s(100, 'placed', CWD)], {
      limit: 100,
      query: 'unknown'
    })

    expect(titles(g)).toEqual([['homeless']])
  })

  test('a blank query keeps everything', () => {
    const g = groupSessions([s(200, 'a', CWD), s(100, 'b', CWD)], { limit: 100, query: '   ' })

    expect(g.shown).toBe(2)
  })

  test('no match yields no groups at all, not an empty group', () => {
    const g = groupSessions([s(200, 'a', CWD)], { limit: 100, query: 'zzz' })

    expect(g.groups).toEqual([])
    expect(g.matched).toBe(0)
  })
})

describe('groupSessions — cap', () => {
  // Contract order is filter → sort/group → cap. Capping first would drop this
  // match before the filter ever saw it, and the list would look simply empty.
  test('filters the whole list before the cap, not the capped page', () => {
    const noise = Array.from({ length: 150 }, (_, i) => s(1000 + i, 'noise', CWD))
    const g = groupSessions([...noise, s(1, 'needle', CWD)], { limit: 100, query: 'needle' })

    expect(titles(g)).toEqual([['needle']])
  })

  test('caps at the newest N matches globally, not N per group', () => {
    const g = groupSessions(
      [
        s(600, 'a1', 'D:\\p\\a'),
        s(500, 'b1', 'D:\\p\\b'),
        s(400, 'c1', 'D:\\p\\c'),
        s(300, 'a2', 'D:\\p\\a'),
        s(200, 'b2', 'D:\\p\\b'),
        s(100, 'c2', 'D:\\p\\c')
      ],
      { limit: 3 }
    )

    expect(g.shown).toBe(3)
    expect(titles(g)).toEqual([['a1'], ['b1'], ['c1']])
  })

  test('reports the full match count so the caller can offer more', () => {
    const g = groupSessions(
      Array.from({ length: 12 }, (_, i) => s(i + 1, 'chat', CWD)),
      { limit: 5 }
    )

    expect(g.shown).toBe(5)
    expect(g.matched).toBe(12)
  })

  test('a raised limit reveals the next page of matches', () => {
    const all = Array.from({ length: 12 }, (_, i) => s(i + 1, `chat ${i + 1}`, CWD))

    expect(groupSessions(all, { limit: 10 }).shown).toBe(10)
    expect(groupSessions(all, { limit: 20 }).shown).toBe(12)
  })

  test('a group left empty by the cap is not rendered', () => {
    const g = groupSessions([s(200, 'kept', 'D:\\p\\a'), s(100, 'cut', 'D:\\p\\b')], {
      limit: 1
    })

    expect(g.groups.map((grp) => grp.label)).toEqual(['D:\\p\\a'])
  })
})
