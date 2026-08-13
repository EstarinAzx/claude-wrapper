export const meta = {
  name: 'gauntlet-wave7-critics',
  description: 'Gauntlet run 3 wave 7: five blind cross-model critics plus one whole-artifact smoothing pass',
  phases: [{ title: 'Judge', detail: 'five blind critics on a non-Anthropic family, one smoothing pass' }],
}

const CAP = '.gauntlet/waves/core-after-docks/7'
const BAR = '.gauntlet/waves/core-after-docks/1/bar-half'
const ROOT = 'D:/.claude/claude projects/playground/4'

const BAR_WIN = `Every surface of the running app survives side by side with Linear — none reads
as the one nobody finished, every empty state is authored copy plus a real action rather than a
placeholder mark, and one type scale holds across all of them — while never drifting off
frost-mono-reference.png: near-black, one mint accent under 10% of surface, no decorative glass
beyond the single named exception.`

// BYTE-IDENTICAL to waves 4, 5 and 6's CRITIC_SHARED, spliced in programmatically from
// wave6-critics.mjs rather than retyped, and hash-verified against f89141c58449127c before
// launch. Verdicts are only comparable across waves if the instrument does not drift.
//
// THE TWELFTH CAPTURE IS STILL DELIBERATELY NOT GIVEN TO ANY CRITIC, and wave 7 has a
// stronger reason than wave 6 did. 6.9 left the choice open as an owner call. But this is
// the FIRST wave since wave 4 in which Chat has BOTH a builder AND changed pixels — the
// decisive test of whether Chat's verdict can track its own artifact at all. Swapping that
// critic's frame in the same wave would confound exactly the test that makes wave 7 worth
// running. Hold the frame; the choice returns to the owner at wave 8.
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

