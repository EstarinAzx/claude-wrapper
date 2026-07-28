---
type: active-work
project: claude-wrapper
updated: 2026-07-28
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-07-28 by Opus 5 (relay leg 6, auto) — landed #47; 2 tickets left_
_Baseline: typecheck clean, build clean, **533 tests green across 42 files**_

## Current focus

**#47 — renderer wired to `switchWorkspace`: landed** on main as `8c9cbb7`.
Cross-project session rows are **live**: selecting one runs #46's transaction
over `session:switch-workspace` and, only on `ok`, drops the whole workspace —
cwd, `useChat`, `openDock`, `pendingInsert`, `openSubagent` — with the composer
**keyed on `cwd`** so it remounts. Suite went 517 → 533. Live GUI drive passed
against the real store (100 rows, **0 inert**, a real cross-project switch, a
real `missing-cwd` refusal).

**Next: #48 — Folder picker reachable after the first pick.** #49 is unblocked
too and independent of #48.

Spec **#41 — Resume anything** is the remaining work, two tickets:

| # | Job | blocked_by (live) |
|---|---|---|
| #48 | Folder picker reachable after first pick | 0 — **next** |
| #49 | Lazy title enrichment for slash-command-first sessions | 0 — also open |

Order: `#48 → #49`. Blocked-ness is authoritative
from `gh api repos/<owner>/<repo>/issues/<n> --jq
'.issue_dependencies_summary.blocked_by'` — `gh issue list --json` does **not**
expose that field.

Run with `/relay N=1 read and follow .claude/relay-leg.md`.

## How this queue was specced (2026-07-28)

Design was adversarially grilled against `gpt-5.6-sol` through the wisp-slot
skill, then every quantitative claim was verified independently at a terminal
rather than trusted. What the grilling changed:

- Killed a proposed "workspace" spec as an incoherent grab-bag; replaced it with
  the "Resume anything" framing (session history is the entry point to cwd).
- Caught that paste-to-attachment **already ships** — it was wrongly listed as a
  gap.
- Found that the "never break a pin" rule would have deadlocked #42 against
  `'the composer is still a single-line input'`; that retirement was authorized
  by name and has now been spent.
- Split the workspace transition at a **dormant-API seam** (#46 merges unused
  and safe, #47 wires it) instead of shipping one cross-process rewrite.
- Final red-team caught a structural gap: #48's whole purpose is empty folders,
  but #46 required a `resumeId` no empty folder has, and #48 forbade the only
  existing cwd chooser without providing a replacement. Fixed before publish —
  `resumeId: string | null` plus a non-mutating chooser IPC.

**Measured facts behind spec #41** (do not re-derive; full list in the spec
body): `listSessions` is a top-level pure-filesystem export needing no CLI,
421ms for all 490 sessions; `SDKSessionInfo` has **no `messageCount`**; 0 of 490
sessions carry raw command markup in `summary`/`firstPrompt`/`customTitle`, so
the SDK path kills the raw-markup title defect; 0 of 325 `customTitle` values
diverge from `summary`, making a coalesce redundant; 490 sessions across 37
cwds, 5 with no cwd at all; `encodeCwd` **misses 6 of 37 real store
directories** from drive-letter case drift.

## Facts established by #47 (don't re-derive)

- **The channel is `session:switch-workspace`** (`invoke`, `isTrustedIpc`-guarded).
  A malformed or untrusted payload collapses to `{cwd: null, resumeId: null}`,
  which the transaction rejects as `missing-cwd` — inert by construction, since a
  rejection mutates nothing. `SwitchRequest` / `SwitchResult` / `SwitchStatus`
  moved to `src/shared/session-types.ts` (both processes speak them);
  `switch-workspace.ts` re-exports them so its callers keep one import site.
