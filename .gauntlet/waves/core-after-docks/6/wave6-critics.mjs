export const meta = {
  name: 'gauntlet-wave6-critics',
  description: 'Gauntlet run 3 wave 6: five blind cross-model critics plus one whole-artifact smoothing pass',
  phases: [{ title: 'Judge', detail: 'five blind critics on a non-Anthropic family, one smoothing pass' }],
}

const CAP = '.gauntlet/waves/core-after-docks/6'
const BAR = '.gauntlet/waves/core-after-docks/1/bar-half'
const ROOT = 'D:/.claude/claude projects/playground/4'

const BAR_WIN = `Every surface of the running app survives side by side with Linear — none reads
as the one nobody finished, every empty state is authored copy plus a real action rather than a
placeholder mark, and one type scale holds across all of them — while never drifting off
frost-mono-reference.png: near-black, one mint accent under 10% of surface, no decorative glass
beyond the single named exception.`

// BYTE-IDENTICAL to wave 4's and wave 5's CRITIC_SHARED, deliberately. Verdicts are
// only comparable across waves if the instrument does not drift — including leaving
// constraint 2's "mark DEPTH is a fair question" in place now that the depth thread
// has closed, so a critic raising it again is information rather than noise.
//
// THE TWELFTH CAPTURE IS DELIBERATELY NOT GIVEN TO ANY CRITIC. It exists from this
// wave on, and handing it over would mean either a fourth image (which killed a
// critic on context length at run 1 wave 2) or swapping a critic's frame — and
// swapping the inputs is exactly what makes a verdict incomparable to the five
// waves before it. The smoothing pass and the leg read it; the critics do not.
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

