---
type: active-work
project: claude-wrapper
updated: 2026-07-25
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-07-25, relay leg 9 (`.claude/relay-leg.md`, N=1) — ticket #35_
_At commit: `ae81ab6` on main (+ this leg's `.context/` commit)_

## Current focus

**Nothing is queued. The relay chain is finished.** Legs 1–9 drained both
specs: **#25 Agents surface** (closed after #33) and **#26 Attachments**
(closed after #35). Every ticket #27–#35 is closed and on main. The only open
issue is **#1**, the unlabelled MVP umbrella, which is out of scope for the
agent queue.

The next session starts from a **clean board** — there is no frontier ticket to
pick up. New work needs a spec first (`to-spec` → `to-tickets`).

## Ticket graph — all delivered

```
#27 spike ✅──┐
              ├──> #30 live rows ✅
#28 dock  ✅──┴──> #31 nesting ✅──> #33 map ✅     spec #25 CLOSED
#29 prefactor ✅──> #32 paste ✅──┬──> #34 paperclip ✅
                                  └──> #35 replay chips ✅  spec #26 CLOSED
```

| # | Ticket | Spec | Commit |
|---|---|---|---|
| 27 | Spike: confirm the CLI emits the task messages | #25 | no production code |
| 28 | Agents dock, hydrated from disk | #25 | `c02f482` |
| 29 | Prefactor: widen the send payload | #26 | `397c0a1` |
| 30 | Live agent rows from task messages | #25 | `f869f1f` |
| 31 | Nested agents as a tree | #25 | `1888440` |
| 32 | Paste an image and send it | #26 | `3b7a77c` |
| 33 | Map mode for the Agents panel | #25 | `c357ed7` |
| 34 | Paperclip: file picker and by-path attachments | #26 | `b374f23` |
| 35 | Attachments survive replay | #26 | `ae81ab6` |

## Done this leg (#35)

Gate green: typecheck · **396/396** (+12) · build. Full rationale in
[[2026-07-25-replay-shows-markers-not-bytes]].

- **`AttachmentMarker`** in `src/shared/session-types.ts` — `kind`, optional
  `mediaType`, optional `name`. `TranscriptMessage`'s user case gains
  `attachments?: AttachmentMarker[]`, absent when there were none.
- **`parseTranscript`** branches on user array content: any `tool_result` →
  fold into tool messages exactly as before; otherwise emit joined text plus one
  marker per non-text block. `source.data` is never read.
- **Renderer** carries them on a **separate** `attachmentMarkers` field —
  deliberately not merged into the live `attachments`, which holds real bytes.
  `Chat.tsx` renders `.bubble-chips` reusing `.attachment-chip` / `.chip-name`;
  label is `name ?? mediaType ?? kind`.
- **No new `window.api` channel, no CSP grant** — a chip is text, not an image
  source. The four-mock-sites landmine never fired.

Two Grok subagents through a `haiku` Slot rebind (the parser half, the renderer
half), both reviewed; the Slot was reverted before the gate. Review changed one
thing: the reused composer chip is 38px tall because it wraps a thumbnail and a
remove button a replay chip does not have, so `.bubble-chips .attachment-chip`
scopes it back to a 26px pill.

## Facts established this leg (don't re-derive)

Measured across **546 real transcript files**:

- **User content array shapes**: `["tool_result"]` 17295, `["text"]` 1375,
  `["image","text"]` 139, `["document"]` 14.
- **`tool_result` never co-occurs** with text or image — 17295 of 17295 pure. The
  short-circuit is safe.
- **The 1375 array-of-only-text messages are CLI noise** (skill injections,
  `[Request interrupted by user]`) and **must keep parsing to nothing**. Pinned
  and mutation-verified. This is not the same bug and should not be "fixed".
- **No non-text block carries a filename** — 0 of 185. Chips label by media type.
- **Both block orders occur** (`image,text` and `text,image`); the parser is
  order-independent. A `document` block arrives **alone**, so an
  attachment-only message must emit with `text: ''`.
- **Verified live in the built app** on this repo's own session `49c1495a`
  (row 49 of 62, six attachment messages): 25 user messages replayed, **6 carry
  chips**, the last showing two (`image/png` + `image/jpeg`); zero `<img>` in the
  transcript; DOM **114 KB** against **2.17 MB** of base64 on disk, and a 500+
  char base64 scan finds nothing. Before this change those six replayed as
  nothing at all.
- **Mutation-verified both ways**: emitting pure-text arrays reds the noise pin;
  putting `data` on the marker reds 5 tests.

## Facts from #34 / #33 / #31 / #30 (still current)

- **The picker needs no CSP grant** — a picked image comes back base64 and
  renders from the same `data:` URL a paste does.
- **A cancel must return BEFORE the fold** — folding `[]` keeps the chips but
  silently wipes an existing rejection. Mutation-verified.
- **Skipping the read == failing it** — an oversized image is never read, arrives
  path-only, takes the fall-through.
- **`role="img"` on an interactive SVG hides its buttons** from assistive tech —
  use `role="group"`. Testing-library cannot catch it.
- **A static `opacity` loses to an animation that keyframes `opacity`** — put the
  alpha in the colour.
- **Hit-target sizing must be measured within a depth band**, or a nested spine
  collapses every hit circle to `r=0`.
- **Geometry is pure and stays out of the DOM tests**.
- **`spawnDepth` is not tree depth**; a nested agent reads as top-level while
  live, then nests on the next disk read (accepted lag, list and map both).
- **Nothing disappears from the tree or map** — orphans, self-parents and cycle
  members degrade to roots.
- **`taskToParent` is the `local_bash` filter**, not just a lookup.
- **Absent-not-zero is enforced in engine + merge + render**, both halves
  mutation-verified. A settled agent is not re-failed by the drain.
- **The sessions rail renders `<li>` too** — scope dock counts with
  `within(dock())`.

## Facts from #32 / #29 / #28 / #27 (still current)

- **The renderer CSP is part of the attachment feature.** No `img-src` means
  `default-src 'self'` blocks every `data:` URL while the DOM looks perfect.
  jsdom never applies CSP.
- **An empty text block is rejected by the API**; an attachments-only send omits
  it. **A rejection must not consume the count budget.** Both mutation-verified.
- **`normalizeSendPayload` is the trust boundary on `chat:send`.**
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
  geometry in the DOM, never off the image. Shrinking the window first
  (`BrowserWindow.setSize`) is what makes a usable eyeball shot.

## Pick up here

**No queue.** See [[pick-up]]. Both specs are delivered; new work needs a spec
before there is anything for an agent loop to drain.

## Deferred (still no spec)

Live-tail external sessions, N-concurrent engines, fork-on-resume, global
project switcher. Busy-switch could graduate from *block* to
*detach-with-notice* ([[2026-07-23-busy-switch-block-not-detach]]). From #26's
out-of-scope: drag-and-drop attachments, thumbnails on replay, multiline
composer. From #25's: cross-session agent archive, agent control (kill/retry),
map pan/zoom, token totals for historical agents. From #31: nesting a **live**
agent before its sidecar lands. From #32: no capability gating by model, no
`blob:` URL path for very large pastes. From #33: no node labels in the map, no
inset for a fan-out past ~40 agents (marked `ponytail:` in the module). From
#34: no drag-and-drop, no directory pick, no dialog `filters`, no unit test for
the main-process handler. **New from #35: lazy full-image fetch on replay** —
the marker contract already allows it with no change.

## Landmines (carried forward)

- **Wisp `options.model` = the alias/family NAME, never a resolved model id** — a
  resolved id hangs the turn. See [[2026-07-24-wisp-alias-routes-by-name]].
- **Never run bare `wisp snapshot`** — with no family it snapshots *every* row.
  Clear with `wisp snapshot revert <family>`. (`wisp snapshot list` is not a
  subcommand; the retired `~/.claude/slot/lease-*.json` files are gone.)
- **New `window.api` channel → add to ALL FOUR mock sites** or App-render tests
  throw: `tests/chat-harness.ts` + inline mocks in `sidebar`/`session`/`shell`
  tests. Guard every IPC with `isTrustedIpc`.
- **Never let the plain-string pin be "fixed" by updating its expectation** —
  `a text-only send keeps plain-string content` is mutation-verified.
- **The array-of-only-text drop is deliberate** (see this leg's facts) — it looks
  like a bug and is not.
- Resume ceiling + `sessionId()` accessor + native-store facts + Tailwind
  `@theme` + engine legible-error pins — unchanged, see [[pick-up]].

## Related

- [[overview]] · [[decisions]] · [[pick-up]] · [[stack]] · [[happy-path]]
- [[2026-07-25-replay-shows-markers-not-bytes]] ·
  [[2026-07-25-picker-returns-candidates-not-paths]] ·
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
