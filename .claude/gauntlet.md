---
slug: docks-and-min-window
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
  - name: AgentsDock
    verdict: BAR WINS
    open: true
  - name: CommandsDock
    verdict: BAR WINS
    open: true
  - name: AppearanceDock
    verdict: BAR WINS
    open: true
  - name: WelcomeMinWindow
    verdict: BAR WINS
    open: true
  # Added by wave 2's smoothing pass, on its one-new-piece budget. Five of six
  # slots used. CRITIC ONLY on wave 3 — no critic has named a gap for it, and a
  # builder handed no gap would be redesigning, which is wave 1's rule. Its
  # wave-3 verdict is its BASELINE and cannot count toward plateau, for the same
  # reason wave 1's could not.
  - name: DocksAsOne
    verdict: BAR WINS
    open: true
critic: sonnet                 # FAMILY name only — re-resolve live every wave, never carry the target
critic_degraded: false
branch: gauntlet/docks-and-min-window
wave: 2
plateau: 1
max_waves: 12
page: false
stop: false
---

## Where things are

- **This file is the run's memory.** `.claude/relay/gauntlet.md` is only the relay
  machinery; it points here.
- **The tree stays on `gauntlet/docks-and-min-window`.** The seed commit is on
  `main` as well, so a leg that somehow boots on `main` still finds this file and
  does not re-seed — but `main`'s copy goes stale the moment wave 1 commits.
  **The live copy is the one on the branch.** If you are on `main` and `wave:`
  reads 0 while `git log gauntlet/docks-and-min-window` shows waves, you are
  reading the stale copy.
- **Run 1's record is `.claude/gauntlet-core-surfaces.md`** — slug `core-surfaces`,
  five waves, `plateau: 3`, closed. Read it before arguing anything it settled.

## Why these four pieces

The bar publishes **nine** surfaces. A run may hold at most six, so a seed picks a
subset and states why.

Run 1 judged five — Welcome, Titlebar, Sidebar, Chat, InputBar — and every one of
them closed at `BAR WINS` after three plateau waves. Re-opening them would spend
the budget re-confirming a verdict that already stopped moving.

The four here are the ones run 1 **could not see**. They are not a leftover: they
entered the instrument after run 1 seeded — the three docks in **#133**,
`welcome-min-window` in **#137** — so no critic has ever ruled on them. That makes
them the only surfaces on the published list where a verdict is still information.

