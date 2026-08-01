---
target: init
idea: "Spec the taskToParent join — nest a background task under its spawner in the Agents dock. #83's reserved leftover."
partner: opus
pressure: codex/gpt-5.6-sol
pressure_via: sonnet
max_defer: 12
phase: fired
halted: false
---

## The seed, and exactly how much of it is the owner's

**Provenance matters here more than usual.** The owner did not type prose this
run. They were shown a four-option menu built from the record and answered
**"number 1 but vibe it"**. So the seed is the option they selected, and the
option's wording is *mine*, not theirs:

> **Spec the taskToParent join** — Run `/preset init` on #83's reserved leftover,
> nesting a background task under its spawner. Most concrete candidate on the
> record; the join key is already measured, the parentage gap is already
> documented. Ends as a filed ticket.

What the owner's answer actually authorises, read strictly:

1. **The subject** — the `taskToParent` join, i.e. nesting a background task
   under whatever spawned it.
2. **The route** — `/preset init`, run unattended (`vibe`), ending in filed
   tickets rather than code this session.

Everything else — how nesting should look, whether it is a tree or an
indent or a badge, what happens when the parent is unknown — is **not** in the
seed. It comes from the record or it defers. The one prior `vibe` run on this
project turned a fogged one-sentence seed into four `no` calls decided
*against* the seed's literal words on the record's reasons; the lesson carried
forward is that a thin seed is not a licence to invent, it is a reason to cite
harder.

**The known hard constraint, already measured.** #81 measured that the level's
`task_id` matches `task_started.task_id`, the `taskToParent` key and the
`agent-<id>` sidecar id — one value in four places — but that the payload
carries **no `tool_use_id` and no parent**. So parentage is reachable *only*
where the `task_started` was seen. #83 treated the join as **observed and
reserved** and deliberately did not use it. Any design this run produces has to
survive that gap rather than assume it away.

## Decisions

Every warrant below was verified with `grep -qF -- "<quote>" <path>` before being
accepted. All six of Partner's passed.

