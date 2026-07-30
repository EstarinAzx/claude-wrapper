---
type: pick-up
project: claude-wrapper
updated: 2026-07-30
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Last leg landed #61

**#61 — full output disclosure on tool cards — is closed, `1868bbb`, pushed.**
Tool results are no longer summarised on the way into state:

- `toChatMessage` (replay) and the `tool-result` handler (live) both store
  `result` **complete**
- `ToolCard` derives the collapsed line with `resultSummary` at render
- expanded detail is a **conditionally mounted** `<pre className="tool-card-output">`
  — never CSS-hidden, never a closed `<details>`
- `hasHiddenOutput` gates the affordance, so a genuinely one-line result
  advertises nothing
- `resultSummary` stopped splitting the whole result; `firstLineBounds` scans
  forward and trims in place

23 new tests. **Both named mutations verified:** reverting retention killed 10
tests including both state-level targets (live *and* replay); changing the mount
to `hidden={!expanded}` reddened the original collapsed-card test. That test
passed **unchanged and untouched** — the diff on `tests/toolcards.test.tsx` is
additions only. No preload member added.

New GUI driver `.claude/skills/run-desktop/gui-61.mjs`, **verified red first**
against a featureless build.

Gate at that commit: typecheck clean, build clean, **680 tests green across 51
files**.

## Next: the frontier is #62, alone

| # | Ticket | Blocked by |
|---|---|---|
| **#62** | Structured input inspector on tool cards | — |
| #63 | Edit hunk diff — guarded local LCS, no dependency | #62 |

Edges are **native GitHub dependencies**. `gh issue view <n>` shows them and
`gh api repos/EstarinAzx/claude-wrapper/issues/<n> --jq
'.issue_dependencies_summary.blocked_by'` is the live gate — `gh issue list
--json` does **not** expose that field. Do not start a ticket with an open
blocker.

Spec **#58** stays open until #63 lands, and the leg that lands it closes the
spec too.

## The traps specific to what is left

1. **#62 shares #61's card, and the card owns ONE `expanded` boolean.** If input
   and output need independent disclosure that is a second piece of state, not a
   second card — #58's one-card-per-tool-invocation decision still holds.
2. **`tests/toolcards.test.tsx` now has a `TOGGLE` regex** —
   `/^(Show|Hide) (output|error)$/`, used by `queryToggle()`. A new input control
   must have a name **outside** that pattern, or the "advertises no expansion"
   guards go vacuous while still passing.
3. **Detail stays conditionally mounted.** Whatever #62 adds, it must not exist
   in the DOM while collapsed. The collapsed-card test is the tripwire and it is
   mutation-verified.
4. **#63 must never render a Write diff.** Write supplies only path + content, no
   before-state. Green added lines conceal what was overwritten. Labelled content
   preview only, and no `diff` dependency — a local guarded line diff at ~45
   lines, guard `oldLines * newLines <= 1_000_000`.
5. **A one-element fixture cannot distinguish a separator** — #59's whole cause.
   When a test is about how N things combine, N must be ≥ 2.
6. **`[]` and `null` differ on both store channels** (#60). `listSessions` and
   `loadTranscript` answer `null` for a FAILED read. A new caller that writes
   `?? []` silently restores the bug #60 removed. The one deliberate `?? []` is
   `titleHint`'s, and it is commented.

No new `window.api` member is needed for #62 or #63, so the four-mock-sites rule
does not fire for this queue.

## Landmines — carried, still live

Full ledger in [[active-work]]. Most likely to bite here:

- **Never re-summarise a tool result on the way into state.** Both write paths
  store it whole; `ToolCard` summarises at render. A regression there is
  invisible to every rendering test — assert at state level.
- **Never `git checkout <file>` to undo a mutation on uncommitted work.** It
  restores from HEAD and takes your unstaged edits with it. Commit the ticket
  work first, then mutate, and reverse the mutation with the same anchored
  replace that applied it. (Cost this leg a re-do.)
- Pins are mutation-verified; never "fix" a red pin by editing its expectation.
  The legitimate-retirement allowance is **spent**.
- A green test can be green for the wrong reason — assert the mechanism (a call
  count, a read that must not happen, an ORDER), not a symptom.
- Expanded regions inherit the **global** scrollbar rule. Never scope a
  scrollbar to a component; never add `scrollbar-width` / `scrollbar-color`.
- Never hardcode a model name; the app runs the HOST `claude` when PATH has one.
- `gh issue close --comment` drops the comment on an already-closed issue — but a
  **standalone `gh issue comment` lands fine** on one. A pushed `Closes #N`
  auto-closes, so comment separately. `gh issue list` lags a close by seconds.
- **`gh` infers the repo from cwd.** `cd`-ing out of the clone makes
  `gh issue create` fail with `no git remotes found`. Stay in the repo, pass
  absolute `--body-file` paths, or use `-R <owner>/<repo>`.
- **The Bash tool is not PowerShell, and source files are CRLF.** A mutation
  anchor written with `\n` matches **nothing** and reports success, which reads
  exactly like a passing mutation test. Bit #59's leg with `$`, #60's with `\n`,
  and this leg's first mutator attempt too. Re-line-end anchors to the file's own
  EOL and **assert the anchor matched exactly once**.
- A long `gh issue comment --body` full of backticks and quotes dies in the
  shell. Write the body to a file and use `--body-file`.
- Fable-5 refuses turns in sensitive-looking cwds (`Downloads/*`) — keep driver
  temp cwds away from there.

## Baseline

`main` = `1868bbb` + this leg's `.context` commit, **pushed** to `origin/main`.
Trust `git log origin/main..main` over any note.

## GUI check

`node .claude/skills/run-desktop/driver.mjs [--cycle]` for the titlebar pills —
run this leg, booted clean, pills read `Wisped` / `Bypass`.

**`gui-61.mjs` is the new regression harness for tool cards** (seeds a session
carrying a real tool call, drives collapse → expand → re-collapse, measures the
boxes). It passes, so a change that breaks disclosure turns it red.
`gui-55.mjs` is the live-tail harness. Other templates: `gui-52.mjs`,
`gui-54.mjs` (red-first discipline), `gui-49.mjs`, `gui-48.mjs`. All need
`npm run build` + `npm i --no-save playwright-core` (currently present).

Carried driver gotchas: stub `dialog.showOpenDialog` before any click that opens
one; `createRequire` for playwright-core outside the project; **pass paths as
arguments to `app.evaluate`, never inside string literals**; DOM-dispatched
clicks; measure in the DOM, never off screenshots; screenshot **at the moment
under test**, not only at the end; never re-read an element after an action that
may not have happened; clean up temp cwd and any seeded store dir after
`app.close()`; **log what the driver could not drive** — silence reads as a pass.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[stack]] · [[happy-path]]
- [[2026-07-30-disclosure-is-retention-plus-conditional-mount]] —
  implemented by #61, as written
- [[2026-07-30-a-diff-without-a-baseline-is-worse-than-none]] ·
  [[2026-07-30-inspection-is-universal-approval-safety-is-opt-in]] ·
  [[2026-07-30-a-failure-is-a-value-absence-stays-lenient]] ·
  [[2026-07-23-transcript-parser-pure-renderer-summarises]] ·
  [[2026-07-28-a-scrollbar-belongs-to-the-surface-not-the-component]] ·
  [[2026-07-29-live-tail-is-a-signal-not-a-stream]]
