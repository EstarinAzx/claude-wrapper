import { DEFAULT_BACKDROP, type Backdrop } from '../shared/backdrop'

// Keeping acrylic's blur through a focus loss (#119), without a dependency.
//
// THE PROBLEM, in the owner's words on the third asking: acrylic "turns opaque
// when I click away". That is Win11 DWM behaviour for the `acrylic` system
// backdrop — blur runs on the focused window by OS design — and #117 swept every
// route Electron 43.2.0 exposes and found none: of 1387 member declarations,
// exactly one couples material appearance to window activity and it is
// `@platform darwin`. Upstream closed that exact request as completed for macOS
// in 2025 and has nothing in flight for win32.
//
// THE FIX, and where it comes from. #117's S4 noticed but did not chase an
// oddity: acrylic's FOCUSED capture scored 97 distinct colours in one round and
// 434 in two others, differing only in whether the material had just been
// CHANGED. `scripts/probe-acrylic-reapply.mjs` chased it, and the answer holds:
// re-applying the material while the window is unfocused re-engages the blur.
//
//   focused, blur engaged        948 distinct colours
//   unfocused, untouched         118          <- the flip the owner reported
//   unfocused, material re-applied 924
//
// Reproduced identically across two rounds, and it PERSISTS — still 924 at +5s
// and +15s with nothing touching the window. So it is a fix, not a flicker, and
// both dependency routes #117 priced stay rejected: no `mica-electron`
// (which would replace `BrowserWindow` and declares no Electron compatibility at
// all), no koffi FFI to the undocumented `SetWindowCompositionAttribute`.
//
// WHY THIS NEEDS TO REMEMBER. #117 also measured that there is NO read-back:
// `getBackgroundMaterial` is undefined and there is no `backgroundMaterial`
// property, so nothing can ask the window what it is wearing. A re-assert has to
// carry its own copy of the value, which is the whole reason this module exists
// rather than a one-line handler.

export interface BackdropPorts {
  /** `win.setBackgroundMaterial`. The only thing this module does to a window. */
  apply(material: Backdrop): void
}

// Only acrylic is re-asserted, and the asymmetry is measured rather than
// assumed. Acrylic flattens on blur (118 vs 948 above). Mica does not — owner
// observation, 2026-08-05, in a real window: *"micas fine when i click away its
// there"*, which is the first actual sighting on a record that had twice
// refuted the claim for want of one. Re-applying mica would buy nothing and
// spend a repaint on every focus loss.
export const FLATTENS_ON_BLUR: readonly Backdrop[] = ['acrylic']

export interface BackdropKeeper {
  /** The renderer picked a material, or pushed the stored one on mount. */
  set(material: Backdrop): void
  /** The window lost focus. Re-assert, if this material is one that flattens. */
  reassert(): void
  /** What main believes the window is wearing. Test seam; nothing else reads it. */
  current(): Backdrop
}

/**
 * Remembers the last material main handed the window, and re-asserts it on blur.
 *
 * Seeded with `DEFAULT_BACKDROP` rather than `null` because the window is
 * constructed with `backgroundMaterial: 'acrylic'` before the renderer has said
 * anything — so a blur arriving in that gap is the FIRST launch's first click
 * away, which is exactly when a user is most likely to notice the flip.
 */
export const createBackdropKeeper = (ports: BackdropPorts): BackdropKeeper => {
  let current: Backdrop = DEFAULT_BACKDROP
  return {
    set(material) {
      current = material
      ports.apply(material)
    },
    reassert() {
      if (FLATTENS_ON_BLUR.includes(current)) ports.apply(current)
    },
    current: () => current
  }
}
