---
slug: core-after-docks
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
  # THE CORE FIVE, RE-GRADED. Every one closed run 1 at BAR WINS with plateau 3,
  # and every one was measured DIFFERENT at seed from the pixels run 1 judged.
  # Per-piece seed evidence is in "Why this run exists" below; do not re-derive it.
  - name: Welcome
    verdict: BAR WINS
    open: true
  - name: Titlebar
    verdict: BAR WINS           # WAVE 5 — FELL BACK from TOO CLOSE on a capture that is
                                # BYTE-IDENTICAL to wave 4, with 0 changed pixels in its
                                # zone of the shared frame. Wave 4's movement does not
                                # reproduce. Read adjudication 5.1 before treating either
                                # this or wave 4's rise as being about the artifact.
    open: true
  - name: Sidebar
    verdict: BAR WINS
    open: true
  - name: Chat
    verdict: BAR WINS           # WAVE 5 — FELL BACK from TOO CLOSE, also on a
                                # BYTE-IDENTICAL capture with 0 changed pixels in its
                                # frame zone. So BOTH of the run's verdict movements have
                                # now reversed without any input changing. This is the
                                # decisive test adjudication 3.1 asked for and it came
                                # back for reading (b), inter-critic variance. See 5.1.
    open: true
  # Its seed delta is the SMALLEST of the five and may be pure 6px reflow. That
  # is a caveat on the delta, NOT a reason to discount its verdict — the critic
  # grades the artifact, never the diff. See "Why these five" note 3.
  - name: InputBar
    verdict: BAR WINS
    open: true
critic: sonnet                 # THE RULE, NOT THE VALUE. Re-resolve with live
                               # `wisp routing` every wave and take the first
                               # non-Anthropic family. Re-resolved AGAIN at wave 5 to the
                               # same landing, `codex/gpt-5.6-sol`, now SIX consecutive
                               # waves, which is luck and not stability. Routes have moved
                               # in under a day. ⚠️ WAVE 5 ALSO ESTABLISHED THAT THIS
                               # FAMILY'S VERDICT IS NOT REPRODUCIBLE ACROSS WAVES ON
                               # IDENTICAL PIXELS — see 5.1. That is a property of the
                               # instrument, not a reason to change families mid-run:
                               # swapping now would destroy comparability with waves 1-5
                               # on top of the variance already measured.
critic_degraded: false         # wave 1: one critic died on context length and was
                               # recovered on a uniformly changed instrument, NOT a
                               # trimmed one. Wave 2: all five returned first time at
                               # the half-scale payload. Wave 3: the Chat critic stalled
                               # TWICE and returned on the THIRD attempt with a
                               # BYTE-IDENTICAL prompt — no trim, no weakening, so
                               # scrutiny is intact. But see adjudication 3.5: this
                               # wave is the first with FACTUAL ERRORS in critic
                               # literals (two of five), which is an instrument fact
                               # worth carrying even though no verdict rests on them.
                               # WAVE 4: all six agents returned FIRST TIME, zero deaths,
                               # zero stalls — the only clean fan-out of the run. But the
                               # Titlebar critic repeated wave 3's EXACT slip on the exact
                               # same file (window-session.png as 1440x912, truth 900), so
                               # that error is reproducible rather than random (4.8).
branch: gauntlet/core-after-docks
wave: 5
plateau: 1                     # WAVE 5: 0 -> 1. NO piece improved; TWO regressed
                               # (Titlebar and Chat, both TOO CLOSE -> BAR WINS, both on
                               # BYTE-IDENTICAL captures). The written contract is
                               # literal — "any piece whose verdict improved -> 0,
                               # otherwise += 1" — and a regression is not an
                               # improvement, so it increments. Followed as written, for
                               # the third time in a row that the answer was
                               # unflattering (owner call 20, still open and now much
                               # sharper: see 5.1, because the counter cannot tell a
                               # stalled artifact from a critic that does not repeat).
                               # History: wave 1 BASELINE (could not count, stayed 0);
                               # wave 2 5/5 BAR WINS -> 1; wave 3 Chat improved -> 0;
                               # wave 4 Titlebar improved -> 0; wave 5 both of those
                               # reversed -> 1. The run needs plateau >= 3 to stop, so
                               # it is two waves from its stop condition at wave 5 of 12.
max_waves: 12                  # budget backstop
page: false
stop: false
---

## Where things are

- **This file is the run's memory.** `.claude/relay/gauntlet.md` is only the relay
  machinery and points here.
- **The tree stays on `gauntlet/core-after-docks`.** The seed commit is on `main`
  too, so a leg that somehow boots on `main` still finds this file and does **not**
  re-seed — but `main`'s copy goes stale the moment wave 1 commits. **The live copy
  is the one on the branch.** On `main` with `wave:` reading 0 while
  `git log gauntlet/core-after-docks` shows waves → you are reading the stale copy.
- Run 1 is archived at `.claude/gauntlet-core-surfaces.md`, run 2 at
  `.claude/gauntlet-docks-and-min-window.md`. Both are tracked; read them rather
  than re-deriving their conclusions. **You should not need to open either** — wave 1
  lifted the piece→capture map, the binding constraints and the wave-1 rule into the
  sections below, because re-reading 3,552 lines of archive every leg is a real
  per-leg context cost.
- **Captures go to `.gauntlet/waves/core-after-docks/<N>/`.** NOT bare
  `.gauntlet/waves/<N>/` — that is **run 1's** directory, and wave 1 overwrote it
  before catching it via `git status` and restoring from `db9dd19`. Run 2 namespaced
  its waves; run 1 did not.
- **Wave 1 ran ZERO builders, on purpose.** A wave-1 builder has no named gap to
  close, and a builder handed no gap is redesigning — the preset says exactly this
  ("nothing on wave 1"). Both prior runs encoded it as *the wave-1 rule* and applied
  it three times between them. Wave 1's job is to establish this run's baseline
  verdicts and gaps against the changed pixels. **Wave 2 is the first wave with
  builders.**

## Why this run exists — measured at seed, not assumed

Run 1 (`core-surfaces`, waves 1–5) closed at **`plateau: 3` with all five core
surfaces still `BAR WINS`**. Re-running the same five would normally be re-asking a
settled question hoping for a different answer. It is not, because **the artifact
changed underneath them**: run 2's twelve waves merged to `main` as `25d13e0`, and
`main` now carries work run 1 never saw.

That claim was measured rather than argued, and the instrument was controlled first:

**Control — the instrument is deterministic *across* runs.** Chain 8's three
tickets (#153, #154, #156) touched only test and driver files, so a fresh capture of
current `main` should reproduce run 2's wave 12 exactly. It did: **all eleven files
SHA256-identical**, across a rebuild, a fresh process and two days. Run 2 had only
ever shown determinism *within* a run (its wave 10–12 null controls). So a
cross-run byte difference is a real change, not instrument noise — and a
SHA-identical capture remains proof of no change.

**The five deltas, run 1 wave 5 → current `main`:**

| piece | dimensions | bytes | reading |
|---|---|---|---|
| Welcome | 1440x852 unchanged | +6991 | content change inside the same box |
| Titlebar | 1440x48 unchanged | −862 | content change — run 2's `IconHousing` landed here |
| Sidebar | **254x852 → 248x852** | +11907 | the sessions rail NARROWED 6px, plus content |
| Chat | **1186x721 → 1192x721** | −213 | absorbed the rail's 6px |
| InputBar | **1186x132 → 1192x132** | ±0 | absorbed the rail's 6px |

`InputBar` is the honest edge case: byte-length identical to run 1's final, yet
**13855 of 14703 bytes differ**, and the divergence starts at PNG offset 20 — inside
the IHDR **width** field — with the IHDR CRC following. So the length collision is
a coincidence of compression, not evidence of an unchanged surface, and the change
that is *proven* for it is the reflow.

## Seed verification — what was checked rather than trusted

- **`inspect:` was run once at seed**, at current `main` after `npm run build`:
  `PASS`, `CAPTURED 11/11`, every file written. The instrument works on this
  machine at `56917df`. Baseline capture kept at
  `.gauntlet/scratch/run3-seed-control/` — it is wave 0 for every piece.
- **Build clean**, bundle `index-DOI17h8g.css` — byte-for-byte the hash run 2
  recorded, which independently agrees that chain 8 touched no `src/`.
- **`critic:` resolved from live `wisp routing`**, first non-Anthropic family:
  **`sonnet` -> `codex/gpt-5.6-sol`**. Same landing as runs 1 and 2, which is
  luck rather than stability — **re-resolve every wave, never carry it forward.**
- **`.gauntlet/bar/` intact**: `README.md`, five `linear/`, two `identity/`,
  `manifest.json`. The bar is unchanged and must stay unchanged; a bar that drifts
  under a loop is not a bar.
- **Run 2's work confirmed on `main`**: `git merge-base --is-ancestor 25d13e0 main`
  passes and `gauntlet/docks-and-min-window` is 0 commits ahead of `main`.

## Why these five, and why only five

1. **Both pieces run 2 left open are excluded on purpose.** `AgentsDock` and
   `DocksAsOne` are blocked on **owner call 19** (collision A: per-dock vs
   cross-dock trading), whose default is *build nothing on Agents resting shells*.
   Waves 7–12 of run 2 spent **six consecutive waves** on them producing
   pixel-identical captures and critic-only restatements of the same gap. Seeding
   them here would buy the same stall with this run's budget.
2. **The sixth slot is left empty deliberately.** `pieces` is capped at 6 and the
   smoothing pass may add **one** per wave. In run 2 the added piece
   (`DocksAsOne`, wave 2) produced the run's **first verdict movement** and its
   only backward one — both from a piece with no builder. Filling all six at seed
   forecloses the most informative slot the mechanism has.
3. **`InputBar` stays in despite the thinnest delta.** A critic that gets it will
   be grading run 1's design plus a reflow, and may well restate run 1's gap. That
   is a legitimate answer, not a wasted agent — and dropping a surface because its
   delta looks small is deciding the verdict before the critic does.
4. Cost per wave at five open pieces: **5 × 2 + 1 = 11 agents**, inside the
   harness's 15 guideline. Pieces closing at `YOURS WINS` cut it further.

## Inherited — settled, do not re-litigate

- **The identity mark is solid by design.** Flat mint rounded square, no glyph, in
  both titlebar and Welcome hero. `.gauntlet/bar/README.md` proves it three ways.
  "The glyph is missing" is answered. Mark *depth* is still fair game.
- **A critic may not rule on colour, translucency or material.** The wash is
  composited by Windows over OS acrylic; no driver sees it. Composition, layout,
  type, hierarchy, spacing and state only. This repo has paid the
  read-an-artifact-as-a-finding bill nine times.
- **A missing capture is a failed run, not an absent surface.** `inspect` prints
  `CAPTURED n/11`; if a file is absent, read the output rather than judging.
- **Two run-2 claims are refuted — do not act on either.** *"The app has no icon
  vocabulary"* is false (measured 1:1 viewBox-to-pixel at `strokeWidth 1.4`).
  *"Group the commands by purpose / give each row a leading icon"* is not buildable
  (no category field; the list is a hand-authored fixture). Owner call 15.
- **The reference table is the authority** for which `linear/` file judges what —
  `linear-features.png` judges *Titlebar + docks*, settled by #149 against earlier
  `.context/` prose.
- **Owner call 14 (the stop signal) is unanswered and still (a).** Two
  agent-reachable answers were refuted cross-model as post-hoc goalpost movement.
  Under (a) a run stops on `plateau >= 3` or the budget, and nothing else.
- **Owner call 20 is open and is NOT decided here.** The plateau counter treats a
  regression and a stall identically. The preset's rule is literal — *improved →
  `plateau: 0`, otherwise `plateau += 1`* — and this run **follows the written
  contract as-is**. Following the contract needs no warrant; changing it mid-run
  would need one, and would also destroy comparability with runs 1 and 2.
- **Do not push** (D6). Not `main`, not the branch, not on a ticket's own
  acceptance. Standing, and pressure-tested under the AFK grant rather than
  overridden by it.

## Piece -> capture -> reference map

`inspect:` writes **eleven** files. Each piece gets its own surface capture **plus** the
whole-window frame it lives in — a surface clipped to its own bounding box cannot answer a
composition question, and every `.gauntlet/bar/linear/` reference is a whole-page frame.
Boxes below are wave 1's measured values (the rail is 248px wide since run 2).

| piece | surface capture | window frame | bar reference | box in frame |
|---|---|---|---|---|
| Welcome | `welcome.png` | `window-welcome.png` | `linear/linear-method.png` | x0 y48 w1440 h852 |
| Titlebar | `titlebar.png` | `window-session.png` | `linear/linear-features.png` | x0 y0 w1440 h48 |
| Sidebar | `sidebar.png` | `window-session.png` | `linear/linear-home-hero.png` | x0 y48 w248 h852 |
| Chat | `chat.png` | `window-session.png` | `linear/linear-changelog.png` | x248 y48 w1192 h720 |
| InputBar | `input-bar.png` | `window-session.png` | `linear/linear-home-product.png` | x248 y768 w1192 h132 |

**THREE images per critic, never four.** Run 1 wave 2 lost a critic to context length at
five images; its trimmed retry produced that run's one false `YOURS WINS`, corrected at
wave 3. So `identity/frost-mono-reference.png` rides as **text** (constraint 2 below), not
as a fourth image. The exact wave-1 prompt is saved at
`.gauntlet/waves/1/critic-prompt.md` — run 1 recorded "wave 3's exact critic prompt was
not recoverable" as a deviation; do not repeat it.

**A missing file is a failed run, not an absent surface.** `inspect` prints `CAPTURED n/11`.

## Binding constraints — hand these to every builder and every critic

Assembled by run 1 at seed from `.gauntlet/bar/README.md` and `.claude/vibe.md`. **Not up
for re-litigation by a wave.** Line references re-verified at wave 1 and two had drifted.

**For the critic:**

1. **Colour, translucency and material are OUT OF SCOPE for any verdict.** The wash is
   `oklch(0.12 0.008 210 / 0.64)`, composited by Windows over OS acrylic, and no driver
   sees a DWM backdrop. The flat grey ground in every capture is an **instrument artifact,
   not a defect** — run 1's smoothing pass proved it by measurement (window captures are
   RGBA at dominant alpha 163/255 = 0.639, exactly the authored wash; the reference is
   alpha 255 everywhere). Judge composition, layout, type, hierarchy, spacing, state, copy.
2. **The identity mark is SOLID BY DESIGN — no glyph, ever.** Verified three ways in
   source. Mark *depth* is a different question and is fair game.
3. **No defect list is supplied, on purpose.**
4. **DESIGN.md is STALE where it names the titlebar's right side, and stale in the spec's
   own favour — do not re-report it.** ⚠️ **CITED BY SECTION, NEVER BY LINE.** #138's rule
   is *name the section*, and the line numbers this constraint used to carry (80/82, and
   59/61 before that) drifted twice and had to be repaired both times — see adjudication
   3.9 item 4. The sentence lives in **`## Layout`, the `Titlebar:` bullet**, and still
   reads *"Right: the Agents-dock toggle, then a hairline separator, then min / max /
   close"* — true when Agents was the only dock. **Three** toggles ship today
   (`Titlebar.tsx` `CommandsToggle`, `AppearanceToggle`, `AgentsToggle` — re-verified at
   waves 1 and 3), and the **same `## Layout` section's `Appearance dock:` bullet** already
   calls it the *"third right-slot panel"*, so the document contradicts itself two bullets
   apart. The **count** is agreed and is **not** a break; how well the group is
   **composed** is fair game. Run 1 wave 1 got a `SPEC BREAK` here and refused it against
   source.
5. **Two run-2 claims are refuted — do not act on either.** *"The app has no icon
   vocabulary"* is false — re-confirmed at wave 1 by measurement: all three titlebar
   toggles share one `glyph` const (16x16 viewBox, round caps, `currentColor`) at
   **`strokeWidth: 1.3`** (`Titlebar.tsx:192`). ⚠️ **The old brief cited 1.4; the source
   says 1.3.** *"Group the commands by purpose / give each row a leading icon"* is not
   buildable (no category field; the list is a hand-authored fixture). Owner call 15.

**For the builder:**

6. **D3 — the stylesheet pins are literal-text and brittle.** A wave MAY edit
   `src/renderer/src/styles/`, but: three tests scan the **whole** `styles/` directory; no
   comment may contain a closing brace; no scrollbar rule may be component-scoped;
   `.bubble` and `.message-input` stay ungrouped; **`.bubble {` must stay the FIRST literal
   match of that string in `chat.css`**; **exactly ONE `backdrop-filter` in all of
   `styles/`** — re-verified wave 1, it is `subagent.css:122` (`.subagent-drawer`) — and
   `gui-98` criterion 5 is *positive*, never soften it to clear a red; the `@import` order
   in `styles.css` IS the cascade, so add rules inside a file and never reorder;
   `theme.test.ts` allows hue and accent-chroma movement but **no lightness and no alpha**.
   Token names are `--fs-micro` and `--danger-text`.
7. **D4 — any CSS change owes a driver pin.** jsdom loads no CSS, so an unknown `var()`
   resolves silently to nothing and every raw-text pin still passes. An existing
   `gui-*.mjs` covering the change discharges this; a new driver is not required.
8. **#125's glass exception is ONE named pane and is explicitly not a precedent.**
9. **One scale, stated as a ratio** (DESIGN.md ~line 57): a size belongs to the system when
   it lands within half a pixel of `15 x 1.15^k` for whole k. That half pixel is not slack.
10. Close **one** named gap. Do not redesign, do not touch other pieces.

**For the wave:**

11. **D7 — the gate is green on all three:** `npm run typecheck`, `npm test`,
    `npm run build`.
12. **A wave must be GREEN before it commits.** A red wave **reverts its piece and records
    the gap** rather than committing red.
13. **D6 — no pushing to `origin` on a leg's own initiative.** Land locally and say so.

## Verdicts

Wave 1 is a **BASELINE** and its five rows **cannot count toward plateau** — there was no
prior verdict in this run to improve on, so `plateau` stays 0. This is the same rule run 1
applied to its wave 1 and run 2 applied twice (wave 1, and wave 4 for a piece added later).

