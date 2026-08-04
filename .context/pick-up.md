---
type: pick-up
project: claude-wrapper
updated: 2026-08-04
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Landed this leg (2026-08-04) — #111, `d572bb4`

`close()` gated `drainSubagents()` on `turnResolve`, so an engine torn down
**between** turns left every open subagent pulsing "running…" forever — and the
CLI process is gone by then, so #104's `onSubagent` terminal edge could never
arrive either. The drain moved above the block, matching `onBackgroundTasks([])`
one line up, which was already unconditional for exactly the same reason.

**The gate was the drain's own docstring, compiled.** It claimed the drain was
"only called on the failure paths" and that "a successful turn has already
drained them" — and `if (turnResolve)` is precisely what that implies. #104
falsified both afterwards by leaving a running agent open on purpose. Corrected
in the same change.

Gate green: typecheck clean, **1026 tests / 67 files** (1024 + 2), build clean.
No new file, no new port, no GUI driver — the port is injectable in vitest.

## Frontier: TWO OPEN, BOTH `ready-for-agent`

**Next unblocked, lowest-numbered: #112.** Live `blocked_by` is 0 for both.
Run the query anyway — it is the authority over this table, and this line has
been wrong before.

```text
gh issue list --state open --label ready-for-agent
gh api repos/EstarinAzx/claude-wrapper/issues/<n> --jq '.issue_dependencies_summary.blocked_by'
```

| # | subject | blocked by |
|---|---|---|
| **112** | pill click empties the model menu and slash commands | — |
| **113** | a second `chat:send` tells the renderer the live turn ended | — |

**No spikes left in the batch** — both are ordinary fixes, so premise
reproduction and mutation evidence apply to each.

`ready-for-human` is forbidden while owner is AFK. Stuck ticket keeps
`ready-for-agent`, gets a precise comment, and stops the relay.

## What #112 requires

Three engine-discarding writers — `model:set`, `permission:set-mode`,
`backend:set-mode` — call `discardEngine` and rebuild nothing, while both live
read channels answer straight off that handle:

```ts
commands:list → engine?.listCommands() ?? []
model:list    → { models: (await engine?.listModels()) ?? [], … }
```

Measured by #105 on the built app over its own IPC, one writer apart, no prompt
sent: **15 → 0 models and 119 → 0 commands, 6/6 warmed runs**. Consequence: a
second model change is impossible without sending a turn first, and `/`
autocomplete plus the Commands dock are empty in the same window. The pill still
shows the model you picked, because `model:list`'s `current` comes from
`model-mode.ts` rather than the engine — which is why it is invisible.

**Remedy: rebuild lazily at the two READ handlers, not eagerly in
`discardEngine`.** Eager rebuild+warm was priced and rejected at **median
1539ms per click**, paid by every user who never opens a menu again. Caching the
last non-empty list is also rejected: both handlers carry an explicit no-cache
contract in their own comments, and a cached model list is *wrong* across a
backend flip. Taking either route is a reversal of a stated design and must say
so out loud.

**Sharpest failure mode — the rebuild must carry `pendingResume` into
`warmUp`.** `resume` binds when the query is CONSTRUCTED (#73), so a bare
`warmUp()` leaves the rebuilt engine on a fresh session while the pane, refilled
from disk, looks correct. `discardEngine` already stores the right value per
path (`sessionId()` for model and permission, `null` for the backend flip's
deliberate fresh start), so threading it handles all three writers uniformly
**because** that asymmetry is already encoded there. Do not unify the three
handlers while here.

Required coverage the ticket names, all four load-bearing:

1. Each writer, then a `commands:list` read with **no send**, yields non-empty.
2. A pin on **what was passed to `warmUp`** — the resume target, not merely that
   a rebuild happened. Counting rebuilds passes while the conversation is lost.
3. A read handler does **not** rebuild when the engine is already live.
4. Re-run `scripts/spike-105-model-pick-channels.mjs`; phase C's AFTER counts
   turning non-zero is the fix's end-to-end evidence.

Out of scope: any change to `discardEngine` itself, `session:pick-folder` and the
switch transaction (both already rebuild+warm), and `gui-52`'s standing red.

## Still-live batch landmines

- **A gate can be a comment's belief, compiled** (#111). Fourth consecutive leg
  where a comment claimed more than the code did, and the first where it
  **caused** the defect. An overclaiming comment is caught by testing the code; a
  justifying one must be re-derived against its dependencies, because the code
  agrees with it perfectly.
- **A passing mutation proves the code, not the test** (#111). When a mutation
  survives, the next move is a **compound** mutation removing the reason it
  survived — otherwise a robustness result gets recorded as a sensitivity one.
- **A message that is never SENT leaves no artifact** (#110) — no state-shaped
  test can see it, so assert on the port.
- **A remedy crossing a process boundary needs a witness on each side** (#110).
- **A "before" run needs a positive control** (#110), or "nothing changed" is
  trivially true; and an instrument should **refuse** runs that missed the
  window it was aimed at.
- **Ordering a check before a mutation is necessary and not sufficient** (#109).
  An `await` between them means the answer must be re-read on the far side.
- **A "tear down, then report X" mutation passes a status-only assertion**
  (#109). Assert port by port that nothing was reached.
- **Ask the process that holds the fact** (#108). Four instrument bugs there were
  all the same mistake — measuring a proxy for a fact another process owns.
- **An empty list is ATTRIBUTED, not observed** (#105) — #112's whole premise
  rests on the child-process witness, not on the array.
- **`gui-52`'s red is DOUBTFUL, and chasing it is out of scope** — #105 measured
  the CLI returning **15 models / 119 commands**. Named in #112's out-of-scope.
- `gui-75` still has a standing environmental red (focus-dependent); reproduce
  solo before treating it as a regression.
- Never hardcode a model name. Never read `~/.claude/daemon/roster.json`.
- Absence assertions need a surviving positive control and mutation evidence.
- **A single sample cannot measure an asynchronous event** (#104, #105).
- Ticket baselines are stale for the fifth consecutive ticket: #112 will state an
  old one; `main` is at **1026/67**.
- Squash-merged ticket branches need `git branch -D`.

## Do not decide these

AFK grant does not reopen standing calls outside this seed:

1. Tailwind adopt-utilities half.
2. Titlebar control count, pinned at 8.
3. Whether 12px is the right line box for 11px muted descriptions.
4. Whether the accent clause enumeration changes after #97.
5. Whether the glass ban reaches a `var(--surface)` pane.

## Baseline

`main` = `d572bb4`, pushed and level with `origin/main`; no ticket branch.
Typecheck clean, **1026 tests / 67 files**, build clean.

## Related

- [[overview]] · [[active-work]] · [[decisions]]
- [[2026-08-04-the-gate-was-the-comments-belief-compiled]]
- `.claude/vibe.md` — run that filed #98–#110
