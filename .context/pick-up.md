---
type: pick-up
project: claude-wrapper
updated: 2026-08-11
tags: [context, pick-up]
---

# Pick up

## FIRST, BEFORE ANY WORK — owner instruction, 2026-08-11

**Call `ScheduleWakeup` with `delaySeconds: 900` and then continue.** Pass the
`/relay` input back verbatim as the `prompt` so this leg resumes itself, and say
in `reason` that the owner asked each leg to pace at 15 minutes. Do this as the
first action of the leg, before picking a ticket. It is a pacing instruction from
the owner, not a condition to wait on — schedule it and get on with the work.

Then: read `.context/overview.md` + `active-work.md`.

## Where the chain is

**Relay chain 6 is RUNNING. Leg 4 landed #135 and closed it. The queue is NOT
empty — keep going.**

Two tickets remain and **both are genuinely unblocked**: the declared blockers in
the whole frontier are #132 and #133, and both are closed.

Confirm rather than trust this — the tracker is the authority and this file has
been wrong before:

```text
gh issue list --state open --label ready-for-agent
```

## The queue

| # | Label | What | Blocked by |
|---|---|---|---|
| 136 | ready-for-agent | Centre the session title in the titlebar | #132, **closed** |
| 137 | ready-for-agent | Capture the Welcome pane at the minimum window size | #133, **closed** |
| 138–140 | ready-for-human | Type scale · transcript weight pair · mint side-stripe | — |
| 141, 142 | needs-triage | Build-artifact driver assertions · `titlebar.png` not byte-stable | — |
| 143–146 | needs-triage | Filed by leg 4 — see below | — |

**The frontier is #136 and #137, both free**, blocked-by sections read this leg
rather than inferred. Edges are prose in each issue body, not native tracker
links, so **read the "Blocked by" section before claiming a ticket**.

**#136 is the oldest and the natural pick.** Its blocked-by line asked for #132
*"so the pin in the fifth criterion is a real check rather than a file nothing
runs"* — which is now more true than when it was written, because a driver pin
added for #136 will actually execute (see the phase, below). **#136 and #137 are
two halves of one subject; read the landmine before starting either.**

## Landed this leg

**#135** — the DOM-level driver assertions execute. Squash-merged to `main` as
`56a25cb`, branch deleted.

```bash
npm run build
npm run test:dom                          # 29 drivers, one Electron window each, ~7 min
npm run test:dom -- --only gui-91.mjs     # one driver
npm run test:dom -- --list                # what runs, what does not, and why
```

**Filed four, all `needs-triage`:** **#143** (gui-123 red), **#144** (no CI runs
the phase), **#145** (gui-119 batch-safety), **#146** (the phase rewrites tracked
screenshots).

### Three things that outlive the ticket

1. **A protocol nobody reads is not a protocol.** Every one of the 38 drivers had
   shipped `process.exit(fails.length === 0 ? 0 : 1)` since the first one, and
   the only consumer was ever a human reading stdout. That is how `gui-42.mjs`
   came to print `FAIL` under an unconditional `process.exit(0)` and stay that
   way. A convention with no consumer has never been tested, so its violations
   look exactly like compliance.
2. **A pin you have not seen fail is a pin you have not written.** The
   replacement gui-91 assertion (`innerText` reports two lines) was **vacuous for
   the case that mattered**: flipping `.bg-sessions-empty` to
   `flex-direction: row` puts the note *beside* the answer and `innerText` still
   said two lines, because flex items are block-level boxes whichever way the
   container runs. Box geometry is what catches it. The break that proves a check
   is real is the only thing that reveals what it is blind to.
3. **The empty-state argument was won by the copy, not the assertion.** The
   assertion compared a **container's** `textContent` against **one of its two
   lines**. Putting a separator into the markup so the fused read looks right was
   rejected: it edits shipped markup to suit a measuring instrument.

## The new phase — three things that will bite

