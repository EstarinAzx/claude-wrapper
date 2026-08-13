export const meta = {
  name: 'gauntlet-wave6-builders',
  description: 'Gauntlet run 3 wave 6: two builders on provably disjoint single-file ownership',
  phases: [{ title: 'Build', detail: 'Titlebar (titlebar.css), Sidebar (rails.css)' }],
}

const ROOT = 'D:/.claude/claude projects/playground/4'

// Every builder gets this. Wave 3 learned that a brief which RECITES driver
// facts invites a builder to go verify them; wave 4 learned that inlining the
// source is necessary but NOT sufficient — its Sidebar builder died twice on the
// 180s no-progress limit with its CSS already inlined, because the brief told it
// to "read the real file" (a 1313-line stylesheet). Wave 5 learned the third
// thing and it is the expensive one: EIGHTEEN agents stalled between a bounded
// read and an `Edit` call on a brief that required reproducing a ~20-line
// authored comment verbatim inside the edit. So: inline what it edits, name
// exact line ranges, ban the instrument, and keep the REQUIRED EMISSION SHORT.
// Rule 6 below is the wave-5 lesson made structural — the leg writes the prose.
const SHARED = `
You are a BUILDER on a working, shipping Electron desktop app at ${ROOT}
(branch gauntlet/core-after-docks). The app already works. You are not fixing a bug and you are
not redesigning anything. You are closing ONE named gap that an independent critic found by
comparing the running app against an external design reference.

## THE RULES THAT GET BUILDS REVERTED WHEN BROKEN

1. **You own EXACTLY ONE FILE.** It is named in your brief. One other builder is editing one
   other file in this same working tree at this same moment. Touching any file but yours
   corrupts their work and yours. If you believe your gap cannot be closed inside your one file,
   STOP and say so in your report — that is a useful result, not a failure. Two of this run's
   most valuable results were exactly that.
2. **Close ONE gap. Do not redesign, do not tidy, do not touch other pieces.** The smallest
   correct diff wins. The last four waves landed their changes in ONE declaration each.
3. **DO NOT RUN npm, any build, or any test.** Two builders share one tree; concurrent test
   runs measure nothing. The wave gates centrally after you both return.
4. **DO NOT OPEN** anything under \`.claude/\`, any \`gui-*.mjs\` driver, or \`inspect.mjs\`.
   Every driver fact you need is stated in your brief as GIVEN. Two previous builders died
   spending their entire time budget reading instrument source instead of writing CSS. If a
   driver fact matters to your change, it is already below — treat it as true.
5. **Bounded reads only.** Where your brief tells you to open a file for context it gives you an
   exact offset and limit. Use \`Read\` with those. Do not read a whole stylesheet.
6. ⚠️ **DO NOT REWRITE THE LONG AUTHORED COMMENTS. THE LEG WRITES THOSE THIS WAVE.** Your file
   carries dense authored reasoning and your change will falsify some of it. That is expected and
   it is NOT your job. Last wave eighteen agents died on briefs that required reproducing a long
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
  in your file.
- The \`@import\` order in \`styles.css\` IS the cascade. Add rules inside your file; never reorder.
- One type scale, stated as a ratio: a font size belongs to the system only when it lands within
  half a pixel of \`15 * 1.15^k\` for whole k. That half pixel is not slack. Token names are
  \`--fs-micro\` (11px), \`--fs-ui\` (13px), \`--fs-body\` (15px), \`--fs-display\` (46px).
- ⚠️ **\`src/renderer/src/styles/tokens.css\` IS OFF LIMITS TO BOTH BUILDERS THIS WAVE**, and the
  reason is not tidiness: the tokens it defines are shared across surfaces, so a value changed
  there lands on a piece another critic is grading. Whatever you need, declare it in YOUR file.
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
- Which authored comment claims your change falsifies, in plain prose. Do not rewrite them.
- Anything you could not do inside your one file.

## IF THE TARGET IS NOT REACHABLE, REFUTE IT — DO NOT MISS IT QUIETLY

A critic's number is an ask, not a fact. Last wave a builder was asked for ~175px, showed the
component sum put the floor at ~202px, delivered the floor and said so — and that refutation was
worth more than hitting the number would have been. If your arithmetic says the ask is out of
reach, **show the sum, land the best DERIVED state, and name what would have to be spent to go
further.** A specific refutation beats a guessed hit.
`

