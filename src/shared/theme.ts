// The window's palette (#70), and the trust boundary the renderer reuses before
// the value reaches `documentElement`'s `data-theme` — the same shape as
// `normalizeBackdrop` and `clampZoom`.
//
// A theme RE-HUES; it does not re-design. Lightness and alpha are fixed across
// every palette, chroma moves only on the two accent fills, and the neutrals
// move by hue angle alone. That restraint is what keeps a colour choice from
// becoming a legibility choice, and it is pinned structurally over `themes.css`
// rather than remembered — see `tests/theme.test.ts`.
//
// Frost is the default AND the identity: the app opens with the mint it has
// always had, and the other three are opt-ins.

export const THEMES = ['frost', 'ember', 'moss', 'slate'] as const

export type Theme = (typeof THEMES)[number]

export const DEFAULT_THEME: Theme = 'frost'

// Compared, never coerced — same reasoning as `normalizeBackdrop`. The stronger
// reason here is that an unrecognised string is not inert: setting `data-theme`
// to it matches no block in `themes.css`, so the window silently renders the
// defaults while the panel shows nothing selected.
export const normalizeTheme = (value: unknown): Theme =>
  THEMES.includes(value as Theme) ? (value as Theme) : DEFAULT_THEME
