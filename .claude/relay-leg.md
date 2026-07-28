# relay-leg — one ticket per leg, gateless wrap-up

Loop body for:

```
/relay N=1 read and follow .claude/relay-leg.md
```

Each leg = exactly ONE ticket end to end, then the relay machinery hands off to
a fresh session. Legs run **unattended**: never call AskUserQuestion; every gate
below auto-decides. Ambiguity is never a question — it is a `ready-for-human`
relabel plus a comment.

## Current queue (written 2026-07-28)

Two independent lines of work, both `ready-for-agent`, blocking edges wired as
native GitHub issue dependencies:

- **#42 — Multiline prompt composition.** Standalone, no edges, highest value.
  Run it first.
- **Spec #41 — Resume anything**, chain: `#43 → #44 → #45 → #47 → #48`, plus
  `#44 → #46 → #47` and `#45 → #49`.

Execution order: `#42 → #43 → #44 → #45 → #46 → #47 → #48 → #49`. Only #42 and
#43 are unblocked at spec time; the rest open as their blockers close, so the
frontier query in step 1 is the authority — do not hand-pick from this list if
it disagrees with the tracker.

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
     failing pin by editing its expectation. The **only** authorized pin
     retirement in this queue is named explicitly in #42
     (`tests/attachments-composer.test.tsx`, `'the composer is still a
     single-line input'`). Any other red pin means your change is wrong.
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

## Removed 2026-07-28: the Grok-grunt delegation layer

Earlier versions of this body had Fable lead while `xai/grok-4.5` subagents did
the grunt implementation through the wisp-slot skill (snapshot `haiku` → rebind
→ spawn → hold → revert). **Removed deliberately.** It bought cheaper
implementation tokens at the cost of real unattended failure surface: a leg that
dies mid-slot strands the routing row, the Iron Rule makes restore ordering
load-bearing, and `wisp snapshot` has a footgun (bare invocation snapshots every
row). The last completed chain delivered four tickets clean without it.

**To restore:** the procedure is unchanged and lives in the `wisp-slot:slot`
skill — snapshot the sacrificial family first, bind, verify no `warning:` line,
spawn with `model: "<family>"`, hold until every agent on that family finishes,
then `wisp snapshot revert <family>`. Re-add it as a step 4 sub-procedure.
