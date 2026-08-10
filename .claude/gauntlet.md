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
    verdict: BAR WINS
    open: true
  - name: Chat
    verdict: BAR WINS
    open: true
  - name: InputBar
    verdict: BAR WINS
    open: true
critic: sonnet                 # resolved live at seed -> codex/gpt-5.6-sol; RE-RESOLVE every wave
critic_degraded: false
branch: gauntlet/core-surfaces
wave: 1
plateau: 0
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
</content>
</invoke>
