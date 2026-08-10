---
type: decision
project: claude-wrapper
date: 2026-08-11
updated: 2026-08-11
tags: [context, decision, gui-drivers, testing, dom-phase, accessibility]
---

# A protocol nobody reads is not a protocol

## Decision

**#135 (`56a25cb`).** The DOM-level driver assertions execute, in a named phase:
`npm run test:dom` launches 29 drivers, one real Electron window each, about
seven minutes, and treats the exit code as the verdict. `drivers.manifest.mjs`
is now the single definition of the driver set, imported by both the phase and
the fast gate.

## The cheap part, and why it was cheap

The phase took almost no code, because **every driver already ended in
`process.exit(fails.length === 0 ? 0 : 1)`**. A machine-readable verdict had
shipped with the very first driver and, across thirty-eight tickets, the only
consumer was ever a human reading stdout. The gap was never the drivers. Nothing
called them.

Which is exactly how **`gui-42.mjs` came to print `FAIL` under an unconditional
`process.exit(0)`** and stay that way. It computed its verdict, printed it, and
threw it away. Any harness reading exit codes would have called it green
forever. It is fixed, and the *shape* is now caught rather than trusted: a
printed FAIL under a zero exit is reported as `LIED`, because the next driver to
do this will not announce itself either.

**Generalises as: a protocol nobody reads is not a protocol.** A convention that
has never had a consumer has never been tested, so its violations accumulate in
silence and look exactly like compliance.

## The empty state: the assertion was wrong, not the copy

`gui-91.mjs` had been red for three waves of the `core-surfaces` gauntlet on
`.bg-sessions-empty`. It asserted `textContent === 'None running here'` on the
**container**, which holds two authored lines.

```
textContent : "None running hereScoped to the open project."
innerText   : ["None running here","Scoped to the open project."]
```

The container is `display: flex; flex-direction: column`, so the answer and the
note are two separate boxes. `textContent` walks text nodes and inserts nothing
for a box boundary. The assertion was right while the container held one string
and became a **whole-versus-part comparison** the moment the note shipped beside
it — silently, because nothing ran it.

**The rejected option** was to put a separator into the markup so the fused read
looks right. Rejected twice over: it edits shipped markup to suit a measuring
instrument, which is the same move as adjusting a capture to make a hash go
green; and it fixes nothing anybody experiences, because the two lines are
already two boxes.

## The correction that matters more than the fix

The replacement pin was **vacuous for the case that mattered**, and the AC2
break is what proved it. The first version asserted `innerText` gave two lines.
Flipping the container to `flex-direction: row` puts the note *beside* the
answer — and `innerText` **still reported two lines**, because flex items are
block-level boxes whichever direction the container runs them.

So the pin is two checks now: `innerText` catches the note being deleted or made
inline; **box geometry** (`hint.top >= answer.bottom`) catches the side-by-side.

**Generalises as: a pin you have not seen fail is a pin you have not written.**
The break that demonstrates a check is real is also the only thing that tells
you which failure it is blind to.

## What the split is, and what it costs

| | `npm test` | `npm run test:dom` |
|---|---|---|
| runs | `*.source.mjs` pure checks | the drivers themselves |
| cost | milliseconds | ~7 min, 29 app launches |
| sees CSS | **no** | yes |

Proved on one build, with `.bg-sessions-empty` broken to `row`: **`npm test`
passed 35/35** while the phase failed naming the driver, the criterion and the
offending coordinates. jsdom loads no CSS, so the fast gate structurally cannot
see a layout regression. That is the whole reason D4 exists, and now the drivers
that make D4 real actually run.

## Accounting, because a phase that skips quietly is the same bug one level up

Nine drivers are not launched, each for a fact about the driver rather than a
preference, in three categories:

- **`api-cost`** (7) — drives real CLI turns. A phase that spends money per run
  gets switched off.
- **`no-verdict`** (1) — computes no pass/fail, so its exit code would report a
  green that measured nothing. Worse than a skip, because a skip is legible.
- **`desktop-exclusive`** (1) — its witness *is* the desktop foreground.

Four new fast-gate tests assert every driver is launched or skipped with a
substantive categorised reason. Add a driver and forget to place it and
`npm test` reds naming it, in milliseconds.

A driver that merely **spawns** the CLI without starting a turn is not skipped:
that costs nothing, and on a machine with no `claude` on PATH the driver's own
assertion reds saying so. A real failure, not a skip.

## The two reds the first run found

**`gui-119` — quarantined, with the measurement.** Passes alone twice (all three
re-asserts recorded, stress 8/8), fails in the batch (zero calls, 7/8). The
keeper is wired; what a batch measures is the foreground. The
`desktop-exclusive` category carries a deliberately high bar — an entry needs
the driver *passing alone and failing in the batch, measured* — because it is
otherwise the perfect bin for reds people gave up on. Tracked as #145.

**`gui-123` — left RED.** Reuse control unreachable by Tab in 60 presses,
reproducibly, alone and in the batch. This work changed no file under `src/`, so
the binary is identical to `main`'s. Tracked as #143. **A red nobody can explain
is not a red anybody may silence**, so the phase exits 1 on it today.

## Related

- [[2026-08-11-a-check-nobody-runs-is-not-a-check]] — #132, the pure half
- [[2026-08-11-a-ban-that-lives-in-prose-does-not-run]] — same shape, copy instead of drivers
- [[active-work]] · [[pick-up]]
