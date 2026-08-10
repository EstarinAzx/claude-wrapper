---
target: init
idea: >
  "do what it takes to make #130 ready for agent and yeah go" — the owner's
  answer to the pick-up fork. #130 (rewind a REPLAYED message) has been sitting
  at `needs-triage` by design since #129's leg filed it, precisely so no leg
  would promote it. The owner has now made that call. The run's job is to
  establish what #130 needs in order to be honestly buildable by an unattended
  chain, land that on #130 itself, and fire the chain.
partner: opus                 # anthropic/claude-opus-5
pressure: codex/gpt-5.6-sol
pressure_via: slot:sonnet     # REBOUND — A RESTORE IS OWED ON EVERY PATH
pressure_rationale: >
  Resolved twice. The first pass took `haiku` -> xai/grok-4.5, skipping the
  first non-Claude family (`sonnet` -> opencode-go/kimi-k3) because the archived
  chain-3 record says that Target "died three times on gateway 502/503 and judged
  nothing". The owner then overrode by prose mid-run — "use 5.6 sol as a sonnet
  try to for pressure" — and vibe's own resolution order puts a prose override
  first, so the override wins. `codex/gpt-5.6-sol` is on no family by default, so
  `slot` snapshotted `sonnet` (recorded value: `opencode-go/kimi-k3`) and rebound
  it. Cross-model separation from Partner is preserved.
restore_owed: >
  NO — DONE. `wisp snapshot revert sonnet` ran after both Pressure passes
  finished and before the relay was fired, printing
  `revert sonnet -> opencode-go/kimi-k3 (was codex/gpt-5.6-sol)`, and `wisp
  routing` was re-read to confirm. Ordering was deliberate on both sides: not
  before the agents finished (the Bridge re-resolves the family every turn, so an
  early revert reroutes a live agent mid-task), and not after the spawn (a relay
  leg riding the `sonnet` family would silently have run the whole build on
  gpt-5.6-sol).
max_defer: 12
phase: fired
halted: false
outcome: >
  #130 rewritten with a triage section and eight acceptance criteria across two
  phases, then promoted `needs-triage` -> `ready-for-agent`. NO new issues were
  minted: init's `to-spec`/`to-tickets` tail was substituted, because run verbatim
  it would have created a spec plus slices BESIDE #130 and left #130 itself at
  `needs-triage` — the exact opposite of the instruction. Frontier verified
  non-empty on a second read; the first read came back empty, which is the
  eventual-consistency lag the record already warns about.
defers: 3 added, 4 carried = 7 against max_defer 12, none `reversible: NO` -> no halt.
substitution: >
  init's steps 6-8 are substituted. `to-spec` and `to-tickets` mint NEW issues;
  run verbatim they would duplicate #130 rather than promote it, failing the
  stated ask. The output of this run lands ON #130 — a sharpened body carrying
  acceptance criteria, plus the label move. Slices are minted only if the grill
  establishes that #130 genuinely decomposes, in which case #130 becomes the
  spec and the slices declare it as their blocker.
archive: .claude/vibe-120-129.md   # chain 3's full record, 408 lines, preserved
---

## Decisions

**All seven warrants below were grep-verified as fixed strings (`grep -qF --`)
before they were shown to Pressure. Zero were fabricated, so nothing was
discarded at that step; the two refutations that follow are about whether a real
quote actually *supports* the decision drawn from it, which is the harder and
more useful failure to catch.**

- **D1 — the unmeasured premise must be measured before anything rests on it.**
  Whether the CLI still holds file checkpoints for a conversation reopened later
  is the fact that decides whether the control can honestly be offered at all.
  warrant: "The record's own rule is *build only if measured*"
  @ `.context/decisions/2026-08-05-a-declared-wire-type-is-not-a-callable-route.md`
  · pressure: **STANDS**

- **D2 — the runtime cost of `enableFileCheckpointing` is in scope for #130**,
  not its own ticket. #129 recorded it `UNSCORED` deliberately and assigned it
  here.
  warrant: "Folded into #130." @ `.context/pick-up.md`
  · pressure: **STANDS**

