---
type: pick-up
project: claude-wrapper
updated: 2026-08-11
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Where the chain is

**Relay chain 6 is RUNNING. Leg 2 landed #133 and closed it. The queue is NOT
empty — keep going.**

Closing #133 **unblocked #137**, which was waiting on it. Nothing in the queue is
blocked any more.

Confirm rather than trust this — the tracker is the authority and this file has
been wrong before:

```text
gh issue list --state open --label ready-for-agent
```

## The queue

| # | Label | What | Blocked by |
|---|---|---|---|
| 134 | ready-for-agent | Remove em dashes from user-visible copy | — |
| 135 | ready-for-agent | Run the DOM-level driver assertions; resolve the red empty-state check | — |
| 136 | ready-for-agent | Centre the session title in the titlebar | — |
| 137 | ready-for-agent | Capture the Welcome pane at the minimum window size | **freed by #133** |
| 138–140 | ready-for-human | Type scale · transcript weight pair · mint side-stripe | — |
| 141 | needs-triage | The two build-artifact driver assertions (filed by leg 1) | — |
| 142 | needs-triage | `titlebar.png` is not byte-stable (filed by leg 2) | — |

**The frontier is #134, #135, #136, #137 — all four are free.** Blocking edges
are prose in each issue body, not native tracker links, so **read the "Blocked
by" section before claiming a ticket** rather than assuming an open one is free.

**#137 is the natural next pick** — same file, same capture stage, #133 was its
declared blocker, and #133 just built the `stage` / `requires` / loud-failure
machinery it extends. **Read the landmine below first: its AC2 as written cannot
be satisfied.** #134 is older and equally free if you prefer strict age order.

## Landed this leg

**#133** — `inspect.mjs` now photographs the three right-hand docks. Squash-merged
to `main` as `5e1b6b0`, branch deleted. Five surfaces → **eight**, seven files →
**ten**, with `EXPECTED_FILES` still derived (`SURFACES.length + 2`).

The mechanism to copy: a dock surface declares `stage: 'dock'` plus `open`, the
aria-label of the titlebar control that reveals it. All three docks share one
slot, so opening the next closes the last and the loop needs no close step. Full
write-up in the driver's own header and
[[2026-08-11-an-instrument-may-not-photograph-a-state-the-app-calls-impossible]].

### Three things that outlive the ticket

1. **An instrument must not force the app into a state the app calls
   impossible.** `useZoom` applies its persisted 1.25 on mount; the driver then
   set the factor to 1 *afterwards*, leaving the window at 1440 CSS px while the
   app believed 1.25 — a disagreement `useZoom` calls impossible in its own
   words. Nothing photographed it for two tickets, until the Appearance dock
   arrived and printed **"125%" over a demonstrably 100% window**. Seeded
   `zoom-level-v2` and reloaded before the folder pick; *seeded* not stepped,
   because `nextZoom(level, 'reset')` returns DEFAULT_ZOOM, not 1.
2. **A grep for an attribute is not a coverage measurement.** `tests/` contains
   no `aria-label="Agents"` anywhere, which looks like the dock labels are
   unpinned. Mutating one reds **six** existing tests — they pin it through
   `getByRole('complementary', { name: 'Commands' })`. An accessible-name query
   pins a label without ever spelling it as an attribute. The grep said "pinned
   nowhere"; the mutation refuted it in one run.
3. **All three docks wear the class `agents-dock`.** The commands and appearance
   asides are `agents-dock commands-dock` / `agents-dock appearance-dock`, so a
   `.agents-dock` selector matches whichever one is open and writes it out under
   the wrong filename — a wrong capture rather than a missing one.

## Baseline — READ IT, do not trust it

`main` = `5e1b6b0`. typecheck clean, build clean, **87 files / 1313 passed +
36 skipped** (was 86 / 1301 + 36: +1 file, +12 tests, skips unchanged).

**The 36 skips are by design, not a regression** — one per driver with no
source-level sidecar, each carrying its reason. A run reporting zero skips here
means the skip list broke, not that coverage improved.

Gate ran on the branch and **again on `main` after the merge**.

**Commits sit UNPUSHED — 10 at the time of writing.** D6 stands: **a leg does not
push on its own initiative**. Read the real gap rather than that number, it has
drifted every leg: `git rev-list --count origin/main..main`.

## The landmine for #137

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
silently adjust a capture to make a hash go green.**

## Standing constraints for any leg touching the renderer

1. **D3 — the stylesheet pins are literal-text and brittle.** Three tests scan
   the whole `styles/` directory; **no comment anywhere in `styles/` may contain
   a closing brace**; `.bubble` and `.message-input` stay ungrouped; **`.bubble {`
   must stay the FIRST literal occurrence of that string in `chat.css`**;
   **exactly ONE `backdrop-filter` in all of `styles/`**; the `@import` order in
   `styles.css` IS the cascade, so add rules inside a file and never reorder.
2. **D4 — any CSS change owes a driver pin.** jsdom loads no CSS and an unknown
   `var()` resolves silently to nothing. Since #132 the source-level subset runs
   in the gate; the DOM-level assertions still do not (that is #135). So cite the
   asserting line, and **say plainly whether it executes in the gate or only when
   a human runs the driver.**
3. **The identity mark is SOLID BY DESIGN.** No glyph, ever.
4. **Colour, translucency and material are instrument artifacts in any capture** —
   the authored wash is composited by Windows over OS acrylic and no driver can
   see a DWM backdrop. A flat ground in a screenshot is not a defect.
5. **`.claude/vibe.md` binds this chain** — six decisions stand after cross-model
   attack. Two live owner-calls sit there under `## Needs you`; **seven older ones
   are in `.claude/vibe-130.md`**, and every reference pointing at
   `.claude/vibe.md` for those is stale.
6. **#136 touches `.session-title`, which is #142's subject.** Whoever centres
   that title is editing the element whose rendered content makes `titlebar.png`
   unstable. Worth reading #142 first — the two may want to land together.

## Rules this chain runs under

- **Do not push on your own initiative** (D6).
- **Do not apply `ready-for-human`** — banned for this batch. A blocker becomes
  `needs-info` + a comment + a `PushNotification`.
- **File follow-ups at `needs-triage`, never `ready-for-agent`.** The chain stops
  on an empty frontier; a leg promoting its own follow-up there makes the stop
  condition unreachable by construction.
- **Do not restart the gauntlet.** `.claude/gauntlet.md` carries `stop: true` at
  `plateau: 3`, so `/preset gauntlet` halts at its seed guard — correctly.
  Restarting needs the owner to answer **#138–#140** and the stop-signal question
  recorded as owner call 14 in that file.
