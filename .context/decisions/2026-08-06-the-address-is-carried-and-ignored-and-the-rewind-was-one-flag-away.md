---
type: decision
project: claude-wrapper
updated: 2026-08-06
tags: [context, decision]
---

# The address is carried and ignored, and the rewind was one flag away

**Decision:** Spike #127 measured the three routes nobody had called. Of the
owner's three asks, **one is dead, one is buildable today, and one has no route
as stated**:

- **A message input inside the subagent view cannot be built.** There is no
  inbound route to a running subagent. Recorded closed with evidence.
- **Rewind is real, works, and needs exactly one option.** Filed as a build
  ticket with its measured shape.
- **"Background a session" has no route as stated.** Closing the handle kills
  the CLI child. The one genuine candidate — Remote Control — is outward-facing
  and becomes a **new owner call** rather than a build.

No `src/` file changed. `scripts/spike-127-uncalled-routes.mjs` and its findings
JSON are the whole diff.

---

## Q1 — the addressing field is transported and ignored

The ask was *"a user message input"* inside the subagent view.

**The earlier answer here was refuted during this spec's grill, and correctly.**
It concluded "no inbound route exists" from `subagent:changed` being a leaf
channel — but proving one channel is OUTBOUND proves nothing about whether any
INBOUND route exists. That error is why #127 existed at all, so this spike was
required to produce **negative-shaped evidence** instead.

The protocol declares exactly one addressing field for a user message:
`parent_tool_use_id` (`sdk.d.ts`, `SDKUserMessage`). It is the same field the app
already READS — `engine.ts` buckets subagent output by it. So the question is
whether it works in the write direction. Four arms, all with a real subagent
running a 40s command:

| arm | address used | subagent's own report | sentinel on subagent-tagged output |
|---|---|---|---|
| B positive control | *no injection* | `READY / NONE` | no |
| C measurement | the **live** subagent's `tool_use_id` | `READY / NONE` | **no** |
| D negative control | a **bogus** id | `READY / NONE` | **no** |

**C and D are indistinguishable.** In both, the message was accepted, was never
routed to the subagent, and surfaced on the **main thread** instead — where the
main model volunteered the mechanism unprompted: *"token arrived mid-turn, after
agent finished. Agent never saw it."* The positive control held (no injection →
the run-random sentinel appears nowhere), so the sentinel was not guessable.

**The field is transported and ignored for routing.** A valid address buys
nothing a bogus one does not. This is the negative-shaped evidence the grill
demanded: not "we could not find a route", but "the one route the protocol
declares was called, and a correct address behaved exactly like a wrong one".

