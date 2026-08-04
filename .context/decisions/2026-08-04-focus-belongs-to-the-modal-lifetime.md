---
type: decision
project: claude-wrapper
updated: 2026-08-04
tags: [context, decisions, frontend, accessibility]
---

# Focus belongs to the modal lifetime

**Decision:** #99 keeps the subagent viewer's complete focus contract inside
`SubagentDrawer`. Mount captures `document.activeElement` and focuses the existing
Close button before paint; root-local `Tab` handling wraps the live enabled stops
in both directions; unmount restores the captured element only if it is still
connected. Button, Escape, and scrim exits therefore share one restore path.

**Why:** `role="dialog" aria-modal="true"` is false while focus remains outside
or can reach hidden controls. The measured failure was side-effecting, not only
semantic: without the trap the composer behind the scrim was forward stop 13, so
Enter could submit a real prompt. App-owned opener refs would couple two launch
sites to three exits; a focus-trap dependency would add a package for a small DOM
boundary. Component mount/unmount already defines the exact lifetime to own.

The real-window driver cycles on its own initial stop rather than the opener. A
correct trap makes the opener unreachable, so the old cycle break would consume
its full 120-key budget. Mutation checks prove both halves: deleting restore reds
all three exit rows; deleting the root handler makes forward and reverse walks
escape at stop 1 and exposes the composer.

**Reversibility:** easy. The behavior is isolated to `SubagentDrawer` plus its
vitest and `gui-95` guards; no CSS, scrim, Escape-propagation, focus-ring, package,
or visual contract moved.

## Related

- [[decisions]] — index
- [[2026-08-04-the-viewer-is-centred-and-the-glass-ban-is-left-unresolved]]
- [[2026-08-04-the-subagent-drawer-is-drivable-without-a-live-turn]]
- [[2026-07-31-a-driver-establishes-its-premise]]
- [[active-work]]
