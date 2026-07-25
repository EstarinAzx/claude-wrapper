---
type: active-work
project: claude-wrapper
updated: 2026-07-25
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-07-25, relay leg 8 (`.claude/relay-leg.md`, N=1) — ticket #34_
_At commit: `b374f23` on main (+ this leg's `.context/` commit)_

## Current focus

**A `/relay` chain is draining the tracer tickets, one per leg, unattended.**
**Spec #25 Agents surface is delivered and closed.** One spec is still open:
**#26 Attachments**, owing **#35 alone**. Prior specs #9, #16, #20 stay closed;
#1 (MVP umbrella, unlabelled) is out of scope.

Legs 1–8 delivered **#27** (spike, no production code), **#28** (the Agents
dock), **#29** (the send-payload prefactor), **#30** (live agent rows), **#31**
(nesting), **#32** (paste an image), **#33** (map mode) and **#34** (the
paperclip). **Eight of nine are down. #35 is the last ticket in the queue, and
landing it should close #26 and empty the chain.**

## Ticket graph (native GitHub dependencies)

```
#27 spike ✅──┐
              ├──> #30 live rows ✅
#28 dock  ✅──┴──> #31 nesting ✅──> #33 map ✅     spec #25 CLOSED
#29 prefactor ✅──> #32 paste ✅──┬──> #34 paperclip ✅
                                  └──> #35 replay chips  ← last one
```

Unblocked right now: **#35**, the only open ticket. No cross-spec edges.
**#26 closes when #35 lands**, and that empties the queue.

| # | Ticket | Spec | State |
|---|---|---|---|
| 27 | Spike: confirm the CLI emits the task messages | #25 | **closed** — confirmed |
| 28 | Agents dock, hydrated from disk | #25 | **closed** — `c02f482` |
| 29 | Prefactor: widen the send payload | #26 | **closed** — `397c0a1` |
| 30 | Live agent rows from task messages | #25 | **closed** — `f869f1f` |
| 31 | Nested agents as a tree | #25 | **closed** — `1888440` |
| 32 | Paste an image and send it | #26 | **closed** — `3b7a77c` |
| 33 | Map mode for the Agents panel | #25 | **closed** — `c357ed7` |
| 34 | Paperclip: file picker and by-path attachments | #26 | **closed** — `b374f23` |
| 35 | Attachments survive replay | #26 | open, unblocked ← **next / last** |

## Done this leg (#34)

Gate green: typecheck · **384/384** (+20) · build. Full rationale in
[[2026-07-25-picker-returns-candidates-not-paths]].

- **`attachments:pick`** in `src/main/index.ts` — `ipcMain.handle`, `isTrustedIpc`
  guard, `dialog.showOpenDialog` with `['openFile', 'multiSelections']`. Resolves
  policy **`Candidate[]`**, not bare paths: main derives the name (`basename`)
  and media type, and reads base64 bytes itself — only for the four allowlisted
  image types and only after `stat` confirms `MAX_IMAGE_BYTES`. Cancel, no
  window, untrusted sender, wrong type, too big, unreadable → path-only or `[]`.
- **`mediaTypeForPath`** in `src/shared/attachment-policy.ts` — extension →
  media type, dependency-free (the module is shared with the renderer). Reads
  the extension off the **last path segment only**, so `D:\my.folder\README` and
  `.gitignore` both have none. **`isEmbeddable` is now exported** so main asks
  the policy module instead of re-casting the allowlist.
- **`pickFiles`** on `window.api` (preload + `WrapperApi`), registered at all
  four mock sites.
- **The paperclip is real** — `onClick`, `aria-label="Attach files"`,
  `tabIndex={-1}` removed, `disabled={busy}`. `.attach-btn` gets
  `cursor: pointer`, a hover lift scoped `:not(:disabled)`, and joins the shared
  `:disabled` rule.
- **One fold, both sources** — `openPicker` runs `admitAttachments` exactly as
  `onPaste` does, so embed-vs-path routing and the count budget are one route.
  **No policy change was needed**, as the #32 note predicted.

Two Grok subagents through a `haiku` Slot rebind (the IPC half, the renderer
half), both reviewed; the Slot was reverted before the gate. Review changed four
things: `isEmbeddable` exported rather than the allowlist re-cast in main,
`.attach-btn:hover` scoped `:not(:disabled)`, the composer test helper collapsed
to a click plus `await act(async () => {})` (the draft's before/after-count dance
could assert before the `.then` ran), and the cancel test strengthened to hold a
**rejection as well as a chip**.

## Facts established this leg (don't re-derive)

- **The picker needs NO new CSP grant.** A picked image comes back as base64 and
  renders from the same `data:` URL a paste does. The #32 note's warning that
  "#34's `file:` thumbnail needs its own grant" does not apply — but it still
  stands for any future source that is a real URL.
- **Verified live in the built app** with `dialog.showOpenDialog` stubbed in
  main, which runs the **real handler** (main has no unit tests): the dialog
  received `{properties: ['openFile', 'multiSelections']}`; a picked PNG decoded
  to **1593×1140** (not a broken icon); `CLAUDE.md` came back a name-only chip;
  cancelling left both chips; the button reads `Attach files`, has no
  `tabindex`, is focusable, and computes `cursor: pointer`.
