---
target: init
idea: >
  Make claude-wrapper reach the Linear bar confirmed by the owner on 2026-08-10
  across the five core surfaces — Welcome, Titlebar, Sidebar, Chat, InputBar —
  without drifting off `docs/design/frost-mono-reference.png`. The tracker is
  empty; this is new work, and the owner's words were "make this app polished
  well and complete and improved" with the scope resolved to the whole app end
  to end.

  KNOWN TICKET ZERO, established before this run and not up for grilling: the
  consolidated `inspect:` command. `.claude/skills/run-desktop/driver.mjs`
  reaches only Welcome + Titlebar — it waits for the two titlebar pills,
  screenshots and exits, never picking a project folder. Nine of eleven surfaces
  cannot be captured by any single command. About twenty ticket-specific
  `gui-*.mjs` drivers in the same directory DO open workspaces and drive live
  sessions, so the machinery exists and has never been consolidated. Gauntlet
  cannot judge what it cannot see.

  KNOWN DEFECTS from the 2026-08-10 capture
  (`.gauntlet/bar/identity/current-welcome-2026-08-10.png`): the identity mark
  renders as a blank mint rounded square with no glyph, in BOTH the titlebar and
  the Welcome hero; the two mode pills crowd the app name with no separation
  from identity; the Welcome composition floats in dead space.

  HARD CONSTRAINT on every judgment in this run: material, translucency and
  colour are OUT OF SCOPE for any driver-based verdict. The wash is
  `oklch(0.12 0.008 210 / 0.64)`, composited by Windows over OS acrylic, and
  DESIGN.md states no driver can see a DWM backdrop. The flat mid-grey ground in
  the capture is an instrument artifact, not a defect. This repo has paid the
  read-an-artifact-as-a-finding bill eight times.
partner: opus                 # anthropic/claude-opus-5
pressure: opencode-go/kimi-k3
pressure_via: sonnet          # first non-Claude family; no slot rebind, no restore owed
pressure_rationale: >
  Resolved by vibe's own order: no prose override on the invocation, no
  `pressure:` carried in a state file (the prior run was archived to
  `.claude/vibe-130.md`), so the first non-Claude family in live `wisp routing`
  wins — `sonnet` -> `opencode-go/kimi-k3`. Recorded risk, carried openly: the
  archived chain-3 record says this Target "died three times on gateway 502/503
  and judged nothing", which is why the #130 run overrode it by prose. The rule
  has no flakiness clause, so it is followed. On failure the fallback is
  `haiku` -> `xai/grok-4.5` — still cross-model — BEFORE same-model degraded,
  because the invariant this preset protects is cross-model separation and
  same-model is the last resort rather than the second.
restore_owed: NO — no slot rebind was needed.
max_defer: 12
phase: boot
halted: false
bar: .gauntlet/bar/           # confirmed by the owner 2026-08-10; gauntlet WILL be chained
carried_forward: >
  SEVEN open owner-calls carry forward from `.claude/vibe-130.md` (archived this
  run so vibe would seed rather than resume `phase: fired`). They are unresolved,
  not closed. `.context/active-work.md` and `.context/pick-up.md` both still
  point at `.claude/vibe.md` for them and need repointing at wrap-up. The
  longest-standing live one is #127's Remote Control question.
---

## Decisions

## Needs you

## Log
- [boot] Seeded 2026-08-10. Prior run archived to `.claude/vibe-130.md` — it read
  `phase: fired`, `halted: false`, which would have made this invocation resume a
  completed run and silently discard the idea.
- [boot] Bar confirmed by the owner before firing: Linear as craft ceiling,
  `frost-mono-reference.png` as identity floor. `.gauntlet/bar/README.md` exists,
  so step 6 chains gauntlet behind the queue.
