---
type: pick-up
project: claude-wrapper
updated: 2026-07-28
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## This leg landed

**#49 — Lazy title enrichment for slash-command-first sessions**, on main as
`f71efbf`, closed. A row whose recorded title is a bare slash command derives a
label from the first substantive prompt in its own transcript — display only,
the store is untouched and no `customTitle` is ever set.

Three things are load-bearing and easy to undo by accident:

- **The trigger is a row MOUNTING**, which is why `SessionRow` is now a
  component. Off-page rows and a collapsed rail cost nothing *without any
  explicit check* — laziness is structural. Folding the effect back up into
  `Sidebar` re-reads rows nobody is looking at, and every test still passes.
- **The cache holds promises, not values** (`src/renderer/src/enriched-titles.ts`,
  reset with `resetEnrichedTitles()`). Caching the resolved value still lets a row
  that remounts mid-read start a second one. A resolved `null` is a cached
  ANSWER — "no substantive prompt" and "load failed" are terminal, never retried.
- **`session:title-hint` is its own channel on purpose.** Reusing
  `session:transcript` leaves the mandated call count with two possible causes
  and ships a whole parsed transcript to derive one line.

"Substantive" is measured, not read literally: the literal definition relabels
**59 of 65** rows with raw XML, because a slash invocation persists in two shapes
and `parseTranscript`'s unwrapper only knows `<command-message>`-first. Skill-body
injection is excluded too — it was **12 of 15** derivable labels behind one
identical 40-character prefix. Decision on record:
[[2026-07-28-lazy-enrichment-is-a-mount-not-a-scan]].

Suite **545 → 560 across 45 files**, typecheck and build clean. Nine mutations
run, each killing exactly its target. Live GUI drive `gui-49.mjs` (committed)
counts the channel **in the main process**: 499 sessions in the store, 100 rows
rendered, 8 qualify → exactly 8 calls, 8 unique ids, **491 sessions untouched**,
the derived label visible in the DOM, `titleHint` present on the real preload
bridge.

## Queue empty — spec #41 closed

No `ready-for-agent` ticket is open. Spec **#41 "Resume anything"** is delivered
and closed: #43 `ea7baaf` · #44 `d44c2a2` · #45 `63f12d5` · #46 `1bdadae` ·
#47 `8c9cbb7` · #48 `08974d5` · #49 `f71efbf`.

**Leftovers:** none stuck. Nothing is sitting in `ready-for-human`, and nothing
is blocked. The only open tracker item is the unlabelled umbrella spec **#1**,
which is not an agent ticket.

The relay chain stops here rather than spawning a ninth leg.

## Next, if you are starting fresh

There is no queue to drain — the next session picks a direction. The sharpest
candidate with a live sighting:

- **Transcript replay still renders raw `<local-command-caveat>` /
  `<command-name>` / `<local-command-stdout>` markup with ANSI escapes.**
  Confirmed live during #47's drive. #43 fixed this on the *title* path and #49
  was titles only; replay is a different code path with no ticket. The shape is
  known: strip at the parsing boundary with a small local sanitizer.

Other scoped-but-unticketed work is listed under *Deferred* in [[active-work]].
Route a new effort through `/preset init` (idea) or `/wayfinder` (needs a map),
then `to-spec` → `to-tickets`, and the relay body will pick it up unchanged.

## Landmines — carried, still live

The full ledger is in [[active-work]]. The ones most likely to bite whoever
touches the sessions rail next:

- **Pins are mutation-verified. Never "fix" a red pin by editing its
  expectation.** The only legitimate retirement is a ticket that reverses the
  contract by name, and that allowance is spent.
- **A green test can be green for the wrong reason.** Assert the mechanism — a
  read that must not happen, a call ORDER, an option that must be absent, a
  count — not a symptom with more than one cause.
- **Never enrich a row that has not rendered, and never derive a label during
  filtering.** `groupSessions`' `labels` option matches what is already cached
  and derives nothing; a keystroke that scans the store is #43's deleted
  whole-store read arriving by another door.
- **Never call `pickFolder` outside `Welcome`**; the chooser is `chooseFolder`
  and the transition is `switchWorkspace`.
- **Never clear the pane with `newChat()` on a switch path** — use
  `adoptSession`, with `null` meaning "no session, no engine call".
- **Never un-key the composer** (`<InputBar key={cwd}>`), and clear
  `pendingInsert` in the same commit as the cwd change.
- **Never re-derive a store path from `cwd`**; `cwdKey()` is comparison only.
- **Do not rebuild the storage index inside `listSessions`**, do not restore
  `messageCount`, and never re-add `customTitle ?? summary`.
- **New `window.api` channel → ALL FOUR mock sites**, and guard every IPC with
  `isTrustedIpc`. **A module-level cache needs a test reset.**
- **`gh issue close --comment` drops the comment if the issue is already closed**
  — keep `Closes #N` out of the commit, then comment → close → verify.
- **The Bash tool is not PowerShell** (heredoc, not a here-string), and source
  files are **CRLF** — a `perl -0pi` pattern spanning a newline needs `\r?\n`,
  and one containing `/` breaks the `s///` delimiter outright. `diff` against a
  backup before believing a survivor.
- **Fable-5 refuses turns whose cwd looks sensitive** (`Downloads/*`). Not our
  bug; don't run wrapper sessions or GUI drivers there.

## Baseline

`npm run typecheck` clean, `npm run build` clean, **560 tests green across 45
files**, verified 2026-07-28 immediately before this handoff. `main` and
`origin/main` are in sync.

## GUI check

`node .claude/skills/run-desktop/driver.mjs [--cycle]` for the titlebar pills.
**`gui-49.mjs` is the newest template**: it instruments the **main process** by
wrapping the registered invoke handler, so it counts what the renderer actually
asked for rather than what the script hoped — the technique to reuse whenever a
ticket's real risk is "how many times did that happen". `gui-48.mjs` is the
dialog/call-counted-stub template, `gui-47.mjs` the workspace switch, `gui-45.mjs`
the sessions rail, `gui-42.mjs` the composer. All need `npm run build` +
`playwright-core`.

Gotchas: stub `dialog.showOpenDialog` in main **before** any click that opens one
or the run blocks forever; `createRequire` for playwright-core if the driver lives
outside the project dir; **pass any path as an argument to `app.evaluate`, never
inside a string literal**; DOM-dispatched clicks; measure in the DOM, never off
screenshots; never re-read an element after an action that may not have happened;
**count the side effect you actually care about**; clean up a temp cwd after
`app.close()` and never fatally; and **log what the driver could not drive**
rather than letting silence read as a pass.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[stack]] · [[happy-path]]
- [[2026-07-28-lazy-enrichment-is-a-mount-not-a-scan]] ·
  [[2026-07-28-choosing-a-folder-is-not-changing-workspace]] ·
  [[2026-07-28-a-workspace-reset-is-a-remount-not-a-state-sweep]] ·
  [[2026-07-28-the-workspace-switch-is-one-transaction-over-ports]] ·
  [[2026-07-28-the-session-list-is-global-scoping-is-a-render-concern]] ·
  [[2026-07-28-storage-location-is-an-index-not-an-encoding]] ·
  [[2026-07-28-session-metadata-is-the-sdks-job]]
