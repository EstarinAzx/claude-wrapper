---
type: active-work
project: claude-wrapper
updated: 2026-07-23
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-07-23 by relay `relay-leg` leg 5 (background, unattended)_
_At commit: 80591fb on main_

## Current focus

**None active.** The **spec #9** batch (session history / switching / agents
view) is fully delivered and the spec is closed. The `relay-leg` chain drained
its queue one ticket per leg (legs 1–5: **#10 → #11 → #12 → #13 → #14**) and has
signalled `stop: true` — no leg 6. Nothing is queued for an agent.

## State

- **Relay chain `relay-leg`: complete.** #14 was the last ticket; the body's
  queue-empty branch fired, so the chain stopped itself (no further legs). State
  file `.claude/relay/relay-leg.md` carries `stop: true`.
- **Done this leg (#14, `80591fb`):** refresh + busy-switch polish, renderer-only.
  - **Refresh:** `Sidebar.tsx` now refreshes the session list on window `focus`
    and via a manual **Refresh sessions** button (`aria-label="Refresh sessions"`,
    first child of `.sidebar-head-actions`). The fetch is a stable `refresh`
    callback with a monotonic request-id ref that drops stale/out-of-order
    responses; still also fires on `[cwd, activeId]` (keeps the fresh-session-
    joins + highlight behaviour). A session created in an external terminal now
    appears after a refresh, no restart.
  - **Busy-switch = block:** while a turn streams (`busy`), session rows and
    **New chat** are `disabled`, and `useChat.openSession`/`newChat` early-return
    on `busy`. Mid-stream switching is impossible → no half-streamed answer can
    leak into another pane; the `chat:target` unconditional `close()` is never hit
    mid-turn. Stop is the escape hatch. See
    [[2026-07-23-busy-switch-block-not-detach]].
  - Grunt impl by a Grok subagent (slot `haiku` → `xai/grok-4.5`); reviewed +
    integrated by Fable, slot reverted clean. Gate green: typecheck ·
    **109/109** · build.
- **Blocked:** nothing.

## Pick up here

The batch is done — there is no next relay ticket. Only open issue is **#1**
(the original MVP umbrella spec, unlabelled), which is not agent-ready work.
Future effort starts a new spec (see Deferred) via the normal
`/preset init` → to-spec → to-tickets flow, not this chain.

## Deferred (own future specs)

Fancy spatial agents-view (session boxes in a canvas), live-tail external
sessions, N-concurrent engines, fork-on-resume, global project switcher.
Busy-switch could later graduate from *block* to *detach-with-notice* — the
reversal path is written in [[2026-07-23-busy-switch-block-not-detach]].

## Open loose ends

- **Sidebar visual pass (open since #11):** rows use the Frost Mono tokens
  directly rather than a fresh impeccable pass; a live Electron visual check vs
  `docs/design/frost-mono-reference.png` was deferred (no automatable
  folder-picker in an unattended leg). #13 added the active-row mint bar + New
  chat button; #14 added the **Refresh** glyph beside them — worth an eyeball in
  an interactive session (do the three head glyphs + active bar read right
  against the reference?).
- **Ecosystem:** the global relay skill was edited during setup (per-leg naming)
  → per CLAUDE.md, sync the ecosystem-kb vault + `/preset health` before any
  template push (not a relay-leg concern; carry for an interactive session).

## Related

- [[overview]] · [[decisions]] · [[pick-up]] · [[happy-path]]
- [[2026-07-23-busy-switch-block-not-detach]] ·
  [[2026-07-23-resume-via-target-close-rebuild]] ·
  [[2026-07-23-session-id-accessor-not-event]] · [[2026-07-23-bg-isolation-none]]
- Spec #9 (closed) + tickets #10–#14 (all closed) on the tracker.
