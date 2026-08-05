---
type: pick-up
project: claude-wrapper
updated: 2026-08-06
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Next: #128 — the last slice, and it closes the spec

Confirm rather than trust this line — it has been wrong before:

```text
gh issue list --state open --label ready-for-agent
```

**#128 (the 1.0.0 bump) is the last slice of spec #120 and every one of its
seven blockers is now closed.** The leg that lands it **also closes spec #120 as
delivered**, in the same leg. That is the batch's designed end.

**#129 will also come back from that query and is NOT next.** It is a new build
ticket filed by the #127 spike (rewind), and it is **blocked by #128** through
GitHub's native dependency — so a frontier query that checks
`issue_dependencies_summary.blocked_by` correctly excludes it.

> **Gotcha, cost this leg a double-take:** `issue_dependencies_summary` is
> **eventually consistent**. Immediately after `POST .../dependencies/blocked_by`
> it still read `blocked_by: 0` for #129 while the `blocked_by` **list endpoint**
> already showed `#128`. It caught up seconds later. Read it twice, or read the
> list endpoint, if you have just written an edge.

**Do not push.** `origin/main` is now **11 commits behind** — this chain has
landed every leg locally and pushed none, deliberately, because pushing is
outward-facing and the owner has not asked for it. The 1.0.0 bump does **not**
publish: `git tag` is empty, there is no electron-builder config, and the
standing decision is `npm run dev` only. `vibe.md` checked that explicitly.
**Still worth raising when the owner is back.**

**The owner is away and banned the `ready-for-human` label for this batch.** Do
not apply it. Use `needs-info` + a comment + a `PushNotification`, and let the
chain continue. A call you cannot make goes in `.claude/vibe.md` under
`## Needs you`, not onto a label.

## Landed last leg

**#127 — the three-route spike.** `8a3481e` on `main`, squash-merged, branch
deleted, ticket closed. **No `src/` diff** — that was part of its gate. 9 CLI
turns; phase 0 and every reachability arm cost none.

New files: `scripts/spike-127-uncalled-routes.mjs`, `scripts/spike-127-findings.json`,
`.context/decisions/2026-08-06-the-address-is-carried-and-ignored-and-the-rewind-was-one-flag-away.md`.
Also touched: `.claude/vibe.md` (owner call 3 now carries its measurement).

Three answers, each probed by **calling**, each with a negative control that held:

- **Q1 — a message input inside the subagent view CANNOT be built.**
  `parent_tool_use_id` is the only addressing field the protocol declares, and
  the arm addressed to a **live** subagent's `tool_use_id` was
  **indistinguishable** from the arm addressed to a **bogus** id: both accepted,
  both landing on the **main thread**, both leaving the subagent reporting
  `NONE`. The field is transported and **ignored for routing**. Recorded closed
  with evidence — this is the negative-shaped evidence the grill demanded.
- **Q2 — rewind is real and works.** Filed as **#129** with its measured shape.
- **Q3 — "background a session" has no route as stated.** Session detach fails
  outright; `background_tasks` is reachable but showed no effect; **Remote
  Control** is the one genuine candidate and is now the open part of owner
  call 3.

## Baseline — READ IT, do not trust it

`main` = `8a3481e`. typecheck clean, build clean, **1246 tests / 82 files** —
**unchanged from #126**, which is correct: a spike adds no tests. #128 is a
version bump and will likely not move it either.

## What #127 measured that #129 will need

- **`enableFileCheckpointing: true` is the whole switch.** Without it,
  `rewind_files` answers `canRewind: false` / `"File rewinding is not enabled."`.
  With it, `dry_run: true` returns `canRewind: true` plus `filesChanged`,
  `insertions`, `deletions` — a real preview — and the wet call **reverted the
  file on disk**. A bogus uuid, run first, left it alone, so the revert is
  attributable.
