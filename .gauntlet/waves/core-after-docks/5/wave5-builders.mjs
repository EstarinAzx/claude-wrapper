export const meta = {
  name: 'gauntlet-wave5-builders',
  description: 'Gauntlet run 3 wave 5: three builders on provably disjoint single-file ownership',
  phases: [{ title: 'Build', detail: 'Titlebar (tokens.css), Sidebar (rails.css), InputBar (composer.css)' }],
}

const ROOT = 'D:/.claude/claude projects/playground/4'

// Every builder gets this. Wave 3 learned that a brief which RECITES driver
// facts invites a builder to go verify them; wave 4 learned that inlining the
// source is necessary but NOT sufficient — its Sidebar builder died twice on the
// 180s no-progress limit with its CSS already inlined, because the brief told it
// to "read the real file" (a 1313-line stylesheet). So: inline what it edits,
// name exact line ranges for anything it must open, and ban the instrument.
const SHARED = `
You are a BUILDER on a working, shipping Electron desktop app at ${ROOT}
(branch gauntlet/core-after-docks). The app already works. You are not fixing a bug and you are
not redesigning anything. You are closing ONE named gap that an independent critic found by
comparing the running app against an external design reference.

## THE RULES THAT GET BUILDS REVERTED WHEN BROKEN

1. **You own EXACTLY ONE FILE.** It is named in your brief. Two other builders are editing two
   other files in this same working tree at this same moment. Touching any file but yours
   corrupts their work and yours. If you believe your gap cannot be closed inside your one file,
   STOP and say so in your report — that is a useful result, not a failure.
2. **Close ONE gap. Do not redesign, do not tidy, do not touch other pieces.** The smallest
   correct diff wins. The last three waves landed their changes in ONE declaration each.
3. **DO NOT RUN npm, any build, or any test.** Three builders share one tree; concurrent test
   runs measure nothing. The wave gates centrally after you all return.
4. **DO NOT OPEN** anything under \`.claude/\`, any \`gui-*.mjs\` driver, or \`inspect.mjs\`.
   Every driver fact you need is stated in your brief as GIVEN. Two previous builders died
   spending their entire time budget reading instrument source instead of writing CSS. If a
   driver fact matters to your change, it is already below — treat it as true.
5. **Bounded reads only.** Where your brief tells you to open a file for context it gives you an
   exact offset and limit. Use \`Read\` with those. Do not read a whole stylesheet.
6. **Update any authored comment your change makes false.** These stylesheets carry dense
   authored reasoning and a false comment is worse than no comment. This is expected of you, not
   optional — but only for comments YOUR change falsifies.

## HOW THIS APP'S CSS IS FENCED — stated as given, do not go verify it

- Three tests scan the whole \`styles/\` directory as TEXT. No comment you write may contain a
  closing brace. No scrollbar rule may be component-scoped. \`.bubble\` and \`.message-input\`
  stay ungrouped. \`.bubble {\` must stay the FIRST literal occurrence of that string in
  chat.css. There must remain EXACTLY ONE \`backdrop-filter\` in all of \`styles/\` and it is not
  in your file.
- The \`@import\` order in \`styles.css\` IS the cascade. Add rules inside your file; never reorder.
- One type scale, stated as a ratio: a font size belongs to the system only when it lands within
  half a pixel of \`15 * 1.15^k\` for whole k. That half pixel is not slack. Token names are
  \`--fs-micro\` (11px), \`--fs-ui\` (13px), \`--fs-body\` (15px), \`--fs-display\` (46px).
- jsdom loads no CSS, so an unknown \`var()\` or an unparseable value resolves to NOTHING and
  every text-based test pin in this repo still passes. A silent no-op is the failure mode this
  wave is most exposed to. Prefer a form you are confident the browser parses.

## YOUR REPORT WHEN YOU FINISH

Return plain text, no preamble:
- The exact declaration(s) you added or changed, and in which rule.
- WHY that number or value, derived rather than picked. Previous waves' builders derived their
  values from the artifact itself and were right; the one that guessed was reverted.
- Your PREDICTION of what the change should measure in the rendered pixels, as a number. The leg
  measures the capture afterwards and checks your prediction against it, so a specific wrong
  prediction is far more useful than a vague right one.
- Anything you could not do inside your one file, and any comment you updated.
`