| Piece | Capture | Bar reference that judges it (the bar's own mapping) |
|---|---|---|
| AgentsDock | `agents-dock.png` | `linear/linear-features.png` — control grouping, iconography |
| CommandsDock | `commands-dock.png` | `linear/linear-features.png` — control grouping, iconography |
| AppearanceDock | `appearance-dock.png` | `linear/linear-features.png` — control grouping, iconography |
| WelcomeMinWindow | `welcome-min-window.png` | `linear/linear-method.png` — authored empty space, editorial type |

`identity/frost-mono-reference.png` judges all four, as it judges everything.

**The three docks share one shell and differ only in content.** All three are a
248x852 right-hand column and all three wear the class `agents-dock`. Judging
them as three pieces is deliberate — their content problems are unrelated (an
agent tree with three empty states and a background-tasks footer; a slash-command
list; a panel of controls) — but it carries one real risk: **three critics
returning the same verdict about the shell rather than about the content.** That
is the smoothing pass's job to catch, and it is the thing to check first if wave 1
comes back with three identical gaps.

## Seed verification — what was checked rather than assumed

- `inspect:` was **run at seed**, not trusted from the record. `PASS`,
  **11/11 files written**, `FRAME {"width":1440,"height":900,"zoom":1}`, at
  `5e20472`. All four pieces captured non-empty: `agents-dock` 262 chars of text,
  `commands-dock` 377, `appearance-dock` 206, `welcome-min-window` a 640x432 pane
  with `HEADROOM {"measured":65.31,...,"overflow":0}`.
- `critic:` was resolved from live `wisp routing` at seed — first non-Anthropic
  family is **`sonnet` -> `codex/gpt-5.6-sol`**. **That target is recorded as
  evidence the family resolves, NOT as a value to reuse.** Run 1 caught these
  routes moving in under a day (`opencode-go/kimi-k3` -> `codex/gpt-5.6-sol`).
  **Re-resolve every wave.**
- The bar's `.gauntlet/bar/` contents were confirmed present: `identity/` (2 files)
  and `linear/` (5 files + `manifest.json`).
- Run 1's branch `gauntlet/core-surfaces` was confirmed **fully merged** —
  `git log main..gauntlet/core-surfaces` is empty, `main` is 41 ahead of it. This
  run seeds off `main` with none of run 1's five waves lost.

## What a critic must NOT rule on — read this into every critic prompt

These are the bar's own limits, restated here because a wave prompt is built from
this file. Every one of them has already cost this repo a false finding.

1. **No colour, translucency or material verdicts.** The app's wash is
   `oklch(0.12 0.008 210 / 0.64)`, composited by Windows over the OS acrylic
   backdrop. No driver can see a DWM backdrop, so the flat ground in every capture
   is an **instrument artifact, not a defect**. Judge composition, layout, type,
   hierarchy, spacing and state. `.gauntlet/bar/README.md` counts this as the ninth
   waiting instance of read-an-artifact-as-a-finding.
2. **The identity mark is a solid mint rounded square with no glyph, by design.**
   Not a missing asset — `background: var(--mint)`, `aria-hidden="true"`, and
   `DESIGN.md` spends the accent on the mark **as** an accent. A fidelity question
   about the fill's depth is fair; "the glyph is missing" is answered.
3. **Critic pixel figures and CSS figures are different quantities.** Run 1 wave 5
   established it: a critic reads **ink and leading**, the stylesheet states
   **boxes**, and they differ by 5-6px. A critic's measurement disagreeing with a
   CSS value by that much is not a defect on its own.
4. **A missing capture is a failed run, not an absent surface.** `inspect.mjs`
   proves every surface present, painted and non-empty before photographing it. If
   an expected file is not in `SCREENSHOT_DIR`, read the run's output rather than
   judging the surface.

## Capture notes that change what a wave sees

- **The docks are captured LAST, after the window frames, and that order is
  load-bearing.** A dock is an in-flow aside, so an open one takes width out of
  `main.chat` and moves the boxes of surfaces it has nothing to do with.
- **All three docks wear the class `agents-dock`** and are selected by
  `aside[aria-label="…"]`. A class selector matches whichever dock is open and
  files it under the wrong name.
- **Every capture is byte-stable as of #142**, and the sessions rail is a fixture
  as of #148. A capture that moves between waves moved because the app moved.
- Run `inspect.mjs` **one at a time** — the fixture workspace has a fixed name and
  no lock, so two concurrent runs fight over it.

## Verdicts
| wave | piece | verdict | biggest gap |
|---|---|---|---|
| 1 | AgentsDock | BAR WINS | Let each agent purpose line wrap to two lines at the 248px dock width — the one-line ellipses reduce the panel's primary content to unreadable fragments. |
| 1 | CommandsDock | BAR WINS | Rebuild the command list as a consistently sized row system so it reads as one deliberate control group rather than a loose text stack with a collapsed `/wrap-up` entry. |
| 1 | AppearanceDock | BAR WINS | Give the Backdrop option cards more internal breathing room between each title and its wrapped explanation, so the choice stops reading as cramped in the narrow dock. |
| 1 | WelcomeMinWindow | BAR WINS | Rewrite the supporting line to say what opening a project *enables*, rather than echoing the button's own "Pick a project folder" wording. |
| 2 | AgentsDock | BAR WINS | Rebuild the three header actions as one coherent icon-button group with matched hit areas and containers, replacing the cryptic branching mark with an immediately legible agent-hierarchy symbol. |
| 2 | CommandsDock | BAR WINS | Group the commands by purpose and give each full-row target a restrained leading icon, so the dock has a scan architecture instead of a uniformly formatted text stack. |
| 2 | AppearanceDock | BAR WINS | Give Theme and Backdrop one consistent, restrained selection icon or end-affordance so their stacked options read as a designed control family rather than labelled boxes. |
| 2 | WelcomeMinWindow | BAR WINS | Turn the supporting sentence into a deliberately measured two-line deck and rebalance its adjoining vertical gaps, so headline, explanation and action read as one editorial lockup rather than three centred objects. |

## Wave 2 adjudications — every gap closed, every verdict held, and the scale failure run 1 predicted has fired

**The first wave that built.** Four builders, one pin agent, four critics, one smoothing pass.
All four gaps closed and confirmed in the captures. **Zero `SPEC BREAK`s. 4/4 critics
verified to have seen real pixels.** Gate green **twice** (D7), once after the builders
and again after the smoothing pass.

### 1. `plateau` is 1, and it is the failure mode run 1 wrote down in advance

| piece | wave 1 | wave 2 | critic's own change answer |
|---|---|---|---|
| AgentsDock | BAR WINS | BAR WINS | BETTER |
| CommandsDock | BAR WINS | BAR WINS | BETTER |
| AppearanceDock | BAR WINS | BAR WINS | BETTER |
| WelcomeMinWindow | BAR WINS | BAR WINS | BETTER |

**4/4 say better. 0/4 verdicts moved. So `plateau` goes 0 -> 1.**

Run 1's wave 2 recorded this exact shape and ruled on it in advance: *"a run that keeps
genuinely improving can still trip the counter and halt. If a later wave shows `plateau`
rising while critics keep reporting BETTER, that is the scale failing to resolve real
progress, not a real plateau, and it is an owner call — not something a leg should quietly
rule on by changing the counter."*

**It has now fired, in run 2, on the first wave that could produce it.** The counter is
incremented honestly rather than adjusted. See `## Owner calls raised by wave 2`.

### 2. The cross-piece lever worked, and that is the wave's real result

Wave 1's adjudication 3 named one shared pattern implemented three ways and called fixing
it once *"wave 2's highest-leverage move"*. It landed:

- The AgentsDock builder pulled `.agent-row-desc` out of `shared.css`'s one-line truncation
  triad and wrote a **named two-line clamp group** beside it, commented to say a secondary
  line JOINS THIS LIST rather than writing its own `-webkit-box` elsewhere.
- The CommandsDock builder, running next on the freed file, **joined it** — the selector is
  now `.agent-row-desc, .command-row-desc` — and corrected the group's own comment from
  *"the agent row hands"* to *"both rows hand"*. It invented no third treatment.

**Serializing those two builders was necessary and is now proven, not predicted.** Both
edited `shared.css` and `rails.css`; in parallel they would have been two agents in one file.

### 3. The smoothing pass earned its slot by catching what four critics structurally could not

It found **three different leadings for one question** and fixed it in the shared group:
`.agent-row-desc` had taken the clamp but left the leading behind, so it inherited `body`'s
1.6 while `.command-row-desc` and `.appearance-choice-desc` both sat at 1.45. **Measured, not
inferred: the same 11px sentence in the same 248px column rendered at 17.6px in one dock and
15.95px in another.** Re-verified first-hand after the fix — the driver's A1 check now reports
`lineHeightPx 15.95` on `.agent-row-desc`, and the byte comparison isolates the blast radius
to `agents-dock.png` alone (24464 -> 24456 bytes, every other surface identical).

**Why no critic could have found it:** each saw one dock, and each dock was internally fine.
The defect existed only in the disagreement between them.

**It declined NINE findings with reasons**, which is the harder half. The strongest decline
worth carrying: the 2px name-to-description gap in both dock rows now fails the very test the
Appearance dock's B2 driver check enforces (the space above a sentence must out-rank the
leading inside it), but the 2px lives in a three-selector group that also paints the **sessions
rail** — a fifth surface nobody asked about — and a dock-local override would add 6px to every
row in a 126-row scrolling list. Real finding, wrong pass. It is folded into the new piece.

