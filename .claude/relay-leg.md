# relay-leg — one ticket per leg: Grok grunts, Fable leads, gateless wrap-up

Loop body for:

```
/relay N=1 read and follow .claude/relay-leg.md
```

Each leg = exactly ONE ticket end to end, then the relay machinery hands off to
a fresh session. Legs run **unattended**: never call AskUserQuestion; every gate
below auto-decides. Ambiguity is never a question — it is a `ready-for-human`
relabel plus a comment.

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
   issue with no open blockers (`issue_dependencies_summary.blocked_by == 0`).
   None available → **queue done**: rewrite `pick-up.md` to "queue empty"
   (listing any leftovers stuck `ready-for-human` or blocked and why), commit
   `.context/` on main, signal the relay stop (step 8). No spawn.
2. **Idempotency guard.** A branch or PR named `ticket/<id>-*` already exists →
   never restart from scratch: unfinished and yours → resume it; finished and
   green but unmerged → land it and jump to step 7. Genuine collision or
   confusion → comment on the ticket, relabel `ready-for-human`, jump to step 7.
3. **First-commit guard.** `main` has zero commits → commit the existing tree
   on main first (`chore: repo bootstrap (.context, docs, CLAUDE.md)`) and push,
   before any branching.
4. **Branch.** `ticket/<id>-<slug>` off main.
5. **Work — Fable leads, Grok grunts.**
   - **You (Fable) own:** reading the ticket + spec (#1) + relevant
     `.context/decisions/`, architecture, file layout, interfaces/types, task
     decomposition, code review, integration, and the gate. Route through
     skills as the work demands (superpowers TDD for logic; impeccable for the
     UI/design slices — the Frost Mono reference is
     `docs/design/frost-mono-reference.png`).
   - **Grok subagents get the grunt implementation** via the slot skill
     (wisp-slot:slot), family `haiku`, target `xai/grok-4.5`:
     a. *Preflight.* Bridge reachable + `wisp routing` prints the map. A
        pre-existing `~/.claude/slot/lease-haiku.json` at leg boot means a
        previous leg died mid-slot — the chain is serial (N=1), so no live
        agent can hold it: restore the prior route from the lease, verify,
        delete it, continue. (Deliberate unattended adaptation of the skill's
        ask-the-user step.)
     b. *Bind.* Snapshot + write lease per the slot skill, then
        `wisp routing set haiku xai/grok-4.5`, verify. Any `warning:` line →
        do NOT spawn; restore, delete lease, use the fallback below.
     c. *Spawn.* Agent tool, `model: "haiku"`, `subagent_type:
        "general-purpose"`, description `grok-4.5: <short task>`. Independent
        chunks may spawn in parallel — same family, one lease. Each task
        prompt must be a complete spec: exact files to create/edit, exact
        interfaces/props/types to conform to, the acceptance tests to satisfy,
        and repo conventions. Grok writes code + its unit tests and reports
        what it did.
     d. *Hold + restore.* Iron Rule: restore `haiku` only after EVERY Grok
        agent of this leg has finished. Then guarded restore from the lease,
        verify, delete the lease — before the gate, so a crash later never
        strands the route.
     e. *Review.* Read every Grok diff yourself; fix or redo anything below
        bar. Grok output is draft — you own what lands.
   - **Fallback.** Bridge down, `wisp` too old, or bind fails → implement it
     yourself and say so in the ticket comment. Never let slot machinery kill
     the leg.
6. **Gate.** Full test suite + typecheck (+ build script if the repo has one)
   green?
   - **Green** → merge the ticket branch into main (squash), push main, delete
     the branch, close the ticket with a breadcrumb comment: what landed,
     commit sha, anything a cold reader needs to continue.
   - **Not green after honest effort, or ticket ambiguous/destructive** → stop
     coding, push the branch as-is, comment exactly where and why it stuck,
     relabel `ready-for-human`. Ticket stays open; its dependents stay blocked.
7. **Gateless wrap-up — always on main.**
   - `git switch main` (already there if merged).
   - The wrap-up eyeball gate is skipped: auto-go, unattended.
   - Invoke `/context-update` (refreshes `active-work.md`, appends decisions if
     any were made this leg).
   - Rewrite `.context/pick-up.md`: open with
     `Start: read .context/overview.md + active-work.md`; then what this leg
     landed (ticket #, sha or ready-for-human note), the single next unblocked
     `ready-for-agent` ticket (or "queue empty"), and any landmine.
   - Commit `.context/` (and only wrap-up artifacts) on main:
     `chore(context): leg handoff after #<id>`. Push. **Never commit .context
     on a ticket branch.**
8. **Signal.**
   - Queue empty → body done: relay sets `stop: true`, no next leg spawned.
   - Otherwise the firing is complete; `iter == n` (N=1) triggers the relay
     sequence and the next leg spawns fresh.

## Hard rules

- ONE ticket per leg. Adjacent problems become a ticket comment, never a detour.
- No AskUserQuestion, ever — this body runs with no human present.
- Every landing is gated by green tests + typecheck; nothing merges red.
- `.context/` commits ride main only.