| wave | piece | verdict | biggest gap |
|---|---|---|---|
| 1 | Welcome | BAR WINS | Recompose the small four-item centred stack into a 760px two-column hero: left-align the 46px headline, copy and CTA, then place a ~96px solid identity mark opposite them so the empty field gains deliberate scale and balance. **PARTLY UNBUILDABLE AS WRITTEN — see adjudication 3.** The left-align is fair; the 760px column overflows the 640px minimum window by 120px, and a 96px mark eats 52 of the 69.71px measured headroom. |
| 1 | Titlebar | BAR WINS | Promote the centred "inspect-ws" session title to the 15px type rung while keeping the status pills at 11px, so the current-session context clearly outranks backend state instead of reading as the chrome's quietest label. *(NEW axis — run 1 spent four waves on the three glyphs' icon family; run 2's `IconHousing` landed there and the critic has moved on.)* |
| 1 | Sidebar | BAR WINS | Replace the one-line session-title clamp with a consistent two-line title area above the timestamp, so the five rows reveal enough distinguishing text instead of all collapsing into ellipsis stubs while most of the rail stays empty. *(NEW axis, and the strongest gap of the wave — it spends the empty rail on legibility instead of treating emptiness and truncation as two problems.)* |
| 1 | Chat | BAR WINS | *(as returned)* "Set transcript body copy to regular weight with the specified 1.6 leading, reserving semibold for true headings or explicit emphasis." **REFUTED AGAINST SOURCE — adjudication 2. Do not hand this to a wave-2 builder.** Substitute gap, from the independent native-resolution critic on identical pixels: **render each assistant turn as one contiguous block with a single avatar, indent its tool cards beneath that block, and tighten internal gaps instead of restarting full message spacing and a new avatar for every prose-and-tool segment.** |
| 1 | InputBar | BAR WINS | Recompose Effort and Model as one evenly spaced utility row aligned to the input pill's inner edges instead of a tight cluster floating under only its right half, and pull the disclaimer upward to remove the resulting dead vertical space. *(Both critics converged on this axis independently, and it is the third independent raising across runs — run 1 wave 4 named the same strip.)* |
| 2 | Welcome | BAR WINS | *(as returned)* "Recompose the welcome as a centered 480px stack by center-aligning the mark, headline, supporting copy, and button and placing the stack's midpoint at y426, because the current left-anchored cluster leaves the visual weight above and left of the window's center." **CONFIRMED BY MEASUREMENT on the horizontal, REFUSED on the vertical — adjudication 2.1.** The horizontal half is real and is this wave's headline finding; the vertical half re-raises the authored placement wave 1's FINDING 5 proved deliberate. **Wave 3's gap is neither: it is the root-caused fix that satisfies BOTH critics at once** — size the hero's grid track to the hint's *painted* width instead of its 480px `max-width`, which keeps wave 2's shared left edge and restores centring. |
| 2 | Titlebar | BAR WINS | **NEW axis — the wave-1 gap closed and the critic moved off it.** "Separate the `Wisped` and `Bypass` pills from the app-name lockup with a 16–24px group gap or relocate them to the utility side, because their current near-touching sequence makes identity, backend state, and action read as one undifferentiated cluster." **CONFIRMED BY MEASUREMENT:** the left-side ink groups are mark `x14..35`, app name `x46..142`, `Wisped` `x152..209`, `Bypass` `x220..275` — gaps of **10 / 9 / 10px**, three identical intervals, so nothing separates identity from state. ⚠️ Carry adjudication 2.2 (the rung-role spec conflict) into any Titlebar work. |
| 2 | Sidebar | BAR WINS | *(as returned)* "Clamp every session title to two lines and place it with its timestamp in one fixed-height row shell, so the five entries share a consistent vertical rhythm instead of jumping between two- and three-line heights." **REFUTED BY MEASUREMENT — adjudication 2.3. Do not hand this to a wave-3 builder.** Every row carries exactly two title lines, and the rhythm got *more* uniform, not less. Substitute gap, from the smoothing pass's finding 3: **give the session row a corner proportionate to its new height** — it grew 17px to 74px while its 8px radius did not move, making it the app's flattest-cornered box at r/h 0.108 and overtaking the tool card's 0.111 with no radius decision ever taken. |
| 2 | Chat | BAR WINS | *(as returned)* "Set all conversational prose and user-bubble copy to the specified 400 body weight..." **REFUTED — the FIFTH raising of this thread across three runs, now refuted on pixels as well as source. Adjudication 2.4.** **No substitute gap exists, so Chat gets NO BUILDER in wave 3** — the smoothing pass measured the piece as coherent after this wave and returned no Chat finding, and a builder handed no gap is redesigning. |
| 2 | InputBar | BAR WINS | *(as returned)* "Center the Effort and Model controls in one compact row... instead of pinning two tiny clusters to opposite edges across a large empty span." **REFUSED on the smoothing pass's cross-surface measurement — adjudication 2.5.** The 492px middle is real, but the change *fixed* a 235.5px off-centre error and made the strip share the transcript's 760px measure to the pixel. The residual is **content density — two controls in a correct 760px measure — which is a product question, not a layout one, and is an owner call.** Third distribution asked for by the third critic on this strip; the axis is exhausted. |
| 3 | Welcome | BAR WINS | **The wave-2 gap CLOSED and was VERIFIED BY PIXEL — see 3.2.** New gap *(as returned)*: "The welcome cluster is centered about 60px above the usable content area's vertical midpoint but has no lower visual counterweight… move the entire cluster down roughly 50–60px." **NOT REFUSED THIS TIME — ESCALATED (adjudication 3.3).** Its arithmetic is exact (ink centre y365.5 against pane centre y426 = 60.5px) and **it lands on the identical y426 wave 2's critic independently computed**, which is precisely what *symmetric* padding produces. Two critics, two waves, different pixels, same number. This is an **owner call**, not a builder gap, and Welcome gets **NO BUILDER** in wave 4. |
| 3 | Titlebar | BAR WINS | **The wave-2 gap CLOSED, width-neutrally, verified by pixel diff — see 3.2.** New gap *(as returned)*: "Give the 22px identity mark one restrained depth cue… so it reads as an intentional brand object rather than a flat UI swatch; keep the mark solid and glyph-free." **ADMISSIBLE AND STRONG** — constraint 2 leaves mark *depth* explicitly open, and this is an independent critic arriving from the bar side at wave 1's FINDING 3, which measured interior mint stddev **0.00 / 0.05 / 0.09** against the identity reference's **9.02 / 7.01 / 3.65**. ⚠️ Cross-surface: the mark paints at three sites and is one shape at two sizes (r/side **0.3182** both). Guard: **no second mint hue.** |
| 3 | Sidebar | BAR WINS | **The wave-2 gap CLOSED — r8 -> r16 confirmed twice by pixel (3.2).** New gap *(as returned)*: "The rail's primary content does not begin until about y=225, so roughly 26% of its 852px height is spent on pre-list status and controls; compress that stack to about 150–160px… so the first session moves up by roughly 65–75px." **NEW AXIS, third distinct one in three waves, arithmetic checks (225/852 = 26.4%).** Carry finding 1 (the row-vocabulary split this wave's own ownership rule bought) and finding 4 (the selection stripe lost 16 points of its run) into any Sidebar work. |
| 3 | Chat | **TOO CLOSE** | **THE RUN'S FIRST VERDICT MOVEMENT, on a piece with NO BUILDER and byte-identical surface pixels — adjudication 3.1.** New gap *(as returned)*: "Increase the transcript's top inset from roughly 13px to 24px; the first user bubble currently crowds the titlebar." **NEW AXIS, BUILDABLE, AND ON THE SPEC'S OWN NUMBER** — DESIGN.md's Layout section sets the transcript rhythm at "24px vertical gaps". **This refutes adjudication 2.4's pessimistic prediction**: the critic did NOT raise prose weight a sixth time, so Chat's instrument was not exhausted. **Chat gets a builder in wave 4**, reversing wave 2's call. |
| 3 | InputBar | BAR WINS | *(as returned)* "combine both groups into one right-aligned cluster no wider than about 300px, while leaving the disclaimer centered below." **REFUSED — this is the FOURTH distribution rearrangement asked by the FOURTH critic across two runs, and adjudication 2.5 already declared the axis exhausted.** It is now also refused against the **SPEC**, not merely a measurement: DESIGN.md's Layout section authorises "Chat column: max-width 760px, centered", so re-clustering to ~300px would hide the app's own authored measure. Substitute gap: **smoothing finding 3, the 5px seam** (below). |
| 4 | Welcome | BAR WINS | *(as returned)* "The welcome stack is vertically under-anchored… move the entire stack down roughly 55–60px." **THE THIRD INDEPENDENT RAISING OF THE SAME OWNER CALL, by a third critic on a third wave, and the run's most-repeated single finding.** Its arithmetic reproduces exactly (hero ink y242..489, midpoint 366.0, capture centre 426, displacement **−60.00px**, measured identical in waves 3 and 4). Still **NOT a builder gap** — adjudication 3.3 escalated it and the default (the reserve stands) is unanswered. **Welcome gets no builder in wave 5 for the third wave running**, which is a piece blocked on a human rather than plateauing on the instrument. See 4.3. |
| 4 | Titlebar | **TOO CLOSE** | **THE RUN'S SECOND VERDICT MOVEMENT, and the mirror image of wave 3's — it landed on the ONE piece whose own surface changed (adjudication 4.1).** New gap *(as returned)*: "give the square a restrained depth cue, such as a 1px inset edge plus a 2px soft shadow." The critic is still on the mark axis and wants MORE depth after getting some, which is coherent. **But do NOT read it as "raise the alpha": the smoothing pass proved the wave's own 6.41 target arithmetically unreachable and found a better gap — one alpha is painting THREE different finishes (4.4, finding 2).** Wave 5's Titlebar gap is equalising the finish across the three shapes, not deepening it globally. |
| 4 | Sidebar | BAR WINS | *(as returned)* "Compress the background-session empty state into a single status/action row and tighten the filter, scope, and path stack so the first session begins near **170px**." **SAME AXIS as wave 3, sharper number, and the wave's build for it was REVERTED on a test fence (4.5).** What the reverted attempt proved: the critic's own named mechanism (fold onto the head row) is **refuted on width arithmetic** (224px content row; title ~105 + Refresh ~58 + gaps 16 = 179, leaving ~45, against ~92 needed for "None running here"), while **pure in-place tightening reaches ~175px** against the asked 170. That is wave 5's gap, and it needs no fenced relocation. |
| 4 | Chat | **TOO CLOSE** | **HELD at TOO CLOSE on near-identical pixels — the first positive evidence that wave 3's movement was not a one-off (4.2).** New gap *(as returned)*: "make default assistant prose visibly regular-weight and reserve the heavier weight for intentional emphasis." **THIS IS THE SIXTH RAISING OF THE PROSE-WEIGHT THREAD, and adjudication 2.4 left a standing instruction for exactly this: report it as a PLATEAU SIGNAL on this surface rather than refuting it a sixth time.** Reported as such — but see 4.7, because the signal is CONFOUNDED: this critic provably cannot see the top ~89px of the transcript, so the axes available to it are narrower than the surface is. **No builder in wave 5.** |
| 4 | InputBar | BAR WINS | *(as returned)* "Group Effort and Model into one right-aligned utility cluster… with about 20px between controls." **REFUSED — the FIFTH distribution rearrangement asked by the FIFTH critic across two runs, on an axis declared exhausted at 2.5 and refused against the spec at 3.8.** Its real gap remains the **5px seam**, whose canonical fix this wave built and lost: `scrollbar-gutter: stable both-edges` reddened `gui-51` and `gui-98` (4.5). **The surviving form is the COMPOSER side, in `composer.css`, and it is now the only unrefuted one.** |
| 5 | Welcome | BAR WINS | *(as returned)* "Translate the entire stack downward by about 60 px so it sits on the content area's actual midpoint." **THE FOURTH INDEPENDENT RAISING OF THE SAME OWNER CALL, by a fourth critic on a fourth wave.** Its arithmetic reproduces again (block centre ~y414 against content centre ~y474 = 60px, the identical number waves 2, 3 and 4 computed). Still **NOT a builder gap** — 3.3 escalated it and the default (the reserve stands) is unanswered. **Welcome has now gone four waves with no builder, blocked on a human rather than plateauing on the instrument.** |
| 5 | Titlebar | BAR WINS | **FELL BACK from TOO CLOSE on a BYTE-IDENTICAL capture — adjudication 5.1.** New gap *(as returned)*: "The left titlebar cluster overruns the structural column below it: the `Bypass` pill ends around x=276 while the Sessions rail divider is at x=247. End the left group at least 12–16px before the divider." **NEW AXIS, and the first Titlebar gap of the run that is NOT about the mark** — it is a cross-surface alignment observation the critic could only make because it reads the whole window frame. Buildable and cheap. ⚠️ Check it against `gui-136`'s flank-equality pin before building: the left flank's min-content floor is load-bearing at the 640px minimum window and wave 3 measured only 3.25px of slack there. |
| 5 | Sidebar | BAR WINS | *(as returned)* "The active session reads as a chat bubble dropped into a navigation list: reduce its corner radius from roughly 18px to about 8px and match its vertical padding to the unselected row shell." **THIS ASKS TO UNDO WAVE 3'S LANDED BUILD**, and it arrives independently of the smoothing pass reaching the same place from the other side (5.2, finding 2). Not acted on by this leg — reversing a landed build on one critic's say-so is exactly the oscillation the run guards against — but it is now **TWO independent signals against r16 on rail rows**, and because wave 5 unified the token the question is one edit for all three row types. Wave 6's call, with the arithmetic in 5.2. |
| 5 | Chat | BAR WINS | **FELL BACK from TOO CLOSE on a BYTE-IDENTICAL capture (5.1).** New gap *(as returned)*: "Reduce assistant paragraph copy to regular 400 weight while keeping its current size and leading." **THIS IS THE SEVENTH RAISING OF THE PROSE-WEIGHT THREAD.** 2.4's standing instruction fires again: reported as a plateau signal, not refuted an seventh time. Still confounded by 4.7's instrument gap — the critic cannot see the top ~89px of the transcript, re-confirmed unchanged this wave (thumb y79..716, ~89.3px above the viewport). **No builder in wave 6.** |
| 5 | InputBar | BAR WINS | *(as returned)* "Put both groups into one compact left-aligned cluster no wider than about 320px." **REFUSED — the SIXTH distribution rearrangement asked by the SIXTH critic across two runs.** Axis declared exhausted at 2.5, refused against the spec at 3.8, refused again at 4.10. The spec authorises "Chat column: max-width 760px, centered" and a ~320px cluster would hide the app's own authored measure. **Its real gap is now 5.3: the seam this wave closed in the captured state was RELOCATED rather than removed, and the state that exposes it is one no capture holds.** |

## Wave 1 adjudications

**Verdict spread: 5/5 `BAR WINS`. Zero `SPEC BREAK`s. `critic_degraded: false`.**
Eleven agents: five critics at native resolution (one died), five at half resolution, one
smoothing pass.

### 1. The instrument was running at the context ceiling for every critic, and the fix was uniform rather than a trim

The Sidebar critic died with `"Prompt is too long"` / `invalid_request` after one read. The
cause was **not** an unusually large payload: all five `linear/` references are the same
3360x2100 (~9.4k image-tokens), so with the 1440x900 window frame every critic carried
~11k image-tokens before its own reasoning. Four survived by a margin; one did not.

Run 1 wave 2 hit this identical wall and answered it with a **trimmed retry for the one
casualty** — which produced that run's only false `YOURS WINS`, corrected two waves later.
That trap was avoided here. Instead every reference was downscaled to **1680x1050** and
**all five critics were re-run**, so the payload stayed identical across pieces.

**That bought a control, and the control passed.** The four pieces that ran at *both*
resolutions returned **the same verdict at both** (`BAR WINS` × 4), from independent
critics. So the downscale did not bias the instrument, and Sidebar's recovered verdict is
comparable to the other four. The half-resolution sweep is the wave's record because it is
the only set where all five share one instrument.

`.gauntlet/bar/` was **never modified** — verified by sha256 on all seven bar files before
and after, plus a clean `git status .gauntlet/bar/`. The half-scale copies are derived files
under `.gauntlet/waves/core-after-docks/1/bar-half/`, produced by
`.gauntlet/scratch/downscale-bar.js` through Electron's `nativeImage` (already a dependency,
so no image library was added). A bar that drifts under a loop is not a bar.

### 2. The Chat gap is the FOURTH re-raising of a thread DESIGN.md explicitly closes, and it describes a state the app already ships

The returned gap asks for transcript body copy at "regular weight with the specified 1.6
leading". Measured against source, that is **already what ships**:

- `src/renderer/src/styles/chat.css:216-217` — `font-weight: 400; line-height: 1.6`
- `DESIGN.md:54` — "Weights: **400 body**, 600 app name, headings and bubble-less emphasis"
- `DESIGN.md:56` — "*Read this before re-raising it as a missing weight step — three review
  waves did.*"

So the gap requests a change that is indistinguishable from the current state, and it is the
fourth wave across three runs to raise it. **The verdict still stands** — a critic grades the
artifact, and the soundness of its verdict does not depend on the soundness of its gap. Only
the gap is refused, and a builder gets the native-resolution critic's grouping gap instead:
an independent critic, the identical pixels, an axis run 1 wave 4 also reached
(paragraph-to-card and completed-turn rhythm).

### 3. The Welcome gap is half-buildable, and `inspect` measured the half that is not

The gap wants a 760px two-column hero with a ~96px identity mark. This wave's own capture
output bounds both numbers:

- `MINIMUM {"asked":{"width":640,"height":480},"got":{"width":640,"height":480}}` — the app
  supports a 640px-wide window, so a **760px column overflows the minimum pane by 120px**.
- `MIN-PANE {"pane":{"w":640,"h":432},"padding":{"top":32,"bottom":81.6},...}` with
  `HEADROOM {"measured":69.71,...,"content":248.69,"overflow":0}` — and the arithmetic is
  exact: `432 − 32 − 81.6 − 248.69 = 69.71`. Growing the mark from its measured **44px** to
  96px spends **52 of those 69.71px**, leaving ~17.7px for everything else.

**The left-align is fair game and is the buildable half.** The 760px column is not
buildable at the minimum window, and the 96px mark is only buildable if the min-window case
is handled separately. A wave-2 Welcome builder takes the alignment and composition idea and
leaves the two hard numbers alone. Note also that the 46px headline the gap asks for is
already prescribed and shipped — `DESIGN.md:69` names 46 as `--fs-display`, "the Welcome
headline, which is the only headline in the app".

### 4. Two critics on identical pixels named different "biggest" gaps for the same piece — which is information, not noise

Welcome's native-resolution critic named a **copy** gap; its half-resolution critic named a
**layout** gap. Chat's two split the same way (grouping vs weight). Both pairs saw
byte-identical captures. This is the honest reading: "the single biggest gap" is a ranking,
and two independent judges can rank two real gaps differently without either being wrong.
It is also why the refuted Chat gap could be replaced without inventing anything — a second
critic's gap on the same pixels was already in hand.

### 5. Every literal checked out, and the leg checked them against its own read of the pixels first

The leg read `titlebar.png`, `input-bar.png`, `sidebar.png`, `welcome.png` and `chat.png`
itself **before** opening any verdict. Every critic's literals then matched that read, with
no factual errors across all nine returning critics — including the unguessable ones: the
`Wisped` and `Bypass` pills, the centred `inspect-ws` title, `12 sessions outside this
project`, all five row truncations with their ellipses (`Why does the sessions rail go ...`,
`Rewriting the tool card so a lo...`, `Add the queued send flag to t...`, `Why does the
Agents dock bla...`, `Window bounds are remembe...`), the ages `1h/3h/7h/2d/5d`, the
truncated temp path, `"Default"` appearing exactly twice, both tool-card paths, all four
disclosure labels, and the `4/3/1` prose line counts. The Welcome critic's "~44 × 44px" mark
matches `inspect`'s own `welcome-mark h:44`, and the Titlebar critic's "six icon-only
controls" is the correct count (three toggles + three window controls).

**One claim the leg could not confirm and does not rely on:** the Chat critic reported "a
thin vertical scrollbar at the far-right edge". Nothing in the wave rests on it.

### 6. A capture path collision was found and fixed — run 1's evidence was overwritten and restored

`inspect` was first pointed at `.gauntlet/waves/1/`, which is **run 1's** wave-1 directory
(committed at `db9dd19`); run 1 never namespaced its waves, while run 2 did
(`waves/docks-and-min-window/<N>`). The overwrite was caught by `git status` showing seven
tracked PNGs as modified, and run 1's files were restored from `db9dd19`. **Run 3 namespaces
its captures at `.gauntlet/waves/core-after-docks/<N>/`** — do not write to bare
`waves/<N>/` again.

### 7. Constraint 4's line references had drifted, and were corrected

DESIGN.md grew during run 2. The stale titlebar sentence moved from line **59 to 80**, and
its self-contradiction from **61 to 82**. The substance is unchanged — three toggles ship
(re-verified in `Titlebar.tsx`), the count is agreed, composition is fair game — and the
binding-constraints section above now carries the corrected numbers. Also re-verified this
wave: **exactly one `backdrop-filter`** in `styles/`, at `subagent.css:122`.

### 8. The smoothing pass: `SEAMS VISIBLE`, identity floor `HOLDS`, one type scale holds — all on numbers

It ran 28 Bash calls and 11 Reads over ~29 minutes, wrote its own PNG decoder, and measured
rather than asserted. Everything below was independently re-verified by this leg where it
touched source.

**Identity floor HOLDS on every count.** The ground is **two authored plies**, not a flat
fill: content surfaces sit at modal `RGB(3,6,6)` at alpha `163/255 = 0.639` (the authored
wash `oklch(0.12 0.008 210 / 0.64)` converts to `RGB(3,6,7) @ 163` — a match to one unit of
blue), while the chrome rails sit at `RGB(11,15,17)` at alpha `216/255 = 0.847`, which is
**arithmetically exactly** `--surface(0.58)` source-over `--wash(0.64)`:
`0.58 + 0.64 × 0.42 = 0.8488 → 216.4 → 216`. That independently reconfirms run 1's
compositing-artifact result by a different route. Mint is **one** accent at **six** painted
sites, every surface far under the 10% ceiling — worst case `welcome-min-window` at
**3.835%**, i.e. 39% of budget; on Welcome the strict match catches 10,605 of 11,422
mint-cast pixels and the 817-pixel remainder is antialiasing, not a second hue. Exactly one
`backdrop-filter`, `subagent.css:122`.

**One type scale holds.** Distinct rendered sizes across the five surfaces are
**11, 13, 15, 17.25, 46** — every one a rung of `15 × 1.15^n`, with rungs 3–7 deliberately
skipped because the app has exactly one headline. Authoritative rather than eyeballed: all
**67** `font-size` declarations in `styles/` are either a token or documented arithmetic on
one. **Exactly one literal exists** — `subagent.css:168` `font-size: 20px`, which is *not* a
rung (19.84 is, 0.16px away). Verified first-hand. It lives on `SubagentDrawer`, an
**uncaptured** surface, so it is measured drift and **cannot be a wave-1 finding**.

**FINDING 1 — a cross-surface geometry seam no single-surface critic can see.** Three
stacked containers in one column carry three radii whose order does not track size: composer
pill 760x48 at **r24**, user bubble 456x72 at **r16**, tool card 568x108 at **r12**. The tool
card is the *tallest* of the three and carries the *smallest* corner, so the defensible
"radius scales with box" reading fails. Measured from first-row fill insets (18–21 / 14 / 9px,
which back out to 24 / 16 / 12). This is precisely what the smoothing slot is for — r24
belongs to InputBar, r16 and r12 to Chat.

**FINDING 2 — the radius vocabulary is the one system this codebase never named.** Thirteen
distinct corner values ship across the in-frame stylesheets (1, 4, 5, 6, 7, 8, 10, 12, 14,
16, 24, 50%, 999), **eleven of them bare literals** (`8px`×11, `6px`×6, `50%`×6, `4px`×3,
`12px`×3, `10px`×3, `5px`×2, `24px`×1, `1px`×1) — in a codebase that tokenises seven tint
steps and documents the 1.15 type ratio in a 30-line comment. Systemic form of finding 1.

**FINDING 4 — the four-wave titlebar-glyph argument is now a measurement.** Run 1 spent four
waves on critics saying the three toggles were "optically mismatched" and builders disputing
it. Measured: same 28px housing, same shared `glyph` const, same 12px ink band — but ink
**27px (Commands `/`) vs 79px (Agents) vs 82px (Appearance)**, because
`Titlebar.tsx:210` is `<line x1="10.3" y1="3" x2="5.7" y2="13" />`, spanning **4.6 of the
16px grid where both siblings span ~9.9**. Verified first-hand. And **spacing is not the
problem** — centre pitch is exactly 30/30px for the toggles, 40/40px for the window buttons,
and the separator is symmetric to 0.5px. So the open question conceded by constraint 4
(composition, not count) has a one-line cause: **ink weight alone**.

**FINDING 3 — the mark is mathematically flat where the identity FLOOR gives it depth.**
Interior mint stddev: app titlebar mark `0.00/0.00/0.00`, welcome mark `0.05`, assistant
avatar `0.09`; the same marks in `identity/frost-mono-reference.png` measure
`9.02/7.01/3.65` and `9.40/7.33/3.83` — a ~45-level gradient across the face. Flat at all
three sites, so systematic rather than one asset. **This is admissible**: it is the mark
*depth* question constraint 2 explicitly leaves open, not the answered glyph question, and it
reports variance rather than hue. **Guard for any builder:** the one-accent floor is measured
at one hue, so a depth treatment must not introduce a second mint.

**FINDING 5 — Welcome's high placement is AUTHORED, and run 1 spent waves arguing with a
deliberate value.** The hero is a fixed 248px block; `padding: 32px 32px min(152px,17vh)` +
`justify-content:center` **predicts** a 66.85px top margin at the minimum window and 242px at
default, and both were **measured at 67 and 242**. Horizontal centring is exact (ink midpoint
719.0 vs pane centre 719.5). The real consequence is **proportion**: the block occupies 29%
of pane height at default and **57% at minimum**, and the same 10,604 mint pixels go from
0.864% to 3.835%. This independently corroborates adjudication 3 — Welcome is the one surface
where a mint-growing or size-growing change can actually bind.

**FINDING 6 — NOT-FINDINGS, recorded so wave 2 cannot refile them.** (a) The composer footer
is **correct** on the baseline: three separate bands, the strip's right edge and the pill's
right edge both at x1223, the disclaimer's ink centre and the pill's centre both at x843.5,
both value readouts wearing the same hairline shell, the `Model` label present, and every
authored gap reproducing (6/6/20/6 inside the strip, 4 above, 17 below). (b) `Refresh` and
`Show all projects` already share one shell (`.sidebar-empty-retry`). (c) The titlebar pills
are one system, and `.control-value` in `composer.css` is property-for-property identical to
them — declared separately on purpose, **not drifted**. (d) Tool-card disclosure rows use a
fixed slot order; the two cards differ only in which subset they hold. (e) The icon
vocabulary **is** unified by one shared `glyph` const. (f) The chat column is coherent —
prose measure 567px against tool-card width 568px, both left-aligned at x252. (g) **The date
divider EXISTS** (`Chat.tsx:363-366`, `TODAY` between two hairlines, verified first-hand) and
is missing from the capture only because the transcript is scrolled to the latest turn.

**(g) is an instrument gap, not a missing feature — and it is worth fixing.** The bar's own
manifest assigns `linear-changelog` to judge *"Chat transcript: long-form reading, **date
dividers**"*, so the capture cannot currently show one of the two criteria its own reference
was chosen for. A future wave may add a scrolled-to-top chat capture; note that changing
`inspect`'s file set breaks SHA null-control comparability with waves 0–1, so it is a
deliberate instrument change, not a tweak.

### 9. Finding 0 — the smoothing pass caught a race THIS LEG created, and its conclusion is right while its inference about the critics is refuted

**What happened, plainly: this leg moved files out from under a running agent.** At 18:43:11
it restored run 1's captures into `.gauntlet/waves/1/` (adjudication 6) while the pass-1
**smoothing agent was still reading that directory**. The leg had explicitly waited for both
*critic* passes to finish and forgot the smoothing agent was still live. That is a real
sequencing error and it cost the agent five measurements, which it had to withdraw.

**The smoothing pass detected it and self-corrected** — it noticed the directory change,
found `.gauntlet/waves/core-after-docks/1/`, and verified those 11 files SHA256-identical to
`.gauntlet/scratch/run3-seed-control/` before re-measuring. That is the "measure, do not
assert" discipline saving its own analysis.

**Its recommendation — treat the per-surface verdicts as unscored and re-run — is refused,
on evidence.** The critics' PART A literals date their own pixels:

| | run 1 (`waves/1`) | run 3 baseline | what the critic reported |
|---|---|---|---|
| Sidebar | 254x852 | **248x852** | "The capture is **248 px wide by 852 px tall**" |
| InputBar | 1186x113 | **1192x132** | "The capture is **1,192 × 132 pixels**" |

Two critics independently reported dimensions that are run 3's and **cannot** be run 1's.
Independently again: smoothing measured the stale file's composer as collapsing "into one row
with **no Model label** and no effort shell", yet **both** InputBar critics reported the
`Model` label present between two `Default` capsules. The critics graded the correct pixels;
all five verdicts stand. **This is the payoff of making PART A come first and be
unrevisable** — it turned an unfalsifiable worry into a decided question.

**One accidental result worth keeping, stated precisely.** The withdrawn measurements amount
to a free A/B of run 1 **wave 1** against the current baseline, and it reproduces the
narrowing the seed measured (rail **254 → 248**, chat and input-bar taking the 6px). Note the
interval: `waves/1` is run 1's *wave 1*, not its wave 5, so this spans run 1's own five waves
**plus** run 2 and **cannot** isolate run 2's contribution. It corroborates the seed's
direction, not its attribution.

### 10. The sixth piece was PROPOSED and is PARKED as an owner call — adopting it would edit the bar

The smoothing pass proposed **ToolCard**, and the case is strong: finding 1's radius seam
spans two pieces and no per-surface critic can see it; two cards sit measurable in the
baseline `chat.png` at 568x108 and 568x109, left-aligned at x252 on the `--surface` ply;
`tool-card.css` contributes its own radius set to finding 2; and `linear-changelog` is
already the assigned transcript reference. It also distinguishes itself from the AgentsDock
mistake correctly — it is measurable *now*, whereas Agents was blocked and cost run 2 six
pixel-identical waves.

