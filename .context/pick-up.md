---
type: pick-up
project: claude-wrapper
updated: 2026-08-04
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Landed this leg (2026-08-04) — #106, `88ddf19`

**A clipboard image that fails to read is no longer blamed for its type.**
`InputBar.tsx` did `data: await readAsBase64(file).catch(() => '')`; `''` is a
value of the *success* type, so it walked past `isEmbeddable(mediaType) && data`
(falsy) and `if (path)` (a pasted candidate has none) into `judgeAttachment`'s
catch-all, printing *"image/png can't be embedded — only PNG, JPEG, GIF and WebP
images can"* — PNG named as both the rejected type and an accepted one.

The read resolves to `null`; the composer pushes its own
`{ name, reason: COULD_NOT_READ }` rejection before `admitAttachments`, so an
unreadable file never reaches the policy and spends no slot from the count
budget. `src/shared/attachment-policy.ts` untouched.

Premise reproduced first (a jsdom `FileReader` stubbed to fail **by file name**,
so the mixed-paste test still really reads the good file). Mutation-verified
twice: restoring `''` reds with the old sentence, dropping the pushed rejection
reds on the `waitFor`.

Gate green: typecheck clean, **998 tests / 64 files** (995 + 3), build clean.

## Frontier: SIX OPEN, ALL `ready-for-agent`, NONE `ready-for-human`

**Next unblocked, lowest-numbered: #107.** Live `blocked_by` is 0. Run the query
anyway — it is the authority over this table, and this line has been wrong
before.

```text
gh issue list --state open --label ready-for-agent
gh api repos/EstarinAzx/claude-wrapper/issues/<n> --jq '.issue_dependencies_summary.blocked_by'
```

| # | subject | blocked by |
|---|---|---|
| **107** | rail can delete session receiving first streaming turn | — |
| **108** | **spike** — second send/hung interrupt lifecycle | — |
| **109** | send during workspace resolve tears down live turn | — |
| **110** | close inside debounce drops final window bounds | — |
| **111** | close between turns strands an open subagent row | — |
| **112** | pill click empties the model menu and slash commands | — |

`ready-for-human` is forbidden while owner is AFK. Stuck ticket keeps
`ready-for-agent`, gets a precise comment, and stops the relay.

## What #107 requires

**The batch's only data-loss defect** — it destroys a transcript that is being
written. A main-side fix plus a renderer-side pane reset.

The rail refuses delete with `disabled={active && busy}` (`Sidebar.tsx:215`),
`active` being `s.id === activeId` where `activeId` is `useChat`'s
`activeSessionId` — **written only at `turn-end`** (`useChat.ts:241`) and on
engine-terminal (`:283`). During the **first turn of a fresh conversation** the
renderer does not have that id, so the row is not `active` and its trash button
is live. Main declines to re-decide it (`index.ts:449-452`, the "second busy
source" comment), and `session-store.ts:70` passes `includeProgrammatic: true`,
so the live session is genuinely in the list.

Remedy per the ticket: refuse `'failed'` in the `session:delete` handler when
`engine?.isBusy() && engine.sessionId() === id`, and update that comment to say
why this is **not** the second busy source it rejects — main is the only place
the in-flight id exists during turn 1, which is the whole bug.

## #107 landmines

- **Do not write `activeSessionId` earlier in the renderer.** That id is main's,
  arrives via `init`, and making the renderer guess it creates this bug class
  rather than closing it. `useChat.ts:275-279` already documents the asymmetry.
- **Deleting a foreign session mid-turn must stay allowed.** AC1 has two halves —
  `'failed'` for the running id **and `'ok'` for a different id during that same
  turn. Refusing everything passes the first alone.
- **AC2 is the actual trigger:** assert the refusal holds while the renderer's
  `activeSessionId` is **null**. A test that sets it first re-tests the case that
  already worked.
- **AC3 is renderer-side and easy to miss:** `App.deleteSession`'s
  `if (id === activeSessionId) newChat()` (`App.tsx:166`) is also false here, so
  the pane is never reset and the app ends up pointed at a conversation whose
  history it destroyed.
- **AC4:** `tests/sidebar.test.tsx` must not need editing — the rail's `disabled`
  stays a visible affordance, not the authority.
- `deleteSession` itself is fine; the bug is upstream of it.
- Reproduce the ticket's own claim before fixing it; four legs running, each
  found or confirmed a stated premise by measuring rather than inheriting it.

## Still-live batch landmines

- #108 is the remaining spike: harness + findings + recommendation, no `src/`
  diff. (#105 was the other, and is done.)
- **`gui-52`'s red is DOUBTFUL, and chasing it is out of scope.** It is recorded
  across `.context/` as *"the CLI returning an empty model list"*, but #105
  measured the CLI returning **15 models** here, and `chat:target` is a fourth
  `discardEngine` caller (#77's *"by contract"* note). `gui-52` was **not** run —
  this is a hypothesis, filed in #112's out-of-scope.
- `gui-75` still has a standing environmental red (focus-dependent); reproduce
  solo before treating it as a regression.
- Never hardcode a model name. Never read `~/.claude/daemon/roster.json`.
- Absence assertions need a surviving positive control and mutation evidence.
- **A single sample cannot measure an asynchronous event** (#104, then #105
  again). Poll and report the delay as a number.
- **A stub that fails everything measures less than one that fails
  selectively** (#106) — install the failure by name so the control still runs
  through the real code.
- Ticket baselines are stale: #107 says 979 tests, `main` is at **998**.
- Squash-merged ticket branches need `git branch -D`.

## Do not decide these

AFK grant does not reopen standing calls outside this seed:

1. Tailwind adopt-utilities half.
2. Titlebar control count, pinned at 8.
3. Whether 12px is the right line box for 11px muted descriptions.
4. Whether the accent clause enumeration changes after #97.
5. Whether the glass ban reaches a `var(--surface)` pane.

## Baseline

`main` = `88ddf19`, pushed and level with `origin/main`; no ticket branch.
Typecheck clean, **998 tests / 64 files**, build clean.

## Related

- [[overview]] · [[active-work]] · [[decisions]]
- [[2026-08-04-a-failure-flattened-into-a-value-is-judged-as-one]]
- `.claude/vibe.md` — run that filed #98–#110
