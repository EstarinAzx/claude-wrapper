---
type: active-work
project: claude-wrapper
updated: 2026-08-08
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-08 by Opus 5, relay chain 4 leg 1 — the only leg, owner away_
_At commit: `ff2be52` on `main`_

## Current focus

**Nothing is in flight, relay chain 4 has stopped, and there is NO OPEN ISSUE.**

**#130** (rewind a REPLAYED message) landed as `ff2be52` and was the last — and
the only — ticket of chain 4. The frontier query comes back **empty on two
reads**, which is `ticket-loop`'s designed stop, and **no leg 2 was spawned**.

This is a harder stop than chain 3's. Then, #130 sat open at `needs-triage` as a
candidate a human could promote. Now the tracker is genuinely exhausted: the next
unit of work has to come from a person.

## State

- **In flight:** nothing. No ticket branch exists; `ticket/130-rewind-replayed`
  was squash-merged and deleted. Tree clean on `main`.
- **Closed 2026-08-05:** **#121** markdown tables (`ef6ef22`) · **#122** copy
  button (`a359f9f`) · **#123** message reuse (`f649f1d`) · **#124** effort
  control (`39c2896`) · **#125** viewer material (`c92fca7`) · **#126** map
  visual pass (`0628745`).
- **Closed 2026-08-06:** **#127** the three-route spike (`8a3481e`), **no `src/`
  diff** · **#128** version 1.0.0 (`024361a`) · **#120** the spec itself,
  delivered · **#129** rewind a turn's file changes (`e164d6c`).
- **Closed 2026-08-08:** **#130** rewind a REPLAYED message (`ff2be52`).
- **Open: NONE.** Not "none `ready-for-agent`" — none at all, on two reads.
- **Gate on `main`:** typecheck clean, build clean, **1295 tests / 85 files**.
  Ran on the branch and **again on `main` after the merge**. #130 moved the
  baseline 1277/84 → 1295/85, **+18 tests, +1 file**.
  **Read the number off `main`, never off this file.**
- **PUSHED 2026-08-08 on the owner's instruction** — they said "push it" after
  the leg reported the work sitting local. `origin/main` is now `3fe7798`: the
  triage commit, #130 itself, and this wrap-up, **3 commits, clean fast-forward**
  (0 behind at push time), nothing forced.
  **The rule is unchanged: a leg does not push on its own initiative.** This was
  a second explicit one-off, exactly like 2026-08-06 — two instructions, not a
  standing grant, and a fresh unattended chain still lands locally and says so.
  Read the gap rather than trusting this line:
  `git rev-list --count origin/main..main`.

## What #130 delivered, and why the measurement is the valuable half

The rewind control now appears on conversations you **reopen**, not only on
messages sent in the current session. The build itself was one field carried
through `transcript.ts` — the send path, the engine and the IPC handler were
untouched, exactly as the ticket predicted.

It was **gated** on measuring a premise nobody had checked: does a file
checkpoint still exist for a conversation reopened later? All green
(`scripts/spike-130-checkpoint-durability.mjs`, 7 turns):

- **A checkpoint outlives the process that made it.** A child process mutates a
  file and deliberately does NOT rewind, so it crosses the process boundary
  MUTATED; a later process resumes, reads the uuid off the **stored transcript**,
  and the file moves back. A **disk witness**, where #129 had only
  `filesChanged: 0` and an inference.
- **No expiry cliff inside 17 days.** 6 of 6 real sessions of this repo, aged 0
  to 17d, still rewindable (4–21 files each). Dry-run only, `git status` hashed
  before and after to prove nothing moved. Beyond 17d is **unmeasured, not
  refuted** — nothing on this machine is older.
- **Rewindability tracks POSITION, not per-message backups.** A message with file
  changes after it rewinds; one with nothing after it refuses, which is the right
  answer to "undo nothing". So the control is ungated — the smaller build and the
  honest one.
