# relay-leg — one ticket per leg, gateless wrap-up

Loop body for:

```
/relay N=1 read and follow .claude/relay-leg.md
```

Each leg = exactly ONE ticket end to end, then the relay machinery hands off to
a fresh session. Legs run **unattended**: never call AskUserQuestion; every gate
below auto-decides. Ambiguity is never a question — it is a `ready-for-human`
relabel plus a comment.

## Current queue (updated 2026-07-31 after leg 4, spec #64)

**Two tickets left, both unblocked.** Spec **#64 — Appearance panel (theme ·
backdrop · zoom) and session deletion** is published and sliced. Blocking edges
are wired as native GitHub issue dependencies and verified via
`issue_dependencies_summary.blocked_by`; **nothing in the batch is blocked any
more.**

| # | Ticket | Blocked by |
|---|---|---|
| ~~#65~~ | ~~Retire the stale `gui-45` driver~~ — **closed `f0dfc68`** | — |
| ~~#68~~ | ~~Delete a session from the rail~~ — **closed `70c904f`** | — |
| ~~#66~~ | ~~Appearance dock with the zoom control~~ — **closed `a7c0470`** | — |
| ~~#67~~ | ~~Tokenise the two duplicate colour literals~~ — **closed `e16ace6`** | — |
| #69 | Backdrop control: Acrylic or Mica | — |
| #70 | Four themes: Frost, Ember, Moss, Slate | — (released by #67) |

**Take #69 next.** It is the older of the two and the batch ordering has always
been #67 → #69 → #70. #70 is equally takeable; nothing sequences them against
each other now.

**#67 amended the theme ADR.** Its `color-mix()` premise was false — six
existing sites already mix `var(--mint)` with `transparent`, so they **re-hue
for free**. #70 must not tokenise them, must not expect them in the key set
(still exactly four accent keys), and must not read them as literals #67
missed.

**#71** (`gui-51`'s gutter tolerance) is open and unblocked but outside the
chain. Its stated premise is now **spent** — it was filed expecting #66 to move
the default zoom, and #66 did not (still `1.25`; the panel only exposes
stepping). The ticket still stands on the pre-existing miscalibration to the old
`1.1` default.

One decision in this batch is **counter-intuitive and already settled** — do not
re-derive it, and do not "correct" it mid-leg: preferences stay in renderer
`localStorage` (the main-side store rested on a premise that is false —
`setBackgroundMaterial` is runtime-settable). Argued in full in
`.context/decisions/2026-07-31-a-preference-lives-where-it-is-read.md`. #69 is
the ticket that consumes it.

#68's own counter-intuitive decision (the delete call omitting `dir`) is now
shipped and pinned in code, and its ADR was **amended** after the probe measured
its stated premise false — Windows holds no delete-blocking handle on a
transcript. Read the amendment before citing that ADR for anything.

#66 shipped exactly as its ADR argued, reversing nothing. Its one trap worth
carrying: `useZoom`'s lazy `useState(readStored)` initialiser is load-bearing,
and setting that initial state from an effect instead leaves the whole
`zoom-shortcuts` suite green while the panel reports the wrong number.

The frontier query in step 1 is always the authority; never hand-pick from this
section if it disagrees with the tracker.

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
