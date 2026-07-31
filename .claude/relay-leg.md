# relay-leg — one ticket per leg, gateless wrap-up

Loop body for:

```
/relay N=1 read and follow .claude/relay-leg.md
```

Each leg = exactly ONE ticket end to end, then the relay machinery hands off to
a fresh session. Legs run **unattended**: never call AskUserQuestion; every gate
below auto-decides. Ambiguity is never a question — it is a `ready-for-human`
relabel plus a comment.

## Current queue (filed 2026-07-31 by a vibe run as #75–#80 — FOUR left: #77–#80)

Take the lowest-numbered open, unblocked `ready-for-agent` ticket. **#79 is
blocked by #78** and must stay so.

**Delivered out of this batch: #75 (`9905e1d`) and #76 (`c9114a5`).**

- **#77 — `gui-51` prints four `NOT DRIVEN` lines** for surfaces it names but
  never drives into overflow. **Do not widen the gutter budgets** to fit a newly
  measured surface; a failure there is a finding.
- **#78 — measure the launch artifact**, fix only if objectionable. AC1 is the
  measurement, per the ADR's own "Build it only if measured". Motivate on the
  **zoom** reflow, not the backdrop flash.
- **#79 — the window remembers its size and position.** Renderer `localStorage` +
  IPC push, **never a main-side store** — that argument was tested and killed.
  Amends exactly one ADR sentence.
- **#80 — type-while-busy composer with a queued send.** Its substance is the
  state machine, not the typing.

Everything before this batch is delivered and closed: spec #64 (#65 `f0dfc68` ·
#68 `70c904f` · #66 `a7c0470` · #67 `e16ace6` · #69 `add4e5b` · #70 `1769aa4`),
then #71 `b6e8911`, #72 `9fecc10`, #73 `6b4a831` and #74 `07544e8` standalone.

**#76 is #77's direct precedent — read its closing comment before starting.**
Same shape (a driver printing a standing hole above a `PASS`), and it produced a
rule that transfers: **destruction is quiet**, so an assertion phrased as an
absence can measure nothing. Weakening the guard under test left "the turn
completed" and "no error appeared" both green, because the failure mode clears
the pane; only measuring the protected thing *continuing* discriminated. Assert
what went on living, not what failed to appear. It also found that **`gui-75` is
focus-dependent and red inside a long batch** — re-run it alone before believing
that red.

**Run the frontier query anyway — do not trust this paragraph.** Leg 5 wrote
that closing #70 would empty the queue and was wrong: #71 was `ready-for-agent`
and unblocked the whole time, merely outside the batch. **The frontier query in
step 1 is always the authority, including over this sentence.** If it returns a
ticket, work it; the prose here is a summary that goes stale the moment the
owner files something.

**#75–#80 came from an autonomous `/preset vibe` run, and two things about it bind
this leg.** First, its record is `.claude/vibe.md` — every question, the agent
that answered it, the grepped warrant, and the cross-model verdict. **Read it
before starting any ticket in this batch**; the two earlier runs are archived
beside it as `.claude/vibe-2026-07-31-titlebar.md` and
`.claude/vibe-2026-07-31-production-ready.md`.

Second, **the "seven parked owner calls" rule is SPENT.** The owner granted full
autonomy on 2026-07-31 (quoted verbatim at the top of `.claude/vibe.md`) and all
seven were resolved in that run. There is no longer a do-not-decide list. What
the grant did **not** change: an answer still comes from a warrant or it is
marked as a chosen design. Two of the seven were deliberately settled only by
**half** — Tailwind is not dropped but the adopt-utilities question stays open,
and the titlebar's control count does not change while the aesthetic question
stays the owner's. **Do not close either remaining half**; the record argues
against it in those words.

**That run killed three tickets by probing them, and the corpses matter more than
the survivors — do not re-file them.** Unhandled promise rejections in main do
**not** crash this app (probed: Electron 43 / Node 24 keeps
`--unhandled-rejections=warn`, and `shell.openExternal` on an unregistered scheme
does not even reject), so the five `void`-ed promises are fine. Every `catch` in
`src/` is deliberate and carries a comment naming its contract. `void
watchSession(...)` is already `try`/`catch`'d. And a **main-side preference store
is forbidden in those words** by
[[2026-07-31-a-preference-lives-where-it-is-read]] — "No preferences file, no
main-side store" — so a `userData` JSON is a reversal that must say so out loud,
not a gap-fill.