**It is parked anyway, and the reason is structural rather than a doubt about the piece.**
`.gauntlet/bar/README.md` currently lists ToolCard under *"Still uncaptured, and so out of
reach of any wave."* That line is not description, it is a **scoping rule**, and adopting the
piece means rewriting it. A loop body that edits the boundary of its own scope has no
boundary — and the bar is the one human-owned fact this preset rests on, changed through
`/preset bar`, not as a side effect of a wave. The smoothing pass reached the same place
itself: *"it should be corrected deliberately rather than as a side effect."*

**Nothing is blocked by parking it.** Findings 1 and 2 are cross-surface consistency work,
which is the smoothing slot's own remit — wave 2 can act on the radius seam by handing the
Chat and InputBar builders one coordinated constraint, with no new piece and no bar edit.

**For the owner, in one line:** adopt `ToolCard` as the sixth piece and correct that
README line, or leave the slot empty and let the radius seam be handled as cross-surface
smoothing work. Default taken meanwhile: **leave it empty, handle the seam as smoothing.**

### 11. What wave 2 inherits

| piece | wave 2 gap | trap |
|---|---|---|
| Welcome | left-align / recompose the hero stack | **Never touch the button label** — `"Pick a project folder"` is pinned by **40** GUI drivers. The headline is pinned by none, and the supporting sentence only by `Welcome.tsx:32`. Do not build the 760px column or the 96px mark (adjudication 3). |
| Titlebar | promote the centred session title to the 15px rung, pills stay 11px | Any new size must land within half a pixel of `15 x 1.15^k`; `gui-138.mjs` sweeps every painted box against the ladder. |
| Sidebar | two-line session-title area above the timestamp | The rail is 248px wide, not 254px — it narrowed during run 2. |
| Chat | one contiguous assistant block per turn, tool cards indented beneath | **Do not touch prose weight or leading** (adjudication 2). `.bubble {` must stay the first literal match of that string in `chat.css`. |
| InputBar | one evenly spaced Effort/Model row aligned to the pill's inner edges | `.message-input` stays ungrouped; the disclaimer is already centred on its own line, which was run 1's `SPEC BREAK` and is fixed. |

## Wave 2 adjudications

**Verdict spread: 5/5 `BAR WINS`. Zero `SPEC BREAK`s returned. `critic_degraded: false`.**
Eleven agents: five builders, five critics, one smoothing pass — all eleven returned, zero errors.
`plateau: 0 -> 1`, because no verdict improved. **Four of the five surfaces measurably improved
anyway**, which is the gap between what this counter tracks and what happened.

**Nothing was reverted, and the committed tree matches the captures the critics judged.** That is
deliberate: this run leans on SHA-comparison controls between waves, and a tree that differs from
its own capture set would poison wave 3's "did my change cause this" comparison. Where a wave-2
build is now known to be wrong (Welcome), the fix is wave 3's named gap rather than a quiet revert,
and `.gauntlet/waves/core-after-docks/2/` is frozen evidence either way.

### 2.1 THE WAVE'S HEADLINE FINDING — centring split the wave, two builders moved the same property in opposite directions, and the fix satisfies both critics

Measured off-centre distance, wave 1 -> wave 2, across every content block in the app:

| block | wave 1 | wave 2 | |
|---|---|---|---|
| composer footer strip | 235.5px | **0.0px** | FIXED by the InputBar builder |
| Welcome hero block | 1.0px | **65.0px** | BROKEN by the Welcome builder |
| Titlebar `.session-title` | 0.0 | 0.0 | |
| composer pill | 0.0 | 0.0 | |
| composer footer line | 0.0 | 0.0 | |
| chat transcript column | ~5.0 | ~5.0 | the 4px scrollbar gutter at x1185..1188 |

So the app holds "a content block is centred in its pane" to **0.0px in five places** and now breaks
it by 65px in exactly one. Confirmed independently three ways: the smoothing pass's ink-bbox margins
(left 480 / right 545 = 65px asymmetry), the leg's own mass-weighted ink centroid (**dx −1.6px ->
−114.6px** against the pane centre, with ink count essentially unchanged at 20595 -> 20628, so it is
the same content relocated), and the same 1px -> 65px delta reproducing in `welcome-min-window.png`.

**ROOT CAUSE, which no critic could have seen** — `chat.css:608-617`. The builder used
`grid-template-columns: max-content` with `justify-content: center` + `justify-items: start`. The
column's `max-content` resolves to `.welcome-hint`'s **`max-width: 480px`** (`chat.css:769`), not to
the ~415px the sentence actually paints when it wraps at its comma. So the 480px *column* is centred
correctly (spanning x480..959) but **65px of it is empty, all on the right**, and `justify-items:
start` then hugs every item to the left edge. The four items really do share one left edge — the
stated goal was met — but the block they form sits left of the centre everything else holds.

**Neither builder could see it, and both were locally right.** The InputBar builder made a row
centre-true; the Welcome builder made four items left-true. This is precisely what the smoothing
slot exists for, and it is why the slot is worth its agent.

**The synthesis: wave 3's Welcome gap satisfies BOTH critics at once.** Size the grid track to the
hint's *painted* width rather than its `max-width`, and the block is both left-registered (wave 1's
ask, wave 2's build) and centred (wave 2's critic's ask). The arithmetic predicts the left edge
lands at `32 + (1376 − 415)/2 ≈ 512` — which is exactly wave 1's measured left edge, x512. Two
critics asking for opposite things turned out to be one buildable state, so **this is not an
oscillation and must not be recorded as one.**

⚠️ **Do NOT close it by reverting to `align-items: center`**, and do not touch `.welcome-hint`'s
`max-width: 480px` — `gui-gauntlet-wave3.mjs` W1/W2 pins that measure and the hint's two line boxes.
Change the *track*, not the hint.

### 2.2 OWNER CALL — the Titlebar promotion put a UI label on the prose rung, and DESIGN.md says that rung is prose

The wave-1 critic asked for the session title at the 15px rung. The builder delivered it with an
existing token, on-ladder by construction, and `gui-138` (which sweeps every painted box against the
ladder) passes. The wave-2 critic returned `NONE` for spec break and moved to a different axis.
**And the change still contradicts DESIGN.md as written.** Verified first-hand:

- `DESIGN.md:65` — rung **−1** (13px, `--fs-ui`): "**UI labels**: rail rows, dock headers, tool
  cards, inline and block code"
- `DESIGN.md:66` — rung **0** (15px, `--fs-body`): "**prose at 1.6 leading**: assistant text, user
  bubbles, the composer, and markdown `h3`"
- `.session-title` renders `basename(cwd)` (`Titlebar.tsx:305`) — the workspace folder name, or the
  literal `New session`. That is a UI label. It carries no 1.6 leading. It is none of rung 0's four
  named tenants.
- `git status DESIGN.md` is empty: the spec was not updated.

**Measured consequence, and it is the substantive half.** Titlebar title 15px at **6.71:1** contrast
(`#929a9b` on `#0b0f11`) · Chat prose 15px at **17.10:1** · Sidebar row title 13px at **16.19:1**.
Ambient chrome now sits on the *same rung* as the app's primary reading matter, separated only by
contrast (2.55x), and a full rung *above* the rail's actual content — which is verbatim user prompts
— while carrying 2.41x *less* contrast than it. Before the wave, size and colour agreed: chrome at
13px/6.71:1 was subordinate on both axes. Now they disagree, and size is the axis that lost.

**Why this is an owner call and not a revert.** It is a straight conflict between two human-owned
artifacts — the bar (whose critic asked for the promotion, having judged the artifact) and the spec
(which forbids it). A wave may not edit the bar; a wave should not edit the fence either. Both
resolutions are one line, so reversibility does not break the tie. What tips it: the blind critic saw
the promoted state, was asked for a spec break in PART D, and returned `NONE` — so the instrument
judged this state clean and improved.

**Default taken meanwhile: the promotion STANDS and the conflict is recorded.** For the owner, in one
line: either grant rung 0 a chrome tenant and say so in DESIGN.md's role table, or return the session
title to rung −1 and accept that the bar's critic will keep naming it. **Nothing catches this class of
error** — `gui-138` checks that every size lands on a rung and never that a tenant belongs to its
rung's stated role. That gap is filed (see log).

### 2.3 The Sidebar gap is refuted by measurement, and the build it criticises made the rhythm *better*

The critic asked for "one fixed-height row shell... instead of jumping between two- and three-line
heights". Measured on the pixels, no row has three title lines and none ever did:

- Rows 2–5 each carry **exactly two title lines plus one timestamp**. Ink bands at y312..325 /
  y330..340 / y353..360, y388..400 / y406..419 / y429..436, and so on.
- **Row pitch, off the timestamp line the CSS comment says must stay in column: 76 / 75 / 75px.**
- The smoothing pass measured the same thing at subpixel precision and got mean pitch **58.40 ->
  75.40**, growth **exactly +17.00px**, and spread **tightening from 1.76px to 1.41px**.

So the reserved `min-height: 2.9em` did exactly what the builder claimed: rows got *more* uniform,
not less. The verdict still stands — **a critic grades the artifact, and the soundness of its verdict
does not depend on the soundness of its gap** (wave 1 adjudication 2's principle, applied a second
time). Only the gap is refused, and finding 3 supplies a real substitute.

### 2.4 The Chat weight gap is the FIFTH raising across three runs, and is now refuted on pixels as well as source

Wave 1 refuted this exact request against source. It came back, with one new half — "and user-bubble
copy" — which wave 1's refutation had not covered. So it was checked properly rather than dismissed:

- `.assistant-body` sets `font-weight: 400` explicitly (`chat.css`).
- `.bubble` declares **no** `font-weight` at all, and no ancestor sets one — `base.css` and
  `tokens.css` contain no `font-weight` — so it inherits `normal`, i.e. 400.
- **Measured on the capture**, both at 15px so a weight difference must show as stem thickness:
  user-bubble mean horizontal ink run **3.937px** vs assistant prose **4.052px**, ratio **0.972**.
  The bubble is marginally *thinner*. Median run 3px for both.

So the request is indistinguishable from what already ships, in both halves. `DESIGN.md:56` carries
an in-document warning against re-raising it ("three review waves did"); it is now five.

**Consequence: Chat gets no builder in wave 3.** The smoothing pass measured the piece as coherent
after this wave (intervals all multiples of 8, gutter proven intact) and returned no Chat finding, so
there is no substitute gap. A builder handed no gap redesigns, which the preset forbids. If wave 3's
critic raises prose weight a sixth time, that is Chat plateauing on the instrument's inability to
find a new axis on this surface, and it should be reported as such rather than absorbed.

### 2.5 The InputBar gap is refused on a cross-surface measurement, and the axis is now exhausted

The critic's observation is true: two clusters at `x216..389` and `x881..975`, a **492px empty
middle**. But the smoothing pass, which is the only agent that could compare surfaces, measured what
the change actually did:

- All three composer rows now share one centre — off-centre **0.0 / 0.0 / 0.0**, where wave 1 was
  **0.0 / 235.5 / 0.0**. The change *fixed* a 235.5px error.
- The strip spans `x216..975` = **760px**, flush with the pill's `x217..974`, and the transcript
  column spans `x211..970` = **760px**. Two surfaces, one measure, offset only by the 5px scrollbar
  gutter. In the smoothing pass's words: it "made the app's content measure VISIBLE for the first
  time, and the measure it revealed is correct."