const SMOOTHING = `You are the SMOOTHING PASS for gauntlet run 3, wave 6, on the claude-wrapper
Electron app at ${ROOT} (branch gauntlet/core-after-docks).

You are the ONLY agent this wave with a view of the WHOLE artifact. Five per-surface critics are
each judging one surface in isolation and none of them can see across surfaces. Your job is
coherence: does this read as ONE application, or as several surfaces improved separately?

## MEASURE, DO NOT ASSERT

This is the whole value you add. Previous smoothing passes wrote their own PNG decoders and
measured pixels rather than describing impressions, and that is what let this run refute eight
critic gaps that were merely plausible. Every claim you make should carry a number you produced.
If you catch yourself writing "feels" or "seems", either measure it or drop it. If you make an
error and catch it, say so and correct it — previous passes did exactly that and it strengthened
their reports. Last wave you corrected the LEG's own method, not a builder's claim, and that
correction is the reason the wave's headline result is trustworthy. Do that again if you see it.

You may run Bash and read files freely. Node is available. There is no image library dependency
you may add, but Electron's nativeImage is already a dependency and you can decode PNGs yourself.
Reusable instruments from last wave live in .gauntlet/scratch/: wave5-diff.mjs (per-capture pixel
diff with connected components), wave5-verify.mjs (span-corrected mark reader),
wave5-ramp-profile.mjs, wave5-mark-solve.mjs.

## THE CAPTURES

Wave 6 (current, just captured): ${CAP}/
Wave 5 (the previous wave, for A/B): .gauntlet/waves/core-after-docks/5/
Wave 4: .gauntlet/waves/core-after-docks/4/
Wave 3: .gauntlet/waves/core-after-docks/3/
Wave 2: .gauntlet/waves/core-after-docks/2/
Wave 1 (baseline): .gauntlet/waves/core-after-docks/1/

Waves 1-5 hold ELEVEN files each: welcome.png, welcome-min-window.png, titlebar.png, sidebar.png,
chat.png, input-bar.png, window-welcome.png, window-session.png, agents-dock.png,
appearance-dock.png, commands-dock.png.

**Wave 6 holds TWELVE.** See the next section — the twelfth is the leg's own instrument change
and it is the most interesting thing in this wave.

## THE TWELFTH CAPTURE — window-session-short.png — AND WHAT IT IS FOR

Four consecutive smoothing passes concluded "the missing artifact is a test, not a piece". Last
wave you specified the test exactly, and this wave the leg built it: a session frame in which the
transcript does NOT overflow. The window is grown by the measured overflow rather than the
conversation being shortened, because a shorter fixture would move the sessions rail — a surface a
builder is being attributed on this wave. Growing downward leaves every x-coordinate directly
comparable to window-session.png, which is the axis both questions below are measured on.

**THE LEG ALREADY RAN THE NON-PERTURBATION CONTROL and you should not spend time repeating it:**
a capture on a tree with no src/ change produced the eleven original files byte-identical to wave
5 plus the new twelfth. The instrument change is additive and does not disturb the existing set.

This capture exists to settle TWO open items, and both are yours this wave:

**(a) THE FALSIFIABLE -5px JOG. This is the wave's headline prediction — test it first.**
Last wave the composer's padding was changed to close a 5px seam, and you showed the seam was
RELOCATED rather than closed. Your model: .chat is overflow-y auto behind a CLASSIC 10px
scrollbar, which occupies layout space only WHILE the content overflows, so

  | | transcript overflowing | transcript NOT overflowing |
  | wave 5 | jog 0 | jog -5px |

You validated that model against three measured positions to the exact pixel and then drew the
fourth cell as a PREDICTION. Nothing had ever photographed that fourth cell. Now something has.

**In window-session-short.png, measure the transcript column's left and right edges and the
composer pill's left and right edges.** The model predicts transcript x464..1223 against composer
x459..1218 — a -5px jog. Report what you actually measure. **If it is not -5px, your model is
wrong and saying so is worth more than the prediction being right.** This is the first time this
run has had a capture that can falsify a smoothing-pass model, so treat it as an adversarial test
of your own work rather than a confirmation.

**(b) THE DATE DIVIDER, IN FRAME FOR THE FIRST TIME IN THE RUN.**
The bar's own manifest assigns linear-changelog to judge "Chat transcript: long-form reading, DATE
DIVIDERS" — and no capture in three runs has ever shown one, because the pane opens scrolled to
the latest turn. You have measured that scroll offset as a control for two waves (about 89px above
the viewport, thumb y79..716). This frame has no scroll offset.

Report: **is the date divider present, where is it, and what does it look like as a piece of
composition?** Its geometry, its rules or hairlines, its label, its vertical rhythm against the
turns above and below it. This is the element the Chat critic has been unable to see for the whole
run while repeatedly returning to the one axis it COULD see. You are the first agent in the run to
look at it. Say whether it is well made.

Also report what ELSE the top of the transcript reveals that no critic has been able to judge.

## WHAT THIS WAVE CHANGED — TWO BUILDS, ONE LEG INSTRUMENT CHANGE, AND THREE PIECES THAT GOT NOTHING

1. **The TITLEBAR's left cluster was tightened.** The identity group (mark, app name, and two
   state pills) painted out to x276 while the sessions rail's divider below it is at x247, so the
   group crossed a structural column by 29px. A builder owning only titlebar.css was asked to end
   the group before that line. Its own arithmetic may have refuted the target — check what landed
   against what the group's floor can actually reach.
2. **The ROW CORNER was decided.** All three row types (sessions rail rows, agents dock rows,
   commands dock rows) have shared one corner token since last wave. A builder owning only
   rails.css was asked to decide whether that value is 8 or 16 and to derive it. Whatever it chose
   moves the rail AND both dock captures together.
3. **THE LEG added the twelfth capture** (above). No src/ file was touched for it, and the bundle
   hash is unchanged, so it cannot have moved a pixel in the other eleven.
4. **WELCOME, CHAT and INPUTBAR GOT NO BUILDER.** Welcome is blocked on an owner call raised by
   four critics on four waves; Chat's prose-weight thread is a reported plateau signal; InputBar's
   seam is fenced on both sides. **So welcome.png, welcome-min-window.png, chat.png and
   input-bar.png are CONTROLS this wave** — see below.

## THE CONTROLS, AND THE ATTRIBUTION THAT SHOULD CLOSE AT ZERO REMAINDER

The two builds own two files and the file ownership was disjoint by construction. That predicts an
exact map, and the last three waves all closed their attribution at zero remainder. Reproduce it.

- **welcome.png, welcome-min-window.png and chat.png and input-bar.png should be BYTE-IDENTICAL
  to wave 5.** None of the three changes can reach them: the welcome pane renders outside both the
  titlebar strip and the rail, the transcript pane is in neither stylesheet, and the composer is in
  a third file nobody edited. This is the wave's cleanest ownership proof.
- **window-welcome.png should change ONLY inside the titlebar strip, y0..47.** It is a whole-window
  frame so it carries the titlebar, but there is no rail at the welcome stage. Any changed pixel
  below y47 in that file means the titlebar builder leaked.
- **titlebar.png and sidebar.png carry one build each.**
- **The three dock captures move if and only if the corner value changed.** They were byte-identical
  across waves 1-4, and wave 5 spent a third of that control on the corner propagation. Report what
  it costs this wave.
- **window-session.png contains the titlebar and the rail and nothing else that changed**, so its
  changed-pixel total should equal the sum of titlebar.png's and sidebar.png's own totals exactly.
  Attribute every changed pixel to exactly one named target and report the remainder.

## THE MEASUREMENTS THAT MATTER MOST THIS WAVE

**(c) THE TITLEBAR GROUP AGAINST THE STRUCTURAL COLUMN.** Measure the left group's painted extent
in the new capture, and measure the sessions rail's divider column. Report the overrun as a signed
number: it was +29px (group ends x276, divider x247). Then check the thing this change most easily
breaks — the titlebar's flank symmetry. The session title is centred by two flex flanks over their
min-content floors; report the title's ink midpoint against the window centre, which has measured
exactly 720.0 with 0.00 displacement in every wave so far. Also confirm the mark's own left inset
is still 14px and the mark itself is untouched at 22px.

**(d) THE ROW CORNER — MEASURE STRAIGHT-RUN LENGTH, NOT PIXEL SHARE.** This trap has now caught
this exact class of change TWICE: when the corner grew, pixel count inside the border band ROSE
(+79) while ink weight FELL 3.0%, so a count-based or share-based check reported the opposite of
what happened. Only run length shows it.

Report, for whatever value landed: the straight-run length of the box edge as an absolute number
AND as a percentage of the edge, for the 74px rail row, the 65px command rows and the 49px command
rows. Last wave at 16px those read 66.2% on the 65px rows and 55.1% on the 49px rows, down from
87.7% and 83.7% at 8px. Also re-measure the SELECTION STRIPE, which is an inset shadow clipped to
the row's rounded rect so its straight run is height minus 2r: it fell from 66px to 54px (89% to
73% of the 74px row) when the corner grew.

The open question the builder was asked to decide, and which you should judge independently: **one
token is not one shape.** The same corner now sits on boxes of 74, 65 and 49px, and the
stylesheet's own argument for exempting a sibling control — a narrow box and a wide one cannot
share one corner — was applied to WIDTH and never to HEIGHT. Say whether what landed answers that.

## FINDINGS CARRIED FORWARD — re-measure these, do not re-derive them

- **The mark-depth thread is CLOSED and must not be reopened.** You closed it yourself last wave by
  refuting the leg's own gap: the reference's marks are not at this app's hue (192.7-193.4 against
  179.9-180.5) and their depth ROTATES HUE by +11.3 to +12.5 degrees with chroma rising, while this
  app's is a hue-preserving multiply. Copying the reference's mechanism means moving hue, and the
  one-accent floor is counted BY hue. Confirm the marks are byte-identical to wave 5 as a control
  and move on. Do not re-derive the closure.
- **Off-centre is read off the INK BOUNDING BOX, never the mass-weighted centroid.** The two agree
  for a block whose items are each centred and DISAGREE for a left-registered one. The Welcome hero
  is left-registered by design; its centroid read -91.59px while its bbox displacement was +0.50px.
  A pass measuring the centroid would "discover" a 91px defect that does not exist. Note also that a
  LEFT-MINUS-RIGHT MARGIN ASYMMETRY is twice the corresponding centre displacement.
- **The radius-ratio table stays RETIRED as a model.** Report radii if useful; do not resurrect it.
- **The Welcome hero's centring is FIXED at +0.50px**, which is the arithmetic floor for a 415px odd
  block in a 1440px pane rather than a residual. Confirm as a control; it is not a defect.

## THE TWO FLOORS YOU CHECK EVERY WAVE

- IDENTITY FLOOR: exactly ONE mint hue, and mint under 10% of every surface. Report hue values,
  site count and worst-case surface share. Last wave's worst case was on welcome-min-window.
  Note the corner change moves mint-bearing selection pixels around, so a share may shift for a
  purely geometric reason — say which you are seeing, and remember the run-length trap above.
- ONE TYPE SCALE: do all rendered sizes land within half a pixel of 15 * 1.15^k for whole k?
  Last wave: max deviation 0.342px against a 0.35 tolerance, zero off-ladder. Note that the type
  scale holding as NUMBERS is not the same as each rung's stated ROLE holding; a known unresolved
  conflict exists where a UI label sits on the prose rung, and the owner has that one.

## CONSTRAINTS

- Colour, translucency and material are OUT OF SCOPE for any verdict, for the same reason given
  to the critics: the wash is composited by the OS and no capture can see it. You MAY measure and
  report colour as evidence (hue counts, alpha values, pixel shares) — that is how the floors are
  checked. You may not turn it into a design defect.
- The identity mark is solid by design, no glyph. Its depth thread is closed (above).
- You may propose ONE new piece for the run's decomposition, capped at one, and only if the
  decomposition is visibly missing something. Give your reason. Pieces are otherwise fixed on
  purpose: a churning piece list destroys the plateau signal. Note that a previous pass proposed
  ToolCard and it was PARKED, because adopting it requires rewriting a human-owned scoping rule
  and a loop body must not edit the boundary of its own scope. Note also that the last FOUR passes
  each concluded "the missing artifact is a test, not a piece" — and that this wave the leg BUILT
  the test you specified. If your answer is a test again, say what it is; if the date divider you
  can now see changes your answer, say that instead.
- Do NOT edit any file under src/, tests/, .gauntlet/, or .claude/. You are read-only on the
  repository. You may write scratch files under .gauntlet/scratch/ if you need them.
- Do NOT run npm, any build, or any test. The leg gates centrally.

## YOUR OUTPUT

A verdict of SEAMS VISIBLE or COHERENT, the identity floor as HOLDS or BREAKS with its numbers,
the type scale as HOLDS or BREAKS with its numbers, the jog result from (a) stated as a signed
number against the -5px prediction, the date divider report from (b), the titlebar overrun and
flank symmetry from (c), the corner run-length table from (d), the byte-identity controls and the
zero-remainder attribution, and your numbered findings. Also report NOT-FINDINGS: things a future
wave might refile that you have measured and can rule out. Those have repeatedly been worth as
much as the findings.`

