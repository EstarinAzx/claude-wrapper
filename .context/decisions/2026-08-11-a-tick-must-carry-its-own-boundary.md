---
type: decision
project: claude-wrapper
date: 2026-08-11
updated: 2026-08-11
tags: [context, decision, ci, testing, dom-phase]
---

# A tick must carry its own boundary

## Decision

**#150 (`622bb8d`).** This repo gets its first CI, and it covers the headless
gate only: `.github/workflows/fast-gate.yml` runs `npm run typecheck`,
`npm test`, `npm run build` on push, and nothing else.

**The coverage boundary is carried in three places, chosen by where the reader
actually looks:**

| place | who sees it |
|---|---|
| the workflow name — `fast-gate`, never `ci` or `tests` | anyone scanning the file list |
| the job name — `fast gate (typecheck, test, build) — does NOT cover the DOM phase` | anyone scanning the **checks list**, which is most people |
| a job summary carrying `if: always()` | anyone who opens a run, including a red one |

The job name is the load-bearing one. A summary is a page you have to open; the
job name is the string rendered next to the green tick, and the tick is what
gets read as "the repo is fine".

`tests/fast-gate-workflow.test.ts` pins all three, plus the command set and a
ban on any workflow invoking `test:dom`. Five mutations, five distinct reds.

**The second call, on the same warrant: the runner is `windows-latest`.** win32
is the only platform this suite has ever been observed green on — every gate run
in the project's history is a win32 run, and the drivers are verified win32 only.

## Why

**Cross-model review had already refuted the version of this ticket that shipped
partial CI quietly:** *"splitting off documentation and partial CI lets the
visible half land while the actual release forcing mechanism remains unresolved.
That creates a green-looking workflow which still cannot enforce the claimed
gate."* Accepted, and the accepted reading is sharper than "add a disclaimer":
**a green check over a repo whose real instrument runs nowhere is worse than no
check at all**, because it converts a known gap into an assumed cover. Before
CI, everyone knew coverage was manual. After a nameless green tick, nobody does.

That is the same failure [[2026-08-11-a-deficit-a-reader-cannot-close-is-furniture]]
closed one level in, and the fix has the same shape: the deficit goes **into**
the thing being read, not underneath it. There it was the verdict line; here it
is the check name.

**The DOM phase is excluded because a runner cannot host it, not because nobody
wired it up** — a distinction worth keeping in the file, since "not wired up yet"
invites someone to wire it up. Electron needs a display; `gui-91` and `gui-124`
spawn the real `claude` CLI, absent from a runner's PATH; `gui-119` is
`desktop-exclusive` and its witness is a genuine desktop foreground.

**On the runner: ubuntu is cheaper and would probably work, and "probably" is the
standard this ticket exists to refuse.** There is no WSL and no Docker on this
machine, so linux could not be measured either way, and choosing the unmeasured
platform to save runner minutes would have been an assumption dressed as a
default. The measured platform wins until someone measures the other one.

**What was deliberately left OUT of the boundary statement, applying #145's own
rule.** A clean-clone run surfaced that CI will run **1378** tests where a local
developer sees **1382**: `tests/transcript-rewind-real-store.test.ts` skips its
whole describe unless it finds a stored transcript whose recorded `cwd` is this
repo, and a runner has no `~/.claude` store at all. It is not named in the
workflow, because *a deficit a reader can close is a deficit and one they cannot
is wallpaper* — nobody can manufacture a real session store on a runner, so
printing it every run would produce exactly the number-nobody-can-drive-to-zero
that #145 removed. Filed as **#157** for a human to rule on instead.

## Reversibility

**Easy, and two of the calls are one line each.**

- **Runner** → `runs-on: ubuntu-latest`, once somebody has run the three commands
  on linux once. That is the whole bar.
- **Adding a workflow** stays allowed; the pin bans only *claiming the DOM phase*
  from any of them.
- **The command set** is pinned as a **set, not an order** — the defect shape is
  a command added or removed, not reordered, and pinning order would red on a
  harmless reshuffle and teach the next reader to edit the assertion instead of
  thinking.

**What is NOT reversible by a leg, and is the reason #150 stayed open:**
confirming the workflow actually runs requires a push, and **D6** forbids a leg
pushing on its own initiative — a rule written and pressure-tested *under* the
AFK autonomy grant, so the grant does not override it. `main` is 16 commits ahead
of `origin/main` and has never been pushed. Everything verifiable without a push
was verified: a fresh clone of `main`, `npm ci` from the lockfile on a bare tree,
then the three workflow commands in workflow order, all green; the YAML parsed
rather than eyeballed; both action major tags resolved live (`checkout@v7`,
`setup-node@v7` — the obvious guess, `v5`, is two majors stale).

**#144 stays open**, carrying the forcing-mechanism question. Closing it on the
back of this ticket is the failure mode the split was reviewed against.

## Related

- [[decisions]] · [[active-work]] · [[overview]]
- [[2026-08-11-a-deficit-a-reader-cannot-close-is-furniture]]
- [[2026-08-11-a-convention-nothing-executes-is-a-style-preference]]
- [[2026-08-11-a-check-nobody-runs-is-not-a-check]]
