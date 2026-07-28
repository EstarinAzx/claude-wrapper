---
type: pick-up
project: claude-wrapper
updated: 2026-07-28
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

**Queue is loaded — 8 tickets, none started.** Spec #36 (slash commands) closed
2026-07-27; this queue is new work specced 2026-07-28 and adversarially reviewed
before publication. Nothing is implemented yet.

**Next ticket: #42 — Multiline prompt composition.** Standalone, no blockers,
highest value. After it, the spec #41 chain in order.

## The queue

**#42 — Multiline prompt composition** (independent, no edges). The composer is
a literal `<input type="text">`; there is no newline path at all.

**Spec #41 — Resume anything.** Session history becomes the entry point to cwd,
built on the SDK's global `listSessions`. Chain:

| # | Job | Blocked by |
|---|---|---|
| #43 | Replace metadata scan with SDK `listSessions` | — |
| #44 | Resolve storage dirs by index, not by encoding cwd | #43 |
| #45 | Global cross-project session list + filter | #44 |
| #46 | Main-process `switchWorkspace` transaction (dormant) | #44 |
| #47 | Wire the renderer to `switchWorkspace` | #45, #46 |
| #48 | Folder picker reachable after first pick | #47 |
| #49 | Lazy title enrichment for slash-command-first sessions | #45 |

Order: `#42 → #43 → #44 → #45 → #46 → #47 → #48 → #49`. Only #42 and #43 are
unblocked right now. Blocked-ness is authoritative from
`gh api repos/<owner>/<repo>/issues/<n> --jq '.issue_dependencies_summary.blocked_by'`
— `gh issue list --json` does **not** expose that field.

## Run it

```
/relay N=1 read and follow .claude/relay-leg.md
```

`.claude/relay-leg.md` was rewritten 2026-07-28 for this queue. **The
Grok-grunt delegation layer was removed** — restore procedure documented at the
bottom of that file if it is ever wanted back.

## Landmines — carried, still live

- **Pins are mutation-verified. Never "fix" a red pin by editing its
  expectation.** The ONLY authorized retirement in this queue is named in #42:
  `tests/attachments-composer.test.tsx`, `'the composer is still a single-line
  input'`. Any other red pin means the change is wrong.
- **Required test coverage in these tickets is not optional.** Several
  assertions exist precisely because a green suite passes while the requirement
  is unmet — the no-JSONL-read assertion (#43), the ordered-call assertion
  (#46), the call-count assertion (#49). Skipping them is a failed ticket even
  with green CI.
- Full ledger in [[active-work]]. Headlines unchanged: plain-string engine pin
  and array-of-only-text parser pin are mutation-verified; replay never carries
  the payload; absent stays absent; `taskToParent` is the `local_bash` filter;
  wisp `options.model` = family NAME; never bare `wisp snapshot`; new
  `window.api` channel → ALL FOUR mock sites; jsdom: no images, no CSP, no hit
  testing.
- **Fable-5 refuses turns whose cwd looks sensitive** (`Downloads/*`). Path is
  the trigger, model only modulates the odds. Not our bug — don't run wrapper
  sessions there.
- **`main` is ahead of origin** — push is deliberate opt-in (`/preset ship`).

## Baseline at spec time

`npm run typecheck` clean, **441 tests green across 37 files**, verified
2026-07-28 immediately before the tickets were written.

## GUI check

`node .claude/skills/run-desktop/driver.mjs [--cycle]` (needs `npm run build` +
`playwright-core`). Gotchas: `createRequire` for playwright-core; forward
slashes except the dialog-stub path, which needs escaped backslashes (a single
backslash there silently produces a nonexistent cwd, and the SDK misreports that
as "native binary exists but failed to launch"); DOM-dispatched clicks
(Playwright's stability wait hangs on the app's animations); hard
`setTimeout(process.exit)`; measure in the DOM, never off screenshots.
