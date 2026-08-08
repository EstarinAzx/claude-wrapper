---
type: pick-up
project: claude-wrapper
updated: 2026-08-08
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## The queue is EMPTY — and this time there is NO OPEN ISSUE AT ALL

Confirm rather than trust this line — it has been wrong before, and the tracker
is eventually consistent enough that a single read can lie:

```text
gh issue list --state open --label ready-for-agent
gh issue list --state open
```

**Both come back empty, on two reads.** #130 landed as `ff2be52` and was closed.
Relay chain 4 was one leg long, which is what its own handoff predicted. Nothing
is in flight and no branch exists — `ticket/130-rewind-replayed` was
squash-merged and deleted.

This is a **harder** stop than chain 3's. Then, #130 sat open at `needs-triage`
as a candidate. Now the backlog is genuinely exhausted: the next unit of work has
to come from a human, because there is no ticket left to read.

**PUSHED 2026-08-08, on the owner's instruction.** They said "push it" after this
leg reported #130 sitting local. `origin/main` is now `3fe7798` — the triage
commit, #130, and the wrap-up: **3 commits, clean fast-forward**, nothing forced
and nothing clobbered.

**PUSHING is still not on a leg's own initiative.** That is now TWO explicit
one-offs (2026-08-06 and 2026-08-08), which is a pattern of the owner asking, not
a standing grant. A fresh unattended chain lands locally and says so. Read the
current gap rather than trusting a literal — it drifted three legs running the
last time a number was written down:
`git rev-list --count origin/main..main`.

## Landed this leg

**#130 — rewind a REPLAYED message.** `ff2be52` on `main`, squash-merged, branch
deleted, ticket closed.

The rewind control now appears on conversations you **reopen**, not only on
messages the pane sent in this session. `transcript.ts` carries each stored
line's own `uuid` through to `ChatMessage.rewindId`; the send path, the engine
and the IPC handler were untouched.

**The build was gated on a measurement, and the measurement is the valuable
half.** `scripts/spike-130-checkpoint-durability.mjs` (+ findings JSON), 7 turns:

- **A checkpoint outlives the process that made it** — a child process mutates a
  file and deliberately does NOT rewind, so it crosses the process boundary
  MUTATED; a later process resumes, reads the uuid off the stored transcript, and
  the file moves back. A **disk witness**, where #129 had only `filesChanged: 0`.
- **No expiry cliff inside 17 days** — 6 of 6 real sessions of this repo, aged 0
  to 17d, still rewindable (4–21 files each). Dry-run only, `git status` hashed
  before and after.
- **Rewindability tracks POSITION** — a message with file changes after it
  rewinds; one with nothing after it refuses. So the control is ungated.
- **Checkpointing costs ~0.5ms per backed-up file**, 9 bytes of store for a
  one-file turn. Per-turn latency stays UNSCORED, now with the noise band that
  says why.

New files: `scripts/spike-130-checkpoint-durability.mjs`,
`scripts/spike-130-findings.json`, `tests/transcript-rewind-real-store.test.ts`.
New decision:
`.context/decisions/2026-08-08-a-checkpoint-outlives-its-process-and-rewindability-tracks-position.md`.

## Baseline — READ IT, do not trust it

`main` = `ff2be52`. typecheck clean, build clean, **1295 tests / 85 files** — up
from 1277/84, which is #130's own 18 tests across 1 new file. The gate ran on the
branch and **again on `main` after the merge**.

## Pick up here

**There is no queued ticket and no open issue. That is the intended end state.**

A session arriving now has two honest options:

1. **Work an owner call.** Seven sit in `.claude/vibe.md` under `## Needs you` —
   four carried from chain 3, three added by the run that scoped #130. All
   reversible, all with a default already taken. The longest-standing live one is
   #127's Remote Control question.
2. **Bring new work.** The tracker is empty; a new spec starts at
   `/preset init` or `/preset vibe init`.

