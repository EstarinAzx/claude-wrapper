---
type: pick-up
project: claude-wrapper
updated: 2026-08-11
tags: [context, pick-up]
---

# Pick up

Start: read [[overview]] + [[active-work]].

## Chain 7 is one ticket from dry, with gauntlet chained behind it

An autonomous `/preset vibe` pass ran while the owner was away, under an explicit
AFK autonomy grant. It ruled the three design questions, triaged the follow-ups,
filed one new ticket, and fired the execution chain. The full reasoning, every
warrant, and every cross-model objection is in `.claude/vibe.md` — read that
before overturning anything here.

**Verify rather than trust this file. It has been wrong before:**

```text
gh issue list --state open --label ready-for-agent
git rev-list --count origin/main..main
```

## The queue

**ONE ticket left. Legs 1–11 landed #149, #146, #142, #148, #143, #147, #145,
#150's work, #141, #138, and #139** (`ab7aee4`, **closed**). **Next is #140, and
it is the last one** — when it lands the queue is dry, the body signals done, and
the chain fires its `then:` into `/preset gauntlet`.

| Order | # | Why here |
|---|---|---|
| ~~1–11~~ | ~~149, 146, 142, 148, 143, 147, 145, 150, 141, 138, 139~~ | **DONE, legs 1–11** |
| 12 | 140 | Named scoped exception for the state stripe |

**No ticket in this queue carries a native blocking edge** — checked on all nine
at leg 3, re-checked on #138, #139 and #140. The ordering lives only in this
table, so it is the chain's plan rather than something the tracker enforces.

**The gauntlet's ordering constraint is CLEARED** (#138 landed the one type scale
`bar_win`'s clause was waiting on).

**#150 is OPEN at `needs-info` and is NOT queue work.** Its code landed in full;
what it waits on is a human pushing and watching the first CI run. Leave it.

**Eleven tickets sit at `needs-triage` and none may be promoted by a leg:** #144,
#151–#159, and **#160** (new, leg 11).

## Next ticket, #140 — a document edit, and the trap is in the test

The ruling is settled: **keep the stripe, and amend the ban with a named, scoped
exception** for the selected session row's state stripe, written in **#125's
form** (the glass-ban exception) and **stating that it is not a precedent**.

The ruling is careful about *why*, and the distinction matters if you are tempted
to simplify: **#125 supplies the METHOD, not the authority.** A cross-model
adversary refuted the first draft — *"an exception to the glass ban cannot license
an exception to an unrelated side-stripe ban"* — and it is right. The authority is
the owner's standing grant. Cite #125 for how to write the amendment, never for
whether one may exist.

**Do not rewrite the ban to say "no decorative side-stripes".** That was
considered and rejected: it hands every future surface a category-wide licence,
where a named exception hands out exactly one.

**The ticket's own framing is wrong in one place and the ruling says so.** The
ticket calls the banned list "a list of decorative vocabulary". Read the line —
*"No side-stripe borders, no gradient text, no decorative extra glass layers
inside the window (the OS acrylic is the one glass), no card grids, no em dashes
in copy."* — and "decorative" qualifies the **glass clause only**. The textual
violation is real. Do not argue it away; exempt it.

**The landmine, and one thing that is NOT a landmine.**
`tests/subagent-material.test.ts` reads `DESIGN.md` literally and splits on
`\n## Bans in force\n`, so **that heading must survive the edit verbatim**.
But it normalises first — `DESIGN.md:95` does `.replace(/\r\n/g, '\n')` before
splitting — so **CRLF is handled there and is not the hazard**. Do not spend a
run on it. It splits again on `\n## ` for the section end, so the exception text
must stay **inside** that section rather than under a new `##` heading.

D4 applies only if pixels move, and this ruling moves none — the stripe ships
unchanged. Acceptance 3 wants the decision log to carry it so a fresh reviewer
reading spec-plus-pixels stops re-raising it.

