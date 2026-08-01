---
type: decision
project: claude-wrapper
date: 2026-08-01
updated: 2026-08-01
tags: [context, decision, agents, react]
---

# A refresh must not blank what it already has — #82

**Decision:** the Agents dock re-reads its sidecars on the positive `turn-end`
plus #80's nonce, and the read carries a **`keepStale` flag** so that a session
change and a same-session re-read do opposite things with the state that is
already on screen. Landed as `3f34737`.

## The defect was a dependency that could only change once

`AgentsDock`'s only disk trigger was its read effect's `[sessionId]` dep, and
`useChat.ts` writes `setActiveSessionId` **inside the `turn-end` branch**:

```ts
setBusy(false)
setLastTurn(endedTurn('turn-end'))
void window.api.currentSessionId().then((id) => {
  if (id) setActiveSessionId(id)
})
```

So the id moves `null → id` on turn ONE and never again. Turns 2..N could not
change the dep, and the effect was **structurally incapable of firing** in
exactly the window where subagents spawn and nest. With the dock left open, they
never appeared.

This is the shape worth carrying: *a value written once per session cannot be
the trigger for something that happens once per turn.* The suite was green
throughout, because a `[sessionId]` effect does fire — just not a second time.

## Why the second dep was rejected

The effect was **destructive before it was productive**. It ran
`setState({ status: 'loading' })` ahead of every read, and the merge reads
`state.status === 'ok' ? state.agents : []`. Adding a dep would therefore have
made every refresh blank the disk rows — and nested edges come from the sidecars
alone ([[2026-07-25-agent-tree-edge-is-the-sidecar]]), so the whole tree shape
would flicker out and back **at the one moment the user is watching the panel
change**. A transient failure would have replaced a known-good snapshot with
`unreadable`.

## The flag belongs on the READ, not on the effect

The two callers want opposite treatment of what is on screen, and that is the
only thing they disagree about:

- **`keepStale: false` — a different session.** Clear first: the previous
  session's agents under a new session's name is worse than nothing. A failure
  reports `unreadable`, because there is no earlier answer to fall back on.
- **`keepStale: true` — the same session, re-read.** Touch nothing until the new
  list is in hand, and keep the last good rows if the read fails. A transient
  error is not news worth destroying a correct snapshot over, and the next turn
  re-reads anyway.

One callback, one flag, both effects call it. The alternative — two read paths —
would have let the null/empty contract ([[2026-07-25-agents-dock-disk-contract]])
drift between them.

Same shape as the sessions rail, which holds its list "rather than showing a gap
that the next refresh" fills. **Stale-while-revalidate is this app's house rule
for a re-read, not a new idea invented here.**

## The trigger is the outcome, and the nonce is the clock

`LastTurn` is taken **whole**: the outcome decides WHETHER to read, the nonce
decides WHEN. Never `busy === false` — all three terminal outcomes clear busy, so
a not-busy rule re-reads after Stop and after a failed turn too. That is #80's
finding ([[2026-08-01-a-queued-prompt-is-a-flag-on-the-draft]]) applied to a
second consumer, and it is now the second time this codebase has needed it.

Two details are load-bearing and neither is obvious:

- **The nonce is consumed whatever the outcome was.** A stopped turn advances the
  seen-nonce and reads nothing. Skipping the bookkeeping on the outcomes that do
  not read would leave a stale nonce behind to fire on some later render.
- **The seen-nonce is SEEDED from the turn already ended at mount.** The common
  real order is "run a turn, then open the panel to look at it" — the mount read
  already covers that turn, and firing the trigger for it too reads the same
  directory twice for one event.

## What was NOT built

All four stayed inside the ticket's Out of scope, and each for a stated reason:

- **No level-signal trigger.** `background_tasks_changed` fires *during* the turn
  and is strictly more precise, but it needs the injected port and IPC channel
  that do not exist yet. **That is #83**, and it is the upgrade path.
- **No `parentAgentId` on `LiveAgent`** — the actual reversal #31's ADR names, and
  a different decision.
- **No new `window.api` channel.** `subagents:list` already exists and already
  carries `isTrustedIpc`.
- **No `gui-82` driver.** Unlike #74's sandbox flag or #79's bounds, every surface
  here is React state over a channel jsdom already mocks, so a driver would
  assert nothing vitest cannot see. The 22-driver batch was re-run anyway because
  renderer code changed, and was green.

## Tests

The suite had **zero** `toHaveBeenCalledTimes`; its assertions were
`toHaveBeenCalledWith`-shaped, which a trigger that never fires satisfies just as
well as one that does. Seven added, four mutants killed:

| Mutant | Reddens |
|---|---|
| blank before every read | both stale-while-revalidate pins |
| a failed re-read always downgrades | the snapshot pin |
| drop the `outcome !== 'turn-end'` guard | `a stopped or failed turn does not re-read` |
| drop the mount seed | `opening the dock after a turn has ended reads once, not twice` |

The in-flight test asserts the read really is in flight
(`toHaveBeenCalledTimes(2)`) before asserting the rows survived — without that it
would pass against a dock that never re-read at all. **An assertion that
something SURVIVED is vacuous unless the thing it survives is shown to have
happened.**

## Reversibility

Cheap. The trigger is one effect and the flag is one boolean; removing both
restores the old behaviour exactly. #83 will replace the trigger with the level
signal and leave `keepStale` alone — that is the point of splitting them.

## Related

- [[decisions]] · [[active-work]] · [[pick-up]]
- [[2026-08-01-the-background-agents-seed-decided]] — call 4, which authorised this and named both the trigger and stale-while-revalidate in advance
- [[2026-08-01-a-queued-prompt-is-a-flag-on-the-draft]] — #80, where `LastTurn` and its nonce came from, and where "positive trigger, never the absence of a state" was found
- [[2026-07-25-agents-dock-disk-contract]] — the `null` vs `[]` split this preserves
- [[2026-07-25-agent-tree-edge-is-the-sidecar]] — why blanking the disk rows takes the tree with it
- [[2026-08-01-background-tasks-changed-fires-and-the-ids-join]] — #81, the measurement behind the #83 upgrade path
