---
type: decision
project: claude-wrapper
date: 2026-07-24
updated: 2026-07-24
tags: [context, decision]
---

# Wisp routes by alias/family NAME, not resolved model id

**Decision:** The input-box model picker sends the Wisp **alias name** (e.g.
`grok`) as `options.model`, not the alias's resolved `target.model` (e.g.
`grok-4.5`). `parseAliases` in `src/main/model-mode.ts` maps each alias to
`{ id: name, label: name }`; `target.model` is kept only as a validity gate.

**Why:** The Wisp bridge resolves a request's model string through its `wisp
routing` map — both the four family names AND the alias names route. A raw
resolved model id does NOT route; it falls through and the turn **hangs forever**
(no response, no error). Live-confirmed 2026-07-24:
`claude-wisp -p … --model grok` → responds; `--model grok-4.5` → hangs; family
`--model sonnet` → responds (control). The #23 build had guessed the opposite
("route an alias by its resolved model id") without a live probe and shipped the
hang; this reverses that. Fixed in `f94f1a2`, verified in-app (picked grok →
real response).

**Reversibility:** Easy — it's the id string in one `.map`. If a future Wisp
version routes resolved ids (or stops routing alias names), flip `id` back and
re-probe with the two `claude-wisp -p --model …` calls above. A raw model id
would otherwise need a family REBIND via the `/slot` skill, which mutates global
routing and would hijack other sessions — wrong for a per-chat pill.

## Related

- [[decisions]]
- [[2026-07-24-ui-polish-model-picker-subagent-viewer]] — the #23 slice this corrects
- [[active-work]]