## Before you trust a gate result

**`main` goes red on its own.** `tests/session-title-enrichment.test.tsx` fails
intermittently under full-suite load — 4 of 7 complete runs at leg 5, including
one on the unmodified tree with all work stashed. Filed as **#153**. Green on
every run at legs 6 through 11, which is not evidence it is fixed.

**So a single red run is not evidence your change broke something.** Re-run, and
if it is that test, stash and run against the bare tree.

**`npm run test:dom` cannot be all-green while #155 is open**, because `gui-123`
honestly reports `UNSCORED`. A full run also reports `INCOMPLETE` — the accepted
`gui-119` quarantine stated rather than hidden. Both are correct readings.

**Do not run the fast gate concurrently with the DOM phase.** Leg 7 did, and it
cost two ambiguous reds and five attribution runs to unpick.

**`npm run x | tail` then `echo $?` gives you `tail`'s exit code.** Redirect to a
file and read `$?` on its own line.

**A clean checkout runs four fewer tests than your working tree** because
`tests/transcript-rewind-real-store.test.ts` skips without a stored transcript
whose `cwd` is this repo. **#157.** Not a regression.

**Never revert a mutation with `git checkout -- <file>` on an uncommitted tree.**
Leg 10 did and lost two finished files mid-run. Back up with `cp` and restore
from that. Mutation testing is routine in this chain.

## What leg 11 added, and the rule worth carrying

