---
type: active-work
project: claude-wrapper
updated: 2026-07-29
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-07-29 by Fable 5 (relay ticket-loop leg 2) — #57 delivered, spec #55 closed_
_At commit: `dc87844` (live-tail core on main; ahead of origin before this `.context` commit)_
_Baseline: typecheck clean, build clean, **637 tests green across 50 files** (was 614/48)_

## Current focus

**None — the `ready-for-agent` queue is empty.**

Spec #55 (live-tail external sessions) is **delivered and closed**, with both
its tickets closed: #56 (the gui-55 driver, seen red first) and #57 (the core).
`node .claude/skills/run-desktop/gui-55.mjs` now prints `PASS` unchanged —
pane 2 → 3 messages after an external append, `session:changed` observed on the
main side. The red run is on record in #56, so the green means something.

## State

- **In flight:** nothing — #57's branch is squash-merged and deleted.
- **Queue (`ready-for-agent`):** **empty.**
- **Blocked:** nothing.
- **Open:** only the unlabelled umbrella **#1**.

## Pick up here

**Nothing is queued.** The next session needs a human to choose the next piece
of work — the deferred list at the bottom of this file is the menu, and
`/preset init` or `to-spec` → `to-tickets` is the road from an idea to a queue.
Nothing is pushed: `git log origin/main..main` is the real ahead-count and
push is opt-in (`/preset ship`).

## Recent context

- **This leg (2026-07-29, relay ticket-loop leg 2):** built live-tail core,
  merged `dc87844`, closed #57 and then spec #55. New surfaces:
  `src/main/session-watcher.ts` (one watcher, injected `WatchIo` seam,
  `resetSessionWatcher()`), the `session:watch` / `session:changed` channel pair,
  and the renderer's eligibility + single-flight reload in `useChat`.
  A review pass caught three real defects before merge, each now pinned by a
  test that dies without its fix (see Landmines).
- Earlier on 2026-07-29 (leg 1): #56, the gui-55 driver, seen red against the
  featureless build.
- 2026-07-28 landed #52/#53/#54 + the host-CLI switch (`d814c03`).
- The store had grown to **499 sessions** at last count.

## Open questions

None blocking.

## Landmines (carried forward)

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
  ORDER — not a symptom with more than one cause. Corollary, re-confirmed twice
  this leg: **if a mutation kills nothing, the code you mutated may not be what
  makes the test pass.** #57's busy gate is the worked example — its test passes
  via the eligibility clear, not via the busy check.
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
  load-bearing, not tidiness.
- **Never write a literal ESC byte or a `\u` escape into source.** `CSI` uses
  `String.fromCharCode(27)`; the raw character is invisible in an editor and the
  escape was repeatedly normalized into the raw byte in transit.
- **A session fixture with no `cwd` is a foreign row.** A UI test wanting an
  in-project row must set `cwd: FOLDER` (exported from `tests/chat-harness.ts`).
- **New `window.api` channel → ALL FOUR mock sites** (`tests/chat-harness.ts` plus
  inline mocks in `sidebar` / `session` / `shell` tests), and guard every IPC with
  `isTrustedIpc`. #57's `onSessionChanged` is subscribed on mount, which is why a
  missing mock member kills a suite at render rather than in its own tests.
- **A module-level cache needs a test reset.** `resetSessionIndex()`,
  `resetEnrichedTitles()` and now `resetSessionWatcher()` all exist for that
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

Live-tail's **incremental byte tailing** (the documented upgrade path if
wholesale reload ever visibly flickers) and the **watch-installed-after-the-read
gap** (a `ponytail:` comment at the call site names the fix). Plus, unchanged:
context-pressure meter (`Query.getContextUsage()` exists but a naïve percentage
lies — it must separate the raw window from the auto-compaction threshold),
typed failed-turn recovery (`rewindFiles()` needs `enableFileCheckpointing`,
which our options do not set), full-text transcript search, session
delete/archive lifecycle, drag-and-drop, replay thumbnails, N-concurrent
engines, fork-on-resume, busy-switch detach (decided against — block is the
behaviour), folding `Welcome`'s last `pickFolder` caller onto the chooser, agent
archive / control / map pan-zoom, and the smaller leftovers from #31–#36.

## Related

- [[overview]] · [[decisions]] · [[pick-up]] · [[stack]] · [[happy-path]]
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
  [[2026-07-23-busy-switch-block-not-detach]]