- **Checkpointing costs ~0.5ms per backed-up file**, 9 bytes of store for a
  one-file turn. Per-turn latency stays **UNSCORED, now with the noise band that
  says why**: the on/off difference is smaller than the spread within one arm and
  flips sign between runs.

Five mutations confirmed the new pins bite. The sharpest: carrying `parentUuid`
instead of `uuid` passes `isMessageUuid` and every synthetic unit test, because
it is itself a valid uuid on every user line — caught **only** by the new
real-store cross-check against the CLI's own `snapshotMessageId` anchors.

## Pick up here

**There is no queued ticket and no open issue. That is the intended end state.**

1. **Work an owner call.** **Seven** sit in `.claude/vibe.md` under
   `## Needs you` — four carried from chain 3, three added by the run that scoped
   #130. All reversible, all with a default already taken. The longest-standing
   live one is #127's Remote Control question.
2. **Bring new work.** The tracker is empty; a new spec starts at
   `/preset init` or `/preset vibe init`.

**Do not invent a ticket to restart the chain.** The stop condition is an empty
`ready-for-agent` frontier, and a leg filing its own follow-up there makes that
condition unreachable by construction. #130's leg surfaced two candidates and
filed **neither** — both are recorded in [[pick-up]] and in #130's closing
comment instead:

1. checkpoint retention beyond 17 days is unmeasured;
2. `parseTranscript` drops the `file-history-delta` lines, which could pre-empt
   the refusal entirely — measured as unnecessary, so polish rather than defect.

## Skills for next session

- **Do not push on your own initiative.** See State.
- **Do not apply `ready-for-human`** — the owner banned it for this batch. A
  blocker becomes `needs-info` + a comment + a `PushNotification`.
- The relay machinery is stopped, not broken. `.claude/relay/ticket-loop.md`
  carries `stop: true`. Re-running `/relay N=1 /preset ticket-loop` against it
  **re-inits** the chain — check the frontier first, or it spins a leg with
  nothing to do.

## Open questions

**Seven**, all in `.claude/vibe.md` under `## Needs you`, all reversible, none
blocking. **#130 added none and resolved none** — it took the recorded default on
each of its three and left them open:

1. Whether the acrylic exception reaches any pane beyond the subagent viewer.
   Answer taken is the reversible one — **that pane only** — enforced by two pins
   rather than good intentions.
2. Whether `ultracode` / `auto` should be reachable at all.
3. What "background a session" should mean. **The live one.** Detach **fails**
   (closing the handle kills the CLI child); `background_tasks` is reachable but
   showed **no effect**. The one genuine candidate is **Remote Control** —
   reachable, probed `enabled: false` **only**, because enabling it bridges a
   live session to an external service and the owner is away.
4. ~~That #123 ships as **refill rather than a true edit**~~ — taken, shipped and
   warranted (`f649f1d`); the record carries why a true edit is *impossible*
   rather than merely unchosen.
5. **Does #130 ship as ONE ticket or a spike plus a build?** Taken: one gated
   ticket. Nothing was lost either way — the measurement ran first under both
   readings, and it came back green.
6. **Is a GUI driver mandatory for #130's acceptance?** Taken: not mandated. None
   turned out to be needed — #130 added no CSS (the one thing jsdom cannot see)
   and its facts about the CLI were measured by calling it directly.
7. **What should the blast-radius confirmation SAY?** Taken: the leg wrote it —
   "Reverts N files since this message". The counts were already there from #129;
   the scope was what was missing.

**Not calls, but waiting:** 1.0.0 reading on the repo while nothing publishes.
`git tag` is still empty, there is no electron-builder config, and the post-bump
build emitted byte-identical asset hashes, so the version never enters the
bundle. A tag, an installer or a version readout is each its own ticket with its
own warrant — do not build one off the number being on a remote.

## Recent context

Pruned to what can still bite. Detail for closed slices lives in their tickets,
commits and `decisions/`.

### From #130, and the sharpest of them are instrument failures

