export const meta = {
  name: 'gauntlet-wave10-critics',
  description: 'Gauntlet run 3 wave 10: five blind cross-model critics plus one zero-builder smoothing pass',
  phases: [{ title: 'Judge', detail: 'five blind critics on a non-Anthropic family, one smoothing pass' }],
}

const CAP = '.gauntlet/waves/core-after-docks/10'
const BAR = '.gauntlet/waves/core-after-docks/1/bar-half'
const ROOT = 'D:/.claude/claude projects/playground/4'

const BAR_WIN = `Every surface of the running app survives side by side with Linear — none reads
as the one nobody finished, every empty state is authored copy plus a real action rather than a
placeholder mark, and one type scale holds across all of them — while never drifting off
frost-mono-reference.png: near-black, one mint accent under 10% of surface, no decorative glass
beyond the single named exception.`

// BYTE-IDENTICAL to waves 4-9's CRITIC_SHARED, copied from wave9-critics.mjs.
// Verdicts are only comparable across waves if the instrument does not drift.
//
// THE TWELFTH CAPTURE IS STILL DELIBERATELY NOT GIVEN TO ANY CRITIC. Wave 8 directly
// answered wave 7's Chat gap and its verdict rose on 148,485 changed pixels; swapping
// to the short frame now would break the one critic series with corroborated movement.
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

const SMOOTHING = `You are the SMOOTHING PASS for gauntlet run 3, wave 10, on the claude-wrapper
	Electron app at ${ROOT} (branch gauntlet/core-after-docks).

	You are the ONLY agent this wave with a view of the WHOLE artifact. Five per-surface critics each
	judge one surface in isolation and none can see across surfaces. Your job is coherence: does this
	read as one application, or as several surfaces improved separately?

	## MEASURE, DO NOT ASSERT

	Every claim should carry a number you produced. If you catch yourself writing "feels" or "seems",
	measure it or drop it. You may run Bash and read files freely. Node is available. Do not add an
	image dependency. Reusable instruments live in .gauntlet/scratch/w8smooth/ and
	.gauntlet/scratch/w8lib.mjs. The prior whole-artifact measurements are in
	.gauntlet/waves/core-after-docks/9/critics-report.md.

	## THE CAPTURES

	Wave 10 (current): ${CAP}/
	Wave 9 (previous): .gauntlet/waves/core-after-docks/9/
	Waves 1-8: .gauntlet/waves/core-after-docks/<N>/

	The twelve wave-10 files hashed IDENTICAL to wave 9 before you were launched. This is the SECOND
	consecutive ZERO-BUILDER measurement wave. Do not invent movement. Prove the null control yourself
	rather than trusting this briefing. The twelfth file, window-session-short.png, is yours but is
	withheld from every critic. Compare RGB as well as bytes — RGB is the canonical pixel-diff
	definition for this run; ignore alpha-only differences.

	## WHY ZERO BUILDERS

	Every wave-9 critic gap was already-landed, refused, or owner/product-shaped:

	- Welcome: grow the lockup to ~400-450px restates owner call 3.3 (vertical placement / one-line display).
	- Titlebar: the asked 16px name-to-pill break already paints (9 / 16 / 4); shrinking the pills is owner-shaped.
	- Sidebar: one-line titles undo the landed two-line clamp and 2.9em reservation.
	- Chat: merging two independent SHOW disclosure buttons is a JSX/state change, not CSS.
	- InputBar: moving Effort/Model inside the pill is the tenth distribution rearrangement, refused under 5.8.

	The five critics are still run because their ordinal verdicts define the plateau. Your role is to
	measure whether the artifact stayed stable and whether the existing coherence seams remain real.

	## CONTROLS TO RE-MEASURE

	1. **NULL CONTROL.** Compare every wave-10 capture with wave 9 by bytes and RGB pixels. Expected:
	   12/12 byte-identical and zero changed RGB pixels. A nonzero result outranks every other finding.
	2. **IDENTITY FLOOR.** Worst mint share remained 3.99%; dominant mint hue family remained 95.88%
	   of chromatic mass. Measure rather than copy.
	3. **TYPE SCALE.** Five declared rungs remained on the 15×1.15^k ladder, max deviation 0.342px
	   against a 0.35px tolerance. Measure or verify source and pixels.
	4. **TITLEBAR.** Painted intervals were 9 / 16 / 4px, break ratio 1.78x against a 1.63x threshold,
	   right edge x275, session-title midpoint 720.00, mark 22×22 at x14.
	5. **TOOL CARDS.** Inner heights were 112/113px; clearances 9/6 in both; 34,935px of exact resting
	   fill-or-border ground; tool-row label inset +11px from prose.
	6. **QUIET-CONTROL SEAM.** Rail filter uses raised/light var(--border), +0.0823 OKLCH L, r8,
	   flush-start. Tool rows use recessed var(--well), -0.0142 L plus +0.0625 outline, r4, label +11.
	   Both paint, but they use two grammars.
	7. **PATH SEAM.** Titlebar paints basename(cwd), 70px; rail paints the full path, 213 of 216px
	   under head truncation. The driver preservation logic is sound; the semantic role choice remains
	   owner-shaped.
	8. **DATE DIVIDER.** Label carries 1.00px tracking debt. Ink clearance is 45/45, explained exactly
	   by 40px box clearance plus 5px internal half-leading; not a spec break.
	9. **SCROLLBAR JOG.** Short frame remains -5px on both edges; overflowing frame 0px. It is real
	   and owner-shaped.
	10. **MARK CONTROL.** Every identity mark stayed byte-identical after accounting for reflow.

	## THE ONE LIVE QUESTION

	Does a second consecutive zero-pixel wave reveal any NEW cross-surface seam that is independently
	measurable and not one of the settled/refused axes above? If not, return no new piece. Do not turn
	a stationary artifact into speculative work.

	Report findings and not-findings. A future wave should be unable to refile anything you ruled out.`

