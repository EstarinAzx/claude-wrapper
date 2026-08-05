import { describe, test, expect, vi } from 'vitest'
import { readFile } from 'node:fs/promises'
import { join, sep } from 'node:path'
import {
  ALWAYS_PRUNE,
  MAX_WORKSPACE_FILES,
  insideRoot,
  listWorkspaceFiles,
  type DirEntry,
  type WorkspaceFilePorts
} from '../src/main/workspace-files'

// #118 — the workspace listing and the trust boundary that comes with it.
//
// The escape-rejection tests below assert REACHABILITY, not results, which is
// the ticket's own requirement and `delete-guard.ts`/`switch-workspace.ts`'s
// rule: a version that returned an out-of-workspace path and let the renderer
// drop it would satisfy every result-only assertion while the path had already
// crossed IPC. So what is pinned is that the walk port was never CALLED for it.

const ROOT = sep === '\\' ? 'C:\\work\\project' : '/work/project'
const OUTSIDE = sep === '\\' ? 'C:\\work\\secrets' : '/work/secrets'

const file = (name: string): DirEntry => ({ name, isDirectory: false, isSymbolicLink: false })
const dir = (name: string): DirEntry => ({ name, isDirectory: true, isSymbolicLink: false })
const link = (name: string, isDirectory = false): DirEntry => ({
  name,
  isDirectory,
  isSymbolicLink: true
})

// `tree` is keyed by absolute path. Anything not in it reads as an empty
// directory, so a test only declares what it cares about.
const makePorts = (
  tree: Record<string, DirEntry[]>,
  opts: { ignore?: string; realPaths?: Record<string, string> } = {}
): WorkspaceFilePorts & {
  readDir: ReturnType<typeof vi.fn>
  realPath: ReturnType<typeof vi.fn>
} => ({
  readDir: vi.fn(async (d: string) => tree[d] ?? []),
  realPath: vi.fn(async (t: string) => opts.realPaths?.[t] ?? t),
  readIgnore: async () => opts.ignore ?? null
})

describe('insideRoot', () => {
  test('a sibling directory sharing a prefix is OUTSIDE', () => {
    // The reason this is `relative` and not `startsWith`: the string test says
    // yes here, and a yes is unrecoverable once the path is out.
    expect(insideRoot(ROOT, ROOT + '-evil' + sep + 'x.ts')).toBe(false)
  })

  test('a real child is inside', () => {
    expect(insideRoot(ROOT, join(ROOT, 'src', 'a.ts'))).toBe(true)
  })

  test('the root itself is not a candidate', () => {
    expect(insideRoot(ROOT, ROOT)).toBe(false)
  })

  test('a parent escape is outside', () => {
    expect(insideRoot(ROOT, join(ROOT, '..', 'x.ts'))).toBe(false)
  })
})

describe('the walk', () => {
  test('returns workspace-relative POSIX paths, never absolute ones', async () => {
    const ports = makePorts({
      [ROOT]: [file('README.md'), dir('src')],
      [join(ROOT, 'src')]: [file('index.ts')]
    })
    const files = await listWorkspaceFiles(ports, ROOT)
    expect(files.sort()).toEqual(['README.md', 'src/index.ts'])
    // No separator leaks from the host platform, and no absolute path leaves.
    expect(files.every((f) => !f.includes('\\'))).toBe(true)
    expect(files.every((f) => !f.startsWith(ROOT))).toBe(true)
  })

  test('an unreadable directory is skipped rather than failing the whole walk', async () => {
    const ports = makePorts({ [ROOT]: [dir('locked'), file('a.ts')] })
    ports.readDir.mockImplementation(async (d: string) => {
      if (d === join(ROOT, 'locked')) throw new Error('EACCES')
      return d === ROOT ? [dir('locked'), file('a.ts')] : []
    })
    expect(await listWorkspaceFiles(ports, ROOT)).toEqual(['a.ts'])
  })

  test('stops at the runaway ceiling', async () => {
    const many = Array.from({ length: MAX_WORKSPACE_FILES + 500 }, (_, i) => file(`f${i}.ts`))
    const ports = makePorts({ [ROOT]: many })
    expect((await listWorkspaceFiles(ports, ROOT)).length).toBe(MAX_WORKSPACE_FILES)
  })
})

describe('pruning is never REACHED, not merely filtered (owner call 3)', () => {
  test.each([...ALWAYS_PRUNE])('%s is never walked into', async (pruned) => {
    const ports = makePorts({
      [ROOT]: [dir(pruned), file('a.ts')],
      [join(ROOT, pruned)]: [file('deep.ts')]
    })
    const files = await listWorkspaceFiles(ports, ROOT)
    expect(files).toEqual(['a.ts'])
    // The 60x cost difference #116 measured is only real if the directory is
    // never descended into. Filtering the results afterwards would pay it.
    expect(ports.readDir).not.toHaveBeenCalledWith(join(ROOT, pruned))
  })
})

