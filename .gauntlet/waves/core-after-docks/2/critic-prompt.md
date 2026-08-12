# Wave 2 critic prompt — the exact instrument, recorded for recoverability

Run 3 (`core-after-docks`), wave 2. Five critics, **identical payload by construction** (the
workflow script builds all five from one template; only the piece name, the three file paths
and the box differ). Critic family re-resolved live this wave: `sonnet -> codex/gpt-5.6-sol`,
taken as the first non-Anthropic family from `wisp routing`. Third consecutive wave at that
landing, which remains luck rather than stability — re-resolve every wave.

Script: `workflows/scripts/gauntlet-wave2-critics-wf_251122af-54f.js` (session dir).

## The instrument is wave 1's, deliberately unchanged but for two corrections

Verdict comparability across waves is the whole basis of the plateau counter, so the template is
wave 1's **verbatim**, with exactly two corrections — both of which fix the prompt against
*source*, and both of which wave 1 itself had already discovered and recorded:

1. **Constraint 4's line references.** Wave 1's saved template still said "DESIGN.md line 59 /
   line 61". DESIGN.md grew during run 2 and the sentences moved to **80 / 82**; wave 1's
   adjudication 7 recorded the correction but the saved prompt kept the stale numbers. Pointing a
   critic at the wrong line is worse than not citing one.
2. **Constraint 5's stroke width.** The template said `strokeWidth 1.4`; the source says **1.3**
   (`Titlebar.tsx:192`), re-verified first-hand this wave.

Payload resolution is also unchanged: the five `linear/` references ride at **1680x1050**, reused
as derived files from `.gauntlet/waves/core-after-docks/1/bar-half/`. Wave 1 established that
resolution as this run's instrument after the native 3360x2100 references killed a critic on
context length, and proved the downscale unbiased (four pieces returned the same verdict at both
resolutions). Reusing wave 1's own downscaled copies means the payload is byte-identical across
the two waves rather than merely equivalent. `.gauntlet/bar/` was not touched — verified by
sha256 on all nine bar files before the wave and after.

**Three images per critic, never four.** Unchanged from wave 1, for the same reason.

## WHAT WAVE 2 DELIBERATELY DID *NOT* ADD, against wave 1's stated plan

Wave 1's prompt record says an improvement part "appears from wave 2 onward, sealed after the
verdict" — the critic would be shown the gap named for its piece last wave and asked whether it
had moved. **Wave 2 declined to add it.** The reasoning:

- The plateau counter reads the **verdict** column, nothing else. Handing a critic the gap that a
  builder was told to close risks anchoring the one output the run's stop signal depends on, to
  buy a signal that is obtainable another way.
- It *is* obtainable another way, and was: the leg measured movement itself from wave 1 → wave 2
  captures for all five pieces (centroids, row pitch, cluster spans, stem thickness), plus the
  smoothing pass measured it independently a second time. Two measured readings of "did it move"
  beat one judged reading, and neither touches the blind verdict.
- Leaving the template otherwise byte-identical means wave 2 asked wave 1's question again, which
  is the only way "the verdict did not move" carries information.

So the critics were told nothing about wave 1, nothing about a builder, and nothing about a gap.

## Per-piece payload

| piece | surface capture | window frame | bar reference | box in frame |
|---|---|---|---|---|
| Welcome | `2/welcome.png` | `2/window-welcome.png` | `1/bar-half/linear-method.png` | x0 y48 w1440 h852 |
| Titlebar | `2/titlebar.png` | `2/window-session.png` | `1/bar-half/linear-features.png` | x0 y0 w1440 h48 |
| Sidebar | `2/sidebar.png` | `2/window-session.png` | `1/bar-half/linear-home-hero.png` | x0 y48 w248 h852 |
| Chat | `2/chat.png` | `2/window-session.png` | `1/bar-half/linear-changelog.png` | x248 y48 w1192 h720 |
| InputBar | `2/input-bar.png` | `2/window-session.png` | `1/bar-half/linear-home-product.png` | x248 y768 w1192 h132 |

Answer shape unchanged: **PART A literals first and unrevisable**, PART B one ordinal token,
PART C one gap, PART D spec break or NONE. Wave 1's adjudication 9 turned an unfalsifiable worry
into a decided question purely because PART A came first and could not be revised; that property
is why the shape is not being touched.

## The smoothing pass is a separate instrument and IS told what changed

The five critics are blind. The smoothing pass is the opposite by design — it is the only agent
with a view of the whole artifact, its job is cross-surface coherence, and withholding the wave's
five changes from it would only make it re-derive them. It was given the five changes, the
wave-1 and wave-2 capture directories, read-only access to source, wave 1's NOT-FINDINGS so it
could not refile them, and the standing exclusions (colour/material, the solid mark, the parked
`ToolCard` proposal). It returned four findings, nine not-findings, and no new piece.
