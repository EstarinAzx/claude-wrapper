---
type: decision
project: claude-wrapper
date: 2026-08-11
updated: 2026-08-11
tags: [context, decision, design-system, type]
---

# A ratio rule is tested as a ratio, and its tolerance is set by the rungs it already admits

## Decision

`DESIGN.md` states the type scale as a **ratio** (`~1.15`, off a 15px body), so #138
(`b2a3fd0`) enforces it as one. The criterion `gui-138.mjs` measures is:

> every painted size lands within **half a pixel** of `15 * 1.15^k`, for whole `k`.

Not an allow-list of six numbers. An enumeration is the move the ticket's own ruling
refused, and it would pass any new size the day somebody appended it to the list.

The markdown headings were **restruck onto the ladder** rather than documented into
compliance: `1.25em` / `1.1em` became `calc(var(--fs-body) * 1.15 * 1.15)` and
`calc(var(--fs-body) * 1.15)`, moving 18.75 → 19.8375 and 16.5 → 17.25. `--fs-display`
was **re-pointed at what it paints**: it read 23px while its only caller consumed it
through `calc(... * 1.15^5)` and painted 46.26, so the name said 23 and nothing in the
product rendered 23.

**The rung count went DOWN**: seven distinct painted sizes where there were eight.

## Why

**The tolerance is not slack, and it is not a number anybody chose.** The authored rungs
are rounded to whole px and already carry error: 11 sits **0.34px** from `15/1.15²`, 13
sits 0.04px, the display rung 0.10px. So any tolerance tight enough to be interesting is
also tight enough to throw `--fs-micro` off the scale that documents it. **The rule cannot
be tightened past the rungs it already admits** — and that is what makes it a rule rather
than a threshold picked to make the current tree green.

That mattered immediately. The live sweep found a **seventh size nobody had counted**:
`.win-btn` carries no `font-size` rule at all, so the ten window controls inherit
Chromium's UA `13.3333px` button default. It sits **0.29px** from rung -1 — *closer to its
rung than the documented 11px rung sits to its own*. Calling it a violation would have been
goalpost-moving in the opposite direction, so it is **named in `DESIGN.md`** and filed as
**#159**, a question about whether a painted size may be inheritable from the user agent
at all, which is not the question #138 asked.

**The collision check exists because criterion 1 structurally cannot see it.** 17.25 sat
0.75px from both headings, and the ruling forbade "resolving" that by moving one step over.
Two sizes can both be legal rungs and still be the wrong pair. Verified in isolation by
moving `.welcome-hint` one rung up: criterion 1 stayed **green**, criterion 2 **red**.

**D4 is discharged across two gates, and each file says which runs it.**
`gui-138.source.mjs` (`npm test`) bans `em` font-sizes and literal px sizes in `styles/`,
and cross-reads `tokens.css` against `DESIGN.md` so a token moving without the document
following is a red. `gui-138.mjs` (`npm run test:dom`) sweeps every painted box in real
Chromium. The source half can only stop the defect returning **by the route it came in
on**; the rendered half is the only thing that can see the defect at all, because jsdom
loads no CSS.

**Leg 9's habit caught a bug in this leg's own check.** Source criterion 2 compared
`path.relative()` output against a forward-slash allow-list entry; on win32 those are
backslashes, so **the exception never matched and the check reded against the very line it
was written to permit**. Reading it would not have found that. Running it did. See
[[2026-08-11-a-test-built-on-ambient-state-measures-the-ambient-state]].

## Reversibility

**Cheap, and each half independently.** The rungs are three `calc()` declarations and one
token value. The rule is one constant (`TOLERANCE_PX`) and one function in the driver.

The one thing that is **not** free to reverse: `DESIGN.md`'s Type section now names the
rungs with roles and names the two non-rungs on screen. Reverting the code without
reverting that document reinstates the exact defect the ticket was filed for — a document
claiming a scale the app does not paint. Source criterion 3 reds on that, which is the
point of it.

## Related

- [[decisions]] · [[active-work]] · [[overview]]
- [[2026-08-11-a-test-built-on-ambient-state-measures-the-ambient-state]]
- [[2026-08-11-a-standard-generated-from-the-code-it-polices-inherits-its-omissions]]