- **A cancel must return BEFORE the fold.** Folding `[]` keeps the chips but
  silently wipes an existing rejection message — mutation-verified, and the
  obvious chip-only version of the test passes the mutation. The test holds a
  rejection too.
- **Skipping the read == failing it.** An oversized image is never read, so it
  arrives path-only and takes the fall-through — no new rejection branch, and
  no 500 MB file in memory.
- **`playwright-core` will not load from a driver outside the tree by file-URL
  import** — it is CJS with an exports map, so `import(…/index.js)` yields no
  `_electron`. Use `createRequire(pathToFileURL(REPO + '/package.json'))` and
  `require('playwright-core')`; the driver still lives outside the repo.

## Facts from #33 / #31 / #30 (still current)

- **`role="img"` on an interactive SVG hides its buttons from assistive tech** —
  use `role="group"`. Testing-library cannot catch it.
- **A static `opacity` loses to an animation that keyframes `opacity`** — put
  the alpha in the colour.
- **Hit-target sizing must be measured within a depth band**, or a nested spine
  collapses every hit circle to `r=0`.
- **Geometry is pure and stays out of the DOM tests** — `agent-layout.test.ts`
  asserts layout as data; the dock tests only assert wiring.
- **The map fits without scrolling at both ends of the resize range**, measured
  on a real 7-agent session; every status colour verified by computed style.
- **`spawnDepth` is not tree depth**; **a nested agent reads as top-level while
  live**, then nests on the next disk read (accepted lag, list and map both).
- **Nothing disappears from the tree or map** — orphans, self-parents and cycle
  members degrade to roots.
- **`taskToParent` is the `local_bash` filter**, not just a lookup: ids are
  registered only from a `local_agent` `task_started`.
- **Absent-not-zero is enforced in engine + merge + render**, both halves
  mutation-verified. **A settled agent is not re-failed by the drain.**
- **The sessions rail renders `<li>` too** — scope dock counts with
  `within(dock())`.

## Facts from #32 / #29 / #28 / #27 (still current)

- **The renderer CSP is part of the attachment feature.** No `img-src` means
  `default-src 'self'` blocks every `data:` URL while the DOM looks perfect.
  jsdom never applies CSP.
- **An empty text block is rejected by the API**; an attachments-only send omits
  it. **A rejection must not consume the count budget.** Both mutation-verified.
- **Too big to embed falls through to the path route.**
- **`normalizeSendPayload` is the trust boundary on `chat:send`.**
- **`tests/engine.test.ts` has `capturingStub()` and `sendOne(payload)`**, and
  now a mixed image+path message test that #35 inherits.
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
currently **#35**, the last one. Only **#26** needs skipping (#25 is closed).

## Deferred (still no spec)

Live-tail external sessions, N-concurrent engines, fork-on-resume, global
project switcher. Busy-switch could graduate from *block* to
*detach-with-notice* ([[2026-07-23-busy-switch-block-not-detach]]). From #26's
out-of-scope: drag-and-drop attachments, thumbnails on replay, multiline
composer. From #25's: cross-session agent archive, agent control (kill/retry),
map pan/zoom, token totals for historical agents. From #31: nesting a **live**
agent before its sidecar lands. From #32: no capability gating by model, and no
`blob:` URL path for very large pastes. From #33: no node labels in the map, and
no inset for a fan-out past ~40 agents (marked `ponytail:` in the module). New
from #34: no drag-and-drop, no directory pick, no dialog `filters` (every file
type is pickable, non-images just go by path), and no unit test for the
main-process handler.

## Landmines (carried forward)

- **Wisp `options.model` = the alias/family NAME, never a resolved model id** — a
  resolved id hangs the turn. See [[2026-07-24-wisp-alias-routes-by-name]].
- **Never run bare `wisp snapshot`** — with no family it snapshots *every* row.
  Clear with `wisp snapshot revert <family>`. (`wisp snapshot list` is not a
  subcommand; the retired `~/.claude/slot/lease-*.json` files are gone.)
- **New `window.api` channel → add to ALL FOUR mock sites** or App-render tests
  throw: `tests/chat-harness.ts` + inline mocks in `sidebar`/`session`/`shell`
  tests. Guard every IPC with `isTrustedIpc`. #34 tripped this; **#35 needs no
  new channel**, so it should not.
- **Never let the plain-string pin be "fixed" by updating its expectation** —
  `a text-only send keeps plain-string content` is mutation-verified.
- Resume ceiling + `sessionId()` accessor + native-store facts + Tailwind
  `@theme` + engine legible-error pins — unchanged, see [[pick-up]].

## Related

- [[overview]] · [[decisions]] · [[pick-up]] · [[stack]] · [[happy-path]]
- [[2026-07-25-picker-returns-candidates-not-paths]] ·
  [[2026-07-25-map-geometry-is-a-pure-slot-layout]] ·
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
