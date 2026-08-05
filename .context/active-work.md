---
type: active-work
project: claude-wrapper
updated: 2026-08-06
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-06 by Opus 5, relay chain 3 leg 8, owner away_
_At commit: `024361a` on `main`_

## Current focus

**Spec #120 is delivered and closed.** All eight slices (#121–#128) landed, one
per relay leg, every leg gate-green. The final slice — the 1.0.0 bump — landed
as `024361a` and closed the spec in the same leg.

**The queue did not go dry with it.** **#129** (rewind a turn's file changes)
unblocked the moment #128 closed, and is now the **only open issue in the
repo**. It is not part of spec #120 — it was filed by #127's spike, carries a
measured shape, and the owner asked for rewind by name. Nothing is in flight.

## State

- **In flight:** nothing. No ticket branch exists; `ticket/128-version-1-0-0`
  was squash-merged and deleted. Tree clean on `main`.
- **Closed 2026-08-05:** **#121** markdown tables (`ef6ef22`) · **#122** copy
  button (`a359f9f`) · **#123** message reuse (`f649f1d`) · **#124** effort
  control (`39c2896`) · **#125** viewer material (`c92fca7`) · **#126** map
  visual pass (`0628745`).
- **Closed 2026-08-06:** **#127** the three-route spike (`8a3481e`), **no `src/`
  diff** · **#128** version 1.0.0 (`024361a`) · **#120** the spec itself,
  delivered.
- **Open:** **#129** only — `ready-for-agent`, **unblocked** (its `blocked_by`
  list endpoint reads `128 closed`).
- **Gate on `main`:** typecheck clean, build clean, **1246 tests / 82 files** —
  unchanged across #127 and #128, correctly: a spike and a version bump add no
  tests. Batch total moved 1122/74 → 1246/82, **+124 tests, +8 files**.
  **Read the number off `main`, never off this file.**
- **`origin/main` is 14 commits behind, deliberately** (`git rev-list --count
  origin/main..main` — this number has been stale in the handoff twice, so read
  it rather than copying it). Every leg of this chain
  landed locally and pushed nothing — pushing is outward-facing and the owner has
  not asked for it. **Worth raising when they are back.**

## Pick up here

**#129 — rewind a turn's file changes.** The only open ticket, and the whole
build is decided by #127's measurements. **Read `scripts/spike-127-findings.json`
before starting**; every claim in the ticket was produced by calling the route
with a negative control that held.

Shape, already measured so nobody re-derives it:

- **`enableFileCheckpointing: true` is the whole switch.** Without it,
  `rewind_files` answers `canRewind: false` / `"File rewinding is not
  enabled."`. With it, `dry_run: true` returns `canRewind: true` plus
  `filesChanged` / `insertions` / `deletions` — a real preview — and the wet call
  **reverted the file on disk**, with a bogus-uuid control run first that left it
  alone, so the revert is attributable.
- **It binds at query CONSTRUCTION**, like `model` and `effort`. A setter that
  only stores changes nothing — it must rebuild the engine exactly as `model:set`
  does.
- **Stamp your own `uuid`.** The CLI **never echoes the prompt back**; the only
  `type: 'user'` messages on the stream are **tool results**. `engine.ts` must set
  `uuid` on the outgoing user message and keep it (assert with
  `getSessionMessages`). The spike's own arm scraped the stream and was addressing
  a `tool_result` before it was fixed.
- **No env plumbing needed.** The flag travels as an env var and `engine.ts`
  replaces the child env wholesale — a real collision hypothesis, **tested and
  refuted**. The arm passing the app's own `resolveSpawnEnv` output works.
- **Rewind restores FILES, not the conversation.** The UI must not imply
  otherwise, and it does **not** reopen #123's refill decision.
