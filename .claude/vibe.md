---
target: rulings+triage
idea: >
  Resolve every open issue on the tracker without the owner: rule the three
  ready-for-human design questions (#138 type scale, #139 prose/label weight
  pair, #140 mint side-stripe against the ban), triage the nine needs-triage
  follow-ups (#141-#149) into an agent-ready queue, then fire the execution
  chain with gauntlet chained behind it.
partner: opus                 # anthropic/claude-opus-5
pressure: codex/gpt-5.6-sol
pressure_via: sonnet          # first non-Claude family in live `wisp routing`
pressure_rationale: >
  Resolved by vibe's own order, run live this session: no prose override on the
  invocation, no `pressure:` carried in a fresh file (the prior run was archived
  to `.claude/vibe-131.md`), so the first non-Claude family in `wisp routing`
  wins — `sonnet` -> `codex/gpt-5.6-sol`. NOTE the route MOVED since the #131
  run, which recorded `sonnet -> opencode-go/kimi-k3`. Re-resolved rather than
  read off the archived state file, per the standing rule that a route written
  into a state file is stale evidence. No slot rebind needed, so no restore owed.
restore_owed: NO — no slot rebind was needed.
max_defer: 12
phase: fired
halted: false
tickets: >
  Twelve at ready-for-agent: #138 #139 #140 (the three rulings, relabelled from
  ready-for-human) and #141 #142 #143 #145 #146 #147 #148 #149 #150. #144 stays
  needs-triage deliberately, carrying the forcing-mechanism question; its settled
  half was split off as #150.
bar: .gauntlet/bar/           # README.md present, owner-confirmed 2026-08-10
autonomy_grant: >
  The owner invoked this run with "handle all the ready for human and the triage
  ... dint keep me in the loop i will bne cooking food". That is the standing AFK
  autonomy grant: it removes OWNERSHIP as a ground for deferring, but it does NOT
  remove the need for a warrant. So a Partner `DEFER` here does not park the
  question — it becomes a decision taken under the grant, with the most
  reversible option chosen and the alternative recorded so the owner can overturn
  it cheaply. Entries below are therefore logged under `## Decided under grant`
  rather than `## Needs you`. An irreversible call would still halt.
deviation_from_preset: >
  vibe's stock target is `init` and this is not that. The machinery is run
  unchanged — Partner cites-or-defers, every warrant is grepped as a fixed
  string, Pressure attacks cross-model, one rebuttal round only — but it is
  applied to twelve open tracker issues instead of to a raw idea. Recorded
  openly rather than passed off as a stock run.
---

## Decisions

<!-- appended per issue: <one line> — warrant: "<exact quote>" @ <path> · pressure: STANDS -->

### The twelve tracker decisions

Every warrant below was **grepped as a fixed string and verified verbatim** —
12/12, zero fabrications. Pressure then attacked all twelve and returned
**REFUTED 12/12**, which is treated as low-information *as a filter*: an adversary
instructed to default to REFUTED when uncertain refuting everything is that
instruction's expected failure mode, not twelve findings. Each objection was
weighed on merit. Two changed a decision outright; seven became hard constraints
written into the ticket; three were noted and did not bite.

| # | Decision | Warrant verified @ | Pressure's effect |
|---|---|---|---|
| 138 | Restrike markdown headings onto the one ladder; document the rungs with each role stated; retire/re-point `--fs-display` | `"Scale ratio ~1.15, fixed rem-equivalents, no fluid type."` @ DESIGN.md | Constraint: no blanket documenting of drift; each new rung justified or removed |
| 139 | **Bring the tool-card label to 400**; emphasis carried by size and colour | `"Weights: 400 body, 600 app name and bubble-less emphasis."` @ DESIGN.md | **CHANGED THE DECISION** |
| 140 | Keep the stripe; named scoped exception in #125's form | `"One named exception to the glass ban, and its scope is one pane"` @ DESIGN.md | Constraint: #125 supplies the method, the grant supplies the authority |
| 141 | ready-for-agent; verify `gui-93` is already covered, then sidecar build-requirement for `gui-75` | `"build-artifact (`gui-75`, `gui-93` read `out/`, and the gate"` @ run-desktop/SKILL.md | Constraint: a stale `out/` must not satisfy the assertion |
| 142 | ready-for-agent; pin the fixture workspace name | `"made `titlebar.png` byte-identical"` @ .context/decisions.md | Constraint: **clean-if-stale, never refuse** |
| 143 | ready-for-agent, driver-first; traverse from the transcript | `"driver that depends on app state a user can change"` @ the premise ADR | Constraint: verify AFTER #148 so the fix is the driver's, not the rail's |
| 144 | **stays needs-triage**; settled half split to #150 | `"**Gate is the full one:**..."` @ .claude/relay-leg.md | Constraint: the split may not ship as green-looking full coverage |
| 145 | ready-for-agent; accept the quarantine, named release step | `"build only if measured"` @ .context/decisions.md | Constraint: the phase may **not** report clean green while uncovered |
| 146 | ready-for-agent; leftovers, gitignore and delete | `"The DOM assertions carry the guarantee"` @ the blank-capture ADR | Constraint: producers fixed and consumers checked BEFORE deletion |
| 147 | ready-for-agent; private profile by default | `"Isolation is a **property of the launch**"` @ the batch-instrument ADR | Constraint: the `gui-79`/`gui-110` opt-out gets its own DEDICATED profile, not the global one |
| 148 | ready-for-agent; fixture the sessions list in main | `"REPLACED IN MAIN with a fixture list, exactly as"` @ inspect.mjs | Constraint: keep real-session listing covered somewhere else |
| 149 | ready-for-agent; **bar keeps an independent list + a drift test** | `"the single definition of the driver set imported by both"` @ .context/decisions.md | **CHANGED THE DECISION** |

**The two decisions Pressure reversed, because they are the ones most worth
re-examining if any of this turns out wrong:**

1. **#139.** Partner ruled "accept 1.208 as the house pair". Pressure found the
   textual contradiction both prior passes missed: *"600 ... bubble-less
   emphasis" directly contradicts the claim that transcript emphasis is not
   carried by weight.* `DESIGN.md` licenses 600 for exactly two things, the app
   name and bubble-less emphasis, and **a tool-card label is neither**. So the
   off-spec element is the label's 600, not the prose's 400. The ticket now
   carries a verify-first criterion because this reading, while textual, is a
   reading.
2. **#149.** Partner ruled "derive the surface list from `SURFACES`". Pressure:
   *"deleting a driver entry would silently delete the bar obligation. A quality
   specification should not inherit omissions from the implementation it is
   supposed to police."* Decisive. The bar is a standard; generating it from the
   code inverts which one polices which. Now: `SKILL.md` may derive, the bar keeps
   its own list, and a test fails when they disagree.

- **gauntlet owner call 14 (the stop signal) — the criterion is NOT touched.**
  pressure: REFUTED TWICE, and both refutations were accepted rather than argued
  down. Round 1 killed a proposal to replace the `BAR WINS`/`YOURS WINS` contest
  with a threshold read of `bar_win`; round 2 killed the fallback of keeping the
  criterion but raising to N=3 critics with majority. The decisive lines, in
  Pressure's words: *"Changing success criteria after five waves of failure is
  plainly self-serving post-hoc goalpost movement"*, and on the fallback,
  *"A 2-1 majority on byte-identical pixels launders disagreement into false
  decisiveness; correlated critics can reproduce the same bias three times."*
  **Outcome under the contract: one rebuttal round was spent, it still refuted,
  so this DEFERS — and under the AFK grant a defer takes the most reversible
  default rather than parking.** Most reversible = change nothing. So option
  **(a), verdict movement as written**, stands untouched: same three-state
  verdict, same `plateau >= 3`, N=1 critic, no new closing rule. The instrument
  the run has is the instrument the next run uses.
  The owner's genuine choice between (a), (b) and (c) is NOT resolved by this and
  stays open — it is restated under `## Needs you`. What is resolved is only that
  an agent may not settle it by redefining the target after losing to it.

- **Pressure's sequencing objection is ACCEPTED and it reshapes the fire step.**
  *"While the global type-scale clause remains open, every per-surface verdict is
  confounded, so restarting before its ruling lands cannot yield interpretable
  surface measurements."* `bar_win` requires *"one type scale holds across all of
  them"* and the app currently paints five rungs against three documented (#138)
  plus a second em-based scale for markdown headings. That clause gates every
  surface at once, so an **immediate** gauntlet restart measures nothing.
  It does not bite on a **chained** restart, which is what is actually being
  fired: `ticket-loop` drains the queue — including #138's fix and #149's stale
  surface list — and only then does `then:` fire gauntlet. The confound is
  resolved by queue ordering rather than by argument. This is why gauntlet is
  chained behind the queue rather than run now, and it is the reason to state on
  the ticket.

## Decided under grant

<!-- Partner deferred, the record held no warrant, and the AFK grant says decide
     anyway. Most reversible option taken; alternative recorded. -->

## Needs you

- [ ] **Do the 35 committed wave captures need their git history rewritten, or is
      fixing forward enough?** The repo is public and the captures are already in
      `origin/main`. What is actually rendered is a Windows username in a fixture
      temp path plus a session count — verified on wave 5, see the boot log — not
      the hundred real project names #148's text implies.
      took: **fix forward only.** #148 makes the rail fixture-only so future
      captures are clean; history is left alone and no force-push happens.
      alt: purge `.gauntlet/waves/` from history and force-push.
      why: not ownership — this run holds an AFK grant that removes ownership as
      a ground for deferring. It is **irreversibility**. A history rewrite on a
      public repo with a force-push is destructive and outward-facing, which is
      the one class the grant does not cover. The reversible option was available
      and was taken, so nothing halts.
      **reversible: NO** (the alternative is; the default taken is not the risk)

- [ ] **gauntlet owner call 14, restated and still yours: (a) verdict movement as
      written, (b) verdict movement OR three straight waves of unanimous SAME on
      the improvement axis, or (c) is `BAR WINS` against Linear simply the correct
      permanent answer for these five surfaces?**
      took: **(a), unchanged** — see `## Decisions`. Not because (a) was judged
      best, but because the two alternatives an agent could reach were both
      refuted cross-model as post-hoc goalpost movement, and "change nothing" is
      the reversible floor.
      alt: (b) or (c), both of which are genuinely open. Pressure's own closing
      position argues for (c): *"accepting (c) now is no less empirical than
      paying to manufacture a more authoritative-looking repetition."*
      why: this is the one question the previous run called *"the single most
      valuable thing this run produced"* and *"a leg cannot answer this."* The AFK
      grant removes ownership as a ground for deferring, so this run DID attempt
      it — twice, cross-model — and was refuted twice. That is a warrant problem,
      not an ownership problem, and the grant does not manufacture warrants.
      reversible: yes — the next gauntlet run is bounded, and overturning this
      changes only when that run stops, not what it built.

## Log

- [boot] Archived the completed #131 run to `.claude/vibe-131.md` (`phase: fired`,
  chain 6 drained its queue and stopped correctly). Verified the copy byte-identical
  before replacing. Seeded fresh rather than resumed, because resuming a `fired`
  phase would re-fire a chain that already finished.
