import { beforeEach, describe, expect, test, vi } from 'vitest'
import { homedir } from 'node:os'

// The metadata list is the SDK's job now, so the SDK is the only thing this
// suite stubs. `node:fs/promises` is stubbed purely so the "we no longer parse
// every JSONL" requirement is checkable — see the no-read test below — and so
// readTranscript's round-trip through the storage index can be driven from a
// fake store.
const sdkListSessions = vi.hoisted(() => vi.fn())
const sdkDeleteSession = vi.hoisted(() => vi.fn())
const fs = vi.hoisted(() => ({ readFile: vi.fn(), readdir: vi.fn(), stat: vi.fn() }))

vi.mock('@anthropic-ai/claude-agent-sdk', () => ({
  listSessions: sdkListSessions,
  deleteSession: sdkDeleteSession
}))
vi.mock('node:fs/promises', () => ({ ...fs, default: fs }))

import { resetSessionIndex } from '../src/main/session-index'
import {
  deleteSession,
  listSessions,
  readTranscript,
  titleHint
} from '../src/main/session-store'

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
  sdkDeleteSession.mockResolvedValue(undefined)
})

// Narrows the nullable listing for the tests that are about a SUCCESSFUL list.
// Throws rather than asserting non-null, so an unexpected failure surfaces as
// itself instead of as a confusing property error three lines later.
const listed = async () => {
  const list = await listSessions()
  if (list === null) throw new Error('expected a successful listing, got the failure value')
  return list
}

