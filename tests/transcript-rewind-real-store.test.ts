// #130 — the app's REAL parser against the REAL session store.
//
// WHY THIS EXISTS BESIDE tests/transcript.test.ts, which already pins the
// rewindId carry over hand-written JSONL lines.
//
// A synthetic line cannot corroborate a fact about the real store. Real
// transcripts carry CRLF, sanitized markup (`<command-name>`, caveats, bash
// blocks — 37% of plain-string user messages, measured in #50), tool_result
// user lines, sidechain lines and metadata records with no `cwd` at all, and
// `parseTranscript` treats every one of those differently. The unit tests prove
// the FIELD is carried; this proves it survives the shapes the store actually
// contains, and that the ids it produces are the same ones the CLI files its
// file backups under.
//
// THE CROSS-CHECK IS THE POINT. A transcript records its file backups as
// `file-history-delta` lines carrying `snapshotMessageId` — the user message a
// backup was filed against. If `parseTranscript`'s rewindIds and those anchors
// are drawn from the same values, then the id the app hands the SDK is provably
// an id the CLI knows. Asserting only "some uuid came out" would pass for a
// parser that carried the WRONG field.
//
// SKIPS rather than fails when the machine has no matching session: this reads
// the operator's `~/.claude`, which CI does not have. A skip here is honest —
// the portable half of the same claim is in tests/transcript.test.ts, which
// runs everywhere.
import { existsSync, readdirSync, readFileSync, statSync, openSync, readSync, closeSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, basename, resolve } from 'node:path'
import { describe, expect, test } from 'vitest'
import { parseTranscript } from '../src/main/transcript'
import { isMessageUuid } from '../src/shared/message-uuid'

const STORE = join(homedir(), '.claude', 'projects')
const REPO = resolve(__dirname, '..')

const samePath = (a: string | null, b: string): boolean =>
  typeof a === 'string' &&
  a.replace(/[\\/]+$/, '').toLowerCase() === b.replace(/[\\/]+$/, '').toLowerCase()

// The `cwd` a transcript belongs to, read from the head rather than the whole
// file — these run to megabytes. NOT line 1: the first record is session
// metadata and carries no `cwd`.
const readCwd = (path: string): string | null => {
  const fd = openSync(path, 'r')
  let head: string
  try {
    const buf = Buffer.alloc(65_536)
    const n = readSync(fd, buf, 0, buf.length, 0)
    head = buf.subarray(0, n).toString('utf8')
  } finally {
    closeSync(fd)
  }
  // Drop the last element — a bounded read almost certainly truncated it.
  for (const line of head.split(/\r?\n/).slice(0, -1)) {
    if (!line.includes('"cwd"')) continue
    try {
      const rec: unknown = JSON.parse(line)
      const cwd = (rec as { cwd?: unknown })?.cwd
      if (typeof cwd === 'string') return cwd
    } catch {
      /* a truncated or malformed line is not a finding */
    }
  }
  return null
}

/** A stored transcript for THIS repo that recorded at least one file backup. */
const findRealTranscript = (): { raw: string; anchors: Set<string> } | null => {
  if (!existsSync(STORE)) return null
  for (const d of readdirSync(STORE)) {
    const dir = join(STORE, d)
    let files: string[]
    try {
      if (!statSync(dir).isDirectory()) continue
      files = readdirSync(dir).filter((f) => f.endsWith('.jsonl'))
    } catch {
      continue
    }
    if (files.length === 0) continue
    // Up to three, so one metadata-only head block cannot drop a whole project.
    let matches = false
    for (const f of files.slice(0, 3)) {
      try {
        if (samePath(readCwd(join(dir, f)), REPO)) {
          matches = true
          break
        }
      } catch {
        /* skip */
      }
    }
    if (!matches) continue

    for (const f of files) {
      const sessionId = basename(f, '.jsonl')
      // A session with no backup store has no anchors to cross-check against.
      if (!existsSync(join(homedir(), '.claude', 'file-history', sessionId))) continue
      let raw: string
      try {
        raw = readFileSync(join(dir, f), 'utf8')
      } catch {
        continue
      }
      const anchors = new Set<string>()
      for (const line of raw.split(/\r?\n/)) {
        if (!line.includes('snapshotMessageId')) continue
        try {
          const rec = JSON.parse(line) as { type?: string; snapshotMessageId?: unknown }
          if (rec?.type === 'file-history-delta' && typeof rec.snapshotMessageId === 'string') {
            anchors.add(rec.snapshotMessageId)
          }
        } catch {
          /* skip */
        }
      }
      if (anchors.size > 0) return { raw, anchors }
    }
  }
  return null
}

const real = findRealTranscript()

describe.skipIf(real === null)('parseTranscript against the real session store (#130)', () => {
  test('real stored user messages come out ADDRESSED, not bare', () => {
    const parsed = parseTranscript(real!.raw)
    const users = parsed.filter((m) => m.role === 'user')
    expect(users.length).toBeGreaterThan(0)

    const addressed = users.filter(
      (m) => 'rewindId' in m && typeof (m as { rewindId?: unknown }).rewindId === 'string'
    )
    // The SHARE, not merely "at least one". A parser that addressed a single
    // message out of a hundred would satisfy AC3 on paper while leaving the
    // control missing from almost all of a reopened conversation. Real user
    // lines all carry a uuid, so the bar is high on purpose.
    expect(addressed.length / users.length).toBeGreaterThan(0.9)
  })

  test('every id it produces is a well-formed MessageUuid', () => {
    // The guard runs at the parse boundary, so nothing malformed should reach
    // here — asserted against real data rather than trusted.
    for (const m of parseTranscript(real!.raw)) {
      if (m.role !== 'user') continue
      const id = (m as { rewindId?: unknown }).rewindId
      if (id === undefined) continue
      expect(isMessageUuid(id)).toBe(true)
    }
  })

  test('the ids it produces are the ones the CLI files backups under', () => {
    // THE CROSS-CHECK. `snapshotMessageId` is written by the CLI, independently
    // of anything this app does; `rewindId` is produced by our parser. If the
    // parser carried the wrong field — a `promptId`, a `parentUuid`, a
    // tool_use_id — the two sets would not intersect, and the app would be
    // handing the SDK ids that address nothing.
    const parsed = parseTranscript(real!.raw)
    const produced = new Set(
      parsed
        .filter((m) => m.role === 'user')
        .map((m) => (m as { rewindId?: string }).rewindId)
        .filter((v): v is string => typeof v === 'string')
    )
    const intersection = [...real!.anchors].filter((a) => produced.has(a))
    expect(intersection.length).toBeGreaterThan(0)
  })

  test('a tool_result line contributes no addressable user message', () => {
    // Real transcripts are full of these, and they are `type: "user"` lines
    // that nobody typed. #127 measured the trap directly: an earlier probe
    // addressed a tool_result and would have reported a confident false
    // negative. Tool messages must carry no rewind address.
    for (const m of parseTranscript(real!.raw)) {
      if (m.role === 'tool') expect('rewindId' in m).toBe(false)
    }
  })
})