**Do not invent a ticket to restart the chain.** The stop condition is an empty
`ready-for-agent` frontier, and a leg filing its own follow-up at
`ready-for-agent` makes that condition unreachable by construction. This leg
surfaced two candidates and deliberately filed **neither** — they are recorded
below and in #130's closing comment instead.

## What #130 found but did NOT build

Both are recorded rather than ticketed, on purpose:

1. **Checkpoint retention beyond 17 days is UNMEASURED, not refuted.** Nothing on
   this machine is older. Note the trap that was avoided: `~/.claude/projects/`
   and `~/.claude/file-history/` bottom out on the **same date** (a `~/.claude`
   reset), and reading that as a retention window would be inventing a finding
   out of a coincidence.
2. **`parseTranscript` drops the `file-history-delta` lines.** Reading them would
   let the app know in advance which messages are rewindable and never show a
   refusal at all. Measured as unnecessary — the refusal is graceful, carries the
   CLI's own sentence, and lands exactly where there is nothing to undo — so this
   is polish, not a defect.

## The landmines this leg paid

- **AN EMPTY POPULATION IS AN INSTRUMENT FAILURE, AND MUST SAY SO.** The aged
  survey first returned "no aged session with a provable checkpoint", which reads
  exactly like "aged checkpoints are gone". The cause was reading `cwd` from
  **line 1** of each transcript — the first record is session metadata and
  carries no `cwd` at all. **UNSCORED IS NOT REFUTED**, now from an eighth side.
- **A VERDICT TEMPLATE WRITTEN BEFORE THE RUN CAN MISLABEL ITS OWN DATA.** The
  positional phase classified `accepted` + `canRewind: false` as "a harmless
  no-op". It is a **refusal** — the control renders an error note on that path —
  and the mislabel flattered the build.
- **A PROBE MUST BE ABLE TO ANSWER ITS OWN QUESTION.** That phase then picked the
  first session it found, whose only anchor sat at the front, so the decisive
  case (a message with an anchor *later*) never ran.
- **A WELL-FORMED WRONG VALUE PASSES EVERY SHAPE CHECK.** Carrying `parentUuid`
  instead of `uuid` survives `isMessageUuid` and every synthetic unit test,
  because `parentUuid` is itself a valid uuid on every user line. Caught **only**
  by `tests/transcript-rewind-real-store.test.ts`, which cross-checks the
  parser's output against the `snapshotMessageId` anchors in a real transcript.
- **A DISK WITNESS NEEDS THE DISK TO BE DIRTY WHEN YOU MEASURE.** #129's phase C
  could not have answered this question however carefully it was read.
- **A MULTI-LINE ANCHOR IN A MUTATION SCRIPT MUST EXPECT CRLF.** The first
  mutation silently matched nothing and the suite passed — which reads as "the
  test does not bite". `core.autocrlf` is `true` here.

## Landmines this repo keeps paying for

- **UNSCORED IS NOT REFUTED**, now from eight sides: #122's clipboard, #124's
  three instrument traps, #125's own verification harness, #126's halo control,
  #127's two false positives, #129's phase C, and #130's empty population.
- **AN UNAPPLIED MUTATION READS EXACTLY LIKE A CAUGHT ONE.** Hit again by #130.
  Take the verdict from the **parsed result**, never the exit code (#125's three
  false REDs).
