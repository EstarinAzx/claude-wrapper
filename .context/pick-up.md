---
type: pick-up
project: claude-wrapper
updated: 2026-08-11
tags: [context, pick-up]
---

# Pick up

Start: read [[overview]] + [[active-work]].

## Chain 7 is draining the queue, with gauntlet chained behind it

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

**Two tickets left. Legs 1–10 landed #149, #146, #142, #148, #143, #147, #145,
#150's work, #141, and #138** (`b2a3fd0`, **closed**). **Next is #139.**

| Order | # | Why here |
|---|---|---|
| ~~1–10~~ | ~~149, 146, 142, 148, 143, 147, 145, 150, 141, 138~~ | **DONE, legs 1–10** |
| 11 | 139 | Tool-card label to 400 |
| 12 | 140 | Named scoped exception for the state stripe |

**No ticket in this queue carries a native blocking edge** — checked on all nine
at leg 3, re-checked on #138 and #139. The ordering lives only in this table, so
it is the chain's plan rather than something the tracker enforces.

**The gauntlet's ordering constraint is CLEARED.** #138 was the one `bar_win`'s
*"one type scale holds across all of them"* clause was waiting on. Per-surface
verdicts are no longer confounded by two scales.

**#150 is OPEN at `needs-info` and is NOT queue work.** Its code landed in full;
what it waits on is a human pushing and watching the first CI run. Leave it.

**Ten tickets sit at `needs-triage` and none may be promoted by a leg:** #144,
#151, #152, #153, #154, #155, #156, #157, #158, and **#159** (new, leg 10).

## Next ticket, #139 — and read the ruling, it inverts the ticket title

The title says the prose/label weight pair is off the documented set. **The
ruling reversed twice and landed somewhere else:** `DESIGN.md` licenses 600 for
exactly two things, the app name and bubble-less emphasis, and **a tool-card
label is neither**. So the off-spec element is not the prose at 400 — it is the
**label at 600**, asserting a weight the spec never granted it.

**Acceptance 1 is a STOP GATE, and it comes before any code:** confirm against
the *rendered* elements that the tool-card label is neither the app name nor
bubble-less emphasis. **If that reading is wrong, stop and report.** Do not build
on it.

Then: labels at 400, `{400, 600}` untouched, no new rung; `DESIGN.md` records
that tool-card emphasis is carried by **size and colour**; the `font-weight: 500`
grep still finds zero.

**The trap the ticket keeps in the record, and it is a real one:** `500` renders
**byte-identically** to `600` on this machine (stem 1.5436 for both) because the
family snaps to named instances. Anyone "fixing" this at 500 changes **zero
pixels** while believing otherwise. Assume the same hazard below 400. **Measure
the stem, not the declaration.**

D4 applies — this moves rendered type, so it owes a driver pin that executes.
`gui-96` already owns the computed-weight ground and greps `font-weight: 500`;
extend it rather than starting a driver, unless the shape genuinely differs.

## Before you trust a gate result

**`main` goes red on its own.** `tests/session-title-enrichment.test.tsx` fails
intermittently under full-suite load — 4 of 7 complete runs at leg 5, including
one on the unmodified tree with all work stashed. Filed as **#153**. Green on
every run at legs 6 through 10, which is not evidence it is fixed.

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

## What leg 10 added, and the traps it hit

