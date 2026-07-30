---
type: active-work
project: claude-wrapper
updated: 2026-07-30
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-07-30 by Opus 5 (1M) (auto) — relay leg 2: #60 landed_
_At commit: `4447326` + this `.context` commit; `main` is **pushed** and in sync with `origin/main`_
_Gate at #60: typecheck clean, build clean, **657 tests green across 51 files** (639 + 18 new)_

## Current focus

**Spec #58 — the non-lossy tool inspector**, being drained one ticket per relay leg. Tool cards currently destroy their own evidence: every result is cut to its first non-empty line at 120 chars, and the cut happens *on the way into state* at two separate points while the raw text is already in hand. Measured over the local store, **59.7% of 6,416 results have more than one non-empty line** and 28.7% have a first line past the cap — so most cards are hiding content right now.

**#59 and #60 are landed.** The parity prerequisite is out of the way and the standalone store bug found alongside the spec is fixed. Three tickets remain, all of them #58's, and they are now a **strict chain** — one frontier ticket at a time from here.

## State

- **In flight:** nothing. The branch is merged and deleted; `main` is pushed.
- **Landed this leg:** **#60** (`4447326`) — the session store's three silent failures are now typed values. `listSessions()` → `SessionMeta[] | null`, `readTranscript()` → `TranscriptMessage[] | null`, and `resolveSessionDir()` gained `unavailable` for a store root that will not enumerate. Rail and pane each render the failure with a Retry; both empty states stay quiet. New suite `tests/store-failures.test.tsx` (10 tests) plus 8 in the two store suites. **Eight mutations verified, all killed.**
- **Queue (`ready-for-agent`):** **three tickets, #61–#63.** Frontier is **#61 alone** (zero open blockers, re-verified after the close).
- **Blocked:** #62 by #61; #63 by #62 — **native GitHub dependencies**, live via `issue_dependencies_summary.blocked_by`.
- **Open:** spec **#58** (`ready-for-agent`, closes when its last ticket lands), the unlabelled umbrella **#1**.

## Pick up here

One root now, no choice to make:

- **#61 — full output disclosure on tool cards.** Unblocked by #59, so its parity acceptance can be met for real rather than asserted. Read the three 2026-07-30 tool-card decisions before touching cards; **conditional mount**, never CSS-hidden markup. `tests/engine.test.ts` already holds the parity fixture (`#59 — the same two-block result collapses identically live and on replay`) — do not rebuild one.

Then the chain: **#62** (structured input inspector) → **#63** (Edit hunk diff).

One ticket per branch `ticket/<id>-<slug>`, gate green before merge.

## Skills for next session

- superpowers:test-driven-development — every ticket names a mutation that must kill a test; red-first is the whole discipline here
- superpowers:verification-before-completion — #61's acceptance turns on an *existing* test staying green untouched

## Open questions

None blocking. One deferred owner decision is recorded in #58's Out of Scope: whether an honest Write diff is required at permission time only, or also after an auto-run and in replay. It gates nothing in #59–#63.

## Recent context

- **#60's line sits at the MECHANISM, not the outcome.** Its two requirements pull against each other — "a session directory that cannot be resolved" is a failure, but "a genuinely deleted session still takes the lenient path", and a deleted session *is* an unresolvable directory. They reconcile exactly one way: the store failing to **enumerate** is the error; the store enumerating fine and not holding the id is absence. That is why the new status went into `build()` and not into how `readTranscript` treats `not-found`, and it is why the existing `a session the store does not hold yields []` test stayed green untouched.
- **#60 changed three test expectations, and the reasoning matters more than the change.** `an unreadable store degrades to the empty list`, `an unreadable store is not-found, not a throw` and `a cwd that resolves to nothing is not-found` all encoded the behaviour the ticket exists to change. None is a *commented* behaviour pin — they are plain lenient-degradation tests, and the contract each **names** ("degrades instead of throwing", "not a throw") still holds, since nothing throws and the failure is merely typed now. The commented pins in both files are untouched. The rejected alternative was a vestigial test-only `listSessions` alias to keep the old assertion green — that leaves a pin green for a function nothing calls, which is a worse violation of the same rule than updating the assertion.
- **#60 improved the Agents dock for free.** `subagent-store` already checks `status === 'ok'`, so `unavailable` flows into its existing `Could not read this session's agents.` state with no change.
- **#59's real lesson is about the fixture, not the separator.** The parser had a test named `tool_result content as array of text blocks is joined` — and it supplied **one** block. Every separator agrees on a one-element join, so the test was structurally incapable of failing. The fix was one character; the coverage hole was the bug.
- **#59 changed `extractText` globally, not just the tool-result call site.** The helper is shared with the user-attachment path (an array of image/document markers plus text). Joining multiple prose blocks with `''` runs words together there too, so the single change is a strict improvement and no existing test moved. Don't "scope it properly" in a later pass — that path was considered and rejected as churn.
- Two independent brainstorms (different models, no shared context) ranked the tool inspector **first** out of nine and ten candidates. Convergence chose it; **measurement** justified it — the corpus figures were gathered before committing, precisely because two models agreeing can mean two models sharing a blind spot.
- The design was adversarially reviewed and the reviewer **reversed itself twice**: it dropped a `diff` dependency it had recommended once its own scoping removed the justification, and withdrew a claimed test-pin retirement once the conditional-mount mechanism made the retirement unnecessary. Both reversals are in the spec.
- The safety framing was **downgraded deliberately**. Informed Edit approval was the original headline; `bypassPermissions` resetting every launch made it opt-in, so the spec now leads on inspection. See [[2026-07-30-inspection-is-universal-approval-safety-is-opt-in]].
- Corpus percentages came from an ephemeral read-only script over the native JSONL, with the active session excluded so the analysis could not inflate its own evidence. Reproducible, **not checked in**. Every claim about code is grounded in source.
- No `/hp` MVD was drawn — `hp` is for greenfield, `.context/happy-path.md` already covers the app's golden path, and a disclosure triangle does not earn a diagram.

