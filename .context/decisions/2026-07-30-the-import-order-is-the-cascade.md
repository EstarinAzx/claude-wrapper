---
type: decision
project: claude-wrapper
updated: 2026-07-30
tags: [context, decision]
---

# The stylesheet is split by surface, and the import order IS the cascade

**Decision:** `src/renderer/src/styles.css` is now a **23-line entry file** holding nothing but the Tailwind layer setup and eleven `@import` lines. The rules live in `src/renderer/src/styles/`: `tokens` (98) · `base` (99, reset + the global scrollbar rule + reduced-motion) · `shared` (83, the five cross-cutting patterns) · `titlebar` (210) · `rails` (448, both rails + the three row shells + commands dock) · `agent-map` (96) · `chat` (194) · `composer` (354) · `tool-card` (257) · `markdown` (116) · `subagent` (134). Largest file **448 lines**, median 134.

**Why:** The complaint was that 2,000 lines is annoying to look at — a **file-length** problem, and a Tailwind utility migration is an expensive way to fix file length. Measured, that migration would have converted 192 of 252 rule blocks (781 declarations) into JSX and left 60 blocks behind as CSS anyway (markdown output and `.hljs-*` are generated markup, plus scrollbar/`::before`/`::placeholder` pseudo-elements, `@keyframes`, the reset and 20 combinator rules), while breaking **231 class-based assertions** across 24 test and driver files. The split delivers the same "stop staring at a wall" for no behavioural change at all. See [[2026-07-30-tailwind-here-is-a-token-system-not-a-utility-system]] for why the utility rewrite was declined on its own merits.

**The load-bearing part:** import order is the cascade, and the entry file says so. `tokens` → `base` → `shared` must stay first and in that order — the shared groups are single-class rules that every component override is at least as specific as, so they only work while they come earlier. **Reordering those `@import` lines silently restyles the app**, with no error and no failing test.

**How it was verified:** the split was done **mechanically by line range**, never retyped, so every rule body is carried across byte-identically. Then three checks. (1) Rule-sequence: parse the pre-split file and the concatenated split files and compare rule-by-rule — 252 before, 252 after, none lost or gained, and with the two intended moves excluded the sequence is **identical at every position**. (2) Compiled output: the bundle is **35,262 bytes before and after**, and `diff` shows exactly two hunks, both the intended moves — `@media (prefers-reduced-motion)` relocated into `base.css` (it is `!important`, so its position provably cannot matter) and the three `.command-row-*` rules ahead of `agent-map` (no selector overlap with anything in between). (3) typecheck clean, **725 tests green**, GUI drivers green with identical computed values.

**Constraints kept:** the two tests that read the stylesheet as TEXT now read the whole `styles/` **directory** rather than one file — deliberately, because a scoped scrollbar copy dropped into any component file is precisely the drift `tests/scrollbar.test.ts` exists to catch, and pinning `base.css` alone would have made it invisible. The assertions themselves are unchanged, so no pin was retired. `.bubble` and `.message-input` must still stay ungrouped, and no comment inside either block may contain a closing brace.

**Reversibility:** trivial — concatenate the eleven files in import order.

## Related

- [[decisions]]
- [[2026-07-30-tailwind-here-is-a-token-system-not-a-utility-system]] — the migration this was chosen instead of
- [[2026-07-28-a-scrollbar-belongs-to-the-surface-not-the-component]] — why the scrollbar pin now reads the whole directory
- [[2026-07-23-tailwind4-tokens]] · [[active-work]]
