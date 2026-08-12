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
    verdict: BAR WINS
    open: true
  - name: Sidebar
    verdict: BAR WINS
    open: true
  - name: Chat
    verdict: BAR WINS
    open: true
  # Its seed delta is the SMALLEST of the five and may be pure 6px reflow. That
  # is a caveat on the delta, NOT a reason to discount its verdict — the critic
  # grades the artifact, never the diff. See "Why these five" note 3.
  - name: InputBar
    verdict: BAR WINS
    open: true
critic: sonnet                 # THE RULE, NOT THE VALUE. Re-resolve with live
                               # `wisp routing` every wave and take the first
                               # non-Anthropic family. Re-resolved at wave 1 to
                               # `codex/gpt-5.6-sol` — third run at that landing,
                               # which is luck. Routes have moved in under a day.
critic_degraded: false         # wave 1: one critic died on context length and was
                               # recovered on a uniformly changed instrument, NOT a
                               # trimmed one. Scrutiny never weakened. Adjudication 1.
branch: gauntlet/core-after-docks
wave: 1
plateau: 0                     # consecutive waves in which no verdict improved.
                               # Wave 1 is a BASELINE and cannot count: there was no
                               # prior in-run verdict to improve on. Wave 2 is the
                               # first wave whose verdicts can move this number.
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
   own favour — do not re-report it.** ⚠️ **Line numbers moved: the sentence is now line
   80, not 59, and its self-contradiction is line 82, not 61** (DESIGN.md grew during
   run 2). Line 80 still says *"Right: the Agents-dock toggle, then a hairline separator,
   then min / max / close"*, true when Agents was the only dock; **three** toggles ship
   today (`Titlebar.tsx` `CommandsToggle`, `AppearanceToggle`, `AgentsToggle` — re-verified
   wave 1) and line 82 already calls Appearance the *"third right-slot panel"*. The
   **count** is agreed and is **not** a break; how well the group is **composed** is fair
   game. Run 1 wave 1 got a `SPEC BREAK` here and refused it against source.
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

## Log

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
