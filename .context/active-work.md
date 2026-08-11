---
type: active-work
project: claude-wrapper
updated: 2026-08-11
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-11 by Opus 5, relay chain 7 leg 1 — owner away_
_At commit: `6067a12` on `main`_

## Current focus

**Chain 7 is draining a twelve-ticket queue, with `/preset gauntlet` chained
behind it.** Leg 1 landed **#149** and closed it. **Eleven tickets remain at
`ready-for-agent`.**

The queue was filled by an autonomous `/preset vibe` pass run under the owner's
AFK autonomy grant. Every ruling, warrant and cross-model objection is in
`.claude/vibe.md`; read it before overturning anything.

## State

- **In flight:** nothing. `ticket/149-published-surface-list` was squash-merged
  and deleted. Tree clean on `main`.
- **Closed 2026-08-11 (leg 1):** **#149** (`6067a12`). Nothing filed — the
  ticket's own follow-up was a discrepancy raised in a comment, not a new issue.
- **Open and agent-ready (11):** #138, #139, #140, #141, #142, #143, #145, #146,
  #147, #148, #150. **#144 stays `needs-triage` deliberately** — its settled half
  is #150, and closing #144 because #150 landed is the exact failure the split
  was reviewed against.
- **Next:** **#146** — producers must honour `SCREENSHOT_DIR` before anything
  else touches captures. See the ordering table in [[pick-up]].
- **Gate on `main` after the merge:** typecheck clean, build clean,
  **90 files / 1337 passed + 36 skipped** (was 89 / 1329; the +1 file and +8
  tests are exactly `tests/inspect-published-list.test.ts`). Ran on the branch
  and again on `main`. **Read the number off `main`, never off this file.**
- **NOT PUSHED.** D6 stands. Read the real gap:
  `git rev-list --count origin/main..main`.

## What #149 actually was

`inspect.mjs` publishes its surface list in **three** places and two had drifted
to **five against nine**. #133 added the three docks and #137 added
`welcome-min-window`; both updated the driver's own header, because that is the
file being edited, and neither touched `SKILL.md` or `.gauntlet/bar/README.md`.

**The obvious fix was rejected and the objection is the shape of the change.**
Generating both lists from `SURFACES` inverts the contract: deleting a driver
entry would silently delete the obligation to meet a standard on that surface. So
`SKILL.md` follows the instrument (correct, it documents one) while the bar keeps
its **own hand-authored list** and says in the file why.
`tests/inspect-published-list.test.ts` asserts only that the three **agree** —
membership held, order deliberately not, since the bar's order is wave order and
the driver's has the docks last.

Mutation-verified twice. Adding a surface reds both documents plus the file
count; **renaming one out of `SURFACES` while the bar still lists it reds the
same three**, which is the standard catching the implementation rather than the
other way round. A discrimination control runs first, because a parse returning
nothing would otherwise pass by agreeing all three publish an empty set.

## The transferable half

**A count sitting beside a list is what rots.** Four more stale counts were found
in the driver's own comments — section header, zero-CLI-turns claim,
commands-fixture note, and a runtime message reading *"four of the five surfaces
only exist once a folder is open"*. All were written at five surfaces or eight;
**#133 and #137 each walked past every one**. Three are now numeral-free rather
than corrected. Deleting the thing that rots beats re-pinning it.

**They were found by restoring the file after a mutation**, not by reading it —
the restore put the whole header back in view. Mutation testing paid twice here:
once for the verdict it was run for, once for what it made visible.

## Carried forward for the next leg

**A discrepancy in the bar, deliberately not resolved by #149.**
`.context/pick-up.md` says the three docks *"share the Sidebar's reference"* and
asks for that to be labelled the weaker comparison. But `.gauntlet/bar/README.md`'s
own "What each reference judges" table **already** assigns
`linear/linear-features.png` to *"Titlebar + docks: control grouping,
iconography"*. Those disagree.

The table is the owner-confirmed half of a human-owned artifact, so it was left
untouched and raised on #149 instead. **Worth settling before the gauntlet seed
reads it**, since the seed picks its references from that table.

**The `pieces` cap is a budget, not a scope statement.** With nine captured
surfaces and `pieces` capped at 6 and fixed at seed, one run cannot take all
nine. `.gauntlet/bar/README.md` now says so explicitly, so a seed picking a
subset is not evidence that the unpicked surfaces lack a standard.

## The correction to carry

**The DOM phase reported exit 0 while its own text said `DOM PHASE FAIL`, with
no pipe involved.** The command ended in `; echo`. **Any trailing command
replaces the status**, including the `echo` you added to print it. Read `$?` on
its own line, or grep the redirected file. The phase exits 1 correctly and always
did.

## Pick up here

```text
gh issue list --state open --label ready-for-agent
git rev-list --count origin/main..main
```

The tracker is the authority; this file has been wrong before. Recommended order
and its reasons are in [[pick-up]] — two entries there are load-bearing rather
than cosmetic, and **#138 before the gauntlet seed** is the sharper one: `bar_win`
requires *"one type scale holds across all of them"* and the app ships two, so
every per-surface verdict is confounded until #138 lands.

## Standing constraints for any leg touching the renderer

Unchanged, and all still hold: no em dashes in user-visible strings
(`tests/copy-em-dash.test.ts` compiles `src/`); the stylesheet pins are
literal-text and brittle (D3); any CSS change owes a driver pin that **runs**,
naming which gate runs it (D4) — jsdom loads no CSS, so the fast gate
structurally cannot see layout; the titlebar's centring is load-bearing (#136);
the identity mark is solid by design; colour and translucency are instrument
artifacts in any capture; `DESIGN.md` is read literally by
`tests/subagent-material.test.ts`, which splits on `\n## Bans in force\n` — #140
edits that section, so the split token must survive verbatim. Full text in
[[pick-up]].

One addition from this leg:

- **`inspect.mjs`'s surface list is now gated in three places.** Adding or
  removing a surface means editing `SURFACES`, `SKILL.md` **and**
  `.gauntlet/bar/README.md`, inside their `surfaces:begin` / `surfaces:end`
  markers. The bar's edit is a deliberate change to the standard, not
  bookkeeping.

## Open questions

**TWO** live owner-calls in `.claude/vibe.md` under `## Needs you`, both
reversible with the default already taken: the git history on the wave captures
(the repo is public), and gauntlet owner call 14, the stop signal. **SEVEN older
ones live in `.claude/vibe-130.md`.** Owner calls 14–20 are in
`.claude/gauntlet-core-surfaces.md`, the archived five-wave run.

**#144 stands unanswered**, and #150 is its settled half sitting in the queue.

## Related

- [[overview]] · [[pick-up]] · [[decisions]] · [[stack]] · [[happy-path]] · [[flows]]
- [[2026-08-11-a-standard-generated-from-the-code-it-polices-inherits-its-omissions]]
- [[2026-08-11-the-noise-floor-is-part-of-the-instrument]]
- [[2026-08-11-the-batch-is-the-instrument-and-a-teardown-is-a-promise]]
- [[2026-08-11-a-check-nobody-runs-is-not-a-check]]
