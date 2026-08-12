export const meta = {
  name: 'gauntlet-wave3-builders',
  description: 'Gauntlet run 3 wave 3: three builders close three measured gaps on disjoint files',
  phases: [{ title: 'Build', detail: 'Welcome / Titlebar / Sidebar, one named gap each' }],
}

const SHARED = `
You are a BUILDER in gauntlet run 3, wave 3, on the claude-wrapper Electron app at
D:/.claude/claude projects/playground/4 (branch gauntlet/core-after-docks).

Your job is to close ONE named gap. You are not redesigning, and you must not touch any
piece other than your own. A builder handed one gap that closes two is out of scope.

## Absolute rules

1. DO NOT RUN npm, ANY BUILD, OR ANY TEST. Three builders share one working tree this
   wave; concurrent npm runs measure nothing and corrupt each other. The wave gates once,
   centrally, after every builder has returned. Read source to reason; never execute it.
2. EDIT ONLY the files in YOUR file list below. Another builder owns every other file.
   File ownership was proved disjoint before you were spawned; breaking it destroys the
   wave's control.
3. DO NOT edit DESIGN.md, PRODUCT.md, .gauntlet/**, .claude/**, .context/**, or any test
   or driver file. DESIGN.md is the spec fence, not something a wave revises.
4. DO NOT git commit, git add, git stash, or git checkout. The leg commits the wave.

## D3 — the stylesheet pins are literal-text and brittle

Three tests scan the WHOLE src/renderer/src/styles/ directory as raw text. Therefore:
- NO comment anywhere in styles/ may contain a closing brace "}". This is the single
  easiest way to red the gate. Write comments without braces.
- ".bubble {" must remain the FIRST literal occurrence of that exact string in chat.css.
- ".bubble" and ".message-input" stay UNGROUPED — never join them to a selector list.
- No scrollbar rule may be component-scoped.
- EXACTLY ONE backdrop-filter exists in all of styles/ (subagent.css:122, .subagent-drawer).
  Do not add a second. Do not remove that one.
- The @import order in styles.css IS the cascade. Add rules inside an existing file;
  never reorder imports.
- Only font-weights 400 and 600 are permitted, keywords included. No em font-size. Exactly
  one literal px font-size exists in all of styles/, allow-listed by exact file:line — do
  not add another.
- theme.test.ts permits hue and accent-chroma movement but NO lightness and NO alpha change.

## D4 — any CSS change owes a driver pin that EXECUTES

jsdom loads no CSS, so an unknown var() resolves silently to nothing and every raw-text pin
still passes. An EXISTING gui-*.mjs driver that covers your change discharges this — you do
not need to write a new one, and you may not (drivers are outside your file list). In your
report, NAME the existing driver and the specific assertion of it that would red if your
change were wrong. If no existing driver covers it, SAY SO plainly as an unpaid D4 debt and
name the file where the pin belongs. Do not paper over it. A previous wave's builder
declared exactly this and the leg paid it; that is the working pattern.

## One type scale, stated as a ratio

A size belongs to the system when it lands within HALF A PIXEL of 15 * 1.15^k for whole k.
That half pixel is not slack. Rungs in use: 11, 13, 15, 17.25, 46. Do not introduce an
off-ladder size.

## No em dashes in user-visible strings

tests/copy-em-dash.test.ts compiles src/. Comments are free; rendered copy is not.

## What a good report looks like

Close the gap in as FEW declarations as possible — ideally one. Then:
- If your change falsifies an authored comment near it, UPDATE that comment. Leaving false
  evidence for the next reader is a defect in itself, and every builder last wave did this.
- Explain the mechanism in the comment, in plain language, including WHY the alternative you
  rejected was rejected. This codebase's comments carry arithmetic and reasoning, not labels.
  Match that density; read the surrounding comments first and write like them.
- If the gap as written is NOT buildable, or is already satisfied by what ships, say so with
  the evidence rather than inventing a change. A refusal with numbers is a good outcome. Do
  not invent work to look productive.
`

const REPORT = {
  type: 'object',
  additionalProperties: false,
  required: ['piece', 'outcome', 'declaration', 'filesChanged', 'mechanism', 'd4', 'commentsUpdated', 'invariantsChecked', 'concerns'],
  properties: {
    piece: { type: 'string' },
    outcome: { type: 'string', enum: ['GAP CLOSED', 'GAP REFUSED', 'PARTIAL'] },
    declaration: { type: 'string', description: 'The exact CSS/TSX declarations added or changed, verbatim' },
    filesChanged: { type: 'array', items: { type: 'string' } },
    mechanism: { type: 'string', description: 'Plain-language why this works, and what you rejected' },
    d4: { type: 'string', description: 'Existing driver + the assertion that would red, OR an explicit unpaid-debt statement naming where the pin belongs' },
    commentsUpdated: { type: 'array', items: { type: 'string' }, description: 'Authored comments your change falsified and you corrected' },
    invariantsChecked: { type: 'array', items: { type: 'string' }, description: 'Each D3/scale/ownership rule you verified, and how' },
    concerns: { type: 'array', items: { type: 'string' }, description: 'Anything the leg or the smoothing pass should verify. Empty array if none.' },
  },
}