### 4. The seed's named risk FIRED this wave — it did not in wave 1

The seed warned that three critics might rule *"about the shell rather than about the
content"*. Wave 1 checked and cleared it: three different gaps. **Wave 2's three dock gaps all
converge on one systemic absence — the app has no icon vocabulary.** Header glyph group,
leading row icons, selection affordance: three different elements, one missing system.

Read it precisely rather than over-claimed: these are **not** the same defect, so the
decomposition is not invalidated. What it means is that the description-row problem is closed
well enough that three independent critics moved on together, to a question **no single piece
owns.** Which is the argument for the piece below.

### 5. New piece accepted — `DocksAsOne`, on the smoothing pass's one-per-wave budget

Five of six slots now used. Its scope fence, from the pass that proposed it and binding on its
critic: **it may rule only on whether the three docks AGREE, never on whether any one dock's
answer is good** — that question already belongs to that dock's own piece.

**It gets a CRITIC and NO BUILDER on wave 3.** No critic has named a gap for it, and wave 1's
rule is that a builder handed no gap is redesigning. **Its wave-3 verdict is a baseline and
cannot count toward `plateau`**, exactly as wave 1's could not.

It inherits two live candidates, both declined above with reasons: the 2px-vs-8px
name-to-description gap, and `.appearance-choice-desc` being `--text-faint` where both dock
descriptions are `--text-muted`.

