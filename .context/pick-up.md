---
type: pick-up
project: claude-wrapper
updated: 2026-07-28
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## This leg landed

Two tickets, both from an owner bug report mid-session — the same door #51 came
through. One sentence covers both: **the app was stating the model instead of
asking the CLI for it.**

### #53 — the picker list comes from the CLI (`cde78c4`)

The dropdown was `FAMILIES = ['opus','sonnet','haiku','fable']` plus a
`wisp routing --json` shell-out. The CLI's own `supportedModels()` advertises
**fourteen rows**. The app showed four, one of which (`fable`) the CLI never
advertised at all.

- **Never hardcode a model name.** A hand-maintained mirror cannot notice the
  original moving, and this one didn't. Two tests pin the **absence** of a
  list-building surface in `model-mode.ts`, because a re-added constant would
  fail no behavioural test — it would just be quietly wrong again.
- Deleted with it: `parseAliases`, the shell-out (**the app's only
  `child_process` use**), and `ModelOption.group` — the family/alias split only
  existed because the app built the list.
- `id` is the row's `value`, **never** its `resolvedModel`. One engine test
  kills that substitution specifically.
- Accepted: with no live query the menu is empty rather than four families —
  the contract `listCommands()` already had.

### #52 — the pill follows the CLI (`144646c`, + `c2a3ec3`)

`/model` is typed into the composer and never touches the pill; the SDK has no
model-changed message (the whole `SDKMessage` union was checked). The pill now
reads `init.model` and each assistant message's `message.model`.

Three things are load-bearing:

- **`picked` and `reported` are separate fields.** A pick is the row's value
  (`opus[1m]`); a report is a resolved id (`claude-opus-5`). Only `picked`
  reaches `options.model` — a resolved id there is the #23 hang, and it surfaces
  on the *next engine rebuild*, far from the assignment. Merging them kills one
  test and nothing else.
- **Delivery is an injected callback, not an `EngineEvent`.** `emit()` only
  reaches `activeOnEvent`, null outside a turn, and `init` arrives during
  `warmUp()`. As an event it would be dropped in exactly the case it exists for.
- **Timing, measured not assumed:** the pill does **not** move on the `/model`
  command itself — that returns synthetic output, deliberately not a model
  report — but on the next real turn. Don't re-file that as a bug.

`c2a3ec3` then added `modelLabel()`, because the two commits above made the pill
print `claude-haiku-4-5-20251001` instead of "Haiku". Match order is exact id →
exact `resolvedModel` → suffix-stripped `resolvedModel`; the suffix must be
tolerated (one session is announced `claude-opus-5[1m]` on init and
`claude-opus-5` on the assistant message) but is tried **last** because it is
ambiguous. An unknown model shows its raw id, never "Default" — that would be a
lie about what is running.

### The `opus` = 4.8 half needed no app change

The app runs the CLI **bundled in the npm package**, not the host `claude`.
Bumping `@anthropic-ai/claude-agent-sdk` 0.3.217 → 0.3.220 (`241f1ec`) moved the
bundled CLI 2.1.217 → 2.1.220, and with it exactly two of fourteen rows:

| value | 2.1.217 | 2.1.220 |
|---|---|---|
| `default` | `claude-opus-4-8[1m]` | `claude-opus-5[1m]` |
| `opus[1m]` | `claude-opus-4-8[1m]` | `claude-opus-5[1m]` |

Decision on record:
[[2026-07-28-the-model-is-the-clis-fact-not-the-pills]].

### Follow-up: the app now runs the HOST Claude Code (`d814c03`)

Owner's call, after the above surfaced the drift. `pathToClaudeCodeExecutable`
points at the host binary when PATH has one; no host install → option absent →
the bundled CLI, unchanged. So the lockfile no longer decides which Claude Code
the user talks to.

- **Accepted trade:** the app tracks a version it has never been tested against,
  and a host CLI whose control protocol moves can break it with no code change.
  That is the accepted cost of not repeating #53's silent pin.
- **No `which` shell-out** — a plain PATH walk. #53 deleted the app's only
  `child_process` use; do not bring one back for a question `fs.existsSync`
  answers.
