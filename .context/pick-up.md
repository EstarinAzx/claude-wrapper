---
type: pick-up
project: claude-wrapper
updated: 2026-08-05
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Queue empty — and the relay chain has stopped

`gh issue list --state open` should return **two**, and **neither is takeable by
an agent**:

| # | state | why it is not takeable |
|---|---|---|
| **115** | `ready-for-human` | Spec. Both slices delivered. All that remains is **six owner calls**. |
| **118** | `needs-info` | Build ticket. Blocked on **four** of those six. |

Run the query anyway — it is the authority over this file, and this line has been
wrong before (leg 5 of a previous chain wrote that the queue would be empty while
#71 was unblocked the whole time).

```text
gh issue list --state open
gh api repos/EstarinAzx/claude-wrapper/issues/<n> --jq '.issue_dependencies_summary.blocked_by'
```

`.claude/relay/relay-leg.md` carries `stop: true`. No leg was spawned past the
empty queue. Re-running `/relay N=1 read and follow .claude/relay-leg.md` after
the queue refills starts a fresh chain.

## Landed this leg (2026-08-05)

**#117 closed — `50b6a8d`**, spike, no `src/` diff and no `package.json` entry.
Gate green: typecheck, **1044/70** (baseline unchanged), build. Adopted nothing.
Filed no build ticket, per #78. Moved **#115** to `ready-for-human` with a comment
saying why.

Deliverables: `scripts/spike-117-findings.md` (the owner-facing report),
`scripts/spike-117-findings.json` (machine record incl. the full search space and
every S2/S3 query), `scripts/spike-117-backdrop-routes.mjs` (the harness), and
four captures in `scripts/spike-117-shots/`.

## What the owner has waiting

Two independent decisions. Either unblocks work; neither is an agent's to make.

1. **Four `@` calls on #115** — trigger window · cursor-insert vs replace · list
   exclusions and cap · attachment-tray membership. Answering these flips **#118**
   to `ready-for-agent` with no other change. Shortest path back to a queue.
2. **The backdrop call.** Open `scripts/spike-117-findings.md` and the four PNGs.
   #117's recommendation is **adopt nothing**, with `mica-electron`, koffi+FFI and
   an aesthetic change priced as live alternatives. If the answer is "adopt", that
   is when the build ticket gets filed and the report is its pricing.
3. **And the one eyeball check nothing has done:** open the app, pick Mica, click
   away, look. #117 deliberately asserts nothing about it and explains why its own
   measurement does not settle it.

## New landmines from this leg

- **A callable route is not an effective one.** `setVibrancy` and
  `visualEffectState` are both *accepted* on win32 — including bogus values — and
  both do **nothing**. A diff adding either produces no error, no warning and no
  effect: it reads alive in review and is dead at runtime. Probe by calling *and
  checking the effect*, not by checking the call did not throw.
- **`setBackgroundMaterial` has NO runtime whitelist** — it accepts any string
  (`'definitely-not-a-material'`, `''`, `'persistent'`); only a non-string throws.
  `src/shared/backdrop.ts`'s compare-never-coerce guard is therefore the **only**
  whitelist in the system. Do not "simplify" it.
- **There is no backdrop read-back** (`getBackgroundMaterial`/`getVibrancy`
  undefined, no property). Anything reasserting a material must carry its own copy.
- **A second window taking focus** produces an honestly-unfocused, still-visible,
  un-minimised window with a real blur event. `blur()` is inert exactly as #75
  recorded — this is the rung #75 was missing, and it is how to drive any future
  focus-dependent capture.
- **`page.screenshot()` cannot show a DWM backdrop at all** — the window is
  transparent over a material drawn behind it. Only a desktop capture can.
- **A richness score is not an occlusion control.** S4's first run scored 595–1256
  distinct colours on four photographs of a *terminal* sitting on top of the app,
  and passed its blankness check. Use a positive control (painted markers), not a
  better score.
- **Node 22 refuses to spawn a `.cmd`** (`EINVAL`, the CVE-2024-27980 mitigation),
  so `spawnSync('npm', …)` fails on Windows. Hit the registry with `fetch` instead.

## Still-live landmines from earlier legs

- **`canUseTool` is NOT a control surface** (#116) — this machine's
  `permissions.defaultMode` is `bypassPermissions`, so a harness denying through
  it denies nothing. Deny with `disallowedTools`; count `tool_use` blocks as a
  second witness.
- **A bundle grep is still reading names** (#116). Probe by CALLING, paired with a
  bogus negative control.
- **`@path` already resolves** (#116) — do not build a renderer-side expansion.
- **An out-of-workspace suggestion leak was observed once and NOT reproduced**
  (#116). Unexplained, not refuted — treat workspace scoping as the app's job.
- **A lost target is not a dead process** (#114) — write the exit code into
  committed findings, never only to the console.
- **This CLI emits no `init` during warm-up** (#114). Gate "the engine is live" on
  `listModels()`/`supportedCommands()` answering non-empty.
- **An instrument that fails its own setup reports that as the phenomenon** unless
  the verdict requires a scored observation first (#114, and again in #117's S4).
- **A green suite is evidence about the code only if the runner is sound** —
  `git stash push -u && npm test` first.
- **A spike harness must be taught the fix**, or it reports the fix as its own
  failure (#112).
- **`gui-52`'s red is DOUBTFUL** and `gui-75` is focus-dependent; reproduce solo on
  clean `main` before believing either.
- Harness scripts importing `.ts` from `src/` need `node --experimental-strip-types`
  on this Node (22.17). Use `fileURLToPath`, never `URL.pathname` — this repo's
  path contains a space.
- Never hardcode a model name. Never read `~/.claude/daemon/roster.json`.
- Absence assertions need a surviving positive control and mutation evidence.
- Test baseline on `main` is **1044/70** — read it from `main`.
- Squash-merged ticket branches need `git branch -D`.

## Do not decide these

The six owner calls on **#115** stand, none taken. The five standing calls from
the previous batch also remain closed: the Tailwind adopt-utilities half ·
titlebar control count · the 12px line box for 11px muted descriptions · the
accent clause enumeration after #97 · whether the glass ban reaches a
`var(--surface)` pane.

## Baseline

`main` = `50b6a8d`, level with `origin/main` before this leg's `.context/` commit;
no ticket branch. Typecheck / tests / build green at that commit; no `src/` change
this leg.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[happy-path]]
- [[2026-08-05-an-accepted-call-is-not-a-supported-route]]
- [[2026-08-05-a-denial-the-runtime-never-consults-is-not-a-denial]]
- `.claude/vibe.md` — the run that filed #115–#117
