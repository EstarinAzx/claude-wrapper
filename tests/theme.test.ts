import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import { DEFAULT_THEME, normalizeTheme, THEMES } from '../src/shared/theme'

// #70 — the four palettes. Two things are tested here and they are different in
// kind. The whitelist is the trust boundary: an unrecognised string must not
// reach `data-theme`, because an attribute matching no block in themes.css
// renders the DEFAULTS while the panel shows nothing selected — broken, and
// silent. The rest is a structural pin over the stylesheet itself, which exists
// because "lightness stays fixed" is otherwise a sentence in an ADR that the
// fourth palette quietly breaks.

describe('the theme whitelist', () => {
  test('offers exactly four palettes, frost the default', () => {
    expect([...THEMES]).toEqual(['frost', 'ember', 'moss', 'slate'])
    expect(DEFAULT_THEME).toBe('frost')
  })
})

describe('normalizeTheme', () => {
  test('passes through each offered palette', () => {
    for (const name of THEMES) expect(normalizeTheme(name)).toBe(name)
  })

  test('falls back to the default for anything unrecognised', () => {
    expect(normalizeTheme('')).toBe(DEFAULT_THEME)
    expect(normalizeTheme('dark')).toBe(DEFAULT_THEME)
    expect(normalizeTheme(null)).toBe(DEFAULT_THEME)
    expect(normalizeTheme(undefined)).toBe(DEFAULT_THEME)
    expect(normalizeTheme(7)).toBe(DEFAULT_THEME)
  })

  // Compared, never coerced: an object that merely stringifies to a palette
  // name is not one, and a `String(value)` boundary would let it through.
  test('does not coerce its way to a match', () => {
    expect(normalizeTheme('Ember')).toBe(DEFAULT_THEME)
    expect(normalizeTheme({ toString: () => 'ember' })).toBe(DEFAULT_THEME)
    expect(normalizeTheme(['ember'])).toBe(DEFAULT_THEME)
  })
})

const THEMES_FILE = 'src/renderer/src/styles/themes.css'
const TOKENS_FILE = 'src/renderer/src/styles/tokens.css'
const ENTRY_FILE = 'src/renderer/src/styles.css'

// COMMENTS ARE STRIPPED FIRST. This is the third raw-text CSS reader in the
// suite — `scrollbar.test.ts` and `multiline-composer.test.tsx` are the other
// two, and both have already gone red on prose. themes.css carries a long
// header plus a note per palette, and a naive `--color-…:` scan counts a
// commented-out declaration happily.
const source = (path: string): string => readFileSync(path, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')

const declarations = (css: string): Map<string, string> => {
  const found = new Map<string, string>()
  for (const [, key, value] of css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    found.set(key, value.trim())
  }
  return found
}

const blocks = new Map<string, Map<string, string>>()
for (const [, name, body] of source(THEMES_FILE).matchAll(
  /\[data-theme='([a-z]+)'\]\s*\{([^}]*)\}/g
)) {
  blocks.set(name, declarations(body))
}

const tokenNames = new Set(declarations(source(TOKENS_FILE)).keys())

type Oklch = { l: number; c: number; h: number; a: number | null }

const oklch = (value: string): Oklch => {
  const m = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)\s*)?\)$/.exec(value)
  if (!m) throw new Error(`not an oklch() value: ${value}`)
  return {
    l: Number(m[1]),
    c: Number(m[2]),
    h: Number(m[3]),
    a: m[4] === undefined ? null : Number(m[4])
  }
}

// Chroma is the ONE axis a palette may move, and only on the accent fills: it
// carries "different colour" without touching contrast or the tint ladder. The
// neutrals sit an order of magnitude lower and move by hue angle alone —
// pushing one into this band produces a strongly coloured near-black instead of
// a tinted one, which is the app's identity gone. `--color-mint-ink` is
// excluded too: it is a glyph colour on a fill, not an accent.
const CHROMA_MAY_MOVE = ['--color-mint', '--color-mint-press', '--color-mint-wash']
const CHROMA_BAND = { min: 0.05, max: 0.09 }

