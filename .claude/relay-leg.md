# relay-leg — one ticket per leg, gateless wrap-up

Loop body for:

```
/relay N=1 read and follow .claude/relay-leg.md
```

Each leg = exactly ONE ticket end to end, then the relay machinery hands off to
a fresh session. Legs run **unattended**: never call AskUserQuestion; every gate
below auto-decides.

## THE `ready-for-human` LABEL IS FORBIDDEN THIS QUEUE — read this first

The owner left on **2026-08-04** with this instruction, verbatim:

> "never tag anything ready for human as i will be away from home whatever it is
> you need from me i wont be there to answer so i give you the drivers seat."

**This overrides every `ready-for-human` relabel named further down this file
(steps 2 and 5) and in `/preset ticket-loop`.** Where those say "relabel
`ready-for-human`", do this instead:

- Push the branch as-is, comment on the ticket with exactly where and why it
  stuck, and **leave it `ready-for-agent`**.
- Then **stop the relay** rather than spawning a leg that would pick the same
  stuck ticket again. A stuck ticket the next leg would re-pick is an infinite
  loop, which is the only reason the relabel existed.
- Say plainly in the comment that the label was withheld under the owner's
  instruction, so a cold reader does not read the missing label as an oversight.

The grant removes **ownership** as a ground for deferring. It does **not** remove
the need for a warrant, and it licenses nothing irreversible. It also does not
reopen the standing calls in `.context/pick-up.md`.

## Current queue — THIRTEEN OPEN as of 2026-08-04

Take the lowest-numbered open, unblocked `ready-for-agent` ticket.

Filed by a `/preset vibe init` run on 2026-08-04; its full record — every
question, the grepped warrant, the cross-model verdict, and the nine refutations
that changed the work — is `.claude/vibe.md`. **Read it before starting any
ticket in this batch.**

| # | subject | blocked by |
|---|---|---|
| **98** | the subagent viewer becomes a **centred popup**, not a right-edge drawer | — |
| **99** | that viewer takes focus on open, traps it, gives it back on close | 98 |
| **100** | two unguarded async continuations in `useChat` apply after their target moved | — |
| **101** | `listSubagents` contradicts its own docstring: unreadable store reads as "no agents" | — |
| **102** | the viewer reads the transcript once, so a running agent is frozen | 99 |
| **103** | the composer's `Escape` does not stop propagation, so one press dismisses two things | 99 |
| **104** | a subagent open when a turn SUCCEEDS is never drained; its terminal event reaches nobody | — |
| **105** | **spike** — does picking a model empty the model menu and slash commands until the next send? | — |
| **106** | a clipboard image that fails to read is rejected with a self-contradictory message | — |
| **107** | **the rail can delete the session a turn is streaming into** — data loss, first turn only | — |
| **108** | **spike** — can a second send, or a hung interrupt, strand the turn lifecycle? | — |
| **109** | `switchWorkspace` checks `isBusy` before an await, so a send during resolve tears down a live turn | — |
| **110** | the window's last move or resize is dropped if you close inside the 250ms debounce | — |

#98, #99 and #102 all touch `SubagentDrawer.tsx`, which is why they are chained
rather than merely ordered — the chain is what keeps each rebase trivial.

**#98–#103 came from the grill; #104–#106 came from a cross-model bug hunt and
were each re-verified by hand before filing.** Three notes that bind:

- **#105 is a SPIKE and must stay one.** It ends in a harness, findings and a
  recommendation — **no `src/` diff**. Its premise may well be wrong: the
  `commands:list` comment calls the empty answer "the dock's honest empty state",
  and `gui-52` is a standing environmental red for an empty CLI model list, so an
  empty list in this sandbox is indistinguishable from a null engine. Killing its
  own premise is a successful outcome.
- **#104 forbids the obvious shortcut.** Do **not** call `drainSubagents()` on
  the success branch: it emits `failed`, which for an async agent is a lie about
  one that is still running. The correct fix is #83's port precedent.