- **No `.cmd`/`.bat` shims, no extensionless file on Windows.** A shim needs a
  shell and the SDK spawns the path directly, so resolving one hands back
  something that cannot start. Finding nothing is the better failure.
- **Resolved once at boot**, not per spawn — a PATH change mid-session would
  otherwise swap the binary under a running conversation.
- `path.join` uses the HOST's separator; both join and delimiter come from the
  target platform instead. A POSIX PATH walked on Windows otherwise builds
  `\usr\bin\claude` and matches nothing — the tests caught this.

Currently a **no-op in behaviour**: the host `claude.exe` and the bundled one
are byte-identical (same sha256, both 2.1.220) after `241f1ec`. That makes it a
policy change verifiable as a no-op today, and it is why gui-52 passing proves
the wiring rather than the version.

## Queue

**#54 is open, unstarted, and pre-existing** — not caused by this leg. Picking a
model (or permission) *before the first turn* resumes a session that only ever
warmed up and errors it. Warm-up alone emits messages carrying a `session_id`,
so `engine?.sessionId()` is non-null for a session that never ran. Ruled out:
the picked value — `options.model: 'default'` probed directly against the SDK
succeeds. `permission:set` shares the shape, untested.

Otherwise the `ready-for-agent` queue is empty; the only other open item is the
unlabelled umbrella spec **#1**, which is not an agent ticket.

## Next, if you are starting fresh

#54 is the one concrete, evidenced ticket sitting there. Beyond it, the
*Deferred* list in [[active-work]] is unchanged: context-pressure meter (note
the trap — `Query.getContextUsage()` exists but a naïve percentage lies, it must
separate the raw window from the auto-compaction threshold), typed failed-turn
recovery (`rewindFiles()` needs `enableFileCheckpointing`, which our options do
not set), full-text transcript search, session delete/archive lifecycle,
drag-and-drop, replay thumbnails, live-tail external sessions, N-concurrent
engines, fork-on-resume, folding `Welcome`'s last `pickFolder` caller onto the
chooser, and the smaller leftovers from #31–#36.

Route a new effort through `/preset init` (idea) or `/wayfinder` (needs a map),
then `to-spec` → `to-tickets`.

## Landmines — carried, still live

Full ledger in [[active-work]]. Most likely to bite next:

- **Pins are mutation-verified. Never "fix" a red pin by editing its
  expectation.** The only legitimate retirement is a ticket that reverses the
  contract by name, and that allowance is spent.
- **A green test can be green for the wrong reason** — and this leg produced a
  worked example worth remembering. A `parent_tool_use_id` guard was written at
  the model-reporting site; deleting it killed **no** test, because
  `handleMessage` already returns early on `parent_tool_use_id`. The guard was
  dead code and is gone; the test stays and now pins that early return. **If a
  mutation kills nothing, the code you mutated may not be what makes the test
  pass.**
- **Never hardcode a model name**, and **never merge `picked` with `reported`**
  in `model-mode.ts`. #52/#53, above.
- **The CLI shadows the Claude FAMILIES; Wisp resolves the ALIASES.** Corrects
  the note carried since #23. A stale CLI alias table cannot be fixed by
  rebinding a Wisp family — only by upgrading the CLI.
- **The app now runs the HOST `claude` when PATH has one** (`cli-path.ts`),
  falling back to the SDK's bundled binary otherwise. Consequences: the app can
  be broken by a Claude Code update with no code change here; `manifest.json` in
  the SDK package now describes only the FALLBACK, not what actually runs; and
  reproducing a user's bug means matching their CLI version, not ours.
- **Never match CLI markup mid-string, and never strip ANSI from typed text.**
  #50's anchor.
- **Never scope a scrollbar rule to a component** (and never add
  `scrollbar-width` / `scrollbar-color`). #51.
- **Never enrich a row that has not rendered, and never derive a label during
  filtering.**
- **Never call `pickFolder` outside `Welcome`**; the chooser is `chooseFolder`,
  the transition is `switchWorkspace`.
- **Never clear the pane with `newChat()` on a switch path** — use
  `adoptSession`, `null` meaning "no session, no engine call".