- **D3 — the CLI's own on-disk uuid must still pass `isMessageUuid`.** Being the
  CLI's own value earns it no exemption; the guard is simultaneously the trust
  boundary and the narrowing that lets the value reach the SDK without a cast.
  warrant: "must not hand an arbitrary string to the SDK on the strength of a cast."
  @ `src/shared/message-uuid.ts`
  · pressure: **STANDS**

- **D5 — the FORM of the blast-radius confirmation is settled, the COPY is not.**
  A two-step inline gesture, never a modal or an OS dialog — both anti-modal ADRs
  stand and #129's rewind already ships that shape. What the wider blast radius
  should actually *say* is not in the record.
  warrant: "the second is a renderer-blocking OS dialog and would be the only
  un-designed OS surface in the app"
  @ `.context/decisions/2026-07-31-deleting-a-session-is-scoped-confirmed-and-singular.md`
  · pressure: **STANDS** (the copy half is carried to `## Needs you`)

- **D7 — acceptance ends on the merge gate**, green before squash-merge:
  `npm run typecheck`, `npm test`, `npm run build`.
  warrant: "squash-merged to main, gate green first" @ `.context/overview.md`
  · pressure: **STANDS**

### Refuted twice — both DEFERRED to `## Needs you`

Partner answered both objections and Pressure refuted both again. One rebuttal
round is the cap, so both questions go to the human. **That is the machinery
working, not failing** — an answer neither agent could defend from the record is
exactly the thing that should reach the owner rather than be invented.

**A note on the second Pressure pass, because it changes how much weight the
verdict carries.** It ran **zero tool calls in 16s** — it judged from the prompt
rather than re-reading the files, which its own default-to-refuted-when-uncertain
contract permits but which makes it weak evidence on its own. It is recorded as
holding anyway, on substance rather than authority: its D6 objection makes a
checkable claim — that the record elsewhere measures CLI facts through built-app
IPC harnesses without a GUI driver — and that claim **is true**
(`scripts/spike-105-model-pick-channels.mjs` phase C and
`scripts/spike-108-turn-lifecycle.mjs` phase C both drive the built app over its
own IPC). It read those files in its first pass, which used 8 tool calls.

### The two refutation rounds in full

- **D4 — decompose into a spike then a build?** pressure: **REFUTED** — "The
  cited ADR decides decomposition only for #115's two asks; it does not establish
  a universal spike-first rule, and active-work says #130 already 'has the shape
  and the measurement'." That counter-citation was itself verified: it is a real
  line at `.context/active-work.md:64`. The tension is genuine, because #130 is
  only *partially* unmeasured — #129 measured resume-survival and cross-query id
  recognition, but not checkpoint durability over time.

- **D6 — is a GUI driver required?** pressure: **REFUTED** — "The warrant says a
  GUI turn was necessary for #129's specific end-to-end acceptance criterion; it
  does not make that driver or cost mandatory for #130."

**Round 2 — Partner revised, Pressure refuted both again → DEFER.**

- **D4-revised.** Partner **withdrew** the decomposition claim outright: there is
  no line establishing spike-first as a general rule, and the #115 ADR decided
  only its own two asks. New position — #130 ships as ONE ticket with the
  measurement folded in as a gated phase.
  warrant: "It has the shape and the measurement already" @ `.context/active-work.md`
  (grep-verified) · pressure: **REFUTED** — "A gated phase preserves 'build only
  if measured,' but contradicts D1's stronger requirement that no build ticket be
  written until the shape-deciding premise is measured; putting both in one ticket
  dissolves that separation by relabelling it." → **DEFER**

- **D6-revised.** Partner narrowed from a ticket-type rule to an **evidence-class**
  rule: a fact about the CLI's effect outside the app cannot be corroborated by a
  stub, and a spike drives its own query rather than the app, so for criteria in
  that class a driver is the only instrument left — binding only those criteria,
  not the ticket.
  warrant: "because a stub cannot corroborate a fact about the CLI" @ `.context/overview.md`
  (grep-verified; the surrounding lines do read as an evidence argument rather
  than a ticket-type one) · pressure: **REFUTED** — the passage explains why
  `gui-129` was uniquely necessary for #129's own composer-to-disk criterion, and
  the record elsewhere measures CLI facts through built-app IPC harnesses with no
  driver. → **DEFER**