- [boot] Bar verified present WITH `README.md` — owner-confirmed, so gauntlet is
  eligible to chain behind the queue rather than being left for a session that
  will be long dead by then.
- [boot] Pressure Target resolved live: `sonnet` -> `codex/gpt-5.6-sol`.
- [round 1] **A 0-BYTE TRANSCRIPT IS NOT A DEAD AGENT — this run diagnosed one
  and was wrong.** Partner's transcript file sat at **0 bytes for 11 minutes**
  while Pressure's showed 21KB across two completed round trips. That was read as
  a silent death and two replacement Partners were spawned. **Partner then
  returned normally** with all twelve blocks: 12.5 minutes, 40 tool calls, 194k
  tokens, every warrant verbatim. The transcript only flushes at completion, so
  **"no bytes yet" and "died on spawn" are indistinguishable by file size** — the
  size-polling check used here cannot tell them apart and should not be trusted
  to. The two replacements were killed unused the moment the original landed;
  picking between two Partners' answers is the "two agents talk each other into
  anything" failure the preset exists to prevent.
  Cost of the error: two wasted spawns. Cost had it gone unnoticed: none, because
  **unverified is not refuted** — the questions were re-run rather than dropped,
  which is the correct handling whether or not the agent was actually dead.
- [boot] Partner cast on `opus`, hydrated on DESIGN.md, PRODUCT.md, `.context/`,
  `docs/adr/`, the bar README and the run-desktop SKILL, and handed all twelve
  issues with instructions to read each body itself.
