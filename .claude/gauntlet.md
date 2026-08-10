---
slug: core-surfaces
bar: .gauntlet/bar/            # linear/ = craft ceiling, identity/ = identity floor
bar_win: >
  Every surface of the running app survives side by side with Linear — none reads
  as the one nobody finished, every empty state is authored copy plus a real
  action rather than a placeholder mark, and one type scale holds across all of
  them — while never drifting off frost-mono-reference.png: near-black, one mint
  accent under 10% of surface, no decorative glass beyond the single named
  exception.
inspect: SCREENSHOT_DIR=<dir> node .claude/skills/run-desktop/inspect.mjs
spec: DESIGN.md (design system, source of truth for the renderer) + PRODUCT.md (purpose, single user, anti-references)
pieces:
  - name: Welcome
    verdict: BAR WINS
    open: true
  - name: Titlebar
    verdict: BAR WINS
    open: true
  - name: Sidebar
    verdict: BAR WINS          # CORRECTED at wave 3: wave 2's YOURS WINS was an instrument
    open: true                 # artifact of the trimmed prompt. See "Wave 3 adjudications" 1.
  - name: Chat
    verdict: BAR WINS
    open: true
  - name: InputBar
    verdict: YOURS WINS        # wave 4, PROVISIONAL — kept open for wave-5 confirmation.
    open: true                 # See "Wave 4 adjudications" 1 for why this one is NOT wave 2's case.
critic: sonnet                 # re-resolved live at wave 2 -> codex/gpt-5.6-sol; RE-RESOLVE every wave
critic_degraded: false
branch: gauntlet/core-surfaces
wave: 4
plateau: 0                     # RESET BY AN ACTUAL ORDINAL MOVE, not by "critics said BETTER".
                               # InputBar BAR WINS -> YOURS WINS. Read owner call 4 before touching this.
max_waves: 12
page: false
stop: false
---

## Where things are

- **This file is the run's memory.** `.claude/relay/gauntlet.md` is only the relay
  machinery; it points here.
- **The tree stays on `gauntlet/core-surfaces`.** The seed commit is on `main` as
  well, so a leg that somehow boots on `main` still finds this file and does not
  re-seed — but `main`'s copy goes stale the moment wave 1 commits. **The live
  copy is the one on the branch.** If you are on `main` and `wave:` reads 0 while
  `git log gauntlet/core-surfaces` shows waves, you are reading the stale copy.

## Seed verification — what was checked rather than assumed

- `inspect:` was **run once at seed**, not trusted from the record: `PASS`, all
  seven files written, `FRAME {"width":1440,"height":900,"zoom":1}`. The
  instrument works on this machine at `21ee444`.
- `critic:` was resolved from live `wisp routing`, first non-Anthropic family.
  It landed on **`sonnet` -> `codex/gpt-5.6-sol`**, which is **not** what the
  vibe run used (`sonnet` -> `opencode-go/kimi-k3` on 2026-08-10). The routes
  moved in under a day. **Re-resolve every wave; never carry this value forward.**

## Piece -> capture -> reference map

`inspect:` writes seven files. Each piece gets its own surface file **plus** the
whole-window frame it lives in — a surface clipped to its own bounding box cannot
answer a composition question, and every `.gauntlet/bar/linear/` reference is a
whole-page frame.

| Piece | Surface capture | Window frame | Bar reference |
|---|---|---|---|
| Welcome | `welcome.png` | `window-welcome.png` | `linear/linear-method.png` |
| Titlebar | `titlebar.png` | `window-session.png` | `linear/linear-features.png` |
| Sidebar | `sidebar.png` | `window-session.png` | `linear/linear-home-hero.png` |
| Chat | `chat.png` | `window-session.png` | `linear/linear-changelog.png` |
| InputBar | `input-bar.png` | `window-session.png` | `linear/linear-home-product.png` |

`identity/frost-mono-reference.png` goes to **every** critic — it is the identity
floor, not one piece's reference. `identity/current-welcome-2026-08-10.png` is the
before-shot; judged against, never copied.

**A missing file means the run failed** — read its output rather than judging the
surface. A green run asserts all seven; a failing one prints `CAPTURED n/7`.

## Binding constraints — hand these to every builder and every critic

Assembled at seed from `.gauntlet/bar/README.md` and `.claude/vibe.md` so no leg
has to reconstruct them. **They are not up for re-litigation by a wave.**

**For the critic:**

1. **Colour, translucency and material are OUT OF SCOPE for any verdict.** The
   wash is `oklch(0.12 0.008 210 / 0.64)`, composited by Windows over OS acrylic,
   and no driver can see a DWM backdrop. The flat ground in every capture is an
   **instrument artifact, not a defect**. Judge composition, layout, type,
   hierarchy, spacing and state. This repo has read an artifact as a finding nine
   times; this is the tenth waiting to happen.
2. **The identity mark is SOLID BY DESIGN — no glyph, ever.** Verified three ways
   (`titlebar.css:26`, `chat.css:199` are bare `background: var(--mint)`; both
   elements self-closing and `aria-hidden="true"`; DESIGN.md prescribes size,
   radius and fill but never content). A wave may question the fill's **depth** —
   that is a different question and is fair game.
3. **No defect list is supplied, on purpose.** Naming gaps hands the critic the
   verdict it exists to reach independently.
4. Return exactly one of `BAR WINS` / `TOO CLOSE` / `YOURS WINS`, plus **one**
   biggest remaining gap in a sentence. `SPEC BREAK <what>` if the piece violates
   `spec:`.
4b. **DESIGN.md line 59 is STALE where it names the titlebar's right side, and it
   is stale in the spec's own favour — do not re-report it.** It says *"Right: the
   Agents-dock toggle, then a hairline separator, then min / max / close"*, which
   was true when Agents was the only dock. Three panel toggles ship today —
   Commands, Appearance, Agents (`Titlebar.tsx:87`, `:106`, `:126`) — and
   DESIGN.md's own line 61 already calls Appearance the *"third right-slot
   panel"*, so the document contradicts itself two lines down. Wave 1's Titlebar
   critic returned a `SPEC BREAK` on this and it was refused against source. The
   **count** of pre-separator controls is agreed and is not a break; how well that
   group is composed is still fair game and is in fact wave 1's named gap.

**For the builder:**

5. **D3 — the stylesheet pins are literal-text and brittle.** A wave MAY edit
   `src/renderer/src/styles/`, but: three tests scan the **whole** `styles/`
   directory; no comment may contain a closing brace (even *naming* the scrollbar
   pseudo-element in a comment trips the scan); no scrollbar rule may be
   component-scoped; `.bubble` and `.message-input` stay ungrouped; **`.bubble {`
   must stay the FIRST literal match of that string in `chat.css`**; **exactly ONE
   `backdrop-filter` in all of `styles/`** and `gui-98` criterion 5 is *positive*
   — never soften it to clear a red; the `@import` order in `styles.css` IS the
   cascade, so add rules inside a file and never reorder; `theme.test.ts` allows
   hue and accent-chroma movement but **no lightness and no alpha anywhere**.
   Token names are `--fs-micro` and `--danger-text`.
6. **D4 — any CSS change owes a driver pin.** jsdom loads no CSS, so an unknown
   `var()` resolves silently to nothing and every raw-text pin still passes. #129
   shipped two nonexistent tokens past all of them. An existing `gui-*.mjs` that
   covers the change discharges this; a new driver is not required.
7. **#125's glass exception is ONE named pane and is explicitly not a precedent.**
   Any warrant used to add `backdrop-filter` or a second glass layer to these five
   surfaces has the warrant backwards.
8. Close **one** named gap. Do not redesign, do not touch other pieces.

**For the wave:**

9. **D7 — the gate is green on all three: `npm run typecheck`, `npm test`,
   `npm run build`.**
10. **A wave must be GREEN before it commits.** Owner-call default taken
    2026-08-10, reversible, recorded in `.claude/vibe.md` `## Needs you`: a red
    wave **reverts its piece and records the gap** rather than committing red.
11. **D6 — no pushing to `origin` on a leg's own initiative.** Land locally and
    say so.

