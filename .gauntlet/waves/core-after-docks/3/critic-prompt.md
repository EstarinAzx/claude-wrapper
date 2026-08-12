# Wave 3 — the exact prompts

Kept because run 1 recorded "wave 3's exact critic prompt was not recoverable" as a deviation.
Waves 1 and 2 each kept theirs; this is wave 3's.

**The authoritative source is the three scripts sitting beside this file**, which are the verbatim
files that were executed. This document is the human-readable summary of what each agent received.

| script | agents |
|---|---|
| `wave3-builders.mjs` | the three builders (Welcome, Titlebar, Sidebar) — Welcome's attempt died here |
| `wave3-welcome-v3.mjs` | the Welcome builder that landed, third attempt, with its source inlined |
| `wave3-critics.mjs` | the five blind critics and the smoothing pass |

## What each critic received, and what it did not

Model: the `sonnet` family, re-resolved live from `wisp routing` to **`codex/gpt-5.6-sol`** — the
first non-Anthropic family, which is the rule. Builders ran on the Anthropic main-loop model, so
no critic shared a family with any builder.

**Exactly three images, never four**, at the authored bar resolution:

| piece | surface capture | window frame | bar reference |
|---|---|---|---|
| Welcome | `welcome.png` | `window-welcome.png` | `bar-half/linear-method.png` |
| Titlebar | `titlebar.png` | `window-session.png` | `bar-half/linear-features.png` |
| Sidebar | `sidebar.png` | `window-session.png` | `bar-half/linear-home-hero.png` |
| Chat | `chat.png` | `window-session.png` | `bar-half/linear-changelog.png` |
| InputBar | `input-bar.png` | `window-session.png` | `bar-half/linear-home-product.png` |

The mapping is the authority table in `.gauntlet/bar/README.md`, not prose from anywhere else
(settled by #149). `identity/frost-mono-reference.png` rode as **text**, not as a fourth image —
run 1 lost a critic to context length at five images and its trimmed retry produced that run's only
false verdict.

`bar-half/` is **not a compromise resolution**: the README records the references were captured at
1680x1050 with `deviceScaleFactor: 2`, so the half-scale set restores the bar's own authored
logical dimensions by removing the device-pixel doubling.

**A critic received no builder message, plan, or diff, and was told nothing about what changed.**
It read its three images plus `DESIGN.md` and `PRODUCT.md`, and the spec was framed as a **fence**
for the spec-break question only, never as the yardstick for the comparison.

## The four-part contract

- **PART A — LITERALS, written first and unrevisable.** Dimensions, every readable string verbatim,
  counts, block positions. This exists so a verdict can be checked against the correct pixels; it
  is what settled wave 1's adjudication 9, and this wave it caught two dimension slips while
  independently confirming the Welcome fix (one critic reported the hero bbox as `x=513–927`,
  matching the leg's own PNG decoder exactly).
- **PART B — VERDICT.** Exactly one of `BAR WINS` / `TOO CLOSE` / `YOURS WINS`.
- **PART C — ONE GAP.** The single biggest remaining gap, ranked by the critic itself, concrete
  enough to act on without a follow-up question.
- **PART D — SPEC BREAK** or exactly `NONE`.

## The five constraints handed to every critic

1. **Colour, translucency and material are out of scope for any verdict.** The flat grey ground in
   every capture is an instrument artifact: the wash is composited by Windows over OS acrylic and no
   capture can see it (measured at alpha 163/255 = 0.639, the authored value, against a reference at
   alpha 255). Composition, layout, type, hierarchy, spacing, state and copy only.
2. **The identity mark is solid by design, no glyph, ever.** Mark *depth* is explicitly left open —
   and this wave the Titlebar critic took that opening, arriving independently at wave 1's measured
   finding that the mark is mathematically flat where the identity reference gives it a gradient.
3. **No defect list is supplied, on purpose.**
4. `DESIGN.md` is stale where it describes the titlebar's right side, in the spec's own favour. The
   toggle **count** is agreed and is not a break; how well the group is **composed** is fair game.
5. **Two claims are already refuted** and were named so no critic would spend its gap on them: "the
   app has no icon vocabulary" (false — one shared glyph const) and "group the command rows by
   purpose / give each row a leading icon" (not buildable — no category field exists).

## Instrument notes specific to this wave

- The **Chat critic stalled twice** on a 180-second no-progress limit and returned on the third
  attempt with a **byte-identical prompt**. No trim was applied, so scrutiny was never weakened —
  run 1's only false verdict came from trimming a single casualty. The cause is emission length, not
  payload weight: `chat.png` carries 923 characters of readable text against `input-bar.png`'s 80,
  while InputBar's image payload was the *larger* of the two and returned first time.
- The smoothing pass received the whole capture set for waves 1, 2 and 3, plus an explicit
  **instrument warning** that the centring invariant must be read off the ink bounding box rather
  than the mass centroid, because a left-registered block necessarily carries its mass left of its
  bbox centre. It was given that methodology point but **none of the leg's numbers**, so its
  measurements are independent.