describe('listSessions', () => {
  test('maps SDK session info onto SessionMeta, newest first', async () => {
    sdkListSessions.mockResolvedValue([
      { sessionId: 'older', summary: 'Older chat', lastModified: 1000 },
      { sessionId: 'newest', summary: 'Newest chat', lastModified: 3000 }
    ])

    expect(await listSessions()).toEqual([
      { id: 'newest', title: 'Newest chat', lastUpdated: 3000 },
      { id: 'older', title: 'Older chat', lastUpdated: 1000 }
    ])
  })

  // The list is GLOBAL now (#45): omitting `dir` is what makes the SDK return
  // every project, so the absence of that key is the requirement, not a detail.
  // A cwd-scoped call returns a perfectly plausible list — same shape, same
  // fields, just silently missing 36 of 37 projects — so only asserting the
  // option is gone can tell the two apart. Omitting `dir` also settles the
  // `includeWorktrees` question #43 flagged: it applies only when `dir` is
  // given, so a global list can neither widen nor narrow by it.
  test('asks the SDK for every project — no dir scoping', async () => {
    await listSessions()

    expect(sdkListSessions.mock.calls[0][0]).not.toHaveProperty('dir')
  })

  test('carries the project directory through so the list can group by it', async () => {
    sdkListSessions.mockResolvedValue([
      { sessionId: 's', summary: 'Chat', lastModified: 1, cwd: CWD }
    ])

    expect((await listed())[0].cwd).toBe(CWD)
  })

  // Absent, not '' — "Unknown project" is a real state the renderer groups on,
  // and an empty string would read as a directory whose name is nothing.
  test('a session the store records no cwd for carries no cwd field', async () => {
    sdkListSessions.mockResolvedValue([{ sessionId: 's', summary: 'Chat', lastModified: 1 }])

    expect((await listed())[0]).not.toHaveProperty('cwd')
  })

  // The real store cannot catch this: all 325 sessions carrying a customTitle
  // have one identical to `summary`, so a re-added `customTitle ?? summary`
  // coalesce stays green against live data forever. Only a divergent fixture
  // fails on it.
  test('the title is the summary alone — a divergent customTitle is ignored', async () => {
    sdkListSessions.mockResolvedValue([
      { sessionId: 's', summary: 'summary', customTitle: 'different', lastModified: 1 }
    ])

    expect((await listed())[0].title).toBe('summary')
  })

  // The point of the whole change: an implementation that calls the SDK *and*
  // still line-parses every transcript is indistinguishable from a correct one
  // by its return value, and costs exactly what this was meant to delete.
  test('reads no transcript files — no directory scan, no JSONL parse', async () => {
    sdkListSessions.mockResolvedValue([
      { sessionId: 's', summary: 'Chat', lastModified: 1 }
    ])

    await listSessions()

    expect(fs.readdir).not.toHaveBeenCalled()
    expect(fs.readFile).not.toHaveBeenCalled()
  })

  // #60: the failure has to be a different VALUE, not a different log line. []
  // renders as "No sessions yet" — a listing that blew up is then
  // indistinguishable from a fresh install, and the rail offers no way back.
  // Still typed, still no throw: the handler must not have to catch.
  test('a listing that fails answers null, distinct from the empty list', async () => {
    sdkListSessions.mockRejectedValue(new Error('ENOENT'))
    expect(await listSessions()).toBeNull()
  })

  test('a store with no sessions answers [] — absence is not failure', async () => {
    sdkListSessions.mockResolvedValue([])
    expect(await listSessions()).toEqual([])
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

  // #60, failure two of three: the store directory cannot be resolved because
  // the store itself could not be enumerated. Every session in it reads back
  // empty today, so a broken ~/.claude/projects looks like 490 empty chats.
  test('a store that cannot be enumerated answers null, not []', async () => {
    store({})

    expect(await readTranscript(CWD, 's1')).toBeNull()
  })

  // #60, failure three of three: the index found the file, the read failed.
  // A permission-blocked or mid-rotation transcript is not an empty one.
  test('a transcript that exists but cannot be read answers null, not []', async () => {
    store({ [`${ROOT}/d--projects-demo/s1.jsonl`]: transcript })
    fs.readFile.mockRejectedValue(Object.assign(new Error('EACCES'), { code: 'EACCES' }))

    expect(await readTranscript(CWD, 's1')).toBeNull()
  })

  // Criterion 4, the other direction: a file that reads fine and holds nothing
  // is a genuinely empty session. This must NOT become an error — it is the
  // most common state a brand-new session is in.
  test('a transcript that reads fine but holds no messages stays []', async () => {
    store({ [`${ROOT}/d--projects-demo/s1.jsonl`]: '' })

    expect(await readTranscript(CWD, 's1')).toEqual([])
  })
})

// Enrichment asks about ONE row and caches whatever comes back, so a failure
// here is terminal either way — there is no retry affordance on a rail label.
// It therefore keeps the lenient contract while its caller-facing sibling does
// not, which is the whole reason the two are separate functions.
describe('titleHint', () => {
  test('an unreadable transcript answers null rather than propagating the failure', async () => {
    store({})

    expect(await titleHint('s1', CWD)).toBeNull()
  })
})

// The ARGUMENT and the STATUS MAPPING — the two things a mocked SDK can speak
// to. What actually leaves the disk is a different claim and lives in
// tests/session-store-live.test.ts, which mocks nothing; asserting it here
// against a stub would only pin the stub.
describe('deleteSession', () => {
  // ONE argument, and this is the load-bearing pin of the whole feature. The
  // SDK's no-`dir` branch enumerates the project directories; its `dir` branch
  // realpaths and ENCODES one, which is the operation #44 measured failing on 45
  // of 494 live sessions. Passing `dir` therefore buys a delete button that
  // silently no-ops on ~9% of rows, and the failure is invisible from here — the
  // call still resolves. Nothing else can catch this, so it is pinned twice: by
  // value, and by arity, because `toHaveBeenCalledWith` alone reads as an
  // ordinary happy-path assertion and someone would "helpfully" widen it.
  test('calls the SDK with the id ALONE — never a project directory', async () => {
    expect(await deleteSession('sess-1')).toBe('ok')

    expect(sdkDeleteSession).toHaveBeenCalledWith('sess-1')
    expect(sdkDeleteSession.mock.calls[0]).toHaveLength(1)
  })

  // The SAME error drives this test and the next one. That is the point of the
  // pair: the verdict comes from whether the STORE still holds the session, and
  // never from the message — which is prose the SDK owns, differs between its
  // two branches, and would silently reclassify everything on a dependency bump.
  const threw = (): Error => new Error('Session sess-1 not found in any project directory')

  test('a throw is SUCCESS when the store no longer holds the session', async () => {
    // Enumerates fine, and simply has no such id — #60's `not-found`, which is
    // exactly the staleness signal a rail row can be: listed, then deleted from
    // a terminal before the click landed. The user's intent is already satisfied.
    store({ [`${ROOT}/d--projects-demo/someone-else.jsonl`]: '{}' })
    sdkDeleteSession.mockRejectedValue(threw())

    expect(await deleteSession('sess-1')).toBe('ok')
  })

  test('the same throw is FAILURE when the session is still in the store', async () => {
    store({ [`${ROOT}/d--projects-demo/sess-1.jsonl`]: '{}' })
    sdkDeleteSession.mockRejectedValue(threw())

    expect(await deleteSession('sess-1')).toBe('failed')
  })

  // #60's third state, and the one a lenient reading would get wrong. A store
  // that will not enumerate cannot demonstrate the session is gone, so reporting
  // success here would remove a row whose transcript is still on disk — the
  // "delete that failed must not leave a row that looks deleted" failure, in the
  // one branch where it is easiest to fold into the not-found case by accident.
  test('a store that will not enumerate is a failure, never a silent success', async () => {
    fs.readdir.mockRejectedValue(new Error('EACCES'))
    sdkDeleteSession.mockRejectedValue(threw())

    expect(await deleteSession('sess-1')).toBe('failed')
  })

  test('an empty id never reaches the SDK', async () => {
    expect(await deleteSession('')).toBe('failed')

    expect(sdkDeleteSession).not.toHaveBeenCalled()
  })
})