## Landmines (carried forward)

- **NEW — `[]` and `null` now mean different things on both store channels.** `listSessions` and `loadTranscript` answer `null` for a FAILED read and `[]` for an honest nothing. Any new caller must branch on both; `?? []` at a call site silently restores the exact bug #60 removed. The one deliberate `?? []` is in `titleHint`, and it is commented as such.
- **NEW — never cache a failed index build.** `build()` returns `null` on an unreadable root and `resolveSessionDir` must not install it. An empty index is indistinguishable from an empty store, so caching one lets a single transient failure answer every later lookup until the next `resetSessionIndex()`.
- **NEW — live-tail's failed-read guard is `continue`, never `break`, and never an unguarded throw.** A re-run queued behind a failed read is a fresh attempt and must still get its turn; an exception (e.g. `null.length`) unwinds past the trailing re-run and loses the queued write — which is the staleness live-tail exists to fix. **The "keeps the pane" assertion cannot catch this**, because a throw also leaves the pane alone. The test that can is `a failed read does not swallow the re-run queued behind it`.
- **NEW — a failure notice must retire when the thing it warns about arrives.** Adoption arms the watch even when its own read failed, so a recovered file reaches the pane by itself. The reload's apply branch clears the notice; without that line the warning stands over the conversation it is warning about. Found in diff review, not by the ticket.
- **NEW — the mutation harness must normalise CRLF.** Source files are CRLF; anchors written with `\n` match **zero** times, and a zero-match anchor reads exactly like a surviving mutation. Match against an LF copy, assert the anchor hit exactly once, and restore the byte-exact original.
- **NEW — the collapsed tool-card test is a mechanism check, not a pin to retire.** It feeds a two-line result and asserts line two is absent. #61 must keep it green **untouched** by *conditionally mounting* detail — a CSS-hidden body or a closed `<details>` leaves the text in `textContent` and turns it red correctly. If it goes red, the implementation is wrong.
- **NEW — never render a Write "diff".** Write supplies only path + content, no before-state. Green added lines conceal what was overwritten and manufacture confidence at the deciding moment. Labelled content preview only.
- **NEW — `gh` infers the repo from the working directory.** `cd`-ing out of the clone (e.g. to a temp dir holding a body file) makes every `gh issue create` fail with `no git remotes found`. Stay in the repo and pass absolute `--body-file` paths, or pass `-R <owner>/<repo>`.
- **#57's watcher is epoch-fenced, and the fence is the whole safety argument.**
  Every request bumps `epoch`; a directory lookup that resolves after a newer
  request must not install, and an fs event queued before a teardown must not
  signal after it. Both are pinned. A `handle !== null` check is NOT equivalent
  and does not catch either case.
- **`fs.watch` throws SYNCHRONOUSLY** on ENOENT/EPERM, and the directory it is
  handed comes from a *cached* index — so a directory deleted since the last
  refresh reaches a live `fs.watch` call. main calls the watcher as a bare
  `void`, so an escaping rejection kills the main process. The construction is
  wrapped; never unwrap it.
- **A reload's staleness re-check must not orphan the queued re-run.** A signal
  that arrives while the loop is reading a session the user has since left
  belongs to the session they are on *now*; dropping it holds the new pane
  stale until its next write, and forever if that was the last write before
  quiet — which is exactly the bug #57 exists to fix.
- **Never read `messagesRef` inside the reload loop.** It is written by a
  passive effect, so between two iterations it still reports the pre-reload
  pane and a transient `[]` wipes what the previous iteration just applied.
  Compare against what the loop itself applied (`paneLength`).
