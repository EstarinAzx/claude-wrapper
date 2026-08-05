---
type: pick-up
project: claude-wrapper
updated: 2026-08-05
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Next: #125 — three unblocked tickets left

Confirm rather than trust this line — it has been wrong before:

```text
gh issue list --state open --label ready-for-agent
```

**#125–#127 are unblocked and independent.** #128 (the 1.0.0 bump) waits on all
of them and is last by the owner's explicit instruction — **it still wears
`ready-for-agent`, so the frontier query returns it.** The ordering lives in the
ticket body and in `.claude/relay-leg.md`, not in a label. Spec **#120** is the
container and carries the full reasoning.

**The owner is away and banned the `ready-for-human` label for this batch.** Do
not apply it. Use `needs-info` + a comment + a `PushNotification`, and let the
chain continue. A call you cannot make goes in `.claude/vibe.md` under
`## Needs you`, not onto a label.

## Landed last leg

**#124 — a five-position effort control, sourced from the CLI.** `39c2896` on
`main`, squash-merged, branch deleted, ticket closed. The composer footer
carries a reasoning-effort range beside the model pill; its positions are the
levels the CLI advertises for the current model, read off `supportedEffortLevels`
on the rows `model:list` already returns. Changing it discards the engine and
resumes the conversation, because `effort` rides `Options` and binds at query
construction. New files: `src/shared/effort.ts`, `src/main/effort-mode.ts`,
`tests/effort.test.ts` (24), `tests/effort-mode.test.ts` (26),
`tests/effort-control.test.tsx` (19), `.claude/skills/run-desktop/gui-124.mjs`,
`scripts/gui-124-shots/`.

## Baseline — READ IT, do not trust it

`main` = `39c2896`. typecheck clean, build clean, **1226 tests / 80 files**
(was `1164 / 77` before #124). Every remaining slice adds tests, so read the
current number off `main` at the start of your leg.

**`origin/main` is 5 commits behind `main`.** This chain has landed every leg
locally and pushed none — legs 1–4 all did. Nothing is lost, but the tracker's
commit references do not resolve on GitHub. Left as-is deliberately: pushing is
outward-facing and the owner has not asked for it. Worth raising when they are
back.

## What #124 measured that the next legs need

- **ESM freezes every JS seam a driver might patch.** `sdk.query` cannot be
  monkey-patched — the SDK ships as ESM and `require()` yields a **frozen
  namespace**, so the assignment silently no-ops — and `child_process.spawn`
  cannot either, because the SDK binds it with an ESM import at link time. The
  route that works is the **OS**: read the command line of the child process
  (`Win32_Process`, walking descendants of the Electron main pid). `--effort` is
  a real CLI flag, so the value is visible in argv.
- **ANY PROBE THAT INSTALLS SOMETHING MUST READ THE INSTALLATION BACK.** The
  frozen-namespace assignment fails silently, and the driver's own empty capture
  array would have read as "the value never arrived" — a false RED about the
  product, produced by a broken instrument.
- **`getComputedStyle(el, '::-webkit-slider-runnable-track')` DOES NOT read that
  pseudo-element in Chromium.** It returns the element's own style. Scored as
  "the track paints nothing" on the first run. **Binds #126** if it reads any
  pseudo-element style.
- **`locator.screenshot()` has the zoom/clip defect too.** At this app's live
  **1.25** factor it cropped a flat patch of the wash — 1 distinct colour, read
  as "nothing paints"; at zoom 1 the same sample reads 26. Normalise with
  `webContents.setZoomFactor(1)` before any pixel measurement. **Binds #125 and
  #126.**
- **A PIXEL PROBE NEEDS A POSITIVE CONTROL.** `gui-124` samples `.send-btn`
  (authored mint fill) beside its target, so a broken instrument reports
  UNSCORED instead of refuting. Copy this for #126.
- **A control with a null state and an ordered scale needs a STOP for the null.**
  Five bare stops left `low` unreachable by one gesture. The suite caught it.
- **`ConvertTo-Json` over `Win32_Process` is not safe** — a live command line
  carried a raw control character and took the probe down mid-run. Read
  tab-delimited lines with `[\x00-\x1F]` stripped.
- **Never `git checkout <file>` to undo a mutation on uncommitted work.** It
  reverts to HEAD and drops every edit since the branch point.

## Landmines this batch will hit

- **The composer footer now carries a THIRD control** (`.effort-range`), joining
  #122's copy button and #123's reuse button in taking the #93 hairline alone.
  Verified under a real Tab: 2 hops from the composer, `:focus-visible` matches,
  ring is `inset 0 0 0 1px var(--tint-6)`.
- **`/rewind` and `/bg` are NOT CLI commands here.** Measured: 121 advertised
  commands, neither present. `/bg` is one of three ways to OPEN the CLI's agent
  view — a terminal takeover. Do not build a UI wrapper for either; **#127
  measures whether any other route exists**.
- **`effort` and `model` both ride `Options`, so both bind at query
  CONSTRUCTION.** A setter that only stores changes nothing. `model:set`,
  `permission:set-mode` and now `effort:set` all read the resume target BEFORE
  the discard; `effort-mode.ts` ports that transaction so it is testable.
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
  up and left. **Binds #125 and #126.** Hover states cannot be eyeballed either
  — `--tint-2` is 6% alpha; assert them with `getComputedStyle`.
- **No GUI driver can see a DWM backdrop** — `page.screenshot()` cannot show it
  and `--disable-gpu` flattens acrylic. #125 pins the declaration as text.

## Stylesheet rules that bind more than one slice

- **Stylesheets are read as raw TEXT by SIX tests** — `scrollbar.test.ts`,
  `theme.test.ts`, `multiline-composer.test.tsx`, `markdown-tables.test.tsx`,
  `code-copy.test.tsx` and `reuse-message.test.tsx`. No comment may contain a
  closing brace; no scrollbar rule may be component-scoped; **and `base.css`
  warns that even NAMING the scrollbar pseudo-element in a comment trips the
  scan.** `.bubble` and `.message-input` stay ungrouped — and `.bubble {` must
  stay the **first** literal match of that string in `chat.css`.
  `scrollbar.test.ts` only inspects lines containing `::-webkit-scrollbar`, so
  #124's `::-webkit-slider-*` rules are outside it.
- **`markdown.css` may only author DESCENDANT rules** — react-markdown owns the
  markup. `chat.css` and `composer.css` have no such restriction.
- **The `@import` order in `styles.css` IS the cascade.** Add rules inside a
  file; never reorder the imports.
- **Focus rings are picked per control, not applied.** Anything that paints a
  fill in any state takes the hairline alone. A range's track is an authored
  fill, which is why `.effort-range` takes it.
- **jsdom loads no CSS.** A raw-text pin proves a rule was written, never that it
  works. Four routes exist now: #121's (render measured markup in a real
  Electron window and read computed layout), #122's (drive the real app and read
  `getComputedStyle` off the focused control), #123's (read the same value twice
  around a transition) and #124's (**sample the element's own pixels at zoom 1,
  behind a positive control**).

