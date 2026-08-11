import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

// #140 — the selected session row keeps its mint state stripe, and the
// side-stripe ban gains one named exception for it. This file is the pin that
// runs in the GATE.
//
// Why it exists at all, and why an amendment alone was not enough: the stripe
// matches the banned FORM while failing to match the banned purpose, so it
// reads as a violation to anyone holding the spec beside the pixels. That has
// already happened twice — one reviewer read it backwards as a full outline,
// and a later one raised it correctly as a spec break. An undocumented
// deviation is the precise shape a conformance pass removes, which is the same
// argument #125 made for the glass exception.
//
// The other direction is the one a doc edit cannot cover on its own. Before
// this file, NOTHING in the repo asserted the stripe existed: `rails.css:548`
// was its only occurrence, no test and no driver read it. Delete the rule and
// every check stayed green while `DESIGN.md` went on granting an exception for
// a declaration that was no longer there. #125's form is doc and code pinned
// together for exactly that reason — `subagent-material.test.ts` says it
// outright, that shipping the rule without the amendment and reverting the
// rule while keeping the amendment must BOTH be red.
//
// What this file CANNOT do, stated so a green run is not mistaken for more
// than it is: jsdom loads no CSS, so this is a raw-text pin. It proves the rule
// was written and is scoped where it claims to be. That the stripe reaches the
// mounted row, that it is 2 device pixels wide, and that it reads as
// "selected" at a glance are all unasserted — the ruling moved no pixels, so it
// owed no driver (D4), and nobody has measured whether the mint wash alone
// would carry selection without it.
//
// Comments are stripped before every scan — the guard `theme.test.ts`
// documents and `subagent-material.test.ts` repeats. Without it this file's own
// prose in `rails.css` would count as a declaration.

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

// The rule is a GROUPED selector — `.session-row-btn-active, .session-row-btn-active:hover`
// — so the anchored `^\.class\s*\{` idiom used for `.subagent-drawer` matches
// nothing here: the character after the class name is a comma, not a brace.
// `[^{]*` crosses the rest of the group. The negative lookahead still rejects a
// longer class name, since neither a word character nor a hyphen may follow.
// Bodies do not nest and comments are already stripped, so `[^}]*` is safe.
const activeRowBody = (): string =>
  /^\.session-row-btn-active(?![\w-])[^{]*\{([^}]*)\}/m.exec(source.get('rails.css') ?? '')?.[1] ?? ''

// A side stripe is a shadow pushed sideways: a nonzero HORIZONTAL offset with
// no blur to soften it. The `inset 0 0 0 1px` idiom used all over this app is
// the opposite shape — offset zero, spread 1px — and paints a full hairline
// outline on every edge rather than a bar on one. That distinction is the whole
// discriminator, so it is parsed rather than grepped.
//
// Every value must parse. A `box-shadow` this cannot read is reported as a
// failure instead of being skipped, because silent skipping is how the check
// would go vacuous the day someone writes `box-shadow: var(--some-stripe)`.
const SHADOW = /box-shadow\s*:\s*([^;}]+)/g

type Shadow = { sheet: string; value: string; offset: number | null }

const shadows = (): Shadow[] => {
  const out: Shadow[] = []
  for (const [sheet, css] of source) {
    for (const [, raw] of css.matchAll(SHADOW)) {
      const value = raw.trim()
      if (/^none$/i.test(value)) {
        out.push({ sheet, value, offset: 0 })
        continue
      }
      const head = /^(-?[\d.]+)(?:px|rem|em)?\b/.exec(value.replace(/\binset\b/g, ' ').trim())
      out.push({ sheet, value, offset: head ? Number.parseFloat(head[1]) : null })
    }
  }
  return out
}

describe('the selected session row carries its state stripe', () => {
  test('the active-row rule declares an inset shadow', () => {
    expect(activeRowBody()).toMatch(/box-shadow\s*:\s*inset\b/)
  })

  // Both halves pinned: the offset is what makes it a stripe rather than an
  // outline, and the mint token is what makes it read as the selection accent
  // rather than as the `--tint-6` hairline every other surface wears. Dropping
  // either one alone leaves a rule that still passes the test above.
  test('the shadow is a mint bar pushed off the left edge, not a hairline outline', () => {
    const body = activeRowBody()
    expect(body).toMatch(/box-shadow:\s*inset\s+2px\b/)
    expect(body).toMatch(/box-shadow:[^;]*var\(--color-mint\)/)
  })

  // The wash was already there before the stripe and is the other half of the
  // selected state. If this ever becomes the only marker the exception stops
  // buying anything, and the honest move then is to re-open the ruling.
  test('the row still fills with the mint wash underneath it', () => {
    expect(activeRowBody()).toMatch(/background:\s*var\(--mint-wash\)/)
  })
})

describe('the exception is scoped to that one row', () => {
  // Acceptance 2, mechanically, and the mirror of #125's "appears nowhere else
  // in styles/". A second surface growing a stripe reds here rather than
  // shipping as a quiet generalisation of a call the owner has not made.
  test('no other rule in styles/ carries a shadow with a horizontal offset', () => {
    const striped = shadows().filter((s) => s.offset !== null && s.offset !== 0)
    expect(striped.map((s) => `${s.sheet}: ${s.value}`)).toEqual([
      'rails.css: inset 2px 0 0 0 var(--color-mint)'
    ])
  })

  // Anti-vacuity. The scan above is only as good as its parse, and a value it
  // cannot read would be counted as "not a stripe" by default.
  test('every box-shadow value in styles/ is one this check can actually read', () => {
    const unreadable = shadows()
      .filter((s) => s.offset === null)
      .map((s) => `${s.sheet}: ${s.value}`)
    expect(unreadable).toEqual([])
  })
})

describe('DESIGN.md records the deviation it now permits', () => {
  // Split rather than an anchored `^...$` regex: DESIGN.md is CRLF in this
  // checkout and `$` under /m matches before `\n`, so the `\r` sits in the way
  // and an anchored heading match reads as an empty section. Normalised first,
  // which is the same guard `subagent-material.test.ts` carries and the same
  // one that cost that file a red run.
  const design = readFileSync(path.join(REPO, 'DESIGN.md'), 'utf8').replace(/\r\n/g, '\n')
  const bans = (design.split('\n## Bans in force\n')[1] ?? '').split('\n## ')[0]

  test('the bans section was found at all', () => {
    expect(bans.trim()).not.toBe('')
  })

  // The exception is only meaningful while the ban it excepts is still standing.
  // Deleting the ban and keeping the exception would leave the document arguing
  // for a permission nothing restricts.
  test('the bans section still bans side-stripe borders', () => {
    expect(bans).toMatch(/No side-stripe borders/)
  })

  // Keyed on the class name, the scope phrase and the precedent disclaimer —
  // the three things acceptance 2 asks the amendment to state. Keywords rather
  // than exact wording, for the reason D3 already makes this repo pay for its
  // literal-text pins: this can say the claim is PRESENT, and cannot grade how
  // well it is argued.
  test('it names the exception, the surface and the scope', () => {
    expect(bans).toMatch(/\.session-row-btn-active/)
    expect(bans).toMatch(/box-shadow: inset 2px/)
    expect(bans).toMatch(/row\s+only/)
    expect(bans).toMatch(/precedent/)
  })
})