- **The composer is `key={cwd}`.** Draft, attachment tray and autocomplete state
  live only inside `InputBar`; a remount is the only exhaustive reset and makes
  anything a future ticket adds to the composer workspace-scoped for free. See
  [[2026-07-28-a-workspace-reset-is-a-remount-not-a-state-sweep]].
- **`pendingInsert` must be cleared in the same commit as the cwd change.**
  `InputBar` applies a pending insert **on mount**, so a survivor refills the new
  project's composer with the old project's slash command. This is a *different*
  leak from a stale draft and needs its own assertion.
- **`useChat.adoptSession(id)` replays a transcript WITHOUT `targetSession`.**
  `openSession` is now `adoptSession` + `targetSession`. On the switch path the
  transaction has already closed → rebuilt → targeted → warmed the engine, and
  `chat:target` closes and nulls it — so the in-project resume path on top undoes
  the warm-up. Pinned: `targetSession` never fires on a switch.
- **A foreign row is NOT gated on the renderer's `busy` flag; a local row still
  is.** `Engine.isBusy()` is the one source, and disabling the row would make the
  `busy` refusal unreachable from the UI.
- **A rejection renders one inline `role="status"` line** (`.switch-refusal`)
  above the composer — never a chat message, because nothing happened. The three
  refusals are phrased distinctly on purpose; a generic string hides the only one
  the user can act on.
- **Backend mode, permission mode and model are not workspace state** and survive
  a switch — asserted via the pills *and* via their setters never being called.
- **Ten mutations run**, each killing exactly its target (drop `key={cwd}` 4,
  reset regardless of status 7, drop `setCwd` 5, re-disable foreign rows 17,
  route foreign → `onOpen` 15, `adoptSession` → `openSession` 1, drop
  `setPendingInsert(null)` 2, drop `setOpenDock(null)` / `setOpenSubagent(null)` /
  `setRefusal(null)` 1 each).
- **`.session-row-btn-foreign:disabled` is gone** — foreign rows are never
  disabled now, so that rule was dead. Foreign still reads secondary via the
  muted title alone (verified live: the computed colours differ).