phase('Build')

const TITLEBAR = `${SHARED}

## YOUR PIECE: the IDENTITY MARK's depth. YOUR ONE FILE: \`src/renderer/src/styles/tokens.css\`

The app's identity is a solid mint rounded square with no glyph — that is deliberate and settled,
and you must not add a glyph. It paints at three sites through ONE shared custom property,
\`--mark-depth\`: a 22px titlebar chip, a 44px welcome plate, and a 28px circular assistant
avatar. The critic judging the titlebar has now asked TWICE, on two consecutive waves, for the
mark to read as an intentional brand object rather than a flat UI swatch.

Last wave gave it a depth cue and it landed exactly as authored. This wave is about WHICH cue.

## THE GAP, MEASURED THIS MORNING BY THE LEG AGAINST THE ACTUAL REFERENCE

The current cue is a pure BLACK ramp. Compositing black scales all three channels toward zero in
proportion, so the darkening is proportional by construction. **The design reference this app is
judged against does not do that** — its marks shift CHROMA across the face as they darken.

Interior standard deviation per channel (mint mask eroded 2px), measured off the real captures:

| | R | G | B |
|---|---|---|---|
| app, 22px chip | 3.49 | 4.81 | 4.66 |
| app, 44px plate | 3.98 | 5.68 | 5.30 |
| app, 28px disc | 3.31 | 4.67 | 4.37 |
| reference mark A | 9.40 | 7.06 | 4.02 |
| reference mark B | 10.79 | 8.40 | 4.39 |
| reference mark C | 10.71 | 8.34 | 4.34 |

Read that table as a SHAPE, not as three shortfalls. The app already **matches the reference on
B**. It is roughly 40-75% short on G. It is roughly **3x** short on R. The reference's depth
varies red hard, green moderately and blue barely; the app's varies all three together.

## THE ARITHMETIC THAT RULES OUT THE OBVIOUS FIX — do NOT simply raise the alpha

Raising the black ramp's alpha scales R, G and B by the same factor, so it slides the app's row
along its own proportions and can never reach the reference's shape. Concretely: reaching the
reference's G of ~7.06 needs about a 1.47x scale, which puts **B at ~6.85 against the reference's
4.02 — a 70% overshoot** — while leaving **R at ~5.1 against 9.40**, still about half. There is no
alpha of a pure black ramp that lands on the reference's shape. A previous wave's brief already
burned a target on unit-confused arithmetic here, so this one is stated in measured pixel
standard deviations only, with no theoretical target for you to hit.

**So the direction is: the ramp should move CHROMA as it darkens, not lightness alone.**

## THE ONE HARD GUARD, AND IT IS MEASURED EVERY WAVE

**EXACTLY ONE MINT HUE.** The app's accent floor is checked by counting mint pixels at a single
hue angle (~180 degrees). A ramp whose dark end sits on a DIFFERENT hue splits the accent into
two and breaks the identity floor — that is an automatic revert. Moving CHROMA at a fixed hue is
explicitly allowed; moving hue is not. The current value is black specifically because black
preserves the hue angle exactly, so whatever you replace it with has to earn that property back
rather than assume it.

Also: only ONE box-shadow anywhere in this app may carry a nonzero HORIZONTAL offset, and it is
already spent on the sessions rail's selection stripe. A purely vertical offset is free.

## THE TRAP THAT WOULD LOOK LIKE PROGRESS AND IS NOT

A previous whole-artifact pass reported that this one alpha "paints three different finishes",
because measured stddev came out 5.00 / 5.77 / 4.90 at the three sizes. **The leg refuted that
this morning by two independent measurements** — correcting for the fact that a fixed 2px erosion
samples different fractions of a 22px, 44px and 28px box, the implied ramp range is 22.8 / 23.4 /
23.2, and a least-squares fit of the interior ramp slope gives -21.80 / -22.77 / -22.34, agreeing
to 4.3%. **The three sites already paint ONE finish.** So:

**DO NOT give the three sites separate values.** \`--mark-depth\` stays ONE declaration with three
callers. Splitting it into per-site literals would destroy a property that currently holds and
would replace one system with three bare values.

## WHAT IS PINNED, AND WHAT IS NOT — stated as given

\`--mark-depth\` is pinned by **NOTHING**. Zero tests reference it; zero rendered drivers measure
a mark's interior. The leg verified that directly. \`theme.test.ts\` validates palette keys against
a reference theme for lightness and alpha, and \`--mark-depth\` is deliberately NOT a palette key —
it names a layer. **This means nothing will catch a value that fails to parse.** If your value is
invalid the mark silently paints flat mint and the whole gate stays green. Choose a form you are
confident Chromium parses, and say in your report what you relied on.

## THE SOURCE YOU ARE EDITING, INLINED IN FULL — tokens.css lines 111 to 131

\`\`\`css
  /* The identity mark's ONE depth cue, composited over var(--mint) at all three
     sites the mark paints: .logo-mark 22px, .welcome-mark 44px, .avatar 28px.
     Three callers, so it is a system by the note above rather than indirection,
     and it is one edit for all three — treating a single site would ship the
     identity at two finishes.

     BLACK, and deliberately not a second mint. Compositing black scales the
     mint's RGB toward zero, so the hue angle stays at ~180deg exactly; a
     --mint-press stop would introduce hue 182, and the app's mint floor is
     counted by hue.

     Arithmetic. A linear ramp's interior standard deviation is range / sqrt 12,
     and range ~= alpha x 255 x L with L the mint's own lightness, 0.87. At
     alpha 0.1 that is range 22.19 and stddev 6.41. The identity reference this
     is judged against measures 9.02 / 7.01 / 3.65 and 9.40 / 7.33 / 3.83 at its
     equivalent marks, so 6.41 is aimed at the MIDDLE of that band on purpose: a
     ramp's stddev does not depend on the box it fills, so one alpha has to serve
     a 22px chip and a 44px plate at once, and the middle is the value that reads
     as lit at both instead of heavy at the small one. All three sites read
     0.00-0.09 before this. */
  --mark-depth: linear-gradient(rgb(0 0 0 / 0), rgb(0 0 0 / 0.1));
\`\`\`

**That comment's middle paragraph is now KNOWN-WRONG and you are expected to fix it**: it
computes the range as \`alpha x 255 x L\` using the mint's OKLCH LIGHTNESS as though it were an
sRGB channel scale. It is not. The true per-channel ranges at alpha 0.1 are about R 16.1 / G 22.8
/ B 21.4, so the 6.41 figure it predicts is unreachable on R at any box size. The leg's measured
implied range this morning was 22.8-23.4 on G, which agrees with the corrected figure and not
with the comment. Rewrite that paragraph to say what is true of whatever you ship.

The mint itself, for your arithmetic: it is \`oklch(0.87 0.07 180)\`, and the mark's top row
measures RGB(160, 226, 212) in the real capture with its bottom row at RGB(144, 204, 192).

The three call sites are one line each and you are NOT editing them; they are here only so you
know what your token feeds:
- \`titlebar.css\` \`.logo-mark\`   — 22px square, \`border-radius: var(--r-mark)\`, \`background: var(--mark-depth), var(--mint);\`
- \`chat.css\`     \`.welcome-mark\` — 44px square, \`border-radius: calc(var(--r-mark) * 2)\`, same background line
- \`chat.css\`     \`.avatar\`       — 28px, \`border-radius: 50%\`, same background line

If you need more of tokens.css for context, read it with \`Read\` at offset 85 limit 64 — that is
the whole \`:root\` alias block and it is all you need. Do not read the file's first 85 lines.

Now make the change.`

