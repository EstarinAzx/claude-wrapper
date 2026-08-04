---
type: pick-up
project: claude-wrapper
updated: 2026-08-04
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Landed this leg (2026-08-04) — #108, `aa8e683`, **spike, no `src/` diff**

Two claims confirmed by reading; measuring their reachability split them in
opposite directions.

**Claim 1 — consequence REAL, user path NOT reachable.** A second `chat:send`
under a live turn is answered on the **second** caller's `onEvent` with a
turn-terminal `error`, and the renderer clears `busy` **518ms** later while main
still holds `turnResolve` — witnessed by main refusing a real composer send
moments after, not by anything rendered. The send slot then reads **"Send"**, so
there is no Stop for a turn that is still running. But no input device can
produce that second send: only a **same-task** dispatch reaches main twice, and
the realistic back-to-back-macrotask case is refused by the **emptied draft**,
not the busy flag. Filed as **#113** on that warrant — the composer is held shut
by a UI convenience, `chat:send` has no check at all, and it holds only while
`useChat.send` stays the single caller of `sendPrompt`.

**Claim 2 — mechanism real, hang NOT observed. Half closed.** 6/6 driven
interrupts answered at **4–29ms**, mid-text and mid-tool-call, none refused.
Closed on #78's precedent; #73's `onTerminal` already covers a dying stream. Not
filed.

Gate green: typecheck clean, **1009 tests / 66 files** (unchanged — a spike adds
no app tests), build clean, `git diff --stat -- src/` empty.

## Frontier: FIVE OPEN, ALL `ready-for-agent`, NONE `ready-for-human`

**Next unblocked, lowest-numbered: #109.** Live `blocked_by` is 0 for all five.
Run the query anyway — it is the authority over this table, and this line has
been wrong before.

```text
gh issue list --state open --label ready-for-agent
gh api repos/EstarinAzx/claude-wrapper/issues/<n> --jq '.issue_dependencies_summary.blocked_by'
```

| # | subject | blocked by |
|---|---|---|
| **109** | send during workspace resolve tears down live turn | — |
| **110** | close inside debounce drops final window bounds | — |
| **111** | close between turns strands an open subagent row | — |
| **112** | pill click empties the model menu and slash commands | — |
| **113** | a second `chat:send` tells the renderer the live turn ended | — |

**The batch has no spikes left** — #109–#113 are all ordinary fixes, so premise
reproduction and mutation evidence apply again.

`ready-for-human` is forbidden while owner is AFK. Stuck ticket keeps
`ready-for-agent`, gets a precise comment, and stops the relay.

## What #109 requires

`switchWorkspace` checks `isBusy` before an `await`, so a send landing during the
resolve tears down a live turn. Reproduce the premise first — the last five legs
all did, and three of them found the stated premise needed correcting.

Two facts from #108 bear directly on it:

- **`chat:send` has no busy guard of any kind**, asserted mechanically. Any
  reasoning about "the app refuses sends while busy" is about `useChat.send`'s
  React-state read and nothing else.
- **After an overlap error the renderer reports idle while main still holds the
  turn.** That state is reachable, and any logic reading `busy` from the renderer
  will be told the wrong thing in it.

## Still-live batch landmines

- **Ask the process that holds the fact.** #108's four instrument bugs were all
  the same mistake — measuring a proxy for a fact another process owns. `busy` in
  the renderer, characters in the pane, and a case name all stood in for
  something main knew directly.
- **A pane that stopped growing is NOT an idle engine** — measured 116 → 116 on a
  turn the engine then refused a send for. Growth is sound as a positive, useless
  as a negative.
- **Re-check a premise at the moment it matters**, not before a settle: an
  interrupt issued after its turn's own result produced a latency of **-821ms**.
  The quiet version of that bug is a small positive number.
- **`gui-52`'s red is DOUBTFUL, and chasing it is out of scope** — #105 measured
  the CLI returning **15 models**. Filed in #112's out-of-scope; `gui-52` was not
  run.
- `gui-75` still has a standing environmental red (focus-dependent); reproduce
  solo before treating it as a regression.
- Never hardcode a model name. Never read `~/.claude/daemon/roster.json`.
- Absence assertions need a surviving positive control and mutation evidence.
- **A single sample cannot measure an asynchronous event** (#104, #105).
- **A stub that fails everything measures less than one that fails selectively**
  (#106).
- **A mocked refusal asserts the harness** (#107) — bind the real decision behind
  the seam when the decision is what the test is about.
- Ticket baselines are stale: they say 979, `main` is at **1009**.
- Squash-merged ticket branches need `git branch -D`.

## Do not decide these

AFK grant does not reopen standing calls outside this seed:

1. Tailwind adopt-utilities half.
2. Titlebar control count, pinned at 8.
3. Whether 12px is the right line box for 11px muted descriptions.
4. Whether the accent clause enumeration changes after #97.
5. Whether the glass ban reaches a `var(--surface)` pane.

## Baseline

`main` = `aa8e683`, pushed and level with `origin/main`; no ticket branch.
Typecheck clean, **1009 tests / 66 files**, build clean.

## Related

- [[overview]] · [[active-work]] · [[decisions]]
- [[2026-08-04-the-composer-is-held-shut-by-a-draft-clear-not-a-guard]]
- `.claude/vibe.md` — run that filed #98–#110
