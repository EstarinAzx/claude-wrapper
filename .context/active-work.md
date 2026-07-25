---
type: active-work
project: claude-wrapper
updated: 2026-07-25
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-07-25, interactive wrap-up (`/preset init` funnel — two specs, nine tickets)_
_At commit: 1ac81bc on main (+ this wrap-up's `.context/` commit)_

## Current focus

**Nine tracer tickets queued and unblocked-in-order; a `/relay` chain drains
them unattended.** No production code changed this session — it was a full
`/preset init` funnel: grill → `/hp` → `to-spec` ×2 → `to-tickets`.

The owner picked three deferred threads (#24 subagent follow-ons, spatial
agents-view, paste/attach) and they were split into **two disjoint specs**:

- **#25 — Agents surface** (threads 1+2 merged: same data model, same panel)
- **#26 — Attachments** (input composition, independent)

Both `ready-for-agent`. Prior specs #9, #16, #20 stay closed; #1 (MVP umbrella,
unlabelled) remains out of scope.

## Ticket graph (native GitHub dependencies, verified)

```
#27 spike ──┐
            ├──> #30 live rows
#28 dock ───┴──> #31 nesting ──> #33 map

#29 prefactor ──> #32 paste ──┬──> #34 paperclip
                              └──> #35 replay chips
```

Unblocked right now: **#27, #28, #29**. No cross-spec edges — a stall on one
spec never blocks the other.

| # | Ticket | Spec |
|---|---|---|
| 27 | Spike: confirm the CLI emits `task_started`/`task_progress`/`task_updated` | #25 |
| 28 | Agents dock, hydrated from disk | #25 |
| 29 | Prefactor: widen the send payload to text + attachments | #26 |
| 30 | Live agent rows from task messages | #25 |
| 31 | Nested agents as a tree | #25 |
| 32 | Paste an image and send it | #26 |
| 33 | Map mode for the Agents panel | #25 |
| 34 | Paperclip: file picker and by-path attachments | #26 |
| 35 | Attachments survive replay | #26 |

## Done this session

- **Grilled** the three threads to settled decisions (12 questions), grounded in
  fact-finding rather than guesswork: read `sdk.d.ts` for the task-message
  types, inspected the local transcript store for sidecar shape and image-block
  size, confirmed the paperclip is decorative and the transcript parser is
  text-only.
- **`/hp`** — three new MVD sections in [[happy-path]] (watch agents live,
  review a past session's agents, send a screenshot and a file).
- **`to-spec` ×2** — #25 (40 user stories), #26 (30 user stories), each with
  seams agreed before writing.
- **`to-tickets`** — nine vertical slices, published in dependency order with
  native GitHub `blocked_by` edges (verified 0,0,0,2,1,1,1,2,2).
- **Two decisions** recorded:
  [[2026-07-25-agents-surface-task-messages-not-text-forwarding]] ·
  [[2026-07-25-attachments-embed-images-paths-for-files]].
- **Fixed `.claude/relay-leg.md`** — its slot section still named the retired
  `~/.claude/slot/lease-<family>.json` files; rewritten to the live
  `wisp snapshot` / `wisp snapshot revert` mechanic (wisp-router 2.0.36 local).

## Facts established this session (don't re-derive)

- **SDK task messages exist in the types** at `@anthropic-ai/claude-agent-sdk@^0.3.217`:
  `task_started` (task id, tool-use id, description, subagent type, prompt),
  `task_progress` (`usage.{total_tokens, tool_uses, duration_ms}`,
  `last_tool_name`, optional `summary` behind `agentProgressSummaries`),
  `task_updated` (status patch), `tool_progress` (`parent_tool_use_id`,
  elapsed, retry info). **Whether the installed CLI emits them is #27's job.**
- **Sidecars carry more than the parser keeps.** `agent-<id>.meta.json` has
  `agentType`, `description`, `toolUseId`, `spawnDepth`, `model`, and
  `parentAgentId` on nested agents. `parseMeta` currently keeps two of six.
- **Nesting is rare:** 184 depth-1 vs 1 depth-2 agents across the whole local
  store. Design for a flat fan; make nesting correct, not central.
- **Persisted images are big:** one screenshot = 263 KB of base64 in the session
  jsonl. This is why replay shows chips, not thumbnails.
- **`SDKUserMessage.message` is an Anthropic `MessageParam`** → image and
  document blocks are legal; the string-only path is the wrapper's choice.

## Known issues / not-our-bug

- **Subagents refusing upstream (RESOLVED — not a wrapper bug).** Diagnosed as
  the Wisp bridge / CLI harness. Grok subagents run fine via a `/slot` rebind.

## Pick up here

The relay chain owns the queue. If it stalls, the frontier query is: oldest open
`ready-for-agent` issue with `issue_dependencies_summary.blocked_by == 0`.

## Deferred (still no spec)

Live-tail external sessions, N-concurrent engines, fork-on-resume, global
project switcher. Busy-switch could graduate from *block* to
*detach-with-notice* ([[2026-07-23-busy-switch-block-not-detach]]). From #26's
out-of-scope: drag-and-drop attachments, thumbnails on replay, multiline
composer. From #25's: cross-session agent archive, agent control (kill/retry),
map pan/zoom, token totals for historical agents.

## Landmines (carried forward)

- **Wisp `options.model` = the alias/family NAME, never a resolved model id** — a
  resolved id hangs the turn. See [[2026-07-24-wisp-alias-routes-by-name]].
- **Never run bare `wisp snapshot`** — with no family argument it snapshots
  *every* row, and a held `haiku` snapshot blocks the next `/slot` rebind. Clear
  with `wisp snapshot revert <family>` per row. (Hit live this session.)
- **New `window.api` channel → add to ALL FOUR mock sites** or App-render tests
  throw: `tests/chat-harness.ts` + inline mocks in `tests/sidebar.test.tsx`,
  `tests/session.test.tsx`, `tests/shell.test.tsx`. Guard every IPC with
  `isTrustedIpc`. **#28, #29, #34 all trip this.**
- **#29 is the regression-risk ticket** — it touches the core prompt path. The
  text-only-stays-a-plain-string test is the guard; never let it be "fixed" by
  updating the expectation.
- **Subagent correlation:** live `parent_tool_use_id` ↔ persisted `agentId` via
  `agent-<id>.meta.json` `toolUseId`. `parseTranscript(raw, { includeSidechain:
  true })` for a subagent's own file. `<Chat>` is reused read-only in the drawer
  — a replayed subagent tool card has no `subagent` field, so no nested drawer
  (flat one level, by design).
- Resume ceiling + `sessionId()` accessor + native-store facts + Tailwind
  `@theme` + engine legible-error pins — unchanged, see [[pick-up]].

## Related

- [[overview]] · [[decisions]] · [[pick-up]] · [[stack]] · [[happy-path]]
- [[2026-07-25-agents-surface-task-messages-not-text-forwarding]] ·
  [[2026-07-25-attachments-embed-images-paths-for-files]]
- [[2026-07-24-wisp-alias-routes-by-name]] ·
  [[2026-07-24-ui-polish-model-picker-subagent-viewer]]
