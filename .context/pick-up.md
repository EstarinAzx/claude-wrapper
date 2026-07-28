---
type: pick-up
project: claude-wrapper
updated: 2026-07-29
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## queue empty

The `ready-for-agent` queue is **empty**. No ticket is waiting, nothing is
blocked, nothing is half-done. The only open issue is the unlabelled umbrella
**#1**.

The relay chain stopped here by design (loop-body contract: queue dry → stop,
no next leg). Picking up means **choosing new work**, not resuming old work.

## This leg landed

**#57 closed, and spec #55 closed with it.** Relay ticket-loop leg 2 built
live-tail core, merged `dc87844` (squash, branch deleted), and closed both the
ticket and its delivered spec.

The acceptance eyeball: `node .claude/skills/run-desktop/gui-55.mjs` now prints
`PASS` **unchanged** — pane 2 → 3 messages after an external append, with
`session:changed` on the main side. The same driver's red run is on record in
#56, so this green is evidence rather than decoration.

New surfaces worth knowing about before touching sessions code:

- `src/main/session-watcher.ts` — one watcher, at most one watched session,
  directory-level `fs.watch` filtered to `<id>.jsonl`, 200ms trailing debounce,
  injected `WatchIo` seam, `resetSessionWatcher()`. Epoch-fenced.
- `session:watch` / `session:changed` — the signal-only channel pair, both
  behind `isTrustedIpc`.
- `useChat` — eligibility ref (adopt arms, send / new-chat clears), single-flight
  reload with a trailing re-run, empty-result skip, post-await staleness check.

## Where the next work could come from

No spec exists for any of these; they are a menu, not a queue. The full list is
the **Deferred** section of [[active-work]]. The two closest to shovel-ready:

- **Incremental byte tailing** — the documented upgrade path from #55, worth
  doing only if wholesale reload is *observed* to flicker or lag. Do not start
  here on principle.
- **The watch-installed-after-the-read gap** — a `ponytail:` comment in
  `useChat.adoptSession` names both the hole and the fix (route the adoption
  read through `reload` with an authoritative first pass). Also demand-driven.

The road from an idea to a queue is `/preset init`, or `to-spec` → `to-tickets`
if the shape is already clear.

## Landmines — carried, still live

Full ledger in [[active-work]]. The ones most likely to bite next:

- **#57's epoch fence is the safety argument** — a `handle !== null` check
  replaces neither the stale-lookup guard nor the queued-event guard.
- **`fs.watch` throws synchronously**, main calls the watcher as a bare `void`,
  so unwrapping the construction kills the main process.
- **Never read `messagesRef` inside the reload loop** — a passive effect writes
  it, so a transient `[]` would wipe what the loop just applied.
- Pins are mutation-verified — never edit a red pin's expectation; and if a
  mutation kills nothing, the code you mutated may not be what makes the test
  pass (#57's busy gate is the worked example).
- New `window.api` member → all four mock sites, or suites die at render.
- Never hardcode a model name; the app runs the HOST `claude` when PATH has one.
- `gh issue close --comment` drops the comment on an already-closed issue, and
  `gh issue list` lags a close by seconds — comment → close → re-query.
- The Bash tool is not PowerShell, and source files are CRLF.
- Fable-5 refuses turns in sensitive-looking cwds (`Downloads/*`) — keep driver
  temp cwds away from there.

## Baseline

`main` = `dc87844` + this leg's `.context` commit; **ahead of `origin/main`**
(push is opt-in, `/preset ship`). Verified at the #57 merge gate:
`npm run typecheck` clean, `npm run build` clean, **637 tests green across 50
files**. Trust `git log origin/main..main` over any note.

## GUI check

`node .claude/skills/run-desktop/driver.mjs [--cycle]` for the titlebar pills.

**gui-55 is now a regression harness, not a proof** — it passes, so a future
change that breaks live-tail turns it red. Other templates: `gui-52.mjs`
(proof-of-input + main-side `webContents.send` instrumentation), `gui-54.mjs`
(red-first discipline), `gui-49.mjs` (main-process counters), `gui-48.mjs`
(dialog stubs). All need `npm run build` + `npm i --no-save playwright-core`.

Carried gotchas: stub `dialog.showOpenDialog` before any click that opens one;
`createRequire` for playwright-core outside the project; **pass paths as
arguments to `app.evaluate`, never inside string literals**; DOM-dispatched
clicks; measure in the DOM, never off screenshots; never re-read an element
after an action that may not have happened; clean up temp cwd (and any seeded
store dir) after `app.close()`; **log what the driver could not drive** —
silence reads as a pass.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[stack]] · [[happy-path]]
- [[2026-07-29-live-tail-is-a-signal-not-a-stream]] ·
  [[2026-07-28-the-model-is-the-clis-fact-not-the-pills]] ·
  [[2026-07-25-replay-shows-markers-not-bytes]] ·
  [[2026-07-28-lazy-enrichment-is-a-mount-not-a-scan]]
