---
type: active-work
project: claude-wrapper
updated: 2026-08-05
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-05 by Opus 5 (auto), relay leg 1 (`/relay N=1 .claude/relay-leg.md`)_
_At commit: `bd0fed5`_

## Current focus

**#116 is delivered and closed; #117 is the whole remaining queue.** #116 was a
spike and stayed one — harness, findings, recommendation, no `src/` diff. Its
follow-up build is filed as **#118**, deliberately `needs-info` rather than
`ready-for-agent`: four of its behaviours are owner calls parked on #115.

## State

- **In flight:** nothing.
- **Done this leg:** #116 closed (`bd0fed5`) — `scripts/spike-116-at-mentions.mjs`
  + `spike-116-findings.json`. Filed **#118**. Posted a correction comment to
  **#115** (its "no SDK route to ask" conclusion is refuted).
- **Gate:** typecheck clean, **1044 tests / 70 files** (the `main` baseline,
  unchanged — nothing under `src/` or `tests/` moved), build clean.
- **Queue:** **#117** only (`ready-for-agent`, unblocked). #118 is `needs-info`.
- **Blocked:** #118, on four owner calls. Nothing blocks #117.

## Pick up here

Take **#117** — the win32 backdrop route sweep. It is a **spike and must stay
one**: sweep, findings, priced routes, `git diff --stat -- src/` empty. It
adopts nothing and reverses no ADR.

Run the frontier query rather than trusting this line.

## Skills for next session

- `superpowers:verification-before-completion` — #117 is a spike; every claim
  must name the run it came from.

## Open questions

Six parked on **#115**, none blocking #117. Four are `@`-shaped and now have a
ticket waiting on them (**#118**): trigger window · cursor-insert vs replace ·
exclusions and cap · attachment-tray membership. Answering those four flips #118
to `ready-for-agent` with no other change. The two backdrop calls — whether Mica
survives blur, and whether the flip is worth a dependency — are #117's context
and remain the owner's.

`ready-for-human` is **allowed** this queue (the owner is asleep, not away).

## Recent context

- **The `@` send path already works.** Measured, not assumed: `@path` in ordinary
  prompt text is resolved by the CLI through this app's exact `query()` options
  shape. #118 is therefore typing assistance only, and its sharpest pin is that
  sent text stays byte-identical.
- **#115's "no SDK route to ask" is refuted** — `query.request({subtype:
  'file_suggestions'})` is accepted. The bundle grep was reading names one level
  below the method list. Correction posted on #115.
- **But the route is not a picker** — empty query returns the workspace top
  level; 18/18 non-empty prefixes returned zero in-workspace matches.
- **`canUseTool` is not a control surface.** It is a request the ambient
  permission mode may never make — this machine's `defaultMode` is
  `bypassPermissions`, so a harness denying through it denied nothing. Use
  `disallowedTools`, and count `tool_use` blocks as a second witness.
- **An out-of-workspace suggestion leak was seen once and not reproduced.**
  Recorded as unexplained, not refuted.

## Related

- [[overview]]
- [[pick-up]]
- [[decisions]]
- [[2026-08-05-a-denial-the-runtime-never-consults-is-not-a-denial]]
- [[2026-08-05-a-declared-wire-type-is-not-a-callable-route]]
