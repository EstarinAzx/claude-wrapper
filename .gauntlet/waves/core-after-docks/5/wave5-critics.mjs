export const meta = {
  name: 'gauntlet-wave5-critics',
  description: 'Gauntlet run 3 wave 5: five blind cross-model critics plus one whole-artifact smoothing pass',
  phases: [{ title: 'Judge', detail: 'five blind critics on a non-Anthropic family, one smoothing pass' }],
}

const CAP = '.gauntlet/waves/core-after-docks/5'
const BAR = '.gauntlet/waves/core-after-docks/1/bar-half'
const ROOT = 'D:/.claude/claude projects/playground/4'

const BAR_WIN = `Every surface of the running app survives side by side with Linear — none reads
as the one nobody finished, every empty state is authored copy plus a real action rather than a
placeholder mark, and one type scale holds across all of them — while never drifting off
frost-mono-reference.png: near-black, one mint accent under 10% of surface, no decorative glass
beyond the single named exception.`

// BYTE-IDENTICAL to wave 4's CRITIC_SHARED, deliberately. Verdicts are only
// comparable across waves if the instrument does not drift — including leaving
// constraint 2's "mark DEPTH is a fair question" in place now that depth has
// shipped, so a critic raising it again is information rather than noise.
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

const SMOOTHING = `You are the SMOOTHING PASS for gauntlet run 3, wave 5, on the claude-wrapper
Electron app at ${ROOT} (branch gauntlet/core-after-docks).

You are the ONLY agent this wave with a view of the WHOLE artifact. Five per-surface critics are
each judging one surface in isolation and none of them can see across surfaces. Your job is
coherence: does this read as ONE application, or as several surfaces improved separately?

## MEASURE, DO NOT ASSERT

This is the whole value you add. Previous smoothing passes wrote their own PNG decoders and
measured pixels rather than describing impressions, and that is what let this run refute six
critic gaps that were merely plausible. Every claim you make should carry a number you produced.
If you catch yourself writing "feels" or "seems", either measure it or drop it. If you make an
error and catch it, say so and correct it — previous passes did exactly that and it strengthened
their reports.

You may run Bash and read files freely. Node is available. There is no image library dependency
you may add, but Electron's nativeImage is already a dependency and you can decode PNGs yourself.

## THE CAPTURES

Wave 5 (current, just captured): ${CAP}/
Wave 4 (the previous wave, for A/B): .gauntlet/waves/core-after-docks/4/
Wave 3: .gauntlet/waves/core-after-docks/3/
Wave 2: .gauntlet/waves/core-after-docks/2/
Wave 1 (baseline): .gauntlet/waves/core-after-docks/1/

Eleven files each: welcome.png, welcome-min-window.png, titlebar.png, sidebar.png, chat.png,
input-bar.png, window-welcome.png, window-session.png, agents-dock.png, appearance-dock.png,
commands-dock.png.

## WHAT THIS WAVE CHANGED — TWO BUILDS, ONE LEG CHANGE, AND ONE PIECE THAT GOT NOTHING

1. **The sessions rail's pre-list stack was COMPRESSED IN PLACE.** The first session row began at
   y225 (26.4% of the 852px rail). Nothing was relocated — a previous attempt to relocate the live
   "Background sessions" section was reverted on a DOM-order test, and this wave's change is pure
   tightening of paddings and gaps in one stylesheet.
2. **The composer's centring axis was SHIFTED to close the 5px seam.** See (a) — check this
   hardest, because it is the first attempt at this seam that was not reverted.
3. **THE LEG ITSELF unified the row vocabulary**, which is not a builder's change: the sessions
   row has worn a 16px corner since wave 3 while the two dock rows kept 8px, and the design system
   calls the Agents dock the rail's mirror with the "same row shell". The dock rows now take the
   same token.
4. **THE IDENTITY MARK WAS NOT TOUCHED. Its builder slot could not be filled.** Eighteen agents
   stalled across three brief shapes without producing a justified change; one interrupted attempt
   left an underived value in the tree and it was REVERTED. **So every mark in every capture must
   be byte-identical to wave 4, and that is now one of your sharpest controls** — the rail and the
   composer changes both live in other stylesheets, so a single changed pixel inside any mark
   means something leaked.

## THE DOCK CAPTURES WILL CHANGE THIS WAVE, FOR THE FIRST TIME IN THE RUN. THAT IS EXPECTED.

agents-dock.png, appearance-dock.png and commands-dock.png have been BYTE-IDENTICAL across waves
1, 2, 3 and 4 — the run's strongest ownership control. Change (4) above spends that control
deliberately. **The change is radius-only and therefore layout-neutral, so the diff should be
confined to CORNER BANDS and nothing else should move by a pixel.** Measure that precisely: if any
dock pixel changes outside a corner band, or if any row's height or text position moves, that is a
finding and the change should be reverted. This is the single most falsifiable prediction of the
wave — please test it rather than accept it.

## THE MEASUREMENTS THAT MATTER MOST THIS WAVE

**(a) THE 5px SEAM — this wave attempted it, so it is a FIX TO VERIFY, not a control.** For three
waves the app's most-repeated measure has jogged at the composer seam: the transcript column at
x459..1218 (w=760) and the composer pill at x464..1223 (w=760), one directly above the other, each
correctly centred in its own pane (1182px scrollbar-narrowed versus 1192px). The composer side was
moved this wave. **Measure both edges and report whether the jog is now 0.** Then re-measure ALL
SIX centring places, because a container-level shift that closed the seam but broke the composer's
internal centring (the controls strip and footer line share the pill's axis at 0.00px) would be a
fix that traded one seam for another.

INSTRUMENT WARNING, carried forward and still binding: "off-centre" must be read off the INK
BOUNDING BOX, not the mass-weighted ink centroid. The two agree for a block whose items are each
centred and DISAGREE for a left-registered one, because left registration necessarily drags the
mass left of the bbox centre. The Welcome hero is left-registered by design; two waves ago its
centroid read -91.59px while its bbox displacement was +0.50px, and the centroid moved +32.86px
against a block translation of +33px, proving the residual is a property of the composition. A
future pass measuring the centroid would "discover" a 91px defect that does not exist. Note also
that a LEFT-MINUS-RIGHT MARGIN ASYMMETRY is twice the corresponding centre displacement; never
compare an asymmetry against a displacement.

**(b) THE MARK — A CONTROL THIS WAVE, PLUS THE ONE MEASUREMENT THE WAVE MOST WANTS FROM YOU.**

The marks did not change (see 4 above), so first the control: confirm every mark interior is
byte-identical to wave 4 at all three sites.

⚠️ **YOUR WAVE-4 FINDING 2 IS REFUTED, and you should not refile it.** You reported that one alpha
was "painting three different finishes" because the measured stddevs came out 5.00 / 5.77 / 4.90
across the three sizes. The leg tested that on your own wave-4 captures and it does not survive: a
FIXED 2px erosion samples 81.8% / 90.9% / 85.7% of a 22px / 44px / 28px box, so the three numbers
are three different fractions of ONE ramp. Correcting for the sampled span gives implied ramp
ranges of 22.8 / 23.4 / 23.2, and an independent least-squares fit of the interior ramp slope
against normalised depth gives -21.80 / -22.77 / -22.34 — agreeing to 4.3%. **The three sites paint
ONE finish and did so last wave too.** If you disagree, say so with a measurement; do not restate
the original claim.

**NOW THE MEASUREMENT THAT MATTERS, AND IT IS ABOUT THE REFERENCE RATHER THAN THE APP.** Two waves
have now framed a Titlebar gap as "the app's depth is a proportional black multiply, while the
reference's shifts CHROMA across the face". That framing decided which builder ran this wave, so
it is worth an independent check by somebody who is not the leg.

Measure, in \`.gauntlet/bar/identity/frost-mono-reference.png\` and in the app's captures, for each
mark: the **OKLCH lightness, chroma AND hue at the TOP row and at the BOTTOM row** of the mark's
interior, and the delta between them. Skip the antialiased rim rows — on a 28px disc the first and
last rows are almost entirely rim, which is what made an earlier fixed-inset reading misleading.

Report the three deltas per mark. The specific questions: **is the reference's mark even at the
same hue as the app's?** And **does the reference's depth cue move chroma, or does it move hue?**
Whichever it is, that is a fact about the bar the whole run has been reasoning from, and nobody
has measured it until now. Give numbers and let them say what they say.

**(c) THE IDENTITY FLOOR — a control, not a risk, this wave.** No mark changed, so the floor should
be unchanged. Confirm exactly ONE mint hue across the app's sites, report the hue angle, the site
count, and the worst-case surface mint share against the 10% ceiling; last wave's was 4.134% on
welcome-min-window. Note the rail compression moves mint-bearing rows around, so a share may shift
slightly for a purely geometric reason — say which you are seeing.

**(d) THE RAIL COMPRESSION.** The first session row's top edge measured **y225** for four waves
(26.4% of 852px). Report where it is now, as a number and as a percentage. The target was ~175px.
Then check the thing a vertical compression most easily breaks: **the rail's shared 16px LEFT
EDGE**, which the head's padding, the filter placeholder, the scope chips and the group headings
and row titles all sit on. It must not have moved. Also confirm the empty state still carries both
its copy and its named action — the reference standard requires an empty state to be authored copy
plus a real action, and compressing a band is the easy way to lose that.

## CONTROLS YOU SHOULD RUN

- **welcome.png, welcome-min-window.png, window-welcome.png and titlebar.png should be
  BYTE-IDENTICAL to wave 4.** Neither surviving change can reach them: the welcome pane renders
  outside both the rail and the transcript's scroll container, and the titlebar is neither. This is
  the wave's cleanest ownership proof, and it is a stronger one than usual because the mark change
  was reverted — so these four files test the revert AND the two builders' file discipline at once.
- **chat.png should be BYTE-IDENTICAL to wave 4.** The composer change lives in a different
  stylesheet and the transcript pane was NOT touched (its gutter is pinned by a driver whose own
  comment says "never widen these"). If chat.png moved, the composer change leaked upward.
- **Attribute every changed pixel** in window-session.png to exactly one named target. The last two
  waves both closed at ZERO remainder (window-session 1,765 = 656 + 656 + 453; window-welcome
  2,242 = 1,789 + 453). window-session contains both the rail and the composer, so its total should
  equal the sum of the two surface captures' own totals exactly. Reproduce that discipline.

## FINDINGS CARRIED FORWARD — re-measure these, do not re-derive them

- **The selection stripe.** It is an inset shadow clipped to the row's rounded rect, so its
  straight run is \`height - 2r\`. When the session row's corner grew it fell from 66px to 54px at
  column x7 — **89% to 73%** of the 74px row — and the trap you identified is that total sidebar
  mint pixels ROSE (165 to 173) because the taper adds antialiased pixels, so a share-based check
  reports the opposite of what happened. **Only run length shows it.** This wave the DOCK rows take
  the same corner, so check whether the dock rows have any equivalent indicator that just lost run.
- **The radius-ratio table stays RETIRED as a model.** The tracking is inverse, it survived only on
  four hand-picked members, and two boxes of identical height wear different corners. Report radii
  if useful; do not resurrect the table as a rule.
- **The transcript's scroll state.** You measured ~89px of transcript sitting ABOVE the viewport,
  rows y0..y12 empty, and the first visible element's rounded corner fully visible from y13 —
  nothing clipped. That means a critic judging chat.png alone cannot see the top of the transcript,
  including the date divider that its assigned reference was chosen to judge. **Re-measure it as a
  control** and say whether it changed. It is filed as an instrument gap, not fixed — a wave does
  not sweep its own instrument — so do not propose fixing it, just confirm the number.

## THE TWO FLOORS YOU CHECK EVERY WAVE

- IDENTITY FLOOR: exactly ONE mint hue, and mint under 10% of every surface. Report hue values,
  site count and worst-case surface share. See (c) — this is the wave where it can actually break.
- ONE TYPE SCALE: do all rendered sizes land within half a pixel of 15 * 1.15^k for whole k?
  Last wave: max deviation 0.342px against a 0.35 tolerance, zero off-ladder, and baseline pitch
  measured at exactly 24.0px on two surfaces against 15 * 1.6. Note that the type scale holding
  as NUMBERS is not the same as each rung's stated ROLE holding; a known unresolved conflict
  exists where a UI label sits on the prose rung, and the owner has that one.

## CONSTRAINTS

- Colour, translucency and material are OUT OF SCOPE for any verdict, for the same reason given
  to the critics: the wash is composited by the OS and no capture can see it. You MAY measure and
  report colour as evidence (hue counts, alpha values, pixel shares) — that is how the floors are
  checked. You may not turn it into a design defect.
- The identity mark is solid by design, no glyph. Mark DEPTH is fair game.
- You may propose ONE new piece for the run's decomposition, capped at one, and only if the
  decomposition is visibly missing something. Give your reason. Pieces are otherwise fixed on
  purpose: a churning piece list destroys the plateau signal. Note that a previous pass proposed
  ToolCard and it was PARKED, because adopting it requires rewriting a human-owned scoping rule
  and a loop body must not edit the boundary of its own scope. Note also that the last THREE passes
  each concluded "the missing artifact is a test, not a piece" — if that is your best answer
  again, say so, and say whether the test you would write is the same one.
- Do NOT edit any file under src/, tests/, .gauntlet/, or .claude/. You are read-only on the
  repository. You may write scratch files under .gauntlet/scratch/ if you need them.
- Do NOT run npm, any build, or any test. The leg gates centrally.

## YOUR OUTPUT

A verdict of SEAMS VISIBLE or COHERENT, the identity floor as HOLDS or BREAKS with its numbers,
the type scale as HOLDS or BREAKS with its numbers, the six centring measurements, the seam result
from (a), the three mark stddevs and hue readings from (b) and (c), the rail compression from (d),
the dock corner-band result, the ownership/attribution control, and your numbered findings. Also
report NOT-FINDINGS: things a future wave might refile that you have measured and can rule out.
Those have repeatedly been worth as much as the findings.`

