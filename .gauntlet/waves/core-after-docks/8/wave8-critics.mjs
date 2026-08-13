export const meta = {
  name: 'gauntlet-wave8-critics',
  description: 'Gauntlet run 3 wave 8: five blind cross-model critics plus one whole-artifact smoothing pass',
  phases: [{ title: 'Judge', detail: 'five blind critics on a non-Anthropic family, one smoothing pass' }],
}

const CAP = '.gauntlet/waves/core-after-docks/8'
const BAR = '.gauntlet/waves/core-after-docks/1/bar-half'
const ROOT = 'D:/.claude/claude projects/playground/4'

const BAR_WIN = `Every surface of the running app survives side by side with Linear — none reads
as the one nobody finished, every empty state is authored copy plus a real action rather than a
placeholder mark, and one type scale holds across all of them — while never drifting off
frost-mono-reference.png: near-black, one mint accent under 10% of surface, no decorative glass
beyond the single named exception.`

// BYTE-IDENTICAL to waves 4-7's CRITIC_SHARED, spliced in programmatically from
// wave7-critics.mjs rather than retyped, and hash-verified against f89141c58449127c before
// launch. Verdicts are only comparable across waves if the instrument does not drift.
//
// THE TWELFTH CAPTURE IS STILL DELIBERATELY NOT GIVEN TO ANY CRITIC, and wave 8's reason is
// different from wave 7's and stronger than wave 6's. 7.1 established that Chat's verdict CAN
// track its own artifact: it fell on a 129,167px change and an independent measurement agreed.
// Wave 8's Chat build is a direct answer to that same critic's named gap. Swapping the frame now
// would make it impossible to tell whether a verdict moved because the card got better or because
// the critic can suddenly see different pixels — spending the one working attribution signal this
// run owns, in the first wave that can use it. Hold the frame.
const CRITIC_SHARED = `
You are an INDEPENDENT CRITIC. You are judging a real, running desktop application against an
external reference. You have never seen this app before, you have no idea what was changed, and
you must not try to guess. You are not reviewing a diff — you are looking at output.

Project root: ${ROOT}

## The identity floor, supplied as TEXT rather than a fourth image

The app's identity reference is a near-black frosted mono aesthetic: a very dark ground close to
black, exactly ONE mint accent hue used on under 10% of any surface, and no decorative glass
beyond a single named exception (one drawer pane). Judge whether the composition holds that
character. Do not judge the colours themselves — see constraint 1.

## WHAT BEATING THE REFERENCE MEANS

${BAR_WIN}

## CONSTRAINTS ON YOUR VERDICT — these are not suggestions

1. COLOUR, TRANSLUCENCY AND MATERIAL ARE OUT OF SCOPE, ENTIRELY. The app's background is a
   translucent wash composited by the operating system over an acrylic backdrop. No screenshot
   tool can see that compositing, so the flat grey ground you will see in every capture is an
   INSTRUMENT ARTIFACT, not a defect. This was proved by measurement: the window captures are
   RGBA at a dominant alpha of 163/255 = 0.639, which is exactly the authored wash value, while
   the reference image is alpha 255 everywhere. Any verdict or gap that rests on colour,
   contrast-as-colour, flatness of the background, translucency, blur or material will be
   DISCARDED, and this repository has paid that bill nine times. Judge COMPOSITION, LAYOUT,
   TYPE, HIERARCHY, SPACING, STATE and COPY.
2. THE IDENTITY MARK IS SOLID BY DESIGN AND HAS NO GLYPH, EVER. The flat mint rounded square in
   the titlebar and the welcome hero is deliberate and verified three ways in source. "The logo
   is missing its icon / symbol / letter" is an ANSWERED question — do not raise it. The mark's
   DEPTH, on the other hand, is a fair question and you may raise it.
3. NO DEFECT LIST IS SUPPLIED, ON PURPOSE. Find what you find.
4. The spec below is STALE in one known place, in its own favour. Where it describes the
   titlebar's right side as holding one dock toggle plus min/max/close, THREE toggles ship
   today and the spec itself elsewhere calls one of them "the third right-slot panel". The
   COUNT is agreed and is NOT a spec break. How well that group is COMPOSED is fair game.
5. TWO CLAIMS ARE ALREADY REFUTED. Do not make either. (a) "The app has no icon vocabulary" is
   FALSE — every titlebar toggle shares one 16x16 glyph constant with round caps and a single
   stroke width. (b) "Group the command rows by purpose, or give each row a leading icon" is
   NOT BUILDABLE — no category field exists and that list is a hand-authored fixture.

## A MISSING FILE IS A FAILED RUN, NOT AN ABSENT SURFACE

If an image you were told to read does not exist, say so plainly and do not infer that the
surface is missing from the app.

## YOUR OUTPUT — four parts, in this order, and PART A is final once written

PART A — LITERALS. Before any opinion, report exactly what you can SEE in the capture: its pixel
dimensions, every piece of text you can read verbatim, counts of repeated elements, and the
positions of the main blocks. This part exists so your verdict can be checked against the
correct pixels, and it is UNREVISABLE — do not go back and adjust it after forming an opinion.
Be specific and be honest about anything you cannot make out.

PART B — VERDICT. A blind A/B: which is better as a piece of interface design, the app capture
or the reference? Return EXACTLY ONE of:
  BAR WINS      — the reference is clearly better
  TOO CLOSE     — genuinely no clear winner
  YOURS WINS    — the app capture is clearly better
Judge the SURFACE you were given against the reference as a piece of composition. The reference
is a different product; you are not asking whether the app looks like it, you are asking which
is better made.

PART C — THE SINGLE BIGGEST REMAINING GAP. One gap. A sentence or two, concrete enough that
somebody could act on it without asking you a follow-up question. Name the element, the property
and the direction. If you can give a number, give it. Do NOT give a list — rank them yourself
and return only the top one. A gap that would be discarded under constraint 1, 2 or 5 is a
wasted answer, so check yours against them before writing it.

PART D — SPEC BREAK. Either "SPEC BREAK: <what>" if the surface now VIOLATES the spec, or
exactly "NONE". A spec break is a hard fail that reverts a build regardless of how good it
looks. The spec is what was agreed; the reference is only how well it was done. Read the spec
as a FENCE, not as a yardstick — do not report a spec break merely because the spec is silent
on something, and remember constraint 4.
`

