---
type: decision
project: claude-wrapper
updated: 2026-08-05
tags: [context, decision]
---

# An accepted call is not a supported route, and the third asking is answered with a price rather than a dependency

**Decision:** #117 (`50b6a8d`) swept every win32 route to a backdrop that
survives losing focus, priced each one, and **adopted nothing**. No `src/` diff,
no `package.json` entry, no third `Backdrop` value, and **no build ticket filed**.
Both [[2026-07-23-persistent-glass-deferred]] and
[[2026-07-31-backdrop-offers-mica-not-persistent-acrylic]] stay live and
unamended. The recommendation to the owner is **adopt nothing**, with three
priced alternatives kept explicitly live in `scripts/spike-117-findings.md`.

**Why no build ticket:** every shape available rests on the one question the
2026-07-23 ADR reserves for the owner — *"if/when the unfocused-opaque flip
becomes worth a dependency or an aesthetic change"*, which names the owner as
judge. Writing ACs for a build whose premise is an unmade owner call is what
*build only if measured* forbids. #78 is the precedent: it ran its measurement
and built nothing.

## The finding, stated platform-scoped over an enumerated space

Of **1387 member declarations** across `BaseWindow`, `BrowserWindow`, `App` and
their constructor options in the installed Electron **43.2.0**, **exactly one is
classified as both material and activity: `visualEffectState`, `@platform
darwin`.** macOS has a stay-active flag; win32 has none. Plus **189** runtime
members enumerated independently of the declarations.

The shape of that sentence is the point. [[2026-08-05-a-declared-wire-type-is-not-a-callable-route]]
records this run's own grill claiming *"Electron exposes no stay-active flag"*
off a single union and being refuted by a wider sweep of the same file. A null
result is only meaningful if the space it was drawn from is stated, so the
search space is committed alongside the hits.

## An accepted call is not a supported route — the sibling lemma

The entry above established that a **declared** type is not a **callable** route.
This leg establishes the next step down: a **callable** route is not an
**effective** one. Four measurements, each paired with a deliberately bogus
argument, because without that control "Electron accepted `mica`" and "this
method accepts anything" are the same observation:

- **`setBackgroundMaterial` has NO runtime whitelist.** It accepted
  `'definitely-not-a-material'`, `''` and `'persistent'` without throwing; only a
  non-string threw (`Error processing argument at index 0, conversion failure
  from `). The union in `electron.d.ts` is a compile-time fiction at this
  boundary. **Consequence: `src/shared/backdrop.ts`'s compare-never-coerce
  whitelist is the ONLY whitelist in the system**, not a defensive extra layered
  over Electron's. [[2026-07-31-backdrop-offers-mica-not-persistent-acrylic]]
  asserted this as a design principle; it is now measured, and the guard must not
  be "simplified" by a future tidy-up.
- **There is no read-back of any kind.** `getBackgroundMaterial` and
  `getVibrancy` are `undefined`; `'backgroundMaterial' in win` is `false`. Any
  workaround shaped as *re-assert the material when the window blurs* must carry
  its own copy of the value — it cannot ask the window what it is wearing.
- **`setVibrancy` exists and is callable on win32, and is inert.** It accepted
  `'under-window'`, a bogus string and `null`, all without throwing and without
  effect.
- **`visualEffectState` is silently accepted by the constructor on win32**,
  bogus values included; the window is created either way. **This is the
  dangerous one:** adding `visualEffectState: 'active'` to `src/main/index.ts`
  produces no error, no warning and no effect. It reads alive in review and is
  dead at runtime — the exact failure mode a name-matching sweep cannot catch and
  a calling probe can.

## A second window taking focus is how you unfocus a window under automation

#75 measured that `win.blur()` moves `isFocused()` not at all and fires no event,
that a minimised window still reports itself focused, and that only `hide()`
moved both — which removes the window being photographed. That measurement is
confirmed here (`blur()`: `isFocused` stays **true**, **zero** blur events) and
then **extended**: a **second window taking focus** yields `isFocused: false`,
`isVisible: true`, `isMinimized: false` and exactly **one** blur event. That is
the combination #75 concluded it could not produce, it is what a user does when
they alt-tab, and it is the only reason S4 existed at all.

## The routes, priced from published metadata on 2026-08-05

Nothing installed; every query recorded verbatim in `spike-117-findings.json`.

