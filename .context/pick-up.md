---
type: pick-up
project: claude-wrapper
updated: 2026-08-04
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Landed this leg (2026-08-04) — #112, `e05f400`

`model:set`, `permission:set-mode` and `backend:set-mode` call `discardEngine`
and rebuild nothing, while `commands:list` and `model:list` were answered
straight off that handle — so both went empty and stayed empty until the next
send. Rebuilt **lazily at the two READ handlers** (`ensureListEngine`, the new
`src/main/list-engine.ts`), with `discardEngine` and all three writers untouched
and `pendingResume` threaded **into** `warmUp`.

Before/after **re-measured on this machine minutes apart** rather than compared
against the committed #105 artifact: pre-fix 6/6 emptied at 0–1ms per read;
post-fix 0/6, answering 15 models / 119 commands. The backend flip answers
**15 → 5** — the smaller, mode-aware list — which is the no-cache contract
demonstrated rather than cited.

Gate green: typecheck clean, **1034 tests / 68 files** (1026 + 8), build clean.

**Also filed #114**, a spike, from that same required re-run (see below).

## Frontier: TWO OPEN, BOTH `ready-for-agent`

**Next unblocked, lowest-numbered: #113.** Live `blocked_by` is 0 for both.
Run the query anyway — it is the authority over this table, and this line has
been wrong before.

```text
gh issue list --state open --label ready-for-agent
gh api repos/EstarinAzx/claude-wrapper/issues/<n> --jq '.issue_dependencies_summary.blocked_by'
```

| # | subject | blocked by |
|---|---|---|
| **113** | a second `chat:send` under a live turn tells the renderer the turn ended | — |
| **114** | **spike** — does closing a live warmed engine and rebuilding it kill main? | — |

`ready-for-human` is forbidden while owner is AFK. Stuck ticket keeps
`ready-for-agent`, gets a precise comment, and stops the relay.

## What #113 requires

`chat:send` has **no busy check at all**. A second send under a live turn reaches
`runTurn`'s overlap branch, which answers on the **second** caller's `onEvent` —
a fresh closure forwarding to the same renderer — and the renderer treats every
`error` as turn-terminal, so `setBusy(false)` fires at **518ms** while the first
turn is still streaming. The send slot reads "Send" again, so there is no Stop on
screen for a turn that is still running, and the user's obvious recovery (type
the prompt again) reproduces the same error.

**The realistic case is refused by the emptied draft, not by a guard.**
`InputBar.submit` clears `value` on the first commit, so a second Enter returns on
`!text.trim()` before the busy branch is consulted — measured, with the queued
note absent in that run, which is how it is known. Only a same-task double
dispatch reaches main, and nothing but `useChat.send` calls `sendPrompt` today.

**Fix it in main, where the fact lives** — before a second `onEvent` is attached.
`switch-workspace.ts` and `delete-guard.ts` are the precedent for the shape.

**The wrinkle the ticket demands an answer to:** `useChat.send` appends the user's
bubble **before** calling `sendPrompt`, so a silent main-side refusal orphans that
bubble. Either the refusal reports something the renderer can act on, or the
renderer stops appending until the send is accepted — **pick one deliberately and
say which**; the ticket rejects letting it fall out.

Required coverage: (1) no turn-terminal event and `busy` stays true; (2) the
first turn still finishes with its `turn-end`; (3) the orphan bubble answered;
(4) **a test that the second send never reached `runTurn`** — a status-only
assertion passes with the guard deleted; (5) re-run
`scripts/spike-108-turn-lifecycle.mjs` phase C2 (`SPIKE108_PHASES=A` re-runs the
drift alarm alone in a second; B and C cost real CLI turns).