## Needs you

### Added by this run — three

- [ ] **Does #130 ship as ONE ticket, or as a spike that then files a build?**
      Both agents agree the checkpoint-durability premise must be measured before
      anything rests on it (D1, unrefuted). They could not agree on whether the
      measurement and the build may live in one ticket.
      took: **one ticket, with the build half explicitly GATED** — the leg
      measures first, and may only build if the measurement is green; red means
      report the number, build nothing, file the outcome at `needs-triage`, stop.
      alt: split now — #130 becomes a measurement-only spike that touches no
      `src/` and ends by filing the build ticket with a decided shape (#115's
      precedent, which Partner cited and then withdrew as over-general).
      why: Pressure's objection is that a gated phase dissolves the separation by
      relabelling it. The counter is that D1's *stronger* form ("no build ticket
      written until measured") was Partner's own gloss on the #115 ADR, and
      Partner withdrew that gloss — so the strong form has no standing warrant.
      The default is the reversible one either way: the measurement had to happen
      first under BOTH readings, so nothing is lost if you overturn this.
      reversible: yes
- [ ] **Is a GUI driver mandatory for #130's acceptance?**
      took: **not mandated** — the ticket states the evidence rule instead (a
      criterion that is a fact about the CLI's effect on disk cannot be
      corroborated by a stub) and leaves the instrument to the implementing leg,
      which is correct because the measurement's shape is not yet known.
      alt: mandate a `gui-130.mjs` up front, as #129 did with `gui-129`.
      why: Pressure's point is checkable and checks out — `spike-105` phase C and
      `spike-108` phase C both measure CLI facts by driving the built app over its
      own IPC, with no driver. A driver may still turn out to be the only
      instrument for one criterion; that is a finding, not a premise.
      reversible: yes
- [ ] **What should the blast-radius confirmation SAY?** (D5's open half.)
      Rewinding to message N on a reopened conversation reverts every turn after
      it — a much larger blast radius than the just-sent case #129 ships.
      took: the FORM is settled and not in question — a two-step inline gesture,
      never a modal or an OS dialog, both anti-modal ADRs standing. The ticket
      requires the second gesture to state the counts it is about to revert, and
      leaves the wording to the leg.
      alt: you write the copy.
      reversible: yes

### Carried forward from chain 3 — four

**Unchanged — this run has neither resolved nor
added to these.** The full reasoning for each lives in `.claude/vibe-120-129.md`
under its own `## Needs you`; only the question and the taken default are
restated here, because `.context/pick-up.md` and `.context/active-work.md` both
point at *this* path for the live queue.

- [ ] **Does the acrylic exception reach any pane other than the subagent viewer?**
      took: excepted **that pane only**, enforced by two pins
      reversible: yes
- [ ] **Should `ultracode` and `auto` be reachable at all?**
      took: a five-position slider only; neither mode exposed
      reversible: yes
- [ ] **May the app offer Remote Control?** — the live one. #127 measured it
      REACHABLE and probed it with `enabled: false` ONLY, because enabling it
      bridges a live session to an external service, which is outward-facing.
      took: nothing enabled, nothing built
      reversible: yes (nothing built)
- [ ] **"Edit message, resend" ships as REFILL, not a true edit.**
      took: refill the composer; send as a NEW turn
      reversible: yes

## Log

- [gate] Baseline **measured, not cited**: `npm run typecheck` clean, `npm test`
  **1277 passed / 84 files**, exit 0, 67s. `.context/` claimed exactly this, so
  the claim was accurate — but every acceptance criterion this run writes ends on
  that gate, and a cited number is not a measured one.
- [boot] State file re-seeded for chain 4. Chain 3's file archived to
  `.claude/vibe-120-129.md` rather than resumed: its `phase: fired` means that run
  *completed*, and vibe's resume rule exists for a crash mid-run. Resuming a
  finished phase would have been a literal reading of step 1 against its own
  purpose. The four open owner calls were carried forward so the `.context/`
  pointers still resolve.