phase('Build')

const builders = [
  {
    label: 'build:Welcome',
    prompt: `${SHARED}

## YOUR PIECE: Welcome

## YOUR FILES — edit only these
- src/renderer/src/styles/chat.css, but ONLY at or after line 327, the "welcome" section
  marker comment. Everything before that marker belongs to the Chat piece, which has no
  builder this wave; stay out of it anyway so the diff is auditable.
- src/renderer/src/components/Welcome.tsx

## YOUR ONE GAP

Wave 2 left the Welcome hero 65.0px off-centre in an app that holds "a content block is
centred in its pane" to 0.0px in five other places. Restore 0.0px centring WITHOUT
discarding the shared left edge wave 2 built.

## THE ROOT CAUSE, already measured — do not re-derive it

In chat.css the .welcome rule is:

    display: grid;
    grid-template-columns: max-content;
    justify-content: center;
    justify-items: start;
    align-content: center;
    padding: 32px 32px min(152px, 17vh);

"max-content" resolves to .welcome-hint's max-width: 480px, NOT to the roughly 415px the
sentence actually paints when it wraps at its comma. So the 480px COLUMN is centred
correctly, spanning x480..959, but 65px of that column is empty and all of it is on the
right; justify-items: start then hugs every item to the column's left edge. The four items
genuinely do share one left edge, which was wave 2's goal and is worth keeping. The block
they form just sits 65px left of the centre everything else holds.

Measured three independent ways: ink-bbox margins left 480 / right 545; a mass-weighted ink
centroid moving dx -1.6px to -114.6px against the pane centre with ink count essentially
unchanged (20595 to 20628, so it is the same content relocated, not new content); and the
same 1px to 65px delta reproducing in the minimum-window capture.

## ACCEPTANCE NUMBER

Wave 1's measured left edge was x512, and the arithmetic 32 + (1376 - 415) / 2 = 512.5
predicts exactly that. A correct fix lands the block's left edge back at about x512 AND its
midpoint on the pane centre. State what your change predicts, with the arithmetic.

## DIRECTION, not a prescription

The track needs to size to the hint's PAINTED width rather than its max-width cap. Note that
no CSS intrinsic keyword expresses "painted width" directly: max-content is wider than the
cap, and fit-content()/min-content do not give it either. One clean family of solutions makes
the hint's own max-content equal what it paints, so "max-content" then resolves to the right
number and the fix stays font-relative rather than a magic pixel value. Another sizes the
track by a different mechanism entirely. Choose, implement, and justify — including why you
rejected the alternative. Prefer font-relative over a hard-coded pixel width, and say so if
you cannot.

## TRAPS — each one cost a previous wave

- DO NOT revert to align-items: center or otherwise centre the ITEMS. That discards wave 1's
  gap (the shared left edge) and re-opens a closed finding. The fix must satisfy BOTH: items
  left-registered to one edge, block centred in the pane.
- DO NOT touch .welcome-hint's max-width: 480px. Driver gui-gauntlet-wave3 pins that measure
  and the hint's TWO line boxes. Change the TRACK, not the hint's cap. If your solution makes
  the hint paint a different number of line boxes, you have broken that pin — keep it at two.
- DO NOT touch the headline. gui-gauntlet-wave4 pins it four ways: tracking at -0.02em
  (-0.92px at 46px), the authored font stack naming the Display optical master FIRST, that
  master actually resolving to a real face on that element, and the headline box measuring
  57.5px so the minimum-window height budget is untouched. 46px is --fs-display and is
  correct; DESIGN.md names it as the app's only headline.
- DO NOT touch the button label "Pick a project folder". It is pinned by FORTY GUI drivers.
- DO NOT re-raise or change the hero's VERTICAL placement. It is AUTHORED: padding
  32px 32px min(152px, 17vh) with centred content predicts a 66.85px top margin at the
  minimum window and 242px at default, and both were MEASURED at 67 and 242. Horizontal
  centring is your job; vertical is settled.
- The 760px two-column hero and the ~96px identity mark are both REFUTED and must not be
  built: the app supports a 640px-wide window so a 760px column overflows the minimum pane by
  120px, and the welcome pane has only 69.71px of headroom (432 - 32 - 81.6 - 248.69, exact)
  so a 96px mark would spend 52 of it.
- The mark is SOLID BY DESIGN, no glyph. Do not add one.

Read the authored comment block immediately above .welcome before you change anything — it
carries the rung arithmetic for the current sizes and you must not falsify it silently.`,
  },
  {
    label: 'build:Titlebar',
    prompt: `${SHARED}

## YOUR PIECE: Titlebar

## YOUR FILES — edit only these
- src/renderer/src/components/Titlebar.tsx
- src/renderer/src/styles/titlebar.css

## YOUR ONE GAP

Give the identity lockup a group break, so identity, backend state and action stop reading
as one undifferentiated cluster.

## THE MEASUREMENT, already taken — do not re-derive it

Left-side ink groups in the wave-2 capture: mark x14..35, app name x46..142, "Wisped"
x152..209, "Bypass" x220..275. That is gaps of 10 / 9 / 10px — three identical intervals, so
nothing separates identity from state. The critic asked for a 16 to 24px break after the app
name (its ink ends at x142), or for the pills to move to the utility side. The break is the
buildable form; moving the pills is a product change, not a composition one.

## THE CENTRING MECHANISM — read this before you touch anything

.titlebar-left and .titlebar-right are BOTH "flex: 1" with a ZERO basis. Equal grow means the
two flanks take equal shares of whatever the centre slot does not use, so the slot is
symmetric about the window "for any flank contents, which is the point" (the authored comment
says exactly this). Consequence in your favour: adding a gap INSIDE the left group does NOT
shift the centred title while free space exists.

What DOES break it, and is forbidden:
- ANY horizontal padding on .titlebar itself, or on either flank's box. The authored comment
  at the top of titlebar.css states the total error is
  (leftWidth - rightWidth) / 2 + padLeft / 2, and that "every centring assertion in gui-136
  reds by exactly half of it". The window's 14px left inset lives on .logo-mark's margin-left
  deliberately, as CONTENT inside the flank, so it is spent from that flank's own share. Do
  not move it and do not add a partner inset on the right.

## THE REAL TRAP AT THE MINIMUM WINDOW

"min-width: 0" is deliberately ABSENT from .titlebar-left, so the flank stops at its
min-content floor. At the 640px minimum the row is already FULL: the group paints about 262css
of mark, name and pills. Your +16 to +24px raises that floor and shrinks the centre slot by
the same amount. gui-136 runs at widths 1440, 1100 and 640 and splits its rule honestly: while
the title FITS it asserts the two flanks are EQUAL and the title midpoint lands on the window
centre; once the row is FULL it asserts instead that the title fills exactly the space between
the flanks, forcing offset = (left - right) / 2. It also asserts containment — the title must
not start left of .titlebar-left's right edge. So your change is accommodated by design at
640, but it is NOT free: reason explicitly about whether the centre slot still holds a
truncated title at 640, and report your reasoning. Do not assume.

## THE SELECTOR TRAP

.backend-pill is grouped with .perm-pill AND .model-pill in the shared pill-shell rule
(titlebar.css around line 81). ".model-pill" lives in the COMPOSER, not the titlebar. A margin
added to that grouped rule would move a composer control owned by nobody this wave. Scope your
change to the titlebar's left group.

Second half of the same trap: in Titlebar.tsx both pills are CONDITIONAL —
"{backend && <BackendPill/>}" and "{permission && <PermissionPill/>}". So "the first pill" is
not always .backend-pill, and gui-136 deliberately exercises a "no-pills" state as well as a
"project+long-title" state, using the difference between them to validate its own run. A
selector keyed to whatever follows .app-name survives every combination; one keyed to
.backend-pill does not. Prefer the robust form, and say which states you reasoned about.

## THE RATIO PRECEDENT — cite it

This codebase has already decided what counts as a break that reads. The .titlebar-actions
comment records that a 39px crossing against a 30px window rhythm was "a 1.3x ratio, far too
weak to break the run, so all six controls read as one strip", and that it was changed to a
49px crossing against 30px, i.e. about 1.63x. Your break sits against a 9 to 10px interval, so
16px is roughly 1.6 to 1.78x and lands on that established precedent; 20px would be about 2x.
Pick a value, state the ratio it produces, and justify it against that precedent rather than
against taste.

## TRAPS

- Read adjudication 2.2 in .claude/gauntlet.md before you start. This surface carries an
  UNRESOLVED spec conflict: wave 2 promoted the centred session title to the 15px rung, and
  DESIGN.md assigns 15px to "prose at 1.6 leading" while assigning "UI labels" to 13px. The
  owner has not ruled. DO NOT move the title back to 13px, and DO NOT edit DESIGN.md. Leave
  the conflict exactly as it stands; it is not your gap.
- Do not touch the three dock toggles, their 28px housing, the hairline separator, or the
  window controls. Their spacing is exact to 0.5px and the four-wave argument about their
  glyphs is settled by measurement (the Commands slash carries 27 ink px against its siblings'
  79 and 82 because its line spans 4.6 of a 16px grid, which is INK WEIGHT, not spacing).
- Do not change any pill's text, colour, or accent variant.`,
  },
  {
    label: 'build:Sidebar',
    prompt: `${SHARED}

## YOUR PIECE: Sidebar (the sessions rail)

## YOUR FILES — edit only these
- src/renderer/src/components/Sidebar.tsx
- src/renderer/src/styles/rails.css
- src/renderer/src/styles/shared.css (see the ownership warning below before touching it)

## YOUR ONE GAP

Give the session row a corner proportionate to its new height. It grew 17px to 74px during
wave 2 while its 8px radius did not move, making it the app's FLATTEST-cornered box at a
radius-to-height ratio of 0.108 — overtaking the tool card's 0.111 — with no radius decision
ever having been taken.

## THE MECHANISM BEHIND THE GAP

Heights move for content reasons; the nine bare-literal radii in the in-frame stylesheets never
move with them. So every layout change silently re-sorts the ratio table. That is why this is a
real finding and not a taste call.

Current ratio table, measured: composer pill 760x48 at r24 = 0.500 · user bubble 456x72 at
r16 = 0.222 · tool card 568x108 at r12 = 0.111 · session row 248-wide x74 at r8 = 0.108.

## THE TRAP THE GAP DESCRIPTION DOES NOT NAME — this is the important part

The 8px radius is at rails.css:143, and it sits on a GROUPED selector:

    .session-row-btn,
    .agent-row-btn,
    .command-row-btn {
      ...
      border-radius: 8px;
      ...
    }

Editing that declaration changes the AGENT rows and the COMMAND rows too. Two separate costs:
1. It destroys this wave's file-ownership control. The previous wave proved ownership held by
   showing agents-dock.png and commands-dock.png byte-identical between waves. Move their
   radius and that control is gone for wave 3.
2. .command-row boxes are pinned by driver gui-94, which is ALREADY RED for an unrelated
   run-2 reason. Adding a second cause to an already-red driver makes it permanently
   unattributable.

So: add a .session-row-btn-ONLY declaration and leave the group's 8px alone. There is already
an exact precedent for this shape in the same file — rails.css:558 declares
".session-row-btn { transition: ... }" as a session-only rule sitting after the group. Follow
it. Place your rule so the cascade reaches it (later in the same file), and do not reorder
anything.

## THE TOKEN QUESTION — decide it, with reasons

The radius vocabulary is the one system this codebase never named: 13 distinct corner values
ship in-frame and NINE of them are bare literals, in a codebase that tokenises seven tint steps
and documents its type ratio in a 30-line comment. Only three radius tokens exist:
--r-bubble (16px, used twice), --r-pill (999px, nine times), --r-mark (7px, ten times), defined
in tokens.css around lines 56 and 112.

--r-bubble at 16px on a 74px row gives ratio 0.216, against the user bubble's 456x72 at r16 =
0.222. Two boxes of near-identical height wearing the same corner is exactly the coherence the
finding asks for, and it reuses an existing token instead of minting a fourteenth bare literal.
The honest cost is semantic: the token is NAMED for chat bubbles and you would be using it on a
rail row.

Your call. Either use --r-bubble and justify the semantic stretch in the comment, or introduce a
properly named token and STATE PLAINLY IN YOUR REPORT that you made a system change, or use a
bare literal and justify why the vocabulary should stay unnamed. Reusing what exists beats
inventing, but a wrong-named token is a worse defect than a literal. Whatever you choose, the
comment must carry the ratio arithmetic.

## TRAPS

- DO NOT undo or weaken the two-line title clamp wave 2 added. It is MEASURED as an
  improvement: row pitch spread TIGHTENED from 1.76px to 1.41px and every row carries exactly
  two title lines. A previous critic claimed rows "jump between two- and three-line heights";
  that was refuted on the pixels. Do not act on it.
- shared.css's two-line clamp group is SHARED with .agent-row-desc and .command-row-desc. If
  you touch shared.css you are moving other docks' rows and leaving your lane. Strongly prefer
  changing nothing there. If you believe you must, say so loudly in your report with the reason.
- The rail is 248px wide, not 254px. It narrowed during a previous run.
- Do not touch the mint active-row stripe. Exactly ONE box-shadow in styles/ has a nonzero
  horizontal offset and it is that stripe; a second one reds the gate.
- Do not change row copy, timestamps, or the truncation behaviour.
- The timestamp line must stay in column; an authored comment in rails.css says so.`,
  },
]

const results = await parallel(
  builders.map((b) => () => agent(b.prompt, { label: b.label, phase: 'Build', schema: REPORT }))
)

return results
