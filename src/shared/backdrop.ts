// The window's backdrop material (#69), and the trust boundary the main-side
// handler reuses — the same shape as `clampZoom` and `normalizeSendPayload`.
//
// Electron's union is 'auto' | 'none' | 'mica' | 'acrylic' | 'tabbed'. This app
// offers TWO of them. `none` is an unspecified rendering state rather than a
// setting (the window background is transparent, so the app wash is the only
// paint in the stack), `auto` hands the app's identity to a system preference,
// and `tabbed` is Mica Alt — still wallpaper-tinted, still steady, differing by
// an amount you would struggle to see under a near-black wash. Two values keep
// this boundary a two-string whitelist; passing the whole union through to
// `setBackgroundMaterial` would widen it for no product gain.
//
// Acrylic is the default AND the identity: the app opens with the backdrop it
// has always had, and Mica is an opt-out.

export const BACKDROPS = ['acrylic', 'mica'] as const

export type Backdrop = (typeof BACKDROPS)[number]

export const DEFAULT_BACKDROP: Backdrop = 'acrylic'

// Compared, never coerced. `String(value)` here would admit anything with a
// convenient `toString`, and a corrupt or hand-edited value must land on the
// default rather than reach the window.
export const normalizeBackdrop = (value: unknown): Backdrop =>
  BACKDROPS.includes(value as Backdrop) ? (value as Backdrop) : DEFAULT_BACKDROP
