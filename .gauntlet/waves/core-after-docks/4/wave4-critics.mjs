export const meta = {
  name: 'gauntlet-wave4-critics',
  description: 'Gauntlet run 3 wave 4: five blind cross-model critics plus one whole-artifact smoothing pass',
  phases: [{ title: 'Judge', detail: 'five blind critics on a non-Anthropic family, one smoothing pass' }],
}

const CAP = '.gauntlet/waves/core-after-docks/4'
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

const SMOOTHING = `You are the SMOOTHING PASS for gauntlet run 3, wave 4, on the claude-wrapper
Electron app at ${ROOT} (branch gauntlet/core-after-docks).

You are the ONLY agent this wave with a view of the WHOLE artifact. Five per-surface critics are
each judging one surface in isolation and none of them can see across surfaces. Your job is
coherence: does this read as ONE application, or as several surfaces improved separately?

## MEASURE, DO NOT ASSERT

This is the whole value you add. Previous smoothing passes wrote their own PNG decoders and
measured pixels rather than describing impressions, and that is what let this run refute five
critic gaps that were merely plausible. Every claim you make should carry a number you produced.
If you catch yourself writing "feels" or "seems", either measure it or drop it. If you make an
error and catch it, say so and correct it — previous passes did exactly that and it strengthened
their reports.

You may run Bash and read files freely. Node is available. There is no image library dependency
you may add, but Electron's nativeImage is already a dependency and you can decode PNGs yourself.

## THE CAPTURES

Wave 4 (current, just captured): ${CAP}/
Wave 3 (the previous wave, for A/B): .gauntlet/waves/core-after-docks/3/
Wave 2: .gauntlet/waves/core-after-docks/2/
Wave 1 (baseline): .gauntlet/waves/core-after-docks/1/

Eleven files each: welcome.png, welcome-min-window.png, titlebar.png, sidebar.png, chat.png,
input-bar.png, window-welcome.png, window-session.png, agents-dock.png, appearance-dock.png,
commands-dock.png.

## WHAT THIS WAVE CHANGED — EXACTLY ONE BUILD LANDED, and two were built and REVERTED

**The one landed change:** ONE shared depth cue was composited over the mint fill at ALL THREE
sites the identity mark paints — the 22px titlebar mark, the 44px welcome mark and the 28px
assistant avatar — through a single new custom property. Nothing else about the marks moved: not
size, not corner, not hue, not position.

**Two other builds were completed and then REVERTED, and knowing that hands you an unusually
clean control set.** This run does not commit a red wave and does not edit a fence to pass.

- The Sidebar build relocated the rail's live "Background sessions" section from between the head
  and the filter down to the rail's foot. It reddened a named unit test pinning that section ABOVE
  the stored-transcript groups. Both files were restored.
- The InputBar build put a symmetric scrollbar-gutter reserve on the transcript's scroll pane to
  close a 5px seam. It reddened two rendered drivers — one pinning that pane's gutter to a single
  scrollbar width, one pinning a 760px column inside a narrower reused instance of the same pane.
  The declaration was removed.

**So this is a SINGLE-CHANGE WAVE, and the strongest thing you can do with it is attribution.**
Every changed pixel anywhere in the eleven captures should belong to one of exactly three mark
interiors. Concretely, and each of these is a control worth reporting:

- \`sidebar.png\` and \`input-bar.png\` should be **BYTE-IDENTICAL to wave 3**.
- The three dock captures should be **BYTE-IDENTICAL to wave 3**, as in every prior wave.
- \`chat.png\` should differ from wave 3 **only inside the 28px assistant avatar**.
- \`welcome.png\` and \`welcome-min-window.png\` should differ **only inside the 44px mark**.
- \`titlebar.png\` should differ **only inside the 22px mark**.

A difference anywhere else is a finding. An incomplete revert is a finding.

Welcome, Sidebar, Chat and InputBar all end this wave with NO landed builder change. Welcome's
only surviving gap is an unresolved owner call about vertical placement; Chat's returned gap was
refuted on mechanism before the wave ran.

## THE MEASUREMENTS THAT MATTER MOST THIS WAVE

**(a) THE 5px SEAM — now a CONTROL, not a fix to verify.** Last wave you measured the app's
most-repeated measure jogging at the composer seam: the transcript column at x459..1218 (w=760)
and the composer pill at x464..1223 (w=760), one directly above the other, each correctly centred
in its own pane (1182px scrollbar-narrowed versus 1192px). **Its fix was reverted, so the jog
should still be exactly 5px.** Confirm it is unchanged — that is the control. Do NOT report it as
a new finding; it is a known open gap whose only attempted fix is refuted, and re-raising it as
new would lose that information. Also re-measure all six centring places, which should likewise
be unchanged.

INSTRUMENT WARNING, carried forward and still binding: "off-centre" must be read off the INK
BOUNDING BOX, not the mass-weighted ink centroid. The two agree for a block whose items are each
centred and DISAGREE for a left-registered one, because left registration necessarily drags the
mass left of the bbox centre. The Welcome hero is left-registered by design; last wave its
centroid read -91.59px while its bbox displacement was +0.50px, and the centroid moved +32.86px
against a block translation of +33px, proving the residual is a property of the composition. A
future pass measuring the centroid would "discover" a 91px defect that does not exist. Note also
that a LEFT-MINUS-RIGHT MARGIN ASYMMETRY is twice the corresponding centre displacement; never
compare an asymmetry against a displacement.

**(b) THE MARK DEPTH AT ALL THREE SITES — THE HEADLINE MEASUREMENT OF THIS WAVE, and also its
only TEST PIN.** This is the wave's one landed change, so it is where your effort belongs.
Wave 1 measured interior mint standard deviation at the three mark sites as **0.00 / 0.05 / 0.09**
— mathematically flat — against the identity reference's **9.02 / 7.01 / 3.65** and
**9.40 / 7.33 / 3.83** at its equivalent marks. The builder predicts a stddev of **6.41** at every
site, from a linear ramp whose range is \`alpha x 255 x L\` = \`0.1 x 255 x 0.87\` = 22.19, and
\`stddev = range / sqrt(12)\` = 6.41. A ramp's stddev does not depend on the box it fills, so one
value should serve all three sizes.

Measure the interior stddev at all three marks and say whether it landed in the reference's band.
**Why this matters beyond the number:** jsdom loads no CSS, so if the new layered background
failed to parse, the depth would silently do NOTHING and every text-based test pin in the repo
would still pass. There is no driver that measures a mark's interior. **Your measurement is the
only pin this change has.** If you measure 0.00 again, say so loudly — that is a silent no-op, not
a subtle miss.

**(c) THE HUE GUARD, and a PREDICTED consequence you should not misread as a floor break.** The
depth is a pure-black ramp, which scales the mint's RGB toward zero and therefore preserves the
hue angle exactly. Confirm there is still exactly ONE mint hue. Then note: darkening lowers
ABSOLUTE chroma toward each mark's lower edge, so a threshold-based mint count may report FEWER
mint pixels and a LOWER worst-case surface share than last wave. That is the predicted arithmetic
of a deliberate change, not the identity floor weakening. State which you are seeing. Last wave:
one hue (~170deg), eight sites, 15,476px, worst-case surface \`welcome-min-window\` at 4.134%.

**(d) THE TWO REVERT CONTROLS.** Both \`sidebar.png\` and \`input-bar.png\` should be **byte-identical
to wave 3**, and the rail's first session row top edge should still measure **y225** (26.4% of the
852px rail). Confirm all three. If any moved, a revert leaked and that is a finding.

While you are there, one measurement the reverted build produced that survives it, and it is
about the SHIPPED rail rather than the discarded change: \`.session-scope\`'s authored comment
justifies carrying no hairline of its own on the grounds that "the head and the filter band
already stack two in the first 78px" — which is \`44 + 34\`, the head's height plus the filter
input's, i.e. an arithmetic that only holds if nothing sits between them. The "Background
sessions" section does sit between them. **Measure where the rail's first two hairlines actually
fall** and report whether that comment is true of the shipped rail. Numbers only; the conclusion
is the leg's.

## CONTROLS YOU SHOULD RUN — one of them is unusually load-bearing this wave

- **The three dock surfaces (agents-dock.png, appearance-dock.png, commands-dock.png) had no
  builder and nothing they render was touched. They should be BYTE-IDENTICAL to wave 3, and to
  waves 2 and 1.** Verify by hash. This control matters more this wave than in any previous one,
  because **two builders shared one stylesheet** — one edited two mark rules in it, the other
  edited the transcript pane rule in the same file — while a third edited both the rail stylesheet
  and the rail component. Two of those three were then reverted, so this control is now doing
  double duty: it proves the sharing held AND that the reverts were complete. A difference here is
  a finding in itself.
- **welcome.png SHOULD change, but ONLY at the 44px mark.** The welcome pane renders OUTSIDE the
  transcript's scroll container, so the scrollbar-gutter change must not touch it. If the welcome
  diff is confined to the mark's 44x44 box, that is a strong independent ownership proof. If it
  is not, attribute the rest.
- **Attribute every changed pixel** in window-session.png and window-welcome.png to exactly one
  named builder target. Last wave the diffs summed with ZERO remainder (window-session 1,564 =
  1,258 + 306; window-welcome 22,242 = 20,984 + 1,258). Reproduce that discipline if you can.

## FINDINGS CARRIED FORWARD — re-measure these, do not re-derive them

- **Your finding 4 last wave:** the sidebar selection stripe is an inset shadow clipped to the
  row's rounded rect, so its straight run is \`height - 2r\`, and it fell from **66px to 54px** at
  column x7 (62px to 48px at x6) — **89% to 73%** of the 74px row — when the row's corner grew.
  The trap you identified: total sidebar mint pixels ROSE 165 to 173 because the taper adds
  antialiased pixels, so a share-based check reports the opposite of what happened. **Only run
  length shows it.** With the rail reverted this should be UNCHANGED from wave 3, so re-measuring
  it is a CONTROL rather than a new reading — say so if it moved.
- **The radius-ratio table was RETIRED as a model last wave** and that conclusion stands: the
  tracking is inverse, it survives only on four hand-picked members, and two boxes of identical
  height wear different corners. Report radii if useful, but do not resurrect the table as a rule.
- **The row vocabulary is still split** — session row r16 against the dock rows' r8, where they
  were identical at 8px, while the spec calls the Agents dock the rail's mirror with the "same row
  shell". This is **DEFERRED to wave 5 on purpose**, specifically to protect this wave's dock
  byte-identity control above. It is a known open item, not a new finding.

## ONE NEUTRAL MEASUREMENT REQUEST — report what you measure, not a judgment

Measure the transcript's **scroll state** in chat.png: how much content sits above the top of the
viewport, and which elements are therefore absent from the capture. Then state plainly what a
critic judging chat.png alone can and cannot see about the transcript. This is a question about
the INSTRUMENT, not an accusation about the product — report the numbers either way, including if
you find nothing is hidden.

## THE TWO FLOORS YOU CHECK EVERY WAVE

- IDENTITY FLOOR: exactly ONE mint hue, and mint under 10% of every surface. Report hue values,
  site count and worst-case surface share. See (c) for what to expect this wave.
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
  and a loop body must not edit the boundary of its own scope. Note also that the last TWO passes
  each concluded "the missing artifact is a test, not a piece" — if that is your best answer
  again, say so, and say whether the test you would write is the same one.
- Do NOT edit any file under src/, tests/, .gauntlet/, or .claude/. You are read-only on the
  repository. You may write scratch files under .gauntlet/scratch/ if you need them.
- Do NOT run npm, any build, or any test. The leg gates centrally.

## YOUR OUTPUT

A verdict of SEAMS VISIBLE or COHERENT, the identity floor as HOLDS or BREAKS with its numbers,
the type scale as HOLDS or BREAKS with its numbers, the six centring measurements, the seam
result from (a), the three mark stddevs from (b), the rail revert control from (d), the
byte-identity control result, the scroll-state measurement, and your numbered findings. Also report
NOT-FINDINGS: things a future wave might refile that you have measured and can rule out. Those
have repeatedly been worth as much as the findings.`

