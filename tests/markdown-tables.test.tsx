import { readFileSync } from 'node:fs'
import { render } from '@testing-library/react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import { describe, expect, test } from 'vitest'

// #121 — GFM tables already PARSED before this ticket; `remark-gfm` has been
// wired on both markdown paths in Chat.tsx all along. What was missing was every
// table rule in the stylesheet, so a table arrived as real `<table>` DOM and
// rendered as run-together text. The fix is CSS only, which makes this file two
// tests of different kinds: one over the DOM, pinning the premise the CSS relies
// on, and one over the stylesheet text, because jsdom loads no CSS and cannot
// see a rule at all.

const TABLE_MD = [
  '| Left | Middle | Right |',
  '| :--- | :----: | ----: |',
  '| a | b | c |',
  '| dd | ee | ff |'
].join('\n')

const renderMarkdown = (md: string): HTMLElement => {
  const { container } = render(
    <div className="assistant-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
        {md}
      </ReactMarkdown>
    </div>
  )
  return container
}

describe('a GFM table reaches the DOM as a table', () => {
  test('it parses into real table markup, not paragraph text', () => {
    const table = renderMarkdown(TABLE_MD).querySelector('table')
    expect(table).not.toBeNull()
    expect(table?.querySelectorAll('thead th')).toHaveLength(3)
    expect(table?.querySelectorAll('tbody tr')).toHaveLength(2)
    expect(table?.querySelectorAll('tbody tr:first-child td')).toHaveLength(3)
  })

  // The alignment arrives as an INLINE style on every cell — measured, not
  // assumed. That is why no rule in markdown.css may mark `text-align` as
  // important: one `!important` and all three columns silently collapse to the
  // stylesheet default, with this file's DOM test still green.
  test('column alignment rides an inline style on each cell', () => {
    const cells = [...renderMarkdown(TABLE_MD).querySelectorAll<HTMLTableCellElement>('th')]
    expect(cells.map((c) => c.style.textAlign)).toEqual(['left', 'center', 'right'])

    const body = [
      ...renderMarkdown(TABLE_MD).querySelectorAll<HTMLTableCellElement>(
        'tbody tr:first-child td'
      )
    ]
    expect(body.map((c) => c.style.textAlign)).toEqual(['left', 'center', 'right'])
  })
})

// Comments are stripped first, the same guard theme.test.ts documents: a naive
// scan over prose counts a selector that is only being talked about.
const MARKDOWN_CSS = 'src/renderer/src/styles/markdown.css'
const css = readFileSync(MARKDOWN_CSS, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')

const selectors = css
  .split(/\r?\n/)
  .map((line) => line.replace(/[,{]\s*$/, '').trim())
  .filter((line) => line.length > 0 && !line.includes(':') && !line.startsWith('}'))

const tableSelectors = selectors.filter((s) => /\b(table|thead|tbody|tr|th|td)\b/.test(s))

const ruleBody = (selector: string): string => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|[,\\n])\\s*${escaped}\\s*(,[^{]*)?\\{([^}]*)\\}`, 'm').exec(css)?.[3] ?? ''
}

describe('the stylesheet actually styles tables', () => {
  test('table rules exist at all', () => {
    expect(tableSelectors.length).toBeGreaterThan(0)
  })

  // react-markdown and highlight.js own the markup, so this file can only ever
  // author descendant rules — a bare `table` selector here would restyle every
  // table in the app from a file named for one surface.
  test('every table rule is a descendant of .assistant-body', () => {
    const stray = tableSelectors.filter((s) => !s.startsWith('.assistant-body '))
    expect(stray).toEqual([])
  })

  test('cells are padded and the header is separated from the body', () => {
    const cell = tableSelectors.find((s) => /\bt[hd]\b/.test(s)) ?? ''
    expect(ruleBody(cell)).toMatch(/padding:/)
    expect(css).toMatch(/border(-bottom)?:/)
  })

  // The guard the inline-style measurement above demands.
  test('no rule overrides the cell alignment the parser emits', () => {
    expect(css).not.toMatch(/text-align:[^;]*!important/)
  })

  // A table wider than .chat-column's 760px must scroll inside the message
  // rather than widen it. react-markdown emits no wrapper element, so the
  // overflow has to sit on the table itself.
  test('an over-wide table scrolls instead of breaking the column', () => {
    const table = tableSelectors.find((s) => s.endsWith(' table')) ?? ''
    const body = ruleBody(table)
    expect(body).toMatch(/overflow-x:\s*auto/)
    expect(body).toMatch(/max-width:\s*100%/)
  })

  // The bar itself is global and lives in base.css. Naming the pseudo-element
  // here, even inside a rule, is the drift scrollbar.test.ts exists to catch.
  test('it adds no scrollbar rule of its own', () => {
    expect(css).not.toMatch(/-webkit-scrollbar/)
  })
})
