export const meta = {
  name: 'gauntlet-wave8-builders',
  description: 'Gauntlet run 3 wave 8: two builders on provably disjoint file ownership',
  phases: [{ title: 'Build', detail: 'Titlebar (titlebar.css), Chat (tool-card.css)' }],
}

const ROOT = 'D:/.claude/claude projects/playground/4'

// BYTE-IDENTICAL to wave 7's SHARED except for the builder count in rule 1
// (three -> two). Waves 6 and 7 both landed every builder first time on this
// shape, after wave 5 lost EIGHTEEN agents on briefs that required reproducing
// a long comment verbatim inside the edit. Do not soften it.
const SHARED = `
You are a BUILDER on a working, shipping Electron desktop app at ${ROOT}
(branch gauntlet/core-after-docks). The app already works. You are not fixing a bug and you are
not redesigning anything. You are closing ONE named gap that an independent critic found by
comparing the running app against an external design reference.

## THE RULES THAT GET BUILDS REVERTED WHEN BROKEN

1. **You own EXACTLY THE FILES NAMED IN YOUR BRIEF, AND NOTHING ELSE.** One other builder is
   editing another file in this same working tree at this same moment. Touching any file but yours
   corrupts their work and yours. If you believe your gap cannot be closed inside your files,
   STOP and say so in your report — that is a useful result, not a failure. Four of this run's
   most valuable results were exactly that.
2. **Close ONE gap. Do not redesign, do not tidy, do not touch other pieces.** The smallest
   correct diff wins. The last five waves landed their changes in ONE declaration each.
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
- ⚠️ **\`src/renderer/src/styles/tokens.css\` IS OFF LIMITS TO BOTH BUILDERS THIS WAVE**, and
  the reason is not tidiness: the tokens it defines are shared across surfaces, so a value changed
  there lands on a piece another critic is grading. Whatever you need, declare it in YOUR file.
- jsdom loads no CSS, so an unknown \`var()\` or an unparseable value resolves to NOTHING and
  every text-based test pin in this repo still passes. A silent no-op is the failure mode this
  wave is most exposed to. Prefer a form you are confident the browser parses.
- **The theme test allows hue and accent-chroma movement but NO lightness change and NO alpha
  change on the tokens themselves.** You are not editing tokens this wave, so this binds you only
  if you invent a colour: keep any new colour achromatic or below OKLCH chroma 0.05.

## THE CAPTURE THAT GRADES YOU IS A RESTING SCREENSHOT

There is no cursor in it and nothing is hovered or focused. A \`:hover\` or \`:focus\` rule is
invisible to the critic that judges your work. If your gap is about something reading as
operable, **the affordance has to exist at rest** or you have built something nobody will grade.
You may still add interactive states; just do not let them carry the change.

⚠️ **WAVE 7 PROVED THIS THE EXPENSIVE WAY AND BOTH BRIEFS BELOW TURN ON IT.** A builder was asked
to make a quiet row read as operable. It reserved a 28px control housing and stretched the row to
full width — and the change **painted zero pixels**, because the row kept a transparent background
and no border. 100% of the visible change was negative space. Reserving space is not the same as
painting something. If your change is supposed to be *seen*, name which pixels change colour.

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
showed its asked-for target did not exist inside its file at all. Wave 7's Sidebar builder refuted
**two thirds** of its own ask with arithmetic. **Every one of those refutations was worth more
than a hit would have been.** If your arithmetic says the ask is out of reach, show the sum, land
the best DERIVED state, and name what would have to be spent to go further. A specific refutation
beats a guessed hit.
`

phase('Build')

