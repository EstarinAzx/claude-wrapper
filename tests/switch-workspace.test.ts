import { describe, test, expect } from 'vitest'
import { switchWorkspace, type SwitchPorts } from '../src/main/switch-workspace'
import type { ResumeTarget } from '../src/main/session-index'

const KNOWN = 'known-session'
const FOLDER = 'D:/projects/app'

/**
 * Records every port call in order, so the success path can be pinned as a
 * SEQUENCE and every rejection path can be pinned as "nothing happened".
 * `state` is the observable world: a rejection must leave it byte-for-byte.
 */
const ports = (
  over: Partial<SwitchPorts> = {}
): SwitchPorts & {
  calls: string[]
  state: { cwd: string | null; resume: string | null }
  /** What warmUp was handed. Undefined until it runs, so "never warmed" and
   *  "warmed with null" stay distinguishable — they are different bugs. Kept
   *  OUT of `state`, which is asserted whole with toEqual. */
  warmedWith: () => string | null | undefined
} => {
  const calls: string[] = []
  let warmedWith: string | null | undefined
  const state = {
    cwd: 'D:/projects/before' as string | null,
    resume: 'prior-session' as string | null
  }
  return {
    calls,
    state,
    warmedWith: () => warmedWith,
    isBusy: () => false,
    closeEngine: () => {
      calls.push('closeEngine')
    },
    cancelPermissions: () => {
      calls.push('cancelPermissions')
    },
    setCwd: (cwd: string) => {
      calls.push('setCwd')
      state.cwd = cwd
    },
    rebuildEngine: () => {
      calls.push('rebuildEngine')
    },
    setResume: (id: string | null) => {
      calls.push('setResume')
      state.resume = id
    },
    warmUp: (resume: string | null) => {
      calls.push('warmUp')
      warmedWith = resume
    },
    resolveTarget: async (id: string): Promise<ResumeTarget> => {
      calls.push('resolveTarget')
      return id === KNOWN ? { status: 'ok', dir: 'D:/store/known' } : { status: 'not-found' }
    },
    ...over
  }
}

describe('switchWorkspace — the ok path', () => {
  test('runs the transaction in the authoritative order', async () => {
    const p = ports()

    const result = await switchWorkspace(p, { cwd: FOLDER, resumeId: KNOWN })

    expect(result).toEqual({ status: 'ok' })
    // The whole point of the ticket: an implementation that drops warmUp(),
    // loses the resume target or reorders teardown still returns ok.
    expect(p.calls).toEqual([
      'resolveTarget',
      'closeEngine',
      'cancelPermissions',
      'setCwd',
      'rebuildEngine',
      'setResume',
      'warmUp'
    ])
    expect(p.state).toEqual({ cwd: FOLDER, resume: KNOWN })
  })

  // #73 found this the hard way, with a real CLI: the pane came back and the
  // engine did not. The streaming query binds `resume` at CONSTRUCTION and is
  // then cached, so the warm-up here IS the only chance to bind it — a later
  // turn's own resume argument hits `ensureQuery`'s early return and is
  // silently dropped. Warming up bare leaves the rebuilt engine on a fresh
  // session while the transcript, refilled from disk, looks perfectly correct.
  //
  // Nothing else can see it: `setResume` was called, the order is right, the
  // status is ok. Only the ARGUMENT handed to warmUp tells the two apart.
  test('hands the resume target to warmUp, because resume binds at construction', async () => {
    const p = ports()

    await switchWorkspace(p, { cwd: FOLDER, resumeId: KNOWN })

    expect(p.warmedWith()).toBe(KNOWN)
  })

  test('writes the resume target AFTER the engine is rebuilt', async () => {
    const p = ports()

    await switchWorkspace(p, { cwd: FOLDER, resumeId: KNOWN })

    expect(p.calls.indexOf('setResume')).toBeGreaterThan(p.calls.indexOf('rebuildEngine'))
  })
})

describe('switchWorkspace — a null resumeId opens a new chat', () => {
  test('returns ok, clears the prior resume target, and never consults the index', async () => {
    const p = ports()

    const result = await switchWorkspace(p, { cwd: FOLDER, resumeId: null })

    expect(result).toEqual({ status: 'ok' })
    expect(p.state).toEqual({ cwd: FOLDER, resume: null })
    // Warmed with null, not left unwarmed: an empty workspace still wants its
    // query built (the commands dock reads it) — just with nothing to resume.
    expect(p.warmedWith()).toBeNull()
    // An empty folder has no session to resume — validating one would reject
    // exactly the case this branch exists for.
    expect(p.calls).not.toContain('resolveTarget')
    expect(p.calls).toEqual([
      'closeEngine',
      'cancelPermissions',
      'setCwd',
      'rebuildEngine',
      'setResume',
      'warmUp'
    ])
  })
})

describe('switchWorkspace — every rejection mutates nothing', () => {
  test('busy: a turn in flight blocks the switch', async () => {
    const p = ports({ isBusy: () => true })

    const result = await switchWorkspace(p, { cwd: FOLDER, resumeId: KNOWN })

    expect(result).toEqual({ status: 'busy' })
    expect(p.calls).toEqual([])
    expect(p.state).toEqual({ cwd: 'D:/projects/before', resume: 'prior-session' })
  })

  test('missing-cwd: a blank cwd is rejected', async () => {
    const p = ports()

    const result = await switchWorkspace(p, { cwd: '   ', resumeId: KNOWN })

    expect(result).toEqual({ status: 'missing-cwd' })
    expect(p.calls).toEqual([])
    expect(p.state).toEqual({ cwd: 'D:/projects/before', resume: 'prior-session' })
  })

  test('missing-cwd: a null cwd is rejected', async () => {
    const p = ports()

    const result = await switchWorkspace(p, { cwd: null, resumeId: KNOWN })

    expect(result).toEqual({ status: 'missing-cwd' })
    expect(p.calls).toEqual([])
  })

  test('not-found: a resumeId absent from the storage index is rejected', async () => {
    const p = ports()

    const result = await switchWorkspace(p, { cwd: FOLDER, resumeId: 'ghost' })

    expect(result).toEqual({ status: 'not-found' })
    // The index WAS consulted; nothing after it ran.
    expect(p.calls).toEqual(['resolveTarget'])
    expect(p.state).toEqual({ cwd: 'D:/projects/before', resume: 'prior-session' })
  })

  test('missing-cwd: a session with no recorded cwd is rejected, not resumed', async () => {
    const p = ports({
      resolveTarget: async (): Promise<ResumeTarget> => ({ status: 'missing-cwd' })
    })

    const result = await switchWorkspace(p, { cwd: FOLDER, resumeId: KNOWN })

    expect(result).toEqual({ status: 'missing-cwd' })
    expect(p.calls).toEqual([])
    expect(p.state).toEqual({ cwd: 'D:/projects/before', resume: 'prior-session' })
  })
})

describe('switchWorkspace — precedence is deterministic', () => {
  test('busy beats a blank cwd', async () => {
    const p = ports({ isBusy: () => true })

    expect(await switchWorkspace(p, { cwd: '', resumeId: 'ghost' })).toEqual({ status: 'busy' })
    expect(p.calls).toEqual([])
  })

  test('a blank cwd beats an unknown resumeId', async () => {
    const p = ports()

    expect(await switchWorkspace(p, { cwd: '', resumeId: 'ghost' })).toEqual({
      status: 'missing-cwd'
    })
    // cwd is checked before the index, so the lookup never happens.
    expect(p.calls).toEqual([])
  })
})
