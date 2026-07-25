---
type: decision
project: claude-wrapper
date: 2026-07-25
updated: 2026-07-25
tags: [context, decision]
---

# Agents dock: the disk contract #30's live merge has to respect

**Decision:** Three things #28 pinned that later Agents-surface tickets inherit.

1. **`listSubagents` returns `SubagentInfo[] | null`.** `[]` means "this session
   spawned none", `null` means "the agent directory could not be read". ENOENT
   is the discriminator — a session with no subagents has no `subagents/`
   directory at all, so "not there" *is* "none spawned". Per-file leniency is
   unchanged: an unreadable sidecar or one missing the correlation id is
   skipped, and the rest still list.
2. **Absent fields stay absent.** `description` / `model` / `spawnDepth` /
   `parentAgentId` are omitted from the object entirely, never written as `''`,
   `0`, or `undefined`. The renderer keys off the key being missing.
3. **No new IPC channel was needed.** `subagents:list` already existed, already
   carried `isTrustedIpc`, and was already in all four mock sites; only its
   payload widened. The four-mock-sites landmine did not fire for #28 — it still
   waits for #29 and #34.

**Why:** "None spawned" and "could not read" are different facts and the panel
must not render them as the same blank — that was an explicit #28 acceptance
criterion, and collapsing them is exactly what the old lenient `catch → []` did.
The absent-not-zero rule matters because real sidecars carry `model` only about
two thirds of the time ([[2026-07-25-sidecar-model-is-family-not-resolved]]), so
zero-filling would invent data. #30 merges live task-message rows into this same
list keyed by `parentToolUseId`; it must preserve both rules or a disk-only row
starts claiming it used 0 tokens.

Also fixed in passing, because an acceptance criterion depended on it:
`SubagentDrawer` used to resolve its own session id from the engine
(`currentSessionId()`). A session opened from the rail has **no engine** until
the next turn runs — `chat:target` nulls it — so that answered `null` and the
drawer came up empty. That is precisely the past-session case the dock exists to
open; the inline Task-card row never hit it because replayed cards carry no
`subagent` field. The drawer now takes the session the app is looking at as an
optional prop and falls back to the engine as before. Do not "simplify" it back.

**Reversibility:** The null/empty split is a one-line change in
`listSubagents` and two branches in the dock, but reversing it silently
re-merges two distinct failure states — don't, without replacing the signal.
The drawer prop is additive and safe to keep; removing it re-breaks past-session
inspection.

## Related

- [[decisions]]
- [[2026-07-25-agents-surface-task-messages-not-text-forwarding]] — the parent spec
- [[2026-07-25-sidecar-model-is-family-not-resolved]]
- [[active-work]]
