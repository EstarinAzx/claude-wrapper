---
type: decision
project: claude-wrapper
updated: 2026-07-30
tags: [context, decisions, toolcards, diff, testing]
---

# A mutation that kills nothing is an answer, not a gap in the tests

**Decision:** `lineDiff` ships with **no coalescing pass**. Spec #58 and ticket #63 both sketched one — buffer a run's removals and additions, flush removals first — and it was written, mutated away, and killed **zero** tests. The response was not "add a test for it" but "find out why", and the answer was that the code is unreachable: the walk cannot interleave. The buffer was deleted and the ordering is now documented as a property of the tie-break.

**Why:** The project's standing rule is that if mutating the code under test kills nothing, the mutated code may not be what makes the tests pass. Applied honestly it cuts both ways — usually it means the test is weak, but sometimes it means the *code* is decoration. Here it was the code.

Proof: taking an addition at `(i,j)` means `dp[i+1][j] < dp[i][j+1]`. At `(i,j+1)`, if the lines still differ, `dp[i][j+1] = max(dp[i+1][j+1], dp[i][j+2])` and `dp[i+1][j+1] <= dp[i+1][j] < dp[i][j+1]`, so `dp[i][j+2] = dp[i][j+1] > dp[i+1][j+1]` — again exactly the condition for an addition. A run can only ever go deletions-then-additions; it can never go back. An exhaustive search agreed: **212,162 pairs** over 2- and 3-letter alphabets (lengths ≤ 7 and ≤ 5), buffered against unbuffered, **zero** differences.

So removals precede additions because of the `>=` tie-break in the walk, not because anything reorders them afterwards. Flipping that `>=` to `>` reddens **three** tests; the buffer reddened none. The test that used to be described as pinning "coalescing" now says what it actually pins.

The cost of getting this wrong in the other direction is the point: a "test the coalescing" ticket would have added an assertion that passes under both implementations, leaving ~12 lines of dead code looking load-bearing and permanently mutation-immune. Adding a test to cover a surviving mutant is the reflex to distrust.

**Reversibility:** easy to re-add, but do not — re-adding it restores code no test can distinguish. If the walk's tie-break or its direction ever changes, re-derive the property before assuming it still holds.

## Related

- [[decisions]] — index
- [[2026-07-30-a-diff-without-a-baseline-is-worse-than-none]] — the diff this simplifies
- [[active-work]]