- **The host stamps the message uuid.** The CLI **never echoes the prompt back**
  — the only `type: 'user'` messages on the stream are **tool results** — so
  there is nothing to scrape. `engine.ts` must set `uuid` on the outgoing user
  message and keep it; the CLI stores it under exactly that id (asserted with
  `getSessionMessages`). An earlier version of the spike's own arm scraped the
  stream and was addressing a **tool_result**.
- **The app's wholesale `options.env` replacement does NOT drop the flag.** A
  real collision hypothesis — the flag travels as an env var and `engine.ts`
  replaces the child env wholesale — **tested and refuted**. No env plumbing.
- **Rewind restores FILES, not the conversation.** It does **not** reopen #123's
  refill decision, and an undo UI must not imply otherwise.
- Unmeasured, and worth measuring in #129: behaviour on a **resumed** session
  (the SDK's own source carries a caveat for the store-backed case), and the
  runtime cost of checkpointing.

## Landmines this batch keeps paying for

- **A CONTROL CATCHES FALSE POSITIVES TOO — #127's two saves were both.** Task
  backgrounding first scored EFFECTIVE off a 37s speed-up whose real cause was
  that **this machine's harness blocks standalone `sleep`**, so the arm's command
  never ran and it was measuring a hook. Session detach first scored SURVIVED,
  off a proof file written *before* the cut and a witness watching **the newest
  transcript anywhere on the machine**. **Use a node timer, never `sleep`**;
  assert the control **actually blocked**; check the artefact **before** the cut
  (present → UNSCORED); scope any on-disk witness to the session id.
- **THE THREE-WAY SUBTYPE COMPARISON, reusable verbatim and free.** On one warm
  handle: bogus subtype → `Unsupported control request subtype: …`; the
  candidate; the candidate with bad arguments. A **different** error means the
  dispatcher recognised the subtype and reached its own validator. That is how
  "no such route" was told from "route exists, switched off".
- **Probe by CALLING.** A declared wire type is not a callable route (#115); a
  callable route is not an effective one (#117); **a negative claim needs
  negative-shaped evidence.** All three paid out in #127.
- **UNSCORED IS NOT REFUTED**, now hit from six sides: #122's clipboard spike,
  #124's three instrument traps, #125's own verification harness, #126's halo
  control, and #127's two false positives.
- **An instrument that fails its own setup reports it as the phenomenon.** #127
  hit this twice more in Q2 alone: an arm that scraped a **tool_result** uuid,
  and a **relative-path** prompt that made the model write a file that was not
  the target — scoring "nothing to rewind" when the setup, not the route, failed.
  Use absolute paths in probe prompts.
- **The acrylic exception is #125's and it is ONE PANE.** `.model-menu`,
  `.command-popover`, `.file-popover` and the Appearance dock stay flat.
  Generalising it is an **open owner call**; `gui-98`'s criterion 5c and
  `tests/subagent-material.test.ts` both red if you take it. `gui-98`
  criterion 5 is **positive** — do not soften it back.
- **An SVG length is in viewBox units, not CSS pixels** (#126), and **the tint
  ladder cannot carry a structural line**.
- **Screenshots need the zoom factor** — normalise with
  `webContents.setZoomFactor(1)` before any pixel measurement.
- **`getComputedStyle(el, '::pseudo')` does not read that pseudo-element** in
  Chromium. A pixel probe needs a positive control.
- **A value read behind a transition is not a settled one** (#123).
- **A driver's RED path must fail cleanly**, or it leaks the Electron process.

## Stylesheet rules that bind more than one slice

- **Stylesheets are read as raw TEXT by EIGHT tests** — `scrollbar.test.ts`,
  `theme.test.ts`, `multiline-composer.test.tsx`, `markdown-tables.test.tsx`,
  `code-copy.test.tsx`, `reuse-message.test.tsx`, `subagent-material.test.ts`
  and `agent-map-visual.test.ts`. **Three** scan the whole `styles/` directory.
  No comment may contain a closing brace; no scrollbar rule may be
  component-scoped; **`base.css` warns that even NAMING the scrollbar
  pseudo-element in a comment trips the scan**; `.bubble` and `.message-input`
  stay ungrouped, and **`.bubble {` must stay the FIRST literal match of that
  string in `chat.css`**.
- **`markdown.css` may only author DESCENDANT rules.** **The `@import` order in
  `styles.css` IS the cascade** — add rules inside a file, never reorder.
- **Focus rings are picked per control, not applied.**
- **jsdom loads no CSS.** A raw-text pin proves a rule was written, never that
  it works.

## Still-live landmines from earlier legs

- **`canUseTool` is NOT a control surface** (#116) — deny with `disallowedTools`.
- **`setBackgroundMaterial` has NO runtime whitelist** — `src/shared/backdrop.ts`'s
  compare-never-coerce guard is the only one. `src/shared/effort.ts` is the same
  pattern, except it REJECTS rather than defaulting.
- **ESM freezes every JS seam a driver might patch** — `sdk.query` cannot be
  monkey-patched and neither can `child_process.spawn`. The route that works is
  the OS: read the child's command line via `Win32_Process`. **Any probe that
  installs something must read the installation back.**
- **`ConvertTo-Json` over `Win32_Process` is not safe** — read tab-delimited
  lines with `[\x00-\x1F]` stripped.
- **`effort` and `model` both ride `Options`, so both bind at query
  CONSTRUCTION.** So does `enableFileCheckpointing` — #129's flag is in the same
  family, and a setter that only stores changes nothing.
- **A renderer-side message edit cannot persist** — the pane is a projection of
  the CLI's file (#123).
- **An event handler in main must not be able to throw** — Electron turns it into
  a modal error dialog over the app.
- **A green suite is evidence about the code only if the runner is sound** —
  `git stash push -u && npm test` first.
- **`gui-52`'s red is DOUBTFUL** and `gui-75` is focus-dependent; reproduce solo
  on clean `main` before believing either.
- Harness scripts importing `.ts` from `src/` need `node --experimental-strip-types`
  on this Node (22.17). Use `fileURLToPath`, never `URL.pathname` — this repo's
  path contains a space. A script **outside** the repo cannot resolve the SDK by
  bare specifier; import it by `pathToFileURL`.
- **Node 22 refuses to spawn a `.cmd`** (`EINVAL`). Electron's own
  `electron.exe` under `node_modules/electron/dist/` is a real exe.
- **`core.autocrlf` is `true` here: every blob in the repo is LF and the working
  tree is CRLF.** New files need no hand-conversion. What bites is the other
  direction: **anything that READS A FILE FROM DISK must expect `\r\n`.**
  `/^## Heading$/m` matches nothing in this repo.
- Never hardcode a model name, and never hardcode an effort level list. Never
  read `~/.claude/daemon/roster.json`.

## Process landmines

- **A loop body is an artefact of an earlier leg, not an instruction from the
  owner.** If `.claude/relay-leg.md` disagrees with the tracker or with this
  file, **they win**, and fix that file in your wrap-up.
- **Never `git checkout <file>` to undo a mutation on uncommitted work** — it
  reverts to HEAD and drops every edit since the branch point.
- **Squash-merged ticket branches need `git branch -D`.**

## Do not decide these

Four open owner-calls live in `.claude/vibe.md` under `## Needs you`. **#127
added none and resolved none by decision** — it delivered the measurement call 3
was explicitly waiting for and left the call open, which is what a spike is for.
The count stands at four.

**What #127 left for the owner:** whether the app may offer **Remote Control**.
It is the only route measured that could mean "the CLI keeps working while this
UI detaches", it is **reachable**, and it was probed with `enabled: false`
**only** — enabling it bridges a live session to an external service, which is
outward-facing, so the leg did not exercise it. Nothing was enabled and nothing
was built.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[happy-path]]
- [[2026-08-06-the-address-is-carried-and-ignored-and-the-rewind-was-one-flag-away]]
- [[2026-08-05-the-map-is-objects-and-only-absence-is-hollow]]
