import { describe, test, expect, vi } from 'vitest'
import { ensureListEngine, type ListEnginePorts } from '../src/main/list-engine'

// #112 — the model menu and the slash-command list go empty after any pill
// click and stay empty until the next send.
//
// It lives apart from `index.ts` for the same reason `switch-workspace.ts`,
// `delete-guard.ts` and `bounds-reporter.ts` do: the electron entry cannot be
// imported under vitest, and this is precisely the logic that has to be pinned.
//
// WHAT THESE PINS CAN AND CANNOT SEE. The three writers themselves stay in
// `index.ts` and are not touched by this ticket, so what a writer contributes
// to a subsequent list read is exactly two facts: the handle is null, and
// `pendingResume` holds that writer's resume target. Every case below is
// therefore stated as one of those pairs, and named for the writer that
// produces it. The wiring from the real handlers to this function is measured
// end to end by `scripts/spike-105-model-pick-channels.mjs` phase C, which is
// this ticket's other required evidence.
//
// WHAT THE ASSERTIONS ARE ON. #105 showed the defect is invisible from the
// pill, because `model:list`'s `current` never came from the engine. So the
// interesting assertion is never "a rebuild happened" — it is WHICH resume
// target reached `warmUp`, since `resume` binds when the query is CONSTRUCTED
// (#73) and a bare re-warm silently strands the conversation while every
// count-shaped assertion still passes.
//
// The `warmUp` mock is typed with the real signature deliberately: a zero-arg
// `vi.fn()` infers an empty argument tuple, so reaching for `mock.calls[0][1]`
// stops typechecking — and `vitest run` does not typecheck, so that failure is
// invisible until `npm run typecheck`.

type FakeEngine = {
  readonly id: number
  warm: (resume: string | undefined) => void
  // Mirrors the real engine: [] until a query exists, since `listCommands`
  // reads `currentQuery?.supportedCommands` and there is none before warm-up.
  listCommands: () => string[]
  warmedWith: () => string | undefined
}

const makeFake = (id: number): FakeEngine => {
  let warmed = false
  let resume: string | undefined
  return {
    id,
    warm: (r) => {
      warmed = true
      resume = r
    },
    listCommands: () => (warmed ? ['/clear', '/model'] : []),
    warmedWith: () => resume
  }
}

const harness = (
  opts: { live?: FakeEngine | null; resume?: string | null } = {}
): {
  ports: ListEnginePorts<FakeEngine>
  make: ReturnType<typeof vi.fn>
  set: ReturnType<typeof vi.fn>
  warmUp: ReturnType<typeof vi.fn>
} => {
  let slot: FakeEngine | null = opts.live ?? null
  let made = 0
  const make = vi.fn((): FakeEngine => makeFake(++made))
  const set = vi.fn((engine: FakeEngine): void => {
    slot = engine
  })
  const warmUp = vi.fn((engine: FakeEngine, resume: string | undefined): void => {
    engine.warm(resume)
  })
  return {
    ports: { live: () => slot, make, set, warmUp, resume: () => opts.resume ?? null },
    make,
    set,
    warmUp
  }
}

// The three engine-discarding writers, as the pair of facts each one leaves
// behind. The asymmetry is already encoded in `discardEngine`'s argument and is
// not this ticket's to change: a model or permission pick KEEPS the
// conversation, a backend flip deliberately starts fresh.
const WRITERS = [
  { writer: 'model:set', resume: 'sess-abc', expected: 'sess-abc' },
  { writer: 'permission:set-mode', resume: 'sess-abc', expected: 'sess-abc' },
  { writer: 'backend:set-mode', resume: null, expected: undefined }
] as const

describe('a list read after a writer discarded the engine', () => {
  test.each(WRITERS)(
    '$writer, then a list read with no send, answers a non-empty list',
    ({ resume }) => {
      const { ports } = harness({ live: null, resume })
      expect(ensureListEngine(ports).listCommands()).not.toHaveLength(0)
    }
  )

  test.each(WRITERS)(
    '$writer: the rebuild carries its resume target into warmUp',
    ({ resume, expected }) => {
      const { ports, warmUp } = harness({ live: null, resume })
      const rebuilt = ensureListEngine(ports)

      // The pin the ticket asks for: WHAT reached warmUp, not that a rebuild
      // happened. Counting rebuilds passes while the conversation is lost.
      expect(warmUp).toHaveBeenCalledTimes(1)
      expect(warmUp.mock.calls[0][1]).toBe(expected)
      expect(rebuilt.warmedWith()).toBe(expected)
    }
  )

  test('the rebuilt engine is installed, so a second read does not spawn a second one', () => {
    const { ports, make, warmUp } = harness({ live: null, resume: 'sess-abc' })

    const first = ensureListEngine(ports)
    const second = ensureListEngine(ports)

    expect(second).toBe(first)
    expect(make).toHaveBeenCalledTimes(1)
    expect(warmUp).toHaveBeenCalledTimes(1)
  })
})

describe('a list read while the engine is live', () => {
  test('returns the live engine and rebuilds nothing', () => {
    const live = makeFake(0)
    live.warm('sess-abc')
    const { ports, make, set, warmUp } = harness({ live, resume: 'sess-abc' })

    expect(ensureListEngine(ports)).toBe(live)

    // Port by port: opening the menu on a live engine must reach none of them.
    // A version that re-made and re-warmed would answer a non-empty list too,
    // so the returned value alone cannot tell the two apart.
    expect(make).not.toHaveBeenCalled()
    expect(set).not.toHaveBeenCalled()
    expect(warmUp).not.toHaveBeenCalled()
  })
})