- **A finding was killed by this very file** and must not be re-filed: the
  `void shell.openExternal(url)` unhandled-rejection theory. The probe recorded
  further down says this app keeps `--unhandled-rejections=warn` and that
  `shell.openExternal` on an unregistered scheme does not even reject. A
  cross-model verifier **confirmed** the finding on a fresh code-read and was
  overruled: its own correction conceded the crash claim was "overstated" and
  depended on Electron's escalation policy, which this repo has already probed.
  **A live probe in the record beats a fresh code-read.**
- **#107 is the one to take first if you are choosing by consequence** — it
  destroys a transcript that is being written, by an ordinary sequence, and it
  is the only data-loss defect in the batch.
- **#105 and #108 are SPIKES and must stay spikes** — harness, findings,
  recommendation, **no `src/` diff**. Both have plainly-confirmed mechanisms and
  genuinely open reachability, which is the exact shape this repo has three
  precedents for. Killing their own premise is a successful outcome.

**#98 and #99 rest on a contradiction surfaced deliberately.** Two ADRs
previously reasoned *against* a centred modal. **Neither is superseded and
neither gets a banner** — one decides where Appearance lives, the other how
deletion confirms, and a centred transcript viewer overturns neither *decision*.
The owner's instruction overrides only the **rationale** they shared. #98's ADR
must say that, and must record the glass-ban question as **unresolved** rather
than quietly settle it.

**Run the frontier query anyway; it is the authority over this table.** If it
returns a different ticket, work that one. If it comes back empty the queue is
drained: rewrite `pick-up.md` to "queue empty", commit `.context/` on main,
signal the relay stop, spawn nothing.

**What #80 settled, because the next composer ticket inherits it.** The
type-while-busy queue is a **flag on the draft**, not a stored payload — so
cardinality is one by construction, what fires is whatever is in the box when the
turn ends, cancelling is lossless, and `<InputBar key={cwd}>` resets it for free.
The flush condition is **positive** (`turn-end` with a live engine, decided by
the twelve-row table in `src/shared/queued-send.ts`); every other row
**unqueues**, releasing the commitment and never the text. Do **not** add a
second busy flag — `lastTurn` records how a turn *ended*, which is a different
question — and **never un-key the composer**.

**#79's headline is about SIGNALS, and it is the counterpart to #78's.** #78
measured the launch artifact and **declined** the `win.show()` gate; #79
**built** it, for bounds only, and the two are consistent rather than a
flip-flop. #78 declined it *as the ADR specified it* — "gate on the renderer's
first preference push" is a race between two independent messages and misses a
third preference (`data-theme`) that crosses no boundary at all. Bounds are
**one named message with one meaning**, so "ready" is a fact and the protocol
#78 priced collapses to a `let` and a timeout. **When a readiness gate looks
expensive, check whether the expense is in the waiting or in defining what
"ready" means.**

Measured A/B on one build (`gui-79.mjs`, five runs; the probe defeats the gate
by showing on `ready-to-show`, the line the app used to run): gated is **0ms
visible at the wrong bounds across 5 runs of 5**, ungated is **0–49ms on 4 runs
of 5** with an on-screen move+resize, at a cost of 7–45ms later appearance.
**The ungated artifact being INTERMITTENT is what settled it** — a window that
lands somewhere different depending on machine load is worse than one that
reliably takes a twentieth of a second longer to appear.

**Two traps from #79 that bite any ticket, including #80:**

- **A zero-arg `vi.fn()` mock makes its own `mock.calls[0][0]` a TYPE error.**
  `vitest` infers an empty argument tuple, so a test reaching for the callback
  the code was handed does not typecheck — **while `npm test` passes, because
  `vitest run` does not typecheck.** Only `npm run typecheck` catches it. Type a
  mock with the real signature: a loosely typed mock is not neutral, it is wrong
  in a direction.
- **An instrument can report a gate's SUCCESS as the artifact it measures.**
  `boundsChangesWhileVisible` compared each visible sample against the previous
  sample regardless of *that* sample's visibility, so a window shown
  already-correct scored 1 for doing exactly its job.

