---
type: active-work
project: claude-wrapper
updated: 2026-07-25
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-07-25, relay leg 2 (`.claude/relay-leg.md`, N=1) — ticket #28_
_At commit: `c02f482` on main (+ this leg's `.context/` commit)_

## Current focus

**A `/relay` chain is draining nine tracer tickets, one per leg, unattended.**
Two disjoint specs are open: **#25 Agents surface** and **#26 Attachments**.
Prior specs #9, #16, #20 stay closed; #1 (MVP umbrella, unlabelled) is out of
scope.

Leg 1 delivered **#27** (the spike, no production code). Leg 2 delivered **#28**,
the Agents dock — the complete disk-fed tracer bullet for the surface, which
unblocked both #30 and #31.

## Ticket graph (native GitHub dependencies)

```
#27 spike ✅──┐
              ├──> #30 live rows
#28 dock  ✅──┴──> #31 nesting ──> #33 map

#29 prefactor ──> #32 paste ──┬──> #34 paperclip
                              └──> #35 replay chips
```

Unblocked right now: **#29, #30, #31**. No cross-spec edges — a stall on one
spec never blocks the other.

| # | Ticket | Spec | State |
|---|---|---|---|
| 27 | Spike: confirm the CLI emits the task messages | #25 | **closed** — confirmed |
| 28 | Agents dock, hydrated from disk | #25 | **closed** — `c02f482` |
| 29 | Prefactor: widen the send payload to text + attachments | #26 | open, unblocked ← **next** |
| 30 | Live agent rows from task messages | #25 | open, unblocked (freed by #28) |
| 31 | Nested agents as a tree | #25 | open, unblocked (freed by #28) |
| 32 | Paste an image and send it | #26 | blocked by #29 |
| 33 | Map mode for the Agents panel | #25 | blocked by #31 |
| 34 | Paperclip: file picker and by-path attachments | #26 | blocked by #32 |
| 35 | Attachments survive replay | #26 | blocked by #32 |

## Done this leg (#28)

Agents dock end to end, fed entirely from disk. Gate green: typecheck ·
**238/238** (+23: 6 store, 17 dock) · build.

- **`AgentsDock.tsx`** (new) — in-flow resizable `aside` on the right of the
  workspace mirroring the Sessions rail; width persists under
  `agents-dock-width`, reusing the existing pure `clampSidebarWidth` module
  rather than adding a second one. Titlebar toggle sits ahead of min/max/close
  behind a hairline, absent until a folder is open. `DESIGN.md` updated.
- **Sidecar parser widened** — `description`, `model`, `spawnDepth`,
  `parentAgentId` kept; absent fields omitted, not zero-filled.
- **`listSubagents` → `SubagentInfo[] | null`** — `[]` none spawned (ENOENT),
  `null` could not read. Contract in
  [[2026-07-25-agents-dock-disk-contract]].
- **No new IPC channel** — `subagents:list` already existed, guarded, and was in
  all four mocks. The four-mock-sites landmine did **not** fire this leg.
- **Drawer fix (outside the stated scope, required by an acceptance criterion)**
  — it resolved its own session id from the engine, but a rail-opened session
  has no engine until the next turn, so the drawer came up empty on exactly the
  past-session case the dock exists to open. It now takes the looked-at session
  as an optional prop, engine as fallback.

Implementation of the store chunk was delegated to one Grok subagent through a
`haiku` Slot rebind; reviewed and cleaned up (deduplicated `parseMeta`'s restated
return type into a `ParsedMeta` derived from `SubagentInfo`). Slot reverted
before the gate.

## Facts established this leg (don't re-derive)

- **A sidecar's `model` is the family word asked for, not the resolved target** —
  spec #25's Further Notes are wrong on this. See
  [[2026-07-25-sidecar-model-is-family-not-resolved]].
- **Real sidecar field coverage** (28 sidecars, this project's local store):
  `agentType`/`description`/`toolUseId`/`spawnDepth` 28/28, `model` **18/28**,
  `parentAgentId` **0/28**. Nothing local exercises nesting, which is what #31
  builds — it will need fabricated fixtures.
- **The GUI can be driven headlessly for a real disk-hydrated session**: stub
  `dialog.showOpenDialog` in the main process via Playwright `app.evaluate`,
  pick this repo, click a rail row. Measure geometry in the DOM rather than
  eyeballing a screenshot — a scaled screenshot misread the titlebar as
  overflowing when the DOM showed it fitting exactly.
- `page.reload()` in that driver resets the renderer's `cwd` and drops you back
  to Welcome; remount components instead (toggle the dock) to re-read
  localStorage.

## Facts from the #27 spike (still current)

- **All four task messages arrive** — `task_started`, `task_progress`,
  `task_updated`, and an undocumented **`task_notification`**, which is the real
  completion signal (final `usage`, result `summary`, `output_file` path).
- **`task_updated` is terminal-only** — one `completed` patch per agent, no
  `running`/`pending`, and none at all for bash tasks.
- **`local_bash` tasks ride the same stream** → the panel must filter
  `task_type === 'local_agent'`. `skip_transcript` was `false` on all of them.
- **Nested agents are invisible to `parent_tool_use_id`** — a nested subagent's
  traffic is never forwarded; it surfaces only via its own task messages. #31's
  tree comes from task messages + the `Agent` tool_use block, plus the sidecar
  `parentAgentId` #28 now keeps. No depth field exists on any message.
- **One correlation key:** `task_started.tool_use_id` === `Agent` tool_use block
  id === `parent_tool_use_id` === sidecar `toolUseId`. `task_id` is separate and
  is the only key on `task_progress`/`task_updated` — keep both.
- **Ordering at spawn is stable:** `Agent` tool_use block → `task_started` →
  forwarded traffic. A row can exist before any output does.
- **Progress is event-driven**, ~one tick per tool transition (2.5–3s apart).
  `duration_ms` is agent-elapsed and monotonic.
- **`total_tokens` is cumulative context**, ~52k floor for a trivial subagent —
  not spend.
- **`description` live-updates for free**; `summary` needs
  `agentProgressSummaries` and landed on 1 tick in 7. Leave the flag off.
- The spawning tool is named **`Agent`**, not `Task`. `tool_progress` and
  `background_tasks_changed` never fired.
- **`handleMessage` has no `type: 'system'` branch** — every one of these is
  received and dropped today.

## Facts from the spec session (still current)

- **Persisted images are big:** one screenshot = 263 KB of base64 in the session
  jsonl. Hence chips on replay, not thumbnails.
- **`SDKUserMessage.message` is an Anthropic `MessageParam`** → image and
  document blocks are legal; the string-only path is the wrapper's choice.

## Known issues / not-our-bug

- **Native backend is unobservable on this host** — the CLI answers `Not logged
  in · Please run /login` with the wisp vars stripped. Not a wrapper bug; it
  does mean native-mode behaviour is assumed, not measured.
- **Subagents refusing upstream (RESOLVED)** — was the Wisp bridge / CLI
  harness, not the wrapper. Grok subagents run fine via a `/slot` rebind.

## Pick up here

The relay chain owns the queue; see [[pick-up]]. If it stalls, the frontier
query is: oldest open `ready-for-agent` issue with
`issue_dependencies_summary.blocked_by == 0` — currently **#29**.

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
  `isTrustedIpc`. **#29 and #34 still trip this** (#28 did not — it added no
  channel).
- **#29 is the regression-risk ticket** — it touches the core prompt path. The
  text-only-stays-a-plain-string test is the guard; never let it be "fixed" by
  updating the expectation.
- **Don't re-simplify the drawer's `sessionId` prop away** — see
  [[2026-07-25-agents-dock-disk-contract]].
- Resume ceiling + `sessionId()` accessor + native-store facts + Tailwind
  `@theme` + engine legible-error pins — unchanged, see [[pick-up]].

## Related

- [[overview]] · [[decisions]] · [[pick-up]] · [[stack]] · [[happy-path]]
- [[2026-07-25-agents-dock-disk-contract]] ·
  [[2026-07-25-sidecar-model-is-family-not-resolved]]
- [[2026-07-25-task-messages-confirmed-live-shape]] ·
  [[2026-07-25-agents-surface-task-messages-not-text-forwarding]] ·
  [[2026-07-25-attachments-embed-images-paths-for-files]]
- [[2026-07-24-wisp-alias-routes-by-name]] ·
  [[2026-07-24-ui-polish-model-picker-subagent-viewer]]
