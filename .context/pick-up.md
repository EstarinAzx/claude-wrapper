---
type: pick-up
project: claude-wrapper
updated: 2026-07-28
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## This leg landed

**#45 — Global cross-project session list + filter**, on main as `63f12d5`,
closed. `listSessions()` takes no arguments and passes **no `dir`**, so the SDK
returns the whole store; `SessionMeta` gained `cwd?: string` (absent, not `''`).
Grouping, filtering and the cap are a pure shared module,
`src/shared/session-groups.ts`, in a fixed order: filter the complete loaded
metadata → sort and group → render the newest **100 matches globally**. Rows
outside the open workspace render but are `disabled`. `cwdKey`'s fold moved to
`src/shared/cwd-key.ts` so main and renderer group by one rule. Suite **474 →
504 across 40 files**, typecheck and build clean.

Verified live against the real store, not only mocks: 495 sessions, 61 store
directories, 9 groups in the first page, cap engaged at exactly **100**, 64 rows
enabled / 36 inert, clicking a foreign row leaves the pane untouched, full-path
filter → 1 group with 0 foreign rows, `Show more` → 200 rows. Five mutations
run, each killing exactly its target test. Decision on record:
[[2026-07-28-the-session-list-is-global-scoping-is-a-render-concern]].

## Next ticket: #46 — Main-process `switchWorkspace` transaction (dormant)

Unblocked. #49 unblocked at the same time (it waited only on #45), but the queue
order is #46 first and #47 needs it.

| # | Job | blocked_by (live) |
|---|---|---|
| #46 | Main-process `switchWorkspace` transaction (dormant) | 0 — **next** |
| #47 | Wire the renderer to `switchWorkspace` | 1 |
| #48 | Folder picker reachable after first pick | 1 |
| #49 | Lazy title enrichment for slash-command-first sessions | 0 — also open |

Order: `#46 → #47 → #48 → #49`. Blocked-ness is authoritative from
`gh api repos/<owner>/<repo>/issues/<n> --jq '.issue_dependencies_summary.blocked_by'`
— `gh issue list --json` does **not** expose that field.

**#46 context from this leg:** the front door is already built and typed.
`resolveResumeTarget(id, cwd)` returns `{status:'ok',dir} | {status:'not-found'}
| {status:'missing-cwd'}`, and #45 now renders all three cases distinctly, so
#46 has a caller that already distinguishes them. #46's required coverage is the
**ordered-call assertion** — the transaction's steps must be pinned in order,
because a green suite passes while the order is wrong. Note #46 merges
**dormant**: it lands unused and safe, and #47 wires it. Do not let #46 reach
the renderer, and do not make #45's foreign rows selectable as part of it — that
pairing is #47's whole job and doing it early is the bug the spec split to avoid.

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
- **Do not wire cross-project selection until #46 and #47 are both in.** #45
  renders those rows inert on purpose; selecting one early produces project B's
  sidebar beside project A's conversation.
- **A session fixture with no `cwd` is a foreign row and is inert.** Any new UI
  test that clicks a session row must set `cwd: FOLDER` (exported from
  `tests/chat-harness.ts`). This bit `resume`, `switching` and `agents-dock`.
- **Never re-derive a store path from `cwd`** — no `encodeCwd`, no
  case-insensitive variant, no decoding a directory name back into a cwd.
  `cwdKey()` (now folded in `src/shared/cwd-key.ts`) is for comparison and
  grouping only — never join it into a path.
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
  be absent), not a symptom with more than one cause. #43's no-JSONL-read,
  #44's names-only-build and #45's no-`dir` tests are the worked examples; all
  three are mutation-verified.
- **Required test coverage in the remaining tickets is not optional** — the
  ordered-call assertion (#46) and the call-count assertion (#49).
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

`npm run typecheck` clean, `npm run build` clean, **504 tests green across 40
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

**GUI drive was run this leg and passed** (see the measurements above). A driver
expectation of mine was wrong once and worth remembering: filtering by a partial
project name legitimately keeps every project it is a substring of — six real
directories on this machine contain `playground`. Only a full path can assert
"exactly one group".

**#46 is a main-process ticket with no rendering surface** and should not need a
GUI drive; #47 and #48 will.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[stack]] · [[happy-path]]
- [[2026-07-28-the-session-list-is-global-scoping-is-a-render-concern]] ·
  [[2026-07-28-storage-location-is-an-index-not-an-encoding]] ·
  [[2026-07-28-session-metadata-is-the-sdks-job]]