- **AN EMPTY POPULATION IS AN INSTRUMENT FAILURE AND MUST SAY SO.** The aged
  survey first returned "no aged session with a provable checkpoint", which reads
  exactly like "aged checkpoints are gone" — a refutation it had no standing to
  make. The cause was reading `cwd` from **line 1** of each transcript, where the
  first record is session metadata and carries no `cwd` at all. The verdicts now
  distinguish "no project matched" and "no session had an anchor" from a real
  refusal.
- **A VERDICT TEMPLATE WRITTEN BEFORE THE RUN CAN MISLABEL ITS OWN DATA.** The
  positional phase classified `accepted` + `canRewind: false` as "a harmless
  no-op". It is a **refusal** — the control renders an error note on that path.
  The mislabel ran in the direction that flattered the build.
- **A PROBE MUST BE ABLE TO ANSWER ITS OWN QUESTION.** That phase then took the
  first session it found, whose only anchor sat at the front, so the decisive
  case — a message with an anchor *later* — never ran and the verdict came back
  MIXED.
- **A WELL-FORMED WRONG VALUE PASSES EVERY SHAPE CHECK.** `parentUuid` is a valid
  uuid on every user line, so carrying it instead of `uuid` survives
  `isMessageUuid` and every synthetic unit test. Only a cross-check against the
  CLI's own `snapshotMessageId` anchors in a **real** transcript catches it —
  synthetic lines cannot corroborate a claim about the real store.
- **A DISK WITNESS NEEDS THE DISK TO BE DIRTY WHEN YOU MEASURE.** #129's phase C
  could not have answered this question however carefully it was read, because
  its file was already back at ORIGINAL. Leaving the mutation in place across the
  process boundary is what turned an inference into a measurement.
- **A DRY-RUN-ONLY SURVEY OF THE OPERATOR'S REAL DATA NEEDS A WITNESS THAT IT WAS
  DRY** — `git status` hashed before and after, asserted rather than assumed.
- **TWO STORES BOTTOMING OUT ON THE SAME DATE IS A RESET, NOT A RETENTION
  WINDOW.** `~/.claude/projects/` and `~/.claude/file-history/` both start
  2026-07-09; reading that as checkpoint expiry would have invented a finding out
  of a coincidence.
- **`--experimental-strip-types` RESOLVES NO EXTENSIONLESS RELATIVE IMPORTS**, so
  a spike cannot import `transcript.ts` (which imports `../shared/message-uuid`).
  #130 moved that check into vitest, which resolves TS natively — and it belonged
  in the suite anyway.
- **The checkpoint store is `~/.claude/file-history/<session-id>/<hash>@v1`**, and
  the transcript maps backups to messages with `type: "file-history-delta"` lines
  carrying `snapshotMessageId`. That is how ids that were *provably* checkpointed
  were found instead of guessed.

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
  CRLF. Re-run, not counted. **#130 hit the identical trap** on its first
  mutation: the anchor silently matched nothing and the suite passed green, which
  reads as "the new test does not bite".
- **A REFUSAL CAN BE A THROW.** `rewindFiles` with an id that has no checkpoint
  **rejects** (`No file checkpoint found for this message.`), while
  checkpointing-off answers `canRewind: false` in the body. Two mechanisms, one
  user-visible fact — and #130 observed **both** in the wild for the same
  condition. An `ipcMain.handle` that lets either escape gets a modal error
  dialog over the app.
- **`enableFileCheckpointing` joins `model`, `effort` and `resume` on `Options`**
  — all four bind at query CONSTRUCTION.
- **The tokens are `--fs-micro` and `--danger-text`.** There is no `--fs-meta` and
  no bare `--danger`. #129 wrote both wrong first, and only the real window could
  catch it: jsdom loads no CSS and an unknown `var()` resolves silently to
  nothing.

### Probe discipline — the batch's most transferable output

- **UNSCORED IS NOT REFUTED**, hit from eight sides: #122's clipboard, #124's
  three instrument traps, #125's own verification harness, #126's halo control,
  #127's two false positives, #129's phase C, and #130's empty population.
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
  recognised it. #129 applied the same shape to **uuids** rather than subtypes;
  #130 applied it to **positions** — anchor, pre-anchor, post-anchor.
