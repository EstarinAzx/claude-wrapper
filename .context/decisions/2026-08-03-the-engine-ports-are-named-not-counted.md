---
type: decision
project: claude-wrapper
date: 2026-08-03
updated: 2026-08-03
tags: [context, decision]
---

# The engine's ports are named, not counted

**Owner-directed architecture pass, no ticket — landed as `c7cee33`.** Two
changes, both to the main process, both interface-level; no port semantics
moved and no behaviour changed. Gate green: typecheck clean, **953 tests
across 63 files** (baseline unchanged), all touched files 100% CRLF.

## What changed

**1. `createEngine` slots 4–10 fold into one optional `EnginePorts` object.**
The constructor had grown to ten positional parameters: three real arguments
(`getCwd`, `requestPermission`, `queryFn`) followed by seven port/getter slots,
one added per feature — #52 `onModelReport`, #73 `onTerminal`, #83
`onBackgroundTasks` beside the option getters. Reaching the newest slot meant
counting placeholders past every earlier one: the test injecting
`onBackgroundTasks` passed **seven** `() => ({})`-shaped placeholders to arrive
at slot ten. The three-arg form is untouched — all **83** three-arg test
constructions are byte-identical — while the six placeholder-laden sites and
two single-line `getEnv` sites collapsed to named keys. Every load-bearing
comment (the #52/#73/#83 rationales for why each port is not an `EngineEvent`)
moved intact onto the `EnginePorts` type.

**2. `index.ts` gains `discardEngine(resume)`.** The teardown ritual — close
the engine (which fires the per-process background-task reset), cancel pending
permissions, null the handle, set the resume target — was hand-copied at five
IPC sites: folder pick, `chat:target`, backend flip, permission cycle, model
pick. That is the "must join the ok branch by hand" failure class this
codebase keeps re-learning, applied to teardown instead of state. The only
per-path difference is what the next conversation resumes, so that is the
argument: an id keeps the conversation (permission/model pick read
`engine?.sessionId() ?? pendingResume` **before** the call), null starts
fresh (folder pick, backend flip).

## What deliberately did not change

- **The switch transaction keeps its own port-sequenced teardown.**
  `runSwitchWorkspace` validates between the steps, so routing it through the
  funnel would delete the validation windows. Not an inconsistency to tidy.
- **All port semantics.** `onTerminal` still never fires for `close()`;
  `onBackgroundTasks` still fires `[]` there; the reset still lives in
  `engine.close()`, not `makeEngine()`.
- **Candidates assessed and rejected:** a `handleMessage` split (internal to a
  deep module — depth is a property of the interface, and the interface did
  not need it), the titlebar dock-prop pair (owner-deferred), Tailwind's fate
  (owner call), every renderer state move (the ledger names each available
  "tidying" as a regression).

## Why now

The next injected port is already visible: #86's MCP-health seed, if its owner
call ever lands, wants exactly the #52/#73/#83 shape and would have been slot
eleven. It now costs one named key. Typecheck was the working gate — it caught
two single-line 4-arg sites the multi-line sweep missed, before the suite ran.
