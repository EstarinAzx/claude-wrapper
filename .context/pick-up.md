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

**Relay chain 6 is RUNNING. Leg 5 landed #136 and closed it. ONE ticket remains
in the frontier — #137 — and it is genuinely unblocked** (its declared blocker
#133 is closed).

Confirm rather than trust this. The tracker is the authority and this file has
been wrong before:

```text
gh issue list --state open --label ready-for-agent
```

## The queue

| # | Label | What | Blocked by |
|---|---|---|---|
| 137 | ready-for-agent | Capture the Welcome pane at the minimum window size | #133, **closed** |
| 138–140 | ready-for-human | Type scale · transcript weight pair · mint side-stripe | — |
| 141–147 | needs-triage | Instrument follow-ups — see below | — |

**#137 is the only free ticket. Taking it empties the frontier**, which is this
chain's stop condition — so the leg that lands it also signals done rather than
spawning another.

**Read the "Blocked by" section in the issue body before claiming it** — edges
are prose, not native tracker links.

## Landed this leg

**#136** — the session title now centres on the window instead of on the space
its neighbours leave over. Squash-merged to `main` as `ed81559`, branch deleted.

The offset was `(L - R)/2 + padLeft/2`, confirmed to a tenth of a pixel in four
flank states. Fix is `flex: 1` on both flanks, `flex: 0 1 auto` on the slot, and
the 14px inset moved onto `.logo-mark` — **not** onto a flank's box, where
`box-sizing: border-box` re-creates the same defect at +7css.

**The ticket's +21 was the docks-open case. The welcome screen ran at +77.9**,
because the right flank is 113px narrower before a project is open.

**Filed #147** (`needs-triage`): the DOM phase's drivers share one Electron
profile, so any driver pinning bounds or zoom silently reds later ones.

## The new landmine, and it is about instruments

**A driver that pins state outliving its process must launch with its own
`--user-data-dir`.** `gui-136` did not, and reded `gui-69` and `gui-70` — both
of which pass alone. It took four full phase runs to attribute, and the run that
settled it was the *withheld* one: same CSS change, driver removed, batch clean.

Three things to carry (full version in
[[2026-08-11-the-batch-is-the-instrument-and-a-teardown-is-a-promise]]):

1. **The batch is the instrument.** An adjacency check — run the suspect, then
   the victim — passed here and was wrong. The effect accumulates through the
   intervening launches. Do not attribute a batch-only red with a pair.
2. **A teardown is a promise that goes unkept precisely when it matters.**
   Restoring borrowed state on exit does not run when a driver throws or times
   out, which is the population that leaves the profile dirty. Isolation is a
   property of the launch; prefer it.
3. **"Passes alone, fails in the batch" is a question, not a category.** That is
   the literal wording of `DOM_SKIP`'s `desktop-exclusive` entry, and two healthy
   drivers were one shrug from being quarantined under it for another driver's
   bug. Attribute to a cause before assigning a name.

## The DOM phase

```bash
npm run build
npm run test:dom                          # 30 drivers, ~12 min
npm run test:dom -- --only gui-136.mjs    # one driver
npm run test:dom -- --list                # what runs, what does not, and why
```

**Current state: 29/30, the single red being `gui-123` (#143)** — the documented
one, unchanged and still unexplained. Do not quarantine it.

**It dirties the working tree.** Several drivers hardcode `scripts/gui-<n>-shots/`
and those PNGs are tracked. `git checkout -- scripts/` and `git clean -fdq
scripts/` before committing anything else (**#146**).

**Do not pipe it through `tail`** when you need the verdict: a pipeline reports
`tail`'s exit status, so a failing phase came back as exit 0 this leg while the
text said `DOM PHASE FAIL`. Redirect to a file and grep it.

## Baseline — READ IT, do not trust it

`main` = `ed81559`. typecheck clean, build clean, **88 files / 1325 passed +
36 skipped** (was 88 / 1321 + 36: +4 source checks, files and skips unchanged).

The 36 skips are by design — one per driver with no source-level sidecar. There
are now **39 drivers and 3 sidecars** (`gui-96`, `gui-98`, `gui-136`).

Gate ran on the branch and **again on `main` after the merge**.

**Commits sit UNPUSHED — 17 at the time of writing.** D6 stands: **a leg does
not push on its own initiative**. Read the real gap rather than that number:
`git rev-list --count origin/main..main`.

## The landmine on #137 itself

**#137's AC2 cannot be satisfied as written, and that is a finding rather than
an obstacle.** It requires every other surface to be **byte-identical**,
*"proved with a hash comparison, not an eyeball"*.

`titlebar.png` is **not byte-stable** and never was. `.session-title` renders
`basename(cwd)` and the fixture workspace is `mkdtemp`'d, so six random
characters change the glyphs while the box and the text length (43) hold.
Measured across seven runs; the **unmodified** driver spreads *wider* (9084 /
9538 / 9083) than the modified one, so it predates #133. Filed as **#142** with
four candidate fixes, none obviously right, because each trades randomness for a
collision between concurrent runs.

**#136 did not change this.** Centring moved the element's box, not the string
it renders, so the randomness is untouched — but every stored titlebar capture
now differs from a fresh one by a real layout change as well as by noise.

The leg taking #137 should hash the other six surfaces and treat the titlebar by
box and content — or resolve #142 first and hash all seven. **Do not silently
adjust a capture to green a hash.**

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
3. **D4 — any CSS change owes a driver pin, and now it runs.** Cite the asserting
   line and say plainly whether it executes in `npm test` or only in
   `npm run test:dom`. jsdom loads no CSS, so the fast gate structurally cannot
   see a layout regression.
4. **The titlebar's centring is now load-bearing** (#136). Horizontal padding on
   `.titlebar`, `.titlebar-left` or `.titlebar-right` reds `gui-136` by half its
   width; so does a `min-width: 0` on `.titlebar-left`, or letting
   `.titlebar-center` grow.
5. **The identity mark is SOLID BY DESIGN.** No glyph, ever.
6. **Colour, translucency and material are instrument artifacts in any capture** —
   the authored wash is composited by Windows over OS acrylic and no driver can
   see a DWM backdrop. A flat ground in a screenshot is not a defect.
7. **`.claude/vibe.md` binds this chain** — six decisions stand after cross-model
   attack. Two live owner-calls sit there under `## Needs you`; **seven older ones
   are in `.claude/vibe-130.md`**, and every reference pointing at
   `.claude/vibe.md` for those is stale.
8. **`DESIGN.md` is read literally by a test.** `tests/subagent-material.test.ts`
   splits on `\n## Bans in force\n` and asserts inside that section.

## Rules this chain runs under

- **Do not push on your own initiative** (D6).
- **Do not apply `ready-for-human`** — banned for this batch. A blocker becomes
  `needs-info` + a comment + a `PushNotification`.
- **File follow-ups at `needs-triage`, never `ready-for-agent`.** The chain stops
  on an empty frontier; a leg promoting its own follow-up there makes the stop
  condition unreachable by construction. Leg 5 filed #147 correctly.
- **Do not restart the gauntlet.** `.claude/gauntlet.md` carries `stop: true` at
  `plateau: 3`, so `/preset gauntlet` halts at its seed guard — correctly.
  Restarting needs the owner to answer **#138–#140** and the stop-signal question
  recorded as owner call 14 in that file.