- **`electron-acrylic-window` is WORSE than the ADR priced it.** Last published
  **2021-12-09**; the repository is **ARCHIVED** and therefore accepts no fixes
  ever; its drag-lag issue (#70) and its Windows 11 compile error (#85) are open
  permanently; it is a `gypfile` native addon pinned to `node-gyp ^8.4.1` /
  `node-addon-api ^4.2.0` with no declared Electron compatibility. The ADR said
  *fragile across Electron upgrades*; "fragile" has since become "abandoned".
- **koffi improved as a dependency and not as a route.** 3.1.4, published six
  days before this spike, 277 releases, actively maintained — so "fragile
  dependency" is no longer the right objection to koffi itself. But koffi is only
  the syringe: the undocumented `SetWindowCompositionAttribute` call, its struct
  layout and its behaviour across Windows updates would be written and owned
  here permanently. `getNativeWindowHandle` does exist at runtime, so the route
  is real. Bundler wiring for koffi's native module under electron-vite is a
  known, solved, non-zero cost (koffi #224 / #233 / #203).
- **`mica-electron` was never priced and literally implements the ask.** 1.5.17,
  published 2026-02-23, Apache-2.0, not archived. Its README documents
  `win.alwaysFocused(true)` — *"allows you to keep the mica effects even if the
  window is no focus (decrease performance)"* — the closest thing to the owner's
  request found anywhere in this sweep, plus `setMicaAcrylicEffect()`. Its costs:
  it replaces `BrowserWindow` with `MicaBrowserWindow` in the app's main entry
  (the most invasive of the three); it declares **no** `engines`,
  `peerDependencies` or `os` at all while shipping a prebuilt `.node`, and its
  own README documents the ABI-mismatch failure and prescribes a rebuild; open
  **#29** *"Mica is not working properly on Electron v27.0.0"* against an app
  running Electron **43**; open **#28** rendering lag while resizing an acrylic
  window. Its own parenthetical *"(decrease performance)"* is the ADR's *small
  always-on GPU cost*, now stated by the vendor.

## Nothing newer from Electron or Windows, and upstream fixed it for the other platform

- Installed **43.2.0 is the latest published** (2026-07-21). The 2026-07-23 ADR
  has not aged out — now confirmed a second, independent way.
- **electron/electron #46164** *"Maintain vibrancy effect in inactive Electron
  windows (Safari-style)"* was **closed as completed 2025-04-01, labelled
  `platform/macOS`**. The behaviour being asked for was implemented upstream, on
  the other platform. **#25513** (*change `visualEffectState` at runtime*) has
  been open since 2020-09-17, so even on darwin the flag is constructor-only.
  Sixteen issues name `backgroundMaterial` in their title; all are about
  maximise, first draw or frameless windows. **Nothing is in flight for win32.**
- This machine is Windows 11 build **26200**, far past `backgroundMaterial`'s
  documented 22H2 floor. The material path is fully available; no OS change adds
  a way to hold it through a blur.
- `SetWindowCompositionAttribute`, `stayActive`, `acrylicOpacity`,
  `ACCENT_ENABLE_ACRYLICBLURBEHIND` and `DwmEnableBlurBehindWindow` occur **zero**
  times in `electron.d.ts`. (`persistent` occurs 17 times — every one about
  sessions, cookies and `persist:` partitions, none about window materials.)

## A richness score is not an occlusion control

S4's first run produced four captures scoring **595–1256 distinct colours**, all
passing a blankness check, all **photographs of a terminal window sitting on top
of the app**. `moveTop()` did not raise the app above it and nothing in the
output revealed the problem — it was caught by opening the file. This is
[[2026-08-04-a-lost-target-is-not-a-dead-process]]'s family again: an instrument
reporting its own setup failure as the phenomenon, and a score rich enough to
look like a result.

The fix is a **positive control rather than a better score**: the renderer paints
magenta squares into its four corners for a throwaway pass, all four must be
found in the grabbed rectangle, and the delivered image is a clean second pass
under the same conditions. The window is pinned always-on-top for the captures
and released after. All four delivered captures score `usable: true`.

Two things worth carrying: **`page.screenshot()` cannot show a DWM backdrop at
all** — this window is transparent over a material DWM draws behind it, so a
web-contents capture photographs the transparent layer, which is why every shot
under `.claude/skills/run-desktop/` is silent about appearance and `gui-69` says
so in its own header. And a **desktop** capture can.

## What is deliberately NOT concluded

**Nothing here asserts what Mica does on blur.** The claim was refuted twice
during #115's grill and remains an owner call. The focused-vs-unfocused pixel
delta is reported — with its confounds — precisely so it is not silently inferred
from the colour counts, and it settles nothing for a reason visible in its own
table: **the acrylic control arm disagrees with itself across rounds** (round 1:
delta 0; rounds 2–3: mean 6.425/255, 37.8% of sampled pixels moving), same
window, same material, same code path. A measurement whose control arm is
unstable is not one to hang a twice-refuted claim on. A plausible explanation —
DWM engaging the material on a *change* rather than on a focus regain, with 1.4s
sometimes too short — is a hypothesis this spike did not test.

## Queue consequence

Both slices of spec #115 are delivered (#116 `bd0fed5`, #117 `50b6a8d`). **#115
moved from `ready-for-agent` to `ready-for-human`**: everything remaining on it
is the six owner calls, and left `ready-for-agent` it would sit at the head of
the agent frontier as the lowest-numbered unblocked issue, where the next leg
would either re-derive the delivered spikes or take a call that is not its to
take. #118 stays `needs-info`. **The agent queue is empty.**

**Reversibility:** total. Nothing was adopted, installed, or changed under
`src/`. The label move on #115 is one command.

## Related

- [[decisions]]
- [[2026-07-23-persistent-glass-deferred]] — the revisit condition this answers, still live for the native route
- [[2026-07-31-backdrop-offers-mica-not-persistent-acrylic]] — its compare-never-coerce guard is now measured to be the only one
- [[2026-08-05-a-declared-wire-type-is-not-a-callable-route]] — declared ≠ callable; this entry is callable ≠ effective
- [[2026-08-05-a-denial-the-runtime-never-consults-is-not-a-denial]] — the sibling spike, same batch, same probe-by-calling rule
- [[2026-08-04-a-lost-target-is-not-a-dead-process]] — the instrument-failure family the occlusion control belongs to
