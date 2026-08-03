---
target: init
idea: "do whatever it takes to have its gui look and have like a professional grade ui"
partner: opus
pressure: codex/gpt-5.6-sol
pressure_via: sonnet
max_defer: 12
phase: fired
halted: false
relay: FIRED after the owner's 2026-08-04 grant. The first pass declined it (no
  `ready-for-agent` ticket existed); the grant made #93 and #94 fileable.
---

## The seed, and how much of it is the owner's

The owner typed the idea verbatim and went AFK, invoking
`/preset pick-up -> rehydrate -> /preset vibe init "<idea>"` in one line. So the
**subject** (the GUI's quality) and the **route** (vibe init, unattended, ending
in filed tickets and a relay) are both theirs.

Everything else — what "professional grade" *means* here, which surfaces are
short of it, and what may change to get there — is not in the seed. It comes
from the record with a quotable line, or it defers.

## The structural problem this run has to solve first

"Make the GUI look professional" is, on its face, **the exact shape the record
says an agent may not decide**. Two prior vibe runs already parked titlebar
aesthetics and Tailwind's fate as the owner's.

**CORRECTION, made mid-run by Partner and verified by me.** An earlier draft of
this section asserted that
`2026-07-31-a-theme-is-a-re-hue-not-a-re-design.md` says "no measurement can
answer a taste call", pressure-tested STANDS — inherited from a prior run's log.
**That ADR contains zero instances of the word "taste"** (`grep -c -i taste` →
0). The line it actually carries is "That is eyeballed in a real window, never a
driver screenshot", which is a claim about **instruments, not about ownership**.
The paraphrase was stronger than its source and is retired here. It is recorded
rather than quietly deleted because a later leg reading the prior run's log will
meet the same false paraphrase.

Working thesis, to be warranted by Partner and attacked by Pressure rather than
assumed: **taste and craft are separable here.**

- **Taste** — which accent, how many titlebar controls, mint vs amber. Owner's.
  Defers.
- **Craft measured against a written standard** — `DESIGN.md` exists, the app
  has a canonical reference image, and the record already contains a worked
  example of exactly this move: the 2026-07-31 titlebar run took an aesthetic
  complaint, **measured** it, falsified its stated rationale ("each button eats
  drag region" — FALSE), and surfaced an unrelated real defect (`.session-title`
  cannot truncate) that shipped as **#72**.

If the thesis holds, this run files craft defects and defers taste. If Pressure
kills it, the run halts with a sharp list rather than a fabricated restyle.

## Measured this run (read-only, `file:line` on every claim)

Recorded separately from the decisions, per #84's lesson that a ticket's stated
implication can be wrong even when its observation is right.

### The instrument: DESIGN.md is prescriptive, and it is NEWER than the code it judges

`DESIGN.md` does not merely describe taste — it states rules that can be
*violated*: "All transitions 150ms, entries 200ms, ease-out
cubic-bezier(0.22, 1, 0.36, 1). **The full set, nothing else**"; a `## Bans in
force` section; "Mint accent ≤10% of surface"; "Never `#000`/`#fff`"; exactly
three type sizes and two weights.

**Pressure's "stale documentation" objection is testable, and it was tested.**
`DESIGN.md` last moved **2026-07-31** (`1769aa4`). The two files holding the
off-spec motion — `agent-map.css`, `subagent.css` — last moved **2026-07-30**
(`3223127`). The doc is **newer than the deviations**, so they cannot be
dismissed as the doc having gone stale. (This does not prove the deviations are
unintended — only that the stale-doc defence does not reach them.)

### Motion — five off-scale values against a rule reading "nothing else"

| site | value | in DESIGN.md? |
|---|---|---|
| `chat.css:121` | `typing-pulse 1.2s ease-in-out` | **yes** — "staggered 1.2s opacity pulse" |
| `chat.css:125,129` | `animation-delay: 0.15s` / `0.3s` | staggering is documented; `0.15s` is `150ms` in other notation |
| `agent-map.css:65` | `subagent-pulse 1.4s ease-in-out infinite` | **no** |
| `rails.css:550` | `subagent-pulse 1.4s ease-in-out infinite` | **no** |
| `subagent.css:84` | `subagent-slide 180ms var(--ease)` | **no** |

