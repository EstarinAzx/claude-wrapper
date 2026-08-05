import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react'
import App from '../src/renderer/src/App'
import { fakeChatApi } from './chat-harness'

// #118 — `@` file references in the composer. TYPING ASSISTANCE ONLY.
//
// The sharpest pin here is the LAST describe block: what reaches `chat:send`
// must be byte-identical to what the user typed. #116 measured that `@path` in
// ordinary prompt text is already resolved by the CLI through this app's exact
// `query()` options shape, so a "helpful" renderer-side expansion would replace
// a working CLI behaviour with a worse one — and no rendering assertion would
// ever see it.

let harness: ReturnType<typeof fakeChatApi>

const FILES = [
  'README.md',
  'src/main/index.ts',
  'src/renderer/src/components/InputBar.tsx',
  'tests/index.test.ts'
]

beforeEach(() => {
  harness = fakeChatApi()
  harness.api.listWorkspaceFiles.mockResolvedValue(FILES)
  ;(window as Window & { api: unknown }).api = harness.api
})

afterEach(() => {
  cleanup()
})

const startSession = async () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Pick a project folder' }))
  await screen.findByText('demo')
}

const input = (): HTMLTextAreaElement =>
  screen.getByPlaceholderText('Message Claude…') as HTMLTextAreaElement

// Types a value and puts the caret where a real user's would be — at the end,
// unless a caret is given. The caret is what decides the trigger window, so a
// helper that ignored it would test a different component.
const type = async (v: string, caret = v.length) => {
  const el = input()
  fireEvent.change(el, { target: { value: v } })
  el.setSelectionRange(caret, caret)
  fireEvent.select(el)
  await act(async () => {})
}

const filePopover = () => screen.queryByRole('listbox', { name: 'File suggestions' })
const cmdPopover = () => screen.queryByRole('listbox', { name: 'Command suggestions' })
const options = () => screen.queryAllByRole('option')
const optionNames = () => options().map((o) => o.textContent ?? '')

describe('the @ popover opens where / cannot (#118)', () => {
  test('typing @ in an empty composer opens the file list', async () => {
    await startSession()
    await type('@')
    expect(filePopover()).toBeTruthy()
    expect(options().length).toBe(FILES.length)
  })

  test('it fires MID-STRING — the whole difference from the / popover', async () => {
    await startSession()
    await type('please read @READ')
    expect(filePopover()).toBeTruthy()
    expect(optionNames().join()).toContain('README.md')
  })

  test('typing narrows the list', async () => {
    await startSession()
    await type('@InputBar')
    expect(optionNames().join()).toContain('InputBar.tsx')
    expect(optionNames().join()).not.toContain('README.md')
  })

  test('whitespace closes it', async () => {
    await startSession()
    await type('@src ')
    expect(filePopover()).toBeNull()
  })

  test('an email address does not open it', async () => {
    await startSession()
    await type('mail me at someone@example')
    expect(filePopover()).toBeNull()
  })

  test('no workspace files means no popover, not an empty one', async () => {
    harness.api.listWorkspaceFiles.mockResolvedValue([])
    await startSession()
    await type('@')
    expect(filePopover()).toBeNull()
  })

  test('the list is fetched once per window, not per keystroke', async () => {
    await startSession()
    harness.api.listWorkspaceFiles.mockClear()
    await type('@')
    await type('@s')
    await type('@sr')
    await type('@src')
    // The list is query-independent — main returns everything that survives its
    // boundary and the renderer ranks it — so a per-keystroke fetch would be
    // pure waste. This differs from `/` deliberately; see the comment on the
    // effect in InputBar.
    expect(harness.api.listWorkspaceFiles).toHaveBeenCalledTimes(1)
  })
})

describe('accepting inserts at the cursor and replaces only the token', () => {
  test('Enter accepts the highlighted row', async () => {
    await startSession()
    await type('@READ')
    fireEvent.keyDown(input(), { key: 'Enter' })
    await act(async () => {})
    expect(input().value).toBe('@README.md ')
  })

  test('prose after the caret survives the accept', async () => {
    await startSession()
    // Caret sits right after "@READ", with prose still to its right.
    await type('look at @READ and tell me', 13)
    fireEvent.keyDown(input(), { key: 'Enter' })
    await act(async () => {})
    expect(input().value).toBe('look at @README.md  and tell me')
  })

  test('Tab accepts too', async () => {
    await startSession()
    await type('@README')
    fireEvent.keyDown(input(), { key: 'Tab' })
    await act(async () => {})
    expect(input().value).toBe('@README.md ')
  })

  test('clicking a row accepts it', async () => {
    await startSession()
    await type('@InputBar')
    fireEvent.click(options()[0])
    await act(async () => {})
    expect(input().value).toBe('@src/renderer/src/components/InputBar.tsx ')
  })

  test('the accept closes the popover rather than reopening on the new path', async () => {
    await startSession()
    await type('@READ')
    fireEvent.keyDown(input(), { key: 'Enter' })
    await act(async () => {})
    expect(filePopover()).toBeNull()
  })

  test('Escape dismisses without inserting', async () => {
    await startSession()
    await type('@READ')
    fireEvent.keyDown(input(), { key: 'Escape' })
    await act(async () => {})
    expect(filePopover()).toBeNull()
    expect(input().value).toBe('@READ')
  })

  test('arrow keys move the highlight', async () => {
    await startSession()
    await type('@')
    fireEvent.keyDown(input(), { key: 'ArrowDown' })
    await act(async () => {})
    const selected = options().findIndex((o) => o.getAttribute('aria-selected') === 'true')
    expect(selected).toBe(1)
  })
})

