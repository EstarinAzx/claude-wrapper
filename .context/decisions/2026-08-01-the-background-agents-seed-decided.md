---
type: decision
project: claude-wrapper
date: 2026-08-01
updated: 2026-08-01
tags: [context, decision, agents]
---

# The background-agents seed, decided — all seven parked calls taken

**Decision:** the owner made an autonomy grant live on 2026-08-01, after #81
landed. All seven calls parked in `.claude/vibe.md` → `## Needs you` are taken
here. **Two authorise work** (both filed as tickets), **four are closed as no**,
**one is struck**.

The grant removes *ownership* as a ground for deferring. It does not lower the
evidence bar, and it does not overturn the record: where the record already
argued a call one way, the decision follows the record rather than the seed.
Four of the seven are decided **against** the seed's literal words for that
reason.

## The seven

### 1. What "background" means in the seed → the SDK's background-task concept

**Confirmed, and now measured rather than assumed.** #81 observed
`background_tasks_changed` firing on host CLI 2.1.220, with ids that join
`taskToParent` and the sidecars, carrying `local_bash` beside `local_agent`.

The two alternatives are unwarranted: a **cross-session view of agents from
sessions not currently open** appears nowhere in the seed's words, and
**multi-engine concurrency** is on record as "a different project". The seed says
*background*, *tasks* and *children*; the SDK concept is all three, and it is live.

### 2. Node boxes — a labelled map → **NO**

The seed's most literal request, and the one the record argues against. Warrants,
both in [[2026-07-25-map-geometry-is-a-pure-slot-layout]]:

> "The map carries no baked text. Nothing legible fits at a 180px panel, so
> identity lives in each node's `aria-label` and `<title>`. **The list stays the
> labelled view; the map is the shape view.**"

> "**Per-node captions** — cannot fit, and conditional labels would make the
> picture jump between agent counts."

That is a **principle plus a mechanism**, not a width complaint, and the
mechanism survives a wider container: labels that appear and disappear with agent
count make the picture unstable at exactly the moment the user is watching it
change. Identity already ships — `aria-label` and `<title>`, the latter a native
hover tooltip. Closed as **no**, not deferred.

### 3. A new top-level surface → **NO**. Background tasks join the Agents dock.

Every dock opens from a titlebar toggle and nowhere else (`aria-label="Agents
panel"` in `Titlebar.tsx`), and the app has no router, so a fourth surface costs
a fourth titlebar control. **Choosing the existing dock sidesteps the parked
titlebar-aesthetics call rather than pre-empting it** — that call stays the
owner's and this decision does not touch it.

### 4. The Agents-dock refresh trigger → **BUILD IT**, on `turn-end` + nonce, with stale-while-revalidate

The one call with a defect, a verified blast radius and a shipped fix pattern.

- **The defect is real and narrow.** `useChat.ts` writes `setActiveSessionId`
  **inside the `turn-end` branch**, so the dock's only trigger — `[sessionId]` on
  its read effect — cannot change on turns 2..N. First turn works (`null → id`).
  Dock left open, second turn onward: nothing re-reads.
- **The naive fix has two regressions, both at source.** The effect runs
  `setState({ status: 'loading' })` **before every read**, and the merge is
  `mergeAgents(state.status === 'ok' ? state.agents : [], liveAgents)` — so any
  re-read blanks the disk rows, nested edges (disk-only by construction) flicker
  out and back, and a transient failure replaces a known-good snapshot with
  `unreadable`. Hence **stale-while-revalidate**, not a second dep.
- **The pattern ships next door.** `Sidebar.tsx` refreshes on mount, on
  `[cwd, activeId]`, on `window` focus, and from a manual button.
- **The trigger already exists in state.** #80 built `LastTurn` with its nonce
  precisely so two turns ending the same way are two events. Reuse it; do not
  invent a second signal, and never trigger on `busy === false`.

**Not triggered off the level signal**, though that would fire *during* the turn
and is strictly more precise. It needs the whole port + IPC chain from call 6
first, and the defect does not need it. Named as the upgrade path.