const SIDEBAR = `${SHARED}

## YOUR PIECE: the SESSIONS RAIL's pre-list stack. YOUR ONE FILE: \`src/renderer/src/styles/rails.css\`

The sessions rail is the 248px column down the left of the window. It lists past sessions. Above
that list sits a stack of status and controls, and **the first session row does not begin until
y225 — 26.4% of the rail's 852px height spent before any content.** Two critics on two
consecutive waves have named this, the second asking for the first session to begin near **170px**.

## YOUR GAP: COMPRESS THAT STACK IN PLACE, TO ABOUT 175px. NOT BY MOVING ANYTHING.

Last wave a builder tried to close this by RELOCATING the live "Background sessions" section down
to the rail's foot. **It was reverted**, and the revert produced the arithmetic you get to start
from rather than rediscover:

- **Relocation is fenced by a named unit test** that pins the background-sessions section ABOVE
  the stored-transcript groups in the DOM. Do not move it.
- **Folding that section onto the rail's head row is refuted on width.** The head row has
  \`248 - 16 - 8 = 224px\` of content width. The title is ~105px, the Refresh control's shell
  ~58px, two 8px gaps 16px — **179px before any status text at all**, against about 92px needed
  for the phrase "None running here". It does not fit. Do not try it.
- ⚠️ **A CSS \`order: 1\` dodge exists, it WOULD pass that test, and it is REFUSED.** It leaves DOM
  order untouched while moving the section visually, which puts a tab stop at second position
  while the eye finds the control at the foot — a focus order that lies. It also lands the
  section below \`.sidebar-foot\`, which is \`order: 0\` and is not your selector. **Do not use it.**
  Passing the letter of a test while defeating what it protects is worse than not closing the gap.

**Pure in-place tightening reaches about 175px, and that is your job.** Last wave's own budget,
measured: background-sessions trimmed without folding ~37px + the filter band ~7px + the scope
chips ~4px + the group heading ~2px = about **50px off the measured 225**.

## HARD CONSTRAINTS

- **\`.sidebar-head\`'s 44px height is spec-pinned** — the design system says the Agents dock
  mirrors this rail with the "same 44px head". Do not change it.
- **Do not touch \`shared.css\`.** A rendered driver is already red on a rule in it and a second
  cause there would be unattributable.
- **Do not remove or rename any class**, and do not touch the JSX. Two drivers are already red
  from an environment-dependent session store; a missing class would be unattributable.
- **Keep the empty state's copy AND its \`Refresh\` control.** The reference standard this app is
  judged against requires every empty state to be authored copy plus a real action. Compressing
  the band must not turn it into a placeholder.
- Do not undo the two-line session-title clamp. It was measured as an improvement.

## SECOND, SMALLER JOB IN THE SAME FILE: A COMMENT THAT IS NOW FALSE

\`.session-scope\` carries an authored comment justifying why it draws no hairline of its own:

> "Deliberately carries NO hairline of its own: the head and the filter band already stack two in
> the first 78px, and a third would be chrome competing with the rows."

That arithmetic is \`44 + 34\` — the head's height plus the filter input's — and **it only holds if
nothing sits between them.** The "Background sessions" section DOES sit between them: in the
component it is rendered directly after the head and directly before the filter, and it carries
its own \`border-bottom\`. So the rail actually stacks **three** hairlines before the scope chips,
and the filter band is nowhere near the first 78px. **Repair that comment so it states what is
true of the rail you leave behind.** Keep the design decision it defends — the reasoning is
sound, the arithmetic is stale.

## THE SOURCE, INLINED. These are the rules in play, with their real line numbers.

\`\`\`css
/* lines 71-80 — DO NOT CHANGE THE 44px */
.sidebar-head,
.agents-dock-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  flex-shrink: 0;
  padding: 0 8px 0 16px;
  border-bottom: 1px solid var(--border);
}

/* lines 294-301 */
.bg-sessions {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  max-height: 40%;
  border-bottom: 1px solid var(--border);
  padding-bottom: 6px;
}

/* lines 306-313 */
.bg-sessions-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  gap: 8px;
  padding: 6px 8px 2px 16px;
}

/* lines 318-323 */
.bg-sessions-title {
  margin: 0;
  font-size: var(--fs-micro);
  font-weight: 400;
  color: var(--text-faint);
}

/* lines 342-346 — the section's one control */
.sidebar-empty-retry.bg-sessions-refresh {
  flex-shrink: 0;
  padding: 2px 8px;
  font-size: var(--fs-micro);
}

/* lines 365-372 — the scoped-and-empty state: two lines of prose */
.bg-sessions-empty {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 2px 16px 4px;
  font-size: var(--fs-micro);
  color: var(--text-faint);
}

/* lines 384-386 */
.bg-sessions-empty-hint {
  line-height: 1.45;
}

/* lines 390-398 */
.bg-session-list {
  list-style: none;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 6px;
}

/* lines 405-410 */
.bg-session-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 3px 10px;
}

/* lines 433-438 */
.sidebar-filter {
  flex-shrink: 0;
  padding: 0 8px 0 16px;
  border-bottom: 1px solid var(--border);
  transition: border-color 150ms var(--ease);
}

/* lines 444-447 (truncated: the rule continues with font and colour) */
.sidebar-filter-input {
  width: 100%;
  height: 34px;
  border: none;

/* lines 479-484 — the rule whose COMMENT (lines 466-478) you must repair */
.session-scope {
  flex-shrink: 0;
  display: flex;
  gap: 4px;
  padding: 8px 8px 2px;
}

/* lines 488-498 */
.session-scope-btn {
  padding: 3px 8px;
  border: none;
  border-radius: 6px;
  background: transparent;
  font: inherit;
  font-size: var(--fs-micro);
  color: var(--text-faint);
  cursor: pointer;
  transition: background 150ms var(--ease), color 150ms var(--ease);
}

/* lines 514-522 — the scrolling list itself */
.session-groups {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 6px;
}

/* lines 530-539 */
.session-group-head {
  margin: 0;
  padding: 4px 10px;
  font-size: var(--fs-micro);
  font-weight: 400;
  color: var(--text-faint);
  direction: rtl;
  unicode-bidi: plaintext;
  text-align: left;
}
\`\`\`

The rail's shared LEFT EDGE is 16px and several comments in this file depend on it: the head's
\`padding-left: 16px\`, the filter's 16px, the scope chips' \`8px + the chip's own 8px\`, and the
list's \`6px gutter + the row's 10px inset\`. **Vertical compression must not disturb that
horizontal 16px edge** — it is the one alignment the whole rail is built on.

To read the authored comment you are repairing, use \`Read\` at **offset 466 limit 20**. To see any
rule above in its surrounding context, use \`Read\` with the line numbers given. **Do not read the
whole file — it is 1313 lines and a previous builder died twice doing exactly that.**

Now make the change.`

