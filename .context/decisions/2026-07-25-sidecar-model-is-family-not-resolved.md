---
type: decision
project: claude-wrapper
date: 2026-07-25
updated: 2026-07-25
tags: [context, decision]
---

# A subagent sidecar's `model` is the family word, not the resolved target

**Decision:** Treat `agent-<id>.meta.json`'s `model` as "which family/alias the
caller asked for", never as "what actually served the turn". The Agents dock
surfaces it as-is; nothing downstream (#30, #31, #33) may present it as the
resolved provider/model.

**Why:** Spec #25's Further Notes claim the sidecar's model field "is the only
place the resolved target is visible" under a bridged setup. Measured false
while building #28. A subagent that genuinely ran on `xai/grok-4.5` — via a
temporary `haiku` family rebind through the Wisp bridge — wrote
`"model":"haiku"` to its sidecar. The sidecar records the *request*, and the
bridge's resolution happens past the point the CLI writes it.

Field coverage measured the same day across all 28 sidecars in this project's
local store: `agentType` / `description` / `toolUseId` / `spawnDepth` on
**28/28**, `model` on **18/28**, `parentAgentId` on **0/28**. Two consequences:
the "fields absent rather than zero" rule is load-bearing for `model` on about a
third of real rows, and the flat-fan assumption (nesting ~1 in 185) holds in this
store too — nothing local exercises the nesting path #31 builds.

**Reversibility:** The finding is an observation, not a design; it cannot be
reversed, only superseded by a CLI that starts recording the resolved target. If
a later version does, `model` becomes genuinely authoritative and the row could
show both. Re-measure with the same tally before assuming it changed. Recorded
on the spec at `issues/25#issuecomment-5077400271`.

## Related

- [[decisions]]
- [[2026-07-25-agents-surface-task-messages-not-text-forwarding]] — the spec this corrects
- [[2026-07-24-wisp-alias-routes-by-name]] — the same family-name-vs-resolved-id distinction, one layer up
- [[2026-07-25-agents-dock-disk-contract]]
- [[active-work]]
