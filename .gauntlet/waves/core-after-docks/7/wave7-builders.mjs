export const meta = {
  name: 'gauntlet-wave7-builders',
  description: 'Gauntlet run 3 wave 7: three builders on provably disjoint file ownership',
  phases: [{ title: 'Build', detail: 'Titlebar (titlebar.css), Sidebar (rails.css + Sidebar.tsx), Chat (tool-card.css)' }],
}

const ROOT = 'D:/.claude/claude projects/playground/4'

// BYTE-IDENTICAL to wave 6's SHARED except for the builder count in rule 1.
// Wave 6 proved this shape: after wave 5 lost EIGHTEEN agents between a bounded
// read and an `Edit` call, wave 6 inlined the source, named exact line ranges,
// banned the instrument, and made rule 6 hand the long comments to the leg.
// Both builders landed first time in one declaration each. Do not soften it.
const SHARED = `
You are a BUILDER on a working, shipping Electron desktop app at ${ROOT}
(branch gauntlet/core-after-docks). The app already works. You are not fixing a bug and you are
not redesigning anything. You are closing ONE named gap that an independent critic found by
comparing the running app against an external design reference.

## THE RULES THAT GET BUILDS REVERTED WHEN BROKEN

1. **You own EXACTLY THE FILES NAMED IN YOUR BRIEF, AND NOTHING ELSE.** Two other builders are
   editing other files in this same working tree at this same moment. Touching any file but yours
   corrupts their work and yours. If you believe your gap cannot be closed inside your files,
   STOP and say so in your report — that is a useful result, not a failure. Three of this run's
   most valuable results were exactly that.
2. **Close ONE gap. Do not redesign, do not tidy, do not touch other pieces.** The smallest
   correct diff wins. The last four waves landed their changes in ONE declaration each.
3. **DO NOT RUN npm, any build, or any test.** Three builders share one tree; concurrent test
   runs measure nothing. The wave gates centrally after you all return.
4. **DO NOT OPEN** anything under \`.claude/\`, any \`gui-*.mjs\` driver, or \`inspect.mjs\`.
   Every driver fact you need is stated in your brief as GIVEN. Two previous builders died
   spending their entire time budget reading instrument source instead of writing CSS. If a
   driver fact matters to your change, it is already below — treat it as true.
5. **Bounded reads only.** Where your brief tells you to open a file for context it gives you an
   exact offset and limit. Use \`Read\` with those. Do not read a whole stylesheet.
6. ⚠️ **DO NOT REWRITE THE LONG AUTHORED COMMENTS. THE LEG WRITES THOSE THIS WAVE.** Your file
   carries dense authored reasoning and your change will falsify some of it. That is expected and
   it is NOT your job. Wave 5 lost eighteen agents on briefs that required reproducing a long
   comment verbatim inside the edit — every one of them stalled between its read and its \`Edit\`
   call, and the two that landed were the two whose required output was a short declaration.
   **Emit the declaration. Then, in your report, say in plain prose which comment claims your
   change makes false and what the truth now is.** The leg writes them afterwards; a comment-only
   edit is proven not to change the built bundle, so this costs the wave nothing.

## HOW THIS APP'S CSS IS FENCED — stated as given, do not go verify it

- Three tests scan the whole \`styles/\` directory as TEXT. No comment you write may contain a
  closing brace. No scrollbar rule may be component-scoped. \`.bubble\` and \`.message-input\`
  stay ungrouped. \`.bubble {\` must stay the FIRST literal occurrence of that string in
  chat.css. There must remain EXACTLY ONE \`backdrop-filter\` in all of \`styles/\` and it is not
  in your file — do not add one.
- The \`@import\` order in \`styles.css\` IS the cascade. Add rules inside your file; never reorder.
- One type scale, stated as a ratio: a font size belongs to the system only when it lands within
  half a pixel of \`15 * 1.15^k\` for whole k. That half pixel is not slack. Token names are
  \`--fs-micro\` (11px), \`--fs-ui\` (13px), \`--fs-body\` (15px), \`--fs-display\` (46px).
- ⚠️ **\`src/renderer/src/styles/tokens.css\` IS OFF LIMITS TO ALL THREE BUILDERS THIS WAVE**, and
  the reason is not tidiness: the tokens it defines are shared across surfaces, so a value changed
  there lands on a piece another critic is grading. Whatever you need, declare it in YOUR file.
- jsdom loads no CSS, so an unknown \`var()\` or an unparseable value resolves to NOTHING and
  every text-based test pin in this repo still passes. A silent no-op is the failure mode this
  wave is most exposed to. Prefer a form you are confident the browser parses.

## THE CAPTURE THAT GRADES YOU IS A RESTING SCREENSHOT

There is no cursor in it and nothing is hovered or focused. A \`:hover\` or \`:focus\` rule is
invisible to the critic that judges your work. If your gap is about something reading as
operable, **the affordance has to exist at rest** or you have built something nobody will grade.
You may still add interactive states; just do not let them carry the change.

## YOUR REPORT WHEN YOU FINISH

Return plain text, no preamble:
- The exact declaration(s) you added or changed, and in which rule.
- WHY that number or value, derived rather than picked. Previous waves' builders derived their
  values from the artifact itself and were right; the one that guessed was reverted.
- Your PREDICTION of what the change should measure in the rendered pixels, as a number. The leg
  measures the capture afterwards and checks your prediction against it, so a specific wrong
  prediction is far more useful than a vague right one.
- Which authored comment claims your change falsifies, in plain prose. Do not rewrite them.
- Anything you could not do inside your own files.

## IF THE TARGET IS NOT REACHABLE, REFUTE IT — DO NOT MISS IT QUIETLY

A critic's number is an ask, not a fact. Wave 5's Sidebar builder was asked for ~175px, showed the
component sum put the floor at ~202px, delivered the floor and said so. Wave 6's Titlebar builder
showed its asked-for target did not exist inside its file at all. **Both refutations were worth
more than a hit would have been.** If your arithmetic says the ask is out of reach, show the sum,
land the best DERIVED state, and name what would have to be spent to go further. A specific
refutation beats a guessed hit.
`