- **Unmeasured, worth measuring in the build:** behaviour on a **resumed**
  session (the SDK's own source carries a caveat for the store-backed case), and
  the runtime cost of checkpointing.

After #129 the frontier query comes back **empty** and the chain stops.

## Skills for next session

- **#129 is a real build** — engine option, uuid retention, a preview affordance,
  and a main-process handler that cannot throw. TDD applies; the acceptance
  criteria are already testable as written.
- **Do not push.** See State.
- **Do not apply `ready-for-human`** — the owner banned it for this batch. A
  blocker becomes `needs-info` + a comment + a `PushNotification`, and the chain
  continues.

## Open questions

Four, all in `.claude/vibe.md` under `## Needs you`, all reversible, none
blocking. **#128 added none and resolved none** — a version bump has no calls in
it. The count stands at four:

1. Whether the acrylic exception reaches any pane beyond the subagent viewer.
   Answer taken is the reversible one — **that pane only** — and it is enforced by
   two pins rather than good intentions, so a later leg that generalises it reds
   rather than drifts.
2. Whether `ultracode` / `auto` should be reachable at all.
3. What "background a session" should mean. #127 delivered the measurement and
   the call stayed open. Detach **fails** (closing the handle kills the CLI
   child); `background_tasks` is reachable but showed **no effect**. The one
   genuine candidate is **Remote Control** — reachable, probed `enabled: false`
   **only**, because enabling it bridges a live session to an external service and
   the owner is away. **That is the live part.** Nothing enabled, nothing built.
4. ~~That #123 ships as **refill rather than a true edit**~~ — taken, shipped and
   warranted (`f649f1d`); the record carries why a true edit is *impossible*
   rather than merely unchosen. Left listed because the owner asked for the edit
   by name and may want to revisit what the app should do instead.

**New, and not a decision anyone took:** 1.0.0 now reads on the repo while
nothing publishes. If the owner wants that to mean something — a tag, an
installer, a version readout — each is its own ticket with its own warrant. See
[[2026-08-06-one-point-oh-is-a-marker-and-the-lockfile-moves-with-it]].

## Recent context

Pruned to what can still bite. Detail for closed slices lives in their tickets,
commits and `decisions/`.

### Binds #129 directly

- **THE CLI NEVER ECHOES THE PROMPT BACK.** The only `type: 'user'` messages on
  the stream are **tool results**. Stamp your own `uuid`; the CLI stores the
  message under exactly that id.
- **`effort`, `model` and `enableFileCheckpointing` all ride `Options`, so all
  three bind at query CONSTRUCTION.** Changing one must rebuild the engine.
- **An event handler in main must not be able to throw** — Electron turns it into
  a modal error dialog over the app. `rewind_files` errors are in scope for this.
- **A renderer-side message edit cannot persist** — the pane is a projection of
  the CLI's file (#123). Rewind does not change that.

### Probe discipline — the batch's most transferable output

- **UNSCORED IS NOT REFUTED**, hit from six sides: #122's clipboard, #124's three
  instrument traps, #125's own verification harness, #126's halo control, and
  #127's two false positives.
- **A CONTROL CATCHES FALSE POSITIVES TOO.** #127's task backgrounding first
  scored EFFECTIVE off a 37s speed-up whose real cause was that **this machine's
  harness blocks standalone `sleep`** — it was measuring a hook. Its session
  detach first scored SURVIVED off a proof file written *before* the cut plus a
  witness watching **the newest transcript anywhere on the machine**. So: use a
  **node timer, never `sleep`**; assert the control **actually blocked**; check
  the artefact **before** the cut (present → UNSCORED, never a pass); scope any
  on-disk witness to the **session id**; use **absolute paths** in probe prompts.
- **THE THREE-WAY SUBTYPE COMPARISON, reusable verbatim and free.** On one warm
  handle: bogus subtype → `Unsupported control request subtype: …`; the
  candidate; the candidate with bad arguments. A **different** error means the
  dispatcher recognised the subtype and reached its own validator. That is how
  "no such route" is told from "route exists, switched off".
- **Probe by CALLING.** A declared wire type is not a callable route (#115); a
  callable route is not an effective one (#117); a negative claim needs
  **negative-shaped evidence** (#127).
- **Take a verdict from the parsed result, never the exit code** — an exit code
  conflates *the code failed* with *the harness failed*, the two outcomes a
  mutation run exists to separate. #125's runner produced **three confident false
  REDs** that way. **Any probe that installs something must read the installation
  back.**
- **A green suite is evidence about the code only if the runner is sound** —
  `git stash push -u && npm test` first.

### Standing repo traps

- **Stylesheets are read as raw TEXT by EIGHT tests**, three of which scan the
  whole `styles/` directory. No comment may contain a closing brace; no scrollbar
  rule may be component-scoped; **`base.css` warns that even NAMING the scrollbar
  pseudo-element in a comment trips the scan**; `.bubble` and `.message-input`
  stay ungrouped, and **`.bubble {` must stay the FIRST literal match of that
  string in `chat.css`** — `multiline-composer` slices from exactly it.
- **The app has exactly ONE `backdrop-filter` and its scope is pinned twice.**
  `gui-98` criterion 5c and `tests/subagent-material.test.ts` both scan every
  sheet in `styles/`. Extending glass anywhere reds both. `gui-98` criterion 5 is
  **positive** — do not soften it back to fix a red.
- **The `@import` order in `styles.css` IS the cascade** — add rules inside a
  file, never reorder. `markdown.css` may only author DESCENDANT rules.
- **Focus rings are picked per control, not applied.**
- **jsdom loads no CSS**, so a raw-text pin proves a rule was written, never that
  it works. Verify with a `run-desktop` driver.
- **`core.autocrlf` is `true`**: every blob is LF, the working tree is CRLF. New
  files need no hand-conversion. What bites is reading — **anything that reads a
  file from disk must expect `\r\n`**, and `/^## Heading$/m` matches nothing here.
- **ESM freezes every JS seam a driver might patch** — `sdk.query` cannot be
  monkey-patched (frozen namespace, silent no-op) and neither can
  `child_process.spawn`. The route that works is the OS: read the child's command
  line via `Win32_Process`. `ConvertTo-Json` over it is **not** safe — read
  tab-delimited with `[\x00-\x1F]` stripped.
- **`canUseTool` is NOT a control surface** (#116) — deny with `disallowedTools`.
- **`setBackgroundMaterial` has NO runtime whitelist** — `src/shared/backdrop.ts`'s
  compare-never-coerce guard is the only one. `src/shared/effort.ts` is the same
  pattern except it REJECTS rather than defaulting.
- Harness scripts importing `.ts` from `src/` need
  `node --experimental-strip-types` (Node 22.17). Use `fileURLToPath`, never
  `URL.pathname` — this repo's path contains a space. A script **outside** the
  repo cannot resolve the SDK by bare specifier; import by `pathToFileURL`.
- **Node 22 refuses to spawn a `.cmd`** (`EINVAL`). `node_modules/electron/dist/electron.exe`
  is a real exe.
- **Screenshots need the zoom factor** — `capturePage` takes window DIP,
  `getBoundingClientRect()` gives the ZOOMED page's CSS pixels. Normalise with
  `setZoomFactor(1)` before any pixel measurement.
  **`getComputedStyle(el, '::pseudo')` does not read that pseudo-element** in
  Chromium, and a pixel probe needs a positive control.
- **A value read behind a transition is not a settled one** (#123). **A driver's
  RED path must fail cleanly**, or it leaks the Electron process.
- **`gui-52`'s red is DOUBTFUL** and `gui-75` is focus-dependent — reproduce solo
  on clean `main` before believing either.
- Never hardcode a model name or an effort level list. Never read
  `~/.claude/daemon/roster.json`.

### Process

- **A loop body is an artefact of an earlier leg, not an instruction from the
  owner.** If `.claude/relay-leg.md` disagrees with the tracker or with
  [[pick-up]], **they win** — and fix that file in the wrap-up.
- **Never `git checkout <file>` to undo a mutation on uncommitted work** — it
  reverts to HEAD and drops every edit since the branch point.
- **Squash-merged ticket branches need `git branch -D`.**
- **`issue_dependencies_summary` is EVENTUALLY CONSISTENT.** Right after writing
  an edge it can read `blocked_by: 0` while the **list endpoint** already shows
  the blocker. Read the list endpoint, or read twice.
- **A version bump here touches TWO files** — `package-lock.json` is tracked and
  mirrors the version twice. Use `npm version <v> --no-git-tag-version`.

## Related

- [[overview]]
- [[pick-up]]
- [[decisions]]
- [[happy-path]]
- [[2026-08-06-one-point-oh-is-a-marker-and-the-lockfile-moves-with-it]]
- [[2026-08-06-the-address-is-carried-and-ignored-and-the-rewind-was-one-flag-away]]
