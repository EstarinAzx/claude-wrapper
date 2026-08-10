---
type: active-work
project: claude-wrapper
updated: 2026-08-11
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-11 by Opus 5, relay chain 6 leg 5 — owner away_
_At commit: `ed81559` on `main`_

## Current focus

**#136 landed: the session title centres on the window.** The centre slot was
sized by what its neighbours left over, so the title drifted by half the
difference between the flanking groups, plus half the container's asymmetric
left padding.

**One ticket remains — #137 — and taking it empties the frontier**, which is
this chain's stop condition.

## State

- **In flight:** nothing. `ticket/136-centre-session-title` was squash-merged and
  deleted. Tree clean on `main`.
- **Closed 2026-08-11 (leg 5):** **#136** (`ed81559`). **Filed: #147**,
  `needs-triage`.
- **Open:** #137 (`ready-for-agent`) · #138, #139, #140 (`ready-for-human`)
  · #141–#147 (`needs-triage`). **Frontier: #137 alone**, blocker #133 closed.
- **Gate on `main` after the merge:** typecheck clean, build clean,
  **88 files / 1325 passed + 36 skipped** (was 88 / 1321 + 36; the +4 are
  gui-136's source checks). Ran on the branch and again on `main`.
  **Read the number off `main`, never off this file.**
- **DOM phase: 29/30**, the single red being `gui-123` (#143), unchanged.
- **NOT PUSHED. Seventeen commits sit local.** D6 stands. Read the real gap:
  `git rev-list --count origin/main..main`.

## What #136 actually was

The offset obeyed `(L - R)/2 + padLeft/2`, measured against prediction in four
flank states and correct to a tenth of a pixel every time:

| state | left | right | predicted | measured |
|---|---|---|---|---|
| welcome (no dock toggles) | 261.8 | 120.0 | +77.9 | +77.9 |
| project open (the ticket's case) | 261.8 | 233.0 | +21.4 | +21.4 |
| one status pill absent | 196.4 | 233.0 | -11.3 | -11.3 |
| no status pills | 127.7 | 233.0 | -45.7 | -45.7 |

**The ticket measured only the docks-open state at +21. The welcome screen — the
first thing every user sees — was at +77.9.**

Fix: `flex: 1` on both flanks (equal grow from a zero basis gives equal boxes for
any contents), `flex: 0 1 auto` on the slot so there is free space to split, and
`justify-content: flex-end` on the right flank. The 14px inset moved onto
`.logo-mark` — **inside** the left flank's content. On a flank's **box** it
re-creates the defect at +7css, because `box-sizing: border-box` widens a
`flex-basis: 0` box by its padding on top of the grow. `min-width: 0` came off
`.titlebar-left` so the automatic min-content floor keeps #72's no-overlap
guarantee.

**At the 640px minimum, centring and non-overlap are mutually exclusive** — the
flanks bottom out on their contents and a symmetric slot would start inside the
left group. The driver asserts the honest thing there (`offset = (L - R)/2`,
the maximal slot) rather than a zero.

## The mutation that nearly got through

Reverting `.titlebar-center` to `flex: 1` makes all three titlebar children split
into **equal thirds**, which *also* centres the title. **10 of the 12 driver rows
still passed.** It is caught only by the 640px row and by the source-level check.
Measuring at the ticket's own 1440 alone would have shipped a different, worse
layout as a green — the title capped at a third of the window.

The other two mutations: restoring the container padding reds at +7 **with the
flanks still exactly equal**, so a flank-equality check alone would miss it;
restoring `min-width: 0` collapses the left flank to 40.1css at 640 while it
still paints 262css, putting the title underneath it.

## The instrument lesson, which cost four phase runs

`gui-136` reded `gui-69` and `gui-70` — both of which pass alone. Attribution:

| run | #136 CSS fix | gui-136 in batch | result |
|---|---|---|---|
| baseline on `main` | no | no | 28/29 — gui-123 only |
| first, then repeated clean | yes | yes | 27/30 — gui-123 + gui-69 + gui-70 |
| isolating | yes | **no** | 28/29 — gui-123 only |
| after the private profile | yes | yes | 29/30 — gui-123 only |

**Cause:** the driver pins window bounds and zoom, and both outlive the process —
bounds are remembered (#79, #110), zoom persists per origin in `userData` and in
the renderer's localStorage. Written to the shared profile, later drivers
inherited them. **Fix:** a private `--user-data-dir` per launch. Filed generally
as **#147**.

Three carried forward, in full in
[[2026-08-11-the-batch-is-the-instrument-and-a-teardown-is-a-promise]]:

1. **The batch is the instrument.** The adjacency check (suspect then victim)
   passed and was taken as exoneration. Wrong — the effect accumulates through
   the intervening launches.
2. **A teardown is a promise that goes unkept precisely when it matters.**
   Restoring state on exit does not run when a driver throws or times out, which
   is the population that dirties the profile. Isolation is a property.
3. **"Passes alone, fails in the batch" is a question, not a category.** Two
   healthy drivers were one shrug from a `desktop-exclusive` quarantine for
   another driver's bug.

Plus: **a verdict must be parsed, and the shell can lose it.** The phase's
verdict was read off `npm run test:dom | tail -60`, whose exit status is
`tail`'s — reported 0 while the text said `DOM PHASE FAIL`. #125's rule reaches
one level further out than it was written.

## Pick up here

**Run the frontier query first — it is the authority:**

```text
gh issue list --state open --label ready-for-agent
```

**#137 is the only free ticket, and it empties the queue.** Its AC2 cannot be
satisfied as written: `titlebar.png` is not byte-stable, because `.session-title`
renders `basename(cwd)` and the fixture workspace is `mkdtemp`'d (#142). #136
moved that element's box but not the string it renders, so the randomness is
unchanged — though every stored titlebar capture now differs from a fresh one by
a real layout change as well as by noise. Hash the other six surfaces and treat
the titlebar by box and content, or resolve #142 first. **Do not silently adjust
a capture to green a hash.**

## Skills for next session

- **Do not push on your own initiative.** See State.
- **Do not apply `ready-for-human`** — banned for this batch. Use `needs-info` +
  a comment + a `PushNotification`.
- **File follow-ups at `needs-triage`, never `ready-for-agent`.**
- **Any CSS change owes a driver pin that runs** (D4), and say which gate it runs
  in. The titlebar's centring is now load-bearing — see pick-up constraint 4.
- **A driver that pins bounds or zoom needs its own `--user-data-dir`** (#147).
- **Do not pipe the DOM phase through `tail`.** Redirect to a file and grep it.
- **Clean `scripts/` after any phase run** (#146): `git checkout -- scripts/`
  then `git clean -fdq scripts/`.

## Open questions

**TWO** live owner-calls in `.claude/vibe.md` under `## Needs you`, both
reversible with the default already taken. **SEVEN older ones live in
`.claude/vibe-130.md`** — every reference pointing at `.claude/vibe.md` for those
is stale. Plus **#138–#140** (`ready-for-human`) and the gauntlet stop-signal
question recorded as owner call 14 in `.claude/gauntlet.md`.

**#144's uncomfortable question is now sharper.** AC4 of #136 demanded a pin that
"must actually run in the gate", and the gate structurally cannot see a layout
defect. The measurement runs only in the DOM phase, and nothing runs that phase
automatically because the repo has no CI. The executing pin exists; the thing
that would make it bite on every push does not.

## Related

- [[overview]] · [[pick-up]] · [[decisions]] · [[stack]] · [[happy-path]] · [[flows]]
- [[2026-08-11-the-batch-is-the-instrument-and-a-teardown-is-a-promise]]
- [[2026-08-11-a-protocol-nobody-reads-is-not-a-protocol]]
- [[2026-08-11-a-check-nobody-runs-is-not-a-check]]
