---
type: pick-up
project: claude-wrapper
updated: 2026-07-30
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Queue empty

**The `ready-for-agent` queue is empty and nothing is half-done.** No branches open, nothing blocked, nothing stuck `ready-for-human`. The only open issue is the unlabelled umbrella **#1**, which is not a queued ticket.

The next effort is a choice, not a continuation: `/preset init` or grill-me → `/hp` → to-spec → to-tickets, or pick from **Deferred** in [[active-work]] — but that list is ranked by nothing, and the last two specs held up precisely because they were measured against a real corpus before being committed to.

## What landed this leg

Two passes over the renderer stylesheet, both on main and pushed.

**1. Dedupe** (`28be647`) — repeated literals promoted to `@theme` tokens (`--ease-snap` absorbed 37 copies of one cubic-bezier, `--color-tint-1…7` absorbed 31 raw tint alphas, plus `--font-mono`, `--color-well`, `--color-danger-*`), and ~20 near-identical rule blocks collapsed into shared selector groups. Declarations **1159 → 968 (−16.5%)**, compiled bundle **40,082 → 35,262 B (−12%)**. Every semantic class name kept, so no JSX changed.

**2. Split by surface** — `styles.css` is now a **23-line entry file** (Tailwind layer setup + eleven `@import`s); the rules live in `src/renderer/src/styles/`: `tokens` · `base` · `shared` · `titlebar` · `rails` · `agent-map` · `chat` · `composer` · `tool-card` · `markdown` · `subagent`. Largest file **448** lines, median 134. Compiled bundle **byte-identical** at 35,262 B apart from two intended moves.

Gate: typecheck clean, build clean, **725 tests green across 52 files**, GUI drivers green with identical computed values. Rationale: [[2026-07-30-tailwind-here-is-a-token-system-not-a-utility-system]] (why not a utility migration) and [[2026-07-30-the-import-order-is-the-cascade]] (why the split, and what it made load-bearing).

## Why the refactor is not "the CSS migrated to Tailwind"

The ask was to migrate `styles.css` to Tailwind because the project already has it. Measurement killed the premise: **nothing in the app uses a Tailwind utility class** — all ~200 `className` values are semantic — so eight specs after [[2026-07-23-tailwind4-tokens]] promised "new UI uses utilities," it has never once happened. A full utility rewrite would also have deleted ~60 class selectors pinned by 52 test files and 5 GUI drivers, and the pin-retirement allowance is spent. The measured clutter was **duplication, not syntax**, so tokens + shared groups fixed the real complaint while a utility rewrite would not have. Whether Tailwind should stay at all is now the open question — see [[active-work]].

## Landmines most likely to bite next

Full ledger in [[active-work]]. The CSS ones are new and all of them are silent:

- **The `@import` order in `styles.css` IS the cascade.** `tokens` → `base` → `shared` must stay first and in that order — the shared groups are single-class rules every component override is at least as specific as. Reordering those eleven lines restyles the app with no error and no failing test.
- **A new rule goes in the file that owns its surface, never in the entry** (imports only), and never as a scoped scrollbar copy — that is the drift `tests/scrollbar.test.ts` exists to catch, which is why it reads the whole `styles/` directory.
- **`tests/scrollbar.test.ts` scans every line containing a scrollbar pseudo-element — comments included.** Writing `::-webkit-scrollbar` in prose makes the scan treat that comment as a selector and the test goes red.
- **`tests/multiline-composer.test.tsx` slices the raw CSS from `.bubble {` / `.message-input {` to the NEXT `}`.** Those two selectors must stay **ungrouped** (`chat.css` and `composer.css` respectively), and no comment inside either block may contain a closing brace.
- **`src/` is CRLF, `.context/*.md` is LF.** A whole-file `Write` to a stylesheet emits LF and flips it silently; re-normalise afterwards. A file that shows as ` M` in `git status` with an empty `git diff` is this, not a real edit — `git update-index --really-refresh` clears it.
- **`gui-45.mjs` is STALE and fails on `main`** (`no foreign row was disabled`) — #47 made foreign sessions openable. Verified pre-existing. Do not "fix" the app to satisfy it.
- **`.command-row-btn` lacks `font: inherit`** and is deliberately excluded from the shared row-button group; adding it repaints `.command-row-desc`. Real fix, needs its own ticket.
- A mutation that kills nothing may mean the CODE is dead, not that the test is weak.
- Pins are mutation-verified; never "fix" a red pin by editing its expectation. The legitimate-retirement allowance is **spent**.
- Expanded regions inherit the **global** scrollbar rule. Never scope one to a component.
- Never hardcode a model name; the app runs the HOST `claude` when PATH has one.
- `gh issue close --comment` drops the comment on an already-closed issue; `gh issue list` lags a close by seconds. **`gh` infers the repo from cwd.**
- Fable-5 refuses turns in sensitive-looking cwds (`Downloads/*`) — keep driver temp cwds away from there.

## Baseline

`main` = the dedupe (`28be647`) + the split + this leg's `.context` commit, **pushed** to `origin/main`. No open branches. Trust `git log origin/main..main` over any note.

## GUI check

`node .claude/skills/run-desktop/driver.mjs [--cycle]` for the titlebar pills. `gui-63.mjs` (Edit diff), `gui-62.mjs` (input inspector), `gui-61.mjs` (output disclosure), `gui-55.mjs` (live tail), plus `gui-42/47/48/49/51/52/54`. All need `npm run build` + `npm i --no-save playwright-core` (currently present).

**A CSS-only change needs more than a driver** — a driver only sees the elements it happens to mount. The exhaustive check is to build both versions, resolve every `var()` in the two compiled bundles, and diff effective declarations per selector; that is what proved this refactor changed nothing (304 selectors before, 304 after, none added or removed).

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[stack]] · [[happy-path]]
- [[2026-07-30-the-import-order-is-the-cascade]] — this leg, second pass
- [[2026-07-30-tailwind-here-is-a-token-system-not-a-utility-system]] — this leg, first pass
- [[2026-07-23-tailwind4-tokens]] — the ADR it sharpens
- [[2026-07-28-a-scrollbar-belongs-to-the-surface-not-the-component]] ·
  [[2026-07-30-a-mutation-that-kills-nothing-is-an-answer]] ·
  [[2026-07-30-a-diff-without-a-baseline-is-worse-than-none]] ·
  [[2026-07-30-two-disclosures-two-booleans]]
