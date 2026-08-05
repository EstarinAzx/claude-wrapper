---
type: pick-up
project: claude-wrapper
updated: 2026-08-06
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## The queue is EMPTY and relay chain 3 has stopped

Confirm rather than trust this line — it has been wrong before:

```text
gh issue list --state open --label ready-for-agent
```

**It comes back empty.** #129 landed as `e164d6c` and was the last ticket; the
relay state file `.claude/relay/relay-leg.md` carries `stop: true` and **no leg
10 was spawned**. Nothing is in flight and no branch exists.

**One open issue remains and it is deliberately NOT `ready-for-agent`:**
**#130** (rewind a REPLAYED message), `needs-triage`, filed by #129's own leg as
a candidate for the owner rather than queued work. Labelling it
`ready-for-agent` is what would restart an unattended chain on a feature choice
nobody asked for — that is the owner's call, not a leg's.

**Do not push.** `origin/main` is many commits behind. **The count is
deliberately not written here** — every wrap-up commit increments it, so any
literal is stale the moment it is written, and it drifted three legs running
before this stopped. Read it: `git rev-list --count origin/main..main`. Chains
2 and 3 landed every leg locally and pushed nothing, because pushing is
outward-facing and the owner has not asked for it. **This is the first thing to
raise when they are back.**

## Landed last leg

**#129 — rewind a turn's file changes.** `e164d6c` on `main`, squash-merged,
branch deleted, ticket closed. **Chain 3 is complete: legs 1–9, tickets
#121–#129, spec #120 delivered and closed on leg 8, every leg gate-green.**

Every user message the pane sends now carries the id the CLI stores it under,
and a control beside it restores the workspace's tracked **files** to their
state at that message. Two gestures: `dryRun: true` reports the counts and
provably leaves the disk alone, then a deliberate second click commits. Files
only — the conversation is untouched, and a test asserts that vocabulary rather
than a comment promising it.

New files: `src/shared/message-uuid.ts`, `tests/rewind-files.test.ts`,
`tests/rewind-message.test.tsx`, `scripts/spike-129-rewind-resume.mjs` (+
findings), `.claude/skills/run-desktop/gui-129.mjs`.
New decision:
`.context/decisions/2026-08-06-the-id-is-minted-where-the-bubble-is-and-the-store-is-keyed-by-directory.md`.

## Baseline — READ IT, do not trust it

`main` = `e164d6c`. typecheck clean, build clean, **1277 tests / 84 files** —
up from 1246/82, which is #129's own 31 tests across 2 files. The gate ran on
the branch and **again on `main` after the merge**.

Chain 3 moved the baseline 1122/74 → 1277/84 overall.

## What #129 measured, for whoever touches rewind next

All three came back green with their controls holding
(`scripts/spike-129-findings.json`, 2 turns):

