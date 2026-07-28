import { beforeEach, describe, expect, test, vi } from 'vitest'
import { homedir } from 'node:os'

// The metadata list is the SDK's job now, so the SDK is the only thing this
// suite stubs. `node:fs/promises` is stubbed purely so the "we no longer parse
// every JSONL" requirement is checkable — see the no-read test below — and so
// readTranscript's round-trip through the storage index can be driven from a
// fake store.
const sdkListSessions = vi.hoisted(() => vi.fn())
const fs = vi.hoisted(() => ({ readFile: vi.fn(), readdir: vi.fn(), stat: vi.fn() }))

vi.mock('@anthropic-ai/claude-agent-sdk', () => ({ listSessions: sdkListSessions }))
vi.mock('node:fs/promises', () => ({ ...fs, default: fs }))

import { resetSessionIndex } from '../src/main/session-index'
import { listSessions, readTranscript } from '../src/main/session-store'

const CWD = 'D:\\projects\\demo'

const slash = (p: string): string => p.replace(/\\/g, '/')
const ROOT = `${slash(homedir())}/.claude/projects`
const enoent = (): Error => Object.assign(new Error('ENOENT'), { code: 'ENOENT' })

// Point the mocked fs at an in-memory store, keyed by forward-slash paths.
const store = (files: Record<string, string>): void => {
  fs.readdir.mockImplementation(async (dir: string) => {
    const d = slash(dir)
    const names = new Set<string>()
    for (const p of Object.keys(files)) {
      if (!p.startsWith(d + '/')) continue
      names.add(p.slice(d.length + 1).split('/')[0])
    }
    if (names.size === 0) throw enoent()
    return [...names]
  })
  fs.readFile.mockImplementation(async (file: string) => {
    const hit = files[slash(file)]
    if (hit === undefined) throw enoent()
    return hit
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  resetSessionIndex()
  sdkListSessions.mockResolvedValue([])
})

describe('listSessions', () => {
  test('maps SDK session info onto SessionMeta, newest first', async () => {
    sdkListSessions.mockResolvedValue([
      { sessionId: 'older', summary: 'Older chat', lastModified: 1000 },
      { sessionId: 'newest', summary: 'Newest chat', lastModified: 3000 }
    ])

    expect(await listSessions(CWD)).toEqual([
      { id: 'newest', title: 'Newest chat', lastUpdated: 3000 },
      { id: 'older', title: 'Older chat', lastUpdated: 1000 }
    ])
  })

  test('scopes the list to the cwd and excludes programmatic sessions', async () => {
    await listSessions(CWD)
    expect(sdkListSessions).toHaveBeenCalledWith({ dir: CWD, includeProgrammatic: false })
  })

  // The real store cannot catch this: all 325 sessions carrying a customTitle
  // have one identical to `summary`, so a re-added `customTitle ?? summary`
  // coalesce stays green against live data forever. Only a divergent fixture
  // fails on it.
  test('the title is the summary alone — a divergent customTitle is ignored', async () => {
    sdkListSessions.mockResolvedValue([
      { sessionId: 's', summary: 'summary', customTitle: 'different', lastModified: 1 }
    ])

    expect((await listSessions(CWD))[0].title).toBe('summary')
  })

  // The point of the whole change: an implementation that calls the SDK *and*
  // still line-parses every transcript is indistinguishable from a correct one
  // by its return value, and costs exactly what this was meant to delete.
  test('reads no transcript files — no directory scan, no JSONL parse', async () => {
    sdkListSessions.mockResolvedValue([
      { sessionId: 's', summary: 'Chat', lastModified: 1 }
    ])

    await listSessions(CWD)

    expect(fs.readdir).not.toHaveBeenCalled()
    expect(fs.readFile).not.toHaveBeenCalled()
  })

  test('no cwd yields the empty list without touching the SDK', async () => {
    expect(await listSessions(null)).toEqual([])
    expect(sdkListSessions).not.toHaveBeenCalled()
  })

  test('an unreadable store degrades to the empty list instead of throwing', async () => {
    sdkListSessions.mockRejectedValue(new Error('ENOENT'))
    expect(await listSessions(CWD)).toEqual([])
  })
})

const transcript = JSON.stringify({
  type: 'user',
  message: { role: 'user', content: 'do the thing' }
})

describe('readTranscript', () => {
  // The whole point of #44: the on-disk directory name is NOT what encodeCwd
  // would have produced for this cwd (lower-case drive letter — 6 of 37 real
  // store directories drift this way). Encoding resolves to a path that does not
  // exist and reads back as an empty transcript, which looks like an empty
  // session rather than a bug. Resolving by id finds it.
  test('finds the transcript when the directory name drifts from the encoded cwd', async () => {
    store({ [`${ROOT}/d--projects-demo/s1.jsonl`]: transcript })

    expect(await readTranscript(CWD, 's1')).toEqual([{ role: 'user', text: 'do the thing' }])
  })

  // Replay is not resume: a session discovered without a cwd still has a
  // transcript on disk, and the index can find it by id alone.
  test('replays a session whose cwd is unknown', async () => {
    store({ [`${ROOT}/whatever/s1.jsonl`]: transcript })

    expect(await readTranscript(null, 's1')).toEqual([{ role: 'user', text: 'do the thing' }])
  })

  test('a session the store does not hold yields [] instead of throwing', async () => {
    store({ [`${ROOT}/d--projects-demo/s1.jsonl`]: transcript })

    expect(await readTranscript(CWD, 'missing')).toEqual([])
  })

  test('no id yields [] without touching the store', async () => {
    store({ [`${ROOT}/d--projects-demo/s1.jsonl`]: transcript })

    expect(await readTranscript(CWD, '')).toEqual([])
    expect(fs.readdir).not.toHaveBeenCalled()
  })
})