## Process landmines from this batch

- **Unscored is not refuted**, and #124 hit it three times in one driver — a
  frozen-namespace patch, a pseudo-element computed style, and a zoomed
  screenshot clip. All three produced a confident false RED before the controls
  went in.
- **Measure before you ask an agent.** The single most valuable act of the
  planning session was a zero-turn `supportedCommands()` probe.
- **Probe by CALLING, never by grepping a bundle or reading a `.d.ts`** — a
  declared wire type is not a callable route (#115); a callable route is not an
  effective one (#117). #127 lives or dies on this.
- **A negative claim needs a negative-shaped warrant.** #124's "Default sends no
  effort" is scored on the ABSENCE of `--effort` in a freshly spawned process's
  argv, not on a different value.
- **A driver never seen failing proves nothing — and its red path must fail
  CLEANLY.** `gui-124`'s first red verification died on a JSON parse error
  instead of reporting the finding, which would have hidden a real regression
  behind an UNSCORED line.
- **An absence must be counted, not assumed.**
- **Every control-protocol probe needs a bogus-subtype negative control.**

## Still-live landmines from earlier legs

- **`canUseTool` is NOT a control surface** (#116) — deny with `disallowedTools`.
- **`setBackgroundMaterial` has NO runtime whitelist** — `src/shared/backdrop.ts`'s
  compare-never-coerce guard is the only one. `src/shared/effort.ts` is the same
  pattern, except it REJECTS rather than defaulting: there is no safe default
  effort to fall back to.
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
- **The repo is CRLF throughout, with no `.gitattributes`.** All five of #124's
  new files were written LF and needed converting. Check every new file.
- Never hardcode a model name — and now, never hardcode an effort level list
  either. Never read `~/.claude/daemon/roster.json`.
- Absence assertions need a surviving positive control and mutation evidence.
- **Squash-merged ticket branches need `git branch -D`.**

## Do not decide these

The five standing calls remain closed **except one**: *whether the glass ban
reaches a `var(--surface)` pane* is now **answered for the subagent viewer
only**, by the owner naming that surface. It stays undecided for every other
pane. The other four are untouched: the Tailwind adopt-utilities half, the
titlebar control count, the 12px line box for 11px muted descriptions, and the
accent clause enumeration after #97.

Four open owner-calls live in `.claude/vibe.md` under `## Needs you`. **#124
added none and resolved none by decision** — it *shipped* the second (five
positions, no `ultracode`/`auto`) exactly as the ticket specified, with the
record now carrying the SDK citation that makes it a measurement rather than a
taste call. The count stands at four for the owner to revisit.

**One thing #124 decided that the owner may want to revisit:** the effort range
has **six stops for five levels** — stop 0 is `Default`, the absence of a level.
It is not a sixth level and not `ultracode`/`auto` smuggled in; it exists because
five bare stops left `low` unreachable by one gesture. Reversible, stated in the
ticket comment, and recorded here rather than added to the owner-call queue,
because the ticket's own "five positions" wording is about the LEVELS.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[happy-path]]
- [[2026-08-05-esm-freezes-every-js-seam-so-measure-the-process]]
