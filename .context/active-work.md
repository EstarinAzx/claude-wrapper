---
type: active-work
project: claude-wrapper
updated: 2026-07-25
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-07-25, relay leg 6 (`.claude/relay-leg.md`, N=1) — ticket #32_
_At commit: `3b7a77c` on main (+ this leg's `.context/` commit)_

## Current focus

**A `/relay` chain is draining nine tracer tickets, one per leg, unattended.**
Two disjoint specs are open: **#25 Agents surface** and **#26 Attachments**.
Prior specs #9, #16, #20 stay closed; #1 (MVP umbrella, unlabelled) is out of
scope.

Legs 1–6 delivered **#27** (spike, no production code), **#28** (the Agents
dock), **#29** (the send-payload prefactor), **#30** (live agent rows), **#31**
(nesting) and **#32** (paste an image). Six of nine are down. Closing #32
unblocked **#34** and **#35**, so **all three remaining tickets are unblocked**
and the chain picks by age from here.

## Ticket graph (native GitHub dependencies)

```
#27 spike ✅──┐
              ├──> #30 live rows ✅
#28 dock  ✅──┴──> #31 nesting ✅──> #33 map          ← next is #33
#29 prefactor ✅──> #32 paste ✅──┬──> #34 paperclip
                                  └──> #35 replay chips
```

Unblocked right now: **#33, #34, #35** — every open ticket. No cross-spec edges.
Neither spec can close yet: #25 still owes #33, #26 still owes #34 and #35.

| # | Ticket | Spec | State |
|---|---|---|---|
| 27 | Spike: confirm the CLI emits the task messages | #25 | **closed** — confirmed |
| 28 | Agents dock, hydrated from disk | #25 | **closed** — `c02f482` |
| 29 | Prefactor: widen the send payload | #26 | **closed** — `397c0a1` |
| 30 | Live agent rows from task messages | #25 | **closed** — `f869f1f` |
| 31 | Nested agents as a tree | #25 | **closed** — `1888440` |
| 32 | Paste an image and send it | #26 | **closed** — `3b7a77c` |
| 33 | Map mode for the Agents panel | #25 | open, unblocked ← **next** |
| 34 | Paperclip: file picker and by-path attachments | #26 | open, unblocked |
| 35 | Attachments survive replay | #26 | open, unblocked |

## Done this leg (#32)

Gate green: typecheck · **345/345** (+35) · build. Full rationale in
[[2026-07-25-attachment-policy-and-the-csp-that-blocked-it]].

- **`src/shared/attachment-policy.ts`** (new, pure) — the one place caps, the
  allowlist and routing live. `judgeAttachment(candidate, attachedCount)` →
  embed / by-path / reject; `admitAttachments(count, candidates)` folds a batch.
  `MAX_IMAGE_BYTES` 5 MB decoded, `MAX_ATTACHMENTS` 10; the allowlist is
  imported from `attachment-types`, never restated.
- **`InputBar`** — `onPaste` intercepts `clipboardData.files` only; every file
  goes through the policy module rather than being filtered in the composer.
  Chip tray above the pill, inline rejections, rendered only when non-empty.
- **`useChat.send(text, attachments)`** — attachments alone are a valid message.
- **`Chat`** — the sent user bubble renders its thumbnails.
- **`src/main/engine.ts`** — the only engine change: an empty text block is
  omitted, not blanked (see below).
- **`src/renderer/index.html`** — `img-src 'self' data:` added to the CSP.

The policy module + its 19 unit tests were delegated to one Grok subagent
through a `haiku` Slot rebind, reviewed and landed with three cleanups (two
`as string` casts removed by destructuring, a fractional byte count floored, and
`the limit is 5.0 MB` made `5 MB`). The Slot was reverted before the gate.

## Facts established this leg (don't re-derive)

- **The renderer CSP is part of the attachment feature.** With no `img-src`,
  `default-src 'self'` blocks every `data:` URL and thumbnails render as broken
  icons **while the DOM looks perfect**. jsdom never loads images, so no seam
  test can see this. The grant is pinned by `tests/attachments-composer.test.tsx`.
  Any new image source (`blob:`, `file:`) will fail exactly this silently.
- **An empty text block is rejected by the API.** An attachments-only send omits
  the block rather than blanking it. Mutation-verified.
- **A rejection must not consume the count budget** — which is why the fold
  lives in the policy module, not the composer. Mutation-verified.
- **Too big to embed falls through to the path route** when a `path` exists, so
  **#34 needs no policy change**.
- **The live GUI pass is what caught both defects.** A real Ctrl+V of a real
  clipboard image through the built app; the 345-test suite reported green.
  Recipe below, reusable.

## Facts from #31 (still current)

- **`spawnDepth` is not tree depth.** `AgentNode.depth` is computed by the walk.
  #33 must not confuse the two.
- **A nested agent reads as top-level while it is live**, then nests on the next
  disk read. Accepted lag, by decision.
- **Nothing disappears from the tree.** Orphans, self-parents and cycle members
  degrade to roots; every input row appears exactly once.
- **The `parentAgentId` passthrough is mutation-verified** — deleting it in
  `mergeAgents` reds `tests/agents-merge.test.ts` and the three-deep test in
  `tests/agents-dock.test.tsx`.