Easing census: the canonical `cubic-bezier(0.22, 1, 0.36, 1)` is authored
**once**, at `tokens.css:68` as `--ease-snap` (aliased `--ease` at `:104`) —
so token discipline is good. `ease-in-out` appears 3×, all on infinite pulses,
where a symmetric easing is arguably deliberate. **Treated as a finding, not a
defect** — Pressure's "intentional exception" objection reaches these.

### Type — a third weight and a fourth size, each appearing exactly once

DESIGN.md names three sizes (15/13/11) and two weights (400/600).
- `composer.css:112` — **`font-weight: 500`**, the only 500 in the app (600 ×13, 400 ×2).
- `subagent.css:117` — **`font-size: 20px`**, a raw literal off the token scale entirely (`--fs-*` used 49×).
- `markdown.css:68,72` — `1.25em` / `1.1em`; DESIGN.md's Type section is **silent** on markdown heading scale. A gap in the doc, not a violation.

### Focus ring — the strongest finding, and the one that fits the surviving thesis

- `shared.css:43-53` is an established focus-ring group with a comment naming
  **drift** as the failure mode it exists to prevent ("the focus ring [was]
  written out 6 times, so a control added later inherited whichever copy its
  author happened to be looking at"). It lists **seven** selectors.
- **Seven** CSS files author `:focus-visible` rules (17 in total).
  **`titlebar.css` authors zero, and no titlebar selector appears in the shared
  group** — it is the only component file owning interactive controls with no
  focus rule at all.
- The titlebar has **8 real `<button>`s**, all with `aria-label`
  (`Titlebar.tsx:34,68,84,103,123,202,212,230`).
- `base.css:7-13` sets only `box-sizing`/`margin`/`padding` — **there is no
  global `outline: none`.** So these controls are **not** unfocusable; they wear
  **Chromium's default ring** instead of the app's designed one. Stated honestly:
  this is a consistency and surface defect, not an accessibility blackout.
- DESIGN.md already supplies the reason that generalises, in the app's own
  words, about the sibling case: "never Chromium's default bar, which is opaque
  Windows chrome and breaks the acrylic."
- **Nothing pins it.** Zero focus assertions across `tests/` and all 22 drivers.

### Focus ring — MEASURED IN THE REAL APP, and my first framing was WRONG

A throwaway probe (`scripts/probe-focus.mjs`, deleted after reading) launched the
built app and walked real `Tab` presses — not `el.focus()`, which does not
reliably match `:focus-visible`. It read the live stylesheet for declared rules
and `getComputedStyle` at each stop.

**Declared:** 12 `:focus-visible` rule groups exist, in **three mutually
different treatments** — (a) wash + inset hairline, (b) inset hairline alone,
(c) `outline: 2px solid var(--mint)` at **three different offsets** (1px, 2px, 3px).

**Rendered:** every control the walk reached — the titlebar's five reachable
buttons **and** the Welcome screen's `pick-folder-btn` — rendered
`outline: auto 0.8px rgb(229, 151, 0)`, Chromium's default ring, `box-shadow: none`.
Authored rings on those stops: **zero**.

**Two corrections to my own earlier framing, both from the instrument:**

1. **"The titlebar is uniquely affected" is FALSE.** `pick-folder-btn` is not in
   the titlebar. Pressure independently found the same and more —
   `.model-pill`, `.model-menu-item`, `.command-option`, `.attach-btn`,
   `.send-btn`, `.sidebar-toggle` also carry no focus rule. The finding is a
   **systemic gap**, not an odd-one-out.
2. **"8 titlebar buttons" is only true with a project open.** The walk reached
   **5**; three dock toggles do not render until a folder is picked.

**And the remedy is NOT available to an agent — Pressure refuted it twice and was
right both times.** There is no single app ring to "join": three treatments
exist, and `shared.css:1-16` scopes its groups by its own text to "repeated
list/menu/dock/card patterns", which does not reach titlebar chrome. Picking a
treatment for the titlebar **chooses a new titlebar appearance, inside the parked
owner call**. Diagnosis is agent work; this remedy is the owner's.

### The accent budget — the binding standard has drifted from the code

DESIGN.md: "Mint accent ≤10% of surface, **spent only on**: logo mark, assistant
avatar, send button, list markers, typing dots." A closed list of five.

Measured: mint is painted in **9 component files, ~45 references** — including
`agent-map`, `tool-card`, `appearance`, `subagent`, `markdown`, `rails` and
`titlebar`, none of which is on the list. DESIGN.md last moved **2026-07-31**,
by which date every one of those surfaces already existed — so the clause was
**already descriptively false when it was last rewritten**.

The ≤10% half is **not measurable by any instrument available here**: it is a
proportion of rendered surface, and the record forbids judging appearance off a
capture ("a capture cannot see the right ~20% of the layout").

**This is the run's most consequential finding.** Partner warranted that
DESIGN.md **governs** ("The design doc is newer, more specific … so it governs").
A governing standard whose most objectively-checkable clause no longer describes
the app means later design work is being decided against a false map. Whether
the fix is to amend the doc or to pull mint off those surfaces is **squarely a
design call**.

### `.command-row-btn` — I killed this, then Partner revived it, and Partner is right

**Superseded below. Kept because the wrong reading is the tempting one.**

### `.command-row-btn` — my first reading, and why it was wrong

`.context/active-work.md:818` carries "give `.command-row-btn` its `font:
inherit`" as an unspec'd candidate, while `:745` calls it "deliberately
excluded". The contradiction resolves in the CSS, and **against filing it** —
`rails.css:149-152`: "adding it would repaint `.command-row-desc` … **That is a
visual change, not a refactor, so it stays out and stays flagged.**"

I concluded the exclusion was reasoned *against ever fixing it*, and dropped it.

**That was wrong, and Partner caught it by reading a third source I had not.**
`.context/decisions/2026-07-30-tailwind-here-is-a-token-system-not-a-utility-system.md`
calls it, in the ADR's own words, "one latent **bug** left **unfixed and
flagged** rather than smuggled into a refactor". `unfixed and flagged` is a
**deferral, not a decision against** — and the `deliberately excluded` landmine
scopes to the **#79 dedup refactor**, whose contract was zero visual change, not
to eternity. `active-work.md:818` still carries the fix as owed.

**So it is a live, recorded bug whose remedy the record NAMES and whose blast
radius is already MEASURED** (exactly one child, `.command-row-desc`, moving
from the UA button font to `--font`). That is the one thing this run found where
the remedy was decided by the record rather than by me.

**Method note, recorded because it is the reusable lesson:** I killed this after
reading two sources (`rails.css`, `active-work.md`) that agreed with each other.
The third source reversed both. Two agreeing sources are not a quorum when a
third exists.

### Bans — clean

No `#000`/`#fff`, no `gradient` anywhere in `styles/`. Em-dash hits are in TSX
**comments**, not user-facing copy. No violation found.

## OWNER GRANT, given live after the first report — real input, not proxied

The owner read the findings and answered verbatim:

> "just whatever it is whats a gap or whatsoever address it and so you relay can
> be eligible just do it im gonna sleep dont disturb me"

**What it authorises, read strictly:**

1. **Addressing the gaps** this run measured — the six calls below stop being a
   reason to defer.
2. **Making the relay eligible** — i.e. `ready-for-agent` tickets are wanted,
   explicitly.
3. **Silence** — do not notify.

**What it does NOT authorise**, and this is the whole discipline of an AFK grant:
it removes *ownership* as a ground for deferring; it does **not** remove the need
for a **warrant**, and it does not license anything irreversible. Every call
below still takes the most reversible option and still cites a reason. Nothing
here touches schema, API, money, deletion, auth or anything published outward.

**Standing constraints NOT lifted, because the grant does not reach them:** no
new titlebar *control* (the count is unchanged by every ticket — a focus style is
not a control), no `#000`/`#fff`, no light theme, no lightness/alpha movement in
a palette, no component-scoped scrollbar rule, no pin retired to fit.

## Decisions

Three survived attack. Everything else conceded and moved to `## Needs you`.

- **The subject is authorised; the remedies are not.** Warrant: "The UI is the
  product: the whole reason it exists is to present a Claude Code session as a
  calm, legible chat instead of terminal scrollback." @ `PRODUCT.md` · pressure:
  **STANDS**.
- **`DESIGN.md` is binding, not advisory.** Warrant: "The design doc is newer,
  more specific, and was rewritten by #69 for this purpose, so it governs" @
  `.context/active-work.md`, plus `tests/scrollbar.test.ts:5` already enforcing a
  `DESIGN.md` sentence mechanically · pressure: **STANDS**.
- **A `ready-for-human` findings ticket is the right container.** Warrant:
  "**#86** — open, `ready-for-human`, **not loop work**: findings + five owner
  calls." @ `.context/pick-up.md` · pressure: **STANDS** (attacked as scope creep
  and as a catch-all; held — it changes no pixel and matches #86 exactly).

**Refuted and dropped, all three correctly:**

- ~~Taste and craft are cleanly separable, so an agent may fix any measured
  `DESIGN.md` deviation.~~ **REFUTED.** A deviation may be stale documentation,
  an intentional exception, or an unresolved choice — and *"objective diagnosis
  does not make the remedy taste-free"*. That sentence governed the whole run.
- ~~The titlebar uniquely lacks the app's focus ring, so adding it joins an
  established sibling rule.~~ **REFUTED twice.** The gap is systemic, there is no
  single ring to join, and `shared.css`'s own text scopes its groups to
  list/menu/dock/card patterns — so any choice picks a new titlebar appearance
  inside the parked owner call.
- ~~An observational conformance driver reports drift without deciding
  anything.~~ **REFUTED by both agents independently.** "There is no expected
  driver failure any more… any red is now a real regression" forecloses landing
  one red, and softening it to pass is foreclosed too.

## Taken under the 2026-08-04 grant

Five of the six below were resolved after the grant. **The `## Needs you`
section is history from here on, not a queue** — a new *reason* reopens one of
these; a re-read does not.

- **Call 1 (focus treatment) → TAKEN, filed as #93.** Warrant: the app already
  carries three treatments, and the split is readable from the code —
  wash+hairline for transparent rows on glass (`shared.css:43-53`, whose comment
  states the translucency rationale), **hairline-only for controls with their own
  fill** (`rails.css:311`, `:596`), mint outline for card controls. Assigned by
  **measured background**, not by taste.
- **Call 6 (`.command-row-btn`) → TAKEN, filed as #94**, with a *better* remedy
  than the ADR's: pin the three children's `line-height` first, then
  `font: inherit`, which neutralises the vertical shift Pressure found.
- **Call 4 (type outliers) → PARTLY WITHDRAWN.** `.subagent-drawer-close`'s
  `20px` is a **glyph-sizing rule** (`line-height: 1`), not body type — my
  finding was overreach and Pressure agreed. `.model-menu-item`'s
  `font-weight: 500` stands as a real outlier, untaken.
- **Call 2 (accent clause) and Call 3 (motion) → NOT TAKEN, despite the grant.**
  Pressure refuted the doc-reconciliation ticket: "Updating the governing
  standard to mirror every current deviation launders drift … Reference counts do
  not prove intended accent spend." **That corrects my own evidence** — ~45
  counts *sites*; the rule is about *surface proportion*. The drift is real, the
  evidence was overstated, and the honest remedy is too large and too
  taste-laden to take unattended. **A grant is permission to decide, not
  permission to decide badly.**
- **Call 5 ("professional grade") → STILL THE OWNER'S.** No instrument available
  unattended can answer it. The grant cannot manufacture an instrument.

## Needs you (superseded — see `## Taken` above)

Six. **All reversible — none flagged `reversible: NO`, so no halt fired on that
ground** (count 5, `max_defer` 12). Every one of them is a *remedy* question;
the *diagnosis* behind each is measured above and is not in doubt.

- [ ] **Which focus treatment covers the controls that have none — including the titlebar?**
      took: NOTHING CHANGED. Filed as a finding only.
      alt: extend `shared.css`'s wash+hairline group · extend the mint-outline
      treatment · author a third for chrome · decide the gap is acceptable
      why: measured in the real app — titlebar's 5 reachable buttons and
      `pick-folder-btn` render Chromium's default ring; Pressure additionally
      found `.model-pill`, `.model-menu-item`, `.command-option`, `.attach-btn`,
      `.send-btn`, `.sidebar-toggle` uncovered. **There is no single ring to
      join**: three treatments exist at three different offsets, and
      `shared.css:1-16` scopes its groups by its own text to "repeated
      list/menu/dock/card patterns", which does not reach titlebar chrome. So
      any choice here **picks a new titlebar appearance, inside the parked
      titlebar owner call**. Partner searched the whole corpus and found **no
      accessibility commitment and no focus-indication rule anywhere** — zero
      `focus-visible` in `tests/` or in all 24 drivers. This measurement is new
      information the record does not contain.
      reversible: yes

- [ ] **DESIGN.md's accent clause is stale — amend the doc, or pull mint back?**
      took: NOTHING CHANGED.
      alt: rewrite the clause to describe the app · remove mint from surfaces
      not on the list · keep the list aspirational and say so
      why: the doc names a **closed** list of five spends; mint is painted in
      **9 component files, ~45 references**. Every one of those surfaces existed
      on 2026-07-31 when the clause was last rewritten, so it was already false
      when written. Partner warranted that DESIGN.md **governs** — a governing
      standard that no longer describes the app is the highest-leverage thing
      here, and which way to reconcile it is a design call. The ≤10% half is
      **not measurable by any instrument available unattended**.
      reversible: yes

- [ ] **Are the five off-spec motion values intentional exceptions?**
      took: NOTHING CHANGED.
      alt: conform them to 150/200ms · amend "nothing else" to admit pulses ·
      document them as exceptions
      why: `agent-map.css:65` and `rails.css:550` (`subagent-pulse 1.4s
      ease-in-out`) and `subagent.css:84` (`subagent-slide 180ms`) are outside a
      rule reading "The full set, nothing else". The doc is **newer** than those
      files, so "stale doc" does not excuse them — but Pressure's
      "intentional exception" objection does reach them, since a symmetric
      easing on an infinite pulse is a defensible choice. Undecidable from the
      record.
      reversible: yes

- [ ] **The two type outliers — conform or document?**
      took: NOTHING CHANGED.
      alt: move them onto the scale · widen the documented scale
      why: `composer.css:112` is the app's only `font-weight: 500` against a doc
      naming two weights; `subagent.css:117` is a raw `font-size: 20px` off a
      three-step token scale used 49× elsewhere. Partner **DEFERred on ownership
      of the type scale specifically** — DESIGN.md documents the values but no
      line says who may amend them.
      reversible: yes

- [ ] **What does "professional grade" mean concretely here?** — the seed's own question.
      took: NOTHING CHANGED. No restyle attempted.
      alt: name specific surfaces you find short · accept the record's bar as
      the definition and audit against it · commission an `impeccable` pass on a
      named surface
      why: **this is not answerable by any instrument available to an unattended
      agent, by this project's own rules.** The record forbids judging
      appearance off a capture ("a capture cannot see the right ~20% of the
      layout"), says "No test can say whether a theme looks good", and puts the
      judgement in "a real window". The closest the record comes to a definition
      is PRODUCT.md's "Fluent in … VS Code, Linear …; **expects that bar of
      polish**" — named products, not a criterion. Naming which surfaces miss
      that bar needs your eyes.
      reversible: yes

- [ ] **`.command-row-btn`'s `font: inherit` — worth its TRUE cost?**
      took: NOTHING CHANGED. Deferred rather than filed.
      alt: take the multi-element vertical shift · leave it flagged · give the
      three children explicit `line-height`s first, then fix the parent
      why: I filed this as buildable, then withdrew it. The ADR calls it "one
      latent **bug** left **unfixed and flagged**", names the remedy, and
      measures the blast radius as one child. **The ADR's measurement is
      incomplete**: `font: inherit` is a *shorthand* that resets `line-height`
      too. `rails.css` has zero `line-height` declarations, `body` sets `1.6`,
      and a `<button>`'s UA default is `normal` — so all **three** children shift
      vertical metrics, not one. Correction found by Pressure after I had
      accepted the ADR's figure. Still a real deferred bug, just dearer than
      recorded.
      reversible: yes

## Log
- [boot] Fresh file for a new idea. Prior run (`phase: fired`, the #86–#89
  measurement batch) was terminal — its relay chain closed on an empty queue —
  so this is a boot, not a resume. Archived to `.claude/vibe-2026-08-02.md`,
  matching the five existing dated archives. #86 is still open and that file is
  its provenance trail, which is why it was moved rather than overwritten.
- [boot] Frontier verified live, not trusted from prose: `gh issue list --state
  open --label ready-for-agent` → **empty**; two open issues (#86, #91) both
  `ready-for-human`. `main` = `f1e9dcc`, **0 ahead of origin**, no open branches.
- [boot] Destination DETECTED as GitHub (`gh` authed, `origin` →
  EstarinAzx/claude-wrapper). No AskUserQuestion fired. `.context/` present,
  `docs/agents/` present → neither conditional offer is owed.
- [boot] Pressure resolved by rule 3 against live `wisp routing` (first
  non-Claude family): `sonnet` → `codex/gpt-5.6-sol`. Already a family route, so
  **no `slot` rebind and no restore owed** on any halt path. Spawned lean
  (`cavecrew-reviewer` toolset) with a format override — the 2026-07-31 run
  recorded `general-purpose` overflowing that Target with MCP schemas.
- [round 1] Partner answered **8 of 8** — 6 warranted, Q3b and part of Q6
  DEFERred. It also **corrected this file**: my claim that
  `a-theme-is-a-re-hue-not-a-re-design.md` says "no measurement can answer a
  taste call" was false (`grep -c -i taste` → 0). Inherited from a prior run's
  log; retired in `## The structural problem` above rather than deleted.
- [round 1] Pressure **REFUTED the central thesis** on first contact, correctly,
  and the sentence that governed the rest of the run came from it: *"objective
  diagnosis does not make the remedy taste-free."*
- [probe] Built and drove the **real app** — a throwaway Tab-walk probe reading
  `getComputedStyle` at each stop, since `el.focus()` does not reliably match
  `:focus-visible`. It **corrected me twice** (the gap is systemic, not
  titlebar-only; 5 reachable buttons, not 8). Deleted after reading, per the
  `gui-72` precedent.
- [round 2] Partner answered Q9–Q12; **declined a trap** by refusing to cite this
  very file back at me as a warrant ("reading my own words back as if they were
  yours"). It **revived** `.command-row-btn` from a third source I had missed,
  and **killed** my conformance-driver proposal from the record.
- [round 2] Pressure then **refuted the revived ticket on a CSS fact none of us
  had measured** — `font: inherit` is a shorthand that resets `line-height`, so
  the ADR's own stated blast radius is understated. Verified independently
  before accepting. That correction is the run's most concrete artifact.
- [measure] Swept the stylesheet against `DESIGN.md`'s checkable clauses: motion
  inventory, type scale, accent spend list, ban list, and dead rules. **Zero dead
  CSS across 214 classes** — recorded as a real negative, since the path was
  exercised.
- [tickets] Filed **#92** (`ready-for-human`) — the findings, the ADR
  correction, and six owner calls. **No `ready-for-agent` ticket was filed, and
  that is the honest result rather than a shortfall**: every remedy measured is a
  design call, and the record grants no agent authority to make one unprompted
  (Partner's Q3b, DEFER).
- [hp] **`/hp` SKIPPED deliberately**, as in both prior runs.
  `.context/happy-path.md` is a live artifact; this run produced findings, not a
  user journey. Recorded rather than done quietly.
- [halt-check] **All four gates passed** — 6 defers < `max_defer` 12; **no entry
  flagged `reversible: NO`**; grill fork taken, not wayfind; `to-tickets`
  produced one ticket. No `slot` restore owed.
- [not-fired] **The relay was DECLINED, not forgotten.** With no
  `ready-for-agent` ticket, a `ticket-loop` leg stops immediately on an empty
  queue — Pressure verified that against `active-work.md` and ruled spawning one
  "ceremony". Deviation from the preset's step 6, recorded here rather than done
  quietly.
- [grant] **Owner grant received live, after reading the first report.** Recorded
  verbatim in `## OWNER GRANT` above. Six calls revisited; five resolved, one
  (call 5) untouched because no instrument exists for it.
- [round 3] Pressure **REFUTED 2 of 3 proposed tickets** — its fourth and fifth
  correct catches this run. The focus ticket's first draft would have
  **replaced authored fills on focus** (`background: var(--tint-3)` over the mint
  on `.send-btn` / `.pick-folder-btn`, the danger fill on `.perm-pill--bypass`),
  and it omitted `.agents-toggle` and `.session-delete`. Both fixed before
  filing; the fill rule is now #93's load-bearing acceptance criterion. The
  doc-reconciliation ticket was killed outright and **stayed** killed — the grant
  did not make a bad ticket good.
- [tickets] Filed **#93** (focus ring, `ready-for-agent`) and **#94**
  (`.command-row-btn`, `ready-for-agent`). Resolutions commented onto **#92**,
  which stays open as the findings record and the home for the three untaken
  calls.
- [fired] Queue eligible: 2 `ready-for-agent`, mutually unblocked, so
  `ticket-loop` can take them in either order. `/relay N=1 /preset ticket-loop`
  fired as the last act, per [[relay-spawn-is-last-act]].
</content>
</invoke>
