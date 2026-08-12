---
type: decision
project: claude-wrapper
date: 2026-08-12
updated: 2026-08-12
tags: [context, decision, testing, flakes, instrument]
---

# Awaiting the mechanism is half a fix, and the timeout that finishes it is bounded at both ends

## Decision

#153 (`5267ede`) changes one line of `tests/session-title-enrichment.test.tsx`. The
pin `only a rendered row with a bare command title reads a transcript` stops waiting
on the rendered enriched label and waits on the mechanism instead, with an explicit
**3000ms** timeout:

```tsx
await waitFor(() => expect(harness.api.titleHint).toHaveBeenCalledWith('cmd', FOLDER), {
  timeout: 3000
})
```

The now-duplicate `toHaveBeenCalledWith` assertion below it is dropped. `idsAsked()`
and `toHaveBeenCalledTimes(1)` are untouched.

| half | what it holds | gate |
|---|---|---|
| mechanism | the qualifying row requested a read, with the right id and cwd | `npm test` |
| scope | only that row asked, exactly once | `npm test` |
| diagnostic | the wait names the call it wanted when it fails, rather than timing out the test | mutation only |

## Why

**The ticket's preferred shape is only half a fix, and the missing half is the part
that looks like it is already handled.**

`findByText` and `waitFor` read the **same** `asyncUtilTimeout`, which is `1000`
(`node_modules/@testing-library/dom/dist/config.js:15`). So swapping one for the
other does not remove a fixed 1000ms window — it changes what has to happen inside
it. Before: a hint resolve, a React commit, and a text query across a 100-row page.
After: only that the read was requested. That is strictly less work, and it is also
what the file header names as this test's subject, so the swap is right on the
merits. But on its own it **narrows** the race rather than closing it, and for a
ticket whose whole complaint is that `main` is intermittently red, narrowing is the
wrong finish.

Hence the explicit timeout. **The non-obvious part is that it has an upper bound as
well as a lower one.**

- **Above 1000ms** for headroom against the observed contention. One of the original
  failing runs reported `environment 1346s` against a 193s wall clock.
- **Below vitest's 5000ms `testTimeout`**, which this repo does not override.

A first attempt used 5000ms — equal to the test cap — and the mutation run is what
caught the cost. The test-level guillotine fires before `waitFor` can report itself,
and the failure degrades from

```
AssertionError: expected "vi.fn()" to be called with arguments: [ 'cmd', 'D:\projects\demo' ]
```

into a bare `Test timed out in 5000ms` pointing at the test **declaration**. A
`waitFor` timeout at or above `testTimeout` is incoherent: it cannot ever be reached,
and reaching for it destroys the diagnostic. **A wait must leave room for its own
error message.**

**No coverage is given up, and that was read rather than assumed.** Two sibling tests
in the same file already hold what this one stops holding: `the enriched label is what
the row shows and filters on` pins the label reaching the row, and `remounting the rail
does not read the transcript again` pins that no re-render triggers a second read,
waiting for the label to render before asserting `toHaveBeenCalledTimes(1)` across two
remounts.

**The pattern does not generalise, and checking that is what produced the follow-up.**
The two remaining async-derived DOM waits in this file cannot drop their DOM read
without losing their point — for the remount test the rendered label is precisely what
makes `toHaveBeenCalledTimes(1)` mean *the cache served it* rather than *the row never
mounted*. Both also render 1-2 rows rather than 100, which is why only this pin ever
failed across seven runs. Treating them would need the timeout lever, and that turned
out to be repo-wide rather than file-local: **390 async waits across 34 test files,
zero `configure()` calls anywhere, and `vitest.config.ts` has no `setupFiles`** for a
global Testing Library config to live in. Filed as **#162** at `needs-triage` rather
than detoured into.

**An intermittent's fix is claimed with a rate, not a green.** Prior rate was 4 reds
in 7. Six sequential full suites all green, 96 files / 1406 passed / 44 skipped, no
worker-crash reds; if the rate were unchanged that is ~0.6% likely (`0.43^6`). Stated
rather than buried: the original seven ran on chain 7 leg 5's pre-merge tree and these
six on merged `main` plus the fix, so it is not a controlled comparison. The mutation
proof carries the *assertion still has teeth* half; the run count carries the *flake is
gone* half. Neither alone would be enough, because **retiring the ticket that tracks an
intermittent is worse than the intermittent** if the fix is unproven.

## Reversibility

**Cheap.** One line in one test file, no source change (`enriched-titles.ts` is
byte-identical, hash `96fc85738a447b0c6659f77b9cd1c012`). Reverting restores the old
`findByText` and the old flake.

The number is the part most likely to want revisiting, and it is bounded rather than
chosen: any replacement must stay above 1000ms and strictly below `testTimeout`. If
`vitest.config.ts` ever sets `testTimeout`, or #162 lands a global `asyncUtilTimeout`,
this per-assertion timeout should be re-read against it rather than left as a stray
constant.

## Related

- [[decisions]] · [[active-work]] · [[pick-up]] · [[overview]]
- [[2026-08-11-a-test-built-on-ambient-state-measures-the-ambient-state]] — the sibling
  one turn out: there a test measured the working tree instead of the function, here a
  test measured the machine's spare capacity instead of the mechanism.
- [[2026-08-11-a-check-nobody-runs-is-not-a-check]]
- [[2026-08-11-a-green-inherited-from-the-machine-is-not-evidence]] — the same class of
  error read from the other end: a green that came from the machine rather than the code.
