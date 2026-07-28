---
type: pick-up
project: claude-wrapper
updated: 2026-07-28
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## This leg landed

**#48 — Folder picker reachable after the first pick**, on main as `08974d5`,
closed. A new or empty project is reachable at last: the sessions-rail header
carries an **"Open project"** affordance beside "New chat", backed by
`session:choose-folder` — a chooser that **mutates nothing** and answers
`{status:'cancelled'} | {status:'selected', cwd}`. Only `selected` runs #46's
transaction, with `resumeId: null`.

Three things are load-bearing and easy to undo by accident:

- **`session:pick-folder` is still alive and still mutating.** It is `Welcome`'s
  first-pick path and nothing else's. It changes main's cwd and rebuilds the
  engine while touching **no** renderer state — the stale-pane bug the whole
  transaction exists to prevent, and the ticket's named sharpest failure mode.
  No UI assertion can catch a regression here (both paths end with a new cwd and
  a re-rendered sidebar), so the pin is on the call.
- **`adoptSession(null)`, never `newChat()`.** `newChat` sends
  `targetSession(null)`, which closes and nulls the engine the transaction just
  rebuilt and warmed, and it is gated on the renderer's own `busy` — a second
  opinion that would silently skip a reset main already answered `ok` to. An
  empty pane looks identical either way. Second instance of #47's landmine.
- **The affordance is not `busy`-gated** (the "New chat" button beside it is).
  `Engine.isBusy()` is the one source; disabling it would make the `busy`
  refusal unreachable from the UI.

Suite **533 → 545 across 43 files**, typecheck and build clean. Eight mutations
run, each killing exactly its target. Live GUI drive `gui-48.mjs` (committed)
opened the real dialog into a real empty `mkdtemp` folder and passed every
criterion. Decision on record:
[[2026-07-28-choosing-a-folder-is-not-changing-workspace]].

## Next ticket: #49 — Lazy title enrichment for slash-command-first sessions

Unblocked, and the **last ticket in spec #41**. Closing it closes the spec.

| # | Job | blocked_by (live) |
|---|---|---|
| #49 | Lazy title enrichment for slash-command-first sessions | 0 — **next** |

Blocked-ness is authoritative from
`gh api repos/<owner>/<repo>/issues/<n> --jq '.issue_dependencies_summary.blocked_by'`
— `gh issue list --json` does **not** expose that field.

**#49 context carried forward.**

- **Titles only.** #43 already killed the raw-markup *title* defect by moving
  titles to the SDK's `summary` (0 of 490 store-wide carry command markup). #49
  is about *enriching* the 65 bare short commands (`/clear`, `/model`,
  `/preset pick-up`) — the other 27 of 92 slash-first summaries are already
  informative prose.
- **Do NOT fold in transcript replay.** Replay still renders raw
  `<local-command-caveat>` / `<command-name>` / `<local-command-stdout>` with
  ANSI escapes — confirmed live during #47's drive. Different code path, no
  ticket, and it is the deferred "strip at the parsing boundary" item.
- **The required call-count assertion is the last outstanding piece of mandated
  coverage in this queue.** Lazy means lazy: the pin exists so a green suite
  cannot pass while the enrichment eagerly reads every transcript. #44's
  rebuild-once-retry-once `readdir` count is the worked example.
- **A summary beginning with `/` is provably not a user-set `/rename` title** —
  0 of 325 custom titles start with one.
- **Never re-add `customTitle ?? summary`** while working in this area.
- **Do not rebuild the storage index inside `listSessions`**, and do not restore
  `messageCount` as a side effect of reading transcripts for titles.
- Judge whether #49 needs a GUI drive on its own merits — it is mostly a
  data/title path, unlike #48 which added a real affordance and a real dialog.

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
  #45's two cwd-scoped list tests, #47's foreign-row pin — **rewritten into a
  routing pin**, not deleted). A pin that goes red because your change broke it
  still means your change is wrong. #42 spent the only authorized retirement.
- **Never call `pickFolder` outside `Welcome`.** The chooser is `chooseFolder`;
  the transition is `switchWorkspace`. Fusing the two back together is the
  regression, and it passes every test that looks at the screen.
- **Never clear the pane with `newChat()` on a switch path** — use
  `adoptSession`, with `null` meaning "no session, no engine call".
- **Never un-key the composer.** `<InputBar key={cwd}>` is the entire draft /
  tray / autocomplete reset; removing it re-opens the leak silently.