**The tool-card label went 600 → 400** (#139), because `DESIGN.md` licenses 600
for exactly three roles — app name, headings, bubble-less emphasis — and a
tool-card label is none of them.

**The transferable rule is about the shape of the pin.** The value rests on a
warrant, and the warrant is a **DOM fact a refactor can change without touching a
stylesheet** (`ToolCard` renders as a *sibling* of `.assistant-body`; move it
inside and 600 becomes licensed again). So `gui-96` checks both — criterion 7 the
value, **criterion 9 the warrant**. A check on a value survives the death of its
reason unless the reason is checked too.

**Criterion 8 is the anti-vacuity pin, and its technique is reusable here.**
`500` renders byte-identically to `600` on this machine because the family snaps
to named instances, so a computed-weight read can be green over a no-op. The fix:
drive the element through both values in-run and compare `getBoundingClientRect()`
in **device** pixels. Measured 29.94 at 400 against 31.17 at 600.

```bash
npm run build && node .claude/skills/run-desktop/gui-96.mjs
```

**Two new source checks** (`npm test`): criterion 10 — every `font-weight` in
`styles/` is `400` or `600`, matched as `[^;}]+` so **`bold` cannot slip through
a digit-only pattern**; criterion 11 — `DESIGN.md`'s Type section keeps a line
naming the tool-card label, its weight, and both size and colour.

**And the finding the stop gate produced: #160.** Discharging acceptance 1 meant
mapping every 600 in `styles/` to a licensed role, and the same reading that
condemns the tool-card label condemns **eight more** elements. Filed at
`needs-triage`, not ruled — because #138 **widened this very line** one commit
earlier rather than restriking code, so the precedents point opposite ways.

## CI exists, and has still never run

`.github/workflows/fast-gate.yml`, on push, `windows-latest`, exactly
`typecheck` + `test` + `build`. **Nothing has ever been pushed from this
checkout.** That is why #150 is open. `main` is **22 commits ahead**.

## The DOM phase's current reds, already attributed

**Legs 8 through 11 ran no full phase** — leg 11 ran only `gui-96`, four times —
so this table is leg 7's and nothing has moved it.

| driver | in batch | alone | verdict |
|---|---|---|---|
| `gui-95` | FAIL | FAIL (leg 6) | **pre-existing**, uninvestigated |
| `gui-49` | FAIL | FAIL (leg 6) | **pre-existing**, uninvestigated |
| `gui-123` | UNSCORED | UNSCORED | **#155**, working as designed |
| `gui-94` | FAIL | **PASS** | load artifact, not filed |
| `gui-91` | FAIL | **FAIL 1×, PASS 3×** | **#156**, intermittent ~1 in 7 |
| `gui-93` | **PASS** | PASS (leg 9, twice) | green; red-verified under mutation |
| `gui-124` | **PASS** | PASS | was batch-red at leg 6, unexplained |
| `gui-96` | — | **PASS** (leg 11, ALL GREEN) | 11 criteria, all mutation-verified |

There is still **no full-phase baseline on an unmodified tree**.

## #155 is still the biggest open finding, and it needs a human

On a profile the app has never started in, **no message sends at all**. Measured
one variable at a time: not the driver's zero-turn trick, not the Enter key path,
not zoom, not localStorage.

**A profile the app has never started in is every new user's first launch.**

**What has NOT been done, and it is one run:** open the app **by hand** on a
clean profile and type a message. Everything above went through `playwright-core`
with a stubbed `dialog.showOpenDialog`, so nobody has ruled out the harness.

## Landmines

**The workflow is pinned as text** (#150). `tests/fast-gate-workflow.test.ts`
reds on: a changed job name, a changed command **set** (order is free), losing
`if: always()` on the summary step, or **any** workflow invoking `test:dom`.

**`styles/` may contain only `400` and `600` font-weights** (#139), keywords
included, and **no `em` font-size and exactly ONE literal px font-size** (#138),
allow-listed by exact `file:line` with an anti-vacuity clause.

**`DESIGN.md` is read by four checks now** and each wants something different:
`## Type` must name every `--text-*` value `tokens.css` defines (#138) **and**
keep the tool-card weight sentence (#139); `## Bans in force` must survive as a
split token (#125/#140). **It is CRLF** — a section regex needs `\r?\n`, though
`subagent-material.test.ts` normalises first and is not exposed.

**`CLAIMED_HEADROOM_PX` in `inspect.mjs` is a copy of a sum argued in prose in
`chat.css`.** Never move it to match a measurement without moving that sum too.

**`gui-75` is the first driver with a sidecar that is ALSO in `DOM_SKIP`** (#141).
"Has a sidecar" and "is executed somewhere" are now different claims.

**The check set is enumerated ONCE**, in `drivers.manifest.mjs` (`loadChecks()`).
Do not re-glob sidecars in the test file.

**A quarantine the verdict does not carry is a green** (#145).

**Logic the fast gate must execute cannot live in `dom-phase.mjs`** — it spawns
drivers at import, same rule as `inspect.mjs` (#142, #148). Put it in
`drivers.manifest.mjs`.

**Every driver launches on a private `userData`** (#147). New driver → spread
`...profileArgs()` from `driver-profile.mjs`. **No opt-out list, do not add one.**
The profile is per driver PROCESS, not per launch.

**A cold profile is not the same app as a warm one.** Leg 6's whole finding.

**Do not read the DOM phase's verdict off a compound command.** It has reported
**exit 0 while its own text said `DOM PHASE FAIL`**.

**A driver that pins persisted app state must READ IT BACK** (#143).

**A byte comparison that passes is not evidence a capture is stable** (#148).

**Run `inspect.mjs` one at a time** (#142). Point `SCREENSHOT_DIR` outside the repo.

**A squash merge does not mark the branch merged.** `git branch -d` refuses after
one. Diff the branch against `main` first, and let an empty diff authorise `-D`.

**`.context/` picks up line-ending churn.** Keep `.context/` off the ticket branch
and check `git diff --cached --name-only` before committing.

**Do not cite `DESIGN.md` by line number** (#138). Name the section.

## Standing constraints for the renderer

No em dashes in user-visible strings (`tests/copy-em-dash.test.ts` compiles
`src/`; comments are free, and so is anything outside `src/`). D3 — the
stylesheet pins are literal-text and brittle: no comment in `styles/` may contain
a closing brace, `.bubble` and `.message-input` stay ungrouped, `.bubble {` must
stay the first literal occurrence in `chat.css`, exactly one `backdrop-filter` in
all of `styles/`, and the `@import` order in `styles.css` IS the cascade. D4 —
any CSS change owes a driver pin that **executes**, naming which gate runs it;
jsdom loads no CSS, so neither the fast gate nor CI can see layout. The
titlebar's centring is load-bearing (#136).

**Adding or removing a capture surface costs three edits** (#149): `SURFACES` in
`inspect.mjs`, the `surfaces:begin`/`surfaces:end` region in
`.claude/skills/run-desktop/SKILL.md`, and the same region in
`.gauntlet/bar/README.md`.

**A new driver's capture destination is gated** (#146): use
`process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')`.

**`drivers.manifest.mjs` enumerates the non-driver `.mjs` files. There are FIVE.**
A `*.source.mjs` sidecar needs no wiring.

## Still yours — nothing here blocks the chain

Live entries in `.claude/vibe.md` under `## Needs you`:

1. **Git history on the wave captures.** The repo is **public** and 35 wave PNGs
   are in `origin/main`. Leg 4's audit found no real session title in any capture;
   what is exposed is a **Windows username** in the fixture temp path and the
   foreign-session **count**. Fix-forward taken; the residual half is **#151**.
2. **gauntlet owner call 14, the stop signal.** Two agent-reachable answers were
   attempted and both were refuted cross-model as post-hoc goalpost movement.

**Still one command:** `git push origin main`, then watch the first `fast-gate`
run and close **#150** on green. `main` is **22 commits ahead** and has never
been pushed.

Seven older owner-calls remain in `.claude/vibe-130.md`. **#152** and **#155** are
yours in spirit. **#159** and **#160** are the newest pair and are the same
question one property apart: may a painted value sit outside the documented set
because nothing ever licensed it, or does the document owe an amendment? #159 is
sizes, #160 is weights.

## Gauntlet

`.claude/gauntlet.md` was **archived to `.claude/gauntlet-core-surfaces.md`** so a
fresh run seeds instead of halting on the old `stop: true` at `plateau: 3`.
Especially worth reading: owner calls 14 to 20.

**One reference question is still open, and it is an owner call.** Earlier
`.context/` prose said the bar holds only five Linear references and that the
three docks therefore share the Sidebar's. But `.gauntlet/bar/README.md`'s own
"What each reference judges" table already assigns `linear/linear-features.png`
to *"Titlebar + docks"*. **Read the table, not the prose.**

**A run cannot take all nine surfaces at once.** `pieces` is capped at 6 and fixed
at seed. That is a budget, not a statement that the unpicked surfaces lack a
standard.

## Chain rules

- **Do not push on your own initiative** (D6). Leg 8 tested this against a ticket
  whose own acceptance asked for a push, and left the ticket open rather than
  push — D6 was written and pressure-tested *under* the AFK grant, so the grant
  does not override it.
- **Do not apply `ready-for-human`** — a blocker becomes `needs-info` + a comment
  + a `PushNotification`.
- **File follow-ups at `needs-triage`, never `ready-for-agent`.** A leg promoting
  its own follow-up makes the chain's stop condition unreachable by construction.
  Leg 11 filed #160 that way with one ticket left in the queue.
- **A leg may leave a ticket open** (leg 8's precedent, #150) or close it (legs 9,
  10 and 11 closed #141, #138 and #139). Landing the work and closing the ticket
  are separate decisions: close when everything the acceptance asks for was
  verifiable without a push.
- **An acceptance criterion written as a stop gate is read first and answered
  with evidence** (leg 11, #139 acceptance 1). Discharging it honestly may widen
  the finding beyond the ticket — file the widening, do not detour into it.

## Related

- [[active-work]] · [[overview]] · [[decisions]] · [[stack]]
