---
type: active-work
project: claude-wrapper
updated: 2026-07-25
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-07-25, relay leg 1 (`.claude/relay-leg.md`, N=1) — ticket #27_
_At commit: `02b0cd5` on main (+ this leg's `.context/` commit)_

## Current focus

**A `/relay` chain is draining nine tracer tickets, one per leg, unattended.**
Two disjoint specs are open: **#25 Agents surface** and **#26 Attachments**.
Prior specs #9, #16, #20 stay closed; #1 (MVP umbrella, unlabelled) is out of
scope.

Leg 1 delivered **#27** — the spike gating the whole live-metrics half of #25.
No production code changed (by design: the spike's deliverable is a finding).

## Ticket graph (native GitHub dependencies)

```
#27 spike ✅──┐
              ├──> #30 live rows
#28 dock ─────┴──> #31 nesting ──> #33 map

#29 prefactor ──> #32 paste ──┬──> #34 paperclip
                              └──> #35 replay chips
```

Unblocked right now: **#28, #29**. #30 and #31 still wait on #28. No cross-spec
edges — a stall on one spec never blocks the other.

| # | Ticket | Spec | State |
|---|---|---|---|
| 27 | Spike: confirm the CLI emits the task messages | #25 | **closed** — confirmed |
| 28 | Agents dock, hydrated from disk | #25 | open, unblocked ← **next** |
| 29 | Prefactor: widen the send payload to text + attachments | #26 | open, unblocked |
| 30 | Live agent rows from task messages | #25 | blocked by #28 |
| 31 | Nested agents as a tree | #25 | blocked by #28 |
| 32 | Paste an image and send it | #26 | blocked by #29 |
| 33 | Map mode for the Agents panel | #25 | blocked by #31 |
| 34 | Paperclip: file picker and by-path attachments | #26 | blocked by #32 |
| 35 | Attachments survive replay | #26 | blocked by #32 |

## Done this leg (#27)

Two instrumented turns against the installed CLI (2.1.217, SDK 0.3.217) using a
throwaway harness that mirrors `engine.ts`'s query options and dumps every
message to JSONL. **Verdict: all three task messages are real; #30 keeps full
scope.** Finding recorded as a comment on #25
(`issues/25#issuecomment-5077330745`) and folded into
[[2026-07-25-task-messages-confirmed-live-shape]]. Gate green, tree clean, no
commits on the ticket branch.

## Facts established by the spike (don't re-derive)

- **All four task messages arrive** — `task_started`, `task_progress`,
  `task_updated`, and an undocumented **`task_notification`**, which is the real
  completion signal (final `usage`, result `summary`, `output_file` path).
- **`task_updated` is terminal-only** — one `completed` patch per agent, no
  `running`/`pending`, and none at all for bash tasks.
- **`local_bash` tasks ride the same stream** → the panel must filter
  `task_type === 'local_agent'`. `skip_transcript` was `false` on all of them,
  so it is not a usable filter.
- **Nested agents are invisible to `parent_tool_use_id`** — a nested subagent's
  traffic is never forwarded; it surfaces only via its own task messages. #31's
  tree comes from task messages + the `Agent` tool_use block, never from
  forwarded traffic. No depth field exists on any message.
- **One correlation key:** `task_started.tool_use_id` === `Agent` tool_use block
  id === `parent_tool_use_id` === sidecar `toolUseId`. `task_id` is separate and
  is the only key on `task_progress`/`task_updated` — keep both.
- **Ordering at spawn is stable:** `Agent` tool_use block → `task_started` →
  forwarded traffic. A row can exist before any output does.
- **Progress is event-driven**, ~one tick per tool transition (2.5–3s apart),
  not on a timer. `duration_ms` is agent-elapsed and monotonic.
- **`total_tokens` is cumulative context**, ~52k floor for a trivial subagent —
  not spend.
- **`description` live-updates for free**; `summary` needs
  `agentProgressSummaries` and landed on 1 tick in 7. Leave the flag off.
- The spawning tool is named **`Agent`**, not `Task`. Nothing in `src/` keys off
  that string today. `tool_progress` and `background_tasks_changed` never fired.
- **`handleMessage` has no `type: 'system'` branch** — every one of these is
  received and dropped today.

## Facts from the spec session (still current)

- **Sidecars carry more than the parser keeps.** `agent-<id>.meta.json` has
  `agentType`, `description`, `toolUseId`, `spawnDepth`, `model`,
  `parentAgentId`; `parseMeta` keeps two of six.
- **Nesting is rare:** 184 depth-1 vs 1 depth-2 agents across the local store.
  Design for a flat fan; make nesting correct, not central.
- **Persisted images are big:** one screenshot = 263 KB of base64 in the session
  jsonl. Hence chips on replay, not thumbnails.
- **`SDKUserMessage.message` is an Anthropic `MessageParam`** → image and
  document blocks are legal; the string-only path is the wrapper's choice.

## Known issues / not-our-bug

- **Native backend is unobservable on this host** — the CLI answers `Not logged
  in · Please run /login` with the wisp vars stripped. All spike findings are
  from the wisped backend. Not a wrapper bug; it does mean native-mode
  behaviour is assumed, not measured.
- **Subagents refusing upstream (RESOLVED)** — was the Wisp bridge / CLI
  harness, not the wrapper. Grok subagents run fine via a `/slot` rebind.

## Pick up here

The relay chain owns the queue; see [[pick-up]]. If it stalls, the frontier
query is: oldest open `ready-for-agent` issue with
`issue_dependencies_summary.blocked_by == 0` — currently **#28**.

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
  with `wisp snapshot revert <family>` per row.
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
- [[2026-07-25-task-messages-confirmed-live-shape]] ·
  [[2026-07-25-agents-surface-task-messages-not-text-forwarding]] ·
  [[2026-07-25-attachments-embed-images-paths-for-files]]
- [[2026-07-24-wisp-alias-routes-by-name]] ·
  [[2026-07-24-ui-polish-model-picker-subagent-viewer]]