const VERDICT = {
  type: 'object',
  additionalProperties: false,
  required: ['piece', 'literals', 'verdict', 'gap', 'specBreak'],
  properties: {
    piece: { type: 'string' },
    literals: { type: 'string', description: 'PART A verbatim: dimensions, all readable text, counts, block positions' },
    verdict: { type: 'string', enum: ['BAR WINS', 'TOO CLOSE', 'YOURS WINS'] },
    gap: { type: 'string', description: 'PART C: the single biggest remaining gap, actionable' },
    specBreak: { type: 'string', description: 'PART D: "SPEC BREAK: <what>" or exactly "NONE"' },
  },
}

const pieces = [
  { name: 'Welcome',  surface: 'welcome.png',   frame: 'window-welcome.png', ref: 'linear-method.png',
    what: 'the WELCOME / empty state — what a user sees before any session exists. It occupies the window below the 48px titlebar.' },
  { name: 'Titlebar', surface: 'titlebar.png',  frame: 'window-session.png', ref: 'linear-features.png',
    what: 'the TITLEBAR — the 48px chrome strip across the very top of the window, holding identity, state and window controls.' },
  { name: 'Sidebar',  surface: 'sidebar.png',   frame: 'window-session.png', ref: 'linear-home-hero.png',
    what: 'the SESSIONS RAIL — the narrow 248px column down the left side, listing past sessions.' },
  { name: 'Chat',     surface: 'chat.png',      frame: 'window-session.png', ref: 'linear-changelog.png',
    what: 'the CHAT TRANSCRIPT — the main reading column holding the conversation, its message bubbles and its tool cards.' },
  { name: 'InputBar', surface: 'input-bar.png', frame: 'window-session.png', ref: 'linear-home-product.png',
    what: 'the COMPOSER — the input pill at the bottom of the chat column plus its utility row and disclaimer.' },
]

phase('Judge')

