import { watch as fsWatch } from 'node:fs'
import { resolveSessionDir, type DirLookup } from './session-index'

// Live-tail's main-side half (#57). ONE watcher, at most one watched session.
//
// The watch is DIRECTORY-level, filtered to `<id>.jsonl`: file-level fs.watch is
// unreliable on Windows (the CLI rewrites/rotates the file, and the handle can
// stop reporting). One append produces several change events, so a trailing
// debounce coalesces them into a single signal.
//
// Only a signal leaves this module — never transcript bytes. The transcript
// keeps travelling over `session:transcript`, whose read/parse/sanitize pipeline
// is reused untouched.

export interface WatchHandle {
  close(): void
}

export interface WatchIo {
  resolveDir(sessionId: string): Promise<DirLookup>
  watch(
    dir: string,
    onEvent: (filename: string | null) => void,
    onError: () => void
  ): WatchHandle
}

export const nodeWatchIo: WatchIo = {
  resolveDir: (sessionId) => resolveSessionDir(sessionId),
  watch: (dir, onEvent, onError) => {
    const w = fsWatch(dir, (_type, filename) => onEvent(filename))
    w.on('error', onError)
    return { close: () => w.close() }
  }
}

export const WATCH_DEBOUNCE_MS = 200

let handle: WatchHandle | null = null
let timer: ReturnType<typeof setTimeout> | null = null
// Bumped by every request. A resolve that finishes after a newer request began
// is stale and must not install — otherwise a slow lookup for the session you
// just left clobbers the one you just opened.
let epoch = 0

const teardown = (): void => {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  handle?.close()
  handle = null
}

// Drops any active watch and pending signal. The module-level state's test
// reset (the `resetSessionIndex` precedent).
export const resetSessionWatcher = (): void => {
  epoch += 1
  teardown()
}

// Watch one session's transcript, or `null` to watch nothing. Unknown ids and
// watcher failures tear down silently — the next adoption restarts the watch.
export const watchSession = async (
  sessionId: string | null,
  onChange: (sessionId: string) => void,
  io: WatchIo = nodeWatchIo
): Promise<void> => {
  epoch += 1
  const mine = epoch
  teardown()
  if (!sessionId) return

  const found = await io.resolveDir(sessionId)
  if (mine !== epoch || found.status !== 'ok') return

  const file = `${sessionId}.jsonl`
  // fs.watch throws SYNCHRONOUSLY when the directory is gone or unreadable, and
  // the index it was resolved from is a cache — so a stale hit lands here as a
  // real path that no longer exists. main calls this as a bare `void`, so an
  // escaping rejection would take the process down; a failed watch is the same
  // silent teardown as a failed watcher.
  try {
    handle = io.watch(
      found.dir,
      (filename) => {
        // Fenced on the epoch that installed it, not on `handle` being non-null:
        // an event already queued when the watch was closed would otherwise
        // signal the session the user has just left, against a pane showing a
        // different one.
        if (mine !== epoch) return
        // A platform that withholds the filename still signals: the debounce plus
        // the renderer's own eligibility gate make a spurious reload cheap, while
        // a missed append is the bug this ticket exists to fix.
        if (filename && filename !== file) return
        if (timer) clearTimeout(timer)
        timer = setTimeout(() => {
          timer = null
          onChange(sessionId)
        }, WATCH_DEBOUNCE_MS)
      },
      () => {
        // Silent teardown; the epoch bump also retires any event still in flight.
        epoch += 1
        teardown()
      }
    )
  } catch {
    handle = null
  }
}
