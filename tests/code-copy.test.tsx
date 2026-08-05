import { readFileSync } from 'node:fs'
import { render, screen, fireEvent, cleanup, act, waitFor } from '@testing-library/react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import Chat, { markdownComponents } from '../src/renderer/src/components/Chat'
import type { ChatMessage } from '../src/renderer/src/useChat'

// #122 — a copy control on fenced code blocks.
//
// WHAT THIS FILE CANNOT PROVE, so that it is not mistaken for the whole gate:
// whether the write reaches the OS clipboard. jsdom has no clipboard at all —
// the stub below is this file's own — and spec #120 recorded exactly why that
// matters: production loads `file://` (`win.loadFile`), dev loads
// http://localhost, and no `setPermissionRequestHandler` is registered
// anywhere. `scripts/spike-122-clipboard.mjs` is the measurement that settles
// the route, run against the BUILT app and read back through main's own
// `clipboard` module. This file pins the markup, the payload and the wiring.

const CODE_MD = ['Here is some code:', '', '```js', 'const a = 1', 'const b = 2', '```'].join('\n')

const writeText = vi.fn<(text: string) => Promise<void>>()

beforeEach(() => {
  writeText.mockReset()
  writeText.mockResolvedValue(undefined)
  Object.defineProperty(globalThis.navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
    writable: true
  })
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const renderMarkdown = (md: string): HTMLElement => {
  const { container } = render(
    <div className="assistant-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={markdownComponents}
      >
        {md}
      </ReactMarkdown>
    </div>
  )
  return container
}

const msg = (over: Partial<ChatMessage>): ChatMessage =>
  ({ id: 'm1', role: 'assistant', text: '', ...over }) as ChatMessage

describe('a fenced code block carries a copy control', () => {
  test('the button is there, and inline code does not get one', () => {
    const container = renderMarkdown('A `inline` span and a block:\n\n```\nplain\n```')
    expect(screen.getAllByRole('button', { name: /copy code/i })).toHaveLength(1)
    // The inline code is still a bare `code` with no `pre` ancestor — the
    // override replaces `pre`, so nothing may have attached to inline spans.
    const inline = [...container.querySelectorAll('code')].filter((c) => !c.closest('pre'))
    expect(inline).toHaveLength(1)
    expect(inline[0]?.querySelector('button')).toBeNull()
  })

  test('two blocks get two independent controls', () => {
    renderMarkdown('```\none\n```\n\n```\ntwo\n```')
    expect(screen.getAllByRole('button', { name: /copy code/i })).toHaveLength(2)
  })

  // The `pre` is still the element that scrolls and still the element the
  // markdown rules style; the wrapper exists only to give the button a
  // positioning context that does not scroll away with the code.
  test('the pre survives the override and stays inside the wrapper', () => {
    const container = renderMarkdown(CODE_MD)
    const pre = container.querySelector('pre')
    expect(pre).not.toBeNull()
    expect(pre?.parentElement?.className).toContain('code-block')
    expect(pre?.querySelector('code')).not.toBeNull()
  })
})

describe('clicking it copies the block text', () => {
  test('it sends the exact code text, with no button text mixed in', async () => {
    renderMarkdown(CODE_MD)
    fireEvent.click(screen.getByRole('button', { name: /copy code/i }))
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1))
    expect(writeText.mock.calls[0]?.[0]).toBe('const a = 1\nconst b = 2\n')
  })

  // Model output is hostile input (the sandbox decision). The payload is read
  // from the rendered DOM's textContent, never from anything interpreted, so
  // markup inside a fence must arrive as the literal characters the model
  // wrote.
  test('markup inside a fence is copied literally, not interpreted', async () => {
    renderMarkdown('```html\n<img src=x onerror=alert(1)>\n```')
    fireEvent.click(screen.getByRole('button', { name: /copy code/i }))
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1))
    expect(writeText.mock.calls[0]?.[0]).toBe('<img src=x onerror=alert(1)>\n')
  })

  test('the right block is copied when there are several', async () => {
    renderMarkdown('```\nfirst\n```\n\n```\nsecond\n```')
    fireEvent.click(screen.getAllByRole('button', { name: /copy code/i })[1]!)
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1))
    expect(writeText.mock.calls[0]?.[0]).toBe('second\n')
  })
})

