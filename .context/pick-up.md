---
type: pick-up
project: claude-wrapper
updated: 2026-08-04
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Landed this leg (2026-08-04) — #105, `0aae906`, **spike, no `src/` diff**

**Picking a model empties both live read channels until the next send —
confirmed on all three writers.** Driving the **built app over its own IPC**,
one writer apart, **no prompt sent**:

| writer | models | commands | warmed runs |
|---|---|---|---|
| `model:set` | 15 → **0** | 119 → **0** | 2/2 |
| `permission:set-mode` | 15 → **0** | 119 → **0** | 2/2 |
| `backend:set-mode` | 15 → **0** | 119 → **0** | 2/2 |

**The ticket's stated confound is FALSE here.** Asked directly with no Electron
in the picture, through the app's real `cli-path.ts` / `backend-mode.ts` and
`engine.ts`'s option shape, the CLI answers **119 commands and 15 models** — so
an empty app list cannot be blamed on the CLI. **In 2 of 6 runs the app answered
`[]` while the CLI child process was still alive**, which attributes the
emptiness to the nulled handle in `main` rather than inferring it from an array.

Remedy **recommended, not implemented**: filed as **#112** — rebuild lazily at
the two READ handlers, since eager rebuild inside `discardEngine` measures
**median 1539ms per pill click**.

Gate green: typecheck clean, **995 tests / 64 files** (unchanged), build clean.

## Frontier: SEVEN OPEN, ALL `ready-for-agent`, NONE `ready-for-human`

**Next unblocked, lowest-numbered: #106.** Live `blocked_by` is 0. Run the query
anyway — it is the authority over this table, and this line has been wrong
before.

```text
gh issue list --state open --label ready-for-agent
gh api repos/EstarinAzx/claude-wrapper/issues/<n> --jq '.issue_dependencies_summary.blocked_by'
```

| # | subject | blocked by |
|---|---|---|
| **106** | failed clipboard-image read gets contradictory copy | — |
| **107** | rail can delete session receiving first streaming turn | — |
| **108** | **spike** — second send/hung interrupt lifecycle | — |
| **109** | send during workspace resolve tears down live turn | — |
| **110** | close inside debounce drops final window bounds | — |
| **111** | close between turns strands an open subagent row | — |
| **112** | pill click empties the model menu and slash commands | — |

`ready-for-human` is forbidden while owner is AFK. Stuck ticket keeps
`ready-for-agent`, gets a precise comment, and stops the relay.

## What #106 requires

A **real `src/` fix**, unlike the last two legs — small, renderer-side, and with
its design already settled by the ticket's non-goals.

`InputBar.tsx` does `data: await readAsBase64(file).catch(() => '')`. The empty
string then walks past `isEmbeddable(mediaType) && data` (falsy) and `if (path)`
(a pasted candidate has none) into `judgeAttachment`'s catch-all, which says
*"image/png can't be embedded — only PNG, JPEG, GIF and WebP images can"* —
naming PNG as both the rejected type and an accepted one.

Remedy per the ticket: resolve to `null` at the call site, push a
`{ name, reason: <could-not-read wording> }` rejection for those candidates
before `admitAttachments`.

## #106 landmines

- **AC1 has two halves and the second is the real one.** Assert the reason **is**
  the could-not-read wording *and* **is not** the embeddable-types sentence.
  Asserting only the new string passes against a build that shows both.
- **Do not widen `Candidate` or `judgeAttachment`'s signature.** It is a pure
  shared function whose contract is "given a candidate, judge it"; the composer
  is what knows the read failed and should say so.
- **Do not touch the catch-all message** — correct for the case it was written
  for. **Do not add a retry** — the file is gone or locked.
- Reproduce the ticket's own claim before fixing it; the last three legs each
  found a stated premise that had never been measured.

## Still-live batch landmines

- #108 is the remaining spike: harness + findings + recommendation, no `src/`
  diff. (#105 was the other, and is done.)
- #107 remains the only data-loss ticket, but queue order is lowest-numbered.
- **`gui-52`'s red is now DOUBTFUL, and chasing it is out of scope.** It is
  recorded across `.context/` as *"the CLI returning an empty model list"*, but
  #105 measured the CLI returning **15 models** here, and `chat:target` is a
  fourth `discardEngine` caller (#77's *"by contract"* note). `gui-52` was
  **not** run — this is a hypothesis, filed in #112's out-of-scope.
- `gui-75` still has a standing environmental red (focus-dependent); reproduce
  solo before treating it as a regression.
- Never hardcode a model name. Never read `~/.claude/daemon/roster.json`.
- Absence assertions need a surviving positive control and mutation evidence.
- **A single sample cannot measure an asynchronous event** (#104, then #105
  again). Poll and report the delay as a number.
- Squash-merged ticket branches need `git branch -D`.

## Do not decide these

AFK grant does not reopen standing calls outside this seed:

1. Tailwind adopt-utilities half.
2. Titlebar control count, pinned at 8.
3. Whether 12px is the right line box for 11px muted descriptions.
4. Whether the accent clause enumeration changes after #97.
5. Whether the glass ban reaches a `var(--surface)` pane.

## Baseline

`main` = `0aae906`, pushed and level with `origin/main`; no ticket branch.
Typecheck clean, **995 tests / 64 files**, build clean.

## Related

- [[overview]] · [[active-work]] · [[decisions]]
- [[2026-08-04-an-empty-list-is-attributed-not-observed]]
- `.claude/vibe.md` — run that filed #98–#110
