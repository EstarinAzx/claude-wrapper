---
type: pick-up
project: claude-wrapper
updated: 2026-07-28
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## This leg landed

**#47 — Wire the renderer to `switchWorkspace`**, on main as `8c9cbb7`, closed.
Cross-project session rows are **live**: selecting one sends
`{cwd, resumeId}` over the new `session:switch-workspace` channel and, only on
`ok`, the whole workspace drops together — cwd, `useChat`, `openDock`,
`pendingInsert`, `openSubagent`.

Three things are load-bearing and easy to undo by accident:

- **`<InputBar key={cwd}>`.** Draft, attachment tray and autocomplete state live
  only inside the composer, so a remount is the only exhaustive reset. Resetting
  App state alone leaves all three behind — the criterion most likely to pass a
  green suite while being unmet.
- **`useChat.adoptSession(id)`** replays a transcript **without** calling
  `targetSession`. The transaction already closed → rebuilt → targeted → warmed
  the engine, and `chat:target` closes and nulls it; the in-project resume path
  on top would tear the fresh engine straight back down. `openSession` is now
  `adoptSession` + `targetSession`.
- **A foreign row is deliberately not `busy`-gated** (a local row still is).
  `Engine.isBusy()` is the one source, and disabling the row would make the
  `busy` refusal unreachable from the UI.

Rejections render one inline `role="status"` line (`.switch-refusal`) above the
composer — never a chat message, because nothing happened. Backend mode,
permission mode and model are global preferences and survive untouched.

Suite **517 → 533 across 42 files**, typecheck and build clean. Ten mutations
run, each killing exactly its target. Live GUI drive `gui-47.mjs` (committed)
passed every criterion against the real store. Decision on record:
[[2026-07-28-a-workspace-reset-is-a-remount-not-a-state-sweep]].

## Next ticket: #48 — Folder picker reachable after the first pick

Unblocked. #49 is unblocked too and independent of #48; the queue order is #48
first.

| # | Job | blocked_by (live) |
|---|---|---|
| #48 | Folder picker reachable after the first pick | 0 — **next** |
| #49 | Lazy title enrichment for slash-command-first sessions | 0 — also open |

Order: `#48 → #49`. Blocked-ness is authoritative from
`gh api repos/<owner>/<repo>/issues/<n> --jq '.issue_dependencies_summary.blocked_by'`
— `gh issue list --json` does **not** expose that field.

**#48 context from this leg.** The reset #48 was sequenced behind now exists and
is reusable as-is: `switchWorkspace(id, cwd)` in `App.tsx` is the `ok`-branch
reset, and the composer remount rides the same `cwd` change. What #48 adds is
the **non-mutating chooser IPC** (`{status:'cancelled'} | {status:'selected',
cwd}`) plus a sidebar-header affordance next to "New chat".

- Call the transaction with **`resumeId: null`** — the first-class
  "open this workspace with a new chat" case. It clears the prior target, skips
  the index entirely and returns `ok`; an empty folder has no session to resume.
- The ticket's named sharpest failure mode is reaching for the existing
  `session:pick-folder`, which chooses **and** tears the engine down while
  touching no renderer state. That is the stale-pane bug the transaction exists
  to prevent. It needs a *chooser-only* sibling.
- `App.switchWorkspace` currently takes `(id, cwd)` with `id: string`. #48 needs
  the `resumeId: null` shape — widen that signature rather than duplicating the
  reset, or the two paths will drift.
- A new `window.api` channel means **all four** mock sites
  (`tests/chat-harness.ts` plus the inline mocks in `sidebar` / `session` /
  `shell` tests), and every IPC guarded with `isTrustedIpc`.
- `gui-47.mjs` is the right template to fork: it already stubs the folder dialog
  in main (path passed as an **argument**, never interpolated) and reads the
  whole reset back out of the DOM.

## Run it

```
/relay N=1 read and follow .claude/relay-leg.md
```

`.claude/relay-leg.md` is current for this queue. The Grok-grunt delegation layer
was removed 2026-07-28; restore procedure is at the bottom of that file.

## Landmines — carried, still live

- **Pins are mutation-verified. Never "fix" a red pin by editing its
  expectation.** The one legitimate retirement is when the *ticket* reverses the
  contract the pin describes and says so by name (#42's single-line composer,
  #45's two cwd-scoped list tests, and this leg's foreign-row pin — which was
  **rewritten into a routing pin**, not deleted). A pin that goes red because
  your change broke it still means your change is wrong.
- **Never un-key the composer.** `<InputBar key={cwd}>` is the entire draft /
  tray / autocomplete reset; removing it re-opens the leak silently.
- **`pendingInsert` must be cleared in the same commit as the cwd change** —
  `InputBar` applies an insert *on mount*, so a survivor refills the new
  project's composer with the old project's command. This is a different bug
  from a stale draft and needs its own assertion.
- **Never call `targetSession` on a switch path.** Use `adoptSession`. The
  transaction has already built and warmed the engine.
- **Do not add a second busy flag,** and do not "fix" the live foreign row by
  disabling it while busy. `Engine.isBusy()` is the source of truth;
  `switchWorkspace` already consults it.
- **Anything workspace-scoped added to App state must join the `ok` branch** of
  `switchWorkspace`. Composer-internal state needs nothing.
- **A session fixture with no `cwd` is a foreign row.** Since #47 it is
  selectable (and answered `missing-cwd`) rather than inert, but it is still not
  in the current group — a UI test that wants an in-project row must set
  `cwd: FOLDER` (exported from `tests/chat-harness.ts`).
