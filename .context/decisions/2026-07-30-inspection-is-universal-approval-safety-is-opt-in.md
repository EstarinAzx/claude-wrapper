---
type: decision
project: claude-wrapper
updated: 2026-07-30
tags: [context, decisions, toolcards, permissions, product]
---

# Inspection is universal; approval safety is opt-in

**Decision:** The tool inspector is scoped and described as making **tool activity inspectable**, not as making Edit approval safe. The result-state Edit diff carries the feature; the pre-approval diff is a bonus for users who deliberately choose Ask mode. Changing or persisting the permission-mode default is **separate** product work, deliberately not bundled into this spec.

**Why:** The app resets to `bypassPermissions` on **every launch** — a recorded owner choice: it auto-runs every tool with no confirmation until a stricter mode is picked. `canUseTool` stays installed but the SDK only invokes it when the mode asks. Accept-Edits auto-accepts edits too, so only Ask/default can reach an Edit approval at all. Reachable, yes — two titlebar clicks, danger-tinted pill — but non-default and re-chosen each launch. So a spec sold primarily on "safer Edit approval" would describe a surface most users never see. The result-state diff, by contrast, works regardless of mode: you see what an Edit *did* even when it auto-ran.

Honest framing, adopted verbatim into the spec: *"v1 makes tool activity inspectable without making chat noisy; Ask-mode approvals benefit too."* Rejected framing: *"v1 makes Edit approval safe."*

Evidence that the inspection half stands on its own without the safety story: of 6,416 historical results, 59.7% have more than one non-empty line, 49.1% hide 200+ characters past the first line, and 28.7% have a first line longer than the 120-char cap. By tool: Read 97.6% multiline, Grep 89.1%, Bash 88.2%. Edit is 17.8% of all tool uses and Write 6.5%.

**Reversibility:** easy — this is scope and framing, not structure. But reversing it means changing the permission default, which is its own decision.

## Related

- [[decisions]] — index
- [[2026-07-24-in-app-permission-mode-toggle]] — the toggle this relies on
- [[2026-07-30-a-diff-without-a-baseline-is-worse-than-none]]
- [[active-work]]
