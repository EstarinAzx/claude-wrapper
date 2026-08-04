---
type: pick-up
project: claude-wrapper
updated: 2026-08-05
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Target: #117 — a SPIKE, and the only ready ticket

`gh issue list --state open` should return **three**: spec **#115**, spike
**#117** (`ready-for-agent`, unblocked), and the new build ticket **#118**
(`needs-info`, blocked on four owner calls — do **not** take it).

Run the query anyway — it is the authority over this file, and this line has been
wrong before (leg 5 of a previous chain wrote that the queue would be empty while
#71 was unblocked the whole time).

```text
gh issue list --state open
gh api repos/EstarinAzx/claude-wrapper/issues/<n> --jq '.issue_dependencies_summary.blocked_by'
```

## #117 is a spike and must stay one

Sweep every win32 route to a backdrop that does not flatten on blur, **priced**.
Adopt nothing. Reverse no ADR. **`git diff --stat -- src/` empty is part of the
gate.** It ends by filing its own build ticket with a decided shape, or by
declining it and saying why. Killing its own premise is a successful outcome
(#78 measured and built nothing).

`.claude/vibe.md` holds the grill record behind #115–#117. Read it and #117
before starting.

## Landed this leg (2026-08-05)

**#116 closed — `bd0fed5`**, spike, no `src/` diff. Gate green: typecheck,
**1044/70** (baseline unchanged), build. Filed **#118**. Posted a correction
comment on **#115**.

## New landmines from this leg

- **`canUseTool` is NOT a control surface** — it is a request the ambient
  permission mode may never make. `settingSources` defaults to loading **all**
  filesystem settings, and this machine's `permissions.defaultMode` is
  `bypassPermissions`, so a harness denying tools through `canUseTool` denies
  **nothing** and reports "answered without tools" when tools were used. Deny
  with `disallowedTools`; count `tool_use` blocks in the stream as a second,
  independent witness. Arm A of `spike-116` is the evidence: **1 consultation,
  3 blocks**.
- **A bundle grep is still reading names.** #115's standing "the SDK cannot send
  `file_suggestions`" came from zero occurrences in `sdk.mjs` and is **refuted** —
  every named control method wraps a generic `request({subtype})` dispatcher.
  Probe by CALLING, and pair it with a **bogus-subtype negative control**, or a
  `success` proves nothing.
- **`@path` already resolves** through this app's option shape. Do not build a
  renderer-side expansion; #118's first required test is that sent text stays
  byte-identical.
- **The CLI's `file_suggestions` is not a picker** — empty query returns the
  workspace top level, 18/18 non-empty prefixes returned zero in-workspace
  matches, on both binaries.
- **An out-of-workspace suggestion leak was observed once and NOT reproduced**
  (4 rounds × 7 probes, after excluding binary, `options.env`, handle age and
  probe order). Unexplained, **not refuted** — treat workspace scoping as the
  app's job.
- Harness scripts import `.ts` from `src/`, so they need
  `node --experimental-strip-types` on this Node (22.17). Use `fileURLToPath`,
  never `URL.pathname` — this repo's path contains a space.

## Still-live landmines from earlier legs

- **A lost target is not a dead process** (#114) — write the exit code into
  committed findings, never only to the console.
- **This CLI emits no `init` during warm-up** (#114). Gate "the engine is live"
  on `listModels()`/`supportedCommands()` answering non-empty.
- **An instrument that fails its own setup reports that as the phenomenon**
  unless the verdict requires a scored observation first (#114, three times in
  one leg — and once more this leg).
- **A green suite is evidence about the code only if the runner is sound**
  (#112's leg) — `git stash push -u && npm test` first.
- **A spike harness must be taught the fix, or it reports the fix as its own
  failure** (#112).
- **`gui-52`'s red is DOUBTFUL** and `gui-75` is focus-dependent; reproduce solo
  on clean `main` before believing either.
- Never hardcode a model name. Never read `~/.claude/daemon/roster.json`.
- Absence assertions need a surviving positive control and mutation evidence.
- Test baseline on `main` is **1044/70** — read it from `main`.
- Squash-merged ticket branches need `git branch -D`.

## Do not decide these

Six owner calls parked on **#115**, none taken. Four now block **#118**: the `@`
trigger window · cursor-insert vs replace · list exclusions and cap · attachment
tray membership. Two are #117's context: whether Mica survives blur · whether the
flip is worth a dependency. A leg needing one should say so on the ticket and
stop.

The five standing calls from the previous batch also remain closed: the Tailwind
adopt-utilities half · titlebar control count · the 12px line box for 11px muted
descriptions · the accent clause enumeration after #97 · whether the glass ban
reaches a `var(--surface)` pane.

**`ready-for-human` is ALLOWED this queue** — the owner is asleep, not away.

## Baseline

`main` = `bd0fed5`, level with `origin/main` before this leg's `.context/`
commit; no ticket branch. Typecheck / tests / build green at that commit; no
`src/` change this leg.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[happy-path]]
- [[2026-08-05-a-denial-the-runtime-never-consults-is-not-a-denial]]
- `.claude/vibe.md` — the run that filed #115–#117
