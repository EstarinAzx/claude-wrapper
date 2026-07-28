---
type: pick-up
project: claude-wrapper
updated: 2026-07-28
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## This leg landed

**#46 — Main-process `switchWorkspace` transaction**, on main as `1bdadae`,
closed. It merged **dormant**: no IPC channel, no preload entry, no renderer
import — `grep -rn switchWorkspace src/ tests/` returns only the definition and
its unit tests.

The transaction is `src/main/switch-workspace.ts`, a pure function over an
injected `SwitchPorts`; `src/main/index.ts` exports the binding wired to the real
engine, permission broker and cwd. The split is load-bearing: the electron entry
cannot be imported under vitest, and the two things needing proof — the **order**
of the success path and the **emptiness** of every rejection — are invisible to a
test that only sees the returned status.

- Precedence `busy → missing-cwd → not-found`, every predicate before the first
  mutation, so a rejection leaves observable state byte-for-byte identical.
- `resumeId: null` returns `ok`, clears any prior target and **never consults the
  index** — the new-chat / empty-folder case #48 needs.
- `ok` sequence: `closeEngine → cancelPermissions → setCwd → rebuildEngine →
  setResume → warmUp`, resume written **after** the rebuild.
- Busy comes from the engine itself: **`Engine.isBusy()`** is new
  (`turnResolve !== null`, added to the shared `Engine` interface).

Suite **504 → 517 across 41 files**, typecheck and build clean. Eight mutations
run, each killing exactly its target test; inverting the precedence also fails
typecheck. No GUI drive — this ticket has no rendering surface. Decision on
record: [[2026-07-28-the-workspace-switch-is-one-transaction-over-ports]].

## Next ticket: #47 — Wire the renderer to `switchWorkspace`

Unblocked. #49 is unblocked too and is independent of the #47 → #48 line, but the
queue order is #47 first.

| # | Job | blocked_by (live) |
|---|---|---|
| #47 | Wire the renderer to `switchWorkspace` | 0 — **next** |
| #48 | Folder picker reachable after the first pick | 1 (waits on #47) |
| #49 | Lazy title enrichment for slash-command-first sessions | 0 — also open |

Order: `#47 → #48 → #49`. Blocked-ness is authoritative from
`gh api repos/<owner>/<repo>/issues/<n> --jq '.issue_dependencies_summary.blocked_by'`
— `gh issue list --json` does **not** expose that field.

**#47 context from this leg:** the main-process half is done and waiting. Call
the exported `switchWorkspace(req)`; it returns
`{ status: 'ok' | 'busy' | 'not-found' | 'missing-cwd' }`, the same four cases
#45 already renders distinctly. What #47 adds is the IPC channel + preload entry
and making #45's inert foreign rows selectable — that pairing is #47's whole job.
Do **not** re-derive "busy" in the renderer: the transaction already asks
`Engine.isBusy()`, and a second opinion in the UI is the drift the single source
was chosen to prevent. A new `window.api` channel means **all four** mock sites
(`tests/chat-harness.ts` plus the inline mocks in `sidebar` / `session` / `shell`
tests), and every IPC guarded with `isTrustedIpc`.

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
  #45's two cwd-scoped list tests). A pin that goes red because your change
  broke it still means your change is wrong.
- **#47 is the only ticket allowed to make cross-project rows live.** #46 is in
  and dormant, #45 renders those rows inert on purpose. Selecting one before the
  renderer reset exists produces project B's sidebar beside project A's
  conversation.
- **Do not add a second busy flag.** `Engine.isBusy()` is the source of truth
  (`turnResolve !== null`) and `switchWorkspace` already consults it.
- **Keep `switchWorkspace`'s validation ahead of its first mutation.** The
  "rejection mutates nothing" pins are what stop a half-applied transition, and
  moving a single teardown call above the checks turns 9 of 10 tests red.
- **A session fixture with no `cwd` is a foreign row and is inert.** Any new UI
  test that clicks a session row must set `cwd: FOLDER` (exported from
  `tests/chat-harness.ts`). This bit `resume`, `switching` and `agents-dock`.
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
- **A green test can be green for the wrong reason.** #42's whitespace test
  asserted only "no popover" — which the *reverted* code also produces. Assert
  the mechanism (a fetch count, a read that must not happen, an option that must
  be absent, a call ORDER), not a symptom with more than one cause. #43's
  no-JSONL-read, #44's names-only-build, #45's no-`dir` and #46's ordered-call
  tests are the worked examples; all four are mutation-verified.
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
- **The Bash tool is not PowerShell.** A PowerShell here-string (`@'…'@`) in a
  `git commit -m` there shatters into pathspec errors; use a heredoc
  (`git commit -F - <<'EOF'`). Cost one retry this leg.
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

`npm run typecheck` clean, `npm run build` clean, **517 tests green across 41
files**, verified 2026-07-28 immediately before this handoff.

## GUI check

`node .claude/skills/run-desktop/driver.mjs [--cycle]` for the titlebar pills;
`node .claude/skills/run-desktop/gui-45.mjs` for the sessions rail (**committed**
— it is the newest template; it picks this repo as the workspace so the current
group is real, and it arms its hard exit *before* awaiting `app.close()`, which
is why it prints `DONE` instead of `TIMEOUT` over a passing verdict).
`gui-42.mjs` is still the composer template. All need `npm run build` +
`playwright-core`. Gotchas: `createRequire` for playwright-core **if the driver
lives outside the project dir**; **pass the dialog-stub path as an argument to
`app.evaluate`, never inside a string literal** (a single backslash silently
yields a nonexistent cwd, which the SDK misreports as "native binary exists but
failed to launch"); DOM-dispatched clicks (Playwright's stability wait hangs on
the app's animations); measure in the DOM, never off screenshots; and never
re-read an element after an action that may not have happened — inject a probe
node instead.

**No GUI drive this leg** — #46 has no rendering surface, as the previous handoff
predicted. **#47 and #48 both need one**, and `gui-45.mjs` is the right template
to fork for #47: it already picks a workspace and enumerates the sessions rail,
which is exactly the surface a cross-project switch changes. When asserting a
switch, remember the prior leg's lesson — a partial project name legitimately
matches every project it is a substring of (six real directories here contain
`playground`); only a full path can assert "exactly one group".

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[stack]] · [[happy-path]]
- [[2026-07-28-the-workspace-switch-is-one-transaction-over-ports]] ·
  [[2026-07-28-the-session-list-is-global-scoping-is-a-render-concern]] ·
  [[2026-07-28-storage-location-is-an-index-not-an-encoding]] ·
  [[2026-07-28-session-metadata-is-the-sdks-job]]
