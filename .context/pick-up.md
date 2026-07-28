---
type: pick-up
project: claude-wrapper
updated: 2026-07-28
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## This leg landed

**#42 — Multiline prompt composition**, on main as `5b66dd9`, closed. The
composer is a `<textarea rows={1}>`: Enter sends, Shift+Enter breaks the line at
the caret, growth is CSS-only to an 8-line ceiling. Suite **441 → 455 across
37 → 38 files**, typecheck and build clean, GUI-verified in the built app.

Two things worth carrying, both now landmines below: the height model is a
recorded decision ([[2026-07-28-composer-height-is-css-not-state]]), and one of
this leg's own tests initially **passed under mutation** — see the note.

## Next ticket: #43 — Replace the session metadata scan with SDK `listSessions`

Unblocked and the only one; the rest of spec **#41 — Resume anything** opens
behind it.

| # | Job | blocked_by (live) |
|---|---|---|
| #43 | Replace metadata scan with SDK `listSessions` | 0 — **next** |
| #44 | Resolve storage dirs by index, not by encoding cwd | 1 |
| #45 | Global cross-project session list + filter | 1 |
| #46 | Main-process `switchWorkspace` transaction (dormant) | 1 |
| #47 | Wire the renderer to `switchWorkspace` | 2 |
| #48 | Folder picker reachable after first pick | 1 |
| #49 | Lazy title enrichment for slash-command-first sessions | 1 |

Order: `#43 → #44 → #45 → #46 → #47 → #48 → #49`. Blocked-ness is authoritative
from
`gh api repos/<owner>/<repo>/issues/<n> --jq '.issue_dependencies_summary.blocked_by'`
— `gh issue list --json` does **not** expose that field.

## Run it

```
/relay N=1 read and follow .claude/relay-leg.md
```

`.claude/relay-leg.md` is current for this queue. The Grok-grunt delegation
layer was removed 2026-07-28; restore procedure is at the bottom of that file.

## Landmines — carried, still live

- **Pins are mutation-verified. Never "fix" a red pin by editing its
  expectation.** #42 spent the queue's only authorized retirement. Any red pin
  from here means the change is wrong.
- **A green test can be green for the wrong reason.** #42's whitespace-trigger
  test asserted only "no popover" — and the *reverted* implementation also
  renders no popover, because the typed text matches no command name either way.
  It survived mutation. Fixed by asserting the `listCommands` **fetch count**.
  When a ticket names required coverage, check the assertion fails for the
  reason you think it does; assert the mechanism, not a symptom with more than
  one cause.
- **Required test coverage in the remaining tickets is not optional** — the
  no-JSONL-read assertion (#43), the ordered-call assertion (#46) and the
  call-count assertion (#49) exist precisely because a green suite passes while
  the requirement is unmet.
- **Never add a resize effect to `InputBar`** — height is CSS
  (`field-sizing: content`), deliberately not React state.
- **`gh issue close --comment` silently drops the comment if the issue is
  already closed** — a pushed `Closes #N` auto-closes it first, so the
  breadcrumb vanishes with only a `!` warning. Use `gh issue comment` and verify.
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

`npm run typecheck` clean, `npm run build` clean, **455 tests green across 38
files**, verified 2026-07-28 immediately before this handoff.

## GUI check

`node .claude/skills/run-desktop/driver.mjs [--cycle]` for the titlebar pills;
`node .claude/skills/run-desktop/gui-42.mjs` for the composer (now **committed**
— use it as the template rather than writing a new variant). Needs
`npm run build` + `playwright-core`. Gotchas: `createRequire` for
playwright-core; **pass the dialog-stub path as an argument to `app.evaluate`,
never inside a string literal** (a single backslash silently yields a
nonexistent cwd, which the SDK misreports as "native binary exists but failed to
launch"); DOM-dispatched clicks (Playwright's stability wait hangs on the app's
animations); hard `setTimeout(process.exit)`; measure in the DOM, never off
screenshots; and never re-read an element after an action that may not have
happened — inject a probe node instead.
