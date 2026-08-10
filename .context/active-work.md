---
type: active-work
project: claude-wrapper
updated: 2026-08-11
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-11 by Opus 5, relay chain 6 leg 3 — owner away_
_At commit: `8b93fd5` on `main`_

## Current focus

**#134 landed: the em-dash ban is now a test rather than a sentence.** `DESIGN.md`
has banned em dashes in copy for as long as **Bans in force** has existed, and the
ban was broken in **fifteen shipped strings** — the titlebar's five tooltips, four
composer strings, the sessions rail's row title, the tool card's truncation
notice, the delete failure, two attachment reasons and the two rewind refusals.
Nothing ever failed, because nothing ever looked.

The chain continues. **Three tickets remain and all three are genuinely
unblocked** — both declared blockers (#132, #133) are closed.

## State

- **In flight:** nothing. `ticket/134-remove-em-dashes` was squash-merged and
  deleted. Tree clean on `main`.
- **Closed 2026-08-11:** **#134** (`8b93fd5`). **Filed:** nothing. Nothing broken
  surfaced that was not fixed in the ticket; the two esbuild traps are recorded
  in [[2026-08-11-a-ban-that-lives-in-prose-does-not-run]], not as tickets.
- **Open:** #135, #136, #137 (`ready-for-agent`) · #138, #139, #140
  (`ready-for-human`) · #141, #142 (`needs-triage`). **Frontier: #135, #136,
  #137** — blocked-by sections read on all three, both blockers closed.
- **Gate on `main` after the merge:** typecheck clean, build clean,
  **88 files / 1317 passed + 36 skipped** (was 87 / 1313 + 36). Ran on the branch
  and again on `main`. **Read the number off `main`, never off this file.**
- **NOT PUSHED. Twelve commits sit local.** D6 stands: **a leg does not push on
  its own initiative.** Read the real gap rather than this number, it has drifted
  every leg: `git rev-list --count origin/main..main`.

## The new standing constraint, and it will bite the next leg that writes copy

**`tests/copy-em-dash.test.ts` runs in the gate.** It compiles every `.ts`/`.tsx`
file under `src/` with esbuild and fails on an em dash surviving in the output.
So: **a new user-visible string containing an em dash reds the suite.** Comments
are free and stay free — this repo comments in em dashes on purpose, and the
compiler drops them before the search ever runs.

Two things to know before touching that file:

1. **`minifyWhitespace: true` is load-bearing, not cosmetic.** A plain transform
   *keeps* comments attached to object-literal properties — `src/preload/index.ts`
   alone has seven, and the first run of the check reported all seven as copy.
2. **It runs under `// @vitest-environment node`.** esbuild asserts
   `new TextEncoder().encode('') instanceof Uint8Array`, which jsdom's
   cross-realm `TextEncoder` fails; under the suite's default jsdom it refuses to
   load with *"your JavaScript environment is broken"*.

## The rail-title finding, which is the transferable half

The foreign-row title went from `label — groupLabel` to **`label (groupLabel)`**,
and the parenthetical is structural rather than taste.

**`label` is not a noun phrase.** An enriched row (#49) carries the session's
**first user prompt, verbatim and untruncated** — `session-titles.ts` says so in
as many words. So the label is routinely a whole sentence ending in its own full
stop, and any joining word reads as a fragment after it:

- `Fix the parser. It crashes on empty input. in D:\projects\other` — broken
- `Fix the parser. It crashes on empty input. (D:\projects\other)` — closes cleanly

The `Unknown project` branch killed the alternatives: `groupLabel` is
`cwd || UNKNOWN_PROJECT`, so it is **sometimes a path and sometimes a label**.
Four branches are pinned in `tests/sidebar.test.tsx`.

Generalises as **a separator chosen for the label you happened to be looking at
is a bug waiting for the label you were not.**

## Pick up here

**Run the frontier query first — it is the authority, and this file has been
wrong before:**

```text
gh issue list --state open --label ready-for-agent
```

Then read the **"Blocked by"** section in the chosen issue body. Edges are prose,
not native tracker links.

**#135 is the oldest and is free.** It executes the DOM-level driver assertions
and resolves the red empty-state check — the half #132 deliberately left out, and
the half that would make constraint D4 below mean something. #136 and #137 are
also free; **read the #142 warning below before starting either.**

## The landmine, unchanged and now touching two tickets

**#137's AC2 cannot be satisfied as written, and that is a finding rather than an
obstacle.** It requires every other surface to be **byte-identical**, *"proved
with a hash comparison, not an eyeball"*.

`titlebar.png` is **not byte-stable**, and never was. `.session-title` renders
`basename(cwd)` and the fixture workspace is `mkdtemp`'d, so six random characters
change the glyphs while the box and text length (43) hold. Measured across seven
runs, and the **unmodified** driver spreads *wider* (9084 / 9538 / 9083) than the
modified one, so this predates #133. Filed as **#142** with four candidate fixes,
none obviously right, because each trades randomness for a collision between
concurrent runs.

A leg taking #137 should hash the other six surfaces and treat the titlebar by
box and content — or resolve #142 first and hash all seven. **Do not silently
adjust a capture to make a hash go green.**

**#136 is the other half of the same subject**: centring the session title means
editing the element whose rendered content makes `titlebar.png` unstable. Worth
reading #142 first; the two may want to land together.

## Skills for next session

- **Do not push on your own initiative.** See State.
- **Do not apply `ready-for-human`** — banned for this batch. A blocker becomes
  `needs-info` + a comment + a `PushNotification`.
- **File follow-ups at `needs-triage`, never `ready-for-agent`.** This chain stops
  on an empty frontier; a leg promoting its own follow-up there makes the stop
  condition unreachable by construction.
- **Sweep for test assertions fragment-by-fragment, never by whole string.** Six
  tests pinned an affected string by exact text this leg; four were found by
  grepping the strings and **two only surfaced when the suite ran red**, because
  the assertions held fragments (`toContain('the limit is 5 MB')`,
  `toMatch(/sends when this turn finishes/i)`). Check
  `.claude/skills/run-desktop/` and `scripts/inspect.mjs` too, not just `tests/`.

## Open questions

**TWO** live owner-calls in `.claude/vibe.md` under `## Needs you`, both
reversible with the default already taken. **SEVEN older ones live in
`.claude/vibe-130.md`** — every reference pointing at `.claude/vibe.md` for those
is stale. Plus **#138–#140** (`ready-for-human`) and the gauntlet stop-signal
question recorded as owner call 14 in `.claude/gauntlet.md`.

## Recent context

- **`DESIGN.md` now names its one enforced ban.** The **Bans in force** section
  says which ban has a test behind it and where the test lives. `DESIGN.md` is
  read literally by `tests/subagent-material.test.ts`, which splits on
  `\n## Bans in force\n` — that test still passes, but anyone editing that
  section should re-run it.
- **Two of the rewritten strings live outside the renderer and were included
  anyway**: the rewind refusal is duplicated in `src/main/engine.ts` and
  `src/main/index.ts`, and the two attachment reasons are declared in
  `src/shared/attachment-policy.ts` but render in the composer's rejection chip.
  The check scans all of `src/` for the same reason — classifying a string as
  user-visible is a judgement that would have to be re-made forever.
- **The attachment rejection chip changed separator too**: `name — reason` is now
  `name: reason`. Both that and the rail title were separators between two
  labels, never clause breaks, so they took the idiom for a qualifier rather than
  a rewrite of a sentence that was never there.

## Related

- [[overview]] · [[pick-up]] · [[decisions]] · [[stack]] · [[happy-path]] · [[flows]]
- [[2026-08-11-a-ban-that-lives-in-prose-does-not-run]]
- [[2026-08-11-an-instrument-may-not-photograph-a-state-the-app-calls-impossible]]
- [[2026-08-11-a-check-nobody-runs-is-not-a-check]]
