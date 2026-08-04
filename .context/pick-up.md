---
type: pick-up
project: claude-wrapper
updated: 2026-08-04
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Landed this leg (2026-08-04) — #107, `7e62f9e`

**The rail can no longer delete the session a turn is streaming into.** The
refusal is decided in main now, in `src/main/delete-guard.ts` —
`guardedDelete(ports, id)` over `isBusy` / `runningId` / `remove`, bound in the
`session:delete` handler. Only the running id is refused; a foreign session
stays deletable mid-turn.

The rail's `disabled={active && busy}` compares against the renderer's
`activeSessionId`, written only at `turn-end` — so through the whole first turn
of a fresh conversation the renderer holds null, the row is not `active`, and its
trash button unlinks a `.jsonl` the CLI is still appending to. Main has held that
id since `init`, so the two sources cannot disagree: the renderer has no opinion
to disagree with. `index.ts`'s "second busy source" comment is rewritten rather
than deleted.

`App.deleteSession` now asks main which row is on screen when the renderer has
nothing — `turn-aborted` and `error` clear `busy` without reading the id back, so
that state outlives the turn.

Premise reproduced first; guard mutation-verified twice. `tests/sidebar.test.tsx`
untouched (AC4 literally). Gate green: typecheck clean, **1009 tests / 66 files**
(998 + 11), build clean.

## Frontier: FIVE OPEN, ALL `ready-for-agent`, NONE `ready-for-human`

**Next unblocked, lowest-numbered: #108.** Live `blocked_by` is 0 for all five.
Run the query anyway — it is the authority over this table, and this line has
been wrong before.

```text
gh issue list --state open --label ready-for-agent
gh api repos/EstarinAzx/claude-wrapper/issues/<n> --jq '.issue_dependencies_summary.blocked_by'
```

| # | subject | blocked by |
|---|---|---|
| **108** | **spike** — second send / hung interrupt lifecycle | — |
| **109** | send during workspace resolve tears down live turn | — |
| **110** | close inside debounce drops final window bounds | — |
| **111** | close between turns strands an open subagent row | — |
| **112** | pill click empties the model menu and slash commands | — |

`ready-for-human` is forbidden while owner is AFK. Stuck ticket keeps
`ready-for-agent`, gets a precise comment, and stops the relay.

## What #108 requires

**A SPIKE, and it must stay one** — harness in `scripts/`, scrubbed findings
JSON in the `spike-97-findings.json` shape, a ticket comment stating
reachability per claim, and **no `src/` diff**. Two mechanisms are confirmed by
reading; neither's reachability is established.

**Claim 1 — the overlap rejection clears busy on a live turn.** `engine.ts`'s
`if (turnResolve !== null)` emits `{ type: 'error' }` to the **second** call's
`onEvent`, and the renderer treats every `error` as turn-terminal
(`setBusy(false)`) while the first turn still holds `turnResolve`. `chat:send`
in main has no busy guard. Open because `useChat.send`'s own guard reads `busy`
from React state, so a true double-submit inside one render tick reads `false`
twice — and #80's queue may already close it in practice.

**Claim 2 — Stop has no local completion path.** `interrupt()` sets
`interrupting = true` and calls `currentQuery?.interrupt?.().catch(() => {})`.
Nothing else. The turn completes locally only when a `result` arrives and
`finishTurn()` runs; if the CLI never sends one, `turnResolve` never resolves
and the UI is stuck busy with no way out but a restart.

## #108 landmines

- **Instrument main to COUNT sends.** Do not infer claim 1 from the UI —
  `useChat.send`'s busy guard swallows a second send without a trace, so one
  send and two are indistinguishable from the DOM. #80's `gui-80.mjs` already
  solved this exact problem: a **second `ipcMain.on('chat:send')` listener added
  in main** beside the real one (`on` appends where `handle` would throw). Copy
  it.
- **The composer is never `disabled`** — standing landmine. Do not "fix" claim 1
  by disabling it.
- **Do not add a second busy flag.** `lastTurn` records how a turn *ended*,
  which is a different question. Explicit standing rule.
- **Do not pre-empt either remedy.** Claim 1's fix must not make the renderer
  ignore `error` events generally (that hides real turn failures); claim 2's
  must not resolve the turn optimistically on Stop (`turn-aborted` has a real
  meaning, and faking it makes a still-running CLI invisible). Both are
  follow-up tickets.
- **`result.subtype` is `'success'` even on a failed turn** — `is_error` is the
  field that says so. A naive instrument reports a clean zero indistinguishable
  from a real negative.
- **A turn dying BETWEEN turns emits nothing.**
- Drive the **mid-tool-call** Stop case; it is the one most likely to differ.
- #104 (subagents undrained on the success branch) is related but separate and
  already has a decided remedy — do not merge them.
- Killing either premise is a **successful outcome** (#78, #84, #105 are the
  precedents).

## Still-live batch landmines

- **`gui-52`'s red is DOUBTFUL, and chasing it is out of scope.** Recorded
  across `.context/` as *"the CLI returning an empty model list"*, but #105
  measured the CLI returning **15 models** here, and `chat:target` is a fourth
  `discardEngine` caller (#77's *"by contract"* note). `gui-52` was **not** run
  — a hypothesis, filed in #112's out-of-scope.
- `gui-75` still has a standing environmental red (focus-dependent); reproduce
  solo before treating it as a regression.
- Never hardcode a model name. Never read `~/.claude/daemon/roster.json`.
- Absence assertions need a surviving positive control and mutation evidence.
- **A single sample cannot measure an asynchronous event** (#104, then #105).
  Poll and report the delay as a number.
- **A stub that fails everything measures less than one that fails
  selectively** (#106) — install the failure by name so the control still runs
  through the real code.
- **A mocked refusal asserts the harness** (#107) — bind the real decision
  behind the seam when the decision is what the test is about.
- Ticket baselines are stale: #108 says 979 tests, `main` is at **1009**.
- Squash-merged ticket branches need `git branch -D`.

## Do not decide these

AFK grant does not reopen standing calls outside this seed:

1. Tailwind adopt-utilities half.
2. Titlebar control count, pinned at 8.
3. Whether 12px is the right line box for 11px muted descriptions.
4. Whether the accent clause enumeration changes after #97.
5. Whether the glass ban reaches a `var(--surface)` pane.

## Baseline

`main` = `7e62f9e`, pushed and level with `origin/main`; no ticket branch.
Typecheck clean, **1009 tests / 66 files**, build clean.

## Related

- [[overview]] · [[active-work]] · [[decisions]]
- [[2026-08-04-a-refusal-belongs-where-the-fact-lives]]
- `.claude/vibe.md` — run that filed #98–#110
