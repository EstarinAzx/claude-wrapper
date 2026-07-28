import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import {
  resetSessionWatcher,
  watchSession,
  WATCH_DEBOUNCE_MS,
  type WatchIo
} from '../src/main/session-watcher'

// Injected watch seam (the StoreIo idiom): tests drive "filesystem" events by
// firing the callbacks the module handed to `watch` — fs.watch is never touched
// and no fs.watch call shapes are asserted, only behavior at the seam.
interface FakeWatchEntry {
  dir: string
  onEvent: (filename: string | null) => void
  onError: () => void
  closed: boolean
}

const fakeIo = (
  dirs: Record<string, string>
): { io: WatchIo; watches: FakeWatchEntry[] } => {
  const watches: FakeWatchEntry[] = []
  return {
    watches,
    io: {
      resolveDir: async (id) =>
        dirs[id] ? { status: 'ok', dir: dirs[id] } : { status: 'not-found' },
      watch: (dir, onEvent, onError) => {
        const entry: FakeWatchEntry = { dir, onEvent, onError, closed: false }
        watches.push(entry)
        return {
          close: () => {
            entry.closed = true
          }
        }
      }
    }
  }
}

beforeEach(() => {
  vi.useFakeTimers()
  resetSessionWatcher()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('session watcher — one watched session, debounced signal', () => {
  test('a change to the watched session file signals after the debounce', async () => {
    const { io, watches } = fakeIo({ s1: '/store/proj' })
    const onChange = vi.fn()

    await watchSession('s1', onChange, io)
    expect(watches[0].dir).toBe('/store/proj')

    watches[0].onEvent('s1.jsonl')
    // Trailing debounce: nothing fires immediately.
    expect(onChange).not.toHaveBeenCalled()

    vi.advanceTimersByTime(WATCH_DEBOUNCE_MS)
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('s1')
  })

  test('a burst of events coalesces into one trailing signal', async () => {
    const { io, watches } = fakeIo({ s1: '/store/proj' })
    const onChange = vi.fn()
    await watchSession('s1', onChange, io)

    watches[0].onEvent('s1.jsonl')
    vi.advanceTimersByTime(WATCH_DEBOUNCE_MS - 50)
    watches[0].onEvent('s1.jsonl')
    // The second event reset the timer: a full debounce after the FIRST event
    // has elapsed, but not after the last one.
    vi.advanceTimersByTime(WATCH_DEBOUNCE_MS - 50)
    expect(onChange).not.toHaveBeenCalled()

    vi.advanceTimersByTime(50)
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  test('events for other files in the directory do not signal', async () => {
    const { io, watches } = fakeIo({ s1: '/store/proj' })
    const onChange = vi.fn()
    await watchSession('s1', onChange, io)

    watches[0].onEvent('other.jsonl')
    watches[0].onEvent('s1')
    vi.advanceTimersByTime(WATCH_DEBOUNCE_MS)
    expect(onChange).not.toHaveBeenCalled()
  })

  test('a null filename (platform withholds it) still signals', async () => {
    const { io, watches } = fakeIo({ s1: '/store/proj' })
    const onChange = vi.fn()
    await watchSession('s1', onChange, io)

    watches[0].onEvent(null)
    vi.advanceTimersByTime(WATCH_DEBOUNCE_MS)
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  test('watching null tears the active watch down', async () => {
    const { io, watches } = fakeIo({ s1: '/store/proj' })
    const onChange = vi.fn()
    await watchSession('s1', onChange, io)

    await watchSession(null, onChange, io)
    expect(watches[0].closed).toBe(true)

    // A stale event from the closed watch is inert.
    watches[0].onEvent('s1.jsonl')
    vi.advanceTimersByTime(WATCH_DEBOUNCE_MS)
    expect(onChange).not.toHaveBeenCalled()
  })

  test('a pending debounce does not outlive a teardown', async () => {
    const { io, watches } = fakeIo({ s1: '/store/proj' })
    const onChange = vi.fn()
    await watchSession('s1', onChange, io)

    watches[0].onEvent('s1.jsonl')
    vi.advanceTimersByTime(WATCH_DEBOUNCE_MS - 50)
    await watchSession(null, onChange, io)

    vi.advanceTimersByTime(WATCH_DEBOUNCE_MS)
    expect(onChange).not.toHaveBeenCalled()
  })

  test('watching a second session drops the first watch', async () => {
    const { io, watches } = fakeIo({ s1: '/store/a', s2: '/store/b' })
    const onChange = vi.fn()
    await watchSession('s1', onChange, io)
    await watchSession('s2', onChange, io)

    expect(watches[0].closed).toBe(true)
    expect(watches[1].dir).toBe('/store/b')

    watches[1].onEvent('s2.jsonl')
    vi.advanceTimersByTime(WATCH_DEBOUNCE_MS)
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('s2')
  })

  test('an unknown session id installs no watch', async () => {
    const { io, watches } = fakeIo({})
    const onChange = vi.fn()
    await watchSession('missing', onChange, io)
    expect(watches).toHaveLength(0)
  })

  test('a watcher error tears down silently and the next watch restarts', async () => {
    const { io, watches } = fakeIo({ s1: '/store/proj' })
    const onChange = vi.fn()
    await watchSession('s1', onChange, io)

    watches[0].onError()
    expect(watches[0].closed).toBe(true)
    watches[0].onEvent('s1.jsonl')
    vi.advanceTimersByTime(WATCH_DEBOUNCE_MS)
    expect(onChange).not.toHaveBeenCalled()

    // The next adoption restarts watching from scratch.
    await watchSession('s1', onChange, io)
    watches[1].onEvent('s1.jsonl')
    vi.advanceTimersByTime(WATCH_DEBOUNCE_MS)
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  test('a watch that throws on construction does not reject the request', async () => {
    // fs.watch throws SYNCHRONOUSLY on ENOENT/EPERM, and the caller in main is a
    // bare `void watchSession(...)` — an escaping rejection kills the process.
    // The index it resolved against is a cache, so a directory deleted since the
    // last refresh reaches here as a live path that no longer exists.
    const io: WatchIo = {
      resolveDir: async () => ({ status: 'ok', dir: '/store/gone' }),
      watch: () => {
        throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
      }
    }

    await expect(watchSession('s1', vi.fn(), io)).resolves.toBeUndefined()

    // And the next adoption still installs a watch.
    const { io: healthy, watches } = fakeIo({ s1: '/store/proj' })
    const onChange = vi.fn()
    await watchSession('s1', onChange, healthy)
    watches[0].onEvent('s1.jsonl')
    vi.advanceTimersByTime(WATCH_DEBOUNCE_MS)
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  test('an overlapping earlier request cannot install over the later one', async () => {
    const pending = new Map<
      string,
      (d: { status: 'ok'; dir: string } | { status: 'not-found' }) => void
    >()
    const watches: string[] = []
    const io: WatchIo = {
      resolveDir: (id) =>
        new Promise((resolve) => {
          pending.set(id, resolve)
        }),
      watch: (dir) => {
        watches.push(dir)
        return { close: () => {} }
      }
    }
    const onChange = vi.fn()

    const first = watchSession('s1', onChange, io)
    const second = watchSession('s2', onChange, io)
    // The LATER request resolves first and installs; the earlier one resolves
    // afterwards and must not clobber it.
    pending.get('s2')!({ status: 'ok', dir: '/store/b' })
    await second
    pending.get('s1')!({ status: 'ok', dir: '/store/a' })
    await first

    expect(watches).toEqual(['/store/b'])
  })
})
