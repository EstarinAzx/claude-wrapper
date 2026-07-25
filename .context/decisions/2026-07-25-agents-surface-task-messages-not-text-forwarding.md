---
type: decision
project: claude-wrapper
date: 2026-07-25
updated: 2026-07-25
tags: [context, decision]
---

# Agents surface reads SDK task messages, not forwarded subagent text

**Decision:** Spec #25 feeds its Agents panel from the SDK's own task messages —
`task_started` / `task_progress` / `task_updated` (all `type: 'system'`) plus
`tool_progress` — instead of turning on `forwardSubagentText`, which is what the
#24 wrap-up note had deferred. The existing engine subagent event is **widened,
not duplicated**; the spawning tool-use id stays the single correlation key
across live events, disk sidecars, and the drawer lookup. Ticket #27 is a
throwaway spike that must confirm the installed CLI actually emits these before
#30 builds on them; a disconfirmed spike falls back to today's
`parent_tool_use_id` inference and drops only the live token / tool-count /
last-tool fields.

Companion shape decisions: one panel with a list ⇄ map toggle (not two
surfaces), docked in-flow on the right so chat stays visible; per-session
history merged from disk sidecars so a resumed session is not empty; nesting
rendered as a tree in the panel while the drawer stays flat one level;
deterministic hand-rolled SVG for the map, no graph library.

**Why:** `sdk.d.ts` at `@anthropic-ai/claude-agent-sdk@^0.3.217` carries
`usage.{total_tokens, tool_uses, duration_ms}`, `last_tool_name`, and a real
status enum on those messages — structured data that text forwarding cannot
provide at all. Forwarding would re-add the whole subagent text volume the
current engine deliberately drops, and still leave the token counts
unavailable. Nesting needed no inference either: depth-2 sidecars on disk carry
an explicit `parentAgentId` (verified by inspecting the local transcript store;
184 depth-1 vs 1 depth-2 agents, so the common graph is a flat fan and a
force-directed solver would be pure cost). `parseMeta` was already discarding
`description`, `model`, `spawnDepth`, and `parentAgentId` — the panel is mostly
fed by data that was on disk the whole time.

**Reversibility:** Easy per-part. `forwardSubagentText` and
`agentProgressSummaries` are single booleans in the query options if live prose
or CLI-generated summaries are ever wanted — they were left off deliberately,
not overlooked. The map's layout module is pure, so swapping deterministic
placement for a library is contained. Reversing the widened event or the
correlation key is not cheap: the inline Task-card row and the drawer both
depend on the tool-use id.

## Related

- [[decisions]]
- [[happy-path]] — the two PRD A flows
- [[2026-07-24-ui-polish-model-picker-subagent-viewer]] — #24, whose follow-ons this specs out
- [[active-work]]
