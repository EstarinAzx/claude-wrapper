# Wave 4 — the exact prompts

Kept because run 1 recorded "wave 3's exact critic prompt was not recoverable" as a deviation.
Waves 1, 2 and 3 each kept theirs; this is wave 4's.

**The authoritative source is the two scripts sitting beside this file**, which are the verbatim files
that were executed. This document is the human-readable summary of what each agent received.

| script | agents |
|---|---|
| `wave4-builders.mjs` | the three builders — Titlebar, Sidebar (died twice, landed on attempt 3), InputBar |
| `wave4-critics.mjs` | the five blind critics and the smoothing pass |

Two other files in this directory are evidence rather than prompts:

| file | what it is |
|---|---|
| `dom-baseline-prewave.txt` | the rendered gate run **before any builder touched the tree** — 35/39 |
| `leg-verification.txt` | the leg's own byte-identity control and mark-interior measurement, taken before any verdict was opened |
| `sidebar-build-REVERTED.diff` | the Sidebar build that was completed and then reverted on a test fence |
| `inspect.log` | the capture run: `PASS`, 11/11 |

## What each critic received, and what it did not

Model: the `sonnet` family, re-resolved live from `wisp routing` to **`codex/gpt-5.6-sol`** — the first
non-Anthropic family, which is the rule. Fifth consecutive wave at that landing, which is luck rather
than stability. Builders ran on the Anthropic main-loop model, so no critic shared a family with any
builder.

**`CRITIC_SHARED` is BYTE-IDENTICAL to wave 3's.** Only the capture path changed (`.../4` for `.../3`).
That is deliberate: the verdicts are only comparable across waves if the instrument does not drift, and
that includes leaving constraint 2's "the mark's DEPTH is a fair question" in place even though this
wave's one build addressed exactly that. A critic raising depth again is then information, not noise —
and one did.

**Exactly three images, never four**, at the authored bar resolution:

| piece | surface capture | window frame | bar reference |
|---|---|---|---|
| Welcome | `welcome.png` | `window-welcome.png` | `bar-half/linear-method.png` |
| Titlebar | `titlebar.png` | `window-session.png` | `bar-half/linear-features.png` |
| Sidebar | `sidebar.png` | `window-session.png` | `bar-half/linear-home-hero.png` |
| Chat | `chat.png` | `window-session.png` | `bar-half/linear-changelog.png` |
| InputBar | `input-bar.png` | `window-session.png` | `bar-half/linear-home-product.png` |

`identity/frost-mono-reference.png` rode as **text**, not as a fourth image. A critic received no builder
message, plan or diff, and was told nothing about what changed. The spec was framed as a **fence** for
the spec-break question only, never as the yardstick.

## The four-part contract

Unchanged from wave 3: **PART A** literals written first and unrevisable, **PART B** one of
`BAR WINS` / `TOO CLOSE` / `YOURS WINS`, **PART C** one gap, **PART D** a spec break or exactly `NONE`.

PART A earned itself again this wave in both directions: it independently confirmed the Welcome hero's
geometry, and it exposed the Titlebar critic reporting `window-session.png` as `1440x912` for the
**second wave running** against a true `1440x900` — the same slip, same file, same piece slot, so that
error is reproducible rather than random.

## What the smoothing pass received, and how it differed from wave 3's

It was told the truth about a wave that mostly reverted itself: **one build landed, two were built and
reverted**, with the reason for each. That turned the wave into an unusually clean control set, and the
brief asked for it explicitly — `sidebar.png` and `input-bar.png` byte-identical, the three docks
byte-identical, and every changed pixel anywhere confined to one of three mark interiors. It returned
all of that confirmed, with **zero remainder** on the composite frames.

Three deliberate framing choices, each of which changed what came back:

1. **The mark-depth measurement was framed as a TEST PIN, not a nicety** — the brief said in terms that
   jsdom loads no CSS, no driver reads a mark interior, and "your measurement is the only pin this change
   has. If you measure 0.00 again, say so loudly." It measured, and then went further than asked by
   fitting alpha back out of the pixels.
2. **The 5px seam was framed as a CONTROL, not a fix to verify**, with an explicit instruction not to
   refile it as a new finding since its only attempted fix had been refuted. It complied and put it in
   not-findings.
3. **The transcript's scroll state was asked as a NEUTRAL measurement with no conclusion attached** —
   "report the numbers either way, including if you find nothing is hidden." The leg had already refuted
   a Chat gap on this mechanism from source, and framing it as a question rather than a claim is what
   makes the agreement worth anything. It independently measured ~89px above the viewport with nothing
   clipped.

The instrument warning about reading the centring invariant off the **ink bounding box** rather than the
mass centroid was carried forward verbatim, and it honoured it — explicitly declining to compute a
centroid for the left-registered Welcome hero, and noting that wave 3's `-91.59px` centroid figure would
have "found" a defect that does not exist. It also corrected two of its own errors mid-pass and said so.