const TITLEBAR = `${SHARED}

## YOUR PIECE: the TITLEBAR's left cluster. YOUR ONE FILE: \`src/renderer/src/styles/titlebar.css\`

Do not touch the identity mark's size, radius or depth. That thread is closed by measurement and
reopening it is how wave 5 lost eighteen agents.

## THE GAP, AS THE CRITIC RETURNED IT

"Add about 16px between the app name and the pill pair, then treat the two pills as one compact
state group."

## THIS IS HALF OF A TWO-PART GAP WHOSE OTHER HALF IS ALREADY CLOSED — DO NOT REOPEN IT

Wave 6's critic asked for TWO things: mark-to-name 8-10px, AND a ~16px break before the pills.
Wave 7 built the tick — it went from 4px painted to **9px painted**, inside the ask — and
under-delivered the break. **This wave's critic says nothing at all about the tick and re-raises
only the break.** That is the cleanest attribution signal this run has produced, and it means:

⚠️ **DO NOT TOUCH THE 9px MARK-TO-NAME TICK. IT IS THE HALF THAT CLOSED.** It is funded by
\`margin-left: 5px\` on \`.app-name\` on top of the container's \`gap: 4px\`. Leave both alone.

## THE FILE ALREADY CONTAINS THE ARITHMETIC AND THE ANSWER. READ IT, THEN BUILD IT.

Open \`src/renderer/src/styles/titlebar.css\` with \`Read\` at **offset 100, limit 120**. That is the
authored comment block that ends at the rule you are changing. It is unusually dense and it is
load-bearing; the numbers below are lifted from it so you can check your read against them.

**The three intervals, declared:** \`9 / 14.5 / 4\`, summing to **27.5**.
- 9 = mark-to-name tick (\`gap: 4px\` + \`.app-name { margin-left: 5px }\`) — **NOT YOURS**
- 14.5 = the BREAK before the first pill (\`gap: 4px\` + \`.app-name + * { margin-left: 10.5px }\`)
- 4 = pill-to-pill channel (\`gap: 4px\`) — **NOT YOURS**

**The file records its own threshold for whether a break reads as a break.** It names **1.3x** as
"far too weak to break the run" and **1.63x** as enough. The break's ratio to the wider interval
beside it was \`12/4 = 3.00x\` painted at wave 6. After wave 7's tick it is \`13/9 = **1.44x**\`
painted (14.5/9 = 1.61x declared). **The break did not shrink — the interval beside it grew to
meet it.** So the group stopped reading as \`[mark name] BREAK [pill pill]\` and started reading as
three uneven intervals. An independent measurement and the critic's own words ("form one nearly
continuous four-element run") agree on this.

**The headroom is proven and it is bounded.** The file's own sentence: *"the intervals may sum to
33 and currently sum to 27.5."* So you have **5.5px** and not a pixel more.

## ⚠️ THE FENCE, STATED AS GIVEN — DO NOT GO READ THE DRIVER

The binding state is the WELCOME screen at the **640px minimum window**, where no dock toggles
exist so the right flank's floor is only 120. "New session" paints 81.5css, the two flanks split
the remaining 558.5 into **279.25 each**, and a driver asserts the two flanks stay equal within a
**1.0px tolerance** on an unclipped title. Your group's floor is its content (246px, none of it
spendable) plus the three intervals. **Floor = 246 + sum.** At sum 27.5 the floor is 273.5. The
equal share is 279.25, so **sum 33 is the exact ceiling** — that is where the file's number comes
from. Cross it and the left flank freezes, the right one shrinks, and the assertion reds.

A bare \`margin-left: 16px\` on the break was tried in an earlier wave and **RED the driver**. Do
not reach for the round number; reach for the derived one.

## ⚠️ TWO TARGETS ARE WITHDRAWN. DO NOT CHASE EITHER.

1. **The x247 sessions-rail divider.** An earlier critic asked this group to end before it. That
   target is withdrawn: x247 is a 1px hairline sitting **48px BELOW** this strip, so a box edge
   landing exactly on it reads as a collision rather than an alignment. The group's painted extent
   is x272, an overrun of +25, and **that is an accepted cost, not a regression.**
2. **"Treat the two pills as one compact state group"** — the second clause of your gap. The
   pill-to-pill channel is already the group's tightest interval at 4px declared. Tightening it
   further is not available (\`gap: 4px\` is shared with the tick you must not touch), and widening
   the break IS what makes the pills read as one group. **Your one change serves both clauses.**

## ⚠️ WHY THE INTERVALS DO NOT PAINT WHAT THEY DECLARE

\`--r-pill\` rounds each pill to a semicircular cap of radius ~10.15px. **A cap recedes from the
midline**, so the pill-to-pill channel paints optically wider than it measures. The break is
flanked by the app-name's flat right edge on one side and a pill's cap on the other, so it paints
roughly **1.5px LESS than declared** — at 14.5 declared it measured 13 painted. **Budget for that
when you pick your number, and state both the declared and the predicted painted value.**

## WHAT YOU ARE CHANGING

Exactly one declaration: \`.app-name + * { margin-left: ... }\`, currently \`10.5px\`, at roughly
line 216. **\`+ *\` is deliberate and must stay** — both pills are conditional in Titlebar.tsx, so
the first pill may be the backend one, the permission one, or nothing at all, and this is the only
form that puts one break in the same place in each case. Do **not** key it to \`.backend-pill\`;
that would mean editing the shared pill shell below, which \`.model-pill\` joins **from the
composer**, moving a control on a different surface that another critic is grading.

Derive your number from the 1.63x threshold and the 5.5px of headroom, predict the painted result,
and say what ratio you expect to land. Now make your change and write your report.`

