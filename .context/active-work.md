---
type: active-work
project: claude-wrapper
updated: 2026-07-29
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-07-29 by Fable 5 (relay ticket-loop leg 1) — #56 delivered and closed_
_At commit: `24b6e1d` (gui-55 driver on main; 2 commits ahead of origin before this `.context` commit)_
_Baseline: typecheck clean, build clean, **614 tests green across 48 files** (re-verified at the #56 merge gate — the driver adds no compiled code)_

## Current focus

**Live-tail external sessions — spec #55. #56 is done; #57 is the frontier.**

#56 landed `.claude/skills/run-desktop/gui-55.mjs` and was closed with its red
run as the breadcrumb: against the current build the pane stays static while
the session file grows, with **zero main-side IPC after the append** — the
defect is recorded, so gui-55 flipping green is #57's acceptance evidence.
Design decisions remain fixed in
[[2026-07-29-live-tail-is-a-signal-not-a-stream]] — watch the file, signal the
renderer, re-run the existing load path; tail only what you watch, never what
you drive.

## State

- **In flight:** nothing — #56's branch is squash-merged and deleted.
- **Queue (`ready-for-agent`):**
  - **#57** — live-tail core. Its only blocker (#56) is closed → **unblocked,
    the frontier.** Implementation decisions fixed in #55; acceptance criteria
    pin the three gates (signal-while-busy, signal-after-send,
    empty-result-kept) as tests.
- **Blocked:** nothing.

## Pick up here

**Work the frontier: #57.** `gh issue view 57 --comments`, plus the closing
comment on #56 for the driver's red-run evidence. Build per spec #55 — do not
re-decide. When it lands, `node .claude/skills/run-desktop/gui-55.mjs` must
flip to PASS unchanged; that run is the acceptance eyeball.

Before starting: read [[pick-up]] for operational landmines, and
`docs/agents/issue-tracker.md` + `docs/agents/triage-labels.md` for tracker
conventions.

## Recent context

- **This leg (2026-07-29, relay ticket-loop leg 1):** built gui-55, watched it
  fail for the right reason, merged `24b6e1d`, closed #56. The driver seeds a
  terminal-shaped session (`entrypoint: "cli"`, cwd = temp workspace) straight
  into the native store — verified listable via the SDK's
  `listSessions({includeProgrammatic: false})` — then adopts it via the sidebar
  row. No CLI turn, no tokens; fully deterministic.
- Earlier on 2026-07-29: spec #55 + tickets #56/#57 published (tracker-only
  session).
- 2026-07-28 landed #52/#53/#54 + the host-CLI switch (`d814c03`).
- The store had grown to **499 sessions** at last count.

## Open questions

None blocking. One deliberate deferral inside #55's scope: incremental byte
tailing is the upgrade path if wholesale reload visibly flickers — do not start
there, and do not re-litigate polling.

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
  mutation-verified. Corollary from #54's verification: **if a mutation kills
  nothing, the code you mutated may not be what makes the test pass.**
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
  `isTrustedIpc`. #57 adds two members (`watchSession`, `onSessionChanged`) —
  `onSessionChanged` is subscribed on mount, so every mock site needs it or the
  suite dies at render.
- **A module-level cache needs a test reset.** `resetSessionIndex()` and
  `resetEnrichedTitles()` both exist for that reason; #57's watcher module state
  is the next one that will need its own.
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
- **The app runs the HOST `claude` when PATH has one** (`cli-path.ts`, resolved
  once at boot, plain PATH walk, no shims, no `child_process`), falling back to
  the CLI bundled in the npm package. Consequences: a host Claude Code update
  can break the app with no code change here; the SDK package's `manifest.json`
  describes only the FALLBACK; reproducing a user's bug means matching their
  CLI version, not the lockfile's.
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
- **New driver trick (gui-55):** a terminal-shaped session can be seeded straight
  into the native store and the SDK lists it — no CLI turn needed to put a real
  adoptable row in the rail. Clean up the seeded store dir on every exit path.

## Deferred (still no spec)

Context-pressure meter
(`Query.getContextUsage()` exists but a naïve percentage lies — it must separate
the raw window from the auto-compaction threshold), typed failed-turn recovery
(`rewindFiles()` needs `enableFileCheckpointing`, which our options do not set),
full-text transcript search, session delete/archive lifecycle, drag-and-drop,
replay thumbnails, N-concurrent engines, fork-on-resume, busy-switch detach
(decided against — block is the behaviour), folding `Welcome`'s last
`pickFolder` caller onto the chooser, agent archive / control / map pan-zoom,
and the smaller leftovers from #31–#36.

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
