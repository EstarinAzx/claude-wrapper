---
type: pick-up
project: claude-wrapper
updated: 2026-08-06
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Next: #129 — rewind a turn's file changes

Confirm rather than trust this line — it has been wrong before:

```text
gh issue list --state open --label ready-for-agent
```

**#129 is now the only open issue in the repo**, `ready-for-agent`, and
**unblocked** — its `blocked_by` list endpoint reads `128 closed`. It is **not
part of spec #120**, which closed with #128. It was filed by #127's spike, its
shape is already measured, and the owner asked for rewind by name.

**Read `scripts/spike-127-findings.json` before starting.** Every claim in the
ticket was produced by *calling* the route, each with a negative control that
held, and the run identifies itself in `measuredAt` / `env`.

**After #129 the frontier query comes back empty and the chain stops.**

**Do not push.** `origin/main` is now **14 commits behind** (`git rev-list
--count origin/main..main` — **read it, do not copy it**; this number has been
stale in the handoff twice now) — this chain landed
every leg locally and pushed none, deliberately, because pushing is
outward-facing and the owner has not asked for it. **Still worth raising when
they are back.**

**The owner is away and banned the `ready-for-human` label for this batch.** Do
not apply it. Use `needs-info` + a comment + a `PushNotification`, and let the
chain continue. A call you cannot make goes in `.claude/vibe.md` under
`## Needs you`, not onto a label.

## Landed last leg

**#128 — version 1.0.0.** `024361a` on `main`, squash-merged, branch deleted,
ticket closed. **Spec #120 closed as delivered in the same leg** — all eight
slices, one per relay leg, every leg gate-green.

Diff: **three lines across two files** — `package.json` plus the **two mirrored
version fields in `package-lock.json`**, which is tracked here. The ticket
predicted one line; bumping `package.json` alone would have left the lockfile
stale for the next `npm install` to silently rewrite. Bumped with
`npm version 1.0.0 --no-git-tag-version`, which moves both and cuts **no tag**
(`git tag` asserted still `0`).

**1.0.0 is a marker, not a release.** Nothing publishes. Re-verified rather than
assumed: `getVersion` / `__APP_VERSION__` / any `package.json` read across
`src/` + `electron.vite.config.ts` → **zero matches**; no electron-builder
config; `npm run dev` only. The free, stronger evidence came out of the gate —
the post-bump build emitted **byte-identical asset hashes**
(`index-DbK37Ya4.js`, `index-BA2EmCiB.css`), and a content hash cannot survive a
change the bundle observed.

New file: `.context/decisions/2026-08-06-one-point-oh-is-a-marker-and-the-lockfile-moves-with-it.md`.

## Baseline — READ IT, do not trust it

`main` = `024361a`. typecheck clean, build clean, **1246 tests / 82 files** —
unchanged across #127 and #128, which is correct: a spike and a version bump add
no tests. The batch moved it 1122/74 → 1246/82 overall.

The gate ran **twice** for #128, on `main` before the bump and again on `main`
after the merge rather than inferred from the branch. That is the standard worth
keeping when the ticket's substance *is* the gate.

## What #127 measured that #129 needs

- **`enableFileCheckpointing: true` is the whole switch.** Without it,
  `rewind_files` answers `canRewind: false` / `"File rewinding is not enabled."`.
  With it, `dry_run: true` returns `canRewind: true` plus `filesChanged`,
  `insertions`, `deletions` — a real preview — and the wet call **reverted the
  file on disk**. A bogus uuid, run first, left it alone, so the revert is
  attributable.
- **It binds at query CONSTRUCTION**, like `model` and `effort`. A setter that
  only stores changes nothing — rebuild the engine as `model:set` does.
- **The host stamps the message uuid.** The CLI **never echoes the prompt back**
  — the only `type: 'user'` messages on the stream are **tool results** — so
  there is nothing to scrape. `engine.ts` must set `uuid` on the outgoing user
  message and keep it (assert with `getSessionMessages`). An earlier version of
  the spike's own arm scraped the stream and was addressing a **tool_result**.
- **The app's wholesale `options.env` replacement does NOT drop the flag.** A
  real collision hypothesis — **tested and refuted**. No env plumbing.
- **Rewind restores FILES, not the conversation.** It does **not** reopen #123's
  refill decision, and the UI must not imply otherwise.
- **`rewind_files` errors must not throw out of a main-process handler** —
  Electron turns that into a modal dialog over the app.
