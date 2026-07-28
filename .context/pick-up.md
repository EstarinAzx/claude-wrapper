---
type: pick-up
project: claude-wrapper
updated: 2026-07-28
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## This leg landed

**#50 — Sanitize CLI markup in transcript replay**, on main as `c92cb48`, closed.
Replay rendered the CLI's own markup as literal XML in the user bubble;
`unwrapCommandInvocation` is now `sanitizeUserText` in `src/main/transcript.ts` —
one classifier over eight tags returning the display text or `null` to drop.

| Leading tag | Replay shows |
|---|---|
| `<command-message>` / `<command-name>` | `/name args` — both persisted orders |
| `<bash-input>` | `! command` |
| `<local-command-stdout>` | body, ANSI stripped |
| `<bash-stdout>` | stdout + stderr, empty half omitted |
| `<local-command-caveat>` · `<task-notification>` · `<system-reminder>` | dropped |

Three things are load-bearing and easy to undo by accident:

- **Dispatch is on the LEADING tag of the trimmed message, never mid-string.**
  That anchor is the safety argument, not a shortcut: every markup kind occupies
  a whole message in real data (nothing follows a `<command-name>` block in
  **442 of 442**; a caveat is alone in **419 of 419**), while pasted terminal
  logs and quoted diagnoses that merely *mention* the markup are genuine user
  content — 7 such messages exist in the store today. `startsWith` → `includes`
  is killed by exactly one test, the pasted-log pin.
- **ANSI is stripped from OUTPUT STREAMS ONLY.** A real recorded argument is
  `fable[1m]`, whose brackets are literal text, not an escape. Typed text —
  command args, `<bash-input>` — keeps its bytes.
- **`CSI` is built with `String.fromCharCode(27)`.** Neither a raw ESC byte nor a
  `\u` escape survives tooling intact; the raw character is invisible in an
  editor and the escape kept being normalized *into* the raw byte while this was
  written. Both `transcript.ts` and `transcript.test.ts` contain **zero** raw ESC
  bytes — one grep checks it.

Scope was **eight tags, not the three the old note named**: `<command-name>`-first
(442) is *more* common than the one shape the parser already handled (312), and
`<task-notification>` (100) / `<system-reminder>` (28) / `<bash-*>` (12) are the
same defect in the same table. Before: **1258 of 3359 messages, 37%**, raw.
Decision on record:
[[2026-07-28-sanitizing-replay-markup-is-an-anchor-not-a-strip]].

Suite **560 → 575 across 45 files**, typecheck and build clean. Nine mutations
run, each killing exactly its target. Real-store sweep through the **real
parser** (924 files): of **2972** user messages reaching replay, **7** still
contain the markup — all prose quoting it, **0** leading with a tag, **0**
carrying ANSI (was 186).

## Queue empty

No `ready-for-agent` ticket is open. The only open tracker item is the unlabelled
umbrella spec **#1**, which is not an agent ticket. Nothing sits in
`ready-for-human`, nothing is blocked.

## Next, if you are starting fresh

Spec #41's close-out named exactly one candidate with a live sighting — the
replay sanitizer — and **#50 was it**. There is no queued leftover; the next
effort is a genuine choice.

Options are the *Deferred* list in [[active-work]]: context-pressure meter (note
the trap — `Query.getContextUsage()` exists but a naïve percentage lies, it must
separate the raw window from the auto-compaction threshold), typed failed-turn
recovery (`rewindFiles()` needs `enableFileCheckpointing`, which our options do
not set), full-text transcript search, session delete/archive lifecycle,
drag-and-drop, replay thumbnails, live-tail external sessions, N-concurrent
engines, fork-on-resume, folding `Welcome`'s last `pickFolder` caller onto the
chooser, and the smaller leftovers from #31–#36.

Route a new effort through `/preset init` (idea) or `/wayfinder` (needs a map),
then `to-spec` → `to-tickets`, and a relay body will pick it up unchanged.

## Landmines — carried, still live

The full ledger is in [[active-work]]. The ones most likely to bite next:

- **Pins are mutation-verified. Never "fix" a red pin by editing its
  expectation.** The only legitimate retirement is a ticket that reverses the
  contract by name, and that allowance is spent.
- **A green test can be green for the wrong reason.** Assert the mechanism — a
  read that must not happen, a call ORDER, an option that must be absent, a
  count — not a symptom with more than one cause.
- **Never match CLI markup mid-string, and never strip ANSI from typed text.**
  #50's anchor, above.
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
  and one containing `/` breaks the `s///` delimiter outright. **A mutation
  harness must assert its anchor matched exactly once**: #50's first run reported
  four survivors that were really `\n`-vs-CRLF anchor misses, and a bad anchor
  reads identically to an uncaught mutation.
- **Fable-5 refuses turns whose cwd looks sensitive** (`Downloads/*`). Not our
  bug; don't run wrapper sessions or GUI drivers there.

## Baseline

`npm run typecheck` clean, `npm run build` clean, **575 tests green across 45
files**, verified 2026-07-28 immediately before this handoff. `main` is one
commit ahead of `origin/main` — **#50 is not pushed**.

## GUI check

`node .claude/skills/run-desktop/driver.mjs [--cycle]` for the titlebar pills.
**`gui-49.mjs` is the newest template**: it instruments the **main process** by
wrapping the registered invoke handler, so it counts what the renderer actually
asked for rather than what the script hoped — the technique to reuse whenever a
ticket's real risk is "how many times did that happen". `gui-48.mjs` is the
dialog/call-counted-stub template, `gui-47.mjs` the workspace switch, `gui-45.mjs`
the sessions rail, `gui-42.mjs` the composer. All need `npm run build` +
`playwright-core`.

**#50 was verified without a GUI driver** — it is a pure function over a parsed
transcript, so the honest check was sweeping the real store through the real
parser (a throwaway `tests/real-store.test.ts`, deliberately not committed since
it depends on this machine's `~/.claude/projects`). Reach for that shape again
when the risk is "what does this do to real data" rather than "what does the UI
do".

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
- [[2026-07-28-sanitizing-replay-markup-is-an-anchor-not-a-strip]] ·
  [[2026-07-28-lazy-enrichment-is-a-mount-not-a-scan]] ·
  [[2026-07-28-choosing-a-folder-is-not-changing-workspace]] ·
  [[2026-07-28-a-workspace-reset-is-a-remount-not-a-state-sweep]] ·
  [[2026-07-28-the-workspace-switch-is-one-transaction-over-ports]] ·
  [[2026-07-28-the-session-list-is-global-scoping-is-a-render-concern]] ·
  [[2026-07-28-storage-location-is-an-index-not-an-encoding]] ·
  [[2026-07-28-session-metadata-is-the-sdks-job]]