- **D1 — The seed's two halves are disjoint, so no join over the current state can work.** `taskToParent` is `local_agent`-only (`engine.ts:356`); the background section is its exact complement (`background-tasks.ts:53`). Any honest version changes what is *recorded*, not merely what is read — main-thread code reading · pressure: STANDS
- **D2 — The spawner is observable at `task_started`, and keeping it is not "inventing a key".** `engine.ts:357` already reads `src.tool_use_id`; the fixture at `tests/engine.test.ts:962-968` carries it beside `task_type: 'local_bash'` — main-thread code reading · pressure: STANDS
- **D3 — `background-tasks.ts:51`'s refusal is scoped to the LEVEL and survives intact.** "the level carries no `tool_use_id` and no parent" is about `background_tasks_changed`; `task_started` is a different message on the same stream. Building on the latter contradicts neither that comment nor #81's finding 4 — main-thread code reading · pressure: STANDS
- **D4 — ~~The feature requires a SECOND map.~~ WITHDRAWN.** pressure: **REFUTED** — the pin proves only that the *naive insertion* reds `tests/engine.test.ts:954`; it does not prove the data structure. A single map with a typed value, or equivalent membership metadata, could retain parentage while keeping emission gated. **Replaced by the weaker claim that survives:** agent-row emission must stay gated to `local_agent`; the data-structure shape is an open implementation choice and is deliberately left to the ticket.
- **D5 — The sidecar-edge ADR does not forbid stream-sourced nesting for a background task.** It is scoped to the agent tree and declined the live route on **cost**, not principle. A background task, having no sidecar, simply cannot use the edge that ADR built — warrant: "It was declined because it costs engine work, a second correlation" @ `.context/decisions/2026-07-25-agent-tree-edge-is-the-sidecar.md`
- **D6 — ~~An unreachable parent must not render as the known-negative "top-level".~~ WITHDRAWN.** pressure: **REFUTED** — the more specific tree ADR already decides the shape of this case ("A row naming a parent absent from the list degrades to a root" @ `.context/decisions/2026-07-25-agent-tree-edge-is-the-sidecar.md`), and the absent-not-zero rule is about **inventing stored data**, not about rendering position. **Residue worth keeping, and it cuts against both sides:** that tree ADR governs `AgentRow`s inside `buildAgentTree`, and background tasks deliberately never reach it (#83's separate prop), so *neither* rule cleanly governs a background row. This is therefore **not settled** — it is folded into the open visual-form defer rather than recorded as a decision.
- **D7 — ~~Added parentage state must reset in `engine.close()`.~~ WITHDRAWN.** pressure: **REFUTED** — the `close()` warrant is about resetting the **externally retained** REPLACE level, and does not generalise to every engine-local structure. State living in `makeEngine`'s closure (as `taskToParent` does) dies with the discarded engine and needs no explicit clearing. **The reset obligation depends on where the state lives**, which this run has not decided — so it is a constraint for the eventual build ticket to resolve, not a decision now.
- **D8 — One separate ticket, filed rather than grown into anything.** No size or acceptance shape is stated anywhere — warrant: "and give it its own ticket rather than growing anything into it." @ `.context/pick-up.md`
- **D9 — `nonAgentTasks`' `local_agent` exclusion is independent of nesting and stays untouched.** Its reason is duplication (a subagent already has a row), not parentage — warrant: "rows are dropped from the section itself, because the \`Agent\` tool" @ `.context/decisions/2026-08-01-a-level-is-replaced-not-accumulated.md`
- **D10 — Making a background task clickable is NOT authorised by this work** — warrant: "whether a background task should ever become **clickable**" @ `.context/active-work.md`

## Needs you

**Carried from the 2026-07-31 runs — still parked, still the owner's.** Full
original entries in `.claude/vibe-2026-07-31-titlebar.md` and
`.claude/vibe-2026-07-31-production-ready.md`; kept here verbatim so every
`.context/` pointer at "`.claude/vibe.md` under `## Needs you`" stays true.
These two are **carried, not raised by this run**, and do not count toward this
run's `max_defer`.

- [ ] **Tailwind's fate — adopt utilities, drop it, or keep it as a token store?**
      took: KEEP AS-IS (no change, zero diff)
      alt: drop two devDependencies + the vite plugin and inline `@theme` into `:root`; or deliberately adopt utilities for new UI
      why: Partner DEFERred — no warrant exists. The record is explicit that you personally overrode a YAGNI push-back to install it, on the stated grounds the app "will evolve" and you wanted utilities from day one. Reversing your own override while you sleep is not a call an agent gets to make.
      reversible: yes
- [ ] **Which of the titlebar's 8 buttons should leave or move?**
      took: NONE — #72 fixed the measured defect and changed no control
      alt: relocate the two pills, drop the app name, or move a dock toggle out
      why: Partner DEFERred; pure taste. The stated rationale ("each button eating drag region") is measured and false, so the remaining case is aesthetic, which is yours.
      reversible: yes

**Raised by this run — three, all reversible.**

- [ ] **What did you actually mean by "its spawner"?** This is the run's central defer, and it is genuinely undecidable from the record.
      took: MEASURE FIRST — file a spike that turns as much of the question as possible into a fact rather than a preference
      alt: commit now to (i) "name the spawning tool call" — cheap, reachable today; or (ii) "nest under the spawning **agent**" — which needs `parent_tool_use_id` on a *system* message, a field this repo's SDK type declares only on `assistant`/`user` (`engine.ts:31,48`), that no fixture exercises, and that `handleMessage`'s envelope check at `:410-414` is gated away from
      why: The seed did not come from your prose this run — you picked a menu option whose wording was mine, so reading intent out of the phrase "nest under its spawner" would be reading my own words back as if they were yours. That is the exact failure this preset exists to prevent. If the measurement comes back negative for (ii), the choice collapses into a fact and you never have to make it.
      reversible: yes
- [ ] **May parentage state be recorded for NON-agent tasks at all?** (Partner: DEFER — nothing on the record reaches non-agent parentage; the two nearest items are scoped to the agent tree and to the level payload respectively.)
      took: NO STATE SHIPPED THIS TICKET — the spike measures and renders nothing, so no engine state is added until you have the answer
      alt: authorise the engine change up front and let the ticket both measure and ship
      why: Adding per-process engine state is the kind of change this project pins hard (D7 shows even the *reset site* is load-bearing and non-obvious). Measuring costs nothing and forecloses nothing.
      reversible: yes
- [ ] **What should nesting LOOK like?** (Partner: DEFER — the record fixes presentation for agent rows only, and fixes that background rows are non-interactive; it chooses nothing among indent / child-in-tree / parent label.)
      took: NOT CHOSEN — deliberately left out of the ticket
      alt: adopt the agent tree's flat-with-a-depth precedent (`paddingLeft: depth * 14` + `aria-level`) by analogy
      why: The analogy is available but unwarranted — that precedent is stated for `AgentRow`s inside `buildAgentTree`, and #83 deliberately keeps background tasks out of `mergeAgents` and off that path entirely ("A separate prop, never folded into liveAgents" @ `src/renderer/src/App.tsx:342`). Borrowing it would be a taste call wearing a citation.
      reversible: yes

## Log

- [boot] Queue verified dry (0 open issues, any label). Prior run `.claude/vibe.md` was `phase: fired` with both its tickets (#82, #83) landed and closed — a completed run, not a crash — so it was archived to `.claude/vibe-2026-08-01-background-agents.md` rather than resumed, following the existing `vibe-<date>-<slug>` convention.
- [boot] Destination **detected** as GitHub (`gh auth status` ✓ as EstarinAzx, `origin` → EstarinAzx/claude-wrapper). `.context/` and `docs/agents/` both exist, so init steps 3–4 raise no offer.
- [boot] Pressure Target resolved by rule "first non-Claude family in `wisp routing`": `opus` is Claude → skip; **`sonnet` → `codex/gpt-5.6-sol`**, taken. No `slot` rebind owed, so `pressure_via: sonnet` and step 6 owes no restore.
- [round 1] Partner hydrated on 36 files and returned a 14-item mutation-verified pin list. Eight design questions asked; **6 answered with warrants, 2 DEFERred** (parentage state for non-agent tasks; the visual form of nesting). **All 6 warrants passed `grep -qF --` verification.**
- [round 1] Pressure attacked 4 main-thread grounding findings: **F1/F2/F3 STAND, F4 REFUTED** — the pin proves the naive insertion fails, not that a second map is required. Claim withdrawn and weakened.
- [round 2] Pressure attacked the 6 warranted decisions: **D5/D8/D9/D10 STAND, D6 and D7 REFUTED**, both withdrawn. D6 because a more specific tree ADR already governs the degrade case (and, on inspection, neither rule cleanly reaches a background row — folded into the visual-form defer). D7 because the `close()` warrant is about externally-retained level state, and engine-closure state dies with the engine.
- [round 2] Pressure **REFUTED the ticket shape** on two prongs. The structural prong was accepted in full: a ticket that conditionally builds while deferring the visual form cannot honestly specify its build branch. The factual prong — that #81 already live-measured `tool_use_id` on a `local_bash` `task_started` — was **rebutted with evidence** and not re-asserted: the harness captures the field but its console never prints it, the ADR records the *level* instead, and the evidence sink is a temp dir outside the repo by design, so nothing survives.
- [round 3] Revised to a **measurement-only** ticket, no build branch. Pressure: **STANDS**.
- [tickets] Filed **#84** — "Measure whether a background task's spawner is reachable on the wire (measurement only, no build)", label `ready-for-agent`, unblocked. Modelled on #81's body structure (problem → why the record does not settle it → authorising condition stated up front → what to run → out of scope).
- [deviation] **Skipped init step 6 (`/hp`).** A measurement-only spike renders nothing and has no golden-path user journey; mapping one would mean inventing the visual design this run deliberately deferred, and `.context/happy-path.md` already holds the app's real multi-journey MVD, which an overwrite would clobber.
- [deviation] **Skipped init step 7's separate PRD issue.** #81 — the direct precedent for this exact kind of ticket — was spec and ticket in one, with no parent PRD. A PRD restating a single spike is duplication on a tracker the owner reads. The ticket body carries the full spec.
- [halt check] `## Needs you` = 5 (2 carried + 3 raised), under `max_defer: 12`. **No entry flagged `reversible: NO`.** Grill fork was taken, not wayfind. `to-tickets` produced one ticket. **Clear to fire.**

## Main-thread grounding (measured before the grill, in code, not from the record)

These are the main thread's own readings of `src/`, done while the agents
hydrated. They are stated here because they reframe the seed, and because a
crash should not lose them. They are **code facts**, independently checkable —
not warrants, and not Partner's to cite.

1. **The seed's two halves are disjoint by construction.** `taskToParent` is
   populated **only** when `task_type === 'local_agent'` — `if (str(src.task_type) !== 'local_agent') return`
   at `src/main/engine.ts:356`. The dock's background section renders **only**
   the complement — `tasks.filter((t) => t.taskType !== AGENT_TASK_TYPE)` at
   `src/shared/background-tasks.ts:53`. So *every row in the background section
   is precisely a row with no `taskToParent` entry.* Joining the two as they
   stand yields the empty set. Any honest version of this feature must therefore
   change what gets recorded, not merely read an existing map.

2. **But the spawner IS observable, and recording it is not "inventing a key".**
   `engine.ts:357` reads `src.tool_use_id` off `task_started`, and the fixture at
   `tests/engine.test.ts:962-968` — labelled *"Real local\_bash shape"* — carries
   `tool_use_id: 'toolu_bash_1'` **together with** `task_type: 'local_bash'`. The
   parent is in the payload; line 356 discards it before line 357 can keep it.

3. **The ADR comment that looks like a blocker is precisely scoped, and survives.**
   `background-tasks.ts:51` says the join was refused because "the level carries
   no `tool_use_id` and no parent, so there is nothing to join ON". That is a
   statement about the **`background_tasks_changed` level**, and it remains true
   and unchallenged. `task_started` is a **different message** on the same stream,
   and it does carry the parent. The distinction is the whole feature.

4. **`taskToParent` does DOUBLE DUTY, and that is why the naive change reds a pin.**
   `engine.ts:300-303` states the second job outright: the map is "also what keeps
   backgrounded Bash calls out of the panel: they ride the same stream with their
   own task ids, and later task messages are ignored unless their task_id is in
   here." Membership *is* the accept-list. So simply recording bash parents into
   `taskToParent` would make the lookup at `engine.ts:368` succeed for a bash
   `task_notification`, which then emits `subagentEvent(...)` at 372/377/382 — an
   agent row for a Bash task, reddening `tests/engine.test.ts:954` ("a backgrounded
   Bash task never becomes an agent row"), a mutation-verified pin. **The feature
   therefore needs a SECOND, separate map keyed for all task types, leaving
   `taskToParent` untouched in both of its jobs.** This is the central structural
   finding of this run's grounding.

5. **"Spawner" is ambiguous, and the cheap reading does not give you an agent.**
   `tool_use_id` on a `local_bash` `task_started` names **the Bash tool_use call**,
   not the agent that owns it. To nest a background task under an *agent row* you
   need the message envelope's `parent_tool_use_id`, which is a different field —
   and correlating the two is precisely the "second correlation table" that
   `.context/decisions/2026-07-25-agent-tree-edge-is-the-sidecar.md` §1 considered
   and **declined** for agents.

6. **As typed, that route does not exist.** This repo's own SDK message type
   declares `parent_tool_use_id` on the **`assistant`** and **`user`** variants
   only (`src/main/engine.ts:31` and `:48`); the `system` variant — which is what
   `task_started` arrives as — has no such field, and `handleMessage`'s envelope
   check at `:410-414` is explicitly gated `msg.type === 'assistant' || msg.type === 'user'`.
   So on this app's model of the stream there is **no route from a background task
   to its owning agent**. Whether the live CLI nonetheless puts one on the system
   message is **unmeasured** — and it is the single highest-value thing to measure,
   because it decides whether "nest under the spawning agent" is buildable at all
   or whether only "name the spawning tool call" is.

7. **The instrument to settle all of this already exists, and has always recorded
   half the answer — nobody has read it back.** `scripts/spike-81-background-tasks.mjs`
   captures `tool_use_id` on **every** `task_started` at line 163, *before* the
   `local_agent` filter at 167, and persists it into `summary.json` via
   `taskStarted` at line 322. But its console line 170 prints only `task_type` and
   `task_id`, #81's ADR records C3 about the **level** rather than `task_started`,
   and the evidence sink is a `mkdtempSync` temp dir **outside the repo on purpose**
   ("a JSONL of a real turn carries session ids and file contents, and the repo is
   pushed", lines 33-36) — so **no artifact is committed and none survives**.
   Criterion (1) is therefore **capturable-but-unrecorded**, not measured. The
   harness does **not** capture `parent_tool_use_id` at all, so the agent-ownership
   question needs a one-line addition before even a re-run could answer it.

8. **Caveat that must not be smoothed over.** Point 2 rests on a **test fixture**
   asserting the real shape, not on a live measurement. This project's standing
   practice is to measure, and #81 measured the *level*, not `local_bash`'s
   `task_started`. So "a `local_bash` `task_started` carries `tool_use_id` on the
   live CLI" is an **unmeasured premise**, and by this project's own established
   practice it ships as a ticket's **first, blocking acceptance criterion** with a
   specified fallback — not as an assumption.
