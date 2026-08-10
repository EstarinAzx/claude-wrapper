---
type: pick-up
project: claude-wrapper
updated: 2026-08-11
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Where the chain is

**Relay chain 6 is RUNNING. Leg 1 landed #132 and closed it. The queue is NOT
empty — keep going.**

Closing #132 **unblocked #135 and #136**, which were both waiting on it. So the
frontier grew rather than shrank.

Confirm rather than trust this — the tracker is the authority and this file has
been wrong before:

```text
gh issue list --state open --label ready-for-agent
```

## The queue

| # | Label | What | Blocked by |
|---|---|---|---|
| 133 | ready-for-agent | Extend `inspect.mjs` to reach the three right-hand docks | — |
| 134 | ready-for-agent | Remove em dashes from user-visible copy | — |
| 135 | ready-for-agent | Run the DOM-level driver assertions; resolve the red empty-state check | **freed by #132** |
| 136 | ready-for-agent | Centre the session title in the titlebar | **freed by #132** |
| 137 | ready-for-agent | Capture the Welcome pane at the minimum window size | **#133, still open** |
| 138–140 | ready-for-human | Type scale · transcript weight pair · mint side-stripe | — |
| 141 | needs-triage | The two build-artifact driver assertions (filed by leg 1) | — |

**The frontier is #133, #134, #135, #136.** Blocking edges are prose in each
issue body, not native tracker links — **read the "Blocked by" section before
claiming a ticket** rather than assuming any open one is free.

**#135 is the natural next pick.** It is the direct sibling of what just landed:
#132 built the source-level half and the classification #135 extends, and #135
also owns the empty-state check that has been red for three waves. #133 is older
and equally free if you prefer strict age order.

## Landed this leg

**#132** — the gate now executes the GUI drivers' source-level assertions.
Squash-merged to `main` as `78afd56`, branch deleted.

The mechanism to copy: a driver `gui-<n>.mjs` ships a sibling
**`gui-<n>.source.mjs`** exporting `checks: { name, run() }[]`, `run()` pure,
returning `{ ok, detail }`. `tests/gui-source-assertions.test.ts` **globs** for
sidecars, so a new one needs no wiring; **the driver imports the same array**, so
the gated copy cannot drift from the driven one. Full write-up in the
`run-desktop` SKILL.md and [[2026-08-11-a-check-nobody-runs-is-not-a-check]].

### Three things that outlive the ticket

1. **The survey was smaller than the ticket assumed.** It expected "roughly six"
   source-level assertions; reading every `fs.*` call across all 38 drivers found
   **five** no-browser static ones, only **three** truly source-level, one of
   those already pinned by `subagent-material.test.ts`. Net-new coverage is
   **two**. Grepping `tests/` for `font-weight.*500`, `subagent-slide` and
   `translateY` returns **nothing** — those two contracts were protected solely
   by a driver no one ran.
2. **A mutation's placement is part of the test.** The criterion-6 red-verify was
   put in the `to` stop **only**. A lazy `\{([\s\S]*?)\}` extraction reads `from`,
   sees `translateY`, and passes; the brace-counting version reds and its
   `stops: 2` proves it read the whole body. The run verified the check *and* its
   implementation. Copy this when red-verifying anything with nested structure.
3. **The convention does not cover `out/`.** `run()` is specified pure, so
   `gui-75` and `gui-93` (which read the built bundle and built CSS) are excluded
   — the gate does not build, and gating them would red a clean checkout for a
   reason unrelated to the contract. They are reported as **named skips carrying
   that reason**, and the design question went to **#141**, not a guess.

## Baseline — READ IT, do not trust it

`main` = `78afd56`. typecheck clean, build clean, **86 files / 1301 passed +
36 skipped** (was 85 / 1295: +1 file, +6 tests, +36 named skips).

**The 36 skips are by design, not a regression** — one per driver with no
source-level sidecar, each carrying its reason. A run that reports zero skips
here means the skip list broke, not that coverage improved.

Gate ran on the branch and **again on `main` after the merge**.

**Commits sit UNPUSHED — 8 at the time of writing.** D6 stands: **a leg does not
push on its own initiative**; the pushes on record were explicit one-off owner
instructions. Read the real gap rather than that number, it has drifted every
leg: `git rev-list --count origin/main..main`.

## Standing constraints for any leg touching the renderer

1. **D3 — the stylesheet pins are literal-text and brittle.** Three tests scan
   the whole `styles/` directory; **no comment anywhere in `styles/` may contain
   a closing brace**; `.bubble` and `.message-input` stay ungrouped; **`.bubble {`
   must stay the FIRST literal occurrence of that string in `chat.css`**;
   **exactly ONE `backdrop-filter` in all of `styles/`**; the `@import` order in
   `styles.css` IS the cascade, so add rules inside a file and never reorder.
2. **D4 — any CSS change owes a driver pin.** jsdom loads no CSS and an unknown
   `var()` resolves silently to nothing. **Since #132 the source-level subset
   finally runs** — but the DOM-level assertions still do not (that is #135). So
   the rule is unchanged in spirit: cite the asserting line, and **say plainly
   whether it executes in the gate or only when a human runs the driver.**
3. **The identity mark is SOLID BY DESIGN.** No glyph, ever.
4. **Colour, translucency and material are instrument artifacts in any capture** —
   the authored wash is composited by Windows over OS acrylic and no driver can
   see a DWM backdrop. A flat ground in a screenshot is not a defect.
5. **`.claude/vibe.md` binds this chain** — six decisions stand after cross-model
   attack. Two live owner-calls sit there under `## Needs you`; **seven older ones
   are in `.claude/vibe-130.md`**, and every reference pointing at
   `.claude/vibe.md` for those is stale.

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
