---
type: decision
project: claude-wrapper
date: 2026-07-28
updated: 2026-07-28
tags: [context, decision]
---

# The composer's height is CSS, not React state

**Decision:** #42's multiline composer grows natively. `.message-input` carries
`field-sizing: content`, `max-height: calc(8 * 1.4em + 12px)`, `resize: none`
and `overflow-y: auto`. There is **no** `useLayoutEffect` measuring
`scrollHeight`, no inline `style.height`, and no height in React state.

The conventional implementation — set `height: auto`, read `scrollHeight`,
write it back on every value change — was considered and rejected.

**Why:** The ticket's criterion 6 demands the height reset on send, on the
`{text, nonce}` external insert, and whenever the value empties. Those are three
separate reset sites, and a fourth would appear the next time something else
writes the composer. The JS approach has to remember all of them; the CSS
approach cannot forget, because there is no state to leave stuck. Criterion 6
stops being a behaviour to test and becomes a structural property.

Electron is a single known browser, which is exactly the case where a modern CSS
feature beats a JS polyfill. Verified live rather than assumed:
`getComputedStyle(el).fieldSizing === 'content'` in Electron 43, and the DOM
measurements land on the arithmetic — 33px empty, 75px at three lines, 180px at
eight (= 8 × 21 + 12, the cap), still 180px at twenty lines with `scrollHeight`
432, back to 33px on clear and on send.

The cost is honest and worth naming: **jsdom cannot see any of it.** The suite
pins the three declarations against the stylesheet source (the technique the
renderer-CSP test already uses) plus an assertion that no inline height is ever
written; the real evidence is the GUI driver, now committed at
`.claude/skills/run-desktop/gui-42.mjs` instead of being thrown away like its
predecessors.

**Consequence for future work:** do not add a resize effect to `InputBar`. If
the composer ever needs a height the content cannot imply — a drag handle, a
remembered size — that is a deliberate reversal of this decision, not a patch on
top of it, and it reintroduces every reset site listed above.

**Reversibility:** High mechanically — swapping in a `scrollHeight` effect is a
contained change to one component plus four CSS lines. Lower in spirit: the
reason to reverse would have to outweigh re-acquiring the reset bookkeeping this
avoids.

## Related

- [[decisions]] · [[active-work]] · [[pick-up]]
- [[2026-07-27-slash-commands-are-a-dumb-pipe]] — #40's Enter interception, which
  #42's Shift+Enter branch had to sit ahead of without disturbing