const INPUTBAR = `${SHARED}

## YOUR PIECE: the COMPOSER. YOUR ONE FILE: \`src/renderer/src/styles/composer.css\`

The composer is the input pill at the bottom of the chat column, with a utility row and a
disclaimer under it. Directly above it sits the chat transcript.

## YOUR GAP: A 5px SEAM IN THE APP'S MOST-REPEATED MEASURE

The app repeats one measure — **760px** — in four places: the transcript column, the composer
pill, the footer strip and the footer line. Measured in a single frame:

- transcript column: **x459..1218**, width 760
- composer pill:     **x464..1223**, width 760

They are stacked directly one above the other and their left edges are **5px apart**, as are
their right edges. **Each is correctly centred in its own pane, and that is the whole problem.**
The transcript's scroll pane reserves **10px** for its scrollbar, so the transcript centres inside
an effective **1182px**; the composer's container has no such reserve and centres inside the full
**1192px**. Two locally-correct centrings producing a globally visible misalignment of the one
number this app repeats most.

This seam has been standing since the run's first wave. It is invisible to any single-surface
critic, because the transcript capture and the composer capture are separate clips and neither
contains the other's edge.

## THE FIX IS THE COMPOSER SIDE. THAT IS NOW THE ONLY UNREFUTED FORM.

Last wave a builder attempted the transcript side — a symmetric scrollbar gutter on the scroll
pane — and it was **reverted on two rendered drivers**. What that bought you, stated as given:

- ⚠️ **DO NOT TOUCH \`.chat\`, and it is not your file anyway.** One driver pins that pane's gutter
  at 12.5 device pixels and its own source comment reads *"Never widen these"*. A second pins a
  760px column inside \`.subagent-drawer\` — because **\`.chat\` is REUSED inside a subagent drawer
  at a second, narrower width (820px) where the 760px measure is already at its limit**. Any
  change that spends horizontal room in \`.chat\` breaks a pinned measure on a surface no critic
  even captures. The transcript side is dead.

So: **mirror the transcript's 10px reserve on the composer's own container**, inside
\`composer.css\`, so both 760px boxes centre in the same effective box and the seam closes to 0.

## THE TRAP — REFUSE IT IF YOU FEEL THE PULL

**Five different critics across two runs have asked for the Effort and Model controls to be
REDISTRIBUTED** — centred, right-clustered, evenly spaced, capped at 300px. Every one of those is
refused and the axis is formally exhausted. It is refused against the app's own design system too,
which authorises "Chat column: max-width 760px, centered", so re-clustering to a narrower group
would HIDE the app's authored measure. **Do not touch the distribution of the controls.** Also:
\`.message-input\` stays ungrouped (a text-scanning test depends on it), and the disclaimer is
already correctly centred on its own line — that was a spec break in a previous run and it is
fixed. Your change is about the container's horizontal centring axis and nothing else.

## THE SOURCE YOU ARE EDITING, INLINED — composer.css lines 30 to 61

\`\`\`css
.input-bar {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 12px 24px 16px;
}

.input-pill {
  position: relative; /* anchors the #40 command popover above the input */
  display: flex;
  /* Bottom-aligned rather than centred (#42): once the composer grows, the
     paperclip and send button belong on the last line, not floating mid-pill. */
  align-items: flex-end;
  gap: 8px;
  width: 100%;
  max-width: 760px;
  background: var(--surface);
  border: 1px solid var(--border);
  /* NOT --r-pill. A 999px radius is clamped by the browser to half the box's
     shorter side, so at the 48px resting height it renders as exactly 24px —
     but once #42's growth takes the pill to its 8-line ceiling the same token
     resolves to a ~96px sweep and the composer reads as a giant lozenge, with
     the paperclip and send button sitting inside the curve. Pinning the resting
     value keeps the one-line composer pixel-identical and lets the grown one
     settle into a rounded rectangle, which is what a multi-line field should be.
     Tied to the resting height: 36px send button + the 6px padding pair. */
  border-radius: 24px;
  padding: 6px 8px 6px 14px;
  transition: border-color 150ms var(--ease);
}
\`\`\`

\`.input-bar\` is the composer's container: a centred column holding the pill, the controls strip
and the footer line. Its content box today is \`1192 - 24 - 24 = 1144px\` wide, and \`.input-pill\`
caps at 760 inside it, so the pill has plenty of slack — your change must not reduce the content
box below 760 or the pill starts shrinking.

**Everything in this container centres together**, which is what makes a container-level fix the
right shape: the strip and the footer line share the pill's axis and were deliberately made to do
so in an earlier wave (their off-centre distances are all 0.00px against the pill). Whatever you
do to the axis must move all of them by the same amount, so **do not fix this by nudging the pill
alone** — that would re-break a centring that was expensive to establish.

The controls strip and footer line rules live at \`composer.css\` lines 266-289 and 359-378 if you
need to confirm they inherit the container's centring; read them with \`Read\` at **offset 260
limit 30** and **offset 355 limit 25**. Do not read the whole file.

State in your report the exact predicted pixel positions of the composer pill's left and right
edges after your change, against the transcript's x459..1218. The leg measures the capture and
checks you.

Now make the change.`

const tasks = [
  () => agent(TITLEBAR, { label: 'build:Titlebar', phase: 'Build' }),
  () => agent(SIDEBAR, { label: 'build:Sidebar', phase: 'Build' }),
  () => agent(INPUTBAR, { label: 'build:InputBar', phase: 'Build' }),
]

const out = await parallel(tasks)
return { titlebar: out[0], sidebar: out[1], inputbar: out[2] }
