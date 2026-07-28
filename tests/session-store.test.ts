import { beforeEach, describe, expect, test, vi } from 'vitest'

// The metadata list is the SDK's job now, so the SDK is the only thing this
// suite stubs. `node:fs/promises` is stubbed purely so the "we no longer parse
// every JSONL" requirement is checkable — see the no-read test below.
const sdkListSessions = vi.hoisted(() => vi.fn())
const fs = vi.hoisted(() => ({ readFile: vi.fn(), readdir: vi.fn() }))

vi.mock('@anthropic-ai/claude-agent-sdk', () => ({ listSessions: sdkListSessions }))
vi.mock('node:fs/promises', () => ({ ...fs, default: fs }))

import { encodeCwd, listSessions } from '../src/main/session-store'

const CWD = 'D:\\projects\\demo'

beforeEach(() => {
  vi.clearAllMocks()
  sdkListSessions.mockResolvedValue([])
})

describe('encodeCwd', () => {
  test('replaces every non-alphanumeric char with -', () => {
    expect(encodeCwd('D:\\.claude\\claude projects\\playground\\4')).toBe(
      'D---claude-claude-projects-playground-4'
    )
  })
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
