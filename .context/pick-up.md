---
type: pick-up
project: claude-wrapper
updated: 2026-07-29
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## This leg landed

**No code — a design leg.** Owner reported that a session driven in a terminal,
viewed simultaneously in the wrapper, does not progress: the pane is a snapshot
from open time, and seeing new turns means re-opening. One sitting took it
brainstorm → approach choice → **spec #55** → **tickets #56/#57**, all on the
tracker, all `ready-for-agent`. Working tree untouched; `main` still `d78eee3`,
level with `origin/main`.

The decision is on record as
[[2026-07-29-live-tail-is-a-signal-not-a-stream]]. The short form:

- **Watch the file, signal the renderer, re-run the existing load path.** Main
  owns one directory-level watcher (single watched session, ~200ms trailing
  debounce — file-level `fs.watch` is unreliable on Windows). Only a signal
  crosses IPC in either direction; the transcript keeps travelling over
  `session:transcript`, its read/parse/sanitize pipeline reused untouched.
- **Tail what you watch, never what you drive.** Adopt = tail-eligible;
  send/new-chat clears; busy blocks reload. Half the reason is clobbering your
  own live stream; the other half is that a post-send reload swaps live
  attachment thumbnails for replay chips (bytes never cross IPC on reopen).
- **Paths closed:** incremental byte tailing is the upgrade path ONLY (do not
  start there); polling rejected outright; an empty reload with a non-empty
  pane is skipped, because the lenient read answers `[]` to transient failure.

## Next task: #56, then #57

**The frontier is #56** — the gui-55 driver. `gh issue view 56 --comments`.
Build a driver that opens a session in the real app, appends a valid transcript
line to that session's JSONL from outside, and asserts the new message appears
with no interaction. It must also prove the append happened (file grew), or a
static pane and a failed append are indistinguishable — gui-52's confound
lesson.

**Run it against the current build and watch it fail for the right reason**
(pane rendered once, no update). That red run is the deliverable — record it in
the ticket comment. The ordering is the point: the driver exists and has failed
before the fix exists, so its later green means something (gui-54's lesson,
promoted into ticket sequencing).

**Then #57** — live-tail core (blocked by #56, native edge set). Implementation
decisions are fixed in spec #55; don't re-decide them. Acceptance criteria pin
the three gates (signal-while-busy, signal-after-send, empty-result-kept) as
tests.

## Landmines specific to #56/#57

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

Unchanged from 2026-07-28 verification: `npm run typecheck` clean,
`npm run build` clean, **614 tests green across 48 files**. `main` =
`origin/main` = `d78eee3` + this leg's `.context` commit. Trust
`git log origin/main..main` over any note.

## GUI check

`node .claude/skills/run-desktop/driver.mjs [--cycle]` for the titlebar pills.

**gui-55 does not exist yet — it IS ticket #56.** Templates, nearest first:
`gui-52.mjs` for "the UI followed something the user never clicked" (pair every
assertion with proof the input happened — transcript growth; instrument
`webContents.send` in MAIN, wrapped after `firstWindow()`, to tell "never
broadcast" from "renderer ignored it"); `gui-54.mjs` for the red-first
discipline; `gui-49.mjs` main-process counters; `gui-48.mjs` dialog stubs.
All need `npm run build` + `playwright-core`.

Carried gotchas: stub `dialog.showOpenDialog` before any click that opens one;
`createRequire` for playwright-core outside the project; **pass paths as
arguments to `app.evaluate`, never inside string literals**; DOM-dispatched
clicks; measure in the DOM, never off screenshots; never re-read an element
after an action that may not have happened; clean up temp cwd after
`app.close()`; **log what the driver could not drive** — silence reads as a
pass.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[stack]] · [[happy-path]]
- [[2026-07-29-live-tail-is-a-signal-not-a-stream]] ·
  [[2026-07-28-the-model-is-the-clis-fact-not-the-pills]] ·
  [[2026-07-25-replay-shows-markers-not-bytes]] ·
  [[2026-07-28-lazy-enrichment-is-a-mount-not-a-scan]]
