---
type: active-work
project: claude-wrapper
updated: 2026-07-25
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-07-25, relay leg 4 (`.claude/relay-leg.md`, N=1) — ticket #30_
_At commit: `f869f1f` on main (+ this leg's `.context/` commit)_

## Current focus

**A `/relay` chain is draining nine tracer tickets, one per leg, unattended.**
Two disjoint specs are open: **#25 Agents surface** and **#26 Attachments**.
Prior specs #9, #16, #20 stay closed; #1 (MVP umbrella, unlabelled) is out of
scope.

Legs 1–4 delivered **#27** (spike, no production code), **#28** (the Agents
dock), **#29** (the send-payload prefactor) and **#30** (live agent rows). Four
of nine are down. The Agents spec has one ticket ready and the Attachments spec
has one.

## Ticket graph (native GitHub dependencies)

```
#27 spike ✅──┐
              ├──> #30 live rows ✅
#28 dock  ✅──┴──> #31 nesting ──> #33 map     ← next
                                   (unblocks on #31)
#29 prefactor ✅──> #32 paste ──┬──> #34 paperclip
                                └──> #35 replay chips
```

Unblocked right now: **#31, #32**. No cross-spec edges — a stall on one spec
never blocks the other.

| # | Ticket | Spec | State |
|---|---|---|---|
| 27 | Spike: confirm the CLI emits the task messages | #25 | **closed** — confirmed |
| 28 | Agents dock, hydrated from disk | #25 | **closed** — `c02f482` |
| 29 | Prefactor: widen the send payload | #26 | **closed** — `397c0a1` |
| 30 | Live agent rows from task messages | #25 | **closed** — `f869f1f` |
| 31 | Nested agents as a tree | #25 | open, unblocked ← **next** |
| 32 | Paste an image and send it | #26 | open, unblocked |
| 33 | Map mode for the Agents panel | #25 | blocked by #31 |
| 34 | Paperclip: file picker and by-path attachments | #26 | blocked by #32 |
| 35 | Attachments survive replay | #26 | blocked by #32 |

## Done this leg (#30)

The engine had **no `type: 'system'` branch**, so the whole task lifecycle was
received and dropped. It now has one, and the existing `subagent` event was
widened (not duplicated) with optional `taskId` / `agentType` / `description` /
`totalTokens` / `toolUses` / `durationMs` / `lastToolName`. Gate green:
typecheck · **291/291** (+43) · build. Full rationale in
[[2026-07-25-live-rows-two-sources-one-event]].

- **`src/main/engine.ts`** — `handleTaskMessage` for task_started / task_progress
  / task_updated / task_notification, a `taskToParent` map, and `subagentEvent()`
  as the single event builder.
- **`src/shared/subagent-types.ts`** — `LiveAgent`, `AgentRow`, and the pure
  `mergeAgents(disk, live)`.
- **`useChat`** returns `liveAgents`; **`AgentsDock`** takes it as a prop and
  renders the merged list with status, context size, tool count, elapsed and
  last tool.

The `mergeAgents` implementation + tests and the `useChat` accumulator + tests
were delegated to two parallel Grok subagents through one `haiku` Slot rebind,
reviewed and landed with one cleanup (a non-null assertion removed from
`buildRow`). The Slot was reverted before the gate. The engine seam, the dock
render and all seam tests were written directly.

## Facts established this leg (don't re-derive)

- **`taskToParent` is the bash filter.** `task_progress`/`task_updated` do not
  carry `task_type` at all, so filtering happens by only ever registering task
  ids from a `local_agent` `task_started` and dropping any message whose
  `task_id` is unregistered. Don't add a per-message `task_type` check — it
  cannot work.
- **The `parent_tool_use_id` path was kept, not replaced.** It is the presence
  floor; both sources upsert the same key. A test pins that forwarded output
  adds no second `running` event.
- **Absent-not-zero is enforced in three places** (engine `assignDefined`, merge,
  render) and **both halves are mutation-verified** — writing `?? 0` in the
  engine reds the absent-usage tests, and opening the `local_agent` filter reds
  the Bash test. If either goes red, the bug is in the code.
- **A settled agent is not re-failed by the drain** — terminal task messages
  remove the id from the open set before abort/error/close runs.
- **Elapsed is the CLI's `duration_ms`, rendered as given** — no local timer, by
  choice. It freezes between ticks (~2.5–3s); upgrade path is in the decision.