## Verdicts
| wave | piece | verdict | biggest gap |
|---|---|---|---|
| 1 | Welcome | BAR WINS | Weak editorial hierarchy: enlarge the headline and widen its scale contrast against the supporting line, and place the stack in a deliberately proportioned field instead of a small generic cluster at dead centre. |
| 1 | Titlebar | BAR WINS | The three pre-separator glyphs are optically mismatched and read as one run with the window controls: standardise them into one icon set in consistent 28x28 housings, and tighten spacing so the app-action group separates from min/max/close. |
| 1 | Sidebar | BAR WINS | Below the single session row the rail is ~70% empty with no bottom-anchored content, and "None running here" is copy with no paired action: give the rail an authored empty state with a real action rather than a bare line. |
| 1 | Chat | BAR WINS | The transcript reads as one dense uniformly emphatic run: set assistant prose in a calmer regular weight with more leading, and give messages and tool cards a more deliberate vertical rhythm. |
| 1 | InputBar | BAR WINS | **SPEC BREAK (confirmed).** The disclaimer is not centred under the input because the Effort control and model pill share its `space-between` row, and "Default" appears twice in that row: split the disclaimer onto its own centred line and group the controls into their own strip. |
| 2 | Welcome | BAR WINS | The compact hero still sits too close to the mathematical centre of the 1440x900 field; lift the entire stack roughly 60px into the upper-middle so the large lower reserve reads as deliberate composition rather than leftover space. |
| 2 | Titlebar | BAR WINS | Replace the slash, branch and split-disc set with three optically matched 16px **outline** glyphs using one stroke weight, one bounding box and one visual centre, so the app-action cluster reads as a deliberate icon family rather than assorted symbols. |
| 2 | Sidebar | **YOURS WINS** (provisional) | The background-empty explanation still relies on an unlabelled circular-arrow for its action: add a visible inline "Refresh" action beside the copy to remove the remaining icon inference. |
| 2 | Chat | BAR WINS | *(as returned)* "The assistant prose is consistently too heavy for sustained reading; render ordinary transcript text at the specified regular 400 weight and reserve 600 for labels or real emphasis." **REFUTED AGAINST SOURCE — see adjudication 1. Do not hand this to a wave-3 builder as written.** |
| 2 | InputBar | BAR WINS | Recompose the right-hand settings strip as two visually matching compact controls with equal label/value structure, because the bare Effort "Default" and the outlined Model "Default" make the area beneath the otherwise resolved pill look improvised. |

| 3 | Welcome | BAR WINS | Increase the whole stack's SCALE — title, supporting line and button — so it occupies enough width and visual mass to carry the desktop field instead of reading as a small utility cluster placed on a canvas. |
| 3 | Titlebar | BAR WINS | The three toggles are now stroke-consistent but **semantically** disconnected: give slash / connected-node / split-circle a shared legible panel-outline metaphor so they read as one panel group rather than three unrelated utilities. |
| 3 | Sidebar | BAR WINS | *(verdict CORRECTED down from wave 2 — adjudication 1)* Consolidate or explicitly differentiate the THREE reload affordances — the arrow beside "SESSIONS", the arrow beside "Background sessions", and the new labelled "Refresh" — whose concentration in the rail's first 110px makes the action hierarchy ambiguous. |
| 3 | Chat | BAR WINS | Reduce the apparent optical weight of assistant paragraphs so they read **distinctly lighter than the 600-weight "Read"/"Edit" tool labels**. *(Second independent raising of the heavy-prose perception — but note the NEW mechanism, adjudication 2.)* |
| 3 | InputBar | BAR WINS | Pull the Effort/Model strip closer to the composer so it reads as attached metadata rather than a control island floating between the input and the disclaimer. |

