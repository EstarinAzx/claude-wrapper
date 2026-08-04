---
target: init
idea: "make the subagents chat view a center pop up not a side panel one and also
  when you use dynamic workflows feel free to use sonnet and haiku they are pre
  binded with non anthropic models. and yeah i also want you to really have second
  eyes so that we can have this app like production level in functionality that
  its not buggy it has to be bug free. and never tag anything ready for human as i
  will be away from home whatever it is you need from me i wont be there to
  answer so i give you the drivers seat."
partner: opus
pressure: codex/gpt-5.6-sol
pressure_via: sonnet
second_eyes: xai/grok-4.5 (via haiku) — granted explicitly by the seed
max_defer: 12
phase: fired
halted: false
relay: FIRED — 13 `ready-for-agent` tickets (#98–#110), body
  `.claude/relay-leg.md`, which was updated first because its own text told legs
  to relabel `ready-for-human` on a stuck ticket, and the owner forbade that.
---

## The seed, split into what it actually authorises

Four separate instructions arrived in one sentence. They are not the same kind of
thing and must not be treated as one.

1. **A design instruction, fully specified by the owner**: the subagent chat view
   becomes a **centre popup**, not a side panel. Placement is *decided* — it is
   the owner's own words, so no agent has to guess it and no defer is owed on it.
   What is **not** in the seed: size, entry motion, what happens to the scrim,
   focus behaviour, whether the drawer's `aside` semantics survive.
2. **A tooling permission**: dynamic workflows may use `sonnet` and `haiku`,
   which on this machine route to non-Anthropic Targets. This is a grant of
   **cross-model second opinions**, not a scope change.
3. **A quality bar**: "production level in functionality … it has to be bug
   free". A bar, not a spec. What counts as a bug and what the bar is measured
   against has to come from the record.
4. **An AFK autonomy grant with a hard constraint**: `ready-for-human` may not be
   used, at all. Everything filed carries a decided remedy, or is not filed.

**What the grant does NOT do**, per the standing reading of an AFK grant: it
removes *ownership* as a ground for deferring. It does **not** remove the need
for a warrant, and it does not license anything irreversible. It also does not
reopen the four unrelated parked owner calls (Tailwind's adopt-utilities half,
the titlebar control count, the 11px/12px line box, the accent clause's
enumeration) — those are outside this seed, and dragging them in would be scope
creep wearing a grant as a hat.

## The structural problem this run has to solve

The previous run's governing sentence was Pressure's: *"objective diagnosis does
not make the remedy taste-free."* It halted five of six remedies because each one
**picked a new appearance** inside a parked owner call.

This run is different in exactly one way that matters: **the owner supplied the
appearance decision themselves.** "Centre popup, not side panel" is the taste
call, made by the person who owns it. So the remedy is not agent taste — it is
execution of a stated instruction, and the honest work is making the execution
conform to `DESIGN.md` rather than inventing around it.

The trap to avoid is the mirror image: treating the seed as a licence to restyle
everything the popup touches. It authorises a **placement change**. Every pixel
that moves beyond what the placement change forces needs its own warrant.

## Measured this run (read-only, `file:line` on every claim)

### Baseline, established before anything moved

`npm run typecheck` clean; **979 tests across 64 files, all passing** — exactly
the figure `.context/pick-up.md` records, so the note is current on that point.
`npm run build` clean. `main` = `d2c9e0f`. One correction to the note: it says
"**Unpushed, 14 ahead of origin**"; the live count is **17**.

**Both drivers that pin this surface were run on clean `main` and are ALL
GREEN** — not assumed from the note, driven: `gui-95` (scrim tab-stop walk) and
`gui-96` (motion + weight). This matters because it means any red after the
conversion is genuinely the conversion's, with no inherited-red excuse
available.

**The number that decides how `gui-95` has to change: its walk is 16 stops
today**, and it terminates by seeing focus return to the `.subagent-row` anchor.
A focus trap makes that return impossible — the walk would cycle inside the pane
forever and burn its full 120-press budget. So the driver's cycle-break must move
from "focus is back on the anchor" to "focus is back on the walk's own first
stop". Measured, not predicted.

### The surface itself

`SubagentDrawer.tsx` renders a fixed full-inset root (`role="dialog"
aria-modal="true"`), a decorative scrim, and an `aside` pinned to the right edge
at `width: min(560px, 82vw)` with a directional shadow and a `translateX`
entry. Two entry points reach it: the `.subagent-row` under a Task card
(`ToolCard.tsx:144`) and the Agents dock (`App.tsx:352`).

### The record already decided AGAINST a centred modal — twice

This is the run's most consequential find, and it was Partner's, not mine.

1. `2026-07-31-appearance-is-a-dock-not-a-settings-modal.md`: *"A centred modal
   is the conventional shape, but it is a new overlay pattern, a new focus trap,
   and it paints a decorative glass layer inside the window"*.
2. `2026-07-31-deleting-a-session-is-scoped-confirmed-and-singular.md`: *"No
   modal, no `window.confirm`: the first paints a glass layer DESIGN.md bans"*.

The owner's instruction overrides both **for this surface** — but the record
obliges surfacing that rather than doing it quietly: `docs/agents/domain.md`
says *"If your output contradicts an existing ADR, surface it explicitly rather
than silently overriding:"*. So the contradiction is named here, and the ticket
carries the banner work as a criterion.

**The ADRs' three objections are not dismissed — they are the conversion's
checklist**, and two of the three are already spent for this surface:

- *"a new overlay pattern"* — spent. This surface has shipped as a scrimmed
  full-inset overlay since it was built. The conversion **moves** an overlay; it
  adds none.
- *"a decorative glass layer"* — the ban's recorded mechanism is painting a
  **new opaque backing over the OS acrylic** (`rails.css`, on the deliberately
  non-sticky session heading). All three recorded firings were against a *new*
  backing; none was against a `--surface` panel, which `DESIGN.md` itself
  specifies for the Agents dock and the input pill. So the conversion is clean
  **only if it adds no `backdrop-filter`, no blur, and no ply beyond
  `var(--surface)`** — which becomes an explicit non-goal in the ticket.
- *"a new focus trap"* — **not** spent. This one is real, and it is the third
  objection turning into the second ticket.

### Focus: the app has no precedent for what a modal is about to owe

Partner searched the corpus; I counted independently and got the same answer.
**Five `.focus()` call sites in the renderer** — three composer refocus
(`InputBar.tsx:161,169,213`), two roving-ring (`AppearanceDock.tsx:54,132`) —
and **not one of them moves focus on open or restores it on close**. No overlay
in this app does either. So the trap is genuinely new behaviour, not a pattern
being extended, and every part of it needs its own warrant.

The defect it fixes is already on record, in the app's own words: the drawer has
no focus trap *"despite `role=\"dialog\" aria-modal=\"true\"`. Tab walks straight
out of it into the pills, dock toggles, window buttons and composer — all behind
the scrim. Known, unfixed, unfiled."*

### Coupling the conversion has to respect

- **`subagent.css` is imported LAST** (`styles.css`), so nothing downstream can
  be broken by these rules; the cascade risk is nil.
- **`tests/scrollbar.test.ts` reads the whole `styles/` directory as TEXT**, not
  just `base.css`, and its scan picks up **comments** as well as selectors. A new
  comment in `subagent.css` naming a scrollbar pseudo-element reds it.
- **Three drivers select on these class names**: `gui-93.mjs` (static check on
  `.subagent-drawer-close:focus-visible` — the one control it cannot Tab to),
  `gui-95.mjs` (the scrim's tab-stop walk), `gui-96.mjs` (premise:
  `subagent-slide`; criterion: 200ms).
- **The chat column's real width**: `.chat` carries `padding: 0 24px`
  (`chat.css:9`) and `.chat-column` is `max-width: 760px` (`chat.css:13`). So a
  760px pane renders the column at **712px**, not 760. Pressure caught this;
  I confirmed it in the file. The pane width that renders the column at its
  documented size is **808px**.

### The scrim already covers the titlebar — reasoned, NOT measured

`.subagent-drawer-root` is `position: fixed; z-index: 20`; `.model-backdrop` is
`position: fixed; z-index: 10`; `.titlebar` is `position: relative` with **no**
`z-index`, and its ancestors `.workspace` / `.main-col` set neither position nor
z-index, so no intervening stacking context exists. Both scrims therefore paint
over the window controls while open.

**Epistemic status stated plainly, because this project measures rather than
reasons: this one is read off the CSS, not driven in a window.** It is recorded
and **not filed** — it is pre-existing, symmetric across both scrims (so
"fixing" one breaks the recorded parity rule), and costs one click to clear.

## Decisions

Pressure refuted **9 of the 18 claims put to it**, and the run is better for
every one. Two of those refutations *widened* the work rather than narrowing it,
which is the opposite of the usual failure and is recorded as such.

**Settled — the geometry**

- **Class names stay unchanged.** Warrant: none, and that is the point — the
  instruction neither requires nor forbids a rename, so the status quo is the
  more reversible option. My first two attempts to warrant this were both
  refuted (the `subagent.css` comment reaches only `.subagent-drawer-close`, and
  `shared.css:79` selects it too, making the rename surface seven files rather
  than six). · pressure: **conceded as argued**
- **The pane joins the app's existing floating-card treatment** — `var(--surface)`,
  `1px solid var(--border)`, `border-radius: var(--r-mark)`,
  `box-shadow: 0 8px 28px oklch(0 0 0 / 0.35)`. Warrant: `.model-menu,
  .command-popover` already define exactly that idiom (`composer.css`), so
  joining it invents no appearance. · pressure: **STANDS**
- **Pane width is 810px** = 760 (`.chat-column` max-width) + 48 (`.chat`
  horizontal padding) + 2 (its own hairline, which counts because `base.css`
  sets `box-sizing: border-box` on `*`). Every term read from a file. I first
  said 760, then 808; **Pressure produced the border-box correction and the
  final number itself.** · pressure: **settled by the refutation**
- **Root padding is a symmetric 24px, and there is no titlebar clearance.**
  Clearance was dropped because Pressure's own C9 verdict removed the need for
  it — the scrim already covers the titlebar. Symmetry is kept because "center"
  is the one part of the geometry the owner's instruction actually constrains,
  and asymmetric padding would centre the pane 12px low. · pressure: **24px
  conceded as CHOSEN, not derived** — recorded honestly rather than dressed up,
  taken under the standing grant as the most reversible option, alternative
  named (a smaller or larger gutter, trivially changed in one declaration).

**Settled — the motion**

- **The entry stops moving X and becomes a 4px Y rise plus fade, 200ms
  `var(--ease)`.** Warrant: `DESIGN.md`'s only documented entry is "200ms fade +
  4px rise, opacity/transform only". A centred pane sliding sideways is
  incoherent as well as off-spec. · pressure: **STANDS** (and it raised this
  unprompted before the first claim was even sent)
- **The keyframe keeps its name, and `gui-96` gains a static assertion** that
  the `subagent-slide` keyframe contains `translateY` and no `translateX`.
  My reason was wrong — Pressure showed the duration check is not made vacuous —
  but the corrected reason holds: with the name kept and the body changed,
  **nothing anywhere pins that the entry stopped moving X**, so a later edit
  could reinstate it with every check still green. Uncovered, not vacuous.
  · pressure: **STANDS** on the corrected form

**Settled — the focus work, which Pressure made BIGGER**

- **The scope is the full trio: initial focus on open, a `Tab`/`Shift+Tab` trap,
  and focus restore on close.** I proposed the trap alone and was refuted twice,
  correctly both times:
  - *On initial focus* — with `aria-modal="true"` already asserted in the code,
    leaving focus on the activating `.subagent-row` outside the dialog is a
    **false state from the moment it opens**, not merely until a key is pressed.
  - *On restore* — my claim that the trap *creates* the strand was **false**.
    `gui-95` reaches `.subagent-drawer-close` at stop 6 **today**, and activating
    it unmounts the very node focus sits on. The gap is pre-existing; initial
    focus makes it guaranteed rather than incidental, which is a reason to fix it
    in the same ticket, not a reason to call it a regression.
- **`gui-95` gains a criterion that the walk never leaves `.subagent-drawer-root`,
  red-verified against the untrapped build.** Warrant: "Red-verification is what
  made the instrument real"; "A driver must ESTABLISH the app state it asserts,
  never inherit it". · pressure: **STANDS**
- **Its cycle-break must move** from "focus is back on the anchor" to "focus is
  back on the walk's own first stop" — the trap makes the anchor unreachable, so
  the present walk would burn all 120 presses. Measured: 16 stops today.
  · pressure: **STANDS**

**Settled — the record**

- **No `SUPERSEDED` banners are written on either anti-modal ADR.** I planned
  two and was refuted: one decides *where Appearance lives*, the other *how
  deletion confirms*, and a centred transcript viewer overturns neither
  **decision** — only the **rationale** they happened to share.
  `docs/agents/domain.md` obliges surfacing real conflicts, not manufacturing
  them from shared reasoning. The new ADR instead states the departure from that
  rationale and why it does not reach their subjects. · pressure: **REFUTED, and
  right** — this is the refutation that saved the run from editing two correct
  ADRs wrongly.

**Deliberately left unresolved**

- **Whether DESIGN.md's glass ban reaches a `--surface` pane at all.** The
  anti-modal ADR says a centred modal "paints a decorative glass layer"
  unconditionally; read literally that already condemns the drawer shipping on
  `main` today, which no ADR has ever noticed. The run does not settle which
  reading is right, because **it does not have to**: the conversion changes no
  layer, no material and no opacity — only x and y. The non-goal ships either
  way (no `backdrop-filter`, no blur, no ply beyond `var(--surface)`), and the
  ban question is recorded as **untouched by this run rather than resolved by
  it**.

## Needs you

**Constrained to empty by the seed.** `ready-for-human` is forbidden, so an entry
here is not a parking space — it is a halt condition. Anything that lands here
and cannot be decided with a warrant stops the run.

## Log

- [boot] Prior run (`phase: fired`, the #92–#94 batch) is **terminal**: its relay
  chain closed, `gh issue list --state open` returns **nothing at all**, and
  #92–#97 are all closed. So this is a boot, not a resume. Archived to
  `.claude/vibe-2026-08-03-professional-grade-ui.md`.
- [boot] Frontier verified live, not trusted from prose: zero open issues in
  either label; `main` = `d2c9e0f`, working tree clean apart from two 0-byte
  Obsidian stubs; no open branches. **`main` is 17 ahead of `origin/main`** —
  recorded because the pick-up note says 14, so the count moved and is stale
  there.
- [boot] Destination DETECTED as GitHub (`gh` authed, `origin` →
  EstarinAzx/claude-wrapper). No AskUserQuestion fired. `.context/` present,
  `docs/agents/` present → neither conditional offer is owed.
- [boot] Pressure resolved against live `wisp routing` (first non-Claude family):
  `sonnet` → `codex/gpt-5.6-sol`. Already a family route, so **no `slot` rebind
  and no restore owed** on any halt path. `haiku` → `xai/grok-4.5` is available
  as a **second** adversary, which the seed explicitly grants.
- [cast] Pressure `READY` on first contact and named three hazards before being
  asked: `aria-modal="true"` still traps nothing and `gui-95.mjs` cannot see
  focus escape; drawer-named selectors/comments/tests/driver assertions go stale
  if only geometry moves; and **reusing `subagent-slide` on a centred popup would
  both violate the closed motion set and slide the thing sideways**.
- [round 1] Partner answered **10 of 10** — 9 warranted, Q4 DEFER. All 15 quotes
  grepped as fixed strings and **all 15 hit**. Its find is the run's most
  important: **the record had already decided against a centred modal, twice**,
  and I would have shipped over both without knowing.
- [round 2] Partner answered 4 more, 11 quotes, **all 11 grepped clean**. Two
  results changed the work: the amendment mechanism is a new ADR plus a banner
  (later shown not to apply here), and **the app has no precedent for moving
  focus on open or restoring it on close** — five `.focus()` sites, none of them.
  I counted independently and got the same five.
- [pressure] **9 refutations across 18 claims, and every one of them was right.**
  Four corrected a fact I had asserted (`shared.css:79` also selects the close
  button; `box-sizing: border-box` eats the pane's own border; `.chat`'s 24px
  padding is not a viewport gutter; the authored 10px scrollbar moves the content
  box). Two corrected a *conclusion*: no ADR is superseded here, and the focus
  work is bigger than I scoped it. **Two of the refutations widened the work
  rather than narrowing it**, which is worth naming because the failure this
  role guards against usually runs the other way.
- [pressure] The width went **760 → 808 → 810 → 820** across four attacks, each
  step supplied by Pressure and each one a term I had missed. The final number
  is the only one that holds in **both** scroll states, and Pressure verdicted it
  `STANDS`.
- [pressure] Where we did not converge: whether `DESIGN.md`'s glass ban reaches a
  `--surface` pane. Refuted twice; Pressure's own final word is *"Whether that
  violates the ban remains unresolved."* Recorded as unresolved and routed around
  by a non-goal, rather than declared settled by the side that wanted to build.
- [baseline] `typecheck` clean, **979/64 green**, `build` clean, and **`gui-95` +
  `gui-96` both ALL GREEN driven on clean `main`** — so no inherited red can be
  blamed later. `gui-95`'s walk is 16 stops, the number that forces its
  cycle-break to change.
- [tickets] Filed **#98** (centred popup, `ready-for-agent`) and **#99** (the
  focus trio, `ready-for-agent`), with a **native GitHub dependency** making #99
  blocked by #98 — they touch the same component and the order is not optional.
  Verification note for the next agent: `issue_dependencies_summary.blocked_by`
  read **0 immediately after the POST** and `1` on the next call. The
  `/dependencies/blocked_by` **list** endpoint was correct straight away. Read
  the list, not the summary, right after writing an edge.
- [tickets] **`/hp` not run, and the reason is specific this time rather than
  inherited.** `.context/happy-path.md` already contains this surface in two
  flows; the conversion changes the surface's **shape**, not the **sequence**, so
  the MVD is still true. Only two node *labels* go stale, which is now criterion
  8 on #98.
- [tickets] **No `/to-spec` PRD.** Two tickets carrying their own warrants,
  criteria and landmines is the shape this tracker's last four batches used; a
  PRD over two tickets is ceremony. Recorded as a deviation from the preset's
  step 7 rather than done quietly.

### The second-eyes pass — what it found, and what it MISSED

The seed's other half ("production level … it has to be bug free") was run as a
**cross-model functional bug hunt**: six finders over disjoint dimensions, each
batch attacked by a **different model** than the one that found it. The seed's
grant of `sonnet` and `haiku` is what made the cross-model half possible —
`sonnet` → `codex/gpt-5.6-sol`, `haiku` → `xai/grok-4.5`.

- [hunt] **3 of 10 agents died: "Prompt is too long."** Both `gpt-5.6-sol`
  finders (**ipc**, **engine**) and one `gpt-5.6-sol` verifier
  (**error-paths**). That Target's context is smaller than the reading these
  prompts provoked.
- [hunt] **This produced a silent-failure trap in my own harness, and it is the
  run's methodological lesson.** My triage code treated "no verdict" as
  refuted — so the four `error-paths` findings, whose verifier had *crashed*,
  were being reported as **REFUTED with an empty reason**. Unverified is not
  refuted. Caught by noticing the blank reason field, not by the harness.
  Re-verified in a second pass on a different model.
- [hunt] **Two dimensions were never hunted at all.** Recorded here rather than
  quietly dropped, and re-run — no silent caps.
- [hunt] **Confirmed and independently re-verified by me before filing: 7.**
  Four became tickets, one folded into #99, and two were the **same bug found
  twice by two different models in two different dimensions** — the
  `subagent-store` contract violation, which is why it was filed first.
- [hunt] **Refuted, correctly: 4.** Including one of my own suspicions — I had
  independently spotted that `SubagentDrawer`'s transcript promise has no
  `.catch` and could strand the viewer on "Loading…". The verifier killed it:
  the IPC producers on that path are deliberately total and lenient, so the
  rejection cannot arrive. **My own finding, refuted by a machine, correctly.**
- [hunt] The strongest single find is a file contradicting **itself**:
  `subagent-store.ts:86-91` documents that an unreadable store must answer
  `null`, and `:99` collapses it to `[]`. No judgement call, no taste — the code
  disagrees with its own stated contract, and the Agents dock has an unreachable
  error state as a result.

- [tickets] Filed **#100** (two unguarded async continuations in `useChat`),
  **#101** (the `subagent-store` contract violation), **#102** (the viewer's
  one-shot transcript read), **#103** (composer `Escape` propagation). All
  `ready-for-agent`. #102 chained behind #99, which is chained behind #98 —
  three tickets touch `SubagentDrawer.tsx` and the relay takes them one at a
  time, so the chain keeps every rebase trivial.
