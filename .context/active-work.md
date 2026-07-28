---
type: active-work
project: claude-wrapper
updated: 2026-07-28
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-07-28 by Opus 5 (relay leg 8, auto) — landed #49, closed spec #41, queue empty_
_At commit: `f71efbf`_
_Baseline: typecheck clean, build clean, **560 tests green across 45 files**_

## Current focus

**None — spec #41 "Resume anything" is delivered and the `ready-for-agent` queue
is empty.** Open the wrapper, find a recent session from any project in one
global rail, click it, land in that workspace with its transcript replayed: no
directory chosen first, no restart. An empty project, which session discovery can
never reach, is reachable through the rail's "Open project" affordance running
the same transaction with `resumeId: null`.

Seven tickets, one per relay leg, each gate-green: #43 `ea7baaf` · #44 `d44c2a2`
· #45 `63f12d5` · #46 `1bdadae` · #47 `8c9cbb7` · #48 `08974d5` · #49 `f71efbf`.
#42 (multiline composer, `5b66dd9`) landed standalone alongside them.

## State

- **In flight:** nothing.
- **Done this session (leg 8):** #49 — lazy title enrichment. New channel
  `session:title-hint`; `SessionRow` extracted so mounting is the trigger;
  promise cache in `src/renderer/src/enriched-titles.ts`; measured "substantive"
  rule in `src/shared/session-titles.ts`; `labels` option on `groupSessions`.
  Nine mutations run, each killed. `gui-49.mjs` committed.
- **Blocked:** nothing.

## Pick up here

**No active work — pick a new task.** The only open tracker item is the
unlabelled umbrella spec #1. Candidates already scoped below in *Deferred*; the
sharpest one with a live sighting is **transcript replay still rendering raw
`<local-command-caveat>` / `<command-name>` / `<local-command-stdout>` markup
with ANSI escapes** — no ticket yet, and deliberately kept out of #49.

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
- **Wisp `options.model` = the alias/family NAME**, never a resolved model id.
  Never run bare `wisp snapshot` — always name the family.
- **`gh issue close --comment` silently drops the comment if the issue is already
  closed** — a pushed `Closes #N` auto-closes it first. Keep `Closes #N` out of
  the commit, then `gh issue comment` → `gh issue close` → verify.
- **The Bash tool is not PowerShell** — heredoc (`git commit -F - <<'EOF'`), never
  a PowerShell here-string. **Source files are CRLF:** a `perl -0pi` mutation
  spanning a line break needs `\r?\n`, and a pattern containing `/` breaks the
  `s///` delimiter outright — `diff` against a backup before trusting a survivor.
- Native-store facts, the resume ceiling, `sessionId()` accessor, Tailwind
  `@theme` tokens and the engine's legible-error pins are unchanged — [[pick-up]].

## Known issues / not-our-bug

- **Transcript REPLAY renders raw `<local-command-caveat>` / `<command-name>` /
  `<local-command-stdout>` markup with ANSI escapes.** Seen live during #47's
  drive. #43 fixed this on the *title* path only and #49 is titles only; replay is
  the deferred "strip at the parsing boundary" item and still has no ticket.
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

Command-output replay (the sanitizer above), context-pressure meter
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
- [[2026-07-28-lazy-enrichment-is-a-mount-not-a-scan]] ·
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