- [boot] **#148's exposure claim was checked against the pixels and it is
  OVERSTATED — this correction belongs on the ticket.** The issue says *"Two of
  the ten bar captures contain real session titles and a real filesystem path"*.
  Chased because the repo is **PUBLIC** (`gh repo view` -> `isPrivate: false`)
  and 35 wave captures under `.gauntlet/waves/` are committed AND present in
  `origin/main`, which would have made this a live disclosure rather than a
  future risk. Opened `.gauntlet/waves/5/sidebar.png` rather than trusting the
  text: the rail is scoped to **"This project"**, so it renders the ONE fixture
  row, a fixture path under `AppData\Local\Temp\inspect-...`, and the 953 foreign
  sessions as a **count** — not as titles. #148 measured `aside.sidebar`'s
  **innerHTML**, where `.session-groups` holds 6427px against a 658px viewport;
  those ~100 rows are below the fold and never reach the pixels.
  **Verified on wave 5 only** — the other 34 captures are not audited, and that
  audit is part of #148's shape rather than a claim made here.
  NOTE the exposure finding is unchanged by the Partner failure below; it was
  measured directly from the pixels, not sourced from an agent.
  Net: what is public is a Windows username in a temp path plus a session count.
  Real but minor. Taken: **fix forward** (make the rail fixture-only so the
  instrument's own header claim becomes true). NOT taken: rewriting git history
  on a public repo — irreversible, outward-facing, and squarely the owner's call,
  so it is recorded under `## Needs you` rather than done. Nothing irreversible
  is performed by this run, so the halt guard is respected without halting.