- **Live-tail is for a session you are WATCHING, never one you are DRIVING.**
  Adopt sets eligibility; send and new-chat clear it. The eligibility clear on
  send is mutation-verified (removing it kills two tests). The busy condition is
  the spec's third gate and is currently redundant with eligibility — keep it,
  but do not mistake it for the mechanism.
- **Pins are mutation-verified. Never "fix" a red pin by editing its
  expectation.** The one legitimate retirement is when the *ticket* reverses the
  contract the pin describes and says so by name (#42's single-line composer,
  #45's two cwd-scoped list tests, #47's foreign-row pin). That allowance is
  spent; any other red pin means the change is wrong.
- **A green test can be green for the wrong reason.** Assert the mechanism — a
  fetch count, a read that must not happen, an option that must be absent, a call
  ORDER — not a symptom with more than one cause. Corollary: **if a mutation
  kills nothing, the code you mutated may not be what makes the test pass.**
  #57's busy gate is the worked example — its test passes via the eligibility
  clear, not via the busy check. **#59 adds the sibling trap: a one-element
  fixture cannot distinguish a separator.** A test named "…text blocks is
  joined" that supplies ONE block passes under every possible join, so it
  pinned nothing. When a test is about how N things combine, N must be ≥ 2.
- **A session id is only resumable once a turn has run** (#54). `sessionId()`
  stays null through warm-up on purpose: `hook_started` carries an id for a
  session the CLI has not created, and resuming into it fails the turn.
- **Never re-derive a store path from `cwd`.** No `encodeCwd`, no
  case-insensitive variant, no decoding a directory name back into a cwd.
  Location is `resolveSessionDir`; `cwdKey()` is comparison and grouping only.
- **Never call `window.api.pickFolder` outside `Welcome`.** It changes main's cwd
  and rebuilds the engine while touching **no** renderer state — the stale-pane
  bug. The chooser is `chooseFolder`; the transition is `switchWorkspace`.
- **Never clear the pane with `newChat()` on a switch path** — it sends
  `targetSession(null)`, closing the engine the transaction just warmed, and its
  `busy` gate can skip a reset main already approved. Use `adoptSession(id)`,
  with `null` meaning "no session, no engine call". `adoptSession` is also what
  arms live-tail, so a path that bypasses it silently stops tailing.
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
  `::-webkit-` pseudo-elements and would silently discard the global rule.
  `::-webkit-scrollbar-button { display: none }` and a transparent `-corner` are
  load-bearing, not tidiness. **#61/#62's expanded regions inherit the global
  rule — do not give the inspector its own.**
- **Never write a literal ESC byte or a `\u` escape into source.** `CSI` uses
  `String.fromCharCode(27)`; the raw character is invisible in an editor and the
  escape was repeatedly normalized into the raw byte in transit.
- **A session fixture with no `cwd` is a foreign row.** A UI test wanting an
  in-project row must set `cwd: FOLDER` (exported from `tests/chat-harness.ts`).
- **New `window.api` channel → ALL FOUR mock sites** (`tests/chat-harness.ts` plus
  inline mocks in `sidebar` / `session` / `shell` tests), and guard every IPC with
  `isTrustedIpc`. #57's `onSessionChanged` is subscribed on mount, which is why a
  missing mock member kills a suite at render rather than in its own tests.
  **#59–#63 add no channel, so this does not fire for them.**
- **A module-level cache needs a test reset.** `resetSessionIndex()`,
  `resetEnrichedTitles()` and `resetSessionWatcher()` all exist for that
  reason — and the watcher's reset must bump the epoch, not only close the handle.
- **Vitest + `node:fs/promises`:** a module mock must also export `default`, or
  the file dies at import with `No "default" export is defined`. It also needs
  `stat` now.
- **Never add a resize effect to `InputBar`** — height is CSS
  (`field-sizing: content`), deliberately not React state.
- **Never hardcode a model name anywhere.** The list is `supportedModels()`,
  live, uncached. Two tests in `tests/model-mode.test.ts` pin the **absence** of
  a list-building surface, because a re-added constant fails no behavioural test.
- **Never merge `picked` and `reported` in `model-mode.ts`.** A pick is the
  row's value (`opus[1m]`); a report is a resolved id (`claude-opus-5`). Only
  `picked` may reach `options.model` — a resolved id there is the #23 hang, and
  it surfaces on the *next engine rebuild*, far from the assignment.
- **A model report is delivered by injected callback, not an `EngineEvent`.**
  `emit()` only reaches `activeOnEvent`, which is null outside a turn, and the
  `init` carrying the first model arrives during `warmUp()`.
- **Wisp `options.model`: the CLI shadows the FAMILIES, the bridge resolves the
  ALIASES.** The CLI expands `opus` locally *before* the request leaves, so Wisp
  never sees the token. **A stale CLI alias table cannot be fixed by rebinding a
  Wisp family — only by upgrading the CLI.** Never run bare `wisp snapshot` —
  always name the family.
- **The app runs the HOST `claude` when PATH has one** (`cli-path.ts`, resolved
  once at boot, plain PATH walk, no shims, no `child_process`), falling back to
  the CLI bundled in the npm package. A host Claude Code update can therefore
  break the app with no code change here.
- **`gh issue close --comment` silently drops the comment if the issue is already
  closed** — a pushed `Closes #N` auto-closes it first. Keep `Closes #N` out of
  the commit, then `gh issue comment` → `gh issue close` → verify. **`gh issue
  list` also lags a close by a few seconds** — re-query before believing a queue
  is non-empty.
- **The Bash tool is not PowerShell** — heredoc (`git commit -F - <<'EOF'`), never
  a PowerShell here-string. **Source files are CRLF:** a `perl -0pi` mutation
  spanning a line break needs `\r?\n`, and a pattern containing `/` breaks the
  `s///` delimiter outright — `diff` against a backup before trusting a survivor.
  A `for f in …; do … "$f"; done` loop inside a double-quoted Bash-tool command
  loses its `$f`; write the edits out separately instead.
- **A mutation harness must assert its anchor matched exactly once.** A bad
  anchor and an uncaught mutation look identical in the output.

## Known issues / not-our-bug

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
- **Driver trick (gui-55):** a terminal-shaped session can be seeded straight
  into the native store and the SDK lists it — no CLI turn needed to put a real
  adoptable row in the rail. Clean up the seeded store dir on every exit path.

## Deferred (still no spec)

**Newly deferred by #58, with reasons on record:** honest whole-file **Write
diff** in every form (needs a pre-write baseline the event contract lacks;
checkpoint records point at backup files, not before-content); **per-tool rich
card bodies** (TodoWrite checklist, Grep hit list, Read slice — each couples to
one tool's schema); **permission-mode default or persistence** (would make
approval reachable by default, but reverses a recorded owner choice); **adopting
the SDK's richer permission metadata** (`title`, `displayName`, `description`,
`blockedPath`, `decisionReason`, `suggestions` — all currently dropped by the
engine, and a real reason permission cards read as generic); a **wrapper-owned
truncation cap**; a **diff dependency**.

**Found by the brainstorm pair, unspec'd:** stream **extended thinking** as a
collapsed strip (`thinking_delta` is dropped; only `text_delta` is forwarded, so
a reasoning phase reads as a hang); **native turn-end notifications + taskbar
flash** (zero `Notification`/`flashFrame` in `src/`); **type-while-busy composer**
then queued send (the textarea is `disabled={busy}` for the whole turn);
**one-click restart on `terminalError`**; **turn pulse** from the dropped
`tool_progress` / `status` / rate-limit telemetry; **MCP + settings-parse health**
surfacing.

**Carried, unchanged:** live-tail's **incremental byte tailing** and the
**watch-installed-after-the-read gap** (both demand-driven — a `ponytail:`
comment names the fix; do not start on principle). Plus context-pressure meter
(`Query.getContextUsage()` exists but a naïve percentage lies — it must separate
the raw window from the auto-compaction threshold), typed failed-turn recovery
(`rewindFiles()` needs `enableFileCheckpointing`, which our options do not set),
full-text transcript search, **session rename / delete / archive** (the SDK
exports `renameSession`, `deleteSession` and `forkSession`, so this is cheaper
than earlier notes assumed), drag-and-drop, replay thumbnails, N-concurrent
engines, **fork-on-resume** (`forkSession` exists), busy-switch detach (decided
against — block is the behaviour), folding `Welcome`'s last `pickFolder` caller
onto the chooser, agent archive / control / map pan-zoom, and the smaller
leftovers from #31–#36.

## Related

- [[overview]] · [[decisions]] · [[pick-up]] · [[stack]] · [[happy-path]]
- [[2026-07-30-a-failure-is-a-value-absence-stays-lenient]] — #60's line between failure and absence
- [[2026-07-30-disclosure-is-retention-plus-conditional-mount]] ·
  [[2026-07-30-a-diff-without-a-baseline-is-worse-than-none]] ·
  [[2026-07-30-inspection-is-universal-approval-safety-is-opt-in]]
- [[2026-07-23-transcript-parser-pure-renderer-summarises]] — the seam #61 preserves
- [[2026-07-29-live-tail-is-a-signal-not-a-stream]] ·
  [[2026-07-28-the-model-is-the-clis-fact-not-the-pills]] ·
  [[2026-07-28-a-scrollbar-belongs-to-the-surface-not-the-component]] ·
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
  [[2026-07-24-in-app-permission-mode-toggle]] ·
  [[2026-07-23-busy-switch-block-not-detach]]