| 4 | Welcome | BAR WINS | Increase the heading to roughly 42–44px, the supporting line to 17–18px, and the button to about 52–56px high so the stack carries substantially more visual mass across the desktop field. **COLLIDES WITH THE MEASURED HEIGHT CEILING — see adjudication 5.** |
| 4 | Titlebar | BAR WINS | Redraw the three panel toggles around one repeated panel-frame outline and place each in the same 28px control box so they read as a deliberate group rather than three unrelated symbols before the window controls. *(Second independent raising of the panel-outline metaphor. The builder's refusal is DISPUTED — adjudication 2.)* |
| 4 | Sidebar | BAR WINS | Establish clearer vertical grouping by adding roughly 8–12px between the background-state, filter, scope, and session-list sections instead of compressing every hierarchy layer into the rail's first 280px above a vast unused area. |
| 4 | Chat | BAR WINS | Reduce the paragraph-to-card gap from about 29px to 12–16px and increase completed-turn separation to 32–40px so each tool card clearly groups with the assistant message that produced it. *(NEW axis — the weight thread is CLOSED as an owner call, adjudication 3.)* |
| 4 | InputBar | **YOURS WINS** (provisional) | Promote Effort, Model, and both Default values into one consistent 13px UI row, because their current microtype is the only element that loses hierarchy beside the 15px composer. |

## Wave 4 adjudications — two refusals, one of them overturned, and a three-wave argument settled

Wave 4 raised **zero** `SPEC BREAK`s (fourth wave running). Three builders edited; **two returned
measured refusals**, and the refusals produced more than the edits did.

1. **InputBar's `YOURS WINS` is PROVISIONAL and the piece stays `open: true` — but for a DIFFERENT
   reason than wave 2's, and the distinction matters.** Wave 2's Sidebar `YOURS WINS` was invalid
   because its critic **died on context length and re-ran a trimmed prompt** — three images instead
   of five plus an extra pre-refusal — so it was not the same instrument as the four that said
   `BAR WINS`. **That defect is absent here.** This critic ran the identical standardised payload as
   the other four, on attempt 1, and four of them returned `BAR WINS` on it, so the instrument
   discriminated *within* the wave.
   It is kept open on **cost asymmetry alone**: wrongly closing freezes a possibly-inflated
   measurement *and* retires the only test that could catch it, while wrongly keeping it open costs
   two agents. The run has already paid that bill once. **Wave 5 must re-run the InputBar critic on
   the identical standard payload. Confirmed → close it then. Corrected down → the run learns the
   same thing twice and that is worth knowing.**
   Evidence it saw real pixels: it measured the strip at *"about 4 px below the composer"* — the
   builder had authored `margin-top: -6px` against a 10px column gap, i.e. **exactly 4px** — and its
   whole-window coordinates are arithmetically consistent with its surface coordinates
   (254 + 213 = 467, 768 + 12 ≈ 781), so it cross-referenced two images rather than describing one.

2. **THE TITLEBAR REFUSAL IS DISPUTED, AND THE COMMENT HAS BEEN REPAIRED TO SAY SO.** The builder
   took the brief's measured-refusal option and recorded arithmetic concluding the panel-outline
   metaphor does not fit a 16 grid. The smoothing pass re-derived that block independently and got
   **the opposite verdict for the most generous candidate**. Adjudicated by re-deriving it a third
   time:
   - Interior clear inside a frame drawn to the bleed is **12.1**. The agent cluster's vertical floor
     is **9.1** of path extent, which is **10.4** once its own 1.3 stroke is inked. That leaves
     **1.7 of total clearance — 0.85 per side.**
   - The builder demanded 0.9 per side and failed by **0.05**. The smoothing pass allowed ~0.35 and
     passed. **Neither convention is stated anywhere.**
   So the frame **fits if and only if 0.85 per side is acceptable breathing room at 16 units** — a
   judgement about what reads as cramped, not a measurement. The comment opened with *"MEASURED
   NEGATIVE, so nobody re-derives it"*, which is exactly the sentence that would have let wave 5 skip
   the option on false authority. It now states the clearance budget explicitly and marks the
   conclusion as disputed. **The bracket and bare-rule verdicts survive re-derivation; only their
   intermediate numbers were off** (bracket 7.2 → 8.05, still under the 8.34 floor; connector 3.01 →
   2.13 or 3.17 depending on which extent 8.9 measures).
   **Wave 5's Titlebar brief is now sharp and bounded for the first time in three waves:** draw the
   full frame at 0.85 clearance per side and look at it, or refuse on that specific number. Do not
   re-argue the arithmetic — it has been derived three times.

3. **THE CHAT WEIGHT PERCEPTION IS SETTLED AFTER THREE WAVES, AND IT IS AN OWNER CALL, NOT A
   BUILDER TASK.** Waves 2 and 3 both raised it; wave 2 refuted the mechanism, wave 3 named a second
   element and reopened it. Wave 4 measured it and the answer is neither side's:
   - The builder measured rendered stem widths in Electron's own Chromium with the shipped font
     stack: prose (15px/400) **1.278px**, label (13px/600) **1.544px**, **ratio 1.208**. The app's own
     definition of one weight step — 400→600 at constant 15px — measures **1.391**. **The shipped
     pair delivers 53% of one of this app's own weight steps.**
   - **The mechanism nobody had found in three waves: the label is two rungs SMALLER (13 vs 15), and
     the size drop eats most of the weight difference.** The CSS says 600-vs-400 and the pixels do not.
   - **The wave-4 critic, from pixels alone and after its verdict was sealed, independently reported
     the labels look "about the SAME weight" as the prose.** Three instruments now agree.
   - **Both ends are blocked.** `gui-96.mjs:308` greps all of `styles/` for `font-weight: 500` and
     requires zero hits (ticket #96 existed to conform weights to DESIGN.md's `{400, 600}`), and 700
     is off that same documented set. Verified first-hand.
   - **A trap worth keeping: 500 renders byte-identically to 600 on this machine** (stem
     1.543627450980392 for both) because the family snaps to named instances. Anyone who "fixes" this
     with 500 changes **zero pixels** while believing otherwise.
   **The honest resolution is an owner call on DESIGN.md line 54** — add a lighter rung for body prose
   (ratio → 1.525), or restrike the label size, or accept 1.208 as the house pair. **The wave-4 critic
   independently moved Chat's gap OFF weight and onto proximity/grouping, which is actionable and
   unblocked**, so wave 5 has real work here regardless.

4. **THE LEG'S OWN BRIEF CONTAINED A FACTUAL ERROR AND THE BUILDER CAUGHT IT.** This leg told the
   Chat builder *"closing it from the label end is fully legal and has never been tried"*, reasoning
   from wave 3's adjudication that `tool-card.css` is Chat's own file. That was **wrong** — `gui-96`
   bans 500 and DESIGN.md fixes the set at `{400, 600}`, so the label end was never open. The builder
   refused the instruction with evidence rather than complying with it. Recorded because the run's
   value depends on agents correcting the layer above them, and this is the third time it has happened
   (wave 2's builder predicting its critic, wave 3's smoothing pass catching the leg's own comment).

5. **WELCOME'S NEXT GAP COLLIDES WITH ITS OWN MEASURED CEILING, AND THAT IS NEW.** The wave-4 critic
   asks for a **42–44px** heading. The height budget in `chat.css` — re-derived twice this wave — says
   a fourth ladder step (40.2px) leaves **10px** of headroom and a fifth (46.3px) leaves **2px**,
   against a 152px bottom reserve that is wave 2's own closed gap. **So the critic's ask is not
   reachable without re-deciding the reserve**, which is a previous wave's deliberate composition.
   This is the same shape as owner call 5: a one-gap-per-wave loop walking a surface to a place where
   the next legal move requires undoing an earlier one. Wave 5's Welcome builder must be told the
   ceiling up front, or it will spend itself discovering it.

6. **THE ADDITION SLOT WAS PROPOSED FOR THE FIRST TIME IN A WAY THAT CLEARS THE DOCKS OBJECTION — AND
   IS STILL REFUSED, WHICH IS NOW A PATTERN WORTH ESCALATING.** The smoothing pass proposed
   photographing **Welcome at the minimum window** (a second *state* of an existing surface, not a
   sixth surface), on the grounds that the entire Welcome argument is a **derived** height budget now
   down to 16px of headroom, that nothing has ever photographed the app at the size that budget is
   about, and that a one-pixel error at its root just survived the wave's own review. **It clears the
   instrument objection that killed the docks** — `inspect.mjs` can already take the shot, same
   selector, same stage, one extra `setBounds`.
   **Refused anyway, on the one ground that also killed the docks: wave 2 barred extending the
   instrument mid-run**, because changing the measuring apparatus between waves is what makes the
   plateau signal meaningless, and wave 1 established that a capture set which no longer matches its
   verdicts is a corrupted record. **This wants a ticket.**
   **But three consecutive smoothing passes have now proposed an addition and all three were refused
   on instrument stability. That is a preset-level finding: the one-addition-slot is dead machinery
   under a run that also forbids touching the instrument.** See owner call 11.

## Wave 3 adjudications — the provisional verdict was tested and it failed

Wave 3 raised **zero** `SPEC BREAK`s (third wave running). It settled the two things
wave 2 explicitly deferred to it, and both settled *against* the comfortable answer.

1. **Sidebar's provisional `YOURS WINS` WAS AN INSTRUMENT ARTIFACT. Re-run on the
   standardised prompt it returns `BAR WINS`, and the piece's recorded verdict is
   corrected down.** This is the exact test wave 2 designed: its Sidebar verdict came
   from a trimmed retry (three images instead of five, plus one pre-refusal the other
   four critics never got) after the full prompt died on context length, so what was
   unproven was not its honesty but its **comparability**. Wave 3 gave all five critics
   an identical three-image payload; on that instrument Sidebar sits where the other
   four sit.
   **The correction is worth more than the verdict was.** Had the piece been closed at
   wave 2 as the preset's letter directs, the run would have frozen an inflated
   measurement *and* retired the only test capable of catching it — and every later
   plateau reading would have been computed against a phantom. The deviation from the
   preset paid for itself in exactly one wave.
   **Note what this does NOT say.** The wave-2 Sidebar critic saw real pixels and
   reasoned honestly; it was the *scale* that was not shared. A lighter prompt produced
   a kinder verdict, which is a fact about prompts, not about that agent.

2. **Chat's heavy-prose perception was raised a SECOND time, independently — and the
   new phrasing names a lever wave 2 ruled out.** Wave 2 refuted the mechanism (it
   asked for 400 weight that already ships) and concluded the only remaining lever was
   colour, which binding constraint 1 puts out of scope, making a repeat an owner call.
   The repeat has arrived, but it is **not the same claim**: wave 3 asks for the prose
   to read *"distinctly lighter than the 600-weight Read and Edit tool labels"*. That
   is a **relative** claim about a contrast between two elements, and it names the
   second element. Wave 2 only ever considered moving the prose down; this points at
   the tool labels moving too, and `tool-card.css` is Chat's own file, not colour, and
   not out of scope.
   **So a wave-4 Chat builder may have a legal move after all**, which wave 2's
   adjudication had concluded it would not. It is still worth an owner's eye — two
   independent critics reporting the same perception is the signal wave 2 said to
   escalate on — but do not hand wave 4 an owner call as though the analysis were
   closed. The honest brief is the relative one: widen the gap between body and tool
   label, from whichever end does not require colour.
   Evidence this critic actually read the transcript rather than pattern-matching: it
   named the two specific paragraphs it was judging (*"Flipping the pill discards the
   engine…"*, *"Rebuilding lazily…"*) and the two labels it compared them against.

3. **The one addition slot is STILL UNSPENT, and this time the smoothing pass refused
   it itself.** It considered re-proposing the three right-hand docks, found nothing new
   that clears the instrument refusal, and then made the sharper argument *against* its
   own wave-2 predecessor: the strongest evidence for a dock piece was that
   cross-surface drift goes uncaught, and this wave the smoothing pass **caught exactly
   that class of drift from source, with no capture of either half** (finding 2 in the
   log below). That is evidence the existing decomposition plus a whole-app pass already
   reaches this class — not evidence a sixth piece is missing.
   It also declined to propose *cross-surface composition* as a piece, on the grounds
   that no single builder could act on such a verdict under binding constraint 8. An
   agent reasoning correctly about the loop's own mechanics, and declining a slot it was
   invited to spend, is the smoothing pass at its best.

## Wave 1 adjudications — three SPEC BREAKs raised, one survived

The preset makes `SPEC BREAK` consequential (it reverts a piece's build regardless
of how it looks), so all three were checked against source rather than taken.
Recorded here because two of them will be re-raised by any future critic that
reads the same pixels.

1. **InputBar — CONFIRMED, and it is the one real one.** DESIGN.md line 67 asks
   for a *"centered `--fs-micro` `--text-faint` line under the input"*.
   `.footer-line` does carry `text-align: center` (`composer.css:241`), but it is
   a flex child of `.input-foot` alongside the Effort control and the model pill,
   and `composer.css:250` says so in its own words: *"The footer is space-between
   with the disclaimer left and the model pill right."* #124 put the effort
   control in that row and knocked the disclaimer off centre. Nothing was built
   this wave, so there was no build to revert; it carries into wave 2 as the
   InputBar gap.
2. **Titlebar — REFUSED against source.** Stale spec, not a defect. See binding
   constraint 4b above.
3. **Chat — REFUSED as a piece defect, but it was a real defect in the
   INSTRUMENT.** The em dashes the critic caught were in the seeded capture
   fixture (`inspect.mjs:137`, `:146`), not in anything the renderer ships, and a
   critic reading a screenshot cannot tell those apart. Fixed at the fixture, so
   the finding stays available for real copy defects instead of being spent on
   test data every wave. **Wave 1's captures were deliberately NOT re-taken** —
   they are the images these five verdicts were formed against, and a capture set
   that no longer matches its verdicts is a corrupted record. Wave 2 is the first
   wave to photograph the corrected fixture.

## Wave 2 adjudications — one gap refuted, one verdict flagged, one proposal refused

Wave 2 raised **zero** `SPEC BREAK`s. It raised three other things that a later
leg would otherwise re-spend a wave on.

1. **Chat's named gap is REFUTED AGAINST SOURCE. It is recorded in `## Verdicts`
   as returned, because that table is append-only and is the run's real memory,
   but it must not be handed to a wave-3 builder as written.** The critic asked to
   *"render ordinary transcript text at the specified regular 400 weight and
   reserve 600 for labels or real emphasis"*. That is already exactly what ships:
   `.assistant-body` is `font-weight: 400; line-height: 1.6` (`chat.css:181-182`,
   and this wave's builder made the 400 explicit rather than inherited), and the
   only three `font-weight: 600` rules in `markdown.css` are headings (`:127`),
   `strong` (`:146`) and table headers (`:180`) — precisely the "labels or real
   emphasis" the critic asked for. The captured transcript contains **no heading,
   no bold and no table**, so every word the critic judged renders at 400. It
   looked at 400 and called it heavy.
   **The mechanism is refuted; the perception is not.** With weight and leading
   both already at the spec's own values and the measure already cut to 75% this
   wave (which the same critic praised), the only remaining lever on "reads heavy"
   is colour/contrast — which binding constraint 1 puts **out of scope for every
   verdict in this run**. So a wave-3 Chat builder has no legal move on this gap.
   **If wave 3's Chat critic raises the same thing independently, that is the
   signal the perception is real and the mechanism is colour, which makes it an
   owner call rather than a builder task.** Do not let a builder "fix" 400 to 400.

2. **Sidebar's `YOURS WINS` is PROVISIONAL, and the piece is deliberately left
   `open: true` against the preset's letter.** The preset says to close a piece
   that reaches `YOURS WINS` so it stops consuming agents. That rule assumes every
   critic is the same instrument. For this one piece it was not: the first Sidebar
   critic **died on `Prompt is too long`** (36.9k tokens — five images, two of them
   2x-DPI bar references), and the retry ran a **trimmed prompt**: three images
   instead of five (it lost `frost-mono-reference.png` and the wave-1
   comparison), plus **one extra pre-refusal the other four critics never got**
   (the session-row left stripe). Its evidence is unimpeachable — it returned the
   exact truncations, the live `950 sessions outside this project`, and the exact
   two-line empty state — so it certainly saw pixels and the verdict is honestly
   reached. What is unproven is that it is *comparable* to the other four.
   Closing the piece would freeze a possibly-inflated measurement **and retire the
   only test that could catch it**. So: verdict recorded, piece stays open, and
   **wave 3 must re-run the Sidebar critic on the FULL standard prompt.** If that
   confirms `YOURS WINS`, close it then. If it returns `BAR WINS`, the jump was an
   artifact of the lighter prompt and the run learned something real.
   `plateau` still resets to **0**: a verdict did move, four other critics
   independently reported BETTER, and the cost of wrongly resetting is one extra
   wave while the cost of wrongly halting is the whole run.

3. **The smoothing pass proposed a sixth piece and it is REFUSED — on the
   instrument, not on the argument.** It proposed the three right-hand docks
   (Agents / Commands / Appearance), reasoning that `DESIGN.md:60` makes the agents
   dock the sessions rail's **mirror**, that a spec'd mirror with a critic on one
   side and nobody on the other is a drift generator, and that **this very wave
   proved it**: the Sidebar builder added a foot strip whose own comment claims to
   copy `.background-tasks` (a dock rule) and got the padding wrong at both ends,
   and no piece-scoped critic could have caught it. That is the strongest argument
   produced this wave.
   It is refused anyway, because **`inspect.mjs` cannot photograph the docks** —
   verified, not assumed: it defines exactly five surfaces (`:246` welcome, `:255`
   titlebar, `:264` sidebar, `:273` chat, `:284` input-bar) and contains no dock
   handling at all. A piece with no capture is a critic reading source, which the
   preset's own seed guard calls *"the failure mode wearing the fix's clothes"*.
   Extending the instrument mid-run is also barred: it would change the measuring
   apparatus between waves, and wave 1 already established that a capture set which
   no longer matches its verdicts is a corrupted record.
   **The one addition slot stays UNSPENT.** The proposal is not lost — it is the
   strongest input yet to the second run's scope, and it is really a request for a
   ticket extending `inspect.mjs` to reach the docks.

## Open fence question — not a wave's to settle

`rails.css:486` gives the active session row `background: var(--mint-wash)` plus
`box-shadow: inset 2px 0 0 0 var(--color-mint)` — a 2px mint stripe on the left
edge. DESIGN.md line 83 bans *"side-stripe borders"*. Nothing in `.context/
decisions/` adjudicates it and no test pins it.

**It was not ruled a break, and no wave should quietly "fix" it.** The banned list
it sits in is a list of *decorative* vocabulary, and this stripe is carrying
**state** (which row is selected) rather than decoration, so it matches the banned
form while failing to match the banned purpose. Ripping out a selection indicator
to satisfy a decoration ban is very plausibly worse than leaving it. That is an
owner call.

Worth knowing that wave 1's Sidebar critic **did not raise this** and in fact got
the detail backwards, reporting a *"full mint-outline border indicating selection
(not a side-stripe)"*. It is the one factual error in an otherwise clean evidence
sweep, and it is the reason this note exists rather than a verdict.

## Log
- [seed] Seeded 2026-08-10 off `21ee444`, slug `core-surfaces` (five core
  surfaces; the other six are a second run under a separate slug — `pieces` is
  capped at 6 and fixed at seed, so they cannot be a widening inside this run).
  Five pieces seeded leaves **exactly one slot** for the smoothing pass's one
  permitted addition.
- [seed] `inspect:` smoke-run before being pinned as a fixed field — `PASS`, 7/7
  files, frame 1440x900 @ zoom 1. The bar and the four fixed fields come from
  `.gauntlet/bar/README.md`, owner-confirmed 2026-08-10.
- [seed] Critic resolved live to `sonnet` -> `codex/gpt-5.6-sol`. The vibe run one
  day earlier resolved the same family to `opencode-go/kimi-k3`. **Routes move —
  re-resolve every wave.**
- [wave 1] **Baseline measurement wave — five critics, NO builders, and that is
  structural rather than a shortcut.** The preset hands a builder *"the single
  biggest gap named for that piece last wave (nothing on wave 1)"* and binding
  constraint 8 restricts it to *"close one named gap, do not redesign"*. With no
  gap named, a wave-1 builder has no legal move; letting it choose its own target
  would be the builder grading itself, which is the single thing this preset
  exists to prevent. So wave 1 measures and waves 2+ close. The five
  `verdict: BAR WINS` values in `pieces:` were **defaults written by the seed**,
  not measurements — these are the first real ones, and they happen to agree.
- [wave 1] **`plateau` stays 0, deliberately.** Plateau counts waves in which no
  verdict *improved*; wave 1 has no prior measurement to improve on, so counting
  it as a non-improvement would spend a third of the stop budget on the baseline
  and could halt the run at wave 3 having built exactly twice.
- [wave 1] Critic **re-resolved live** per the seed's standing instruction: first
  non-Anthropic family is `sonnet` -> `codex/gpt-5.6-sol`. Same value as seed this
  time; it was re-resolved rather than carried, which is the part that matters.
  `critic_degraded: false`.
- [wave 1] **Instrument verified, not assumed — the critics could actually see.**
  Cross-model image delivery through the gateway is the run's silent failure mode:
  a critic that receives no pixels can still return a fluent verdict off the
  filenames. Each critic was required to list literal observations, and those were
  checked against a first-hand read of the same captures. They returned the exact
  session id `inspect-ws-xJlG2M`, both exact truncations (`Why does the sessions
  rail go e...`, `C:\Users\S.D\AppData\Local\Temp\inspect-...`) and both tool-card
  affordance sets. Unguessable. All five also confirmed they ruled on neither
  colour/material nor the solid mint mark. 5/5 returned, 0 errors, 0 empty.
- [wave 1] Capture: `PASS`, 7/7, frame 1440x900 @ zoom 1. Gate green on all three
  (D7): typecheck clean, **1295 tests / 85 files**, build clean — unchanged from
  baseline, correctly, since wave 1 edits no `src/`.
- [wave 1] **Smoothing pass skipped, and its one-new-piece budget is unspent.** It
  exists to catch pieces that were *"improved separately"* and drifted; nothing was
  improved this wave, so it would have had no drift to find and its licence to
  restructure would have been the only thing left of it. The seed left exactly one
  slot open for that addition and it is still there.
- [wave 1] Instrument fix landed with the wave: two em dashes removed from the
  seeded transcript (`inspect.mjs:137`, `:146`) after the Chat critic correctly
  read them as a DESIGN.md copy-ban violation and incorrectly attributed them to
  the renderer. Re-smoke-run after the edit: `PASS`, 7/7, and the chat surface's
  text length moved 925 -> 923, exactly the two characters removed. Wave 1's own
  captures were not re-taken — see the adjudications section for why.
- [wave 2] **The first wave that BUILDS.** Five builders, one per open piece, each
  restricted to the single gap named for it in wave 1. All five closed their gap;
  0 errors. Gate green **twice** (D7) — once after the builders, again after the
  smoothing pass: typecheck clean, **1295 tests / 85 files**, build clean.
  Unchanged from baseline, correctly: no test was added and no D3 pin moved.
  Nothing reverted, so constraint 10 never fired.
- [wave 2] **A structural fact the handoff did not carry, and it decides the
  fan-out shape: Welcome has NO stylesheet of its own — `.welcome*` lives inside
  `chat.css`**, which the Chat piece also owns. Five parallel builders would have
  put two agents in one file. Welcome and Chat were **serialized inside** the
  fan-out (Welcome, then Chat on the freed file) while the other three ran free,
  so the wave still cost one round-trip instead of five. Any future wave touching
  both pieces must do the same.
- [wave 2] **The D3 and D4 pins were checked MECHANICALLY, not taken from the five
  builders' self-reports.** All clean: `.bubble {` still the first literal
  occurrence in `chat.css` (line 84); a regex sweep of every comment in `styles/`
  returns **zero** containing a closing brace; exactly **one** `backdrop-filter`
  in `styles/` and it is still `.subagent-drawer`'s; and a whole-directory scan
  resolved **every** `var(--x)` used anywhere in `styles/` against its definition
  — **zero undefined**. That last check is #129's exact failure mode (two
  nonexistent tokens shipped past the whole suite because jsdom loads no CSS)
  closed by measurement rather than by claim.
- [wave 2] Critic **re-resolved live** per the standing instruction: `wisp routing`
  gives `sonnet` -> `codex/gpt-5.6-sol`, the same value as seed and wave 1, read
  fresh rather than carried. `critic_degraded: false` — the one critic failure this
  wave was a context-length error, not a router problem, so scrutiny was not
  weakened at the model level. See adjudication 2 for where it *was* weakened.
- [wave 2] **Instrument verified again, and it caught a free check.** Capture
  `PASS`, 7/7, frame 1440x900 @ zoom 1. The chat surface's text length came back
  **923** — exactly the post-fix fixture number — so wave 2 is the first wave to
  photograph the corrected test data, confirmed rather than assumed. Cross-model
  image delivery was re-verified the same way as wave 1: every critic listed
  literal observations, checked against a first-hand read of the same files. They
  returned the new session id `inspect-ws-OAB2wJ`, both exact truncations, the live
  `950 sessions outside this project`, and the InputBar critic even quoted the
  identity reference's own strings (`Message Halo...`). Unguessable. 5/5 saw pixels.
- [wave 2] **One factual error in the sweep, same rate as wave 1.** The Titlebar
  critic reported the session ids **backwards** — it called wave 2
  `inspect-ws-xJIG2M` and wave 1 `inspect-ws-OAB2wJ`, which is inverted against two
  independent records (a first-hand read of both files, and wave 1's own log
  pinning `inspect-ws-xJlG2M`). Its verdict direction still matches reality
  (grouping tightened, glyphs still not one family), so the substance survives and
  the attribution does not. Recorded because a later leg comparing ids across waves
  would otherwise trip on it.
- [wave 2] **The Titlebar builder predicted its own critic, which is worth more
  than the fix.** It unified the three glyphs onto one 14 grid at one 1.3 stroke
  with a shared 10px optical box (measured 10.1 / 10.0 / 10.0, previously
  8.8 / 10.4 / 11.3) and cut the heaviest glyph's ink 20%, then wrote in `risks`
  that the residual 4.1x ink range was as far as geometry could go and that *"if a
  fresh critic still calls the slash faint, the honest next move is a metaphor
  change on Commands, not more geometry tuning, and that is a call worth a human."*
  The independent critic then asked for exactly that — one **outline** family at
  one weight. The two agree that the remaining gap is **fill-versus-outline**, not
  geometry, and that is now the wave-3 Titlebar brief.
- [wave 2] **Smoothing pass ran and earned its slot — three real cross-surface
  defects that no piece-scoped critic could see.** (a) **The identity mark shipped
  as two different shapes**: `.logo-mark` is 22px at `--r-mark` (7px, ratio 0.32)
  while `.welcome-mark` was 44px at a hardcoded `12px` (0.27) — and the Welcome
  builder's own new comment asserted "the same identity enlarged rather than a
  second shape" while breaking that claim on the corner. Now
  `calc(var(--r-mark) * 2)`, so the pair is arithmetic on one token and a theme
  re-cutting the corner re-cuts both. This is the only element appearing on two of
  the five surfaces, so it was the app's most load-bearing consistency, and it was
  the one that was wrong. (b) `.sidebar-foot` shipped at `10px 16px 12px` while
  `.background-tasks` — the agents-dock foot its own comment claims to copy, and
  the mirror `DESIGN.md:60` specifies — is `8px 16px 10px`; corrected. (c) The
  InputBar re-split orphaned `.input-foot`, **which lives in `titlebar.css`**, a
  file that builder never opened; the dead rule and its now-false comment were
  removed. It also **declined** four other findings with reasons (the 2px/4px icon
  cluster gap, the two feet 4px out at the window edge, markdown heading sizes off
  the ladder, and `--fs-display` having one caller), which is the harder half of a
  smoothing pass doing its job.
- [wave 2] **A measurement-scale problem the run should watch, flagged now rather
  than at the stop.** All five critics independently answered BETTER on
  `improved_since_wave1`, yet four of five verdicts did not move, because the
  ordinal has only three states and Linear is a deliberately hard bar. `plateau`
  counts **verdict** movement, so a run that keeps genuinely improving can still
  trip the counter and halt. It did not bite this wave (Sidebar moved, so
  `plateau` is 0). **If a later wave shows `plateau` rising while critics keep
  reporting BETTER, that is the scale failing to resolve real progress, not a real
  plateau, and it is an owner call — not something a leg should quietly rule on by
  changing the counter.**

- [wave 3] **Four builders, not five, and the skip was the point.** Chat got a critic
  but no builder: its wave-2 gap was refuted against source, and binding constraint 8
  restricts a builder to the named gap, so a wave-3 Chat builder had no legal move.
  Same structural logic that made wave 1 measure-only. Gate green **twice** (D7) — after
  the builders and again after the smoothing pass: typecheck clean, **1295 tests / 85
  files**, build clean, unchanged from baseline. Nothing reverted; constraint 10 never
  fired.
- [wave 3] **THE STANDARDISED THREE-IMAGE PROMPT WORKED, AND IT IS THE WAVE'S MAIN
  INSTRUMENT RESULT. 5/5 critics returned on ATTEMPT 1 — no retries, no context-length
  death, 39–45k tokens each.** Wave 2 lost a critic at five images and had to re-run it
  trimmed, which is what produced the incomparable verdict this wave had to correct.
  Payload is now identical for all five: the piece's own surface, its window frame, and
  its one `linear/` reference. Sized before spending an agent rather than after losing
  one: every `linear/` reference is 3360x2100 (~9.4k image-tokens), so three images cost
  the same for InputBar's 894KB `linear-home-product.png` as for the reference that
  wave 2's successful retry used. **Do not add a fourth image to a critic.**
- [wave 3] **The improvement axis DISCRIMINATES, which is the strongest evidence yet
  that the critics track reality rather than pattern-matching approval.** Four built
  pieces returned BETTER; **the one piece with no builder — Chat — returned SAME**, and
  it was the only SAME. Nobody told any critic which pieces had been rebuilt. A panel
  that answered BETTER out of politeness would have said BETTER five times.
- [wave 3] Critic **re-resolved live** per the standing instruction: `wisp routing`
  gives `sonnet` -> `codex/gpt-5.6-sol`, third wave at the same value, read fresh rather
  than carried. `critic_degraded: false`.
- [wave 3] **Instrument verified first-hand, not from the critics' own claims.** Capture
  `PASS`, 7/7, frame 1440x900 @ zoom 1, chat text **923** (the corrected-fixture number,
  third wave running). The leg read `titlebar.png`, `sidebar.png`, `input-bar.png` and
  `welcome.png` itself BEFORE reading any verdict, then checked every critic's literals
  against that read: the new session id `inspect-ws-yCT6Rl`, both exact truncations
  (`Why does the sessions rail go e...`, `C:\Users\S.D\AppData\Local\Temp\inspect-...`),
  the live `951 sessions outside this project` (**950 last wave — this number drifts, so
  it is the best liveness literal the capture offers**), `Show all projects`, and
  InputBar's `"Default" appears exactly twice`. The Welcome critic additionally quoted
  its bar reference's own copy (`THE LINEAR METHOD`, `Practices for building`), proving
  it read the bar and not only the capture. 5/5 saw pixels. **Zero factual errors this
  wave** — the first clean sweep in three (waves 1 and 2 each had one). The only
  discrepancy is the Titlebar critic transcribing the session id's final lowercase `l`
  as capital `I`, which is a glyph ambiguity in the rendered font rather than a claim.
- [wave 3] **The leg BUILT the Titlebar piece itself after killing a runaway builder.**
  The Titlebar builder reached retry 2 at 262k tokens and went idle; it was stopped and
  the edit done in-context. It had written **nothing** — `git status` showed
  `Titlebar.tsx` and `titlebar.css` untouched — so there was no partial edit to unwind.
  The other three builders had already returned and their edits were on disk, unaffected.
  **The transferable half: a fan-out that writes to a shared tree needs its survivors'
  work to be independent of the casualty, and here it was, because file ownership was
  assigned per piece up front.** The one open-ended licence in that brief (permission to
  change the Commands glyph's *metaphor*, not just its geometry) is the most likely cause
  of the spiral, and it is the one thing wave 2's builder had flagged as "a call worth a
  human". A brief that hands an agent an unbounded design question is where the tokens go.
- [wave 3] **The smoothing pass PROVED the flatness artifact instead of restating it,
  closing the run's most-repeated assertion by measurement.** Binding constraint 1 has
  said since seed that the flat ground is an instrument artifact; that was reasoning, not
  evidence. The pass measured it: both wave-3 window captures are RGBA with a dominant
  alpha of **163/255 = 0.639**, which is exactly the authored wash
  `oklch(0.12 0.008 210 / 0.64)`, while `frost-mono-reference.png` is alpha 255 on every
  pixel. **The wash is present in the capture at its authored alpha with nothing behind
  it** — the mid-grey a viewer sees is the viewer compositing over its own chrome. The
  identity floor otherwise `HOLDS` on numbers: ground `(3,6,6)` at 93.9% of the welcome
  frame, mint coverage **0.664% welcome / 0.351% session against the reference's 0.283%**
  — about one fifteenth of the 10% ceiling — one mint value with only antialias ramps
  beside it, and exactly one `backdrop-filter` in `styles/`, still `.subagent-drawer`'s.
- [wave 3] **The smoothing pass caught the wave-2 defect class repeating — in the LEG'S
  OWN edit.** The leg's new Titlebar comment justified the 14 -> 16 grid move as making
  the glyphs "carry their 28px housings". That housing is **not the titlebar's**:
  `titlebar.css:169` declares `.agents-toggle, .sidebar-toggle` jointly, and the sessions
  rail's three glyphs still draw on **14 at 1.4 stroke** (`Sidebar.tsx:66`, `:460`,
  `:477`). Taken at face value the stated reason condemns three glyphs in a file the
  Titlebar builder never opened. The pass measured both sides before touching anything
  (titlebar 10.0 / 9.9 / 10.8x10.6 on the 16 grid; rail 9.0x9.5 / 10x7.8 / 9x9 on the 14)
  , found both land ~10px optical inside the same 28px box, **redrew nothing**, rewrote
  the false justification, and added the reciprocal note to `titlebar.css:169` so the
  next builder told to "unify the icons" sees that the rule has two tenants. It also
  caught the Welcome comment stating its own arithmetic wrongly (`120 against 32` reads
  as a 120px bottom padding; the shipped value is 152). **Both are comment-level defects
  and neither changes a pixel — which is exactly why only a whole-app reader finds them.**
- [wave 3] **Two independent instruments landed on the same new defect, which is the
  wave's most trustworthy finding.** The Sidebar critic (pixels only, forbidden from
  reading source) named *three reload affordances concentrated in the rail's first 110px*
  as its biggest gap. The smoothing pass (source only, never saw a verdict) independently
  flagged that the rail now holds three refresh controls whose accessible names are
  `Refresh sessions`, `Refresh background sessions` and a bare `Refresh`. **Wave 3's own
  Sidebar build created the third**: it closed the named gap and opened an adjacent one,
  which is honest loop behaviour rather than a failure, but it means the piece's gap is
  now partly of the run's own making. The obvious fix is blocked —
  `tests/background-sessions.test.tsx:262` resolves that control by
  `getByRole('button', { name: 'Refresh background sessions' })` and three tests call it
  in the empty branch, so renaming to match makes `getByRole` throw on ambiguity. **This
  wants a ticket, not a smoothing edit**, and the pass correctly declined it.
- [wave 3] **The smoothing pass's declined half, recorded because a later wave will meet
  these again.** (a) `.control-value` (`composer.css:314`) is a nine-declaration
  hardcoded twin of `.model-pill` (`titlebar.css:46`) — compared property by property,
  **zero drift today**, and declined because undoing it would re-decide an InputBar
  construction one wave after its builder deliberately chose it. (b) `.model-pill`'s rule
  lives in `titlebar.css` grouped with the two titlebar pills, yet **only
  `InputBar.tsx:94` renders it** — a standing drift generator, pre-existing, and the
  reason the twin got written at all; flagged for the second run. (c) The send/stop glyph
  is a 16 viewBox at 1.75 stroke, so this wave moved the toggles **onto** its grid rather
  than off it. (d) Swept clean and therefore reported as a negative result: the identity
  mark pair still matches at corner ratio 0.3182 after wave 2's fix, the
  `.sidebar-foot`/`.background-tasks` mirror holds, `SOLID` left zero stragglers, and a
  sweep of all 253 classes in `styles/` against every `.ts`/`.tsx`/`.html` in `src/`
  found no rule orphaned by this wave.
- [wave 3] **D3/D4 pins checked MECHANICALLY twice — after the builders and again after
  smoothing — never from any agent's self-report.** All clean both times: `.bubble {`
  still the first literal occurrence in `chat.css` (line 84); zero comments in `styles/`
  containing a closing brace; exactly one `backdrop-filter`; **every `var(--x)` used
  anywhere in `styles/` resolves — 66 used against 67 defined, zero undefined**, which is
  #129's exact failure mode closed by measurement. Additionally `tokens.css` and
  `themes.css` are **untouched by the entire wave**, so `theme.test.ts`'s no-lightness /
  no-alpha bar was never even approached.

- [wave 4] **Five builders, five critics, one smoothing pass. THREE BUILDERS EDITED AND TWO
  RETURNED MEASURED REFUSALS — and the refusals were worth more than the edits.** Both refusals
  were legal because the briefs made them legal, in direct response to wave 3 losing a builder to
  an unbounded question. Gate green **twice** (D7 + constraint 10): typecheck clean, **1295 tests
  / 85 files**, build clean, unchanged from baseline. Nothing reverted; constraint 10 never fired.
- [wave 4] **THE BOUNDED BRIEF FIXED THE RUNAWAY, AND THAT IS THE WAVE'S MAIN PROCESS RESULT.**
  Wave 3's Titlebar builder got *"you may change a glyph's metaphor"* and burned **262k tokens to
  zero bytes** before being killed. Wave 4 handed the same question as **three pre-drawn candidate
  glyph sets plus an explicit fourth option to refuse with measurements**, and it returned in one
  pass having measured all three and written a 34-line negative. **The critic had already named the
  metaphor — "panel-outline" — so the task was pick-and-draw, not invent; reading the verdict text
  literally is what made the brief boundable.**
- [wave 4] **File ownership was assigned per piece up front again, and Welcome/Chat were serialized
  inside the fan-out** (both write `chat.css`, `.welcome*` has no stylesheet of its own). Added this
  wave: InputBar was **explicitly barred from `titlebar.css`** because `.model-pill` and
  `.model-pill-wrap` live there while only `InputBar.tsx:94` renders them — the known drift generator
  from wave 3 — and the Titlebar builder owned that file. It never needed it. Zero collisions.
- [wave 4] Critic **re-resolved live** per the standing instruction: `wisp routing` gives
  `sonnet` -> `codex/gpt-5.6-sol`, fourth wave at the same value, read fresh rather than carried.
  `critic_degraded: false`.
- [wave 4] **Instrument verified first-hand BEFORE any verdict was read.** Capture `PASS`, 7/7,
  frame 1440x900 @ zoom 1, chat text **923** (the corrected-fixture number, fourth wave running).
  The leg read all five surfaces plus `window-welcome.png` itself, then checked every critic's
  literals against that read. Returned unguessable: the new session id **`inspect-ws-KwJeOd`**, the
  live **`952 sessions outside this project`** (**951 last wave — still the best liveness literal the
  capture offers**), both exact truncations, `"Default" appears exactly twice`, both tool-card paths
  and all four disclosure labels, and paragraph line-counts 4/3/1. **5/5 returned on ATTEMPT 1 at the
  standardised three-image payload — second clean sweep running, and ZERO factual errors for the
  second wave in a row.** Four critics additionally quoted their own bar's copy (`THE LINEAR METHOD`,
  `The system for modern / product development`, `July 30, 2026`, `Tell Linear what to do next...`),
  proving they read the reference and not only the capture. Two critics working from **different**
  reference files independently listed the same eight Linear nav labels.
- [wave 4] **THE IMPROVEMENT AXIS DISCRIMINATED AGAIN, AND HARDER: 5/5 CORRECT, WITH THE TWO
  DELIBERATE REFUSALS BOTH RETURNING `SAME`.** Three edited pieces said BETTER; the two that changed
  no pixels said SAME. No critic was told which was which. Across waves 3 and 4 the axis is **9 for
  9**. It is measuring reality, not politeness.
  **Instrument note, recorded because it is a deviation:** wave 3's exact critic prompt was not
  recoverable, and three images carry no prior-wave state for an improvement question to anchor on.
  Wave 4 therefore **sealed the verdict first** (PART A literals, PART B verdict + gap) and only then
  revealed last wave's named gap for a BETTER/SAME/WORSE judgement, with an instruction not to revise.
  This is strictly tighter than revealing it up front. **Evidence it did not inflate anything: the
  other four verdicts held exactly where wave 3 left them.** Every critic was also asked whether the
  reveal would have changed its verdict; **all five said no.**
- [wave 4] **THE SMOOTHING PASS CAUGHT A ONE-PIXEL ERROR AT THE ROOT OF THE WAVE'S BIGGEST
  ARGUMENT.** `base.css:7-13` sets `box-sizing: border-box`, so `.titlebar`'s `height: 48px`
  **includes** its 1px border — the Welcome builder's budget had charged 49. Confirmed three
  independent ways: the box-sizing rule, `inspect.mjs:357`, and **this leg's own capture output**
  (`welcome` box `y:48, h:852` under a 1440x900 window). Corrected to 48 / **432px** / **16px** of
  headroom; the two dependent ceiling figures moved with it (fourth step leaves 10px not 9, fifth
  leaves 2px not 1). Also `851 -> 852` and `7.1% -> 7.0%`.
- [wave 4] **"IT ADDS A FIFTH RENDERED SIZE" WAS FALSE, AND THE TRUTH IS SHARPER.** The Welcome
  builder reported its `calc()` added a fifth rendered type size. Verified first-hand: **`--fs-display`
  had exactly ONE caller** (`chat.css:329`, plus its alias at `tokens.css:110`), so wrapping it
  **replaced** that size rather than adding one — **23px now renders nowhere in the app**. The count
  is still four (11 / 13 / 15 / 34.98). The real cost against owner call 1 is a **named token the app
  no longer paints**, which is a different and cleaner statement of the same problem.
- [wave 4] **DRIVER ROT IS REAL, MEASURED, AND IS THE WAVE'S BIGGEST INSTRUMENT FINDING.** 38
  `gui-*.mjs` drivers exist and **`npm test` executes none of them**, so a driver contract can go red
  and stay red across waves while all three gate commands report green. Swept statically: **six true
  source-level assertions, all GREEN** (`gui-96:308` the 500 ban, `gui-96:338`, `gui-98:438`,
  `gui-93:312` against the current build, `gui-75:89`, the collapse-rail setup). Two DOM assertions
  decided: **`gui-91.mjs:197` was RED and this wave repaired it** — wave 3's unlabelled `Refresh`
  made `sec.querySelectorAll('button')` return two where the driver pins exactly one, and the Sidebar
  builder found that independently and used it as its deciding evidence rather than taste.
  **`gui-91.mjs:131` is RED and stays red** — a hint span concatenates into `.bg-sessions-empty`'s
  textContent so it reads `None running hereScoped to the open project.` against an exact-equality
  check. **Wave 3 turned BOTH red in a single build and nothing noticed for a wave.**
  **Attribution correction:** the Sidebar builder called that hint "wave-2 copy". It is not — wave 3's
  own log pins `Scoped to the open project.` and `Refresh` as its only two new strings.
- [wave 4] **D4 IS BEING DISCHARGED LOOSELY AND THE SMOOTHING PASS SAID SO.** Builders cited
  `inspect.mjs` and `gui-93`/`gui-124` as covering their changes, but **no driver pins welcome type,
  welcome geometry, or composer spacing at all** — `inspect.mjs` photographs those surfaces without
  asserting a single one of their values, and `gui-93` touches `.pick-folder-btn` only for its focus
  ring. **So this wave's three visible changes were driven by nothing.** D4 says a CSS change owes a
  driver pin; "a driver renders this surface" is not the same claim as "a driver pins this value",
  and the run has been accepting the weaker one.
- [wave 4] **The smoothing pass's declined half, recorded because a later wave will meet these
  again.** (a) The app's genuine second type scale is **`markdown.css:134/138`** — `h1 1.25em` and
  `h2 1.1em` render 18.75 and 16.5 against a 15px body, which are **not** 1.15 rungs (those are 17.25
  and 19.84) — and it ships on a photographed surface; declined because restriking heading sizes moves
  rendered prose and is a design change owing a capture, not a consistency repair. (b) The identity
  mark pair still matches at corner ratio **0.318** and 44 = 2 x 22, and the mark now sits on the
  title's 43.7px line box at 44 — the beat the comment claims; declined enlarging it because 44 is
  pinned twice (2x the titlebar mark `DESIGN.md:59` fixes at 22px, and a 16px height reserve).
  (c) The rail/dock mirror **holds** — `DESIGN.md:60` mirrors the 44px *head* (`.sidebar-head` /
  `.agents-dock-head`, still one shared rule), and the changed control is in `.bg-sessions-head`, a
  *section* head with no dock counterpart, whose band already uses text controls by the rail's own
  documented convention. (d) `.sidebar-empty-retry` is **still one shell** — the new control measures
  23.6px tall, identical to `.session-scope-btn` one band below. (e) **`.sidebar-toggle` has THREE
  glyph grids, not the two its own comment claims** — 16 titlebar, 14 rail, and **12 for both
  chevrons**, which render ~7px optical where everything else reaches ~10px; pre-existing, and fixing
  it means redrawing a chevron, which needs a builder and a capture.
- [wave 4] **D3/D4 pins checked MECHANICALLY twice — after the builders and again after smoothing —
  never from any agent's self-report.** Clean both times: `.bubble {` still the first literal
  occurrence in `chat.css` (line 84); **zero** comments in `styles/` containing a closing brace;
  exactly one `backdrop-filter` (`subagent.css:122`); **every `var(--x)` in `styles/` resolves — 66
  used / 66 defined, zero undefined**; and **zero `font-weight: 500`**, which is `gui-96`'s criterion
  2 checked at the source rather than trusted.

## Owner calls raised by wave 2 — none of these are a wave's to settle

1. **`DESIGN.md` is now FALSE about the build.** Its Type section (line 54) and its
   `@theme` excerpt (lines 42-46) both enumerate exactly three type steps. The
   build has four: `--text-display: 23px` / `--fs-display` shipped in `tokens.css`
   this wave, continuing the documented ~1.15 ladder (15 x 1.15^3 = 22.8). The
   Welcome builder took this route deliberately and reported it, because the gap
   ("widen the scale contrast against the supporting line") was **unclosable on a
   ladder whose top rung was the body size** — the headline and its caption were
   15:13, the smallest interval the scale could express. Either DESIGN.md gains the
   rung or the token comes out. **No agent may edit the spec to cover its own
   build**, so the document stays false until a human rules. The other ladder-legal
   option was 20px (15 x 1.15^2); 23 was chosen because 20 still reads as enlarged
   UI text on a 1440px empty field. Reverting is one line plus swapping
   `.welcome-title` back to `--fs-body`.
2. **The em-dash ban (`DESIGN.md:83`) is already broken app-wide in PRE-EXISTING
   user-visible copy — roughly fifteen sites.** Found by the smoothing pass, the
   only agent with a whole view. In `Titlebar.tsx` tooltips ("Commands panel —
   click to hide", "Backend: X — click to switch", "Launched without Wisp routing —
   native only", and others), `InputBar.tsx` ("Queued — sends when this turn
   finishes", "Couldn't be read — it may have been moved, deleted or locked",
   "Effort: X — the current model does not offer this level"), `ToolCard.tsx`
   ("Too large to align — exact texts") and `Sidebar.tsx` (the row title
   `${label} — ${groupLabel}`). **Every string added this wave is clean.** Not
   fixed here on purpose: rewriting fifteen user-facing strings spans four pieces'
   files, several need a real replacement phrase rather than a mechanical swap, and
   it is copy work rather than a consistency pass. **This wants a ticket.**
3. **`inspect.mjs` cannot reach the three right-hand docks**, which is why wave 2's
   sixth-piece proposal was refused (adjudication 3). The docks are a shipped,
   visible third of the window's chrome that no critic owns, and `DESIGN.md:60`
   defines the agents dock as the sessions rail's mirror. A ticket extending the
   instrument would unblock the second run and close a proven drift path.

## Owner calls raised by wave 3

4. **THE MEASUREMENT-SCALE RISK WAVE 2 FLAGGED HAS NOW BITTEN, AND WAVE 2 LEFT
   STANDING INSTRUCTIONS FOR THIS EXACT MOMENT: IT IS AN OWNER CALL AND NOT SOMETHING
   A LEG MAY QUIETLY RULE ON BY ADJUSTING THE COUNTER.** `plateau` rose **0 -> 1** while
   **four of five critics independently reported BETTER** and the fifth was the piece
   nobody built. No verdict improved, so by the preset's letter the counter moves, and
   **it has been recorded faithfully at 1 rather than massaged back to 0.**
   The mechanism is exactly as predicted: the verdict is a three-state ordinal against a
   deliberately hard bar, so real improvement that does not cross an ordinal boundary is
   invisible to it. Two waves of genuine, independently-confirmed progress can therefore
   spend two thirds of the stop budget.
   **What the owner is being asked, precisely:** at `plateau >= 3` this run stops. If the
   next two waves also improve without moving a verdict, the run will halt at wave 5
   having been told BETTER roughly a dozen times. Is the honest stop signal (a) verdict
   movement as written, (b) verdict movement OR three straight waves of unanimous SAME on
   the improvement axis, or (c) is `BAR WINS` against Linear simply the correct permanent
   answer for most of these pieces, making the plateau the intended graceful end?
   **No leg should decide this.** A leg that quietly resets `plateau` on "but the critics
   said BETTER" has removed the only stop signal the loop has, which is the failure mode
   the whole preset is built to prevent.
5. **The Sidebar's new gap is partly the run's own artifact, and that is a question about
   the loop rather than about the rail.** Wave 3 added the labelled `Refresh` the wave-2
   critic asked for, and wave 3's critic then named the resulting **three** reload
   affordances as the biggest gap. Each step was correct in isolation. **A one-gap-per-
   wave loop can walk a surface into a defect that no single wave's brief could have
   foreseen**, and the only agent positioned to see it coming is the smoothing pass — a
   consistency fixer, deliberately barred from redesigning a surface on its own terms.
   Worth an owner's eye on whether the smoothing pass should be allowed to *veto* a
   builder's brief when it can see the brief will create a new defect. Not a leg's call;
   it changes the preset, not the app.
6. **The accessible-name collision on the rail's three refresh controls WANTS A TICKET**
   (`Refresh sessions` / `Refresh background sessions` / bare `Refresh`). Blocked from
   being a smoothing edit because `tests/background-sessions.test.tsx:262` resolves by
   `getByRole('button', { name: 'Refresh background sessions' })` and three tests call it
   in the empty branch, so the obvious rename makes `getByRole` throw on ambiguity.
   Fixing it properly means touching the test's query, which is a spec-adjacent change
   rather than a consistency pass.
7. **Owner calls 1–3 from wave 2 are all still open and none has been actioned**, because
   none is a wave's to settle: `DESIGN.md` remains false about the type scale (four rungs
   ship, three documented), the em-dash ban remains broken in ~15 pre-existing
   user-visible strings, and `inspect.mjs` still cannot reach the three docks. **Wave 3
   verified it introduced no new em dash in rendered copy** — its only two new strings
   are `Scoped to the open project.` and `Refresh`, both clean.

## Owner calls raised by wave 4

8. **THE CHAT PROSE/LABEL WEIGHT PAIR IS NOW A MEASURED NUMBER AND BOTH FIXES ARE BLOCKED — this is
   the one that has cost three waves and it needs a human.** Three independent instruments agree the
   perception is real: two critics reported it from pixels, a third reported the labels look *"about
   the SAME weight"* as the prose, and a builder measured rendered stem widths at **1.208** against
   the app's own one-weight-step value of **1.391** — 53% of a step. **The mechanism is that the label
   is two rungs smaller (13 vs 15) and the size drop eats the 600-vs-400 difference.** Every lever is
   off the documented set: 350 or 500 on the prose and 700 on the label all leave DESIGN.md's
   `{400, 600}`, and **`gui-96.mjs:308` actively greps for `font-weight: 500` and requires zero
   hits** (ticket #96 existed to remove exactly that drift). Colour is out of scope by this run's
   rules. **The question: add a lighter rung to DESIGN.md line 54 for body prose (ratio → 1.525),
   restrike the label size, or accept 1.208 as the house pair?** Nothing a builder does can settle it.
   **Keep this trap in the record: 500 renders byte-identically to 600 on this machine** (stem
   1.543627450980392 both) because the family snaps to named instances — a "fix" at 500 changes zero
   pixels while looking like a change.
9. **NOTHING RUNS THE 38 `gui-*.mjs` DRIVERS, AND TWO ASSERTIONS WENT RED FOR A WHOLE WAVE WHILE THE
   GATE REPORTED GREEN THREE TIMES.** `npm test` executes none of them. Wave 3's Sidebar build turned
   both `gui-91.mjs:197` (control count) and `gui-91.mjs:131` (exact empty-state text) red in one
   edit; wave 4 repaired the first by accident of closing an unrelated gap, and **the second is still
   red**. D4 — *"any CSS change owes a driver pin"* — is load-bearing precisely because jsdom loads no
   CSS, and it is being satisfied by drivers that nothing executes. **Compounding it: no driver pins
   welcome type, welcome geometry or composer spacing at all**, so this wave's three visible changes
   were pinned by nothing while every builder believed D4 was discharged. **This wants a ticket:
   either run the source-level driver phases in CI, or stop calling D4 discharged by a driver that
   never runs.**
10. **WELCOME HAS WALKED INTO ITS OWN CEILING — the next named gap is unreachable without undoing an
    earlier wave's closed gap.** The wave-4 critic asks for a 42–44px heading; the re-derived height
    budget says a fourth ladder step (40.2px) leaves 10px of headroom and a fifth (46.3px) leaves 2px,
    against a 152px bottom reserve that is **wave 2's own deliberately-closed gap**. Same shape as
    owner call 5 and now confirmed on a second surface: **a one-gap-per-wave loop can walk a surface
    to a place where the only legal next move is to undo a previous wave.** Someone has to decide
    whether the reserve or the headline wins.
11. **THE ONE-ADDITION SLOT APPEARS TO BE DEAD MACHINERY UNDER THIS RUN'S OWN RULES.** Three
    consecutive smoothing passes have now proposed an addition and all three were refused **on the
    same ground** — wave 2 barred extending the instrument mid-run because changing the measuring
    apparatus between waves destroys the plateau signal. Wave 4's proposal (photograph Welcome at the
    minimum window, a second *state* of an existing surface rather than a sixth surface) **cleared the
    capture objection that killed the docks** and was still refused on stability alone. **If every
    reachable proposal is barred by a rule the same run enforces, the slot is not a budget, it is
    ceremony.** This is a question about the preset, not the app: should the addition slot be spendable
    only at a seed, or should instrument extensions be allowed at a wave boundary with the prior
    captures retained?
12. **The minimum-window Welcome capture wants a ticket regardless of the slot decision.** The entire
    Welcome composition now rests on a **derived** budget with 16px of headroom, nothing has ever
    photographed the app at the size that budget is about, and **a one-pixel error at its root
    survived the wave's own review** and was caught only by a whole-app reader. `inspect.mjs` can
    already take the shot — same selector, same stage, one extra `setBounds`.
13. **Owner calls 1–3 and 5–7 remain open and unactioned**, because none is a wave's to settle.
    Note that **owner call 1 has changed shape rather than grown**: the type ladder's problem is no
    longer "a fourth rung ships undocumented" but "`--fs-display` is a named token the app no longer
    paints, and the size it does paint is a `calc()` chain". **Wave 4 introduced no new em dash in
    rendered copy** — its only new user-visible string is the `Refresh` label, which is clean.