**The type scale is enforced as a RATIO, not as a list** (#138). Every painted
size must land within **half a pixel** of `15 * 1.15^k`. `gui-138.mjs`
(`npm run test:dom`) sweeps every painted box in real Chromium and prints each
distinct size with its rung; `gui-138.source.mjs` (`npm test`) bans `em`
font-sizes and literal px sizes in `styles/`, and cross-reads `tokens.css`
against `DESIGN.md`.

```bash
npm run build && node .claude/skills/run-desktop/gui-138.mjs
```

**The tolerance cannot be tightened.** 11px sits 0.34px off its own rung, so
anything stricter throws a documented rung off the documented scale. That is why
`.win-btn` at 0.29px (Chromium's UA button default, **a seventh size nobody had
counted**) is **not** a violation, and is filed as **#159** rather than fixed.

**FOUR TRAPS THIS LEG PAID FOR:**

1. **`git checkout -- <file>` during mutation testing destroys uncommitted work.**
   This leg lost two finished files mid-run that way. On an uncommitted tree,
   revert a mutation with `cp` from a backup. Never `git checkout`.
2. **`DESIGN.md` is CRLF.** A regex written `\n## Type\n` matches nothing and
   reports every rung missing — a red for the wrong reason that reads exactly
   like real drift. Use `\r?\n`.
3. **`path.relative()` answers backslashes on win32.** A check comparing it to a
   hand-written `a/b/c.css:12` allow-list silently never matches, so the
   exception excuses nothing and the check reds on the line it was written to
   permit. Normalise with `.split(path.sep).join('/')`.
4. **Do not cite `DESIGN.md` by line number.** Four `src/` comments did; the
   Type section grew and broke all four. They now name the section.

**Carry leg 9's habit, which is what caught trap 3: mutation-verify the TEST,
not only the code.** Reading that check would not have found it. Running it did.

## CI exists, and has still never run

`.github/workflows/fast-gate.yml`, on push, `windows-latest`, exactly
`typecheck` + `test` + `build`. **Nothing has ever been pushed from this
checkout.** That is why #150 is open.

## The DOM phase's current reds, already attributed

**Legs 8, 9 and 10 ran no full phase** — leg 10 ran only `gui-138`, four times —
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

**`styles/` may contain no `em` font-size and exactly ONE literal px font-size**
(#138), allow-listed by exact `file:line` in `gui-138.source.mjs`. The allow-list
carries an anti-vacuity clause: if that line stops being a px `font-size`, the
check reds rather than quietly excusing whatever lands there next.

**`DESIGN.md`'s `## Type` section must name every `--text-*` value `tokens.css`
defines** (#138). A token moving without the document following is a red.

**`CLAIMED_HEADROOM_PX` in `inspect.mjs` is a copy of a sum argued in prose in
`chat.css`.** Never move it to match a measurement without moving that sum too.
#138 moved the sum (the title went 46.26 → 46, the line box lost 0.33px) and the
number still held at 65 — that is the correct order.

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

**The profile is per driver PROCESS, not per launch.**

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

## Standing constraints for the renderer

No em dashes in user-visible strings (`tests/copy-em-dash.test.ts` compiles
`src/`; comments are free, and so is anything outside `src/`). D3 — the
stylesheet pins are literal-text and brittle: no comment in `styles/` may contain
a closing brace, `.bubble` and `.message-input` stay ungrouped, `.bubble {` must
stay the first literal occurrence in `chat.css`, exactly one `backdrop-filter` in
all of `styles/`, and the `@import` order in `styles.css` IS the cascade. D4 —
any CSS change owes a driver pin that **executes**, naming which gate runs it;
jsdom loads no CSS, so neither the fast gate nor CI can see layout. The
titlebar's centring is load-bearing (#136). `DESIGN.md` is read literally by
`tests/subagent-material.test.ts`, which splits on `\n## Bans in force\n` — #140
edits that section, so the split token must survive verbatim.

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
run and close **#150** on green. `main` is **20 commits ahead** and has never
been pushed.

Seven older owner-calls remain in `.claude/vibe-130.md`. **#152** and **#155** are
yours in spirit. **#159** is new and is a design question, not a defect: may a
painted size be inherited from the user agent at all? It also folds in the 20px
subagent close glyph, since both are the same "is a glyph a type rung" call.

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
- **A leg may leave a ticket open** (leg 8's precedent, #150) or close it (legs 9
  and 10, #141 and #138). Landing the work and closing the ticket are separate
  decisions: close when everything the acceptance asks for was verifiable without
  a push.

## Related

- [[active-work]] · [[overview]] · [[decisions]] · [[stack]]