const SMOOTHING = `You are the SMOOTHING PASS for gauntlet run 3, wave 7, on the claude-wrapper
Electron app at ${ROOT} (branch gauntlet/core-after-docks).

You are the ONLY agent this wave with a view of the WHOLE artifact. Five per-surface critics are
each judging one surface in isolation and none of them can see across surfaces. Your job is
coherence: does this read as ONE application, or as several surfaces improved separately?

## MEASURE, DO NOT ASSERT

This is the whole value you add. Previous smoothing passes wrote their own PNG decoders and
measured pixels rather than describing impressions, and that is what let this run refute nine
critic gaps that were merely plausible. Every claim you make should carry a number you produced.
If you catch yourself writing "feels" or "seems", either measure it or drop it. If you make an
error and catch it, say so and correct it — previous passes did exactly that and it strengthened
their reports. Two waves running you have corrected the LEG's own method rather than a builder's
claim, and those corrections are why the run's headline results are trustworthy. Do it again.

You may run Bash and read files freely. Node is available. There is no image library dependency
you may add, but Electron's nativeImage is already a dependency and you can decode PNGs yourself.
Reusable instruments live in .gauntlet/scratch/: **wave6-diff.mjs** (per-capture pixel diff with
connected components — point its A_DIR/B_DIR at waves 6 and 7), **wave6-measure.mjs** (builder
prediction checks: titlebar group edge, corner straight run, short-frame jog), wave5-verify.mjs,
wave5-ramp-profile.mjs, and the w6smooth/ directory of last wave's own scripts.

## THE CAPTURES

Wave 7 (current, just captured): ${CAP}/
Wave 6 (the previous wave, for A/B): .gauntlet/waves/core-after-docks/6/
Wave 5: .gauntlet/waves/core-after-docks/5/
Wave 4: .gauntlet/waves/core-after-docks/4/
Wave 3: .gauntlet/waves/core-after-docks/3/
Wave 2: .gauntlet/waves/core-after-docks/2/
Wave 1 (baseline): .gauntlet/waves/core-after-docks/1/

Waves 1-5 hold ELEVEN files each. **Waves 6 and 7 hold TWELVE** — the twelfth is
window-session-short.png, a session frame in which the transcript does NOT overflow. You
specified that capture two waves ago, the leg built it last wave, and it immediately confirmed a
prediction of yours to the exact pixel and put the date divider in frame for the first time in
three runs. It is yours again this wave.

## WHAT THIS WAVE CHANGED — THREE BUILDS ON THREE FILES, AND TWO PIECES THAT GOT NOTHING

Each builder owned a disjoint file set and none of them could see the others. They were told what
to close, not what to write — so measure what LANDED, not what was asked for.

1. **The TITLEBAR's left cluster intervals were retuned.** A builder owning only titlebar.css was
   told that one \`gap\` cannot serve a flat interval and a capped one: the mark-to-name tick is
   flat on both sides and paints what it declares, while a pill-to-pill channel paints wider than
   declared because \`--r-pill\` caps recede from the midline. Last wave's critic measured only
   3px at the mark-to-name tick and asked for 8-10px. The builder was given a hard budget — the
   three intervals may not sum past 33px — and was explicitly told **not** to chase the sessions
   rail divider at x247, which is a target the leg withdrew this wave.
2. **The SESSIONS RAIL's filter control was given an affordance.** A builder owning rails.css and
   Sidebar.tsx was told the control reads as passive muted copy at rest, and that one third of the
   ask (a 28px hit area) already ships. It could build a hairline, a glyph, both, or refute the
   ask. **It was fenced hard on height: the pre-list stack must not grow, because the first
   session row's top edge at y202 is a landed build in the same file.**
3. **The TOOL CARD's disclosure rows were given a row shape.** A builder owning only
   tool-card.css was told each "SHOW …" action reads as a caption rather than an operable row,
   and asked for a full-width row of the app's own 28px control-housing height with the label
   vertically centred and the chevron kept. **This is the first Chat-surface build since wave 4.**
4. **WELCOME and INPUTBAR GOT NO BUILDER.** Welcome's mark-depth ask cannot be built inside one
   file — its two instances live in chat.css and titlebar.css and the shared cue would have to go
   in tokens.css, which is banned. InputBar's seam is fenced on both sides and is owner-shaped.
   **So welcome.png, welcome-min-window.png and input-bar.png are CONTROLS this wave.**

## THE CONTROLS, AND THE ATTRIBUTION THAT SHOULD CLOSE AT ZERO REMAINDER

Four consecutive waves have closed their attribution at zero remainder. Reproduce it — and note
that this wave is harder, because three builds are in play rather than two.

- **welcome.png, welcome-min-window.png and input-bar.png should be BYTE-IDENTICAL to wave 6.**
  None of the three changes can reach them: the welcome pane renders outside the titlebar strip
  and the rail, and the composer is in a stylesheet nobody edited.
- **THE THREE DOCK CAPTURES ARE THIS WAVE'S SHARPEST CONTROL ON THE SIDEBAR BUILDER.**
  agents-dock.png, appearance-dock.png and commands-dock.png were byte-identical across waves
  1-4, moved at wave 5, and returned to the wave-1 bytes at wave 6. The filter band exists only
  in the sessions rail, so **if the Sidebar builder stayed inside it, all three docks stay
  byte-identical to wave 6.** A changed dock means the build reached a shared row rule and that
  is attributable.
- **window-welcome.png should change ONLY inside the titlebar strip, y0..47.** Any changed pixel
  below y47 means the titlebar builder leaked.
- **titlebar.png, sidebar.png and chat.png carry one build each.** chat.png changing is the
  notable one — see the section below.
- **window-session.png contains all three**, so its changed-pixel total should equal the sum of
  titlebar.png's, sidebar.png's and chat.png's own totals. Attribute every changed pixel to
  exactly one named target and report the remainder.

## ⚠️ THE MEASUREMENT THIS WAVE EXISTS FOR: chat.png FINALLY MOVES

Read this carefully, because it is the wave's headline and you are the only agent who can measure
it.

**chat.png has taken exactly THREE distinct values in six waves** — one at wave 1, one shared by
waves 2 and 3, and one shared by waves 4, 5 and 6. Over those same six waves the Chat critic
returned five verdicts and **moved three times, every single time between byte-identical files**.
On the wave-4/5/6 bytes the same critic family returned TOO CLOSE, then BAR WINS, then TOO CLOSE.

Run-wide the pattern is worse than that: **five verdict movements, four of them on byte-identical
captures**, and the two pieces that changed substantially last wave both held.

**This wave chat.png should change for the first time since wave 4, because the tool cards are in
it.** So: report chat.png's sha256 against waves 1-6, its changed-pixel count and component map
against wave 6, and **where in the surface the change sits**. If it did NOT change, that is a
major finding and says the disclosure build did not reach the captured state — say so loudly and
say why you think that is.

Also measure what the row change COSTS the transcript's composition, since that is what the Chat
critic actually grades: the two captured tool cards were 568x108 and 568x109; report their new
heights, how many disclosure rows each holds, and whether anything below them moved. A
bottom-anchored viewport has absorbed content-height changes before in this run and made an
innocent shift look like a spacing regression — check for that before reporting one.

## THE OTHER MEASUREMENTS THAT MATTER THIS WAVE

**(a) THE TITLEBAR'S THREE INTERVALS, AS PAINTED RATHER THAN AS DECLARED.** This is the
measurement the whole build turns on. Report, for the left group, the painted clearance at each of
the three intervals — mark to app name, app name to first pill, pill to pill — and say whether
they now read as one rhythm with one deliberate break, or still as one tight interval among two
loose ones. Last wave they painted roughly 3 / 15 / 8.4 against declared 4 / 13 / 4.

Then check what this change most easily breaks: **the flank symmetry.** The session title is
centred by two flex flanks over their min-content floors, and its ink midpoint has measured
exactly 720.00 against a window centre of 720.00 with 0.00 displacement in every wave of this run.
Report it. Also report the group's painted right edge (x266 last wave, x275 the wave before) and
confirm the mark's own 14px left inset and 22px size are untouched.

**(b) THE FILTER BAND'S HEIGHT IS A PASS/FAIL FENCE, NOT AN OPINION.** The pre-list stack was
compressed two waves ago so the first session row's top edge sits at **y202**, and that was shown
to be the arithmetic floor. The Sidebar builder was forbidden from spending height. **Measure the
first session row's top edge in sidebar.png and report it against y202.** If it moved down, the
build silently reversed a landed build and the leg needs to know before it commits.

Then judge the affordance on its own terms: whatever landed, does the filter control read as
operable **at rest**, and how many horizontal rules now stack in that short vertical span? Three
already did — the rail head's, the background-sessions section's, and the filter band's own
bottom border. Report the count and their y positions.

**(c) THE DATE DIVIDER'S 1.00px TRACKING DEBT — CONFIRM IT IS STILL THERE.** You found it last
wave in window-session-short.png: the divider is beautifully made (two 348px rule segments, 0px
asymmetry, gap midpoint 843.50 against a column centre of 843.50, 40px of clear above and below)
except that its label's ink midpoint sits at 842.50 rather than 843.50, because
\`letter-spacing: 0.12em\` on uppercase text adds a tracking unit after the final glyph that
nothing fills. **Nothing was built for it this wave — it was the losing candidate for the Chat
builder's slot.** Re-measure it as a control and confirm the 1.00px is unchanged, so a future
wave knows the defect is stable rather than drifting.

**(d) THE -5px JOG, AS A PURE CONTROL.** Nothing was built for it either; both sides remain
fenced. Confirm the transcript column and composer pill edges in window-session-short.png are
unchanged from wave 6 (transcript x464..1223, composer x459..1218) — and note that the tool-card
build could in principle move the transcript's content without moving its column, so say which of
the two you are seeing.

## FINDINGS CARRIED FORWARD — re-measure these, do not re-derive them

- **The mark-depth thread is closed for ONE MECHANISM ONLY, and the distinction is live this
  wave.** You closed the colour-ramp mechanism: the reference's marks sit at a different hue and
  their depth ROTATES HUE by +11.3 to +12.5 degrees, while this app's is a hue-preserving
  multiply and the one-accent floor is counted BY hue. **Last wave's Welcome critic asked for
  something different — a 2px geometric offset underlay, which rotates no hue at all.** It was not
  built this wave for a structural reason (the mark's two instances live in two other builders'
  files). Confirm the marks are byte-identical to wave 6 as a control and move on.
- **The row corner is SETTLED at 8px** on run-length spread across three heights (17.9 points at
  16px collapsing to 5.5 at 8px). Do not reopen it. If the docks are byte-identical this wave,
  that is your control that nobody did.
- ⚠️ **MEASURE STRAIGHT-RUN LENGTH, NOT PIXEL SHARE, on anything with a corner or an inset
  shadow.** A share- or count-based check has now reported the OPPOSITE of the truth **three
  times** on the rail's selection stripe — last wave mint FELL 4.6% while the legible straight bar
  ROSE 23%. This matters again this wave if the filter control gained any rounded chrome.
- ⚠️ **Erode the mask, do not inset the bounding box. Do not mask on hue when the question is
  about hue.**
- **Off-centre is read off the INK BOUNDING BOX, never the mass-weighted centroid** — they
  disagree for a left-registered block, and the Welcome hero is left-registered by design. Its
  centring is FIXED at +0.50px, which is the arithmetic floor for a 415px odd block in a 1440px
  pane rather than a residual. Confirm as a control; it is not a defect.

## THE TWO FLOORS YOU CHECK EVERY WAVE

- IDENTITY FLOOR: exactly ONE mint hue, and mint under 10% of every surface. Report hue values,
  site count and worst-case surface share. Note that a disclosure row or a filter control gaining
  a resting ground is exactly the class of change that could move a mint share — say which you
  are seeing, and remember the run-length trap above.
- ONE TYPE SCALE: do all rendered sizes land within half a pixel of 15 * 1.15^k for whole k?
  Last wave: max deviation 0.342px against a 0.35 tolerance, zero off-ladder. The type scale
  holding as NUMBERS is not the same as each rung's stated ROLE holding; a known unresolved
  conflict exists where a UI label sits on the prose rung, and the owner has that one.

## CONSTRAINTS

- Colour, translucency and material are OUT OF SCOPE for any verdict, for the same reason given
  to the critics: the wash is composited by the OS and no capture can see it. You MAY measure and
  report colour as evidence (hue counts, alpha values, pixel shares) — that is how the floors are
  checked. You may not turn it into a design defect.
- The identity mark is solid by design, no glyph.
- You may propose ONE new piece for the run's decomposition, capped at one, and only if the
  decomposition is visibly missing something. Give your reason. Pieces are otherwise fixed on
  purpose: a churning piece list destroys the plateau signal. ToolCard was proposed by an earlier
  pass and PARKED, because adopting it requires rewriting a human-owned scoping rule and a loop
  body must not edit the boundary of its own scope. Note that FOUR consecutive passes answered
  "the missing artifact is a test, not a piece", the leg then BUILT that test and it paid, and
  last wave your answer changed to **a gate** — a check that a changed declaration's own comment
  block no longer cites the retired number. Say whether that is still your answer.
- Do NOT edit any file under src/, tests/, .gauntlet/, or .claude/. You are read-only on the
  repository. You may write scratch files under .gauntlet/scratch/ if you need them.
- Do NOT run npm, any build, or any test. The leg gates centrally.

## YOUR OUTPUT

A verdict of SEAMS VISIBLE or COHERENT, the identity floor as HOLDS or BREAKS with its numbers,
the type scale as HOLDS or BREAKS with its numbers, the chat.png result, the titlebar interval
table and flank symmetry, the filter band's y202 fence as PASS or FAIL, the date divider control,
the jog control, the byte-identity controls and the zero-remainder attribution, and your numbered
findings. Also report NOT-FINDINGS: things a future wave might refile that you have measured and
can rule out. Those have repeatedly been worth as much as the findings.`