phase('Build')

const TITLEBAR = `${SHARED}

## YOUR PIECE: the TITLEBAR's left cluster. YOUR ONE FILE: \`src/renderer/src/styles/titlebar.css\`

Do not touch the identity mark's size, radius or depth. That thread is closed by measurement and
reopening it is how wave 5 lost eighteen agents.

## THE GAP, AS THE CRITIC RETURNED IT

"the 22px mark sits only about 3px from 'Claude Wrapper'… Increase the mark-to-name gap to 8-10px
and separate the status pair from the identity by about 16px."

## THIS ASKS TO PARTLY UNDO LAST WAVE'S BUILD, AND THE BUILD ALREADY CONTAINED THE REFUTATION

Last wave a builder took \`gap\` from 7 to 4 to pull the group leftwards. In doing so it produced
the measurement that makes this wave interesting, and then chose the wrong side of it:

- \`--r-pill\` rounds each pill to a semicircular cap of radius ~10.15px. **A cap recedes from the
  midline**, so the channel between two pills paints about **+4.4px wider than it is declared**.
- The **mark-to-name tick is flat on both sides** — a filled 22px square against a wordmark — so
  it paints what it declares, or a touch less.

So one \`gap: 4px\` currently paints roughly **3px** at the mark-to-name tick and roughly **8.4px**
at the pill-to-pill channel. **The critic measured exactly the 3px this model predicts.** One
\`gap\` cannot serve a flat interval and a capped one, and that is the real finding — not that 4
was wrong.

## ⚠️ THE LEG HAS RE-DECIDED THE TARGET. READ THIS BEFORE YOU BUILD.

Last wave's brief asked the group to end before the sessions rail divider at **x247**. **That
target is withdrawn and you must not chase it.** The smoothing pass flagged why: x247 is a **1px
hairline sitting 48px BELOW the strip your group lives in**, and a box edge landing exactly on it
reads as a collision rather than an alignment. Last wave's build left the group ending at x266,
and closing the remaining overrun was shown to cost the group break itself.

**Your target is the OPTICAL EVENNESS of the group's three intervals, not any absolute x.** The
group's right edge is allowed to move RIGHT if the derivation says so. Say in your report where it
lands; do not optimise for it.

## THE SOURCE YOU ARE EDITING — inlined, do not go read the file for these

\`\`\`css
.titlebar-left {          /* line 61 */
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.logo-mark {              /* line 79 */
  display: block;
  margin-left: 14px;
  width: 22px;
  height: 22px;
  border-radius: var(--r-mark);
  background: var(--mark-depth), var(--mint);
  flex-shrink: 0;
}

.app-name {               /* line 89 */
  font-size: var(--fs-ui);
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
}

.app-name + * {           /* line 174 — THE GROUP BREAK */
  margin-left: 9px;
}

.backend-pill,            /* line 180 — SHARED SHELL, see FENCE 1 */
.perm-pill,
.model-pill {
  flex-shrink: 0;
  padding: 2px 9px;
  border-radius: var(--r-pill);
  border: 1px solid var(--border);
  background: transparent;
  font-family: inherit;
  font-size: var(--fs-micro);
  font-weight: 600;
  letter-spacing: 0.02em;
  line-height: 1.3;
  color: var(--text-muted);
  white-space: nowrap;
  cursor: default;
  -webkit-app-region: no-drag;
}
\`\`\`

The DOM order inside \`.titlebar-left\` is: \`.logo-mark\`, \`.app-name\`, then the first pill, then
the second pill. Both pills are conditional in the JSX, so **the element after \`.app-name\` may be
the backend pill, the permission pill, or nothing** — which is exactly why the break is keyed to
\`.app-name + *\` and not to a named pill. Any selector you write must survive all three cases.

## THE THREE INTERVALS, AS DECLARED AND AS PAINTED — treat as GIVEN

| interval | shape either side | declared now | paints about |
|---|---|---|---|
| mark → name | flat / flat | 4 | **3** |
| name → first pill | flat / capped | 4 + 9 = 13 | ~15 |
| pill → pill | capped / capped | 4 | ~8.4 |

Item widths are fixed costs and are **22 / 96 / 58 / 56**. Content including the mark's 14px inset
is **14 + 22 + 96 + 58 + 56 = 246px**.

## THE BUDGET FENCE, AND IT IS THE ONLY HARD NUMBER YOU HAVE

The titlebar centres its session title by giving both flanks \`flex: 1\` over their min-content
floors. **A floor only binds when it exceeds the flank's equal share.** The binding state is
Welcome at the 640px minimum window: the title paints 81.5css, and the two flanks split the
remaining 558.5 into **279.25 each**.

- This flank's floor = **246 + (sum of your three intervals)**.
- Today that is 246 + (4 + 13 + 4) = 246 + 21 = **267**, which leaves 12.25px of room.
- **Your hard ceiling is a floor of 279.25.** So the sum of your three intervals may not exceed
  **33px**. It is 21 now. **You have 12px to spend, total, across all three intervals.**

Exceeding it freezes this flank at its floor while the other takes its equal share, and the
driver that pins flank equality reds by twice the overshoot against a 1.0 tolerance. Staying under
it is safe in both directions. This is GIVEN — do not go verify it.

Also GIVEN: at 640 with a project open the title slot is \`640 - floor - 233\`, and the driver
requires the 60-character fixture title to still truncate. That fixture paints **451css**, so the
slot cannot approach it at any floor you can legally reach.

## THE OTHER FENCES

**FENCE 1 — \`.model-pill\` IS THE COMPOSER'S CONTROL, NOT YOURS.** It joins the shell rule at line
180 from the bottom of the app. Editing that rule's \`padding\`, \`letter-spacing\` or
\`border-radius\` moves a control another critic is grading this wave. If you need the titlebar
pills to differ, declare a NEW rule scoped to \`.backend-pill, .perm-pill\` only.

**FENCE 2 — THE MARK'S 14px LEFT MARGIN IS THE WINDOW'S LEFT INSET, NOT BUDGET.** The file's own
comment records why it lives on \`.logo-mark\` and why spending it was already rejected once: it
moves the whole group off the window edge to solve a spacing problem two items to its right.
Leave it at 14.

**FENCE 3 — THE TYPE LADDER.** You may not shrink text to buy width. The 96px app name and the
pills' text widths are fixed.

## WHAT YOU ARE ACTUALLY DECIDING

A single \`gap\` cannot give a flat interval and a capped one the same optical value. Decide what
each of the three intervals should PAINT, derive the declared values that produce it, and check
the sum against your 12px budget. Then emit the smallest set of declarations that does it — noting
that a per-interval value costs you a selector, and that \`.app-name + *\` is the only form proven
to key correctly through all three pill-presence cases.

State in your report what each interval paints after your change, and where the group's right edge
lands. Now make your change and write your report.`