const SMOOTHING = `You are the SMOOTHING PASS for gauntlet run 3, wave 8, on the claude-wrapper
Electron app at ${ROOT} (branch gauntlet/core-after-docks).

You are the ONLY agent this wave with a view of the WHOLE artifact. Five per-surface critics are
each judging one surface in isolation and none of them can see across surfaces. Your job is
coherence: does this read as ONE application, or as several surfaces improved separately?

## MEASURE, DO NOT ASSERT

This is the whole value you add. Previous smoothing passes wrote their own PNG decoders and
measured pixels rather than describing impressions, and that is what let this run refute eleven
critic gaps that were merely plausible. Every claim you make should carry a number you produced.
If you catch yourself writing "feels" or "seems", either measure it or drop it. If you make an
error and catch it, say so and correct it — previous passes did exactly that and it strengthened
their reports. **Three waves running you have corrected the LEG's own method or numbers rather
than a builder's claim, and those corrections are why this run's headline results are
trustworthy. Do it again — assume the briefing below contains at least one wrong number.**

You may run Bash and read files freely. Node is available. There is no image library dependency
you may add, but Electron's nativeImage is already a dependency and you can decode PNGs yourself.
Reusable instruments live in .gauntlet/scratch/: **wave7-diff.mjs** (per-capture pixel diff with
connected components — point its A_DIR/B_DIR at waves 7 and 8), **wave7-measure.mjs** (builder
prediction checks: titlebar group edge, card inner heights, short-frame jog), and the **w7smooth/**
directory of last wave's own 21 scripts, which are more capable than the leg's and include a PNG
decoder (png.mjs), card-geometry scripts (08-cards, 09-cardinner, 21-cardrhythm), titlebar interval
scripts (01-titlebar, 02-thr) and divider scripts (14-divider, 16-divider2).

## THE CAPTURES

Wave 8 (current, just captured): ${CAP}/
Wave 7 (the previous wave, for A/B): .gauntlet/waves/core-after-docks/7/
Wave 6: .gauntlet/waves/core-after-docks/6/
Wave 5: .gauntlet/waves/core-after-docks/5/
Wave 4: .gauntlet/waves/core-after-docks/4/
Wave 3: .gauntlet/waves/core-after-docks/3/
Wave 2: .gauntlet/waves/core-after-docks/2/
Wave 1 (baseline): .gauntlet/waves/core-after-docks/1/

Waves 1-5 hold ELEVEN files each. **Waves 6, 7 and 8 hold TWELVE** — the twelfth is
window-session-short.png, a session frame in which the transcript does NOT overflow. You specified
that capture three waves ago and it has confirmed a prediction to the exact pixel and put the date
divider in frame. It is yours again; no critic receives it.

## WHAT THIS WAVE CHANGED — TWO BUILDS ON TWO FILES, AND THREE PIECES THAT GOT NOTHING

Each builder owned a disjoint file set and neither could see the other. They were told what to
close, not what to write — so measure what LANDED, not what was asked for.

1. **The TITLEBAR's left-group BREAK was widened, and the tick was fenced off.** A builder owning
   only titlebar.css was told that last wave's build closed the mark-to-name tick (4 -> 9px
   painted, inside the 8-10 asked) and that its critic dropped that half of the gap and re-raised
   only the break. The file records **1.3x** as "far too weak to break the run" and **1.63x** as
   enough; the break's ratio to the interval beside it had fallen from 12/4 = 3.00x to
   **13/9 = 1.44x painted**. The builder was given a hard budget — the three intervals may not sum
   past **33px** and summed **27.5**, so 5.5px of headroom — and told the break paints roughly
   1.5px less than declared because a pill cap recedes from the midline. **It was explicitly
   forbidden to touch the 9px tick or the 4px pill-to-pill channel.**
2. **The TOOL CARD's disclosure rows had their reserved height removed and were given a resting
   ground.** A builder owning only tool-card.css was told last wave's build landed as designed and
   made the card worse on three measured axes: \`align-self: stretch\` painted **zero** pixels, the
   card's inner height went **108 -> 134 and 109 -> 135** (+24%), and the disclosure pair's
   clearances inverted from **13 / 13 (1.00x)** to **20 / 26 (1.30x)** and **19 / 26 (1.37x)**. It
   was directed to drop \`min-height: 28px\`, keep \`align-self: stretch\`, and give the row a
   visible resting ground — the reasoning being that the paint, not the height, is what makes a row
   read as operable. **A nonzero number of pixels must change colour this wave; that is the exact
   thing last wave's build failed to do.**
3. **WELCOME, SIDEBAR and INPUTBAR GOT NO BUILDER.** Welcome's mark-depth ask cannot be built
   inside one file (its two instances live in chat.css and titlebar.css, and the shared cue would
   need the banned tokens.css). InputBar's seam is fenced on both sides and is owner-shaped.
   **Sidebar's ask was refuted by the leg BEFORE the fan-out** — see the next section, and check
   the leg's reasoning, because it is the kind of claim you have caught before.
   **So welcome.png, welcome-min-window.png, sidebar.png and input-bar.png are CONTROLS this wave
   and should be byte-identical to wave 7.**

## THE LEG REFUTED THE SIDEBAR ASK PRE-BUILD. CHECK THAT REASONING.

The Sidebar critic asked to replace the rail's raw \`cwd\` project heading with the project
basename, exposing the full path on hover. The leg refused to build it, on the grounds that a
driver asserts BOTH that some group heading's text folds to the full directory path AND that at
least one heading is long enough to engage head-truncation — and that \`.session-group-head\`
carries authored \`direction: rtl\` / \`unicode-bidi: plaintext\` specifically so a long path keeps
its meaningful tail. The leg's conclusion was that the ask deletes a deliberate, tested,
shipped behaviour rather than fixing a defect.

**You are not asked to agree.** You are asked whether the rail's project heading, as it actually
paints, is coherent with how the same value is presented on the other surface that shows it — the
titlebar renders \`basename(cwd)\` while the rail renders the whole path. That inconsistency is
real regardless of who is right about the driver. Measure what each surface actually paints and
say whether the app holds one treatment or two.

## THE WAVE'S OWN SEAM QUESTION — THIS IS THE ONE THAT MATTERS MOST

Last wave you found the run's sharpest coherence defect: **two builders answered the same brief
class in opposite vocabularies.** The Sidebar's filter control was made to read as operable by
spending **6,171px of visible resting ground** (a \`var(--border)\` fill plus an 8px radius, a
measured OKLCH lightness step of +0.08 over 223x28). The tool card's disclosure rows were made to
read as operable by spending **zero painted pixels and 13px of air per row**. You wrote that the
app now holds two contradictory answers to "how does a quiet control announce it is operable",
shipped in the same commit.

**Wave 8 was briefed to resolve that seam in the ground direction** — the tool card row now gets a
ground, on the argument that the Sidebar's answer is the one whose critic subsequently moved off
the axis while the tool card's answer got named back as the defect. **Did it actually resolve?**
Measure both controls' resting treatment — ground token, lightness step, radius, inset — and say
whether the app now holds ONE answer or two. If the tool card's new ground differs in kind from
the rail's, the seam moved rather than closed, and that is a finding.

## THE CONTROLS, AND THE ATTRIBUTION THAT SHOULD CLOSE AT ZERO REMAINDER

The attribution control has closed at zero remainder for **five consecutive waves** and is the
thing this run leans on hardest. Two builds this wave, on two surfaces, so:

**changed pixels in titlebar's zone + changed pixels in chat's zone should equal the total changed
pixels in window-session.png, with no remainder.** Any remainder is either a build touching a
surface it did not own or a nondeterministic instrument, and both are worth more than anything
else you could report. Do it at component level, not just as a total. Cross-check with a second
anchor if you can find one — last wave you used chat.png bottom-anchored against the short frame
top-anchored and closed a +52 discrepancy arithmetically.

## WHAT TO CHECK, AND THE TRAPS THAT HAVE FIRED BEFORE

⚠️ **Erode the mask, do not inset the bounding box.**
⚠️ **Do not mask on hue when the question is about hue.**
⚠️ **Measure straight-run LENGTH, not pixel share** — the share check has reported the opposite of
the truth three times on the same element.
⚠️ **Exclude full-width chrome from a column-ink scan** — last wave a titlebar measurement caught
the hairline at y47 and read the whole strip as one run.
⚠️ **Void a bad measurement out loud rather than publishing it.** Last wave the leg voided two of
its own and discarded a third, and you corrected yourself twice. That is the standard.

## ONE NEW QUESTION THE LEG WANTS RESOLVED, AND IT MAY BE A SPEC DIVERGENCE NOBODY HAS FLAGGED

Last wave you corrected a number the leg had been carrying: the clear above and below the chat's
date divider is **45px, not 40**, and the symmetry holds exactly at 45 and 45. The leg treated that
purely as a stale note being fixed. **But DESIGN.md's own Layout section says "24px vertical gaps,
40px around the date divider" — so the authored spec ALSO says 40, and the app paints 45.**

Nobody has checked whether those two numbers are measuring the same thing. Resolve it: re-measure
the clear, and say whether 45 painted is consistent with an authored 40 (margin collapse, the
rule's own thickness, half-leading, a border-box difference) or whether the app genuinely diverges
from its own spec by 5px on this element. **Either answer is valuable and neither is a build
instruction** — if it is a real divergence it is an owner call about which number is right, not
something a wave should silently "fix". Report it under dateDividerControl.

Report your findings. Also report NOT-FINDINGS: things a future wave might refile that you have
measured and can rule out. Those have repeatedly been worth as much as the findings.`