- **Probe by CALLING.** A declared wire type is not a callable route (#115); a
  callable route is not an effective one (#117); a negative claim needs
  **negative-shaped evidence** (#127).
- **Take a verdict from the parsed result, never the exit code** — an exit code
  conflates *the code failed* with *the harness failed*, the two outcomes a
  mutation run exists to separate. #125's runner produced **three confident false
  REDs** that way. #130 applied it across a process boundary: the parent gates on
  the child's **parsed handoff**, never on `child.status`. **Any probe that
  installs something must read the installation back.**
- **A green suite is evidence about the code only if the runner is sound** —
  `git stash push -u && npm test` first, and mutate a new pin to prove it bites.

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
  it works. Verify with a `run-desktop` driver. #130 needed none because it added
  no CSS at all — that is the test for whether a driver is owed.
- **A value read behind a transition is not a settled one** (#123) — `gui-129`
  waits 500ms after `hover()` before reading opacity for exactly this reason.
  **A driver's RED path must fail cleanly**, or it leaks the Electron process.
- **`core.autocrlf` is `true`**: every blob is LF, the working tree is CRLF. New
  files need no hand-conversion. What bites is reading — **anything that reads a
  file from disk must expect `\r\n`**, `/^## Heading$/m` matches nothing here, and
  a multi-line string anchor in a script must expect it too (#129 and #130 both
  paid this one).
- **ESM freezes every JS seam a driver might patch** — `sdk.query` cannot be
  monkey-patched (frozen namespace, silent no-op) and neither can
  `child_process.spawn`. The route that works is the OS: read the child's command
  line via `Win32_Process`. `ConvertTo-Json` over it is **not** safe — read
  tab-delimited with `[\x00-\x1F]` stripped.
- **`canUseTool` is NOT a control surface** (#116) — deny with `disallowedTools`.
- **`setBackgroundMaterial` has NO runtime whitelist** — `src/shared/backdrop.ts`'s
  compare-never-coerce guard is the only one. `src/shared/effort.ts` is the same
  pattern except it REJECTS rather than defaulting; `src/shared/message-uuid.ts`
  (#129) **drops** rather than coercing; and `src/main/transcript.ts` (#130) is
  the fourth site, applying that guard to the CLI's **own** on-disk uuid, because
  being the CLI's value earns it no exemption at a trust boundary.
- Harness scripts importing `.ts` from `src/` need
  `node --experimental-strip-types` (Node 22.17) — **and it resolves no
  extensionless relative imports**, so a script cannot import a module that has
  any. Use `fileURLToPath`, never `URL.pathname` — this repo's path contains a
  space. A script **outside** the repo cannot resolve the SDK by bare specifier;
  import by `pathToFileURL`.
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
  reverts to HEAD and drops every edit since the branch point. #129's and #130's
  mutation runs kept their own backup copy instead.
- **Squash-merged ticket branches need `git branch -D`.**
- **`issue_dependencies_summary` is EVENTUALLY CONSISTENT.** Right after writing
  an edge it can read `blocked_by: 0` while the **list endpoint** already shows
  the blocker. Read the list endpoint, or read twice. **The frontier query itself
  has returned a false empty** — the run that scoped #130 hit it, so #130's leg
  read it twice before stopping the chain.
- **A version bump here touches TWO files** — `package-lock.json` is tracked and
  mirrors the version twice. Use `npm version <v> --no-git-tag-version`.

## Related

- [[overview]]
- [[pick-up]]
- [[decisions]]
- [[happy-path]]
- [[2026-08-08-a-checkpoint-outlives-its-process-and-rewindability-tracks-position]]
- [[2026-08-06-the-id-is-minted-where-the-bubble-is-and-the-store-is-keyed-by-directory]]
- [[2026-08-06-one-point-oh-is-a-marker-and-the-lockfile-moves-with-it]]
- [[2026-08-06-the-address-is-carried-and-ignored-and-the-rewind-was-one-flag-away]]
