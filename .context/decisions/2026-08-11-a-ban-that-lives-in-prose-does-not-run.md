---
type: decision
project: claude-wrapper
date: 2026-08-11
updated: 2026-08-11
tags: [context, decision, copy, design-bans, testing]
---

# A ban that lives in prose does not run

## Decision

**#134 (`8b93fd5`).** `DESIGN.md` has banned em dashes in copy under **Bans in
force** for as long as that section has existed, and the ban was broken in
**fifteen shipped strings** across the titlebar, the composer, the sessions rail,
the tool card and the two rewind refusals. Nothing ever failed, because nothing
ever looked.

The fix is `tests/copy-em-dash.test.ts`, and it is the deliverable as much as the
copy is: it compiles every `.ts`/`.tsx` file under `src/` with **esbuild** and
fails on an em dash surviving in the output.

**Why a compiler rather than a grep, which is the transferable half.** A grep for
the character returns **~767 hits** in `src/`, and nearly all of them are
comments — this repo comments heavily, in em dashes, on purpose. The obvious
filter ("skip lines starting with `//`") is guesswork: it misses a dash inside a
multi-line template and mis-reads a comment that wraps. The compiler already
draws the exact line the ban needs. What survives a transform *is* the set of
strings, template spans and JSX text a user can read; comments are trivia and
never reach the output. **The classification is the compiler's, not a regex's**,
which is why it needs no maintenance as strings are added.

**Two traps, both found by running it rather than by reasoning:**

1. **A plain esbuild transform keeps comments attached to object-literal
   properties.** `src/preload/index.ts` alone has seven, and the first run
   reported all seven as copy. **`minifyWhitespace: true`** is what strips them,
   and it is the cheapest of the three minify flags that does: it rewrites no
   syntax and renames nothing, so a string reaches the search exactly as written
   (`minify` would also fold syntax and eliminate dead code). Pinned by a
   self-check that feeds the scan a line comment, a block comment and an
   object-literal comment and expects zero — the third case exists *because* it
   caught this check out.
2. **esbuild will not load under jsdom.** It asserts
   `new TextEncoder().encode('') instanceof Uint8Array`, which jsdom's
   cross-realm `TextEncoder` fails, and refuses with *"your JavaScript
   environment is broken"*. The file carries `// @vitest-environment node` — the
   first use of that docblock in this suite, since `vitest.config.ts` sets jsdom
   globally.

`charset: 'utf8'` is set deliberately: the default escapes non-ASCII, and a dash
spelled as a `\u` escape in the output would walk straight past a search for the
character. Mutation-verified in the other direction too — reintroducing one dash
into a `ToolCard` label reds the check and names the file.

**Scope is all of `src/`, not "the renderer".** Deciding per-string whether
something is user-visible is a judgement the check would have to re-make for
every string ever added, and it would eventually be wrong. Every em dash in a
`src/` literal today is copy, so the rule is simply that none belongs there:
stronger than the ticket asked for, and it needs no classifier. That is also why
the two rewind refusals in `src/main/` and the two attachment reasons in
`src/shared/` were rewritten alongside the renderer's — they are strings the user
reads, whatever directory declares them.

## The second keeper: a composed title's separator must survive an arbitrary label

The sessions rail's foreign-row title was `label — groupLabel` and is now
**`label (groupLabel)`**. A parenthetical rather than a joining word, and the
reason is structural rather than taste.

**`label` is not a noun phrase.** An enriched row (#49) carries the session's
**first user prompt, verbatim and untruncated** — `session-titles.ts` says so in
as many words: *"not summarized, not whitespace-collapsed, not truncated (rows
ellipsise in CSS)"*. So the label is routinely a whole sentence ending in its own
full stop:

- `Fix the parser. It crashes on empty input. in D:\projects\other` — a fragment
- `Fix the parser. It crashes on empty input. (D:\projects\other)` — closes cleanly

The `Unknown project` branch killed the remaining alternatives: `groupLabel` is
`cwd || UNKNOWN_PROJECT`, so it is **sometimes a path and sometimes a label**,
and `... in Unknown project` reads wrong where `... (Unknown project)` does not.
Four branches are pinned in `tests/sidebar.test.tsx` — foreign with a cwd,
foreign with a sentence label, foreign with no cwd, and a local row where the
composed form never renders at all.

Generalises past this string: **a separator chosen for the label you happened to
be looking at is a bug waiting for the label you were not.** The same reasoning
made the attachment rejection chip's `name — reason` into `name: reason`; both
of those dashes were separators between two labels, never clause breaks, so they
took the idiom for a qualifier rather than a rewrite of a sentence that was
never there.

## The third: grep for whole strings, miss the assertions holding fragments

Six tests pinned an affected string by exact text. **Four were found by grepping
for the strings; two only surfaced when the suite ran red** —
`toContain('the limit is 5 MB')` and `toMatch(/sends when this turn finishes/i)`
— because the search was for whole strings while the assertions held fragments.
The correct sweep is fragment-by-fragment, and it was re-run afterwards across
`tests/`, `.claude/skills/run-desktop/` and `scripts/inspect.mjs`. **No GUI
driver and no source sidecar asserts any affected string**, checked rather than
assumed. Two regex assertions survived untouched because they match surviving
fragments (`/still in the store/`, `/no live Claude Code session/i`).

## Why

The ban had a decade of prose behind it and zero enforcement, which is the
condition every drifted rule in this repo shares. Writing the check costs one
test file; not writing it means the next fifteen strings arrive the same way and
the next consistency pass is the same size. The scan is ~150ms and needs no
upkeep as strings are added, because it classifies by compilation rather than by
a list anyone has to maintain.

`DESIGN.md` now says, under **Bans in force**, that this is the ban with a test
behind it and where that test lives. Leaving the enforcement undiscoverable
invites someone to hand-fix a future dash and never learn the check exists.

## Reversibility

**Fully reversible, and cheap in both directions.** Deleting
`tests/copy-em-dash.test.ts` and the `DESIGN.md` paragraph restores the previous
state exactly; the copy changes stand on their own either way.

The rail's parenthetical is the one choice worth re-opening deliberately rather
than by accident — it is pinned in four branches, so changing it reds those
tests and the person changing it will read this entry. Anyone tempted by a
joining word should first check what `label` actually contains on an enriched
row.

## Related

- [[decisions]] · [[active-work]] · [[overview]]
- [[2026-08-11-a-check-nobody-runs-is-not-a-check]] — the same shape one step
  earlier: a contract that existed only where nothing executed it.
