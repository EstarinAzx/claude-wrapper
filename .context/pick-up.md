---
type: pick-up
project: claude-wrapper
updated: 2026-07-27
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

**Queue empty.** Spec #36 (slash commands) is fully delivered and closed —
#37 `ab7835f` · #38 `c077904` · #39 `0cb6e31` · #40 `c63e170`, all
squash-merged to main, 441 tests green. The `/relay 10m N=8 /preset
ticket-loop` chain stopped itself on queue-dry (leg 1, 3 firings, state file
`stop: true`). New work needs a spec first: `/preset init` for a fresh idea,
or seed from the deferred list in [[active-work]].

## Open loose ends (no spec, just candidates)

- ~~Host issue~~ **RESOLVED 2026-07-27 (later session): never a host issue.**
  Every gui-40 driver variant had an unescaped JS path (`'C:\Users\…'` single
  backslashes → `C:UsersS.D…`), so the dialog stub picked a nonexistent
  folder and the CLI spawned with a bad cwd — the SDK misreports that as
  "native binary exists but failed to launch". Fixed the escape, ran
  `gui-40.mjs`: **#40 GUI eyeball complete** (popover, alias match via
  `/usage`, Enter-insert-no-submit all confirmed live; breadcrumb on #40).
  Lesson: that SDK error can mean *bad spawn cwd*, not a broken binary.
- **Popover name column truncates aggressively** when descriptions are long
  (`/c…` for `/context-sync`) — cosmetic, observed in gui-40.png, unticketed.
- **Caveat-blob follow-up** (from #38): `<local-command-caveat>` persists as
  its own standalone user message; it replays verbatim and is what sidebar
  titles show for command-first sessions. Candidate: drop caveat-only
  messages in the parser as CLI noise — fixes replay and titles in one move.
- `main` is **8 commits ahead of origin** — push is deliberate opt-in
  (`/preset ship`).

## Landmines — carried, still live

- Full ledger in [[active-work]]. Headlines: the plain-string engine pin and
  the array-of-only-text parser pin are mutation-verified — never "fix" their
  expectations; replay never carries the payload; absent stays absent;
  `taskToParent` is the `local_bash` filter; wisp `options.model` = family
  NAME ([[2026-07-24-wisp-alias-routes-by-name]]); never bare `wisp
  snapshot`; native backend is dead on this host — real turns run wisped;
  new `window.api` channel → ALL FOUR mock sites; jsdom: no images, no CSP,
  no hit testing.
- **New #40-era pins:** autocomplete's Enter interception (open intercepts /
  closed submits) and the per-keystroke `listCommands` refetch are both
  regression-pinned in `tests/autocomplete.test.tsx` — the refetch exists
  because a single `[]` fetch mid-warm-up wedges the popover (live-observed,
  jsdom-invisible).
- Binding decisions for the whole slash-command surface:
  [[2026-07-27-slash-commands-are-a-dumb-pipe]] (amended with #37's capture).

## Test helpers worth reusing

- `tests/engine.test.ts` — `streamingStub()` / `capturingStub()`; #37's
  system-branch fixtures; #39's warm-up inertness pins.
- `tests/chat-harness.ts` — `fakeChatApi` + `harness.emit()`; mock list
  channels the way `listCommands`/`listModels` are.
- `tests/transcript.test.ts` — parser seam, marker + invocation-unwrap cases.
- `tests/autocomplete.test.tsx` · `tests/commands-dock.test.tsx` — composer
  popover + dock prior art.
- `tests/resume.test.tsx` — replay seam. `tests/agents-dock.test.tsx` — dock
  structure twin.

## GUI check

`node .claude/skills/run-desktop/driver.mjs [--cycle]` (build + playwright-core
present). Driver recipe + #37's SDK-capture recipe: see the GUI section of the
previous baton, preserved in git history of this file, or the ready scripts in
`%LOCALAPPDATA%/Temp/spike37/` (capture.mjs, gui-check.mjs, gui-39.mjs,
gui-40.mjs). Key gotchas: `createRequire` for playwright-core; forward slashes
except the dialog-stub path; DOM-dispatched clicks (Playwright stability wait
hangs on the app's animations); hard `setTimeout(process.exit)`; measure in
the DOM, never off screenshots.
