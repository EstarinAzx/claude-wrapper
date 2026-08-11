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
critic: sonnet                 # FAMILY name only — re-resolve live every wave, never carry the target
critic_degraded: false
branch: gauntlet/docks-and-min-window
wave: 1
plateau: 0
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
