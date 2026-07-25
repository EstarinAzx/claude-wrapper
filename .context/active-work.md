---
type: active-work
project: claude-wrapper
updated: 2026-07-25
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-07-25, relay leg 7 (`.claude/relay-leg.md`, N=1) — ticket #33_
_At commit: `c357ed7` on main (+ this leg's `.context/` commit)_

## Current focus

**A `/relay` chain is draining the tracer tickets, one per leg, unattended.**
**Spec #25 Agents surface is delivered and closed.** One spec is still open:
**#26 Attachments**, owing #34 and #35. Prior specs #9, #16, #20 stay closed;
#1 (MVP umbrella, unlabelled) is out of scope.

Legs 1–7 delivered **#27** (spike, no production code), **#28** (the Agents
dock), **#29** (the send-payload prefactor), **#30** (live agent rows), **#31**
(nesting), **#32** (paste an image) and **#33** (map mode). **Seven of nine are
down; two remain, both unblocked**, so the chain picks by age from here.

## Ticket graph (native GitHub dependencies)

```
#27 spike ✅──┐
              ├──> #30 live rows ✅
#28 dock  ✅──┴──> #31 nesting ✅──> #33 map ✅     spec #25 CLOSED
#29 prefactor ✅──> #32 paste ✅──┬──> #34 paperclip   ← next is #34
                                  └──> #35 replay chips
```

Unblocked right now: **#34, #35** — both open tickets. No cross-spec edges.
**#26 closes when #34 and #35 land**, and that empties the queue.

| # | Ticket | Spec | State |
|---|---|---|---|
| 27 | Spike: confirm the CLI emits the task messages | #25 | **closed** — confirmed |
| 28 | Agents dock, hydrated from disk | #25 | **closed** — `c02f482` |
| 29 | Prefactor: widen the send payload | #26 | **closed** — `397c0a1` |
| 30 | Live agent rows from task messages | #25 | **closed** — `f869f1f` |
| 31 | Nested agents as a tree | #25 | **closed** — `1888440` |
| 32 | Paste an image and send it | #26 | **closed** — `3b7a77c` |
| 33 | Map mode for the Agents panel | #25 | **closed** — `c357ed7` |
| 34 | Paperclip: file picker and by-path attachments | #26 | open, unblocked ← **next** |
| 35 | Attachments survive replay | #26 | open, unblocked |

## Done this leg (#33)

Gate green: typecheck · **364/364** (+19) · build. Full rationale in
[[2026-07-25-map-geometry-is-a-pure-slot-layout]].

- **`layoutAgentMap` in `src/shared/agent-layout.ts`** (new, pure) — the geometry
  half beside the tree. Calls `buildAgentTree`, only places the result. Returns
  `nodes` (coords + `kind` + `depth` + `row`), `edges` (both endpoints inlined),
  `width` / `height` / `nodeRadius`, all in abstract viewBox units.
- **`src/renderer/src/components/AgentMap.tsx`** (new) — hand-rolled SVG, no new
  dependency. Cubic-elbow edges under the nodes; each agent is a focusable
  `role="button"` group with an `aria-label` and a `<title>`.
- **`AgentsDock`** — icon-only List/Map toggle in the head; one `selectedId` and
  one `openAgent` handler shared by both modes; the map is fed the same merged
  disk-plus-live `rows` the list uses.
- **`styles.css`** — the map section, plus `.agent-row--selected`.

Two Grok subagents through a `haiku` Slot rebind (geometry, then component),
both reviewed; the Slot was reverted before the gate. Review changed four
things: `role="img"` → `role="group"`, the halo alpha moved into the fill,
`MapNode` became a union discriminated on `kind` (which removed the draft's
non-null assertion — there were **zero** in `src/` before it), and hit-target
sizing was added and then corrected to measure within a depth band.

## Facts established this leg (don't re-derive)

- **`role="img"` on an interactive SVG hides its buttons from assistive tech** —
  an `img` role makes the whole subtree presentational. Testing-library still
  finds the buttons, so no test in this suite can catch it. Use `role="group"`.
- **`opacity` loses to an animation that keyframes `opacity`.** The reused
  `subagent-pulse` animates 1 → 0.35, so a static `opacity: 0.18` tint is
  overridden and the element flashes near-solid. Put the alpha in the colour
  (`color-mix`) and let the keyframe own opacity.
- **Hit-target sizing must be measured within a depth band.** A nested spine
  stacks parent and child on the same x; measuring the gap across all nodes reads
  zero and collapses every hit circle to `r=0`. jsdom does no hit testing, so the
  guard is an assertion on the radius (`nested nodes keep a clickable hit
  target`, mutation-verified).
