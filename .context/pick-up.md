---
type: pick-up
project: claude-wrapper
updated: 2026-08-05
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Next: #123 — five unblocked tickets left

Confirm rather than trust this line — it has been wrong before:

```text
gh issue list --state open --label ready-for-agent
```

**#123–#127 are unblocked and independent.** #128 (the 1.0.0 bump) waits on all
of them and is last by the owner's explicit instruction — **it still wears
`ready-for-agent`, so the frontier query returns it.** The ordering lives in the
ticket body and in `.claude/relay-leg.md`, not in a label. Spec **#120** is the
container and carries the full reasoning.

**The owner is away and banned the `ready-for-human` label for this batch.** Do
not apply it. Use `needs-info` + a comment + a `PushNotification`, and let the
chain continue. A call you cannot make goes in `.claude/vibe.md` under
`## Needs you`, not onto a label.

## Landed last leg

**#122 — code blocks carry a copy button.** `a359f9f` on `main`, squash-merged,
branch deleted, ticket closed. The repo's **first `components` override** on
ReactMarkdown: the `pre` renderer is replaced by a wrapper holding the button
and the original `pre`, and **one exported map is shared by both** ReactMarkdown
call sites. Route taken: **`navigator.clipboard.writeText`**, measured effective
in the built app — no IPC bridge, no preload change, no ADR. New files:
`tests/code-copy.test.tsx`, `scripts/spike-122-clipboard.mjs`,
`.claude/skills/run-desktop/gui-122.mjs`.

## Baseline — READ IT, do not trust it

`main` = `a359f9f`. typecheck clean, build clean, **1145 tests / 76 files**
(was `1130 / 75` before #122). Every remaining slice adds tests, so read the
current number off `main` at the start of your leg.

## What #122 measured that the next legs need

- **`file://` is a SECURE CONTEXT in Chromium.** That is why `navigator.clipboard`
  exists in the built app at all despite `win.loadFile`. The "the renderer is on
  `file://` so web APIs are unavailable" worry is dead for this repo — but check
  the specific API rather than generalising from this one.
- **Blink rewrites LF → CRLF inside `writeText` on Windows.** Not the OS, not the
  button: writing the same LF string from **main** reads back unchanged. If you
  ever compare clipboard content in a driver, compare modulo that — and prove it
  with a main-side control first rather than assuming it.
- **`capturePage` takes window DIP; `getBoundingClientRect()` gives the ZOOMED
  page's CSS pixels.** This app has its own zoom, so scale the rect by
  `webContents.getZoomFactor()` or the shot lands up and to the left of the
  target. Three runs of #122's driver photographed the wrong region.
  `page.screenshot({clip})` has the same problem and no clean fix — use
  `capturePage`. **Binds #125 and #126**, both of which are visual tickets.
- **Playwright's `hover()` works, but `--tint-2` is 6% alpha** — a real state
  change that is invisible in a PNG. Assert hover/active states by
  `getComputedStyle`, never by comparing two screenshots.

## Landmines this batch will hit

- **A copy control now exists on every fenced block.** #123 refills the composer
  from a past user message; user bubbles are not markdown-rendered, so the two do
  not collide — but if #123 ever renders one through ReactMarkdown it inherits
  the override.
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

- **Stylesheets are read as raw TEXT by five tests now** — `scrollbar.test.ts`,
  `theme.test.ts`, `multiline-composer.test.tsx`, `markdown-tables.test.tsx` and
  #122's new `code-copy.test.tsx`. No comment may contain a closing brace; no
  scrollbar rule may be component-scoped; **and `base.css` warns that even
  NAMING the scrollbar pseudo-element in a comment trips the scan.** `.bubble`
  and `.message-input` stay ungrouped.
- **`markdown.css` may only author DESCENDANT rules** — react-markdown owns the
  markup. `code-copy.test.tsx` now enforces that every `.code-block` /
  `.code-copy` rule starts with `.assistant-body `, the same guard #121 put on
  table rules.
- **The `@import` order in `styles.css` IS the cascade.** Add rules inside a
  file; never reorder the imports.
- **Focus rings are picked per control, not applied.** Anything that paints a
  fill in any state takes the hairline alone. #122's control follows this, and
  the ring is now verified against the **built** stylesheet under a real Tab
  focus rather than only as stylesheet text.
- **jsdom loads no CSS.** A raw-text pin proves a rule was written, never that
  it works. Two routes exist now: #121's (render measured markup in a real
  Electron window and read computed layout) and #122's (drive the real app and
  read `getComputedStyle` off the focused control).

## Process landmines from this batch

- **Unscored is not refuted.** #122's spike scored its preferred clipboard route
  as DEAD on run 1 because two probe buttons overlapped and the click was
  refused — the handler never ran, and a bare `.catch(() => {})` hid it.
  Believing it would have built an IPC bridge the app does not need. Any probe
  must record its gesture errors and score "did the trial run" separately from
  "did the thing work".
- **Measure before you ask an agent.** The single most valuable act of the
  planning session was a zero-turn `supportedCommands()` probe that main ran
  itself. It killed two asks and sized a third.
- **Probe by CALLING, never by grepping a bundle or reading a `.d.ts`** — a
  declared wire type is not a callable route (#115); a callable route is not an
  effective one (#117). #127 lives or dies on this.
- **A negative claim needs a negative-shaped warrant.** "`subagent:changed` is a
  leaf channel" proves that channel is outbound and says nothing about whether
  any inbound route exists. That is #90 and #116's error in both directions.
- **A driver never seen failing proves nothing** — and its red path must fail
  *cleanly*. `gui-122.mjs` was verified red by stashing the two source files and
  rebuilding; the first red run threw an uncaught `TimeoutError`, skipping the
  summary and leaking the Electron process, so the wait is now caught and
  reported with a diagnosis.
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
  exe and spawns fine — that is how #121 and #122 got real renders.
- **The repo is CRLF throughout, with no `.gitattributes`.** Anything written by
  a tool that emits LF has to be converted, generated findings JSON included.
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

Four open owner-calls live in `.claude/vibe.md` under `## Needs you`. Every one
already has a reversible default taken and the affected ticket states it. **#122
added none.**

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[happy-path]]