const SMOOTHING_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['seams', 'identityFloor', 'typeScale', 'centring', 'seamResult', 'markDepth', 'railControl', 'ownershipControl', 'scrollState', 'findings', 'notFindings', 'newPieceProposal'],
  properties: {
    seams: { type: 'string', enum: ['SEAMS VISIBLE', 'COHERENT'] },
    identityFloor: { type: 'string', description: 'HOLDS or BREAKS, with the measured numbers' },
    typeScale: { type: 'string', description: 'HOLDS or BREAKS, with the measured numbers' },
    centring: { type: 'string', description: 'All six blocks re-measured, wave 3 vs wave 4, off the ink bounding box' },
    seamResult: { type: 'string', description: 'The composer seam: transcript column and composer pill edges, with numbers. Closed or not.' },
    markDepth: { type: 'string', description: 'Interior stddev at all three mark sites, against the predicted 6.41 and the reference band. Say if it is a silent no-op.' },
    railControl: { type: 'string', description: 'sidebar.png byte-identity vs wave 3, first session row top edge, and where the rail first two hairlines fall' },
    ownershipControl: { type: 'string', description: 'Byte-identity for the three docks; welcome diff confinement; pixel attribution with remainder' },
    scrollState: { type: 'string', description: 'Content above the transcript viewport and what is absent from the capture' },
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