- **Geometry is pure and stays out of the DOM tests.** `tests/agent-layout.test.ts`
  pins depth separation, edge/node consistency, determinism across an
  equal-but-distinct input, canvas bounds and sibling separation at 1 / 5 / 28
  agents. The dock tests only assert wiring.
- **The map fits without scrolling at both ends of the resize range** — measured
  in the built app on a real 7-agent session: 223.1px of SVG inside 247.1px at
  default, 155.1 inside 179.1 at the 180px floor, no scrollbar on either axis,
  smallest hit target 24.2px / 16.8px.
- **Every status colour was verified by computed style in Chromium**, not jsdom:
  running `oklch(0.87 0.07 180)`, done hollow + `0.68 0.01 200` at 1.5, failed
  `oklch(0.6 0.16 25)`, unknown hollow + faint + `2px 2px` dash, halo
  `oklch(0.87 0.07 180 / 0.22)`.
- **Running and failed nodes have not been seen on a live turn.** A historical
  session has no status, so all seven rendered as the dashed unknown ring
  (correct). The mint and red paths are confirmed by computed style and unit test
  only.

## Facts from #31 (still current)

- **`spawnDepth` is not tree depth.** `AgentNode.depth` is computed by the walk.
- **A nested agent reads as top-level while it is live**, then nests on the next
  disk read. Accepted lag, by decision. The map inherits this.
- **Nothing disappears from the tree or the map.** Orphans, self-parents and
  cycle members degrade to roots; every input row appears exactly once.
- **The `parentAgentId` passthrough is mutation-verified.**
- **No GUI pass is possible for nesting** — `parentAgentId` is on 0 of 28 real
  sidecars, so a live run renders flat. Fabricated-fixture territory.

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

## Facts from #32 / #29 / #28 / #27 (still current)

- **The renderer CSP is part of the attachment feature.** No `img-src` means
  `default-src 'self'` blocks every `data:` URL while the DOM looks perfect.
  jsdom never applies CSP. Any new image source (`blob:`, `file:`) fails the same
  silent way.
- **An empty text block is rejected by the API**; an attachments-only send omits
  it. **A rejection must not consume the count budget.** Both mutation-verified.
- **Too big to embed falls through to the path route**, so **#34 needs no policy
  change**.
- **`normalizeSendPayload` is the trust boundary on `chat:send`.**
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
  instead of acrylic, and **both `page.screenshot({clip})` and
  `locator.screenshot()` mis-frame a window wider than the viewport**. Measure
  geometry in the DOM (`getBoundingClientRect`, `getComputedStyle`), never off
  the image.

## Pick up here

The relay chain owns the queue; see [[pick-up]]. If it stalls, the frontier
query is: oldest open `ready-for-agent` issue with
`issue_dependencies_summary.blocked_by == 0`, ignoring the spec parent —
currently **#34**. Note **#25 is now closed**, so only **#26** needs skipping.

## Deferred (still no spec)

Live-tail external sessions, N-concurrent engines, fork-on-resume, global
project switcher. Busy-switch could graduate from *block* to
*detach-with-notice* ([[2026-07-23-busy-switch-block-not-detach]]). From #26's
out-of-scope: drag-and-drop attachments, thumbnails on replay, multiline
composer. From #25's: cross-session agent archive, agent control (kill/retry),
map pan/zoom, token totals for historical agents. From #31: nesting a **live**
agent before its sidecar lands. From #32: no capability gating by model, and no
`blob:` URL path for very large pastes. New from #33: no node labels in the map,
and no inset for a fan-out past ~40 agents (marked `ponytail:` in the module).

## Landmines (carried forward)

- **Wisp `options.model` = the alias/family NAME, never a resolved model id** — a
  resolved id hangs the turn. See [[2026-07-24-wisp-alias-routes-by-name]].
- **Never run bare `wisp snapshot`** — with no family it snapshots *every* row.
  Clear with `wisp snapshot revert <family>`. (`wisp snapshot list` is not a
  subcommand; the retired `~/.claude/slot/lease-*.json` files are gone.)
- **New `window.api` channel → add to ALL FOUR mock sites** or App-render tests
  throw: `tests/chat-harness.ts` + inline mocks in `sidebar`/`session`/`shell`
  tests. Guard every IPC with `isTrustedIpc`. **#34 trips this.**
- **Never let the plain-string pin be "fixed" by updating its expectation** —
  `a text-only send keeps plain-string content` is mutation-verified.
- Resume ceiling + `sessionId()` accessor + native-store facts + Tailwind
  `@theme` + engine legible-error pins — unchanged, see [[pick-up]].

## Related

- [[overview]] · [[decisions]] · [[pick-up]] · [[stack]] · [[happy-path]]
- [[2026-07-25-map-geometry-is-a-pure-slot-layout]] ·
  [[2026-07-25-attachment-policy-and-the-csp-that-blocked-it]] ·
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
