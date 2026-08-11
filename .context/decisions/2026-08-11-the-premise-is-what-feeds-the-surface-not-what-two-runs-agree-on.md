---
type: decision
project: claude-wrapper
date: 2026-08-11
updated: 2026-08-11
tags: [context, decision, testing, gui-drivers, instrument]
---

# The premise is what feeds the surface, not what two runs agree on

## Decision

**#148 (`f60b40a`).** The sessions rail `inspect.mjs` photographs is a fixture.
**Both** of its lists are replaced in main, at the same boundary and for the same
stated reason `commands:list` already is: `session:list` (the stored transcripts)
and `background-sessions:list` (the CLI's live agent view). The decision itself
lives in **`inspect-sessions.mjs`**, not in the driver, because the driver cannot
be imported without launching Electron — #142's split, applied a second time.

The instrument's header claim that *the whole instrument is fixture-driven* was
false about this one surface for two tickets, which is why `sidebar.png` and
`window-session.png` were the only captures that could never be byte-compared and
why #137 had to exclude them from its own acceptance.

## Why the acceptance is not a byte comparison

**The obvious check passes on unfixed code, and this was already known before the
work started.** #142's leg ran `inspect.mjs` four times and byte-compared
everything; `sidebar.png` and `window-session.png` came back identical across all
four, on a rail that was still listing 953 real sessions. Two runs minutes apart
on one machine see the same store, so they are trivially equal. The instability is
**across machines and across time**.

So the premise is argued from **what feeds the surface**, and it was measured two
ways rather than asserted:

- **Off the committed evidence.** The rail's `N sessions outside this project`
  footer reads **950, 951, 952 and 953** in waves 2, 3, 4 and 5 — the audit's
  prediction for wave 4 was made before opening it and confirmed — and **976** on
  a run today. That is the machine's real session count and it only goes up. It is
  also the *only* real-store value that reaches the pixels: the ~100 rows the
  ticket found in `aside.sidebar`'s innerHTML sit below a 658px fold and never
  photograph.
- **Off the driver's own log.** The sidebar surface reported **7125 characters**
  of rail content against a fixture seeding exactly one session. It now reports
  **550**.

Three clean runs afterwards gave 11/11 byte-identical captures. That is recorded
as corroboration and explicitly **not** as the evidence, because it is the same
check that passed on the defect.

## Which check catches which failure was measured, not assumed

The driver reads the rail back and compares it to the fixture **before any
capture**, because a stub that silently failed to install would photograph real
session data with every other check still green.

Four checks, and disabling the stub showed they are not interchangeable:

- The **row count** is what catches a stub that did not install — verified red at
  `{"rows":1,"foot":"976 sessions outside this project","expect":{"rows":5,"outside":12}}`.
- The **stray-title** check, which the first draft of the comment called *"the one
  that matters"*, **does not fire there at all**. Under `project` scope the real
  store can only ever contribute the seeded session, whose title the fixture also
  carries. It earns its place against the **scope pin** failing instead, and the
  comment was corrected to say what the red run showed rather than what the design
  intended.
- The **footer** catches a list of the right length and the wrong set, since that
  count is derived from the whole array rather than from the rows.
- The **background rows** catch the second stub alone.

## A relative age needs an offset, not a timestamp

The rail renders a *relative* age, so a fixed epoch value renders a different
string every day and fixes nothing. Every row is an offset from run time with at
least **20 minutes** of headroom before its `relTime` bucket ticks — only upward,
since the offsets are stamped once at script start.

The seeded row is deliberately **not** `now`. That is a 60-second bucket, the one
label a slow run can tick through under itself, and it is exactly what the old
seeded row rendered because its age came from a file written seconds earlier.

The four bucket boundaries are restated in the test and **re-read out of
`Sidebar.tsx`**, so changing the formatter reds here rather than surfacing later
as a capture nobody can diff.

## A fixture must not leave the surface less representative than what it replaced

The rail carries **five** rows, not the one it showed before. This is the half
most likely to read as scope creep, so the reasoning is stated: the rail is
photographed **to be judged on row rhythm**, and one row shows a critic nothing
about rhythm. It is the same argument this instrument already makes for its chat
transcript being two turns and two tool cards rather than a single "hello".

Replacing a real list with a fixture is an opportunity to quietly shrink what a
surface can be graded on, and that shrinkage would look exactly like the fix
working.

## What the audit of the committed captures found

Only wave 5 had ever been checked. Opening the rest:

- **No real session title appears in any committed capture**, in any wave. The one
  row rendered is the fixture. This confirms and extends the correction already
  made at triage, which had been verified on wave 5 alone.
- The rail exists only in `sidebar.png` and `window-session.png`.
  **`window-welcome.png` has no rail at all** — a hypothesis that the welcome
  stage would render an unscoped rail (with `cwd` null, `groupSessions` degrades
  `project` to `all`) was **refuted by opening the picture**, which is the right
  order.
- What is exposed is the foreign-session count, fixed here, and a **Windows
  username** in the fixture temp path. That second one is **not** a property of
  the listing — it is a property of where the fixture workspace lives, every
  reliable fix is platform-specific, and folding it in would have smuggled a
  directory change into a listing ticket. Filed as **#151** at `needs-triage`.

## The real listing stays covered, checked rather than assumed

Cross-model review's objection at triage was that swapping in a fixture removes
whatever the surface exercised for real. No new test was added, because three
already cover it and were verified: `tests/session-store.test.ts` (unit),
`tests/session-store-live.test.ts` (**against a real store on disk**), and
**`gui-63.mjs`**, which drives the built app and finds a seeded row through the
**real** `session:list` — it installs no `ipcMain` stub at all.

## Reversibility

**Reversible.** Deleting the two `app.evaluate` stubs restores the previous
behaviour; `inspect-sessions.mjs` and its test would then be dead and go with it.

What is *not* free to reverse is the captures: every future wave's `sidebar.png`
and `window-session.png` differ from waves 1–5 by design, so a wave-to-wave
comparison across the #148 boundary compares two different fixtures. That is the
intended trade — before it, those two files could not be compared at all.

**Accepted ceiling**, written beside the code: the stubs install before
`app.firstWindow()`. A renderer that called `session:list` earlier than that would
paint once from the real list. It does not today, and the read-back would catch
it.

## Related

- [[decisions]] · [[overview]] · [[active-work]]
- [[2026-08-11-a-behavioural-constraint-cannot-be-pinned-as-text]] — #142, which
  split `inspect-workspace.mjs` out of the driver for the same reason and left the
  warning that decided this ticket's acceptance.
- [[2026-08-11-the-noise-floor-is-part-of-the-instrument]] — #137, which separated
  the two superimposed instabilities by removing a cause, and filed this one.
- [[2026-08-10-a-blank-capture-is-proven-in-the-dom-not-in-the-pixels]] — the same
  instrument's rule that a surface is proven in the DOM before it is photographed.
  The rail read-back is that rule applied to a surface's *provenance* rather than
  to its presence.
