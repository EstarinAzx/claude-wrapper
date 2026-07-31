---
type: pick-up
project: claude-wrapper
updated: 2026-07-31
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`. Then read the ADRs listed below **before touching any ticket** — the spec summarises, the ADRs argue.

## What the last leg landed

**#68 closed — `70c904f`.** A session can be deleted from the rail: hover or keyboard focus reveals the control, the first click arms that row (Delete / Cancel), the second commits. One row armed at a time; Escape or blur reverts. Gate green — typecheck, build, **770 tests across 53 files** (+27). `gui-47` re-run afterwards: `PASS all #47 criteria`, zero skips.

**The probe that opened the ticket falsified the ticket's own premise, and the feature survived unchanged.** Windows holds **no** delete-blocking handle on a transcript — the unlink succeeds mid-turn, after the turn with the CLI child still alive, and after close. So the busy gate did *not* widen to "the active row, always". What the probe found instead is worse than a lock: a mid-turn delete **succeeds and is then undone**, because the running turn recreates the file on its next append and the row comes back as a stub. The refusal stayed, for that reason. [[2026-07-31-deleting-a-session-is-scoped-confirmed-and-singular]] has been **amended** with the measurements — do not re-derive the lock argument from an older reading of it.

## Next ticket

**#66 — Appearance dock with the zoom control.** Open, `ready-for-agent`, `blocked_by: 0`.

It is the batch's hinge: **#69 and #70 are both blocked on it**, so nothing else in spec #64 moves until it lands. Then **#67 → #69 → #70**. **#71 is not in that chain** — it blocks no feature work, but #66 moves the zoom its measurement depends on, so do it before or alongside #66 rather than after the batch.

## Landmines

Full ledger in [[active-work]]. The ones that will bite #66:

- **`gui-51` is an EXPECTED driver failure** — `model menu gutter 9.4px | .session-groups gutter 9px`, tracked as #71. It is the *only* one. A second failing driver, or a different signature from this one, is a real regression. Do not absorb it into your ticket and do not widen its tolerance to fit.
- **Preferences stay in renderer `localStorage`.** The main-side store rested on a premise that is false — `setBackgroundMaterial` is runtime-settable. See [[2026-07-31-a-preference-lives-where-it-is-read]].
- **The Appearance panel must have no draft state.** `switchWorkspace` clears `openDock`, so the panel closes itself on an unrelated action; a Save button behind a self-closing panel is silent data loss.
- **Join the dock-shell selector groups, do not widen them.** Editing a shared group in `shared.css` repaints the sessions rail *and* the agents dock, silently, with a suite that loads no CSS. Own the control rows in a new file.
- **Lifting the zoom level out of its `useEffect` closure must not disturb the first-mount persist** — `zoom-level-v2` is versioned for exactly that reason, and a stored level always wins over a raised default.
- **The titlebar is already crowded and #66 makes it worse.** Flagged for an impeccable pass, out of scope here, but do not let it become a seventh control nobody costed.
- **New from #68 — a CSS pin that matches by substring can match a longer selector.** The keyboard-reachability assertion survived deleting the rule it was pinning, because `.session-row:focus-within .session-delete` is also a prefix of the `:disabled` variant. Find rules by what they *do*, and always run the mutation.
- Everything from earlier legs still applies — the `@import` order IS the cascade, pins are mutation-verified and never "fixed" by editing an expectation, `src/` is CRLF while `.context/*.md` is LF, and never hardcode a model name.

## Baseline

`main` = `70c904f` + this leg's `.context` commit. **Pushed.** No open branches. Trust `git log origin/main..main` over any note.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[stack]] · [[happy-path]]
- [[2026-07-31-deleting-a-session-is-scoped-confirmed-and-singular]] — **#68, amended with the probe result**
- [[2026-07-31-appearance-is-a-dock-not-a-settings-modal]] — **#66, the next ticket**
- [[2026-07-31-a-preference-lives-where-it-is-read]] — #66/#69's storage answer
- [[2026-07-31-backdrop-offers-mica-not-persistent-acrylic]] — #69
- [[2026-07-31-a-theme-is-a-re-hue-not-a-re-design]] — #70
- [[2026-07-31-a-driver-establishes-its-premise]] — #65's outcome, and the rule the driver set now follows
- [[2026-07-28-storage-location-is-an-index-not-an-encoding]] — why #68 omitted `dir`