const SMOOTHING_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['seams', 'identityFloor', 'typeScale', 'centring', 'seamResult', 'markDepth', 'hueGuard', 'railCompression', 'dockCornerBands', 'ownershipControl', 'scrollState', 'findings', 'notFindings', 'newPieceProposal'],
  properties: {
    seams: { type: 'string', enum: ['SEAMS VISIBLE', 'COHERENT'] },
    identityFloor: { type: 'string', description: 'HOLDS or BREAKS, with the measured numbers' },
    typeScale: { type: 'string', description: 'HOLDS or BREAKS, with the measured numbers' },
    centring: { type: 'string', description: 'All six blocks re-measured, wave 4 vs wave 5, off the ink bounding box' },
    seamResult: { type: 'string', description: 'The composer seam: transcript column and composer pill edges, with numbers. Closed or not.' },
    markDepth: { type: 'string', description: 'Mark byte-identity control vs wave 4, plus OKLCH L/C/hue at top and bottom of each mark in BOTH the app and the identity reference, with deltas' },
    hueGuard: { type: 'string', description: 'Identity floor control: one mint hue, hue angle, site count, worst-case surface share' },
    railCompression: { type: 'string', description: 'First session row top edge as px and percent, the shared 16px left edge, and the empty state copy+action' },
    dockCornerBands: { type: 'string', description: 'Dock diffs vs wave 4: confined to corner bands or not, with pixel counts and any layout movement' },
    ownershipControl: { type: 'string', description: 'welcome diff confinement; pixel attribution with remainder; chat.png confinement' },
    scrollState: { type: 'string', description: 'Content above the transcript viewport, as a control against last wave' },
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
