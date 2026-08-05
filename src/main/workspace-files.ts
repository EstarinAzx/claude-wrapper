import { isAbsolute, join, relative, sep } from 'node:path'

// The workspace listing behind `@` file references (#118), and the trust
// boundary that comes with it.
//
// WHY THIS IS A NEW SURFACE. Nothing in `src/main/` enumerated the open
// workspace before this — re-asserted mechanically by the #116 spike: the only
// `readdir`s are `session-index.ts` and `subagent-store.ts`, both pointed at
// `~/.claude`, and both `session:pick-folder` and `attachments:pick` are native
// dialogs. So this is a new main-side surface with a new trust boundary, not a
// reskin of the `/` popover.
//
// WHY WE ENUMERATE OURSELVES rather than asking the CLI. #116 measured the
// CLI's own `file_suggestions` route as reachable — `query.request({subtype:
// 'file_suggestions'})` is accepted, and a deliberately bogus subtype is refused
// by name, so the accept is real — and **useless as a picker**: an empty query
// returns the workspace top level, but 18/18 non-empty prefixes returned ZERO
// in-workspace matches across two workspaces and both binaries, including
// prefixes naming files that exist. An autocomplete that empties the moment you
// type a character is not an autocomplete.
//
// WHY NO SUBPROCESS. Same spike: this walk is 3ms/356 files pruned against
// 192ms/18,349 unpruned, while `git ls-files` is 27ms **plus a second
// `child_process` spawn** — which would be the app's second ever, after #90's
// `agent-view.ts` at ~893ms a look. A source-level test asserts this module
// reaches no `child_process`, so reaching for `git ls-files` fails loudly.
//
// ESCAPE REJECTION IS THE POINT. #116 observed the CLI's own suggester answering
// with paths OUTSIDE a temp workspace — `~/.claude` entries and `..\..\..\`
// escapes — once, and could not reproduce it in 4 rounds x 7 probes. Unexplained
// rather than refuted. This module generates its own list so it does not inherit
// that behaviour, and the containment below is a **safety property** in
// `clampBounds`' sense (#79) rather than a validation: an escaping entry is
// dropped at discovery, BEFORE anything recurses into it or emits it, so it
// never crosses IPC at all. A version that returned it and let the renderer
// filter would pass any result-only test, which is why the suite asserts the
// walk port was never REACHED for it (`delete-guard.ts` #107,
// `switch-workspace.ts` #109).

export interface DirEntry {
  name: string
  isDirectory: boolean
  isSymbolicLink: boolean
}

export interface WorkspaceFilePorts {
  /** One directory's entries. Rejects are treated as "unreadable, skip". */
  readDir(dir: string): Promise<DirEntry[]>
  /** Resolves a symlink to its real location. Only ever called for symlinks. */
  realPath(target: string): Promise<string>
  /** The root `.gitignore`'s text, or null when there is none. */
  readIgnore(file: string): Promise<string | null>
}

// Pruned unconditionally, before `.gitignore` is consulted at all. #116 measured
// the difference at 60x (3ms vs 192ms), so this is a cost fact rather than a
// taste question, and it is what keeps the walk inside a per-keystroke budget.
export const ALWAYS_PRUNE = new Set(['node_modules', '.git', 'out', 'dist'])

// A runaway guard, NOT a product cap — the product cap is the popover's
// `MAX_FILE_SUGGESTIONS`, applied after ranking. This one exists so a workspace
// opened on a home directory cannot hand the renderer a million strings.
//
// ponytail: a flat ceiling with no partial-result signalling. If a real
// workspace ever hits it, the fix is to say so in the payload, not to raise it.
export const MAX_WORKSPACE_FILES = 20000

/**
 * Is `abs` genuinely inside `root`?
 *
 * `relative` rather than a string prefix: `startsWith(root)` says yes to
 * `/work/project-evil` for root `/work/project`, and the whole reason this
 * function exists is that such a yes is unrecoverable once the path is out.
 */
