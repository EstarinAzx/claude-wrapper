---
type: active-work
project: claude-wrapper
updated: 2026-07-27
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-07-27 — spec #36 fully delivered, queue EMPTY_
_At commit: `c63e170` on main (#40 squash) + this firing's `.context/` commit_

## Current focus

**No queue.** Spec #36 (slash commands) is fully delivered and closed — all
four tickets landed on main, gate-green, 441 tests: #37 `ab7835f`, #38
`c077904`, #39 `0cb6e31`, #40 `c63e170`. The ticket-loop relay chain stopped
itself on queue-dry (state `.claude/relay/ticket-loop.md`, `stop: true`). New
work needs a spec first (`/preset init` or `/hp` → to-spec → to-tickets).

## "Host issue" — RESOLVED, was a driver typo (2026-07-27, later session)

The end-of-leg-1 Electron→CLI spawn failures were **not host-level**: every
gui-40 driver variant declared `PICK_DIR` with single backslashes in a JS
string (`'C:\Users\…'` → `C:UsersS.D…`), so the stubbed folder pick handed the
engine a nonexistent cwd; a Windows spawn with a bad cwd surfaces from the SDK
as `native binary … exists but failed to launch`. gui-39.mjs used `\\` and
worked — the typo was copy-pasted into all five retry variants, faking
reproducibility. **Diagnostic pin: that SDK error can mean bad spawn cwd, not
a broken binary.** After fixing the escape, `gui-40.mjs` passed clean on built
main: popover on `/co` (17 matches), alias matching live (`/usage`),
ArrowDown+Enter inserted `/context-init ` with no submit. **#40 GUI eyeball
complete** — breadcrumb comment on #40. Still-true silver lining: warm-up
inertness was observed live under a real spawn failure (clean reset, honest
`[]`, no dead composer).

## Decisions binding these tickets

Full rationale in [[2026-07-27-slash-commands-are-a-dumb-pipe]] (amended after
#37's capture). The load-bearing shape: **the wrapper never learns what a slash
command is** — typed text goes out unparsed, the CLI resolves everything.

## Facts established by #37's live capture (don't re-derive)

Captured 2026-07-27 via SDK `query()` outside the repo, engine's exact
options, wisped. Full record in the capture comment on #37.

- **The declared streaming subtypes never arrived.** `/context` output and the
  `/mdoel` unknown-command suggestion both stream as **synthetic `assistant`
  messages**: `message.model === "<synthetic>"`, text blocks already unwrapped
  (no `<local-command-stdout>` markup on the stream), zero usage,
  `stop_reason: "stop_sequence"`. **No `stream_event` deltas at all** — that is
  why the old code rendered nothing.
- The turn still ends normally: `result`/`success` with `num_turns: 0` carrying
  the same text. Composer re-arms with no special handling.
- **The invocation echo is not a separate streamed message.**
- The per-turn `system`/`init` message carries `slash_commands: string[]`
  (118 bare names, no leading `/`) — background fact for #39, which still uses
  `supportedCommands()` per the decision (no cache, tracks `commands_changed`).
- Engine now emits `command-output` and `notice` events. Three branches:
  declared `system`/`local_command_output` → `command-output`; declared
  `system`/`informational` → `notice` (transcript-only `info` level dropped);
  synthetic assistant → `command-output`, returning **before** the ordinary
  assistant path. The declared branches are implemented but were never observed
  live — only the synthetic path fires on this CLI version.
- **Empty `local_command_output` content emits nothing** (pinned — empty ghosts
  are worse than nothing).
- Renderer: new `command` role — markdown through the existing `assistant-body`
  styles, `.msg-command` 40px indent, **no avatar** (avatar would attribute CLI
  text to Claude). `notice` events append through the existing notice role.
- **The persisted subtype is still `local_command`** with the two content
  shapes (`<local-command-stdout>` wrapper, often empty, or the
  `<command-name>` triple).

## Facts established by #38 (don't re-derive)

- Real persisted invocation order is `<command-message>` **first**, then
  `<command-name>`, then optional `<command-args>`, newline-joined — the
  ticket's paraphrase had message/name reversed; the store was sampled before
  keying the unwrap.
- `parseTranscript`'s unwrap triggers **only when the plain string starts with
  `<command-message>`** — ordinary prose mentioning the markup stays verbatim;
  a malformed record (empty name) falls back verbatim rather than emitting an
  empty bubble.
- **`<local-command-caveat>` persists as its own standalone user message** and
  still replays verbatim — it is also what sidebar titles show for
  command-first sessions (title path = first user message). Candidate
  follow-up recorded on #38's close comment: drop caveat-only messages as CLI
  noise, fixing replay and titles in one move.
- Persisted `<local-command-stdout>` output carries raw ANSI escape codes —
  reinforces the spec-level deferral of replaying command output.

## Facts from #35 / #34 / #33 / #31 / #30 (still current)

- Measured across **546 transcript files**: user content arrays are
  `["tool_result"]` 17295, `["text"]` 1375, `["image","text"]` 139,
  `["document"]` 14. **`tool_result` never co-occurs** with text or image.
- **The 1375 array-of-only-text messages are CLI noise** and **must keep
  parsing to nothing**. Pinned and mutation-verified. Looks like the #35 bug;
  is not. **#38 touches this parser; leave that pin alone.**
- **Replay must never carry the payload** — 2.17 MB of base64 replays as a
  114 KB DOM. Six tests pin the absence.
- **No non-text block carries a filename** — 0 of 185. Chips label by media type.
- **The picker needs no CSP grant**; a NEW source (`blob:`, `file:`) would need
  its own grant and fails silently without one.
- **A cancel must return BEFORE the fold** — folding `[]` keeps the chips but
  silently wipes an existing rejection. Mutation-verified.
- **`role="img"` on an interactive SVG hides its buttons** — use `role="group"`.
- **A static `opacity` loses to an animation that keyframes `opacity`** — put
  the alpha in the colour.
- **Hit-target sizing must be measured within a depth band.** Geometry is pure
  and stays out of DOM tests.
- **`spawnDepth` is not tree depth**; a nested agent reads as top-level while
  live (accepted lag). **`parentAgentId` is on 0 of 28 real sidecars.**
- **Nothing disappears from the tree or map** — orphans/self-parents/cycles
  degrade to roots.
- **`taskToParent` is the `local_bash` filter**, not just a lookup.
- **Absent-not-zero is enforced in engine + merge + render**, mutation-verified.
- **The sessions rail renders `<li>` too** — scope dock counts with
  `within(dock())`. The composer tray also renders `.attachment-chip`, so scope
  replay-chip assertions to `.msg-user`.

## Facts from #32 / #29 / #28 / #27 (still current)

- **The renderer CSP is part of the attachment feature.** jsdom never applies CSP.
- **An empty text block is rejected by the API**; an attachments-only send
  omits it. **A rejection must not consume the count budget.** Mutation-verified.
- **`normalizeSendPayload` is the trust boundary on `chat:send`.**
- **`listSubagents` returns `SubagentInfo[] | null`** — `[]` none spawned,
  `null` could not read; the dock shows live rows on the `null` branch.
- **A sidecar's `model` is the family word asked for**, not the resolved target.
- **Don't re-simplify the drawer's `sessionId` prop away.**
- All four task messages arrive, **`task_notification`** is the completion
  signal, **`task_updated` is terminal-only**, one correlation key plus a
  separate `task_id`, **`total_tokens` is cumulative context** (labelled `ctx`),
  the spawning tool is named **`Agent`**.

## Known issues / not-our-bug

- **Fable-5 safeguards refuse turns whose cwd looks sensitive** (diagnosed
  2026-07-27, probe matrix in `%LOCALAPPDATA%/Temp/spike-refusal/probe.mjs`).
  Wrapper sessions in `Downloads\.opera` refused plain "hi": fable flags →
  CLI falls back to opus-4-8[1m] → sometimes also refuses → visible
  "Usage Policy" API Error. Reproduced outside Electron with engine-shaped SDK
  options. Tested: fresh `Temp/refusal-probe-*` cwd clean 4/4; `Downloads/.opera`,
  `Temp/.opera`, `Downloads/probe-plain` refuse 3/3 on fable; same cwd with
  `model: 'opus'` (opus-5) clean; no-bypass still refuses → **path is the
  trigger, not permission mode**. CLI default model moved opus-5 → fable-5
  ~2026-07-27 21:12 local, which is why it "used to work". Wrapper renders it
  all faithfully — not our bug. **Correction (23:11 local): model switch is NOT
  a reliable fix — a user turn on explicit `claude-opus-5[1m]` was refused in
  the same folder (session 28384f5a) while two opus-5 probes passed. The
  classifier is probabilistic: fable ~always refuses there, opus-5/opus-4-8
  sometimes; anonymous Temp cwds 4/4 clean on fable. Only robust workaround:
  don't run Anthropic-model sessions in that folder (or Downloads generally —
  `Downloads/probe-plain` also refused).** Extended matrix (23:20 local):
  fable in `D:/wrapper-test` clean; in the user's real `Downloads/anim/game`
  project fable refused (fallback survived) and **sonnet was clean**; a fresh
  wrapper session there double-refused on "hello there". Downloads is the
  poison, model modulates the odds. Also: third live confirmation that the
  SDK's "native binary exists but failed to launch" = **nonexistent spawn
  cwd** (probe pointed at `Downloads/anim-game`; real path is
  `Downloads/anim/game` — store-dir encoding is ambiguous between `-` and
  `\`).
- **Sidebar session titles render raw `<local-command-caveat>…` markup** for
  sessions whose first message was a slash command — observed live during
  #37's GUI pass. #38-adjacent: check whether the title path shares
  `parseTranscript` or needs its own unwrap.
- GUI driver: `--disable-gpu` flattens acrylic; screenshots mis-frame wide
  windows — measure in the DOM. **New from #37's GUI pass:** Playwright's
  actionability "stable" wait hangs on `.msg`/intro animations — dispatch
  clicks via `page.evaluate(() => el.click())`; `locator.scrollIntoViewIfNeeded`
  same problem, use DOM `scrollIntoView`; `app.close()` can hang — add a hard
  `setTimeout(process.exit)` timer to any driver script.

## Facts established by #39 (don't re-derive)

- Engine `warmUp(resume?)` + `listCommands()` exist; `turnEverRun` gates the
  consume loop's inertness (a stream dying before any turn resets to idle, no
  `terminalError`). Mutation-relevant warm-up pins live in `tests/engine.test.ts`.
- `window.api.listCommands()` (guarded `commands:list`) is live at all four
  mock sites — **#40 reuses it, no new channel needed.**
- App holds `openDock: 'agents' | 'commands' | null` (mutual exclusion) and a
  `{text, nonce}` pending-insert; InputBar's insert effect keys on the nonce.
- Live-verified over the bridge: `supportedCommands()` answered 118 commands
  before any send.
- The commands dock has no resize handle (agents dock does) — deliberate; add
  only if asked.

## Facts established by #40 (don't re-derive)

- `SlashCommandInfo` carries optional `aliases` (absent-not-empty); the engine
  passes non-empty alias arrays through. Autocomplete matches prefix on names
  AND aliases.
- Popover trigger window: value starts with `/` and has no space. The Enter
  pin (open intercepts / closed submits) is mutation-verified both directions
  in `tests/autocomplete.test.tsx`.
- **The popover re-fetches `listCommands` on every keystroke in the window** —
  a single fetch landing `[]` mid-warm-up wedges it shut otherwise. Observed
  live, invisible to jsdom, pinned by a regression test.
- Composer stays single-line (multiline still deferred, decisions orthogonal).

## Pick up here

**Nothing queued.** Spec #36 done. Next session: new spec, or the deferred
list below is the seed material.

## Deferred (still no spec)

Live-tail external sessions, N-concurrent engines, fork-on-resume, global
project switcher, busy-switch detach ([[2026-07-23-busy-switch-block-not-detach]]).
From #26: drag-and-drop, replay thumbnails, multiline composer. From #25:
agent archive, agent control, map pan/zoom, historical token totals. From #31:
nesting a live agent pre-sidecar. From #32: capability gating, `blob:` for
large pastes. From #33: map node labels, inset past ~40 agents. From #34:
directory pick, dialog filters. From #35: lazy full-image fetch on replay.
From #36: replaying command *output*, command-list cache/push channel,
client-side validation, per-level informational styling, `prevent_continuation`.

## Landmines (carried forward)

- **Wisp `options.model` = the alias/family NAME, never a resolved model id**
  — see [[2026-07-24-wisp-alias-routes-by-name]].
- **Never run bare `wisp snapshot`** — always name the family; recover with
  `wisp snapshot revert <family>`. **#36's peer-review automation sacrifices
  `fable`** — restore must survive a failed review.
- **New `window.api` channel → add to ALL FOUR mock sites** (`tests/chat-harness.ts`
  + inline mocks in `sidebar`/`session`/`shell` tests). Guard every IPC with
  `isTrustedIpc`. **#39 adds one.**
- **#39's warm-up must be inert on failure** — `close()` sets `terminalError`
  (`engine.ts:579`… now shifted by #37's edits; search, don't trust the line),
  and `runTurn` then fails every send. A tripped warm-up = dead composer.
- **#40's Enter interception must be mutation-verified both ways** — popover
  open accepts, closed sends. Backwards breaks sending.
- **Never let the plain-string pin be "fixed" by updating its expectation** —
  `a text-only send keeps plain-string content` is mutation-verified.
- **The array-of-only-text drop is deliberate** — #38 touches this parser;
  leave the pin alone.
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