- [tickets] **Nothing was tagged `ready-for-human`, as instructed.** Every
  finding either carries a decided remedy or was not filed. The two calls that
  would previously have been parked were decided instead: **#102's refresh
  trigger** (`lastTurn`, because `App.tsx:342-350` already establishes that exact
  precedent for the Agents dock, and the record forbids a timer) and **#103's
  reachability** (the fix lands regardless, and measuring reachability is a
  criterion rather than a reason to defer).

### The gap pass, and what the RECORD killed before any agent could

The three crashed agents were re-run on models that had not overflowed. While
that ran, I hand-verified the four orphaned `error-paths` findings myself.

- [gap] **One was killed by the project's own record, not by any model.**
  `.claude/relay-leg.md` already carries the result of an earlier probe: this
  app keeps `--unhandled-rejections=warn`, and *"`shell.openExternal` on an
  unregistered scheme does not even reject"* — with the standing instruction
  **"do not re-file them"**. The finding was a re-file of a corpse, and I would
  have filed it if I had not read the loop body I was about to hand work to.
  **Reading the consumer of your output is part of producing it.**
- [gap] **Two were confirmed by hand and filed.** #104's evidence is the
  strongest single artifact of the run: `engine.ts`'s `result/success` branch
  skips `drainSubagents()` on an assumption its own file **contradicts 350 lines
  earlier**, in the `onBackgroundTasks` comment recording that #81 measured a
  level event landing **3.3s after `result/success`**, by which point the
  listener is null. #83 built a port for exactly that; the `subagent` event never
  got one.