const SMOOTHING_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['seams', 'identityFloor', 'typeScale', 'chatResult', 'toolCardCost', 'titlebarIntervals', 'flankSymmetry', 'filterBandFence', 'filterAffordance', 'dateDividerControl', 'jogControl', 'ownershipControl', 'markControl', 'findings', 'notFindings', 'newPieceProposal'],
  properties: {
    seams: { type: 'string', enum: ['SEAMS VISIBLE', 'COHERENT'] },
    identityFloor: { type: 'string', description: 'HOLDS or BREAKS, with the measured numbers' },
    typeScale: { type: 'string', description: 'HOLDS or BREAKS, with the measured numbers' },
    chatResult: { type: 'string', description: 'chat.png sha256 against waves 1-6, changed-pixel count and component map against wave 6, and where in the surface the change sits' },
    toolCardCost: { type: 'string', description: 'New tool card heights against 568x108 and 568x109, disclosure row count per card, and whether anything below them moved' },
    titlebarIntervals: { type: 'string', description: 'Painted clearance at all three left-group intervals against last wave 3 / 15 / 8.4, plus the group right edge against x266' },
    flankSymmetry: { type: 'string', description: 'Session title ink midpoint against window centre 720.00, and the mark left inset and size' },
    filterBandFence: { type: 'string', description: 'PASS or FAIL: first session row top edge against y202' },
    filterAffordance: { type: 'string', description: 'What landed, whether it reads as operable at rest, and the count and y positions of stacked horizontal rules in the band' },
    dateDividerControl: { type: 'string', description: 'The 1.00px tracking debt re-measured as a control, unchanged or not' },
    jogControl: { type: 'string', description: 'Transcript and composer edges in window-session-short.png against wave 6, and whether content moved without the column moving' },
    ownershipControl: { type: 'string', description: 'Byte-identity of the three control files and the three docks, window-welcome confinement to y0..47, and the window-session attribution with its remainder' },
    markControl: { type: 'string', description: 'Marks byte-identical to wave 6 at all sites, as a control only' },
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