const SIDEBAR = `${SHARED}

## YOUR PIECE: the SESSIONS RAIL's filter control.
## YOUR FILES: \`src/renderer/src/styles/rails.css\` AND \`src/renderer/src/components/Sidebar.tsx\`

You own two files because this gap may need markup. Use the second only if you actually need it.
You MAY read \`src/renderer/src/components/Titlebar.tsx\` for the app's icon convention — **you may
NOT edit it.** Another builder is grading against that surface this wave.

## THE GAP, AS THE CRITIC RETURNED IT

"The 'Filter sessions...' control is visually indistinguishable from passive muted copy… Give it a
clear 28-32px input hit area with an inset hairline and search glyph so the rail's primary
narrowing action reads immediately as interactive."

## ONE THIRD OF THAT ASK IS ALREADY TRUE, AS GIVEN — do not build it, and say you did not

**The input is already exactly 28px tall.** That was set deliberately last run: 28px is the rail's
own control housing square, matching \`.sidebar-toggle\`, and DESIGN.md names that square in its
Layout section. A 13px face at 1.6 leading is a 20.8px line box, so 28 leaves 3.6px of air each
side. **The hit area the critic asks for is what already ships.** Report that you checked it and
did not rebuild it.

So the buildable gap is the other two thirds: **the inset hairline and the search glyph** — the
things that would make a 28px box that is currently invisible read as a control at rest.

## THE SOURCE YOU ARE EDITING — inlined

\`\`\`css
/* Filter band under the head: a second toolbar row, same hairline language, no
   control chrome of its own. The rail already supplies --surface, so the input
   is bare and the band brightens on focus the way the composer pill does. */
/* Left padding matches .sidebar-head and the 6px list gutter + 10px row inset,
   so the placeholder, the group headings and the row titles share one edge. */
.sidebar-filter {              /* line 432 */
  flex-shrink: 0;
  padding: 0 8px 0 16px;
  border-bottom: 1px solid var(--border);
  transition: border-color 150ms var(--ease);
}

.sidebar-filter:focus-within { /* line 439 */
  border-bottom-color: var(--tint-5);
}

.sidebar-filter-input {        /* line 443 */
  width: 100%;
  height: 28px;
  border: none;
  background: transparent;
  outline: none;
  font: inherit;
  font-size: var(--fs-ui);
  color: var(--text);
  appearance: none;
}

.sidebar-filter-input::-webkit-search-cancel-button {   /* line 462 */
  display: none;
}

.sidebar-filter-input::placeholder {                    /* line 466 */
  color: var(--text-faint);
}
\`\`\`

The markup, at \`Sidebar.tsx\` around line 622, is a \`div.sidebar-filter\` wrapping an
\`input.sidebar-filter-input\`. Read it with \`Read\` at offset 612, limit 30 if you need it.

## ⚠️ THE ONE HARD FENCE: YOUR CHANGE MUST BE HEIGHT-NEUTRAL IN THE PRE-LIST STACK

Two waves ago a builder compressed everything above the session list so the first row's top edge
moved from y225 to **y202**, and y202 was shown to be the arithmetic floor while the empty state
keeps its authored copy. **That work is in your file and you must not undo it.** The filter band
sits inside that stack, so **any pixel you add to its height pushes the first session row back
down and silently reverses a landed build.** Draw inside the 28px you already have. If your
derivation genuinely requires more height, STOP and report that instead of taking it.

## THE AUTHORED TENSION, WHICH IS YOURS TO RESOLVE RATHER THAN CITE

The comment above \`.sidebar-filter\` says the bareness is deliberate: *"a second toolbar row, same
hairline language, **no control chrome of its own**"*, with the band brightening on focus the way
the composer pill does.

**"It was authored" is not a defence against a bar critic** — this run has ruled on that twice.
A deliberate value is still reviewable. But it is real evidence about intent and there is a second,
harder cost recorded a few lines below in the same file: **THREE hairlines already stack in this
short vertical span** — the rail head's, the background-sessions section's, and this filter band's
own \`border-bottom\`. An inset hairline around the input would be a **fourth** line in a band that
already carries three.

So you have a genuine design decision, and either answer is a legitimate result:

1. **Build the affordance.** Then you must say what makes it read as a control at rest without
   becoming the fourth stacked rule — e.g. a hairline that replaces rather than adds to the band's
   own \`border-bottom\`, a very quiet inset ground instead of a stroke, or the glyph alone doing
   the work. Derive it; do not pick it.
2. **Refute the hairline half and build only the glyph**, if you can show the fourth rule costs
   more than the affordance buys. A search glyph in the placeholder position is on its own a
   strong, conventional "this is a search field" signal and adds no line.
3. **Refute the whole ask**, if you can show with the hairline count and the band's role that the
   bare form is correct. This is the highest bar: you must answer the critic's actual observation
   — that the control is indistinguishable from passive muted copy — with evidence, not with the
   comment. Citing the comment is not a refutation.

## THE ICON CONVENTION, AS GIVEN

Every titlebar toggle shares one glyph constant: a **16x16 viewBox**, round line caps,
\`currentColor\`, \`strokeWidth: 1.3\`. If you add a glyph, match that convention — a second icon
idiom in the app would be a real regression and the "app has no icon vocabulary" claim has already
been refuted once by measurement.

## THE OTHER FENCES

- ⚠️ **DO NOT REOPEN THE ROW CORNER.** It was settled last wave at 8px on measured run-length
  spread across three row heights. It is a different piece of work in your same file. Leave it.
- ⚠️ A driver sets a value on this filter input and asserts the rail filters. It does **not**
  measure the input's height — but a changed hit area is exactly the class of change that could
  reach it. Keep the input an \`input\` element with its existing class and its existing
  \`::placeholder\` behaviour, and do not change what typing into it does. GIVEN; do not go read it.
- \`--tint-5\`, \`--border\`, \`--text-faint\`, \`--text-muted\` and \`--mint\` already exist. You may
  use them. You may not define new ones in \`tokens.css\`.

Now decide, make your change, and write your report.`

