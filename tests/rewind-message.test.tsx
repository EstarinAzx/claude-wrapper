// #129 — the rewind control: restore the workspace's FILES to their state at
// one user message.
//
// WHAT THIS FEATURE IS NOT, and the distinction is the whole risk of shipping
// it: it is not an undo. The route is `rewind_files`, its response is about the
// disk, and every measurement behind it watched a FILE (#127, #129). An "undo"
// built on it would undo the workspace and leave the conversation exactly where
// it was — so a user who read the control as "take back what I said" would be
// misled about both halves at once. It also does not reopen #123's decision:
// the pane is still a projection of the CLI's own transcript.
//
// The `does not claim the conversation moved` block below is what holds that,
// and it is deliberately a vocabulary assertion rather than a comment.
import { readFileSync } from 'node:fs'
import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import App from '../src/renderer/src/App'
import { fakeChatApi, FOLDER } from './chat-harness'
import type { RewindResult } from '../src/shared/engine-types'
import type { SessionMeta } from '../src/shared/session-types'

let harness: ReturnType<typeof fakeChatApi>

beforeEach(() => {
  harness = fakeChatApi()
  ;(window as Window & { api: unknown }).api = harness.api
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

const ok = (over: Partial<RewindResult> = {}): RewindResult => ({
  canRewind: true,
  filesChanged: 2,
  insertions: 7,
  deletions: 3,
  error: null,
  ...over
})

const refusal = (error: string): RewindResult => ({
  canRewind: false,
  filesChanged: 0,
  insertions: 0,
  deletions: 0,
  error
})

const startSession = async (): Promise<void> => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Pick a project folder' }))
  await screen.findByText('demo')
}

const input = (): HTMLTextAreaElement =>
  screen.getByPlaceholderText('Message Claude…') as HTMLTextAreaElement

const send = (text: string): void => {
  fireEvent.change(input(), { target: { value: text } })
  fireEvent.keyDown(input(), { key: 'Enter' })
}

const rewindButtons = (): HTMLButtonElement[] =>
  screen.queryAllByRole('button', {
    name: /restore files to before this message/i
  }) as HTMLButtonElement[]

const confirmButton = (): HTMLButtonElement | null =>
  screen.queryByRole('button', { name: /^restore files$/i }) as HTMLButtonElement | null

const cancelButton = (): HTMLButtonElement | null =>
  screen.queryByRole('button', { name: /^cancel$/i }) as HTMLButtonElement | null

const summary = (): string => document.querySelector('.bubble-rewind-summary')?.textContent ?? ''

const note = (): string => document.querySelector('.bubble-rewind-note')?.textContent ?? ''

/** Send one message and end its turn, which is the ordinary resting state. */
const sendAndSettle = async (text = 'change some files'): Promise<void> => {
  await startSession()
  send(text)
  harness.emit({ type: 'turn-end' })
  await waitFor(() => expect(rewindButtons().length + 0).toBeGreaterThanOrEqual(0))
}

describe('which messages carry the control', () => {
  test('a message this pane SENT carries it', async () => {
    await sendAndSettle()
    expect(rewindButtons()).toHaveLength(1)
    // Beside the bubble, never inside it: `.bubble`'s textContent is read
    // verbatim by tests/multiline-composer.test.tsx.
    expect(rewindButtons()[0]?.closest('.bubble')).toBeNull()
    expect(rewindButtons()[0]?.closest('.msg-user')).not.toBeNull()
  })

  test('a REPLAYED message does not — its id is not in hand', async () => {
    const meta: SessionMeta = { id: 'sess-1', title: 'My chat', lastUpdated: 1000, cwd: FOLDER }
    harness.api.listSessions.mockResolvedValue([meta])
    harness.api.loadTranscript.mockResolvedValue([{ role: 'user', text: 'from disk' }])
    await startSession()
    fireEvent.click(await screen.findByText('My chat'))
    await waitFor(() =>
      expect(document.querySelectorAll('.msg-user .bubble')).toHaveLength(1)
    )

    // NOT caution about the route: #129 measured rewind working on a resumed
    // session and, from a rebuilt query, on a message the previous query sent.
    // A replayed message simply has no uuid here to address, and offering a
    // control that could only ever be refused is worse than offering none.
    expect(rewindButtons()).toHaveLength(0)
  })

  test('an assistant message never carries it', async () => {
    await sendAndSettle()
    harness.emit({ type: 'text-delta', text: 'done' })
    await screen.findByText('done')
    expect(rewindButtons()).toHaveLength(1)
  })
})

describe('the preview comes first and the destructive call second', () => {
  test('the first gesture is a DRY RUN and moves nothing', async () => {
    harness.api.rewindFiles.mockResolvedValue(ok())
    await sendAndSettle()

    fireEvent.click(rewindButtons()[0]!)

    await waitFor(() => expect(confirmButton()).not.toBeNull())
    expect(harness.api.rewindFiles).toHaveBeenCalledTimes(1)
    // The flag itself, asserted rather than inferred from "nothing broke": a
    // build that previewed with dryRun FALSE would satisfy every visible
    // assertion here while having already rewritten the user's files.
    expect(harness.api.rewindFiles.mock.calls[0]?.[1]).toBe(true)
  })

  test('the preview names what would change', async () => {
    harness.api.rewindFiles.mockResolvedValue(ok({ filesChanged: 2, insertions: 7, deletions: 3 }))
    await sendAndSettle()

    fireEvent.click(rewindButtons()[0]!)

    await waitFor(() => expect(summary()).toContain('2 files'))
    expect(summary()).toContain('+7')
    expect(summary()).toContain('3')
  })

  test('one file reads as "1 file", not "1 files"', async () => {
    harness.api.rewindFiles.mockResolvedValue(ok({ filesChanged: 1 }))
    await sendAndSettle()

    fireEvent.click(rewindButtons()[0]!)

    await waitFor(() => expect(summary()).toContain('1 file'))
    expect(summary()).not.toContain('1 files')
  })

  test('only the SECOND gesture sends dryRun false', async () => {
    harness.api.rewindFiles.mockResolvedValue(ok())
    await sendAndSettle()

    fireEvent.click(rewindButtons()[0]!)
    await waitFor(() => expect(confirmButton()).not.toBeNull())
    fireEvent.click(confirmButton()!)

    await waitFor(() => expect(harness.api.rewindFiles).toHaveBeenCalledTimes(2))
    expect(harness.api.rewindFiles.mock.calls[1]?.[1]).toBe(false)
    // Both calls address the SAME message. A second gesture that re-derived the
    // id would be a different feature.
    expect(harness.api.rewindFiles.mock.calls[0]?.[0]).toBe(
      harness.api.rewindFiles.mock.calls[1]?.[0]
    )
  })

  test('the id sent is the one that went out with the prompt', async () => {
    harness.api.rewindFiles.mockResolvedValue(ok())
    await sendAndSettle()

    fireEvent.click(rewindButtons()[0]!)

    await waitFor(() => expect(harness.api.rewindFiles).toHaveBeenCalled())
    // The join that makes the whole feature work: the CLI stores the message
    // under the uuid the composer sent, so the control must address THAT id and
    // not one minted at click time.
    expect(harness.api.rewindFiles.mock.calls[0]?.[0]).toBe(harness.prompts[0]?.uuid)
  })

  test('cancelling returns to rest and calls nothing further', async () => {
    harness.api.rewindFiles.mockResolvedValue(ok())
    await sendAndSettle()

    fireEvent.click(rewindButtons()[0]!)
    await waitFor(() => expect(cancelButton()).not.toBeNull())
    fireEvent.click(cancelButton()!)

    await waitFor(() => expect(rewindButtons()).toHaveLength(1))
    expect(harness.api.rewindFiles).toHaveBeenCalledTimes(1)
  })

  test('a completed rewind reports what it did instead of offering again', async () => {
    harness.api.rewindFiles.mockResolvedValue(ok())
    await sendAndSettle()

    fireEvent.click(rewindButtons()[0]!)
    await waitFor(() => expect(confirmButton()).not.toBeNull())
    fireEvent.click(confirmButton()!)

    await waitFor(() => expect(note()).toMatch(/files restored/i))
    expect(confirmButton()).toBeNull()
    expect(rewindButtons()).toHaveLength(0)
  })
})

describe('refusals surface the CLI, not a phrase this app invented', () => {
  test('checkpointing off shows the CLI\'s own sentence', async () => {
    // The harness's default. Verbatim on purpose — a rewrite here would hide
    // which of several refusal causes actually fired.
    await sendAndSettle()

    fireEvent.click(rewindButtons()[0]!)

    await waitFor(() => expect(note()).toBe('File rewinding is not enabled.'))
    expect(confirmButton()).toBeNull()
  })

  test('a refusal with no text still says something', async () => {
    harness.api.rewindFiles.mockResolvedValue(refusal(null as unknown as string))
    await sendAndSettle()

    fireEvent.click(rewindButtons()[0]!)

    await waitFor(() => expect(note().length).toBeGreaterThan(0))
  })

  test('a dead channel is reported, not swallowed', async () => {
    // `rewindFiles` resolves on every path by contract, so a rejection here is
    // the IPC channel dying. Swallowing it would leave the control claiming
    // nothing happened, which it does not know.
    harness.api.rewindFiles.mockRejectedValue(new Error('channel closed'))
    await sendAndSettle()

    fireEvent.click(rewindButtons()[0]!)

    await waitFor(() => expect(note().length).toBeGreaterThan(0))
    expect(confirmButton()).toBeNull()
  })
})

describe('a turn in flight', () => {
  test('the control is inert while the engine is streaming', async () => {
    harness.api.rewindFiles.mockResolvedValue(ok())
    await startSession()
    send('change some files')
    // No turn-end: the turn is live, and its tool calls are editing the very
    // files a rewind would pull out from under them.
    await waitFor(() => expect(rewindButtons()).toHaveLength(1))

    expect(rewindButtons()[0]?.disabled).toBe(true)
    fireEvent.click(rewindButtons()[0]!)
    expect(harness.api.rewindFiles).not.toHaveBeenCalled()
  })
})

describe('the control does not claim the conversation moved', () => {
  test('its vocabulary is about files, and "undo" appears nowhere', async () => {
    harness.api.rewindFiles.mockResolvedValue(ok())
    await sendAndSettle()

    const label = `${rewindButtons()[0]?.getAttribute('aria-label') ?? ''} ${
      rewindButtons()[0]?.getAttribute('title') ?? ''
    }`
    expect(label.toLowerCase()).toContain('file')
    // The words a user would read as "take back what I said". Rewind restores
    // the DISK; the transcript is untouched, and #123's refill decision stands.
    for (const forbidden of ['undo', 'unsend', 'delete this message', 'revert the conversation']) {
      expect(label.toLowerCase()).not.toContain(forbidden)
    }

    fireEvent.click(rewindButtons()[0]!)
    await waitFor(() => expect(confirmButton()).not.toBeNull())
    expect(confirmButton()?.textContent?.toLowerCase()).toContain('file')
    expect(confirmButton()?.textContent?.toLowerCase()).not.toContain('undo')
  })

  test('the message itself is untouched by a completed rewind', async () => {
    harness.api.rewindFiles.mockResolvedValue(ok())
    await sendAndSettle('change some files')

    fireEvent.click(rewindButtons()[0]!)
    await waitFor(() => expect(confirmButton()).not.toBeNull())
    fireEvent.click(confirmButton()!)
    await waitFor(() => expect(note()).toMatch(/files restored/i))

    // Still in the pane, still saying what it said. Rewinding FILES must not
    // look like the conversation was edited.
    const bubbles = [...document.querySelectorAll('.msg-user .bubble')]
    expect(bubbles).toHaveLength(1)
    expect(bubbles[0]?.textContent).toBe('change some files')
  })
})

describe('the stylesheet', () => {
  test('the rewind control lives in chat.css beside the reuse one', () => {
    const css = readFileSync('src/renderer/src/styles/chat.css', 'utf8')
    // jsdom loads no CSS, so this proves the rule was WRITTEN, never that it
    // works — the standing limit on every raw-text pin in this suite.
    expect(css).toContain('.bubble-rewind')
    // Hidden at rest like `.bubble-reuse`, revealed by hover AND focus: a
    // control that is invisible but tabbable is worse than none at all (#123).
    expect(css).toMatch(/\.msg-user:focus-within \.bubble-rewind/)
  })
})

// Guards the two spikes this build rests on, so a future reader can tell
// measured facts from remembered ones without re-running anything.
describe('the measurement this build was shaped by', () => {
  test('#129 recorded the declared method, the resume and the cross-query case', () => {
    const f = JSON.parse(readFileSync('scripts/spike-129-findings.json', 'utf8')) as Record<
      string,
      { verdict?: string }
    >
    expect(f['phaseA_freshSession_declaredMethod']?.verdict).toMatch(/EFFECTIVE/)
    expect(f['phaseB_resumedSession']?.verdict).toMatch(/EFFECTIVE/)
    expect(f['phaseC_crossQueryRewind']?.verdict).toMatch(/^YES/)
  })
})