### 6. `gui-94` is RED, and "stale rather than violated" was wrong

The CommandsDock builder wrote in `rails.css` that the `#94` driver's expectation is *"now
stale rather than violated"*. **Settled by exit code rather than by argument: it is violated.**
`gui-94.mjs` exits 1 on exactly two checks —

```
AC3 .command-row-desc line box moved: 12px before → 31.9px after (19.9px)
AC4 row height moved: 60px before → 65.1px after (tolerance 0.8px)
```

**The half that guards still passes.** AC1, AC2 and surface 2 are green: the composer's slash
popover is untouched (125 options, 27.2px), so the builders kept `#94`'s actual promise not to
reach into the two shared children. What broke is `#94`'s **no-change** criterion, whose own
header calls the 12px box *"a separate, taste question"* the ticket *"leaves open"* — and this
wave reopened exactly that question deliberately.

**Reverting `line-height` alone does not clear it.** AC3 measures element *height*, and the
clamp makes the description two lines; at 1.1 that is still ~24.2px against a 12px probe.
Clearing `gui-94` means reverting the **clamp**, i.e. abandoning the CommandsDock piece and the
cross-piece win in §2. That is what makes this an owner call rather than a cheap fix.

Rebuilding the probe from current declarations was considered and refused: `gui-94`'s whole
design is that the probe reconstructs the PRE-`#94` geometry so the check cannot be dragged
along by the fix, and its header names the trap directly — *"'X is unchanged' is vacuous in a
build where nothing could change X."* Softening it is forbidden by binding constraint 5.

### 7. D4 was discharged by two instruments, and the second one was not planned

`gui-gauntlet-wave2.mjs` is new: **15 checks across the three docks, every one carrying its
reconstructed OLD value beside the new.** Its author red-verified it properly — `git stash`,
rebuild, re-run (**exit 1, 7 of 7 change-checks failed with the old values**), then restore and
re-run green, with the working diff's fingerprint byte-identical both ways
(`152f6340e3c8478a37fb6ad1657340893563a031`). Re-run first-hand twice by this leg, exit 0 both
times.

It **honestly declined** to pin WelcomeMinWindow: that claim needs the window at its enforced
minimum, and resizing mid-run would revoke what the rest of the driver measures. **`inspect.mjs`
pins it instead** — `HEADROOM {"measured":65.31,"claimed":65,"drift":0.31,"overflow":0}`,
identical to wave 1, with `.welcome-hint` at **27.59px = exactly one line** (17.25 x 1.6). The
Welcome builder's no-measure argument is therefore **measured, not argued**.

### 8. Blast radius measured, not asserted

Byte-comparing all eleven captures against wave 1: **exactly six moved, five are byte-identical.**

- Moved: the three docks, `welcome-min-window`, plus `welcome.png` and `window-welcome.png` —
  the same hint copy renders on the standard-size Welcome pane too.
- Identical: `chat`, `input-bar`, `sidebar`, `titlebar`, `window-session`.

**Zero unintended blast radius**, corroborating the driver's A4 and B3 guards from a completely
independent direction. This check only means anything because #142 made every capture
byte-stable.

### 9. A critic CRASHED and was re-run, not recorded as a no-verdict

The WelcomeMinWindow critic died with `Prompt is too long` and returned nothing. **An
unverified piece is not a refuted one.** It was re-run with the context pressure removed rather
than the bar softened: the spec was inlined verbatim instead of pointed at, and the retry was
forbidden from reading any file but its four images. It returned on the first attempt.

`critic_degraded` stays **false** — the model and the bar were never weakened, only the
prompt's exploration budget. **Hand the slim prompt shape to any future critic on this piece.**

### 10. The instrument found a product defect no wave may fix — filed as #161

`CommandsDock` fetches once on mount with no retry, so a dock opened before the CLI finishes
handshaking gets `[]` and **keeps showing "No commands available yet." for as long as it stays
open.** Reproduced twice independently: the dock reported **0 rows while a direct
`window.api.listCommands()` from the same page returned 126**. The driver works around it by
remounting; the app does not.

