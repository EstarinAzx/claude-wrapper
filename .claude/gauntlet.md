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
    verdict: YOURS WINS        # PROVISIONAL — see "Wave 2 adjudications"; deliberately still open
    open: true
  - name: Chat
    verdict: BAR WINS
    open: true
  - name: InputBar
    verdict: BAR WINS
    open: true
critic: sonnet                 # re-resolved live at wave 2 -> codex/gpt-5.6-sol; RE-RESOLVE every wave
critic_degraded: false
branch: gauntlet/core-surfaces
wave: 2
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
| 2 | Welcome | BAR WINS | The compact hero still sits too close to the mathematical centre of the 1440x900 field; lift the entire stack roughly 60px into the upper-middle so the large lower reserve reads as deliberate composition rather than leftover space. |
| 2 | Titlebar | BAR WINS | Replace the slash, branch and split-disc set with three optically matched 16px **outline** glyphs using one stroke weight, one bounding box and one visual centre, so the app-action cluster reads as a deliberate icon family rather than assorted symbols. |
| 2 | Sidebar | **YOURS WINS** (provisional) | The background-empty explanation still relies on an unlabelled circular-arrow for its action: add a visible inline "Refresh" action beside the copy to remove the remaining icon inference. |
| 2 | Chat | BAR WINS | *(as returned)* "The assistant prose is consistently too heavy for sustained reading; render ordinary transcript text at the specified regular 400 weight and reserve 600 for labels or real emphasis." **REFUTED AGAINST SOURCE — see adjudication 1. Do not hand this to a wave-3 builder as written.** |
| 2 | InputBar | BAR WINS | Recompose the right-hand settings strip as two visually matching compact controls with equal label/value structure, because the bare Effort "Default" and the outlined Model "Default" make the area beneath the otherwise resolved pill look improvised. |

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
</content>
</invoke>