**The launch path changed in #79, so anything touching it must keep both
conditions**: the window is shown once Chromium has something to paint AND the
renderer has pushed its bounds (or a 1500ms timeout fired). `bounds:set` must
keep releasing that gate on a `null` or invalid payload too, or every first-ever
launch waits out the timeout.

**Four instrument traps from #78, still binding on anything that measures a
launch:**

- **Playwright cannot measure a launch at all.** Under `_electron.launch()` this
  window never emits `ready-to-show`, so it is never shown, never painted, and
  `getEntriesByType('paint')` is empty. Fine for the DOM-driving drivers; fatal
  for paint/visibility/timing. `gui-78` and `gui-79` spawn Electron directly
  with a probe as the **entry point**, which hooks and then `require`s
  `out/main/index.js`.
- **`NODE_OPTIONS=--require` never reaches Electron** and
  **`context.addInitScript()` is too late** (launch resolves at ~380ms with the
  window already loading).
- **`--disable-gpu` is load-bearing in this background session** — with GPU
  compositing on the app's window never paints at all, while a standalone
  `BrowserWindow` with identical options does. It flattens acrylic, so no
  material is judged visually in that run.
- **Chromium's persisted per-origin zoom makes an un-isolated launch an
  inherited pass.** Fresh `userData` via `app.setPath` before `ready`; and a
  premise guard must read the first **painted** frame's dpr, never
  `getZoomFactor()` at construction, which reads 1.0 on a warm profile too and
  can therefore never fail.

Everything before this batch is delivered and closed: spec #64 (#65 `f0dfc68` ·
#68 `70c904f` · #66 `a7c0470` · #67 `e16ace6` · #69 `add4e5b` · #70 `1769aa4`),
then #71 `b6e8911`, #72 `9fecc10`, #73 `6b4a831` and #74 `07544e8` standalone.

**#77's lesson is about setup order rather than about CSS, and it still binds.** A driver's own setup can revoke the capability it is about to
measure: `openSession` calls `targetSession`, which **closes the engine**, so
`listModels()` and `listCommands()` answer `[]` **by contract** afterwards —
measured in screen order, `gui-51` read a 1-row model picker and two command
surfaces that never mounted, indistinguishable from a dead CLI. **Order setup
steps by what each one takes away, not by what it needs.** Two corollaries that
transfer: **an empty list beside a static row looks populated** (reason about
what the list was supposed to *add*, never `querySelectorAll(...).length`), and
**a surface that passes only on the machine that wrote it is inherited, not
established** — `.session-groups` had been overflowing purely because this store
holds ~490 sessions.

Before that, #76 produced the rule that **destruction is quiet**, so an
assertion phrased as an absence can measure nothing: assert what went on living,
not what failed to appear.

**`gui-75` is focus-dependent and has now gone red in TWO consecutive batch runs
while passing solo both times.** A batch that reds only there is a green batch —
re-run it alone before believing the red or writing anything down.

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
seven were resolved in that run. What the grant did **not** change: an answer
still comes from a warrant or it is marked as a chosen design.

**Corrected 2026-08-04 — "there is no longer a do-not-decide list" was true when
written and is now false.** `.context/pick-up.md` carries a short standing list
again (Tailwind's adopt-utilities half, the titlebar's control count, the 11px
line box, and the accent clause's enumeration). **`pick-up.md` is authoritative
over this paragraph.** The 2026-08-04 grant does not reopen them either: they sit
outside that seed, and a broader grant is not a new reason. Two of the seven were deliberately settled only by
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
   confusion → comment on the ticket, **leave it `ready-for-agent`** (the label
   is forbidden this queue — see the top of this file), jump to step 6, and stop
   the relay rather than spawning a leg that would re-pick it.
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
     **leave it `ready-for-agent`** — the label is forbidden this queue, see the
     top of this file. Ticket stays open; its dependents stay blocked. Then
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