- **Measured live at the change**: 9 groups, 100 rows, **0 inert** (36 were inert
  under #45), a real switch from this repo into `C:\Users\S.D` with the
  transcript, draft and tray all following, the rail regrouping around the new
  workspace, and a cwd-less session refused end to end with the pane
  byte-identical.
- **`gui-47.mjs` is committed.** It logs a `SKIPPED` line for anything it could
  not drive (the `busy` refusal needs a real streaming turn) rather than passing
  silently.
- **Still open, no ticket: transcript REPLAY renders raw
  `<local-command-caveat>` / `<command-name>` / `<local-command-stdout>` markup
  with ANSI escapes.** Confirmed live this leg. #43 killed this on the *title*
  path only, and #49 merely enriches titles — the replay path is the deferred
  "strip at the parsing boundary" item and now has a sighting, noted on #47's
  close comment.

## Facts established by #46 (don't re-derive)

- **`switchWorkspace` is exported from `src/main/index.ts`, but its logic is in
  `src/main/switch-workspace.ts`** as a pure function over an eight-method
  `SwitchPorts`. The entry module cannot be imported under vitest, and the order
  of the success path plus the emptiness of each rejection are exactly what needs
  asserting. See
  [[2026-07-28-the-workspace-switch-is-one-transaction-over-ports]].
- **Precedence is `busy → missing-cwd → not-found`**, all predicates before the
  first mutation. Inverting the last two also fails typecheck (`cwd` is still
  `string | null` at that point) — the type system backs the ordering.
- **`resumeId: null` returns `ok`, clears the prior target and never touches the
  index.** It is the new-chat / empty-folder case, not an error.
- **The `ok` sequence is `closeEngine → cancelPermissions → setCwd →
  rebuildEngine → setResume → warmUp`**, resume written **after** the rebuild.
- **`Engine.isBusy()` is new** (`turnResolve !== null`, added to the shared
  `Engine` interface). Never add a second busy flag — this is the source of
  truth `runTurn` already rejects a second turn on.
- **It merged dormant and must stay that way until #47:** no IPC channel, no
  preload entry, no renderer import. `grep -rn switchWorkspace src/ tests/`
  returns only the definition and its unit tests.
- **Eight mutations run, each killing exactly its target** (drop `warmUp`,
  reorder `setResume`, reorder `setCwd`, drop the busy check, invert precedence,
  consult the index on null, close before validating, stub `isBusy` false).
- **No GUI drive** — the ticket has no rendering surface. #47 and #48 do.

## Facts established by #45 (don't re-derive)

- **`listSessions()` takes no arguments and passes no `dir`.** That omission is
  what makes the SDK global. `includeWorktrees` is **settled by construction** —
  the SDK applies it only when `dir` is given, so #43's open flag is dissolved,
  not answered. See
  [[2026-07-28-the-session-list-is-global-scoping-is-a-render-concern]].
- **`SessionMeta.cwd?: string`** — absent, not `''`, when the store records none.
- **Filter / group / cap is one pure module**, `src/shared/session-groups.ts`,
  and the ORDER is a contract: filter the complete loaded metadata → sort and
  group the matches → cap at the newest **100 matches globally**. Capping first
  makes a truncated list read as empty; capping per group is 3700 rows at 37
  projects. Both inversions are mutation-covered.
- **Groups need no second sort.** First-appearance order over a newest-first
  page already *is* "most recent group first".
- **`cwdKey`'s fold now lives in `src/shared/cwd-key.ts`**; main-side `cwdKey`
  still `resolve()`s then folds. Still comparison-only — never join it to a path.
- **A foreign row is rendered and inert** (`disabled`), and the pin clicks it and
  asserts `loadTranscript` never fired. Disabled-looking is not the requirement.
- **Measured live at the change**: 495 sessions, 61 store directories, 9 groups
  in the first page, cap engaged at exactly 100, 64 rows enabled / 36 inert,
  full-path filter → 1 group with 0 foreign rows, `Show more` → 200 rows.
- **`gui-45.mjs` is committed** and arms its hard exit *before* awaiting
  `app.close()` — the older drivers print `TIMEOUT` over an already-printed PASS
  when close hangs.
- **Two session-store tests were replaced, not weakened.** They encoded the
  cwd-scoped contract #45 reverses by name. That is the *only* legitimate reason
  to retire a pin: the ticket changes the contract the pin describes.
- **Session fixtures now need `cwd: FOLDER`** (exported from `chat-harness.ts`)
  or their rows are foreign and inert. This bit `resume`, `switching` and
  `agents-dock`.

## Facts established by #44 (don't re-derive)

- **`encodeCwd` is deleted.** Storage location comes from
  `resolveSessionDir(sessionId, hintCwd?, io?)` in `src/main/session-index.ts`.
  `cwd` is a display value plus a duplicate tie-break hint — **never** join it
  into a store path. See
  [[2026-07-28-storage-location-is-an-index-not-an-encoding]].
- **Measured live at the change** (store has grown since spec #41's numbers):
  61 store directories, 589 index entries, index build **12ms**, 494 sessions,
  index resolves **494/494**, `encodeCwd` would have missed **45**, sessions
  with no cwd **6**, duplicate ids **0**.
- **The index reads names only** — `<id>.jsonl` and bare `<id>/` directories.
  A test asserts `readFile` is never called during a build; opening transcripts
  to build the index is the regression that test exists to catch.
- **`resolveResumeTarget(id, cwd)` is #46's front door** and returns
  `{status:'missing-cwd'}` when the session records no cwd. #45's "Unknown
  project" group is backed by that, and `cwdKey()` is the grouping key —
  comparison only, never a path.
- **Miss handling is rebuild-once-retry-once**, pinned by a `readdir` call-count
  test. A loop there is what that count forbids.
- **Freshness = `resetSessionIndex()` on `session:list`**, lazily rebuilt on the
  next lookup. Deliberately *not* an eager rebuild inside `listSessions` — that
  would trip #43's no-JSONL-read pin, which asserts no directory scan happens on
  the list path.
- **`readTranscript(null, id)` now works.** Replay is not resume: a session
  whose cwd is unknown still has a transcript, and the index finds it by id.

## Facts established by #43 (don't re-derive)

- **`SessionMeta` is now the SDK's row, renamed** — `sessionId → id`,
  `summary → title`, `lastModified → lastUpdated`, and nothing else. The
  line-parsing `summary()` / `extractText` reader is **deleted**;
  `session-store.ts` is 20 lines of mapping plus the untouched `readTranscript`.
- **`messageCount` no longer exists** anywhere in `src/` or `tests/` (was 21
  references). It is not coming back: `SDKSessionInfo` has no such field and
  deriving it means restoring the per-file parse. The sidebar row meta is the
  relative time alone.
- **Never re-add `customTitle ?? summary`.** The SDK already coalesces custom
  title → auto-summary → first prompt into `summary`. See
  [[2026-07-28-session-metadata-is-the-sdks-job]].
- **Measured live after the change** (not from the spec): 64 sessions for this
  project in **199ms**, 0 rows with an undefined `sessionId`/`summary`/
  `lastModified`, **0 titles carrying `<local-command-caveat>` /
  `<command-name>` markup**. The raw-markup sidebar-title defect is dead on this
  path; replay is a separate path and still parses transcripts.
- **`includeWorktrees` defaults to `true`** in `ListSessionsOptions` — left at
  the default, so a project inside a git repo now also lists sessions from its
  worktree paths. Small, real widening of "cwd-scoped"; flagged for #45.
- **Mocking `node:fs/promises` in vitest needs a `default` export too** —
  `vi.mock('node:fs/promises', () => ({ ...fs, default: fs }))`. Without it the
  whole suite file fails to import with `No "default" export is defined`.

## Facts established by #42 (don't re-derive)

- **The composer is a `<textarea rows={1}>`.** Height is CSS only — see
  [[2026-07-28-composer-height-is-css-not-state]]. **Never add a resize effect
  to `InputBar`**; there is deliberately no `scrollHeight` measurement and no
  inline `style.height`.
- `field-sizing: content` **is supported in this Electron (43)** — verified
  live via `getComputedStyle`, not assumed. Cap arithmetic confirmed in the DOM:
  33px empty, 75px at 3 lines, 180px at 8 (the cap, = 8 × 21 + 12), 180px with
  `scrollHeight` 432 at 20 lines, 33px again on clear **and** on send.
- **Shift+Enter is handled ahead of the popover branch**, plain-Enter submit
  stays after it. That ordering is the whole of criterion 4 and is
  mutation-verified; demoting it turns a break into a command accept.
- Newline insertion uses **`el.setRangeText('\n', start, end, 'end')`** then
  mirrors `el.value` into state — the caret is the DOM's problem, not React's.
  Appending at the end instead fails two tests.
- **The command trigger window now closes on `/\s/`, not `' '`.**
- `.bubble` carries `white-space: pre-wrap` **and** `overflow-wrap: anywhere`;
  a 400-char unbroken token wraps to 9 lines with no horizontal overflow (live).
- `.input-pill` is `align-items: flex-end` so the paperclip and send button ride
  the last line of a grown composer.
- **A green test can be green for the wrong reason.** The first whitespace-trigger
  test asserted only "no popover" — and a reverted `.includes(' ')` also renders
  no popover, because `context\nsecond` matches no command name either way. It
  passed under mutation. The fix was to assert the **`listCommands` fetch count**,
  which is what distinguishes *window closed* from *merely unmatched*. Assert the
  mechanism, not a downstream symptom that has more than one cause.

## "Host issue" — RESOLVED, was a driver typo (2026-07-27)

The end-of-leg-1 Electron→CLI spawn failures were **not host-level**: every
gui-40 driver variant declared `PICK_DIR` with single backslashes in a JS
string (`'C:\Users\…'` → `C:UsersS.D…`), so the stubbed folder pick handed the
engine a nonexistent cwd; a Windows spawn with a bad cwd surfaces from the SDK
as `native binary … exists but failed to launch`. **Diagnostic pin: that SDK
error can mean bad spawn cwd, not a broken binary.**

**Structurally fixed in `gui-42.mjs` (2026-07-28):** the stub path is passed as
an **argument** to `app.evaluate`, never interpolated into a string literal, so
the escaping trap cannot recur. That driver is **committed** rather than thrown
away — the five-variant copy-paste that faked reproducibility happened because
there was no canonical one to start from.

## Decisions binding this work

- [[2026-07-28-a-workspace-reset-is-a-remount-not-a-state-sweep]] — #47's
  `key={cwd}` composer remount, the same-commit `pendingInsert` clear, the
  `adoptSession` / `openSession` split, the deliberately un-busy-gated foreign
  row, and the inline refusal line.
- [[2026-07-28-the-workspace-switch-is-one-transaction-over-ports]] — #46's
  ported transaction, the fixed precedence, the after-rebuild resume write, and
  `Engine.isBusy()` as the single busy source #47 must call rather than re-derive.
- [[2026-07-28-the-session-list-is-global-scoping-is-a-render-concern]] — #45's
  global list, the fixed filter/group/cap order, and the inert foreign row #47
  is the one allowed to wire up.
- [[2026-07-28-storage-location-is-an-index-not-an-encoding]] — #44's index, the
  demotion of `cwd` to a display value, and the typed `missing-cwd` rejection
  #45/#46 consume.
- [[2026-07-28-session-metadata-is-the-sdks-job]] — #43's list source, the
  deleted `messageCount`, and the coalesce that must not come back.
- [[2026-07-28-composer-height-is-css-not-state]] — #42's height model.
- [[2026-07-27-slash-commands-are-a-dumb-pipe]] — the wrapper never learns what
  a slash command is; typed text goes out unparsed.

## Facts established by #37–#40 (don't re-derive)

- **The declared streaming subtypes never arrived.** `/context` output and the
  `/mdoel` suggestion stream as **synthetic `assistant` messages**
  (`message.model === "<synthetic>"`, text already unwrapped, zero usage,
  `stop_reason: "stop_sequence"`). **No `stream_event` deltas at all.** The turn
  still ends with `result`/`success`, `num_turns: 0`.
- The per-turn `system`/`init` message carries `slash_commands: string[]` (118
  bare names). **Empty `local_command_output` content emits nothing** (pinned).
- Renderer `command` role: markdown through `assistant-body` styles, 40px
  indent, **no avatar**. The persisted subtype is still `local_command`.
- Real persisted invocation order is `<command-message>` **first**, then
  `<command-name>`, then optional `<command-args>`. `parseTranscript` unwraps
  **only** when the plain string starts with `<command-message>`.
- **`<local-command-caveat>` persists as its own standalone user message**, is
  what sidebar titles show for command-first sessions, and carries raw ANSI in
  the stdout shape. Candidate follow-up on #38's close comment.
- Engine `warmUp(resume?)` + `listCommands()` exist; `turnEverRun` gates the
  consume loop's inertness. **A tripped warm-up = dead composer.**
- `window.api.listCommands()` is live at all four mock sites.
- App holds `openDock: 'agents' | 'commands' | null` and a `{text, nonce}`
  pending-insert; InputBar's insert effect keys on the nonce.
- `SlashCommandInfo` carries optional `aliases` (absent-not-empty). **The
  popover re-fetches `listCommands` on every keystroke in the window** — a
  single fetch landing `[]` mid-warm-up wedges it shut otherwise.

## Facts from #35 / #34 / #33 / #31 / #30 (still current)

- Measured across **546 transcript files**: user content arrays are
  `["tool_result"]` 17295, `["text"]` 1375, `["image","text"]` 139,
  `["document"]` 14. **`tool_result` never co-occurs** with text or image.
- **The 1375 array-of-only-text messages are CLI noise** and **must keep
  parsing to nothing**. Pinned and mutation-verified.
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
  **Path is the trigger; the model only modulates the odds.** Fable ~always
  refuses in `Downloads/*`; opus-5 and opus-4-8 sometimes do (session
  `28384f5a` was refused on explicit `claude-opus-5[1m]` in that folder);
  anonymous `Temp/*` cwds were 4/4 clean on fable, `D:/wrapper-test` clean,
  and in the user's real `Downloads/anim/game` project **sonnet was clean while
  fable refused**. Only robust workaround: **don't run wrapper sessions under
  `Downloads`.** Wrapper renders it faithfully — not our bug.
- ~~Sidebar session titles render raw `<local-command-caveat>…` markup~~ —
  **fixed by #43** as a side effect of moving titles to the SDK's `summary`
  (0 of 490 store-wide, 0 of 64 for this project). #49 is now only about
  *enriching* bare slash-command titles, not de-markup-ing them.
- **Transcript REPLAY still shows that markup** — `<local-command-caveat>`,
  `<command-name>`, `<local-command-stdout>`, ANSI escapes and all. Seen live
  during #47's GUI drive. Different code path from the title fix, no ticket yet;
  it is the deferred "strip at the parsing boundary with a small local sanitizer"
  item. Do **not** fold it into #49, which is titles only.
- GUI driver traps: `--disable-gpu` flattens acrylic; screenshots mis-frame wide
  windows — **measure in the DOM**. Playwright's actionability "stable" wait
  hangs on `.msg`/intro animations — dispatch clicks via
  `page.evaluate(() => el.click())`; same for `scrollIntoViewIfNeeded`.
  `app.close()` can hang — add a hard `setTimeout(process.exit)`.
  **New 2026-07-28:** a probe that re-reads an element *after* an action that
  may not have happened is a false green — `gui-42.mjs`'s long-token check
  originally re-measured the **previous** bubble because the second send was
  swallowed while the engine was busy, and reported a pass. It now injects a
  cloned node and measures that.

## Pick up here

**#48 — Folder picker reachable after the first pick.** Unblocked (#49 is too
and is independent). The atomic renderer reset #48 was sequenced behind now
exists: reuse `switchWorkspace` with **`resumeId: null`** — the first-class
"open this workspace with a new chat" case, which skips the index entirely and
is exactly what an empty folder needs. See [[pick-up]] for the queue and
landmines.

## Deferred (still no spec)

Live-tail external sessions, N-concurrent engines, fork-on-resume, busy-switch
detach ([[2026-07-23-busy-switch-block-not-detach]] — #46 implements *block*,
the decided behavior). From #26: **drag-and-drop** (explicitly out of scope in
#42 and still unimplemented), replay thumbnails. From #25: agent archive, agent
control, map pan/zoom, historical token totals. From #31: nesting a live agent
pre-sidecar. From #32: capability gating, `blob:` for large pastes. From #33:
map node labels, inset past ~40 agents. From #34: dialog filters. From #35: lazy
full-image fetch on replay. From #36: replaying command *output*, command-list
cache/push channel, client-side validation, per-level informational styling,
`prevent_continuation`.

**Considered and deliberately deferred during the 2026-07-28 grilling**, with
reasons worth keeping:

- **Context-pressure meter.** `Query.getContextUsage()` exists and our
  `QueryHandle` in `engine.ts` narrows it away — but a naïve percentage lies by
  omission: it must distinguish the raw window from the auto-compaction
  threshold, or "92%" reads as danger when it means routine compaction.
- **Typed failed-turn recovery.** A failed turn may already have edited files or
  run commands. The SDK carries `refused_user_message_uuid` and `rewindFiles()`,
  but rewind needs `enableFileCheckpointing`, which our query options do not
  set. Define which failures are retryable before ticketing any Retry button.
- **Command-output replay.** Persisted `<local-command-stdout>` carries raw
  ANSI; strip at the parsing boundary with a small local sanitizer.

## Landmines (carried forward)

- **Pins are mutation-verified. Never "fix" a red pin by editing its
  expectation.** #42 spent the only authorized retirement in this queue. Any
  other red pin means the change is wrong.
- **Never re-derive a store path from `cwd`.** No `encodeCwd`, no
  case-insensitive variant of it, no decoding a directory name back into a cwd.
  Storage location is `resolveSessionDir`; `cwdKey()` is for comparison only.
- **Required test coverage in the remaining tickets is not optional** — the
  call-count assertion (#49) is the last one outstanding. #43's no-JSONL-read,
  #45's no-`dir`, #46's ordered-call and #47's never-`targetSession` assertions
  are landed and mutation-verified; they are the working examples of the pattern.
- **Do not add a second busy flag.** `Engine.isBusy()` is the source of truth
  and `switchWorkspace` already consults it — the renderer must not re-derive
  "busy" from stream state and decide for itself. Corollary from #47: **do not
  "fix" the live foreign row by disabling it while busy.** That re-introduces the
  second opinion *and* makes the `busy` refusal unreachable.
- **Never un-key the composer.** `<InputBar key={cwd}>` is the whole of the
  draft / tray / autocomplete reset; removing it re-opens the leak silently and
  kills four tests.
- **Anything workspace-scoped added to App state must join the `ok` branch of
  `switchWorkspace`** in `App.tsx`. Composer-internal state needs nothing — the
  remount covers it.
- **A session fixture with no `cwd` is a foreign row** and is inert. New UI
  tests that click a session row must set `cwd: FOLDER`.
- **Never add a resize effect to `InputBar`** —
  [[2026-07-28-composer-height-is-css-not-state]].
- **Wisp `options.model` = the alias/family NAME, never a resolved model id** —
  [[2026-07-24-wisp-alias-routes-by-name]].
- **Never run bare `wisp snapshot`** — always name the family; recover with
  `wisp snapshot revert <family>`.
- **New `window.api` channel → add to ALL FOUR mock sites** (`tests/chat-harness.ts`
  + inline mocks in `sidebar`/`session`/`shell` tests). Guard every IPC with
  `isTrustedIpc`.
- **Never let the plain-string pin be "fixed" by updating its expectation** —
  `a text-only send keeps plain-string content` is mutation-verified.
- **The array-of-only-text drop is deliberate.**
- **`gh issue close --comment` silently drops the comment when the issue is
  already closed** — a pushed `Closes #N` auto-closes it first, so the
  breadcrumb vanishes. Use `gh issue comment`, and verify it landed.
- Resume ceiling + `sessionId()` accessor + native-store facts + Tailwind
  `@theme` + engine legible-error pins — unchanged, see [[pick-up]].

## Related

- [[overview]] · [[decisions]] · [[pick-up]] · [[stack]] · [[happy-path]]
- [[2026-07-28-a-workspace-reset-is-a-remount-not-a-state-sweep]] ·
  [[2026-07-28-the-workspace-switch-is-one-transaction-over-ports]] ·
  [[2026-07-28-the-session-list-is-global-scoping-is-a-render-concern]] ·
  [[2026-07-28-storage-location-is-an-index-not-an-encoding]]
- [[2026-07-28-session-metadata-is-the-sdks-job]] ·
  [[2026-07-28-composer-height-is-css-not-state]] ·
  [[2026-07-27-slash-commands-are-a-dumb-pipe]]
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