describe('escape rejection — asserted by reachability', () => {
  test('a `..` entry name is dropped BEFORE anything descends into it', async () => {
    const ports = makePorts({
      [ROOT]: [dir('..'), file('a.ts')],
      [OUTSIDE]: [file('passwords.txt')]
    })
    const files = await listWorkspaceFiles(ports, ROOT)
    expect(files).toEqual(['a.ts'])
    // The reachability assertion: the parent was never enumerated at all.
    for (const call of ports.readDir.mock.calls) {
      expect(insideRoot(ROOT, call[0] as string) || call[0] === ROOT).toBe(true)
    }
  })

  test('a symlinked DIRECTORY pointing outside the workspace is never walked', async () => {
    const linkPath = join(ROOT, 'escape')
    const ports = makePorts(
      {
        [ROOT]: [link('escape', true), file('a.ts')],
        [OUTSIDE]: [file('passwords.txt')]
      },
      { realPaths: { [linkPath]: OUTSIDE } }
    )
    const files = await listWorkspaceFiles(ports, ROOT)
    expect(files).toEqual(['a.ts'])
    expect(ports.readDir).not.toHaveBeenCalledWith(OUTSIDE)
    expect(ports.readDir).not.toHaveBeenCalledWith(linkPath)
    // Not merely absent from the array — never emitted at any depth.
    expect(files.join()).not.toContain('passwords')
  })

  test('a symlinked FILE pointing outside the workspace never reaches the result', async () => {
    const linkPath = join(ROOT, 'notes.txt')
    const ports = makePorts(
      { [ROOT]: [link('notes.txt'), file('a.ts')] },
      { realPaths: { [linkPath]: join(OUTSIDE, 'notes.txt') } }
    )
    expect(await listWorkspaceFiles(ports, ROOT)).toEqual(['a.ts'])
  })

  test('a symlink that stays inside the workspace is kept', async () => {
    // The positive control. Without it, "no symlink is ever returned" would
    // pass just as well and the containment above would prove nothing.
    const linkPath = join(ROOT, 'alias.ts')
    const ports = makePorts(
      { [ROOT]: [link('alias.ts'), file('a.ts')] },
      { realPaths: { [linkPath]: join(ROOT, 'src', 'real.ts') } }
    )
    expect((await listWorkspaceFiles(ports, ROOT)).sort()).toEqual(['a.ts', 'alias.ts'])
  })

  test('an unresolvable symlink is dropped rather than trusted', async () => {
    const ports = makePorts({ [ROOT]: [link('broken.ts'), file('a.ts')] })
    ports.realPath.mockRejectedValue(new Error('ENOENT'))
    expect(await listWorkspaceFiles(ports, ROOT)).toEqual(['a.ts'])
  })

  test('realPath is paid ONLY for symlinks', async () => {
    const ports = makePorts({ [ROOT]: [file('a.ts'), dir('src')] })
    await listWorkspaceFiles(ports, ROOT)
    expect(ports.realPath).not.toHaveBeenCalled()
  })
})

describe('.gitignore (owner call 3, ignore half)', () => {
  test('a plain name is hidden at any depth', async () => {
    const ports = makePorts(
      {
        [ROOT]: [file('a.ts'), file('secret.env'), dir('src')],
        [join(ROOT, 'src')]: [file('secret.env'), file('b.ts')]
      },
      { ignore: 'secret.env\n' }
    )
    expect((await listWorkspaceFiles(ports, ROOT)).sort()).toEqual(['a.ts', 'src/b.ts'])
  })

  test('a glob matches within a segment', async () => {
    const ports = makePorts(
      { [ROOT]: [file('a.ts'), file('debug.log'), file('trace.log')] },
      { ignore: '*.log\n' }
    )
    expect(await listWorkspaceFiles(ports, ROOT)).toEqual(['a.ts'])
  })

  test('an ignored directory is never walked into', async () => {
    const ports = makePorts(
      {
        [ROOT]: [dir('coverage'), file('a.ts')],
        [join(ROOT, 'coverage')]: [file('report.html')]
      },
      { ignore: 'coverage/\n' }
    )
    expect(await listWorkspaceFiles(ports, ROOT)).toEqual(['a.ts'])
    expect(ports.readDir).not.toHaveBeenCalledWith(join(ROOT, 'coverage'))
  })

  test('a leading slash anchors to the root', async () => {
    const ports = makePorts(
      {
        [ROOT]: [file('build.ts'), dir('src')],
        [join(ROOT, 'src')]: [file('build.ts')]
      },
      { ignore: '/build.ts\n' }
    )
    // Anchored: the root copy is hidden, the nested one is not.
    expect(await listWorkspaceFiles(ports, ROOT)).toEqual(['src/build.ts'])
  })

  test('comments and blank lines are not patterns', async () => {
    const ports = makePorts(
      { [ROOT]: [file('a.ts')] },
      { ignore: '# a comment\n\n   \n' }
    )
    expect(await listWorkspaceFiles(ports, ROOT)).toEqual(['a.ts'])
  })

  test('a negation is ignored rather than misapplied', async () => {
    // ponytail: negations are the documented gap. What must NOT happen is a `!`
    // line being read as an ordinary pattern and hiding the file it un-hides.
    const ports = makePorts({ [ROOT]: [file('keep.ts')] }, { ignore: '!keep.ts\n' })
    expect(await listWorkspaceFiles(ports, ROOT)).toEqual(['keep.ts'])
  })

  test('no .gitignore is not an error', async () => {
    const ports = makePorts({ [ROOT]: [file('a.ts')] })
    expect(await listWorkspaceFiles(ports, ROOT)).toEqual(['a.ts'])
  })
})

describe('no second spawn (source-level, spike-105 phase-B style)', () => {
  test('workspace-files.ts reaches no child_process', async () => {
    // #116 priced `git ls-files` at 27ms PLUS a spawn, against 3ms in-process.
    // The app has exactly one spawn (#90, ~893ms a look) and a second one is an
    // architectural call, not a detail — so this fails loudly when someone
    // reaches for the shell rather than quietly costing a round trip.
    const source = await readFile(join(process.cwd(), 'src/main/workspace-files.ts'), 'utf8')
    const code = source
      .split('\n')
      .filter((l) => !l.trim().startsWith('//'))
      .join('\n')
    for (const banned of ['child_process', 'spawn', 'execFile', 'execSync', 'ls-files']) {
      expect(code).not.toContain(banned)
    }
  })
})
