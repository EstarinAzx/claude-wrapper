---
type: active-work
project: claude-wrapper
updated: 2026-08-11
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-11 by Opus 5, relay chain 6 leg 4 — owner away_
_At commit: `56a25cb` on `main`_

## Current focus

**#135 landed: the DOM-level driver assertions execute.** `npm run test:dom`
launches 29 drivers, one real Electron window each, ~7 minutes, and reads each
driver's exit code as the verdict. Together with #132's pure half, the drivers
are no longer a folder of checks nobody runs.

The chain continues. **Two tickets remain, both genuinely unblocked** — #136 and
#137, whose declared blockers (#132, #133) are both closed.

## State

- **In flight:** nothing. `ticket/135-dom-driver-phase` was squash-merged and
  deleted. Tree clean on `main`.
- **Closed 2026-08-11:** **#135** (`56a25cb`). **Filed: #143, #144, #145, #146**,
  all at `needs-triage`.
- **Open:** #136, #137 (`ready-for-agent`) · #138, #139, #140 (`ready-for-human`)
  · #141, #142, #143, #144, #145, #146 (`needs-triage`). **Frontier: #136, #137**
  — blocked-by sections read on both, both blockers closed.
- **Gate on `main` after the merge:** typecheck clean, build clean,
  **88 files / 1321 passed + 36 skipped** (was 88 / 1317 + 36; the +4 are the
  DOM-phase accounting tests). Ran on the branch and again on `main`.
  **Read the number off `main`, never off this file.**
- **NOT PUSHED. Fourteen commits sit local.** D6 stands: **a leg does not push on
  its own initiative.** Read the real gap rather than this number, it has drifted
  every leg: `git rev-list --count origin/main..main`.

## The new phase, and the one thing to know before running it

```bash
npm run build
npm run test:dom                          # 29 drivers, ~7 min
npm run test:dom -- --only gui-91.mjs     # one driver
npm run test:dom -- --list                # what runs, what does not, and why
```

**`npm run test:dom` currently exits 1**, on `gui-123` — see below. That is a
real finding left deliberately unsilenced, not a broken phase.

**It dirties the working tree.** Several drivers hardcode
`scripts/gui-<n>-shots/` and ignore `SCREENSHOT_DIR`, and those PNGs are tracked.
Run `git checkout -- scripts/` before committing anything else, or a real change
disappears into a diff full of regenerated screenshots. Filed as **#146**.

## The two reds the phase found on its first run