const CHAT = `${SHARED}

## YOUR PIECE: the CHAT transcript's TOOL CARD. YOUR ONE FILE: \`src/renderer/src/styles/tool-card.css\`

## THE GAP, AS THE CRITIC RETURNED IT

"each secondary, collapsed artifact occupies about 136px of height, so the cards outweigh the
surrounding prose… Compress each to roughly 110-115px by tightening only the vertical gaps."

## ⚠️ YOU ARE FIXING LAST WAVE'S BUILD, AND THE LEG HAS ALREADY DECIDED THE MECHANISM

Last wave a builder was asked to make the two collapsed "SHOW …" disclosure rows read as operable
rows rather than as metadata captions. It chose the quietest available form: stretch the row to
the card's content box and reserve the app's 28px control-housing height. **It landed exactly as
designed and made the card measurably worse on three axes**, and two independent agents that never
saw each other's output agreed:

1. **\`align-self: stretch\` PAINTS NOTHING.** The label's ink box is identical before and after —
   same left edge, same width — because the row kept a transparent background and no border. The
   full width became hit area, not a visible band. **100% of the visible change was negative space.**
2. **THE PAIR STOPPED READING AS A PAIR.** Clearance from the card body to row 1 and from row 1 to
   row 2 was **13 / 13 (1.00x)**. It is now **20 / 26 (1.30x)** and **19 / 26 (1.37x)** — the two
   rows now sit further from each other than the first sits from the content above them. Reserving
   height per row spends it *between* the rows as well as around them.
3. **THE ROWS TOOK 24% OF THE CARD.** Inner height went **108 -> 134** and **109 -> 135**. The two
   quiet rows now occupy ~42% of the card's inner height where they occupied ~28%.

**THE INSTRUCTION THE FILE ITSELF LEAVES YOU IS: "either make the row visible so the 28px is doing
work, or give the height back — do not add more of it."** The leg has decided, and the decision is
NOT the binary that sentence offers. **Do both halves, in the only order that is coherent:**

> **GIVE BACK THE HEIGHT THAT BOUGHT NOTHING, AND PAINT THE WIDTH THAT WAS ALREADY THERE.**

Concretely, the shape you are building:
- **Drop \`min-height: 28px\`.** It is the declaration that cost 24% of the card and inverted the
  grouping. Removing it returns the row to its natural line box and returns the inter-row
  clearance to a uniform interval, which fixes cost 2 and cost 3 together.
- **KEEP \`align-self: stretch\`.** Full width is what makes a visible band possible at all, and it
  costs no height.
- **Give the row a RESTING GROUND** so it paints something. This is what fixes cost 1, and it is
  the reason the height was never what made the row operable — **the paint is.**

**Why this is derived rather than picked:** in the same wave, on the same brief class, a builder on
a different surface answered "make this quiet control read as operable" by spending **visible
resting ground** — and its critic moved off that axis entirely the next wave, which is this run's
cleanest signal that a gap closed. The builder that spent **air instead of paint** had its own
build named back to it as the defect. Ground worked; air did not. You are building the form that
worked, on the surface where the other one failed.

## WHERE TO LOOK, AND THE VOCABULARY THIS FILE ALREADY OWNS

Open \`src/renderer/src/styles/tool-card.css\` with \`Read\` at **offset 55, limit 75**. That covers
the authored comment, the \`.tool-card-toggle\` rule (~line 97) and its \`:focus-visible\` rule.

**This file already contains an inner-block vocabulary — use it rather than inventing one.** The
card itself is \`background: var(--surface)\`, \`border-radius: 12px\`, \`padding: 10px 14px\`. Inner
blocks inside it already use \`background: var(--well)\` with \`border-radius: 8px\` and
\`padding: 8px 10px\` (two rules further down the file, around lines 159 and 181). The rail's own
control housing on another surface uses the same r8 with a flat ground and no border. **A ground
consistent with what this file already does is a better answer than a new one.**

## ⚠️ FOUR FENCES

**FENCE 1 — THE FOCUS OUTLINE, AND IT DECIDES YOUR GEOMETRY.** \`.tool-card-toggle:focus-visible\`
carries \`outline-offset: 3px\`. The row currently stretches to the card's **content box**, which is
14px inside the card's border, so a 3px outward offset still paints inside the card — fine. **If
you bleed the band OUTSIDE the content box** (negative horizontal margins, to reach the card's own
edges) **the outline paints outside the card entirely, and then you own fixing \`outline-offset\`.**
Do not leave that broken. The safe form is a band at the content box; the bleed form is available
but costs you that second edit.

**FENCE 2 — THE LABEL'S LEFT EDGE IS AN ALIGNMENT, AND YOU MUST SAY WHICH WAY YOU WENT.** The
label currently sits flush at the content box's left edge, aligned with the card's prose above it.
If you give the band horizontal padding, the label indents and that alignment breaks. If you bleed
the band by exactly its own padding, the label stays put but you inherit FENCE 1. **Both are
defensible; a silent choice is not. State which you chose and what it cost.** Note that this
file's own \`var(--well)\` blocks already accept a 10px indent, so an indent is not automatically
wrong here.

**FENCE 3 — NO NEW ACCENT.** The app spends exactly one mint accent and a test counts it by hue.
**Your ground must be achromatic or below OKLCH chroma 0.05.** \`var(--well)\` and \`var(--border)\`
both satisfy this; mint does not. Do not introduce a second accent hue.

**FENCE 4 — THE TYPE LADDER AND THE OVERLAP RULE.** The label's size and weight come from a shared
micro-caps rule and a driver pins the card's name element at 13px / weight 400. **Do not change any
font-size, font-weight or letter-spacing in this file.** And
\`.tool-card + .tool-card { margin-top: -16px }\` deliberately overlaps consecutive cards — it is
not yours and it is not a bug; leave it alone.

## WHAT SUCCESS LOOKS LIKE, AS NUMBERS

The card's inner height should come back down from ~134-135 toward the 108-109 it held before last
wave — the critic asked for 110-115 and landing at or under that is a hit, not a miss. The two
disclosure rows' clearances should return to a **uniform** interval rather than the current
1.30x / 1.37x crossing. And unlike last wave, **a nonzero number of pixels must change colour** —
name how many roughly, and where.

Now make your change and write your report.`

const out = await parallel([
  () => agent(TITLEBAR, { label: 'build:Titlebar', phase: 'Build' }),
  () => agent(CHAT, { label: 'build:Chat', phase: 'Build' }),
])

return { titlebar: out[0], chat: out[1] }
