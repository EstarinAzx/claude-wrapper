---
type: active-work
project: claude-wrapper
updated: 2026-08-06
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-06 by Opus 5, relay chain 3 leg 9 — the final leg, owner away_
_At commit: `e164d6c` on `main`_

## Current focus

**Nothing is in flight, and relay chain 3 has stopped.**

**#129** (rewind a turn's file changes) landed as `e164d6c` and was the last
ticket. The frontier query comes back **empty**, which is `ticket-loop`'s
designed stop: `.claude/relay/relay-leg.md` carries `stop: true` and **no leg 10
was spawned**.

**Chain 3 is complete.** Nine legs, tickets **#121–#129**, spec **#120**
delivered and closed on leg 8, every leg gate-green, one ticket per leg, zero
human touches.

## State

- **In flight:** nothing. No ticket branch exists; `ticket/129-rewind-files` was
  squash-merged and deleted. Tree clean on `main`.
- **Closed 2026-08-05:** **#121** markdown tables (`ef6ef22`) · **#122** copy
  button (`a359f9f`) · **#123** message reuse (`f649f1d`) · **#124** effort
  control (`39c2896`) · **#125** viewer material (`c92fca7`) · **#126** map
  visual pass (`0628745`).
- **Closed 2026-08-06:** **#127** the three-route spike (`8a3481e`), **no `src/`
  diff** · **#128** version 1.0.0 (`024361a`) · **#120** the spec itself,
  delivered · **#129** rewind a turn's file changes (`e164d6c`).
- **Open:** **#130** only, and it is **`needs-triage` on purpose** — a candidate
  filed by #129's leg for the owner, not queued work. Labelling it
  `ready-for-agent` is what restarts an unattended chain; that is the owner's
  call.
- **Gate on `main`:** typecheck clean, build clean, **1277 tests / 84 files**.
  Ran on the branch and **again on `main` after the merge**. Chain 3 moved the
  baseline 1122/74 → 1277/84, **+155 tests, +10 files**.
  **Read the number off `main`, never off this file.**
- **`origin/main` is many commits behind, deliberately.** The count is **not
  recorded here on purpose** — every wrap-up commit increments it, so any literal
  is stale the moment it is written, and it drifted three legs running before
  this stopped. Read it: `git rev-list --count origin/main..main`. Chains 2 and 3
  landed every leg locally and pushed nothing — pushing is outward-facing and the
  owner has not asked for it. **This is the first thing to raise when they are
  back.**

## Pick up here

**There is no queued ticket, and that is the intended end state, not a gap.**

A session arriving now has three honest options, in order:

1. **Report to the owner.** The unpushed local history is the headline: two full
   chains of work exist only on this machine. Nothing about it is broken — it was
   never pushed because pushing is outward-facing — but it is the decision that
   has been waiting longest.
2. **Work an owner call.** Four sit in `.claude/vibe.md` under `## Needs you`,
   all reversible, all with a default already taken. The live one is #127's
   Remote Control question.
3. **Triage #130.** It has the shape and the measurement already; it needs a
   `ready-for-agent` from a human before anything builds it.

**Do not relabel #130 to restart the chain.** The stop condition is an empty
`ready-for-agent` frontier, and a leg promoting its own follow-up would make that
condition unreachable by construction.

## Skills for next session

- **Do not push.** See State.
- **Do not apply `ready-for-human`** — the owner banned it for this batch. A
  blocker becomes `needs-info` + a comment + a `PushNotification`.
- The relay machinery is stopped, not broken. Re-running `/relay N=1 read and
  follow .claude/relay-leg.md` against a `stop: true` file **re-inits** the chain
  — check the frontier first, or it will spin a leg with nothing to do.

## Open questions

Four, all in `.claude/vibe.md` under `## Needs you`, all reversible, none
blocking. **#129 added none and resolved none.** The count stands at four:

1. Whether the acrylic exception reaches any pane beyond the subagent viewer.
   Answer taken is the reversible one — **that pane only** — enforced by two pins
   rather than good intentions, so a later leg that generalises it reds rather
   than drifts.
2. Whether `ultracode` / `auto` should be reachable at all.
3. What "background a session" should mean. #127 delivered the measurement and
   the call stayed open. Detach **fails** (closing the handle kills the CLI
   child); `background_tasks` is reachable but showed **no effect**. The one
   genuine candidate is **Remote Control** — reachable, probed `enabled: false`
   **only**, because enabling it bridges a live session to an external service
   and the owner is away. **That is the live part.** Nothing enabled, nothing
   built.
4. ~~That #123 ships as **refill rather than a true edit**~~ — taken, shipped and
   warranted (`f649f1d`); the record carries why a true edit is *impossible*
   rather than merely unchosen. Left listed because the owner asked for the edit
   by name and may want to revisit what the app should do instead.

**Not calls, but waiting:** the unpushed history; 1.0.0 reading on the repo while
nothing publishes; and **#130**, filed `needs-triage` precisely so a leg does not
take it.

## Recent context

Pruned to what can still bite. Detail for closed slices lives in their tickets,
commits and `decisions/`.

### From #129, and the sharpest of them is a process failure

