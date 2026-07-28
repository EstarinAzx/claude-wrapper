import { cwdKey } from './cwd-key'
import type { SessionMeta } from './session-types'

// A session the store records no cwd for. It still has a transcript and still
// replays; what it cannot do is name a workspace to resume into — the main
// process rejects it as `missing-cwd`. So it gets an honest heading rather than
// a directory invented by decoding the store's lossy folder name.
export const UNKNOWN_PROJECT = 'Unknown project'

export interface SessionGroup {
  // Folded cwd; '' for the Unknown project group.
  key: string
  // The project directory as the store spells it, or UNKNOWN_PROJECT.
  label: string
  // Belongs to the workspace the app currently has open. Rows outside it are
  // rendered but inert until the workspace transition ships.
  current: boolean
  sessions: SessionMeta[]
}

export interface GroupedSessions {
  groups: SessionGroup[]
  // Sessions actually rendered (post-cap).
  shown: number
  // Sessions matching the filter (pre-cap) — the difference is what "Show more"
  // has left to reveal.
  matched: number
}

// Filter, then sort and group, then cap — in that order, which is a contract and
// not an implementation detail. Capping first would hide a match that happens to
// be older than `limit` newer non-matches, and the list would look simply empty
// rather than truncated. The cap is GLOBAL: the newest N matches across all
// projects, not N per project, because 490 sessions across 37 projects is the
// observed scale and per-group caps multiply.
export const groupSessions = (
  sessions: readonly SessionMeta[],
  opts: { limit: number; query?: string; cwd?: string | null }
): GroupedSessions => {
  const labelOf = (s: SessionMeta): string => s.cwd || UNKNOWN_PROJECT
  const keyOf = (s: SessionMeta): string => (s.cwd ? cwdKey(s.cwd) : '')

  const q = (opts.query ?? '').trim().toLowerCase()
  // The project label is matchable too, so typing a project name narrows to it
  // without a separate project picker.
  const matched = q
    ? sessions.filter(
        (s) => s.title.toLowerCase().includes(q) || labelOf(s).toLowerCase().includes(q)
      )
    : [...sessions]
  matched.sort((a, b) => b.lastUpdated - a.lastUpdated)

  const page = matched.slice(0, opts.limit)
  const here = opts.cwd ? cwdKey(opts.cwd) : null

  // Groups are emitted in first-appearance order over a newest-first page, which
  // IS "by most recent session, newest group first" — no second sort needed.
  const groups: SessionGroup[] = []
  const byKey = new Map<string, SessionGroup>()
  for (const session of page) {
    const key = keyOf(session)
    let group = byKey.get(key)
    if (!group) {
      group = { key, label: labelOf(session), current: key === here, sessions: [] }
      byKey.set(key, group)
      groups.push(group)
    }
    group.sessions.push(session)
  }

  return { groups, shown: page.length, matched: matched.length }
}