- **Never re-derive a store path from `cwd`** — no `encodeCwd`, no
  case-insensitive variant, no decoding a directory name back into a cwd.
  `cwdKey()` (folded in `src/shared/cwd-key.ts`) is for comparison and grouping
  only — never join it into a path.
- **Do not rebuild the storage index inside `listSessions`.** #43's
  no-JSONL-read pin asserts no directory scan happens on the list path;
  freshness is `resetSessionIndex()` at the `session:list` handler plus a lazy
  rebuild on the next lookup.
- **`listSessions` must keep passing no `dir`.** A scoped call returns an
  identically-shaped list silently missing 36 of 37 projects, so the pin is on
  the call (`not.toHaveProperty('dir')`), not the result.
- **Never re-add `customTitle ?? summary`** to the session title. Real data can
  never catch it (0 of 325 custom titles diverge); the synthetic divergent
  fixture in `tests/session-store.test.ts` is the only guard.
- **`messageCount` is gone on purpose.** Not via `fileSize`, not via a lazy
  re-read. Restoring it restores the per-file parse #43 deleted.
- **A green test can be green for the wrong reason.** Assert the mechanism (a
  fetch count, a read that must not happen, an option that must be absent, a call
  ORDER), not a symptom with more than one cause. #43's no-JSONL-read, #44's
  names-only-build, #45's no-`dir`, #46's ordered-call and #47's
  never-`targetSession` + pending-insert-on-remount tests are the worked
  examples; all are mutation-verified.
- **Required test coverage in the remaining tickets is not optional** — the
  call-count assertion (#49) is the last one outstanding.
- **Vitest + `node:fs/promises`:** a module mock must also export `default`, or
  the suite file dies at import with `No "default" export is defined`. A mock
  now also needs `stat` — `session-index.ts`'s node io imports it.
- **A module-level cache needs a test reset.** `resetSessionIndex()` runs in
  `beforeEach` of every suite that reaches the index (`session-index`,
  `session-store`, `subagent-store`); without it one test's store bleeds into
  the next.
- **Never add a resize effect to `InputBar`** — height is CSS
  (`field-sizing: content`), deliberately not React state.
- **`gh issue close --comment` silently drops the comment if the issue is
  already closed** — a pushed `Closes #N` auto-closes it first, so the
  breadcrumb vanishes with only a `!` warning. Keep `Closes #N` OUT of the
  commit, then `gh issue comment` → `gh issue close` → verify. Worked this leg.
- **The Bash tool is not PowerShell** — use a heredoc (`git commit -F - <<'EOF'`),
  never a PowerShell here-string.
- **Source files are CRLF.** A `perl -0pi` mutation whose pattern spans a line
  break needs `\r?\n`, not `\n` — otherwise it silently does not apply and the
  mutation "survives", which reads exactly like a weak test. Cost one full
  mutation round this leg; `diff -q` against a backup before trusting a survivor.
- Resume ceiling + `sessionId()` accessor + native-store facts + Tailwind
  `@theme` + engine legible-error pins — unchanged, see [[active-work]].
- Full ledger in [[active-work]]. Headlines unchanged: plain-string engine pin
  and array-of-only-text parser pin are mutation-verified; replay never carries
  the payload; absent stays absent; `taskToParent` is the `local_bash` filter;
  wisp `options.model` = family NAME; never bare `wisp snapshot`; new
  `window.api` channel → ALL FOUR mock sites; jsdom: no images, no CSP, no hit
  testing.
- **Fable-5 refuses turns whose cwd looks sensitive** (`Downloads/*`). Path is
  the trigger, model only modulates the odds. Not our bug — don't run wrapper
  sessions there.
- `main` and `origin/main` are **in sync** as of this leg (the relay body pushes
  every leg).

## Baseline

`npm run typecheck` clean, `npm run build` clean, **533 tests green across 42
files**, verified 2026-07-28 immediately before this handoff.

## GUI check

`node .claude/skills/run-desktop/driver.mjs [--cycle]` for the titlebar pills;
**`node .claude/skills/run-desktop/gui-47.mjs`** is the newest template and the
right one to fork for #48 — it stubs the folder dialog in main, drives a full
workspace switch, and reads every reset back out of the DOM. `gui-45.mjs` is the
sessions-rail template; `gui-42.mjs` the composer one. All need `npm run build` +
`playwright-core`.

Gotchas: `createRequire` for playwright-core **if the driver lives outside the
project dir**; **pass the dialog-stub path as an argument to `app.evaluate`,
never inside a string literal** (a single backslash silently yields a nonexistent
cwd, which the SDK misreports as "native binary exists but failed to launch");
DOM-dispatched clicks (Playwright's stability wait hangs on the app's
animations); measure in the DOM, never off screenshots; never re-read an element
after an action that may not have happened — inject a probe node instead; and
**log what the driver could not drive** rather than letting silence read as a
pass (`gui-47.mjs` prints a `SKIPPED` line).

**#48 needs a GUI drive** — it adds a real affordance and a real dialog. #49 is
mostly a data/title path, so judge it on its own merits when you get there.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[stack]] · [[happy-path]]
- [[2026-07-28-a-workspace-reset-is-a-remount-not-a-state-sweep]] ·
  [[2026-07-28-the-workspace-switch-is-one-transaction-over-ports]] ·
  [[2026-07-28-the-session-list-is-global-scoping-is-a-render-concern]] ·
  [[2026-07-28-storage-location-is-an-index-not-an-encoding]] ·
  [[2026-07-28-session-metadata-is-the-sdks-job]]
