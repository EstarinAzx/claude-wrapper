---
type: active-work
project: claude-wrapper
updated: 2026-07-23
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-07-23 by relay `relay-leg` leg 4 (background, unattended)_
_At commit: 053ea95 on main_

## Current focus

Draining the **spec #9** queue (session history / switching / agents view) via
the `relay-leg` relay chain — one ticket per leg, `max_legs 8`, serial (N=1).
Legs 1–4 landed **#10 → #11 → #12 → #13**; the chain hands off to leg 5 for the
last ticket, **#14**.

## State

- **In flight (background):** relay chain `relay-leg`. Legs 1–4 done; leg 5
  spawns for #14. Self-paced, edits the shared checkout
  ([[2026-07-23-bg-isolation-none]]).
- **Done this leg (#13, `053ea95`):** reopening a session now continues it in
  place — resume, not a fork. Design in
  [[2026-07-23-resume-via-target-close-rebuild]].
  - **Renderer:** `useChat` gained `activeSessionId`; `openSession(id)` replays
    the transcript **and** `window.api.targetSession(id)`; `newChat()` clears the
    pane + `targetSession(null)`; `turn-end` reads the earned id via
    `window.api.currentSessionId()`. `replay` was folded into `openSession`.
  - **Sidebar:** active row highlighted (`aria-current="true"` + `.session-row-btn-active`
    mint bar) via a new `activeId` prop; a `New chat` icon button in the head
    (`.sidebar-head-actions` wrapper); the list refetches on `activeId` change so
    a fresh session joins it once it earns an id.
  - **Main/preload:** new `chat:target` (close engine + cancel perms + stash
    `pendingResume`) and `chat:session-id` (accessor) IPC; `chat:send` threads
    `pendingResume` into `runTurn`; folder pick clears it. Preload exposes
    `targetSession` + `currentSessionId`.
  - Grunt impl by a Grok subagent (slot `haiku` → `xai/grok-4.5`); reviewed +
    integrated by Fable, slot reverted clean. Gate green: typecheck · **104/104**
    · build.
- **Blocked:** nothing. #14 is the last open `ready-for-agent` in spec #9.

## Pick up here

See [[pick-up]] — next is **#14** (refresh + busy-switch polish). If the relay
chain is still live in `claude agents`, leg 5 is already on it; only pick up by
hand if the chain died (crash / `max_legs` / `stop: true` before the queue
emptied). #14 empties the spec #9 queue → the chain then signals `stop: true`.

## Skills for next leg

- **#14 = refresh + busy-switch polish** (last ticket in spec #9):
  - **Sidebar refresh:** a manual refresh affordance + refresh-on-focus for the
    session list, generalising #13's current refetch-on-`activeId` in
    `Sidebar.tsx` (which was the minimal way to make a fresh session appear).
  - **Busy-switch (the real carry from #13):** `chat:target` in
    `src/main/index.ts` currently `engine.close()`s **unconditionally**, so
    switching sessions (or New chat) *mid-stream* tears down the running turn and
    the renderer sees a `query closed` error. #14 should detach/finish the
    foreground turn gracefully before retargeting. Spec keeps **one live engine**
    — no concurrent streaming. See
    [[2026-07-23-resume-via-target-close-rebuild]].

## Deferred (own future specs)

Fancy spatial agents-view (session boxes in a canvas), live-tail external
sessions, N-concurrent engines, fork-on-resume, global project switcher.

## Open loose ends

- Local `main` pushed through this leg's wrap-up (relay body pushes each leg).
- **Sidebar visual pass (still open from #11):** rows use the Frost Mono tokens
  directly rather than a fresh impeccable pass; a live Electron visual check vs
  `docs/design/frost-mono-reference.png` was deferred (no automatable
  folder-picker in an unattended leg). #13 added the active-row mint bar + a
  New chat button in the head — worth an eyeball in an interactive session
  (does the New chat glyph + active bar read right against the reference?).
- **Ecosystem:** the global relay skill was edited during setup (per-leg naming)
  → per CLAUDE.md, sync the ecosystem-kb vault + `/preset health` before any
  template push (not a relay-leg concern; carry for an interactive session).

## Related

- [[overview]] · [[decisions]] · [[pick-up]] · [[happy-path]]
- [[2026-07-23-resume-via-target-close-rebuild]] ·
  [[2026-07-23-transcript-parser-pure-renderer-summarises]] ·
  [[2026-07-23-session-id-accessor-not-event]] · [[2026-07-23-bg-isolation-none]]
- Spec #9 + ticket #14 on the tracker (canonical).
