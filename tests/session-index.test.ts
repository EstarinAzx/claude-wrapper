import { beforeEach, describe, expect, test, vi } from 'vitest'
import { homedir } from 'node:os'
import {
  cwdKey,
  resetSessionIndex,
  resolveResumeTarget,
  resolveSessionDir,
  type StoreIo
} from '../src/main/session-index'

const slash = (p: string): string => p.replace(/\\/g, '/')
const ROOT = `${slash(homedir())}/.claude/projects`

const enoent = (): Error => Object.assign(new Error('ENOENT'), { code: 'ENOENT' })

// In-memory store keyed by forward-slash file paths. readdir answers with the
// immediate children of a directory — files AND subdirectory names, which is
// exactly what the index enumerates.
const fakeIo = (files: Record<string, string>, mtimes: Record<string, number> = {}): StoreIo => ({
  readdir: async (dir) => {
    const d = slash(dir)
    const names = new Set<string>()
    for (const p of Object.keys(files)) {
      if (!p.startsWith(d + '/')) continue
      names.add(p.slice(d.length + 1).split('/')[0])
    }
    if (names.size === 0) throw enoent()
    return [...names]
  },
  readFile: async (file) => {
    const hit = files[slash(file)]
    if (hit === undefined) throw enoent()
    return hit
  },
  stat: async (file) => {
    const at = mtimes[slash(file)]
    if (at === undefined) throw enoent()
    return { mtimeMs: at }
  }
})

const record = (cwd: string): string => JSON.stringify({ type: 'user', cwd, message: {} })

beforeEach(() => {
  resetSessionIndex()
})

describe('cwdKey', () => {
  test('folds separators and case so drive-letter drift compares equal', () => {
    expect(cwdKey('d:\\projects\\demo')).toBe(cwdKey('D:\\projects\\Demo'))
  })

  test('a trailing separator does not change the key', () => {
    expect(cwdKey('D:\\projects\\demo\\')).toBe(cwdKey('D:\\projects\\demo'))
  })
})

