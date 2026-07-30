---
type: pick-up
project: claude-wrapper
updated: 2026-07-30
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## The queue is full again — five tickets, #59–#63

Spec **#58** (non-lossy tool inspector) is published and sliced. Work the
**frontier**: any `ready-for-agent` ticket with zero open blockers.

**Frontier right now: #59 and #60.** Both independent, either can go first.

| # | Ticket | Blocked by |
|---|---|---|
| **#59** | Reconcile replay text-block joining with the live path | — |
| **#60** | Distinguish the session store's three silent failures from emptiness | — |
| #61 | Full output disclosure on tool cards | #59 |
| #62 | Structured input inspector on tool cards | #61 |
| #63 | Edit hunk diff — guarded local LCS, no dependency | #62 |

Edges are **native GitHub dependencies**, so `gh issue view <n>` shows them and
`issue_dependencies_summary.blocked_by` is the live gate. Do not start a ticket
with an open blocker.

## What this session did

Nothing in `src/`. It ran the idea→spec→tickets funnel: two independent
brainstorms converged on the tool inspector, the corpus was **measured** before
committing, an adversarial design pass reversed itself twice, and the result is
#58 plus #59–#63. Three decisions were recorded — read them before touching
tool cards, they will save you a wrong turn:

- [[2026-07-30-disclosure-is-retention-plus-conditional-mount]]
- [[2026-07-30-a-diff-without-a-baseline-is-worse-than-none]]
- [[2026-07-30-inspection-is-universal-approval-safety-is-opt-in]]

## The three traps specific to this queue

1. **#61 must keep the existing collapsed tool-card test green, untouched.** It
   feeds a two-line result and asserts line two is absent. Achieve that by
   **conditionally mounting** detail content — a CSS-hidden body or a closed
   `<details>` still puts the text in `textContent` and turns it red *correctly*.
   That test is a mechanism check, **not** a pin to retire. Red = your
   implementation is wrong.
2. **#63 must never render a Write diff.** Write supplies only path + content,
   no before-state. Green added lines conceal what was overwritten. Labelled
   content preview only, and no `diff` dependency — a local guarded line diff at
   ~45 lines, guard `oldLines * newLines <= 1_000_000`.
3. **#59 gates #61's parity acceptance.** #61 *can* be built against a
   single-string fixture, but that only proves the convenient shape. The replay
   parser's existing test supplies **one** text block, which is exactly how the
   separator divergence survived — the new regression needs **two**.

No new `window.api` member is needed anywhere in #59–#63, so the four-mock-sites
rule does not fire for this queue.

## Landmines — carried, still live

Full ledger in [[active-work]]. Most likely to bite here:

- Pins are mutation-verified; never "fix" a red pin by editing its expectation.
  The legitimate-retirement allowance is **spent**.
- A green test can be green for the wrong reason — assert the mechanism (a call
  count, a read that must not happen, an ORDER), not a symptom. If a mutation
  kills nothing, you may not have mutated what makes the test pass.
- Expanded regions inherit the **global** scrollbar rule. Never scope a
  scrollbar to a component; never add `scrollbar-width` / `scrollbar-color`.
- Never hardcode a model name; the app runs the HOST `claude` when PATH has one.
- `gh issue close --comment` drops the comment on an already-closed issue, and
  `gh issue list` lags a close by seconds — comment → close → re-query.
- **`gh` infers the repo from cwd.** `cd`-ing out of the clone makes
  `gh issue create` fail with `no git remotes found`. Stay in the repo, pass
  absolute `--body-file` paths, or use `-R <owner>/<repo>`.
- The Bash tool is not PowerShell, and source files are CRLF.
- Fable-5 refuses turns in sensitive-looking cwds (`Downloads/*`) — keep driver
  temp cwds away from there.

## Baseline

`main` = `31d70f0` + this leg's `.context` commit. It was **in sync** with
`origin/main` before that commit (push is opt-in, `/preset ship`). No code
changed, so #57's gate still stands: `npm run typecheck` clean, `npm run build`
clean, **637 tests green across 50 files**. Trust `git log origin/main..main`
over any note.

## GUI check

`node .claude/skills/run-desktop/driver.mjs [--cycle]` for the titlebar pills.
`gui-55.mjs` is a live-tail **regression harness** now — it passes, so a change
that breaks tailing turns it red. Other templates: `gui-52.mjs`, `gui-54.mjs`
(red-first discipline), `gui-49.mjs`, `gui-48.mjs`. All need `npm run build` +
`npm i --no-save playwright-core`.

Carried driver gotchas: stub `dialog.showOpenDialog` before any click that opens
one; `createRequire` for playwright-core outside the project; **pass paths as
arguments to `app.evaluate`, never inside string literals**; DOM-dispatched
clicks; measure in the DOM, never off screenshots; never re-read an element
after an action that may not have happened; clean up temp cwd and any seeded
store dir after `app.close()`; **log what the driver could not drive** — silence
reads as a pass.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[stack]] · [[happy-path]]
- [[2026-07-30-disclosure-is-retention-plus-conditional-mount]] ·
  [[2026-07-30-a-diff-without-a-baseline-is-worse-than-none]] ·
  [[2026-07-30-inspection-is-universal-approval-safety-is-opt-in]] ·
  [[2026-07-23-transcript-parser-pure-renderer-summarises]] ·
  [[2026-07-29-live-tail-is-a-signal-not-a-stream]]
