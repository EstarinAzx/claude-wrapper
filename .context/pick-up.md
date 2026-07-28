---
type: pick-up
project: claude-wrapper
updated: 2026-07-28
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## This leg landed

**#44 — Resolve session storage directories by index, not by encoding cwd**, on
main as `d44c2a2`, closed. New `src/main/session-index.ts` maps session id →
physical project directory by enumerating `~/.claude/projects` with directory and
file **names only**; `readTranscript`, `listSubagents` and
`readSubagentTranscript` resolve through it, and **`encodeCwd` is deleted**.
Lookups return `{status:'ok',dir} | {status:'not-found'}`, rebuild once and retry
once on a miss, and `resolveResumeTarget` adds the typed `{status:'missing-cwd'}`
rejection. Suite **457 → 474 across 39 files**, typecheck and build clean.

Verified live against the real store, not only mocks: 61 store directories, index
built in **12ms**, **494 of 494** sessions resolved with 0 misses, `encodeCwd`
would have missed **45**, 6 sessions carry no cwd, 0 duplicate ids. Five
mutations run, each killing exactly its target test. Decision on record:
[[2026-07-28-storage-location-is-an-index-not-an-encoding]].

## Next ticket: #45 — Global cross-project session list + filter

Unblocked. #46 unblocked at the same time (both were waiting only on #44), but
the queue order is #45 first — #47 needs both anyway.

| # | Job | blocked_by (live) |
|---|---|---|
| #45 | Global cross-project session list + filter | 0 — **next** |
| #46 | Main-process `switchWorkspace` transaction (dormant) | 0 — also open |
| #47 | Wire the renderer to `switchWorkspace` | 2 |
| #48 | Folder picker reachable after first pick | 1 |
| #49 | Lazy title enrichment for slash-command-first sessions | 1 |

Order: `#45 → #46 → #47 → #48 → #49`. Blocked-ness is authoritative from
`gh api repos/<owner>/<repo>/issues/<n> --jq '.issue_dependencies_summary.blocked_by'`
— `gh issue list --json` does **not** expose that field.

**#45 context from this leg:** the pieces #45 needs are already built and tested.
`listSessions({ dir })` drops `dir` to go global (SDK top-level, 421ms for the
whole store per spec #41). Grouping is `cwdKey()` from `session-index.ts` —
resolved, separators folded, lower-cased — which exists precisely so two
spellings of the same directory group together. The **6 sessions with no `cwd`**
are the "Unknown project" group, and `resolveResumeTarget` already returns
`missing-cwd` for them, so #45 renders a state that is typed rather than
inferred. Two open calls #45 must make explicitly: `includeWorktrees` still
defaults to **`true`** (flagged by #43, still unexamined), and `SessionMeta`
carries no `cwd` field yet — adding one is #45's call, not a leftover.

## Run it

```
/relay N=1 read and follow .claude/relay-leg.md
```

`.claude/relay-leg.md` is current for this queue. The Grok-grunt delegation layer
was removed 2026-07-28; restore procedure is at the bottom of that file.

## Landmines — carried, still live

- **Pins are mutation-verified. Never "fix" a red pin by editing its
  expectation.** #42 spent the queue's only authorized retirement.
- **Never re-derive a store path from `cwd`** — no `encodeCwd`, no
  case-insensitive variant, no decoding a directory name back into a cwd. That
  compare-case-insensitively "fix" was #44's named sharpest failure mode: it
  patches the drive-letter cases and leaves every other lossy collision live.
  `cwdKey()` is for comparison and grouping only — never join it into a path.
- **Do not rebuild the storage index inside `listSessions`.** #43's
  no-JSONL-read pin asserts no directory scan happens on the list path;
  freshness is `resetSessionIndex()` at the `session:list` handler plus a lazy
  rebuild on the next lookup.
- **Never re-add `customTitle ?? summary`** to the session title. Real data can
  never catch it (0 of 325 custom titles diverge); the synthetic divergent
  fixture in `tests/session-store.test.ts` is the only guard.
- **`messageCount` is gone on purpose.** Not via `fileSize`, not via a lazy
  re-read. Restoring it restores the per-file parse #43 deleted.
- **A green test can be green for the wrong reason.** #42's whitespace test
  asserted only "no popover" — which the *reverted* code also produces. Assert
  the mechanism (a fetch count, a read that must not happen), not a symptom with
  more than one cause. #43's no-JSONL-read test and #44's names-only-build test
  are the worked examples; both were mutation-verified.
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
  breadcrumb vanishes with only a `!` warning. Use `gh issue comment` and verify.
  (Hit again this leg; the comment-then-verify path worked.)
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

`npm run typecheck` clean, `npm run build` clean, **474 tests green across 39
files**, verified 2026-07-28 immediately before this handoff.

## GUI check

`node .claude/skills/run-desktop/driver.mjs [--cycle]` for the titlebar pills;
`node .claude/skills/run-desktop/gui-42.mjs` for the composer (**committed** —
use it as the template rather than writing a new variant). Needs `npm run build`
+ `playwright-core`. Gotchas: `createRequire` for playwright-core; **pass the
dialog-stub path as an argument to `app.evaluate`, never inside a string
literal** (a single backslash silently yields a nonexistent cwd, which the SDK
misreports as "native binary exists but failed to launch"); DOM-dispatched
clicks (Playwright's stability wait hangs on the app's animations); hard
`setTimeout(process.exit)`; measure in the DOM, never off screenshots; and never
re-read an element after an action that may not have happened — inject a probe
node instead.

**No GUI drive was run this leg.** #44 is a main-process path-resolution change
with no rendering surface; it was verified directly against the real store (494
sessions resolved, 0 misses) rather than through a driver screenshot. **#45 is a
rendering ticket and needs one.**

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[stack]] · [[happy-path]]
- [[2026-07-28-storage-location-is-an-index-not-an-encoding]] ·
  [[2026-07-28-session-metadata-is-the-sdks-job]]
