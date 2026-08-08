---
type: decision
project: claude-wrapper
date: 2026-08-08
ticket: 130
commit: ff2be52
tags: [decision, rewind, checkpointing, measurement]
---

# A checkpoint outlives its process, and rewindability tracks position

## The question

#129 shipped a rewind control on every user message **this pane sent**. A message
loaded from a stored transcript got none. That was never a limit of the route —
it was that the renderer did not have the message's uuid.

Carrying the uuid through is trivial. The thing that decided whether it should be
carried at all is a fact about the CLI nobody had measured: **does a file
checkpoint still exist for a conversation the user reopens later?** A control
offered on a three-day-old conversation that always refuses is worse than no
control, and #129's evidence did not settle it. Its phase C saw
`filesChanged: 0`, which is consistent with "recognised" — but phase A had
already reverted its own file, so `before` matched whatever the call did. There
was no disk witness.

## What was measured

`scripts/spike-130-checkpoint-durability.mjs`, 7 turns.

### A checkpoint survives the process that made it

The instrument is the finding's whole value. A **child process** mutates a file
under a host-stamped uuid and **deliberately does not rewind**, then exits — so
the file crosses the process boundary still MUTATED. A **later process** resumes
the session in the same workspace, reads the uuid back off the **stored
transcript**, and rewinds. The file returned to its pre-turn contents.

Reading the id off disk rather than out of memory is not incidental: it is
exactly what a replayed message does, so the harness exercises the feature's real
input rather than an easier one.

Four controls held. A bogus uuid run first **threw**
`No file checkpoint found for this message.` and left the file alone, so the
revert is attributable to the id. The dry run left the file mutated, so the
preview provably does not move the disk. The uuid read off disk matched the one
the host stamped. And the whole phase was gated on the child's **parsed handoff**
rather than its exit code.

### It does not expire inside the range this machine can witness

Elapsed time cannot be manufactured, so this ran against the operator's own real
sessions for this repo — 130 carried a provable checkpoint, 6 were sampled across
the age range, **dry-run only**, with a `git status` hash before and after
proving nothing moved.

| age | outcome | files it would revert |
|---|---|---|
| 17d | accepted, `canRewind: true` | 18 |
| 15d | accepted, `canRewind: true` | 4 |
| 11d | accepted, `canRewind: true` | 21 |
| 8d | accepted, `canRewind: true` | 8 |
| 7d | accepted, `canRewind: true` | 9 |
| 4d | accepted, `canRewind: true` | 17 |

**6 of 6.** No cliff.

**The honest ceiling, stated because it is easy to overstate this.** 17 days is
the oldest session on this machine carrying a checkpoint. The transcript store
and `~/.claude/file-history/` bottom out on the **same date**, which is a
`~/.claude` reset — **not** a retention window. Reading it as one would be
inventing a finding out of a coincidence. Nothing here says what happens at 60
days; it says there is no cliff inside 17.

### Rewindability tracks POSITION, not per-message backups

This was not in the ticket and it decided the control's shape.

A transcript records file backups as `file-history-delta` lines carrying
`snapshotMessageId` — the user message a backup was filed against. A real session
has 70–110 user messages and only a handful of those anchors. If rewindability
required a message to be an anchor, the control would refuse on most of a
reopened conversation.

Probed by position, dry-run only:

- a message that **is** an anchor → rewindable, 7 files
- a message with **no backup of its own but an anchor later** → **rewindable, 7 files**
- a message with **nothing after it** → refuses, `No file checkpoint found for this message.`

So a message is rewindable exactly when there are file changes after it. The
refusal is not a failure — it is the correct answer to "undo nothing". **The
control therefore needs no gating**, which is also the smaller build.

### What checkpointing costs

- **Mechanism, no model in the loop:** read + hash + write a content-addressed
  copy, the shape of a real `<hash>@v1` entry — **~0.5 ms per backed-up file**.
- **Disk:** a one-file turn left **1 backup file, 9 bytes**.
- **Per-turn latency: UNSCORED, with the number that says why.** On/off medians,
  interleaved, 3 reps: the difference was smaller than the spread *within* a
  single arm on every run, and **flipped sign between runs** (checkpointing
  "faster" than not). Model latency dominates, exactly as #129 predicted.

An UNSCORED carrying its own noise band is a result. #129 recorded this
`UNSCORED` and was right to; what was missing was the number that makes the
verdict checkable.

## What was decided

**Carry the stored line's own `uuid` through `transcript.ts` →
`TranscriptMessage` → `ChatMessage.rewindId`, ungated.** The send path, the
engine, the IPC handler and the control itself needed no change.

**Apply `isMessageUuid` to the CLI's own on-disk value.** Being the CLI's value
earns it no exemption: `transcript.ts` is where stored data enters the app, and
the guard is simultaneously the trust boundary and the narrowing that lets the
value reach the SDK without a cast. A malformed one is **dropped** — never
coerced, never thrown on, because one bad line must not cost the user the whole
transcript. Fourth site in the compare-never-coerce family, after `backdrop.ts`
(defaults), `effort.ts` (rejects) and `message-uuid.ts` (drops).

**The second gesture states its blast radius**: "Reverts 18 files since this
message". The counts were already there from #129; what was missing is scope. On
a reopened conversation the control reverts every turn after the chosen message,
and 4–21 files is what that actually means — read as "these files", the count
understates it.

## What transfers

- **A disk witness needs the disk to be dirty when you measure it.** #129's phase
  C could not have answered this question no matter how carefully it was read,
  because its file was already back at ORIGINAL. Leaving the mutation in place
  across the process boundary is what turned an inference into a measurement.
- **An empty population is an instrument failure, and must be labelled as one.**
  The aged survey first returned "no aged session with a provable checkpoint" —
  which reads exactly like "aged checkpoints are gone". The cause was reading
  `cwd` from line 1 of each transcript, where the first record is metadata and
  carries no `cwd` at all. The verdicts now distinguish "no project matched" and
  "no session had an anchor" from a real refusal. **UNSCORED IS NOT REFUTED**,
  now from an eighth side.
- **Write the verdict template after seeing the data, or check it against the
  data.** The positional phase first classified `accepted` with
  `canRewind: false` as "a harmless no-op". It is a **refusal** — the control
  renders an error note on that path. A template written before the run mislabelled
  its own result in the direction that flattered the build.
- **A probe must be able to answer the question it was built for.** That same
  phase then picked a session whose only anchor sat at the front, so the decisive
  case — a message with an anchor *later* — never ran, and the verdict came back
  MIXED. Settling for whichever session came first is what left it unanswered.
- **A well-formed wrong value passes every shape check.** Mutating the parser to
  carry `parentUuid` instead of `uuid` survives `isMessageUuid` and every
  synthetic unit test, because `parentUuid` is itself a valid uuid on every user
  line. It is caught only by cross-checking the parser's output against the
  `snapshotMessageId` anchors in a **real** transcript. Synthetic lines cannot
  corroborate a claim about the real store.
- **A dry-run-only survey of the operator's real data needs a witness that it was
  dry.** `git status` hashed before and after, asserted, not assumed.

## Related

- [[2026-08-06-the-id-is-minted-where-the-bubble-is-and-the-store-is-keyed-by-directory]]
- [[2026-08-06-the-address-is-carried-and-ignored-and-the-rewind-was-one-flag-away]]
- [[2026-08-05-a-declared-wire-type-is-not-a-callable-route]]
- [[overview]] · [[active-work]] · [[pick-up]]