describe('the / popover is untouched (#40s pin, both popovers in one composer)', () => {
  beforeEach(() => {
    harness.api.listCommands.mockResolvedValue([
      { name: 'context', description: 'Show context usage', argumentHint: '' }
    ])
  })

  test('/ still opens the COMMAND popover, not the file one', async () => {
    await startSession()
    await type('/co')
    expect(cmdPopover()).toBeTruthy()
    expect(filePopover()).toBeNull()
  })

  test('a value starting with / never opens the file popover', async () => {
    await startSession()
    await type('/@src')
    expect(filePopover()).toBeNull()
  })

  test('plain Enter with no popover open still sends', async () => {
    await startSession()
    await type('ordinary message')
    fireEvent.keyDown(input(), { key: 'Enter' })
    await act(async () => {})
    expect(harness.prompts.map((p) => p.text)).toEqual(['ordinary message'])
  })
})

describe('THE DUMB-PIPE PIN — sent text is byte-identical to what was typed', () => {
  // #116 measured the send path as already working: `@path` in ordinary prompt
  // text is resolved by the CLI. This build adds typing assistance and MUST NOT
  // touch what is sent. Every other test here is about rendering; only this one
  // can catch a renderer-side expansion.
  test('an accepted reference is sent exactly as it appears in the composer', async () => {
    await startSession()
    await type('read @READ')
    fireEvent.keyDown(input(), { key: 'Enter' })
    await act(async () => {})
    const composed = input().value
    expect(composed).toBe('read @README.md ')

    fireEvent.keyDown(input(), { key: 'Enter' })
    await act(async () => {})

    expect(harness.prompts.length).toBe(1)
    // The ONE normalization in play is `useChat.send`'s `raw.trim()`
    // (useChat.ts:407) — pre-existing, applied to every prompt this app has
    // ever sent, and applied to `/`'s accept for the same reason (it appends a
    // trailing space too). #118 adds nothing to it, which is what this
    // comparison states: composer value in, same string out, edges trimmed.
    expect(harness.prompts[0].text).toBe(composed.trim())
    // And byte-for-byte on the part that matters: no path rewriting, no
    // absolute path, no expansion of the reference into file contents.
    expect(harness.prompts[0].text).toBe('read @README.md')
    expect(harness.prompts[0].text).toContain('@README.md')
  })

  test('interior spacing around a reference is preserved, so only the edges move', async () => {
    // Guards the claim above: if something were rewriting the text rather than
    // trimming it, the double space this accept leaves mid-sentence is where it
    // would show.
    await startSession()
    await type('look at @READ and stop', 13)
    fireEvent.keyDown(input(), { key: 'Enter' })
    await act(async () => {})
    expect(input().value).toBe('look at @README.md  and stop')
    fireEvent.keyDown(input(), { key: 'Enter' })
    await act(async () => {})
    expect(harness.prompts[0].text).toBe('look at @README.md  and stop')
  })

  test('a hand-typed @path nobody accepted is sent untouched', async () => {
    await startSession()
    // Never in the suggestion list, and deliberately not a real file: the
    // wrapper does not validate, it lets the CLI own resolution (A8).
    await type('check @does/not/exist.ts please')
    fireEvent.keyDown(input(), { key: 'Enter' })
    await act(async () => {})
    expect(harness.prompts[0].text).toBe('check @does/not/exist.ts please')
  })

  test('no attachment is created — an @ reference is a separate surface (owner call 4)', async () => {
    await startSession()
    await type('@README')
    fireEvent.keyDown(input(), { key: 'Enter' })
    await act(async () => {})
    fireEvent.keyDown(input(), { key: 'Enter' })
    await act(async () => {})
    // It travels as TEXT. #116 measured that the CLI resolves it from the
    // prompt, so it never becomes an attachment and never spends a slot from
    // the 10-slot budget A7b governs.
    expect(harness.prompts[0].attachments).toEqual([])
    expect(screen.queryByLabelText('Attachments')).toBeNull()
  })
})
