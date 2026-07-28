// Which Claude Code binary the app runs.
//
// The Agent SDK ships its OWN CLI inside the npm package and spawns that by
// default. It is pinned by the lockfile, so it drifts from whatever the user
// has installed — silently, and for as long as nobody thinks to bump it. That
// drift is what made `opus` mean Opus 4.8 in #53 while the host CLI had moved
// on to Opus 5.
//
// So: follow the host install when there is one, fall back to the bundled
// binary when there isn't. `pathToClaudeCodeExecutable` is the SDK's own hook
// for this; omitting it is what selects the bundled default.
//
// The trade this makes, deliberately, at the owner's call: the app now tracks
// whatever Claude Code the user installs, including a version it has never been
// tested against. A host CLI whose control protocol has moved can break the app
// with no code change here. The alternative — pinning — is what caused #53.
//
// Resolution is a plain PATH walk rather than a `which` shell-out ON PURPOSE:
// #53 deleted the app's only child_process use, and reintroducing one here to
// answer a question `fs.existsSync` can answer would be a poor trade.

import { existsSync } from 'node:fs'
import { posix, win32 } from 'node:path'

// Both the separator and the join have to come from the TARGET platform, not
// the host running this code. Bare `path.join` uses the host's separator, so a
// POSIX PATH walked on Windows yields '\usr\bin\claude' — a path that matches
// nothing. Caught by the POSIX tests, which run on Windows here.
const delimiterFor = (platform: NodeJS.Platform): string =>
  platform === 'win32' ? ';' : ':'

const joinFor = (platform: NodeJS.Platform): ((a: string, b: string) => string) =>
  platform === 'win32' ? win32.join : posix.join

// `.exe` only on Windows. A `.cmd`/`.bat` shim would need a shell to launch,
// and the SDK spawns the path directly — resolving one would hand back
// something that cannot start. Better to find nothing and use the bundled
// binary than to find a path that fails at spawn time.
const namesFor = (platform: NodeJS.Platform): string[] =>
  platform === 'win32' ? ['claude.exe'] : ['claude']

/** First `claude` executable on PATH, or null when there is none. `exists` is
 *  injectable so the walk can be tested without touching a real filesystem. */
export const resolveHostCli = (
  pathEnv: string | undefined,
  platform: NodeJS.Platform,
  exists: (p: string) => boolean = existsSync
): string | null => {
  const join = joinFor(platform)
  for (const dir of (pathEnv ?? '').split(delimiterFor(platform))) {
    // An empty PATH entry means "the current directory" to some shells. Not
    // honoured here: resolving the CLI relative to whatever cwd the app happens
    // to hold would make which binary runs depend on the open project.
    if (dir === '') continue
    for (const name of namesFor(platform)) {
      const full = join(dir, name)
      if (exists(full)) return full
    }
  }
  return null
}

/** Map a resolved path to SDK query options. null → no option → the SDK's
 *  bundled CLI, which is the correct fallback on a machine without one. */
export const toCliOptions = (cliPath: string | null): Record<string, unknown> =>
  cliPath ? { pathToClaudeCodeExecutable: cliPath } : {}