const SMOOTHING_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['seams', 'identityFloor', 'typeScale', 'titlebarBreakRatio', 'toolCardHeight', 'toolCardPaint', 'groundVocabularySeam', 'pathTreatment', 'flankSymmetry', 'dateDividerControl', 'jogControl', 'ownershipControl', 'markControl', 'findings', 'notFindings', 'newPieceProposal'],
  properties: {
    seams: { type: 'string', enum: ['SEAMS VISIBLE', 'COHERENT'] },
    identityFloor: { type: 'string', description: 'HOLDS or BREAKS, with the measured numbers' },
    typeScale: { type: 'string', description: 'HOLDS or BREAKS, with the measured numbers' },
    titlebarBreakRatio: { type: 'string', description: 'Painted clearance at all three left-group intervals against wave 7 measured 9 / 13 / 4, the break-to-neighbour ratio against the 1.63x threshold and the 1.44x it fell to, and the group right edge against x272' },
    toolCardHeight: { type: 'string', description: 'Card inner heights against wave 7 134 and 135 and wave 6 108 and 109, the two disclosure clearances against 20/26 and 19/26, and whether they returned to uniform' },
    toolCardPaint: { type: 'string', description: 'How many pixels changed colour inside the tool card and where — the specific thing last wave failed at. Include the new ground token, its OKLCH lightness step over the card surface, and the label left edge against the card prose alignment' },
    groundVocabularySeam: { type: 'string', description: 'The wave seam question: does the app now hold ONE answer or two to how a quiet control announces it is operable? Compare the rail filter input and the tool card disclosure row by ground token, lightness step, radius and inset' },
    pathTreatment: { type: 'string', description: 'What the rail project heading paints versus what the titlebar paints for the same cwd, measured' },
    flankSymmetry: { type: 'string', description: 'Session title ink midpoint against window centre 720.00, and the mark left inset and size' },
    dateDividerControl: { type: 'string', description: 'The 1.00px tracking debt and the 45/45 clear re-measured as a control, unchanged or not' },
    jogControl: { type: 'string', description: 'Transcript and composer edges in window-session-short.png against wave 7 (-5.00px short frame, 0.00px overflowing), and whether content moved without the column moving' },
    ownershipControl: { type: 'string', description: 'Byte-identity of welcome.png, welcome-min-window.png, sidebar.png, input-bar.png and the three docks, and the window-session attribution with its remainder' },
    markControl: { type: 'string', description: 'Marks byte-identical to wave 7 at all sites, as a control only' },
    findings: { type: 'array', items: { type: 'string' }, description: 'Numbered findings, each carrying a measurement' },
    notFindings: { type: 'array', items: { type: 'string' }, description: 'Measured and ruled out, so a later wave cannot refile them' },
    newPieceProposal: { type: 'string', description: 'One proposal with its reason, or "NONE" with why not' },
  },
}

