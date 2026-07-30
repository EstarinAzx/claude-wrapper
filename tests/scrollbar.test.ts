import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'

// The scrollbar is a property of the SURFACE, not of whichever element happens
// to overflow. DESIGN.md has said "never Chromium's default bar" since the
// first pass, but it was implemented per component: four identical copies of
// the same four rules, while `.model-menu`, `.command-list`, `.command-popover`
// and the composer textarea each shipped with the raw Windows bar. These pins
// are on the MECHANISM — one global rule, no component-scoped copies — because
// the failure mode is drift, and a screenshot of any single container passing
// says nothing about the next scrollable someone adds.
// The stylesheet is split by surface under styles/ — the scrollbar rule lives
// in base.css. Read the whole directory rather than one file, so this pin keeps
// asserting on the app's ENTIRE stylesheet: a scoped copy added to any of the
// component files is exactly the drift these tests exist to catch, and pinning
// base.css alone would make it invisible.
const STYLES_DIR = 'src/renderer/src/styles'
const css = readdirSync(STYLES_DIR)
  .sort()
  .map((f) => readFileSync(`${STYLES_DIR}/${f}`, 'utf8'))
  .join('\n')

const scrollbarSelectors = css
  .split(/\r?\n/)
  .filter((line) => line.includes('::-webkit-scrollbar'))
  .map((line) => line.replace(/[,{]\s*$/, '').trim())

describe('scrollbars', () => {
  test('every scrollbar rule is global, never scoped to one component', () => {
    const scoped = scrollbarSelectors.filter((s) => !s.startsWith('::-webkit-scrollbar'))
    expect(scoped).toEqual([])
  })

  test('a global thumb rule exists', () => {
    expect(scrollbarSelectors).toContain('::-webkit-scrollbar-thumb')
  })

  test('the track and the both-axes corner are transparent', () => {
    expect(scrollbarSelectors).toContain('::-webkit-scrollbar-track')
    expect(scrollbarSelectors).toContain('::-webkit-scrollbar-corner')
  })

  // Chromium still draws stepper arrows on an otherwise-styled bar — they are
  // the arrows visible at both ends of the model menu's default scrollbar.
  test('Chromium stepper buttons are suppressed', () => {
    expect(scrollbarSelectors).toContain('::-webkit-scrollbar-button')
  })

  // Horizontal bars need `height`; `width` alone leaves them at the default.
  test('the gutter is sized on both axes', () => {
    const block = /::-webkit-scrollbar\s*\{([^}]*)\}/.exec(css)?.[1] ?? ''
    expect(block).toMatch(/width:/)
    expect(block).toMatch(/height:/)
  })

  // The guard that makes the rule worth having: no scrollable may opt out by
  // being added later. Every overflow container inherits the global rule, so
  // this asserts the rule is not gated behind a class someone must remember.
  test('no scrollbar rule hides behind a class or descendant selector', () => {
    // Pseudo-elements optionally carrying a pseudo-class (`:hover`), and
    // nothing else — no leading `.class`, no descendant combinator.
    const bare = /^::-webkit-scrollbar[a-z-]*(:[a-z-]+)?$/
    expect(scrollbarSelectors.filter((s) => !bare.test(s))).toEqual([])
  })
})