const SMOOTHING_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['seams', 'identityFloor', 'typeScale', 'jogResult', 'dateDivider', 'titlebarOverrun', 'flankSymmetry', 'cornerRunLength', 'selectionStripe', 'ownershipControl', 'markControl', 'findings', 'notFindings', 'newPieceProposal'],
  properties: {
    seams: { type: 'string', enum: ['SEAMS VISIBLE', 'COHERENT'] },
    identityFloor: { type: 'string', description: 'HOLDS or BREAKS, with the measured numbers' },
    typeScale: { type: 'string', description: 'HOLDS or BREAKS, with the measured numbers' },
    jogResult: { type: 'string', description: 'window-session-short.png: transcript and composer edges, the jog as a signed number, against the -5px prediction. Model confirmed or refuted.' },
    dateDivider: { type: 'string', description: 'Present or not, geometry, label, rhythm, and a judgement of whether it is well made' },
    titlebarOverrun: { type: 'string', description: 'Left group painted extent, rail divider column, overrun as a signed number against the previous +29px' },
    flankSymmetry: { type: 'string', description: 'Session title ink midpoint against window centre, and the mark left inset' },
    cornerRunLength: { type: 'string', description: 'Straight-run length absolute AND percent for the 74px, 65px and 49px rows, at whatever value landed' },
    selectionStripe: { type: 'string', description: 'Inset-shadow straight run on the active rail row, against last wave 54px / 73%' },
    ownershipControl: { type: 'string', description: 'Byte-identity of the four control files, window-welcome confinement to y0..47, and the window-session attribution with its remainder' },
    markControl: { type: 'string', description: 'Marks byte-identical to wave 5 at all sites, as a control only' },
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
