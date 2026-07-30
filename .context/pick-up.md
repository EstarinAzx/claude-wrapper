---
type: pick-up
project: claude-wrapper
updated: 2026-07-30
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Last leg landed #62

**#62 — structured input inspector on tool cards — is closed, `f39ee22`,
pushed.** The card no longer shows one argument chosen by priority and hides
the rest:

- `inputEntries` (in `toolSummaries.ts`) derives the readable argument list at
  **render**, key-sorted, with non-string values materialised via
  `JSON.stringify(v, null, 2)` and a `String(v)` fallback for what JSON cannot
  represent
- `ToolCard` gained a **second** disclosure boolean and an `InputInspector`,
  conditionally mounted on both paths — a collapsed card mounts nothing and
  pays no stringify
- a **pending permission card renders the inspector outright**, no toggle: at
  approval time the arguments *are* the decision
- `.tool-card-input` is height-capped and scrolls, inheriting the app-wide
  scrollbar rule; values are `pre-wrap` + `overflow-wrap: anywhere`

18 new tests. **Both named mutations verified:** reducing the inspector to
single-key rendering killed 5 (including its named target), dropping `.sort()`
killed the ordering test.

New GUI driver `.claude/skills/run-desktop/gui-62.mjs`, **verified red first**
against a build with the inspector disabled — it failed naming `no input
control on a card called with 5 arguments`. Green run measured the inspector at
464×260 with `scrollHeight 980 > clientHeight 258`, values `pre-wrap`, output
still collapsed, composer bottom 652 < viewport 709.

**`gui-61.mjs` was repointed and re-run green.** It selected the bare
`.tool-card-toggle`, which now matches the input control first — it would have
driven input disclosure while asserting about output.

Gate at that commit: typecheck clean, build clean, **698 tests green across 51
files**.

## Next: the frontier is #63, alone — and it closes the spec

| # | Ticket | Blocked by |
|---|---|---|
| **#63** | Edit hunk diff — guarded local LCS, no dependency | — |

`gh api repos/EstarinAzx/claude-wrapper/issues/63 --jq
'.issue_dependencies_summary.blocked_by'` is the live gate — `gh issue list
--json` does **not** expose that field. It read `1` for several seconds after
#62 closed before settling to `0`; re-query before believing a blocker.

Spec **#58** stays open until #63 lands, and the leg that lands it closes the
spec too. **After that the `ready-for-agent` queue is empty** — that leg should
expect the queue-done path, not another ticket.

## The traps specific to what is left

1. **Never render a Write diff.** Write supplies only path + content, no
   before-state. Green added lines conceal what was overwritten and manufacture
   confidence at the deciding moment. Labelled content preview only.
2. **No `diff` dependency.** A local guarded line diff at ~45 lines, guard
   `oldLines * newLines <= 1_000_000`; above the guard render exact before/after
   blocks **without** attempting alignment. Removing the guard must be caught by
   the guard test — that is the ticket's named mutation.
3. **The diff is a third region on the card #62 finished.** The card owns two
   disclosure booleans now (`expanded` for output, `inputOpen` for input). A
   third region needing its own disclosure is a **third boolean**, not a second
   card — #58's one-card-per-tool-invocation decision still holds.
4. **A new control needs naming twice.** A `.tool-card-toggle--<what>` modifier
   class, because both GUI drivers select by class and the bare
   `.tool-card-toggle` matches whichever renders first; **and** an accessible
   name outside `tests/toolcards.test.tsx`'s `TOGGLE` regex
   (`/^(Show|Hide) (output|error)$/`), or the "advertises no expansion" guards
   go vacuous while staying green. Both failures are silent.
5. **Detail stays conditionally mounted.** Whatever #63 adds must not exist in
   the DOM while collapsed. The collapsed-card test is the tripwire and it is
   mutation-verified.
6. **A one-element fixture cannot distinguish a separator** — #59's whole cause.
   When a test is about how N things combine, N must be ≥ 2. For a diff that
   means a hunk with more than one changed line.
