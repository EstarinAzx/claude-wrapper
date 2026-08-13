export const meta = {
  name: 'gauntlet-wave12-critics',
  description: 'Gauntlet run 3 wave 12 (FINAL): five blind critics on a DEGRADED same-vendor family plus one smoothing pass over a one-build wave',
  phases: [{ title: 'Judge', detail: 'five blind critics, critic_degraded: true, one smoothing pass' }],
}

// ⚠️ CRITIC_DEGRADED: TRUE. THE CROSS-MODEL CRITIC IS GONE, AND NOT BECAUSE THE ROUTES DRIFTED.
//
// 11.11 predicted wave 12 might find every family pointing at Anthropic and read that as
// drift. It is not drift. The OWNER allocated `sonnet -> anthropic/claude-fable-5`
// DELIBERATELY, because the grok and codex quotas are exhausted. The all-Anthropic reading
// this leg measured at boot is therefore a standing configuration, not a blip, and no amount
// of waiting brings the cross-vendor critic back.
//
// This leg did rebind `sonnet -> xai/grok-4.6` at boot to preserve waves 9-11's Target, and
// reverted it before launching anything the moment the owner said the quota was dead. No agent
// ran on it. Recorded because a reader of the state file would otherwise see a snapshot in the
// history and wonder what it graded: nothing.
//
// The panel below therefore runs on `sonnet -> anthropic/claude-fable-5` under the preset's
// step-2 fallback, with `critic_degraded: true` in the state file, the log line and the closing
// report. Two things worth saying precisely, because "degraded" is doing real work here:
//
//   * It is NOT literal self-grading. The wave's one builder ran on `opus ->
//     anthropic/claude-opus-5`; the critics run on fable-5. Different model, fresh context,
//     never sees the builder's reasoning or diff.
//   * It IS same-vendor, which is exactly what the run's central claim was built to avoid, and
//     it lands on the wave that closes the run. Every wave-12 verdict is weaker evidence than
//     waves 1-11's for that reason, and the closing report says so rather than averaging it in.
//
// The instrument is otherwise held fixed: CRITIC_SHARED and BAR_WIN are byte-identical to
// waves 4-11, the three-image rule holds, and the twelfth capture is still withheld.

const CAP = '.gauntlet/waves/core-after-docks/12'
const BAR = '.gauntlet/waves/core-after-docks/1/bar-half'
const ROOT = 'D:/.claude/claude projects/playground/4'

const BAR_WIN = `Every surface of the running app survives side by side with Linear — none reads
as the one nobody finished, every empty state is authored copy plus a real action rather than a
placeholder mark, and one type scale holds across all of them — while never drifting off
frost-mono-reference.png: near-black, one mint accent under 10% of surface, no decorative glass
beyond the single named exception.`

// BYTE-IDENTICAL to waves 4-11's CRITIC_SHARED, copied from wave11-critics.mjs.
// Verdicts are only comparable across waves if the instrument does not drift.
//
// THE TWELFTH CAPTURE IS STILL DELIBERATELY NOT GIVEN TO ANY CRITIC. Wave 8 directly
// answered wave 7's Chat gap and its verdict rose on 148,485 changed pixels; swapping
// to the short frame now would break the one critic series with corroborated movement.
// On the CLOSING wave that matters more, not less: an input change mixed into the final
// verdicts would contaminate the one comparison the whole run is read from.
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
    what: 'the WELCOME / empty state -- what a user sees before any session exists. It occupies the window below the 48px titlebar.' },
  { name: 'Titlebar', surface: 'titlebar.png',  frame: 'window-session.png', ref: 'linear-features.png',
    what: 'the TITLEBAR -- the 48px chrome strip across the very top of the window, holding identity, state and window controls.' },
  { name: 'Sidebar',  surface: 'sidebar.png',   frame: 'window-session.png', ref: 'linear-home-hero.png',
    what: 'the SESSIONS RAIL -- the narrow 248px column down the left side, listing past sessions.' },
  { name: 'Chat',     surface: 'chat.png',      frame: 'window-session.png', ref: 'linear-changelog.png',
    what: 'the CHAT TRANSCRIPT -- the main reading column holding the conversation, its message bubbles and its tool cards.' },
  { name: 'InputBar', surface: 'input-bar.png', frame: 'window-session.png', ref: 'linear-home-product.png',
    what: 'the COMPOSER -- the input pill at the bottom of the chat column plus its utility row and disclaimer.' },
]

phase('Judge')

