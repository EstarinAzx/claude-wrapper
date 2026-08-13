# Wave 6 builder reports

## Titlebar (titlebar.css)

THE CHANGE — one declaration

`src/renderer/src/styles/titlebar.css`, rule `.titlebar-left` (line 51): `gap: 7px` → `gap: 4px`.

Nothing else touched. `.app-name + *`'s 9px supplement, the shared pill shell, `.logo-mark`'s 14px inset and the mark itself are all untouched.

THE REFUTATION FIRST — the ask is not reachable in this file, and here is the sum

The critic asks for the group to end 12-16px before x247, i.e. at x235 or x231. Break 276 into what is actually spendable:

| component | px | spendable? |
|---|---|---|
| mark left inset | 14 | no — fence 4 |
| mark box | 22 | no — mark thread closed |
| app name text | 96 | no — fence 3 |
| "Wisped" + "Bypass" glyph runs | 38 + 36 = 74 | no — fence 3 |
| pill borders, 1px x 2 sides x 2 pills | 4 | no, not without losing the shell |
| **untouchable subtotal** | **210** | |
| pill horizontal padding, 9 x 2 sides x 2 pills | 36 | at its geometric floor, see below |
| three inter-item gaps 7 / 16 / 7 | 30 | yes, down to ~11 |

