---
type: active-work
project: claude-wrapper
updated: 2026-08-05
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-05 by Opus 5, after the relay chain (owner present for the last stretch)_
_At commit: `8a58686`_

## Current focus

**Spec #115 is fully delivered and `@` file references have shipped.** Three
tickets landed today: #116 and #117 as spikes that stayed spikes, and **#118 as
the batch's first real feature**. The only thing still open is #115 itself,
holding **two backdrop calls that need the owner's eyes**.

## State

- **In flight:** nothing.
- **Done today:** #116 (`bd0fed5`, spike) · #117 (`50b6a8d`, spike, adopted
  nothing) · **#118 (`8a58686`, feature)** — `@` file references in the composer.
- **Gate:** typecheck clean, **1109 tests / 73 files** (from the 1044/70
  baseline), build clean, `gui-118.mjs` PASS in a real window.
- **Queue:** empty. #115 is `ready-for-human`.
- **Waiting on the owner:** the two backdrop calls on #115 — does Mica survive
  blur, and is the unfocused flip worth a dependency.

## Pick up here

Nothing is agent-takeable. The one open item is an eyeball call:

1. Open `scripts/spike-117-findings.md` and the four PNGs in
   `scripts/spike-117-shots/`. #117's recommendation is **adopt nothing**, with
   `mica-electron`'s `alwaysFocused(true)`, koffi + `SetWindowCompositionAttribute`,
   and an aesthetic change priced as live alternatives.
2. Open the app, pick Mica, click away, look. Nothing on the record asserts what
   Mica does on blur, deliberately.

If the answer is "adopt something", that is when a build ticket gets filed and
#117's report is its pricing.

Run the frontier query rather than trusting this line:

```text
gh issue list --state open
gh api repos/EstarinAzx/claude-wrapper/issues/<n> --jq '.issue_dependencies_summary.blocked_by'
```

## Skills for next session

- `run-desktop` — `gui-118.mjs` is the newest driver and the one that caught a
  bug a fully green suite could not see.

## Open questions

Two, both on **#115**, both the owner's, both now **priced rather than
open-ended**. The four `@` calls that used to sit beside them were taken on
2026-08-05 with warrants (recorded on #115) and are shipped in #118.

## Recent context

- **`@` file references ship as typing assistance only.** The send path is
  untouched: #116 measured `@path` in ordinary prompt text as already resolved by
  the CLI through this app's exact `query()` options shape.
- **The caret is the trigger, and jsdom models it differently.** The composer
  read the caret off React's synthetic `onSelect` target with a `?? 0` fallback;
  21 composer tests passed in jsdom while the popover was shut in Chromium. Read
  caret state off the ref, and never fall back to `0` — `0` is a valid caret.
- **`src/main/workspace-files.ts` is a new trust boundary.** Out-of-workspace
  entries are dropped at discovery, and the tests assert the walk port was never
  *reached* for them rather than that they are absent from the result.
- **No supported win32 route holds a backdrop through blur** (#117). One member
  in 1387 declarations couples material to activity, and it is `@platform
  darwin`. Upstream closed this exact request as completed in 2025 — for macOS.
- **A callable route is not an effective one.** `setVibrancy` and
  `visualEffectState` are accepted and inert on win32.
- **`setBackgroundMaterial` has no runtime whitelist**, so
  `src/shared/backdrop.ts`'s compare-never-coerce guard is the only one.

## Related

- [[overview]]
- [[pick-up]]
- [[decisions]]
- [[2026-08-05-the-caret-is-the-trigger-and-jsdom-cannot-see-it]]
- [[2026-08-05-an-accepted-call-is-not-a-supported-route]]
- [[2026-08-05-a-denial-the-runtime-never-consults-is-not-a-denial]]
