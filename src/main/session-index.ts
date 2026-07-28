import { readdir, readFile, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { cwdKey as foldCwd } from '../shared/cwd-key'

// Where a session's JSONL actually lives, resolved by ENUMERATING the store
// rather than by encoding a cwd into a directory name.
//
// The old `encodeCwd(cwd) = cwd.replace(/[^a-zA-Z0-9]/g, '-')` missed 6 of 37
// real store directories (drive-letter case drift, `d:\…` vs `D:\…`), and the
// failure is silent: a synthesized path that does not exist reads back as an
// empty transcript, not as an error. Once sessions are discovered globally the
// reported cwd is display metadata, so it can never be the storage key.
//
// Making the comparison case-insensitive would patch exactly those 6 and leave
// the rest live — the encoding is lossy, so two genuinely different paths can
// collapse to the same string and no comparison can pull them apart. The only
// sound answer is to read the real names off disk.

export interface StoreIo {
  readdir(dir: string): Promise<string[]>
  readFile(file: string): Promise<string>
  stat(file: string): Promise<{ mtimeMs: number }>
}

export const nodeIo: StoreIo = {
  readdir: (dir) => readdir(dir),
  readFile: (file) => readFile(file, 'utf8'),
  stat: (file) => stat(file)
}

// An ordinary miss is a value, not an exception: a session can legitimately be
// gone from the store between a list and a click. `missing-cwd` is reserved for
// the cross-project resume caller — a session with no recorded cwd at all.
export type DirLookup = { status: 'ok'; dir: string } | { status: 'not-found' }
export type ResumeTarget = DirLookup | { status: 'missing-cwd' }

const projectsRoot = (): string => join(homedir(), '.claude', 'projects')

// Comparison/grouping key ONLY — resolved, then folded by the shared rule the
// renderer groups with. Never join() this onto anything: it is deliberately not
// a real path. `resolve` is main-side only (the renderer's cwds arrive from the
// store already absolute), so the fold itself is what lives in shared/.
export const cwdKey = (cwd: string): string => foldCwd(resolve(cwd))

// sessionId → every project directory holding it. Built from directory and file
// NAMES only — no JSONL is opened, which is what keeps a rebuild cheap enough to
// run on every list refresh.
let cache: Map<string, string[]> | null = null

const build = async (io: StoreIo): Promise<Map<string, string[]>> => {
  const root = projectsRoot()
  const map = new Map<string, string[]>()
  let projects: string[]
  try {
    projects = await io.readdir(root)
  } catch {
    return map
  }
  for (const name of projects) {
    const dir = join(root, name)
    let entries: string[]
    try {
      entries = await io.readdir(dir)
    } catch {
      continue
    }
    for (const entry of entries) {
      // `<id>.jsonl` is the transcript; a bare `<id>` directory is the subagent
      // tree, which can exist for a session whose transcript is elsewhere.
      const id = entry.endsWith('.jsonl')
        ? entry.slice(0, -'.jsonl'.length)
        : entry.includes('.')
          ? ''
          : entry
      if (!id) continue
      const dirs = map.get(id)
      if (!dirs) map.set(id, [dir])
      else if (!dirs.includes(dir)) dirs.push(dir)
    }
  }
  return map
}

// Drop the index so the next lookup rebuilds it. Called on session-list refresh:
// invalidating costs nothing and defers the enumeration to the first lookup that
// actually needs it, instead of paying for it on every refresh.
export const resetSessionIndex = (): void => {
  cache = null
}

// First `cwd` recorded in a transcript. Only ever called to break a duplicate-id
// tie between two candidate directories.
// ponytail: whole-file read, parse capped at the first few records. A duplicate
// id was never observed (0 of 490 sessions); swap readFile for a bounded fd read
// if one ever lands on a multi-MB transcript.
const HEAD_RECORDS = 20

const firstCwd = async (io: StoreIo, file: string): Promise<string | null> => {
  let raw: string
  try {
    raw = await io.readFile(file)
  } catch {
    return null
  }
  for (const line of raw.split('\n', HEAD_RECORDS)) {
    if (!line.trim()) continue
    try {
      const rec = JSON.parse(line) as { cwd?: unknown }
      if (typeof rec.cwd === 'string' && rec.cwd) return rec.cwd
    } catch {
      // A truncated or non-JSON line is not fatal — keep scanning.
    }
  }
  return null
}

// Two directories claim the same session id. Prefer the one whose recorded cwd
// matches what the session reports; failing that the newest file. Never
// arbitrary — an arbitrary pick here is the silent-wrong-transcript bug again.
const tieBreak = async (
  dirs: string[],
  sessionId: string,
  hintCwd: string | null | undefined,
  io: StoreIo
): Promise<string> => {
  const file = (dir: string): string => join(dir, `${sessionId}.jsonl`)
  if (hintCwd) {
    const want = cwdKey(hintCwd)
    for (const dir of dirs) {
      const found = await firstCwd(io, file(dir))
      if (found && cwdKey(found) === want) return dir
    }
  }
  let newest = dirs[0]
  let newestAt = -Infinity
  for (const dir of dirs) {
    let at = -Infinity
    try {
      at = (await io.stat(file(dir))).mtimeMs
    } catch {
      // Unstattable candidate stays at -Infinity and loses.
    }
    if (at > newestAt) {
      newestAt = at
      newest = dir
    }
  }
  return newest
}

// Resolve a session id to the directory that physically holds it. `hintCwd` is
// the session's reported cwd — used only to break a duplicate-id tie, never to
// construct the path. A miss rebuilds the index once and retries once, then
// gives up: a session created since the last refresh resolves, a genuinely
// absent one cannot spin.
export const resolveSessionDir = async (
  sessionId: string,
  hintCwd?: string | null,
  io: StoreIo = nodeIo
): Promise<DirLookup> => {
  if (!sessionId) return { status: 'not-found' }
  if (!cache) cache = await build(io)
  let dirs = cache.get(sessionId)
  if (!dirs) {
    cache = await build(io)
    dirs = cache.get(sessionId)
  }
  if (!dirs || dirs.length === 0) return { status: 'not-found' }
  if (dirs.length === 1) return { status: 'ok', dir: dirs[0] }
  return { status: 'ok', dir: await tieBreak(dirs, sessionId, hintCwd, io) }
}

// Front door for cross-project resume. A session with no recorded cwd cannot be
// resumed into a workspace, and that is a typed rejection the caller can render
// ("Unknown project") — NOT an empty transcript, and never a cwd invented by
// decoding the lossy directory name back into a path.
export const resolveResumeTarget = async (
  sessionId: string,
  cwd: string | null | undefined,
  io: StoreIo = nodeIo
): Promise<ResumeTarget> => {
  if (!cwd) return { status: 'missing-cwd' }
  return resolveSessionDir(sessionId, cwd, io)
}