describe('resolveSessionDir', () => {
  test('finds the real directory by session id, whatever the directory is named', async () => {
    // The on-disk name has a lower-case drive letter; encodeCwd('D:\projects\demo')
    // would have synthesized 'D--projects-demo' and found nothing.
    const io = fakeIo({ [`${ROOT}/d--projects-demo/s1.jsonl`]: '{}' })

    const found = await resolveSessionDir('s1', 'D:\\projects\\demo', io)
    expect(found.status).toBe('ok')
    expect(slash(found.status === 'ok' ? found.dir : '')).toBe(`${ROOT}/d--projects-demo`)
  })

  test('indexes a session that exists only as a subagent directory', async () => {
    const io = fakeIo({ [`${ROOT}/proj/s2/subagents/agent-a.meta.json`]: '{}' })

    const found = await resolveSessionDir('s2', null, io)
    expect(found.status).toBe('ok')
    expect(slash(found.status === 'ok' ? found.dir : '')).toBe(`${ROOT}/proj`)
  })

  test('builds the index from names alone — no transcript is opened', async () => {
    const files = { [`${ROOT}/proj/s1.jsonl`]: '{}' }
    const io = fakeIo(files)
    const readFile = vi.spyOn(io, 'readFile')

    await resolveSessionDir('s1', 'D:\\projects\\demo', io)

    expect(readFile).not.toHaveBeenCalled()
  })

  test('an unknown id rebuilds once and retries once, then stops', async () => {
    const io = fakeIo({ [`${ROOT}/proj/s1.jsonl`]: '{}' })
    const readdir = vi.spyOn(io, 'readdir')

    expect(await resolveSessionDir('nope', null, io)).toEqual({ status: 'not-found' })

    // Two enumerations (initial build + one rebuild), each reading the root and
    // its one project dir. A retry loop would multiply this without bound.
    expect(readdir).toHaveBeenCalledTimes(4)
  })

  test('an empty session id is not-found without touching the store', async () => {
    const io = fakeIo({ [`${ROOT}/proj/s1.jsonl`]: '{}' })
    const readdir = vi.spyOn(io, 'readdir')

    expect(await resolveSessionDir('', null, io)).toEqual({ status: 'not-found' })
    expect(readdir).not.toHaveBeenCalled()
  })

  // #60: a store that cannot be enumerated is NOT the same as a store that was
  // read fine and simply does not hold this id. Collapsing the two is why an
  // unreadable ~/.claude/projects made every session replay as an empty
  // conversation — indistinguishable from a session with no messages.
  test('a store that cannot be enumerated is unavailable, not not-found', async () => {
    expect(await resolveSessionDir('s1', null, fakeIo({}))).toEqual({ status: 'unavailable' })
  })

  // The other half of the same distinction, and the guard on criterion 4: a
  // store that reads fine and does not hold the id is ordinary absence. A
  // session legitimately deleted between a list and a click must stay lenient.
  test('a readable store that lacks the id stays not-found, never unavailable', async () => {
    const io = fakeIo({ [`${ROOT}/proj/s1.jsonl`]: '{}' })

    expect(await resolveSessionDir('gone', null, io)).toEqual({ status: 'not-found' })
  })

  // A failed enumeration must not be cached as an empty index: the store coming
  // back would otherwise keep answering `unavailable` until something else
  // happened to call resetSessionIndex().
  test('an unavailable store is not cached — the next lookup re-enumerates', async () => {
    const broken = fakeIo({})
    expect(await resolveSessionDir('s1', null, broken)).toEqual({ status: 'unavailable' })

    const io = fakeIo({ [`${ROOT}/proj/s1.jsonl`]: '{}' })
    expect((await resolveSessionDir('s1', null, io)).status).toBe('ok')
  })

  test('a duplicate id prefers the candidate whose recorded cwd matches', async () => {
    const io = fakeIo(
      {
        [`${ROOT}/a/dup.jsonl`]: record('D:\\projects\\other'),
        [`${ROOT}/b/dup.jsonl`]: record('D:\\projects\\demo')
      },
      { [`${ROOT}/a/dup.jsonl`]: 900, [`${ROOT}/b/dup.jsonl`]: 100 }
    )

    // 'a' is the newer file — the cwd match must win over mtime, and the
    // reported cwd differs from the recorded one only in drive-letter case.
    const found = await resolveSessionDir('dup', 'd:\\projects\\demo', io)
    expect(slash(found.status === 'ok' ? found.dir : '')).toBe(`${ROOT}/b`)
  })

  test('a duplicate with no cwd match falls back to the newest file', async () => {
    const io = fakeIo(
      {
        [`${ROOT}/a/dup.jsonl`]: record('D:\\somewhere'),
        [`${ROOT}/b/dup.jsonl`]: record('D:\\elsewhere')
      },
      { [`${ROOT}/a/dup.jsonl`]: 100, [`${ROOT}/b/dup.jsonl`]: 900 }
    )

    const found = await resolveSessionDir('dup', 'D:\\projects\\demo', io)
    expect(slash(found.status === 'ok' ? found.dir : '')).toBe(`${ROOT}/b`)
  })
})

describe('resolveResumeTarget', () => {
  // A session with no cwd (5 of 490 in the real store) must be rejected in a way
  // the caller can render — an empty result is indistinguishable from a session
  // that simply has no messages, and the lossy directory name must never be
  // decoded back into a cwd to paper over it.
  test('a session with no cwd is a typed missing-cwd rejection', async () => {
    const io = fakeIo({ [`${ROOT}/proj/s1.jsonl`]: '{}' })

    expect(await resolveResumeTarget('s1', undefined, io)).toEqual({ status: 'missing-cwd' })
    expect(await resolveResumeTarget('s1', null, io)).toEqual({ status: 'missing-cwd' })
    expect(await resolveResumeTarget('s1', '', io)).toEqual({ status: 'missing-cwd' })
  })

  test('a session with a cwd resolves to its directory', async () => {
    const io = fakeIo({ [`${ROOT}/proj/s1.jsonl`]: '{}' })

    const found = await resolveResumeTarget('s1', 'D:\\projects\\demo', io)
    expect(found.status).toBe('ok')
  })

  test('a cwd that resolves to nothing is not-found, never missing-cwd', async () => {
    const io = fakeIo({ [`${ROOT}/proj/s1.jsonl`]: '{}' })

    expect(await resolveResumeTarget('gone', 'D:\\projects\\demo', io)).toEqual({
      status: 'not-found'
    })
  })

  test('an unreadable store surfaces as unavailable, never missing-cwd', async () => {
    expect(await resolveResumeTarget('s1', 'D:\\projects\\demo', fakeIo({}))).toEqual({
      status: 'unavailable'
    })
  })
})