Filed at **`needs-triage`, deliberately not `ready-for-agent`** — promoting it is an owner
decision, not a leg's.

### 11. Verification that was run rather than trusted

- **D3/D4 sweep, eight checks, mechanical**, run against the tree twice (after the builders and
  after the smoothing pass) rather than taken from six agents' self-reports — including #129's
  `var(--x)` resolution scan over all of `styles/`: **zero undefined**. The sweep was itself
  validated on the committed baseline first, where it **found a bug in its own offset parser**
  (unitless `0` offsets read as stripes), then mutation-probed: 6 of 6 injected defects red.
- **Every load-bearing claim in a new comment was checked at its source**, not accepted:
  `title={a.description}` really is at `AgentsDock.tsx:357`; `.bg-sessions-empty-hint` really is
  `line-height: 1.45` at `rails.css:354`; `box-sizing: border-box` really is global at
  `base.css:10`; the new Welcome string really is 56 characters.
- **`-webkit-box-orient` survives minification** in the shipped bundle — a real risk, since a
  minifier dropping it would silently kill the clamp and jsdom would never see it. Confirmed by
  grepping the built CSS, and measured live by the driver.
- **The +1 skip was attributed**, not waved through: 36 -> 37 is exactly
  `gui-gauntlet-wave2.mjs — browser-level: executes in npm run test:dom (#135)`. Test count
  unchanged at 1406.
- **The CSS bundle hash moved both times** (`index-B83pCap1` -> `index-DkrgN1a3` after the
  builders, -> `index-zgbU0lqM` after the smoothing pass). Wave 1's *unchanged* hash proved
  nothing moved; wave 2's changed hash is the same witness working in the other direction.

## Owner calls raised by wave 2 — none of these are a wave's to settle

**12. `gui-94` is red and the cheap fix does not exist.** Default taken, reversible: **keep the
work, leave the driver red, record it here.** The three options are (a) revert the two-line
clamp, losing the CommandsDock piece and the cross-piece win in §2; (b) rebuild `gui-94`'s
probe, which is softening a check to clear a red and is forbidden by binding constraint 5; (c)
retire `gui-94`'s AC3/AC4 as a no-change criterion that has been deliberately superseded, while
keeping AC1, AC2 and its popover surface, which all still pass and are the half that guards.
**(c) is the honest one and it needs a human.** Until then `npm run test:dom` carries a new
attributed red, and `.context/`'s DOM-phase table needs this row.

**13. The verdict scale has stopped resolving real progress.** 4/4 critics answered BETTER and
0/4 verdicts moved, so `plateau` rose on a wave in which every named gap was closed and
confirmed in pixels. Two more waves of the same and the run halts at `plateau: 3` while still
improving. **The counter was NOT adjusted** — run 1 named that as the owner's call. The
options, none taken: widen the ordinal; count the critics' own change answer instead of the
verdict; or accept that halting-while-improving is what a deliberately unreachable bar is
supposed to do.

## Wave 1 adjudications — the baseline held, and the three docks share one real problem