Out of scope, all decided upstream: making the renderer ignore `error` generally,
disabling the composer while a turn runs (#80 built the queue instead), and any
second busy flag.

## What #114 is, and what it is not

A spike, filed from an observation during #112's re-run, **not** from reading
code: Electron's main process vanished in **2 of 6** post-fix harness runs
(**0 of 2** pre-fix), both times at the sixth iteration's `pickFolder`, with no
exception and no stderr beyond SDK warnings, and every completed measurement
correct. It did **not** recur across the four later runs, one of which did
**nine** iterations and sailed straight past that point — which kills
"cumulative engine builds" as the explanation.

The structural difference #112 introduced is real: `pickFolder` now closes a
**live, warmed, never-run** query and constructs another in the same tick, every
time, where before the writer had already torn it down. That path is not new (two
consecutive folder picks did it already) but it went from rare to routine.

**Its premise may well die under measurement, and that is a success.** Both
mechanism and reachability are open and can fail separately — #108's shape.

## Still-live batch landmines

- **A fix can move a cost instead of removing one** (#112). The first list read
  after a pill click is now a **median ~5.5s** where it was 0–1ms and wrong
  (1ms on a live engine). Almost all of it is `supportedCommands`, not query
  construction. A third consumer of a list read inherits that wait.
- **A spike harness must be taught the fix, or it reports the fix as its own
  failure** (#112). Phase B read only the writers, so a fixed app printed
  `PREMISE: NOT CONFIRMED`. It now reads the READ handlers too.
- **A green suite is evidence about the code only if the runner is sound**
  (#112's leg). `npm test` died with `SyntaxError: Unexpected token ')'` and no
  file name; the cause was **one flipped byte** in
  `node_modules/@vitest/mocker/dist/chunk-hoistMocks.js` — untracked, untouched,
  with its original `mtime`. **`git stash push -u && npm test` on the clean tree**
  separated "my change" from "this machine" in a minute; do that FIRST next time.
  Reproducing the **recorded** baseline afterwards is what proves a repair, which
  is why the exact counts in these files matter.
- **Prefer a demonstration to a citation** (#112). The no-cache contract was
  proven by the backend flip returning the *smaller* list (15 → 5), not by
  quoting the handler comment.
- **A gate can be a comment's belief, compiled** (#111). A justifying comment must
  be re-derived against its dependencies, because the code agrees with it
  perfectly.
- **A passing mutation proves the code, not the test** (#111). When a mutation
  survives, the next move is a **compound** mutation removing the reason it did.
- **A message that is never SENT leaves no artifact** (#110) — assert on the port.
- **A remedy crossing a process boundary needs a witness on each side** (#110).
- **A "before" run needs a positive control** (#110), or "nothing changed" is
  trivially true; and an instrument should **refuse** runs that missed the window.
- **Ordering a check before a mutation is necessary and not sufficient** (#109).
- **A "tear down, then report X" mutation passes a status-only assertion** (#109).
  Assert port by port that nothing was reached — #113 names the same trap.
- **Ask the process that holds the fact** (#108).
- **An empty list is ATTRIBUTED, not observed** (#105).
- **`gui-52`'s red is DOUBTFUL** — #105 measured the CLI returning 15 models /
  119 commands, and #112's phase A reconfirmed it twice.
- `gui-75` still has a standing environmental red (focus-dependent); reproduce
  solo before treating it as a regression.
- Never hardcode a model name. Never read `~/.claude/daemon/roster.json`.
- Absence assertions need a surviving positive control and mutation evidence.
- **A single sample cannot measure an asynchronous event** (#104, #105).
- Ticket baselines are stale for the sixth consecutive ticket: read the count from
  `main`, which is at **1034/68**.
- Squash-merged ticket branches need `git branch -D`.

## Do not decide these

AFK grant does not reopen standing calls outside this seed:

1. Tailwind adopt-utilities half.
2. Titlebar control count, pinned at 8.
3. Whether 12px is the right line box for 11px muted descriptions.
4. Whether the accent clause enumeration changes after #97.
5. Whether the glass ban reaches a `var(--surface)` pane.

## Baseline

`main` = `e05f400`, pushed and level with `origin/main`; no ticket branch.
Typecheck clean, **1034 tests / 68 files**, build clean.

## Related

- [[overview]] · [[active-work]] · [[decisions]]
- [[2026-08-04-the-wait-moved-it-did-not-vanish]]
- [[2026-08-04-a-green-suite-does-not-prove-a-sound-toolchain]]
- `.claude/vibe.md` — run that filed #98–#110