const SMOOTHING = `You are the SMOOTHING PASS for gauntlet run 3, wave 12, on the claude-wrapper
  Electron app at ${ROOT} (branch gauntlet/core-after-docks).

  You are the ONLY agent this wave with a view of the WHOLE artifact. Five per-surface critics each
  judge one surface in isolation and none can see across surfaces. Your job is coherence: does this
  read as one application, or as several surfaces improved separately?

  ## MEASURE, DO NOT ASSERT

  Every claim should carry a number you produced. If you catch yourself writing "feels" or "seems",
  measure it or drop it. You may run Bash and read files freely. Node is available. Do not add an
  image dependency. Reusable instruments live in .gauntlet/scratch/w8smooth/ and
  .gauntlet/scratch/w8lib.mjs; a fresh RGB differ is at .gauntlet/scratch/wave12-diff.mjs and takes
  two wave-directory names as arguments. The prior whole-artifact measurements are in
  .gauntlet/waves/core-after-docks/11/critics-report.md.

  ## THE CAPTURES

  Wave 12 (current, POST-BUILD): ${CAP}/
  Wave 12 PRE-BUILD control: .gauntlet/waves/core-after-docks/12-prebuild-control/
  Wave 11 (previous): .gauntlet/waves/core-after-docks/11/
  Waves 1-10: .gauntlet/waves/core-after-docks/<N>/

  The twelfth file, window-session-short.png, is yours but is withheld from every critic. Compare
  RGB as well as bytes -- RGB is the canonical pixel-diff definition for this run; ignore alpha-only
  differences.

  ## THIS WAVE HAS EXACTLY ONE BUILD, AFTER THREE ZERO-BUILDER WAVES

  Waves 9, 10 and 11 were zero-builder null controls and every capture was byte-identical across all
  three. Wave 12 ran ONE build, on the InputBar and nothing else:

    src/renderer/src/styles/composer.css -- \`.effort-range\` width 68px -> 130px, one declaration
    plus a derivation comment. Nothing else in the repository was touched.

  The reasoning: the effort slider carries SIX stops (Default plus five levels, \`min={0}
  max={levels.length}\`), the thumb is 10px, so travel was 68-10 = 58px and spacing was 58/5 = 11.6px
  between neighbouring stops. The build targets 24px spacing, giving travel 120 and width 130.

  ## THE CONTROL THIS WAVE OWES, AND IT IS THE FIRST THING TO DO

  1. **ATTRIBUTION.** Diff the PRE-BUILD control against wave 11 first, then the POST-BUILD capture
     against the PRE-BUILD control. The leg measured: wave 11 -> pre-build is 3 RGB pixels in
     sidebar.png at x16-18 y139-141, each off by exactly 1 on one to three channels, which reverted
     to byte-identical in the post-build capture and is therefore rasterisation nondeterminism rather
     than content. Pre-build -> post-build is 903 RGB pixels in input-bar.png, and the SAME 903 in
     window-session.png and window-session-short.png, with the frame arithmetic closing exactly
     (InputBar surface origin is x248 y768; the short frame sits 117px lower). Everything else zero.
     **Verify all of that yourself rather than trusting this briefing, and say so if it does not
     reproduce.** A nonzero remainder outranks every other finding.

  ## DO NOT SCORE THE PLATEAU. IT IS OUT OF YOUR JURISDICTION.

  Wave 11's smoothing pass closed by asserting "Plateau 2 -> 3". That was wrong -- two verdicts rose
  that wave -- and more importantly it was a guess, because you never receive a critic verdict, by
  design. It had inferred from the null control alone that frozen pixels mean frozen verdicts, and
  wave 11 is the exact case that inference fails on. Do not repeat it. Report measurements; the
  verdicts are not yours to predict.

  ## CONTROLS TO RE-MEASURE

  2. **IDENTITY FLOOR.** Worst mint share was 3.99%; dominant mint hue family 95.88% of chromatic
     mass. Measure rather than copy. Does the wider track move either number?
  3. **TYPE SCALE.** Five declared rungs on the 15x1.15^k ladder, max deviation 0.342px against a
     0.35px tolerance. Measure or verify source and pixels.
  4. **TITLEBAR.** Painted intervals 9 / 16 / 4px, break ratio 1.78x against a 1.63x threshold,
     right edge x275, session-title midpoint 720.00, mark 22x22 at x14.
  5. **TOOL CARDS.** Inner heights 112/113px; clearances 9/6 in both; 34,935px of exact resting
     fill-or-border ground; tool-row label inset +11px from prose.
  6. **QUIET-CONTROL SEAM.** Rail filter uses raised/light var(--border), +0.0823 OKLCH L, r8,
     flush-start. Tool rows use recessed var(--well), -0.0142 L plus +0.0625 outline, r4, label +11.
     Both paint, but they use two grammars.
  7. **PATH SEAM.** Titlebar paints basename(cwd), 70px; rail paints the full path, 213 of 216px
     under head truncation.
  8. **DATE DIVIDER.** Label carries 1.00px tracking debt. Ink clearance 45/45, explained by 40px box
     clearance plus 5px internal half-leading; not a spec break.
  9. **SCROLLBAR JOG.** Short frame -5px on both edges; overflowing frame 0px.
  10. **MARK CONTROL.** Every identity mark byte-identical after accounting for reflow.

  ## THE LIVE QUESTIONS, AND THEY ARE ABOUT THE ONE BUILD

  A. **Did the widen cost anything on its own row?** The composer strip is a space-between measure
     (\`.composer-controls\`, max-width 760px). Measure whether the MODEL side moved at all, whether
     the effort readout's right edge moved, and whether the strip still reads as two anchored ends
     rather than a left-heavy cluster. The builder claimed the model side is unmoved -- check it.
  B. **Is the widened track now internally consistent with the rest of the app's control
     vocabulary?** You already track a quiet-control seam (finding 6). A 130px track next to a 68px
     readout is a new width relationship on that row. Measure the painted boxes and say whether this
     reads as one grammar or adds a third.
  C. Does the one build reveal any NEW cross-surface seam that is independently measurable and is not
     one of the settled or refused axes above?

  ## THIS IS THE FINAL WAVE OF THE RUN

  max_waves is 12. Whatever you rule out here is ruled out for good, and whatever you leave
  unmeasured stays unmeasured. Do not invent a last-second piece to keep anything alive -- there is
  nothing left to keep alive. Prefer closing questions to opening them.

  Report findings and not-findings. A future run should be unable to refile anything you ruled out.`

