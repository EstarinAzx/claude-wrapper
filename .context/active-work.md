---
type: active-work
project: claude-wrapper
updated: 2026-08-05
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-05 by Opus 5 (auto), relay leg 2 (`/relay N=1 .claude/relay-leg.md`)_
_At commit: `50b6a8d`_

## Current focus

**Nothing is in flight and the agent queue is empty.** Spec #115's two slices are
both delivered — #116 (`bd0fed5`) and #117 (`50b6a8d`), each a spike that stayed
one. What remains across the whole tracker is **owner input**, so the relay chain
stopped rather than spawning a leg with nothing to take.

## State

- **In flight:** nothing.
- **Done this leg:** #117 closed (`50b6a8d`) — `scripts/spike-117-backdrop-routes.mjs`,
  `spike-117-findings.md` + `.json`, four captures in `scripts/spike-117-shots/`.
  Moved **#115** from `ready-for-agent` to `ready-for-human` and commented why.
- **Gate:** typecheck clean, **1044 tests / 70 files** (the `main` baseline,
  unchanged — nothing under `src/` or `tests/` moved), build clean.
- **Queue:** **empty.** Zero `ready-for-agent` issues.
- **Waiting on the owner:** **#115** (`ready-for-human`) — six calls.
  **#118** (`needs-info`) — blocked on four of those six.

## Pick up here

There is no agent-takeable ticket. Two ways forward, both needing the owner
first:

1. **Answer four of #115's six calls** — the `@` trigger window, cursor-insert vs
   replace, list exclusions and cap, attachment-tray membership. That flips
   **#118** to `ready-for-agent` with no other change, and it is the shortest path
   back to a working queue.
2. **Make the backdrop call.** Open `scripts/spike-117-findings.md` and the four
   PNGs in `scripts/spike-117-shots/`. If the answer is "adopt something", that is
   when a build ticket gets filed and #117's report is its pricing.

Run the frontier query rather than trusting this line:

```text
gh issue list --state open
gh api repos/EstarinAzx/claude-wrapper/issues/<n> --jq '.issue_dependencies_summary.blocked_by'
```

## Skills for next session

- `superpowers:brainstorming` if the owner answers the `@` calls — #118's shape is
  decided by those four answers, not by the code.

## Open questions

Six on **#115**, none taken. Four block **#118**. The two backdrop ones are now
**priced rather than open-ended**: whether Mica survives blur (still deliberately
unobserved — #117 explains why its own measurement does not settle it) and
whether the flip is worth a dependency (`scripts/spike-117-findings.md` prices
every route and adopts nothing).

## Recent context

- **There is no supported win32 route to a backdrop that survives blur.** Of 1387
  member declarations in Electron 43.2.0, exactly one couples material to
  activity and it is `@platform darwin`. Upstream closed this exact request as
  completed in 2025 — for macOS.
- **A callable route is not an effective one.** `setVibrancy` and
  `visualEffectState` are both accepted on win32 and both do nothing. A diff
  adding either reads alive in review and is dead at runtime.
- **`setBackgroundMaterial` has no runtime whitelist** — it accepts any string.
  `src/shared/backdrop.ts`'s compare-never-coerce guard is therefore the only
  whitelist in the system and must not be "simplified".
- **A second window taking focus** is how to produce an honestly-unfocused,
  still-visible window under automation. `blur()` remains inert, exactly as #75
  recorded; this is the rung #75 was missing.
- **`page.screenshot()` cannot show a DWM backdrop at all**, and a richness score
  is not an occlusion control — S4's first run produced four convincing
  photographs of a terminal.
- **The `@` send path already works** (#116): `@path` in ordinary prompt text is
  resolved by the CLI through this app's exact `query()` options shape, so #118 is
  typing assistance only and its sharpest pin is that sent text stays
  byte-identical.

## Related

- [[overview]]
- [[pick-up]]
- [[decisions]]
- [[2026-08-05-an-accepted-call-is-not-a-supported-route]]
- [[2026-08-05-a-denial-the-runtime-never-consults-is-not-a-denial]]
- [[2026-08-05-a-declared-wire-type-is-not-a-callable-route]]
