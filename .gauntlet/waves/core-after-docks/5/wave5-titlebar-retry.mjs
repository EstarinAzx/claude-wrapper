export const meta = {
  name: 'gauntlet-wave5-titlebar-retry',
  description: 'Gauntlet run 3 wave 5: Titlebar builder, retry with the decision narrowed after six stalls',
  phases: [{ title: 'Build', detail: 'one builder, tokens.css only' }],
}

const ROOT = 'D:/.claude/claude projects/playground/4'

// WHY THIS BRIEF DIFFERS FROM THE FIRST ONE, recorded rather than hidden.
// The first Titlebar brief stalled SIX consecutive agents on the 180s
// no-progress limit. It was not the wave-3/4 failure (reading instrument
// source): the first attempt made exactly the ONE bounded read the brief
// prescribed and then stalled with no further output. The two other builders
// in the same fan-out, same model, same tree, both returned.
//
// The difference is the SHAPE OF THE DECISION. The first brief posed an open
// design question ("the ramp should move chroma as it darkens") behind a hard
// guard whose breach is an automatic revert, and gave no candidate form. That
// invites deliberation, and deliberation with no tool call is exactly what the
// no-progress limit kills. So this brief: names ONE candidate mechanism, asks
// for ONE number, and requires the edit to be written BEFORE the justification.
//
// This changes a BUILDER brief, not the instrument. The critics judge blind and
// their prompt is byte-identical to wave 4's; scrutiny is untouched.

phase('Build')