7. **`[]` and `null` differ on both store channels** (#60). A new caller that
   writes `?? []` silently restores the bug #60 removed.

No new `window.api` member is needed for #63, so the four-mock-sites rule does
not fire for this queue.

## Landmines — carried, still live

Full ledger in [[active-work]]. Most likely to bite here:

- **Never re-summarise a tool result on the way into state.** Both write paths
  store it whole; `ToolCard` summarises at render. A regression there is
  invisible to every rendering test — assert at state level.
- **Never `git checkout <file>` to undo a mutation on uncommitted work.** It
  restores from HEAD and takes your unstaged edits with it. Commit the ticket
  work first, then mutate, and reverse the mutation with the same anchored
  replace that applied it. (Worked cleanly this leg: commit → mutate → Edit
  back → `git diff` empty.)
- Pins are mutation-verified; never "fix" a red pin by editing its expectation.
  The legitimate-retirement allowance is **spent**.
- A green test can be green for the wrong reason — assert the mechanism (a call
  count, a read that must not happen, an ORDER), not a symptom.
- Expanded regions inherit the **global** scrollbar rule. Never scope a
  scrollbar to a component; never add `scrollbar-width` / `scrollbar-color`.
- Never hardcode a model name; the app runs the HOST `claude` when PATH has one.
- `gh issue close --comment` drops the comment on an already-closed issue — but a
  **standalone `gh issue comment` lands fine** on one. A pushed `Closes #N`
  auto-closes, so comment separately. `gh issue list` lags a close by seconds,
  and so does `issue_dependencies_summary`.
- **`gh` infers the repo from cwd.** `cd`-ing out of the clone makes
  `gh issue create` fail with `no git remotes found`. Stay in the repo, pass
  absolute `--body-file` paths, or use `-R <owner>/<repo>`.
- **The Bash tool is not PowerShell, and `src/` files are CRLF while
  `.context/*.md` are LF.** A mutation anchor written with `\n` matches nothing
  in `src/` and reports success, which reads exactly like a passing mutation
  test. Anchored `Edit` calls sidestep the whole class and are what this leg
  used for both mutations.
- A long `gh issue comment --body` full of backticks and quotes dies in the
  shell. Write the body to a file and use `--body-file`.
- Fable-5 refuses turns in sensitive-looking cwds (`Downloads/*`) — keep driver
  temp cwds away from there.

## Baseline

`main` = `f39ee22` + this leg's `.context` commit, **pushed** to `origin/main`.
Trust `git log origin/main..main` over any note.

## GUI check

`node .claude/skills/run-desktop/driver.mjs [--cycle]` for the titlebar pills.

**`gui-62.mjs` is the new regression harness for the input inspector** (seeds an
Edit call with five arguments including a 41-line string and a nested object,
drives collapse → expand → re-collapse, measures the boxes and asserts output
stayed collapsed). **`gui-61.mjs`** covers output disclosure; `gui-55.mjs` is the
live-tail harness. Other templates: `gui-52.mjs`, `gui-54.mjs` (red-first
discipline), `gui-49.mjs`, `gui-48.mjs`. All need `npm run build` +
`npm i --no-save playwright-core` (currently present).

Carried driver gotchas: stub `dialog.showOpenDialog` before any click that opens
one; `createRequire` for playwright-core outside the project; **pass paths as
arguments to `app.evaluate`, never inside string literals**; DOM-dispatched
clicks; measure in the DOM, never off screenshots; screenshot **at the moment
under test**, not only at the end; never re-read an element after an action that
may not have happened; clean up temp cwd and any seeded store dir after
`app.close()`; **log what the driver could not drive** — silence reads as a pass;
and **select controls by their modifier class**, since the card now carries more
than one.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[stack]] · [[happy-path]]
- [[2026-07-30-two-disclosures-two-booleans]] — implemented by #62, as written
- [[2026-07-30-a-diff-without-a-baseline-is-worse-than-none]] — #63's spine
- [[2026-07-30-disclosure-is-retention-plus-conditional-mount]] ·
  [[2026-07-30-inspection-is-universal-approval-safety-is-opt-in]] ·
  [[2026-07-30-a-failure-is-a-value-absence-stays-lenient]] ·
  [[2026-07-23-transcript-parser-pure-renderer-summarises]] ·
  [[2026-07-28-a-scrollbar-belongs-to-the-surface-not-the-component]] ·
  [[2026-07-29-live-tail-is-a-signal-not-a-stream]]
