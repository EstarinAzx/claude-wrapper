---
type: decision
project: claude-wrapper
date: 2026-07-28
updated: 2026-07-28
tags: [context, decision]
---

# The workspace switch is one transaction over ports, and busy is the engine's own state

**Decision:** #46 added `switchWorkspace({ cwd, resumeId })` as a single atomic
transaction. The logic lives in `src/main/switch-workspace.ts` as a pure function
over an injected `SwitchPorts`; `src/main/index.ts` exports the binding wired to
this process's real engine, permission broker and cwd. It merged **dormant** — no
IPC channel, no preload entry, no renderer reference — and #47 wires it.

**Why the logic is not in `index.ts`.** The ticket said to add it there, and the
binding is there. But the electron entry cannot be imported under vitest (it
registers `ipcMain` handlers and calls `app.whenReady()` at module scope), and
the two things that actually need testing here are invisible to a test that can
only observe the returned status:

- the **order** of the success path, and
- the **emptiness** of every rejection path.

An implementation that drops `warmUp()`, writes the resume target before the
rebuild, or tears the engine down before validating still returns `ok`. So the
transaction takes its collaborators as ports and the test asserts the call
sequence directly. This is the same seam `session-index.ts` uses for `StoreIo`.

**Precedence is fixed and total:** `busy → missing-cwd → not-found`. Overlapping
invalid input has exactly one answer. Every predicate runs **before the first
mutation**, which is what makes a rejection a genuine no-op rather than a partial
transition that happens to report failure.

**`resumeId: null` is a first-class case,** not a degenerate one: it means "open
this workspace with a new chat". It clears any prior target, **skips the index
entirely**, and still returns `ok`. Validating it would reject precisely the
empty-folder case #48 exists for.

**The `ok` sequence is authoritative:** `close engine → cancelAll permissions →
setSessionCwd → rebuild engine → set resumeId → warmUp()`. Note the resume write
lands **after** the rebuild — writing it earlier hands the target to the engine
being closed. Where this and any paraphrase of `session:pick-folder` disagree,
this sequence wins.

**Busy is read from the engine, not tracked.** `Engine.isBusy()` is new and is
literally `turnResolve !== null` — the same state `runTurn` already rejects a
second turn on. A separate flag is the tempting alternative and is wrong: it can
disagree with the engine that is actually busy. Until now the safety policy
existed only as **disabled renderer buttons**, while `session:pick-folder`,
`chat:target`, model, backend and permission changes all tore the engine down
unconditionally. Busy-switch **blocks, it does not detach** —
[[2026-07-23-busy-switch-block-not-detach]].

**Cost accepted:** one more module and an eight-method port interface for a
function of ~20 lines. Bought with it: every required assertion is expressible,
and the cross-process change stays reviewable and revertible in two halves.

**Reversibility:** Moderate for the file layout, low for the seam. Collapsing the
transaction back into `index.ts` costs the entire test surface. Merging #46 and
#47 into one ticket — the ticket's named sharpest failure mode — turns two
bounded changes into a cross-process rewrite that cannot be reviewed or reverted
independently.

**Mutation-verified.** Eight mutations, each killing exactly its target: drop
`warmUp()` (2), `setResume` before `rebuildEngine` (3), `setCwd` before
`cancelPermissions` (2), drop the busy check (2), invert the `missing-cwd` /
`not-found` precedence (3 — and a typecheck error), consult the index on a null
`resumeId` (2), `closeEngine()` before validation (9), `Engine.isBusy()` always
`false` (2).

## Related

- [[decisions]] · [[active-work]] · [[pick-up]]
- [[2026-07-28-storage-location-is-an-index-not-an-encoding]] — supplies
  `resolveResumeTarget`, this transaction's front door, and the typed
  `missing-cwd` rejection it passes straight through
- [[2026-07-28-the-session-list-is-global-scoping-is-a-render-concern]] — renders
  the four statuses this returns; its inert foreign rows are what #47 makes live
