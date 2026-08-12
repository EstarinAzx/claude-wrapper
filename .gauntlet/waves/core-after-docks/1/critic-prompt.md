# Wave 1 critic prompt — the exact instrument, recorded for recoverability

Run 3 (`core-after-docks`), wave 1. Five critics, **identical payload by construction**
(the workflow script builds all five from one template; only the piece name, the three
file paths and the box differ). Critic family re-resolved live this wave:
`sonnet -> codex/gpt-5.6-sol`.

**Three images per critic, never four.** Run 1 wave 2 lost a critic to context length at
five images and its trimmed retry produced the run's one false `YOURS WINS`, corrected at
wave 3. The identity floor therefore rides as *text* (binding constraint 2), not as a
fourth image.

**Wave 1 has no PART for improvement.** No gap has been named in this run, so there is
nothing to judge BETTER/SAME/WORSE against. That part appears from wave 2 onward, sealed
after the verdict, exactly as run 1 wave 4 established.

## PASS 1 FAILED FOR ONE PIECE, AND THE FIX WAS AN INSTRUMENT CHANGE, NOT A TRIM

Pass 1 ran all five at the **native 3360x2100** bar references. Four returned clean;
**Sidebar died with `"Prompt is too long"` / `invalid_request`** after a single read.

The cause is not that Sidebar's payload was unusually large — **all five bar references are
byte-for-byte the same dimensions**, 3360x2100, ~9.4k image-tokens each, so with the
1440x900 window frame every critic was carrying ~11k image-tokens before its own reasoning.
The instrument was running within a few percent of the ceiling for **all five**, and Sidebar
happened to be the one that crossed it. Run 1 wave 2 hit this same wall at five images.

**The trap this had to avoid:** run 1's response then was a *trimmed retry* for the one
casualty — three images instead of five — and that produced the run's only false
`YOURS WINS`, corrected two waves later. A weaker payload for one piece is not a verdict,
it is a different question.

So pass 2 changed the instrument **uniformly and re-ran all five**:

- Every `linear/` reference downscaled to **1680x1050** (exactly half), ~2.4k image-tokens,
  about 4x headroom. Captures stay native — the artifact is never resampled.
- `.gauntlet/bar/` itself is **untouched**; the half-scale copies are derived files under
  `.gauntlet/waves/core-after-docks/1/bar-half/`. Verified byte-identical before and after
  via sha256 on all seven bar files plus a clean `git status .gauntlet/bar/`. A bar that
  drifts under a loop is not a bar.
- Downscaler: `.gauntlet/scratch/downscale-bar.js`, via Electron's `nativeImage` — already
  a dependency, so no image library was added.
- Critics were **not told** it was a retry or that the reference was downscaled. Blind is
  the point.

**This buys a control for free.** Four pieces now have a verdict at native resolution *and*
at half resolution, from independent critics. If the four hold, the downscale did not bias
the instrument and Sidebar's recovered verdict is comparable to them. If they move, the
resolution itself is a variable and that is the wave's real finding.

## Per-piece payload

| piece | surface capture | window frame | bar reference | box in frame |
|---|---|---|---|---|
| Welcome | `welcome.png` | `window-welcome.png` | `linear/linear-method.png` | x0 y48 w1440 h852 |
| Titlebar | `titlebar.png` | `window-session.png` | `linear/linear-features.png` | x0 y0 w1440 h48 |
| Sidebar | `sidebar.png` | `window-session.png` | `linear/linear-home-hero.png` | x0 y48 w248 h852 |
| Chat | `chat.png` | `window-session.png` | `linear/linear-changelog.png` | x248 y48 w1192 h720 |
| InputBar | `input-bar.png` | `window-session.png` | `linear/linear-home-product.png` | x248 y768 w1192 h132 |

## The template, verbatim

```
You are an independent design critic. You did not build this, and you will never see the
builder's code, diff, or reasoning. You judge a real screenshot of a running desktop app
against a real screenshot of a reference product, and you return an ordinal verdict plus
ONE actionable gap.

## Read EXACTLY these three images, and nothing else

1. CAPTURE — the piece you judge:            <surface>
2. CONTEXT — the whole window it lives in:    <frame>
3. THE BAR — the reference product:           <bar>

Then read these two text files as the SPEC FENCE (the fence, not the yardstick):
  DESIGN.md
  PRODUCT.md

Do not read any other file. Do not run any command. Do not open source code. Reading a
fourth image risks dying on context length, which has cost this project a verdict before.

## The piece you are judging

<PIECE> — <what it is>. Within the window frame it occupies <box>.

## What beating the bar looks like

<bar_win>

## Binding constraints — settled, and NOT open to you

1. COLOUR, TRANSLUCENCY AND MATERIAL ARE OUT OF SCOPE for your verdict. The app's ground
   is a translucent wash composited by Windows over OS acrylic; a screenshot driver cannot
   see a DWM backdrop, so the flat grey ground in the capture is an INSTRUMENT ARTIFACT,
   not a defect. Judge composition, layout, type, hierarchy, spacing, state and copy.
   This repo has mistaken this artifact for a finding nine times.
2. THE IDENTITY MARK IS SOLID BY DESIGN — a flat mint rounded square with no glyph inside
   it, in both the titlebar and the Welcome hero. Verified three ways in source. "The logo
   is missing its icon / needs a glyph" is an ANSWERED question and is not a finding. The
   mark's DEPTH is a different question and is fair game.
3. No defect list is supplied, on purpose. Naming gaps for you would hand you the verdict
   you exist to reach independently.
4. DESIGN.md line 59 is STALE where it names the titlebar's right side, and stale in the
   spec's own favour. It says "Right: the Agents-dock toggle, then a hairline separator,
   then min / max / close", which was true when Agents was the only dock. THREE panel
   toggles ship today, and DESIGN.md's own line 61 already calls Appearance the "third
   right-slot panel" — the document contradicts itself two lines down. The COUNT of
   pre-separator controls is agreed and is NOT a spec break. How well that group is
   COMPOSED is fair game.
5. Two claims are already REFUTED BY MEASUREMENT. Do not raise either: "the app has no
   icon vocabulary" (false — measured 1:1 viewBox-to-pixel at strokeWidth 1.4), and "group
   the commands by purpose / give each row a leading icon" (not buildable — there is no
   category field; the list is a hand-authored fixture).
6. A missing image is a FAILED RUN, not an absent surface. If a file will not open, say so
   and stop. Never judge a surface you could not see.

## Answer in exactly this shape

### PART A — LITERALS (do this FIRST, and do not revise it afterwards)
6-10 things you can literally read or count in the CAPTURE: exact strings including
truncations with their ellipses, counts, positions, sizes. This is how a reader confirms
you looked at pixels. No quality judgements here.

### PART B — VERDICT
Blind A/B: which is the better piece of design craft, the CAPTURE or THE BAR?
Exactly one token: BAR WINS | TOO CLOSE | YOURS WINS

### PART C — THE ONE BIGGEST GAP
One sentence, concrete enough that a builder can act on it without asking you anything.
Layout, composition, type, hierarchy, spacing, state or copy. Never colour or material.

### PART D — SPEC BREAK
`SPEC BREAK <what>` only if the CAPTURE violates DESIGN.md or PRODUCT.md AS WRITTEN, and
quote the line you say is broken. Otherwise the single word NONE. A break is a hard fail
that reverts a build regardless of how good it looks, so do not reach for it.
```
