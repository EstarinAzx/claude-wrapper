import { describe, test, expect } from 'vitest'
import { resolveHostCli, toCliOptions } from '../src/main/cli-path'

const on = (...found: string[]) => {
  const set = new Set(found)
  return (p: string): boolean => set.has(p)
}

describe('resolveHostCli', () => {
  test('finds claude.exe on a Windows PATH', () => {
    expect(
      resolveHostCli(
        'C:\\tools;C:\\Users\\me\\.local\\bin',
        'win32',
        on('C:\\Users\\me\\.local\\bin\\claude.exe')
      )
    ).toBe('C:\\Users\\me\\.local\\bin\\claude.exe')
  })

  test('finds claude on a POSIX PATH', () => {
    expect(resolveHostCli('/usr/bin:/home/me/.local/bin', 'linux', on('/home/me/.local/bin/claude'))).toBe(
      '/home/me/.local/bin/claude'
    )
  })

  // PATH order is the shell's answer to "which claude", so it has to be ours.
  test('takes the FIRST match in PATH order', () => {
    expect(
      resolveHostCli('/a:/b', 'linux', on('/a/claude', '/b/claude'))
    ).toBe('/a/claude')
  })

  test('no host install → null (the SDK keeps its bundled CLI)', () => {
    expect(resolveHostCli('/usr/bin:/bin', 'linux', on())).toBe(null)
    expect(resolveHostCli(undefined, 'linux', on())).toBe(null)
    expect(resolveHostCli('', 'win32', on())).toBe(null)
  })

  // An empty PATH entry means "current directory" to some shells. Honouring it
  // would make WHICH BINARY RUNS depend on the project the user has open.
  test('ignores empty PATH entries rather than resolving against cwd', () => {
    expect(resolveHostCli('::/usr/bin', 'linux', on('claude', '/usr/bin/claude'))).toBe(
      '/usr/bin/claude'
    )
  })

  test('uses the platform’s delimiter, not the host’s', () => {
    // ':' is a separator on POSIX but part of "C:\..." on Windows — splitting a
    // Windows PATH on ':' would shred every drive letter.
    expect(
      resolveHostCli('C:\\a;C:\\b', 'win32', on('C:\\b\\claude.exe'))
    ).toBe('C:\\b\\claude.exe')
  })

  // A .cmd/.bat shim needs a shell; the SDK spawns the path directly, so
  // resolving one hands back something that cannot start. Finding nothing and
  // falling back to the bundled binary is the better failure.
  test('does not resolve a Windows shim', () => {
    expect(resolveHostCli('C:\\tools', 'win32', on('C:\\tools\\claude.cmd'))).toBe(null)
  })

  test('does not pick up a bare extensionless file on Windows', () => {
    expect(resolveHostCli('C:\\tools', 'win32', on('C:\\tools\\claude'))).toBe(null)
  })
})

describe('toCliOptions', () => {
  test('a path → pathToClaudeCodeExecutable', () => {
    expect(toCliOptions('/usr/bin/claude')).toEqual({
      pathToClaudeCodeExecutable: '/usr/bin/claude'
    })
  })

  // The absence of the option is what selects the SDK's bundled CLI, so it must
  // be absent rather than present-and-undefined.
  test('null → no option at all', () => {
    expect(toCliOptions(null)).toEqual({})
    expect('pathToClaudeCodeExecutable' in toCliOptions(null)).toBe(false)
  })
})
