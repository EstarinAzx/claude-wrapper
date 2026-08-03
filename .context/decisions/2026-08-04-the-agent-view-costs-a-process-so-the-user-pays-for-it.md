---
type: decision
project: claude-wrapper
date: 2026-08-04
updated: 2026-08-04
tags: [context, decision]
---

# The agent view costs a process, so the user pays for it deliberately

**#91 — `src/main/agent-view.ts`, a section in the sessions rail.** The app can
now list the workspace's **live background Claude Code sessions**. Two things
about it are architectural rather than cosmetic, and both are recorded here:
this module **re-adds a `child_process` spawn** the codebase deliberately
removed, and it is **the app's only pull-only surface** — nothing refreshes it
but a user action.

## The spawn, and why cli-path's rule does not forbid it

`cli-path.ts` says, in a comment that has been load-bearing since #53:

> Resolution is a plain PATH walk rather than a `which` shell-out ON PURPOSE:
> #53 deleted the app's only child_process use, and reintroducing one here to
> answer a question `fs.existsSync` can answer would be a poor trade.

That reasoning is intact, and it does not reach this ticket. It is conditioned on
*"a question `fs.existsSync` can answer"*. #90 established that this question has
no such answer:

- **The SDK has no background-session listing.** All 29 exports were enumerated
  and probed against a real session. The two name-level matches
  (`getSubagentMessages`, `listSubagents`) are subagent helpers scoped to one
  session — the repo's third meaning of "agent". `listSessions()` returns
  **stored transcripts**, carrying no `state`, no `kind`, no `pid`.
- **The on-disk stores do not reproduce the listing.** `sessions/` covered 2 of
  6 active rows and `daemon/roster.json` 1 of 6. The CLI performs a **join**.
  Reimplementing it to dodge the spawn would be wrong *and* would mean reading a
  file that carries `rvAuth` / `ptyAuth`, socket paths and `dispatch.env` —
  **attach credentials**. That file is never read, never logged, never surfaced.
- **There is no push channel.** `claude agents --help` has no live flag.

So the trade is the opposite of #53's: there, a shell-out bought nothing over
`existsSync`; here it is the only route to the data at all. The spawn reuses
`cli-path.ts`'s own resolution, so this listing cannot drift from the CLI whose
sessions it lists, and it takes `backend-mode.ts`'s `getSpawnEnv` so a
native-mode app does not quietly shell out through the wisp proxy.

**What this costs, stated plainly:** the app now starts a second kind of child
process, on a path the SDK does not manage. A `claude` that is missing, renamed
or hung is now a visible failure in the rail rather than nothing at all — which
is why the failure is an honest `null` with its own copy, not an empty list.

## Pull-only is a measurement, not a preference

#90: **median 893 ms per look, one whole CLI process, no warm path.** The cost is
per *refresh*, not per session. A 5 s poll is ~19% of a core, continuously; 30 s
is ~3%. And the staleness window **equals the poll interval**, so a list that
refreshes itself is not merely expensive, it is *routinely wrong while claiming
to be live*.

A snapshot the user asked for is honestly a snapshot. So:

- **The refresh button is the only repopulation**, plus one automatic look when
  the **workspace changes** — the previous answer there is not stale, it is
  about a different directory.
- **Not on window focus**, unlike the stored list beside it, which is a cheap
  disk read. `tests/background-sessions.test.tsx` asserts focus still drives
  `listSessions` while leaving the look alone, so that absence is a measurement.
- **No timer anywhere**, in main or the renderer. `gui-91.mjs` counts looks over
  eight idle seconds *through the real IPC channel*, then clicks refresh to prove
  the counter can move.

## What the surface is, and what it deliberately is not

A **section**, in the sessions rail, above the stored transcripts. Not a dock:
#86.1 decided that a non-agent panel joins an existing surface as its own
section, which dissolves the deadlock (no new titlebar control **and** every dock
opens from a toggle **and** no router) that had gated this ticket since
2026-08-02. **A section needs no toggle.** The titlebar control count is still 8,
pinned in both the suite and the driver.

**The rail rather than the Agents dock**, because the rail is this app's session
surface while the dock's scope is *inside* the open session — and because the
rail was already the dangerous lookalike, having a scope control and so *looking*
like it lists running work. Putting the live list there, labelled, makes the
difference visible instead of implied. Cheap to move; still the owner's call.

**Out of scope, explicitly: attach, peek, reply, dispatch.** #90 left them
unmeasured and they are the larger feature. The consequence in the markup is that
rows carry **no interactive element at all** — this section adds exactly one tab
stop (its refresh button) to a rail that already has about a hundred.

## Three shapes the data forces

1. **`sessionId` is the only universal key.** `id` is absent on interactive rows
   and is only an 8-char prefix where it exists. Rows are keyed on `sessionId`
   and a nameless row falls back to showing it.
2. **`state` is rendered as the raw string.** Four values were measured where
   three were predicted (`working` was unpredicted) and the set is **open**. No
   allow-list, no per-value colour, no icon — each would render an unknown state
   as nothing. `gui-91` pushes a deliberately unpredicted value and asserts it
   appears verbatim.
3. **`pid` and `status` are not carried at all.** They describe a live OS process
   while `state` describes a background row. #90's finding is that **no single
   field describes a row's liveness**; carrying both here would invite exactly
   the unified "is it alive" boolean that finding rules out.

## The absence that had to be proved

**The app is in its own listing.** #90 ran a real `query()` at `engine.ts`'s
options and watched the app's own session appear as `kind: "interactive"`, and
established that `cwd` cannot exclude it — the app lists the workspace its own
session lives in. Filtering to `kind === 'background'` drops it for free, and the
same filter is what makes the list background-only.

An absence assertion that passes on an empty list measures nothing, and this
project has been bitten by that four times (#76, #82, #93, #94). So the test
feeds **two background rows plus the interactive one** and asserts both the
survivors and the drop — and the filter was **mutation-verified**: replacing
`kind !== 'background'` with `false` reds that test and only that test.

## Scoping is delegated to the CLI

`--cwd` is passed straight through. #90 measured that it filters by directory
across **both** kinds and that the result equals filtering the unscoped listing
by `cwd` — but also that *whether it matches by prefix or exactly is
**unmeasured***, because no session was running below the test directory. Letting
the CLI own that means this app never has to decide whether a session one
directory down belongs to the workspace, and inherits the answer if it changes.
`gui-91` opens a **temp** workspace and asserts zero rows come back, which is the
one end-to-end check that the scoping happens at all.

## Related

- [[2026-08-03-background-sessions-are-reachable-at-one-process-per-look]] —
  **#90, every number this decision spends**
- [[2026-08-04-the-parked-owner-calls-are-taken]] — #86.1, the "a section, not a
  dock" call that unblocked this
- [[2026-08-02-the-entrypoint-is-a-fact-about-the-launch-env]] — #89, why
  `entrypoint` cannot separate the app's own sessions from anything
- [[flows]] — the agent-view name-collision table. **Say which "agent" you mean**
- [[overview]] · [[active-work]] · [[decisions]]