const tasks = [
  ...pieces.map((p) => () =>
    agent(
      `${CRITIC_SHARED}

## YOUR PIECE: ${p.name}

You are judging ${p.what}

## READ EXACTLY THESE THREE IMAGES, IN THIS ORDER

1. ${CAP}/${p.surface}
   The surface itself, clipped to its own bounding box. This is the thing you are judging.
2. ${CAP}/${p.frame}
   The SAME surface in its whole window, so you can judge it as composition rather than as a
   crop. A surface clipped to its own box cannot answer a composition question, which is why you
   get both.
3. ${BAR}/${p.ref}
   The REFERENCE. This is a whole page from a different product, chosen as the standard for this
   kind of surface. Judge against it as a piece of craft, not as a template to copy.

Read only those three. Do not go looking for more images, and do not read any source code,
diff, commit, or project document other than the spec files named below — your independence is
the entire point of your existence, and a critic that reads the builder's reasoning is worthless.

## THE SPEC — read as a FENCE for PART D only

Read these two files at the project root: DESIGN.md and PRODUCT.md. DESIGN.md is the design
system and is the source of truth for the renderer. PRODUCT.md carries the purpose, the single
intended user, and the anti-references. Use them ONLY to answer PART D. Do not use them as your
yardstick in PART B — the reference image is the yardstick.

Now produce PART A, PART B, PART C and PART D.`,
      { label: `critic:${p.name}`, phase: 'Judge', model: 'sonnet', schema: VERDICT }
    )
  ),
  () => agent(SMOOTHING, { label: 'smoothing:whole-artifact', phase: 'Judge', schema: SMOOTHING_SCHEMA }),
]

const out = await parallel(tasks)

return { critics: out.slice(0, 5), smoothing: out[5] }
