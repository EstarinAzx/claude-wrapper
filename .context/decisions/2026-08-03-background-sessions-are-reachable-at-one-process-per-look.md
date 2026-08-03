---
type: decision
project: claude-wrapper
date: 2026-08-03
updated: 2026-08-03
tags: [context, decision]
---

# Background sessions are reachable, at one process per look

**#90, measurement only — no `src/` change.** The deliverable is
`scripts/spike-90-agent-view.mjs` (fifth sibling of spike-81/87/88/89, importing
the app's **real** `cli-path.ts` and `backend-mode.ts`) with evidence in
`scripts/spike-90-findings.json`. Measured on host CLI **2.1.220 / SDK
0.3.220**, backend `wisped`.

**Verdict: reachable, and only one route reaches it.** The SDK does not expose
background sessions at all; `claude agents --json` does, correctly and without a
TTY, for about **0.9 s of a fresh CLI process per look**. There is no push
channel. That is a real cost with a real staleness window, and it is the number
#91 has to be worth.

## The six questions

| | question | answer |
|---|---|---|
| 1 | Does the TS SDK expose them? | **No.** 29 exports; nothing lists background sessions |
| 2 | Can the app run `claude agents --json`? | **Yes** — exit 0, parses, explicitly no TTY needed |
| 3 | What is the payload? | Two **different** row shapes; `state` measured at four values, open |
| 4 | Push or poll? | **Poll only.** No live flag; no single on-disk store reproduces the listing |
| 5 | What does one call cost? | **~0.9 s**, median 893 ms (`--json`), 890 ms (`--all`) |
| 6 | Does `--cwd` scope? | **By directory yes, by kind no** — and it keeps the caller |

## 1 — the SDK is not the route, and the near-misses are named

`listSessions()` is the near-miss and the reason the sessions rail *looks* like
this feature already exists. Its `SDKSessionInfo` is the **stored-transcript**
shape — `sessionId`, `summary`, `lastModified`, `fileSize`, `customTitle`,
`firstPrompt`, `gitBranch`, `cwd`, `tag`, `createdAt` — and carries **no
`state`, no `kind`, no `pid`, no attach path**. Exercised on the real store, not
reasoned about.

**The first run of this spike answered YES and was wrong**, which is worth
keeping. A name-level scan matched `getSubagentMessages` and `listSubagents` —
*subagents inside one session*, the repo's already-documented third meaning of
"agent". The harness now **calls** each candidate instead of matching its name.
Both returned `[]` with no session id, and an empty array has no fields by
construction, so the first "no liveness field" reading was **vacuous** — #81's
rule biting inside the instrument. The probe now finds a real session with
sidecars on disk (`<projectDir>/<sessionId>/subagents/`, #81's layout) and calls
against it: 5 and 1 real rows respectively, neither carrying a liveness field.
The negative is now a measurement.

## 2, 3 — the payload is two shapes wearing one name

The ticket recorded one observed shape (`id`, `cwd`, `kind`, `startedAt`,
`sessionId`, `name`, `state`). That was a **background-only** sighting. The
listing prints interactive rows too, and they are a different record:

| | `id` | `state` | `pid` | `status` |
|---|---|---|---|---|
| `kind: "background"` | **yes** (8-char `sessionId` prefix) | yes | only while a process lives | only while a process lives |
| `kind: "interactive"` | **no** | **no** | yes | yes |

Three consequences, all load-bearing for any surface:

- **`id` is not identity.** It is absent on interactive rows and is a prefix of
  `sessionId` where present. **`sessionId` is the only field on every row.**
- **`state` and `status` are different fields, and neither is universal.**
  `state` is the supervisor's lifecycle and is **background-only**; `pid` +
  `status` appear together exactly when a live process exists. There is no one
  field that describes every row.
- **The `state` vocabulary is four here, not three.** `blocked`, `done`,
  `failed` — and **`working`**, which the ticket did not predict. Counts under
  `--all`: 11 `done`, 4 `blocked`, 1 `working`, 1 `failed`, plus one interactive
  row with no `state` at all. Per #81 and #83, treat the set as **open** and
  render the raw string; an allow-list will lie by omission the first time the
  CLI grows a state.

## 4 — poll only, and the on-disk stores are a signal at best

No `--watch`/`--follow`/`--stream`/`--tail` in the subcommand's own help. Two
on-disk stores exist and **neither reproduces the listing**:

| store | covers | of the 6 active rows |
|---|---|---|
| `~/.claude/sessions/<pid>.json` | live processes only | **2** |
| `~/.claude/daemon/roster.json` | supervisor workers only | **1** |

The listing is a **join** the CLI performs, and in both directions the listing
is the superset. So watching those files — the app already owns that pattern in
`session-watcher.ts` — is a **change signal that can trigger a re-poll**, never a
substitute for the call.

> **`roster.json` is sensitive.** It carries `rendezvousSock` / `ptySock`,
> `rvAuth` / `ptyAuth` and `dispatch.env` — **attach credentials**. Never log,
> never commit, never surface. #88 said the same of `McpServerStatus.config.env`;
> this is stronger, and the spike records nothing from it but set sizes.

## 5 — the cost, stated as a budget

Median **893 ms**, min 846, max 1068, over five reps; `--all` is not more
expensive (890 ms). Every call is a **full CLI process start** — there is no warm
path, so the cost is per *look*, not per session:

- poll every **5 s** → ~**18 % of a core**, continuously
- poll every **30 s** → ~**3 % of a core**, and a 30 s staleness window

**The staleness window is the poll interval.** A "live" list at any affordable
interval is a list that is routinely wrong, which is a product fact and not an
implementation detail.

## 6 — `--cwd` scopes the wrong axis for free

It works: 6 rows → 3, every one matching, identical to filtering the unscoped
listing by `cwd`. But the app's needed distinction is **background vs
interactive**, and `--cwd` filters neither — the scoped result still contained an
interactive row **and the caller itself**. A background-only list needs a second
filter on `kind`.

**Unmeasured, flagged rather than assumed:** whether `--cwd` matches by prefix or
exactly. No session was running below this directory, so the zero is vacuous and
the harness now says so in `prefixMatchingExercised`.

## The two traps, both live

**The instrument is in its own reading.** Confirmed by identity join, not
inference: `CLAUDE_CODE_SESSION_ID` matched a row and `CLAUDE_PID` matched its
`pid`. The measuring session appears as `background` / `working` / `busy`. Every
count in the findings is given raw **and** self-excluded.

**The app is in its own reading too — and this one is the finding for #91.** A
real `query()` at `engine.ts`'s exact options was run, and the listing polled
*while the turn was live*: the app's own session **is** in it, as
`kind: "interactive"`. So an SDK-spawned headless CLI does register with the
supervisor. A background-only list drops it for free; a list mirroring the CLI's
agent view — which shows both kinds — would show the user their own conversation.
`cwd` cannot exclude it, because the app lists the workspace it is open on, which
is exactly where its own session lives.

## What this does not authorise

**#91 stays blocked, and this finding does not move it.** The ticket said a leg
that finds the data reachable still may not build the panel; the data is
reachable and the panel is still not built. #86's constraint that no new feature
may add a titlebar control is untouched, every dock opens from a titlebar toggle,
there is no router, and which existing dock a non-agent panel joins is #86 owner
call 1 — still unanswered. Peek / reply / attach were out of scope and remain
unmeasured.

What this *does* change is the price tag #91 is deciding against: not "can we?"
but **one process per look, no push, a staleness window equal to the poll
interval, a `child_process` spawn this app deliberately does not have today
(`cli-path.ts` chose a PATH walk over a `which` shell-out precisely to avoid
re-adding one), a row shape that is two shapes, and a list containing the
viewer.**

## Landmines this leaves

- **`sessionId` is the only universal key.** `id` is absent on interactive rows.
- **No single field describes a row's liveness.** `state` is background-only;
  `pid`/`status` mean "a process is alive right now".
- **`state` has four measured values and is not closed.** `working` was not in
  the ticket's predicted three.
- **`status` is not closed either, and this was confirmed live.** The findings
  file recorded `status` as `<null> | busy`. Minutes later, in the same session,
  an interactive row read **`idle`** — a value the run never saw. So the open-set
  caution above is not a hedge; it is a thing that happened inside one sitting.
  Re-running the harness will produce a different vocabulary again.
- **`roster.json` holds attach credentials.** Never read it into anything that
  logs.
- **An SDK-spawned CLI registers as `interactive`.** The app is visible to the
  agent view, and to itself.
- **A name-level scan for "agent" in this repo returns subagent APIs.** Third
  meaning of the word here; call the thing before believing the name.
- **`spike-89-findings.json` records an absolute temp path** and so leaks the OS
  username into the repo. Not fixed here (not this ticket's file); spike-90
  records the basename only.

## Related

- [[2026-08-02-the-entrypoint-is-a-fact-about-the-launch-env]] — #89, the sibling
  harness this one is built from
- [[2026-08-02-mcp-health-already-arrives-once-per-turn]] — #88, where a cheaper
  channel turned out to already exist; **the opposite outcome to this one**
- [[2026-08-01-the-spawner-is-one-hop-off-task-started]] — #84, the
  right-observation/wrong-implication shape this ticket hit again at Q3
- [[flows]] — carries the agent-view name-collision table
- [[pick-up]] · [[active-work]] · [[overview]]