- [gap] **#105 was filed as a SPIKE rather than a fix, deliberately.** The code
  path is confirmed, but three things stopped it being a repair: the user-visible
  consequence is unmeasured; `commands:list`'s own comment calls the empty answer
  *"the dock's honest empty state"*, which may mean it is intended; and the
  obvious remedy spawns a CLI process on every pill click. **This sandbox cannot
  settle it** — `gui-52` is a standing environmental red for an empty CLI model
  list, so an empty list here is indistinguishable from a null engine. Filing a
  fix would have been guessing with a straight face.
- [gap] **I called the re-run dead, and I was wrong.** Its agent files had not
  been written to for fifteen minutes and its one journalled result was `null`,
  so I recorded the `ipc` and `engine` dimensions as permanently unhunted and
  moved on. **It was simply slow** — it finished at 810s with all three agents
  green and returned the most serious finding of the whole run. The lesson is
  narrow and worth keeping: **a quiet workflow is not a dead one**, and a
  half-written journal says nothing about the agents still running behind it.
  The premature conclusion is left here rather than edited out, because the next
  reader will be tempted to make the same call.
- [gap] **All four orphaned findings came back CONFIRMED**, which vindicates
  re-running rather than trusting the "REFUTED with an empty reason" my own
  triage had produced. Two of the four I had already hand-verified and filed
  (#104, #105); one is #106; and one is the corpse below.
- [gap] **The verifier confirmed the `shell.openExternal` finding and is
  overruled anyway.** Its own correction concedes the crash claim "is
  overstated" and depends on Electron's escalation policy — and this project
  already *probed* that policy and recorded the answer: `--unhandled-rejections=warn`,
  and the call does not even reject on an unregistered scheme. **A live probe in
  the record beats a fresh code-read**, so it stays unfiled.
- [gap] The two recovered dimensions produced **six more findings**, of which the
  sharpest is a **data-loss** bug (#107) that no earlier dimension had touched:
  the rail can delete the transcript a turn is actively writing, during that
  session's first turn, because the renderer does not learn its own session id
  until `turn-end` and main deliberately delegates the busy refusal to a control
  that is therefore not disabled.

### Firing

- [handoff] **The loop body had to be fixed before it could be fired at.**
  `.claude/relay-leg.md` said, in its own words, that ambiguity "is a
  `ready-for-human` relabel plus a comment", and `/preset ticket-loop` says the
  same at two steps. **That is exactly what the owner forbade.** Firing without
  changing it would have handed nine tickets to a body instructed to break the
  one standing rule on the first ticket that went red. Replaced with: comment,
  leave it `ready-for-agent`, and **stop the relay** — because the only reason
  the relabel existed was to stop the next leg re-picking a stuck ticket forever.
- [handoff] Two more staleness fixes in the same file: its queue said "EMPTY as
  of 2026-08-01", and it claimed "there is no longer a do-not-decide list" —
  true when written, false since, and `pick-up.md` is now marked authoritative
  over it.
- [halt-check] **All four gates passed.** `## Needs you` is **empty** — not
  small, empty, because the seed made an entry there a halt rather than a
  parking space, and nothing needed one. No entry flagged `reversible: NO`;
  nothing filed touches schema, API, money, deletion, auth, or anything
  published outward. Grill fork taken, not wayfind. `to-tickets` produced **9**.
  No `slot` restore owed — `sonnet` was already a family route.
- [housekeeping] Two **0-byte untracked** Obsidian stubs
  (`.context/2026-07-23.md`, `.context/Untitled.canvas`) that existed at session
  start are gone from the working tree. **I did not delete them deliberately and
  cannot say what did.** Confirmed harmless before moving on: `git log --all`
  shows both were **never tracked**, and the prior baton recorded both as 0
  bytes, so nothing recoverable was lost. Recorded rather than passed over in
  silence.
- [fired] `/relay N=1 read and follow .claude/relay-leg.md` fired as the **last
  act**, after every file edit and the commit — per the standing rule that relay
  legs share one git tree.