The pill padding is not free budget. `--r-pill` resolves to a 999px round (composer.css's own note records that 999 is clamped to half the box). Pill box height is 1 + 2 + (11 x 1.3 = 14.3) + 2 + 1 = **20.3px**, so each end cap is a semicircle of radius **10.15px**. The convention for a fully-round pill is horizontal padding >= cap radius, so the label's leading edge sits at or right of the cap's centre line. 9 is already **1.15px under** that floor. It is the tightest end the shell has, not slack.

So the arithmetic, honestly:

- To reach the bare divider at x247 needs **-29**. Gaps driven to the tightest state the file's own ratio precedent allows (tick 3, break 5 — a 1.67x crossing, just over the 1.63x this file records as "enough" and clear of the 1.3x it records as "far too weak") gives **-19 → x257**. The remaining **-10** must come out of pill padding: 10/4 = **2.5px per side, 9 → 6.5**, a 28% cut to a shell already under its cap radius.
- To reach the critic's x235 needs **-41**. Gaps at that same floor give -19; the remaining **-22** is **5.5px per side, 9 → 3.5** — a 61% cut, putting the label 6.65px inside a 10.15px cap.

Neither is a spacing tightening; both are a different pill. And because the shell is shared with `.model-pill` in the composer (fence 1), I would have to do it through a duplicate scoped rule, which makes the titlebar pills a visibly different shape from the composer's pill — a worse defect than the 29px overrun, and one another critic is grading this wave.

**Even at literally zero gaps the group ends at x246** — 1px inside the divider, 11px short of the ask, with mark, wordmark and both pills in one glued run. The critic's number does not exist inside this file.

WHY 4, DERIVED

The single `gap` does not paint as one interval. The mark→name tick is flat on both sides (rounded square against a text run's side bearings), so it paints its declared value. The pill→pill tick sits between two semicircular caps of radius 10.15 that recede away from the midline; averaged over the pill height the mean recession per cap is r(1 - pi/4) = 0.2146 x 10.15 = **2.18px**, so that channel paints **declared + 4.36px**. At `gap: 7` the pill pair was already painting a ~11.4px mean channel — the loosest interval in the group while nominally being its tightest-tied one.

4 is the value where the pill pair's mean optical channel falls to 8.36, below the 11.4 it was carrying and near the 7 the group's flat reference tick used to hold, while the lockup tick — the group's only interval with no optical give-back — stays a real 4px separation between a 22px filled block and a 13px wordmark rather than a kern. It is also the direction the file's own group-break note already argues for: "Both sides of the break tighten, which is the point."

The break survives comfortably. 13 against 4 is **3.25x** nominal (up from 2.29x), and **1.82x** even measured optically (15.18 vs 8.36, one cap receding on the pill side of the break). Both clear the 1.63x this file has accepted; neither is near the 1.3x it rejected.

Fence 2 holds in the safe direction: the floor falls 276 → **267**, so at 640 Welcome the slack against the 279.25 equal share grows from 3.25px to 12.25px and neither flank is frozen. At 640 with a project open the slot goes 640 - 267 - 233 = **140css**, and the 60-char fixture at 451css still truncates.

I did not spend the gaps down to their 11px precedent floor. Since no gap value reaches the target, riding the accepted minimum for six more pixels buys a worse-looking group and does not change the verdict.

PREDICTION IN RENDERED PIXELS

- Left group right edge: **x276 → x267**, a **-9.0px** move. Still **20px past** the x247 divider — the gap is reduced by 31%, not closed.
- Box edges at zoom 1: mark **14..36** (unchanged), app name **40..136**, backend pill **149..207**, permission pill **211..267**.
- Session title midpoint delta: **0.0px** in every state gui-136 drives. Neither flank was at its floor before and neither is now; the floor only moved further away from binding.
- Title slot at 640 with a project open: **131css → 140css**; fixture still truncates.
- Pill box heights unchanged at 20.3px; `.model-pill` in the composer unchanged in every dimension.

THE ONLY MOVE THAT REACHES — and it is outside my file

Take the permission pill out of the left flank. The group then ends at the backend pill's right edge: with this change landed, **x207 — 40px clear of the divider**, well past the critic's 12-16px ask, and the left floor drops to 207 (further into fence 2's safe direction). That is a JSX change in `Titlebar.tsx`, outside my one file, so I stopped. It is the same relocation a previous critic proposed and it is on the record.

AUTHORED COMMENT CLAIMS MY CHANGE FALSIFIES — plain prose, not rewritten

1. `.titlebar-left`'s note (around lines 45-50) says the gap reads 7 rather than 10 because the break is funded out of it, `3 x 7 + 9 = 30 = 3 x 10`, so the floor "is the same 276 it was before the break existed." That budget-neutrality is now deliberately broken. The arithmetic is `3 x 4 + 9 = 21`, and the floor is 267, not 276. The note's framing that the two edits are "one change" no longer holds either — this wave separates them.
2. The same block's claim that at the floor "the row is full and true centring becomes geometrically impossible" is now a statement about 267, and it is less true than it was: the flank has 12.25px of slack at the binding state instead of 3.25px.
3. The GROUP BREAK note (around lines 86-97) opens "the left group reads 7 / 16 / 7". It now reads **4 / 13 / 4**. Its box-edge table — "mark 14..36, app name 46..142, backend pill 152..210, permission pill 220..276" — is stale for every entry after the mark; the new edges are the ones listed in my prediction above. Its "16 against 7 is 2.29x" is now 13 against 4 = 3.25x.
4. The RE-CUT paragraph (around lines 99-104) is the most falsified. Its whole point is that the floor stays 276 and "the centring mechanism above cannot see this change at all. Flank widths, the slot and the title's midpoint are identical in every state gui-136 drives." The floor moved by 9, the slot at 640-with-project widens 131 → 140, and the mechanism does see the change — favourably. The before/after sum it spells out gains a third line.
5. The gui-136 paragraph (around lines 106-115) states "the margin for error is 3.25px" and "this group's floor is 276", then computes the slot as `640 - 276 - 233 = 131`. All three numbers move: 12.25, 267, 140. Its conclusion — the fixture still truncates — survives, since 451 is nowhere near 140.
6. The "276, NOT the 262" paragraph (around lines 117-123) says 262 is the group's painted extent x14 to x276. The painted extent is now **253** (x14 to x267) and the floor is 267. This paragraph also flags that a block above line 40 says "painting 262css" and that `.session-title`'s band arithmetic uses 262 as the floor — both of those are now stale by a different amount than the paragraph documents. I did not touch any of them.

WHAT I COULD NOT DO INSIDE MY ONE FILE

- Reach the critic's number, or even the bare divider. Shown above with the sum.
- Move the permission pill to the right flank. `Titlebar.tsx`, and it is the only construction that reaches the ask.
- Cut the pill shell's padding or letter-spacing without either touching `.model-pill` (fence 1) or duplicating the shell into a titlebar-only rule that would visibly desynchronise the two pill shapes. I judged that cost higher than the 29px overrun and did not take it.

## Sidebar (rails.css)

`src/renderer/src/styles/rails.css` — one declaration changed, at the rule on line 664.

## THE CHANGE

```css
.session-row-btn,
.agent-row-btn,
.command-row-btn {
  border-radius: 8px;      /* was: var(--r-bubble) */
}
```

Answer chosen: **option 2, move to 8** — as a bare literal in `rails.css`. `tokens.css` untouched, `--radius-bubble` still 16px, `chat.css:168` unaffected.

## WHY 8, DERIVED

**1. The 0.217 ratio law was refuted by the propagation that tested it.** It is a two-point fit through `.session-more` (8/36.8 = 0.217) and the user bubble (16/72 = 0.222) — two boxes at opposite ends of the scale with *different radii*. Any two points fit a line. The token now sits on three boxes, and the law's own prediction is 74×0.217 = **16.1**, 65×0.217 = **14.1**, 49×0.217 = **10.6**. One declaration cannot pay three numbers. A law whose prediction requires three values from one token is not the invariant — it was correct arithmetic on a premise the next wave falsified.

**2. A shared token is sized by its most constrained member, not its largest.** Apply the rail's own measured ratio to the binding box: 49 × 0.217 = 10.6; the bubble's cross-check gives 49 × 0.222 = 10.9. Both land nearer 8 than 16. At 16 the 49px row sits at r/h = **0.327**, two-thirds of the way to a pill — and it is the row type with no mint stripe and no tint, where the outline is the only indicator it has.

**3. The file's own vocabulary voted, four times, and I only had to stop overriding it.** Every other box corner in `rails.css` is 8px (lines 562, 711, 809, 1086); the outliers are a 6px inner (502) and a 50% avatar (997). This rule was the **only** non-8 box corner in the entire rail file, and the token it called is named for the surface the critic named: `--r-bubble`. 8px is this app's structural corner; 16px is its bubble corner; these are rows.

**4. The seam.** `.session-more` is the last child of `.session-groups`, sitting directly under these rows at a hard-coded 8px. The critic arrived from the composition side, and at 16 the rail's last two boxes disagreed at the exact edge where they touch. At 8 that seam disappears.

**Answering the required objection — why accept 0.108, "a value nobody chose":** 0.108 is an *output*, and so is 0.217. Neither was ever an input. The 74px height is not a shape decision — it is `min-height: 2.9em`, a reservation for a second title line most rows never show, so r/h measures the corner against reserved emptiness. What *was* chosen, four times in this file, is 8.

**Option 3 rejected explicitly:** the honest third value is ~11px (49 × 0.22). I rejected it because it is a fourth radius no box in this app wears, it re-opens the `.session-more` seam it was meant to heal, and its straight run on the 49px row (27px) is still worse than 8's (33px). That is the split-the-difference the brief warned against.

**The prior wave licensed this edit.** Its closing paragraph (line 651) reads: *"The value it settles on may yet be 8 rather than 16; what this rule buys either way is that the question is now ONE edit instead of three."* I made that one edit. The grouping it deliberately unified is preserved — one declaration, three row types, no per-row split.

## PREDICTIONS, IN RUN LENGTH (not share, not count)

Every box gains exactly `2(16−8) = 16px` of vertical straight run **per vertical edge**, height-independent — +32px per box.

| box | straight run at 16 | at 8 | change |
|---|---|---|---|
| rail row 74px | 42px | **58px** | +16px, **+38.1%** |
| command row 65px | 33px | **49px** | +16px, +48.5% |
| command row 49px | 17px | **33px** | +16px, **+94.1%** |

**Headline measurable — the mint stripe.** The comment at 606–615 derived that the inset stripe survives only along `height − 2r` of the left edge. Its visible straight length goes **42px → 58px, +38.1%**, and its two 16px tapers become 8px. The selection stripe stops bowing into a crescent and reads as a bar. That is the single most visible pixel of this change and it is the critic's "chat bubble" sentence, directly.

Arc perimeter per box: 100.5px → **50.3px** (per corner, (π/2)r: 25.13 → 12.57).

⚠️ **Expect the border-band pixel COUNT to FALL this time** — the mirror of the +79 seen when the corner grew — while ink weight RISES. A count-based check will again report the opposite of the truth. Measure run length.

## WHAT I DID NOT BUILD

The **padding half of the gap — not built, as instructed**, and confirmed while reading: the rule at 664 carries no padding, the shell at 132 owns `padding: 8px 10px`, and the active rule at 688 sets only `background` and `box-shadow`. There is no padding difference to close. **No vertical value was touched** — the y202 rail compression is intact.

## COMMENTS MY CHANGE FALSIFIES (plain prose — not rewritten)

- **Header, line 576**, "why it is no longer the group's 8px" — it is the group's 8px again.
- **584–592**, the 0.217/0.222 derivation: still computes correctly, no longer describes the file. Its verdict on 0.108, *"Nobody picked that"*, is now contradicted — this wave picked it, on the grounds that a shared token is sized by its shortest member.
- **594–599**, "SO IT TAKES `--r-bubble`": false at the top. The rule no longer calls the token, so the user bubble is once again its **single caller** — which restores exactly the "one caller is indirection rather than a system" condition that paragraph described itself as fixing. Worth a decision from the leg: the token now has one caller again.
- **606–615**, the stripe paragraph: direction inverted, 42 → 58px, and its explicit *"Rejected holding 8px to protect the longer run"* is the rejection this change reverses.
- **617–625**, `.session-delete` keeps 8px: still true, but no longer load-bearing. The clamp argument (16px on a 28px width renders as 14px) was the reason for the exemption; at 8px row and delete agree naturally and the special case stops being special. No edit needed.
- **627–636 and 645–647**, DESIGN.md's "same row shell": becomes *more* true, not less. Rail and dock rows were identical at 8px and are identical at 8px again — the sentence the comment called false is true now.
- **659–661**, nested agent row: the left-corner asymmetry goes back from 3:16 (5.3x) to **3:8 (2.7x)**, the authored ratio. Healed for free, no edit.
- **638–639**, "declared ONCE, here, for all three rows": unchanged and still true. That is the part I preserved.

## NOTES

I used a bare `8px` rather than a local custom property — deliberate, given the jsdom silent-no-op exposure, and it matches the four other 8px literals in this file exactly. If a `--r-row` step is wanted, that is a `tokens.css` decision and was off limits this wave. Nothing else was blocked by the one-file rule.
