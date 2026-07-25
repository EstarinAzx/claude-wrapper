---
type: active-work
project: claude-wrapper
updated: 2026-07-25
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-07-25, relay leg 5 (`.claude/relay-leg.md`, N=1) — ticket #31_
_At commit: `1888440` on main (+ this leg's `.context/` commit)_

## Current focus

**A `/relay` chain is draining nine tracer tickets, one per leg, unattended.**
Two disjoint specs are open: **#25 Agents surface** and **#26 Attachments**.
Prior specs #9, #16, #20 stay closed; #1 (MVP umbrella, unlabelled) is out of
scope.

Legs 1–5 delivered **#27** (spike, no production code), **#28** (the Agents
dock), **#29** (the send-payload prefactor), **#30** (live agent rows) and
**#31** (nesting). Five of nine are down. Closing #31 unblocked **#33**, so the
Agents spec has one ticket ready and the Attachments spec has one.

## Ticket graph (native GitHub dependencies)

```
#27 spike ✅──┐
              ├──> #30 live rows ✅
#28 dock  ✅──┴──> #31 nesting ✅──> #33 map
#29 prefactor ✅──> #32 paste ──┬──> #34 paperclip     ← next is #32
                                └──> #35 replay chips
```

Unblocked right now: **#32, #33**. No cross-spec edges — a stall on one spec
never blocks the other.

| # | Ticket | Spec | State |
|---|---|---|---|
| 27 | Spike: confirm the CLI emits the task messages | #25 | **closed** — confirmed |
| 28 | Agents dock, hydrated from disk | #25 | **closed** — `c02f482` |
| 29 | Prefactor: widen the send payload | #26 | **closed** — `397c0a1` |
| 30 | Live agent rows from task messages | #25 | **closed** — `f869f1f` |
| 31 | Nested agents as a tree | #25 | **closed** — `1888440` |
| 32 | Paste an image and send it | #26 | open, unblocked ← **next** |
| 33 | Map mode for the Agents panel | #25 | open, unblocked |
| 34 | Paperclip: file picker and by-path attachments | #26 | blocked by #32 |
| 35 | Attachments survive replay | #26 | blocked by #32 |

## Done this leg (#31)

Nesting comes from the **sidecar's `parentAgentId` alone** — the live
`taskToParent` / `Agent`-tool_use-block edge that #30's decision nominated was
declined. Gate green: typecheck · **310/310** (+19) · build. Full rationale in
[[2026-07-25-agent-tree-edge-is-the-sidecar]].

- **`src/shared/agent-layout.ts`** (new) — the layout module, tree half:
  `buildAgentTree(rows): AgentNode[]` and `flattenAgentTree(nodes)`, pure,
  `AgentNode = { row, depth, children }`.
- **`src/shared/subagent-types.ts`** — `AgentRow.parentAgentId`, passed through
  by `mergeAgents` from the disk side only.
- **`AgentsDock`** renders the flattened tree: one `<li>` per agent,
  `paddingLeft: depth * 14` and `aria-level`, plus a hairline guide on nested
  rows (`.agent-row--nested` in `styles.css`).

The layout module + its 13 unit tests were delegated to one Grok subagent
through a `haiku` Slot rebind, reviewed and landed with one cleanup (a local
test type re-declaring `parentAgentId` became redundant). The Slot was reverted
before the gate. The `AgentRow` field, merge passthrough, dock render, CSS and
the four seam tests were written directly.

## Facts established this leg (don't re-derive)

- **`spawnDepth` is not tree depth.** It comes off the sidecar and is displayed
  as metadata; `AgentNode.depth` is computed by the walk. #33 must not confuse
  the two.
- **A nested agent reads as top-level while it is live**, then nests on the next
  disk read. Accepted lag, by decision — not a bug.
- **Nothing disappears from the tree.** Orphan (parent absent from the list),
  self-parent and cycle members all degrade to roots; every input row appears
  exactly once. Pinned by unit tests.
- **The `parentAgentId` passthrough is mutation-verified** — deleting the line
  in `mergeAgents` reds both `tests/agents-merge.test.ts` and the three-deep
  test in `tests/agents-dock.test.tsx`. If either reds, the bug is in the code.
- **No GUI pass was possible for nesting** — `parentAgentId` is on 0 of 28 real
  sidecars, so a live run renders flat and cannot exercise the indent guide.
  The nesting path is fabricated-fixture territory by construction.
- `tests/agent-layout.test.ts` is pure-data and fast; extend it for #33's
  geometry rather than testing the map through the DOM.

## Facts from #30 (still current)

- **`taskToParent` is the bash filter.** `task_progress`/`task_updated` do not
  carry `task_type` at all, so filtering happens by only ever registering task
  ids from a `local_agent` `task_started` and dropping any message whose
  `task_id` is unregistered. Don't add a per-message `task_type` check.