const BRIEF = `You are a BUILDER on a working, shipping Electron desktop app at ${ROOT}
(branch gauntlet/core-after-docks).

## DO THIS FIRST, BEFORE ANY ANALYSIS

Your very first action is an \`Edit\` to ONE file. Write the edit, then justify it. Do not plan
first, do not deliberate first, do not read anything first — everything you need is in this
brief. Six previous attempts at this task stalled without producing any output because they
reasoned instead of acting. If your first instinct is "let me think about the colour space
before I touch anything", override it: make the edit, measure your reasoning against it
afterwards, and revise the edit if your own arithmetic later disagrees with it.

## YOUR ONE FILE

\`src/renderer/src/styles/tokens.css\`. Nothing else. Two other builders have already edited two
other stylesheets in this tree; touching any file but this one corrupts their work.

## THE ONE LINE YOU ARE CHANGING — it is at line 131

\`\`\`css
  --mark-depth: linear-gradient(rgb(0 0 0 / 0), rgb(0 0 0 / 0.1));
\`\`\`

It is consumed at exactly three places, none of which you edit, all as
\`background: var(--mark-depth), var(--mint);\` — a gradient layer over a flat mint fill:

- \`.logo-mark\`    22px rounded square (titlebar identity chip)
- \`.welcome-mark\` 44px rounded square (welcome hero plate)
- \`.avatar\`       28px circle (assistant avatar in the transcript)

The mint underneath is \`oklch(0.87 0.07 180)\`. In the real capture the mark's top row measures
RGB(160, 226, 212) and its bottom row RGB(144, 204, 192).

## THE GAP, IN ONE PARAGRAPH

The current cue is a pure BLACK ramp. Black scales all three channels toward zero in proportion,
so the mark darkens without ever changing character. The design reference this app is judged
against does not do that — its own identity marks shift CHROMA as they darken. Measured interior
standard deviation per channel (mint mask eroded 2px), app against reference:

| | R | G | B |
|---|---|---|---|
| app (22px / 44px / 28px) | 3.49 / 3.98 / 3.31 | 4.81 / 5.68 / 4.67 | 4.66 / 5.30 / 4.37 |
| reference marks | 9.40 / 10.79 / 10.71 | 7.06 / 8.40 / 8.34 | 4.02 / 4.39 / 4.34 |

The app **matches the reference on B**, runs about 45% short on G, and about **3x** short on R.
Raising the black ramp's alpha cannot fix that shape — it scales all three together, so reaching
the reference's G needs about 1.47x, which overshoots B by 70% and still leaves R at half. This
is a SHAPE difference, not a magnitude one.

## THE CANDIDATE MECHANISM — evaluate this one, do not go looking for another

Replace the black ramp with a ramp whose dark stop is a **darker, MORE CHROMATIC colour at the
SAME hue as the mint**, rather than neutral black. Compositing that over mint pulls R down
faster than B (because at hue ~180 the red channel is the one furthest from the others), which is
the reference's signature.

A form that expresses it directly, for you to fill in and adjust:

\`\`\`css
  --mark-depth: linear-gradient(oklch(0.87 0.07 180 / 0), oklch(L C 180 / A));
\`\`\`

Pick **L**, **C** and **A**. Sensible starting territory is a clearly darker lightness, a chroma
somewhat above the mint's 0.07, and an alpha in the same order as today's 0.1. Your job is to
choose values that move R and G toward the reference while leaving B roughly where it already is.

You may instead express it in sRGB if you prefer a form you are more confident Chromium parses —
the mechanism matters, not the notation. Whatever you write, it must be a value the browser
actually parses (see the silent-no-op warning below).

## THE ONE HARD GUARD

**EXACTLY ONE MINT HUE.** The app's accent floor is verified by counting mint pixels at a single
hue angle. If the dark end of your ramp lands on a visibly different hue, the identity splits into
two accents and the change is reverted automatically. Keeping the ramp's stop at the **same hue
number as the mint** is what buys you this — that is why the candidate above pins 180 at both
ends. Chroma movement is explicitly permitted (the theme test allows accent chroma to move);
hue movement is not.

**If you convince yourself the mechanism cannot hold one hue, ship a SMALLER step in the same
direction rather than nothing, and say so in your report.** A partial close that holds the guard
beats both a bold break and an empty diff.

## WHAT IS PINNED — stated as given, do not go and check

\`--mark-depth\` is pinned by NOTHING. Zero tests reference it. Zero rendered drivers measure a
mark's interior. The theme test validates palette keys for lightness and alpha, and this is
deliberately not a palette key — it names a layer.

**So nothing will catch a value that fails to parse.** jsdom loads no CSS; if your value is
invalid the marks silently paint flat mint and the entire test suite still passes green. This is
the failure mode this change is most exposed to. Prefer a notation you are confident about, and
name in your report what you relied on.

Also: only one box-shadow in this app may carry a nonzero HORIZONTAL offset and it is already
spent. A purely vertical offset would be free, but the gradient is the intended lever.

## THE TRAP — do NOT split the token

A previous whole-artifact pass claimed this one value "paints three different finishes" because
measured stddev came out 5.00 / 5.77 / 4.90 at the three sizes. **That was refuted this morning.**
A fixed 2px erosion samples 81.8% / 90.9% / 85.7% of a 22px / 44px / 28px box, so those are three
fractions of ONE ramp; span-corrected the implied ranges are 22.8 / 23.4 / 23.2, and an
independent slope fit gives -21.80 / -22.77 / -22.34, agreeing to 4.3%. The 22px and 44px marks
have **identical top and bottom rows**. The three sites already paint one finish.

So \`--mark-depth\` stays **ONE declaration with three callers**. Do not give the sites separate
values — that would destroy a property that currently holds.

## THE COMMENT ABOVE THE LINE IS KNOWN-WRONG AND YOU MUST FIX IT

Lines 111-130 carry an authored note. Its middle paragraph computes the ramp's range as
\`alpha x 255 x L\` using the mint's OKLCH **lightness** as if it were an sRGB channel scale. It is
not, and the 6.41 stddev it predicts is unreachable on R at any box size. The true per-channel
ranges at alpha 0.1 are about R 16.1 / G 22.8 / B 21.4, and the leg measured an implied range of
22.8-23.4 on G, which agrees with the corrected figure. Rewrite that paragraph so it states what
is true of whatever you ship. Keep the note's other two claims — the three-callers-one-system
point and the hue guard — because both are still correct.

**No comment in this repo may contain a closing brace**; three tests scan the stylesheets as raw
text and a brace in a comment breaks them.

## DO NOT

- Do not run npm, any build, or any test. Three builders share this tree; the wave gates centrally.
- Do not open anything under \`.claude/\`, any \`gui-*.mjs\`, or \`inspect.mjs\`.
- Do not read another stylesheet. If you want the surrounding token block, \`Read\` tokens.css at
  offset 85 limit 64 — but you do not need it to make this edit.

## YOUR REPORT, AFTER THE EDIT IS WRITTEN

- The exact value you shipped.
- Why those numbers.
- Your PREDICTION of the resulting per-channel interior stddev at the three sites, as numbers.
  The leg measures the capture and checks you; a specific wrong prediction is worth far more than
  a vague right one.
- Your confidence that the hue holds, and what you based it on.`

const out = await agent(BRIEF, { label: 'build:Titlebar-retry', phase: 'Build' })
return { titlebar: out }
