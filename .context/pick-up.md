---
type: pick-up
project: claude-wrapper
updated: 2026-08-05
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Next: #124 — four unblocked tickets left

Confirm rather than trust this line — it has been wrong before:

```text
gh issue list --state open --label ready-for-agent
```

**#124–#127 are unblocked and independent.** #128 (the 1.0.0 bump) waits on all
of them and is last by the owner's explicit instruction — **it still wears
`ready-for-agent`, so the frontier query returns it.** The ordering lives in the
ticket body and in `.claude/relay-leg.md`, not in a label. Spec **#120** is the
container and carries the full reasoning.

**The owner is away and banned the `ready-for-human` label for this batch.** Do
not apply it. Use `needs-info` + a comment + a `PushNotification`, and let the
chain continue. A call you cannot make goes in `.claude/vibe.md` under
`## Needs you`, not onto a label.

## Landed last leg

**#123 — reuse a past user message in the composer.** `f649f1d` on `main`,
squash-merged, branch deleted, ticket closed. A user message carries a
`Reuse this message` control that refills the composer with its exact text; the
message itself is untouched in the pane and on disk. It routes through the
**existing `pendingInsert` channel** the commands dock uses — not a second one —
which is what makes #80's queued-send commitment correct with no new logic.
**Text only**, decided and stated. New files: `tests/reuse-message.test.tsx` (19
tests), `.claude/skills/run-desktop/gui-123.mjs`, `scripts/gui-123-shots/`.

## Baseline — READ IT, do not trust it

`main` = `f649f1d`. typecheck clean, build clean, **1164 tests / 77 files**
(was `1145 / 76` before #123). Every remaining slice adds tests, so read the
current number off `main` at the start of your leg.

## What #123 measured that the next legs need

- **A value read behind a transition is not a settled one.** `gui-123`'s first
  run reported "tabbing lands on an invisible control" off a computed
  `opacity: 0.585` — that was the 150ms reveal mid-flight, not a defect. It now
  records the value **on landing** beside the settled one, so an animating rule
  (`0.17 → 1`) is distinguishable from one that never applies (`0 → 0`). Its
  hover phase had a settle wait and passed while its keyboard phase did not.
  **Binds #125 and #126**, both visual, both likely to read computed styles.
- **A GUI driver can cost ZERO CLI turns.** Remove main's `chat:send` listener
  with `ipcMain.removeAllListeners` before typing: the renderer still appends
  the user bubble, and no engine turn starts. **Read the count back** —
  `{before: 1, after: 0}` — because a send that quietly still fired would empty
  the composer under later assertions and read as a product failure.
- **`display: none` is not the same hiding as `opacity: 0`.** The first removes
  the tab stop with the pixels. A control meant to be keyboard reachable while
  invisible must stay laid out, and the driver asserts the computed `display`
  for exactly that reason.
- **`pendingInsert` is the composer's one insert channel** and now has two
  callers. Its nonce is load-bearing in both.

## Landmines this batch will hit

- **The chat pane now carries TWO controls with the same treatment** — #122's
  copy button on fenced blocks and #123's reuse button on user rows. Both take
  the #93 hairline ring alone because both wash on hover. A third gets the same
  or it will look like a different kind of control.
- **`/rewind` and `/bg` are NOT CLI commands here.** Measured: 121 advertised
  commands, neither present. `/bg` is one of three ways to OPEN the CLI's agent
  view — a terminal takeover — which is why it "doesn't work". Do not build a UI
  wrapper for either; **#127 measures whether any other route exists** and
  #123's warrant note now points at it.
- **`/effort` IS advertised**, and the model list carries `supportedEffortLevels`.
  The slider's five positions come from the SDK's `EffortLevel` type, which
  excludes `ultracode` and `auto` — those are in the command's argument hint but
  are not points on the scale. Do not invent slider positions for them.
- **`effort` rides `Options`, so it binds at query CONSTRUCTION.** A setter that
  only stores the value will appear to work and change nothing. Follow
  `model:set` exactly, including reading the resume target BEFORE the discard.
- **Acrylic on the subagent pane REDS `gui-98` criterion 5**, which greps
  `subagent.css` for zero `backdrop-filter`. Replace that criterion with a
  **positive** pin — a deviation with no positive pin gets quietly conformed
  away by a later tidy-up, which is exactly what #96 was.
- **The map ADR refuses four NAMED alternatives, not aesthetics.** Keep shape =
  kind and colour = status, keep `role="group"`, keep the halo alpha in `fill`
  not `opacity`, and measure hit radius **within a depth band** or a nested
  spine collapses every hit circle to `r=0`.
- **A renderer-side message edit cannot persist**, and #123 is the record of
  why: `setMessages(transcript.map(toChatMessage))` runs on adopt and on every
  live-tail reload, so the pane is a projection of the CLI's file.
- **`capturePage` takes window DIP; `getBoundingClientRect()` gives the ZOOMED
  page's CSS pixels.** Scale by `webContents.getZoomFactor()` or the shot lands
  up and left. `page.screenshot({clip})` has the same defect. **Binds #125 and
  #126.** Hover states cannot be eyeballed either — `--tint-2` is 6% alpha;
  assert them with `getComputedStyle`.

## Stylesheet rules that bind more than one slice

- **Stylesheets are read as raw TEXT by SIX tests now** — `scrollbar.test.ts`,
  `theme.test.ts`, `multiline-composer.test.tsx`, `markdown-tables.test.tsx`,
  `code-copy.test.tsx` and #123's `reuse-message.test.tsx`. No comment may
  contain a closing brace; no scrollbar rule may be component-scoped; **and
  `base.css` warns that even NAMING the scrollbar pseudo-element in a comment
  trips the scan.** `.bubble` and `.message-input` stay ungrouped — and
  `.bubble {` must stay the **first** literal match of that string in
  `chat.css`, which `reuse-message.test.tsx` now pins, because
  `multiline-composer` slices from exactly it.
- **`markdown.css` may only author DESCENDANT rules** — react-markdown owns the
  markup. `chat.css` has no such restriction: #123's rules are top-level,
  because `Chat.tsx` owns that markup itself.
- **The `@import` order in `styles.css` IS the cascade.** Add rules inside a
  file; never reorder the imports.
- **Focus rings are picked per control, not applied.** Anything that paints a
  fill in any state takes the hairline alone. #122's and #123's controls both
  follow this, and both rings are verified against the **built** stylesheet
  under a real Tab focus rather than only as stylesheet text.
- **jsdom loads no CSS.** A raw-text pin proves a rule was written, never that
  it works. Three routes exist now: #121's (render measured markup in a real
  Electron window and read computed layout), #122's (drive the real app and read
  `getComputedStyle` off the focused control) and #123's (read the same value
  twice around a transition).