- Unmeasured, worth measuring in #129: behaviour on a **resumed** session (the
  SDK's own source carries a caveat for the store-backed case), and the runtime
  cost of checkpointing.

## Landmines this batch keeps paying for

- **UNSCORED IS NOT REFUTED**, now hit from six sides: #122's clipboard spike,
  #124's three instrument traps, #125's own verification harness, #126's halo
  control, and #127's two false positives.
- **A CONTROL CATCHES FALSE POSITIVES TOO — #127's two saves were both.** Task
  backgrounding first scored EFFECTIVE off a 37s speed-up whose real cause was
  that **this machine's harness blocks standalone `sleep`**, so the arm was
  measuring a hook. Session detach first scored SURVIVED off a proof file written
  *before* the cut and a witness watching **the newest transcript anywhere on the
  machine**. **Use a node timer, never `sleep`**; assert the control **actually
  blocked**; check the artefact **before** the cut (present → UNSCORED); scope any
  on-disk witness to the session id; use **absolute paths** in probe prompts.
- **THE THREE-WAY SUBTYPE COMPARISON, reusable verbatim and free.** On one warm
  handle: bogus subtype → `Unsupported control request subtype: …`; the
  candidate; the candidate with bad arguments. A **different** error means the
  dispatcher recognised the subtype and reached its own validator.
- **Probe by CALLING.** A declared wire type is not a callable route (#115); a
  callable route is not an effective one (#117); **a negative claim needs
  negative-shaped evidence** (#127).
- **An instrument that fails its own setup reports it as the phenomenon.** Take
  the verdict from the **parsed result**, never the exit code — #125's runner
  produced three confident false REDs that way. **Any probe that installs
  something must read the installation back.**
- **The acrylic exception is #125's and it is ONE PANE.** `.model-menu`,
  `.command-popover`, `.file-popover` and the Appearance dock stay flat.
  Generalising it is an **open owner call**; `gui-98` criterion 5c and
  `tests/subagent-material.test.ts` both red if you take it. `gui-98` criterion 5
  is **positive** — do not soften it back.
- **An SVG length is in viewBox units, not CSS pixels** (#126), and **the tint
  ladder cannot carry a structural line**.
- **Screenshots need the zoom factor** — normalise with `setZoomFactor(1)` before
  any pixel measurement. **`getComputedStyle(el, '::pseudo')` does not read that
  pseudo-element** in Chromium; a pixel probe needs a positive control.
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
- **jsdom loads no CSS.** A raw-text pin proves a rule was written, never that it
  works.

## Still-live landmines from earlier legs

- **`canUseTool` is NOT a control surface** (#116) — deny with `disallowedTools`.
- **`setBackgroundMaterial` has NO runtime whitelist** — `src/shared/backdrop.ts`'s
  compare-never-coerce guard is the only one. `src/shared/effort.ts` is the same
  pattern, except it REJECTS rather than defaulting.
- **ESM freezes every JS seam a driver might patch** — `sdk.query` cannot be
  monkey-patched and neither can `child_process.spawn`. The route that works is
  the OS: read the child's command line via `Win32_Process`. **`ConvertTo-Json`
  over `Win32_Process` is not safe** — read tab-delimited lines with
  `[\x00-\x1F]` stripped.
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
- **`issue_dependencies_summary` is EVENTUALLY CONSISTENT** — read the
  `blocked_by` **list endpoint**, or read twice, if an edge was just written.
- **A version bump here touches TWO files** — `package-lock.json` is tracked and
  mirrors the version in two places. `npm version <v> --no-git-tag-version`.

## Do not decide these

Four open owner-calls live in `.claude/vibe.md` under `## Needs you`. **#128
added none and resolved none** — a version bump has no calls in it. The count
stands at four.

**The live one is #127's:** whether the app may offer **Remote Control**. It is
the only measured route that could mean "the CLI keeps working while this UI
detaches", it is **reachable**, and it was probed with `enabled: false` **only**
— enabling it bridges a live session to an external service, which is
outward-facing, so no leg exercised it. Nothing was enabled and nothing built.

**New since #128, and not a decision anyone took:** the repo now reads 1.0.0
while nothing publishes. If that should mean something — a tag, an installer, a
version readout — each is its own ticket with its own warrant.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[happy-path]]
- [[2026-08-06-one-point-oh-is-a-marker-and-the-lockfile-moves-with-it]]
- [[2026-08-06-the-address-is-carried-and-ignored-and-the-rewind-was-one-flag-away]]
