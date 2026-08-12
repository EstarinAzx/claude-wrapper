export const meta = {
  name: 'gauntlet-wave3-critics',
  description: 'Gauntlet run 3 wave 3: five blind cross-model critics plus one whole-artifact smoothing pass',
  phases: [{ title: 'Judge', detail: 'five blind critics on a non-Anthropic family, one smoothing pass' }],
}

const CAP = '.gauntlet/waves/core-after-docks/3'
const BAR = '.gauntlet/waves/core-after-docks/1/bar-half'
const ROOT = 'D:/.claude/claude projects/playground/4'

const BAR_WIN = `Every surface of the running app survives side by side with Linear — none reads
as the one nobody finished, every empty state is authored copy plus a real action rather than a
placeholder mark, and one type scale holds across all of them — while never drifting off
frost-mono-reference.png: near-black, one mint accent under 10% of surface, no decorative glass
beyond the single named exception.`

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

const SMOOTHING = `You are the SMOOTHING PASS for gauntlet run 3, wave 3, on the claude-wrapper
Electron app at ${ROOT} (branch gauntlet/core-after-docks).

You are the ONLY agent this wave with a view of the WHOLE artifact. Five per-surface critics are
each judging one surface in isolation and none of them can see across surfaces. Your job is
coherence: does this read as ONE application, or as several surfaces improved separately?

## MEASURE, DO NOT ASSERT

This is the whole value you add. Previous smoothing passes wrote their own PNG decoders and
measured pixels rather than describing impressions, and that is what let this run refute four
critic gaps that were merely plausible. Every claim you make should carry a number you produced.
If you catch yourself writing "feels" or "seems", either measure it or drop it. If you make an
error and catch it, say so and correct it — a previous pass did exactly that and it strengthened
its report.

You may run Bash and read files freely. Node is available. There is no image library dependency
you may add, but Electron's nativeImage is already a dependency and you can decode PNGs yourself.

## THE CAPTURES

Wave 3 (current, just captured): ${CAP}/
Wave 2 (the previous wave, for A/B): .gauntlet/waves/core-after-docks/2/
Wave 1 (baseline): .gauntlet/waves/core-after-docks/1/

Eleven files each: welcome.png, welcome-min-window.png, titlebar.png, sidebar.png, chat.png,
input-bar.png, window-welcome.png, window-session.png, agents-dock.png, appearance-dock.png,
commands-dock.png.

## WHAT THIS WAVE CHANGED — three builders, three named gaps

1. Welcome: the hero's grid TRACK was resized so the block centres in its pane while keeping the
   four items sharing one left edge.
2. Titlebar: a group break was added after the app name, separating the identity lockup (mark +
   app name) from the two state pills.
3. Sidebar: the session row's corner radius was changed to be proportionate to its 74px height.

Chat and InputBar got NO builder this wave, deliberately — neither had a surviving gap.

## THE INVARIANT THAT MATTERS MOST THIS WAVE

Last wave's headline finding was that "a content block is centred in its pane" is an invariant
the app holds to 0.0px in five places, and that two builders moved centring in OPPOSITE
directions without either being able to see the other. Measured then: composer footer strip
235.5px to 0.0px (fixed), Welcome hero block 1.0px to 65.0px (BROKEN), titlebar session title
0.0, composer pill 0.0, composer footer line 0.0, chat transcript column about 5.0 (a 4px
scrollbar gutter).

RE-MEASURE ALL SIX THIS WAVE. The Welcome builder's whole job was to return that 65.0px to about
0.0px while keeping the block's left edge at about x512. Verify or refute it with numbers. This is
the single most important measurement you will take.

INSTRUMENT WARNING, and it decides whether your answer is right. "Off-centre" has been measured
two different ways in this run: the INK BOUNDING BOX (compare the left and right margins of the
painted extent) and the MASS-WEIGHTED INK CENTROID. Those two agree for a block whose items are
each centred, and they DISAGREE for a block whose items are all registered to a shared left edge —
because left-registration necessarily puts the ink mass left of the bbox centre, since the widest
line sits at the left and the shorter items leave their slack on the right. This hero is now
left-registered by design. So the CENTRING INVARIANT MUST BE READ OFF THE INK BOUNDING BOX; a
centroid that still sits left of the pane centre is a property of left-registration and is NOT
evidence the fix failed. Report both if you like, but state which one you are ruling on and why.
Note also that "65px" as recorded is a LEFT-MINUS-RIGHT MARGIN ASYMMETRY, so the corresponding
centre displacement is half of it. Do not compare an asymmetry against a displacement.

## A PREDICTION TO CONFIRM OR REFUTE

The Sidebar change was expected to have a knock-on effect the per-surface critics cannot see. The
in-frame radius-to-height ratio table before this wave was: composer pill 760x48 at r24 = 0.500,
user bubble 456x72 at r16 = 0.222, tool card 568x108 at r12 = 0.111, session row 74px at r8 =
0.108 (the flattest). If the session row's corner grew, the TOOL CARD should now be the app's
flattest-cornered box. That is a PREDICTED consequence of a deliberate change, not a new
regression — but check it, report the new table, and say whether the ordering now tracks box size
or still does not. Being predicted does not make it acceptable; it makes it attributable.

## CONTROLS YOU SHOULD RUN

- The three dock surfaces (agents-dock.png, appearance-dock.png, commands-dock.png) had NO
  builder. They should be BYTE-IDENTICAL to wave 2. This is the wave's file-ownership control —
  the Sidebar builder was told not to touch a shared selector precisely so this control survives.
  Verify by hash and report it. A difference here is a finding in itself.
- chat.png and input-bar.png had no builder either, but they SHARE a stylesheet with the Welcome
  builder's target and sit in the same window. A change there is possible and worth attributing.

## THE TWO FLOORS YOU CHECK EVERY WAVE

- IDENTITY FLOOR: is there exactly ONE mint hue, and is mint under 10% of every surface? Report
  the hue values, the site count, and the worst-case surface share. Last wave: one hue at eight
  sites, mint DOWN 3.6% to 15233px across the five surfaces, worst case 4.087%.
- ONE TYPE SCALE: do all rendered sizes land within half a pixel of 15 * 1.15^k for whole k?
  Last wave: seven distinct sizes, max deviation 0.342px against a 0.35 tolerance, zero
  off-ladder. Note that the type scale holding as NUMBERS is not the same as each rung's stated
  ROLE holding; a known unresolved conflict exists where a UI label now sits on the prose rung,
  and you may report on the role question but the owner has it.

## CONSTRAINTS

- Colour, translucency and material are OUT OF SCOPE for any verdict, for the same reason given
  to the critics: the wash is composited by the OS and no capture can see it. You MAY measure and
  report colour as evidence (hue counts, alpha values, pixel shares) — that is how the floors are
  checked. You may not turn it into a design defect.
- The identity mark is solid by design, no glyph. Mark DEPTH is fair game.
- You may propose ONE new piece for the run's decomposition, capped at one, and only if the
  decomposition is visibly missing something. Give your reason. Note that pieces are otherwise
  fixed on purpose: a churning piece list destroys the plateau signal. Note also that a previous
  pass proposed ToolCard and it was PARKED because adopting it requires rewriting a human-owned
  scoping rule, and a loop body must not edit the boundary of its own scope. If your best answer
  is "the missing artifact is a test, not a piece", say that instead — a previous pass said
  exactly that and it was the more valuable answer.
- Do NOT edit any file under src/, tests/, .gauntlet/, or .claude/. You are read-only on the
  repository. You may write scratch files under .gauntlet/scratch/ if you need them.
- Do NOT run npm, any build, or any test. The leg gates centrally.

## YOUR OUTPUT

A verdict of SEAMS VISIBLE or COHERENT, the identity floor as HOLDS or BREAKS with its numbers,
the type scale as HOLDS or BREAKS with its numbers, the six centring measurements, the radius
ratio table, the byte-identity control result, and your numbered findings. Also report
NOT-FINDINGS: things a future wave might refile that you have measured and can rule out. Those
have repeatedly been worth as much as the findings.`

const SMOOTHING_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['seams', 'identityFloor', 'typeScale', 'centring', 'radiusTable', 'ownershipControl', 'findings', 'notFindings', 'newPieceProposal'],
  properties: {
    seams: { type: 'string', enum: ['SEAMS VISIBLE', 'COHERENT'] },
    identityFloor: { type: 'string', description: 'HOLDS or BREAKS, with the measured numbers' },
    typeScale: { type: 'string', description: 'HOLDS or BREAKS, with the measured numbers' },
    centring: { type: 'string', description: 'All six blocks re-measured, wave 2 vs wave 3, with numbers' },
    radiusTable: { type: 'string', description: 'The new radius-to-height ratio table and whether ordering tracks size' },
    ownershipControl: { type: 'string', description: 'Byte-identity result for the three dock captures, plus chat/input-bar attribution' },
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
