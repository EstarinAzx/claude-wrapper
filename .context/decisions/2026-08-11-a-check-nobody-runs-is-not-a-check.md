---
type: decision
project: claude-wrapper
date: 2026-08-11
updated: 2026-08-11
tags: [context, decision, testing, gui-drivers]
---

# A check nobody runs is not a check

## Decision

**#132 (`78afd56`).** The GUI drivers' source-level assertions run in `npm test`,
through a convention rather than a list: a driver `gui-<n>.mjs` ships a sibling
**`gui-<n>.source.mjs`** exporting `checks: { name, run() }[]`, where `run()` is
pure — no browser, no Electron, no `out/` artifact, no network, no clock — and
returns `{ ok, detail }`. `tests/gui-source-assertions.test.ts` globs for those
sidecars, so a new one is picked up with **no wiring** in the harness and none in
`vitest.config.ts`.

**The driver imports the same array** and feeds it to its own `check()`. That is
the load-bearing half: the alternative — copy the assertion into a test and leave
the original in the driver — has two definitions of one contract, and the repo
would then have to decide which copy is real every time one changed.

**Drivers with no sidecar are reported as named SKIPS, never omitted**, and the
reason is split two ways because they are genuinely different failures: *browser-
level* (needs a live window — #135) and *build-artifact* (`gui-75` and `gui-93`
read `out/`, and the gate does not build — split out as #141). Three accounting
tests keep the classification honest: at least one sidecar must exist, every
sidecar must name a real driver, and covered + skipped must equal the whole
driver set.

## Why

**Measured, not theorised.** About 38 `gui-*.mjs` drivers encode real contracts
and `npm test` executed **none** of them. During the `core-surfaces` gauntlet run
one edit turned two driver assertions red and the **three consecutive gate runs
that followed all reported green**, because nothing ran them.

This compounds with the jsdom trap that makes the drivers necessary in the first
place: jsdom loads no CSS, so an unknown `var(--x)` resolves silently to nothing
and every raw-text pin still passes — #129 shipped two nonexistent tokens past
the entire suite that way. The project rule *"any CSS change owes a driver pin"*
is load-bearing **because** of that hole, and it was being discharged all run by
drivers that never executed.

**The survey came out smaller than the ticket assumed, and the smaller number is
the sharper finding.** The ticket estimated "roughly six" source-level
assertions. Reading every `fs.*` call across all 38 drivers found **five**
no-browser static assertions, of which only **three** are truly source-level
(`src/`/`styles/`), and one of those three was already pinned by
`tests/subagent-material.test.ts`. So the net-new gate coverage is **two
assertions** — gui-96's criteria 2 and 6.

Those two were pinned by **nothing else that runs**: grepping `tests/` for
`font-weight.*500`, `subagent-slide` and `translateY` returns nothing at all. The
keyframe axis pin and the weight grep were protected solely by a driver no one
executed. That is the ticket's premise confirmed by measurement rather than
assumed, and it is why the harness — not the three checks — is the deliverable.

**The build-artifact pair is excluded on the ticket's own bar.** `gui-75` and
`gui-93` read `out/`, and `npm test` does not build; gating on them reds a clean
checkout for a reason unrelated to the contract, which fails "deterministic,
fast, and safe to gate on". Excluding them silently would have been the exact
failure being closed, so they are named skips carrying that reason, and the
design question they raise (does the gate build? a second command? or does the
check move to source and get weaker?) went to #141 rather than being guessed at.

**Cost is not the constraint here.** Before: 69.15s / 63.40s. After: 63.53s /
61.10s, and 63.39s on `main` post-merge. The added phase is ~11–27ms of test
time; the totals differ by less than the baseline varies against itself.

## The red-verify is where the design was actually tested

The mutation that proves criterion 6 was placed in the **`to` stop only**
(`translateY(0)` → `translateX(0)`), leaving `from` untouched. That is deliberate
and it is the interesting part: a lazy `\{([\s\S]*?)\}` body extraction reads the
`from` block, sees `translateY`, sees no `translateX`, and **passes**. The
brace-counting extraction reads the whole body and reds, and the reported
`stops: 2` is the evidence it did. So the red run proves the check *and* proves
the check's implementation is load-bearing — a vacuity that would otherwise have
sat green forever.

Both mutations were restored and confirmed **byte-identical against git**, not
eyeballed.

## Reversibility

**Reversible, cheaply.** Deleting `tests/gui-source-assertions.test.ts` and the
two sidecars returns the repo to its prior state; the drivers would then need
their inline blocks restored from `78afd56^`.

The part that is *not* free to reverse is the convention: once other drivers grow
sidecars, moving to a different mechanism means touching each one. Nothing forces
adoption — a driver with no sidecar is legal and simply reports as skipped.

Note the convention **does not fit the build-artifact case as written** —
`run()` is specified pure, with no `out/` access. Extending it needs a second
export or a declared requirement flag, which is part of #141's design rather than
an afterthought.

## Related

- [[decisions]] · [[overview]] · [[active-work]]
- [[2026-08-10-a-blank-capture-is-proven-in-the-dom-not-in-the-pixels]] — the
  sibling instrument lesson from #131: an instrument's threshold is a
  measurement, not a constant. Same shape one level up — a check's *execution* is
  a fact to verify, not a property to assume.