const CHAT = `${SHARED}

## YOUR PIECE: the TOOL CARD's disclosure rows. YOUR ONE FILE: \`src/renderer/src/styles/tool-card.css\`

You are NOT editing \`chat.css\`. Another builder is not in it either, but it is outside your
ownership and the transcript's prose, bubbles and spacing are not your gap.

## THE GAP, AS THE CRITIC RETURNED IT

"each 'SHOW …' action is a compact label-only line that reads more like metadata than an operable
row. Give each disclosure a 28-32px full-width row, retaining the existing chevron and vertically
centering the label."

## WHY THIS ONE IS WORTH BUILDING

The transcript's reference is a long-form changelog page, and the critic's observation is about
**affordance at rest**: a caret plus a micro-caps label with no box around it and no height of its
own is indistinguishable from a caption. Four waves of critics on this surface kept returning to a
type-weight question that was refuted five times; this is the first Chat gap of the run that names
a concrete element, a concrete property and a direction.

## THE SOURCE YOU ARE EDITING — inlined, do not go read the file for these

\`\`\`css
.tool-card {                   /* line 6 */
  margin-left: 40px;
  max-width: 75%;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px 14px;
  font-size: var(--fs-ui);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Disclosure (#61). Quiet by default — the card must read exactly as it did
   before when nobody is looking at it — and the caret is the only always-on
   hint that there is more. (Micro-caps type comes from the shared rule above.) */
.tool-card-toggle {            /* line 65 — THE RULE YOU CHANGE */
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
  padding: 0;
  border: 0;
  background: transparent;
  font-family: var(--font);
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: color 150ms var(--ease);
  -webkit-app-region: no-drag;
}

.tool-card-toggle:hover {      /* line 81 */
  color: var(--text-muted);
}

.tool-card-toggle:focus-visible {   /* line 85 */
  outline: 2px solid var(--mint);
  outline-offset: 3px;
  border-radius: 4px;
}

.tool-card-caret {             /* line 91 */
  display: inline-block;
  transition: transform 150ms var(--ease);
}

.tool-card-toggle[aria-expanded="true"] .tool-card-caret {   /* line 96 */
  transform: rotate(90deg);
}
\`\`\`

The card is a **flex column with \`gap: 4px\` and \`padding: 10px 14px\`**, and the toggle is
currently \`align-self: flex-start\` — so it is exactly as wide as its own text. That single
declaration is why it reads as a caption rather than a row.

## THE GEOMETRY YOU ARE WORKING IN — treat as GIVEN

- Tool cards measure **568px wide** in the captured transcript, with **10px 14px** of padding, so
  the content box is **540px**.
- A card holds **up to three** disclosure rows (output, input, change), rendered as a subset.
- The two cards in the captured transcript are 568x108 and 568x109. **Anything you add to each
  row's height multiplies by the number of rows in the card**, and the card grows downward inside
  a transcript that another critic is grading as composition. Say in your report what your change
  costs a 3-row card in total height.

## THE HEIGHT NUMBER IS DERIVABLE, NOT A CHOICE BETWEEN 28 AND 32

The critic offered a 28-32px range. **This app already has an answer**: 28px is its control
housing square — \`.sidebar-toggle\` is an explicit 28px, the sessions rail's filter input is an
explicit 28px, and DESIGN.md names that square in its Layout section. Taking 28 makes this row the
same control height as every other control housing in the app; taking 32 mints a new one. If you
take anything other than 28, you owe a derivation for why this row is not a control housing.

## WHAT "FULL-WIDTH" CAN MEAN, AND THE TWO FORMS COST DIFFERENT THINGS

1. **Stretch to the card's content box (540px).** \`align-self: stretch\`. The row's ground, if it
   gets one, stops 14px short of the card's border on both sides and reads as an inset band.
2. **Bleed to the card's own edges (568px).** Stretch plus a negative horizontal margin equal to
   the card's padding, with matching padding put back on the row so the label stays on the card's
   text edge. The row's ground then meets the card's border, which is a stronger row read and also
   a much louder one inside a card whose whole authored character is "quiet by default".

Pick one and say why. Both are one declaration plus at most one more.

## THE FENCES

**FENCE 1 — THE AFFORDANCE MUST BE AT REST.** The capture has no cursor. \`:hover\` is invisible to
the critic. \`color\` on hover is the current mechanism and it cannot carry this change.

**FENCE 2 — MINT IS A BUDGETED RESOURCE.** Exactly ONE mint hue exists and it must stay under 10%
of any surface; that is checked every wave. The transcript's worst case has headroom, but a mint
ground on up to three rows per card in a scrolling transcript is the one change in this file that
could move the number. **A neutral ground (\`--surface\`, \`--border\`, a tint step) is the safe
form.** If you want mint at rest, justify it against the budget.

**FENCE 3 — THE FOCUS OUTLINE.** \`outline-offset: 3px\` on a row that now stretches to the card's
content box puts the outline 3px outside a box that is 14px from the card's border — fine at form
1, and at form 2 it would paint **outside the card entirely**. If you take form 2, you own fixing
that. Do not leave it broken.

**FENCE 4 — THE TYPE LADDER AND THE LABEL.** The label's size and weight come from a shared
micro-caps rule and a driver pins the card's name element at 13px / weight 400. **Do not change
any font-size, font-weight or letter-spacing in this file.** Your change is geometry.

**FENCE 5 — \`.tool-card + .tool-card { margin-top: -16px }\`** deliberately overlaps consecutive
cards. It is not yours and it is not a bug; leave it alone.

## WHAT THE AUTHORED COMMENT SAYS, AND WHY IT IS NOT A REFUSAL

The comment above the rule says the disclosure is *"quiet by default — the card must read exactly
as it did before when nobody is looking at it"*. Your change makes that claim partly false, which
is expected and is rule 6's job, not yours. But it is real evidence about intent: **the quietest
change that makes the row read as a row is the right one.** A row does not need a filled
background to read as a row — height, full width and a vertically centred label may be enough on
their own. Try the quiet form first and only add a ground if you can say what it buys.

Now make your change and write your report.`

const out = await parallel([
  () => agent(TITLEBAR, { label: 'build:Titlebar', phase: 'Build' }),
  () => agent(SIDEBAR, { label: 'build:Sidebar', phase: 'Build' }),
  () => agent(CHAT, { label: 'build:Chat', phase: 'Build' }),
])

return { titlebar: out[0], sidebar: out[1], chat: out[2] }