phase('Build')

const TITLEBAR = `${SHARED}

## YOUR PIECE: the TITLEBAR's left cluster. YOUR ONE FILE: \`src/renderer/src/styles/titlebar.css\`

This is the first Titlebar gap of the run that is NOT about the identity mark. The mark-depth
thread is CLOSED — do not touch the mark, its size, its radius or its depth, and do not re-aim at
the design reference's colour numbers. That question was settled by measurement and reopening it
is how the last wave lost eighteen agents.

## THE GAP, AS THE CRITIC RETURNED IT

"The left titlebar cluster overruns the structural column below it: the \`Bypass\` pill ends
around x=276 while the Sessions rail divider is at x=247. End the left group at least 12-16px
before the divider."

This is a CROSS-SURFACE observation and it is real. The sessions rail below the titlebar is 248px
wide, so its right divider is the column at **x247**. The titlebar's left group paints out to
**x276**, crossing that line by **29px**. The critic could only see it because it reads the whole
window frame rather than the titlebar strip alone.

## THE GEOMETRY, MEASURED — treat every number here as GIVEN

Box edges of the left group, recoverable to the pixel off the capture at zoom 1:

| item | box |
|---|---|
| logo mark | x14..36 |
| app name | x46..142 |
| backend pill ("Wisped") | x152..210 |
| permission pill ("Bypass") | x220..276 |

The flank's min-content floor is the sum of those with the gaps:
**14 + 22 + 7 + 96 + 16 + 58 + 7 + 56 = 276.**

## THE SOURCE YOU ARE EDITING — inlined, do not go read the file for these

\`\`\`css
.titlebar-left {          /* line 51 */
  display: flex;
  align-items: center;
  gap: 7px;
  flex: 1;
}

.logo-mark {              /* line 69 */
  display: block;
  margin-left: 14px;
  width: 22px;
  height: 22px;
  border-radius: var(--r-mark);
  background: var(--mark-depth), var(--mint);
  flex-shrink: 0;
}

.app-name {               /* line 79 */
  font-size: var(--fs-ui);
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
}

.app-name + * {           /* line 135 */
  margin-left: 9px;
}

.backend-pill,            /* line 141 — SHARED SHELL, see the warning below */
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

## THE FOUR FENCES, AS GIVEN

**FENCE 1 — \`.model-pill\` IS THE COMPOSER'S CONTROL, NOT YOURS.** It joins the shell rule at
line 141 from a completely different surface at the bottom of the app. Editing that rule's
\`padding\` or \`letter-spacing\` moves a control another critic is grading this wave. If you want
the two titlebar pills tighter, declare it in a NEW rule scoped to \`.backend-pill, .perm-pill\`
only. This exact trap is recorded in the file's own comment as the reason the group break was
keyed to \`.app-name + *\` rather than to \`.backend-pill\`.

**FENCE 2 — \`gui-136\` PINS FLANK EQUALITY, AND SHRINKING IS THE SAFE DIRECTION.** The titlebar
centres its session title by giving both flanks \`flex: 1\` over their min-content floors. The
binding state is Welcome at the 640px minimum window, where the right flank's floor is only 120:
the title paints 81.5css, the two flanks split the remaining 558.5 into **279.25 each**, and this
group's floor is **276** — 3.25px of slack. Wave 3 proved that GROWING the floor to 292 reds the
driver by 25.5px against a 1.0 tolerance. **Your change goes the other way.** A smaller left floor
means neither flank is frozen at its floor, so both take their equal share and the centring holds
with more room, not less. You do not need a width-neutral construction the way wave 3 did.
Separately: at 640 with a project open the title slot is \`640 - floor - 233\`, and the driver
requires the 60-character fixture title to still truncate; that fixture paints **451css**, so the
slot cannot approach it however far you shrink. Both halves are GIVEN. Do not go verify them.

**FENCE 3 — THE TYPE LADDER.** \`.app-name\` is \`--fs-ui\` (13px) and the pills are \`--fs-micro\`
(11px). A driver sweeps every painted box against \`15 * 1.15^k\`. **You may not shrink text to
buy width.** The app name's 96px and the pills' text widths are fixed costs.

**FENCE 4 — THE MARK'S 14px LEFT MARGIN IS THE WINDOW'S LEFT INSET, AND IT IS NOT BUDGET.** The
file's own comment records why it lives on \`.logo-mark\` rather than on the flank's box, and why
spending it was already rejected once: it would move the whole group off the window edge to solve
a spacing problem two items to its right. Leave it at 14.

## THE LEVER INVENTORY, AND THE ARITHMETIC YOU SHOULD CHECK BEFORE YOU BUILD

You need **-29px** to reach the divider and **-41px** to reach the critic's "12px before" ask.
What is actually inside your file, with fence 1 and fence 4 applied:

- **The three inter-item gaps: 7 / 16 / 7 = 30px total.** \`gap: 7px\` supplies all three and
  \`.app-name + *\` adds 9 to the middle one. The 16:7 crossing is a **2.29x** ratio, and the
  file's own precedent says 1.3x is "far too weak to break the run" while 1.63x is enough — so
  the break has room to tighten but not to vanish.
- **The two pills' horizontal padding: 9px each side.** Via a NEW rule scoped away from
  \`.model-pill\`. Each 1px removed buys 4px across the group (two sides, two pills).
- **\`letter-spacing: 0.02em\` on the pills** is ~0.22px per character at 11px — about 1.3px per
  six-character label. It is on the shared shell, so fence 1 applies.

Add those up honestly before you write anything. **If the sum does not reach the ask, that is the
result** — show it, land the best derived state, and say what would have to be spent to go
further. Note for your report, but do NOT attempt: moving a pill to the right flank is a JSX
change outside your one file, so if that is the only thing that reaches the target, say so and
stop. A previous critic proposed exactly that relocation and it is on the record.

Now make your change and write your report.`

