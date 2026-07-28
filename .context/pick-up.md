---
type: pick-up
project: claude-wrapper
updated: 2026-07-28
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## This leg landed

**#43 — Replace the session metadata scan with SDK `listSessions`**, on main as
`ea7baaf`, closed. `session-store.ts` now maps one SDK call
(`listSessions({ dir: cwd, includeProgrammatic: false })`) onto `SessionMeta`;
the per-file JSONL parser is deleted and **`messageCount` is removed from the
product** (21 references → 0). Suite **455 → 457 across 38 files**, typecheck and
build clean.

Verified live rather than only against mocks: 64 sessions for this project in
**199ms**, no undefined fields, **0 raw-markup titles** — so the sidebar's
`<local-command-caveat>` title defect is fixed as a side effect. Decision on
record: [[2026-07-28-session-metadata-is-the-sdks-job]].

## Next ticket: #44 — Resolve session storage dirs by index, not by encoding cwd

Unblocked and the only one; #45–#49 open behind it.

| # | Job | blocked_by (live) |
|---|---|---|
| #44 | Resolve storage dirs by index, not by encoding cwd | 0 — **next** |
| #45 | Global cross-project session list + filter | 1 |
| #46 | Main-process `switchWorkspace` transaction (dormant) | 1 |
| #47 | Wire the renderer to `switchWorkspace` | 2 |
| #48 | Folder picker reachable after first pick | 1 |
| #49 | Lazy title enrichment for slash-command-first sessions | 1 |

Order: `#44 → #45 → #46 → #47 → #48 → #49`. Blocked-ness is authoritative from
`gh api repos/<owner>/<repo>/issues/<n> --jq '.issue_dependencies_summary.blocked_by'`
— `gh issue list --json` does **not** expose that field.

**#44 context from this leg:** `encodeCwd` is still live and still wrong — it
survives in `session-store.ts` (used by `readTranscript`) and in
`subagent-store.ts`. #43 deliberately left it alone; #44 owns it. Note that the
*list* path no longer uses it at all, so #44's blast radius is now transcript
replay + subagent lookup, not the sidebar.

## Run it

```
/relay N=1 read and follow .claude/relay-leg.md
```

`.claude/relay-leg.md` is current for this queue. The Grok-grunt delegation
layer was removed 2026-07-28; restore procedure is at the bottom of that file.

## Landmines — carried, still live

- **Pins are mutation-verified. Never "fix" a red pin by editing its
  expectation.** #42 spent the queue's only authorized retirement. #43's removal
  of the `4 msg` sidebar assertion was mandated by its own contract, not a
  retirement — it does not set a precedent.
- **Never re-add `customTitle ?? summary`** to the session title. Real data can
  never catch it (0 of 325 custom titles diverge); the synthetic divergent
  fixture in `tests/session-store.test.ts` is the only guard.
- **`messageCount` is gone on purpose.** Not via `fileSize`, not via a lazy
  re-read. Restoring it restores the per-file parse #43 deleted.
- **A green test can be green for the wrong reason.** #42's whitespace test
  asserted only "no popover" — which the *reverted* code also produces. Assert
  the mechanism (a fetch count, a read that must not happen), not a symptom with
  more than one cause. #43's no-JSONL-read test is the worked example; both of
  its required assertions were mutation-verified by breaking the code and
  confirming exactly one test went red.
- **Required test coverage in the remaining tickets is not optional** — the
  ordered-call assertion (#46) and the call-count assertion (#49).
- **Vitest + `node:fs/promises`:** a module mock must also export `default`, or
  the suite file dies at import with `No "default" export is defined`.
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

`npm run typecheck` clean, `npm run build` clean, **457 tests green across 38
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

**No GUI drive was run this leg.** #43's only new integration is a main-process
SDK call, and it was verified directly against the real store (counts, field
shape, title markup) rather than through a driver screenshot. A ticket that
changes rendering still needs the drivers above.