- **No GUI pass is possible for nesting** — `parentAgentId` is on 0 of 28 real
  sidecars, so a live run renders flat. Fabricated-fixture territory.
- `tests/agent-layout.test.ts` is pure-data and fast; extend it for #33's
  geometry rather than testing the map through the DOM.

## Facts from #30 (still current)

- **`taskToParent` is the bash filter.** `task_progress`/`task_updated` carry no
  `task_type`, so ids are only ever registered from a `local_agent`
  `task_started` and any message with an unregistered `task_id` is dropped.
- **The `parent_tool_use_id` path was kept, not replaced** — it is the presence
  floor; both sources upsert the same key.
- **Absent-not-zero is enforced in three places** (engine `assignDefined`, merge,
  render) and **both halves are mutation-verified**.
- **A settled agent is not re-failed by the drain.**
- **Elapsed is the CLI's `duration_ms`**, rendered as given.
- `tests/engine.test.ts > engine task messages` holds the **real wire shapes**.
- **The sessions rail renders `<li>` too** — scope dock counts with `within(dock())`.

## Facts from #29 / #28 / #27 (still current)

- **`normalizeSendPayload` is the trust boundary on `chat:send`**; the renderer
  enforces policy before IPC, and the boundary check stays.
- **`tests/engine.test.ts` has `capturingStub()` and `sendOne(payload)`.**
- **`listSubagents` returns `SubagentInfo[] | null`** — `[]` none spawned
  (ENOENT), `null` could not read; the dock shows live rows on the `null` branch.
- **A sidecar's `model` is the family word asked for**, not the resolved target.
- **Real sidecar coverage** (28): `agentType`/`description`/`toolUseId`/
  `spawnDepth` 28/28, `model` 18/28, **`parentAgentId` 0/28**.
- **Don't re-simplify the drawer's `sessionId` prop away.**
- All four task messages arrive, **`task_notification`** is the real completion
  signal, **`task_updated` is terminal-only**, one correlation key plus a
  separate `task_id`, **`total_tokens` is cumulative context** (labelled `ctx`),
  the spawning tool is named **`Agent`**.

## Known issues / not-our-bug

- **Native backend is unobservable on this host** — the CLI answers `Not logged
  in · Please run /login` with the wisp vars stripped. Native-mode behaviour is
  assumed, not measured.
- The GUI driver launches with `--disable-gpu`, so screenshots show a flat wash
  instead of acrylic, and `page.screenshot()` clips a window wider than the
  viewport. Measure geometry in the DOM, not off the image.

## Pick up here

The relay chain owns the queue; see [[pick-up]]. If it stalls, the frontier
query is: oldest open `ready-for-agent` issue with
`issue_dependencies_summary.blocked_by == 0`, ignoring the two spec parents —
currently **#33**.

## Deferred (still no spec)

Live-tail external sessions, N-concurrent engines, fork-on-resume, global
project switcher. Busy-switch could graduate from *block* to
*detach-with-notice* ([[2026-07-23-busy-switch-block-not-detach]]). From #26's
out-of-scope: drag-and-drop attachments, thumbnails on replay, multiline
composer. From #25's: cross-session agent archive, agent control (kill/retry),
map pan/zoom, token totals for historical agents. From #31: nesting a **live**
agent before its sidecar lands. New from #32: no capability gating by model (a
text-only provider's refusal surfaces through the engine's legible-error map),
and no `blob:` URL path for very large pastes.

## Landmines (carried forward)

- **Wisp `options.model` = the alias/family NAME, never a resolved model id** — a
  resolved id hangs the turn. See [[2026-07-24-wisp-alias-routes-by-name]].
- **Never run bare `wisp snapshot`** — with no family it snapshots *every* row.
  Clear with `wisp snapshot revert <family>`. (`wisp snapshot list` is not a
  subcommand; the retired `~/.claude/slot/lease-*.json` files are gone.)
- **New `window.api` channel → add to ALL FOUR mock sites** or App-render tests
  throw: `tests/chat-harness.ts` + inline mocks in `sidebar`/`session`/`shell`
  tests. Guard every IPC with `isTrustedIpc`. **Only #34 still trips this.**
- **Never let the plain-string pin be "fixed" by updating its expectation** —
  `a text-only send keeps plain-string content` is mutation-verified.
- Resume ceiling + `sessionId()` accessor + native-store facts + Tailwind
  `@theme` + engine legible-error pins — unchanged, see [[pick-up]].

## Related

- [[overview]] · [[decisions]] · [[pick-up]] · [[stack]] · [[happy-path]]
- [[2026-07-25-attachment-policy-and-the-csp-that-blocked-it]] ·
  [[2026-07-25-agent-tree-edge-is-the-sidecar]] ·
  [[2026-07-25-live-rows-two-sources-one-event]] ·
  [[2026-07-25-send-payload-encoding-lands-in-the-prefactor]] ·
  [[2026-07-25-agents-dock-disk-contract]] ·
  [[2026-07-25-sidecar-model-is-family-not-resolved]]
- [[2026-07-25-task-messages-confirmed-live-shape]] ·
  [[2026-07-25-agents-surface-task-messages-not-text-forwarding]] ·
  [[2026-07-25-attachments-embed-images-paths-for-files]]
- [[2026-07-24-wisp-alias-routes-by-name]] ·
  [[2026-07-24-ui-polish-model-picker-subagent-viewer]]