## Process landmines from this batch

- **Unscored is not refuted.** #122's spike scored its preferred clipboard route
  DEAD on run 1 because two probe buttons overlapped and the click was refused —
  the handler never ran, and a bare `.catch(() => {})` hid it. #123's driver hit
  the same family from a different direction: a real product behaviour reported
  as broken because the instrument read it too early.
- **Measure before you ask an agent.** The single most valuable act of the
  planning session was a zero-turn `supportedCommands()` probe that main ran
  itself. It killed two asks and sized a third.
- **Probe by CALLING, never by grepping a bundle or reading a `.d.ts`** — a
  declared wire type is not a callable route (#115); a callable route is not an
  effective one (#117). #127 lives or dies on this.
- **A negative claim needs a negative-shaped warrant.**
- **A driver never seen failing proves nothing** — and its red path must fail
  *cleanly*. `gui-123` was verified red twice with distinct messages: control
  removed (stops at phase 2, summary printed, no leaked process) and reveal rule
  removed (reds hover and keyboard, `onLand: 0`).
- **An absence must be counted, not assumed.** #123's "the click reaches main by
  no route" pin counts `targetSession` calls **before** the click, because
  adopting the session had already made one — a bare `not.toHaveBeenCalled()`
  was false for a reason with nothing to do with the feature.
- **Every control-protocol probe needs a bogus-subtype negative control.**

## Still-live landmines from earlier legs

- **`canUseTool` is NOT a control surface** (#116) — deny with `disallowedTools`.
- **`setBackgroundMaterial` has NO runtime whitelist** — `src/shared/backdrop.ts`'s
  compare-never-coerce guard is the only one.
- **No GUI driver can see a DWM backdrop** — `page.screenshot()` cannot show it
  and `--disable-gpu` flattens acrylic. Pin the declaration as text.
- **An event handler in main must not be able to throw** — Electron turns it
  into a modal error dialog over the app.
- **A green suite is evidence about the code only if the runner is sound** —
  `git stash push -u && npm test` first.
- **`gui-52`'s red is DOUBTFUL** and `gui-75` is focus-dependent; reproduce solo
  on clean `main` before believing either.
- Harness scripts importing `.ts` from `src/` need `node --experimental-strip-types`
  on this Node (22.17). Use `fileURLToPath`, never `URL.pathname` — this repo's
  path contains a space.
- **Node 22 refuses to spawn a `.cmd`** (`EINVAL`, CVE-2024-27980 mitigation).
  Electron's own `electron.exe` under `node_modules/electron/dist/` is a real
  exe and spawns fine.
- **The repo is CRLF throughout, with no `.gitattributes`.** Both of #123's new
  files were written LF and needed converting. Check every new file.
- Never hardcode a model name. Never read `~/.claude/daemon/roster.json`.
- Absence assertions need a surviving positive control and mutation evidence.
- **Squash-merged ticket branches need `git branch -D`.**

## Do not decide these

The five standing calls remain closed **except one**: *whether the glass ban
reaches a `var(--surface)` pane* is now **answered for the subagent viewer
only**, by the owner naming that surface. It stays undecided for every other
pane. The other four are untouched: the Tailwind adopt-utilities half, the
titlebar control count, the 12px line box for 11px muted descriptions, and the
accent clause enumeration after #97.

Four open owner-calls live in `.claude/vibe.md` under `## Needs you`. **#123
added none and resolved none by decision** — it *shipped* the fourth (refill
rather than a true edit) with the reversible default the ticket already named,
and the record now carries why a true edit is impossible rather than merely
unchosen. The count stands at four for the owner to revisit.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[happy-path]]