const frost = blocks.get('frost')

// THE IMPORT ORDER IS THE CASCADE, and this feature is the case that rule was
// written for: a theme block landing before the tokens it overrides is a silent
// restyle, and a themes.css that is never imported at all is a feature that
// simply does nothing — with every other pin in this file still green, because
// they read the stylesheet from disk rather than from the bundle.
describe('the theme stylesheet is wired into the cascade', () => {
  test('it is imported immediately after the tokens it overrides, and before base', () => {
    const order = [...source(ENTRY_FILE).matchAll(/@import\s+["']\.\/styles\/([\w-]+)\.css["']/g)]
      .map((m) => m[1])
      .slice(0, 3)
    expect(order).toEqual(['tokens', 'themes', 'base'])
  })
})

// Named for what it pins, never "themes are correct" — a test whose name
// overclaims is how weak code stays frozen in place. What it catches is real,
// silent and specific: a palette missing `--color-mint-ink` inherits Frost's
// dark glyph colour and the send button's glyph goes invisible on an amber
// fill, with nothing red anywhere. jsdom cannot see it and a screenshot at rest
// may not either. It must NOT fire on a re-tint — a key-set test that reddens
// when someone adjusts a hue gets retired the first time it happens.
describe('every theme declares the same keys', () => {
  test('the stylesheet holds one block per whitelisted palette, and no others', () => {
    expect([...blocks.keys()].sort()).toEqual([...THEMES].sort())
  })

  test('every block declares an identical key set', () => {
    const expected = [...(frost?.keys() ?? [])].sort()
    expect(expected.length).toBeGreaterThan(0)
    for (const [name, block] of blocks) {
      expect([name, [...block.keys()].sort()]).toEqual([name, expected])
    }
  })

  // A key set can be identical across four blocks and still override nothing:
  // one typo repeated by copy-paste (`--color-tint-8`) declares a custom
  // property no rule in the app reads.
  test('every key a palette declares is a token the app actually defines', () => {
    for (const [name, block] of blocks) {
      const unknown = [...block.keys()].filter((k) => !tokenNames.has(k))
      expect([name, unknown]).toEqual([name, []])
    }
  })
})

// A theme RE-HUES; it does not re-design. Structural rather than remembered,
// which is the same trick as naming the panel Appearance.
describe('no theme moves lightness, alpha, or a neutral chroma', () => {
  test('lightness and alpha match Frost on every key', () => {
    for (const [name, block] of blocks) {
      for (const [key, value] of block) {
        const mine = oklch(value)
        const theirs = oklch(frost?.get(key) ?? '')
        expect([name, key, mine.l, mine.a]).toEqual([name, key, theirs.l, theirs.a])
      }
    }
  })

  test('chroma matches Frost on every key but the accent fills', () => {
    for (const [name, block] of blocks) {
      for (const [key, value] of block) {
        if (CHROMA_MAY_MOVE.includes(key)) continue
        expect([name, key, oklch(value).c]).toEqual([name, key, oklch(frost?.get(key) ?? '').c])
      }
    }
  })

  test('the accent fills stay inside the chroma band', () => {
    for (const [name, block] of blocks) {
      for (const key of CHROMA_MAY_MOVE) {
        const { c } = oklch(block.get(key) ?? '')
        expect([name, key, c >= CHROMA_BAND.min && c <= CHROMA_BAND.max]).toEqual([name, key, true])
      }
    }
  })

  // The hue is the axis that MUST move, so the pin above is only half an
  // answer: four blocks holding Frost's hues would satisfy every rule so far
  // and ship one palette four times.
  test('each palette is actually a different hue', () => {
    const hues = [...blocks.values()].map((b) => oklch(b.get('--color-mint') ?? '').h)
    expect(new Set(hues).size).toBe(THEMES.length)
  })
})
