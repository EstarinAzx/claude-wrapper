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
                               # non-Anthropic family. Seed resolution recorded
                               # below; routes have moved in under a day before.
critic_degraded: false
branch: gauntlet/core-after-docks
wave: 0
plateau: 0                     # consecutive waves in which no verdict improved
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
  than re-deriving their conclusions.

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

## Verdicts

| wave | piece | verdict | biggest gap |
|---|---|---|---|

## Log

- [seed] Run 3 seeded on `main` at `56917df`, branch `gauntlet/core-after-docks`.
  Five pieces, sixth slot reserved for the smoothing pass. `inspect` run at seed:
  `PASS`, 11/11. Cross-run instrument determinism controlled: fresh `main` capture
  SHA256-identical to run 2 wave 12 on all eleven files, so the five core-surface
  deltas against run 1 wave 5 are real change. Critic resolved live to
  `sonnet -> codex/gpt-5.6-sol`. `AgentsDock`/`DocksAsOne` excluded — owner call 19
  cost run 2 six pixel-identical waves. No wave run this firing.
