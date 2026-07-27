---
type: active-work
project: claude-wrapper
updated: 2026-07-27
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-07-27 — planning leg, no production code_
_At commit: `3e67e07` on main (+ this leg's `.context/` commit)_

## Current focus

**A fresh queue exists again.** The board was clean after specs #25 and #26
closed; this leg produced **spec #36 (PRD C — slash commands)** and its four
tickets **#37–#40**, all labelled `ready-for-agent`. Nothing has been
implemented — no production file changed this leg.

The bug PRD C fixes is small and precisely located: `engine.ts`'s message
handler processes exactly one kind of `system` message (the task lifecycle that
feeds the Agents dock) and **discards every other one**. Local command output is
in the discarded set, so a typed `/context` runs, answers, and the wrapper drops
the answer.

## Ticket graph — none started

```
#37 render live output ──┐
#38 blob fix (parser)  ──┤   (independent — any can start)
#39 commands dock ───────┴──> #40 autocomplete
```

| # | Ticket | Blocked by | Delivers |
|---|---|---|---|
| 37 | Render local command output live | none | `/context` shows output; opens with a **capture spike** |
| 38 | Unwrap command invocations on replay | none | reopened session shows `/relay <args>`, not raw markup |
| 39 | Commands dock | none | right dock lists commands; click fills composer |
| 40 | Composer slash-command autocomplete | **#39** | `/` opens a filtered popover |

Only **#40 → #39** is a real edge (it consumes the command-list channel #39
builds). #37/#38/#39 genuinely don't gate each other — work them in ID order
anyway, that is the intended delivery sequence.

## Decisions binding these tickets

Full rationale in [[2026-07-27-slash-commands-are-a-dumb-pipe]]. The load-bearing
shape: **the wrapper never learns what a slash command is.** Typed text goes out
unparsed; the CLI resolves built-ins, project commands, plugin commands, skills
and aliases, exactly as it already does.

## Facts established this leg (don't re-derive)

Measured across **80 real transcript files** in the native store:

- **Persisted subtypes**: `local_command` ×29, `informational` ×2.
- **The persisted subtype is NOT the streamed subtype.** On disk: `local_command`.
  The SDK's streaming type: `local_command_output`. #37 keys on the streamed
  name, #38 on the persisted one.
- **`local_command` carries two unrelated content shapes** under one subtype —
  either `<local-command-stdout>…</local-command-stdout>` (frequently **empty**)
  or `<command-name>/context</command-name>` + `<command-message>` +
  `<command-args>`. This is why replaying output is deferred and only the
  invocation blob is fixed.
- **A real `informational` reads `"Unknown command: /mdoel. Did you mean
  /model?"` at `level: "warning"`** — the CLI's own typo message, arriving on the
  path #37 routes to the `notice` role. The dumb pipe gets this for free.
- **A slash-command invocation persists as a `user` message** whose plain-string
  content is the `<command-name>` markup. `parseTranscript` takes plain strings
  verbatim (`transcript.ts:77`), so **every existing session that used one renders
  raw markup today**. That is #38, and it is a live defect, not new work.
- **Custom commands already reach the CLI.** `settingSources` is unset in the
  engine's options; the SDK documents omission as loading **all** sources (CLI
  default). Resolution never needed fixing — only rendering.
- **`terminal_reason` is an optional field on `SDKResultSuccess`**
  (`sdk.d.ts:4277`), not a separate message. A local command that bypasses the
  model loop still emits `result`/`success` → the turn ends, the composer
  re-arms. No special handling. (Chased and cleared — do not re-investigate.)
- **`supportedCommands()` tracks the CLI's own `commands_changed` pushes**
  (`sdk.d.ts:2904`), so a re-fetch is always fresh. This is why #39 has no cache
  and no push channel.
- **`ensureQuery` is called only from `runTurn`** (`engine.ts:556`), so
  `currentQuery` is `null` until the first send — the reason #39 needs warm-up.
- **`chat:target` destroys the engine wholesale** (`index.ts:202`) and rebuilds
  lazily, so an early-built query is discarded safely on a session switch.
- **Unverified, and #37's first job:** the live streamed shape of local command
  output — exact subtype string, whether content arrives wrapped or unwrapped,
  whether the invocation echo is a separate message. jsdom greens a branch keyed
  on a subtype that never arrives. Capture via the #27 pattern (SDK `query()`
  from a script **outside** the repo), **wisped** — native cannot complete a turn
  on this host.

## Facts from #35 / #34 / #33 / #31 / #30 (still current)

- Measured across **546 transcript files**: user content arrays are
  `["tool_result"]` 17295, `["text"]` 1375, `["image","text"]` 139,
  `["document"]` 14. **`tool_result` never co-occurs** with text or image (17295
  of 17295 pure) — the short-circuit is safe.
- **The 1375 array-of-only-text messages are CLI noise** (skill injections,
  `[Request interrupted by user]`) and **must keep parsing to nothing**. Pinned
  and mutation-verified. Looks like the #35 bug; is not.
- **Replay must never carry the payload** — 2.17 MB of base64 in one real session
  replays as a **114 KB** DOM. Six tests pin the absence.
- **No non-text block carries a filename** — 0 of 185. Chips label by media type.
- **The picker needs no CSP grant**; a picked image renders from the same `data:`
  URL a paste does. A **new** source (`blob:`, `file:`) would need its own grant
  and fails silently without one.
