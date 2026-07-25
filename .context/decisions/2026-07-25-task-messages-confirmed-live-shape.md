---
type: decision
project: claude-wrapper
date: 2026-07-25
updated: 2026-07-25
tags: [context, decision]
---

# Task messages confirmed live — and the runtime shape that constrains #30/#31

**Decision:** Spike #27 ran two instrumented turns against the installed CLI
(2.1.217, SDK 0.3.217) and **confirmed** `task_started` / `task_progress` /
`task_updated` all arrive. #30 keeps full scope — live token counts, tool-use
counts and `last_tool_name` are real. The fallback branch in
[[2026-07-25-agents-surface-task-messages-not-text-forwarding]] is dead; no user
story is struck. Full evidence is the comment on #25
(`issues/25#issuecomment-5077330745`).

The observed runtime shape settles several things #30/#31 would otherwise have
to guess:

- **A fourth message exists** — `task_notification` (not in the spec). It is the
  real completion signal: final `usage`, the agent's result `summary`, and an
  `output_file` path. `task_updated` is **terminal-only** (one `completed`
  patch, no `running`/`pending`), so it is a close signal, not a status stream.
- **`local_bash` tasks share the stream.** Backgrounded `Bash` calls emit their
  own `task_started` + `task_notification` with `task_type: 'local_bash'`, no
  `subagent_type`, and `skip_transcript: false`. The panel filters
  `task_type === 'local_agent'` or Bash calls render as agent rows.
- **Nested agents are invisible to `parent_tool_use_id`.** A nested subagent's
  traffic is never forwarded — every forwarded message stays tagged with the
  *outer* agent's id. The nested agent surfaces only through its own task
  messages. So #31's tree is built from task messages plus the `Agent` tool_use
  block that names the nested task's `tool_use_id`, never from forwarded
  traffic. Depth is not a field on any message.
- **Correlation stays single-keyed:** `task_started.tool_use_id` === the `Agent`
  tool_use block id === `parent_tool_use_id` === sidecar `toolUseId`. `task_id`
  is a *separate* id and is the only key carried by `task_progress` /
  `task_updated`, so both must be kept.
- **`agentProgressSummaries` stays off.** `summary` landed on 1 tick in 7 (~30s
  fork cadence), while `description` already live-updates for free per tool.
- **`total_tokens` is cumulative context** (~52k floor for a trivial subagent),
  not spend. Render a delta or label it as context size.
- The spawning tool is named **`Agent`**, not `Task`. `tool_progress` and
  `background_tasks_changed` never fired.

**Why:** The spec was built on type declarations, which promise a superset of
what the runtime delivers and say nothing about co-tenants (`local_bash`),
cadence, or what nesting actually looks like on the wire. Two real turns cost
~80 seconds and removed every one of those unknowns before #30 wrote a line.
Confirming the happy case was the cheap half; the expensive half was learning
that the obvious nesting implementation — follow `parent_tool_use_id` — cannot
work, which would have surfaced as a silent empty tree deep inside #31.

**Reversibility:** The findings are observations, not choices; they are only
invalidated by a CLI upgrade. Re-running the spike is cheap — the harness
pattern (SDK `query()` with `engine.ts`'s exact options, dumping every message
to JSONL from outside the repo) is written up in the #25 comment. Note the
measurement gap: native backend could not be observed on this host (`Not logged
in`), so all of the above is from the wisped backend.

## Related

- [[decisions]]
- [[2026-07-25-agents-surface-task-messages-not-text-forwarding]] — the spec this confirms
- [[active-work]] · [[pick-up]]