**The run also falsified the premise it was handed, which is the recurring
lesson here.** The standing complaint was that the titlebar's buttons were
eating the drag region. Measured: false — the no-drag width is *constant* at
344.3css and does not grow with content, and the widest uninterrupted grab strip
is still 182css at the narrowest width tested. The real defect was unrelated and
found only because the probe ran. **Measure the stated cause before speccing a
fix for it**, exactly as #71 did with the scrollbar gutter.

**What leg 7 settled, because it is the kind of thing that recurs.** #71 was a
measurement ticket whose own diagnosis was flagged unconfirmed, and the
measurement changed the answer: the "three surfaces disagree" symptom was the
*instrument*, not the app — `offsetWidth - clientWidth` rounds both operands to
whole CSS pixels, so one true gutter surfaced as three numbers. **When two
instruments disagree, suspect the instrument first**, and prefer removing the
rounding over widening a tolerance to cover it.

**Four of spec #64's five ADRs now carry an amendment written after a probe
measured their stated premise.** Two because it was false (#68's Windows handle,
#70's `color-mix()`), two because it held and is now measured rather than cited
(#69's `setBackgroundMaterial`, #70's unlayered-beats-layered override, which
also recorded a limit the ADR had not stated). **Read an ADR's amendment before
citing it.**

Two traps the shipped Appearance panel imposes on any future control in it:

- **No `<input>` and no `<select>`** — a dock-wide pin asserts the panel renders
  neither. And **no second `role="radio"` group**: #69's pin reads every radio in
  the panel as a backdrop, which is why #70's picker is a listbox. Read the
  neighbouring pins before choosing a role.
- **A preference with both a REPORT and an EFFECT can self-heal in the report
  while staying broken in the effect — and if the effect is REACTIVE, the
  obvious pin on the effect self-heals too.** `useZoom`, `useBackdrop` and
  `useTheme` all depend on a lazy `useState(readStored)` initialiser. For
  `data-theme` only a pin on the FIRST value written catches the mutation; an
  after-the-fact `getAttribute` passes.

**When a new batch exists, read its parent spec and every
`.context/decisions/` entry the tickets name before writing code.** The bodies
in this project are adversarially reviewed to remove the ambiguity that stalls
unattended agents, so a step that looks under-specified usually means you have
not read far enough.

Every ticket body carries its own contract, out-of-scope list, required test
coverage and sharpest-failure-mode note. **Read the whole ticket and its parent
spec before writing code** — the bodies were adversarially reviewed specifically
to remove the ambiguity that stalls unattended agents, so a step that looks
under-specified probably means you have not read far enough.

## Boot (once per leg)

1. Relay boot already read `.context/overview.md` + `active-work.md`. Also read
   `.context/pick-up.md` — it names the target ticket and any landmines. Note
   missing → fall back to the frontier query in Firing step 1.
2. Tracker conventions: `docs/agents/issue-tracker.md` + `triage-labels.md`
   (GitHub via `gh`, native issue dependencies, canonical labels).
3. Relay handoff block in `.claude/relay/*.md` stays a pointer only — state
   lives externally: `state: .context/pick-up.md + gh issues`.

## Firing (exactly one ticket)

1. **Pick.** The ticket named by `pick-up.md` if it is still open, still
   `ready-for-agent`, and unblocked. Otherwise: oldest open `ready-for-agent`
   issue with no open blockers. Blocked-ness is authoritative from the API —
   `gh api repos/<owner>/<repo>/issues/<n> --jq '.issue_dependencies_summary.blocked_by'`
   must be `0`. (`gh issue list --json` does **not** expose that field; don't
   try.) None available → **queue done**: rewrite `pick-up.md` to "queue empty"
   (listing any leftovers stuck `ready-for-human` or blocked and why), commit
   `.context/` on main, signal the relay stop (step 7). No spawn.
2. **Idempotency guard.** A branch or PR named `ticket/<id>-*` already exists →
   never restart from scratch: unfinished and yours → resume it; finished and
   green but unmerged → land it and jump to step 6. Genuine collision or
   confusion → comment on the ticket, relabel `ready-for-human`, jump to step 6.
3. **Branch.** `ticket/<id>-<slug>` off main.
4. **Work.** You own the whole ticket: read it plus its parent spec plus any
   `.context/decisions/` it names, then architecture, implementation, tests and
   review. Route through skills as the work demands — superpowers TDD for logic,
   impeccable for UI/design slices (Frost Mono reference:
   `docs/design/frost-mono-reference.png`).
   - **Pins.** Behavior pins in this repo are mutation-verified. Never "fix" a
     failing pin by editing its expectation. **This queue authorizes NO pin
     retirement at all** — the earlier allowance (#42's single-line composer)
     is spent. Any red pin means your change is wrong.
   - **The tool card specifically:** `tests/toolcards.test.tsx`'s collapsed
     one-line card test must stay green **untouched**. It feeds a two-line
     result and asserts line two is absent. Satisfy it by *conditionally
     mounting* detail content — a CSS-hidden body or a closed `<details>` leaves
     the text in `textContent` and turns it red correctly. That test is a
     mechanism check, not a stale pin. A design review claimed this retirement
     and then withdrew it; do not re-derive the wrong conclusion. **Any new
     control on that card needs a `.tool-card-toggle--<what>` modifier class**
     (the GUI drivers select by class, and a bare `.tool-card-toggle` now
     matches whichever button renders first) **and an accessible name outside
     the file's `TOGGLE` regex** — both failures are silent and green.
   - **Required test coverage is not optional.** Several tickets specify
     assertions that exist precisely because a green suite would otherwise pass
     while the requirement is unmet (no-JSONL-read, ordered-call, call-count).
     Skipping them is a failed ticket even if CI is green.
5. **Gate.** Full test suite + typecheck + build green?
   - **Green** → merge the ticket branch into main (squash), push main, delete
     the branch, close the ticket with a breadcrumb comment: what landed, commit
     sha, anything a cold reader needs to continue.
   - **Not green after honest effort, or ticket ambiguous/destructive** → stop
     coding, push the branch as-is, comment exactly where and why it stuck,
     relabel `ready-for-human`. Ticket stays open; its dependents stay blocked.
6. **Gateless wrap-up — always on main.**
   - `git switch main` (already there if merged).
   - The wrap-up eyeball gate is skipped: auto-go, unattended.
   - Invoke `/context-update` (refreshes `active-work.md`, appends decisions if
     any were made this leg).
   - Rewrite `.context/pick-up.md`: open with
     `Start: read .context/overview.md + active-work.md`; then what this leg
     landed (ticket #, sha or ready-for-human note), the single next unblocked
     `ready-for-agent` ticket (or "queue empty"), and any landmine.
   - Commit `.context/` (and only wrap-up artifacts) on main:
     `chore(context): leg handoff after #<id>`. **Never commit .context on a
     ticket branch.**
7. **Signal.**
   - Queue empty → body done: relay sets `stop: true`, no next leg spawned.
   - Otherwise the firing is complete; `iter == n` (N=1) triggers the relay
     sequence and the next leg spawns fresh.

## Hard rules

- ONE ticket per leg. Adjacent problems become a ticket comment, never a detour.
- No AskUserQuestion, ever — this body runs with no human present.
- Every landing is gated by green tests + typecheck; nothing merges red.
- `.context/` commits ride main only.
- Push is part of the leg (`git push` after the squash merge and after the
  context commit). Do not leave main ahead of origin at leg end.

## Grunt delegation — optional, and no longer needs the slot skill

Earlier versions of this body had Fable lead while `xai/grok-4.5` subagents did
the grunt implementation through the wisp-slot skill (snapshot `haiku` → rebind
→ spawn → hold → revert). That was removed 2026-07-28 because of real unattended
failure surface: a leg dying mid-slot stranded the routing row, the Iron Rule
made restore ordering load-bearing, and bare `wisp snapshot` snapshots every row.

**Updated 2026-07-30 — that failure surface is gone.** The `haiku` family now
routes to `xai/grok-4.5` *standingly* in the Wisp routing map, so delegating
grunt work needs **no snapshot, no rebind, no revert, and no Iron Rule** — spawn
a subagent with `model: "haiku"` and it lands on Grok directly. Nothing to
strand, because nothing is temporarily rebound. Confirm the route still holds
with `wisp routing` before relying on it; if `haiku` has been repointed, treat
delegation as unavailable rather than reaching for the slot skill mid-leg.

**Still optional, and still not the default.** Delegation buys cheaper
implementation tokens and costs coordination surface inside an unattended leg.
Use it for genuinely mechanical work — a mechanical rename, a repetitive fixture
build-out, a test-file scaffold — while the leg's own model keeps architecture,
the required-coverage assertions, review and the gate. Never delegate the gate,
and never delegate a pin.