const SIDEBAR = `${SHARED}

## YOUR PIECE: the ROW CORNER. YOUR ONE FILE: \`src/renderer/src/styles/rails.css\`

You are deciding ONE number, and because a previous wave unified the token, that one number now
moves all three row types in the app's two mirrored lists. This is a judgement call with real
evidence on both sides, and your job is to decide it and show the derivation — not to split the
difference.

## THE GAP, AS THE CRITIC RETURNED IT

"The active session reads as a chat bubble dropped into a navigation list: reduce its corner
radius from roughly 18px to about 8px and match its vertical padding to the unselected row shell."

## HALF OF THAT ASK IS ALREADY TRUE, AS GIVEN — do not build it

**The padding already matches.** All three row types share one shell with \`padding: 8px 10px\`,
and the active row declares no padding of its own. What makes the active row look different is
not padding: every session row reserves a two-line title area (\`min-height: 2.9em\`), so all five
rows are the same height and the measured row pitch is a uniform 75/76px. **There is no padding
difference to close.** Ignore that half of the gap and say in your report that you did.

So the gap is the corner, and only the corner.

## THE SOURCE YOU ARE EDITING — inlined

\`\`\`css
.session-row,             /* line 126 */
.agent-row,
.command-row {
  display: flex;
}

.session-row-btn,         /* line 132 — THE SHARED ROW SHELL */
.agent-row-btn,
.command-row-btn {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 2px;
  padding: 8px 10px;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.session-more {           /* line 557 */
  flex-shrink: 0;
  margin-top: 2px;
  padding: 8px 10px;
  border: none;
  border-radius: 8px;
  ...
}

/* ~90 lines of authored comment you must NOT rewrite — see rule 6 */
.session-row-btn,         /* line 664 — THIS IS THE DECLARATION YOU CHANGE */
.agent-row-btn,
.command-row-btn {
  border-radius: var(--r-bubble);
}

.session-row-btn-active,  /* line 688 */
.session-row-btn-active:hover {
  background: var(--mint-wash);
  box-shadow: inset 2px 0 0 0 var(--color-mint);
}

.session-delete {         /* line 704 — declares its OWN 8px, untouched by the above */
  ...
  padding: 0 8px;
}
\`\`\`

⚠️ **\`--r-bubble\` RESOLVES IN \`tokens.css\` AND THE CHAT USER BUBBLE ALSO CALLS IT**
(\`chat.css:168\`). **You may not change the token.** If you decide the rows want a different
value, change what line 664's rule resolves to — inside \`rails.css\`. Changing the token would
move the chat transcript's bubbles, which another critic is grading this wave, and it would be
attributed to you.

## THE EVIDENCE ON BOTH SIDES, MEASURED — treat as GIVEN

**FOR 16px (the current value, landed three waves ago and derived at the time):**
- \`.session-more\` sits directly under these rows at 36.8px tall on an 8px radius = **0.217**.
  One list, one corner: \`74 * 0.217 = 16.09\`.
- The chat user bubble, 456x72 on 16px, is **0.222**; \`74 * 0.222 = 16.44\`. A cross-check, not
  the reason.
- At 8px the 74px row measured **r/h 0.108** — the flattest-cornered box in the whole app,
  flatter than the tool card's 0.111, and nobody had ever picked that number.

**AGAINST 16px (two independent signals, both new since it landed):**
- This wave's critic asked for ~8px directly, arriving from the composition side.
- The previous wave propagated the token to the two dock row types, and the smoothing pass
  measured what that cost: **a token is not a shape.** The 16px arc now sits on boxes of 74px
  (rail row), 65px and 49px (command rows). The arc consumes \`2r\` of each box's vertical edge,
  so straight run fell **87.7% -> 66.2%** on the 65px rows and **83.7% -> 55.1%** on the 49px
  rows — leaving a 49px row with 17px of straight edge out of 49.
- **On a command row that outline is the ONLY indicator it has.** The rail row has a mint
  selection stripe; the dock row has nothing else.
- The stylesheet's own argument for exempting \`.session-delete\` is that **a narrow box and a
  wide one cannot share one corner** — and that test was applied to WIDTH and never to HEIGHT,
  where the 49px row is the case that would have failed it.

## THE THREE ANSWERS AVAILABLE TO YOU

1. **Keep 16.** Then you must answer the 49px row: what carries its edge if the outline is 55%
   straight? Say why the derivation still holds across a 25px height spread.
2. **Move to 8.** Then you must answer why the rail row goes back to being the app's
   flattest-cornered box at 0.108, a value the record says nobody chose.
3. **A third value that both heights can wear**, derived from the two ratios rather than picked
   between them. If you take this, show the derivation and say what it costs each row.

Splitting the group back into per-row values is a FOURTH option and you should treat it as a last
resort: the previous wave deliberately unified it, and the design spec calls the Agents dock the
sessions rail's mirror with the "same row shell". If you take it anyway, justify it against that
sentence explicitly.

## THE TWO MEASUREMENT FENCES

⚠️ **MEASURE STRAIGHT-RUN LENGTH, NOT PIXEL SHARE.** A share- or count-based check has now
reported the OPPOSITE of the truth twice on this exact class of change: when the corner grew, the
pixel count inside the border band ROSE (+79) because the taper adds antialiased pixels, while
the ink weight FELL 3.0%. Only run length shows what a corner does to an edge.

⚠️ **DO NOT UNDO THE RAIL COMPRESSION.** The previous wave moved the first session row's top edge
from y225 to y202, and y202 is the arithmetic floor while the empty state keeps its authored copy.
That is a different piece of work in your same file. Leave every vertical value alone — your
change is a corner and nothing else.

Now decide, make your change, and write your report.`

const out = await parallel([
  () => agent(TITLEBAR, { label: 'build:Titlebar', phase: 'Build' }),
  () => agent(SIDEBAR, { label: 'build:Sidebar', phase: 'Build' }),
])

return { titlebar: out[0], sidebar: out[1] }
