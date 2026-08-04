---
type: pick-up
project: claude-wrapper
updated: 2026-08-05
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Target: #116, then #117 — both SPIKES

`gh issue list --state open` should return **three**: spec **#115** and its two
slices, **#116** and **#117**, all `ready-for-agent`, neither slice blocked.

Run the query anyway — it is the authority over this file, and this line has been
wrong before (leg 5 wrote that the queue would be empty and #71 was unblocked the
whole time).

```text
gh issue list --state open
gh api repos/EstarinAzx/claude-wrapper/issues/<n> --jq '.issue_dependencies_summary.blocked_by'
```

Take **#116** first — lower number; neither blocks the other.

**Read `.claude/vibe.md` before starting either.** It holds every question, the
grepped warrant behind each answer, and the four refutations that changed the
work — two of which killed the main thread's own findings.

## These are spikes and must stay spikes

Harness/sweep, findings, recommendation. **`git diff --stat -- src/` empty** is
part of the gate here. Each spike ends by filing its own build ticket with a
decided shape, or by declining it and saying why. **Do not build the feature in
the spike leg** — the record's rule is *build only if measured*, and #78 is the
precedent that measured and then built nothing.

## Landed this session (2026-08-05) — no commit to `src/`

Spec **#115** plus spikes **#116** / **#117**, filed by an autonomous
`/preset vibe init` run. `.claude/relay-leg.md` rewritten for this queue; the
previous run archived to `.claude/vibe-98-110.md`; two MVD sections appended to
`happy-path.md`. Gate not re-run — nothing under `src/`, `tests/` or
`package.json` moved.

## New landmines from this run

- **A declared wire type is not a callable route.** `file_suggestions` is
  declared at `sdk.d.ts:3041` and is in the `SDKControlRequestInner` union at
  `:3729` — but that union is **direction-agnostic** (it also holds
  `SDKControlPermissionRequest`, which travels CLI→SDK). The bundle this app
  imports (`sdk.mjs`) contains **zero** occurrences of it; only `bridge.mjs`
  (the `./bridge` export, not loaded here) implements it, **inbound**.
- **An absent method name is not an absent route** — #88 records
  `mcpServerStatus()` implemented over a generic subtype dispatcher. **Probe by
  CALLING**, never by matching names (#90).
- **Nothing in `src/main/` enumerates the open workspace.** `pick-folder` and
  `attachments:pick` are dialogs; the only `readdir` walks `~/.claude/projects`.
- **`--disable-gpu` is NOT why a driver cannot judge acrylic** — `gui-69.mjs:9-11`
  launches *without* it on purpose; the reason is **DWM compositing over a
  wallpaper**. And an honestly-unfocused window under automation is itself
  unsolved: `win.blur()` moves `isFocused()` not at all, and a minimised window
  still reports itself focused (#75).
- **"Mica doesn't flatten" is NOT established** — only the app's own copy and the
  ADR it was derived from say so, and neither is an observation. Assert nothing.
- **Electron is `43.2.0`**, the same major the 2026-07-23 ADR spoke about,
  so that ADR has not aged out. `visualEffectState` exists but is `@platform
  darwin`; win32 has no stay-active flag.

## Still-live landmines from the previous batch

- **A lost target is not a dead process** (#114) — write the exit code into
  committed findings, never only to the console.
- **This CLI emits no `init` during warm-up** (#114). Gate "the engine is live"
  on `listModels()` answering non-empty.
- **An instrument that fails its own setup reports that as the phenomenon**
  (#114, three times in one leg) unless the verdict requires a scored
  observation first.
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

Six owner calls are parked on **#115** and were deliberately not taken: whether
Mica survives blur · whether the flip is now worth a dependency · the `@`
trigger-window rule · cursor-insert vs replace · what the `@` list excludes and
whether it is capped · whether an accepted `@` reference joins the attachment
tray. A leg needing one of these should say so on the ticket and stop.

The five standing calls from the previous batch also remain closed: the Tailwind
adopt-utilities half · titlebar control count · the 12px line box for 11px muted
descriptions · the accent clause enumeration after #97 · whether the glass ban
reaches a `var(--surface)` pane.

**`ready-for-human` is ALLOWED this queue** — the owner is asleep, not away.
This differs from the 2026-08-04 batch on purpose.

## Baseline

`main` = `3ecdb9e`, level with `origin/main` before this session's `.context/` +
`.claude/` commit; no ticket branch. Typecheck / tests / build unchanged from
that commit — this session touched no `src/`.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[happy-path]]
- [[2026-08-05-a-declared-wire-type-is-not-a-callable-route]]
- `.claude/vibe.md` — the run that filed #115–#117
- `.claude/vibe-98-110.md` — the previous run, archived