- **The DECLARED method works.** `q.rewindFiles(id, {dryRun})` (sdk.d.ts:2488)
  from this app's exact option shape returned the file to its pre-turn contents.
  #127 had only ever called the raw wire route underneath it, and a declared type
  is not a callable route (#115) — so the build uses the typed method.
- **Rewind survives a RESUME**, which is the ordinary path here: reopening a
  session is how this app continues a conversation.
- **A rebuilt query recognises the PREVIOUS query's message id.** Not in the
  ticket and nobody had noticed it — main discards the engine on a model pick, a
  permission cycle and a backend flip while the pane keeps its messages, so a
  control on a message routinely outlives the query that sent it. A "no" would
  have forced the control to withdraw on every rebuild.
- **A refusal is a THROW**, not a `canRewind: false`, when the id has no
  checkpoint (`No file checkpoint found for this message.`). Checkpointing-off is
  the other mechanism and answers in the body. Both are folded into one
  `RewindResult`; `engine.rewindFiles` **never rejects**, because an
  `ipcMain.handle` rejection becomes a modal dialog over the app.
- **The runtime cost of checkpointing is UNSCORED**, deliberately — turn wall
  time is dominated by model latency. Measuring it needs a fixed local workload
  with no model in the loop. Folded into #130.

## The landmine this leg paid, and it is the oldest one

**A gate on one phase does not protect the phase that reuses its handle.**

The spike's first run resumed from a **fresh temp directory**. The CLI's session
store is keyed by **project directory**, so the lookup failed with `No
conversation found with session ID` — a perfect id in the wrong place. Phase B
scored `UNSCORED` correctly (its positive control caught it); **phase C had no
gate**, read the same dead handle, and answered a confident "NO, a rewind
control must be withdrawn when the engine is rebuilt". Believed, that ships a
control that vanishes on every model pick for a reason that was never true.

Two things transfer:

- **A resume needs the WORKSPACE as much as the id.** Run the harness in the
  directory the session belongs to.
- **Gate every phase on the verdict of the phase whose handle it borrows**, not
  just on its return value.

## Landmines this repo keeps paying for

- **UNSCORED IS NOT REFUTED**, now hit from seven sides: #122's clipboard, #124's
  three instrument traps, #125's own verification harness, #126's halo control,
  #127's two false positives, and #129's phase C.
- **AN UNAPPLIED MUTATION READS EXACTLY LIKE A CAUGHT ONE.** #129's runner
  reported `ANCHOR NOT FOUND` on one mutation because a multi-line anchor missed
  this repo's CRLF. It was **re-run**, not counted. Take the verdict from the
  **parsed result**, never the exit code (#125's three false REDs).
- **A CONTROL CATCHES FALSE POSITIVES TOO** (#127's two saves). Use a node timer,
  never `sleep`; assert the control actually blocked; check the artefact
  **before** the cut; scope any on-disk witness to the session id; use
  **absolute paths** in probe prompts.
- **THE THREE-WAY COMPARISON, reusable verbatim and free.** Bogus subtype → the
  CLI's unknown-subtype refusal; the candidate; the candidate with bad arguments.
  A **different** error means the dispatcher recognised it. #129 applied the same
  shape to **uuids** rather than subtypes.
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
- **A value read behind a transition is not a settled one** (#123) — `gui-129`
  waits 500ms after `hover()` before reading opacity for exactly this reason.
- **A driver's RED path must fail cleanly**, or it leaks the Electron process.

## Stylesheet rules that bind more than one slice

- **Stylesheets are read as raw TEXT by NINE tests** — `scrollbar.test.ts`,
  `theme.test.ts`, `multiline-composer.test.tsx`, `markdown-tables.test.tsx`,
  `code-copy.test.tsx`, `reuse-message.test.tsx`, `subagent-material.test.ts`,
  `agent-map-visual.test.ts` and now `rewind-message.test.tsx`. **Three** scan
  the whole `styles/` directory. No comment may contain a closing brace; no
  scrollbar rule may be component-scoped; **`base.css` warns that even NAMING the
  scrollbar pseudo-element in a comment trips the scan**; `.bubble` and
  `.message-input` stay ungrouped, and **`.bubble {` must stay the FIRST literal
  match of that string in `chat.css`**.
- **The token names are `--fs-micro` and `--danger-text`** — there is no
  `--fs-meta` and no bare `--danger`. #129 wrote both wrong first; nothing but
  the real window would have caught it, since jsdom loads no CSS and an unknown
  `var()` silently resolves to nothing.
- **`markdown.css` may only author DESCENDANT rules.** **The `@import` order in
  `styles.css` IS the cascade** — add rules inside a file, never reorder.
- **Focus rings are picked per control, not applied.**
- **jsdom loads no CSS.** A raw-text pin proves a rule was written, never that it
  works.

## Still-live landmines from earlier legs

- **`canUseTool` is NOT a control surface** (#116) — deny with `disallowedTools`.
- **`setBackgroundMaterial` has NO runtime whitelist** — `src/shared/backdrop.ts`'s
  compare-never-coerce guard is the only one. `src/shared/effort.ts` is the same
  pattern except it REJECTS rather than defaulting, and `src/shared/message-uuid.ts`
  (#129) is the third: it **drops** rather than coercing.
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
  `git stash push -u && npm test` first.
- **`gui-52`'s red is DOUBTFUL** and `gui-75` is focus-dependent; reproduce solo
  on clean `main` before believing either.
- Harness scripts importing `.ts` from `src/` need `node --experimental-strip-types`
  (Node 22.17). Use `fileURLToPath`, never `URL.pathname` — this repo's path
  contains a space.
- **Node 22 refuses to spawn a `.cmd`** (`EINVAL`). `node_modules/electron/dist/electron.exe`
  is a real exe.
- **`core.autocrlf` is `true`**: every blob is LF, the working tree is CRLF. New
  files need no hand-conversion. What bites is reading — **anything that reads a
  file from disk must expect `\r\n`**, and `/^## Heading$/m` matches nothing here.
  A multi-line string anchor in a script must expect it too (#129's mutation).
- Never hardcode a model name or an effort level list. Never read
  `~/.claude/daemon/roster.json`.

## Process landmines

- **A loop body is an artefact of an earlier leg, not an instruction from the
  owner.** If `.claude/relay-leg.md` disagrees with the tracker or with this
  file, **they win**, and fix that file in your wrap-up.
- **Never `git checkout <file>` to undo a mutation on uncommitted work** — it
  reverts to HEAD and drops every edit since the branch point. #129's mutation
  runner kept its own backup copy instead.
- **Squash-merged ticket branches need `git branch -D`.**
- **`issue_dependencies_summary` is EVENTUALLY CONSISTENT** — read the
  `blocked_by` **list endpoint**, or read twice.
- **A version bump here touches TWO files** — `package-lock.json` is tracked and
  mirrors the version twice. `npm version <v> --no-git-tag-version`.

## Do not decide these

Four open owner-calls live in `.claude/vibe.md` under `## Needs you`. **#129
added none and resolved none.** The count stands at four.

**The live one is still #127's:** whether the app may offer **Remote Control**.
It is the only measured route that could mean "the CLI keeps working while this
UI detaches", it is **reachable**, and it was probed with `enabled: false`
**only** — enabling it bridges a live session to an external service, which is
outward-facing, and the owner is away. Nothing was enabled and nothing built.

**Not calls, but waiting for the owner:** the unpushed local history (see the top
of this file), the repo reading 1.0.0 while nothing publishes, and **#130**,
which is `needs-triage` precisely so a leg does not take it.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[happy-path]]
- [[2026-08-06-the-id-is-minted-where-the-bubble-is-and-the-store-is-keyed-by-directory]]
- [[2026-08-06-one-point-oh-is-a-marker-and-the-lockfile-moves-with-it]]
- [[2026-08-06-the-address-is-carried-and-ignored-and-the-rewind-was-one-flag-away]]