- `tests/engine.test.ts > engine task messages` now holds the **real wire shapes**
  (copied from the #27 spike JSONL) as reusable fixtures.
- **The sessions rail renders `<li>` too** — scope any dock list-item count with
  `within(dock())` or it double-counts.

## Facts from #29 (still current)

- **The attachment encoding is already built** — #29 shipped both branches.
  **#32 needs the composer and the policy module, no engine work.** The
  embeddable allowlist is `EMBEDDABLE_IMAGE_TYPES` in
  `src/shared/attachment-types.ts` — import it, don't restate it.
- **`tests/engine.test.ts` has `capturingStub()` and `sendOne(payload)`** —
  #32's Seam-1 assertions should reuse them rather than re-inlining a capture.
- **Never let the plain-string pin be "fixed" by updating its expectation** —
  mutation-verified; see
  [[2026-07-25-send-payload-encoding-lands-in-the-prefactor]].

## Facts from #28 (still current)

- **`listSubagents` returns `SubagentInfo[] | null`** — `[]` none spawned
  (ENOENT), `null` could not read. #30's merge preserves the split; the dock now
  shows live rows even on the `null` branch. Contract in
  [[2026-07-25-agents-dock-disk-contract]].
- **A sidecar's `model` is the family word asked for, not the resolved target** —
  spec #25's Further Notes are wrong on this.
- **Real sidecar coverage** (28 sidecars): `agentType`/`description`/`toolUseId`/
  `spawnDepth` 28/28, `model` 18/28, **`parentAgentId` 0/28**. Nothing local
  exercises nesting — **#31 needs fabricated fixtures.**
- **Don't re-simplify the drawer's `sessionId` prop away** — a rail-opened
  session has no engine, so the engine answers `null`.

## Facts from the #27 spike (still current)

- All four task messages arrive: `task_started`, `task_progress`,
  `task_updated`, and the undocumented **`task_notification`** (the real
  completion signal: final `usage`, result `summary`, `output_file`).
- **`task_updated` is terminal-only**; `local_bash` tasks share the stream.
- **Nested agents are invisible to `parent_tool_use_id`** — a nested subagent's
  traffic is never forwarded. #31's tree comes from task messages + the `Agent`
  tool_use block, plus the sidecar `parentAgentId`. No depth field on any
  message. **This is the finding that shapes #31.**
- **One correlation key** (`task_started.tool_use_id` === `Agent` block id ===
  `parent_tool_use_id` === sidecar `toolUseId`); `task_id` is separate — keep
  both.
- **`total_tokens` is cumulative context**, ~52k floor — the panel labels it
  `ctx`, not spend.
- `description` live-updates for free; the spawning tool is named **`Agent`**.

## Known issues / not-our-bug

- **Native backend is unobservable on this host** — the CLI answers `Not logged
  in · Please run /login` with the wisp vars stripped. Native-mode behaviour is
  assumed, not measured.

## Pick up here

The relay chain owns the queue; see [[pick-up]]. If it stalls, the frontier
query is: oldest open `ready-for-agent` issue with
`issue_dependencies_summary.blocked_by == 0` — currently **#31**.

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
- **Never run bare `wisp snapshot`** — with no family it snapshots *every* row.
  Clear with `wisp snapshot revert <family>`. (`wisp snapshot list` is not a
  subcommand; the retired `~/.claude/slot/lease-*.json` files are gone.)
- **New `window.api` channel → add to ALL FOUR mock sites** or App-render tests
  throw: `tests/chat-harness.ts` + inline mocks in `sidebar`/`session`/`shell`
  tests. Guard every IPC with `isTrustedIpc`. **Only #34 still trips this** —
  #30 added no channel either.
- Resume ceiling + `sessionId()` accessor + native-store facts + Tailwind
  `@theme` + engine legible-error pins — unchanged, see [[pick-up]].

## Related

- [[overview]] · [[decisions]] · [[pick-up]] · [[stack]] · [[happy-path]]
- [[2026-07-25-live-rows-two-sources-one-event]] ·
  [[2026-07-25-send-payload-encoding-lands-in-the-prefactor]] ·
  [[2026-07-25-agents-dock-disk-contract]] ·
  [[2026-07-25-sidecar-model-is-family-not-resolved]]
- [[2026-07-25-task-messages-confirmed-live-shape]] ·
  [[2026-07-25-agents-surface-task-messages-not-text-forwarding]] ·
  [[2026-07-25-attachments-embed-images-paths-for-files]]
- [[2026-07-24-wisp-alias-routes-by-name]] ·
  [[2026-07-24-ui-polish-model-picker-subagent-viewer]]
