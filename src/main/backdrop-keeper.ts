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
  /** `setTimeout`. Injected so the schedule below is testable without waiting. */
  setTimer?(fn: () => void, ms: number): unknown
  /** `clearTimeout`, paired with the above. */
  clearTimer?(handle: unknown): void
}

// WHY THE RE-ASSERT IS A SCHEDULE AND NOT A SINGLE CALL.
//
// The owner stress-tested the single-call version and reported it "90% works…
// sometimes it slips". The race explains it: nothing orders Electron's `blur`
// event against DWM's own switch to the inactive backdrop. A re-assert that
// lands FIRST is simply overwritten a moment later, which reads exactly as
// "mostly fine, occasionally flat, worse when focus is churned".
//
// The original probe that found this fix re-applied 800ms AFTER focus was lost
// and scored 924/948 every time — its timing hid the race by construction, so
// the measurement that justified shipping never exercised the shipped path.
//
// Three attempts bracket the window instead. This is chosen by reasoning about
// the race rather than by measuring each variant: a probe written to compare
// schedules failed its own setup (a uniform desktop behind the window makes
// blurred and flat score identically) and its verdict was discarded rather than
// trusted. What IS measured is the end state, over repeated trials with focus
// churn, by `gui-119.mjs`.
//
// Cost of the extra calls is two `setBackgroundMaterial` invocations per focus
// loss, on a window that is not being looked at.
export const REASSERT_DELAYS_MS: readonly number[] = [0, 250, 800]

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
  /** The window got focus back. Drops anything still pending. */
  cancel(): void
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
  const setTimer = ports.setTimer ?? ((fn, ms) => setTimeout(fn, ms))
  const clearTimer = ports.clearTimer ?? ((h) => clearTimeout(h as ReturnType<typeof setTimeout>))

  let current: Backdrop = DEFAULT_BACKDROP
  let pending: unknown[] = []

  // Every entry point drops what is still in flight first. Focus can churn —
  // alt-tab, a dialog, a notification — and without this each blur stacks
  // another three timers on top of the last one's, so a rapid churn ends with
  // a pile of delayed writes landing after the user is already back.
  const drop = (): void => {
    for (const h of pending) clearTimer(h)
    pending = []
  }

  return {
    set(material) {
      drop()
      current = material
      ports.apply(material)
    },
    reassert() {
      drop()
      if (!FLATTENS_ON_BLUR.includes(current)) return
      pending = REASSERT_DELAYS_MS.map((ms) =>
        // The value is read at FIRE time, not captured now: a delayed write must
        // never resurrect a material the user changed while it was queued.
        setTimer(() => ports.apply(current), ms)
      )
    },
    cancel: drop,
    current: () => current
  }
}