- **A GATE ON ONE PHASE DOES NOT PROTECT THE PHASE THAT REUSES ITS HANDLE.** The
  spike's phase B resumed from a **fresh temp directory**; the CLI's session store
  is keyed by **project directory**, so the lookup died with `No conversation
  found with session ID` — a perfect id in the wrong place. Phase B's positive
  control caught it and scored `UNSCORED`. **Phase C had no gate**, read the same
  dead handle, and answered a confident "NO, the rewind control must be withdrawn
  on an engine rebuild" — which, believed, ships a control that vanishes on every
  model pick for a reason that was never true. **A resume needs the WORKSPACE as
  much as the id.**
- **AN UNAPPLIED MUTATION READS EXACTLY LIKE A CAUGHT ONE.** One of #129's eight
  mutations reported `ANCHOR NOT FOUND` — a multi-line anchor missed this repo's
  CRLF. Re-run, not counted.
- **A REFUSAL CAN BE A THROW.** `rewindFiles` with an id that has no checkpoint
  **rejects** (`No file checkpoint found for this message.`), while
  checkpointing-off answers `canRewind: false` in the body. Two mechanisms, one
  user-visible fact. An `ipcMain.handle` that lets either escape gets a modal
  error dialog over the app.
- **`enableFileCheckpointing` joins `model`, `effort` and `resume` on `Options`**
  — all four bind at query CONSTRUCTION.
- **The tokens are `--fs-micro` and `--danger-text`.** There is no `--fs-meta` and
  no bare `--danger`. #129 wrote both wrong first, and only the real window could
  catch it: jsdom loads no CSS and an unknown `var()` resolves silently to
  nothing.

### Probe discipline — the batch's most transferable output

- **UNSCORED IS NOT REFUTED**, hit from seven sides: #122's clipboard, #124's
  three instrument traps, #125's own verification harness, #126's halo control,
  #127's two false positives, and #129's phase C.
- **A CONTROL CATCHES FALSE POSITIVES TOO.** #127's task backgrounding first
  scored EFFECTIVE off a 37s speed-up whose real cause was that **this machine's
  harness blocks standalone `sleep`** — it was measuring a hook. Its session
  detach first scored SURVIVED off a proof file written *before* the cut plus a
  witness watching **the newest transcript anywhere on the machine**. So: use a
  **node timer, never `sleep`**; assert the control **actually blocked**; check
  the artefact **before** the cut (present → UNSCORED, never a pass); scope any
  on-disk witness to the **session id**; use **absolute paths** in probe prompts.
- **THE THREE-WAY COMPARISON, reusable verbatim and free.** On one warm handle:
  bogus subtype → `Unsupported control request subtype: …`; the candidate; the
  candidate with bad arguments. A **different** error means the dispatcher
  recognised it. #129 applied the same shape to **uuids** rather than subtypes.
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

- **Stylesheets are read as raw TEXT by NINE tests**, three of which scan the
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
- **A value read behind a transition is not a settled one** (#123) — `gui-129`
  waits 500ms after `hover()` before reading opacity for exactly this reason.
  **A driver's RED path must fail cleanly**, or it leaks the Electron process.
- **`core.autocrlf` is `true`**: every blob is LF, the working tree is CRLF. New
  files need no hand-conversion. What bites is reading — **anything that reads a
  file from disk must expect `\r\n`**, `/^## Heading$/m` matches nothing here, and
  a multi-line string anchor in a script must expect it too.
- **ESM freezes every JS seam a driver might patch** — `sdk.query` cannot be
  monkey-patched (frozen namespace, silent no-op) and neither can
  `child_process.spawn`. The route that works is the OS: read the child's command
  line via `Win32_Process`. `ConvertTo-Json` over it is **not** safe — read
  tab-delimited with `[\x00-\x1F]` stripped.
- **`canUseTool` is NOT a control surface** (#116) — deny with `disallowedTools`.
- **`setBackgroundMaterial` has NO runtime whitelist** — `src/shared/backdrop.ts`'s
  compare-never-coerce guard is the only one. `src/shared/effort.ts` is the same
  pattern except it REJECTS rather than defaulting; `src/shared/message-uuid.ts`
  (#129) is the third and **drops** rather than coercing.
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
- **`gui-52`'s red is DOUBTFUL** and `gui-75` is focus-dependent — reproduce solo
  on clean `main` before believing either.
- Never hardcode a model name or an effort level list. Never read
  `~/.claude/daemon/roster.json`.

### Process

- **A loop body is an artefact of an earlier leg, not an instruction from the
  owner.** If `.claude/relay-leg.md` disagrees with the tracker or with
  [[pick-up]], **they win** — and fix that file in the wrap-up.
- **Never `git checkout <file>` to undo a mutation on uncommitted work** — it
  reverts to HEAD and drops every edit since the branch point. #129's mutation
  runner kept its own backup copy instead.
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
- [[2026-08-06-the-id-is-minted-where-the-bubble-is-and-the-store-is-keyed-by-directory]]
- [[2026-08-06-one-point-oh-is-a-marker-and-the-lockfile-moves-with-it]]
- [[2026-08-06-the-address-is-carried-and-ignored-and-the-rewind-was-one-flag-away]]