**Wave 1 judged and did not build.** A builder is only ever handed *the one gap named
for its piece last wave*, and on wave 1 there is no last wave — so a wave-1 builder
would be redesigning, which step 4 forbids in the same sentence. Run 1 reached the
same shape (its log: *"Baseline measurement wave — five critics, NO builders, and
that is [right]"*). Four critics, zero builders, zero errors.

### 1. All four critics were verified to have seen pixels — 0 fabrications

Their `observations` were checked line by line against a **first-hand read of the same
four files**, not accepted. Every one held, including detail no model could guess:
the exact truncated fragments *"Survey every fs.\* call across the GUI drivers…"* and
*"Locate the three stylesheet pins that sc…"*; the metadata lines
*"claude-opus-5 · depth 0"* / *"claude-sonnet-5 · depth 1"*; all **seven** command
labels in order; and Acrylic's full sentence *"Blurs what's behind the window; Windows
flattens it when the window loses focus."*

That is a **better rate than run 1**, which carried one factual error per wave through
waves 1 and 2. Do not read this as licence to trust the next wave's critics — it is a
record of a check that was run, and the check is what transfers.

**No critic ruled out of scope.** Zero colour/material verdicts, zero "the glyph is
missing", zero rulings on states the capture does not contain. Run 1's wave 1 raised
three `SPEC BREAK`s and lost two of them; this wave raised **none**. The out-of-scope
block in the wave prompt is doing real work — keep handing it over verbatim.

### 2. The seed's named risk did NOT fire — but check it the same way next wave

The seed warned the three docks *"share one shell"* and that three critics might rule
on the shell rather than the content, *"the thing to check first if wave 1 comes back
with three identical gaps."* The three **verdicts** are identical (`BAR WINS`); the
three **gaps** name three different elements. The trigger did not fire and the
decomposition is validated — judging the docks as three pieces was right.

### 3. The finding that matters: one shared pattern, implemented three ways

All three dock gaps are the same structural question wearing three costumes —
**how a "name + secondary description" row behaves in a 248px column:**

| dock | what it does with the description | critic's complaint |
|---|---|---|
| Agents | truncates to ONE line with an ellipsis | fragments are unreadable; let it wrap to two |
| Commands | truncates — and **omits it entirely** for `/wrap-up` | reads as a loose text stack, not a row system |
| Appearance | wraps to two lines | cramped between title and its wrapped text |

Three independent critics, each blind to the other two, each landed on this pattern as
the weakest thing in its dock. **That makes it wave 2's highest-leverage move: fix the
pattern once in the shared shell rather than three times in three places.** This is the
insight a smoothing pass exists to produce, and it came out of the critics' own output
rather than a fifth agent.

**It is not a licence to redesign.** Each wave-2 builder still closes only its own
named gap; the point is that the three fixes should agree with each other instead of
inventing three treatments.

### 4. Wave 2's fan-out shape is already decided, and it is run 1's exact trap

**`CommandsDock` has NO stylesheet of its own** — `grep` finds **zero** `.commands-dock`
rules anywhere in `styles/`. It rides the shared `agents-dock` shell in `rails.css`,
which `AgentsDock` also owns. Two parallel builders would be two agents in one file.
This is precisely the Welcome/Chat collision run 1 hit at wave 2 (`.welcome*` lives in
`chat.css`), and it gets the same answer:

- **Serialize `AgentsDock` → `CommandsDock`** inside the fan-out, on `rails.css`.
- `AppearanceDock` owns `appearance.css` — but that file also carries **2**
  `.agents-dock` references, so confirm it is not reaching into the shell before
  letting it run free.
- `WelcomeMinWindow` writes `chat.css` (`.welcome*` ×4) and `markdown.css` (×1),
  clear of all three docks.

### 5. A blind spot no wave has ruled on, and no wave can

`bar_win` grades empty states outright — *"every empty state is authored copy plus a
real action rather than a placeholder mark."* **AgentsDock's empty states were not
judged, because the instrument does not photograph them.**

Verified in source rather than inferred: the dock has **three** `agents-dock-empty`
branches (`AgentsDock.tsx:307`, `:311`, `:315`) and a `background-tasks` footer
(`:407`). The capture shows the **populated** state — three agents, no footer, since
the footer renders only when non-agent tasks exist (a standing "no background tasks"
line was deliberately refused as a fourth empty state, `:397`).

So a dock critic's gap about empty states would be a ruling on pixels it never
received. **None made one** — but the clause stays unjudged until the instrument can
capture those states, which is a ticket, not something a wave may fix by itself.

### 6. Run 1's captures were one command from being overwritten

`.gauntlet/waves/1/` … `5/` hold run 1's **git-tracked** captures, and the instrument
writes the **same filenames** (`welcome.png`, `titlebar.png`, …). Following the
preset's flat `.gauntlet/waves/<N>/` would have silently destroyed the archived run's
evidence on its first firing. Run 2 writes
**`.gauntlet/waves/docks-and-min-window/<N>/`**. Do not "correct" this back.

### 7. The bar discrepancy #149 left open is SETTLED — by a second artifact

`.context/` prose said the three docks *"share the Sidebar's reference"*.
`.gauntlet/bar/README.md`'s table assigns `linear/linear-features.png` to
*"Titlebar + docks"* — and `linear/manifest.json` carries the **same `judges` string**
independently. Two artifacts agree against the prose. **Read the table.** The seed
already took this reading; wave 1 confirms it rather than reopening it.

### 8. Smoothing pass skipped — the one-new-piece budget is still unspent

Run 1's precedent on a build-less wave: it exists to catch pieces *"improved
separately"* that drifted, nothing was improved, so it would have had no drift to find
and its licence to restructure would have been the only thing left of it. The seed's
own trigger (three identical gaps) did not fire either, and the cross-piece read it
asked for was done — §3. **One piece may still be added; four slots of six are used.**

### 9. `plateau` stays 0, and that is not a free pass

Plateau counts waves in which **no piece's verdict improved**. Wave 1 has no prior
verdict to improve on, so it cannot be a plateau wave — the same call run 1 made and
recorded. Wave 2 is the first wave that can move it.

## Log
- [wave 2] **The first wave that BUILDS.** Four builders, one pin agent, four critics, one
  smoothing pass. All four wave-1 gaps closed and visible in the captures; **zero
  `SPEC BREAK`s**, zero out-of-scope rulings, **4/4 critics verified against a first-hand read
  to have seen real pixels** (one dimensional slip: the Welcome critic called a 640x432 capture
  640x480; its content observations all held).
- [wave 2] **`plateau` 0 -> 1, and it is run 1's predicted scale failure firing.** 4/4 critics
  answered BETTER; 0/4 verdicts moved. Counter incremented honestly rather than adjusted —
  owner call 13.
- [wave 2] **The cross-piece lever landed.** CommandsDock **joined** the shared two-line clamp
  group AgentsDock created rather than inventing a third treatment, and corrected its comment
  to match. Serializing those two builders on `shared.css` + `rails.css` was necessary and is
  now proven rather than predicted.
- [wave 2] **Smoothing pass earned its slot**: three docks carried **three leadings for one
  question** (17.6px vs 15.95px on the same 11px sentence in the same 248px column), because one
  builder took the clamp and left the leading behind. Fixed in the shared group. **Declined nine
  findings with reasons.** Proposed one new piece, accepted: **`DocksAsOne`**, five of six slots
  used, **critic-only on wave 3** and its first verdict cannot count toward `plateau`.
- [wave 2] **The seed's named risk FIRED**, first time. All three dock gaps now converge on one
  systemic absence — the app has no icon vocabulary. Three different elements, not the same
  defect, so the decomposition still stands; what it means is that no existing piece owns the
  question, which is the argument for `DocksAsOne`.
- [wave 2] **`gui-94` is RED — exit 1 on AC3 and AC4** (`.command-row-desc` 12px -> 31.9px; row
  60px -> 65.1px). The builder's "stale rather than violated" was settled by exit code and is
  wrong. Its guarding half still passes, popover untouched. **Reverting the line-height alone
  does not clear it** — AC3 measures height, so a two-line clamp at 1.1 is still ~24.2px against
  a 12px probe. Owner call 12.
- [wave 2] Critic **re-resolved live** rather than carried: `wisp routing` gives first
  non-Anthropic family `sonnet` -> `codex/gpt-5.6-sol`. Third consecutive reading of the same
  value, read fresh each time. `critic_degraded: false`.
- [wave 2] **One critic crashed (`Prompt is too long`) and was RE-RUN, not recorded as a
  no-verdict.** Retried with the spec inlined verbatim and all repo exploration forbidden;
  returned first attempt. The bar was never softened, only the exploration budget — so
  `critic_degraded` stays false. Hand the slim prompt shape to any future WelcomeMinWindow critic.
- [wave 2] **D4 discharged by TWO instruments.** New driver `gui-gauntlet-wave2.mjs`, 15 checks
  across three docks, each carrying its reconstructed OLD value; author red-verified it by
  `git stash` + rebuild + rerun (**exit 1, 7/7 change-checks failed**) then restored with the
  diff fingerprint byte-identical. Re-run first-hand twice, exit 0. It honestly **declined** to
  pin WelcomeMinWindow; **`inspect.mjs` pins that one instead** —
  `HEADROOM {"measured":65.31,...,"overflow":0}` unchanged from wave 1, `.welcome-hint` at
  **27.59px = one line**, so the new 56-character copy is measured to fit, not argued to.
- [wave 2] **Instrument run rather than trusted, twice** (after the builders and again after the
  smoothing pass). `PASS`, 11/11 both times. Text lengths byte-stable on every surface except
  the deliberate copy change: `agents-dock` 262, `commands-dock` 377, `appearance-dock` 206 —
  all identical to wave 1 — and `welcome-min-window` 92, which is exactly 15 + 56 + 21. Rail
  still its #148 fixture.
- [wave 2] **Blast radius measured: exactly SIX captures moved, FIVE byte-identical.** Moved:
  three docks, `welcome-min-window`, and `welcome` + `window-welcome` (the same copy renders on
  the standard pane). Identical: `chat`, `input-bar`, `sidebar`, `titlebar`, `window-session`.
  **Zero unintended reach**, corroborating the driver's A4/B3 guards independently.
- [wave 2] **Gate green TWICE (D7)**, read from separate log files, never a pipeline: typecheck
  clean, **96 files / 1406 passed + 37 skipped**, build clean, both after the builders and after
  the smoothing pass. Test count unchanged from wave 1; **the +1 skip is attributed** to exactly
  `gui-gauntlet-wave2.mjs`, reported not omitted. **CSS bundle hash moved both times**
  (`index-B83pCap1` -> `index-DkrgN1a3` -> `index-zgbU0lqM`), which is wave 1's unchanged-hash
  witness working in the other direction.
- [wave 2] **D3/D4 swept mechanically, eight checks, not taken from six agents' self-reports.**
  All green both runs, including #129's `var(--x)` resolution scan over all of `styles/`: zero
  undefined. The sweep was validated on the committed baseline first — where it **found a bug in
  its own offset parser**, unitless `0` read as a stripe — then mutation-probed 6/6 red.
- [wave 2] **A product defect the instrument found and no wave may fix: filed as #161 at
  `needs-triage`.** `CommandsDock` fetches once on mount with no retry; the dock reported **0
  rows while a direct `listCommands()` from the same page returned 126**, and it stays empty for
  as long as it is open. Filed at `needs-triage` on purpose — a leg does not promote its own
  follow-up.
- [wave 2] **Nothing pushed — D6.** Read the real gap with
  `git rev-list --count origin/main..main`.
- [wave 1] **Baseline measurement wave — four critics, NO builders**, for the reason
  in the adjudications header. All four returned `BAR WINS`, **zero `SPEC BREAK`s**,
  zero agent errors, 4/4 verified to have seen real pixels against a first-hand read.
- [wave 1] Critic **re-resolved live**, per the seed's standing instruction rather than
  carried: `wisp routing` gives first non-Anthropic family `sonnet` ->
  `codex/gpt-5.6-sol`, the same value the seed saw, read fresh. `critic_degraded: false`.
- [wave 1] **Instrument run, not trusted.** `PASS`, **11/11** files,
  `FRAME {"width":1440,"height":900,"zoom":1}`. All four pieces non-empty:
  `agents-dock` 262 chars, `commands-dock` 377, `appearance-dock` 206,
  `welcome-min-window` a 640x432 pane at `HEADROOM {"measured":65.31,"claimed":65,
  "drift":0.31,"overflow":0}`. The rail came back as its **fixture** —
  `RAIL {"rows":5,"foot":"12 sessions outside this project"}` matching its own
  `expect`, which is #148 working; run 1 photographed a live `950`.
- [wave 1] **The min-window critic and the instrument agree independently.** The critic
  reported the stack *"fully visible without wrapping or clipping at the minimum window
  size"*; the instrument measured `overflow: 0` with 65.31px headroom. Two witnesses,
  neither reading the other.
- [wave 1] Gate green on all three (D7), read from **separate log files, never a
  pipeline**: typecheck clean, **96 files / 1406 passed + 36 skipped**, build clean.
  **Identical to `main`'s number at leg 12** — correct, since wave 1 edits no `src/`.
  The build also kept the CSS bundle hash **`index-B83pCap1.css`**, a second
  independent witness that no pixels moved.
- [wave 1] Captures namespaced to `.gauntlet/waves/docks-and-min-window/1/` — see
  adjudication 6 for the run-1 evidence this protects.
- [wave 1] **Nothing pushed — D6.** Read the real gap with
  `git rev-list --count origin/main..main`.
- [seed] Seeded at `5e20472` off `main`. Four pieces, all `BAR WINS`, all open —
  the four published surfaces run 1 could not see (#133 added the docks, #137
  added `welcome-min-window`, both after `core-surfaces` seeded). Instrument run
  rather than trusted: `PASS`, 11/11. Critic family resolves
  (`sonnet` -> `codex/gpt-5.6-sol`), recorded as proof-of-resolution only.
  Branch `gauntlet/docks-and-min-window` cut off `main`. No wave ran — per the
  preset, a seed firing ends at step 1.
