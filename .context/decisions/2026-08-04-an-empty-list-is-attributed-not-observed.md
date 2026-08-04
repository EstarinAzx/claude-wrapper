---
type: decision
project: claude-wrapper
date: 2026-08-04
updated: 2026-08-04
tags: [context, decision]
---

# An empty list is attributed, never observed

**#105 (`0aae906`) — spike, no `src/` diff.** Picking a model leaves both live
read channels empty until the next send. That was the claim; this is what it
took to establish it, and the method is the part worth keeping.

## The premise is confirmed on all three writers

`model:set`, `permission:set-mode` and `backend:set-mode` each call
`discardEngine` and rebuild nothing, while both live read channels are answered
straight off that handle — `engine?.listCommands() ?? []` and
`(await engine?.listModels()) ?? []`. Driving the **built app over its own IPC**,
one writer apart, **no prompt sent**:

| writer | models | commands | warmed runs |
|---|---|---|---|
| `model:set` | 15 → **0** | 119 → **0** | 2/2 |
| `permission:set-mode` | 15 → **0** | 119 → **0** | 2/2 |
| `backend:set-mode` | 15 → **0** | 119 → **0** | 2/2 |

## The confound had to be killed at the source, not reasoned around

The ticket's own warning was that **an empty model list in this sandbox is
indistinguishable from a null engine** — `gui-52` carries a standing
environmental red for exactly that, and `gui-96` observed the model menu at
`rows: 1`. An instrument that reads one empty array and reports a defect is
measuring nothing.

So the emptiness is **attributed**, in three phases, each removing one candidate
cause:

- **Phase A — ask the CLI directly, no Electron in the picture.** Through the
  app's real `cli-path.ts` and `backend-mode.ts`, with `engine.ts`'s option
  shape: **119 commands, 15 models**. The stated confound is *false in this
  environment*, and after that an empty app list cannot be blamed on the CLI.
- **Phase B — assert the source rather than recall it.** The three writers
  discard and rebuild nothing; `session:pick-folder` rebuilds *and* warms. The
  asymmetry the ticket claimed is pinned to real lines, and the harness fails
  loudly if the code moves under it.
- **Phase C — drive the real app.** Same window, same main process, same CLI,
  seconds apart. A difference across that pair cannot be the sandbox, the CLI's
  mood, or the driver's setup order (#77), because none of them changed. Only
  the writer did.

## The witness that made it evidence: the SDK's query is a child process

The ticket asked that *"engine is null"* be observable **separately** from *"the
CLI returned no models"*, and not inferred from an empty array. It is, because
engine teardown has an **OS-level signature**: the SDK's query is a child
process of Electron's main process, so the harness walks the process tree and
counts CLI descendants of the main pid either side of each writer. That number
is produced by the operating system and knows nothing about any array.

**In 2 of 6 runs the app answered `[]` on both channels while that CLI child was
still running.** The lists were empty at an instant when the process that had
just supplied 15 and 119 was alive — which attributes the emptiness to the
nulled handle in `main` rather than to the CLI being gone, without inferring
either from the other's absence.

**The instrument was wrong first, and in the direction that reads as a finding.**
The original version sampled the process count once, 600ms after the write, and
reported *"engine still alive"* on the runs where the process had merely not
died yet — conflating *not dead* with *not torn down*. Polling instead turns a
noisy boolean into a number: all 6 runs tear down, between **600ms and 1456ms**.
This is #104's landmine recurring one ticket later — **a single sample cannot
measure an asynchronous event**, and a harness is production code for as long as
the question it answers is open.

## Why it was invisible: the label and the list have different sources

`model:list`'s `current` comes from `model-mode.ts`, not from the engine. So the
pill goes on displaying the model you just picked while the menu behind it holds
only its static Default row (measured: `labelSurvivesTheEmptyList: true`). **The
UI looks correct at exactly the moment it stops working**, which is why a
second model change is impossible without sending a turn and nobody reported it.

## The "honest empty state" comment is not superseded — it is out of scope

`commands:list` carries the comment *"[] with no engine or no live query: the
dock's honest empty state"*, and the ticket rightly asked whether the finding
was a misread of a deliberate design. It is honest for the state it was written
about — **no engine yet**, before a folder has ever been picked. It is not
honest here: the engine existed a moment ago, the CLI is alive with 119
commands, and the app reports none. The comment describes a startup state, not a
post-pill one.

## The remedy is at the READ, and the number is what decides it

Filed as **#112**, not implemented here.

- **Recommended — rebuild lazily in the two read handlers.** `commands:list` and
  `model:list` are the only consumers needing a live query for a list. Rebuilding
  when the handle is null puts the cost where the user actually looks, and a
  user who picks a model then sends a prompt pays nothing extra.
- **Rejected — rebuild+warm inside `discardEngine`.** Measured at **min 1237ms /
  median 1539ms / max 3074ms**: a CLI process spawned on *every* model,
  permission and backend click, paid even by someone who never opens a menu
  again. The ticket called this "a behaviour and resource trade, not a repair";
  it is now a number rather than an intuition.
- **Rejected — cache the last non-empty list.** Cheaper, but both handlers carry
  an explicit no-cache contract in their own comments, and a cached model list is
  *wrong* across a backend flip where the list legitimately changes. Anyone
  taking this route is reversing a stated design and must say so out loud.

**The fix's sharpest failure mode is `pendingResume`.** `resume` binds when the
query is CONSTRUCTED (#73), so a bare `warmUp()` leaves the rebuilt engine on a
fresh session while the pane, refilled from disk, looks correct. `discardEngine`
already stores the right value per path — `sessionId()` for model and
permission, `null` for the backend flip's deliberate fresh start — so threading
`pendingResume` handles all three uniformly **because** the asymmetry is already
encoded there.

## Adjacent, unverified, and deliberately not chased

`gui-52`'s standing red is recorded across `.context/` as *"the CLI returning an
empty model list"*. Phase A shows the CLI returning **15 models** here, which
makes that attribution doubtful — and #77 already documented that `openSession`
→ `targetSession` closes the engine, `chat:target` being a **fourth** caller of
`discardEngine`. So the driver may be reading its own setup order rather than an
empty CLI.

**This is a hypothesis. `gui-52` was not run** — one ticket per leg — and it is
recorded in #112's out-of-scope rather than assumed. It needs its own check
before anyone acts on it.

## Reversibility

Fully reversible: nothing shipped. The harness and findings are additive files
under `scripts/`, and `src/` is untouched — confirmed by `git diff --stat --
src/`. Re-running `scripts/spike-105-model-pick-channels.mjs` after #112 lands
is itself the fix's end-to-end evidence: phase C's AFTER counts should stop
being zero.

## Related

- [[decisions]] · [[overview]] · [[pick-up]]
- [[2026-08-04-a-late-subagent-edge-is-a-race-and-reachability-is-the-finding]] —
  the instrument-review lesson this spike hit again one ticket later
- [[2026-08-04-the-ground-cancels-in-a-token-differential]] — the other harness
  whose design is a cause-separation rather than a measurement
