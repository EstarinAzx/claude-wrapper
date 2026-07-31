---
type: pick-up
project: claude-wrapper
updated: 2026-07-31
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`. Then read the five ADRs listed below **before touching any ticket** — the spec summarises, the ADRs argue.

## The queue is no longer empty

**Spec #64 is published and sliced into six tickets. Four are unblocked.** No code was written this leg — the whole leg was the `/preset init` funnel: grill → ADRs → MVD → spec → tickets.

| # | Ticket | Blocked by |
|---|---|---|
| **#65** | Retire the stale `gui-45` driver so the batch has a usable gate | — |
| **#66** | Appearance dock with the zoom control | — |
| **#67** | Tokenise the two duplicate colour literals | — |
| **#68** | Delete a session from the rail | — |
| **#69** | Backdrop control: Acrylic or Mica | #66 |
| **#70** | Four themes: Frost, Ember, Moss, Slate | #66, #67 |

## Order, and why it is not arbitrary

**#65 first.** It is not part of the feature. `gui-45.mjs` is red on `main` today — it asserts the pre-#47 rule that foreign rows are disabled, and #47 deliberately reversed that. While it stays red, "drivers green" is not a usable gate for anything in the batch and every driver run is ambiguous.

**Then #68 (delete), ahead of the rest** — not for freshness, but because it is **the only ticket whose scope is not yet known.** It opens with a probe: does Windows hold the transcript's file handle beyond the turn? If it does, the busy gate widens from "the active row while busy" to "the active row, always" — a different feature with a different empty-state story. Do the ticket with an unresolved scope while there is room to react, not at the end of a batch.

Then **#66 → #67 → #69 → #70**.

## What the owner asked for, and what they are getting

Four things: a delete-sessions button, a settings surface ("you decide what to put there"), a persistent-acrylic toggle, and colour themes.

**One of them cannot be delivered literally, and the tickets say so.** Persistent *acrylic* needs a native FFI dependency that [[2026-07-23-persistent-glass-deferred]] priced and rejected on grounds that have not changed. What ships is **Mica** — native, always-on, no dependency, but wallpaper-tinted rather than blurring. Persistent without being acrylic. **The word "persistent" is banned from the UI copy and the spec title** so nobody later reads "persistent glass shipped" and expects blur-behind that never flips.

## The two reversals — read these before reviewing anything

Both are counter-intuitive, both are already written into the tickets, and both came from a grill that pushed back and turned out to be right.

- **Preferences stay in `localStorage`.** The plan opened wanting a main-side store for the backdrop, on the premise that main must know it before the window is constructed. **That premise is false** — `setBackgroundMaterial` is runtime-settable on our Electron (`electron.d.ts:3236`, `^43.2.0`). What is left is a one-frame launch artifact, which does not earn a persistence layer — especially since `useZoom`'s mount effect already ships a *larger* version of the same artifact, for every user, where the backdrop one is opt-in.
- **The delete call omits `dir`.** Passing it *looks* safer. The SDK's no-`dir` branch **enumerates** project directories; the `dir` branch realpaths and **encodes** one — the operation [[2026-07-28-storage-location-is-an-index-not-an-encoding]] deleted from this codebase, measured failing on **45 of 494** live sessions. Passing `dir` buys a delete button that silently no-ops on ~9% of rows. Omitting it also deletes the "unknown project" branch entirely.

## Landmines this batch will walk into

Full ledger in [[active-work]]. The ones specific to these tickets:

- **`themes.css` becomes the THIRD raw-text CSS reader.** Both existing ones have gone red on prose. The theme file will want comments explaining each hue, and a naive property regex counts a commented-out declaration. **Strip comments before parsing.**
- **The accent is FOUR tokens, not three** — `rails.css:324` paints mint at 10% alpha and CSS cannot alpha a `var()`, so `--color-mint-wash` is required. A three-key expectation greens while a theme silently inherits Frost's wash.
- **Only `--color-mint` / `--color-mint-press` may move chroma** (0.05–0.09). Neutrals move by hue angle only; `--color-mint-ink` keeps both its lightness and its chroma.
- **The Appearance panel must have no draft state** — `App.tsx:106` closes the dock on a workspace switch, so a Save button is a data-loss bug.
- **Join the dock-shell selector groups; do not widen them.** Editing a shared group repaints the sessions rail *and* the agents dock, silently, with a suite that loads no CSS.
- **Backdrop must not touch any neutral**, or it becomes a second theme axis writing #70's properties.
- **Two new IPC channels** (backdrop, delete) → the four-mock-sites rule plus `preload/index.d.ts` fires **twice**. Theme and zoom are renderer-only.
- **A driver screenshot cannot judge the backdrop** — `--disable-gpu` flattens acrylic, so both materials look identical to it. Real window or nothing; same for whether a theme looks good.
- **A not-found delete is `ok`, not `failed`**, and no outcome is classified by string-matching the SDK's error text.
- Everything from earlier legs still applies — the `@import` order IS the cascade, pins are mutation-verified and never "fixed" by editing an expectation, `src/` is CRLF while `.context/*.md` is LF, and never hardcode a model name.

## Baseline

`main` = last leg's commit + this leg's `.context` commit. **Pushed.** No open branches. Trust `git log origin/main..main` over any note.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[stack]] · [[happy-path]]
- [[2026-07-31-a-preference-lives-where-it-is-read]] — #66/#69's storage answer
- [[2026-07-31-appearance-is-a-dock-not-a-settings-modal]] — #66
- [[2026-07-31-backdrop-offers-mica-not-persistent-acrylic]] — #69
- [[2026-07-31-a-theme-is-a-re-hue-not-a-re-design]] — #70
- [[2026-07-31-deleting-a-session-is-scoped-confirmed-and-singular]] — #68
- [[2026-07-23-persistent-glass-deferred]] — pre-approved the Mica route; still live for the native-dep route
- [[2026-07-28-storage-location-is-an-index-not-an-encoding]] — why #68 omits `dir`
