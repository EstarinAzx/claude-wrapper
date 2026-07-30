import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, renderHook } from '@testing-library/react'
import App from '../src/renderer/src/App'
import { useChat, toChatMessage } from '../src/renderer/src/useChat'
import { fakeChatApi, FOLDER } from './chat-harness'

let harness: ReturnType<typeof fakeChatApi>

beforeEach(() => {
  harness = fakeChatApi()
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

const input = (): HTMLInputElement =>
  screen.getByPlaceholderText('Message Claude…') as HTMLInputElement

const send = (text: string) => {
  fireEvent.change(input(), { target: { value: text } })
  fireEvent.keyDown(input(), { key: 'Enter' })
}

describe('tool cards', () => {
  test('tool-use renders a card with tool name and key input', async () => {
    await startSession()
    send('list files')
    harness.emit({ type: 'tool-use', id: 'tu-1', name: 'Bash', input: { command: 'npm test' } })
    const card = document.querySelector('.tool-card')
    expect(card).toBeTruthy()
    expect(card?.textContent).toContain('Bash')
    expect(card?.textContent).toContain('npm test')
  })

  test('tool-result fills the card with a one-line summary', async () => {
    await startSession()
    send('run it')
    harness.emit({ type: 'tool-use', id: 'tu-1', name: 'Bash', input: { command: 'npm test' } })
    harness.emit({
      type: 'tool-result',
      id: 'tu-1',
      text: '27 passed\nDuration 1.2s',
      isError: false
    })
    const card = document.querySelector('.tool-card')
    expect(card?.textContent).toContain('27 passed')
    expect(card?.textContent).not.toContain('Duration 1.2s')
  })

  test('multiple tool calls render as separate cards in order', async () => {
    await startSession()
    send('do two things')
    harness.emit({ type: 'tool-use', id: 'tu-1', name: 'Read', input: { file_path: 'src/a.ts' } })
    harness.emit({ type: 'tool-use', id: 'tu-2', name: 'Grep', input: { pattern: 'foo' } })
    const cards = document.querySelectorAll('.tool-card')
    expect(cards.length).toBe(2)
    expect(cards[0].textContent).toContain('Read')
    expect(cards[0].textContent).toContain('src/a.ts')
    expect(cards[1].textContent).toContain('Grep')
    expect(cards[1].textContent).toContain('foo')
  })

  test('an errored result marks the card', async () => {
    await startSession()
    send('break')
    harness.emit({ type: 'tool-use', id: 'tu-1', name: 'Bash', input: { command: 'boom' } })
    harness.emit({ type: 'tool-result', id: 'tu-1', text: 'exit 1', isError: true })
    expect(document.querySelector('.tool-card-error')).toBeTruthy()
    const status = screen.getByRole('status')
    expect(status.textContent).toContain('Failed')
    expect(status.textContent).toContain('exit 1')
  })

  test('text after a tool card streams into a new bubble below the card', async () => {
    await startSession()
    send('explain then act')
    harness.emit({ type: 'text-delta', text: 'Looking first.' })
    harness.emit({ type: 'tool-use', id: 'tu-1', name: 'Read', input: { file_path: 'a.ts' } })
    harness.emit({ type: 'text-delta', text: 'Done reading.' })
    harness.emit({ type: 'turn-end' })
    const before = screen.getByText('Looking first.')
    const card = document.querySelector('.tool-card') as Element
    const after = screen.getByText('Done reading.')
    expect(before.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(card.compareDocumentPosition(after) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  test('typing indicator shows while a tool runs, hides once text streams', async () => {
    await startSession()
    send('work')
    harness.emit({ type: 'tool-use', id: 'tu-1', name: 'Bash', input: { command: 'ls' } })
    expect(screen.getByLabelText('Typing')).toBeTruthy()
    harness.emit({ type: 'text-delta', text: 'Here you go.' })
    expect(screen.queryByLabelText('Typing')).toBeNull()
  })

  test('tool-only turn ends clean: no empty assistant bubble, input re-armed', async () => {
    await startSession()
    send('silent tools')
    harness.emit({ type: 'tool-use', id: 'tu-1', name: 'Bash', input: { command: 'ls' } })
    harness.emit({ type: 'tool-result', id: 'tu-1', text: 'ok', isError: false })
    harness.emit({ type: 'turn-end' })
    expect(input().disabled).toBe(false)
    expect(screen.queryByLabelText('Typing')).toBeNull()
  })
})

// #61 — the complete result is RETAINED and the summary is derived at render.
// Asserted at state level, not through the DOM: the DOM can only ever show what
// the collapsed card chose to show, so a summarise-on-write regression would
// stay invisible to a rendering test until someone expands a card. These two
// are the named mutation target — putting `resultSummary` back on either write
// path must kill one of them.
describe('complete tool output survives in state', () => {
  test('a live tool-result keeps every line', () => {
    const { result } = renderHook(() => useChat())
    harness.emit({ type: 'tool-use', id: 'tu-1', name: 'Bash', input: { command: 'npm test' } })
    harness.emit({
      type: 'tool-result',
      id: 'tu-1',
      text: '27 passed\nDuration 1.2s',
      isError: false
    })
    const tool = result.current.messages.find((m) => m.role === 'tool')
    expect(tool).toMatchObject({ result: '27 passed\nDuration 1.2s' })
  })

  test('a replayed tool result keeps every line', () => {
    const msg = toChatMessage({
      role: 'tool',
      toolUseId: 'tu-1',
      name: 'Bash',
      input: { command: 'npm test' },
      result: '27 passed\nDuration 1.2s',
      isError: false
    })
    expect(msg).toMatchObject({ result: '27 passed\nDuration 1.2s' })
  })

  test('a still-running replayed tool stays null, not an empty string', () => {
    const msg = toChatMessage({
      role: 'tool',
      toolUseId: 'tu-1',
      name: 'Bash',
      input: {},
      result: null,
      isError: false
    })
    expect(msg).toMatchObject({ result: null })
  })
})

// #61 — disclosure. The companion half of `tool-result fills the card with a
// one-line summary` above: that test pins what a collapsed card must NOT show,
// these pin that the same content is reachable on request. The pair only holds
// because detail is conditionally MOUNTED — a CSS-hidden body or a closed
// <details> would leave the second line in textContent and turn the collapsed
// test red, correctly.
const runTool = (text: string, isError = false, id = 'tu-1'): void => {
  harness.emit({ type: 'tool-use', id, name: 'Bash', input: { command: 'npm test' } })
  harness.emit({ type: 'tool-result', id, text, isError })
}

const TOGGLE = /^(Show|Hide) (output|error)$/
const queryToggle = (): HTMLElement | null => screen.queryByRole('button', { name: TOGGLE })
const detail = (): Element | null => document.querySelector('.tool-card-output')

describe('tool output disclosure', () => {
  test('expanding the card reveals the line the collapsed card omits', async () => {
    await startSession()
    send('run it')
    runTool('27 passed\nDuration 1.2s')
    expect(document.querySelector('.tool-card')?.textContent).not.toContain('Duration 1.2s')

    fireEvent.click(screen.getByRole('button', { name: 'Show output' }))

    expect(document.querySelector('.tool-card')?.textContent).toContain('Duration 1.2s')
  })

  test('detail is mounted only while expanded, never left in the markup', async () => {
    await startSession()
    send('run it')
    runTool('27 passed\nDuration 1.2s')
    expect(detail()).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Show output' }))
    expect(detail()).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Hide output' }))
    expect(detail()).toBeNull()
  })

  test('the expanded region carries the complete result, not a summary', async () => {
    await startSession()
    send('run it')
    const text = 'first\n  second\n\nthird'
    runTool(text)
    fireEvent.click(screen.getByRole('button', { name: 'Show output' }))
    expect(detail()?.textContent).toBe(text)
  })

  test('a genuinely one-line result advertises no expansion', async () => {
    await startSession()
    send('run it')
    runTool('ok')
    expect(queryToggle()).toBeNull()
  })

  test('a first line past the cap advertises expansion even without a second line', async () => {
    await startSession()
    send('run it')
    runTool('x'.repeat(300))
    expect(queryToggle()).toBeTruthy()
  })

  test('a still-running card says so and offers no expansion', async () => {
    await startSession()
    send('run it')
    harness.emit({ type: 'tool-use', id: 'tu-1', name: 'Bash', input: { command: 'npm test' } })
    expect(screen.getByRole('status').textContent).toContain('running')
    expect(queryToggle()).toBeNull()
  })

  test('a failed tool expands to its whole error and stays marked failed', async () => {
    await startSession()
    send('break')
    const stack = 'exit 1\n  at one\n  at two'
    runTool(stack, true)
    fireEvent.click(screen.getByRole('button', { name: 'Show error' }))
    expect(detail()?.textContent).toBe(stack)
    expect(document.querySelector('.tool-card-error')).toBeTruthy()
  })

  test('expanding one card leaves the others collapsed', async () => {
    await startSession()
    send('do two things')
    runTool('first tool\nhidden one', false, 'tu-1')
    runTool('second tool\nhidden two', false, 'tu-2')

    fireEvent.click(screen.getAllByRole('button', { name: 'Show output' })[0])

    const opened = document.querySelectorAll('.tool-card-output')
    expect(opened.length).toBe(1)
    expect(opened[0].textContent).toContain('hidden one')
    expect(document.querySelectorAll('.tool-card')[1].textContent).not.toContain('hidden two')
  })

  test('the control is a real button announcing its expanded state', async () => {
    await startSession()
    send('run it')
    runTool('27 passed\nDuration 1.2s')
    const collapsed = screen.getByRole('button', { name: 'Show output' })
    expect(collapsed.tagName).toBe('BUTTON')
    expect(collapsed.getAttribute('aria-expanded')).toBe('false')

    fireEvent.click(collapsed)

    expect(
      screen.getByRole('button', { name: 'Hide output' }).getAttribute('aria-expanded')
    ).toBe('true')
  })

  test('a denied card stays denied when a result arrives afterwards', async () => {
    await startSession()
    send('rm things')
    harness.emit({ type: 'tool-use', id: 'tu-1', name: 'Bash', input: { command: 'rm -rf /' } })
    harness.emit({
      type: 'permission-request',
      id: 'tu-1',
      name: 'Bash',
      input: { command: 'rm -rf /' }
    })
    fireEvent.click(screen.getByRole('button', { name: 'Deny' }))
    harness.emit({ type: 'tool-result', id: 'tu-1', text: 'denied by user\ndetail', isError: true })

    expect(screen.getByRole('status').textContent).toContain('Denied')
    expect(queryToggle()).toBeNull()
  })

  test('a Task card keeps its subagent row while expanded', async () => {
    await startSession()
    send('delegate')
    harness.emit({ type: 'tool-use', id: 'tu-1', name: 'Task', input: { subagent_type: 'Explore' } })
    harness.emit({ type: 'subagent', parentToolUseId: 'tu-1', status: 'done', agentType: 'Explore' })
    harness.emit({ type: 'tool-result', id: 'tu-1', text: 'found it\nin three files', isError: false })

    fireEvent.click(screen.getByRole('button', { name: 'Show output' }))

    expect(document.querySelector('.subagent-row')).toBeTruthy()
    expect(detail()?.textContent).toContain('in three files')
  })

  // Parity is asserted by COMPARING the two paths and then pinning the value,
  // so "identical but both wrong" cannot pass — the same discipline as #59's
  // parser-level parity test, one layer up at the card.
  test('the same result reads identically live and replayed', async () => {
    const text = 'boom\ntrace\nand more'
    await startSession()
    send('run it')
    runTool(text)
    const liveCollapsed = document.querySelector('.tool-card-result')?.textContent
    fireEvent.click(screen.getByRole('button', { name: 'Show output' }))
    const liveExpanded = detail()?.textContent
    cleanup()

    harness = fakeChatApi()
    ;(window as Window & { api: unknown }).api = harness.api
    harness.api.listSessions.mockResolvedValue([
      { id: 'sess-1', title: 'Past chat', lastUpdated: 1000, cwd: FOLDER }
    ])
    harness.api.loadTranscript.mockResolvedValue([
      {
        role: 'tool',
        toolUseId: 'tu-1',
        name: 'Bash',
        input: { command: 'npm test' },
        result: text,
        isError: false
      }
    ])
    await startSession()
    fireEvent.click(await screen.findByText('Past chat'))
    await screen.findByRole('button', { name: 'Show output' })

    expect(document.querySelector('.tool-card-result')?.textContent).toBe(liveCollapsed)
    fireEvent.click(screen.getByRole('button', { name: 'Show output' }))
    expect(detail()?.textContent).toBe(liveExpanded)
    expect(liveExpanded).toBe(text)
  })
})

// #62 — the structured input inspector. The header shows ONE input value picked
// by priority, so an Edit reads as a filename and says nothing about the change.
// The complete input is already in the message; these pin that it is reachable.
//
// The named mutation: reducing the inspector back to rendering only `keyInput`
// must turn `expanding the card reveals every argument…` red.
const EDIT_INPUT = {
  file_path: 'src/a.ts',
  old_string: 'alpha',
  new_string: 'beta',
  replace_all: true
}

const inspector = (): Element | null => document.querySelector('.tool-card-input')
const showInput = (): HTMLElement => screen.getByRole('button', { name: 'Show input' })

describe('tool input inspection', () => {
  test('expanding the card reveals every argument, not the one the header picks', async () => {
    await startSession()
    send('edit it')
    harness.emit({ type: 'tool-use', id: 'tu-1', name: 'Edit', input: EDIT_INPUT })
    harness.emit({ type: 'tool-result', id: 'tu-1', text: 'applied', isError: false })

    fireEvent.click(showInput())

    const shown = inspector()?.textContent ?? ''
    for (const part of ['old_string', 'alpha', 'new_string', 'beta', 'replace_all', 'true']) {
      expect(shown).toContain(part)
    }
  })

  test('a nested argument is readable after expansion', async () => {
    await startSession()
    send('delegate')
    harness.emit({
      type: 'tool-use',
      id: 'tu-1',
      name: 'Task',
      input: { prompt: 'go', options: { model: 'haiku', tools: ['Read', 'Grep'] } }
    })

    fireEvent.click(showInput())

    const shown = inspector()?.textContent ?? ''
    expect(shown).toContain('haiku')
    expect(shown).toContain('Grep')
  })

  test('a collapsed card mounts no inspector at all', async () => {
    await startSession()
    send('edit it')
    harness.emit({ type: 'tool-use', id: 'tu-1', name: 'Edit', input: EDIT_INPUT })
    harness.emit({ type: 'tool-result', id: 'tu-1', text: 'applied', isError: false })

    expect(inspector()).toBeNull()
    expect(document.querySelector('.tool-card')?.textContent).not.toContain('alpha')
  })

  // The decision-critical content must not sit one click behind the decision.
  test('a pending permission card previews its input without being expanded', async () => {
    await startSession()
    send('edit it')
    harness.emit({ type: 'tool-use', id: 'tu-1', name: 'Edit', input: EDIT_INPUT })
    harness.emit({ type: 'permission-request', id: 'tu-1', name: 'Edit', input: EDIT_INPUT })

    expect(inspector()?.textContent).toContain('alpha')
    expect(screen.getByRole('button', { name: 'Allow' })).toBeTruthy()
  })

  test('the pending preview survives the permission arriving before the tool use', async () => {
    await startSession()
    send('edit it')
    harness.emit({ type: 'permission-request', id: 'tu-1', name: 'Edit', input: EDIT_INPUT })
    harness.emit({ type: 'tool-use', id: 'tu-1', name: 'Edit', input: EDIT_INPUT })

    expect(document.querySelectorAll('.tool-card').length).toBe(1)
    expect(document.querySelectorAll('.tool-card-input').length).toBe(1)
    expect(inspector()?.textContent).toContain('beta')
  })

  // One card owns the invocation for its whole life. Node identity is the
  // assertion because a remount would silently reset the disclosure state a
  // reader had already opened.
  test('one card owns the invocation from pending through failed', async () => {
    await startSession()
    send('edit it')
    harness.emit({ type: 'tool-use', id: 'tu-1', name: 'Edit', input: EDIT_INPUT })
    harness.emit({ type: 'permission-request', id: 'tu-1', name: 'Edit', input: EDIT_INPUT })
    const pendingCard = document.querySelector('.tool-card')

    fireEvent.click(screen.getByRole('button', { name: 'Allow' }))
    expect(document.querySelector('.tool-card')).toBe(pendingCard)

    harness.emit({ type: 'tool-result', id: 'tu-1', text: 'no match\nline two', isError: true })
    expect(document.querySelectorAll('.tool-card').length).toBe(1)
    expect(document.querySelector('.tool-card')).toBe(pendingCard)
    expect(document.querySelector('.tool-card-error')).toBe(pendingCard)
  })

  test('a Task card keeps its subagent row while its input is expanded', async () => {
    await startSession()
    send('delegate')
    harness.emit({ type: 'tool-use', id: 'tu-1', name: 'Task', input: { subagent_type: 'Explore' } })
    harness.emit({ type: 'subagent', parentToolUseId: 'tu-1', status: 'done', agentType: 'Explore' })

    fireEvent.click(showInput())

    expect(document.querySelector('.subagent-row')).toBeTruthy()
    expect(inspector()?.textContent).toContain('subagent_type')
  })

  test('the input control is a real button announcing its expanded state', async () => {
    await startSession()
    send('edit it')
    harness.emit({ type: 'tool-use', id: 'tu-1', name: 'Edit', input: EDIT_INPUT })
    const collapsed = showInput()
    expect(collapsed.tagName).toBe('BUTTON')
    expect(collapsed.getAttribute('aria-expanded')).toBe('false')

    fireEvent.click(collapsed)

    expect(
      screen.getByRole('button', { name: 'Hide input' }).getAttribute('aria-expanded')
    ).toBe('true')
  })

  test('a tool called with no arguments advertises no inspection', async () => {
    await startSession()
    send('do nothing')
    harness.emit({ type: 'tool-use', id: 'tu-1', name: 'Noop', input: {} })
    expect(screen.queryByRole('button', { name: 'Show input' })).toBeNull()
  })

  // Two disclosures, two pieces of state. A single shared boolean would pass
  // every test above and still tie the two regions together — and it would make
  // the output guards vacuous, since a one-line result would suddenly carry a
  // toggle again.
  test('input and output disclose independently', async () => {
    await startSession()
    send('run it')
    harness.emit({ type: 'tool-use', id: 'tu-1', name: 'Bash', input: { command: 'npm test' } })
    harness.emit({ type: 'tool-result', id: 'tu-1', text: '27 passed\nDuration 1.2s', isError: false })

    fireEvent.click(showInput())
    expect(inspector()).toBeTruthy()
    expect(detail()).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Show output' }))
    fireEvent.click(screen.getByRole('button', { name: 'Hide input' }))
    expect(inspector()).toBeNull()
    expect(detail()).toBeTruthy()
  })

  // The output affordance stays gated on hidden OUTPUT. This is the guard on
  // the guard: `a genuinely one-line result advertises no expansion` above must
  // keep meaning something once a second control exists on the same card.
  test('a one-line result still offers input inspection', async () => {
    await startSession()
    send('run it')
    runTool('ok')
    expect(queryToggle()).toBeNull()
    expect(showInput()).toBeTruthy()
  })
})
