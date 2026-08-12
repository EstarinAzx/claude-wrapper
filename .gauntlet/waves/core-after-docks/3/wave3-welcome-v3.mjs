export const meta = {
  name: 'gauntlet-wave3-welcome-v3',
  description: 'Gauntlet run 3 wave 3: Welcome builder, third attempt, all source inlined so it needs no file reads',
  phases: [{ title: 'Build', detail: 'Welcome hero centring' }],
}

const REPORT = {
  type: 'object',
  additionalProperties: false,
  required: ['piece', 'outcome', 'declaration', 'filesChanged', 'mechanism', 'd4', 'commentsUpdated', 'invariantsChecked', 'concerns'],
  properties: {
    piece: { type: 'string' },
    outcome: { type: 'string', enum: ['GAP CLOSED', 'GAP REFUSED', 'PARTIAL'] },
    declaration: { type: 'string' },
    filesChanged: { type: 'array', items: { type: 'string' } },
    mechanism: { type: 'string' },
    d4: { type: 'string' },
    commentsUpdated: { type: 'array', items: { type: 'string' } },
    invariantsChecked: { type: 'array', items: { type: 'string' } },
    concerns: { type: 'array', items: { type: 'string' } },
  },
}

phase('Build')

const prompt = `You are a BUILDER on the claude-wrapper Electron app at
"D:/.claude/claude projects/playground/4" (branch gauntlet/core-after-docks). Piece: WELCOME.

## OPERATIONAL WARNING — TWO PRIOR ATTEMPTS AT THIS TASK WERE KILLED

Both died from a 180-second no-progress timeout while READING chat.css, which is 937 lines of very
dense authored commentary. They never made an edit. So everything you need is inlined below and you
should need ZERO exploratory reads. Use Edit directly on the exact text given. Do not read
chat.css in full, do not read anything under .claude/ , no gui-*.mjs , no inspect.mjs. Make your
first edit within your first two tool calls. If you want to confirm a small region before editing,
Read with a tight offset and limit, not the whole file.

## YOUR FILES — only these two
- src/renderer/src/styles/chat.css  (the two rules quoted below live at roughly lines 608 and 765)
- src/renderer/src/components/Welcome.tsx

Do not touch anything else. Do not run npm, any build, or any test. Do not git commit/add/stash.

## THE CURRENT SOURCE, VERBATIM

.welcome, at about line 608 of chat.css:

    .welcome {
      flex: 1;
      min-height: 0;
      display: grid;
      grid-template-columns: max-content;
      justify-content: center;
      justify-items: start;
      align-content: center;
      padding: 32px 32px min(152px, 17vh);
    }

.welcome-hint, at about line 765 of chat.css:

    .welcome-hint {
      font-size: calc(var(--fs-body) * 1.15);
      color: var(--text-muted);
      line-height: 1.6;
      max-width: 480px;
      text-wrap: balance;
    }

Welcome.tsx's markup in full:

    <main className="welcome">
      <span className="welcome-mark" aria-hidden="true" />
      <h1 className="welcome-title">Start a session</h1>
      <p className="welcome-hint">
        Claude reads and edits the files in the folder you open, and it keeps working there until you
        switch to another.
      </p>
      <button type="button" className="pick-folder-btn" onClick={onPick}>
        Pick a project folder
      </button>
    </main>

Both rules carry long authored comments immediately above them. You will see them when you edit.
Read the one you touch and keep it true.

## THE PROBLEM, FULLY MEASURED — do not re-derive any of this

The hero's four items share one left edge, which a previous wave built deliberately and which must
be KEPT. But the block is not centred in its pane. Measured on the capture at 1440px wide:

- Ink bounding box: left margin 480px, right margin 545px. So the ink spans x480..x895, width 415.
- The asymmetry is 545 - 480 = 65px, which is the number the run record calls "65px off-centre".
  Note precisely what it is: that is MARGIN ASYMMETRY, so the actual centre DISPLACEMENT is half
  of it, 32.5px. Both describe the same defect; use the right one in your arithmetic.
- Where 480 comes from: the pane content box is 1440 - 32 - 32 = 1376. The single grid track is
  480px wide, and justify-content: center puts it at 32 + (1376 - 480) / 2 = 480. Items then hug
  its left edge because of justify-items: start.
- WHY THE TRACK IS 480. A "max-content" track takes the largest max-content CONTRIBUTION among its
  items. For .welcome-hint that contribution is min(its max-width, its text's max-content width).
  Its max-width is 480px and the unwrapped sentence is about 820px, so the contribution is 480px.
  The hint is the widest item, so the track is 480px.
- The hint only PAINTS about 410px, because text-wrap: balance breaks it at its own comma into two
  lines of about 410px and about 403px.
- TARGET: for the ink to be centred, its left margin must be (1440 - 415) / 2 = 512.5. That is the
  x512 the baseline measured, and it is your acceptance number. Achieving it requires the TRACK to
  be about 415px instead of 480px.

## THE CONSTRAINT THAT MAKES THIS NON-OBVIOUS — read carefully, it is the crux

You may NOT simply lower max-width to about 415px, and the reason is authored in the file rather
than arbitrary. That 480px is a deliberate TOLERANCE BAND, not a measure: the balanced pair needs
about 410px and a single line needs about 820px, and 480 "sits well clear of both bounds on
purpose, so a font metric several percent off these estimates cannot push the wrap to neither one
line nor three." Spend that band and the deck becomes fragile — at the 640px minimum window the
line gets a 576px field, and a three-line wrap would eat about 27.6px of a 61.7px height reserve.
A driver also pins the hint's 480px measure AND that it paints exactly TWO line boxes.

So: the 65px of empty track IS that tolerance band. You must remove the asymmetry WITHOUT spending
the tolerance and WITHOUT changing max-width: 480px.

Routes already reasoned through and rejected, so you do not spend your budget on them:
- min-content track: resolves to the longest WORD. Far too narrow.
- fit-content(480px) or auto track: both resolve through the same 480px contribution. No change.
- Removing max-width: track becomes the roughly 820px unwrapped sentence. Worse.
- A hard track width like 415px: the hint would then wrap inside 415px, which is BELOW the
  tolerance the 480 exists to provide, so a font a few percent wide flips it to three lines. This
  is the fragility the band was written to prevent, so it is not acceptable.
- Centring the items instead: discards the shared left edge a previous wave built. Forbidden.

## THE ROUTE THAT LOOKS VIABLE — verify it yourself, then implement or reject it

A grid item's contribution to track sizing is its MARGIN BOX, not its content box. So a NEGATIVE
right margin on .welcome-hint lowers its contribution while leaving its content box, and therefore
its wrapping and its tolerance, completely untouched:

  contribution = 480 + (negative margin) ; content box for wrapping = still 480

Set the negative margin to about -65px and the contribution becomes about 415px, the track becomes
about 415px, the track centres at 32 + (1376 - 415) / 2 = 512.5, every item still hugs one shared
left edge, and the hint still wraps at 480px with its full tolerance intact. The hint's box
overflows the track's right edge by about 65px, but that region is EMPTY — the ink is only 410px —
so nothing paints there and nothing is clipped, since .welcome does not clip.

VERIFY THIS CLAIM BEFORE YOU RELY ON IT. Confirm that a negative margin really does reduce a grid
item's max-content contribution rather than being ignored or clamped, and confirm nothing gets
clipped or overlaps. If it does not hold, say so and fall back to refusing (see below).

If you take this route, express the magnitude in a FONT-RELATIVE unit rather than a raw pixel
where you honestly can, so it scales with the same font metric that sets the 410px, and state the
conversion arithmetic. If a font-relative form cannot be justified, use px and say why, and state
plainly what happens to the centring when the font metric moves.

## REFUSAL IS A FIRST-CLASS OUTCOME

If you conclude the gap is not buildable in a form that keeps all of: the shared left edge, the
480px cap, the two line boxes, the wrap tolerance, and font-robustness — then RETURN "GAP REFUSED"
with the numbers, and state exactly which pair of requirements cannot both hold and what the owner
would have to decide. This run has already refused three critic gaps on measurement and that is
counted as a good outcome, not a failure. Do NOT invent a change to look productive, and do NOT
hard-code a fragile pixel width while calling it a fix.

## HARD TRAPS

- Do NOT change max-width: 480px. Do NOT make the hint paint other than TWO line boxes.
- Do NOT change the words of any user-visible string, and NO EM DASHES anywhere in src/.
  In particular the button label "Pick a project folder" is pinned by FORTY drivers.
- Do NOT touch .welcome-title / the headline: a driver pins its -0.02em tracking, its font stack
  naming the Display master first, that master resolving on that element, and its 57.5px box.
- Do NOT change the hero's VERTICAL placement or raise it as a problem. It is authored and was
  measured as predicted: 67px top margin at the minimum window, 242px at default.
- Do NOT revert to align-items / text-align center anywhere.
- The identity mark is solid by design, no glyph.
- A 760px column and a 96px mark are both refuted by the 640px minimum window and a 69.71px
  headroom budget. Do not build either.

## D3 — stylesheet pins are literal text and brittle
- NO closing brace may appear inside any comment anywhere in src/renderer/src/styles/. This is the
  easiest way to red the gate. Write your comment with no braces of either kind.
- ".bubble {" must remain the FIRST literal occurrence of that string in chat.css. Do not
  introduce that string.
- ".bubble" and ".message-input" stay ungrouped. Do not add a backdrop-filter, a scrollbar rule,
  or a box-shadow. Do not reorder any @import.
- Only font-weights 400 and 600. No "em" font-size, no new literal px font-size. Any size must
  land within half a pixel of 15 * 1.15^k for whole k.

## D4 — any CSS change owes a driver pin that EXECUTES
jsdom loads no CSS, so an unknown var() resolves silently to nothing. Given facts: one driver pins
the hint's 480px measure and its two line boxes; another pins the hero's internal intervals at
8 plus or minus 0.75px. State which existing driver measures your change, and state honestly
whether anything pins the thing you actually changed. If nothing does, declare it as an unpaid D4
debt and name where the pin belongs. Reason from the given facts; do not open a driver.

## WHAT GOOD LOOKS LIKE
One declaration if possible. Update any authored comment your change falsifies — leaving false
evidence for the next reader is itself a defect. Write at the density of the comments around you:
plain language, the arithmetic, and why the rejected alternatives were rejected.`

const r = await agent(prompt, { label: 'build:Welcome(v3)', phase: 'Build', schema: REPORT })
return r