export const insideRoot = (root: string, abs: string): boolean => {
  const rel = relative(root, abs)
  return rel !== '' && !rel.startsWith('..' + sep) && rel !== '..' && !isAbsolute(rel)
}

// A deliberately small `.gitignore` subset (owner call 3, taken 2026-08-05:
// honour it, because the CLI carries its own `respectGitignore` defaulting to
// true and a wrapper offering ignored files would suggest paths the engine's own
// conventions exclude).
//
// ponytail: root `.gitignore` only, no negations, no nested ignore files. Those
// are the parts real repos rarely need for a *suggestion list* — the cost of
// getting them wrong here is a file appearing that git would hide, not a
// correctness bug — and the upgrade path is to swap this one function for a real
// matcher. The ALWAYS_PRUNE set above is what actually protects the budget, and
// it does not depend on this.
export const compileIgnore = (text: string | null): ((rel: string, isDir: boolean) => boolean) => {
  if (!text) return () => false

  const rules = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l !== '' && !l.startsWith('#') && !l.startsWith('!'))
    .map((raw) => {
      const dirOnly = raw.endsWith('/')
      const anchored = raw.startsWith('/')
      const body = raw.replace(/^\//, '').replace(/\/$/, '')
      const source = body
        .split('/')
        .map((seg) =>
          seg === '**'
            ? '.*'
            : seg
                .replace(/[.+^${}()|[\]\\]/g, '\\$&')
                .replace(/\*/g, '[^/]*')
                .replace(/\?/g, '[^/]')
        )
        .join('/')
      return { re: new RegExp(`^${source}$`), dirOnly, anchored, hasSlash: body.includes('/') }
    })

  return (rel, isDir) => {
    const segments = rel.split('/')
    return rules.some((r) => {
      if (r.dirOnly && !isDir) return false
      if (r.anchored || r.hasSlash) return r.re.test(rel)
      // Unanchored patterns match at any depth — `*.log` must hide
      // `src/deep/x.log`, which is git's behaviour and the common case.
      return segments.some((s) => r.re.test(s))
    })
  }
}

const toPosix = (p: string): string => p.split(sep).join('/')

/**
 * Every referenceable file in `root`, as workspace-relative POSIX paths.
 *
 * Breadth-first with an explicit stack rather than recursion: the depth of a
 * user's workspace is not this module's to assume, and a stack makes the
 * "never reached" property above legible — a directory that is not pushed is a
 * directory `readDir` is never called for.
 */
export const listWorkspaceFiles = async (
  ports: WorkspaceFilePorts,
  root: string
): Promise<string[]> => {
  const ignored = compileIgnore(await ports.readIgnore(join(root, '.gitignore')).catch(() => null))

  const out: string[] = []
  const queue: string[] = [root]

  while (queue.length > 0 && out.length < MAX_WORKSPACE_FILES) {
    const dir = queue.shift() as string
    const entries = await ports.readDir(dir).catch((): DirEntry[] => [])

    for (const entry of entries) {
      if (out.length >= MAX_WORKSPACE_FILES) break
      if (ALWAYS_PRUNE.has(entry.name)) continue

      const abs = join(dir, entry.name)

      // Containment, checked on the JOINED path before anything else happens to
      // it. This is what catches a `..`-bearing entry name: it is dropped here,
      // so it is never queued, never resolved and never emitted.
      if (!insideRoot(root, abs)) continue

      const rel = toPosix(relative(root, abs))
      if (ignored(rel, entry.isDirectory)) continue

      // A symlink is the other way out of the workspace, and the only case
      // worth paying a resolve for. Resolved, then contained again — an
      // in-workspace name pointing at an out-of-workspace target is exactly the
      // shape the unexplained #116 observation had.
      if (entry.isSymbolicLink) {
        const real = await ports.realPath(abs).catch(() => null)
        if (real === null || !insideRoot(root, real)) continue
      }

      if (entry.isDirectory) queue.push(abs)
      else out.push(rel)
    }
  }

  return out
}
