---
type: active-work
project: claude-wrapper
updated: 2026-07-24
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-07-24, interactive session (post-spec-#16 follow-up)_
_At commit: 16b0884 on main_

## Current focus

**None active.**

## Done (interactive, post-chain) — permission-mode toggle (`16b0884`)

Owner-requested: a **second titlebar pill** cycles **Bypass → Accept Edits →
Ask**, pinning `permissionMode` into the SDK query options. New
`src/main/permission-mode.ts` (in-memory, **default `bypassPermissions`**) + pure
`toPermissionOptions` (bypass adds `allowDangerouslySkipPermissions`). Engine
gained a 5th injected getter `getPermissionOptions` (mirrors `getEnv`); guarded
IPC `permission:set-mode` rebuilds the engine but **resumes the current session**
(`pendingResume`) so the conversation is kept — unlike a backend flip. Pill
disabled while `busy`; **Bypass carries a danger tint**. **Reverses**
[[2026-07-23-permission-inherits-host]] → see
[[2026-07-24-in-app-permission-mode-toggle]]. Gate green: typecheck · **153/153**
· build.

⚠️ **Landmine — default bypass:** the app now auto-runs every tool (Bash writes/
deletes/network, edits) with **no confirmation** by default, whole session, until
the user cycles to Ask/Accept Edits. Deliberate owner choice. Not host-inherited
anymore. The **spec #16** batch (Native ⇄ Wisped backend toggle) is
fully delivered and the spec is closed. The `ticket-loop` relay chain drained
its queue one ticket per leg (legs 1–3: **#17 → #18 → #19**) and has signalled
`stop: true` — no leg 4. Nothing is queued for an agent. (Spec #9 —
session history — was closed earlier; tickets #10–#14.)

## State

- **Relay chain `ticket-loop`: complete.** #19 was the last ticket; the
  queue-empty branch fired, so the chain stopped itself. State file
  `.claude/relay/ticket-loop.md` carries `stop: true`.
- **Done this leg (#19, `0660ce6`):** click-to-flip backend toggle.
  - Titlebar pill is now a `<button>`; clicking it flips the backend. New
    guarded one-way IPC **`backend:set-mode`** takes the target mode, reuses the
    `chat:target` teardown (`engine.close()` + `cancelAll()` + `engine=null`) and
    clears `pendingResume` so the flip lands in a **fresh chat**. Refuses `wisped`
    when the launch env carried no wisp routing (native-lock).
  - Main **broadcasts `backend:changed`**; `App` subscribes on mount and the pill
    re-renders from the broadcast (authoritative, so the native-lock no-op keeps
    the pill put). The lazy `chat:send` rebuilds the engine → next turn spawns
    against the new mode via the #17 resolver, no extra plumbing.
  - Pill `disabled` while `busy` (reuses #14 block) and when wisped unavailable.
  - See [[2026-07-24-click-flip-backend-toggle]]. Gate green: typecheck ·
    **137/137** · build.
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

- **Sidebar visual pass (open since #11):** the deferred live eyeball happened
  (interactive session, 2026-07-24). The three head glyphs + active bar read
  right against the reference, and it surfaced one gap: #14's busy-block had
  **no visual affordance** (disabled rows looked identical mid-stream). Fixed in
  **#15 (`31e7910`)** — disabled rows + New chat now dim to 0.55 +
  `pointer-events: none` while streaming (active mint bar stays, dimmed), and the
  head glyph gap went 2px→4px. Routed through impeccable/polish vs Frost Mono.
  Remaining: no full impeccable *redesign* of the rows (they still use the tokens
  directly), but nothing reads wrong — treat as closed unless a deeper pass is
  wanted.
- **Ecosystem:** the global relay skill was edited during setup (per-leg naming)
  → per CLAUDE.md, sync the ecosystem-kb vault + `/preset health` before any
  template push (not a relay-leg concern; carry for an interactive session).

## Related

- [[overview]] · [[decisions]] · [[pick-up]] · [[happy-path]]
- [[2026-07-23-busy-switch-block-not-detach]] ·
  [[2026-07-23-resume-via-target-close-rebuild]] ·
  [[2026-07-23-session-id-accessor-not-event]] · [[2026-07-23-bg-isolation-none]]
- Spec #9 (closed) + tickets #10–#14 (all closed) on the tracker.
