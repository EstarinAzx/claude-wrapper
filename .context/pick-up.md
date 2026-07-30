---
type: pick-up
project: claude-wrapper
updated: 2026-07-30
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Last leg landed #60

**#60 — the session store's three silent failures — is closed, `4447326`, pushed.**
A throwing SDK listing, a store that will not enumerate and an unreadable
transcript file are now three typed values instead of three empty arrays:

- `listSessions()` → `SessionMeta[] | null`
- `readTranscript()` → `TranscriptMessage[] | null`
- `resolveSessionDir()` gained a third status, `unavailable`

The rail renders `Could not load sessions.` + Retry; the pane renders
`Could not read this conversation.` + Retry. Both empty states stay quiet and
offer no button. New suite `tests/store-failures.test.tsx`. **Eight mutations
verified, all killed.** Reasoning is in
[[2026-07-30-a-failure-is-a-value-absence-stays-lenient]].

Gate at that commit: typecheck clean, build clean, **657 tests green across 51
files**.

## Next: the frontier is #61, alone

Three tickets left, and they are a strict chain now — one frontier at a time.

| # | Ticket | Blocked by |
|---|---|---|
| **#61** | Full output disclosure on tool cards | — |
| #62 | Structured input inspector on tool cards | #61 |
| #63 | Edit hunk diff — guarded local LCS, no dependency | #62 |

Edges are **native GitHub dependencies**. `gh issue view <n>` shows them and
`gh api repos/EstarinAzx/claude-wrapper/issues/<n> --jq
'.issue_dependencies_summary.blocked_by'` is the live gate — `gh issue list
--json` does **not** expose that field. Do not start a ticket with an open
blocker.

Spec **#58** stays open until #63 lands, and the leg that lands it closes the
spec too.

## The traps specific to what is left

1. **#61 must keep the existing collapsed tool-card test green, untouched.** It
   feeds a two-line result and asserts line two is absent. Achieve that by
   **conditionally mounting** detail content — a CSS-hidden body or a closed
   `<details>` still puts the text in `textContent` and turns it red *correctly*.
   That test is a mechanism check, **not** a pin to retire. Red = your
   implementation is wrong.
2. **#61's parity acceptance is already real.** #59 removed the live/replay
   divergence, so a two-block result reads the same on both paths. Don't rebuild
   a parity fixture — `tests/engine.test.ts` has one (`#59 — the same two-block
   result collapses identically live and on replay`).
3. **#63 must never render a Write diff.** Write supplies only path + content, no
   before-state. Green added lines conceal what was overwritten. Labelled content
   preview only, and no `diff` dependency — a local guarded line diff at ~45
   lines, guard `oldLines * newLines <= 1_000_000`.
4. **A one-element fixture cannot distinguish a separator** — #59's whole cause.
   When a test is about how N things combine, N must be ≥ 2. Applies directly to
   the disclosure work: a single-line result fixture proves nothing about
   truncation.
5. **NEW — `[]` and `null` now differ on both store channels.** `listSessions`
   and `loadTranscript` answer `null` for a FAILED read. A new caller that writes
   `?? []` silently restores the bug #60 just removed. The one deliberate `?? []`
   is `titleHint`'s, and it is commented.

No new `window.api` member is needed anywhere in #61–#63, so the four-mock-sites
rule does not fire for this queue.

## Landmines — carried, still live

Full ledger in [[active-work]]. Most likely to bite here:

- Pins are mutation-verified; never "fix" a red pin by editing its expectation.
  The legitimate-retirement allowance is **spent**. (#60 changed three
  expectations, but none was a commented pin and every named contract survived —
  see [[active-work]]'s Recent context before citing it as precedent.)
- A green test can be green for the wrong reason — assert the mechanism (a call
  count, a read that must not happen, an ORDER), not a symptom. #60 added a live
  example: "the pane still shows the old content" cannot tell a *declined* failed
  read from a *thrown* one.
- Expanded regions inherit the **global** scrollbar rule. Never scope a
  scrollbar to a component; never add `scrollbar-width` / `scrollbar-color`.
- Never hardcode a model name; the app runs the HOST `claude` when PATH has one.
- `gh issue close --comment` drops the comment on an already-closed issue, and
  `gh issue list` lags a close by seconds — comment → close → re-query.
- **`gh` infers the repo from cwd.** `cd`-ing out of the clone makes
  `gh issue create` fail with `no git remotes found`. Stay in the repo, pass
  absolute `--body-file` paths, or use `-R <owner>/<repo>`.
- **The Bash tool is not PowerShell, and source files are CRLF.** A `sed`/`perl`
  mutation anchored on `$` or containing `\n` silently matches nothing — it
  reports success and changes NOTHING, which reads exactly like a passing
  mutation test. Bit #59's leg with `$`; bit #60's leg with `\n`. Normalise CRLF
  and **assert the anchor matched exactly once**.
- A long `gh issue comment --body` full of backticks and quotes dies in the
  shell. Write the body to a file and use `--body-file`.
- Fable-5 refuses turns in sensitive-looking cwds (`Downloads/*`) — keep driver
  temp cwds away from there.

## Baseline

`main` = `4447326` + this leg's `.context` commit, **pushed** to `origin/main`.
Trust `git log origin/main..main` over any note.

## GUI check

`node .claude/skills/run-desktop/driver.mjs [--cycle]` for the titlebar pills.
Run this leg after #60 (global CSS + App render tree changed) — booted clean,
pills read `Wisped` / `Bypass`. `gui-55.mjs` is a live-tail **regression
harness** now — it passes, so a change that breaks tailing turns it red. Other
templates: `gui-52.mjs`, `gui-54.mjs` (red-first discipline), `gui-49.mjs`,
`gui-48.mjs`. All need `npm run build` + `npm i --no-save playwright-core`
(playwright-core is currently present).

Carried driver gotchas: stub `dialog.showOpenDialog` before any click that opens
one; `createRequire` for playwright-core outside the project; **pass paths as
arguments to `app.evaluate`, never inside string literals**; DOM-dispatched
clicks; measure in the DOM, never off screenshots; never re-read an element
after an action that may not have happened; clean up temp cwd and any seeded
store dir after `app.close()`; **log what the driver could not drive** — silence
reads as a pass.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[stack]] · [[happy-path]]
- [[2026-07-30-a-failure-is-a-value-absence-stays-lenient]] ·
  [[2026-07-30-disclosure-is-retention-plus-conditional-mount]] ·
  [[2026-07-30-a-diff-without-a-baseline-is-worse-than-none]] ·
  [[2026-07-30-inspection-is-universal-approval-safety-is-opt-in]] ·
  [[2026-07-23-transcript-parser-pure-renderer-summarises]] ·
  [[2026-07-29-live-tail-is-a-signal-not-a-stream]]