**`gui-123` is RED and stays red** (**#143**). It reports the reuse control
unreachable by Tab in 60 presses — reproducible alone and in the batch, 3 of 4
runs, the one green being the very first run of the day. #135 changed **no file
under `src/`**, so the app binary is byte-identical and this is not from that
work. Either the control genuinely is not reachable, or the driver's press budget
is coupled to how many rows the rail happens to list. The green-then-red flip is
the thing to explain. **Do not quarantine it to make the phase green** — a red
nobody can explain is not a red anybody may silence.

**`gui-119` is quarantined** as `desktop-exclusive` (**#145**), with the
measurement rather than a shrug: it passes alone twice (three re-asserts
recorded, stress 8/8) and fails in the batch (zero calls, 7/8). Both its
witnesses are the real desktop foreground. Run it with
`npm run test:dom -- --only gui-119.mjs` on an idle desktop.

## What #135 could not deliver

**AC1's CI clause.** The repo has no `.github/` and no CI at all, so "runs on
every push" has nowhere to run. A workflow was deliberately not invented — on a
headless runner `gui-91` and `gui-124` spawn the real `claude` CLI, `gui-119`
needs a real desktop, and nothing has ever been pushed from this checkout.
Filed as **#144**, including the uncomfortable question: if the phase stays
local, what makes anybody run it?

## The transferable halves

**A protocol nobody reads is not a protocol.** Every driver had shipped
`process.exit(fails.length === 0 ? 0 : 1)` since the first one, and for
thirty-eight tickets the only consumer was a human reading stdout. That is how
`gui-42.mjs` came to print `FAIL` under an unconditional `process.exit(0)` and
stay that way. Fixed — and the shape is now caught as `LIED`, because the next
driver to do it will not announce itself either.

**A pin you have not seen fail is a pin you have not written.** The gui-91
replacement assertion was vacuous for the case that mattered, and only the AC2
break revealed it: flipping `.bg-sessions-empty` to `flex-direction: row` puts
the note *beside* the answer, and `innerText` **still reported two lines**,
because flex items are block-level boxes whichever direction the container runs.
Box geometry is what catches a side-by-side. The break that demonstrates a check
is real is also the only thing that tells you what it is blind to.

## Pick up here

**Run the frontier query first — it is the authority, and this file has been
wrong before:**

```text
gh issue list --state open --label ready-for-agent
```

Then read the **"Blocked by"** section in the chosen issue body. Edges are prose,
not native tracker links.

**#136 is the oldest and is free.** Its blocked-by line asked for #132 "so the
pin in the fifth criterion is a real check rather than a file nothing runs" —
which is now *more* true than when it was written: a driver pin added for #136
will actually execute, in the phase. **Read the #142 warning below first.**

## The landmine, unchanged and touching both remaining tickets

**#137's AC2 cannot be satisfied as written, and that is a finding rather than an
obstacle.** It requires every other surface to be **byte-identical**, *"proved
with a hash comparison, not an eyeball"*.

`titlebar.png` is **not byte-stable**, and never was. `.session-title` renders
`basename(cwd)` and the fixture workspace is `mkdtemp`'d, so six random characters
change the glyphs while the box and text length (43) hold. Measured across seven
runs, and the **unmodified** driver spreads *wider* (9084 / 9538 / 9083) than the
modified one, so this predates #133. Filed as **#142** with four candidate fixes,
none obviously right, because each trades randomness for a collision between
concurrent runs.

A leg taking #137 should hash the other six surfaces and treat the titlebar by
box and content — or resolve #142 first and hash all seven. **Do not silently
adjust a capture to make a hash go green.**

**#136 is the other half of the same subject**: centring the session title means
editing the element whose rendered content makes `titlebar.png` unstable. Worth
reading #142 first; the two may want to land together.

## Skills for next session

- **Do not push on your own initiative.** See State.
- **Do not apply `ready-for-human`** — banned for this batch. A blocker becomes
  `needs-info` + a comment + a `PushNotification`.
- **File follow-ups at `needs-triage`, never `ready-for-agent`.** This chain stops
  on an empty frontier; a leg promoting its own follow-up there makes the stop
  condition unreachable by construction.
- **Any CSS change now owes a driver pin that actually runs** (D4, finally real).
  Cite the asserting line, and say whether it executes in `npm test` or only in
  `npm run test:dom`.
- **Do not pipe the phase through `tail`** when you need a failure detail. It ate
  `gui-123`'s output on the second full run and cost a re-run to recover.

## Open questions

**TWO** live owner-calls in `.claude/vibe.md` under `## Needs you`, both
reversible with the default already taken. **SEVEN older ones live in
`.claude/vibe-130.md`** — every reference pointing at `.claude/vibe.md` for those
is stale. Plus **#138–#140** (`ready-for-human`) and the gauntlet stop-signal
question recorded as owner call 14 in `.claude/gauntlet.md`.

## Recent context

- **`tests/copy-em-dash.test.ts` still binds** (#134): a new user-visible string
  with an em dash reds the suite. Comments are free.
- **D3 stands unchanged** — the stylesheet pins are literal-text and brittle. No
  comment in `styles/` may contain a closing brace; `.bubble {` must stay the
  first literal occurrence in `chat.css`; exactly one `backdrop-filter` in all of
  `styles/`; the `@import` order in `styles.css` IS the cascade.
- **`DESIGN.md` is read literally by `tests/subagent-material.test.ts`**, which
  splits on `\n## Bans in force\n`.

## Related

- [[overview]] · [[pick-up]] · [[decisions]] · [[stack]] · [[happy-path]] · [[flows]]
- [[2026-08-11-a-protocol-nobody-reads-is-not-a-protocol]]
- [[2026-08-11-a-check-nobody-runs-is-not-a-check]]
- [[2026-08-11-a-ban-that-lives-in-prose-does-not-run]]
