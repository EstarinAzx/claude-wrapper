---
type: decision
project: claude-wrapper
date: 2026-08-11
updated: 2026-08-11
tags: [context, decision, testing, gui-drivers, instrument, accessibility]
---

# A symptom that left is not a defect that was fixed

## Decision

**#143 (`1c42d3c`).** `gui-123.mjs` no longer guesses how far away the control it
is looking for might be. Two changes, and the second only exists because of the
first:

- **Phase 1b pins the rail and reads it back**, ahead of every measurement in the
  driver. Scope is forced to `project` against a workspace `mkdtemp` made seconds
  earlier, which no stored session can name, so the rail is empty *by
  construction*. If the pin does not take, the run says so and stops.
- **The Tab traversal's budget is derived** — one full cycle of the document's own
  visible focusables, counted per run — and `gui-123.source.mjs` pins that in the
  fast gate.

## The trap this ticket was written to avoid, and it was live

The stock driver **passed on the first run of this leg**, `reached: true`,
exit 0. The ticket's own triage had predicted exactly that and forbidden closing
on it: #148 had just made the rail deterministic elsewhere, so a green here would
have been #148's, and the driver would have kept its dependency on machine state
with the ticket marked done.

So the red was **reproduced on demand** rather than waited for, and that is the
transferable half of this entry. A defect whose symptom is controlled by state
you can set is a defect you can summon; until you have summoned it you do not
know what you fixed.

## What actually decided the verdict

Not the store's *size*. A **persisted toggle**.

| rail scope | rows rendered | focusables in document | control lands on press |
|---|---|---|---|
| `This project`, mkdtemp workspace | 0 | 17 | 16 |
| `All projects` | 100 | 218 | **218** |

The rail sits ahead of the transcript in the tab order, caps its render at 100
rows, and carries two tab stops per row. This machine's store holds **977
sessions across 194 project directories**, so the cap is what is being hit.

The scope toggle **survives relaunch** — a second launch, new process, brand-new
workspace, still came up on `All projects`. That is what makes the ticket's
green-then-red flip explicable without anything accumulating: the first phase run
had the toggle one way and the three after it had it the other.

Head to head, from an identical `All projects` profile:

- the **original** driver off `HEAD` — `FAIL — the reuse control could not be
  reached with Tab in 60 presses`, the ticket's text verbatim.
- the **new** driver — `RAILPIN {"scope":"This project","rows":0,"pinnedHere":true}`,
  then `PASS`.

## Why the fast gate holds the budget rule and the DOM phase cannot

A reverted constant **does not red the DOM phase** on a normal machine: at the
default scope the rail contributes 0 rows and 60 presses is generous. It only
reds once somebody has left the toggle flipped. So the browser half is
structurally blind to this regression in exactly the configuration it runs in,
and the check belongs where it runs every time — the same argument
`tests/driver-screenshot-dir.test.ts` already makes for a driver's output path.

That check's own sidecar strips full-line comments before matching, because the
prose explaining the defect necessarily quotes the number the check bans.

## Position was load-bearing, and the first draft had it wrong

The pin was written **inside phase 4** first. Phase 3 then read a mid-transition
`opacity: 0.823757` under hover, on a renderer still laying out 100 rail rows it
did not need — a 150ms transition read after a fixed 300ms wait. That is the same
defect as the tab budget wearing different clothes.

It was fixed by moving the pin above every measurement, **not** by lengthening
the wait. The settle after the scope click is a `waitForFunction` on the state
the run needs, because writing a fresh hardcoded wait into the fix for a
hardcoded wait would have been absurd.

## Four mutations, four distinct reds

| mutation | red |
|---|---|
| budget back to `i < 60` | fast gate names the offending `for` header |
| driver pins `All projects` | read-back reds at 100 rows, **before** a press is spent |
| control given `tabindex="-1"` | `reached:false, presses:28, budget:28` |
| `.session-scope-btn` renamed | premise red, `saw []` |

The third is the control, and it is the one worth keeping. A derived budget that
could no longer fail would be a worse instrument than a wrong one — the check
still catches a control genuinely out of the tab order, which is the thing it was
written for.

## The product question, separated from the instrument question

**The control is keyboard reachable**: press 16 of 18, in `:focus-visible`, ring
computing. That is settled.

**A keyboard user at `All projects` crosses 208 rail tab stops before any message
content**, with no skip mechanism. That is a real finding and a design decision
about where the rail sits in the tab order, so it went to **#152** at
`needs-triage` rather than into a driver assertion. Keeping the two apart is the
point: the driver may only claim what it established.

## Reversibility

**Reversible.** Deleting phase 1b and restoring a constant returns the previous
behaviour; the sidecar would then be dead and go with it.

**Accepted ceiling, written beside the code:** the pin **writes to the shared
Electron profile**, leaving `This project` behind for whatever runs next.
Restoring the previous value was considered and rejected — the only value there
is to restore is the one that made this driver red, and handing it to the next
driver is precisely the failure **#147** is about. A private profile per driver
is that ticket's fix.

## Related

- [[decisions]] · [[overview]] · [[active-work]]
- [[2026-08-11-the-premise-is-what-feeds-the-surface-not-what-two-runs-agree-on]] —
  #148, whose read-back-the-fixture rule is applied here to a surface the driver
  pins rather than stubs.
- [[2026-08-11-a-check-nobody-runs-is-not-a-check]] — the same argument one level
  up; here the check ran, and was blind in the configuration it ran in.
- [[2026-08-11-a-behavioural-constraint-cannot-be-pinned-as-text]] — the limit
  this entry respects: the sidecar pins the *budget's shape*, never the claim
  that the control is reachable.