const SMOOTHING_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['seams', 'attribution', 'identityFloor', 'typeScale', 'titlebarControl', 'toolCardControl', 'groundVocabularySeam', 'pathTreatment', 'dateDividerControl', 'jogControl', 'markControl', 'stripBalance', 'trackGrammar', 'findings', 'notFindings', 'newPieceProposal'],
  properties: {
    seams: { type: 'string', enum: ['SEAMS VISIBLE', 'COHERENT'] },
    attribution: { type: 'string', description: 'Wave 11 -> pre-build -> post-build, by bytes and RGB pixels, with the remainder stated' },
    identityFloor: { type: 'string', description: 'HOLDS or BREAKS, with measured mint share and hue-family numbers' },
    typeScale: { type: 'string', description: 'HOLDS or BREAKS, with ladder and deviation numbers' },
    titlebarControl: { type: 'string', description: 'Painted left intervals, ratio, group edge, title midpoint and mark geometry' },
    toolCardControl: { type: 'string', description: 'Inner heights, disclosure clearances, exact resting ground footprint and label inset' },
    groundVocabularySeam: { type: 'string', description: 'Compare rail filter and tool disclosures by token, lightness direction, radius and inset' },
    pathTreatment: { type: 'string', description: 'Titlebar basename versus rail full-path treatment, measured' },
    dateDividerControl: { type: 'string', description: 'Tracking debt and 40px box versus 45px ink clearance explanation' },
    jogControl: { type: 'string', description: 'Short-frame and overflowing transcript/composer edges' },
    markControl: { type: 'string', description: 'Marks byte-identical to wave 11 at all sites' },
    stripBalance: { type: 'string', description: 'Question A: did the model side or the readout right edge move, and does the strip still read as two anchored ends' },
    trackGrammar: { type: 'string', description: 'Question B: 130px track beside the 68px readout -- one grammar or a third' },
    findings: { type: 'array', items: { type: 'string' }, description: 'Numbered findings, each carrying a measurement' },
    notFindings: { type: 'array', items: { type: 'string' }, description: 'Measured and ruled out, so a later run cannot refile them' },
    newPieceProposal: { type: 'string', description: 'One proposal with reason, or "NONE" with why not' },
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
diff, commit, or project document other than the spec files named below -- your independence is
the entire point of your existence, and a critic that reads the builder's reasoning is worthless.

## THE SPEC -- read as a FENCE for PART D only

Read these two files at the project root: DESIGN.md and PRODUCT.md. DESIGN.md is the design
system and is the source of truth for the renderer. PRODUCT.md carries the purpose, the single
intended user, and the anti-references. Use them ONLY to answer PART D. Do not use them as your
yardstick in PART B -- the reference image is the yardstick.

Now produce PART A, PART B, PART C and PART D.`,
      { label: `critic:${p.name}`, phase: 'Judge', model: 'sonnet', schema: VERDICT }
    )
  ),
  () => agent(SMOOTHING, { label: 'smoothing:whole-artifact', phase: 'Judge', schema: SMOOTHING_SCHEMA }),
]

const out = await parallel(tasks)

return { critics: out.slice(0, 5), smoothing: out[5] }
