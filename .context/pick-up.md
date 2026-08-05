---
type: pick-up
project: claude-wrapper
updated: 2026-08-05
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Next: #122 — six unblocked tickets left

Confirm rather than trust this line — it has been wrong before:

```text
gh issue list --state open --label ready-for-agent
```

**#122–#127 are unblocked and independent.** #128 (the 1.0.0 bump) waits on all
of them and is last by the owner's explicit instruction. Spec **#120** is the
container and carries the full reasoning.

**The owner is away and banned the `ready-for-human` label for this batch.** Do
not apply it. Use `needs-info` + a comment + a `PushNotification`, and let the
chain continue. A call you cannot make goes in `.claude/vibe.md` under
`## Needs you`, not onto a label.

## Landed last leg

**#121 — markdown tables render.** `ef6ef22` on `main`, squash-merged, branch
deleted, ticket closed. 41 lines of CSS in `markdown.css` and one new test file.
No plugin, no dependency, no `Chat.tsx` change.

## Baseline — READ IT, do not trust it

`main` = `ef6ef22`. typecheck clean, build clean, **1130 tests / 75 files**
(was `1122 / 74` before #121). Every remaining slice adds tests, so read the
current number off `main` at the start of your leg.

## Landmines this batch will hit

- **#121's measurement binds #122.** The markdown parser writes column alignment
  as an **inline `style` on every cell**, and emits **no wrapper element**. So
  nothing anywhere may mark `text-align` important, and the table scrolls via
  `display: block` on itself. **#122 adds a `components` override to wrap
  `<pre>` — do NOT extend that to `<table>`.** The block route is already
  measured working in a real Chromium; a wrapper would add a second scroll
  container for no gain.
- **`/rewind` and `/bg` are NOT CLI commands here.** Measured: 121 advertised
  commands, neither present. `/bg` is one of three ways to OPEN the CLI's agent
  view — a terminal takeover — which is why it "doesn't work". Do not build a UI
  wrapper for either; #127 measures whether any other route exists.
- **`/effort` IS advertised**, and the model list carries `supportedEffortLevels`.
  The slider's five positions come from the SDK's `EffortLevel` type, which
  excludes `ultracode` and `auto` — those are in the command's argument hint but
  are not points on the scale. Do not invent slider positions for them.
- **`effort` rides `Options`, so it binds at query CONSTRUCTION.** A setter that
  only stores the value will appear to work and change nothing. Follow
  `model:set` exactly, including reading the resume target BEFORE the discard.
- **A copy button can pass every test and be dead in the built app.** Production
  loads `file://` (`win.loadFile`), dev loads http://localhost, and **no
  `setPermissionRequestHandler` is registered**. Verify in the BUILT app.
  Both `navigator.clipboard` and an `ipcRenderer.invoke` bridge are open — the
  bridge does **not** need an ADR, because the sandbox ADR's trigger is preload
  needing **Node**, which an invoke bridge does not.
- **Acrylic on the subagent pane REDS `gui-98` criterion 5**, which greps
  `subagent.css` for zero `backdrop-filter`. Replace that criterion with a
  **positive** pin — a deviation with no positive pin gets quietly conformed
  away by a later tidy-up, which is exactly what #96 was.
- **The map ADR refuses four NAMED alternatives, not aesthetics.** Its own
  Reversibility section calls a layout rewrite *"Easy."* Keep shape = kind and
  colour = status, keep `role="group"`, keep the halo alpha in `fill` not
  `opacity`, and measure hit radius **within a depth band** or a nested spine
  collapses every hit circle to `r=0`.
- **A renderer-side message edit cannot persist.** `setMessages(transcript.map(toChatMessage))`
  replaces the whole array from disk on adopt and on every live-tail reload.

## Stylesheet rules that bind more than one slice

- **Stylesheets are read as raw TEXT by four tests now** — `scrollbar.test.ts`,
  `theme.test.ts`, `multiline-composer.test.tsx`, and #121's new
  `markdown-tables.test.tsx`. No comment may contain a closing brace; no
  scrollbar rule may be component-scoped; **and `base.css` warns that even
  NAMING the scrollbar pseudo-element in a comment trips the scan.** `.bubble`
  and `.message-input` stay ungrouped.
- **The `@import` order in `styles.css` IS the cascade.** Add rules inside a
  file; never reorder the imports.
- **Focus rings are picked per control, not applied.** Anything that paints a
  fill in any state takes the hairline alone.
- **jsdom loads no CSS.** A raw-text pin proves a rule was written, never that
  it works. #121's route for this: render the measured markup against the
  **built** stylesheet in a real Electron window and read computed layout.

## Process landmines from this batch

- **Measure before you ask an agent.** The single most valuable act of the
  planning session was a zero-turn `supportedCommands()` probe that main ran
  itself. It killed two asks and sized a third.
- **Probe by CALLING, never by grepping a bundle or reading a `.d.ts`** — a
  declared wire type is not a callable route (#115); a callable route is not an
  effective one (#117). #127 lives or dies on this.
- **A negative claim needs a negative-shaped warrant.** "`subagent:changed` is a
  leaf channel" proves that channel is outbound and says nothing about whether
  any inbound route exists. That is #90 and #116's error in both directions.
- **A warrant can be real and still not support its claim.** `"version": "0.1.0",`
  proves a string exists, not that nothing reads it.
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
  exe and spawns fine — that is how #121 got a real render.
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

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[happy-path]]
