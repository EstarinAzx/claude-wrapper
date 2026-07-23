---
type: active-work
project: claude-wrapper
updated: 2026-07-23
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-07-23 by relay `relay-leg` leg 2 (background, unattended)_
_At commit: f6644c2 on main_

## Current focus

Draining the **spec #9** queue (session history / switching / agents view) via
the `relay-leg` relay chain — one ticket per leg, `max_legs 8`, serial (N=1).
Legs 1–2 landed **#10** then **#11**; the chain hands off to leg 3 for **#12**.

## State

- **In flight (background):** relay chain `relay-leg`. Legs 1–2 done; leg 3
  spawns for #12. Self-paced, edits the shared checkout
  ([[2026-07-23-bg-isolation-none]]).
- **Done this leg (#11, `f6644c2`):** past sessions now list in a collapsible
  left sidebar.
  - New main module `src/main/session-store.ts`: `encodeCwd` (cwd → its encoded
    dir under `~/.claude/projects/`, every non-alphanumeric → `-`), a **pure
    `summary(raw, id)`** that derives `SessionMeta` (`id` = filename stem, `title`
    = first user message truncated to 80, `lastUpdated` = max line timestamp,
    `messageCount`) from raw JSONL with a **lenient** parser (skips unknown/bad
    lines, never throws), and `listSessions(cwd)` (newest-first).
  - `SessionMeta` contract in `src/shared/session-types.ts`. Trusted-IPC-guarded
    `session:list` channel + preload `listSessions()`; main holds the cwd, so no
    cwd crosses IPC and the renderer never touches fs.
  - New `Sidebar` component (collapsible, empty state, read-only rows) in an
    `App` `workspace` row. Native store is source of truth → externally-created
    sessions appear.
  - Grunt impl (store module + its unit tests) done by a Grok subagent via the
    slot skill (`haiku` → `xai/grok-4.5`); reviewed + integrated by Fable. Slot
    reverted clean. Gate green: typecheck · **90/90** · build.
- **Blocked:** nothing. #12 is oldest open `ready-for-agent`; #13, #14 follow by
  creation order (oldest-first frontier rule — no native dependency edges, so
  legs must honour pick-up order, which they do).

## Pick up here

See [[pick-up]] — next is **#12** (open a past session — replay transcript). If
the relay chain is still live in `claude agents`, leg 3 is already on it; only
pick up by hand if the chain died (crash / `max_legs` / `stop: true` before the
queue emptied).

## Skills for next leg

- **#12 = lenient replay parser + transcript view.** The read seam already
  exists: `window.api.listSessions()` → `SessionMeta[]`, and `SessionMeta.id`
  (filename stem == sessionId) is the join key to load one session's `*.jsonl`.
  Reuse `summary()`'s line-by-line lenient parse in `session-store.ts` as the
  reference pattern for a NEW pure transcript parser (fixture JSONL string →
  ordered messages, no fs, map known line types, skip unknown, never throw).
  Sidebar rows are currently read-only (`.session-row`, non-interactive) — #12
  makes them openable and renders the replay in the chat column.
- **#13 (resume UX)** consumes `sessionId()` + `runTurn(..., resume)`. Ceiling
  in [[2026-07-23-session-id-accessor-not-event]]: retargeting resume on a live
  engine means rebuilding the cached query (or `close()` + fresh engine), since
  `ensureQuery` early-returns once built.

## Deferred (own future specs)

Fancy spatial agents-view (session boxes in a canvas), live-tail external
sessions, N-concurrent engines, fork-on-resume, global project switcher.

## Open loose ends

- Local `main` pushed through this leg's wrap-up (relay body pushes each leg).
- **Sidebar visual pass:** applied the existing Frost Mono tokens directly (a
  bounded extension of the already-designed system) rather than a fresh
  impeccable pass; a live Electron visual check vs
  `docs/design/frost-mono-reference.png` was deferred (no automatable
  folder-picker in an unattended leg). Worth an eyeball in an interactive
  session.
- **Ecosystem:** the global relay skill was edited during setup (per-leg naming)
  → per CLAUDE.md, sync the ecosystem-kb vault + `/preset health` before any
  template push (not a relay-leg concern; carry for an interactive session).

## Related

- [[overview]] · [[decisions]] · [[pick-up]] · [[happy-path]]
- [[2026-07-23-session-id-accessor-not-event]] · [[2026-07-23-bg-isolation-none]]
- Spec #9 + tickets #12–#14 on the tracker (canonical).
