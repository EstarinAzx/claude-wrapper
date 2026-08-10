---
type: active-work
project: claude-wrapper
updated: 2026-08-11
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-11 00:55 by Opus 5, relay chain 6 leg 1 — owner away_
_At commit: `78afd56` on `main`_

## Current focus

**#132 landed: the gate now executes the GUI drivers' source-level assertions.**
About 38 `gui-*.mjs` drivers encoded real contracts and `npm test` ran none of
them — during the `core-surfaces` gauntlet run one edit turned two assertions red
and the three gate runs that followed all reported green.

The chain continues. **Four tickets are unblocked**: closing #132 released #135
and #136, which were waiting on it.

## State

- **In flight:** nothing. `ticket/132-source-level-driver-assertions` was
  squash-merged and deleted. Tree clean on `main`.
- **Closed 2026-08-11:** **#132** (`78afd56`). **Filed:** **#141** at
  `needs-triage` — the two build-artifact assertions #132 deliberately left out.
- **Open:** #133, #134, #135, #136, #137 (`ready-for-agent`) · #138, #139, #140
  (`ready-for-human`) · #141 (`needs-triage`). **Frontier: #133, #134, #135,
  #136.** #137 still waits on #133.
- **Gate on `main` after the merge:** typecheck clean, build clean,
  **86 files / 1301 passed + 36 skipped** (was 85 / 1295). Ran on the branch and
  again on `main`. **Read the number off `main`, never off this file.**
- **NOT PUSHED. Eight commits sit local.** D6 stands: **a leg does not push on
  its own initiative.** Read the real gap rather than this number, it has drifted
  every leg: `git rev-list --count origin/main..main`.

## What #132 delivered, and the shape to copy

A **convention, not a list**: a driver `gui-<n>.mjs` ships a sibling
`gui-<n>.source.mjs` exporting `checks: { name, run() }[]`, `run()` pure,
returning `{ ok, detail }`. `tests/gui-source-assertions.test.ts` **globs** for
sidecars — a new one needs no wiring. **The driver imports the same array**, so
the gated copy cannot drift from the driven one. Documented in the `run-desktop`
SKILL.md.

**The survey came out smaller than the ticket assumed, and that is the finding.**
Reading every `fs.*` call across all 38 drivers: five no-browser static
assertions, only three truly source-level, one of those already pinned by
`subagent-material.test.ts`. **Net-new coverage is two** — gui-96 criteria 2
and 6 — and grepping `tests/` for `font-weight.*500`, `subagent-slide` and
`translateY` returns **nothing**, so those two were protected solely by a driver
no one ran.

## Pick up here

**Run the frontier query first — it is the authority, and this file has been
wrong before:**

```text
gh issue list --state open --label ready-for-agent
```

Then read the **"Blocked by"** section in the chosen issue body. Edges are prose,
not native tracker links, so an open ticket is not necessarily a free one.

**#135 is the natural next one** — it is the sibling of what just landed (the
DOM-level assertions, plus the empty-state check that has been red for three
waves) and #132 built the classification it will extend. #133 is older and also
free if you prefer strict age order.

## Skills for next session

- **Do not push on your own initiative.** See State.
- **Do not apply `ready-for-human`** — banned for this batch. A blocker becomes
  `needs-info` + a comment + a `PushNotification`.
- **File follow-ups at `needs-triage`, never `ready-for-agent`.** This chain
  stops on an empty frontier; a leg promoting its own follow-up there makes the
  stop condition unreachable by construction. #132's leg filed #141 correctly.

## Open questions

**TWO** live owner-calls in `.claude/vibe.md` under `## Needs you`, both
reversible with the default already taken (may a gauntlet wave commit RED; is the
identity mark's solidity deliberate). **SEVEN older ones live in
`.claude/vibe-130.md`** — every reference pointing at `.claude/vibe.md` for those
is stale. Plus **#138–#140** (`ready-for-human`) and the gauntlet stop-signal
question recorded as owner call 14 in `.claude/gauntlet.md`.

## Recent context

- **The `.source.mjs` convention does NOT fit the build-artifact case as
  written** — `run()` is specified pure, no `out/` access. Extending it needs a
  second export or a requirement flag; that is #141's design work, not a detail.
- **The criterion-6 red-verify was placed in the `to` stop only.** A lazy
  `\{([\s\S]*?)\}` body extraction reads `from`, sees `translateY`, and passes —
  the brace-counting version reds, and its `stops: 2` is the evidence it read the
  whole body. The mutation proves the check *and* its implementation.
- **Both mutations were restored byte-identical against git**, verified with
  `git diff`, not eyeballed.
- **overview.md said 37 drivers; the real count is 38.** Corrected. The two new
  `.source.mjs` sidecars are NOT drivers and are excluded from that count.
- Added phase costs ~11–27ms of test time. Before 69.15s / 63.40s, after 63.53s /
  61.10s — less than the baseline varies against itself.

## Related

- [[overview]] · [[pick-up]] · [[decisions]] · [[stack]] · [[happy-path]] · [[flows]]
- [[2026-08-11-a-check-nobody-runs-is-not-a-check]]
- [[2026-08-10-a-blank-capture-is-proven-in-the-dom-not-in-the-pixels]]