What it does **not** settle: whether some other surface (an MCP server, a file
the CLI watches, a control subtype outside the SDK's vocabulary) could reach a
subagent; what a future CLI does; and whether a different injection *moment*
behaves differently — one window was measured and it is recorded.

## Q2 — rewind exists, works, and was one option away

`/rewind` is absent from the CLI's advertised commands, so there is no command to
wrap. **That remained true and the count moved**: 121 commands at #120's recon,
**120** here, `/rewind` and `/bg` still both absent. The drift is recorded rather
than smoothed over.

But the command surface was never the capability. `rewind_files` is a real
control-request route, and the three-way comparison that proves it is the
instrument this spike is built around:

- a bogus subtype → `Unsupported control request subtype: …`
- `rewind_files` with no opt-in → **`File rewinding is not enabled.`**

A *different* error is positive evidence: the dispatcher recognised the subtype
and the request reached that route's **own validator**. Absent that comparison,
a refusal looks like absence.

The switch is the SDK's `enableFileCheckpointing` option. With it set:

- `dry_run: true` → `canRewind: true`, plus `filesChanged`, `insertions`,
  `deletions` — a genuine **preview**, which is what an undo affordance needs.
- `dry_run: false` → **the file on disk returned to its pre-turn contents.**
- a bogus uuid, run first → left the file alone, so the revert is attributable.

Two things a build needs, both measured rather than assumed:

1. **The host stamps the message uuid.** The CLI does not echo the prompt back —
   the only `type: 'user'` messages on the stream are tool results — so there is
   nothing to scrape. The host supplies `uuid` on the outgoing message and the
   CLI stores it under exactly that id (asserted by reading the transcript back).
   An earlier version of this arm scraped the stream, addressed a **tool_result**,
   and would have reported a confident false negative.
2. **The app's wholesale `env` replacement does NOT break it.** `enableFileCheckpointing`
   reaches the CLI as an environment variable, and `engine.ts` passes `env:` which
   *"REPLACES the child env wholesale"* — a real collision hypothesis, tested
   directly and **refuted**: the arm using the app's own `resolveSpawnEnv` output
   works.

What it does **not** settle: **rewind restores FILES, not the conversation.** Its
name, its response shape and this measurement are all about the disk. An "undo"
built on it would undo the workspace and leave the transcript intact — which
means it does **not** unlock the true message-edit that #123 shipped as a refill.

## Q3 — the premise was false, and the detach is worse than unbuilt

`/bg` is one of three ways to OPEN the CLI's agent view — a terminal takeover —
and is absent from the advertised commands. Confirmed again here. So the spike
asked what backgrounding could mean and measured each candidate:

- **Task backgrounding** (`background_tasks`, declared as the Ctrl+B equivalent):
  the route is **present** — accepted where a bogus subtype is refused — but
  produced **no measurable effect**. The backgrounded turn took **52.7s against a
  control that genuinely blocked for 50.2s**: 2.5s *slower*, not faster.
  Reachable, not demonstrated (#117's distinction, again).
- **Session detach: NO.** With the turn provably still in flight, closing the SDK
  handle ended the work: the proof file was never written, and this session's own
  transcript stayed at 3 messages. Closing the query kills the CLI child. There is
  no detach through this route.
- **Remote Control**: the `remote_control` subtype is **present**. Probed with
  `enabled: false` only — **enabling it bridges a live session to an external
  service, and the owner is away.** Reachability is settled; what enabling does
  is not, deliberately.

## What this spike had to fix in itself, twice

Both of Q3's first answers were **false positives**, and neither would have been
caught without a control:

- Task backgrounding first scored **EFFECTIVE** off a 37s speed-up. The cause was
  that this machine's harness **blocks standalone `sleep`**, so the backgrounded
  arm's command never ran. The arm was measuring a hook. Fixed by using a node
  timer and by asserting the control arm **actually blocked** before scoring.
- Session detach first scored **SURVIVED**, off a proof file that was written
  *before* the cut and a "transcript grew" witness that was watching **the newest
  transcript anywhere on the machine** — almost certainly an unrelated session.
  Fixed by checking the proof file before the cut (present → UNSCORED, not a
  pass) and by scoping the witness to this session's own id.

That is the fifth and sixth instance on this record of an instrument failing its
own setup and reporting it as the phenomenon (#114 ×3, #122, #124 ×3, #125,
#126). The rule earns its keep every time: **take the verdict from a control, and
an arm whose setup did not hold is UNSCORED, never a result.**

**Alternatives considered:** enabling Remote Control to measure it properly —
rejected as outward-facing with the owner away, and recorded as an owner call
instead. Concluding Q1 from the SDK's vocabulary rather than by calling —
rejected on #115's precedent, and the calling is what produced the C≡D comparison
that makes the NO trustworthy.

**Reversibility:** total. Nothing was built. The rewind build ticket carries the
measured shape; if it is never taken, the record still stands.

## Related

- [[2026-08-05-a-declared-wire-type-is-not-a-callable-route]]
- [[2026-08-05-the-clis-command-surface-is-enumerable-and-two-asks-died-on-it]]
- [[2026-08-05-the-pane-is-a-projection-so-the-edit-is-a-refill]]
- [[2026-08-05-file-is-a-secure-context-and-unscored-is-not-refuted]]