describe('it confirms, then returns to rest', () => {
  test('the label flips to copied and back', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    renderMarkdown(CODE_MD)
    fireEvent.click(screen.getByRole('button', { name: /copy code/i }))
    await waitFor(() => expect(screen.getByRole('button', { name: /copied/i })).toBeTruthy())
    await act(async () => {
      vi.advanceTimersByTime(3000)
    })
    expect(screen.getByRole('button', { name: /copy code/i })).toBeTruthy()
  })

  // A rejected write must not leave the control claiming success. The stub
  // rejects; the label has to stay at rest.
  test('a failed write does not claim success', async () => {
    writeText.mockRejectedValue(new Error('denied'))
    renderMarkdown(CODE_MD)
    fireEvent.click(screen.getByRole('button', { name: /copy code/i }))
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1))
    expect(screen.queryByRole('button', { name: /copied/i })).toBeNull()
  })
})

describe('both markdown render paths carry it', () => {
  test('an assistant message gets the control', () => {
    render(<Chat messages={[msg({ role: 'assistant', text: CODE_MD })]} busy={false} />)
    expect(screen.getAllByRole('button', { name: /copy code/i })).toHaveLength(1)
  })

  // `msg-command` is CLI output rather than model output, and it renders through
  // its own ReactMarkdown. A `components` map applied to only one path is the
  // easy miss here.
  test('a command message gets it too', () => {
    render(<Chat messages={[msg({ id: 'm2', role: 'command', text: CODE_MD })]} busy={false} />)
    expect(screen.getAllByRole('button', { name: /copy code/i })).toHaveLength(1)
  })
})

// jsdom loads no CSS, so everything above proves a rule was WRITTEN at best.
// These read the stylesheet as text, the same guard theme.test.ts documents,
// with comments stripped first so prose about a selector is not counted as one.
const MARKDOWN_CSS = 'src/renderer/src/styles/markdown.css'
const css = readFileSync(MARKDOWN_CSS, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')

const ruleBody = (selector: string): string => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|[,\\n])\\s*${escaped}\\s*(,[^{]*)?\\{([^}]*)\\}`, 'm').exec(css)?.[3] ?? ''
}

describe('the stylesheet dresses the control', () => {
  test('the wrapper is a positioning context and the button is placed against it', () => {
    expect(ruleBody('.assistant-body .code-block')).toMatch(/position:\s*relative/)
    expect(ruleBody('.assistant-body .code-copy')).toMatch(/position:\s*absolute/)
  })

  // Same rule #121 lives under: this file may only ever author descendant
  // rules, because react-markdown owns the markup and a bare `.code-copy` here
  // would reach any future control that happened to share the name.
  test('every new rule is a descendant of .assistant-body', () => {
    const selectors = css
      .split(/\r?\n/)
      .map((line) => line.replace(/[,{]\s*$/, '').trim())
      .filter((l) => l.length > 0 && !l.startsWith('}'))
      .filter((l) => /\bcode-(block|copy)\b/.test(l))
    expect(selectors.length).toBeGreaterThan(0)
    expect(selectors.filter((s) => !s.startsWith('.assistant-body '))).toEqual([])
  })

  // The focus decision (#93): a control that paints a fill in any state takes
  // the hairline ALONE. A wash on an icon button is indistinguishable from its
  // own hover state, so the ring would read as "hovered", not "focused".
  test('the focus ring is the hairline alone, with no wash', () => {
    const focus = ruleBody('.assistant-body .code-copy:focus-visible')
    expect(focus).toMatch(/box-shadow:\s*inset 0 0 0 1px var\(--tint-6\)/)
    expect(focus).toMatch(/outline:\s*none/)
    expect(focus).not.toMatch(/background/)
  })

  test('it adds no scrollbar rule of its own', () => {
    expect(css).not.toMatch(/-webkit-scrollbar/)
  })

  // The pre keeps its own margin nowhere but the wrapper, or the button floats
  // in the gap above the code rather than over it.
  test('the wrapper owns the block margin', () => {
    expect(ruleBody('.assistant-body .code-block')).toMatch(/margin:/)
    expect(ruleBody('.assistant-body .code-block > pre')).toMatch(/margin:\s*0/)
  })
})
