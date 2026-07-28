---
type: pick-up
project: claude-wrapper
updated: 2026-07-29
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## This leg landed

**#56 closed — gui-55 exists and has failed for the right reason.** Relay
ticket-loop leg 1 built `.claude/skills/run-desktop/gui-55.mjs`, ran it against
the current build, and recorded the red run in #56's closing comment. `main` is
at `24b6e1d` (squash-merge, gate green: typecheck clean, 614/614 tests, branch
deleted). Not pushed — push is opt-in `/preset ship`.

The red run, short form: seeded terminal-shaped session adopted (2 messages
rendered) → external append grew the file 870→1342 bytes → pane stayed at 2
messages for 10s with **zero main-side IPC after the append** → manual reopen
rendered the appended line. So the line is valid, the load path renders it, and
the only missing piece is exactly the watcher/signal #57 adds.

## Next task: #57 — live-tail core

**The frontier is #57**, now unblocked (its only blocker #56 is closed).
`gh issue view 57 --comments`, plus #56's closing comment for the driver
evidence. Implementation decisions are FIXED in spec #55 and
[[2026-07-29-live-tail-is-a-signal-not-a-stream]] — do not re-decide:

- Main owns one directory-level watcher (single watched session, ~200ms
  trailing debounce — file-level `fs.watch` is unreliable on Windows). Only a
  signal crosses IPC either way; the transcript keeps travelling over
  `session:transcript`, its read/parse/sanitize pipeline reused untouched.
- Tail what you watch, never what you drive: adopt = tail-eligible; send /
  new-chat clears; busy blocks reload.
- Acceptance criteria pin the three gates as tests: signal-while-busy,
  signal-after-send, empty-result-kept (lenient read answers `[]` to transient
  failure — never clear a non-empty pane on an empty reload).
- Paths closed: incremental byte tailing is the upgrade path ONLY; polling
  rejected outright.

**Acceptance eyeball:** when #57 lands,
`node .claude/skills/run-desktop/gui-55.mjs` must flip to PASS **unchanged**.
Its red run is on record, so its green means something.

## Landmines specific to #57

- **New `window.api` members (`watchSession`, `onSessionChanged`) → every mock
  site** (`tests/chat-harness.ts` + inline mocks in `sidebar` / `session` /
  `shell` tests). `onSessionChanged` is subscribed on mount — a missing mock
  member kills suites at render, not at the feature's own tests.
- **Both new IPC channels take the `isTrustedIpc` guard** like every other.
- **The watcher module's state needs a test reset** (`resetSessionIndex()` /
  `resetEnrichedTitles()` are the precedents).
- **Watcher tests go through an injected watch fn** (the `StoreIo` idiom), and
  renderer tests through the mocked-api seam — no fs.watch call-shape
  assertions.
- **Do not touch `adoptSession`'s no-engine-call contract** — eligibility rides
  on it, it does not change it. `targetSession` stays exactly where it is.
- The transcript path the reload re-runs is the one #50 sanitized — nothing
  new to do there, just don't fork it.

## Landmines — carried, still live

Full ledger in [[active-work]] (all carried entries intact). Most likely to
bite on this work: pins are mutation-verified, never edit a red pin's
expectation; a green test can be green for the wrong reason — if a mutation
kills nothing, the code you mutated may not be what makes the test pass; never
hardcode a model name; the app runs the HOST `claude` when PATH has one;
`gh issue close --comment` drops the comment on an already-closed issue
(comment → close → verify); the Bash tool is not PowerShell and source files
are CRLF; Fable-5 refuses turns in sensitive-looking cwds (`Downloads/*`) —
keep driver temp cwds away from there.

## Baseline

`main` = `24b6e1d` + this leg's `.context` commit; ahead of `origin/main`
(push = opt-in `/preset ship`). Verified at the #56 merge gate:
`npm run typecheck` clean, `npm run build` clean, **614 tests green across 48
files**. Trust `git log origin/main..main` over any note.

## GUI check

`node .claude/skills/run-desktop/driver.mjs [--cycle]` for the titlebar pills.

**gui-55 exists now** — `node .claude/skills/run-desktop/gui-55.mjs`, currently
FAIL by design (see #56's closing comment); it is #57's acceptance harness. It
also demonstrates the seeding trick: a terminal-shaped session written straight
into the native store (`entrypoint: "cli"`, cwd = temp workspace) lists via the
SDK and adopts via the sidebar row — no CLI turn, no tokens. Other templates:
`gui-52.mjs` (proof-of-input + main-side `webContents.send` instrumentation),
`gui-54.mjs` (red-first discipline), `gui-49.mjs` (main-process counters),
`gui-48.mjs` (dialog stubs). All need `npm run build` + `playwright-core`.

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
