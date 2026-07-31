import { describe, expect, it, vi } from 'vitest'
import {
  ANNOUNCE_COPY,
  TURN_OUTCOMES,
  shouldAnnounce,
  turnOutcome,
  type Announcement,
  type TurnOutcome
} from '../src/shared/announce'
import { announceTurn, isLooking, type AnnouncePorts } from '../src/main/turn-announce'
import type { EngineEvent } from '../src/shared/engine-types'

// #75. Two halves, and they prove different things:
//   - the DECISION (the six-case table) is pure and pinned without a window;
//   - the WIRING consults it and acts on the answer, pinned by call COUNT and
//     ARGUMENTS. "A function was reached" is the failure mode this repo has hit
//     repeatedly, so neither half asserts merely that something happened.
// Whether Windows renders the toast is the driver's question (gui-75.mjs).

const SILENT: Announcement = { notify: false, flash: false }
const ANNOUNCED: Announcement = { notify: true, flash: true }

const TABLE: ReadonlyArray<{ outcome: TurnOutcome; focused: boolean; expected: Announcement }> = [
  // The answer is ready and nobody is looking — the whole feature.
  { outcome: 'turn-end', focused: false, expected: ANNOUNCED },
  { outcome: 'turn-end', focused: true, expected: SILENT },
  // A failed turn is MORE urgent to know about, not less.
  { outcome: 'error', focused: false, expected: ANNOUNCED },
  { outcome: 'error', focused: true, expected: SILENT },
  // Stop was just pressed. Silence here is a required behaviour, not a gap.
  { outcome: 'turn-aborted', focused: false, expected: SILENT },
  { outcome: 'turn-aborted', focused: true, expected: SILENT }
]

// Typed through the implementations rather than annotated: a bare `vi.fn()`
// carries no call signature, so the spy would satisfy AnnouncePorts by accident
// and `toHaveBeenCalledWith` would stop type-checking its argument.
const makePorts = (focused: boolean) =>
  ({
    isFocused: vi.fn(() => focused),
    notify: vi.fn((_copy: { title: string; body: string }) => {}),
    flash: vi.fn(() => {})
  }) satisfies AnnouncePorts

const eventFor = (outcome: TurnOutcome): EngineEvent =>
  outcome === 'error' ? { type: 'error', message: 'boom' } : { type: outcome }

describe('shouldAnnounce', () => {
  for (const { outcome, focused, expected } of TABLE) {
    it(`${outcome} while ${focused ? 'focused' : 'unfocused'} → notify ${expected.notify}, flash ${expected.flash}`, () => {
      expect(shouldAnnounce({ outcome, focused })).toEqual(expected)
    })
  }

  // Structural, not decorative: adding a fourth outcome without deciding what it
  // does to a user who is not looking reddens here rather than shipping silent.
  it('the table covers every outcome, focused and unfocused', () => {
    expect(TABLE).toHaveLength(TURN_OUTCOMES.length * 2)
    for (const outcome of TURN_OUTCOMES) {
      expect(TABLE.filter((row) => row.outcome === outcome).map((row) => row.focused).sort()).toEqual(
        [false, true]
      )
    }
  })
})

describe('isLooking', () => {
  // Measured on Electron 43 / Windows 11, not assumed: a MINIMISED window
  // reports isFocused() === true (and win.blur() does not move it at all). The
  // one-liner the ticket suggested is therefore silent for the plainest form of
  // "I walked away", which is the case the whole feature exists for.
  const cases: ReadonlyArray<{ focused: boolean; minimized: boolean; looking: boolean }> = [
    { focused: true, minimized: false, looking: true },
    { focused: true, minimized: true, looking: false },
    { focused: false, minimized: false, looking: false },
    { focused: false, minimized: true, looking: false }
  ]

  for (const { focused, minimized, looking } of cases) {
    it(`focused ${focused} + minimized ${minimized} → ${looking ? 'looking' : 'not looking'}`, () => {
      expect(isLooking({ isFocused: () => focused, isMinimized: () => minimized })).toBe(looking)
    })
  }
})

describe('turnOutcome', () => {
  it('narrows the three terminal events and nothing else', () => {
    expect(turnOutcome({ type: 'turn-end' })).toBe('turn-end')
    expect(turnOutcome({ type: 'turn-aborted' })).toBe('turn-aborted')
    expect(turnOutcome({ type: 'error', message: 'boom' })).toBe('error')
    expect(turnOutcome({ type: 'text-delta', text: 'hi' })).toBeNull()
    expect(turnOutcome({ type: 'tool-use', id: '1', name: 'Read', input: {} })).toBeNull()
    expect(turnOutcome({ type: 'notice', text: 'x' })).toBeNull()
  })
})

describe('announceTurn', () => {
  for (const { outcome, focused, expected } of TABLE) {
    it(`${outcome} while ${focused ? 'focused' : 'unfocused'} → ${
      expected.notify ? 'one notification and one flash' : 'nothing'
    }`, () => {
      const ports = makePorts(focused)

      announceTurn(ports, eventFor(outcome))

      // Focus is consulted exactly once per terminal event, and it is consulted
      // AT THE END — the port is called here, not held from turn start.
      expect(ports.isFocused).toHaveBeenCalledTimes(1)
      expect(ports.notify).toHaveBeenCalledTimes(expected.notify ? 1 : 0)
      expect(ports.flash).toHaveBeenCalledTimes(expected.flash ? 1 : 0)
      if (expected.notify) {
        expect(ports.notify).toHaveBeenCalledWith(
          ANNOUNCE_COPY[outcome as Exclude<TurnOutcome, 'turn-aborted'>]
        )
      }
    })
  }

  it('passes the outcome its own copy, never the other outcome\'s', () => {
    const ended = makePorts(false)
    const failed = makePorts(false)

    announceTurn(ended, { type: 'turn-end' })
    announceTurn(failed, { type: 'error', message: 'boom' })

    expect(ended.notify).toHaveBeenCalledWith({
      title: 'Turn finished',
      body: 'Claude has finished responding.'
    })
    expect(failed.notify).toHaveBeenCalledWith({
      title: 'Turn failed',
      body: 'The turn ended with an error.'
    })
  })

  it('leaves every port untouched for mid-turn events', () => {
    const ports = makePorts(false)
    const midTurn: EngineEvent[] = [
      { type: 'text-delta', text: 'thinking' },
      { type: 'tool-use', id: '1', name: 'Read', input: { file: 'a.ts' } },
      { type: 'tool-result', id: '1', text: 'ok', isError: false },
      { type: 'permission-request', id: '2', name: 'Write', input: {} },
      { type: 'command-output', text: '/context' },
      { type: 'notice', text: 'Unknown command' }
    ]

    for (const e of midTurn) announceTurn(ports, e)

    // isFocused included on purpose: a guard placed after the focus read would
    // hit the window once per text delta, which is a stream of them.
    expect(ports.isFocused).not.toHaveBeenCalled()
    expect(ports.notify).not.toHaveBeenCalled()
    expect(ports.flash).not.toHaveBeenCalled()
  })

  it('announces once per terminal event, so a two-turn conversation flashes twice', () => {
    const ports = makePorts(false)

    announceTurn(ports, { type: 'text-delta', text: 'a' })
    announceTurn(ports, { type: 'turn-end' })
    announceTurn(ports, { type: 'text-delta', text: 'b' })
    announceTurn(ports, { type: 'turn-end' })

    expect(ports.notify).toHaveBeenCalledTimes(2)
    expect(ports.flash).toHaveBeenCalledTimes(2)
  })
})
