import { readFileSync } from 'node:fs'
import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import App from '../src/renderer/src/App'
import Chat from '../src/renderer/src/components/Chat'
import type { ChatMessage } from '../src/renderer/src/useChat'
import { fakeChatApi, FOLDER } from './chat-harness'
import type { SessionMeta } from '../src/shared/session-types'

// #123 — reuse a past user message.
//
// WHAT THIS FEATURE IS NOT, because the obvious reading of the request is
// impossible rather than merely awkward: it is not an edit. `useChat.ts` does
// `setMessages(transcript.map(toChatMessage))` on adopt AND on every live-tail
// reload, so the renderer's list is a PROJECTION of the disk transcript, which
// the CLI owns. A renderer-side edit to an already-sent message is erased by
// the next reload, and the superseded turn stays in the conversation either
// way. So the control refills the composer and the transcript is never touched
// — which is exactly what the "never mutated" block below exists to hold.

let harness: ReturnType<typeof fakeChatApi>

beforeEach(() => {
  harness = fakeChatApi()
  ;(window as Window & { api: unknown }).api = harness.api
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

const meta = (id: string, title: string): SessionMeta => ({
  id,
  title,
  lastUpdated: 1000,
  cwd: FOLDER
})

const startSession = async (): Promise<void> => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Pick a project folder' }))
  await screen.findByText('demo')
}

const input = (): HTMLTextAreaElement =>
  screen.getByPlaceholderText('Message Claude…') as HTMLTextAreaElement

const type = (text: string): void => {
  fireEvent.change(input(), { target: { value: text } })
}

const enter = (): void => {
  fireEvent.keyDown(input(), { key: 'Enter' })
}

const send = (text: string): void => {
  type(text)
  enter()
}

const reuseButtons = (): HTMLButtonElement[] =>
  screen.queryAllByRole('button', { name: /reuse this message/i }) as HTMLButtonElement[]

const bubbles = (): Element[] => [...document.querySelectorAll('.msg-user .bubble')]

const note = (): HTMLElement | null => document.querySelector('.queued-note')

// Open a stored session whose transcript already holds a user turn — the case
// the feature exists for, since a message worth resending is usually one from
// before this app was opened.
const openWithHistory = async (
  transcript: Array<Record<string, unknown>> = [{ role: 'user', text: 'first line' }]
): Promise<void> => {
  harness.api.listSessions.mockResolvedValue([meta('sess-1', 'My chat')])
  harness.api.loadTranscript.mockResolvedValue(transcript)
  await startSession()
  fireEvent.click(await screen.findByText('My chat'))
  // Waits on the BUBBLE COUNT rather than on any text. `findByText` normalises
  // whitespace, so a deliberately multiline fixture is unfindable by its own
  // words — and waiting on the control instead would make a broken feature time
  // out here rather than fail its own assertion.
  const users = transcript.filter((m) => m.role === 'user').length
  await waitFor(() => expect(bubbles()).toHaveLength(users))
}

describe('a past user message can be put back into the composer', () => {
  test('a user message carries the control and an assistant one does not', async () => {
    await openWithHistory([
      { role: 'user', text: 'first line' },
      { role: 'assistant', text: 'an answer' }
    ])

    expect(reuseButtons()).toHaveLength(1)
    // It sits beside the bubble rather than inside it: `.bubble`'s textContent
    // is read verbatim by tests/multiline-composer.test.tsx, and a control
    // nested in it would put its own accessible text on that path.
    expect(reuseButtons()[0]?.closest('.bubble')).toBeNull()
    expect(reuseButtons()[0]?.closest('.msg-user')).not.toBeNull()
  })

  test('clicking it refills the composer with that message, verbatim', async () => {
    await openWithHistory([{ role: 'user', text: 'line one\nline two' }])

    fireEvent.click(reuseButtons()[0]!)

    expect(input().value).toBe('line one\nline two')
  })

  test('the refilled text can be edited and sent as a NEW turn', async () => {
    await openWithHistory()

    fireEvent.click(reuseButtons()[0]!)
    type('first line, edited')
    enter()

    expect(harness.prompts).toHaveLength(1)
    expect(harness.prompts[0]?.text).toBe('first line, edited')
  })

  test('with several user messages, the clicked one is the one that refills', async () => {
    await openWithHistory([
      { role: 'user', text: 'first line' },
      { role: 'assistant', text: 'an answer' },
      { role: 'user', text: 'second question' }
    ])

    expect(reuseButtons()).toHaveLength(2)
    fireEvent.click(reuseButtons()[1]!)

    expect(input().value).toBe('second question')
  })

  // The nonce on the insert is what makes this true. Refilling, clearing by
  // hand, then refilling the same message again has to work — an unchanged
  // prop would not re-fire the effect.
  test('the same message can be reused twice', async () => {
    await openWithHistory()

    fireEvent.click(reuseButtons()[0]!)
    type('')
    expect(input().value).toBe('')
    fireEvent.click(reuseButtons()[0]!)

    expect(input().value).toBe('first line')
  })

  test('it is a real button, so it is keyboard reachable', async () => {
    await openWithHistory()

    const btn = reuseButtons()[0]!
    expect(btn.tagName).toBe('BUTTON')
    expect(btn.getAttribute('type')).toBe('button')
    expect(btn.hasAttribute('disabled')).toBe(false)
    // Removed from the tab order would satisfy "it is a button" and fail the
    // requirement, so the absence is asserted rather than assumed.
    expect(btn.getAttribute('tabindex')).toBeNull()
  })
})

describe('the transcript is never mutated', () => {
  test('a refill leaves the pane exactly as it was', async () => {
    await openWithHistory()
    const before = bubbles().map((b) => b.textContent)

    fireEvent.click(reuseButtons()[0]!)

    expect(bubbles().map((b) => b.textContent)).toEqual(before)
    expect(bubbles()).toHaveLength(1)
  })

  test('a refill sends nothing and asks main for nothing', async () => {
    await openWithHistory()
    const reads = harness.api.loadTranscript.mock.calls.length
    // Counted BEFORE the click, not asserted as zero: adopting the session
    // already pointed main at it, so a bare "never called" would be false for a
    // reason that has nothing to do with the control.
    const targeted = harness.api.targetSession.mock.calls.length

    fireEvent.click(reuseButtons()[0]!)

    expect(harness.prompts).toEqual([])
    // No write path exists in the renderer for a stored transcript, and this is
    // the assertion that keeps it that way: the click must not reach main at
    // all, by any of the session calls.
    expect(harness.api.loadTranscript.mock.calls.length).toBe(reads)
    expect(harness.api.targetSession.mock.calls.length).toBe(targeted)
    expect(harness.api.deleteSession).not.toHaveBeenCalled()
  })

  test('sending the edited text ADDS a turn — the original survives beside it', async () => {
    await openWithHistory()

    fireEvent.click(reuseButtons()[0]!)
    type('first line, edited')
    enter()

    const texts = bubbles().map((b) => b.textContent)
    expect(texts).toHaveLength(2)
    expect(texts[0]).toBe('first line')
    expect(texts[1]).toBe('first line, edited')
  })
})

describe('a refill and the live tail', () => {
  // The reload replaces the whole `messages` array from disk. The draft lives
  // in the composer, which that reload never touches — asserted rather than
  // reasoned, because the two are one component tree apart.
  test('a reload after a refill keeps the draft and duplicates nothing', async () => {
    await openWithHistory()
    fireEvent.click(reuseButtons()[0]!)
    expect(input().value).toBe('first line')

    harness.api.loadTranscript.mockResolvedValue([
      { role: 'user', text: 'first line' },
      { role: 'assistant', text: 'appended by the terminal' }
    ])
    harness.emitSessionChanged('sess-1')
    expect(await screen.findByText('appended by the terminal')).toBeTruthy()

    expect(input().value).toBe('first line')
    expect(bubbles()).toHaveLength(1)
    expect(reuseButtons()).toHaveLength(1)
  })
})

describe('a refill against the queued-send commitment (#80)', () => {
  // The commitment is a FLAG on the draft, not a copy of it, so a refill can
  // only ever replace what is in the box — never create a second draft and
  // never commit a second time. That is a property of the existing design; this
  // is the pin that says so out loud, because a future refill that snapshotted
  // the text would break it silently.
  test('refilling behind a queued prompt replaces the draft and still fires once', async () => {
    await openWithHistory()
    send('a turn that is now running')
    expect(harness.prompts).toHaveLength(1)
    type('queued by hand')
    enter()
    expect(note()).not.toBeNull()

    fireEvent.click(reuseButtons()[0]!)
    expect(input().value).toBe('first line')
    // One commitment, not two: the note is the whole evidence of the flag.
    expect(document.querySelectorAll('.queued-note')).toHaveLength(1)

    harness.emit({ type: 'turn-end' })

    expect(harness.prompts).toHaveLength(2)
    expect(harness.prompts[1]?.text).toBe('first line')
    expect(input().value).toBe('')
  })

  test('refilling during a turn with nothing queued commits nothing', async () => {
    await openWithHistory()
    send('a turn that is now running')

    fireEvent.click(reuseButtons()[0]!)

    expect(note()).toBeNull()
    expect(input().value).toBe('first line')

    harness.emit({ type: 'turn-end' })

    // Nothing was committed, so nothing fires — and the refilled text is still
    // sitting in the box, which is the positive half of that absence.
    expect(harness.prompts).toHaveLength(1)
    expect(input().value).toBe('first line')
  })
})

describe('attachments are NOT restored — text only, and stated', () => {
  // DECIDED: refill carries text alone. A reopened session replays attachment
  // MARKERS and not bytes (`toChatMessage` drops the payload on purpose), so
  // the messages most worth resending are exactly the ones whose attachments
  // cannot be rebuilt. Restoring them only for a live-session message would
  // make the control's behaviour depend on state the user cannot see; carrying
  // a marker into the tray would put a chip there with no bytes behind it and
  // send a prompt that silently lost its images. Text only is uniform.
  test('a message with attachment markers refills its words and no chips', async () => {
    await openWithHistory([
      {
        role: 'user',
        text: 'what is in this picture',
        attachments: [{ kind: 'image', mediaType: 'image/png', name: 'shot.png' }]
      }
    ])
    expect(screen.getByText('shot.png')).toBeTruthy()

    fireEvent.click(reuseButtons()[0]!)

    expect(input().value).toBe('what is in this picture')
    expect(screen.queryByLabelText('Attachments')).toBeNull()
  })

  test('the refilled prompt goes out with no attachments', async () => {
    await openWithHistory([
      {
        role: 'user',
        text: 'what is in this picture',
        attachments: [{ kind: 'image', mediaType: 'image/png', name: 'shot.png' }]
      }
    ])

    fireEvent.click(reuseButtons()[0]!)
    enter()

    await waitFor(() => expect(harness.prompts).toHaveLength(1))
    expect(harness.prompts[0]?.text).toBe('what is in this picture')
    expect(harness.prompts[0]?.attachments ?? []).toEqual([])
  })
})

describe('the control is only offered where something can consume it', () => {
  // The subagent viewer renders the same `Chat` (`SubagentDrawer.tsx`), against
  // a transcript that belongs to an agent rather than to the composer's
  // conversation. It passes no handler, so no control may appear — a button
  // there would refill the main composer from another agent's history.
  test('a Chat with no reuse handler renders no control', () => {
    const messages: ChatMessage[] = [{ id: 'm1', role: 'user', text: 'agent prompt' }]
    render(<Chat messages={messages} busy={false} />)

    expect(bubbles()).toHaveLength(1)
    expect(reuseButtons()).toEqual([])
  })
})

// jsdom loads no CSS, so everything above proves at best that a rule was
// WRITTEN. These read the stylesheet as text — the guard theme.test.ts
// documents — with comments stripped first so prose about a selector is not
// counted as one.
const CHAT_CSS = 'src/renderer/src/styles/chat.css'
const css = readFileSync(CHAT_CSS, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')

const ruleBody = (selector: string): string => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|[,\\n])\\s*${escaped}\\s*(,[^{]*)?\\{([^}]*)\\}`, 'm').exec(css)?.[3] ?? ''
}

describe('the stylesheet dresses the control', () => {
  test('it is at rest until its own row is hovered or focused', () => {
    expect(ruleBody('.bubble-reuse')).toMatch(/opacity:\s*0/)
    const revealed = ruleBody('.msg-user:hover .bubble-reuse')
    expect(revealed).toMatch(/opacity:\s*1/)
    // Keyboard reach is the half a hover rule alone cannot deliver: tabbing to
    // an invisible control is worse than not having one.
    expect(css).toMatch(/\.msg-user:focus-within \.bubble-reuse/)
  })

  // The focus decision (#93): a control that paints a fill in any state takes
  // the hairline ALONE. This one washes on hover, so a focus wash would be
  // indistinguishable from being hovered.
  test('the focus ring is the hairline alone, with no wash', () => {
    const focus = ruleBody('.bubble-reuse:focus-visible')
    expect(focus).toMatch(/box-shadow:\s*inset 0 0 0 1px var\(--tint-6\)/)
    expect(focus).toMatch(/outline:\s*none/)
    expect(focus).not.toMatch(/background/)
  })

  test('it adds no scrollbar rule of its own', () => {
    expect(css).not.toMatch(/-webkit-scrollbar/)
  })

  // `.bubble` is sliced from its selector to the next `}` by
  // tests/multiline-composer.test.tsx, which matches on the literal `.bubble {`.
  // A grouped selector, or a rule written as `.bubble-reuse{`, would move that
  // slice onto the wrong block.
  test('the bubble rule is still ungrouped and still the first .bubble match', () => {
    const at = css.indexOf('.bubble {')
    expect(at).toBeGreaterThan(-1)
    expect(css.slice(at, css.indexOf('}', at))).toMatch(/white-space:\s*pre-wrap/)
  })
})