1. **`npm run test:dom` exits 1 today**, on `gui-123` (**#143**), which reports
   the reuse control unreachable by Tab in 60 presses. Reproducible alone and in
   the batch. #135 changed **no file under `src/`**, so the binary is identical to
   `main`'s and this is not from that work. **Do not quarantine it to green the
   phase** — a red nobody can explain is not a red anybody may silence.
2. **It dirties the working tree.** Several drivers hardcode
   `scripts/gui-<n>-shots/` and ignore `SCREENSHOT_DIR`, and those PNGs are
   tracked. `git checkout -- scripts/` before committing anything else (**#146**).
3. **Do not pipe it through `tail`** when you need a failure detail — that ate
   `gui-123`'s output once already and cost a re-run.

**D4 is finally real.** Any CSS change owes a driver pin that executes. Cite the
asserting line, and **say plainly whether it runs in `npm test` or only in
`npm run test:dom`** — jsdom loads no CSS, so the fast gate structurally cannot
see a layout regression. Proved on one build this leg: `npm test` passed 35/35
with `.bg-sessions-empty` broken, while the phase named the driver, the criterion
and the offending coordinates.

## Baseline — READ IT, do not trust it

`main` = `56a25cb`. typecheck clean, build clean, **88 files / 1321 passed +
36 skipped** (was 88 / 1317 + 36: +4 tests, files and skips unchanged).

**The 36 skips are by design, not a regression** — one per driver with no
source-level sidecar, each carrying its reason, and since this leg each says
*where* it is checked instead. A run reporting zero skips here means the skip
list broke, not that coverage improved.

Gate ran on the branch and **again on `main` after the merge**.

**Commits sit UNPUSHED — 14 at the time of writing.** D6 stands: **a leg does not
push on its own initiative**. Read the real gap rather than that number, it has
drifted every leg: `git rev-list --count origin/main..main`.

## The landmine, touching both remaining tickets

**#137's AC2 cannot be satisfied as written, and that is a finding rather than an
obstacle.** It requires every other surface to be **byte-identical**, *"proved
with a hash comparison, not an eyeball"*.

`titlebar.png` is **not byte-stable**, and it never was. `.session-title` renders
`basename(cwd)`, and the fixture workspace is `mkdtemp`'d — six random characters
change the glyphs while the box and the text length (43) stay fixed. Measured
across seven runs, and the **unmodified** driver spreads *wider* (9084 / 9538 /
9083) than the modified one, so this predates #133 entirely. Filed as **#142**
with four candidate fixes, none obviously right, because each trades randomness
for a collision between concurrent runs.

So the leg taking #137 should hash the other six surfaces and treat the titlebar
by box and content — or resolve #142 first and then hash all seven. **Do not
silently adjust a capture to green a hash.**

**#136 is the other half of the same subject**: centring the session title means
editing the element whose rendered content makes `titlebar.png` unstable. Worth
reading #142 first — the two may want to land together.

## Standing constraints for any leg touching the renderer

1. **No em dashes in any user-visible string** — enforced by
   `tests/copy-em-dash.test.ts`, which compiles `src/` with esbuild. Comments are
   free and stay free.
2. **D3 — the stylesheet pins are literal-text and brittle.** Three tests scan
   the whole `styles/` directory; **no comment anywhere in `styles/` may contain
   a closing brace**; `.bubble` and `.message-input` stay ungrouped; **`.bubble {`
   must stay the FIRST literal occurrence of that string in `chat.css`**;
   **exactly ONE `backdrop-filter` in all of `styles/`**; the `@import` order in
   `styles.css` IS the cascade, so add rules inside a file and never reorder.
3. **D4 — any CSS change owes a driver pin, and now it runs.** See the phase
   section above.
4. **The identity mark is SOLID BY DESIGN.** No glyph, ever.
5. **Colour, translucency and material are instrument artifacts in any capture** —
   the authored wash is composited by Windows over OS acrylic and no driver can
   see a DWM backdrop. A flat ground in a screenshot is not a defect.
6. **`.claude/vibe.md` binds this chain** — six decisions stand after cross-model
   attack. Two live owner-calls sit there under `## Needs you`; **seven older ones
   are in `.claude/vibe-130.md`**, and every reference pointing at
   `.claude/vibe.md` for those is stale.
7. **`DESIGN.md` is read literally by a test.** `tests/subagent-material.test.ts`
   splits on `\n## Bans in force\n` and asserts inside that section. Re-run it
   after editing there.

## Rules this chain runs under

- **Do not push on your own initiative** (D6).
- **Do not apply `ready-for-human`** — banned for this batch. A blocker becomes
  `needs-info` + a comment + a `PushNotification`.
- **File follow-ups at `needs-triage`, never `ready-for-agent`.** The chain stops
  on an empty frontier; a leg promoting its own follow-up there makes the stop
  condition unreachable by construction. Leg 4 filed four, all correctly.
- **Do not restart the gauntlet.** `.claude/gauntlet.md` carries `stop: true` at
  `plateau: 3`, so `/preset gauntlet` halts at its seed guard — correctly.
  Restarting needs the owner to answer **#138–#140** and the stop-signal question
  recorded as owner call 14 in that file.
