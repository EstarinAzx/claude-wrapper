---
type: pick-up
project: claude-wrapper
updated: 2026-07-31
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## What the last leg landed

**#72 closed — `9fecc10`. CSS only: six declarations in `src/renderer/src/styles/titlebar.css`, plus a new `gui-72.mjs`.** No JSX, no class name, no aria-label, no test expectation edited.

`.titlebar-center` was `position: absolute; left: 50%; translateX(-50%)` — out of flow, bounded by nothing — and `.session-title` was an inline span with `nowrap` and no `overflow` / `text-overflow`, which are **inert on an inline box anyway**. So the title grew symmetrically from centre and slid under the pills and the dock buttons. It is now `flex: 1; min-width: 0; display: flex; justify-content: center` (keeping `pointer-events: none`), and the span carries `overflow: hidden; text-overflow: ellipsis; min-width: 0`.

Measured with `getBoundingClientRect` against a real 60-character workspace folder, before → after:

| content px | page css | before | after | slot after |
|---|---|---|---|---|
| 1600 | 1280 | 456.5..823.5 | 478.5..845.5 | 275..1049 |
| 1280 | 1024 | 328.5..695.5 | 350.5..717.5 | 275..793 |
| 1024 | 819 | **226.1..593.1** (neighbours at 275 / 588.2) | 275..588.2 | 275..588.2 |
| 860 | 688 | **160.5..527.5** (neighbours at 275 / 457) | 275..457 | 275..457 |

Before, the title's rect was a **constant 366.9css at every width** — an out-of-flow box shrinks for nothing. After, it shrinks to the slot and ellipsises (`client 182 / scroll 367` at 688css) while a 60-char name still renders whole at 1280css and 1024css.

`gui-72` was shown **red on the unfixed tree first** (#65's rule) and is mutation-verified: deleting `overflow: hidden` reddens it via the computed-style assertion, not the geometry one — the box stays the right size and the ink escapes it.

Gate green — typecheck, build, **823 tests across 56 files** (unchanged; no source outside CSS touched).

## Next ticket

**None. The queue is empty** — `gh issue list --state open` returns `[]`. The relay chain's next leg will find nothing to pick and self-close; that is the designed end, not a failure.

If the owner brings a new want: `/preset init` → `/hp` MVD → `to-spec` → `to-tickets`, then a fresh `/relay N=1 read and follow .claude/relay-leg.md` over the batch.

**The longest-waiting open question is now Tailwind's fate, and it is unblocked.** #72 was the last natural test of the utilities premise and shipped without a single utility class. It is one of the four calls parked for the owner in `.claude/vibe.md` under `## Needs you` — **do not decide it, or the other three, from a leg.** The fourth (#72's centring trade-off) is now *shipped* rather than hypothetical: the title sits ~15css off true centre, visible in a real window, and reversing it is a two-line revert plus the magic number the ticket rejected.

## Landmines

Full ledger in [[active-work]]. The ones #72 added:

- **`.titlebar-center` must stay IN FLOW.** The span's `display` is never authored — it is blockified by being a flex item, and that is the only reason `overflow` / `text-overflow` apply at all. Moving the truncation onto the span and restoring the absolute centre looks equivalent and silently does nothing.
- **`pointer-events: none` on that slot is load-bearing**, not decoration. The slot now spans the middle of the titlebar in flow; dropping it hands a wide strip of the drag region to a non-interactive `<div>`.
- **`.session-title` stays out of `shared.css`'s 13-selector truncation triad, deliberately.** Its rule lives in `titlebar.css`. Widening the shared group repaints the sessions rail and the agents dock against a suite that loads no CSS.
- **When the defect is what gets PAINTED, at least one assertion must read computed style.** #72's mutation left every rect assertion green while the text painted straight out of its box.
- **`gui-72`'s temp-dir cleanup is best-effort and runs after `app.close()`** — the engine holds the fixture as its cwd, so an EBUSY there is ordinary and must never decide the verdict.

Still true from earlier legs: **there is no expected driver failure any more — every driver is green, so any red is a real regression**; the `@import` order IS the cascade (thirteen lines, `tokens` → `themes` → `base` pinned); pins are mutation-verified and never "fixed" by editing an expectation, and **no pin retirement is authorised**; `tests/scrollbar.test.ts` scans every line containing a scrollbar pseudo-element, comments included, and does not strip them; `gui-51` compares in **device** pixels and never with `offsetWidth - clientWidth`; a screenshot cannot see the right ~20% of the layout, so measure with `getBoundingClientRect`; `--disable-gpu` is fine for geometry but flattens acrylic, so leave `gui-69` / `gui-70` on the GPU; `src/` is CRLF; and never hardcode a model name.

## Baseline

`main` = `9fecc10` + this leg's `.context` commit, pushed. No open branches — `ticket/72-titlebar-title-truncation` was squash-merged and deleted. Trust `git log origin/main..main` over any note.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[stack]] · [[happy-path]]
- [[2026-07-31-the-titlebar-centre-is-a-flex-item-not-an-overlay]] — #72's ADR
