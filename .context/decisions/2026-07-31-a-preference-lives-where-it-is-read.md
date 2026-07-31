---
type: decision
project: claude-wrapper
updated: 2026-07-31
tags: [context, decision]
---

# A preference lives where it is read

**Decision:** Preferences stay in renderer `localStorage`, read at module scope, exactly as `sidebar-scope`, `zoom-level-v2`, `sidebar-width` and the agents-dock width already do. A preference whose *effect* belongs to the main process is pushed over IPC on mount and on change — the pattern `useZoom` already ships. No preferences file, no main-side store, and **no migration of the four existing keys**.

**Why:** The Appearance panel introduces the first preference main must act on (the window's `backgroundMaterial`), which looked like it forced a main-side store readable before `BrowserWindow` construction. It does not. `BrowserWindow.setBackgroundMaterial('auto'|'none'|'mica'|'acrylic'|'tabbed')` is runtime-settable on the Electron we ship (`node_modules/electron/electron.d.ts:3236`, `^43.2.0`), so the material needs no answer at construction time and there is no structural difference between this preference and the four already stored. What remains is a timing artifact, and a timing artifact does not earn a persistence layer.

The alternative — a small main-side store for "the main-process ones" — is the worse shape it looks like: a second answer to "where does a preference go", permanently, for a single two-value enum. Every later preference would then open with a store-selection argument. One store, one answer.

**On the launch flash:** switching material after the renderer mounts means one frame of the constructed default. That cost was rejected as a reason to build a store, on two measured grounds. The app **already ships a larger version of the same artifact** — `useZoom` applies in a mount `useEffect` (`src/renderer/src/useZoom.ts:21-28`), so every launch paints at 1.0 and reflows to the stored level, for every user. The material flash is subtler, and unlike zoom's it is **opt-in**: the constructed default stays `acrylic`, so only a user who deliberately chose the other material ever sees it. Ranking a new opt-in artifact above a shipped universal one is backwards.

If a driver run ever measures the flash as objectionable, the fix is still not a second store: gate `win.show()` on the renderer's first preference push with a timeout fallback, in `createWindow`. That is one place deciding when the window is presentable, and it fixes the zoom reflow too. **Build it only if measured.**

**Reversibility:** easy — the seam is one IPC channel.

## Amendment (#78, 2026-07-31) — the flash was measured, the gate was declined, and one premise above is false

`gui-78.mjs` ran the measurement this ADR made the fix conditional on. **The
condition did not fire: no gate was built**, and `src/` is unchanged. Full
numbers in [[2026-07-31-the-window-is-shown-before-the-app-exists]]; three
corrections to the text above.

**"every launch paints at 1.0 and reflows to the stored level, for every user"
is FALSE after the first launch.** Chromium persists the zoom factor per origin
inside the userData directory and restores it at document commit, so the second
launch paints its first frame already at 1.25 — `dom-ready` reads
`getZoomFactor() === 1.25` some 41–44ms before the renderer's `zoom:set` even
arrives. The zoom reflow is **once per install**. Since this sentence is the
whole ground for ranking zoom above the material flash, that ranking no longer
holds either: the material flash is the artifact that actually recurs, and it is
still one frame.

**"one frame of the constructed default" is the right order of magnitude, and
that is the point.** Measured: 11–13ms of UI at the pre-zoom layout on a
first-ever launch, 2–12ms of UI in the Frost palette before `data-theme` lands,
against a 16.7ms frame — under `--disable-gpu` software compositing, which is
slower than the shipped path, so these are upper bounds.

**The largest visible component is not a preference.** `ready-to-show` fires on
the first paint of the still-empty document, so the window is on screen 38–61ms
before React commits anything. That frame is transparent (`body` computes
`rgba(0, 0, 0, 0)`), so it is the bare backdrop material rather than a white
flash.

**"gate `win.show()` on the renderer's first preference push" is not
implementable as written**, and must not be cited as though it were precise.
Zoom and backdrop are two separate IPC messages, so "first" is a race between
them; theme crosses no boundary at all, so no count of preference messages can
cover it. Building it would mean defining an explicit renderer→main readiness
signal plus a timeout fallback — a protocol, not a line. That cost is why the
measurement declined it, exactly as **"Build it only if measured"** intended.

**This does not pre-decide the window-bounds ticket (#79).** Bounds add a
window-manager move and resize at the same 38–55ms mark, on an already-visible
window — a different class of artifact from a CSS reflow. Re-run `gui-78.mjs`
with bounds applied and decide on those numbers.

## Related

- [[decisions]]
- [[2026-07-31-the-window-is-shown-before-the-app-exists]] — #78, the measurement
  that amends this file and declined its conditional fix
- [[2026-07-31-appearance-is-a-dock-not-a-settings-modal]] — the panel this serves
- [[2026-07-31-backdrop-offers-mica-not-persistent-acrylic]] — the preference that raised the question
- [[2026-07-30-a-diff-without-a-baseline-is-worse-than-none]] — the same refusal to price an unmeasured cost