- **A cancel must return BEFORE the fold** — folding `[]` keeps the chips but
  silently wipes an existing rejection. Mutation-verified.
- **`role="img"` on an interactive SVG hides its buttons** from assistive tech —
  use `role="group"`. Testing-library cannot catch it.
- **A static `opacity` loses to an animation that keyframes `opacity`** — put the
  alpha in the colour.
- **Hit-target sizing must be measured within a depth band**, or a nested spine
  collapses every hit circle to `r=0`. Geometry is pure and stays out of DOM tests.
- **`spawnDepth` is not tree depth**; a nested agent reads as top-level while
  live, then nests on the next disk read (accepted lag, list and map both).
  **`parentAgentId` is on 0 of 28 real sidecars** — a live GUI run renders flat.
- **Nothing disappears from the tree or map** — orphans, self-parents and cycle
  members degrade to roots.
- **`taskToParent` is the `local_bash` filter**, not just a lookup.
- **Absent-not-zero is enforced in engine + merge + render**, both halves
  mutation-verified. A settled agent is not re-failed by the drain.
- **The sessions rail renders `<li>` too** — scope dock counts with
  `within(dock())`. The composer tray also renders `.attachment-chip`, so scope
  replay-chip assertions to `.msg-user`.

## Facts from #32 / #29 / #28 / #27 (still current)

- **The renderer CSP is part of the attachment feature.** jsdom never applies CSP.
- **An empty text block is rejected by the API**; an attachments-only send omits
  it. **A rejection must not consume the count budget.** Both mutation-verified.
- **`normalizeSendPayload` is the trust boundary on `chat:send`.**
- **`listSubagents` returns `SubagentInfo[] | null`** — `[]` none spawned
  (ENOENT), `null` could not read; the dock shows live rows on the `null` branch.
- **A sidecar's `model` is the family word asked for**, not the resolved target.
- **Don't re-simplify the drawer's `sessionId` prop away.**
- All four task messages arrive, **`task_notification`** is the real completion
  signal, **`task_updated` is terminal-only**, one correlation key plus a
  separate `task_id`, **`total_tokens` is cumulative context** (labelled `ctx`),
  the spawning tool is named **`Agent`**.

## Known issues / not-our-bug

- **Native backend is unobservable on this host** — the CLI answers `Not logged
  in · Please run /login` with the wisp vars stripped. Anything needing a real
  turn (including #37's capture) must run **wisped**.
- The GUI driver launches with `--disable-gpu`, so screenshots show a flat wash
  instead of acrylic, and **both `page.screenshot({clip})` and
  `locator.screenshot()` mis-frame a window wider than the viewport**. Measure
  geometry in the DOM, never off the image.

## Pick up here

**#37 — Render local command output live.** See [[pick-up]]. Start with the
capture, not with code.

## Deferred (still no spec)

Live-tail external sessions, N-concurrent engines, fork-on-resume, global project
switcher. Busy-switch could graduate from *block* to *detach-with-notice*
([[2026-07-23-busy-switch-block-not-detach]]). From #26: drag-and-drop
attachments, thumbnails on replay, **multiline composer** (re-declined in #36 —
its decisions are orthogonal to autocomplete). From #25: cross-session agent
archive, agent control (kill/retry), map pan/zoom, token totals for historical
agents. From #31: nesting a **live** agent before its sidecar lands. From #32: no
capability gating by model, no `blob:` path for very large pastes. From #33: no
node labels in the map, no inset past ~40 agents. From #34: no directory pick, no
dialog `filters`. From #35: lazy full-image fetch on replay — the marker contract
already allows it. **New from #36:** replaying command *output*, a cache or push
channel for the command list, client-side command validation, distinct styling
per informational level, and handling `prevent_continuation`.

## Landmines (carried forward)

- **Wisp `options.model` = the alias/family NAME, never a resolved model id** — a
  resolved id hangs the turn. See [[2026-07-24-wisp-alias-routes-by-name]].
- **Never run bare `wisp snapshot`** — with no family it snapshots *every* row.
  Clear with `wisp snapshot revert <family>`. (`wisp snapshot list` is not a
  subcommand.) **#36's peer-review automation sacrifices `fable`** and the restore
  must survive a failed review, or every later leg silently runs on the wrong
  model.
- **New `window.api` channel → add to ALL FOUR mock sites** or App-render tests
  throw: `tests/chat-harness.ts` + inline mocks in `sidebar`/`session`/`shell`
  tests. Guard every IPC with `isTrustedIpc`. **#39 adds one.**
- **#39's warm-up must be inert on failure.** `close()` sets `terminalError`
  (`engine.ts:579`) and `runTurn` then fails every send (`:549`) — a tripped
  warm-up hands the user a dead composer having typed nothing.
- **#40's Enter interception must be mutation-verified both ways** — popover open
  accepts, popover closed sends. Backwards breaks sending entirely.
- **Never let the plain-string pin be "fixed" by updating its expectation** —
  `a text-only send keeps plain-string content` is mutation-verified.
- **The array-of-only-text drop is deliberate** — it looks like a bug and is not.
  #38 touches this parser; leave that pin alone.
- Resume ceiling + `sessionId()` accessor + native-store facts + Tailwind
  `@theme` + engine legible-error pins — unchanged, see [[pick-up]].

## Related

- [[overview]] · [[decisions]] · [[pick-up]] · [[stack]] · [[happy-path]]
- [[2026-07-27-slash-commands-are-a-dumb-pipe]]
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
