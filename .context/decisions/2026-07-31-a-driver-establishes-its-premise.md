---
type: decision
project: claude-wrapper
updated: 2026-07-31
tags: [context, decisions, testing, drivers, sessions-rail]
---

# A driver establishes the premise it asserts

**Decision:** A `gui-*.mjs` driver that depends on app state a user can change
must **set that state itself**, through the real control, before it measures
anything. `gui-45` and `gui-47` both assert a cross-project session rail; both
now click the **All projects** chip first. Clicked rather than seeded into
`localStorage`, because seeding only works if the rail mounts after the write —
a mount-ordering assumption the rail's own driver already documents as a trap.

**Why:** The rail ships scoped to the open project. Neither driver said so, so
both inherited whatever `sidebar-scope` the machine last stored — which is
written by *other drivers*. Their verdicts were a function of run order.

The damage was not the red. `gui-45` failing on three counts was loud and is
what #65 was written about. `gui-47` failing on one count was the quiet half:
with only one group on screen it also **skipped three of its four sections** —
the ok path, the missing-cwd refusal, the foreign/local colour comparison —
and reported them as `SKIPPED ... no second real project in the store`. The
driver covering #47's entire workspace-switch transaction had degraded to
verifying essentially nothing, while printing a line that reads like a note
about the environment rather than a hole in the gate.

**A SKIPPED section is a hole in the gate.** These drivers earn their keep by
running against the owner's real store, and that store is not a fixture — it
changes under them. Degrading gracefully is the right behaviour; degrading
*silently to near-zero coverage* is what a premise-establishing step prevents.
Read the SKIPPED lines, and treat a driver that skipped most of itself as
unverified rather than as green.

**The same rule retired a second assertion.** `gui-45` required that at least
two project groups match the query `playground`, on the strength of a comment
recording that the machine had six sibling `playground` directories. It no
longer does. That assertion was pinning a developer's disk layout, and it
cannot be repaired by establishing a premise because the premise is somebody's
filesystem. Replaced with two facts that hold on any store: a partial query
**narrows** the list (140 of 680), and it matches at least everything the full
path it contains matched (114). That needed a matched **total** rather than a
row count, since every survey below the 100-row cap reads as exactly 100 and no
two filters could otherwise be compared at all.

**Not to be confused with weakening a pin.** The retired assertions were
inverted by design (#47 made foreign rows openable) or were claims about the
environment. The rule that a red pin means the change is wrong is untouched,
and no expectation was widened to fit an observed number — which is precisely
the move #71 is warned off.

**Reversibility:** easy

## Related

- [[decisions]] — index
- [[2026-07-28-the-session-list-is-global-scoping-is-a-render-concern]] — the
  global rail this driver was written against, before the scope chip
- [[2026-07-28-a-workspace-reset-is-a-remount-not-a-state-sweep]] — the #47
  transaction `gui-47` had stopped covering
- [[active-work]] · [[pick-up]]