- **`pendingInsert` must be cleared in the same commit as the cwd change** —
  `InputBar` applies an insert *on mount*, so a survivor refills the new
  project's composer with the old project's command. This is a different bug
  from a stale draft and needs its own assertion.
- **Do not add a second busy flag,** and do not disable a foreign row or the
  "Open project" affordance while busy. `Engine.isBusy()` is the source of truth;
  `switchWorkspace` already consults it, and disabling makes its refusal
  unreachable.
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
  names-only-build, #45's no-`dir`, #46's ordered-call, #47's never-`targetSession`
  + pending-insert-on-remount and #48's never-`pickFolder` tests are the worked
  examples; all are mutation-verified.
- **New `window.api` channel → ALL FOUR mock sites** (`tests/chat-harness.ts` plus
  the inline mocks in `sidebar` / `session` / `shell` tests), and guard every IPC
  with `isTrustedIpc`. `chooseFolder` was the most recent one.
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
  commit, then `gh issue comment` → `gh issue close` → verify. Worked two legs
  running.
- **The Bash tool is not PowerShell** — use a heredoc (`git commit -F - <<'EOF'`),
  never a PowerShell here-string.
- **Source files are CRLF.** A `perl -0pi` mutation whose pattern spans a line
  break needs `\r?\n`, not `\n` — otherwise it silently does not apply and the
  mutation "survives", which reads exactly like a weak test. `diff -q` against a
  backup before trusting a survivor; the leg-7 mutation script does this and
  prints `MUTATION DID NOT APPLY` rather than a false survivor.
- Resume ceiling + `sessionId()` accessor + native-store facts + Tailwind
  `@theme` + engine legible-error pins — unchanged, see [[active-work]].
- Full ledger in [[active-work]]. Headlines unchanged: plain-string engine pin
  and array-of-only-text parser pin are mutation-verified; replay never carries
  the payload; absent stays absent; `taskToParent` is the `local_bash` filter;
  wisp `options.model` = family NAME; never bare `wisp snapshot`; jsdom: no
  images, no CSP, no hit testing.
- **Fable-5 refuses turns whose cwd looks sensitive** (`Downloads/*`). Path is
  the trigger, model only modulates the odds. Not our bug — don't run wrapper
  sessions there, and don't point a GUI driver's temp cwd there either.
- `main` and `origin/main` are **in sync** as of this leg (the relay body pushes
  every leg).

## Baseline

`npm run typecheck` clean, `npm run build` clean, **545 tests green across 43
files**, verified 2026-07-28 immediately before this handoff.

## GUI check

`node .claude/skills/run-desktop/driver.mjs [--cycle]` for the titlebar pills.
**`gui-48.mjs` is the newest template**: it stubs the folder dialog in main,
makes the stub *switchable and call-counted*, drives both a cancel and a
selection in one run, and asserts a channel exists on the **real preload
bridge** — the one thing a jsdom mock will answer regardless. `gui-47.mjs` is
the workspace-switch template, `gui-45.mjs` the sessions rail, `gui-42.mjs` the
composer. All need `npm run build` + `playwright-core`.

Gotchas: `createRequire` for playwright-core **if the driver lives outside the
project dir**; **pass any path as an argument to `app.evaluate`, never inside a
string literal** (a single backslash silently yields a nonexistent cwd, which
the SDK misreports as "native binary exists but failed to launch");
DOM-dispatched clicks (Playwright's stability wait hangs on the app's
animations); measure in the DOM, never off screenshots; never re-read an element
after an action that may not have happened — inject a probe node instead;
**count the side effect you actually care about** (an inert button and a cancel
produce identical DOM — only a call counter separates them); clean up a temp cwd
**after** `app.close()` and never fatally (the engine holds it, `rmSync` throws
`EBUSY` over an already-printed PASS); and **log what the driver could not
drive** rather than letting silence read as a pass.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[stack]] · [[happy-path]]
- [[2026-07-28-choosing-a-folder-is-not-changing-workspace]] ·
  [[2026-07-28-a-workspace-reset-is-a-remount-not-a-state-sweep]] ·
  [[2026-07-28-the-workspace-switch-is-one-transaction-over-ports]] ·
  [[2026-07-28-the-session-list-is-global-scoping-is-a-render-concern]] ·
  [[2026-07-28-storage-location-is-an-index-not-an-encoding]] ·
  [[2026-07-28-session-metadata-is-the-sdks-job]]