- **A CONTROL CATCHES FALSE POSITIVES TOO** (#127's two saves). Use a node timer,
  never `sleep`; assert the control actually blocked; check the artefact
  **before** the cut; scope any on-disk witness to the session id; use
  **absolute paths** in probe prompts.
- **A DRY-RUN-ONLY SURVEY OF REAL DATA NEEDS A WITNESS THAT IT WAS DRY** (#130) —
  `git status` hashed before and after, asserted rather than assumed.
- **THE THREE-WAY COMPARISON, reusable verbatim and free.** Bogus subtype → the
  CLI's unknown-subtype refusal; the candidate; the candidate with bad arguments.
  A **different** error means the dispatcher recognised it. #129 applied it to
  **uuids**; #130 applied it to **positions**.
- **Probe by CALLING.** A declared wire type is not a callable route (#115); a
  callable route is not an effective one (#117); a negative claim needs
  negative-shaped evidence (#127).
- **The acrylic exception is ONE PANE** (#125). `gui-98` criterion 5c and
  `tests/subagent-material.test.ts` both red on a leak; criterion 5 is
  **positive** — do not soften it to fix a red.
- **An SVG length is in viewBox units, not CSS pixels** (#126), and the tint
  ladder cannot carry a structural line.
- **Screenshots need the zoom factor** — normalise with `setZoomFactor(1)`.
  **`getComputedStyle(el, '::pseudo')` does not read that pseudo-element** in
  Chromium; a pixel probe needs a positive control.
- **A value read behind a transition is not a settled one** (#123).
- **A driver's RED path must fail cleanly**, or it leaks the Electron process.

## Rewind, for whoever touches it next

- **`enableFileCheckpointing` is the whole switch**, and it rides `Options`, so
  it binds at query CONSTRUCTION.
- **A refusal is EITHER a throw OR `canRewind: false`** — two mechanisms, one
  user-visible fact, both folded into one `RewindResult`. `engine.rewindFiles`
  **never rejects**, because an `ipcMain.handle` rejection becomes a modal dialog
  over the app.
- **The checkpoint store is `~/.claude/file-history/<session-id>/<hash>@v1`**, and
  the transcript maps backups to messages with `type: "file-history-delta"` lines
  carrying `snapshotMessageId`. That is how #130 found ids that were provably
  checkpointed instead of guessing.
- **A resume needs the WORKSPACE as much as the id** — the store is keyed by
  project directory.
- **Gate every phase on the verdict of the phase whose handle it borrows.**

## Stylesheet rules that bind more than one slice

- **Stylesheets are read as raw TEXT by NINE tests** — `scrollbar.test.ts`,
  `theme.test.ts`, `multiline-composer.test.tsx`, `markdown-tables.test.tsx`,
  `code-copy.test.tsx`, `reuse-message.test.tsx`, `subagent-material.test.ts`,
  `agent-map-visual.test.ts` and `rewind-message.test.tsx`. **Three** scan the
  whole `styles/` directory. No comment may contain a closing brace; no scrollbar
  rule may be component-scoped; **`base.css` warns that even NAMING the scrollbar
  pseudo-element in a comment trips the scan**; `.bubble` and `.message-input`
  stay ungrouped, and **`.bubble {` must stay the FIRST literal match of that
  string in `chat.css`**.
- **The token names are `--fs-micro` and `--danger-text`** — there is no
  `--fs-meta` and no bare `--danger`. **jsdom loads no CSS**, so an unknown
  `var()` silently resolves to nothing and only the real window catches it.
  #130 added no CSS, which is why it needed no GUI driver.
- **`markdown.css` may only author DESCENDANT rules.** **The `@import` order in
  `styles.css` IS the cascade** — add rules inside a file, never reorder.
- **Focus rings are picked per control, not applied.**

## Still-live landmines from earlier legs

- **`canUseTool` is NOT a control surface** (#116) — deny with `disallowedTools`.
- **`setBackgroundMaterial` has NO runtime whitelist** — `src/shared/backdrop.ts`'s
  compare-never-coerce guard is the only one. `effort.ts` REJECTS rather than
  defaulting, `message-uuid.ts` **drops**, and `transcript.ts` (#130) drops the
  CLI's own on-disk uuid. Four sites, one family.
- **`model`, `effort`, `resume` AND `enableFileCheckpointing` all ride `Options`,
  so all four bind at query CONSTRUCTION.** A setter that only stores changes
  nothing.
- **ESM freezes every JS seam a driver might patch** — `sdk.query` and
  `child_process.spawn` both. The route that works is the OS: `Win32_Process`,
  read tab-delimited with `[\x00-\x1F]` stripped.
- **A renderer-side message edit cannot persist** — the pane is a projection of
  the CLI's file (#123). Rewind does not change that; it moves the disk.
- **An event handler in main must not be able to throw** — Electron turns it into
  a modal error dialog over the app.
- **A green suite is evidence about the code only if the runner is sound** —
  `git stash push -u && npm test` first, and mutate a new pin to prove it bites.
- **`gui-52`'s red is DOUBTFUL** and `gui-75` is focus-dependent; reproduce solo
  on clean `main` before believing either.
- Harness scripts importing `.ts` from `src/` need `node --experimental-strip-types`
  (Node 22.17) — **and that resolves no extensionless relative imports**, so a
  script cannot import `transcript.ts` (which imports `../shared/message-uuid`).
  #130 moved that check into vitest, which resolves TS natively. Use
  `fileURLToPath`, never `URL.pathname` — this repo's path contains a space.
- **Node 22 refuses to spawn a `.cmd`** (`EINVAL`). `node_modules/electron/dist/electron.exe`
  is a real exe.
- **`core.autocrlf` is `true`**: every blob is LF, the working tree is CRLF. New
  files need no hand-conversion. What bites is reading — **anything that reads a
  file from disk must expect `\r\n`**, and `/^## Heading$/m` matches nothing here.
- Never hardcode a model name or an effort level list. Never read
  `~/.claude/daemon/roster.json`.

## Process landmines

- **A loop body is an artefact of an earlier leg, not an instruction from the
  owner.** If `.claude/relay-leg.md` disagrees with the tracker or with this
  file, **they win**, and fix that file in your wrap-up.
- **Never `git checkout <file>` to undo a mutation on uncommitted work** — it
  reverts to HEAD and drops every edit since the branch point. #129 and #130 both
  kept their own backup copy instead.
- **Squash-merged ticket branches need `git branch -D`.**
- **`issue_dependencies_summary` is EVENTUALLY CONSISTENT** — read the
  `blocked_by` **list endpoint**, or read twice. The frontier query itself has
  returned a false empty; #130's leg read it twice before stopping the chain.
- **A version bump here touches TWO files** — `package-lock.json` is tracked and
  mirrors the version twice. `npm version <v> --no-git-tag-version`.

## Do not decide these

**Seven** open owner-calls live in `.claude/vibe.md` under `## Needs you` — four
carried from chain 3, **three added** by the `/preset vibe` run that scoped #130.
**#130 resolved none of them**, and took the recorded default on each of its
three:

1. one gated ticket rather than a spike plus a build — the measurement ran first
   either way, so nothing is lost by overturning it
2. no GUI driver mandated — none turned out to be needed, because #130 added no
   CSS and its facts about the CLI were measured by calling it directly
3. the leg wrote the blast-radius copy — "Reverts N files since this message"

**The longest-standing live one is still #127's:** whether the app may offer
**Remote Control**. Reachable, probed with `enabled: false` **only**, because
enabling it bridges a live session to an external service.

**Not calls, but waiting:** the repo reading 1.0.0 while nothing publishes.
`git tag` is still empty, there is no electron-builder config, and the post-bump
build emitted byte-identical asset hashes, so the version never enters the
bundle. A tag, an installer or a version readout is each its own ticket with its
own warrant.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[happy-path]]
- [[2026-08-08-a-checkpoint-outlives-its-process-and-rewindability-tracks-position]]
- [[2026-08-06-the-id-is-minted-where-the-bubble-is-and-the-store-is-keyed-by-directory]]
- [[2026-08-06-the-address-is-carried-and-ignored-and-the-rewind-was-one-flag-away]]