- **Never un-key the composer** (`<InputBar key={cwd}>`), and clear
  `pendingInsert` in the same commit as the cwd change.
- **Never re-derive a store path from `cwd`**; `cwdKey()` is comparison only.
- **Do not rebuild the storage index inside `listSessions`**, do not restore
  `messageCount`, never re-add `customTitle ?? summary`.
- **New `window.api` channel → ALL FOUR mock sites**, guard every IPC with
  `isTrustedIpc`. **A module-level cache needs a test reset.**
- **`gh issue close --comment` drops the comment if the issue is already closed**
  — keep `Closes #N` out of the commit, then comment → close → verify.
- **The Bash tool is not PowerShell** (heredoc, not a here-string), source files
  are **CRLF**, and **a mutation harness must assert its anchor matched exactly
  once** — a bad anchor reads identically to an uncaught mutation.
- **Fable-5 refuses turns whose cwd looks sensitive** (`Downloads/*`). Not our
  bug; don't run wrapper sessions or GUI drivers there.

## Baseline

`npm run typecheck` clean, `npm run build` clean, **612 tests green across 48
files**, verified immediately before this handoff. `main` is **six commits
ahead of `origin/main`** — all six are this leg and all are **unpushed**.

Note the previous baton said "four commits ahead" too, but that was stale:
`origin/main` already carried #50 and #51. Trust `git log origin/main..main`
over the note.

## GUI check

`node .claude/skills/run-desktop/driver.mjs [--cycle]` for the titlebar pills.

**`gui-52.mjs` is the newest, and the template whenever a claim is "the UI
followed something the user never clicked".** It earned its keep twice: it
caught the raw-id label regression, and it caught *itself* passing vacuously.
Two techniques worth reusing:

- **Prove the input happened, not just that the output looks settled.** "Pill is
  no longer disabled" is equally true of a turn that never started, so every
  turn is paired with a transcript-growth check. The first version of this
  driver reported a clean-looking failure that was really a confound.
- **Instrument the side that produces the effect.** Wrapping `webContents.send`
  in MAIN distinguishes "main never broadcast" from "the renderer ignored it"
  from "the submit never happened" — three findings needing three different
  fixes, indistinguishable from the DOM alone. Wrap **after** `firstWindow()`.

`gui-49.mjs` is the main-process-counter template, `gui-51.mjs` the visual/CSS
one (pseudo-elements are unreachable from `getComputedStyle`; measure the
consequence, and mind Windows display scaling), `gui-48.mjs` dialog/call-counted
stubs, `gui-47.mjs` workspace switch, `gui-45.mjs` the sessions rail, `gui-42.mjs`
the composer. All need `npm run build` + `playwright-core`.

Carried gotchas: stub `dialog.showOpenDialog` in main **before** any click that
opens one; `createRequire` for playwright-core if the driver lives outside the
project; **pass any path as an argument to `app.evaluate`, never inside a string
literal**; DOM-dispatched clicks; measure in the DOM, never off screenshots;
never re-read an element after an action that may not have happened; clean up a
temp cwd after `app.close()`; and **log what the driver could not drive** rather
than letting silence read as a pass.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[stack]] · [[happy-path]]
- [[2026-07-28-the-model-is-the-clis-fact-not-the-pills]] ·
  [[2026-07-28-a-scrollbar-belongs-to-the-surface-not-the-component]] ·
  [[2026-07-28-sanitizing-replay-markup-is-an-anchor-not-a-strip]] ·
  [[2026-07-28-lazy-enrichment-is-a-mount-not-a-scan]] ·
  [[2026-07-28-choosing-a-folder-is-not-changing-workspace]] ·
  [[2026-07-28-a-workspace-reset-is-a-remount-not-a-state-sweep]] ·
  [[2026-07-28-the-workspace-switch-is-one-transaction-over-ports]] ·
  [[2026-07-28-the-session-list-is-global-scoping-is-a-render-concern]] ·
  [[2026-07-28-storage-location-is-an-index-not-an-encoding]] ·
  [[2026-07-28-session-metadata-is-the-sdks-job]]
