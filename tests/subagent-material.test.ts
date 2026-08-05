import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

// #125 — the subagent viewer takes the window material, and this file is the
// pin that runs in the GATE.
//
// Why it exists at all: the exception this ticket ships is a DEVIATION from a
// documented ban, and an undocumented deviation is the precise shape a
// conformance pass removes — #96's commit is literally "style: two off-scale
// values conform to DESIGN.md". `gui-98.mjs` asserts the material positively on
// the live pane, but no driver runs in `npm test`, so on its own the deviation
// is protected by a check nobody runs. These three tests are cheap and the gate
// runs them.
//
// What this file CANNOT do, stated so a later reader does not mistake a green
// run for more than it is: jsdom loads no CSS, and no automated capture can see
// a DWM backdrop anyway (`--disable-gpu` flattens acrylic). A raw-text pin
// proves the rule was WRITTEN and is scoped where it claims to be. That the
// declaration actually reaches the mounted element is `gui-98`'s computed-style
// criterion; that it looks like acrylic is not asserted anywhere, on purpose.
//
// Comments are stripped before every scan — the guard `theme.test.ts` documents
// and `markdown-tables.test.ts` repeats. Without it this file's own prose in
// `subagent.css`, and the ban text in `DESIGN.md`, both count as declarations.

const REPO = path.resolve(import.meta.dirname, '..')
const STYLE_DIR = path.join(REPO, 'src/renderer/src/styles')

const stripComments = (text: string): string => text.replace(/\/\*[\s\S]*?\*\//g, '')

const sheets = [
  ['styles.css', path.join(REPO, 'src/renderer/src/styles.css')] as const,
  ...readdirSync(STYLE_DIR)
    .filter((f) => f.endsWith('.css'))
    .map((f) => [f, path.join(STYLE_DIR, f)] as const)
]

const source = new Map(sheets.map(([name, file]) => [name, stripComments(readFileSync(file, 'utf8'))]))

const DECLARATION = /backdrop-filter\s*:/g
const declarationCount = (css: string): number => (css.match(DECLARATION) ?? []).length

// Anchored at line start and closed by `\s*\{`, so `.subagent-drawer-root` and
// `.subagent-drawer .chat` cannot match: the character after the class name is
// a `-` or a space-then-selector, not a brace. Bodies here do not nest.
const paneBody = (): string =>
  /^\.subagent-drawer\s*\{([^}]*)\}/m.exec(source.get('subagent.css') ?? '')?.[1] ?? ''

describe('the subagent viewer carries the window material', () => {
  test('the pane rule declares a backdrop filter', () => {
    expect(paneBody()).toMatch(/backdrop-filter\s*:/)
  })

  // The material is blur plus a saturation lift, which is what distinguishes
  // acrylic from plain frosting. Both terms are pinned because dropping the
  // saturate() alone leaves a rule that still passes the test above.
  test('the filter is a blur with a saturation lift, not a bare blur', () => {
    const body = paneBody()
    expect(body).toMatch(/backdrop-filter:[^;]*\bblur\(/)
    expect(body).toMatch(/backdrop-filter:[^;]*\bsaturate\(/)
  })

  // The pane was already translucent before #125 — the blur finishes that ply
  // rather than adding one. If this ever becomes an opaque fill the exception
  // stops buying anything, and the honest move then is to remove it.
  test('the pane still fills with the translucent surface token', () => {
    expect(paneBody()).toMatch(/background:\s*var\(--surface\)/)
  })
})

describe('the exception is scoped to that one pane', () => {
  // Acceptance bullet 5, mechanically. An extension to `.model-menu`, the
  // command popover or the Appearance dock reds here rather than shipping as a
  // quiet generalisation of a call the owner has not made.
  test('no other stylesheet declares a backdrop filter', () => {
    const offenders = [...source.entries()]
      .filter(([name]) => name !== 'subagent.css')
      .filter(([, css]) => declarationCount(css) > 0)
      .map(([name]) => name)
    expect(offenders).toEqual([])
  })

  test('subagent.css declares it exactly once, inside the pane rule', () => {
    expect(declarationCount(source.get('subagent.css') ?? '')).toBe(1)
    expect(declarationCount(paneBody())).toBe(1)
  })
})

describe('DESIGN.md records the deviation it now permits', () => {
  // Split rather than a `^...$` multiline regex: this repo is CRLF throughout
  // with no `.gitattributes`, and `$` under /m matches before `\n` — the `\r`
  // sits in the way, so an anchored heading match reads as an empty section and
  // every assertion below it fails for a line-ending reason. Cost a red run.
  const design = readFileSync(path.join(REPO, 'DESIGN.md'), 'utf8').replace(/\r\n/g, '\n')
  const bans = (design.split('\n## Bans in force\n')[1] ?? '').split('\n## ')[0]

  test('the bans section was found at all', () => {
    expect(bans.trim()).not.toBe('')
  })

  test('the bans section still bans extra glass inside the window', () => {
    expect(bans).toMatch(/no decorative extra glass layers inside the window/)
  })

  // Code and doc pinned together: shipping the rule without the amendment, or
  // reverting the rule and leaving the amendment, both red.
  test('it names the exception, the surface and the scope', () => {
    expect(bans).toMatch(/backdrop-filter/)
    expect(bans).toMatch(/\.subagent-drawer/)
    expect(bans).toMatch(/pane only/)
  })
})
