---
type: pick-up
project: claude-wrapper
updated: 2026-08-05
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## The queue is FULL — seven unblocked tickets

Confirm rather than trust this line — it has been wrong before:

```text
gh issue list --state open --label ready-for-agent
```

**#121–#127 are unblocked and independent.** #128 (the 1.0.0 bump) waits on all
seven and is last by the owner's explicit instruction. Spec **#120** is the
container and carries the full reasoning.

**The owner is away and banned the `ready-for-human` label for this batch.** Do
not apply it. A call you cannot make goes in `.claude/vibe.md` under
`## Needs you`, not onto a label.

## Filed 2026-08-05 by an autonomous `/preset vibe init` run

| # | what |
|---|---|
| **120** | spec — ten UI asks, with 25 grep-verified warrants and one zero-turn measurement |
| 121 | markdown tables render (CSS only) |
| 122 | code-block copy button (clipboard route **measured**, not chosen) |
| 123 | reuse a past user message in the composer (refill, never mutate) |
| 124 | five-position effort control (CLI-sourced, rebuilds the engine) |
| 125 | subagent viewer takes the window material (+ pin, ban line, ADR) |
| 126 | subagent map visual pass (inside the pinned encoding) |
| 127 | spike — three routes nobody has called |
| 128 | version 1.0.0 — blocked by #121–#127 |

No `src/` changed this session. `main` is still `e0b8855` plus a planning commit.

## Landmines this batch will hit

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
- **Tables already parse.** `remark-gfm` is wired at `Chat.tsx:132` and `:146`.
  The defect is that `markdown.css` has zero table rules. Do not add a plugin.
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

## Process landmines from this run

- **Measure before you ask an agent.** The single most valuable act of this
  session was a zero-turn `supportedCommands()` probe that main ran itself. It
  killed two asks and sized a third. Neither agent could have supplied it, and
  both would have speculated if asked.
- **A negative claim needs a negative-shaped warrant.** Pressure's best catch:
  "`subagent:changed` is a leaf channel" proves that channel is outbound and
  says nothing about whether any inbound route exists. That is #90 and #116's
  error in both directions. It moved ask 7 from "impossible" to "unmeasured".
- **A warrant can be real and still not support its claim.** `"version": "0.1.0",`
  proves a string exists, not that nothing reads it. The claim survived only
  because it was then measured directly.
- **The grep guard caught nothing again — 25 of 25 passed.** That is the good
  outcome and not a reason to drop it.
- **A flaky adversary must be swapped, not dropped.** The owner-named kimi-k3
  died three times on gateway 502/503; the run continued on a different
  cross-model Target and every decision records which adversary judged it.

## Still-live landmines from earlier legs

- **`canUseTool` is NOT a control surface** (#116) — deny with `disallowedTools`.
- **Probe by CALLING, never by grepping a bundle or reading a `.d.ts`** — a
  declared wire type is not a callable route (#115); a callable route is not an
  effective one (#117).
- **Every control-protocol probe needs a bogus-subtype negative control.**
- **`setBackgroundMaterial` has NO runtime whitelist** — `src/shared/backdrop.ts`'s
  compare-never-coerce guard is the only one.
- **`page.screenshot()` cannot show a DWM backdrop**; `--disable-gpu` flattens
  acrylic. Pin the declaration as text, never the pixels.
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
- Never hardcode a model name. Never read `~/.claude/daemon/roster.json`.
- Absence assertions need a surviving positive control and mutation evidence.
- Test baseline on `main` was **1122/74** before this batch — read it from `main`.
- Squash-merged ticket branches need `git branch -D`.

## Do not decide these

The five standing calls remain closed **except one**: *whether the glass ban
reaches a `var(--surface)` pane* is now **answered for the subagent viewer
only**, by the owner naming that surface. It stays undecided for every other
pane. The other four are untouched: the Tailwind adopt-utilities half, the
titlebar control count, the 12px line box for 11px muted descriptions, and the
accent clause enumeration after #97.

## Baseline

`main` = `e0b8855` plus this session's planning commit. No ticket branch, no
`src/` diff.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[happy-path]]