const SMOOTHING_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['seams', 'nullControl', 'identityFloor', 'typeScale', 'titlebarControl', 'toolCardControl', 'groundVocabularySeam', 'pathTreatment', 'dateDividerControl', 'jogControl', 'markControl', 'findings', 'notFindings', 'newPieceProposal'],
  properties: {
    seams: { type: 'string', enum: ['SEAMS VISIBLE', 'COHERENT'] },
    nullControl: { type: 'string', description: 'All 12 wave-10 captures against wave 9 by bytes and RGB pixels' },
    identityFloor: { type: 'string', description: 'HOLDS or BREAKS, with measured mint share and hue-family numbers' },
    typeScale: { type: 'string', description: 'HOLDS or BREAKS, with ladder and deviation numbers' },
    titlebarControl: { type: 'string', description: 'Painted left intervals, ratio, group edge, title midpoint and mark geometry' },
    toolCardControl: { type: 'string', description: 'Inner heights, disclosure clearances, exact resting ground footprint and label inset' },
    groundVocabularySeam: { type: 'string', description: 'Compare rail filter and tool disclosures by token, lightness direction, radius and inset' },
    pathTreatment: { type: 'string', description: 'Titlebar basename versus rail full-path treatment, measured' },
    dateDividerControl: { type: 'string', description: 'Tracking debt and 40px box versus 45px ink clearance explanation' },
    jogControl: { type: 'string', description: 'Short-frame and overflowing transcript/composer edges' },
    markControl: { type: 'string', description: 'Marks byte-identical to wave 9 at all sites' },
    findings: { type: 'array', items: { type: 'string' }, description: 'Numbered findings, each carrying a measurement' },
    notFindings: { type: 'array', items: { type: 'string' }, description: 'Measured and ruled out, so a later wave cannot refile them' },
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
