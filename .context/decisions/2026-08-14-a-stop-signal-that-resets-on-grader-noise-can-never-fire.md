---
type: decision
project: claude-wrapper
date: 2026-08-14
updated: 2026-08-14
tags: [context, decision, instrument, gauntlet, design, measurement]
---

# A stop signal that resets on grader noise can never fire, and a byte-identical control is not a bit-exact instrument

## Decision

Gauntlet run 3 (`core-after-docks`, waves 1–12, closed at `358ab96`, PR #171) is
**closed as cut off, not converged.** It stopped on `wave >= max_waves`. The
`plateau` counter finished at **0** and never exceeded **2** across twelve waves.

Three things are settled by it, and none of them are about the app:

| finding | status |
|---|---|
| `plateau >= 3` is not a reachable stop condition for this instrument | **settled across two runs** |
| the `inspect.mjs` capture pipeline is **not bit-exact** | **settled, with a round-trip proof** |
| a degraded critic is declared in the state file, never silently swapped | **settled as procedure** |

The one code change the final wave made is `composer.css` `.effort-range`
**68px → 130px**, with its derivation in the comment beside it. Landed on the
owner's go after the run recorded a genuine disagreement about it.

## Why

**The plateau signal reads grader noise as progress.** The contract is "any piece
whose verdict improved → `plateau: 0`, otherwise `+= 1`". Across run 3, **seven of
twelve waves** had the counter reset by a verdict that moved on a capture which was
byte-identical, or ±1-pixel identical, to the previous wave's. A counter that resets
on those cannot reach 3 unless the panel happens to sit still for three consecutive
waves, and this panel never has. Run 2 ended the same way. Adjudication 6.1
predicted it at wave 6 and was correct.

The root cause is the ordinal scale, and it is now measured rather than argued: the
scale has no state for *on the line*. A piece genuinely sitting on the BAR WINS /
TOO CLOSE boundary gets rounded to whichever side a given panel lands on. Waves 8–12
are **one set of pixels graded by five independent panels** — three surfaces returned
12/12 identical verdicts under one vendor, and two flipped in lockstep twice.

Wave 12 added the sharpest control. `titlebar.png` is byte-identical across waves
8–12. Four panels on non-Anthropic critics returned BAR WINS **4/4** on those exact
bytes; the one panel on a same-vendor critic returned **TOO CLOSE**. Only the grader
changed, and the smoothing pass — which never sees a verdict — independently
confirmed the surface did not (intervals 9/16/4, ratio 1.78×, midpoint displacement
0.00, sha256 identical). **n=1 on the new instrument, so this is an isolation and
not a proof**, and the converse rode the same wave: Welcome and Sidebar held BAR
WINS 5/5 straight through the vendor change.

**The capture pipeline is not bit-exact, and waves 9–11 were luck holding.** Wave 12
rebuilt and re-captured an unchanged tree and got 6 differing RGB pixels — 3 in
`sidebar.png` at x16-18 y139-141, plus the same 3 in the window composite. Every
delta was **±1 on a single channel**, and the pixels **round-trip**: wave 11
`[13,18,19,217]` → next capture `[12,17,18,216]` → capture after `[13,18,19,217]`.
Content does not return to its exact prior value; rasterisation noise does. That
round-trip is the test that separates the two. Waves 9, 10 and 11 each reported
"12/12 byte-identical" and read it as a property of the instrument; it was a
property of those three runs.

**A degraded critic is declared.** Wave 12's cross-vendor quotas were exhausted and
the owner had deliberately allocated a same-vendor family. The leg first read the
all-Anthropic routing as drift and rebound the row to preserve waves 9–11's Target,
then **reverted it before launching anything** once told the quota was dead — no
agent ran on it. The panel ran same-vendor with `critic_degraded: true` in the state
file, the log line and the PR. Stated precisely because "degraded" is doing real
work: the builder ran on a different model in a fresh context, so it is **not**
literal self-grading, but it **is** same-vendor on the wave that closes the run, and
the closing adjudication does not average it in.

**On the effort track.** The wave-11 critic asked to widen it; wave 12 measured the
premise first, as instructed — `.effort-range { width: 68px }` and
`.effort-value { min-width: 68px }` turned out to be two independently derived
numbers that coincided, so the critic was reading the right element and the clause
was real (6 stops, 10px thumb, travel 58px, **11.60px per interval**). The widen
landed at 24.00px per interval, which is already the app's base interval
(`chat.css` line 74 names it that). Then wave 12's critic asked for roughly **half**
the group's width — the opposite of what the wave built. Confounded by the vendor
change, and **unresolvable without a thirteenth wave**. Recorded rather than
resolved.

## Reversibility

**The findings are cheap to overturn and expensive to ignore.** The plateau
conclusion rests on two full runs and twelve waves of recorded verdicts in
`.claude/gauntlet.md` § 12.10 — a third run that plateaus honestly would refute it,
and nothing here prevents that. The bit-exactness finding is a single measurement
with a round-trip proof; re-run `inspect.mjs` twice on a clean tree to check it.

**The code change is one commit.** `.effort-range` is a single declaration plus its
comment; reverting to 68px touches nothing else and no test pins either value.

**What is NOT reversible is the run itself** — waves 1–12 are landed and pushed, and
run 3 will not resume (`stop: true` in both `.claude/gauntlet.md` and the relay state
file). A run 4 means a fresh slug and a fresh `/preset bar` decision.

**What a future run should change:** budget `max_waves` as the real stop condition
rather than expecting plateau, and either add a fourth `ON THE LINE` verdict state or
only count a movement that an independent measurement corroborates. Wave 7 is the one
wave that separated signal from noise, and it did so with the smoothing pass, not
with the counter.

## Related

- [[decisions]]
- [[active-work]]
