---
type: decision
project: claude-wrapper
updated: 2026-07-30
tags: [context, decisions, toolcards, diff]
---

# A diff without a baseline is worse than no diff

**Decision:** Edit renders a real replacement-hunk diff from its old and new strings, using a **local** line diff with **no new dependency**, hard-guarded at `oldLines * newLines <= 1_000_000` (above the guard: render unaligned before/after blocks instead of attempting the comparison). Write renders a **labelled content preview and never a diff**.

**Why:** Write supplies only a path and the content to write — there is no before-state anywhere in the event contract. Rendering that as green added lines would look authoritative while concealing whatever was overwritten, which is *worse* than showing nothing, because it manufactures confidence at exactly the moment a user is deciding. An honest Write diff needs main to read the file pre-approval; native checkpoint records exist but point at backup files rather than embedding before-content, so that is separate architecture.

On the dependency: measured across 1,140 historical Edit calls the combined old+new strings run median 532 chars, p95 2,844, max 10,148, and the largest alignment grid seen was 99×155 = 15,345 cells — roughly 65× under the guard. A local matrix + backtrack + run-coalescing + final-newline handling is ~45 production lines, so a dependency loses on the project's own laziness test ("beat a few lines, not merely be correct"). Reconsider only if honest whole-file Write comparison enters scope, or if real hunks approach the guard. The installed highlighter is a markdown plugin, computes no diffs, and is not available to the card — so semantic add/delete styling only.

**Reversibility:** easy for the diff implementation; the no-fabricated-Write-diff rule is the durable part and should not be reversed without a real baseline.

## Related

- [[decisions]] — index
- [[2026-07-30-disclosure-is-retention-plus-conditional-mount]]
- [[2026-07-30-inspection-is-universal-approval-safety-is-opt-in]]
- [[active-work]]
