---
type: pick-up
project: claude-wrapper
updated: 2026-08-11
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Where the chain is

**Relay chain 6 is RUNNING. Leg 3 landed #134 and closed it. The queue is NOT
empty — keep going.**

Three tickets remain and **all three are genuinely unblocked**: the only declared
blockers in the whole frontier are #132 and #133, and both are closed.

Confirm rather than trust this — the tracker is the authority and this file has
been wrong before:

```text
gh issue list --state open --label ready-for-agent
```

## The queue

| # | Label | What | Blocked by |
|---|---|---|---|
| 135 | ready-for-agent | Run the DOM-level driver assertions; resolve the red empty-state check | #132, **closed** |
| 136 | ready-for-agent | Centre the session title in the titlebar | #132, **closed** |
| 137 | ready-for-agent | Capture the Welcome pane at the minimum window size | #133, **closed** |
| 138–140 | ready-for-human | Type scale · transcript weight pair · mint side-stripe | — |
| 141 | needs-triage | The two build-artifact driver assertions (filed by leg 1) | — |
| 142 | needs-triage | `titlebar.png` is not byte-stable (filed by leg 2) | — |

**The frontier is #135, #136, #137 — all three free**, blocked-by sections read
this leg rather than inferred. Edges are prose in each issue body, not native
tracker links, so **read the "Blocked by" section before claiming a ticket**.

**#135 is the oldest and the natural pick.** It runs the DOM-level driver
assertions — the half #132 deliberately left out and reported as named skips —
and resolves the red empty-state check. It is also what would make constraint D4
below actually bite. #136 and #137 are equally free; **read the landmine before
starting either of them.**

## Landed this leg

**#134** — em dashes gone from user-visible copy, and the ban is now a test.
Squash-merged to `main` as `8b93fd5`, branch deleted. Fifteen strings rewritten
across the titlebar, composer, sessions rail, tool card, delete failure,
attachment policy and the two rewind refusals.

**Nothing was filed.** Nothing broken surfaced that was not fixed in the ticket.

### Three things that outlive the ticket

1. **A ban that lives in prose does not run.** `tests/copy-em-dash.test.ts`
   compiles every file in `src/` with esbuild and fails on an em dash surviving
   in the output — **the compiler classifies, not a regex**. A grep returns
   **~767 hits** and nearly all are comments, because this repo comments in em
   dashes deliberately; the obvious filter ("skip lines starting with `//`")
   misses a dash inside a multi-line template and mis-reads a comment that wraps.
   What survives a transform *is* the strings, template spans and JSX text a user
   can read.
2. **A separator chosen for the label you happened to be looking at is a bug
   waiting for the label you were not.** The rail's foreign-row title is now
   `label (groupLabel)`, because `label` is not a noun phrase: an enriched row
   (#49) carries the session's first user prompt **verbatim and untruncated**, so
   it is routinely a whole sentence ending in its own full stop. `Fix the parser.
   It crashes on empty input. in D:\projects\other` reads as a fragment. The
   `Unknown project` branch killed the rest — `groupLabel` is
   `cwd || UNKNOWN_PROJECT`, sometimes a path and sometimes a label.
3. **Sweep for test assertions fragment-by-fragment, never by whole string.** Six
   tests pinned an affected string by exact text. Four were found by grepping the
   strings; **two only surfaced when the suite ran red**, because the assertions
   held fragments. Check `.claude/skills/run-desktop/` and `scripts/inspect.mjs`
   too, not only `tests/`.

## The new gate constraint — it will bite any leg that writes copy

**`tests/copy-em-dash.test.ts` runs in `npm test`.** A new user-visible string
containing an em dash **reds the suite**. Comments are free and stay free.

If you ever touch that file:

- **`minifyWhitespace: true` is load-bearing.** A plain esbuild transform keeps
  comments attached to object-literal properties (`src/preload/index.ts` alone
  has seven, all reported as copy on the first run).
- **It runs under `// @vitest-environment node`.** esbuild asserts
  `new TextEncoder().encode('') instanceof Uint8Array`, which jsdom's cross-realm
  `TextEncoder` fails, so under the suite's default jsdom it will not load at all.

## Baseline — READ IT, do not trust it

`main` = `8b93fd5`. typecheck clean, build clean, **88 files / 1317 passed +
36 skipped** (was 87 / 1313 + 36: +1 file, +4 tests, skips unchanged).

**The 36 skips are by design, not a regression** — one per driver with no
source-level sidecar, each carrying its reason. A run reporting zero skips here
means the skip list broke, not that coverage improved.

Gate ran on the branch and **again on `main` after the merge**.

**Commits sit UNPUSHED — 12 at the time of writing.** D6 stands: **a leg does not
push on its own initiative**. Read the real gap rather than that number, it has
drifted every leg: `git rev-list --count origin/main..main`.

## The landmine, now touching two tickets

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

**#136 is the other half of the same subject**: centring the session title means
editing the element whose rendered content makes `titlebar.png` unstable. Worth
reading #142 first — the two may want to land together.

## Standing constraints for any leg touching the renderer

1. **No em dashes in any user-visible string** — now enforced, see above.
2. **D3 — the stylesheet pins are literal-text and brittle.** Three tests scan
   the whole `styles/` directory; **no comment anywhere in `styles/` may contain
   a closing brace**; `.bubble` and `.message-input` stay ungrouped; **`.bubble {`
   must stay the FIRST literal occurrence of that string in `chat.css`**;
   **exactly ONE `backdrop-filter` in all of `styles/`**; the `@import` order in
   `styles.css` IS the cascade, so add rules inside a file and never reorder.
3. **D4 — any CSS change owes a driver pin.** jsdom loads no CSS and an unknown
   `var()` resolves silently to nothing. Since #132 the source-level subset runs
   in the gate; the DOM-level assertions still do not (**that is #135**). So cite
   the asserting line, and **say plainly whether it executes in the gate or only
   when a human runs the driver.**
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
  condition unreachable by construction.
- **Do not restart the gauntlet.** `.claude/gauntlet.md` carries `stop: true` at
  `plateau: 3`, so `/preset gauntlet` halts at its seed guard — correctly.
  Restarting needs the owner to answer **#138–#140** and the stop-signal question
  recorded as owner call 14 in that file.
