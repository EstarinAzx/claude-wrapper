---
type: active-work
project: claude-wrapper
updated: 2026-08-05
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-05 by Opus 5, owner present_
_At commit: `e0b8855`_

## Current focus

**Nothing. The tracker is empty — zero open issues.** Spec #115 is delivered and
closed, both halves of its seed shipped and owner-verified in the real app.

## State

- **In flight:** nothing.
- **Shipped 2026-08-05:** #116 (`bd0fed5`, spike) · #117 (`50b6a8d`, spike,
  adopted nothing) · **#118 (`8a58686`)** `@` file references in the composer ·
  **#119 (`403d761` + `e0b8855`)** acrylic keeps its blur through a focus loss.
- **Gate:** typecheck clean, **1122 tests / 74 files**, build clean.
  `gui-118` PASS, `gui-119` PASS including 8/8 stress trials.
- **Queue:** empty. No open issues at all.

## Pick up here

There is no queued work. Two things are recorded as *worth a ticket if they
matter*, neither filed, both the owner's call:

1. **The Acrylic option's copy is stale.** It reads *"blurs what's behind the
   window; Windows flattens it when the window loses focus."* The second clause
   is no longer true — and with the 250ms flash the accurate replacement is not
   simply deleting it.
2. **The 250ms flash**, if it stops being acceptable. Upgrade path is earlier
   entries in `REASSERT_DELAYS_MS` (`src/main/backdrop-keeper.ts`); the open
   question is how early DWM will accept a re-assert, which needs a capture taken
   *during* the transition rather than after.

Otherwise: a new idea starts at `/preset init`.

## Skills for next session

- `run-desktop` — `gui-118.mjs` and `gui-119.mjs` are the two newest drivers, and
  both caught defects a fully green suite could not see.

## Open questions

None. All six owner calls parked on #115 are answered — four taken with warrants
on 2026-08-05 and shipped in #118, the two backdrop ones answered by observation
and by #119 respectively.

## Recent context

- **Acrylic keeps its blur now**, for free — the material is re-asserted on
  `blur` at 0/250/800ms. No dependency; both routes #117 priced stay rejected.
- **What ships is "it comes back", not "it never goes"** — the 0ms attempt loses
  the race against DWM, so there is ~250ms of opaque before the blur returns.
  Owner-accepted.
- **A probe must trigger the mechanism the way the product will.** The probe that
  justified this fix re-applied 800ms after focus loss and never exercised the
  synchronous path that shipped — which is exactly where the race lived.
- **Mica survives blur** — owner observation, the first sighting on a record that
  had twice refuted the claim. The keeper does not re-assert mica because of it.
- **`@` file references ship as typing assistance only**; the send path is
  untouched because the CLI already resolves `@path`.
- **The caret is a trigger jsdom models differently** — read caret state off the
  ref, never off a synthetic event target, and never fall back to `0`.
- **An event handler in main must not be able to throw** — Electron turns it into
  a modal error dialog over the app.

## Related

- [[overview]]
- [[pick-up]]
- [[decisions]]
- [[2026-08-05-a-probe-that-hides-the-race-cannot-justify-the-code-that-runs-into-it]]
- [[2026-08-05-the-caret-is-the-trigger-and-jsdom-cannot-see-it]]
- [[2026-08-05-an-accepted-call-is-not-a-supported-route]]