- **The `parent_tool_use_id` path was kept, not replaced.** It is the presence
  floor; both sources upsert the same key.
- **Absent-not-zero is enforced in three places** (engine `assignDefined`, merge,
  render) and **both halves are mutation-verified**.
- **A settled agent is not re-failed by the drain** — terminal task messages
  remove the id from the open set before abort/error/close runs.
- **Elapsed is the CLI's `duration_ms`, rendered as given** — no local timer, by
  choice. Upgrade path is in the decision.
- `tests/engine.test.ts > engine task messages` holds the **real wire shapes**
  (from the #27 spike JSONL) as reusable fixtures.
- **The sessions rail renders `<li>` too** — scope any dock list-item count with
  `within(dock())` or it double-counts.

## Facts from #29 (still current — this is what #32 needs)

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
  (ENOENT), `null` could not read. The dock shows live rows even on the `null`
  branch. Contract in [[2026-07-25-agents-dock-disk-contract]].
- **A sidecar's `model` is the family word asked for, not the resolved target** —
  spec #25's Further Notes are wrong on this.
- **Real sidecar coverage** (28 sidecars): `agentType`/`description`/`toolUseId`/
  `spawnDepth` 28/28, `model` 18/28, **`parentAgentId` 0/28**.
- **Don't re-simplify the drawer's `sessionId` prop away** — a rail-opened
  session has no engine, so the engine answers `null`.

## Facts from the #27 spike (still current)

- All four task messages arrive: `task_started`, `task_progress`,
  `task_updated`, and the undocumented **`task_notification`** (the real
  completion signal: final `usage`, result `summary`, `output_file`).
- **`task_updated` is terminal-only**; `local_bash` tasks share the stream.
- **Nested agents are invisible to `parent_tool_use_id`** — a nested subagent's
  traffic is never forwarded. This is why #31 took the sidecar edge.
- **One correlation key** (`task_started.tool_use_id` === `Agent` block id ===
  `parent_tool_use_id` === sidecar `toolUseId`); `task_id` is separate.
- **`total_tokens` is cumulative context**, ~52k floor — labelled `ctx`.
- `description` live-updates for free; the spawning tool is named **`Agent`**.

## Known issues / not-our-bug

- **Native backend is unobservable on this host** — the CLI answers `Not logged
  in · Please run /login` with the wisp vars stripped. Native-mode behaviour is
  assumed, not measured.

## Pick up here

The relay chain owns the queue; see [[pick-up]]. If it stalls, the frontier
query is: oldest open `ready-for-agent` issue with
`issue_dependencies_summary.blocked_by == 0` — currently **#32**.

## Deferred (still no spec)

Live-tail external sessions, N-concurrent engines, fork-on-resume, global
project switcher. Busy-switch could graduate from *block* to
*detach-with-notice* ([[2026-07-23-busy-switch-block-not-detach]]). From #26's
out-of-scope: drag-and-drop attachments, thumbnails on replay, multiline
composer. From #25's: cross-session agent archive, agent control (kill/retry),
map pan/zoom, token totals for historical agents. New from #31: nesting a
**live** agent before its sidecar lands.

## Landmines (carried forward)

- **Wisp `options.model` = the alias/family NAME, never a resolved model id** — a
  resolved id hangs the turn. See [[2026-07-24-wisp-alias-routes-by-name]].
- **Never run bare `wisp snapshot`** — with no family it snapshots *every* row.
  Clear with `wisp snapshot revert <family>`. (`wisp snapshot list` is not a
  subcommand; the retired `~/.claude/slot/lease-*.json` files are gone.)
- **New `window.api` channel → add to ALL FOUR mock sites** or App-render tests
  throw: `tests/chat-harness.ts` + inline mocks in `sidebar`/`session`/`shell`
  tests. Guard every IPC with `isTrustedIpc`. **Only #34 still trips this** —
  neither #30 nor #31 added a channel.
- Resume ceiling + `sessionId()` accessor + native-store facts + Tailwind
  `@theme` + engine legible-error pins — unchanged, see [[pick-up]].

## Related

- [[overview]] · [[decisions]] · [[pick-up]] · [[stack]] · [[happy-path]]
- [[2026-07-25-agent-tree-edge-is-the-sidecar]] ·
  [[2026-07-25-live-rows-two-sources-one-event]] ·
  [[2026-07-25-send-payload-encoding-lands-in-the-prefactor]] ·
  [[2026-07-25-agents-dock-disk-contract]] ·
  [[2026-07-25-sidecar-model-is-family-not-resolved]]
- [[2026-07-25-task-messages-confirmed-live-shape]] ·
  [[2026-07-25-agents-surface-task-messages-not-text-forwarding]] ·
  [[2026-07-25-attachments-embed-images-paths-for-files]]
- [[2026-07-24-wisp-alias-routes-by-name]] ·
  [[2026-07-24-ui-polish-model-picker-subagent-viewer]]
