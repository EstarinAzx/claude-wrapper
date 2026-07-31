---
type: pick-up
project: claude-wrapper
updated: 2026-07-31
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`. Then read the ADRs listed below **before touching any ticket** — the spec summarises, the ADRs argue.

## What the last leg landed

**#65 closed — `f0dfc68`.** The stale `gui-45` driver is retired, and `gui-47` was recovered with it.

The ticket named one failure. There were **four**, and only one was #47's doing. The rest — plus a fourth in `gui-47` — came from the rail shipping **scoped to the open project** while neither driver established the cross-project premise it asserts, so both inherited whatever `sidebar-scope` a previous driver had stored. `gui-47` was the expensive one: one red assertion on top of **three of its four sections silently skipped**, leaving the driver that covers #47's whole workspace-switch transaction verifying almost nothing. Both now widen the scope through the real chip; `gui-47` runs a full battery with zero skips.

**#71 filed.** `gui-51` is red on `main` — pre-existing, unrelated, confirmed by stashing #65's work and re-running on clean `main` for a byte-identical failure.

## Next ticket

**#68 — Delete a session from the rail.** Open, `ready-for-agent`, `blocked_by: 0`.

Take it ahead of #66/#67, and not for freshness: it is the only ticket whose **scope is not yet known.** It opens with a probe — does Windows hold the transcript's file handle beyond the turn? If it does, the busy gate widens from "the active row while busy" to "the active row, always", which is a different feature with a different empty-state story. Do the ticket with an unresolved scope while there is room to react, not at the end of a batch.

Then **#66 → #67 → #69 → #70**. **#71 is not in that chain** — it blocks no feature work, but #66 moves the zoom its measurement depends on, so it is worth doing before or alongside #66 rather than after the batch.

## Landmines

Full ledger in [[active-work]]. The one that is new, and the one that will bite #68:

- **`gui-51` is an EXPECTED driver failure right now** — `model menu gutter 9.4px | .session-groups gutter 9px`, tracked as #71. It is the *only* one. A second failing driver, or a different signature from this one, is a real regression. Do not absorb it into your ticket and do not widen its tolerance to fit.
- **A driver must establish the app state it asserts, never inherit it.** Drivers write each other's persisted preferences — `gui-scope-zoom-pill` clicks back to "This project" on exit, which is what `gui-45` and `gui-47` were reading. Click the real control; seeding `localStorage` only works if the surface mounts after the write. And read the `SKIPPED` lines: a driver that skipped most of itself is unverified, not green.
- **The delete call omits `dir`.** Passing it *looks* safer. The SDK's no-`dir` branch **enumerates** project directories; the `dir` branch realpaths and **encodes** one — the operation [[2026-07-28-storage-location-is-an-index-not-an-encoding]] deleted, measured failing on **45 of 494** live sessions. Passing `dir` buys a delete button that silently no-ops on ~9% of rows, and omitting it deletes the "unknown project" branch entirely.
- **A not-found delete is `ok`, not `failed`** — a staleness signal, and the user's intent is satisfied. No string-matching the SDK's error text, and no `null`-vs-`[]` analogue invented for a mutation; that convention belongs to the read channels.
- **Two new IPC channels this batch** (backdrop, delete) → the four-mock-sites rule plus `preload/index.d.ts` fires **twice**, each needing `isTrustedIpc` and a value whitelist. Theme and zoom are renderer-only.
- Everything from earlier legs still applies — the `@import` order IS the cascade, pins are mutation-verified and never "fixed" by editing an expectation, `src/` is CRLF while `.context/*.md` is LF, and never hardcode a model name.

## Baseline

`main` = `f0dfc68` + this leg's `.context` commit. **Pushed.** No open branches. Trust `git log origin/main..main` over any note.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[stack]] · [[happy-path]]
- [[2026-07-31-a-driver-establishes-its-premise]] — #65's outcome, and the rule the driver set now follows
- [[2026-07-31-deleting-a-session-is-scoped-confirmed-and-singular]] — **#68, the next ticket**
- [[2026-07-31-a-preference-lives-where-it-is-read]] — #66/#69's storage answer
- [[2026-07-31-appearance-is-a-dock-not-a-settings-modal]] — #66
- [[2026-07-31-backdrop-offers-mica-not-persistent-acrylic]] — #69
- [[2026-07-31-a-theme-is-a-re-hue-not-a-re-design]] — #70
- [[2026-07-28-storage-location-is-an-index-not-an-encoding]] — why #68 omits `dir`
