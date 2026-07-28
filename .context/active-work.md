---
type: active-work
project: claude-wrapper
updated: 2026-07-28
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-07-28 by Opus 5 — landed #52, #53 and #54; queue empty_
_At commit: `d78eee3`_
_Baseline: typecheck clean, build clean, **614 tests green across 48 files**_

## Current focus

**None — the `ready-for-agent` queue is empty.** Spec #41 "Resume anything" was
delivered and closed on 2026-07-28 (#43 `ea7baaf` · #44 `d44c2a2` · #45 `63f12d5`
· #46 `1bdadae` · #47 `8c9cbb7` · #48 `08974d5` · #49 `f71efbf`; #42 `5b66dd9`
standalone). Four follow-ups then landed off the back of it: **#50 `c92cb48`**
cleared the last item its close-out named, and **#51 `08d78a2`**, **#52
`144646c`** and **#53 `cde78c4`** all came from owner bug reports.

**#54 is closed** — found while verifying #52, filed, then fixed in the same
session (`d78eee3`).

## State

- **In flight:** nothing.
- **Done this session (#52 / #53):**
  - **SDK bumped 0.3.217 → 0.3.220** (`241f1ec`). The app runs the CLI **bundled
    in the npm package**, not the host `claude` — it was 2.1.217. Two of the
    CLI's fourteen model rows moved and twelve were byte-identical: `default`
    and `opus[1m]` both went `claude-opus-4-8[1m]` → `claude-opus-5[1m]`. That
    was the entire cause of "opus gives the old opus"; no app change was
    involved.
  - **#53** — the picker list is now `supportedModels()`, read live
    (`cde78c4`). Deleted `FAMILIES`, `parseAliases`, the `wisp routing --json`
    shell-out (**the app's only `child_process` use**) and `ModelOption.group`.
  - **#52** — the pill follows the model the CLI reports, from `init` and each
    assistant message (`144646c`). `picked` and `reported` are separate fields;
    only `picked` becomes `options.model`.
  - **Label follow-up** (`c2a3ec3`) — `modelLabel()` maps a reported resolved id
    back to its row, so the pill says "Haiku" and not
    `claude-haiku-4-5-20251001`. Caught by the GUI check, caused by the two
    commits before it.
  - **Host CLI** (`d814c03`) — `pathToClaudeCodeExecutable` points at the host
    `claude` when PATH has one, so the lockfile no longer decides which Claude
    Code the user talks to; no host install falls back to the bundled binary.
    Owner's call, accepting that a host CLI update can now break the app with
    no code change. Byte-identical to the bundled one today (same sha256).
  - **#54** (`d78eee3`) — `sessionId()` no longer reports an id before a turn
    has run. Warm-up's `hook_started` carries one for a session the CLI has not
    created; resuming into it errored the turn, which is what broke picking a
    model or permission mode before the first send. Both call sites fixed by
    the one gate; `gui-54.mjs` covers each and was proven to fail without it.
  - Decision: [[2026-07-28-the-model-is-the-clis-fact-not-the-pills]].
- **Done earlier this session:**
  - **#50** — `sanitizeUserText` replaces `unwrapCommandInvocation` in
    `src/main/transcript.ts`. One classifier over eight tags, dispatching on the
    **leading tag of the trimmed message**, returning display text or `null` to
    drop. Nine mutations, each killed. Real-store sweep after: **7 of 2972**
    user messages still contain the markup, all prose quoting it, **0** leading
    with a tag, **0** with ANSI — down from 1258 raw.
  - **#51** — four component-scoped `::-webkit-scrollbar` blocks in `styles.css`
    replaced by **one global rule**. The reported model-menu bar was four
    scrollables; the four existing copies had already drifted apart. Pinned on
    the mechanism (no scoped selector may exist), four mutations each killed,
    measured live at **10px** gutter versus a ~15-17px Windows default.
    `DESIGN.md` corrected — it described this as "the chat scrollbar", which is
    what licensed the per-component implementation.
- **Blocked:** nothing.

## Pick up here

**No active work — pick a new task.** The only open tracker item is the
unlabelled umbrella spec #1. Both candidates that had live sightings are now
closed (#50, #51), so the next effort is a genuine choice from *Deferred* below
rather than a queued leftover.

Before starting anything: read [[pick-up]] for the operational landmines, and
`docs/agents/issue-tracker.md` + `docs/agents/triage-labels.md` for tracker
conventions.

## Recent context

- The relay chain (`/relay N=1 read and follow .claude/relay-leg.md`) drained the
  whole spec unattended, one ticket per leg, zero human touches. The Grok-grunt
  delegation layer was **removed** from the body on 2026-07-28 — restore
  procedure is at the bottom of `.claude/relay-leg.md`.
- **This file was slimmed this session.** The per-ticket "facts established by
  #NN" narrative it had accumulated is fully captured in the `decisions/` entries
  and the tickets' close comments; what remains here is current state plus the
  durable traps. If it grows back into a ledger, the right home for the traps is
  a folded `gotchas/` category, not this file.
- The store has grown to **499 sessions**; #49's live drive measured 100 rows
  rendered, 8 qualifying, 8 reads, 491 sessions untouched.

## Open questions

None blocking.

## Landmines (carried forward)

- **Pins are mutation-verified. Never "fix" a red pin by editing its
  expectation.** The one legitimate retirement is when the *ticket* reverses the
  contract the pin describes and says so by name (#42's single-line composer,
  #45's two cwd-scoped list tests, #47's foreign-row pin — rewritten into a
  routing pin, not deleted). That allowance is spent; any other red pin means the
  change is wrong.
- **A green test can be green for the wrong reason.** Assert the mechanism — a
  fetch count, a read that must not happen, an option that must be absent, a call
  ORDER — not a symptom with more than one cause. #43's no-JSONL-read, #44's
  names-only-build, #45's no-`dir`, #46's ordered-call, #47's never-`targetSession`,
  #48's never-`pickFolder` and #49's read-count are the worked examples, all
  mutation-verified.
- **A session id is only resumable once a turn has run** (#54). `sessionId()`
  stays null through warm-up on purpose: `hook_started` carries an id for a
  session the CLI has not created, and resuming into it fails the turn. Every
  caller reads non-null as "resume this", so never widen that gate back out.
- **Never re-derive a store path from `cwd`.** No `encodeCwd`, no
  case-insensitive variant, no decoding a directory name back into a cwd.
  Location is `resolveSessionDir`; `cwdKey()` is comparison and grouping only.
- **Never call `window.api.pickFolder` outside `Welcome`.** It changes main's cwd
  and rebuilds the engine while touching **no** renderer state — the stale-pane
  bug. The chooser is `chooseFolder`; the transition is `switchWorkspace`.
- **Never clear the pane with `newChat()` on a switch path** — it sends
  `targetSession(null)`, closing the engine the transaction just warmed, and its
  `busy` gate can skip a reset main already approved. Use `adoptSession(id)`,
  with `null` meaning "no session, no engine call".
- **Do not add a second busy flag,** and do not disable a foreign row or the
  "Open project" affordance while busy. `Engine.isBusy()` is the one source;
  disabling makes its refusal unreachable.
- **Never un-key the composer.** `<InputBar key={cwd}>` is the entire draft /
  tray / autocomplete reset; removing it re-opens the leak silently.
- **`pendingInsert` must be cleared in the same commit as the cwd change** —
  `InputBar` applies an insert *on mount*, so a survivor refills the new
  project's composer with the old project's command. Its own assertion.
- **Anything workspace-scoped added to App state must join the `ok` branch** of
  `switchWorkspace`. Composer-internal state needs nothing.
- **Do not rebuild the storage index inside `listSessions`,** and do not restore
  `messageCount` by any route. Freshness is `resetSessionIndex()` at the
  `session:list` handler plus a lazy rebuild on the next lookup.
- **Never re-add `customTitle ?? summary`.** Real data can never catch it (0 of
  325 diverge); a synthetic fixture in `tests/session-store.test.ts` is the guard.
- **#49 specifics:** never enrich a row that has not rendered, never derive a
  label during filtering, and never fold enrichment back onto
  `session:transcript` — see [[2026-07-28-lazy-enrichment-is-a-mount-not-a-scan]].
- **#50: never match CLI markup mid-string.** `sanitizeUserText` dispatches on
  the **leading tag of the trimmed message** and that anchor is the whole safety
  argument — pasted terminal logs and quoted diagnoses that mention the markup
  are real user content, and 7 such messages exist in the store today. Turning a
  `startsWith` into an `includes` eats them and is killed by exactly one test.
  **Do not strip ANSI from typed text** either: a real recorded argument is
  `fable[1m]`, whose brackets are literal. Output streams only.
- **#51: never scope a scrollbar rule to a component**, and never add
  `scrollbar-width` / `scrollbar-color` — the standard properties suppress the
  `::-webkit-` pseudo-elements and would silently discard the global rule. A
  shared class is not an improvement: it still has to be remembered at each new
  container, which is exactly how four scrollables shipped the default bar.
  `::-webkit-scrollbar-button { display: none }` and a transparent `-corner` are
  load-bearing, not tidiness.
- **Never write a literal ESC byte or a `\u` escape into source.** `CSI` uses
  `String.fromCharCode(27)`; the raw character is invisible in an editor and the
  escape was repeatedly normalized into the raw byte in transit. Both
  `transcript.ts` and `transcript.test.ts` contain zero raw ESC bytes — keep it
  that way and it stays checkable with a single grep.
- **A session fixture with no `cwd` is a foreign row.** Selectable since #47
  (answered `missing-cwd`), but not in the current group — a UI test wanting an
  in-project row must set `cwd: FOLDER` (exported from `tests/chat-harness.ts`).
- **New `window.api` channel → ALL FOUR mock sites** (`tests/chat-harness.ts` plus
  inline mocks in `sidebar` / `session` / `shell` tests), and guard every IPC with
  `isTrustedIpc`. `titleHint` was the most recent.
- **A module-level cache needs a test reset.** `resetSessionIndex()` and
  `resetEnrichedTitles()` both exist for that reason; without them one suite's
  state decides the next one's.
- **Vitest + `node:fs/promises`:** a module mock must also export `default`, or
  the file dies at import with `No "default" export is defined`. It also needs
  `stat` now.
- **Never add a resize effect to `InputBar`** — height is CSS
  (`field-sizing: content`), deliberately not React state.
- **Never hardcode a model name anywhere.** The list is `supportedModels()`,
  live, uncached. A hand-maintained mirror cannot notice the CLI's list moving,
  and it didn't: four invented family tokens (one of which, `fable`, the CLI
  never advertised) stood while the CLI offered fourteen rows. Two tests in
  `tests/model-mode.test.ts` pin the **absence** of a list-building surface,
  because a re-added constant fails no behavioural test — it is just quietly
  wrong again.
- **Never merge `picked` and `reported` in `model-mode.ts`.** A pick is the
  row's value (`opus[1m]`); a report is a resolved id (`claude-opus-5`). Only
  `picked` may reach `options.model` — a resolved id there is the #23 hang, and
  it surfaces on the *next engine rebuild*, far from the assignment.
  `resolvedModel` on a row is for labelling only.
- **A model report is delivered by injected callback, not an `EngineEvent`.**
  `emit()` only reaches `activeOnEvent`, which is null outside a turn, and the
  `init` carrying the first model arrives during `warmUp()`. As an event it
  would be dropped in exactly the case it exists for.
- **Wisp `options.model`: the CLI shadows the FAMILIES, the bridge resolves the
  ALIASES.** This corrects the note carried since #23. The CLI expands `opus`
  locally *before* the request leaves, so Wisp never sees the token — its
  `opus → claude-opus-5` mapping is not consulted. An id the CLI does not know
  (`claude-wisp-grok`) passes through and the bridge does resolve it. **A stale
  CLI alias table cannot be fixed by rebinding a Wisp family — only by upgrading
  the CLI.** Never run bare `wisp snapshot` — always name the family.
- **The app's CLI is the one bundled in the npm package, not the host
  `claude`.** `node_modules/@anthropic-ai/claude-agent-sdk/manifest.json` names
  its version. Host `claude` being current tells you nothing about the app's.
- **`gh issue close --comment` silently drops the comment if the issue is already
  closed** — a pushed `Closes #N` auto-closes it first. Keep `Closes #N` out of
  the commit, then `gh issue comment` → `gh issue close` → verify.
- **The Bash tool is not PowerShell** — heredoc (`git commit -F - <<'EOF'`), never
  a PowerShell here-string. **Source files are CRLF:** a `perl -0pi` mutation
  spanning a line break needs `\r?\n`, and a pattern containing `/` breaks the
  `s///` delimiter outright — `diff` against a backup before trusting a survivor.
- **A mutation harness must assert its anchor matched exactly once.** #50's run
  first reported four survivors; the cause was `\n` anchors against CRLF source
  matching nothing. A bad anchor and an uncaught mutation look identical in the
  output, so "no test caught it" is not believable until the anchor is proven.
- Native-store facts, the resume ceiling, `sessionId()` accessor, Tailwind
  `@theme` tokens and the engine's legible-error pins are unchanged — [[pick-up]].

## Known issues / not-our-bug

- ~~Transcript REPLAY renders raw CLI markup with ANSI escapes.~~ **Fixed by #50**
  (`c92cb48`) — see [[2026-07-28-sanitizing-replay-markup-is-an-anchor-not-a-strip]].
  The 7 messages that still contain the markup are prose quoting it and are
  correct as-is.
- ~~Picking a model/permission before the first turn errors that turn.~~
  **Fixed by #54** (`d78eee3`). Note `gui-52.mjs` still runs its pick step last,
  which was the workaround — harmless, and no longer required.
- **Fable-5 refuses turns whose cwd looks sensitive** (`Downloads/*`). Path is the
  trigger, model only modulates the odds. Not our bug — don't run wrapper sessions
  there, and don't point a GUI driver's temp cwd there either.
- **GUI driver traps:** `--disable-gpu` flattens acrylic; measure in the DOM, never
  off screenshots; dispatch clicks via `page.evaluate(() => el.click())` because
  Playwright's stability wait hangs on the app's animations; arm a hard
  `setTimeout(process.exit)` before awaiting `app.close()`; never re-read an
  element after an action that may not have happened — inject a probe node;
  **count the side effect you care about**, since an inert button and a cancel
  produce identical DOM; pass any path as an **argument** to `app.evaluate`, never
  inside a string literal; and stub `dialog.showOpenDialog` in main before any
  click that opens one, or the run blocks forever on a real native dialog.

## Deferred (still no spec)

Context-pressure meter
(`Query.getContextUsage()` exists but a naïve percentage lies — it must separate
the raw window from the auto-compaction threshold), typed failed-turn recovery
(`rewindFiles()` needs `enableFileCheckpointing`, which our options do not set),
full-text transcript search, session delete/archive lifecycle, drag-and-drop,
replay thumbnails, live-tail external sessions, N-concurrent engines,
fork-on-resume, busy-switch detach (decided against — block is the behaviour),
folding `Welcome`'s last `pickFolder` caller onto the chooser, agent archive /
control / map pan-zoom, and the smaller leftovers from #31–#36.

## Related

- [[overview]] · [[decisions]] · [[pick-up]] · [[stack]] · [[happy-path]]
- [[2026-07-28-a-scrollbar-belongs-to-the-surface-not-the-component]] ·
  [[2026-07-28-sanitizing-replay-markup-is-an-anchor-not-a-strip]] ·
  [[2026-07-28-lazy-enrichment-is-a-mount-not-a-scan]] ·
  [[2026-07-28-choosing-a-folder-is-not-changing-workspace]] ·
  [[2026-07-28-a-workspace-reset-is-a-remount-not-a-state-sweep]] ·
  [[2026-07-28-the-workspace-switch-is-one-transaction-over-ports]] ·
  [[2026-07-28-the-session-list-is-global-scoping-is-a-render-concern]] ·
  [[2026-07-28-storage-location-is-an-index-not-an-encoding]] ·
  [[2026-07-28-session-metadata-is-the-sdks-job]]
- [[2026-07-28-composer-height-is-css-not-state]] ·
  [[2026-07-27-slash-commands-are-a-dumb-pipe]] ·
  [[2026-07-24-wisp-alias-routes-by-name]] ·
  [[2026-07-23-busy-switch-block-not-detach]]
