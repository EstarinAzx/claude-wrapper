---
type: active-work
project: claude-wrapper
updated: 2026-07-23
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-07-23 by relay `relay-leg` leg 3 (background, unattended)_
_At commit: bb94e3d on main_

## Current focus

Draining the **spec #9** queue (session history / switching / agents view) via
the `relay-leg` relay chain — one ticket per leg, `max_legs 8`, serial (N=1).
Legs 1–3 landed **#10 → #11 → #12**; the chain hands off to leg 4 for **#13**.

## State

- **In flight (background):** relay chain `relay-leg`. Legs 1–3 done; leg 4
  spawns for #13. Self-paced, edits the shared checkout
  ([[2026-07-23-bg-isolation-none]]).
- **Done this leg (#12, `bb94e3d`):** clicking a sidebar row replays that
  session's transcript into the chat pane (read-only).
  - New pure main module `src/main/transcript.ts`: `parseTranscript(raw):
    TranscriptMessage[]` — maps `user` (string) / `assistant` (text + tool_use)
    blocks, backfills `tool_result` onto its tool by `tool_use_id`, skips
    sidechains + unknown/malformed lines, never throws. No fs.
  - `TranscriptMessage` shared union (user/assistant/tool) in
    `src/shared/session-types.ts` — `ChatMessage` minus renderer-transient
    fields.
  - `readTranscript(cwd,id)` in `session-store.ts` (fs read + parse) →
    `session:transcript` IPC (isTrustedIpc-guarded; main holds cwd) →
    `loadTranscript(id)` preload → `useChat.replay()` maps to `ChatMessage[]`
    (fresh ids, `permission: null`; tool results summarised in the renderer via
    `resultSummary`, exactly like the live path).
  - Sidebar rows became `.session-row-btn` buttons; `App.openSession` wires
    click → `loadTranscript` → `replay`. Design chosen in
    [[2026-07-23-transcript-parser-pure-renderer-summarises]].
  - Grunt impl (`parseTranscript` + its 8 unit tests) done by a Grok subagent
    via the slot skill (`haiku` → `xai/grok-4.5`); reviewed + integrated by
    Fable. Slot reverted clean. Gate green: typecheck · **99/99** · build.
- **Blocked:** nothing. #13 is oldest open `ready-for-agent`; #14 follows by
  creation order (no native dependency edges, so legs honour pick-up order).

## Pick up here

See [[pick-up]] — next is **#13** (resume — continue a reopened session, MVD).
If the relay chain is still live in `claude agents`, leg 4 is already on it;
only pick up by hand if the chain died (crash / `max_legs` / `stop: true`
before the queue emptied).

## Skills for next leg

- **#13 = resume UX (continue-in-place).** Read seam is done: clicking a row
  loads + replays (`window.api.loadTranscript(id)` → `TranscriptMessage[]`), but
  replay is **read-only** — the input is not yet armed to continue. #13 arms it:
  on open, remember the session id; sending routes through the engine with that
  id as `resume` so appended turns land in the same `*.jsonl`. Engine already
  exposes `sessionId(): string | null` + `runTurn(prompt, onEvent, resume?)`
  ([[2026-07-23-session-id-accessor-not-event]]).
  - **Ceiling (carry):** retargeting resume on a *live* engine means rebuilding
    the cached query (or `close()` + fresh engine on foreground switch), since
    `ensureQuery` early-returns once the queue exists. A "New chat" control
    (fresh session, no resume) pairs naturally here.
- **#14 = refresh + busy-switch polish.** Manual refresh + refresh-on-focus for
  the sidebar list; predictable handling when switching away mid-stream (spec
  keeps one live engine — detach the foreground turn).

## Deferred (own future specs)

Fancy spatial agents-view (session boxes in a canvas), live-tail external
sessions, N-concurrent engines, fork-on-resume, global project switcher.

## Open loose ends

- Local `main` pushed through this leg's wrap-up (relay body pushes each leg).
- **Sidebar visual pass (still open from #11):** rows extended with the existing
  Frost Mono tokens directly rather than a fresh impeccable pass; a live
  Electron visual check vs `docs/design/frost-mono-reference.png` was deferred
  (no automatable folder-picker in an unattended leg). #12 only added a button
  reset + focus ring on `.session-row-btn`. Worth an eyeball in an interactive
  session.
- **Ecosystem:** the global relay skill was edited during setup (per-leg naming)
  → per CLAUDE.md, sync the ecosystem-kb vault + `/preset health` before any
  template push (not a relay-leg concern; carry for an interactive session).

## Related

- [[overview]] · [[decisions]] · [[pick-up]] · [[happy-path]]
- [[2026-07-23-transcript-parser-pure-renderer-summarises]] ·
  [[2026-07-23-session-id-accessor-not-event]] · [[2026-07-23-bg-isolation-none]]
- Spec #9 + tickets #13–#14 on the tracker (canonical).
