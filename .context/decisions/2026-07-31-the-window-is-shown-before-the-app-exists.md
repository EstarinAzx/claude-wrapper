---
type: decision
project: claude-wrapper
updated: 2026-07-31
tags: [context, decision]
---

# The window is shown before the app exists — and that is the whole artifact

**Decision:** #78 measured the launch artifact and **built nothing**. The
`win.show()` gate [[2026-07-31-a-preference-lives-where-it-is-read]] specified as
the conditional fix is **not** built, because the condition it was conditional on
— "if a driver run ever measures the flash as objectionable" — is measured and
the answer is no. `gui-78.mjs` is the whole deliverable; `src/` is unchanged.

**What the launch actually does**, measured over five runs on two profiles with
`gui-78.mjs` (all times relative to the instant the window becomes visible):

| | first-ever launch | every launch after |
|---|---|---|
| viewport at first painted frame | 1100css @ dpr 1 | **880css @ dpr 1.25** |
| zoom reflows seen after the window is visible | **1** | **0** |
| window transparent-and-empty for | 41–61ms | 38–55ms |
| UI on screen at the wrong zoom for | 11–13ms | — |
| UI on screen in the wrong palette for | — | 2–12ms |
| material corrected at | n/a (default) | 40–45ms |

Three findings, in the order they matter.

**1. The ADR's universal claim is FALSE after the first launch.** It ranks the
zoom reflow above the material flash because zoom "applies in a mount
`useEffect`, so every launch paints at 1.0 and reflows to the stored level, **for
every user**". Chromium persists the zoom factor **per origin, inside the
userData directory**, and restores it when the document commits — so the second
launch paints its very first frame already at 1.25. `dom-ready` reads
`getZoomFactor() === 1.25` a full 41–44ms **before** the renderer's `zoom:set`
arrives, and the document-start sampler's first frame is already 880css. The
reflow is a **once-per-install** event, not a per-launch one. The measurement
that was supposed to justify the fix removed its own motivation, which is the
#71 shape again: **measure the stated cause before speccing a fix for it.**

**2. The biggest visible component is not a preference at all.**
`ready-to-show` fires on the first paint of the **still-empty document**, so
`win.show()` puts the window on screen 38–61ms before React commits anything.
That frame is `rgba(0, 0, 0, 0)` on `body` — measured, not assumed — so what the
user sees is the bare OS backdrop material with nothing in it, not a white flash
or a mis-styled shell. The window materialises, then fills.

**3. Every genuinely wrong state lasts one frame or less.** 11–13ms of UI at the
pre-zoom layout on a first-ever launch, 2–12ms of UI in the Frost palette before
`data-theme` lands. At 60Hz a frame is 16.7ms. And these were measured under
`--disable-gpu` software compositing, which is **slower** than the shipped GPU
path, so they are upper bounds.

**Why not build it anyway.** The ADR's prescribed fix is not the one-liner its
sentence implies — "gate on the renderer's first preference push" is not
implementable as written, because zoom and backdrop are two separate IPC
messages and **theme sends none at all**, so "readiness" would have to be
defined as a new explicit renderer→main signal, with a timeout fallback and its
own tests. That is a protocol, and it would be bought to remove ≤1 frame of a
correct-looking app plus a transparent window that reads as opening. "Build it
only if measured" exists to stop exactly this trade.

**What this does NOT settle, and #79 must not inherit it.** This declines a gate
for **today's** artifact. #79 adds a fourth settle step of a different class: not
a CSS reflow inside an already-visible window but a **window-manager move and
resize**, arriving at the same 38–55ms mark, when the window is already on
screen. Nothing measured here says that is tolerable, and the table above is the
instrument for deciding — re-run `gui-78.mjs` with bounds applied. If the move is
visible, the gate becomes justified and this decision is the record of what it
would have to beat.

**Instrument notes**, because two of them cost an afternoon and will again:

- **Playwright cannot measure this.** Under `_electron.launch()` the window never
  emits `ready-to-show`, so it is never shown and never painted
  (`getEntriesByType('paint')` is empty). `gui-78.mjs` is therefore the only
  driver here that does **not** use Playwright: it spawns Electron with
  `gui-78-probe.cjs` as the entry point, which hooks and then `require`s the
  app's real built main.
- **`NODE_OPTIONS=--require` never reaches Electron** (`NODE_OPTIONS` reads back
  `null` in main), and `context.addInitScript()` is too late — `launch()`
  resolves at ~380ms with the window already constructed and loading.
- **`--disable-gpu` is load-bearing in a background session.** With GPU
  compositing on, this app's window never paints at all here — no
  `ready-to-show`, `isVisible()` still false after 20s — while a standalone
  `BrowserWindow` with identical options and the same renderer file paints fine.
  An environment limit, not an app defect. The cost is that the flag flattens
  acrylic, so nothing here judges how the two materials LOOK.
- **Profile isolation is the premise.** Every launch gets a fresh `userData` via
  `app.setPath` before `ready`. Without it the driver measures a window that
  already opens at the persisted zoom and reports no artifact — an inherited pass
  of the kind [[2026-07-31-a-drivers-own-setup-can-revoke-what-it-measures]]
  caught with `.session-groups`. The guard for it reads the **first painted
  frame's dpr**, not `getZoomFactor()` at window construction: the latter is 1.0
  on a warm profile too, so a check on it can never fail.

**Reversibility:** easy, and nothing was reversed. The gate remains specified in
the ADR as a conditional fix; this records that the condition was tested and did
not fire.

## Related

- [[decisions]]
- [[2026-07-31-a-preference-lives-where-it-is-read]] — the ADR this amends; it
  prescribed the gate and required a measurement first
- [[2026-07-31-a-drivers-own-setup-can-revoke-what-it-measures]] — #77, the
  inherited-pass trap this driver's profile isolation exists to avoid
- [[2026-07-31-the-authored-pixel-is-css-the-measured-pixel-is-device]] — #71,
  the other ticket whose measurement changed its own answer
- [[2026-07-31-a-driver-establishes-its-premise]] — #65, extended here to the
  launch profile