### 5. Non-agent background work in the panel → **YES**, as its own section, fed by the level signal

This is the call the vibe run got wrong for a good reason — it had no
measurement. The mutation-verified exclusion is in `engine.ts`:

> `// local_bash tasks share this stream; only real agents become rows.`
> `if (str(src.task_type) !== 'local_agent') return`

**That guard governs which *task messages become subagent rows and events*.** #81
measured the level signal as a **second, independent source** that carries
`local_bash` (its condition C3). A background-tasks section fed from the level
therefore leaves the guard untouched: nothing is reversed, the Bash test stays
green, and the amend-don't-reverse rule is satisfied rather than argued around.

**They must not merge into the agent rows.** A `local_bash` task has no sidecar,
no `parentToolUseId` and no usage — merging it into `mergeAgents` re-creates the
exact "a disk-only row starts claiming it used 0 tokens" failure
[[2026-07-25-agents-dock-disk-contract]] exists to prevent.

### 6. Injected port or `EngineEvent` → **PORT**. Measured, no taste half left.

#81 measured a level event landing **3.3s after `result`**, where `finishTurn()`
has already nulled `activeOnEvent` — so an `EngineEvent` is dropped in exactly
the case the signal exists for. Same shape as #52's `onModelReport` and #73's
`onTerminal`. Closed.

### 7. Map pan-zoom → **STRUCK**

Two warrants, and they point the same way:

> "dividing a fixed canvas is what makes a wide fan fit **without pan or zoom**"
> — [[2026-07-25-map-geometry-is-a-pure-slot-layout]]

> `// ponytail: radius floors at R_MIN, so past ~40 leaves the outermost nodes`
> `// would clip the canvas edge. Real sessions top out around 28 (28 sidecars`
> `// is the largest observed) and 28 still fits. Inset the slot span by the`
> `// radius if a fan-out ever gets wide enough to matter.` — `agent-layout.ts`

The fixed canvas is the *reason* pan-zoom is unnecessary, and the one named
ceiling has a different, cheaper recorded fix. **Nothing anywhere states what
pan-zoom was meant to solve** — `active-work.md` names the phrase and nothing
else. Reconstructing intent from a phrase is not warranted even under a grant, so
this is struck from the deferred list rather than carried forever. Re-file it if
a real complaint ever attaches to it.

## Why

Four calls decided against the seed's literal words, and that is the point of
keeping a record: the seed is the only source of *intent*, but it is not evidence
about *this codebase*. A grant that flipped every deferred call to "yes" would
just be the seed re-read louder.

The two that authorise work do so on different footings. Call 4 fixes a defect
that exists today, with the trigger already built and the regressions already
mapped. Call 5 became buildable only because #81 measured a **second source** —
before that measurement it looked like a reversal of a mutation-verified
decision, which is why the vibe run correctly declined it.

## Reversibility

Every one of the seven is reversible, and none has been built here. Calls 2, 3
and 7 are re-openable by a single owner sentence; they are closed on the record's
reasons, and a new reason reopens them. Calls 4 and 5 are filed as tickets, so
reversing them costs closing an issue. Call 6 is an observation, invalidated only
by a CLI change — re-run `scripts/spike-81-background-tasks.mjs`.

## Related

- [[decisions]] · [[active-work]] · [[pick-up]]
- [[2026-08-01-background-tasks-changed-fires-and-the-ids-join]] — #81, the measurement four of these calls waited on
- [[2026-07-25-map-geometry-is-a-pure-slot-layout]] — the warrant closing calls 2 and 7
- [[2026-07-25-agent-tree-edge-is-the-sidecar]] — where the tree's parent edge comes from
- [[2026-07-25-agents-dock-disk-contract]] — the null/empty split call 5 must not collapse
- [[2026-07-25-live-rows-two-sources-one-event]] — the mutation-verified `local_bash` exclusion call 5 amends rather than reverses
- `.claude/vibe.md` — the run that parked all seven
