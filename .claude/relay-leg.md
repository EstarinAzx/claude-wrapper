# relay-leg — one ticket per leg, gateless wrap-up

Loop body for:

```
/relay N=1 read and follow .claude/relay-leg.md
```

Each leg = exactly ONE ticket end to end, then the relay machinery hands off to
a fresh session. Legs run **unattended**: never call AskUserQuestion; every gate
below auto-decides.

## `ready-for-human` IS ALLOWED THIS QUEUE — read this first

This differs from the previous batch, deliberately. On **2026-08-04** the owner
was *away from home* and forbade the label outright. On **2026-08-05** they said
only:

> "i will be sleeping now"

Asleep is not away. They are back in the morning, so a ticket parked for them
overnight is answered in hours, not never — which is exactly what the label is
for. **If a leg genuinely sticks: label it `ready-for-human`, comment with where
and why, and STOP the relay** rather than spawning a leg that re-picks it.

The sleep grant removes **ownership** as a ground for deferring. It does **not**
remove the need for a warrant, it licenses nothing irreversible, and it does not
reopen the standing calls in `.context/pick-up.md` or the six owner calls on #115.

## Current queue — TWO OPEN as of 2026-08-05

Take the lowest-numbered open, unblocked `ready-for-agent` ticket.

Filed by a `/preset vibe init` run on 2026-08-05. Its full record — every
question, the grepped warrant, the cross-model verdict, and the four refutations
that changed the work (two of which killed the main thread's *own* findings) — is
`.claude/vibe.md`. **Read it, and parent spec #115, before starting either ticket.**

| # | subject | blocked by |
|---|---|---|
| **116** | **spike** — is `@` file autocomplete reachable from this app at all? | — |
| **117** | **spike** — every win32 route to a backdrop that does not flatten on blur, priced | — |

Neither blocks the other; take them in number order. Parent spec is **#115**.

### BOTH ARE SPIKES AND MUST STAY SPIKES

Harness/sweep, findings, recommendation — **no `src/` diff**, which is part of the
gate here (`git diff --stat -- src/` empty). Killing their own premise is a
successful outcome. Each ends by filing its own build ticket with a decided
shape, or declining it and saying why. **Do not build the feature in the spike
leg** — the record's rule is *build only if measured* and #78 is the precedent
that measured and then built nothing.

### The four landmines this run produced

- **Probe by CALLING, never by matching names.** #90's harness got its headline
  answer wrong that way, and #115's own grill made the same error twice — once
  concluding from a wire union's membership (that union is direction-agnostic),
  once from the absence of a method name on `Query` (#88 records a generic
  subtype dispatcher behind those methods). Both were only corrected by reading
  the runtime bundle. An absent name is not an absent route.
- **Do not assert what Mica does on blur.** Twice refuted during the grill. The
  app's own copy claims it and the ADR the copy came from says *"always-on,
  stable"* — neither is an observation, and four legs on this record (#78, #89,
  #94, #111) are decision-document platform claims that measurement later
  contradicted. It is parked as an owner call on #115.
- **A driver capture is not evidence about acrylic appearance**, and the reason
  is DWM compositing over a wallpaper — **not** `--disable-gpu`. `gui-69.mjs`
  launches *without* that flag on purpose. #115's grill got this wrong first.
- **Producing an honestly-unfocused window under automation is itself unsolved
  here.** #75 measured that `win.blur()` moves `isFocused()` not at all and that
  a minimised window still reports itself focused; only `hide()` moved both, and
  `hide()` removes the window being photographed. #117's S4 is best-effort and
  must say so rather than implying a capture shows the flip.

### Six owner calls that must NOT be decided in a leg

Parked on #115: whether Mica survives blur · whether the flip is now worth a
dependency · the `@` trigger-window rule · cursor-insert vs replace · what the
`@` list excludes and whether it is capped · whether an accepted `@` reference
joins the 10-slot attachment tray. A leg that needs one of these answers should
say so on the ticket and stop, not guess.

**When a new batch exists, read its parent spec and every
`.context/decisions/` entry the tickets name before writing code.** The bodies
in this project are adversarially reviewed to remove the ambiguity that stalls
unattended agents, so a step that looks under-specified usually means you have
not read far enough.

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
   confusion → comment on the ticket, **label it `ready-for-human`** (allowed
   this queue — see the top of this file), jump to step 6, and stop the relay
   rather than spawning a leg that would re-pick it.
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
     coding, push the branch as-is, comment exactly where and why it stuck, and
     **label it `ready-for-human`** — allowed this queue, see the top of this
     file. Ticket stays open; its dependents stay blocked. Then
     **stop the relay**: the next leg would otherwise re-pick the same stuck
     ticket forever.
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
