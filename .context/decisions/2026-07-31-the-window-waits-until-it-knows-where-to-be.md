---
type: decision
project: claude-wrapper
updated: 2026-07-31
tags: [context, decision]
---

# The window waits until it knows where to be

**Decision:** #79 remembers the window's size and position in renderer
`localStorage` (`window-bounds-v1`), pushes it to main on mount, and main
applies it with `setBounds` **before the window is ever shown**. The window is
shown when two facts hold — Chromium has something to paint, and the renderer
has said where the window goes — with a 1500ms timeout so a renderer that never
mounts cannot cost the user a window.

**This is a chosen feature, not a defect fix.** The record contains a
measurement that nothing persists; it contains no complaint that relaunching at
`1100×780` costs anything. Filed under the owner's autonomy grant of
2026-07-31 as wanted, and it should not be written up as fixing a defect.

## What was built

- `src/shared/window-bounds.ts` — `isBounds` (the trust boundary: **compared,
  never coerced**, four finite numbers, positive extent, negative position
  allowed) and `clampBounds` (the safety property).
- `src/renderer/src/useWindowBounds.ts` — lazy `useState(readStored)`, an
  unconditional mount push, and a listener that stores main's reports.
- `src/main/index.ts` — the `bounds:set` handler, a debounced `bounds:changed`
  report, and the show gate.
- `.claude/skills/run-desktop/gui-79.mjs` + `gui-79-probe.cjs`.

## Three things this settled

**1. Bounds are the first preference in this app that needs an answer before the
window exists — and that still does not buy a main-side store.**
[[2026-07-31-a-preference-lives-where-it-is-read]] forbids one in those words,
and its own conclusion supplies the alternative: construct hidden, tell it, then
show. Its amendment records the one sentence that is now false for bounds. The
tempting counter-argument — "main *reads* the bounds, so they belong to main" —
was tested and dies on the shipped counterexample: `backgroundMaterial` is
applied by main and stored by the renderer. **Main consuming a value does not
make it the persistence owner.**

**2. The gate #78 declined is affordable here because the SIGNAL is different,
not because the artifact is bigger.** #78 declined "gate on the renderer's first
preference push" as unimplementable-as-written: two independent messages racing,
plus a third preference that crosses no boundary. Bounds are one named message
with one meaning. **When a readiness gate looks expensive, check whether the
expense is in the waiting or in defining what "ready" means.**

Measured, `gui-79.mjs`, five runs, A/B on one build:

| | gated (shipped) | gate defeated |
|---|---|---|
| visible at the WRONG bounds | **0ms, 5/5 runs** | 0–49ms, on **4/5 runs** |
| on-screen move+resize | **0** | 1, intermittently |
| appears after construction | 139–149ms | 102–138ms |

**The ungated artifact is INTERMITTENT, and that is what settled it.** It is a
race, so the window jumps on most launches and not on others. A window that
lands somewhere different depending on machine load is worse than one that
reliably takes 7–45ms longer to appear.

**3. The clamp is a safety property, not validation, and its identity case is
the load-bearing test.** A stored position is a promise about a display layout
that may not exist: undock a laptop and the window restores entirely offscreen,
with no way to reach it — strictly worse than not remembering. But a clamp that
silently nudged *valid* bounds would satisfy every "it is on screen afterwards"
assertion while making the feature pointless, so **the table pins that valid
bounds pass through byte-identical** alongside the rescue cases. The display
list is read when applying, never cached at boot: a monitor can be unplugged
mid-session.

## Two traps this ticket walked into, recorded

**A zero-arg `vi.fn()` mock makes its own `mock.calls[0][0]` a type error.**
`vitest` infers an empty argument tuple, so a test that reaches for the callback
main was handed does not typecheck — while the suite itself passes, because
`vitest run` does not typecheck. The fix is to type the mock with the real
signature. **A mock that is loosely typed is not neutral; it is wrong in a
direction.**

**An instrument can report a gate's success as the artifact it was measuring.**
`boundsChangesWhileVisible` first compared each visible sample against the
previous sample *regardless of that sample's visibility*, so the window being
shown already-correct counted as a change on screen — the gated run scored 1
for doing exactly what it was supposed to. Both samples must be visible before a
difference between them is a thing anyone saw. Fourth instance in this project
of [[2026-07-31-the-authored-pixel-is-css-the-measured-pixel-is-device]]'s
lesson: **suspect the instrument first.**

## Deliberately not built

- **Maximised / fullscreen restore.** Bounds only — a legitimate follow-up.
  `getNormalBounds()` (not `getBounds()`) is what main reports, so maximising
  never overwrites the remembered size with a full-screen one; the omission
  cannot corrupt what is in scope.
- **Multi-window.** This app has exactly one, which is also why the gate's
  release hook is a module-level `let` rather than a map keyed by window.
- **Migrating the four existing preference keys** — forbidden by the same ADR.

**Reversibility:** easy. Two IPC channels and a hook; deleting the gate restores
the previous `ready-to-show` → `show` line exactly.

## Related

- [[decisions]]
- [[2026-07-31-a-preference-lives-where-it-is-read]] — amended by this ticket
- [[2026-07-31-the-window-is-shown-before-the-app-exists]] — #78, which measured
  the launch and declined the gate for the preferences whose signal is ambiguous
- [[2026-07-31-a-driver-establishes-its-premise]] — #65; here the premise is a
  pristine `userData` and a construction-time 1100×780