Centring the two controls compactly would re-hide that measure to fill a void. **The residual problem
is real but it is not distribution — it is density: two controls cannot fill a 760px measure that is
itself correct.** That is a product question (what else belongs in the composer's utility row), not a
layout one, and it is an owner call.

**This strip has now been moved three ways by three independent critics across two runs** — run 1
wave 4 and run 3 wave 1 both named it, wave 2 moved it, and wave 2's critic wants it moved again. The
distribution axis is exhausted; do not spend a fourth builder on it.

### 2.6 The rendered-half gate was ALREADY RED on this branch, and wave 1 never found out because it never ran it

Wave 1's recorded gate was `typecheck` + `test` + `build`. This wave added **`npm run test:dom`** —
the rendered half, where the type ladder, the titlebar flanks and the Welcome intervals are actually
measured in real Chromium — because a wave that promotes a type rung and rewrites a hero's layout is
exactly the wave those drivers exist for.

It came back **`DOM PHASE FAIL`: 35/39 drivers passed**, three failing plus one unscored. Rather than
attribute any of it to a builder, the wave was stashed, rebuilt at clean HEAD (reproducing wave 1's
bundle hash `index-DOI17h8g.css` exactly) and the four re-run. **All four fail identically at clean
HEAD, byte-for-byte the same messages**, so wave 2 caused none of them:

| driver | message, identical in both trees | cause |
|---|---|---|
| `gui-49.mjs` | `read 2 sessions but only 0 rows qualify` | reads the developer's real store, which reports **995 sessions** — environment-dependent |
| `gui-94.mjs` | `AC3 .command-row-desc line box moved: 12px -> 31.9px \| AC4 row height 60px -> 65.1px` | pre-existing |
| `gui-95.mjs` | `Timeout 20000ms` waiting for `.session-group-head` | downstream of gui-49's empty row set |
| `gui-123.mjs` | UNSCORED, and self-names its cause: "A first-run profile not sending is **#155**" | pre-existing |

The pins that actually govern this wave's changes all **PASS** under it: `gui-138` (type-ladder
sweep), `gui-136` (flank equality and title truncation), `gui-gauntlet-wave3` (the hint's 480px
measure and two line boxes), `gui-gauntlet-wave7` (the hero's 8±0.75px intervals),
`gui-gauntlet-wave4` (the rail's 2px row gap).

**Wave 3 must not read `DOM PHASE FAIL` as its own doing.** Re-establish the baseline by stashing
before attributing. The honest state of this branch is: the fast gate is green, and the rendered gate
has four pre-existing environment-dependent failures that predate run 3.

### 2.7 A D4 debt the builder identified and could not pay, paid by the leg and verified by mutation

The Chat builder reported its own gap rather than papering it: **no `gui-*.mjs` driver renders a
prose -> card -> prose sequence**, so nothing in the DOM phase covers the grouping. `inspect.mjs`
renders exactly that sequence in real Chromium but is not a `gui-*.mjs`, so the phase never launches
it. The builder could not write a driver (outside its file list) and instead **exported `avatarRun`
specifically so the fast gate could drive the logic**, naming `tests/chat.test.tsx` as where the pin
belonged — a file it did not own.

The leg owns it, so the leg paid it: four cases in `tests/chat.test.tsx` pinning the contract that a
tool card must not end a turn, that any other speaker must, that an empty streaming row cannot claim
the avatar, and what `trailing` reports for the typing row. **Verified as a real pin by mutation** —
making a tool card end the turn (`drawn = false`) reds three of the four; the mutation was then
reverted and the file confirmed byte-identical to its backup. Suite: 1408 -> **1412 passed**.

### 2.8 The smoothing pass earned the wave again, and its best work was proving a builder's load-bearing claim to zero

`SEAMS VISIBLE`. Identity floor **HOLDS** — one hue at all eight mint sites (`#a1e4d6`, alpha 255,
zero hue drift), and **mint went DOWN 3.6%** this wave (15795 -> 15233px across the five surfaces,
−629 of it exactly the one hidden avatar), worst-case surface share 4.087% against the 10% ceiling.
Type scale **HOLDS as numbers** — seven distinct rendered sizes, max deviation 0.342px against a
0.35 tolerance, zero off-ladder — but see 2.2 for the rung *role* table, which does not.

Its four findings are 2.1 (centring), 2.2's measured contrast consequence, finding 3 (the sidebar row
became the app's flattest-cornered box at r/h **0.108**, overtaking the tool card's 0.111, purely
because the row grew 17px while its 8px literal radius did not follow — the seam's *mechanism*:
heights move for content reasons, the 9 bare-literal radii never move with them, so every layout
change silently re-sorts the ratio table), and finding 4 (**the same sentence now paints at two
leadings** — an enriched rail row's title is the session's first user prompt verbatim, rendering at
15px/1.6 in a chat bubble, measured pitch 24.17/23.90, and at 13px/1.45 in the rail, measured
18.92/18.70/19.06; a leading authored for 11px descriptions now governs 13px text).

**Its most valuable result is a NOT-finding.** The Chat builder's load-bearing claim was that
`visibility: hidden` on a continuation avatar preserves the 40px gutter where removing the element
would collapse `max-width: 75%` and lose the shared left edge. The smoothing pass matched the
continuation prose band against wave 1 at nine dx/dy offsets: **mean absolute RGB difference 0.00 at
dx0/dy0 and 61–126 at every neighbour** — pixel-identical, gutter ink 650px over turn 1 in both waves
and 0px over the continuation. It also caught and corrected its *own* first-pass error (an apparent
251->252px shift, from sampling two different prose lines). One avatar removed, alignment untouched,
proven rather than asserted.

Also recorded so nobody hunts a phantom: the whole upper transcript sits **8px lower** in wave 2 while
everything below y376 is byte-identical — a bottom-anchored viewport absorbing an 8px content shrink,
not a spacing regression. And one correction to wave 1's record: **9 distinct bare-literal radii**
in-frame, not eleven; the other four reach a token.

**No new piece proposed, and the reason is worth more than a sixth piece.** The seam in 2.1 is not an
unowned *surface*, it is an unowned *invariant* — every surface already has a builder, and what
nothing owns is the sentence "a content block is centred in its pane." A sixth builder would not have
caught it. **The missing artifact is a test, not a piece.** `ToolCard` remains parked from wave 1.

### 2.9 What wave 3 inherits

| piece | wave 3 gap | trap |
|---|---|---|
| Welcome | **The synthesis fix (2.1).** Size the hero's grid track to the hint's painted width (~415px) rather than its `max-width: 480px`, restoring 0.0px centring while keeping the shared left edge. Predicted left edge x512. | Do NOT revert to `align-items: center` — that discards wave 1's gap. Do NOT touch `.welcome-hint`'s `max-width: 480px`; `gui-gauntlet-wave3` W1/W2 pins it. Do NOT re-raise the vertical placement — FINDING 5 measured it as authored. The 760px column and the 96px mark remain refuted (min window + `gui-gauntlet-wave7` W1's 8±0.75px pin). |
| Titlebar | Give the identity lockup a group break: gaps are **10 / 9 / 10px** between mark, app name, `Wisped` and `Bypass`, so a 16–24px break after the app name (x142) is the buildable form. | Read adjudication 2.2 first — this surface carries an unresolved spec conflict. Do not "fix" it by moving the title back to 13px without the owner's call, and do not edit DESIGN.md. |
| Sidebar | Finding 3: give the session row a corner proportionate to its new 74px height (currently r8, ratio **0.108**, the flattest box in the app). | The radius vocabulary is 13 values with 9 bare literals and `.session-row`'s 8px is one of them (`rails.css:143`) — there is no `--r-*` token to move. Adding one is a system change; say so if you make it. Do not undo the two-line clamp: it is measured as an improvement. |
| Chat | **NONE. No builder this wave** (adjudication 2.4). | If wave 3's critic raises prose weight a sixth time, report it as a plateau signal on this surface rather than refuting it a sixth time. |
| InputBar | **NONE from the distribution axis** (adjudication 2.5) — it is exhausted and the residual is density, an owner call. | Do not centre the strip compactly: it would re-hide the 760px measure the change revealed and undo a 235.5px centring fix. |

Cost for wave 3 at three open builders: **3 + 5 + 1 = 9 agents.**

## Wave 3 adjudications

**Verdict spread: 4 `BAR WINS` + 1 `TOO CLOSE`. Zero `SPEC BREAK`s returned. `critic_degraded: false`.**
`plateau: 1 -> 0`. Three builders, five critics, one smoothing pass — plus **two dead builder
attempts and two dead critic attempts**, all recovered without weakening the instrument.

### 3.1 THE RUN'S FIRST VERDICT MOVEMENT LANDED ON THE ONE PIECE WITH NO BUILDER, AND THE HONEST READING IS NOT "CHAT GOT BETTER"

Chat went `BAR WINS -> TOO CLOSE`. It had **no builder** this wave (adjudication 2.4), and
`chat.png` is **sha256-identical to wave 2** — the smoothing pass confirmed it, and confirmed the
hash is *live* rather than stale by showing the same file DID change wave 1 -> wave 2.

So the surface the verdict is nominally about did not change by one byte. What did change is the
**other image its critic reads**: every critic gets its surface *plus the whole window frame it
lives in*, and `window-session.png` moved this wave (titlebar break + sidebar corner, 1,564px,
proven below). Two readings are available and both are recorded rather than resolved:

- **(a) Cross-surface improvement.** Chat's composition context genuinely improved, so the piece
  reads better in a better-composed window. This is the smoothing-slot thesis running in reverse:
  wave 2 found one surface's build *breaking* another's invariant; wave 3 may be one surface's
  build *lifting* another's verdict.
- **(b) Inter-critic variance.** Two independent critics on near-identical inputs ranked the same
  artifact differently. Wave 1 adjudication 4 already established this happens for *gaps*; nothing
  proves it cannot happen for a *verdict*.

**The plateau counter is reset regardless, and that is deliberate.** The written contract says
"any piece whose verdict improved -> `plateau: 0`" and does not ask why. Wave 2 followed that
contract literally when it produced an *unflattering* answer (four surfaces measurably improved,
counter still incremented). Applying it selectively now that it flatters would be the same error
with the sign flipped. Owner call 20 remains open and is still not decided by a wave.

**The decisive test is cheap and belongs to wave 4:** if a wave leaves the window frame unchanged
and Chat's verdict stays at `TOO CLOSE`, reading (a) is supported; if it falls back to `BAR WINS`,
(b) is. Do not read wave 3's reset as settled either way.

### 3.2 ALL THREE BUILDS LANDED, EACH IN ONE DECLARATION, AND EVERY LOAD-BEARING CLAIM WAS VERIFIED ON PIXELS RATHER THAN ACCEPTED

The leg measured all three itself with its own PNG decoder before opening any verdict, and the
smoothing pass measured them independently again. Both agree with each other and with the builders.

**Welcome — `margin-right: -65px` on `.welcome-hint`. The wave's headline repair.**
Ink bbox: wave 2 `x480..894` (L480 R545, asymmetry 65, displacement **-32.50**) -> wave 3
`x513..927` (L513 R512, asymmetry 1, displacement **+0.50**). Predicted x512.5, measured **513**.
The mechanism is that a grid item's max-content *contribution* is its **margin box** while
`max-width` clamps its **content box**, so the negative margin drove a wedge between them:
contribution `480 - 65 = 415` sizes the track, then shrink-to-fit hands the item
`415 - (-65) = 480` back, so **the 480px measure and its whole wrap tolerance survive untouched**.
Confirmed: exactly two line boxes at byte-identical y in both waves at *both* window widths.
Three further checks — **+0.50px is the arithmetic FLOOR, not a residual** (a 415px odd block in a
1440px even pane cannot beat half a pixel; wave 1 sat on the other side of the same half-pixel at
-0.50); the fix **holds at the 640 minimum** (`x113..527`, +0.50, where wave 2 was -32.50); and it
is a **pure translation, not a re-layout** — block ink width is 415px in waves 1, 2 *and* 3, with
the mark band at 1,809 ink px and the button band at 9,890 identical in all three. Left
registration survived (mark 513, title 514, deck 513/513, button 513; the 1px on the title is a
capital's side bearing, present identically in wave 2 at 480/482/480/480).

**Titlebar — `gap: 10px -> 7px` plus `.app-name + * { margin-left: 9px }`. Width-neutral by
construction.** Measured ink intervals `10 / 9 / 10 -> 7 / 15 / 7` (box `10/10/10 -> 7/16/7`).
The load-bearing claim is that the break is **re-cut from the existing budget, not added to it**:
`3 x 7 + 9 = 30 = 3 x 10`, so the flank's min-content floor stays 276 and the centring mechanism
cannot see the change. **Verified two independent ways:** the group's painted extent is `x14..275`
in *both* waves, and the pixel diff is bounded at `x43..212` — so the logo mark, the permission
pill, the session title (ink centre 720.0, displacement 0.00) and the entire right flank are
unchanged to the pixel. The builder also proved that the *obvious* form, a bare
`margin-left: 16px`, **would have red `gui-136`**: the binding state is welcome@640 where the
right flank floor is only 120, `640 - 81.5 = 558.5` splits into 279.25 per flank against a 276
floor, i.e. **3.25px of slack**; lifting the floor to 292 freezes the left flank and hands the
right 266.5, an imbalance of 25.5 (twice the 12.75 overshoot) against an EPS of 1.0, on an
*unclipped* title so the driver's full-row branch never absorbs it.

**Sidebar — `.session-row-btn { border-radius: var(--r-bubble) }`, session-scoped.** Measured
`205x74` at **r16**, ratio 0.216, from 0.108 at r8. Confirmed twice independently by the smoothing
pass: the left-edge inset profile reads `[16,11,9,7,6,5,4,3,3,2,1,1,1,1,1,0]` against wave 2's
`[8,4,3,2,1,1,1,1,0]`, and the raw fill span starts at x24 against x16. The builder **derived the
number from the rail itself** rather than from the brief's suggestion: `.session-more` is
`8 + 20.8 + 8 = 36.8px` on an 8px radius = 0.217, so `74 x 0.217 = 16.09`, with the user bubble's
`456x72` at r16 = 0.222 (`74 x 0.222 = 16.44`) demoted to a cross-check. It reused the existing
`--r-bubble` token rather than minting a tenth bare literal. **The predicted knock-on is
CONFIRMED:** the tool card at 0.111 is now the app's flattest-cornered box. One correction — the
row measures **205px wide, not the 207px the builder's own note states**; the 2px slip does not
touch its derivation.

### 3.3 THE WELCOME VERTICAL GAP IS NOT REFUSED A THIRD TIME — IT IS ESCALATED, BECAUSE "AUTHORED" IS NOT A DEFENCE AGAINST A BAR CRITIC

Wave 3's Welcome critic asked for the cluster to move down 50–60px. Its arithmetic is exact: ink
centre y365.5 against pane centre y426 is **60.5px**. Wave 1's FINDING 5 measured this placement
as **authored** — `padding: 32px 32px min(152px, 17vh)` with centred content predicts a top of
**241.66** and it measures **242** — and wave 2's critic asked for the same move and was **refused
on that ground**.

**Refusing it a third time would be a category error, and the arithmetic is what exposes it.**

- Wave 2's critic asked for "the stack's midpoint at **y426**".
- Wave 3's critic, on different pixels, independently computed the same destination.
- **Symmetric padding produces a midpoint of exactly y426.00.** `32 + (852 - 32 - 32 - 248.69)/2
  = 301.65`, plus half of 248.69, is 426.00 to the pixel.

So two independent critics, two waves apart, did not merely re-raise a refused gap — they
**reproduced the same number**, and that number is precisely what the *asymmetric bottom reserve*
is spending. FINDING 5 proved the value is **deliberate**. It never proved the value is **good**,
and those are different claims: "authored" answers *is this a bug?* (no), while the bar asks only
*is this well made?* The preset is explicit that **the spec is a fence, not the yardstick** —
so declining a bar critic's gap because the value was chosen on purpose is using the fence as the
yardstick, which is the one substitution this whole mechanism exists to prevent. Run 1 was recorded
as having "spent waves arguing with a deliberate value"; the better reading is that three critics
have now independently said the deliberate value reads wrong.

**Owner call, stated in one line:** keep the deliberate `min(152px, 17vh)` bottom reserve that lifts
the hero 60.5px above centre, or go symmetric and land the midpoint on the y426 two critics
computed. **Default taken meanwhile: the reserve STANDS and Welcome gets NO BUILDER in wave 4**,
because the only surviving gap on that surface is this call.

### 3.4 THE CENTRING INVARIANT NEEDED ITS INSTRUMENT FIXED, AND WAVE 2'S TWO WITNESSES WOULD NOW DISAGREE

Wave 2 measured "off-centre" two ways that happened to agree — ink-bbox margins **and** a
mass-weighted ink centroid. **They agree only for a block whose items are individually centred,
and they diverge for a left-registered one**, because left registration necessarily drags the mass
left of the bbox centre. The hero is now left-registered by design.

The smoothing pass proved this by construction: wave 1's individually-centred hero read a centroid
displacement of **-0.89px**; waves 2 and 3 read **-124.45** and **-91.59**; and the centroid moved
**+32.86px against a block translation of +33px**, so the entire -91.59px residual is a property of
the composition, not evidence of anything. **The invariant is read off the INK BOUNDING BOX from
now on.** A future wave measuring the centroid would "discover" a 91px defect that does not exist.

Two further precision notes for the record: **"65px" as wave 2 recorded it is a left-minus-right
MARGIN ASYMMETRY**, so the corresponding centre displacement was 32.5px — never compare an
asymmetry against a displacement. And the invariant now **holds in six of six places**, where
wave 2 held five and broke one.

**Wave 2's chat-column figure is corrected, in the app's favour.** It recorded "~5.0px off-centre
(a 4px scrollbar gutter)". The number was right and the cause was 6px short: `base.css` reserves
**10px** for the scrollbar and paints a 4px thumb inside a 3px transparent border, so
`(1192 - 10 - 760) / 2 = 211` exactly, measured 211. **The chat column is centred to 0.00px in its
own scrollbar-narrowed 1182px content box** — not off-centre at all.

### 3.5 THE INSTRUMENT'S ERROR RATE IS NO LONGER ZERO, AND THE CHAT CRITIC HAD TO BE RUN THREE TIMES TO GET IT WITHOUT WEAKENING IT

Wave 1 recorded "**zero** factual errors across all nine returning critics". Wave 3 has **two in
five**, both a secondary context image's height, caught by reading the PNG headers:

| critic | claimed | true |
|---|---|---|
| Titlebar | `window-session.png` 1440x**912** | 1440x**900** |
| Chat | `chat.png` 1192x**729** | 1192x**721** |
| InputBar | `window-session.png` 1440x900 | correct |

**No verdict rests on either**, and every *content* literal was right across all five — the
Welcome critic even reported the hero bbox as `x=513–927`, which matches the leg's decoder
**exactly**, independently dating the pixels and confirming the fix. But the honest statement is
that this instrument does make dimension slips, so a claim resting on a critic's reported frame
size must be re-measured. **Also recorded so nobody "fixes" a non-error:** `inspect` logs chat's
**CSS box** as h720 while the PNG is h721. Both records are right about different things.

**The Chat critic stalled twice** on the 180s no-progress limit and returned on the third attempt
with a **byte-identical prompt** — so the stall is stochastic, and *no trim was applied*. That
matters because run 1's only false verdict came from trimming the single casualty, and wave 1's
rule is to change the instrument **uniformly or not at all**. Cause: PART A asks for every readable
string verbatim, and `chat.png` carries **923 characters** against titlebar's 36, welcome's 148,
sidebar's 550 and input-bar's 80 — the longest emission of the five. It is **not** payload weight:
InputBar carried a *larger* image payload (638KB against Chat's 582KB) and returned first time.

### 3.6 THE SMOOTHING PASS EARNED THE WAVE AGAIN, AND ITS BEST FINDING IS ANOTHER TWO-LOCALLY-CORRECT-DECISIONS SEAM

`SEAMS VISIBLE`. Identity floor **HOLDS** — one mint hue (~170deg, 15,476px), **eight** sites
matching the record exactly, mint **down 31px (-0.20%)**, worst-case surface `welcome-min-window`
at **4.134%** against the 10% ceiling and *falling* (4.149% last wave). Type scale **HOLDS**, and
this time in **rendering** rather than only in CSS: baseline pitch measures exactly **24.0px** on
two independent surfaces against `15 x 1.6`, and the titlebar app-name ink is **97px wide in both
waves**, proving the Titlebar builder moved spacing and not type. Max deviation 0.342px against the
0.35 tolerance, zero off-ladder.

It also declared its own limits, which is why its numbers are usable: its mint count runs **~2%
above the record on the same wave-2 pixels**, so its deltas are sound while its absolutes are not
comparable to earlier waves; and it **discarded** a loose-threshold reading that would have shown
the sidebar at 8.021% mint, correctly identifying it as the session-row fill (chroma 11, hue 180)
being miscounted. It caught and corrected **two of its own errors** mid-analysis (reading the
command rows as `233x63` at r6 by flood-filling a 1px-outlined row's *interior*, and inflating the
marks' radii by estimating from missing-corner *area*, which counts the antialiasing ring).

**FINDING 3 — THE BEST OF THE WAVE, and the same shape as wave 2's centring seam.** The app's
most-repeated number jogs 5px at the composer seam. Measured in **one** frame: the transcript
column is `x459..1218` (w=760) and the composer pill `x464..1223` (w=760), one directly above the
other, left edges 5px apart and right edges 5px apart. **Each is correctly centred in its own
pane** — the composer at 0.00px in 1192px, the transcript at 0.00px in the 1182px its scrollbar
reserve leaves. Two locally-correct centrings producing a globally visible misalignment of the one
measure the app repeats four times (transcript column, composer pill, footer strip, footer line).
**Standing, not introduced** — identical in waves 1, 2 and 3 — and structurally invisible to
per-surface critics, because `chat.png` and `input-bar.png` are separate clips and neither contains
the other's edge. This is InputBar's wave-4 gap, in place of the exhausted distribution axis.

**FINDING 1 — a cost THIS WAVE'S OWN OWNERSHIP RULE bought, and it must be owned rather than
hidden.** The leg instructed the Sidebar builder to scope its radius to `.session-row-btn` alone,
specifically so the dock byte-identity control would survive and already-red `gui-94` would not
gain a second cause. That instruction worked — and it **split the row vocabulary**: the session row
now wears r16 against the commands dock row's r8, absolute radii **2.00x apart where they were
IDENTICAL at 8px**, ratios 1.76x apart. `DESIGN.md`'s Layout section defines the Agents dock as
"mirroring the Sessions rail — **same 44px head, same row shell**", and *same row shell* is now
false. No critic could see this (the sidebar critic has no dock rows in frame; the dock surfaces
are byte-identical so nobody is looking at them). The agent row's corner is **unobservable** in the
capture — it paints `background: transparent` with no border, so the dock pixels carry no row box —
but it is declared 8px and so also splits. **This is a two-wave sequence, not a defect: wave 3
spent its brief proving ownership held; wave 4 can spend that proof to unify the vocabulary**, with
the dock captures expected to move and `gui-94`'s message re-checked against the baseline below.

**FINDING 2 — the group break was funded with a value that exists nowhere else, and a strictly
better number satisfies the identical constraint.** `gap: 7px` now appears **exactly once** in all
of `styles/`, against **16** callers of 8px, 9 of 4px, 6 of 6px, 5 of 2px and 4 of 10px.
**`8 / 14 / 8` sums to the same 30**, holds the same 276 floor, and lands a break ratio of
**1.75x** which still clears the file's own accepted 1.63x — while spending the app's dominant gap
instead of minting a singleton. The arithmetic never forced 7px. Cheap wave-4 refinement, same
file, one declaration.

**FINDING 4 — the sole selection indicator lost a fifth of its run, and a share-based check reports
the opposite.** The mint stripe is an inset shadow clipped to the row's rounded rect, so its
straight run is `height - 2r`. Measured run at column x7: **66px -> 54px**; at x6: **62px -> 48px**.
As a share of the 74px row the solid run falls from **89% to 73%** — 16 points off the only
affordance that says which session is active. The builder predicted this direction (58 -> 42) and
**understated the delta**. The trap: **total sidebar mint px RISES 165 -> 173**, because the taper
adds antialiased pixels, so the identity-floor share check would report mint *going up* while the
indicator shrank. Only run length shows it.

**FINDING 5 — eleven distinct radii across 49 declarations is not a scale, and it is the common
cause of findings 1 and 2.** Counted: 8px x11, 6px x6, 50% x6, `--r-pill` x5, `--r-mark` x5, 4px x3,
12px x3, 10px x3, `--r-bubble` x2, 5px x2, `calc(--r-mark * 2)` x1, 24px x1, 1px x1. The gap
vocabulary is the same shape — 11 values across 46 declarations. **All three of this wave's builders
had to derive their number from whichever neighbour sat nearest** (Sidebar from `.session-more`'s
own 8/36.8, Titlebar from `.titlebar-actions`' own 48/20 crossing, Welcome from the deck's 480px
cap) because there is no ladder to derive from the way `15 x 1.15^k` exists for type — and two of
the three then shipped a value with **no second caller anywhere in the app**.

**THE RADIUS-RATIO TABLE IS RETIRED AS A MODEL, which corrects wave 2's finding 3.** Ranked by
ratio the four recorded boxes now read 48, 72, 74, 108 by height — strictly monotonic, where wave 2
had an inversion. But the tracking is **inverse** (taller box, flatter corner) and it survives only
because the table has four hand-picked members: admit the fifth comparable box (the commands dock's
`235x65` at 0.123) and monotonicity breaks again, and two boxes of *identical* height wear different
corners (a 400x48 bubble at r16 = 0.333 against the 760x48 pill at 0.500). **There is no
radius-per-height rule.** There are three constants — capsule, 16, 12 — plus 8 on the rail rows,
and this wave moved the session row from the fourth group into the second. A table that flips on
which four boxes you pick is not measuring a system.

### 3.7 NO NEW PIECE, AND FOR THE SECOND WAVE RUNNING THE MISSING ARTIFACT IS A TEST

The smoothing pass proposed **none**, and proposed instead a **CSS-text check** in the mould of
`tests/scrollbar.test.ts` (which already pins the scrollbar block by reading `base.css` as text):
enumerate every `border-radius` and every `gap` declaration under `styles/` and assert each against
a declared scale, exactly as the type ladder is already assertable.

Its reasoning is the strongest argument in the wave: **every seam it found is BETWEEN surfaces**, so
a sixth isolated critic cannot see any of them; a text scan turns finding 1 into a build failure at
the moment the override is written rather than a smoothing report two waves later; it costs the
plateau signal nothing because the piece list does not churn; and unlike the parked `ToolCard`
proposal it **requires no edit to a human-owned scoping rule**, so it stays inside the loop's scope.

**Wave 2 reached the same conclusion about a different invariant** ("the seam is an unowned
invariant, not an unowned surface"). Two waves independently concluding that the decomposition into
*surfaces* is complete while the missing artifacts are *invariants* is itself the finding: this
run's remaining defects are cross-surface, and critics are per-surface by construction.

**Scoping caution for whoever adopts it:** the scale must admit `50%`, `999px` and
`calc(--r-mark * 2)` as legitimate non-ladder forms — a circle, a capsule, and stated arithmetic on
a token — or the check reds on three things that are correct. `ToolCard` remains parked from wave 1.

### 3.8 What wave 4 inherits

**Four builders, not three or five. Welcome loses its builder; Chat gains one back.**
Cost: **4 + 5 + 1 = 10 agents.**

| piece | wave 4 gap | trap |
|---|---|---|
| Welcome | **NONE — no builder.** Its only surviving gap is the vertical-placement **owner call** (3.3), and a builder handed no gap redesigns. | Do NOT "fix" the vertical without the owner. Do NOT refile the centring: it is **FIXED** at +0.50px, which is the arithmetic floor. Do NOT refile "the welcome mark is squarer" — measured r/side **0.3182** at both sizes, identical to four decimals. |
| Titlebar | **Mark depth (the critic's gap).** Interior mint stddev measures **0.00 / 0.05 / 0.09** at the three mark sites against the identity reference's **9.02 / 7.01 / 3.65**. Also close finding 2 in the same file: re-cut `7/16/7` to **`8/14/8`** (same 30 sum, same 276 floor, 1.75x still clears the accepted 1.63x, and it spends the app's dominant 8px instead of a singleton 7px). | ⚠️ **THE DEPTH GAP IS CROSS-FILE AND CANNOT BE ONE BUILDER'S FILE LIST.** The mark paints at three sites in two stylesheets — `.logo-mark` in `titlebar.css`, `.welcome-mark` and the assistant avatar in `chat.css` — and wave 1 measured all three flat, so treating one is a new inconsistency. Either put the treatment on a token and apply at all three, or **serialize Titlebar with Chat on `chat.css`** the way wave 2 serialized Welcome with Chat. **Guard: no second mint hue** — the one-accent floor is measured at one hue. A vertical-offset shadow is fine; #140 allows only ONE box-shadow with a nonzero *horizontal* offset and it is the rail stripe. Do not edit DESIGN.md; adjudication 2.2's rung conflict is still the owner's. |
| Sidebar | **Compress the pre-list stack (the critic's gap).** Rows do not begin until y225, i.e. **26.4%** of the rail's 852px spent on status and controls; target 150–160px so the first session rises 65–75px. | Also decide **finding 1**: the row vocabulary is now split (session r16 vs dock rows r8, where they were identical at 8px), and `DESIGN.md` says the Agents dock has the "**same row shell**". Unifying means propagating r16 to `.agent-row-btn` / `.command-row-btn` — which **will** move the three dock captures (expected, no longer a control violation now that wave 3 proved ownership) and **will** touch `.command-row` boxes that already-red `gui-94` pins, so re-check its message against the baseline in 3.9. And **finding 4**: the selection stripe's solid run fell **89% -> 73%**; if you compensate, note that the mint *share* check is blind to it (sidebar mint went UP 165 -> 173). Do not undo the two-line clamp. |
| Chat | **BUILDER RESTORED. Increase the transcript's top inset from ~13px to 24px** (the critic's gap, and **24px is DESIGN.md's own transcript rhythm**). | `.bubble {` must stay the FIRST literal occurrence of that string in `chat.css`. Do not touch prose weight or leading — that thread is refuted five times and `DESIGN.md` warns about it in the document itself. If a sixth prose-weight raising appears, report it as a plateau signal rather than refuting it again. Serialize with Titlebar if the mark-depth work reaches `chat.css`. |
| InputBar | **Finding 3, the seam — NOT distribution.** The transcript column (`x459..1218`) and the composer pill (`x464..1223`) are both 760px, stacked, and jog **5px**, because each is correctly centred in a differently-sized pane (1182px scrollbar-narrowed vs 1192px). Make the app's most-repeated measure share one axis. | **The distribution axis is EXHAUSTED — four critics, four different arrangements, across two runs.** Refuse a fifth. It is now refused against the SPEC too: `DESIGN.md` authorises "Chat column: max-width 760px, centered". `.message-input` stays ungrouped. The disclaimer is already centred and that was run 1's fixed `SPEC BREAK`. This gap spans two stylesheets — decide which side moves before fanning out. |

**Standing instruction for the wave-4 leg, learned the hard way this wave (3.9):** hand each builder
the **source it must edit, inlined in the brief**, and forbid it from opening drivers or
`inspect.mjs`. Three Welcome attempts died before one landed, and the two deaths were spent reading
instrument files rather than writing CSS.

### 3.9 Instrument and method findings — the leg's own, and five of them change how a wave is run

**1. A PRE-WAVE BASELINE REPLACES POST-HOC STASHING, and it is strictly better.** Wave 2 proved its
four DOM reds pre-existing by stashing the wave, rebuilding clean HEAD and re-running. Wave 3 simply
ran the DOM phase **before any builder touched the tree**: 35/39, with the four non-PASS messages
**byte-identical** to wave 2's (`gui-49` "read 2 sessions but only 0 rows qualify"; `gui-94`
"AC3 `.command-row-desc` line box moved: 12px -> 31.9px | AC4 row height 60px -> 65.1px"; `gui-95`
timeout on `.session-group-head`; `gui-123` UNSCORED, self-naming **#155**). Every pin governing
this wave was **green** at baseline: `gui-136`, `gui-138`, `gui-gauntlet-wave3`, `-wave4`, `-wave7`.
That is a second independent route to wave 2's conclusion, it needs no stash, and it makes any new
red attributable the moment it appears. **Do this at the top of every wave.**

**2. THE WELCOME BUILDER DIED TWICE AND THE BRIEF WAS THE BUG, NOT THE MODEL.** Both dead attempts
spent their whole 180s no-progress window **reading instrument source** — `gui-gauntlet-wave3.mjs`,
then a 60KB `inspect.mjs` — and never made an edit. `chat.css` is **937 lines** of very dense
authored commentary, so a third attempt also burned its budget reading it in chunks (88KB of
transcript for three reads). The successful attempt got the two CSS rules and the JSX **inlined in
the brief** plus an explicit ban on opening `.claude/**`, any `gui-*.mjs` and `inspect.mjs`.
**The lesson generalises: a brief that recites driver facts invites a builder to go verify them.**
State them as given, forbid the read, and inline the source it must edit.

**3. `gui-gauntlet-wave4` IS MISLABELLED IN THIS FILE, and the label would have misled a builder.**
Adjudication 2.6 calls it "the rail's 2px row gap". It is not: its W1–W4 pin the **Welcome
headline** — letter-spacing -0.02em, the authored stack naming the Display optical master FIRST,
that master actually resolving on that element, and the headline box measuring 57.5px so the
min-window budget is untouched. A Welcome builder trusting the label would have believed the
headline unpinned. Corrected in 3.9's trap column. Treat every driver label in this file as
unverified until read.

**4. THIS FILE WAS CITING `DESIGN.md` BY LINE NUMBER, WHICH `DESIGN.md` ITSELF FORBIDS.** #138's rule
is *name the section, not the line* — and constraint 4 carried "line 80 / line 82", which is exactly
the citation style that drifted from 59/61 during run 2 and had to be repaired at wave 1. Converted
to section names in the binding constraints. **Do not reintroduce a line number.**

**5. THE HALF-SCALE BAR IS THE AUTHORED SIZE, NOT A DOWNSCALE — stop describing it as a compromise.**
`.gauntlet/bar/README.md` records that the references were captured "at **1680x1050,
`deviceScaleFactor: 2`**". So the 3360x2100 files are 1680x1050 logical pixels at 2x device pixels,
and wave 1's reduction to 1680x1050 **restores the bar's own authored dimensions** by removing the
device-pixel doubling. Wave 1 defended it empirically (four pieces returned the same verdict at both
resolutions); the README defends it on principle. The half-scale set is the *correct* instrument.

**7. THE GATE, AND THE PRE-WAVE BASELINE EARNED ITSELF ON ITS FIRST OUTING.** D7's three are
**GREEN**: `npm run typecheck` clean, `npm test` **96 files / 1412 passed / 43 skipped** (identical
to wave 2 — no regressions and no new tests), `npm run build` clean at bundle
**`index-DEOc0YV7.css`**, which is the *same hash the captures were taken from*, so the committed
tree renders exactly what the critics judged.

The rendered half came back **33/39 against the baseline's 35/39** — and the full driver-status diff
is **exactly two lines**: `gui-72` and `gui-124`, both `PASS -> FAIL`. Everything else is identical,
including `gui-94`'s message **byte for byte** (`AC3 .command-row-desc line box moved: 12px ->
31.9px | AC4 row height 60px -> 65.1px`), which independently proves the session-scoped radius
override never reached the command rows.

**Both new reds are CAPTURE STALLS, not assertions, and both PASS STANDALONE at exit 0 on the same
tree.** `gui-72` died on `page.screenshot()` (`gui-72.mjs:122`, `TimeoutError` after "fonts loaded")
before reaching any overlap check; `gui-124` died on an element screenshot (`:507`, "waiting for
element to be stable") at 60.8s against 31.0s at baseline. Re-run alone: `gui-72` **PASS**,
`gui-124` **PASS**. A CSS gap, a negative margin and a border-radius cannot hang a compositor
waiting for fonts. **Attribution: this wave caused zero failures**, and the positive evidence is
stronger than the absence of negative — every pin written to catch what these three builds touched
passed in the batch: `gui-136`, `gui-138`, `gui-gauntlet-wave3`, `-wave4`, `-wave7`, plus `gui-93`
and `gui-96`.

**This is fresh live evidence for #166, and it doubles the observed instance count in a single
run.** #166 asks whether the 26 bare-`await` capture calls across the driver corpus are worth
sweeping. Here two of them cost their drivers' *entire* assertion sets and reported a bare `FAIL`
indistinguishable from a product break — exactly the harm #156 fixed for `gui-91`, which passed
this run at 22.1s while two unfixed siblings did not. Recorded on the ticket rather than acted on;
a wave does not sweep the instrument.

**6. `inspect` FINISHES AND THEN HANGS THE SHELL, so a timeout is not a failed capture.** The capture
command was killed at a 10-minute limit (exit 143) — **after** `inspect` had printed `PASS` and all
eleven `FILE` lines, with no Electron or node process left behind. All 11 files were present and
correct. A future leg that reads the timeout as failure will re-run a capture that already
succeeded, and re-running is what overwrites evidence. **Read the log for `PASS` and count the files
before concluding anything from the exit code** — the same discipline this repo already applies to
the DOM phase's verdict line.

## Wave 4 adjudications

**Verdict spread: 3 `BAR WINS` + 2 `TOO CLOSE`. One `SPEC BREAK` returned (4.3). `critic_degraded: false`.**
`plateau` stays **0** — Titlebar improved. Nine agents planned, **nine spent, and the six-agent judging
fan-out was the first of the run with zero deaths and zero stalls.** Three builders ran; **two of the
three builds were REVERTED** (4.5), so the wave committed exactly ONE change.

### 4.1 THE SECOND VERDICT MOVEMENT IS THE MIRROR IMAGE OF THE FIRST, AND THIS ONE IS ATTRIBUTABLE

Wave 3's movement landed on the one piece with **no builder** and byte-identical surface pixels, which
left it ambiguous between a cross-surface lift and inter-critic variance. Wave 4's movement landed on
**the only piece whose own surface changed**, and the change is **453 pixels inside a 22x22 mark**.

Three things make the causal reading coherent rather than merely available:

- The changed element **is the subject of the critic's own gap** — it asks for *more* depth on the same
  mark. A critic that moved its verdict up while pointing at the changed element is telling a
  consistent story.
- Wave 3's Titlebar critic asked for mark depth; wave 4's got mark depth and improved. Two waves, one
  axis, verdict follows the change.
- Attribution is exact: `titlebar.png`'s entire delta is ONE 22x22 component, 453px, and the whole
  wave's delta across eleven captures is **9,350 pixels in 10 components, every one a mark interior**.

**The honest counterweight, stated rather than buried:** 453px is **0.65%** of `titlebar.png`
(1440x48 = 69,120px). A verdict moving on 0.65% of a surface is either a sensitive instrument or
variance wearing a causal costume, and one wave cannot separate those. What is *new* against wave 3 is
that the changed input is the piece's own surface rather than a neighbour's frame — so this movement is
strictly better evidenced than the first, without being proof.

### 4.2 CHAT HELD `TOO CLOSE`, WHICH IS THE FIRST POSITIVE EVIDENCE ON ADJUDICATION 3.1 — AND IT RULES OUT LESS THAN IT LOOKS

Adjudication 3.1 set a decisive test: leave the window frame unchanged, and see whether Chat holds.
The frame was **not** unchanged — but its delta is **1,765px in three mark interiors**, and `chat.png`'s
own delta is **1,312px inside its two 28px avatars**. Chat's inputs moved by roughly 0.15% of the frame,
all of it inside marks. It held `TOO CLOSE`.

**What that establishes:** wave 3's movement was not a one-off fluke. Two independent critics, two
waves apart, on near-identical pixels, returned the same verdict.

**What it does NOT establish, and this is the part worth keeping:** it does not separate reading (a)
from reading (b), because a *stable* inter-critic bias — this critic family reliably reading Chat as
`TOO CLOSE` — is observationally identical to a real cross-surface lift that persists. Both predict
exactly what happened. The test as written in 3.1 was under-specified: holding is consistent with (a)
**and** with a reproducible (b), and only a *falling back* would have been decisive. Recorded so a
later wave does not treat the hold as settling it.

### 4.3 A `SPEC BREAK` CAME BACK, IT IS REAL, AND IT IS THE SECOND UNRESOLVED CONFLICT ON ONE ELEMENT

The Chat critic returned: the centred titlebar shows `inspect-ws` while the selected session is
"Why does the sessions rail go empty after I flip the backend pill?", so it is not showing the session
title `DESIGN.md` requires. Checked rather than accepted:

- `DESIGN.md`'s `## Layout` Titlebar bullet says **"Center: session title, `--text-muted`"**.
- `.session-title` renders **`basename(cwd)`** (`Titlebar.tsx:305`, established at adjudication 2.2) —
  the workspace folder name, or the literal `New session`. `inspect-ws` is the temp workspace basename.
- The rail **simultaneously** shows real session titles, so the app clearly has the other value.

So the element is *named* `.session-title`, the spec *calls* it the session title, and it paints the
folder name. **The discrepancy is real and newly found.**

**No revert is possible or warranted**, and that is not a dodge: Chat had no build this wave, the break
is not in Chat's own surface but in the Titlebar's centre slot visible through the shared frame, and
the behaviour **predates run 3 entirely**. A `SPEC BREAK` reverts a build; there is no build under it.

**What makes it worth escalating loudly is the compounding.** This is the **second** unresolved
spec conflict on the **same element**: adjudication 2.2 has `.session-title` sitting on the prose rung
against `DESIGN.md`'s own role table, open since wave 2. One element, two independent conflicts, found
two waves apart by two different critics, neither answered. Filed (see log). **Not decided by a wave** —
either the spec means "workspace" and should say so, or the titlebar should paint the session's title.

### 4.4 THE DEPTH LANDED EXACTLY AS AUTHORED, ITS TARGET WAS ARITHMETICALLY UNREACHABLE, AND ONE ALPHA IS PAINTING THREE FINISHES

**It landed, and it is not a silent no-op.** Interior stddev, mint mask eroded 2px, wave 3 -> wave 4:

| site | wave 3 | wave 4 (RGB) |
|---|---|---|
| `.logo-mark` 22px | `[0.00, 0.00, 0.00]` | `[3.63, 5.00, 4.83]` |
| `.welcome-mark` 44px | `[0.00, 0.00, 0.00]` | `[4.04, 5.77, 5.38]` |
| `.avatar` 28px (x2) | `[0.00, 0.00, 0.00]` | `[3.49, 4.90, 4.60]` |

The strongest form of the result is not the stddev but the **back-fit**: solving for alpha from the
actual per-row counts of the eroded mask gives **0.100–0.103 at every channel at every site** against
an authored `0.1`. The CSS parsed and painted precisely what was written. Ten of twelve channel
readings land inside the reference's `[3.65, 9.40]` band.

**THE 6.41 TARGET WAS UNREACHABLE, SO THE MISS IS IN THE BRIEF'S FORMULA, NOT THE BUILD.** Two errors
compound in `alpha x 255 x L`: **(i)** `L = 0.87` is the mint's **OKLCH lightness**, not an sRGB channel
scale — the real per-channel ranges at `a=0.1` are `16.1 / 22.8 / 21.4`, so the true stddev ceilings are
**R 4.65 / G 6.58 / B 6.18** and **the R channel could not reach 6.41 at any box size**; 22.19 happens
to approximate the G channel alone. **(ii)** The measurable interior loses ~2px at each end, so the
sampled alpha span is 81.8% / 90.9% / 85.7% of the box. ⚠️ **Do not carry 6.41 into wave 5 as an unmet
target** — reaching it on R needs `alpha ~= 0.138`, which would darken G past the reference's own 9.09.

⚠️ **This corrects the leg's own first reading.** The leg initially attributed the entire shortfall to
its own 4px bbox erosion. Erosion is real but second-order; the dominant term is the unit conflation
above. A measurement that misses a prediction indicts the prediction's units before the instrument.

**FINDING 2 IS THE REAL WAVE-5 GAP: one alpha gives three finishes.** A ramp's stddev is
size-invariant but **not shape-invariant**, because a disc weights mid-ramp rows more heavily than a
near-square. Eroded row widths at first/last as a fraction of the widest row: 22px `0.56/0.56`, 44px
`0.55/0.55`, 28px **`0.25/0.25`** — the avatar is `border-radius: 50%`, a true disc. Measured G stddev
**5.00 / 5.77 / 4.90**: the avatar reads **flatter** than the 22px chip despite spanning more of its
box, and the 44px plate reads **18% deeper** than the avatar off the single shared value. **The identity
now paints at three finishes rather than one — the same kind of inconsistency the brief warned that
treating one site would create, smaller but real.** That is a cross-surface seam only the whole-artifact
pass could see, and it is the third wave running that the slot has earned its agent.

**FINDING 3, informative and deliberately not acted on.** Measured with the identical method, the
identity reference's three marks read `[11.68, 9.09, 4.76]`, `[11.31, 8.80, 4.59]`, `[11.29, 8.80, 4.57]`
with range `[45, 35, 18]`. A pure black multiply over its mean would predict ranges `21.6 / 35 / 35.5`;
it measures `45 / 35 / 18` — R varying **twice** what a multiply predicts and B **half**. So the
reference's depth **shifts chroma across the face** while the app's is proportional by construction
(`0.087 / 0.083 / 0.079`). Net: the app now **matches** the reference on B (4.60 vs 4.57) and is ~3x
flatter on R. Note for whoever acts on it: the guard forbids a second **hue**, and `theme.test.ts`
explicitly permits accent **chroma** movement — so a chroma-shifting ramp is not fenced, but it is a
larger call than equalising the three finishes and should not be smuggled in alongside it.

### 4.5 TWO BUILDS WERE REVERTED, AND BOTH REVERTS BOUGHT MORE THAN THE BUILDS WOULD HAVE

D12 is literal — a red wave reverts its piece and records the gap — and both reverts were taken on that
rule rather than argued around. **Neither fence was edited to pass.**

**SIDEBAR — reverted on a named unit test.** The build relocated the live "Background sessions" section
from between the rail head and the filter down to the rail's foot (one CSS declaration plus a JSX move).
It reddened `tests/background-sessions.test.tsx`'s test **"it sits ABOVE the stored-transcript groups in
the rail"** — a `compareDocumentPosition` pin from **#91**. The spec is silent on the section, so this is
a **test fence, not a spec break** — and an executable fence is harder than prose, not softer. Both files
restored; the reverted diff is kept at `.gauntlet/waves/core-after-docks/4/sidebar-build-REVERTED.diff`.

Three things survive the revert, and together they are worth more than the build:

1. **The critic's own recommended mechanism is refuted on width arithmetic.** The head row has
   `248 - 16 - 8 = 224px` of content width; "Background sessions" is ~105px, the `Refresh` shell ~58px,
   two 8px gaps 16px — **179px before any status text**, against ~92px needed for "None running here".
   The fold cannot fit at a 248px rail, so the mechanism both critics named is unbuildable.
2. **The critic's TARGET is reachable without it.** Pure in-place tightening: bg-sessions trimmed
   without folding ~37 + filter ~7 + scope ~4 + group heading ~2 = **~50px off 225 -> ~175px**, against
   the wave-4 critic's asked 170. That is wave 5's gap and it needs no relocation.
3. ⚠️ **A CSS `order` dodge exists and was REFUSED — record it so a later wave does not "discover" it.**
   `order: 1` on the section would leave DOM order untouched and therefore **pass** the
   `compareDocumentPosition` test while moving the section visually. It was rejected for two concrete
   reasons: `.sidebar-foot` is `order: 0` and not that builder's selector, so the section would land
   *below* the rail's authored bottom edge; and it would put a tab stop at second position while the eye
   finds it at the foot — **a focus order that lies**. Passing the letter of a test while defeating what
   it protects, and adding an accessibility defect to do it, is worse than reverting.

**INPUTBAR — reverted on two rendered driver pins, and the reason generalises.**
`scrollbar-gutter: stable both-edges` on `.chat` reddened three drivers:

| driver | what it returned |
|---|---|
| `gui-51` | `.chat gutter 19.2css / 24dev, expected 12.5dev` — and the driver's own comment reads **"Never widen these"** |
| `gui-98` | criterion 2: `.subagent-drawer .chat-column` measured **751.2px against exactly 760** (`820 - 2 hairline - 48 padding = 770`; a 20px reserve leaves 750) |
| `gui-118` | `FAIL` |

**The generalisable finding: `.chat` is not one surface.** It is **reused inside the subagent drawer at
a second, narrower width where the 760px measure is already at its limit** — so any change that spends
horizontal room in `.chat` breaks a pinned measure on a surface no gauntlet piece captures. That is why
the canonical fix is dead, and it is a fact worth more than the declaration was.

**The revert produced clean attribution as a by-product:** DOM phase **35/39 baseline -> 32/39 with the
seam fix -> 35/39 after the revert**, with `gui-94`'s message byte-identical throughout. The three reds
were the gutter and nothing else; the mark depth caused zero.

### 4.6 THE OWNERSHIP CONTROL IS THE CLEANEST OF THE RUN, AND THE ATTRIBUTION CLOSES AT ZERO REMAINDER FOR THE SECOND WAVE RUNNING

- **The three dock captures are byte-identical across ALL FOUR WAVES** (`bd48b6dbded8` /
  `acddc564b236` / `b9fa0168d66e`), 0 changed pixels.
- `sidebar.png` and `input-bar.png` byte-identical wave 3 -> 4, with the hashes **proven live**
  (sidebar differed at every earlier step: `ea6c090bfc25` / `e5def5dee10e` / `938b4c06c68b`). So both
  reverts were complete, verified at the pixel level and not merely by `git checkout`.
- **`welcome.png`'s changed pixels form exactly ONE 44x44 component** (1,789px, 92.4% of the box) — so
  the reverted gutter declaration left **no trace** on the pane that renders outside the scroll
  container, which is the independent proof that the two builders sharing `chat.css` did not leak.
- Pixel attribution, zero remainder: `window-welcome` **2,242 = 1,789 + 453**; `window-session`
  **1,765 = 656 + 656 + 453**.
- Across all eleven captures: **9,350 changed pixels in 10 connected components, every component
  exactly 22x22, 28x28 or 44x44. Not one changed pixel falls outside a mark interior.**

The marks also did not move: bounding boxes identical at all three sites, and the per-row inset profile
differs at exactly two bottom rows each on the 44px and 28px marks, by 1px inward — the pass's own
chroma threshold releasing an antialiased rim pixel as the fill darkens. **Do not read those four rows
as a radius change.**

### 4.7 THE CHAT REFUTATION IS CONFIRMED BY INDEPENDENT MEASUREMENT, AND CHAT'S PLATEAU SIGNAL IS CONFOUNDED BY THE INSTRUMENT

The leg refuted wave 3's Chat gap **before the wave ran**, on source: `.chat-column` already ships
`padding: 24px 0 32px` — the spec's own 24px — and `Chat.tsx:409` autoscrolls (`scrollTo({top:
scrollHeight})`), so the "~13px top inset" the wave-3 critic measured is a **scroll offset**, and raising
a padding that has already scrolled past cannot move it. `DESIGN.md` sets the transcript rhythm at
"24px vertical gaps, 40px around the date divider", and `.date-divider`'s 16px margins plus the column's
24px flex gap **are** that 40px. The request was indistinguishable from what ships.

**The smoothing pass confirmed it independently, having been asked only to measure** (the request was
framed as a neutral instrument question with no conclusion attached): **~89px of transcript sits ABOVE
the viewport**; rows `y0..y12` are completely empty; and the first visible element's rounded top corner
is **fully visible** from y13 (ink width growing 434 -> 456 across eleven rows). **Nothing is cut by the
top edge** — the absent ~89px is whole earlier content plus the column's top padding.

**The consequence is bigger than one refuted gap.** A critic judging `chat.png` **cannot** see the top
of the transcript at all: not a first-message treatment, not a session header, and **not the date
divider** — which is one of the two criteria `linear-changelog` was chosen to judge
(`.gauntlet/bar/README.md`). Wave 1 recorded this as not-finding (g); wave 3's critic then produced a
**gap** out of it; wave 4 measured it. **The instrument gap has now cost a wave a builder.**

**So Chat's sixth prose-weight raising is a plateau signal AND an artifact, and both readings are
recorded.** Adjudication 2.4's standing instruction is followed — reported as a plateau signal, not
refuted a sixth time. But the signal is confounded: the surface the critic can actually see is smaller
than the surface, so "no new axis" partly measures the capture rather than the artifact. **A wave does
not sweep the instrument** (#166's precedent: comment, do not act), so this is filed, not fixed.

Two small slips in an otherwise exceptional pass, recorded because this run tracks instrument error
rate rather than assuming it is zero: it reported the column's top padding as **32px** where the source
says **24px** (32 is the bottom), and it read the second assistant turn as contributing "an avatar and
nothing else" when that turn's single prose line sits **beside** the avatar rather than below it. No
conclusion in this file rests on either.

### 4.8 THE SAME CRITIC SLIP RECURRED ON THE SAME FILE, SO IT IS REPRODUCIBLE RATHER THAN RANDOM

Wave 3's Titlebar critic reported `window-session.png` as `1440x912` against a true `1440x900`. **Wave
4's Titlebar critic reported `1440x912` again** — same slip, same file, same piece slot, independent
critics on the same family two waves apart. Wave 3 recorded its two errors as evidence that "this
instrument does make dimension slips"; wave 4 upgrades that to a **specific, repeatable** one. Every
other dimension checked out (Welcome reported `welcome.png` 1440x852, `window-welcome.png` 1440x900 and
`linear-method.png` 1680x1050, all correct; Sidebar reported 248x852, correct; Chat reported
`chat.png` 1192x721, correct). **No verdict rests on it**, and the rule stands: a claim resting on a
critic's reported frame size must be re-measured.

### 4.9 NO NEW PIECE, AND FOR THE THIRD WAVE RUNNING THE MISSING ARTIFACT IS A TEST — BUT THIS TIME THE TEST IS EXACT

The pass proposed **none**, and refused on the merits rather than by deferral: the one genuinely
cross-surface defect is the 5px seam, it lives in the boundary **between** Chat and InputBar (two panes
of different effective width each correctly centring the same 760px measure), and a piece that could own
it would have to take the shared column measure **away from two existing pieces** — redrawing the scope
boundary of the decomposition from inside the loop. That is the identical objection that parked
`ToolCard`. The seam needs an owner decision about which pane width is canonical, not a sixth critic.

**And the wave produced the sharpest version yet of the run's recurring answer.** Finding 5: this
wave's one landed change **has no test pin at all**, and the smoothing report is measurably its only
one. Had `background: var(--mark-depth), var(--mint)` failed to parse, all three sites would have
measured `[0.00, 0.00, 0.00]` exactly as wave 3 did **and every text-based pin in the repo would still
be green** — jsdom loads no CSS, and `theme.test.ts` validates palette keys rather than layer values.

The test, stated precisely enough to build: **assert interior stddev > 2.0 on the G channel at the three
mark sites, with the mint mask eroded 2px** — the erosion is load-bearing, because a 4px *bounding-box*
inset on a 22px mark truncates 18% of the ramp and reports ~20% low. **A floor, not a target. Do not pin
6.41.** Expect three different values, because a disc and a rounded square do not carry a ramp alike.

**Three consecutive waves have now concluded that the decomposition into SURFACES is complete while the
missing artifacts are INVARIANTS.** That is the run's structural finding, and it is why the piece list
has not churned.

### 4.10 What wave 5 inherits

**Three builders. Welcome and Chat are both blocked, for different reasons.**
Cost: **3 + 5 + 1 = 9 agents.**

| piece | wave 5 gap | trap |
|---|---|---|
| Welcome | **NONE — no builder, third wave running.** Its only surviving gap is the vertical-placement **owner call**, now raised by **three independent critics on three waves**, all computing the same destination (−60.00px, midpoint y366 against pane centre y426). | Do NOT build it without the owner. This piece is **blocked on a human, not plateauing on the instrument** — do not let its unchanged verdict be read as the artifact having converged. Do not refile the centring (FIXED at +0.50px, the arithmetic floor) or the mark's squareness (r/side 0.3182 at both sizes). |
| Titlebar | **Equalise the mark's finish across the three shapes (4.4, finding 2).** One alpha yields G stddev **5.00 (22px square) / 5.77 (44px plate) / 4.90 (28px disc)**, so the identity paints three finishes; the 44px reads 18% deeper than the avatar. Make the three read as one finish. | ⚠️ **This is NOT "raise the alpha", and the critic's own "1px inset edge plus 2px soft shadow" is not the fix either.** 6.41 is unreachable (R ceiling 4.65) and `alpha ~= 0.138` would push G past the reference's 9.09. **Cross-file again**: `.logo-mark` in `titlebar.css`, `.welcome-mark` and `.avatar` in `chat.css`, plus `--mark-depth` in `tokens.css`. **Guard: no second mint hue** (chroma movement is permitted by `theme.test.ts`, hue is not). #140 allows only ONE box-shadow with a nonzero **horizontal** offset and it is the rail stripe. |
| Sidebar | **Compress the pre-list stack IN PLACE to ~175px** (4.5): bg-sessions trimmed without folding ~37 + filter ~7 + scope ~4 + group heading ~2 = ~50px off the measured 225. Critic asked 170. **Also repair `.session-scope`'s false comment** while you are in that file. | ⚠️ **RELOCATION IS FENCED** by `tests/background-sessions.test.tsx` ("it sits ABOVE the stored-transcript groups in the rail", #91) and **the fold onto the head row is width-refuted** (224px row, 179px before status text, ~92px needed). ⚠️ **The `order: 1` dodge passes that test and must still be refused** — focus-order lie, and `.sidebar-foot` is `order: 0`. Do not touch `shared.css` (`gui-94` already red there). Do not remove or rename any class (`gui-49`/`gui-95` already red). Keep the empty state's copy AND its `Refresh`. `.sidebar-head`'s 44px is pinned by the spec's "same 44px head". |
| Chat | **NONE — no builder.** The sixth prose-weight raising is reported as a **plateau signal** per 2.4's standing instruction, not refuted again. | ⚠️ **Do not read Chat as a converged surface.** Its critic provably cannot see the top ~89px of the transcript (4.7), including the date divider `linear-changelog` was chosen to judge — so its axis exhaustion partly measures the capture. Filed, not fixed: a wave does not sweep the instrument. |
| InputBar | **The 5px seam, COMPOSER SIDE ONLY — `composer.css`.** Mirror the transcript's 10px scrollbar reserve on the composer's container so both 760px boxes centre in the same effective box. This is now the **only unrefuted form**. | ⚠️ **Do NOT touch `.chat`**: `gui-51` pins its gutter at 12.5dev and says "never widen", and `gui-98` pins `.subagent-drawer .chat-column` at exactly 760px in an 820px pane — **`.chat` is reused at a narrower width where the measure is already at its limit**. ⚠️ **Refuse a sixth distribution request**; the axis died at 2.5 and is refused against the spec's authorised "Chat column: max-width 760px, centered". `.message-input` stays ungrouped. |

**THE DEFERRED ROW-VOCABULARY REPAIR IS WAVE 5'S, AND IT IS THE LEG'S OWN CHANGE, NOT A BUILDER'S.**
Wave 3 split the row vocabulary — session row `r16` via `--r-bubble` against the dock rows' `r8`, where
they were **identical at 8px** — while `DESIGN.md` calls the Agents dock the rail's mirror with the
"**same 44px head, same row shell**". That sentence has been false since wave 3. Wave 3 planned wave 4 to
fix it; **wave 4 deferred it deliberately**, because wave 4 ran three builders across two shared
stylesheets and the dock byte-identity control was the only instrument proving that sharing held —
spending it in the wave that most needed it is backwards. It has now held **four waves**, and a control
that can never be spent is not an asset.

So wave 5 pays it, with these terms:

- **The leg does it, not a builder** — it is not a critic gap, it is spec-consistency debt this run's own
  ownership instruction created, and the precedent is adjudication 2.7 (the leg paid a D4 debt a builder
  could not). It costs no agent.
- **After the Sidebar builder returns and before the capture**, so one owner touches `rails.css` at a
  time and the committed tree still matches the captures the critics judge.
- **Expected consequences, stated in advance so they are not read as regressions:** the three dock
  captures will change **for the first time in the run**, and the diff should be **confined to corner
  bands**. The change is radius-only and therefore layout-neutral, so **`gui-94`'s message must stay
  byte-identical** — it already reds on `.command-row-desc`'s line box and row height, and if that
  message moves, the change was not layout-neutral and should be reverted.
- Propagate via the existing `--r-bubble` token to `.agent-row-btn` / `.command-row-btn`; do not mint a
  tenth bare literal.

**Standing instruction for the wave-5 leg, learned this wave:** the wave-3 lesson ("inline the source
in the brief") is **necessary but not sufficient**. This wave's Sidebar builder died **twice** on the
180s no-progress limit even with its CSS inlined, because the brief told it to *read* a 760-line
component and a 1313-line stylesheet in place. The attempt that landed used **bounded reads**
(`Read` with `offset`/`limit`). **Inline what it must edit, and name the exact line ranges for anything
it must open.**

## Wave 5 adjudications

**Verdict spread: 5/5 `BAR WINS`, and TWO of those are REGRESSIONS. Zero `SPEC BREAK`s returned.
`critic_degraded: false`.** `plateau: 0 -> 1`. Two builders ran and **both landed, both with their
numeric predictions confirmed exactly on pixels**; a third piece burned **eighteen** agents across
three brief shapes without producing a justified change. The six-agent judging fan-out returned
first time with zero deaths and zero stalls — the second clean one of the run.

### 5.1 THE DECISIVE TEST LANDED ON TWO PIECES AT ONCE, AND BOTH OF THE RUN'S VERDICT MOVEMENTS REVERSED ON ZERO CHANGED PIXELS

Adjudication 3.1 set an explicit falsification test for the run's first verdict movement: *"if a wave
leaves the window frame unchanged and Chat's verdict stays at `TOO CLOSE`, reading (a) is supported;
if it falls back to `BAR WINS`, (b) is."* Wave 4 could not run it cleanly. **Wave 5 ran it, and it
came back for (b) — twice.**

| piece | wave 4 | wave 5 | its own capture | its zone of the shared frame |
|---|---|---|---|---|
| Titlebar | TOO CLOSE | **BAR WINS** | `titlebar.png` **byte-identical** | **0 changed pixels** |
| Chat | TOO CLOSE | **BAR WINS** | `chat.png` **byte-identical** | **0 changed pixels** |

The zone figures are the smoothing pass's, measured independently: attributing every changed pixel in
`window-session.png` by pane gives titlebar **0**, chat **0**, sidebar 34,373, input-bar 6,022, other
**0**. So neither piece's own surface moved, and neither piece's region of the frame moved. The only
inputs that changed for either critic are a rail 300px away and a composer below the fold.

**Both movements this run has recorded have now reversed without any input changing.** Wave 3's Chat
rise (on byte-identical pixels) and wave 4's Titlebar rise (on 453 pixels inside a 22x22 mark, 0.65%
of its surface) are each, on this evidence, better explained by inter-critic variance than by the
artifact. Wave 4 recorded the honest caveat at the time — *"a verdict moving on 0.65% of a surface is
either a sensitive instrument or variance wearing a causal costume, and one wave cannot separate
those"* — and wave 5 separated them.

**What this does NOT say.** It does not say the critics are bad, or that verdicts carry no signal. It
says a **single-wave verdict change is not evidence about the artifact**, because the same family on
the same pixels returns different ordinals two waves apart. A verdict that held across several waves
would still mean something; a movement in one wave does not.

**The plateau counter takes the increment, and the contract is followed as written for the third
consecutive unflattering result.** No piece improved, so `plateau += 1`. A regression is not an
improvement. Wave 2 obeyed the contract when four surfaces measurably improved and the counter still
rose; wave 3 and wave 4 obeyed it when it flattered them. Applying it selectively now would be the
same error a third time.

**But owner call 20 is now much sharper, and this is the wave that sharpened it.** The counter treats
a regression and a stall identically — that was the original complaint. Wave 5 adds a worse problem:
**the counter also treats critic noise and artifact change identically.** Waves 3 and 4 each reset the
counter to 0 on movements that do not reproduce, which means the run has already spent two resets on
noise, and the stop signal is measuring the instrument's variance as much as the work. For the owner,
in one line: **either the stop rule should require a verdict to hold for two consecutive waves before
it counts as movement, or the run should accept that `plateau` is a noisy estimator and read the gap
column instead.** Not decided by a wave — changing the rule mid-run would also destroy comparability
with runs 1 and 2, which is exactly why wave 3 refused to touch it.

### 5.2 THE ROW-VOCABULARY REPAIR LANDED LAYOUT-NEUTRAL, AND ITS COST IS RUN LENGTH ON THE ONE ELEMENT THAT HAS NOTHING ELSE

This was the leg's own change, deferred from wave 4 and paid here on 4.10's terms. It propagated
`--r-bubble` to `.agent-row-btn` / `.command-row-btn` and removed the group's bare `8px`, so the
corner is declared **once** for all three row types.

**Every stated prediction held, and the revert trigger did not fire.**

- `gui-94`'s message is **byte-identical to the pre-wave baseline**, character for character
  (`AC3 .command-row-desc line box moved: 12px before → 31.9px after (19.9px) | AC4 row height moved:
  60px before → 65.1px after (tolerance 0.8px)`). 4.10 named exactly that as the revert condition,
  because that driver measures the two quantities a non-layout-neutral radius change would move.
- Only `commands-dock.png` changed: **1,795px in 28 connected components, every one a 16x16 square**
  hugging `x7..22` or `x226..241`. That is 7 command rows x 4 corners. The middle band `x23..225` —
  203 columns, where all the text lives — contains **zero** changed pixels. Row heights, border
  scanlines and box edges are identical lists in both waves.
- `agents-dock.png` and `appearance-dock.png` are **still byte-identical across all five waves**, so
  the run's strongest ownership control was spent only **one third**, not consumed. A later wave
  should not treat it as gone.

**The cost is real and was not predicted: the dock rows lost border run.** The command row's outline
is its *only* indicator, and the bigger arc ate 14px off every edge — top horizontal straight run
227px -> 213px of a 235px box, left vertical run **87.7% -> 66.2%** on the 65px rows and **83.7% ->
55.1%** on the two 49px rows. That is a worse proportional loss than the session stripe's own
89% -> 73% at wave 3. **And the wave-3 share-trap reproduced exactly on this new element:** pixel
count within the border bands ROSE 5,723 -> 5,802 (+79, the taper adding antialiased pixels) while
ink weight FELL 3.0%. A count-based or share-based check reports the opposite of what happened. Only
run length shows it. That is now **twice** this trap has caught the same class of change.

**The deeper finding, and it is a critique of the repair rather than of the split it fixed: a token
is not a shape.** The 16px corner now sits on boxes of 74, 65, 65, 65, 64, 49 and 49px height. The
arc consumes 2r/h of each row's vertical edge — 43.2% on the 74px rail row, ~50% on the tall command
rows, and **65.3% on the 49px rows**, which are left with 17px of straight edge out of 49. `DESIGN.md`
calls the dock the rail's mirror with the "same row shell"; the shells still differ by 25px of height.
The stylesheet's own argument for exempting `.session-delete` is that *a narrow box and a wide one
cannot share one corner* — **and that test was applied to WIDTH and never to HEIGHT**, where the 49px
row is the case that needed it.

**Kept anyway, for a reason that is structural rather than a defence of 16.** The Sidebar critic
independently asked this wave to take the session row from ~18px back to ~8px, arriving at the same
place from the other side. So there are now two independent signals against r16 on rail rows. The
repair does not decide that question — but because all three row types now read one token, **the
question is one edit instead of three.** Wave 6 can move the whole vocabulary with a single value
change, which was not true before this wave.

**One claim in the leg's own comment was false and has been corrected in source.** It argued the agent
row's corner is "unobservable in a capture" because it paints `background: transparent` with no
border. True of the default state — but `rails.css:995` sets `.agent-row--selected > .agent-row-btn
{ background: var(--tint-3) }`, so a *selected* agent row paints a ground and does show its corner,
and `.agent-row--nested` carries a `border-left` in every state with its two left corners pinned at
3px (an asymmetry that went 3:8 -> 3:16, doubling 2.7x -> 5.3x). **No capture in the run holds a
selected agent row, so part of this change was justified on evidence the capture set cannot supply.**
The smoothing pass caught it; the comment now states it plainly.

### 5.3 THE SEAM WAS RELOCATED RATHER THAN CLOSED, AND IT IS KEPT ANYWAY ON WAVE 2'S PRECEDENT

The InputBar build did exactly what it was asked and its prediction was exact: `.input-bar`'s padding
went `12px 24px 16px` -> `12px 34px 16px 24px`, mirroring the transcript's 10px scrollbar reserve, and
the composer pill moved **x464..1223 -> x459..1218**, width unchanged at 760. Since `chat.png` is
byte-identical the transcript column is still at x459..1218, so **in the captured state the jog is
0.00px at both edges**, from 5.00px. Three waves of a standing seam, closed.

**And the smoothing pass showed that closing it in the captured state opened it in another.** `.chat`
is `overflow-y: auto`, `scrollbar-gutter` appears nowhere in `src/` (grepped), and the global
`::-webkit-scrollbar { width: 10px }` is a **classic** scrollbar — it occupies layout space only
*while the content overflows*. So:

| | transcript overflowing | transcript NOT overflowing |
|---|---|---|
| wave 4 | jog **+5px** | jog **0** |
| wave 5 | jog **0** | jog **−5px** |

The pass built that layout model and validated it against three measured positions to the exact pixel
before drawing the fourth (transcript overflowing predicted x459..1218 / measured x459..1218;
composer wave 4 predicted x464..1223 / measured x464..1223; composer wave 5 predicted x459..1218 /
measured x459..1218). Wave 4's own composer independently confirms that x464 is where a 1144px
content box centres. **The composer was pinned to the overflowing centring; the same 5px now lives in
the state no capture holds.**

**It is NOT reverted, and the reason is wave 2's precedent rather than a judgement that the trade is
good.** The gate is green, the change is a proven pure 5px translation (`w5(x,y) == w4(x+5,y)` over
`input-bar.png` returns **156,684 of 156,684 pixels identical, zero differing**), and the critics
judged this tree. Wave 2 established the rule for exactly this case: *"where a wave's build is now
known to be wrong, the fix is the next wave's named gap rather than a quiet revert,"* because a
committed tree that differs from its own capture set poisons the next wave's attribution. So it
stands, loudly recorded, as wave 6's InputBar gap.

**The honest statement of the residual: neither state is strictly better.** Before, the app was
aligned on a short transcript and 5px out on a long one; now it is the reverse. The fix that would be
unconditionally right is a stable gutter on the transcript side — **and that is the form wave 4 built
and lost to `gui-51` and `gui-98`**, because `.chat` is reused in the subagent drawer at 820px where
the 760px measure is already at its limit. Both sides of this seam are now fenced, which makes it an
owner-shaped question rather than a builder one.

### 5.4 THE TITLEBAR GAP IS REFUTED AT ITS ROOT, AND EIGHTEEN AGENTS DIED ESTABLISHING IT

**Three separate claims died this wave, and the third one closes the thread.**

**(i) Wave 4's finding 2 — "one alpha paints three finishes" — is an INSTRUMENT ARTIFACT.** The
measurement erodes a fixed 2px from boxes of 22, 44 and 28px, sampling 81.8% / 90.9% / 85.7% of the
ramp, so its 5.00 / 5.77 / 4.90 are three different fractions of ONE ramp. Span-corrected implied
ranges are **22.8 / 23.4 / 23.2**; a least-squares fit of interior slope against normalised depth
gives **-21.80 / -22.77 / -22.34**, agreeing to 4.3%; and the 22px and 44px marks have **identical top
and bottom rows**. The smoothing pass then refuted its own finding by a **third, independent route** —
an erosion sweep at e=1,2,3,4 showing every site's dL shrinking smoothly and monotonically as the
sampled span narrows, which is the signature of one ramp measured over shorter spans.

**(ii) The leg's REFRAMED gap — "match the reference's chroma-shifting ramp" — is also refuted, and
this one matters more because the leg authored it.** Measured on the bar's own
`frost-mono-reference.png`, segmented on **chroma alone with no hue prefilter** (the smoothing pass's
methodological improvement on the leg's own probe, which had masked on hue 140-190 and so presupposed
the answer):

| | top hue | bottom hue | Δhue | Δchroma |
|---|---|---|---|---|
| reference x3 | 192.7 / 193.2 / 193.4 | 205.3 / 205.3 / 204.7 | **+12.54 / +12.07 / +11.26** | **+0.0068 / +0.0070 / +0.0064** |
| app x3 | 179.9 / 180.1 / 180.5 | 179.8 / 179.9 / 180.5 | **−0.08 / −0.23 / +0.05** | −0.0042 / −0.0060 / −0.0044 |

Two things follow and both kill the gap. **The reference's mark is not at this app's hue at all** —
12.7deg apart at the top, widening to 24.9deg at the bottom, never coinciding — so its per-channel
R/G/B spread is a property of *its* base colour and was never a target for ours. And **the reference's
depth cue moves HUE, not chroma**: decomposed in the OKLab (a,b) plane, its tangential/radial ratio is
**2.56 / 2.35 / 2.41** (hue rotation carrying ~2.4x the chroma change) against the app's **0.01 / 0.04
/ 0.02**, and its chroma *rises* with depth where the app's falls. The app's mechanism is confirmed as
a hue-preserving proportional multiply, with L-ratio and C-ratio agreeing to 0.35% / 1.66% / 0.40%.

**So copying the reference's mechanism means rotating hue by ~12 degrees, and the one-accent identity
floor is counted BY hue.** The thing the bar demonstrates is the one thing this app may not do. The
original authored comment — *"BLACK, and deliberately not a second mint... the hue angle stays at
~180deg exactly"* — was right all along, and is now right for a measured reason rather than an
asserted one. **This closes the mark-depth thread**: it is not an unmet target, it is two mechanisms
that differ on purpose. Recorded in `tokens.css` so no future wave re-derives it.

**(iii) The builder slot could not be filled, and the cause is the harness rather than the task.**
Eighteen agents stalled on the 180s no-progress limit across three brief shapes. The transcripts name
it: every attempt that got past its first read emitted *"I'll make the edit first, then justify it"*,
made one bounded `Read`, and then stalled **without ever reaching the `Edit` call**. The first brief
required rewriting a ~20-line authored comment verbatim in both halves of the edit plus deriving a
colour value — a very long single emission. **This is the same signature wave 3 diagnosed on its Chat
critic**, which stalled twice because PART A asked for 923 characters of verbatim text where the other
four surfaces asked for under 150, and which wave 3 correctly identified as emission length rather
than payload weight. The third brief cut the emission to one line and still stalled, so the diagnosis
is incomplete — but it is not the wave-3/4 failure (reading instrument source), because these
attempts read exactly what they were told to and nothing more.

⚠️ **An unjustified value reached the tree and was REVERTED.** One interrupted attempt landed
`oklch(0.52 0.14 180 / 0.5)` before dying, and later attempts then burned their windows discovering
that the line no longer matched their brief and investigating why — **the retries were fighting each
other**. Measured (clipped to sRGB, since the stop is out of gamut on R and a browser clips it), that
value paints **2.46x / 1.98x / 3.74x** the reference's per-channel stddev — far too heavy, and derived
by nobody. It was reverted, and `titlebar.png`, `welcome.png`, `welcome-min-window.png`,
`window-welcome.png` and `chat.png` are all byte-identical to wave 4, with **0 differing pixels at all
four mark sites**, which proves the revert complete at the pixel level.

**For a future leg running a retry batch: a stalled attempt may still have written to the tree. Check
`git status` between attempts, or the next attempt inherits a half-finished change as its starting
state and spends its window on archaeology.**

### 5.5 THE RAIL COMPRESSION HIT ITS PREDICTION EXACTLY AND ITS TARGET BY HALF, AND THE MISS IS ARITHMETIC RATHER THAN EFFORT

The Sidebar builder moved seven declarations, every value drawn from the file's existing vertical set
{2,3,4,6,8,10,16} plus control heights {28,34,44}, and predicted **−23px**. Measured by
cross-correlating the row-intensity profile below the stack, the minimum is at **dy = −23** and is
razor-sharp (mean abs error **0.944** against 12.8+ at ±1px). The smoothing pass independently read
the first session row's top edge as **y225 -> y202**, 26.41% -> 23.71% of the 852px rail.

**It is a pure translation with zero reflow**, proven three ways: every one of 22 text bands has
identical left extent, right extent and pixel count between waves with only `y` changing; the
leftmost-ink histogram is identical (`x17:10, x16:9, x15:1, x6:1, x32:1`), so **the shared 16px left
edge did not move**; and a shifted byte comparison `w5(x,y) == w4(x,y+23)` matches **140,658 pixels
with 454 differing**, all 454 being the test window crossing into bottom-anchored furniture that
correctly does not translate.

**The target was not reached, and the builder refuted it rather than missing it quietly.** Against the
critic's asked ~170-175px it delivered 23px of the ~50px sought — 46%. Its floor arithmetic, which the
leg checked: `44` (spec-pinned head) + `~21.6` (Refresh control's line box) + `~50` (three rendered
lines of empty-state prose at 11px/1.45) + `1` (section hairline) + `29` (filter at the rail's own
28px housing) + `~28` (chips) + `4` + `~23.6` (group heading) ≈ **202px**. It landed on that floor.
**The residual ~27px is the empty state's two-line hint, and the brief forbids removing it** — the bar
requires an empty state to be authored copy plus a real action, and the smoothing pass confirmed both
halves survive ("None running here" y78..89, "Scoped to the open project." y97..107, `Refresh` at
y56..66). So **~175px is refuted by arithmetic while the copy stands**, and wave 6 should either
re-baseline the ask at ~200px or treat shortening the hint string as a separate, JSX-level question.

The builder also **declined two further shaves and said so** — a chip padding reduction that would
change a hit box, and a leading unification that would turn a measured comment into a restatement —
which is the right instinct and is recorded so a later wave knows they were considered rather than
missed. Its `28px` filter height is derived, not shaved: `.sidebar-toggle` is an explicit 28x28 in
`titlebar.css:370` (the leg verified this; the builder cited rails.css comment lines rather than the
declaration, which is loose but the number is right), while `34px` was a control scale no other
control in the rail used.

### 5.6 THE GATE IMPROVED AGAINST ITS OWN PRE-WAVE BASELINE, AND TWO OF THE STANDING REDS ARE FLAKES

**D7 GREEN on all three:** `typecheck` clean; `npm test` **96 files / 1412 passed / 43 skipped**,
identical to waves 3 and 4; `build` clean at bundle **`index-BeD6P9jc.css`** — and that is the hash the
captures were taken from, re-verified *after* the leg's comment edits, so the committed tree renders
exactly what the critics judged.

**The rendered half went 34/39 at the pre-wave baseline -> 36/39 after the wave.** The baseline itself
was the finding: it came back at **34/39 with FIVE non-PASS**, where waves 2, 3 and 4 all recorded
four. The fifth was `gui-118` — on a clean tree at wave 4's own committed HEAD, with no wave-5 change
present. Re-run standalone on the same tree it **PASSES at exit 0**. In the wave run both `gui-118`
and `gui-49` passed. So the four "standing" reds are really two persistent (`gui-94`, `gui-95`) plus
`gui-123` UNSCORED plus **two environment/load-dependent drivers that flip either way**.

**This is the third and fourth observed instance of #166's class in this run** — after `gui-72` and
`gui-124` in wave 3, both of which also passed standalone. The pattern is now well evidenced: a
driver that dies in the parallel phase and passes alone is reporting harness contention, not a product
break. Commented on the ticket rather than acted on; a wave does not sweep the instrument.

Every pin governing this wave's changes is green, including the two that killed wave 4's InputBar
build: **`gui-51` and `gui-98` both PASS**, confirming 4.10's reading that the composer side was the
only unrefuted form. Also green: `gui-91` (the rail's DOM-order pin from #91), `gui-45` (which touches
the filter input the Sidebar builder resized — it only *sets* a value and never measures the height),
`gui-136`, `gui-138`, `gui-93`, `gui-96`, `gui-gauntlet-wave3/4/7`.

### 5.7 INSTRUMENT AND METHOD — four things that change how a wave is run

**1. THE LEG'S OWN TOOLING SILENTLY REWROTE THE CRITIC INSTRUMENT, AND THE CONTROL CAUGHT IT.** A
Python text-mode rewrite of `wave5-critics.mjs` converted the file to CRLF — **385 line endings** —
which changed every byte of `CRITIC_SHARED` while leaving it visually identical. The byte-identity
check against wave 4 caught it immediately (`f89141c58449127c` -> `2618bdd10738a746`), it was
normalised back, and the instrument was verified identical before launch. **The control exists for
exactly this and had never fired before.** On Windows, use a tool that preserves line endings, and
re-run the check after ANY programmatic edit to a prompt file, not just after a hand edit.

**2. INLINE BACKTICKS IN A WORKFLOW TEMPLATE LITERAL ARE STILL A PARSE ERROR, AND THIS FILE'S OWN
WARNING WAS NOT ENOUGH TO PREVENT IT.** The critics workflow failed to launch with `bar is not
defined` because a path was wrapped in unescaped backticks inside the smoothing brief, terminating the
literal early. Cost was one failed launch and a re-run. **Grep the script for backticks before every
launch** — every one should be either a delimiter or `\``.

**3. A BUILDER BRIEF THAT DEMANDS A LONG VERBATIM EMISSION IS A STALL RISK, INDEPENDENT OF HOW HARD
THE TASK IS.** See 5.4(iii). The two builders that landed this wave both had briefs whose required
output was a short declaration; the one that never landed had to reproduce a 20-line comment inside
its edit. **Do not ask a builder to rewrite a long authored comment as part of its change — have the
leg do the comment, and let the builder emit the declaration.**

**4. THE SMOOTHING PASS CORRECTED THE LEG'S MEASUREMENT METHOD, AND THE CORRECTION IS THE REASON 5.4
IS TRUSTWORTHY.** The leg's own probe of the reference marks masked on hue 140-190 — which
presupposes the very thing being asked when the question is *"is the reference at the same hue?"*. The
pass segmented on **chroma alone**, got the same answer by a cleaner route, and said why the leg's
route was circular. It also excluded one reference component whose erode-2 read collapsed by erode-4,
correctly identifying it as a mask swallowing a fade into ground rather than a mark interior. **This
is the fourth consecutive wave the smoothing slot has earned its agent, and the first time it has
corrected the leg's methodology rather than a builder's claim.**

### 5.8 What wave 6 inherits

**Two builders. Welcome and Chat are blocked for the fourth and second consecutive wave respectively;
Titlebar's thread is closed and it has a genuinely new axis.**
Cost: **2 + 5 + 1 = 8 agents.**

| piece | wave 6 gap | trap |
|---|---|---|
| Welcome | **NONE — no builder, fourth wave running.** The vertical-placement **owner call** is now raised by **four independent critics on four waves**, every one computing the same ~60px. | Do NOT build it without the owner. **Blocked on a human, not plateauing on the instrument** — do not let its unchanged verdict read as convergence. Centring is FIXED at +0.50px (the arithmetic floor) and re-measured unchanged this wave; the mark's squareness is settled at r/side 0.3182. |
| Titlebar | **NEW AXIS, and the first non-mark Titlebar gap of the run: the left cluster overruns the structural column below it.** The `Bypass` pill ends at ~x276 while the sessions-rail divider is at x247, so the identity group crosses a line the whole window is built on. Critic asks to end the left group 12–16px before the divider. | ⚠️ **Check `gui-136` first.** It pins flank equality, and wave 3 measured only **3.25px of slack** at the binding case (welcome@640, right-flank floor 120, `640 − 81.5 = 558.5` splitting to 279.25 against a 276 floor). Wave 3's builder proved a bare `margin-left: 16px` would red it by 25.5px against an EPS of 1.0. Any regrouping must be width-neutral by construction, the way wave 3's `7/16/7` re-cut was. **The mark-depth thread is CLOSED (5.4) — do not reopen it, and do not re-aim at the reference's per-channel numbers.** |
| Sidebar | **The radius question, now a single edit.** Two independent signals say r16 is wrong on rail rows: this wave's critic asked for ~18px -> ~8px directly, and the smoothing pass showed one token on 74px and 49px boxes is not one shape (arc eats 65.3% of a 49px row's edge). Because wave 5 unified the token, **one value change moves all three row types.** Decide 8 or 16 and state why. | ⚠️ Reversing wave 3's landed build needs a better warrant than one critic — read 5.2's arithmetic and the `.session-delete` precedent (a narrow box and a wide one cannot share one corner; the same test was never applied to HEIGHT). **Whatever you choose, measure straight-run length, not pixel share** — the share check reported the opposite of the truth twice now (count +79 while ink weight fell 3.0%). The compression is done and must not be undone: y202 is the arithmetic floor while the empty state keeps its copy (5.5). |
| Chat | **NONE — no builder.** The **seventh** prose-weight raising is reported as a plateau signal per 2.4's standing instruction. | ⚠️ Still confounded: the critic cannot see the top ~89px of the transcript (re-confirmed unchanged — thumb y79..716, ~89.3px above the viewport, first ink y13). Its axis exhaustion partly measures the capture. Filed, not fixed. |
| InputBar | **The seam is not closed, it MOVED (5.3).** Wave 5 pinned the composer to the overflowing centring, so the jog is 0 when the transcript overflows and **−5px when it does not**. Decide which pane width is canonical. | ⚠️ **The transcript side is fenced** (`gui-51` "never widen these", `gui-98`'s 760px in an 820px subagent drawer) and the composer side now trades one state for another, so **both sides are fenced and this is an owner-shaped question.** ⚠️ **Refuse a seventh distribution request** — six critics across two runs, refused against the spec's authorised "Chat column: max-width 760px, centered". |

**THE INSTRUMENT CHANGE THE SMOOTHING PASS PROPOSED, AND IT IS THE BEST VALUE IN THE WAVE.** For the
fourth consecutive pass the answer to "new piece?" is **NONE — the missing artifact is a test** — but
this time it is one capture that closes two open items at once. A **`window-session-short.png`**: a
session whose transcript does NOT overflow. That state (a) has no scroll offset, so the top of the
transcript and its **date divider** are in frame, closing the two-wave-old instrument gap that
`linear-changelog` was chosen to judge and that has already cost a wave a builder (4.7); and (b) is
exactly the state in which 5.3's model predicts transcript x464..1223 against composer x459..1218 — a
**falsifiable −5px jog**. One new capture adjudicates the wave's headline finding and repairs the
instrument. ⚠️ Note that changing `inspect`'s file set breaks SHA null-control comparability with
waves 0–5, so it is a deliberate instrument change, and the honest form is to **add** a twelfth file
rather than alter any of the eleven.

**`ToolCard` remains PARKED** for the wave-1 reason — adopting it rewrites a human-owned scoping rule
in `.gauntlet/bar/README.md`, and a loop body must not edit the boundary of its own scope.

## Log

- [wave 5] **THE DECISIVE TEST LANDED ON TWO PIECES AT ONCE, AND BOTH OF THE RUN'S VERDICT MOVEMENTS
  REVERSED ON ZERO CHANGED PIXELS.** Adjudication 3.1 asked for exactly this: leave a piece's inputs
  unchanged and see whether its verdict holds. **Titlebar `TOO CLOSE -> BAR WINS` and Chat
  `TOO CLOSE -> BAR WINS`, both on captures BYTE-IDENTICAL to wave 4, with 0 changed pixels in each
  piece's zone of the shared frame** (measured independently by the smoothing pass: titlebar 0, chat 0,
  sidebar 34,373, input-bar 6,022, other 0). So wave 3's Chat rise and wave 4's Titlebar rise are both
  better explained by **inter-critic variance** than by the artifact. **`plateau: 0 -> 1`** — no piece
  improved, two regressed, and the contract is followed as written for the third consecutive
  unflattering result. **This sharpens owner call 20 considerably:** the counter cannot distinguish
  critic noise from artifact change, and the run has now spent two resets on movements that do not
  reproduce. Adjudication 5.1.
- [wave 5] **THE MARK-DEPTH THREAD IS CLOSED, AND IT CLOSED BY REFUTING THE LEG'S OWN GAP.** Three
  claims died. (i) Wave 4's "one alpha paints three finishes" is an **instrument artifact** — a fixed
  2px erosion samples 81.8/90.9/85.7% of a 22/44/28px box, so 5.00/5.77/4.90 are three fractions of ONE
  ramp; span-corrected implied ranges 22.8/23.4/23.2, slope fit -21.80/-22.77/-22.34, and the 22px and
  44px marks have **identical top and bottom rows**. The smoothing pass refuted its own finding by a
  third independent route. (ii) The leg's REFRAMED gap — "match the reference's chroma-shifting ramp" —
  is **also refuted**: measured with no hue prefilter, **the reference's marks are not at this app's
  hue at all** (192.7-193.4 top vs 179.9-180.5, widening to 24.9deg apart at the bottom), and their
  depth cue **rotates HUE +11.3 to +12.5deg toward blue** with chroma RISING, against the app's
  hue-preserving multiply (|dH| <= 0.23deg, chroma falling). **Copying the reference's mechanism means
  moving hue, and the one-accent floor is counted BY hue** — so the thing the bar demonstrates is the
  one thing this app may not do. The original authored comment was right all along, and `tokens.css`
  now records why. (iii) **The builder slot could not be filled: EIGHTEEN agents stalled** across three
  brief shapes, every one dying between its bounded read and its `Edit` call — the emission-length
  signature wave 3 diagnosed on its Chat critic. An interrupted attempt left an **underived value in
  the tree** (measured 2.46x/1.98x/3.74x the reference) which was **reverted**, proven complete by 0
  differing pixels at all four mark sites. Adjudication 5.4.
- [wave 5] **BOTH BUILDS THAT RAN LANDED, AND BOTH PREDICTIONS WERE CONFIRMED EXACTLY ON PIXELS.**
  Sidebar predicted **−23px** and cross-correlation puts the minimum at **dy = −23** with mean abs
  error 0.944 against 12.8 at ±1px; first session row **y225 -> y202**, 26.41% -> 23.71% of the rail.
  It is a **pure translation with zero reflow** — 22 text bands with identical extents and pixel
  counts, identical leftmost-ink histogram so the shared 16px left edge did not move, and a shifted
  byte test matching 140,658 pixels. InputBar predicted the pill at **x459..1218** and it measures
  **x459..1218**, width 760, with `w5(x,y) == w4(x+5,y)` returning **156,684 of 156,684 identical,
  zero differing**. **The rail's ~175px target is refuted by arithmetic** — the floor is ~202px while
  the empty state keeps its copy, and the builder showed the component sum rather than missing quietly.
  Adjudications 5.5, 5.3.
- [wave 5] **THE SEAM WAS RELOCATED, NOT CLOSED — AND IT IS KEPT ANYWAY.** In the captured state the
  jog is genuinely **5.00px -> 0.00px** at both edges, three waves of a standing seam closed. But
  `.chat` is `overflow-y: auto` with **no `scrollbar-gutter` anywhere in `src/`**, and the global 10px
  scrollbar is a **classic** one that occupies layout space only while content overflows. So wave 4 had
  +5px when overflowing and 0 when not; **wave 5 has 0 when overflowing and −5 when not.** The
  smoothing pass validated that model against three measured positions to the exact pixel before
  drawing the fourth. **Not reverted, on wave 2's precedent** — the gate is green, the change is a
  proven pure translation, and a committed tree that differs from its own capture set poisons the next
  wave's attribution. Both sides of this seam are now fenced (`gui-51`/`gui-98` killed the transcript
  side at wave 4), which makes it owner-shaped. Adjudication 5.3.
- [wave 5] **THE ROW-VOCABULARY REPAIR LANDED LAYOUT-NEUTRAL, AND ITS COST IS RUN LENGTH.** The leg's
  own change, deferred from wave 4. `gui-94`'s message is **byte-identical to the pre-wave baseline**,
  which was the stated revert trigger and did not fire. Only `commands-dock.png` moved — **1,795px in
  28 components, every one a 16x16 corner square** at x7..22 or x226..241, with **zero changed pixels
  in the 203 middle columns** and identical row heights, border scanlines and box edges.
  `agents-dock.png` and `appearance-dock.png` are **still byte-identical across all five waves**, so
  the ownership control was spent one third, not consumed. **The cost, unpredicted: the command row's
  outline is its only indicator and lost straight run — 87.7% -> 66.2% on 65px rows, 83.7% -> 55.1% on
  49px rows — and the wave-3 share trap reproduced exactly** (count +79 while ink weight fell 3.0%).
  Deeper: **a token is not a shape** — one 16px corner now sits on 74px and 49px boxes, and the
  stylesheet's own "a narrow box and a wide one cannot share one corner" test was applied to WIDTH and
  never HEIGHT. Kept because the Sidebar critic independently asked to move the session row to ~8px, so
  the value is live — and unifying the token makes that **one edit instead of three**. One false claim
  in the leg's own comment was corrected in source: a **selected** agent row does paint a ground
  (`rails.css:995`), so "unobservable in a capture" was true of the capture set, not the component.
  Adjudication 5.2.
- [wave 5] **D7 GREEN AND THE RENDERED HALF IMPROVED AGAINST ITS OWN BASELINE: 34/39 -> 36/39.**
  `typecheck` clean, `npm test` **96 files / 1412 passed / 43 skipped** (identical to waves 3 and 4),
  `build` clean at **`index-BeD6P9jc.css`** — re-verified byte-identical *after* the leg's comment
  edits, so the committed tree renders exactly what the critics judged. **The pre-wave baseline itself
  was a finding:** it came back **34/39 with FIVE non-PASS** where waves 2-4 recorded four, the extra
  being `gui-118` on a clean tree at wave 4's own HEAD — which **passes standalone at exit 0**, and
  passed again in the wave run along with `gui-49`. That is the **third and fourth** instance of #166's
  class this run, after `gui-72` and `gui-124`. Every governing pin green, including **`gui-51` and
  `gui-98`**, the two that killed wave 4's InputBar build. Adjudication 5.6.
- [wave 5] **INSTRUMENT: THE LEG'S OWN TOOLING REWROTE THE CRITIC PROMPT AND THE CONTROL CAUGHT IT.** A
  Python text-mode rewrite converted `wave5-critics.mjs` to CRLF — **385 line endings** — changing every
  byte of `CRITIC_SHARED` while leaving it visually identical. The byte-identity check against wave 4
  fired immediately, it was normalised, and identity was re-verified before launch. **The control had
  never fired before and this is what it is for.** Separately: an **unescaped backtick** inside the
  smoothing template literal failed the workflow launch with `bar is not defined`, exactly the trap this
  file already warns about — grep for backticks before every launch. And the smoothing pass **corrected
  the leg's own method**: the leg's reference probe masked on hue 140-190, which presupposes the
  question being asked; the pass segmented on chroma alone and reached the same answer by a
  non-circular route. **Fourth consecutive wave the smoothing slot earned its agent, and the first time
  it corrected the leg rather than a builder.** Adjudication 5.7.
- [wave 5] **NO NEW PIECE, AND FOR THE FOURTH WAVE RUNNING THE MISSING ARTIFACT IS A TEST — but this
  one capture closes TWO open items at once.** A **`window-session-short.png`** of a session whose
  transcript does not overflow: it has no scroll offset, so the transcript's top and its **date
  divider** are in frame — closing the two-wave-old instrument gap that `linear-changelog` was chosen to
  judge and that already cost a wave a builder — and it is exactly the state where 5.3's model predicts
  a **falsifiable −5px jog**. Add it as a twelfth file rather than altering any of the eleven, or SHA
  null-control comparability with waves 0-5 breaks. `ToolCard` remains PARKED.
- [wave 4] **THE RUN'S SECOND VERDICT MOVEMENT IN TWO WAVES, AND THE MIRROR IMAGE OF THE FIRST:
  Titlebar `BAR WINS -> TOO CLOSE`, on the ONE piece whose own surface changed.** `plateau` stays 0, so
  the run has gone two consecutive waves without plateauing, on two different pieces, at wave 4 of 12.
  Where wave 3's movement landed on a piece with no builder and byte-identical pixels, this one landed
  on the only changed surface — **453 pixels inside a 22x22 mark** — and **the critic's own gap names
  that mark and asks for more depth**, which is a consistent story rather than a coincidence. Counter-
  weight recorded rather than buried: 453px is **0.65%** of `titlebar.png`, and one wave cannot separate
  a sensitive instrument from stable variance. Adjudication 4.1.
- [wave 4] **ONE BUILD LANDED OUT OF THREE, AND THE TWO REVERTS TAUGHT MORE THAN THE BUILDS WOULD HAVE.**
  D12 was applied literally — a red wave reverts and records — and **neither fence was edited to pass.**
  **Sidebar** relocated the live background-sessions section to the rail's foot and reddened a named
  `compareDocumentPosition` test from **#91** ("it sits ABOVE the stored-transcript groups"); the spec is
  silent, so it is a **test fence, not a spec break**, and an executable fence is the harder kind. Three
  things survived it: the critic's own **fold mechanism is refuted on width arithmetic** (224px row, 179
  before status text, ~92 needed for "None running here"), its **target IS reachable by pure in-place
  tightening (~175px against the asked 170)**, and a **CSS `order: 1` dodge exists that would PASS the
  test while lying about focus order — refused, and recorded so a later wave cannot "discover" it.**
  **InputBar**'s `scrollbar-gutter: stable both-edges` reddened `gui-51` (gutter 24dev against a pinned
  12.5dev, on a driver whose own comment says *"never widen these"*), `gui-98` (`.subagent-drawer
  .chat-column` 751.2px against exactly 760) and `gui-118`. **The generalisable fact: `.chat` is not one
  surface — it is reused in the subagent drawer at 820px where the 760px measure is already at its
  limit**, so the canonical seam fix is dead and the composer side is the only unrefuted form.
  Adjudication 4.5.
- [wave 4] **THE MARK DEPTH LANDED EXACTLY AS AUTHORED, AND THE PROOF IS A BACK-FIT RATHER THAN A
  THRESHOLD.** Interior stddev went from mathematically flat `[0.00, 0.00, 0.00]` at all three sites to
  `[3.63, 5.00, 4.83]` (22px), `[4.04, 5.77, 5.38]` (44px) and `[3.49, 4.90, 4.60]` (28px), ten of twelve
  channel readings inside the reference's `[3.65, 9.40]` band — and **solving alpha back out of the
  pixels gives 0.100–0.103 at every channel at every site against an authored 0.1.** **The wave's own
  6.41 target was arithmetically UNREACHABLE, so the miss is the brief's formula, not the build:**
  `alpha x 255 x L` conflates the mint's **OKLCH lightness** with an sRGB channel scale, and the true
  per-channel ceilings are **R 4.65 / G 6.58 / B 6.18** — R cannot reach 6.41 at any box size. Do not
  carry 6.41 forward; `alpha ~= 0.138` would push G past the reference's own 9.09. **This also corrects
  the leg's own first reading**, which blamed the whole shortfall on its 4px erosion — erosion is
  second-order. Adjudication 4.4.
- [wave 4] **THE BEST FINDING IS AGAIN A CROSS-SURFACE SEAM: ONE ALPHA IS PAINTING THREE FINISHES.** A
  ramp's stddev is size-invariant but **not shape-invariant** — a disc weights mid-ramp rows more than a
  near-square. Eroded end-row widths as a fraction of the widest: 22px `0.56`, 44px `0.55`, 28px
  **`0.25`** (the avatar is `border-radius: 50%`, a true disc). Measured G: **5.00 / 5.77 / 4.90**, so the
  avatar reads **flatter** than the 22px chip despite spanning more of its box and the 44px plate reads
  **18% deeper** than the avatar. **The identity now paints at three finishes rather than one** — the
  same class of inconsistency the brief said treating one site would create. That is wave 5's Titlebar
  gap, and it is the third consecutive wave the smoothing slot has earned its agent.
- [wave 4] **A `SPEC BREAK` CAME BACK AND IT IS REAL, BUT NOTHING CAN BE REVERTED UNDER IT.** The Chat
  critic caught that the centred titlebar paints `inspect-ws` while the selected session is a different
  string — and `DESIGN.md`'s Layout bullet says **"Center: session title"** while `.session-title`
  renders **`basename(cwd)`** (`Titlebar.tsx:305`), the workspace folder, with the rail simultaneously
  showing real session titles. Chat had no build, the break is in the Titlebar's centre slot seen through
  the shared frame, and the behaviour **predates run 3**. **It is the SECOND unresolved conflict on the
  SAME element** — adjudication 2.2 has it on the wrong type rung against the spec's own role table,
  open since wave 2. One element, two conflicts, two waves apart, two different critics. Filed, escalated,
  **not decided by a wave**. Adjudication 4.3.
- [wave 4] **THE LEG'S PRE-WAVE CHAT REFUTATION WAS CONFIRMED BY INDEPENDENT MEASUREMENT, AND THE
  CONSEQUENCE IS BIGGER THAN THE GAP.** The wave-3 Chat gap ("raise the transcript's top inset from ~13px
  to 24px") was refuted **before the wave ran**: `.chat-column` already ships `padding: 24px 0 32px` and
  `Chat.tsx:409` autoscrolls to `scrollHeight`, so the 13px is a **scroll offset** a padding cannot move;
  the divider's 16px margins plus the 24px gap are exactly the spec's "40px around the date divider".
  The smoothing pass, **asked only to measure and given no conclusion**, independently found **~89px of
  transcript above the viewport**, rows `y0..y12` empty, and the first element's rounded corner **fully
  visible** from y13 — nothing clipped. **So a Chat critic can never judge the top of the transcript,
  including the date divider that `linear-changelog` was chosen to judge.** Wave 1 logged it as a
  not-finding, wave 3's critic turned it into a gap, wave 4 measured it: **the instrument gap has now
  cost a wave a builder.** Filed rather than fixed — a wave does not sweep the instrument (#166's
  precedent). Adjudication 4.7.
- [wave 4] **CHAT HELD `TOO CLOSE`, WHICH IS THE FIRST POSITIVE EVIDENCE ON 3.1 AND SETTLES LESS THAN IT
  LOOKS.** Chat's inputs moved by ~0.15% of the frame (1,312px inside its two avatars; 1,765px frame-wide,
  all mark interiors) and its verdict held, so wave 3's movement was **not a one-off fluke**. But holding
  does **not** separate a real cross-surface lift from a *reproducible* inter-critic bias — both predict
  exactly this. 3.1's test was under-specified: only a fall-back would have been decisive.
  **AND CHAT'S SIXTH PROSE-WEIGHT RAISING ARRIVED**, so 2.4's standing instruction fires: reported as a
  **plateau signal** on this surface rather than refuted a sixth time — while noting the signal is
  confounded by 4.7's instrument gap. Adjudication 4.2.
- [wave 4] **THE CLEANEST OWNERSHIP CONTROL OF THE RUN, AND ZERO-REMAINDER ATTRIBUTION FOR THE SECOND
  WAVE RUNNING.** The three dock captures are **byte-identical across all four waves**; `sidebar.png` and
  `input-bar.png` are byte-identical wave 3 -> 4 with the hashes **proven live** (sidebar differed at every
  earlier step), so both reverts were complete at the pixel level and not merely by `git checkout`;
  `welcome.png`'s delta is **exactly one 44x44 component** (1,789px), which independently proves the
  reverted gutter left no trace on the pane outside the scroll container and that two builders sharing
  `chat.css` did not leak. Diffs sum exactly: `window-welcome` **2,242 = 1,789 + 453**, `window-session`
  **1,765 = 656 + 656 + 453**. Across all eleven captures, **9,350 changed pixels in 10 components, every
  one exactly 22x22, 28x28 or 44x44 — not one changed pixel outside a mark interior.**
- [wave 4] **D7 GREEN, AND THE PRE-WAVE BASELINE PAID FOR ITSELF A SECOND TIME BY MAKING A REVERT
  DECIDABLE.** `typecheck` clean, `npm test` **96 files / 1412 passed / 43 skipped** (identical to wave 3),
  `build` clean at bundle **`index-CFeKM2yi.css`** — the hash the captures were taken from, so the
  committed tree renders exactly what the critics judged. The rendered half went **35/39 at the pre-wave
  baseline -> 32/39 with the seam fix -> 35/39 after the revert**, with `gui-94`'s message byte-identical
  at all three points and the same four non-PASS (`gui-123` UNSCORED, `gui-49`, `gui-94`, `gui-95`).
  That sequence **is** the attribution: the three new reds were the gutter declaration and the mark depth
  caused none. Capture `PASS`, 11/11, exit 124 — the documented post-`PASS` hang, not a failure.
- [wave 4] **INSTRUMENT: THE SAME CRITIC SLIP RECURRED ON THE SAME FILE, so it is reproducible rather
  than random.** Wave 3's Titlebar critic reported `window-session.png` as `1440x912`; wave 4's reported
  `1440x912` again, against a true `1440x900` — same file, same piece slot, independent critics two waves
  apart. Every other dimension across the five critics checked out. No verdict rests on it. Separately,
  **the six-agent judging fan-out was the first of the run with zero deaths and zero stalls**, while the
  **Sidebar builder died twice** on the 180s limit even with its CSS inlined, because the brief told it to
  *read* a 760-line component and a 1313-line stylesheet; the attempt that landed used **bounded reads**.
  **Inlining the source is necessary but not sufficient — name the line ranges too.** Adjudications 4.8, 4.10.
- [wave 4] **NO NEW PIECE, AND FOR THE THIRD WAVE RUNNING THE MISSING ARTIFACT IS A TEST — now stated
  exactly enough to build.** The pass refused a piece **on the merits**: the 5px seam lives in the
  boundary *between* Chat and InputBar, so a piece owning it would take the shared 760px measure away
  from two existing pieces — the identical objection that parked `ToolCard`. And this wave's one landed
  change **has no test pin at all**: had the layered background failed to parse, all three sites would
  read `[0.00, 0.00, 0.00]` exactly as wave 3 did **with every text pin still green**, because jsdom
  loads no CSS and `theme.test.ts` validates palette keys rather than layer values. The test:
  **interior stddev > 2.0 on G at the three mark sites, mint mask eroded 2px, as a FLOOR not a target**
  — the erosion is load-bearing (a 4px bbox inset on a 22px mark truncates 18% of the ramp), and 6.41
  must not be pinned. Commented on **#168**, which already carries two invariants of this class.
- [wave 3] **THE RUN'S FIRST VERDICT MOVEMENT — `plateau: 1 -> 0` — AND IT LANDED ON THE ONE PIECE
  WITH NO BUILDER.** Chat went `BAR WINS -> TOO CLOSE` while `chat.png` stayed **sha256-identical to
  wave 2** (hash proven live: the same file DID change wave 1 -> wave 2). The only input that moved
  was its **window frame**, which this wave changed by 1,564px. Both readings are recorded and
  neither is resolved: **(a)** a genuine cross-surface lift — the smoothing thesis in reverse, since
  wave 2 caught one build *breaking* another surface's invariant — or **(b)** inter-critic variance,
  which wave 1 adjudication 4 already proved happens for gaps and nothing forbids for verdicts. **The
  counter is reset anyway, deliberately:** the written contract counts verdicts and does not ask why,
  and wave 2 obeyed it when the answer was unflattering. Applying it only when it flatters is the
  same error with the sign flipped. **Decisive test for wave 4:** leave the frame unchanged and see
  whether Chat holds `TOO CLOSE`. Adjudication 3.1.
- [wave 3] **ALL THREE BUILDS LANDED, ONE DECLARATION EACH, AND THE HEADLINE REPAIR IS VERIFIED ON
  PIXELS BY TWO INDEPENDENT MEASUREMENTS.** Welcome's 65px asymmetry is **GONE**: ink bbox
  `x480..894` (displacement **-32.50px**) -> `x513..927` (**+0.50px**), against a predicted x512.5.
  The mechanism is that a grid item's max-content *contribution* is its **margin box** while
  `max-width` clamps its **content box**, so `margin-right: -65px` sized the track to 415 while
  shrink-to-fit handed the item `415 - (-65) = 480` back — **the pinned 480px measure and its entire
  wrap tolerance survive untouched**, confirmed as exactly two line boxes at byte-identical y at
  *both* window widths. **+0.50px is the arithmetic floor**, not a residual (415px odd block, 1440px
  even pane). It is a **pure translation**: block ink width 415px in waves 1, 2 and 3, mark band
  1,809px and button band 9,890px identical in all three. Titlebar's break is **width-neutral by
  construction** (`3 x 7 + 9 = 30 = 3 x 10`), verified twice: painted extent `x14..275` in both waves
  and a pixel diff bounded at `x43..212`. Its builder also proved the *obvious* `margin-left: 16px`
  **would have red `gui-136` by 25.5px against an EPS of 1.0**, because welcome@640 has only 3.25px
  of slack. Sidebar's corner went r8 -> r16 via the existing `--r-bubble`, ratio 0.108 -> 0.216,
  confirmed by inset profile `[16,11,9,...]` against `[8,4,3,...]`, with the value **derived from the
  rail itself** (`.session-more` at 8/36.8 = 0.217, so 74 x 0.217 = 16.09) rather than from the
  brief's suggested bubble comparison. Adjudication 3.2.
- [wave 3] **THE WELCOME VERTICAL GAP IS ESCALATED, NOT REFUSED A THIRD TIME, AND THE ARITHMETIC IS
  WHY.** Wave 2's critic asked for the hero's midpoint at **y426**; wave 3's critic, on different
  pixels, independently measured it 60.5px high and asked for the same destination. **Symmetric
  padding produces y426.00 exactly.** So two critics did not re-raise a refused gap, they
  **reproduced a number**, and that number is what the asymmetric `min(152px, 17vh)` bottom reserve
  is spending. Wave 1's FINDING 5 proved the placement **deliberate**; it never proved it **good**,
  and the preset is explicit that **the spec is a fence, not the yardstick** — so refusing a bar
  critic because a value was chosen on purpose is using the fence as the yardstick, the one
  substitution this mechanism exists to prevent. **Owner call: keep the 60.5px lift, or go symmetric
  and land on y426.** Default taken: the reserve stands, and **Welcome gets no builder in wave 4.**
  Adjudication 3.3.
- [wave 3] **THE CENTRING INVARIANT'S INSTRUMENT WAS WRONG AND IS NOW FIXED.** Wave 2 measured
  off-centre by ink bbox **and** by mass centroid, and they agreed only because both readings were
  broken. They **necessarily diverge for a left-registered block**, proven by construction: wave 1's
  individually-centred hero read a centroid displacement of -0.89px, waves 2 and 3 read -124.45 and
  -91.59, and the centroid moved **+32.86px against a block translation of +33px** — so the whole
  residual is a property of the composition. **Read the invariant off the INK BOUNDING BOX**; a
  future wave measuring the centroid would "discover" a 91px defect that does not exist. Also:
  wave 2's "65px" is a **margin asymmetry**, so its displacement was 32.5px — never compare the two.
  And wave 2's chat-column figure is **corrected in the app's favour**: the scrollbar *reserve* is
  10px with only a 4px painted thumb, so `(1192 - 10 - 760) / 2 = 211` exactly and **the transcript
  is centred to 0.00px**, not off by 5. The invariant now holds in **six of six** places.
- [wave 3] **THE OWNERSHIP CONTROL IS THE STRONGEST THIS RUN HAS PRODUCED, AND IT IS ARITHMETIC
  RATHER THAN HASHES.** The three dock captures are byte-identical across waves **1, 2 AND 3**;
  `chat.png` and `input-bar.png` are byte-identical wave 2 -> 3 while having changed wave 1 -> 2, so
  the hashes are live. Then the pixel diffs **sum exactly**: `window-session` changed 1,564px =
  1,258 (titlebar) + 306 (sidebar); `window-welcome` changed 22,242px = 20,984 (welcome) + 1,258.
  **Every changed pixel in every composite frame is attributable to exactly one of the three named
  builder targets, with zero remainder.** The sidebar's 306px is confined to two 16px corner bands of
  one row; the titlebar's 1,258px to the app name and backend pill only.
- [wave 3] **THE SMOOTHING PASS FOUND ANOTHER TWO-LOCALLY-CORRECT-DECISIONS SEAM, AND IT IS THE BEST
  FINDING OF THE WAVE.** The app's most-repeated measure **jogs 5px at the composer seam**:
  transcript column `x459..1218` and composer pill `x464..1223`, both 760px, stacked, each centred to
  **0.00px in its own pane** — 1182px scrollbar-narrowed versus 1192px. Standing since wave 1 and
  structurally invisible to per-surface critics, because the two clips never contain each other's
  edge. It also **retired the radius-ratio table as a model**, correcting wave 2's finding 3: the
  four-box ranking went monotonic this wave but the tracking is *inverse* and survives only on
  hand-picked members — admit the commands dock's `235x65` at 0.123 and it breaks, and two boxes of
  identical height wear different corners. **There is no radius-per-height rule**, only three
  constants plus 8 on the rail rows. Identity floor **HOLDS** (one hue, eight sites, mint **down
  0.20%**, worst surface 4.134% and falling); type scale **HOLDS in rendering** (baseline pitch
  measured at exactly 24.0px on two surfaces against `15 x 1.6`). It disclosed its own ~2% absolute
  offset against the record, discarded a loose-threshold artifact, and **caught and corrected two of
  its own errors** mid-analysis. **No new piece: for the second wave running, the missing artifact is
  a TEST** — a radius/gap text scan — because every seam it found is *between* surfaces where no
  per-surface critic can look.
- [wave 3] **THE SIDEBAR BUILD'S ONE REAL COST, AND IT WAS BOUGHT BY THIS LEG'S OWN INSTRUCTION.**
  Scoping the radius to `.session-row-btn` preserved the dock control and kept a second cause off
  already-red `gui-94` — and **split the row vocabulary**: session row r16 against the dock rows' r8,
  where they were *identical* at 8px, while `DESIGN.md` calls the Agents dock the rail's mirror with
  the "**same row shell**". That sentence is now false. Treat it as a two-wave sequence, not a
  defect: wave 3 spent its brief proving ownership held, wave 4 can spend that proof to unify.
  Separately, **the selection stripe lost a fifth of its run** — solid run 89% -> 73% of the row —
  and the mint *share* check reports the opposite (sidebar mint rose 165 -> 173 from added
  antialiasing), so only run length shows it.
- [wave 3] **THE INSTRUMENT'S ERROR RATE IS NO LONGER ZERO, AND THE CHAT CRITIC TOOK THREE ATTEMPTS
  WITH NO TRIM.** Two of five critics misreported a secondary image's height (`window-session` as
  1440x912, `chat.png` as 1192x729; truth 1440x900 and 1192x721), against wave 1's "zero factual
  errors across nine critics". No verdict rests on either, and every *content* literal was right —
  the Welcome critic reported the hero bbox as `x=513–927`, matching this leg's own decoder exactly.
  The Chat critic stalled twice on the 180s no-progress limit and returned on the third attempt with
  a **byte-identical prompt**, so scrutiny was never weakened and run 1's trim-the-casualty trap was
  avoided. Cause is emission length, not payload: `chat.png` carries **923 characters** of text
  against input-bar's 80, while InputBar's *image* payload was the larger of the two.
- [wave 3] **D7 GREEN, AND THE PRE-WAVE BASELINE PAID FOR ITSELF ON ITS FIRST OUTING.** `typecheck`
  clean, `npm test` **96 files / 1412 passed / 43 skipped** (identical to wave 2), `build` clean at
  **`index-DEOc0YV7.css`** — the same hash the captures came from, so the committed tree renders
  exactly what the critics judged. The rendered half read **33/39 against the baseline's 35/39**, and
  because a baseline existed the diff was decidable in minutes: **exactly two driver statuses moved**,
  `gui-72` and `gui-124`, and **both are capture `TimeoutError`s in the screenshot path, not
  assertions, and both PASS STANDALONE at exit 0** on the same tree. `gui-94`'s message is byte-
  identical to baseline, independently proving the session-scoped radius never reached the command
  rows. **The wave caused zero failures**, and the positive evidence is stronger than the absence of
  negative: every pin written to catch these three builds passed in the batch — `gui-136`, `gui-138`,
  `gui-gauntlet-wave3`, `-wave4`, `-wave7`, `gui-93`, `gui-96`. **New evidence for #166:** two of the
  26 bare-`await` capture calls just cost their drivers' entire assertion sets in one run and reported
  a bare `FAIL`, the exact harm #156 fixed for `gui-91` — which passed here while two unfixed siblings
  did not. Commented on the ticket; a wave does not sweep the instrument.
- [wave 3] **METHOD: A PRE-WAVE GATE BASELINE REPLACES POST-HOC STASHING, AND THE BUILDER BRIEF WAS
  THE BUG.** The DOM phase was run **before any builder touched the tree**: 35/39 with all four
  non-PASS messages byte-identical to wave 2's, and all five governing pins green — a second
  independent route to wave 2's stash-based conclusion, at no stash. Separately, **the Welcome
  builder died twice**, both times spending its entire no-progress window reading instrument source
  (`gui-gauntlet-wave3.mjs`, a 60KB `inspect.mjs`) without making an edit; it landed only once the
  brief **inlined the source** and banned opening drivers. **A brief that recites driver facts invites
  a builder to go verify them.** Three further corrections to this file: `gui-gauntlet-wave4` is
  mislabelled (it pins the **Welcome headline**, not a rail gap); `DESIGN.md` was being cited by line
  number, which `DESIGN.md` itself forbids, now converted to section names; and the half-scale bar is
  the **authored** size, since the README records capture at 1680x1050 at `deviceScaleFactor: 2`.
  Also: **`inspect` prints `PASS`, writes all 11 files, and then hangs the shell** — a timeout on it
  is not a failed capture, and re-running is what destroys evidence. Adjudication 3.9.
- [wave 2] **FIRST WAVE WITH BUILDERS — 5/5 `BAR WINS` again, so `plateau: 0 -> 1`, while four of
  the five surfaces measurably improved.** Eleven agents, zero errors: five builders on provably
  disjoint file ownership (Welcome and Chat serialized on `chat.css` at the `── welcome ──` marker,
  run 1's precedent), five blind critics on `codex/gpt-5.6-sol`, one smoothing pass. Every builder
  closed its one named gap in **one declaration** except Chat, and every builder updated the authored
  comments its change falsified rather than leaving false evidence for the next reader. Capture `PASS`
  11/11. **Control: the three docks no builder touched are byte-identical between waves** (25019 /
  23442 / 39070) — which independently proves file ownership held, because the Sidebar builder edited
  `shared.css`, whose two-line clamp group is shared with `.agent-row-desc` and `.command-row-desc`.
- [wave 2] **THE HEADLINE FINDING IS A SEAM ONLY THE SMOOTHING PASS COULD SEE: two builders moved
  centring in opposite directions.** The composer footer went **235.5px -> 0.0px off-centre** (fixed)
  while the Welcome hero went **1.0px -> 65.0px** (broken), against an app that holds 0.0px in five
  other places. Root-caused to `grid-template-columns: max-content` resolving to `.welcome-hint`'s
  **`max-width: 480px`** instead of the ~415px it paints, leaving 65px of empty track on the right
  that `justify-items: start` then hugs away from. **Both builders were locally correct and neither
  could see it.** The payoff: wave 1's critic wanted the hero left-registered, wave 2's wants it
  centred, and sizing the track to painted width delivers **both** — so this is a synthesis, not an
  oscillation. Predicted left edge x512, which is wave 1's measured x512. Adjudication 2.1.
- [wave 2] **THREE OF THE FIVE RETURNED GAPS DID NOT SURVIVE MEASUREMENT, AND EACH WAS CHECKED
  RATHER THAN DISMISSED.** Sidebar's ("rows jump between two- and three-line heights") is **false** —
  every row carries exactly two title lines and pitch spread *tightened* from 1.76px to 1.41px, so
  the build it criticises made the rhythm better. Chat's is the **fifth raising across three runs** of
  a thread `DESIGN.md:56` warns about in the document itself, and its one new half ("user-bubble
  copy") was measured too: bubble stem runs **3.937px** vs prose **4.052px**, ratio 0.972, both
  inheriting 400. InputBar's is **refused on cross-surface evidence** — the 492px middle is real, but
  the change fixed a 235.5px centring error and made the strip share the transcript's 760px measure to
  the pixel. **All five verdicts stand regardless**: a critic grades the artifact, not its own gap.
- [wave 2] **OWNER CALL — the Titlebar promotion put a UI label on the prose rung.** `DESIGN.md:65`
  assigns "UI labels" to rung −1 (13px); `:66` defines rung 0 (15px) as "prose at 1.6 leading" and
  names four tenants. `.session-title` renders `basename(cwd)` (`Titlebar.tsx:305`) — a UI label, no
  1.6 leading, none of the four — and now paints at rung 0. `git status DESIGN.md` is empty. Measured
  consequence: ambient chrome now shares a rung with primary reading matter (15px at **6.71:1** vs
  **17.10:1**) and sits a rung *above* the rail's verbatim user prompts while carrying 2.41x less
  contrast. Before the wave, size and colour agreed; now they disagree and size lost. **Default taken:
  the promotion stands**, because the blind critic saw this state, was asked for a spec break, and
  returned `NONE`. The owner picks: grant rung 0 a chrome tenant in the role table, or send the title
  back to rung −1 and accept that the bar's critic will keep naming it. Adjudication 2.2.
- [wave 2] **THE RENDERED-HALF GATE WAS ALREADY RED, AND WAVE 1 NEVER LEARNED THAT BECAUSE IT NEVER
  RAN IT.** This wave added `npm run test:dom` to the gate — the half that measures the type ladder and
  hero intervals in real Chromium, i.e. exactly what this wave's changes touch. It returned
  `DOM PHASE FAIL`, 35/39. The wave was then **stashed and clean HEAD rebuilt** (reproducing wave 1's
  `index-DOI17h8g.css` exactly) and all four re-run: **all four fail byte-identically without the
  wave** — `gui-49` reads the developer's real 995-session store, `gui-95` is downstream of it,
  `gui-94` pre-existing, `gui-123` self-names **#155**. Every pin that governs this wave passes:
  `gui-138`, `gui-136`, `gui-gauntlet-wave3`, `gui-gauntlet-wave7`, `gui-gauntlet-wave4`. Restore was
  verified byte-identical against a backup of all seven files. Adjudication 2.6.
- [wave 2] **A D4 DEBT WAS DECLARED BY THE BUILDER THAT COULD NOT PAY IT, AND PAID BY THE LEG.** The
  Chat builder reported that no `gui-*.mjs` renders a prose->card->prose sequence, so nothing in the
  DOM phase covers its grouping, and **exported `avatarRun` specifically so the fast gate could drive
  it** — naming a test file it did not own. The leg added four cases there and **verified them by
  mutation**: making a tool card end the turn reds three of four; the mutation was reverted and the
  file confirmed byte-identical to backup. Suite 1408 -> **1412 passed, 96 files, 43 skipped**.
- [wave 2] **THE SMOOTHING PASS PROVED A BUILDER'S LOAD-BEARING CLAIM TO ZERO.** The Chat builder kept
  the continuation avatar as `visibility: hidden` rather than removing the element, arguing the 28px
  avatar box *is* the 40px gutter that tool cards indent to and that `max-width: 75%` resolves against
  the row. Verified by matching the continuation band against wave 1 at nine offsets: **mean absolute
  RGB difference 0.00 at dx0/dy0, 61–126 at every neighbour** — pixel-identical, gutter ink 650px over
  turn 1 in both waves, 0px over the continuation. It also caught and corrected its own first-pass
  sampling error. Identity floor **HOLDS** with mint *down* 3.6% (the hidden avatar is −629px of it);
  type scale **HOLDS as numbers**, max deviation 0.342px against a 0.35 tolerance. Two further
  findings for wave 3: the sidebar row is now the app's **flattest-cornered box** (r/h 0.108, past the
  tool card's 0.111) purely because it grew 17px while its bare-literal 8px radius did not follow; and
  **the same sentence now paints at two leadings** — a session title is the user's first prompt
  verbatim, set 15px/1.6 in a bubble and 13px/1.45 in the rail. **No new piece: the seam is an unowned
  invariant, not an unowned surface, so the missing artifact is a test.**
- [wave 2] **Nothing was reverted, on purpose, and nothing was pushed (D6).** The committed tree
  matches the captures the critics judged, because this run's controls are SHA comparisons between
  waves and a tree that disagreed with its own capture set would poison wave 3's attribution. Where a
  build is now known wrong (Welcome), the correction is wave 3's named gap. Wave 3 opens with **three
  builders, not five** — Chat and InputBar have no surviving gap — so it costs 9 agents.
- [wave 1] **BASELINE WAVE — five verdicts, zero builders, and the wave's real result is an
  instrument finding.** All five pieces `BAR WINS`, zero `SPEC BREAK`s, `plateau` stays 0
  (a baseline cannot count). Captures `PASS`, `CAPTURED 11/11`, frame 1440x900 @ zoom 1,
  sidebar 248x852, chat text 923. **Null control: all eleven files SHA256-identical to the
  seed baseline** — correct for a wave that edited nothing, and the third independent
  determinism check on this instrument.
- [wave 1] **THE THREE-IMAGE PAYLOAD HAS BEEN AT THE CONTEXT CEILING ALL ALONG, AND THIS
  WAVE FOUND THE EDGE BY FALLING OFF IT.** The Sidebar critic died with
  `"Prompt is too long"` / `invalid_request`. Not a Sidebar-specific weight problem: **all
  five bar references are the same 3360x2100**, ~9.4k image-tokens, so every critic carried
  ~11k image-tokens of payload before reasoning. Run 1 wave 2 hit this wall at five images
  and answered it by *trimming the casualty*, which produced its only false `YOURS WINS`.
  This wave instead downscaled every reference to **1680x1050** and **re-ran all five**, so
  the payload stayed identical across pieces. **The four pieces judged at both resolutions
  returned the same verdict at both** — the downscale did not bias the instrument, so
  Sidebar's recovered verdict is comparable. `.gauntlet/bar/` verified byte-identical
  before and after (sha256 on all seven files, plus clean `git status`). Downscaler uses
  Electron's `nativeImage`, already a dependency — no image library added.
- [wave 1] **The critics' literals were checked against the leg's OWN read of the pixels,
  and there were ZERO factual errors across all nine returning critics.** The leg read five
  surfaces itself before opening any verdict. Unguessable literals returned correctly: the
  `Wisped` / `Bypass` pills, the centred `inspect-ws` title, `12 sessions outside this
  project`, all five row truncations with their ellipses, the ages `1h/3h/7h/2d/5d`, the
  truncated temp path, `"Default"` exactly twice, both tool-card paths, all four disclosure
  labels, the `4/3/1` prose line counts, the `~44px` mark (matching `inspect`'s
  `welcome-mark h:44`) and "six icon-only controls" on the right of the titlebar. One
  unconfirmed, non-load-bearing claim: a thin scrollbar at the chat's right edge.
- [wave 1] **One gap REFUTED against source and replaced rather than dropped.** Chat's
  returned gap asked for prose at "regular weight with the specified 1.6 leading" —
  `chat.css:216-217` already ships exactly `font-weight: 400; line-height: 1.6`, `DESIGN.md:54`
  grants 400 to body, and `DESIGN.md:56` warns in the document itself against re-raising it
  ("three review waves did"). Fourth raising across three runs. The **verdict stands** — a
  critic grades the artifact, not its own gap — and the wave-2 builder gets the independent
  native-resolution critic's grouping gap on identical pixels instead. Adjudication 2.
- [wave 1] **A second gap bounded by measurement rather than opinion.** Welcome's gap wanted a
  760px two-column hero with a 96px mark; this wave's own capture output refutes both numbers
  — the app supports a **640px** minimum window (`MINIMUM`/`MIN-PANE`) and the welcome pane
  has **69.71px** of headroom (`432 − 32 − 81.6 − 248.69`, exact). 760px overflows by 120px;
  96px spends 52 of the 69.71. The left-align half is buildable and is what wave 2 gets.
- [wave 1] **A capture-path collision was caught and repaired.** `inspect` was first pointed
  at `.gauntlet/waves/1/`, which is **run 1's** wave-1 directory — run 1 never namespaced.
  Caught via `git status` showing seven tracked PNGs modified; restored from `db9dd19`, and
  run 3's captures moved to `.gauntlet/waves/core-after-docks/1/`. Run 1's evidence is intact.
- [wave 1] **Constraint hygiene, re-verified rather than inherited.** Critic family
  re-resolved live (`wisp routing` → `sonnet` -> `codex/gpt-5.6-sol`, not carried forward).
  Constraint 4's line references had drifted with DESIGN.md's growth and were corrected
  (59→80, 61→82); the three-toggle count re-confirmed in `Titlebar.tsx`; **exactly one
  `backdrop-filter`** in `styles/` confirmed at `subagent.css:122`. Discovered for wave 2:
  `"Pick a project folder"` is pinned by **40** GUI drivers, `"Start a session"` by none.
- [wave 1] **THE SMOOTHING PASS EARNED THE WAVE, AND IT DID IT ON NUMBERS.** `SEAMS VISIBLE`.
  Identity floor **HOLDS** on every count, with the chrome rails' alpha derived
  arithmetically exactly from `--surface` over `--wash` (`0.58 + 0.64 × 0.42 = 0.8488 → 216`),
  mint one hue at six sites with a 3.835% worst case against the 10% ceiling, and one
  `backdrop-filter`. **One type scale holds** — 11/13/15/17.25/46, all rungs of `15 × 1.15^n`,
  all 67 `font-size` declarations token-or-arithmetic, with exactly one literal
  (`subagent.css:168` `20px`, off-rung by 0.16px, on an uncaptured surface so not a wave-1
  finding). Its biggest contribution is **converting run 1's four-wave titlebar-glyph argument
  into a measurement**: the Commands `/` carries **27 ink px against its siblings' 79 and 82**
  because `Titlebar.tsx:210` spans 4.6 of a 16px grid where they span ~9.9 — while spacing is
  exact to 0.5px. It also proved **Welcome's high placement is authored** (predicted 66.85px
  and 242px, measured 67 and 242), and returned **seven NOT-FINDINGS** so wave 2 cannot
  refile them — including that the **date divider exists** (`Chat.tsx:363-366`) and is absent
  from the capture only because the transcript is scrolled to the latest turn, which is an
  instrument gap on one of the bar's own named Chat criteria.
- [wave 1] **THIS LEG CREATED A RACE AND THE SMOOTHING PASS CAUGHT IT.** The leg restored
  run 1's captures into `.gauntlet/waves/1/` at 18:43:11 while the pass-1 smoothing agent was
  **still reading that directory** — it had waited for both critic passes and forgot the
  smoothing agent was live. Cost: five measurements taken on stale files and withdrawn. The
  agent detected the change, re-based onto `.gauntlet/waves/core-after-docks/1/`, and verified
  SHA-identity to the seed control before continuing. **Its recommendation to treat the
  verdicts as unscored is refused on evidence:** the Sidebar critic reported `248x852` and the
  InputBar critic `1192x132` — run 3's dimensions, impossible for run 1's `254x852` and
  `1186x113` — and both InputBar critics saw the `Model` label that smoothing measured as
  absent from the stale file. **PART A literals, made first and unrevisable, are what settled
  it.** Lesson for every future leg: **never move a capture directory while any agent of the
  wave is still running.**
- [wave 1] **Sixth piece PROPOSED (`ToolCard`) and PARKED as an owner call.** The case is
  measured and good, but adopting it requires rewriting `.gauntlet/bar/README.md`'s line
  placing ToolCard *"out of reach of any wave"* — a **scoping rule**, not a description. A
  loop body must not edit the boundary of its own scope, and the bar is human-owned. Default
  taken: slot stays empty, and findings 1–2's radius seam is handled as cross-surface
  smoothing work in wave 2, which needs no new piece and no bar edit. Adjudication 10.
- [wave 1] **One accessibility number reported and deliberately NOT ruled on**, then filed
  outside the run: `--text-faint` `RGB(101,109,111)` on the content ground is **3.85:1**,
  below WCAG AA's 4.5:1 at the 11px it is used at, and compositing over any real acrylic
  backdrop only lowers it (3.63:1 over `RGB(32,32,32)`, 2.88:1 over `RGB(96,96,96)`). The
  smoothing pass correctly refused to convert it into a verdict — that would be a
  colour/material ruling in legibility clothing, and constraint 1 closes colour to it.
  Accessibility is not something to drop for being out of scope, so it was filed as
  **#167** at `needs-triage` (never `ready-for-agent` — that would refill the queue a chain
  stops on). The leg verified the claim before filing rather than relaying it: `--text-faint`
  is a text `color:` in **35** declarations across eight stylesheets, so it is not one stray
  label; only four usages are structural, where the 3:1 non-text threshold applies and it
  passes. Two things make it a human call — the true composited ground is unknowable, and
  `theme.test.ts` forbids exactly the lightness change that would fix it.
- [wave 1] **D7 gate GREEN on all three.** `npm run typecheck` clean; `npm test` **96 files,
  1408 passed, 43 skipped**; `npm run build` clean at bundle **`index-DOI17h8g.css`** — the
  same hash as the seed, which independently confirms no `src/` was touched this wave.
- [seed] Run 3 seeded on `main` at `56917df`, branch `gauntlet/core-after-docks`.
  Five pieces, sixth slot reserved for the smoothing pass. `inspect` run at seed:
  `PASS`, 11/11. Cross-run instrument determinism controlled: fresh `main` capture
  SHA256-identical to run 2 wave 12 on all eleven files, so the five core-surface
  deltas against run 1 wave 5 are real change. Critic resolved live to
  `sonnet -> codex/gpt-5.6-sol`. `AgentsDock`/`DocksAsOne` excluded — owner call 19
  cost run 2 six pixel-identical waves. No wave run this firing.
